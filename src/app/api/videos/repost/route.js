// src/app/api/videos/repost/route.js
// One-Click Repost for Winners
// Quickly repost winning videos to other platforms or times

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { queueVideoPost, getOptimalPostTime } from "@/lib/posting/tiktok";
import { queueInstagramPost, getOptimalInstagramTime } from "@/lib/posting/instagram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      videoId,
      platform,
      newCaption = null,
      scheduleFor = "optimal", // "optimal", "now", or ISO timestamp
    } = body;

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get video
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select(`
        *,
        campaigns (user_id),
        posted_content (platform)
      `)
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Verify ownership
    if (video.campaigns?.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if ready
    if (video.status !== "ready" || !video.video_url) {
      return NextResponse.json(
        { error: "Video not ready for posting" },
        { status: 400 }
      );
    }

    // Get user timezone
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single();

    const timezone = profile?.timezone || "UTC";

    // Determine schedule time
    let scheduledAt;
    if (scheduleFor === "now") {
      scheduledAt = new Date().toISOString();
    } else if (scheduleFor === "optimal") {
      scheduledAt = platform === "tiktok" 
        ? getOptimalPostTime(timezone)
        : getOptimalInstagramTime(timezone);
    } else {
      scheduledAt = scheduleFor;
    }

    // Caption - use new or original
    const caption = newCaption || video.script;

    // Check if already posted to this platform recently
    const recentPosted = video.posted_content?.filter(p => 
      p.platform === platform
    );

    // Queue the repost
    let result;
    if (platform === "tiktok") {
      result = await queueVideoPost({
        userId: user.id,
        videoId,
        caption,
        scheduledAt,
        timezone,
      });
    } else if (platform === "instagram") {
      result = await queueInstagramPost({
        userId: user.id,
        videoId,
        caption,
        scheduledAt,
        timezone,
      });
    } else {
      return NextResponse.json(
        { error: "Unsupported platform" },
        { status: 400 }
      );
    }

    // Track repost
    await supabase.from("videos").update({
      repost_count: (video.repost_count || 0) + 1,
      last_reposted_at: new Date().toISOString(),
    }).eq("id", videoId);

    return NextResponse.json({
      success: true,
      queueId: result.id,
      platform,
      scheduledAt,
      scheduledAtLocal: new Date(scheduledAt).toLocaleString("en-US", {
        timeZone: timezone,
      }),
      isRepost: recentPosted?.length > 0,
    });

  } catch (error) {
    console.error("[Repost] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
