# USAGE TRACKING REPORT

> Generated: 2026-06-06
> Status: Implementation Complete
> TypeScript: ✅ Zero errors
> Migration: ✅ Applied
> RLS: ✅ Enforced
> Build: Pending Docker verification

---

## 1. Schema Changes

### New Models

#### SubscriptionPlan (Plan Definitions)

```
subscription_plans
├── id (TEXT PK)
├── name (VARCHAR UNIQUE) — free, pro, enterprise
├── display_name (VARCHAR)
├── description (TEXT)
├── is_active (BOOLEAN)
├── max_documents (INT, -1=unlimited)
├── max_storage_mb (INT, -1=unlimited)
├── max_chat_messages (INT, -1=unlimited)
├── max_chunks (INT, -1=unlimited)
├── max_ai_requests (INT, -1=unlimited)
├── max_embedding_reqs (INT, -1=unlimited)
├── max_mcp_executions (INT, -1=unlimited)
├── max_members (INT, -1=unlimited)
├── max_workspaces (INT, -1=unlimited)
├── created_at
└── updated_at
```

#### WorkspaceSubscription (Plan Assignment)

```
workspace_subscriptions
├── id (TEXT PK)
├── workspace_id (TEXT FK → workspaces, UNIQUE)
├── plan_id (TEXT FK → subscription_plans)
├── status (VARCHAR) — active, trial, canceled, past_due
├── trial_starts_at (TIMESTAMPTZ)
├── trial_ends_at (TIMESTAMPTZ)
├── current_period_start (TIMESTAMPTZ)
├── current_period_end (TIMESTAMPTZ)
├── canceled_at (TIMESTAMPTZ)
├── created_at
└── updated_at
```

#### WorkspaceUsage (Monthly Counters)

```
workspace_usage
├── id (TEXT PK)
├── workspace_id (TEXT FK → workspaces)
├── period (VARCHAR "YYYY-MM")
├── documents_created (INT)
├── storage_bytes_used (BIGINT)
├── chunks_created (INT)
├── chat_messages (INT)
├── ai_requests (INT)
├── embedding_requests (INT)
├── mcp_executions (INT)
├── created_at
└── updated_at

UNIQUE(workspace_id, period)
```

---

## 2. APIs Created

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/workspace/subscription` | ✅ | Current plan + usage + limits |

### Response Structure

```json
{
  "subscription": {
    "status": "active",
    "plan": { "name": "free", "displayName": "Free" },
    "trialEndsAt": null,
    "currentPeriodStart": null,
    "currentPeriodEnd": null
  },
  "usage": {
    "period": "2026-06",
    "documents": { "used": 3, "limit": 10, "percent": 30 },
    "storage": { "used": 24, "limit": 100, "percent": 24 },
    "chatMessages": { "used": 45, "limit": 1000, "percent": 5 },
    "chunks": { "used": 150, "limit": 5000, "percent": 3 },
    "aiRequests": { "used": 45, "limit": 500, "percent": 9 },
    "embeddingRequests": { "used": 3, "limit": 500, "percent": 1 },
    "mcpExecutions": { "used": 0, "limit": 100, "percent": 0 }
  },
  "plans": [...]
}
```

---

## 3. Usage Service (`lib/usage.ts`)

### Functions

| Function | Description |
|----------|-------------|
| `getPlanLimits(workspaceId)` | Get plan limits for workspace |
| `getWorkspaceSubscription(workspaceId)` | Get subscription details |
| `getUsage(workspaceId, period?)` | Get full usage snapshot |
| `checkLimit(workspaceId, metric)` | Throw if limit exceeded |
| `checkLimitWithAmount(workspaceId, metric, amount)` | Check before adding |
| `checkMemberLimit(workspaceId)` | Check member count limit |
| `trackDocumentUpload(workspaceId, bytes)` | Track doc upload + storage |
| `trackChatMessage(workspaceId)` | Track chat message |
| `trackChunks(workspaceId, count)` | Track chunk creation |
| `trackAIRequest(workspaceId)` | Track AI API call |
| `trackEmbeddingRequest(workspaceId)` | Track embedding call |
| `trackMCPExecution(workspaceId)` | Track MCP tool execution |

### Limit Enforcement

```typescript
import { checkLimit } from "@/lib/usage";

// In upload route — throws LimitExceededError if at limit
await checkLimit(workspaceId, "maxDocuments");

