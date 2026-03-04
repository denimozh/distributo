// src/lib/billing/stripe.js
// Stripe Integration for Subscriptions and Credits

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ===========================================
// PLAN DEFINITIONS
// ===========================================

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    price: 49,
    credits: 25, // 20 test (5s) + 5 full (30s)
    testVideos: 20,
    fullVideos: 5,
    features: [
      "20 test videos (5s)",
      "5 full videos (30s)",
      "TikTok + Instagram posting",
      "5 AI avatars",
      "Auto-captions",
      "Basic analytics",
    ],
    limits: {
      avatars: 5,
      campaigns: 10,
      platforms: ["tiktok", "instagram"],
    },
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceId: process.env.STRIPE_GROWTH_PRICE_ID,
    price: 99,
    credits: 70, // 50 test + 10 full (at 2x value)
    testVideos: 50,
    fullVideos: 10,
    popular: true,
    features: [
      "50 test videos (5s)",
      "10 full videos (30s)",
      "Everything in Starter",
      "10 AI avatars",
      "Performance insights",
      "Weekly intelligence reports",
      "Platform-optimized variants",
      "Priority support",
    ],
    limits: {
      avatars: 10,
      campaigns: 50,
      platforms: ["tiktok", "instagram"],
    },
  },
  scale: {
    id: "scale",
    name: "Scale",
    priceId: process.env.STRIPE_SCALE_PRICE_ID,
    price: 249,
    credits: 175, // 100 test + 25 full
    testVideos: 100,
    fullVideos: 25,
    features: [
      "100 test videos (5s)",
      "25 full videos (30s)",
      "Everything in Growth",
      "Unlimited AI avatars",
      "YouTube posting",
      "Multi-shot structured ads",
      "Winner extension (Veo)",
      "Priority generation queue",
      "Cross-campaign insights",
    ],
    limits: {
      avatars: -1, // Unlimited
      campaigns: -1,
      platforms: ["tiktok", "instagram", "youtube"],
    },
  },
  agency: {
    id: "agency",
    name: "Agency",
    priceId: process.env.STRIPE_AGENCY_PRICE_ID,
    price: 499,
    credits: 560, // 300 test + 60 full
    testVideos: 300,
    fullVideos: 60,
    features: [
      "300 test videos (5s)",
      "60 full videos (30s)",
      "Everything in Scale",
      "Multiple brands/products",
      "White-label exports",
      "Spark Ads formatting",
      "API access",
      "Dedicated support",
    ],
    limits: {
      avatars: -1,
      campaigns: -1,
      brands: -1,
      platforms: ["tiktok", "instagram", "youtube", "linkedin"],
    },
  },
};

// Extra credits packages
export const CREDIT_PACKS = {
  small: {
    id: "credits_small",
    priceId: process.env.STRIPE_CREDITS_SMALL_PRICE_ID,
    credits: 10,
    price: 15,
    perCredit: 1.50,
  },
  medium: {
    id: "credits_medium",
    priceId: process.env.STRIPE_CREDITS_MEDIUM_PRICE_ID,
    credits: 30,
    price: 39,
    perCredit: 1.30,
  },
  large: {
    id: "credits_large",
    priceId: process.env.STRIPE_CREDITS_LARGE_PRICE_ID,
    credits: 100,
    price: 99,
    perCredit: 0.99,
  },
};

// ===========================================
// CHECKOUT
// ===========================================

/**
 * Create Stripe Checkout session for subscription
 */
