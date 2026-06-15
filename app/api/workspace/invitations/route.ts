import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withWorkspace } from "@/lib/middleware/tenant";
import { requireRole } from "@/lib/rbac";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import { generateInvitationToken, getExpiresAt } from "@/lib/invitations";
import { loadEmailConfig } from "@/lib/email";
import { sendEmail } from "@/lib/email";
import { invitationEmailHtml, invitationEmailText } from "@/lib/email/templates";
import {
  checkEndpointRateLimit,
  getRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/endpoint-ratelimit";

// GET — list pending invitations
export async function GET() {
  return withWorkspace(async (userId, workspaceId) => {
    try {
      await requireRole(workspaceId, userId, "admin");
    } catch (error) {
      if (error instanceof Error && error.name === "PermissionError") {
        return Response.json({ error: error.message }, { status: 403 });
      }
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const invitations = await prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        tokenPrefix: inv.tokenPrefix,
        status: inv.status,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        invitedBy: inv.invitedBy,
        createdAt: inv.createdAt,
      })),
    });
  });
}

// POST — create invitation
export async function POST(request: NextRequest) {
  return withWorkspace(async (userId, workspaceId) => {
    try {
      await requireRole(workspaceId, userId, "admin");
    } catch (error) {
      if (error instanceof Error && error.name === "PermissionError") {
        return Response.json({ error: error.message }, { status: 403 });
      }
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limit: 20 invitations per hour per workspace
    const rlResult = checkEndpointRateLimit(workspaceId, RATE_LIMIT_CONFIGS.invitationCreate);
    if (!rlResult.allowed) {
      return Response.json(
        { error: "Terlalu banyak undangan. Silakan coba lagi nanti." },
        {
          status: 429,
          headers: getRateLimitHeaders(rlResult, RATE_LIMIT_CONFIGS.invitationCreate),
        }
      );
    }

    try {
      const body = await request.json();
      const { email, role } = body;

      if (!email || typeof email !== "string") {
        return Response.json(
          { error: "Email is required" },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return Response.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }

      const inviteRole = role || "viewer";
      const validRoles = ["admin", "editor", "viewer"];
      if (!validRoles.includes(inviteRole)) {
        return Response.json(
          { error: "Invalid role. Must be admin, editor, or viewer" },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if email belongs to the inviter
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (currentUser?.email.toLowerCase() === normalizedEmail) {
        return Response.json(
          { error: "Cannot invite yourself" },
          { status: 400 }
        );
      }

      // Check if email user already exists and is already a member
      const targetUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      if (targetUser) {
        const existingMember = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: { workspaceId, userId: targetUser.id },
          },
        });

        if (existingMember) {
          return Response.json(
            { error: "User is already a member of this workspace" },
            { status: 409 }
          );
        }
      }

      // Check for duplicate pending invitation
      const existingInvite = await prisma.workspaceInvitation.findFirst({
        where: {
          workspaceId,
          email: normalizedEmail,
          status: "pending",
        },
      });

      if (existingInvite) {
        return Response.json(
          { error: "A pending invitation already exists for this email" },
          { status: 409 }
        );
      }

      // Generate token
      const { rawToken, tokenHash, tokenPrefix } = generateInvitationToken();
      const expiresAt = getExpiresAt();

      // Create invitation
      const invitation = await prisma.workspaceInvitation.create({
        data: {
          workspaceId,
          email: normalizedEmail,
          role: inviteRole,
          token: tokenHash,
          tokenPrefix,
          invitedById: userId,
          status: "pending",
          expiresAt,
        },
      });

      // Audit: invitation created
      logAudit({
        workspaceId,
        actorId: userId,
        actorType: "user",
        action: AUDIT_ACTIONS.INVITATION_CREATED,
        resourceType: "invitation",
        resourceId: invitation.id,
        metadata: { email: normalizedEmail, role: inviteRole },
      });

      // Send invitation email (non-blocking)
      const emailConfig = loadEmailConfig();
      const acceptUrl = `${emailConfig.baseUrl}/invite/${rawToken}`;

      // Get workspace name for email
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { name: true },
      });

      // Get inviter info for email
      const inviter = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      // Send email (don't block the response)
      sendEmail(
        {
          from: { email: emailConfig.fromEmail, name: emailConfig.fromName },
          to: [{ email: normalizedEmail }],
          subject: `Undangan ke ${workspace?.name ?? "Workspace"} di MimoNotes`,
          html: invitationEmailHtml({
            inviterName: inviter?.name ?? inviter?.email ?? "Someone",
            inviterEmail: inviter?.email ?? "",
            workspaceName: workspace?.name ?? "Workspace",
            role: inviteRole,
            acceptUrl,
            expiresAt,
          }),
          text: invitationEmailText({
            inviterName: inviter?.name ?? inviter?.email ?? "Someone",
            inviterEmail: inviter?.email ?? "",
            workspaceName: workspace?.name ?? "Workspace",
            role: inviteRole,
            acceptUrl,
            expiresAt,
          }),
          tags: [
            { name: "category", value: "invitation" },
            { name: "workspace", value: workspaceId },
          ],
        },
        { workspaceId, actorId: userId }
      ).catch((err) => {
        console.error("[Email] Failed to send invitation email:", err);
      });

      return Response.json({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          tokenPrefix: invitation.tokenPrefix,
          expiresAt: invitation.expiresAt,
          // NOTE: Email system not implemented — returning raw token for manual sharing
          rawToken,
        },
      });
    } catch (error) {
      console.error("Invitation create error:", error);
      return Response.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      );
    }
  });
}
