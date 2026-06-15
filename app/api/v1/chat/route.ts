import { NextRequest } from "next/server";
import { requireApiAuth, apiErrorResponse } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { trackApiUsage } from "@/lib/api-usage";

/**
 * POST /api/v1/chat
 * Send a chat message via API.
 *
 * Body: { message: string, sessionId?: string, model?: string }
 * Headers: Authorization: Bearer mk_live_xxx
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

    // TODO: Integrate with actual chat engine
    // For now, return a placeholder response
    const response = {
      id: `msg_${Date.now()}`,
      message: message,
      response: `[API] Received: ${message}`,
      model: model || "default",
      sessionId: sessionId || `session_${Date.now()}`,
      tokens: { input: message.split(" ").length, output: 10 },
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
