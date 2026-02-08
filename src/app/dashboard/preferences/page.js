"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({
    masterAutopilot: true,
    defaultPostsPerDay: 5,
    defaultTimeStart: '09:00',
    defaultTimeEnd: '20:00',
    autoApprove: false,
    defaultTone: 'casual',
    includeHashtags: false,
    includeEmojis: true,
    emailOnPost: false,
    emailOnFailure: true,
    emailDigest: 'weekly',
  });

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);
    const { data: profile } = await supabase
      .from('profiles')
      .select('settings, autopilot_enabled')
      .eq('id', user.id)
      .single();
    if (profile?.settings && typeof profile.settings === 'object') {
      setSettings(prev => ({
        ...prev,
        ...profile.settings,
        masterAutopilot: profile.autopilot_enabled ?? prev.masterAutopilot,
      }));
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          autopilot_enabled: settings.masterAutopilot,
          settings: {
            defaultPostsPerDay: settings.defaultPostsPerDay,
            defaultTimeStart: settings.defaultTimeStart,
            defaultTimeEnd: settings.defaultTimeEnd,
            autoApprove: settings.autoApprove,
            defaultTone: settings.defaultTone,
            includeHashtags: settings.includeHashtags,
            includeEmojis: settings.includeEmojis,
            emailOnPost: settings.emailOnPost,
            emailOnFailure: settings.emailOnFailure,
            emailDigest: settings.emailDigest,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
      addToast('Preferences saved!', 'success');
    } catch {
      addToast('Failed to save preferences', 'error');
    }
    setSaving(false);
  };

  const handleChange = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Preferences</h1>
            <p className="text-sm text-gray-500 mt-1">Configure your global automation settings.</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Automation */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <BoltIcon className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Automation</h2>
            </div>
            <div className="divide-y divide-gray-100">
              <ToggleRow label="Master Autopilot" desc="Enable automation across all platforms"
                checked={settings.masterAutopilot} onChange={v => handleChange('masterAutopilot', v)} />
              <div className="py-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Default posts per day</span>
                  <span className="text-sm font-bold text-gray-900 tabular-nums">{settings.defaultPostsPerDay}</span>
                </div>
                <input type="range" min="1" max="10" value={settings.defaultPostsPerDay}
                  onChange={e => handleChange('defaultPostsPerDay', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900" />
                <div className="flex justify-between text-[11px] text-gray-400 mt-1.5"><span>1</span><span>10</span></div>
              </div>
              <div className="py-5">
                <span className="text-sm font-medium text-gray-700 block mb-3">Posting window</span>
                <div className="flex items-center gap-3">
                  <input type="time" value={settings.defaultTimeStart}
                    onChange={e => handleChange('defaultTimeStart', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
                  <span className="text-gray-400 text-sm">to</span>
                  <input type="time" value={settings.defaultTimeEnd}
                    onChange={e => handleChange('defaultTimeEnd', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300" />
                </div>
              </div>
              <ToggleRow label="Auto-approve posts" desc="Publish without manual review"
                checked={settings.autoApprove} onChange={v => handleChange('autoApprove', v)} />
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <PencilIcon className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Content</h2>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="py-5 first:pt-0">
                <span className="text-sm font-medium text-gray-700 block mb-3">Default tone</span>
                <div className="flex flex-wrap gap-2">
                  {['casual', 'professional', 'witty', 'educational'].map(tone => (
                    <button key={tone} onClick={() => handleChange('defaultTone', tone)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                        settings.defaultTone === tone ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>{tone}</button>
                  ))}
                </div>
              </div>
              <ToggleRow label="Include hashtags"
                desc={<>Recommended: <span className="text-amber-600 font-medium">Off for X</span>, On for LinkedIn</>}
                checked={settings.includeHashtags} onChange={v => handleChange('includeHashtags', v)} />
              <ToggleRow label="Include emojis" desc="Max 1-2 per post, only when natural"
                checked={settings.includeEmojis} onChange={v => handleChange('includeEmojis', v)} />
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <BellIcon className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="divide-y divide-gray-100">
              <ToggleRow label="Email on post" desc="Get notified when a post is published"
                checked={settings.emailOnPost} onChange={v => handleChange('emailOnPost', v)} />
              <ToggleRow label="Email on failure" desc="Get notified when a post fails"
                checked={settings.emailOnFailure} onChange={v => handleChange('emailOnFailure', v)} />
              <div className="py-5">
                <span className="text-sm font-medium text-gray-700 block mb-3">Performance digest</span>
                <div className="flex gap-2">
                  {['none', 'daily', 'weekly'].map(freq => (
                    <button key={freq} onClick={() => handleChange('emailDigest', freq)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                        settings.emailDigest === freq ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>{freq}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-5 first:pt-0 last:pb-0">
      <div><span className="text-sm font-medium text-gray-700">{label}</span><p className="text-xs text-gray-500 mt-0.5">{desc}</p></div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-gray-900' : 'bg-gray-200'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${checked ? 'translate-x-[22px]' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function BoltIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}
function PencilIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
}
function BellIcon({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;
}
