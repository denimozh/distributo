// src/app/api/cron/post-scheduled/route.js
// UPDATED: Now supports threaded posting (Hook + Plug pattern) for algorithm optimization
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Delay between hook and plug (in milliseconds)
// 60 seconds is optimal - gives time for initial engagement before adding link
const PLUG_DELAY_MS = 60 * 1000;

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
      const postResult = { 
        id: post.id, 
        platform: post.platform, 
        status: 'pending',
        is_thread: post.is_thread || post.has_plug || false,
      };
      
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

// ============================================================================
// X (TWITTER) POSTING - WITH THREADING SUPPORT
// ============================================================================

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

  // Determine if this is a threaded post (hook + plug pattern)
  const isThread = post.is_thread || post.has_plug || (post.hook_content && post.plug_content);
  
  if (isThread) {
    console.log(`[CRON] 🧵 Posting as THREAD (Hook + Plug pattern for algorithm optimization)`);
    await postXThread(post, account, accessToken, postResult);
  } else {
    console.log(`[CRON] Posting single tweet`);
    await postSingleXTweet(post, account, accessToken, postResult);
  }
}

// ============================================================================
// POST X THREAD (Hook → 60s delay → Plug as reply)
// This is the key algorithm optimization!
// ============================================================================

async function postXThread(post, account, accessToken, postResult) {
  // Use hook_content if available, otherwise fall back to content
  const hookContent = post.hook_content || post.content;
  const plugContent = post.plug_content;

  if (!hookContent) {
    throw new Error('No hook content available for thread');
  }

  // ========================================
  // STEP 1: Post the HOOK (no link, max engagement)
  // ========================================
  console.log(`[CRON] 🪝 Posting HOOK: "${hookContent.substring(0, 50)}..."`);
  
  const hookPayload = { text: hookContent };
  
  // Add community if specified
  if (post.community_id) {
    // Look up the community's X ID
    const { data: community } = await supabase
      .from('x_communities')
      .select('community_id')
      .eq('id', post.community_id)
      .single();
    
    if (community?.community_id) {
      hookPayload.community_id = community.community_id;
      hookPayload.share_with_followers = false; // Community-only by default
    }
  }

  const hookResponse = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hookPayload)
  });

  const hookResponseText = await hookResponse.text();
  let hookData;
  
  try {
    hookData = JSON.parse(hookResponseText);
  } catch {
    console.error('[CRON] Invalid JSON response:', hookResponseText);
    throw new Error('Invalid response from X API');
  }

  if (!hookResponse.ok) {
    console.error('[CRON] X API error on HOOK:', hookData);
    throw new Error(hookData.detail || hookData.title || hookData.errors?.[0]?.message || 'Failed to post hook tweet');
  }

  const hookTweetId = hookData.data?.id;
  console.log(`[CRON] ✅ HOOK posted! ID: ${hookTweetId}`);

  // Store hook tweet info
  postResult.hook_tweet_id = hookTweetId;

  // ========================================
  // STEP 2: Wait 60 seconds (let hook get initial engagement)
  // ========================================
  if (plugContent) {
    console.log(`[CRON] ⏳ Waiting ${PLUG_DELAY_MS / 1000}s before posting PLUG...`);
    await new Promise(resolve => setTimeout(resolve, PLUG_DELAY_MS));

    // ========================================
    // STEP 3: Post the PLUG as a reply (with link)
    // ========================================
    console.log(`[CRON] 🔗 Posting PLUG as reply: "${plugContent.substring(0, 50)}..."`);

    const plugPayload = {
      text: plugContent,
      reply: {
        in_reply_to_tweet_id: hookTweetId,
      },
    };

    const plugResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plugPayload)
    });

    const plugResponseText = await plugResponse.text();
    let plugData;
    
    try {
      plugData = JSON.parse(plugResponseText);
    } catch {
      console.error('[CRON] Invalid JSON response for plug:', plugResponseText);
      // Don't throw - hook already posted, just log the error
    }

    if (plugResponse.ok && plugData?.data?.id) {
      const plugTweetId = plugData.data.id;
      console.log(`[CRON] ✅ PLUG posted! ID: ${plugTweetId}`);
      postResult.plug_tweet_id = plugTweetId;
    } else {
      console.error('[CRON] ⚠️ PLUG failed but HOOK succeeded:', plugData);
      // Don't throw - hook was successful
    }
  }

  // ========================================
  // STEP 4: Update post status in database
  // ========================================
  await supabase
    .from('posts')
    .update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      external_id: hookTweetId, // Store hook as primary
      external_url: `https://x.com/${account.platform_username}/status/${hookTweetId}`,
      plug_tweet_id: postResult.plug_tweet_id || null,
      error_message: null,
    })
    .eq('id', post.id);

  postResult.tweet_id = hookTweetId;
  console.log(`[CRON] 🎉 Thread complete! Hook: ${hookTweetId}, Plug: ${postResult.plug_tweet_id || 'N/A'}`);
}

