import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { commitId, commitMessage, repoName, platform = 'x', tone = 'casual' } = await request.json();

    if (!commitMessage) {
      return NextResponse.json({ error: 'Commit message required' }, { status: 400 });
    }

    // Get user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Generate post content using templates (can be replaced with AI later)
    const content = generatePostContent(commitMessage, repoName || 'my project', tone, platform);

    // Create post in database
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: user.id,
        content: content,
        platform: platform,
        status: 'draft',
        source: 'github',
        source_commit: commitId,
      })
      .select()
      .single();

    if (postError) {
      console.error('[GENERATE] Error creating post:', postError);
      throw postError;
    }

    // Update commit to mark as post generated
    if (commitId) {
      await supabaseAdmin
        .from('github_commits')
        .update({ 
          post_generated: true, 
          post_id: post.id 
        })
        .eq('id', commitId);
    }

    console.log(`[GENERATE] Created ${platform} post from commit`);

    return NextResponse.json({ 
      success: true, 
      post: post,
      content: content
    });

  } catch (err) {
    console.error('[GENERATE] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function generatePostContent(message, repoName, tone, platform) {
  // Clean up commit message (remove conventional commit prefix)
  const cleanMessage = message
    .replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, '')
    .trim();

  // Determine commit type
  const lowerMessage = message.toLowerCase();
  let type = 'default';
  if (lowerMessage.startsWith('feat')) type = 'feat';
  else if (lowerMessage.startsWith('fix')) type = 'fix';
  else if (lowerMessage.startsWith('docs')) type = 'docs';
  else if (lowerMessage.startsWith('refactor')) type = 'refactor';

  const templates = {
    casual: {
      feat: `Just shipped: ${cleanMessage} 🚀\n\nBuilding ${repoName} one commit at a time.\n\n#buildinpublic`,
      fix: `Squashed a bug 🐛\n\n${cleanMessage}\n\nOnward! #buildinpublic`,
      docs: `Updated the docs 📚\n\n${cleanMessage}\n\n#buildinpublic`,
      refactor: `Cleaned up some code 🧹\n\n${cleanMessage}\n\n#buildinpublic`,
      default: `New update to ${repoName}:\n\n${cleanMessage}\n\n#buildinpublic`,
    },
    professional: {
      feat: `New feature released: ${cleanMessage}\n\nContinuing to improve ${repoName} based on user feedback.\n\n#buildinpublic`,
      fix: `Bug fix deployed: ${cleanMessage}\n\nMaintaining quality and reliability.\n\n#buildinpublic`,
      docs: `Documentation update: ${cleanMessage}\n\n#buildinpublic`,
      refactor: `Code improvement: ${cleanMessage}\n\n#buildinpublic`,
      default: `Update: ${cleanMessage}\n\n#buildinpublic`,
    },
    funny: {
      feat: `Me: "This will take 2 hours"\n\n*3 days later*\n\n${cleanMessage} 😅\n\n#buildinpublic`,
      fix: `The bug: *exists*\nMe: "not anymore" 😤\n\n${cleanMessage}\n\n#buildinpublic`,
      docs: `Actually wrote documentation for once 📝\n\n${cleanMessage}\n\nMiracles do happen #buildinpublic`,
      refactor: `Spent 2 hours renaming variables\n\nWorth it? Absolutely.\n\n${cleanMessage}\n\n#buildinpublic`,
      default: `Another day, another commit 💪\n\n${cleanMessage}\n\n#buildinpublic`,
    },
    hype: {
      feat: `🚀 SHIPPED! 🚀\n\n${cleanMessage}\n\nLET'S GOOO!\n\n#buildinpublic`,
      fix: `BUG = DESTROYED 💥\n\n${cleanMessage}\n\n#buildinpublic`,
      docs: `Docs updated! 📚✨\n\n${cleanMessage}\n\n#buildinpublic`,
      refactor: `Code is CLEAN 🧼✨\n\n${cleanMessage}\n\n#buildinpublic`,
      default: `NEW DROP 🔥\n\n${cleanMessage}\n\n#buildinpublic`,
    },
  };

  const toneTemplates = templates[tone] || templates.casual;
  let content = toneTemplates[type] || toneTemplates.default;

  // Platform-specific adjustments
  if (platform === 'linkedin') {
    content = content
      .replace('#buildinpublic', '')
      .trim() + '\n\n#SoftwareDevelopment #Tech #BuildInPublic #StartupLife';
  } else if (platform === 'reddit') {
    content = `${cleanMessage}\n\nWorking on ${repoName}. Thought I'd share my progress!`;
  }

  return content;
}