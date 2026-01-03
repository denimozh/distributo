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
      generateVariations = true,
      selectedStyle = null,
      saveToDb = true,
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

    // Check if we have Anthropic API key
    if (!anthropic) {
      console.error('[GENERATE] No ANTHROPIC_API_KEY found in environment variables');
      return NextResponse.json({ 
        error: 'AI generation not configured. Please add ANTHROPIC_API_KEY to environment variables.',
        fallback: true,
        variations: generateFallbackVariations(commitMessage, repoName || 'my project', platform)
      }, { status: 200 });
    }

    let diffSummary = null;

    // Fetch diff if we have repo info
    if (repoFullName && commitSha) {
      try {
        console.log('[GENERATE] Fetching diff for:', repoFullName, commitSha);
        diffSummary = await fetchDiffSummary(user.id, repoFullName, commitSha);
        console.log('[GENERATE] Diff fetched:', diffSummary?.totalFiles, 'files');
      } catch (diffError) {
        console.error('[GENERATE] Failed to fetch diff:', diffError.message);
        // Continue without diff
      }
    }

    // Generate multiple variations
    if (generateVariations && !selectedStyle) {
      console.log('[GENERATE] Generating AI variations...');
      const variations = await generateAIVariations(
        commitMessage,
        diffSummary,
        repoName || repoFullName?.split('/')[1] || 'my project',
        platform
      );

      return NextResponse.json({
        success: true,
        variations,
        diffSummary,
        usedAI: true,
      });
    }

    // Generate single post with selected style
    const content = await generateSinglePost(
      commitMessage,
      diffSummary,
      repoName || repoFullName?.split('/')[1] || 'my project',
      platform,
      selectedStyle || 'casual'
    );

    // Save to database if requested
    if (saveToDb) {
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

      return NextResponse.json({ 
        success: true, 
        post,
        content,
        usedAI: true,
      });
    }

    return NextResponse.json({ 
      success: true, 
      content,
      usedAI: true,
    });

  } catch (err) {
    console.error('[GENERATE] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ==========================================
// FETCH DIFF FROM GITHUB
// ==========================================

async function fetchDiffSummary(userId, repoFullName, commitSha) {
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
  return processDiff(commitData);
}

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

  const categorized = {
    components: relevantFiles.filter(f => f.filename.toLowerCase().includes('component') || f.filename.includes('/ui/')),
    api: relevantFiles.filter(f => f.filename.includes('/api/') || f.filename.includes('route.')),
    pages: relevantFiles.filter(f => f.filename.includes('page.') || f.filename.includes('/app/')),
    styles: relevantFiles.filter(f => f.filename.includes('.css') || f.filename.includes('style')),
  };

  const patches = relevantFiles
    .filter(f => f.patch && f.additions > 0)
    .slice(0, 3)
    .map(f => ({
      filename: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      patch: (f.patch || '').slice(0, 400),
    }));

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
  };
}

// ==========================================
// GENERATE MULTIPLE AI VARIATIONS
// ==========================================

