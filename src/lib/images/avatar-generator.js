// src/lib/images/avatar-generator.js
// Generate realistic UGC-style avatar images using Flux via fal.ai

// fal.ai client - initialized lazily
let falClient = null;

async function getFalClient() {
  if (falClient) return falClient;
  
  try {
    const mod = await import("@fal-ai/client");
    falClient = mod.fal || mod.default || mod;
  } catch (e1) {
    try {
      const mod = await import("@fal-ai/serverless-client");
      falClient = mod.default || mod;
    } catch (e2) {
      throw new Error("fal.ai package not found. Install with: npm install @fal-ai/client");
    }
  }
  
  if (falClient.config) {
    falClient.config({ credentials: process.env.FAL_KEY });
  }
  
  return falClient;
}

// ===========================================
// AVATAR GENERATION
// ===========================================

/**
 * Generate a realistic UGC-style avatar image
 */
export async function generateAvatarImage({
  gender, // 'female' | 'male'
  ageRange, // '18-24' | '25-30' | '30-35' | '35-40' | '40+'
  ethnicity, // 'caucasian' | 'black' | 'asian' | 'hispanic' | 'mixed'
  style, // 'warm' | 'energetic' | 'professional' | 'casual' | 'trendy'
  setting = "bedroom with natural window light",
}) {
  const prompt = buildAvatarPrompt({ gender, ageRange, ethnicity, style, setting });
  const negativePrompt = buildNegativePrompt();

  try {
    const fal = await getFalClient();
    const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
      input: {
        prompt: prompt,
        negative_prompt: negativePrompt,
        image_size: {
          width: 768,
          height: 1024, // Portrait/vertical
        },
        num_images: 1,
        guidance_scale: 3.5,
        num_inference_steps: 28,
        enable_safety_checker: true,
      },
      logs: true,
    });

    return {
      success: true,
      imageUrl: result.images[0].url,
      prompt: prompt,
    };
  } catch (error) {
    console.error("[Avatar Gen] Failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate multiple angles of the same avatar for Kling Elements
 */
export async function generateAvatarAngles({
  gender,
  ageRange,
  ethnicity,
  style,
  setting,
}) {
  const angles = [
    { name: "front", modifier: "looking directly at camera, front-facing view" },
    { name: "three_quarter", modifier: "head turned 30 degrees to the right, 3/4 view" },
    { name: "profile", modifier: "profile view, looking to the right, side of face visible" },
  ];

  const results = await Promise.all(
    angles.map(async (angle) => {
      const result = await generateAvatarImage({
        gender,
        ageRange,
        ethnicity,
        style,
        setting,
        angleModifier: angle.modifier,
      });
      return {
        angle: angle.name,
        ...result,
      };
    })
  );

  return results;
}

// ===========================================
// PROMPT BUILDING
// ===========================================

function buildAvatarPrompt({ gender, ageRange, ethnicity, style, setting, angleModifier = "" }) {
  const genderTerms = {
    female: "woman",
    male: "man",
  };

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
    mixed: "mixed ethnicity features, unique blend",
  };

  const styleDescriptions = {
    warm: "warm and friendly energy, genuine smile, approachable",
    energetic: "high energy, enthusiastic, dynamic expression",
    professional: "confident and professional, composed",
    casual: "relaxed and casual, laid-back vibe",
    trendy: "trendy Gen-Z aesthetic, stylish",
  };

  const imperfections = getRandomImperfections();
  const clothing = getClothingForStyle(style, gender);
  const hairDescription = getHairDescription(gender, ethnicity, style);

  return `A realistic UGC-style selfie photo of a ${genderTerms[gender]} in their ${ageDescriptions[ageRange]}, ${ethnicityDescriptions[ethnicity]}.

${angleModifier ? angleModifier + "." : "Looking at camera."}

Shot on iPhone 15 Pro Max in ${setting}.
Natural window light only, no flash.
Off-center, slightly imperfect framing typical of authentic selfies.
Subtle phone-camera grain and mild softness.

Skin details: visible pores on nose and cheeks, natural skin texture with slight sheen, ${imperfections.skin}.
Face details: natural facial asymmetry, ${imperfections.face}, authentic expression.
Hair: ${hairDescription}, with natural flyaways and imperfect styling.

Expression: ${styleDescriptions[style]}.
Clothing: ${clothing}.

This is authentic user-generated content - NOT stock photography, NOT AI-perfect, NOT airbrushed.
Real person energy, someone you'd actually see on TikTok or Instagram.
Photorealistic, candid, genuine.`;
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

function getRandomImperfections() {
  const skinOptions = [
    "slight sunburn across nose and cheeks",
    "a few small acne spots",
    "natural redness around nose",
    "visible pores especially in t-zone",
    "light freckles scattered across face",
    "slight uneven skin tone",
    "natural under-eye circles",
  ];

  const faceOptions = [
    "subtle crow's feet beginning at eye corners",
    "natural smile lines",
    "slightly uneven eyebrows",
    "one eye slightly smaller than the other",
    "subtle forehead lines",
    "natural lip asymmetry",
    "light dark circles under eyes",
  ];

  return {
    skin: skinOptions[Math.floor(Math.random() * skinOptions.length)],
    face: faceOptions[Math.floor(Math.random() * faceOptions.length)],
  };
}

function getClothingForStyle(style, gender) {
  const clothing = {
    warm: {
      female: "cozy oversized sweater in cream or rust color, casual and comfortable",
      male: "soft henley shirt or casual button-down, relaxed fit",
    },
    energetic: {
      female: "bright colored athletic wear or trendy casual outfit",
      male: "fitted t-shirt or athletic wear, vibrant colors",
    },
    professional: {
      female: "simple blouse or smart casual top, minimal jewelry",
      male: "clean button-down shirt or fitted polo",
    },
    casual: {
      female: "oversized t-shirt or hoodie, relaxed weekend wear",
      male: "plain t-shirt or hoodie, comfortable casual",
    },
    trendy: {
      female: "current fashion trend, layered necklaces, stylish but effortless",
      male: "streetwear inspired, modern casual, trendy accessories",
    },
  };

  return clothing[style]?.[gender] || clothing.casual[gender];
}

function getHairDescription(gender, ethnicity, style) {
  const hairStyles = {
    female: {
      caucasian: "light brown or blonde hair, natural waves or straight",
      black: "natural textured hair, could be twist-out, braids, or natural curls",
      asian: "dark black hair, straight or with subtle waves",
      hispanic: "dark wavy hair with natural body",
      mixed: "unique textured hair, could be curly or wavy",
    },
    male: {
      caucasian: "brown or dark blonde hair, slightly messy modern cut",
      black: "short fade or natural textured hair",
      asian: "black hair, textured modern style",
      hispanic: "dark wavy hair, natural style",
      mixed: "textured hair with unique pattern",
    },
  };

  const baseHair = hairStyles[gender]?.[ethnicity] || "natural hair";
  
  const messiness = style === "professional" 
    ? "neatly styled but not perfect" 
    : "slightly messy, lived-in look";

  return `${baseHair}, ${messiness}`;
}

// ===========================================
// BATCH GENERATION FOR SYSTEM AVATARS
// ===========================================

/**
 * Generate all system avatars
 */
export async function generateSystemAvatars() {
  const avatarConfigs = [
    { name: "Sarah", gender: "female", ageRange: "25-30", ethnicity: "caucasian", style: "warm" },
    { name: "Maya", gender: "female", ageRange: "18-24", ethnicity: "mixed", style: "energetic" },
    { name: "Jessica", gender: "female", ageRange: "30-35", ethnicity: "caucasian", style: "professional" },
    { name: "Aisha", gender: "female", ageRange: "25-30", ethnicity: "black", style: "warm" },
    { name: "Lily", gender: "female", ageRange: "18-24", ethnicity: "asian", style: "trendy" },
    { name: "Marcus", gender: "male", ageRange: "30-35", ethnicity: "black", style: "professional" },
    { name: "Jake", gender: "male", ageRange: "25-30", ethnicity: "caucasian", style: "casual" },
    { name: "David", gender: "male", ageRange: "40+", ethnicity: "caucasian", style: "professional" },
    { name: "Kevin", gender: "male", ageRange: "18-24", ethnicity: "asian", style: "energetic" },
    { name: "Carlos", gender: "male", ageRange: "25-30", ethnicity: "hispanic", style: "warm" },
  ];

  const results = [];

  for (const config of avatarConfigs) {
    console.log(`[Avatar Gen] Generating ${config.name}...`);
    
    const result = await generateAvatarImage({
      gender: config.gender,
      ageRange: config.ageRange,
      ethnicity: config.ethnicity,
      style: config.style,
      setting: getSettingForStyle(config.style),
    });

    results.push({
      ...config,
      ...result,
    });

    // Rate limiting - wait between generations
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}

function getSettingForStyle(style) {
  const settings = {
    warm: "cozy bedroom with soft natural light from window, warm tones",
    energetic: "bright room or gym with natural light, high energy environment",
    professional: "clean home office with natural light, modern and minimal",
    casual: "lived-in apartment with casual lighting, relaxed environment",
    trendy: "aesthetic cafe or bedroom with trendy decor, good natural light",
  };
  return settings[style] || settings.casual;
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  generateAvatarImage,
  generateAvatarAngles,
  generateSystemAvatars,
};
