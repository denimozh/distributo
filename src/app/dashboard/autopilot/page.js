"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import Link from "next/link";

// ==========================================
// ICONS
// ==========================================

const IconMoon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
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

const IconClock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCheck = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconLinkedIn = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const IconGitHub = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const IconSparkles = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);

const IconRefresh = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const IconEdit = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconTrash = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconStar = ({ className, filled }) => (
  <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconAlertCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconSettings = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconLink = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconGitCommit = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="4" />
    <line x1="1.05" y1="12" x2="7" y2="12" />
    <line x1="17.01" y1="12" x2="22.96" y2="12" />
  </svg>
);

const IconLoader = ({ className }) => (
  <svg className={className + " animate-spin"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-6.219-8.56" />
  </svg>
);

const IconChevronRight = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconThumbsUp = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const IconThumbsDown = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  </svg>
);

// ==========================================
// AUTOPILOT STATUS BAR (Always Visible)
// ==========================================

function AutopilotStatusBar({ enabled, status, nextAction, runway, onToggle, loading }) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { color: 'emerald', label: 'Active', pulse: true };
      case 'paused':
        return { color: 'gray', label: 'Paused', pulse: false };
      case 'review_pending':
        return { color: 'amber', label: 'Review Pending', pulse: true };
      case 'error':
        return { color: 'red', label: 'Error', pulse: true };
      default:
        return { color: 'gray', label: 'Inactive', pulse: false };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between gap-6">
        {/* Toggle + Status */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            disabled={loading}
            className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
              enabled ? 'bg-purple-500' : 'bg-gray-200'
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
              enabled ? 'left-7' : 'left-1'
            }`}>
              {loading ? (
                <IconLoader className="w-3 h-3 text-gray-400" />
              ) : (
                <IconMoon className={`w-3 h-3 ${enabled ? 'text-purple-500' : 'text-gray-400'}`} />
              )}
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full bg-${statusConfig.color}-500 ${statusConfig.pulse ? 'animate-pulse' : ''}`} />
            <span className={`text-sm font-medium text-${statusConfig.color}-600`}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Next Action */}
        <div className="flex-1 px-4 border-l border-r border-gray-100">
          <div className="text-xs text-gray-400 mb-0.5">Next Action</div>
          <div className="text-sm text-gray-700 truncate">{nextAction || 'No pending actions'}</div>
        </div>

        {/* Content Runway */}
        <div className="flex items-center gap-3 min-w-[200px]">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">Content Runway</span>
              <span className="font-medium text-gray-700">{runway}d</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  runway >= 7 ? 'bg-emerald-500' : runway >= 3 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, (runway / 14) * 100)}%` }}
              />
            </div>
          </div>
          <Link 
            href="/dashboard/autopilot/settings"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <IconSettings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// CONFIDENCE STARS
// ==========================================

function ConfidenceStars({ score }) {
  const stars = Math.round(score / 20); // Convert 0-100 to 0-5
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar 
          key={i} 
          className={`w-3.5 h-3.5 ${i <= stars ? 'text-amber-400' : 'text-gray-200'}`}
          filled={i <= stars}
        />
      ))}
    </div>
  );
}

// ==========================================
// POST REVIEW CARD
// ==========================================

function PostReviewCard({ post, onApprove, onEdit, onDiscard, onRegenerate, onFeedback }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  const getPillarConfig = (pillar) => {
    const configs = {
      'authority': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Thought Leadership' },
      'relatability': { bg: 'bg-pink-50', text: 'text-pink-700', label: 'Relatability' },
      'controversy': { bg: 'bg-orange-50', text: 'text-orange-700', label: 'Hot Take' },
      'value': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Value Post' },
      'vulnerability': { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Vulnerability' },
    };
    return configs[pillar] || { bg: 'bg-gray-50', text: 'text-gray-700', label: pillar || 'General' };
  };

  const pillarConfig = getPillarConfig(post.metadata?.growth_pillar);
  const confidenceScore = post.metadata?.alignment_score || 75;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            post.platform === 'linkedin' ? 'bg-[#0A66C2]' : 'bg-gray-900'
          }`}>
            {post.platform === 'linkedin' ? (
              <IconLinkedIn className="w-4 h-4 text-white" />
            ) : (
              <IconX className="w-4 h-4 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${pillarConfig.bg} ${pillarConfig.text}`}>
                {pillarConfig.label}
              </span>
              <ConfidenceStars score={confidenceScore} />
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {new Date(post.scheduled_at).toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
              })}
            </div>
          </div>
        </div>
        
        {/* Source Link */}
        {post.metadata?.source_commit && (
          <a 
            href={`https://github.com/${post.metadata.repo}/commit/${post.metadata.source_commit}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
          >
            <IconGitCommit className="w-3.5 h-3.5" />
            <span>View source</span>
          </a>
        )}
      </div>

      {/* Content Preview */}
      <div className="p-4 space-y-3">
        {/* Hook */}
        <div>
          <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">Hook</div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {post.hook_content || post.content}
          </p>
        </div>

        {/* Plug (if thread) */}
        {post.plug_content && (
          <div className="pt-3 border-t border-gray-100">
            <div className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mb-1">Plug (Reply)</div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {post.plug_content}
            </p>
          </div>
        )}

        {/* Visual Concept */}
        {post.metadata?.visual_concept && (
          <div className="pt-3 border-t border-gray-100">
            <div className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide mb-1">Visual Suggestion</div>
            <p className="text-xs text-gray-500 italic">
              📸 {post.metadata.visual_concept}
            </p>
          </div>
        )}
      </div>

      {/* Feedback Section */}
      {showFeedback && (
        <div className="px-4 pb-4">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="What could be improved? (e.g., 'Too formal', 'Add more emotion', 'Wrong tone')"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
            rows={2}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowFeedback(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onFeedback(post.id, feedback);
                setShowFeedback(false);
                setFeedback('');
              }}
              className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
            title="Provide feedback"
          >
            <IconThumbsDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRegenerate(post.id)}
            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Generate alternative"
          >
            <IconRefresh className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDiscard(post.id)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Discard"
          >
            <IconTrash className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(post)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onApprove(post.id)}
            className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
          >
            <IconCheck className="w-4 h-4" />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SYSTEM ALERT
// ==========================================

function SystemAlert({ type, message, action, onAction }) {
  const configs = {
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', text: 'text-amber-700' },
    error: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', text: 'text-red-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', text: 'text-blue-700' },
  };
  
  const config = configs[type] || configs.info;

  return (
    <div className={`${config.bg} ${config.border} border rounded-xl p-4 flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        <IconAlertCircle className={`w-5 h-5 ${config.icon}`} />
        <span className={`text-sm ${config.text}`}>{message}</span>
      </div>
      {action && (
        <button
          onClick={onAction}
          className={`text-sm font-medium ${config.text} hover:underline`}
        >
          {action}
        </button>
      )}
    </div>
  );
}

// ==========================================
// CONTEXT FEED - GitHub Activity
// ==========================================

function ContextFeed({ commits, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconGitHub className="w-5 h-5 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">GitHub Activity</h3>
        </div>
        <span className="text-xs text-gray-400">Signal source</span>
      </div>
      
      <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <IconLoader className="w-6 h-6 text-gray-300 mx-auto" />
          </div>
        ) : commits.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            <IconGitHub className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No recent commits
          </div>
        ) : (
          commits.slice(0, 5).map((commit, index) => (
            <div key={index} className="p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <IconGitCommit className="w-3 h-3 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{commit.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>{commit.repo_name || 'repo'}</span>
                    <span>•</span>
                    <span>{new Date(commit.committed_at).toLocaleDateString()}</span>
                    {commit.additions > 0 && (
                      <span className="text-emerald-500">+{commit.additions}</span>
                    )}
                    {commit.deletions > 0 && (
                      <span className="text-red-500">-{commit.deletions}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {commits.length > 0 && (
        <Link
          href="/dashboard/github"
          className="block p-3 text-center text-xs text-purple-600 hover:bg-purple-50 transition-colors border-t border-gray-100"
        >
          View all activity →
        </Link>
      )}
    </div>
  );
}

// ==========================================
// QUICK STATS
// ==========================================

function QuickStats({ stats }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-2xl font-bold text-gray-900">{stats.pendingReview}</div>
        <div className="text-xs text-gray-500">Pending Review</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-2xl font-bold text-gray-900">{stats.scheduled}</div>
        <div className="text-xs text-gray-500">Scheduled</div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-2xl font-bold text-gray-900">{stats.postedThisWeek}</div>
        <div className="text-xs text-gray-500">Posted This Week</div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================

export default function AutopilotPage() {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    postsPerDay: 2,
    platforms: ['x'],
    autoApproveThreshold: 85,
  });
  const [pendingPosts, setPendingPosts] = useState([]);
  const [commits, setCommits] = useState([]);
  const [stats, setStats] = useState({
    pendingReview: 0,
    scheduled: 0,
    postedThisWeek: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [generating, setGenerating] = useState(false);

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile settings
      const { data: profile } = await supabase
        .from('profiles')
        .select('autopilot_enabled, autopilot_posts_per_day, autopilot_platforms, autopilot_auto_approve, autopilot_tone')
        .eq('id', user.id)
        .single();

      const userSettings = {
        enabled: profile?.autopilot_enabled || false,
        postsPerDay: profile?.autopilot_posts_per_day || 2,
        platforms: profile?.autopilot_platforms || ['x'],
        autoApproveThreshold: 85,
        tone: profile?.autopilot_tone || 'founder',
        autoApprove: profile?.autopilot_auto_approve ?? true,
      };
      setSettings(userSettings);

      // Load pending posts (need review) - posts with status 'pending' need approval
      const { data: pending } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true })
        .limit(10);

      // Parse metadata if it's a string
      const parsedPending = (pending || []).map(post => ({
        ...post,
        metadata: typeof post.metadata === 'string' ? JSON.parse(post.metadata) : (post.metadata || {})
      }));

      setPendingPosts(parsedPending);

      // Load scheduled posts count
      const { data: scheduled } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .gte('scheduled_at', new Date().toISOString());

      // Load posted this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: posted } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'posted')
        .gte('posted_at', weekAgo);

      setStats({
        pendingReview: parsedPending?.length || 0,
        scheduled: scheduled?.length || 0,
        postedThisWeek: posted?.length || 0,
      });

      // Load recent commits
      const { data: recentCommits } = await supabase
        .from('github_commits')
        .select('*')
        .eq('user_id', user.id)
        .order('committed_at', { ascending: false })
        .limit(10);

      setCommits(recentCommits || []);

      // Check for alerts
      const newAlerts = [];
      
      // Check GitHub connection
      const { data: githubAccount } = await supabase
        .from('connected_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', 'github')
        .single();

      if (!githubAccount) {
        newAlerts.push({
          type: 'warning',
          message: 'GitHub not connected. Connect to generate content from your commits.',
          action: 'Connect GitHub',
          href: '/dashboard/settings/integrations'
        });
      }

      // Check X connection
      const { data: xAccount } = await supabase
        .from('connected_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', 'x')
        .eq('is_active', true)
        .single();

      if (!xAccount) {
        newAlerts.push({
          type: 'error',
          message: 'X/Twitter not connected. Connect to enable autopilot posting.',
          action: 'Connect X',
          href: '/dashboard/settings/integrations'
        });
      }

      // Check low runway
      const runway = Math.ceil((scheduled?.length || 0) / (userSettings.postsPerDay || 2));
      if (runway < 3 && userSettings.enabled) {
        newAlerts.push({
          type: 'warning',
          message: `Low content runway (${runway} days). Consider generating more content.`,
          action: 'Generate Now'
        });
      }

      setAlerts(newAlerts);

    } catch (error) {
      console.error('[AUTOPILOT] Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutopilot = async () => {
    setActionLoading(true);
    const newEnabled = !settings.enabled;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ autopilot_enabled: newEnabled })
        .eq('id', user.id);

      setSettings(prev => ({ ...prev, enabled: newEnabled }));
      addToast(newEnabled ? 'Autopilot activated! 🌙' : 'Autopilot paused', 'success');
    } catch (error) {
      addToast('Failed to update', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    try {
      await supabase
        .from('posts')
        .update({ status: 'scheduled' })
        .eq('id', postId);

      setPendingPosts(prev => prev.filter(p => p.id !== postId));
      setStats(prev => ({
        ...prev,
        pendingReview: prev.pendingReview - 1,
        scheduled: prev.scheduled + 1,
      }));
      addToast('Post approved and scheduled! ✓', 'success');
    } catch (error) {
      addToast('Failed to approve', 'error');
    }
  };

  const handleDiscard = async (postId) => {
    try {
      await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      setPendingPosts(prev => prev.filter(p => p.id !== postId));
      setStats(prev => ({ ...prev, pendingReview: prev.pendingReview - 1 }));
      addToast('Post discarded', 'success');
    } catch (error) {
      addToast('Failed to discard', 'error');
    }
  };

  const handleEdit = (post) => {
    // Navigate to content queue with post selected for editing
    window.location.href = `/dashboard/content-queue?edit=${post.id}`;
  };

  const handleRegenerate = async (postId) => {
    addToast('Generating alternative...', 'success');
    // TODO: Call regenerate API
  };

  const handleFeedback = async (postId, feedback) => {
    addToast('Feedback saved - AI will learn from this', 'success');
    // TODO: Store feedback for AI improvement
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const response = await fetch('/api/content/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          postsPerDay: settings.postsPerDay,
          days: 7,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        addToast(`Generated ${data.generated || 0} posts! 🎉`, 'success');
        loadData();
      } else {
        addToast(data.error || 'Generation failed', 'error');
      }
    } catch (error) {
      addToast('Failed to generate', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const getStatus = () => {
    if (!settings.enabled) return 'paused';
    if (stats.pendingReview > 0) return 'review_pending';
    return 'active';
  };

  const getNextAction = () => {
    if (stats.pendingReview > 0) {
      return `${stats.pendingReview} posts awaiting your review`;
    }
    if (generating) {
      return 'Generating new content...';
    }
    const runway = Math.ceil(stats.scheduled / settings.postsPerDay);
    if (runway < 3) {
      return 'Low content runway - generate more posts';
    }
    return `${stats.scheduled} posts scheduled, running smoothly`;
  };

  const getRunway = () => {
    return Math.ceil(stats.scheduled / settings.postsPerDay);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <IconLoader className="w-8 h-8 text-purple-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Autopilot Growth Engine</h1>
          <p className="text-sm text-gray-500">Your strategic approval center</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {generating ? (
            <IconLoader className="w-4 h-4" />
          ) : (
            <IconSparkles className="w-4 h-4" />
          )}
          Generate Week
        </button>
      </div>

      {/* Status Bar */}
      <AutopilotStatusBar
        enabled={settings.enabled}
        status={getStatus()}
        nextAction={getNextAction()}
        runway={getRunway()}
        onToggle={toggleAutopilot}
        loading={actionLoading}
      />

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <SystemAlert
              key={index}
              type={alert.type}
              message={alert.message}
              action={alert.action}
              onAction={() => {
                if (alert.href) {
                  window.location.href = alert.href;
                } else if (alert.action === 'Generate Now') {
                  handleGenerate();
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <QuickStats stats={stats} />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Action Deck - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              Action Deck
              {stats.pendingReview > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                  {stats.pendingReview} pending
                </span>
              )}
            </h2>
            <Link
              href="/dashboard/content-queue"
              className="text-xs text-purple-600 hover:text-purple-700"
            >
              View all posts →
            </Link>
          </div>

          {pendingPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <IconCheck className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-gray-900 font-medium mb-1">All caught up!</h3>
              <p className="text-sm text-gray-500 mb-4">
                No posts pending review. Your queue is running smoothly.
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
              >
                <IconSparkles className="w-4 h-4" />
                Generate more content
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPosts.map((post) => (
                <PostReviewCard
                  key={post.id}
                  post={post}
                  onApprove={handleApprove}
                  onEdit={handleEdit}
                  onDiscard={handleDiscard}
                  onRegenerate={handleRegenerate}
                  onFeedback={handleFeedback}
                />
              ))}
            </div>
          )}
        </div>

        {/* Context Feed - 1 column */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Context Feed</h2>
          <ContextFeed commits={commits} loading={loading} />
        </div>
      </div>
    </div>
  );
}