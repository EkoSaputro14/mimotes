# Entitlements System — Implementation Report

**Date:** 2026-06-07
**Status:** ✅ Complete

## Overview

Implemented a feature-gating entitlements system that controls product features by subscription plan. Features are checked at the API level and displayed in the dashboard UI.

## Files Created

| File | Purpose |
|------|---------|
| `lib/entitlements.ts` | Entitlement service — `hasFeature()`, `requireFeature()`, `getWorkspaceFeatures()`, `EntitlementError` class, feature cache |
| `components/workspace/upgrade-banner.tsx` | Client component — lock icon + "Upgrade to Pro" CTA for locked features |
| `components/workspace/plan-status.tsx` | Server component — dashboard card showing current plan, enabled/locked features |
| `prisma/seed-entitlements.ts` | Seed script for plan features (alternative to SQL seed) |

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `PlanFeature` model + relation to `SubscriptionPlan` |
| `app/api/mcp/route.ts` | Added `requireFeature(workspaceId, "mcp")` to POST, GET, DELETE |
| `app/api/mcp/call/route.ts` | Added `requireFeature(workspaceId, "mcp")` to POST |
| `app/api/mcp/connect/route.ts` | Added `requireFeature(workspaceId, "mcp")` to POST, DELETE |
| `app/api/mcp/servers/route.ts` | Added `requireFeature(workspaceId, "mcp")` to GET, POST |
| `app/api/analytics/chat/route.ts` | Added `requireFeature(workspaceId, "analytics")` to GET |
| `app/api/analytics/cost/route.ts` | Added `requireFeature(workspaceId, "analytics")` to GET |
| `app/api/analytics/usage/route.ts` | Added `requireFeature(workspaceId, "analytics")` to GET |
| `app/dashboard/page.tsx` | Added `PlanStatus` component + `PlanStatusWrapper` |

## Database Schema

### New Table: `plan_features`

```sql
CREATE TABLE plan_features (
  id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  plan_id    TEXT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature    VARCHAR(50) NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, feature)
);
```

**RLS:** Disabled (global config table, not tenant-specific data)

## Feature-to-Plan Mapping

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| `analytics` | ✅ | ✅ | ✅ |
| `mcp` | ❌ | ✅ | ✅ |
| `public_widget` | ❌ | ✅ | ✅ |
| `api_access` | ❌ | ✅ | ✅ |
| `custom_branding` | ❌ | ✅ | ✅ |
| `team_members` | ❌ | ✅ | ✅ |
| `priority_support` | ❌ | ✅ | ✅ |
| `audit_logs` | ❌ | ❌ | ✅ |
| `sso` | ❌ | ❌ | ✅ |

## API Routes Protected

| Route | Feature | Handler |
|-------|---------|---------|
| `POST /api/mcp` | `mcp` | MCP server transport |
| `GET /api/mcp` | `mcp` | MCP server transport |
| `DELETE /api/mcp` | `mcp` | MCP server transport |
| `POST /api/mcp/call` | `mcp` | Tool execution |
| `POST /api/mcp/connect` | `mcp` | Connect all servers |
| `DELETE /api/mcp/connect` | `mcp` | Disconnect all servers |
| `GET /api/mcp/servers` | `mcp` | List servers |
| `POST /api/mcp/servers` | `mcp` | Create server |
| `GET /api/analytics/chat` | `analytics` | Chat analytics |
| `GET /api/analytics/cost` | `analytics` | Cost analytics |
| `GET /api/analytics/usage` | `analytics` | Usage analytics |

## Entitlement Service API

```typescript
// Check if feature is available
const ok = await hasFeature(workspaceId, "mcp");

// Require feature (throws EntitlementError if not available)
await requireFeature(workspaceId, "mcp");

// Get all features split by availability
const { enabled, disabled } = await getWorkspaceFeatures(workspaceId);

// Get current plan name
const plan = await getWorkspacePlan(workspaceId);

// Clear cache after plan change
clearEntitlementCache(workspaceId);
```

## Error Handling

When a locked feature is accessed, the API returns:

```json
{
  "error": "Feature \"mcp\" is not available on the free plan. Upgrade to unlock this feature."
}
```

HTTP Status: `500` (via EntitlementError caught in existing error handlers)

## Dashboard UI

- **Plan Status Card** — shows current plan badge (Free/Pro/Enterprise), enabled features (green checkmarks), locked features (gray lock icons), and "Upgrade Plan" link
- **Upgrade Banner** — reusable client component for showing lock + CTA on any page

## Verification Results

- ✅ Prisma schema valid — `npx prisma generate` succeeded
- ✅ TypeScript build — `npx next build` succeeded (0 new errors)
- ✅ Database table created — `plan_features` with 27 rows (9 features × 3 plans)
- ✅ RLS — intentionally OFF (global config, not tenant data)
- ✅ App running on port 3100 — HTTP 200 OK
- ✅ Seeded data verified — all 3 plans have correct feature assignments

## Architecture Decisions

1. **DB-first with fallback defaults** — Features stored in `plan_features` table, with in-code defaults as fallback when no DB records exist
2. **Per-request cache** — 30-second TTL Map cache to avoid repeated DB queries within a request
3. **No RLS on plan_features** — This is global configuration data shared across all tenants, not per-tenant data
4. **EntitlementError pattern** — Follows existing `PermissionError` (rbac.ts) and `LimitExceededError` (usage.ts) patterns
5. **Graceful degradation** — If no subscription exists, workspace is treated as "free" tier
