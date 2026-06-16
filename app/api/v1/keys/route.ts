import { NextRequest } from "next/server";
import { requireApiAuth, apiErrorResponse } from "@/lib/api-auth";
import { createApiKey, listApiKeys, revokeApiKey, deleteApiKey } from "@/lib/api-keys";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

/**
 * GET /api/v1/keys
 * List all API keys for the workspace.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request);
    const keys = await listApiKeys(auth.workspaceId);
    return Response.json({ keys });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/**
 * POST /api/v1/keys
 * Create a new API key.
 * Body: { name: string, expiresInDays?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request);
    const body = await request.json();
    const { name, expiresInDays } = body;

    if (!name || typeof name !== "string") {
      return Response.json({ error: { code: "invalid_request", message: "Name is required" } }, { status: 400 });
    }

    const key = await createApiKey(auth.workspaceId, name, expiresInDays);

    // Audit log
    await logAudit({
      workspaceId: auth.workspaceId,
      actorId: auth.apiKeyId,
      actorType: "api_key",
      action: AUDIT_ACTIONS.API_KEY_CREATE,
      resourceType: "api_key",
      resourceId: key.id,
      metadata: { name, keyPrefix: key.keyPrefix },
    });

    return Response.json({
      id: key.id,
      key: key.rawKey,
      keyPrefix: key.keyPrefix,
      expiresAt: key.expiresAt,
      message: "Save this key — it will not be shown again.",
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/**
 * DELETE /api/v1/keys?id=xxx
 * Revoke an API key.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request);
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");

    if (!keyId) {
      return Response.json({ error: { code: "invalid_request", message: "Key ID is required" } }, { status: 400 });
    }

    await revokeApiKey(auth.workspaceId, keyId);

    // Audit log
    await logAudit({
      workspaceId: auth.workspaceId,
      actorId: auth.apiKeyId,
      actorType: "api_key",
      action: AUDIT_ACTIONS.API_KEY_REVOKE,
      resourceType: "api_key",
      resourceId: keyId,
    });

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
