import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Use NEXT_PUBLIC_APP_URL for consistent redirects
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://distributo.dev';

  // Check for errors
  if (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(`${baseUrl}/dashboard/github?error=${encodeURIComponent(error)}`);
  }

  // Verify state
  const cookieStore = await cookies();
  const storedState = cookieStore.get('github_oauth_state')?.value;

  if (!state || state !== storedState) {
    console.error('State mismatch');
    return NextResponse.redirect(`${baseUrl}/dashboard/github?error=state_mismatch`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // Get user info from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const userData = await userResponse.json();

    // Get Supabase session from cookies
    const supabaseAccessToken = cookieStore.get('sb-access-token')?.value;
    let userId = null;

    if (supabaseAccessToken) {
      const { data: { user } } = await supabase.auth.getUser(supabaseAccessToken);
      userId = user?.id;
    }

    // Try alternative cookie names if not found
    if (!userId) {
      const sessionCookie = cookieStore.get('sb-session')?.value;
      if (sessionCookie) {
        try {
          const session = JSON.parse(sessionCookie);
          userId = session?.user?.id;
        } catch (e) {}
      }
    }

    // Check all Supabase auth cookies
    if (!userId) {
      const allCookies = cookieStore.getAll();
      for (const cookie of allCookies) {
        if (cookie.name.includes('supabase') && cookie.name.includes('auth')) {
          try {
            const parsed = JSON.parse(cookie.value);
            if (parsed?.user?.id) {
              userId = parsed.user.id;
              break;
            }
          } catch (e) {}
        }
      }
    }

    if (!userId) {
      console.error('No authenticated user found');
      return NextResponse.redirect(`${baseUrl}/login?error=not_authenticated&redirect=/dashboard/github`);
    }

    // Check if GitHub account already connected
    const { data: existingAccount } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', 'github')
      .single();

    if (existingAccount) {
      // Update existing connection
      await supabase
        .from('connected_accounts')
        .update({
          access_token: accessToken,
          platform_user_id: userData.id.toString(),
          platform_username: userData.login,
          platform_display_name: userData.name,
          platform_avatar_url: userData.avatar_url,
          is_active: true,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id);
    } else {
      // Create new connection
      await supabase
        .from('connected_accounts')
        .insert({
          user_id: userId,
          platform: 'github',
          access_token: accessToken,
          platform_user_id: userData.id.toString(),
          platform_username: userData.login,
          platform_display_name: userData.name,
          platform_avatar_url: userData.avatar_url,
          is_active: true,
        });
    }

    // Clear state cookie and redirect
    const response = NextResponse.redirect(`${baseUrl}/dashboard/github?success=connected`);
    response.cookies.delete('github_oauth_state');

    return response;

  } catch (err) {
    console.error('GitHub OAuth callback error:', err);
    return NextResponse.redirect(`${baseUrl}/dashboard/github?error=${encodeURIComponent(err.message)}`);
  }
}