"use client";

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

// ==========================================
// TOAST SYSTEM
// ==========================================

const ToastContext = createContext(null);

const toastStyles = {
  success: { bg: 'bg-green-50 border-green-200', icon: '✅', iconBg: 'bg-green-100', text: 'text-green-800', progress: 'bg-green-500' },
  error: { bg: 'bg-red-50 border-red-200', icon: '❌', iconBg: 'bg-red-100', text: 'text-red-800', progress: 'bg-red-500' },
  warning: { bg: 'bg-amber-50 border-amber-200', icon: '⚠️', iconBg: 'bg-amber-100', text: 'text-amber-800', progress: 'bg-amber-500' },
  info: { bg: 'bg-blue-50 border-blue-200', icon: 'ℹ️', iconBg: 'bg-blue-100', text: 'text-blue-800', progress: 'bg-blue-500' },
};

function ToastItem({ id, type = 'info', title, message, duration = 5000, onClose, action }) {
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const style = toastStyles[type] || toastStyles.info;

  useEffect(() => {
    if (duration === Infinity) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) { clearInterval(interval); handleClose(); }
    }, 50);
    return () => clearInterval(interval);
  }, [duration]);

  const handleClose = () => { setIsLeaving(true); setTimeout(() => onClose(id), 300); };

  return (
    <div className={`relative overflow-hidden w-full max-w-sm p-4 rounded-xl border shadow-lg transform transition-all duration-300 ease-out ${style.bg} ${isLeaving ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${style.iconBg} flex items-center justify-center`}><span className="text-sm">{style.icon}</span></div>
        <div className="flex-1 min-w-0">
          {title && <p className={`font-semibold text-sm ${style.text}`}>{title}</p>}
          {message && <p className={`text-sm ${style.text} ${title ? 'mt-0.5 opacity-80' : ''}`}>{message}</p>}
          {action && <button onClick={() => { action.onClick(); handleClose(); }} className={`mt-2 text-sm font-medium ${style.text} hover:underline`}>{action.label}</button>}
        </div>
        <button onClick={handleClose} className={`flex-shrink-0 p-1 rounded-lg hover:bg-black/5 ${style.text} opacity-60 hover:opacity-100`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      {duration !== Infinity && <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5"><div className={`h-full ${style.progress} transition-all duration-100`} style={{ width: `${progress}%` }} /></div>}
    </div>
  );
}

function ToastContainer({ toasts, removeToast }) {
  if (toasts.length === 0) return null;
  return <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">{toasts.map((toast) => <ToastItem key={toast.id} {...toast} onClose={removeToast} />)}</div>;
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((options) => { const id = Date.now().toString(); setToasts((prev) => [...prev, { id, ...options }]); return id; }, []);
  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);
  const toast = useCallback((message, options = {}) => addToast({ message, ...options }), [addToast]);
  toast.success = (message, options = {}) => addToast({ type: 'success', message, ...options });
  toast.error = (message, options = {}) => addToast({ type: 'error', message, ...options });
  toast.warning = (message, options = {}) => addToast({ type: 'warning', message, ...options });
  toast.info = (message, options = {}) => addToast({ type: 'info', message, ...options });
  toast.dismiss = removeToast;
  return <ToastContext.Provider value={toast}>{children}<ToastContainer toasts={toasts} removeToast={removeToast} /></ToastContext.Provider>;
}

function useToast() { const context = useContext(ToastContext); if (!context) throw new Error('useToast must be used within ToastProvider'); return context; }

// ==========================================
// MAIN PAGE
// ==========================================

export default function GitHubAutopilotPage() {
  return <ToastProvider><GitHubAutopilotContent /></ToastProvider>;
}

