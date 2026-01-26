import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { userId, tweetContent, tweetAuthor, matchedKeyword } = await request.json();

    if (!userId || !tweetContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user profile for context
    const { data: profile } = await supabase
      .from('profiles')
      .select('product_name, product_description, target_audience')
      .eq('id', userId)
      .single();

    const productContext = profile?.product_name 
      ? `You are replying on behalf of someone who built "${profile.product_name}" - ${profile.product_description || 'a product'}`
      : 'You are replying as an indie hacker / founder';

    const prompt = `You are an expert at writing engaging X/Twitter replies that add genuine value and subtly build relationships.

## CONTEXT
${productContext}
Target audience: ${profile?.target_audience || 'developers, founders, indie hackers'}

## THE TWEET TO REPLY TO
Author: ${tweetAuthor}
Content: "${tweetContent}"
${matchedKeyword ? `Matched keyword: ${matchedKeyword}` : ''}

## YOUR TASK
Write a reply that:
1. Adds genuine value (insight, answer, helpful perspective)
2. Shows you understand their situation
3. Is conversational and authentic (NOT salesy)
4. Is under 280 characters
5. Does NOT directly promote anything (that comes later naturally)
6. Ends with something that invites further conversation if appropriate

## REPLY STYLE RULES
- Be specific, not generic
- No corporate speak
- No "Great point!" or empty praise
- If they asked a question, actually answer it
- Share your experience if relevant
- It's OK to be slightly contrarian if you have a good take

## EXAMPLES OF GOOD REPLIES

Tweet: "What's the best way to stay consistent with marketing as a solo founder?"
Reply: "What worked for me: I batch create content on Sunday nights (2 hrs) and schedule for the whole week. The trick is making it part of your build routine, not a separate task. What's eating most of your time right now?"

Tweet: "I hate writing social media posts. It feels so fake."
Reply: "It's only fake if you're writing what you think people want to hear. Try this: just share what you're actually working on today. Real > polished."

Tweet: "Building in public is overrated. Nobody cares about your startup journey."
Reply: "Depends who you're building for tbh. If your customers ARE other builders, it's gold. If they're enterprise clients? Probably waste of time. Context matters more than the strategy."

## OUTPUT
Write ONLY the reply text. No quotes, no explanation, just the reply. Under 280 characters.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const reply = response.content[0].text.trim();

    // Ensure under 280 chars
    const finalReply = reply.length > 280 ? reply.slice(0, 277) + '...' : reply;

    return NextResponse.json({
      success: true,
      reply: finalReply,
      charCount: finalReply.length,
    });

  } catch (error) {
    console.error('[GENERATE-REPLY] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to generate reply' 
    }, { status: 500 });
  }
}