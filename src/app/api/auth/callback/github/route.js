import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Service role client for database operations
const supabaseAdmin = createClient(
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
    console.error('State mismatch:', { state, storedState });
    return NextResponse.redirect(`${baseUrl}/dashboard/github?error=state_mismatch`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/dashboard/github?error=missing_code`);
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
      console.error('GitHub token error:', tokenData);
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
    console.log('GitHub user:', userData.login);

    // Get current Supabase user using server client
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('No authenticated Supabase user:', userError);
      return NextResponse.redirect(`${baseUrl}/dashboard/settings/integrations?error=not_authenticated`);
    }

    console.log('Supabase user:', user.id);

    // Check if GitHub account already connected
    const { data: existingAccount } = await supabaseAdmin
      .from('connected_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('platform', 'github')
      .single();

    if (existingAccount) {
      // Update existing connection
      const { error: updateError } = await supabaseAdmin
        .from('connected_accounts')
        .update({
          access_token: accessToken,
          platform_user_id: userData.id.toString(),
          platform_username: userData.login,
          platform_display_name: userData.name || userData.login,
          platform_avatar_url: userData.avatar_url,
          is_active: true,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', existingAccount.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabaseAdmin
        .from('connected_accounts')
        .insert({
          user_id: user.id,
          platform: 'github',
          access_token: accessToken,
          platform_user_id: userData.id.toString(),
          platform_username: userData.login,
          platform_display_name: userData.name || userData.login,
          platform_avatar_url: userData.avatar_url,
          is_active: true,
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }
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