function GitHubAutopilotContent() {
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [repos, setRepos] = useState([]);
  const [commits, setCommits] = useState([]);
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [settings, setSettings] = useState({
    autoGenerate: true,
    autoPost: false,
    platforms: ['x'],
    commitFilters: ['feat', 'fix', 'launch', 'ship', 'release'],
    tone: 'casual',
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('repos');
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for GitHub connected account
      const { data: account } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('platform', 'github')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      setConnectedAccount(account || null);

      if (account) {
        // Fetch connected repos
        const { data: reposData } = await supabase
          .from('github_repos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setRepos(reposData || []);

        // Fetch recent commits
        const { data: commitsData, error: commitsError } = await supabase
          .from('github_commits')
          .select('*, github_repos(repo_name, repo_full_name)')
          .eq('user_id', user.id)
          .order('committed_at', { ascending: false })
          .limit(20);
        
        if (commitsError) {
          console.error('Error fetching commits:', commitsError);
        } else {
          console.log('Fetched commits:', commitsData?.length || 0);
        }
        setCommits(commitsData || []);

        // Fetch generated posts from commits
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .eq('source', 'github')
          .order('created_at', { ascending: false })
          .limit(20);
        setGeneratedPosts(postsData || []);

        // Fetch autopilot settings
        const { data: settingsData } = await supabase
          .from('github_autopilot_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        if (settingsData) setSettings(settingsData.settings);
      }
    } catch (err) { 
      console.error('Fetch error:', err); 
    } finally { 
      setLoading(false); 
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!connectedAccount) {
    return <ConnectGitHubPrompt />;
  }

  const tabs = [
    { id: 'repos', label: 'Repositories', icon: '📁', count: repos.filter(r => r.is_active).length },
    { id: 'commits', label: 'Recent Commits', icon: '📝', count: commits.length },
    { id: 'generated', label: 'Generated Posts', icon: '✨', count: generatedPosts.length },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <GitHubIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">GitHub Autopilot</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${settings.autoPost ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className={`w-2 h-2 rounded-full ${settings.autoPost ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className={`text-sm ${settings.autoPost ? 'text-green-700' : 'text-gray-600'}`}>
              {settings.autoPost ? 'Auto-posting ON' : 'Auto-posting OFF'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full">
            <GitHubIcon className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-700">@{connectedAccount.platform_username}</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex gap-1 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'border-purple-500 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'repos' && (
          <ReposTab 
            repos={repos} 
            connectedAccount={connectedAccount}
            onUpdate={fetchData} 
          />
        )}
        {activeTab === 'commits' && (
          <CommitsTab 
            commits={commits} 
            onGeneratePost={(commit) => {
              setActiveTab('generated');
              // Trigger generation
            }}
          />
        )}
        {activeTab === 'generated' && (
          <GeneratedPostsTab 
            posts={generatedPosts}
            onUpdate={fetchData}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsTab 
            settings={settings}
            onUpdate={async (newSettings) => {
              setSettings(newSettings);
              // Save to database
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                // Upsert settings
                const { error } = await supabase
                  .from('github_autopilot_settings')
                  .upsert({
                    user_id: user.id,
                    settings: newSettings,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'user_id' });
                
                if (error) throw error;
              } catch (err) {
                console.error('Failed to save settings:', err);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

// ==========================================
// CONNECT GITHUB PROMPT
// ==========================================

function ConnectGitHubPrompt() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Redirect to GitHub OAuth
    window.location.href = '/api/auth/github';
  };

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
            <GitHubIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">GitHub Autopilot</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto py-20 px-6">
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mx-auto mb-6 shadow-xl">
            <GitHubIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Ship Code → Ship Content</h2>
          <p className="text-lg text-gray-600">
            Connect your GitHub and let AI turn your commits into engaging social posts.
          </p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <h3 className="font-semibold text-gray-900 mb-4">How it works</h3>
          <div className="space-y-4">
            {[
              { icon: '🔗', title: 'Connect your repos', desc: 'Select which repositories to monitor' },
              { icon: '📡', title: 'We listen for pushes', desc: 'Webhook triggers on every commit' },
              { icon: '✨', title: 'AI generates posts', desc: 'Turns commit messages into social content' },
              { icon: '📅', title: 'Review & schedule', desc: 'Edit if needed, then post or schedule' },
            ].map((step, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-lg flex-shrink-0">
                  {step.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{step.title}</div>
                  <div className="text-sm text-gray-500">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-200 p-6 mb-8">
          <div className="text-sm font-medium text-purple-600 mb-3">Example transformation</div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                <GitHubIcon className="w-3 h-3" />
                <span>Your commit</span>
              </div>
              <code className="text-sm text-gray-700">feat: Add Stripe integration for payments</code>
            </div>
            <div className="bg-white rounded-xl p-4 border border-purple-200">
              <div className="flex items-center gap-2 text-xs text-purple-600 mb-2">
                <span>✨</span>
                <span>Generated post</span>
              </div>
              <p className="text-sm text-gray-700">
                Just shipped Stripe integration 💳<br/><br/>
                Users can now upgrade in 2 clicks.<br/><br/>
                Took 3 hours. Should've done it months ago.<br/><br/>
                #buildinpublic
              </p>
            </div>
          </div>
        </div>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="w-full py-4 bg-gray-900 text-white font-medium rounded-2xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              Connecting...
            </>
          ) : (
            <>
              <GitHubIcon className="w-5 h-5" />
              Connect GitHub Account
            </>
          )}
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          We only request read access to your repositories
        </p>
      </div>
    </div>
  );
}

// ==========================================
// REPOS TAB
// ==========================================

function ReposTab({ repos, connectedAccount, onUpdate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [availableRepos, setAvailableRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const supabase = createClient();
  const toast = useToast();

  const fetchAvailableRepos = async () => {
    setLoadingRepos(true);
    try {
      const response = await fetch('/api/github/repos');
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Repos API error:', data);
        toast.error(data.error || 'Failed to fetch repositories');
        return;
      }
      
      if (data.repos) {
        setAvailableRepos(data.repos);
        if (data.repos.length === 0) {
          toast.info('No repositories found in your GitHub account');
        }
      }
    } catch (err) {
      console.error('Fetch repos error:', err);
      toast.error('Failed to fetch repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleAddRepo = async (repo) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      // Add repo to database - using your table's column names
      const { error } = await supabase.from('github_repos').insert({
        user_id: user.id,
        repo_id: repo.id,              // bigint - GitHub's repo ID
        repo_name: repo.name,          // text
        repo_full_name: repo.full_name, // text
        repo_url: repo.html_url,       // text
        is_active: true,
      });

      if (error) throw error;

      // Set up webhook
      const webhookResponse = await fetch('/api/github/webhook/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repo.full_name }),
      });

      const webhookData = await webhookResponse.json();
      
      if (!webhookResponse.ok) {
        console.error('Webhook setup failed:', webhookData);
        // Still show success for repo add, but warn about webhook
        toast.success(`Added ${repo.name}!`);
        toast.error(`Webhook setup failed: ${webhookData.error}. Click "Setup webhook" to retry.`);
      } else {
        toast.success(`Added ${repo.name} with auto-sync enabled! 🎉`);
      }
      
      setShowAddRepo(false);
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleToggleRepo = async (repo) => {
    try {
      await supabase
        .from('github_repos')
        .update({ is_active: !repo.is_active })
        .eq('id', repo.id);
      
      toast.success(repo.is_active ? `Paused ${repo.repo_name}` : `Activated ${repo.repo_name}`);
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRemoveRepo = async (repo) => {
    try {
      await supabase.from('github_repos').delete().eq('id', repo.id);
      toast.success(`Removed ${repo.repo_name}`);
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSyncCommits = async (repo) => {
    try {
      toast.info(`Syncing commits from ${repo.repo_name}...`);
      
      const response = await fetch('/api/github/commits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          repoId: repo.id,
          repoFullName: repo.repo_full_name 
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync commits');
      }
      
      toast.success(`Synced ${data.fetched} commits from ${repo.repo_name}!`);
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSetupWebhook = async (repo) => {
    try {
      toast.info(`Setting up webhook for ${repo.repo_name}...`);
      
      const response = await fetch('/api/github/webhook/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repo.repo_full_name }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup webhook');
      }
      
      toast.success(`Webhook created for ${repo.repo_name}! Auto-sync is now active.`);
      onUpdate();
    } catch (err) {
      console.error('Webhook setup error:', err);
      toast.error(err.message);
    }
  };

  const filteredRepos = repos.filter(r => 
    (r.repo_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.repo_full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📁 Connected Repositories</h2>
          <p className="text-gray-500 text-sm mt-1">Select repos to monitor for commits</p>
        </div>
        <button
          onClick={() => { setShowAddRepo(true); fetchAvailableRepos(); }}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
        >
          <span>+</span> Add Repository
        </button>
      </div>

      {/* Add Repo Modal */}
      {showAddRepo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Add Repository</h3>
              <button onClick={() => setShowAddRepo(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 mb-4"
              />
              
              {loadingRepos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                </div>
              ) : availableRepos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📂</div>
                  <p className="text-gray-500">No repositories found</p>
                  <p className="text-sm text-gray-400 mt-1">Make sure your GitHub account has repositories</p>
                  <button
                    onClick={fetchAvailableRepos}
                    className="mt-4 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {availableRepos
                    .filter(r => (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((repo) => {
                      const alreadyAdded = repos.some(r => r.repo_id === repo.id);
                      return (
                        <div
                          key={repo.id}
                          className={`flex items-center justify-between p-3 rounded-xl border ${
                            alreadyAdded ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <GitHubIcon className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{repo.name}</div>
                              <div className="text-xs text-gray-500">{repo.full_name}</div>
                            </div>
                          </div>
                          {alreadyAdded ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm">Added</span>
                          ) : (
                            <button
                              onClick={() => handleAddRepo(repo)}
                              className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{repos.length}</div>
          <div className="text-sm text-gray-500">Total Repos</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{repos.filter(r => r.is_active).length}</div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-400">{repos.filter(r => !r.is_active).length}</div>
          <div className="text-sm text-gray-500">Paused</div>
        </div>
      </div>

      {/* Repos List */}
      {filteredRepos.length > 0 ? (
        <div className="space-y-3">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className={`bg-white rounded-xl border p-4 transition-all ${
                repo.is_active ? 'border-green-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    repo.is_active ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <GitHubIcon className={`w-6 h-6 ${repo.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{repo.repo_name}</span>
                      {repo.is_active && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          Monitoring
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{repo.repo_full_name}</div>
                    {repo.description && (
                      <div className="text-sm text-gray-400 mt-1">{repo.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSyncCommits(repo)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100"
                    title="Fetch recent commits from GitHub"
                  >
                    🔄 Sync
                  </button>
                  <button
                    onClick={() => handleToggleRepo(repo)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      repo.is_active
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {repo.is_active ? '⏸️ Pause' : '▶️ Activate'}
                  </button>
                  <button
                    onClick={() => handleRemoveRepo(repo)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Repo Stats */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <span>📝</span>
                  <span>{repo.commits_count || 0} commits tracked</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>✨</span>
                  <span>{repo.posts_generated || 0} posts generated</span>
                </div>
                <a href={repo.repo_url} target="_blank" className="flex items-center gap-1 hover:text-purple-600">
                  <span>↗️</span>
                  <span>View on GitHub</span>
                </a>
                {/* Webhook Status */}
                {repo.webhook_id ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <span>🔗</span>
                    <span>Webhook active</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleSetupWebhook(repo)}
                    className="flex items-center gap-1 text-amber-600 hover:text-amber-700"
                  >
                    <span>⚠️</span>
                    <span>Setup webhook</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No repositories yet</h3>
          <p className="text-gray-500 mb-6">Add your first repository to start generating posts from commits</p>
          <button
            onClick={() => { setShowAddRepo(true); fetchAvailableRepos(); }}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700"
          >
            + Add Repository
          </button>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMMITS TAB
// ==========================================

function CommitsTab({ commits, onGeneratePost }) {
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const getCommitType = (message) => {
    const lower = message.toLowerCase();
    if (lower.startsWith('feat')) return { type: 'feature', color: 'bg-green-100 text-green-700', icon: '✨' };
    if (lower.startsWith('fix')) return { type: 'fix', color: 'bg-red-100 text-red-700', icon: '🐛' };
    if (lower.startsWith('docs')) return { type: 'docs', color: 'bg-blue-100 text-blue-700', icon: '📚' };
    if (lower.startsWith('refactor')) return { type: 'refactor', color: 'bg-purple-100 text-purple-700', icon: '♻️' };
    if (lower.startsWith('style')) return { type: 'style', color: 'bg-pink-100 text-pink-700', icon: '💅' };
    if (lower.startsWith('test')) return { type: 'test', color: 'bg-yellow-100 text-yellow-700', icon: '🧪' };
    if (lower.startsWith('chore')) return { type: 'chore', color: 'bg-gray-100 text-gray-700', icon: '🔧' };
    return { type: 'other', color: 'bg-gray-100 text-gray-600', icon: '📝' };
  };

  const filteredCommits = filter === 'all' 
    ? commits 
    : commits.filter(c => getCommitType(c.message).type === filter);

  const [showVariationModal, setShowVariationModal] = useState(false);
  const [variations, setVariations] = useState([]);
  const [generatingCommit, setGeneratingCommit] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePost = async (commit) => {
    try {
      setIsGenerating(true);
      setGeneratingCommit(commit);
      toast.info('Analyzing commit and generating variations... 🤖');
      
      const response = await fetch('/api/github/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitId: commit.id,
          commitSha: commit.sha,
          commitMessage: commit.message,
          repoName: commit.github_repos?.repo_name || 'my project',
          repoFullName: commit.github_repos?.repo_full_name,
          platform: 'x',
          generateVariations: true,
          saveToDb: false,
        }),
      });

      const data = await response.json();

      if (data.variations) {
        setVariations(data.variations);
        setShowVariationModal(true);
        if (data.usedAI) {
          toast.success('AI generated 5 variations!');
        } else {
          toast.info('Using templates (add ANTHROPIC_API_KEY for AI)');
        }
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Generate post error:', err);
      toast.error(err.message || 'Failed to generate post');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariation = async (variation) => {
    try {
      toast.info('Saving post...');
      
      const response = await fetch('/api/github/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitId: generatingCommit.id,
          commitSha: generatingCommit.sha,
          commitMessage: generatingCommit.message,
          repoName: generatingCommit.github_repos?.repo_name || 'my project',
          repoFullName: generatingCommit.github_repos?.repo_full_name,
          platform: 'x',
          generateVariations: false,
          selectedStyle: variation.style,
          saveToDb: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Post saved! Check Generated Posts tab');
        setShowVariationModal(false);
        setVariations([]);
        setGeneratingCommit(null);
        onGeneratePost(generatingCommit);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSaveCustomContent = async (customContent) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: customContent,
        platform: 'x',
        status: 'draft',
        source: 'github',
        source_commit: generatingCommit?.sha,
      });

      if (error) throw error;

      toast.success('Post saved!');
      setShowVariationModal(false);
      setVariations([]);
      setGeneratingCommit(null);
      onGeneratePost(generatingCommit);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📝 Recent Commits</h2>
          <p className="text-gray-500 text-sm mt-1">Commits from your monitored repositories</p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'feature', 'fix', 'docs', 'refactor', 'other'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Commits List */}
      {filteredCommits.length > 0 ? (
        <div className="space-y-3">
          {filteredCommits.map((commit) => {
            const commitType = getCommitType(commit.message);
            return (
              <div key={commit.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${commitType.color}`}>
                        {commitType.icon} {commitType.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {commit.github_repos?.repo_name || 'Unknown repo'}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 mb-2">{commit.message}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {commit.sha?.slice(0, 7)}
                      </span>
                      <span>{new Date(commit.committed_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {commit.post_generated ? (
                      <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm">
                        ✅ Post created
                      </span>
                    ) : (
                      <button
                        onClick={() => handleGeneratePost(commit)}
                        disabled={isGenerating && generatingCommit?.id === commit.id}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-70 flex items-center gap-2"
                      >
                        {isGenerating && generatingCommit?.id === commit.id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>✨ Generate Post</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No commits yet</h3>
          <p className="text-gray-500">Push some code to your connected repos to see commits here</p>
        </div>
      )}

      {/* Variation Selector Modal */}
      {showVariationModal && (
        <VariationSelectorModal
          variations={variations}
          commit={generatingCommit}
          onSelect={handleSelectVariation}
          onSaveCustom={handleSaveCustomContent}
          onClose={() => {
            setShowVariationModal(false);
            setVariations([]);
            setGeneratingCommit(null);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// VARIATION SELECTOR MODAL
// ==========================================

function VariationSelectorModal({ variations, commit, onSelect, onSaveCustom, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [customContent, setCustomContent] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const charCount = isCustom ? customContent.length : (variations[selectedIndex]?.content.length || 0);
  const isOverLimit = charCount > 280;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">✨ Choose Your Post Style</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              AI generated 5 variations • Select one or customize
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Commit Info */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-mono text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
              {commit?.sha?.slice(0, 7)}
            </span>
            <span className="text-gray-700 font-medium">{commit?.message}</span>
          </div>
        </div>

        {/* Variations */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {variations.map((variation, index) => (
              <button
                key={variation.style}
                onClick={() => {
                  setSelectedIndex(index);
                  setIsCustom(false);
                  setCustomContent(variation.content);
                }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedIndex === index && !isCustom
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${
                    selectedIndex === index && !isCustom ? 'text-purple-700' : 'text-gray-700'
                  }`}>
                    {variation.label}
                  </span>
                  <span className={`text-xs ${
                    variation.charCount > 280 ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    {variation.charCount}/280
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">
                  {variation.content}
                </p>
              </button>
            ))}

            {/* Custom Option */}
            <div
              className={`p-4 rounded-xl border-2 transition-all ${
                isCustom
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-dashed border-gray-300 hover:border-gray-400'
              }`}
            >
              <button
                onClick={() => {
                  setIsCustom(true);
                  setSelectedIndex(null);
                }}
                className="w-full text-left"
              >
                <span className={`text-sm font-semibold ${isCustom ? 'text-purple-700' : 'text-gray-500'}`}>
                  ✏️ Write Custom
                </span>
              </button>
              
              {isCustom && (
                <div className="mt-3">
                  <textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    placeholder="Write your own post..."
                    className={`w-full min-h-[100px] p-3 border rounded-lg focus:outline-none focus:ring-2 resize-none text-sm ${
                      isOverLimit
                        ? 'border-red-300 focus:ring-red-500/20'
                        : 'border-gray-200 focus:ring-purple-500/20'
                    }`}
                    autoFocus
                  />
                  <div className={`text-xs mt-1 ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
                    {customContent.length}/280 characters
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedIndex !== null && !isCustom && (
              <span>Selected: <strong>{variations[selectedIndex]?.label}</strong></span>
            )}
            {isCustom && customContent && (
              <span className={isOverLimit ? 'text-red-500' : ''}>
                Custom post • {customContent.length}/280 chars
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (isCustom && customContent) {
                  onSaveCustom(customContent);
                } else if (selectedIndex !== null) {
                  onSelect(variations[selectedIndex]);
                }
              }}
              disabled={(selectedIndex === null && !isCustom) || (isCustom && !customContent) || isOverLimit}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save as Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// GENERATED POSTS TAB - IMPROVED
// ==========================================

function GeneratedPostsTab({ posts, onUpdate }) {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingPost, setSchedulingPost] = useState(null);
  const [isPosting, setIsPosting] = useState(null);
  const supabase = createClient();
  const toast = useToast();

  // Filter posts
  const filteredPosts = posts.filter(p => {
    const platformMatch = selectedPlatform === 'all' || p.platform === selectedPlatform;
    const statusMatch = selectedStatus === 'all' || p.status === selectedStatus;
    return platformMatch && statusMatch;
  });

  // Stats
  const stats = {
    total: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    posted: posts.filter(p => p.status === 'posted').length,
  };

  const handlePostNow = async (post) => {
    setIsPosting(post.id);
    try {
      const response = await fetch('/api/posts/x/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.content, postId: post.id }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to post');
      }
      
      toast.success('Posted to X! 🎉');
      onUpdate();
    } catch (err) {
      console.error('Post error:', err);
      toast.error(err.message);
    } finally {
      setIsPosting(null);
    }
  };

  const handleSchedule = (post, scheduledTime) => {
    setSchedulingPost(post);
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = async (scheduledTime) => {
    if (!schedulingPost) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .update({ 
          status: 'scheduled',
          scheduled_at: scheduledTime.toISOString()
        })
        .eq('id', schedulingPost.id);
      
      if (error) throw error;
      
      toast.success(`Scheduled for ${scheduledTime.toLocaleString()}`);
      setShowScheduleModal(false);
      setSchedulingPost(null);
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm('Delete this post?')) return;
    
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (!error) {
      toast.success('Post deleted');
      onUpdate();
    }
  };

  const handleEdit = async (post, newContent) => {
    const { error } = await supabase
      .from('posts')
      .update({ content: newContent, updated_at: new Date().toISOString() })
      .eq('id', post.id);
    
    if (!error) {
      toast.success('Post updated');
      onUpdate();
    }
  };

  const handleRegenerate = async (post) => {
    toast.info('Regenerating post...');
    try {
      const response = await fetch('/api/github/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitId: null,
          commitMessage: post.content.split('\n')[0], // Use first line as base
          repoName: 'my project',
          platform: post.platform,
          tone: ['casual', 'professional', 'funny', 'hype'][Math.floor(Math.random() * 4)],
        }),
      });
      
      if (response.ok) {
        toast.success('New version generated!');
        onUpdate();
      }
    } catch (err) {
      toast.error('Failed to regenerate');
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">✨ Generated Posts</h2>
          <p className="text-gray-500 text-sm mt-1">AI-generated content from your commits</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg">
            <span className="text-gray-500">Total:</span>
            <span className="font-semibold text-gray-900">{stats.total}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg">
            <span className="text-amber-600">Drafts:</span>
            <span className="font-semibold text-amber-700">{stats.draft}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-lg">
            <span className="text-blue-600">Scheduled:</span>
            <span className="font-semibold text-blue-700">{stats.scheduled}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg">
            <span className="text-green-600">Posted:</span>
            <span className="font-semibold text-green-700">{stats.posted}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Platform Filter */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {[
            { id: 'all', label: 'All', icon: '📱' },
            { id: 'x', label: 'X', icon: <XIcon className="w-3.5 h-3.5" /> },
            { id: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon className="w-3.5 h-3.5" /> },
            { id: 'reddit', label: 'Reddit', icon: '🟠' },
          ].map((platform) => (
            <button
              key={platform.id}
              onClick={() => setSelectedPlatform(platform.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                selectedPlatform === platform.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{platform.icon}</span>
              {platform.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {[
            { id: 'all', label: 'All Status' },
            { id: 'draft', label: 'Drafts' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'posted', label: 'Posted' },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setSelectedStatus(status.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedStatus === status.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length > 0 ? (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <ImprovedPostCard
              key={post.id}
              post={post}
              isPosting={isPosting === post.id}
              onPostNow={() => handlePostNow(post)}
              onSchedule={() => handleSchedule(post)}
              onDelete={() => handleDelete(post.id)}
              onEdit={(newContent) => handleEdit(post, newContent)}
              onRegenerate={() => handleRegenerate(post)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="text-6xl mb-4">✨</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts found</h3>
          <p className="text-gray-500 mb-6">
            {posts.length === 0 
              ? "Generate your first post from the Recent Commits tab"
              : "Try adjusting your filters"
            }
          </p>
          {posts.length === 0 && (
            <p className="text-sm text-gray-400">
              Go to Recent Commits → Click "Generate Post" on any commit
            </p>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleModal
          post={schedulingPost}
          onClose={() => { setShowScheduleModal(false); setSchedulingPost(null); }}
          onSchedule={handleConfirmSchedule}
        />
      )}
    </div>
  );
}

// ==========================================
// IMPROVED POST CARD
// ==========================================

function ImprovedPostCard({ post, isPosting, onPostNow, onSchedule, onDelete, onEdit, onRegenerate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showActions, setShowActions] = useState(false);

  const charLimit = post.platform === 'x' ? 280 : post.platform === 'linkedin' ? 3000 : 10000;
  const charCount = editContent.length;
  const isOverLimit = charCount > charLimit;
  const charWarning = post.platform === 'x' && charCount > 250;

  const platformConfig = {
    x: { 
      name: 'X / Twitter', 
      icon: <XIcon className="w-4 h-4" />,
      bg: 'bg-black',
      text: 'text-white'
    },
    linkedin: { 
      name: 'LinkedIn', 
      icon: <LinkedInIcon className="w-4 h-4" />,
      bg: 'bg-[#0A66C2]',
      text: 'text-white'
    },
    reddit: { 
      name: 'Reddit', 
      icon: <span className="text-sm">🟠</span>,
      bg: 'bg-orange-500',
      text: 'text-white'
    },
  };

  const statusConfig = {
    draft: { label: 'Draft', bg: 'bg-amber-100', text: 'text-amber-700', icon: '📝' },
    scheduled: { label: 'Scheduled', bg: 'bg-blue-100', text: 'text-blue-700', icon: '📅' },
    posted: { label: 'Posted', bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
    failed: { label: 'Failed', bg: 'bg-red-100', text: 'text-red-700', icon: '❌' },
  };

  const platform = platformConfig[post.platform] || platformConfig.x;
  const status = statusConfig[post.status] || statusConfig.draft;

  const handleSave = () => {
    if (isOverLimit) return;
    onEdit(editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(post.content);
    setIsEditing(false);
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Platform Badge */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${platform.bg} ${platform.text}`}>
            {platform.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{platform.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                {status.icon} {status.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              {post.source_commit && (
                <span className="flex items-center gap-1">
                  <GitHubIcon className="w-3 h-3" />
                  {post.source_commit.slice(0, 7)}
                </span>
              )}
              <span>•</span>
              <span>{new Date(post.created_at).toLocaleDateString()}</span>
              {post.scheduled_at && post.status === 'scheduled' && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">
                    📅 {new Date(post.scheduled_at).toLocaleString()}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions (visible on hover) */}
        <div className={`flex items-center gap-1 transition-opacity ${showActions || isEditing ? 'opacity-100' : 'opacity-0'}`}>
          {post.status === 'draft' && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={onRegenerate}
                className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Regenerate"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={`w-full min-h-[150px] p-4 border rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none ${
                isOverLimit 
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                  : 'border-gray-200 focus:ring-purple-500/20 focus:border-purple-500'
              }`}
              placeholder="Write your post..."
              autoFocus
            />
            {/* Character Counter */}
            <div className="flex items-center justify-between">
              <div className={`text-sm font-medium ${
                isOverLimit ? 'text-red-600' : charWarning ? 'text-amber-600' : 'text-gray-500'
              }`}>
                {charCount} / {charLimit} characters
                {isOverLimit && <span className="ml-2">⚠️ Too long!</span>}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isOverLimit}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isOverLimit
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="text-gray-800 whitespace-pre-wrap leading-relaxed cursor-pointer hover:bg-gray-50 p-3 -m-3 rounded-xl transition-colors"
            onClick={() => post.status === 'draft' && setIsEditing(true)}
          >
            {post.content}
          </div>
        )}
      </div>

      {/* Actions Footer - Only for drafts */}
      {!isEditing && post.status === 'draft' && (
        <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {post.platform === 'x' && (
              <span className={charCount > 280 ? 'text-red-600 font-medium' : ''}>
                {charCount}/280 chars
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onSchedule}
              className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule
            </button>
            <button
              onClick={onPostNow}
              disabled={isPosting}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isPosting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Post Now
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Scheduled Footer */}
      {post.status === 'scheduled' && (
        <div className="px-5 py-4 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">
              Scheduled for {new Date(post.scheduled_at).toLocaleString()}
            </span>
          </div>
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.from('posts').update({ status: 'draft', scheduled_at: null }).eq('id', post.id);
              onDelete(); // triggers refresh
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Cancel Schedule
          </button>
        </div>
      )}

      {/* Posted Footer */}
      {post.status === 'posted' && (
        <div className="px-5 py-4 bg-green-50 border-t border-green-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Posted successfully</span>
          </div>
          {post.posted_url && (
            <a
              href={post.posted_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
            >
              View on {platform.name}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// SCHEDULE MODAL
// ==========================================

function ScheduleModal({ post, onClose, onSchedule }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');

  const quickOptions = [
    { label: 'In 1 hour', getValue: () => new Date(Date.now() + 60 * 60 * 1000) },
    { label: 'In 3 hours', getValue: () => new Date(Date.now() + 3 * 60 * 60 * 1000) },
    { label: 'Tomorrow 9am', getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(9, 0, 0, 0);
      return d;
    }},
    { label: 'Tomorrow 12pm', getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(12, 0, 0, 0);
      return d;
    }},
  ];

  const handleCustomSchedule = () => {
    if (!selectedDate) return;
    const [hours, minutes] = selectedTime.split(':');
    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    onSchedule(scheduledDate);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">📅 Schedule Post</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Quick Options */}
        <div className="p-6">
          <p className="text-sm text-gray-500 mb-4">Quick schedule:</p>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {quickOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => onSchedule(option.getValue())}
                className="px-4 py-3 bg-gray-100 hover:bg-purple-100 hover:text-purple-700 rounded-xl text-sm font-medium transition-colors text-left"
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Date/Time */}
          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm text-gray-500 mb-4">Or pick a specific time:</p>
            <div className="flex gap-3">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <button
              onClick={handleCustomSchedule}
              disabled={!selectedDate}
              className="w-full mt-4 px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Schedule for this time
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Keep the old GeneratedPostCard as backup (can be removed later)
function GeneratedPostCard({ post, onPostNow, onSchedule, onDelete, onEdit }) {
  return <ImprovedPostCard post={post} onPostNow={onPostNow} onSchedule={onSchedule} onDelete={onDelete} onEdit={onEdit} onRegenerate={() => {}} />;
}

// ==========================================
// SETTINGS TAB
// ==========================================

function SettingsTab({ settings, onUpdate }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to database
      onUpdate(localSettings);
      toast.success('Settings saved!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toneOptions = [
    { id: 'casual', label: '😊 Casual', desc: 'Friendly, conversational' },
    { id: 'professional', label: '💼 Professional', desc: 'Business-appropriate' },
    { id: 'funny', label: '😄 Funny', desc: 'Witty, self-deprecating' },
    { id: 'hype', label: '🔥 Hype', desc: 'Energetic, excited' },
  ];

  const commitFilters = [
    { id: 'feat', label: 'Features', desc: 'feat: commits' },
    { id: 'fix', label: 'Bug Fixes', desc: 'fix: commits' },
    { id: 'launch', label: 'Launches', desc: 'launch/ship/release' },
    { id: 'docs', label: 'Documentation', desc: 'docs: commits' },
    { id: 'refactor', label: 'Refactors', desc: 'refactor: commits' },
    { id: 'all', label: 'All Commits', desc: 'Every commit' },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">⚙️ Autopilot Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Configure how posts are generated from your commits</p>
      </div>

      <div className="space-y-6">
        {/* Auto Generate Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Auto-generate posts</h3>
              <p className="text-sm text-gray-500 mt-1">Automatically create posts when commits are pushed</p>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, autoGenerate: !localSettings.autoGenerate })}
              className={`w-14 h-8 rounded-full transition-colors ${
                localSettings.autoGenerate ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                localSettings.autoGenerate ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Auto Post Toggle */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Auto-post (hands-free mode)</h3>
              <p className="text-sm text-gray-500 mt-1">Automatically publish posts without review</p>
              <p className="text-xs text-amber-600 mt-2">⚠️ Posts will go live immediately. Use with caution.</p>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, autoPost: !localSettings.autoPost })}
              className={`w-14 h-8 rounded-full transition-colors ${
                localSettings.autoPost ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
                localSettings.autoPost ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Platforms */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Target platforms</h3>
          <p className="text-sm text-gray-500 mb-4">Which platforms should posts be generated for?</p>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'x', label: 'X / Twitter', icon: '🐦' },
              { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
              { id: 'reddit', label: 'Reddit', icon: '🟠' },
            ].map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  const platforms = localSettings.platforms || [];
                  const newPlatforms = platforms.includes(platform.id)
                    ? platforms.filter(p => p !== platform.id)
                    : [...platforms, platform.id];
                  setLocalSettings({ ...localSettings, platforms: newPlatforms });
                }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 border-2 transition-all ${
                  localSettings.platforms?.includes(platform.id)
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span>{platform.icon}</span>
                {platform.label}
                {localSettings.platforms?.includes(platform.id) && (
                  <span className="ml-1">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Commit Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Commit filters</h3>
          <p className="text-sm text-gray-500 mb-4">Which types of commits should generate posts?</p>
          <div className="grid grid-cols-2 gap-2">
            {commitFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  const filters = localSettings.commitFilters || [];
                  const newFilters = filters.includes(filter.id)
                    ? filters.filter(f => f !== filter.id)
                    : [...filters, filter.id];
                  setLocalSettings({ ...localSettings, commitFilters: newFilters });
                }}
                className={`p-3 rounded-xl text-left border-2 transition-all ${
                  localSettings.commitFilters?.includes(filter.id)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{filter.label}</div>
                <div className="text-xs text-gray-500">{filter.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-3">Post tone</h3>
          <p className="text-sm text-gray-500 mb-4">How should generated posts sound?</p>
          <div className="grid grid-cols-2 gap-2">
            {toneOptions.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setLocalSettings({ ...localSettings, tone: tone.id })}
                className={`p-3 rounded-xl text-left border-2 transition-all ${
                  localSettings.tone === tone.id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{tone.label}</div>
                <div className="text-xs text-gray-500">{tone.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {isSaving ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// ICONS
// ==========================================

function GitHubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
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

function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}