import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for errors
  if (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/github?error=${encodeURIComponent(error)}`
    );
  }

  // Verify state
  const cookieStore = cookies();
  const storedState = cookieStore.get('github_oauth_state')?.value;

  if (!state || state !== storedState) {
    console.error('State mismatch');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/github?error=state_mismatch`
    );
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

    // Get current Supabase user from session
    const supabaseAuthCookie = cookieStore.get('sb-access-token')?.value || 
                               cookieStore.get('supabase-auth-token')?.value;
    
    // We need to get the user ID from the session
    // For now, we'll get it from the request headers or a separate cookie
    const authHeader = request.headers.get('authorization');
    
    // Get user from Supabase session
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      cookieStore.get('sb-access-token')?.value
    );

    if (!user) {
      // Try to get user from session cookie
      const sessionCookie = cookieStore.get('sb-session')?.value;
      if (sessionCookie) {
        const session = JSON.parse(sessionCookie);
        if (session?.user?.id) {
          // Use session user
        }
      }
      
      // Redirect to login if no user
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=not_authenticated`
      );
    }

    // Check if GitHub account already connected
    const { data: existingAccount } = await supabase
      .from('connected_accounts')
      .select('id')
      .eq('user_id', user.id)
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id);
    } else {
      // Create new connection
      await supabase
        .from('connected_accounts')
        .insert({
          user_id: user.id,
          platform: 'github',
          access_token: accessToken,
          platform_user_id: userData.id.toString(),
          platform_username: userData.login,
          platform_display_name: userData.name,
          platform_avatar_url: userData.avatar_url,
          is_active: true,
        });
    }

    // Clear state cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/github?success=connected`
    );
    
    response.cookies.delete('github_oauth_state');

    return response;

  } catch (err) {
    console.error('GitHub OAuth callback error:', err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/github?error=${encodeURIComponent(err.message)}`
    );
  }
}