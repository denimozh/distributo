// scripts/generate-avatars.js
// Run this once to generate images for system avatars
// Usage: node scripts/generate-avatars.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require("@supabase/supabase-js");

// ===========================================
// CONFIGURATION
// ===========================================
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FAL_KEY = process.env.FAL_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// ===========================================
// AVATAR DEFINITIONS - Ultra Realistic UGC Style
// Using exact imperfection key phrases from viral UGC guide
// ===========================================

// Master imperfection suffix - include ALL key phrases
const IMPERFECTION_MASTER = `Shot on iPhone 15 Pro Max. Natural window light only. Off-center, slightly imperfect framing. Subtle phone-camera grain. Visible pores. Uneven skin texture. Facial asymmetry. Under-eye darkness. Smile lines. Mild nose redness. Controlled flyaways in the hair.`;

const AVATAR_PROMPTS = {
  // Female avatars
  Emma: {
    prompt: `Casual selfie of a friendly young white woman, age 25, warm genuine smile, brown hair, casual sweater. ${IMPERFECTION_MASTER}`,
    gender: "female",
    style: "warm",
  },
  Sophie: {
    prompt: `Energetic selfie of a young white woman, age 23, bright natural smile, blonde hair in messy ponytail, athletic wear. ${IMPERFECTION_MASTER}`,
    gender: "female",
    style: "energetic",
  },
  Lisa: {
    prompt: `Professional selfie of an Asian woman, age 32, confident slight smile, black hair, business casual blouse. ${IMPERFECTION_MASTER}`,
    gender: "female",
    style: "professional",
  },
  Maria: {
    prompt: `Relaxed home selfie of a Latina woman, age 26, casual genuine smile, dark wavy hair, simple t-shirt. ${IMPERFECTION_MASTER}`,
    gender: "female",
    style: "casual",
  },
  Nina: {
    prompt: `Warm selfie of a Black woman, age 30, genuine friendly smile, natural curly hair, earth tone top. ${IMPERFECTION_MASTER}`,
    gender: "female",
    style: "warm",
  },
  // Male avatars
  James: {
    prompt: `Professional selfie of a white man, age 35, friendly expression, short brown hair, business casual shirt. ${IMPERFECTION_MASTER}`,
    gender: "male",
    style: "professional",
  },
  Marcus: {
    prompt: `Energetic selfie of a young Black man, age 24, enthusiastic smile, short fade haircut, casual hoodie. ${IMPERFECTION_MASTER}`,
    gender: "male",
    style: "energetic",
  },
  David: {
    prompt: `Relaxed home selfie of a white man, age 29, genuine casual smile, brown hair slightly messy, henley shirt. ${IMPERFECTION_MASTER}`,
    gender: "male",
    style: "casual",
  },
  Alex: {
    prompt: `Friendly selfie of an Asian man, age 27, warm welcoming smile, black hair casually styled, casual shirt. ${IMPERFECTION_MASTER}`,
    gender: "male",
    style: "warm",
  },
  Chris: {
    prompt: `Confident selfie of a mature white man, age 45, knowing slight smile, salt and pepper hair, polo shirt. ${IMPERFECTION_MASTER}`,
    gender: "male",
    style: "authoritative",
  },
};

