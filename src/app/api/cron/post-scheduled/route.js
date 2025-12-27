import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    console.log(`[CRON] Running at ${now}`);

    // Get posts that are due to be posted
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select(`
        *,
        connected_accounts!inner(
          access_token,
          refresh_token,
          token_expires_at,
          platform_user_id,
          platform_username
        )
      `)
      .eq('status', 'scheduled')
      .eq('platform', 'x')
      .lte('scheduled_at', now)
      .limit(10);

    if (fetchError) {
      console.error('[CRON] Fetch error:', fetchError);
      throw fetchError;
    }

    if (!posts || posts.length === 0) {
      console.log('[CRON] No posts due');
      return NextResponse.json({ message: 'No posts due', processed: 0 });
    }

    console.log(`[CRON] Found ${posts.length} posts to process`);

    let processed = 0;
    let failed = 0;

    for (const post of posts) {
      try {
        const account = post.connected_accounts;
        
        // Check if token needs refresh
        let accessToken = account.access_token;
        const tokenExpiry = new Date(account.token_expires_at);
        
        if (tokenExpiry <= new Date()) {
          console.log(`[CRON] Refreshing token for post ${post.id}`);
          
          // Refresh the token
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
            throw new Error('Failed to refresh token');
          }

          const tokenData = await tokenResponse.json();
          accessToken = tokenData.access_token;

          // Update tokens in database
          await supabase
            .from('connected_accounts')
            .update({
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            })
            .eq('id', account.id);
        }

        // Post to X
        console.log(`[CRON] Posting tweet for post ${post.id}`);
        
        const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: post.content })
        });

        if (!tweetResponse.ok) {
          const errorData = await tweetResponse.json();
          throw new Error(errorData.detail || errorData.title || 'Failed to post tweet');
        }

        const tweetData = await tweetResponse.json();
        console.log(`[CRON] Tweet posted successfully: ${tweetData.data.id}`);

        // Update post status
        const updateData = {
          status: 'posted',
          posted_at: new Date().toISOString(),
          external_id: tweetData.data.id,
          external_url: `https://x.com/${account.platform_username}/status/${tweetData.data.id}`,
        };

        await supabase
          .from('posts')
          .update(updateData)
          .eq('id', post.id);

        // If post had a community, log reminder (could send notification in future)
        if (post.community_id) {
          console.log(`[CRON] Reminder: Share post ${tweetData.data.id} to community ${post.community_id}`);
          // TODO: Send push notification or email reminder to share to community
        }

        processed++;

      } catch (postError) {
        console.error(`[CRON] Error posting ${post.id}:`, postError);
        
        // Mark as failed
        await supabase
          .from('posts')
          .update({
            status: 'failed',
            error_message: postError.message,
            retry_count: (post.retry_count || 0) + 1,
          })
          .eq('id', post.id);

        failed++;
      }
    }

    console.log(`[CRON] Completed. Processed: ${processed}, Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      processed,
      failed,
      timestamp: now
    });

  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Also allow POST for manual testing
export async function POST(request) {
  return GET(request);
}