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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    const now = new Date().toISOString();
    console.log(`[CRON] ====== Starting at ${now} ======`);

    // Get posts that are due to be posted
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'scheduled')
      .eq('platform', 'x')
      .lte('scheduled_at', now)
      .order('scheduled_at', { ascending: true })
      .limit(10);

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
      const postResult = { id: post.id, status: 'pending' };
      
      try {
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

        console.log(`[CRON] Processing post ${post.id} for @${account.platform_username}`);

        // Get valid access token (refreshes if needed)
        let accessToken;
        try {
          accessToken = await getValidAccessToken(account);
        } catch (tokenError) {
          console.error(`[CRON] Token error:`, tokenError.message);
          throw new Error(`Token error: ${tokenError.message}`);
        }

        // Post to X
        console.log(`[CRON] Posting tweet: "${post.content.substring(0, 50)}..."`);
        
        const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: post.content })
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

        processed++;
        postResult.status = 'posted';
        postResult.tweet_id = tweetId;

      } catch (postError) {
        console.error(`[CRON] Error processing post ${post.id}:`, postError.message);
        
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
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString(),
        duration_ms: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

// Support POST method too
export async function POST(request) {
  return GET(request);
}

// ==========================================
// TOKEN MANAGEMENT (inline for reliability)
// ==========================================

/**
 * Get a valid access token, refreshing if needed
 */
async function getValidAccessToken(account) {
  const now = new Date();
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
  
  // Refresh if expired or expiring in less than 5 minutes
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  const needsRefresh = !expiresAt || expiresAt <= fiveMinutesFromNow;
  
  if (needsRefresh) {
    console.log(`[CRON] Token needs refresh (expires: ${expiresAt?.toISOString() || 'unknown'})`);
    return await refreshXAccessToken(account);
  }
  
  return account.access_token;
}

/**
 * Refresh X OAuth 2.0 access token
 * 
 * CRITICAL: X refresh tokens are SINGLE-USE!
 * When you refresh, X gives you a NEW refresh token.
 * The old refresh token becomes invalid immediately.
 */
async function refreshXAccessToken(account) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;

  if (!account.refresh_token) {
    throw new Error('No refresh token - user must reconnect');
  }

  console.log(`[CRON] Refreshing token for @${account.platform_username}`);

  // X requires Basic auth for confidential clients
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
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

  const responseText = await response.text();
  
  let tokenData;
  try {
    tokenData = JSON.parse(responseText);
  } catch {
    console.error('[CRON] Invalid token response:', responseText);
    throw new Error('Invalid response from X');
  }

  if (!response.ok) {
    console.error('[CRON] Token refresh failed:', tokenData);
    
    if (tokenData.error === 'invalid_grant') {
      // Mark account as needing reconnection
      await supabase
        .from('connected_accounts')
        .update({
          is_active: false,
          error_message: 'Session expired - please reconnect your X account',
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);
      
      throw new Error('Session expired - user must reconnect X account');
    }
    
    throw new Error(tokenData.error_description || tokenData.error || 'Token refresh failed');
  }

  // CRITICAL: Save the NEW refresh token immediately!
  const newAccessToken = tokenData.access_token;
  const newRefreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in || 7200;

  if (!newRefreshToken) {
    console.warn('[CRON] No new refresh token received - this may cause issues');
  }

  const { error: updateError } = await supabase
    .from('connected_accounts')
    .update({
      access_token: newAccessToken,
      refresh_token: newRefreshToken || account.refresh_token,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  if (updateError) {
    console.error('[CRON] Failed to save tokens:', updateError);
    // Continue anyway - current request will work
  }

  console.log(`[CRON] Token refreshed for @${account.platform_username}`);
  
  return newAccessToken;
}