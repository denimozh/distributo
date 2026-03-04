// src/app/api/avatars/generate-system/route.js
// Generate all system avatars using fal.ai Flux
// Run this once to populate the avatars table with real images

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Avatar configurations
const AVATAR_CONFIGS = [
  {
    name: "Sarah",
    gender: "female",
    ageRange: "25-30",
    ethnicity: "caucasian",
    style: "warm",
    description: "Warm and friendly. Perfect for lifestyle and beauty content.",
    voiceId: "EXAVITQu4vr4xnSDxMaL",
    voiceName: "Sarah",
  },
  {
    name: "Maya",
    gender: "female",
    ageRange: "18-24",
    ethnicity: "mixed",
    style: "energetic",
    description: "Energetic and dynamic. Great for fitness and motivation.",
    voiceId: "jBpfuIE2acCO8z3wKNLl",
    voiceName: "Bella",
  },
  {
    name: "Jessica",
    gender: "female",
    ageRange: "30-35",
    ethnicity: "caucasian",
    style: "professional",
    description: "Professional and confident. Ideal for business and education.",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    voiceName: "Rachel",
  },
  {
    name: "Aisha",
    gender: "female",
    ageRange: "25-30",
    ethnicity: "black",
    style: "warm",
    description: "Warm and relatable. Perfect for storytelling.",
    voiceId: "ThT5KcBeYPX3keUQqHPh",
    voiceName: "Dorothy",
  },
  {
    name: "Lily",
    gender: "female",
    ageRange: "18-24",
    ethnicity: "asian",
    style: "trendy",
    description: "Youthful and trendy. Great for Gen-Z focused content.",
    voiceId: "jsCqWAovK2LkecY7zXl4",
    voiceName: "Freya",
  },
  {
    name: "Marcus",
    gender: "male",
    ageRange: "30-35",
    ethnicity: "black",
    style: "professional",
    description: "Confident and authoritative. Perfect for tech and business.",
    voiceId: "VR6AewLTigWG4xSOukaG",
    voiceName: "Arnold",
  },
  {
    name: "Jake",
    gender: "male",
    ageRange: "25-30",
    ethnicity: "caucasian",
    style: "casual",
    description: "Casual and relatable. Great for everyday product demos.",
    voiceId: "pqHfZKP75CvOlQylNhV4",
    voiceName: "Bill",
  },
  {
    name: "David",
    gender: "male",
    ageRange: "40+",
    ethnicity: "caucasian",
    style: "professional",
    description: "Professional and trustworthy. Ideal for finance and coaching.",
    voiceId: "nPczCjzI2devNBSz7Koi",
    voiceName: "Brian",
  },
  {
    name: "Kevin",
    gender: "male",
    ageRange: "18-24",
    ethnicity: "asian",
    style: "energetic",
    description: "Energetic and enthusiastic. Perfect for gaming and tech.",
    voiceId: "N2lVS1w4EtoT3dr4eOWO",
    voiceName: "Callum",
  },
  {
    name: "Carlos",
    gender: "male",
    ageRange: "25-30",
    ethnicity: "hispanic",
    style: "warm",
    description: "Warm and engaging. Great for lifestyle and food content.",
    voiceId: "IKne3meq5aSn9XLyUdCD",
    voiceName: "Charlie",
  },
];

