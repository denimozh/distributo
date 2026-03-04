// src/lib/video/captions.js
// Auto-Caption System
// Sends caption jobs to Railway FFmpeg service

import { transcribeAudio, formatForWordByWord, formatAsSRT } from "@/lib/audio/whisper";

// ===========================================
// CAPTION STYLES
// ===========================================

export const CAPTION_STYLES = {
  tiktok: {
    id: "tiktok",
    name: "TikTok Style",
    description: "Bold, centered, word-by-word pop",
    font: "Montserrat-ExtraBold",
    fontSize: 52,
    color: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 3,
    backgroundColor: null,
    position: "center", // center, bottom, top
    animation: "pop", // pop, fade, slide, none
    textTransform: "uppercase",
    maxWordsPerLine: 3,
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Clean, subtle, professional",
    font: "Inter-Medium",
    fontSize: 36,
    color: "#FFFFFF",
    strokeColor: null,
    strokeWidth: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    backgroundPadding: 8,
    position: "bottom",
    animation: "fade",
    textTransform: "none",
    maxWordsPerLine: 6,
  },
  bold: {
    id: "bold",
    name: "Bold Impact",
    description: "Maximum attention, high contrast",
    font: "Impact",
    fontSize: 58,
    color: "#FFFF00",
    strokeColor: "#000000",
    strokeWidth: 4,
    backgroundColor: null,
    position: "center",
    animation: "shake",
    textTransform: "uppercase",
    maxWordsPerLine: 2,
  },
  subtitle: {
    id: "subtitle",
    name: "Classic Subtitle",
    description: "Traditional subtitle look",
    font: "Arial-Bold",
    fontSize: 32,
    color: "#FFFFFF",
    strokeColor: "#000000",
    strokeWidth: 2,
    backgroundColor: "rgba(0,0,0,0.7)",
    backgroundPadding: 6,
    position: "bottom",
    animation: "none",
    textTransform: "none",
    maxWordsPerLine: 8,
  },
  gradient: {
    id: "gradient",
    name: "Gradient Pop",
    description: "Colorful, trendy, Gen-Z vibe",
    font: "Poppins-Bold",
    fontSize: 48,
    color: "gradient:#FF6B6B,#4ECDC4", // Parsed by FFmpeg service
    strokeColor: "#FFFFFF",
    strokeWidth: 2,
    backgroundColor: null,
    position: "center",
    animation: "pop",
    textTransform: "uppercase",
    maxWordsPerLine: 3,
  },
};

// ===========================================
// CAPTION GENERATION
// ===========================================

/**
 * Add captions to a video
 * Main entry point for auto-captions feature
 */
export async function addCaptionsToVideo({
  videoUrl,
  audioUrl = null, // If separate audio track
  style = "tiktok",
  customStyle = null,
}) {
  // Step 1: Transcribe
  const sourceUrl = audioUrl || videoUrl;
  const transcription = await transcribeAudio(sourceUrl);

  if (!transcription.success) {
    return {
      success: false,
      error: "Transcription failed: " + transcription.error,
    };
  }

  // Step 2: Format captions
  const captionStyle = customStyle || CAPTION_STYLES[style] || CAPTION_STYLES.tiktok;
  const captions = formatForWordByWord(transcription, {
    maxWordsPerCaption: captionStyle.maxWordsPerLine,
  });

  // Step 3: Send to FFmpeg service
  const result = await renderCaptions({
    videoUrl,
    captions,
    style: captionStyle,
  });

  return result;
}

/**
 * Send caption render job to Railway FFmpeg service
 */
