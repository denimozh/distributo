import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { rateLimit } from '@/lib/rate-limit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const authHeader = request.headers.get('authorization');
    let userId;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id;
    }
    if (!userId) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      userId = user?.id;
    }
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const limit = rateLimit(`voice:${userId}`, 3, 3600000);
    if (limit.limited) return NextResponse.json({ error: 'Too many analyses. Try again later.' }, { status: 429 });

    const { posts } = await request.json();
    if (!posts || posts.trim().length < 50) {
      return NextResponse.json({ error: 'Paste at least a few example posts.' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Analyze these social media posts and extract the writer's style. Return ONLY valid JSON.\n\nPosts:\n${posts.slice(0, 5000)}\n\nReturn:\n{"summary":"one sentence","tone":"e.g. casual","sentence_style":"e.g. short and punchy","emoji_usage":"e.g. none","formatting":"e.g. broetry","signature_phrases":["up to 5"],"never_does":["up to 5"],"example_posts":["3 best posts verbatim"]}`
      }],
    });

    let styleProfile;
    try {
      const cleaned = (message.content[0]?.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      styleProfile = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to analyze. Try again.' }, { status: 500 });
    }

    await supabase.from('profiles').update({ style_profile: styleProfile, updated_at: new Date().toISOString() }).eq('id', userId);

    return NextResponse.json({ success: true, styleProfile });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
