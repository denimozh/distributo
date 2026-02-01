"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// GITHUB AUTOPILOT - POLISHED DASHBOARD
// ============================================================================
// Features:
// 1. Split-screen Drafting Table (Commit → AI Draft)
// 2. Shipping Streak Hero with circular progress
// 3. Tone Toggles (Dev-to-Dev vs Founder-to-Customer)
// 4. Weekly Recap Generator
// 5. Live Activity Feed (terminal style)
// 6. AI Story Potential tags on commits
// ============================================================================

export default function GitHubAutopilotPage() {
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);
  const [repos, setRepos] = useState([]);
  const [commits, setCommits] = useState([]);
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [generatedDraft, setGeneratedDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [streak, setStreak] = useState({ days: 0, postsGenerated: 0 });
  const [weeklyRecap, setWeeklyRecap] = useState(null);
  const [generatingRecap, setGeneratingRecap] = useState(false);
  const [tone, setTone] = useState("founder");
  const [autopilotEnabled, setAutopilotEnabled] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState("x");

  const supabase = createClient();
  const activityRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activityRef.current) {
      activityRef.current.scrollTop = activityRef.current.scrollHeight;
    }
  }, [activityLog]);

  const addActivity = (message, type = "info") => {
    const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setActivityLog((prev) => [...prev.slice(-9), { time, message, type }]);
  };

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: githubAccount } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", "github")
        .eq("is_active", true)
        .single();

      setAccount(githubAccount);

      if (githubAccount) {
        addActivity("Connected to GitHub as @" + githubAccount.platform_username, "success");

        // Query repos - try without is_active filter first to debug
        const { data: allReposData, error: reposError } = await supabase
          .from("github_repos")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        console.log("[GitHub] All repos for user:", allReposData, "Error:", reposError);
        
        // Filter to active repos
        const activeRepos = (allReposData || []).filter(r => r.is_active !== false);
        console.log("[GitHub] Active repos:", activeRepos);
        
        setRepos(activeRepos);

        if (activeRepos.length > 0) {
          addActivity("Tracking " + activeRepos.length + " repositories", "info");
        }

        const { data: commitsData } = await supabase
          .from("github_commits")
          .select("*, github_repos(repo_name)")
          .eq("user_id", user.id)
          .order("committed_at", { ascending: false })
          .limit(20);

        console.log("[GitHub] Loaded commits:", commitsData);

        setCommits(commitsData || []);
        
        if (commitsData && commitsData.length > 0) {
          addActivity("Loaded " + commitsData.length + " recent commits", "info");
        }

        // Calculate streak
        const commitDates = [...new Set((commitsData || []).map((c) => 
          new Date(c.committed_at).toDateString()
        ))];
        let days = 0;
        let checkDate = new Date();
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();

        if (commitDates.includes(today) || commitDates.includes(yesterday)) {
          while (commitDates.includes(checkDate.toDateString())) {
            days++;
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }

        const { count } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("source", "github")
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

        setStreak({ days, postsGenerated: count || 0 });
      }
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitClick = async (commit) => {
    setSelectedCommit(commit);
    setGenerating(true);
    setGeneratedDraft("");
    addActivity("Analyzing: \"" + commit.message.slice(0, 35) + "...\"", "info");

    try {
      const response = await fetch("/api/github/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitId: commit.id,
          commitMessage: commit.message,
          diffSummary: commit.diff_summary,
          additions: commit.additions,
          deletions: commit.deletions,
          filesChanged: commit.files_changed,
          repoName: commit.github_repos?.repo_name,
          tone,
          platform: selectedPlatform,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      console.log("[GitHub] Generated content:", data.content);
      if (data.content) {
        setGeneratedDraft(data.content);
        addActivity("Draft ready for " + (selectedPlatform === "x" ? "X" : "LinkedIn") + "!", "success");
      } else {
        throw new Error("No content returned from API");
      }
    } catch (error) {
      addActivity("Error: " + error.message, "error");
      setGeneratedDraft("// Failed to generate. Click to retry.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (selectedCommit) handleCommitClick(selectedCommit);
  };

  const handleShip = async () => {
    if (!generatedDraft || !selectedCommit) return;
    addActivity("Scheduling post to " + (selectedPlatform === "x" ? "X" : "LinkedIn") + "...", "info");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("posts").insert({
        user_id: user.id,
        content: generatedDraft,
        platform: selectedPlatform,
        status: "scheduled",
        scheduled_at: new Date().toISOString(),
        source: "github",
        source_commit: selectedCommit.sha,
      });

      await supabase.from("github_commits").update({ post_generated: true }).eq("id", selectedCommit.id);

      addActivity("✓ Post scheduled successfully!", "success");
      setGeneratedDraft("");
      setSelectedCommit(null);
      loadData();
    } catch (error) {
      addActivity("Failed to schedule: " + error.message, "error");
    }
  };

  const handleWeeklyRecap = async () => {
    setGeneratingRecap(true);
    addActivity("Generating weekly recap...", "info");

    try {
      const response = await fetch("/api/github/weekly-recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tone, platform: selectedPlatform }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setWeeklyRecap(data.content);
      addActivity("Weekly recap ready! " + data.commitCount + " commits summarized.", "success");
    } catch (error) {
      addActivity("Recap failed: " + error.message, "error");
    } finally {
      setGeneratingRecap(false);
    }
  };

  // Get story potential for commit
  const getStoryTag = (message) => {
    if (/^feat|^add|^implement|^create|^launch|^ship/i.test(message)) {
      return { label: "Feature", color: "bg-amber-100 text-amber-700", dot: "bg-amber-400" };
    }
    if (/^fix|^improve|^enhance|^update|^optimize/i.test(message)) {
      return { label: "Improve", color: "bg-blue-100 text-blue-700", dot: "bg-blue-400" };
    }
    if (/^refactor|^clean|^perf/i.test(message)) {
      return { label: "Refactor", color: "bg-purple-100 text-purple-700", dot: "bg-purple-400" };
    }
    if (/^chore|^docs|^typo|^merge|^bump/i.test(message)) {
      return { label: "Chore", color: "bg-gray-100 text-gray-600", dot: "bg-gray-300" };
    }
    return { label: "Update", color: "bg-green-100 text-green-700", dot: "bg-green-400" };
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "m ago";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "h ago";
    const days = Math.floor(hours / 24);
    return days + "d ago";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect GitHub</h2>
          <p className="text-gray-500 mb-6">Ship code → Ship content. Let your commits tell your story.</p>
          <button
            onClick={() => window.location.href = "/api/auth/github"}
            className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800"
          >
            Connect GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-6">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">GitHub Autopilot</h1>
              <p className="text-sm text-gray-500">Push code → Ship content</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutopilotEnabled(!autopilotEnabled)}
              className={"flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border " + 
                (autopilotEnabled 
                  ? "bg-green-50 text-green-700 border-green-200" 
                  : "bg-gray-50 text-gray-500 border-gray-200")}
            >
              <span className={"w-2 h-2 rounded-full " + (autopilotEnabled ? "bg-green-500 animate-pulse" : "bg-gray-400")}></span>
              {autopilotEnabled ? "Autopilot On" : "Autopilot Off"}
            </button>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl">
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">@{account.platform_username}</span>
            </div>
          </div>
        </div>

        {/* Main 3-Column Layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* ============================================
              LEFT COLUMN - Streak, Tone, Repos, Recap
              ============================================ */}
          <div className="col-span-3 space-y-5">
            
            {/* Shipping Streak Hero Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl border border-orange-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700">Shipping Streak</h3>
                <svg className={"w-5 h-5 " + (streak.days >= 3 ? "text-orange-500" : "text-gray-400")} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.5 1.5-4.5 3-6.5s3-4 3-6.5c0 0 1.5 2 2.5 4 .5-1.5 1-3 1-4.5 0 0 3 2.5 3 7 0 1-.5 2-1 3 1 0 2-1 2-2 0 0 1 1.5 1 3.5 0 3.866-3.134 7-7 7z"/>
                </svg>
              </div>

              {/* Circular Progress */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 -rotate-90">
                  <circle cx="64" cy="64" r="56" fill="none" stroke="#FED7AA" strokeWidth="8" />
                  <circle 
                    cx="64" cy="64" r="56" fill="none" 
                    stroke="url(#streakGrad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - Math.min(streak.days / 7, 1))}
                    style={{ transition: "stroke-dashoffset 0.5s ease" }}
                  />
                  <defs>
                    <linearGradient id="streakGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900">{streak.days}</span>
                  <span className="text-xs text-gray-500">days</span>
                </div>
              </div>

              <p className="text-center text-sm mb-4">
                {streak.days >= 7 ? (
                  <span className="text-orange-600 font-medium">🔥 Legendary streak!</span>
                ) : streak.days >= 3 ? (
                  <span className="text-orange-600">Don&apos;t break the chain!</span>
                ) : streak.days > 0 ? (
                  <span className="text-gray-600">Keep shipping!</span>
                ) : (
                  <span className="text-gray-500">Push code to start</span>
                )}
              </p>

              <div className="pt-4 border-t border-orange-200/50 flex justify-between text-sm">
                <span className="text-gray-600">Posts this week</span>
                <span className="font-semibold text-green-600">{streak.postsGenerated}</span>
              </div>
            </div>

            {/* Tone Toggle */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Content Tone</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setTone("dev")}
                  className={"w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all " +
                    (tone === "dev" 
                      ? "bg-purple-50 border-purple-300" 
                      : "bg-gray-50 border-transparent hover:bg-gray-100")}
                >
                  <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + (tone === "dev" ? "bg-purple-100" : "bg-gray-200")}>
                    <svg className={"w-4 h-4 " + (tone === "dev" ? "text-purple-600" : "text-gray-500")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className={"text-sm font-medium " + (tone === "dev" ? "text-purple-700" : "text-gray-700")}>Dev-to-Dev</div>
                    <div className="text-xs text-gray-500">Technical deep dives</div>
                  </div>
                </button>

                <button
                  onClick={() => setTone("founder")}
                  className={"w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all " +
                    (tone === "founder" 
                      ? "bg-blue-50 border-blue-300" 
                      : "bg-gray-50 border-transparent hover:bg-gray-100")}
                >
                  <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + (tone === "founder" ? "bg-blue-100" : "bg-gray-200")}>
                    <svg className={"w-4 h-4 " + (tone === "founder" ? "text-blue-600" : "text-gray-500")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className={"text-sm font-medium " + (tone === "founder" ? "text-blue-700" : "text-gray-700")}>Founder Mode</div>
                    <div className="text-xs text-gray-500">Feature announcements</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Repos */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700">Repositories</h3>
                <button 
                  onClick={() => window.location.href = "/dashboard/github/repos"}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>
              {repos.length === 0 ? (
                <div className="p-6 text-center">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
                  </svg>
                  <p className="text-sm text-gray-500 mb-3">No repos connected</p>
                  <button 
                    onClick={() => window.location.href = "/dashboard/github/repos"}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800"
                  >
                    + Link Repo
                  </button>
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto">
                  {repos.map((repo) => (
                    <div key={repo.id} className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
                      </svg>
                      <span className="text-sm text-gray-700 truncate">{repo.repo_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Weekly Recap Button */}
            <button
              onClick={handleWeeklyRecap}
              disabled={generatingRecap || commits.length === 0}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generatingRecap ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              )}
              Generate Weekly Recap
            </button>
          </div>

          {/* ============================================
              CENTER - DRAFTING TABLE (Split View)
              ============================================ */}
          <div className="col-span-6">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
              
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">Commit → Story</h2>
                    <p className="text-xs text-gray-500">Click a commit to auto-generate a post</p>
                  </div>
                </div>

                {/* Platform Toggle */}
                <div className="flex p-1 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => setSelectedPlatform("x")}
                    className={"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition " +
                      (selectedPlatform === "x" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X
                  </button>
                  <button
                    onClick={() => setSelectedPlatform("linkedin")}
                    className={"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition " +
                      (selectedPlatform === "linkedin" ? "bg-[#0A66C2] text-white" : "text-gray-500")}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </button>
                </div>
              </div>

              {/* Split View */}
              <div className="flex-1 grid grid-cols-2 divide-x divide-gray-100 min-h-[400px]">
                
                {/* LEFT: Raw Commit */}
                <div className="p-5 bg-gray-50/50 flex flex-col">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Raw Commit</div>
                  
                  {selectedCommit ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/>
                          </svg>
                          <code className="font-mono">{selectedCommit.sha?.slice(0, 7)}</code>
                          <span>•</span>
                          <span>{getTimeAgo(selectedCommit.committed_at)}</span>
                        </div>
                        <p className="text-sm text-gray-900 font-medium">{selectedCommit.message}</p>
                        {selectedCommit.github_repos?.repo_name && (
                          <p className="text-xs text-gray-500 mt-2">{selectedCommit.github_repos.repo_name}</p>
                        )}
                      </div>

                      {/* Diff Summary */}
                      {(selectedCommit.additions > 0 || selectedCommit.deletions > 0) && (
                        <div className="p-4 bg-white rounded-xl border border-gray-200">
                          <div className="text-xs font-medium text-gray-600 mb-2">Changes</div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex mb-2">
                            <div className="bg-green-500 h-full" style={{ width: (selectedCommit.additions / (selectedCommit.additions + selectedCommit.deletions + 1) * 100) + "%" }}></div>
                            <div className="bg-red-500 h-full" style={{ width: (selectedCommit.deletions / (selectedCommit.additions + selectedCommit.deletions + 1) * 100) + "%" }}></div>
                          </div>
                          <div className="flex gap-4 text-xs">
                            <span className="text-green-600 font-medium">+{selectedCommit.additions}</span>
                            <span className="text-red-600 font-medium">-{selectedCommit.deletions}</span>
                            <span className="text-gray-500">{selectedCommit.files_changed || 0} files</span>
                          </div>
                        </div>
                      )}

                      {/* File List */}
                      {selectedCommit.diff_summary?.files?.length > 0 && (
                        <div className="p-4 bg-white rounded-xl border border-gray-200">
                          <div className="text-xs font-medium text-gray-600 mb-2">Files</div>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {selectedCommit.diff_summary.files.slice(0, 5).map((f, i) => (
                              <div key={i} className="text-xs text-gray-600 font-mono truncate flex items-center gap-1">
                                <svg className="w-3 h-3 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
                                </svg>
                                {f.filename || f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/>
                        </svg>
                        <p className="text-sm">Select a commit</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: AI Draft */}
                <div className="p-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Draft</div>
                    <span className={"px-2 py-0.5 rounded text-xs font-medium " + (tone === "dev" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                      {tone === "dev" ? "Dev Mode" : "Founder Mode"}
                    </span>
                  </div>

                  {generating ? (
                    <div className="flex-1 flex items-center justify-center min-h-[250px]">
                      <div className="space-y-3 w-full animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ) : generatedDraft && generatedDraft.length > 0 ? (
                    <div className="flex-1 flex flex-col min-h-[250px]">
                      <textarea
                        value={generatedDraft}
                        onChange={(e) => setGeneratedDraft(e.target.value)}
                        className="flex-1 w-full min-h-[200px] p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
                      />
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <span className={"text-xs " + (generatedDraft.length > (selectedPlatform === "x" ? 280 : 3000) ? "text-red-500" : "text-gray-500")}>
                            {generatedDraft.length}/{selectedPlatform === "x" ? 280 : 3000}
                          </span>
                          <button onClick={handleRegenerate} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                            </svg>
                            Regenerate
                          </button>
                        </div>
                        <button
                          onClick={handleShip}
                          className={"flex items-center gap-2 px-4 py-2 font-medium rounded-lg " +
                            (selectedPlatform === "x" 
                              ? "bg-gray-900 text-white hover:bg-gray-800" 
                              : "bg-[#0A66C2] text-white hover:bg-[#004182]")}
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                          Ship to {selectedPlatform === "x" ? "X" : "LinkedIn"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                      <div className="text-center text-gray-400">
                        <svg className="w-10 h-10 mx-auto mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M12 3L14.5 8.5L20 11L14.5 13.5L12 19L9.5 13.5L4 11L9.5 8.5L12 3Z"/>
                        </svg>
                        <p className="text-sm">Click a commit to generate</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================
              RIGHT COLUMN - Commits & Activity Feed
              ============================================ */}
          <div className="col-span-3 space-y-5">
            
            {/* Commits List */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700">Recent Commits</h3>
                <button onClick={loadData} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                </button>
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {commits.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="4"/><line x1="1.05" y1="12" x2="7" y2="12"/><line x1="17.01" y1="12" x2="22.96" y2="12"/>
                    </svg>
                    <p className="text-sm">No commits yet</p>
                  </div>
                ) : (
                  commits.map((commit) => {
                    const tag = getStoryTag(commit.message);
                    const isSelected = selectedCommit?.id === commit.id;
                    return (
                      <button
                        key={commit.id}
                        onClick={() => handleCommitClick(commit)}
                        className={"w-full px-4 py-3 text-left border-b border-gray-50 last:border-0 transition-all " +
                          (isSelected ? "bg-green-50 border-l-2 border-l-green-500" : "hover:bg-gray-50")}
                      >
                        <div className="flex items-start gap-2">
                          <div className={"w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 " + tag.dot}></div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-800 font-medium truncate">{commit.message}</p>
                              {commit.post_generated && (
                                <svg className="w-3 h-3 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={"text-[10px] font-medium px-1.5 py-0.5 rounded " + tag.color}>{tag.label}</span>
                              <span className="text-xs text-gray-400">{getTimeAgo(commit.committed_at)}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <h3 className="text-sm font-semibold text-gray-700">Activity</h3>
              </div>
              <div ref={activityRef} className="h-[180px] overflow-y-auto p-3 bg-gray-900 font-mono text-xs">
                {activityLog.length === 0 ? (
                  <div className="text-gray-600 text-center py-8">$ waiting for activity...</div>
                ) : (
                  activityLog.map((item, i) => (
                    <div key={i} className={"flex gap-2 mb-1 " + 
                      (item.type === "success" ? "text-green-400" : item.type === "error" ? "text-red-400" : "text-gray-500")}>
                      <span className="text-gray-600 flex-shrink-0">[{item.time}]</span>
                      <span>{item.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Recap Modal */}
        {weeklyRecap && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">Weekly Recap</h3>
                  <p className="text-xs text-gray-500">Your week of shipping, summarized</p>
                </div>
                <button onClick={() => setWeeklyRecap(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">✕</button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <textarea
                  value={weeklyRecap}
                  onChange={(e) => setWeeklyRecap(e.target.value)}
                  className="w-full h-full min-h-[300px] p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">{weeklyRecap.length} chars</span>
                <div className="flex gap-3">
                  <button onClick={() => setWeeklyRecap(null)} className="px-4 py-2 text-gray-600">Cancel</button>
                  <button 
                    onClick={() => { handleShip(); setWeeklyRecap(null); }}
                    className="px-4 py-2 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                  >
                    Ship to {selectedPlatform === "x" ? "X" : "LinkedIn"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}