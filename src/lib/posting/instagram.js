// src/lib/posting/instagram.js
// Instagram Graph API Integration for Reels Posting

import { createClient } from "@supabase/supabase-js";

const FACEBOOK_GRAPH_URL = "https://graph.facebook.com/v18.0";

// ===========================================
// VIDEO POSTING
// ===========================================

/**
 * Post a Reel to Instagram
 * Uses Facebook Graph API with Instagram Content Publishing
 */
export async function postVideoToInstagram({
  userId,
  videoUrl,
  caption,
  coverTimestamp = 0, // Seconds into video for cover
  shareToFeed = true,
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get user's Instagram connection
  const { data: connection, error: connectionError } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "instagram")
    .single();

  if (connectionError || !connection) {
    return {
      success: false,
      error: "Instagram not connected. Please connect your account in Settings.",
    };
  }

  // Check if token needs refresh
  const accessToken = await getValidAccessToken(connection, supabase);
  const igAccountId = connection.platform_user_id;

  try {
    // Step 1: Create media container
    console.log("[Instagram] Creating media container...");
    
    const containerResponse = await fetch(
      `${FACEBOOK_GRAPH_URL}/${igAccountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: videoUrl,
          caption: formatInstagramCaption(caption),
          share_to_feed: shareToFeed,
          access_token: accessToken,
        }),
      }
    );

    const containerData = await containerResponse.json();

    if (containerData.error) {
      console.error("[Instagram] Container error:", containerData.error);
      throw new Error(containerData.error.message);
    }

    const containerId = containerData.id;
    console.log("[Instagram] Container created:", containerId);

    // Step 2: Wait for processing
    console.log("[Instagram] Waiting for video processing...");
    await waitForProcessing(containerId, accessToken);

    // Step 3: Publish
    console.log("[Instagram] Publishing...");
    const publishResponse = await fetch(
      `${FACEBOOK_GRAPH_URL}/${igAccountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    const publishData = await publishResponse.json();

    if (publishData.error) {
      throw new Error(publishData.error.message);
    }

    // Get the permalink
    const mediaResponse = await fetch(
      `${FACEBOOK_GRAPH_URL}/${publishData.id}?fields=permalink&access_token=${accessToken}`
    );
    const mediaData = await mediaResponse.json();

    return {
      success: true,
      postId: publishData.id,
      postUrl: mediaData.permalink || `https://www.instagram.com/reel/${publishData.id}/`,
    };

  } catch (error) {
    console.error("[Instagram] Post error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Wait for video to finish processing
 */
async function waitForProcessing(containerId, accessToken, maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${FACEBOOK_GRAPH_URL}/${containerId}?fields=status_code,status&access_token=${accessToken}`
    );
    const data = await response.json();

    console.log(`[Instagram] Processing status (${attempt + 1}/${maxAttempts}):`, data.status_code);

    if (data.status_code === "FINISHED") {
      return true;
    }

    if (data.status_code === "ERROR") {
      throw new Error(data.status || "Video processing failed");
    }

    if (data.status_code === "EXPIRED") {
      throw new Error("Video upload expired. Please try again.");
    }

    // Wait 10 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  throw new Error("Video processing timeout. The video may still be processing - check Instagram manually.");
}

// ===========================================
// CAPTION FORMATTING
// ===========================================

/**
 * Format caption for Instagram
 * - Max 2200 characters
 * - Max 30 hashtags
 * - Handles line breaks
 */
function formatInstagramCaption(caption) {
  if (!caption) return "";

  let formatted = caption;

  // Truncate if too long
  if (formatted.length > 2200) {
    formatted = formatted.substring(0, 2197) + "...";
  }

  // Count and limit hashtags
  const hashtagMatches = formatted.match(/#\w+/g) || [];
  if (hashtagMatches.length > 30) {
    // Remove excess hashtags
    let count = 0;
    formatted = formatted.replace(/#\w+/g, (match) => {
      count++;
      return count <= 30 ? match : "";
    });
  }

  return formatted;
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

  // If token expires in less than 7 days, refresh it
  if (tokenExpiry - now < 7 * 24 * 60 * 60 * 1000) {
    return refreshAccessToken(connection, supabase);
  }

  return connection.access_token;
}

/**
 * Refresh Instagram/Facebook access token
 */
async function refreshAccessToken(connection, supabase) {
  // Instagram uses the long-lived token stored in refresh_token
  const currentToken = connection.refresh_token || connection.access_token;

  const response = await fetch(
    `${FACEBOOK_GRAPH_URL}/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        fb_exchange_token: currentToken,
      })
  );

  const data = await response.json();

  if (data.error) {
    // Token refresh failed - user needs to reconnect
    await supabase
      .from("platform_connections")
      .update({ is_active: false })
      .eq("id", connection.id);

    throw new Error("Instagram session expired. Please reconnect your account.");
  }

  const newToken = data.access_token;
  const expiresIn = data.expires_in || 5184000;
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

  // Need to get new page token
  const pagesResponse = await fetch(
    `${FACEBOOK_GRAPH_URL}/me/accounts?access_token=${newToken}`
  );
  const pagesData = await pagesResponse.json();

  const pageId = connection.metadata?.facebook_page_id;
  const page = pagesData.data?.find(p => p.id === pageId) || pagesData.data?.[0];

  if (!page) {
    throw new Error("Facebook Page no longer accessible");
  }

  // Update tokens in database
  await supabase
    .from("platform_connections")
    .update({
      access_token: page.access_token,
      refresh_token: newToken,
      token_expires_at: tokenExpiresAt.toISOString(),
    })
    .eq("id", connection.id);

  return page.access_token;
}

// ===========================================
// STATS FETCHING
// ===========================================

/**
 * Get Instagram Reel insights
 */
export async function getReelInsights({
  userId,
  mediaId,
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: connection } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "instagram")
    .single();

  if (!connection) {
    throw new Error("Instagram not connected");
  }

  const accessToken = await getValidAccessToken(connection, supabase);

  // Reel-specific metrics
  const metrics = [
    "plays",
    "reach",
    "saved",
    "shares",
    "comments",
    "likes",
    "total_interactions",
  ].join(",");

  const response = await fetch(
    `${FACEBOOK_GRAPH_URL}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  // Parse metrics into clean object
  const insights = {};
  for (const metric of data.data || []) {
    insights[metric.name] = metric.values[0]?.value || 0;
  }

  return insights;
}

/**
 * Get all recent Reels with stats
 */
export async function getRecentReels(userId, limit = 25) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: connection } = await supabase
    .from("platform_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "instagram")
    .single();

  if (!connection) {
    throw new Error("Instagram not connected");
  }

  const accessToken = await getValidAccessToken(connection, supabase);
  const igAccountId = connection.platform_user_id;

  const response = await fetch(
    `${FACEBOOK_GRAPH_URL}/${igAccountId}/media?` +
      new URLSearchParams({
        fields: "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
        limit: String(limit),
        access_token: accessToken,
      })
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  // Filter to only Reels
  const reels = (data.data || []).filter(media => 
    media.media_type === "VIDEO" || media.media_type === "REELS"
  );

  return reels.map(reel => ({
    id: reel.id,
    caption: reel.caption,
    thumbnailUrl: reel.thumbnail_url,
    permalink: reel.permalink,
    timestamp: reel.timestamp,
    likes: reel.like_count,
    comments: reel.comments_count,
  }));
}

// ===========================================
// SCHEDULING HELPERS
// ===========================================

/**
 * Get optimal Instagram posting time
 * Best times: Tuesday-Wednesday, 6-9pm local
 */
export function getOptimalInstagramTime(timezone = "UTC") {
  const now = new Date();
  const userNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));

  // Find next Tuesday (2) or Wednesday (3)
  let postTime = new Date(userNow);
  const currentDay = postTime.getDay();
  const currentHour = postTime.getHours();

  // If it's Tuesday or Wednesday and before 6pm, post today at 6pm
  if ((currentDay === 2 || currentDay === 3) && currentHour < 18) {
    postTime.setHours(18, 0, 0, 0);
    return postTime.toISOString();
  }

  // If it's Tuesday or Wednesday after 6pm, check if we can still post by 9pm
  if ((currentDay === 2 || currentDay === 3) && currentHour >= 18 && currentHour < 21) {
    // Post now-ish (next hour)
    postTime.setHours(currentHour + 1, 0, 0, 0);
    return postTime.toISOString();
  }

  // Otherwise, find next Tuesday or Wednesday
  let daysToAdd;
  if (currentDay === 0) daysToAdd = 2; // Sunday -> Tuesday
  else if (currentDay === 1) daysToAdd = 1; // Monday -> Tuesday
  else if (currentDay === 2) daysToAdd = 1; // Tuesday (late) -> Wednesday
  else if (currentDay === 3) daysToAdd = 6; // Wednesday (late) -> Tuesday
  else if (currentDay === 4) daysToAdd = 5; // Thursday -> Tuesday
  else if (currentDay === 5) daysToAdd = 4; // Friday -> Tuesday
  else daysToAdd = 3; // Saturday -> Tuesday

  postTime.setDate(postTime.getDate() + daysToAdd);
  postTime.setHours(18, 0, 0, 0); // 6pm

  return postTime.toISOString();
}

/**
 * Queue a video for Instagram posting
 */
export async function queueInstagramPost({
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

  const postTime = scheduledAt || getOptimalInstagramTime(timezone);

  const { data, error } = await supabase
    .from("post_queue")
    .insert({
      user_id: userId,
      video_id: videoId,
      platform: "instagram",
      caption,
      scheduled_at: postTime,
      status: "queued",
    })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to queue post: " + error.message);
  }

  return {
    ...data,
    scheduledAtFormatted: new Date(postTime).toLocaleString(),
  };
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  postVideoToInstagram,
  getReelInsights,
  getRecentReels,
  getOptimalInstagramTime,
  queueInstagramPost,
};
