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
      days = 7, // Generate for a full week
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

    // Get product URL
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

    // Calculate total posts to generate
    const totalPosts = postsPerDay * days;
    
    console.log(`Generating ${totalPosts} posts (${postsPerDay}/day × ${days} days) for ${profile.product_name}`);

    // Generate posts using Claude
    const generatedPosts = await generateWeeklyContent({
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

    // Generate schedule times across the week
    const scheduleTimes = generateWeeklySchedule(postsPerDay, days);

    // Save posts to database
    const savedPosts = [];
    for (let i = 0; i < generatedPosts.length; i++) {
      const post = generatedPosts[i];
      const scheduledAt = scheduleTimes[i];

      // Find community UUID if community_id is specified
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

async function generateWeeklyContent({ 
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

  const urlInstruction = productUrl 
    ? `IMPORTANT: Include the product link "${productUrl}" naturally in EVERY post. Place it at the end after a line break.`
    : 'No product URL provided - focus on building interest and awareness.';

  const prompt = `You are a content strategist for indie hackers and SaaS founders. Generate a week's worth of marketing content.

## Product
- **Name**: ${productName}
- **Description**: ${productDescription}
- **URL**: ${productUrl || 'Not provided'}
- **Target Audience**: ${targetAudience || 'Founders, indie hackers, developers'}
- **Account Type**: ${accountType}

## Available X Communities
${communityList}

## Content Requirements

### Volume
Generate exactly ${totalPosts} posts (${postsPerDay} posts × ${days} days).

### Product Link
${urlInstruction}

### Formatting Rules
1. Use proper line breaks for readability (\\n\\n between paragraphs)
2. Keep main content under 250 chars to leave room for the URL
3. Structure: Hook → Value → Link
4. NO hashtags (they look spammy)
5. 1-2 emojis max, placed naturally

### Content Mix (rotate through these)
1. **Hook + Problem/Solution** - Start with a relatable problem, offer your product as solution
2. **Build in Public** - Share progress, learnings, milestones
3. **Quick Tip** - Actionable advice related to your product's domain
4. **Question/Engagement** - Ask your audience something to drive replies
5. **Social Proof/Results** - Share wins, user feedback, metrics
6. **Behind the Scenes** - What you're working on, challenges faced
7. **Contrarian Take** - Challenge common assumptions in your space

### Community Distribution
${communities.length > 0 ? `
Distribute posts across communities (one post per community per batch of ${postsPerDay}):
- Assign ${Math.min(communities.length, postsPerDay)} posts to different communities each day
- Match content to community theme (e.g., build-in-public content for "Build in Public" community)
- Remaining posts go to main timeline (communityId: null)
` : 'No communities - all posts go to main timeline.'}

### Voice & Tone
- Authentic, not corporate
- Conversational, like talking to a friend
- Confident but not arrogant
- Show personality

## Output Format
Return a JSON array with exactly ${totalPosts} objects:
[
  {
    "content": "First line hook\\n\\nMore context and value here.\\n\\n${productUrl || 'yourproduct.com'}",
    "platform": "x",
    "communityId": null or "${communities[0]?.community_id || 'community_id'}",
    "day": 1,
    "type": "hook|build_in_public|tip|question|social_proof|behind_scenes|contrarian"
  }
]

IMPORTANT: 
- Ensure proper \\n\\n line breaks in content for readability
- Every post MUST end with the product URL on its own line
- Vary the hooks - don't start multiple posts the same way
- Make each post unique and valuable on its own

Return ONLY the JSON array.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
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
  
  // Validate and clean posts
  return posts.map(post => ({
    ...post,
    content: post.content.replace(/\\n/g, '\n'), // Ensure newlines are actual newlines
  }));
}

function generateWeeklySchedule(postsPerDay, days) {
  const times = [];
  const now = new Date();
  
  // Start from tomorrow at 9am
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() + 1);
  startDate.setHours(9, 0, 0, 0);

  // Optimal posting times (in hours, 24h format)
  const optimalHours = [9, 11, 13, 15, 17, 19];
  
  for (let day = 0; day < days; day++) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + day);
    
    // Skip weekends optionally (uncomment if desired)
    // if (dayDate.getDay() === 0 || dayDate.getDay() === 6) continue;
    
    for (let post = 0; post < postsPerDay; post++) {
      const postTime = new Date(dayDate);
      
      // Use optimal hours, cycling through if more posts than optimal times
      const hour = optimalHours[post % optimalHours.length];
      postTime.setHours(hour);
      
      // Add some randomness to minutes (0-45)
      postTime.setMinutes(Math.floor(Math.random() * 45));
      
      times.push(postTime);
    }
  }

  return times;
}