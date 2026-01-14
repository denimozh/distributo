"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReplyFinderPage() {
  const [user, setUser] = useState(null);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [opportunities, setOpportunities] = useState([]);
  const [trackedAccounts, setTrackedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedReply, setExpandedReply] = useState(null);
  const [generatedReplies, setGeneratedReplies] = useState({});
  const [generatingReply, setGeneratingReply] = useState(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [addingAccount, setAddingAccount] = useState(false);

  // Demo data for when no real data exists
  const demoOpportunities = [
    {
      id: 'demo-1',
      platform: 'x',
      author: '@levelsio',
      authorName: 'Pieter Levels',
      content: 'What tools are you using to automate your marketing? I\'ve been doing everything manually and it\'s killing me.',
      relevance: 94,
      engagement: { likes: 1243, replies: 234, reposts: 89 },
      timeAgo: '2h',
      url: 'https://x.com/levelsio/status/123',
    },
    {
      id: 'demo-2',
      platform: 'reddit',
      author: 'u/startup_founder',
      subreddit: 'r/SaaS',
      content: 'How do you handle content distribution as a solo founder? I can barely find time to code, let alone post on social media consistently.',
      relevance: 91,
      engagement: { upvotes: 234, comments: 67 },
      timeAgo: '4h',
      url: 'https://reddit.com/r/SaaS/comments/123',
    },
    {
      id: 'demo-3',
      platform: 'linkedin',
      author: 'Marc Louvion',
      authorTitle: 'Founder at ShipFast',
      content: 'Founder burnout is real. What systems have helped you stay consistent with marketing while building your product?',
      relevance: 87,
      engagement: { likes: 567, comments: 89 },
      timeAgo: '6h',
      url: 'https://linkedin.com/posts/123',
    },
    {
      id: 'demo-4',
      platform: 'x',
      author: '@tdinh_me',
      authorName: 'Tony Dinh',
      content: 'Building in public is great for accountability but man, coming up with content every day is exhausting. Anyone else feel this?',
      relevance: 85,
      engagement: { likes: 892, replies: 156, reposts: 34 },
      timeAgo: '8h',
      url: 'https://x.com/tdinh_me/status/456',
    },
    {
      id: 'demo-5',
      platform: 'reddit',
      author: 'u/bootstrapped_dev',
      subreddit: 'r/indiehackers',
      content: 'What\'s your marketing stack as a solo founder? Looking to automate as much as possible.',
      relevance: 82,
      engagement: { upvotes: 189, comments: 45 },
      timeAgo: '12h',
      url: 'https://reddit.com/r/indiehackers/comments/456',
    },
  ];

  useEffect(() => {
    const supabase = createClient();
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        await Promise.all([
          fetchOpportunities(user.id),
          fetchTrackedAccounts(user.id),
        ]);
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchOpportunities = async (userId) => {
    try {
      const response = await fetch(`/api/reply-finder?userId=${userId}&platform=${platformFilter}`);
      const data = await response.json();
      
      if (data.success && data.opportunities.length > 0) {
        setOpportunities(data.opportunities);
      } else {
        // Use demo data if no real opportunities
        setOpportunities(demoOpportunities);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      setOpportunities(demoOpportunities);
    }
  };

  const fetchTrackedAccounts = async (userId) => {
    try {
      const response = await fetch(`/api/tracked-accounts?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setTrackedAccounts(data.accounts);
      }
    } catch (error) {
      console.error('Error fetching tracked accounts:', error);
    }
  };

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    
    try {
      // First refresh from X API
      await fetch('/api/reply-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      
      // Then fetch updated opportunities
      await fetchOpportunities(user.id);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    
    setRefreshing(false);
  };

  const handleGenerateReply = async (opp) => {
    if (!user) return;
    
    setGeneratingReply(opp.id);
    setExpandedReply(opp.id);
    
    try {
      const response = await fetch('/api/reply-finder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          opportunityId: opp.id,
          tweetContent: opp.content,
          authorUsername: opp.author?.replace('@', ''),
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setGeneratedReplies(prev => ({
          ...prev,
          [opp.id]: data.reply,
        }));
      }
    } catch (error) {
      console.error('Error generating reply:', error);
    }
    
    setGeneratingReply(null);
  };

  const handleAddAccount = async () => {
    if (!user || !newAccountUsername.trim()) return;
    
    setAddingAccount(true);
    
    try {
      const response = await fetch('/api/tracked-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          username: newAccountUsername,
          platform: 'x',
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTrackedAccounts(user.id);
        setNewAccountUsername('');
        setShowAddAccount(false);
      } else {
        alert(data.error || 'Failed to add account');
      }
    } catch (error) {
      console.error('Error adding account:', error);
    }
    
    setAddingAccount(false);
  };

  const handleRemoveAccount = async (accountId) => {
    if (!user) return;
    
    try {
      await fetch(`/api/tracked-accounts?accountId=${accountId}&userId=${user.id}`, {
        method: 'DELETE',
      });
      await fetchTrackedAccounts(user.id);
    } catch (error) {
      console.error('Error removing account:', error);
    }
  };

  const handleCopyReply = (replyText) => {
    navigator.clipboard.writeText(replyText);
  };

  const filteredOpportunities = opportunities
    .filter(opp => platformFilter === 'all' || opp.platform === platformFilter)
    .sort((a, b) => {
      if (sortBy === 'relevance') return b.relevance - a.relevance;
      if (sortBy === 'engagement') {
        const aEng = a.engagement?.likes || a.engagement?.upvotes || 0;
        const bEng = b.engagement?.likes || b.engagement?.upvotes || 0;
        return bEng - aEng;
      }
      return 0;
    });

  const platformCounts = {
    x: opportunities.filter(o => o.platform === 'x').length,
    linkedin: opportunities.filter(o => o.platform === 'linkedin').length,
    reddit: opportunities.filter(o => o.platform === 'reddit').length,
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reply Finder</h1>
          <p className="text-gray-500 mt-1">Find conversations to join and grow your audience across platforms.</p>
        </div>
        <button
          onClick={() => setShowAddAccount(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Track Account
        </button>
      </div>

      {/* Tracked Accounts Bar */}
      {trackedAccounts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Tracked Accounts</h3>
              <span className="text-sm text-gray-500">({trackedAccounts.length})</span>
            </div>
            <button
              onClick={() => setShowAddAccount(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add More
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {trackedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200"
              >
                {account.avatar_url ? (
                  <img src={account.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                    <XIcon className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">@{account.username}</span>
                <button
                  onClick={() => handleRemoveAccount(account.id)}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">Platform:</span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPlatformFilter('all')} className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${platformFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                All
              </button>
              <button onClick={() => setPlatformFilter('x')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${platformFilter === 'x' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <XIcon className="w-4 h-4" />X
              </button>
              <button onClick={() => setPlatformFilter('linkedin')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${platformFilter === 'linkedin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <LinkedInIcon className="w-4 h-4" />LinkedIn
              </button>
              <button onClick={() => setPlatformFilter('reddit')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all ${platformFilter === 'reddit' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <RedditIcon className="w-4 h-4" />Reddit
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500">Sort by:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 text-sm font-medium rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="relevance">Relevance</option>
                <option value="recent">Recent</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Opportunities</div>
          <div className="text-3xl font-bold text-gray-900">{opportunities.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
            <XIcon className="w-4 h-4" /> X / Twitter
          </div>
          <div className="text-3xl font-bold text-gray-900">{platformCounts.x}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
            <LinkedInIcon className="w-4 h-4" /> LinkedIn
          </div>
          <div className="text-3xl font-bold text-blue-600">{platformCounts.linkedin}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-1">
            <RedditIcon className="w-4 h-4" /> Reddit
          </div>
          <div className="text-3xl font-bold text-orange-500">{platformCounts.reddit}</div>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredOpportunities.map((opp) => (
          <div key={opp.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start gap-5">
                {/* Platform Icon */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  opp.platform === 'x' ? 'bg-gray-900' :
                  opp.platform === 'linkedin' ? 'bg-blue-600' : 'bg-orange-500'
                }`}>
                  {opp.platform === 'x' && <XIcon className="w-7 h-7 text-white" />}
                  {opp.platform === 'linkedin' && <LinkedInIcon className="w-7 h-7 text-white" />}
                  {opp.platform === 'reddit' && <RedditIcon className="w-7 h-7 text-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-900">{opp.author}</span>
                    {opp.authorName && <span className="text-gray-500">{opp.authorName}</span>}
                    {opp.authorTitle && <span className="text-gray-500">{opp.authorTitle}</span>}
                    {opp.subreddit && <span className="text-orange-600 font-medium">{opp.subreddit}</span>}
                    <span className="text-gray-400">{opp.timeAgo}</span>
                  </div>
                  <p className="text-gray-700 text-base leading-relaxed mb-4">{opp.content}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    {opp.engagement?.likes > 0 && (
                      <span className="flex items-center gap-1.5">
                        <HeartIcon className="w-4 h-4 text-gray-400" />
                        {opp.engagement.likes.toLocaleString()}
                      </span>
                    )}
                    {opp.engagement?.upvotes > 0 && (
                      <span className="flex items-center gap-1.5">
                        <ArrowUpIcon className="w-4 h-4 text-gray-400" />
                        {opp.engagement.upvotes.toLocaleString()}
                      </span>
                    )}
                    {opp.engagement?.replies > 0 && (
                      <span className="flex items-center gap-1.5">
                        <ChatIcon className="w-4 h-4 text-gray-400" />
                        {opp.engagement.replies.toLocaleString()}
                      </span>
                    )}
                    {opp.engagement?.comments > 0 && (
                      <span className="flex items-center gap-1.5">
                        <ChatIcon className="w-4 h-4 text-gray-400" />
                        {opp.engagement.comments.toLocaleString()}
                      </span>
                    )}
                    {opp.engagement?.reposts > 0 && (
                      <span className="flex items-center gap-1.5">
                        <RepeatIcon className="w-4 h-4 text-gray-400" />
                        {opp.engagement.reposts.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Relevance & Actions */}
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
                    opp.relevance >= 90 ? 'bg-green-100 text-green-700' :
                    opp.relevance >= 80 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {opp.relevance}% match
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateReply(opp)}
                      disabled={generatingReply === opp.id}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      <SparklesIcon className="w-4 h-4" />
                      {generatingReply === opp.id ? 'Generating...' : expandedReply === opp.id ? 'Hide Reply' : 'Generate Reply'}
                    </button>
                    <a
                      href={opp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      <ExternalLinkIcon className="w-4 h-4" />
                      Open
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Reply Section */}
            {expandedReply === opp.id && (
              <div className="border-t border-gray-100 p-6 bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <SparklesIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-700">AI-Generated Reply</span>
                </div>
                {generatingReply === opp.id ? (
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-500">Generating personalized reply...</span>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={generatedReplies[opp.id] || ''}
                      onChange={(e) => setGeneratedReplies(prev => ({ ...prev, [opp.id]: e.target.value }))}
                      placeholder="Click 'Generate Reply' to create an AI-powered response..."
                      className="w-full h-28 px-4 py-3 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-500 bg-white text-base leading-relaxed"
                    />
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={() => handleGenerateReply(opp)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <RefreshIcon className="w-4 h-4" />
                        Regenerate
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCopyReply(generatedReplies[opp.id] || '')}
                          disabled={!generatedReplies[opp.id]}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          <CopyIcon className="w-4 h-4" />
                          Copy
                        </button>
                        <a
                          href={opp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                        >
                          Reply on {opp.platform === 'x' ? 'X' : opp.platform === 'linkedin' ? 'LinkedIn' : 'Reddit'}
                          <ExternalLinkIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-lg text-gray-500 mb-1">No opportunities found</p>
          <p className="text-sm text-gray-400 mb-6">Track some accounts to find reply opportunities.</p>
          <button
            onClick={() => setShowAddAccount(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Track Your First Account
          </button>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddAccount(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Track Account</h2>
              <button onClick={() => setShowAddAccount(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Enter a X/Twitter username to track. We'll find their recent posts that are relevant to your product.
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <input
                    type="text"
                    value={newAccountUsername}
                    onChange={(e) => setNewAccountUsername(e.target.value.replace('@', ''))}
                    placeholder="username"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 text-base"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAccount()}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Examples: levelsio, tdinh_me, marclouvion
              </p>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAddAccount(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAddAccount}
                disabled={!newAccountUsername.trim() || addingAccount}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              >
                {addingAccount ? 'Adding...' : 'Track Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function PlusIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>; }
function UsersIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>; }
function XIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }
function LinkedInIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>; }
function RedditIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>; }
function RefreshIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function HeartIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>; }
function ArrowUpIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>; }
function ChatIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>; }
function RepeatIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function SparklesIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>; }
function ExternalLinkIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>; }
function CopyIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>; }
function SearchIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>; }
function XMarkIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>; }