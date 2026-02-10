"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

const IconBarChart = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>);
const IconEye = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>);
const IconHeart = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>);
const IconMessage = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>);
const IconMouse = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" /></svg>);
const IconBookmark = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>);
const IconBrain = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" /><path d="M10 21h4" /></svg>);
const IconZap = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);
const IconTarget = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>);
const IconLink = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>);
const IconClock = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);

function MetricCard({ label, value, icon: Icon, change, iconBg = 'bg-blue-50', iconColor = 'text-blue-600', highlight }) {
  return (
    <div className={`bg-white rounded-2xl border ${highlight ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-200'} p-5 hover:shadow-sm transition-all`}>
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
      <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function HourHeatmap({ hourData }) {
  const max = Math.max(...Object.values(hourData), 1);
  return (
    <div>
      <div className="grid grid-cols-12 gap-1">
        {Array.from({ length: 24 }, (_, h) => {
          const val = hourData[h] || 0;
          const intensity = val / max;
          const bg = intensity === 0 ? 'bg-gray-100' : intensity < 0.3 ? 'bg-emerald-100' : intensity < 0.6 ? 'bg-emerald-300' : intensity < 0.8 ? 'bg-emerald-500' : 'bg-emerald-600';
          return (
            <div key={h} className="relative group">
              <div className={`aspect-square rounded-sm ${bg} transition-colors cursor-pointer`} />
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">{h}:00 — score {Math.round(val)}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-[9px] text-gray-400"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>11pm</span></div>
    </div>
  );
}

function DayBarChart({ data }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full relative group">
            <div className={`w-full rounded-t-md transition-all hover:opacity-80 ${d.value === max && d.value > 0 ? 'bg-emerald-500' : d.value > max * 0.5 ? 'bg-emerald-300' : 'bg-gray-300'}`}
              style={{ height: `${Math.max(3, (d.value / max) * 80)}px` }} />
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">{d.label}: {d.value}</div>
            </div>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">{d.short}</span>
        </div>
      ))}
    </div>
  );
}

function FormatBars({ formatPerf }) {
  const entries = Object.entries(formatPerf || {}).sort((a, b) => {
    const scoreA = typeof a[1] === 'object' ? a[1].avg_score : a[1];
    const scoreB = typeof b[1] === 'object' ? b[1].avg_score : b[1];
    return scoreB - scoreA;
  });
  if (!entries.length) return null;
  const topScore = typeof entries[0]?.[1] === 'object' ? entries[0][1].avg_score : entries[0]?.[1] || 1;
  const labels = { broetry: 'Broetry', one_liner: 'One-Liner', narrative: 'Narrative', question: 'Question', mini_list: 'Mini-List', mixed: 'Mixed', thread: 'Thread' };

  return (
    <div className="space-y-3">
      {entries.map(([format, data]) => {
        const score = typeof data === 'object' ? data.avg_score : data;
        const count = typeof data === 'object' ? data.count : null;
        const mult = typeof data === 'object' ? data.multiplier : null;
        return (
          <div key={format}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-700">{labels[format] || format}</span>
              <div className="flex items-center gap-2">
                {mult && <span className={`text-[10px] font-medium ${mult >= 1.2 ? 'text-emerald-600' : mult <= 0.7 ? 'text-red-500' : 'text-gray-400'}`}>{mult}x</span>}
                {count && <span className="text-[10px] text-gray-400">{count} posts</span>}
              </div>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${score >= topScore * 0.95 ? 'bg-emerald-500' : 'bg-gray-300'}`}
                style={{ width: `${(score / topScore) * 100}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AutopilotStatus({ profile, scheduledCount, nextPostTime }) {
  const [countdown, setCountdown] = useState('');
  useEffect(() => {
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
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
            <IconZap className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Autopilot Engine</h3>
        </div>
        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${profile?.autopilot_enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
          {profile?.autopilot_enabled ? 'ACTIVE' : 'PAUSED'}
        </span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Posts per day</span>
          <span className="font-medium text-gray-900">{profile?.autopilot_posts_per_day || 2}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Queued posts</span>
          <span className="font-medium text-gray-900">{scheduledCount}</span>
        </div>
        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-gray-500">Next engine cycle:</span>
            <span className="font-mono font-medium text-gray-700">{countdown}</span>
          </div>
          {nextPostTime && (
            <div className="flex items-center gap-2 text-xs mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-gray-500">Next publish:</span>
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
  const [linkClicks, setLinkClicks] = useState([]);
  const [period, setPeriod] = useState('30d');
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, postsRes, insightsRes, clicksRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('posts').select('*').eq('user_id', user.id).order('posted_at', { ascending: false }),
      supabase.from('content_insights').select('*').eq('user_id', user.id).single(),
      supabase.from('link_clicks').select('*, posts(hook_content, content, impressions_count, posted_at)').eq('user_id', user.id).order('click_count', { ascending: false }).limit(20),
    ]);

    setProfile(profileRes.data);
    setPosts(postsRes.data || []);
    setInsights(insightsRes.data);
    setLinkClicks(clicksRes.data || []);
    setLoading(false);
  };

  const computed = useMemo(() => {
    const now = new Date();
    const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date(now.getTime() - periodDays * 86400000);
    const prevCutoff = new Date(cutoff.getTime() - periodDays * 86400000);

    const posted = posts.filter(p => p.status === 'posted' && p.posted_at);
    const inPeriod = posted.filter(p => new Date(p.posted_at) >= cutoff);
    const inPrev = posted.filter(p => new Date(p.posted_at) >= prevCutoff && new Date(p.posted_at) < cutoff);

    const sum = (arr, key) => arr.reduce((s, p) => s + (p[key] || 0), 0);
    const pctChange = (curr, prev) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;

    const totalImpressions = sum(inPeriod, 'impressions_count');
    const totalLikes = sum(inPeriod, 'likes_count');
    const totalReplies = sum(inPeriod, 'replies_count');
    const totalClicks = sum(inPeriod, 'clicks_count');
    const totalBookmarks = sum(inPeriod, 'bookmarks_count');

    // Value calculations
    const hoursSaved = Math.round(inPeriod.length * 0.5 * 10) / 10;
    const dollarValue = Math.round(hoursSaved * 50);
    const costPerClick = totalClicks > 0 ? Math.round((2900 / totalClicks)) / 100 : null;

    // Day-of-week
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = DAYS.map((name, i) => {
      const dayPosts = inPeriod.filter(p => new Date(p.posted_at).getDay() === i);
      const avgEng = dayPosts.length > 0 ? Math.round(dayPosts.reduce((s, p) => s + (p.engagement_score || 0), 0) / dayPosts.length) : 0;
      return { label: name, short: name.slice(0, 2), value: avgEng };
    });

    // Hour perf
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

    const topPosts = [...inPeriod].filter(p => p.engagement_score > 0).sort((a, b) => b.engagement_score - a.engagement_score).slice(0, 8);
    const scheduled = posts.filter(p => p.status === 'scheduled');
    const nextPost = scheduled.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))[0];

    return {
      totalPosts: inPeriod.length, totalPosted: posted.length,
      totalImpressions, totalLikes, totalReplies, totalClicks, totalBookmarks,
      impressionsChange: pctChange(totalImpressions, sum(inPrev, 'impressions_count')),
      likesChange: pctChange(totalLikes, sum(inPrev, 'likes_count')),
      repliesChange: pctChange(totalReplies, sum(inPrev, 'replies_count')),
      clicksChange: pctChange(totalClicks, sum(inPrev, 'clicks_count')),
      hoursSaved, dollarValue, costPerClick,
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Insights</h1>
            <p className="text-sm text-gray-500 mt-1">Performance tracking &amp; content intelligence</p>
          </div>
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            {[{ value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' }].map(opt => (
              <button key={opt.value} onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${period === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* VALUE HERO BANNER */}
        {computed.totalPosts > 0 && (
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 lg:p-8 mb-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative">
              <p className="text-sm text-gray-400 font-medium mb-4">{computed.totalPosts} posts published this period</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
                <div>
                  <div className="text-2xl lg:text-3xl font-bold">
                    {computed.totalImpressions > 0 ? computed.totalImpressions.toLocaleString() : <span className="text-gray-500">⏳</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {computed.totalImpressions > 0 ? 'Impressions' : 'Metrics arriving'}
                  </div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-bold">{computed.totalReplies > 0 ? computed.totalReplies.toLocaleString() : '—'}</div>
                  <div className="text-xs text-gray-400 mt-1">Replies</div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-bold text-amber-400">{computed.totalClicks > 0 ? computed.totalClicks.toLocaleString() : '—'}</div>
                  <div className="text-xs text-gray-400 mt-1">Clicks to your site</div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-bold text-emerald-400">~{computed.hoursSaved}h</div>
                  <div className="text-xs text-gray-400 mt-1">Effort saved</div>
                </div>
              </div>
              {computed.totalImpressions === 0 && computed.totalPosts > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-400">💡 Metrics update every 6 hours. New posts may take time to register engagement.</p>
                </div>
              )}
              {computed.costPerClick !== null && computed.totalClicks > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-300">
                    That's <span className="text-white font-semibold">${computed.costPerClick}/click</span> — Google Ads charges <span className="text-white font-semibold">$1-5</span> for dev audiences.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <MetricCard label="Total Posts" value={computed.totalPosts} icon={IconBarChart} iconBg="bg-blue-50" iconColor="text-blue-600" />
          <MetricCard label="Impressions" value={computed.totalImpressions.toLocaleString()} icon={IconEye} change={computed.impressionsChange} iconBg="bg-violet-50" iconColor="text-violet-600" />
          <MetricCard label="Likes" value={computed.totalLikes.toLocaleString()} icon={IconHeart} change={computed.likesChange} iconBg="bg-pink-50" iconColor="text-pink-600" />
          <MetricCard label="Replies" value={computed.totalReplies.toLocaleString()} icon={IconMessage} change={computed.repliesChange} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <MetricCard label="Link Clicks" value={computed.totalClicks.toLocaleString()} icon={IconMouse} change={computed.clicksChange} iconBg="bg-amber-50" iconColor="text-amber-600" highlight />
          <MetricCard label="Bookmarks" value={computed.totalBookmarks.toLocaleString()} icon={IconBookmark} iconBg="bg-gray-100" iconColor="text-gray-600" />
        </div>

        {/* Two-column layout */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Left 2/3 — Charts + Top Posts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Day-of-week */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Engagement by Day</h3>
              <p className="text-[10px] text-gray-400 mb-4">Average engagement score per day of week</p>
              <DayBarChart data={computed.dayData} />
            </div>

            {/* Hour heatmap */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Best Posting Times</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Engagement heatmap by hour — darker = better</p>
                </div>
                {insights?.best_posting_hour !== undefined && (
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Peak: {insights.best_posting_hour}:00</span>
                )}
              </div>
              <HourHeatmap hourData={computed.hourAvg} />
            </div>

            {/* Click Attribution Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <IconLink className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Click Attribution</h3>
                    <p className="text-[10px] text-gray-400">UTM-tracked clicks from your Distributo posts</p>
                  </div>
                </div>
              </div>
              <div className="p-5">
                {linkClicks.filter(l => l.click_count > 0).length === 0 ? (
                  <div className="text-center py-6">
                    <IconMouse className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No clicks tracked yet</p>
                    <p className="text-xs text-gray-400 mt-1">Clicks appear here as your posts drive traffic to your product</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Post</th>
                          <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Clicks</th>
                          <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Impressions</th>
                          <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">CTR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {linkClicks.filter(l => l.click_count > 0).slice(0, 10).map(link => {
                          const post = link.posts;
                          const hook = (post?.hook_content || post?.content || '').split('\n')[0].slice(0, 60);
                          const impr = post?.impressions_count || 0;
                          const ctr = impr > 0 ? ((link.click_count / impr) * 100).toFixed(1) : '—';
                          return (
                            <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 pr-4">
                                <p className="text-sm text-gray-700 truncate max-w-[280px]">{hook || 'Untitled post'}</p>
                                {post?.posted_at && <p className="text-[10px] text-gray-400 mt-0.5">{new Date(post.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>}
                              </td>
                              <td className="py-3 text-right text-sm font-semibold text-amber-600 tabular-nums">{link.click_count}</td>
                              <td className="py-3 text-right text-sm text-gray-600 tabular-nums">{impr.toLocaleString()}</td>
                              <td className="py-3 text-right text-sm text-gray-600 tabular-nums">{ctr}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
                {profile?.product_url && (
                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">Tracking to:</span>
                    <span className="text-xs text-gray-600 truncate">{profile.product_url}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Top Posts */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Top Performing Posts</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Ranked by Distributo Score (clicks × 20 + retweets × 10 + replies × 5 + bookmarks × 15 + likes)</p>
              </div>
              <div className="p-5">
                {computed.topPosts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No posts with engagement data yet</p>
                ) : (
                  <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                      <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">#</th>
                      <th className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Hook</th>
                      <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Impr</th>
                      <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Likes</th>
                      <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3">Clicks</th>
                      <th className="text-right text-[10px] font-medium text-gray-400 uppercase tracking-wider pb-3 pr-1">Score</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {computed.topPosts.map((post, i) => (
                        <tr key={post.id} className="hover:bg-gray-50">
                          <td className="py-3 pl-1"><span className={`inline-flex w-5 h-5 rounded items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span></td>
                          <td className="py-3 pr-4"><p className="text-sm text-gray-700 truncate max-w-[260px]">{(post.hook_content || post.content || '').split('\n')[0]}</p></td>
                          <td className="py-3 text-right text-sm text-gray-600 tabular-nums">{(post.impressions_count || 0).toLocaleString()}</td>
                          <td className="py-3 text-right text-sm text-gray-600 tabular-nums">{post.likes_count || 0}</td>
                          <td className="py-3 text-right text-sm text-gray-600 tabular-nums">{post.clicks_count || 0}</td>
                          <td className="py-3 pr-1 text-right"><span className="text-xs font-semibold text-emerald-600">{Math.round(post.engagement_score || 0)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right 1/3 — Intelligence + Autopilot */}
          <div className="space-y-6">
            {/* What Your AI Changed */}
            {insights && insights.format_performance && (() => {
              const fp = insights.format_performance;
              const entries = Object.entries(fp).filter(([, v]) => {
                const mult = typeof v === 'object' ? v.multiplier : null;
                return mult && mult >= 1.15;
              }).sort((a, b) => {
                const mA = typeof a[1] === 'object' ? a[1].multiplier : 0;
                const mB = typeof b[1] === 'object' ? b[1].multiplier : 0;
                return mB - mA;
              });
              const labels = { broetry: 'Broetry', one_liner: 'One-liners', narrative: 'Narratives', question: 'Questions', mini_list: 'Mini-lists' };
              if (entries.length === 0) return null;
              return (
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">🧠</span>
                    <h3 className="text-sm font-semibold text-violet-900">What Your AI Changed This Period</h3>
                  </div>
                  <div className="space-y-2">
                    {entries.slice(0, 3).map(([format, data]) => {
                      const mult = typeof data === 'object' ? data.multiplier : 1;
                      return (
                        <p key={format} className="text-xs text-violet-700">
                          • <span className="font-medium">{labels[format] || format}</span> performs {mult}× better
                        </p>
                      );
                    })}
                    {insights.best_posting_hour !== undefined && (
                      <p className="text-xs text-violet-700">
                        • Posting at <span className="font-medium">{insights.best_posting_hour}:00</span> outperforms other times
                      </p>
                    )}
                    <p className="text-xs text-violet-600 mt-2 pt-2 border-t border-violet-200">
                      → Autopilot adjusted future content mix accordingly
                    </p>
                  </div>
                </div>
              );
            })()}
            {/* Content Intelligence */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                    <IconBrain className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Content Intelligence</h3>
                    <p className="text-[10px] text-gray-400">{insights ? `${insights.posts_analyzed} posts analyzed` : 'Learning your audience...'}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {!insights ? (
                  <div className="text-center py-4">
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                      <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (computed.totalPosted / 5) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-500">Need <span className="font-semibold">{Math.max(0, 5 - computed.totalPosted)}</span> more posts to start learning</p>
                    <p className="text-[10px] text-gray-400 mt-1">AI patterns unlock after 5 posts with engagement data</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Best Format</span>
                      <p className="text-sm font-medium text-gray-900 mt-1">{insights.best_format?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Mixed'}</p>
                    </div>

                    {insights.format_performance && (
                      <div>
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Format Performance</span>
                        <div className="mt-2"><FormatBars formatPerf={insights.format_performance} /></div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Optimal Timing</span>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][insights.best_posting_day || 0]}s</span> at <span className="font-medium">{insights.best_posting_hour}:00</span>
                      </p>
                    </div>

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

                    <div className="pt-3 border-t border-gray-100 bg-violet-50/50 -mx-5 -mb-5 px-5 py-4 rounded-b-2xl">
                      <div className="flex items-start gap-2">
                        <IconTarget className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-violet-700">Your content DNA is building</p>
                          <p className="text-[10px] text-violet-500 mt-0.5">
                            {insights.posts_analyzed} data points shaping your AI strategy. This data can't be recreated elsewhere — it's yours.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Autopilot Status */}
            <AutopilotStatus profile={profile} scheduledCount={computed.scheduledCount} nextPostTime={computed.nextPostTime} />
          </div>
        </div>
      </div>
    </div>
  );
}
