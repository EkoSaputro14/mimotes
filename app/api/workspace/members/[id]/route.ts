import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { requireRole, isValidRole } from "@/lib/rbac";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH — change member role
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id! as string;
  const workspaceId = await resolveWorkspaceId(userId);
  await setWorkspaceContext(workspaceId);

  // Only admin+ can change roles
  try {
    await requireRole(workspaceId, userId, "admin");
  } catch (error) {
    if (error instanceof Error && error.name === "PermissionError") {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id: memberId } = await params;
    const body = await request.json();
    const { role } = body;

    if (!isValidRole(role) || role === "owner") {
      return Response.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    // Find the member
    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      select: { id: true, workspaceId: true, userId: true, role: true },
    });

    if (!member) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.workspaceId !== workspaceId) {
      return Response.json({ error: "Not in this workspace" }, { status: 403 });
    }

    // Cannot change owner's role
    if (member.role === "owner") {
      return Response.json(
        { error: "Cannot change the owner's role" },
        { status: 400 }
      );
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Audit: member role changed
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.MEMBER_ROLE_CHANGE,
      resourceType: "member",
      resourceId: memberId,
      metadata: { targetUserId: member.userId, fromRole: member.role, toRole: role },
    });

    return Response.json({
      success: true,
      member: {
        id: updated.id,
        userId: updated.userId,
        role: updated.role,
        user: updated.user,
      },
    });
  } catch (error) {
    console.error("Role update error:", error);
    return Response.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

// DELETE — remove member
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id! as string;
  const workspaceId = await resolveWorkspaceId(userId);
  await setWorkspaceContext(workspaceId);

  // Only admin+ can remove members
  try {
    await requireRole(workspaceId, userId, "admin");
  } catch (error) {
    if (error instanceof Error && error.name === "PermissionError") {
      return Response.json({ error: error.message }, { status: 403 });
    }
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id: memberId } = await params;

    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      select: { id: true, workspaceId: true, role: true, userId: true },
    });

    if (!member) {
      return Response.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.workspaceId !== workspaceId) {
      return Response.json({ error: "Not in this workspace" }, { status: 403 });
    }

    // Cannot remove the owner
    if (member.role === "owner") {
      return Response.json(
        { error: "Cannot remove the workspace owner" },
        { status: 400 }
      );
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    // Audit: member removed
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.MEMBER_REMOVE,
      resourceType: "member",
      resourceId: memberId,
      metadata: { targetUserId: member.userId, role: member.role },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Member remove error:", error);
    return Response.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
