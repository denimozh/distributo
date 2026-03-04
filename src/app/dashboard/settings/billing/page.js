"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ===========================================
// BILLING PAGE
// ===========================================

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [profile, setProfile] = useState(null);
  const [usage, setUsage] = useState(null);

  // Check for success/error params
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const creditsSuccess = searchParams.get("credits");

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Get profile with billing info
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    // Get usage stats
    const { data: usageData } = await supabase
      .from("credit_transactions")
      .select("amount, transaction_type, created_at")
      .eq("user_id", user.id)
      .gte("created_at", getMonthStart())
      .order("created_at", { ascending: false });

    const spent = usageData
      ?.filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

    setUsage({
      spent,
      transactions: usageData || [],
    });

    setLoading(false);
  };

  const handleUpgrade = async (planId) => {
    setUpgrading(planId);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
      }
    } catch (error) {
      alert("Failed to start checkout");
    }

    setUpgrading(null);
  };

  const handleBuyCredits = async (packId) => {
    setUpgrading(packId);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId, type: "credits" }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to start checkout");
      }
    } catch (error) {
      alert("Failed to start checkout");
    }

    setUpgrading(null);
  };

  const handleManageSubscription = () => {
    window.location.href = "/api/billing/portal";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentPlan = profile?.plan || "free";
  const credits = profile?.credits || 0;
  const creditsUsed = profile?.credits_used || 0;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
          🎉 Subscription activated! Your credits are ready to use.
        </div>
      )}
      {canceled && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400">
          Checkout was canceled. No charges were made.
        </div>
      )}
      {creditsSuccess === "success" && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400">
          ✓ Credits added to your account!
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Plan & Billing</h1>
        <p className="text-zinc-400">Manage your subscription and credits</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white">
                {currentPlan === "free" ? "Free Trial" : `${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan`}
              </h2>
              {profile?.subscription_status === "active" && (
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                  Active
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              {currentPlan === "free" 
                ? "Upgrade to unlock all features" 
                : "Your subscription renews monthly"}
            </p>
          </div>

          {/* Credits Display */}
          <div className="text-right">
            <div className="text-3xl font-bold text-white">{credits}</div>
            <div className="text-sm text-zinc-400">credits remaining</div>
          </div>
        </div>

        {/* Credits Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">{creditsUsed} used this month</span>
            <span className="text-zinc-400">{credits + creditsUsed} total</span>
          </div>
          <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
              style={{ width: `${Math.min((credits / (credits + creditsUsed || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Manage Button */}
        {profile?.stripe_customer_id && (
          <button
            onClick={handleManageSubscription}
            className="mt-4 text-sm text-purple-400 hover:text-purple-300"
          >
            Manage subscription →
          </button>
        )}
      </div>

      {/* Plans */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">
          {currentPlan === "free" ? "Choose a Plan" : "Change Plan"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlan === plan.id}
              onSelect={() => handleUpgrade(plan.id)}
              loading={upgrading === plan.id}
            />
          ))}
        </div>
      </div>

      {/* Credit Packs */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-2">Need More Credits?</h3>
        <p className="text-sm text-zinc-400 mb-4">Purchase additional credits anytime</p>
        
        <div className="grid grid-cols-3 gap-4">
          {CREDIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="text-2xl font-bold text-white">{pack.credits}</div>
              <div className="text-sm text-zinc-400">credits</div>
              <div className="mt-2 text-lg font-semibold text-white">${pack.price}</div>
              <div className="text-xs text-zinc-500">${pack.perCredit}/credit</div>
              <button
                onClick={() => handleBuyCredits(pack.id)}
                disabled={upgrading === pack.id}
                className="mt-3 w-full py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors"
              >
                {upgrading === pack.id ? "Loading..." : "Buy Now"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      {usage?.transactions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Date</th>
                  <th className="text-left text-sm font-medium text-zinc-400 px-4 py-3">Type</th>
                  <th className="text-right text-sm font-medium text-zinc-400 px-4 py-3">Credits</th>
                </tr>
              </thead>
              <tbody>
                {usage.transactions.slice(0, 10).map((tx, i) => (
                  <tr key={i} className="border-t border-zinc-800">
                    <td className="px-4 py-3 text-sm text-zinc-300">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-300 capitalize">
                      {tx.transaction_type.replace("_", " ")}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${
                      tx.amount > 0 ? "text-green-400" : "text-red-400"
                    }`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================
// PLAN CARD COMPONENT
// ===========================================

function PlanCard({ plan, isCurrentPlan, onSelect, loading }) {
  return (
    <div className={`relative p-5 rounded-xl border ${
      plan.popular 
        ? "border-purple-500 bg-purple-500/5" 
        : "border-zinc-800 bg-zinc-900"
    }`}>
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-600 text-white text-xs font-medium rounded-full">
          MOST POPULAR
        </div>
      )}

      <h4 className="text-lg font-semibold text-white">{plan.name}</h4>
      
      <div className="mt-2">
        <span className="text-3xl font-bold text-white">${plan.price}</span>
        <span className="text-zinc-400">/mo</span>
      </div>

      <div className="mt-1 text-sm text-purple-400">
        {plan.credits} credits/month
      </div>

      <ul className="mt-4 space-y-2">
        {plan.features.slice(0, 4).map((feature, i) => (
          <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
            <span className="text-green-400">✓</span>
            {feature}
          </li>
        ))}
        {plan.features.length > 4 && (
          <li className="text-sm text-zinc-500">
            +{plan.features.length - 4} more features
          </li>
        )}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrentPlan || loading}
        className={`mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isCurrentPlan
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : plan.popular
            ? "bg-purple-600 hover:bg-purple-500 text-white"
            : "bg-zinc-800 hover:bg-zinc-700 text-white"
        }`}
      >
        {loading ? "Loading..." : isCurrentPlan ? "Current Plan" : "Upgrade"}
      </button>
    </div>
  );
}

// ===========================================
// DATA
// ===========================================

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    credits: 25,
    features: [
      "20 test videos (5s)",
      "5 full videos (30s)",
      "TikTok + Instagram",
      "5 AI avatars",
      "Auto-captions",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 99,
    credits: 70,
    popular: true,
    features: [
      "50 test videos (5s)",
      "10 full videos (30s)",
      "Performance insights",
      "Weekly reports",
      "10 AI avatars",
      "Priority support",
    ],
  },
  {
    id: "scale",
    name: "Scale",
    price: 249,
    credits: 175,
    features: [
      "100 test videos (5s)",
      "25 full videos (30s)",
      "YouTube posting",
      "Winner extension",
      "Unlimited avatars",
      "Multi-shot ads",
    ],
  },
];

const CREDIT_PACKS = [
  { id: "small", credits: 10, price: 15, perCredit: "1.50" },
  { id: "medium", credits: 30, price: 39, perCredit: "1.30" },
  { id: "large", credits: 100, price: 99, perCredit: "0.99" },
];

function getMonthStart() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}
