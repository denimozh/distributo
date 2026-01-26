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
// X ALGORITHM WEIGHTS (from xai-org/x-algorithm Phoenix scoring)
// These weights determine how the algorithm values different engagements
// ============================================================================
const ALGORITHM_WEIGHTS = {
  // CRITICAL: Replies are the most valuable engagement
  reply: 13.5,                    // 27x more valuable than a like!
  reply_with_author_response: 75, // 150x more valuable than a like!
  
  // Other positive signals
  favorite: 0.5,                  // Likes are actually LOW value
  retweet: 1.0,
  quote: 1.0,
  profile_click_engaged: 12.0,
  click_into_conversation: 11.0,
  dwell_time_2min: 10.0,
  video_watch_50pct: 0.005,
  follow: 3.0,
  
  // DEVASTATING negative signals
  not_interested: -74,
  block: -74,
  mute: -50,
  report: -369,                   // One report can tank your account!
};

// ============================================================================
// CONTENT TYPES WITH ALGORITHM OPTIMIZATION SCORES
// Each type is optimized for different engagement patterns
// ============================================================================
const CONTENT_TYPES = {
  hot_take: {
    name: 'Hot Take',
    description: 'Controversial opinion that sparks debate',
    replyPotential: 0.95,   // Very high reply potential
    riskLevel: 0.3,         // Some risk of negative reactions
    bestFor: 'Maximum reach through controversy',
  },
  pain_solution: {
    name: 'Pain → Solution',
    description: 'Relatable problem with your product as solution',
    replyPotential: 0.7,
    riskLevel: 0.1,
    bestFor: 'Converting followers to customers',
  },
  build_in_public: {
    name: 'Build in Public',
    description: 'Sharing your journey authentically',
    replyPotential: 0.8,
    riskLevel: 0.05,
    bestFor: 'Building trust and community',
  },
  question: {
    name: 'Question/Poll',
    description: 'Engaging question that invites responses',
    replyPotential: 0.9,    // Questions drive replies
    riskLevel: 0.05,
    bestFor: 'Maximizing reply engagement (27x value)',
  },
  story: {
    name: 'Personal Story',
    description: 'Emotional narrative with stakes',
    replyPotential: 0.75,
    riskLevel: 0.05,
    bestFor: 'Dwell time and emotional connection',
  },
  tip: {
    name: 'Quick Tip',
    description: 'Actionable value in one tweet',
    replyPotential: 0.5,
    riskLevel: 0.02,
    bestFor: 'Bookmarks and saves',
  },
  data: {
    name: 'Numbers/Data',
    description: 'Specific results with metrics',
    replyPotential: 0.6,
    riskLevel: 0.1,
    bestFor: 'Credibility and retweets',
  },
  relatable: {
    name: 'Relatable Struggle',
    description: 'Shared experience that resonates',
    replyPotential: 0.85,
    riskLevel: 0.02,
    bestFor: 'Building connection and replies',
  },
  before_after: {
    name: 'Before/After',
    description: 'Transformation story',
    replyPotential: 0.65,
    riskLevel: 0.05,
    bestFor: 'Showing product value',
  },
  simple_truth: {
    name: 'Simple Truth',
    description: 'Distilled wisdom in few lines',
    replyPotential: 0.6,
    riskLevel: 0.02,
    bestFor: 'Shareability',
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
    
    console.log(`[GENERATE] Creating ${totalPosts} algorithm-optimized posts for ${userContext.profile.product_name}`);
    console.log(`[CONTEXT] Landing pages: ${userContext.landingPageContent ? 'Yes' : 'No'}, API docs: ${userContext.apiDocs ? 'Yes' : 'No'}`);

    // ========================================
    // STEP 2: GENERATE ALGORITHM-OPTIMIZED CONTENT
    // ========================================
    const generatedPosts = await generateAlgorithmOptimizedContent({
      userContext,
      postsPerDay,
      days,
      totalPosts,
    });

    console.log(`[GENERATE] AI generated ${generatedPosts.length} hook+plug posts`);

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
        threadingEnabled: true,
        linkProtection: 'Plug Pattern (link in reply)',
        replyOptimized: true,
        avgReplyPotential: calculateAvgReplyPotential(generatedPosts),
      }
    });

  } catch (error) {
    console.error('[GENERATE] Content factory error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// ============================================================================
// GATHER DEEP USER CONTEXT
// Pulls everything we know about the user to generate specific, valuable content
// ============================================================================
async function gatherUserContext(userId) {
  // Get user profile
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

  // Get user's recent GitHub activity (for build-in-public content)
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

  // Get past successful posts (for learning what works)
  let topPosts = [];
  try {
    const { data: posts } = await supabase
      .from('posts')
      .select('content, likes_count, comments_count, impressions_count')
      .eq('user_id', userId)
      .eq('status', 'posted')
      .order('likes_count', { ascending: false })
      .limit(5);
    topPosts = posts || [];
  } catch (e) {
    console.log('[CONTEXT] Could not fetch top posts');
  }

  // Build landing page context if URL provided
  let landingPageContent = null;
  if (profile.product_url || profile.website_url) {
    landingPageContent = await fetchLandingPageContent(profile.product_url || profile.website_url);
  }

  // Build API docs context if available  
  let apiDocs = null;
  if (profile.api_docs_url) {
    apiDocs = await fetchAPIDocsContent(profile.api_docs_url);
  }

  return {
    profile,
    communities,
    recentCommits,
    topPosts,
    landingPageContent,
    apiDocs,
    productUrl: profile.product_url || profile.website_url || null,
  };
}

// ============================================================================
// FETCH LANDING PAGE CONTENT
// Extracts key messaging from user's landing page
// ============================================================================
async function fetchLandingPageContent(url) {
  try {
    // In production, you'd use a scraping service or fetch + cheerio
    // For now, we'll return a placeholder that prompts user to add context
    return {
      url,
      available: true,
      // Add actual scraping logic here
    };
  } catch (e) {
    console.log('[CONTEXT] Could not fetch landing page:', e.message);
    return null;
  }
}

// ============================================================================
// FETCH API DOCS CONTENT
// Extracts technical details for developer-focused content
// ============================================================================
async function fetchAPIDocsContent(url) {
  try {
    return {
      url,
      available: true,
    };
  } catch (e) {
    console.log('[CONTEXT] Could not fetch API docs:', e.message);
    return null;
  }
}

// ============================================================================
// GENERATE ALGORITHM-OPTIMIZED CONTENT
// The heart of the system - generates viral hook+plug content
// ============================================================================
async function generateAlgorithmOptimizedContent({ userContext, postsPerDay, days, totalPosts }) {
  const { profile, communities, recentCommits, topPosts, productUrl } = userContext;

  // Build community context
  const communityList = communities.length > 0 
    ? communities.map(c => `- "${c.name}" (ID: ${c.community_id})`).join('\n')
    : 'None available';

  // Build recent work context from GitHub
  const recentWorkContext = recentCommits.length > 0
    ? recentCommits.slice(0, 5).map(c => `- ${c.message} (${c.repo_name})`).join('\n')
    : 'No recent commits';

  // Build top-performing content context
  const topPostsContext = topPosts.length > 0
    ? topPosts.map(p => `"${p.content?.slice(0, 100)}..." (${p.likes_count || 0} likes, ${p.comments_count || 0} replies)`).join('\n')
    : 'No historical data yet';

  const prompt = buildMasterPrompt({
    profile,
    productUrl,
    communityList,
    recentWorkContext,
    topPostsContext,
    totalPosts,
    postsPerDay,
    days,
  });

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 15000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  
  // Parse JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('[GENERATE] AI Response:', text);
    throw new Error('Failed to parse AI response');
  }

  const posts = JSON.parse(jsonMatch[0]);
  
  // Validate and clean posts
  return posts.map(post => {
    // Convert escaped newlines
    const hook = (post.hook || '').replace(/\\n/g, '\n');
    const plug = (post.plug || '').replace(/\\n/g, '\n');
    
    // Ensure hook is under 280 characters (no link)
    const cleanHook = hook.length > 280 ? truncateAtBreak(hook, 280) : hook;
    
    // Ensure plug is under 280 characters (with link)
    const cleanPlug = plug.length > 280 ? truncateAtBreak(plug, 280) : plug;
    
    return {
      hook_content: cleanHook,
      plug_content: cleanPlug,
      content_type: post.type || 'build_in_public',
      predicted_engagement: post.predicted_engagement || 'reply',
      communityId: post.communityId || null,
      day: post.day || 1,
      is_thread: true,
      has_plug: true,
    };
  });
}

// ============================================================================
// THE MASTER PROMPT
// This is what makes our content beat SuperX
// ============================================================================
function buildMasterPrompt({ profile, productUrl, communityList, recentWorkContext, topPostsContext, totalPosts, postsPerDay, days }) {
  return `You are an elite X/Twitter growth strategist who has studied the open-sourced X algorithm (xai-org/x-algorithm Phoenix scoring system). You understand EXACTLY how to game the algorithm for maximum reach.

## 🎯 YOUR MISSION
Generate ${totalPosts} viral tweet THREADS that will dominate the X algorithm for this specific product/person.

---

## 📊 X ALGORITHM SECRETS (Phoenix Scoring - January 2026)

The algorithm predicts 15 engagement types and scores them with these weights:

**CRITICAL INSIGHT: REPLIES ARE KING**
- Reply: 13.5 weight (27x more valuable than a like!)
- Reply that gets author response: 75.0 weight (150x more valuable than like!)
- Like/Favorite: Only 0.5 weight (basically worthless)

**Other positive signals:**
- Profile click → engagement: 12.0
- Click into conversation: 11.0  
- Dwell time (2+ min): 10.0
- Retweet: 1.0
- Quote tweet: 1.0

**DEVASTATING negative signals (avoid at all costs):**
- Not interested: -74
- Block: -74
- Report: -369 (one report can tank your account!)

**KEY ALGORITHM BEHAVIORS:**
1. Author Diversity Scorer - penalizes repeated posting from same author
2. External links in main tweet HURT reach - use PLUG PATTERN
3. Content that generates conversation >>> content that generates agreement
4. Phoenix is a Grok transformer - it learns from behavior patterns, not content features

---

## 🔗 THE PLUG PATTERN (CRITICAL)

To protect reach from link penalties, EVERY post must be a thread:

**Tweet 1 (HOOK):** 
- Maximum viral potential
- NO LINKS EVER
- Ends with something that invites replies
- Under 280 characters

**Tweet 2 (PLUG - posted 60s later as reply):**
- Contains the link naturally
- Provides additional value
- Under 280 characters

This pattern gets 3-5x more reach than inline links!

---

## 👤 THE PRODUCT/PERSON

**Name:** ${profile.product_name}
**Description:** ${profile.product_description}
**URL:** ${productUrl || 'Not provided - focus on awareness'}
**Target Audience:** ${profile.target_audience || 'indie hackers, founders, developers'}
**Account Type:** ${profile.account_type || 'personal'}

---

## 📈 RECENT WORK (for Build in Public content)

${recentWorkContext}

---

## 🏆 HISTORICALLY TOP-PERFORMING CONTENT

${topPostsContext}

---

## 🎪 AVAILABLE X COMMUNITIES

${communityList}

Assign ~30% of posts to communities where relevant. Match content type to community theme.

---

## 📝 VIRAL CONTENT FRAMEWORKS (Use these - they're proven)

### 1. HOT TAKE (High risk, high reward - max replies)
Hook: "[Controversial opinion that 50% will agree with]"
Plug: "Here's why I think this: [link to deeper content]"
Best for: Maximum reach through debate

### 2. PAIN → SOLUTION (Core marketing)
Hook: "[Relatable pain point everyone in your niche feels]\\n\\n[Tease that there's a solution]"
Plug: "This is exactly why I built [product]: [URL]"
Best for: Converting followers to users

### 3. QUESTION (Algorithm favorite - drives replies)
Hook: "[Thought-provoking question that has no wrong answer]\\n\\n(Genuinely curious)"
Plug: "I've been thinking about this while building [product]: [URL]"
Best for: Maximizing the 13.5x reply weight

### 4. BUILD IN PUBLIC (Authentic, low risk)
Hook: "[Specific thing you shipped/learned today]\\n\\n[Why it matters]"
Plug: "Following the journey here: [URL]"
Best for: Building trust over time

### 5. STORY WITH STAKES (Dwell time optimizer)
Hook: "[Dramatic opening]\\n\\n[Build tension]\\n\\n[Resolution/lesson]"
Plug: "Full story + what I'm building: [URL]"
Best for: Engagement depth

### 6. RELATABLE STRUGGLE (Community builder)
Hook: "[Common struggle written like a diary]\\n\\n[Show you understand the pain]"
Plug: "Building the solution: [URL]"
Best for: Connection and replies

### 7. BEFORE/AFTER (Transformation)
Hook: "Before: [old painful way]\\nAfter: [new better way]\\n\\n[What changed]"
Plug: "Made this possible with: [URL]"
Best for: Showing product value

### 8. QUICK TIP (Value bomb)
Hook: "[Actionable tip]\\n\\n[Why it works]\\n\\n[How to do it]"
Plug: "More tips like this + the tool I use: [URL]"
Best for: Saves and bookmarks

### 9. NUMBERS/DATA (Credibility)
Hook: "I [did X] for [time period].\\n\\nResults:\\n→ [metric 1]\\n→ [metric 2]\\n→ [metric 3]"
Plug: "Here's how: [URL]"
Best for: Social proof

### 10. SIMPLE TRUTH (Shareable)
Hook: "[Topic] is simple:\\n\\n→ [Truth 1]\\n→ [Truth 2]\\n→ [Truth 3]\\n\\nThat's it."
Plug: "Building on these principles: [URL]"
Best for: Retweets

---

## 📅 CONTENT MIX FOR ${totalPosts} POSTS

Optimize for the algorithm with this distribution:
- 25% Questions/Engagement hooks (maximize 13.5x reply weight)
- 20% Hot Takes (high engagement, some risk)
- 20% Pain → Solution (marketing core)
- 15% Build in Public (authentic, safe)
- 10% Stories/Relatable (dwell time)
- 10% Tips/Data (value & credibility)

---

## ⚠️ ABSOLUTE RULES

1. **NEVER put links in the hook** - Algorithm death
2. **Hook MUST be under 280 characters** - No exceptions
3. **Plug MUST be under 280 characters** - No exceptions  
4. **Use \\n\\n for line breaks** - Not actual newlines
5. **Every hook should invite a reply** - End with question, take, or incomplete thought
6. **Be SPECIFIC to this product** - No generic "building something" tweets
7. **Vary opening lines** - Never start 2 posts the same way
8. **Avoid anything that could trigger "not interested"** - No spam vibes

---

## 📤 OUTPUT FORMAT

Return a JSON array with exactly ${totalPosts} objects:

[
  {
    "hook": "First line grabs attention\\n\\nMiddle provides value or tension\\n\\nEnds with reply invitation",
    "plug": "Additional context + ${productUrl || 'product mention'}\\n\\nNatural CTA",
    "type": "hot_take|pain_solution|question|build_in_public|story|relatable|before_after|tip|data|simple_truth",
    "predicted_engagement": "reply|retweet|like|quote",
    "communityId": null,
    "day": 1
  }
]

Return ONLY the JSON array. No other text.`;
}

// ============================================================================
// SCHEDULE OPTIMIZATION
// Posts at times that maximize algorithm visibility
// ============================================================================
function generateOptimalSchedule(postsPerDay, days) {
  const times = [];
  const now = new Date();
  
  // Start from tomorrow at first optimal time
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 0, 0, 0);

  // Optimal posting times based on X engagement data
  // These times maximize visibility before algorithm attenuates repeated authors
  const optimalHours = [9, 12, 15, 17, 19]; // 5 posts/day default
  
  for (let day = 0; day < days; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    
    for (let post = 0; post < postsPerDay; post++) {
      const postTime = new Date(dayDate);
      
      // Use optimal hours, cycling if needed
      const hour = optimalHours[post % optimalHours.length];
      postTime.setHours(hour);
      
      // Add slight randomness (0-15 mins) to avoid looking automated
      postTime.setMinutes(Math.floor(Math.random() * 15));
      
      times.push(postTime);
    }
  }

  return times;
}

