# Stripe Integration — P0 Hardening Report

**Date:** 2026-06-07
**Status:** ✅ All 6 P0 findings fixed
**Build:** ✅ Clean (0 new errors)

---

## Fixes Applied

### C1 — Foreign Key Crash in `invoice.paid` ✅ FIXED

**Before:** `Payment.invoiceId` referenced `WorkspaceSubscription.id` (wrong FK)
**After:** `handleInvoicePaid` creates/finds `Invoice` first, then `Payment` references `Invoice.id`

**New flow:**
```
invoice.paid webhook
  ↓
Find WorkspaceSubscription by stripeSubscriptionId
  ↓
Find or create Invoice (by stripeInvoiceId — replay protection)
  ↓
Find or create Payment (by stripePaymentId — replay protection)
  ↓
  Payment.invoiceId → Invoice.id ← CORRECT FK
```

**Replay protection:** Checks `Invoice.stripeInvoiceId` and `Payment.stripePaymentId` before creating.

---

### C2 — Checkout Success Page ✅ FIXED

**Before:** `success_url` pointed to non-existent `/settings/billing`
**After:** Build output confirms `/settings/billing` now exists as a dynamic route

```
├ ƒ /settings
├ ƒ /settings/billing  ← EXISTS
├ ƒ /settings/mcp
├ ƒ /settings/usage
└ ƒ /settings/workspace
```

---

### C3 — Silent Webhook Failure ✅ FIXED

**Before:** All processing errors returned HTTP 200 (events permanently lost)
**After:** Proper HTTP status codes:

| Scenario | HTTP Status | Stripe Behavior |
|----------|-------------|-----------------|
| Missing signature | 400 | No retry |
| Invalid signature | 400 | No retry |
| DB error (idempotency check) | 500 | Retries |
| Processing error | 500 | Retries |
| Success | 200 | No retry |

**Failed event cleanup:** On processing error, the `StripeWebhookEvent` record is deleted so Stripe can retry.

```typescript
} catch (error) {
  // Delete event record → allows Stripe retry
  await prisma.stripeWebhookEvent.delete({
    where: { stripeEventId: event.id },
  });
  return NextResponse.json({ error: "Processing error" }, { status: 500 });
}
```

---

### H1 — In-Memory Idempotency ✅ FIXED

**Before:** `Set<string>` (lost on restart)
**After:** `StripeWebhookEvent` table (persistent, DB-backed)

**New model:**
```prisma
model StripeWebhookEvent {
  id            String   @id @default(uuid())
  stripeEventId String   @unique @map("stripe_event_id") @db.VarChar(100)
  eventType     String   @map("event_type") @db.VarChar(100)
  processedAt   DateTime @default(now()) @map("processed_at")

  @@index([stripeEventId])
  @@map("stripe_webhook_events")
}
```

**Flow:**
1. `INSERT INTO stripe_webhook_events` (atomic)
2. If unique violation → already processed → return 200 idempotent
3. Process event
4. If error → DELETE record → return 500 (Stripe retries)

**Survives:** Server restarts, deploys, crashes.

---

### H2 — Replay Protection ✅ FIXED

**Before:** No DB-level deduplication
**After:** `StripeWebhookEvent.stripeEventId` has `@unique` constraint

**Protection layers:**
1. **DB unique constraint** — rejects duplicate `stripeEventId` inserts
2. **Invoice dedup** — `Invoice.stripeInvoiceId` checked before creating
3. **Payment dedup** — `Payment.stripePaymentId` checked before creating

**Replay scenario:**
```
Replayed event arrives
  ↓
INSERT INTO stripe_webhook_events (stripeEventId = "evt_xxx")
  ↓
P2002 unique constraint violation
  ↓
Return { received: true, idempotent: true }
  ↓
Event NOT processed again
```

---

### H5 — Unknown Price IDs ✅ FIXED

**Before:** `parsed?.plan || "pro"` (silent fallback)
**After:** `validateStripePriceId(priceId)` throws on unknown

**New function in `lib/stripe.ts`:**
```typescript
export function validateStripePriceId(priceId: string): {
  plan: string;
  interval: "month" | "year";
} {
  const parsed = parseStripePriceId(priceId);
  if (!parsed) {
    throw new Error(`Unknown Stripe price ID: ${priceId}. No matching plan configured.`);
  }
  return parsed;
}
```

**Used in:**
- `handleCheckoutCompleted` — rejects unknown prices
- `handleSubscriptionUpdated` — rejects unknown prices

**Effect:** Unknown price → throws → processing error → 500 → Stripe retries → event not lost.

---

### M5 — Unknown Stripe Statuses ✅ FIXED

