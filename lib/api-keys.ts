import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// ============================================================
// API Key Management
// ============================================================

const KEY_PREFIX = "mk_live_";
const KEY_LENGTH = 32;

/**
 * Generate a new API key.
 * Returns the raw key (shown once) and the hash (stored in DB).
 */
export function generateApiKey(): {
  rawKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const randomBytes = crypto.randomBytes(KEY_LENGTH);
  const rawKey = KEY_PREFIX + randomBytes.toString("base64url");
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.substring(0, 12) + "...";

  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hash an API key using SHA-256.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an API key and return the associated workspace.
 * Returns null if key is invalid, expired, or inactive.
 */
export async function validateApiKey(rawKey: string): Promise<{
  workspaceId: string;
  apiKeyId: string;
} | null> {
  if (!rawKey.startsWith(KEY_PREFIX)) return null;

  const keyHash = hashApiKey(rawKey);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      workspaceId: true,
      isActive: true,
      expiresAt: true,
    },
  });

  if (!apiKey) return null;
  if (!apiKey.isActive) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Update lastUsedAt (fire and forget)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return {
    workspaceId: apiKey.workspaceId,
    apiKeyId: apiKey.id,
  };
}

/**
 * Create a new API key for a workspace.
 */
export async function createApiKey(
  workspaceId: string,
  name: string,
  expiresInDays?: number
): Promise<{
  id: string;
  rawKey: string;
  keyPrefix: string;
  expiresAt: Date | null;
}> {
  const { rawKey, keyHash, keyPrefix } = generateApiKey();

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const apiKey = await prisma.apiKey.create({
    data: {
      workspaceId,
      name,
      keyHash,
      keyPrefix,
      expiresAt,
    },
  });

  return {
    id: apiKey.id,
    rawKey,
    keyPrefix,
    expiresAt,
  };
}

/**
 * List all API keys for a workspace (without raw keys).
 */
export async function listApiKeys(workspaceId: string) {
  return prisma.apiKey.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      lastUsedAt: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Revoke (deactivate) an API key.
 */
export async function revokeApiKey(workspaceId: string, keyId: string) {
  return prisma.apiKey.updateMany({
    where: { id: keyId, workspaceId },
    data: { isActive: false },
  });
}

/**
 * Delete an API key permanently.
 */
export async function deleteApiKey(workspaceId: string, keyId: string) {
  return prisma.apiKey.deleteMany({
    where: { id: keyId, workspaceId },
  });
}
