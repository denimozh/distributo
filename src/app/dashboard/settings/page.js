"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ===========================================
// SETTINGS PAGE
// Profile, Connected Accounts, Billing
// ===========================================

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [connections, setConnections] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    timezone: "UTC",
    productName: "",
    productDescription: "",
    targetAudience: "",
    productUrl: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile(profileData);
      setFormData({
        fullName: profileData.full_name || "",
        timezone: profileData.timezone || "UTC",
        productName: profileData.product_name || "",
        productDescription: profileData.product_description || "",
        targetAudience: profileData.target_audience || "",
        productUrl: profileData.product_url || "",
      });
    }

    // Load platform connections
    const { data: connectionsData } = await supabase
      .from("platform_connections")
      .select("*")
      .eq("user_id", user.id);

    setConnections(connectionsData || []);
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.fullName,
        timezone: formData.timezone,
        product_name: formData.productName,
        product_description: formData.productDescription,
        target_audience: formData.targetAudience,
        product_url: formData.productUrl,
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      alert("Failed to save: " + error.message);
    } else {
      alert("Settings saved!");
    }
  };

  const handleConnectPlatform = async (platform) => {
    // Redirect to OAuth flow
    window.location.href = `/api/auth/${platform}`;
  };

  const handleDisconnectPlatform = async (platform) => {
    if (!confirm(`Disconnect ${platform}? You won't be able to post until you reconnect.`)) {
      return;
    }

    await supabase
      .from("platform_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", platform);

    // Reload connections
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: "👤" },
    { id: "accounts", label: "Connected Accounts", icon: "🔗" },
    { id: "product", label: "Default Product", icon: "📦" },
    { id: "billing", label: "Plan & Billing", icon: "💳" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-zinc-800 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-purple-600 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        {activeTab === "profile" && (
          <ProfileTab
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveProfile}
            saving={saving}
            email={user?.email}
          />
        )}

        {activeTab === "accounts" && (
          <AccountsTab
            connections={connections}
            onConnect={handleConnectPlatform}
            onDisconnect={handleDisconnectPlatform}
          />
        )}

        {activeTab === "product" && (
          <ProductTab
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveProfile}
            saving={saving}
          />
        )}

        {activeTab === "billing" && (
          <BillingTab profile={profile} />
        )}
      </div>
    </div>
  );
}

// ===========================================
// PROFILE TAB
// ===========================================

