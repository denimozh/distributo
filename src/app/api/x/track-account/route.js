import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Get user
    const supabase = await createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const cleanUsername = username.replace('@', '').trim().toLowerCase();

    // Check if already tracking
    const { data: existing } = await supabaseAdmin
      .from('tracked_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('username', cleanUsername)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already tracking this account' }, { status: 409 });
    }

    // Get X access token to fetch user info
    const { data: xAccount } = await supabaseAdmin
      .from('connected_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'x')
      .eq('is_active', true)
      .single();

    let userInfo = {
      username: cleanUsername,
      display_name: cleanUsername,
      avatar_url: null,
      platform_user_id: null,
      followers_count: null,
    };

    // Try to fetch user info from X API if connected
    if (xAccount?.access_token) {
      try {
        const xResponse = await fetch(
          `https://api.twitter.com/2/users/by/username/${cleanUsername}?user.fields=profile_image_url,public_metrics,name`,
          {
            headers: {
              'Authorization': `Bearer ${xAccount.access_token}`,
            },
          }
        );

        if (xResponse.ok) {
          const xData = await xResponse.json();
          if (xData.data) {
            userInfo = {
              username: xData.data.username,
              display_name: xData.data.name,
              avatar_url: xData.data.profile_image_url?.replace('_normal', '_bigger'),
              platform_user_id: xData.data.id,
              followers_count: xData.data.public_metrics?.followers_count,
            };
          }
        }
      } catch (err) {
        console.error('[TRACK] Failed to fetch X user info:', err);
        // Continue with basic info
      }
    }

    // Save tracked account
    const { data: trackedAccount, error: insertError } = await supabaseAdmin
      .from('tracked_accounts')
      .insert({
        user_id: user.id,
        platform: 'x',
        ...userInfo,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[TRACK] Insert error:', insertError);
      throw insertError;
    }

    console.log('[TRACK] Now tracking:', cleanUsername);

    return NextResponse.json({
      success: true,
      account: trackedAccount,
    });

  } catch (err) {
    console.error('[TRACK] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await supabaseAdmin
      .from('tracked_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}