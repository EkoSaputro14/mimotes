import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    // Find the member record
    const member = await prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });

    if (!member) {
      return Response.json({ error: "Anda bukan anggota workspace ini" }, { status: 404 });
    }

    // Owner cannot leave — must transfer ownership first
    if (member.role === "owner") {
      return Response.json(
        { error: "Pemilik workspace tidak dapat keluar. Transfer kepemilikan terlebih dahulu." },
        { status: 400 }
      );
    }

    // Remove membership
    await prisma.workspaceMember.delete({
      where: { id: member.id },
    });

    // Audit
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.MEMBER_REMOVE,
      resourceType: "workspace_member",
      resourceId: member.id,
      metadata: { action: "self_remove", role: member.role },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Leave workspace error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat keluar dari workspace" },
      { status: 500 }
    );
  }
}
