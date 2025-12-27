import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/posts/x - Create and optionally post a tweet
export async function POST(request) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, scheduledAt, postNow, threadId, threadPosition } = body;

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 280) {
      return NextResponse.json({ error: 'Content exceeds 280 characters' }, { status: 400 });
    }

    // Check API usage limits (500 posts/month for free tier)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage } = await supabase
      .from('api_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('platform', 'x')
      .eq('action', 'post')
      .eq('month_year', currentMonth)
      .single();

    const currentUsage = usage?.count || 0;
    const limit = 500; // Free tier limit

    if (currentUsage >= limit) {
      return NextResponse.json({ 
        error: 'Monthly posting limit reached (500 posts/month)' 
      }, { status: 429 });
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
        error: 'X account not connected' 
      }, { status: 400 });
    }

    // Determine post status
    let status = 'draft';
    if (postNow) {
      status = 'posting';
    } else if (scheduledAt) {
      status = 'scheduled';
    }

    // Create post record
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content.trim(),
        platform: 'x',
        status: status,
        scheduled_at: scheduledAt || null,
        thread_id: threadId || null,
        thread_position: threadPosition || 0,
      })
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // If posting now, send to X
    if (postNow) {
      try {
        const result = await postToX(account, content, threadId);
        
        // Update post with external ID
        await supabase
          .from('posts')
          .update({
            status: 'posted',
            posted_at: new Date().toISOString(),
            external_id: result.id,
            external_url: `https://twitter.com/${account.platform_username}/status/${result.id}`,
          })
          .eq('id', post.id);

        // Increment usage
        await supabase.rpc('increment_api_usage', {
          p_user_id: user.id,
          p_platform: 'x',
          p_action: 'post',
        });

        return NextResponse.json({
          success: true,
          post: { ...post, status: 'posted', external_id: result.id },
          message: 'Tweet posted successfully!',
        });

      } catch (twitterError) {
        // Update post with error
        await supabase
          .from('posts')
          .update({
            status: 'failed',
            error_message: twitterError.message,
          })
          .eq('id', post.id);

        return NextResponse.json({ 
          error: `Failed to post tweet: ${twitterError.message}` 
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      post,
      message: scheduledAt ? 'Tweet scheduled!' : 'Draft saved!',
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to post to X API
async function postToX(account, content, replyToId = null) {
  // Check if token needs refresh
  let accessToken = account.access_token;
  
  if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
    accessToken = await refreshXToken(account);
  }

  const payload = {
    text: content,
  };

  // If replying to a tweet (for threads)
  if (replyToId) {
    payload.reply = {
      in_reply_to_tweet_id: replyToId,
    };
  }

  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || errorData.title || 'Failed to post tweet');
  }

  const data = await response.json();
  return data.data;
}

// Refresh X OAuth token
async function refreshXToken(account) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;
  
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
    throw new Error('Failed to refresh token');
  }

  const tokens = await response.json();

  // Update tokens in database
  const supabase = await createClient();
  await supabase
    .from('connected_accounts')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', account.id);

  return tokens.access_token;
}

// GET /api/posts/x - Get user's X posts
export async function GET(request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('platform', 'x')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: posts, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }

  return NextResponse.json({
    posts,
    total: count,
    limit,
    offset,
  });
}