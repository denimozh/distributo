import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// AUTOPILOT CONTENT GENERATION CRON
// Runs every 6 hours to check if users need content generated
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Minimum posts needed in queue before triggering generation
const MIN_QUEUE_THRESHOLD = 3;
const POSTS_TO_GENERATE = 7; // Generate 1 week of content

export async function GET(request) {
  console.log('[AUTOPILOT] Starting autopilot content generation check...');
  
  try {
    // Get all users with autopilot enabled
    const { data: autopilotUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, product_name, product_description, target_audience, product_url, autopilot_enabled, autopilot_posts_per_day, autopilot_auto_approve')
      .eq('autopilot_enabled', true);

    if (usersError) {
      console.error('[AUTOPILOT] Error fetching users:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!autopilotUsers || autopilotUsers.length === 0) {
      console.log('[AUTOPILOT] No users with autopilot enabled');
      return NextResponse.json({ message: 'No autopilot users', processed: 0 });
    }

    console.log(`[AUTOPILOT] Found ${autopilotUsers.length} users with autopilot enabled`);

    const results = [];

    for (const user of autopilotUsers) {
      try {
        // Check user's current queue
        const { data: queuedPosts, error: queueError } = await supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id)
          .in('status', ['pending', 'scheduled'])
          .gte('scheduled_at', new Date().toISOString());

        if (queueError) {
          console.error(`[AUTOPILOT] Error checking queue for ${user.id}:`, queueError);
          continue;
        }

        const queueCount = queuedPosts?.length || 0;
        console.log(`[AUTOPILOT] User ${user.id} has ${queueCount} posts in queue`);

        // If queue is low, generate more content
        if (queueCount < MIN_QUEUE_THRESHOLD) {
          console.log(`[AUTOPILOT] Queue low for ${user.id}, generating content...`);
          
          const generated = await generateAutopilotContent(user);
          
          results.push({
            userId: user.id,
            productName: user.product_name,
            queueBefore: queueCount,
            generated: generated,
            status: 'generated'
          });
        } else {
          results.push({
            userId: user.id,
            productName: user.product_name,
            queueCount: queueCount,
            status: 'sufficient'
          });
        }
      } catch (userError) {
        console.error(`[AUTOPILOT] Error processing user ${user.id}:`, userError);
        results.push({
          userId: user.id,
          status: 'error',
          error: userError.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: autopilotUsers.length,
      results
    });

  } catch (error) {
    console.error('[AUTOPILOT] Cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// GENERATE AUTOPILOT CONTENT
// ============================================================================
async function generateAutopilotContent(user) {
  const postsPerDay = user.autopilot_posts_per_day || 2;
  const autoApprove = user.autopilot_auto_approve ?? true;
  const totalPosts = POSTS_TO_GENERATE;

  // Get user's recent commits for context
  let recentCommits = [];
  try {
    const { data: commits } = await supabase
      .from('github_commits')
      .select('message, additions, deletions, files_changed')
      .eq('user_id', user.id)
      .order('committed_at', { ascending: false })
      .limit(10);
    recentCommits = commits || [];
  } catch (e) {
    console.log('[AUTOPILOT] No GitHub commits available');
  }

  // Get user's X communities
  let communities = [];
  try {
    const { data: userCommunities } = await supabase
      .from('x_communities')
      .select('id, community_id, name')
      .eq('user_id', user.id)
      .eq('is_active', true);
    communities = userCommunities || [];
  } catch (e) {
    console.log('[AUTOPILOT] No communities available');
  }

  // Build the prompt
  const commitContext = recentCommits.length > 0
    ? recentCommits.slice(0, 5).map(c => `- "${c.message}" (+${c.additions || 0}/-${c.deletions || 0})`).join('\n')
    : 'No recent commits';

  const productUrl = user.product_url || '';

  const prompt = buildAutopilotPrompt({
    productName: user.product_name,
    productDescription: user.product_description,
    targetAudience: user.target_audience,
    productUrl,
    commitContext,
    totalPosts,
  });

  // Generate content
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 10000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  
  // Parse JSON
  let posts;
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    posts = JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (parseError) {
    console.error('[AUTOPILOT] JSON parse error:', parseError.message);
    throw new Error('Failed to parse AI response');
  }

  // Schedule the posts
  const scheduleTimes = generateSchedule(totalPosts, postsPerDay);
  let savedCount = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const scheduledAt = scheduleTimes[i];

    // Convert escaped newlines
    const hook = (post.hook || '').replace(/\\n/g, '\n').trim();
    const plug = (post.plug || '').replace(/\\n/g, '\n').trim();

    // Find community UUID if specified
    let communityUuid = null;
    if (post.communityId) {
      const community = communities.find(c => c.community_id === post.communityId);
      communityUuid = community?.id || null;
    }

    const { error: saveError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: hook,
        hook_content: hook,
        plug_content: plug,
        platform: 'x',
        status: autoApprove ? 'scheduled' : 'pending', // Respect auto-approve setting
        scheduled_at: scheduledAt.toISOString(),
        source: 'autopilot',
        is_thread: true,
        reply_delay: 60,
        community_id: communityUuid,
        metadata: {
          content_type: post.type,
          growth_pillar: post.type, // Map type to growth pillar
          visual_concept: post.visual_concept,
          alignment_score: 75, // Default score for autopilot
          autopilot_generated: true,
        },
      });

    if (!saveError) {
      savedCount++;
    } else {
      console.error('[AUTOPILOT] Error saving post:', saveError);
    }
  }

  console.log(`[AUTOPILOT] Generated ${savedCount} posts for user ${user.id}`);
  return savedCount;
}

// ============================================================================
// BUILD AUTOPILOT PROMPT
// ============================================================================
function buildAutopilotPrompt({ productName, productDescription, targetAudience, productUrl, commitContext, totalPosts }) {
  return `You are an obsessed solo founder writing tweets at 2am. Raw, unfiltered, slightly unhinged.

## MISSION
Generate ${totalPosts} viral tweets for autopilot mode. These will be auto-posted, so they must be HIGH QUALITY.

## THE PRODUCT
**Name:** ${productName}
**What it does:** ${productDescription}
**Target audience:** ${targetAudience || 'Indie hackers and founders'}
**URL:** ${productUrl || 'Not provided'}

## RECENT WORK (for authenticity)
${commitContext}

## BROETRY FORMAT (MANDATORY)
Every tweet must follow 1-1-3-1 structure:

Line 1: NEGATIVE HOOK (confession, failure, challenge)

[blank line]

Lines 3-5: SHORT PUNCHY VALUE (max 8 words each)

[blank line]

Line 7: PIVOT (question or incomplete thought)

## FIRST LINE MUST BE:
- A confession: "I've been lying to myself about..."
- A failure: "I broke production today."
- A challenge: "Everyone's wrong about..."
- Frustration: "Nothing pisses me off more than..."

## BANNED OPENERS:
- "Here's what I learned..."
- "I'm excited to share..."
- "Just shipped..."
- "Pro tip:"

## OUTPUT FORMAT
Return ONLY a JSON array:

[
  {
    "hook": "Negative hook here\\n\\nShort line.\\nAnother line.\\nThird line.\\n\\nEnding question?",
    "plug": "Natural follow-up with ${productUrl || 'product mention'}\\n\\nSoft CTA",
    "type": "confession|failure|hot_take|frustration|vulnerable",
    "visual_concept": "Screenshot of X or description of ideal visual"
  }
]

Generate exactly ${totalPosts} posts. No markdown, no explanation.`;
}

// ============================================================================
// GENERATE SCHEDULE
// ============================================================================
function generateSchedule(totalPosts, postsPerDay) {
  const times = [];
  const now = new Date();
  
  // Start from next optimal time slot
  const startDate = new Date(now);
  startDate.setHours(startDate.getHours() + 2); // Start 2 hours from now
  
  // Optimal posting hours
  const optimalHours = [9, 12, 15, 18, 20];
  
  let dayOffset = 0;
  let postIndex = 0;
  
  while (times.length < totalPosts) {
    const dayDate = new Date(startDate);
    dayDate.setDate(dayDate.getDate() + dayOffset);
    
    // Get posts for this day
    const postsToday = Math.min(postsPerDay, totalPosts - times.length);
    
    for (let i = 0; i < postsToday; i++) {
      const postTime = new Date(dayDate);
      const hour = optimalHours[i % optimalHours.length];
      postTime.setHours(hour, Math.floor(Math.random() * 30), 0, 0);
      
      // Make sure it's in the future
      if (postTime > now) {
        times.push(postTime);
      }
    }
    
    dayOffset++;
    
    // Safety check
    if (dayOffset > 30) break;
  }
  
  return times.sort((a, b) => a - b);
}