# BILLING FOUNDATION REPORT

> Generated: 2026-06-06
> Status: Implementation Complete
> TypeScript: ✅ Zero errors
> Migration: ✅ Applied
> RLS: ✅ Enforced
> Build: Pending Docker verification

---

## 1. Schema Changes

### New Models (4)

#### Invoice

```
invoices
├── id (TEXT PK)
├── workspace_id (TEXT FK → workspaces)
├── invoice_number (VARCHAR UNIQUE)
├── status (VARCHAR) — draft, open, paid, void, uncollectible
├── currency (VARCHAR, default "usd")
├── subtotal (INT, cents)
├── tax (INT, cents)
├── total (INT, cents)
├── period_start (TIMESTAMPTZ)
├── period_end (TIMESTAMPTZ)
├── due_date (TIMESTAMPTZ)
├── paid_at (TIMESTAMPTZ)
├── stripe_invoice_id (VARCHAR)
├── metadata (JSONB)
├── created_at
└── updated_at
```

#### InvoiceLineItem

```
invoice_line_items
├── id (TEXT PK)
├── invoice_id (TEXT FK → invoices)
├── description (VARCHAR)
├── quantity (INT)
├── unit_price (INT, cents)
├── amount (INT, cents)
├── metadata (JSONB)
└── created_at
```

#### Payment

```
payments
├── id (TEXT PK)
├── invoice_id (TEXT FK → invoices)
├── workspace_id (TEXT FK → workspaces)
├── amount (INT, cents)
├── currency (VARCHAR)
├── status (VARCHAR) — pending, succeeded, failed, refunded
├── payment_method (VARCHAR)
├── stripe_payment_id (VARCHAR)
├── paid_at (TIMESTAMPTZ)
├── metadata (JSONB)
├── created_at
└── updated_at
```

#### SubscriptionEvent

```
subscription_events
├── id (TEXT PK)
├── workspace_id (TEXT FK → workspaces)
├── event_type (VARCHAR) — plan_upgraded, plan_downgraded, etc.
├── from_plan (VARCHAR)
├── to_plan (VARCHAR)
├── from_status (VARCHAR)
├── to_status (VARCHAR)
├── reason (TEXT)
├── stripe_event_id (VARCHAR)
├── metadata (JSONB)
└── created_at
```

---

## 2. Service Architecture (`lib/billing.ts`)

### Invoice Management

| Function | Description |
|----------|-------------|
| `createInvoice(workspaceId, params)` | Create invoice with line items |
| `recordPayment(invoiceId, workspaceId, params)` | Record payment, update invoice status |

### Subscription Lifecycle

| Function | Description |
|----------|-------------|
| `changePlan(workspaceId, newPlan, options)` | Upgrade/downgrade with audit trail |
| `cancelSubscription(workspaceId, options)` | Cancel with lifecycle management |
| `startTrial(workspaceId, planName, days)` | Start trial period |
| `recordSubscriptionEvent(workspaceId, params)` | Audit trail for all changes |

### Billing Queries

| Function | Description |
|----------|-------------|
| `getBillingSummary(workspaceId)` | Full billing overview |
| `getUpgradeSuggestions(workspaceId)` | Usage-based recommendations |

### Plan Pricing (Stripe-ready)

```typescript
PLAN_PRICING = {
  free:      { monthly: $0,   yearly: $0    },
  pro:       { monthly: $29,  yearly: $290  },
  enterprise:{ monthly: $99,  yearly: $990  },
}
```

---

## 3. Subscription Lifecycle Diagram

```
                    ┌─────────────┐
                    │   Trial     │
                    │  (14 days)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │ Upgrade    │ Expire     │ Cancel
              ▼            ▼            ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  Active  │  │ Past Due │  │ Canceled │
        │          │  │          │  │          │
        └────┬─────┘  └────┬─────┘  └──────────┘
             │              │
     ┌───────┼───────┐      │
     │       │       │      │
     ▼       ▼       ▼      ▼
  Upgrade  Downgrade  Cancel  Payment
     │       │        │      Recovery
     ▼       ▼        ▼        │
  ┌──────┐ ┌──────┐ ┌──────┐  │
  │ Pro  │ │ Free │ │Free  │  │
  └──────┘ └──────┘ └──────┘  │
                               │
                         ┌─────┘
                         ▼
                    ┌──────────┐
                    │  Active  │
                    └──────────┘
```

### Status Transitions

| From | To | Trigger |
|------|----|---------|
| trial | active | Payment received |
| trial | past_due | Payment failed |
| trial | canceled | User cancels |
| active | past_due | Payment failed |
| active | canceled | User cancels |
| past_due | active | Payment recovered |
| past_due | canceled | Grace period expired |

---

## 4. Plan Upgrade Flow

### Free → Pro

```
1. User clicks "Upgrade to Pro"
2. changePlan(workspaceId, "pro") called
3. Validation: current plan ≠ new plan
4. Update WorkspaceSubscription.plan_id
5. Record SubscriptionEvent (plan_upgraded)
6. Return updated subscription
```

