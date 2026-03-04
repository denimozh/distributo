// src/lib/audio/elevenlabs.js
// ElevenLabs Text-to-Speech Integration
// Generates natural voices for AI UGC videos

import { createClient } from "@supabase/supabase-js";

const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1";

// ===========================================
// VOICE GENERATION
// ===========================================

/**
 * Generate speech from text using ElevenLabs
 * Returns audio URL stored in Supabase
 */
export async function generateSpeech({
  text,
  voiceId,
  userId,
  stability = 0.5,
  similarityBoost = 0.75,
  style = 0.5,
  speakerBoost = true,
}) {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error("ELEVENLABS_API_KEY not configured");
  }

  try {
    // Generate audio via ElevenLabs API
    const response = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: speakerBoost,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || "ElevenLabs API error");
    }

    // Get audio buffer
    const audioBuffer = await response.arrayBuffer();

    // Store in Supabase
    const audioUrl = await storeAudio(audioBuffer, userId);

    // Calculate cost (approximate)
    const characterCount = text.length;
    const cost = estimateElevenLabsCost(characterCount);

    return {
      success: true,
      audioUrl,
      duration: estimateDuration(text),
      characterCount,
      cost,
    };
  } catch (error) {
    console.error("[ElevenLabs] Generation failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate speech with streaming (for real-time playback)
 */
export async function generateSpeechStream({
  text,
  voiceId,
  onChunk,
}) {
  const response = await fetch(
    `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error("ElevenLabs streaming failed");
  }

  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    if (onChunk) onChunk(value);
  }

  return Buffer.concat(chunks);
}

/**
 * Generate multiple audio segments and combine
 * Useful for multi-shot videos
 */
export async function generateMultiSegmentAudio({
  segments, // Array of { text, voiceId, pauseAfter (ms) }
  userId,
}) {
  const audioSegments = [];

  for (const segment of segments) {
    const result = await generateSpeech({
      text: segment.text,
      voiceId: segment.voiceId,
      userId,
    });

    if (!result.success) {
      throw new Error(`Failed to generate segment: ${result.error}`);
    }

    audioSegments.push({
      audioUrl: result.audioUrl,
      duration: result.duration,
      pauseAfter: segment.pauseAfter || 0,
    });
  }

  // TODO: Combine audio segments with FFmpeg
  // For now, return the segments for individual use
  return {
    success: true,
    segments: audioSegments,
    totalDuration: audioSegments.reduce((sum, s) => sum + s.duration + (s.pauseAfter / 1000), 0),
  };
}

// ===========================================
// VOICE LIBRARY
// ===========================================

/**
 * Get available voices from ElevenLabs
 */
export async function getVoices() {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch voices");
  }

  const data = await response.json();
  return data.voices;
}

/**
 * Get voice by ID
 */
export async function getVoice(voiceId) {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices/${voiceId}`, {
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch voice");
  }

  return response.json();
}

/**
 * System voices mapped to avatars
 * These are pre-selected ElevenLabs voices that match avatar personalities
 */
export const SYSTEM_VOICES = {
  // Female voices
  sarah: {
    elevenlabsId: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    style: "warm",
    gender: "female",
  },
  maya: {
    elevenlabsId: "jBpfuIE2acCO8z3wKNLl",
    name: "Bella",
    style: "energetic",
    gender: "female",
  },
  jessica: {
    elevenlabsId: "21m00Tcm4TlvDq8ikWAM",
    name: "Rachel",
    style: "professional",
    gender: "female",
  },
  aisha: {
    elevenlabsId: "ThT5KcBeYPX3keUQqHPh",
    name: "Dorothy",
    style: "warm",
    gender: "female",
  },
  lily: {
    elevenlabsId: "jsCqWAovK2LkecY7zXl4",
    name: "Freya",
    style: "youthful",
    gender: "female",
  },
  // Male voices
  marcus: {
    elevenlabsId: "VR6AewLTigWG4xSOukaG",
    name: "Arnold",
    style: "authoritative",
    gender: "male",
  },
  jake: {
    elevenlabsId: "pqHfZKP75CvOlQylNhV4",
    name: "Bill",
    style: "casual",
    gender: "male",
  },
  david: {
    elevenlabsId: "nPczCjzI2devNBSz7Koi",
    name: "Brian",
    style: "professional",
    gender: "male",
  },
  kevin: {
    elevenlabsId: "N2lVS1w4EtoT3dr4eOWO",
    name: "Callum",
    style: "energetic",
    gender: "male",
  },
  carlos: {
    elevenlabsId: "IKne3meq5aSn9XLyUdCD",
    name: "Charlie",
    style: "warm",
    gender: "male",
  },
};

/**
 * Get voice settings based on delivery style
 */
export function getVoiceSettings(style) {
  const settings = {
    conversational: {
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.4,
    },
    energetic: {
      stability: 0.3,
      similarityBoost: 0.8,
      style: 0.7,
    },
    professional: {
      stability: 0.7,
      similarityBoost: 0.7,
      style: 0.3,
    },
    casual: {
      stability: 0.4,
      similarityBoost: 0.75,
      style: 0.5,
    },
    warm: {
      stability: 0.5,
      similarityBoost: 0.8,
      style: 0.4,
    },
  };

  return settings[style] || settings.conversational;
}

// ===========================================
// STORAGE
// ===========================================

/**
 * Store audio in Supabase Storage
 */
async function storeAudio(audioBuffer, userId) {
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

// ===========================================
// COST ESTIMATION
// ===========================================

/**
 * Estimate ElevenLabs cost based on character count
 * Creator plan: $0.30 per 1000 characters
 */
export function estimateElevenLabsCost(characterCount) {
  const COST_PER_1000_CHARS = 0.30;
  return (characterCount / 1000) * COST_PER_1000_CHARS;
}

/**
 * Estimate audio duration based on text length
 * Average speaking rate: ~150 words per minute
 * Average word length: ~5 characters
 */
export function estimateDuration(text) {
  const words = text.split(/\s+/).length;
  const minutes = words / 150;
  return Math.ceil(minutes * 60); // Return seconds
}

/**
 * Calculate total cost for a script
 */
export function calculateScriptCost(script) {
  const chars = script.length;
  const duration = estimateDuration(script);
  const elevenLabsCost = estimateElevenLabsCost(chars);

  return {
    characterCount: chars,
    estimatedDuration: duration,
    elevenLabsCost: elevenLabsCost.toFixed(4),
  };
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  generateSpeech,
  generateSpeechStream,
  generateMultiSegmentAudio,
  getVoices,
  getVoice,
  getVoiceSettings,
  estimateElevenLabsCost,
  estimateDuration,
  calculateScriptCost,
  SYSTEM_VOICES,
};
