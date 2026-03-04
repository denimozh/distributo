// src/lib/intelligence/feedback-loop.js
// Performance Feedback Injection
// Uses winning patterns to improve future content generation

import { createClient } from "@supabase/supabase-js";

// ===========================================
// FEEDBACK EXTRACTION
// ===========================================

/**
 * Get performance insights to inject into prompts
 */
export async function getPerformanceFeedback(userId, platform = "tiktok") {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get hook performance
  const { data: hookPerformance } = await supabase
    .from("hook_performance")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .order("avg_performance_score", { ascending: false });

  // Get top performing videos with full scripts
  const { data: winners } = await supabase
    .from("videos")
    .select("id, script, hook_type, performance_score")
    .eq("user_id", userId)
    .eq("is_winner", true)
    .order("performance_score", { ascending: false })
    .limit(5);

  // Get avatar performance
  const { data: avatarPerformance } = await supabase
    .from("avatar_performance")
    .select("*, avatars (name, style)")
    .eq("user_id", userId)
    .eq("platform", platform)
    .order("avg_performance_score", { ascending: false });

  // Build feedback object
  const feedback = {
    hasData: (hookPerformance?.length || 0) > 0,
    hookTypes: {
      best: hookPerformance?.[0]?.hook_type || null,
      worst: hookPerformance?.[hookPerformance?.length - 1]?.hook_type || null,
      rankings: hookPerformance?.map(h => ({
        type: h.hook_type,
        score: h.avg_performance_score,
        winRate: h.win_rate,
        sampleSize: h.sample_size,
      })) || [],
    },
    winners: winners?.map(v => ({
      script: v.script,
      hookType: v.hook_type,
      score: v.performance_score,
    })) || [],
    avatars: {
      best: avatarPerformance?.[0]?.avatars?.name || null,
      bestStyle: avatarPerformance?.[0]?.avatars?.style || null,
    },
    platform,
  };

  return feedback;
}

/**
 * Build feedback prompt section for Claude
 */
export function buildFeedbackPrompt(feedback) {
  if (!feedback.hasData) {
    return "";
  }

  let prompt = "\n\n--- PERFORMANCE INSIGHTS FROM YOUR ACCOUNT ---\n";

  // Hook type performance
  if (feedback.hookTypes.rankings.length > 0) {
    prompt += "\nHOOK TYPE PERFORMANCE (based on your audience data):\n";

    for (const hook of feedback.hookTypes.rankings) {
      const emoji = hook.score >= 0.7 ? "🟢" : hook.score >= 0.4 ? "🟡" : "🔴";
      prompt += `${emoji} ${hook.type}: ${(hook.score * 100).toFixed(0)}% avg score, ${(hook.winRate * 100).toFixed(0)}% win rate (${hook.sampleSize} videos)\n`;
    }

    if (feedback.hookTypes.best) {
      prompt += `\n⭐ Your best performing hook type is "${feedback.hookTypes.best}" - lean into this style.\n`;
    }

    if (feedback.hookTypes.worst && feedback.hookTypes.rankings.length >= 3) {
      prompt += `⚠️ Your "${feedback.hookTypes.worst}" hooks underperform - avoid or reinvent this style.\n`;
    }
  }

  // Winning scripts
  if (feedback.winners.length > 0) {
    prompt += "\nYOUR TOP PERFORMING SCRIPTS (learn from these patterns):\n";

    for (const winner of feedback.winners.slice(0, 3)) {
      prompt += `\n"${winner.script}"\n(${winner.hookType} hook, ${(winner.score * 100).toFixed(0)}% score)\n`;
    }

    prompt += "\nAnalyze what makes these hooks work: word choice, length, emotional trigger, specificity.\n";
  }

  // Avatar insights
  if (feedback.avatars.best) {
    prompt += `\nBEST AVATAR MATCH: "${feedback.avatars.best}" (${feedback.avatars.bestStyle} style) resonates most with your audience.\n`;
  }

  prompt += "\n--- END PERFORMANCE INSIGHTS ---\n";
  prompt += "\nUSE these insights to generate hooks that match your audience's proven preferences.\n";

  return prompt;
}

/**
 * Get platform-specific content adjustments
 */
export async function getPlatformAdjustments(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Compare same hooks across platforms
  const { data: hookComparisons } = await supabase
    .from("hook_performance")
    .select("hook_type, platform, avg_performance_score, win_rate")
    .eq("user_id", userId);

  // Group by hook type
  const byHook = {};
  for (const perf of hookComparisons || []) {
    if (!byHook[perf.hook_type]) {
      byHook[perf.hook_type] = {};
    }
    byHook[perf.hook_type][perf.platform] = {
      score: perf.avg_performance_score,
      winRate: perf.win_rate,
    };
  }

  // Find platform divergences
  const adjustments = {
    tiktok: [],
    instagram: [],
  };

  for (const [hookType, platforms] of Object.entries(byHook)) {
    if (platforms.tiktok && platforms.instagram) {
      const diff = platforms.tiktok.score - platforms.instagram.score;

      if (diff > 0.2) {
        adjustments.tiktok.push(`${hookType} hooks work great here`);
        adjustments.instagram.push(`Avoid ${hookType} hooks - they underperform`);
      } else if (diff < -0.2) {
        adjustments.instagram.push(`${hookType} hooks work great here`);
        adjustments.tiktok.push(`Avoid ${hookType} hooks - they underperform`);
      }
    }
  }

  return adjustments;
}

