"use client";

import { useState, useMemo } from "react";

export default function ContentQueuePage() {
  const [viewMode, setViewMode] = useState('calendar');
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const [posts] = useState([
    { id: 1, platform: 'x', content: 'Just shipped dark mode for the dashboard. Sometimes the small wins feel the biggest...', status: 'pending', scheduledFor: '2026-01-13T09:00:00', source: 'ai' },
    { id: 2, platform: 'linkedin', content: 'Milestone reached: 100 users on our platform. Here\'s what we learned building in public...', status: 'pending', scheduledFor: '2026-01-13T10:30:00', source: 'ai' },
    { id: 3, platform: 'x', content: 'Building in public Day 45: The GitHub autopilot is generating better content than I expected...', status: 'scheduled', scheduledFor: '2026-01-14T14:00:00', source: 'github' },
    { id: 4, platform: 'x', content: 'Quick tip: If you\'re building a SaaS, automate your marketing from day 1. Trust me.', status: 'posted', scheduledFor: '2026-01-12T09:00:00', source: 'ai', engagement: { likes: 24, replies: 5, reposts: 3 } },
    { id: 5, platform: 'linkedin', content: 'The best marketing strategy? Ship fast, learn faster. Here\'s our week 1 learnings...', status: 'posted', scheduledFor: '2026-01-12T14:00:00', source: 'manual', engagement: { likes: 67, comments: 12 } },
    { id: 6, platform: 'x', content: 'Failed to post - API rate limit exceeded', status: 'failed', scheduledFor: '2026-01-12T12:00:00', source: 'ai', error: 'Rate limit exceeded' },
    { id: 7, platform: 'x', content: 'Thread incoming: How I automated my entire marketing workflow in one weekend 🧵', status: 'scheduled', scheduledFor: '2026-01-15T11:00:00', source: 'manual' },
    { id: 8, platform: 'linkedin', content: 'Excited to announce our new GitHub integration. Now your commits automatically become content.', status: 'scheduled', scheduledFor: '2026-01-16T09:00:00', source: 'github' },
  ]);

  const filteredPosts = posts.filter(post => {
    if (statusFilter !== 'all' && post.status !== statusFilter) return false;
    if (platformFilter !== 'all' && post.platform !== platformFilter) return false;
    if (sourceFilter !== 'all' && post.source !== sourceFilter) return false;
    return true;
  });

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentWeekStart]);

  const goToPrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const getPostsForDay = (day) => {
    return filteredPosts.filter(post => {
      const postDate = new Date(post.scheduledFor);
      return postDate.toDateString() === day.toDateString();
    }).sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
  };

  const isToday = (day) => new Date().toDateString() === day.toDateString();

  const getStatusBadge = (status) => {
    const styles = { pending: 'bg-amber-100 text-amber-700', scheduled: 'bg-blue-100 text-blue-700', posted: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700' };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status) => {
    const colors = { pending: 'border-amber-300 bg-amber-50', scheduled: 'border-blue-300 bg-blue-50', posted: 'border-green-300 bg-green-50', failed: 'border-red-300 bg-red-50' };
    return colors[status] || 'border-gray-300 bg-gray-50';
  };

  const getSourceLabel = (source) => ({ ai: 'AI Generated', github: 'GitHub', manual: 'Manual', crosspost: 'Cross-post' }[source] || source);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const formatDayHeader = (date) => date.toLocaleDateString('en-US', { weekday: 'short' });
  const formatDayNumber = (date) => date.getDate();
  const formatMonthYear = (date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Content Queue</h1>
          <p className="text-gray-500 mt-1">Manage all your scheduled and posted content.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)} 
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          <PlusIcon className="w-5 h-5" />
          Manual Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1.5">
              <button 
                onClick={() => setViewMode('list')} 
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <ListIcon className="w-4 h-4" />
                List
              </button>
              <button 
                onClick={() => setViewMode('calendar')} 
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <CalendarIcon className="w-4 h-4" />
                Calendar
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <div className="flex items-center gap-1.5">
                {['all', 'pending', 'scheduled', 'posted', 'failed'].map((status) => (
                  <button 
                    key={status} 
                    onClick={() => setStatusFilter(status)} 
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${statusFilter === status ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Platform Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500">Platform:</span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPlatformFilter('all')} className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${platformFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
                <button onClick={() => setPlatformFilter('x')} className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${platformFilter === 'x' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <XIcon className="w-3.5 h-3.5" />X
                </button>
                <button onClick={() => setPlatformFilter('linkedin')} className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${platformFilter === 'linkedin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <LinkedInIcon className="w-3.5 h-3.5" />LinkedIn
                </button>
                <button onClick={() => setPlatformFilter('reddit')} className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${platformFilter === 'reddit' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  <RedditIcon className="w-3.5 h-3.5" />Reddit
                </button>
              </div>
            </div>

            {/* Source Filter */}
            <select 
              value={sourceFilter} 
              onChange={(e) => setSourceFilter(e.target.value)} 
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Sources</option>
              <option value="ai">AI Generated</option>
              <option value="github">GitHub</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-500 mb-1">Pending</div>
          <div className="text-3xl font-bold text-amber-600">{posts.filter(p => p.status === 'pending').length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-500 mb-1">Scheduled</div>
          <div className="text-3xl font-bold text-blue-600">{posts.filter(p => p.status === 'scheduled').length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-500 mb-1">Posted</div>
          <div className="text-3xl font-bold text-green-600">{posts.filter(p => p.status === 'posted').length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-500 mb-1">Failed</div>
          <div className="text-3xl font-bold text-red-600">{posts.filter(p => p.status === 'failed').length}</div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <h2 className="text-xl font-semibold text-gray-900">{formatMonthYear(currentWeekStart)}</h2>
              <div className="flex items-center gap-1">
                <button onClick={goToPrevWeek} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                  <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <button onClick={goToToday} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                  Today
                </button>
                <button onClick={goToNextWeek} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors">
                  <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400"></span><span className="text-gray-600">Pending</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-400"></span><span className="text-gray-600">Scheduled</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-400"></span><span className="text-gray-600">Posted</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400"></span><span className="text-gray-600">Failed</span></div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 divide-x divide-gray-100">
            {/* Day Headers */}
            {weekDays.map((day, idx) => (
              <div key={idx} className={`px-4 py-4 text-center border-b border-gray-100 ${isToday(day) ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{formatDayHeader(day)}</div>
                <div className={`text-xl font-semibold ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                  {isToday(day) ? (
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white">
                      {formatDayNumber(day)}
                    </span>
                  ) : formatDayNumber(day)}
                </div>
              </div>
            ))}

            {/* Day Content */}
            {weekDays.map((day, idx) => {
              const dayPosts = getPostsForDay(day);
              return (
                <div key={idx} className={`min-h-[420px] p-3 ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
                  <div className="space-y-2.5 overflow-y-auto max-h-[400px] pr-1">
                    {dayPosts.map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setSelectedPost(post)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all hover:shadow-md hover:-translate-y-0.5 ${getStatusColor(post.status)}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            post.platform === 'x' ? 'bg-gray-900' : 
                            post.platform === 'linkedin' ? 'bg-blue-600' : 'bg-orange-500'
                          }`}>
                            {post.platform === 'x' && <XIcon className="w-3.5 h-3.5 text-white" />}
                            {post.platform === 'linkedin' && <LinkedInIcon className="w-3.5 h-3.5 text-white" />}
                            {post.platform === 'reddit' && <RedditIcon className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className="text-xs font-semibold text-gray-700">{formatTime(post.scheduledFor)}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{post.content}</p>
                      </button>
                    ))}
                    {dayPosts.length === 0 && (
                      <div className="h-full flex items-center justify-center py-16">
                        <span className="text-sm text-gray-400">No posts</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredPosts.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <InboxIcon className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-lg text-gray-500 mb-1">No posts found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters or create a new post.</p>
              </div>
            ) : filteredPosts.map((post) => (
              <div key={post.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    post.platform === 'x' ? 'bg-gray-900' : 
                    post.platform === 'linkedin' ? 'bg-blue-600' : 'bg-orange-500'
                  }`}>
                    {post.platform === 'x' && <XIcon className="w-6 h-6 text-white" />}
                    {post.platform === 'linkedin' && <LinkedInIcon className="w-6 h-6 text-white" />}
                    {post.platform === 'reddit' && <RedditIcon className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getStatusBadge(post.status)}`}>
                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                      </span>
                      <span className="text-sm text-gray-400 flex items-center gap-1.5">
                        {post.source === 'github' && <GitHubIcon className="w-4 h-4" />}
                        {post.source === 'ai' && <SparklesIcon className="w-4 h-4" />}
                        {getSourceLabel(post.source)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-5 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4" />
                        {formatDate(post.scheduledFor)} at {formatTime(post.scheduledFor)}
                      </span>
                      {post.engagement && (
                        <span className="flex items-center gap-4">
                          {post.engagement.likes && <span className="flex items-center gap-1"><HeartIcon className="w-4 h-4 text-red-500" />{post.engagement.likes}</span>}
                          {(post.engagement.replies || post.engagement.comments) && <span className="flex items-center gap-1"><ChatIcon className="w-4 h-4 text-blue-500" />{post.engagement.replies || post.engagement.comments}</span>}
                        </span>
                      )}
                      {post.error && <span className="text-red-500 font-medium">{post.error}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {post.status === 'pending' && (
                      <>
                        <button className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-colors"><CheckIcon className="w-5 h-5" /></button>
                        <button className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"><XMarkIcon className="w-5 h-5" /></button>
                      </>
                    )}
                    {post.status === 'failed' && <button className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><RefreshIcon className="w-5 h-5" /></button>}
                    <button className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"><PencilIcon className="w-5 h-5" /></button>
                    <button className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"><TrashIcon className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} getStatusBadge={getStatusBadge} getSourceLabel={getSourceLabel} formatDate={formatDate} formatTime={formatTime} />}
      {showCreateModal && <CreatePostModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}

function PostDetailModal({ post, onClose, getStatusBadge, getSourceLabel, formatDate, formatTime }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              post.platform === 'x' ? 'bg-gray-900' : 
              post.platform === 'linkedin' ? 'bg-blue-600' : 'bg-orange-500'
            }`}>
              {post.platform === 'x' && <XIcon className="w-6 h-6 text-white" />}
              {post.platform === 'linkedin' && <LinkedInIcon className="w-6 h-6 text-white" />}
              {post.platform === 'reddit' && <RedditIcon className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {post.platform === 'x' ? 'X / Twitter' : post.platform === 'linkedin' ? 'LinkedIn' : 'Reddit'} Post
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${getStatusBadge(post.status)}`}>
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Content</label>
            <p className="text-gray-900 leading-relaxed">{post.content}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Scheduled For</label>
              <p className="text-gray-900 font-medium">{formatDate(post.scheduledFor)}</p>
              <p className="text-gray-500 text-sm">{formatTime(post.scheduledFor)}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Source</label>
              <p className="text-gray-900 font-medium flex items-center gap-2">
                {post.source === 'github' && <GitHubIcon className="w-5 h-5" />}
                {post.source === 'ai' && <SparklesIcon className="w-5 h-5 text-purple-600" />}
                {getSourceLabel(post.source)}
              </p>
            </div>
          </div>

          {post.engagement && (
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Engagement</label>
              <div className="flex items-center gap-6">
                {post.engagement.likes && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <HeartIcon className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{post.engagement.likes}</div>
                      <div className="text-xs text-gray-500">Likes</div>
                    </div>
                  </div>
                )}
                {(post.engagement.replies || post.engagement.comments) && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <ChatIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{post.engagement.replies || post.engagement.comments}</div>
                      <div className="text-xs text-gray-500">{post.engagement.replies ? 'Replies' : 'Comments'}</div>
                    </div>
                  </div>
                )}
                {post.engagement.reposts && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                      <RefreshIcon className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{post.engagement.reposts}</div>
                      <div className="text-xs text-gray-500">Reposts</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {post.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <label className="block text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Error</label>
              <p className="text-red-700">{post.error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center">
          <button className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors flex items-center gap-2">
            <TrashIcon className="w-5 h-5" />
            Delete
          </button>
          <div className="flex gap-3">
            {post.status === 'pending' && (
              <>
                <button className="px-5 py-2.5 text-red-600 border border-red-200 hover:bg-red-50 rounded-xl font-medium transition-colors">Reject</button>
                <button className="px-5 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors">Approve</button>
              </>
            )}
            {post.status === 'scheduled' && (
              <button className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                <PencilIcon className="w-5 h-5" />
                Edit Post
              </button>
            )}
            {post.status === 'failed' && (
              <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                <RefreshIcon className="w-5 h-5" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatePostModal({ onClose }) {
  const [platform, setPlatform] = useState('x');
  const [content, setContent] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Manual Post</h2>
          <button onClick={onClose} className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Platform</label>
            <div className="flex gap-3">
              {['x', 'linkedin', 'reddit'].map((p) => (
                <button 
                  key={p} 
                  onClick={() => setPlatform(p)} 
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 transition-all ${platform === p ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {p === 'x' && <XIcon className="w-5 h-5" />}
                  {p === 'linkedin' && <LinkedInIcon className="w-5 h-5" />}
                  {p === 'reddit' && <RedditIcon className="w-5 h-5" />}
                  <span className="font-medium">{p === 'x' ? 'X / Twitter' : p === 'linkedin' ? 'LinkedIn' : 'Reddit'}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Content</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="What do you want to share?" 
              className="w-full h-36 px-4 py-3 text-base border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-500 transition-colors"
            />
            <div className="flex justify-between mt-3">
              <span className={`text-sm font-medium ${content.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>{content.length}/280</span>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4" />
                AI Generate
              </button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Schedule</label>
            <div className="flex gap-4">
              <input type="date" className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-blue-500 transition-colors" />
              <input type="time" defaultValue="09:00" className="px-4 py-3 border-2 border-gray-200 rounded-xl text-base focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancel</button>
          <button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">Save Draft</button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all">Schedule</button>
        </div>
      </div>
    </div>
  );
}

// Icons
function PlusIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>; }
function ListIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>; }
function CalendarIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function InboxIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>; }
function ClockIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function CheckIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>; }
function XMarkIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>; }
function PencilIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>; }
function TrashIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>; }
function RefreshIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function SparklesIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>; }
function HeartIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>; }
function ChatIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>; }
function ChevronLeftIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>; }
function ChevronRightIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>; }
function XIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }
function LinkedInIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>; }
function RedditIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>; }
function GitHubIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>; }