"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function XDashboardPage() {
  const [connectedAccount, setConnectedAccount] = useState(null);
  const [posts, setPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('compose');
  const [editingPost, setEditingPost] = useState(null);
  const supabase = createClient();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: account } = await supabase.from('connected_accounts').select('*').eq('platform', 'x').eq('is_active', true).single();
      setConnectedAccount(account || null);

      const { data: postsData } = await supabase.from('posts').select('*').eq('platform', 'x').order('created_at', { ascending: false }).limit(50);
      setPosts(postsData || []);

      // Fetch user's saved communities
      const { data: communitiesData } = await supabase.from('x_communities').select('*').eq('user_id', user.id).order('name');
      setCommunities(communitiesData || []);
    } catch (err) { console.error('Fetch error:', err); }
    finally { setLoading(false); }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setActiveTab('compose');
  };

  if (loading) return <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>;
  if (!connectedAccount) return <ConnectAccountPrompt />;

  const tabs = [
    { id: 'compose', label: editingPost ? 'Edit Post' : 'Compose', icon: '✏️' },
    { id: 'finder', label: 'Post Finder', icon: '🔍' },
    { id: 'scheduled', label: 'Scheduled', icon: '📅', count: posts.filter(p => p.status === 'scheduled').length },
    { id: 'posted', label: 'Posted', icon: '✅', count: posts.filter(p => p.status === 'posted').length },
    { id: 'drafts', label: 'Drafts', icon: '📝', count: posts.filter(p => p.status === 'draft').length },
    { id: 'communities', label: 'Communities', icon: '👥', count: communities.length },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center"><XIcon className="w-4 h-4 text-white" /></div>
          <h1 className="text-lg font-semibold text-gray-900">X / Twitter</h1>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-green-700">@{connectedAccount.platform_username}</span>
        </div>
      </header>
      <div className="bg-white border-b border-gray-200">
        <div className="flex gap-1 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id !== 'compose') setEditingPost(null); }} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <span>{tab.icon}</span>{tab.label}
              {tab.count > 0 && <span className="ml-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="p-6">
        {activeTab === 'compose' && <TweetComposer account={connectedAccount} communities={communities} onPostCreated={() => { fetchData(); setEditingPost(null); }} editingPost={editingPost} onCancelEdit={() => setEditingPost(null)} />}
        {activeTab === 'finder' && <PostFinder account={connectedAccount} />}
        {activeTab === 'scheduled' && <PostsList posts={posts.filter(p => p.status === 'scheduled')} communities={communities} emptyMessage="No scheduled posts" onUpdate={fetchData} onEdit={handleEditPost} showEdit={true} />}
        {activeTab === 'posted' && <PostsList posts={posts.filter(p => p.status === 'posted')} communities={communities} emptyMessage="No posted tweets yet" onUpdate={fetchData} onEdit={handleEditPost} showEdit={false} />}
        {activeTab === 'drafts' && <PostsList posts={posts.filter(p => p.status === 'draft')} communities={communities} emptyMessage="No drafts" onUpdate={fetchData} onEdit={handleEditPost} showEdit={true} />}
        {activeTab === 'communities' && <CommunitiesManager communities={communities} onUpdate={fetchData} />}
      </div>
    </div>
  );
}

// ==========================================
// COMMUNITIES MANAGER
// ==========================================

