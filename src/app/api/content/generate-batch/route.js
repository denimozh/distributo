import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/rate-limit';
import { createTrackedLink } from '@/lib/short-links';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// X ALGORITHM WEIGHTS (2026 Updated - from xai-org/x-algorithm Phoenix)
// ============================================================================
const ALGORITHM_WEIGHTS = {
  // REPLIES ARE KING
  reply: 13.5,
  reply_with_author_response: 75,
  
  // RETWEETS ARE HIGHLY VALUABLE (Updated 2026 - previously undervalued)
  retweet: 20.0,  // Significantly higher than previously thought
  quote: 10.0,
  
  // Other signals
  favorite: 0.5,  // Likes are basically worthless
  profile_click_engaged: 12.0,
  click_into_conversation: 11.0,
  dwell_time_2min: 10.0,
  bookmark: 15.0,  // Bookmarks are huge for X
  video_watch_50pct: 8.0,  // Video is critical now
  follow: 3.0,
  
  // NEGATIVE signals
  not_interested: -74,
  block: -74,
  mute: -50,
  report: -369,
};

// ============================================================================
// PSYCHOLOGICAL HOOK LIBRARY
// Proven frameworks that drive engagement
// ============================================================================
const HOOK_LIBRARY = {
  contrarian: {
    name: 'The Contrarian',
    template: 'Everyone says [X], but after [experience], I realized [Y] is the truth.',
    example: 'Everyone says "just ship it." But after launching 4 failed products, I realized shipping fast is how you fail fast.',
    replyPotential: 0.95,
    retweetPotential: 0.7,
  },
  transparency: {
    name: 'The Transparency',
    template: '[Negative metric] this week. It hurt. Here is exactly how we\'re fixing it.',
    example: 'Our churn hit 8% this month. It hurt. Here\'s exactly what went wrong and how we\'re fixing it.',
    replyPotential: 0.9,
    retweetPotential: 0.5,
  },
  value_list: {
    name: 'The Value-First List',
    template: 'I\'ve spent [time] on [topic]. Here are the [N] things that actually matter.',
    example: 'I\'ve spent 500 hours on SEO. Here are the 3 things that actually matter (and the 10 that don\'t).',
    replyPotential: 0.7,
    retweetPotential: 0.85,
    bookmarkPotential: 0.9,
  },
  negative_hook: {
    name: 'The Negative Hook',
    template: '[Failure/mistake/regret]. Here\'s what I learned.',
    example: 'I wasted 6 months building a feature nobody wanted. Here\'s the $0 survey that would have saved me.',
    replyPotential: 0.85,
    retweetPotential: 0.6,
  },
  question_hook: {
    name: 'The Provocative Question',
    template: '[Question that divides opinion]? I\'ll go first: [your answer]',
    example: 'What\'s more important for a startup: great product or great marketing? I\'ll go first: marketing. Fight me.',
    replyPotential: 0.95,
    retweetPotential: 0.4,
  },
  confession: {
    name: 'The Confession',
    template: 'Confession: [something most people hide]. And here\'s why I\'m okay with it.',
    example: 'Confession: I check my analytics 20+ times a day. And here\'s why I\'m NOT trying to stop.',
    replyPotential: 0.85,
    retweetPotential: 0.5,
  },
  myth_buster: {
    name: 'The Myth Buster',
    template: 'The [topic] advice that\'s actually hurting you:',
    example: 'The "growth hacking" advice that\'s actually killing your startup:',
    replyPotential: 0.8,
    retweetPotential: 0.75,
  },
  personal_data: {
    name: 'The Personal Data',
    template: 'I tracked [metric] for [time]. The data surprised me.',
    example: 'I tracked every minute of my workday for 30 days. The data surprised me: I only code 2.5 hours/day.',
    replyPotential: 0.7,
    retweetPotential: 0.8,
    bookmarkPotential: 0.85,
  },
};

