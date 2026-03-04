"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ===========================================
// ADMIN DASHBOARD
// Users, costs, plans, system health
// ===========================================

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [costs, setCosts] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Check if admin (you'd have an admin flag in profiles)
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, is_admin")
      .eq("id", user.id)
      .single();

    // For now, check against admin email list
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];
    const isAdminUser = profile?.is_admin || adminEmails.includes(profile?.email);

    if (!isAdminUser) {
      router.push("/dashboard");
      return;
    }

    setIsAdmin(true);
    await loadDashboardData();
    setLoading(false);
  };

  const loadDashboardData = async () => {
    // Load overview stats
    const [usersData, videosData, campaignsData, costsData] = await Promise.all([
      supabase.from("profiles").select("id, plan, credits, created_at", { count: "exact" }),
      supabase.from("videos").select("id, status", { count: "exact" }),
      supabase.from("campaigns").select("id", { count: "exact" }),
      loadCostData(),
    ]);

    // Calculate stats
    const planCounts = {};
    for (const user of usersData.data || []) {
      const plan = user.plan || "free";
      planCounts[plan] = (planCounts[plan] || 0) + 1;
    }

    const videoStatusCounts = {};
    for (const video of videosData.data || []) {
      const status = video.status || "unknown";
      videoStatusCounts[status] = (videoStatusCounts[status] || 0) + 1;
    }

    setStats({
      totalUsers: usersData.count || 0,
      totalVideos: videosData.count || 0,
      totalCampaigns: campaignsData.count || 0,
      planCounts,
      videoStatusCounts,
      newUsersToday: (usersData.data || []).filter(u => 
        isToday(new Date(u.created_at))
      ).length,
    });

    setCosts(costsData);

    // Load recent users
    const { data: recentUsers } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan, credits, credits_used, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    setUsers(recentUsers || []);
  };

  const loadCostData = async () => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: costData } = await supabase
      .from("api_costs")
      .select("service, cost, user_id, created_at")
      .gte("created_at", monthStart.toISOString());

    // Aggregate
    let total = 0;
    const byService = {};
    const byDay = {};

    for (const cost of costData || []) {
      total += cost.cost || 0;

      const service = cost.service;
      byService[service] = (byService[service] || 0) + (cost.cost || 0);

      const day = new Date(cost.created_at).toDateString();
      byDay[day] = (byDay[day] || 0) + (cost.cost || 0);
    }

    return {
      total,
      byService,
      byDay,
      transactionCount: costData?.length || 0,
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-zinc-400 hover:text-white"
          >
            ← Back to App
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 px-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          {["overview", "users", "costs", "videos"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-2 border-b-2 text-sm font-medium capitalize ${
                activeTab === tab
                  ? "border-purple-500 text-white"
                  : "border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <OverviewTab stats={stats} costs={costs} />
        )}
        {activeTab === "users" && (
          <UsersTab users={users} />
        )}
        {activeTab === "costs" && (
          <CostsTab costs={costs} />
        )}
        {activeTab === "videos" && (
          <VideosTab stats={stats} />
        )}
      </div>
    </div>
  );
}

// ===========================================
// OVERVIEW TAB
// ===========================================

