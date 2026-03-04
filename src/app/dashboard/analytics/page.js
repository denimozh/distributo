"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ===========================================
// ANALYTICS DASHBOARD
// Performance insights and learning loop visualization
// ===========================================

export default function AnalyticsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load all analytics data
    const [
      insightsRes,
      statsRes,
      winnersRes,
      hookPerfRes,
    ] = await Promise.all([
      fetch("/api/insights").then(r => r.json()),
      loadStats(user.id, timeRange),
      loadWinners(user.id),
      loadHookPerformance(user.id),
    ]);

    setData({
      insights: insightsRes,
      stats: statsRes,
      winners: winnersRes,
      hookPerformance: hookPerfRes,
    });

    setLoading(false);
  };

  const loadStats = async (userId, range) => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: stats } = await supabase
      .from("video_stats")
      .select(`
        views, likes, saves, shares, watch_time_percent,
        platform, snapshot_type, snapshot_at,
        videos!inner (user_id)
      `)
      .eq("videos.user_id", userId)
      .gte("snapshot_at", startDate.toISOString());

    // Aggregate
    const totals = {
      views: 0,
      likes: 0,
      saves: 0,
      shares: 0,
      avgWatchTime: 0,
    };

    const byPlatform = {};

    for (const stat of stats || []) {
      totals.views += stat.views || 0;
      totals.likes += stat.likes || 0;
      totals.saves += stat.saves || 0;
      totals.shares += stat.shares || 0;

      if (!byPlatform[stat.platform]) {
        byPlatform[stat.platform] = { views: 0, saves: 0, count: 0, watchTime: 0 };
      }
      byPlatform[stat.platform].views += stat.views || 0;
      byPlatform[stat.platform].saves += stat.saves || 0;
      byPlatform[stat.platform].watchTime += stat.watch_time_percent || 0;
      byPlatform[stat.platform].count++;
    }

    // Calculate averages
    for (const platform of Object.keys(byPlatform)) {
      byPlatform[platform].avgWatchTime = byPlatform[platform].watchTime / byPlatform[platform].count;
      byPlatform[platform].saveRate = byPlatform[platform].saves / byPlatform[platform].views;
    }

    const watchTimes = stats?.filter(s => s.watch_time_percent).map(s => s.watch_time_percent) || [];
    totals.avgWatchTime = watchTimes.length > 0
      ? watchTimes.reduce((a, b) => a + b, 0) / watchTimes.length
      : 0;

    return { totals, byPlatform, videoCount: stats?.length || 0 };
  };

  const loadWinners = async (userId) => {
    const { data: winners } = await supabase
      .from("videos")
      .select("id, script, hook_type, performance_score, thumbnail_url, created_at")
      .eq("user_id", userId)
      .eq("is_winner", true)
      .order("performance_score", { ascending: false })
      .limit(10);

    return winners || [];
  };

  const loadHookPerformance = async (userId) => {
    const { data: hookPerf } = await supabase
      .from("hook_performance")
      .select("*")
      .eq("user_id", userId)
      .order("avg_performance_score", { ascending: false });

    return hookPerf || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-zinc-400">Performance insights from your content</p>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Total Views"
          value={formatNumber(data?.stats?.totals?.views || 0)}
          icon="👀"
        />
        <StatCard
          label="Total Saves"
          value={formatNumber(data?.stats?.totals?.saves || 0)}
          icon="💾"
          highlight
        />
        <StatCard
          label="Avg Watch Time"
          value={`${(data?.stats?.totals?.avgWatchTime || 0).toFixed(0)}%`}
          icon="⏱️"
        />
        <StatCard
          label="Winner Videos"
          value={data?.winners?.length || 0}
          icon="🏆"
        />
        <StatCard
          label="Engagement Rate"
          value={`${calculateEngagementRate(data?.stats?.totals)}%`}
          icon="📊"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 mb-6">
        <div className="flex gap-6">
          {[
            { id: "overview", label: "Overview" },
            { id: "hooks", label: "Hook Performance" },
            { id: "platforms", label: "Platform Comparison" },
            { id: "winners", label: "Winners" },
            { id: "insights", label: "AI Insights" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-purple-500 text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab data={data} />
      )}
      {activeTab === "hooks" && (
        <HookPerformanceTab hookPerformance={data?.hookPerformance} />
      )}
      {activeTab === "platforms" && (
        <PlatformComparisonTab platforms={data?.stats?.byPlatform} insights={data?.insights?.platformAnalysis} />
      )}
      {activeTab === "winners" && (
        <WinnersTab winners={data?.winners} />
      )}
      {activeTab === "insights" && (
        <InsightsTab insights={data?.insights} />
      )}
    </div>
  );
}

