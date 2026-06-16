import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createCheckoutSession, getStripePriceId, STRIPE_PRICES } from "@/lib/stripe";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

/**
 * POST /api/billing/checkout
 * Create a Stripe Checkout Session for subscription upgrade.
 *
 * Body: { plan: "pro" | "enterprise", interval: "month" | "year" }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id! as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    // Only admin+ can manage billing
    try {
      await requireRole(workspaceId, userId, "admin");
    } catch {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { plan, interval = "month" } = body;

    if (!plan || !["pro", "enterprise"].includes(plan)) {
      return Response.json(
        { error: "Invalid plan. Must be: pro, enterprise" },
        { status: 400 }
      );
    }

    if (!["month", "year"].includes(interval)) {
      return Response.json(
        { error: "Invalid interval. Must be: month, year" },
        { status: 400 }
      );
    }

    const priceId = getStripePriceId(plan, interval);
    if (!priceId) {
      return Response.json(
        { error: `Stripe price not configured for ${plan} ${interval}. Set STRIPE_PRICE_${plan.toUpperCase()}_${interval.toUpperCase()} in .env` },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3100";

    const checkoutSession = await createCheckoutSession({
      workspaceId,
      email: session.user.email || "",
      name: session.user.name || undefined,
      priceId,
      successUrl: `${baseUrl}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/settings/billing`,
    });

    // Audit: checkout session created
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.BILLING_CHECKOUT,
      resourceType: "checkout_session",
      resourceId: checkoutSession.id,
      metadata: { plan, interval, priceId },
    });

    return Response.json({
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/billing/checkout
 * Get available plans and their Stripe price IDs.
 */
export async function GET() {
  return Response.json({
    plans: [
      {
        name: "pro",
        displayName: "Pro",
        monthly: {
          priceId: STRIPE_PRICES.pro_monthly || "not_configured",
          price: 2900,
        },
        yearly: {
          priceId: STRIPE_PRICES.pro_yearly || "not_configured",
          price: 29000,
        },
      },
      {
        name: "enterprise",
        displayName: "Enterprise",
        monthly: {
          priceId: STRIPE_PRICES.enterprise_monthly || "not_configured",
          price: 9900,
        },
        yearly: {
          priceId: STRIPE_PRICES.enterprise_yearly || "not_configured",
          price: 99000,
        },
      },
    ],
  });
}
