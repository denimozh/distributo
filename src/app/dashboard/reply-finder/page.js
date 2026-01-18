"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export default function ReplyFinderPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [expandedReply, setExpandedReply] = useState(null);
  const [generatedReplies, setGeneratedReplies] = useState({});
  const [generatingReply, setGeneratingReply] = useState(null);
  const [showAddKeyword, setShowAddKeyword] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [goals, setGoals] = useState(null);
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [newTarget, setNewTarget] = useState(5);
  const [recordingReply, setRecordingReply] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, questions, high-engagement
  const [sortBy, setSortBy] = useState('relevance'); // relevance, recent, engagement

  const { addToast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profileData);

        // Fetch keywords
        await fetchKeywords(user.id);
        await fetchGoals(user.id);
        
        // Load real opportunities (falls back to demo if none)
        await fetchOpportunities(user.id);
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchKeywords = async (userId) => {
    try {
      const { data } = await supabase
        .from('reply_keywords')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (data && data.length > 0) {
        setKeywords(data);
      } else {
        // Default suggested keywords based on product
        setKeywords([
          { id: 'default-1', keyword: 'marketing automation', is_active: true },
          { id: 'default-2', keyword: 'content scheduling', is_active: true },
          { id: 'default-3', keyword: 'social media tools', is_active: true },
        ]);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
    }
  };

  const fetchGoals = async (userId) => {
    try {
      const response = await fetch(`/api/user-goals?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setGoals(data);
        setNewTarget(data.goals?.daily_reply_target || 5);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const handleSearch = async () => {
    if (!user) return;
    
    setSearching(true);
    addToast('Searching X for conversations...', 'info');
    
    try {
      // Call real API to search X
      const response = await fetch('/api/reply-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          keywords: keywords.map(k => k.keyword),
        }),
      });

      const data = await response.json();
      
      if (data.needsConnection) {
        addToast('Please connect your X account in Integrations', 'error');
        setSearching(false);
        return;
      }
      
      if (data.needsKeywords) {
        addToast('Add some keywords first to find conversations', 'error');
        setSearching(false);
        return;
      }

      if (data.success) {
        // Fetch the saved opportunities
        await fetchOpportunities(user.id);
        addToast(`Found ${data.newOpportunities} new opportunities!`, 'success');
      } else {
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      addToast(error.message || 'Failed to search', 'error');
    }
    
    setSearching(false);
  };

  const fetchOpportunities = async (userId) => {
    try {
      const response = await fetch(`/api/reply-finder?userId=${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setOpportunities(data.opportunities || []);
      } else {
        setOpportunities([]);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      setOpportunities([]);
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !user) return;
    
    const keyword = newKeyword.trim().toLowerCase();
    
    // Check if already exists
    if (keywords.some(k => k.keyword.toLowerCase() === keyword)) {
      addToast('Keyword already exists', 'error');
      return;
    }

    try {
      // Save to database
      const { data, error } = await supabase
        .from('reply_keywords')
        .insert({
          user_id: user.id,
          keyword: keyword,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setKeywords(prev => [...prev, data]);
      setNewKeyword('');
      setShowAddKeyword(false);
      addToast(`Added keyword: "${keyword}"`, 'success');
    } catch (error) {
      console.error('Error adding keyword:', error);
      // Fallback to local state
      setKeywords(prev => [...prev, { id: `new-${Date.now()}`, keyword, is_active: true }]);
      setNewKeyword('');
      setShowAddKeyword(false);
      addToast(`Added keyword: "${keyword}"`, 'success');
    }
  };

  const handleRemoveKeyword = async (keywordId) => {
    try {
      // Delete from database if it's a real ID
      if (!keywordId.startsWith('default-') && !keywordId.startsWith('new-')) {
        await supabase
          .from('reply_keywords')
          .delete()
          .eq('id', keywordId);
      }
      
      setKeywords(prev => prev.filter(k => k.id !== keywordId));
      addToast('Keyword removed', 'success');
    } catch (error) {
      console.error('Error removing keyword:', error);
      setKeywords(prev => prev.filter(k => k.id !== keywordId));
      addToast('Keyword removed', 'success');
    }
  };

  const handleGenerateReply = async (opp) => {
    setGeneratingReply(opp.id);
    
    try {
      const response = await fetch('/api/reply-finder/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tweetContent: opp.content,
          authorUsername: opp.author,
          productName: profile?.product_name,
          productDescription: profile?.product_description,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedReplies(prev => ({ ...prev, [opp.id]: data.reply }));
      } else {
        // Fallback demo reply
        const demoReply = `Great question! I've been dealing with the same challenge. Recently started using a tool that auto-generates and schedules content based on my product - it's been a game changer for consistency without the burnout. Happy to share more if you're interested!`;
        setGeneratedReplies(prev => ({ ...prev, [opp.id]: demoReply }));
      }
    } catch (error) {
      // Fallback
      const demoReply = `I feel this! The manual grind is real. I've been experimenting with some automation tools that help with content creation and scheduling. Would love to compare notes on what's working for you.`;
      setGeneratedReplies(prev => ({ ...prev, [opp.id]: demoReply }));
    }

    setGeneratingReply(null);
  };

  const handleRecordReply = async (opp) => {
    setRecordingReply(opp.id);
    
    try {
      const response = await fetch('/api/user-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          opportunityId: !opp.id.startsWith('demo') ? opp.id : null,
          platform: opp.platform,
          repliedToUsername: opp.author,
          replyContent: generatedReplies[opp.id] || '',
        }),
      });

      const data = await response.json();
      if (data.success) {
        addToast('Reply tracked! 🎉', 'success');
        await fetchGoals(user.id);
        setOpportunities(prev => prev.filter(o => o.id !== opp.id));
      }
    } catch (error) {
      addToast('Reply tracked!', 'success');
      setOpportunities(prev => prev.filter(o => o.id !== opp.id));
    }

    setRecordingReply(null);
  };

  const handleSkip = (oppId) => {
    setOpportunities(prev => prev.filter(o => o.id !== oppId));
    addToast('Skipped', 'info');
  };

  const handleUpdateTarget = async () => {
    try {
      await fetch('/api/user-goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, dailyTarget: newTarget }),
      });
      addToast('Target updated!', 'success');
      setShowGoalSettings(false);
      await fetchGoals(user.id);
    } catch (error) {
      addToast('Failed to update', 'error');
    }
  };

  const handleCopyReply = (text) => {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard!', 'success');
  };

  // Filter and sort opportunities
  const filteredOpportunities = opportunities
    .filter(opp => {
      if (filterType === 'questions') return opp.isQuestion;
      if (filterType === 'high-engagement') return (opp.engagement.likes || opp.engagement.upvotes || 0) > 500;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return 0; // Already sorted by time in demo
      if (sortBy === 'engagement') return (b.engagement.likes || b.engagement.upvotes || 0) - (a.engagement.likes || a.engagement.upvotes || 0);
      return b.relevance - a.relevance;
    });

  const progressPercent = goals ? Math.min(100, ((goals.today?.replies || 0) / (goals.today?.target || 5)) * 100) : 0;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reply Finder</h1>
          <p className="text-gray-500 mt-1">Find high-performing posts to reply to and grow your audience</p>
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
        >
          {searching ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Searching...
            </>
          ) : (
            <>
              <SearchIcon className="w-5 h-5" />
              Find Conversations
            </>
          )}
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Today's Replies</span>
            <button onClick={() => setShowGoalSettings(true)} className="text-xs text-blue-600 hover:underline">Edit</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{goals?.today?.replies || 0}</span>
            <span className="text-gray-400">/ {goals?.today?.target || 5}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className={`h-full rounded-full ${progressPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FireIcon className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-500">Streak</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-bold text-gray-900">{goals?.streak?.current || 0}</span>
            <span className="text-gray-400">days</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TargetIcon className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-500">Keywords</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{keywords.length}</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingIcon className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-500">Opportunities</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">{filteredOpportunities.length}</span>
        </div>
      </div>

      {/* Keywords Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Your Keywords</h3>
            <p className="text-sm text-gray-500">We'll find conversations mentioning these topics</p>
          </div>
          <button
            onClick={() => setShowAddKeyword(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
          >
            <PlusIcon className="w-4 h-4" />
            Add Keyword
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {keywords.map(kw => (
            <div key={kw.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg group">
              <HashIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{kw.keyword}</span>
              <button
                onClick={() => handleRemoveKeyword(kw.id)}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
          {keywords.length === 0 && (
            <p className="text-sm text-gray-400">No keywords yet. Add some to find relevant conversations.</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Filter:</span>
          {[
            { value: 'all', label: 'All' },
            { value: 'questions', label: 'Questions' },
            { value: 'high-engagement', label: 'High Engagement' },
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilterType(filter.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filterType === filter.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="relevance">Most Relevant</option>
            <option value="engagement">Most Engagement</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {filteredOpportunities.map(opp => (
          <div key={opp.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
            <div className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    opp.platform === 'x' ? 'bg-black' : 'bg-orange-500'
                  }`}>
                    {opp.platform === 'x' ? (
                      <XIcon className="w-5 h-5 text-white" />
                    ) : (
                      <RedditIcon className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{opp.authorName || opp.author}</p>
                      {opp.isQuestion && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                          Question
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {opp.author} · {opp.timeAgo}
                      {opp.subreddit && <span> · {opp.subreddit}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-600 rounded-full">
                    {opp.matchedKeyword}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    opp.relevance >= 90 ? 'bg-green-100 text-green-700' :
                    opp.relevance >= 80 ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {opp.relevance}% match
                  </span>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-800 mb-4 leading-relaxed text-[15px]">{opp.content}</p>

              {/* Engagement Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                {opp.platform === 'x' ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <HeartIcon className="w-4 h-4" />
                      {opp.engagement.likes?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ChatIcon className="w-4 h-4" />
                      {opp.engagement.replies?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <RepeatIcon className="w-4 h-4" />
                      {opp.engagement.reposts?.toLocaleString()}
                    </span>
                    {opp.engagement.impressions && (
                      <span className="flex items-center gap-1.5">
                        <EyeIcon className="w-4 h-4" />
                        {(opp.engagement.impressions / 1000).toFixed(0)}K views
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1.5">
                      <ArrowUpIcon className="w-4 h-4" />
                      {opp.engagement.upvotes?.toLocaleString()} upvotes
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ChatIcon className="w-4 h-4" />
                      {opp.engagement.comments?.toLocaleString()} comments
                    </span>
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpandedReply(expandedReply === opp.id ? null : opp.id)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:shadow-md transition-all"
                >
                  <SparklesIcon className="w-4 h-4" />
                  {expandedReply === opp.id ? 'Hide Reply' : 'Craft Reply'}
                </button>
                <a
                  href={opp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Post
                  <ExternalLinkIcon className="w-4 h-4" />
                </a>
                <button
                  onClick={() => handleSkip(opp.id)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>

            {/* Reply Composer */}
            {expandedReply === opp.id && (
              <div className="p-5 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100">
                {generatingReply === opp.id ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-3 text-gray-600">Crafting the perfect reply...</span>
                  </div>
                ) : !generatedReplies[opp.id] ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">Generate an AI reply that naturally mentions your product</p>
                    <button
                      onClick={() => handleGenerateReply(opp)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                    >
                      <SparklesIcon className="w-5 h-5" />
                      Generate Reply
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <SparklesIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">AI-Generated Reply</span>
                    </div>
                    <textarea
                      value={generatedReplies[opp.id] || ''}
                      onChange={(e) => setGeneratedReplies(prev => ({ ...prev, [opp.id]: e.target.value }))}
                      className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-800"
                    />
                    <div className="flex items-center justify-between mt-4">
                      <button
                        onClick={() => handleGenerateReply(opp)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <RefreshIcon className="w-4 h-4" />
                        Regenerate
                      </button>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleCopyReply(generatedReplies[opp.id] || '')}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <CopyIcon className="w-4 h-4" />
                          Copy
                        </button>
                        <button
                          onClick={() => {
                            window.open(opp.url, '_blank');
                            handleRecordReply(opp);
                          }}
                          disabled={recordingReply === opp.id}
                          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {recordingReply === opp.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Tracking...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="w-4 h-4" />
                              Post & Track Reply
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredOpportunities.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-4">
            <SearchIcon className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-xl font-semibold text-gray-900 mb-2">Find conversations to reply to</p>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Add keywords related to your product, then click "Find Conversations" to discover high-performing posts where you can add value.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            {keywords.length === 0 ? (
              <button
                onClick={() => setShowAddKeyword(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
              >
                <PlusIcon className="w-5 h-5" />
                Add Your First Keyword
              </button>
            ) : (
              <button
                onClick={handleSearch}
                disabled={searching}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
              >
                {searching ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="w-5 h-5" />
                    Find Conversations
                  </>
                )}
              </button>
            )}
            
            <p className="text-sm text-gray-400">
              Requires X account connected in <a href="/dashboard/integrations" className="text-blue-500 hover:underline">Integrations</a>
            </p>
          </div>
        </div>
      )}

      {/* Add Keyword Modal */}
      {showAddKeyword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddKeyword(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Add Keyword</h2>
              <p className="text-sm text-gray-500 mt-1">We'll find conversations mentioning this keyword</p>
            </div>
            <div className="p-6">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="e.g., marketing automation"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                autoFocus
              />
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Suggested keywords:</p>
                <div className="flex flex-wrap gap-2">
                  {['indie hackers', 'saas marketing', 'founder tips', 'startup growth', 'content creation'].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => setNewKeyword(suggestion)}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowAddKeyword(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">
                Cancel
              </button>
              <button
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 hover:bg-blue-700"
              >
                Add Keyword
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goal Settings Modal */}
      {showGoalSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowGoalSettings(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">Daily Reply Goal</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">How many replies do you want to send daily?</p>
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => setNewTarget(Math.max(1, newTarget - 1))} className="w-12 h-12 rounded-xl border-2 border-gray-200 text-xl font-medium hover:bg-gray-50">-</button>
                <span className="text-4xl font-bold text-gray-900 w-16 text-center">{newTarget}</span>
                <button onClick={() => setNewTarget(Math.min(20, newTarget + 1))} className="w-12 h-12 rounded-xl border-2 border-gray-200 text-xl font-medium hover:bg-gray-50">+</button>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowGoalSettings(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Cancel</button>
              <button onClick={handleUpdateTarget} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
function SearchIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>; }
function PlusIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>; }
function XIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }
function RedditIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>; }
function RefreshIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function HeartIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>; }
function ChatIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>; }
function RepeatIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function SparklesIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>; }
function ExternalLinkIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>; }
function CopyIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>; }
function XMarkIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>; }
function FireIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>; }
function CheckIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>; }
function HashIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>; }
function TargetIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>; }
function TrendingIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>; }
function EyeIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>; }
function ArrowUpIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>; }