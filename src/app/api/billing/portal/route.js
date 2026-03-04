// src/app/api/billing/portal/route.js
// Redirect to Stripe Customer Portal

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createPortalSession } from "@/lib/billing/stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login`
      );
    }

    // Get customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?error=no_subscription`
      );
    }

    // Create portal session
    const { url } = await createPortalSession(profile.stripe_customer_id);

    return NextResponse.redirect(url);

  } catch (error) {
    console.error("[Portal] Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?error=portal_failed`
    );
  }
}

export async function POST(request) {
  try {
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    // Create portal session
    const { url } = await createPortalSession(profile.stripe_customer_id);

    return NextResponse.json({ url });

  } catch (error) {
    console.error("[Portal] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
