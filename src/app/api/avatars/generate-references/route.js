// src/app/api/avatars/generate-references/route.js
// Generate three-angle reference images for avatar consistency (Kling Elements)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { avatarId, baseImageUrl, userId } = await request.json();

    if (!avatarId || !baseImageUrl) {
      return NextResponse.json(
        { error: "avatarId and baseImageUrl required" },
        { status: 400 }
      );
    }

    console.log(`[Avatar References] Generating three angles for avatar ${avatarId}`);

    // Get avatar details
    const { data: avatar } = await supabase
      .from("avatars")
      .select("*")
      .eq("id", avatarId)
      .single();

    if (!avatar) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    // Generate three-angle references using fal.ai image model
    const references = await generateThreeAngles(baseImageUrl, avatar.name);

    if (!references.success) {
      return NextResponse.json(
        { error: references.error },
        { status: 500 }
      );
    }

    // Update avatar with reference images
    const { error: updateError } = await supabase
      .from("avatars")
      .update({
        image_front: references.front,
        image_side: references.side,
        image_profile: references.profile,
        physical_description: references.description,
      })
      .eq("id", avatarId);

    if (updateError) {
      console.error("[Avatar References] Update failed:", updateError);
      return NextResponse.json(
        { error: "Failed to update avatar" },
        { status: 500 }
      );
    }

    console.log(`[Avatar References] Generated successfully for avatar ${avatarId}`);

    return NextResponse.json({
      success: true,
      references: {
        front: references.front,
        side: references.side,
        profile: references.profile,
      },
      description: references.description,
    });

  } catch (error) {
    console.error("[Avatar References] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Generate three-angle reference images from a base image
 * Uses fal.ai image-to-image to create consistent angle variations
 */
async function generateThreeAngles(baseImageUrl, avatarName) {
  if (!process.env.FAL_KEY) {
    console.log("[Avatar References] No FAL_KEY, using base image for all angles");
    return {
      success: true,
      front: baseImageUrl,
      side: baseImageUrl,
      profile: baseImageUrl,
      description: `${avatarName}, photorealistic portrait`,
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
        return {
          success: true,
          front: baseImageUrl,
          side: baseImageUrl,
          profile: baseImageUrl,
          description: `${avatarName}, photorealistic portrait`,
        };
      }
    }

    if (fal.config) {
      fal.config({ credentials: process.env.FAL_KEY });
    }

    // Generate front view (clean, straight-on)
    const frontResult = await fal.subscribe("fal-ai/flux-pro/v1.1", {
      input: {
        prompt: `Portrait photo of ${avatarName}, looking directly at camera, neutral expression, soft natural lighting, professional headshot style, photorealistic, high quality, 8k`,
        image_url: baseImageUrl,
        strength: 0.3, // Low strength to maintain likeness
        num_images: 1,
      },
    });

    // Generate 3/4 view
    const sideResult = await fal.subscribe("fal-ai/flux-pro/v1.1", {
      input: {
        prompt: `Portrait photo of ${avatarName}, three-quarter view, looking slightly to the left, natural expression, soft natural lighting, photorealistic, high quality, 8k`,
        image_url: baseImageUrl,
        strength: 0.35,
        num_images: 1,
      },
    });

    // Generate profile view
    const profileResult = await fal.subscribe("fal-ai/flux-pro/v1.1", {
      input: {
        prompt: `Side profile portrait of ${avatarName}, looking left, natural expression, soft natural lighting, photorealistic, high quality, 8k`,
        image_url: baseImageUrl,
        strength: 0.4,
        num_images: 1,
      },
    });

    const frontUrl = frontResult?.data?.images?.[0]?.url || frontResult?.images?.[0]?.url || baseImageUrl;
    const sideUrl = sideResult?.data?.images?.[0]?.url || sideResult?.images?.[0]?.url || baseImageUrl;
    const profileUrl = profileResult?.data?.images?.[0]?.url || profileResult?.images?.[0]?.url || baseImageUrl;

    // Generate physical description for Kling Elements
    const description = await generatePhysicalDescription(baseImageUrl, avatarName, fal);

    return {
      success: true,
      front: frontUrl,
      side: sideUrl,
      profile: profileUrl,
      description,
    };

  } catch (error) {
    console.error("[Avatar References] Generation failed:", error);
    // Fallback to base image
    return {
      success: true,
      front: baseImageUrl,
      side: baseImageUrl,
      profile: baseImageUrl,
      description: `${avatarName}, photorealistic portrait`,
    };
  }
}

/**
 * Generate physical description for consistent Kling Elements
 */
async function generatePhysicalDescription(imageUrl, avatarName, fal) {
  try {
    // Use vision model to analyze the image
    const result = await fal.subscribe("fal-ai/llavav15-13b", {
      input: {
        image_url: imageUrl,
        prompt: "Describe this person's physical appearance in one sentence, including: approximate age, hair color and style, skin tone, and any distinguishing features. Be concise and factual.",
      },
    });

    const description = result?.data?.output || result?.output || `${avatarName}, natural appearance`;
    return description.substring(0, 200); // Limit length
  } catch (error) {
    console.log("[Avatar References] Description generation failed, using default");
    return `${avatarName}, natural appearance, photorealistic portrait`;
  }
}

// ===========================================
// GET - Retrieve avatar references
// ===========================================

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const avatarId = searchParams.get("id");

  if (!avatarId) {
    return NextResponse.json({ error: "Avatar ID required" }, { status: 400 });
  }

  const { data: avatar, error } = await supabase
    .from("avatars")
    .select("id, name, image_url, image_front, image_side, image_profile, physical_description, elevenlabs_voice_id")
    .eq("id", avatarId)
    .single();

  if (error || !avatar) {
    return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: avatar.id,
    name: avatar.name,
    primaryImage: avatar.image_url,
    references: {
      front: avatar.image_front,
      side: avatar.image_side,
      profile: avatar.image_profile,
    },
    physicalDescription: avatar.physical_description,
    voiceId: avatar.elevenlabs_voice_id,
    hasAllReferences: !!(avatar.image_front && avatar.image_side && avatar.image_profile),
  });
}
