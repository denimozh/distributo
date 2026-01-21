'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

// ==========================================
// ICONS
// ==========================================

const GitHubIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const FireIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
  </svg>
);

const SparklesIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

const CheckCircleIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const FolderIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const CogIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const RefreshIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const PlusIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const XMarkIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronRightIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const ExternalLinkIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const BoltIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
);

const PaperAirplaneIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const DocumentIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const TrashIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const EyeIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PencilIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

// ==========================================
// TOAST SYSTEM
// ==========================================

const ToastContext = createContext(null);

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-in-right ${
            toast.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' :
            toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
            toast.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
            'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  
  const addToast = ({ type, message, duration = 4000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), duration);
    return id;
  };
  
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const toast = (message, options = {}) => addToast({ type: 'info', message, ...options });
  toast.success = (message, options = {}) => addToast({ type: 'success', message, ...options });
  toast.error = (message, options = {}) => addToast({ type: 'error', message, ...options });
  toast.warning = (message, options = {}) => addToast({ type: 'warning', message, ...options });
  toast.info = (message, options = {}) => addToast({ type: 'info', message, ...options });
  toast.dismiss = removeToast;
  
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function GitHubAutopilotPage() {
  return (
    <ToastProvider>
      <GitHubAutopilotContent />
      <style jsx global>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s ease-in-out infinite;
        }
      `}</style>
    </ToastProvider>
  );
}

function GitHubAutopilotContent() {
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [repos, setRepos] = useState([]);
  const [commits, setCommits] = useState([]);
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [settings, setSettings] = useState({
    autoGenerate: true,
    autoPost: false,
    platforms: ['x'],
    commitFilters: ['feat', 'fix', 'launch', 'ship', 'release'],
    tone: 'casual',
  });
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription for new commits
    const channel = supabase
      .channel('github-commits')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'github_commits',
      }, (payload) => {
        setCommits((prev) => [payload.new, ...prev]);
        toast.success('New commit detected!');
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch GitHub connected account
      const { data: account } = await supabase
        .from('connected_accounts')
        .select('*')
        .eq('platform', 'github')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      
      setConnectedAccount(account || null);

      if (account) {
        // Fetch repos
        const { data: reposData } = await supabase
          .from('github_repos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        setRepos(reposData || []);

        // Fetch commits
        const { data: commitsData } = await supabase
          .from('github_commits')
          .select('*, github_repos(repo_name, repo_full_name)')
          .eq('user_id', user.id)
          .order('committed_at', { ascending: false })
          .limit(50);
        setCommits(commitsData || []);

        // Fetch generated posts
        const { data: postsData } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user.id)
          .eq('source', 'github')
          .order('created_at', { ascending: false })
          .limit(50);
        setGeneratedPosts(postsData || []);

        // Fetch settings
        const { data: settingsData } = await supabase
          .from('github_autopilot_settings')
          .select('settings')
          .eq('user_id', user.id)
          .single();
        if (settingsData?.settings) setSettings(settingsData.settings);

        // Calculate streak
        calculateStreak(commitsData || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (commitsData) => {
    if (!commitsData.length) {
      setStreak({ current: 0, longest: 0 });
      return;
    }

    const dates = [...new Set(commitsData.map(c => 
      new Date(c.committed_at).toISOString().split('T')[0]
    ))].sort().reverse();

    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (dates[0] === today || dates[0] === yesterday) {
      currentStreak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const currDate = new Date(dates[i]);
        const diff = (prevDate - currDate) / 86400000;
        if (diff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    setStreak({ current: currentStreak, longest: Math.max(currentStreak, streak.longest) });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center animate-pulse">
            <GitHubIcon className="w-6 h-6 text-white" />
          </div>
          <div className="text-gray-500 text-sm">Loading GitHub Autopilot...</div>
        </div>
      </div>
    );
  }

  if (!connectedAccount) {
    return <ConnectGitHubPrompt />;
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <BoltIcon className="w-4 h-4" /> },
    { id: 'repos', label: 'Repositories', icon: <FolderIcon className="w-4 h-4" />, count: repos.filter(r => r.is_active).length },
    { id: 'commits', label: 'Commits', icon: <DocumentIcon className="w-4 h-4" />, count: commits.length },
    { id: 'posts', label: 'Generated', icon: <SparklesIcon className="w-4 h-4" />, count: generatedPosts.length },
    { id: 'settings', label: 'Settings', icon: <CogIcon className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <GitHubIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 text-sm">GitHub Autopilot</div>
            <div className="text-xs text-gray-500">Push code → Ship content</div>
          </div>
        </div>

        {/* Status Card */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Status</span>
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
              settings.autoPost 
                ? 'bg-emerald-100 text-emerald-700' 
                : settings.autoGenerate 
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-600'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                settings.autoPost ? 'bg-emerald-500 animate-pulse-soft' : settings.autoGenerate ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
              {settings.autoPost ? 'Auto-posting' : settings.autoGenerate ? 'Generating' : 'Paused'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <img 
              src={connectedAccount.platform_avatar_url || `https://github.com/${connectedAccount.platform_username}.png`}
              alt={connectedAccount.platform_username}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-gray-700 font-medium">@{connectedAccount.platform_username}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setSelectedCommit(null);
                setSelectedPost(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeSection === item.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-md text-xs ${
                  activeSection === item.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Streak Card */}
        <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <FireIcon className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-amber-800">Shipping Streak</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-amber-600">{streak.current}</span>
            <span className="text-sm text-amber-600">days</span>
          </div>
          <div className="text-xs text-amber-600/70 mt-1">Longest: {streak.longest} days</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-gray-900">
            {navItems.find(n => n.id === activeSection)?.label || 'Overview'}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeSection === 'overview' && (
            <OverviewSection 
              repos={repos}
              commits={commits}
              posts={generatedPosts}
              streak={streak}
              settings={settings}
              onNavigate={setActiveSection}
            />
          )}
          {activeSection === 'repos' && (
            <ReposSection 
              repos={repos}
              connectedAccount={connectedAccount}
              onUpdate={fetchData}
              toast={toast}
            />
          )}
          {activeSection === 'commits' && (
            <CommitsSection 
              commits={commits}
              selectedCommit={selectedCommit}
              onSelectCommit={setSelectedCommit}
              onUpdate={fetchData}
              toast={toast}
            />
          )}
          {activeSection === 'posts' && (
            <PostsSection 
              posts={generatedPosts}
              selectedPost={selectedPost}
              onSelectPost={setSelectedPost}
              onUpdate={fetchData}
              toast={toast}
            />
          )}
          {activeSection === 'settings' && (
            <SettingsSection 
              settings={settings}
              onUpdate={async (newSettings) => {
                setSettings(newSettings);
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase
                    .from('github_autopilot_settings')
                    .upsert({
                      user_id: user.id,
                      settings: newSettings,
                      updated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id' });
                  toast.success('Settings saved!');
                }
              }}
            />
          )}
        </div>
      </main>
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
    window.location.href = '/api/auth/github';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <GitHubIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Ship Code → Ship Content</h2>
            <p className="text-gray-500">Connect GitHub to turn your commits into engaging social posts automatically.</p>
          </div>

          {/* Features */}
          <div className="px-8 pb-6 space-y-3">
            {[
              { icon: '⚡', text: 'Auto-generate posts from commits' },
              { icon: '🎯', text: 'Smart commit filtering' },
              { icon: '🔥', text: 'Track your shipping streak' },
              { icon: '✨', text: 'AI-powered content generation' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-lg">{feature.icon}</span>
                <span className="text-sm text-gray-700">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Connect Button */}
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full py-3.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isConnecting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <GitHubIcon className="w-5 h-5" />
                  Connect GitHub Account
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-500 mt-3">
              We only request read access to your repositories
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// OVERVIEW SECTION
// ==========================================

function OverviewSection({ repos, commits, posts, streak, settings, onNavigate }) {
  const activeRepos = repos.filter(r => r.is_active);
  const todayCommits = commits.filter(c => {
    const commitDate = new Date(c.committed_at).toDateString();
    return commitDate === new Date().toDateString();
  });
  const pendingPosts = posts.filter(p => p.status === 'draft');
  const publishedPosts = posts.filter(p => p.status === 'published');

  const stats = [
    { label: 'Active Repos', value: activeRepos.length, icon: <FolderIcon className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
    { label: 'Today\'s Commits', value: todayCommits.length, icon: <BoltIcon className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50' },
    { label: 'Pending Posts', value: pendingPosts.length, icon: <ClockIcon className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50' },
    { label: 'Published', value: publishedPosts.length, icon: <CheckCircleIcon className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Activity</h3>
            <button 
              onClick={() => onNavigate('commits')}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              View all <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {commits.slice(0, 5).map((commit) => (
              <div key={commit.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    commit.post_generated ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {commit.post_generated ? <CheckCircleIcon className="w-4 h-4" /> : <DocumentIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{commit.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{commit.github_repos?.repo_name}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">{formatTimeAgo(commit.committed_at)}</span>
                      {commit.post_generated && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-emerald-600 font-medium">Post generated</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {commits.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <DocumentIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No commits yet. Push some code!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          {/* Autopilot Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Autopilot Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-generate</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  settings.autoGenerate ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {settings.autoGenerate ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto-post</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  settings.autoPost ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {settings.autoPost ? 'On' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tone</span>
                <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600 capitalize">
                  {settings.tone}
                </span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate('settings')}
              className="w-full mt-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Configure Settings
            </button>
          </div>

          {/* Pending Posts */}
          {pendingPosts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Ready to Post</h3>
              <div className="space-y-2">
                {pendingPosts.slice(0, 3).map((post) => (
                  <div key={post.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">{post.platform}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => onNavigate('posts')}
                className="w-full mt-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Review Posts
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// REPOS SECTION
// ==========================================

function ReposSection({ repos, connectedAccount, onUpdate, toast }) {
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [availableRepos, setAvailableRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  const fetchAvailableRepos = async () => {
    setLoadingRepos(true);
    try {
      const response = await fetch('/api/github/repos');
      const data = await response.json();
      if (data.repos) {
        // Filter out already added repos
        const addedIds = repos.map(r => r.repo_id);
        setAvailableRepos(data.repos.filter(r => !addedIds.includes(r.id)));
      }
    } catch (err) {
      toast.error('Failed to fetch repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleAddRepo = async (repo) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      await supabase.from('github_repos').insert({
        user_id: user.id,
        repo_id: repo.id,
        repo_name: repo.name,
        repo_full_name: repo.full_name,
        repo_url: repo.html_url,
        is_active: true,
      });

      // Setup webhook
      const webhookResponse = await fetch('/api/github/webhook/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoFullName: repo.full_name }),
      });

      if (!webhookResponse.ok) {
        toast.warning(`Added ${repo.name} but webhook setup failed`);
      } else {
        toast.success(`Added ${repo.name} with auto-sync!`);
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
        body: JSON.stringify({ repoId: repo.id, repoFullName: repo.repo_full_name }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      toast.success(`Synced ${data.fetched} commits!`);
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredRepos = repos.filter(r =>
    r.repo_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.repo_full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">Manage which repositories to monitor for commits</p>
        </div>
        <button
          onClick={() => { setShowAddRepo(true); fetchAvailableRepos(); }}
          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 flex items-center gap-2 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Repository
        </button>
      </div>

      {/* Search */}
      {repos.length > 0 && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-xs px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
      )}

      {/* Repos Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredRepos.map((repo) => (
          <div 
            key={repo.id} 
            className={`bg-white rounded-xl border p-5 transition-all ${
              repo.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  repo.is_active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <FolderIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{repo.repo_name}</h3>
                  <p className="text-xs text-gray-500">{repo.repo_full_name}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                repo.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {repo.is_active ? 'Active' : 'Paused'}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              <span>{repo.commits_count || 0} commits</span>
              <span>{repo.posts_generated || 0} posts</span>
              {repo.webhook_id && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Webhook active
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => handleSyncCommits(repo)}
                className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshIcon className="w-4 h-4" />
                Sync
              </button>
              <button
                onClick={() => handleToggleRepo(repo)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  repo.is_active 
                    ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' 
                    : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                {repo.is_active ? 'Pause' : 'Activate'}
              </button>
              <button
                onClick={() => handleRemoveRepo(repo)}
                className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {repos.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No repositories connected</h3>
          <p className="text-gray-500 mb-4">Add your first repository to start generating posts from commits.</p>
          <button
            onClick={() => { setShowAddRepo(true); fetchAvailableRepos(); }}
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Add Repository
          </button>
        </div>
      )}

      {/* Add Repo Modal */}
      {showAddRepo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Add Repository</h3>
              <button onClick={() => setShowAddRepo(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              {loadingRepos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                </div>
              ) : availableRepos.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <FolderIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p>No more repositories to add</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableRepos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => handleAddRepo(repo)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <FolderIcon className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900">{repo.name}</div>
                        <div className="text-sm text-gray-500 truncate">{repo.full_name}</div>
                      </div>
                      <PlusIcon className="w-5 h-5 text-gray-400" />
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

// ==========================================
// COMMITS SECTION
// ==========================================

function CommitsSection({ commits, selectedCommit, onSelectCommit, onUpdate, toast }) {
  const [generating, setGenerating] = useState(null);
  const [generatedContent, setGeneratedContent] = useState(null);

  const handleGeneratePost = async (commit) => {
    setGenerating(commit.id);
    try {
      const response = await fetch('/api/github/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitId: commit.id,
          commitMessage: commit.message,
          commitSha: commit.sha,
          repoFullName: commit.github_repos?.repo_full_name,
          platform: 'x',
          saveToDb: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setGeneratedContent(data.content);
      onSelectCommit(commit);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(null);
    }
  };

  const handleSavePost = async () => {
    if (!selectedCommit || !generatedContent) return;
    
    try {
      const response = await fetch('/api/github/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commitId: selectedCommit.id,
          commitMessage: selectedCommit.message,
          commitSha: selectedCommit.sha,
          repoFullName: selectedCommit.github_repos?.repo_full_name,
          platform: 'x',
          saveToDb: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Post saved as draft!');
      setGeneratedContent(null);
      onSelectCommit(null);
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex h-full">
      {/* Commits List */}
      <div className={`${selectedCommit ? 'w-1/2 border-r border-gray-200' : 'w-full'} overflow-auto`}>
        <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <p className="text-sm text-gray-500">{commits.length} commits from your repositories</p>
        </div>
        <div className="divide-y divide-gray-50">
          {commits.map((commit) => (
            <div 
              key={commit.id}
              onClick={() => onSelectCommit(commit)}
              className={`p-4 cursor-pointer transition-colors ${
                selectedCommit?.id === commit.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  commit.post_generated ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {commit.post_generated ? <CheckCircleIcon className="w-4 h-4" /> : <DocumentIcon className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{commit.message}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{commit.github_repos?.repo_name}</span>
                    <span className="text-xs text-gray-400">{formatTimeAgo(commit.committed_at)}</span>
                  </div>
                </div>
                {!commit.post_generated && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleGeneratePost(commit); }}
                    disabled={generating === commit.id}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {generating === commit.id ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <SparklesIcon className="w-3.5 h-3.5" />
                    )}
                    Generate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Panel */}
      {selectedCommit && (
        <div className="w-1/2 bg-gray-50 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Commit → Post Preview</h3>
              <button onClick={() => { onSelectCommit(null); setGeneratedContent(null); }} className="p-1 text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Commit */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <GitHubIcon className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-medium text-gray-500">COMMIT</span>
              </div>
              <p className="text-sm text-gray-900">{selectedCommit.message}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <span>{selectedCommit.github_repos?.repo_name}</span>
                <span>•</span>
                <span>{selectedCommit.sha?.slice(0, 7)}</span>
              </div>
            </div>

            <div className="flex justify-center my-4">
              <div className="w-0.5 h-8 bg-gray-300" />
            </div>

            {/* Generated Post */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-gray-500">GENERATED POST</span>
              </div>
              {generatedContent ? (
                <>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{generatedContent}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={handleSavePost}
                      className="flex-1 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Save as Draft
                    </button>
                    <button
                      onClick={() => handleGeneratePost(selectedCommit)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Regenerate
                    </button>
                  </div>
                </>
              ) : selectedCommit.post_generated ? (
                <p className="text-sm text-gray-500 italic">Post already generated for this commit.</p>
              ) : (
                <div className="py-8 text-center">
                  <SparklesIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click "Generate" to create a post</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// POSTS SECTION
// ==========================================

function PostsSection({ posts, selectedPost, onSelectPost, onUpdate, toast }) {
  const [posting, setPosting] = useState(null);
  const supabase = createClient();

  const handlePublish = async (post) => {
    setPosting(post.id);
    try {
      const response = await fetch('/api/x/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.content, postId: post.id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Posted to X!');
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPosting(null);
    }
  };

  const handleDelete = async (post) => {
    try {
      await supabase.from('posts').delete().eq('id', post.id);
      toast.success('Post deleted');
      onSelectPost(null);
      onUpdate();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const statusColors = {
    draft: 'bg-amber-100 text-amber-700',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex h-full">
      {/* Posts List */}
      <div className={`${selectedPost ? 'w-1/2 border-r border-gray-200' : 'w-full'} overflow-auto`}>
        <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{posts.filter(p => p.status === 'draft').length} drafts</span>
            <span className="text-sm text-gray-500">{posts.filter(p => p.status === 'published').length} published</span>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {posts.map((post) => (
            <div 
              key={post.id}
              onClick={() => onSelectPost(post)}
              className={`p-4 cursor-pointer transition-colors ${
                selectedPost?.id === post.id ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[post.status] || statusColors.draft}`}>
                      {post.status}
                    </span>
                    <span className="text-xs text-gray-400">{formatTimeAgo(post.created_at)}</span>
                  </div>
                </div>
                {post.status === 'draft' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePublish(post); }}
                    disabled={posting === post.id}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {posting === post.id ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="w-3.5 h-3.5" />
                    )}
                    Post
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Detail Panel */}
      {selectedPost && (
        <div className="w-1/2 bg-gray-50 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900">Post Details</h3>
              <button onClick={() => onSelectPost(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedPost.status]}`}>
                  {selectedPost.status}
                </span>
                <span className="text-xs text-gray-500">{selectedPost.platform}</span>
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedPost.content}</p>
              <div className="text-xs text-gray-500 mt-3">
                Created {new Date(selectedPost.created_at).toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedPost.status === 'draft' && (
                <button
                  onClick={() => handlePublish(selectedPost)}
                  disabled={posting === selectedPost.id}
                  className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {posting === selectedPost.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4" />
                  )}
                  Publish Now
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedPost)}
                className="px-4 py-2.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// SETTINGS SECTION
// ==========================================

function SettingsSection({ settings, onUpdate }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(localSettings);
    setIsSaving(false);
  };

  const toneOptions = [
    { id: 'casual', label: 'Casual', desc: 'Friendly and conversational' },
    { id: 'professional', label: 'Professional', desc: 'Business-appropriate' },
    { id: 'funny', label: 'Funny', desc: 'Witty, self-deprecating' },
    { id: 'hype', label: 'Hype', desc: 'Energetic, excited' },
  ];

  const filterOptions = [
    { id: 'feat', label: 'Features', desc: 'feat: commits' },
    { id: 'fix', label: 'Bug Fixes', desc: 'fix: commits' },
    { id: 'launch', label: 'Launches', desc: 'launch/ship/release' },
    { id: 'docs', label: 'Documentation', desc: 'docs: commits' },
    { id: 'refactor', label: 'Refactors', desc: 'refactor: commits' },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <div className="space-y-6">
        {/* Auto Generate */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Auto-generate posts</h3>
              <p className="text-sm text-gray-500 mt-1">Automatically create posts when commits are pushed</p>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, autoGenerate: !localSettings.autoGenerate })}
              className={`w-12 h-7 rounded-full transition-colors ${localSettings.autoGenerate ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${localSettings.autoGenerate ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Auto Post */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Auto-post (hands-free mode)</h3>
              <p className="text-sm text-gray-500 mt-1">Automatically publish posts without review</p>
              {localSettings.autoPost && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                  <span>⚠️</span> Posts will go live immediately
                </p>
              )}
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, autoPost: !localSettings.autoPost })}
              className={`w-12 h-7 rounded-full transition-colors ${localSettings.autoPost ? 'bg-amber-500' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${localSettings.autoPost ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Tone Selection */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Content Tone</h3>
          <div className="grid grid-cols-2 gap-3">
            {toneOptions.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setLocalSettings({ ...localSettings, tone: tone.id })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  localSettings.tone === tone.id
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm text-gray-900">{tone.label}</div>
                <div className="text-xs text-gray-500">{tone.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Commit Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Commit Filters</h3>
          <p className="text-sm text-gray-500 mb-4">Only generate posts for these commit types</p>
          <div className="space-y-2">
            {filterOptions.map((filter) => (
              <label
                key={filter.id}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div>
                  <div className="font-medium text-sm text-gray-900">{filter.label}</div>
                  <div className="text-xs text-gray-500">{filter.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.commitFilters?.includes(filter.id)}
                  onChange={(e) => {
                    const filters = localSettings.commitFilters || [];
                    if (e.target.checked) {
                      setLocalSettings({ ...localSettings, commitFilters: [...filters, filter.id] });
                    } else {
                      setLocalSettings({ ...localSettings, commitFilters: filters.filter(f => f !== filter.id) });
                    }
                  }}
                  className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function formatTimeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return new Date(date).toLocaleDateString();
}
