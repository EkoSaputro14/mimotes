import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// Helper: check if user is super admin
async function requireSuperAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (!user?.isSuperAdmin) {
    throw new Error("FORBIDDEN");
  }
}

// POST — suspend/unsuspend user (super admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminId = session.user.id as string;
    await requireSuperAdmin(adminId);

    const body = await request.json();
    const { targetUserId, action, reason } = body;

    if (!targetUserId || !action) {
      return Response.json(
        { error: "targetUserId and action are required" },
        { status: 400 }
      );
    }

    if (action !== "suspend" && action !== "unsuspend") {
      return Response.json(
        { error: "action must be 'suspend' or 'unsuspend'" },
        { status: 400 }
      );
    }

    // Prevent self-suspension
    if (targetUserId === adminId) {
      return Response.json(
        { error: "Cannot suspend yourself" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, isSuperAdmin: true, suspended: true },
    });

    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent suspending other super admins
    if (targetUser.isSuperAdmin && action === "suspend") {
      return Response.json(
        { error: "Cannot suspend another super admin" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (action === "suspend") {
      updateData.suspended = true;
      updateData.suspendedAt = new Date();
      updateData.suspendedReason = reason || null;
    } else {
      updateData.suspended = false;
      updateData.suspendedAt = null;
      updateData.suspendedReason = null;
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    // Audit log
    logAudit({
      workspaceId: "system",
      actorId: adminId,
      actorType: "user",
      action: action === "suspend" ? "admin.user_suspend" : "admin.user_unsuspend",
      resourceType: "user",
      resourceId: targetUserId,
      metadata: { reason: reason || null },
    });

    return Response.json({
      success: true,
      message: action === "suspend" ? "User suspended" : "User unsuspended",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ error: "Super admin access required" }, { status: 403 });
    }
    console.error("Suspend/unsuspend error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
