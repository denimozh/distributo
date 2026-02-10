import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Verify GitHub webhook signature
function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    const deliveryId = request.headers.get('x-github-delivery');

    console.log(`[WEBHOOK] Received ${event} event, delivery: ${deliveryId}`);

    const data = JSON.parse(payload);
    const repoFullName = data.repository?.full_name;
    const repoId = data.repository?.id;

    if (!repoFullName) {
      return NextResponse.json({ error: 'No repository info' }, { status: 400 });
    }

    // Find the repo in our database
    const { data: repo, error: repoError } = await supabase
      .from('github_repos')
      .select('*')
      .eq('repo_full_name', repoFullName)
      .eq('is_active', true)
      .single();

    if (!repo) {
      console.log(`[WEBHOOK] Repo not found or not active: ${repoFullName}`);
      return NextResponse.json({ message: 'Repo not monitored' });
    }

    // Verify webhook signature
    if (repo.webhook_secret && signature) {
      const isValid = verifySignature(payload, signature, repo.webhook_secret);
      if (!isValid) {
        console.error('[WEBHOOK] Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Get user settings
    const { data: settingsData } = await supabase
      .from('github_autopilot_settings')
      .select('settings')
      .eq('user_id', repo.user_id)
      .single();

    const settings = settingsData?.settings || {
      autoGenerate: true,
      autoPost: false,
      platforms: ['x'],
      commitFilters: ['all'],
      tone: 'casual',
    };

    // Route to appropriate handler based on event type
    switch (event) {
      case 'push':
        return await handlePushEvent(data, repo, settings);
      case 'release':
        return await handleReleaseEvent(data, repo, settings);
      case 'pull_request':
        return await handlePullRequestEvent(data, repo, settings);
      case 'issues':
        return await handleIssuesEvent(data, repo, settings);
      default:
        console.log(`[WEBHOOK] Ignoring ${event} event`);
        return NextResponse.json({ message: 'Event ignored' });
    }

  } catch (err) {
    console.error('[WEBHOOK] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ==========================================
// PUSH EVENT HANDLER (Commits)
// ==========================================

async function handlePushEvent(data, repo, settings) {
  const commits = data.commits || [];
  console.log(`[WEBHOOK] Processing ${commits.length} commits for ${repo.repo_full_name}`);

  // Get GitHub access token for fetching diff
  const { data: account } = await supabase
    .from('connected_accounts')
    .select('access_token')
    .eq('user_id', repo.user_id)
    .eq('platform', 'github')
    .eq('is_active', true)
    .single();

  let processedCount = 0;
  const recentCommits = [];

  for (const commit of commits) {
    // Check if commit already exists
    const { data: existingCommit } = await supabase
      .from('github_commits')
      .select('id')
      .eq('repo_id', repo.id)
      .eq('sha', commit.id)
      .single();

    if (existingCommit) {
      console.log(`[WEBHOOK] Commit ${commit.id.slice(0, 7)} already processed`);
      continue;
    }

    // Check if commit should be skipped (boring commits)
    if (shouldSkipCommit(commit.message)) {
      console.log(`[WEBHOOK] Skipping boring commit: ${commit.message.slice(0, 50)}`);
      
      // Save but mark as skipped
      await supabase.from('github_commits').insert({
        user_id: repo.user_id,
        repo_id: repo.id,
        sha: commit.id,
        message: commit.message,
        author_name: commit.author?.name,
        author_email: commit.author?.email,
        committed_at: commit.timestamp,
        url: commit.url,
        skipped: true,
        skip_reason: 'boring_commit',
      });
      
      continue;
    }

    // Check if commit matches filters (expanded for indie hacker patterns)
    const matchesFilter = checkCommitFilter(commit.message, settings.commitFilters);

    if (!matchesFilter) {
      console.log(`[WEBHOOK] Commit ${commit.id.slice(0, 7)} doesn't match filters: ${commit.message.slice(0, 50)}`);
      continue;
    }

    // Fetch detailed commit info with diff
    let diffSummary = null;
    if (account?.access_token) {
      try {
        diffSummary = await fetchCommitDiff(repo.repo_full_name, commit.id, account.access_token);
      } catch (diffError) {
        console.error(`[WEBHOOK] Failed to fetch diff:`, diffError.message);
      }
    }

    // Save commit to database
    const { data: savedCommit, error: commitError } = await supabase
      .from('github_commits')
      .insert({
        user_id: repo.user_id,
        repo_id: repo.id,
        sha: commit.id,
        message: commit.message,
        author_name: commit.author?.name,
        author_email: commit.author?.email,
        committed_at: commit.timestamp,
        url: commit.url,
        additions: diffSummary?.totalAdditions || commit.added?.length || 0,
        deletions: diffSummary?.totalDeletions || commit.removed?.length || 0,
        files_changed: diffSummary?.totalFiles || commit.modified?.length || 0,
        diff_summary: diffSummary,
      })
      .select()
      .single();

    if (commitError) {
      console.error(`[WEBHOOK] Error saving commit:`, commitError);
      continue;
    }

    // Track for batching
    recentCommits.push({
      ...savedCommit,
      diffSummary,
    });

    // Update repo commit count
    await supabase.rpc('increment_repo_commits', { repo_uuid: repo.id }).catch(() => {});

    processedCount++;
  }

  // Smart commit grouping: batch commits within 2 hour window
  if (settings.autoGenerate && recentCommits.length > 0) {
    const commitGroups = groupCommitsByTimeWindow(recentCommits, 2 * 60 * 60 * 1000);
    
    for (const group of commitGroups) {
      if (group.length === 1) {
        // Single commit = single post
        await generateAndSavePost(group[0], repo, settings);
      } else if (group.length > 1) {
        // Multiple commits = "shipping spree" post
        await generateBatchPost(group, repo, settings);
      }
    }
  }

  console.log(`[WEBHOOK] Processed ${processedCount} commits`);

  return NextResponse.json({
    success: true,
    processed: processedCount,
    total: commits.length,
  });
}

// ==========================================
// RELEASE EVENT HANDLER
// ==========================================

async function handleReleaseEvent(data, repo, settings) {
  if (data.action !== 'published') {
    return NextResponse.json({ message: 'Release action ignored' });
  }

  const release = data.release;
  console.log(`[WEBHOOK] Processing release ${release.tag_name} for ${repo.repo_full_name}`);

  // Get repo stats for context
  let repoStats = null;
  try {
    const { data: account } = await supabase
      .from('connected_accounts')
      .select('access_token')
      .eq('user_id', repo.user_id)
      .eq('platform', 'github')
      .single();

    if (account) {
      const statsResponse = await fetch(
        `https://api.github.com/repos/${repo.repo_full_name}`,
        {
          headers: {
            'Authorization': `Bearer ${account.access_token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );
      if (statsResponse.ok) {
        const repoData = await statsResponse.json();
        repoStats = {
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          watchers: repoData.watchers_count,
        };
      }
    }
  } catch (e) {
    console.error('[WEBHOOK] Failed to fetch repo stats:', e);
  }

  // Generate launch post
  const launchContent = await generateLaunchPost({
    version: release.tag_name,
    title: release.name,
    notes: release.body,
    url: release.html_url,
    repoName: repo.repo_name,
    stats: repoStats,
  }, settings);

  // Generate launch thread if release has significant content
  let threadContent = null;
  if (release.body && release.body.length > 100) {
    threadContent = await generateLaunchThread({
      version: release.tag_name,
      title: release.name,
      notes: release.body,
      repoName: repo.repo_name,
      stats: repoStats,
    }, settings);
  }

  // Save release post
  for (const platform of settings.platforms) {
    const { error: postError } = await supabase.from('posts').insert({
      user_id: repo.user_id,
      content: launchContent[platform] || launchContent.default,
      platform: platform,
      status: settings.autoPost ? 'scheduled' : 'draft',
      scheduled_at: settings.autoPost ? new Date().toISOString() : null,
      source: 'github_release',
      source_commit: release.tag_name,
      metadata: {
        release_url: release.html_url,
        version: release.tag_name,
        is_launch: true,
        thread: threadContent,
      },
    });

    if (postError) {
      console.error(`[WEBHOOK] Error creating release post:`, postError);
    }
  }

  console.log(`[WEBHOOK] Created launch post for release ${release.tag_name}`);

  return NextResponse.json({
    success: true,
    release: release.tag_name,
    hasThread: !!threadContent,
  });
}

// ==========================================
// PULL REQUEST EVENT HANDLER
// ==========================================

async function handlePullRequestEvent(data, repo, settings) {
  // Only process merged PRs
  if (data.action !== 'closed' || !data.pull_request.merged) {
    return NextResponse.json({ message: 'PR action ignored' });
  }

  const pr = data.pull_request;

  // Skip dependency updates
  if (isDependencyPR(pr)) {
    console.log(`[WEBHOOK] Skipping dependency PR: ${pr.title}`);
    return NextResponse.json({ message: 'Dependency PR ignored' });
  }

  console.log(`[WEBHOOK] Processing merged PR: ${pr.title}`);

  // Generate feature announcement post
  const featureContent = await generateFeaturePost({
    title: pr.title,
    description: pr.body,
    filesChanged: pr.changed_files,
    additions: pr.additions,
    deletions: pr.deletions,
    repoName: repo.repo_name,
  }, settings);

  // Save post
  for (const platform of settings.platforms) {
    await supabase.from('posts').insert({
      user_id: repo.user_id,
      content: featureContent[platform] || featureContent.default,
      platform: platform,
      status: settings.autoPost ? 'scheduled' : 'draft',
      scheduled_at: settings.autoPost ? new Date().toISOString() : null,
      source: 'github_pr',
      source_commit: `PR #${pr.number}`,
      metadata: {
        pr_url: pr.html_url,
        pr_number: pr.number,
        files_changed: pr.changed_files,
      },
    });
  }

  console.log(`[WEBHOOK] Created feature post from PR #${pr.number}`);

  return NextResponse.json({
    success: true,
    pr_number: pr.number,
  });
}

// ==========================================
// ISSUES EVENT HANDLER
// ==========================================

async function handleIssuesEvent(data, repo, settings) {
  if (data.action !== 'closed') {
    return NextResponse.json({ message: 'Issue action ignored' });
  }

  const issue = data.issue;

  // Only create posts for bug fixes
  const isBug = issue.labels?.some(l => 
    l.name.toLowerCase().includes('bug') || 
    l.name.toLowerCase().includes('fix')
  );

  if (!isBug) {
    return NextResponse.json({ message: 'Non-bug issue ignored' });
  }

  console.log(`[WEBHOOK] Processing closed bug issue: ${issue.title}`);

  // Generate bug fix post
  const bugFixContent = await generateBugFixPost({
    problem: issue.title,
    description: issue.body,
    repoName: repo.repo_name,
  }, settings);

  // Save post
  for (const platform of settings.platforms) {
    await supabase.from('posts').insert({
      user_id: repo.user_id,
      content: bugFixContent[platform] || bugFixContent.default,
      platform: platform,
      status: settings.autoPost ? 'scheduled' : 'draft',
      scheduled_at: settings.autoPost ? new Date().toISOString() : null,
      source: 'github_issue',
      source_commit: `Issue #${issue.number}`,
      metadata: {
        issue_url: issue.html_url,
        issue_number: issue.number,
        is_bug_fix: true,
      },
    });
  }

  console.log(`[WEBHOOK] Created bug fix post from Issue #${issue.number}`);

  return NextResponse.json({
    success: true,
    issue_number: issue.number,
  });
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

// Check if commit should be skipped (ONLY truly automated/useless commits)
// Indie hackers use short messages like "fix", "stuff", "ants" — the DIFF is what matters
function shouldSkipCommit(message) {
  const skipPatterns = [
    /^merge\s+(branch|pull|remote)/i,
    /^Merge pull request/i,
    /^bump.*version/i,
    /^update.*lock\s*file/i,
    /^update.*package-lock/i,
    /^chore\(deps\)/i,
    /^auto-generated/i,
    /^initial commit$/i,
  ];
  
  return skipPatterns.some(pattern => pattern.test(message));
}

// Extended commit filter matching for indie hackers
function checkCommitFilter(message, filters) {
  const lowerMessage = message.toLowerCase();
  
  if (filters.includes('all')) return true;
  
  return filters.some(filter => {
    switch (filter) {
      case 'feat':
        return lowerMessage.startsWith('feat');
      case 'fix':
        return lowerMessage.startsWith('fix');
      case 'docs':
        return lowerMessage.startsWith('docs');
      case 'refactor':
        return lowerMessage.startsWith('refactor');
      case 'launch':
      case 'ship':
        return /\b(ship|launch|release|deploy|publish|live)\b/i.test(message);
      case 'milestone':
        return /\b(v\d|milestone|complete|finish|done|100%)\b/i.test(message);
      default:
        return false;
    }
  });
}

// Group commits by time window for batching
function groupCommitsByTimeWindow(commits, windowMs) {
  if (commits.length <= 1) return [commits];
  
  const sorted = [...commits].sort((a, b) => 
    new Date(a.committed_at) - new Date(b.committed_at)
  );
  
  const groups = [];
  let currentGroup = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const prevTime = new Date(sorted[i - 1].committed_at).getTime();
    const currTime = new Date(sorted[i].committed_at).getTime();
    
    if (currTime - prevTime <= windowMs) {
      currentGroup.push(sorted[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  
  groups.push(currentGroup);
  return groups;
}

// Check if PR is a dependency update
function isDependencyPR(pr) {
  const title = pr.title.toLowerCase();
  const body = (pr.body || '').toLowerCase();
  
  return (
    title.includes('bump') ||
    title.includes('dependabot') ||
    title.includes('dependency') ||
    title.includes('renovate') ||
    body.includes('dependabot') ||
    body.includes('renovate')
  );
}

// Fetch commit diff from GitHub API
async function fetchCommitDiff(repoFullName, sha, accessToken) {
  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/commits/${sha}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch commit details');
  }

  const commitData = await response.json();
  return processDiff(commitData);
}

// Process diff data
function processDiff(commitData) {
  const files = commitData.files || [];
  
  const ignorePatterns = [
    'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
    '.gitignore', '.env', '.DS_Store', 'node_modules',
  ];

  const relevantFiles = files.filter(file => {
    const filename = file.filename.toLowerCase();
    return !ignorePatterns.some(pattern => filename.includes(pattern.toLowerCase()));
  });

  // Categorize files
  const categorized = {
    components: relevantFiles.filter(f => 
      f.filename.toLowerCase().includes('component') || 
      f.filename.includes('/ui/')
    ),
    api: relevantFiles.filter(f => 
      f.filename.includes('/api/') || 
      f.filename.includes('route.')
    ),
    pages: relevantFiles.filter(f => 
      f.filename.includes('page.') || 
      f.filename.includes('/app/')
    ),
    styles: relevantFiles.filter(f => 
      f.filename.includes('.css') || 
      f.filename.includes('style')
    ),
  };

  // Get code snippets (first 3 files with patches)
  const patches = relevantFiles
    .filter(f => f.patch && f.additions > 0)
    .slice(0, 3)
    .map(f => ({
      filename: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      patch: (f.patch || '').slice(0, 500),
    }));

  // Analyze patterns in the code
  const allPatches = relevantFiles.map(f => f.patch || '').join('\n');
  
  const patterns = {
    addedValidation: /validate|validation|isValid|check/i.test(allPatches),
    fixedNullCheck: /\?\.|!= ?null|!== ?null|\|\|/.test(allPatches) && files.some(f => f.deletions > 0),
    addedErrorHandling: /try|catch|error|throw|exception/i.test(allPatches),
    addedAuth: /auth|login|session|token|jwt/i.test(allPatches),
    addedUI: /className|style|css|<div|<button/i.test(allPatches),
    performance: /cache|memo|lazy|optimize|async/i.test(allPatches),
    darkMode: /dark|theme|mode/i.test(allPatches),
    payment: /pay|stripe|price|checkout/i.test(allPatches),
    database: /schema|migration|query|database/i.test(allPatches),
  };

  return {
    totalFiles: relevantFiles.length,
    totalAdditions: relevantFiles.reduce((sum, f) => sum + (f.additions || 0), 0),
    totalDeletions: relevantFiles.reduce((sum, f) => sum + (f.deletions || 0), 0),
    categorized: {
      components: categorized.components.map(f => f.filename),
      api: categorized.api.map(f => f.filename),
      pages: categorized.pages.map(f => f.filename),
    },
    patches,
    patterns,
    mainArea: Object.entries(categorized)
      .filter(([_, files]) => files.length > 0)
      .sort((a, b) => b[1].length - a[1].length)[0]?.[0] || 'code',
  };
}

// ==========================================
// AI CONTENT GENERATION
// ==========================================

async function generateAndSavePost(commit, repo, settings) {
  try {
    const content = await generateSmartPostFromCommit(commit, repo, settings);
    
    for (const platform of settings.platforms) {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: repo.user_id,
          content: content[platform] || content.default,
          platform: platform,
          status: settings.autoPost ? 'scheduled' : 'draft',
          scheduled_at: settings.autoPost ? new Date().toISOString() : null,
          source: 'github',
          source_commit: commit.sha,
        })
        .select()
        .single();

      if (postError) {
        console.error(`[WEBHOOK] Error creating post:`, postError);
        continue;
      }

      // Update commit with post reference
      await supabase
        .from('github_commits')
        .update({ post_generated: true, post_id: post.id })
        .eq('id', commit.id);

      // Update repo post count
      await supabase.rpc('increment_repo_posts', { repo_uuid: repo.id }).catch(() => {});

      console.log(`[WEBHOOK] Created ${platform} post from commit ${commit.sha.slice(0, 7)}`);
    }
  } catch (err) {
    console.error('[WEBHOOK] Error generating post:', err);
  }
}

async function generateBatchPost(commits, repo, settings) {
  const commitMessages = commits.map(c => c.message).join('\n- ');
  const totalAdditions = commits.reduce((sum, c) => sum + (c.additions || 0), 0);
  const totalDeletions = commits.reduce((sum, c) => sum + (c.deletions || 0), 0);
  const timeSpan = Math.round(
    (new Date(commits[commits.length - 1].committed_at) - new Date(commits[0].committed_at)) / (60 * 1000)
  );

  if (!anthropic) {
    const content = `Shipping spree 🔥\n\n${commits.length} commits in ${timeSpan} minutes:\n- ${commitMessages.slice(0, 200)}\n\n#buildinpublic`;
    
    for (const platform of settings.platforms) {
      await supabase.from('posts').insert({
        user_id: repo.user_id,
        content: content,
        platform: platform,
        status: settings.autoPost ? 'scheduled' : 'draft',
        scheduled_at: settings.autoPost ? new Date().toISOString() : null,
        source: 'github_batch',
        metadata: { commit_count: commits.length, time_span_minutes: timeSpan },
      });
    }
    return;
  }

  const prompt = `You're a developer who builds in public. Generate a tweet about a shipping spree.

CONTEXT:
- ${commits.length} commits in ${timeSpan} minutes
- Total: +${totalAdditions}/-${totalDeletions} lines
- Commits:
${commits.map(c => `  - ${c.message}`).join('\n')}

Write a single excited tweet about this shipping spree. Under 280 chars. Sound human, not corporate. Include #buildinpublic.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text.trim();

    for (const platform of settings.platforms) {
      await supabase.from('posts').insert({
        user_id: repo.user_id,
        content: content,
        platform: platform,
        status: settings.autoPost ? 'scheduled' : 'draft',
        scheduled_at: settings.autoPost ? new Date().toISOString() : null,
        source: 'github_batch',
        metadata: { commit_count: commits.length, time_span_minutes: timeSpan },
      });
    }
    
    // Mark all commits as processed
    for (const commit of commits) {
      await supabase.from('github_commits')
        .update({ post_generated: true })
        .eq('id', commit.id);
    }
  } catch (err) {
    console.error('[WEBHOOK] Error generating batch post:', err);
  }
}

async function generateSmartPostFromCommit(commit, repo, settings) {
  const message = commit.message;
  const diff = commit.diffSummary || commit.diff_summary;
  const tone = settings.tone || 'casual';
  const cleanMessage = message.replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, '').trim();

  // Fallback templates if no AI
  if (!anthropic) {
    return generateTemplatePost(cleanMessage, repo.repo_name, tone);
  }

  // Build context from diff
  let diffContext = '';
  if (diff) {
    diffContext = `
## Code Changes
- ${diff.totalFiles} files changed (+${diff.totalAdditions}/-${diff.totalDeletions} lines)
${diff.categorized?.components?.length > 0 ? `- Components: ${diff.categorized.components.slice(0, 3).join(', ')}` : ''}
${diff.categorized?.api?.length > 0 ? `- API: ${diff.categorized.api.slice(0, 3).join(', ')}` : ''}
${diff.patches?.length > 0 ? `
## Code Snippets
${diff.patches.map(p => `${p.filename}:\n\`\`\`\n${p.patch}\n\`\`\``).join('\n')}
` : ''}
## Detected Patterns
${Object.entries(diff.patterns || {}).filter(([_, v]) => v).map(([k]) => `- ${k}`).join('\n') || 'None detected'}`;
  }

  const prompt = `You are a developer who builds in public. Generate a tweet about this commit.

## Commit Message
${message}

## Project
${repo.repo_name}
${diffContext}

## Rules
- First line is EVERYTHING (the hook)
- Never start with "I"
- Under 280 characters
- Sound human, not corporate
- If the commit message is vague ("bug fixes", "updates"), INFER the real change from the code
- Focus on USER BENEFIT, not technical implementation
- Include 1-2 relevant emojis max
- End with #buildinpublic

## Examples of good inference
- Code adds validateCardNumber() → "Added payment validation so users don't fat-finger their card numbers 💳"
- Code fixes null check → "Squashed a crash that happened when users had empty profiles"
- Code adds dark mode CSS → "Dark mode is here. Your eyes can thank me later 🌙"

Generate a single tweet. Output ONLY the tweet text, nothing else.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text.trim();

    return {
      default: content,
      x: content,
      linkedin: content.replace('#buildinpublic', '').trim() + '\n\n#SoftwareDevelopment #Tech #BuildInPublic',
      reddit: `${cleanMessage}\n\nWorking on ${repo.repo_name}. Thought I'd share my progress!`,
    };
  } catch (err) {
    console.error('[WEBHOOK] AI generation failed:', err);
    return generateTemplatePost(cleanMessage, repo.repo_name, tone);
  }
}

async function generateLaunchPost({ version, title, notes, url, repoName, stats }, settings) {
  if (!anthropic) {
    const content = `🚀 ${repoName} ${version} is LIVE!\n\n${title || 'New release'}\n\n${url}\n\n#buildinpublic`;
    return { default: content, x: content };
  }

  const statsContext = stats ? `Stars: ${stats.stars}, Forks: ${stats.forks}` : '';

  const prompt = `Generate an exciting launch tweet for a new software release.

Project: ${repoName}
Version: ${version}
Title: ${title || 'New release'}
Release Notes: ${notes?.slice(0, 500) || 'No notes'}
URL: ${url}
${statsContext}

Write an excited, authentic launch tweet. Under 280 chars. Make it feel like a milestone. Include #buildinpublic.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text.trim();
    return { default: content, x: content };
  } catch (err) {
    const content = `🚀 ${repoName} ${version} is LIVE!\n\n${title || 'New release'}\n\n${url}\n\n#buildinpublic`;
    return { default: content, x: content };
  }
}

async function generateLaunchThread({ version, title, notes, repoName, stats }, settings) {
  if (!anthropic) return null;

  const highlights = notes?.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).slice(0, 5);
  
  const prompt = `Generate a Twitter thread (5-7 tweets) for a major software release.

Project: ${repoName}
Version: ${version}
Title: ${title}
Highlights: ${highlights?.join('\n') || notes?.slice(0, 500)}
${stats ? `Stats: ${stats.stars} stars, ${stats.forks} forks` : ''}

Format as JSON array of strings, each tweet under 280 chars.
Thread structure:
1. Hook - exciting announcement
2-5. Key features/highlights
6. Call to action
7. Optional: thank community

Output ONLY the JSON array.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (err) {
    console.error('[WEBHOOK] Thread generation failed:', err);
    return null;
  }
}

async function generateFeaturePost({ title, description, filesChanged, additions, deletions, repoName }, settings) {
  const cleanTitle = title.replace(/^(feat|fix|docs)(\(.+\))?:\s*/i, '').trim();
  
  if (!anthropic) {
    const content = `Just shipped: ${cleanTitle} 🚀\n\n${filesChanged} files changed (+${additions}/-${deletions})\n\n#buildinpublic`;
    return { default: content, x: content };
  }

  const prompt = `Generate a feature announcement tweet.

Feature: ${cleanTitle}
Description: ${description?.slice(0, 300) || 'No description'}
Impact: ${filesChanged} files, +${additions}/-${deletions} lines
Project: ${repoName}

Write an authentic feature announcement. Under 280 chars. Focus on user value. Include #buildinpublic.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text.trim();
    return { default: content, x: content };
  } catch (err) {
    const content = `Just shipped: ${cleanTitle} 🚀\n\n#buildinpublic`;
    return { default: content, x: content };
  }
}

