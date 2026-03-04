// src/lib/intelligence/weekly-report.js
// Weekly Intelligence Report Generator
// Creates plain-English summaries of performance

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { compareHookTypes, comparePlatformPerformance } from "./scoring";

const anthropic = new Anthropic();

// ===========================================
// REPORT GENERATION
// ===========================================

/**
 * Generate weekly report for a user
 */
export async function generateWeeklyReport(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get user info
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, plan, niche")
    .eq("id", userId)
    .single();

  // Get this week's data
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  // Videos created this week
  const { data: newVideos } = await supabase
    .from("videos")
    .select("id, hook_type, performance_score, is_winner, format")
    .eq("user_id", userId)
    .gte("created_at", weekStart.toISOString());

  // Videos posted this week
  const { data: postedContent } = await supabase
    .from("posted_content")
    .select("id, platform, posted_at, video_id")
    .eq("user_id", userId)
    .gte("posted_at", weekStart.toISOString());

  // Stats for videos posted (with at least 24h data)
  const { data: weeklyStats } = await supabase
    .from("video_stats")
    .select(`
      views,
      likes,
      saves,
      shares,
      watch_time_percent,
      profile_visits,
      platform,
      videos!inner (user_id, hook_type, is_winner)
    `)
    .eq("videos.user_id", userId)
    .eq("snapshot_type", "24h")
    .gte("snapshot_at", weekStart.toISOString());

  // Get hook performance comparison
  const hookComparison = await compareHookTypes(userId, "tiktok");

  // Get platform comparison
  const platformComparison = await comparePlatformPerformance(userId);

  // Top performers this week
  const { data: topPerformers } = await supabase
    .from("videos")
    .select("id, hook_type, performance_score, script")
    .eq("user_id", userId)
    .eq("is_winner", true)
    .gte("created_at", weekStart.toISOString())
    .order("performance_score", { ascending: false })
    .limit(3);

  // Calculate summary metrics
  const metrics = calculateWeeklyMetrics(weeklyStats || []);

  // Generate report with Claude
  const reportContent = await generateReportContent({
    profile,
    newVideos: newVideos || [],
    postedContent: postedContent || [],
    metrics,
    hookComparison,
    platformComparison,
    topPerformers: topPerformers || [],
  });

  // Save report
  const reportDate = new Date();
  reportDate.setHours(0, 0, 0, 0);

  const { data: report, error } = await supabase
    .from("weekly_reports")
    .upsert({
      user_id: userId,
      report_date: reportDate.toISOString().split("T")[0],
      report_content: reportContent,
      metrics_summary: metrics,
      top_performers: topPerformers,
      recommendations: extractRecommendations(reportContent),
    }, {
      onConflict: "user_id,report_date",
    })
    .select()
    .single();

  return {
    success: !error,
    report,
    error: error?.message,
  };
}

/**
 * Calculate weekly metrics summary
 */
function calculateWeeklyMetrics(stats) {
  if (stats.length === 0) {
    return {
      totalViews: 0,
      totalLikes: 0,
      totalSaves: 0,
      avgWatchTime: 0,
      videoCount: 0,
      winnerCount: 0,
    };
  }

  const totalViews = stats.reduce((sum, s) => sum + (s.views || 0), 0);
  const totalLikes = stats.reduce((sum, s) => sum + (s.likes || 0), 0);
  const totalSaves = stats.reduce((sum, s) => sum + (s.saves || 0), 0);
  const totalShares = stats.reduce((sum, s) => sum + (s.shares || 0), 0);
  const avgWatchTime = stats.reduce((sum, s) => sum + (s.watch_time_percent || 0), 0) / stats.length;
  const winnerCount = stats.filter(s => s.videos?.is_winner).length;

  return {
    totalViews,
    totalLikes,
    totalSaves,
    totalShares,
    avgWatchTime: Math.round(avgWatchTime),
    videoCount: stats.length,
    winnerCount,
    engagementRate: totalViews > 0 ? ((totalLikes + totalSaves + totalShares) / totalViews * 100).toFixed(2) : 0,
  };
}

/**
 * Generate report content using Claude
 */
