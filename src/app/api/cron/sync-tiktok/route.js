// src/app/api/cron/sync-tiktok/route.js
// TikTok Stats Sync
// Runs every 6 hours to pull video performance metrics

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getVideoStats, getValidAccessToken } from "@/lib/posting/tiktok";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Snapshot schedules (hours after posting)
const SNAPSHOT_SCHEDULE = [2, 24, 72, 168]; // 2h, 24h, 72h, 7d

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[TikTok Sync] Starting stats sync...");

  try {
    const results = {
      processed: 0,
      synced: 0,
      errors: 0,
      snapshots: 0,
    };

    // Get all posted TikTok content that needs syncing
    const { data: postedContent } = await supabase
      .from("posted_content")
      .select(`
        *,
        videos (id, duration),
        profiles:user_id (id, timezone)
      `)
      .eq("platform", "tiktok")
      .eq("status", "posted")
      .not("platform_post_id", "is", null);

    if (!postedContent || postedContent.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No TikTok content to sync",
        ...results,
      });
    }

    for (const post of postedContent) {
      results.processed++;

      try {
        // Check if we need a snapshot
        const hoursAgo = getHoursAgo(new Date(post.posted_at));
        const nextSnapshot = getNextSnapshotType(post.id, hoursAgo);

        if (!nextSnapshot) {
          continue; // Already have all snapshots
        }

        // Get fresh stats from TikTok
        const stats = await getVideoStats({
          userId: post.user_id,
          videoId: post.platform_post_id,
        });

        if (!stats.success) {
          console.error(`[TikTok Sync] Failed to get stats for ${post.id}:`, stats.error);
          results.errors++;
          continue;
        }

        // Create snapshot
        await supabase.from("video_stats").insert({
          video_id: post.video_id,
          posted_content_id: post.id,
          platform: "tiktok",
          snapshot_type: nextSnapshot,
          snapshot_at: new Date().toISOString(),
          views: stats.views || 0,
          likes: stats.likes || 0,
          comments: stats.comments || 0,
          shares: stats.shares || 0,
          saves: stats.saves || 0,
          watch_time_percent: stats.avgWatchTime ? (stats.avgWatchTime / (post.videos?.duration || 15)) * 100 : null,
          avg_watch_time_seconds: stats.avgWatchTime || null,
          profile_visits: stats.profileVisits || 0,
        });

        results.snapshots++;
        results.synced++;

        // Check for winner status
        await checkAndUpdateWinnerStatus(post.video_id, post.user_id);

      } catch (error) {
        console.error(`[TikTok Sync] Error processing ${post.id}:`, error);
        results.errors++;
      }
    }

    // Update hook and avatar performance tables
    await updatePerformanceAggregates("tiktok");

    console.log(`[TikTok Sync] Complete. Synced: ${results.synced}, Snapshots: ${results.snapshots}, Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error("[TikTok Sync] Fatal error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function getHoursAgo(date) {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

async function getNextSnapshotType(postedContentId, hoursAgo) {
  // Check existing snapshots
  const { data: existingSnapshots } = await supabase
    .from("video_stats")
    .select("snapshot_type")
    .eq("posted_content_id", postedContentId);

  const existingTypes = new Set(existingSnapshots?.map(s => s.snapshot_type) || []);

  // Determine which snapshot to take based on time
  if (hoursAgo >= 2 && hoursAgo < 24 && !existingTypes.has("2h")) {
    return "2h";
  }
  if (hoursAgo >= 24 && hoursAgo < 72 && !existingTypes.has("24h")) {
    return "24h";
  }
  if (hoursAgo >= 72 && hoursAgo < 168 && !existingTypes.has("72h")) {
    return "72h";
  }
  if (hoursAgo >= 168 && !existingTypes.has("7d")) {
    return "7d";
  }

  return null;
}

async function checkAndUpdateWinnerStatus(videoId, userId) {
  // Get latest stats
  const { data: latestStats } = await supabase
    .from("video_stats")
    .select("*")
    .eq("video_id", videoId)
    .order("snapshot_at", { ascending: false })
    .limit(1)
    .single();

  if (!latestStats) return;

  // Calculate performance score
  const score = calculatePerformanceScore(latestStats, "tiktok");

  // Update video with score
  await supabase
    .from("videos")
    .update({
      performance_score: score,
      is_winner: score >= 0.75,
    })
    .eq("id", videoId);

  // If winner, create notification
  if (score >= 0.75) {
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "winner")
      .eq("data->>videoId", videoId)
      .single();

    if (!existing) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "winner",
        title: "🏆 You have a winner!",
        message: `Your video is performing in the top 25%! Consider reposting or extending it.`,
        data: { videoId, score },
      });
    }
  }
}

function calculatePerformanceScore(stats, platform) {
  // TikTok scoring weights
  const weights = {
    tiktok: {
      watch_time: 0.40,  // Most important
      saves: 0.30,       // High intent signal
      profile_visits: 0.15,
      shares: 0.10,
      likes: 0.05,       // Least meaningful
    },
    instagram: {
      watch_time: 0.35,
      saves: 0.25,
      profile_visits: 0.20,
      shares: 0.10,
      likes: 0.10,
    },
  };

  const w = weights[platform] || weights.tiktok;

  // Normalize metrics (0-1 scale based on typical performance)
  const normalized = {
    watch_time: Math.min((stats.watch_time_percent || 0) / 100, 1),
    saves: Math.min((stats.saves || 0) / (stats.views || 1) * 50, 1), // 2% save rate = 1.0
    profile_visits: Math.min((stats.profile_visits || 0) / (stats.views || 1) * 100, 1),
    shares: Math.min((stats.shares || 0) / (stats.views || 1) * 200, 1),
    likes: Math.min((stats.likes || 0) / (stats.views || 1) * 10, 1),
  };

  // Calculate weighted score
  let score = 0;
  for (const [metric, weight] of Object.entries(w)) {
    score += (normalized[metric] || 0) * weight;
  }

  return Math.round(score * 100) / 100;
}

async function updatePerformanceAggregates(platform) {
  // Update hook performance
  const { data: videos } = await supabase
    .from("videos")
    .select(`
      id,
      user_id,
      hook_type,
      performance_score,
      is_winner
    `)
    .not("performance_score", "is", null);

  // Group by user + hook_type
  const hookPerformance = {};
  for (const video of videos || []) {
    const key = `${video.user_id}-${video.hook_type}`;
    if (!hookPerformance[key]) {
      hookPerformance[key] = {
        user_id: video.user_id,
        hook_type: video.hook_type,
        scores: [],
        winners: 0,
      };
    }
    hookPerformance[key].scores.push(video.performance_score);
    if (video.is_winner) hookPerformance[key].winners++;
  }

  // Upsert hook performance
  for (const data of Object.values(hookPerformance)) {
    const avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    const winRate = data.winners / data.scores.length;

    await supabase
      .from("hook_performance")
      .upsert({
        user_id: data.user_id,
        hook_type: data.hook_type,
        platform,
        sample_size: data.scores.length,
        avg_performance_score: avgScore,
        win_rate: winRate,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,hook_type,platform",
      });
  }
}

// Manual trigger for testing
export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return GET(request);
}
