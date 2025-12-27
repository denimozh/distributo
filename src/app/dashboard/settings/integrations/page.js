"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function IntegrationsPage() {
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('is_active', true);
    
    if (!error && data) {
      setConnectedAccounts(data);
    }
    setLoading(false);
  };

  const platforms = [
    {
      id: 'x',
      name: 'X (Twitter)',
      description: 'Post tweets, threads, and engage with your audience',
      icon: XIcon,
      color: 'bg-black',
      limits: '500 posts/month (Free tier)',
      features: ['Schedule tweets', 'Post threads', 'Track engagement'],
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      description: 'Share professional updates and grow your network',
      icon: LinkedInIcon,
      color: 'bg-blue-600',
      limits: 'Standard API access',
      features: ['Schedule posts', 'Cross-post from X', 'Professional tone AI'],
    },
    {
      id: 'reddit',
      name: 'Reddit',
      description: 'Post to subreddits and engage with communities',
      icon: RedditIcon,
      color: 'bg-orange-500',
      limits: 'Pending approval',
      features: ['Find subreddits', 'AI Slop Detector', 'Rule compliance'],
      comingSoon: true,
    },
  ];

  const getConnectedAccount = (platformId) => {
    return connectedAccounts.find(acc => acc.platform === platformId);
  };

  const handleConnect = async (platformId) => {
    setConnecting(platformId);
    
    // Redirect to OAuth endpoint
    window.location.href = `/api/auth/${platformId}/connect`;
  };

  const handleDisconnect = async (platformId) => {
    const confirmed = window.confirm(`Are you sure you want to disconnect your ${platformId === 'x' ? 'X' : platformId} account?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('connected_accounts')
      .delete()
      .eq('platform', platformId);

    if (!error) {
      setConnectedAccounts(prev => prev.filter(acc => acc.platform !== platformId));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <PuzzleIcon className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Integrations</h1>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        {/* Info Banner */}
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <InfoIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Connect your accounts</h3>
              <p className="text-sm text-blue-700 mt-1">
                Link your social media accounts to start scheduling and automating posts. 
                Your credentials are securely stored and you can disconnect at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="space-y-4">
          {platforms.map((platform) => {
            const connected = getConnectedAccount(platform.id);
            const Icon = platform.icon;

            return (
              <div
                key={platform.id}
                className={`bg-white rounded-xl border ${
                  connected ? 'border-green-200' : 'border-gray-200'
                } p-6 transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Platform Icon */}
                    <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Platform Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                        {platform.comingSoon && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            Coming Soon
                          </span>
                        )}
                        {connected && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
                            <CheckIcon className="w-3 h-3" />
                            Connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{platform.description}</p>

                      {/* Connected Account Info */}
                      {connected && (
                        <div className="mt-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {connected.platform_avatar_url ? (
                            <img
                              src={connected.platform_avatar_url}
                              alt={connected.platform_username}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {connected.platform_username?.[0]?.toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm text-gray-900">
                              @{connected.platform_username}
                            </div>
                            <div className="text-xs text-gray-500">
                              Connected {new Date(connected.connected_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Features */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {platform.features.map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* API Limits */}
                      <div className="mt-2 text-xs text-gray-400">
                        {platform.limits}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex flex-col gap-2">
                    {connected ? (
                      <>
                        <button
                          onClick={() => handleDisconnect(platform.id)}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform.id)}
                        disabled={platform.comingSoon || connecting === platform.id}
                        className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all ${
                          platform.comingSoon
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-[#1a1a2e] text-white hover:bg-[#2d2d44]'
                        }`}
                      >
                        {connecting === platform.id ? (
                          <span className="flex items-center gap-2">
                            <LoadingIcon className="w-4 h-4 animate-spin" />
                            Connecting...
                          </span>
                        ) : (
                          'Connect'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* GitHub Autopilot Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Developer Integrations</h2>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                <GitHubIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">GitHub Autopilot</h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    Coming Soon
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Automatically generate social media posts from your GitHub commits. 
                  Connect your repository and let AI turn your code updates into engaging content.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    Webhook integration
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    Smart commit filtering
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                    Multi-platform generation
                  </span>
                </div>
              </div>
              <button
                disabled
                className="px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>

        {/* API Usage Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Usage This Month</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UsageCard
              platform="X"
              icon={XIcon}
              used={12}
              limit={500}
              color="gray"
            />
            <UsageCard
              platform="LinkedIn"
              icon={LinkedInIcon}
              used={5}
              limit={100}
              color="blue"
            />
            <UsageCard
              platform="Reddit"
              icon={RedditIcon}
              used={0}
              limit={0}
              color="orange"
              disabled
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ platform, icon: Icon, used, limit, color, disabled }) {
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const colorClasses = {
    gray: 'bg-gray-900',
    blue: 'bg-blue-600',
    orange: 'bg-orange-500',
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span className="font-medium text-gray-900">{platform}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {used} <span className="text-sm font-normal text-gray-500">/ {limit || '—'}</span>
      </div>
      <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} rounded-full transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {disabled ? 'Not connected' : `${limit - used} remaining`}
      </div>
    </div>
  );
}

// Icons
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

function RedditIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249z"/>
    </svg>
  );
}

function GitHubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function PuzzleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  );
}

function InfoIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function LoadingIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}