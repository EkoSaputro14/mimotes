import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { resolveWorkspaceId } from "@/lib/prisma";
import { getMCPManager } from "@/lib/mcp/manager";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await requireFeature(workspaceId, "mcp");
    const manager = getMCPManager();
    const statuses = await manager.connectAll();

    // Audit: MCP connect all
    logAudit({
      workspaceId,
      actorId: session.user.id! as string,
      actorType: "user",
      action: AUDIT_ACTIONS.MCP_CONNECT,
      resourceType: "mcp",
      metadata: { serverCount: statuses.length },
    });

    return Response.json({ servers: statuses });
  } catch (error) {
    console.error("MCP connect error:", error);
    return Response.json(
      { error: "Failed to connect MCP servers" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await requireFeature(workspaceId, "mcp");
    const manager = getMCPManager();
    await manager.disconnectAll();

    // Audit: MCP disconnect all
    logAudit({
      workspaceId,
      actorId: session.user.id! as string,
      actorType: "user",
      action: AUDIT_ACTIONS.MCP_DISCONNECT,
      resourceType: "mcp",
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("MCP disconnect error:", error);
    return Response.json(
      { error: "Failed to disconnect MCP servers" },
      { status: 500 }
    );
  }
}
