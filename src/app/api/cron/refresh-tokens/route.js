// src/app/api/cron/refresh-tokens/route.js
// Proactively refresh tokens that are expiring soon
// This prevents the "token expired" error from ever happening

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (process.env.NODE_ENV === 'production' && cronSecret) {
    const providedSecret = authHeader?.replace('Bearer ', '').trim();
    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  console.log('[TOKEN-REFRESH] Starting proactive token refresh...');

  try {
    // Find tokens expiring in the next 30 minutes
    const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('platform', 'x')
      .eq('is_active', true)
      .lt('token_expires_at', thirtyMinutesFromNow)
      .not('refresh_token', 'is', null);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!accounts || accounts.length === 0) {
      console.log('[TOKEN-REFRESH] No tokens need refreshing');
      return NextResponse.json({
        success: true,
        message: 'No tokens need refreshing',
        refreshed: 0,
      });
    }

    console.log(`[TOKEN-REFRESH] Found ${accounts.length} token(s) to refresh`);

    let refreshed = 0;
    let failed = 0;
    const results = [];

    for (const account of accounts) {
      try {
        await refreshXAccessToken(account);
        refreshed++;
        results.push({ id: account.id, username: account.platform_username, status: 'refreshed' });
      } catch (err) {
        console.error(`[TOKEN-REFRESH] Failed for @${account.platform_username}:`, err.message);
        failed++;
        results.push({ id: account.id, username: account.platform_username, status: 'failed', error: err.message });
      }
    }

    console.log(`[TOKEN-REFRESH] Complete. Refreshed: ${refreshed}, Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      refreshed,
      failed,
      results,
    });

  } catch (error) {
    console.error('[TOKEN-REFRESH] Fatal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function refreshXAccessToken(account) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;

  console.log(`[TOKEN-REFRESH] Refreshing token for @${account.platform_username}`);

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
    }).toString(),
  });

  const tokenData = await response.json();

  if (!response.ok) {
    if (tokenData.error === 'invalid_grant') {
      await supabase
        .from('connected_accounts')
        .update({
          is_active: false,
          error_message: 'Session expired - please reconnect',
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);
    }
    throw new Error(tokenData.error_description || tokenData.error);
  }

  // Save new tokens
  await supabase
    .from('connected_accounts')
    .update({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || account.refresh_token,
      token_expires_at: new Date(Date.now() + (tokenData.expires_in || 7200) * 1000).toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  console.log(`[TOKEN-REFRESH] Success for @${account.platform_username}`);
}

export async function POST(request) {
  return GET(request);
}