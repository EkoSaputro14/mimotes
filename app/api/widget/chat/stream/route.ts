import { NextRequest } from "next/server";
import { prisma, setWorkspaceContext } from "@/lib/prisma";
import { getWidgetByPublicKey, validateWidgetOrigin, validateMessageLength, buildWidgetCorsHeaders } from "@/lib/widget";
import { streamRAGResponse } from "@/lib/rag/chain";

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
 */
function resolveClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map((s) => s.trim());
    return ips[ips.length - 1] || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * POST /api/widget/chat/stream
 * Send a chat message via widget with SSE streaming response.
 *
 * Security:
 * - Dual-layer rate limiting (per key + per IP)
 * - Origin validation against allowed domains
 * - Message length validation
 * - Conversation visitor isolation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const ip = resolveClientIp(request);

  try {
    const body = await request.json();
    const { publicKey, message, conversationId, visitorId } = body;

    if (!publicKey || !message) {
      return Response.json(
        { error: { code: "invalid_request", message: "publicKey and message are required" } },
        { status: 400 }
      );
    }

    // ── Message length validation ──
    if (!validateMessageLength(message)) {
      return Response.json(
        { error: { code: "message_too_long", message: "Message exceeds maximum length of 10,000 characters" } },
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
      if (!conv || conv.widgetId !== widget.id) {
        return Response.json({ error: { code: "invalid_request", message: "Invalid conversation" } }, { status: 400 });
      }
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

    // ── Save user message ──
    await prisma.widgetMessage.create({
      data: {
        conversationId: conv.id,
        workspaceId: widget.workspaceId,
        role: "user",
        content: message,
      },
    });

    // ── Generate streaming RAG response ──
    await setWorkspaceContext(widget.workspaceId);
    const result = await streamRAGResponse(message, 5, widget.workspaceId);

    const corsHeaders = buildWidgetCorsHeaders(origin, allowedDomains);
    const encoder = new TextEncoder();
    const conversationDone = conv;

    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: string) => {
          controller.enqueue(encoder.encode(data));
        };

        const sendSSE = (eventType: string, payload: Record<string, unknown>) => {
          send(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`);
        };

        let fullResponse = "";

        if (result.noContext || !result.stream) {
          // No context or refused — send refusal message
          const refusalMsg = result.refusalMessage || "No relevant information found.";
          fullResponse = refusalMsg;
          sendSSE("message", { type: "chunk", content: refusalMsg });
        } else {
          try {
            // Stream chunks from AI provider
            for await (const chunk of result.stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                sendSSE("message", { type: "chunk", content });
              }
            }
          } catch (streamError) {
            console.error("[Widget Chat Stream] Stream error:", streamError);
          }

          // Send sources if available
          if (result.sources && result.sources.length > 0) {
            sendSSE("message", {
              type: "sources",
              sources: result.sources.map((s) => ({
                documentTitle: s.documentTitle,
                similarity: s.similarity,
                chunkIndex: s.chunkIndex,
              })),
            });
          }
        }

        const assistantMsgId = `msg_${Date.now()}`;

        // Send done event
        sendSSE("message", {
          type: "done",
          conversationId: conversationDone.id,
          messageId: assistantMsgId,
        });

        controller.close();

        // Save assistant message after stream completes (fire-and-forget)
        prisma.widgetMessage.create({
          data: {
            conversationId: conversationDone.id,
            workspaceId: widget.workspaceId,
            role: "assistant",
            content: fullResponse,
            tokensUsed: message.split(" ").length + fullResponse.split(" ").length,
          },
        }).catch((err) => {
          console.error("[Widget Chat Stream] Failed to save assistant message:", err);
        });
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        ...corsHeaders,
      },
    });
  } catch (error) {
    console.error("[Widget Chat Stream] Error:", error);
    return Response.json(
      { error: { code: "internal_error", message: "An error occurred" } },
      { status: 500 }
    );
  }
}
