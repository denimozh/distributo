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

// Content type configurations with algorithm optimization
const CONTENT_CONFIGS = {
  hot_take: {
    name: 'Hot Take',
    description: 'Controversial opinion that sparks debate',
    prompt: 'Write a controversial but defensible opinion about the product/industry that will spark debate. Make people want to reply with their take.',
    replyPotential: 0.95,
  },
  build_update: {
    name: 'Build Update',
    description: 'Share recent progress or shipping update',
    prompt: 'Share a specific thing built or shipped recently. Be authentic and specific. Show the journey, not just the result.',
    replyPotential: 0.7,
  },
  pain_solution: {
    name: 'Pain → Solution',
    description: 'Relatable problem with product as solution',
    prompt: 'Describe a specific pain point the target audience feels daily, then tease how the product solves it. Make them nod in recognition.',
    replyPotential: 0.75,
  },
  personal_story: {
    name: 'Personal Story',
    description: 'Emotional narrative with stakes',
    prompt: 'Tell a brief story about the founder journey - a challenge faced, a lesson learned, or a moment of doubt/triumph. Make it human.',
    replyPotential: 0.8,
  },
  engagement: {
    name: 'Question/Poll',
    description: 'Engaging question that invites responses',
    prompt: 'Ask a thought-provoking question that has no wrong answer. Make people want to share their experience. This is optimized for the 13.5x reply weight in the algorithm.',
    replyPotential: 0.95,
  },
  tip: {
    name: 'Quick Tip',
    description: 'Actionable value in one tweet',
    prompt: 'Share one specific, actionable tip that provides immediate value. Something they can use today.',
    replyPotential: 0.5,
  },
  relatable: {
    name: 'Relatable Struggle',
    description: 'Shared experience that resonates',
    prompt: 'Describe a common struggle in your niche as if writing a diary entry. Show you understand the pain deeply.',
    replyPotential: 0.85,
  },
  before_after: {
    name: 'Before/After',
    description: 'Transformation story',
    prompt: 'Show a clear before/after transformation. What was life like before, what is it like now? Be specific with details.',
    replyPotential: 0.65,
  },
  data: {
    name: 'Numbers/Data',
    description: 'Specific results with metrics',
    prompt: 'Share specific metrics, results, or data points. Numbers are credible and shareable.',
    replyPotential: 0.6,
  },
  simple_truth: {
    name: 'Simple Truth',
    description: 'Distilled wisdom in few lines',
    prompt: 'Distill a complex topic into 3-4 simple truths. Make it feel like an insight.',
    replyPotential: 0.6,
  },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      userId, 
      platform = 'x',
      contentType = 'build_update',
      scheduledAt,
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

    const productUrl = profile.product_url || null;
    const config = CONTENT_CONFIGS[contentType] || CONTENT_CONFIGS.build_update;

    console.log(`[GENERATE-SINGLE] Creating ${config.name} post for ${profile.product_name}`);

    // Generate the hook + plug content
    const generatedPost = await generateSinglePost({
      profile,
      productUrl,
      contentType,
      config,
    });

    // Save to database
    const { data: savedPost, error: saveError } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        content: generatedPost.hook_content,
        hook_content: generatedPost.hook_content,
        plug_content: generatedPost.plug_content,
        content_type: contentType,
        predicted_engagement: 'reply',
        is_thread: true,
        has_plug: true,
        platform,
        status: 'pending',
        scheduled_at: scheduledAt || new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        source: 'ai',
      })
      .select()
      .single();

    if (saveError) {
      console.error('[GENERATE-SINGLE] Save error:', saveError);
      return NextResponse.json({ error: 'Failed to save post' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      post: savedPost,
      algorithmOptimization: {
        contentType: config.name,
        replyPotential: config.replyPotential,
        threadingEnabled: true,
        linkProtection: 'Plug Pattern',
      }
    });

  } catch (error) {
    console.error('[GENERATE-SINGLE] Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

async function generateSinglePost({ profile, productUrl, contentType, config }) {
  const prompt = `You are an elite X/Twitter growth strategist who understands the X algorithm (Phoenix scoring).

## CRITICAL ALGORITHM INSIGHT
- Replies have 13.5x weight (27x more valuable than likes)
- External links in main tweet KILL reach
- Use the PLUG PATTERN: Hook (no link) → Reply (with link)

## THE PRODUCT
Name: ${profile.product_name}
Description: ${profile.product_description}
URL: ${productUrl || 'Not provided'}
Target Audience: ${profile.target_audience || 'indie hackers, founders, developers'}

## YOUR TASK
Generate ONE ${config.name} tweet thread.

**Content Brief:** ${config.prompt}

## FORMAT RULES
- Hook: Under 280 chars, NO LINKS, ends with something that invites replies
- Plug: Under 280 chars, includes link naturally, adds value
- Use \\n\\n for line breaks

## OUTPUT (JSON only)
{
  "hook": "Your hook text here\\n\\nMore text\\n\\nEnds with engagement invitation",
  "plug": "Additional value + ${productUrl || 'product context'}\\n\\nNatural call to action"
}

Return ONLY the JSON object. No other text.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  
  // Parse JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[GENERATE-SINGLE] AI Response:', text);
    throw new Error('Failed to parse AI response');
  }

  const post = JSON.parse(jsonMatch[0]);
  
  // Clean and validate
  const hook = (post.hook || '').replace(/\\n/g, '\n');
  const plug = (post.plug || '').replace(/\\n/g, '\n');
  
  return {
    hook_content: hook.length > 280 ? hook.slice(0, 277) + '...' : hook,
    plug_content: plug.length > 280 ? plug.slice(0, 277) + '...' : plug,
  };
}