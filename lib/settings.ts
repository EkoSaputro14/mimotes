import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, isSecretKey } from "@/lib/crypto";

// ============================================================
// Global Settings (legacy — env-based defaults)
// ============================================================

let settingsCache: Record<string, string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000;

/**
 * Decrypt all secret values in a settings record.
 */
function decryptSettings(settings: Record<string, string>): Record<string, string> {
  const decrypted: Record<string, string> = {};
  for (const [key, value] of Object.entries(settings)) {
    try {
      decrypted[key] = decrypt(value);
    } catch {
      // Graceful fallback: return raw value if decryption fails
      decrypted[key] = value;
    }
  }
  return decrypted;
}

export async function getSettings(): Promise<Record<string, string>> {
  const now = Date.now();
  if (settingsCache && now - cacheTimestamp < CACHE_TTL) {
    return settingsCache;
  }

  try {
    const rows = await prisma.setting.findMany();
    const rawSettings: Record<string, string> = {};
    for (const row of rows) {
      rawSettings[row.key] = row.value;
    }
    const settings = decryptSettings(rawSettings);
    settingsCache = settings;
    cacheTimestamp = now;
    return settings;
  } catch {
    return settingsCache || {};
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const settings = await getSettings();
  return settings[key] ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  // Encrypt secret values before storing
  const storedValue = isSecretKey(key) ? encrypt(value) : value;
  await prisma.setting.upsert({
    where: { key },
    update: { value: storedValue },
    create: { key, value: storedValue },
  });
  settingsCache = null;
  cacheTimestamp = 0;
}

export async function setSettings(
  entries: Record<string, string>
): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    const storedValue = isSecretKey(key) ? encrypt(value) : value;
    await prisma.setting.upsert({
      where: { key },
      update: { value: storedValue },
      create: { key, value: storedValue },
    });
  }
  settingsCache = null;
  cacheTimestamp = 0;
}

/**
 * Get a setting with environment variable fallback.
 * Priority: DB setting > env variable > default value
 */
export async function getSettingWithFallback(
  key: string,
  envKey: string,
  defaultValue: string = ""
): Promise<string> {
  const dbValue = await getSetting(key);
  if (dbValue !== null && dbValue !== "") return dbValue;
  return process.env[envKey] || defaultValue;
}

// ============================================================
// Workspace-Scoped Settings
// ============================================================

const workspaceSettingsCache = new Map<
  string,
  { data: Record<string, string>; timestamp: number }
>();
const WORKSPACE_CACHE_TTL = 30_000;

/**
 * Get all settings for a workspace.
 * Falls back to global settings if workspace setting not found.
 */
export async function getWorkspaceSettings(
  workspaceId: string
): Promise<Record<string, string>> {
  const now = Date.now();
  const cached = workspaceSettingsCache.get(workspaceId);
  if (cached && now - cached.timestamp < WORKSPACE_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Use raw query to bypass RLS — we already know the workspaceId
    const rows = await prisma.$queryRaw<Array<{ key: string; value: string }>>`
      SELECT key, value FROM workspace_settings WHERE workspace_id = ${workspaceId}
    `;
    const rawSettings: Record<string, string> = {};
    for (const row of rows) {
      rawSettings[row.key] = row.value;
    }
    const settings = decryptSettings(rawSettings);
    workspaceSettingsCache.set(workspaceId, { data: settings, timestamp: now });
    return settings;
  } catch {
    return cached?.data || {};
  }
}

/**
 * Get a single workspace setting.
 * Falls back to global setting, then env variable.
 */
export async function getWorkspaceSetting(
  workspaceId: string,
  key: string,
  envKey?: string,
  defaultValue: string = ""
): Promise<string> {
  const wsSettings = await getWorkspaceSettings(workspaceId);
  if (wsSettings[key] !== undefined && wsSettings[key] !== "") {
    return wsSettings[key];
  }
  // Fallback to global setting
  const globalValue = await getSetting(key);
  if (globalValue !== null && globalValue !== "") return globalValue;
  // Fallback to env
  if (envKey && process.env[envKey]) return process.env[envKey]!;
  return defaultValue;
}

/**
 * Set a workspace setting.
 */
export async function setWorkspaceSetting(
  workspaceId: string,
  key: string,
  value: string
): Promise<void> {
  // Encrypt secret values before storing
  const storedValue = isSecretKey(key) ? encrypt(value) : value;
  await prisma.workspaceSetting.upsert({
    where: { workspaceId_key: { workspaceId, key } },
    update: { value: storedValue },
    create: { workspaceId, key, value: storedValue },
  });
  workspaceSettingsCache.delete(workspaceId);
}

/**
 * Set multiple workspace settings at once.
 */
export async function setWorkspaceSettings(
  workspaceId: string,
  entries: Record<string, string>
): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    const storedValue = isSecretKey(key) ? encrypt(value) : value;
    await prisma.workspaceSetting.upsert({
      where: { workspaceId_key: { workspaceId, key } },
      update: { value: storedValue },
      create: { workspaceId, key, value: storedValue },
    });
  }
  workspaceSettingsCache.delete(workspaceId);
}

/**
 * Invalidate workspace settings cache.
 */
export function invalidateWorkspaceSettingsCache(
  workspaceId?: string
): void {
  if (workspaceId) {
    workspaceSettingsCache.delete(workspaceId);
  } else {
    workspaceSettingsCache.clear();
  }
}

/**
 * Get AI provider config for a workspace.
 * Priority: workspace setting > global setting > env variable
 *
 * Note: apiKey is already decrypted via getWorkspaceSetting → getWorkspaceSettings → decrypt
 */
export async function getWorkspaceAIConfig(workspaceId: string) {
  return {
    provider: await getWorkspaceSetting(
      workspaceId, "ai_provider", "AI_PROVIDER", "openai"
    ),
    apiKey: await getWorkspaceSetting(
      workspaceId, "ai_api_key", "AI_API_KEY", ""
    ),
    baseUrl: await getWorkspaceSetting(
      workspaceId, "ai_base_url", "AI_BASE_URL", ""
    ),
    model: await getWorkspaceSetting(
      workspaceId, "ai_model", "AI_MODEL", ""
    ),
    embeddingModel: await getWorkspaceSetting(
      workspaceId, "ai_embedding_model", "AI_EMBEDDING_MODEL", ""
    ),
  };
}
