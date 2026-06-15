# Stripe Integration — Security Audit Report

**Date:** 2026-06-07
**Status:** ⚠️ 3 Critical, 5 High, 5 Medium, 3 Low
**Scope:** Webhook security, idempotency, payment integrity, subscription lifecycle, multi-instance safety
**Files Audited:** 6 (lib/stripe.ts, app/api/billing/webhook/route.ts, app/api/billing/checkout/route.ts, app/api/billing/portal/route.ts, lib/billing.ts, lib/entitlements.ts)

---

## Executive Summary

The Stripe integration has a **solid security foundation** (HMAC-SHA256 signature verification, idempotency tracking, RBAC enforcement) but contains **3 critical production-blocking bugs** and **5 high-severity issues** that must be resolved before going live. The most severe is a foreign key mismatch in the `invoice.paid` handler that will crash every successful payment webhook.

**Severity Distribution:**
- 🔴 Critical: 3 (C1, C2, C3)
- 🟠 High: 5 (H1, H2, H3, H4, H5)
- 🟡 Medium: 5 (M1, M2, M3, M4, M5)
- 🟢 Low: 3 (L1, L2, L3)

---

## 🔴 Critical Findings

### C1 — Foreign Key Crash in `invoice.paid` Handler
**File:** `app/api/billing/webhook/route.ts:209`
**Category:** Payment Integrity
**Impact:** Every successful payment webhook crashes with a Prisma foreign key constraint violation

```js
// BUG: sub.id is WorkspaceSubscription.id, NOT Invoice.id
await prisma.payment.create({
  data: {
    invoiceId: sub.id, // ← WRONG: references WorkspaceSubscription, not Invoice
    ...
  }
});
```

**Why it crashes:** `Payment.invoiceId` has a foreign key to `Invoice.id`. `sub.id` is a `WorkspaceSubscription.id`. Prisma will throw `P2003: Foreign key constraint failed` because no `Invoice` record has that UUID.

**Consequence:** Payment records are never created. The billing dashboard shows zero payment history. Stripe continues retrying the webhook, but every attempt fails with 200 (processing error), creating a silent failure loop.

**Fix:** Either (a) create an `Invoice` record from the Stripe invoice data before creating the `Payment`, or (b) make `Payment.invoiceId` nullable and store the Stripe invoice ID separately.

---

### C2 — Checkout Success Page Missing
**File:** `app/api/billing/checkout/route.ts:63`
**Category:** Subscription Lifecycle
**Impact:** Users completing Stripe Checkout land on a 404 page

