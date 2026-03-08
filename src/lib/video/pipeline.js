// src/lib/video/pipeline.js
// Complete UGC Video Generation Pipeline
// Claude (script) → ElevenLabs (voice) → Kling (visual) → FFmpeg (mux + captions)

import { createClient } from "@supabase/supabase-js";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// ===========================================
// MAIN PIPELINE
// ===========================================

/**
 * Generate a complete UGC video with audio and captions
 * This is the main entry point for video generation
 */
export async function generateCompleteVideo({
  script,
  hookType,
  avatar,
  productName,
  productBenefit,
  targetAudience,
  userId,
  campaignId,
  options = {},
}) {
  const {
    addCaptions = true,
    captionStyle = "tiktok",
    hasProductFootage = false,
    productFootageUrl = null,
  } = options;

  const steps = [];
  let currentStep = 0;

  const updateProgress = (step, status) => {
    steps.push({ step, status, timestamp: Date.now() });
    console.log(`[Pipeline] Step ${currentStep + 1}: ${step} - ${status}`);
    currentStep++;
  };

  try {
    // Step 1: Calculate script timing
    updateProgress("timing", "Calculating speech duration");
    const timing = calculateScriptTiming(script);
    console.log(`[Pipeline] Script: ${timing.wordCount} words, ${timing.estimatedDuration}s`);

    // Step 2: Generate voiceover with ElevenLabs
    updateProgress("voiceover", "Generating voice");
    const audioResult = await generateVoiceover({
      script,
      voiceId: avatar.elevenlabs_voice_id || getDefaultVoiceForAvatar(avatar),
      userId,
    });

    if (!audioResult.success) {
      throw new Error(`Voiceover failed: ${audioResult.error}`);
    }

    // Step 3: Build Kling prompt with avatar-specific details
    updateProgress("prompt", "Building video prompt");
    const klingPrompt = buildKlingPrompt({
      hookType,
      productName,
      productBenefit,
      targetAudience,
      duration: timing.klingDuration,
      avatarOutfit: avatar.outfit_context || null,
      avatarBackground: avatar.background_context || null,
    });

    // Step 4: Generate avatar video with Kling
    updateProgress("video", "Generating avatar video");
    const videoResult = await generateKlingVideo({
      prompt: klingPrompt,
      avatarImageUrl: avatar.image_url,
      duration: timing.klingDuration,
      avatarReferences: avatar.image_references || null,
    });

    if (!videoResult.success) {
      throw new Error(`Video generation failed: ${videoResult.error}`);
    }

    // Step 5: Mux audio onto video
    updateProgress("mux", "Combining audio and video");
    const muxResult = await muxAudioVideo({
      videoUrl: videoResult.videoUrl,
      audioUrl: audioResult.audioUrl,
      userId,
    });

    if (!muxResult.success) {
      throw new Error(`Audio mux failed: ${muxResult.error}`);
    }

    let finalVideoUrl = muxResult.videoUrl;

    // Step 6: Add product footage if provided (hook + demo composite)
    if (hasProductFootage && productFootageUrl) {
      updateProgress("composite", "Adding product footage");
      const compositeResult = await compositeWithProductFootage({
        hookVideoUrl: muxResult.videoUrl,
        productFootageUrl,
        userId,
      });

      if (compositeResult.success) {
        finalVideoUrl = compositeResult.videoUrl;
      } else {
        console.warn("[Pipeline] Product composite failed, using hook-only video");
      }
    }

    // Step 7: Burn captions if enabled
    if (addCaptions) {
      updateProgress("captions", "Adding captions");
      const captionResult = await burnCaptions({
        videoUrl: finalVideoUrl,
        script,
        style: captionStyle,
        userId,
      });

      if (captionResult.success) {
        finalVideoUrl = captionResult.videoUrl;
      } else {
        console.warn("[Pipeline] Caption burn failed, using video without captions");
      }
    }

    // Step 8: Upload final video to Supabase
    updateProgress("upload", "Uploading final video");
    const uploadResult = await uploadToSupabase({
      videoUrl: finalVideoUrl,
      userId,
      campaignId,
    });

    updateProgress("complete", "Done");

    return {
      success: true,
      videoUrl: uploadResult.publicUrl,
      audioUrl: audioResult.audioUrl,
      duration: timing.estimatedDuration,
      hasAudio: true,
      hasCaptions: addCaptions,
      steps,
    };

  } catch (error) {
    console.error("[Pipeline] Generation failed:", error);
    return {
      success: false,
      error: error.message,
      steps,
    };
  }
}

