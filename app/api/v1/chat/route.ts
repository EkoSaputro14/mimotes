import { NextRequest } from "next/server";
import { requireApiAuth, apiErrorResponse } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { trackApiUsage } from "@/lib/api-usage";
import { streamRAGResponse, generateRAGResponse } from "@/lib/rag/chain";
import { setWorkspaceContext } from "@/lib/prisma";

/**
 * POST /api/v1/chat
 * Send a chat message via API.
 *
 * Body: { message: string, sessionId?: string, model?: string }
 * Headers: Authorization: Bearer ***
 * Query: ?stream=true for SSE streaming
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const auth = await requireApiAuth(request);

    // Rate limit check
    const rateLimit = checkRateLimit(auth.workspaceId);
    if (!rateLimit.allowed) {
      return Response.json(
        {
          error: {
            code: "rate_limit_exceeded",
            message: `Rate limit exceeded. Try again in ${rateLimit.retryAfter}s.`,
          },
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(rateLimit.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rateLimit.resetAt),
            "Retry-After": String(rateLimit.retryAfter),
          },
        }
      );
    }

    const body = await request.json();
    const { message, sessionId, model } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: { code: "invalid_request", message: "Message is required" } },
        { status: 400 }
      );
    }

    // Set workspace context for RLS
    await setWorkspaceContext(auth.workspaceId);

    const messageId = `msg_${Date.now()}`;
    const url = new URL(request.url);
    const isStream = url.searchParams.get("stream") === "true";

    if (isStream) {
      // ── Streaming SSE response ──
      const result = await streamRAGResponse(message, 5, auth.workspaceId);

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (data: string) => {
            controller.enqueue(encoder.encode(data));
          };

          if (result.noContext || !result.stream) {
            // No context or refused — send the refusal message
            const refusalMsg = result.refusalMessage || "No relevant information found.";
            send(`event: message\ndata: ${JSON.stringify({ type: "chunk", content: refusalMsg })}\n\n`);
            send(`event: message\ndata: ${JSON.stringify({ type: "done", messageId })}\n\n`);
            controller.close();
            return;
          }

          try {
            // Stream chunks from OpenAI
            for await (const chunk of result.stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                send(`event: message\ndata: ${JSON.stringify({ type: "chunk", content })}\n\n`);
              }
            }
          } catch (streamError) {
            console.error("[API Chat] Stream error:", streamError);
          }

          send(`event: message\ndata: ${JSON.stringify({ type: "done", messageId })}\n\n`);
          controller.close();

          // Track usage (fire-and-forget)
          const latencyMs = Date.now() - startTime;
          trackApiUsage({
            workspaceId: auth.workspaceId,
            apiKeyId: auth.apiKeyId,
            endpoint: "/api/v1/chat",
            method: "POST",
            statusCode: 200,
            latencyMs,
            tokensUsed: message.split(" ").length + 10,
            ipAddress: request.headers.get("x-forwarded-for") || undefined,
          }).catch(() => {});
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      });
    }

    // ── Non-streaming fallback ──
    const ragResult = await generateRAGResponse(message, 5, auth.workspaceId);

    const response = {
      id: messageId,
      message: message,
      response: ragResult.answer,
      model: model || "default",
      sessionId: sessionId || `session_${Date.now()}`,
      sources: ragResult.sources.map((s) => ({
        documentTitle: s.documentTitle,
        similarity: s.similarity,
        chunkIndex: s.chunkIndex,
      })),
      confidence: ragResult.confidence,
      tokens: {
        input: message.split(" ").length,
        output: ragResult.answer.split(" ").length,
      },
    };

    const latencyMs = Date.now() - startTime;

    // Track usage
    await trackApiUsage({
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      endpoint: "/api/v1/chat",
      method: "POST",
      statusCode: 200,
      latencyMs,
      tokensUsed: response.tokens.input + response.tokens.output,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return Response.json(response, {
      headers: {
        "X-RateLimit-Limit": String(rateLimit.limit),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetAt),
      },
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    // Track failed request
    try {
      const auth = await requireApiAuth(request);
      await trackApiUsage({
        workspaceId: auth.workspaceId,
        endpoint: "/api/v1/chat",
        method: "POST",
        statusCode: error instanceof Error && "statusCode" in error ? (error as any).statusCode : 500,
        latencyMs,
      });
    } catch {}
    return apiErrorResponse(error);
  }
}
