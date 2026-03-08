// src/app/api/cron/feedback-loop/route.js
// Weekly Feedback Loop Cron Job
// Extracts winning patterns and injects them into future Claude prompts

import { NextResponse } from "next/server";
import { runWeeklyFeedbackLoop } from "@/lib/intelligence/performance-feedback";

export async function GET(request) {
  // Verify cron secret (for security)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] Starting weekly feedback loop");
    
    const result = await runWeeklyFeedbackLoop();
    
    console.log("[Cron] Feedback loop complete:", result);
    
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[Cron] Feedback loop failed:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request) {
  return GET(request);
}
