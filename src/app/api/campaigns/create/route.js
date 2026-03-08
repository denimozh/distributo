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
      customerReviews,
      productUrl,
      avatarId,
      contentType,
      hookCount,
      format = "talking_head",
      duration = 15,
      authenticityMode = "natural",
      productFootageUrl = null,
      hasProductFootage = false,
    } = body;

    // Validate required fields
    if (!userId || !productName || !productBenefit || !avatarId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Calculate required credits based on video count and duration
    const videoCount = 1; // Generate just 1 video for testing
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
        product_footage_url: productFootageUrl,
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
      userId,
      productName,
      productBenefit,
      targetAudience,
      customerReviews,
      productUrl,
      avatarId,
      contentType,
      hookCount,
      hasProductFootage,
      productFootageUrl,
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
    userId,
    productName,
    productBenefit,
    targetAudience,
    customerReviews,
    contentType,
    hookCount,
    avatarId,
    hasProductFootage,
    productFootageUrl,
  } = config;

  try {
    // Get user's business type from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_type")
      .eq("id", userId)
      .single();
    
    const businessType = profile?.business_type || 'ecommerce';
    
    // Fetch winning patterns for this user (from Week 3 onwards)
    const { data: winningPatterns } = await supabase
      .from("winning_patterns")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gte("confidence_score", 0.6)
      .order("avg_engagement_rate", { ascending: false })
      .limit(5);
    
    // Step 1: Generate hooks using Claude with pillars
    console.log(`[Campaign ${campaignId}] Generating ${hookCount} hooks with pillars...`);
    
    const hooks = await generateHooks({
      productName,
      productBenefit,
      targetAudience,
      customerReviews,
      contentType,
      count: hookCount,
      businessType,
      winningPatterns: winningPatterns || [],
    });

    // Save hooks to database with pillar info
    const hookRecords = hooks.map(hook => ({
      campaign_id: campaignId,
      hook_type: hook.type || hook.deliveryMechanism,
      pillar_id: hook.pillarId,
      pillar_name: hook.pillarName,
      angle: hook.angle,
      delivery_mechanism: hook.deliveryMechanism,
      script: hook.script,
      predicted_score: hook.predictedScore,
    }));

    await supabase.from("hooks").insert(hookRecords);
    
    // Save content angles for tracking
    if (hooks.some(h => h.pillarId)) {
      const angleRecords = hooks.map(hook => ({
        user_id: userId,
        campaign_id: campaignId,
        pillar_id: hook.pillarId || 'discovery',
        pillar_name: hook.pillarName || 'Discovery',
        angle_template: hook.angle || '',
        angle_personalized: hook.angle || '',
        delivery_mechanism: hook.deliveryMechanism || 'discovery',
      }));
      
      await supabase.from("content_angles").insert(angleRecords).select();
    }

    // Step 2: Select top 1 hook for video generation (testing mode)
    const topHooks = hooks
      .sort((a, b) => b.predictedScore - a.predictedScore)
      .slice(0, 1); // Just 1 video for testing

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
        // Use the complete pipeline with audio and captions
        const { generateCompleteVideo } = await import("@/lib/video/pipeline");
        
        const videoResult = await generateCompleteVideo({
          script: hook.script,
          hookType: hook.type,
          avatar: avatar || {},
          productName,
          productBenefit,
          targetAudience,
          userId,
          campaignId,
          options: {
            addCaptions: true,
            captionStyle: "tiktok",
            hasProductFootage: hasProductFootage && !!productFootageUrl,
            productFootageUrl: productFootageUrl,
          },
        });

        // Save video record
        await supabase.from("videos").insert({
          campaign_id: campaignId,
          user_id: userId,
          title: `${hook.type} Hook - ${productName}`,
          script: hook.script,
          hook_type: hook.type,
          avatar_id: avatarId,
          video_url: videoResult.videoUrl || null,
          audio_url: videoResult.audioUrl || null,
          status: videoResult.success ? "ready" : "pending",
          duration: videoResult.duration || 5,
          has_audio: videoResult.hasAudio || false,
          has_captions: videoResult.hasCaptions || false,
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
// CONTENT GENERATION (Claude with Pillars)
// ===========================================

async function generateHooks({ productName, productBenefit, targetAudience, contentType, count, customerReviews, businessType, winningPatterns }) {
  // Import pillars system
  const { selectCampaignAngles, DELIVERY_MECHANISMS, getPillarsForBusiness } = await import("@/lib/content/pillars");
  
  // Get content angles based on business type
  const selectedAngles = selectCampaignAngles(businessType || 'ecommerce', Math.ceil(count / 5));
  const pillars = getPillarsForBusiness(businessType || 'ecommerce');
  
  // Build winning patterns injection if available
  let winningPatternsSection = '';
  if (winningPatterns && winningPatterns.length > 0) {
    winningPatternsSection = `
=== WINNING PATTERNS (from your past performance data - USE THESE) ===
${winningPatterns.map(p => `- ${p.pattern_type}: "${p.pattern_value}" (${Math.round(p.avg_engagement_rate * 100)}% engagement)`).join('\n')}

Incorporate these proven patterns into your scripts. They work for this audience.
`;
  }

  // Full script architecture based on 48 Laws of UGC + Content Pillars
  const prompt = `You are an expert UGC content strategist creating hooks for TikTok/Instagram Reels.

=== CRITICAL PRINCIPLES (NEVER VIOLATE) ===
1. NEVER mention the product in the first sentence. Ever.
2. Open with IDENTITY SIGNAL or PAIN CONFESSION, not the solution.
3. 60% of the script = problem, failed attempts, frustration
4. 40% = discovery + mechanism + specific result + friend recommendation
5. Specific numbers beat vague claims ("23 pounds in 11 weeks" not "lost weight")
6. CTA must sound like a friend recommendation, never a sales pitch

=== BRIEF ===

PRODUCT: ${productName}
CORE BENEFIT: ${productBenefit}
TARGET AUDIENCE: ${targetAudience || "People interested in this product category"}
BUSINESS TYPE: ${businessType || 'ecommerce'}

${customerReviews ? `VOICE REFERENCE (use exact phrases from these real customer words):
${customerReviews}` : ''}

${winningPatternsSection}

=== CONTENT PILLARS (the strategic themes - WHAT you say) ===

${pillars.map(p => `${p.name.toUpperCase()}: ${p.description}`).join('\n')}

=== CONTENT ANGLES TO USE ===

${selectedAngles.map((a, i) => `${i + 1}. [${a.pillarName}] ${a.angle}`).join('\n')}

=== DELIVERY MECHANISMS (HOW you present each angle) ===

${Object.entries(DELIVERY_MECHANISMS).map(([key, m]) => `${key.toUpperCase()}: ${m.description}`).join('\n')}

=== THE 5-SECTION SCRIPT STRUCTURE ===

SECTION 1 — IDENTITY HOOK (first 1-2 seconds, NO product mention):
Address the target audience with their specific situation.
- "Hey if you're a [specific person]..."
- "If you've been struggling with [specific pain]..."

SECTION 2 — PAIN + FAILED ATTEMPTS (60% of script):
- State the EMOTIONAL pain, not just functional
- List 2-3 specific things they tried that didn't work
- Use language the audience actually uses

SECTION 3 — MECHANISM REVEAL (10%):
Introduce what's DIFFERENT about this solution — the mechanism, not the product name.

SECTION 4 — SPECIFIC TRANSFORMATION (20%):
Paint the vivid after-state with SPECIFIC odd numbers (23, 47, 11 — they signal real experience).

SECTION 5 — FRIEND RECOMMENDATION CTA (10%):
"I genuinely think you should try this" NOT "click the link below"

=== HARD CONSTRAINTS ===
- Each hook script should be 25-40 words total
- BANNED WORDS: "game changer", "obsessed", "amazing", "incredible", "revolutionary", "love this", "you need this", "link in bio"
- Use imperfect language: contractions, casual phrasing, sentence fragments
- Include ONE small complaint or caveat (perfect reviews sound fake)
- No hashtags or emojis
- Include skepticism preemption where natural

=== OUTPUT ===

Generate ${count} unique hook scripts. Use the content angles provided above.
Each script should combine ONE content angle with ONE delivery mechanism.

Return as JSON array only, no other text:
[
  {
    "pillarId": "myths",
    "pillarName": "Myth Busting",
    "angle": "The biggest lie about [category]",
    "deliveryMechanism": "discovery",
    "script": "Nobody told me [category] works this way until I spent $400 learning the hard way. I tried [failed attempt 1], [failed attempt 2], nothing. Then I found something that actually [mechanism]. 23 [units] in 11 weeks. Genuinely think you should check it out.",
    "predictedScore": 0.85,
    "why": "Strong identity hook, specific failed attempts, mechanism reveal, specific number"
  }
]

Predict scores 0.6-0.95 based on: identity signal strength, emotional pain depth, specificity of numbers, authenticity of language.`;

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
  
  // Map to expected format (backwards compatible)
  return hooks.map(h => ({
    ...h,
    type: h.deliveryMechanism || 'discovery', // For backwards compatibility
  }));
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

    // Use Kling 2.1 Pro (better quality than 1.6)
    const result = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
      input: {
        prompt: ugcPrompt,
        image_url: avatarImageUrl,
        duration: "5", // 5 seconds - optimal for hooks, halves cost
        aspect_ratio: "9:16",
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("[Video] Generation in progress...", update.logs);
        }
      },
    });

    // New fal.ai client returns result.data.video.url
    const videoUrl = result?.data?.video?.url || result?.video?.url || null;
    
    console.log("[Video] Generation complete:", { 
      hasData: !!result?.data,
      hasVideo: !!result?.video,
      videoUrl 
    });

    return {
      success: !!videoUrl,
      videoUrl: videoUrl,
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
  // Narrative structure types (not delivery styles)
  const narrativeStructures = {
    "problem-solution": {
      camera: "Medium close-up, slight push-in during key moment",
      action: "Person realizes something, shares discovery with viewer",
      delivery: "Shifts from frustrated to relieved expression",
    },
    "transformation": {
      camera: "Close-up face, stable handheld feel",
      action: "Person reflects on change, genuine emotional beat",
      delivery: "Warm, reflective, slight smile building",
    },
    "comparison": {
      camera: "Medium shot, casual framing",
      action: "Person weighs options, lands on preference",
      delivery: "Thoughtful consideration, then decisive nod",
    },
    "discovery": {
      camera: "Close-up reaction shot, slight movement",
      action: "Person encounters something new, processes it",
      delivery: "Curious expression shifting to impressed",
    },
    "social-proof": {
      camera: "Medium close-up, direct to camera",
      action: "Person shares experience confidently",
      delivery: "Assured, helpful, like recommending to a friend",
    },
    // Fallback for old hook types
    "curiosity": {
      camera: "Close-up, slight lean toward camera",
      action: "Person shares interesting information",
      delivery: "Eyebrows raised slightly, engaged expression",
    },
    "direct": {
      camera: "Medium close-up, stable frame",
      action: "Person makes a clear point",
      delivery: "Confident, direct eye contact",
    },
    "story": {
      camera: "Medium shot, casual handheld",
      action: "Person recounts an experience",
      delivery: "Animated, expressive, natural gestures",
    },
    "pov": {
      camera: "Close-up, intimate framing",
      action: "Person relates to viewer experience",
      delivery: "Knowing look, slight head tilt",
    },
    "question": {
      camera: "Close-up, direct address",
      action: "Person poses a question to viewer",
      delivery: "Curious, inviting response",
    },
  };

  const structure = narrativeStructures[hookType] || narrativeStructures["discovery"];

  // Build prompt: Camera → Action → Delivery → Physical → Lighting → Motion → Imperfection
  return `${structure.camera}, single continuous shot, vertical 9:16 smartphone selfie video.

Subject action: ${structure.action}

Delivery style: ${structure.delivery}

Physical: Young adult, natural appearance, casual clothing, relaxed posture. Visible pores, natural skin texture with slight color variation. Hair moves naturally with head movement.

Lighting: Soft natural daylight from window, warm color temperature. Slight soft shadows acceptable. Mild grain, slight softness like iPhone footage.

Motion constraints: Subtle natural movement only. Small head tilts, gentle hand gestures. Natural blinking with micro-expressions. One small breath before speaking. No exaggerated expressions.

Imperfection cues: Slight camera shake like handheld phone. Imperfect framing typical of authentic user-generated content. Not overly polished. Relaxed, unrehearsed energy. Looks like talking to a friend, not performing.

Camera behavior: Handheld stability with micro-movements. Natural breathing room in frame. Person positioned in upper 60% of frame.`;
}

// New hook types for Claude to use
const HOOK_TYPES = [
  "problem-solution",
  "transformation", 
  "comparison",
  "discovery",
  "social-proof",
];

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
