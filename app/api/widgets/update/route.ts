import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { setWorkspaceContext, resolveWorkspaceId } from "@/lib/prisma";
import { updateWidget } from "@/lib/widget";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

/**
 * PUT /api/widgets/update
 * Update widget settings (session auth).
 * Body: { widgetId, ...updates }
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id!);
    await setWorkspaceContext(workspaceId);

    const body = await request.json();
    const { widgetId, ...updates } = body;

    if (!widgetId) {
      return Response.json({ error: "widgetId is required" }, { status: 400 });
    }

    await updateWidget(workspaceId, widgetId, updates);

    await logAudit({
      workspaceId,
      actorId: session.user.id!,
      actorType: "user",
      action: AUDIT_ACTIONS.WIDGET_UPDATE,
      resourceType: "widget",
      resourceId: widgetId,
      metadata: { updates: Object.keys(updates) },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[Widgets] Update error:", error);
    return Response.json({ error: "Failed to update widget" }, { status: 500 });
  }
}
