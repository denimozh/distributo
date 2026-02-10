"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

const IconZap = ({ c }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const IconBarChart = ({ c }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>;
const IconBrain = ({ c }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" /><path d="M10 21h4" /></svg>;
const IconMouse = ({ c }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" /></svg>;
const IconClock = ({ c }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IconSparkles = ({ c }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" /></svg>;
const IconGH = ({ c }) => <svg className={c} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>;
const IconX = ({ c }) => <svg className={c} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>;
const IconLI = ({ c }) => <svg className={c} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>;
const IconCheck = ({ c }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>;

const ACTIVITY_ICONS = {
  generate: { icon: '✍️', color: 'text-blue-600' },
  publish: { icon: '✅', color: 'text-emerald-600' },
  metrics: { icon: '📊', color: 'text-violet-600' },
  learn: { icon: '🧠', color: 'text-amber-600' },
  error: { icon: '⚠️', color: 'text-red-600' },
  system: { icon: '⚙️', color: 'text-gray-500' },
};

function LiveTimer({ targetTime, label }) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    if (!targetTime) return;
    const update = () => {
      const diff = new Date(targetTime) - new Date();
      if (diff <= 0) { setDisplay('Now'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setDisplay(h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [targetTime]);
  if (!targetTime) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-gray-400">{label}:</span>
      <span className="font-mono font-medium text-gray-700 tabular-nums">{display}</span>
    </div>
  );
}

export default function MissionControlPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ posted: 0, scheduled: 0, impressions: 0, clicks: 0, nextPost: null, autopilotPosts: [], runway: 0, lastPosted: null, pendingMetrics: 0 });
  const [connections, setConnections] = useState({ github: false, x: false, linkedin: false });
  const [insights, setInsights] = useState(null);
  const [activity, setActivity] = useState([]);
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [genPhase, setGenPhase] = useState(''); // analyzing | generating | scheduling | done
  const [toggling, setToggling] = useState(false);
  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [profileRes, postsRes, insightsRes, accountsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('posts').select('id, status, posted_at, scheduled_at, impressions_count, clicks_count, source, hook_content, platform').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('content_insights').select('*').eq('user_id', user.id).single(),
      supabase.from('connected_accounts').select('platform').eq('user_id', user.id).eq('is_active', true),
    ]);

    // Activity log query — table may not exist yet, handle gracefully
    let activityData = [];
    try {
      const activityRes = await supabase.from('activity_log').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      activityData = activityRes.data || [];
    } catch { /* table doesn't exist yet */ }

    const p = profileRes.data;
    setProfile(p);
    const posts = postsRes.data || [];
    const posted = posts.filter(p => p.status === 'posted');
    const scheduled = posts.filter(p => p.status === 'scheduled').sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    const autopilotPosts = posted.filter(p => p.source === 'autopilot' && new Date(p.posted_at) > new Date(Date.now() - 7 * 86400000));
    const lastPosted = posted[0]?.posted_at || null;
    const pendingMetrics = posted.filter(p => (p.impressions_count || 0) === 0 && new Date(p.posted_at) > new Date(Date.now() - 48 * 3600000)).length;

    setStats({
      posted: posted.length, scheduled: scheduled.length,
      impressions: posted.reduce((s, p) => s + (p.impressions_count || 0), 0),
      clicks: posted.reduce((s, p) => s + (p.clicks_count || 0), 0),
      nextPost: scheduled[0]?.scheduled_at, autopilotPosts,
      runway: scheduled.length > 0 ? Math.ceil(scheduled.length / (p?.autopilot_posts_per_day || 2)) : 0,
      lastPosted, pendingMetrics,
    });

    const platforms = (accountsRes.data || []).map(a => a.platform);
    setConnections({ github: platforms.includes('github'), x: platforms.includes('x'), linkedin: platforms.includes('linkedin') });
    setInsights(insightsRes.data);
    setActivity(activityData);
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!profile?.id) return;
    setGenerating(true);
    setGeneratedPosts([]);
    setGenPhase('analyzing');
    
    // Phase 1: Show "analyzing" for 1.5s
    await new Promise(r => setTimeout(r, 1500));
    setGenPhase('generating');

    try {
      const res = await fetch('/api/content/generate-batch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, postsPerDay: profile.autopilot_posts_per_day || 2, days: 7 }),
      });
      const data = await res.json();
      if (data.success && data.posts) {
        setGenPhase('scheduling');
        // Reveal posts one at a time with stagger
        for (let i = 0; i < data.posts.length; i++) {
          await new Promise(r => setTimeout(r, 300));
          setGeneratedPosts(prev => [...prev, data.posts[i]]);
        }
        await new Promise(r => setTimeout(r, 500));
        setGenPhase('done');
        addToast(`🎉 ${data.generated} posts scheduled!`, 'success');
        loadData();
      } else if (data.success) {
        // Fallback: API doesn't return posts array, just show count
        setGenPhase('done');
        addToast(`🎉 Generated ${data.generated} posts!`, 'success');
        loadData();
      } else {
        addToast(data.error || 'Generation failed', 'error');
        setGenPhase('');
      }
    } catch { 
      addToast('Generation failed', 'error'); 
      setGenPhase('');
    }
    setGenerating(false);
  };

  const toggleAutopilot = async () => {
    setToggling(true);
    const newState = !profile?.autopilot_enabled;
    await supabase.from('profiles').update({ autopilot_enabled: newState }).eq('id', profile.id);
    setProfile(p => ({ ...p, autopilot_enabled: newState }));
    addToast(newState ? '⚡ Autopilot activated' : 'Autopilot paused', 'success');
    setToggling(false);
  };

  if (loading) return <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>;

  const autopilotCount = stats.autopilotPosts.length;
  const isNew = stats.posted === 0 && stats.scheduled === 0;
  const checklist = [
    { done: true, label: 'Account created' },
    { done: connections.github, label: 'Connect GitHub', href: '/dashboard/settings' },
    { done: connections.x || connections.linkedin, label: 'Connect X or LinkedIn', href: '/dashboard/settings' },
    { done: stats.posted > 0 || stats.scheduled > 0, label: 'Generate first posts' },
    { done: profile?.autopilot_enabled, label: 'Enable Autopilot' },
  ];
  const checklistComplete = checklist.every(c => c.done);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">

        {/* Status Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-3.5 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button onClick={toggleAutopilot} disabled={toggling} className="flex items-center gap-2.5">
              <span className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${profile?.autopilot_enabled ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${profile?.autopilot_enabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
              </span>
              <span className={`text-sm font-medium ${profile?.autopilot_enabled ? 'text-emerald-600' : 'text-gray-500'}`}>
                {profile?.autopilot_enabled ? 'Autopilot Active' : 'Autopilot Off'}
              </span>
            </button>
            <div className="hidden sm:block w-px h-4 bg-gray-200" />
            <LiveTimer targetTime={stats.nextPost} label="Next post" />
            <div className="hidden sm:block w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">Runway:</span>
              <span className={`font-medium ${stats.runway <= 1 ? 'text-red-600' : stats.runway <= 3 ? 'text-amber-600' : 'text-gray-700'}`}>
                {stats.runway > 0 ? `${stats.runway}d` : 'Empty'}
              </span>
            </div>
            {stats.lastPosted && (
              <>
                <div className="hidden sm:block w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-gray-500">Last post: {new Date(stats.lastPosted).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-3 ml-auto">
              {[{ icon: IconGH, on: connections.github }, { icon: IconX, on: connections.x }, { icon: IconLI, on: connections.linkedin }].map(({ icon: I, on }, i) => (
                <div key={i} className="flex items-center gap-1.5"><I c="w-3.5 h-3.5 text-gray-400" /><span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-emerald-500' : 'bg-gray-300'}`} /></div>
              ))}
            </div>
          </div>
        </div>

        {/* First-run Checklist */}
        {!checklistComplete && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Get started</h3>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-emerald-500' : 'border-2 border-gray-300'}`}>
                    {item.done && <IconCheck c="w-3 h-3 text-white" />}
                  </div>
                  {item.href && !item.done ? (
                    <Link href={item.href} className="text-sm text-blue-600 hover:underline">{item.label}</Link>
                  ) : (
                    <span className={`text-sm ${item.done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{item.label}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* While You Were Coding */}
        {autopilotCount > 0 && (
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">While You Were Coding</span>
              </div>
              <p className="text-lg font-semibold mb-1">{autopilotCount} posts published automatically this week</p>
              <p className="text-sm text-gray-400">
                {stats.impressions > 0 ? `${stats.impressions.toLocaleString()} impressions` : ''}
                {stats.clicks > 0 ? ` · ${stats.clicks} clicks to your product` : ''}
                {stats.pendingMetrics > 0 ? ` · ${stats.pendingMetrics} posts awaiting metrics ⏳` : ''}
              </p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Left 2/3 — Activity Feed + Stats */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard icon={IconBarChart} label="Published" value={stats.posted} bg="bg-blue-50" fg="text-blue-600" />
              <StatCard icon={IconSparkles} label="Impressions" value={stats.impressions > 0 ? stats.impressions.toLocaleString() : stats.pendingMetrics > 0 ? '⏳ Pending' : '0'} bg="bg-violet-50" fg="text-violet-600" />
              <StatCard icon={IconMouse} label="Clicks" value={stats.clicks.toLocaleString()} bg="bg-amber-50" fg="text-amber-600" highlight />
              <StatCard icon={IconClock} label="Queued" value={stats.scheduled} bg="bg-emerald-50" fg="text-emerald-600" />
            </div>

            {/* Activity Feed — THE FACTORY */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-semibold text-gray-900">Autopilot Activity</h3>
                </div>
                <span className="text-[10px] text-gray-400">Last 72 hours</span>
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {activity.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-500 mb-1">No activity yet</p>
                    <p className="text-xs text-gray-400">
                      {profile?.autopilot_enabled
                        ? `Autopilot runs every 6 hours, generating ${profile.autopilot_posts_per_day || 2} posts/day. Activity appears here as it works.`
                        : 'Enable autopilot to see the machine in action.'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {activity.map((a, i) => {
                      const cfg = ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.system;
                      const time = new Date(a.created_at);
                      const isToday = new Date().toDateString() === time.toDateString();
                      return (
                        <div key={a.id || i} className="px-5 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3">
                          <span className="text-sm mt-0.5">{cfg.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700">{a.message}</p>
                          </div>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                            {isToday ? time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Generate Content — THE THEATER */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-6">
                {!generating && genPhase !== 'done' && (
                  <>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Generate Content</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      {stats.scheduled > 0
                        ? `${stats.scheduled} posts queued. Next goes out ${stats.nextPost ? new Date(stats.nextPost).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'soon'}.`
                        : isNew
                          ? 'Generate your first week of content from your GitHub activity.'
                          : `${stats.posted} posts published. Queue is empty — generate more.`}
                    </p>
                    <button onClick={handleGenerate}
                      className="w-full py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                      <IconSparkles c="w-4 h-4" /> {isNew ? 'Generate first posts' : `Fill queue (${(profile?.autopilot_posts_per_day || 2)}/day × 7 days)`}
                    </button>
                  </>
                )}

                {/* Generation Theater — Live Production Feed */}
                {(generating || genPhase === 'done') && (
                  <div>
                    {/* Phase Indicator */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`flex items-center gap-2 text-xs font-medium ${genPhase === 'analyzing' ? 'text-gray-900' : 'text-gray-400'}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${genPhase === 'analyzing' ? 'bg-gray-900 text-white animate-pulse' : genPhase !== '' ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                          {genPhase === 'analyzing' ? '⚙️' : '✓'}
                        </span>
                        Analyzing
                      </div>
                      <div className="h-px flex-1 bg-gray-200" />
                      <div className={`flex items-center gap-2 text-xs font-medium ${genPhase === 'generating' ? 'text-gray-900' : genPhase === 'scheduling' || genPhase === 'done' ? 'text-gray-400' : 'text-gray-300'}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${genPhase === 'generating' ? 'bg-gray-900 text-white animate-pulse' : genPhase === 'scheduling' || genPhase === 'done' ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                          {genPhase === 'generating' ? '✍️' : (genPhase === 'scheduling' || genPhase === 'done') ? '✓' : '2'}
                        </span>
                        Creating
                      </div>
                      <div className="h-px flex-1 bg-gray-200" />
                      <div className={`flex items-center gap-2 text-xs font-medium ${genPhase === 'scheduling' || genPhase === 'done' ? 'text-gray-900' : 'text-gray-300'}`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${genPhase === 'scheduling' ? 'bg-gray-900 text-white animate-pulse' : genPhase === 'done' ? 'bg-emerald-500 text-white' : 'bg-gray-200'}`}>
                          {genPhase === 'done' ? '✓' : genPhase === 'scheduling' ? '📅' : '3'}
                        </span>
                        {genPhase === 'done' ? 'Scheduled' : 'Scheduling'}
                      </div>
                    </div>

                    {/* Phase Messages */}
                    {genPhase === 'analyzing' && (
                      <div className="flex items-center gap-3 py-4">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        <div>
                          <p className="text-sm text-gray-700 font-medium">Analyzing your GitHub activity & audience data...</p>
                          <p className="text-xs text-gray-400 mt-0.5">Reading commits, checking what worked before</p>
                        </div>
                      </div>
                    )}

                    {genPhase === 'generating' && generatedPosts.length === 0 && (
                      <div className="flex items-center gap-3 py-4">
                        <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        <div>
                          <p className="text-sm text-gray-700 font-medium">AI is writing your posts...</p>
                          <p className="text-xs text-gray-400 mt-0.5">Applying your voice profile & content intelligence</p>
                        </div>
                      </div>
                    )}

                    {/* Posts Appearing One by One */}
                    {generatedPosts.length > 0 && (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {generatedPosts.map((post, i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-3 animate-[fadeSlideIn_0.3s_ease-out]"
                            style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                                {post.platform === 'linkedin' ? 'LinkedIn' : 'X'}
                              </span>
                              {post.scheduled_at && (
                                <span className="text-[10px] text-gray-400">
                                  {new Date(post.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-700 line-clamp-2">{post.hook_content || post.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Done State */}
                    {genPhase === 'done' && (
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm text-emerald-600 font-medium">
                          ✅ {generatedPosts.length} posts scheduled for the next 7 days
                        </p>
                        <button onClick={() => { setGenPhase(''); setGeneratedPosts([]); }}
                          className="text-xs text-gray-500 hover:text-gray-700">
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right 1/3 — Intelligence + What Changed */}
          <div className="space-y-6">

            {/* What Changed This Week */}
            {insights && insights.format_performance && (
              <WhatChangedPanel insights={insights} />
            )}

            {/* Content Intelligence Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><IconBrain c="w-4 h-4 text-violet-600" /></div>
                <h3 className="text-sm font-semibold text-gray-900">Content Intelligence</h3>
              </div>
              {!insights ? (
                <div>
                  {stats.posted >= 5 ? (
                    <>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                        <div className="bg-violet-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }} />
                      </div>
                      <p className="text-xs text-gray-500">Analyzing {stats.posted} posts — intelligence updates next metrics cycle ⏳</p>
                    </>
                  ) : stats.posted > 0 ? (
                    <>
                      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                        <div className="bg-violet-500 h-2 rounded-full transition-all" style={{ width: `${(stats.posted / 5) * 100}%` }} />
                      </div>
                      <p className="text-xs text-gray-500">{5 - stats.posted} more published posts until intelligence kicks in.</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Publish your first posts to start building content intelligence.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Best format</span>
                    <span className="font-medium text-gray-900">{insights.best_format?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Best time</span>
                    <span className="font-medium text-gray-900">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][insights.best_posting_day]} {insights.best_posting_hour}:00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Posts analyzed</span>
                    <span className="font-medium text-gray-900">{insights.posts_analyzed}</span>
                  </div>
                  <Link href="/dashboard/insights" className="block text-center pt-3 border-t border-gray-100 text-violet-600 hover:text-violet-700 font-medium text-xs">
                    View full insights →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, bg, fg, highlight }) {
  return (
    <div className={`bg-white rounded-2xl border ${highlight ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-200'} p-4`}>
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}><Icon c={`w-4 h-4 ${fg}`} /></div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

function WhatChangedPanel({ insights }) {
  const fp = insights.format_performance || {};
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
        <h3 className="text-sm font-semibold text-violet-900">What Your AI Changed</h3>
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
        <p className="text-xs text-violet-600 mt-2 pt-2 border-t border-violet-200">
          → Autopilot adjusted future content mix accordingly
        </p>
      </div>
    </div>
  );
}