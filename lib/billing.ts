import { prisma } from "@/lib/prisma";
import { getPlanLimits, getCurrentPeriod } from "@/lib/usage";
import { clearEntitlementCache } from "@/lib/entitlements";

// ============================================================
// Types
// ============================================================

export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled";
export type InvoiceStatus = "draft" | "open" | "paid" | "void" | "uncollectible";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface BillingSummary {
  workspaceId: string;
  plan: {
    name: string;
    displayName: string;
  };
  subscription: {
    status: SubscriptionStatus;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    canceledAt: string | null;
  };
  usage: {
    period: string;
    documents: { used: number; limit: number; percent: number };
    storage: { used: number; limit: number; percent: number };
    chatMessages: { used: number; limit: number; percent: number };
    aiRequests: { used: number; limit: number; percent: number };
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    total: number;
    currency: string;
    dueDate: string | null;
    paidAt: string | null;
    periodStart: string;
    periodEnd: string;
  }>;
  totalPaid: number;
  upgradeSuggestions: UpgradeSuggestion[];
}

export interface UpgradeSuggestion {
  metric: string;
  currentUsage: number;
  limit: number;
  percent: number;
  recommendedPlan: string;
  reason: string;
}

export interface PlanPricing {
  name: string;
  displayName: string;
  monthlyPrice: number;  // cents
  yearlyPrice: number;   // cents
  features: string[];
}

// ============================================================
// Plan Pricing (ready for Stripe integration)
// ============================================================

export const PLAN_PRICING: Record<string, PlanPricing> = {
  free: {
    name: "free",
    displayName: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "10 documents",
      "100 MB storage",
      "1,000 chat messages",
      "3 team members",
    ],
  },
  pro: {
    name: "pro",
    displayName: "Pro",
    monthlyPrice: 2900,  // $29/month
    yearlyPrice: 29000,  // $290/year (2 months free)
    features: [
      "100 documents",
      "10 GB storage",
      "50,000 chat messages",
      "20 team members",
      "Priority support",
    ],
  },
  enterprise: {
    name: "enterprise",
    displayName: "Enterprise",
    monthlyPrice: 9900,  // $99/month
    yearlyPrice: 99000,  // $990/year
    features: [
      "Unlimited documents",
      "Unlimited storage",
      "Unlimited chat messages",
      "Unlimited team members",
      "Custom integrations",
      "Dedicated support",
    ],
  },
};

// ============================================================
// Invoice Management
// ============================================================

/**
 * Generate next invoice number.
 */
async function getNextInvoiceNumber(): Promise<string> {
  const period = getCurrentPeriod();
  const count = await prisma.invoice.count();
  return `INV-${period}-${String(count + 1).padStart(4, "0")}`;
}

/**
 * Create an invoice for a workspace.
 */
export async function createInvoice(
  workspaceId: string,
  params: {
    subtotal: number;
    tax?: number;
    periodStart: Date;
    periodEnd: Date;
    dueDate?: Date;
    lineItems: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
    metadata?: Record<string, unknown>;
  }
) {
  const invoiceNumber = await getNextInvoiceNumber();
  const total = params.subtotal + (params.tax || 0);

  const invoice = await prisma.invoice.create({
    data: {
      workspaceId,
      invoiceNumber,
      status: "open",
      currency: "usd",
      subtotal: params.subtotal,
      tax: params.tax || 0,
      total,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      dueDate: params.dueDate,
      metadata: (params.metadata || {}) as Record<string, string>,
      lineItems: {
        create: params.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      lineItems: true,
    },
  });

  return invoice;
}

/**
 * Record a payment for an invoice.
 */
export async function recordPayment(
  invoiceId: string,
  workspaceId: string,
  params: {
    amount: number;
    currency?: string;
    paymentMethod?: string;
    stripePaymentId?: string;
    paidAt?: Date;
    metadata?: Record<string, unknown>;
  }
) {
  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      workspaceId,
      amount: params.amount,
      currency: params.currency || "usd",
      status: "succeeded",
      paymentMethod: params.paymentMethod,
      stripePaymentId: params.stripePaymentId,
      paidAt: params.paidAt || new Date(),
      metadata: (params.metadata || {}) as Record<string, string>,
    },
  });

  // Update invoice status
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "paid",
      paidAt: params.paidAt || new Date(),
    },
  });

  return payment;
}

// ============================================================
// Subscription Lifecycle
// ============================================================

/**
 * Record a subscription event (audit trail).
 */
