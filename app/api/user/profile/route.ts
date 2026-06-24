import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// GET — current user profile
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        suspended: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error("Get profile error:", error);
    return Response.json({ error: "Failed to get profile" }, { status: 500 });
  }
}

// PATCH — update user profile (name only for now)
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const body = await request.json();
    const { name } = body;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return Response.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
      }
      if (name.length > 100) {
        return Response.json({ error: "Nama maksimal 100 karakter" }, { status: 400 });
      }
    }

    const updateData: Record<string, string | null> = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: "Tidak ada field yang diupdate" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, updatedAt: true },
    });

    // Audit
    logAudit({
      workspaceId: "system",
      actorId: userId,
      actorType: "user",
      action: "user.profile_update",
      resourceType: "user",
      resourceId: userId,
      metadata: { fields: Object.keys(updateData) },
    });

    return Response.json({ user: updated });
  } catch (error) {
    console.error("Update profile error:", error);
    return Response.json({ error: "Gagal update profil" }, { status: 500 });
  }
}
