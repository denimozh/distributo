// src/lib/posting/tiktok.js
// TikTok Content Posting API Integration
// Handles video uploads and publishing

import { createClient } from "@supabase/supabase-js";

const TIKTOK_API_URL = "https://open.tiktokapis.com/v2";

// ===========================================
// VIDEO POSTING
// ===========================================

/**
 * Post a video to TikTok
 * Uses the Content Posting API (video.upload + video.publish scopes)
 */
export async function postVideoToTikTok({
  userId,
  videoUrl,
  caption,
  coverTimestamp = 1000, // ms into video for cover image
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get user's TikTok connection
  const { data: connection, error: connectionError } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "tiktok")
    .single();

  if (connectionError || !connection) {
    throw new Error("TikTok not connected. Please connect your account in Settings.");
  }

  // Check if token needs refresh
  const accessToken = await getValidAccessToken(connection, supabase);

  try {
    // Step 1: Initialize video upload
    const initResponse = await fetch(`${TIKTOK_API_URL}/post/publish/video/init/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: caption.substring(0, 150), // TikTok title limit
          privacy_level: "PUBLIC_TO_EVERYONE",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: coverTimestamp,
        },
        source_info: {
          source: "PULL_FROM_URL",
          video_url: videoUrl,
        },
      }),
    });

    const initData = await initResponse.json();

    if (initData.error) {
      console.error("[TikTok] Init error:", initData);
      throw new Error(initData.error.message || "Failed to initialize upload");
    }

    const publishId = initData.data.publish_id;

    // Step 2: Poll for publish status
    const result = await pollPublishStatus(publishId, accessToken);

    return {
      success: true,
      publishId: publishId,
      videoId: result.video_id,
      // Note: TikTok doesn't return direct URL, construct it
      videoUrl: `https://www.tiktok.com/@${connection.platform_username}/video/${result.video_id}`,
    };

  } catch (error) {
    console.error("[TikTok] Post error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Poll for video publish status
 * TikTok processing can take a few minutes
 */
async function pollPublishStatus(publishId, accessToken, maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusResponse = await fetch(
      `${TIKTOK_API_URL}/post/publish/status/fetch/`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          publish_id: publishId,
        }),
      }
    );

    const statusData = await statusResponse.json();

    if (statusData.error) {
      throw new Error(statusData.error.message || "Failed to check status");
    }

    const status = statusData.data.status;

    if (status === "PUBLISH_COMPLETE") {
      return {
        video_id: statusData.data.video_id,
      };
    }

    if (status === "FAILED") {
      throw new Error(
        statusData.data.fail_reason || "Video publish failed"
      );
    }

    // Wait 10 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  throw new Error("Publish timeout - video is still processing");
}

// ===========================================
// TOKEN MANAGEMENT
// ===========================================

/**
 * Get valid access token, refreshing if needed
 */
async function getValidAccessToken(connection, supabase) {
  const tokenExpiry = new Date(connection.token_expires_at);
  const now = new Date();

  // If token expires in less than 5 minutes, refresh it
  if (tokenExpiry - now < 5 * 60 * 1000) {
    return refreshAccessToken(connection, supabase);
  }

  return connection.access_token;
}

/**
 * Refresh TikTok access token
 */
async function refreshAccessToken(connection, supabase) {
  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: connection.refresh_token,
    }),
  });

  const data = await response.json();

  if (data.error) {
    // Token refresh failed - user needs to reconnect
    await supabase
      .from("platform_connections")
      .update({ is_active: false })
      .eq("id", connection.id);

    throw new Error("TikTok session expired. Please reconnect your account.");
  }

  const {
    access_token,
    refresh_token,
    expires_in,
  } = data.data;

  const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

  // Update tokens in database
  await supabase
    .from("platform_connections")
    .update({
      access_token,
      refresh_token,
      token_expires_at: tokenExpiresAt.toISOString(),
    })
    .eq("id", connection.id);

  return access_token;
}

// ===========================================
// STATS FETCHING
// ===========================================

/**
 * Get video stats from TikTok
 * Requires user.info.stats scope
 */
export async function getVideoStats({
  userId,
  videoIds, // Array of TikTok video IDs
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: connection } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "tiktok")
    .single();

  if (!connection) {
    throw new Error("TikTok not connected");
  }

  const accessToken = await getValidAccessToken(connection, supabase);

  // TikTok Video Query API
  const response = await fetch(`${TIKTOK_API_URL}/video/query/`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filters: {
        video_ids: videoIds,
      },
      fields: [
        "id",
        "title",
        "video_description",
        "duration",
        "cover_image_url",
        "share_url",
        "view_count",
        "like_count",
        "comment_count",
        "share_count",
        "create_time",
      ],
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Failed to fetch video stats");
  }

  return data.data.videos.map(video => ({
    videoId: video.id,
    title: video.title,
    views: video.view_count,
    likes: video.like_count,
    comments: video.comment_count,
    shares: video.share_count,
    duration: video.duration,
    coverUrl: video.cover_image_url,
    shareUrl: video.share_url,
    createdAt: video.create_time,
  }));
}

/**
 * Get user's TikTok profile stats
 */
export async function getUserStats(userId) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: connection } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "tiktok")
    .single();

  if (!connection) {
    throw new Error("TikTok not connected");
  }

  const accessToken = await getValidAccessToken(connection, supabase);

  const response = await fetch(
    `${TIKTOK_API_URL}/user/info/?fields=follower_count,following_count,likes_count,video_count`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || "Failed to fetch user stats");
  }

  return {
    followers: data.data.user.follower_count,
    following: data.data.user.following_count,
    totalLikes: data.data.user.likes_count,
    videoCount: data.data.user.video_count,
  };
}

// ===========================================
// SCHEDULING HELPERS
// ===========================================

/**
 * Get optimal posting time based on user's timezone
 * Default: 7pm local time
 */
export function getOptimalPostTime(timezone = "UTC") {
  const now = new Date();
  
  // Create date in user's timezone
  const userNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  
  // Set to 7pm today
  let postTime = new Date(userNow);
  postTime.setHours(19, 0, 0, 0);
  
  // If 7pm has passed, schedule for tomorrow
  if (postTime <= userNow) {
    postTime.setDate(postTime.getDate() + 1);
  }
  
  // Convert back to UTC for storage
  return postTime.toISOString();
}

/**
 * Queue a video for posting
 */
export async function queueVideoPost({
  userId,
  videoId,
  caption,
  scheduledAt = null,
  timezone = "UTC",
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const postTime = scheduledAt || getOptimalPostTime(timezone);

  const { data, error } = await supabase
    .from("post_queue")
    .insert({
      user_id: userId,
      video_id: videoId,
      platform: "tiktok",
      caption,
      scheduled_at: postTime,
      status: "queued",
    })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to queue post: " + error.message);
  }

  return data;
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  postVideoToTikTok,
  getVideoStats,
  getUserStats,
  getOptimalPostTime,
  queueVideoPost,
};
