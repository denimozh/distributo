// src/lib/tracking/costs.js
// API Cost Tracking
// Tracks costs per user for margin monitoring

import { createClient } from "@supabase/supabase-js";

// ===========================================
// COST CONSTANTS
// ===========================================

export const API_COSTS = {
  // Kling Video Generation (per second)
  kling: {
    "5s": 0.70,
    "10s": 1.40,
    "15s": 2.10,
    "30s": 4.20,
    "60s": 8.40,
    perSecond: 0.14,
  },

  // ElevenLabs Voice (per 1000 characters)
  elevenlabs: {
    tts: 0.30, // per 1000 chars
    speechToSpeech: 0.50, // per 1000 chars
  },

  // Claude AI (per 1M tokens)
  claude: {
    sonnet: {
      input: 3.00,
      output: 15.00,
    },
    haiku: {
      input: 0.25,
      output: 1.25,
    },
  },

  // Whisper Transcription (per minute)
  whisper: {
    perMinute: 0.01,
  },

  // Flux Image Generation (per image)
  flux: {
    standard: 0.03,
    pro: 0.055,
  },

  // FFmpeg Processing (per minute of output)
  ffmpeg: {
    perMinute: 0.02,
  },
};

// Plan prices for margin calculation
export const PLAN_PRICES = {
  free: 0,
  starter: 49,
  growth: 99,
  scale: 249,
  agency: 499,
};

// ===========================================
// COST TRACKING
// ===========================================

/**
 * Track an API cost
 */
export async function trackCost({
  userId,
  service,
  operation,
  cost,
  metadata = {},
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase.from("api_costs").insert({
    user_id: userId,
    service,
    operation,
    cost,
    metadata,
  });

  if (error) {
    console.error("[Cost Tracking] Failed to track:", error);
  }

  // Check margin after tracking
  if (userId) {
    await checkUserMargin(userId, supabase);
  }

  return { success: !error };
}

/**
 * Track Kling video generation cost
 */
export async function trackKlingCost(userId, durationSeconds) {
  const cost = (durationSeconds / 10) * API_COSTS.kling["10s"];
  return trackCost({
    userId,
    service: "kling",
    operation: "video_generation",
    cost,
    metadata: { duration: durationSeconds },
  });
}

/**
 * Track ElevenLabs voice generation cost
 */
export async function trackElevenLabsCost(userId, characterCount, type = "tts") {
  const rate = type === "speechToSpeech"
    ? API_COSTS.elevenlabs.speechToSpeech
    : API_COSTS.elevenlabs.tts;
  const cost = (characterCount / 1000) * rate;

  return trackCost({
    userId,
    service: "elevenlabs",
    operation: type,
    cost,
    metadata: { characters: characterCount },
  });
}

/**
 * Track Claude API cost
 */
export async function trackClaudeCost(userId, inputTokens, outputTokens, model = "sonnet") {
  const rates = API_COSTS.claude[model] || API_COSTS.claude.sonnet;
  const cost = (inputTokens / 1000000) * rates.input + (outputTokens / 1000000) * rates.output;

  return trackCost({
    userId,
    service: "claude",
    operation: "generation",
    cost,
    metadata: { inputTokens, outputTokens, model },
  });
}

/**
 * Track Whisper transcription cost
 */
export async function trackWhisperCost(userId, durationSeconds) {
  const minutes = durationSeconds / 60;
  const cost = minutes * API_COSTS.whisper.perMinute;

  return trackCost({
    userId,
    service: "whisper",
    operation: "transcription",
    cost,
    metadata: { duration: durationSeconds },
  });
}

// ===========================================
// MARGIN MONITORING
// ===========================================

/**
 * Check user's margin and alert if too low
 */
async function checkUserMargin(userId, supabase) {
  // Get user's plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, email")
    .eq("id", userId)
    .single();

  if (!profile) return;

  const planPrice = PLAN_PRICES[profile.plan] || 0;
  if (planPrice === 0) return; // Free users don't have margin

  // Get this month's costs
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: costs } = await supabase
    .from("api_costs")
    .select("cost")
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString());

  const totalCost = costs?.reduce((sum, c) => sum + (c.cost || 0), 0) || 0;
  const margin = ((planPrice - totalCost) / planPrice) * 100;

  // Alert if margin drops below thresholds
  if (margin < 20 && margin >= 10) {
    await createMarginAlert(userId, margin, "warning", supabase);
  } else if (margin < 10 && margin >= 0) {
    await createMarginAlert(userId, margin, "critical", supabase);
  } else if (margin < 0) {
    await createMarginAlert(userId, margin, "negative", supabase);
  }
}

/**
 * Create margin alert notification
 */