// ===========================================
// MAIN FUNCTION
// ===========================================
async function generateAvatarImages() {
  console.log("🎨 Starting avatar image generation...\n");

  // Get system avatars from database
  const { data: avatars, error } = await supabase
    .from("avatars")
    .select("*")
    .eq("is_system", true);

  if (error) {
    console.error("❌ Failed to fetch avatars:", error.message);
    return;
  }

  console.log(`Found ${avatars.length} system avatars\n`);

  let successCount = 0;
  let failCount = 0;

  for (const avatar of avatars) {
    const promptConfig = AVATAR_PROMPTS[avatar.name];
    
    if (!promptConfig) {
      console.log(`⚠️  No prompt defined for "${avatar.name}", skipping...`);
      continue;
    }

    // FORCE REGENERATE - don't skip existing
    // if (avatar.image_url) {
    //   console.log(`✓ ${avatar.name} already has image, skipping...`);
    //   successCount++;
    //   continue;
    // }

    console.log(`🖼️  Generating image for ${avatar.name}...`);

    try {
      // Generate image with Flux via fal.ai
      const imageUrl = await generateWithFlux(promptConfig.prompt);
      
      if (!imageUrl) {
        console.log(`❌ Failed to generate image for ${avatar.name}`);
        failCount++;
        continue;
      }

      // Download and upload to Supabase
      const publicUrl = await uploadToSupabase(imageUrl, avatar.id, avatar.name);

      if (!publicUrl) {
        console.log(`❌ Failed to upload image for ${avatar.name}`);
        failCount++;
        continue;
      }

      // Update avatar record
      const { error: updateError } = await supabase
        .from("avatars")
        .update({ image_url: publicUrl })
        .eq("id", avatar.id);

      if (updateError) {
        console.log(`❌ Failed to update ${avatar.name}:`, updateError.message);
        failCount++;
        continue;
      }

      console.log(`✅ ${avatar.name} complete!`);
      successCount++;

      // Rate limiting - wait 2 seconds between generations
      await sleep(2000);

    } catch (err) {
      console.log(`❌ Error with ${avatar.name}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`========================================\n`);
}

// ===========================================
// NANO BANANA 2 IMAGE GENERATION
// ===========================================
async function generateWithFlux(prompt) {
  try {
    console.log("  Calling Nano Banana 2...");
    
    // Use Nano Banana 2 for more realistic results
    const response = await fetch("https://fal.run/fal-ai/nano-banana-2", {
      method: "POST",
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
        num_images: 1,
        aspect_ratio: "1:1",
        output_format: "png",
        resolution: "1K",
      }),
    });

    const responseText = await response.text();
    console.log("  Response status:", response.status);
    
    if (!response.ok) {
      console.log("  Error response:", responseText.substring(0, 200));
      throw new Error(`Nano Banana 2 API error (${response.status}): ${responseText}`);
    }

    const data = JSON.parse(responseText);
    const imageUrl = data.images?.[0]?.url;
    console.log("  Got image URL:", imageUrl?.substring(0, 50) + "...");
    
    return imageUrl;
  } catch (err) {
    console.log("  Full error:", err.message);
    throw err;
  }
}

async function pollForResult(requestId) {
  const maxAttempts = 30;
  
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(2000);
    
    const response = await fetch(`https://queue.fal.run/fal-ai/flux/schnell/requests/${requestId}/status`, {
      headers: {
        "Authorization": `Key ${FAL_KEY}`,
      },
    });

    const responseText = await response.text();
    console.log(`  Poll ${i + 1}: ${responseText.substring(0, 100)}`);
    
    const data = JSON.parse(responseText);

    if (data.status === "COMPLETED") {
      // Fetch the result
      const resultResponse = await fetch(`https://queue.fal.run/fal-ai/flux/schnell/requests/${requestId}`, {
        headers: {
          "Authorization": `Key ${FAL_KEY}`,
        },
      });
      const resultText = await resultResponse.text();
      console.log(`  Result: ${resultText.substring(0, 150)}`);
      const result = JSON.parse(resultText);
      return result.images?.[0]?.url;
    }

    if (data.status === "FAILED") {
      throw new Error("Image generation failed");
    }

    process.stdout.write(".");
  }

  throw new Error("Timeout waiting for image generation");
}

// ===========================================
// UPLOAD TO SUPABASE STORAGE
// ===========================================
async function uploadToSupabase(imageUrl, avatarId, avatarName) {
  // Download image
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase storage
  const filename = `system/${avatarName.toLowerCase()}-${avatarId.substring(0, 8)}.png`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filename, buffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

// ===========================================
// HELPERS
// ===========================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ===========================================
// RUN
// ===========================================
generateAvatarImages().catch(console.error);