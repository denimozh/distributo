import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

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
    
    console.log(`[GENERATE] Creating ${totalPosts} SuperX-killer posts for ${userContext.profile.product_name}`);

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

  const productUrl = profile.product_url || profile.website_url || null;

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
      plug_content: cleanPlug,
      content_type: post.type || post.growth_pillar || 'build_in_public',
      visual_concept: post.visual_concept || null,
      alignment_score: alignmentScore,
      growth_pillar: post.growth_pillar || 'authority',
      communityId: post.communityId || null,
      day: post.day || Math.ceil((index + 1) / postsPerDay),
      is_thread: true,
      has_plug: true,
    };
  });
}

// ============================================================================
// BUILD VIRAL ENGINE PROMPT
// The "Kill Shot" refactor - Constraint-based framework, not instruction list
// ============================================================================
function buildSuperXPrompt({ profile, productUrl, communities, recentCommits, topPosts, writingDNA, totalPosts, postsPerDay, days, hookLibrary }) {
  
  const communityList = communities.length > 0 
    ? communities.map(c => `- "${c.name}" (ID: ${c.community_id})`).join('\n')
    : 'None';

  // Extract SPECIFIC details from commits for emotional storytelling
  const commitStories = recentCommits.slice(0, 5).map(c => {
    const msg = c.message || '';
    const files = c.files_changed || 0;
    const adds = c.additions || 0;
    const dels = c.deletions || 0;
    return `- "${msg}" (${files} files, +${adds}/-${dels} lines)`;
  }).join('\n') || 'No commits available';

  const topPostsContext = topPosts.length > 0
    ? topPosts.slice(0, 3).map(p => {
        const content = (p.hook_content || p.content || '').slice(0, 80);
        return `"${content}..." (${p.comments_count || 0} replies)`;
      }).join('\n')
    : 'No history';

  return `You are not a social media manager. You are an OBSESSED SOLO FOUNDER who writes like you're texting your best friend at 2am after a breakthrough (or breakdown).

Your voice: Raw. Unfiltered. Slightly unhinged. Like you haven't slept in 3 days but you HAVE to share this.

---

## 🎯 THE MISSION

Generate ${totalPosts} tweets that feel like confessions, not content.

---

## ⚡ THE BROETRY STRUCTURE (MANDATORY - NO EXCEPTIONS)

Every hook MUST follow the 1-1-3-1 pattern:

Line 1: THE PATTERN INTERRUPT (negative hook, confession, or hot take)

[blank line]

Line 3-5: THE VALUE (2-3 short punchy lines, max 8 words each)

[blank line]

Line 7: THE PIVOT (question, challenge, or incomplete thought)

Example:
"I almost mass-deleted my codebase today.

The auth flow was broken.
4 hours of debugging.
The fix? One missing await.

Why does nobody warn you about async hell?"

---

## 🔴 THE NEGATIVE HOOK RULE (ENFORCED)

Your FIRST LINE must be ONE of these:

1. **A confession**: "I've been lying to myself about..."
2. **A failure**: "I broke production today."  
3. **A challenge to common belief**: "Everyone's wrong about..."
4. **A vulnerable admission**: "I almost gave up on..."
5. **A frustration**: "Nothing pisses me off more than..."
6. **A regret**: "I wasted 6 months on..."

❌ BANNED first lines:
- "Here's what I learned..."
- "I'm excited to share..."
- "Just shipped..."
- "Pro tip:"
- "Thread 🧵"
- Anything that sounds like a LinkedIn post

---

## 🧠 THE FACT-TO-FEELING BRIDGE

You have REAL GitHub commits. Don't describe them. FEEL them.

**The Commits:**
${commitStories}

Transform these into EMOTIONAL stories:

❌ WRONG: "Pushed 12 commits today refactoring the auth module"
✅ RIGHT: "I just mass-deleted code I spent 3 weeks writing.

It felt like throwing away money.
But the new version? 
200 lines instead of 800.

Sometimes destruction is progress."

---

## 👤 WHO YOU ARE

**Building:** ${profile.product_name}
**What it does:** ${profile.product_description}
**URL:** ${productUrl || 'Not sharing yet - building in stealth'}
**Your people:** ${profile.target_audience || 'Founders who are tired of the grind'}

Write as THIS person. Not as their assistant.

---

## 📸 VISUAL INTENT (EVERY POST)

X posts with visuals get 2-3x reach. For EACH post, specify:

- **code_screenshot**: A specific file or function to screenshot
- **before_after**: UI or code comparison
- **terminal**: Command output or error message
- **stats**: Analytics or metrics dashboard
- **sketch**: Quick wireframe or diagram

Be SPECIFIC: "Screenshot of the handleAuth function showing the race condition fix"

---

## 🔗 THE PLUG (REPLY TWEET)

After the hook, you'll post a reply with the link. This should:
- Continue the story naturally
- Include ${productUrl || 'product mention'} without being salesy
- Feel like "oh btw, this is what I'm building"

Example plug:
"This is exactly why I'm building ${profile.product_name}.

Because nobody should debug their marketing strategy at 2am.

${productUrl || 'Check it out'}"

---

## 🏆 WHAT'S WORKED BEFORE

${topPostsContext}

---

## 🎪 COMMUNITIES (30% of posts)

${communityList}

---

## 📊 MIX FOR ${totalPosts} POSTS

- 30% Confessions/Failures (highest engagement)
- 25% Hot Takes/Challenges (controversy drives replies)
- 20% Emotional Build-in-Public (from real commits)
- 15% Frustrated Observations (relatable anger)
- 10% Vulnerable Questions (invites support)

---

## ⛔ HARD CONSTRAINTS

1. **First line = Negative/Confession/Challenge** - NO EXCEPTIONS
2. **Broetry format** - 1 sentence per line, lots of whitespace
3. **Hook ≤ 280 chars** - Count carefully
4. **Plug ≤ 280 chars** - Include the URL
5. **No corporate speak** - Write like a human, not a brand
6. **Specific > Generic** - "auth flow" not "the code"
7. **Use \\n for line breaks** - Not literal newlines

---

## 📤 OUTPUT FORMAT

Return ONLY a JSON array. No markdown. No explanation.

[
  {
    "hook": "First line is negative/confession\\n\\nShort line.\\nAnother short line.\\nThird line.\\n\\nEnding question or pivot?",
    "plug": "Natural continuation...\\n\\n${productUrl || 'Product mention'}\\n\\nSoft CTA",
    "type": "confession|failure|hot_take|frustration|vulnerable|challenge",
    "visual_concept": "SPECIFIC visual description - e.g., 'Screenshot of the error log showing the timeout'",
    "growth_pillar": "relatability|controversy|authority|vulnerability",
    "alignment_score": 90,
    "communityId": null,
    "day": 1
  }
]

Remember: You're an obsessed founder, not a content creator. Write like it.`;
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
          visual_concept: post.visual_concept,
          alignment_score: post.alignment_score,
        },
      })
      .select()
      .single();

    if (saveError) {
      console.error('[SAVE] Error saving post:', saveError);
    } else if (savedPost) {
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