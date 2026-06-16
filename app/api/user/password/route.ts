import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// POST — change password
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return Response.json(
        { error: "Password saat ini dan password baru diperlukan" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { error: "Password baru minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      return Response.json(
        { error: "Password saat ini salah" },
        { status: 400 }
      );
    }

    // Check new password is different
    const isNewSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isNewSame) {
      return Response.json(
        { error: "Password baru harus berbeda dari password saat ini" },
        { status: 400 }
      );
    }

    // Hash and update
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Audit — password change invalidates all existing JWTs
    logAudit({
      workspaceId: "system",
      actorId: userId,
      actorType: "user",
      action: "user.password_change",
      resourceType: "user",
      resourceId: userId,
      metadata: { note: "All existing sessions invalidated" },
    });

    return Response.json({
      success: true,
      message: "Password berhasil diubah. Semua sesi aktif akan logout.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return Response.json({ error: "Gagal mengubah password" }, { status: 500 });
  }
}
