import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Anthropic client
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function POST(request) {
  try {
    const { 
      commitId, 
      commitSha,
      commitMessage, 
      repoName,
      repoFullName,
      platform = 'x', 
      tone = 'casual',
      useAI = true 
    } = await request.json();

    if (!commitMessage) {
      return NextResponse.json({ error: 'Commit message required' }, { status: 400 });
    }

    // Get user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let content;
    let diffAnalysis = null;

    // Try AI generation with diff analysis if enabled and API key exists
    if (useAI && anthropic && repoFullName && commitSha) {
      try {
        console.log('[GENERATE] Fetching diff for AI analysis...');
        const analysisResult = await generateWithDiffAnalysis(
          user.id,
          repoFullName,
          commitSha,
          commitMessage,
          repoName || repoFullName.split('/')[1],
          platform,
          tone
        );
        content = analysisResult.content;
        diffAnalysis = analysisResult.diffSummary;
        console.log('[GENERATE] AI generation successful');
      } catch (aiError) {
        console.error('[GENERATE] AI generation failed, falling back to templates:', aiError.message);
        content = generatePostContent(commitMessage, repoName || 'my project', tone, platform);
      }
    } else {
      // Fall back to template generation
      content = generatePostContent(commitMessage, repoName || 'my project', tone, platform);
    }

    // Create post in database
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: user.id,
        content: content,
        platform: platform,
        status: 'draft',
        source: 'github',
        source_commit: commitSha || commitId,
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
      content: content,
      usedAI: !!diffAnalysis,
      diffAnalysis: diffAnalysis
    });

  } catch (err) {
    console.error('[GENERATE] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ==========================================
// AI-POWERED DIFF ANALYSIS
// ==========================================

async function generateWithDiffAnalysis(userId, repoFullName, commitSha, commitMessage, repoName, platform, tone) {
  // Get GitHub access token
  const { data: account } = await supabaseAdmin
    .from('connected_accounts')
    .select('access_token')
    .eq('user_id', userId)
    .eq('platform', 'github')
    .eq('is_active', true)
    .single();

  if (!account) {
    throw new Error('GitHub not connected');
  }

  // Fetch commit details with diff from GitHub
  const commitResponse = await fetch(
    `https://api.github.com/repos/${repoFullName}/commits/${commitSha}`,
    {
      headers: {
        'Authorization': `Bearer ${account.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  );

  if (!commitResponse.ok) {
    throw new Error('Failed to fetch commit details');
  }

  const commitData = await commitResponse.json();
  
  // Extract and process diff information
  const diffSummary = processDiff(commitData);
  
  // Generate post using Claude
  const content = await generateWithClaude(
    commitMessage,
    diffSummary,
    repoName,
    platform,
    tone
  );

  return { content, diffSummary };
}

function processDiff(commitData) {
  const files = commitData.files || [];
  
  // Filter out noise files
  const ignorePatterns = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.gitignore',
    '.env.example',
    '.DS_Store',
    'node_modules',
    '*.min.js',
    '*.min.css',
  ];

  const relevantFiles = files.filter(file => {
    const filename = file.filename.toLowerCase();
    return !ignorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(filename);
      }
      return filename.includes(pattern.toLowerCase());
    });
  });

  // Categorize files
  const categorized = {
    components: [],
    api: [],
    pages: [],
    styles: [],
    config: [],
    other: [],
  };

  relevantFiles.forEach(file => {
    const path = file.filename.toLowerCase();
    if (path.includes('component') || path.includes('/ui/')) {
      categorized.components.push(file);
    } else if (path.includes('/api/') || path.includes('route.')) {
      categorized.api.push(file);
    } else if (path.includes('/page') || path.includes('/app/') && path.endsWith('.js')) {
      categorized.pages.push(file);
    } else if (path.includes('.css') || path.includes('style') || path.includes('tailwind')) {
      categorized.styles.push(file);
    } else if (path.includes('config') || path.includes('.json') && !path.includes('package')) {
      categorized.config.push(file);
    } else {
      categorized.other.push(file);
    }
  });

  // Build summary
  const totalAdditions = relevantFiles.reduce((sum, f) => sum + (f.additions || 0), 0);
  const totalDeletions = relevantFiles.reduce((sum, f) => sum + (f.deletions || 0), 0);

  // Get patches (truncated for API limits)
  const patches = relevantFiles
    .filter(f => f.patch && f.additions > 0) // Only files with actual changes
    .slice(0, 5) // Max 5 files
    .map(f => ({
      filename: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      patch: (f.patch || '').slice(0, 500), // Truncate long patches
    }));

  return {
    totalFiles: relevantFiles.length,
    totalAdditions,
    totalDeletions,
    categorized: {
      components: categorized.components.map(f => f.filename),
      api: categorized.api.map(f => f.filename),
      pages: categorized.pages.map(f => f.filename),
      styles: categorized.styles.map(f => f.filename),
      other: categorized.other.map(f => f.filename),
    },
    patches,
  };
}

async function generateWithClaude(commitMessage, diffSummary, repoName, platform, tone) {
  const toneInstructions = {
    casual: 'Write in a casual, friendly tone. Use emojis sparingly. Be conversational like talking to a friend.',
    professional: 'Write in a professional but approachable tone. Focus on business value and impact.',
    funny: 'Write in a humorous, self-deprecating tone. Make it relatable to other developers. Be witty.',
    hype: 'Write with high energy and excitement. Use emojis. Celebrate the win!',
  };

  const platformInstructions = {
    x: 'Keep it under 280 characters. Make it punchy and engaging. Include #buildinpublic hashtag.',
    linkedin: 'Can be longer (up to 500 chars). More professional. Add relevant hashtags at the end.',
    reddit: 'Write like a genuine community member sharing progress. No hashtags. Be humble and helpful.',
  };

  const prompt = `You are a developer who builds in public. Write a social media post about a code commit.

## Commit Message
${commitMessage}

## What Changed (from git diff)
- ${diffSummary.totalFiles} files changed
- ${diffSummary.totalAdditions} additions, ${diffSummary.totalDeletions} deletions
${diffSummary.categorized.components.length > 0 ? `- Components: ${diffSummary.categorized.components.join(', ')}` : ''}
${diffSummary.categorized.api.length > 0 ? `- API routes: ${diffSummary.categorized.api.join(', ')}` : ''}
${diffSummary.categorized.pages.length > 0 ? `- Pages: ${diffSummary.categorized.pages.join(', ')}` : ''}
${diffSummary.categorized.styles.length > 0 ? `- Styles updated` : ''}

## Code Snippets
${diffSummary.patches.slice(0, 3).map(p => `
File: ${p.filename}
\`\`\`
${p.patch}
\`\`\`
`).join('\n')}

## Project
${repoName}

## Tone
${toneInstructions[tone] || toneInstructions.casual}

## Platform
${platformInstructions[platform] || platformInstructions.x}

## Instructions
1. Focus on what the user will benefit from, not technical implementation details
2. Make it sound human, not AI-generated
3. Don't mention file names or code specifics unless they're interesting
4. Capture the essence of what was built/fixed
5. Be authentic - developers can smell fake enthusiasm

Write ONLY the post content, nothing else. No quotes, no explanations.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [
      { role: 'user', content: prompt }
    ],
  });

  const generatedContent = response.content[0].text.trim();
  
  // Ensure X posts are under 280 chars
  if (platform === 'x' && generatedContent.length > 280) {
    // Ask Claude to shorten it
    const shortenResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 150,
      messages: [
        { 
          role: 'user', 
          content: `Shorten this tweet to under 280 characters while keeping the essence:\n\n${generatedContent}\n\nWrite ONLY the shortened tweet, nothing else.`
        }
      ],
    });
    return shortenResponse.content[0].text.trim();
  }

  return generatedContent;
}

// ==========================================
// FALLBACK TEMPLATE GENERATION
// ==========================================

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