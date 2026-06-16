# Entitlements System — Security Audit Report

**Date:** 2026-06-07
**Auditor:** Hermes Agent
**Scope:** Full entitlements system — API enforcement, UI gating, bypass vectors
**Method:** Static code analysis of all 44 API routes + 16 UI pages

---

## Executive Summary

The entitlements system correctly protects the **primary** MCP and Analytics routes but has **critical gaps** in sub-resource routes and **zero UI-level feature gating**. A Free-tier user can bypass MCP restrictions by calling sub-resource endpoints directly. Additionally, 5 of 9 features have **no enforcement at all** — they exist in the database but are never checked.

**Findings:** 2 Critical, 2 High, 5 Medium, 3 Low

---

## Findings

### 🔴 CRITICAL

#### C1: MCP Sub-Resource Routes Bypass Feature Gating

**Routes affected:**
- `GET /api/mcp/servers/:id` — read server details + connected tools
- `PUT /api/mcp/servers/:id` — update server config (name, URL, API key)
- `DELETE /api/mcp/servers/:id` — delete server

**Impact:** Free-tier user can directly manipulate MCP servers via sub-resource URLs even though `GET/POST /api/mcp/servers` is guarded. The parent list/create routes check `requireFeature("mcp")`, but individual server CRUD does not.

**Attack vector:**
```
# Parent route blocked ✓
GET /api/mcp/servers → 403 (requireFeature enforced)

# Sub-resource route NOT blocked ✗
GET /api/mcp/servers/{serverId} → 200 (no feature check)
PUT /api/mcp/servers/{serverId} → 200 (no feature check)
DELETE /api/mcp/servers/{serverId} → 200 (no feature check)
```

**Evidence:** `app/api/mcp/servers/[id]/route.ts` — 3 handlers (GET, PUT, DELETE) have auth check but no `requireFeature` call.

---

#### C2: MCP Tools Enumeration Endpoint Unguarded

**Route:** `GET /api/mcp/tools`

**Impact:** Free-tier user can enumerate all available MCP tools, their names, descriptions, and parameters. This leaks premium feature capabilities and could be used for reconnaissance.

**Attack vector:**
```
GET /api/mcp/tools → 200 (returns full tool list)
```

**Evidence:** `app/api/mcp/tools/route.ts` — only has `auth()` check, no `requireFeature("mcp")`.

---

### 🟠 HIGH

#### H1: Zero UI-Level Feature Gating

**Pages affected:**
- `/settings/mcp` — MCP Settings page renders fully for Free users
- `/analytics/chat` — Chat Analytics page renders fully for Free users
- `/analytics/cost` — Cost Analytics page renders fully for Free users
- `/analytics/usage` — Usage Analytics page renders fully for Free users

**Impact:** Free-tier users can navigate to premium pages and see the full UI. While API calls will fail (returning errors), the pages themselves load and render. This is misleading UX — users see a working page but get cryptic errors on interaction.

**Expected behavior:** Pages should show `<UpgradeBanner>` component when the feature is locked, not render the full page.

**Evidence:** All page components (`app/(admin)/settings/mcp/page.tsx`, `app/analytics/*/page.tsx`) render directly without checking `hasFeature()` or `getWorkspaceFeatures()`.

---

#### H2: EntitlementError Returns HTTP 500 Instead of 403

**Impact:** When `requireFeature()` throws `EntitlementError`, it's caught by generic `catch (error)` blocks in API routes which return `{ status: 500 }`. This makes it impossible for clients to distinguish between "feature not available" (should retry after upgrade) and "server error" (should retry immediately).

**Expected:** HTTP 403 Forbidden with structured error body:
```json
{
  "error": "Feature not available",
  "feature": "mcp",
  "currentPlan": "free",
  "upgradeUrl": "/settings/billing"
}
```

**Evidence:** All 11 guarded routes use generic error handlers:
```typescript
} catch (error) {
  return Response.json({ error: "..." }, { status: 500 });
}
```

---

### 🟡 MEDIUM

#### M1: Team Members Routes Missing `team_members` Feature Check

**Routes affected:**
- `POST /api/workspace/members` — invite member
- `PATCH /api/workspace/members/:id` — change role
- `DELETE /api/workspace/members/:id` — remove member

**Impact:** Free-tier users (max 3 members) can invite/manage members without the `team_members` feature being checked. The routes only check RBAC role (`requireRole("admin")`), not entitlement.

**Note:** The `team_members` feature is enabled on Free tier per current seed data, so this is not currently exploitable. However, if the plan mapping changes (e.g., limiting Free to 1 member), this gap becomes critical.

---

#### M2: 5 Features Defined But Never Enforced

**Features with zero enforcement:**
| Feature | DB Records | API Routes Protected | UI Pages Gated |
|---------|-----------|---------------------|----------------|
| `public_widget` | ✅ Seeded | ❌ None | ❌ None |
| `api_access` | ✅ Seeded | ❌ None | ❌ None |
| `custom_branding` | ✅ Seeded | ❌ None | ❌ None |
| `audit_logs` | ✅ Seeded | ❌ None | ❌ None |
| `sso` | ✅ Seeded | ❌ None | ❌ None |

