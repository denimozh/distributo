import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role key (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// This endpoint is called by Vercel Cron every 5 minutes
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/post-scheduled", "schedule": "*/5 * * * *" }] }

export async function GET(request) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In development, allow without secret
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const now = new Date().toISOString();
    
    // Get all scheduled posts that are due
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from('posts')
      .select(`
        *,
        connected_accounts!inner (
          id,
          platform,
          access_token,
          refresh_token,
          token_expires_at,
          platform_username,
          user_id
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', now)
      .eq('platform', 'x')
      .limit(10); // Process max 10 at a time

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return NextResponse.json({ message: 'No posts to process', processed: 0 });
    }

    console.log(`Processing ${scheduledPosts.length} scheduled posts...`);

    const results = [];

    for (const post of scheduledPosts) {
      try {
        // Mark as posting
        await supabase
          .from('posts')
          .update({ status: 'posting' })
          .eq('id', post.id);

        // Get fresh token if expired
        let accessToken = post.connected_accounts.access_token;
        
        if (post.connected_accounts.token_expires_at && 
            new Date(post.connected_accounts.token_expires_at) < new Date()) {
          accessToken = await refreshToken(post.connected_accounts);
        }

        // Post to X
        const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: post.content }),
        });

        const tweetData = await tweetResponse.json();

        if (!tweetResponse.ok) {
          throw new Error(tweetData.detail || tweetData.title || 'X API error');
        }

        const tweetId = tweetData.data.id;
        const tweetUrl = `https://x.com/${post.connected_accounts.platform_username}/status/${tweetId}`;

        // Update post as posted
        await supabase
          .from('posts')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            external_id: tweetId,
            external_url: tweetUrl,
          })
          .eq('id', post.id);

        results.push({ id: post.id, status: 'success', tweetId });
        console.log(`✅ Posted: ${post.id} -> ${tweetUrl}`);

      } catch (postError) {
        console.error(`❌ Failed to post ${post.id}:`, postError);
        
        // Update post as failed
        await supabase
          .from('posts')
          .update({
            status: 'failed',
            error_message: postError.message,
            retry_count: (post.retry_count || 0) + 1,
          })
          .eq('id', post.id);

        results.push({ id: post.id, status: 'failed', error: postError.message });
      }
    }

    return NextResponse.json({
      message: 'Cron job completed',
      processed: results.length,
      results,
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Refresh X token
async function refreshToken(account) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  
  if (!account.refresh_token) {
    throw new Error('No refresh token');
  }

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
    }),
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  const tokens = await response.json();

  // Update tokens
  await supabase
    .from('connected_accounts')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || account.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', account.id);

  return tokens.access_token;
}