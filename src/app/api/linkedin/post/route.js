import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST - Publish content to LinkedIn
export async function POST(request) {
  try {
    const { content, postId } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get current user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get LinkedIn connected account
    const { data: account, error: accountError } = await supabaseAdmin
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'linkedin')
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: 'LinkedIn not connected' }, { status: 400 });
    }

    // Check if token is expired
    if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
      // Try to refresh the token
      if (account.refresh_token) {
        try {
          const newTokens = await refreshAccessToken(account.refresh_token);
          
          // Update tokens in database
          await supabaseAdmin
            .from('connected_accounts')
            .update({
              access_token: newTokens.access_token,
              refresh_token: newTokens.refresh_token || account.refresh_token,
              token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
              last_used_at: new Date().toISOString(),
            })
            .eq('id', account.id);

          account.access_token = newTokens.access_token;
        } catch (refreshError) {
          console.error('[LINKEDIN] Token refresh failed:', refreshError);
          return NextResponse.json({ 
            error: 'LinkedIn token expired. Please reconnect your account.',
            needsReconnect: true 
          }, { status: 401 });
        }
      } else {
        return NextResponse.json({ 
          error: 'LinkedIn token expired. Please reconnect your account.',
          needsReconnect: true 
        }, { status: 401 });
      }
    }

    // Post to LinkedIn using the Share API
    const linkedinResponse = await postToLinkedIn(
      account.access_token,
      account.platform_user_id,
      content
    );

    // Update post status if postId provided
    if (postId) {
      await supabaseAdmin
        .from('posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_id: linkedinResponse.id,
        })
        .eq('id', postId);
    }

    // Update last used timestamp
    await supabaseAdmin
      .from('connected_accounts')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', account.id);

    return NextResponse.json({
      success: true,
      linkedinPostId: linkedinResponse.id,
      message: 'Posted to LinkedIn successfully!',
    });

  } catch (err) {
    console.error('[LINKEDIN] Post error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function postToLinkedIn(accessToken, personUrn, content) {
  // LinkedIn API v2 - Create a share (post)
  // https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
  
  const postBody = {
    author: `urn:li:person:${personUrn}`,
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

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[LINKEDIN] Post API error:', response.status, errorData);
    
    if (response.status === 401) {
      throw new Error('LinkedIn authentication expired. Please reconnect.');
    }
    if (response.status === 403) {
      throw new Error('LinkedIn posting permission denied. Please check your app permissions.');
    }
    
    throw new Error(errorData.message || `LinkedIn API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
  });

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error_description || 'Failed to refresh token');
  }

  return response.json();
}

// GET - Check LinkedIn connection status
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: account } = await supabaseAdmin
      .from('connected_accounts')
      .select('platform_username, platform_display_name, platform_avatar_url, token_expires_at, is_active')
      .eq('user_id', user.id)
      .eq('platform', 'linkedin')
      .eq('is_active', true)
      .single();

    if (!account) {
      return NextResponse.json({ connected: false });
    }

    const isExpired = account.token_expires_at && new Date(account.token_expires_at) < new Date();

    return NextResponse.json({
      connected: true,
      needsReconnect: isExpired,
      user: {
        username: account.platform_username,
        displayName: account.platform_display_name,
        avatarUrl: account.platform_avatar_url,
      },
    });

  } catch (err) {
    console.error('[LINKEDIN] Status check error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}