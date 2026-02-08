"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

// ==========================================
// ICONS
// ==========================================
const IconCheck = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>);
const IconX = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const IconEdit = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>);
const IconClock = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>);
const IconRefresh = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>);
const IconZap = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>);
const IconGitCommit = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4" /><line x1="1.05" y1="12" x2="7" y2="12" /><line x1="17.01" y1="12" x2="22.96" y2="12" /></svg>);
const IconTwitterX = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>);
const IconLinkedIn = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>);
const IconLink = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>);
const IconThread = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>);
const IconGitHub = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>);
const IconSparkles = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" /></svg>);
const IconTrendingUp = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>);
const IconBarChart = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></svg>);
const IconMousePointer = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="M13 13l6 6" /></svg>);
const IconBrain = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.5.5 2.8 1.4 3.8L12 21l6.6-9.7A5.5 5.5 0 0 0 14.5 2c-1.7 0-3.2.8-4.2 2a5.5 5.5 0 0 0-4.2-2H9.5z" /></svg>);
const IconActivity = ({ className }) => (<svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>);

// ==========================================
// LIVE COUNTDOWN TIMER
// ==========================================
function LiveTimer({ targetTime, label }) {
  const [display, setDisplay] = useState('');
  useEffect(() => {
    if (!targetTime) return;
    const update = () => {
      const diff = new Date(targetTime) - new Date();
      if (diff <= 0) { setDisplay('Now'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setDisplay(`${h}h ${m}m`);
      else if (m > 0) setDisplay(`${m}m ${s}s`);
      else setDisplay(`${s}s`);
    };
    update();
    const i = setInterval(update, 1000);
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

// ==========================================
// STATUS BAR — with live countdown + toggle
// ==========================================
function StatusBar({ isActive, nextPostTime, runway, connections, onToggle, toggling, totalPosted, totalClicks }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Main row */}
      <div className="px-5 py-3.5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <button onClick={onToggle} disabled={toggling} className="flex items-center gap-2.5 group">
          <span className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${isActive ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
          </span>
          <span className={`text-sm font-medium ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
            {isActive ? 'Autopilot Active' : 'Autopilot Off'}
          </span>
        </button>

        <div className="hidden sm:block w-px h-4 bg-gray-200" />
        <LiveTimer targetTime={nextPostTime} label="Next post" />

        <div className="hidden sm:block w-px h-4 bg-gray-200" />
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-400">Runway:</span>
          <span className={`font-medium ${runway <= 1 ? 'text-red-600' : runway <= 3 ? 'text-amber-600' : 'text-gray-700'}`}>
            {runway > 0 ? `${runway} day${runway !== 1 ? 's' : ''}` : 'Empty'}
          </span>
        </div>

        {/* Connection indicators — pushed right */}
        <div className="flex items-center gap-3 ml-auto">
          {[
            { icon: IconGitHub, on: connections.github, label: 'GitHub' },
            { icon: IconTwitterX, on: connections.x, label: 'X' },
            { icon: IconLinkedIn, on: connections.linkedin, label: 'LinkedIn' },
          ].map(({ icon: Icon, on, label }) => (
            <div key={label} className="flex items-center gap-1.5" title={label}>
              <Icon className="w-3.5 h-3.5 text-gray-400" />
              <span className={`w-1.5 h-1.5 rounded-full ${on ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Stats ribbon */}
      <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <IconBarChart className="w-3 h-3 text-gray-400" />
          <span><span className="font-semibold text-gray-700">{totalPosted}</span> posts total</span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconMousePointer className="w-3 h-3 text-gray-400" />
          <span><span className="font-semibold text-gray-700">{totalClicks}</span> link clicks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconActivity className="w-3 h-3 text-gray-400" />
          <span>Cron runs every 6h</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CONTENT INTELLIGENCE CARD
// ==========================================
function ContentIntelligence({ insights, postsAnalyzed }) {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formatLabel = (f) => {
    const labels = { 'pain_solution': 'Pain → Solution', 'controversial': 'Controversial Take', 'before_after': 'Before/After', 'question': 'Question', 'story': 'Story', 'mixed': 'Mixed' };
    return labels[f] || f?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Mixed';
  };

  if (!insights && postsAnalyzed < 5) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <IconBrain className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Content Intelligence</h3>
        </div>
        <div className="text-center py-4">
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
            <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (postsAnalyzed / 5) * 100)}%` }} />
          </div>
          <p className="text-xs text-gray-500">
            Learning... <span className="font-medium text-gray-700">{postsAnalyzed}/5</span> posts analyzed
          </p>
          <p className="text-[10px] text-gray-400 mt-1">Intelligence unlocks after 5 posted tweets with engagement data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
            <IconBrain className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Content Intelligence</h3>
            <p className="text-[10px] text-gray-400">{postsAnalyzed} posts analyzed</p>
          </div>
        </div>
        <span className="text-[10px] font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">AI Learning</span>
      </div>
      <div className="p-4 space-y-3">
        {insights?.best_format && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Best format</span>
            <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{formatLabel(insights.best_format)}</span>
          </div>
        )}
        {insights?.best_posting_hour !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Best time</span>
            <span className="text-xs font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
              {DAYS[insights.best_posting_day || 0]} at {insights.best_posting_hour}:00
            </span>
          </div>
        )}
        {insights?.avg_impressions > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Avg impressions</span>
            <span className="text-xs font-medium text-gray-900">{insights.avg_impressions.toLocaleString()}</span>
          </div>
        )}
        {insights?.avg_replies > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Avg replies</span>
            <span className="text-xs font-medium text-gray-900">{insights.avg_replies}</span>
          </div>
        )}
        {insights?.top_hook_patterns?.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Top Hook</span>
            <p className="text-xs text-gray-700 mt-1 italic leading-relaxed">"{insights.top_hook_patterns[0].hook}"</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">Score: {insights.top_hook_patterns[0].score}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// ACTION CARD
// ==========================================
function ActionCard({ post, platform, onApprove, onReject, onEdit, isLoading }) {
  const PlatformIcon = platform === 'linkedin' ? IconLinkedIn : IconTwitterX;
  const charLimit = platform === 'x' ? 280 : 3000;
  const content = post.hook_content || post.content || '';
  const hasPlug = post.plug_content && post.plug_content.trim().length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <PlatformIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">Ready to Post</span>
            {hasPlug && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-semibold">
                <IconThread className="w-2.5 h-2.5" /> 1/2
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{content.length}/{charLimit}</span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed min-h-[60px]">{content}</p>
        {hasPlug && (
          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex items-center gap-1.5 text-xs text-blue-600">
            <IconLink className="w-3 h-3" /> <span>+ Reply with link</span>
          </div>
        )}
        {post.scheduled_at && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
            <IconClock className="w-3.5 h-3.5" />
            <span>{new Date(post.scheduled_at).toLocaleDateString('en-US', { weekday: 'short' })} {new Date(post.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
      <div className="p-3 bg-gray-50 flex items-center gap-2 border-t border-gray-100">
        <button onClick={() => onApprove(post.id)} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
          <IconCheck className="w-4 h-4" /> Approve
        </button>
        <button onClick={() => onEdit(post)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors border border-gray-200">
          <IconEdit className="w-4 h-4" />
        </button>
        <button onClick={() => onReject(post.id)} disabled={isLoading} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-200">
          <IconX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// SIGNAL FEED (GitHub + Runway + Gen buttons)
// ==========================================
function SignalFeed({ commits, runway, scheduledCount, postedThisWeek, onGenerate, generating }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">GitHub Activity</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {commits.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-2"><IconGitHub className="w-5 h-5 text-gray-400" /></div>
              <p className="text-sm text-gray-500">No recent commits</p>
              <p className="text-xs text-gray-400 mt-1">Connect GitHub to see activity</p>
            </div>
          ) : commits.map((c, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <IconGitCommit className="w-3 h-3 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{c.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.time}</p>
              </div>
              {c.postsGenerated > 0 && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex-shrink-0">→ {c.postsGenerated}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Content Runway</h3>
          <span className="text-xs font-medium text-gray-500">{runway}d</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
          <div className={`h-full rounded-full transition-all ${runway >= 5 ? 'bg-emerald-500' : runway >= 2 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, (runway / 7) * 100)}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>{scheduledCount} scheduled</span>
          <span>{postedThisWeek} this week</span>
        </div>
        <button onClick={() => onGenerate(7)} disabled={generating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
          {generating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <IconSparkles className="w-4 h-4" />}
          {generating ? 'Generating...' : 'Fuel Up Week'}
        </button>
      </div>

      <button onClick={() => onGenerate(1)} disabled={generating} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl border border-gray-200 transition-colors disabled:opacity-50">
        <IconZap className="w-4 h-4 text-gray-400" /> Fuel Up Today
      </button>
    </div>
  );
}

// ==========================================
// WEEK AT A GLANCE
// ==========================================
function WeekAtAGlance({ posts }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const start = new Date(today);
  const dow = today.getDay();
  start.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  start.setHours(0, 0, 0, 0);

  const weekData = days.map((name, idx) => {
    const d = new Date(start); d.setDate(start.getDate() + idx);
    const nd = new Date(d); nd.setDate(d.getDate() + 1);
    const dp = (posts || []).filter(p => { const pd = new Date(p.scheduled_at || p.posted_at); return pd >= d && pd < nd; });
    return { name, posted: dp.filter(p => p.status === 'posted').length, scheduled: dp.filter(p => p.status === 'scheduled').length, pending: dp.filter(p => p.status === 'pending').length, isToday: d.toDateString() === today.toDateString() };
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">This Week</h3>
      <div className="grid grid-cols-7 gap-2">
        {weekData.map((day, i) => {
          const total = day.posted + day.scheduled + day.pending;
          return (
            <div key={i} className="text-center">
              <div className={`text-[10px] font-medium mb-1.5 ${day.isToday ? 'text-gray-900 font-semibold' : 'text-gray-400'}`}>{day.name}</div>
              <div className="flex flex-col items-center gap-0.5">
                {total === 0 ? <div className="w-2 h-2 rounded-full bg-gray-100" /> : Array.from({ length: Math.min(5, total) }).map((_, j) => {
                  let c = 'bg-amber-400';
                  if (j < day.posted) c = 'bg-emerald-500';
                  else if (j < day.posted + day.scheduled) c = 'bg-blue-400';
                  return <div key={j} className={`w-2 h-2 rounded-full ${c}`} />;
                })}
              </div>
              {total > 0 && <div className="text-[10px] text-gray-400 mt-1">{total}</div>}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Posted</div>
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Scheduled</div>
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Pending</div>
      </div>
    </div>
  );
}

// ==========================================
// EDIT POST MODAL
// ==========================================
function EditPostModal({ post, onSave, onClose }) {
  const [hookContent, setHookContent] = useState(post?.hook_content || post?.content || '');
  const [plugContent, setPlugContent] = useState(post?.plug_content || '');
  const [saving, setSaving] = useState(false);
  const maxLength = post?.platform === 'linkedin' ? 3000 : 280;
  const hookOver = hookContent.length > maxLength;
  const plugOver = plugContent.length > maxLength;
  const hasPlug = post?.plug_content || post?.is_thread;

  const handleSave = async () => {
    if (hookOver || (hasPlug && plugOver)) return;
    setSaving(true); await onSave(post.id, hookContent, plugContent); setSaving(false); onClose();
  };
  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center"><IconTwitterX className="w-5 h-5 text-white" /></div>
            <div><h3 className="text-lg font-semibold text-gray-900">Edit Post</h3><p className="text-xs text-gray-500">Post + Reply Link</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><IconX className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center"><span className="text-xs font-bold text-blue-600">1</span></div>
                <span className="text-sm font-medium text-gray-900">POST</span>
              </div>
              <span className={`text-xs ${hookOver ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{hookContent.length}/{maxLength}</span>
            </div>
            <textarea value={hookContent} onChange={e => setHookContent(e.target.value)} rows={4} className={`w-full bg-gray-50 border rounded-xl p-4 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 ${hookOver ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
          </div>
          {hasPlug && (
            <>
              <div className="flex items-center gap-3 py-1">
                <div className="w-6 flex justify-center"><div className="w-0.5 h-8 bg-gray-200 rounded-full" /></div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full"><IconClock className="w-3 h-3 text-gray-400" /><span className="text-xs text-gray-500">60s delay</span></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center"><span className="text-xs font-bold text-emerald-600">2</span></div>
                    <span className="text-sm font-medium text-gray-900">REPLY LINK</span>
                  </div>
                  <span className={`text-xs ${plugOver ? 'text-red-500 font-medium' : 'text-gray-400'}`}>{plugContent.length}/{maxLength}</span>
                </div>
                <textarea value={plugContent} onChange={e => setPlugContent(e.target.value)} rows={3} className={`w-full bg-emerald-50/50 border rounded-xl p-4 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-400 ${plugOver ? 'border-red-300 bg-red-50' : 'border-emerald-200'}`} />
              </div>
            </>
          )}
        </div>
        <div className="p-5 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="text-xs text-gray-500">{post.scheduled_at ? new Date(post.scheduled_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not scheduled'}</div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Cancel</button>
            <button onClick={handleSave} disabled={saving || hookOver || (hasPlug && plugOver) || !hookContent.trim()} className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN — MISSION CONTROL
// ==========================================
export default function MissionControlPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [stats, setStats] = useState({ postsToday: 0, postsLimit: 5, pendingCount: 0, scheduledCount: 0, postedThisWeek: 0, totalPosted: 0, totalClicks: 0 });
  const [pendingPosts, setPendingPosts] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const [commits, setCommits] = useState([]);
  const [connections, setConnections] = useState({ github: false, x: false, linkedin: false });
  const [autopilotToggling, setAutopilotToggling] = useState(false);
  const [contentInsights, setContentInsights] = useState(null);
  const [postsWithEngagement, setPostsWithEngagement] = useState(0);

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    loadDashboardData();
    const channel = supabase.channel('dashboard-updates').on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => { loadDashboardData(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    setUser(user);

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(profileData);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: posts } = await supabase.from('posts').select('*').eq('user_id', user.id).order('scheduled_at', { ascending: true });

    const all = posts || [];
    setAllPosts(all);
    const pending = all.filter(p => p.status === 'pending');
    const scheduled = all.filter(p => p.status === 'scheduled');
    const posted = all.filter(p => p.status === 'posted');
    const totalClicks = posted.reduce((sum, p) => sum + (p.clicks_count || 0), 0);

    setPendingPosts(pending.slice(0, 10));
    setScheduledPosts(scheduled.slice(0, 5));
    setStats({
      postsToday: all.filter(p => p.status === 'posted' && new Date(p.posted_at) >= today).length,
      postsLimit: 5,
      pendingCount: pending.length,
      scheduledCount: scheduled.length,
      postedThisWeek: all.filter(p => p.status === 'posted' && new Date(p.posted_at) >= weekAgo).length,
      totalPosted: posted.length,
      totalClicks,
    });

    // Count posts with engagement data for intelligence
    const withEngagement = posted.filter(p => p.engagement_score && p.engagement_score > 0).length;
    setPostsWithEngagement(withEngagement);

    // Fetch content insights
    const { data: insights } = await supabase.from('content_insights').select('*').eq('user_id', user.id).single();
    if (insights) setContentInsights(insights);

    const { data: accounts } = await supabase.from('connected_accounts').select('platform, is_active').eq('user_id', user.id).eq('is_active', true);
    setConnections({ github: (accounts || []).some(a => a.platform === 'github'), x: (accounts || []).some(a => a.platform === 'x'), linkedin: (accounts || []).some(a => a.platform === 'linkedin') });

    const { data: commitData } = await supabase.from('github_commits').select('*').eq('user_id', user.id).order('committed_at', { ascending: false }).limit(5);
    if (commitData) {
      setCommits(commitData.map(c => ({
        message: c.message || c.commit_message || 'Commit',
        time: new Date(c.committed_at || c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        postsGenerated: c.posts_generated || 0,
      })));
    }
    setLoading(false);
  };

  const toggleAutopilot = async () => {
    setAutopilotToggling(true);
    try {
      const newEnabled = !profile?.autopilot_enabled;
      await supabase.from('profiles').update({ autopilot_enabled: newEnabled }).eq('id', user.id);
      setProfile(prev => ({ ...prev, autopilot_enabled: newEnabled }));
      addToast(newEnabled ? 'Autopilot activated!' : 'Autopilot paused', 'success');
    } catch (e) { addToast('Failed to update', 'error'); }
    setAutopilotToggling(false);
  };

  const handleApprove = async (postId) => {
    setActionLoading(postId);
    const { error } = await supabase.from('posts').update({ status: 'scheduled' }).eq('id', postId);
    addToast(error ? 'Failed to approve post' : 'Post approved and scheduled!', error ? 'error' : 'success');
    setActionLoading(null); await loadDashboardData();
  };

  const handleReject = async (postId) => {
    setActionLoading(postId);
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    addToast(error ? 'Failed to delete post' : 'Post deleted', error ? 'error' : 'success');
    setActionLoading(null); await loadDashboardData();
  };

  const handleSavePost = async (postId, hookContent, plugContent) => {
    const updateData = { content: hookContent, hook_content: hookContent, updated_at: new Date().toISOString() };
    if (plugContent !== undefined) updateData.plug_content = plugContent;
    const { error } = await supabase.from('posts').update(updateData).eq('id', postId);
    addToast(error ? 'Failed to update post' : 'Post updated!', error ? 'error' : 'success');
    await loadDashboardData();
  };

  const handleGenerateContent = async (days) => {
    setGenerating(true);
    try {
      const res = await fetch('/api/content/generate-batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, postsPerDay: 5, days }) });
      const data = await res.json();
      if (data.success) { addToast(`Generated ${data.generated} posts!`, 'success'); await loadDashboardData(); }
      else if (data.needsOnboarding) { window.location.href = '/onboarding'; }
      else { addToast(data.error || 'Generation failed', 'error'); }
    } catch (e) { addToast('Failed to generate content', 'error'); }
    setGenerating(false);
  };

  const runway = stats.scheduledCount > 0 ? Math.ceil(stats.scheduledCount / stats.postsLimit) : 0;

  if (loading) {
    return (<div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center"><div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /></div>);
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-6 lg:p-8 max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Mission Control</h1>
            <p className="text-sm text-gray-500 mt-1">{profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}` : 'Your marketing autopilot'}</p>
          </div>
          <button onClick={loadDashboardData} className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl border border-gray-200 transition-colors">
            <IconRefresh className="w-5 h-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="mb-6">
          <StatusBar
            isActive={profile?.autopilot_enabled}
            nextPostTime={scheduledPosts[0]?.scheduled_at}
            runway={runway}
            connections={connections}
            onToggle={toggleAutopilot}
            toggling={autopilotToggling}
            totalPosted={stats.totalPosted}
            totalClicks={stats.totalClicks}
          />
        </div>

        {/* Main grid: Action Deck (left) + Signal Feed + Intelligence (right) */}
        <div className="grid lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">
                Action Deck
                {stats.pendingCount > 0 && <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{stats.pendingCount} pending</span>}
              </h2>
              <Link href="/dashboard/queue" className="text-xs text-gray-500 hover:text-gray-700 font-medium">View All →</Link>
            </div>
            {pendingPosts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4"><IconCheck className="w-7 h-7 text-emerald-600" /></div>
                <h3 className="text-gray-900 font-medium mb-1">All caught up!</h3>
                <p className="text-sm text-gray-500 mb-1">{stats.postedThisWeek > 0 ? `${stats.postedThisWeek} posts went out this week.` : 'No pending posts to review.'}</p>
                {scheduledPosts[0]?.scheduled_at && <p className="text-xs text-gray-400 mb-5">Next: {new Date(scheduledPosts[0].scheduled_at).toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</p>}
                <button onClick={() => handleGenerateContent(7)} disabled={generating} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-xl hover:bg-gray-800 disabled:opacity-50">
                  <IconSparkles className="w-4 h-4" /> {generating ? 'Generating...' : "Generate This Week's Content"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPosts.slice(0, 5).map(post => (
                  <ActionCard key={post.id} post={post} platform={post.platform} onApprove={handleApprove} onReject={handleReject} onEdit={setEditingPost} isLoading={actionLoading === post.id} />
                ))}
                {stats.pendingCount > 5 && <Link href="/dashboard/queue" className="block text-center py-3 text-sm text-gray-500 hover:text-gray-700 bg-white rounded-xl border border-gray-200">+{stats.pendingCount - 5} more →</Link>}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Content Intelligence */}
            <ContentIntelligence insights={contentInsights} postsAnalyzed={postsWithEngagement} />
            {/* Signal Feed */}
            <SignalFeed commits={commits} runway={runway} scheduledCount={stats.scheduledCount} postedThisWeek={stats.postedThisWeek} onGenerate={handleGenerateContent} generating={generating} />
          </div>
        </div>

        {/* Week at a Glance */}
        <WeekAtAGlance posts={allPosts} />
      </div>
      {editingPost && <EditPostModal post={editingPost} onSave={handleSavePost} onClose={() => setEditingPost(null)} />}
    </div>
  );
}