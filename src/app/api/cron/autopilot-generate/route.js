import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { createTrackedLink } from '@/lib/short-links';
import { logActivity, normalizePost, buildVoiceBlock, buildInsightsBlock, buildCommunityRule, buildLinkedInModifier, shouldBeSilencePost } from '@/lib/content-core';

// ============================================================================
// AUTOPILOT CONTENT GENERATION CRON
// Runs every 6 hours. Uses FULL intelligence pipeline — same quality as
// batch generation, with learning, writing DNA, and format variety.
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DAYS_AHEAD = 5; // Keep 5 days of content queued

export async function GET(request) {
  console.log('[AUTOPILOT] Starting intelligent autopilot generation...');

  try {
    const { data: autopilotUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, product_name, product_description, target_audience, product_url, autopilot_enabled, autopilot_posts_per_day, autopilot_auto_approve, autopilot_platforms')
      .eq('autopilot_enabled', true);

    if (usersError) {
      console.error('[AUTOPILOT] Error fetching users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!autopilotUsers || autopilotUsers.length === 0) {
      console.log('[AUTOPILOT] No users with autopilot enabled');
      return NextResponse.json({ message: 'No autopilot users', processed: 0 });
    }

    console.log(`[AUTOPILOT] Found ${autopilotUsers.length} autopilot users`);
    const results = [];

    for (const user of autopilotUsers) {
      try {
        const postsPerDay = user.autopilot_posts_per_day || 2;
        const targetQueue = postsPerDay * DAYS_AHEAD; // e.g. 2/day × 5 days = 10 posts needed

        // Count how many future posts already exist
        const { data: queuedPosts, error: queueError } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id)
          .in('status', ['pending', 'scheduled'])
          .gte('scheduled_at', new Date().toISOString());

        if (queueError) {
          console.error(`[AUTOPILOT] Queue check error for ${user.id}:`, queueError);
          continue;
        }

        const queueCount = queuedPosts?.length || 0;
        const postsNeeded = Math.max(0, targetQueue - queueCount);
        
        console.log(`[AUTOPILOT] User ${user.id}: ${queueCount} in queue, target ${targetQueue}, need ${postsNeeded}`);

        if (postsNeeded > 0) {
          console.log(`[AUTOPILOT] Generating ${postsNeeded} posts for ${user.product_name}...`);
          const generated = await generateIntelligentContent(user, postsNeeded);
          results.push({ userId: user.id, productName: user.product_name, queueBefore: queueCount, generated, postsNeeded, status: 'generated' });
        } else {
          console.log(`[AUTOPILOT] Queue full for ${user.product_name} (${queueCount}/${targetQueue})`);
          results.push({ userId: user.id, productName: user.product_name, queueCount, targetQueue, status: 'sufficient' });
        }
      } catch (userError) {
        console.error(`[AUTOPILOT] Error processing user ${user.id}:`, userError);
        results.push({ userId: user.id, status: 'error', error: userError.message });
      }
    }

    return NextResponse.json({ success: true, processed: autopilotUsers.length, results });
  } catch (error) {
    console.error('[AUTOPILOT] Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// GATHER FULL USER CONTEXT (matches batch quality)
// ============================================================================
async function gatherFullContext(user) {
  let recentCommits = [];
  try {
    const { data: commits } = await supabase
      .from('github_commits')
      .select('message, additions, deletions, files_changed, diff_summary, committed_at')
      .eq('user_id', user.id)
      .order('committed_at', { ascending: false })
      .limit(10);
    recentCommits = commits || [];
  } catch (e) {
    console.log('[AUTOPILOT] No commits available');
  }

  let topPosts = [];
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('content, hook_content, plug_content, likes_count, replies_count, impressions_count, engagement_score, metadata')
      .eq('user_id', user.id)
      .eq('status', 'posted')
      .not('engagement_score', 'is', null)
      .order('engagement_score', { ascending: false })
      .limit(10);
    topPosts = posts || [];
  } catch (e) {
    console.log('[AUTOPILOT] No post history');
  }

  let contentInsights = null;
  try {
    const { data: insights } = await supabase
      .from('content_insights')
      .select('*')
      .eq('user_id', user.id)
      .single();
    contentInsights = insights;
  } catch {}

  let communities = [];
  try {
    const { data: userCommunities } = await supabase
      .from('x_communities')
      .select('id, community_id, name')
      .eq('user_id', user.id)
      .eq('is_active', true);
    communities = userCommunities || [];
  } catch {}

  // Detect burnt out mode
  let burntOutMode = false;
  if (recentCommits.length > 0 && recentCommits[0]?.committed_at) {
    const daysSince = (Date.now() - new Date(recentCommits[0].committed_at).getTime()) / (1000 * 60 * 60 * 24);
    burntOutMode = daysSince > 3;
  } else {
    burntOutMode = true;
  }

  const writingDNA = analyzeWritingStyle(topPosts);

  // Fetch user's voice profile and settings
  let styleProfile = null;
  let userSettings = {};
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('style_profile, settings')
      .eq('id', user.id)
      .single();
    styleProfile = profile?.style_profile;
    userSettings = profile?.settings || {};
  } catch {}

  return { recentCommits, topPosts, contentInsights, communities, writingDNA, burntOutMode, styleProfile, userSettings };
}

// ============================================================================
// ANALYZE WRITING STYLE
// ============================================================================
function analyzeWritingStyle(topPosts) {
  if (topPosts.length === 0) {
    return { avgSentenceLength: 'short', usesEmoji: false, tone: 'casual', formatting: 'broetry', signaturePatterns: [] };
  }

  const allContent = topPosts.map(p => p.hook_content || p.content).join(' ');
  const sentences = allContent.split(/[.!?]+/).filter(s => s.trim());
  const avgLength = sentences.length > 0
    ? sentences.reduce((s, sent) => s + sent.trim().split(' ').length, 0) / sentences.length
    : 8;

  const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/u.test(allContent);
  const hasBroetry = (allContent.match(/\n/g) || []).length > sentences.length / 2;

  const patterns = [];
  topPosts.forEach(post => {
    const content = post.hook_content || post.content || '';
    if (content.includes('→')) patterns.push('arrow_list');
    if (/\d+ (things|tips|ways|lessons)/.test(content)) patterns.push('numbered_list');
    if (content.endsWith('?')) patterns.push('question_ender');
  });

  return {
    avgSentenceLength: avgLength < 8 ? 'very_short' : avgLength < 12 ? 'short' : 'medium',
    usesEmoji: hasEmojis,
    tone: 'casual',
    formatting: hasBroetry ? 'broetry' : 'paragraph',
    signaturePatterns: [...new Set(patterns)],
  };
}

// ============================================================================
// CALCULATE ALIGNMENT SCORE
// ============================================================================
function calculateAlignmentScore(hook) {
  let score = 60;
  const firstLine = hook.split('\n')[0] || '';
  const lines = hook.split('\n').filter(l => l.trim());

  const negativePatterns = [
    'I almost', 'I broke', 'I failed', 'I wasted', 'I regret',
    'Everyone\'s wrong', 'Everyone says', 'Nobody tells you',
    'The worst part', 'Confession:', 'I\'ve been lying',
    'Nothing pisses me off', 'I\'m tired of', 'Stop telling me'
  ];
  if (negativePatterns.some(p => firstLine.includes(p))) score += 15;
  if (lines.length >= 4) score += 10;
  const avgLineLength = lines.length > 0 ? lines.reduce((s, l) => s + l.length, 0) / lines.length : 50;
  if (avgLineLength < 50) score += 5;
  if (hook.endsWith('?')) score += 10;
  if (/\d+/.test(hook)) score += 5;
  const emotionalWords = ['hurt', 'scared', 'excited', 'angry', 'frustrated', 'tired', 'obsessed', 'addicted'];
  if (emotionalWords.some(w => hook.toLowerCase().includes(w))) score += 5;
  if (hook.includes('auth') || hook.includes('API') || hook.includes('bug') || hook.includes('code')) score += 5;
  const bannedStarts = ['I\'m excited', 'Just shipped', 'Here\'s what', 'Pro tip', 'Thread'];
  if (bannedStarts.some(p => firstLine.startsWith(p))) score -= 15;
  if (hook.includes('building something') || hook.includes('working on')) score -= 10;
  
  // Only penalize short hooks if they're NOT one-liners or questions
  const isOneLiner = lines.length <= 2 && hook.length < 150;
  const isQuestion = hook.endsWith('?');
  if (hook.length < 80 && !isOneLiner && !isQuestion) score -= 10;
  if (hook.length > 270) score -= 5;

  return Math.min(100, Math.max(0, score));
}

// ============================================================================
// GENERATE INTELLIGENT CONTENT
// ============================================================================
async function generateIntelligentContent(user, postsNeeded = 7) {
  const postsPerDay = user.autopilot_posts_per_day || 2;
  const autoApprove = user.autopilot_auto_approve ?? true;
  const totalPosts = Math.min(postsNeeded, 14); // Cap at 14 per run to stay within token limits

  const ctx = await gatherFullContext(user);

  console.log(`[AUTOPILOT] Context: ${ctx.recentCommits.length} commits, ${ctx.topPosts.length} top posts, insights: ${ctx.contentInsights ? ctx.contentInsights.posts_analyzed + ' analyzed' : 'none'}, burntOut: ${ctx.burntOutMode}`);

  const prompt = buildIntelligentPrompt({
    productName: user.product_name,
    productDescription: user.product_description,
    targetAudience: user.target_audience,
    productUrl: user.product_url || '',
    recentCommits: ctx.recentCommits,
    topPosts: ctx.topPosts,
    contentInsights: ctx.contentInsights,
    writingDNA: ctx.writingDNA,
    burntOutMode: ctx.burntOutMode,
    styleProfile: ctx.styleProfile,
    userSettings: ctx.userSettings,
    totalPosts,
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 15000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  let posts;
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    posts = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (parseError) {
    console.error('[AUTOPILOT] JSON parse error:', parseError.message);
    throw new Error('Failed to parse AI response');
  }

  if (!Array.isArray(posts)) throw new Error('AI response was not an array');

  const scheduleTimes = generateSchedule(totalPosts, postsPerDay, ctx.contentInsights);
  let savedCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const scheduledAt = scheduleTimes[i];
    if (!scheduledAt) continue;

    // Use shared normalizer for consistent scoring + format detection
    const normalized = normalizePost(post);
    if (!normalized.hook) continue;

    // Enforce silence posts (10-15% with no plug)
    const isSilence = shouldBeSilencePost(i, posts.length);
    const finalPlug = isSilence ? null : normalized.plug;

    const cleanHook = normalized.hook.length > 280 ? normalized.hook.slice(0, 275).replace(/\s+\S*$/, '') + '...' : normalized.hook;
    const cleanPlug = finalPlug ? (finalPlug.length > 280 ? finalPlug.slice(0, 275).replace(/\s+\S*$/, '') + '...' : finalPlug) : null;

    let communityUuid = null;
    if (normalized.communityId && ctx.communities.length > 0) {
      const community = ctx.communities.find(c => c.community_id === normalized.communityId);
      communityUuid = community?.id || null;
    }

    const { data: savedPost, error: saveError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: cleanHook,
        hook_content: cleanHook,
        plug_content: cleanPlug,
        platform: 'x',
        status: autoApprove ? 'scheduled' : 'pending',
        scheduled_at: scheduledAt.toISOString(),
        source: 'autopilot',
        is_thread: !!cleanPlug,
        reply_delay: 60,
        community_id: communityUuid,
        metadata: {
          content_type: post.type || 'mixed',
          growth_pillar: post.growth_pillar || 'authority',
          format: normalized.format, // System-detected, not AI self-label
          hook_type: normalized.hookType,
          model_alignment_score: normalized.modelAlignmentScore,
          system_alignment_score: normalized.systemAlignmentScore,
          autopilot_generated: true,
          burnt_out_mode: ctx.burntOutMode,
          is_silence_post: isSilence,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error('[AUTOPILOT] Save error:', saveError);
      await logActivity(user.id, 'error', `Failed to save post: ${saveError.message}`);
      continue;
    }

    // LinkedIn post with platform-specific content
    const platforms = user.autopilot_platforms || ['x'];
    if (platforms.includes('linkedin')) {
      // LinkedIn gets adapted content — more professional, more context
      const linkedinHook = cleanHook.replace(/\n/g, '\n\n'); // Double-space for LinkedIn readability
      const linkedinContent = linkedinHook + (cleanPlug ? '\n\n' + cleanPlug : '');
      
      await supabase.from('posts').insert({
        user_id: user.id,
        content: linkedinContent,
        hook_content: cleanHook,
        plug_content: cleanPlug,
        first_comment_content: cleanPlug,
        first_comment_delay_seconds: 45,
        platform: 'linkedin',
        status: autoApprove ? 'scheduled' : 'pending',
        scheduled_at: new Date(scheduledAt.getTime() + 30 * 60000).toISOString(),
        source: 'autopilot',
        metadata: {
          content_type: post.type || 'mixed',
          format: normalized.format,
          hook_type: normalized.hookType,
          autopilot_generated: true,
          system_alignment_score: normalized.systemAlignmentScore,
        },
      }).select().single().catch(e => console.error('[AUTOPILOT] LinkedIn save error:', e.message));
    }

    // Create tracked link for plug URL
    if (savedPost && cleanPlug) {
      const urlMatch = cleanPlug.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        try {
          const trackedUrl = await createTrackedLink(urlMatch[0], savedPost.id, user.id);
          if (trackedUrl && trackedUrl !== urlMatch[0]) {
            const updatedPlug = cleanPlug.replace(urlMatch[0], trackedUrl);
            await supabase.from('posts').update({ plug_content: updatedPlug }).eq('id', savedPost.id);
          }
        } catch (e) {
          console.error('[AUTOPILOT] Tracked link error:', e.message);
        }
      }
    }

    savedCount++;
  }

  // Log activity — the machine is visible
  const platformsList = (user.autopilot_platforms || ['x']).join(' + ');
  await logActivity(user.id, 'generate', `Generated ${savedCount} posts for ${platformsList}${ctx.burntOutMode ? ' (burnt-out mode)' : ''}`, {
    platform: 'x',
    metadata: { count: savedCount, burntOut: ctx.burntOutMode },
  });

  console.log(`[AUTOPILOT] Generated ${savedCount} intelligent posts for ${user.product_name}`);
  return savedCount;
}

// ============================================================================
// BUILD INTELLIGENT PROMPT
// ============================================================================
function buildIntelligentPrompt({ productName, productDescription, targetAudience, productUrl, recentCommits, topPosts, contentInsights, writingDNA, burntOutMode, styleProfile, userSettings, totalPosts }) {

  const commitStories = recentCommits.slice(0, 5).map(c => {
    return `- "${c.message || ''}" (${c.files_changed || 0} files, +${c.additions || 0}/-${c.deletions || 0})`;
  }).join('\n') || 'No recent commits — user is heads-down or taking a break';

  const topPostsContext = topPosts.length > 0
    ? topPosts.slice(0, 5).map(p => {
        const content = (p.hook_content || p.content || '').slice(0, 100);
        const score = p.engagement_score ? ` (score: ${Math.round(p.engagement_score)})` : '';
        return `"${content}..."${score}`;
      }).join('\n')
    : 'No history yet';

  let insightsBlock = '';
  if (contentInsights && contentInsights.posts_analyzed >= 5) {
    insightsBlock = `
## WHAT WORKS FOR YOUR AUDIENCE (${contentInsights.posts_analyzed} posts analyzed)
- Best format: ${contentInsights.best_format}
- Best time: ${contentInsights.best_posting_hour}:00 on ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][contentInsights.best_posting_day || 0]}
- Avg impressions: ${contentInsights.avg_impressions} | Avg replies: ${contentInsights.avg_replies}
${contentInsights.top_hook_patterns?.length > 0 ? `- Top hooks: ${contentInsights.top_hook_patterns.slice(0, 3).map(h => `"${h.hook}"`).join(', ')}` : ''}

Generate ~40% of posts in "${contentInsights.best_format}" format. Weight the rest across others.`;
  }

  let styleGuide = 'Casual indie hacker voice. Short sentences.';
  const guides = [];
  if (writingDNA.avgSentenceLength === 'very_short') guides.push('SHORT PUNCHY sentences (5-7 words)');
  if (!writingDNA.usesEmoji) guides.push('Minimal emojis');
  if (writingDNA.signaturePatterns.includes('arrow_list')) guides.push('Use → for lists');
  if (writingDNA.signaturePatterns.includes('question_ender')) guides.push('End with questions sometimes');
  if (guides.length > 0) styleGuide = guides.join('. ') + '.';

  // Voice profile from user's analyzed posts
  let voiceBlock = '';
  if (styleProfile) {
    voiceBlock = `
## YOUR VOICE (analyzed from your past posts)
Tone: ${styleProfile.tone || 'casual'}
Style: ${styleProfile.sentence_style || 'short punchy'}
Formatting: ${styleProfile.formatting_preference || 'mixed'}
${styleProfile.writing_rules?.length ? `Voice rules:\n${styleProfile.writing_rules.map(r => `- ${r}`).join('\n')}` : ''}
${styleProfile.signature_phrases?.length ? `Signature phrases: ${styleProfile.signature_phrases.join(', ')}` : ''}
${styleProfile.personality_traits?.length ? `Personality: ${styleProfile.personality_traits.join(', ')}` : ''}

CRITICAL: Match this voice exactly. The posts should sound like THIS person wrote them, not a generic AI.
`;
  }

  // User preferences
  let prefsBlock = '';
  const tone = userSettings?.defaultTone;
  if (tone && tone !== 'casual') prefsBlock += `Write in a ${tone} tone. `;
  if (userSettings?.includeHashtags === false) prefsBlock += 'NO hashtags. ';
  if (userSettings?.includeEmojis === false) prefsBlock += 'NO emojis at all. ';

  const burntOutBlock = burntOutMode ? `
## BURNT OUT MODE — No recent commits detected
Generate content from:
- Reflections on the building journey
- Lessons learned building ${productName}
- Relatable developer/founder struggles
- Evergreen insights about the problem space
- Observational humor about the indie hacker life

FORMAT SHIFT: In burnt-out mode:
- 40% observational/humor (not technical wins)
- 30% question/engagement posts  
- 20% narrative reflections
- 10% mini-lists (lessons learned)
- Reduce plugs to ~60% (more brand-building, less selling)
- NEVER mention being inactive or taking a break
` : '';

  return `You are a solo founder who writes about building in public. Not a content creator — someone who shares what they're building, learning, and struggling with.

Write like texting a friend, not a LinkedIn post. Sometimes excited, sometimes frustrated, sometimes just sharing something interesting.

---

## WHO YOU ARE
Building: ${productName}
What it does: ${productDescription}
URL: ${productUrl || 'Not shared publicly yet'}
Audience: ${targetAudience || 'Developers and indie hackers'}

## YOUR STYLE
${styleGuide}
${voiceBlock}
${prefsBlock ? `## USER PREFERENCES\n${prefsBlock}` : ''}
${buildCommunityRule()}
${buildLinkedInModifier()}

## SILENCE POSTS
~10-15% of posts should have NO plug, NO CTA. Just the hook. These build trust and improve downstream reach. Mark these with "plug": "" in your output.

---

## EXAMPLES (match ENERGY, never copy)
1. "The auth bug that took 4 hours was a missing await. I'm going to bed."
2. "Someone asked how I market my SaaS. I showed them my git log."
3. "94 users. 3 paying. 1 churned because I didn't have dark mode."
4. "Shipped the LinkedIn integration. Immediately broke the X integration."
5. "6 months of building. 0 revenue. But 12 people DMed me saying they can't live without it."
6. "Every time I say 'this will take 30 minutes' multiply by 6."
7. "Today I mass-deleted a feature I spent 3 weeks building. The product is better now."
8. "Asked 10 users what feature they wanted most. 8 said 'make it faster.'"

---

## FORMAT VARIETY (CRITICAL — vary every post)
**Broetry (30%)** — 1 sentence per line, whitespace between
**One-liner (20%)** — Single punch, max 140 chars
**Narrative (20%)** — 2-3 short paragraphs, micro-story
**Question (15%)** — Opens with genuine question
**Mini-list (15%)** — 3-5 items with setup

## HOOK VARIETY (NOT all negative)
~35% Negative/vulnerable | ~25% Observational | ~25% Technical wins | ~15% Casual/humor

---

## RECENT COMMITS
${commitStories}
${burntOutBlock}
## BEST PERFORMING CONTENT
${topPostsContext}
${insightsBlock}

---

## THE PLUG (~80% get one, ~20% pure brand-building)
Plug styles: Direct URL drop | Soft mention | Value plug | Social proof | Story continuation

## RULES
1. Hook ≤ 280 chars. Plug ≤ 280 chars.
2. Use \\n for line breaks.
3. No hashtags. No corporate speak. Write like a human.
4. Be specific: "auth flow" not "the code"
5. Max 1-2 emojis, many posts zero.
6. VARY format — never same format twice in a row.
7. These auto-post — must be HIGH QUALITY.

---

## OUTPUT — ONLY a JSON array:
[
  {
    "hook": "Tweet with \\n for breaks",
    "plug": "Reply with ${productUrl || 'link'}\\n\\nSoft CTA",
    "type": "confession|observation|technical|question|humor|story",
    "format": "broetry|one_liner|narrative|question|mini_list",
    "growth_pillar": "relatability|authority|vulnerability|humor",
    "has_plug": true
  }
]

Generate exactly ${totalPosts} posts. Each must feel different — same voice, different energy.`;
}

// ============================================================================
// SCHEDULE — uses learned optimal timing
// ============================================================================
function generateSchedule(totalPosts, postsPerDay, contentInsights) {
  const times = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(startDate.getHours() + 2);

  let optimalHours = [9, 12, 15, 18, 20];
  if (contentInsights?.best_posting_hour !== undefined) {
    const best = contentInsights.best_posting_hour;
    optimalHours = [
      Math.max(8, best - 3),
      best,
      Math.min(21, best + 3),
      Math.min(21, best + 6),
      Math.min(22, best + 8),
    ].filter((h, i, arr) => arr.indexOf(h) === i);
  }

  let dayOffset = 0;
  while (times.length < totalPosts) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + dayOffset);
    const postsToday = Math.min(postsPerDay, totalPosts - times.length);
    for (let i = 0; i < postsToday; i++) {
      const postTime = new Date(dayDate);
      postTime.setHours(optimalHours[i % optimalHours.length], Math.floor(Math.random() * 30), 0, 0);
      if (postTime > now) times.push(postTime);
    }
    dayOffset++;
    if (dayOffset > 30) break;
  }

  return times.sort((a, b) => a - b);
}