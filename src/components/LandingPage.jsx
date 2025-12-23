"use client";

import { useState, useEffect } from "react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activePipeline, setActivePipeline] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [waitlistCount, setWaitlistCount] = useState(0);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError("");
    setIsLoading(true);
    
    try {
      // Option 1: Send to your API endpoint
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'landing_page', timestamp: new Date().toISOString() })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to join waitlist');
      }
      
      setIsSubmitted(true);
      setWaitlistCount(prev => prev + 1);
    } catch (err) {
      // Fallback: Store in localStorage for demo/development
      const waitlist = JSON.parse(localStorage.getItem('distributo_waitlist') || '[]');
      if (waitlist.some(entry => entry.email === email)) {
        setError("You're already on the waitlist!");
        setIsLoading(false);
        return;
      }
      waitlist.push({ email, timestamp: new Date().toISOString(), source: 'landing_page' });
      localStorage.setItem('distributo_waitlist', JSON.stringify(waitlist));
      setIsSubmitted(true);
      setWaitlistCount(prev => prev + 1);
      console.log('Waitlist stored locally:', waitlist);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] text-[#1a1a2e] overflow-x-hidden font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-serif { font-family: 'Instrument Serif', Georgia, serif; }
        .font-sans { font-family: 'DM Sans', system-ui, sans-serif; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes slide-in { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float 6s ease-in-out infinite 2s; }
        .animate-slide-in { animation: slide-in 0.5s ease-out forwards; }
        .gradient-text { background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .glass-card { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.9); }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/80 backdrop-blur-lg shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xl font-semibold">Distributo</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <a href="#waitlist" className="px-5 py-2.5 bg-[#1a1a2e] text-white text-sm font-medium rounded-full hover:bg-[#2d2d44] transition-colors">Join Waitlist</a>
        </div>
      </nav>

      {/* Hero Section - FIXED z-index */}
      <section className="relative pt-32 pb-20 px-6 h-[100vh]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-4xl mx-auto relative z-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-8">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-blue-700">Now accepting early access signups</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-serif leading-[1.1] mb-6">
              Automate Your Marketing.<br />
              <span className="italic text-gray-400">Scale</span>{" "}
              <span className="gradient-text">Without the Agency.</span>
            </h1>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              AI-powered marketing automation for Reddit, X, and LinkedIn. Grow your audience on autopilot while you focus on building.
            </p>

            {/* Waitlist Form - HIGH z-index */}
            <div className="relative z-30" id="waitlist">
              {!isSubmitted ? (
                <div>
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="flex-1 px-5 py-3.5 rounded-full border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                      required
                    />
                    <button type="submit" disabled={isLoading} className="px-8 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-70 cursor-pointer whitespace-nowrap">
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                          Joining...
                        </span>
                      ) : "Join Waitlist →"}
                    </button>
                  </form>
                  {error && (
                    <p className="text-sm text-red-500 mt-3">{error}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-green-50 border border-green-100 max-w-md mx-auto">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-green-700 font-medium">You're on the list! We'll be in touch soon.</span>
                </div>
              )}
            </div>
          </div>

          {/* Hero Visual - LOWER z-index */}
          <div className="mt-24 relative z-10">
            <div className="relative max-w-3xl mx-auto flex items-center justify-center">
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/30">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="absolute w-[400px] h-[200px]">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 animate-float">
                  <div className="w-14 h-14 rounded-xl bg-white shadow-lg border border-gray-100 flex items-center justify-center"><GitHubIcon className="w-7 h-7 text-gray-900" /></div>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 animate-float-delayed">
                  <div className="w-14 h-14 rounded-xl bg-white shadow-lg border border-gray-100 flex items-center justify-center"><XIcon className="w-7 h-7 text-gray-900" /></div>
                </div>
                <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 -translate-y-8 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="w-14 h-14 rounded-xl bg-white shadow-lg border border-orange-100 flex items-center justify-center"><RedditIcon className="w-7 h-7 text-orange-500" /></div>
                </div>
              </div>
              <div className="absolute -left-4 top-16 glass-card rounded-xl p-3 shadow-lg animate-float pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center"><GitHubIcon className="w-4 h-4 text-blue-600" /></div>
                  <div><div className="text-xs font-medium">New Commit</div><div className="text-[10px] text-gray-500">Draft generated</div></div>
                </div>
              </div>
              <div className="absolute -right-4 top-16 glass-card rounded-xl p-3 shadow-lg animate-float-delayed pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div><div className="text-xs font-medium">Post Published</div><div className="text-[10px] text-gray-500">r/SaaS • just now</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-gray-100 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8 font-medium uppercase tracking-wider">Built for founders who ship to</p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-60">
            <div className="flex items-center gap-2"><RedditIcon className="w-8 h-8 text-orange-500" /><span className="text-lg font-semibold text-gray-700">Reddit</span></div>
            <div className="flex items-center gap-2"><XIcon className="w-7 h-7 text-gray-900" /><span className="text-lg font-semibold text-gray-700">X / Twitter</span></div>
            <div className="flex items-center gap-2"><LinkedInIcon className="w-7 h-7 text-blue-600" /><span className="text-lg font-semibold text-gray-700">LinkedIn</span></div>
            <div className="flex items-center gap-2"><GitHubIcon className="w-7 h-7 text-gray-900" /><span className="text-lg font-semibold text-gray-700">GitHub</span></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Everything You Need to<br /><span className="italic text-gray-400">Automate</span> Your Marketing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Four powerful pipelines working together to keep your audience engaged while you focus on building.</p>
          </div>

          <FeatureSection
            title="Reddit Pipeline"
            subtitle="Post without getting banned"
            description="We find the best subreddits for your product, provide templates that follow community rules, and our AI Slop Detector ensures your posts sound human—not like ChatGPT."
            icon={<RedditIcon className="w-5 h-5" />}
            color="orange"
            features={["Auto-discover relevant subreddits", "Community rule compliance", "AI Slop Detector (anti-AI detection)", "Optimal posting times"]}
            visual={<RedditPipelineVisual />}
            reversed={false}
          />

          <FeatureSection
            title="X Pipeline + Reply Finder"
            subtitle="Grow through strategic engagement"
            description="Schedule your build-in-public content and discover high-value posts to reply to. Track accounts in your niche and get AI-suggested replies that sound like you."
            icon={<XIcon className="w-5 h-5" />}
            color="gray"
            features={["Auto-posting when you're burnt-out", "AI-powered reply suggestions", "Track influential accounts", "Engagement analytics"]}
            visual={<XPipelineVisual />}
            reversed={true}
          />

          <FeatureSection
            title="LinkedIn Pipeline"
            subtitle="Professional content on autopilot"
            description="Auto cross-post from X with intelligent tone adaptation. Your casual tweets become polished LinkedIn posts that resonate with a professional audience."
            icon={<LinkedInIcon className="w-5 h-5" />}
            color="blue"
            features={["Auto cross-post from X", "Tone adaptation AI", "Professional templates", "Optimal scheduling"]}
            visual={<LinkedInPipelineVisual />}
            reversed={false}
          />

          <FeatureSection
            title="GitHub Autopilot"
            subtitle="Never go dark again"
            description="Connect your repo and watch the magic happen. Every meaningful commit automatically generates a build-in-public post. Ship code, we'll ship the content."
            icon={<GitHubIcon className="w-5 h-5" />}
            color="purple"
            features={["Webhook integration", "Smart commit filtering", "Multi-platform generation", "Review before posting"]}
            visual={<GitHubPipelineVisual />}
            reversed={true}
          />
        </div>
      </section>

      {/* How It Works - Interactive Pipeline Section */}
      <section id="how-it-works" className="py-32 px-6 bg-[#0f0f1a] text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">How <span className="italic text-blue-400">Distributo</span> Works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Don't feel like posting today? We've got you covered. Here's how each pipeline keeps your marketing running on autopilot.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {[
              { name: "GitHub Autopilot", icon: <GitHubIcon className="w-5 h-5" /> },
              { name: "Reddit Pipeline", icon: <RedditIcon className="w-5 h-5" /> },
              { name: "X Pipeline", icon: <XIcon className="w-5 h-5" /> },
              { name: "LinkedIn Pipeline", icon: <LinkedInIcon className="w-5 h-5" /> },
            ].map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActivePipeline(idx)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 ${activePipeline === idx ? 'bg-white text-gray-900 shadow-lg shadow-white/20' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          <div className="relative min-h-[500px]">
            {activePipeline === 0 && <GitHubAutopilotFlow />}
            {activePipeline === 1 && <RedditPipelineFlow />}
            {activePipeline === 2 && <XPipelineFlow />}
            {activePipeline === 3 && <LinkedInPipelineFlow />}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Simple, Transparent <span className="italic text-gray-400">Pricing</span></h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Start with a 3-day free trial. No credit card required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard name="Pro" price={19} description="For founders getting started" features={["3 X posts/day", "10 Reddit posts/week", "5 LinkedIn posts/week", "10 reply suggestions/day", "5 tracked accounts", "1 project", "GitHub Autopilot", "30 days analytics"]} highlighted={false} />
            <PricingCard name="Growth" price={39} description="For serious builders" features={["5 X posts/day", "20 Reddit posts/week", "10 LinkedIn posts/week", "20 reply suggestions/day", "15 tracked accounts", "3 projects", "GitHub Autopilot", "90 days analytics"]} highlighted={true} />
            <PricingCard name="Scale" price={79} description="For agencies & power users" features={["10 X posts/day", "Unlimited Reddit posts", "20 LinkedIn posts/week", "Unlimited replies", "30 tracked accounts", "10 projects", "GitHub Autopilot", "1 year analytics"]} highlighted={false} />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="waitlist" className="py-32 px-6 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-6">Ready to <span className="italic">Ship Code</span><br />and Let Us <span className="gradient-text">Ship Content?</span></h2>
          <p className="text-xl text-gray-600 mb-10">Join the waitlist and be the first to know when we launch. Early supporters get 50% off for life.</p>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="flex-1 px-5 py-4 rounded-full border border-gray-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" required />
              <button type="submit" disabled={isLoading} className="px-8 py-4 bg-[#1a1a2e] text-white font-medium rounded-full hover:bg-[#2d2d44] transition-all disabled:opacity-70 shadow-lg hover:shadow-xl cursor-pointer">{isLoading ? "Joining..." : "Join Waitlist"}</button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-green-100 border border-green-200 max-w-md mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-green-700 font-medium">You're on the list! Check your email.</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-8 mt-12 text-sm text-gray-500">
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>3-day free trial</div>
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>No credit card required</div>
            <div className="flex items-center gap-2"><svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Cancel anytime</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-semibold">Distributo</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
            <a href="mailto:hello@distributo.dev" className="hover:text-gray-900 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors"><XIcon className="w-5 h-5" /></a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors"><LinkedInIcon className="w-5 h-5" /></a>
            <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors"><GitHubIcon className="w-5 h-5" /></a>
          </div>
        </div>
        <div className="text-center mt-8 text-sm text-gray-400">© 2025 Distributo. All rights reserved.</div>
      </footer>
    </div>
  );
}

