"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// ==========================================
// ICONS
// ==========================================

const IconTwitterX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconCheck = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconEdit = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconClock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCalendar = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconEye = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconHeart = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconMessageCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconLink = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconTarget = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconRefresh = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconSend = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

// ==========================================
// GROWTH MODE TOGGLE
// ==========================================

function GrowthModeToggle({ mode, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      <button
        onClick={() => onChange('maintenance')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          mode === 'maintenance' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Maintenance
      </button>
      <button
        onClick={() => onChange('aggressive')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          mode === 'aggressive' ? 'bg-amber-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        🔥 Aggressive
      </button>
    </div>
  );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({ label, value, icon: Icon, color = 'blue', trend }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    emerald: 'bg-emerald-100 text-emerald-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ==========================================
// THREAD PREVIEW
// ==========================================

function ThreadPreview({ hook, plug, onApprove, onEdit, onRegenerate }) {
  const hookLength = hook?.length || 0;
  const plugLength = plug?.length || 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
            <IconTwitterX className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Thread Preview</h3>
            <p className="text-xs text-gray-500">Hook + Plug Strategy</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRegenerate} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <IconRefresh className="w-4 h-4" />
          </button>
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <IconEdit className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Hook Tweet */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
              1
            </div>
            <div className="w-0.5 h-full bg-gray-200 mt-2 min-h-[60px]" />
          </div>
          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Hook</span>
              <span className="text-xs text-gray-400">Main Tweet</span>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{hook || 'No content...'}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                <span className={`text-xs ${hookLength > 280 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {hookLength}/280
                </span>
                <div className="flex items-center gap-1 text-gray-400">
                  <IconLink className="w-3.5 h-3.5 opacity-30" />
                  <span className="text-xs line-through">No links</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delay Indicator */}
        <div className="flex items-center gap-3 -mt-2 mb-2">
          <div className="w-10 flex justify-center">
            <div className="px-2 py-1 bg-gray-100 rounded text-[10px] text-gray-500 font-medium">60s</div>
          </div>
          <span className="text-xs text-gray-400">Auto-reply delay</span>
        </div>

        {/* Plug Tweet */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm flex-shrink-0">
            2
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Plug</span>
              <span className="text-xs text-gray-400">Reply with Link</span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{plug || 'No content...'}</p>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-200">
                <span className={`text-xs ${plugLength > 280 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {plugLength}/280
                </span>
                <div className="flex items-center gap-1 text-emerald-600">
                  <IconLink className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">Link here ✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-gray-100">
          <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            🔥 High Reply Potential
          </span>
          <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
            Build in Public
          </span>
        </div>
      </div>

      <div className="p-5 border-t border-gray-100 flex items-center justify-between bg-gray-50">
        <span className="text-xs text-gray-500">Algorithm-optimized for maximum reach</span>
        <button
          onClick={onApprove}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <IconSend className="w-4 h-4" />
          Schedule Thread
        </button>
      </div>
    </div>
  );
}

// ==========================================
// ALGORITHM SCORE
// ==========================================

function AlgorithmScore() {
  const scores = [
    { label: 'Link Position', value: 100, status: 'In reply (optimal)', good: true },
    { label: 'Hook Strength', value: 85, status: 'Strong first line', good: true },
    { label: 'Reply Potential', value: 90, status: 'Ends with question', good: true },
    { label: 'Content Length', value: 100, status: 'Under 280 chars', good: true },
  ];

  const overall = Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <IconTarget className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Algorithm Alignment</h3>
            <p className="text-xs text-gray-500">Based on X Phoenix scoring</p>
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-600">{overall}%</div>
      </div>
      <div className="p-5 space-y-4">
        {scores.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                item.good ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}>
                {item.good ? '✓' : '✗'}
              </div>
              <span className="text-sm text-gray-700">{item.label}</span>
            </div>
            <span className="text-xs text-gray-500">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// UPCOMING POSTS
// ==========================================

function UpcomingPosts({ posts }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Upcoming Posts</h3>
      </div>
      <div className="divide-y divide-gray-100">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No scheduled posts</div>
        ) : (
          posts.slice(0, 5).map((post, index) => (
            <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <IconClock className="w-3 h-3" />
                    {new Date(post.scheduled_at).toLocaleDateString('en-US', {
                      weekday: 'short', hour: 'numeric', minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function XPipelinePage() {
  const [user, setUser] = useState(null);
  const [xAccount, setXAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [growthMode, setGrowthMode] = useState('maintenance');
  const [stats, setStats] = useState({ postsToday: 0, weeklyReach: 0, avgLikes: 0, avgReplies: 0 });
  const [upcomingPosts, setUpcomingPosts] = useState([]);
  const [currentThread, setCurrentThread] = useState({
    hook: "6 months ago I was spending 10+ hrs/week on social media.\n\nToday I pushed a button and 12 posts scheduled automatically.\n\nThe tool I wished existed? I built it.",
    plug: "If you're drowning in content creation too:\n\ndistributo.dev\n\nPush code. We handle the rest."
  });

  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    const { data: account } = await supabase.from('connected_accounts').select('*').eq('user_id', user.id).eq('platform', 'x').eq('is_active', true).single();
    setXAccount(account);

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: postedPosts } = await supabase.from('posts').select('*').eq('user_id', user.id).eq('platform', 'x').eq('status', 'posted').gte('posted_at', weekAgo);
    const { data: scheduled } = await supabase.from('posts').select('*').eq('user_id', user.id).eq('platform', 'x').eq('status', 'scheduled').order('scheduled_at', { ascending: true }).limit(5);

    setStats({
      postsToday: (postedPosts || []).length,
      weeklyReach: postedPosts?.reduce((s, p) => s + (p.impressions_count || 0), 0) || 0,
      avgLikes: postedPosts?.length ? Math.round(postedPosts.reduce((s, p) => s + (p.likes_count || 0), 0) / postedPosts.length) : 0,
      avgReplies: postedPosts?.length ? Math.round(postedPosts.reduce((s, p) => s + (p.comments_count || 0), 0) / postedPosts.length) : 0,
    });
    setUpcomingPosts(scheduled || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center">
              <IconTwitterX className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">X / Twitter</h1>
              <p className="text-sm text-gray-500">Algorithm-optimized posting</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <GrowthModeToggle mode={growthMode} onChange={setGrowthMode} />
            {xAccount && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl">
                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-sm text-gray-700">@{xAccount.platform_username}</span>
              </div>
            )}
          </div>
        </div>

        {/* Connect Banner */}
        {!xAccount && (
          <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <IconTwitterX className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">Connect your X account</p>
                <p className="text-sm text-amber-700">Link your account to start automating posts.</p>
              </div>
            </div>
            <Link href="/dashboard/settings/integrations" className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800">
              Connect X
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Posts Today" value={stats.postsToday > 0 ? `${stats.postsToday}/10` : '—'} icon={IconCalendar} color="blue" />
          <StatCard label="Weekly Reach" value={stats.weeklyReach > 0 ? stats.weeklyReach.toLocaleString() : '—'} icon={IconEye} color="purple" />
          <StatCard label="Avg Likes" value={stats.avgLikes > 0 ? stats.avgLikes : '—'} icon={IconHeart} color="amber" />
          <StatCard label="Avg Replies" value={stats.avgReplies > 0 ? stats.avgReplies : '—'} icon={IconMessageCircle} color="emerald" />
        </div>

        {/* Engagement notice when no data */}
        {stats.weeklyReach === 0 && stats.avgLikes === 0 && (
          <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-2xl text-center">
            <p className="text-sm text-gray-500">Engagement data appears after your first week of posting</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ThreadPreview
              hook={currentThread.hook}
              plug={currentThread.plug}
              onApprove={() => console.log('approve')}
              onEdit={() => console.log('edit')}
              onRegenerate={() => console.log('regenerate')}
            />
            <AlgorithmScore />
          </div>
          <div>
            <UpcomingPosts posts={upcomingPosts} />
          </div>
        </div>
      </div>
    </div>
  );
}