async function createMarginAlert(userId, margin, severity, supabase) {
  // Check if we already alerted today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: existingAlert } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", `margin_${severity}`)
    .gte("created_at", today.toISOString())
    .single();

  if (existingAlert) return; // Already alerted today

  // Create alert for admin (internal)
  await supabase.from("notifications").insert({
    user_id: userId,
    type: `margin_${severity}`,
    title: `Margin Alert: ${severity}`,
    message: `User margin is ${margin.toFixed(1)}%`,
    data: { margin, severity },
  });

  // TODO: Send email to admin
  console.log(`[Margin Alert] User ${userId}: ${margin.toFixed(1)}% margin (${severity})`);
}

// ===========================================
// COST QUERIES
// ===========================================

/**
 * Get user's costs for current month
 */
export async function getUserMonthlyCosts(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: costs } = await supabase
    .from("api_costs")
    .select("service, operation, cost, created_at")
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString())
    .order("created_at", { ascending: false });

  // Aggregate by service
  const byService = {};
  let total = 0;

  for (const cost of costs || []) {
    const service = cost.service;
    if (!byService[service]) {
      byService[service] = 0;
    }
    byService[service] += cost.cost;
    total += cost.cost;
  }

  return {
    total,
    byService,
    transactions: costs || [],
  };
}

/**
 * Get user's margin for current month
 */
export async function getUserMargin(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const planPrice = PLAN_PRICES[profile.plan] || 0;
  const costs = await getUserMonthlyCosts(userId);

  const margin = planPrice > 0
    ? ((planPrice - costs.total) / planPrice) * 100
    : 0;

  return {
    plan: profile.plan,
    planPrice,
    totalCost: costs.total,
    margin: Math.round(margin * 100) / 100,
    byService: costs.byService,
  };
}

/**
 * Get aggregate costs for admin dashboard
 */
export async function getAggregateCosts(period = "month") {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  let startDate = new Date();
  if (period === "month") {
    startDate.setDate(1);
  } else if (period === "week") {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === "day") {
    startDate.setDate(startDate.getDate() - 1);
  }
  startDate.setHours(0, 0, 0, 0);

  const { data: costs } = await supabase
    .from("api_costs")
    .select("service, cost, user_id")
    .gte("created_at", startDate.toISOString());

  // Aggregate
  const byService = {};
  const byUser = {};
  let total = 0;

  for (const cost of costs || []) {
    // By service
    if (!byService[cost.service]) {
      byService[cost.service] = 0;
    }
    byService[cost.service] += cost.cost;

    // By user
    if (cost.user_id) {
      if (!byUser[cost.user_id]) {
        byUser[cost.user_id] = 0;
      }
      byUser[cost.user_id] += cost.cost;
    }

    total += cost.cost;
  }

  // Find top users by cost
  const topUsers = Object.entries(byUser)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId, cost]) => ({ userId, cost }));

  return {
    period,
    total,
    byService,
    topUsers,
    userCount: Object.keys(byUser).length,
  };
}

// ===========================================
// COST ESTIMATION
// ===========================================

/**
 * Estimate cost for a video generation job
 */
export function estimateVideoCost({
  duration = 15,
  format = "talking_head",
  addCaptions = false,
  voiceGeneration = true,
  scriptLength = 200, // characters
}) {
  let cost = 0;

  // Video generation
  if (format === "talking_head" || format === "multi_shot") {
    cost += (duration / 10) * API_COSTS.kling["10s"];
  } else {
    // FFmpeg formats are cheaper
    cost += (duration / 60) * API_COSTS.ffmpeg.perMinute;
  }

  // Voice generation
  if (voiceGeneration) {
    cost += (scriptLength / 1000) * API_COSTS.elevenlabs.tts;
  }

  // Captions (Whisper)
  if (addCaptions) {
    cost += (duration / 60) * API_COSTS.whisper.perMinute;
  }

  return {
    estimated: Math.round(cost * 100) / 100,
    breakdown: {
      video: format === "talking_head" ? (duration / 10) * API_COSTS.kling["10s"] : (duration / 60) * API_COSTS.ffmpeg.perMinute,
      voice: voiceGeneration ? (scriptLength / 1000) * API_COSTS.elevenlabs.tts : 0,
      captions: addCaptions ? (duration / 60) * API_COSTS.whisper.perMinute : 0,
    },
  };
}

// ===========================================
// EXPORTS
// ===========================================

// Alias for backwards compatibility
export const trackApiCost = trackCost;

export default {
  API_COSTS,
  PLAN_PRICES,
  trackCost,
  trackApiCost,
  trackKlingCost,
  trackElevenLabsCost,
  trackClaudeCost,
  trackWhisperCost,
  getUserMonthlyCosts,
  getUserMargin,
  getAggregateCosts,
  estimateVideoCost,
};
