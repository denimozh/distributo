"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
// NOTE: If useToast throws "must be used within ToastProvider", 
// change above to: import { useToast } from "../layout";

// Icons
const IconCalendar = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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

const IconClock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconZap = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconList = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const IconGrid = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconCheckCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconThread = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <line x1="9" y1="10" x2="15" y2="10" />
  </svg>
);

const IconLink = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const IconLoader = ({ className }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconUsers = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconPlus = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconEdit = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconWarning = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconInfo = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconSparkles = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z" />
  </svg>
);

const IconExternalLink = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// Content types for ghost slots
const CONTENT_TYPES = [
  { type: 'hot_take', label: 'Hot Take', emoji: '🔥' },
  { type: 'build_update', label: 'Build Update', emoji: '🛠️' },
  { type: 'pain_solution', label: 'Pain → Solution', emoji: '💡' },
  { type: 'personal_story', label: 'Personal Story', emoji: '📖' },
  { type: 'engagement', label: 'Question/Poll', emoji: '🤔' },
];

// Default posting schedule for X (5 posts per day)
const X_POSTING_SCHEDULE = [
  { hour: 9, minute: 0, label: '9:00 AM', type: 'hot_take' },
  { hour: 12, minute: 0, label: '12:00 PM', type: 'build_update' },
  { hour: 15, minute: 0, label: '3:00 PM', type: 'pain_solution' },
  { hour: 17, minute: 0, label: '5:00 PM', type: 'personal_story' },
  { hour: 19, minute: 0, label: '7:00 PM', type: 'engagement' },
];

// Fallback Popular X Communities (used only if user has none saved)
const POPULAR_COMMUNITIES = [
  { community_id: '1493446837214187523', community_name: 'Build in Public', members: '120K+' },
  { community_id: '1488963315096326145', community_name: 'Indie Hackers', members: '85K+' },
  { community_id: '1516428323899392001', community_name: 'SaaS Founders', members: '45K+' },
  { community_id: '1493876292516442112', community_name: 'Tech Twitter', members: '200K+' },
];

// Ghost Slot Component - Clickable to trigger generation
function GhostSlot({ time, type, onGenerate, isGenerating }) {
  const contentType = CONTENT_TYPES.find(c => c.type === type) || CONTENT_TYPES[0];
  
  return (
    <button
      onClick={onGenerate}
      disabled={isGenerating}
      className="w-full border-2 border-dashed border-gray-300 rounded-xl p-3 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/50 transition-all group text-left disabled:opacity-70 disabled:cursor-wait"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded bg-gray-200 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
          {isGenerating ? (
            <IconLoader className="w-3 h-3 text-blue-500" />
          ) : (
            <IconZap className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
          )}
        </div>
        <span className="text-[10px] text-gray-400 group-hover:text-blue-600 font-medium uppercase transition-colors">
          {isGenerating ? 'Generating...' : 'Click to Generate'}
        </span>
      </div>
      <p className="text-xs text-gray-500 group-hover:text-gray-700 mb-2 transition-colors">
        {contentType.emoji} {contentType.label}
      </p>
      <div className="flex items-center gap-1 text-[10px] text-gray-400">
        <IconClock className="w-3 h-3" />
        <span>{time}</span>
      </div>
    </button>
  );
}

// Post Card with Thread Indicator
function PostCard({ post, onClick }) {
  const statusColors = {
    pending: 'border-l-amber-400 bg-amber-50',
    scheduled: 'border-l-blue-400 bg-blue-50',
    posted: 'border-l-emerald-400 bg-emerald-50',
    failed: 'border-l-red-400 bg-red-50',
  };

  const PlatformIcon = post.platform === 'linkedin' ? IconLinkedIn : IconTwitterX;
  const isThread = post.plug_content || post.is_thread || post.has_plug;

  return (
    <button
      onClick={() => onClick(post)}
      className={`w-full text-left rounded-xl border-l-4 ${statusColors[post.status]} border border-gray-200 hover:shadow-md transition-all`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <PlatformIcon className="w-3.5 h-3.5 text-gray-500" />
            {/* Thread Indicator - Shows 1/2 badge for hook+plug posts */}
            {isThread && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 rounded" title="Thread: Link in reply for better reach">
                <IconThread className="w-3 h-3 text-blue-600" />
                <span className="text-[9px] font-bold text-blue-600">1/2</span>
              </div>
            )}
            {/* Community indicator */}
            {post.community_id && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 rounded" title="Community post">
                <IconUsers className="w-3 h-3 text-purple-600" />
              </div>
            )}
          </div>
          <span className="text-[10px] text-gray-400">
            {new Date(post.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
          {post.hook_content || post.content}
        </p>
        {/* Thread visual indicator showing link is protected */}
        {isThread && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200/50">
            <div className="flex items-center gap-1">
              <div className="w-0.5 h-3 bg-blue-300 rounded-full" />
              <IconLink className="w-3 h-3 text-blue-500" />
            </div>
            <span className="text-[10px] text-blue-600 font-medium">+ Reply with link (protected reach)</span>
          </div>
        )}
      </div>
    </button>
  );
}