export async function POST(request) {
  try {
    // Check for admin auth or API key
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if FAL_KEY is configured
    if (!process.env.FAL_KEY) {
      return NextResponse.json(
        { error: "FAL_KEY not configured. Set it in your environment variables." },
        { status: 500 }
      );
    }

    const results = [];
    
    for (const config of AVATAR_CONFIGS) {
      console.log(`[Avatar Gen] Generating ${config.name}...`);
      
      try {
        // Generate image using fal.ai
        const imageResult = await generateAvatarImage(config);
        
        if (imageResult.success) {
          // Upload to Supabase Storage
          const storedUrl = await uploadToStorage(
            imageResult.imageUrl,
            `avatars/${config.name.toLowerCase()}.jpg`
          );

          // Upsert avatar record
          const { data, error } = await supabase
            .from("avatars")
            .upsert({
              name: config.name,
              is_system: true,
              description: config.description,
              image_url: storedUrl || imageResult.imageUrl,
              gender: config.gender,
              age_range: config.ageRange,
              ethnicity: config.ethnicity,
              style: config.style,
              voice_id: config.voiceId,
              voice_name: config.voiceName,
            }, {
              onConflict: "name",
              ignoreDuplicates: false,
            })
            .select()
            .single();

          results.push({
            name: config.name,
            success: true,
            imageUrl: storedUrl || imageResult.imageUrl,
          });
        } else {
          results.push({
            name: config.name,
            success: false,
            error: imageResult.error,
          });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`[Avatar Gen] Failed for ${config.name}:`, error);
        results.push({
          name: config.name,
          success: false,
          error: error.message,
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Generated ${successful}/${AVATAR_CONFIGS.length} avatars`,
      results,
    });

  } catch (error) {
    console.error("[Avatar Gen] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ===========================================
// IMAGE GENERATION
// ===========================================

async function generateAvatarImage(config) {
  try {
    const fal = await import("@fal-ai/serverless-client");
    
    fal.config({
      credentials: process.env.FAL_KEY,
    });

    const prompt = buildAvatarPrompt(config);

    const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
      input: {
        prompt: prompt,
        negative_prompt: buildNegativePrompt(),
        image_size: {
          width: 768,
          height: 1024,
        },
        num_images: 1,
        guidance_scale: 3.5,
        num_inference_steps: 28,
      },
      logs: true,
    });

    return {
      success: true,
      imageUrl: result.images[0].url,
    };

  } catch (error) {
    console.error("[Avatar Gen] Flux generation failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

function buildAvatarPrompt(config) {
  const genderTerms = { female: "woman", male: "man" };
  const ageDescriptions = {
    "18-24": "early 20s, youthful",
    "25-30": "late 20s",
    "30-35": "early 30s",
    "35-40": "late 30s",
    "40+": "early 40s, mature",
  };
  const ethnicityDescriptions = {
    caucasian: "caucasian features, fair to medium skin tone",
    black: "black features, deep rich skin tone",
    asian: "east asian features",
    hispanic: "hispanic/latino features, warm skin tone",
    mixed: "mixed ethnicity features",
  };
  const styleDescriptions = {
    warm: "warm and friendly energy, genuine smile",
    energetic: "high energy, enthusiastic expression",
    professional: "confident and professional",
    casual: "relaxed and casual",
    trendy: "trendy Gen-Z aesthetic",
  };

  const imperfections = [
    "visible pores on nose and cheeks",
    "natural skin texture with slight sheen",
    "subtle facial asymmetry",
    "natural under-eye shadows",
    "authentic expression",
  ].join(", ");

  return `A realistic UGC-style selfie photo of a ${genderTerms[config.gender]} in their ${ageDescriptions[config.ageRange]}, ${ethnicityDescriptions[config.ethnicity]}.

Looking directly at camera with ${styleDescriptions[config.style]}.

Shot on iPhone 15 Pro Max with natural window light only.
Off-center, slightly imperfect framing typical of authentic selfies.
Subtle phone-camera grain and mild softness.

Skin details: ${imperfections}.
Hair with natural flyaways and imperfect styling.

This is authentic user-generated content - NOT stock photography, NOT AI-perfect, NOT airbrushed.
Real person energy, photorealistic, candid, genuine.`;
}

function buildNegativePrompt() {
  return `perfect skin, flawless skin, airbrushed, smooth skin, poreless, 
stock photo, professional photography, studio lighting, perfect lighting,
AI generated, artificial, fake, plastic, uncanny valley,
perfect symmetry, too perfect, idealized, glamour shot,
heavy makeup, filtered, beauty filter, face tune,
3D render, CGI, illustration, painting, cartoon,
blurry, low quality, distorted, deformed`;
}

// ===========================================
// STORAGE
// ===========================================

async function uploadToStorage(imageUrl, path) {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(path, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) {
      console.error("[Storage] Upload failed:", error);
      return null;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    return publicUrl;

  } catch (error) {
    console.error("[Storage] Error:", error);
    return null;
  }
}

// GET endpoint to check status
export async function GET() {
  const { data: avatars } = await supabase
    .from("avatars")
    .select("name, image_url, is_system")
    .eq("is_system", true);

  return NextResponse.json({
    count: avatars?.length || 0,
    avatars: avatars || [],
    hasFalKey: !!process.env.FAL_KEY,
  });
}
