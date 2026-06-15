import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { generateInvitationToken, getExpiresAt } from "@/lib/invitations";

// POST — resend an invitation (generates new token)
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

    if (invitation.status === "accepted") {
      return Response.json(
        { error: "Cannot resend an already accepted invitation" },
        { status: 400 }
      );
    }

    if (invitation.status === "revoked") {
      return Response.json(
        { error: "Cannot resend a revoked invitation" },
        { status: 400 }
      );
    }

    // Generate new token
    const { rawToken, tokenHash, tokenPrefix } = generateInvitationToken();
    const expiresAt = getExpiresAt();

    await prisma.workspaceInvitation.update({
      where: { id },
      data: {
        token: tokenHash,
        tokenPrefix,
        expiresAt,
        status: "pending",
      },
    });

    // Audit: invitation resent
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.INVITATION_RESENT,
      resourceType: "invitation",
      resourceId: id,
      metadata: { email: invitation.email, role: invitation.role },
    });

    return Response.json({
      success: true,
      invitation: {
        id,
        tokenPrefix,
        expiresAt,
        // NOTE: Email system not implemented — returning raw token for manual sharing
        rawToken,
      },
    });
  } catch (error) {
    console.error("Invitation resend error:", error);
    return Response.json(
      { error: "Failed to resend invitation" },
      { status: 500 }
    );
  }
}
