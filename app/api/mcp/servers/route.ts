import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { prisma, resolveWorkspaceId } from "@/lib/prisma";
import { getMCPManager } from "@/lib/mcp/manager";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await requireFeature(workspaceId, "mcp");

    // Only return the user's own MCP servers
    const servers = await prisma.mcpServer.findMany({
      where: { userId: session.user.id! as string },
      orderBy: { createdAt: "desc" },
    });

    const manager = getMCPManager();
    const statuses = await manager.getStatus();

    const serversWithStatus = servers.map((server) => {
      const status = statuses.find((s) => s.id === server.id);
      return {
        ...server,
        connected: status?.connected || false,
        toolCount: status?.tools.length || 0,
      };
    });

    return Response.json({ servers: serversWithStatus });
  } catch (error) {
    console.error("MCP servers list error:", error);
    return Response.json(
      { error: "Failed to list MCP servers" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id! as string;
    const workspaceId = await resolveWorkspaceId(userId);
    await requireFeature(workspaceId, "mcp");

    const body = await request.json();
    const { name, url, apiKey, isActive } = body;

    if (!name || !url) {
      return Response.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    const server = await prisma.mcpServer.create({
      data: {
        name,
        url,
        apiKey: apiKey || null,
        isActive: isActive !== false,
        userId,
        workspaceId,
      },
    });

    if (server.isActive) {
      const manager = getMCPManager();
      try {
        await manager.connectServer(server.id);
      } catch {
        // Connection can fail, server is still saved
      }
    }

    // Audit: MCP server added
    logAudit({
      workspaceId,
      actorId: userId,
      actorType: "user",
      action: AUDIT_ACTIONS.MCP_SERVER_ADD,
      resourceType: "mcp_server",
      resourceId: server.id,
      metadata: { name, url },
    });

    return Response.json({ server }, { status: 201 });
  } catch (error) {
    console.error("MCP server create error:", error);
    return Response.json(
      { error: "Failed to create MCP server" },
      { status: 500 }
    );
  }
}
