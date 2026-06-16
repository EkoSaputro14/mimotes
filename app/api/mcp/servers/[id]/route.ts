import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { prisma, resolveWorkspaceId } from "@/lib/prisma";
import { getMCPManager } from "@/lib/mcp/manager";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await requireFeature(workspaceId, "mcp");
    // Ownership check: only return user's own server
    const server = await prisma.mcpServer.findFirst({
      where: { id, userId: session.user.id! as string },
    });

    if (!server) {
      return Response.json({ error: "Server not found" }, { status: 404 });
    }

    const manager = getMCPManager();
    const connection = manager.getAllTools().filter((t) => t.serverId === id);

    return Response.json({
      server: {
        ...server,
        connectedTools: connection,
      },
    });
  } catch (error) {
    console.error("MCP server get error:", error);
    return Response.json(
      { error: "Failed to get MCP server" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await requireFeature(workspaceId, "mcp");
    const body = await request.json();
    const { name, url, apiKey, isActive } = body;

    // Ownership check: only update user's own server
    const existing = await prisma.mcpServer.findFirst({
      where: { id, userId: session.user.id! as string },
    });

    if (!existing) {
      return Response.json({ error: "Server not found" }, { status: 404 });
    }

    const manager = getMCPManager();

    if (isActive === false && existing.isActive) {
      await manager.disconnectServer(id);
    }

    const server = await prisma.mcpServer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(apiKey !== undefined && { apiKey: apiKey || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    if (isActive && !existing.isActive) {
      try {
        await manager.connectServer(id);
      } catch {
        // Connection can fail
      }
    } else if (isActive && (url !== existing.url || apiKey !== existing.apiKey)) {
      await manager.disconnectServer(id);
      try {
        await manager.connectServer(id);
      } catch {
        // Connection can fail
      }
    }

    // Audit: MCP server updated
    logAudit({
      workspaceId,
      actorId: session.user.id! as string,
      actorType: "user",
      action: AUDIT_ACTIONS.MCP_SERVER_UPDATE,
      resourceType: "mcp_server",
      resourceId: id,
      metadata: { name: server.name, url: server.url, isActive: server.isActive },
    });

    return Response.json({ server });
  } catch (error) {
    console.error("MCP server update error:", error);
    return Response.json(
      { error: "Failed to update MCP server" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await requireFeature(workspaceId, "mcp");
    // Ownership check: only delete user's own server
    const existing = await prisma.mcpServer.findFirst({
      where: { id, userId: session.user.id! as string },
    });

    if (!existing) {
      return Response.json({ error: "Server not found" }, { status: 404 });
    }

    const manager = getMCPManager();
    await manager.disconnectServer(id);

    await prisma.mcpServer.delete({
      where: { id },
    });

    // Audit: MCP server removed
    logAudit({
      workspaceId,
      actorId: session.user.id! as string,
      actorType: "user",
      action: AUDIT_ACTIONS.MCP_SERVER_REMOVE,
      resourceType: "mcp_server",
      resourceId: id,
      metadata: { name: existing.name, url: existing.url },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("MCP server delete error:", error);
    return Response.json(
      { error: "Failed to delete MCP server" },
      { status: 500 }
    );
  }
}