### Pro → Enterprise

```
1. User clicks "Upgrade to Enterprise"
2. changePlan(workspaceId, "enterprise") called
3. Same flow as above
4. Proration calculated at Stripe level (not yet implemented)
```

### Downgrade

```
1. User selects lower plan
2. changePlan() with effectiveDate: "next_period"
3. Subscription stays active until period end
4. New limits apply at next billing cycle
```

---

## 5. Usage-Based Upgrade Suggestions

### Logic

```typescript
if (usage >= 80% of limit) {
  suggestions.push({
    metric: "Documents",
    currentUsage: 8,
    limit: 10,
    percent: 80,
    recommendedPlan: "pro",
    reason: "80% of documents limit used..."
  });
}
```

### Thresholds

| Usage Level | Action |
|-------------|--------|
| < 50% | No suggestion |
| 50-79% | Soft suggestion (info) |
| 80-99% | **Upgrade recommendation** |
| 100% | **Limit enforced** (block upload) |

---

## 6. Admin Billing Dashboard

### Components

| Component | Location |
|-----------|----------|
| `components/workspace/billing-dashboard.tsx` | Full billing overview |
| `app/(admin)/settings/billing/page.tsx` | Settings page |

### Dashboard Sections

1. **Plan & Status** — Current plan, status, trial info
2. **Revenue** — Total paid, invoice count
3. **Usage This Period** — Documents, storage, messages
4. **Upgrade Recommendations** — Usage-based suggestions
5. **Recent Invoices** — List with status, amounts, dates

---

## 7. RLS Updates

### All 4 billing tables have workspace-scoped RLS

| Table | Policies |
|-------|----------|
| invoices | SELECT, INSERT, UPDATE |
| invoice_line_items | SELECT, INSERT (via invoice workspace) |
| payments | SELECT, INSERT |
| subscription_events | SELECT, INSERT |

- FORCE ROW LEVEL SECURITY: ✅ on all 4 tables
- Total billing RLS policies: 9

---

## 8. APIs Created

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/workspace/billing` | ✅ | Full billing summary |
| POST | `/api/workspace/billing` | ✅ admin+ | Change plan or cancel |

### POST Actions

```json
// Change plan
{ "action": "change_plan", "plan": "pro", "reason": "Upgrade" }

// Cancel subscription
{ "action": "cancel", "reason": "No longer needed" }
```

---

## 9. Stripe Integration Plan

### Phase 1: Webhook Handler (Future)

```
POST /api/webhooks/stripe
├── checkout.session.completed → activate subscription
├── invoice.paid → record payment
├── invoice.payment_failed → mark past_due
├── customer.subscription.updated → sync plan changes
└── customer.subscription.deleted → cancel subscription
```

### Phase 2: Checkout Flow (Future)

```
1. User selects plan
2. Create Stripe Checkout Session
3. Redirect to Stripe
4. Webhook confirms payment
5. Activate subscription
```

### Phase 3: Customer Portal (Future)

```
1. User clicks "Manage Billing"
2. Create Stripe Portal Session
3. Redirect to Stripe Portal
4. User manages payment methods
5. Webhook syncs changes
```

### Stripe IDs in Schema

| Model | Stripe Field | Purpose |
|-------|-------------|---------|
| Invoice | `stripe_invoice_id` | Link to Stripe invoice |
| Payment | `stripe_payment_id` | Link to Stripe payment |
| SubscriptionEvent | `stripe_event_id` | Idempotency key |

---

## 10. Migration Strategy

### Migration SQL (`005_add_billing_foundation.sql`)

1. Create `invoices` table
2. Create `invoice_line_items` table
3. Create `payments` table
4. Create `subscription_events` table
5. Enable RLS on all 4 tables
6. Create 9 RLS policies
7. Force RLS on all tables
8. Seed initial subscription events

### Rollback

```sql
DROP TABLE IF EXISTS subscription_events CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_line_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
```

No data loss — new tables only.

---

## 11. Files Created/Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added 4 billing models |
| `lib/billing.ts` | **NEW** — Billing service |
| `app/api/workspace/billing/route.ts` | **NEW** — Billing API |
| `components/workspace/billing-dashboard.tsx` | **NEW** — Dashboard widget |
| `app/(admin)/settings/billing/page.tsx` | **NEW** — Settings page |
| `components/layout/app-sidebar.tsx` | Added "Billing" nav |
| `middleware.ts` | Protected `/api/workspace/billing` |
| `migrations/005_add_billing_foundation.sql` | **NEW** — DB migration |

---

## 12. Verification

| Check | Status |
|-------|--------|
| TypeScript | ✅ Zero errors |
| Prisma generate | ✅ Success |
| DB migration | ✅ Applied |
| Tables created | ✅ 4 |
| RLS enabled | ✅ 4 tables |
| FORCE RLS | ✅ 4 tables |
| Policies | ✅ 9 |
| Subscription events | ✅ 5 seeded |
| API endpoint | ✅ GET/POST /api/workspace/billing |
| Sidebar nav | ✅ Billing link |
| Docker build | Pending |
