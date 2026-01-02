import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  // Get the host dynamically for localhost vs production
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  
  const redirectUri = `${baseUrl}/api/auth/callback/github`;
  
  // GitHub OAuth scopes needed
  const scopes = [
    'read:user',      // Read user profile
    'repo',           // Access repos (needed for webhooks)
    'admin:repo_hook' // Create webhooks
  ].join(' ');

  const state = crypto.randomUUID();
  
  // Store state in cookie for verification
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());
  
  // Set state cookie
  response.cookies.set('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}