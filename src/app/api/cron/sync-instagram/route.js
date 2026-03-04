// src/app/api/cron/sync-instagram/route.js
// Instagram Stats Sync
// Runs every 6 hours to pull Reels performance metrics

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getReelInsights } from "@/lib/posting/instagram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SNAPSHOT_SCHEDULE = [2, 24, 72, 168]; // 2h, 24h, 72h, 7d

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Instagram Sync] Starting stats sync...");

  try {
    const results = {
      processed: 0,
      synced: 0,
      errors: 0,
      snapshots: 0,
    };

    // Get all posted Instagram content
    const { data: postedContent } = await supabase
      .from("posted_content")
      .select(`
        *,
        videos (id, duration),
        profiles:user_id (id, timezone)
      `)
      .eq("platform", "instagram")
      .eq("status", "posted")
      .not("platform_post_id", "is", null);

    if (!postedContent || postedContent.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No Instagram content to sync",
        ...results,
      });
    }

    for (const post of postedContent) {
      results.processed++;

      try {
        const hoursAgo = getHoursAgo(new Date(post.posted_at));
        const nextSnapshot = await getNextSnapshotType(post.id, hoursAgo);

        if (!nextSnapshot) {
          continue;
        }

        // Get Reel insights
        const insights = await getReelInsights({
          userId: post.user_id,
          mediaId: post.platform_post_id,
        });

        // Create snapshot
        await supabase.from("video_stats").insert({
          video_id: post.video_id,
          posted_content_id: post.id,
          platform: "instagram",
          snapshot_type: nextSnapshot,
          snapshot_at: new Date().toISOString(),
          views: insights.plays || 0,
          likes: insights.likes || 0,
          comments: insights.comments || 0,
          shares: insights.shares || 0,
          saves: insights.saved || 0,
          profile_visits: insights.profile_visits || 0,
        });

        results.snapshots++;
        results.synced++;

        // Check winner status
        await checkAndUpdateWinnerStatus(post.video_id, post.user_id);

      } catch (error) {
        console.error(`[Instagram Sync] Error processing ${post.id}:`, error);
        results.errors++;
      }
    }

    // Update performance aggregates
    await updatePerformanceAggregates("instagram");

    console.log(`[Instagram Sync] Complete. Synced: ${results.synced}, Errors: ${results.errors}`);

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error("[Instagram Sync] Fatal error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

function getHoursAgo(date) {
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

async function getNextSnapshotType(postedContentId, hoursAgo) {
  const { data: existingSnapshots } = await supabase
    .from("video_stats")
    .select("snapshot_type")
    .eq("posted_content_id", postedContentId);

  const existingTypes = new Set(existingSnapshots?.map(s => s.snapshot_type) || []);

  if (hoursAgo >= 2 && hoursAgo < 24 && !existingTypes.has("2h")) return "2h";
  if (hoursAgo >= 24 && hoursAgo < 72 && !existingTypes.has("24h")) return "24h";
  if (hoursAgo >= 72 && hoursAgo < 168 && !existingTypes.has("72h")) return "72h";
  if (hoursAgo >= 168 && !existingTypes.has("7d")) return "7d";

  return null;
}

async function checkAndUpdateWinnerStatus(videoId, userId) {
  const { data: latestStats } = await supabase
    .from("video_stats")
    .select("*")
    .eq("video_id", videoId)
    .eq("platform", "instagram")
    .order("snapshot_at", { ascending: false })
    .limit(1)
    .single();

  if (!latestStats) return;

  // Instagram-specific scoring
  const score = calculateInstagramScore(latestStats);

  await supabase
    .from("videos")
    .update({
      instagram_score: score,
      is_winner: score >= 0.75,
    })
    .eq("id", videoId);

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
        title: "🏆 Instagram Winner!",
        message: `Your Reel is crushing it! Score: ${(score * 100).toFixed(0)}%`,
        data: { videoId, score, platform: "instagram" },
      });
    }
  }
}

function calculateInstagramScore(stats) {
  // Instagram weights (profile visits more important)
  const weights = {
    saves: 0.25,
    profile_visits: 0.25,
    shares: 0.20,
    likes: 0.15,
    comments: 0.15,
  };

  const views = stats.views || 1;

  const normalized = {
    saves: Math.min((stats.saves || 0) / views * 50, 1),
    profile_visits: Math.min((stats.profile_visits || 0) / views * 100, 1),
    shares: Math.min((stats.shares || 0) / views * 200, 1),
    likes: Math.min((stats.likes || 0) / views * 10, 1),
    comments: Math.min((stats.comments || 0) / views * 100, 1),
  };

  let score = 0;
  for (const [metric, weight] of Object.entries(weights)) {
    score += (normalized[metric] || 0) * weight;
  }

  return Math.round(score * 100) / 100;
}

async function updatePerformanceAggregates(platform) {
  const { data: videos } = await supabase
    .from("videos")
    .select("id, user_id, hook_type, instagram_score, is_winner")
    .not("instagram_score", "is", null);

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
    hookPerformance[key].scores.push(video.instagram_score);
    if (video.is_winner) hookPerformance[key].winners++;
  }

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

export async function POST(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return GET(request);
}
