import { prisma } from "@/lib/prisma";

// ============================================================
// Plan Definitions (defaults — seeded in DB)
// ============================================================

export interface PlanLimits {
  maxDocuments: number;     // -1 = unlimited
  maxStorageMB: number;
  maxChatMessages: number;
  maxChunks: number;
  maxAIRequests: number;
  maxEmbeddingReqs: number;
  maxMCPExecutions: number;
  maxMembers: number;
  maxWorkspaces: number;
}

const UNLIMITED = -1;

const DEFAULT_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxDocuments: 10,
    maxStorageMB: 100,
    maxChatMessages: 1000,
    maxChunks: 5000,
    maxAIRequests: 500,
    maxEmbeddingReqs: 500,
    maxMCPExecutions: 100,
    maxMembers: 3,
    maxWorkspaces: 1,
  },
  pro: {
    maxDocuments: 100,
    maxStorageMB: 10240,
    maxChatMessages: 50000,
    maxChunks: 100000,
    maxAIRequests: 10000,
    maxEmbeddingReqs: 10000,
    maxMCPExecutions: 5000,
    maxMembers: 20,
    maxWorkspaces: 5,
  },
  enterprise: {
    maxDocuments: UNLIMITED,
    maxStorageMB: UNLIMITED,
    maxChatMessages: UNLIMITED,
    maxChunks: UNLIMITED,
    maxAIRequests: UNLIMITED,
    maxEmbeddingReqs: UNLIMITED,
    maxMCPExecutions: UNLIMITED,
    maxMembers: UNLIMITED,
    maxWorkspaces: UNLIMITED,
  },
};

// ============================================================
// Period Helpers
// ============================================================

/** Get current period string (YYYY-MM) */
export function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// ============================================================
// Subscription Status Helpers
// ============================================================

/** Statuses that grant premium access */
const ACTIVE_STATUSES = new Set(["active", "trial", "past_due"]);

/**
 * Check if a subscription status grants premium access.
 * Returns false for: canceled, expired, unknown statuses.
 */
export function isSubscriptionActive(status: string): boolean {
  return ACTIVE_STATUSES.has(status);
}

/**
 * Check if a trial has expired based on trialEndsAt.
 */
export function isTrialExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return new Date() > trialEndsAt;
}

// ============================================================
// Plan Resolution
// ============================================================

/**
 * Get the plan limits for a workspace.
 * Falls back to free tier if:
 * - No subscription found
 * - Subscription status is canceled/expired
 * - Trial has expired
 */
export async function getPlanLimits(workspaceId: string): Promise<PlanLimits> {
  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    include: { plan: true },
  });

  if (sub?.plan && isSubscriptionActive(sub.status)) {
    // Check trial expiration
    if (sub.status === "trial" && isTrialExpired(sub.trialEndsAt)) {
      return DEFAULT_LIMITS.free;
    }
    return {
      maxDocuments: sub.plan.maxDocuments,
      maxStorageMB: sub.plan.maxStorageMB,
      maxChatMessages: sub.plan.maxChatMessages,
      maxChunks: sub.plan.maxChunks,
      maxAIRequests: sub.plan.maxAIRequests,
      maxEmbeddingReqs: sub.plan.maxEmbeddingReqs,
      maxMCPExecutions: sub.plan.maxMCPExecutions,
      maxMembers: sub.plan.maxMembers,
      maxWorkspaces: sub.plan.maxWorkspaces,
    };
  }

  return DEFAULT_LIMITS.free;
}

/**
 * Get workspace subscription info.
 */
export async function getWorkspaceSubscription(workspaceId: string) {
  return prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    include: { plan: true },
  });
}

// ============================================================
// Usage Tracking
// ============================================================

/**
 * Get or create usage record for the current period.
 */
async function getOrCreateUsage(workspaceId: string, period: string) {
  const existing = await prisma.workspaceUsage.findUnique({
    where: { workspaceId_period: { workspaceId, period } },
  });

  if (existing) return existing;

  return prisma.workspaceUsage.create({
    data: { workspaceId, period },
  });
}

