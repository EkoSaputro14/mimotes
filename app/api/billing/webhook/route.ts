import { NextRequest, NextResponse } from "next/server";
import { stripe, verifyWebhookSignature, validateStripePriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { clearEntitlementCache } from "@/lib/entitlements";
import { recordSubscriptionEvent } from "@/lib/billing";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import Stripe from "stripe";

/**
 * POST /api/billing/webhook
 * Handle Stripe webhooks with hardened security.
 *
 * Security:
 * - Stripe signature verification (HMAC-SHA256)
 * - DB-backed idempotency (StripeWebhookEvent table)
 * - Replay protection (stripeEventId uniqueness)
 * - Proper error handling (500 for retry, 200 for success)
 * - Unknown price rejection (no silent fallback)
 * - Unknown status → restrictive default (past_due)
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  // ── Signature missing → 400 ──
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // ── Signature verification → 400 on failure ──
  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(body, signature);
  } catch (error) {
    console.error("[Webhook] Signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── DB-backed idempotency ──
  // Attempt to insert the event record atomically.
  // Unique constraint on stripeEventId catches duplicates.
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
      },
    });
  } catch (error: any) {
    // P2002 = unique constraint violation = event already processed
    if (error?.code === "P2002") {
      console.log(`[Webhook] Event ${event.id} already processed — skipping (DB dedup)`);
      return NextResponse.json({ received: true, idempotent: true });
    }
    // Other DB errors → 500 so Stripe retries
    console.error("[Webhook] DB error during idempotency check:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  console.log(`[Webhook] Processing event: ${event.type} (${event.id})`);

  // ── Process event ──
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // ── Processing failed → delete event record + return 500 ──
    // Deleting the event record allows Stripe to retry the webhook.
    console.error(`[Webhook] Error processing ${event.type}:`, error);
    try {
      await prisma.stripeWebhookEvent.delete({
        where: { stripeEventId: event.id },
      });
      console.log(`[Webhook] Cleaned up event record for retry: ${event.id}`);
    } catch (cleanupError) {
      console.error("[Webhook] Failed to cleanup event record:", cleanupError);
    }
    // Return 500 so Stripe retries the event
    return NextResponse.json({ error: "Processing error" }, { status: 500 });
  }
}

// ============================================================
// Event Handlers
// ============================================================

/**
 * checkout.session.completed
 * User completed Stripe Checkout — activate subscription.
 *
 * Price ID validation: REJECTS unknown prices (no fallback).
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = session.metadata?.workspaceId;
  if (!workspaceId) {
    console.error("[Webhook] checkout.session.completed — no workspaceId in metadata");
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("[Webhook] checkout.session.completed — no subscription ID");
    return;
  }

  // Retrieve the full subscription from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  // ── Price validation: reject unknown prices ──
  if (!priceId) {
    throw new Error("No price ID found on checkout session subscription");
  }
  const { plan: planName } = validateStripePriceId(priceId);

  // Find plan in DB
  const plan = await prisma.subscriptionPlan.findUnique({ where: { name: planName } });
  if (!plan) {
    throw new Error(`Plan not found in database: ${planName}`);
  }

  // Update subscription
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const periodStart = subscription.items.data[0]?.current_period_start;

  await prisma.workspaceSubscription.upsert({
    where: { workspaceId },
    update: {
      planId: plan.id,
      status: "active",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      canceledAt: null,
      cancelAtPeriodEnd: false,
    },
    create: {
      workspaceId,
      planId: plan.id,
      status: "active",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });

  // Record event
  await recordSubscriptionEvent(workspaceId, {
    eventType: "checkout_completed",
    toPlan: planName,
    toStatus: "active",
    reason: `Stripe checkout session ${session.id}`,
    stripeEventId: session.id,
    metadata: {
      stripeSubscriptionId: subscriptionId,
    },
  });

  clearEntitlementCache(workspaceId);

  // Audit: subscription created via checkout
  logAudit({
    workspaceId,
    actorType: "system",
    action: AUDIT_ACTIONS.SUBSCRIPTION_CREATED,
    resourceType: "subscription",
    resourceId: subscriptionId,
    metadata: { plan: planName, stripeEventId: session.id },
  });

  console.log(`[Webhook] Checkout completed for workspace ${workspaceId} → ${planName}`);
}

/**
 * invoice.paid
 * Payment succeeded — create Invoice + Payment records, extend period.
 *
 * FK FIX: Creates Invoice first, then Payment references Invoice.id.
 * REPLAY PROTECTION: Checks for existing Invoice (by stripeInvoiceId)
 * and Payment (by stripePaymentId) before creating.
 */
async function handleInvoicePaid(invoice: any) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const sub = await prisma.workspaceSubscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!sub) {
    console.error(`[Webhook] invoice.paid — no subscription found for ${subscriptionId}`);
    return;
  }

  const stripeInvoiceId = invoice.id;

  // ── 1. Find or create Invoice (replay protection) ──
  let localInvoice = await prisma.invoice.findFirst({
    where: { stripeInvoiceId },
  });

  if (!localInvoice) {
    // Extract billing period from invoice lines
    const lineItem = (invoice as any).lines?.data?.[0];
    const periodStart = lineItem?.period?.start
      ? new Date(lineItem.period.start * 1000)
      : new Date();
    const periodEnd = lineItem?.period?.end
      ? new Date(lineItem.period.end * 1000)
      : new Date();

    localInvoice = await prisma.invoice.create({
      data: {
        workspaceId: sub.workspaceId,
        invoiceNumber: `INV-${stripeInvoiceId}`,
        status: "paid",
        currency: invoice.currency || "usd",
        subtotal: (invoice as any).subtotal || invoice.amount_paid || 0,
        tax: (invoice as any).tax || 0,
        total: (invoice as any).total || invoice.amount_paid || 0,
        periodStart,
        periodEnd,
        paidAt: (invoice as any).status_transitions?.paid_at
          ? new Date((invoice as any).status_transitions.paid_at * 1000)
          : new Date(),
        stripeInvoiceId,
      },
    });
    console.log(`[Webhook] Created Invoice ${localInvoice.invoiceNumber} for workspace ${sub.workspaceId}`);
  }

  // ── 2. Create Payment (replay protection — check for existing) ──
  const stripePaymentId = (invoice as any).payment_intent as string || null;

  if (stripePaymentId) {
    const existingPayment = await prisma.payment.findFirst({
      where: { stripePaymentId },
    });

    if (!existingPayment) {
      await prisma.payment.create({
        data: {
          invoiceId: localInvoice.id, // ← CORRECT: references Invoice.id
          workspaceId: sub.workspaceId,
          amount: invoice.amount_paid || 0,
          currency: invoice.currency || "usd",
          status: "succeeded",
          paymentMethod: "card",
          stripePaymentId,
          paidAt: (invoice as any).status_transitions?.paid_at
            ? new Date((invoice as any).status_transitions.paid_at * 1000)
            : new Date(),
        },
      });
      console.log(`[Webhook] Created Payment for invoice ${stripeInvoiceId}`);
    } else {
      console.log(`[Webhook] Payment already exists for ${stripePaymentId} — skipping`);
    }
  }

  // ── 3. Update subscription period ──
  const lineItem = (invoice as any).lines?.data?.[0];
  const periodEnd = lineItem?.period?.end;

  await prisma.workspaceSubscription.update({
    where: { id: sub.id },
    data: {
      status: "active",
      stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : undefined,
    },
  });

  // ── 4. Record event ──
  await recordSubscriptionEvent(sub.workspaceId, {
    eventType: "invoice_paid",
    toStatus: "active",
    reason: `Invoice ${stripeInvoiceId} paid`,
    stripeEventId: stripeInvoiceId,
    metadata: {
      amount: invoice.amount_paid,
      currency: invoice.currency,
    },
  });

  clearEntitlementCache(sub.workspaceId);

  // Audit: subscription updated (invoice paid)
  logAudit({
    workspaceId: sub.workspaceId,
    actorType: "system",
    action: AUDIT_ACTIONS.SUBSCRIPTION_UPDATED,
    resourceType: "subscription",
    resourceId: subscriptionId,
    metadata: { event: "invoice.paid", amount: invoice.amount_paid, currency: invoice.currency },
  });

  console.log(`[Webhook] Invoice paid for workspace ${sub.workspaceId} — $${(invoice.amount_paid || 0) / 100}`);
}