async function renderCaptions({ videoUrl, captions, style }) {
  const ffmpegUrl = process.env.RAILWAY_FFMPEG_URL;

  if (!ffmpegUrl) {
    console.warn("[Captions] RAILWAY_FFMPEG_URL not set, returning mock");
    return {
      success: true,
      videoUrl: videoUrl, // Return original in dev
      captionCount: captions.length,
      mock: true,
    };
  }

  try {
    const response = await fetch(`${ffmpegUrl}/add-captions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RAILWAY_API_KEY}`,
      },
      body: JSON.stringify({
        videoUrl,
        captions,
        style,
      }),
    });

    if (!response.ok) {
      throw new Error(`FFmpeg service error: ${response.status}`);
    }

    const result = await response.json();

    return {
      success: true,
      videoUrl: result.outputUrl,
      captionCount: captions.length,
      duration: result.duration,
    };
  } catch (error) {
    console.error("[Captions] Render failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate captions without burning in
 * Returns SRT/VTT file URLs for separate caption tracks
 */
export async function generateCaptionFiles({
  videoUrl,
  audioUrl = null,
  userId,
}) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Transcribe
  const sourceUrl = audioUrl || videoUrl;
  const transcription = await transcribeAudio(sourceUrl);

  if (!transcription.success) {
    return { success: false, error: transcription.error };
  }

  // Generate SRT
  const srtContent = formatAsSRT(transcription);
  const srtFilename = `${userId}/${Date.now()}-captions.srt`;

  // Upload to Supabase
  const { error: srtError } = await supabase.storage
    .from("captions")
    .upload(srtFilename, srtContent, {
      contentType: "text/plain",
    });

  if (srtError) {
    return { success: false, error: srtError.message };
  }

  const { data: { publicUrl: srtUrl } } = supabase.storage
    .from("captions")
    .getPublicUrl(srtFilename);

  return {
    success: true,
    srtUrl,
    transcription: transcription.text,
    wordCount: transcription.words?.length || 0,
    duration: transcription.duration,
  };
}

// ===========================================
// CAPTION PREVIEW
// ===========================================

/**
 * Generate caption preview data (without video render)
 * Useful for UI preview before committing to render
 */
export async function previewCaptions({
  audioUrl,
  style = "tiktok",
}) {
  const transcription = await transcribeAudio(audioUrl);

  if (!transcription.success) {
    return { success: false, error: transcription.error };
  }

  const captionStyle = CAPTION_STYLES[style] || CAPTION_STYLES.tiktok;
  const captions = formatForWordByWord(transcription, {
    maxWordsPerCaption: captionStyle.maxWordsPerLine,
  });

  return {
    success: true,
    text: transcription.text,
    captions,
    style: captionStyle,
    totalDuration: transcription.duration,
    estimatedRenderTime: Math.ceil(transcription.duration * 2), // ~2x real-time
  };
}

// ===========================================
// BATCH OPERATIONS
// ===========================================

/**
 * Add captions to multiple videos
 */
export async function addCaptionsBatch({
  videos, // Array of { videoUrl, audioUrl?, style? }
  defaultStyle = "tiktok",
  onProgress = null,
}) {
  const results = [];

  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];

    const result = await addCaptionsToVideo({
      videoUrl: video.videoUrl,
      audioUrl: video.audioUrl,
      style: video.style || defaultStyle,
    });

    results.push({
      originalUrl: video.videoUrl,
      ...result,
    });

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
// STYLE HELPERS
// ===========================================

/**
 * Create custom caption style
 */
export function createCustomStyle(baseStyle, overrides) {
  const base = CAPTION_STYLES[baseStyle] || CAPTION_STYLES.tiktok;
  return {
    ...base,
    ...overrides,
    id: "custom",
    name: "Custom Style",
  };
}

/**
 * Get all available styles
 */
export function getAvailableStyles() {
  return Object.values(CAPTION_STYLES);
}

/**
 * Validate style configuration
 */
export function validateStyle(style) {
  const required = ["font", "fontSize", "color", "position"];
  const missing = required.filter(key => !style[key]);

  if (missing.length > 0) {
    return {
      valid: false,
      missing,
    };
  }

  return { valid: true };
}

// ===========================================
// COST ESTIMATION
// ===========================================

/**
 * Estimate caption processing cost
 * Whisper transcription + FFmpeg render
 */
export function estimateCaptionCost(durationSeconds) {
  const whisperCost = durationSeconds / 60 * 0.01; // $0.01/min
  const ffmpegCost = durationSeconds / 60 * 0.02; // $0.02/min (compute)
  
  return {
    whisper: whisperCost,
    ffmpeg: ffmpegCost,
    total: whisperCost + ffmpegCost,
    formatted: `$${(whisperCost + ffmpegCost).toFixed(4)}`,
  };
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  addCaptionsToVideo,
  generateCaptionFiles,
  previewCaptions,
  addCaptionsBatch,
  createCustomStyle,
  getAvailableStyles,
  validateStyle,
  estimateCaptionCost,
  CAPTION_STYLES,
};
