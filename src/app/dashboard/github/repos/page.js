"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// ============================================================================
// GITHUB REPO SELECTOR
// ============================================================================
// Allows users to browse their GitHub repos and select which ones to connect
// for autopilot content generation.

export default function RepoSelectorPage() {
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState([]);
  const [connectedRepos, setConnectedRepos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Get already connected repos (only active ones)
      const { data: connected } = await supabase
        .from("github_repos")
        .select("repo_id, repo_full_name, is_active")
        .eq("user_id", user.id);

      // Filter to only active ones for display
      setConnectedRepos((connected || []).filter(r => r.is_active));

      // Fetch available repos from GitHub
      const response = await fetch("/api/github/repos");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch repositories");
      }

      setRepos(data.repos || []);
    } catch (err) {
      console.error("Load error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (repo) => {
    try {
      setConnecting(repo.id);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // First check if repo already exists (might be deactivated)
      const { data: existingRepo } = await supabase
        .from("github_repos")
        .select("id, is_active")
        .eq("user_id", user.id)
        .eq("repo_id", repo.id)
        .single();

      if (existingRepo) {
        // Reactivate existing repo
        const { error: updateError } = await supabase
          .from("github_repos")
          .update({ is_active: true })
          .eq("id", existingRepo.id);

        if (updateError) throw updateError;
      } else {
        // Create new repo entry
        const response = await fetch("/api/github/repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            githubRepoId: repo.id,
            repoFullName: repo.full_name,
            repoName: repo.name,
            repoDescription: repo.description,
            isPrivate: repo.private,
          }),
        });

        const data = await response.json();

        // If "already connected" error, try to reactivate
        if (!response.ok) {
          if (data.error?.includes("already")) {
            // Reactivate by full_name
            await supabase
              .from("github_repos")
              .update({ is_active: true })
              .eq("user_id", user.id)
              .eq("repo_full_name", repo.full_name);
          } else {
            throw new Error(data.error || "Failed to connect repository");
          }
        }
      }

      // Update local state
      setConnectedRepos((prev) => [...prev, { repo_id: repo.id, repo_full_name: repo.full_name }]);
      
    } catch (err) {
      console.error("Connect error:", err);
      setError(err.message);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (repo) => {
    try {
      setConnecting(repo.id);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("github_repos")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("repo_id", repo.id);

      if (error) throw error;

      // Remove from local state
      setConnectedRepos((prev) => prev.filter((r) => r.repo_id !== repo.id));
    } catch (err) {
      console.error("Disconnect error:", err);
      setError(err.message);
    } finally {
      setConnecting(null);
    }
  };

  const isConnected = (repoId) => {
    return connectedRepos.some((r) => r.repo_id === repoId);
  };

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading repositories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBFC] p-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/github")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Autopilot
          </button>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Connect Repositories</h1>
              <p className="text-sm text-gray-500">Select repos to enable autopilot content generation</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400"
            />
          </div>
        </div>

        {/* Connected Count */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {connectedRepos.length} of {repos.length} repositories connected
          </span>
          <button
            onClick={() => router.push("/dashboard/github")}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Done →
          </button>
        </div>

        {/* Repos List */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {filteredRepos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? "No repositories match your search" : "No repositories found"}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredRepos.map((repo) => {
                const connected = isConnected(repo.id);
                const isLoading = connecting === repo.id;

                return (
                  <div
                    key={repo.id}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={"w-10 h-10 rounded-xl flex items-center justify-center " + 
                        (repo.private ? "bg-amber-100" : "bg-gray-100")}>
                        {repo.private ? (
                          <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="6" y1="3" x2="6" y2="15" />
                            <circle cx="18" cy="6" r="3" />
                            <circle cx="6" cy="18" r="3" />
                            <path d="M18 9a9 9 0 0 1-9 9" />
                          </svg>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{repo.full_name}</p>
                          {repo.private && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                              Private
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{repo.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          {repo.language && <span>{repo.language}</span>}
                          {repo.stargazers_count > 0 && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              {repo.stargazers_count}
                            </span>
                          )}
                          {repo.updated_at && (
                            <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => connected ? handleDisconnect(repo) : handleConnect(repo)}
                      disabled={isLoading}
                      className={"flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all " +
                        (connected
                          ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                          : "bg-gray-900 text-white hover:bg-gray-800")}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      ) : connected ? (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Connected
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Connect
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">What happens when you connect a repo?</p>
              <ul className="space-y-1 text-blue-600">
                <li>• We&apos;ll set up a webhook to detect new commits</li>
                <li>• Your recent commits will be synced automatically</li>
                <li>• AI will generate &quot;build in public&quot; posts from your code</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}