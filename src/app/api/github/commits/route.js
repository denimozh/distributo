import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fetch commits for a specific repo
export async function POST(request) {
  try {
    const { repoId, repoFullName } = await request.json();

    if (!repoFullName) {
      return NextResponse.json({ error: 'Repository name required' }, { status: 400 });
    }

    // Get user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get GitHub access token
    const { data: account } = await supabaseAdmin
      .from('connected_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'github')
      .eq('is_active', true)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    // Fetch recent commits from GitHub API
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/commits?per_page=20`,
      {
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch commits');
    }

    const commits = await response.json();
    console.log(`[COMMITS] Fetched ${commits.length} commits from ${repoFullName}`);

    // Get the repo ID from database if not provided
    let dbRepoId = repoId;
    if (!dbRepoId) {
      const { data: repo } = await supabaseAdmin
        .from('github_repos')
        .select('id')
        .eq('user_id', user.id)
        .eq('repo_full_name', repoFullName)
        .single();
      dbRepoId = repo?.id;
    }

    if (!dbRepoId) {
      return NextResponse.json({ error: 'Repository not found in database' }, { status: 404 });
    }

    // Insert commits (upsert to avoid duplicates)
    const commitsToInsert = commits.map(commit => ({
      user_id: user.id,
      repo_id: dbRepoId,
      sha: commit.sha,
      message: commit.commit.message.split('\n')[0], // First line only
      author_name: commit.commit.author.name,
      author_email: commit.commit.author.email,
      committed_at: commit.commit.author.date,
      url: commit.html_url,
      additions: commit.stats?.additions || 0,
      deletions: commit.stats?.deletions || 0,
      files_changed: commit.files?.length || 0,
    }));

    // Insert commits one by one to handle duplicates gracefully
    let insertedCount = 0;
    for (const commit of commitsToInsert) {
      const { error } = await supabaseAdmin
        .from('github_commits')
        .upsert(commit, { 
          onConflict: 'sha',
          ignoreDuplicates: true 
        });
      
      if (!error) insertedCount++;
    }

    // Update repo commits count
    await supabaseAdmin
      .from('github_repos')
      .update({ 
        commits_count: commits.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', dbRepoId);

    return NextResponse.json({ 
      success: true, 
      fetched: commits.length,
      inserted: insertedCount,
      commits: commitsToInsert.slice(0, 10) // Return first 10 for preview
    });

  } catch (err) {
    console.error('Error fetching commits:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Get commits for user
export async function GET(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: commits, error } = await supabaseAdmin
      .from('github_commits')
      .select('*, github_repos(repo_name, repo_full_name)')
      .eq('user_id', user.id)
      .order('committed_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ commits: commits || [] });

  } catch (err) {
    console.error('Error getting commits:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}