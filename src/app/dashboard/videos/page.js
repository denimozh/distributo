"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function VideosPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [strategies, setStrategies] = useState([]);
  const [filter, setFilter] = useState("all");

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: campaigns } = await supabase
      .from("campaigns")
      .select(`*, videos(*), avatars(*), hooks(*)`)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setStrategies(campaigns || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  const filteredStrategies = strategies.filter(s => {
    if (filter === "all") return true;
    if (filter === "active") return s.status === "active";
    if (filter === "generating") return s.status === "generating";
    if (filter === "completed") return s.status === "completed";
    return true;
  });

  const counts = {
    all: strategies.length,
    active: strategies.filter(s => s.status === "active").length,
    generating: strategies.filter(s => s.status === "generating").length,
    completed: strategies.filter(s => s.status === "completed").length,
  };

  const hasGenerating = strategies.some(s => s.status === "generating");

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Videos</h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>Manage your content strategies and videos</p>
        </div>
        <Link href="/dashboard/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#7c3aed', color: 'white', fontSize: '14px', fontWeight: '500', borderRadius: '8px', textDecoration: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Strategy
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {[{ id: 'all', label: 'All' }, { id: 'active', label: 'Active' }, { id: 'generating', label: 'Generating' }, { id: 'completed', label: 'Completed' }].map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ padding: '8px 16px', background: filter === f.id ? '#7c3aed' : 'white', color: filter === f.id ? 'white' : '#4b5563', border: filter === f.id ? 'none' : '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {f.label}
            <span style={{ padding: '2px 8px', background: filter === f.id ? 'rgba(255,255,255,0.2)' : '#f3f4f6', borderRadius: '10px', fontSize: '12px' }}>{counts[f.id]}</span>
          </button>
        ))}
      </div>

      {filteredStrategies.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
          <div style={{ width: '56px', height: '56px', background: '#f5f3ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5"><rect x="2" y="4" width="16" height="14" rx="2"/><polygon points="22 7 22 17 17 12 22 7"/></svg>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>No strategies yet</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Create your first content strategy to get started</p>
          <Link href="/dashboard/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#7c3aed', color: 'white', fontSize: '14px', fontWeight: '600', borderRadius: '10px', textDecoration: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Strategy
          </Link>
        </div>
      ) : (
        <>
          {/* Wider cards - max 2 per row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '20px' }}>
            {filteredStrategies.map((strategy) => (
              <StrategyCard key={strategy.id} strategy={strategy} />
            ))}
          </div>
          
          {hasGenerating && (
            <p style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center', marginTop: '24px' }}>
              Your videos will appear here as they're generated. This page auto-refreshes every 10 seconds.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function StrategyCard({ strategy }) {
  const videos = strategy.videos || [];
  const hooks = strategy.hooks || [];
  const readyVideos = videos.filter(v => v.status === 'ready');
  const isGenerating = strategy.status === 'generating';
  const totalVideos = strategy.total_videos || 5;
  
  const hookTypes = [...new Set(hooks.slice(0, 2).map(h => h.hook_type))];

  // Step logic
  const getStep = () => {
    if (hooks.length === 0) return 1;
    if (readyVideos.length === 0) return 2;
    if (readyVideos.length < totalVideos) return 3;
    return 4;
  };
  
  const currentStep = isGenerating ? getStep() : 4;

  return (
    <Link href={`/dashboard/videos/${strategy.id}`} style={{ display: 'block', background: 'white', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden', textDecoration: 'none', transition: 'box-shadow 0.2s, transform 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '20px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: '#f3f4f6', overflow: 'hidden', flexShrink: 0 }}>
          {strategy.avatars?.image_url && <img src={strategy.avatars.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {strategy.product_name} Campaign
          </h3>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>{strategy.product_name}</p>
        </div>
        {isGenerating ? (
          <span style={{ padding: '6px 12px', background: '#fef3c7', color: '#b45309', fontSize: '13px', fontWeight: '500', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', background: '#f59e0b', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
            Generating
          </span>
        ) : (
          <span style={{ padding: '6px 12px', background: '#ecfdf5', color: '#059669', fontSize: '13px', fontWeight: '500', borderRadius: '8px' }}>Active</span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {isGenerating ? (
          // LARGER step-by-step progress
          <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
              {[
                { num: 1, label: 'Hooks', desc: 'Writing variations' },
                { num: 2, label: 'Video', desc: 'AI generation' },
                { num: 3, label: 'Render', desc: 'Processing clips' },
                { num: 4, label: 'Check', desc: 'Quality review' },
              ].map((step, i) => (
                <div key={step.num} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    margin: '0 auto 8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: currentStep >= step.num ? '#7c3aed' : '#e5e7eb',
                    color: currentStep >= step.num ? 'white' : '#9ca3af',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}>
                    {currentStep > step.num ? '✓' : step.num}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: '500', color: currentStep >= step.num ? '#111827' : '#9ca3af', marginBottom: '2px' }}>{step.label}</p>
                  <p style={{ fontSize: '11px', color: currentStep === step.num ? '#7c3aed' : '#9ca3af' }}>{step.desc}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
              {currentStep === 1 && 'Writing hook variations...'}
              {currentStep === 2 && `Generating video ${Math.max(1, readyVideos.length + 1)} of ${totalVideos}...`}
              {currentStep === 3 && 'Processing and rendering...'}
              {currentStep === 4 && 'Running quality check...'}
            </p>
          </div>
        ) : readyVideos.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {readyVideos.slice(0, 5).map((video) => (
              <div key={video.id} style={{ aspectRatio: '9/16', borderRadius: '8px', background: '#f3f4f6', overflow: 'hidden', position: 'relative' }}>
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' }} />
                )}
                <div style={{ position: 'absolute', bottom: '4px', left: '4px', right: '4px', padding: '3px 5px', background: 'rgba(0,0,0,0.6)', borderRadius: '4px' }}>
                  <p style={{ fontSize: '9px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{video.hook_type?.replace('-', ' ') || 'Video'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '10px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>No videos generated yet</p>
          </div>
        )}

        {hookTypes.length > 0 && !isGenerating && (
          <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
            {hookTypes.map(type => (
              <span key={type} style={{ padding: '3px 8px', background: '#f3f4f6', color: '#6b7280', fontSize: '11px', borderRadius: '4px', textTransform: 'capitalize' }}>{type.replace('-', ' ')}</span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="16" height="14" rx="2"/><polygon points="22 7 22 17 17 12 22 7"/></svg>
            {isGenerating ? `${totalVideos} videos generating` : `${readyVideos.length} video${readyVideos.length !== 1 ? 's' : ''}`}
          </span>
          {!isGenerating && readyVideos.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {videos.reduce((sum, v) => sum + (v.views || 0), 0).toLocaleString()} views
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#9ca3af' }}>{formatDate(strategy.created_at)}</span>
          <span style={{ color: '#7c3aed', fontSize: '13px', fontWeight: '500' }}>View videos →</span>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </Link>
  );
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
