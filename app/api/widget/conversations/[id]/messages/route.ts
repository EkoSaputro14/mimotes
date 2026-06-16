import { NextRequest } from "next/server";
import { getConversationMessages, getWidgetByPublicKey, validateWidgetOrigin, buildWidgetCorsHeaders } from "@/lib/widget";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/widget/conversations/[id]/messages?publicKey=xxx
 * Returns messages for a conversation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const url = new URL(request.url);
    const publicKey = url.searchParams.get("publicKey");

    if (!publicKey) {
      return Response.json(
        { error: { code: "invalid_request", message: "publicKey is required" } },
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

    // ── Fetch messages ──
    const messages = await getConversationMessages(conversationId, publicKey);

    if (messages === null) {
      return Response.json(
        { error: { code: "not_found", message: "Conversation not found" } },
        { status: 404 }
      );
    }

    const corsHeaders = buildWidgetCorsHeaders(origin, allowedDomains);

    return Response.json({ messages }, { headers: corsHeaders });
  } catch (error) {
    console.error("[Widget Messages] Error:", error);
    return Response.json(
      { error: { code: "internal_error", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
