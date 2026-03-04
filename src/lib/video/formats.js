// src/lib/video/formats.js
// Video Format Definitions and Generation Logic
// Routes to either Kling (AI) or Railway FFmpeg (programmatic)

import { generateKlingVideo, generateVideoWithAudio, generateHookVideo } from "./kling";

// ===========================================
// FORMAT DEFINITIONS
// ===========================================

export const VIDEO_FORMATS = {
  talking_head: {
    id: "talking_head",
    name: "Talking Head UGC",
    description: "AI avatar speaks directly to camera",
    icon: "🗣️",
    provider: "kling",
    tier: "starter",
    duration: { min: 5, max: 60, default: 15 },
    aspectRatio: "9:16",
    credits: {
      5: 1,
      10: 2,
      15: 3,
      30: 6,
      60: 12,
    },
    features: ["AI-generated avatar", "Lip-sync audio", "Natural movements"],
    bestFor: ["Product testimonials", "Educational content", "Brand storytelling"],
  },

  slideshow: {
    id: "slideshow",
    name: "Product Slideshow",
    description: "Multiple images with voiceover and transitions",
    icon: "🖼️",
    provider: "ffmpeg",
    tier: "starter",
    duration: { min: 10, max: 60, default: 15 },
    aspectRatio: "9:16",
    credits: {
      15: 1,
      30: 2,
      60: 3,
    },
    features: ["Multiple product shots", "Smooth transitions", "Voiceover support"],
    bestFor: ["Product showcases", "Before/after sequences", "Feature highlights"],
    requiredInputs: ["images", "audio"],
  },

  text_hook: {
    id: "text_hook",
    name: "Text Hook Video",
    description: "Bold text animated word-by-word over background",
    icon: "💬",
    provider: "ffmpeg",
    tier: "starter",
    duration: { min: 5, max: 30, default: 10 },
    aspectRatio: "9:16",
    credits: {
      10: 1,
      15: 1,
      30: 2,
    },
    features: ["Word-by-word animation", "Eye-catching text", "Background video/image"],
    bestFor: ["Hook testing", "Attention grabbers", "Quote content"],
    requiredInputs: ["background", "captions"],
  },

  before_after: {
    id: "before_after",
    name: "Before/After",
    description: "Split-screen transformation reveal",
    icon: "↔️",
    provider: "ffmpeg",
    tier: "starter",
    duration: { min: 5, max: 15, default: 10 },
    aspectRatio: "9:16",
    credits: {
      10: 1,
      15: 2,
    },
    features: ["Dramatic reveal", "Wipe transitions", "Side-by-side comparison"],
    bestFor: ["Transformation products", "Results showcase", "Comparisons"],
    requiredInputs: ["beforeImage", "afterImage"],
  },

  static_image: {
    id: "static_image",
    name: "Static Image Ad",
    description: "Product image with text overlay and CTA",
    icon: "📸",
    provider: "ffmpeg",
    tier: "starter",
    duration: { min: 5, max: 15, default: 5 },
    aspectRatio: "9:16",
    credits: {
      5: 0.5,
      10: 1,
      15: 1,
    },
    features: ["Text overlay", "CTA button", "Quick production"],
    bestFor: ["Flash sales", "Quick promotions", "Simple announcements"],
    requiredInputs: ["image", "text", "ctaText"],
  },

  multi_shot: {
    id: "multi_shot",
    name: "Multi-Shot Ad",
    description: "Hook → Problem → Solution → CTA structure",
    icon: "🎬",
    provider: "kling",
    tier: "growth",
    duration: { min: 15, max: 60, default: 30 },
    aspectRatio: "9:16",
    credits: {
      30: 8,
      45: 12,
      60: 15,
    },
    features: ["4-shot structure", "Character consistency", "Professional ad format"],
    bestFor: ["Full ad campaigns", "Conversion-focused content", "Complete stories"],
    requiredInputs: ["hook", "problem", "solution", "cta"],
  },
};

// ===========================================
// FORMAT HELPERS
// ===========================================

/**
 * Get available formats for user's tier
 */
export function getAvailableFormats(userTier = "starter") {
  const tierOrder = ["free", "starter", "growth", "scale", "agency"];
  const userTierIndex = tierOrder.indexOf(userTier);

  return Object.values(VIDEO_FORMATS).filter((format) => {
    const formatTierIndex = tierOrder.indexOf(format.tier);
    return formatTierIndex <= userTierIndex;
  });
}

/**
 * Get format by ID
 */
