import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function POST(request) {
  try {
    const { content, tone = 'professional', addHashtags = true, sourcePostId } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let linkedinContent;

    // Use AI for tone adaptation if available
    if (anthropic) {
      linkedinContent = await convertWithAI(content, tone, addHashtags);
    } else {
      linkedinContent = convertWithTemplate(content, addHashtags);
    }

    // Save as LinkedIn draft
    const { data: post, error: postError } = await supabaseAdmin
      .from('posts')
      .insert({
        user_id: user.id,
        content: linkedinContent,
        platform: 'linkedin',
        status: 'draft',
        source: 'x_crosspost',
        source_post_id: sourcePostId,
      })
      .select()
      .single();

    if (postError) {
      console.error('[LINKEDIN] Error creating draft:', postError);
      throw postError;
    }

    // Mark original X post as cross-posted
    if (sourcePostId) {
      await supabaseAdmin
        .from('posts')
        .update({ cross_posted_linkedin: true })
        .eq('id', sourcePostId);
    }

    return NextResponse.json({
      success: true,
      post,
      usedAI: !!anthropic,
    });

  } catch (err) {
    console.error('[LINKEDIN] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function convertWithAI(xContent, tone, addHashtags) {
  const toneInstructions = {
    professional: `Convert to a professional LinkedIn tone:
- Expand abbreviated thoughts into complete sentences
- Remove casual slang and emojis (keep 1-2 relevant ones max)
- Add context that would be valuable to a professional audience
- Make it sound like a thoughtful industry insight
- Keep it authentic, not corporate-speak`,
    
    'thought-leader': `Convert to a thought-leader LinkedIn style:
- Frame as an insight or lesson learned
- Add a hook that makes people stop scrolling
- Include a perspective or opinion
- Make it slightly provocative or contrarian if appropriate
- End with a question or call-to-action`,
    
    storytelling: `Convert to a storytelling LinkedIn format:
- Start with a hook (one-line opener)
- Add line breaks for readability
- Build a mini-narrative arc
- Include a lesson or takeaway
- Make it personal and relatable`,
  };

  const prompt = `You are converting a casual X/Twitter post into LinkedIn content.

## Original X Post:
${xContent}

## Tone Instructions:
${toneInstructions[tone] || toneInstructions.professional}

## Rules:
1. Keep the core message but expand and professionalize
2. LinkedIn posts can be longer - aim for 150-300 words if the content warrants it
3. Use line breaks for readability
4. Don't start with "I" if possible
5. Sound human, not AI-generated
6. ${addHashtags ? 'Add 3-5 relevant hashtags at the end' : 'Do not add hashtags'}

## Output:
Write ONLY the LinkedIn post, nothing else.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
}

function convertWithTemplate(xContent, addHashtags) {
  // Basic template conversion without AI
  let converted = xContent
    // Remove Twitter-specific elements
    .replace(/#buildinpublic/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Expand common abbreviations
  converted = converted
    .replace(/\bimo\b/gi, 'in my opinion')
    .replace(/\btbh\b/gi, 'to be honest')
    .replace(/\bw\//g, 'with ')
    .replace(/\bb\/c\b/gi, 'because');

  // Add LinkedIn formatting
  if (addHashtags) {
    converted += '\n\n#Technology #SoftwareDevelopment #BuildInPublic #StartupLife #Entrepreneurship';
  }

  return converted;
}