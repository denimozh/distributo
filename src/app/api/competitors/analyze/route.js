// src/app/api/competitors/analyze/route.js
// Competitor Video Analysis API
// Transcribe and extract patterns from competitor content

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { analyzeCompetitorVideo, analyzeCompetitorBatch, extractTrendingPatterns } from "@/lib/intelligence/competitor-analysis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * POST - Analyze competitor video(s)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { videoUrl, videoUrls, category } = body;

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check plan (competitor analysis is Tier 2+)
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (!profile || !["growth", "scale", "agency"].includes(profile.plan)) {
      return NextResponse.json(
        { error: "Competitor analysis requires Growth plan or higher" },
        { status: 403 }
      );
    }

    // Single video analysis
    if (videoUrl) {
      const result = await analyzeCompetitorVideo(videoUrl, {
        userId: user.id,
        category,
      });

      return NextResponse.json(result);
    }

    // Batch analysis
    if (videoUrls && Array.isArray(videoUrls)) {
      if (videoUrls.length > 10) {
        return NextResponse.json(
          { error: "Maximum 10 videos per batch" },
          { status: 400 }
        );
      }

      const results = await analyzeCompetitorBatch(videoUrls, user.id);

      return NextResponse.json({
        success: true,
        analyzed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      });
    }

    return NextResponse.json(
      { error: "videoUrl or videoUrls required" },
      { status: 400 }
    );

  } catch (error) {
    console.error("[Competitor Analysis] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Get competitor trends and insights
 */
export async function GET(request) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract trends from analyzed competitors
    const trends = await extractTrendingPatterns(user.id);

    // Get recent competitor insights
    const { data: recentInsights } = await supabase
      .from("insights")
      .select("*")
      .eq("user_id", user.id)
      .eq("insight_type", "competitor")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      trends,
      recentAnalyses: recentInsights?.map(i => ({
        id: i.id,
        title: i.title,
        pattern: i.description,
        hookType: i.metadata?.analysis?.hookType,
        keyPhrases: i.metadata?.analysis?.keyPhrases,
        adaptationIdeas: i.action_data?.adaptationIdeas,
        createdAt: i.created_at,
      })) || [],
    });

  } catch (error) {
    console.error("[Competitor Analysis] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