function OverviewTab({ stats, costs }) {
  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.totalUsers || 0}
          subtext={`+${stats?.newUsersToday || 0} today`}
          color="purple"
        />
        <StatCard
          label="Total Videos"
          value={stats?.totalVideos || 0}
          subtext={`${stats?.videoStatusCounts?.ready || 0} ready`}
          color="green"
        />
        <StatCard
          label="Campaigns"
          value={stats?.totalCampaigns || 0}
          color="blue"
        />
        <StatCard
          label="Monthly Costs"
          value={`$${(costs?.total || 0).toFixed(2)}`}
          subtext={`${costs?.transactionCount || 0} transactions`}
          color="orange"
        />
      </div>

      {/* Plan Distribution */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-medium mb-4">Users by Plan</h3>
        <div className="flex gap-4">
          {Object.entries(stats?.planCounts || {}).map(([plan, count]) => (
            <div key={plan} className="flex-1 bg-zinc-800 rounded-lg p-4">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-zinc-400 capitalize">{plan}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Costs by Service */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-medium mb-4">Costs by Service (This Month)</h3>
        <div className="space-y-3">
          {Object.entries(costs?.byService || {}).sort((a, b) => b[1] - a[1]).map(([service, cost]) => (
            <div key={service} className="flex items-center gap-4">
              <div className="w-24 text-sm text-zinc-400 capitalize">{service}</div>
              <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${(cost / (costs?.total || 1)) * 100}%` }}
                />
              </div>
              <div className="w-20 text-right text-sm">${cost.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// USERS TAB
// ===========================================

function UsersTab({ users }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead className="bg-zinc-800/50">
          <tr>
            <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">User</th>
            <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Plan</th>
            <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Credits</th>
            <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-zinc-800">
              <td className="px-4 py-3">
                <div className="font-medium">{user.full_name || "No name"}</div>
                <div className="text-sm text-zinc-400">{user.email}</div>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  user.plan === "scale" ? "bg-purple-500/20 text-purple-400" :
                  user.plan === "growth" ? "bg-blue-500/20 text-blue-400" :
                  user.plan === "starter" ? "bg-green-500/20 text-green-400" :
                  "bg-zinc-800 text-zinc-400"
                }`}>
                  {user.plan || "free"}
                </span>
              </td>
              <td className="px-4 py-3 text-sm">
                {user.credits} / {user.credits + (user.credits_used || 0)}
              </td>
              <td className="px-4 py-3 text-sm text-zinc-400">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===========================================
// COSTS TAB
// ===========================================

function CostsTab({ costs }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="text-3xl font-bold">${(costs?.total || 0).toFixed(2)}</div>
          <div className="text-sm text-zinc-400">Total This Month</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="text-3xl font-bold">{costs?.transactionCount || 0}</div>
          <div className="text-sm text-zinc-400">API Calls</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="text-3xl font-bold">
            ${costs?.transactionCount ? (costs.total / costs.transactionCount).toFixed(3) : "0"}
          </div>
          <div className="text-sm text-zinc-400">Avg Cost per Call</div>
        </div>
      </div>

      {/* By Service Breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-medium mb-4">Cost Breakdown by Service</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(costs?.byService || {}).map(([service, cost]) => (
            <div key={service} className="flex justify-between items-center p-4 bg-zinc-800 rounded-lg">
              <span className="capitalize">{service}</span>
              <span className="font-medium">${cost.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Trend */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-medium mb-4">Daily Costs</h3>
        <div className="space-y-2">
          {Object.entries(costs?.byDay || {}).slice(-7).map(([day, cost]) => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-32 text-sm text-zinc-400">
                {new Date(day).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
              <div className="flex-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(cost / Math.max(...Object.values(costs?.byDay || { _: 1 }))) * 100}%` }}
                />
              </div>
              <div className="w-20 text-right text-sm">${cost.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// VIDEOS TAB
// ===========================================

function VideosTab({ stats }) {
  return (
    <div className="space-y-6">
      {/* Status Breakdown */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="font-medium mb-4">Videos by Status</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(stats?.videoStatusCounts || {}).map(([status, count]) => (
            <div key={status} className="p-4 bg-zinc-800 rounded-lg">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm text-zinc-400 capitalize">{status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// COMPONENTS
// ===========================================

function StatCard({ label, value, subtext, color = "purple" }) {
  const colors = {
    purple: "from-purple-600 to-pink-600",
    green: "from-green-600 to-emerald-600",
    blue: "from-blue-600 to-cyan-600",
    orange: "from-orange-600 to-red-600",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
      {subtext && <div className="text-xs opacity-60 mt-1">{subtext}</div>}
    </div>
  );
}

function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}
