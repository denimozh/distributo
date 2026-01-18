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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.product_name || !profile.product_description) {
      return NextResponse.json({ 
        error: 'Product details required. Please complete onboarding.',
        needsOnboarding: true 
      }, { status: 400 });
    }

    const productUrl = profile.product_url || profile.website_url || null;

    // Get user's active X communities
    let communities = [];
    try {
      const { data: userCommunities } = await supabase
        .from('x_communities')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);
      communities = userCommunities || [];
    } catch (e) {
      console.log('x_communities not available');
    }

    const totalPosts = postsPerDay * days;
    
    console.log(`Generating ${totalPosts} viral posts for ${profile.product_name}`);

    // Generate posts using Claude with viral frameworks
    const generatedPosts = await generateViralContent({
      productName: profile.product_name,
      productDescription: profile.product_description,
      productUrl,
      accountType: profile.account_type || 'personal',
      targetAudience: profile.target_audience,
      postsPerDay,
      days,
      communities,
    });

    console.log(`AI generated ${generatedPosts.length} posts`);

    // Generate schedule times
    const scheduleTimes = generateWeeklySchedule(postsPerDay, days);

    // Save posts to database
    const savedPosts = [];
    for (let i = 0; i < generatedPosts.length; i++) {
      const post = generatedPosts[i];
      const scheduledAt = scheduleTimes[i];

      let communityUuid = null;
      if (post.communityId) {
        const community = communities.find(c => c.community_id === post.communityId);
        communityUuid = community?.id || null;
      }

      const { data: savedPost, error: saveError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: post.content,
          platform: post.platform || 'x',
          status: 'pending',
          scheduled_at: scheduledAt.toISOString(),
          source: 'ai',
          community_id: communityUuid,
        })
        .select()
        .single();

      if (saveError) {
        console.error('Save error:', saveError);
      } else if (savedPost) {
        savedPosts.push(savedPost);
      }
    }

    return NextResponse.json({
      success: true,
      generated: savedPosts.length,
      posts: savedPosts,
      schedule: {
        postsPerDay,
        days,
        totalPosts: savedPosts.length,
        communitiesUsed: communities.length,
      }
    });

  } catch (error) {
    console.error('Content factory error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

// ==========================================
// VIRAL CONTENT GENERATION
// ==========================================

async function generateViralContent({ 
  productName, 
  productDescription, 
  productUrl,
  accountType, 
  targetAudience,
  postsPerDay, 
  days,
  communities 
}) {
  const totalPosts = postsPerDay * days;
  
  const communityList = communities.length > 0 
    ? communities.map(c => `- "${c.name}" (ID: ${c.community_id})`).join('\n')
    : 'None';

  const prompt = `You are a viral tweet writer who creates content that gets 1000+ likes. You understand what makes indie hacker content spread.

## THE PRODUCT
Name: ${productName}
Description: ${productDescription}
URL: ${productUrl || 'Not provided'}
Target Audience: ${targetAudience || 'indie hackers, SaaS founders, developers'}
Account Type: ${accountType}

## AVAILABLE X COMMUNITIES
${communityList}

## YOUR TASK
Generate exactly ${totalPosts} tweets (${postsPerDay}/day × ${days} days) that will go VIRAL.

---

## VIRAL TWEET FRAMEWORKS (use these - they work)

### 1. The Pain → Solution
"[Relatable pain point everyone experiences]

[How you/your product solved it]

[Clear benefit or result]"

Example:
"I used to spend 10+ hours/week on social media marketing.

Scheduling, posting, engaging, repeat.

Now I spend 30 minutes reviewing AI-generated posts.

Building in public shouldn't mean burning out."

### 2. The Controversial/Hot Take
"Hot take: [counterintuitive opinion]

[1-2 sentences explaining why]"

Example:
"Hot take: Your GitHub commits are better marketing content than anything you'd brainstorm.

Real work > manufactured thought leadership."

### 3. The Relatable Struggle
"[Common struggle in your niche - written like a diary entry]

[Show you understand the pain]

[Optional: hint at solution]"

Example:
"6am: Write LinkedIn post
8am: Schedule tweets
12pm: Think about Reddit
2pm: Give up and just code

There's gotta be a better way..."

### 4. The Before/After
"Before: [old painful way]
After: [new better way]

[What changed]"

Example:
"Before: Manually posting 3x/day across 4 platforms
After: Push code → auto-generated posts

My calendar thanks me."

### 5. The Quick Win/Tip
"[Actionable tip that worked for you]

[Why it works]

[How to do it]"

Example:
"Marketing tip that 10x'd my reach:

Reply to big accounts within 10 mins of posting.

Early replies get the most visibility.

Simple, but nobody does it consistently."

### 6. The Story/Journey
"[Dramatic opening line]

[Build tension or context]

[Resolution/lesson]"

Example:
"6 months ago I was spending 10+ hrs/week on social media.

Today I pushed a button and 12 posts scheduled automatically.

The tool I wished existed? I built it."

### 7. The Question Hook
"[Provocative question to your audience]

[Optional: your take]"

Example:
"What's harder as a solo founder?

A) Building the product
B) Marketing the product

(The real answer is C: doing both at once)"

### 8. The Simple Truth
"[Topic] is simple:

→ [Truth 1]
→ [Truth 2]
→ [Truth 3]

That's it."

Example:
"Marketing as a developer:

→ Build something useful
→ Talk about building it
→ Help others do the same

That's literally it."

### 9. The Numbers/Data Hook
"I [did X] for [time period].

Here's what happened:

[Specific results with numbers]"

Example:
"I automated my social media for 30 days.

Results:
- Saved 8+ hours/week
- 3x more consistent posting
- Actually had time to code

Automation isn't lazy. It's leverage."

### 10. The Build in Public Update
"[What you shipped/built today]

[Why it matters or what you learned]

[What's next]"

Example:
"Just shipped: auto-scheduling for X communities

Took 3 days instead of the 3 hours I estimated.

OAuth is always harder than you think. 😅

Next up: Reddit integration."

---

## CRITICAL WRITING RULES

1. **First line is EVERYTHING** - You have 0.5 seconds to hook them
2. **Use line breaks** - One thought per line. White space = readability
3. **Be specific** - "10 hours/week" not "a lot of time"
4. **Sound human** - Write like you talk, not like a brand
5. **No corporate speak** - Never say "leverage", "synergy", "ecosystem", "game-changer"
6. **Emojis: 0-2 max** - Only if natural. Never 🚀🔥💪 spam
7. **NO hashtags** - They look desperate and spammy
8. **Never start with "Just shipped"** - It's overused. Be creative
9. **Never start with "I"** - Rewrite to avoid it
10. **Create curiosity** - Make them want to read the next line
11. **End with engagement or CTA** - Question, link, or cliffhanger

## PRODUCT LINK RULES
${productUrl ? `
- Include "${productUrl}" in about 60% of posts (not all - that's spammy)
- Place it at the END, after a line break
- Don't say "Check it out!" - just include the link naturally
- Frame it as sharing what helped you, not pitching
` : '- No URL provided - focus on building awareness and engagement'}

## CONTENT MIX FOR ${totalPosts} POSTS
Distribute across these types:
- 25% Pain → Solution (your core marketing message)
- 15% Hot Takes / Controversial (gets engagement)  
- 15% Relatable Struggles (builds connection)
- 15% Quick Tips / Value (establishes expertise)
- 15% Build in Public / Journey (authentic updates)
- 15% Questions / Engagement (drives replies)

## COMMUNITY DISTRIBUTION
${communities.length > 0 ? `
Assign ${Math.min(communities.length, Math.ceil(totalPosts * 0.3))} posts to communities:
- Match content to community theme
- Build-in-public content → "Build in Public" community
- Remaining posts → main timeline (communityId: null)
` : 'All posts go to main timeline (communityId: null)'}

---

## EXAMPLES OF GREAT TWEETS FOR INSPIRATION

Example 1 (Pain → Solution with personality):
"The social media grind as a solo founder:

6am: Write LinkedIn post
8am: Schedule tweets
10am: Reply to comments
12pm: Think about Reddit
2pm: Give up and just code

What if your code could write your posts for you?

That's what I'm building."

Example 2 (Controversial + specific):
"Unpopular opinion: Most indie hackers fail not because they can't code, but because they refuse to market.

You can build the best product in the world.

If nobody knows it exists, it doesn't matter."

Example 3 (Before/After with emotion):
"Before: Staring at blank screen for 30 mins trying to write a tweet
After: AI drafts 5 options in 10 seconds, I pick the best one

I'm not outsourcing my voice.
I'm outsourcing the blank page."

Example 4 (Value + personal):
"Marketing tip nobody talks about:

Your GitHub commits ARE your content.

- Fixed a bug? Tweet the lesson
- Added a feature? Share the why
- Refactored code? Explain the tradeoff

Your work is your content. Stop separating them."

Example 5 (Story with stakes):
"First paying customer today.

$29/month.

Sounds small, but it means:
- Someone trusts my work
- The idea is validated
- This might actually work

Onward."

---

## OUTPUT FORMAT

Return a JSON array with exactly ${totalPosts} objects:

[
  {
    "content": "First line hook here\\n\\nSecond paragraph with value.\\n\\nCall to action or link here.",
    "platform": "x",
    "communityId": null,
    "day": 1,
    "type": "pain_solution|hot_take|relatable|before_after|tip|story|question|simple_truth|data|build_in_public"
  }
]

CRITICAL FORMATTING:
- Use \\n\\n for line breaks (will be converted to actual line breaks)
- Each post MUST be under 280 characters total
- Vary your hooks - never start multiple posts the same way
- Make each post standalone valuable

Return ONLY the JSON array, no other text.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 10000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  
  // Parse JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error('AI Response:', text);
    throw new Error('Failed to parse AI response');
  }

  const posts = JSON.parse(jsonMatch[0]);
  
  // Validate, clean, and ensure quality
  return posts.map(post => {
    let content = post.content.replace(/\\n/g, '\n');
    
    // Ensure under 280 characters
    if (content.length > 280) {
      // Try to truncate at a natural break point
      const truncated = content.slice(0, 277);
      const lastNewline = truncated.lastIndexOf('\n');
      const lastPeriod = truncated.lastIndexOf('.');
      const breakPoint = Math.max(lastNewline, lastPeriod);
      
      if (breakPoint > 200) {
        content = content.slice(0, breakPoint + 1);
      } else {
        content = truncated + '...';
      }
    }
    
    return {
      ...post,
      content,
    };
  });
}

// ==========================================
// SCHEDULE GENERATION
// ==========================================

function generateWeeklySchedule(postsPerDay, days) {
  const times = [];
  const now = new Date();
  
  // Start from tomorrow at 9am
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 0, 0, 0);

  // Optimal posting times based on engagement data
  const optimalHours = [8, 10, 12, 14, 17, 19];
  
  for (let day = 0; day < days; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    
    for (let post = 0; post < postsPerDay; post++) {
      const postTime = new Date(dayDate);
      
      // Use optimal hours, cycling if needed
      const hour = optimalHours[post % optimalHours.length];
      postTime.setHours(hour);
      
      // Add randomness (0-30 mins) to avoid looking automated
      postTime.setMinutes(Math.floor(Math.random() * 30));
      
      times.push(postTime);
    }
  }

  return times;
}