// ============================================================================
// POST SINGLE TWEET (legacy, non-threaded)
// ============================================================================

async function postSingleXTweet(post, account, accessToken, postResult) {
  console.log(`[CRON] Posting tweet: "${post.content.substring(0, 50)}..."`);
  
  const payload = { text: post.content };
  
  // Add community if specified
  if (post.community_id) {
    const { data: community } = await supabase
      .from('x_communities')
      .select('community_id')
      .eq('id', post.community_id)
      .single();
    
    if (community?.community_id) {
      payload.community_id = community.community_id;
      payload.share_with_followers = false;
    }
  }

  const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const responseText = await tweetResponse.text();
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

  // Update post status
  await supabase
    .from('posts')
    .update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      external_id: tweetId,
      external_url: `https://x.com/${account.platform_username}/status/${tweetId}`,
      error_message: null,
    })
    .eq('id', post.id);

  postResult.tweet_id = tweetId;
}

// ============================================================================
// X TOKEN REFRESH
// ============================================================================

async function getValidXAccessToken(account) {
  // Check if token is expired
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();
  
  if (!isExpired) {
    return account.access_token;
  }

  console.log(`[CRON] X token expired, refreshing...`);
  
  if (!account.refresh_token) {
    throw new Error('No refresh token available. User needs to reconnect X account.');
  }

  // Refresh the token
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const refreshResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: account.refresh_token,
    }).toString(),
  });

  if (!refreshResponse.ok) {
    const errorData = await refreshResponse.json();
    console.error('[CRON] X token refresh failed:', errorData);
    throw new Error('Failed to refresh X token. User needs to reconnect.');
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

// ============================================================================
// LINKEDIN POSTING
// ============================================================================

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

  // For LinkedIn, we combine hook + plug into one post (no threading API)
  let content = post.content;
  if (post.hook_content && post.plug_content) {
    content = `${post.hook_content}\n\n${post.plug_content}`;
  }

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

  postResult.linkedin_post_id = linkedinPostId;
}

// ============================================================================
// LINKEDIN TOKEN REFRESH
// ============================================================================

async function getValidLinkedInAccessToken(account) {
  // Check if token is expired
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
  const isExpired = expiresAt && expiresAt < new Date();
  
  if (!isExpired) {
    return account.access_token;
  }

  console.log(`[CRON] LinkedIn token expired, attempting refresh...`);
  
  if (!account.refresh_token) {
    throw new Error('LinkedIn token expired. User needs to reconnect.');
  }

  // Try to refresh the token
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: account.refresh_token,
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
  });

  const refreshResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!refreshResponse.ok) {
    const errorData = await refreshResponse.json().catch(() => ({}));
    console.error('[CRON] LinkedIn token refresh failed:', errorData);
    throw new Error('LinkedIn token expired. User needs to reconnect.');
  }

  const tokens = await refreshResponse.json();
  
  // Save the new tokens
  await supabase
    .from('connected_accounts')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || account.refresh_token,
      token_expires_at: tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
    })
    .eq('id', account.id);

  console.log(`[CRON] LinkedIn token refreshed successfully`);
  return tokens.access_token;
}