import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { withWorkspace } from "@/lib/middleware/tenant";
import { requireRole } from "@/lib/rbac";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// GET — current workspace + members
export async function GET() {
  return withWorkspace(async (userId, workspaceId) => {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!workspace) {
      return Response.json({ error: "Workspace not found" }, { status: 404 });
    }

    return Response.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        createdAt: workspace.createdAt,
      },
      members: workspace.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        user: m.user,
      })),
      memberCount: workspace.members.length,
      currentUserId: userId,
      currentUserRole: workspace.members.find((m) => m.userId === userId)?.role ?? null,
    });
  });
}

// PATCH — update workspace name
export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;
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
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    if (name.length > 200) {
      return Response.json(
        { error: "Workspace name must be 200 characters or less" },
        { status: 400 }
      );
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: name.trim() },
      select: { id: true, name: true, slug: true, updatedAt: true },
    });

    // Audit: workspace updated
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.WORKSPACE_UPDATE,
      resourceType: "workspace",
      resourceId: workspaceId,
      metadata: { name: name.trim() },
    });

    return Response.json({ success: true, workspace: updated });
  } catch (error) {
    console.error("Workspace update error:", error);
    return Response.json(
      { error: "Failed to update workspace" },
      { status: 500 }
    );
  }
}
