"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

// ==========================================
// ICONS
// ==========================================
const IconTrendingUp = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);
const IconBarChart = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>);
const IconMousePointer = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" /></svg>);
const IconHeart = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>);
const IconMessageCircle = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>);
const IconEye = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>);
const IconBrain = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" /><path d="M10 21h4" /></svg>);
const IconClock = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const IconBookmark = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>);
const IconRepeat = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>);
const IconZap = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);
const IconTarget = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>);
const IconCalendar = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>);
const IconLink = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>);

// ==========================================
// METRIC CARD — inspired by Trackify
// ==========================================
function MetricCard({ label, value, icon: Icon, change, iconBg = 'bg-blue-100', iconColor = 'text-blue-600', suffix }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {change !== undefined && change !== null && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${change >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight">
        {value}{suffix && <span className="text-sm font-normal text-gray-400 ml-1">{suffix}</span>}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ==========================================
// MINI BAR CHART (pure CSS)
// ==========================================
function MiniBarChart({ data, maxVal, colorFn }) {
  const max = maxVal || Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full relative group">
            <div
              className={`w-full rounded-t transition-all ${colorFn ? colorFn(d.value, max) : 'bg-blue-500'} hover:opacity-80`}
              style={{ height: `${Math.max(2, (d.value / max) * 64)}px` }}
            />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">{d.label}: {d.value}</div>
            </div>
          </div>
          <span className="text-[9px] text-gray-400">{d.short}</span>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// HOUR HEATMAP
// ==========================================
function HourHeatmap({ hourData }) {
  const max = Math.max(...Object.values(hourData), 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div>
      <div className="grid grid-cols-12 gap-1">
        {hours.map(h => {
          const val = hourData[h] || 0;
          const intensity = val / max;
          const bg = intensity === 0 ? 'bg-gray-100' : intensity < 0.3 ? 'bg-emerald-100' : intensity < 0.6 ? 'bg-emerald-300' : intensity < 0.8 ? 'bg-emerald-500' : 'bg-emerald-600';
          return (
            <div key={h} className="relative group">
              <div className={`aspect-square rounded-sm ${bg} transition-colors`} />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">{h}:00 — score {Math.round(val)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 text-[9px] text-gray-400">
        <span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span>
      </div>
    </div>
  );
}

// ==========================================
// TOP POSTS TABLE
// ==========================================
function TopPostsTable({ posts }) {
  if (!posts?.length) return <div className="text-center py-8 text-sm text-gray-400">No posts with engagement data yet</div>;

  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3 pl-1">#</th>
            <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Hook</th>
            <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Impressions</th>
            <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Likes</th>
            <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Replies</th>
            <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Clicks</th>
            <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3 pr-1">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {posts.map((post, i) => (
            <tr key={post.id} className="hover:bg-gray-50 transition-colors">
              <td className="py-3 pl-1">
                <span className={`inline-flex w-5 h-5 rounded items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
              </td>
              <td className="py-3 pr-4">
                <p className="text-sm text-gray-700 truncate max-w-[300px]">{(post.hook_content || post.content || '').split('\n')[0]}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(post.posted_at || post.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
              </td>
              <td className="py-3 text-right text-sm text-gray-600 tabular-nums">{(post.impressions_count || 0).toLocaleString()}</td>
              <td className="py-3 text-right text-sm text-gray-600 tabular-nums">{post.likes_count || 0}</td>
              <td className="py-3 text-right text-sm text-gray-600 tabular-nums">{post.replies_count || 0}</td>
              <td className="py-3 text-right text-sm text-gray-600 tabular-nums">{post.clicks_count || 0}</td>
              <td className="py-3 pr-1 text-right">
                <span className="text-xs font-semibold text-emerald-600">{Math.round(post.engagement_score || 0)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ==========================================
// FORMAT PERFORMANCE BARS
// ==========================================
function FormatPerformance({ formatPerf }) {
  const entries = Object.entries(formatPerf || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return null;
  const max = entries[0]?.[1] || 1;

  const formatLabel = (f) => {
    const labels = { 'pain_solution': 'Pain → Solution', 'controversial': 'Controversial Take', 'before_after': 'Before/After', 'question': 'Question Hook', 'story': 'Story', 'mixed': 'Mixed', 'broetry': 'Broetry', 'one_liner': 'One-Liner', 'thread': 'Thread' };
    return labels[f] || f?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || f;
  };

  return (
    <div className="space-y-3">
      {entries.map(([format, score]) => (
        <div key={format}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-700">{formatLabel(format)}</span>
            <span className="text-xs font-medium text-gray-500">{Math.round(score)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${score === max ? 'bg-emerald-500' : 'bg-gray-300'}`}
              style={{ width: `${(score / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// AUTOPILOT STATUS CARD
// ==========================================
function AutopilotStatus({ profile, scheduledCount, nextPostTime }) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    // Autopilot cron runs every 6 hours: 00:00, 06:00, 12:00, 18:00 UTC
    const getNextCron = () => {
      const now = new Date();
      const hours = now.getUTCHours();
      const nextCronHour = Math.ceil((hours + 1) / 6) * 6;
      const next = new Date(now);
      next.setUTCHours(nextCronHour % 24, 0, 0, 0);
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
      return next;
    };

    const update = () => {
      const diff = getNextCron() - new Date();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setCountdown(`${h}h ${m}m`);
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <IconZap className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Autopilot Engine</h3>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${profile?.autopilot_enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
          {profile?.autopilot_enabled ? 'ACTIVE' : 'PAUSED'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Posts per day</span>
          <span className="font-medium text-gray-900">{profile?.autopilot_posts_per_day || 5}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Auto-approve</span>
          <span className={`font-medium ${profile?.autopilot_auto_approve ? 'text-emerald-600' : 'text-gray-900'}`}>{profile?.autopilot_auto_approve ? 'Yes' : 'No — manual review'}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Queued posts</span>
          <span className="font-medium text-gray-900">{scheduledCount}</span>
        </div>

        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-500">Next generation check:</span>
            <span className="font-mono font-medium text-gray-700">{countdown}</span>
          </div>
          {nextPostTime && (
            <div className="flex items-center gap-2 text-xs mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-gray-500">Next post publishes:</span>
              <span className="font-medium text-gray-700">
                {new Date(nextPostTime).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN — INSIGHTS PAGE
// ==========================================
export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [period, setPeriod] = useState('7d');
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profileData);

    const { data: allPosts } = await supabase.from('posts').select('*').eq('user_id', user.id).order('posted_at', { ascending: false });
    setPosts(allPosts || []);

    const { data: insightsData } = await supabase.from('content_insights').select('*').eq('user_id', user.id).single();
    setInsights(insightsData);

    setLoading(false);
  };

  // Computed data
  const computed = useMemo(() => {
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevCutoff = new Date(cutoff.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const posted = posts.filter(p => p.status === 'posted' && p.posted_at);
    const inPeriod = posted.filter(p => new Date(p.posted_at) >= cutoff);
    const inPrev = posted.filter(p => new Date(p.posted_at) >= prevCutoff && new Date(p.posted_at) < cutoff);

    const sum = (arr, key) => arr.reduce((s, p) => s + (p[key] || 0), 0);
    const avg = (arr, key) => arr.length ? Math.round(sum(arr, key) / arr.length) : 0;
    const pctChange = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;

    const totalImpressions = sum(inPeriod, 'impressions_count');
    const totalLikes = sum(inPeriod, 'likes_count');
    const totalReplies = sum(inPeriod, 'replies_count');
    const totalClicks = sum(inPeriod, 'clicks_count');
    const totalBookmarks = sum(inPeriod, 'bookmarks_count');
    const totalRetweets = sum(inPeriod, 'retweets_count');

    const prevImpressions = sum(inPrev, 'impressions_count');
    const prevLikes = sum(inPrev, 'likes_count');
    const prevReplies = sum(inPrev, 'replies_count');
    const prevClicks = sum(inPrev, 'clicks_count');

    // Day-of-week performance
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = DAYS.map((name, i) => {
      const dayPosts = inPeriod.filter(p => new Date(p.posted_at).getDay() === i);
      return { label: name, short: name.slice(0, 2), value: dayPosts.length > 0 ? avg(dayPosts, 'engagement_score') : 0 };
    });

    // Hour performance
    const hourData = {};
    inPeriod.forEach(p => {
      const h = new Date(p.posted_at).getHours();
      if (!hourData[h]) hourData[h] = [];
      hourData[h].push(p.engagement_score || 0);
    });
    const hourAvg = {};
    Object.entries(hourData).forEach(([h, scores]) => {
      hourAvg[h] = scores.reduce((a, b) => a + b, 0) / scores.length;
    });

    // Top posts by engagement
    const topPosts = [...inPeriod].filter(p => p.engagement_score > 0).sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0)).slice(0, 10);

    const scheduled = posts.filter(p => p.status === 'scheduled');
    const nextPost = scheduled.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0];

    return {
      totalPosts: inPeriod.length,
      totalPosted: posted.length,
      totalImpressions, totalLikes, totalReplies, totalClicks, totalBookmarks, totalRetweets,
      impressionsChange: pctChange(totalImpressions, prevImpressions),
      likesChange: pctChange(totalLikes, prevLikes),
      repliesChange: pctChange(totalReplies, prevReplies),
      clicksChange: pctChange(totalClicks, prevClicks),
      avgEngagement: avg(inPeriod, 'engagement_score'),
      dayData, hourAvg, topPosts,
      scheduledCount: scheduled.length,
      nextPostTime: nextPost?.scheduled_at,
    };
  }, [posts, period]);

  if (loading) {
    return (<div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>);
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-6 lg:p-8 max-w-[1440px] mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Insights</h1>
            <p className="text-sm text-gray-500 mt-1">Content intelligence &amp; performance tracking</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Period selector */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              {[
                { value: '7d', label: 'Last 7 days' },
                { value: '30d', label: 'Last 30 days' },
                { value: '90d', label: 'Last 90 days' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setPeriod(opt.value)} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${period === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metric cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
          <MetricCard label="Total Posts" value={computed.totalPosts} icon={IconBarChart} iconBg="bg-blue-100" iconColor="text-blue-600" />
          <MetricCard label="Impressions" value={computed.totalImpressions.toLocaleString()} icon={IconEye} change={computed.impressionsChange} iconBg="bg-violet-100" iconColor="text-violet-600" />
          <MetricCard label="Likes" value={computed.totalLikes.toLocaleString()} icon={IconHeart} change={computed.likesChange} iconBg="bg-pink-100" iconColor="text-pink-600" />
          <MetricCard label="Replies" value={computed.totalReplies.toLocaleString()} icon={IconMessageCircle} change={computed.repliesChange} iconBg="bg-emerald-100" iconColor="text-emerald-600" />
          <MetricCard label="Link Clicks" value={computed.totalClicks.toLocaleString()} icon={IconMousePointer} change={computed.clicksChange} iconBg="bg-amber-100" iconColor="text-amber-600" />
          <MetricCard label="Bookmarks" value={computed.totalBookmarks.toLocaleString()} icon={IconBookmark} iconBg="bg-gray-100" iconColor="text-gray-600" />
        </div>

        {/* Two-column: Performance charts + Intelligence panel */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Left 2/3 — Charts */}
          <div className="lg:col-span-2 space-y-6">

            {/* Day-of-week engagement */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Engagement by Day</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Average engagement score per day of week</p>
                </div>
              </div>
              <MiniBarChart
                data={computed.dayData}
                colorFn={(val, max) => val === max ? 'bg-emerald-500' : val > max * 0.5 ? 'bg-emerald-300' : 'bg-gray-300'}
              />
            </div>

            {/* Hour heatmap */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Best Posting Times</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Engagement heatmap by hour — darker = better</p>
                </div>
                {insights?.best_posting_hour !== undefined && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Peak: {insights.best_posting_hour}:00
                  </span>
                )}
              </div>
              <HourHeatmap hourData={computed.hourAvg} />
            </div>

            {/* Top posts table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Top Performing Posts</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Ranked by engagement score (replies × 13.5 + retweets × 20 + bookmarks × 15 + likes × 0.5)</p>
                </div>
              </div>
              <div className="p-5">
                <TopPostsTable posts={computed.topPosts} />
              </div>
            </div>
          </div>

          {/* Right 1/3 — Intelligence + Autopilot */}
          <div className="space-y-6">

            {/* Content Intelligence */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <IconBrain className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Content Intelligence</h3>
                    <p className="text-[10px] text-gray-400">
                      {insights ? `${insights.posts_analyzed || 0} posts analyzed` : 'Learning...'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {!insights ? (
                  <div className="text-center py-4">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                      <div className="bg-violet-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (computed.totalPosted / 5) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-500">Need <span className="font-semibold">{Math.max(0, 5 - computed.totalPosted)}</span> more posts with engagement</p>
                    <p className="text-[10px] text-gray-400 mt-1">AI patterns unlock after 5 analyzed posts</p>
                  </div>
                ) : (
                  <>
                    {/* Best format */}
                    <div>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Best Format</span>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {insights.best_format?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Mixed'}
                      </p>
                    </div>

                    {/* Format performance bars */}
                    {insights.format_performance && (
                      <div>
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Format Performance</span>
                        <div className="mt-2">
                          <FormatPerformance formatPerf={insights.format_performance} />
                        </div>
                      </div>
                    )}

                    {/* Top hooks */}
                    {insights.top_hook_patterns?.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Top Hooks</span>
                        <div className="mt-2 space-y-2">
                          {insights.top_hook_patterns.slice(0, 3).map((h, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className={`inline-flex w-4 h-4 rounded items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5 ${i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                              <p className="text-xs text-gray-600 italic leading-relaxed">"{h.hook}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Data lock-in message */}
                    <div className="pt-3 border-t border-gray-100 bg-violet-50/50 -mx-5 -mb-5 px-5 py-4 rounded-b-2xl">
                      <div className="flex items-start gap-2">
                        <IconTarget className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-violet-700">Your content DNA is building</p>
                          <p className="text-[10px] text-violet-500 mt-0.5">
                            {insights.posts_analyzed || 0} data points shaping your AI strategy. Generation adapts to {insights.best_format?.replace(/_/g, ' ')} format and {insights.best_posting_hour}:00 posting time.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Autopilot Status */}
            <AutopilotStatus
              profile={profile}
              scheduledCount={computed.scheduledCount}
              nextPostTime={computed.nextPostTime}
            />

            {/* Attribution tracking */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <IconLink className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Click Attribution</h3>
                  <p className="text-[10px] text-gray-400">UTM-tracked link performance</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Total tracked clicks</span>
                  <span className="text-sm font-bold text-gray-900">{computed.totalClicks.toLocaleString()}</span>
                </div>
                {computed.totalPosts > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Clicks per post</span>
                    <span className="text-sm font-medium text-gray-700">{(computed.totalClicks / computed.totalPosts).toFixed(1)}</span>
                  </div>
                )}
                {profile?.product_url && (
                  <div className="pt-3 border-t border-gray-100">
                    <span className="text-[10px] text-gray-400">Tracking to:</span>
                    <p className="text-xs text-gray-600 truncate mt-0.5">{profile.product_url}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}