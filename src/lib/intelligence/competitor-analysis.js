// src/lib/intelligence/competitor-analysis.js
// Competitor Content Analysis
// Transcribe and analyze competitor videos to extract winning patterns

import { transcribeVideo, analyzeCompetitorHook } from "@/lib/audio/whisper";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

// ===========================================
// COMPETITOR VIDEO ANALYSIS
// ===========================================

/**
 * Analyze a competitor video URL
 */
export async function analyzeCompetitorVideo(videoUrl, options = {}) {
  const { userId, category } = options;

  // Step 1: Transcribe the video
  const transcription = await analyzeCompetitorHook(videoUrl);

  if (!transcription.success) {
    return {
      success: false,
      error: transcription.error,
    };
  }

  // Step 2: Analyze with Claude
  const analysis = await analyzeWithClaude({
    fullText: transcription.fullText,
    hook: transcription.hook,
    extendedHook: transcription.extendedHook,
    duration: transcription.duration,
    category,
  });

  // Step 3: Store in insights table
  if (userId) {
    await storeCompetitorInsight(userId, {
      videoUrl,
      transcription,
      analysis,
    });
  }

  return {
    success: true,
    transcription: {
      fullText: transcription.fullText,
      hook: transcription.hook.text,
      hookWordCount: transcription.hook.wordCount,
      duration: transcription.duration,
    },
    analysis,
  };
}

/**
 * Analyze transcription with Claude
 */
async function analyzeWithClaude({ fullText, hook, extendedHook, duration, category }) {
  const prompt = `Analyze this viral UGC video script:

FULL SCRIPT:
"${fullText}"

HOOK (first 5 seconds):
"${hook.text}"

DURATION: ${duration} seconds
${category ? `CATEGORY: ${category}` : ""}

Analyze:
1. **Hook Type**: What type of hook is this? (curiosity, pov, story, question, direct, controversy)
2. **Hook Structure**: Break down why the first 3 seconds work
3. **Emotional Trigger**: What emotion does this trigger? (FOMO, curiosity, aspiration, fear, excitement)
4. **Pattern**: Identify the underlying pattern that could be replicated
5. **Key Phrases**: Extract 2-3 phrases that could be adapted
6. **Script Structure**: What's the flow? (hook → problem → solution → CTA?)
7. **Replication Score**: How easy to replicate? (1-10)
8. **Adaptation Ideas**: 2-3 ways to adapt this hook for other products

Return as JSON:
{
  "hookType": "string",
  "hookStructure": "string",
  "emotionalTrigger": "string",
  "pattern": "string",
  "keyPhrases": ["phrase1", "phrase2"],
  "scriptStructure": "string",
  "replicationScore": number,
  "adaptationIdeas": ["idea1", "idea2"]
}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text;

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("[Competitor Analysis] Failed to parse:", e);
  }

  return {
    hookType: "unknown",
    pattern: text,
    replicationScore: 5,
  };
}

/**
 * Store competitor insight
 */
async function storeCompetitorInsight(userId, data) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  await supabase.from("insights").insert({
    user_id: userId,
    insight_type: "competitor",
    title: `Competitor Hook: ${data.analysis.hookType}`,
    description: data.analysis.pattern,
    metadata: {
      videoUrl: data.videoUrl,
      transcription: data.transcription.fullText,
      hookText: data.transcription.hook.text,
      analysis: data.analysis,
    },
    confidence_score: data.analysis.replicationScore / 10,
    is_actionable: true,
    action_label: "Create variation",
    action_data: {
      adaptationIdeas: data.analysis.adaptationIdeas,
      keyPhrases: data.analysis.keyPhrases,
    },
  });
}

// ===========================================
// BATCH COMPETITOR ANALYSIS
// ===========================================

/**
 * Analyze multiple competitor videos
 */
export async function analyzeCompetitorBatch(videoUrls, userId) {
  const results = [];

  for (const url of videoUrls) {
    try {
      const result = await analyzeCompetitorVideo(url, { userId });
      results.push({
        url,
        success: result.success,
        analysis: result.analysis,
      });

      // Rate limiting - wait 2 seconds between analyses
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      results.push({
        url,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}

// ===========================================
// TREND EXTRACTION
// ===========================================

/**
 * Extract trending patterns from analyzed competitors
 */
export async function extractTrendingPatterns(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get recent competitor analyses
  const { data: insights } = await supabase
    .from("insights")
    .select("metadata")
    .eq("user_id", userId)
    .eq("insight_type", "competitor")
    .order("created_at", { ascending: false })
    .limit(20);

  if (!insights || insights.length < 5) {
    return {
      hasEnoughData: false,
      message: "Analyze more competitor videos to detect trends",
    };
  }

  // Extract patterns
  const hookTypes = {};
  const emotionalTriggers = {};
  const allKeyPhrases = [];

  for (const insight of insights) {
    const analysis = insight.metadata?.analysis;
    if (!analysis) continue;

    // Count hook types
    if (analysis.hookType) {
      hookTypes[analysis.hookType] = (hookTypes[analysis.hookType] || 0) + 1;
    }

    // Count emotional triggers
    if (analysis.emotionalTrigger) {
      emotionalTriggers[analysis.emotionalTrigger] = (emotionalTriggers[analysis.emotionalTrigger] || 0) + 1;
    }

    // Collect key phrases
    if (analysis.keyPhrases) {
      allKeyPhrases.push(...analysis.keyPhrases);
    }
  }

  // Find most common patterns
  const sortedHookTypes = Object.entries(hookTypes)
    .sort((a, b) => b[1] - a[1]);

  const sortedTriggers = Object.entries(emotionalTriggers)
    .sort((a, b) => b[1] - a[1]);

  return {
    hasEnoughData: true,
    totalAnalyzed: insights.length,
    trends: {
      dominantHookType: sortedHookTypes[0]?.[0] || null,
      hookTypeDistribution: Object.fromEntries(sortedHookTypes),
      dominantEmotionalTrigger: sortedTriggers[0]?.[0] || null,
      emotionalTriggerDistribution: Object.fromEntries(sortedTriggers),
      commonPhrases: getMostCommon(allKeyPhrases, 5),
    },
    recommendation: generateTrendRecommendation(sortedHookTypes, sortedTriggers),
  };
}

function getMostCommon(arr, n) {
  const counts = {};
  for (const item of arr) {
    const normalized = item.toLowerCase();
    counts[normalized] = (counts[normalized] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([phrase]) => phrase);
}

function generateTrendRecommendation(hookTypes, triggers) {
  if (hookTypes.length === 0) return "";

  const topHook = hookTypes[0][0];
  const topTrigger = triggers[0]?.[0] || "curiosity";

  return `Based on ${hookTypes.reduce((sum, [_, count]) => sum + count, 0)} analyzed videos, ` +
    `"${topHook}" hooks with "${topTrigger}" emotional triggers are dominating. ` +
    `Consider creating more content in this style.`;
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  analyzeCompetitorVideo,
  analyzeCompetitorBatch,
  extractTrendingPatterns,
};
