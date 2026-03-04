"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ===========================================
// CREATE CAMPAIGN WIZARD
// The simplified 4-step flow to generate content
// ===========================================

export default function CreateCampaignPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(null);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Product
    productName: "",
    productBenefit: "",
    targetAudience: "",
    productUrl: "",
    
    // Step 2: Avatar
    avatarId: null,
    
    // Step 3: Content Type
    contentType: "mixed", // ugc, testimonial, demo, educational, mixed
    
    // Step 4: Volume
    hookCount: 20, // 20, 50, 100
  });
  
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);

    // Load profile for credits only
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
    
    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }
    
    if (profile) {
      setCredits(profile.credits || 0);
    }

    // Load system avatars
    const { data: avatarData } = await supabase
      .from("avatars")
      .select("*")
      .eq("is_system", true)
      .order("name");
    
    if (avatarData) {
      setAvatars(avatarData);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.productName.trim() && formData.productBenefit.trim();
      case 2:
        return formData.avatarId;
      case 3:
        return formData.contentType;
      case 4:
        return formData.hookCount > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleGenerate = async () => {
    if (!canProceed()) return;
    
    setGenerating(true);
    setError(null);
    setGenerationProgress({ phase: "Creating campaign...", percent: 5 });

    try {
      // Create campaign
      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: user.id,
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to create campaign");
      }

      // Poll for generation progress
      const campaignId = result.campaignId;
      pollGenerationProgress(campaignId);

    } catch (err) {
      setError(err.message);
      setGenerating(false);
    }
  };

  const pollGenerationProgress = async (campaignId) => {
    const checkProgress = async () => {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("status, videos_generated, total_videos")
        .eq("id", campaignId)
        .single();

      if (campaign) {
        const percent = campaign.total_videos > 0 
          ? Math.round((campaign.videos_generated / campaign.total_videos) * 100)
          : 10;

        if (campaign.status === "active") {
          // Done!
          router.push(`/dashboard/campaigns/${campaignId}`);
          return;
        } else if (campaign.status === "generating") {
          setGenerationProgress({
            phase: `Generating videos... (${campaign.videos_generated}/${campaign.total_videos})`,
            percent: Math.min(percent, 95),
          });
          setTimeout(checkProgress, 2000);
        } else if (campaign.status === "failed") {
          setError("Campaign generation failed. Please try again.");
          setGenerating(false);
        } else {
          setTimeout(checkProgress, 2000);
        }
      }
    };

    checkProgress();
  };

  const estimateCost = () => {
    const costs = {
      20: { credits: 2, dollars: "~$2" },
      50: { credits: 5, dollars: "~$5" },
      100: { credits: 10, dollars: "~$10" },
    };
    return costs[formData.hookCount] || costs[20];
  };

  // ===========================================
  // RENDER
  // ===========================================

  if (generating) {
    return <GeneratingScreen progress={generationProgress} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.push("/dashboard")}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Credits: {credits}</span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div 
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-purple-500" : "bg-zinc-800"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          <span className={step >= 1 ? "text-purple-400" : ""}>Product</span>
          <span className={step >= 2 ? "text-purple-400" : ""}>Avatar</span>
          <span className={step >= 3 ? "text-purple-400" : ""}>Content</span>
          <span className={step >= 4 ? "text-purple-400" : ""}>Generate</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <Step1Product 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        )}
        
        {step === 2 && (
          <Step2Avatar 
            avatars={avatars}
            selectedId={formData.avatarId}
            onSelect={(id, avatar) => {
              updateFormData("avatarId", id);
              setSelectedAvatar(avatar);
            }}
          />
        )}
        
        {step === 3 && (
          <Step3ContentType 
            selected={formData.contentType}
            onSelect={(type) => updateFormData("contentType", type)}
          />
        )}
        
        {step === 4 && (
          <Step4Volume 
            selected={formData.hookCount}
            onSelect={(count) => updateFormData("hookCount", count)}
            estimateCost={estimateCost}
            credits={credits}
            formData={formData}
            selectedAvatar={selectedAvatar}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-xl font-medium transition-all ${
                canProceed()
                  ? "bg-purple-600 hover:bg-purple-500 text-white"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canProceed() || credits < estimateCost().credits}
              className={`px-8 py-3 rounded-xl font-medium transition-all ${
                canProceed() && credits >= estimateCost().credits
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              }`}
            >
              🚀 Generate Campaign
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================================
// STEP 1: Product Info
// ===========================================

function Step1Product({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">What are you selling?</h1>
        <p className="text-zinc-400">Tell us about your product so we can create compelling content.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={formData.productName}
            onChange={(e) => updateFormData("productName", e.target.value)}
            placeholder="e.g., GlowSerum Pro"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Main Benefit / What it does *
          </label>
          <textarea
            value={formData.productBenefit}
            onChange={(e) => updateFormData("productBenefit", e.target.value)}
            placeholder="e.g., Clears acne in 2 weeks with a simple 30-second routine"
            rows={3}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Target Audience
          </label>
          <input
            type="text"
            value={formData.targetAudience}
            onChange={(e) => updateFormData("targetAudience", e.target.value)}
            placeholder="e.g., Women 18-35 struggling with hormonal acne"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Product URL
          </label>
          <input
            type="url"
            value={formData.productUrl}
            onChange={(e) => updateFormData("productUrl", e.target.value)}
            placeholder="https://yourproduct.com"
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

// ===========================================
// STEP 2: Avatar Selection
// ===========================================

function Step2Avatar({ avatars, selectedId, onSelect }) {
  const femaleAvatars = avatars.filter(a => a.gender === "female");
  const maleAvatars = avatars.filter(a => a.gender === "male");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Choose your presenter</h1>
        <p className="text-zinc-400">Select an AI avatar to present your content.</p>
      </div>

      {/* Female avatars */}
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Female</h3>
        <div className="grid grid-cols-5 gap-3">
          {femaleAvatars.map((avatar) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              isSelected={selectedId === avatar.id}
              onSelect={() => onSelect(avatar.id, avatar)}
            />
          ))}
        </div>
      </div>

      {/* Male avatars */}
      <div>
        <h3 className="text-sm font-medium text-zinc-400 mb-3">Male</h3>
        <div className="grid grid-cols-5 gap-3">
          {maleAvatars.map((avatar) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              isSelected={selectedId === avatar.id}
              onSelect={() => onSelect(avatar.id, avatar)}
            />
          ))}
        </div>
      </div>

      {/* Selected avatar info */}
      {selectedId && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          {avatars.filter(a => a.id === selectedId).map(avatar => (
            <div key={avatar.id} className="flex items-center gap-4">
              <img 
                src={avatar.image_url} 
                alt={avatar.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h4 className="font-medium text-white">{avatar.name}</h4>
                <p className="text-sm text-zinc-400">{avatar.description}</p>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-300">
                    {avatar.style}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-300">
                    {avatar.age_range}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AvatarCard({ avatar, isSelected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
        isSelected 
          ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-zinc-950 scale-105" 
          : "hover:scale-105 opacity-80 hover:opacity-100"
      }`}
    >
      <img 
        src={avatar.image_url || "/placeholder-avatar.jpg"} 
        alt={avatar.name}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <span className="text-xs font-medium text-white">{avatar.name}</span>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ===========================================
// STEP 3: Content Type
// ===========================================

function Step3ContentType({ selected, onSelect }) {
  const contentTypes = [
    {
      id: "ugc",
      name: "UGC Testimonials",
      description: "\"OMG this product changed my life...\"",
      icon: "💬",
    },
    {
      id: "demo",
      name: "Product Demos",
      description: "\"Let me show you how this works...\"",
      icon: "📱",
    },
    {
      id: "educational",
      name: "Educational",
      description: "\"Did you know that...\"",
      icon: "🎓",
    },
    {
      id: "mixed",
      name: "Mix (Recommended)",
      description: "All of the above for maximum testing",
      icon: "🎯",
      recommended: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">What kind of content?</h1>
        <p className="text-zinc-400">Choose the style that fits your product best.</p>
      </div>

      <div className="space-y-3">
        {contentTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selected === type.id
                ? "bg-purple-500/10 border-purple-500"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl">{type.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white">{type.name}</h3>
                  {type.recommended && (
                    <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 mt-1">{type.description}</p>
              </div>
              {selected === type.id && (
                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===========================================
// STEP 4: Volume / Generate
// ===========================================

function Step4Volume({ selected, onSelect, estimateCost, credits, formData, selectedAvatar }) {
  const volumes = [
    {
      count: 20,
      name: "Starter",
      description: "Good for testing",
      credits: 2,
      dollars: "~$2",
    },
    {
      count: 50,
      name: "Growth",
      description: "Find winning patterns",
      credits: 5,
      dollars: "~$5",
      recommended: true,
    },
    {
      count: 100,
      name: "Scale",
      description: "Full Hormozi method",
      credits: 10,
      dollars: "~$10",
    },
  ];

  const cost = estimateCost();
  const hasEnoughCredits = credits >= cost.credits;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">How many variations?</h1>
        <p className="text-zinc-400">More variations = better chance of finding winners.</p>
      </div>

      <div className="space-y-3">
        {volumes.map((vol) => (
          <button
            key={vol.count}
            onClick={() => onSelect(vol.count)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selected === vol.count
                ? "bg-purple-500/10 border-purple-500"
                : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{vol.count}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{vol.name}</h3>
                    {vol.recommended && (
                      <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-400">{vol.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-white">{vol.dollars}</div>
                <div className="text-xs text-zinc-500">{vol.credits} credits</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <h3 className="font-medium text-white mb-3">Campaign Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-400">Product</span>
            <span className="text-white">{formData.productName || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Avatar</span>
            <span className="text-white">{selectedAvatar?.name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Content Type</span>
            <span className="text-white capitalize">{formData.contentType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Hook Variations</span>
            <span className="text-white">{selected}</span>
          </div>
          <div className="border-t border-zinc-800 my-2" />
          <div className="flex justify-between font-medium">
            <span className="text-zinc-300">Cost</span>
            <span className={hasEnoughCredits ? "text-green-400" : "text-red-400"}>
              {cost.credits} credits ({cost.dollars})
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Your balance</span>
            <span className={hasEnoughCredits ? "text-zinc-400" : "text-red-400"}>
              {credits} credits
              {!hasEnoughCredits && " (not enough)"}
            </span>
          </div>
        </div>
      </div>

      {!hasEnoughCredits && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-sm text-yellow-400">
            You need {cost.credits - credits} more credits.{" "}
            <a href="/dashboard/settings/billing" className="underline">
              Get more credits →
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

// ===========================================
// GENERATING SCREEN
// ===========================================

function GeneratingScreen({ progress }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="max-w-md w-full px-6 text-center">
        {/* Animated icon */}
        <div className="w-20 h-20 mx-auto mb-6 relative">
          <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
          <div className="relative w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Creating your campaign</h2>
        <p className="text-zinc-400 mb-6">{progress?.phase || "Starting..."}</p>

        {/* Progress bar */}
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
            style={{ width: `${progress?.percent || 5}%` }}
          />
        </div>
        <p className="text-sm text-zinc-500">{progress?.percent || 5}%</p>

        {/* Fun messages */}
        <div className="mt-8 space-y-2 text-sm text-zinc-500">
          <p>✨ Crafting scroll-stopping hooks...</p>
          <p>🎬 Training AI to look authentically imperfect...</p>
          <p>🎯 This usually takes 2-3 minutes</p>
        </div>
      </div>
    </div>
  );
}
