// src/app/api/campaigns/[id]/start/route.js
// Start campaign generation - creates hooks, then generates videos

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request, { params }) {
  try {
    const { id: campaignId } = params;
    const supabase = createServiceClient();

    // 1. Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*, avatars(*)')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.status === 'generating') {
      return NextResponse.json(
        { error: 'Campaign is already generating' },
        { status: 400 }
      );
    }

    // 2. Check user has enough credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', campaign.user_id)
      .single();

    const videosToGenerate = campaign.total_videos || 5;
    if ((profile?.credits || 0) < videosToGenerate) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          required: videosToGenerate,
          available: profile?.credits || 0,
        },
        { status: 402 }
      );
    }

    // 3. Update campaign status to generating
    await supabase
      .from('campaigns')
      .update({ status: 'generating' })
      .eq('id', campaignId);

    // 4. Generate hooks with Claude
    const hooks = await generateHooks({
      productName: campaign.product_name,
      productBenefit: campaign.product_benefit,
      targetAudience: campaign.target_audience,
      count: campaign.hook_count || 20,
    });

    // 5. Save hooks to database
    const hookRecords = hooks.map(hook => ({
      campaign_id: campaignId,
      hook_type: hook.type,
      script: hook.script,
      predicted_score: hook.predictedScore,
    }));

    await supabase.from('hooks').insert(hookRecords);

    // 6. Select top hooks for video generation
    const topHooks = hooks
      .sort((a, b) => b.predictedScore - a.predictedScore)
      .slice(0, videosToGenerate);

    // 7. Queue video generation for each hook
    const videoPromises = topHooks.map(async (hook, index) => {
      // Stagger generation to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, index * 2000));

      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/videos/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: campaign.user_id,
          campaignId: campaignId,
          avatarId: campaign.avatar_id,
          script: hook.script,
          hookType: hook.type,
          duration: 15,
          format: campaign.format || 'talking_head',
        }),
      });

      return response.json();
    });

    // 8. Wait for all videos to complete
    const results = await Promise.allSettled(videoPromises);
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;

    // 9. Update campaign status
    const finalStatus = failed === videosToGenerate ? 'failed' : 'active';
    
    await supabase
      .from('campaigns')
      .update({
        status: finalStatus,
        videos_generated: successful,
      })
      .eq('id', campaignId);

    return NextResponse.json({
      success: true,
      campaignId,
      hooksGenerated: hooks.length,
      videosGenerated: successful,
      videosFailed: failed,
      status: finalStatus,
    });

  } catch (error) {
    console.error('[Campaign Start] Error:', error);
    
    // Update campaign to failed
    const supabase = createServiceClient();
    await supabase
      .from('campaigns')
      .update({ status: 'failed' })
      .eq('id', params.id);

    return NextResponse.json(
      { error: 'Campaign generation failed', details: error.message },
      { status: 500 }
    );
  }
}

// Generate hooks using Claude
async function generateHooks({ productName, productBenefit, targetAudience, count }) {
  const hookTypes = [
    'curiosity',
    'pov', 
    'story',
    'question',
    'direct',
    'controversial',
    'before_after',
    'social_proof',
  ];

  const prompt = `Generate ${count} viral TikTok hooks for this product:

Product: ${productName}
Main Benefit: ${productBenefit}
Target Audience: ${targetAudience}

Create hooks across these types: ${hookTypes.join(', ')}

Each hook should:
- Be 5-15 words max
- Stop the scroll immediately
- Feel authentic, not salesy
- Work for a UGC-style talking head video

Return as JSON array:
[
  {
    "type": "curiosity",
    "script": "The hook text here",
    "predictedScore": 0.75
  }
]

predictedScore should be 0-1 based on how viral you think it will be.
Return ONLY the JSON array, no other text.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text;
  
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse hooks:', e);
    // Return default hooks if parsing fails
    return hookTypes.slice(0, count).map(type => ({
      type,
      script: `Check out ${productName} - ${productBenefit}`,
      predictedScore: 0.5,
    }));
  }
}
