'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';

// ==========================================
// ICONS
// ==========================================

const GitHubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
  </svg>
);

const ExternalLinkIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
  </svg>
);

// ==========================================
// TOAST SYSTEM
// ==========================================

const ToastContext = createContext(null);

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium cursor-pointer animate-slide-up max-w-sm ${
            t.type === 'success' ? 'bg-emerald-500 text-white' :
            t.type === 'error' ? 'bg-red-500 text-white' :
            t.type === 'info' ? 'bg-blue-500 text-white' :
            'bg-gray-900 text-white'
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = (toast) => {
    const id = Date.now();
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const toast = (message) => addToast({ type: 'default', message });
  toast.success = (message) => addToast({ type: 'success', message });
  toast.error = (message) => addToast({ type: 'error', message });
  toast.info = (message) => addToast({ type: 'info', message });

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

const useToast = () => useContext(ToastContext);

// ==========================================
// MAIN PAGE
// ==========================================

export default function GitHubAutopilotPage() {
  return (
    <ToastProvider>
      <GitHubAutopilotContent />
      <style jsx global>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </ToastProvider>
  );
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
    commitFilters: ['feat', 'fix', 'launch'],
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

      const { data: account } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('platform', 'github')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      setConnectedAccount(account || null);

      if (account) {
        const { data: reposData } = await supabase
          .from('github_repos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setRepos(reposData || []);

        const { data: commitsData } = await supabase
          .from('github_commits')
          .select('*, github_repos(repo_name, repo_full_name)')
          .eq('user_id', user.id)
          .or('skipped.is.null,skipped.eq.false')
          .order('committed_at', { ascending: false })
          .limit(30);
        setCommits(commitsData || []);

        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .eq('source', 'github')
          .order('created_at', { ascending: false })
          .limit(30);
        setGeneratedPosts(postsData || []);

        const { data: settingsData } = await supabase
          .from('github_autopilot_settings')
          .select('settings')
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
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-xl">
            <GitHubIcon className="w-6 h-6 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!connectedAccount) {
    return <ConnectGitHubPrompt />;
  }

  const activeRepos = repos.filter(r => r.is_active).length;
  const drafts = generatedPosts.filter(p => p.status === 'draft').length;
  const scheduled = generatedPosts.filter(p => p.status === 'scheduled').length;
  const posted = generatedPosts.filter(p => p.status === 'posted').length;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center shadow-lg">
              <GitHubIcon className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">GitHub Autopilot</h1>
              <p className="text-xs text-gray-500">Ship code → Ship content</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              settings.autoPost 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${settings.autoPost ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="hidden sm:inline">{settings.autoPost ? 'Auto-posting ON' : 'Auto-posting OFF'}</span>
              <span className="sm:hidden">{settings.autoPost ? 'ON' : 'OFF'}</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-full text-xs sm:text-sm font-medium">
              <GitHubIcon className="w-4 h-4" />
              <span className="hidden sm:inline">@{connectedAccount.platform_username}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-8 overflow-x-auto">
            <Stat label="Repos" value={activeRepos} icon="📁" />
            <Stat label="Commits" value={commits.length} icon="📝" />
            <Stat label="Drafts" value={drafts} icon="✏️" />
            <Stat label="Scheduled" value={scheduled} icon="📅" />
            <Stat label="Posted" value={posted} icon="✅" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'repos', label: 'Repositories', shortLabel: 'Repos', count: activeRepos },
              { id: 'commits', label: 'Recent Commits', shortLabel: 'Commits', count: commits.length },
              { id: 'generated', label: 'Generated Posts', shortLabel: 'Posts', count: generatedPosts.length },
              { id: 'settings', label: 'Settings', shortLabel: 'Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'repos' && (
          <ReposTab repos={repos} connectedAccount={connectedAccount} onUpdate={fetchData} toast={toast} />
        )}
        {activeTab === 'commits' && (
          <CommitsTab commits={commits} onUpdate={fetchData} toast={toast} />
        )}
        {activeTab === 'generated' && (
          <GeneratedPostsTab posts={generatedPosts} onUpdate={fetchData} toast={toast} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab settings={settings} onUpdate={async (newSettings) => {
            setSettings(newSettings);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from('github_autopilot_settings')
              .upsert({ user_id: user.id, settings: newSettings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
            toast.success('Settings saved!');
          }} toast={toast} />
        )}
      </div>
    </div>
  );
}

// ==========================================
// STAT COMPONENT
// ==========================================

function Stat({ label, value, icon }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className="text-lg sm:text-xl">{icon}</span>
      <div>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ==========================================
// CONNECT GITHUB PROMPT
// ==========================================

function ConnectGitHubPrompt() {
  const [isConnecting, setIsConnecting] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/20">
            <GitHubIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ship Code → Ship Content</h1>
          <p className="text-gray-400 text-base sm:text-lg">
            Connect GitHub and let AI turn your commits into engaging social posts.
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10 mb-6">
          <div className="space-y-3">
            {[
              { icon: '🔗', text: 'Connect your repositories' },
              { icon: '🤖', text: 'AI generates posts from commits' },
              { icon: '✨', text: 'Choose variations, edit, or auto-post' },
              { icon: '🚀', text: 'Never go dark on social media again' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm sm:text-base">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => { setIsConnecting(true); window.location.href = '/api/auth/github'; }}
          disabled={isConnecting}
          className="w-full py-3.5 bg-white text-gray-900 rounded-xl font-semibold text-base hover:bg-gray-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <GitHubIcon className="w-5 h-5" />
          {isConnecting ? 'Connecting...' : 'Connect GitHub'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// REPOS TAB
// ==========================================

function ReposTab({ repos, connectedAccount, onUpdate, toast }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableRepos, setAvailableRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [addingRepo, setAddingRepo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAvailableRepos = async () => {
    setLoadingRepos(true);
    try {
      const response = await fetch('/api/github/repos');
      const data = await response.json();
      setAvailableRepos(data.repos || []);
    } catch (err) {
      toast.error('Failed to fetch repos');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleAddRepo = async (repo) => {
    setAddingRepo(repo.full_name);
    try {
      const response = await fetch('/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoFullName: repo.full_name,
          repoName: repo.name,
          repoDescription: repo.description,
          isPrivate: repo.private,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || `${repo.name} connected! 🎉`);
        setShowAddModal(false);
        onUpdate();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAddingRepo(null);
    }
  };

  const filteredRepos = availableRepos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Connected Repositories</h2>
          <p className="text-gray-500 text-sm mt-1">Repos monitored for commits</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); fetchAvailableRepos(); }}
          className="px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
        >
          <span>+</span> Add Repository
        </button>
      </div>

      {repos.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <GitHubIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No repositories connected</h3>
          <p className="text-gray-500 mb-6 px-4">Add a repository to start generating posts from commits</p>
          <button
            onClick={() => { setShowAddModal(true); fetchAvailableRepos(); }}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all"
          >
            Add your first repo
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {repos.map((repo) => (
            <RepoCard key={repo.id} repo={repo} onUpdate={onUpdate} toast={toast} />
          ))}
        </div>
      )}

      {/* Add Repo Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">Add Repository</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              />
            </div>
            
            <div className="p-4 sm:p-5 overflow-y-auto max-h-[60vh]">
              {loadingRepos ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-500 mt-3">Loading your repos...</p>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No repos match your search' : 'No repos found'}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => !repo.connected && handleAddRepo(repo)}
                      disabled={repo.connected || addingRepo === repo.full_name}
                      className={`w-full p-3 sm:p-4 rounded-xl border text-left transition-all ${
                        repo.connected
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : addingRepo === repo.full_name
                          ? 'border-gray-300 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <GitHubIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{repo.name}</p>
                            <p className="text-xs text-gray-500 truncate">{repo.full_name}</p>
                          </div>
                        </div>
                        {repo.connected ? (
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap">✓ Connected</span>
                        ) : addingRepo === repo.full_name ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                        ) : (
                          <span className="text-xs text-gray-400 whitespace-nowrap">Click to add →</span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-1">{repo.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RepoCard({ repo, onUpdate, toast }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  const handleSync = async () => {
    setIsSyncing(true);
    toast.info('Syncing commits...');
    try {
      const response = await fetch(`/api/github/sync?repoId=${repo.id}`, { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        toast.success(`Synced ${data.newCommits || 0} new commits!`);
        onUpdate();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggle = async () => {
    const { error } = await supabase
      .from('github_repos')
      .update({ is_active: !repo.is_active })
      .eq('id', repo.id);
    
    if (!error) {
      toast.success(repo.is_active ? 'Monitoring paused' : 'Monitoring resumed');
      onUpdate();
    }
  };

  const handleDelete = async () => {
    if (!confirm('Remove this repository? This will not delete your posts.')) return;
    
    try {
      const response = await fetch('/api/github/repos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: repo.id }),
      });
      
      if (response.ok) {
        toast.success('Repository removed');
        onUpdate();
      }
    } catch (err) {
      toast.error('Failed to remove repo');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shrink-0">
            <GitHubIcon className="w-6 h-6 text-gray-700" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-gray-900">{repo.repo_name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                repo.is_active 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                {repo.is_active ? '● Monitoring' : '○ Paused'}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">{repo.repo_full_name}</p>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
              <span>📝 {repo.commit_count || 0} commits</span>
              <span>✨ {repo.post_count || 0} posts</span>
              {repo.webhook_active && (
                <span className="text-emerald-600">🔗 Webhook active</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
          <button
            onClick={handleToggle}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              repo.is_active
                ? 'text-amber-600 hover:bg-amber-50'
                : 'text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            {repo.is_active ? '⏸ Pause' : '▶ Resume'}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMMITS TAB - With Side-by-Side Preview
// ==========================================

function CommitsTab({ commits, onUpdate, toast }) {
  const [filter, setFilter] = useState('all');
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [variations, setVariations] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [diffData, setDiffData] = useState(null);

  const filteredCommits = filter === 'all' 
    ? commits 
    : commits.filter(c => getCommitType(c.message).type === filter);

  const handleGeneratePost = async (commit) => {
    setSelectedCommit(commit);
    setIsGenerating(true);
    setVariations([]);
    setDiffData(null);

    try {
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
        setDiffData(data.diffSummary);
        toast.success('Generated 5 variations!');
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err.message);
      setSelectedCommit(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariation = async (variation, customContent = null) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const content = customContent || variation.content;
      
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content,
        platform: 'x',
        status: 'draft',
        source: 'github',
        source_commit: selectedCommit?.sha,
      });

      if (error) throw error;

      toast.success('Post saved to drafts!');
      setSelectedCommit(null);
      setVariations([]);
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Commits List */}
      <div className={`${selectedCommit ? 'lg:w-1/2' : 'w-full'} transition-all`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recent Commits</h2>
            <p className="text-gray-500 text-sm mt-1">Click a commit to generate posts</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'feature', 'fix', 'launch', 'docs', 'other'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Commits */}
        {filteredCommits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <p className="text-gray-500">No commits found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCommits.map((commit) => (
              <CommitCard
                key={commit.id}
                commit={commit}
                isSelected={selectedCommit?.id === commit.id}
                onClick={() => handleGeneratePost(commit)}
                isGenerating={isGenerating && selectedCommit?.id === commit.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Panel */}
      {selectedCommit && (
        <div className="lg:w-1/2 lg:sticky lg:top-24 lg:self-start">
          <PreviewPanel
            commit={selectedCommit}
            variations={variations}
            diffData={diffData}
            isGenerating={isGenerating}
            onSelect={handleSelectVariation}
            onClose={() => { setSelectedCommit(null); setVariations([]); }}
            toast={toast}
          />
        </div>
      )}
    </div>
  );
}

function CommitCard({ commit, isSelected, onClick, isGenerating }) {
  const { type, emoji } = getCommitType(commit.message);
  const cleanMessage = commit.message.split('\n')[0].replace(/^(feat|fix|docs|refactor|chore|style|test)(\(.+\))?:\s*/i, '');

  return (
    <button
      onClick={onClick}
      disabled={isGenerating}
      className={`w-full p-4 rounded-xl border text-left transition-all ${
        isSelected
          ? 'border-gray-900 bg-gray-50 shadow-md ring-1 ring-gray-900'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl shrink-0">{emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 line-clamp-2">{cleanMessage}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
            <span className="truncate">{commit.github_repos?.repo_name}</span>
            <span>•</span>
            <span className="font-mono">{commit.sha?.slice(0, 7)}</span>
            <span>•</span>
            <span>{formatDate(commit.committed_at)}</span>
          </div>
        </div>
        
        <div className="shrink-0">
          {commit.post_generated ? (
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium">✓ Done</span>
          ) : isGenerating ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">Generate →</span>
          )}
        </div>
      </div>
    </button>
  );
}

function PreviewPanel({ commit, variations, diffData, isGenerating, onSelect, onClose, toast }) {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedContent, setEditedContent] = useState('');

  const handleSaveEdited = () => {
    if (editedContent.trim()) {
      onSelect(null, editedContent);
    }
    setEditingIndex(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <h3 className="font-semibold text-gray-900">Generate Post</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {/* Commit Info */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">From commit</p>
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <p className="font-mono text-sm text-gray-800 break-words">
              {commit.message.split('\n')[0]}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{commit.sha?.slice(0, 7)}</span>
              <span>{commit.github_repos?.repo_name}</span>
            </div>
          </div>
          
          {diffData && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <span className="px-2 py-1 bg-gray-100 rounded-full">📁 {diffData.totalFiles} files</span>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full">+{diffData.totalAdditions}</span>
              <span className="px-2 py-1 bg-red-50 text-red-600 rounded-full">-{diffData.totalDeletions}</span>
            </div>
          )}
        </div>

        {/* Variations */}
        <div className="p-4">
          {isGenerating ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600 font-medium">Analyzing code changes...</p>
              <p className="text-xs text-gray-400 mt-1">Generating 5 variations</p>
            </div>
          ) : variations.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Choose a variation</p>
              {variations.map((v, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">{v.label}</span>
                    <span className={`text-xs ${v.charCount > 280 ? 'text-red-500' : 'text-gray-400'}`}>{v.charCount}/280</span>
                  </div>
                  
                  {editingIndex === i ? (
                    <div>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                        rows={4}
                        maxLength={280}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${editedContent.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
                          {editedContent.length}/280
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="px-3 py-1.5 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdited}
                            disabled={editedContent.length > 280 || !editedContent.trim()}
                            className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50"
                          >
                            Save to Drafts
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{v.content}</p>
                      
                      <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onSelect(v)}
                          className="px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          Use This
                        </button>
                        <button
                          onClick={() => { setEditingIndex(i); setEditedContent(v.content); }}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { navigator.clipboard.writeText(v.content); toast.success('Copied!'); }}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p className="text-sm">Click a commit to generate post variations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// GENERATED POSTS TAB
// ==========================================

function GeneratedPostsTab({ posts, onUpdate, toast }) {
  const [filter, setFilter] = useState('all');
  
  const filteredPosts = filter === 'all' 
    ? posts 
    : posts.filter(p => p.status === filter);

  const statusCounts = {
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    posted: posts.filter(p => p.status === 'posted').length,
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Generated Posts</h2>
          <p className="text-gray-500 text-sm mt-1">AI-generated content from your commits</p>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <span className="text-amber-600 font-medium">✏️ {statusCounts.draft}</span>
          <span className="text-indigo-600 font-medium">📅 {statusCounts.scheduled}</span>
          <span className="text-emerald-600 font-medium">✅ {statusCounts.posted}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'draft', 'scheduled', 'posted'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter === f
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1.5 opacity-70">{statusCounts[f]}</span>
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
          <p className="text-gray-500">No posts found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={onUpdate} toast={toast} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onUpdate, toast }) {
  const [isPosting, setIsPosting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const supabase = createClient();

  const handlePostNow = async () => {
    setIsPosting(true);
    try {
      const response = await fetch('/api/posts/x/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.content, postId: post.id }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Posted to X! 🎉');
        onUpdate();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('posts')
      .update({ content: editedContent })
      .eq('id', post.id);
    
    if (!error) {
      toast.success('Post updated!');
      setIsEditing(false);
      onUpdate();
    } else {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id);
    
    if (!error) {
      toast.success('Post deleted');
      onUpdate();
    }
  };

  const statusConfig = {
    draft: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: '✏️ Draft' },
    scheduled: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: '📅 Scheduled' },
    posted: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: '✅ Posted' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: '❌ Failed' },
  };

  const status = statusConfig[post.status] || statusConfig.draft;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center shrink-0">
          <XIcon className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text} border ${status.border}`}>
              {status.label}
            </span>
            {post.source_commit && (
              <span className="text-xs text-gray-400 font-mono">
                from {post.source_commit.slice(0, 7)}
              </span>
            )}
          </div>
          
          {isEditing ? (
            <div>
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                rows={4}
                maxLength={280}
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${editedContent.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
                  {editedContent.length}/280
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100">
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
                    Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
            <span>{post.content.length}/280 chars</span>
            <span>•</span>
            <span>{formatDate(post.created_at)}</span>
          </div>
        </div>

        {!isEditing && (
          <div className="flex sm:flex-col gap-2 shrink-0">
            {post.status === 'draft' && (
              <>
                <button
                  onClick={handlePostNow}
                  disabled={isPosting}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPosting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>🚀 Post</>
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all"
                >
                  Edit
                </button>
              </>
            )}
            
            {post.status === 'posted' && post.external_url && (
              <a
                href={post.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-100 transition-all"
              >
                View <ExternalLinkIcon className="w-3.5 h-3.5" />
              </a>
            )}
            
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// SETTINGS TAB
// ==========================================

function SettingsTab({ settings, onUpdate, toast }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (newSettings) => {
    setLocalSettings(newSettings);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(localSettings);
    setHasChanges(false);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Autopilot Settings</h2>
          <p className="text-gray-500 text-sm mt-1">Configure how posts are generated</p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all text-sm"
          >
            Save Changes
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Auto Generate */}
        <SettingsCard
          title="Auto-generate posts"
          description="Automatically create posts when commits are pushed"
          enabled={localSettings.autoGenerate}
          onChange={() => handleChange({ ...localSettings, autoGenerate: !localSettings.autoGenerate })}
        />

        {/* Auto Post */}
        <SettingsCard
          title="Auto-post (hands-free mode)"
          description="Automatically publish posts without review"
          warning="⚠️ Posts will go live immediately. Use with caution."
          enabled={localSettings.autoPost}
          onChange={() => handleChange({ ...localSettings, autoPost: !localSettings.autoPost })}
        />

        {/* Target Platforms */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Target platforms</h3>
          <p className="text-sm text-gray-500 mb-4">Which platforms should posts be generated for?</p>
          
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'x', label: 'X / Twitter', icon: <XIcon className="w-4 h-4" /> },
              { id: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon className="w-4 h-4" /> },
            ].map((platform) => (
              <button
                key={platform.id}
                onClick={() => {
                  const platforms = localSettings.platforms.includes(platform.id)
                    ? localSettings.platforms.filter(p => p !== platform.id)
                    : [...localSettings.platforms, platform.id];
                  handleChange({ ...localSettings, platforms });
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                  localSettings.platforms.includes(platform.id)
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {platform.icon}
                {platform.label}
                {localSettings.platforms.includes(platform.id) && <CheckIcon className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Commit Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Commit filters</h3>
          <p className="text-sm text-gray-500 mb-4">Which types of commits should generate posts?</p>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'feat', label: 'Features', desc: 'feat: commits' },
              { id: 'fix', label: 'Bug Fixes', desc: 'fix: commits' },
              { id: 'launch', label: 'Launches', desc: 'ship/launch/release' },
              { id: 'docs', label: 'Documentation', desc: 'docs: commits' },
              { id: 'refactor', label: 'Refactors', desc: 'refactor: commits' },
              { id: 'all', label: 'All Commits', desc: 'Every commit' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => {
                  const filters = localSettings.commitFilters.includes(filter.id)
                    ? localSettings.commitFilters.filter(f => f !== filter.id)
                    : [...localSettings.commitFilters, filter.id];
                  handleChange({ ...localSettings, commitFilters: filters });
                }}
                className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                  localSettings.commitFilters.includes(filter.id)
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-sm">{filter.label}</p>
                <p className={`text-xs mt-0.5 ${localSettings.commitFilters.includes(filter.id) ? 'text-gray-300' : 'text-gray-500'}`}>
                  {filter.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Tone */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">Tone</h3>
          <p className="text-sm text-gray-500 mb-4">How should your posts sound?</p>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'casual', label: '😊 Casual', desc: 'Friendly, conversational' },
              { id: 'professional', label: '💼 Professional', desc: 'Business-appropriate' },
              { id: 'hype', label: '🔥 Hype', desc: 'Energetic, excited' },
              { id: 'funny', label: '😄 Funny', desc: 'Witty, self-deprecating' },
            ].map((tone) => (
              <button
                key={tone.id}
                onClick={() => handleChange({ ...localSettings, tone: tone.id })}
                className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                  localSettings.tone === tone.id
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="font-medium text-sm">{tone.label}</p>
                <p className={`text-xs mt-0.5 ${localSettings.tone === tone.id ? 'text-gray-300' : 'text-gray-500'}`}>
                  {tone.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Save Button (Mobile) */}
        {hasChanges && (
          <button
            onClick={handleSave}
            className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all sm:hidden"
          >
            Save Settings
          </button>
        )}
      </div>
    </div>
  );
}

function SettingsCard({ title, description, warning, enabled, onChange }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
          {warning && <p className="text-xs text-amber-600 mt-2">{warning}</p>}
        </div>
        <button
          onClick={onChange}
          className={`w-12 h-7 rounded-full transition-all shrink-0 ${enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
        >
          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  );
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getCommitType(message) {
  const lower = (message || '').toLowerCase();
  if (/^feat/i.test(lower)) return { type: 'feature', emoji: '✨' };
  if (/^fix/i.test(lower)) return { type: 'fix', emoji: '🐛' };
  if (/^docs/i.test(lower)) return { type: 'docs', emoji: '📚' };
  if (/^refactor/i.test(lower)) return { type: 'refactor', emoji: '🔧' };
  if (/\b(launch|ship|release|deploy)\b/i.test(lower)) return { type: 'launch', emoji: '🚀' };
  return { type: 'other', emoji: '📝' };
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}