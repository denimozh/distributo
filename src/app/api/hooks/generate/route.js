// src/app/api/hooks/generate/route.js
// AI Hook Generation
// Uses Claude to generate viral hooks based on product and niche

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { getPerformanceFeedback, buildFeedbackPrompt } from "@/lib/intelligence/feedback-loop";

const anthropic = new Anthropic();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Hook types with examples
const HOOK_TYPES = {
  curiosity: {
    name: "Curiosity Gap",
    description: "Creates intrigue that demands resolution",
    examples: [
      "I can't believe nobody talks about this...",
      "This is the thing they don't want you to know...",
      "Wait, you're still doing it the old way?",
    ],
  },
  pov: {
    name: "POV Story",
    description: "First-person perspective that viewers relate to",
    examples: [
      "POV: You finally found something that actually works",
      "POV: It's 2am and you're still dealing with this problem",
      "POV: Your friend asks why you look so good lately",
    ],
  },
  direct: {
    name: "Direct Challenge",
    description: "Bold statement that stops the scroll",
    examples: [
      "Stop wasting money on things that don't work",
      "You need to hear this right now",
      "I'm about to save you so much time",
    ],
  },
  question: {
    name: "Question Hook",
    description: "Engages viewers by making them think",
    examples: [
      "Why is nobody talking about this?",
      "Have you ever wondered why...?",
      "What if I told you there's a better way?",
    ],
  },
  story: {
    name: "Story Hook",
    description: "Personal narrative that builds connection",
    examples: [
      "So I was struggling with this for months...",
      "My friend recommended this and I was skeptical but...",
      "I never thought I'd be saying this, but...",
    ],
  },
  controversy: {
    name: "Controversial Take",
    description: "Bold opinion that sparks engagement",
    examples: [
      "Unpopular opinion: most people are doing this wrong",
      "I'm going to say what everyone's thinking...",
      "This might be controversial, but...",
    ],
  },
};

// Niche-specific adjustments
const NICHE_MODIFIERS = {
  tiktok_shop: {
    tone: "energetic and urgent",
    focus: "immediate results and value",
    avoidance: "overly salesy language",
  },
  ecommerce: {
    tone: "aspirational but relatable",
    focus: "lifestyle transformation",
    avoidance: "generic product descriptions",
  },
  saas: {
    tone: "helpful and knowledgeable",
    focus: "time/money savings",
    avoidance: "technical jargon",
  },
  personal_brand: {
    tone: "authentic and conversational",
    focus: "personal journey and insights",
    avoidance: "corporate speak",
  },
  indie_hacker: {
    tone: "transparent and relatable",
    focus: "building in public, real results",
    avoidance: "hype without substance",
  },
  service: {
    tone: "authoritative but approachable",
    focus: "expertise and results",
    avoidance: "hard selling",
  },
};

