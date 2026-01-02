import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

    // Parse payload
    const data = JSON.parse(payload);

    // Only process push events
    if (event !== 'push') {
      console.log(`[WEBHOOK] Ignoring ${event} event`);
      return NextResponse.json({ message: 'Event ignored' });
    }

    // Get repo info
    const repoFullName = data.repository?.full_name;
    const repoId = data.repository?.id;

    if (!repoFullName) {
      return NextResponse.json({ error: 'No repository info' }, { status: 400 });
    }

    // Find the repo in our database
    const { data: repo, error: repoError } = await supabase
      .from('github_repos')
      .select('*, github_autopilot_settings(settings)')
      .eq('github_id', repoId)
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
      commitFilters: ['feat', 'fix', 'launch'],
      tone: 'casual',
    };

    // Process commits
    const commits = data.commits || [];
    console.log(`[WEBHOOK] Processing ${commits.length} commits for ${repoFullName}`);

    let processedCount = 0;

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

      // Check if commit matches filters
      const message = commit.message.toLowerCase();
      const matchesFilter = settings.commitFilters.includes('all') ||
        settings.commitFilters.some(filter => {
          if (filter === 'feat') return message.startsWith('feat');
          if (filter === 'fix') return message.startsWith('fix');
          if (filter === 'docs') return message.startsWith('docs');
          if (filter === 'refactor') return message.startsWith('refactor');
          if (filter === 'launch') return message.includes('launch') || message.includes('ship') || message.includes('release');
          return false;
        });

      if (!matchesFilter) {
        console.log(`[WEBHOOK] Commit ${commit.id.slice(0, 7)} doesn't match filters: ${commit.message.slice(0, 50)}`);
        continue;
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
          additions: commit.added?.length || 0,
          deletions: commit.removed?.length || 0,
          files_changed: commit.modified?.length || 0,
        })
        .select()
        .single();

      if (commitError) {
        console.error(`[WEBHOOK] Error saving commit:`, commitError);
        continue;
      }

      // Update repo commit count
      await supabase.rpc('increment_repo_commits', { repo_uuid: repo.id });

      // Generate post if auto-generate is enabled
      if (settings.autoGenerate) {
        const generatedContent = await generatePostFromCommit(commit, settings, repo.name);

        for (const platform of settings.platforms) {
          // Create post
          const { data: post, error: postError } = await supabase
            .from('posts')
            .insert({
              user_id: repo.user_id,
              content: generatedContent[platform] || generatedContent.default,
              platform: platform,
              status: settings.autoPost ? 'scheduled' : 'draft',
              scheduled_at: settings.autoPost ? new Date().toISOString() : null,
              source: 'github',
              source_commit: commit.id,
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
            .eq('id', savedCommit.id);

          // Update repo post count
          await supabase.rpc('increment_repo_posts', { repo_uuid: repo.id });

          console.log(`[WEBHOOK] Created ${platform} post from commit ${commit.id.slice(0, 7)}`);
        }
      }

      processedCount++;
    }

    console.log(`[WEBHOOK] Processed ${processedCount} commits`);

    return NextResponse.json({
      success: true,
      processed: processedCount,
      total: commits.length,
    });

  } catch (err) {
    console.error('[WEBHOOK] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// AI Post Generation
async function generatePostFromCommit(commit, settings, repoName) {
  const message = commit.message;
  const tone = settings.tone || 'casual';

  // For now, use templates. Later, integrate with actual AI
  const templates = {
    casual: {
      feat: `Just shipped: ${cleanCommitMessage(message)} 🚀\n\nBuilding ${repoName} one commit at a time.\n\n#buildinpublic`,
      fix: `Squashed a bug 🐛\n\n${cleanCommitMessage(message)}\n\nOnward! #buildinpublic`,
      default: `New update to ${repoName}:\n\n${cleanCommitMessage(message)}\n\n#buildinpublic`,
    },
    professional: {
      feat: `New feature released: ${cleanCommitMessage(message)}\n\nContinuing to improve ${repoName} based on user feedback.\n\n#buildinpublic`,
      fix: `Bug fix deployed: ${cleanCommitMessage(message)}\n\nMaintaining quality and reliability in ${repoName}.\n\n#buildinpublic`,
      default: `Update: ${cleanCommitMessage(message)}\n\n#buildinpublic`,
    },
    funny: {
      feat: `Me: "This will take 2 hours"\nAlso me 3 days later: ${cleanCommitMessage(message)} 😅\n\n#buildinpublic`,
      fix: `The bug: exists\nMe: not anymore 😤\n\n${cleanCommitMessage(message)}\n\n#buildinpublic`,
      default: `Another day, another commit 💪\n\n${cleanCommitMessage(message)}\n\n#buildinpublic`,
    },
    motivational: {
      feat: `Shipped! 🚀\n\n${cleanCommitMessage(message)}\n\nEvery feature brings us closer to the vision. Keep building!\n\n#buildinpublic`,
      fix: `Fixed and moving forward 💪\n\n${cleanCommitMessage(message)}\n\nBugs are just opportunities to make things better.\n\n#buildinpublic`,
      default: `Progress update:\n\n${cleanCommitMessage(message)}\n\nSmall steps lead to big achievements.\n\n#buildinpublic`,
    },
  };

  const toneTemplates = templates[tone] || templates.casual;
  
  // Determine commit type
  let type = 'default';
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.startsWith('feat')) type = 'feat';
  else if (lowerMessage.startsWith('fix')) type = 'fix';

  const content = toneTemplates[type] || toneTemplates.default;

  // Return platform-specific versions
  return {
    default: content,
    x: content,
    linkedin: content.replace('#buildinpublic', '').trim() + '\n\n#SoftwareDevelopment #Tech #BuildInPublic',
    reddit: cleanCommitMessage(message) + `\n\nWorking on ${repoName}. Thought I'd share my progress!`,
  };
}

function cleanCommitMessage(message) {
  // Remove conventional commit prefix
  return message
    .replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, '')
    .trim();
}

// Also handle GET for webhook verification
export async function GET(request) {
  return NextResponse.json({ status: 'Webhook endpoint active' });
}