// ===========================================
// TAB COMPONENTS
// ===========================================

function OverviewTab({ data }) {
  const hookAnalysis = data?.insights?.hookAnalysis;

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Best Performing Hook Type */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-medium text-white mb-4">Best Performing Hook Type</h3>
        {hookAnalysis?.bestHook ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div>
              <div className="text-xl font-bold text-white capitalize">
                {hookAnalysis.bestHook.type}
              </div>
              <div className="text-sm text-zinc-400">
                {(hookAnalysis.bestHook.avgScore * 100).toFixed(0)}% avg score • 
                {(hookAnalysis.bestHook.winRate * 100).toFixed(0)}% win rate
              </div>
            </div>
          </div>
        ) : (
          <p className="text-zinc-400">Not enough data yet. Keep posting!</p>
        )}
      </div>

      {/* AI Recommendation */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-medium text-white mb-4">AI Recommendation</h3>
        <p className="text-zinc-300">
          {hookAnalysis?.recommendation || "Post more content to unlock personalized recommendations."}
        </p>
      </div>

      {/* Platform Performance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 col-span-2">
        <h3 className="font-medium text-white mb-4">Platform Performance</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(data?.stats?.byPlatform || {}).map(([platform, stats]) => (
            <div key={platform} className="bg-zinc-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{platform === "tiktok" ? "🎵" : "📸"}</span>
                <span className="font-medium capitalize">{platform}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-zinc-400">Views</div>
                  <div className="font-medium">{formatNumber(stats.views)}</div>
                </div>
                <div>
                  <div className="text-zinc-400">Save Rate</div>
                  <div className="font-medium">{(stats.saveRate * 100).toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-zinc-400">Avg Watch</div>
                  <div className="font-medium">{stats.avgWatchTime.toFixed(0)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HookPerformanceTab({ hookPerformance }) {
  if (!hookPerformance || hookPerformance.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
        <p className="text-zinc-400">No hook performance data yet. Post more videos to see insights.</p>
      </div>
    );
  }

  const maxScore = Math.max(...hookPerformance.map(h => h.avg_performance_score));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h3 className="font-medium text-white mb-6">Hook Type Performance Ranking</h3>
      <div className="space-y-4">
        {hookPerformance.map((hook, index) => (
          <div key={hook.hook_type} className="flex items-center gap-4">
            <div className="w-8 text-center">
              {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
            </div>
            <div className="w-24 text-sm font-medium capitalize">{hook.hook_type}</div>
            <div className="flex-1">
              <div className="h-6 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    index === 0 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                    index === 1 ? "bg-gradient-to-r from-blue-500 to-cyan-500" :
                    "bg-zinc-600"
                  }`}
                  style={{ width: `${(hook.avg_performance_score / maxScore) * 100}%` }}
                />
              </div>
            </div>
            <div className="w-20 text-right text-sm">
              {(hook.avg_performance_score * 100).toFixed(0)}%
            </div>
            <div className="w-24 text-right text-sm text-zinc-400">
              {hook.sample_size} videos
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-zinc-800">
        <h4 className="font-medium text-white mb-2">Key Insight</h4>
        <p className="text-zinc-400 text-sm">
          {hookPerformance[0] && hookPerformance.length >= 2 ? (
            `Your ${hookPerformance[0].hook_type} hooks outperform ${hookPerformance[hookPerformance.length - 1].hook_type} hooks by ${((hookPerformance[0].avg_performance_score - hookPerformance[hookPerformance.length - 1].avg_performance_score) * 100).toFixed(0)} percentage points. Focus on ${hookPerformance[0].hook_type} style content.`
          ) : (
            "Keep posting different hook types to build comparative data."
          )}
        </p>
      </div>
    </div>
  );
}

function PlatformComparisonTab({ platforms, insights }) {
  return (
    <div className="space-y-6">
      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-6">
        {Object.entries(platforms || {}).map(([platform, stats]) => (
          <div key={platform} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{platform === "tiktok" ? "🎵" : "📸"}</span>
              <h3 className="text-xl font-bold capitalize">{platform}</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Total Views" value={formatNumber(stats.views)} />
              <Metric label="Total Saves" value={formatNumber(stats.saves)} />
              <Metric label="Save Rate" value={`${(stats.saveRate * 100).toFixed(2)}%`} />
              <Metric label="Avg Watch Time" value={`${stats.avgWatchTime.toFixed(0)}%`} />
            </div>
          </div>
        ))}
      </div>

      {/* Platform Insight */}
      {insights?.insight && (
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-xl p-6">
          <h3 className="font-medium text-white mb-2">💡 Platform Insight</h3>
          <p className="text-zinc-300">{insights.insight}</p>
        </div>
      )}
    </div>
  );
}

