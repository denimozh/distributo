'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: '👋' },
  { id: 'platforms', title: 'Platforms', icon: '🔗' },
  { id: 'github', title: 'GitHub', icon: '🐙' },
  { id: 'preferences', title: 'Preferences', icon: '⚙️' },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    productName: '',
    productDescription: '',
    platforms: {
      reddit: false,
      twitter: false,
      linkedin: false,
    },
    githubConnected: false,
    postingFrequency: 'moderate',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setFormData(prev => ({
          ...prev,
          fullName: user.user_metadata?.full_name || '',
        }));
      }
    };
    getUser();
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Save profile to database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.fullName,
          product_name: formData.productName,
          product_description: formData.productDescription,
          platforms: formData.platforms,
          github_connected: formData.githubConnected,
          posting_frequency: formData.postingFrequency,
          timezone: formData.timezone,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const connectGitHub = async () => {
    // TODO: Implement GitHub OAuth for repo access
    // For now, just mark as connected
    setFormData(prev => ({ ...prev, githubConnected: true }));
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return <WelcomeStep formData={formData} setFormData={setFormData} />;
      case 'platforms':
        return <PlatformsStep formData={formData} setFormData={setFormData} />;
      case 'github':
        return <GitHubStep formData={formData} setFormData={setFormData} connectGitHub={connectGitHub} />;
      case 'preferences':
        return <PreferencesStep formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">Distributo</span>
          </div>
          <button 
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Skip for now
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                    index < currentStep 
                      ? 'bg-green-100 text-green-600' 
                      : index === currentStep 
                        ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500 ring-offset-2' 
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {index < currentStep ? '✓' : step.icon}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-16 sm:w-24 h-1 mx-2 rounded-full transition-all ${
                    index < currentStep ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            {STEPS.map((step, index) => (
              <span key={step.id} className={index === currentStep ? 'text-blue-600 font-medium' : ''}>
                {step.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {renderStep()}
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-0 disabled:cursor-default"
          >
            ← Back
          </button>
          
          {currentStep === STEPS.length - 1 ? (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Complete Setup →'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
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
      <p className="text-gray-600 mb-8">Let's get you set up in just a few minutes. First, tell us about yourself and your product.</p>
      
      <div className="space-y-4 text-left">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
          <input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
            placeholder="John Doe"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
          <input
            type="text"
            value={formData.productName}
            onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
            placeholder="My Awesome SaaS"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">What does it do? (one sentence)</label>
          <input
            type="text"
            value={formData.productDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
            placeholder="Helps founders automate their marketing"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

function PlatformsStep({ formData, setFormData }) {
  const platforms = [
    { 
      id: 'reddit', 
      name: 'Reddit', 
      icon: <RedditIcon className="w-8 h-8" />,
      description: 'Post to subreddits automatically',
      color: 'orange'
    },
    { 
      id: 'twitter', 
      name: 'X (Twitter)', 
      icon: <XIcon className="w-8 h-8" />,
      description: 'Build in public with auto-posting',
      color: 'gray'
    },
    { 
      id: 'linkedin', 
      name: 'LinkedIn', 
      icon: <LinkedInIcon className="w-8 h-8" />,
      description: 'Professional content cross-posting',
      color: 'blue'
    },
  ];

  const togglePlatform = (platformId) => {
    setFormData(prev => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [platformId]: !prev.platforms[platformId]
      }
    }));
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Choose Your Platforms</h1>
        <p className="text-gray-600">Select the platforms you want to post to. You can always add more later.</p>
      </div>

      <div className="space-y-3">
        {platforms.map((platform) => (
          <button
            key={platform.id}
            onClick={() => togglePlatform(platform.id)}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
              formData.platforms[platform.id]
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              platform.color === 'orange' ? 'bg-orange-100 text-orange-500' :
              platform.color === 'blue' ? 'bg-blue-100 text-blue-600' :
              'bg-gray-100 text-gray-700'
            }`}>
              {platform.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{platform.name}</div>
              <div className="text-sm text-gray-500">{platform.description}</div>
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              formData.platforms[platform.id]
                ? 'border-blue-500 bg-blue-500'
                : 'border-gray-300'
            }`}>
              {formData.platforms[platform.id] && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500 mt-6">
        You'll connect your accounts in the dashboard after setup
      </p>
    </div>
  );
}

function GitHubStep({ formData, setFormData, connectGitHub }) {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Connect GitHub</h1>
        <p className="text-gray-600">Link your repository to auto-generate content from commits.</p>
      </div>

      {formData.githubConnected ? (
        <div className="p-6 rounded-2xl bg-green-50 border border-green-200 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-1">GitHub Connected!</h3>
          <p className="text-green-600 text-sm">You can select repositories in the dashboard</p>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={connectGitHub}
            className="w-full p-6 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all flex flex-col items-center gap-3 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-900">Connect GitHub Account</div>
              <div className="text-sm text-gray-500">Click to authorize repository access</div>
            </div>
          </button>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <h4 className="font-medium text-blue-800 mb-2">How it works:</h4>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">1.</span>
                Connect your GitHub account
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">2.</span>
                Select repositories to track
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">3.</span>
                Every commit auto-generates a post draft
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">4.</span>
                Review and publish with one click
              </li>
            </ul>
          </div>
        </div>
      )}

      <button
        onClick={() => setFormData(prev => ({ ...prev, githubConnected: false }))}
        className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
      >
        Skip for now — I'll connect later
      </button>
    </div>
  );
}

function PreferencesStep({ formData, setFormData }) {
  const frequencies = [
    { id: 'light', label: 'Light', description: '1-2 posts per week', icon: '🌱' },
    { id: 'moderate', label: 'Moderate', description: '3-5 posts per week', icon: '🌿' },
    { id: 'active', label: 'Active', description: 'Daily posts', icon: '🌳' },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-3">Almost Done!</h1>
        <p className="text-gray-600">Set your posting preferences. You can always adjust these later.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Posting Frequency</label>
          <div className="grid grid-cols-3 gap-3">
            {frequencies.map((freq) => (
              <button
                key={freq.id}
                onClick={() => setFormData(prev => ({ ...prev, postingFrequency: freq.id }))}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  formData.postingFrequency === freq.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-2">{freq.icon}</div>
                <div className="font-medium text-gray-900 text-sm">{freq.label}</div>
                <div className="text-xs text-gray-500">{freq.description}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Timezone</label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Central European (CET)</option>
            <option value="Asia/Tokyo">Japan (JST)</option>
            <option value="Asia/Shanghai">China (CST)</option>
            <option value="Australia/Sydney">Sydney (AEST)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1.5">Used to schedule posts at optimal times</p>
        </div>

        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          <h4 className="font-medium text-gray-900 mb-2">🎉 You're all set!</h4>
          <p className="text-sm text-gray-600">
            Click "Complete Setup" to go to your dashboard and start creating content.
          </p>
        </div>
      </div>
    </div>
  );
}

// Icons
function RedditIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}