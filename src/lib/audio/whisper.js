// src/lib/audio/whisper.js
// Whisper Integration for Transcription + Auto-Captions
// Uses fal.ai Whisper for word-level timestamps

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
// TRANSCRIPTION
// ===========================================

/**
 * Transcribe audio with word-level timestamps
 * Used for: auto-captions, competitor analysis
 */
export async function transcribeAudio(audioUrl, options = {}) {
  const {
    language = "en",
    chunkLevel = "word", // "word" for captions, "segment" for full sentences
  } = options;

  try {
    const fal = await getFalClient();
    const result = await fal.subscribe("fal-ai/whisper", {
      input: {
        audio_url: audioUrl,
        task: "transcribe",
        language,
        chunk_level: chunkLevel,
        return_timestamps: true,
      },
      logs: true,
    });

    return {
      success: true,
      text: result.text,
      language: result.language,
      duration: result.duration,
      words: result.chunks?.map(chunk => ({
        word: chunk.text.trim(),
        start: chunk.timestamp[0],
        end: chunk.timestamp[1],
      })) || [],
      segments: result.segments || [],
    };
  } catch (error) {
    console.error("[Whisper] Transcription failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Transcribe video URL (extracts audio automatically)
 */
export async function transcribeVideo(videoUrl, options = {}) {
  // fal.ai Whisper accepts video URLs directly
  return transcribeAudio(videoUrl, options);
}

/**
 * Quick transcription (segments only, faster)
 */
export async function quickTranscribe(audioUrl) {
  return transcribeAudio(audioUrl, { chunkLevel: "segment" });
}

// ===========================================
// COMPETITOR ANALYSIS
// ===========================================

/**
 * Analyze competitor video hook
 * Transcribes and extracts the hook structure
 */
export async function analyzeCompetitorHook(videoUrl) {
  const transcription = await transcribeVideo(videoUrl);

  if (!transcription.success) {
    return transcription;
  }

  // Extract first 5 seconds as the "hook"
  const hookWords = transcription.words.filter(w => w.end <= 5);
  const hookText = hookWords.map(w => w.word).join(" ");

  // Extract first 10 seconds as "extended hook"
  const extendedHookWords = transcription.words.filter(w => w.end <= 10);
  const extendedHookText = extendedHookWords.map(w => w.word).join(" ");

  return {
    success: true,
    fullText: transcription.text,
    duration: transcription.duration,
    hook: {
      text: hookText,
      wordCount: hookWords.length,
      duration: hookWords.length > 0 ? hookWords[hookWords.length - 1].end : 0,
    },
    extendedHook: {
      text: extendedHookText,
      wordCount: extendedHookWords.length,
      duration: extendedHookWords.length > 0 ? extendedHookWords[extendedHookWords.length - 1].end : 0,
    },
    words: transcription.words,
  };
}

/**
 * Batch analyze multiple competitor videos
 */
export async function analyzeCompetitorBatch(videoUrls, maxConcurrent = 3) {
  const results = [];
  const queue = [...videoUrls];

  async function processNext() {
    if (queue.length === 0) return;
    
    const url = queue.shift();
    const result = await analyzeCompetitorHook(url);
    results.push({ url, ...result });
    
    await processNext();
  }

  const workers = Array(Math.min(maxConcurrent, videoUrls.length))
    .fill(null)
    .map(() => processNext());

  await Promise.all(workers);

  return results;
}

// ===========================================
// CAPTION FORMATTING
// ===========================================

/**
 * Format transcription for SRT subtitles
 */
export function formatAsSRT(transcription) {
  if (!transcription.words || transcription.words.length === 0) {
    return "";
  }

  const lines = [];
  let lineNumber = 1;
  let currentLine = [];
  let lineStart = null;

  for (const word of transcription.words) {
    if (lineStart === null) {
      lineStart = word.start;
    }

    currentLine.push(word.word);

    // New line every 5-7 words or at natural pauses
    const shouldBreak = 
      currentLine.length >= 6 ||
      (word.end - lineStart > 2.5) || // Max 2.5 seconds per line
      word.word.match(/[.!?]$/); // End of sentence

    if (shouldBreak) {
      const lineEnd = word.end;
      lines.push(formatSRTEntry(lineNumber, lineStart, lineEnd, currentLine.join(" ")));
      lineNumber++;
      currentLine = [];
      lineStart = null;
    }
  }

  // Handle remaining words
  if (currentLine.length > 0) {
    const lastWord = transcription.words[transcription.words.length - 1];
    lines.push(formatSRTEntry(lineNumber, lineStart, lastWord.end, currentLine.join(" ")));
  }

  return lines.join("\n\n");
}

function formatSRTEntry(number, start, end, text) {
  return `${number}
${formatSRTTime(start)} --> ${formatSRTTime(end)}
${text}`;
}

function formatSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
}

function pad(num, size = 2) {
  return String(num).padStart(size, "0");
}

/**
 * Format transcription for VTT (Web Video Text Tracks)
 */
export function formatAsVTT(transcription) {
  const srt = formatAsSRT(transcription);
  const vtt = srt.replace(/,(\d{3})/g, ".$1"); // SRT uses comma, VTT uses period
  return `WEBVTT\n\n${vtt}`;
}

/**
 * Format for word-by-word captions (TikTok style)
 * Returns array of caption events for FFmpeg
 */
export function formatForWordByWord(transcription, options = {}) {
  const {
    maxWordsPerCaption = 3,
    minDuration = 0.3, // Minimum time to show each caption
  } = options;

  if (!transcription.words || transcription.words.length === 0) {
    return [];
  }

  const captions = [];
  let currentGroup = [];
  let groupStart = null;

  for (let i = 0; i < transcription.words.length; i++) {
    const word = transcription.words[i];
    
    if (groupStart === null) {
      groupStart = word.start;
    }

    currentGroup.push(word);

    const shouldBreak = 
      currentGroup.length >= maxWordsPerCaption ||
      i === transcription.words.length - 1 ||
      (transcription.words[i + 1]?.start - word.end > 0.5); // Pause > 0.5s

    if (shouldBreak) {
      const duration = Math.max(
        word.end - groupStart,
        minDuration
      );

      captions.push({
        text: currentGroup.map(w => w.word).join(" "),
        start: groupStart,
        end: groupStart + duration,
        words: currentGroup.map(w => w.word),
      });

      currentGroup = [];
      groupStart = null;
    }
  }

  return captions;
}

// ===========================================
// COST ESTIMATION
// ===========================================

/**
 * Estimate Whisper cost
 * fal.ai Whisper: ~$0.01 per minute of audio
 */
export function estimateWhisperCost(durationSeconds) {
  const COST_PER_MINUTE = 0.01;
  const minutes = durationSeconds / 60;
  return minutes * COST_PER_MINUTE;
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  transcribeAudio,
  transcribeVideo,
  quickTranscribe,
  analyzeCompetitorHook,
  analyzeCompetitorBatch,
  formatAsSRT,
  formatAsVTT,
  formatForWordByWord,
  estimateWhisperCost,
};
