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

// Commit details cache (in-memory, 24 hour TTL)
const commitCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
      console.error('[GENERATE] No ANTHROPIC_API_KEY found');
      return NextResponse.json({ 
        error: 'AI generation not configured. Please add ANTHROPIC_API_KEY.',
        fallback: true,
        variations: generateFallbackVariations(commitMessage, repoName || 'my project', platform)
      }, { status: 200 });
    }

    let diffSummary = null;

    // Fetch diff if we have repo info (with caching)
    if (repoFullName && commitSha) {
      try {
        diffSummary = await fetchDiffSummaryWithCache(user.id, repoFullName, commitSha);
        console.log('[GENERATE] Diff fetched:', diffSummary?.totalFiles, 'files');
      } catch (diffError) {
        console.error('[GENERATE] Failed to fetch diff:', diffError.message);
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
        diffSummary: diffSummary ? {
          totalFiles: diffSummary.totalFiles,
          totalAdditions: diffSummary.totalAdditions,
          totalDeletions: diffSummary.totalDeletions,
          mainArea: diffSummary.mainArea,
          patterns: diffSummary.patterns,
        } : null,
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
// FETCH DIFF WITH CACHING
// ==========================================

async function fetchDiffSummaryWithCache(userId, repoFullName, commitSha) {
  const cacheKey = `${repoFullName}:${commitSha}`;
  
  // Check cache first
  const cached = commitCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[GENERATE] Using cached diff for', commitSha.slice(0, 7));
    return cached.data;
  }

  // Fetch from GitHub
  const diffSummary = await fetchDiffSummary(userId, repoFullName, commitSha);
  
  // Cache the result
  commitCache.set(cacheKey, {
    data: diffSummary,
    timestamp: Date.now(),
  });

  // Clean old cache entries if too large
  if (commitCache.size > 500) {
    const oldest = [...commitCache.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, 100);
    oldest.forEach(([key]) => commitCache.delete(key));
  }

  return diffSummary;
}

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

  // Categorize files
  const categorized = {
    components: relevantFiles.filter(f => 
      f.filename.toLowerCase().includes('component') || 
      f.filename.includes('/ui/') ||
      f.filename.includes('/components/')
    ),
    api: relevantFiles.filter(f => 
      f.filename.includes('/api/') || 
      f.filename.includes('route.')
    ),
    pages: relevantFiles.filter(f => 
      f.filename.includes('page.') || 
      f.filename.includes('/app/') ||
      f.filename.includes('/pages/')
    ),
    styles: relevantFiles.filter(f => 
      f.filename.includes('.css') || 
      f.filename.includes('.scss') ||
      f.filename.includes('style') ||
      f.filename.includes('tailwind')
    ),
    database: relevantFiles.filter(f =>
      f.filename.includes('migration') ||
      f.filename.includes('schema') ||
      f.filename.includes('.sql') ||
      f.filename.includes('prisma')
    ),
    tests: relevantFiles.filter(f =>
      f.filename.includes('test') ||
      f.filename.includes('spec') ||
      f.filename.includes('__tests__')
    ),
  };

  // Get code snippets (first 3 files with meaningful patches)
  const patches = relevantFiles
    .filter(f => f.patch && f.additions > 2) // Skip trivial changes
    .slice(0, 3)
    .map(f => ({
      filename: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      patch: (f.patch || '').slice(0, 600), // Increased for better context
    }));

  // Analyze patterns in the code
  const allPatches = relevantFiles.map(f => f.patch || '').join('\n');
  
  const patterns = {
    addedValidation: /validate|validation|isValid|check|sanitize|zod|yup/i.test(allPatches),
    fixedNullCheck: /\?\.|!= ?null|!== ?null|\?\?|\|\|/.test(allPatches) && files.some(f => f.deletions > 0),
    addedErrorHandling: /try\s*{|catch\s*\(|\.catch|error|throw|exception/i.test(allPatches),
    addedAuth: /auth|login|logout|session|token|jwt|password|oauth/i.test(allPatches),
    addedUI: /className|style=|css|<div|<button|<form|useState|component/i.test(allPatches),
    performance: /cache|memo|useMemo|useCallback|lazy|optimize|async|await/i.test(allPatches),
    darkMode: /dark|theme|mode|color-scheme/i.test(allPatches),
    payment: /pay|stripe|price|checkout|billing|subscription/i.test(allPatches),
    database: /schema|migration|query|database|prisma|supabase|sql/i.test(allPatches),
    api: /fetch|axios|api|endpoint|route|handler/i.test(allPatches),
    testing: /test|expect|describe|it\(|jest|vitest/i.test(allPatches),
    accessibility: /aria|a11y|role=|alt=|screen-reader/i.test(allPatches),
    mobile: /responsive|mobile|@media|breakpoint/i.test(allPatches),
    security: /encrypt|hash|secure|csrf|xss|sanitize/i.test(allPatches),
  };

  // Determine main area of work
  const areaCounts = Object.entries(categorized)
    .filter(([_, files]) => files.length > 0)
    .map(([area, files]) => ({ area, count: files.length }))
    .sort((a, b) => b.count - a.count);

  return {
    totalFiles: relevantFiles.length,
    totalAdditions: relevantFiles.reduce((sum, f) => sum + (f.additions || 0), 0),
    totalDeletions: relevantFiles.reduce((sum, f) => sum + (f.deletions || 0), 0),
    categorized: {
      components: categorized.components.map(f => f.filename).slice(0, 5),
      api: categorized.api.map(f => f.filename).slice(0, 5),
      pages: categorized.pages.map(f => f.filename).slice(0, 5),
      database: categorized.database.map(f => f.filename).slice(0, 5),
    },
    patches,
    patterns,
    mainArea: areaCounts[0]?.area || 'code',
    detectedFeatures: Object.entries(patterns)
      .filter(([_, detected]) => detected)
      .map(([feature]) => feature),
  };
}

// ==========================================
// GENERATE MULTIPLE AI VARIATIONS
// ==========================================

async function generateAIVariations(commitMessage, diffSummary, repoName, platform) {
  // Build rich context from diff
  let diffContext = '';
  if (diffSummary) {
    diffContext = `
## Code Changes Analysis
- ${diffSummary.totalFiles} files changed (+${diffSummary.totalAdditions}/-${diffSummary.totalDeletions} lines)
- Main area: ${diffSummary.mainArea}
${diffSummary.categorized?.components?.length > 0 ? `- UI Components: ${diffSummary.categorized.components.slice(0, 3).join(', ')}` : ''}
${diffSummary.categorized?.api?.length > 0 ? `- API Routes: ${diffSummary.categorized.api.slice(0, 3).join(', ')}` : ''}
${diffSummary.categorized?.database?.length > 0 ? `- Database: ${diffSummary.categorized.database.slice(0, 3).join(', ')}` : ''}

## Detected Patterns
${diffSummary.detectedFeatures?.length > 0 ? diffSummary.detectedFeatures.map(f => `- ${formatFeature(f)}`).join('\n') : 'None specific'}

${diffSummary.patches?.length > 0 ? `
## Code Snippets (for context)
${diffSummary.patches.map(p => `### ${p.filename} (+${p.additions}/-${p.deletions})
\`\`\`
${p.patch}
\`\`\``).join('\n')}
` : ''}`;
  }

  const prompt = `You are helping a developer write authentic build-in-public tweets about their code commit.

## Commit Message
"${commitMessage}"

## Project
${repoName}
${diffContext}

## Your Task
Generate 5 DIFFERENT tweet variations for this commit. Each should have a unique style/angle:

1. **Short & Punchy** - Under 100 chars. One impactful line that hooks.
2. **Problem → Solution** - Frame as solving a problem. What pain does this fix?
3. **Behind the Scenes** - What you actually built. Technical but accessible.
4. **Milestone/Progress** - Frame as progress on the journey. Celebrate shipping.
5. **Casual/Conversational** - Like texting a dev friend about what you shipped.

## CRITICAL Rules
- Each tweet MUST be under 280 characters
- Include #buildinpublic on only 2-3 of them (vary it)
- Sound HUMAN, not AI-generated
- Focus on USER VALUE, not just technical details
- If the commit message is vague ("bug fixes", "updates", "wip"), INFER the real change from the code analysis
- Use emojis sparingly and naturally (max 2 per tweet)
- NEVER start multiple tweets the same way
- NEVER start with "I" on more than one tweet

## Examples of Great Inference
- Code adds validateCardNumber() → "Added payment validation so users don't fat-finger their card numbers 💳"
- Code fixes null check → "Squashed a crash that happened when users had empty profiles"
- Code adds dark mode CSS → "Dark mode is here. Your eyes can thank me later 🌙"
- addedAuth pattern detected → "Authentication is locked down. Your data stays yours 🔐"
- addedErrorHandling detected → "Better error handling means fewer mysteries when things break"

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
    return generateFallbackVariations(commitMessage, repoName, platform);
  }
}

// Format feature names for display
function formatFeature(feature) {
  const map = {
    addedValidation: 'Input validation added',
    fixedNullCheck: 'Null safety improved',
    addedErrorHandling: 'Error handling added',
    addedAuth: 'Authentication/security',
    addedUI: 'UI components',
    performance: 'Performance optimization',
    darkMode: 'Dark mode/theming',
    payment: 'Payment integration',
    database: 'Database changes',
    api: 'API endpoints',
    testing: 'Tests added',
    accessibility: 'Accessibility improvements',
    mobile: 'Mobile/responsive',
    security: 'Security hardening',
  };
  return map[feature] || feature;
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

  const diffContext = diffSummary ? `
Files changed: ${diffSummary.totalFiles} (+${diffSummary.totalAdditions}/-${diffSummary.totalDeletions})
Main area: ${diffSummary.mainArea}
Features detected: ${diffSummary.detectedFeatures?.join(', ') || 'none specific'}` : '';

  const prompt = `Write a single tweet about this commit:

Commit: ${commitMessage}
Project: ${repoName}
${diffContext}

Style: ${stylePrompts[style] || stylePrompts.casual}

Rules:
- Under 280 characters
- Sound human, not AI
- Include #buildinpublic if it fits naturally
- If commit message is vague, infer from context

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

  const shortContent = `Shipped: ${cleanMessage.slice(0, 70)} 🚀`;
  const problemContent = `The problem: needed ${cleanMessage.toLowerCase().slice(0, 50)}\n\nThe solution: built it myself\n\n#buildinpublic`;
  const technicalContent = `Today's build: ${cleanMessage.slice(0, 100)}\n\nWorking on ${repoName}. Progress feels good.\n\n#buildinpublic`;
  const milestoneContent = `✅ ${cleanMessage.slice(0, 120)}\n\nAnother step forward on ${repoName}.\n\n#buildinpublic`;
  const casualContent = `Just wrapped up: ${cleanMessage.slice(0, 100)}\n\nOnward 💪`;

  return [
    {
      style: 'short',
      label: 'Short & Punchy',
      content: shortContent.length > 280 ? shortContent.slice(0, 277) + '...' : shortContent,
      charCount: Math.min(shortContent.length, 280),
    },
    {
      style: 'problem',
      label: 'Problem → Solution',
      content: problemContent.length > 280 ? problemContent.slice(0, 277) + '...' : problemContent,
      charCount: Math.min(problemContent.length, 280),
    },
    {
      style: 'technical',
      label: 'Behind the Scenes',
      content: technicalContent.length > 280 ? technicalContent.slice(0, 277) + '...' : technicalContent,
      charCount: Math.min(technicalContent.length, 280),
    },
    {
      style: 'milestone',
      label: 'Milestone Update',
      content: milestoneContent.length > 280 ? milestoneContent.slice(0, 277) + '...' : milestoneContent,
      charCount: Math.min(milestoneContent.length, 280),
    },
    {
      style: 'casual',
      label: 'Casual',
      content: casualContent.length > 280 ? casualContent.slice(0, 277) + '...' : casualContent,
      charCount: Math.min(casualContent.length, 280),
    },
  ];
}