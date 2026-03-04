// src/app/api/insights/route.js
// User Insights API
// Performance insights and recommendations

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateInsights } from "@/lib/intelligence/feedback-loop";
import { compareHookTypes, comparePlatformPerformance } from "@/lib/intelligence/scoring";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * GET - Fetch user's insights
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // hook, platform, timing, all

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get stored insights
    let query = supabase
      .from("insights")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (type && type !== "all") {
      query = query.eq("insight_type", type);
    }

    const { data: insights } = await query.limit(20);

    // Get real-time comparisons
    const hookComparison = await compareHookTypes(user.id, "tiktok");
    const platformComparison = await comparePlatformPerformance(user.id);

    // Get weekly report if exists
    const { data: latestReport } = await supabase
      .from("weekly_reports")
      .select("report_content, recommendations, report_date")
      .eq("user_id", user.id)
      .order("report_date", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      insights: insights || [],
      hookAnalysis: hookComparison,
      platformAnalysis: platformComparison,
      latestReport: latestReport ? {
        date: latestReport.report_date,
        recommendations: latestReport.recommendations,
      } : null,
    });

  } catch (error) {
    console.error("[Insights] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST - Generate new insights
 */
export async function POST(request) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate fresh insights
    const insights = await generateInsights(user.id);

    return NextResponse.json({
      success: true,
      generated: insights.length,
      insights,
    });

  } catch (error) {
    console.error("[Insights] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
