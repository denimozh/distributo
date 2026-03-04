// src/lib/billing/credits.js
// Server-side credit validation and atomic deduction
// Fixes the client-only credits bug

import { createClient } from "@supabase/supabase-js";

// ===========================================
// CREDIT COSTS
// ===========================================

export const CREDIT_COSTS = {
  // Video generation (by duration)
  video_5s: 1,
  video_10s: 2,
  video_15s: 3,
  video_30s: 6,
  video_60s: 12,

  // Video formats
  talking_head: 1.0, // Multiplier
  slideshow: 0.3,
  text_hook: 0.2,
  before_after: 0.3,
  static_image: 0.1,
  multi_shot: 1.5,

  // Additional features
  captions: 0.5,
  premium_voice: 0.5,
};

/**
 * Calculate credits needed for a video
 */
export function calculateVideoCost({
  duration = 15,
  format = "talking_head",
  addCaptions = false,
  premiumVoice = false,
}) {
  // Base cost by duration
  let baseCost;
  if (duration <= 5) baseCost = CREDIT_COSTS.video_5s;
  else if (duration <= 10) baseCost = CREDIT_COSTS.video_10s;
  else if (duration <= 15) baseCost = CREDIT_COSTS.video_15s;
  else if (duration <= 30) baseCost = CREDIT_COSTS.video_30s;
  else baseCost = CREDIT_COSTS.video_60s;

  // Apply format multiplier
  const formatMultiplier = CREDIT_COSTS[format] || 1.0;
  let cost = baseCost * formatMultiplier;

  // Add feature costs
  if (addCaptions) cost += CREDIT_COSTS.captions;
  if (premiumVoice) cost += CREDIT_COSTS.premium_voice;

  return Math.ceil(cost);
}

/**
 * Calculate credits for a batch of videos
 */
export function calculateBatchCost(videos) {
  return videos.reduce((total, video) => {
    return total + calculateVideoCost(video);
  }, 0);
}

// ===========================================
// CREDIT OPERATIONS
// ===========================================

/**
 * Check if user has enough credits
 * READ-ONLY - does not deduct
 */
export async function checkCredits(userId, requiredCredits) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("credits, plan")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return {
      success: false,
      error: "User not found",
    };
  }

  const hasEnough = profile.credits >= requiredCredits;

  return {
    success: true,
    hasEnough,
    currentCredits: profile.credits,
    requiredCredits,
    shortfall: hasEnough ? 0 : requiredCredits - profile.credits,
    plan: profile.plan,
  };
}

/**
 * Atomically deduct credits
 * Uses database function to prevent race conditions
 */
export async function deductCredits(userId, amount, description = "Video generation") {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Use atomic function
  const { data, error } = await supabase.rpc("use_credits_atomic", {
    p_user_id: userId,
    p_amount: amount,
    p_description: description,
  });

  if (error) {
    console.error("[Credits] Deduction failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }

  // Handle function response
  if (!data.success) {
    return {
      success: false,
      error: data.message,
      currentCredits: data.current_credits,
      required: data.required,
    };
  }

  return {
    success: true,
    remainingCredits: data.remaining_credits,
    transactionId: data.transaction_id,
  };
}

/**
 * Refund credits (for failed generations)
 */
export async function refundCredits(userId, amount, reason = "Generation failed") {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get current credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits, credits_used")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { success: false, error: "User not found" };
  }

  const newBalance = profile.credits + amount;
  const newUsed = Math.max(0, (profile.credits_used || 0) - amount);

  // Update balance
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      credits: newBalance,
      credits_used: newUsed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Log transaction
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: amount, // Positive for refund
    balance_after: newBalance,
    transaction_type: "refund",
    description: reason,
  });

  return {
    success: true,
    newBalance,
  };
}

/**
 * Add credits (for purchases, bonuses)
 */
export async function addCredits(userId, amount, reason = "Plan subscription") {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { success: false, error: "User not found" };
  }

  const newBalance = profile.credits + amount;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      credits: newBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: amount,
    balance_after: newBalance,
    transaction_type: "purchase",
    description: reason,
  });

  return {
    success: true,
    newBalance,
  };
}

// ===========================================
// USAGE TRACKING
// ===========================================

/**
 * Get user's credit usage for current month
 */
export async function getMonthlyUsage(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("amount, transaction_type, description, created_at")
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString())
    .order("created_at", { ascending: false });

  const usage = {
    spent: 0,
    refunded: 0,
    added: 0,
    transactions: transactions || [],
  };

  for (const tx of transactions || []) {
    if (tx.amount < 0) {
      usage.spent += Math.abs(tx.amount);
    } else if (tx.transaction_type === "refund") {
      usage.refunded += tx.amount;
    } else {
      usage.added += tx.amount;
    }
  }

  usage.net = usage.added + usage.refunded - usage.spent;

  return usage;
}

/**
 * Get credit transaction history
 */
export async function getCreditHistory(userId, limit = 50) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    transactions: data,
  };
}

// ===========================================
// VALIDATION MIDDLEWARE
// ===========================================

/**
 * Validate and deduct credits for a generation request
 * Use this at the start of any generation API endpoint
 */
export async function validateAndDeductCredits({
  userId,
  videos, // Array of { duration, format, addCaptions, premiumVoice }
  description = "Video generation",
}) {
  // Calculate total cost
  const totalCost = calculateBatchCost(videos);

  // Check if user has enough
  const check = await checkCredits(userId, totalCost);

  if (!check.success) {
    return {
      success: false,
      error: check.error,
    };
  }

  if (!check.hasEnough) {
    return {
      success: false,
      error: "Insufficient credits",
      required: totalCost,
      available: check.currentCredits,
      shortfall: check.shortfall,
    };
  }

  // Deduct credits atomically
  const deduction = await deductCredits(userId, totalCost, description);

  if (!deduction.success) {
    return {
      success: false,
      error: deduction.error,
    };
  }

  return {
    success: true,
    creditsUsed: totalCost,
    remainingCredits: deduction.remainingCredits,
    transactionId: deduction.transactionId,
  };
}

// ===========================================
// EXPORTS
// ===========================================

// Alias for backwards compatibility
export const useCreditsAtomic = deductCredits;

export default {
  CREDIT_COSTS,
  calculateVideoCost,
  calculateBatchCost,
  checkCredits,
  deductCredits,
  refundCredits,
  addCredits,
  getMonthlyUsage,
  getCreditHistory,
  validateAndDeductCredits,
  useCreditsAtomic,
};
