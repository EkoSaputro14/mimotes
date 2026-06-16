import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

// POST — transfer ownership to another member
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    // Only owner can transfer
    try {
      await requireRole(workspaceId, userId, "owner");
    } catch {
      return Response.json(
        { error: "Hanya pemilik workspace yang dapat transfer kepemilikan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return Response.json(
        { error: "Target user ID diperlukan" },
        { status: 400 }
      );
    }

    if (targetUserId === userId) {
      return Response.json(
        { error: "Tidak dapat transfer ke diri sendiri" },
        { status: 400 }
      );
    }

    // Verify target is a member
    const targetMember = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
    });

    if (!targetMember) {
      return Response.json(
        { error: "Target bukan anggota workspace ini" },
        { status: 404 }
      );
    }

    // Transfer: current owner → admin, target → owner
    await prisma.$transaction([
      prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId } },
        data: { role: "admin" },
      }),
      prisma.workspaceMember.update({
        where: { workspaceId_userId: { workspaceId, userId: targetUserId } },
        data: { role: "owner" },
      }),
    ]);

    // Audit
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: "workspace.transfer_ownership",
      resourceType: "workspace",
      resourceId: workspaceId,
      metadata: { from: userId, to: targetUserId },
    });

    return Response.json({
      success: true,
      message: "Kepemilikan workspace berhasil ditransfer",
    });
  } catch (error) {
    console.error("Transfer ownership error:", error);
    return Response.json(
      { error: "Gagal transfer kepemilikan" },
      { status: 500 }
    );
  }
}
