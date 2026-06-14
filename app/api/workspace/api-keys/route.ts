import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { generateApiKey, hashApiKey } from "@/lib/api-keys";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// GET — list API keys for current workspace
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    const keys = await prisma.apiKey.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ keys });
  } catch (error) {
    console.error("List API keys error:", error);
    return Response.json({ error: "Gagal mengambil API keys" }, { status: 500 });
  }
}

// POST — create a new API key
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    const body = await request.json();
    const { name, expiresInDays } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Nama API key diperlukan" }, { status: 400 });
    }

    if (name.length > 100) {
      return Response.json({ error: "Nama maksimal 100 karakter" }, { status: 400 });
    }

    const { rawKey, keyHash, keyPrefix } = generateApiKey();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const key = await prisma.apiKey.create({
      data: {
        workspaceId,
        name: name.trim(),
        keyHash,
        keyPrefix,
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.API_KEY_CREATE,
      resourceType: "api_key",
      resourceId: key.id,
      metadata: { name: name.trim(), keyPrefix },
    });

    return Response.json({
      key: { ...key, rawKey },
      message: "Simpan key ini — tidak akan ditampilkan lagi.",
    });
  } catch (error) {
    console.error("Create API key error:", error);
    return Response.json({ error: "Gagal membuat API key" }, { status: 500 });
  }
}

// DELETE — revoke an API key
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");
    if (!keyId) {
      return Response.json({ error: "Key ID diperlukan" }, { status: 400 });
    }

    // Verify key belongs to workspace
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, workspaceId },
    });

    if (!key) {
      return Response.json({ error: "API key tidak ditemukan" }, { status: 404 });
    }

    // Soft delete (deactivate)
    await prisma.apiKey.update({
      where: { id: keyId },
      data: { isActive: false },
    });

    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.API_KEY_REVOKE,
      resourceType: "api_key",
      resourceId: keyId,
      metadata: { name: key.name },
    });

    return Response.json({ success: true, message: "API key berhasil direvoke" });
  } catch (error) {
    console.error("Revoke API key error:", error);
    return Response.json({ error: "Gagal revoke API key" }, { status: 500 });
  }
}
