"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [platforms, setPlatforms] = useState({ tiktok: null, instagram: null });
  const [form, setForm] = useState({ fullName: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    setProfile(profileData);
    setForm({ fullName: profileData?.full_name || '' });

    const { data: connections } = await supabase.from("platform_connections").select("*").eq("user_id", user.id);
    if (connections) {
      setPlatforms({
        tiktok: connections.find(c => c.platform === 'tiktok') || null,
        instagram: connections.find(c => c.platform === 'instagram') || null,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ full_name: form.fullName }).eq("id", user.id);
    }
    setSaving(false);
  };

  const handleConnectTikTok = () => { window.location.href = '/api/auth/tiktok'; };
  const handleConnectInstagram = () => { window.location.href = '/api/auth/instagram'; };

  const handleDisconnect = async (platform) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("platform_connections").delete().eq("user_id", user.id).eq("platform", platform);
      setPlatforms(p => ({ ...p, [platform]: null }));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div style={{ width: '24px', height: '24px', border: '2px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '700px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Settings</h1>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Manage your account and connected platforms</p>
      </div>

      {/* Profile Section */}
      <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '20px' }}>Profile</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Full Name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm(f => ({ ...f, fullName: e.target.value }))}
              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', background: '#f9fafb', color: '#6b7280' }}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ alignSelf: 'flex-start', padding: '10px 20px', background: '#7c3aed', color: 'white', fontSize: '14px', fontWeight: '500', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </section>

      {/* Platform Connections */}
      <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>Platform Connections</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Connect your social accounts to enable automatic posting</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* TikTok */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#111827"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: '500', color: '#111827' }}>TikTok</p>
                <p style={{ fontSize: '13px', color: platforms.tiktok ? '#059669' : '#6b7280' }}>
                  {platforms.tiktok ? `@${platforms.tiktok.username || 'connected'}` : 'Not connected'}
                </p>
              </div>
            </div>
            {platforms.tiktok ? (
              <button onClick={() => handleDisconnect('tiktok')} style={{ padding: '8px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#dc2626', cursor: 'pointer' }}>Disconnect</button>
            ) : (
              <button onClick={handleConnectTikTok} style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Connect</button>
            )}
          </div>

          {/* Instagram */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1.5" fill="#111827"/></svg>
              </div>
              <div>
                <p style={{ fontSize: '15px', fontWeight: '500', color: '#111827' }}>Instagram</p>
                <p style={{ fontSize: '13px', color: platforms.instagram ? '#059669' : '#6b7280' }}>
                  {platforms.instagram ? `@${platforms.instagram.username || 'connected'}` : 'Not connected'}
                </p>
              </div>
            </div>
            {platforms.instagram ? (
              <button onClick={() => handleDisconnect('instagram')} style={{ padding: '8px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', color: '#dc2626', cursor: 'pointer' }}>Disconnect</button>
            ) : (
              <button onClick={handleConnectInstagram} style={{ padding: '8px 16px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>Connect</button>
            )}
          </div>
        </div>
      </section>

      {/* Billing */}
      <section style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>Billing</h2>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>You have <strong style={{ color: '#111827' }}>{profile?.credits || 0} credits</strong> remaining</p>
          </div>
          <Link href="/dashboard/settings/billing" style={{ padding: '10px 20px', background: '#7c3aed', color: 'white', fontSize: '14px', fontWeight: '500', borderRadius: '8px', textDecoration: 'none' }}>
            Manage Billing
          </Link>
        </div>
      </section>
    </div>
  );
}
