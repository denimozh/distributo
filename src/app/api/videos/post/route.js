// src/app/api/videos/post/route.js
// Multi-Platform Video Posting API
// Queue videos to TikTok, Instagram, or both

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getOptimalPostTime as getTikTokTime, queueVideoPost as queueTikTok } from "@/lib/posting/tiktok";
import { getOptimalInstagramTime, queueInstagramPost } from "@/lib/posting/instagram";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      videoId,
      platforms = ["tiktok"], // ['tiktok', 'instagram']
      caption = null,
      scheduleOptimal = true,
      scheduledAt = null, // ISO string for manual scheduling
      timezone = "UTC",
    } = body;

    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get video details
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .select(`
        *,
        campaigns (id, user_id)
      `)
      .eq("id", videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (video.campaigns?.user_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Check video is ready
    if (video.status !== "ready" || !video.video_url) {
      return NextResponse.json(
        { error: "Video is not ready for posting" },
        { status: 400 }
      );
    }

    // Get user profile for timezone
    const { data: profile } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .single();

    const userTimezone = timezone || profile?.timezone || "UTC";
    const postCaption = caption || video.script;

    // Check platform connections
    const { data: connections } = await supabase
      .from("platform_connections")
      .select("platform, is_active, platform_username")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const connectedPlatforms = new Set(connections?.map(c => c.platform) || []);
    const results = [];
    const errors = [];

    // Queue to each requested platform
    for (const platform of platforms) {
      if (!connectedPlatforms.has(platform)) {
        errors.push({
          platform,
          error: `${platform} not connected. Please connect in Settings.`,
        });
        continue;
      }

      try {
        let result;

        if (platform === "tiktok") {
          const postTime = scheduleOptimal
            ? getTikTokTime(userTimezone)
            : scheduledAt || new Date().toISOString();

          result = await queueTikTok({
            userId: user.id,
            videoId,
            caption: postCaption,
            scheduledAt: postTime,
            timezone: userTimezone,
          });

          results.push({
            platform: "tiktok",
            success: true,
            queueId: result.id,
            scheduledAt: postTime,
            scheduledAtLocal: new Date(postTime).toLocaleString("en-US", {
              timeZone: userTimezone,
            }),
            reason: "TikTok performs best 7-9pm local time",
          });
        }

        if (platform === "instagram") {
          const postTime = scheduleOptimal
            ? getOptimalInstagramTime(userTimezone)
            : scheduledAt || new Date().toISOString();

          result = await queueInstagramPost({
            userId: user.id,
            videoId,
            caption: postCaption,
            scheduledAt: postTime,
            timezone: userTimezone,
          });

          results.push({
            platform: "instagram",
            success: true,
            queueId: result.id,
            scheduledAt: postTime,
            scheduledAtLocal: new Date(postTime).toLocaleString("en-US", {
              timeZone: userTimezone,
            }),
            reason: "Instagram Reels perform best Tuesday-Wednesday 6-9pm",
          });
        }

      } catch (error) {
        console.error(`[Post] Error queuing to ${platform}:`, error);
        errors.push({
          platform,
          error: error.message,
        });
      }
    }

    // Update video posted_platforms
    const successfulPlatforms = results.map(r => r.platform);
    if (successfulPlatforms.length > 0) {
      const existingPlatforms = video.posted_platforms || [];
      const newPlatforms = [...new Set([...existingPlatforms, ...successfulPlatforms])];

      await supabase
        .from("videos")
        .update({
          posted_platforms: newPlatforms,
          last_posted_at: new Date().toISOString(),
        })
        .eq("id", videoId);
    }

    return NextResponse.json({
      success: results.length > 0,
      queued: results,
      errors: errors.length > 0 ? errors : undefined,
      summary: {
        requested: platforms.length,
        queued: results.length,
        failed: errors.length,
      },
    });

  } catch (error) {
    console.error("[Post] Error:", error);
    return NextResponse.json(
      { error: "Failed to queue post: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * Get posting schedule preview
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const timezone = searchParams.get("timezone") || "UTC";

  const schedule = {
    tiktok: {
      optimalTime: getTikTokTime(timezone),
      reason: "7-9pm local time performs best",
    },
    instagram: {
      optimalTime: getOptimalInstagramTime(timezone),
      reason: "Tuesday-Wednesday 6-9pm performs best",
    },
  };

  // Format for display
  for (const platform of Object.keys(schedule)) {
    schedule[platform].formatted = new Date(schedule[platform].optimalTime).toLocaleString("en-US", {
      timeZone: timezone,
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return NextResponse.json(schedule);
}