// ============================================================================
// MAIN API HANDLER
// ============================================================================
export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      postsPerDay = 5, 
      days = 7,
      platforms = ['x'], 
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Rate limit: 3 generations per minute
    const limit = rateLimit(`generate:${userId}`, 3, 60000);
    if (limit.limited) {
      return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    // ========================================
    // STEP 1: GATHER DEEP USER CONTEXT
    // ========================================
    const userContext = await gatherUserContext(userId);
    
    if (!userContext.profile.product_name || !userContext.profile.product_description) {
      return NextResponse.json({ 
        error: 'Product details required. Please complete onboarding.',
        needsOnboarding: true 
      }, { status: 400 });
    }

    const totalPosts = postsPerDay * days;
    
    // Get content intelligence if available
    let contentInsights = null;
    try {
      const { data: insights } = await supabase
        .from('content_insights')
        .select('*')
        .eq('user_id', userId)
        .single();
      contentInsights = insights;
    } catch {}
    
    console.log(`[GENERATE] Creating ${totalPosts} posts for ${userContext.profile.product_name}${contentInsights ? ` (with ${contentInsights.posts_analyzed} posts of intelligence)` : ''}`);

    // ========================================
    // STEP 2: GENERATE OPTIMIZED CONTENT
    // ========================================
    const generatedPosts = await generateSuperXKillerContent({
      userContext,
      postsPerDay,
      days,
      totalPosts,
    });

    console.log(`[GENERATE] AI generated ${generatedPosts.length} psychological hook posts`);

    // ========================================
    // STEP 3: SCHEDULE AND SAVE POSTS
    // ========================================
    const scheduleTimes = generateOptimalSchedule(postsPerDay, days);
    const savedPosts = await savePosts(userId, generatedPosts, scheduleTimes, userContext.communities);

    return NextResponse.json({
      success: true,
      generated: savedPosts.length,
      posts: savedPosts,
      schedule: {
        postsPerDay,
        days,
        totalPosts: savedPosts.length,
        communitiesUsed: userContext.communities.length,
      },
      algorithmOptimization: {
        hookPatterns: Object.keys(HOOK_LIBRARY),
        plugPattern: 'Link in reply (3-5x reach)',
        visualConcepts: generatedPosts.filter(p => p.visual_concept).length,
        avgAlignmentScore: Math.round(generatedPosts.reduce((s, p) => s + (p.alignment_score || 85), 0) / generatedPosts.length),
      }
    });

  } catch (error) {
    console.error('[GENERATE] Content factory error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// ============================================================================
// GATHER DEEP USER CONTEXT
// ============================================================================
async function gatherUserContext(userId) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  // Get user's X communities
  let communities = [];
  try {
    const { data: userCommunities } = await supabase
      .from('x_communities')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);
    communities = userCommunities || [];
  } catch (e) {
    console.log('[CONTEXT] x_communities not available');
  }

  // Get user's recent GitHub activity
  let recentCommits = [];
  try {
    const { data: commits } = await supabase
      .from('github_commits')
      .select('*')
      .eq('user_id', userId)
      .order('committed_at', { ascending: false })
      .limit(10);
    recentCommits = commits || [];
  } catch (e) {
    console.log('[CONTEXT] github_commits not available');
  }

  // Get past successful posts
  let topPosts = [];
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('content, hook_content, plug_content, likes_count, comments_count, impressions_count')
      .eq('user_id', userId)
      .eq('status', 'posted')
      .order('comments_count', { ascending: false }) // Prioritize replies over likes
      .limit(10);
    topPosts = posts || [];
  } catch (e) {
    console.log('[CONTEXT] No post history');
  }

  // Get user's writing style from top posts
  const writingDNA = analyzeWritingStyle(topPosts);

  const productUrl = profile.product_url || null;

  return {
    profile,
    communities,
    recentCommits,
    topPosts,
    productUrl,
    writingDNA,
  };
}

// ============================================================================
// ANALYZE WRITING STYLE (Writing DNA)
// Extract patterns from user's best performing content
// ============================================================================
function analyzeWritingStyle(topPosts) {
  if (topPosts.length === 0) {
    return {
      avgSentenceLength: 'short',
      usesEmoji: true,
      tone: 'casual',
      formatting: 'broetry', // 1 sentence per line
      signaturePatterns: [],
    };
  }

  const allContent = topPosts.map(p => p.hook_content || p.content).join(' ');
  
  // Analyze patterns
  const sentences = allContent.split(/[.!?]+/);
  const avgLength = sentences.reduce((s, sent) => s + sent.trim().split(' ').length, 0) / sentences.length;
  
  const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/u.test(allContent);
  const hasBroetry = (allContent.match(/\n/g) || []).length > sentences.length / 2;
  
  return {
    avgSentenceLength: avgLength < 8 ? 'very_short' : avgLength < 12 ? 'short' : 'medium',
    usesEmoji: hasEmojis,
    tone: 'casual',
    formatting: hasBroetry ? 'broetry' : 'paragraph',
    signaturePatterns: extractSignaturePatterns(topPosts),
  };
}