/**
 * invoice.payment_failed
 * Payment failed — mark as past_due.
 */
async function handleInvoicePaymentFailed(invoice: any) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const sub = await prisma.workspaceSubscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (!sub) return;

  await prisma.workspaceSubscription.update({
    where: { id: sub.id },
    data: { status: "past_due" },
  });

  await recordSubscriptionEvent(sub.workspaceId, {
    eventType: "invoice_payment_failed",
    fromStatus: "active",
    toStatus: "past_due",
    reason: `Invoice ${invoice.id} payment failed`,
    stripeEventId: invoice.id,
    metadata: {
      attemptCount: (invoice as any).attempt_count,
    },
  });

  console.log(`[Webhook] Payment failed for workspace ${sub.workspaceId} — attempt ${(invoice as any).attempt_count}`);

  // Audit: subscription payment failed
  logAudit({
    workspaceId: sub.workspaceId,
    actorType: "system",
    action: AUDIT_ACTIONS.SUBSCRIPTION_PAYMENT_FAILED,
    resourceType: "subscription",
    resourceId: sub.stripeSubscriptionId || sub.id,
    metadata: { event: "invoice.payment_failed", attemptCount: (invoice as any).attempt_count },
  });
}

/**
 * customer.subscription.updated
 * Plan change, renewal, or status update from Stripe.
 *
 * Price validation: REJECTS unknown prices.
 * Status mapping: unknown statuses → "past_due" (restrictive).
 */
