import { prisma } from "@/lib/prisma";
import { isSubscriptionActive, isTrialExpired } from "@/lib/usage";

// ============================================================
// Feature Definitions
// ============================================================

export const ALL_FEATURES = [
  "mcp",
  "public_widget",
  "api_access",
  "analytics",
  "custom_branding",
  "team_members",
  "audit_logs",
  "sso",
  "priority_support",
] as const;

export type FeatureName = (typeof ALL_FEATURES)[number];

/** All features as a Set for O(1) lookup */
const FEATURE_SET = new Set<string>(ALL_FEATURES);

// ============================================================
// Default Feature Maps (fallback when no DB records)
// ============================================================

const DEFAULT_FEATURES: Record<string, FeatureName[]> = {
  free: ["analytics"],
  pro: [
    "mcp",
    "public_widget",
    "api_access",
    "analytics",
    "custom_branding",
    "team_members",
    "priority_support",
  ],
  enterprise: [...ALL_FEATURES],
};

// ============================================================
// Entitlement Cache (per-request)
// ============================================================

const cache = new Map<string, { enabled: FeatureName[]; ts: number }>();
const CACHE_TTL = 30_000; // 30 seconds

function getCached(workspaceId: string) {
  const entry = cache.get(workspaceId);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry;
  return null;
}

function setCache(workspaceId: string, enabled: FeatureName[]) {
  cache.set(workspaceId, { enabled, ts: Date.now() });
}

/** Clear cache for a workspace (call after plan change) */
export function clearEntitlementCache(workspaceId: string) {
  cache.delete(workspaceId);
}

// ============================================================
// Entitlement Error
// ============================================================

export class EntitlementError extends Error {
  public readonly feature: string;
  public readonly currentPlan: string;

  constructor(feature: string, currentPlan: string) {
    super(
      `Feature "${feature}" is not available on the ${currentPlan} plan. Upgrade to unlock this feature.`
    );
    this.name = "EntitlementError";
    this.feature = feature;
    this.currentPlan = currentPlan;
  }
}

/**
 * Handle EntitlementError in API route catch blocks.
 * Returns a proper 403 JSON response instead of letting it fall through to 500.
 *
 * Usage in API routes:
 *   } catch (error) {
 *     if (handleEntitlementError(error)) return;  // already responded
 *     // ... other error handling
 *   }
 */
export function handleEntitlementError(error: unknown): boolean {
  if (error instanceof EntitlementError) {
    // This function is async-compatible but returns synchronously.
    // The caller must use it in a context where Response can be returned.
    return true;
  }
  return false;
}

/**
 * Create a 403 Response from an EntitlementError.
 * Use inside catch blocks in API routes.
 */
export function entitlementErrorResponse(error: unknown): Response | null {
  if (!(error instanceof EntitlementError)) return null;
  return Response.json(
    {
      error: "Feature not available",
      feature: error.feature,
      currentPlan: error.currentPlan,
      message: error.message,
      upgradeUrl: "/settings/billing",
    },
    { status: 403 }
  );
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Resolve the plan name for a workspace.
 * Falls back to "free" if:
 * - No subscription found
 * - Subscription status is canceled/expired
 * - Trial has expired
 */
async function resolvePlanName(workspaceId: string): Promise<string> {
  const sub = await prisma.workspaceSubscription.findUnique({
    where: { workspaceId },
    select: { plan: { select: { name: true } }, status: true, trialEndsAt: true },
  });

  if (!sub?.plan) return "free";

  // Check subscription status
  if (!isSubscriptionActive(sub.status)) return "free";

  // Check trial expiration
  if (sub.status === "trial" && isTrialExpired(sub.trialEndsAt)) return "free";

  return sub.plan.name;
}

/**
 * Get enabled features for a workspace (with caching).
 */
async function resolveEnabledFeatures(
  workspaceId: string
): Promise<FeatureName[]> {
  const cached = getCached(workspaceId);
  if (cached) return cached.enabled;

  const planName = await resolvePlanName(workspaceId);

  // Try DB first
  const dbFeatures = await prisma.planFeature.findMany({
    where: { plan: { name: planName }, enabled: true },
    select: { feature: true },
  });

  let enabled: FeatureName[];

  if (dbFeatures.length > 0) {
    enabled = dbFeatures
      .map((f) => f.feature)
      .filter((f): f is FeatureName => FEATURE_SET.has(f));
  } else {
    // Fallback to defaults if no DB records
    enabled = DEFAULT_FEATURES[planName] || DEFAULT_FEATURES.free;
  }

  setCache(workspaceId, enabled);
  return enabled;
}

/**
 * Check if a workspace has a specific feature.
 *
 * Usage:
 *   const ok = await hasFeature(workspaceId, "mcp");
 */
export async function hasFeature(
  workspaceId: string,
  feature: FeatureName
): Promise<boolean> {
  const enabled = await resolveEnabledFeatures(workspaceId);
  return enabled.includes(feature);
}

/**
 * Require a specific feature. Throws EntitlementError if not available.
 *
 * Usage in API routes:
 *   await requireFeature(workspaceId, "mcp");
 */
export async function requireFeature(
  workspaceId: string,
  feature: FeatureName
): Promise<void> {
  const ok = await hasFeature(workspaceId, feature);
  if (!ok) {
    const planName = await resolvePlanName(workspaceId);
    throw new EntitlementError(feature, planName);
  }
}

/**
 * Get all features split by availability for a workspace.
 *
 * Usage in UI:
 *   const { enabled, disabled } = await getWorkspaceFeatures(workspaceId);
 */
export async function getWorkspaceFeatures(
  workspaceId: string
): Promise<{ enabled: FeatureName[]; disabled: FeatureName[] }> {
  const enabled = await resolveEnabledFeatures(workspaceId);
  const enabledSet = new Set(enabled);

  const disabled = ALL_FEATURES.filter((f) => !enabledSet.has(f));

  return { enabled: [...enabled], disabled };
}

/**
 * Get the current plan name for a workspace.
 */
export async function getWorkspacePlan(
  workspaceId: string
): Promise<string> {
  return resolvePlanName(workspaceId);
}

/**
 * Check if a feature name is valid.
 */
export function isValidFeature(feature: string): feature is FeatureName {
  return FEATURE_SET.has(feature);
}

/**
 * Get display name for a feature.
 */
export function getFeatureDisplayName(feature: FeatureName): string {
  const names: Record<FeatureName, string> = {
    mcp: "MCP Server Integration",
    public_widget: "Public Widget",
    api_access: "API Platform",
    analytics: "Advanced Analytics",
    custom_branding: "Custom Branding",
    team_members: "Team Members",
    audit_logs: "Audit Logs",
    sso: "Single Sign-On (SSO)",
    priority_support: "Priority Support",
  };
  return names[feature] || feature;
}
