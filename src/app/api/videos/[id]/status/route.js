// src/app/api/videos/[id]/status/route.js
// Video Generation Status Polling
// Fixes the "pending forever" bug

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkGenerationStatus } from "@/lib/video/kling";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request, { params }) {
  const videoId = params.id;

  try {
    // Get video record
    const { data: video, error } = await supabase
      .from("videos")
      .select(`
        *,
        campaigns (id, name, user_id)
      `)
      .eq("id", videoId)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // If already complete or failed, return current status
    if (video.status === "ready") {
      return NextResponse.json({
        status: "ready",
        videoUrl: video.video_url,
        thumbnailUrl: video.thumbnail_url,
        duration: video.duration,
      });
    }

    if (video.status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: video.generation_error || "Generation failed",
        retryable: video.retry_count < 3,
      });
    }

    // If pending/generating, check with fal.ai
    if (video.generation_request_id) {
      const falStatus = await checkGenerationStatus(video.generation_request_id);

      if (falStatus.status === "COMPLETED" && falStatus.result) {
        // Update video record
        const videoUrl = falStatus.result.video?.url;

        await supabase
          .from("videos")
          .update({
            status: "ready",
            video_url: videoUrl,
            updated_at: new Date().toISOString(),
          })
          .eq("id", videoId);

        // Queue thumbnail generation (async, don't wait)
        queueThumbnailGeneration(videoId, videoUrl);

        return NextResponse.json({
          status: "ready",
          videoUrl,
          justCompleted: true,
        });
      }

      if (falStatus.status === "FAILED") {
        const retryCount = (video.retry_count || 0) + 1;

        await supabase
          .from("videos")
          .update({
            status: "failed",
            generation_error: falStatus.error || "Generation failed at provider",
            retry_count: retryCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", videoId);

        return NextResponse.json({
          status: "failed",
          error: falStatus.error || "Generation failed",
          retryable: retryCount < 3,
        });
      }

      // Still processing
      return NextResponse.json({
        status: "generating",
        progress: parseProgress(falStatus.logs),
        estimatedTimeRemaining: estimateTimeRemaining(video.duration, falStatus.logs),
      });
    }

    // No request ID - something went wrong
    return NextResponse.json({
      status: video.status || "pending",
      message: "Waiting for generation to start",
    });

  } catch (error) {
    console.error("[Video Status] Error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}

/**
 * Retry failed generation
 */
export async function POST(request, { params }) {
  const videoId = params.id;

  try {
    const { data: video } = await supabase
      .from("videos")
      .select("*, campaigns(user_id)")
      .eq("id", videoId)
      .single();

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.status !== "failed") {
      return NextResponse.json(
        { error: "Can only retry failed videos" },
        { status: 400 }
      );
    }

    if (video.retry_count >= 3) {
      return NextResponse.json(
        { error: "Maximum retries exceeded" },
        { status: 400 }
      );
    }

    // Import here to avoid circular dependency
    const { submitGeneration } = await import("@/lib/video/kling");

    // Resubmit generation
    const result = await submitGeneration({
      avatarImageUrl: video.avatar_image_url,
      script: video.script,
      audioUrl: video.audio_url,
      duration: video.duration,
      aspectRatio: video.aspect_ratio || "9:16",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Update video record
    await supabase
      .from("videos")
      .update({
        status: "generating",
        generation_request_id: result.requestId,
        generation_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", videoId);

    return NextResponse.json({
      success: true,
      status: "generating",
      requestId: result.requestId,
    });

  } catch (error) {
    console.error("[Video Retry] Error:", error);
    return NextResponse.json(
      { error: "Failed to retry generation" },
      { status: 500 }
    );
  }
}

// ===========================================
// HELPERS
// ===========================================

function parseProgress(logs) {
  if (!logs || !Array.isArray(logs)) {
    return null;
  }

  // Look for progress indicators in logs
  for (const log of logs.reverse()) {
    const progressMatch = log.message?.match(/(\d+)%/);
    if (progressMatch) {
      return parseInt(progressMatch[1], 10);
    }
  }

  return null;
}

function estimateTimeRemaining(duration, logs) {
  // Rough estimation: 2-3 minutes per 10 seconds of video
  const baseTime = (duration / 10) * 150; // seconds

  const progress = parseProgress(logs);
  if (progress && progress > 0) {
    const remaining = baseTime * (1 - progress / 100);
    return Math.round(remaining);
  }

  return Math.round(baseTime);
}

async function queueThumbnailGeneration(videoId, videoUrl) {
  // This would call Railway FFmpeg service
  // For now, just log
  console.log(`[Thumbnail] Queued for video ${videoId}`);

  const ffmpegUrl = process.env.RAILWAY_FFMPEG_URL;
  if (!ffmpegUrl) return;

  try {
    await fetch(`${ffmpegUrl}/extract-thumbnail`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RAILWAY_API_KEY}`,
      },
      body: JSON.stringify({
        videoUrl,
        videoId,
        timestamp: 1, // 1 second into video
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/videos/${videoId}/thumbnail`,
      }),
    });
  } catch (error) {
    console.error("[Thumbnail] Queue failed:", error);
  }
}
