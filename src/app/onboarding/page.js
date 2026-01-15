"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: '👋' },
  { id: 'account', title: 'Account Type', icon: '🎯' },
  { id: 'product', title: 'Your Product', icon: '📦' },
  { id: 'platforms', title: 'Platforms', icon: '🚀' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    accountType: 'personal',
    productName: '',
    productDescription: '',
    targetAudience: '',
    platforms: { twitter: true, linkedin: false, reddit: false },
    postingStyle: 'build_in_public',
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setFormData(prev => ({
          ...prev,
          fullName: profile.full_name || user.user_metadata?.full_name || '',
          productName: profile.product_name || '',
          productDescription: profile.product_description || '',
          accountType: profile.account_type || 'personal',
          platforms: profile.platforms || prev.platforms,
        }));
      }
    };
    getUser();
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Save profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.fullName,
          account_type: formData.accountType,
          product_name: formData.productName,
          product_description: formData.productDescription,
          target_audience: formData.targetAudience,
          platforms: formData.platforms,
          posting_style: formData.postingStyle,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Auto-generate first batch of posts
      try {
        await fetch('/api/content/generate-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            count: 5,
            platforms: Object.keys(formData.platforms).filter(p => formData.platforms[p]),
            includeCommunities: true,
          }),
        });
      } catch (genError) {
        console.error('Auto-generate error:', genError);
        // Don't block onboarding if generation fails
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save. Please try again.');
    }
    setLoading(false);
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome': return <WelcomeStep formData={formData} setFormData={setFormData} />;
      case 'account': return <AccountTypeStep formData={formData} setFormData={setFormData} />;
      case 'product': return <ProductStep formData={formData} setFormData={setFormData} />;
      case 'platforms': return <PlatformsStep formData={formData} setFormData={setFormData} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-gray-900">Distributo</span>
          </div>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                  index < currentStep ? 'bg-green-100 text-green-600' :
                  index === currentStep ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500 ring-offset-2' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {index < currentStep ? '✓' : step.icon}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-20 h-1 mx-2 rounded-full transition-all ${index < currentStep ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">{renderStep()}</div>
      </main>

      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={handleBack} disabled={currentStep === 0} className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-0">
            ← Back
          </button>
          {currentStep === STEPS.length - 1 ? (
            <button onClick={handleComplete} disabled={loading || !formData.productName} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50">
              {loading ? 'Saving...' : 'Complete Setup →'}
            </button>
          ) : (
            <button onClick={handleNext} className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all">
              Continue →
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function WelcomeStep({ formData, setFormData }) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
        <span className="text-4xl">🚀</span>
      </div>
      <h1 className="text-3xl font-semibold text-gray-900 mb-3">Welcome to Distributo!</h1>
      <p className="text-gray-600 mb-8">Let's set up your marketing automation in just a few steps.</p>
      <div className="text-left max-w-sm mx-auto">
        <label className="block text-sm font-medium text-gray-700 mb-2">What's your name?</label>
        <input type="text" value={formData.fullName} onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))} placeholder="John Doe" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg" />
      </div>
    </div>
  );
}

function AccountTypeStep({ formData, setFormData }) {
  const types = [
    { id: 'personal', title: 'Personal Account', description: 'Your personal X/Twitter account where you build in public', icon: '👤', example: 'e.g., @johndoe sharing your founder journey' },
    { id: 'product', title: 'Product Account', description: 'A dedicated account for your product/company', icon: '📦', example: 'e.g., @myproduct for official updates' },
    { id: 'agency', title: 'Agency / Multiple Clients', description: 'You manage marketing for multiple products/clients', icon: '🏢', example: 'e.g., Marketing agency managing client accounts' },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">What type of account?</h1>
        <p className="text-gray-600">This helps us generate the right tone and content for you.</p>
      </div>
      <div className="space-y-4">
        {types.map((type) => (
          <button key={type.id} onClick={() => setFormData(prev => ({ ...prev, accountType: type.id }))} className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${formData.accountType === type.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">{type.icon}</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">{type.title}</div>
                <div className="text-sm text-gray-600 mb-2">{type.description}</div>
                <div className="text-xs text-gray-400">{type.example}</div>
              </div>
              {formData.accountType === type.id && (
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductStep({ formData, setFormData }) {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Tell us about your product</h1>
        <p className="text-gray-600">We'll use this to generate relevant marketing content.</p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product / Company Name *</label>
          <input type="text" value={formData.productName} onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))} placeholder="e.g., Distributo, Acme Inc" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">What does it do? *</label>
          <textarea value={formData.productDescription} onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))} placeholder="e.g., Marketing automation platform that helps founders automate their social media content" rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
          <p className="text-xs text-gray-500 mt-2">Be specific - this directly affects content quality</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Who is it for? (Optional)</label>
          <input type="text" value={formData.targetAudience} onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))} placeholder="e.g., SaaS founders, indie hackers, small businesses" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
      </div>
    </div>
  );
}

function PlatformsStep({ formData, setFormData }) {
  const platforms = [
    { id: 'twitter', name: 'X (Twitter)', icon: XIcon, color: 'bg-black', available: true },
    { id: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon, color: 'bg-blue-600', available: true },
    { id: 'reddit', name: 'Reddit', icon: RedditIcon, color: 'bg-orange-500', available: false },
  ];
  const styles = [
    { id: 'build_in_public', name: 'Build in Public', desc: 'Share your journey, wins, and learnings' },
    { id: 'educational', name: 'Educational', desc: 'Tips, tutorials, and valuable insights' },
    { id: 'promotional', name: 'Promotional', desc: 'Product updates and announcements' },
    { id: 'mixed', name: 'Mixed', desc: 'A combination of all styles' },
  ];
  const toggle = (id) => setFormData(prev => ({ ...prev, platforms: { ...prev.platforms, [id]: !prev.platforms[id] } }));

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Almost there!</h1>
        <p className="text-gray-600">Choose where you want to post and your content style.</p>
      </div>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Platforms</label>
          <div className="grid grid-cols-3 gap-3">
            {platforms.map((p) => {
              const Icon = p.icon;
              return (
                <button key={p.id} onClick={() => p.available && toggle(p.id)} disabled={!p.available} className={`p-4 rounded-xl border-2 transition-all ${!p.available ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50' : formData.platforms[p.id] ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <div className={`w-10 h-10 rounded-lg ${p.color} flex items-center justify-center mx-auto mb-2`}><Icon className="w-5 h-5 text-white" /></div>
                  <div className="font-medium text-gray-900 text-sm">{p.name}</div>
                  {!p.available && <div className="text-xs text-gray-400 mt-1">Coming soon</div>}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Content Style</label>
          <div className="grid grid-cols-2 gap-3">
            {styles.map((s) => (
              <button key={s.id} onClick={() => setFormData(prev => ({ ...prev, postingStyle: s.id }))} className={`p-4 rounded-xl border-2 text-left transition-all ${formData.postingStyle === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <div className="font-medium text-gray-900 text-sm mb-1">{s.name}</div>
                <div className="text-xs text-gray-500">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function XIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }
function LinkedInIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>; }
function RedditIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>; }