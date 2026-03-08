"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function VideoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState(null);
  const [videos, setVideos] = useState([]);
  const [hooks, setHooks] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState("videos");
  const [platforms, setPlatforms] = useState({ tiktok: false, instagram: false });

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load strategy
    const { data: strategyData } = await supabase
      .from("campaigns")
      .select(`*, avatars(*)`)
      .eq("id", params.id)
      .single();

    if (!strategyData) {
      router.push("/dashboard/videos");
      return;
    }
    setStrategy(strategyData);

    // Load videos
    const { data: videoData } = await supabase
      .from("videos")
      .select("*")
      .eq("campaign_id", params.id)
      .order("created_at", { ascending: false });
    setVideos(videoData || []);
    if (videoData?.length > 0) {
      setSelectedVideo(videoData[0]);
    }

    // Load hooks
    const { data: hookData } = await supabase
      .from("hooks")
      .select("*")
      .eq("campaign_id", params.id)
      .order("predicted_score", { ascending: false });
    setHooks(hookData || []);

    // Load platform connections
    const { data: connections } = await supabase
      .from("platform_connections")
      .select("platform")
      .eq("user_id", user.id);
    if (connections) {
      setPlatforms({
        tiktok: connections.some(c => c.platform === 'tiktok'),
        instagram: connections.some(c => c.platform === 'instagram'),
      });
    }

    setLoading(false);
  };

  const handlePostNow = async (platform) => {
    if (!selectedVideo) return;
    // TODO: Implement posting
    alert(`Posting to ${platform}...`);
  };

  const handleDownload = () => {
    if (!selectedVideo?.video_url) return;
    window.open(selectedVideo.video_url, '_blank');
  };

  const handleRegenerate = async () => {
    if (!selectedVideo) return;
    // TODO: Implement regeneration
    alert('Regenerating video...');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const readyVideos = videos.filter(v => v.status === 'ready');
  const generatingVideos = videos.filter(v => v.status === 'generating' || v.status === 'pending');
  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
  const avgEngagement = videos.length > 0 
    ? (videos.reduce((sum, v) => sum + (v.engagement_rate || 0), 0) / videos.length).toFixed(1)
    : 0;

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left Panel - Video List & Stats */}
      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '14px' }}>
          <Link href="/dashboard/videos" style={{ color: '#6b7280', textDecoration: 'none' }}>Videos</Link>
          <span style={{ color: '#d1d5db' }}>/</span>
          <span style={{ color: '#111827', fontWeight: '500' }}>{strategy?.name || strategy?.product_name}</span>
        </div>

        {/* Strategy Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '28px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
            {strategy?.avatars?.image_url && (
              <img src={strategy.avatars.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>
              {strategy?.name || strategy?.product_name}
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>{strategy?.product_name}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          <StatCard label="Total Views" value={totalViews.toLocaleString()} />
          <StatCard label="Engagement" value={`${avgEngagement}%`} />
          <StatCard label="Videos Ready" value={readyVideos.length} />
          <StatCard label="Top Hook" value={hooks[0]?.hook_type?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '—'} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
          {['videos', 'hooks', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #7c3aed' : '2px solid transparent',
                color: activeTab === tab ? '#7c3aed' : '#6b7280',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                textTransform: 'capitalize',
                marginBottom: '-1px',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'videos' && (
          <div>
            {generatingVideos.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '20px', height: '20px', border: '2px solid #f59e0b', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '14px', color: '#92400e' }}>
                  Generating {generatingVideos.length} video{generatingVideos.length > 1 ? 's' : ''}... (~2 min remaining)
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  selected={selectedVideo?.id === video.id}
                  onClick={() => setSelectedVideo(video)}
                />
              ))}
            </div>

            {videos.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <p>No videos generated yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'hooks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {hooks.map((hook, i) => (
              <div key={hook.id} style={{ 
                background: 'white', 
                border: '1px solid #e5e7eb', 
                borderRadius: '10px', 
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <span style={{ 
                  width: '24px', 
                  height: '24px', 
                  background: i < 3 ? '#7c3aed' : '#e5e7eb',
                  color: i < 3 ? 'white' : '#6b7280',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: '#111827', marginBottom: '4px' }}>"{hook.script}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                    <span style={{ padding: '2px 8px', background: '#f3f4f6', borderRadius: '4px' }}>{hook.hook_type}</span>
                    <span>Score: {(hook.predicted_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
            {hooks.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                <p>No hooks generated yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'insights' && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px', textAlign: 'center' }}>
            <svg style={{ margin: '0 auto 12px', color: '#9ca3af' }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Insights will appear after your videos get views</p>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>Post videos to TikTok or Instagram to start collecting data</p>
          </div>
        )}
      </div>

      {/* Right Panel - Video Preview */}
      <div style={{ width: '380px', background: '#111827', padding: '28px', display: 'flex', flexDirection: 'column' }}>
        {selectedVideo ? (
          <>
            {/* Video Player */}
            <div style={{ 
              aspectRatio: '9/16', 
              background: '#000', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              position: 'relative',
              marginBottom: '20px',
            }}>
              {selectedVideo.video_url ? (
                <video
                  src={selectedVideo.video_url}
                  poster={selectedVideo.thumbnail_url}
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : selectedVideo.thumbnail_url ? (
                <img src={selectedVideo.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : strategy?.avatars?.image_url ? (
                <img src={strategy.avatars.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1"><rect x="2" y="4" width="16" height="14" rx="2"/><polygon points="22 7 22 17 17 12 22 7"/></svg>
                </div>
              )}

              {/* Status badge */}
              {selectedVideo.status !== 'ready' && (
                <div style={{ position: 'absolute', top: '12px', left: '12px', padding: '6px 12px', background: 'rgba(0,0,0,0.7)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '13px', color: 'white' }}>Generating...</span>
                </div>
              )}
            </div>

            {/* Hook Text */}
            <div style={{ background: '#1f2937', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: 'white', lineHeight: 1.5 }}>"{selectedVideo.script}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <span style={{ padding: '4px 8px', background: '#374151', borderRadius: '4px', fontSize: '12px', color: '#9ca3af' }}>
                  {selectedVideo.hook_type}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  {selectedVideo.duration || 5}s
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
              {selectedVideo.status === 'ready' && (
                <>
                  {platforms.tiktok && (
                    <button
                      onClick={() => handlePostNow('tiktok')}
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: '#7c3aed',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
                      Post to TikTok
                    </button>
                  )}
                  {platforms.instagram && (
                    <button
                      onClick={() => handlePostNow('instagram')}
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: platforms.tiktok ? '#374151' : '#7c3aed',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/></svg>
                      Post to Instagram
                    </button>
                  )}
                  {!platforms.tiktok && !platforms.instagram && (
                    <Link
                      href="/dashboard/settings"
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: '#7c3aed',
                        color: 'white',
                        fontSize: '15px',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                      }}
                    >
                      Connect Platform to Post
                    </Link>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleDownload}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#374151',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Download
                    </button>
                    <button
                      onClick={handleRegenerate}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#374151',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '500',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                      Regenerate
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', textAlign: 'center' }}>
            <div>
              <svg style={{ margin: '0 auto 12px' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="2" y="4" width="16" height="14" rx="2"/><polygon points="22 7 22 17 17 12 22 7"/></svg>
              <p style={{ fontSize: '14px' }}>Select a video to preview</p>
            </div>
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' }}>
      <p style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>{value}</p>
      <p style={{ fontSize: '12px', color: '#6b7280' }}>{label}</p>
    </div>
  );
}

function VideoCard({ video, selected, onClick }) {
  const isGenerating = video.status === 'generating' || video.status === 'pending';

  return (
    <button
      onClick={onClick}
      style={{
        padding: 0,
        background: 'none',
        border: selected ? '3px solid #7c3aed' : '2px solid transparent',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <div style={{ aspectRatio: '9/16', background: '#f3f4f6', position: 'relative' }}>
        {video.thumbnail_url ? (
          <img src={video.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }} />
        )}

        {isGenerating && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Hook type label */}
        <div style={{ position: 'absolute', bottom: '8px', left: '8px', right: '8px', padding: '6px 8px', background: 'rgba(0,0,0,0.7)', borderRadius: '6px' }}>
          <p style={{ fontSize: '11px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {video.hook_type || 'Video'}
          </p>
        </div>

        {/* Status badge */}
        {video.status === 'ready' && (
          <div style={{ position: 'absolute', top: '8px', right: '8px', width: '20px', height: '20px', background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        )}
      </div>
    </button>
  );
}