// ============================================================================
// SAVE POSTS TO DATABASE
// ============================================================================
async function savePosts(userId, generatedPosts, scheduleTimes, communities) {
  const savedPosts = [];
  
  for (let i = 0; i < generatedPosts.length; i++) {
    const post = generatedPosts[i];
    const scheduledAt = scheduleTimes[i];

    // Find community UUID if assigned
    let communityUuid = null;
    if (post.communityId) {
      const community = communities.find(c => c.community_id === post.communityId);
      communityUuid = community?.id || null;
    }

    const { data: savedPost, error: saveError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        // Store both hook and plug
        content: post.hook_content, // Legacy field - stores hook
        hook_content: post.hook_content,
        plug_content: post.plug_content,
        content_type: post.content_type,
        predicted_engagement: post.predicted_engagement,
        is_thread: true,
        has_plug: true,
        platform: 'x',
        status: 'pending',
        scheduled_at: scheduledAt.toISOString(),
        source: 'ai',
        community_id: communityUuid,
      })
      .select()
      .single();

    if (saveError) {
      console.error('[SAVE] Error:', saveError);
    } else if (savedPost) {
      savedPosts.push(savedPost);
    }
  }

  return savedPosts;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function truncateAtBreak(text, maxLength) {
  if (text.length <= maxLength) return text;
  
  const truncated = text.slice(0, maxLength - 3);
  const lastNewline = truncated.lastIndexOf('\n');
  const lastPeriod = truncated.lastIndexOf('.');
  const lastSpace = truncated.lastIndexOf(' ');
  
  const breakPoint = Math.max(lastNewline, lastPeriod, lastSpace);
  
  if (breakPoint > maxLength * 0.7) {
    return text.slice(0, breakPoint + 1).trim();
  }
  
  return truncated.trim() + '...';
}

function calculateAvgReplyPotential(posts) {
  const potentials = posts.map(p => {
    const type = CONTENT_TYPES[p.content_type];
    return type?.replyPotential || 0.5;
  });
  return (potentials.reduce((a, b) => a + b, 0) / potentials.length).toFixed(2);
}