// ============================================
// PIPELINE FLOW VISUALIZATIONS
// ============================================

function GitHubAutopilotFlow() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setStep((prev) => (prev + 1) % 5), 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="animate-slide-in">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div className="space-y-6">
            <FlowStep active={step === 0} icon={<GitHubIcon className="w-8 h-8 text-white" />} bgColor={step === 0 ? 'bg-purple-500' : 'bg-white/10'} title="You push code" subtitle="git push origin main" />
            <div className="ml-8 w-0.5 h-8 bg-gradient-to-b from-purple-500/50 to-blue-500/50" />
            <FlowStep active={step === 1} icon={<svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} bgColor={step === 1 ? 'bg-blue-500' : 'bg-white/10'} title="Webhook triggers" subtitle='Commit: "feat: Add Stripe integration"' />
            <div className="ml-8 w-0.5 h-8 bg-gradient-to-b from-blue-500/50 to-indigo-500/50" />
            <FlowStep active={step === 2} icon={<svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>} bgColor={step === 2 ? 'bg-indigo-500' : 'bg-white/10'} title="AI generates content" subtitle="Creates posts for X, LinkedIn, Reddit" />
            <div className="ml-8 w-0.5 h-8 bg-gradient-to-b from-indigo-500/50 to-transparent" />
            <div className={`flex items-center gap-3 transition-all duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${step === 3 ? 'bg-gray-700 scale-110' : 'bg-white/10'}`}><XIcon className="w-6 h-6 text-white" /></div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${step === 3 ? 'bg-blue-600 scale-110' : 'bg-white/10'}`}><LinkedInIcon className="w-6 h-6 text-white" /></div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${step === 3 ? 'bg-orange-500 scale-110' : 'bg-white/10'}`}><RedditIcon className="w-6 h-6 text-white" /></div>
              <div className="ml-2"><div className="text-lg font-semibold">Posts scheduled</div><div className="text-gray-400 text-sm">Optimized for each platform</div></div>
            </div>
            <div className={`flex items-center gap-4 mt-6 p-4 rounded-xl border border-dashed transition-all ${step >= 4 ? 'border-green-500/50 opacity-100' : 'border-gray-600 opacity-30'}`}>
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div><div className="text-lg font-semibold">Review & approve (optional)</div><div className="text-gray-400 text-sm">Or enable auto-post for hands-free</div></div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-400 mb-4">Generated from your commit:</div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2"><GitHubIcon className="w-4 h-4" /><span>main</span><span className="text-gray-600">•</span><span>2 minutes ago</span></div>
            <code className="text-green-400">feat: Add Stripe integration for payments</code>
          </div>
          <div className={`p-4 rounded-xl bg-gray-800/50 border border-gray-700 transition-all duration-500 ${step >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            <div className="flex items-center gap-2 mb-3"><XIcon className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-400">X / Twitter</span></div>
            <p className="text-white">Just shipped Stripe integration 💳<br /><br />Now users can upgrade in 2 clicks.<br /><br />Took 3 hours. Should've done it months ago.<br /><br />#buildinpublic</p>
          </div>
          <div className={`p-4 rounded-xl bg-blue-900/30 border border-blue-800/50 transition-all duration-500 delay-200 ${step >= 2 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            <div className="flex items-center gap-2 mb-3"><LinkedInIcon className="w-4 h-4 text-blue-400" /><span className="text-sm text-blue-400">LinkedIn</span></div>
            <p className="text-white text-sm"><strong>Milestone: Payment integration complete.</strong><br /><br />After evaluating several providers, we integrated Stripe for seamless payment processing. The result? A 2-click upgrade flow.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowStep({ active, icon, bgColor, title, subtitle }) {
  return (
    <div className={`flex items-center gap-4 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-50'}`}>
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${bgColor} ${active ? 'scale-110' : ''}`}>{icon}</div>
      <div className="flex-1"><div className="text-lg font-semibold">{title}</div><div className="text-gray-400 text-sm">{subtitle}</div></div>
      {active && <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />}
    </div>
  );
}

function RedditPipelineFlow() {
  const [activeSubreddit, setActiveSubreddit] = useState(0);
  const subreddits = [
    { name: "r/SaaS", members: "45k", rules: ["No direct self-promo", "Value-first posts", "Flair required"] },
    { name: "r/indiehackers", members: "120k", rules: ["Share learnings", "No spam", "Be genuine"] },
    { name: "r/startups", members: "890k", rules: ["Saturday self-promo only", "No affiliate links"] },
  ];

  return (
    <div className="animate-slide-in">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <InfoCard icon={<RedditIcon className="w-5 h-5 text-white" />} iconBg="bg-orange-500" title="Don't know where to post?" subtitle="We find subreddits for you" description="Based on your product category, we automatically discover the best subreddits where your target audience hangs out." gradient="from-orange-500/20 to-red-500/10" border="border-orange-500/30" />
          <InfoCard icon={<svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} iconBg="bg-red-500/20" title="Worried about sounding like AI?" subtitle="Our Slop Detector fixes that" description="Reddit users can smell AI content. Our AI Slop Detector scores your posts and rewrites robotic parts to sound human." />
          <InfoCard icon={<svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} iconBg="bg-green-500/20" title="Best time to post?" subtitle="We calculate it per subreddit" description="Each subreddit has different peak hours. We analyze engagement patterns and schedule for maximum visibility." />
        </div>

        <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-sm font-medium text-gray-400 mb-4">Your discovered subreddits:</div>
          <div className="flex gap-2 mb-6">
            {subreddits.map((sub, idx) => (
              <button key={idx} onClick={() => setActiveSubreddit(idx)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeSubreddit === idx ? 'bg-orange-500 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>{sub.name}</button>
            ))}
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center gap-3">
                <RedditIcon className="w-8 h-8 text-orange-400" />
                <div><div className="font-semibold text-white">{subreddits[activeSubreddit].name}</div><div className="text-sm text-gray-400">{subreddits[activeSubreddit].members} members</div></div>
              </div>
              <div className="text-right"><div className="text-sm text-gray-400">Best time</div><div className="text-green-400 font-medium">Tue 9AM</div></div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400 mb-2">Community rules we'll follow:</div>
              <div className="space-y-2">
                {subreddits[activeSubreddit].rules.map((rule, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-gray-300">{rule}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3"><span className="text-sm font-medium text-gray-400">AI Slop Detector</span><span className="text-sm text-green-400 font-medium">18% — Looks Human ✓</span></div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden"><div className="h-full w-[18%] bg-gradient-to-r from-green-400 to-green-500 rounded-full" /></div>
              <p className="text-xs text-gray-500 mt-2">Low score = more human-sounding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function XPipelineFlow() {
  return (
    <div className="animate-slide-in">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center"><XIcon className="w-5 h-5 text-gray-900" /></div>
              <div><div className="font-semibold">Too busy to engage?</div><div className="text-sm text-gray-400">Let us do the work</div></div>
            </div>
            <p className="text-gray-300 text-sm mb-4">We track influential accounts in your niche and surface high-value reply opportunities with AI-generated replies.</p>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-xs text-gray-500">Tracking:</span>
              <div className="flex -space-x-2">
                {["L", "M", "D", "T", "Y"].map((l, i) => (<div key={i} className="w-8 h-8 rounded-full bg-gray-600 border-2 border-gray-800 flex items-center justify-center text-xs font-medium">{l}</div>))}
              </div>
              <span className="text-xs text-gray-500">+10 more</span>
            </div>
          </div>
          <InfoCard icon={<svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} iconBg="bg-blue-500/20" title="Burnt out and can't post?" subtitle="Take a rest - we'll do the posting for you" description="We analyze your past tweets to understand your voice, then generate contextual posts that sound like you - schedule them for you and then post them" />
          <InfoCard icon={<svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>} iconBg="bg-purple-500/20" title="Threads too?" subtitle="Schedule entire threads" description="Plan your build-in-public threads in advance. We'll post them at optimal times." />
        </div>

        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-400 mb-4">Today's reply opportunities:</div>
          {[
            { author: "@levelsio", content: "Just crossed $100k/mo with PhotoAI. Here's what I learned...", score: 94, hot: true },
            { author: "@marclouvion", content: "Hot take: Most indie hackers spend 80% building, 20% marketing...", score: 87 },
            { author: "@tdinh_me", content: "What's your best growth hack that actually worked?", score: 76 },
          ].map((post, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-medium">{post.author[1].toUpperCase()}</div><span className="font-medium text-sm">{post.author}</span></div>
                <div className="flex items-center gap-2">{post.hot && <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">🔥 HOT</span>}<span className="text-xs text-gray-500">Score: {post.score}</span></div>
              </div>
              <p className="text-sm text-gray-300 mb-3">{post.content}</p>
              <div className="flex items-center justify-between"><div className="text-xs text-gray-500">High engagement potential</div><button className="text-xs text-blue-400 font-medium hover:text-blue-300">Generate Reply →</button></div>
            </div>
          ))}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 mt-6">
            <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium">Today's goal</span><span className="text-sm text-blue-400">3/10 replies</span></div>
            <div className="h-2 bg-blue-900 rounded-full overflow-hidden"><div className="h-full w-[30%] bg-blue-400 rounded-full" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkedInPipelineFlow() {
  return (
    <div className="animate-slide-in">
      <div className="grid lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <InfoCard icon={<LinkedInIcon className="w-5 h-5 text-white" />} iconBg="bg-blue-600" title="Hate rewriting for LinkedIn?" subtitle="Auto cross-post from X" description="Your casual X posts automatically transform into professional LinkedIn content. Same message, different tone." gradient="from-blue-900/50 to-indigo-900/30" border="border-blue-700/50" />
          <InfoCard icon={<svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>} iconBg="bg-indigo-500/20" title="Tone adaptation" subtitle="Casual → Professional" description="Our AI expands short tweets, removes casual slang, and adds business-appropriate framing." />
          <InfoCard icon={<svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} iconBg="bg-green-500/20" title="Preview before posting" subtitle="See the transformation" description="Always review the adapted content before it goes live. Edit if needed." />
        </div>

        <div>
          <div className="text-sm font-medium text-gray-400 mb-4">See the transformation:</div>
          <div className="relative">
            <div className="p-5 rounded-xl bg-gray-800/80 border border-gray-700 mb-4">
              <div className="flex items-center gap-2 mb-3"><XIcon className="w-4 h-4 text-gray-400" /><span className="text-sm text-gray-400">Your X post</span></div>
              <p className="text-white">100 users 🎉<br /><br />35 days building, 2 signups.<br />2 weeks validating, 100 users.<br /><br />validation &gt; building fr</p>
            </div>
            <div className="flex justify-center my-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-700 to-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
              </div>
            </div>
            <div className="p-5 rounded-xl bg-blue-900/40 border border-blue-700/50">
              <div className="flex items-center gap-2 mb-3"><LinkedInIcon className="w-4 h-4 text-blue-400" /><span className="text-sm text-blue-400">LinkedIn version</span><span className="ml-auto text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-full">Auto-generated</span></div>
              <p className="text-white"><strong>Milestone: 100 users reached.</strong><br /><br />Here's an important lesson:<br /><br />📊 35 days of building → 2 signups<br />📊 2 weeks of validation → 100 users<br /><br />Validation isn't just a checkbox—it's the foundation of product-market fit.</p>
            </div>
          </div>
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between"><div><div className="font-medium text-sm">Auto cross-post enabled</div><div className="text-xs text-gray-500">Every X post → LinkedIn (with approval)</div></div>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, iconBg, title, subtitle, description, gradient, border }) {
  return (
    <div className={`p-6 rounded-2xl ${gradient ? `bg-gradient-to-br ${gradient}` : 'bg-white/5'} ${border || 'border border-white/10'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>{icon}</div>
        <div><div className="font-semibold">{title}</div><div className="text-sm text-gray-400">{subtitle}</div></div>
      </div>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
}

// ============================================
// FEATURE SECTION & VISUALS
// ============================================

function FeatureSection({ title, subtitle, description, icon, color, features, visual, reversed }) {
  const colorClasses = {
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  return (
    <div className={`flex flex-col ${reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-16 py-20`}>
      <div className="flex-1">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-6 border ${colorClasses[color]}`}>{icon}{subtitle}</div>
        <h3 className="text-3xl md:text-4xl font-serif mb-6">{title}</h3>
        <p className="text-lg text-gray-600 mb-8">{description}</p>
        <ul className="space-y-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 w-full">{visual}</div>
    </div>
  );
}

function RedditPipelineVisual() {
  return (
    <div className="relative bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 border border-orange-100">
      {/* Subreddit cards */}
      <div className="space-y-3">
        {[
          { name: 'r/SaaS', members: '45k', time: 'Tue 9AM', status: 'active' },
          { name: 'r/indiehackers', members: '120k', time: 'Mon 11AM', status: 'active' },
          { name: 'r/startups', members: '890k', time: 'Wed 2PM', status: 'pending' },
        ].map((sub, idx) => (
          <div 
            key={idx} 
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
            style={{ animationDelay: `${idx * 0.1}s` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <RedditIcon className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <div className="font-medium">{sub.name}</div>
                <div className="text-sm text-gray-500">{sub.members} members</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">{sub.time}</div>
              <div className={`text-xs ${sub.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`}>
                {sub.status === 'active' ? '✓ Active' : '⏳ Pending'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Slop Detector indicator */}
      <div className="mt-6 p-4 bg-white rounded-xl border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">AI Slop Detector</span>
          <span className="text-sm text-green-600 font-medium">18% - Looks Human ✓</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-[18%] bg-gradient-to-r from-green-400 to-green-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function XPipelineVisual() {
  return (
    <div className="relative bg-gradient-to-br from-gray-50 to-slate-50 rounded-3xl p-8 border border-gray-200">
      {/* Reply Finder Preview */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Reply Opportunities</div>
        
        {[
          { author: '@levelsio', content: 'Just crossed $100k/mo with PhotoAI...', score: 94, hot: true },
          { author: '@marclouvion', content: 'Hot take: Most indie hackers spend 80%...', score: 87, hot: false },
        ].map((post, idx) => (
          <div 
            key={idx}
            className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <span className="font-medium text-sm">{post.author}</span>
              </div>
              {post.hot && (
                <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">🔥 HOT</span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{post.content}</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Score: {post.score}</div>
              <button className="text-xs text-blue-600 font-medium hover:text-blue-700">Generate Reply →</button>
            </div>
          </div>
        ))}
      </div>

      {/* Tracked accounts */}
      <div className="mt-6 flex items-center gap-2">
        <span className="text-xs text-gray-500">Tracking:</span>
        <div className="flex -space-x-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white" />
          ))}
        </div>
        <span className="text-xs text-gray-500">+12 more</span>
      </div>
    </div>
  );
}

function LinkedInPipelineVisual() {
  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
      {/* Cross-post comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* X Original */}
        <div className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <XIcon className="w-4 h-4 text-gray-900" />
            <span className="text-xs font-medium text-gray-500">X Original</span>
          </div>
          <p className="text-sm text-gray-700">
            100 users 🎉
            <br /><br />
            35 days building, 2 signups.
            2 weeks validating, 100 users.
            <br /><br />
            validation &gt; building fr
          </p>
        </div>

        {/* LinkedIn Adapted */}
        <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <LinkedInIcon className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">LinkedIn Adapted</span>
          </div>
          <p className="text-sm text-gray-700">
            <strong>Milestone: 100 users reached.</strong>
            <br /><br />
            Here&apos;s what I learned: spending 35 days building got me 2 signups. Spending 2 weeks validating first? 100 users.
            <br /><br />
            The lesson: validation always comes first.
          </p>
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>

      {/* Auto cross-post toggle */}
      <div className="mt-6 flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
        <span className="text-sm font-medium">Auto cross-post enabled</span>
        <div className="w-12 h-6 bg-blue-500 rounded-full relative">
          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
        </div>
      </div>
    </div>
  );
}

function GitHubPipelineVisual() {
  return (
    <div className="relative bg-gradient-to-br from-purple-50 to-violet-50 rounded-3xl p-8 border border-purple-100">
      {/* Flow diagram */}
      <div className="flex items-center justify-between mb-8">
        {/* Step 1: Commit */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-2">
            <GitHubIcon className="w-7 h-7 text-gray-900" />
          </div>
          <span className="text-xs font-medium text-gray-600">Push</span>
        </div>

        {/* Arrow */}
        <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-200 to-purple-400 mx-2 relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-400 rotate-45" />
        </div>

        {/* Step 2: AI */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg flex items-center justify-center mb-2">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-600">AI Generate</span>
        </div>

        {/* Arrow */}
        <div className="flex-1 h-0.5 bg-gradient-to-r from-purple-400 to-purple-200 mx-2 relative">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-200 rotate-45" />
        </div>

        {/* Step 3: Posts */}
        <div className="flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-2">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-600">Post</span>
        </div>
      </div>

      {/* Generated draft preview */}
      <div className="p-4 bg-white rounded-xl border border-purple-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-500">New commit detected</span>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg mb-3">
          <code className="text-xs text-gray-600">feat: Add Stripe integration</code>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-sm text-gray-700">
            &quot;Just shipped Stripe integration 💳
            <br /><br />
            Now users can upgrade in 2 clicks. Took 3 hours. Should&apos;ve done it months ago.&quot;
          </p>
        </div>
        <div className="flex gap-2 mt-4">
          <button className="flex-1 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
            Approve & Schedule
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, description, features, highlighted }) {
  return (
    <div className={`relative rounded-3xl p-8 transition-all duration-300 ${highlighted ? 'bg-[#1a1a2e] text-white scale-105 shadow-2xl' : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg'}`}>
      {highlighted && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium rounded-full">Most Popular</div>}
      <div className="mb-6"><h3 className="text-xl font-semibold mb-2">{name}</h3><p className={highlighted ? 'text-gray-400' : 'text-gray-500'}>{description}</p></div>
      <div className="mb-8"><span className="text-5xl font-bold">${price}</span><span className={highlighted ? 'text-gray-400' : 'text-gray-500'}>/month</span></div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-3">
            <svg className={`w-5 h-5 flex-shrink-0 ${highlighted ? 'text-blue-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            <span className={highlighted ? 'text-gray-300' : 'text-gray-600'}>{feature}</span>
          </li>
        ))}
      </ul>
      <button className={`w-full py-3 rounded-full font-medium transition-all cursor-pointer ${highlighted ? 'bg-white text-[#1a1a2e] hover:bg-gray-100' : 'bg-[#1a1a2e] text-white hover:bg-[#2d2d44]'}`}>Start Free Trial</button>
    </div>
  );
}

// ============================================
// ICONS
// ============================================

function RedditIcon({ className = "w-6 h-6" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>;
}

function XIcon({ className = "w-6 h-6" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
}

function LinkedInIcon({ className = "w-6 h-6" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
}

function GitHubIcon({ className = "w-6 h-6" }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;
}