export async function recordSubscriptionEvent(
  workspaceId: string,
  params: {
    eventType: string;
    fromPlan?: string;
    toPlan?: string;
    fromStatus?: string;
    toStatus?: string;
    reason?: string;
    stripeEventId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  return prisma.subscriptionEvent.create({
    data: {
      workspaceId,
      eventType: params.eventType,
      fromPlan: params.fromPlan,
      toPlan: params.toPlan,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      reason: params.reason,
      stripeEventId: params.stripeEventId,
      metadata: (params.metadata || {}) as Record<string, string>,
    },
  });
}

/**
 * Change plan for a workspace.
 * Handles upgrade/downgrade with proper lifecycle management.
 * BLOCKS canceled subscriptions — use reSubscribe() instead.
 */
export async function changePlan(
  workspaceId: string,
  newPlanName: string,
  options: {
    reason?: string;
    effectiveDate?: "immediate" | "next_period";
    metadata?: Record<string, unknown>;
  } = {}
) {
  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    include: { plan: true },
  });

  if (!sub) {
    throw new Error("No active subscription found");
  }

  // BLOCK: Cannot change plan on canceled subscription
  if (sub.status === "canceled") {
    throw new Error("Cannot change plan on canceled subscription. Please re-subscribe.");
  }

  const oldPlanName = sub.plan.name;
  if (oldPlanName === newPlanName) {
    throw new Error("Already on this plan");
  }

  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { name: newPlanName },
  });

  if (!newPlan) {
    throw new Error(`Plan '${newPlanName}' not found`);
  }

  const isUpgrade = PLAN_PRICING[newPlanName]?.monthlyPrice > PLAN_PRICING[oldPlanName]?.monthlyPrice;

  // For next_period: delay planId change by storing pending plan
  // For immediate: change planId now
  const isDelayed = options.effectiveDate === "next_period";

  const updated = await prisma.workspaceSubscription.update({
    where: { workspaceId },
    data: {
      planId: isDelayed ? sub.planId : newPlan.id,
      status: "active",
      // Store pending plan for next_period changes
      ...(isDelayed ? { currentPeriodEnd: sub.currentPeriodEnd } : {}),
    },
    include: { plan: true },
  });

  // If next_period, we need to store the pending plan separately
  // For now, we change immediately but set status to indicate pending
  // TODO: Implement proper next_period with scheduled task when Stripe is added
  if (isDelayed) {
    // Override with immediate effect for now — next_period requires cron
    const immediateUpdate = await prisma.workspaceSubscription.update({
      where: { workspaceId },
      data: { planId: newPlan.id },
      include: { plan: true },
    });

    await recordSubscriptionEvent(workspaceId, {
      eventType: isUpgrade ? "plan_upgraded" : "plan_downgraded",
      fromPlan: oldPlanName,
      toPlan: newPlanName,
      fromStatus: sub.status,
      toStatus: "active",
      reason: options.reason || "Scheduled for next period (applied immediately — cron not implemented)",
      metadata: { ...options.metadata, effectiveDate: "next_period", note: "Applied immediately pending cron implementation" },
    });

    clearEntitlementCache(workspaceId);
    return immediateUpdate;
  }

  // Record event
  await recordSubscriptionEvent(workspaceId, {
    eventType: isUpgrade ? "plan_upgraded" : "plan_downgraded",
    fromPlan: oldPlanName,
    toPlan: newPlanName,
    fromStatus: sub.status,
    toStatus: "active",
    reason: options.reason,
    metadata: options.metadata,
  });

  // Clear entitlement cache so next request picks up new features
  clearEntitlementCache(workspaceId);

  return updated;
}

/**
 * Re-subscribe a canceled workspace to a new plan.
 * This is the ONLY way to reactivate a canceled subscription.
 */
export async function reSubscribe(
  workspaceId: string,
  planName: string,
  options: {
    reason?: string;
    metadata?: Record<string, unknown>;
  } = {}
) {
  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    include: { plan: true },
  });

  if (!sub) {
    throw new Error("No subscription found");
  }

  if (sub.status !== "canceled") {
    throw new Error("Subscription is not canceled. Use changePlan() instead.");
  }

  const newPlan = await prisma.subscriptionPlan.findUnique({
    where: { name: planName },
  });

  if (!newPlan) {
    throw new Error(`Plan '${planName}' not found`);
  }

  const now = new Date();
  const updated = await prisma.workspaceSubscription.update({
    where: { workspaceId },
    data: {
      planId: newPlan.id,
      status: "active",
      canceledAt: null,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    include: { plan: true },
  });

  await recordSubscriptionEvent(workspaceId, {
    eventType: "subscription_reactivated",
    fromPlan: sub.plan.name,
    toPlan: planName,
    fromStatus: "canceled",
    toStatus: "active",
    reason: options.reason || "User re-subscribed",
    metadata: options.metadata,
  });

  clearEntitlementCache(workspaceId);

  return updated;
}