```js
successUrl: `${baseUrl}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
```

There is no `app/settings/billing/page.tsx` or any billing page. After completing payment on Stripe, the user is redirected to a non-existent URL. The subscription IS activated via webhook, but the user sees a broken page with no confirmation.

**Consequence:** Confusion, support tickets, potential churn. Users think payment failed when it succeeded.

**Fix:** Create `app/settings/billing/page.tsx` that displays current plan status and confirms recent checkout.

---

### C3 — Silent Webhook Failure on Processing Errors
**File:** `app/api/billing/webhook/route.ts:84-89`
**Category:** Webhook Security
**Impact:** Stripe events lost permanently on transient failures

```js
} catch (error) {
  console.error(`[Webhook] Error processing ${event.type}:`, error);
  // Return 200 to prevent Stripe retry loop for processing errors
  return NextResponse.json({ received: true, error: "Processing error" });
}
```

**Why it's critical:** Returning HTTP 200 tells Stripe "event processed successfully." Stripe will never retry. But if the error was:
- Database timeout (transient)
- Stripe API rate limit (transient)
- Network hiccup (transient)

The event is **permanently lost**. The subscription state diverges from Stripe.

**Consequence:** User pays but subscription never activates. No retry, no recovery. Revenue collected but service not delivered.

**Fix:** Distinguish transient errors (return 500 → Stripe retries) from permanent errors (return 200 → don't retry). Add a dead-letter queue or admin notification for failed events.

---

## 🟠 High Findings

### H1 — In-Memory Idempotency Lost on Restart
**File:** `app/api/billing/webhook/route.ts:9-21`
**Category:** Idempotency
**Impact:** Duplicate processing after server restart

```js
const processedEvents = new Set<string>(); // In-memory only
```

If the server crashes or redeploys between receiving and fully processing a webhook, the `processedEvents` Set is wiped. Stripe retries the event → duplicate processing.

**Mitigated by:** `checkout.session.completed` uses `upsert` (idempotent DB operation).
**NOT mitigated by:** `invoice.paid` creates a `Payment` record (no uniqueness constraint on `stripePaymentId`). Duplicate payments will be recorded.

**Fix:** Add a unique index on `Payment.stripePaymentId` and use `findFirst` + conditional create pattern, or use DB-level event deduplication.

---

### H2 — No DB-Level Event Deduplication (Replay Protection)
**File:** `app/api/billing/webhook/route.ts:50-53`
**Category:** Event Replay Protection
**Impact:** Stale/replayed events processed without DB check

The `stripeEventId` is recorded in `SubscriptionEvent` after processing but **never checked before processing**. The only deduplication is the in-memory Set.

**Attack scenario:** An attacker who captures a Stripe webhook payload (e.g., from logs) could replay it after a server restart. The in-memory check passes, and the event is processed again.

**Fix:** Check `SubscriptionEvent.stripeEventId` exists before processing:

```js
const existing = await prisma.subscriptionEvent.findFirst({
  where: { stripeEventId: event.id }
});
if (existing) return { received: true, idempotent: true };
```

---

### H3 — Multi-Instance Concurrency (No Distributed Lock)
**File:** `app/api/billing/webhook/route.ts`
**Category:** Multi-Instance Deployment Safety
**Impact:** Race conditions under horizontal scaling

Each Next.js instance has its own `processedEvents` Set. Two instances processing the same event concurrently:
1. Both pass idempotency check (different in-memory Sets)
2. Both execute the handler
3. Last write wins on DB updates
4. Duplicate `SubscriptionEvent` records created

**Production risk:** If deploying behind a load balancer or using serverless functions (Vercel, AWS Lambda), this WILL happen.

**Fix:** Use `SELECT ... FOR UPDATE` or an advisory lock before processing, or implement a DB-level outbox pattern.

---

### H4 — Customer ID Race Condition
**File:** `lib/stripe.ts:79-116`
**Category:** Payment Integrity
**Impact:** Orphaned Stripe customers on concurrent checkout

```js
export async function getOrCreateStripeCustomer(...) {
  const sub = await prisma.workspaceSubscription.findUnique(...);
  if (sub?.stripeCustomerId) return sub.stripeCustomerId;
  // Race window: two requests both find null, both create customer
  const customer = await stripe.customers.create(...);
  await prisma.workspaceSubscription.upsert(...);
}
```

Two concurrent checkout requests for the same workspace can both see `stripeCustomerId = null`, both create a Stripe customer, and the second `upsert` overwrites the first. Result: an orphaned Stripe customer that will never be billed.

**Fix:** Use a unique constraint + catch duplicate key error, or use `findUnique` + `update` with a conditional where clause.

---

### H5 — Silent Plan Fallback to "pro"
**File:** `app/api/billing/webhook/route.ts:120,287`
**Category:** Subscription Lifecycle
**Impact:** Unknown price IDs silently activate "pro" plan

```js
const planName = parsed?.plan || "pro"; // ← fallback to "pro"
```

If `parseStripePriceId` returns `null` (unknown price ID, typo in env config, future Stripe price change), the subscription is silently set to "pro". This grants access the user didn't pay for.

**Fix:** Return 400/log error for unrecognized price IDs instead of defaulting to "pro".

---

## 🟡 Medium Findings

### M1 — Entitlement Cache Not Distributed
**File:** `lib/entitlements.ts:47-63`
**Category:** Multi-Instance Deployment Safety
**Impact:** Stale entitlements after plan change

After a webhook updates a subscription, only the instance that processed the webhook clears its entitlement cache. Other instances continue serving old entitlements for up to 30 seconds (the `CACHE_TTL`).

**User impact:** After upgrading, the user may still see "feature not available" for up to 30 seconds on other instances.

**Fix:** Use Redis pub/sub or a cache invalidation broadcast when running multiple instances.

---

### M2 — Invoice Number Collision Under Concurrency
**File:** `lib/billing.ts:118-122`
**Category:** Invoice Persistence
**Impact:** Duplicate invoice numbers crash with unique constraint

```js
async function getNextInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  return `INV-${period}-${String(count + 1).padStart(4, "0")}`;
}
```

Two concurrent calls get the same `count`, generate the same `invoiceNumber`, and the second crashes with a unique constraint violation.

**Fix:** Use a database sequence or atomic counter.

---

### M3 — Missing `invoice.created` / `invoice.finalized` Handlers
**File:** `app/api/billing/webhook/route.ts`
**Category:** Invoice Persistence
**Impact:** No local invoice records from Stripe

The webhook handler only processes `invoice.paid` and `invoice.payment_failed`. There's no handler for `invoice.created` or `invoice.finalized`, so Stripe invoices are never synced to the local `Invoice` model.

**Consequence:** The billing dashboard shows no invoice history. `getBillingSummary()` returns an empty `invoices` array.

**Fix:** Add `invoice.created` handler that creates a local Invoice record from Stripe's invoice data.

---

### M4 — No Stripe API Retry Logic
**File:** `lib/stripe.ts` (all Stripe API calls)
**Category:** Webhook Security
**Impact:** Transient Stripe API failures crash webhook processing

Stripe API calls (`subscriptions.retrieve()`, etc.) have no retry logic. A transient 429 (rate limit) or 500 (Stripe outage) crashes the handler, which returns 200 (per C3), permanently losing the event.

**Fix:** Add exponential backoff retry for transient Stripe API errors (429, 500, 502, 503).

---

### M5 — Unknown Stripe Statuses Default to "active"
**File:** `app/api/billing/webhook/route.ts:293-302`
**Category:** Subscription Lifecycle
**Impact:** Unknown statuses grant access

```js
const statusMap: Record<string, string> = {
  active: "active",
  past_due: "past_due",
  // ...
};
const newStatus = statusMap[subscription.status] || "active"; // ← fallback
```

If Stripe introduces a new status (e.g., `incomplete_expired`, `trialing` variants), the fallback defaults to `"active"`, granting full access.

**Fix:** Log unknown statuses and default to `"past_due"` (restrictive) instead of `"active"` (permissive).

---

## 🟢 Low Findings

### L1 — No IP Allowlist for Webhooks
**File:** `app/api/billing/webhook/route.ts`
**Category:** Webhook Security
**Impact:** Theoretical IP spoofing risk

Stripe recommends checking source IPs against [their published ranges](https://stripe.com/files/ips/ips.txt). Currently only HMAC signature is verified. While signature verification is the primary security, IP allowlist is defense-in-depth.

**Risk:** Low — HMAC-SHA256 is cryptographically secure. IP spoofing without the signing key is impractical.

---

### L2 — Error Log May Leak Signature Details
**File:** `app/api/billing/webhook/route.ts:45`
**Category:** Webhook Security
**Impact:** Stripe signature/token details in application logs

```js
console.error("Webhook signature verification failed:", error);
```

The Stripe SDK error object may include details about the expected vs. received signature. If logs are shipped to external services, this could leak partial signature data.

**Fix:** Log only `"Webhook signature verification failed"` without the error details.

---

### L3 — `cancelStripeSubscription` Bypasses Period-End
**File:** `lib/stripe.ts:218-222`
**Category:** Cancellation Flow
**Impact:** Function exists for immediate cancellation

```js
export async function cancelStripeSubscription(stripeSubscriptionId) {
  return stripe.subscriptions.cancel(stripeSubscriptionId); // Immediate cancel
}
```

This function isn't exposed via any API route (cancellation goes through Customer Portal), but it exists in the library. If called directly, it immediately revokes access without prorating.

**Fix:** Add a comment warning, or remove the function if not needed.

---

## Verification Matrix

### Duplicate Webhook Handling
| Scenario | Result | Risk |
|----------|--------|------|
| Same event, same process | ✅ Blocked by in-memory Set | None |
| Same event, different process | ❌ Both process (H3) | HIGH |
| Same event, after restart | ❌ Both process (H1) | HIGH |
| Stripe retry (same event ID) | ✅ Blocked by in-memory Set | None |

### Database Failures During Webhook Processing
| Scenario | Result | Risk |
|----------|--------|------|
| DB timeout in `invoice.paid` | Returns 200, event lost (C3) | CRITICAL |
| DB constraint violation (C1) | Returns 200, event lost | CRITICAL |
| DB connection refused | Returns 200, event lost | HIGH |
| DB partial write (commit fails) | Returns 200, partial state | HIGH |

### Race Conditions
| Scenario | Result | Risk |
|----------|--------|------|
| Concurrent `checkout.session.completed` | Duplicate Stripe customers (H4) | HIGH |
| Concurrent `invoice.paid` + `subscription.updated` | Last-write-wins (H3) | HIGH |
| Concurrent checkout requests | Duplicate customer creation (H4) | HIGH |

### Replay Attacks
| Scenario | Result | Risk |
|----------|--------|------|
| Replay within same process | ✅ Blocked by idempotency Set | None |
| Replay after restart | ❌ Not blocked (no DB check) (H2) | HIGH |
| Replay from log capture | ❌ Not blocked (H2) | MEDIUM |

### Stale Entitlement Cache
| Scenario | Result | Risk |
|----------|--------|------|
| Plan change on same instance | ✅ Cache cleared | None |
| Plan change, request on different instance | Stale for up to 30s (M1) | MEDIUM |
| Plan downgrade, concurrent request | May use old entitlements (M1) | MEDIUM |

### Subscription Synchronization
| Scenario | Result | Risk |
|----------|--------|------|
| Stripe active → DB active | ✅ Synced | None |
| Stripe canceled → DB free | ✅ Synced | None |
| Unknown Stripe status | Defaults to "active" (M5) | MEDIUM |
| Unknown price ID | Defaults to "pro" (H5) | HIGH |

---

## Recommended Priority

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 P0 | C1 — Fix FK crash in `invoice.paid` | 2h | Payment recording broken |
| 🔴 P0 | C3 — Differentiate transient vs permanent errors | 3h | Events permanently lost |
| 🔴 P0 | C2 — Create billing success page | 2h | User experience broken |
| 🟠 P1 | H1 — DB-level event deduplication | 3h | Duplicate payments |
| 🟠 P1 | H2 — Check `stripeEventId` before processing | 1h | Replay protection |
| 🟠 P1 | H3 — Distributed lock for multi-instance | 4h | Race conditions |
| 🟠 P1 | H4 — Fix customer creation race | 2h | Orphaned Stripe customers |
| 🟠 P1 | H5 — Fail on unknown price IDs | 1h | Wrong plan activation |
| 🟡 P2 | M1 — Distributed cache invalidation | 3h | Stale entitlements |
| 🟡 P2 | M3 — Add `invoice.created` handler | 2h | No invoice history |
| 🟡 P2 | M4 — Add Stripe API retry logic | 2h | Transient failures |
| 🟡 P2 | M5 — Default unknown status to restrictive | 0.5h | Access bypass |
| 🟡 P2 | M2 — Atomic invoice number generation | 1h | Concurrent crash |
| 🟢 P3 | L1 — Add IP allowlist | 1h | Defense-in-depth |
| 🟢 P3 | L2 — Sanitize error logs | 0.5h | Log leakage |
| 🟢 P3 | L3 — Document/improve cancel function | 0.5h | Misuse risk |

---

## Architecture Diagram — Current Flow

```
┌─────────────┐    Checkout     ┌──────────────┐
│   Frontend   │ ──────────────→ │ /api/billing  │
│              │ ←────────────── │  /checkout    │
│              │   session.url   └──────────────┘
│              │
│              │    Portal       ┌──────────────┐
│              │ ──────────────→ │ /api/billing  │
│              │ ←────────────── │  /portal      │
│              │   session.url   └──────────────┘
└─────────────┘
                      │
                      ▼
              ┌──────────────┐
              │    Stripe     │
              │   (external)  │
              └──────┬───────┘
                     │ Webhook
                     ▼
              ┌──────────────┐
              │ /api/billing  │
              │  /webhook     │
              │              │
              │ 1. Verify sig│ ← ✅ Working
              │ 2. Idempotency│ ← ⚠️ In-memory only (H1/H2)
              │ 3. Process   │ ← ❌ Silent failure (C3)
              │ 4. Sync DB   │ ← ❌ FK crash (C1)
              │ 5. Cache bust│ ← ⚠️ Per-process only (M1)
              └──────────────┘
```

---

## Webhook Security Summary

| Layer | Status | Notes |
|-------|--------|-------|
| **Signature Verification** | ✅ Working | HMAC-SHA256 via `constructEvent()` |
| **Idempotency** | ⚠️ Partial | In-memory Set, lost on restart (H1) |
| **DB Deduplication** | ❌ Missing | No `stripeEventId` check before processing (H2) |
| **Error Handling** | ❌ Broken | All errors return 200 (C3) |
| **IP Allowlist** | ❌ Missing | Signature-only verification (L1) |
| **Dead Letter Queue** | ❌ Missing | No failed event recovery |
| **Retry Logic** | ❌ Missing | No Stripe API retries (M4) |
| **Multi-Instance** | ❌ Broken | No distributed locks (H3) |

---

*Generated: 2026-06-07 | Auditor: Hermes Agent | Method: Static code analysis + schema review*
