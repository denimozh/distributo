// src/lib/video/authenticity.js
// Authenticity Mode™ - Proprietary technique to reduce AI artifacts
// This is a MARKETABLE FEATURE - sell it as a differentiator

// ===========================================
// AUTHENTICITY PRESETS
// ===========================================

export const AUTHENTICITY_MODES = {
  natural: {
    id: "natural",
    name: "Natural",
    description: "Subtle imperfections, everyday authentic look",
    icon: "✨",
    tier: "starter",
    
    // Prompt modifiers
    skin: "visible pores on nose and cheeks, natural skin texture with subtle shine, slight under-eye shadows from normal life, minor skin imperfections",
    framing: "slightly off-center framing typical of selfie videos, handheld micro-movements, not perfectly composed",
    lighting: "natural window light only, no studio lighting, slight overexposure near windows, soft shadows",
    hair: "a few controlled flyaway strands, not salon-perfect, natural movement",
    expression: "genuine micro-expressions, natural eye blinking every 3-4 seconds, authentic emotional shifts",
    environment: "lived-in background, some visual clutter, real bedroom or living room",
    
    // Negative prompt additions
    avoid: "perfect skin, airbrushed, studio lighting, symmetrical face, professional photography, stock photo, model, flawless, polished, commercial, advertisement",
    
    // Technical parameters
    settings: {
      skinSmoothing: 0.2, // 0-1, lower = more texture
      frameStability: 0.7, // Allow some natural shake
      colorGrading: "natural", // No heavy color correction
    },
  },

  raw: {
    id: "raw",
    name: "Raw",
    description: "Maximum authenticity, bedroom creator energy",
    icon: "📱",
    tier: "starter",
    
    skin: "clearly visible pores, natural shine and oil, minor blemishes acceptable, facial asymmetry, under-eye circles, real human texture",
    framing: "definitely off-center, slightly too close to camera, amateur framing mistakes, occasional partial face crop",
    lighting: "mixed harsh phone flash with room lighting, unflattering angles, slight overexposure, visible light sources",
    hair: "actual bedhead energy, messy but real, pieces falling in face, not styled",
    expression: "caught mid-thought, unpolished delivery, natural stumbles, real reactions",
    environment: "messy bedroom, unmade bed visible, real life clutter, authentic chaos",
    
    avoid: "flawless, polished, professional, studio, perfect, symmetrical, airbrushed, filtered, edited, retouched, model, influencer, curated",
    
    settings: {
      skinSmoothing: 0.0, // Zero smoothing
      frameStability: 0.4, // Very natural shake
      colorGrading: "phone", // Phone camera look
    },
  },

  polished: {
    id: "polished",
    name: "Polished",
    description: "Clean but still clearly human",
    icon: "💎",
    tier: "growth",
    
    skin: "natural texture visible, minimal imperfections, healthy look, subtle pores",
    framing: "well-composed but casual, good eye contact angle, intentional but not rigid",
    lighting: "soft natural light, flattering but real, minimal shadows",
    hair: "styled but with natural movement, touchable, not rigid",
    expression: "confident and approachable, genuine smile, professional yet warm",
    environment: "clean background, intentional but not sterile, elevated casual",
    
    avoid: "AI generated, uncanny valley, plastic, fake, over-processed, unnatural, robotic",
    
    settings: {
      skinSmoothing: 0.4,
      frameStability: 0.85,
      colorGrading: "clean",
    },
  },

  creator: {
    id: "creator",
    name: "Content Creator",
    description: "Established creator aesthetic, ring light vibes",
    icon: "🎬",
    tier: "growth",
    
    skin: "natural but well-lit skin, texture visible, healthy glow",
    framing: "centered composition, good headroom, professional selfie angle",
    lighting: "ring light aesthetic, even illumination, catchlights in eyes",
    hair: "camera-ready but touchable, intentionally styled",
    expression: "energetic, engaging, direct connection with viewer",
    environment: "curated background, aesthetic setup, creator workspace",
    
    avoid: "amateur, messy, unflattering, corporate, stock, overly edited",
    
    settings: {
      skinSmoothing: 0.35,
      frameStability: 0.9,
      colorGrading: "creator",
    },
  },

  testimonial: {
    id: "testimonial",
    name: "Real Customer",
    description: "Genuine customer testimonial energy",
    icon: "💬",
    tier: "starter",
    
    skin: "completely natural, real person skin, age-appropriate texture, no enhancement",
    framing: "phone propped up angle, not perfectly level, real video call framing",
    lighting: "whatever light is available, overhead room light, lamp light, imperfect",
    hair: "as-is, no preparation, real everyday look",
    expression: "thinking while speaking, genuine enthusiasm or concern, real emotional investment",
    environment: "real home, real kitchen or living room, personal items visible",
    
    avoid: "professional, scripted, rehearsed, perfect, polished, spokesperson, actor, model",
    
    settings: {
      skinSmoothing: 0.0,
      frameStability: 0.5,
      colorGrading: "neutral",
    },
  },
};

// ===========================================
// PROMPT BUILDING
// ===========================================

/**
 * Build authenticity-enhanced prompt
 * @param {string} basePrompt - Original generation prompt
 * @param {string} mode - Authenticity mode ID
 * @returns {object} Enhanced prompt with negative prompt
 */
