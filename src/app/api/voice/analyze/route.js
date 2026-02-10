import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { userId, posts } = await request.json();
    if (!userId || !posts || !posts.length) {
      return NextResponse.json({ error: 'userId and posts array required' }, { status: 400 });
    }

    // Take up to 25 posts
    const samplePosts = posts.slice(0, 25).map(p => typeof p === 'string' ? p : p.text || p.content || '').filter(Boolean);
    if (samplePosts.length < 3) {
      return NextResponse.json({ error: 'Need at least 3 posts to analyze voice' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: `Analyze the writing style/voice of these ${samplePosts.length} social media posts. Extract a concise "voice profile" that can be used to generate new content in the same voice.

POSTS:
${samplePosts.map((p, i) => `${i + 1}. "${p}"`).join('\n')}

Return ONLY valid JSON:
{
  "summary": "One sentence describing overall voice",
  "tone": "primary tone (e.g. casual, witty, technical, raw, professional)",
  "sentence_style": "how they write sentences (e.g. short punchy, medium flowing, long detailed)",
  "vocabulary_level": "simple|moderate|technical|mixed",
  "emoji_usage": "none|rare|moderate|frequent",
  "punctuation_style": "description of how they use punctuation",
  "signature_phrases": ["phrases or patterns they repeat"],
  "formatting_preference": "broetry|paragraphs|one-liners|mixed",
  "hook_patterns": ["how they typically start posts"],
  "topics": ["what they usually talk about"],
  "personality_traits": ["observable traits like humor, vulnerability, directness"],
  "writing_rules": [
    "Rule 1: specific instruction for mimicking their voice",
    "Rule 2: ...",
    "Rule 3: ...",
    "Rule 4: ...",
    "Rule 5: ..."
  ]
}` }],
    });

    const text = response.content[0].text.trim();
    let profile;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      profile = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch {
      return NextResponse.json({ error: 'Failed to parse voice profile' }, { status: 500 });
    }

    // Save to profile
    await supabase.from('profiles').update({
      style_profile: profile,
      style_analyzed_at: new Date().toISOString(),
    }).eq('id', userId);

    return NextResponse.json({ success: true, profile, posts_analyzed: samplePosts.length });
  } catch (error) {
    console.error('[VOICE] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
