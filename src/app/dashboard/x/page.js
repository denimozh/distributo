"use client";

import { useState } from "react";
import Link from "next/link";

export default function XPipelinePage() {
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [postsPerDay, setPostsPerDay] = useState(5);
  const [timeWindowStart, setTimeWindowStart] = useState('09:00');
  const [timeWindowEnd, setTimeWindowEnd] = useState('20:00');

  const [stats, setStats] = useState({
    postsToday: 2,
    postsThisWeek: 18,
    reach: '12.4k',
    engagement: '3.2%',
  });

  const [upcomingPosts, setUpcomingPosts] = useState([
    { id: 1, content: 'Just shipped dark mode for the dashboard. Sometimes the small wins feel the biggest...', scheduledFor: '09:00 AM', status: 'pending' },
    { id: 2, content: 'Building in public Day 45: The GitHub autopilot is generating better content than I expected...', scheduledFor: '12:00 PM', status: 'scheduled' },
    { id: 3, content: 'Quick tip: If you\'re building a SaaS, automate your marketing from day 1.', scheduledFor: '05:00 PM', status: 'scheduled' },
  ]);

  const [communities, setCommunities] = useState([
    { id: 1, name: 'Build in Public', members: '45k', selected: true },
    { id: 2, name: 'Indie Hackers', members: '120k', selected: false },
    { id: 3, name: 'SaaS Founders', members: '32k', selected: false },
  ]);

  const [replyOpportunities, setReplyOpportunities] = useState([
    { id: 1, author: '@levelsio', content: 'What tools are you using to automate your marketing?', relevance: 94 },
    { id: 2, author: '@tdinh_me', content: 'Building in public is great but coming up with content daily is exhausting...', relevance: 85 },
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center">
            <XIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">X / Twitter Pipeline</h1>
            <p className="text-gray-500">Manage your X automation and performance.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${autopilotEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">
              {autopilotEnabled ? 'Autopilot ON' : 'Autopilot OFF'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>@denimozh_uk</span>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center">
              <BoltIcon className="w-5 h-5 text-white" />
            </div>
            <button
              onClick={() => setAutopilotEnabled(!autopilotEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autopilotEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                autopilotEnabled ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {autopilotEnabled ? 'ON' : 'OFF'}
          </div>
          <div className="text-sm text-gray-500">Autopilot</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Today</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.postsToday}/{postsPerDay}</div>
          <div className="text-sm text-gray-500">Posts Today</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <ChartIcon className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Week</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.postsThisWeek}</div>
          <div className="text-sm text-gray-500">Posts This Week</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <TrendingUpIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.reach}</div>
          <div className="text-sm text-gray-500">Weekly Reach</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          {/* Automation Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Automation Settings</h2>
            </div>

            <div className="space-y-6">
              {/* Posts per day */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Posts per day</label>
                  <span className="text-sm font-bold text-gray-900">{postsPerDay}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={postsPerDay}
                  onChange={(e) => setPostsPerDay(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Time window */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Posting time window</label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={timeWindowStart}
                    onChange={(e) => setTimeWindowStart(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="time"
                    value={timeWindowEnd}
                    onChange={(e) => setTimeWindowEnd(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Auto-approve */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto-approve posts</label>
                  <p className="text-xs text-gray-500 mt-0.5">Posts will be published without manual review</p>
                </div>
                <button
                  onClick={() => setAutoApprove(!autoApprove)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    autoApprove ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    autoApprove ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Communities */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Post to communities</label>
                <div className="flex flex-wrap gap-2">
                  {communities.map((community) => (
                    <button
                      key={community.id}
                      onClick={() => setCommunities(communities.map(c => 
                        c.id === community.id ? { ...c, selected: !c.selected } : c
                      ))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        community.selected
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {community.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Posts */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Upcoming (Next 24h)</h2>
              </div>
              <Link href="/dashboard/queue" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingPosts.map((post) => (
                <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center flex-shrink-0">
                      <XIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          post.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {post.status === 'pending' ? 'Pending' : 'Scheduled'}
                        </span>
                        <span className="text-xs text-gray-500">{post.scheduledFor}</span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Performance</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Engagement rate</span>
                <span className="text-sm font-medium text-gray-900">{stats.engagement}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Avg. likes</span>
                <span className="text-sm font-medium text-gray-900">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Avg. replies</span>
                <span className="text-sm font-medium text-gray-900">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Best time</span>
                <span className="text-sm font-medium text-gray-900">9 AM, 5 PM</span>
              </div>
            </div>
          </div>

          {/* Reply Opportunities */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Reply Opportunities</h3>
              <Link href="/dashboard/reply-finder" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {replyOpportunities.map((opp) => (
                <div key={opp.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{opp.author}</span>
                    <span className="text-xs text-green-600 font-medium">{opp.relevance}%</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{opp.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Account */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Connected Account</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">D</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">@denimozh_uk</div>
                <div className="text-xs text-gray-500">Connected</div>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function XIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function BoltIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ChartIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function TrendingUpIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PencilIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}