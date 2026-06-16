import { NextRequest } from "next/server";
import { getConversationsByVisitor, buildWidgetCorsHeaders, getWidgetByPublicKey, validateWidgetOrigin } from "@/lib/widget";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/widget/conversations?publicKey=xxx&visitorId=xxx
 * Returns list of conversations for a visitor.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const publicKey = url.searchParams.get("publicKey");
    const visitorId = url.searchParams.get("visitorId");

    if (!publicKey || !visitorId) {
      return Response.json(
        { error: { code: "invalid_request", message: "publicKey and visitorId are required" } },
        { status: 400 }
      );
    }

    // ── Validate widget ──
    const widget = await getWidgetByPublicKey(publicKey);
    if (!widget) {
      return Response.json(
        { error: { code: "not_found", message: "Widget not found" } },
        { status: 404 }
      );
    }

    // ── Origin validation ──
    const origin = request.headers.get("origin");
    const widgetFull = await prisma.widget.findUnique({ where: { id: widget.id } });
    const allowedDomains: string[] = widgetFull?.allowedDomains || [];
    if (widgetFull && !validateWidgetOrigin(origin, widgetFull.allowedDomains)) {
      return Response.json(
        { error: { code: "origin_denied", message: "Origin not allowed" } },
        { status: 403 }
      );
    }

    // ── Fetch conversations ──
    const conversations = await getConversationsByVisitor(publicKey, visitorId);

    const corsHeaders = buildWidgetCorsHeaders(origin, allowedDomains);

    return Response.json({ conversations }, { headers: corsHeaders });
  } catch (error) {
    console.error("[Widget Conversations] Error:", error);
    return Response.json(
      { error: { code: "internal_error", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
