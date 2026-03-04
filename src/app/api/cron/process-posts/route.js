// src/app/api/cron/process-posts/route.js
// Post Queue Processor
// Called hourly by cron-job.org to process scheduled posts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { postVideoToTikTok } from "@/lib/posting/tiktok";
import { postVideoToInstagram } from "@/lib/posting/instagram";
import { withRetry, classifyError } from "@/lib/queue/retry";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAX_POSTS_PER_RUN = 20;
const MAX_RETRIES = 3;

export async function GET(request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("[Cron] Starting post queue processing...");

  try {
    // Get posts due for processing
    const { data: pendingPosts, error: fetchError } = await supabase
      .from("post_queue")
      .select(`
        *,
        videos (id, video_url, script, thumbnail_url, duration),
        profiles:user_id (timezone, email)
      `)
      .eq("status", "queued")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(MAX_POSTS_PER_RUN);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingPosts || pendingPosts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No posts to process",
        processed: 0,
      });
    }

    console.log(`[Cron] Found ${pendingPosts.length} posts to process`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retrying: 0,
      details: [],
    };

    for (const post of pendingPosts) {
      results.processed++;

      try {
        // Mark as processing
        await supabase
          .from("post_queue")
          .update({ status: "processing" })
          .eq("id", post.id);

        // Verify video exists and has URL
        if (!post.videos?.video_url) {
          throw new Error("Video not ready or missing URL");
        }

        // Post to platform
        let postResult;

        if (post.platform === "tiktok") {
          postResult = await withRetry(
            () => postVideoToTikTok({
              userId: post.user_id,
              videoUrl: post.videos.video_url,
              caption: post.caption || post.videos.script,
            }),
            {
              maxAttempts: 2,
              baseDelay: 5000,
            }
          );
        } else if (post.platform === "instagram") {
          postResult = await withRetry(
            () => postVideoToInstagram({
              userId: post.user_id,
              videoUrl: post.videos.video_url,
              caption: post.caption || post.videos.script,
            }),
            {
              maxAttempts: 2,
              baseDelay: 5000,
            }
          );
        } else {
          throw new Error(`Unsupported platform: ${post.platform}`);
        }

        if (!postResult.success) {
          throw new Error(postResult.error);
        }

        // Success! Update queue
        await supabase
          .from("post_queue")
          .update({
            status: "posted",
            posted_at: new Date().toISOString(),
            platform_post_id: postResult.postId || postResult.videoId,
            platform_url: postResult.postUrl || postResult.videoUrl,
          })
          .eq("id", post.id);

        // Create posted_content record for tracking
        await supabase.from("posted_content").insert({
          video_id: post.video_id,
          user_id: post.user_id,
          platform: post.platform,
          platform_post_id: postResult.postId || postResult.videoId,
          platform_url: postResult.postUrl || postResult.videoUrl,
          caption: post.caption,
          posted_at: new Date().toISOString(),
          status: "posted",
        });

        // Send notification
        await createNotification({
          userId: post.user_id,
          type: "post_success",
          title: `Posted to ${post.platform}!`,
          message: `Your video is now live on ${post.platform}.`,
          data: {
            postId: postResult.postId || postResult.videoId,
            postUrl: postResult.postUrl || postResult.videoUrl,
            platform: post.platform,
          },
        });

        results.succeeded++;
        results.details.push({
          id: post.id,
          platform: post.platform,
          status: "posted",
          url: postResult.postUrl || postResult.videoUrl,
        });

        console.log(`[Cron] Posted ${post.id} to ${post.platform}`);

      } catch (error) {
        console.error(`[Cron] Failed to post ${post.id}:`, error);

        const errorClass = classifyError(error);
        const retryCount = (post.retry_count || 0) + 1;

        if (errorClass.retryable && retryCount < MAX_RETRIES) {
          // Schedule retry
          const retryDelay = errorClass.delay || (30 * 60 * 1000); // 30 min default
          const retryAt = new Date(Date.now() + retryDelay);

          await supabase
            .from("post_queue")
            .update({
              status: "queued",
              retry_count: retryCount,
              scheduled_at: retryAt.toISOString(),
              error_message: error.message,
            })
            .eq("id", post.id);

          results.retrying++;
          results.details.push({
            id: post.id,
            platform: post.platform,
            status: "retrying",
            retryAt: retryAt.toISOString(),
            error: error.message,
          });

        } else {
          // Max retries or non-retryable error
          await supabase
            .from("post_queue")
            .update({
              status: "failed",
              retry_count: retryCount,
              error_message: error.message,
            })
            .eq("id", post.id);

          // Notify user of failure
          await createNotification({
            userId: post.user_id,
            type: "post_failed",
            title: `Failed to post to ${post.platform}`,
            message: `We couldn't post your video after ${retryCount} attempts. Error: ${error.message}`,
            data: {
              videoId: post.video_id,
              platform: post.platform,
              error: error.message,
            },
          });

          results.failed++;
          results.details.push({
            id: post.id,
            platform: post.platform,
            status: "failed",
            error: error.message,
          });
        }
      }
    }

    console.log(`[Cron] Completed. Succeeded: ${results.succeeded}, Failed: ${results.failed}, Retrying: ${results.retrying}`);

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error("[Cron] Fatal error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Create in-app notification
 */
async function createNotification({ userId, type, title, message, data }) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false,
    });
  } catch (error) {
    console.error("[Notification] Failed to create:", error);
  }
}

/**
 * Manual trigger for testing
 */
export async function POST(request) {
  // Same auth check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` &&
      authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run the same logic
  return GET(request);
}
