"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function DashboardHome() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ scheduled: 0, posted: 0, drafts: 0 });
  const [recentPosts, setRecentPosts] = useState([]);
  const [upcomingPosts, setUpcomingPosts] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      // Fetch posts stats
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id);

      if (posts) {
        setStats({
          scheduled: posts.filter(p => p.status === 'scheduled').length,
          posted: posts.filter(p => p.status === 'posted').length,
          drafts: posts.filter(p => p.status === 'draft').length,
        });

        // Recent posts (last 5 posted or created)
        const recent = posts
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setRecentPosts(recent);

        // Upcoming scheduled posts
        const upcoming = posts
          .filter(p => p.status === 'scheduled' && p.scheduled_at)
          .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
          .slice(0, 5);
        setUpcomingPosts(upcoming);
      }

      // Fetch connected accounts
      const { data: accounts } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      setConnectedAccounts(accounts || []);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'x':
        return (
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
        );
      case 'reddit':
        return (
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
            </svg>
          </div>
        );
      case 'linkedin':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
            <span>📝</span>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const hasAnyData = stats.scheduled > 0 || stats.posted > 0 || stats.drafts > 0;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/x"
            className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            New Post
          </Link>
        </div>
      </header>

      <div className="p-6">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">
            Good {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="text-gray-500">Here&apos;s what&apos;s happening with your content today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">📅</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-600">
                Queued
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.scheduled}</div>
            <div className="text-sm text-gray-500">Scheduled</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">✅</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-50 text-green-600">
                Live
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.posted}</div>
            <div className="text-sm text-gray-500">Published</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">📝</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                Saved
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stats.drafts}</div>
            <div className="text-sm text-gray-500">Drafts</div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">🔗</span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                Active
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{connectedAccounts.length}</div>
            <div className="text-sm text-gray-500">Connected Accounts</div>
          </div>
        </div>

        {/* Empty State */}
        {!hasAnyData && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🚀</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to start posting?</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Connect your social accounts and create your first post to start growing your audience.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/dashboard/settings/integrations"
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Connect Accounts
              </Link>
              <Link
                href="/dashboard/x"
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Create First Post
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link href="/dashboard/x" className="group p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </div>
                  <div className="font-medium text-gray-900 text-sm">Post to X</div>
                  <div className="text-xs text-gray-500">Compose & schedule</div>
                </Link>

                <Link href="/dashboard/reddit" className="group p-4 bg-orange-50 hover:bg-orange-100 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/>
                    </svg>
                  </div>
                  <div className="font-medium text-gray-900 text-sm">Post to Reddit</div>
                  <div className="text-xs text-gray-500">Share updates</div>
                </Link>

                <Link href="/dashboard/linkedin" className="group p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
                    </svg>
                  </div>
                  <div className="font-medium text-gray-900 text-sm">Post to LinkedIn</div>
                  <div className="text-xs text-gray-500">Professional updates</div>
                </Link>

                <Link href="/dashboard/calendar" className="group p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="font-medium text-gray-900 text-sm">Calendar</div>
                  <div className="text-xs text-gray-500">View schedule</div>
                </Link>
              </div>
            </div>

            {/* Upcoming Posts */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Upcoming Posts</h3>
                <Link href="/dashboard/calendar" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View all →
                </Link>
              </div>
              {upcomingPosts.length > 0 ? (
                <div className="space-y-3">
                  {upcomingPosts.map((post) => (
                    <div key={post.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      {getPlatformIcon(post.platform)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm truncate">{post.content.slice(0, 50)}...</div>
                        <div className="text-xs text-gray-500">
                          {new Date(post.scheduled_at).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </div>
                      </div>
                      <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        Scheduled
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <span className="text-3xl mb-2 block">📅</span>
                  <p>No upcoming posts scheduled</p>
                  <Link href="/dashboard/x" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                    Schedule your first post →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connected Accounts */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Connected Accounts</h3>
                <Link href="/dashboard/settings/integrations" className="text-sm text-blue-600 hover:text-blue-700">
                  Manage →
                </Link>
              </div>
              {connectedAccounts.length > 0 ? (
                <div className="space-y-3">
                  {connectedAccounts.map((account) => (
                    <div key={account.id} className="flex items-center gap-3 p-2 rounded-lg">
                      {getPlatformIcon(account.platform)}
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">@{account.platform_username}</div>
                        <div className="text-xs text-gray-500 capitalize">{account.platform}</div>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm mb-3">No accounts connected yet</p>
                  <Link
                    href="/dashboard/settings/integrations"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Connect your first account →
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Recent Posts</h3>
              {recentPosts.length > 0 ? (
                <div className="space-y-3">
                  {recentPosts.slice(0, 4).map((post) => (
                    <div key={post.id} className="flex items-start gap-3">
                      {getPlatformIcon(post.platform)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">{post.content.slice(0, 40)}...</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            post.status === 'posted' ? 'bg-green-500' :
                            post.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-400'
                          }`}></span>
                          {post.status.charAt(0).toUpperCase() + post.status.slice(1)} • {new Date(post.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p className="text-sm">No posts yet</p>
                </div>
              )}
            </div>

            {/* GitHub Connection */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
                  <GitHubIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">GitHub Autopilot</h3>
                  <p className="text-xs text-gray-500">Auto-post from commits</p>
                </div>
              </div>
              <button className="w-full py-2 px-4 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
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