// ===========================================
// ENHANCED HOOK GENERATION
// ===========================================

/**
 * Generate hooks with performance feedback
 */
export async function generateHooksWithFeedback({
  userId,
  productName,
  productBenefit,
  targetAudience,
  platform = "tiktok",
  count = 5,
}) {
  // Get performance feedback
  const feedback = await getPerformanceFeedback(userId, platform);
  const feedbackPrompt = buildFeedbackPrompt(feedback);

  // Get platform adjustments
  const adjustments = await getPlatformAdjustments(userId);
  const platformNotes = adjustments[platform]?.join(". ") || "";

  // Build enhanced prompt
  const prompt = `You are an expert UGC content strategist with access to performance data.

PRODUCT: ${productName}
BENEFIT: ${productBenefit}
TARGET AUDIENCE: ${targetAudience || "General consumers"}
PLATFORM: ${platform.toUpperCase()}
${platformNotes ? `\nPLATFORM NOTES: ${platformNotes}` : ""}
${feedbackPrompt}

Generate ${count} unique hooks that:
1. Lean into hook types that work for this specific audience
2. Mirror patterns from winning scripts
3. Avoid styles that underperform
4. Feel natural and conversational

Format as JSON array:
[
  {
    "hook": "hook text",
    "type": "curiosity|pov|story|question|direct",
    "script": "full 15-second script",
    "confidence": 0.5-1.0,
    "reasoning": "why this should work based on the data"
  }
]`;

  return prompt;
}

// ===========================================
// INSIGHTS GENERATION
// ===========================================

/**
 * Generate actionable insights from performance data
 */
export async function generateInsights(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const insights = [];

  // Hook performance insight
  const { data: hookPerf } = await supabase
    .from("hook_performance")
    .select("*")
    .eq("user_id", userId)
    .order("avg_performance_score", { ascending: false });

  if (hookPerf && hookPerf.length >= 2) {
    const best = hookPerf[0];
    const worst = hookPerf[hookPerf.length - 1];

    if (best.avg_performance_score - worst.avg_performance_score > 0.2) {
      insights.push({
        type: "hook_pattern",
        title: `${best.hook_type} hooks outperform ${worst.hook_type} by ${((best.avg_performance_score - worst.avg_performance_score) * 100).toFixed(0)}%`,
        description: `Your ${best.hook_type} hooks have a ${(best.win_rate * 100).toFixed(0)}% win rate. Consider focusing more on this style.`,
        confidence: Math.min(best.sample_size / 10, 1),
        actionable: true,
        action: `Generate more ${best.hook_type} hooks`,
      });
    }
  }

  // Watch time insight
  const { data: recentStats } = await supabase
    .from("video_stats")
    .select("watch_time_percent, videos!inner(user_id, duration)")
    .eq("videos.user_id", userId)
    .eq("snapshot_type", "24h")
    .order("snapshot_at", { ascending: false })
    .limit(10);

  if (recentStats && recentStats.length >= 5) {
    const avgWatchTime = recentStats.reduce((sum, s) => sum + (s.watch_time_percent || 0), 0) / recentStats.length;

    if (avgWatchTime < 40) {
      insights.push({
        type: "timing",
        title: "Low watch time detected",
        description: `Your average watch time is ${avgWatchTime.toFixed(0)}%. The algorithm favors 50%+ watch time. Try shortening videos or making hooks more compelling.`,
        confidence: 0.8,
        actionable: true,
        action: "Shorten videos or strengthen hooks",
      });
    } else if (avgWatchTime > 60) {
      insights.push({
        type: "timing",
        title: "Great watch time!",
        description: `Your ${avgWatchTime.toFixed(0)}% watch time is excellent. Keep doing what you're doing!`,
        confidence: 0.9,
        actionable: false,
      });
    }
  }

  // Save insights to database
  for (const insight of insights) {
    await supabase.from("insights").insert({
      user_id: userId,
      insight_type: insight.type,
      title: insight.title,
      description: insight.description,
      confidence_score: insight.confidence,
      is_actionable: insight.actionable,
      action_label: insight.action,
    });
  }

  return insights;
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  getPerformanceFeedback,
  buildFeedbackPrompt,
  getPlatformAdjustments,
  generateHooksWithFeedback,
  generateInsights,
};