export async function POST(request) {
  try {
    const {
      productName,
      productBenefit,
      targetAudience,
      niche = "ecommerce",
      hookTypes = ["curiosity", "pov", "direct"],
      count = 5,
      previousWinners = [], // Past winning hooks for learning
      useFeedbackLoop = true, // Enable performance-based generation
      platform = "tiktok",
    } = await request.json();

    if (!productName || !productBenefit) {
      return NextResponse.json(
        { error: "productName and productBenefit are required" },
        { status: 400 }
      );
    }

    // Build prompt with context
    const nicheModifier = NICHE_MODIFIERS[niche] || NICHE_MODIFIERS.ecommerce;
    const selectedHookTypes = hookTypes.map(t => HOOK_TYPES[t]).filter(Boolean);

    // Get performance feedback if user is authenticated and feature enabled
    let feedbackPrompt = "";
    const { data: { user } } = await supabase.auth.getUser();
    
    if (useFeedbackLoop && user) {
      const feedback = await getPerformanceFeedback(user.id, platform);
      feedbackPrompt = buildFeedbackPrompt(feedback);
    }

    const prompt = buildHookPrompt({
      productName,
      productBenefit,
      targetAudience,
      nicheModifier,
      hookTypes: selectedHookTypes,
      count,
      previousWinners,
      feedbackPrompt,
      platform,
    });

    // Generate hooks with Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].text;

    // Parse the response
    const hooks = parseHooksResponse(text);

    // Track API cost
    const inputTokens = response.usage?.input_tokens || 0;
    const outputTokens = response.usage?.output_tokens || 0;
    const cost = (inputTokens * 0.000003) + (outputTokens * 0.000015);

    await supabase.from("api_costs").insert({
      service: "claude",
      operation: "hook_generation",
      cost,
      metadata: { productName, niche, hookCount: hooks.length },
    });

    return NextResponse.json({
      success: true,
      hooks,
      meta: {
        count: hooks.length,
        niche,
        hookTypes,
      },
    });

  } catch (error) {
    console.error("[Hook Generation] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ===========================================
// PROMPT BUILDING
// ===========================================

function buildHookPrompt({
  productName,
  productBenefit,
  targetAudience,
  nicheModifier,
  hookTypes,
  count,
  previousWinners,
  feedbackPrompt = "",
  platform = "tiktok",
}) {
  const hookTypeExamples = hookTypes
    .map(ht => `${ht.name}: ${ht.examples.join(", ")}`)
    .join("\n");

  let winnerContext = "";
  if (previousWinners && previousWinners.length > 0) {
    winnerContext = `
WINNING HOOKS FROM THIS ACCOUNT (use these as inspiration for what works):
${previousWinners.map((w, i) => `${i + 1}. "${w.text}" - ${w.watchTime}% watch time`).join("\n")}

Analyze what makes these hooks work and incorporate similar patterns.
`;
  }

  return `You are an expert ${platform.toUpperCase()} content strategist specializing in UGC hooks that stop the scroll.

PRODUCT: ${productName}
MAIN BENEFIT: ${productBenefit}
${targetAudience ? `TARGET AUDIENCE: ${targetAudience}` : ""}
PLATFORM: ${platform.toUpperCase()}

BRAND VOICE:
- Tone: ${nicheModifier.tone}
- Focus on: ${nicheModifier.focus}
- Avoid: ${nicheModifier.avoidance}

HOOK TYPES TO USE:
${hookTypeExamples}
${winnerContext}
${feedbackPrompt}

Generate ${count} unique video hooks. Each hook should:
1. Be 5-15 words (can be spoken in 2-4 seconds)
2. Create immediate curiosity or emotional response
3. Sound natural and conversational (like a real person, not an ad)
4. Connect to the product benefit without being salesy
5. Work as the FIRST thing someone sees when scrolling
${feedbackPrompt ? "6. Lean into hook types and patterns that have worked based on the performance data above" : ""}

IMPORTANT: These are OPENING LINES for UGC videos, not taglines or slogans. They should sound like a friend telling you something, not a commercial.

Format your response as a JSON array:
[
  {
    "hook": "the hook text",
    "type": "curiosity|pov|direct|question|story|controversy",
    "script": "full 15-second script starting with this hook (3-4 sentences total)",
    "whyItWorks": "brief explanation"${feedbackPrompt ? ',\n    "dataInformed": true or false (whether this hook was influenced by the performance data)' : ""}
  }
]

Only return the JSON array, no other text.`;
}

// ===========================================
// RESPONSE PARSING
// ===========================================

function parseHooksResponse(text) {
  try {
    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("No JSON array found in response");
    }

    const hooks = JSON.parse(jsonMatch[0]);

    return hooks.map((hook, index) => ({
      id: `hook_${Date.now()}_${index}`,
      text: hook.hook,
      type: hook.type,
      script: hook.script,
      reason: hook.whyItWorks,
    }));

  } catch (error) {
    console.error("[Hook Parsing] Failed to parse:", error);

    // Fallback: extract hooks line by line
    const lines = text.split("\n").filter(line =>
      line.trim().length > 10 &&
      !line.includes("{") &&
      !line.includes("}")
    );

    return lines.slice(0, 5).map((line, index) => ({
      id: `hook_${Date.now()}_${index}`,
      text: line.replace(/^[\d\.\-\*]+\s*/, "").replace(/["']/g, "").trim(),
      type: "direct",
      script: line,
      reason: "Generated hook",
    }));
  }
}

// ===========================================
// GET: List hook types
// ===========================================

export async function GET() {
  return NextResponse.json({
    hookTypes: HOOK_TYPES,
    niches: Object.keys(NICHE_MODIFIERS),
  });
}
