import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const startTime = Date.now();

  // Authorization — fail closed
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[REFRESH] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }
  const providedSecret = authHeader?.replace('Bearer ', '').trim();
  if (providedSecret !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[REFRESH] ====== Starting token refresh check ======');

    // Get all active X accounts where token expires in next 30 minutes
    // This is PROACTIVE - we refresh BEFORE they expire
    const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    
    const { data: accounts, error: fetchError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('platform', 'x')
      .eq('is_active', true)
      .lt('token_expires_at', thirtyMinutesFromNow);

    if (fetchError) {
      throw new Error(`Database error: ${fetchError.message}`);
    }

    if (!accounts || accounts.length === 0) {
      console.log('[REFRESH] No tokens need refreshing');
      return NextResponse.json({
        success: true,
        refreshed: 0,
        failed: 0,
        message: 'No tokens need refreshing',
        duration_ms: Date.now() - startTime
      });
    }

    console.log(`[REFRESH] Found ${accounts.length} token(s) to refresh`);

    let refreshed = 0;
    let failed = 0;
    const results = [];

    for (const account of accounts) {
      const result = { 
        id: account.id, 
        username: account.platform_username,
        status: 'pending' 
      };

      try {
        console.log(`[REFRESH] Refreshing token for @${account.platform_username}`);
        
        const newTokens = await refreshXToken(account);
        
        // Update the database with new tokens
        const { error: updateError } = await supabase
          .from('connected_accounts')
          .update({
            access_token: newTokens.access_token,
            refresh_token: newTokens.refresh_token, // CRITICAL: Always save the new refresh token!
            token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
            last_used_at: new Date().toISOString(),
          })
          .eq('id', account.id);

        if (updateError) {
          throw new Error(`Failed to save tokens: ${updateError.message}`);
        }

        console.log(`[REFRESH] ✅ Successfully refreshed token for @${account.platform_username}`);
        refreshed++;
        result.status = 'refreshed';
        result.expires_at = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

      } catch (error) {
        console.error(`[REFRESH] ❌ Failed to refresh @${account.platform_username}:`, error.message);
        failed++;
        result.status = 'failed';
        result.error = error.message;

        // If refresh failed due to invalid token, mark account as needing reconnection
        if (error.message.includes('invalid') || error.message.includes('expired') || error.message.includes('revoked')) {
          await supabase
            .from('connected_accounts')
            .update({
              is_active: false,
              // Store error so user can see why they need to reconnect
            })
            .eq('id', account.id);
          
          result.needs_reconnect = true;
          console.log(`[REFRESH] ⚠️ Marked @${account.platform_username} as needing reconnection`);
        }
      }

      results.push(result);
    }

    const duration = Date.now() - startTime;
    console.log(`[REFRESH] ====== Completed in ${duration}ms. Refreshed: ${refreshed}, Failed: ${failed} ======`);

    return NextResponse.json({
      success: true,
      refreshed,
      failed,
      results,
      duration_ms: duration
    });

  } catch (error) {
    console.error('[REFRESH] Fatal error:', error);
    return NextResponse.json(
      { success: false, error: error.message, duration_ms: Date.now() - startTime },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility
export async function POST(request) {
  return GET(request);
}

/**
 * Refresh X OAuth 2.0 access token
 * 
 * IMPORTANT: X refresh tokens are SINGLE-USE!
 * When you use a refresh token, X returns a NEW refresh token.
 * The old refresh token is immediately invalidated.
 * You MUST save the new refresh token or the user will need to reconnect.
 */
async function refreshXToken(account) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;

  if (!account.refresh_token) {
    throw new Error('No refresh token available - user must reconnect');
  }

  if (!clientId || !clientSecret) {
    throw new Error('X_CLIENT_ID or X_CLIENT_SECRET not configured');
  }

  // X requires Basic auth with client credentials
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

  const responseText = await response.text();
  
  let tokenData;
  try {
    tokenData = JSON.parse(responseText);
  } catch {
    console.error('[REFRESH] Invalid JSON response:', responseText);
    throw new Error('Invalid response from X token endpoint');
  }

  if (!response.ok) {
    console.error('[REFRESH] Token refresh failed:', tokenData);
    
    // Provide specific error messages
    if (tokenData.error === 'invalid_grant') {
      throw new Error('Refresh token is invalid or expired - user must reconnect');
    }
    if (tokenData.error === 'invalid_request') {
      throw new Error('Invalid refresh request - check credentials');
    }
    
    throw new Error(tokenData.error_description || tokenData.error || 'Token refresh failed');
  }

  // Validate we got the required tokens back
  if (!tokenData.access_token || !tokenData.refresh_token) {
    throw new Error('X did not return required tokens');
  }

  return {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token, // This is a NEW token - must be saved!
    expires_in: tokenData.expires_in || 7200, // Default 2 hours
  };
}