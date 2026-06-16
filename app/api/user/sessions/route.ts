import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — login history from audit logs
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;

    // Get login/logout events from audit logs
    const events = await prisma.auditLog.findMany({
      where: {
        actorId: userId,
        action: {
          in: ["auth.login", "auth.logout", "auth.login_failed", "user.password_change"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        action: true,
        createdAt: true,
        ipAddress: true,
        userAgent: true,
        metadata: true,
      },
    });

    return Response.json({ events });
  } catch (error) {
    console.error("Get sessions error:", error);
    return Response.json({ error: "Gagal mengambil riwayat sesi" }, { status: 500 });
  }
}
