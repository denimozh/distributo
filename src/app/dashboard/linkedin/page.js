"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

// ==========================================
// LINKEDIN PIPELINE - MATCHING X STYLE
// ==========================================

// Icons
const IconLinkedIn = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
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

const IconClock = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
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

const IconSparkles = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z" />
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

// Content buckets
const CONTENT_BUCKETS = [
  { id: 'authority', label: 'Authority', emoji: '🎯', percentage: '40%' },
  { id: 'educational', label: 'Educational', emoji: '📚', percentage: '30%' },
  { id: 'social-proof', label: 'Social Proof', emoji: '🏆', percentage: '20%' },
  { id: 'personal', label: 'Personal', emoji: '💭', percentage: '10%' },
];

const POST_FORMATS = [
  { id: 'hook-story', label: 'Hook → Story → Lesson' },
  { id: 'contrarian', label: 'Contrarian Take' },
  { id: 'list-post', label: 'Numbered List' },
  { id: 'lead-magnet', label: 'Lead Magnet' },
  { id: 'case-study', label: 'Case Study' },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function LinkedInPipelinePage() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ scheduled: 0, thisWeek: 0, avgLikes: 0, avgComments: 0 });
  
  // Content generation state
  const [topic, setTopic] = useState('');
  const [selectedBucket, setSelectedBucket] = useState('authority');
  const [selectedFormat, setSelectedFormat] = useState('hook-story');
  const [postContent, setPostContent] = useState('');
  const [firstComment, setFirstComment] = useState('');
  const [generating, setGenerating] = useState(false);
  
  // Autopost state (dummy for now)
  const [autopostEnabled, setAutopostEnabled] = useState(false);
  const [autopostMode, setAutopostMode] = useState('professional'); // 'professional' | 'thought-leader'

  const supabase = createClient();
  const { addToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Check LinkedIn connection
    const { data: linkedinAccount } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'linkedin')
      .eq('is_active', true)
      .single();

    setAccount(linkedinAccount);

    // Load LinkedIn posts
    const { data: linkedinPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'linkedin')
      .order('scheduled_at', { ascending: true })
      .limit(50);

    setPosts(linkedinPosts || []);

    // Calculate stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const scheduled = (linkedinPosts || []).filter(p => p.status === 'scheduled').length;
    const thisWeek = (linkedinPosts || []).filter(p => 
      p.status === 'posted' && new Date(p.posted_at) > weekAgo
    ).length;
    
    setStats({ scheduled, thisWeek, avgLikes: 0, avgComments: 0 });
    setLoading(false);
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/linkedin/connect';
  };

  // Generate content with AI
  const handleGenerate = async () => {
    if (!topic.trim()) {
      addToast('Enter a topic first', 'error');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/linkedin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          bucket: selectedBucket,
          format: selectedFormat,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setPostContent(data.content || '');
      if (data.firstComment) {
        setFirstComment(data.firstComment);
      }
      addToast('Content generated!', 'success');
    } catch (error) {
      addToast('Generation failed: ' + error.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Check for links in content
  const hasLink = /https?:\/\//.test(postContent);
  const firstCommentHasLink = /https?:\/\//.test(firstComment);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <IconLoader className="w-8 h-8 text-gray-500" />
      </div>
    );
  }

  if (!account) {
    return <ConnectPrompt onConnect={handleConnect} />;
  }

  const scheduledPosts = posts.filter(p => p.status === 'scheduled');

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className=" mx-auto p-6 lg:p-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center shadow-lg">
              <IconLinkedIn className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">LinkedIn</h1>
              <p className="text-sm text-gray-500">Professional content from your posts</p>
            </div>
          </div>

          {/* Autopost Mode Toggle (like X dashboard) */}
          <div className="flex items-center gap-3">
            <AutopostToggle 
              mode={autopostMode} 
              onChange={setAutopostMode}
              enabled={autopostEnabled}
              onToggle={() => setAutopostEnabled(!autopostEnabled)}
            />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">{account.platform_display_name || 'Connected'}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={IconCalendar} 
            label="Scheduled" 
            value={stats.scheduled || '—'}
            color="blue"
          />
          <StatCard 
            icon={IconTrendingUp} 
            label="This Week" 
            value={stats.thisWeek || '—'}
            color="green"
            badge={stats.thisWeek >= 3 ? `+${Math.round((stats.thisWeek / 7) * 100)}%` : null}
          />
          <StatCard 
            icon={IconHeart} 
            label="Avg Likes" 
            value={stats.avgLikes || '—'}
            color="pink"
          />
          <StatCard 
            icon={IconMessageCircle} 
            label="Avg Comments" 
            value={stats.avgComments || '—'}
            color="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Left Column - Post Preview (2/3 width) */}
          <div className="col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center">
                    <IconLinkedIn className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Post Preview</h3>
                    <p className="text-xs text-gray-500">AI Content Engine</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleGenerate}
                    disabled={generating || !topic}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <IconRefresh className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    <IconEdit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Type Selection */}
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm font-medium text-gray-700">Content Type</span>
                  <div className="flex gap-2">
                    {CONTENT_BUCKETS.map((bucket) => (
                      <button
                        key={bucket.id}
                        onClick={() => setSelectedBucket(bucket.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                          selectedBucket === bucket.id
                            ? 'bg-[#0A66C2] text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span>{bucket.emoji}</span>
                        <span>{bucket.label}</span>
                        <span className="text-xs opacity-70">{bucket.percentage}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Post Format</span>
                  <div className="flex gap-2">
                    {POST_FORMATS.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedFormat === format.id
                            ? 'bg-[#0A66C2] text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Topic Input + Generate */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter your topic or idea..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2]"
                  />
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !topic.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-[#0A66C2] to-[#004182] text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {generating ? (
                      <IconLoader className="w-5 h-5" />
                    ) : (
                      <IconSparkles className="w-5 h-5" />
                    )}
                    Generate
                  </button>
                </div>
              </div>

              {/* POST Section (like X HOOK) */}
              <div className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-[#0A66C2]">POST</span>
                      <span className="text-xs text-gray-400">Main Content</span>
                    </div>
                    
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      rows={10}
                      placeholder={generating ? 'Generating content...' : 'Your LinkedIn post will appear here...'}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 resize-none bg-gray-50/50"
                    />
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{postContent.length}/3000</span>
                      {hasLink && (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <IconLink className="w-3 h-3" />
                          Link detected - consider moving to first comment
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider with delay */}
              <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-400">
                <span className="px-2 py-1 bg-gray-100 rounded text-gray-500 font-medium">45s</span>
                <span>Auto-comment delay</span>
              </div>

              {/* FIRST COMMENT Section (like X PLUG) */}
              <div className="p-4 pt-0">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-green-600">FIRST COMMENT</span>
                      <span className="text-xs text-gray-400">Add your link here</span>
                    </div>
                    
                    <textarea
                      value={firstComment}
                      onChange={(e) => setFirstComment(e.target.value)}
                      rows={3}
                      placeholder="Drop your link here for better reach..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 resize-none bg-green-50/30"
                    />
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">{firstComment.length}/500</span>
                      {firstCommentHasLink && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <IconLink className="w-3 h-3" />
                          Link here ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="date"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <input
                    type="time"
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
                    Save Draft
                  </button>
                  <button className="px-6 py-2 bg-gradient-to-r from-[#0A66C2] to-[#004182] text-white font-medium rounded-xl hover:shadow-lg transition-all">
                    Schedule Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Upcoming Posts */}
          <div className="space-y-6">
            
            {/* Upcoming Posts */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Upcoming Posts</h3>
              </div>
              
              {scheduledPosts.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No scheduled posts
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {scheduledPosts.slice(0, 8).map((post, idx) => (
                    <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#0A66C2] text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <IconClock className="w-3 h-3" />
                            {new Date(post.scheduled_at).toLocaleDateString('en-US', { 
                              weekday: 'short',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Autopost Settings */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Autopost</h3>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Coming Soon</span>
              </div>
              <div className="p-4 text-sm text-gray-500">
                <p className="mb-3">Automatically generate and schedule LinkedIn posts based on your GitHub activity and content preferences.</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                    <input type="checkbox" disabled className="rounded" />
                    <span>Post on new GitHub releases</span>
                  </label>
                  <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                    <input type="checkbox" disabled className="rounded" />
                    <span>Weekly milestone summaries</span>
                  </label>
                  <label className="flex items-center gap-2 opacity-50 cursor-not-allowed">
                    <input type="checkbox" disabled className="rounded" />
                    <span>Cross-post top X content</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTS
// ==========================================

function StatCard({ icon: Icon, label, value, color, badge }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    pink: 'bg-pink-100 text-pink-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-600">
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function AutopostToggle({ mode, onChange, enabled, onToggle }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      <button
        onClick={() => onChange('professional')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          mode === 'professional' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Professional
      </button>
      <button
        onClick={() => onChange('thought-leader')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
          mode === 'thought-leader' ? 'bg-[#0A66C2] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        🎯 Thought Leader
      </button>
    </div>
  );
}

function ConnectPrompt({ onConnect }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A66C2]/5 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-br from-[#0A66C2] to-[#004182] p-8 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
              <IconLinkedIn className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold mb-2">LinkedIn Pipeline</h1>
            <p className="text-blue-100">AI-powered professional content</p>
          </div>

          <div className="p-8">
            <div className="space-y-4 mb-8">
              {[
                { icon: IconSparkles, text: 'AI generates viral LinkedIn posts' },
                { icon: IconCalendar, text: 'Schedule for optimal times' },
                { icon: IconMessageCircle, text: 'Auto first-comment with your link' },
                { icon: IconRefresh, text: 'Cross-post from X with tone adaptation' },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <feature.icon className="w-5 h-5 text-[#0A66C2]" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onConnect}
              className="w-full py-4 bg-gradient-to-r from-[#0A66C2] to-[#004182] text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <IconLinkedIn className="w-5 h-5" />
              Connect LinkedIn Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}