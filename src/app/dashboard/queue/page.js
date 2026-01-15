"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContentQueuePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('calendar'); // 'list' or 'calendar'
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ pending: 0, scheduled: 0, posted: 0, failed: 0 });
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [editingPost, setEditingPost] = useState(null);
  const [showManualPostModal, setShowManualPostModal] = useState(false);
  const [communities, setCommunities] = useState([]);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [statusFilter, platformFilter]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    // Build query
    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (platformFilter !== 'all') {
      query = query.eq('platform', platformFilter);
    }

    const { data: postsData } = await query;
    setPosts(postsData || []);

    // Get stats
    const { count: pendingCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending');
    const { count: scheduledCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'scheduled');
    const { count: postedCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'posted');
    const { count: failedCount } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'failed');

    setStats({
      pending: pendingCount || 0,
      scheduled: scheduledCount || 0,
      posted: postedCount || 0,
      failed: failedCount || 0,
    });

    // Load communities
    const { data: communitiesData } = await supabase
      .from('x_communities')
      .select('*')
      .eq('user_id', user.id);
    setCommunities(communitiesData || []);

    setLoading(false);
  };

  const handleApprove = async (postId) => {
    await supabase.from('posts').update({ status: 'scheduled' }).eq('id', postId);
    await loadData();
  };

  const handleDelete = async (postId) => {
    if (confirm('Are you sure you want to delete this post?')) {
      await supabase.from('posts').delete().eq('id', postId);
      await loadData();
    }
  };

  const handleUpdatePost = async (postId, updates) => {
    await supabase.from('posts').update(updates).eq('id', postId);
    setEditingPost(null);
    await loadData();
  };

  const handleRetry = async (postId) => {
    await supabase.from('posts').update({ status: 'scheduled' }).eq('id', postId);
    await loadData();
  };

  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getPostsForDay = (date) => {
    return posts.filter(post => {
      if (!post.scheduled_at) return false;
      const postDate = new Date(post.scheduled_at);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const navigateWeek = (direction) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction * 7));
    setCurrentWeekStart(newStart);
  };

  const goToToday = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const isToday = (date) => date.toDateString() === new Date().toDateString();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Content Queue</h1>
            <p className="text-gray-500 mt-1">Manage all your scheduled and posted content.</p>
          </div>
          <button
            onClick={() => setShowManualPostModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Manual Post
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setView('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
                >
                  <ListIcon className="w-4 h-4" />
                  List
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  Calendar
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Status:</span>
                <div className="flex items-center gap-1">
                  {['all', 'pending', 'scheduled', 'posted', 'failed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${statusFilter === status ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Platform Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Platform:</span>
              <div className="flex items-center gap-1">
                {['all', 'x', 'linkedin'].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setPlatformFilter(platform)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${platformFilter === platform ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {platform === 'all' ? 'All' : platform === 'x' ? 'X' : 'LinkedIn'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Pending</div>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Scheduled</div>
            <div className="text-2xl font-bold text-blue-600">{stats.scheduled}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Posted</div>
            <div className="text-2xl font-bold text-green-600">{stats.posted}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-sm text-gray-500 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </div>
        </div>

        {/* Calendar View */}
        {view === 'calendar' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => navigateWeek(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <button onClick={goToToday} className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                    Today
                  </button>
                  <button onClick={() => navigateWeek(1)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-100 border-2 border-amber-400"></div>
                  <span className="text-gray-600">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-100 border-2 border-blue-400"></div>
                  <span className="text-gray-600">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-100 border-2 border-green-400"></div>
                  <span className="text-gray-600">Posted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-100 border-2 border-red-400"></div>
                  <span className="text-gray-600">Failed</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {getWeekDays().map((day, index) => (
                <div key={index} className={`border-r border-gray-100 last:border-r-0 min-h-[400px] ${isToday(day) ? 'bg-blue-50/50' : ''}`}>
                  {/* Day Header */}
                  <div className="p-3 border-b border-gray-100 text-center">
                    <div className="text-xs font-medium text-gray-500 uppercase">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`mt-1 w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-semibold ${isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </div>
                  </div>

                  {/* Posts */}
                  <div className="p-2 space-y-2">
                    {getPostsForDay(day).map((post) => (
                      <button
                        key={post.id}
                        onClick={() => setEditingPost(post)}
                        className={`w-full p-2 rounded-lg text-left text-xs transition-all hover:shadow-md ${
                          post.status === 'pending' ? 'bg-amber-50 border-l-2 border-amber-400' :
                          post.status === 'scheduled' ? 'bg-blue-50 border-l-2 border-blue-400' :
                          post.status === 'posted' ? 'bg-green-50 border-l-2 border-green-400' :
                          'bg-red-50 border-l-2 border-red-400'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {post.platform === 'x' ? (
                            <div className="w-4 h-4 rounded bg-black flex items-center justify-center">
                              <XIcon className="w-2.5 h-2.5 text-white" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center">
                              <LinkedInIcon className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                          <span className="text-gray-500">{formatTime(post.scheduled_at)}</span>
                        </div>
                        <p className="text-gray-700 line-clamp-2">{post.content}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {view === 'list' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {posts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No posts found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {posts.map((post) => (
                  <div key={post.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${post.platform === 'x' ? 'bg-black' : 'bg-blue-600'}`}>
                        {post.platform === 'x' ? <XIcon className="w-5 h-5 text-white" /> : <LinkedInIcon className="w-5 h-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                            post.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            post.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            post.status === 'posted' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {post.status}
                          </span>
                          <span className="text-xs text-gray-500">{formatDate(post.scheduled_at)}</span>
                          {post.community_name && (
                            <span className="text-xs text-purple-600 font-medium">📢 {post.community_name}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700">{post.content}</p>
                        {post.status === 'failed' && post.error_message && (
                          <p className="text-xs text-red-600 mt-2">Error: {post.error_message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => setEditingPost(post)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {post.status === 'pending' && (
                          <button onClick={() => handleApprove(post.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                        {post.status === 'failed' && (
                          <button onClick={() => handleRetry(post.id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Retry">
                            <RefreshIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          communities={communities}
          onClose={() => setEditingPost(null)}
          onSave={handleUpdatePost}
          onDelete={handleDelete}
          onApprove={handleApprove}
        />
      )}

      {/* Manual Post Modal */}
      {showManualPostModal && (
        <ManualPostModal
          userId={user?.id}
          communities={communities}
          onClose={() => setShowManualPostModal(false)}
          onCreated={() => {
            setShowManualPostModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function EditPostModal({ post, communities, onClose, onSave, onDelete, onApprove }) {
  const [content, setContent] = useState(post.content);
  const [scheduledAt, setScheduledAt] = useState(post.scheduled_at ? new Date(post.scheduled_at).toISOString().slice(0, 16) : '');
  const [communityId, setCommunityId] = useState(post.community_id || '');
  const [saving, setSaving] = useState(false);
  const maxLength = post.platform === 'x' ? 280 : 3000;

  const handleSave = async () => {
    setSaving(true);
    await onSave(post.id, {
      content,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      community_id: communityId || null,
    });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${post.platform === 'x' ? 'bg-black' : 'bg-blue-600'}`}>
              {post.platform === 'x' ? <XIcon className="w-5 h-5 text-white" /> : <LinkedInIcon className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Edit Post</h2>
              <span className={`text-xs font-medium ${
                post.status === 'pending' ? 'text-amber-600' :
                post.status === 'scheduled' ? 'text-blue-600' :
                post.status === 'posted' ? 'text-green-600' : 'text-red-600'
              }`}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              disabled={post.status === 'posted'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none disabled:bg-gray-50"
            />
            <div className={`text-xs mt-1 ${content.length > maxLength ? 'text-red-600' : 'text-gray-500'}`}>
              {content.length}/{maxLength}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              disabled={post.status === 'posted'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50"
            />
          </div>

          {post.platform === 'x' && communities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Post to Community (Optional)</label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                disabled={post.status === 'posted'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50"
              >
                <option value="">Personal Timeline</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {post.status === 'failed' && post.error_message && (
            <div className="p-3 bg-red-50 rounded-xl">
              <div className="text-sm font-medium text-red-700">Error</div>
              <div className="text-sm text-red-600">{post.error_message}</div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          <button onClick={() => onDelete(post.id)} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium">
            Delete
          </button>
          <div className="flex items-center gap-3">
            {post.status === 'pending' && (
              <button onClick={() => onApprove(post.id)} className="px-4 py-2 text-green-600 hover:bg-green-50 rounded-xl font-medium">
                Approve
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">
              Cancel
            </button>
            {post.status !== 'posted' && (
              <button
                onClick={handleSave}
                disabled={saving || content.length > maxLength}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualPostModal({ userId, communities, onClose, onCreated }) {
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState('x');
  const [scheduledAt, setScheduledAt] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const maxLength = platform === 'x' ? 280 : 3000;

  const handleCreate = async () => {
    if (!content.trim() || !scheduledAt) return;
    setSaving(true);

    const { error } = await supabase.from('posts').insert({
      user_id: userId,
      content: content.trim(),
      platform,
      status: 'scheduled',
      scheduled_at: new Date(scheduledAt).toISOString(),
      source: 'manual',
      community_id: communityId || null,
    });

    if (!error) {
      onCreated();
    } else {
      alert('Failed to create post');
    }
    setSaving(false);
  };

  // Set default time to next hour
  useEffect(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1, 0, 0, 0);
    setScheduledAt(now.toISOString().slice(0, 16));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Create Manual Post</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <div className="flex gap-3">
              <button
                onClick={() => setPlatform('x')}
                className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${platform === 'x' ? 'border-black bg-gray-50' : 'border-gray-200'}`}
              >
                <div className="w-6 h-6 rounded bg-black flex items-center justify-center">
                  <XIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">X</span>
              </button>
              <button
                onClick={() => setPlatform('linkedin')}
                className={`flex-1 p-3 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${platform === 'linkedin' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}
              >
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                  <LinkedInIcon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">LinkedIn</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="What's on your mind?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
            <div className={`text-xs mt-1 ${content.length > maxLength ? 'text-red-600' : 'text-gray-500'}`}>
              {content.length}/{maxLength}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule For</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {platform === 'x' && communities.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Post to Community (Optional)</label>
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Personal Timeline</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving || !content.trim() || !scheduledAt || content.length > maxLength}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Schedule Post'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Icons
function PlusIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>; }
function ListIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>; }
function CalendarIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>; }
function ChevronLeftIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>; }
function ChevronRightIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>; }
function PencilIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>; }
function CheckIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>; }
function TrashIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>; }
function RefreshIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>; }
function XMarkIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>; }
function XIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }
function LinkedInIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>; }