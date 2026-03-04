// src/app/api/webhooks/stripe/route.js
// Stripe Webhook Handler
// Processes subscription and payment events

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { constructWebhookEvent, getPlanFromPriceId, PLANS, CREDIT_PACKS } from "@/lib/billing/stripe";
import { addCredits } from "@/lib/billing/credits";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;

  try {
    event = constructWebhookEvent(body, signature);
  } catch (error) {
    console.error("[Stripe Webhook] Signature verification failed:", error.message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Processing ${event.type}`);

  try {
    switch (event.type) {
      // ===========================================
      // CHECKOUT COMPLETED
      // ===========================================
      case "checkout.session.completed": {
        const session = event.data.object;
        const { userId, planId, packId, type, credits } = session.metadata;

        if (type === "credit_purchase") {
          // One-time credit purchase
          await handleCreditPurchase(userId, parseInt(credits) || CREDIT_PACKS[packId]?.credits);
        } else {
          // Subscription checkout
          await handleSubscriptionCreated(userId, planId, session);
        }
        break;
      }

      // ===========================================
      // SUBSCRIPTION EVENTS
      // ===========================================
      case "customer.subscription.created": {
        const subscription = event.data.object;
        const { userId, planId } = subscription.metadata;

        if (userId && planId) {
          await handleSubscriptionCreated(userId, planId, { subscription: subscription.id });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const { userId } = subscription.metadata;

        // Check if plan changed
        const priceId = subscription.items.data[0]?.price?.id;
        const newPlan = getPlanFromPriceId(priceId);

        await supabase
          .from("profiles")
          .update({
            subscription_status: subscription.status,
            plan: newPlan?.id || subscription.metadata.planId,
          })
          .eq("stripe_customer_id", subscription.customer);

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        // Downgrade to free
        await supabase
          .from("profiles")
          .update({
            plan: "free",
            subscription_status: "canceled",
            subscription_id: null,
          })
          .eq("stripe_customer_id", subscription.customer);

        // Notify user
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (profile) {
          await createNotification({
            userId: profile.id,
            type: "subscription_canceled",
            title: "Subscription Canceled",
            message: "Your subscription has been canceled. You can still use remaining credits.",
          });
        }

        break;
      }

      // ===========================================
      // INVOICE EVENTS (Monthly renewals)
      // ===========================================
      case "invoice.payment_succeeded": {
        const invoice = event.data.object;

        // Only process subscription renewals, not initial payment
        if (invoice.billing_reason === "subscription_cycle") {
          await handleSubscriptionRenewal(invoice);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;

        // Notify user of failed payment
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", invoice.customer)
          .single();

        if (profile) {
          await createNotification({
            userId: profile.id,
            type: "payment_failed",
            title: "Payment Failed",
            message: "We couldn't process your payment. Please update your payment method to avoid service interruption.",
          });
        }
        break;
      }

      // ===========================================
      // DEFAULT
      // ===========================================
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// ===========================================
// HANDLER FUNCTIONS
// ===========================================

/**
 * Handle new subscription created
 */
async function handleSubscriptionCreated(userId, planId, session) {
  const plan = PLANS[planId];
  if (!plan) {
    console.error(`[Stripe Webhook] Unknown plan: ${planId}`);
    return;
  }

  // Update user profile
  const { error } = await supabase
    .from("profiles")
    .update({
      plan: planId,
      stripe_customer_id: session.customer,
      subscription_id: session.subscription,
      subscription_status: "active",
      credits: plan.credits,
      credits_used: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("[Stripe Webhook] Failed to update profile:", error);
    throw error;
  }

  // Log credit transaction
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: plan.credits,
    balance_after: plan.credits,
    transaction_type: "subscription",
    description: `${plan.name} plan subscription`,
  });

  // Send welcome notification
  await createNotification({
    userId,
    type: "subscription_created",
    title: `Welcome to ${plan.name}!`,
    message: `Your subscription is active. You have ${plan.credits} credits to use this month.`,
    data: {
      plan: planId,
      credits: plan.credits,
    },
  });

  console.log(`[Stripe Webhook] Subscription created for user ${userId}: ${planId}`);
}

/**
 * Handle subscription renewal (monthly credit reset)
 */
async function handleSubscriptionRenewal(invoice) {
  // Get user from customer ID
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, plan, credits")
    .eq("stripe_customer_id", invoice.customer)
    .single();

  if (profileError || !profile) {
    console.error("[Stripe Webhook] Profile not found for customer:", invoice.customer);
    return;
  }

  const plan = PLANS[profile.plan];
  if (!plan) {
    console.error("[Stripe Webhook] Unknown plan for renewal:", profile.plan);
    return;
  }

  // Reset credits to plan amount
  const { error } = await supabase
    .from("profiles")
    .update({
      credits: plan.credits,
      credits_used: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) {
    console.error("[Stripe Webhook] Failed to reset credits:", error);
    throw error;
  }

  // Log transaction
  await supabase.from("credit_transactions").insert({
    user_id: profile.id,
    amount: plan.credits,
    balance_after: plan.credits,
    transaction_type: "renewal",
    description: `Monthly renewal - ${plan.name} plan`,
  });

  // Notify user
  await createNotification({
    userId: profile.id,
    type: "credits_renewed",
    title: "Credits Renewed!",
    message: `Your monthly credits have been reset. You now have ${plan.credits} credits.`,
    data: {
      credits: plan.credits,
    },
  });

  console.log(`[Stripe Webhook] Credits renewed for user ${profile.id}: ${plan.credits}`);
}

/**
 * Handle one-time credit purchase
 */
async function handleCreditPurchase(userId, credits) {
  if (!userId || !credits) {
    console.error("[Stripe Webhook] Missing userId or credits for purchase");
    return;
  }

  // Add credits to user
  const result = await addCredits(userId, credits, "Credit pack purchase");

  if (!result.success) {
    console.error("[Stripe Webhook] Failed to add credits:", result.error);
    throw new Error(result.error);
  }

  // Notify user
  await createNotification({
    userId,
    type: "credits_purchased",
    title: "Credits Added!",
    message: `${credits} credits have been added to your account.`,
    data: {
      credits,
      newBalance: result.newBalance,
    },
  });

  console.log(`[Stripe Webhook] Credits purchased for user ${userId}: ${credits}`);
}

/**
 * Create notification helper
 */
async function createNotification({ userId, type, title, message, data = {} }) {
  try {
    await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false,
    });
  } catch (error) {
    console.error("[Notification] Failed to create:", error);
  }
}
