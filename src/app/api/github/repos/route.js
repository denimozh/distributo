import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get available repos from GitHub
export async function GET(request) {
  try {
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

    // Fetch repos from GitHub API (with pagination)
    let allRepos = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 5) { // Max 5 pages (500 repos)
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`,
        {
          headers: {
            'Authorization': `Bearer ${account.access_token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch repos');
      }

      const repos = await response.json();
      allRepos = [...allRepos, ...repos];
      
      hasMore = repos.length === 100;
      page++;
    }

    // Get already connected repos
    const { data: connectedRepos } = await supabaseAdmin
      .from('github_repos')
      .select('repo_full_name')
      .eq('user_id', user.id);

    const connectedNames = new Set(connectedRepos?.map(r => r.repo_full_name) || []);

    // Format repos for frontend
    const formattedRepos = allRepos.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      updated_at: repo.updated_at,
      connected: connectedNames.has(repo.full_name),
    }));

    return NextResponse.json({ 
      repos: formattedRepos,
      total: formattedRepos.length,
    });

  } catch (err) {
    console.error('Error fetching repos:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Add a new repo with auto-webhook setup and initial commit sync
export async function POST(request) {
  try {
    const { repoFullName, repoName, repoDescription, isPrivate, repoId: githubRepoId } = await request.json();

    if (!repoFullName) {
      return NextResponse.json({ error: 'Repository name required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if repo already exists
    const { data: existingRepo } = await supabaseAdmin
      .from('github_repos')
      .select('id')
      .eq('user_id', user.id)
      .eq('repo_full_name', repoFullName)
      .single();

    if (existingRepo) {
      return NextResponse.json({ error: 'Repository already connected' }, { status: 400 });
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

    // Create repo in database
    const { data: newRepo, error: insertError } = await supabaseAdmin
      .from('github_repos')
      .insert({
        user_id: user.id,
        repo_id: githubRepoId,
        repo_name: repoName || repoFullName.split('/')[1],
        repo_full_name: repoFullName,
        repo_description: repoDescription,
        is_private: isPrivate,
        is_active: true,
        commit_count: 0,
        post_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(insertError.message);
    }

    // Auto-setup webhook (Level 1 quick win)
    let webhookSetup = false;
    let webhookError = null;

    try {
      const webhookSecret = crypto.randomBytes(32).toString('hex');
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/github/webhook`;

      const webhookResponse = await fetch(`https://api.github.com/repos/${repoFullName}/hooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'web',
          active: true,
          events: ['push', 'release', 'pull_request', 'issues'],
          config: {
            url: webhookUrl,
            content_type: 'json',
            secret: webhookSecret,
            insecure_ssl: '0',
          },
        }),
      });

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        
        await supabaseAdmin
          .from('github_repos')
          .update({
            webhook_id: webhookData.id,
            webhook_secret: webhookSecret,
            webhook_active: true,
            webhook_events: ['push', 'release', 'pull_request', 'issues'],
          })
          .eq('id', newRepo.id);

        webhookSetup = true;
        console.log(`[REPOS] Auto-created webhook for ${repoFullName}`);
      } else {
        const error = await webhookResponse.json();
        if (error.errors?.some(e => e.message?.includes('already exists'))) {
          webhookSetup = true; // Already exists is fine
          console.log(`[REPOS] Webhook already exists for ${repoFullName}`);
        } else {
          webhookError = error.message;
          console.error('[REPOS] Webhook setup failed:', error);
        }
      }
    } catch (webhookErr) {
      webhookError = webhookErr.message;
      console.error('[REPOS] Webhook setup error:', webhookErr);
    }

    // Auto-sync last 10 commits (Level 2 feature)
    let syncedCommits = 0;
    let generatedPreviews = [];

    try {
      const commitsResponse = await fetch(
        `https://api.github.com/repos/${repoFullName}/commits?per_page=10`,
        {
          headers: {
            'Authorization': `Bearer ${account.access_token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (commitsResponse.ok) {
        const commits = await commitsResponse.json();

        for (const commit of commits) {
          // Skip merge commits and dependency updates
          const message = commit.commit.message;
          if (shouldSkipCommit(message)) continue;

          // Insert commit
          const { data: savedCommit, error: commitError } = await supabaseAdmin
            .from('github_commits')
            .insert({
              user_id: user.id,
              repo_id: newRepo.id,
              sha: commit.sha,
              message: message.split('\n')[0],
              author_name: commit.commit.author.name,
              author_email: commit.commit.author.email,
              committed_at: commit.commit.author.date,
              url: commit.html_url,
            })
            .select()
            .single();

          if (!commitError && savedCommit) {
            syncedCommits++;
            
            // Generate preview for first 3 commits
            if (generatedPreviews.length < 3) {
              generatedPreviews.push({
                sha: commit.sha.slice(0, 7),
                message: message.split('\n')[0].slice(0, 80),
                preview: generateQuickPreview(message, repoName || repoFullName.split('/')[1]),
              });
            }
          }
        }

        // Update commit count
        await supabaseAdmin
          .from('github_repos')
          .update({ commit_count: syncedCommits })
          .eq('id', newRepo.id);

        console.log(`[REPOS] Synced ${syncedCommits} initial commits for ${repoFullName}`);
      }
    } catch (syncErr) {
      console.error('[REPOS] Initial sync error:', syncErr);
    }

    return NextResponse.json({
      success: true,
      repo: newRepo,
      webhookSetup,
      webhookError,
      syncedCommits,
      previews: generatedPreviews,
      message: webhookSetup 
        ? `${repoName} connected with auto-sync enabled! 🎉`
        : `${repoName} connected! Webhook setup failed - please try manual setup.`,
    });

  } catch (err) {
    console.error('Error adding repo:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete a repo
export async function DELETE(request) {
  try {
    const { repoId, repoFullName } = await request.json();

    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get repo info
    const { data: repo } = await supabaseAdmin
      .from('github_repos')
      .select('*')
      .eq('id', repoId)
      .eq('user_id', user.id)
      .single();

    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Delete webhook from GitHub if exists
    if (repo.webhook_id) {
      try {
        const { data: account } = await supabaseAdmin
          .from('connected_accounts')
          .select('access_token')
          .eq('user_id', user.id)
          .eq('platform', 'github')
          .single();

        if (account) {
          await fetch(`https://api.github.com/repos/${repo.repo_full_name}/hooks/${repo.webhook_id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${account.access_token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          });
        }
      } catch (webhookErr) {
        console.error('Error deleting webhook:', webhookErr);
        // Continue with repo deletion even if webhook deletion fails
      }
    }

    // Delete commits associated with this repo
    await supabaseAdmin
      .from('github_commits')
      .delete()
      .eq('repo_id', repoId);

    // Delete repo
    const { error: deleteError } = await supabaseAdmin
      .from('github_repos')
      .delete()
      .eq('id', repoId)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('Error deleting repo:', err);
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
  ];
  
  return skipPatterns.some(pattern => pattern.test(message));
}

// Helper: Generate quick preview for initial commits
function generateQuickPreview(message, repoName) {
  const cleanMessage = message
    .split('\n')[0]
    .replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, '')
    .trim();

  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.startsWith('feat')) {
    return `Just shipped: ${cleanMessage} 🚀 #buildinpublic`;
  } else if (lowerMessage.startsWith('fix')) {
    return `Squashed a bug: ${cleanMessage} 🐛 #buildinpublic`;
  } else if (lowerMessage.includes('ship') || lowerMessage.includes('launch')) {
    return `🚀 ${cleanMessage} is live! #buildinpublic`;
  } else {
    return `Progress on ${repoName}: ${cleanMessage} #buildinpublic`;
  }
}