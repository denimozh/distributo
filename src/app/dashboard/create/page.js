"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STRATEGY_TYPES = [
  { id: 'test-everything', name: 'Test Everything', desc: 'Generate 1 video for testing', videos: 1, credits: 1, dollars: 1 },
  { id: 'quick-test', name: 'Quick Test', desc: 'Generate 1 video to start', videos: 1, credits: 1, dollars: 1 },
  { id: 'scale-winners', name: 'Scale What Works', desc: 'Generate 1 video from top hook', videos: 1, credits: 1, dollars: 1 },
];

const POSTING_FREQUENCIES = [
  { id: '1x', label: '1x daily', desc: '7 videos/week' },
  { id: '2x', label: '2x daily', desc: '14 videos/week' },
  { id: '3x', label: '3x daily', desc: '21 videos/week' },
];

export default function CreateStrategyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [avatars, setAvatars] = useState([]);
  const [profile, setProfile] = useState(null);
  const [platforms, setPlatforms] = useState({ tiktok: false, instagram: false });
  const [expandedSection, setExpandedSection] = useState(1);
  
  const [touched, setTouched] = useState({ product: false, avatar: false, strategy: false, footage: false, schedule: false });
  
  const [form, setForm] = useState({
    productUrl: '',
    productName: '',
    productBenefit: '',
    targetAudience: '',
    customerReviews: '',
    avatarId: null,
    strategyType: 'test-everything',
    productFootage: null,
    postingFrequency: '1x',
    postingTime: '09:00',
    postingDuration: '7',
  });

  const productComplete = form.productName.trim() && form.productBenefit.trim();
  const avatarComplete = !!form.avatarId;
  const strategyComplete = !!form.strategyType;
  const scheduleComplete = !!form.postingFrequency;
  const canGenerate = productComplete && avatarComplete && strategyComplete;

  const selectedStrategy = STRATEGY_TYPES.find(s => s.id === form.strategyType);
  const selectedAvatar = avatars.find(a => a.id === form.avatarId);
  const firstAvatar = avatars[0];
  const previewAvatar = selectedAvatar || firstAvatar;

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const avatarParam = searchParams.get('avatar');
    if (avatarParam && avatars.length > 0) {
      setForm(f => ({ ...f, avatarId: avatarParam }));
      setTouched(t => ({ ...t, avatar: true }));
    }
  }, [searchParams, avatars]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(profileData);

    const { data: avatarData } = await supabase.from("avatars").select("*").eq("is_system", true).order("name");
    setAvatars(avatarData || []);

    const { data: connections } = await supabase.from("platform_connections").select("platform").eq("user_id", user.id);
    if (connections) {
      setPlatforms({ tiktok: connections.some(c => c.platform === 'tiktok'), instagram: connections.some(c => c.platform === 'instagram') });
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if ((profile?.credits || 0) < selectedStrategy.credits) {
      alert(`Not enough credits. You need ${selectedStrategy.credits} credits.`);
      return;
    }

    setGenerating(true);
    setGenerationStep(1);

    try {
      // If product footage is provided, upload it first
      let productFootageUrl = null;
      if (form.productFootage) {
        setGenerationStep(0); // Add uploading step
        const formData = new FormData();
        formData.append('file', form.productFootage);
        formData.append('userId', user.id);
        
        const uploadResponse = await fetch("/api/upload/video", {
          method: "POST",
          body: formData,
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          productFootageUrl = uploadData.url;
        }
      }

      await new Promise(r => setTimeout(r, 1500));
      setGenerationStep(2);
      await new Promise(r => setTimeout(r, 2000));
      setGenerationStep(3);

      const response = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productName: form.productName,
          productBenefit: form.productBenefit,
          targetAudience: form.targetAudience,
          customerReviews: form.customerReviews,
          productUrl: form.productUrl,
          avatarId: form.avatarId,
          hookCount: 20,
          contentType: 'mixed',
          postingFrequency: form.postingFrequency,
          postingTime: form.postingTime,
          productFootageUrl, // Include product footage if uploaded
          hasProductFootage: !!productFootageUrl,
        }),
      });

      const data = await response.json();
      setGenerationStep(4);
      await new Promise(r => setTimeout(r, 1000));
      setGenerationStep(5);
      await new Promise(r => setTimeout(r, 800));

      router.push(`/dashboard/videos/${data.campaignId}`);
    } catch (error) {
      console.error("Generation failed:", error);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (generating) {
    const steps = [
      { id: 1, label: 'Analyzing product' },
      { id: 2, label: 'Writing hooks' },
      { id: 3, label: 'Generating video' },
      { id: 4, label: 'Quality check' },
      { id: 5, label: 'Scheduling posts' },
    ];

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px' }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '64px', height: '64px', margin: '0 auto 24px', position: 'relative' }}>
            <svg style={{ animation: 'spin 2s linear infinite' }} width="64" height="64" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#7c3aed" strokeWidth="4" strokeDasharray="176" strokeDashoffset={176 - (generationStep / 5) * 176} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s' }} />
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Creating your strategy</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px' }}>This usually takes 2-3 minutes</p>
          <div style={{ textAlign: 'left' }}>
            {steps.map((step) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: step.id < 5 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: generationStep >= step.id ? '#7c3aed' : '#e5e7eb', color: generationStep >= step.id ? 'white' : '#9ca3af', fontSize: '12px', fontWeight: '600' }}>
                  {generationStep > step.id ? '✓' : step.id}
                </div>
                <span style={{ fontSize: '14px', color: generationStep >= step.id ? '#111827' : '#9ca3af', fontWeight: generationStep === step.id ? '500' : '400', flex: 1 }}>
                  {step.label}{generationStep === step.id && step.id === 3 && <span style={{ color: '#6b7280', fontWeight: '400' }}> (~2 min)</span>}
                </span>
                {generationStep === step.id && <div style={{ width: '16px', height: '16px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
              </div>
            ))}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left Panel - Form */}
      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>New Strategy</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '28px' }}>Set up your content strategy</p>

          {/* Section 1: Product */}
          <AccordionSection number={1} title="Product" subtitle="What are you promoting?" complete={productComplete} touched={touched.product} expanded={expandedSection === 1} onToggle={() => setExpandedSection(expandedSection === 1 ? 0 : 1)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>Paste your product URL to auto-fill everything below</p>
                <div style={{ position: 'relative' }}>
                  <input type="url" placeholder="https://yourstore.com/product" value={form.productUrl} onChange={(e) => { setForm(f => ({ ...f, productUrl: e.target.value })); setTouched(t => ({ ...t, product: true })); }} style={{ width: '100%', padding: '16px 16px 16px 48px', border: '2px solid #d1d5db', borderRadius: '12px', fontSize: '16px', fontWeight: '500' }} />
                  <svg style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Product Name <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" placeholder="e.g., Glow Serum" value={form.productName} onChange={(e) => { setForm(f => ({ ...f, productName: e.target.value })); setTouched(t => ({ ...t, product: true })); }} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Main Benefit <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea rows={2} placeholder="What problem does it solve?" value={form.productBenefit} onChange={(e) => { setForm(f => ({ ...f, productBenefit: e.target.value })); setTouched(t => ({ ...t, product: true })); }} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Target Audience</label>
                <textarea rows={2} placeholder="e.g., Postpartum mothers 6-18 months after birth struggling with baby weight while managing work" value={form.targetAudience} onChange={(e) => setForm(f => ({ ...f, targetAudience: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none' }} />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Be specific - the more detail, the better the content</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Customer Reviews <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '400' }}>(optional)</span></label>
                <textarea rows={3} placeholder="Paste 2-3 real customer reviews or testimonials. We'll use their exact language to make content more authentic." value={form.customerReviews} onChange={(e) => setForm(f => ({ ...f, customerReviews: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', resize: 'none' }} />
              </div>
            </div>
          </AccordionSection>

          {/* Section 2: Avatar */}
          <AccordionSection number={2} title="Avatar" subtitle="Choose your AI presenter" complete={avatarComplete} touched={touched.avatar} expanded={expandedSection === 2} onToggle={() => setExpandedSection(expandedSection === 2 ? 0 : 2)}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {avatars.slice(0, 8).map((avatar) => (
                <AvatarOption key={avatar.id} avatar={avatar} selected={form.avatarId === avatar.id} onClick={() => { setForm(f => ({ ...f, avatarId: avatar.id })); setTouched(t => ({ ...t, avatar: true })); }} />
              ))}
            </div>
            <button onClick={() => router.push('/dashboard/avatars')} style={{ marginTop: '12px', fontSize: '13px', color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>View all avatars →</button>
          </AccordionSection>

          {/* Section 3: Strategy Type - EXPANDED to show content */}
          <AccordionSection number={3} title="Strategy Type" subtitle="How much content to generate" complete={strategyComplete} touched={touched.strategy} hasDefault expanded={expandedSection === 3} onToggle={() => setExpandedSection(expandedSection === 3 ? 0 : 3)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {STRATEGY_TYPES.map((type) => (
                <button key={type.id} onClick={() => { setForm(f => ({ ...f, strategyType: type.id })); setTouched(t => ({ ...t, strategy: true })); }} style={{ width: '100%', padding: '16px', background: form.strategyType === type.id ? '#f5f3ff' : 'white', border: form.strategyType === type.id ? '2px solid #7c3aed' : '1px solid #d1d5db', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{type.name}</p>
                    <p style={{ fontSize: '13px', color: '#6b7280' }}>{type.desc}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '15px', fontWeight: '600', color: '#7c3aed' }}>{type.credits} credits</p>
                    <p style={{ fontSize: '12px', color: '#6b7280' }}>{type.videos} videos</p>
                  </div>
                </button>
              ))}
            </div>
          </AccordionSection>

          {/* Section 4: Product Footage */}
          <AccordionSection number={4} title="Product Footage" subtitle="Add demo clips (optional)" complete={!!form.productFootage} touched={touched.footage} optional expanded={expandedSection === 4} onToggle={() => setExpandedSection(expandedSection === 4 ? 0 : 4)}>
            <div onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed #d1d5db', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: form.productFootage ? '#f5f3ff' : 'white' }}>
              {form.productFootage ? (
                <div>
                  <svg style={{ margin: '0 auto 12px', color: '#7c3aed' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{form.productFootage.name}</p>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Click to replace</p>
                </div>
              ) : (
                <div>
                  <svg style={{ margin: '0 auto 12px', color: '#9ca3af' }} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Upload product footage</p>
                  <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>MP4 or MOV, up to 30 seconds</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setForm(f => ({ ...f, productFootage: file })); setTouched(t => ({ ...t, footage: true })); }}} style={{ display: 'none' }} />
            </div>
          </AccordionSection>

          {/* Section 5: Schedule - EXPANDED to show content */}
          <AccordionSection number={5} title="Schedule" subtitle="When to post your content" complete={scheduleComplete} touched={touched.schedule} hasDefault expanded={expandedSection === 5} onToggle={() => setExpandedSection(expandedSection === 5 ? 0 : 5)}>
            {!platforms.tiktok && !platforms.instagram ? (
              <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '8px', padding: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#5b21b6' }}>Connect a platform first</p>
                  <p style={{ fontSize: '13px', color: '#7c3aed' }}>Videos will generate but won't auto-post</p>
                </div>
                <a href="/dashboard/settings" style={{ padding: '8px 14px', background: '#7c3aed', color: 'white', fontSize: '13px', fontWeight: '500', borderRadius: '6px', textDecoration: 'none' }}>Connect</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>Posting Frequency</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {POSTING_FREQUENCIES.map((freq) => (
                      <button key={freq.id} onClick={() => { setForm(f => ({ ...f, postingFrequency: freq.id })); setTouched(t => ({ ...t, schedule: true })); }} style={{ flex: 1, padding: '12px', border: form.postingFrequency === freq.id ? '2px solid #7c3aed' : '1px solid #d1d5db', borderRadius: '8px', background: form.postingFrequency === freq.id ? '#f5f3ff' : 'white', cursor: 'pointer', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{freq.label}</p>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>{freq.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Best Time to Post</label>
                    <select value={form.postingTime} onChange={(e) => setForm(f => ({ ...f, postingTime: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                      <option value="09:00">9:00 AM (Recommended)</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="20:00">8:00 PM</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Duration</label>
                    <select value={form.postingDuration} onChange={(e) => setForm(f => ({ ...f, postingDuration: e.target.value }))} style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
                      <option value="7">1 week</option>
                      <option value="14">2 weeks</option>
                      <option value="30">1 month</option>
                      <option value="0">Until I stop</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </AccordionSection>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div style={{ width: '360px', background: '#f9fafb', borderLeft: '1px solid #e5e7eb', padding: '28px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>Preview</h2>
        
        <div style={{ aspectRatio: '9/16', background: '#1f2937', borderRadius: '16px', overflow: 'hidden', position: 'relative', marginBottom: '20px' }}>
          {previewAvatar?.image_url ? (
            <img src={previewAvatar.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)' }} />
          )}
          
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '60px 16px 20px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}>
            <p style={{ fontSize: '14px', color: 'white', fontWeight: '500', lineHeight: 1.4 }}>
              {form.productName ? `"You won't believe what ${form.productName} does in just 7 days..."` : '"Your hook text will appear here..."'}
            </p>
          </div>

          {form.productName && (
            <div style={{ position: 'absolute', top: '16px', left: '16px', padding: '6px 12px', background: 'rgba(0,0,0,0.6)', borderRadius: '20px' }}>
              <p style={{ fontSize: '12px', color: 'white', fontWeight: '500' }}>{form.productName}</p>
            </div>
          )}

          {/* Label changes based on selection */}
          <div style={{ position: 'absolute', top: '16px', right: '16px', padding: '4px 8px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px' }}>
            <p style={{ fontSize: '10px', color: '#9ca3af' }}>{selectedAvatar ? selectedAvatar.name : 'Sample preview'}</p>
          </div>
        </div>

        {/* Cost Summary with dollar equivalent */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '12px' }}>COST SUMMARY</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>Videos to generate</span>
              <span style={{ color: '#111827', fontWeight: '500' }}>{selectedStrategy?.videos || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #f3f4f6' }}>
              <span style={{ color: '#111827', fontWeight: '500' }}>Credits required</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#7c3aed', fontWeight: '600' }}>{selectedStrategy?.credits || 0} credits</span>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>≈ ${selectedStrategy?.dollars || 0}</p>
              </div>
            </div>
          </div>
          {(profile?.credits || 0) < (selectedStrategy?.credits || 0) && (
            <div style={{ marginTop: '12px', padding: '10px', background: '#fef2f2', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span style={{ fontSize: '13px', color: '#dc2626' }}>Not enough credits</span>
              <a href="/dashboard/settings/billing" style={{ marginLeft: 'auto', fontSize: '13px', color: '#7c3aed', fontWeight: '500', textDecoration: 'none' }}>Get more</a>
            </div>
          )}
        </div>

        <button onClick={handleGenerate} disabled={!canGenerate || (profile?.credits || 0) < (selectedStrategy?.credits || 0)} style={{ width: '100%', padding: '14px', background: canGenerate ? '#7c3aed' : '#e5e7eb', color: canGenerate ? 'white' : '#9ca3af', fontSize: '15px', fontWeight: '600', border: 'none', borderRadius: '10px', cursor: canGenerate ? 'pointer' : 'not-allowed', marginTop: 'auto' }}>
          Generate Strategy
        </button>
        {!canGenerate && (
          <p style={{ fontSize: '13px', color: '#6b7280', textAlign: 'center', marginTop: '10px' }}>Complete Product and Avatar sections to generate</p>
        )}
      </div>
    </div>
  );
}

function AccordionSection({ number, title, subtitle, complete, touched, optional, hasDefault, expanded, onToggle, children }) {
  const showPurpleCheck = complete && touched;
  const showGreyCheck = complete && hasDefault && !touched;

  return (
    <div style={{ marginBottom: '16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: showPurpleCheck ? '#7c3aed' : showGreyCheck ? '#f3f4f6' : '#e5e7eb', color: showPurpleCheck ? 'white' : '#6b7280', fontSize: '13px', fontWeight: '600', border: showGreyCheck ? '2px solid #d1d5db' : 'none' }}>
          {(showPurpleCheck || showGreyCheck) ? '✓' : number}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '15px', fontWeight: '500', color: '#111827' }}>{title}{optional && <span style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '400', marginLeft: '8px' }}>Optional</span>}</p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>{subtitle}</p>
        </div>
        <svg style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', color: '#9ca3af' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {expanded && <div style={{ padding: '0 20px 20px' }}>{children}</div>}
    </div>
  );
}

function AvatarOption({ avatar, selected, onClick }) {
  const NICHE_TAGS = { 'Sophie': 'Beauty', 'Marcus': 'Business', 'Emma': 'Fashion', 'James': 'Fitness', 'Olivia': 'Home', 'Lucas': 'Tech', 'Ava': 'Skincare', 'Noah': 'E-commerce' };
  return (
    <button onClick={onClick} style={{ padding: 0, background: 'none', border: selected ? '3px solid #7c3aed' : '2px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}>
      <div style={{ aspectRatio: '1', background: '#f3f4f6' }}>{avatar.image_url && <img src={avatar.image_url} alt={avatar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
      <div style={{ padding: '8px', background: 'white', textAlign: 'left' }}>
        <p style={{ fontSize: '12px', fontWeight: '500', color: '#111827' }}>{avatar.name}</p>
        <p style={{ fontSize: '10px', color: '#6b7280' }}>{NICHE_TAGS[avatar.name] || 'General'}</p>
      </div>
      {selected && <div style={{ position: 'absolute', top: '6px', right: '6px', width: '20px', height: '20px', background: '#7c3aed', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'white', fontSize: '12px' }}>✓</span></div>}
    </button>
  );
}
