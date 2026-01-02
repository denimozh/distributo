import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

// X OAuth 2.0 PKCE flow - Step 2: Handle callback and exchange code for tokens
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Get base URL dynamically (must match what was used in connect route)
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  // Handle OAuth errors
  if (error) {
    console.error('X OAuth error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings/integrations?error=${error}`, request.url)
    );
  }

  // Get stored state and code verifier from cookies
  const cookies = request.cookies;
  const storedState = cookies.get('x_oauth_state')?.value;
  const codeVerifier = cookies.get('x_code_verifier')?.value;

  // Verify state to prevent CSRF
  if (!state || state !== storedState) {
    console.error('State mismatch');
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?error=state_mismatch', request.url)
    );
  }

  if (!code || !codeVerifier) {
    return NextResponse.redirect(
      new URL('/dashboard/settings/integrations?error=missing_params', request.url)
    );
  }

  try {
    // The redirect URI MUST match exactly what was sent in the authorization request
    const redirectUri = `${baseUrl}/api/auth/callback/x`;
    
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier, redirectUri);
    
    // Get user info from X
    const xUser = await getXUserInfo(tokens.access_token);
    
    // Save to database
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Upsert connected account
    const { error: dbError } = await supabase
      .from('connected_accounts')
      .upsert({
        user_id: user.id,
        platform: 'x',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        platform_user_id: xUser.id,
        platform_username: xUser.username,
        platform_display_name: xUser.name,
        platform_avatar_url: xUser.profile_image_url,
        scopes: tokens.scope.split(' '),
        connected_at: new Date().toISOString(),
        is_active: true,
      }, {
        onConflict: 'user_id,platform',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(
        new URL('/dashboard/settings/integrations?error=db_error', request.url)
      );
    }

    // Clear OAuth cookies and redirect to success
    const response = NextResponse.redirect(
      new URL('/dashboard/settings/integrations?success=x_connected', request.url)
    );
    
    response.cookies.delete('x_code_verifier');
    response.cookies.delete('x_oauth_state');

    return response;

  } catch (err) {
    console.error('X OAuth callback error:', err);
    return NextResponse.redirect(
      new URL(`/dashboard/settings/integrations?error=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}

async function exchangeCodeForTokens(code, codeVerifier, redirectUri) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  // X requires Basic auth with client credentials
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Token exchange error:', errorData);
    throw new Error(errorData.error_description || 'Failed to exchange code for tokens');
  }

  return response.json();
}

async function getXUserInfo(accessToken) {
  const response = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url,name,username', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get X user info');
  }

  const data = await response.json();
  return data.data;
}