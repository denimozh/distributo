import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// LinkedIn OAuth 2.0 - Step 1: Redirect to LinkedIn authorization
export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  
  if (!clientId) {
    console.error('LINKEDIN_CLIENT_ID not configured');
    return NextResponse.redirect('/dashboard/linkedin?error=not_configured');
  }

  // Get the host dynamically for localhost vs production
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  
  const redirectUri = `${baseUrl}/api/auth/callback/linkedin`;
  
  // LinkedIn OAuth scopes needed for posting
  // https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
  const scopes = [
    'openid',           // OpenID Connect
    'profile',          // Basic profile info
    'email',            // Email address
    'w_member_social',  // Post on behalf of user
  ].join(' ');

  const state = crypto.randomUUID();
  
  // LinkedIn OAuth URL
  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('state', state);

  console.log('[LINKEDIN] Starting OAuth flow, redirect URI:', redirectUri);

  const response = NextResponse.redirect(authUrl.toString());
  
  // Set state cookie for verification
  response.cookies.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}