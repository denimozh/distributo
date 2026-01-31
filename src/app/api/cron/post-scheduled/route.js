// src/app/api/cron/post-scheduled/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const startTime = Date.now();
  
  // Check authorization (supports both Vercel cron and external services)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // In production, require auth
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    const providedSecret = authHeader?.replace('Bearer ', '').trim();
    
    if (providedSecret !== cronSecret) {
      console.log('[CRON] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const now = new Date().toISOString();
    console.log(`[CRON] ====== Starting at ${now} ======`);

    // Get all posts that are due to be posted (X and LinkedIn)
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .in('platform', ['x', 'linkedin'])
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(20);

    if (fetchError) {
      console.error('[CRON] Database error:', fetchError);
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!posts || posts.length === 0) {
      console.log('[CRON] No posts due for publishing');
      return NextResponse.json({
        success: true,
        message: 'No posts due',
        processed: 0,
        failed: 0,
        timestamp: now,
        duration_ms: Date.now() - startTime
      });
    }

    console.log(`[CRON] Found ${posts.length} post(s) to process`);

    let processed = 0;
    let failed = 0;
    const results = [];

    for (const post of posts) {
      const postResult = { id: post.id, platform: post.platform, status: 'pending' };
      
      try {
        if (post.platform === 'x') {
          await processXPost(post, postResult);
        } else if (post.platform === 'linkedin') {
          await processLinkedInPost(post, postResult);
        } else {
          throw new Error(`Unsupported platform: ${post.platform}`);
        }

        processed++;
        postResult.status = 'posted';

      } catch (postError) {
        console.error(`[CRON] Error processing ${post.platform} post ${post.id}:`, postError.message);
        
        const retryCount = (post.retry_count || 0) + 1;
        const shouldMarkFailed = retryCount >= 3;
        
        // Update post with error
        await supabase
          .from('posts')
          .update({
            status: shouldMarkFailed ? 'failed' : 'scheduled',
            error_message: postError.message,
            retry_count: retryCount,
          })
          .eq('id', post.id);

        failed++;
        postResult.status = 'error';
        postResult.error = postError.message;
        postResult.retry_count = retryCount;
      }

      results.push(postResult);
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] ====== Completed in ${duration}ms. Processed: ${processed}, Failed: ${failed} ======`);

    return NextResponse.json({
      success: true,
      processed,
      failed,
      results,
      timestamp: now,
      duration_ms: duration
    });

  } catch (error) {
    console.error('[CRON] Fatal error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      duration_ms: Date.now() - startTime
    }, { status: 500 });
  }
}

// ==========================================
// X (TWITTER) POSTING - WITH PLUG & COMMUNITY SUPPORT
// ==========================================

async function processXPost(post, postResult) {
  // Get the connected account for this user
  const { data: account, error: accountError } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('user_id', post.user_id)
    .eq('platform', 'x')
    .eq('is_active', true)
    .single();

  if (accountError || !account) {
    throw new Error('No connected X account found');
  }

  console.log(`[CRON] Processing X post ${post.id} for @${account.platform_username}`);

  // Get valid access token (refreshes if needed)
  const accessToken = await getValidXAccessToken(account);

  // Use hook_content if available, otherwise use content
  const mainContent = post.hook_content || post.content;
  
  // Build the tweet payload
  const tweetPayload = { text: mainContent };
  
  // Add community_id if posting to a community
  if (post.community_id) {
    tweetPayload.community_id = post.community_id;
    // share_with_followers = false means ONLY post to community
    // share_with_followers = true means post to community AND your timeline
    tweetPayload.share_with_followers = post.share_with_followers ?? false;
    console.log(`[CRON] Posting to community: ${post.community_id}, share_with_followers: ${tweetPayload.share_with_followers}`);
    console.log(`[CRON] Full payload:`, JSON.stringify(tweetPayload, null, 2));
  }

  // Post main tweet (hook)
  console.log(`[CRON] Posting tweet: "${mainContent.substring(0, 50)}..."`);
  
  const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tweetPayload)
  });

  const responseText = await tweetResponse.text();
  console.log(`[CRON] X API Response Status: ${tweetResponse.status}`);
  console.log(`[CRON] X API Response Body: ${responseText}`);
  
  let tweetData;
  
  try {
    tweetData = JSON.parse(responseText);
  } catch {
    console.error('[CRON] Invalid JSON response:', responseText);
    throw new Error('Invalid response from X API');
  }

  if (!tweetResponse.ok) {
    console.error('[CRON] X API error:', tweetData);
    throw new Error(tweetData.detail || tweetData.title || tweetData.errors?.[0]?.message || 'Failed to post tweet');
  }

  const tweetId = tweetData.data?.id;
  console.log(`[CRON] Tweet posted successfully! ID: ${tweetId}`);

  // Build URL based on whether it's a community post
  let externalUrl = `https://x.com/${account.platform_username}/status/${tweetId}`;
  if (post.community_id) {
    externalUrl = `https://x.com/i/communities/${post.community_id}`;
  }

  postResult.tweet_id = tweetId;
  postResult.external_url = externalUrl;

  // ==========================================
  // POST PLUG (REPLY WITH LINK) IF EXISTS
  // ==========================================
  if (post.plug_content && post.plug_content.trim()) {
    console.log(`[CRON] Post has plug content, waiting before posting reply...`);
    
    // Wait for reply delay (default 60 seconds)
    const replyDelay = (post.reply_delay || 60) * 1000;
    console.log(`[CRON] Waiting ${replyDelay / 1000}s before posting plug...`);
    
    await new Promise(resolve => setTimeout(resolve, replyDelay));
    
    // Post the plug as a reply
    const plugPayload = {
      text: post.plug_content,
      reply: {
        in_reply_to_tweet_id: tweetId
      }
    };
    
    console.log(`[CRON] Posting plug reply: "${post.plug_content.substring(0, 50)}..."`);
    
    const plugResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plugPayload)
    });
    
    const plugText = await plugResponse.text();
    let plugData;
    
    try {
      plugData = JSON.parse(plugText);
    } catch {
      console.error('[CRON] Invalid JSON response for plug:', plugText);
      // Don't throw - the main tweet was posted successfully
    }
    
    if (!plugResponse.ok) {
      console.error('[CRON] Failed to post plug reply:', plugData);
      // Don't throw - the main tweet was posted successfully
      // Just log the error and continue
    } else {
      const plugId = plugData.data?.id;
      console.log(`[CRON] Plug reply posted! ID: ${plugId}`);
      postResult.plug_id = plugId;
    }
  }

  // Update post status
  await supabase
    .from('posts')
    .update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      external_id: tweetId,
      external_url: externalUrl,
      error_message: null,
    })
    .eq('id', post.id);
}