/**
 * Increment usage using a safe approach (avoid raw interpolation).
 */
export async function trackDocumentUpload(
  workspaceId: string,
  storageBytes: number
): Promise<void> {
  const period = getCurrentPeriod();
  await prisma.$executeRaw`
    INSERT INTO workspace_usage (id, workspace_id, period, documents_created, storage_bytes_used, created_at, updated_at)
    VALUES (gen_random_uuid()::text, ${workspaceId}, ${period}, 1, ${storageBytes}, NOW(), NOW())
    ON CONFLICT (workspace_id, period)
    DO UPDATE SET
      documents_created = workspace_usage.documents_created + 1,
      storage_bytes_used = workspace_usage.storage_bytes_used + ${storageBytes},
      updated_at = NOW()
  `;
}

export async function trackChatMessage(workspaceId: string): Promise<void> {
  const period = getCurrentPeriod();
  await prisma.$executeRaw`
    INSERT INTO workspace_usage (id, workspace_id, period, chat_messages, created_at, updated_at)
    VALUES (gen_random_uuid()::text, ${workspaceId}, ${period}, 1, NOW(), NOW())
    ON CONFLICT (workspace_id, period)
    DO UPDATE SET chat_messages = workspace_usage.chat_messages + 1, updated_at = NOW()
  `;
}

export async function trackChunks(
  workspaceId: string,
  count: number
): Promise<void> {
  const period = getCurrentPeriod();
  await prisma.$executeRaw`
    INSERT INTO workspace_usage (id, workspace_id, period, chunks_created, created_at, updated_at)
    VALUES (gen_random_uuid()::text, ${workspaceId}, ${period}, ${count}, NOW(), NOW())
    ON CONFLICT (workspace_id, period)
    DO UPDATE SET chunks_created = workspace_usage.chunks_created + ${count}, updated_at = NOW()
  `;
}

export async function trackAIRequest(workspaceId: string): Promise<void> {
  const period = getCurrentPeriod();
  await prisma.$executeRaw`
    INSERT INTO workspace_usage (id, workspace_id, period, ai_requests, created_at, updated_at)
    VALUES (gen_random_uuid()::text, ${workspaceId}, ${period}, 1, NOW(), NOW())
    ON CONFLICT (workspace_id, period)
    DO UPDATE SET ai_requests = workspace_usage.ai_requests + 1, updated_at = NOW()
  `;
}

export async function trackEmbeddingRequest(
  workspaceId: string
): Promise<void> {
  const period = getCurrentPeriod();
  await prisma.$executeRaw`
    INSERT INTO workspace_usage (id, workspace_id, period, embedding_requests, created_at, updated_at)
    VALUES (gen_random_uuid()::text, ${workspaceId}, ${period}, 1, NOW(), NOW())
    ON CONFLICT (workspace_id, period)
    DO UPDATE SET embedding_requests = workspace_usage.embedding_requests + 1, updated_at = NOW()
  `;
}

export async function trackMCPExecution(workspaceId: string): Promise<void> {
  const period = getCurrentPeriod();
  await prisma.$executeRaw`
    INSERT INTO workspace_usage (id, workspace_id, period, mcp_executions, created_at, updated_at)
    VALUES (gen_random_uuid()::text, ${workspaceId}, ${period}, 1, NOW(), NOW())
    ON CONFLICT (workspace_id, period)
    DO UPDATE SET mcp_executions = workspace_usage.mcp_executions + 1, updated_at = NOW()
  `;
}

// ============================================================
// Usage Query
// ============================================================

export interface UsageSnapshot {
  period: string;
  documentsCreated: number;
  storageBytesUsed: number;
  storageMBUsed: number;
  chunksCreated: number;
  chatMessages: number;
  aiRequests: number;
  embeddingRequests: number;
  mcpExecutions: number;
  limits: PlanLimits;
  planName: string;
  usagePercent: Record<string, number>;
}

/**
 * Get current usage for a workspace with limits and percentages.
 */