/**
 * Cancel a subscription.
 */
export async function cancelSubscription(
  workspaceId: string,
  options: {
    reason?: string;
    immediate?: boolean;
    metadata?: Record<string, unknown>;
  } = {}
) {
  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    include: { plan: true },
  });

  if (!sub) {
    throw new Error("No active subscription found");
  }

  if (sub.status === "canceled") {
    throw new Error("Subscription already canceled");
  }

  const now = new Date();
  const updated = await prisma.workspaceSubscription.update({
    where: { workspaceId },
    data: {
      status: "canceled",
      canceledAt: now,
    },
    include: { plan: true },
  });

  await recordSubscriptionEvent(workspaceId, {
    eventType: "subscription_canceled",
    fromPlan: sub.plan.name,
    fromStatus: sub.status,
    toStatus: "canceled",
    reason: options.reason,
    metadata: options.metadata,
  });

  // Clear entitlement cache so premium access is revoked immediately
  clearEntitlementCache(workspaceId);

  return updated;
}

/**
 * Start a trial for a workspace.
 */
export async function startTrial(
  workspaceId: string,
  planName: string,
  trialDays: number = 14
) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { name: planName },
  });

  if (!plan) {
    throw new Error(`Plan '${planName}' not found`);
  }

  const now = new Date();
  const trialEnds = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

  const updated = await prisma.workspaceSubscription.update({
    where: { workspaceId },
    data: {
      planId: plan.id,
      status: "trial",
      trialStartsAt: now,
      trialEndsAt: trialEnds,
      currentPeriodStart: now,
      currentPeriodEnd: trialEnds,
    },
    include: { plan: true },
  });

  await recordSubscriptionEvent(workspaceId, {
    eventType: "trial_started",
    toPlan: planName,
    toStatus: "trial",
    metadata: { trialDays },
  });

  return updated;
}

// ============================================================
// Usage-Based Upgrade Suggestions
// ============================================================

/**
 * Check usage and generate upgrade suggestions.
 */
export async function getUpgradeSuggestions(
  workspaceId: string
): Promise<UpgradeSuggestion[]> {
  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    include: { plan: true },
  });

  const currentPlanName = sub?.plan?.name || "free";
  if (currentPlanName === "enterprise") return []; // No upgrades available

  const nextPlanName = currentPlanName === "free" ? "pro" : "enterprise";
  const nextPlanLimits = await getPlanLimits(
    await getWorkspaceIdForPlan(nextPlanName)
  );

  // Get current usage
  const period = getCurrentPeriod();
  const usage = await prisma.workspaceUsage.findUnique({
    where: { workspaceId_period: { workspaceId, period } },
  });

  if (!usage) return [];

  const currentLimits = sub?.plan
    ? {
        maxDocuments: sub.plan.maxDocuments,
        maxStorageMB: sub.plan.maxStorageMB,
        maxChatMessages: sub.plan.maxChatMessages,
        maxAIRequests: sub.plan.maxAIRequests,
      }
    : { maxDocuments: 10, maxStorageMB: 100, maxChatMessages: 1000, maxAIRequests: 500 };

  const suggestions: UpgradeSuggestion[] = [];

  // Check each metric
  const metrics = [
    {
      metric: "Documents",
      used: usage.documentsCreated,
      limit: currentLimits.maxDocuments,
      nextLimit: nextPlanLimits.maxDocuments,
    },
    {
      metric: "Storage (MB)",
      used: Math.round(Number(usage.storageBytesUsed) / (1024 * 1024)),
      limit: currentLimits.maxStorageMB,
      nextLimit: nextPlanLimits.maxStorageMB,
    },
    {
      metric: "Chat Messages",
      used: usage.chatMessages,
      limit: currentLimits.maxChatMessages,
      nextLimit: nextPlanLimits.maxChatMessages,
    },
    {
      metric: "AI Requests",
      used: usage.aiRequests,
      limit: currentLimits.maxAIRequests,
      nextLimit: nextPlanLimits.maxAIRequests,
    },
  ];

  for (const m of metrics) {
    if (m.limit === -1) continue; // Unlimited
    const percent = Math.round((m.used / m.limit) * 100);

    if (percent >= 80) {
      suggestions.push({
        metric: m.metric,
        currentUsage: m.used,
        limit: m.limit,
        percent,
        recommendedPlan: nextPlanName,
        reason: `${percent}% of ${m.metric.toLowerCase()} limit used. Upgrade to ${nextPlanName} for ${m.nextLimit === -1 ? "unlimited" : m.nextLimit.toLocaleString()} ${m.metric.toLowerCase()}.`,
      });
    }
  }

  return suggestions;
}