// ==========================================
// TOKEN REFRESH
// ==========================================

async function getValidXAccessToken(account) {
  // Check if token is expired
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();
  
  if (!isExpired) {
    return account.access_token;
  }
  
  console.log(`[CRON] X token expired, refreshing...`);
  
  if (!account.refresh_token) {
    throw new Error('No refresh token available. User needs to reconnect.');
  }
  
  const clientId = process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  
  const refreshResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
    }),
  });
  
  if (!refreshResponse.ok) {
    const errorData = await refreshResponse.json().catch(() => ({}));
    console.error('[CRON] Token refresh failed:', errorData);
    throw new Error('Token refresh failed. User needs to reconnect.');
  }

  const tokens = await refreshResponse.json();
  
  // IMPORTANT: Save the new tokens (refresh tokens are single-use!)
  await supabase
    .from('connected_accounts')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token, // New refresh token!
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', account.id);

  console.log(`[CRON] X token refreshed successfully`);
  return tokens.access_token;
}

// ==========================================
// LINKEDIN POSTING
// ==========================================

async function processLinkedInPost(post, postResult) {
  // Get the connected LinkedIn account
  const { data: account, error: accountError } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('user_id', post.user_id)
    .eq('platform', 'linkedin')
    .eq('is_active', true)
    .single();

  if (accountError || !account) {
    throw new Error('No connected LinkedIn account found');
  }

  console.log(`[CRON] Processing LinkedIn post ${post.id} for ${account.platform_display_name || account.platform_username}`);

  // Get valid access token (refreshes if needed)
  const accessToken = await getValidLinkedInAccessToken(account);

  // Post to LinkedIn using UGC API
  const content = post.hook_content || post.content;
  console.log(`[CRON] Posting to LinkedIn: "${content.substring(0, 50)}..."`);
  
  const postBody = {
    author: `urn:li:person:${account.platform_user_id}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: content,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const linkedinResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  if (!linkedinResponse.ok) {
    const errorData = await linkedinResponse.json().catch(() => ({}));
    console.error('[CRON] LinkedIn API error:', linkedinResponse.status, errorData);
    
    if (linkedinResponse.status === 401) {
      throw new Error('LinkedIn token expired. User needs to reconnect.');
    }
    if (linkedinResponse.status === 403) {
      throw new Error('LinkedIn posting permission denied.');
    }
    
    throw new Error(errorData.message || `LinkedIn API error: ${linkedinResponse.status}`);
  }

  const responseData = await linkedinResponse.json();
  const linkedinPostId = responseData.id;
  
  console.log(`[CRON] LinkedIn post successful! ID: ${linkedinPostId}`);
  postResult.linkedin_id = linkedinPostId;

  // ==========================================
  // POST FIRST COMMENT IF EXISTS
  // ==========================================
  if (post.first_comment_content && post.first_comment_content.trim()) {
    console.log(`[CRON] Post has first comment, waiting before posting...`);
    
    // Wait for first comment delay (default 45 seconds)
    const commentDelay = (post.first_comment_delay_seconds || 45) * 1000;
    console.log(`[CRON] Waiting ${commentDelay / 1000}s before posting first comment...`);
    
    await new Promise(resolve => setTimeout(resolve, commentDelay));
    
    // Post comment using LinkedIn Comments API
    // Note: LinkedIn comment API requires the post URN
    const commentBody = {
      actor: `urn:li:person:${account.platform_user_id}`,
      message: {
        text: post.first_comment_content,
      },
      object: linkedinPostId, // The URN of the post
    };
    
    console.log(`[CRON] Posting first comment: "${post.first_comment_content.substring(0, 50)}..."`);
    
    try {
      const commentResponse = await fetch('https://api.linkedin.com/v2/socialActions/' + encodeURIComponent(linkedinPostId) + '/comments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(commentBody),
      });
      
      if (!commentResponse.ok) {
        const errorData = await commentResponse.json().catch(() => ({}));
        console.error('[CRON] Failed to post first comment:', errorData);
        // Don't throw - the main post was successful
      } else {
        const commentData = await commentResponse.json();
        console.log(`[CRON] First comment posted successfully!`);
        postResult.first_comment_id = commentData.id;
      }
    } catch (commentError) {
      console.error('[CRON] Error posting first comment:', commentError);
      // Don't throw - the main post was successful
    }
  }

  // Update post status
  await supabase
    .from('posts')
    .update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      external_id: linkedinPostId,
      error_message: null,
    })
    .eq('id', post.id);
}

async function getValidLinkedInAccessToken(account) {
  // Check if token is expired
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();
  
  if (!isExpired) {
    return account.access_token;
  }
  
  console.log(`[CRON] LinkedIn token expired, refreshing...`);
  
  if (!account.refresh_token) {
    throw new Error('No refresh token available. User needs to reconnect.');
  }
  
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  
  const refreshResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  
  if (!refreshResponse.ok) {
    const errorData = await refreshResponse.json().catch(() => ({}));
    console.error('[CRON] LinkedIn token refresh failed:', errorData);
    throw new Error('LinkedIn token refresh failed. User needs to reconnect.');
  }

  const tokens = await refreshResponse.json();
  
  // Save the new tokens
  await supabase
    .from('connected_accounts')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || account.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', account.id);

  console.log(`[CRON] LinkedIn token refreshed successfully`);
  return tokens.access_token;
}