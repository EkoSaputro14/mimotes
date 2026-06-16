import { NextRequest } from "next/server";
import { requireApiAuth, apiErrorResponse } from "@/lib/api-auth";
import { checkRateLimit } from "@/lib/api-rate-limit";
import { trackApiUsage } from "@/lib/api-usage";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/v1/documents
 * List documents via API.
 *
 * Query: ?limit=10&offset=0
 * Headers: Authorization: Bearer mk_live_xxx
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { workspaceId: auth.workspaceId },
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.document.count({
        where: { workspaceId: auth.workspaceId },
      }),
    ]);

    const latencyMs = Date.now() - startTime;

    await trackApiUsage({
      workspaceId: auth.workspaceId,
      apiKeyId: auth.apiKeyId,
      endpoint: "/api/v1/documents",
      method: "GET",
      statusCode: 200,
      latencyMs,
      ipAddress: request.headers.get("x-forwarded-for") || undefined,
    });

    return Response.json(
      { documents, total, limit, offset },
      {
        headers: {
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