function WinnersTab({ winners }) {
  if (!winners || winners.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
        <div className="text-4xl mb-4">🏆</div>
        <h3 className="text-lg font-medium text-white mb-2">No winners yet</h3>
        <p className="text-zinc-400">Videos that score in the top 25% become winners. Keep posting!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {winners.map((video, index) => (
        <div key={video.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
          <div className="w-8 text-center text-xl">
            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏆"}
          </div>
          <div className="w-16 h-16 bg-zinc-800 rounded-lg overflow-hidden">
            {video.thumbnail_url ? (
              <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🎬</div>
            )}
          </div>
          <div className="flex-1">
            <div className="font-medium text-white line-clamp-1">
              {video.script?.substring(0, 60)}...
            </div>
            <div className="text-sm text-zinc-400 flex gap-4">
              <span className="capitalize">{video.hook_type} hook</span>
              <span>{new Date(video.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {(video.performance_score * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-zinc-400">Performance Score</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightsTab({ insights }) {
  const allInsights = insights?.insights || [];
  const recommendations = insights?.latestReport?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Weekly Report Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-xl p-6">
          <h3 className="font-medium text-white mb-4">📊 Weekly Report Recommendations</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-300">
                <span className="text-purple-400">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Individual Insights */}
      <div className="space-y-4">
        {allInsights.map((insight) => (
          <div key={insight.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-white">{insight.title}</h4>
                <p className="text-sm text-zinc-400 mt-1">{insight.description}</p>
              </div>
              {insight.is_actionable && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                  Action: {insight.action_label}
                </span>
              )}
            </div>
          </div>
        ))}

        {allInsights.length === 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
            <p className="text-zinc-400">No insights generated yet. Post more content to unlock AI-powered recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ===========================================
// HELPER COMPONENTS
// ===========================================

function StatCard({ label, value, icon, highlight }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? "bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-purple-500/30" : "bg-zinc-900 border border-zinc-800"}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-zinc-400">{label}</div>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="text-lg font-medium text-white">{value}</div>
    </div>
  );
}

// ===========================================
// HELPERS
// ===========================================

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function calculateEngagementRate(totals) {
  if (!totals || !totals.views) return "0.00";
  const engagement = (totals.likes + totals.saves + totals.shares) / totals.views * 100;
  return engagement.toFixed(2);
}
