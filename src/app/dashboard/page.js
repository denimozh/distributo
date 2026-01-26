"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

// ==========================================
// ICON COMPONENTS
// ==========================================

const IconBolt = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconCheck = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconEdit = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconClock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCalendar = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconTrendingUp = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconSend = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconActivity = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const IconRefresh = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconChevronRight = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconChevronLeft = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconZap = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconGitCommit = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <line x1="1.05" y1="12" x2="7" y2="12" />
    <line x1="17.01" y1="12" x2="22.96" y2="12" />
  </svg>
);

const IconMessageCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconTwitterX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconLinkedIn = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const IconLink = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconThread = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// ==========================================
// AUTOPILOT STATUS BAR
// ==========================================

function AutopilotStatusBar({ isActive, nextPostTime, systemHealth, postsToday, postsLimit }) {
  const [timeUntilNext, setTimeUntilNext] = useState('');

  useEffect(() => {
    if (!nextPostTime) return;
    
    const updateTime = () => {
      const now = new Date();
      const next = new Date(nextPostTime);
      const diff = next - now;
      
      if (diff <= 0) {
        setTimeUntilNext('Any moment...');
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        setTimeUntilNext(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilNext(`${minutes}m`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [nextPostTime]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${isActive ? 'bg-emerald-100' : 'bg-gray-100'} flex items-center justify-center`}>
            <IconBolt className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className={`text-sm font-semibold ${isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                {isActive ? 'Autopilot Active' : 'Autopilot Inactive'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {isActive ? 'System running smoothly' : 'No scheduled posts'}
            </p>
          </div>
        </div>
        {nextPostTime && (
          <div className="text-right">
            <div className="text-xs text-gray-400">Next Post</div>
            <div className="text-xl font-bold text-gray-900">{timeUntilNext}</div>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>System Health</span>
          <span className={systemHealth >= 75 ? 'text-emerald-600' : systemHealth >= 50 ? 'text-amber-600' : 'text-red-600'}>
            {systemHealth}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              systemHealth >= 75 ? 'bg-emerald-500' :
              systemHealth >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${systemHealth}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{postsToday}/{postsLimit} posts today</span>
          <span>All systems operational</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ACTION CARD (Pending Post) - FIXED WIDTH
// ==========================================

function ActionCard({ post, platform, onApprove, onReject, onEdit, isLoading }) {
  const PlatformIcon = platform === 'linkedin' ? IconLinkedIn : IconTwitterX;
  const charLimit = platform === 'x' ? 280 : 3000;
  const content = post.hook_content || post.content || '';
  const hasPlug = post.plug_content && post.plug_content.trim().length > 0;

  return (
    <div className="w-[280px] flex-shrink-0 bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center">
              <PlatformIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900">Ready to Post</span>
            {hasPlug && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-semibold">
                <IconThread className="w-2.5 h-2.5" />
                1/2
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">{content.length}/{charLimit}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed min-h-[80px]">
          {content}
        </p>
        {hasPlug && (
          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex items-center gap-1.5 text-xs text-blue-600">
            <IconLink className="w-3 h-3" />
            <span>+ Reply with link (protected reach)</span>
          </div>
        )}
        {post.scheduled_at && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-400">
            <IconClock className="w-3.5 h-3.5" />
            <span>
              {new Date(post.scheduled_at).toLocaleDateString('en-US', { weekday: 'short' })}{' '}
              {new Date(post.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-3 bg-gray-50 flex items-center gap-2 border-t border-gray-100">
        <button
          onClick={() => onApprove(post.id)}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <IconCheck className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={() => onEdit(post)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors border border-gray-200"
        >
          <IconEdit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onReject(post.id)}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-gray-200"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// STAT CARD
// ==========================================

function StatCard({ label, value, icon: Icon, trend, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

// ==========================================
// ACTIVITY LOG
// ==========================================

function ActivityLog({ activities }) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'post_created': return { icon: IconSend, color: 'text-blue-500', bg: 'bg-blue-100' };
      case 'post_published': return { icon: IconCheck, color: 'text-emerald-500', bg: 'bg-emerald-100' };
      case 'commit_received': return { icon: IconGitCommit, color: 'text-purple-500', bg: 'bg-purple-100' };
      case 'content_generated': return { icon: IconZap, color: 'text-amber-500', bg: 'bg-amber-100' };
      case 'reply_opportunity': return { icon: IconMessageCircle, color: 'text-cyan-500', bg: 'bg-cyan-100' };
      default: return { icon: IconActivity, color: 'text-gray-400', bg: 'bg-gray-100' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Activity Log</h3>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>
      <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No recent activity
          </div>
        ) : (
          activities.map((activity, index) => {
            const { icon: Icon, color, bg } = getActivityIcon(activity.type);
            return (
              <div key={index} className="p-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700">{activity.message}</p>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// QUICK ACTIONS
// ==========================================

function QuickActions({ onGenerateToday, onGenerateWeek, generating }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-3">
        <button
          onClick={onGenerateToday}
          disabled={generating}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <IconZap className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900 block">Generate Today</span>
              <span className="text-xs text-gray-500">5 posts for today</span>
            </div>
          </div>
          <IconChevronRight className="w-4 h-4 text-gray-400" />
        </button>
        <button
          onClick={onGenerateWeek}
          disabled={generating}
          className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-left transition-colors disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
              <IconCalendar className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <span className="text-sm font-medium text-gray-900 block">Generate Week</span>
              <span className="text-xs text-gray-500">35 posts for 7 days</span>
            </div>
          </div>
          <IconChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// EDIT POST MODAL - TYPEFULLY STYLE WITH HOOK + PLUG
// ==========================================

function EditPostModal({ post, onSave, onClose }) {
  const [hookContent, setHookContent] = useState(post?.hook_content || post?.content || '');
  const [plugContent, setPlugContent] = useState(post?.plug_content || '');
  const [saving, setSaving] = useState(false);
  
  const maxLength = post?.platform === 'linkedin' ? 3000 : 280;
  const hookOverLimit = hookContent.length > maxLength;
  const plugOverLimit = plugContent.length > maxLength;
  const hasPlug = post?.plug_content || post?.is_thread;

  const handleSave = async () => {
    if (hookOverLimit || (hasPlug && plugOverLimit)) return;
    setSaving(true);
    await onSave(post.id, hookContent, plugContent);
    setSaving(false);
    onClose();
  };

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
              <IconTwitterX className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Edit Thread</h3>
              <p className="text-xs text-gray-500">Hook + Plug Strategy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <IconX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Hook Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <span className="text-sm font-medium text-gray-900">HOOK</span>
                <span className="text-xs text-gray-400">Main Tweet</span>
              </div>
              <span className={`text-xs ${hookOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {hookContent.length}/{maxLength}
              </span>
            </div>
            <div className="relative">
              <textarea
                value={hookContent}
                onChange={(e) => setHookContent(e.target.value)}
                rows={4}
                className={`w-full bg-gray-50 border rounded-xl p-4 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  hookOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="Write your hook - the attention grabber (no links!)"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-gray-400">
                <IconLink className="w-3 h-3 line-through" />
                <span className="line-through">No links</span>
              </div>
            </div>
          </div>

          {/* Connector */}
          {hasPlug && (
            <div className="flex items-center gap-3 py-1">
              <div className="w-6 flex justify-center">
                <div className="w-0.5 h-8 bg-gray-200 rounded-full" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <IconClock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">60s auto-reply delay</span>
              </div>
            </div>
          )}

          {/* Plug Section */}
          {hasPlug && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-600">2</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">PLUG</span>
                  <span className="text-xs text-gray-400">Reply with Link</span>
                </div>
                <span className={`text-xs ${plugOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {plugContent.length}/{maxLength}
                </span>
              </div>
              <div className="relative">
                <textarea
                  value={plugContent}
                  onChange={(e) => setPlugContent(e.target.value)}
                  rows={3}
                  className={`w-full bg-emerald-50 border rounded-xl p-4 text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                    plugOverLimit ? 'border-red-300 bg-red-50' : 'border-emerald-200'
                  }`}
                  placeholder="Add your link and call-to-action here..."
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-1 text-xs text-emerald-600">
                  <IconLink className="w-3 h-3" />
                  <span>Link here ✓</span>
                </div>
              </div>
            </div>
          )}

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <IconZap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <span className="font-medium">Algorithm Optimized:</span> Links in replies get 3-5x more reach than inline links. 
              The hook captures attention, the plug converts.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <IconClock className="w-3.5 h-3.5" />
            <span>
              Scheduled: {new Date(post.scheduled_at).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric', 
                minute: '2-digit' 
              })}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || hookOverLimit || (hasPlug && plugOverLimit) || !hookContent.trim()}
              className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN DASHBOARD
// ==========================================

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  
  const [stats, setStats] = useState({
    postsToday: 0,
    postsLimit: 5,
    pendingCount: 0,
    scheduledCount: 0,
    postedThisWeek: 0,
  });
  const [pendingPosts, setPendingPosts] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [activities, setActivities] = useState([]);

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    loadDashboardData();
    
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadDashboardData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    setUser(user);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(profileData);

    // Get posts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });

    const allPosts = posts || [];
    const pending = allPosts.filter(p => p.status === 'pending');
    const scheduled = allPosts.filter(p => p.status === 'scheduled');
    const postedToday = allPosts.filter(p => p.status === 'posted' && new Date(p.posted_at) >= today);
    const postedThisWeek = allPosts.filter(p => p.status === 'posted' && new Date(p.posted_at) >= weekAgo);

    setPendingPosts(pending.slice(0, 10));
    setScheduledPosts(scheduled.slice(0, 5));
    setStats({
      postsToday: postedToday.length,
      postsLimit: 5,
      pendingCount: pending.length,
      scheduledCount: scheduled.length,
      postedThisWeek: postedThisWeek.length,
    });

    // Build activities
    const recentPosts = allPosts.slice(0, 10);
    const activityList = recentPosts.map(post => ({
      type: post.status === 'posted' ? 'post_published' : 'post_created',
      message: post.status === 'posted' 
        ? `Posted: "${post.content?.slice(0, 40)}..."` 
        : `Created: "${post.content?.slice(0, 40)}..."`,
      time: new Date(post.updated_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    }));
    setActivities(activityList);
    setLoading(false);
  };

  const handleApprove = async (postId) => {
    setActionLoading(postId);
    const { error } = await supabase
      .from('posts')
      .update({ status: 'scheduled' })
      .eq('id', postId);
    
    if (error) {
      addToast('Failed to approve post', 'error');
    } else {
      addToast('Post approved and scheduled!', 'success');
    }
    setActionLoading(null);
    await loadDashboardData();
  };

  const handleReject = async (postId) => {
    setActionLoading(postId);
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    
    if (error) {
      addToast('Failed to delete post', 'error');
    } else {
      addToast('Post deleted', 'success');
    }
    setActionLoading(null);
    await loadDashboardData();
  };

  const handleSavePost = async (postId, hookContent, plugContent) => {
    const updateData = {
      content: hookContent,
      hook_content: hookContent,
      updated_at: new Date().toISOString(),
    };
    
    // Only update plug_content if the post has one
    if (plugContent !== undefined) {
      updateData.plug_content = plugContent;
    }

    const { error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId);

    if (error) {
      addToast('Failed to update post', 'error');
    } else {
      addToast('Post updated!', 'success');
    }
    await loadDashboardData();
  };

  const handleGenerateContent = async (days) => {
    setGenerating(true);
    try {
      const response = await fetch('/api/content/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          postsPerDay: 5,
          days,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        addToast(`Generated ${data.generated} posts!`, 'success');
        await loadDashboardData();
      } else if (data.needsOnboarding) {
        window.location.href = '/onboarding';
      } else {
        addToast(data.error || 'Generation failed', 'error');
      }
    } catch (error) {
      addToast('Failed to generate content', 'error');
    }
    setGenerating(false);
  };

  const systemHealth = Math.min(100, Math.round(
    ((profile?.product_name ? 25 : 0) +
    (pendingPosts.length > 0 || scheduledPosts.length > 0 ? 25 : 0) +
    (stats.postedThisWeek > 0 ? 25 : 0) + 25)
  ));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-xl border border-gray-200 transition-colors"
          >
            <IconRefresh className="w-5 h-5" />
          </button>
        </div>

        {/* Autopilot Status */}
        <div className="mb-8">
          <AutopilotStatusBar
            isActive={profile?.autopilot_enabled || stats.scheduledCount > 0}
            nextPostTime={scheduledPosts[0]?.scheduled_at}
            systemHealth={systemHealth}
            postsToday={stats.postsToday}
            postsLimit={stats.postsLimit}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Posts Today" value={`${stats.postsToday}/${stats.postsLimit}`} icon={IconCalendar} color="blue" />
          <StatCard label="Pending Approval" value={stats.pendingCount} icon={IconClock} color="amber" />
          <StatCard label="Scheduled" value={stats.scheduledCount} icon={IconSend} color="purple" />
          <StatCard label="Posted This Week" value={stats.postedThisWeek} icon={IconTrendingUp} color="emerald" trend={15} />
        </div>

        {/* Pending Approval - FIXED OVERFLOW */}
        {pendingPosts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Pending Approval</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{pendingPosts.length} posts</span>
                <Link href="/dashboard/queue" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                  View All →
                </Link>
              </div>
            </div>
            {/* Horizontal scroll container with proper overflow hidden on parent */}
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {pendingPosts.slice(0, 5).map((post) => (
                  <ActionCard
                    key={post.id}
                    post={post}
                    platform={post.platform}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onEdit={setEditingPost}
                    isLoading={actionLoading === post.id}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityLog activities={activities} />
          </div>
          <div>
            <QuickActions
              onGenerateToday={() => handleGenerateContent(1)}
              onGenerateWeek={() => handleGenerateContent(7)}
              generating={generating}
            />
          </div>
        </div>
      </div>

      {editingPost && (
        <EditPostModal post={editingPost} onSave={handleSavePost} onClose={() => setEditingPost(null)} />
      )}
    </div>
  );
}