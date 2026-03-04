// src/app/api/auth/tiktok/callback/route.js
// TikTok OAuth - Step 2: Handle callback and store tokens

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const TIKTOK_USER_URL = "https://open.tiktokapis.com/v2/user/info/";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("[TikTok OAuth] Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=tiktok_auth_failed`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=no_code`
    );
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(TIKTOK_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("[TikTok OAuth] Token error:", tokenData);
      throw new Error(tokenData.error.message || "Failed to get access token");
    }

    const {
      access_token,
      refresh_token,
      expires_in,
      open_id,
    } = tokenData.data;

    // Get user info from TikTok
    const userResponse = await fetch(
      `${TIKTOK_USER_URL}?fields=open_id,union_id,avatar_url,display_name,username`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userData = await userResponse.json();
    const tiktokUser = userData.data?.user || {};

    // Get current user from Supabase session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get user ID from cookie/session
    // In production, use proper session management
    const cookieStore = cookies();
    const authCookie = cookieStore.get("sb-access-token");
    
    // For now, we'll need to get user from the auth callback
    // This is a simplified version - in production, use proper session
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user) {
      // Try to get user from session another way
      console.error("[TikTok OAuth] No user session found");
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=session_expired`
      );
    }

    // Calculate token expiry
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000);

    // Store connection in database
    const { error: dbError } = await supabase
      .from("platform_connections")
      .upsert({
        user_id: user.id,
        platform: "tiktok",
        access_token: access_token,
        refresh_token: refresh_token,
        token_expires_at: tokenExpiresAt.toISOString(),
        platform_user_id: open_id,
        platform_username: tiktokUser.username || tiktokUser.display_name,
        platform_display_name: tiktokUser.display_name,
        platform_avatar_url: tiktokUser.avatar_url,
        is_active: true,
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,platform",
      });

    if (dbError) {
      console.error("[TikTok OAuth] Database error:", dbError);
      throw new Error("Failed to save connection");
    }

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?success=tiktok_connected`
    );

  } catch (error) {
    console.error("[TikTok OAuth] Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?error=tiktok_auth_failed`
    );
  }
}
