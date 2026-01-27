// src/app/api/linkedin/generate/route.js
//
// AI-powered LinkedIn content generation using viral frameworks:
// - Hook → Story → Lesson → CTA structure
// - Contrarian takes that spark engagement
// - Lead magnet posts for comments/virality
// - Proper formatting with line breaks
// - First comment generation for links

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// Content bucket prompts (based on the 40-30-20-10 rule)
const BUCKET_PROMPTS = {
  authority: `You're writing AUTHORITY content (40% of posts).
Goal: Position yourself as THE expert in your niche.
Style: Share frameworks, methodologies, contrarian takes.
Tone: Confident, slightly provocative, backed by experience.
Example angles:
- "Everyone's doing X wrong. Here's why..."
- "The framework I used to achieve [result]"
- "Unpopular opinion: [contrarian take]"`,

  educational: `You're writing EDUCATIONAL content (30% of posts).
Goal: Provide massive value that makes readers think "if this is free, imagine the paid stuff"
Style: How-to content, tutorials, step-by-step guides.
Tone: Helpful, generous, teacher-like.
Example angles:
- "How to [achieve result] in [timeframe]"
- "5 mistakes killing your [area]"
- "The exact process I use for [task]"`,

  'social-proof': `You're writing SOCIAL PROOF content (20% of posts).
Goal: Show real results without bragging - teach through case studies.
Style: 80% educational, 20% promotional.
Tone: Humble but confident, results-focused.
Example angles:
- "How we helped [client type] achieve [result]"
- "Before: [problem]. After: [result]. Here's what changed..."
- "Just hit [milestone]. Here's the exact playbook..."`,

  personal: `You're writing PERSONAL content (10% of posts).
Goal: Connect as a human, show the journey behind the success.
Style: Vulnerable, relatable, authentic.
Tone: Conversational, honest about failures too.
Example angles:
- "I failed at [thing]. Here's what I learned..."
- "The truth about [aspect of your work] nobody talks about"
- "What [experience] taught me about [lesson]"`,
};

// Post format structures
const FORMAT_STRUCTURES = {
  'hook-story': `Structure your post as:
1. HOOK (1 line): A bold statement, surprising stat, or pattern interrupt that makes them stop scrolling
2. STORY (main body): Walk through the narrative with specific details
3. LESSON (2-3 lines): The key insight or takeaway
4. CTA (1 line): Invite engagement (question, ask for their experience)

Use short paragraphs (1-2 sentences max).
Add a line break after every 1-2 sentences for mobile readability.`,

  contrarian: `Structure your post as:
1. CONTRARIAN HOOK: State the popular belief, then challenge it
2. EVIDENCE: 3-4 specific reasons why the common wisdom is wrong
3. ALTERNATIVE: What they should do instead
4. PROOF: Brief example or result from doing it differently
5. CTA: Ask if they agree/disagree

Be bold but back it up. Controversy without substance is just noise.`,

  'list-post': `Structure your post as:
1. HOOK: Bold claim about what they'll learn
2. NUMBERED LIST: 5-7 actionable items with brief explanations
3. BONUS: One extra tip or insight
4. CTA: Save this post + tag someone who needs it

Each list item should be scannable (1-2 lines max).
Use emojis sparingly (one per item max).`,

  'lead-magnet': `Structure your post as:
1. HOOK: Massive value promise (what they'll get)
2. VALUE STACK: 5-7 specific things included in the resource
3. CREDIBILITY: Why you're qualified to create this
4. SOCIAL PROOF: How many people have used it / results
5. CTA: "Comment [WORD] and I'll DM you the link"

Make it feel like they'd be stupid NOT to comment.
The resource should solve a specific painful problem.`,

  'case-study': `Structure your post as:
1. HOOK: The headline result (specific number)
2. SITUATION: What was the problem/starting point
3. APPROACH: What specifically was done (teach the method)
4. RESULTS: Specific outcomes with numbers
5. LESSONS: 2-3 key takeaways others can apply
6. CTA: Ask what challenges they're facing

80% teach the method, 20% mention it was your work.`,
};

// LinkedIn formatting rules
const FORMATTING_RULES = `
CRITICAL LINKEDIN FORMATTING RULES:
- First line MUST be a hook that makes them click "see more"
- Use line breaks after every 1-2 sentences
- Short paragraphs (2-3 lines max)
- NO hashtags in the main post (save for end or skip entirely)
- NO emojis in the first line
- Limit emojis to 2-3 total if any
- NO links in the post (put in first comment)
- Write like you're talking to a smart friend, not a corporate memo
- Be specific with numbers and results when possible
- End with engagement driver (question or call to action)
- Total length: 150-300 words ideal (can go up to 500 for value-packed posts)
`;

