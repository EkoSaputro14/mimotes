import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

// POST — delete workspace (owner only, cascades to all data)
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    // Only owner can delete
    try {
      await requireRole(workspaceId, userId, "owner");
    } catch {
      return Response.json(
        { error: "Hanya pemilik workspace yang dapat menghapus" },
        { status: 403 }
      );
    }

    // Check member count — warn if multiple members
    const memberCount = await prisma.workspaceMember.count({
      where: { workspaceId },
    });

    // Audit before delete
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: "workspace.delete",
      resourceType: "workspace",
      resourceId: workspaceId,
      metadata: { memberCount, deletedBy: userId },
    });

    // Delete workspace (cascades via schema:onDelete: Cascade)
    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return Response.json({
      success: true,
      message: "Workspace berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete workspace error:", error);
    return Response.json(
      { error: "Gagal menghapus workspace" },
      { status: 500 }
    );
  }
}
