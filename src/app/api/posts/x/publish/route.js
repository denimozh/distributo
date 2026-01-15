import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import crypto from "crypto";
import OAuth from "oauth-1.0a";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST a single tweet to X
async function postToX(accessToken, accessTokenSecret, content, communityId = null) {
  const oauth = new OAuth({
    consumer: {
      key: process.env.X_CLIENT_ID,
      secret: process.env.X_CLIENT_SECRET,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });

  const token = {
    key: accessToken,
    secret: accessTokenSecret,
  };

  // Build tweet payload
  const tweetData = { text: content };
  
  // If posting to a community, add community_id as a string
  // X API v2 expects community_id as a string parameter
  if (communityId) {
    tweetData.community_id = String(communityId);
    // Optionally also share to main timeline
    tweetData.share_with_followers = false;
  }

  console.log("Posting tweet with data:", JSON.stringify(tweetData));

  const url = "https://api.twitter.com/2/tweets";
  
  const authHeader = oauth.toHeader(
    oauth.authorize({ url, method: "POST" }, token)
  );

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeader,
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
      .limit(10); // Process 10 at a time

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
          .select("access_token, access_token_secret")
          .eq("user_id", post.user_id)
          .eq("platform", "x")
          .eq("is_active", true)
          .single();

        if (accountError || !account) {
          throw new Error("No connected X account found");
        }

        if (!account.access_token || !account.access_token_secret) {
          throw new Error("Missing X OAuth tokens");
        }

        // Get community ID if posting to a community
        const communityId = post.x_communities?.community_id || null;
        
        console.log(`Post ${post.id}: community_id FK = ${post.community_id}, X community_id = ${communityId}`);

        // Post to X
        const result = await postToX(
          account.access_token,
          account.access_token_secret,
          post.content,
          communityId
        );

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

// GET endpoint to check status (useful for debugging)
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