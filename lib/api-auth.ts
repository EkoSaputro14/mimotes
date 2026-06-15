import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/api-keys";
import { hasFeature } from "@/lib/entitlements";
import { setWorkspaceContext } from "@/lib/prisma";

// ============================================================
// API Authentication Middleware
// ============================================================

export interface ApiAuthResult {
  workspaceId: string;
  apiKeyId: string;
}

/**
 * Authenticate an API request using Bearer token.
 *
 * Header: Authorization: Bearer mk_live_xxxxx
 *
 * Returns workspace context or null if unauthorized.
 */
export async function authenticateApiRequest(
  request: NextRequest
): Promise<ApiAuthResult | null> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.substring(7);
  if (!token) return null;

  const result = await validateApiKey(token);
  return result;
}

/**
 * Check if a workspace has API access entitlement.
 * Returns true if allowed, false if feature not available.
 */
export async function checkApiAccess(
  workspaceId: string
): Promise<boolean> {
  return hasFeature(workspaceId, "api_access");
}

/**
 * Combined auth + entitlement check.
 * Returns workspace context or throws appropriate error.
 */
export async function requireApiAuth(
  request: NextRequest
): Promise<ApiAuthResult> {
  const auth = await authenticateApiRequest(request);

  if (!auth) {
    throw new ApiError(401, "Invalid or missing API key");
  }

  // Activate RLS context for workspace isolation
  await setWorkspaceContext(auth.workspaceId);

  const hasAccess = await checkApiAccess(auth.workspaceId);
  if (!hasAccess) {
    throw new ApiError(403, "API access not available on your plan. Upgrade to enable API access.");
  }

  return auth;
}

// ============================================================
// API Error Class
// ============================================================

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code || "error";
  }
}

/**
 * Create a standard API error response.
 */
export function apiErrorResponse(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  console.error("[API] Unexpected error:", error);
  return Response.json(
    {
      error: {
        code: "internal_error",
        message: "An unexpected error occurred",
      },
    },
    { status: 500 }
  );
}
