"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function XPipelinePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [xAccount, setXAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ postsToday: 0, postsThisWeek: 0, weeklyReach: 0, avgLikes: 0, avgReplies: 0 });
  const [upcomingPosts, setUpcomingPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [settings, setSettings] = useState({
    postsPerDay: 5,
    postingWindowStart: '09:00',
    postingWindowEnd: '20:00',
    autoApprove: false,
  });

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profileData);

    const { data: account } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'x')
      .eq('is_active', true)
      .single();
    setXAccount(account);

    // Stats
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { count: todayCount } = await supabase
      .from('posts').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('platform', 'x')
      .gte('created_at', `${today}T00:00:00`);

    const { count: weekCount } = await supabase
      .from('posts').select('*', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('platform', 'x').eq('status', 'posted')
      .gte('posted_at', weekAgo);

    const { data: postedPosts } = await supabase
      .from('posts').select('likes_count, comments_count, impressions_count')
      .eq('user_id', user.id).eq('platform', 'x').eq('status', 'posted')
      .gte('posted_at', weekAgo);

    const avgLikes = postedPosts?.length ? Math.round(postedPosts.reduce((s, p) => s + (p.likes_count || 0), 0) / postedPosts.length) : 0;
    const avgReplies = postedPosts?.length ? Math.round(postedPosts.reduce((s, p) => s + (p.comments_count || 0), 0) / postedPosts.length) : 0;
    const weeklyReach = postedPosts?.reduce((s, p) => s + (p.impressions_count || 0), 0) || 0;

    setStats({ postsToday: todayCount || 0, postsThisWeek: weekCount || 0, weeklyReach, avgLikes, avgReplies });

    // Upcoming posts
    const { data: upcoming } = await supabase
      .from('posts').select('*')
      .eq('user_id', user.id).eq('platform', 'x')
      .in('status', ['pending', 'scheduled'])
      .order('scheduled_at', { ascending: true }).limit(5);
    setUpcomingPosts(upcoming || []);

    // Communities
    const { data: communitiesData } = await supabase
      .from('x_communities').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setCommunities(communitiesData || []);

    setLoading(false);
  };

  const handleDeleteCommunity = async (id) => {
    await supabase.from('x_communities').delete().eq('id', id);
    await loadData();
  };

  const handleToggleCommunity = async (id, isActive) => {
    await supabase.from('x_communities').update({ is_active: !isActive }).eq('id', id);
    await loadData();
  };

  const formatTime = (dateStr) => dateStr ? new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
  const formatReach = (num) => num >= 1000 ? `${(num / 1000).toFixed(1)}k` : num.toString();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center">
              <XIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">X / Twitter Pipeline</h1>
              <p className="text-gray-500">Manage your X automation and performance.</p>
            </div>
          </div>
          {xAccount && (
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">@{xAccount.platform_username}</span>
              <span className="text-xs text-green-600">Connected</span>
            </div>
          )}
        </div>

        {/* Not Connected Banner */}
        {!xAccount && (
          <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <XIcon className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">Connect your X account</p>
                <p className="text-sm text-amber-700">Link your account to start automating posts.</p>
              </div>
            </div>
            <Link href="/dashboard/settings/integrations" className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors">
              Connect X
            </Link>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Today</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.postsToday}/10</div>
            <div className="text-sm text-gray-500 mt-1">Posts Today</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <ChartIcon className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Week</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.postsThisWeek}</div>
            <div className="text-sm text-gray-500 mt-1">Posts This Week</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingIcon className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{formatReach(stats.weeklyReach)}</div>
            <div className="text-sm text-gray-500 mt-1">Weekly Reach</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
                <HeartIcon className="w-6 h-6 text-pink-600" />
              </div>
              <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded-full">Avg</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.avgLikes}</div>
            <div className="text-sm text-gray-500 mt-1">Avg. Likes</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Communities Section */}
          <div className="col-span-2 bg-white rounded-2xl border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <UsersIcon className="w-5 h-5 text-gray-400" />
                  X Communities
                </h2>
                <p className="text-sm text-gray-500 mt-1">Auto-post to these communities</p>
              </div>
              <button
                onClick={() => setShowAddCommunity(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Community
              </button>
            </div>

            {communities.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <UsersIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium mb-2">No communities added</p>
                <p className="text-gray-500 text-sm mb-4">Add X communities to automatically post your content there</p>
                <button
                  onClick={() => setShowAddCommunity(true)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Add your first community →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {communities.map((community) => (
                  <div key={community.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
                        <UsersIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{community.name}</div>
                        <div className="text-xs text-gray-500">ID: {community.community_id}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${community.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {community.is_active ? 'Active' : 'Paused'}
                      </span>
                      <button
                        onClick={() => handleToggleCommunity(community.id, community.is_active)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${community.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${community.is_active ? 'left-6' : 'left-1'}`} />
                      </button>
                      <button
                        onClick={() => handleDeleteCommunity(community.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* How to find community ID */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <InfoIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-500">
                  <span className="font-medium text-gray-600">How to find Community ID:</span> Go to the X Community → the URL will be like twitter.com/i/communities/<span className="font-mono bg-gray-200 px-1 rounded">1234567890</span> → copy that number
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Performance */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Engagement rate</span>
                  <span className="text-sm font-semibold text-gray-900">3.2%</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Avg. likes</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.avgLikes}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Avg. replies</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.avgReplies}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Best time</span>
                  <span className="text-sm font-semibold text-gray-900">9 AM, 5 PM</span>
                </div>
              </div>
            </div>

            {/* Upcoming Posts */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Upcoming</h3>
                <Link href="/dashboard/queue" className="text-sm text-blue-600 font-medium">View All</Link>
              </div>
              
              {upcomingPosts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No scheduled posts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingPosts.slice(0, 3).map((post) => (
                    <div key={post.id} className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${post.status === 'pending' ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                        <span className="text-xs text-gray-500">{formatTime(post.scheduled_at)}</span>
                        <span className={`text-xs font-medium ${post.status === 'pending' ? 'text-amber-600' : 'text-blue-600'}`}>
                          {post.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Connected Account */}
            {xAccount && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Connected Account</h3>
                <div className="flex items-center gap-3">
                  {xAccount.platform_avatar_url ? (
                    <img src={xAccount.platform_avatar_url} alt="" className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-600">
                      {xAccount.platform_username?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">@{xAccount.platform_username}</div>
                    <div className="text-sm text-green-600 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Connected
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Community Modal */}
      {showAddCommunity && (
        <AddCommunityModal
          userId={user?.id}
          onClose={() => setShowAddCommunity(false)}
          onAdded={() => {
            setShowAddCommunity(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function AddCommunityModal({ userId, onClose, onAdded }) {
  const [communityId, setCommunityId] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [mode, setMode] = useState('manual'); // 'manual' or 'search'
  const supabase = createClient();

  const handleAdd = async () => {
    if (!communityId.trim() || !name.trim()) {
      setError('Community ID and name are required');
      return;
    }
    setSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('x_communities').insert({
      user_id: userId,
      community_id: communityId.trim(),
      name: name.trim(),
    });

    if (insertError) {
      setError(insertError.code === '23505' ? 'This community is already added' : insertError.message);
      setSaving(false);
      return;
    }
    onAdded();
  };

  const handleIdChange = (value) => {
    const match = value.match(/communities\/(\d+)/);
    setCommunityId(match ? match[1] : value);
  };

  const handleSelectFromSearch = (community) => {
    setCommunityId(community.id);
    setName(community.name);
    setMode('manual');
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add X Community</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh]">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}

          {/* Instructions */}
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-start gap-3">
              <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">How to add a community:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700 text-xs">
                  <li>Open X and go to the community you want to add</li>
                  <li>Copy the URL (e.g., x.com/i/communities/<strong>1234567890</strong>)</li>
                  <li>Paste it below - we'll extract the ID automatically</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Community URL or ID *</label>
            <input
              type="text"
              value={communityId}
              onChange={(e) => handleIdChange(e.target.value)}
              placeholder="Paste community URL or just the ID"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {communityId && communityId.match(/^\d+$/) && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircleIcon className="w-4 h-4" />
                Valid community ID detected
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Community Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Build in Public, Indie Hackers"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">This is just for your reference</p>
          </div>

          {/* Popular Communities Suggestions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Popular Communities</label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: '1493446837214187523', name: 'Build in Public' },
                { id: '1488963315096326145', name: 'Indie Hackers' },
                { id: '1516428323899392001', name: 'SaaS Founders' },
                { id: '1493876292516442112', name: 'Tech Twitter' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCommunityId(c.id);
                    setName(c.name);
                  }}
                  className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !communityId.trim() || !name.trim()}
            className="px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Community'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }

// Icons
function XIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }
function CalendarIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function ChartIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function TrendingIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>; }
function HeartIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>; }
function UsersIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>; }
function PlusIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>; }
function TrashIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>; }
function InfoIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function XMarkIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>; }