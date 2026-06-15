import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { resolveWorkspaceId } from "@/lib/prisma";
import { getMCPManager } from "@/lib/mcp/manager";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await requireFeature(workspaceId, "mcp");
    const manager = getMCPManager();
    const tools = manager.getAllTools();

    return Response.json({ tools });
  } catch (error) {
    console.error("MCP tools list error:", error);
    return Response.json(
      { error: "Failed to list MCP tools" },
      { status: 500 }
    );
  }
}
