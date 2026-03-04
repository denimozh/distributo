// src/app/api/auth/instagram/callback/route.js
// Instagram OAuth - Step 2: Handle callback and store tokens

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v18.0/oauth/access_token";
const FACEBOOK_GRAPH_URL = "https://graph.facebook.com/v18.0";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Check for errors
  if (error) {
    console.error("[Instagram OAuth] Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=instagram_auth_failed&reason=${error}`
    );
  }

  // Verify state
  const cookieStore = cookies();
  const savedState = cookieStore.get("instagram_oauth_state")?.value;

  if (!state || state !== savedState) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=invalid_state`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=no_code`
    );
  }

  try {
    // Step 1: Exchange code for short-lived token
    const tokenResponse = await fetch(
      `${FACEBOOK_TOKEN_URL}?` +
        new URLSearchParams({
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`,
          code,
        })
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    const shortLivedToken = tokenData.access_token;

    // Step 2: Exchange for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `${FACEBOOK_GRAPH_URL}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: process.env.FACEBOOK_APP_ID,
          client_secret: process.env.FACEBOOK_APP_SECRET,
          fb_exchange_token: shortLivedToken,
        })
    );

    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      throw new Error(longLivedData.error.message);
    }

    const accessToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in || 5184000; // ~60 days

    // Step 3: Get Facebook Pages
    const pagesResponse = await fetch(
      `${FACEBOOK_GRAPH_URL}/me/accounts?access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error("No Facebook Pages found. Instagram Business accounts require a linked Facebook Page.");
    }

    // Get the first page (in production, let user choose)
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;

    // Step 4: Get Instagram Business Account
    const igResponse = await fetch(
      `${FACEBOOK_GRAPH_URL}/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`
    );
    const igData = await igResponse.json();

    if (!igData.instagram_business_account) {
      throw new Error("No Instagram Business account linked to this Page. Please connect an Instagram Business account in Facebook settings.");
    }

    const igAccountId = igData.instagram_business_account.id;

    // Step 5: Get Instagram account info
    const igInfoResponse = await fetch(
      `${FACEBOOK_GRAPH_URL}/${igAccountId}?fields=id,username,profile_picture_url,followers_count&access_token=${pageAccessToken}`
    );
    const igInfo = await igInfoResponse.json();

    // Get current user from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user from auth session (you'd typically get this from a cookie/session)
    // For now, we'll use the service role to look up by a passed user_id
    // In production, implement proper session handling
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=session_expired`
      );
    }

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Store connection
    const { error: dbError } = await supabase
      .from("platform_connections")
      .upsert(
        {
          user_id: user.id,
          platform: "instagram",
          access_token: pageAccessToken, // Use page token for posting
          refresh_token: accessToken, // Long-lived user token for refresh
          token_expires_at: tokenExpiresAt.toISOString(),
          platform_user_id: igAccountId,
          platform_username: igInfo.username,
          platform_display_name: igInfo.username,
          platform_avatar_url: igInfo.profile_picture_url,
          metadata: {
            facebook_page_id: page.id,
            facebook_page_name: page.name,
            followers_count: igInfo.followers_count,
          },
          is_active: true,
          last_sync_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform",
        }
      );

    if (dbError) {
      console.error("[Instagram OAuth] Database error:", dbError);
      throw new Error("Failed to save connection");
    }

    // Clear state cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=instagram_connected`
    );
    response.cookies.delete("instagram_oauth_state");

    return response;

  } catch (error) {
    console.error("[Instagram OAuth] Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=instagram_auth_failed&message=${encodeURIComponent(error.message)}`
    );
  }
}