async function handleSubscriptionUpdated(subscription: any) {
  const sub = await prisma.workspaceSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!sub) {
    console.error(`[Webhook] subscription.updated — no subscription found for ${subscription.id}`);
    return;
  }

  // ── Price validation: reject unknown prices ──
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    throw new Error(`No price ID found on subscription ${subscription.id}`);
  }
  const { plan: newPlanName } = validateStripePriceId(priceId);

  const plan = await prisma.subscriptionPlan.findUnique({ where: { name: newPlanName } });
  if (!plan) {
    throw new Error(`Plan not found in database: ${newPlanName}`);
  }

  // ── Status mapping: unknown → "past_due" (restrictive) ──
  const statusMap: Record<string, string> = {
    active: "active",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    trialing: "trial",
    paused: "canceled",
  };

  const newStatus = statusMap[subscription.status];
  if (!newStatus) {
    console.warn(
      `[Webhook] Unknown Stripe status "${subscription.status}" for subscription ${subscription.id} — defaulting to past_due`
    );
  }
  const resolvedStatus = newStatus || "past_due";

  await prisma.workspaceSubscription.update({
    where: { id: sub.id },
    data: {
      planId: plan.id,
      status: resolvedStatus,
      stripePriceId: priceId,
      stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    },
  });

  await recordSubscriptionEvent(sub.workspaceId, {
    eventType: "subscription_updated",
    fromPlan: sub.planId !== plan.id ? "unknown" : undefined,
    toPlan: newPlanName,
    toStatus: resolvedStatus,
    reason: `Stripe subscription updated`,
    stripeEventId: subscription.id,
    metadata: {
      stripeStatus: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  clearEntitlementCache(sub.workspaceId);

  // Audit: subscription updated
  logAudit({
    workspaceId: sub.workspaceId,
    actorType: "system",
    action: AUDIT_ACTIONS.SUBSCRIPTION_UPDATED,
    resourceType: "subscription",
    resourceId: subscription.id,
    metadata: { plan: newPlanName, status: resolvedStatus, stripeStatus: subscription.status },
  });

  console.log(`[Webhook] Subscription updated for workspace ${sub.workspaceId} → ${newPlanName} (${resolvedStatus})`);
}

/**
 * customer.subscription.deleted
 * Subscription canceled in Stripe — revoke access.
 */
async function handleSubscriptionDeleted(subscription: any) {
  const sub = await prisma.workspaceSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!sub) {
    console.error(`[Webhook] subscription.deleted — no subscription found for ${subscription.id}`);
    return;
  }

  // Find free plan
  const freePlan = await prisma.subscriptionPlan.findUnique({ where: { name: "free" } });
  if (!freePlan) {
    throw new Error("Free plan not found in database");
  }

  await prisma.workspaceSubscription.update({
    where: { id: sub.id },
    data: {
      planId: freePlan.id,
      status: "canceled",
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: null,
      stripePriceId: null,
    },
  });

  await recordSubscriptionEvent(sub.workspaceId, {
    eventType: "subscription_canceled",
    fromStatus: sub.status,
    toStatus: "canceled",
    reason: "Stripe subscription deleted",
    stripeEventId: subscription.id,
  });

  clearEntitlementCache(sub.workspaceId);

  // Audit: subscription canceled
  logAudit({
    workspaceId: sub.workspaceId,
    actorType: "system",
    action: AUDIT_ACTIONS.SUBSCRIPTION_CANCELED,
    resourceType: "subscription",
    resourceId: subscription.id,
    metadata: { event: "customer.subscription.deleted", fromStatus: sub.status },
  });

  console.log(`[Webhook] Subscription deleted for workspace ${sub.workspaceId} — revoked access`);
}