export async function getUsage(
  workspaceId: string,
  period?: string
): Promise<UsageSnapshot> {
  const p = period || getCurrentPeriod();
  const usage = await getOrCreateUsage(workspaceId, p);
  const limits = await getPlanLimits(workspaceId);

  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    include: { plan: { select: { displayName: true } } },
  });

  const planName = sub?.plan?.displayName || "Free";

  function pct(used: number, max: number): number {
    if (max === UNLIMITED) return 0;
    if (max === 0) return 100;
    return Math.min(100, Math.round((used / max) * 100));
  }

  return {
    period: p,
    documentsCreated: usage.documentsCreated,
    storageBytesUsed: Number(usage.storageBytesUsed),
    storageMBUsed: Math.round(Number(usage.storageBytesUsed) / (1024 * 1024)),
    chunksCreated: usage.chunksCreated,
    chatMessages: usage.chatMessages,
    aiRequests: usage.aiRequests,
    embeddingRequests: usage.embeddingRequests,
    mcpExecutions: usage.mcpExecutions,
    limits,
    planName,
    usagePercent: {
      documents: pct(usage.documentsCreated, limits.maxDocuments),
      storage: pct(
        Math.round(Number(usage.storageBytesUsed) / (1024 * 1024)),
        limits.maxStorageMB
      ),
      chatMessages: pct(usage.chatMessages, limits.maxChatMessages),
      chunks: pct(usage.chunksCreated, limits.maxChunks),
      aiRequests: pct(usage.aiRequests, limits.maxAIRequests),
      embeddingRequests: pct(usage.embeddingRequests, limits.maxEmbeddingReqs),
      mcpExecutions: pct(usage.mcpExecutions, limits.maxMCPExecutions),
    },
  };
}

// ============================================================
// Limit Enforcement
// ============================================================

export class LimitExceededError extends Error {
  constructor(
    public readonly metric: string,
    public readonly current: number,
    public readonly limit: number
  ) {
    super(
      `Limit exceeded for ${metric}: ${current}/${limit}. Upgrade your plan to increase limits.`
    );
    this.name = "LimitExceededError";
  }
}

/**
 * Check if a workspace has exceeded a specific limit.
 * Throws LimitExceededError if exceeded.
 */
export async function checkLimit(
  workspaceId: string,
  metric: keyof PlanLimits
): Promise<void> {
  const usage = await getUsage(workspaceId);
  const limit = usage.limits[metric];

  if (limit === UNLIMITED) return;

  const currentValue = getMetricValue(usage, metric);
  if (currentValue >= limit) {
    throw new LimitExceededError(metric, currentValue, limit);
  }
}

/**
 * Check if adding `amount` would exceed the limit.
 * Throws LimitExceededError if it would.
 */
export async function checkLimitWithAmount(
  workspaceId: string,
  metric: keyof PlanLimits,
  amount: number
): Promise<void> {
  const usage = await getUsage(workspaceId);
  const limit = usage.limits[metric];

  if (limit === UNLIMITED) return;

  const currentValue = getMetricValue(usage, metric);
  if (currentValue + amount > limit) {
    throw new LimitExceededError(metric, currentValue + amount, limit);
  }
}

function getMetricValue(usage: UsageSnapshot, metric: keyof PlanLimits): number {
  const mapping: Record<keyof PlanLimits, number> = {
    maxDocuments: usage.documentsCreated,
    maxStorageMB: usage.storageMBUsed,
    maxChatMessages: usage.chatMessages,
    maxChunks: usage.chunksCreated,
    maxAIRequests: usage.aiRequests,
    maxEmbeddingReqs: usage.embeddingRequests,
    maxMCPExecutions: usage.mcpExecutions,
    maxMembers: 0, // members checked separately
    maxWorkspaces: 0, // workspaces checked separately
  };
  return mapping[metric] ?? 0;
}

/**
 * Check member limit for a workspace.
 */
export async function checkMemberLimit(workspaceId: string): Promise<void> {
  const limits = await getPlanLimits(workspaceId);
  if (limits.maxMembers === UNLIMITED) return;

  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId },
  });

  if (memberCount >= limits.maxMembers) {
    throw new LimitExceededError(
      "maxMembers",
      memberCount,
      limits.maxMembers
    );
  }
}
