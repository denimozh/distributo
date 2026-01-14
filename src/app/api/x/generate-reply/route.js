import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function POST(request) {
  try {
    const { tweetContent, authorUsername, context } = await request.json();

    if (!tweetContent) {
      return NextResponse.json({ error: 'Tweet content is required' }, { status: 400 });
    }

    // Get user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let suggestions;

    if (anthropic) {
      suggestions = await generateWithAI(tweetContent, authorUsername, context);
    } else {
      suggestions = generateFallbackReplies(tweetContent);
    }

    return NextResponse.json({
      success: true,
      suggestions,
      usedAI: !!anthropic,
    });

  } catch (err) {
    console.error('[REPLY] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function generateWithAI(tweetContent, authorUsername, context) {
  const prompt = `You are helping a founder/developer craft authentic replies to tweets for building relationships and growing their audience.

## Tweet to Reply To:
Author: @${authorUsername || 'unknown'}
Content: "${tweetContent}"
${context ? `Context: ${context}` : ''}

## Your Task:
Generate 3 different reply suggestions. Each should have a different angle:

1. **Value-Add Reply**: Share a relevant insight, tip, or personal experience that adds to the conversation
2. **Curious/Question Reply**: Ask a thoughtful follow-up question that shows genuine interest
3. **Relatable/Supportive Reply**: Show you relate to what they're saying or support their point

## Rules:
- Keep each reply under 280 characters
- Sound authentic and human, not promotional
- Don't be sycophantic ("Great post!" is lazy)
- Don't pitch yourself or your product
- Be specific to what they actually said
- Match their energy/tone
- Avoid starting with "I" if possible

## Output Format:
Return ONLY a JSON array with 3 strings:
["reply 1", "reply 2", "reply 3"]

No other text, just the JSON array.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.trim();
  
  // Parse JSON from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Invalid AI response format');
  }

  return JSON.parse(jsonMatch[0]);
}

function generateFallbackReplies(tweetContent) {
  // Basic fallback replies when AI is not available
  return [
    "This resonates - would love to hear more about your experience with this.",
    "Interesting perspective. What led you to this conclusion?",
    "Appreciate you sharing this. Building in public makes the journey less lonely.",
  ];
}