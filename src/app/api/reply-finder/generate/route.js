import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic();
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { 
      userId, 
      tweetContent, 
      authorUsername,
      authorName,
      productName,
      productDescription,
      productUrl,
    } = await request.json();

    if (!userId || !tweetContent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user's profile if not provided
    let product = { name: productName, description: productDescription, url: productUrl };
    
    if (!product.name) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('product_name, product_description, product_url')
        .eq('id', userId)
        .single();
      
      if (profile) {
        product = {
          name: profile.product_name,
          description: profile.product_description,
          url: profile.product_url,
        };
      }
    }

    // Generate the reply
    const reply = await generateReply(tweetContent, authorUsername, product);

    return NextResponse.json({ 
      success: true, 
      reply,
    });

  } catch (err) {
    console.error('[GENERATE-REPLY] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function generateReply(tweetContent, authorUsername, product) {
  const hasProduct = product?.name && product?.description;
  
  const prompt = `You are an indie hacker who writes authentic, engaging Twitter replies. Your replies get lots of likes because they're genuinely helpful, not promotional spam.

## THE TWEET YOU'RE REPLYING TO
Author: ${authorUsername}
Content: "${tweetContent}"

${hasProduct ? `## YOUR PRODUCT (mention ONLY if naturally relevant)
Name: ${product.name}
What it does: ${product.description}
${product.url ? `URL: ${product.url}` : ''}` : ''}

## REPLY STRATEGIES (pick the most appropriate)

1. **Share Experience** - If you've dealt with this problem, share briefly what worked
2. **Add Value** - Contribute a useful insight, tip, or resource
3. **Ask Smart Question** - Show genuine curiosity that advances the conversation
4. **Relate & Support** - Acknowledge their point and build on it
5. **Gentle Product Mention** - ONLY if your product directly solves their problem

## RULES FOR GREAT REPLIES

✅ DO:
- Sound like a real person, not a brand
- Be specific to what they actually said
- Add value to the conversation
- Keep it under 240 characters (leave room for mentions)
- Use their name/handle naturally if it fits
- Share personal experience when relevant

❌ DON'T:
- Start with "Great post!" or similar sycophancy
- Be obviously promotional or salesy
- Use corporate marketing speak
- Make it about you/your product unless directly relevant
- Use excessive emojis or hashtags
- Write generic responses that could apply to any tweet

${hasProduct ? `## PRODUCT MENTION GUIDELINES
- Only mention your product if the tweet is DIRECTLY about a problem your product solves
- Frame it as sharing what worked for you, not pitching
- Don't use marketing language ("revolutionary", "game-changing")
- Include URL only if genuinely helpful (max 1 time)
- If not relevant, DON'T mention it at all - add pure value instead` : ''}

## EXAMPLES OF GOOD REPLIES

Tweet: "What tools are you using to automate your marketing?"
Good reply: "Honestly, I was manual for months until the burnout hit. Now I use a mix of Buffer for scheduling and built a small tool for auto-generating posts from my work. Happy to share what's working if useful!"

Tweet: "Building in public is exhausting. Content every day is too much."
Good reply: "Felt this. I switched from daily posting to 3x/week and batching content on Sundays. Less burnout, better quality. What's your current cadence?"

Tweet: "Hot take: most founders spend too much time building"
Good reply: "Counter: most founders spend time on the WRONG marketing. 10 hrs/week posting mid content < 2 hrs/week engaging in the right conversations. Quality > quantity."

## YOUR TASK
Write ONE reply that:
1. Is genuinely helpful or adds to the conversation
2. Sounds like a real indie hacker, not a brand
3. Is under 240 characters
4. ${hasProduct ? "Mentions your product ONLY if directly relevant to their problem" : "Adds pure value without any promotion"}

Return ONLY the reply text, nothing else.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    let reply = response.content[0].text.trim();
    
    // Remove any quotes that might wrap the reply
    reply = reply.replace(/^["']|["']$/g, '');
    
    // Ensure under 280 characters
    if (reply.length > 280) {
      reply = reply.slice(0, 277) + '...';
    }

    return reply;

  } catch (err) {
    console.error('[GENERATE-REPLY] Claude error:', err);
    
    // Fallback replies
    const fallbacks = [
      "This resonates. Would love to hear more about what's working for you.",
      "Felt this. What's been your biggest win so far?",
      "Interesting take. Have you tried approaching it from [X] angle?",
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}