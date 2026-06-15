import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { createPortalSession } from "@/lib/stripe";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

/**
 * POST /api/billing/portal
 * Create a Stripe Customer Portal session.
 *
 * Allows customer to: update payment method, cancel, view invoices
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

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3100";

    const portalSession = await createPortalSession({
      workspaceId,
      returnUrl: `${baseUrl}/settings/billing`,
    });

    // Audit: billing portal accessed
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.BILLING_PORTAL,
      resourceType: "billing_portal",
      resourceId: portalSession.id,
    });

    return Response.json({
      url: portalSession.url,
    });
  } catch (error) {
    console.error("Portal error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Portal creation failed" },
      { status: 500 }
    );
  }
}
