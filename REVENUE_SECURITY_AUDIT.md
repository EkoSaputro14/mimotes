# Billing & Revenue Integrity — Security Audit Report

**Date:** 2026-06-07
**Auditor:** Hermes Agent
**Scope:** Full billing stack — subscription lifecycle, plan changes, usage limits, cache, trials, audit trail
**Method:** Static code analysis of billing.ts, usage.ts, entitlements.ts, API routes, middleware

---

## Executive Summary

The billing system has **3 Critical** revenue-impacting vulnerabilities that allow users to retain premium access after cancellation, bypass trial expiration, and change plans without payment verification. The most severe: **canceled subscriptions retain full Pro/Enterprise access indefinitely** because no code checks subscription status when resolving features or limits.

**Findings:** 3 Critical, 4 High, 3 Medium, 2 Low

---

## Findings

### 🔴 CRITICAL

#### C1: Canceled Subscriptions Retain Full Pro Access

**Files:** `lib/billing.ts`, `lib/usage.ts`, `lib/entitlements.ts`

**Impact:** When a user cancels their subscription, `cancelSubscription()` sets `status: "canceled"` but **does not change the `planId`**. All subsequent code that resolves features and limits reads from the plan, not the status:

```typescript
// lib/usage.ts — getPlanLimits()
const sub = await prisma.workspaceSubscription.findUnique({
  where: { workspaceId },
  include: { plan: true },
});
if (sub?.plan) {
  return { maxDocuments: sub.plan.maxDocuments, ... };  // ← reads plan, ignores status
}
```

```typescript
// lib/entitlements.ts — resolvePlanName()
const sub = await prisma.workspaceSubscription.findUnique({
  where: { workspaceId },
  select: { plan: { select: { name: true } } },
});
return sub?.plan?.name || "free";  // ← reads plan, ignores status
```

**Result:** A user who cancels Pro subscription keeps all Pro features (MCP, analytics, etc.) and Pro limits (100 docs, 10GB storage, 50K messages) **forever**.

**Attack vector:**
```
1. Subscribe to Pro (or start trial)
2. Cancel subscription
3. Status = "canceled", but planId still points to "pro"
4. All features, limits, and entitlements remain Pro
5. No code ever checks if status === "canceled"
```

---

#### C2: Trial Expiration Never Enforced

**Files:** `lib/billing.ts`, `lib/usage.ts`, `lib/entitlements.ts`

**Impact:** `startTrial()` sets `trialEndsAt` timestamp but **no code ever checks it**. There is:
- No cron job to downgrade expired trials
- No middleware check for trial expiration
- No check in `getPlanLimits()` or `resolvePlanName()`

```typescript
// lib/usage.ts — getPlanLimits()
// Reads sub.plan — doesn't check trialEndsAt
if (sub?.plan) {
  return { maxDocuments: sub.plan.maxDocuments, ... };
}
```

**Result:** A user who starts a 14-day Pro trial keeps Pro access **indefinitely** — months or years later.

**Attack vector:**
```
1. Start trial → status="trial", trialEndsAt = now + 14 days
2. Wait 30 days
3. Trial expired, but no code enforces expiration
4. Still has Pro features and limits
```

---

#### C3: `changePlan()` Reactivates Canceled Subscriptions

**File:** `lib/billing.ts` — `changePlan()`

**Impact:** `changePlan()` does NOT check subscription status before allowing changes:

```typescript
// lib/billing.ts — changePlan()
const sub = await prisma.workspaceSubscription.findUnique({
  where: { workspaceId },
  include: { plan: true },
});
if (!sub) throw new Error("No active subscription found");
// ← No check for sub.status === "canceled"

// Always sets status to "active" when effectiveDate is not "next_period"
const updated = await prisma.workspaceSubscription.update({
  where: { workspaceId },
  data: {
    planId: newPlan.id,
    status: options.effectiveDate === "next_period" ? sub.status : "active",
    // ← "active" overwrites "canceled"
  },
});
```