// In chat route — fire-and-forget tracking
trackChatMessage(workspaceId).catch(() => {});
trackAIRequest(workspaceId).catch(() => {});
```

---

## 4. Enforcement Points

| Route | Enforcement | Metric |
|-------|-------------|--------|
| `POST /api/upload` | `checkLimit("maxDocuments")` | Before document creation |
| `POST /api/upload` | `trackDocumentUpload()` | After processing (fire-and-forget) |
| `POST /api/upload` | `trackChunks()` | After chunk storage (fire-and-forget) |
| `POST /api/upload` | `trackEmbeddingRequest()` | After embedding (fire-and-forget) |
| `POST /api/chat` | `trackChatMessage()` | After streaming response (fire-and-forget) |
| `POST /api/chat` | `trackAIRequest()` | After streaming response (fire-and-forget) |

### LimitExceededError

```typescript
export class LimitExceededError extends Error {
  metric: string;      // e.g., "maxDocuments"
  current: number;     // current usage
  limit: number;       // plan limit
}
```

---

## 5. Plan Limits

| Metric | Free | Pro | Enterprise |
|--------|------|-----|------------|
| Documents | 10 | 100 | ∞ |
| Storage | 100 MB | 10 GB | ∞ |
| Chat Messages | 1,000 | 50,000 | ∞ |
| Chunks | 5,000 | 100,000 | ∞ |
| AI Requests | 500 | 10,000 | ∞ |
| Embedding Requests | 500 | 10,000 | ∞ |
| MCP Executions | 100 | 5,000 | ∞ |
| Members | 3 | 20 | ∞ |
| Workspaces | 1 | 5 | ∞ |

---

## 6. Dashboard Widgets

### Usage Overview (`components/workspace/usage-overview.tsx`)

- Fetches from `/api/workspace/subscription`
- Shows plan status card (plan name, status, period)
- Shows 7 usage bars with progress indicators
- Color-coded: blue < 70%, amber 70-90%, red > 90%
- Unlimited (∞) shown as minimal bar

### Settings Pages

- `/settings/usage` — Full usage dashboard
- `/settings/workspace` — Workspace + member management

---

## 7. RLS Updates

### subscription_plans

| Policy | Type | Rule |
|--------|------|------|
| subscription_plans_select | SELECT | `true` (read-only for all) |

### workspace_subscriptions

| Policy | Type | Rule |
|--------|------|------|
| workspace_subscriptions_select | SELECT | workspace_id = GUC |
| workspace_subscriptions_insert | INSERT | workspace_id = GUC |
| workspace_subscriptions_update | UPDATE | workspace_id = GUC |

### workspace_usage

| Policy | Type | Rule |
|--------|------|------|
| workspace_usage_select | SELECT | workspace_id = GUC |
| workspace_usage_insert | INSERT | workspace_id = GUC |
| workspace_usage_update | UPDATE | workspace_id = GUC |

- FORCE ROW LEVEL SECURITY: ✅ on all 3 tables

---

## 8. Migration Strategy

### Migration SQL (`004_add_subscription_usage.sql`)

1. Create `subscription_plans` table
2. Create `workspace_subscriptions` table
3. Create `workspace_usage` table
4. Enable RLS on all 3 tables (7 policies)
5. Force RLS on all 3 tables
6. Seed 3 plans (free, pro, enterprise)
7. Assign free plan to all existing workspaces

### Rollback

```sql
-- Drop tables (cascade removes subscriptions and usage)
DROP TABLE IF EXISTS workspace_usage CASCADE;
DROP TABLE IF EXISTS workspace_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
```

No data loss — these are new tables. Existing functionality unaffected.

---

## 9. Files Created/Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added 3 new models |
| `lib/usage.ts` | **NEW** — Usage service |
| `app/api/workspace/subscription/route.ts` | **NEW** — Subscription + usage API |
| `components/workspace/usage-overview.tsx` | **NEW** — Dashboard widget |
| `app/(admin)/settings/usage/page.tsx` | **NEW** — Usage settings page |
| `components/layout/app-sidebar.tsx` | Added "Usage" nav item |
| `app/api/upload/route.ts` | Added limit check + tracking |
| `app/api/chat/route.ts` | Added usage tracking |
| `middleware.ts` | Protected `/api/workspace/subscription` |
| `migrations/004_add_subscription_usage.sql` | **NEW** — DB migration |

---

## 10. Verification

| Check | Status |
|-------|--------|
| TypeScript | ✅ Zero errors |
| Prisma generate | ✅ Success |
| DB migration | ✅ Applied |
| Plan seeding | ✅ 3 plans |
| Subscription assignment | ✅ 5 workspaces |
| RLS enabled | ✅ 3 tables |
| FORCE RLS | ✅ 3 tables |
| API endpoint | ✅ GET /api/workspace/subscription |
| Sidebar nav | ✅ Usage link |
| Docker build | Pending |