function CommunitiesManager({ communities, onUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCommunityId, setNewCommunityId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleAddCommunity = async () => {
    if (!newName.trim() || !newCommunityId.trim()) {
      setError('Name and Community ID are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const { error: insertError } = await supabase.from('x_communities').insert({
        user_id: user.id,
        name: newName.trim(),
        community_id: newCommunityId.trim(),
        description: newDescription.trim() || null,
      });

      if (insertError) throw insertError;

      setNewName('');
      setNewCommunityId('');
      setNewDescription('');
      setShowAddForm(false);
      onUpdate();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this community?')) return;
    await supabase.from('x_communities').delete().eq('id', id);
    onUpdate();
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">👥 My Communities</h2>
            <p className="text-gray-500 text-sm mt-1">Add X Communities you're a member of to schedule posts to them</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800"
          >
            + Add Community
          </button>
        </div>

        {/* How to find Community ID */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <h3 className="font-medium text-blue-900 mb-2">💡 How to find your Community ID</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Go to your X Community on x.com</li>
            <li>2. Look at the URL: <code className="bg-blue-100 px-1 rounded">x.com/i/communities/<strong>1234567890</strong></code></li>
            <li>3. Copy the number at the end - that's your Community ID</li>
          </ol>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="p-4 bg-gray-50 rounded-xl mb-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Add New Community</h3>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Community Name *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Build in Public"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Community ID *</label>
                <input
                  type="text"
                  value={newCommunityId}
                  onChange={(e) => setNewCommunityId(e.target.value)}
                  placeholder="e.g., 1493467890123456789"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., Share what you're working on"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowAddForm(false); setError(''); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCommunity}
                  disabled={isSubmitting || !newName.trim() || !newCommunityId.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Adding...' : 'Add Community'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Communities List */}
        {communities.length > 0 ? (
          <div className="space-y-3">
            {communities.map((community) => (
              <div key={community.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {community.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{community.name}</div>
                    {community.description && (
                      <div className="text-sm text-gray-500">{community.description}</div>
                    )}
                    <div className="text-xs text-gray-400 font-mono mt-0.5">ID: {community.community_id}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(community.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>No communities added yet</p>
            <p className="text-sm mt-1">Add communities you're a member of to schedule posts to them</p>
          </div>
        )}
      </div>

      {/* Note about X API */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <h3 className="font-medium text-amber-900 mb-1">⚠️ Important Note</h3>
        <p className="text-sm text-amber-700">
          X's API doesn't support posting directly to Communities. Posts scheduled to communities will be posted to your timeline with a note about the intended community. You can then manually share to the community from X.
        </p>
      </div>
    </div>
  );
}

// ==========================================
// TWEET COMPOSER
// ==========================================

function TweetComposer({ account, communities, onPostCreated, editingPost, onCancelEdit }) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiTone, setAiTone] = useState('casual');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [postToTimeline, setPostToTimeline] = useState(true);
  const supabase = createClient();
  const maxLength = 280;

  useEffect(() => {
    if (editingPost) {
      setContent(editingPost.content || '');
      setSelectedCommunity(editingPost.community_id || '');
      if (editingPost.scheduled_at) {
        const date = new Date(editingPost.scheduled_at);
        setScheduleDate(date.toISOString().split('T')[0]);
        setScheduleTime(date.toTimeString().slice(0, 5));
        setShowScheduler(true);
      }
    } else {
      setContent('');
      setSelectedCommunity('');
      setScheduleDate('');
      setScheduleTime('');
      setShowScheduler(false);
    }
  }, [editingPost]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const allTimeSlots = generateTimeSlots();
  const bestTimes = [
    { time: '09:00', label: '9 AM', reason: 'Morning commute' },
    { time: '12:00', label: '12 PM', reason: 'Lunch break' },
    { time: '17:00', label: '5 PM', reason: 'End of work' },
    { time: '20:00', label: '8 PM', reason: 'Evening scroll' },
  ];
  const goodTimes = ['07:00', '08:00', '10:00', '13:00', '15:00', '18:00', '19:00', '21:00', '22:00'];

  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        value: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday: i === 0,
      });
    }
    return days;
  };

  const formatTimeDisplay = (time) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${hour12}:${m} ${ampm}`;
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockResponses = {
      casual: `Just shipped ${aiPrompt}! 🚀\n\nTook longer than expected but we got there.\n\nWhat feature should I build next? 👇`,
      professional: `Excited to announce: ${aiPrompt}\n\nKey insights:\n• Focus on user feedback\n• Ship fast, iterate faster\n\nMore updates coming soon.`,
      funny: `Me: "This will take 2 hours"\n\nAlso me 3 days later: Finally shipped ${aiPrompt} 😅\n\nWho else can relate?`,
      motivational: `Today I shipped ${aiPrompt} 💪\n\nRemember: Every big achievement started as a small step.\n\nKeep building. Keep shipping.\n\n#buildinpublic`,
    };
    setContent(mockResponses[aiTone] || mockResponses.casual);
    setShowAIModal(false);
    setAiPrompt('');
    setAiGenerating(false);
  };

  const handlePostNow = async () => {
    if (!content.trim()) return;
    setIsPosting(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/posts/x/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim(), communityId: selectedCommunity || null, postId: editingPost?.id || null })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to post');
      setContent('');
      setSelectedCommunity('');
      setSuccess('🎉 Posted to X!');
      setTimeout(() => setSuccess(''), 5000);
      onPostCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPosting(false);
    }
  };

  const handleSchedule = async () => {
    if (!content.trim() || !scheduleDate || !scheduleTime) return;
    setIsSubmitting(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();

      if (editingPost) {
        const { error: updateError } = await supabase.from('posts').update({
          content: content.trim(),
          scheduled_at: scheduledAt,
          community_id: selectedCommunity || null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingPost.id);
        if (updateError) throw updateError;
        setSuccess('✅ Post updated!');
      } else {
        const { error: insertError } = await supabase.from('posts').insert({
          user_id: user.id,
          content: content.trim(),
          platform: 'x',
          status: 'scheduled',
          scheduled_at: scheduledAt,
          community_id: selectedCommunity || null,
        });
        if (insertError) throw insertError;
        setSuccess('📅 Post scheduled!');
      }

      setContent('');
      setScheduleDate('');
      setScheduleTime('');
      setSelectedCommunity('');
      setShowScheduler(false);
      setTimeout(() => setSuccess(''), 3000);
      onPostCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      if (editingPost) {
        await supabase.from('posts').update({
          content: content.trim(),
          status: 'draft',
          community_id: selectedCommunity || null,
          scheduled_at: null,
          updated_at: new Date().toISOString(),
        }).eq('id', editingPost.id);
        setSuccess('✅ Draft updated!');
      } else {
        await supabase.from('posts').insert({
          user_id: user.id,
          content: content.trim(),
          platform: 'x',
          status: 'draft',
          community_id: selectedCommunity || null,
        });
        setSuccess('📝 Draft saved!');
      }

      setContent('');
      setSelectedCommunity('');
      setTimeout(() => setSuccess(''), 3000);
      onPostCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCommunityData = communities.find(c => c.community_id === selectedCommunity);

  return (
    <div className="max-w-2xl">
      {editingPost && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-500 text-xl">✏️</span>
            <div>
              <span className="font-medium text-amber-800">Editing {editingPost.status} post</span>
              {editingPost.scheduled_at && <span className="text-amber-600 text-sm ml-2">Scheduled for {new Date(editingPost.scheduled_at).toLocaleString()}</span>}
            </div>
          </div>
          <button onClick={onCancelEdit} className="px-3 py-1.5 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-medium">Cancel Edit</button>
        </div>
      )}

      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"><span className="text-red-500">⚠️</span><span className="text-red-700 flex-1">{error}</span><button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button></div>}
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">{success}</div>}

      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-gray-900">✨ AI Generate</h3><button onClick={() => setShowAIModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button></div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-2">What do you want to post about?</label><textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g., Just launched my new feature, hit 100 users..." className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[100px]" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ id: 'casual', label: '😊 Casual', desc: 'Friendly & conversational' }, { id: 'professional', label: '💼 Professional', desc: 'Business-appropriate' }, { id: 'funny', label: '😄 Funny', desc: 'Witty & entertaining' }, { id: 'motivational', label: '💪 Motivational', desc: 'Inspiring' }].map((tone) => (
                    <button key={tone.id} onClick={() => setAiTone(tone.id)} className={`p-3 rounded-xl text-left transition-all ${aiTone === tone.id ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}`}><div className="font-medium text-gray-900">{tone.label}</div><div className="text-xs text-gray-500">{tone.desc}</div></button>
                  ))}
                </div>
              </div>
              <button onClick={handleAIGenerate} disabled={aiGenerating || !aiPrompt.trim()} className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg disabled:opacity-50">{aiGenerating ? '⏳ Generating...' : '✨ Generate Post'}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold">{account.platform_username?.[0]?.toUpperCase()}</div>
            <div><div className="font-semibold text-gray-900">{account.platform_display_name || account.platform_username}</div><div className="text-sm text-gray-500">@{account.platform_username}</div></div>
          </div>
          <button onClick={() => setShowAIModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:shadow-lg">✨ AI Generate</button>
        </div>

        <div className="p-4">
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's happening?" className="w-full min-h-[120px] text-lg resize-none focus:outline-none placeholder-gray-400" maxLength={maxLength} />
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-3"><button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">🖼️</button><button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg">😀</button></div>
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8"><svg className="w-8 h-8 -rotate-90"><circle cx="16" cy="16" r="12" fill="none" stroke="#e5e7eb" strokeWidth="3" /><circle cx="16" cy="16" r="12" fill="none" stroke={content.length > 260 ? '#ef4444' : content.length > 200 ? '#f59e0b' : '#3b82f6'} strokeWidth="3" strokeDasharray={`${(content.length / maxLength) * 75.4} 75.4`} /></svg>{content.length > 200 && <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${content.length > 260 ? 'text-red-500' : 'text-amber-500'}`}>{maxLength - content.length}</span>}</div>
              <span className="text-sm text-gray-400">{content.length}/{maxLength}</span>
            </div>
          </div>
        </div>

        {/* Community Selection */}
        <div className="px-4 pb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">👥 Choose Audience</label>
          <div className="space-y-2">
            {/* Timeline Option */}
            <button
              onClick={() => setSelectedCommunity('')}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${!selectedCommunity ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">👤</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Everyone</div>
                <div className="text-xs text-gray-500">Post to your timeline</div>
              </div>
              {!selectedCommunity && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
            </button>

            {/* My Communities Section */}
            {communities.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-500">My Communities</span>
                  <Link href="#" onClick={(e) => { e.preventDefault(); }} className="text-xs text-blue-600 hover:text-blue-700">+ Add/Manage</Link>
                </div>
                {communities.map((community) => (
                  <button
                    key={community.id}
                    onClick={() => setSelectedCommunity(community.community_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left mb-2 ${selectedCommunity === community.community_id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {community.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{community.name}</div>
                      {community.description && <div className="text-xs text-gray-500">{community.description}</div>}
                      <div className="text-xs text-gray-400 font-mono">ID: {community.community_id.slice(0, 10)}...</div>
                    </div>
                    {selectedCommunity === community.community_id && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>}
                  </button>
                ))}
              </div>
            )}

            {/* No communities yet */}
            {communities.length === 0 && (
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <p className="text-sm text-gray-500 mb-2">No communities added yet</p>
                <button onClick={() => {}} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Go to Communities tab to add →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scheduler */}
        {showScheduler && (
          <div className="border-t border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">📅 Schedule Post</h3>
              <button onClick={() => setShowScheduler(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Date</label>
              <div className="grid grid-cols-7 gap-2">
                {getNextDays().map((day) => (
                  <button key={day.value} onClick={() => setScheduleDate(day.value)} className={`flex flex-col items-center p-2 rounded-xl text-sm font-medium transition-all ${scheduleDate === day.value ? 'bg-black text-white shadow-lg scale-105' : day.isWeekend ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200' : day.isToday ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'}`}>
                    <span className="text-xs opacity-70">{day.dayName}</span>
                    <span className="text-lg font-bold">{day.dayNum}</span>
                    <span className="text-xs opacity-60">{day.month}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Time</label>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2"><span className="text-green-500">🔥</span><span className="text-sm font-medium text-green-700">Best engagement times</span></div>
                <div className="grid grid-cols-4 gap-2">
                  {bestTimes.map((t) => (<button key={t.time} onClick={() => setScheduleTime(t.time)} className={`p-3 rounded-xl text-sm font-medium transition-all ${scheduleTime === t.time ? 'bg-green-500 text-white shadow-lg' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`}><div className="font-bold">{t.label}</div><div className="text-xs opacity-75">{t.reason}</div></button>))}
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2"><span className="text-blue-500">👍</span><span className="text-sm font-medium text-blue-700">Good times</span></div>
                <div className="flex flex-wrap gap-2">{goodTimes.map((time) => (<button key={time} onClick={() => setScheduleTime(time)} className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${scheduleTime === time ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>{formatTimeDisplay(time)}</button>))}</div>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2"><span className="text-gray-500">⏰</span><span className="text-sm font-medium text-gray-700">Custom time</span></div>
                <div className="flex gap-2">
                  <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  <button onClick={() => customTime && setScheduleTime(customTime)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">Set</button>
                </div>
              </div>
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 font-medium">📋 Show all time slots</summary>
                <div className="mt-3 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto bg-white rounded-xl border border-gray-200 p-3">
                  {allTimeSlots.map((time) => (<button key={time} onClick={() => setScheduleTime(time)} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${scheduleTime === time ? 'bg-black text-white' : bestTimes.some(t => t.time === time) ? 'bg-green-100 text-green-700' : goodTimes.includes(time) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>{time}</button>))}
                </div>
              </details>
            </div>

            {scheduleDate && scheduleTime && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                <div className="text-sm text-blue-800">
                  📅 Will be posted on <strong>{new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</strong>
                  {selectedCommunityData && <span className="block mt-1">👥 To: {selectedCommunityData.name}</span>}
                </div>
              </div>
            )}

            <button onClick={handleSchedule} disabled={isSubmitting || !content.trim() || !scheduleDate || !scheduleTime} className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50">{isSubmitting ? '⏳ Saving...' : editingPost ? '✅ Update Schedule' : '📅 Schedule Post'}</button>
          </div>
        )}

        {!showScheduler && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button onClick={() => setShowScheduler(true)} className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl text-sm font-medium">📅 Schedule</button>
            <div className="flex gap-2">
              <button onClick={handleSaveDraft} disabled={isSubmitting || isPosting || !content.trim()} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl text-sm font-medium disabled:opacity-50">{editingPost ? 'Save as Draft' : 'Save Draft'}</button>
              <button onClick={handlePostNow} disabled={isSubmitting || isPosting || !content.trim()} className="px-6 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50">{isPosting ? '⏳ Posting...' : '🚀 Post Now'}</button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for better engagement</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Best times:</strong> 9 AM, 12 PM, 5 PM, 8 PM (your timezone)</li>
          <li>• <strong>Threads</strong> get 2-3x more engagement than single tweets</li>
          <li>• <strong>Questions</strong> boost replies by 50%</li>
          <li>• <strong>Weekends</strong> have 20% less engagement</li>
        </ul>
      </div>
    </div>
  );
}

function PostFinder({ account }) {
  const [community, setCommunity] = useState('Build in Public');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const communities = ['Build in Public', 'SaaS Founders', 'Developer Tools', 'AI/ML', 'No-Code', 'Indie Hackers'];

  const fetchPosts = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const mockPosts = [
      { id: '1', author: { username: 'levelsio', name: 'Pieter Levels', verified: true }, content: 'Just crossed $100k/mo with PhotoAI. Here\'s what I learned...', metrics: { likes: 2453, replies: 342, retweets: 567 }, timestamp: '2h', score: 98 },
      { id: '2', author: { username: 'marclouvion', name: 'Marc Lou', verified: true }, content: 'Hot take: Most indie hackers spend 80% building, 20% marketing.\n\nIt should be the opposite.', metrics: { likes: 1234, replies: 456, retweets: 234 }, timestamp: '4h', score: 94 },
      { id: '3', author: { username: 'tdinh_me', name: 'Tony Dinh', verified: true }, content: 'Day 45 of building in public:\n\n- 500 users\n- $2k MRR\n- 0 paid ads', metrics: { likes: 876, replies: 123, retweets: 89 }, timestamp: '6h', score: 87 },
    ];
    setPosts(mockPosts);
    setLoading(false);
  };

  const generateReply = () => {
    const replies = [`Great insights! I'm building something similar - would love to connect 🙌`, `This resonates. What was your biggest challenge?`, `Love this! Currently at the same stage 💪`];
    setReplyContent(replies[Math.floor(Math.random() * replies.length)]);
  };

  return (
    <div className="max-w-4xl">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">🔍 Post Finder</h2>
        <p className="text-gray-500 mb-4">Find high-engagement posts to reply to</p>
        <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-2">Select Community</label><div className="flex flex-wrap gap-2">{communities.map((c) => (<button key={c} onClick={() => setCommunity(c)} className={`px-4 py-2 rounded-xl text-sm font-medium ${community === c ? 'bg-black text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{c}</button>))}</div></div>
        <button onClick={fetchPosts} disabled={loading} className="w-full py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50">{loading ? '⏳ Searching...' : '🔍 Find Posts'}</button>
      </div>
      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold">{post.author.username[0].toUpperCase()}</div>
                <div className="flex-1"><span className="font-semibold text-gray-900">{post.author.name}</span> {post.author.verified && <span className="text-blue-500">✓</span>}<br/><span className="text-sm text-gray-500">@{post.author.username} · {post.timestamp}</span></div>
                <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${post.score >= 90 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>🔥 {post.score}</span>
              </div>
              <p className="text-gray-900 whitespace-pre-wrap mb-4">{post.content}</p>
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-4"><span>❤️ {post.metrics.likes.toLocaleString()}</span><span>💬 {post.metrics.replies.toLocaleString()}</span></div>
              {replyingTo === post.id ? (
                <div className="border-t border-gray-100 pt-4">
                  <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write your reply..." className="w-full p-3 border border-gray-200 rounded-xl min-h-[80px]" maxLength={280} />
                  <div className="flex items-center justify-between mt-3">
                    <button onClick={generateReply} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">✨ AI Suggest</button>
                    <div className="flex gap-2"><button onClick={() => { setReplyingTo(null); setReplyContent(''); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button><button disabled={!replyContent.trim()} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50">Reply</button></div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setReplyingTo(post.id)} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">💬 Reply</button>
                  <a href={`https://x.com/${post.author.username}`} target="_blank" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">↗️ View</a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading && posts.length === 0 && <div className="text-center py-12"><div className="text-6xl mb-4">🔍</div><h3 className="text-xl font-semibold text-gray-900 mb-2">Find posts to engage with</h3><p className="text-gray-500">Select a community and click Find Posts</p></div>}
    </div>
  );
}

function PostsList({ posts, communities, emptyMessage, onUpdate, onEdit, showEdit }) {
  const supabase = createClient();
  const handleDelete = async (postId) => { if (!confirm('Delete?')) return; await supabase.from('posts').delete().eq('id', postId); onUpdate(); };
  const handlePostNow = async (post) => {
    if (!confirm('Post now?')) return;
    try {
      const response = await fetch('/api/posts/x/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: post.content, postId: post.id }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error); }
      onUpdate();
    } catch (err) { alert('Failed: ' + err.message); }
  };

  const getCommunityName = (communityId) => {
    const community = communities.find(c => c.community_id === communityId);
    return community?.name || communityId;
  };

  if (!posts.length) return <div className="text-center py-16"><div className="text-6xl mb-4">📭</div><p className="text-gray-500">{emptyMessage}</p></div>;

  return (
    <div className="space-y-4 max-w-2xl">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-2xl border border-gray-200 p-5">
          <p className="text-gray-900 whitespace-pre-wrap mb-4">{post.content}</p>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.status === 'scheduled' && post.scheduled_at && <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">📅 {new Date(post.scheduled_at).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>}
            {post.status === 'posted' && <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">✅ Posted</span>}
            {post.status === 'draft' && <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">📝 Draft</span>}
            {post.community_id && <span className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">👥 {getCommunityName(post.community_id)}</span>}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-400">Created {new Date(post.created_at).toLocaleDateString()}</div>
            <div className="flex gap-2">
              {showEdit && <button onClick={() => onEdit(post)} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-100">✏️ Edit</button>}
              {(post.status === 'draft' || post.status === 'scheduled') && <button onClick={() => handlePostNow(post)} className="px-3 py-1.5 bg-black text-white rounded-lg text-sm font-medium">🚀 Post Now</button>}
              {post.external_url && <a href={post.external_url} target="_blank" className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">↗️ View</a>}
              <button onClick={() => handleDelete(post.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm">🗑️</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConnectAccountPrompt() {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center"><XIcon className="w-4 h-4 text-white" /></div><h1 className="text-lg font-semibold text-gray-900">X / Twitter</h1></div></header>
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mb-6"><XIcon className="w-10 h-10 text-white" /></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect your X account</h2>
        <p className="text-gray-500 text-center max-w-md mb-8">Link your X account to start scheduling tweets</p>
        <Link href="/dashboard/settings/integrations" className="px-8 py-4 bg-black text-white font-medium rounded-2xl hover:bg-gray-800">Connect X Account →</Link>
      </div>
    </div>
  );
}

function XIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }