"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AnalyticsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({ views: 0, engagement: 0, videosPosted: 0, videosReady: 0, topHook: null });
  const [hooks, setHooks] = useState([]);
  const [hasPostedVideos, setHasPostedVideos] = useState(false);
  const [platforms, setPlatforms] = useState({ tiktok: false, instagram: false });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: videos } = await supabase.from("videos").select("*");
    const { data: hookData } = await supabase.from("hooks").select("*");
    const { data: connections } = await supabase.from("platform_connections").select("platform").eq("user_id", user.id);

    if (connections) {
      setPlatforms({ tiktok: connections.some(c => c.platform === 'tiktok'), instagram: connections.some(c => c.platform === 'instagram') });
    }

    const postedVideos = videos?.filter(v => v.posted_at) || [];
    const readyVideos = videos?.filter(v => v.status === 'ready') || [];
    
    setHasPostedVideos(postedVideos.length > 0);

    const totalViews = postedVideos.reduce((sum, v) => sum + (v.views || 0), 0);
    const avgEngagement = postedVideos.length > 0 ? postedVideos.reduce((sum, v) => sum + (v.engagement_rate || 0), 0) / postedVideos.length : 0;

    const hookStats = {};
    hookData?.forEach(h => {
      if (!hookStats[h.hook_type]) hookStats[h.hook_type] = { count: 0, totalScore: 0 };
      hookStats[h.hook_type].count++;
      hookStats[h.hook_type].totalScore += h.predicted_score || 0;
    });

    const sortedHooks = Object.entries(hookStats)
      .map(([type, data]) => ({ type, count: data.count, avgScore: data.totalScore / data.count }))
      .sort((a, b) => b.avgScore - a.avgScore);

    setStats({
      views: totalViews,
      engagement: avgEngagement.toFixed(1),
      videosPosted: postedVideos.length,
      videosReady: readyVideos.length,
      topHook: postedVideos.length > 0 ? sortedHooks[0]?.type : null,
    });
    setHooks(sortedHooks);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const hasNoPlatforms = !platforms.tiktok && !platforms.instagram;

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Analytics</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Your content gets smarter every week. Here's what the data shows.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <StatCard label="Total Views" value={hasPostedVideos ? stats.views.toLocaleString() : null} noData={!hasPostedVideos} />
        <StatCard label="Avg Engagement" value={hasPostedVideos ? `${stats.engagement}%` : null} noData={!hasPostedVideos} />
        <StatCard label="Videos Posted" value={stats.videosPosted} />
        <StatCard label="Top Hook Type" value={stats.topHook?.replace('-', ' ')} noData={!stats.topHook} capitalize />
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        {['overview', 'hook-performance', 'winners', 'ai-insights'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #7c3aed' : '2px solid transparent', color: activeTab === tab ? '#7c3aed' : '#6b7280', fontSize: '14px', fontWeight: '500', cursor: 'pointer', marginBottom: '-1px' }}>
            {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div>
          {hasPostedVideos ? (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: '#6b7280' }}>Performance chart will appear here</p>
            </div>
          ) : (
            <div>
              <EmptyState hasNoPlatforms={hasNoPlatforms} title="No performance data yet" description="Post videos to TikTok or Instagram to start tracking views, engagement, and what hooks perform best." />
              <PreviewSection />
            </div>
          )}
        </div>
      )}

      {activeTab === 'hook-performance' && (
        <div>
          {hooks.length > 0 ? (
            <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Rank</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Hook Type</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Videos</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Avg Score</th>
                    <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {hooks.map((hook, i) => (
                    <tr key={hook.type} style={{ borderBottom: i < hooks.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <span style={{ width: '24px', height: '24px', background: i < 3 ? '#7c3aed' : '#e5e7eb', color: i < 3 ? 'white' : '#6b7280', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' }}>{i + 1}</span>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', fontWeight: '500', color: '#111827', textTransform: 'capitalize' }}>{hook.type.replace('-', ' ')}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#6b7280' }}>{hook.count}</td>
                      <td style={{ padding: '14px 20px', fontSize: '14px', color: '#111827', fontWeight: '500' }}>{(hook.avgScore * 100).toFixed(0)}%</td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ width: '100px', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${hook.avgScore * 100}%`, height: '100%', background: '#7c3aed', borderRadius: '3px' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div>
              <EmptyState hasNoPlatforms={hasNoPlatforms} title="No hook data yet" description="Generate videos to see which hook types perform best for your audience." icon="hooks" />
              <PreviewSection />
            </div>
          )}
        </div>
      )}

      {activeTab === 'winners' && (
        <div>
          <EmptyState hasNoPlatforms={hasNoPlatforms} title="No winners detected yet" description="Videos with engagement above average will appear here. Keep posting to find your winning content." icon="trophy" />
          <PreviewSection />
        </div>
      )}

      {activeTab === 'ai-insights' && (
        <div>
          <EmptyState hasNoPlatforms={hasNoPlatforms} title="AI insights coming soon" description="Once you have enough performance data, we'll generate weekly reports with recommendations on what to double down on." icon="sparkles" />
          <PreviewSection />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, noData, capitalize }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px', minHeight: '88px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {noData || value === null || value === undefined ? (
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>No data yet</p>
      ) : (
        <p style={{ fontSize: '24px', fontWeight: '600', color: '#111827', textTransform: capitalize ? 'capitalize' : 'none' }}>{value}</p>
      )}
      <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{label}</p>
    </div>
  );
}

function EmptyState({ hasNoPlatforms, title, description, icon = 'chart' }) {
  const icons = {
    chart: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>,
    hooks: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    trophy: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
    sparkles: <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>,
  };

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
      <div style={{ width: '64px', height: '64px', background: '#f5f3ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#7c3aed' }}>
        {icons[icon]}
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', maxWidth: '360px', margin: '0 auto 20px' }}>{description}</p>
      {hasNoPlatforms && (
        <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#7c3aed', color: 'white', fontSize: '14px', fontWeight: '500', borderRadius: '8px', textDecoration: 'none' }}>
          Connect TikTok or Instagram
        </Link>
      )}
    </div>
  );
}

function PreviewSection() {
  return (
    <div style={{ marginTop: '24px', padding: '24px', background: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280', marginBottom: '16px' }}>What you'll see when you start posting:</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <PreviewCard title="Views Over Time" desc="Track daily and weekly view trends" icon="line" />
        <PreviewCard title="Top Performing Hooks" desc="See which hooks get the most engagement" icon="bar" />
        <PreviewCard title="Winner Detection" desc="Auto-identify videos to scale" icon="trophy" />
      </div>
    </div>
  );
}

function PreviewCard({ title, desc, icon }) {
  const chartPreview = {
    line: (
      <svg width="100%" height="50" viewBox="0 0 100 50" preserveAspectRatio="none">
        <polyline points="0,40 20,35 40,25 60,30 80,15 100,10" fill="none" stroke="#d1d5db" strokeWidth="2"/>
      </svg>
    ),
    bar: (
      <svg width="100%" height="50" viewBox="0 0 100 50">
        <rect x="5" y="25" width="12" height="25" fill="#e5e7eb" rx="2"/>
        <rect x="25" y="15" width="12" height="35" fill="#e5e7eb" rx="2"/>
        <rect x="45" y="10" width="12" height="40" fill="#e5e7eb" rx="2"/>
        <rect x="65" y="20" width="12" height="30" fill="#e5e7eb" rx="2"/>
        <rect x="85" y="30" width="12" height="20" fill="#e5e7eb" rx="2"/>
      </svg>
    ),
    trophy: (
      <div style={{ height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
        </svg>
      </div>
    ),
  };

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
      <div style={{ marginBottom: '12px' }}>
        {chartPreview[icon]}
      </div>
      <p style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>{title}</p>
      <p style={{ fontSize: '12px', color: '#9ca3af' }}>{desc}</p>
    </div>
  );
}