async function generateBugFixPost({ problem, description, repoName }, settings) {
  if (!anthropic) {
    const content = `Bug squashed 🐛\n\n${problem}\n\nAnother step toward a better ${repoName}.\n\n#buildinpublic`;
    return { default: content, x: content };
  }

  const prompt = `Generate a tweet about fixing a user-reported bug.

Bug: ${problem}
Details: ${description?.slice(0, 200) || 'No details'}
Project: ${repoName}

Write an authentic bug fix announcement. Show you care about users. Under 280 chars. Include #buildinpublic.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text.trim();
    return { default: content, x: content };
  } catch (err) {
    const content = `Bug squashed 🐛\n\n${problem}\n\n#buildinpublic`;
    return { default: content, x: content };
  }
}

function generateTemplatePost(cleanMessage, repoName, tone) {
  const templates = {
    casual: {
      feat: `Just shipped: ${cleanMessage} 🚀\n\nBuilding ${repoName} one commit at a time.\n\n#buildinpublic`,
      fix: `Squashed a bug 🐛\n\n${cleanMessage}\n\nOnward! #buildinpublic`,
      default: `New update to ${repoName}:\n\n${cleanMessage}\n\n#buildinpublic`,
    },
    professional: {
      feat: `New feature released: ${cleanMessage}\n\nContinuing to improve ${repoName}.\n\n#buildinpublic`,
      fix: `Bug fix deployed: ${cleanMessage}\n\nMaintaining quality in ${repoName}.\n\n#buildinpublic`,
      default: `Update: ${cleanMessage}\n\n#buildinpublic`,
    },
    hype: {
      feat: `LET'S GO 🔥\n\nJust shipped: ${cleanMessage}\n\n${repoName} keeps getting better!\n\n#buildinpublic`,
      fix: `THE BUG IS DEAD 💀\n\n${cleanMessage}\n\n#buildinpublic`,
      default: `SHIPPED IT 🚀\n\n${cleanMessage}\n\n#buildinpublic`,
    },
    funny: {
      feat: `Me: "This will take 2 hours"\nAlso me 3 days later: ${cleanMessage} 😅\n\n#buildinpublic`,
      fix: `The bug: exists\nMe: not anymore 😤\n\n${cleanMessage}\n\n#buildinpublic`,
      default: `Another day, another commit 💪\n\n${cleanMessage}\n\n#buildinpublic`,
    },
  };

  const toneTemplates = templates[tone] || templates.casual;
  const type = cleanMessage.toLowerCase().startsWith('fix') ? 'fix' : 
               cleanMessage.toLowerCase().startsWith('feat') ? 'feat' : 'default';

  const content = toneTemplates[type] || toneTemplates.default;

  return {
    default: content,
    x: content,
    linkedin: content.replace('#buildinpublic', '').trim() + '\n\n#SoftwareDevelopment #Tech #BuildInPublic',
    reddit: `${cleanMessage}\n\nWorking on ${repoName}. Thought I'd share my progress!`,
  };
}

// GET endpoint for webhook verification
export async function GET(request) {
  return NextResponse.json({ status: 'Webhook endpoint active' });
}