**Impact:** These features exist in the database and are displayed in the dashboard PlanStatus card, but no code actually checks them. A Free user can use all of these features without restriction.

---

#### M3: Entitlement Cache Not Cleared on Plan Change

**Impact:** After `changePlan()` in `lib/billing.ts`, `clearEntitlementCache()` is never called. Users may see stale entitlements for up to 30 seconds (cache TTL) after upgrading/downgrading.

**Evidence:** `lib/billing.ts` — `changePlan()` updates the subscription but doesn't import or call `clearEntitlementCache()` from `lib/entitlements.ts`.

---

#### M4: No `analytics` Feature Check on Dashboard Routes

**Routes affected:**
- `GET /api/dashboard/cost` — cost analytics data
- `GET /api/dashboard/usage` — usage analytics data

**Impact:** These dashboard routes serve analytics-style data (cost breakdown, usage charts) but don't check the `analytics` feature. Free users get full cost/usage analytics from the dashboard even if the feature were restricted.

---

#### M5: Analytics Events Write Endpoint Unguarded

**Route:** `POST /api/analytics/events`

**Impact:** Free-tier user can write arbitrary analytics events, potentially polluting analytics data or triggering downstream processing. While analytics is enabled on Free tier, write access to the events table should still be gated to prevent abuse.

---

### 🟢 LOW

#### L1: `plan_features` Table Has No RLS

**Impact:** The `plan_features` table is intentionally RLS-free (global config data). However, if a SQL injection vulnerability were found in any route using raw queries, an attacker could read or modify plan features.

**Risk:** Low — Prisma doesn't expose raw table access to client-side code. The table is only accessed through the entitlements service.

---

#### L2: Entitlement Cache is Per-Process

**Impact:** In a multi-instance deployment (e.g., Kubernetes pods), cache invalidation on one instance won't propagate to others. A user who upgrades might still see "feature locked" on requests routed to other instances.

**Risk:** Low — Current deployment is single-instance. Would need Redis-backed cache for multi-instance.

---

#### L3: Free Plan Gets `analytics` Feature

**Impact:** The `analytics` feature is enabled on the Free plan. This means "Advanced Analytics" (chat, cost, usage) is available to all users. If the business intent was to restrict analytics to Pro+, the seed data is incorrect.

**Risk:** Low — This is a business decision, not a security vulnerability. Verify with product owner.

---

## Verification Checklist

| Check | Status | Notes |
|-------|--------|-------|
| MCP primary routes guarded | ✅ | 7/7 handlers in 4 files |
| MCP sub-resource routes guarded | ❌ | 3/3 handlers missing in `[id]/route.ts` |
| MCP tools route guarded | ❌ | 1/1 handler missing |
| Analytics query routes guarded | ✅ | 3/3 handlers in 3 files |
| Analytics write/export routes guarded | ❌ | 2/2 handlers missing |
| Dashboard analytics routes guarded | ❌ | 2/2 handlers missing |
| UI pages feature-gated | ❌ | 0/4 pages checked |
| EntitlementError → HTTP 403 | ❌ | Returns 500 via generic handler |
| Cache cleared on plan change | ❌ | Not implemented |
| team_members enforced | ⚠️ | RBAC only, no feature check |
| public_widget enforced | ❌ | No routes exist yet |
| api_access enforced | ❌ | No routes exist yet |
| custom_branding enforced | ❌ | No routes exist yet |
| audit_logs enforced | ❌ | No routes exist yet |
| sso enforced | ❌ | No routes exist yet |

---

## Recommendations

### Immediate Fixes (Critical)

1. **Add `requireFeature("mcp")` to `app/api/mcp/servers/[id]/route.ts`** — GET, PUT, DELETE handlers
2. **Add `requireFeature("mcp")` to `app/api/mcp/tools/route.ts`** — GET handler

### Short-Term (High)

3. **Add UI feature gating** — Check `hasFeature()` in page components, show `<UpgradeBanner>` when locked
4. **Return HTTP 403 for EntitlementError** — Create a shared error handler that maps `EntitlementError` → 403

### Medium-Term (Medium)

5. **Add `requireFeature("team_members")` to workspace member routes**
6. **Add `requireFeature("analytics")` to dashboard cost/usage routes**
7. **Call `clearEntitlementCache()` in `changePlan()`**
8. **Implement remaining feature enforcement** as routes for `public_widget`, `api_access`, `custom_branding`, `audit_logs`, `sso` are built

---

## Severity Summary

| Severity | Count | IDs |
|----------|-------|-----|
| 🔴 Critical | 2 | C1, C2 |
| 🟠 High | 2 | H1, H2 |
| 🟡 Medium | 5 | M1, M2, M3, M4, M5 |
| 🟢 Low | 3 | L1, L2, L3 |
| **Total** | **12** | |
