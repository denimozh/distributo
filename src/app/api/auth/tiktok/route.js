// src/app/api/auth/tiktok/route.js
// TikTok OAuth - Step 1: Redirect to TikTok authorization

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TIKTOK_AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  // Get user from session
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Build TikTok OAuth URL
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,
    scope: "user.info.basic,video.upload,video.publish",
    response_type: "code",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/tiktok/callback`,
    state: generateState(), // CSRF protection
  });

  const authUrl = `${TIKTOK_AUTH_URL}?${params.toString()}`;

  return NextResponse.redirect(authUrl);
}

function generateState() {
  return Math.random().toString(36).substring(2, 15);
}
