"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/Toast';

function GHIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>; }
function XIco({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }
function LIIco({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>; }

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-5 first:pt-0 last:pb-0">
      <div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-gray-900' : 'bg-gray-200'}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${checked ? 'translate-x-[22px]' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [voiceInput, setVoiceInput] = useState('');
  const [analyzingVoice, setAnalyzingVoice] = useState(false);
  const [styleProfile, setStyleProfile] = useState(null);
  const [settings, setSettings] = useState({
    masterAutopilot: true, defaultPostsPerDay: 2, defaultTimeStart: '09:00',
    defaultTimeEnd: '20:00', autoApprove: true, defaultTone: 'casual',
    includeHashtags: false, includeEmojis: true, productUrl: '',
  });

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    setUser(u);

    const { data: profile } = await supabase.from('profiles')
      .select('settings, autopilot_enabled, autopilot_posts_per_day, autopilot_auto_approve, autopilot_platforms, product_url, style_profile')
      .eq('id', u.id).single();

    if (profile) {
      setSettings(prev => ({
        ...prev, ...profile.settings,
        masterAutopilot: profile.autopilot_enabled ?? prev.masterAutopilot,
        defaultPostsPerDay: profile.autopilot_posts_per_day ?? prev.defaultPostsPerDay,
        autoApprove: profile.autopilot_auto_approve ?? prev.autoApprove,
        autopilotPlatforms: profile.autopilot_platforms || ['x'],
        productUrl: profile.product_url || '',
      }));
      setStyleProfile(profile.style_profile);
    }

    const { data: accts } = await supabase.from('connected_accounts').select('*').eq('user_id', u.id).eq('is_active', true);
    setAccounts(accts || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase.from('profiles').update({
        autopilot_enabled: settings.masterAutopilot,
        autopilot_posts_per_day: settings.defaultPostsPerDay,
        autopilot_auto_approve: settings.autoApprove,
        autopilot_platforms: settings.autopilotPlatforms || ['x'],
        product_url: settings.productUrl,
        settings: {
          defaultTimeStart: settings.defaultTimeStart, defaultTimeEnd: settings.defaultTimeEnd,
          defaultTone: settings.defaultTone, includeHashtags: settings.includeHashtags,
          includeEmojis: settings.includeEmojis,
        },
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      addToast('Settings saved', 'success');
    } catch { addToast('Failed to save', 'error'); }
    setSaving(false);
  };

  const handleConnect = (platform) => {
    const routes = { github: '/api/auth/github/connect', x: '/api/auth/x/connect', linkedin: '/api/auth/linkedin/connect' };
    window.location.href = routes[platform];
  };

  const handleDisconnect = async (id) => {
    await supabase.from('connected_accounts').update({ is_active: false }).eq('id', id);
    setAccounts(prev => prev.filter(a => a.id !== id));
    addToast('Disconnected', 'success');
  };

  const handleAnalyzeVoice = async () => {
    if (!voiceInput.trim()) return;
    setAnalyzingVoice(true);
    try {
      const posts = voiceInput.split('\n---\n').map(p => p.trim()).filter(Boolean);
      if (posts.length < 3) { addToast('Need at least 3 posts (separate with ---)', 'error'); setAnalyzingVoice(false); return; }
      const res = await fetch('/api/voice/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, posts }),
      });
      const data = await res.json();
      if (data.success) { setStyleProfile(data.profile); addToast(`Voice analyzed from ${data.posts_analyzed} posts`, 'success'); }
      else addToast(data.error || 'Failed', 'error');
    } catch { addToast('Analysis failed', 'error'); }
    setAnalyzingVoice(false);
  };

  const set = (k, v) => setSettings(p => ({ ...p, [k]: v }));

  const platforms = [
    { id: 'github', name: 'GitHub', desc: 'Auto-generate posts from commits', icon: GHIcon, color: 'bg-gray-900' },
    { id: 'x', name: 'X (Twitter)', desc: 'Post tweets with plug replies', icon: XIco, color: 'bg-black' },
    { id: 'linkedin', name: 'LinkedIn', desc: 'Cross-post professional updates', icon: LIIco, color: 'bg-blue-600' },
  ];

  if (loading) return <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Integrations, automation &amp; content preferences</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Connections */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Connections</h2>
            <div className="space-y-3">
              {platforms.map(p => {
                const acct = accounts.find(a => a.platform === p.id);
                return (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${p.color} rounded-xl flex items-center justify-center`}>
                        <p.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        {acct ? <div className="text-xs text-emerald-600 font-medium">Connected as @{acct.platform_username}</div>
                          : <div className="text-xs text-gray-500">{p.desc}</div>}
                      </div>
                    </div>
                    {acct ? (
                      <button onClick={() => handleDisconnect(acct.id)} className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors">Disconnect</button>
                    ) : (
                      <button onClick={() => handleConnect(p.id)} className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors">Connect</button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Automation */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Automation</h2>
            <div className="divide-y divide-gray-100">
              <ToggleRow label="Autopilot" desc="Runs every 6 hours, keeps 3–7 days of posts queued automatically." checked={settings.masterAutopilot} onChange={v => set('masterAutopilot', v)} />
              <div className="py-5">
                <span className="text-sm font-medium text-gray-700 block mb-2">Autopilot platforms</span>
                <p className="text-xs text-gray-500 mb-3">Autopilot will generate and publish content for selected platforms.</p>
                <div className="space-y-2">
                  {[{ key: 'x', label: 'X (Twitter)' }, { key: 'linkedin', label: 'LinkedIn' }].map(pl => (
                    <label key={pl.key} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox"
                        checked={(settings.autopilotPlatforms || ['x']).includes(pl.key)}
                        onChange={e => {
                          const curr = settings.autopilotPlatforms || ['x'];
                          set('autopilotPlatforms', e.target.checked ? [...curr, pl.key] : curr.filter(p => p !== pl.key));
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900/10"
                      />
                      <span className="text-sm text-gray-700">{pl.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <ToggleRow label="Auto-approve posts" desc="Publish without manual review" checked={settings.autoApprove} onChange={v => set('autoApprove', v)} />
              <div className="py-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Posts per day</span>
                  <span className="text-sm font-bold text-gray-900 tabular-nums w-6 text-center">{settings.defaultPostsPerDay}</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">
                  Autopilot keeps ~{settings.defaultPostsPerDay * 5} posts queued ({settings.defaultPostsPerDay}/day × 5 days). That's ~{settings.defaultPostsPerDay * 30} posts/month.
                </p>
                <input type="range" min="1" max="5" value={settings.defaultPostsPerDay}
                  onChange={e => set('defaultPostsPerDay', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>1/day</span>
                  <span>3/day</span>
                  <span>5/day</span>
                </div>
              </div>
              <div className="py-5">
                <span className="text-sm font-medium text-gray-700 block mb-3">Posting window</span>
                <div className="flex items-center gap-3">
                  <input type="time" value={settings.defaultTimeStart} onChange={e => set('defaultTimeStart', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                  <span className="text-gray-400 text-sm">to</span>
                  <input type="time" value={settings.defaultTimeEnd} onChange={e => set('defaultTimeEnd', e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Content</h2>
            <div className="divide-y divide-gray-100">
              <div className="pb-5">
                <span className="text-sm font-medium text-gray-700 block mb-3">Default tone</span>
                <div className="flex flex-wrap gap-2">
                  {['casual', 'professional', 'witty', 'educational'].map(t => (
                    <button key={t} onClick={() => set('defaultTone', t)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${settings.defaultTone === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <ToggleRow label="Include hashtags" desc="Off recommended for X" checked={settings.includeHashtags} onChange={v => set('includeHashtags', v)} />
              <ToggleRow label="Include emojis" desc="Max 1-2 per post" checked={settings.includeEmojis} onChange={v => set('includeEmojis', v)} />
              <div className="py-5">
                <span className="text-sm font-medium text-gray-700 block mb-2">Product URL</span>
                <p className="text-xs text-gray-500 mb-3">Where we drive traffic from your posts</p>
                <input type="url" value={settings.productUrl} onChange={e => set('productUrl', e.target.value)}
                  placeholder="https://yourproduct.com" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
              </div>
            </div>
          </div>

          {/* Voice */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Your Voice</h2>
            <p className="text-xs text-gray-500 mb-4">Paste your best tweets so the AI learns your voice. Separate each with ---</p>
            {styleProfile && (
              <div className="mb-4 p-4 bg-violet-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-violet-700">Voice Profile Active</span>
                  <span className="text-[10px] text-violet-500">• {styleProfile.tone} • {styleProfile.sentence_style}</span>
                </div>
                {styleProfile.writing_rules?.slice(0, 3).map((r, i) => <p key={i} className="text-xs text-violet-600">• {r}</p>)}
              </div>
            )}
            <textarea value={voiceInput} onChange={e => setVoiceInput(e.target.value)} rows={5}
              placeholder={`The auth bug that took 4 hours was a missing await.\n---\nSomeone asked how I market my SaaS. I showed them my git log.\n---\n94 users. 3 paying. 1 churned because I didn't have dark mode.`}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 mb-3" />
            <button onClick={handleAnalyzeVoice} disabled={analyzingVoice || !voiceInput.trim()}
              className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50">
              {analyzingVoice ? 'Analyzing...' : styleProfile ? 'Re-analyze Voice' : 'Analyze My Voice'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}