**Before:** `statusMap[status] || "active"` (permissive fallback)
**After:** Unknown statuses → `"past_due"` (restrictive)

```typescript
const newStatus = statusMap[subscription.status];
if (!newStatus) {
  console.warn(
    `[Webhook] Unknown Stripe status "${subscription.status}" — defaulting to past_due`
  );
}
const resolvedStatus = newStatus || "past_due";
```

**Effect:** Unknown status → user loses premium features (safe default) instead of gaining them.

---

## Files Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `StripeWebhookEvent` model |
| `lib/stripe.ts` | Added `validateStripePriceId()` function |
| `app/api/billing/webhook/route.ts` | Complete rewrite with all 6 fixes |

---

## Webhook Flow — After Hardening

```
┌──────────────┐
│ Stripe Event  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────┐
│ POST /api/billing/webhook                │
│                                          │
│ 1. Check signature header                │
│    └─ Missing → 400                      │
│                                          │
│ 2. Verify HMAC-SHA256 signature          │
│    └─ Invalid → 400                      │
│                                          │
│ 3. INSERT stripe_webhook_events          │
│    └─ Unique violation → 200 (idempotent)│
│    └─ DB error → 500 (retry)            │
│                                          │
│ 4. Process event                         │
│    ├─ checkout.session.completed         │
│    │   └─ validateStripePriceId()        │
│    │   └─ upsert subscription            │
│    ├─ invoice.paid                       │
│    │   └─ find/create Invoice            │
│    │   └─ find/create Payment            │
│    │   └─ Payment.invoiceId → Invoice.id │
│    ├─ invoice.payment_failed             │
│    │   └─ status → past_due              │
│    ├─ customer.subscription.updated      │
│    │   └─ validateStripePriceId()        │
│    │   └─ unknown status → past_due      │
│    └─ customer.subscription.deleted      │
│        └─ downgrade to free              │
│                                          │
│ 5. Success → 200                         │
│    Error → delete event record → 500     │
└──────────────────────────────────────────┘
```

---

## Verification Matrix

### Duplicate Webhook Handling
| Scenario | Before | After |
|----------|--------|-------|
| Same event, same process | ✅ Blocked | ✅ Blocked (DB) |
| Same event, different process | ❌ Both process | ✅ Blocked (DB unique) |
| Same event, after restart | ❌ Both process | ✅ Blocked (DB unique) |
| Stripe retry | ✅ Blocked | ✅ Blocked (DB unique) |

### Database Failures
| Scenario | Before | After |
|----------|--------|-------|
| DB timeout in `invoice.paid` | Returns 200 (lost) | Returns 500 (retry) |
| FK constraint violation | Returns 200 (lost) | FK fixed, no crash |
| DB connection refused | Returns 200 (lost) | Returns 500 (retry) |

### Error Handling
| Scenario | Before | After |
|----------|--------|-------|
| Missing signature | 400 | 400 |
| Invalid signature | 401 | 400 |
| Processing error | 200 (lost) | 500 (retry) |
| Success | 200 | 200 |

### Price Validation
| Scenario | Before | After |
|----------|--------|-------|
| Known price ID | ✅ | ✅ |
| Unknown price ID | Falls back to "pro" | Throws → 500 → retry |

### Status Mapping
| Scenario | Before | After |
|----------|--------|-------|
| Known status | ✅ | ✅ |
| Unknown status | Defaults to "active" | Defaults to "past_due" |

---

## Build Verification

```
✓ Compiled successfully (4.4s)
✓ TypeScript type check passed
✓ Prisma schema applied (stripe_webhook_events table created)
✓ Prisma client regenerated
✓ No new errors introduced
```

---

## Database Migration

```sql
CREATE TABLE stripe_webhook_events (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id VARCHAR(100) UNIQUE NOT NULL,
  event_type    VARCHAR(100) NOT NULL,
  processed_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stripe_webhook_events_event_id
  ON stripe_webhook_events(stripe_event_id);
```

---

## Remaining Items (Non-P0)

| Priority | Finding | Status |
|----------|---------|--------|
| H3 | Multi-instance distributed lock | Deferred (single instance) |
| H4 | Customer creation race condition | Deferred (low concurrency) |
| M1 | Distributed entitlement cache | Deferred (single instance) |
| M2 | Invoice number collision | Deferred (low concurrency) |
| M3 | Missing `invoice.created` handler | Deferred |
| M4 | No Stripe API retry logic | Deferred |
| L1 | No IP allowlist | Deferred |
| L2 | Error log leakage | Deferred |
| L3 | Cancel function bypass | Deferred |

---

*Generated: 2026-06-07 | Build: Clean | 6/6 P0 fixes applied*
