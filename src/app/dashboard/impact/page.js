"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export default function ImpactPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalClicks: 0, totalImpressions: 0, totalReplies: 0, totalLikes: 0, postsCount: 0 });
  const [topPosts, setTopPosts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [period, setPeriod] = useState('week');

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => { loadData(); }, [period]);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const periodStart = new Date();
    if (period === 'week') periodStart.setDate(periodStart.getDate() - 7);
    else if (period === 'month') periodStart.setDate(periodStart.getDate() - 30);
    else periodStart.setFullYear(2020);

    let totalClicks = 0;
    try {
      const { data: clicks } = await supabase.from('link_clicks').select('click_count')
        .eq('user_id', user.id).gte('created_at', periodStart.toISOString());
      totalClicks = (clicks || []).reduce((s, c) => s + (c.click_count || 0), 0);
    } catch {}

    let totalImpressions = 0, totalReplies = 0, totalLikes = 0;
    const { data: postedPosts } = await supabase
      .from('posts')
      .select('id, content, hook_content, platform, posted_at, impressions_count, likes_count, replies_count, engagement_score, clicks_count, metadata')
      .eq('user_id', user.id).eq('status', 'posted')
      .gte('posted_at', periodStart.toISOString())
      .order('engagement_score', { ascending: false });

    if (postedPosts?.length) {
      totalImpressions = postedPosts.reduce((s, p) => s + (p.impressions_count || 0), 0);
      totalReplies = postedPosts.reduce((s, p) => s + (p.replies_count || 0), 0);
      totalLikes = postedPosts.reduce((s, p) => s + (p.likes_count || 0), 0);
      setTopPosts(postedPosts.filter(p => (p.engagement_score || 0) > 0).slice(0, 5));
    }

    try {
      const { data: insightsData } = await supabase.from('content_insights').select('*').eq('user_id', user.id).single();
      setInsights(insightsData);
    } catch {}

    setStats({ totalClicks, totalImpressions, totalReplies, totalLikes, postsCount: postedPosts?.length || 0 });
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>;
  }

  const hasData = stats.postsCount > 0;
  const hasInsights = insights && insights.posts_analyzed >= 5;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Impact</h1>
            <p className="text-sm text-gray-500 mt-1">Is your ghostwriter earning its keep?</p>
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {['week', 'month', 'all'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  period === p ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {p === 'all' ? 'All Time' : p === 'week' ? '7 Days' : '30 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard label="Clicks to Site" value={stats.totalClicks} accent="emerald" />
          <MetricCard label="Impressions" value={fmtNum(stats.totalImpressions)} accent="blue" />
          <MetricCard label="Replies" value={stats.totalReplies} accent="purple" />
          <MetricCard label="Posts Published" value={stats.postsCount} accent="gray" />
        </div>

        {/* No data state */}
        {!hasData && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No impact data yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Impact metrics appear once your ghostwriter starts posting and tracking performance. Generate your first batch to get started.
            </p>
          </div>
        )}

        {hasData && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Content Intelligence Card */}
              {hasInsights && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Content Intelligence</h3>
                        <p className="text-xs text-gray-500">{insights.posts_analyzed} posts analyzed</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      <InsightPill label="Best format" value={insights.best_format || '—'} />
                      <InsightPill label="Best time" value={insights.best_posting_hour != null ? `${insights.best_posting_hour}:00` : '—'} />
                      <InsightPill label="Best day" value={insights.best_posting_day != null ? dayNames[insights.best_posting_day] : '—'} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      <InsightPill label="Avg impressions" value={fmtNum(insights.avg_impressions || 0)} />
                      <InsightPill label="Avg replies" value={(insights.avg_replies || 0).toFixed(1)} />
                      <InsightPill label="Avg likes" value={(insights.avg_likes || 0).toFixed(1)} />
                    </div>

                    {/* Format Performance Bars */}
                    {insights.format_performance && Object.keys(insights.format_performance).length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Format Performance</p>
                        <div className="space-y-2.5">
                          {Object.entries(insights.format_performance)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([format, score]) => {
                              const maxScore = Math.max(...Object.values(insights.format_performance));
                              const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
                              return (
                                <div key={format} className="flex items-center gap-3">
                                  <span className="text-xs text-gray-600 w-20 truncate capitalize">{format.replace('_', ' ')}</span>
                                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-500 tabular-nums w-10 text-right">{score.toFixed(0)}</span>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Top Hooks */}
                    {insights.top_hook_patterns?.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Top Performing Hooks</p>
                        <div className="space-y-2">
                          {insights.top_hook_patterns.slice(0, 3).map((h, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <span className="text-xs font-bold text-amber-600 mt-0.5">{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate">{h.hook}</p>
                                <p className="text-[11px] text-gray-400">Score: {h.score}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Intelligence not ready */}
              {!hasInsights && hasData && (
                <div className="bg-white rounded-2xl border border-dashed border-amber-200 p-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">Content Intelligence building...</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        After 5+ posts with engagement data, your AI learns what works for your audience — best formats, best times, top hook patterns.
                        This intelligence feeds back into content generation automatically.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Top Performing Posts */}
              {topPosts.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Top Performing Posts</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {topPosts.map((post, i) => (
                      <div key={post.id} className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{post.hook_content || post.content}</p>
                            <div className="flex items-center gap-4 mt-2.5">
                              {(post.impressions_count || 0) > 0 && (
                                <span className="text-xs text-gray-400">{fmtNum(post.impressions_count)} views</span>
                              )}
                              {(post.replies_count || 0) > 0 && (
                                <span className="text-xs text-gray-400">{post.replies_count} replies</span>
                              )}
                              {(post.likes_count || 0) > 0 && (
                                <span className="text-xs text-gray-400">{post.likes_count} likes</span>
                              )}
                              {(post.clicks_count || 0) > 0 && (
                                <span className="text-xs text-emerald-600 font-medium">{post.clicks_count} clicks</span>
                              )}
                              <span className="text-xs text-gray-300">Score: {Math.round(post.engagement_score)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column: quick stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Engagement Summary</h3>
                <div className="space-y-4">
                  <SummaryRow label="Total Likes" value={fmtNum(stats.totalLikes)} />
                  <SummaryRow label="Engagement Rate" value={stats.totalImpressions > 0 ? `${((stats.totalReplies + stats.totalLikes) / stats.totalImpressions * 100).toFixed(1)}%` : '—'} />
                  <SummaryRow label="Clicks / Post" value={stats.postsCount > 0 ? (stats.totalClicks / stats.postsCount).toFixed(1) : '—'} />
                  <SummaryRow label="Replies / Post" value={stats.postsCount > 0 ? (stats.totalReplies / stats.postsCount).toFixed(1) : '—'} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
                <h3 className="text-sm font-semibold mb-2">Your Content DNA</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {hasInsights
                    ? `Your audience responds ${insights.avg_replies > 1 ? 'strongly' : 'best'} to ${insights.best_format || 'varied'} format posts, especially on ${dayNames[insights.best_posting_day] || 'weekdays'} around ${insights.best_posting_hour || 12}:00. This data shapes every future post.`
                    : 'Keep posting — your Content Intelligence is building. After 5+ posts with metrics, your AI learns exactly what works for your audience.'
                  }
                </p>
                {hasInsights && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">Switching tools = losing this intelligence</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }) {
  const colors = {
    emerald: 'text-emerald-600', blue: 'text-blue-600',
    purple: 'text-purple-600', gray: 'text-gray-900',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className={`text-2xl font-bold ${colors[accent] || 'text-gray-900'} tabular-nums`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function InsightPill({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 text-center">
      <div className="text-sm font-bold text-gray-900 capitalize">{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900 tabular-nums">{value}</span>
    </div>
  );
}

function fmtNum(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}