// ==========================================
// EDIT POST MODAL - REDESIGNED WITH TABS
// ==========================================

function EditPostModal({ post, communities = [], onSave, onClose, onCommunitiesChange, onDelete, onApprove, onUnapprove }) {
  // Content state
  const [hookContent, setHookContent] = useState(post?.hook_content || post?.content || '');
  const [plugContent, setPlugContent] = useState(post?.plug_content || '');
  const [replyDelay, setReplyDelay] = useState(post?.reply_delay || 60);
  
  // Schedule state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  // Community state
  // Note: post.community_id is a UUID, but we display/select by X community ID
  // Find the X community ID from the UUID if it exists
  const getXCommunityIdFromUuid = (uuid) => {
    if (!uuid) return '';
    const community = communities.find(c => c.id === uuid);
    return community?.community_id || '';
  };
  
  const [selectedCommunity, setSelectedCommunity] = useState(() => {
    // If post.community_id looks like a UUID, convert it
    if (post?.community_id && post.community_id.includes('-')) {
      // It's a UUID - will be converted once communities load
      return '';
    }
    return post?.community_id || '';
  });
  const [shareWithFollowers, setShareWithFollowers] = useState(post?.share_with_followers ?? true);
  const [showAddCommunity, setShowAddCommunity] = useState(false);
  const [newCommunityId, setNewCommunityId] = useState('');
  const [newCommunityName, setNewCommunityName] = useState('');
  const [addingCommunity, setAddingCommunity] = useState(false);
  
  // When communities load, convert UUID to X community ID
  useEffect(() => {
    if (post?.community_id && post.community_id.includes('-') && communities.length > 0) {
      const xCommunityId = getXCommunityIdFromUuid(post.community_id);
      if (xCommunityId) {
        setSelectedCommunity(xCommunityId);
        console.log('[EditModal] Converted UUID to X community ID:', xCommunityId);
      }
    }
  }, [communities, post?.community_id]);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const supabase = createClient();
  
  const maxLength = post?.platform === 'linkedin' ? 3000 : 280;
  const hookOverLimit = hookContent.length > maxLength;
  const plugOverLimit = plugContent.length > maxLength;
  const hasPlug = post?.plug_content || post?.is_thread || plugContent.length > 0;
  const hasLink = /https?:\/\//.test(hookContent);
  const plugHasLink = /https?:\/\//.test(plugContent);

  // Initialize date/time from post
  useEffect(() => {
    if (post?.scheduled_at) {
      const date = new Date(post.scheduled_at);
      // Format date as YYYY-MM-DD for input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setScheduleDate(`${year}-${month}-${day}`);
      
      // Format time as HH:MM for input
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      setScheduleTime(`${hours}:${minutes}`);
    }
  }, [post]);

  // Time presets
  const timePresets = [
    { label: '9:00 AM', value: '09:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '3:00 PM', value: '15:00' },
    { label: '6:00 PM', value: '18:00' },
  ];

  // Character count ring component
  const CharacterRing = ({ current, max }) => {
    const percentage = Math.min((current / max) * 100, 100);
    const isOver = current > max;
    const circumference = 2 * Math.PI * 14;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative w-9 h-9">
        <svg className="w-9 h-9 -rotate-90" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="14" fill="none" stroke="#e5e7eb" strokeWidth="2.5" />
          <circle
            cx="16" cy="16" r="14" fill="none"
            stroke={isOver ? '#ef4444' : current > max * 0.9 ? '#f59e0b' : '#3b82f6'}
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-semibold ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
          {max - current}
        </span>
      </div>
    );
  };

  // Handle save
  const handleSave = async () => {
    if (hookOverLimit || (hasPlug && plugOverLimit)) return;
    setSaving(true);
    
    // Build scheduled_at from date and time inputs
    let scheduledAt = post.scheduled_at; // default to existing
    if (scheduleDate && scheduleTime) {
      const [year, month, day] = scheduleDate.split('-').map(Number);
      const [hours, minutes] = scheduleTime.split(':').map(Number);
      const newDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
      scheduledAt = newDate.toISOString();
    }
    
    console.log('[EditModal] Saving with scheduled_at:', scheduledAt);
    
    // IMPORTANT: The posts.community_id column expects a UUID (x_communities.id)
    // but selectedCommunity is the actual X community ID (like "1493446837214187523")
    // We need to find the UUID for this X community ID
    let communityUuid = null;
    if (selectedCommunity) {
      const matchingCommunity = communities.find(c => c.community_id === selectedCommunity);
      if (matchingCommunity) {
        communityUuid = matchingCommunity.id; // This is the UUID
        console.log('[EditModal] Found community UUID:', communityUuid, 'for X community ID:', selectedCommunity);
      }
    }
    
    await onSave(post.id, {
      content: hookContent,
      hook_content: hookContent,
      plug_content: plugContent || null,
      reply_delay: replyDelay,
      scheduled_at: scheduledAt,
      community_id: communityUuid, // Pass the UUID, not the X community ID
      share_with_followers: shareWithFollowers,
    });
    
    setSaving(false);
    onClose();
  };

  // Handle add community
  const handleAddCommunity = async () => {
    if (!newCommunityId.trim() || !newCommunityName.trim()) return;
    
    setAddingCommunity(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Clean community ID (in case user pastes full URL)
      const cleanId = newCommunityId
        .replace('https://x.com/i/communities/', '')
        .replace('https://twitter.com/i/communities/', '')
        .trim();

      const { error } = await supabase.from('x_communities').upsert({
        user_id: user.id,
        community_id: cleanId,
        name: newCommunityName.trim(),
        is_active: true,
      }, { onConflict: 'user_id,community_id' });

      if (error) throw error;

      // Refresh communities list
      if (onCommunitiesChange) {
        await onCommunitiesChange();
      }
      
      setSelectedCommunity(cleanId);
      setNewCommunityId('');
      setNewCommunityName('');
      setShowAddCommunity(false);
    } catch (error) {
      console.error('Failed to add community:', error);
    } finally {
      setAddingCommunity(false);
    }
  };

  // Quick add popular community
  const handleQuickAddCommunity = async (community) => {
    // Check if already in user's communities
    const exists = communities.find(c => c.community_id === community.community_id);
    if (exists) {
      setSelectedCommunity(community.community_id);
      return;
    }
    
    // Add to database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('x_communities').upsert({
        user_id: user.id,
        community_id: community.community_id,
        name: community.community_name,
        is_active: true,
      }, { onConflict: 'user_id,community_id' });

      if (onCommunitiesChange) {
        await onCommunitiesChange();
      }
      
      setSelectedCommunity(community.community_id);
    } catch (error) {
      console.error('Failed to add community:', error);
    }
  };

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center">
              <IconTwitterX className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Edit Thread</h3>
              <p className="text-sm text-gray-500">Hook + Plug Strategy</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <IconX className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-3 border-b border-gray-100 flex gap-1 bg-gray-50 flex-shrink-0">
          {[
            { id: 'content', label: 'Content', icon: IconEdit },
            { id: 'schedule', label: 'Schedule', icon: IconCalendar },
            { id: 'community', label: 'Community', icon: IconUsers },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* ==================== CONTENT TAB ==================== */}
          {activeTab === 'content' && (
            <div className="space-y-5">
              
              {/* Hook Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <span className="font-semibold text-gray-900">HOOK</span>
                      <span className="ml-2 text-sm text-gray-500">Main Tweet</span>
                    </div>
                  </div>
                  <CharacterRing current={hookContent.length} max={maxLength} />
                </div>
                
                <div className={`relative rounded-xl border-2 transition-colors ${
                  hasLink ? 'border-amber-300 bg-amber-50' : hookOverLimit ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-blue-50/50'
                }`}>
                  <textarea
                    value={hookContent}
                    onChange={(e) => setHookContent(e.target.value)}
                    rows={5}
                    placeholder="Write your hook - the attention grabber..."
                    className="w-full px-4 py-4 bg-transparent resize-none focus:outline-none text-gray-900 placeholder-gray-400"
                  />
                  
                  {hasLink && (
                    <div className="px-4 pb-3 flex items-center gap-2 text-amber-700 text-sm">
                      <IconWarning className="w-4 h-4" />
                      <span>Links reduce reach by ~50%. Consider moving to the Plug below.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delay Connector */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-full">
                  <IconClock className="w-4 h-4 text-gray-500" />
                  <select
                    value={replyDelay}
                    onChange={(e) => setReplyDelay(Number(e.target.value))}
                    className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                  >
                    <option value={30}>30s delay</option>
                    <option value={60}>60s delay</option>
                    <option value={90}>90s delay</option>
                    <option value={120}>2m delay</option>
                  </select>
                  <span className="text-gray-400">•</span>
                  <span className="text-xs text-gray-500">auto-reply</span>
                </div>
              </div>

              {/* Plug Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <span className="font-semibold text-gray-900">PLUG</span>
                      <span className="ml-2 text-sm text-gray-500">Reply with Link</span>
                    </div>
                  </div>
                  <CharacterRing current={plugContent.length} max={maxLength} />
                </div>
                
                <div className={`relative rounded-xl border-2 transition-colors ${
                  plugHasLink ? 'border-emerald-300 bg-emerald-50' : plugOverLimit ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <textarea
                    value={plugContent}
                    onChange={(e) => setPlugContent(e.target.value)}
                    rows={4}
                    placeholder="Add your call-to-action and link here..."
                    className="w-full px-4 py-4 bg-transparent resize-none focus:outline-none text-gray-900 placeholder-gray-400"
                  />
                  
                  {plugHasLink && (
                    <div className="px-4 pb-3 flex items-center gap-2 text-emerald-700 text-sm">
                      <IconCheckCircle className="w-4 h-4" />
                      <span>Link detected - perfect placement!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Strategy Tip */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <IconSparkles className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Hook + Plug Strategy</p>
                    <p className="text-sm text-gray-600">
                      Posts with links get ~50% less reach. By posting your link as a reply, 
                      you maximize visibility while still driving traffic. The {replyDelay}s delay makes it look natural.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== SCHEDULE TAB ==================== */}
          {activeTab === 'schedule' && (
            <div className="space-y-6">
              
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                />
              </div>

              {/* Time Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Time</label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                />
                
                {/* Quick Time Presets */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {timePresets.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => setScheduleTime(preset.value)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        scheduleTime === preset.value
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Preview */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <IconCalendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Scheduled for</p>
                    <p className="font-semibold text-gray-900">
                      {scheduleDate && scheduleTime 
                        ? new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })
                        : 'Not scheduled'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Best Times Info */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <IconSparkles className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Best Times to Post</p>
                    <p className="text-sm text-gray-600">
                      Peak engagement on X: <strong>9-10 AM</strong> and <strong>1-3 PM</strong> (your timezone). 
                      Weekdays typically outperform weekends for B2B content.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== COMMUNITY TAB ==================== */}
          {activeTab === 'community' && (
            <div className="space-y-6">
              
              {/* Community Selector - Shows user's saved communities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Post to Community</label>
                <select
                  value={selectedCommunity}
                  onChange={(e) => setSelectedCommunity(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Personal Timeline Only</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.community_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* User's Saved Communities as Cards */}
              {communities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Your Communities</label>
                  <div className="grid grid-cols-2 gap-3">
                    {communities.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCommunity(c.community_id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          selectedCommunity === c.community_id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.community_id}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Communities - Only show if user has few communities */}
              {communities.length < 4 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {communities.length === 0 ? 'Popular Communities' : 'Add More Communities'}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {POPULAR_COMMUNITIES
                      .filter(pc => !communities.find(c => c.community_id === pc.community_id))
                      .map((c) => (
                        <button
                          key={c.community_id}
                          onClick={() => handleQuickAddCommunity(c)}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${
                            selectedCommunity === c.community_id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50/50'
                          }`}
                        >
                          <p className="font-medium text-gray-900">{c.community_name}</p>
                          <p className="text-sm text-gray-500">{c.members} members</p>
                          <p className="text-xs text-purple-600 mt-1">+ Click to add</p>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Share with Followers Toggle */}
              {selectedCommunity && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-900">Also share to your timeline</p>
                      <p className="text-sm text-gray-500">Post will appear on your profile too</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={shareWithFollowers}
                        onChange={(e) => setShareWithFollowers(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${shareWithFollowers ? 'bg-blue-500' : 'bg-gray-300'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${shareWithFollowers ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Add New Community */}
              <div className="border-t border-gray-200 pt-6">
                {!showAddCommunity ? (
                  <button
                    onClick={() => setShowAddCommunity(true)}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                  >
                    <IconPlus className="w-5 h-5" />
                    <span className="font-medium">Add New Community</span>
                  </button>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Add New Community</h4>
                      <button onClick={() => setShowAddCommunity(false)} className="p-1 hover:bg-blue-100 rounded">
                        <IconX className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    
                    {/* Instructions */}
                    <div className="p-3 bg-white rounded-lg border border-blue-100">
                      <div className="flex items-start gap-2 text-sm text-blue-800">
                        <IconInfo className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium mb-1">How to find your Community ID:</p>
                          <ol className="list-decimal list-inside space-y-1 text-blue-700">
                            <li>Go to the X Community you want to add</li>
                            <li>Look at the URL: x.com/i/communities/<strong>1234567890</strong></li>
                            <li>Copy the number at the end</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    {/* Input Fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Community ID</label>
                        <input
                          type="text"
                          value={newCommunityId}
                          onChange={(e) => setNewCommunityId(e.target.value)}
                          placeholder="e.g., 1493446837214187523"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Community Name</label>
                        <input
                          type="text"
                          value={newCommunityName}
                          onChange={(e) => setNewCommunityName(e.target.value)}
                          placeholder="e.g., Build in Public"
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAddCommunity}
                        disabled={addingCommunity || !newCommunityId.trim() || !newCommunityName.trim()}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                      >
                        {addingCommunity ? (
                          <>
                            <IconLoader className="w-4 h-4" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <IconPlus className="w-4 h-4" />
                            Add Community
                          </>
                        )}
                      </button>
                      <a
                        href="https://x.com/i/communities"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 text-gray-600 font-medium rounded-lg hover:bg-white transition-colors flex items-center gap-2"
                      >
                        Browse
                        <IconExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Community Benefits Info */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <IconUsers className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 mb-1">Why Post to Communities?</p>
                    <p className="text-sm text-gray-600">
                      Community posts often get <strong>3-5x more engagement</strong> than timeline posts. 
                      They're shown to members interested in the topic, not just your followers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Fixed Layout */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          {/* Top row - Date and Community info */}
          <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-2">
              <IconClock className="w-4 h-4" />
              <span>
                {scheduleDate && scheduleTime 
                  ? new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : post?.scheduled_at 
                    ? new Date(post.scheduled_at).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : 'Not scheduled'
                }
              </span>
            </div>
            {selectedCommunity && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-purple-600 flex items-center gap-1">
                  <IconUsers className="w-3.5 h-3.5" />
                  {communities.find(c => c.community_id === selectedCommunity)?.name || 'Community'}
                </span>
              </>
            )}
          </div>
          
          {/* Bottom row - Action buttons */}
          <div className="flex items-center justify-between">
            {/* Left side - Delete button */}
            <div>
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
            
            {/* Right side - Action buttons */}
            <div className="flex items-center gap-2">
              {/* Approve button - only for pending posts */}
              {post.status === 'pending' && onApprove && (
                <button
                  onClick={() => {
                    onApprove(post.id);
                    onClose();
                  }}
                  className="px-4 py-2 text-green-600 font-medium rounded-xl hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Approve
                </button>
              )}
              
              {/* Unapprove button - only for scheduled posts */}
              {post.status === 'scheduled' && onUnapprove && (
                <button
                  onClick={() => {
                    onUnapprove(post.id);
                    onClose();
                  }}
                  className="px-4 py-2 text-amber-600 font-medium rounded-xl hover:bg-amber-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Unapprove
                </button>
              )}
              
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || hookOverLimit || (hasPlug && plugOverLimit) || !hookContent.trim()}
                className="px-5 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-medium rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <IconLoader className="w-4 h-4" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Post?</h3>
              <p className="text-sm text-gray-500 text-center">
                This action cannot be undone. The post will be permanently removed from your queue.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(post.id);
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stats Banner
function StatsBanner({ stats }) {
  const items = [
    { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
    { label: 'Scheduled', value: stats.scheduled, color: 'text-blue-600' },
    { label: 'Posted', value: stats.posted, color: 'text-emerald-600' },
    { label: 'Needs Attention', value: stats.failed || '—', color: 'text-amber-600' },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {items.map((stat) => (
        <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
          <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

// Calendar View with Approve Day & Interactive Ghost Slots
function CalendarView({ posts, currentWeekStart, onNavigateWeek, onPostClick, onApproveDay, onGenerateSlot, generatingSlots, approvingDays }) {
  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();
  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };
  
  const getPostsForDay = (day) => posts.filter((post) => {
    const postDate = new Date(post.scheduled_at);
    return postDate.toDateString() === day.toDateString();
  });

  const getPendingPostsForDay = (day) => {
    return getPostsForDay(day).filter(p => p.status === 'pending');
  };

  const getGhostSlotsForDay = (day) => {
    // No ghost slots for past days
    if (isPast(day)) return [];
    
    const dayPosts = getPostsForDay(day);
    const now = new Date();
    const isToday = day.toDateString() === now.toDateString();
    
    // Find the latest scheduled post time for this day
    let latestPostTime = null;
    dayPosts.forEach(post => {
      if (post.scheduled_at) {
        const postDate = new Date(post.scheduled_at);
        if (!latestPostTime || postDate > latestPostTime) {
          latestPostTime = postDate;
        }
      }
    });
    
    // If there are posts, only show ghost slots AFTER the last post
    // If no posts, show the first available slot (or all if you prefer)
    return X_POSTING_SCHEDULE.filter(slot => {
      const slotTime = new Date(day);
      slotTime.setHours(slot.hour, slot.minute, 0, 0);
      
      // For today, only show slots for future times
      if (isToday && slotTime <= now) {
        return false;
      }
      
      // Check if there's already a post at this time slot
      const hasPostAtTime = dayPosts.some(post => {
        if (!post.scheduled_at) return false;
        const postDate = new Date(post.scheduled_at);
        return postDate.getHours() === slot.hour && postDate.getMinutes() === slot.minute;
      });
      
      if (hasPostAtTime) return false;
      
      // KEY CHANGE: Only show ghost slots AFTER the last scheduled post
      // If there are posts scheduled, only show ONE ghost slot (the next available after the last post)
      if (latestPostTime) {
        // Only show this slot if it's after the last scheduled post
        if (slotTime <= latestPostTime) {
          return false;
        }
      }
      
      return true;
    }).slice(0, 1); // Only show ONE ghost slot (the next available)
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => onNavigateWeek(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <IconChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => {
                const today = new Date();
                today.setDate(today.getDate() - today.getDay());
                onNavigateWeek(0, today);
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Today
            </button>
            <button onClick={() => onNavigateWeek(1)} className="p-2 hover:bg-gray-100 rounded-lg">
              <IconChevronRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Posted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 px-1 py-0.5 bg-blue-100 rounded">
              <IconThread className="w-3 h-3 text-blue-500" />
              <span className="text-[9px] font-bold text-blue-600">1/2</span>
            </div>
            <span>Thread</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5 px-1 py-0.5 bg-purple-100 rounded">
              <IconUsers className="w-3 h-3 text-purple-500" />
            </div>
            <span>Community</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 items-start">
        {getWeekDays().map((day, index) => {
          const pendingPosts = getPendingPostsForDay(day);
          const pendingCount = pendingPosts.length;
          const dayPosts = getPostsForDay(day);
          const ghostSlots = getGhostSlotsForDay(day);
          const dayKey = day.toISOString().split('T')[0];
          const isApproving = approvingDays.includes(dayKey);
          
          return (
            <div
              key={index}
              className={`border-r border-gray-100 last:border-r-0 ${
                isToday(day) ? 'bg-blue-50/30' : isPast(day) ? 'bg-gray-50/50' : ''
              }`}
            >
              {/* Day Header */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-gray-400 uppercase">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  {pendingCount > 0 && (
                    <button
                      onClick={() => onApproveDay(pendingPosts.map(p => p.id), dayKey)}
                      disabled={isApproving}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                      title={`Approve all ${pendingCount} pending posts`}
                    >
                      {isApproving ? (
                        <IconLoader className="w-3.5 h-3.5" />
                      ) : (
                        <IconCheckCircle className="w-3.5 h-3.5" />
                      )}
                      <span className="text-[10px] font-semibold">{pendingCount}</span>
                    </button>
                  )}
                </div>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold ${
                  isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-700'
                }`}>
                  {day.getDate()}
                </div>
              </div>
              
              {/* Posts */}
              <div className="p-2 space-y-2">
                {dayPosts
                  .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
                  .map((post) => (
                    <PostCard key={post.id} post={post} onClick={onPostClick} />
                  ))}
                
                {ghostSlots.map((slot) => {
                  const slotKey = `${dayKey}-${slot.hour}`;
                  return (
                    <GhostSlot
                      key={slotKey}
                      time={slot.label}
                      type={slot.type}
                      isGenerating={generatingSlots.includes(slotKey)}
                      onGenerate={() => onGenerateSlot(day, slot)}
                    />
                  );
                })}
                
                {dayPosts.length === 0 && ghostSlots.length === 0 && (
                  <div className="py-8 text-center text-gray-300 text-xs">
                    No posts
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Page
export default function ContentQueuePage() {
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    return new Date(today.setDate(today.getDate() - today.getDay()));
  });
  const [stats, setStats] = useState({ pending: 0, scheduled: 0, posted: 0, failed: 0 });
  const [selectedPost, setSelectedPost] = useState(null);
  const [generatingSlots, setGeneratingSlots] = useState([]);
  const [approvingDays, setApprovingDays] = useState([]);

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => { 
    loadPosts(); 
    loadCommunities();
  }, [platformFilter]);

  const loadPosts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase.from('posts').select('*').eq('user_id', user.id).order('scheduled_at', { ascending: true });
    if (platformFilter !== 'all') query = query.eq('platform', platformFilter);

    const { data } = await query;
    setPosts(data || []);

    const pending = (data || []).filter((p) => p.status === 'pending').length;
    const scheduled = (data || []).filter((p) => p.status === 'scheduled').length;
    const posted = (data || []).filter((p) => p.status === 'posted').length;
    const failed = (data || []).filter((p) => p.status === 'failed').length;
    setStats({ pending, scheduled, posted, failed });
    setLoading(false);
  };

  const loadCommunities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('x_communities')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading communities:', error);
    }
    
    console.log('[Communities] Loaded:', data);
    setCommunities(data || []);
  };

  const navigateWeek = (direction, specificDate) => {
    if (specificDate) { setCurrentWeekStart(specificDate); return; }
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeekStart(newDate);
  };

  const handleApproveDay = async (postIds, dayKey) => {
    setApprovingDays(prev => [...prev, dayKey]);
    
    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: 'scheduled' })
        .in('id', postIds);

      if (error) throw error;
      
      addToast(`✅ Approved ${postIds.length} posts!`, 'success');
      await loadPosts();
    } catch (error) {
      addToast('Failed to approve posts', 'error');
    } finally {
      setApprovingDays(prev => prev.filter(k => k !== dayKey));
    }
  };

  const handleGenerateSlot = async (day, slot) => {
    const slotKey = `${day.toISOString().split('T')[0]}-${slot.hour}`;
    
    setGeneratingSlots(prev => [...prev, slotKey]);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const scheduledAt = new Date(day);
      scheduledAt.setHours(slot.hour, slot.minute, 0, 0);

      const response = await fetch('/api/content/generate-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          platform: 'x',
          contentType: slot.type,
          scheduledAt: scheduledAt.toISOString(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        addToast(`🚀 Generated ${slot.label} post!`, 'success');
        await loadPosts();
      } else if (data.needsOnboarding) {
        window.location.href = '/onboarding';
      } else {
        throw new Error(data.error || 'Generation failed');
      }
    } catch (error) {
      addToast(error.message || 'Failed to generate content', 'error');
    } finally {
      setGeneratingSlots(prev => prev.filter(k => k !== slotKey));
    }
  };

  // Delete a single post
  const handleDeletePost = async (postId) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      addToast('Failed to delete post', 'error');
    } else {
      addToast('Post deleted!', 'success');
      setSelectedPost(null);
      await loadPosts();
    }
  };

  // Approve a single post (pending → scheduled)
  const handleApprovePost = async (postId) => {
    const { error } = await supabase
      .from('posts')
      .update({ status: 'scheduled' })
      .eq('id', postId);
    if (error) {
      addToast('Failed to approve post', 'error');
    } else {
      addToast('Post approved and scheduled!', 'success');
      setSelectedPost(null);
      await loadPosts();
    }
  };

  // Unapprove a post (scheduled → pending)
  const handleUnapprovePost = async (postId) => {
    const { error } = await supabase
      .from('posts')
      .update({ status: 'pending' })
      .eq('id', postId);
    if (error) {
      addToast('Failed to unapprove post', 'error');
    } else {
      addToast('Post moved back to pending!', 'success');
      setSelectedPost(null);
      await loadPosts();
    }
  };

  const handleSavePost = async (postId, updates) => {
    // Build update object with all fields
    const validUpdates = {
      content: updates.content,
      hook_content: updates.hook_content,
      scheduled_at: updates.scheduled_at,
      updated_at: new Date().toISOString(),
    };

    // Add optional fields if they exist
    if (updates.plug_content !== undefined) {
      validUpdates.plug_content = updates.plug_content;
    }
    if (updates.reply_delay !== undefined) {
      validUpdates.reply_delay = updates.reply_delay;
    }
    
    // IMPORTANT: Add community_id (the actual X community ID like "1493446837214187523")
    if (updates.community_id !== undefined) {
      validUpdates.community_id = updates.community_id;
      console.log('[SavePost] Setting community_id to:', updates.community_id);
    }
    if (updates.share_with_followers !== undefined) {
      validUpdates.share_with_followers = updates.share_with_followers;
    }

    console.log('[SavePost] Attempting update for post:', postId);
    console.log('[SavePost] Update payload:', JSON.stringify(validUpdates, null, 2));

    const { data, error } = await supabase
      .from('posts')
      .update(validUpdates)
      .eq('id', postId)
      .select();

    if (error) {
      console.error('[SavePost] Supabase error:', JSON.stringify(error, null, 2));
      console.error('[SavePost] Error message:', error.message);
      console.error('[SavePost] Error details:', error.details);
      console.error('[SavePost] Error hint:', error.hint);
      console.error('[SavePost] Error code:', error.code);
      addToast(`Failed to update: ${error.message || 'Unknown error'}`, 'error');
    } else {
      console.log('[SavePost] Success! Updated data:', data);
      addToast('Post updated!', 'success');
    }
    await loadPosts();
  };

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
            <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center">
              <IconCalendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Content Queue</h1>
              <p className="text-sm text-gray-500">Manage and schedule your posts</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Platform Filter */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              {['all', 'x', 'linkedin'].map((platform) => (
                <button
                  key={platform}
                  onClick={() => setPlatformFilter(platform)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    platformFilter === platform ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {platform === 'all' ? 'All' : platform === 'x' ? 'X' : 'LinkedIn'}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setView('calendar')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <IconGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${
                  view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <IconList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <StatsBanner stats={stats} />

        {/* Thread Indicator Legend */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 rounded">
              <IconThread className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-600">1/2</span>
            </div>
          </div>
          <span className="text-sm text-blue-700">
            <span className="font-medium">Thread posts</span> use the hook + plug pattern. 
            Your link is posted as a reply to protect reach (27x better than inline links).
          </span>
        </div>

        {/* Calendar */}
        <CalendarView
          posts={posts}
          currentWeekStart={currentWeekStart}
          onNavigateWeek={navigateWeek}
          onPostClick={setSelectedPost}
          onApproveDay={handleApproveDay}
          onGenerateSlot={handleGenerateSlot}
          generatingSlots={generatingSlots}
          approvingDays={approvingDays}
        />
      </div>

      {/* Edit Post Modal */}
      {selectedPost && (
        <EditPostModal 
          post={selectedPost}
          communities={communities}
          onSave={handleSavePost} 
          onClose={() => setSelectedPost(null)}
          onCommunitiesChange={loadCommunities}
          onDelete={handleDeletePost}
          onApprove={handleApprovePost}
          onUnapprove={handleUnapprovePost}
        />
      )}
    </div>
  );
}