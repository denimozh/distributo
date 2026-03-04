// src/lib/intelligence/scoring.js
// Performance Scoring & Winner Detection
// The brain of the learning loop

import { createClient } from "@supabase/supabase-js";

// ===========================================
// SCORING WEIGHTS BY PLATFORM
// ===========================================

export const PLATFORM_WEIGHTS = {
  tiktok: {
    watch_time_percent: 0.40,  // Most important - shows content quality
    saves: 0.30,               // High intent, best predictor of sales
    profile_visits: 0.15,      // Interest in brand
    shares: 0.10,              // Viral potential
    likes: 0.05,               // Engagement but low signal
  },
  instagram: {
    saves: 0.30,               // IG users save for later
    profile_visits: 0.25,      // IG is more profile-centric
    watch_time_percent: 0.20,
    shares: 0.15,
    likes: 0.10,
  },
  youtube: {
    watch_time_percent: 0.50,  // YT algorithm loves watch time
    likes: 0.15,
    comments: 0.15,
    shares: 0.10,
    saves: 0.10,
  },
};

// Benchmark rates (what's considered "good")
export const BENCHMARKS = {
  tiktok: {
    watch_time_percent: 60,    // 60% is excellent
    save_rate: 0.02,           // 2% save rate is great
    profile_visit_rate: 0.01,  // 1% profile visit rate
    share_rate: 0.005,         // 0.5% share rate
    like_rate: 0.10,           // 10% like rate
  },
  instagram: {
    save_rate: 0.03,
    profile_visit_rate: 0.02,
    share_rate: 0.01,
    like_rate: 0.08,
  },
};

// ===========================================
// SCORING FUNCTIONS
// ===========================================

/**
 * Calculate unified performance score (0-1)
 */
export function calculatePerformanceScore(stats, platform = "tiktok") {
  const weights = PLATFORM_WEIGHTS[platform] || PLATFORM_WEIGHTS.tiktok;
  const benchmarks = BENCHMARKS[platform] || BENCHMARKS.tiktok;

  const views = stats.views || 1;

  // Normalize each metric against benchmarks
  const normalized = {};

  // Watch time
  if (weights.watch_time_percent) {
    normalized.watch_time_percent = Math.min(
      (stats.watch_time_percent || 0) / benchmarks.watch_time_percent,
      1.5 // Cap at 150% of benchmark
    );
  }

  // Engagement rates
  if (weights.saves) {
    const saveRate = (stats.saves || 0) / views;
    normalized.saves = Math.min(saveRate / benchmarks.save_rate, 1.5);
  }

  if (weights.profile_visits) {
    const visitRate = (stats.profile_visits || 0) / views;
    normalized.profile_visits = Math.min(visitRate / benchmarks.profile_visit_rate, 1.5);
  }

  if (weights.shares) {
    const shareRate = (stats.shares || 0) / views;
    normalized.shares = Math.min(shareRate / benchmarks.share_rate, 1.5);
  }

  if (weights.likes) {
    const likeRate = (stats.likes || 0) / views;
    normalized.likes = Math.min(likeRate / benchmarks.like_rate, 1.5);
  }

  // Calculate weighted score
  let score = 0;
  let totalWeight = 0;

  for (const [metric, weight] of Object.entries(weights)) {
    if (normalized[metric] !== undefined) {
      score += normalized[metric] * weight;
      totalWeight += weight;
    }
  }

  // Normalize to 0-1
  const finalScore = totalWeight > 0 ? score / totalWeight : 0;
  return Math.min(Math.max(finalScore, 0), 1);
}

/**
 * Determine winner status based on score
 */
export function isWinner(score, threshold = 0.75) {
  return score >= threshold;
}

/**
 * Get performance tier
 */
export function getPerformanceTier(score) {
  if (score >= 0.90) return { tier: "exceptional", label: "🏆 Top 10%", color: "gold" };
  if (score >= 0.75) return { tier: "winner", label: "⭐ Winner", color: "green" };
  if (score >= 0.50) return { tier: "good", label: "👍 Good", color: "blue" };
  if (score >= 0.25) return { tier: "average", label: "📊 Average", color: "gray" };
  return { tier: "underperforming", label: "📉 Needs work", color: "red" };
}

// ===========================================
// COMPARATIVE ANALYSIS
// ===========================================

/**
 * Compare video performance against user's average
 */
export async function compareToUserAverage(videoId, userId, platform) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get this video's score
  const { data: video } = await supabase
    .from("videos")
    .select("performance_score")
    .eq("id", videoId)
    .single();

  // Get user's average score
  const { data: userVideos } = await supabase
    .from("videos")
    .select("performance_score")
    .eq("user_id", userId)
    .not("performance_score", "is", null);

  if (!userVideos || userVideos.length === 0) {
    return {
      videoScore: video?.performance_score || 0,
      userAverage: 0,
      percentile: 50,
      comparison: "first_video",
    };
  }

  const scores = userVideos.map(v => v.performance_score).sort((a, b) => a - b);
  const userAverage = scores.reduce((a, b) => a + b, 0) / scores.length;
  const videoScore = video?.performance_score || 0;

  // Calculate percentile
  const belowCount = scores.filter(s => s < videoScore).length;
  const percentile = Math.round((belowCount / scores.length) * 100);

  return {
    videoScore,
    userAverage,
    percentile,
    comparison: videoScore > userAverage ? "above_average" : "below_average",
    difference: videoScore - userAverage,
  };
}

/**
 * Compare hook types performance
 */
