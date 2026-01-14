"use client";

import { useState } from "react";
import Link from "next/link";

export default function LinkedInPipelinePage() {
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);
  const [crossPostFromX, setCrossPostFromX] = useState(true);
  const [autoToneAdaptation, setAutoToneAdaptation] = useState(true);
  const [postsPerDay, setPostsPerDay] = useState(3);

  const [stats, setStats] = useState({
    postsToday: 1,
    postsThisWeek: 8,
    reach: '3.2k',
    engagement: '4.1%',
  });

  const [upcomingPosts, setUpcomingPosts] = useState([
    { id: 1, content: 'Milestone reached: 100 users on our platform. Here\'s what we learned building in public...', scheduledFor: '10:30 AM', status: 'pending', source: 'crosspost' },
    { id: 2, content: 'The best marketing strategy? Ship fast, learn faster. Here are our week 1 learnings from launching Distributo...', scheduledFor: '02:00 PM', status: 'scheduled', source: 'ai' },
  ]);

  const [crossPostPreview, setCrossPostPreview] = useState({
    original: 'Just shipped dark mode 🌙\n\n35 days building, finally done.\n\nSmall wins > no wins\n\n#buildinpublic',
    adapted: 'Excited to share: We just shipped dark mode for our dashboard.\n\nAfter 35 days of development, it\'s finally live. A reminder that small, consistent wins compound over time.\n\nWhat feature are you most proud of shipping recently?',
  });

  const [isConnected, setIsConnected] = useState(false);

  if (!isConnected) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <LinkedInIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">LinkedIn Pipeline</h1>
            <p className="text-gray-500">Auto cross-post from X with tone adaptation.</p>
          </div>
        </div>

        {/* Connect Card */}
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
              <LinkedInIcon className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect LinkedIn</h2>
            <p className="text-gray-500 mb-6">
              Connect your LinkedIn account to automatically cross-post your X content with professional tone adaptation.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                  <CrossPostIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm font-medium text-gray-900">Auto Cross-Post</div>
                <div className="text-xs text-gray-500 mt-1">Your X posts automatically converted for LinkedIn</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2">
                  <SparklesIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-sm font-medium text-gray-900">Tone Adaptation</div>
                <div className="text-xs text-gray-500 mt-1">AI transforms casual tweets into professional content</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <ClockIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-sm font-medium text-gray-900">Smart Scheduling</div>
                <div className="text-xs text-gray-500 mt-1">Post at optimal times for LinkedIn engagement</div>
              </div>
            </div>

            <button
              onClick={() => setIsConnected(true)}
              className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <LinkedInIcon className="w-5 h-5" />
              Connect LinkedIn Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
            <LinkedInIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">LinkedIn Pipeline</h1>
            <p className="text-gray-500">Manage your LinkedIn automation and performance.</p>
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
            <span>Denis M.</span>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
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
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+8%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.reach}</div>
          <div className="text-sm text-gray-500">Weekly Reach</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          {/* Cross-Post Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <CrossPostIcon className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Cross-Post Settings</h2>
            </div>

            <div className="space-y-6">
              {/* Cross-post from X */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Auto cross-post from X</label>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically convert your X posts for LinkedIn</p>
                </div>
                <button
                  onClick={() => setCrossPostFromX(!crossPostFromX)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    crossPostFromX ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    crossPostFromX ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Tone adaptation */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">AI Tone Adaptation</label>
                  <p className="text-xs text-gray-500 mt-0.5">Transform casual tweets into professional LinkedIn content</p>
                </div>
                <button
                  onClick={() => setAutoToneAdaptation(!autoToneAdaptation)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    autoToneAdaptation ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    autoToneAdaptation ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {/* Posts per day */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Posts per day</label>
                  <span className="text-sm font-bold text-gray-900">{postsPerDay}/5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={postsPerDay}
                  onChange={(e) => setPostsPerDay(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Tone Adaptation Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-6">
              <SparklesIcon className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Tone Adaptation Preview</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <XIcon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-600">X Original</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{crossPostPreview.original}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <LinkedInIcon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">LinkedIn Adapted</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{crossPostPreview.adapted}</p>
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
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <LinkedInIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          post.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {post.status === 'pending' ? 'Pending' : 'Scheduled'}
                        </span>
                        <span className="text-xs text-gray-500">{post.scheduledFor}</span>
                        {post.source === 'crosspost' && (
                          <span className="text-xs text-purple-600 flex items-center gap-1">
                            <CrossPostIcon className="w-3 h-3" />
                            From X
                          </span>
                        )}
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
                <span className="text-sm font-medium text-gray-900">67</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Avg. comments</span>
                <span className="text-sm font-medium text-gray-900">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Best day</span>
                <span className="text-sm font-medium text-gray-900">Tuesday</span>
              </div>
            </div>
          </div>

          {/* Connected Account */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Connected Account</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">D</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">Denis M.</div>
                <div className="text-xs text-gray-500">Connected</div>
              </div>
              <div className="ml-auto w-2 h-2 rounded-full bg-green-500" />
            </div>
          </div>

          {/* Cross-Post Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Cross-Post Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Posts from X</span>
                <span className="text-sm font-medium text-gray-900">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">AI adapted</span>
                <span className="text-sm font-medium text-gray-900">6</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Manual posts</span>
                <span className="text-sm font-medium text-gray-900">2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

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

function ClockIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CrossPostIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  );
}

function SparklesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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