async function generateAIVariations(commitMessage, diffSummary, repoName, platform) {
  const diffContext = diffSummary ? `
## Code Changes
- ${diffSummary.totalFiles} files changed (+${diffSummary.totalAdditions}/-${diffSummary.totalDeletions} lines)
${diffSummary.categorized.components?.length > 0 ? `- Components: ${diffSummary.categorized.components.slice(0, 3).join(', ')}` : ''}
${diffSummary.categorized.api?.length > 0 ? `- API: ${diffSummary.categorized.api.slice(0, 3).join(', ')}` : ''}
${diffSummary.patches?.length > 0 ? `
## Code Snippets
${diffSummary.patches.map(p => `${p.filename}:\n\`\`\`\n${p.patch}\n\`\`\``).join('\n')}
` : ''}` : '';

  const prompt = `You are helping a developer write build-in-public tweets about their code commit.

## Commit Message
${commitMessage}

## Project
${repoName}
${diffContext}

## Task
Generate 5 DIFFERENT tweet variations for this commit. Each should have a unique style/angle:

1. **Short & Punchy** - Under 100 chars. Impactful one-liner.
2. **Problem → Solution** - What problem this solves. Relatable pain point.
3. **Behind the Scenes** - What you actually built/coded. Technical but accessible.
4. **Milestone/Progress** - Frame it as progress on the journey.
5. **Casual/Conversational** - Like texting a dev friend about what you shipped.

## Rules
- Each tweet MUST be under 280 characters
- Include #buildinpublic only on some, not all
- Sound human, not AI-generated
- Focus on user value, not just technical details
- Use emojis sparingly and naturally
- Don't start every tweet with "Just shipped" or similar

## Output Format
Return ONLY a JSON array with exactly 5 objects:
[
  {"style": "short", "label": "Short & Punchy", "content": "tweet here"},
  {"style": "problem", "label": "Problem → Solution", "content": "tweet here"},
  {"style": "technical", "label": "Behind the Scenes", "content": "tweet here"},
  {"style": "milestone", "label": "Milestone Update", "content": "tweet here"},
  {"style": "casual", "label": "Casual", "content": "tweet here"}
]

Return ONLY the JSON array, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.trim();
    
    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[GENERATE] Could not parse JSON from AI response:', text);
      throw new Error('Invalid AI response format');
    }

    const variations = JSON.parse(jsonMatch[0]);
    
    // Validate and ensure under 280 chars
    return variations.map(v => ({
      ...v,
      content: v.content.length > 280 ? v.content.slice(0, 277) + '...' : v.content,
      charCount: Math.min(v.content.length, 280),
    }));

  } catch (err) {
    console.error('[GENERATE] AI variation generation failed:', err);
    // Return fallback variations
    return generateFallbackVariations(commitMessage, repoName, platform);
  }
}

// ==========================================
// GENERATE SINGLE POST
// ==========================================

async function generateSinglePost(commitMessage, diffSummary, repoName, platform, style) {
  const stylePrompts = {
    short: 'Write a short, punchy tweet under 100 characters. One impactful line.',
    problem: 'Frame this as solving a problem. Start with the pain point, then the solution.',
    technical: 'Share what you actually built. Technical but accessible to other devs.',
    milestone: 'Frame this as progress/milestone on your building journey.',
    casual: 'Write like you\'re texting a dev friend about what you just shipped.',
  };

  const prompt = `Write a single tweet about this commit:

Commit: ${commitMessage}
Project: ${repoName}
${diffSummary ? `Files changed: ${diffSummary.totalFiles}` : ''}

Style: ${stylePrompts[style] || stylePrompts.casual}

Rules:
- Under 280 characters
- Sound human, not AI
- Include #buildinpublic if it fits naturally

Write ONLY the tweet, nothing else.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
}

// ==========================================
// FALLBACK VARIATIONS (NO AI)
// ==========================================

function generateFallbackVariations(commitMessage, repoName, platform) {
  const cleanMessage = commitMessage
    .replace(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:\s*/i, '')
    .trim();

  return [
    {
      style: 'short',
      label: 'Short & Punchy',
      content: `Shipped: ${cleanMessage} 🚀 #buildinpublic`,
      charCount: `Shipped: ${cleanMessage} 🚀 #buildinpublic`.length,
    },
    {
      style: 'problem',
      label: 'Problem → Solution',
      content: `The problem: needed ${cleanMessage.toLowerCase()}\n\nThe solution: built it myself\n\n#buildinpublic`,
      charCount: 0,
    },
    {
      style: 'technical',
      label: 'Behind the Scenes',
      content: `Today's build: ${cleanMessage}\n\nWorking on ${repoName}. Progress feels good.\n\n#buildinpublic`,
      charCount: 0,
    },
    {
      style: 'milestone',
      label: 'Milestone Update',
      content: `✅ ${cleanMessage}\n\nAnother step forward on ${repoName}.\n\n#buildinpublic`,
      charCount: 0,
    },
    {
      style: 'casual',
      label: 'Casual',
      content: `Just wrapped up: ${cleanMessage}\n\nOnward 💪`,
      charCount: 0,
    },
  ].map(v => ({ ...v, charCount: v.content.length }));
}