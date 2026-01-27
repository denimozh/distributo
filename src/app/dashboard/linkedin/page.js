"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

// ==========================================
// LINKEDIN PIPELINE - AI CONTENT ENGINE
// ==========================================
// Based on viral LinkedIn frameworks:
// - 4 Content Buckets: Authority (40%), Educational (30%), Social Proof (20%), Personal (10%)
// - Hook → Story → Lesson → CTA structure
// - Lead Magnet posts for virality
// - First comment strategy for links

// Icons
const IconLinkedIn = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const IconX = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconSparkles = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z" />
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

const IconTrendingUp = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconMessageCircle = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const IconHeart = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconEye = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
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

const IconPlus = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconLoader = ({ className }) => (
  <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const IconCopy = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconTrash = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconCheck = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconLink = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

// Content bucket configurations
const CONTENT_BUCKETS = [
  { 
    id: 'authority', 
    label: 'Authority', 
    emoji: '🎯', 
    color: 'blue',
    percentage: 40,
    description: 'Frameworks, methodologies, contrarian takes',
    examples: ['Industry insights', 'Hot takes', 'Frameworks you created']
  },
  { 
    id: 'educational', 
    label: 'Educational', 
    emoji: '📚', 
    color: 'green',
    percentage: 30,
    description: 'How-to content, tutorials, value-first',
    examples: ['Step-by-step guides', 'Tips & tricks', 'Common mistakes']
  },
  { 
    id: 'social-proof', 
    label: 'Social Proof', 
    emoji: '🏆', 
    color: 'amber',
    percentage: 20,
    description: 'Results, case studies, wins',
    examples: ['Client results', 'Before/after', 'Milestones']
  },
  { 
    id: 'personal', 
    label: 'Personal', 
    emoji: '💭', 
    color: 'purple',
    percentage: 10,
    description: 'Your journey, lessons, human side',
    examples: ['Failures & lessons', 'Behind the scenes', 'Values']
  },
];

const POST_FORMATS = [
  { id: 'hook-story', label: 'Hook → Story → Lesson', desc: 'Classic viral format' },
  { id: 'contrarian', label: 'Contrarian Take', desc: 'Challenge common beliefs' },
  { id: 'list-post', label: 'Numbered List', desc: 'Easy to read, high saves' },
  { id: 'lead-magnet', label: 'Lead Magnet', desc: 'Comment to get resource' },
  { id: 'case-study', label: 'Case Study', desc: 'Results-focused story' },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function LinkedInPipelinePage() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [posts, setPosts] = useState([]);
  const [xPosts, setXPosts] = useState([]);
  const [stats, setStats] = useState({ scheduled: 0, posted: 0, thisWeek: 0 });
  
  // Content generation state
  const [selectedBucket, setSelectedBucket] = useState('authority');
  const [selectedFormat, setSelectedFormat] = useState('hook-story');
  const [topic, setTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [firstComment, setFirstComment] = useState('');
  const [generating, setGenerating] = useState(false);
  
  // Schedule state
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduling, setScheduling] = useState(false);
  
  // Profile data for AI
  const [profile, setProfile] = useState(null);

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

    // Load user profile for AI context
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    setProfile(profileData);

    // Load LinkedIn posts
    const { data: linkedinPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'linkedin')
      .in('status', ['scheduled', 'pending', 'posted'])
      .order('scheduled_at', { ascending: true })
      .limit(50);

    setPosts(linkedinPosts || []);

    // Calculate stats
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const scheduled = (linkedinPosts || []).filter(p => p.status === 'scheduled').length;
    const posted = (linkedinPosts || []).filter(p => p.status === 'posted').length;
    const thisWeek = (linkedinPosts || []).filter(p => 
      p.status === 'posted' && new Date(p.posted_at) > weekAgo
    ).length;
    
    setStats({ scheduled, posted, thisWeek });

    // Load X posts for cross-posting
    const { data: xPostsData } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'x')
      .eq('status', 'posted')
      .is('cross_posted_linkedin', null)
      .order('posted_at', { ascending: false })
      .limit(10);

    setXPosts(xPostsData || []);
    setLoading(false);
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/linkedin/connect';
  };

  // Generate LinkedIn content with AI
  const handleGenerate = async () => {
    if (!topic.trim()) {
      addToast('Enter a topic or idea first', 'error');
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
          profile: profile,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setGeneratedContent(data.content);
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

  // Schedule post
  const handleSchedule = async () => {
    if (!generatedContent.trim()) {
      addToast('Generate content first', 'error');
      return;
    }
    if (!scheduleDate || !scheduleTime) {
      addToast('Select date and time', 'error');
      return;
    }

    setScheduling(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: generatedContent,
        hook_content: generatedContent,
        platform: 'linkedin',
        status: 'scheduled',
        scheduled_at: scheduledAt,
        first_comment_content: firstComment || null,
        first_comment_delay_seconds: firstComment ? 45 : null,
        metadata: { bucket: selectedBucket, format: selectedFormat, topic },
      });

      if (error) throw error;

      addToast('Post scheduled!', 'success');
      setGeneratedContent('');
      setFirstComment('');
      setTopic('');
      loadData();
    } catch (error) {
      addToast('Failed: ' + error.message, 'error');
    } finally {
      setScheduling(false);
    }
  };

  // Regenerate content
  const handleRegenerate = () => {
    handleGenerate();
  };

  // Copy content
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard!', 'success');
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    if (!confirm('Delete this post?')) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      addToast('Failed to delete', 'error');
    } else {
      addToast('Post deleted', 'success');
      loadData();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <IconLoader className="w-8 h-8 text-[#0A66C2]" />
      </div>
    );
  }

  if (!account) {
    return <ConnectPrompt onConnect={handleConnect} />;
  }

  const scheduledPosts = posts.filter(p => p.status === 'scheduled');
  const recentPosts = posts.filter(p => p.status === 'posted').slice(0, 5);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center shadow-lg">
              <IconLinkedIn className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">LinkedIn Pipeline</h1>
              <p className="text-sm text-gray-500">AI-powered content for professional growth</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-gray-700">{account.platform_display_name || account.platform_username}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard 
            icon={IconCalendar} 
            label="Scheduled" 
            value={stats.scheduled}
            color="blue"
          />
          <StatCard 
            icon={IconTrendingUp} 
            label="This Week" 
            value={stats.thisWeek}
            color="green"
            badge={stats.thisWeek >= 5 ? '+' + Math.round((stats.thisWeek / 7) * 100) + '%' : null}
          />
          <StatCard 
            icon={IconHeart} 
            label="Total Posted" 
            value={stats.posted}
            color="amber"
          />
          <StatCard 
            icon={IconRefresh} 
            label="Ready to Cross-post" 
            value={xPosts.length}
            color="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Left Column - Content Generator */}
          <div className="col-span-2 space-y-6">
            
            {/* Post Preview Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A66C2] to-[#004182] flex items-center justify-center">
                    <IconLinkedIn className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Post Preview</h3>
                    <p className="text-xs text-gray-500">AI-Powered Content Engine</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={generating || !topic}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <IconRefresh className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCopy(generatedContent)}
                    disabled={!generatedContent}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <IconCopy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                
                {/* Content Bucket Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Content Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CONTENT_BUCKETS.map((bucket) => (
                      <button
                        key={bucket.id}
                        onClick={() => setSelectedBucket(bucket.id)}
                        className={`p-3 rounded-xl text-left transition-all ${
                          selectedBucket === bucket.id
                            ? `bg-${bucket.color}-50 border-2 border-${bucket.color}-200 ring-2 ring-${bucket.color}-100`
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span>{bucket.emoji}</span>
                          <span className="font-medium text-gray-900 text-sm">{bucket.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">{bucket.percentage}% of posts</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Post Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Post Format</label>
                  <div className="flex flex-wrap gap-2">
                    {POST_FORMATS.map((format) => (
                      <button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedFormat === format.id
                            ? 'bg-[#0A66C2] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic or Idea
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., Why most founders fail at content marketing"
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

                {/* Generated Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#0A66C2] text-white text-xs flex items-center justify-center font-bold">1</span>
                        POST
                        <span className="text-gray-400 font-normal">Main Content</span>
                      </span>
                    </label>
                    <span className={`text-xs ${generatedContent.length > 2800 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {generatedContent.length}/3000
                    </span>
                  </div>
                  <textarea
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    rows={12}
                    placeholder={generating ? 'Generating viral content...' : 'Your LinkedIn post will appear here...'}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2] resize-none font-mono text-sm"
                  />
                  {generatedContent && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                      <IconCheck className="w-3 h-3 text-green-500" />
                      LinkedIn-optimized with line breaks for readability
                    </div>
                  )}
                </div>

                {/* First Comment (Plug) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      <span className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                        FIRST COMMENT
                        <span className="text-gray-400 font-normal">Add your link (45s delay)</span>
                      </span>
                    </label>
                    {firstComment && /https?:\/\//.test(firstComment) && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <IconLink className="w-3 h-3" />
                        Link detected ✓
                      </span>
                    )}
                  </div>
                  <textarea
                    value={firstComment}
                    onChange={(e) => setFirstComment(e.target.value)}
                    rows={3}
                    placeholder="Links in first comment get better reach! Add your CTA here..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none bg-green-50/30"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Pro tip: Posts with links get ~50% less reach. Put your link in the first comment instead.
                  </p>
                </div>

                {/* Schedule */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20"
                        />
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20"
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        🕐 Best times: <strong>Tue-Thu, 8-10am</strong> or <strong>12pm</strong> (your timezone)
                      </p>
                    </div>
                    <button
                      onClick={handleSchedule}
                      disabled={scheduling || !generatedContent || !scheduleDate || !scheduleTime}
                      className="px-8 py-3 bg-gradient-to-r from-[#0A66C2] to-[#004182] text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {scheduling ? (
                        <>
                          <IconLoader className="w-5 h-5" />
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <IconCalendar className="w-5 h-5" />
                          Schedule Post
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Upcoming Posts & Quick Actions */}
          <div className="space-y-6">
            
            {/* Upcoming Posts */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Upcoming Posts</h3>
              </div>
              
              {scheduledPosts.length === 0 ? (
                <div className="p-8 text-center">
                  <IconCalendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No posts scheduled yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                  {scheduledPosts.slice(0, 8).map((post, idx) => (
                    <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#0A66C2] text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <IconClock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(post.scheduled_at).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                            </span>
                            {post.first_comment_content && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                +comment
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Cross-post */}
            {xPosts.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">Quick Cross-post</h3>
                  <p className="text-xs text-gray-500">Convert X posts to LinkedIn</p>
                </div>
                
                <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                  {xPosts.slice(0, 5).map((xPost) => (
                    <CrossPostCard 
                      key={xPost.id} 
                      post={xPost}
                      onConvert={async () => {
                        setTopic(xPost.content.slice(0, 100));
                        setSelectedBucket('authority');
                        addToast('Topic loaded - click Generate to convert', 'success');
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Content Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <IconSparkles className="w-4 h-4 text-blue-600" />
                LinkedIn Algorithm Tips
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>First line is everything - make it a hook</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Use line breaks every 1-2 sentences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Links in comments, not in post</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Reply to comments in first hour</span>
                </li>
              </ul>
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
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function CrossPostCard({ post, onConvert }) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
          <IconX className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
          <button
            onClick={onConvert}
            className="mt-2 text-xs text-[#0A66C2] hover:underline font-medium"
          >
            Convert to LinkedIn →
          </button>
        </div>
      </div>
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
            <p className="text-blue-100">AI-powered content for professional growth</p>
          </div>

          <div className="p-8">
            <div className="space-y-4 mb-8">
              {[
                { icon: IconSparkles, text: 'AI generates viral-style LinkedIn posts' },
                { icon: IconCalendar, text: 'Schedule for optimal posting times' },
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