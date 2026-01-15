"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CommunitiesPage() {
  const [user, setUser] = useState(null);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);

    const { data } = await supabase
      .from('x_communities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setCommunities(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Remove this community?')) {
      await supabase.from('x_communities').delete().eq('id', id);
      await loadData();
    }
  };

  const handleToggle = async (id, isActive) => {
    await supabase.from('x_communities').update({ is_active: !isActive }).eq('id', id);
    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div className="p-8 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/dashboard/settings" className="hover:text-gray-700">Settings</Link>
          <span>/</span>
          <span className="text-gray-900">X Communities</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">X Communities</h1>
            <p className="text-gray-500 mt-1">Add communities where you want to automatically post content.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
          >
            <PlusIcon className="w-5 h-5" />
            Add Community
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start gap-3">
            <InfoIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How to find your Community ID:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Go to the X Community you want to add</li>
                <li>The URL will be like: twitter.com/i/communities/<strong>1234567890</strong></li>
                <li>Copy the number at the end - that's your Community ID</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Communities List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {communities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-900 font-medium mb-2">No communities added yet</p>
              <p className="text-gray-500 text-sm mb-4">Add X communities to automatically post your content there</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Add your first community →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {communities.map((community) => (
                <div key={community.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                      <UsersIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{community.name}</div>
                      <div className="text-sm text-gray-500">ID: {community.community_id}</div>
                      {community.description && (
                        <div className="text-sm text-gray-500 mt-1">{community.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(community.id, community.is_active)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${community.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${community.is_active ? 'right-1' : 'left-1'}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(community.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-6">
          <Link href="/dashboard/settings" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Settings
          </Link>
        </div>
      </div>

      {/* Add Community Modal */}
      {showAddModal && (
        <AddCommunityModal
          userId={user?.id}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            setShowAddModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function AddCommunityModal({ userId, onClose, onAdded }) {
  const [communityId, setCommunityId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleAdd = async () => {
    if (!communityId.trim() || !name.trim()) {
      setError('Community ID and name are required');
      return;
    }

    setSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('x_communities').insert({
      user_id: userId,
      community_id: communityId.trim(),
      name: name.trim(),
      description: description.trim() || null,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        setError('This community is already added');
      } else {
        setError(insertError.message);
      }
      setSaving(false);
      return;
    }

    onAdded();
  };

  // Extract community ID from URL if pasted
  const handleCommunityIdChange = (value) => {
    // Check if it's a URL
    const match = value.match(/communities\/(\d+)/);
    if (match) {
      setCommunityId(match[1]);
    } else {
      setCommunityId(value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Add X Community</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community ID or URL *
            </label>
            <input
              type="text"
              value={communityId}
              onChange={(e) => handleCommunityIdChange(e.target.value)}
              placeholder="1234567890 or paste full URL"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Find this in the community URL</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Community Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Build in Public"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this community about?"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium rounded-xl hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !communityId.trim() || !name.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Adding...' : 'Add Community'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Icons
function PlusIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>; }
function InfoIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function UsersIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>; }
function TrashIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>; }
function XMarkIcon({ className }) { return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>; }