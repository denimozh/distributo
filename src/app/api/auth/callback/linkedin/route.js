import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

// Service role client for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// LinkedIn OAuth 2.0 - Step 2: Handle callback and exchange code for tokens
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Get base URL dynamically
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  // Handle OAuth errors
  if (error) {
    console.error('[LINKEDIN] OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/linkedin?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Get stored state from cookies
  const cookies = request.cookies;
  const storedState = cookies.get('linkedin_oauth_state')?.value;

  // Verify state to prevent CSRF
  if (!state || state !== storedState) {
    console.error('[LINKEDIN] State mismatch:', { state, storedState });
    return NextResponse.redirect(
      `${baseUrl}/dashboard/linkedin?error=state_mismatch`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/linkedin?error=missing_code`
    );
  }

  try {
    const redirectUri = `${baseUrl}/api/auth/callback/linkedin`;
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    console.log('[LINKEDIN] Got tokens, expires in:', tokens.expires_in);
    
    // Get user info from LinkedIn
    const linkedinUser = await getLinkedInUserInfo(tokens.access_token);
    console.log('[LINKEDIN] User:', linkedinUser.name);
    
    // Get current Supabase user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('[LINKEDIN] No authenticated user:', userError);
      return NextResponse.redirect(
        `${baseUrl}/dashboard/linkedin?error=not_authenticated`
      );
    }

    // Check if LinkedIn account already connected
    const { data: existingAccount } = await supabaseAdmin
      .from('connected_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'linkedin')
      .single();

    const accountData = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      token_expires_at: tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      platform_user_id: linkedinUser.sub,
      platform_username: linkedinUser.email || linkedinUser.name,
      platform_display_name: linkedinUser.name,
      platform_avatar_url: linkedinUser.picture,
      scopes: tokens.scope?.split(' ') || ['openid', 'profile', 'w_member_social'],
      is_active: true,
      last_used_at: new Date().toISOString(),
    };

    if (existingAccount) {
      // Update existing connection
      const { error: updateError } = await supabaseAdmin
        .from('connected_accounts')
        .update(accountData)
        .eq('id', existingAccount.id);

      if (updateError) {
        console.error('[LINKEDIN] Update error:', updateError);
        throw updateError;
      }
      console.log('[LINKEDIN] Updated existing connection');
    } else {
      // Create new connection
      const { error: insertError } = await supabaseAdmin
        .from('connected_accounts')
        .insert({
          user_id: user.id,
          platform: 'linkedin',
          connected_at: new Date().toISOString(),
          ...accountData,
        });

      if (insertError) {
        console.error('[LINKEDIN] Insert error:', insertError);
        throw insertError;
      }
      console.log('[LINKEDIN] Created new connection');
    }

    // Clear state cookie and redirect to success
    const response = NextResponse.redirect(
      `${baseUrl}/dashboard/linkedin?success=connected`
    );
    response.cookies.delete('linkedin_oauth_state');

    return response;

  } catch (err) {
    console.error('[LINKEDIN] OAuth callback error:', err);
    return NextResponse.redirect(
      `${baseUrl}/dashboard/linkedin?error=${encodeURIComponent(err.message)}`
    );
  }
}

async function exchangeCodeForTokens(code, redirectUri) {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
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
    console.error('[LINKEDIN] Token exchange error:', errorData);
    throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
  }

  return response.json();
}

async function getLinkedInUserInfo(accessToken) {
  // Use the OpenID Connect userinfo endpoint
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('[LINKEDIN] User info error:', errorData);
    throw new Error('Failed to get LinkedIn user info');
  }

  return response.json();
}