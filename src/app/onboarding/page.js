"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { id: "workspace", title: "Workspace" },
  { id: "business", title: "Business" },
  { id: "product", title: "Product" },
  { id: "platforms", title: "Platforms" },
  { id: "avatar", title: "Avatar" },
  { id: "preview", title: "Preview" },
];

const WORKSPACE_TYPES = [
  { id: "solo", title: "Just me", desc: "Solo creator or founder" },
  { id: "team", title: "Small team", desc: "2-10 people" },
  { id: "agency", title: "Agency", desc: "Managing multiple brands" },
];

const BUSINESS_TYPES = [
  { id: "tiktok-shop", title: "TikTok Shop", desc: "Selling products on TikTok" },
  { id: "ecommerce", title: "E-commerce", desc: "Shopify, Amazon, DTC" },
  { id: "saas", title: "SaaS / App", desc: "Software products" },
  { id: "service", title: "Service", desc: "Coaching, consulting" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatars, setAvatars] = useState([]);
  
  const [data, setData] = useState({
    workspaceType: null,
    businessType: null,
    productName: "",
    productBenefit: "",
    targetAudience: "",
    productUrl: "",
    platforms: [],
    avatarId: null,
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

    // Load avatars
    const { data: avatarData } = await supabase
      .from("avatars")
      .select("*")
      .eq("is_system", true)
      .order("name");

    setAvatars(avatarData || []);
    setLoading(false);
  };

  const handleComplete = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Map UI business type to pillar system business type
    const businessTypeMap = {
      'tiktok-shop': 'tiktok-shop',
      'ecommerce': 'ecommerce',
      'saas': 'saas',
      'service': 'service',
      'content-creator': 'content-creator',
    };
    
    const businessType = businessTypeMap[data.businessType] || 'ecommerce';
    
    if (user) {
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          workspace_type: data.workspaceType,
          niche: data.businessType,
          business_type: businessType,
          target_audience: data.targetAudience,
        })
        .eq("id", user.id);

      // Create first strategy if product info provided
      if (data.productName && data.avatarId) {
        await fetch("/api/campaigns/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            productName: data.productName,
            productBenefit: data.productBenefit,
            targetAudience: data.targetAudience,
            productUrl: data.productUrl,
            avatarId: data.avatarId,
            hookCount: 1,
            contentType: "mixed",
          }),
        });
      }
    }

    router.push("/dashboard");
  };

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '48px' }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '500',
              background: i <= step ? '#7c3aed' : '#e5e7eb',
              color: i <= step ? 'white' : '#6b7280',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: '40px', height: '2px', background: i < step ? '#7c3aed' : '#e5e7eb' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Step 1: Workspace Type */}
        {step === 0 && (
          <StepContainer title="How will you use Distributo?" subtitle="This helps us tailor your experience">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {WORKSPACE_TYPES.map(type => (
                <OptionCard
                  key={type.id}
                  title={type.title}
                  desc={type.desc}
                  selected={data.workspaceType === type.id}
                  onClick={() => setData(d => ({ ...d, workspaceType: type.id }))}
                />
              ))}
            </div>
            <StepNav onNext={nextStep} canNext={!!data.workspaceType} />
          </StepContainer>
        )}

        {/* Step 2: Business Type */}
        {step === 1 && (
          <StepContainer title="What type of business are you?" subtitle="We'll customize content formats for your niche">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {BUSINESS_TYPES.map(type => (
                <OptionCard
                  key={type.id}
                  title={type.title}
                  desc={type.desc}
                  selected={data.businessType === type.id}
                  onClick={() => setData(d => ({ ...d, businessType: type.id }))}
                />
              ))}
            </div>
            <StepNav onBack={prevStep} onNext={nextStep} canNext={!!data.businessType} />
          </StepContainer>
        )}

        {/* Step 3: Product Setup */}
        {step === 2 && (
          <StepContainer title="Tell us about your product" subtitle="We'll use this to generate your first content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Product URL
                </label>
                <input
                  type="url"
                  placeholder="https://yourstore.com/product"
                  value={data.productUrl}
                  onChange={(e) => setData(d => ({ ...d, productUrl: e.target.value }))}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Paste URL to auto-fill product details</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Glow Serum"
                  value={data.productName}
                  onChange={(e) => setData(d => ({ ...d, productName: e.target.value }))}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Main Benefit *
                </label>
                <textarea
                  rows={2}
                  placeholder="What problem does it solve?"
                  value={data.productBenefit}
                  onChange={(e) => setData(d => ({ ...d, productBenefit: e.target.value }))}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', resize: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                  Target Audience
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Postpartum mothers 6-18 months after birth struggling with baby weight"
                  value={data.targetAudience || ''}
                  onChange={(e) => setData(d => ({ ...d, targetAudience: e.target.value }))}
                  style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', resize: 'none' }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Be specific - the more detail, the better the content</p>
              </div>
            </div>
            <StepNav onBack={prevStep} onNext={nextStep} canNext={!!data.productName && !!data.productBenefit} />
          </StepContainer>
        )}

        {/* Step 4: Platform Connection */}
        {step === 3 && (
          <StepContainer title="Connect your platforms" subtitle="We'll post videos automatically to your accounts">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <PlatformCard
                name="TikTok"
                icon="tiktok"
                connected={data.platforms.includes('tiktok')}
                onConnect={() => setData(d => ({ ...d, platforms: [...d.platforms, 'tiktok'] }))}
              />
              <PlatformCard
                name="Instagram"
                icon="instagram"
                connected={data.platforms.includes('instagram')}
                onConnect={() => setData(d => ({ ...d, platforms: [...d.platforms, 'instagram'] }))}
              />
            </div>
            
            {/* Navigation - different if platforms connected */}
            {data.platforms.length > 0 ? (
              <StepNav onBack={prevStep} onNext={nextStep} canNext={true} nextLabel="Continue" />
            ) : (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={prevStep}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    Skip for now
                  </button>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px', textAlign: 'center' }}>
                  You can connect platforms later in Settings
                </p>
              </div>
            )}
          </StepContainer>
        )}

        {/* Step 5: Avatar Selection */}
        {step === 4 && (
          <StepContainer title="Choose your AI presenter" subtitle="This is the face that will appear in your videos">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
              {avatars.slice(0, 9).map(avatar => (
                <AvatarCard
                  key={avatar.id}
                  avatar={avatar}
                  selected={data.avatarId === avatar.id}
                  onClick={() => setData(d => ({ ...d, avatarId: avatar.id }))}
                />
              ))}
            </div>
            <StepNav onBack={prevStep} onNext={nextStep} canNext={!!data.avatarId} />
          </StepContainer>
        )}

        {/* Step 6: Preview & Launch */}
        {step === 5 && (
          <StepContainer title="Ready to generate your first content" subtitle="Here's a preview of your strategy">
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                {/* Avatar Preview */}
                <div style={{ width: '120px', aspectRatio: '9/16', background: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                  {data.avatarId && avatars.find(a => a.id === data.avatarId)?.image_url && (
                    <img
                      src={avatars.find(a => a.id === data.avatarId).image_url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  {/* Hook text overlay */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                    <p style={{ fontSize: '10px', color: 'white', fontWeight: '500' }}>
                      "I've been using {data.productName || 'this product'} for a week and..."
                    </p>
                  </div>
                </div>

                {/* Strategy Details */}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>{data.productName} Strategy</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#6b7280' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Videos to generate:</span>
                      <span style={{ color: '#111827', fontWeight: '500' }}>1</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Platforms:</span>
                      <span style={{ color: '#111827', fontWeight: '500' }}>{data.platforms.length > 0 ? data.platforms.join(', ') : 'None connected'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Estimated cost:</span>
                      <span style={{ color: '#7c3aed', fontWeight: '600' }}>1 credit (~$1)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={saving}
              style={{
                width: '100%',
                padding: '14px',
                background: '#7c3aed',
                color: 'white',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Setting up..." : "Generate My First Strategy"}
            </button>
            <button
              onClick={prevStep}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#6b7280',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              Go back
            </button>
          </StepContainer>
        )}
      </div>
    </div>
  );
}

function StepContainer({ title, subtitle, children }) {
  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '32px', border: '1px solid #e5e7eb' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{title}</h1>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>{subtitle}</p>
      {children}
    </div>
  );
}

function OptionCard({ title, desc, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '16px',
        background: selected ? '#f5f3ff' : 'white',
        border: selected ? '2px solid #7c3aed' : '1px solid #e5e7eb',
        borderRadius: '12px',
        textAlign: 'left',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <p style={{ fontSize: '15px', fontWeight: '500', color: '#111827' }}>{title}</p>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>{desc}</p>
      </div>
      {selected && (
        <div style={{ width: '20px', height: '20px', background: '#7c3aed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '12px' }}>✓</span>
        </div>
      )}
    </button>
  );
}

function PlatformCard({ name, icon, connected, onConnect }) {
  return (
    <div style={{
      padding: '16px',
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon === 'tiktok' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#111827"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="18" cy="6" r="1.5" /></svg>
          )}
        </div>
        <div>
          <p style={{ fontSize: '15px', fontWeight: '500', color: '#111827' }}>{name}</p>
          <p style={{ fontSize: '13px', color: connected ? '#059669' : '#6b7280' }}>
            {connected ? 'Connected' : 'Not connected'}
          </p>
        </div>
      </div>
      <button
        onClick={onConnect}
        disabled={connected}
        style={{
          padding: '8px 16px',
          background: connected ? '#ecfdf5' : '#7c3aed',
          color: connected ? '#059669' : 'white',
          fontSize: '14px',
          fontWeight: '500',
          border: 'none',
          borderRadius: '8px',
          cursor: connected ? 'default' : 'pointer',
        }}
      >
        {connected ? '✓ Connected' : 'Connect'}
      </button>
    </div>
  );
}

function AvatarCard({ avatar, selected, onClick }) {
  const NICHE_TAGS = {
    'Sophie': 'Beauty & Lifestyle',
    'Marcus': 'Tech & Reviews',
    'Emma': 'Fashion & Style',
    'James': 'Fitness & Health',
    'Olivia': 'Home & Living',
    'Lucas': 'Gaming & Tech',
    'Ava': 'Skincare & Beauty',
    'Noah': 'Business & Finance',
    'Isabella': 'Food & Cooking',
    'David': 'E-commerce & Reviews',
    'Maria': 'Wellness & Self-care',
  };

  return (
    <button
      onClick={onClick}
      style={{
        padding: 0,
        background: 'none',
        border: selected ? '3px solid #7c3aed' : '2px solid #e5e7eb',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <div style={{ aspectRatio: '1', background: '#f3f4f6' }}>
        {avatar.image_url && (
          <img src={avatar.image_url} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>
      <div style={{ padding: '8px', background: 'white' }}>
        <p style={{ fontSize: '12px', fontWeight: '500', color: '#111827' }}>{avatar.name}</p>
        <p style={{ fontSize: '10px', color: '#6b7280' }}>{NICHE_TAGS[avatar.name] || 'General'}</p>
      </div>
      {selected && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', width: '24px', height: '24px', background: '#7c3aed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '14px' }}>✓</span>
        </div>
      )}
    </button>
  );
}

function StepNav({ onBack, onNext, canNext, nextLabel = "Continue" }) {
  return (
    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
      {onBack && (
        <button
          onClick={onBack}
          style={{
            flex: 1,
            padding: '12px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          Back
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!canNext}
        style={{
          flex: onBack ? 1 : '100%',
          padding: '12px',
          background: canNext ? '#7c3aed' : '#e5e7eb',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          color: canNext ? 'white' : '#9ca3af',
          cursor: canNext ? 'pointer' : 'not-allowed',
        }}
      >
        {nextLabel}
      </button>
    </div>
  );
}