**Result:** A canceled user can call `POST /api/workspace/billing` with `action: "change_plan"` to reactivate their subscription and switch plans — without payment.

---

### 🟠 HIGH

#### H1: `cancelSubscription()` Does Not Clear Entitlement Cache

**File:** `lib/billing.ts` — `cancelSubscription()`

**Impact:** `changePlan()` calls `clearEntitlementCache()` after plan changes, but `cancelSubscription()` does NOT. After cancellation, the entitlement cache retains Pro features for up to 30 seconds.

**Note:** This is partially mitigated by C1 (features stay Pro anyway due to plan not changing), but if C1 were fixed, this would become a real window.

---

#### H2: No Payment Verification on Plan Changes

**File:** `app/api/workspace/billing/route.ts`, `lib/billing.ts`

**Impact:** `POST /api/workspace/billing` with `action: "change_plan"` immediately changes the plan without any payment verification. There is no Stripe integration — plan changes are instant and free.

```typescript
// billing/route.ts
const updated = await changePlan(workspaceId, plan, {
  reason: reason || "User requested plan change",
  metadata: { initiatedBy: userId },
});
// ← No payment check, no Stripe session, no invoice creation
```

**Result:** Any admin can switch to Enterprise ($99/month) without paying.

**Note:** This is expected for pre-Stripe foundation, but represents a revenue leak if deployed without Stripe.

---

#### H3: `changePlan()` Effective Date Doesn't Actually Delay Features

**File:** `lib/billing.ts` — `changePlan()`

**Impact:** When `effectiveDate: "next_period"` is passed, the code keeps the old status but **still changes `planId` immediately**:

```typescript
data: {
  planId: newPlan.id,  // ← Changed NOW
  status: options.effectiveDate === "next_period" ? sub.status : "active",
  // ← Status delayed, but plan changes immediately
},
```

Since `getPlanLimits()` and `resolvePlanName()` read from `planId`, features change immediately even when the user intended a next-period change.

---

#### H4: Usage Limits Not Enforced Before Actions

**Files:** `lib/usage.ts`, `app/api/chat/route.ts`, `app/api/documents/route.ts`

**Impact:** `checkLimit()` and `checkLimitWithAmount()` exist but are NOT called in route handlers before tracking usage. The chat route tracks messages without checking limits first:

```typescript
// app/api/chat/route.ts
// Saves user message — no limit check
await prisma.chatMessage.create({ ... });

// Tracks usage — no limit check before
trackChatMessage(workspaceId).catch(() => {});
trackAIRequest(workspaceId).catch(() => {});

// Limit check NEVER called
```

**Result:** Users can exceed their plan limits (documents, chat messages, AI requests) without restriction. The limit enforcement functions exist but are unused.

---

### 🟡 MEDIUM

#### M1: Entitlement Cache Not Process-Safe

**File:** `lib/entitlements.ts`

