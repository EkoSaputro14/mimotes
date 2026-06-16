import { NextRequest } from "next/server";
import { prisma, setWorkspaceContext } from "@/lib/prisma";
import { getWidgetByPublicKey, validateWidgetOrigin, validateMessageLength, buildWidgetCorsHeaders, saveLeadData, updateLeadScore } from "@/lib/widget";
import { generateRAGResponse } from "@/lib/rag/chain";
import { detectIntent, calculateLeadScore, shouldAutoTrigger, getAutoTriggerPrompt } from "@/lib/lead-intent";

// Rate limiter: per public key + per IP (dual-layer)
const keyRateLimit = new Map<string, { count: number; resetAt: number }>();
const ipRateLimit = new Map<string, { count: number; resetAt: number }>();
const KEY_RATE_LIMIT = 60; // per key per minute
const IP_RATE_LIMIT = 30; // per IP per minute

function checkRateLimit(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/**
 * Resolve the real client IP from reverse-proxy headers.
 * Only trusts the LAST proxy in the chain (most reliable).
 */
function resolveClientIp(request: NextRequest): string {
  // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
  // The last one is the actual client if behind multiple proxies
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map((s) => s.trim());
    return ips[ips.length - 1] || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * POST /api/widget/chat
 * Send a chat message via widget (public endpoint).
 *
 * Security:
 * - Dual-layer rate limiting (per key + per IP)
 * - Origin validation against allowed domains
 * - Message length validation
 * - Conversation visitor isolation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Resolve real client IP (last in X-Forwarded-For chain)
  const ip = resolveClientIp(request);

  try {
    const body = await request.json();
    const { publicKey, message, conversationId, visitorId, lead } = body;

    if (!publicKey || !message) {
      return Response.json(
        { error: { code: "invalid_request", message: "publicKey and message are required" } },
        { status: 400 }
      );
    }

    // ── Message length validation ──
    if (!validateMessageLength(message)) {
      return Response.json(
        { error: { code: "message_too_long", message: `Message exceeds maximum length of 10,000 characters` } },
        { status: 400 }
      );
    }

    // ── Dual-layer rate limiting ──
    if (!checkRateLimit(keyRateLimit, publicKey, KEY_RATE_LIMIT)) {
      return Response.json(
        { error: { code: "rate_limit_exceeded", message: "Too many requests for this widget. Please try again later." } },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    if (!checkRateLimit(ipRateLimit, ip, IP_RATE_LIMIT)) {
      return Response.json(
        { error: { code: "rate_limit_exceeded", message: "Too many requests from your IP. Please try again later." } },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    // ── Validate widget ──
    const widget = await getWidgetByPublicKey(publicKey);
    if (!widget) {
      return Response.json({ error: { code: "not_found", message: "Widget not found" } }, { status: 404 });
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

    // ── Find or create conversation ──
    let conv;
    if (conversationId) {
      conv = await prisma.widgetConversation.findUnique({ where: { id: conversationId } });
      // Security: verify conversation belongs to widget AND visitor
      if (!conv || conv.widgetId !== widget.id) {
        return Response.json({ error: { code: "invalid_request", message: "Invalid conversation" } }, { status: 400 });
      }
      // Visitor isolation: only the original visitor can continue their conversation
      if (conv.visitorId && visitorId && conv.visitorId !== visitorId) {
        return Response.json({ error: { code: "forbidden", message: "Access denied to this conversation" } }, { status: 403 });
      }
    } else {
      conv = await prisma.widgetConversation.create({
        data: {
          widgetId: widget.id,
          workspaceId: widget.workspaceId,
          visitorId: visitorId || null,
          ipAddress: ip,
          userAgent: request.headers.get("user-agent") || null,
        },
      });
    }

    // ── Save lead data if provided ──
    if (lead) {
      await saveLeadData(conv.id, lead);
    }

    // ── Intent detection & lead scoring ──
    const messageCount = await prisma.widgetMessage.count({ where: { conversationId: conv.id } });
    const intent = detectIntent(message);
    const hasLead = !!(conv.leadEmail || lead);
    const score = calculateLeadScore(hasLead, intent, messageCount);
    await updateLeadScore(conv.id, score);

    // ── Persist intent on conversation ──
    if (intent) {
      await prisma.widgetConversation.update({
        where: { id: conv.id },
        data: { leadIntent: intent },
      });
    }

    // ── Trigger notification on high lead ──
    if (score === "high" && hasLead) {
      const { sendLeadNotification } = await import("@/lib/notifications");
      await sendLeadNotification("high_lead", {
        conversationId: conv.id,
        workspaceId: widget.workspaceId,
        leadName: conv.leadName || lead?.name || null,
        leadEmail: conv.leadEmail || lead?.email || null,
        leadWhatsApp: conv.leadWhatsApp || lead?.whatsapp || null,
        leadScore: score,
        leadStatus: conv.leadStatus || "new",
        leadIntent: intent,
        widgetName: widget.name,
        messageCount: messageCount + 1,
      }).catch((err) => console.error("[Notification] Failed:", err));
    }

    // ── Save user message ──
    await prisma.widgetMessage.create({
      data: {
        conversationId: conv.id,
        workspaceId: widget.workspaceId,
        role: "user",
        content: message,
      },
    });

    // ── Generate AI response via RAG pipeline ──
    await setWorkspaceContext(widget.workspaceId);
    const ragResult = await generateRAGResponse(message, 5, widget.workspaceId);
    const response = ragResult.answer;
    const latencyMs = Date.now() - startTime;

    // ── Auto-trigger lead capture prompt ──
    let finalResponse = response;
    if (shouldAutoTrigger(widget.leadCaptureEnabled || false, widget.autoTriggerMessages || 0, hasLead, messageCount)) {
      finalResponse = response + "\n\n" + getAutoTriggerPrompt();
    }

    // ── Save assistant message ──
    await prisma.widgetMessage.create({
      data: {
        conversationId: conv.id,
        workspaceId: widget.workspaceId,
        role: "assistant",
        content: finalResponse,
        tokensUsed: message.split(" ").length + finalResponse.split(" ").length,
      },
    });

    // Build CORS headers with origin validation (NEVER wildcard)
    const corsHeaders = buildWidgetCorsHeaders(origin, allowedDomains);

    return Response.json({
      conversationId: conv.id,
      message: finalResponse,
      latencyMs,
    }, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("[Widget Chat] Error:", error);
    return Response.json(
      { error: { code: "internal_error", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
