// src/lib/video/kling.js
// Kling 3.0 Video Generation via fal.ai
// UPGRADED: Audio input, Elements feature, multi-shot native support

// fal.ai client - initialized lazily
let falClient = null;

async function getFalClient() {
  if (falClient) return falClient;
  
  try {
    // Try @fal-ai/client first (newer package)
    const mod = await import("@fal-ai/client");
    falClient = mod.fal || mod.default || mod;
  } catch (e1) {
    try {
      // Fallback to @fal-ai/serverless-client
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
// COST CONSTANTS (for margin calculations)
// ===========================================

export const KLING_COSTS = {
  5: 0.70,   // 5 seconds
  10: 1.40,  // 10 seconds
  15: 2.10,  // 15 seconds
  30: 4.20,  // 30 seconds
  60: 8.40,  // 60 seconds
};

// ===========================================
// KLING 3.0 VIDEO GENERATION
// ===========================================

/**
 * Generate a UGC-style video using Kling 3.0
 * Now supports audio input for lip-sync
 */
export async function generateKlingVideo({
  avatarImageUrl,
  script,
  audioUrl = null, // ElevenLabs audio URL for lip-sync
  voiceStyle = "conversational",
  duration = 15,
  aspectRatio = "9:16", // 9:16 (TikTok), 16:9 (YouTube), 1:1 (Feed)
  setting = "casual home environment",
}) {
  const prompt = buildUGCPrompt({
    script,
    voiceStyle,
    setting,
  });

  const input = {
    prompt: prompt,
    image_url: avatarImageUrl,
    duration: String(duration),
    aspect_ratio: aspectRatio,
  };

  // If audio URL provided, add for lip-sync
  if (audioUrl) {
    input.audio_url = audioUrl;
  }

  try {
    // Using Kling 2.1 Pro (stable, good quality)
    const fal = await getFalClient();
    const result = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("[Kling 2.1] Generation in progress...");
        }
      },
    });

    // Handle both old and new fal.ai client response shapes
    const videoUrl = result?.data?.video?.url || result?.video?.url;
    const requestId = result?.data?.request_id || result?.request_id;

    return {
      success: !!videoUrl,
      videoUrl: videoUrl,
      duration: duration,
      requestId: requestId,
      cost: KLING_COSTS[duration] || (duration * 0.14),
    };
  } catch (error) {
    console.error("[Kling] Generation failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate video with ElevenLabs audio (the main production flow)
 * 1. Audio is pre-generated and stored in Supabase
 * 2. Kling uses audio URL for perfect lip-sync
 */
export async function generateVideoWithAudio({
  avatarImageUrl,
  audioUrl,
  script,
  voiceStyle = "conversational",
  duration = 15,
  aspectRatio = "9:16",
  setting = "casual home environment",
}) {
  if (!audioUrl) {
    throw new Error("audioUrl is required for generateVideoWithAudio");
  }

  return generateKlingVideo({
    avatarImageUrl,
    script,
    audioUrl,
    voiceStyle,
    duration,
    aspectRatio,
    setting,
  });
}

/**
 * Kling 3.0 Elements feature - Character consistency
 * Upload multiple reference images for same character across videos
 */
export async function generateWithElements({
  referenceImages, // Array of 1-3 image URLs for character locking
  audioUrl,
  script,
  voiceStyle = "conversational",
  duration = 15,
  aspectRatio = "9:16",
  setting = "casual home environment",
}) {
  const prompt = buildUGCPrompt({ script, voiceStyle, setting });

  try {
    const fal = await getFalClient();
    const result = await fal.subscribe("fal-ai/kling-video/v3/pro/image-to-video", {
      input: {
        prompt: prompt,
        image_url: referenceImages[0], // Primary image
        reference_images: referenceImages, // All reference angles
        audio_url: audioUrl,
        duration: String(duration),
        aspect_ratio: aspectRatio,
        elements: {
          character_consistency: true,
        },
      },
      logs: true,
    });

    return {
      success: true,
      videoUrl: result.video.url,
      duration: duration,
      requestId: result.request_id,
      cost: KLING_COSTS[duration] || (duration * 0.14),
    };
  } catch (error) {
    console.error("[Kling 3.0 Elements] Generation failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate video with native voice (Kling 3.0 feature)
 * The model generates speech directly from the prompt
 */
export async function generateKlingVideoWithVoice({
  avatarImageUrl,
  script,
  voiceId = "Voice_1",
  voiceTone = "conversational",
  duration = 10,
  setting = "casual home environment",
}) {
  const prompt = `${buildUGCPrompt({ script: "", voiceStyle: voiceTone, setting })}

The person speaks naturally and says: "${script}"

voice_id: ${voiceId}
tone: ${voiceTone}

Speech should be natural with breathing pauses, conversational filler words, and authentic delivery. 
NOT robotic or scripted-sounding.`;

  try {
    const fal = await getFalClient();
    const result = await fal.subscribe("fal-ai/kling-video/v1.6/pro/image-to-video", {
      input: {
        prompt: prompt,
        image_url: avatarImageUrl,
        duration: String(duration),
        aspect_ratio: "9:16",
      },
      logs: true,
    });

    return {
      success: true,
      videoUrl: result.video.url,
      duration: duration,
      hasVoice: true,
    };
  } catch (error) {
    console.error("[Kling] Voice generation failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate multi-shot video (Kling 3.0 feature)
 * Creates multiple shots in a single generation
 */
export async function generateMultiShotVideo({
  avatarImageUrl,
  shots, // Array of { script, duration, shotType }
}) {
  // Build multi-shot prompt
  let multiShotPrompt = `Multi-shot UGC-style video with consistent character throughout.\n\n`;

  shots.forEach((shot, index) => {
    multiShotPrompt += `SHOT ${index + 1} (${shot.duration}s, ${shot.shotType}):
"${shot.script}"
Camera: ${getShotCamera(shot.shotType)}

`;
  });

  multiShotPrompt += `
Character consistency: Same person throughout all shots.
Style: Authentic UGC, shot on iPhone, natural lighting, imperfect framing.
Delivery: Conversational, natural pauses, genuine emotion.`;

  try {
    const fal = await getFalClient();
    const result = await fal.subscribe("fal-ai/kling-video/v1.6/pro/image-to-video", {
      input: {
        prompt: multiShotPrompt,
        image_url: avatarImageUrl,
        duration: String(shots.reduce((sum, s) => sum + s.duration, 0)),
        aspect_ratio: "9:16",
      },
      logs: true,
    });

    return {
      success: true,
      videoUrl: result.video.url,
      shots: shots.length,
    };
  } catch (error) {
    console.error("[Kling] Multi-shot generation failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// ===========================================
// PROMPT BUILDING (UGC Style)
// ===========================================

function buildUGCPrompt({ script, voiceStyle, setting }) {
  const deliveryStyles = {
    conversational: "calm and natural, like talking to a friend, occasional pauses",
    energetic: "enthusiastic but not over the top, genuine excitement",
    professional: "confident and clear, subtle hand gestures",
    casual: "relaxed and laid-back, comfortable presence",
  };

  const delivery = deliveryStyles[voiceStyle] || deliveryStyles.conversational;

  // Structure: Camera → Action → Delivery → Physical → Lighting → Motion
  return `Medium close-up shot, handheld stability with natural micro-movements.

Subject action: Person shares thoughts directly to camera, engaged and present.

Delivery style: ${delivery}

Physical: Natural appearance, casual clothing, relaxed posture. Real person, not a model.

Lighting: Soft natural daylight, ${setting || "indoor near window"}. Warm color temperature, no harsh shadows.

Motion constraints: Subtle natural movement only. Small head tilts, gentle hand gestures near torso. No exaggerated expressions or sudden movements. Natural blinking.

Style: Conversational and unrehearsed, natural speech patterns, avoid overly polished aesthetics. Real person sharing genuine thoughts, not performing.

Camera behavior: Single continuous shot. Slight handheld movement, not locked off. Natural breathing room in frame, slightly off-center composition.

${script ? `The person speaks naturally.` : ""}`;
}

function getShotCamera(shotType) {
  const cameras = {
    wide: "wide shot, full upper body visible, environment context",
    medium: "medium shot, chest up, conversational distance",
    closeup: "close-up, face fills most of frame, intimate",
    "over-shoulder": "over-the-shoulder angle, slightly behind subject",
    "low-angle": "low angle looking up, confident energy",
    "high-angle": "high angle looking down, vulnerable/relatable",
  };
  return cameras[shotType] || cameras.medium;
}

// ===========================================
// HOOK VIDEO GENERATION
// ===========================================

/**
 * Generate a hook video (first 5 seconds to grab attention)
 */
export async function generateHookVideo({
  avatarImageUrl,
  hookScript,
  hookType, // problem-solution, transformation, comparison, discovery, social-proof
}) {
  // New narrative structure types
  const hookStyles = {
    "problem-solution": {
      camera: "Medium close-up, slight push-in during realization",
      action: "Person shares a frustration then hints at solution",
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
      delivery: "Thoughtful consideration, then decisive",
    },
    "discovery": {
      camera: "Close-up reaction shot, slight movement",
      action: "Person encounters something new, processes it",
      delivery: "Curious expression shifting to impressed",
    },
    "social-proof": {
      camera: "Medium close-up, direct to camera",
      action: "Person shares experience confidently",
      delivery: "Assured, helpful, recommending to a friend",
    },
    // Legacy types (backwards compatibility)
    "curiosity": {
      camera: "Close-up, slight lean toward camera",
      action: "Person shares interesting information",
      delivery: "Eyebrows raised slightly, engaged",
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

  const style = hookStyles[hookType] || hookStyles["discovery"];

  const prompt = `${style.camera}, single continuous 5-second shot.

Subject action: ${style.action}

Delivery style: ${style.delivery}

Physical: Natural appearance, casual clothing, relaxed posture.

Lighting: Soft natural daylight from window, warm color temperature.

Motion: Subtle natural movement. Small head tilts, gentle gestures. No exaggerated expressions.

Style: Conversational and unrehearsed. Real person, not performing.

This is a HOOK video - must grab attention in the first second.`;

  return generateKlingVideo({
    avatarImageUrl,
    script: hookScript,
    voiceStyle: "conversational",
    duration: 5,
    setting: "casual home environment",
  });
}

// ===========================================
// BATCH GENERATION
// ===========================================

/**
 * Generate multiple videos in parallel (with rate limiting)
 */
export async function generateVideoBatch({
  avatarImageUrl,
  scripts, // Array of { script, type, duration }
  maxConcurrent = 3,
}) {
  const results = [];
  const queue = [...scripts];

  async function processNext() {
    if (queue.length === 0) return;

    const item = queue.shift();
    const result = await generateKlingVideo({
      avatarImageUrl,
      script: item.script,
      voiceStyle: item.type || "conversational",
      duration: item.duration || 10,
    });

    results.push({
      ...result,
      originalScript: item.script,
      type: item.type,
    });

    // Process next in queue
    await processNext();
  }

  // Start concurrent processing
  const workers = Array(Math.min(maxConcurrent, scripts.length))
    .fill(null)
    .map(() => processNext());

  await Promise.all(workers);

  return results;
}

// ===========================================
// COST ESTIMATION
// ===========================================

export function estimateKlingCost(videos) {
  // Kling 3.0 pricing via fal.ai (approximate)
  // ~$0.14 per second of video
  const COST_PER_SECOND = 0.14;

  const totalSeconds = videos.reduce((sum, v) => sum + (v.duration || 10), 0);
  const totalCost = totalSeconds * COST_PER_SECOND;

  return {
    totalVideos: videos.length,
    totalSeconds,
    estimatedCost: totalCost.toFixed(2),
    costPerVideo: (totalCost / videos.length).toFixed(2),
  };
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  generateKlingVideo,
  generateKlingVideoWithVoice,
  generateMultiShotVideo,
  generateHookVideo,
  generateVideoBatch,
  estimateKlingCost,
};
