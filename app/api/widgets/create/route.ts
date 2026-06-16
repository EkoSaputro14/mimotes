import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { setWorkspaceContext, resolveWorkspaceId, prisma } from "@/lib/prisma";
import { createWidget, getWidgetBySlug } from "@/lib/widget";
import { hasFeature } from "@/lib/entitlements";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

/**
 * POST /api/widgets/create
 * Create a new widget (session auth).
 * Body: { name: string, slug: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id!);
    await setWorkspaceContext(workspaceId);

    // Feature gate
    const hasWidgetFeature = await hasFeature(workspaceId, "public_widget");
    if (!hasWidgetFeature) {
      return Response.json(
        { error: "Public Widget feature not available on your plan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name || !slug) {
      return Response.json({ error: "name and slug are required" }, { status: 400 });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return Response.json(
        { error: "slug must be lowercase alphanumeric with hyphens" },
        { status: 400 }
      );
    }

    const existing = await getWidgetBySlug(slug);
    if (existing) {
      return Response.json({ error: "Slug already taken" }, { status: 409 });
    }

    const widget = await createWidget(workspaceId, name, slug);

    await logAudit({
      workspaceId,
      actorId: session.user.id!,
      actorType: "user",
      action: AUDIT_ACTIONS.WIDGET_CREATE,
      resourceType: "widget",
      resourceId: widget.id,
      metadata: { name, slug },
    });

    return Response.json({
      widget: {
        id: widget.id,
        name: widget.name,
        slug: widget.slug,
        publicKey: widget.publicKey,
        secretKey: widget.secretKey,
      },
    });
  } catch (error) {
    console.error("[Widgets] Create error:", error);
    return Response.json({ error: "Failed to create widget" }, { status: 500 });
  }
}
