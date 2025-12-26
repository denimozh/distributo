"use client";

import { useState, useEffect } from 'react';

export default function CalendarPage() {
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);

  // Sample posts for demo
  const samplePosts = [
    {
      id: 1,
      title: 'Launch: New Feature Update',
      time: '7:00 AM',
      day: 4, // Thursday
      tags: [{ name: 'Product Update', color: 'blue' }, { name: 'X', color: 'gray' }],
      platform: 'x',
      status: 'scheduled',
    },
    {
      id: 2,
      title: 'Reddit AMA Announcement',
      time: '9:00 AM',
      day: 3, // Wednesday
      tags: [{ name: 'Community', color: 'green' }, { name: 'Reddit', color: 'orange' }],
      platform: 'reddit',
      status: 'scheduled',
    },
    {
      id: 3,
      title: 'Weekly Build Update',
      time: '8:00 AM',
      day: 5, // Friday
      tags: [{ name: 'Build in Public', color: 'purple' }],
      platform: 'x',
      status: 'draft',
    },
    {
      id: 4,
      title: 'LinkedIn Milestone Post',
      time: '10:00 AM',
      day: 4, // Thursday
      tags: [{ name: 'Milestone', color: 'green' }, { name: 'LinkedIn', color: 'blue' }],
      platform: 'linkedin',
      status: 'scheduled',
    },
    {
      id: 5,
      title: 'Share dev tips thread',
      time: '2:00 PM',
      day: 5, // Friday
      tags: [{ name: 'Tips', color: 'indigo' }, { name: 'Thread', color: 'gray' }],
      platform: 'x',
      status: 'idea',
    },
  ];

  useEffect(() => {
    setPosts(samplePosts);
  }, []);

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const weekDays = getWeekDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM

  const getPostsForDayAndHour = (dayIndex, hour) => {
    return posts.filter(post => {
      const postHour = parseInt(post.time.split(':')[0]);
      const isPM = post.time.includes('PM') && postHour !== 12;
      const adjustedHour = isPM ? postHour + 12 : postHour;
      return post.day === dayIndex && adjustedHour === hour;
    });
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getTagColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700',
      orange: 'bg-orange-100 text-orange-700',
      purple: 'bg-purple-100 text-purple-700',
      green: 'bg-green-100 text-green-700',
      gray: 'bg-gray-100 text-gray-700',
      indigo: 'bg-indigo-100 text-indigo-700',
      amber: 'bg-amber-100 text-amber-700',
    };
    return colors[color] || colors.gray;
  };

  return (
    <div className="h-screen flex flex-col bg-[#FAFBFC]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'calendar' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ListIcon className="w-4 h-4" />
              List
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <FilterIcon className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={() => setShowNewPostModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#1a1a2e] text-white rounded-lg text-sm font-medium hover:bg-[#2d2d44] transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            New
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
            <SparklesIcon className="w-4 h-4" />
            AI Generate
          </button>
        </div>
      </header>

      {/* Calendar */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Month/Week Navigation */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              {formatMonth(currentDate)}
              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateWeek(-1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => navigateWeek(1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="day">Day</option>
            </select>
          </div>
        </div>

        {/* Week View Grid */}
        <div className="flex-1 overflow-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 bg-white border-b border-gray-200 sticky top-0 z-10">
              <div className="p-3 text-xs font-medium text-gray-400 border-r border-gray-100">
                + WIB
              </div>
              {weekDays.map((day, idx) => (
                <div
                  key={idx}
                  className={`p-3 text-center border-r border-gray-100 ${
                    isToday(day) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="text-xs font-medium text-gray-400 mb-1">
                    {dayNames[idx]}
                  </div>
                  <div className={`text-lg font-semibold ${
                    isToday(day) ? 'text-blue-600' : 'text-gray-900'
                  }`}>
                    {day.getDate().toString().padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>

            {/* Time Grid */}
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
                  {/* Time Label */}
                  <div className="p-2 text-xs text-gray-400 text-right pr-3 border-r border-gray-100 h-24">
                    {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                  </div>
                  
                  {/* Day Columns */}
                  {weekDays.map((day, dayIdx) => {
                    const dayPosts = getPostsForDayAndHour(dayIdx, hour);
                    return (
                      <div
                        key={dayIdx}
                        className={`relative border-r border-gray-100 h-24 p-1 ${
                          isToday(day) ? 'bg-blue-50/30' : 'hover:bg-gray-50/50'
                        }`}
                      >
                        {dayPosts.map((post) => (
                          <PostCard key={post.id} post={post} getTagColor={getTagColor} />
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Current Time Indicator */}
              <CurrentTimeIndicator weekDays={weekDays} />
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <NewPostModal onClose={() => setShowNewPostModal(false)} />
      )}
    </div>
  );
}

// Platform Icon Component - Returns actual SVG icons
function PlatformIcon({ platform, size = 'sm' }) {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  
  switch (platform) {
    case 'x':
      return (
        <div className={`${size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'} rounded-md bg-gray-900 flex items-center justify-center flex-shrink-0`}>
          <svg className={`${sizeClasses} text-white`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </div>
      );
    case 'reddit':
      return (
        <div className={`${size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'} rounded-md bg-orange-500 flex items-center justify-center flex-shrink-0`}>
          <svg className={`${sizeClasses} text-white`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249z"/>
          </svg>
        </div>
      );
    case 'linkedin':
      return (
        <div className={`${size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'} rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0`}>
          <svg className={`${sizeClasses} text-white`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </div>
      );
    default:
      return (
        <div className={`${size === 'sm' ? 'w-6 h-6' : 'w-8 h-8'} rounded-md bg-gray-200 flex items-center justify-center flex-shrink-0`}>
          <span className="text-xs">📝</span>
        </div>
      );
  }
}

// Post Card Component
function PostCard({ post, getTagColor }) {
  return (
    <div className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all ${
      post.status === 'draft' ? 'bg-gray-50 border-gray-200 border-dashed' :
      post.status === 'idea' ? 'bg-amber-50 border-amber-200 border-dashed' :
      'bg-white border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-1.5">
        <h4 className="text-xs font-medium text-gray-900 line-clamp-2 flex-1">
          {post.title}
        </h4>
        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ml-1 ${
          post.status === 'scheduled' ? 'border-green-400 bg-green-50' :
          post.status === 'draft' ? 'border-gray-300' :
          'border-amber-400 bg-amber-50'
        }`} />
      </div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {post.tags.slice(0, 2).map((tag, idx) => (
          <span
            key={idx}
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getTagColor(tag.color)}`}
          >
            {tag.name}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">{post.time}</span>
        <PlatformIcon platform={post.platform} size="sm" />
      </div>
    </div>
  );
}

// Current Time Indicator
function CurrentTimeIndicator({ weekDays }) {
  const [position, setPosition] = useState({ top: 0, visible: false, dayIndex: -1 });

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const hour = now.getHours();
      const minutes = now.getMinutes();
      
      if (hour >= 7 && hour < 19) {
        const top = ((hour - 7) * 96) + (minutes / 60 * 96);
        const todayIndex = weekDays.findIndex(day => day.toDateString() === now.toDateString());
        setPosition({ top, visible: true, dayIndex: todayIndex });
      } else {
        setPosition({ ...position, visible: false });
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000);
    return () => clearInterval(interval);
  }, [weekDays]);

  if (!position.visible || position.dayIndex === -1) return null;

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-20"
      style={{ top: `${position.top}px` }}
    >
      <div className="grid grid-cols-8">
        <div className="col-start-1" />
        {weekDays.map((_, idx) => (
          <div key={idx} className="relative">
            {idx === position.dayIndex && (
              <div className="absolute inset-x-0 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full -ml-1" />
                <div className="flex-1 h-0.5 bg-blue-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// New Post Modal
function NewPostModal({ onClose }) {
  const [platform, setPlatform] = useState('x');
  const [content, setContent] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Create New Post</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Platform Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <div className="flex gap-2">
              {[
                { id: 'x', label: 'X' },
                { id: 'reddit', label: 'Reddit' },
                { id: 'linkedin', label: 'LinkedIn' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                    platform === p.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <PlatformIcon platform={p.id} size="sm" />
                  <span className="text-sm font-medium">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              placeholder="What do you want to share?"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>{content.length} characters</span>
              <span>{platform === 'x' ? `${280 - content.length} remaining` : ''}</span>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-between">
          <button className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <SparklesIcon className="w-4 h-4" />
            <span className="text-sm font-medium">AI Improve</span>
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
            >
              Save Draft
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all">
              Schedule Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ListIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function FilterIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
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

function SparklesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function ChevronDownIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
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

function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}