export function getFormat(formatId) {
  return VIDEO_FORMATS[formatId] || null;
}

/**
 * Calculate credits for a format and duration
 */
export function calculateFormatCredits(formatId, duration) {
  const format = VIDEO_FORMATS[formatId];
  if (!format) return 0;

  // Find the closest duration bracket
  const durations = Object.keys(format.credits)
    .map(Number)
    .sort((a, b) => a - b);

  let selectedDuration = durations[durations.length - 1];
  for (const d of durations) {
    if (duration <= d) {
      selectedDuration = d;
      break;
    }
  }

  return format.credits[selectedDuration] || 0;
}

/**
 * Validate inputs for a format
 */
export function validateFormatInputs(formatId, inputs) {
  const format = VIDEO_FORMATS[formatId];
  if (!format) {
    return { valid: false, error: "Unknown format" };
  }

  if (!format.requiredInputs) {
    return { valid: true };
  }

  const missing = format.requiredInputs.filter((input) => !inputs[input]);
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required inputs: ${missing.join(", ")}`,
      missing,
    };
  }

  return { valid: true };
}

// ===========================================
// FORMAT GENERATION
// ===========================================

/**
 * Generate video based on format
 * Routes to appropriate provider (Kling or FFmpeg)
 */
export async function generateVideoByFormat({
  format,
  inputs,
  userId,
  options = {},
}) {
  const formatConfig = VIDEO_FORMATS[format];
  if (!formatConfig) {
    throw new Error(`Unknown format: ${format}`);
  }

  // Validate inputs
  const validation = validateFormatInputs(format, inputs);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Route to appropriate provider
  if (formatConfig.provider === "kling") {
    return generateWithKling(format, inputs, options);
  } else if (formatConfig.provider === "ffmpeg") {
    return generateWithFFmpeg(format, inputs, userId, options);
  }

  throw new Error(`Unknown provider: ${formatConfig.provider}`);
}

/**
 * Generate with Kling (AI video)
 */
async function generateWithKling(format, inputs, options) {
  const {
    avatarImageUrl,
    script,
    audioUrl,
    duration = 15,
    voiceStyle = "conversational",
    setting = "casual home environment",
    authenticity = "natural",
  } = inputs;

  if (format === "talking_head") {
    if (audioUrl) {
      return generateVideoWithAudio({
        avatarImageUrl,
        audioUrl,
        script,
        duration,
        voiceStyle,
        setting,
        ...options,
      });
    } else {
      return generateKlingVideo({
        avatarImageUrl,
        script,
        duration,
        voiceStyle,
        setting,
        ...options,
      });
    }
  }

  if (format === "multi_shot") {
    const { generateStructuredAd } = await import("./kling");
    return generateStructuredAd({
      avatarImageUrl,
      hook: inputs.hook,
      problem: inputs.problem,
      solution: inputs.solution,
      cta: inputs.cta,
      fullAudioUrl: audioUrl,
    });
  }

  throw new Error(`Unsupported Kling format: ${format}`);
}

/**
 * Generate with FFmpeg (Railway service)
 */
async function generateWithFFmpeg(format, inputs, userId, options) {
  const ffmpegUrl = process.env.RAILWAY_FFMPEG_URL;
  if (!ffmpegUrl) {
    throw new Error("FFmpeg service not configured");
  }

  const endpoint = `${ffmpegUrl}/${format.replace("_", "-")}`;

  const body = {
    ...inputs,
    userId,
    ...options,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RAILWAY_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "FFmpeg generation failed");
  }

  return response.json();
}

// ===========================================
// BATCH GENERATION
// ===========================================

/**
 * Generate multiple videos in batch
 */
export async function generateBatch({
  videos, // Array of { format, inputs, options }
  userId,
  onProgress = null,
}) {
  const results = [];

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];

    try {
      const result = await generateVideoByFormat({
        format: video.format,
        inputs: video.inputs,
        userId,
        options: video.options || {},
      });

      results.push({
        index: i,
        success: true,
        ...result,
      });
    } catch (error) {
      results.push({
        index: i,
        success: false,
        error: error.message,
      });
    }

    if (onProgress) {
      onProgress({
        completed: i + 1,
        total: videos.length,
        percent: Math.round(((i + 1) / videos.length) * 100),
      });
    }
  }

  return results;
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  VIDEO_FORMATS,
  getAvailableFormats,
  getFormat,
  calculateFormatCredits,
  validateFormatInputs,
  generateVideoByFormat,
  generateBatch,
};
