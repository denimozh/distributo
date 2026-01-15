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
    const { userId, count = 5, platforms = ['x'], includeCommunities = true } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if Anthropic API key is set
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Failed to load profile: ' + profileError.message }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.product_name || !profile.product_description) {
      return NextResponse.json({ 
        error: 'Product details required. Please complete onboarding.',
        needsOnboarding: true 
      }, { status: 400 });
    }

    // Check daily limit (10 posts per day)
    const today = new Date().toISOString().split('T')[0];
    const { count: todayCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    const remaining = 10 - (todayCount || 0);
    if (remaining <= 0) {
      return NextResponse.json({ 
        error: 'Daily limit reached (10 posts/day)',
        limit: 10,
        used: todayCount 
      }, { status: 429 });
    }

    const postsToGenerate = Math.min(count, remaining);

    // Try to get user's X communities (skip if table doesn't exist)
    let communities = [];
    if (includeCommunities) {
      try {
        const { data: userCommunities } = await supabase
          .from('x_communities')
          .select('*')
          .eq('user_id', userId);
        communities = userCommunities || [];
      } catch (e) {
        // Table might not exist, that's fine
        console.log('x_communities table not found, skipping');
      }
    }

    // Determine account type context
    const accountType = profile.account_type || 'personal';
    const isAgency = accountType === 'agency';

    // Generate posts using Claude
    console.log('Generating posts for:', profile.product_name);
    const generatedPosts = await generateMarketingPosts({
      productName: profile.product_name,
      productDescription: profile.product_description,
      accountType,
      isAgency,
      count: postsToGenerate,
      platforms,
      communities,
    });

    console.log('Generated', generatedPosts.length, 'posts');

    // Calculate schedule times (spread across the day, 9am-8pm)
    const now = new Date();
    const scheduleTimes = generateScheduleTimes(postsToGenerate, now);

    // Save posts to database
    const savedPosts = [];
    for (let i = 0; i < generatedPosts.length; i++) {
      const post = generatedPosts[i];
      const scheduledAt = scheduleTimes[i];

      const { data: savedPost, error: saveError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content: post.content,
          platform: post.platform || 'x',
          status: 'pending',
          scheduled_at: scheduledAt.toISOString(),
          source: 'ai',
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
      dailyLimit: 10,
      dailyUsed: (todayCount || 0) + savedPosts.length,
      dailyRemaining: remaining - savedPosts.length,
    });

  } catch (error) {
    console.error('Generate batch error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

async function generateMarketingPosts({ productName, productDescription, accountType, isAgency, count, platforms, communities }) {
  const communityContext = communities.length > 0 
    ? `\n\nAvailable X Communities to post to:\n${communities.map(c => `- ${c.name} (ID: ${c.community_id})`).join('\n')}`
    : '';

  const accountContext = isAgency 
    ? `This is an agency account helping clients with marketing.`
    : accountType === 'product'
    ? `This is the official product account for ${productName}.`
    : `This is a personal account of someone building ${productName}.`;

  const prompt = `You are a marketing expert for indie hackers and SaaS founders. Generate ${count} engaging marketing posts for social media.

## Product Info
- **Name**: ${productName}
- **Description**: ${productDescription}
- **Account Type**: ${accountContext}
${communityContext}

## Requirements
1. Each post should be unique with a different angle:
   - Build in public update
   - Tip/insight related to the product's domain
   - Milestone or progress share
   - Behind the scenes
   - Question to engage audience
   - Problem/solution format

2. Keep posts under 280 characters for X
3. Sound authentic, not salesy or AI-generated
4. Use 1-2 relevant emojis max
5. Include subtle call-to-action when appropriate
6. Mix up the tone: some casual, some professional
7. NO hashtags (they look spammy on X)

${communities.length > 0 ? `
3. For ${Math.min(2, count)} posts, suggest posting to a specific community that fits the content. Include the community_id in your response.
` : ''}

## Output Format
Return a JSON array with exactly ${count} objects:
[
  {
    "content": "The post text here",
    "platform": "x",
    "communityId": null or "community_id_here",
    "angle": "build_in_public|tip|milestone|behind_scenes|question|problem_solution"
  }
]

Only return the JSON array, nothing else.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  
  // Parse JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response');
  }

  return JSON.parse(jsonMatch[0]);
}

function generateScheduleTimes(count, startFrom) {
  const times = [];
  const now = new Date(startFrom);
  
  // Start from next hour or 9am tomorrow if after 8pm
  let baseTime = new Date(now);
  if (now.getHours() >= 20) {
    // Schedule for tomorrow starting at 9am
    baseTime.setDate(baseTime.getDate() + 1);
    baseTime.setHours(9, 0, 0, 0);
  } else if (now.getHours() < 9) {
    baseTime.setHours(9, 0, 0, 0);
  } else {
    baseTime.setHours(baseTime.getHours() + 1, 0, 0, 0);
  }

  // Spread posts across available hours (9am-8pm = 11 hours)
  const hoursAvailable = 20 - baseTime.getHours();
  const interval = Math.max(1, Math.floor(hoursAvailable / count));

  for (let i = 0; i < count; i++) {
    const time = new Date(baseTime);
    time.setHours(time.getHours() + (i * interval));
    
    // Add some randomness to minutes (0-30)
    time.setMinutes(Math.floor(Math.random() * 30));
    
    // Don't schedule past 8pm
    if (time.getHours() >= 20) {
      time.setDate(time.getDate() + 1);
      time.setHours(9 + (i % 11), Math.floor(Math.random() * 30), 0, 0);
    }
    
    times.push(time);
  }

  return times;
}