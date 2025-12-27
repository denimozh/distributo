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
  if (process.env.NODE_ENV === 'production') {
    // Accept: "Bearer <secret>" or just "<secret>"
    const providedSecret = authHeader?.replace('Bearer ', '').trim();
    
    if (!cronSecret || providedSecret !== cronSecret) {
      console.log('[CRON] Unauthorized request');
      return NextResponse.json(
        { error: 'Unauthorized', hint: 'Add Authorization header with your CRON_SECRET' },
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

        // Check if token needs refresh
        let accessToken = account.access_token;
        const tokenExpiry = new Date(account.token_expires_at);
        const nowDate = new Date();

        if (tokenExpiry <= nowDate) {
          console.log(`[CRON] Token expired, refreshing...`);
          
          const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: account.refresh_token,
              client_id: process.env.X_CLIENT_ID,
            })
          });

          if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error('[CRON] Token refresh failed:', errorText);
            throw new Error('Failed to refresh X token - user may need to reconnect');
          }

          const tokenData = await tokenResponse.json();
          accessToken = tokenData.access_token;

          // Update tokens in database
          await supabase
            .from('connected_accounts')
            .update({
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token || account.refresh_token,
              token_expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', account.id);

          console.log('[CRON] Token refreshed successfully');
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

        // Log community reminder if applicable
        if (post.community_id) {
          console.log(`[CRON] 📢 Reminder: Share to community ${post.community_id}`);
        }

        processed++;
        postResult.status = 'posted';
        postResult.tweet_id = tweetId;

      } catch (postError) {
        console.error(`[CRON] Error processing post ${post.id}:`, postError.message);
        
        const retryCount = (post.retry_count || 0) + 1;
        
        // Update post with error (mark as failed after 3 retries)
        await supabase
          .from('posts')
          .update({
            status: retryCount >= 3 ? 'failed' : 'scheduled',
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

// Support POST method too (some cron services use POST)
export async function POST(request) {
  return GET(request);
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}