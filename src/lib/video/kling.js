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
    // UPGRADED: Using Kling 3.0 endpoint
    const fal = await getFalClient();
    const result = await fal.subscribe("fal-ai/kling-video/v3/pro/image-to-video", {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("[Kling 3.0] Generation in progress...");
        }
      },
    });

    return {
      success: true,
      videoUrl: result.video.url,
      duration: duration,
      requestId: result.request_id,
      cost: KLING_COSTS[duration] || (duration * 0.14),
    };
  } catch (error) {
    console.error("[Kling 3.0] Generation failed:", error);
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
  const styleModifiers = {
    conversational: "calm, friendly delivery with natural pauses",
    energetic: "enthusiastic, excited delivery with expressive gestures",
    professional: "confident, authoritative delivery with subtle gestures",
    casual: "relaxed, laid-back delivery like talking to a friend",
  };

  return `A real-time, handheld-feel UGC video in ${setting}.

Shot on iPhone 15 Pro Max with natural lighting only.
Off-center, slightly imperfect framing typical of authentic selfie videos.
Subtle phone-camera grain and mild softness.

The person has:
- Visible pores and natural skin texture
- Facial asymmetry and natural imperfections
- Under-eye darkness and smile lines
- Controlled flyaways in hair
- Genuine expression, not performed

Delivery style: ${styleModifiers[voiceStyle] || styleModifiers.conversational}

The person looks directly at the camera lens with natural eye contact.
Natural blinking every 3-4 seconds.
Subtle hand gestures near torso.
${script ? `Speaking the following naturally: "${script}"` : ""}

Motion is fully real-time with no slow motion or stylization.
Authentic UGC-meets-documentary realism throughout.

IMPORTANT: This should look like a real person filmed this on their phone, NOT like AI-generated content or a professional production.`;
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
  hookType, // curiosity, pov, story, question, direct
}) {
  const hookStyles = {
    curiosity: {
      delivery: "intrigued, leaning in slightly, eyebrows raised",
      energy: "building suspense",
    },
    pov: {
      delivery: "relatable, knowing look, slight head tilt",
      energy: "drawing viewer in",
    },
    story: {
      delivery: "animated, expressive, setting the scene",
      energy: "storytelling mode",
    },
    question: {
      delivery: "genuinely curious, engaging directly with viewer",
      energy: "seeking connection",
    },
    direct: {
      delivery: "confident, direct eye contact, assertive",
      energy: "commanding attention",
    },
  };

  const style = hookStyles[hookType] || hookStyles.curiosity;

  const prompt = `UGC-style hook video, first 5 seconds to grab attention.

Shot on iPhone, natural lighting, off-center framing, visible skin texture.

The person delivers: "${hookScript}"

Delivery: ${style.delivery}
Energy: ${style.energy}

This is the HOOK - needs to stop the scroll immediately.
Expression changes from neutral to engaged in first second.
Direct eye contact with camera lens.
Authentic, not performed.`;

  return generateKlingVideo({
    avatarImageUrl,
    script: hookScript,
    voiceStyle: hookType === "energetic" ? "energetic" : "conversational",
    duration: 5,
    setting: "casual home environment, natural window light",
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