export function buildAuthenticityPrompt(basePrompt, mode = "natural") {
  const settings = AUTHENTICITY_MODES[mode] || AUTHENTICITY_MODES.natural;
  
  const authenticityBlock = `
AUTHENTICITY MODE: ${settings.name}

Physical appearance:
- Skin: ${settings.skin}
- Hair: ${settings.hair}
- Expression: ${settings.expression}

Technical qualities:
- Framing: ${settings.framing}
- Lighting: ${settings.lighting}
- Environment: ${settings.environment}

CRITICAL: This must look like genuine user-generated content filmed by a real person on their phone. NOT AI-generated, NOT professional production, NOT stock footage.`;

  return {
    prompt: `${basePrompt}\n\n${authenticityBlock}`,
    negativePrompt: settings.avoid,
    settings: settings.settings,
  };
}

/**
 * Apply authenticity to existing Kling prompt
 */
export function applyAuthenticityMode(klingOptions, mode = "natural") {
  const { prompt, negativePrompt, settings } = buildAuthenticityPrompt(
    klingOptions.prompt || "",
    mode
  );

  return {
    ...klingOptions,
    prompt,
    negative_prompt: negativePrompt,
    authenticity_settings: settings,
  };
}

// ===========================================
// AVATAR-SPECIFIC AUTHENTICITY
// ===========================================

/**
 * Get recommended authenticity mode for avatar type
 */
export function getRecommendedMode(avatarStyle) {
  const recommendations = {
    energetic: "creator",
    warm: "natural",
    professional: "polished",
    casual: "raw",
    youthful: "raw",
    authoritative: "polished",
  };

  return recommendations[avatarStyle] || "natural";
}

/**
 * Build avatar-specific authenticity prompt
 */
export function buildAvatarAuthenticityPrompt(avatar, mode = null) {
  const selectedMode = mode || getRecommendedMode(avatar.style);
  const settings = AUTHENTICITY_MODES[selectedMode];

  // Avatar-specific adjustments
  const ageAdjustments = {
    young: "youthful energy, Gen-Z mannerisms, contemporary expressions",
    middle: "relatable adult, established but approachable",
    mature: "wisdom and experience, calm confidence, trustworthy presence",
  };

  const genderAdjustments = {
    female: "natural feminine energy, authentic womanhood",
    male: "natural masculine energy, authentic manhood",
    neutral: "authentic human presence",
  };

  return {
    mode: selectedMode,
    settings,
    avatarSpecific: `
Age energy: ${ageAdjustments[avatar.age_range] || ageAdjustments.middle}
Presence: ${genderAdjustments[avatar.gender] || genderAdjustments.neutral}
Character style: ${avatar.style} delivery and mannerisms`,
  };
}

// ===========================================
// QUALITY SCORING
// ===========================================

/**
 * Score authenticity of generated content
 * Used for quality control and A/B testing
 * Returns 0-100 score
 */
export function scoreAuthenticity(videoAnalysis) {
  // This would integrate with a vision model to analyze output
  // For now, return placeholder scoring logic
  
  const scores = {
    skinTexture: videoAnalysis.skinTexture || 0.5,
    framingNaturalness: videoAnalysis.framingNaturalness || 0.5,
    lightingRealism: videoAnalysis.lightingRealism || 0.5,
    expressionGenuineness: videoAnalysis.expressionGenuineness || 0.5,
    overallHumanness: videoAnalysis.overallHumanness || 0.5,
  };

  const weights = {
    skinTexture: 0.25,
    framingNaturalness: 0.15,
    lightingRealism: 0.2,
    expressionGenuineness: 0.25,
    overallHumanness: 0.15,
  };

  let totalScore = 0;
  for (const [key, weight] of Object.entries(weights)) {
    totalScore += scores[key] * weight;
  }

  return Math.round(totalScore * 100);
}

// ===========================================
// NICHE-SPECIFIC RECOMMENDATIONS
// ===========================================

export const NICHE_AUTHENTICITY = {
  tiktok_shop: {
    recommended: ["raw", "testimonial", "natural"],
    avoid: ["polished"],
    reason: "TikTok Shop buyers respond to raw, unfiltered content",
  },
  saas: {
    recommended: ["creator", "polished"],
    avoid: ["raw"],
    reason: "SaaS requires credibility while staying approachable",
  },
  ecommerce: {
    recommended: ["natural", "creator"],
    avoid: [],
    reason: "E-commerce needs balance of trust and aspiration",
  },
  personal_brand: {
    recommended: ["creator", "polished"],
    avoid: ["testimonial"],
    reason: "Personal brands need consistent, elevated presence",
  },
  indie_hacker: {
    recommended: ["raw", "natural"],
    avoid: ["polished"],
    reason: "Indie hackers connect through authenticity",
  },
  service: {
    recommended: ["natural", "polished"],
    avoid: ["raw"],
    reason: "Services need trust and professionalism",
  },
};

/**
 * Get authenticity recommendations for niche
 */
export function getNicheRecommendations(niche) {
  return NICHE_AUTHENTICITY[niche] || {
    recommended: ["natural"],
    avoid: [],
    reason: "Natural mode works for most use cases",
  };
}

// ===========================================
// EXPORTS
// ===========================================

export function getAvailableModes(userTier = "starter") {
  const tierOrder = ["free", "starter", "growth", "scale"];
  const userTierIndex = tierOrder.indexOf(userTier);

  return Object.values(AUTHENTICITY_MODES).filter((mode) => {
    const modeTierIndex = tierOrder.indexOf(mode.tier);
    return modeTierIndex <= userTierIndex;
  });
}

export default {
  AUTHENTICITY_MODES,
  buildAuthenticityPrompt,
  applyAuthenticityMode,
  getRecommendedMode,
  buildAvatarAuthenticityPrompt,
  scoreAuthenticity,
  getNicheRecommendations,
  getAvailableModes,
  NICHE_AUTHENTICITY,
};
