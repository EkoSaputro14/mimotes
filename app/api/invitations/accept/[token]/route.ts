import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hashToken, verifyInvitationToken, isTokenExpired } from "@/lib/invitations";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// POST — accept an invitation using raw token
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id! as string;
  try {
    const { token: rawToken } = await params;

    if (!rawToken || typeof rawToken !== "string" || rawToken.length === 0) {
      return Response.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Hash the raw token to look up in DB
    const tokenHash = hashToken(rawToken);

    const invitation = await prisma.workspaceInvitation.findFirst({
      where: { token: tokenHash },
    });

    if (!invitation) {
      return Response.json(
        { error: "Invalid invitation token" },
        { status: 404 }
      );
    }

    // Verify token using timing-safe comparison
    if (!verifyInvitationToken(rawToken, invitation.token)) {
      return Response.json(
        { error: "Invalid invitation token" },
        { status: 401 }
      );
    }

    // Check status
    if (invitation.status !== "pending") {
      if (invitation.status === "accepted") {
        return Response.json(
          { error: "This invitation has already been accepted" },
          { status: 400 }
        );
      }
      if (invitation.status === "revoked") {
        return Response.json(
          { error: "This invitation has been revoked" },
          { status: 400 }
        );
      }
      return Response.json(
        { error: `Invitation is ${invitation.status}` },
        { status: 400 }
      );
    }

    // Check expiration
    if (isTokenExpired(invitation.expiresAt)) {
      await prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "expired" },
      });

      return Response.json(
        { error: "Invitation token has expired" },
        { status: 400 }
      );
    }

    // Verify email matches
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return Response.json(
        { error: "This invitation was sent to a different email address" },
        { status: 403 }
      );
    }

    // Check if already a member (replay prevention)
    const existingMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invitation.workspaceId,
          userId,
        },
      },
    });

    if (existingMember) {
      return Response.json(
        { error: "You are already a member of this workspace" },
        { status: 409 }
      );
    }

    // Create membership
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
      },
    });

    // Mark invitation as accepted
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "accepted",
        acceptedAt: new Date(),
      },
    });

    // Get workspace info
    const workspace = await prisma.workspace.findUnique({
      where: { id: invitation.workspaceId },
      select: { id: true, name: true, slug: true },
    });

    // Audit: invitation accepted
    logAudit({
      workspaceId: invitation.workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.INVITATION_ACCEPTED,
      resourceType: "invitation",
      resourceId: invitation.id,
      metadata: {
        email: invitation.email,
        role: invitation.role,
        memberId: member.id,
      },
    });

    return Response.json({
      success: true,
      workspace,
    });
  } catch (error) {
    console.error("Invitation accept error:", error);
    return Response.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