// ===========================================
// SCRIPT TIMING
// ===========================================

/**
 * Calculate speech timing from script
 * Uses ~130 words per minute for natural UGC delivery
 */
export function calculateScriptTiming(script) {
  const words = script.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Natural UGC speaking rate: ~130 words per minute
  const wordsPerMinute = 130;
  const estimatedDuration = (wordCount / wordsPerMinute) * 60;
  
  // Add 0.5s buffer for Kling to avoid compressed delivery
  const klingDuration = Math.ceil(estimatedDuration + 0.5);
  
  // Clamp to valid Kling durations (5s or 10s)
  const validDuration = klingDuration <= 5 ? 5 : 10;
  
  return {
    wordCount,
    estimatedDuration: Math.round(estimatedDuration * 10) / 10,
    klingDuration: validDuration,
    buffer: validDuration - estimatedDuration,
  };
}

// ===========================================
// ELEVENLABS VOICEOVER
// ===========================================

/**
 * Generate voiceover using ElevenLabs
 */
async function generateVoiceover({ script, voiceId, userId }) {
  if (!process.env.ELEVENLABS_API_KEY) {
    console.log("[Voiceover] No ELEVENLABS_API_KEY, skipping");
    return { success: false, error: "ElevenLabs not configured" };
  }

  try {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: script,
          model_id: "eleven_turbo_v2_5", // Fast, good quality
          voice_settings: {
            stability: 0.35,       // Lower = more natural variation (was 0.4)
            similarity_boost: 0.75,
            style: 0.4,            // More style expression (was 0.3)
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail?.message || `ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    
    // Store in Supabase
    const audioUrl = await storeAudioFile(audioBuffer, userId);
    
    return {
      success: true,
      audioUrl,
      characterCount: script.length,
    };

  } catch (error) {
    console.error("[Voiceover] Generation failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get default ElevenLabs voice ID based on avatar characteristics
 */
function getDefaultVoiceForAvatar(avatar) {
  // Map avatar names to voice IDs
  const voiceMap = {
    // Female voices
    'alex': 'EXAVITQu4vr4xnSDxMaL',    // Bella - natural female
    'emma': 'EXAVITQu4vr4xnSDxMaL',    // Bella
    'lisa': 'jBpfuIE2acCO8z3wKNLl',    // Lily - warm female
    'maria': 'jBpfuIE2acCO8z3wKNLl',   // Lily
    'nina': 'ThT5KcBeYPX3keUQqHPh',    // Dorothy - friendly
    'sophie': 'jsCqWAovK2LkecY7zXl4',  // Freya - youthful
    
    // Male voices
    'chris': 'VR6AewLTigWG4xSOukaG',   // Arnold - mature male
    'david': 'nPczCjzI2devNBSz7Koi',   // Brian - professional
    'james': 'pqHfZKP75CvOlQylNhV4',   // Bill - casual
    'marcus': 'N2lVS1w4EtoT3dr4eOWO',  // Callum - energetic
  };

  const avatarName = avatar.name?.toLowerCase() || '';
  return voiceMap[avatarName] || 'pNInz6obpgDQGcFmaJgB'; // Default: Adam
}

// ===========================================
// KLING VIDEO GENERATION
// ===========================================

/**
 * Generate video using Kling via fal.ai
 */
async function generateKlingVideo({ prompt, avatarImageUrl, duration, avatarReferences }) {
  if (!process.env.FAL_KEY) {
    console.log("[Kling] No FAL_KEY, skipping");
    return { success: false, error: "fal.ai not configured" };
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
        return { success: false, error: "fal.ai package not installed" };
      }
    }

    if (fal.config) {
      fal.config({ credentials: process.env.FAL_KEY });
    }

    // Build input with optional Elements references for avatar consistency
    const input = {
      prompt,
      image_url: avatarImageUrl,
      duration: String(duration),
      aspect_ratio: "9:16",
      cfg_scale: 0.5, // Lower = more natural movement
    };

    // Add three-angle references if available (Kling Elements)
    if (avatarReferences && avatarReferences.length >= 3) {
      input.elements = {
        references: avatarReferences.slice(0, 3), // front, 3/4, side
      };
    }

    console.log("[Kling] Starting generation with prompt:", prompt.substring(0, 100) + "...");

    const result = await fal.subscribe("fal-ai/kling-video/v2.1/pro/image-to-video", {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log("[Kling] Generation in progress...");
        }
      },
    });

    const videoUrl = result?.data?.video?.url || result?.video?.url || null;

    if (!videoUrl) {
      throw new Error("No video URL in Kling response");
    }

    console.log("[Kling] Generation complete:", videoUrl);

    return {
      success: true,
      videoUrl,
    };

  } catch (error) {
    console.error("[Kling] Generation failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Build Kling prompt with imperfection cues for authentic UGC
 */
function buildKlingPrompt({ hookType, productName, productBenefit, targetAudience, duration, avatarOutfit, avatarBackground }) {
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
  };

  const structure = narrativeStructures[hookType] || narrativeStructures["discovery"];
  
  // Default outfit and background based on common use cases
  const outfit = avatarOutfit || "casual comfortable clothing - soft t-shirt or simple top, nothing polished or influencer-styled";
  const background = avatarBackground || "home environment with soft natural clutter, lived-in feel, window with natural light";

  return `${structure.camera}, single continuous shot, vertical 9:16 smartphone selfie video.

Subject action: ${structure.action}

Delivery style: ${structure.delivery}. Speaks fluidly at normal speed with confident, calm delivery. Mouth movements are precise and naturally synced.

Physical: Young adult, natural appearance, ${outfit}. Relaxed posture. Visible pores, natural skin texture with slight color variation. Hair moves naturally with head movement. No makeup or extremely minimal makeup.

Environment: ${background}.

Lighting: Soft natural daylight from window, warm color temperature. Slight soft shadows acceptable. Mild grain, slight softness like iPhone 16 Pro footage.

Motion constraints: Subtle natural movement only. Small head tilts, gentle hand gestures. Natural blinking with micro-expressions. One small breath before speaking. NO slow motion or stylization.

Imperfection cues: Slight camera shake like handheld phone. Imperfect framing typical of authentic user-generated content. Slight sunburn across nose and cheeks acceptable. Not overly polished. Relaxed, unrehearsed energy.

Camera behavior: Real-time handheld-feel shot. Camera remains steady but not locked off. Natural breathing room in frame. Person positioned in upper 60% of frame.

Duration: ${duration} seconds maintaining grounded pacing, authentic body mechanics, and clean, believable ugc-meets-documentary realism throughout.`;
}

// ===========================================
// FFMPEG OPERATIONS
// ===========================================

/**
 * Mux audio onto video using Railway FFmpeg service
 */
async function muxAudioVideo({ videoUrl, audioUrl, userId }) {
  const ffmpegUrl = process.env.RAILWAY_FFMPEG_URL;

  if (!ffmpegUrl) {
    console.log("[FFmpeg] No RAILWAY_FFMPEG_URL, returning video without audio");
    return { success: true, videoUrl, mock: true };
  }

  try {
    const response = await fetch(`${ffmpegUrl}/mux`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RAILWAY_API_KEY || ""}`,
      },
      body: JSON.stringify({
        video_url: videoUrl,
        audio_url: audioUrl,
        output_format: "mp4",
        resolution: "1080x1920", // 9:16 vertical
        fps: 30,
      }),
    });

    if (!response.ok) {
      throw new Error(`FFmpeg mux error: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      videoUrl: result.output_url,
    };

  } catch (error) {
    console.error("[FFmpeg] Mux failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Burn captions onto video using Railway FFmpeg service
 */
async function burnCaptions({ videoUrl, script, style, userId }) {
  const ffmpegUrl = process.env.RAILWAY_FFMPEG_URL;

  if (!ffmpegUrl) {
    console.log("[FFmpeg] No RAILWAY_FFMPEG_URL, returning video without captions");
    return { success: true, videoUrl, mock: true };
  }

  // Caption style configurations
  const captionStyles = {
    tiktok: {
      fontsize: 52,
      fontcolor: "white",
      fontface: "Arial Bold",
      outline: 3,
      outline_color: "black",
      position: "center,70%", // Lower third, not cut off
      words_per_line: 3,
      highlight_color: "yellow",
      animation: "pop",
    },
    minimal: {
      fontsize: 36,
      fontcolor: "white",
      fontface: "Inter",
      background: "rgba(0,0,0,0.5)",
      position: "bottom",
      words_per_line: 6,
    },
    bold: {
      fontsize: 58,
      fontcolor: "yellow",
      fontface: "Impact",
      outline: 4,
      outline_color: "black",
      position: "center",
      words_per_line: 2,
    },
  };

  const styleConfig = captionStyles[style] || captionStyles.tiktok;

  try {
    const response = await fetch(`${ffmpegUrl}/captions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RAILWAY_API_KEY || ""}`,
      },
      body: JSON.stringify({
        video_url: videoUrl,
        script: script,
        style: styleConfig,
      }),
    });

    if (!response.ok) {
      throw new Error(`FFmpeg caption error: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      videoUrl: result.output_url,
    };

  } catch (error) {
    console.error("[FFmpeg] Caption burn failed:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Composite hook video with product footage
 * Structure: [0-3s Hook] + [3-8s Product Demo] + [8-10s CTA]
 */
async function compositeWithProductFootage({ hookVideoUrl, productFootageUrl, ctaVideoUrl, userId }) {
  const ffmpegUrl = process.env.RAILWAY_FFMPEG_URL;

  if (!ffmpegUrl) {
    console.log("[FFmpeg] No RAILWAY_FFMPEG_URL, returning hook video only");
    return { success: true, videoUrl: hookVideoUrl, mock: true };
  }

  try {
    const segments = [
      { url: hookVideoUrl, duration: 3 },           // Hook segment
      { url: productFootageUrl, duration: 5 },      // Product demo
    ];

    // Add CTA segment if provided
    if (ctaVideoUrl) {
      segments.push({ url: ctaVideoUrl, duration: 2 });
    }

    const response = await fetch(`${ffmpegUrl}/composite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RAILWAY_API_KEY || ""}`,
      },
      body: JSON.stringify({
        segments,
        output_format: "mp4",
        resolution: "1080x1920",
        fps: 30,
        transition: "cut", // Hard cut, more native-feeling
      }),
    });

    if (!response.ok) {
      throw new Error(`FFmpeg composite error: ${response.status}`);
    }

    const result = await response.json();
    return {
      success: true,
      videoUrl: result.output_url,
    };

  } catch (error) {
    console.error("[FFmpeg] Composite failed:", error);
    return { success: false, error: error.message };
  }
}

// ===========================================
// STORAGE
// ===========================================

/**
 * Store audio file in Supabase Storage
 */
async function storeAudioFile(audioBuffer, userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const filename = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;

  const { error } = await supabase.storage
    .from("audio")
    .upload(filename, audioBuffer, {
      contentType: "audio/mpeg",
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Failed to store audio: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from("audio")
    .getPublicUrl(filename);

  return publicUrl;
}

/**
 * Upload final video to Supabase Storage
 */
async function uploadToSupabase({ videoUrl, userId, campaignId }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Download video from external URL
  const response = await fetch(videoUrl);
  const videoBuffer = await response.arrayBuffer();

  const filename = `${userId}/${campaignId}/${Date.now()}.mp4`;

  const { error } = await supabase.storage
    .from("videos")
    .upload(filename, videoBuffer, {
      contentType: "video/mp4",
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Failed to upload video: ${error.message}`);
  }

  const { data: { publicUrl } } = supabase.storage
    .from("videos")
    .getPublicUrl(filename);

  return { publicUrl };
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  generateCompleteVideo,
  calculateScriptTiming,
  buildKlingPrompt,
};
