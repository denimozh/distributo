// src/app/api/billing/checkout/route.js
// Create Stripe Checkout Session

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createCheckoutSession, createCreditsCheckout, getOrCreateCustomer, PLANS, CREDIT_PACKS } from "@/lib/billing/stripe";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const body = await request.json();
    const { planId, packId, type = "subscription" } = body;

    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, plan")
      .eq("id", user.id)
      .single();

    // Get or create Stripe customer
    const customerId = profile?.stripe_customer_id || 
      await getOrCreateCustomer(user.id, user.email);

    let session;

    if (type === "credits" && packId) {
      // Credit pack purchase
      const pack = CREDIT_PACKS[packId];
      if (!pack) {
        return NextResponse.json(
          { error: "Invalid credit pack" },
          { status: 400 }
        );
      }

      session = await createCreditsCheckout({
        userId: user.id,
        email: user.email,
        packId,
        customerId,
      });

    } else if (planId) {
      // Subscription checkout
      const plan = PLANS[planId];
      if (!plan) {
        return NextResponse.json(
          { error: "Invalid plan" },
          { status: 400 }
        );
      }

      // Check if already on this plan
      if (profile?.plan === planId) {
        return NextResponse.json(
          { error: "Already on this plan" },
          { status: 400 }
        );
      }

      session = await createCheckoutSession({
        userId: user.id,
        email: user.email,
        planId,
      });

    } else {
      return NextResponse.json(
        { error: "planId or packId required" },
        { status: 400 }
      );
    }

    return NextResponse.json(session);

  } catch (error) {
    console.error("[Checkout] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET: Preview pricing
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const planId = searchParams.get("plan");

  if (planId && PLANS[planId]) {
    return NextResponse.json(PLANS[planId]);
  }

  return NextResponse.json({
    plans: PLANS,
    creditPacks: CREDIT_PACKS,
  });
}
