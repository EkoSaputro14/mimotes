import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// POST — revoke an invitation
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id! as string;
  const workspaceId = await resolveWorkspaceId(userId);
  await setWorkspaceContext(workspaceId);

  try {
    await requireRole(workspaceId, userId, "admin");
  } catch (error) {
    if (error instanceof Error && error.name === "PermissionError") {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const invitation = await prisma.workspaceInvitation.findFirst({
      where: { id, workspaceId },
    });

    if (!invitation) {
      return Response.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "pending") {
      return Response.json(
        { error: `Cannot revoke invitation with status "${invitation.status}"` },
        { status: 400 }
      );
    }

    await prisma.workspaceInvitation.update({
      where: { id },
      data: { status: "revoked" },
    });

    // Audit: invitation revoked
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.INVITATION_REVOKED,
      resourceType: "invitation",
      resourceId: id,
      metadata: { email: invitation.email, role: invitation.role },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Invitation revoke error:", error);
    return Response.json(
      { error: "Failed to revoke invitation" },
      { status: 500 }
    );
  }
}
