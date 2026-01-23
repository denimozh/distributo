"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { createClient } from '@/lib/supabase/client';

// ==========================================
// TOAST SYSTEM
// ==========================================

const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = (message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  };

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up ${
              t.type === 'success' ? 'bg-emerald-500 text-white' :
              t.type === 'error' ? 'bg-red-500 text-white' :
              'bg-gray-800 text-white'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </ToastContext.Provider>
  );
}

const useToast = () => useContext(ToastContext);

// ==========================================
// MAIN PAGE
// ==========================================

export default function LinkedInPipelinePage() {
  return (
    <ToastProvider>
      <LinkedInContent />
    </ToastProvider>
  );
}

function LinkedInContent() {
  const [loading, setLoading] = useState(true);
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Settings
  const [settings, setSettings] = useState({
    autoCrossPost: true,
    toneAdaptation: true,
    tone: 'professional',
  });
  const [showSettings, setShowSettings] = useState(false);
  
  // Posts
  const [xPosts, setXPosts] = useState([]);
  const [linkedinPosts, setLinkedinPosts] = useState([]);
  const [selectedXPost, setSelectedXPost] = useState(null);
  const [convertedContent, setConvertedContent] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  
  // Scheduling
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    fetchData();
    
    // Check for success/error in URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'connected') {
      setShowWelcome(true);
      window.history.replaceState({}, '', '/dashboard/linkedin');
    }
    if (params.get('error')) {
      toast.error(`Connection failed: ${decodeURIComponent(params.get('error'))}`);
      window.history.replaceState({}, '', '/dashboard/linkedin');
    }
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check LinkedIn connection
      const { data: account } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'linkedin')
        .eq('is_active', true)
        .single();
      
      setConnectedAccount(account);

      if (account) {
        // Fetch X posts that can be cross-posted
        const { data: xPostsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', 'x')
          .in('status', ['posted', 'published'])
          .is('cross_posted_linkedin', null)
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(20);
        setXPosts(xPostsData || []);

        // Fetch LinkedIn posts
        const { data: linkedinPostsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', 'linkedin')
          .order('created_at', { ascending: false })
          .limit(30);
        setLinkedinPosts(linkedinPostsData || []);

        // Fetch settings
        const { data: settingsData } = await supabase
          .from('linkedin_settings')
          .select('settings')
          .eq('user_id', user.id)
          .single();
        if (settingsData?.settings) {
          setSettings(settingsData.settings);
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    window.location.href = '/api/auth/linkedin/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect LinkedIn? You can reconnect anytime.')) return;
    
    try {
      await supabase
        .from('connected_accounts')
        .update({ is_active: false })
        .eq('id', connectedAccount.id);
      
      setConnectedAccount(null);
      toast.info('LinkedIn disconnected');
    } catch (err) {
      toast.error('Failed to disconnect');
    }
  };

  const handleConvertPost = async (xPost) => {
    setSelectedXPost(xPost);
    setIsConverting(true);
    setConvertedContent('');
    
    try {
      const response = await fetch('/api/linkedin/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: xPost.content,
          tone: settings.tone,
          addHashtags: true,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setConvertedContent(data.post?.content || data.content || '');
      toast.success('Content converted!');
    } catch (err) {
      toast.error('Conversion failed: ' + err.message);
    } finally {
      setIsConverting(false);
    }
  };

  const handlePostNow = async () => {
    if (!convertedContent) return;
    setIsPosting(true);
    
    try {
      const response = await fetch('/api/linkedin/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: convertedContent }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (selectedXPost) {
        await supabase
          .from('posts')
          .update({ cross_posted_linkedin: true })
          .eq('id', selectedXPost.id);
      }
      
      toast.success('Posted to LinkedIn! 🎉');
      setSelectedXPost(null);
      setConvertedContent('');
      fetchData();
    } catch (err) {
      toast.error('Failed: ' + err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleSchedule = async () => {
    if (!convertedContent || !scheduleDate) return;
    setIsScheduling(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: convertedContent,
          platform: 'linkedin',
          status: 'scheduled',
          scheduled_at: new Date(scheduleDate).toISOString(),
          source: selectedXPost ? 'x_crosspost' : 'manual',
          source_post_id: selectedXPost?.id || null,
        });

      if (error) throw error;

      if (selectedXPost) {
        await supabase
          .from('posts')
          .update({ cross_posted_linkedin: true })
          .eq('id', selectedXPost.id);
      }
      
      const scheduleTime = new Date(scheduleDate).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
      
      toast.success(`Scheduled for ${scheduleTime}`);
      setSelectedXPost(null);
      setConvertedContent('');
      setShowScheduleModal(false);
      setScheduleDate('');
      fetchData();
    } catch (err) {
      toast.error('Failed to schedule');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!convertedContent) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('posts').insert({
        user_id: user.id,
        content: convertedContent,
        platform: 'linkedin',
        status: 'pending',
        source: selectedXPost ? 'x_crosspost' : 'manual',
      });
      
      toast.success('Saved as draft');
      setSelectedXPost(null);
      setConvertedContent('');
      fetchData();
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  const handleSaveSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase
        .from('linkedin_settings')
        .upsert({
          user_id: user.id,
          settings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      
      toast.success('Settings saved');
      setShowSettings(false);
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const getDefaultScheduleTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString().slice(0, 16);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0A66C2] flex items-center justify-center">
            <LinkedInIcon className="w-6 h-6 text-white animate-pulse" />
          </div>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  // Not connected state
  if (!connectedAccount) {
    return <ConnectPrompt onConnect={handleConnect} isConnecting={isConnecting} />;
  }

  // Stats
  const pendingPosts = linkedinPosts.filter(p => p.status === 'pending');
  const scheduledPosts = linkedinPosts.filter(p => p.status === 'scheduled');
  const publishedPosts = linkedinPosts.filter(p => ['posted', 'published'].includes(p.status));

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Welcome Modal */}
      {showWelcome && (
        <WelcomeModal 
          name={connectedAccount.platform_display_name?.split(' ')[0] || 'there'}
          onClose={() => setShowWelcome(false)}
          hasXPosts={xPosts.length > 0}
        />
      )}

      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 px-5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0A66C2] flex items-center justify-center">
            <LinkedInIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">LinkedIn Pipeline</h1>
            <p className="text-[11px] text-gray-500">Cross-post from X with AI tone adaptation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <CogIcon className="w-5 h-5" />
          </button>
          
          {/* Queue Link */}
          <a 
            href="/dashboard/queue?platform=linkedin" 
            className="px-3 py-1.5 text-xs font-medium text-[#0A66C2] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            View Queue →
          </a>
          
          {/* User Badge */}
          <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
            {connectedAccount.platform_avatar_url ? (
              <img src={connectedAccount.platform_avatar_url} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#0A66C2] flex items-center justify-center text-white text-xs font-bold">
                {connectedAccount.platform_display_name?.[0] || 'L'}
              </div>
            )}
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-gray-900">{connectedAccount.platform_display_name}</div>
              <button onClick={handleDisconnect} className="text-[10px] text-gray-400 hover:text-red-500">
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-5 max-w-6xl mx-auto">
        {/* Progress Stats - Only show when there's activity */}
        {(xPosts.length > 0 || linkedinPosts.length > 0) && (
          <div className="grid grid-cols-4 gap-3 mb-5">
            <StatCard 
              value={xPosts.length}
              label="Ready to Convert"
              icon={<XIcon className="w-4 h-4" />}
              color="gray"
              active={xPosts.length > 0}
            />
            <StatCard 
              value={pendingPosts.length}
              label="Drafts"
              icon={<PencilIcon className="w-4 h-4" />}
              color="amber"
              active={pendingPosts.length > 0}
              onClick={() => window.location.href = '/dashboard/queue?platform=linkedin&status=pending'}
            />
            <StatCard 
              value={scheduledPosts.length}
              label="Scheduled"
              icon={<CalendarIcon className="w-4 h-4" />}
              color="blue"
              active={scheduledPosts.length > 0}
              onClick={() => window.location.href = '/dashboard/queue?platform=linkedin&status=scheduled'}
            />
            <StatCard 
              value={publishedPosts.length}
              label="Published"
              icon={<CheckIcon className="w-4 h-4" />}
              color="emerald"
              active={publishedPosts.length > 0}
            />
          </div>
        )}

        {/* Main Content */}
        {xPosts.length === 0 && linkedinPosts.length === 0 ? (
          // Empty state - first time or no posts
          <EmptyState />
        ) : (
          <div className="grid grid-cols-5 gap-5">
            {/* Left: Post Selection */}
            <div className="col-span-3">
              {xPosts.length > 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-gray-900 text-sm">Select a Post to Convert</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{xPosts.length} X posts ready for LinkedIn</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full">
                      {xPosts.length} available
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-[500px] overflow-auto">
                    {xPosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => handleConvertPost(post)}
                        className={`w-full p-4 text-left transition-all hover:bg-gray-50 ${
                          selectedXPost?.id === post.id ? 'bg-blue-50 border-l-3 border-[#0A66C2]' : ''
                        }`}
                      >
                        <p className="text-sm text-gray-900 line-clamp-3 leading-relaxed">{post.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[10px] text-gray-400">
                            <XIcon className="w-3 h-3" />
                            Posted {formatTimeAgo(post.published_at || post.created_at)}
                          </span>
                          {selectedXPost?.id === post.id && (
                            <span className="text-[10px] font-semibold text-[#0A66C2] bg-blue-100 px-1.5 py-0.5 rounded">
                              Selected
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // No X posts but has LinkedIn posts
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <XIcon className="w-7 h-7 text-gray-300" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">All caught up!</h3>
                  <p className="text-sm text-gray-500 mb-4">No new X posts to cross-post.</p>
                  <a
                    href="/dashboard/x"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <XIcon className="w-4 h-4" />
                    Go to X Pipeline
                  </a>
                </div>
              )}

              {/* Upcoming Scheduled */}
              {scheduledPosts.length > 0 && (
                <div className="mt-5 bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 text-sm">Upcoming</h3>
                    <a href="/dashboard/queue?platform=linkedin&view=calendar" className="text-xs text-[#0A66C2] hover:underline">
                      View Calendar →
                    </a>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {scheduledPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="p-4 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <CalendarIcon className="w-4 h-4 text-[#0A66C2]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                          <p className="text-[11px] text-[#0A66C2] font-medium mt-1">
                            {new Date(post.scheduled_at).toLocaleString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Preview & Actions */}
            <div className="col-span-2">
              {selectedXPost ? (
                <div className="bg-white rounded-xl border-2 border-[#0A66C2] overflow-hidden sticky top-20">
                  {/* Header */}
                  <div className="p-4 bg-gradient-to-r from-[#0A66C2] to-[#004182] text-white">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="w-4 h-4" />
                      <span className="text-sm font-semibold">LinkedIn Preview</span>
                    </div>
                    <p className="text-xs text-blue-100 mt-1">AI-converted from your X post</p>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    {isConverting ? (
                      <div className="py-8 text-center">
                        <div className="w-8 h-8 border-2 border-[#0A66C2] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm text-gray-500">Converting with AI...</p>
                        <p className="text-xs text-gray-400 mt-1">Making it LinkedIn-ready</p>
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={convertedContent}
                          onChange={(e) => setConvertedContent(e.target.value)}
                          className="w-full h-40 p-3 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2]"
                          placeholder="Converted content..."
                        />
                        <div className="text-[10px] text-gray-400 mt-1 text-right">
                          {convertedContent.length} characters
                        </div>
                        
                        {/* Actions */}
                        <div className="space-y-2 mt-4">
                          <button
                            onClick={handlePostNow}
                            disabled={!convertedContent || isPosting}
                            className="w-full py-2.5 text-sm font-semibold text-white bg-[#0A66C2] rounded-lg hover:bg-[#004182] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            {isPosting ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <LinkedInIcon className="w-4 h-4" />
                            )}
                            Post Now
                          </button>
                          
                          <button
                            onClick={() => {
                              setScheduleDate(getDefaultScheduleTime());
                              setShowScheduleModal(true);
                            }}
                            disabled={!convertedContent}
                            className="w-full py-2.5 text-sm font-semibold text-[#0A66C2] bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <CalendarIcon className="w-4 h-4" />
                            Schedule
                          </button>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={handleSaveAsDraft}
                              disabled={!convertedContent}
                              className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                            >
                              Save Draft
                            </button>
                            <button
                              onClick={() => handleConvertPost(selectedXPost)}
                              className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"
                            >
                              <RefreshIcon className="w-3 h-3" />
                              Regenerate
                            </button>
                          </div>
                        </div>
                        
                        {/* Tone indicator */}
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Tone:</span>
                            <span className="font-medium text-gray-700 capitalize">{settings.tone}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                // No post selected
                <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8 text-center sticky top-20">
                  <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-700 mb-1">Select a post</h3>
                  <p className="text-sm text-gray-500">Click on an X post to convert it for LinkedIn</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={setSettings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          scheduleDate={scheduleDate}
          onDateChange={setScheduleDate}
          onSchedule={handleSchedule}
          onClose={() => setShowScheduleModal(false)}
          isScheduling={isScheduling}
        />
      )}
    </div>
  );
}

// ==========================================
// CONNECT PROMPT
// ==========================================

function ConnectPrompt({ onConnect, isConnecting }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A66C2]/5 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/10 overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-br from-[#0A66C2] to-[#004182] p-8 text-center text-white">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-4">
              <LinkedInIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">LinkedIn Pipeline</h1>
            <p className="text-blue-100 text-sm">Turn your X posts into professional LinkedIn content</p>
          </div>

          {/* Features */}
          <div className="p-6 space-y-3">
            {[
              { icon: '🔄', title: 'Auto Cross-post', desc: 'Convert X posts with one click' },
              { icon: '✨', title: 'AI Tone Adaptation', desc: 'Casual → Professional automatically' },
              { icon: '📅', title: 'Smart Scheduling', desc: 'Post at optimal times' },
              { icon: '📊', title: 'Track Performance', desc: 'See what resonates' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{f.title}</div>
                  <div className="text-xs text-gray-500">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="p-6 pt-0">
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="w-full py-3.5 bg-[#0A66C2] text-white font-semibold rounded-xl hover:bg-[#004182] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkedInIcon className="w-5 h-5" />
                  Connect LinkedIn
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              We only post with your approval
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// WELCOME MODAL
// ==========================================

function WelcomeModal({ name, onClose, hasXPosts }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden animate-scale-in">
        <div className="bg-gradient-to-br from-[#0A66C2] to-[#004182] p-8 text-center text-white">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-bold mb-1">Welcome, {name}!</h2>
          <p className="text-blue-100 text-sm">LinkedIn is now connected</p>
        </div>
        
        <div className="p-6">
          <div className="bg-emerald-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <CheckIcon className="w-5 h-5" />
              <span className="font-medium text-sm">Ready to cross-post</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-6">
            {hasXPosts 
              ? "You have X posts ready to convert. Select one to create your first LinkedIn post!"
              : "Publish some posts on X first, then come back to cross-post them to LinkedIn."
            }
          </p>
          
          <div className="flex gap-3">
            {hasXPosts ? (
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-[#0A66C2] text-white font-semibold rounded-xl hover:bg-[#004182] transition-colors"
              >
                Let's Go!
              </button>
            ) : (
              <>
                <a
                  href="/dashboard/x"
                  className="flex-1 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-center"
                >
                  Go to X Pipeline
                </a>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Later
                </button>
              </>
            )}
          </div>
        </div>
        
        <style jsx>{`
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          .animate-scale-in { animation: scale-in 0.2s ease-out; }
        `}</style>
      </div>
    </div>
  );
}

// ==========================================
// EMPTY STATE
// ==========================================

function EmptyState() {
  return (
    <div className="max-w-xl mx-auto py-12">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0A66C2]/10 to-blue-100 flex items-center justify-center mx-auto mb-6">
          <ArrowsIcon className="w-8 h-8 text-[#0A66C2]" />
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Cross-post</h2>
        <p className="text-gray-500 mb-8">
          Your published X posts will appear here for conversion to LinkedIn.
        </p>
        
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 text-sm mb-4">How it works</h3>
          <div className="space-y-4">
            {[
              { num: '1', text: 'Publish posts on X' },
              { num: '2', text: 'They appear here automatically' },
              { num: '3', text: 'Click to convert with AI' },
              { num: '4', text: 'Post or schedule to LinkedIn' },
            ].map((step) => (
              <div key={step.num} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0A66C2] text-white text-xs font-bold flex items-center justify-center">
                  {step.num}
                </div>
                <span className="text-sm text-gray-700">{step.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        <a
          href="/dashboard/x"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
        >
          <XIcon className="w-4 h-4" />
          Go to X Pipeline
        </a>
      </div>
    </div>
  );
}

// ==========================================
// SETTINGS MODAL
// ==========================================

function SettingsModal({ settings, onUpdate, onSave, onClose }) {
  const tones = [
    { id: 'professional', label: '💼 Professional', desc: 'Business-appropriate' },
    { id: 'thought-leader', label: '🎯 Thought Leader', desc: 'Insights & opinions' },
    { id: 'storytelling', label: '📖 Storytelling', desc: 'Narrative format' },
    { id: 'casual', label: '😊 Casual', desc: 'Friendly & approachable' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Cross-post Settings</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 space-y-5">
          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 text-sm">Auto cross-post</div>
                <div className="text-xs text-gray-500">Auto-queue new X posts</div>
              </div>
              <Toggle 
                enabled={settings.autoCrossPost}
                onChange={(v) => onUpdate({ ...settings, autoCrossPost: v })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900 text-sm">AI Tone Adaptation</div>
                <div className="text-xs text-gray-500">Convert casual → professional</div>
              </div>
              <Toggle 
                enabled={settings.toneAdaptation}
                onChange={(v) => onUpdate({ ...settings, toneAdaptation: v })}
              />
            </div>
          </div>
          
          {/* Tone Selection */}
          <div>
            <label className="block font-medium text-gray-900 text-sm mb-3">Default Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {tones.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => onUpdate({ ...settings, tone: tone.id })}
                  className={`p-3 rounded-xl text-left transition-all ${
                    settings.tone === tone.id
                      ? 'bg-[#0A66C2] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium text-sm">{tone.label}</div>
                  <div className={`text-xs mt-0.5 ${settings.tone === tone.id ? 'text-blue-100' : 'text-gray-500'}`}>
                    {tone.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button onClick={onSave} className="flex-1 py-2.5 bg-[#0A66C2] text-white font-semibold rounded-xl hover:bg-[#004182]">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SCHEDULE MODAL
// ==========================================

function ScheduleModal({ scheduleDate, onDateChange, onSchedule, onClose, isScheduling }) {
  const quickOptions = [
    { label: 'Tomorrow 9am', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0); return d; } },
    { label: 'Tomorrow 12pm', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(12, 0); return d; } },
    { label: 'Tomorrow 5pm', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(17, 0); return d; } },
    { label: 'In 2 days', getDate: () => { const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(10, 0); return d; } },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Schedule Post</h3>
          <p className="text-xs text-gray-500 mt-1">Choose when to publish</p>
        </div>
        
        <div className="p-5">
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => onDateChange(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A66C2]/20 focus:border-[#0A66C2]"
          />
          
          <div className="flex flex-wrap gap-2 mt-3">
            {quickOptions.map((opt) => (
              <button
                key={opt.label}
                onClick={() => onDateChange(opt.getDate().toISOString().slice(0, 16))}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                {opt.label}
              </button>
            ))}
          </div>
          
          <div className="bg-blue-50 rounded-xl p-3 mt-4">
            <p className="text-xs text-[#0A66C2]">
              📅 Post will appear in your Content Queue and Calendar
            </p>
          </div>
        </div>
        
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">
            Cancel
          </button>
          <button
            onClick={onSchedule}
            disabled={!scheduleDate || isScheduling}
            className="flex-1 py-2.5 bg-[#0A66C2] text-white font-semibold rounded-xl hover:bg-[#004182] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isScheduling && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTS
// ==========================================

function StatCard({ value, label, icon, color, active, onClick }) {
  const colors = {
    gray: { bg: 'bg-gray-100', text: 'text-gray-600', activeBg: 'bg-gray-900', activeText: 'text-white' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', activeBg: 'bg-amber-500', activeText: 'text-white' },
    blue: { bg: 'bg-blue-50', text: 'text-[#0A66C2]', activeBg: 'bg-[#0A66C2]', activeText: 'text-white' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', activeBg: 'bg-emerald-500', activeText: 'text-white' },
  };
  
  const c = colors[color];
  const isActive = active && value > 0;
  
  return (
    <div 
      className={`rounded-xl p-4 transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${
        isActive ? `${c.activeBg} ${c.activeText}` : `bg-white border border-gray-200`
      }`}
      onClick={onClick}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
        isActive ? 'bg-white/20' : c.bg
      }`}>
        <span className={isActive ? c.activeText : c.text}>{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${isActive ? '' : value === 0 ? 'text-gray-300' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className={`text-xs ${isActive ? 'opacity-80' : 'text-gray-500'}`}>{label}</div>
    </div>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-[#0A66C2]' : 'bg-gray-200'}`}
    >
      <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

// ==========================================
// ICONS
// ==========================================

function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  );
}

function PencilIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
  );
}

function SparklesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function CogIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function RefreshIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function ArrowLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function ArrowsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  );
}

function XMarkIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}