// Helper to get workspace ID for plan lookup (temp)
async function getWorkspaceIdForPlan(_planName: string): Promise<string> {
  // This is a workaround — in production, plan limits are independent of workspace
  return "";
}

// ============================================================
// Billing Summary
// ============================================================

/**
 * Get full billing summary for a workspace.
 */
export async function getBillingSummary(
  workspaceId: string
): Promise<BillingSummary> {
  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    include: { plan: true },
  });

  const planName = sub?.plan?.name || "free";
  const planDisplayName = sub?.plan?.displayName || "Free";

  // Get usage
  const period = getCurrentPeriod();
  const usage = await prisma.workspaceUsage.findUnique({
    where: { workspaceId_period: { workspaceId, period } },
  });

  const limits = sub?.plan
    ? {
        maxDocuments: sub.plan.maxDocuments,
        maxStorageMB: sub.plan.maxStorageMB,
        maxChatMessages: sub.plan.maxChatMessages,
        maxAIRequests: sub.plan.maxAIRequests,
      }
    : { maxDocuments: 10, maxStorageMB: 100, maxChatMessages: 1000, maxAIRequests: 500 };

  function pct(used: number, max: number): number {
    if (max === -1) return 0;
    if (max === 0) return 100;
    return Math.min(100, Math.round((used / max) * 100));
  }

  // Get invoices
  const invoices = await prisma.invoice.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: 12,
    select: {
      id: true,
      invoiceNumber: true,
      status: true,
      total: true,
      currency: true,
      dueDate: true,
      paidAt: true,
      periodStart: true,
      periodEnd: true,
    },
  });

  // Total paid
  const payments = await prisma.payment.aggregate({
    where: { workspaceId, status: "succeeded" },
    _sum: { amount: true },
  });

  const totalPaid = payments._sum.amount || 0;

  // Upgrade suggestions
  const upgradeSuggestions = await getUpgradeSuggestions(workspaceId);

  return {
    workspaceId,
    plan: { name: planName, displayName: planDisplayName },
    subscription: {
      status: (sub?.status as SubscriptionStatus) || "active",
      trialEndsAt: sub?.trialEndsAt?.toISOString() || null,
      currentPeriodStart: sub?.currentPeriodStart?.toISOString() || null,
      currentPeriodEnd: sub?.currentPeriodEnd?.toISOString() || null,
      canceledAt: sub?.canceledAt?.toISOString() || null,
    },
    usage: {
      period,
      documents: {
        used: usage?.documentsCreated || 0,
        limit: limits.maxDocuments,
        percent: pct(usage?.documentsCreated || 0, limits.maxDocuments),
      },
      storage: {
        used: Math.round(Number(usage?.storageBytesUsed || 0) / (1024 * 1024)),
        limit: limits.maxStorageMB,
        percent: pct(
          Math.round(Number(usage?.storageBytesUsed || 0) / (1024 * 1024)),
          limits.maxStorageMB
        ),
      },
      chatMessages: {
        used: usage?.chatMessages || 0,
        limit: limits.maxChatMessages,
        percent: pct(usage?.chatMessages || 0, limits.maxChatMessages),
      },
      aiRequests: {
        used: usage?.aiRequests || 0,
        limit: limits.maxAIRequests,
        percent: pct(usage?.aiRequests || 0, limits.maxAIRequests),
      },
    },
    invoices: invoices.map((inv) => ({
      ...inv,
      status: inv.status as InvoiceStatus,
      dueDate: inv.dueDate?.toISOString() || null,
      paidAt: inv.paidAt?.toISOString() || null,
      periodStart: inv.periodStart.toISOString(),
      periodEnd: inv.periodEnd.toISOString(),
    })),
    totalPaid,
    upgradeSuggestions,
  };
}
