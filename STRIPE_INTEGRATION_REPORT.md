# Stripe Integration — Implementation Report

**Date:** 2026-06-07
**Status:** ✅ Complete
**Packages:** stripe@latest, @stripe/stripe-js@latest

---

## Overview

Full Stripe subscription billing integration for Mimotes. Supports Checkout Sessions, Customer Portal, webhook-driven subscription lifecycle, and entitlement sync.

## Schema Changes

### `workspace_subscriptions` table — new columns:

```sql
stripe_customer_id       VARCHAR(255) UNIQUE
stripe_subscription_id   VARCHAR(255) UNIQUE
stripe_price_id          VARCHAR(255)
stripe_current_period_end TIMESTAMP
cancel_at_period_end     BOOLEAN DEFAULT false
```

Indexes added: `idx_ws_stripe_customer`, `idx_ws_stripe_sub`

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/stripe.ts` | Stripe client (lazy init), checkout/portal/webhook helpers, price mapping, plan catalog |
| `app/api/billing/checkout/route.ts` | POST — create Stripe Checkout Session; GET — list available plans |
| `app/api/billing/portal/route.ts` | POST — create Customer Portal session |
| `app/api/billing/webhook/route.ts` | POST — handle all 5 Stripe webhook events |

## Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added Stripe fields to WorkspaceSubscription |
| `.env.example` | Added Stripe env vars |

---

## Architecture

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
              │ 1. Verify sig│
              │ 2. Idempotency│
              │ 3. Process   │
              │ 4. Sync DB   │
              │ 5. Cache bust│
              └──────────────┘
```

---

## Webhook Flow

### checkout.session.completed
```
1. Verify signature
2. Check idempotency (event ID)
3. Extract workspaceId from metadata
4. Retrieve subscription from Stripe
5. Parse price → determine plan
6. Upsert WorkspaceSubscription with Stripe IDs
7. Record SubscriptionEvent
8. Clear entitlement cache
```

### invoice.paid
```
1. Find subscription by stripeSubscriptionId
2. Update period dates
3. Create Payment record
4. Record SubscriptionEvent
5. Clear cache
```

### invoice.payment_failed
```
1. Find subscription by stripeSubscriptionId
2. Set status = "past_due"
3. Record SubscriptionEvent
```

### customer.subscription.updated
```
1. Find subscription by stripeSubscriptionId
2. Parse new plan from price
3. Map Stripe status → internal status
4. Update plan + period dates
5. Record SubscriptionEvent
6. Clear cache
```

### customer.subscription.deleted
```
1. Find subscription by stripeSubscriptionId
2. Downgrade to free plan
3. Set status = "canceled"
4. Clear stripeSubscriptionId
5. Record SubscriptionEvent
6. Clear cache (immediate revocation)
```

---

## Webhook Security

| Layer | Implementation |
|-------|---------------|
| **Signature Verification** | HMAC-SHA256 via `stripe.webhooks.constructEvent()` |
| **Idempotency** | In-memory Set tracks processed event IDs (max 10K) |
| **Raw Body** | `request.text()` preserves exact bytes for signature |
| **Error Handling** | Returns 200 on processing errors (prevents retry loop) |
| **Logging** | All events logged with type + ID for audit |

---

## API Endpoints

### POST /api/billing/checkout
- Creates Stripe Checkout Session
- Body: `{ plan: "pro"|"enterprise", interval: "month"|"year" }`
- Returns: `{ sessionId, url }`
- Requires: admin role

### POST /api/billing/portal
- Creates Stripe Customer Portal session
- Returns: `{ url }`
- Requires: admin role

### POST /api/billing/webhook
- Receives Stripe webhooks
- Verifies signature
- Processes events
- Returns: `{ received: true }`

### GET /api/billing/checkout
- Lists available plans with price IDs
- No auth required

---

## Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (from Stripe Dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...
```

---

## Customer Portal Features

Stripe Customer Portal allows customers to:
- ✅ Update payment method
- ✅ Cancel subscription (at period end)
- ✅ View invoice history
- ✅ Upgrade/downgrade plan
- ✅ View upcoming invoices

---

## Test Scenarios

### 1. Checkout Flow
```
1. POST /api/billing/checkout { plan: "pro", interval: "month" }
2. → Returns Stripe Checkout URL
3. → User completes payment on Stripe
4. → Webhook: checkout.session.completed
5. → WorkspaceSubscription updated: status=active, plan=pro
6. → Entitlement cache cleared
```

### 2. Upgrade Flow
```
1. POST /api/billing/checkout { plan: "enterprise", interval: "month" }
2. → Stripe prorates the change
3. → Webhook: customer.subscription.updated
4. → WorkspaceSubscription: plan=enterprise
```

### 3. Cancellation Flow
```
1. POST /api/billing/portal → Stripe Portal URL
2. → User clicks "Cancel" in portal
3. → Webhook: customer.subscription.updated (cancel_at_period_end=true)
4. → Webhook: customer.subscription.deleted (at period end)
5. → WorkspaceSubscription: plan=free, status=canceled
```

### 4. Payment Failure Flow
```
1. Card expires or insufficient funds
2. → Webhook: invoice.payment_failed
3. → WorkspaceSubscription: status=past_due
4. → Stripe retries payment (up to 4 times)
5. → If all fail: subscription.deleted → downgrade to free
```

### 5. Webhook Security Test
```
1. Send webhook with invalid signature → 401
2. Send duplicate event → idempotent (no double processing)
3. Send event without signature → 400
```

---

## Build Verification

```
npm install → ✅ stripe + @stripe/stripe-js installed
prisma generate → ✅ Client updated with new fields
prisma db push → ✅ Schema applied to database
npx next build → ✅ Clean (0 new errors)
```

---

## Setup Instructions

1. Create Stripe account at https://dashboard.stripe.com
2. Create Products + Prices in Stripe Dashboard
3. Add env vars to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_PRO_MONTHLY=price_...
   ```
4. Configure webhook endpoint in Stripe Dashboard:
   - URL: `https://your-domain.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Deploy and test with Stripe test mode
