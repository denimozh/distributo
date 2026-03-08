"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function DashboardHome() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState([]);
  const [platforms, setPlatforms] = useState({ tiktok: null, instagram: null });
  const [stats, setStats] = useState({ totalVideos: 0, videosThisWeek: 0, totalViews: 0, generatingCount: 0 });
  const [activities, setActivities] = useState([]);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: campaigns } = await supabase
      .from("campaigns")
      .select(`*, videos(*), avatars(*), hooks(*)`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setStrategies(campaigns || []);

    const { data: connections } = await supabase
      .from("platform_connections")
      .select("platform, username")
      .eq("user_id", user.id);

    if (connections) {
      setPlatforms({
        tiktok: connections.find(c => c.platform === 'tiktok') || null,
        instagram: connections.find(c => c.platform === 'instagram') || null,
      });
    }

    const allVideos = campaigns?.flatMap(c => c.videos || []) || [];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    setStats({
      totalVideos: allVideos.filter(v => v.status === 'ready').length,
      videosThisWeek: allVideos.filter(v => new Date(v.created_at) > weekAgo && v.status === 'ready').length,
      totalViews: allVideos.reduce((sum, v) => sum + (v.views || 0), 0),
      generatingCount: allVideos.filter(v => v.status === 'generating' || v.status === 'pending').length,
    });

    // Build activity feed from recent events
    const recentActivities = [];
    campaigns?.forEach(c => {
      if (c.status === 'generating') {
        recentActivities.push({ type: 'generating', message: `Generating videos for ${c.product_name}`, time: c.created_at });
      }
      c.videos?.forEach(v => {
        if (v.status === 'ready') {
          recentActivities.push({ type: 'video_ready', message: `Video ready: ${v.hook_type || 'New video'}`, time: v.created_at });
        }
        if (v.posted_at) {
          recentActivities.push({ type: 'posted', message: `Posted to ${v.platform}`, time: v.posted_at });
        }
      });
    });
    setActivities(recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5));

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '48px' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const hasNoPlatforms = !platforms.tiktok && !platforms.instagram;
  const hasNoStrategies = strategies.length === 0;

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Your content automation at a glance</p>
      </div>

      {/* Platform Connection Alert - Purple button instead of amber */}
      {hasNoPlatforms && (
        <div style={{ 
          background: '#f5f3ff', 
          border: '1px solid #ddd6fe', 
          borderRadius: '12px', 
          padding: '16px 20px', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#ede9fe', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: '#5b21b6' }}>Connect your platforms to start posting</p>
              <p style={{ fontSize: '13px', color: '#7c3aed' }}>Videos will generate but won't post until you connect TikTok or Instagram</p>
            </div>
          </div>
          <Link href="/dashboard/settings" style={{
            padding: '10px 18px',
            background: '#7c3aed',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
            textDecoration: 'none',
          }}>
            Connect Now
          </Link>
        </div>
      )}

      {/* Stats Row - With icons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <StatCard 
          icon="video" 
          label="Videos Ready" 
          value={stats.totalVideos} 
          subLabel={stats.generatingCount > 0 ? `${stats.generatingCount} generating` : null}
        />
        <StatCard 
          icon="trending" 
          label="This Week" 
          value={stats.videosThisWeek} 
        />
        <StatCard 
          icon="eye" 
          label="Total Views" 
          value={stats.totalViews > 0 ? stats.totalViews.toLocaleString() : "0"} 
        />
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px' }}>
        {/* Left Column - Strategies */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827' }}>Active Strategies</h2>
            {strategies.length > 0 && (
              <Link href="/dashboard/videos" style={{ fontSize: '13px', color: '#7c3aed', textDecoration: 'none', fontWeight: '500' }}>
                View all
              </Link>
            )}
          </div>

          {hasNoStrategies ? (
            <EmptyStrategyCard />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {strategies.map((strategy) => (
                <StrategyCard key={strategy.id} strategy={strategy} platforms={platforms} />
              ))}
            </div>
          )}
        </div>

        {/* Right Column - System Status + Activity */}
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>System Status</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <PlatformCard name="TikTok" connected={platforms.tiktok} username={platforms.tiktok?.username} />
            <PlatformCard name="Instagram" connected={platforms.instagram} username={platforms.instagram?.username} />
          </div>

          {/* Next Scheduled Post */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '12px' }}>Next Scheduled Post</p>
            {hasNoPlatforms ? (
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>No posts scheduled yet</p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>Connect a platform above to enable auto-posting</p>
              </div>
            ) : hasNoStrategies ? (
              <p style={{ fontSize: '14px', color: '#6b7280' }}>Create a strategy to schedule posts</p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '48px', height: '64px', background: '#f3f4f6', borderRadius: '6px' }} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Tomorrow at 9:00 AM</p>
                  <p style={{ fontSize: '13px', color: '#6b7280' }}>TikTok</p>
                </div>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', marginBottom: '12px' }}>Recent Activity</p>
            {activities.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9ca3af' }}>No activity yet. Create a strategy to get started.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activities.map((activity, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                      background: activity.type === 'generating' ? '#f59e0b' : activity.type === 'posted' ? '#10b981' : '#7c3aed' 
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.message}</p>
                      <p style={{ fontSize: '11px', color: '#9ca3af' }}>{formatTimeAgo(activity.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

function StatCard({ icon, label, value, subLabel }) {
  const icons = {
    video: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5"><rect x="2" y="4" width="16" height="14" rx="2"/><polygon points="22 7 22 17 17 12 22 7"/></svg>,
    trending: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    eye: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  };

  const colors = { video: '#f5f3ff', trending: '#ecfdf5', eye: '#eff6ff' };

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ width: '44px', height: '44px', background: colors[icon], borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icons[icon]}
        </div>
        <div>
          <p style={{ fontSize: '26px', fontWeight: '600', color: '#111827', lineHeight: 1 }}>{value}</p>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>{label}</p>
          {subLabel && <p style={{ fontSize: '11px', color: '#7c3aed', marginTop: '2px' }}>{subLabel}</p>}
        </div>
      </div>
    </div>
  );
}

function EmptyStrategyCard() {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
      <div style={{ width: '56px', height: '56px', background: '#f5f3ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>Create your first content strategy</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px', maxWidth: '300px', margin: '0 auto 20px' }}>
        Add your product, pick an avatar, and we'll generate scroll-stopping videos automatically
      </p>
      <Link href="/dashboard/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#7c3aed', color: 'white', fontSize: '14px', fontWeight: '600', borderRadius: '10px', textDecoration: 'none' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        New Strategy
      </Link>
    </div>
  );
}

function StrategyCard({ strategy, platforms }) {
  const videos = strategy.videos || [];
  const hooks = strategy.hooks || [];
  const readyVideos = videos.filter(v => v.status === 'ready');
  const generatingVideos = videos.filter(v => v.status === 'generating' || v.status === 'pending');
  const isGenerating = strategy.status === 'generating' || generatingVideos.length > 0;
  const totalVideos = strategy.total_videos || 5;
  
  // Get unique hook types (up to 3)
  const hookTypes = [...new Set(hooks.map(h => h.hook_type))].slice(0, 3);
  
  // Calculate actual progress - hooks generated = step 1 done, then videos
  const getProgress = () => {
    if (hooks.length === 0) return { step: 1, progress: 0, label: 'Writing hooks...' };
    // Hooks done, now generating videos
    const videoProgress = readyVideos.length / totalVideos;
    const currentVideo = readyVideos.length + 1;
    return { 
      step: 2, 
      progress: videoProgress, 
      label: `Generating video ${Math.min(currentVideo, totalVideos)} of ${totalVideos}...` 
    };
  };
  
  const progressInfo = isGenerating ? getProgress() : null;

  return (
    <Link href={`/dashboard/videos/${strategy.id}`} style={{ display: 'block', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', textDecoration: 'none' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '10px', background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
          {strategy.avatars?.image_url && <img src={strategy.avatars.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{strategy.name || `${strategy.product_name} Campaign`}</h3>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>{strategy.product_name}</p>
            </div>
            {isGenerating ? (
              <span style={{ padding: '4px 10px', background: '#fef3c7', color: '#b45309', fontSize: '12px', fontWeight: '500', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', background: '#f59e0b', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                Generating
              </span>
            ) : (
              <span style={{ padding: '4px 10px', background: '#ecfdf5', color: '#059669', fontSize: '12px', fontWeight: '500', borderRadius: '6px' }}>Active</span>
            )}
          </div>

          {/* Hook types or mixed label */}
          {hookTypes.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {hookTypes.length <= 2 ? (
                hookTypes.map(type => (
                  <span key={type} style={{ padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', fontSize: '11px', borderRadius: '4px', textTransform: 'capitalize' }}>
                    {type.replace('-', ' ')}
                  </span>
                ))
              ) : (
                <span style={{ padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', fontSize: '11px', borderRadius: '4px' }}>
                  {totalVideos} {totalVideos === 1 ? 'video' : 'videos'} - Mixed hooks
                </span>
              )}
            </div>
          )}

          {/* Progress - FIXED: bar matches text */}
          {isGenerating ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ flex: 1, height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.max(progressInfo.progress * 100, hooks.length > 0 ? 20 : 5)}%`, 
                    height: '100%', 
                    background: '#7c3aed', 
                    transition: 'width 0.3s' 
                  }} />
                </div>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                  {readyVideos.length}/{totalVideos}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#6b7280' }}>{progressInfo.label}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', color: '#6b7280' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="16" height="14" rx="2"/><polygon points="22 7 22 17 17 12 22 7"/></svg>
                {readyVideos.length} videos ready
              </span>
              {(platforms.tiktok || platforms.instagram) && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Next: Tomorrow 9am
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </Link>
  );
}

function PlatformCard({ name, connected, username }) {
  const icon = name === 'TikTok' ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#111827"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1.5" fill="#111827"/></svg>
  );

  const handleConnect = () => { window.location.href = `/api/auth/${name.toLowerCase()}`; };

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{name}</p>
          <p style={{ fontSize: '12px', color: connected ? '#059669' : '#9ca3af' }}>{connected ? `@${username || 'connected'}` : 'Not connected'}</p>
        </div>
      </div>
      {connected ? (
        <span style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }} />
      ) : (
        <button onClick={handleConnect} style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', fontSize: '13px', fontWeight: '500', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Connect</button>
      )}
    </div>
  );
}
