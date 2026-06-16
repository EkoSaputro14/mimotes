import { NextRequest } from "next/server";
import { getWidgetByPublicKey, buildWidgetCorsHeaders } from "@/lib/widget";

/**
 * GET /api/widget/config?publicKey=xxx
 * Get widget configuration (public, no auth required).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const publicKey = searchParams.get("publicKey");
  const origin = request.headers.get("origin");

  if (!publicKey) {
    return Response.json(
      { error: { code: "invalid_request", message: "publicKey is required" } },
      { status: 400 }
    );
  }

  const widget = await getWidgetByPublicKey(publicKey);
  if (!widget) {
    return Response.json({ error: { code: "not_found", message: "Widget not found or inactive" } }, { status: 404 });
  }

  // Build CORS headers with origin validation (NEVER wildcard)
  const allowedDomains: string[] = widget.allowedDomains || [];
  const corsHeaders = buildWidgetCorsHeaders(origin, allowedDomains);

  return Response.json({
    id: widget.id,
    name: widget.name,
    slug: widget.slug,
    publicKey: widget.publicKey,
    theme: {
      primaryColor: widget.primaryColor,
      backgroundColor: widget.backgroundColor,
      textColor: widget.textColor,
      logoUrl: widget.logoUrl,
      avatarUrl: widget.avatarUrl,
      welcomeMessage: widget.welcomeMessage,
      position: widget.position,
      quickReplies: widget.quickReplies || [],
    },
    leadCaptureEnabled: widget.leadCaptureEnabled,
    leadFields: widget.leadFields || [],
    autoTriggerMessages: widget.autoTriggerMessages || 0,
  }, {
    headers: corsHeaders,
  });
}
