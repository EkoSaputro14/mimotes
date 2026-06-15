import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// ============================================================
// Stripe Client (lazy initialization)
// ============================================================

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY not configured — Stripe features disabled");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-05-27.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}

/** Convenience alias */
export const stripe = {
  get checkout() { return getStripe().checkout; },
  get customers() { return getStripe().customers; },
  get subscriptions() { return getStripe().subscriptions; },
  get invoices() { return getStripe().invoices; },
  get billingPortal() { return getStripe().billingPortal; },
  get webhooks() { return getStripe().webhooks; },
};

// ============================================================
// Price IDs — configure in .env
// ============================================================

export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "",
  enterprise_yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || "",
} as const;

/** Map plan name + interval to Stripe Price ID */
export function getStripePriceId(
  plan: string,
  interval: "month" | "year"
): string | null {
  const key = `${plan}_${interval}` as keyof typeof STRIPE_PRICES;
  const priceId = STRIPE_PRICES[key];
  return priceId || null;
}

/** Map Stripe Price ID back to plan name + interval */
export function parseStripePriceId(priceId: string): {
  plan: string;
  interval: "month" | "year";
} | null {
  for (const [key, id] of Object.entries(STRIPE_PRICES)) {
    if (id === priceId) {
      const [plan, interval] = key.split("_");
      return {
        plan,
        interval: interval as "month" | "year",
      };
    }
  }
  return null;
}

/**
 * Validate a Stripe Price ID. Returns parsed plan info or throws on unknown.
 * Use this instead of parseStripePriceId + fallback to prevent silent plan mismatches.
 */
export function validateStripePriceId(priceId: string): {
  plan: string;
  interval: "month" | "year";
} {
  const parsed = parseStripePriceId(priceId);
  if (!parsed) {
    throw new Error(`Unknown Stripe price ID: ${priceId}. No matching plan configured.`);
  }
  return parsed;
}

// ============================================================
// Customer Management
// ============================================================

/**
 * Get or create a Stripe customer for a workspace.
 */
export async function getOrCreateStripeCustomer(
  workspaceId: string,
  email: string,
  name?: string
): Promise<string> {
  // Check if already has a Stripe customer
  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    select: { stripeCustomerId: true },
  });

  if (sub?.stripeCustomerId) {
    return sub.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      workspaceId,
    },
  });

  // Store in subscription record
  await prisma.workspaceSubscription.upsert({
    where: { workspaceId },
    update: { stripeCustomerId: customer.id },
    create: {
      workspaceId,
      planId: (await prisma.subscriptionPlan.findUnique({ where: { name: "free" } }))!.id,
      status: "active",
      stripeCustomerId: customer.id,
    },
  });

  return customer.id;
}

/**
 * Get Stripe customer ID for a workspace.
 */
export async function getStripeCustomerId(
  workspaceId: string
): Promise<string | null> {
  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    select: { stripeCustomerId: true },
  });
  return sub?.stripeCustomerId || null;
}

// ============================================================
// Checkout Session
// ============================================================

export interface CreateCheckoutParams {
  workspaceId: string;
  email: string;
  name?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create a Stripe Checkout Session for subscription.
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<Stripe.Checkout.Session> {
  const customerId = await getOrCreateStripeCustomer(
    params.workspaceId,
    params.email,
    params.name
  );

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      workspaceId: params.workspaceId,
    },
    subscription_data: {
      metadata: {
        workspaceId: params.workspaceId,
      },
    },
    allow_promotion_codes: true,
  });

  return session;
}

// ============================================================
// Customer Portal
// ============================================================

export interface CreatePortalParams {
  workspaceId: string;
  returnUrl: string;
}

/**
 * Create a Stripe Customer Portal session.
 */
export async function createPortalSession(
  params: CreatePortalParams
): Promise<Stripe.BillingPortal.Session> {
  const customerId = await getStripeCustomerId(params.workspaceId);

  if (!customerId) {
    throw new Error("No Stripe customer found for this workspace");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: params.returnUrl,
  });

  return session;
}

// ============================================================
// Subscription Helpers
// ============================================================

/**
 * Cancel a Stripe subscription immediately.
 */
export async function cancelStripeSubscription(
  stripeSubscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.cancel(stripeSubscriptionId);
}

/**
 * Update a Stripe subscription (plan change).
 */
export async function updateStripeSubscription(
  stripeSubscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  // Get current subscription to find the subscription item
  const subscription = await stripe.subscriptions.retrieve(
    stripeSubscriptionId
  );

  return stripe.subscriptions.update(stripeSubscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: "create_prorations",
  });
}

/**
 * Get upcoming invoice for preview (before plan change).
 */
export async function getUpcomingInvoice(
  stripeSubscriptionId: string,
  newPriceId: string
): Promise<any> {
  const subscription = await stripe.subscriptions.retrieve(
    stripeSubscriptionId
  );

  return (stripe.invoices as any).retrieveUpcoming({
    customer: subscription.customer as string,
    subscription: stripeSubscriptionId,
    subscription_items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    subscription_proration_behavior: "create_prorations",
  });
}

// ============================================================
// Webhook Signature Verification
// ============================================================

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Verify Stripe webhook signature.
 * Returns the verified event or throws.
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!WEBHOOK_SECRET) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
}

// ============================================================
// Product Catalog (for UI display)
// ============================================================

export interface StripePlanInfo {
  name: string;
  displayName: string;
  monthlyPriceId: string;
  yearlyPriceId: string;
  monthlyPrice: number;  // cents
  yearlyPrice: number;   // cents
  features: string[];
}

export const PLAN_CATALOG: StripePlanInfo[] = [
  {
    name: "pro",
    displayName: "Pro",
    monthlyPriceId: STRIPE_PRICES.pro_monthly,
    yearlyPriceId: STRIPE_PRICES.pro_yearly,
    monthlyPrice: 2900,
    yearlyPrice: 29000,
    features: [
      "100 documents",
      "10 GB storage",
      "50,000 chat messages",
      "20 team members",
      "MCP Server Integration",
      "Public Widget",
      "API Access",
      "Custom Branding",
      "Priority Support",
    ],
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    monthlyPriceId: STRIPE_PRICES.enterprise_monthly,
    yearlyPriceId: STRIPE_PRICES.enterprise_yearly,
    monthlyPrice: 9900,
    yearlyPrice: 99000,
    features: [
      "Unlimited documents",
      "Unlimited storage",
      "Unlimited chat messages",
      "Unlimited team members",
      "All Pro features",
      "Audit Logs",
      "Single Sign-On (SSO)",
      "Dedicated Support",
    ],
  },
];
