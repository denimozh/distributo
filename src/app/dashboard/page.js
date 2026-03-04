"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ===========================================
// HOME DASHBOARD
// Clean, focused on getting users to create
// ===========================================

export default function DashboardPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalVideos: 0,
    totalViews: 0,
    creditsUsed: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(profileData);

    // Load recent campaigns
    const { data: campaignsData } = await supabase
      .from("campaigns")
      .select(`
        *,
        avatars (name, image_url)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setCampaigns(campaignsData || []);

    // Calculate stats
    const { data: allCampaigns } = await supabase
      .from("campaigns")
      .select("id, total_videos, videos_generated")
      .eq("user_id", user.id);

    if (allCampaigns) {
      setStats({
        totalCampaigns: allCampaigns.length,
        totalVideos: allCampaigns.reduce((sum, c) => sum + (c.videos_generated || 0), 0),
        totalViews: 0, // Will be populated from video_stats later
        creditsUsed: profileData?.credits_used || 0,
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasNoCampaigns = campaigns.length === 0;
  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-zinc-400">
          {hasNoCampaigns 
            ? "Ready to create your first AI-powered ad campaign?"
            : "Here's what's happening with your campaigns."}
        </p>
      </div>

      {/* Empty State - First Time User */}
      {hasNoCampaigns ? (
        <EmptyState profile={profile} />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Campaigns" value={stats.totalCampaigns} icon="📊" />
            <StatCard label="Videos" value={stats.totalVideos} icon="🎬" />
            <StatCard label="Total Views" value={formatNumber(stats.totalViews)} icon="👁️" />
            <StatCard label="Credits Used" value={stats.creditsUsed} icon="⚡" />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-4 mb-8">
            <Link
              href="/dashboard/create"
              className="flex-1 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Create New Campaign</h3>
                  <p className="text-sm text-white/70">Generate AI videos in minutes</p>
                </div>
                <span className="ml-auto text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all">
                  →
                </span>
              </div>
            </Link>
          </div>

          {/* Recent Campaigns */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Campaigns</h2>
              <Link 
                href="/dashboard/campaigns"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-3">
              {campaigns.map(campaign => (
                <CampaignRow key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ===========================================
// COMPONENTS
// ===========================================

function EmptyState({ profile }) {
  const hasProductInfo = profile?.product_name;

  return (
    <div className="max-w-xl mx-auto text-center py-12">
      {/* Hero illustration */}
      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center">
        <span className="text-5xl">🎬</span>
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        Create Your First Campaign
      </h2>
      
      <p className="text-zinc-400 mb-8 max-w-md mx-auto">
        Generate scroll-stopping AI videos for your product. 
        Pick an avatar, describe your product, and we'll create 
        dozens of variations to test.
      </p>

      <Link
        href="/dashboard/create"
        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white hover:from-purple-500 hover:to-pink-500 transition-all"
      >
        <span className="text-xl">✨</span>
        Create Your First Campaign
      </Link>

      {/* Steps preview */}
      <div className="mt-12 grid grid-cols-3 gap-4 text-left">
        <StepPreview 
          number={1}
          title="Describe your product"
          description="Tell us what you're selling and who it's for"
        />
        <StepPreview 
          number={2}
          title="Pick an AI avatar"
          description="Choose from 10 realistic presenters"
        />
        <StepPreview 
          number={3}
          title="Generate & download"
          description="Get video variations in minutes"
        />
      </div>

      {/* Social proof */}
      <div className="mt-12 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <p className="text-sm text-zinc-400">
          💡 <span className="text-white">Pro tip:</span> Our AI generates 
          "ugly" UGC-style content that performs better than polished ads. 
          Imperfect = authentic = higher engagement.
        </p>
      </div>
    </div>
  );
}

function StepPreview({ number, title, description }) {
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center mb-3">
        <span className="text-sm font-bold text-purple-400">{number}</span>
      </div>
      <h3 className="font-medium text-white text-sm mb-1">{title}</h3>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function CampaignRow({ campaign }) {
  const statusColors = {
    draft: "bg-zinc-500/20 text-zinc-400",
    generating: "bg-yellow-500/20 text-yellow-400",
    active: "bg-green-500/20 text-green-400",
    paused: "bg-orange-500/20 text-orange-400",
    completed: "bg-blue-500/20 text-blue-400",
  };

  return (
    <Link
      href={`/dashboard/campaigns/${campaign.id}`}
      className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-all group"
    >
      {/* Avatar thumbnail */}
      <div className="w-12 h-12 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
        {campaign.avatars?.image_url ? (
          <img 
            src={campaign.avatars.image_url}
            alt={campaign.avatars.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">
            🎬
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white truncate">{campaign.name}</h3>
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <span>{campaign.videos_generated || 0} videos</span>
          {campaign.total_views > 0 && (
            <span>{formatNumber(campaign.total_views)} views</span>
          )}
          <span>{formatDate(campaign.created_at)}</span>
        </div>
      </div>

      {/* Status */}
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status] || statusColors.draft}`}>
        {campaign.status}
      </span>

      {/* Arrow */}
      <span className="text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all">
        →
      </span>
    </Link>
  );
}

// ===========================================
// HELPERS
// ===========================================

function formatNumber(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
