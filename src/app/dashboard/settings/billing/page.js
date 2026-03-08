"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { IconCheck, IconChevronRight, IconZap } from "@/components/Icons";

export default function BillingPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plans = [
    {
      name: "Starter",
      price: 49,
      videos: 30,
      features: ["30 AI videos/month", "TikTok posting", "Basic analytics"],
      current: profile?.plan === "starter",
    },
    {
      name: "Growth",
      price: 149,
      videos: 55,
      features: ["55 AI videos/month", "TikTok + Instagram", "Advanced analytics", "Priority support"],
      current: profile?.plan === "growth",
      popular: true,
    },
    {
      name: "Scale",
      price: 299,
      videos: 115,
      features: ["115 AI videos/month", "All platforms", "Full analytics", "Custom avatars", "API access"],
      current: profile?.plan === "scale",
    },
  ];

  return (
    <div className="p-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/dashboard/settings" className="hover:text-gray-700">Settings</Link>
        <IconChevronRight className="w-4 h-4" />
        <span className="text-gray-900">Billing</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Billing & Credits</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your subscription and credits</p>
      </div>

      {/* Current Usage */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Current Balance</p>
            <p className="text-3xl font-semibold text-gray-900">{profile?.credits || 0} <span className="text-lg font-normal text-gray-500">credits</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Plan</p>
            <p className="text-lg font-medium text-gray-900 capitalize">{profile?.plan || "Free"}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Credits used this month</span>
            <span>{profile?.credits_used || 0} / {profile?.credits || 0}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full"
              style={{ width: `${Math.min(((profile?.credits_used || 0) / (profile?.credits || 1)) * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Plans */}
      <h2 className="text-sm font-medium text-gray-900 mb-3">Plans</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-lg border-2 p-4 relative ${
              plan.current ? "border-violet-600" : plan.popular ? "border-violet-200" : "border-gray-200"
            }`}
          >
            {plan.popular && !plan.current && (
              <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-violet-600 text-white text-xs font-medium rounded">
                Popular
              </span>
            )}
            {plan.current && (
              <span className="absolute -top-2.5 left-4 px-2 py-0.5 bg-violet-600 text-white text-xs font-medium rounded">
                Current
              </span>
            )}
            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
              <span className="text-sm text-gray-500">/month</span>
            </div>
            <ul className="space-y-2 mb-4">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <IconCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              disabled={plan.current}
              className={`w-full py-2 text-sm font-medium rounded-lg transition-colors ${
                plan.current
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-violet-600 text-white hover:bg-violet-700"
              }`}
            >
              {plan.current ? "Current Plan" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>

      {/* Credit Packs */}
      <h2 className="text-sm font-medium text-gray-900 mb-3">Credit Packs</h2>
      <div className="grid grid-cols-3 gap-4">
        <CreditPack credits={10} price={15} />
        <CreditPack credits={25} price={35} popular />
        <CreditPack credits={50} price={65} />
      </div>
    </div>
  );
}

function CreditPack({ credits, price, popular }) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${popular ? "border-violet-200" : "border-gray-200"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl font-semibold text-gray-900">{credits}</span>
        {popular && (
          <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs font-medium rounded">Best Value</span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-3">credits</p>
      <div className="flex items-center justify-between">
        <span className="text-lg font-medium text-gray-900">${price}</span>
        <button className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
          Buy
        </button>
      </div>
    </div>
  );
}
