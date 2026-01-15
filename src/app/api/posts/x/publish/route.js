import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Refresh OAuth 2.0 token if expired
async function refreshXToken(account) {
  // Check if token is expired (with 5 min buffer)
  const now = new Date();
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
  
  if (expiresAt && expiresAt > new Date(now.getTime() + 5 * 60 * 1000)) {
    // Token still valid
    return account.access_token;
  }

  if (!account.refresh_token) {
    throw new Error("No refresh token available - user needs to reconnect");
  }

  console.log("Refreshing expired X token...");

  // Refresh the token
  const basicAuth = Buffer.from(
    `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Token refresh failed:", data);
    throw new Error("Failed to refresh X token - user may need to reconnect");
  }

  // Update tokens in database
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  
  await supabaseAdmin
    .from("connected_accounts")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token || account.refresh_token,
      token_expires_at: newExpiresAt,
    })
    .eq("id", account.id);

  console.log("Token refreshed successfully, expires at:", newExpiresAt);

  return data.access_token;
}

// POST a single tweet to X using OAuth 2.0
async function postToX(accessToken, content, communityId = null) {
  // Build tweet payload
  const tweetData = { text: content };
  
  // If posting to a community
  if (communityId) {
    tweetData.community_id = String(communityId);
  }

  console.log("Posting tweet with data:", JSON.stringify(tweetData));

  const response = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tweetData),
  });

  const data = await response.json();
  
  console.log("X API response:", response.status, JSON.stringify(data));
  
  if (!response.ok) {
    throw new Error(data.detail || data.title || data.errors?.[0]?.message || JSON.stringify(data));
  }

  return data;
}

// This endpoint processes due scheduled posts
export async function POST(request) {
  try {
    // Verify this is called by a cron job or admin (optional security)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow without auth in development
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get all scheduled posts that are due
    const now = new Date().toISOString();
    
    const { data: duePosts, error: fetchError } = await supabaseAdmin
      .from("posts")
      .select(`
        *,
        x_communities (
          community_id
        )
      `)
      .eq("status", "scheduled")
      .eq("platform", "x")
      .lte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Error fetching posts:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ message: "No posts due", processed: 0 });
    }

    console.log(`Processing ${duePosts.length} due posts`);

    const results = [];

    for (const post of duePosts) {
      try {
        // Get user's X credentials
        const { data: account, error: accountError } = await supabaseAdmin
          .from("connected_accounts")
          .select("*")
          .eq("user_id", post.user_id)
          .eq("platform", "x")
          .eq("is_active", true)
          .single();

        if (accountError || !account) {
          throw new Error("No connected X account found");
        }

        // Refresh token if needed
        const accessToken = await refreshXToken(account);

        // Get community ID if posting to a community
        const communityId = post.x_communities?.community_id || null;
        
        console.log(`Post ${post.id}: X community_id = ${communityId}`);

        // Post to X
        const result = await postToX(accessToken, post.content, communityId);

        // Update post as posted
        await supabaseAdmin
          .from("posts")
          .update({
            status: "posted",
            posted_at: new Date().toISOString(),
            platform_post_id: result.data?.id,
            error_message: null,
          })
          .eq("id", post.id);

        results.push({ id: post.id, status: "posted", tweet_id: result.data?.id });
        console.log(`Posted tweet ${result.data?.id} for post ${post.id}`);

      } catch (postError) {
        console.error(`Error posting ${post.id}:`, postError.message);

        // Update post as failed
        await supabaseAdmin
          .from("posts")
          .update({
            status: "failed",
            error_message: postError.message,
          })
          .eq("id", post.id);

        results.push({ id: post.id, status: "failed", error: postError.message });
      }
    }

    return NextResponse.json({
      message: `Processed ${results.length} posts`,
      results,
    });

  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint to check status
export async function GET(request) {
  try {
    const now = new Date().toISOString();
    
    const { data: duePosts } = await supabaseAdmin
      .from("posts")
      .select("id, content, scheduled_at, status, platform")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .limit(20);

    const { count: pendingCount } = await supabaseAdmin
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "scheduled")
      .gt("scheduled_at", now);

    return NextResponse.json({
      due_now: duePosts?.length || 0,
      pending_future: pendingCount || 0,
      due_posts: duePosts,
      current_time: now,
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}