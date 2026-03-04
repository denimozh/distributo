"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ===========================================
// CAMPAIGN DETAIL PAGE
// View videos, performance, and insights
// ===========================================

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);
  const [videos, setVideos] = useState([]);
  const [hooks, setHooks] = useState([]);
  const [insights, setInsights] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState("videos"); // videos, hooks, insights

  useEffect(() => {
    loadCampaignData();
  }, [params.id]);

  const loadCampaignData = async () => {
    setLoading(true);

    // Load campaign
    const { data: campaignData } = await supabase
      .from("campaigns")
      .select(`
        *,
        avatars (id, name, image_url, style)
      `)
      .eq("id", params.id)
      .single();

    if (!campaignData) {
      router.push("/dashboard");
      return;
    }

    setCampaign(campaignData);

    // Load videos
    const { data: videosData } = await supabase
      .from("videos")
      .select("*")
      .eq("campaign_id", params.id)
      .order("performance_score", { ascending: false, nullsFirst: false });

    setVideos(videosData || []);

    // Load hooks
    const { data: hooksData } = await supabase
      .from("hooks")
      .select("*")
      .eq("campaign_id", params.id)
      .order("predicted_score", { ascending: false });

    setHooks(hooksData || []);

    // Load insights
    const { data: insightsData } = await supabase
      .from("insights")
      .select("*")
      .eq("campaign_id", params.id)
      .order("confidence_score", { ascending: false });

    setInsights(insightsData || []);

    setLoading(false);
  };

  const handleDownloadVideo = (video) => {
    if (video.video_url) {
      window.open(video.video_url, "_blank");
    }
  };

  const handlePostVideo = (video) => {
    // TODO: Open posting modal
    alert("Posting coming soon! For now, download and post manually.");
  };

  const handleGenerateMore = async (hookType) => {
    // TODO: Generate more videos with this hook type
    alert(`Generate more ${hookType} hooks - coming soon!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  // Calculate stats
  const totalViews = videos.reduce((sum, v) => sum + (v.total_views || 0), 0);
  const totalEngagement = videos.reduce((sum, v) => sum + (v.total_likes || 0) + (v.total_comments || 0), 0);
  const topHookType = getTopHookType(videos);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard/campaigns")}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold">{campaign.name}</h1>
              <p className="text-sm text-zinc-400">
                {campaign.product_name} • {videos.length} videos • Created {formatDate(campaign.created_at)}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/create")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
          >
            + Create More
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-4">
          <StatCard 
            label="Total Views" 
            value={formatNumber(totalViews)} 
            icon="👁️"
          />
          <StatCard 
            label="Engagement" 
            value={formatNumber(totalEngagement)} 
            icon="💬"
          />
          <StatCard 
            label="Videos Ready" 
            value={videos.filter(v => v.status === "ready").length}
            subtext={`of ${videos.length}`}
            icon="🎬"
          />
          <StatCard 
            label="Top Hook Type" 
            value={topHookType || "—"}
            subtext="Best performing"
            icon="🎯"
          />
        </div>
      </div>

      {/* Insights Banner */}
      {insights.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 pb-4">
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💡</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-white">{insights[0].title}</h3>
                <p className="text-sm text-zinc-400 mt-1">{insights[0].description}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {insights[0].confidence_score}% confidence • Based on {insights[0].sample_size} videos
                </p>
              </div>
              <button
                onClick={() => handleGenerateMore(insights[0].metric_name)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              >
                🚀 {insights[0].action_label}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-1 border-b border-zinc-800">
          {[
            { id: "videos", label: "Videos", count: videos.length },
            { id: "hooks", label: "Hooks", count: hooks.length },
            { id: "insights", label: "Insights", count: insights.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? "text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-zinc-800 rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === "videos" && (
          <VideosTab 
            videos={videos}
            avatar={campaign.avatars}
            onDownload={handleDownloadVideo}
            onPost={handlePostVideo}
            selectedVideo={selectedVideo}
            onSelect={setSelectedVideo}
          />
        )}

        {activeTab === "hooks" && (
          <HooksTab 
            hooks={hooks}
            onGenerateMore={handleGenerateMore}
          />
        )}

        {activeTab === "insights" && (
          <InsightsTab 
            insights={insights}
            onAction={handleGenerateMore}
          />
        )}
      </div>

      {/* Video Preview Modal */}
      {selectedVideo && (
        <VideoPreviewModal 
          video={selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onDownload={() => handleDownloadVideo(selectedVideo)}
          onPost={() => handlePostVideo(selectedVideo)}
        />
      )}
    </div>
  );
}

// ===========================================
// COMPONENTS
// ===========================================

function StatCard({ label, value, subtext, icon }) {
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-zinc-500 mt-1">{subtext}</div>}
    </div>
  );
}

function VideosTab({ videos, avatar, onDownload, onPost, selectedVideo, onSelect }) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <p>No videos generated yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map(video => (
        <VideoCard
          key={video.id}
          video={video}
          avatar={avatar}
          onSelect={() => onSelect(video)}
          onDownload={() => onDownload(video)}
        />
      ))}
    </div>
  );
}

function VideoCard({ video, avatar, onSelect, onDownload }) {
  const isReady = video.status === "ready";
  
  return (
    <div 
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group cursor-pointer"
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="aspect-[9/16] bg-zinc-800 relative">
        {video.thumbnail_url ? (
          <img 
            src={video.thumbnail_url} 
            alt={video.title}
            className="w-full h-full object-cover"
          />
        ) : avatar?.image_url ? (
          <img 
            src={avatar.image_url} 
            alt="Avatar"
            className="w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🎬</span>
          </div>
        )}
        
        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
          isReady 
            ? "bg-green-500/20 text-green-400" 
            : "bg-yellow-500/20 text-yellow-400"
        }`}>
          {isReady ? "Ready" : "Pending"}
        </div>

        {/* Hook type badge */}
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white capitalize">
          {video.hook_type}
        </div>

        {/* Play button */}
        {isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        )}

        {/* Performance */}
        {video.total_views > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-white/80">
            <span>{formatNumber(video.total_views)} views</span>
            <span>{video.engagement_rate?.toFixed(1)}% eng</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm text-zinc-300 line-clamp-2">{video.script}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-500">{video.duration}s</span>
          {isReady && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HooksTab({ hooks, onGenerateMore }) {
  // Group by type
  const hooksByType = hooks.reduce((acc, hook) => {
    if (!acc[hook.hook_type]) acc[hook.hook_type] = [];
    acc[hook.hook_type].push(hook);
    return acc;
  }, {});

  const hookTypeInfo = {
    curiosity: { emoji: "🤔", description: "Creates mystery and intrigue" },
    pov: { emoji: "👁️", description: "Relatable scenarios" },
    story: { emoji: "📖", description: "Personal narratives" },
    question: { emoji: "❓", description: "Engages directly" },
    direct: { emoji: "🎯", description: "Clear and commanding" },
  };

  return (
    <div className="space-y-6">
      {Object.entries(hooksByType).map(([type, typeHooks]) => (
        <div key={type} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{hookTypeInfo[type]?.emoji}</span>
              <div>
                <h3 className="font-medium text-white capitalize">{type} Hooks</h3>
                <p className="text-xs text-zinc-500">{hookTypeInfo[type]?.description}</p>
              </div>
              <span className="ml-2 px-2 py-0.5 bg-zinc-800 rounded-full text-xs text-zinc-400">
                {typeHooks.length}
              </span>
            </div>
            <button
              onClick={() => onGenerateMore(type)}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-medium transition-colors"
            >
              Generate More
            </button>
          </div>

          <div className="space-y-2">
            {typeHooks.slice(0, 5).map(hook => (
              <div key={hook.id} className="p-3 bg-zinc-800/50 rounded-lg">
                <p className="text-sm text-zinc-300">{hook.script}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                  <span>Predicted: {(hook.predicted_score * 100).toFixed(0)}%</span>
                  {hook.times_used > 0 && (
                    <>
                      <span>Used: {hook.times_used}x</span>
                      <span>Avg score: {(hook.avg_score * 100).toFixed(0)}%</span>
                    </>
                  )}
                  {hook.is_winner && (
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">
                      🏆 Winner
                    </span>
                  )}
                </div>
              </div>
            ))}
            {typeHooks.length > 5 && (
              <button className="w-full py-2 text-sm text-zinc-400 hover:text-white transition-colors">
                Show {typeHooks.length - 5} more...
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightsTab({ insights, onAction }) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-white mb-2">No insights yet</h3>
        <p className="text-zinc-400">
          Post your videos and we'll analyze what's working best.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {insights.map(insight => (
        <div key={insight.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-white">{insight.title}</h3>
              <p className="text-sm text-zinc-400 mt-1">{insight.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  {insight.confidence_score}% confidence
                </span>
                <span>Sample size: {insight.sample_size}</span>
              </div>
            </div>
            {insight.is_actionable && (
              <button
                onClick={() => onAction(insight.metric_name)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              >
                {insight.action_label}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function VideoPreviewModal({ video, onClose, onDownload, onPost }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl max-w-lg w-full overflow-hidden">
        {/* Video */}
        <div className="aspect-[9/16] bg-zinc-800 relative">
          {video.video_url ? (
            <video 
              src={video.video_url}
              controls
              autoPlay
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
              Video not available
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-sm text-zinc-300 mb-4">{video.script}</p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onDownload}
              className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              📥 Download
            </button>
            <button
              onClick={onPost}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
            >
              📤 Post
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// HELPERS
// ===========================================

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function getTopHookType(videos) {
  if (videos.length === 0) return null;
  
  const typeScores = videos.reduce((acc, v) => {
    if (v.hook_type && v.performance_score) {
      if (!acc[v.hook_type]) acc[v.hook_type] = { total: 0, count: 0 };
      acc[v.hook_type].total += v.performance_score;
      acc[v.hook_type].count++;
    }
    return acc;
  }, {});

  let topType = null;
  let topScore = 0;

  for (const [type, data] of Object.entries(typeScores)) {
    const avg = data.total / data.count;
    if (avg > topScore) {
      topScore = avg;
      topType = type;
    }
  }

  return topType;
}
