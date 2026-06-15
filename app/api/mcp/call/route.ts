import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { prisma, resolveWorkspaceId } from "@/lib/prisma";
import { getMCPManager } from "@/lib/mcp/manager";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { toolName, args, serverId } = body;

    if (!toolName) {
      return Response.json(
        { error: "toolName is required" },
        { status: 400 }
      );
    }

    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await requireFeature(workspaceId, "mcp");

    // If serverId is provided, verify ownership before calling tool
    if (serverId) {
      const server = await prisma.mcpServer.findFirst({
        where: { id: serverId, userId: session.user.id! as string },
      });

      if (!server) {
        return Response.json(
          { error: "Server not found or access denied" },
          { status: 404 }
        );
      }
    }

    const manager = getMCPManager();

    // Get all tools from user's own servers
    const allTools = manager.getAllTools();
    const userServerIds = (
      await prisma.mcpServer.findMany({
        where: { userId: session.user.id! as string },
        select: { id: true },
      })
    ).map((s) => s.id);

    // Verify the tool belongs to a server the user owns
    const tool = allTools.find((t) => t.name === toolName);
    if (tool && !userServerIds.includes(tool.serverId)) {
      return Response.json(
        { error: "Access denied: tool belongs to another user's server" },
        { status: 403 }
      );
    }

    const result = await manager.callTool(toolName, args || {});

    return Response.json(result);
  } catch (error) {
    console.error("MCP tool call error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to call MCP tool" },
      { status: 500 }
    );
  }
}
