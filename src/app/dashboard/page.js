"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState('');
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);
  const [stats, setStats] = useState({
    postsToday: 3,
    postsLimit: 10,
    queueCount: 12,
    weeklyPosts: 47,
    weeklyReach: '12.4k'
  });
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 1, platform: 'x', content: 'Just shipped dark mode for the dashboard. Sometimes the small wins feel the biggest...', scheduledFor: '9:00 AM', source: 'ai' },
    { id: 2, platform: 'linkedin', content: 'Milestone reached: 100 users on our platform. Here\'s what we learned building in public...', scheduledFor: '10:30 AM', source: 'ai' },
    { id: 3, platform: 'x', content: 'Building in public Day 45: The GitHub autopilot is generating better content than I expected...', scheduledFor: '2:00 PM', source: 'github' },
  ]);
  const [replyOpportunities, setReplyOpportunities] = useState([
    { id: 1, platform: 'x', author: '@levelsio', content: 'What tools are you using to automate your marketing?', relevance: 94, engagement: '1.2k' },
    { id: 2, platform: 'reddit', subreddit: 'r/SaaS', content: 'How do you handle content distribution as a solo founder?', relevance: 87, engagement: '234' },
    { id: 3, platform: 'linkedin', author: 'Marc Louvion', content: 'Founder burnout is real. What systems have helped you stay consistent?', relevance: 82, engagement: '567' },
  ]);
  const [setupIncomplete, setSetupIncomplete] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Check if onboarding is complete and get user name
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, product_name, product_description')
          .eq('id', user.id)
          .single();
        
        // Get name from profile first, then user metadata, then email
        const name = profile?.full_name || 
                     user?.user_metadata?.full_name || 
                     user?.user_metadata?.name ||
                     user?.email?.split('@')[0] ||
                     '';
        setUserName(name.split(' ')[0]); // First name only
        
        if (!profile?.product_name || !profile?.product_description) {
          setSetupIncomplete(true);
        }
      }
    };
    getUser();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleApprove = (id) => {
    setPendingApprovals(prev => prev.filter(item => item.id !== id));
  };

  const handleReject = (id) => {
    setPendingApprovals(prev => prev.filter(item => item.id !== id));
  };

  const handleApproveAll = () => {
    setPendingApprovals([]);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getGreeting()}{userName ? `, ${userName}` : ''}
          </h1>
          <p className="text-gray-500 mt-1">Here's your automation status for today.</p>
        </div>
      </div>

      {/* Setup Incomplete Banner */}
      {setupIncomplete && (
        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900">Complete your setup</p>
              <p className="text-sm text-amber-700">Add your product details so we can generate better content for you.</p>
            </div>
          </div>
          <Link
            href="/onboarding"
            className="px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors"
          >
            Complete Setup
          </Link>
        </div>
      )}

      {/* Automation Status Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <BoltIcon className="w-6 h-6 text-white" />
            </div>
            <button
              onClick={() => setAutopilotEnabled(!autopilotEnabled)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                autopilotEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                autopilotEnabled ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {autopilotEnabled ? 'ON' : 'OFF'}
          </div>
          <div className="text-sm text-gray-500 mt-1">Autopilot</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">Today</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.postsToday}/{stats.postsLimit}
          </div>
          <div className="text-sm text-gray-500 mt-1">Posts Today</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <QueueIcon className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg">Queued</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.queueCount}</div>
          <div className="text-sm text-gray-500 mt-1">In Queue</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
              <TrendingUpIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">+12%</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{stats.weeklyReach}</div>
          <div className="text-sm text-gray-500 mt-1">Weekly Reach</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-8">
        {/* Main Content - 2 columns */}
        <div className="col-span-2 space-y-6">
          {/* Pending Approvals */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <InboxIcon className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Pending Approval</h2>
                {pendingApprovals.length > 0 && (
                  <span className="px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-lg">
                    {pendingApprovals.length}
                  </span>
                )}
              </div>
              {pendingApprovals.length > 0 && (
                <button
                  onClick={handleApproveAll}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Approve All
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {pendingApprovals.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-7 h-7 text-green-500" />
                  </div>
                  <p className="text-gray-500">All caught up! No pending approvals.</p>
                </div>
              ) : (
                pendingApprovals.map((item) => (
                  <div key={item.id} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        item.platform === 'x' ? 'bg-gray-900' :
                        item.platform === 'linkedin' ? 'bg-blue-600' :
                        'bg-orange-500'
                      }`}>
                        {item.platform === 'x' && <XIcon className="w-5 h-5 text-white" />}
                        {item.platform === 'linkedin' && <LinkedInIcon className="w-5 h-5 text-white" />}
                        {item.platform === 'reddit' && <RedditIcon className="w-5 h-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase">
                            {item.platform}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{item.scheduledFor}</span>
                          {item.source === 'github' && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-purple-600 font-medium flex items-center gap-1">
                                <GitHubIcon className="w-3.5 h-3.5" />
                                From commit
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{item.content}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="p-2.5 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                          title="Approve"
                        >
                          <CheckIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Reject"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                        <button
                          className="p-2.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pipeline Health */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-5">
              <ActivityIcon className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Pipeline Health</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Link href="/dashboard/x" className="p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center">
                    <XIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-xs text-green-600 font-semibold">Active</span>
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-900">X / Twitter</div>
                <div className="text-sm text-gray-500 mt-1">23 posts/week</div>
                <div className="text-xs text-gray-400 mt-1">12.4k reach</div>
              </Link>

              <Link href="/dashboard/linkedin" className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <LinkedInIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs text-green-600 font-medium">Active</span>
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-900">LinkedIn</div>
                <div className="text-sm text-gray-500 mt-1">8 posts/week</div>
                <div className="text-xs text-gray-400 mt-1">3.2k reach</div>
              </Link>

              <Link href="/dashboard/reddit" className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all opacity-60">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
                    <RedditIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">Soon</span>
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-900">Reddit</div>
                <div className="text-sm text-gray-500 mt-1">Coming soon</div>
                <div className="text-xs text-gray-400 mt-1">—</div>
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Reply Opportunities */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChatBubbleIcon className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Reply Opportunities</h2>
              </div>
              <Link href="/dashboard/reply-finder" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {replyOpportunities.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                      item.platform === 'x' ? 'bg-gray-900' :
                      item.platform === 'linkedin' ? 'bg-blue-600' :
                      'bg-orange-500'
                    }`}>
                      {item.platform === 'x' && <XIcon className="w-3 h-3 text-white" />}
                      {item.platform === 'linkedin' && <LinkedInIcon className="w-3 h-3 text-white" />}
                      {item.platform === 'reddit' && <RedditIcon className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">
                          {item.author || item.subreddit}
                        </span>
                        <span className="text-xs text-green-600 font-medium">{item.relevance}%</span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{item.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GitHub Activity */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitHubIcon className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">GitHub Autopilot</h2>
              </div>
              <Link href="/dashboard/github" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Settings
              </Link>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Auto-posting</span>
                </div>
                <span className="text-sm font-medium text-gray-900">OFF</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Commits tracked</span>
                  <span className="font-medium text-gray-900">24</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Posts generated</span>
                  <span className="font-medium text-gray-900">8</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Conversion rate</span>
                  <span className="font-medium text-gray-900">33%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icons
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

function QueueIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
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

function InboxIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XMarkIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

function ActivityIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function ChatBubbleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function AlertIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
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

function LinkedInIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function RedditIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );
}

function GitHubIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}