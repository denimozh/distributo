// src/app/api/campaigns/create/route.js
// Create a new campaign and generate content

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { validateAndDeductCredits, calculateVideoCost } from "@/lib/billing/credits";
import { trackClaudeCost, trackKlingCost } from "@/lib/tracking/costs";
import { applyAuthenticityMode } from "@/lib/video/authenticity";

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
      productName,
      productBenefit,
      targetAudience,
      productUrl,
      avatarId,
      contentType,
      hookCount,
      format = "talking_head",
      duration = 15,
      authenticityMode = "natural",
    } = body;

    // Validate required fields
    if (!userId || !productName || !productBenefit || !avatarId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate required credits based on video count and duration
    const videoCount = Math.min(hookCount, 5);
    const videos = Array(videoCount).fill({
      duration,
      format,
      addCaptions: false,
      premiumVoice: false,
    });

    // Server-side atomic credit validation and deduction
    const creditResult = await validateAndDeductCredits({
      userId,
      videos,
      description: `Campaign: ${productName}`,
    });

    if (!creditResult.success) {
      return NextResponse.json(
        { 
          error: creditResult.error,
          required: creditResult.required,
          available: creditResult.available,
        },
        { status: 402 }
      );
    }

    // Create the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        name: `${productName} Campaign`,
        status: "generating",
        product_name: productName,
        product_benefit: productBenefit,
        target_audience: targetAudience,
        product_url: productUrl,
        avatar_id: avatarId,
        content_type: contentType,
        hook_count: hookCount,
        total_videos: videoCount,
        format,
        authenticity_mode: authenticityMode,
      })
      .select()
      .single();

    if (campaignError) {
      console.error("[Campaign] Creation failed:", campaignError);
      // Refund credits on failure
      const { refundCredits } = await import("@/lib/billing/credits");
      await refundCredits(userId, creditResult.creditsUsed, "Campaign creation failed");
      return NextResponse.json(
        { error: "Failed to create campaign" },
        { status: 500 }
      );
    }

    // Start async generation (don't await)
    generateCampaignContent(campaign.id, {
      productName,
      productBenefit,
      targetAudience,
      productUrl,
      avatarId,
      contentType,
      hookCount,
    }).catch(err => {
      console.error("[Campaign] Generation failed:", err);
      supabase
        .from("campaigns")
        .update({ status: "failed" })
        .eq("id", campaign.id);
    });

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      message: "Campaign created, generation started",
    });

  } catch (error) {
    console.error("[Campaign] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ===========================================
// ASYNC CONTENT GENERATION
// ===========================================

async function generateCampaignContent(campaignId, config) {
  const {
    productName,
    productBenefit,
    targetAudience,
    contentType,
    hookCount,
    avatarId,
  } = config;

  try {
    // Step 1: Generate hooks using Claude
    console.log(`[Campaign ${campaignId}] Generating ${hookCount} hooks...`);
    
    const hooks = await generateHooks({
      productName,
      productBenefit,
      targetAudience,
      contentType,
      count: hookCount,
    });

    // Save hooks to database
    const hookRecords = hooks.map(hook => ({
      campaign_id: campaignId,
      hook_type: hook.type,
      script: hook.script,
      predicted_score: hook.predictedScore,
    }));

    await supabase.from("hooks").insert(hookRecords);

    // Step 2: Select top 5 hooks for video generation
    const topHooks = hooks
      .sort((a, b) => b.predictedScore - a.predictedScore)
      .slice(0, 5);

    // Step 3: Generate videos for top hooks
    console.log(`[Campaign ${campaignId}] Generating ${topHooks.length} videos...`);

    // Get avatar info
    const { data: avatar } = await supabase
      .from("avatars")
      .select("*")
      .eq("id", avatarId)
      .single();

    let videosGenerated = 0;

    for (const hook of topHooks) {
      try {
        // Generate video (or create placeholder for now)
        const videoResult = await generateVideo({
          avatarImageUrl: avatar?.image_url,
          script: hook.script,
          hookType: hook.type,
        });

        // Save video record
        await supabase.from("videos").insert({
          campaign_id: campaignId,
          user_id: config.userId,
          title: `${hook.type} Hook - ${productName}`,
          script: hook.script,
          hook_type: hook.type,
          avatar_id: avatarId,
          video_url: videoResult.videoUrl || null,
          status: videoResult.success ? "ready" : "pending",
          duration: 10,
        });

        videosGenerated++;

        // Update campaign progress
        await supabase
          .from("campaigns")
          .update({ videos_generated: videosGenerated })
          .eq("id", campaignId);

      } catch (videoError) {
        console.error(`[Campaign ${campaignId}] Video generation failed:`, videoError);
      }
    }

    // Step 4: Mark campaign as active
    await supabase
      .from("campaigns")
      .update({
        status: "active",
        videos_generated: videosGenerated,
      })
      .eq("id", campaignId);

    console.log(`[Campaign ${campaignId}] Complete! Generated ${videosGenerated} videos.`);

  } catch (error) {
    console.error(`[Campaign ${campaignId}] Generation error:`, error);
    
    await supabase
      .from("campaigns")
      .update({ status: "failed" })
      .eq("id", campaignId);
    
    throw error;
  }
}

// ===========================================
// HOOK GENERATION (Claude)
// ===========================================

async function generateHooks({ productName, productBenefit, targetAudience, contentType, count }) {
  const hookTypes = getHookTypesForContentType(contentType);
  const hooksPerType = Math.ceil(count / hookTypes.length);

  const prompt = `You are an expert UGC content strategist. Generate scroll-stopping hooks for TikTok/Instagram Reels.

PRODUCT: ${productName}
BENEFIT: ${productBenefit}
TARGET AUDIENCE: ${targetAudience || "General consumers"}

Generate ${count} unique hooks across these types: ${hookTypes.join(", ")}

For each hook:
1. Make it conversational and authentic (like a real person talking to camera)
2. Create curiosity or emotional connection in the first 3 seconds
3. Keep it under 15 words
4. Don't sound like an ad - sound like a friend sharing a discovery

HOOK TYPES:
- curiosity: "Wait, did you know..." / "Nobody talks about this but..."
- pov: "POV: you just discovered..." / "POV: when you finally find..."
- story: "So I tried this thing and..." / "Story time: I was struggling with..."
- question: "Is it just me or..." / "Why isn't anyone talking about..."
- direct: "Stop scrolling if you..." / "You need to hear this..."

Return as JSON array:
[
  {
    "type": "curiosity",
    "script": "Wait, did you know most skincare routines are actually making your acne worse?",
    "predictedScore": 0.85
  }
]

Generate ${count} hooks total, distributed across the hook types. Predict scores from 0.5-1.0 based on viral potential.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const text = response.content[0].text;
  
  // Parse JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Failed to parse hooks from Claude response");
  }

  const hooks = JSON.parse(jsonMatch[0]);
  return hooks;
}

// ===========================================
// VIDEO GENERATION (Kling via fal.ai)
// ===========================================

async function generateVideo({ avatarImageUrl, script, hookType }) {
  // For MVP: Return placeholder - actual Kling integration requires fal.ai setup
  // TODO: Integrate real Kling 3.0 generation
  
  const hasFalKey = !!process.env.FAL_KEY;
  
  if (!hasFalKey || !avatarImageUrl) {
    console.log("[Video] Skipping generation - no FAL_KEY or avatar image");
    return {
      success: false,
      videoUrl: null,
      reason: "Video generation not configured",
    };
  }

  try {
    // Dynamic import fal.ai client
    let fal;
    try {
      const mod = await import("@fal-ai/client");
      fal = mod.fal || mod.default || mod;
    } catch (e1) {
      try {
        const mod = await import("@fal-ai/serverless-client");
        fal = mod.default || mod;
      } catch (e2) {
        console.log("[Video] fal.ai package not installed - skipping video generation");
        return {
          success: false,
          videoUrl: null,
          reason: "fal.ai package not installed",
        };
      }
    }
    
    if (fal.config) {
      fal.config({
        credentials: process.env.FAL_KEY,
      });
    }

    const ugcPrompt = buildUGCPrompt(script, hookType);

    const result = await fal.subscribe("fal-ai/kling-video/v1.6/pro/image-to-video", {
      input: {
        prompt: ugcPrompt,
        image_url: avatarImageUrl,
        duration: "10",
        aspect_ratio: "9:16",
      },
      logs: true,
    });

    return {
      success: true,
      videoUrl: result.video?.url,
    };

  } catch (error) {
    console.error("[Video] Kling generation failed:", error);
    return {
      success: false,
      videoUrl: null,
      error: error.message,
    };
  }
}

function buildUGCPrompt(script, hookType) {
  const deliveryStyles = {
    curiosity: "intrigued expression, eyebrows slightly raised, leaning in",
    pov: "relatable, knowing look, slight head tilt",
    story: "animated, expressive, setting the scene",
    question: "genuinely curious, engaging eye contact",
    direct: "confident, direct eye contact, commanding attention",
  };

  const delivery = deliveryStyles[hookType] || deliveryStyles.curiosity;

  return `UGC-style video, shot on iPhone 15 Pro Max.
Natural window light only, off-center imperfect framing.
Visible pores, natural skin texture, facial asymmetry, controlled flyaways.

The person looks at camera and speaks naturally: "${script}"

Delivery: ${delivery}
Tone: Conversational, authentic, like talking to a friend.
NOT robotic, NOT scripted-sounding, NOT too polished.

This should look like real user-generated content, not an ad.`;
}

// ===========================================
// HELPERS
// ===========================================

function getCreditsForHookCount(hookCount) {
  const pricing = {
    20: 2,
    50: 5,
    100: 10,
  };
  return pricing[hookCount] || 2;
}

function getHookTypesForContentType(contentType) {
  const types = {
    ugc: ["curiosity", "pov", "story"],
    testimonial: ["story", "direct", "question"],
    demo: ["curiosity", "direct", "question"],
    educational: ["curiosity", "question", "direct"],
    mixed: ["curiosity", "pov", "story", "question", "direct"],
  };
  return types[contentType] || types.mixed;
}
