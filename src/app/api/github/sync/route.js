import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Manually sync commits for a repo
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId');

    if (!repoId) {
      return NextResponse.json({ error: 'Repository ID required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get repo info
    const { data: repo, error: repoError } = await supabaseAdmin
      .from('github_repos')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', user.id)
      .single();

    if (repoError || !repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
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

    // Get existing commits to avoid duplicates
    const { data: existingCommits } = await supabaseAdmin
      .from('github_commits')
      .select('sha')
      .eq('repo_id', repoId);

    const existingShas = new Set(existingCommits?.map(c => c.sha) || []);

    // Fetch commits from GitHub API (last 50)
    const response = await fetch(
      `https://api.github.com/repos/${repo.repo_full_name}/commits?per_page=50`,
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

    // Insert new commits
    let newCommits = 0;
    let skippedCommits = 0;

    for (const commit of commits) {
      // Skip if already exists
      if (existingShas.has(commit.sha)) {
        continue;
      }

      const message = commit.commit.message;

      // Check if should skip (boring commits)
      const shouldSkip = shouldSkipCommit(message);

      // Fetch commit details for additions/deletions (only for non-skipped)
      let additions = 0;
      let deletions = 0;
      let filesChanged = 0;
      let diffSummary = null;

      if (!shouldSkip) {
        try {
          const detailResponse = await fetch(
            `https://api.github.com/repos/${repo.repo_full_name}/commits/${commit.sha}`,
            {
              headers: {
                'Authorization': `Bearer ${account.access_token}`,
                'Accept': 'application/vnd.github.v3+json',
              },
            }
          );

          if (detailResponse.ok) {
            const detail = await detailResponse.json();
            additions = detail.stats?.additions || 0;
            deletions = detail.stats?.deletions || 0;
            filesChanged = detail.files?.length || 0;
            diffSummary = processDiffForStorage(detail);
          }
        } catch (e) {
          console.error('Failed to fetch commit details:', e);
        }
      }

      // Insert commit
      const { error: insertError } = await supabaseAdmin
        .from('github_commits')
        .insert({
          user_id: user.id,
          repo_id: repoId,
          sha: commit.sha,
          message: message.split('\n')[0], // First line only
          author_name: commit.commit.author.name,
          author_email: commit.commit.author.email,
          committed_at: commit.commit.author.date,
          url: commit.html_url,
          additions,
          deletions,
          files_changed: filesChanged,
          diff_summary: diffSummary,
          skipped: shouldSkip,
          skip_reason: shouldSkip ? 'boring_commit' : null,
        });

      if (!insertError) {
        if (shouldSkip) {
          skippedCommits++;
        } else {
          newCommits++;
        }
      }
    }

    // Update repo commit count
    const { data: countData } = await supabaseAdmin
      .from('github_commits')
      .select('id', { count: 'exact' })
      .eq('repo_id', repoId)
      .eq('skipped', false);

    await supabaseAdmin
      .from('github_repos')
      .update({ 
        commit_count: countData?.length || 0,
        last_synced_at: new Date().toISOString(),
      })
      .eq('id', repoId);

    return NextResponse.json({
      success: true,
      newCommits,
      skippedCommits,
      totalFetched: commits.length,
      alreadyExisted: commits.length - newCommits - skippedCommits,
    });

  } catch (err) {
    console.error('[SYNC] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Helper: Check if commit should be skipped
function shouldSkipCommit(message) {
  const lowerMessage = message.toLowerCase();
  
  const skipPatterns = [
    /^merge/i,
    /^bump/i,
    /^update.*dependencies/i,
    /^update.*lock/i,
    /^chore\(deps\)/i,
    /^wip$/i,
    /^typo/i,
    /^lint$/i,
    /^format$/i,
  ];
  
  return skipPatterns.some(pattern => pattern.test(message));
}

// Process diff for storage (lightweight version)
function processDiffForStorage(commitData) {
  const files = commitData.files || [];
  
  const ignorePatterns = [
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    '.gitignore', '.env', '.DS_Store',
  ];

  const relevantFiles = files.filter(file => {
    const filename = file.filename.toLowerCase();
    return !ignorePatterns.some(pattern => filename.includes(pattern.toLowerCase()));
  });

  // Categorize
  const hasUI = relevantFiles.some(f => 
    f.filename.includes('component') || 
    f.filename.includes('.jsx') ||
    f.filename.includes('.tsx')
  );
  const hasAPI = relevantFiles.some(f => 
    f.filename.includes('/api/') || 
    f.filename.includes('route.')
  );
  const hasDatabase = relevantFiles.some(f =>
    f.filename.includes('migration') ||
    f.filename.includes('schema') ||
    f.filename.includes('.sql')
  );

  return {
    totalFiles: relevantFiles.length,
    totalAdditions: commitData.stats?.additions || 0,
    totalDeletions: commitData.stats?.deletions || 0,
    mainArea: hasUI ? 'ui' : hasAPI ? 'api' : hasDatabase ? 'database' : 'code',
    files: relevantFiles.slice(0, 5).map(f => f.filename),
  };
}