// ============================================================================
// EXTRACT SIGNATURE PATTERNS
// Find unique patterns that work for this user
// ============================================================================
function extractSignaturePatterns(topPosts) {
  const patterns = [];
  
  topPosts.forEach(post => {
    const content = post.hook_content || post.content || '';
    
    // Check for common opener patterns
    if (content.startsWith('Hot take:')) patterns.push('hot_take_opener');
    if (content.startsWith('Unpopular opinion:')) patterns.push('unpopular_opinion');
    if (content.includes('Here\'s what')) patterns.push('heres_what');
    if (content.includes('→')) patterns.push('arrow_list');
    if (content.match(/\d+ (things|tips|ways|lessons)/)) patterns.push('numbered_list');
    if (content.endsWith('?')) patterns.push('question_ender');
    if (content.includes('🧵')) patterns.push('thread_indicator');
  });
  
  return [...new Set(patterns)];
}

// ============================================================================
// GENERATE SUPERX-KILLER CONTENT
// The strategic refactor that beats the competition
// ============================================================================
async function generateSuperXKillerContent({ userContext, postsPerDay, days, totalPosts }) {
  const { profile, communities, recentCommits, topPosts, productUrl, writingDNA } = userContext;

  const prompt = buildSuperXPrompt({
    profile,
    productUrl,
    communities,
    recentCommits,
    topPosts,
    writingDNA,
    totalPosts,
    postsPerDay,
    days,
    hookLibrary: HOOK_LIBRARY,
    contentInsights: null, // Will be passed from caller
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 20000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  
  // Robust JSON parsing
  let posts;
  try {
    // Try to find JSON array in response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // Try parsing the whole response
      posts = JSON.parse(text);
    } else {
      posts = JSON.parse(jsonMatch[0]);
    }
  } catch (parseError) {
    console.error('[GENERATE] JSON parse error:', parseError.message);
    console.error('[GENERATE] Raw response:', text.slice(0, 500));
    throw new Error('Failed to parse AI response - invalid JSON');
  }

  if (!Array.isArray(posts)) {
    throw new Error('AI response was not an array');
  }
  
  // Validate and clean posts
  return posts.map((post, index) => {
    // Convert escaped newlines
    const hook = (post.hook || post.hook_post || '').replace(/\\n/g, '\n').trim();
    const plug = (post.plug || post.threaded_reply || '').replace(/\\n/g, '\n').trim();
    
    // Validate hook length (accounting for URL counting as 23 chars)
    let cleanHook = hook;
    if (hook.length > 280) {
      cleanHook = truncateAtBreak(hook, 275) + '...';
    }
    
    // Validate plug length
    let cleanPlug = plug;
    if (plug.length > 280) {
      cleanPlug = truncateAtBreak(plug, 275) + '...';
    }
    
    // Calculate alignment score based on hook pattern match
    const alignmentScore = calculateAlignmentScore(cleanHook, post.growth_pillar);
    
    return {
      hook_content: cleanHook,
      plug_content: post.has_plug === false ? null : cleanPlug,
      content_type: post.type || post.growth_pillar || 'build_in_public',
      visual_concept: null,
      alignment_score: alignmentScore,
      growth_pillar: post.growth_pillar || 'authority',
      communityId: post.communityId || null,
      day: post.day || Math.ceil((index + 1) / postsPerDay),
      is_thread: post.has_plug !== false,
      has_plug: post.has_plug !== false,
      metadata_format: post.format || 'mixed',
    };
  });
}

// ============================================================================
// BUILD VIRAL ENGINE PROMPT
// The "Kill Shot" refactor - Constraint-based framework, not instruction list
// ============================================================================
function buildSuperXPrompt({ profile, productUrl, communities, recentCommits, topPosts, writingDNA, totalPosts, postsPerDay, days, hookLibrary, contentInsights }) {
  
  const communityList = communities.length > 0 
    ? communities.map(c => `- "${c.name}" (ID: ${c.community_id})`).join('\n')
    : 'None';

  const commitStories = recentCommits.slice(0, 5).map(c => {
    const msg = c.message || '';
    const files = c.files_changed || 0;
    const adds = c.additions || 0;
    const dels = c.deletions || 0;
    return `- "${msg}" (${files} files, +${adds}/-${dels} lines)`;
  }).join('\n') || 'No commits available';

  const topPostsContext = topPosts.length > 0
    ? topPosts.slice(0, 3).map(p => {
        const content = (p.hook_content || p.content || '').slice(0, 100);
        return `"${content}..." (${p.comments_count || 0} replies)`;
      }).join('\n')
    : 'No history';

  const insightsBlock = contentInsights && contentInsights.posts_analyzed >= 5 ? `
## WHAT WORKS FOR YOUR AUDIENCE (${contentInsights.posts_analyzed} posts analyzed)
- Best format: ${contentInsights.best_format}
- Best posting time: ${contentInsights.best_posting_hour}:00
- Top hooks: ${(contentInsights.top_hook_patterns || []).slice(0, 3).map(h => `"${h.hook}"`).join(', ')}
- Avg impressions: ${contentInsights.avg_impressions}
Generate ~40% of posts in ${contentInsights.best_format} format. Weight the rest across other formats.
` : '';

  return `You are a solo founder who writes about building in public. You're not a content creator — you're someone who happens to share what they're building, learning, and struggling with.

Your writing should feel like a text to a friend, not a LinkedIn post. Sometimes you're excited, sometimes frustrated, sometimes just sharing something interesting. You're a real person with range.

---

## WHO YOU ARE

Building: ${profile.product_name}
What it does: ${profile.product_description}
URL: ${productUrl || 'Not shared publicly yet'}
Audience: ${profile.target_audience || 'Developers and indie hackers'}

---

## REAL EXAMPLES OF GREAT INDIE HACKER TWEETS

Study these. Match the ENERGY, not the structure. Never copy.

1. "The auth bug that took 4 hours was a missing await. I'm going to bed."
2. "Someone asked how I market my SaaS. I showed them my git log."
3. "94 users. 3 paying. 1 churned because I didn't have dark mode. Priorities."
4. "Shipped the LinkedIn integration. Immediately broke the X integration. Classic."
5. "My girlfriend asked what I do all day. I showed her my Supabase dashboard. She said 'that's a lot of green.'"
6. "6 months of building. 0 revenue. But 12 people DMed me saying they can't live without it. That's enough for now."
7. "The moment you realize your 'quick fix' touched 47 files"
8. "Accidentally pushed to prod at 11pm. Fixed it by midnight. Nobody noticed. Best deployment ever."
9. "I used to think marketing was optional for good products. Then I built a good product."
10. "Every time I say 'this will take 30 minutes' multiply by 6. That's the real estimate."
11. "Refactored my entire auth flow. Went from 800 lines to 200. Deleted code > written code."
12. "Today I mass-deleted a feature I spent 3 weeks building. The product is better now."
13. "We hit 500 users today. 490 of them came from one Reddit comment."
14. "The best marketing channel I've found? Being genuine about the struggle."
15. "Asked 10 users what feature they wanted most. 8 said 'make it faster.' Nobody asked for the 3 features I was building."

---

## FORMAT VARIETY (CRITICAL — do NOT use the same format twice in a row)

Pick the best format for each post's content:

**Broetry (30%)** — 1 sentence per line, whitespace between sections
**One-liner (20%)** — Single punchy sentence, max 140 chars. The tweet IS the punchline.
**Narrative (20%)** — 2-3 short paragraphs telling a micro-story
**Question (15%)** — Opens with a genuine question, may add your take
**Mini-list (15%)** — 3-5 short items with a setup line

---

## HOOK VARIETY (do NOT start every post negatively)

~40% Negative/vulnerable: confessions, failures, frustrations
~25% Observational: funny, relatable truths about building
~20% Technical wins: shipped something, learned something, specific insight  
~15% Casual/human: random thoughts, humor, no agenda

---

## YOUR RECENT COMMITS (use these for authentic stories)

${commitStories}

Transform commits into human stories. Don't describe the code. Tell what it FELT like.

---

## WHAT'S WORKED BEFORE

${topPostsContext}

${insightsBlock}

---

## THE PLUG (reply tweet — NOT every post needs one)

~85% of posts get a plug reply. ~15% should be pure brand-building with NO product mention.

5 plug styles (vary these):
1. **Direct drop**: Just the URL, nothing else
2. **Soft mention**: "Building something for this → ${productUrl || 'link'}"
3. **Value plug**: "I wrote about this in detail: ${productUrl || 'link'}"  
4. **Social proof**: "X devs already using this: ${productUrl || 'link'}"
5. **Story continuation**: Naturally continue the hook's story, mention product organically

---

## COMMUNITIES (30% of posts target these)

${communityList}

---

## HARD RULES

1. Hook ≤ 280 chars. Count carefully.
2. Plug ≤ 280 chars. Include the URL when plugging.
3. Use \\n for line breaks.
4. No hashtags. No "Thread 🧵". No "Here's what I learned".
5. No corporate speak. Write like a human.
6. Be specific: "auth flow" not "the code", "Supabase" not "my database"
7. Max 1-2 emojis per post, only if natural. Many posts should have zero.
8. VARY the format. If post N is broetry, post N+1 must NOT be broetry.
9. Some posts should be SHORT — one-liners are powerful.

---

## OUTPUT

Return ONLY a JSON array. No markdown. No explanation.

[
  {
    "hook": "The tweet content with \\n for line breaks",
    "plug": "Reply content with ${productUrl || 'product link'}\\n\\nSoft CTA",
    "type": "confession|observation|technical|question|humor|story",
    "format": "broetry|one_liner|narrative|question|mini_list",
    "growth_pillar": "relatability|authority|vulnerability|humor",
    "alignment_score": 85,
    "has_plug": true,
    "communityId": null,
    "day": 1
  }
]

Generate ${totalPosts} posts across ${days} days. Make each one feel like a different person wrote it — same voice, different energy.`;
}

// ============================================================================
// BUILD STYLE GUIDE FROM WRITING DNA
// ============================================================================
function buildStyleGuide(writingDNA) {
  const guides = [];
  
  if (writingDNA.avgSentenceLength === 'very_short') {
    guides.push('Write in SHORT, PUNCHY sentences (5-7 words)');
  } else if (writingDNA.avgSentenceLength === 'short') {
    guides.push('Keep sentences concise (8-12 words)');
  }
  
  if (!writingDNA.usesEmoji) {
    guides.push('NO emojis in hooks (maybe 1 in plug max)');
  } else {
    guides.push('Use 1-2 strategic emojis');
  }
  
  if (writingDNA.formatting === 'broetry') {
    guides.push('Use "Broetry" format: 1 sentence per line');
  }
  
  if (writingDNA.signaturePatterns.includes('arrow_list')) {
    guides.push('Use → for lists');
  }
  
  if (writingDNA.signaturePatterns.includes('question_ender')) {
    guides.push('End hooks with questions when possible');
  }
  
  return guides.length > 0 ? guides.join('\n') : 'Casual, authentic indie hacker voice. Short sentences. Broetry format.';
}

// ============================================================================
// CALCULATE ALIGNMENT SCORE
// ============================================================================
function calculateAlignmentScore(hook, growthPillar) {
  let score = 60; // Base score
  
  const firstLine = hook.split('\n')[0] || '';
  const lines = hook.split('\n').filter(l => l.trim());
  
  // NEGATIVE HOOK BONUS (highest value)
  const negativePatterns = [
    'I almost', 'I broke', 'I failed', 'I wasted', 'I regret',
    'Everyone\'s wrong', 'Everyone says', 'Nobody tells you',
    'The worst part', 'Confession:', 'I\'ve been lying',
    'Nothing pisses me off', 'I\'m tired of', 'Stop telling me'
  ];
  if (negativePatterns.some(p => firstLine.includes(p))) score += 15;
  
  // BROETRY STRUCTURE BONUS
  if (lines.length >= 4) score += 10; // Multiple short lines
  const avgLineLength = lines.reduce((s, l) => s + l.length, 0) / lines.length;
  if (avgLineLength < 50) score += 5; // Short punchy lines
  
  // ENGAGEMENT TRIGGERS
  if (hook.endsWith('?')) score += 10; // Questions drive replies
  if (/\d+/.test(hook)) score += 5; // Numbers add credibility
  
  // EMOTIONAL LANGUAGE
  const emotionalWords = ['hurt', 'scared', 'excited', 'angry', 'frustrated', 'tired', 'obsessed', 'addicted'];
  if (emotionalWords.some(w => hook.toLowerCase().includes(w))) score += 5;
  
  // SPECIFICITY BONUS
  if (hook.includes('auth') || hook.includes('API') || hook.includes('bug') || hook.includes('code')) score += 5;
  
  // PENALIZE CORPORATE SPEAK
  const bannedStarts = ['I\'m excited', 'Just shipped', 'Here\'s what', 'Pro tip', 'Thread'];
  if (bannedStarts.some(p => firstLine.startsWith(p))) score -= 15;
  
  // PENALIZE GENERIC CONTENT
  if (hook.includes('building something') || hook.includes('working on')) score -= 10;
  
  // LENGTH CHECKS
  if (hook.length < 80) score -= 10; // Too short
  if (hook.length > 270) score -= 5; // Too close to limit
  
  return Math.min(100, Math.max(0, score));
}

// ============================================================================
// SCHEDULE OPTIMIZATION
// ============================================================================
function generateOptimalSchedule(postsPerDay, days) {
  const times = [];
  const now = new Date();
  
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 0, 0, 0);

  // Optimal posting times
  const optimalHours = [9, 12, 15, 17, 20];
  
  for (let day = 0; day < days; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    
    for (let post = 0; post < postsPerDay; post++) {
      const postTime = new Date(dayDate);
      const hour = optimalHours[post % optimalHours.length];
      postTime.setHours(hour, Math.floor(Math.random() * 15), 0, 0);
      times.push(postTime);
    }
  }
  
  return times;
}

