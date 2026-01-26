"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

// ==========================================
// ICONS
// ==========================================

const IconSearch = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const IconX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconHeart = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconMessageCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconRepeat = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const IconEye = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconZap = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconSend = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const IconExternalLink = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const IconRefresh = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconPlus = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTwitterX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconCheck = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconCopy = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconChevronLeft = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconFilter = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const IconStar = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconClock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconTarget = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

// ==========================================
// SWIPE CARD COMPONENT (Tinder-style)
// ==========================================

function SwipeCard({ opportunity, onReply, onSkip, onGenerateReply, isGenerating, generatedReply, isActive }) {
  const [exitDirection, setExitDirection] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (generatedReply) {
      setReplyText(generatedReply);
      setShowReplyBox(true);
    }
  }, [generatedReply]);

  const handleSwipeLeft = () => {
    setExitDirection('left');
    setTimeout(() => onSkip(opportunity.id), 300);
  };

  const handleSwipeRight = () => {
    if (!showReplyBox) {
      onGenerateReply(opportunity);
    }
  };

  const handleCopyAndOpen = () => {
    navigator.clipboard.writeText(replyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    window.open(opportunity.url, '_blank');
    onReply(opportunity.id, replyText);
  };

  const relevanceColor = opportunity.relevance >= 90 ? 'text-emerald-500 bg-emerald-50' :
    opportunity.relevance >= 75 ? 'text-blue-500 bg-blue-50' :
    opportunity.relevance >= 60 ? 'text-amber-500 bg-amber-50' : 'text-gray-500 bg-gray-50';

  if (!isActive) return null;

  return (
    <div
      className={`absolute inset-0 transition-all duration-300 ${
        exitDirection === 'left' ? '-translate-x-full opacity-0 rotate-[-10deg]' :
        exitDirection === 'right' ? 'translate-x-full opacity-0 rotate-[10deg]' : ''
      }`}
    >
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden h-full flex flex-col">
        {/* Card Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {opportunity.avatarUrl ? (
              <img src={opportunity.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {opportunity.authorName?.charAt(0) || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 truncate">{opportunity.authorName}</span>
                {opportunity.isVerified && <IconCheck className="w-4 h-4 text-blue-500" />}
              </div>
              <div className="text-sm text-gray-500">{opportunity.author}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{opportunity.timeAgo}</span>
                {opportunity.matchedKeyword && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded-full">
                    #{opportunity.matchedKeyword}
                  </span>
                )}
              </div>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${relevanceColor}`}>
              {opportunity.relevance}%
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="flex-1 p-5 overflow-y-auto">
          <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
            {opportunity.content}
          </p>

          {/* Engagement Stats */}
          <div className="flex items-center gap-6 mt-6 py-4 border-y border-gray-100">
            <div className="flex items-center gap-2 text-gray-500">
              <IconHeart className="w-5 h-5" />
              <span className="font-medium">{formatNumber(opportunity.engagement?.likes || 0)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <IconMessageCircle className="w-5 h-5" />
              <span className="font-medium">{formatNumber(opportunity.engagement?.replies || 0)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <IconRepeat className="w-5 h-5" />
              <span className="font-medium">{formatNumber(opportunity.engagement?.reposts || 0)}</span>
            </div>
            {opportunity.engagement?.impressions > 0 && (
              <div className="flex items-center gap-2 text-gray-500">
                <IconEye className="w-5 h-5" />
                <span className="font-medium">{formatNumber(opportunity.engagement.impressions)}</span>
              </div>
            )}
          </div>

          {/* Why This Post Badge */}
          {opportunity.isQuestion && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <IconTarget className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700 font-medium">This is a question - great reply opportunity!</span>
            </div>
          )}

          {/* Reply Box */}
          {showReplyBox && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <IconZap className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-gray-900">AI-Generated Reply</span>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                placeholder="Your reply..."
              />
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{replyText.length}/280</span>
                <span className={replyText.length > 280 ? 'text-red-500 font-medium' : ''}>
                  {replyText.length > 280 ? 'Too long!' : 'Good length'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card Actions */}
        <div className="p-5 border-t border-gray-100 bg-gray-50">
          {!showReplyBox ? (
            <div className="flex items-center justify-center gap-6">
              {/* Skip Button */}
              <button
                onClick={handleSwipeLeft}
                className="w-16 h-16 rounded-full bg-white border-2 border-red-200 flex items-center justify-center text-red-400 hover:border-red-400 hover:text-red-500 hover:scale-110 transition-all shadow-lg"
              >
                <IconX className="w-8 h-8" />
              </button>

              {/* View Original */}
              <a
                href={opportunity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all"
              >
                <IconExternalLink className="w-5 h-5" />
              </a>

              {/* Generate Reply Button */}
              <button
                onClick={handleSwipeRight}
                disabled={isGenerating}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg disabled:opacity-50"
              >
                {isGenerating ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <IconZap className="w-8 h-8" />
                )}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowReplyBox(false);
                  setReplyText('');
                }}
                className="px-4 py-3 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onGenerateReply(opportunity)}
                disabled={isGenerating}
                className="px-4 py-3 text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
              >
                {isGenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button
                onClick={handleCopyAndOpen}
                disabled={!replyText.trim() || replyText.length > 280}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <IconCheck className="w-5 h-5" />
                    Copied! Opening X...
                  </>
                ) : (
                  <>
                    <IconCopy className="w-5 h-5" />
                    Copy & Open in X
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// STATS BAR
// ==========================================

function StatsBar({ stats, apiStatus }) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">Opportunities</div>
        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">Replied</div>
        <div className="text-2xl font-bold text-emerald-600">{stats.replied}</div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">Skipped</div>
        <div className="text-2xl font-bold text-gray-400">{stats.skipped}</div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="text-xs text-gray-500 mb-1">API Status</div>
        <div className={`text-sm font-bold ${apiStatus === 'ok' ? 'text-emerald-600' : apiStatus === 'limited' ? 'text-amber-600' : 'text-red-600'}`}>
          {apiStatus === 'ok' ? '✓ Connected' : apiStatus === 'limited' ? '⚠ Rate Limited' : '✗ Needs Setup'}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// KEYWORD MANAGER
// ==========================================

function KeywordManager({ keywords, onAdd, onRemove }) {
  const [newKeyword, setNewKeyword] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAdd = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim().toLowerCase())) {
      onAdd(newKeyword.trim().toLowerCase());
      setNewKeyword('');
      setShowInput(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Keywords</h3>
        <button
          onClick={() => setShowInput(!showInput)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <IconPlus className="w-4 h-4" />
        </button>
      </div>
      
      {showInput && (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add keyword..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            autoFocus
          />
          <button onClick={handleAdd} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Add
          </button>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {keywords.length === 0 ? (
          <p className="text-sm text-gray-400">No keywords yet. Add some to find conversations.</p>
        ) : (
          keywords.map((kw, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm group">
              {kw}
              <button onClick={() => onRemove(kw)} className="text-gray-400 hover:text-red-500 transition-colors">
                <IconX className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>
      
      {/* Suggested Keywords */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 mb-2">Suggested for you:</p>
        <div className="flex flex-wrap gap-2">
          {['SaaS', 'indie hacker', 'startup', 'marketing automation', 'build in public'].filter(s => !keywords.includes(s.toLowerCase())).slice(0, 3).map((sug, i) => (
            <button
              key={i}
              onClick={() => onAdd(sug.toLowerCase())}
              className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
            >
              + {sug}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================

function EmptyState({ hasKeywords, onSearch, searching }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6">
          <IconSearch className="w-10 h-10 text-blue-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          {hasKeywords ? 'Ready to find opportunities' : 'Add keywords to get started'}
        </h2>
        <p className="text-gray-500 mb-6">
          {hasKeywords 
            ? 'Click the button below to search for high-value conversations you can reply to.'
            : 'Add keywords related to your product to find conversations where you can add value.'}
        </p>
        {hasKeywords && (
          <button
            onClick={onSearch}
            disabled={searching}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {searching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <IconSearch className="w-5 h-5" />
                Find Conversations
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function ReplyFinderPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  
  const [opportunities, setOpportunities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [keywords, setKeywords] = useState([]);
  
  const [generatingReply, setGeneratingReply] = useState(false);
  const [generatedReplies, setGeneratedReplies] = useState({});
  
  const [stats, setStats] = useState({ total: 0, replied: 0, skipped: 0 });
  const [apiStatus, setApiStatus] = useState('checking');

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    setUser(user);

    // Check X connection
    const { data: xAccount } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'x')
      .eq('is_active', true)
      .single();
    
    setApiStatus(xAccount ? 'ok' : 'disconnected');

    // Load keywords
    const { data: savedKeywords } = await supabase
      .from('reply_keywords')
      .select('keyword')
      .eq('user_id', user.id)
      .eq('is_active', true);
    
    setKeywords((savedKeywords || []).map(k => k.keyword));

    // Load existing opportunities
    const { data: savedOpps } = await supabase
      .from('reply_opportunities')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_replied', false)
      .eq('is_skipped', false)
      .order('relevance_score', { ascending: false })
      .limit(50);

    if (savedOpps && savedOpps.length > 0) {
      const formatted = savedOpps.map(formatOpportunity);
      setOpportunities(formatted);
    }

    // Get stats
    const { count: repliedCount } = await supabase
      .from('reply_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_replied', true);

    const { count: skippedCount } = await supabase
      .from('reply_opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_skipped', true);

    setStats({
      total: savedOpps?.length || 0,
      replied: repliedCount || 0,
      skipped: skippedCount || 0,
    });

    setLoading(false);
  };

  const formatOpportunity = (opp) => ({
    id: opp.id,
    platform: opp.platform,
    author: opp.author_username,
    authorName: opp.author_display_name,
    avatarUrl: opp.author_avatar_url,
    content: opp.content,
    relevance: opp.relevance_score,
    engagement: {
      likes: opp.likes_count || 0,
      replies: opp.replies_count || 0,
      reposts: opp.reposts_count || 0,
      impressions: opp.impressions_count || 0,
    },
    timeAgo: getTimeAgo(opp.posted_at),
    url: opp.post_url,
    isQuestion: opp.is_question,
    matchedKeyword: opp.matched_keyword,
  });

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'recently';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
  };

  const handleSearch = async () => {
    if (!user) return;
    
    setSearching(true);
    addToast('Searching X for conversations...', 'info');
    
    try {
      // Filter out any null/undefined keywords
      const validKeywords = keywords
        .map(k => k.keyword || k)  // Handle both {keyword: 'saas'} and 'saas'
        .filter(k => k && k !== null && k !== 'null');
      
      if (validKeywords.length === 0) {
        addToast('Add at least one keyword first', 'error');
        setSearching(false);
        return;
      }

      const response = await fetch('/api/reply-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          action: 'find_opportunities',
          keywords: validKeywords,
        }),
      });

      const data = await response.json();

      if (data.needsConnection) {
        setApiStatus('disconnected');
        addToast('Please connect your X account in Integrations', 'error');
      } else if (data.success) {
        await loadInitialData();
        addToast(`Found ${data.newOpportunities} new opportunities!`, 'success');
        setCurrentIndex(0);
      } else if (data.error?.includes('rate limit')) {
        setApiStatus('limited');
        addToast('Rate limited. Try again in 15 minutes.', 'error');
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      addToast(error.message || 'Failed to search', 'error');
    }

    setSearching(false);
  };

  const handleAddKeyword = async (keyword) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('reply_keywords')
      .insert({ user_id: user.id, keyword, is_active: true });

    if (!error) {
      setKeywords(prev => [...prev, keyword]);
      addToast(`Added "${keyword}"`, 'success');
    }
  };

  const handleRemoveKeyword = async (keyword) => {
    if (!user) return;
    
    await supabase
      .from('reply_keywords')
      .delete()
      .eq('user_id', user.id)
      .eq('keyword', keyword);
    
    setKeywords(prev => prev.filter(k => k !== keyword));
  };

  const handleSkip = async (oppId) => {
    await supabase
      .from('reply_opportunities')
      .update({ is_skipped: true })
      .eq('id', oppId);

    setOpportunities(prev => prev.filter(o => o.id !== oppId));
    setStats(prev => ({ ...prev, total: prev.total - 1, skipped: prev.skipped + 1 }));
    addToast('Skipped', 'success');
  };

  const handleReply = async (oppId, replyText) => {
    await supabase
      .from('reply_opportunities')
      .update({ is_replied: true })
      .eq('id', oppId);

    // Save the reply
    await supabase.from('user_replies').insert({
      user_id: user.id,
      opportunity_id: oppId,
      platform: 'x',
      reply_content: replyText,
      replied_at: new Date().toISOString(),
    });

    setOpportunities(prev => prev.filter(o => o.id !== oppId));
    setStats(prev => ({ ...prev, total: prev.total - 1, replied: prev.replied + 1 }));
    addToast('Reply tracked! Great job engaging.', 'success');
  };

  const handleGenerateReply = async (opportunity) => {
    setGeneratingReply(true);

    try {
      const response = await fetch('/api/x/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tweetContent: opportunity.content,
          tweetAuthor: opportunity.authorName,
          matchedKeyword: opportunity.matchedKeyword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedReplies(prev => ({ ...prev, [opportunity.id]: data.reply }));
      } else {
        throw new Error(data.error || 'Failed to generate reply');
      }
    } catch (error) {
      addToast(error.message || 'Failed to generate reply', 'error');
    }

    setGeneratingReply(false);
  };

  const currentOpportunity = opportunities[currentIndex];

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
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <IconHeart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Reply Finder</h1>
              <p className="text-sm text-gray-500">Swipe through high-value reply opportunities</p>
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || keywords.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {searching ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <IconRefresh className="w-5 h-5" />
            )}
            Find More
          </button>
        </div>

        {/* Stats */}
        <StatsBar stats={stats} apiStatus={apiStatus} />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-6">
            <KeywordManager
              keywords={keywords}
              onAdd={handleAddKeyword}
              onRemove={handleRemoveKeyword}
            />
            
            {/* Tips Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <IconZap className="w-5 h-5 text-blue-500" />
                Reply Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Reply within 10 mins for max visibility
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Add genuine value, not just promotion
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Questions are gold - answer them!
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Author reply = 150x more valuable than like
                </li>
              </ul>
            </div>
          </div>

          {/* Card Stack */}
          <div className="lg:col-span-2">
            {opportunities.length === 0 ? (
              <EmptyState
                hasKeywords={keywords.length > 0}
                onSearch={handleSearch}
                searching={searching}
              />
            ) : (
              <div className="relative h-[600px]">
                {/* Card Counter */}
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-900">
                    {currentIndex + 1} / {opportunities.length}
                  </span>
                </div>

                {/* Navigation Arrows */}
                {currentIndex > 0 && (
                  <button
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <IconChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {currentIndex < opportunities.length - 1 && (
                  <button
                    onClick={() => setCurrentIndex(prev => prev + 1)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <IconChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Cards */}
                {opportunities.map((opp, index) => (
                  <SwipeCard
                    key={opp.id}
                    opportunity={opp}
                    isActive={index === currentIndex}
                    onSkip={handleSkip}
                    onReply={handleReply}
                    onGenerateReply={handleGenerateReply}
                    isGenerating={generatingReply}
                    generatedReply={generatedReplies[opp.id]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}