import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { withWorkspace } from "@/lib/middleware/tenant";
import { requireRole, isValidRole } from "@/lib/rbac";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// GET — list workspace members
export async function GET() {
  return withWorkspace(async (userId, workspaceId) => {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return Response.json({
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        lastActiveAt: m.lastActiveAt,
        user: m.user,
      })),
    });
  });
}

// POST — invite member
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id! as string;
  const workspaceId = await resolveWorkspaceId(userId);
  await setWorkspaceContext(workspaceId);
  await requireFeature(workspaceId, "team_members");

  // Only admin+ can invite
  try {
    await requireRole(workspaceId, userId, "admin");
  } catch (error) {
    if (error instanceof Error && error.name === "PermissionError") {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return Response.json({ error: "Forbidden" }, { status: 403 });
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

    // Validate role — cannot invite as owner
    const inviteRole = role || "viewer";
    if (!isValidRole(inviteRole) || inviteRole === "owner") {
      return Response.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return Response.json(
        { error: "User not found with this email" },
        { status: 404 }
      );
    }

    // Cannot invite yourself
    if (targetUser.id === userId) {
      return Response.json(
        { error: "Cannot invite yourself" },
        { status: 400 }
      );
    }

    // Check if already a member
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId: targetUser.id },
      },
    });

    if (existing) {
      return Response.json(
        { error: "User is already a member of this workspace" },
        { status: 409 }
      );
    }

    // Create membership
    const member = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: targetUser.id,
        role: inviteRole,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Audit: member invited
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.MEMBER_INVITE,
      resourceType: "member",
      resourceId: member.id,
      metadata: { email, role: inviteRole, targetUserId: targetUser.id },
    });

    return Response.json({
      success: true,
      member: {
        id: member.id,
        userId: member.userId,
        role: member.role,
        createdAt: member.createdAt,
        user: member.user,
      },
    });
  } catch (error) {
    console.error("Member invite error:", error);
    return Response.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}
