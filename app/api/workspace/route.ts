import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { withWorkspace } from "@/lib/middleware/tenant";
import { requireRole } from "@/lib/rbac";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// GET — current workspace + members
export async function GET() {
  return withWorkspace(async (userId, workspaceId) => {
    // Update current user's lastActiveAt
    try {
      await prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId } },
        data: { lastActiveAt: new Date() },
      });
    } catch {
      // Non-critical — ignore if update fails
    }

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
        description: workspace.description,
        avatarUrl: workspace.avatarUrl,
        createdAt: workspace.createdAt,
      },
      members: workspace.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        createdAt: m.createdAt,
        lastActiveAt: m.lastActiveAt,
        user: m.user,
      })),
      memberCount: workspace.members.length,
      currentUserId: userId,
      currentUserRole: workspace.members.find((m) => m.userId === userId)?.role ?? null,
    });
  });
}

// PATCH — update workspace name, description, and avatarUrl
export async function PATCH(request: NextRequest) {
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
    const body = await request.json();
    const { name, description, avatarUrl } = body;

    // Build update data — only include fields that are provided
    const updateData: Record<string, string | null> = {};
    let hasChanges = false;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
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
      updateData.name = name.trim();
      hasChanges = true;
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
        return Response.json(
          { error: "Description must be a string" },
          { status: 400 }
        );
      }
      if (description && description.length > 500) {
        return Response.json(
          { error: "Description must be 500 characters or less" },
          { status: 400 }
        );
      }
      updateData.description = description?.trim() || null;
      hasChanges = true;
    }

    if (avatarUrl !== undefined) {
      if (avatarUrl !== null && typeof avatarUrl !== "string") {
        return Response.json(
          { error: "Avatar URL must be a string" },
          { status: 400 }
        );
      }
      updateData.avatarUrl = avatarUrl?.trim() || null;
      hasChanges = true;
    }

    if (!hasChanges) {
      return Response.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: updateData,
      select: { id: true, name: true, slug: true, description: true, avatarUrl: true, updatedAt: true },
    });

    // Audit: workspace updated
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.WORKSPACE_UPDATE,
      resourceType: "workspace",
      resourceId: workspaceId,
      metadata: updateData,
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
