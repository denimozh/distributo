// src/app/api/auth/instagram/route.js
// Instagram OAuth - Step 1: Redirect to Facebook/Instagram authorization
// Note: Instagram API requires Facebook Business account

import { NextResponse } from "next/server";

const FACEBOOK_AUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth";

export async function GET(request) {
  // Instagram uses Facebook OAuth
  // Required scopes for Instagram Reels posting
  const scopes = [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");

  // Generate state for CSRF protection
  const state = generateState();

  // Store state in cookie for verification
  const response = NextResponse.redirect(
    `${FACEBOOK_AUTH_URL}?` +
      new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`,
        scope: scopes,
        response_type: "code",
        state: state,
      }).toString()
  );

  // Set state cookie
  response.cookies.set("instagram_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}

function generateState() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}
