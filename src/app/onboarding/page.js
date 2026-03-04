"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ===========================================
// ONBOARDING FLOW
// 5 steps, ~8 minutes, ends with first video queued
// ===========================================

const STEPS = [
  { id: "niche", title: "What do you sell?", duration: "1 min" },
  { id: "product", title: "Add your product", duration: "2 min" },
  { id: "connect", title: "Connect TikTok", duration: "2 min" },
  { id: "avatar", title: "Choose your presenter", duration: "1 min" },
  { id: "generate", title: "Create your first video", duration: "2 min" },
];

const NICHES = [
  { id: "tiktok_shop", name: "TikTok Shop", icon: "🛍️", description: "Physical products on TikTok Shop" },
  { id: "ecommerce", name: "E-commerce / DTC", icon: "📦", description: "Online store or Shopify" },
  { id: "saas", name: "SaaS / Software", icon: "💻", description: "Software product or service" },
  { id: "personal_brand", name: "Personal Brand", icon: "👤", description: "Building your presence" },
  { id: "indie_hacker", name: "Indie Hacker", icon: "🚀", description: "Solo founder building in public" },
  { id: "service", name: "Service Business", icon: "🛠️", description: "Coaching, consulting, services" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Onboarding data
  const [data, setData] = useState({
    niche: null,
    product: {
      name: "",
      description: "",
      benefit: "",
      url: "",
      images: [],
    },
    tiktokConnected: false,
    avatarId: null,
    firstVideoId: null,
  });

  // Check if already onboarded
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, onboarding_step, niche")
      .eq("id", user.id)
      .single();

    if (profile?.onboarding_completed) {
      router.push("/dashboard");
      return;
    }

    if (profile?.onboarding_step) {
      setStep(profile.onboarding_step);
    }

    if (profile?.niche) {
      setData(d => ({ ...d, niche: profile.niche }));
    }
  };

  const saveProgress = async (stepIndex) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        onboarding_step: stepIndex,
        niche: data.niche,
      })
      .eq("id", user.id);
  };

  const nextStep = () => {
    const newStep = Math.min(step + 1, STEPS.length - 1);
    setStep(newStep);
    saveProgress(newStep);
  };

  const prevStep = () => {
    setStep(Math.max(step - 1, 0));
  };

  const completeOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        onboarding_step: STEPS.length,
      })
      .eq("id", user.id);

    router.push("/dashboard?onboarding=complete");
  };

  const renderStep = () => {
    switch (STEPS[step].id) {
      case "niche":
        return (
          <NicheStep
            selected={data.niche}
            onSelect={(niche) => {
              setData({ ...data, niche });
              nextStep();
            }}
          />
        );

      case "product":
        return (
          <ProductStep
            product={data.product}
            onChange={(product) => setData({ ...data, product })}
            onNext={nextStep}
            onBack={prevStep}
          />
        );

      case "connect":
        return (
          <ConnectStep
            connected={data.tiktokConnected}
            onConnected={() => {
              setData({ ...data, tiktokConnected: true });
              nextStep();
            }}
            onSkip={nextStep}
            onBack={prevStep}
          />
        );

      case "avatar":
        return (
          <AvatarStep
            selected={data.avatarId}
            niche={data.niche}
            onSelect={(avatarId) => {
              setData({ ...data, avatarId });
              nextStep();
            }}
            onBack={prevStep}
          />
        );

      case "generate":
        return (
          <GenerateStep
            data={data}
            onComplete={completeOnboarding}
            onBack={prevStep}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Distributo
          </div>
          <div className="text-sm text-zinc-400">
            Step {step + 1} of {STEPS.length}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= step ? "bg-purple-500" : "bg-zinc-800"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {renderStep()}
      </div>
    </div>
  );
}

// ===========================================
// STEP 1: NICHE SELECTION
// ===========================================

function NicheStep({ selected, onSelect }) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">What type of business do you have?</h1>
      <p className="text-zinc-400 mb-8">We'll customize your experience based on your niche.</p>

      <div className="grid grid-cols-2 gap-4">
        {NICHES.map((niche) => (
          <button
            key={niche.id}
            onClick={() => onSelect(niche.id)}
            className={`p-4 rounded-xl border text-left transition-all ${
              selected === niche.id
                ? "border-purple-500 bg-purple-500/10"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="text-2xl mb-2">{niche.icon}</div>
            <div className="font-medium">{niche.name}</div>
            <div className="text-sm text-zinc-400 mt-1">{niche.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===========================================
// STEP 2: PRODUCT SETUP
// ===========================================

function ProductStep({ product, onChange, onNext, onBack }) {
  const [urlLoading, setUrlLoading] = useState(false);

  const scrapeUrl = async () => {
    if (!product.url) return;

    setUrlLoading(true);
    try {
      const response = await fetch("/api/scraper/product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: product.url }),
      });

      const data = await response.json();
      if (data.success) {
        onChange({
          ...product,
          name: data.name || product.name,
          description: data.description || product.description,
          images: data.images || product.images,
        });
      }
    } catch (error) {
      console.error("Scrape failed:", error);
    }
    setUrlLoading(false);
  };

  const canProceed = product.name && product.description;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Tell us about your product</h1>
      <p className="text-zinc-400 mb-8">We'll use this to generate scripts and videos.</p>

      <div className="space-y-4">
        {/* URL Import */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Product URL <span className="text-zinc-500">(optional - we'll auto-fill)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={product.url}
              onChange={(e) => onChange({ ...product, url: e.target.value })}
              placeholder="https://yourstore.com/product"
              className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={scrapeUrl}
              disabled={!product.url || urlLoading}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 rounded-xl text-sm font-medium"
            >
              {urlLoading ? "Loading..." : "Import"}
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-800 my-6" />

        {/* Manual Entry */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Product Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => onChange({ ...product, name: e.target.value })}
            placeholder="e.g., GlowSerum Pro"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Main Benefit <span className="text-red-400">*</span>
          </label>
          <textarea
            value={product.description}
            onChange={(e) => onChange({ ...product, description: e.target.value })}
            placeholder="What's the #1 thing your product does? e.g., 'Clears acne in 2 weeks'"
            rows={2}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Why it works <span className="text-zinc-500">(optional)</span>
          </label>
          <textarea
            value={product.benefit}
            onChange={(e) => onChange({ ...product, benefit: e.target.value })}
            placeholder="What makes it special? e.g., 'Uses patented 3-step formula'"
            rows={2}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
          />
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 text-zinc-400 hover:text-white"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ===========================================
// STEP 3: CONNECT TIKTOK
// ===========================================

function ConnectStep({ connected, onConnected, onSkip, onBack }) {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Check URL params for successful connection
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "tiktok_connected") {
      onConnected();
    }
  }, []);

  const handleConnect = () => {
    window.location.href = "/api/auth/tiktok";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Connect your TikTok</h1>
      <p className="text-zinc-400 mb-8">
        We'll post your videos automatically at the best times.
      </p>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
        {connected ? (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-lg font-medium text-green-400">TikTok Connected!</h3>
            <p className="text-sm text-zinc-400 mt-2">
              Your account is ready for automatic posting.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎵</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Connect TikTok Account</h3>
            <p className="text-sm text-zinc-400 mb-6">
              This allows Distributo to post videos on your behalf.
            </p>
            <button
              onClick={handleConnect}
              className="px-8 py-3 bg-pink-500 hover:bg-pink-400 rounded-xl font-medium"
            >
              Connect TikTok
            </button>
          </>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 text-zinc-400 hover:text-white"
        >
          ← Back
        </button>
        <div className="flex gap-2">
          {!connected && (
            <button
              onClick={onSkip}
              className="px-6 py-3 text-zinc-400 hover:text-white"
            >
              Skip for now
            </button>
          )}
          {connected && (
            <button
              onClick={onSkip}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// STEP 4: AVATAR SELECTION
// ===========================================

function AvatarStep({ selected, niche, onSelect, onBack }) {
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    const { data } = await supabase
      .from("avatars")
      .select("*")
      .eq("is_system", true)
      .limit(6);

    setAvatars(data || []);
    setLoading(false);
  };

  // Recommend avatars based on niche
  const getRecommendedStyle = () => {
    const styles = {
      tiktok_shop: "energetic",
      ecommerce: "warm",
      saas: "professional",
      personal_brand: "casual",
      indie_hacker: "casual",
      service: "professional",
    };
    return styles[niche] || "warm";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Choose your AI presenter</h1>
      <p className="text-zinc-400 mb-8">
        This avatar will appear in your UGC-style videos.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {avatars.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => onSelect(avatar.id)}
            className={`relative rounded-xl overflow-hidden border-2 transition-all ${
              selected === avatar.id
                ? "border-purple-500 ring-2 ring-purple-500/50"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="aspect-[3/4] bg-zinc-800">
              {avatar.image_url ? (
                <img
                  src={avatar.image_url}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  👤
                </div>
              )}
            </div>
            <div className="p-3 bg-zinc-900">
              <div className="font-medium text-sm">{avatar.name}</div>
              <div className="text-xs text-zinc-500 capitalize">{avatar.style}</div>
            </div>
            {avatar.style === getRecommendedStyle() && (
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-purple-600 text-xs rounded-full">
                Recommended
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          className="px-6 py-3 text-zinc-400 hover:text-white"
        >
          ← Back
        </button>
        <button
          onClick={() => onSelect(selected || avatars[0]?.id)}
          disabled={!avatars.length}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl font-medium"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

// ===========================================
// STEP 5: GENERATE FIRST VIDEO
// ===========================================

function GenerateStep({ data, onComplete, onBack }) {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const generateFirstVideo = async () => {
    setGenerating(true);
    setProgress(10);

    try {
      // Step 1: Generate hooks
      setProgress(20);
      const hooksResponse = await fetch("/api/hooks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: data.product.name,
          productBenefit: data.product.description,
          niche: data.niche,
          count: 3,
        }),
      });
      const hooks = await hooksResponse.json();
      setProgress(40);

      // Step 2: Create campaign
      const campaignResponse = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `First Campaign - ${data.product.name}`,
          productName: data.product.name,
          productBenefit: data.product.description,
          avatarId: data.avatarId,
          hooks: hooks.hooks?.slice(0, 1) || [{ script: `You need to try ${data.product.name}!` }],
          videoCount: 1,
          format: "talking_head",
          duration: 15,
        }),
      });
      const campaign = await campaignResponse.json();
      setProgress(80);

      // Step 3: Queue for posting (if TikTok connected)
      if (data.tiktokConnected && campaign.videos?.[0]) {
        await fetch("/api/videos/post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId: campaign.videos[0].id,
            platforms: ["tiktok"],
            scheduleOptimal: true,
          }),
        });
      }

      setProgress(100);
      setResult({
        success: true,
        campaign: campaign,
        queued: data.tiktokConnected,
      });

    } catch (error) {
      console.error("Generation failed:", error);
      setResult({
        success: false,
        error: error.message,
      });
    }

    setGenerating(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Let's create your first video!</h1>
      <p className="text-zinc-400 mb-8">
        We'll generate a hook and create a video ready to post.
      </p>

      {/* Summary */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <h3 className="font-medium mb-4">Your setup:</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Business type</span>
            <span className="capitalize">{data.niche?.replace("_", " ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Product</span>
            <span>{data.product.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">TikTok</span>
            <span className={data.tiktokConnected ? "text-green-400" : "text-zinc-500"}>
              {data.tiktokConnected ? "Connected ✓" : "Not connected"}
            </span>
          </div>
        </div>
      </div>

      {/* Generate Button / Progress */}
      {!generating && !result && (
        <button
          onClick={generateFirstVideo}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-medium text-lg"
        >
          🚀 Generate My First Video
        </button>
      )}

      {generating && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
            <span>Creating your video...</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-zinc-400 mt-2">
            {progress < 30 && "Generating hooks..."}
            {progress >= 30 && progress < 60 && "Creating campaign..."}
            {progress >= 60 && progress < 90 && "Generating video..."}
            {progress >= 90 && "Almost done..."}
          </div>
        </div>
      )}

      {result && (
        <div className={`bg-zinc-900 border rounded-xl p-6 ${
          result.success ? "border-green-500/50" : "border-red-500/50"
        }`}>
          {result.success ? (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-green-400">Your first video is generating!</h3>
                <p className="text-zinc-400 mt-2">
                  {result.queued
                    ? "It will be posted to TikTok tonight at the optimal time."
                    : "Check your dashboard to see it when ready."}
                </p>
              </div>
              <button
                onClick={onComplete}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-medium"
              >
                Go to Dashboard →
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">😕</div>
                <h3 className="text-xl font-bold text-red-400">Something went wrong</h3>
                <p className="text-zinc-400 mt-2">{result.error}</p>
              </div>
              <button
                onClick={generateFirstVideo}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl font-medium"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={onBack}
          disabled={generating}
          className="px-6 py-3 text-zinc-400 hover:text-white disabled:opacity-50"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
