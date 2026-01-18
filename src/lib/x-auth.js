// src/lib/x-auth.js
// Centralized X OAuth token management

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Refresh X OAuth 2.0 access token
 * 
 * IMPORTANT: X refresh tokens are single-use!
 * When you use a refresh token, X returns a NEW refresh token.
 * You MUST save the new refresh token or the user will need to reconnect.
 */
export async function refreshXAccessToken(account) {
  const clientId = process.env.X_CLIENT_ID;
  const clientSecret = process.env.X_CLIENT_SECRET;

  if (!account.refresh_token) {
    throw new Error('No refresh token available - user must reconnect');
  }

  if (!clientId || !clientSecret) {
    throw new Error('X_CLIENT_ID or X_CLIENT_SECRET not configured');
  }

  console.log(`[X-AUTH] Refreshing token for account ${account.id} (@${account.platform_username})`);

  // X requires Basic auth with client credentials for confidential clients
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
      // Note: client_id is NOT needed when using Basic auth
    }).toString(),
  });

  const responseText = await response.text();
  
  let tokenData;
  try {
    tokenData = JSON.parse(responseText);
  } catch {
    console.error('[X-AUTH] Invalid JSON response:', responseText);
    throw new Error('Invalid response from X token endpoint');
  }

  if (!response.ok) {
    console.error('[X-AUTH] Token refresh failed:', tokenData);
    
    // Handle specific error cases
    if (tokenData.error === 'invalid_grant') {
      // This means the refresh token is invalid/expired
      // Mark account as needing reconnection
      await supabaseAdmin
        .from('connected_accounts')
        .update({
          is_active: false,
          error_message: 'Refresh token expired - please reconnect',
          updated_at: new Date().toISOString(),
        })
        .eq('id', account.id);
      
      throw new Error('Refresh token expired - user must reconnect their X account');
    }
    
    throw new Error(tokenData.error_description || tokenData.error || 'Token refresh failed');
  }

  // CRITICAL: Save the NEW refresh token!
  // X refresh tokens are single-use - the old one is now invalid
  const newAccessToken = tokenData.access_token;
  const newRefreshToken = tokenData.refresh_token; // This is a NEW token!
  const expiresIn = tokenData.expires_in || 7200; // Default 2 hours

  const { error: updateError } = await supabaseAdmin
    .from('connected_accounts')
    .update({
      access_token: newAccessToken,
      refresh_token: newRefreshToken, // MUST save the new refresh token
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  if (updateError) {
    console.error('[X-AUTH] Failed to save new tokens:', updateError);
    // Still return the access token so the current request can proceed
    // but log the error as this will cause issues on next refresh
  }

  console.log(`[X-AUTH] Token refreshed successfully for @${account.platform_username}`);
  
  return newAccessToken;
}

/**
 * Get a valid access token for an account
 * Automatically refreshes if expired or expiring soon
 */
export async function getValidAccessToken(account) {
  const now = new Date();
  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
  
  // Refresh if:
  // 1. No expiry time set
  // 2. Token is expired
  // 3. Token expires in less than 5 minutes (proactive refresh)
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  const needsRefresh = !expiresAt || expiresAt <= fiveMinutesFromNow;
  
  if (needsRefresh) {
    console.log(`[X-AUTH] Token needs refresh (expires: ${expiresAt?.toISOString() || 'unknown'})`);
    return await refreshXAccessToken(account);
  }
  
  return account.access_token;
}

/**
 * Check if an account's token is valid by making a test API call
 */
export async function verifyToken(accessToken) {
  try {
    const response = await fetch('https://api.twitter.com/2/users/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    
    return response.ok;
  } catch {
    return false;
  }
}