export async function createCheckoutSession({
  userId,
  email,
  planId,
  successUrl,
  cancelUrl,
}) {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  if (!plan.priceId) {
    throw new Error(`Price ID not configured for plan: ${planId}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    mode: "subscription",
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
    cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
    metadata: {
      userId,
      planId,
    },
    subscription_data: {
      metadata: {
        userId,
        planId,
      },
    },
    allow_promotion_codes: true,
  });

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Create Checkout session for credit pack purchase
 */
export async function createCreditsCheckout({
  userId,
  email,
  packId,
  customerId = null,
}) {
  const pack = CREDIT_PACKS[packId];
  if (!pack) {
    throw new Error(`Invalid credit pack: ${packId}`);
  }

  const sessionConfig = {
    mode: "payment",
    line_items: [
      {
        price: pack.priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?credits=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?credits=canceled`,
    metadata: {
      userId,
      packId,
      credits: pack.credits,
      type: "credit_purchase",
    },
  };

  // Use existing customer if available
  if (customerId) {
    sessionConfig.customer = customerId;
  } else {
    sessionConfig.customer_email = email;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);

  return {
    sessionId: session.id,
    url: session.url,
  };
}

// ===========================================
// CUSTOMER PORTAL
// ===========================================

/**
 * Create Stripe Customer Portal session
 */
export async function createPortalSession(customerId) {
  if (!customerId) {
    throw new Error("Customer ID required");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
  });

  return {
    url: session.url,
  };
}

// ===========================================
// SUBSCRIPTION MANAGEMENT
// ===========================================

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId) {
  if (!subscriptionId) return null;

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      plan: subscription.metadata?.planId,
    };
  } catch (error) {
    console.error("[Stripe] Failed to get subscription:", error);
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(subscriptionId) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });

  return {
    id: subscription.id,
    cancelAt: new Date(subscription.cancel_at * 1000),
  };
}

/**
 * Reactivate canceled subscription
 */
export async function reactivateSubscription(subscriptionId) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return {
    id: subscription.id,
    status: subscription.status,
  };
}

/**
 * Change subscription plan
 */
export async function changePlan(subscriptionId, newPlanId) {
  const newPlan = PLANS[newPlanId];
  if (!newPlan) {
    throw new Error(`Invalid plan: ${newPlanId}`);
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentItemId = subscription.items.data[0].id;

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: currentItemId,
        price: newPlan.priceId,
      },
    ],
    metadata: {
      ...subscription.metadata,
      planId: newPlanId,
    },
    proration_behavior: "create_prorations",
  });

  return {
    id: updatedSubscription.id,
    status: updatedSubscription.status,
    plan: newPlanId,
  };
}

// ===========================================
// CUSTOMER MANAGEMENT
// ===========================================

/**
 * Get or create Stripe customer
 */
export async function getOrCreateCustomer(userId, email) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Check if user already has a Stripe customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  // Save customer ID
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(customerId) {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: "card",
  });

  return paymentMethods.data.map(pm => ({
    id: pm.id,
    brand: pm.card.brand,
    last4: pm.card.last4,
    expMonth: pm.card.exp_month,
    expYear: pm.card.exp_year,
  }));
}

// ===========================================
// INVOICE MANAGEMENT
// ===========================================

/**
 * Get customer's invoices
 */
export async function getInvoices(customerId, limit = 10) {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return invoices.data.map(invoice => ({
    id: invoice.id,
    number: invoice.number,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: invoice.status,
    date: new Date(invoice.created * 1000),
    pdfUrl: invoice.invoice_pdf,
  }));
}

// ===========================================
// WEBHOOKS HELPERS
// ===========================================

/**
 * Construct webhook event from raw body
 */
export function constructWebhookEvent(body, signature) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

/**
 * Get plan from price ID
 */
export function getPlanFromPriceId(priceId) {
  for (const [planId, plan] of Object.entries(PLANS)) {
    if (plan.priceId === priceId) {
      return { ...plan, id: planId };
    }
  }
  return null;
}

// ===========================================
// EXPORTS
// ===========================================

export default {
  PLANS,
  CREDIT_PACKS,
  createCheckoutSession,
  createCreditsCheckout,
  createPortalSession,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  changePlan,
  getOrCreateCustomer,
  getPaymentMethods,
  getInvoices,
  constructWebhookEvent,
  getPlanFromPriceId,
};
