import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { withWorkspace } from "@/lib/middleware/tenant";
import {
  getBillingSummary,
  changePlan,
  cancelSubscription,
  PLAN_PRICING,
} from "@/lib/billing";
import { requireRole } from "@/lib/rbac";
import { resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// GET — billing summary for workspace
export async function GET() {
  return withWorkspace(async (userId, workspaceId) => {
    const summary = await getBillingSummary(workspaceId);
    return Response.json(summary);
  });
}

// POST — change plan or cancel subscription
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id! as string;
  const workspaceId = await resolveWorkspaceId(userId);
  await setWorkspaceContext(workspaceId);

  // Only owner/admin can manage billing
  try {
    await requireRole(workspaceId, userId, "admin");
  } catch {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, plan, reason } = body;

    if (action === "change_plan") {
      if (!plan || !PLAN_PRICING[plan]) {
        return Response.json(
          { error: "Invalid plan. Must be: free, pro, enterprise" },
          { status: 400 }
        );
      }

      const updated = await changePlan(workspaceId, plan, {
        reason: reason || "User requested plan change",
        metadata: { initiatedBy: userId },
      });

      // Audit: plan changed
      logAudit({
        workspaceId,
        actorId: userId,
        actorType: "user",
        action: AUDIT_ACTIONS.BILLING_PLAN_CHANGE,
        resourceType: "subscription",
        metadata: { plan, reason },
      });

      return Response.json({
        success: true,
        subscription: {
          plan: updated.plan.displayName,
          status: updated.status,
        },
      });
    }

    if (action === "cancel") {
      const updated = await cancelSubscription(workspaceId, {
        reason: reason || "User requested cancellation",
        metadata: { initiatedBy: userId },
      });

      // Audit: subscription canceled
      logAudit({
        workspaceId,
        actorId: userId,
        actorType: "user",
        action: AUDIT_ACTIONS.BILLING_CANCEL,
        resourceType: "subscription",
        metadata: { reason },
      });

      return Response.json({
        success: true,
        subscription: {
          plan: updated.plan.displayName,
          status: updated.status,
        },
      });
    }

    return Response.json(
      { error: "Invalid action. Must be: change_plan or cancel" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Billing action error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Billing action failed" },
      { status: 500 }
    );
  }
}