// ============================================================================
// SAVE POSTS TO DATABASE
// ============================================================================
async function savePosts(userId, posts, scheduleTimes, communities) {
  const savedPosts = [];
  
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const scheduledAt = scheduleTimes[i];

    // Find community UUID if communityId provided
    let communityUuid = null;
    if (post.communityId) {
      const community = communities.find(c => c.community_id === post.communityId);
      communityUuid = community?.id || null;
    }

    const { data: savedPost, error: saveError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: post.hook_content,
        hook_content: post.hook_content,
        plug_content: post.plug_content,
        platform: 'x',
        status: 'pending',
        scheduled_at: scheduledAt.toISOString(),
        source: 'ai_batch',
        is_thread: post.is_thread,
        reply_delay: 60,
        community_id: communityUuid,
        metadata: {
          content_type: post.content_type,
          growth_pillar: post.growth_pillar,
          format: post.metadata_format || 'mixed',
          alignment_score: post.alignment_score,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error('[SAVE] Error saving post:', saveError);
    } else if (savedPost) {
      // Create tracked link for the plug if we have a product URL
      const productUrl = post.plug_content?.match(/https?:\/\/[^\s]+/)?.[0];
      if (productUrl && savedPost.id) {
        try {
          const trackedUrl = await createTrackedLink(productUrl, savedPost.id, userId);
          if (trackedUrl && trackedUrl !== productUrl) {
            const updatedPlug = savedPost.plug_content.replace(productUrl, trackedUrl);
            await supabase.from('posts').update({ plug_content: updatedPlug }).eq('id', savedPost.id);
            savedPost.plug_content = updatedPlug;
          }
        } catch (e) {
          console.error('[SAVE] Tracked link error:', e.message);
        }
      }
      savedPosts.push(savedPost);
    }
  }

  return savedPosts;
}

// ============================================================================
// UTILITY: TRUNCATE AT WORD BREAK
// ============================================================================
function truncateAtBreak(text, maxLength) {
  if (text.length <= maxLength) return text;
  
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const lastNewline = truncated.lastIndexOf('\n');
  
  const breakPoint = Math.max(lastSpace, lastNewline);
  
  if (breakPoint > maxLength * 0.7) {
    return truncated.slice(0, breakPoint);
  }
  
  return truncated;
}