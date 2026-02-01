// src/app/api/github/generate-post/route.js
//
// Generates social media posts from GitHub commits
// NOW WITH ACTUAL CODE DIFF ANALYSIS!
// Fetches real code changes from GitHub to understand what was actually built

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { 
      commitId,
      commitMessage, 
      diffSummary, 
      additions, 
      deletions, 
      filesChanged,
      repoName,
      tone = 'founder',
      platform = 'x'
    } = await request.json();

    if (!commitMessage) {
      return NextResponse.json({ error: 'Commit message required' }, { status: 400 });
    }

    console.log('[GitHub Generate] Starting for:', { commitMessage, repoName, tone, platform });

    // Get user profile for context
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('product_name, product_description, target_audience')
      .eq('user_id', user.id)
      .single();

    // Get GitHub access token to fetch actual diff
    const { data: githubAccount } = await supabaseAdmin
      .from('connected_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'github')
      .eq('is_active', true)
      .single();

    // Try to get actual code diff from GitHub
    let actualCodeChanges = null;
    if (githubAccount?.access_token && commitId) {
      // Get the commit SHA from our database
      const { data: commitData } = await supabase
        .from('github_commits')
        .select('sha, github_repos(repo_full_name)')
        .eq('id', commitId)
        .single();

      if (commitData?.sha && commitData?.github_repos?.repo_full_name) {
        actualCodeChanges = await fetchCommitDiff(
          commitData.github_repos.repo_full_name,
          commitData.sha,
          githubAccount.access_token
        );
        console.log('[GitHub Generate] Fetched actual code changes:', actualCodeChanges ? 'yes' : 'no');
      }
    }

    // Generate the post with actual code context
    const content = await generateCommitPost({
      commitMessage,
      diffSummary,
      additions,
      deletions,
      filesChanged,
      repoName,
      tone,
      platform,
      profile,
      actualCodeChanges, // NEW: Pass actual code changes
    });

    console.log('[GitHub Generate] Generated content:', content?.slice(0, 100) + '...');

    if (!content) {
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    // Mark commit as having post generated
    if (commitId) {
      await supabase
        .from('github_commits')
        .update({ post_generated: true })
        .eq('id', commitId);
    }

    return NextResponse.json({
      success: true,
      content,
      tone,
      platform,
      hasCodeContext: !!actualCodeChanges,
    });

  } catch (error) {
    console.error('[GitHub Generate] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================================
// FETCH ACTUAL CODE DIFF FROM GITHUB
// ============================================================================

async function fetchCommitDiff(repoFullName, sha, accessToken) {
  try {
    console.log(`[GitHub] Fetching diff for ${repoFullName}@${sha}`);
    
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
      console.error('[GitHub] Failed to fetch commit:', response.status);
      return null;
    }

    const data = await response.json();
    
    // Process the diff into something useful
    const files = data.files || [];
    
    // Filter out noise files
    const ignorePatterns = [
      'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
      '.gitignore', '.env', 'node_modules', '.DS_Store',
      '.next', 'dist/', 'build/'
    ];

    const relevantFiles = files.filter(file => {
      const filename = file.filename.toLowerCase();
      return !ignorePatterns.some(pattern => filename.includes(pattern.toLowerCase()));
    });

    // Categorize changes
    const changes = {
      features: [],      // New functionality
      components: [],    // UI components
      api: [],          // API routes
      styles: [],       // CSS/styling
      config: [],       // Configuration
      other: [],        // Everything else
    };

    for (const file of relevantFiles) {
      const filename = file.filename;
      const patch = file.patch || '';
      
      // Extract meaningful additions (lines starting with +, excluding ++)
      const addedLines = patch
        .split('\n')
        .filter(line => line.startsWith('+') && !line.startsWith('+++'))
        .map(line => line.slice(1).trim())
        .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('import'));

      const fileInfo = {
        filename,
        additions: file.additions,
        deletions: file.deletions,
        // Get key code snippets (first 5 meaningful lines)
        keyChanges: addedLines.slice(0, 5),
      };

      // Categorize
      if (filename.includes('/api/') || filename.includes('route.')) {
        changes.api.push(fileInfo);
      } else if (filename.includes('component') || filename.includes('/ui/') || filename.endsWith('.tsx') || filename.endsWith('.jsx')) {
        changes.components.push(fileInfo);
      } else if (filename.includes('.css') || filename.includes('style') || filename.includes('tailwind')) {
        changes.styles.push(fileInfo);
      } else if (filename.includes('config') || filename.includes('.json') || filename.includes('.env')) {
        changes.config.push(fileInfo);
      } else if (addedLines.some(line => line.includes('function') || line.includes('const ') || line.includes('export'))) {
        changes.features.push(fileInfo);
      } else {
        changes.other.push(fileInfo);
      }
    }

    // Build a summary
    const summary = {
      totalFiles: relevantFiles.length,
      totalAdditions: relevantFiles.reduce((sum, f) => sum + f.additions, 0),
      totalDeletions: relevantFiles.reduce((sum, f) => sum + f.deletions, 0),
      categories: changes,
      // Key insights for AI
      keyInsights: extractKeyInsights(changes),
    };

    return summary;
  } catch (error) {
    console.error('[GitHub] Error fetching diff:', error);
    return null;
  }
}

// Extract meaningful insights from code changes
function extractKeyInsights(changes) {
  const insights = [];

  // Check for new API endpoints
  if (changes.api.length > 0) {
    const endpoints = changes.api.map(f => f.filename.replace(/.*\/api\//, '/api/').replace('/route.js', ''));
    insights.push(`New/modified API endpoints: ${endpoints.join(', ')}`);
  }

  // Check for new components
  if (changes.components.length > 0) {
    const componentNames = changes.components.map(f => {
      const match = f.filename.match(/([^/]+)\.(tsx|jsx|js)$/);
      return match ? match[1] : f.filename;
    });
    insights.push(`UI components: ${componentNames.join(', ')}`);
  }

  // Look for specific patterns in code
  const allKeyChanges = [
    ...changes.features.flatMap(f => f.keyChanges),
    ...changes.components.flatMap(f => f.keyChanges),
    ...changes.api.flatMap(f => f.keyChanges),
  ];

  // Find function definitions
  const newFunctions = allKeyChanges
    .filter(line => line.includes('function ') || line.match(/const \w+ = (\(|async)/))
    .slice(0, 3);
  
  if (newFunctions.length > 0) {
    insights.push(`New functions: ${newFunctions.map(f => f.slice(0, 50)).join('; ')}`);
  }

  // Find state/hooks usage
  const stateChanges = allKeyChanges.filter(line => 
    line.includes('useState') || line.includes('useEffect') || line.includes('useMemo')
  );
  if (stateChanges.length > 0) {
    insights.push('Added React state management');
  }

  // Find database operations
  const dbOps = allKeyChanges.filter(line => 
    line.includes('.from(') || line.includes('.insert(') || line.includes('.update(') || line.includes('.select(')
  );
  if (dbOps.length > 0) {
    insights.push('Database operations added/modified');
  }

  return insights;
}

// ============================================================================
// GENERATE POST WITH AI (Using actual code context!)
// ============================================================================

async function generateCommitPost({ 
  commitMessage, 
  diffSummary, 
  additions, 
  deletions, 
  filesChanged,
  repoName,
  tone,
  platform,
  profile,
  actualCodeChanges // NEW: Real code diff from GitHub
}) {
  console.log('[GitHub Generate] Anthropic available:', !!anthropic);
  console.log('[GitHub Generate] Has actual code changes:', !!actualCodeChanges);
  
  if (!anthropic) {
    console.log('[GitHub Generate] Using template fallback');
    const result = generateTemplatePost(commitMessage, tone, platform, actualCodeChanges);
    console.log('[GitHub Generate] Template result:', result);
    return result;
  }

  const toneInstructions = {
    dev: `You're writing for DEVELOPERS and TECHNICAL FOUNDERS.
Focus on:
- The technical "how" - what was actually built, specific functions/components
- Code patterns, architecture decisions visible in the diff
- Developer experience improvements
- Technical challenges that the code changes reveal
Tone: Enthusiastic but knowledgeable. Be SPECIFIC about what the code does.
Example: "Just implemented lazy loading using Intersection Observer. The Feed component now only renders visible items - cut initial load from 3.2s to 0.8s."`,

    founder: `You're writing for CUSTOMERS and POTENTIAL USERS.
Focus on:
- The "why" - what value this adds for users (derive from what the code actually does)
- New features visible in the code (new components, API endpoints, etc.)
- Problem → Solution narrative based on actual changes
- Building in public journey - share the real progress
Tone: Excited but professional. Focus on VALUE, derived from actual code changes.
Example: "Just shipped faster loading for your feed. Images now load as you scroll, not all at once. Small change, big impact on your experience."`,
  };

  const platformInstructions = {
    x: `Write for X (Twitter).
- Max 280 characters STRICT
- Punchy, direct hook that shows you know what you built
- Reference specific things from the code (component names, features)
- Can include 1-2 relevant emojis
- End with #buildinpublic`,

    linkedin: `Write for LinkedIn.
- 150-300 words
- Professional but authentic - show real technical progress
- Reference specific files/features that changed
- Start with the outcome/benefit hook
- Include technical context that proves you know your code
- End with a question or CTA`,
  };

  // Build context from ACTUAL CODE CHANGES
  let codeContext = '';
  
  if (actualCodeChanges) {
    codeContext = `
ACTUAL CODE CHANGES (from GitHub diff):
- Files changed: ${actualCodeChanges.totalFiles}
- Lines added: +${actualCodeChanges.totalAdditions}
- Lines deleted: -${actualCodeChanges.totalDeletions}

KEY INSIGHTS FROM THE CODE:
${actualCodeChanges.keyInsights.map(i => `• ${i}`).join('\n')}

DETAILED CHANGES BY CATEGORY:`;

    const cats = actualCodeChanges.categories;
    
    if (cats.api.length > 0) {
      codeContext += `\n\nAPI/Backend changes:`;
      cats.api.forEach(f => {
        codeContext += `\n  - ${f.filename} (+${f.additions}/-${f.deletions})`;
        if (f.keyChanges.length > 0) {
          codeContext += `\n    Key code: ${f.keyChanges[0].slice(0, 80)}`;
        }
      });
    }
    
    if (cats.components.length > 0) {
      codeContext += `\n\nUI Component changes:`;
      cats.components.forEach(f => {
        codeContext += `\n  - ${f.filename} (+${f.additions}/-${f.deletions})`;
        if (f.keyChanges.length > 0) {
          codeContext += `\n    Key code: ${f.keyChanges[0].slice(0, 80)}`;
        }
      });
    }
    
    if (cats.features.length > 0) {
      codeContext += `\n\nNew features/functions:`;
      cats.features.forEach(f => {
        codeContext += `\n  - ${f.filename} (+${f.additions}/-${f.deletions})`;
        if (f.keyChanges.length > 0) {
          codeContext += `\n    Key code: ${f.keyChanges[0].slice(0, 80)}`;
        }
      });
    }
  } else if (diffSummary) {
    // Fallback to stored diff summary
    codeContext = `
CODE CHANGES (from stored summary):
- Files: ${diffSummary.files?.map(f => f.filename || f).join(', ') || 'Unknown'}
- Summary: ${diffSummary.summary || 'No summary available'}`;
  }

  const prompt = `You are a developer who builds in public. Generate a social media post about this commit.

COMMIT MESSAGE (often vague - look at actual code instead):
"${commitMessage}"

${codeContext}

REPO: ${repoName || 'Personal project'}

${profile?.product_name ? `PRODUCT CONTEXT:
- Product: ${profile.product_name}
- Description: ${profile.product_description || 'Not specified'}
- Target audience: ${profile.target_audience || 'Developers'}` : ''}

TONE:
${toneInstructions[tone] || toneInstructions.founder}

PLATFORM:
${platformInstructions[platform] || platformInstructions.x}

CRITICAL RULES:
1. DO NOT just repeat the commit message - analyze the ACTUAL CODE CHANGES
2. Be specific - mention actual files, functions, or features from the diff
3. If commit says "fixed bugs" but code shows a new feature, talk about the feature!
4. Sound human, not corporate
5. Show you actually understand what the code does
6. Never use "excited to announce" or similar cliches

Write ONLY the post content. No quotes, no explanations.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: platform === 'x' ? 300 : 800,
    messages: [{ role: 'user', content: prompt }],
  });

  let content = response.content[0].text.trim();
  
  // Ensure X posts are within limit
  if (platform === 'x' && content.length > 280) {
    content = content.slice(0, 277) + '...';
  }

  return content;
}

// ============================================================================
// TEMPLATE FALLBACK (when no API key)
// ============================================================================

function generateTemplatePost(commitMessage, tone, platform, actualCodeChanges) {
  const msg = String(commitMessage || 'Code update').trim();
  
  // If we have actual code changes, make the template smarter
  let feature = msg;
  if (actualCodeChanges && actualCodeChanges.keyInsights.length > 0) {
    feature = actualCodeChanges.keyInsights[0];
  }
  
  // Get file context
  let fileContext = '';
  if (actualCodeChanges) {
    const cats = actualCodeChanges.categories;
    if (cats.api.length > 0) {
      fileContext = cats.api[0].filename;
    } else if (cats.components.length > 0) {
      fileContext = cats.components[0].filename;
    } else if (cats.features.length > 0) {
      fileContext = cats.features[0].filename;
    }
  }
  
  const templates = {
    dev: {
      x: [
        fileContext 
          ? `Just updated ${fileContext.split('/').pop()}\n\n${feature.slice(0, 100)}\n\n#buildinpublic`
          : `Just shipped: ${msg.slice(0, 100)}\n\nAnother brick in the wall. #buildinpublic`,
        `${feature.slice(0, 150)}\n\n→ Pushed, deployed, moving on.\n\n#buildinpublic`,
        actualCodeChanges 
          ? `+${actualCodeChanges.totalAdditions}/-${actualCodeChanges.totalDeletions} lines\n\n${feature.slice(0, 120)}\n\n#buildinpublic`
          : `Code update: ${msg.slice(0, 120)}\n\nSmall wins compound. #buildinpublic`,
      ],
      linkedin: [
        `Just pushed: ${feature}\n\n${actualCodeChanges ? `Changed ${actualCodeChanges.totalFiles} files (+${actualCodeChanges.totalAdditions}/-${actualCodeChanges.totalDeletions} lines).` : ''}\n\nIt might seem small, but these incremental improvements are what separate shipped products from abandoned side projects.\n\nEvery commit is a vote for the product you're building.\n\nWhat did you ship today?`,
      ],
    },
    founder: {
      x: [
        `New improvement just went live:\n\n${feature.slice(0, 100)}\n\nBuilding every day. #buildinpublic`,
        `${feature.slice(0, 150)}\n\nThis is what "building in public" actually looks like. #buildinpublic`,
        actualCodeChanges
          ? `Shipped ${actualCodeChanges.totalFiles} file${actualCodeChanges.totalFiles > 1 ? 's' : ''} today.\n\n${feature.slice(0, 100)}\n\n#buildinpublic`
          : `${msg.slice(0, 150)}\n\n#buildinpublic`,
      ],
      linkedin: [
        `Just shipped: ${feature}\n\n${actualCodeChanges ? `This update touched ${actualCodeChanges.totalFiles} files with ${actualCodeChanges.totalAdditions} additions.` : ''}\n\nBuilding a product is a marathon of tiny improvements. Today's update might not make headlines, but it makes the product better for our users.\n\nThat's what matters.\n\nWhat are you working on this week?`,
      ],
    },
  };

  const toneTemplates = templates[tone] || templates.founder;
  const platformTemplates = toneTemplates[platform] || toneTemplates.x;
  
  const result = platformTemplates[Math.floor(Math.random() * platformTemplates.length)];
  return result || `Shipped: ${msg.slice(0, 200)} #buildinpublic`;
}