export async function POST(request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { topic, bucket, format, profile } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Build context from user profile
    let profileContext = '';
    if (profile) {
      profileContext = `
ABOUT THE AUTHOR:
- Product/Service: ${profile.product_name || 'Not specified'}
- Description: ${profile.product_description || 'Not specified'}
- Target Audience: ${profile.target_audience || 'B2B professionals'}
- Niche/Industry: ${profile.niche || 'Technology/SaaS'}
- Tone preference: ${profile.tone_preference || 'Professional but approachable'}
`;
    }

    // Generate the content
    const content = await generateLinkedInPost(
      topic,
      bucket,
      format,
      profileContext
    );

    // Generate first comment suggestion if relevant
    let firstComment = null;
    if (format === 'lead-magnet' || profile?.product_url) {
      firstComment = await generateFirstComment(topic, profile);
    }

    return NextResponse.json({
      success: true,
      content,
      firstComment,
      bucket,
      format,
    });

  } catch (error) {
    console.error('[LinkedIn Generate] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function generateLinkedInPost(topic, bucket, format, profileContext) {
  if (!anthropic) {
    return generateTemplatePost(topic, bucket, format);
  }

  const bucketPrompt = BUCKET_PROMPTS[bucket] || BUCKET_PROMPTS.authority;
  const formatPrompt = FORMAT_STRUCTURES[format] || FORMAT_STRUCTURES['hook-story'];

  const prompt = `You are a LinkedIn ghostwriter who creates viral content for thought leaders and founders.

${bucketPrompt}

${formatPrompt}

${FORMATTING_RULES}

${profileContext}

TOPIC/IDEA TO WRITE ABOUT:
${topic}

Write the LinkedIn post now. Output ONLY the post content, nothing else.
No preamble, no explanations, no quotes around the output.
Make it specific, valuable, and engaging.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  });

  let content = response.content[0].text.trim();
  
  // Post-process to ensure proper formatting
  content = postProcessLinkedInContent(content);
  
  return content;
}

async function generateFirstComment(topic, profile) {
  if (!anthropic) {
    return profile?.product_url 
      ? `🔗 Link to learn more: ${profile.product_url}`
      : null;
  }

  const prompt = `Write a brief first comment for a LinkedIn post about "${topic}".

The first comment should:
- Add value or context (not just "link in bio")
- Feel natural, not salesy
- Include a soft CTA
${profile?.product_url ? `- Include this link naturally: ${profile.product_url}` : ''}
${profile?.product_name ? `- Product/service: ${profile.product_name}` : ''}

Keep it under 100 words. Output ONLY the comment text.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
}

// Post-process content for LinkedIn best practices
function postProcessLinkedInContent(content) {
  // Ensure line breaks are proper
  content = content
    // Remove any markdown formatting
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/gm, '')
    // Ensure single line breaks become double for LinkedIn
    .replace(/([^\n])\n([^\n])/g, '$1\n\n$2')
    // Remove excessive line breaks (more than 2)
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim();

  return content;
}

// Template fallback when no AI available
function generateTemplatePost(topic, bucket, format) {
  const templates = {
    'hook-story': `Here's what nobody tells you about ${topic}:

I used to struggle with this too.

Then I discovered something that changed everything.

[Your insight here]

The result? [Specific outcome]

Here's the framework I now use:

→ Step 1: [Action]
→ Step 2: [Action]  
→ Step 3: [Action]

The best part? You can start implementing this today.

What's your experience with ${topic}? Drop a comment below 👇`,

    contrarian: `Unpopular opinion: Everything you know about ${topic} is wrong.

Here's why:

Most people think [common belief].

But the data tells a different story.

[Contrarian insight]

The companies winning right now? They're doing the opposite.

→ Instead of X, they do Y
→ Instead of A, they do B
→ Instead of C, they do D

I've seen this work across dozens of companies.

Am I wrong? Tell me why in the comments.`,

    'list-post': `${topic}: The complete breakdown

After [X years/months] in the trenches, here's what actually works:

1️⃣ [First point]
Quick explanation here.

2️⃣ [Second point]
Quick explanation here.

3️⃣ [Third point]
Quick explanation here.

4️⃣ [Fourth point]
Quick explanation here.

5️⃣ [Fifth point]
Quick explanation here.

BONUS: [Extra tip]

Save this post. You'll need it.

Tag someone who's struggling with ${topic} 👇`,

    'lead-magnet': `I spent 100+ hours building the ultimate ${topic} resource.

And I'm giving it away for free.

Here's what's inside:

✅ [Benefit 1]
✅ [Benefit 2]
✅ [Benefit 3]
✅ [Benefit 4]
✅ [Benefit 5]

Why am I doing this?

Because I wish someone gave me this when I started.

It would have saved me [time/money/pain].

Over [X] people have downloaded it already.

Want it?

Comment "SEND" below and I'll DM you the link.

(Must be connected for me to send)`,

    'case-study': `How we helped [client type] achieve [result] in [timeframe]:

THE SITUATION:
They were struggling with ${topic}.
[Specific problem details]

THE APPROACH:
We implemented a simple framework:

→ Phase 1: [What we did]
→ Phase 2: [What we did]
→ Phase 3: [What we did]

THE RESULTS:
• [Metric 1]: [X]% improvement
• [Metric 2]: [X]% increase
• [Metric 3]: [X] achieved

KEY LESSONS:
1. [Takeaway 1]
2. [Takeaway 2]
3. [Takeaway 3]

What challenges are you facing with ${topic}?`,
  };

  return templates[format] || templates['hook-story'];
}