**Impact:** The entitlement cache is an in-memory `Map`. In a multi-instance deployment:
- Cache invalidation on instance A doesn't propagate to instance B
- After plan change, other instances serve stale features for up to 30s
- After cancellation (which doesn't clear cache at all), stale features persist

---

#### M2: `getUpgradeSuggestions()` Uses Empty Workspace ID

**File:** `lib/billing.ts` — `getUpgradeSuggestions()`

**Impact:** The helper function `getWorkspaceIdForPlan()` returns an empty string:

```typescript
async function getWorkspaceIdForPlan(_planName: string): Promise<string> {
  return "";  // ← Always empty
}
```

This means `getPlanLimits("")` is called, which falls back to free tier defaults — not the actual next plan's limits. Upgrade suggestions compare against wrong limits.

---

#### M3: No Rate Limiting on Billing Actions

**File:** `app/api/workspace/billing/route.ts`

**Impact:** The billing POST route has no rate limiting. An admin could spam plan changes, creating many subscription events and potentially causing race conditions.

---

#### M4: `changePlan()` Missing Workspace Ownership Check

**File:** `lib/billing.ts` — `changePlan()`

**Impact:** `changePlan()` accepts any `workspaceId` without verifying the caller owns it. While the API route (`billing/route.ts`) resolves workspace from the authenticated user, the function itself is unprotected. If called from another context (e.g., admin route, script), it could modify any workspace's subscription.

---

### 🟢 LOW

#### L1: No Idempotency on Plan Changes

**File:** `lib/billing.ts` — `changePlan()`

**Impact:** Rapid repeated calls to `changePlan()` create multiple `SubscriptionEvent` records. No deduplication or idempotency key.

---

#### L2: Invoice Number Collision Risk

**File:** `lib/billing.ts` — `getNextInvoiceNumber()`

**Impact:** Invoice numbers are generated using `count + 1`. If two requests generate invoices simultaneously, they could get the same number. The `@unique` constraint would catch this, but the error handling isn't graceful.

---

## Verification Answers

| # | Question | Answer | Severity |
|---|----------|--------|----------|
| 1 | Can a user manually change plan? | ✅ Yes — via `POST /api/workspace/billing` (admin role required) | Low (by design) |
| 2 | Can a user bypass subscription status? | 🔴 Yes — `changePlan()` doesn't check status, reactivates canceled | **Critical** |
| 3 | Can canceled subscription retain Pro access? | 🔴 Yes — planId not changed on cancel, all code reads plan not status | **Critical** |
| 4 | Can usage limits be bypassed? | 🟠 Yes — `checkLimit()` exists but is never called in routes | **High** |
| 5 | Can cache inconsistencies grant premium features? | 🟠 Yes — cancel doesn't clear cache, multi-instance stale | **High** |
| 6 | Can expired trials keep premium access? | 🔴 Yes — no expiration mechanism exists | **Critical** |
| 7 | Are plan changes properly audited? | ✅ Yes — `recordSubscriptionEvent()` called in all lifecycle functions | OK |

---

## Recommendations

### Immediate (Critical)

1. **Check subscription status in `getPlanLimits()` and `resolvePlanName()`** — treat `canceled` status as free tier:
```typescript
if (sub?.plan && sub.status !== "canceled") {
  return { ...sub.plan };
}
return DEFAULT_LIMITS.free;
```

2. **Add trial expiration check** — in `getPlanLimits()`, check `trialEndsAt`:
```typescript
if (sub?.status === "trial" && sub.trialEndsAt && sub.trialEndsAt < new Date()) {
  // Trial expired — downgrade to free
  await prisma.workspaceSubscription.update({
    where: { workspaceId },
    data: { status: "expired" },
  });
  return DEFAULT_LIMITS.free;
}
```

3. **Block `changePlan()` for canceled subscriptions** — require re-subscription flow:
```typescript
if (sub.status === "canceled") {
  throw new Error("Cannot change plan on canceled subscription. Please re-subscribe.");
}
```

### Short-Term (High)

4. **Enforce `checkLimit()` in route handlers** — call before tracking usage
5. **Clear entitlement cache in `cancelSubscription()`**
6. **Fix `effectiveDate: "next_period"`** — don't change `planId` until period boundary
7. **Add Stripe payment verification** before plan activation

### Medium-Term (Medium)

8. **Add rate limiting** to billing POST route
9. **Fix `getUpgradeSuggestions()`** — use plan limits directly, not workspace ID
10. **Add workspace ownership check** in `changePlan()`

---

## Severity Summary

| Severity | Count | IDs |
|----------|-------|-----|
| 🔴 Critical | 3 | C1, C2, C3 |
| 🟠 High | 4 | H1, H2, H3, H4 |
| 🟡 Medium | 4 | M1, M2, M3, M4 |
| 🟢 Low | 2 | L1, L2 |
| **Total** | **13** | |