function ProfileTab({ formData, setFormData, onSave, saving, email }) {
  const timezones = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email || ""}
            disabled
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Your name"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Timezone
        </label>
        <select
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
        >
          {timezones.map((tz) => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
        <p className="text-xs text-zinc-500 mt-1">
          Used for scheduling posts at optimal times
        </p>
      </div>

      <div className="pt-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-xl text-white font-medium transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ===========================================
// CONNECTED ACCOUNTS TAB
// ===========================================

function AccountsTab({ connections, onConnect, onDisconnect }) {
  const platforms = [
    {
      id: "tiktok",
      name: "TikTok",
      icon: "🎵",
      description: "Post videos directly to TikTok",
      color: "bg-pink-500",
      available: true,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: "📸",
      description: "Post Reels to Instagram",
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      available: false, // Coming in Tier 2
    },
    {
      id: "youtube",
      name: "YouTube",
      icon: "🎬",
      description: "Post Shorts to YouTube",
      color: "bg-red-500",
      available: false, // Coming in Tier 3
    },
  ];

  const getConnection = (platformId) => {
    return connections.find((c) => c.platform === platformId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Connected Accounts</h2>
        <p className="text-sm text-zinc-400">
          Connect your social accounts to post videos directly
        </p>
      </div>

      <div className="space-y-4">
        {platforms.map((platform) => {
          const connection = getConnection(platform.id);
          const isConnected = !!connection;

          return (
            <div
              key={platform.id}
              className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center`}>
                  <span className="text-2xl">{platform.icon}</span>
                </div>
                <div>
                  <h3 className="font-medium text-white">{platform.name}</h3>
                  {isConnected ? (
                    <p className="text-sm text-green-400">
                      Connected as @{connection.platform_username}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-400">{platform.description}</p>
                  )}
                </div>
              </div>

              <div>
                {!platform.available ? (
                  <span className="px-3 py-1.5 bg-zinc-700 text-zinc-400 rounded-lg text-sm">
                    Coming Soon
                  </span>
                ) : isConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-green-400 text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      Connected
                    </span>
                    <button
                      onClick={() => onDisconnect(platform.id)}
                      className="px-3 py-1.5 text-red-400 hover:text-red-300 text-sm"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onConnect(platform.id)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium text-white transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <p className="text-sm text-blue-400">
          💡 <strong>Tip:</strong> Connect TikTok first to start posting your generated videos.
          We'll automatically schedule posts for optimal engagement times.
        </p>
      </div>
    </div>
  );
}

// ===========================================
// PRODUCT TAB
// ===========================================

function ProductTab({ formData, setFormData, onSave, saving }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-2">Default Product</h2>
        <p className="text-sm text-zinc-400">
          Set your default product info. This will be pre-filled when creating campaigns.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Product Name
          </label>
          <input
            type="text"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            placeholder="e.g., GlowSerum Pro"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Product Description / Main Benefit
          </label>
          <textarea
            value={formData.productDescription}
            onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
            placeholder="e.g., Clears acne in 2 weeks with a simple 30-second routine"
            rows={3}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Target Audience
          </label>
          <input
            type="text"
            value={formData.targetAudience}
            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            placeholder="e.g., Women 18-35 struggling with hormonal acne"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Product URL
          </label>
          <input
            type="url"
            value={formData.productUrl}
            onChange={(e) => setFormData({ ...formData, productUrl: e.target.value })}
            placeholder="https://yourproduct.com"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-xl text-white font-medium transition-colors"
        >
          {saving ? "Saving..." : "Save Product Info"}
        </button>
      </div>
    </div>
  );
}

// ===========================================
// BILLING TAB
// ===========================================

function BillingTab({ profile }) {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 49,
      videos: 30,
      features: ["30 videos/month", "5 AI avatars", "TikTok posting"],
    },
    {
      id: "growth",
      name: "Growth",
      price: 99,
      videos: 75,
      features: ["75 videos/month", "10 AI avatars", "Performance insights", "Priority support"],
      popular: true,
    },
    {
      id: "scale",
      name: "Scale",
      price: 249,
      videos: 200,
      features: ["200 videos/month", "Unlimited avatars", "Multi-platform", "Advanced analytics"],
    },
  ];

  const currentPlan = profile?.plan || "free";
  const credits = profile?.credits || 0;
  const creditsUsed = profile?.credits_used || 0;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="p-4 bg-zinc-800 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-white">Current Plan</h3>
            <p className="text-sm text-zinc-400">
              {currentPlan === "free" ? "Free Trial" : `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">{credits}</div>
            <div className="text-sm text-zinc-400">credits remaining</div>
          </div>
        </div>

        {/* Credits bar */}
        <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
            style={{ width: `${Math.min((credits / 100) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          {creditsUsed} credits used this month
        </p>
      </div>

      {/* Upgrade Options */}
      <div>
        <h3 className="font-medium text-white mb-4">Upgrade Your Plan</h3>
        <div className="grid grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-xl border ${
                plan.popular
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-zinc-700 bg-zinc-800"
              }`}
            >
              {plan.popular && (
                <div className="text-xs font-medium text-purple-400 mb-2">
                  MOST POPULAR
                </div>
              )}
              <h4 className="font-medium text-white">{plan.name}</h4>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white">${plan.price}</span>
                <span className="text-zinc-400">/mo</span>
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => window.location.href = `/api/billing/checkout?plan=${plan.id}`}
                className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPlan === plan.id
                    ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    : plan.popular
                    ? "bg-purple-600 hover:bg-purple-500 text-white"
                    : "bg-zinc-700 hover:bg-zinc-600 text-white"
                }`}
                disabled={currentPlan === plan.id}
              >
                {currentPlan === plan.id ? "Current Plan" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Manage Subscription */}
      {currentPlan !== "free" && (
        <div className="pt-4 border-t border-zinc-800">
          <button
            onClick={() => window.location.href = "/api/billing/portal"}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Manage subscription in Stripe →
          </button>
        </div>
      )}
    </div>
  );
}
