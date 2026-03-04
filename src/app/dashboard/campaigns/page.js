"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ===========================================
// CAMPAIGNS LIST PAGE
// ===========================================

export default function CampaignsPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [filter, setFilter] = useState("all"); // all, active, completed

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("campaigns")
      .select(`
        *,
        avatars (name, image_url)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setCampaigns(data || []);
    setLoading(false);
  };

  const filteredCampaigns = campaigns.filter(c => {
    if (filter === "all") return true;
    if (filter === "active") return c.status === "active" || c.status === "generating";
    if (filter === "completed") return c.status === "completed";
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaigns</h1>
          <p className="text-zinc-400">Manage your AI video campaigns</p>
        </div>
        <Link
          href="/dashboard/create"
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium text-white transition-colors"
        >
          + New Campaign
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "completed", label: "Completed" },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.id
                ? "bg-purple-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCampaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}

function CampaignCard({ campaign }) {
  const statusColors = {
    draft: "bg-zinc-500/20 text-zinc-400",
    generating: "bg-yellow-500/20 text-yellow-400",
    active: "bg-green-500/20 text-green-400",
    paused: "bg-orange-500/20 text-orange-400",
    completed: "bg-blue-500/20 text-blue-400",
    failed: "bg-red-500/20 text-red-400",
  };

  return (
    <Link
      href={`/dashboard/campaigns/${campaign.id}`}
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all group"
    >
      {/* Header with avatar */}
      <div className="aspect-video bg-zinc-800 relative">
        {campaign.avatars?.image_url ? (
          <img 
            src={campaign.avatars.image_url}
            alt={campaign.avatars.name}
            className="w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl">🎬</span>
          </div>
        )}
        
        {/* Status badge */}
        <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status]}`}>
          {campaign.status}
        </div>

        {/* Video count */}
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-xs text-white">
          {campaign.videos_generated || 0} videos
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-white mb-1 group-hover:text-purple-400 transition-colors">
          {campaign.name}
        </h3>
        <p className="text-sm text-zinc-500 mb-3">
          {campaign.product_name}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          {campaign.total_views > 0 && (
            <span className="flex items-center gap-1">
              <span>👁️</span>
              {formatNumber(campaign.total_views)}
            </span>
          )}
          <span>{formatDate(campaign.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ filter }) {
  if (filter !== "all") {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">No {filter} campaigns found.</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800 rounded-2xl flex items-center justify-center">
        <span className="text-3xl">📁</span>
      </div>
      <h3 className="text-lg font-medium text-white mb-2">No campaigns yet</h3>
      <p className="text-zinc-400 mb-4">Create your first campaign to get started.</p>
      <Link
        href="/dashboard/create"
        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-medium text-white transition-colors"
      >
        <span>✨</span>
        Create Campaign
      </Link>
    </div>
  );
}

function formatNumber(num) {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