async function generateReportContent({
  profile,
  newVideos,
  postedContent,
  metrics,
  hookComparison,
  platformComparison,
  topPerformers,
}) {
  const prompt = `You are a social media performance analyst. Write a friendly, actionable weekly report for ${profile?.full_name || "this creator"}.

WEEKLY DATA:
- Videos created: ${newVideos.length}
- Videos posted: ${postedContent.length}
- Total views: ${metrics.totalViews.toLocaleString()}
- Total saves: ${metrics.totalSaves.toLocaleString()}
- Average watch time: ${metrics.avgWatchTime}%
- Winner videos (top 25%): ${metrics.winnerCount}
- Overall engagement rate: ${metrics.engagementRate}%

HOOK PERFORMANCE:
${hookComparison.hooks?.map(h => `- ${h.type}: ${(h.avgScore * 100).toFixed(0)}% score, ${(h.winRate * 100).toFixed(0)}% win rate (${h.sampleSize} videos)`).join("\n") || "Not enough data yet"}

Best performing hook type: ${hookComparison.bestHook?.type || "N/A"}

PLATFORM COMPARISON:
${Object.entries(platformComparison.platforms || {}).map(([p, data]) => `- ${p}: ${data.avgViews} avg views, ${(data.saveRate * 100).toFixed(2)}% save rate`).join("\n") || "Not enough data"}

TOP PERFORMERS THIS WEEK:
${topPerformers?.map((v, i) => `${i + 1}. Score: ${(v.performance_score * 100).toFixed(0)}% - "${v.script?.substring(0, 50)}..."`).join("\n") || "No winners yet this week"}

Write a report with these sections:
1. **This Week's Highlights** (2-3 sentences, conversational)
2. **What's Working** (bullet points of specific insights)
3. **What to Try Next Week** (2-3 actionable recommendations)
4. **Quick Stats** (formatted numbers)

Keep it under 300 words. Be specific, not generic. Use the actual numbers.
If there's not enough data, acknowledge it and encourage more posting.
Tone: Friendly coach, not corporate report.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content[0].text;
  } catch (error) {
    console.error("[Weekly Report] Claude error:", error);
    return generateFallbackReport(metrics, hookComparison, topPerformers);
  }
}

/**
 * Fallback report if Claude fails
 */
function generateFallbackReport(metrics, hookComparison, topPerformers) {
  return `## Your Weekly Performance Report

### This Week's Highlights
You created ${metrics.videoCount} videos that got ${metrics.totalViews.toLocaleString()} total views. ${metrics.winnerCount > 0 ? `${metrics.winnerCount} videos hit winner status!` : "Keep posting to find your winners!"}

### Quick Stats
- 👀 Views: ${metrics.totalViews.toLocaleString()}
- 💾 Saves: ${metrics.totalSaves.toLocaleString()}
- ⏱️ Avg Watch Time: ${metrics.avgWatchTime}%
- 📊 Engagement Rate: ${metrics.engagementRate}%

### What to Try Next Week
${hookComparison.bestHook ? `- Double down on ${hookComparison.bestHook.type} hooks - they're your best performers` : "- Try different hook types to find what resonates"}
- Post consistently to build momentum
- Check your winners and create variations of what's working

Keep going! 🚀`;
}

/**
 * Extract recommendations from report
 */
function extractRecommendations(reportContent) {
  // Simple extraction of bullet points from "What to Try" section
  const recommendations = [];
  const lines = reportContent.split("\n");

  let inRecommendations = false;
  for (const line of lines) {
    if (line.includes("Try Next") || line.includes("Recommendations")) {
      inRecommendations = true;
      continue;
    }
    if (inRecommendations && line.startsWith("-")) {
      recommendations.push(line.replace(/^-\s*/, "").trim());
    }
    if (inRecommendations && line.startsWith("#")) {
      break;
    }
  }

  return recommendations.slice(0, 5);
}

// ===========================================
// BATCH GENERATION (Cron job)
// ===========================================

/**
 * Generate reports for all active users
 */
export async function generateAllWeeklyReports() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get active users (posted content in last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: activeUsers } = await supabase
    .from("posted_content")
    .select("user_id")
    .gte("posted_at", thirtyDaysAgo.toISOString())
    .order("user_id");

  // Dedupe user IDs
  const userIds = [...new Set(activeUsers?.map(u => u.user_id) || [])];

  const results = {
    total: userIds.length,
    generated: 0,
    failed: 0,
    errors: [],
  };

  for (const userId of userIds) {
    try {
      const result = await generateWeeklyReport(userId);
      if (result.success) {
        results.generated++;
      } else {
        results.failed++;
        results.errors.push({ userId, error: result.error });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ userId, error: error.message });
    }
  }

  return results;
}

// ===========================================
// EMAIL SENDING
// ===========================================

/**
 * Send weekly report email
 */
export async function sendWeeklyReportEmail(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get latest report
  const { data: report } = await supabase
    .from("weekly_reports")
    .select("*")
    .eq("user_id", userId)
    .order("report_date", { ascending: false })
    .limit(1)
    .single();

  if (!report) {
    return { success: false, error: "No report found" };
  }

  // Get user email
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();

  if (!profile?.email) {
    return { success: false, error: "No email found" };
  }

  // TODO: Integrate with email service (Resend, SendGrid, etc.)
  // For now, just mark as sent
  await supabase
    .from("weekly_reports")
    .update({ sent_at: new Date().toISOString() })
    .eq("id", report.id);

  console.log(`[Weekly Report] Would send email to ${profile.email}`);

  return {
    success: true,
    email: profile.email,
    reportId: report.id,
  };
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  generateWeeklyReport,
  generateAllWeeklyReports,
  sendWeeklyReportEmail,
};
