"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: '👋' },
  { id: 'product', title: 'Your Product', icon: '📦' },
  { id: 'platforms', title: 'Platforms', icon: '🚀' },
  { id: 'voice', title: 'Your Voice', icon: '🎤' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    fullName: '', productName: '', productDescription: '',
    targetAudience: '', productUrl: '',
    platforms: { twitter: true, linkedin: false },
    voicePosts: '',
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profile) {
        setForm(prev => ({
          ...prev, fullName: profile.full_name || user.user_metadata?.full_name || '',
          productName: profile.product_name || '', productDescription: profile.product_description || '',
          productUrl: profile.product_url || '', targetAudience: profile.target_audience || '',
        }));
      }
    };
    getUser();
  }, []);

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Analyze voice if provided
      let styleProfile = null;
      if (form.voicePosts.trim()) {
        const posts = form.voicePosts.split('\n---\n').map(p => p.trim()).filter(Boolean);
        if (posts.length >= 3) {
          try {
            const res = await fetch('/api/voice/analyze', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, posts }),
            });
            const data = await res.json();
            if (data.success) styleProfile = data.profile;
          } catch {}
        }
      }

      await supabase.from('profiles').upsert({
        id: user.id, full_name: form.fullName, product_name: form.productName,
        product_description: form.productDescription, product_url: form.productUrl,
        target_audience: form.targetAudience,
        platforms: form.platforms, onboarding_completed: true,
        ...(styleProfile ? { style_profile: styleProfile } : {}),
        updated_at: new Date().toISOString(),
      });

      // Auto-generate first batch
      try {
        await fetch('/api/content/generate-batch', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id, count: 5,
            platforms: Object.keys(form.platforms).filter(p => form.platforms[p]),
          }),
        });
      } catch {}

      router.push('/dashboard');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save. Please try again.');
    }
    setLoading(false);
  };

  const canProceed = () => {
    if (step === 0) return form.fullName.trim();
    if (step === 1) return form.productName.trim() && form.productDescription.trim();
    return true;
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">Distributo</span>
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s.id} className={`w-2 h-2 rounded-full transition-colors ${i <= step ? 'bg-gray-900' : 'bg-gray-200'}`} />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {step === 0 && (
            <div>
              <div className="text-4xl mb-4">👋</div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Welcome to Distributo</h1>
              <p className="text-gray-500 mb-8">Push code. We handle the rest. Let's set you up in 2 minutes.</p>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Your name</span>
                <input type="text" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                  placeholder="Denis" className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
              </label>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="text-4xl mb-4">📦</div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Tell us about your product</h1>
              <p className="text-gray-500 mb-8">This helps the AI generate relevant, specific content.</p>
              <div className="space-y-5">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Product name</span>
                  <input type="text" value={form.productName} onChange={e => setForm(p => ({ ...p, productName: e.target.value }))}
                    placeholder="Distributo" className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">What does it do?</span>
                  <textarea value={form.productDescription} onChange={e => setForm(p => ({ ...p, productDescription: e.target.value }))} rows={3}
                    placeholder="Turns GitHub commits into viral tweets and LinkedIn posts on autopilot"
                    className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Product URL</span>
                  <input type="url" value={form.productUrl} onChange={e => setForm(p => ({ ...p, productUrl: e.target.value }))}
                    placeholder="https://distributo.dev" className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                  <p className="text-xs text-gray-400 mt-1.5">We'll include this in your posts to drive traffic</p>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Target audience</span>
                  <input type="text" value={form.targetAudience} onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))}
                    placeholder="Developers and indie hackers" className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="text-4xl mb-4">🚀</div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Where do you want to post?</h1>
              <p className="text-gray-500 mb-8">You can always change this later in settings.</p>
              <div className="space-y-3">
                {[
                  { key: 'twitter', label: 'X (Twitter)', desc: 'Tweets with plug replies — your main growth channel' },
                  { key: 'linkedin', label: 'LinkedIn', desc: 'Professional cross-posts for credibility' },
                ].map(p => (
                  <button key={p.key} onClick={() => setForm(f => ({ ...f, platforms: { ...f.platforms, [p.key]: !f.platforms[p.key] } }))}
                    className={`w-full p-5 rounded-xl border-2 text-left transition-all ${form.platforms[p.key] ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{p.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.platforms[p.key] ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}`}>
                        {form.platforms[p.key] && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><polyline points="20 6 9 17 4 12" /></svg>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="text-4xl mb-4">🎤</div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">Teach us your voice</h1>
              <p className="text-gray-500 mb-2">Paste your best tweets so the AI sounds like you — not generic AI.</p>
              <p className="text-xs text-gray-400 mb-6">Separate each post with --- on its own line. Optional but recommended.</p>
              <textarea value={form.voicePosts} onChange={e => setForm(p => ({ ...p, voicePosts: e.target.value }))} rows={8}
                placeholder={`The auth bug that took 4 hours was a missing await. I'm going to bed.\n---\nSomeone asked how I market my SaaS. I showed them my git log.\n---\n94 users. 3 paying. 1 churned because I didn't have dark mode.\n---\nEvery time I say 'this will take 30 minutes' multiply by 6.\n---\nShipped the LinkedIn integration. Immediately broke X. Classic.`}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">Back</button>
            ) : <div />}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40">
                Continue
              </button>
            ) : (
              <button onClick={handleComplete} disabled={loading || !canProceed()}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40">
                {loading ? 'Setting up...' : 'Launch Distributo →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
