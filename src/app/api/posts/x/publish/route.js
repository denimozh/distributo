import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/posts/x/publish - Actually post a tweet to X
export async function POST(request) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, postId } = body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 280) {
      return NextResponse.json({ error: 'Content exceeds 280 characters' }, { status: 400 });
    }

    // Get connected X account
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'x')
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ 
        error: 'X account not connected. Please connect your account first.' 
      }, { status: 400 });
    }

    // Check if token needs refresh
    let accessToken = account.access_token;
    
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      try {
        accessToken = await refreshXToken(account, supabase);
      } catch (refreshError) {
        return NextResponse.json({ 
          error: 'Session expired. Please reconnect your X account.' 
        }, { status: 401 });
      }
    }

    // Post to X API
    const tweetResponse = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: content.trim() }),
    });

    const tweetData = await tweetResponse.json();

    if (!tweetResponse.ok) {
      console.error('X API error:', tweetData);
      return NextResponse.json({ 
        error: tweetData.detail || tweetData.title || 'Failed to post to X' 
      }, { status: tweetResponse.status });
    }

    const tweetId = tweetData.data.id;
    const tweetUrl = `https://x.com/${account.platform_username}/status/${tweetId}`;

    // Save to database (or update if postId provided)
    if (postId) {
      // Update existing post
      await supabase
        .from('posts')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
          external_id: tweetId,
          external_url: tweetUrl,
        })
        .eq('id', postId);
    } else {
      // Create new post record
      await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          platform: 'x',
          status: 'posted',
          posted_at: new Date().toISOString(),
          external_id: tweetId,
          external_url: tweetUrl,
        });
    }

    // Update last_used_at on connected account
    await supabase
      .from('connected_accounts')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', account.id);

    return NextResponse.json({
      success: true,
      message: 'Posted to X!',
      tweetId: tweetId,
      url: tweetUrl,
    });

  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to post to X' 
    }, { status: 500 });
  }
}

// Refresh X OAuth token
async function refreshXToken(account, supabase) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  
  if (!account.refresh_token) {
    throw new Error('No refresh token available');
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
    const errorData = await response.json();
    console.error('Token refresh failed:', errorData);
    throw new Error('Failed to refresh token');
  }

  const tokens = await response.json();

  // Update tokens in database
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