export async function compareHookTypes(userId, platform = "tiktok") {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: hookPerformance } = await supabase
    .from("hook_performance")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", platform)
    .order("avg_performance_score", { ascending: false });

  if (!hookPerformance || hookPerformance.length === 0) {
    return { hooks: [], bestHook: null, worstHook: null };
  }

  const hooks = hookPerformance.map(h => ({
    type: h.hook_type,
    avgScore: h.avg_performance_score,
    winRate: h.win_rate,
    sampleSize: h.sample_size,
    tier: getPerformanceTier(h.avg_performance_score),
  }));

  return {
    hooks,
    bestHook: hooks[0],
    worstHook: hooks[hooks.length - 1],
    recommendation: generateHookRecommendation(hooks),
  };
}

function generateHookRecommendation(hooks) {
  if (hooks.length < 2) {
    return "Keep testing different hook types to find what works best for your audience.";
  }

  const best = hooks[0];
  const worst = hooks[hooks.length - 1];

  if (best.avgScore - worst.avgScore > 0.3) {
    return `Your ${best.type} hooks are crushing it! They outperform ${worst.type} hooks by ${((best.avgScore - worst.avgScore) * 100).toFixed(0)}%. Consider focusing more on ${best.type} style content.`;
  }

  if (best.avgScore > 0.6) {
    return `Your ${best.type} hooks perform best. Keep using them while testing variations.`;
  }

  return `Your hook performance is fairly consistent. Try more experimental hooks to find breakout content.`;
}

/**
 * Compare platform performance (same content, different platforms)
 */
export async function comparePlatformPerformance(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: stats } = await supabase
    .from("video_stats")
    .select(`
      platform,
      views,
      likes,
      saves,
      shares,
      watch_time_percent,
      videos!inner (user_id)
    `)
    .eq("videos.user_id", userId)
    .eq("snapshot_type", "7d");

  // Group by platform
  const byPlatform = {};
  for (const stat of stats || []) {
    if (!byPlatform[stat.platform]) {
      byPlatform[stat.platform] = [];
    }
    byPlatform[stat.platform].push(stat);
  }

  // Calculate averages
  const platformAverages = {};
  for (const [platform, platformStats] of Object.entries(byPlatform)) {
    const avgViews = platformStats.reduce((a, s) => a + (s.views || 0), 0) / platformStats.length;
    const avgSaves = platformStats.reduce((a, s) => a + (s.saves || 0), 0) / platformStats.length;
    const avgWatchTime = platformStats.reduce((a, s) => a + (s.watch_time_percent || 0), 0) / platformStats.length;

    platformAverages[platform] = {
      avgViews: Math.round(avgViews),
      avgSaves: Math.round(avgSaves),
      avgWatchTime: Math.round(avgWatchTime),
      videoCount: platformStats.length,
      saveRate: avgSaves / avgViews,
    };
  }

  // Generate insight
  let insight = "";
  if (platformAverages.tiktok && platformAverages.instagram) {
    const tiktokSaveRate = platformAverages.tiktok.saveRate;
    const instagramSaveRate = platformAverages.instagram.saveRate;

    if (tiktokSaveRate > instagramSaveRate * 1.5) {
      insight = "Your TikTok audience is more engaged. Consider posting TikTok-first and adapting for Instagram.";
    } else if (instagramSaveRate > tiktokSaveRate * 1.5) {
      insight = "Your Instagram Reels are driving more saves. Your audience there may be closer to purchase.";
    } else {
      insight = "Your content performs similarly across platforms. Great multi-platform strategy!";
    }
  }

  return {
    platforms: platformAverages,
    insight,
  };
}

// ===========================================
// WINNER DETECTION
// ===========================================

/**
 * Detect winners cron job
 */
export async function detectWinners() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get videos with recent stats that haven't been scored
  const { data: unscored } = await supabase
    .from("videos")
    .select(`
      id,
      user_id,
      posted_content!inner (
        platform,
        platform_post_id
      ),
      video_stats!inner (
        views,
        likes,
        saves,
        shares,
        watch_time_percent,
        profile_visits,
        snapshot_type
      )
    `)
    .is("performance_score", null)
    .not("video_stats.snapshot_type", "eq", "2h"); // Need at least 24h data

  const results = {
    scored: 0,
    winners: 0,
  };

  for (const video of unscored || []) {
    const platform = video.posted_content?.[0]?.platform || "tiktok";
    const latestStats = video.video_stats?.sort((a, b) => {
      const order = { "7d": 4, "72h": 3, "24h": 2, "2h": 1 };
      return (order[b.snapshot_type] || 0) - (order[a.snapshot_type] || 0);
    })[0];

    if (!latestStats) continue;

    const score = calculatePerformanceScore(latestStats, platform);
    const winner = isWinner(score);

    await supabase
      .from("videos")
      .update({
        performance_score: score,
        is_winner: winner,
      })
      .eq("id", video.id);

    results.scored++;
    if (winner) results.winners++;

    // Notify user of winner
    if (winner) {
      await supabase.from("notifications").insert({
        user_id: video.user_id,
        type: "winner",
        title: "🏆 You have a winner!",
        message: `Your video scored ${(score * 100).toFixed(0)}% - top 25% performance!`,
        data: { videoId: video.id, score, platform },
      });
    }
  }

  return results;
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  PLATFORM_WEIGHTS,
  BENCHMARKS,
  calculatePerformanceScore,
  isWinner,
  getPerformanceTier,
  compareToUserAverage,
  compareHookTypes,
  comparePlatformPerformance,
  detectWinners,
};
