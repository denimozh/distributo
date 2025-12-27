"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('week'); // 'week' or 'month'
  const supabase = createClient();

  useEffect(() => {
    fetchPosts();
  }, [currentDate]);

  const fetchPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch all posts for the current month range
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .or(`scheduled_at.gte.${startOfMonth.toISOString()},posted_at.gte.${startOfMonth.toISOString()}`)
        .order('scheduled_at', { ascending: true });

      if (error) {
        console.error('Error fetching posts:', error);
      }

      setPosts(data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get days in current week
  const getWeekDays = () => {
    const days = [];
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  // Get posts for a specific day
  const getPostsForDay = (date) => {
    return posts.filter(post => {
      const postDate = new Date(post.scheduled_at || post.posted_at || post.created_at);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const weekDays = getWeekDays();
  const today = new Date();

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const getPlatformIcon = (platform, size = 'sm') => {
    const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    const containerClasses = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
    
    switch (platform) {
      case 'x':
        return (
          <div className={`${containerClasses} rounded-md bg-gray-900 flex items-center justify-center flex-shrink-0`}>
            <svg className={`${sizeClasses} text-white`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
        );
      case 'reddit':
        return (
          <div className={`${containerClasses} rounded-md bg-orange-500 flex items-center justify-center flex-shrink-0`}>
            <svg className={`${sizeClasses} text-white`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701z"/>
            </svg>
          </div>
        );
      case 'linkedin':
        return (
          <div className={`${containerClasses} rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0`}>
            <svg className={`${sizeClasses} text-white`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${containerClasses} rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0`}>
            <span className="text-xs">📝</span>
          </div>
        );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'posted': return 'bg-green-100 border-green-300 text-green-800';
      case 'scheduled': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'draft': return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'failed': return 'bg-red-100 border-red-300 text-red-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">Calendar</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek(1)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <span className="text-sm text-gray-500">
            {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <Link
          href="/dashboard/x"
          className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          New Post
        </Link>
      </header>

      {/* Calendar Grid */}
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((day, idx) => {
              const isToday = day.toDateString() === today.toDateString();
              const dayPosts = getPostsForDay(day);
              
              return (
                <div
                  key={idx}
                  className={`p-4 text-center border-r border-gray-200 last:border-r-0 ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-2xl font-semibold ${
                    isToday ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {day.getDate()}
                  </div>
                  {dayPosts.length > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-7 min-h-[500px]">
            {weekDays.map((day, idx) => {
              const isToday = day.toDateString() === today.toDateString();
              const dayPosts = getPostsForDay(day);
              
              return (
                <div
                  key={idx}
                  className={`border-r border-gray-200 last:border-r-0 p-2 ${
                    isToday ? 'bg-blue-50/30' : ''
                  }`}
                >
                  {dayPosts.length > 0 ? (
                    <div className="space-y-2">
                      {dayPosts.map((post) => (
                        <div
                          key={post.id}
                          className={`p-2 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(post.status)}`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {getPlatformIcon(post.platform)}
                            <span className="font-medium capitalize">{post.platform}</span>
                          </div>
                          <p className="text-gray-700 line-clamp-2">{post.content.slice(0, 60)}...</p>
                          <div className="mt-1 text-gray-500">
                            {new Date(post.scheduled_at || post.posted_at || post.created_at).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-gray-300 text-xs">No posts</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="mt-8 text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📅</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No posts scheduled yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start scheduling your content to see it appear on your calendar.
            </p>
            <Link
              href="/dashboard/x"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              Create Your First Post
            </Link>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-sm text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span className="text-sm text-gray-600">Posted</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
            <span className="text-sm text-gray-600">Draft</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronLeftIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}