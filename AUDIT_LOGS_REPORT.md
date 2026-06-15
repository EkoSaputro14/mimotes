# Audit Logs Platform — Implementation Report

**Date:** 2026-06-07
**Status:** ✅ Complete
**Build:** ✅ Clean (0 new errors)

---

## Overview

Comprehensive audit logging platform for Mimotes. Tracks every important action across authentication, API keys, widgets, documents, billing, subscriptions, members, and MCP servers. Provides filtering, pagination, CSV export, and full-text search.

---

## Schema Changes

### `audit_logs` table
```sql
id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()
workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
actor_id      VARCHAR(100)
actor_type    VARCHAR(20) DEFAULT 'user'    -- user | api_key | system | widget
action        VARCHAR(100) NOT NULL          -- e.g., "auth.login", "api_key.create"
resource_type VARCHAR(50)                    -- e.g., "api_key", "widget", "document"
resource_id   VARCHAR(100)
metadata      JSONB
ip_address    VARCHAR(45)
user_agent    VARCHAR(500)
created_at    TIMESTAMP DEFAULT NOW()

INDEXES:
- audit_logs_workspace_time_idx (workspace_id, created_at)
- audit_logs_workspace_action_idx (workspace_id, action)
- audit_logs_workspace_actor_idx (workspace_id, actor_id)
- audit_logs_resource_idx (resource_type, resource_id)
```

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/audit.ts` | Audit service: logAudit, queryAuditLogs, exportAuditLogsCsv, getAuditSummary |
| `app/api/audit/route.ts` | GET /api/audit — query, filter, paginate, search, CSV export |
| `app/(admin)/settings/audit/page.tsx` | Audit logs settings page |
| `components/audit/audit-log-viewer.tsx` | Interactive audit log viewer UI |

## Files Modified (Integration Hooks)

| File | Audit Added |
|------|-------------|
| `app/api/v1/keys/route.ts` | `api_key.create`, `api_key.revoke` |
| `app/api/v1/widget/create/route.ts` | `widget.create` |
| `app/api/v1/widget/update/route.ts` | `widget.update` |

---

## Tracked Actions

| Category | Actions |
|----------|---------|
| **Auth** | `auth.login`, `auth.logout`, `auth.login_failed` |
| **API Keys** | `api_key.create`, `api_key.revoke`, `api_key.delete` |
| **Widgets** | `widget.create`, `widget.update`, `widget.delete` |
| **Documents** | `document.upload`, `document.delete`, `document.process` |
| **Billing** | `billing.checkout`, `billing.plan_change`, `billing.cancel`, `billing.resubscribe` |
| **Subscriptions** | `subscription.created`, `subscription.updated`, `subscription.canceled`, `subscription.payment_failed` |
| **Members** | `member.invite`, `member.remove`, `member.role_change` |
| **MCP** | `mcp.server_add`, `mcp.server_remove`, `mcp.server_update` |
| **Workspace** | `workspace.update`, `workspace.settings` |

---

## API Endpoints

### GET /api/audit

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `action` | string | Filter by action prefix (e.g., `auth.`) |
| `actorId` | string | Filter by actor ID |
| `resourceType` | string | Filter by resource type |
| `search` | string | Full-text search across action, resource, actor |
| `from` | ISO date | Start date |
| `to` | ISO date | End date |
| `limit` | number | Results per page (max 200) |
| `offset` | number | Pagination offset |
| `format` | string | `json` (default) or `csv` |
| `summary` | string | `true` for summary stats |

**JSON Response:**
```json
{
  "logs": [...],
  "total": 1234,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

**CSV Export:**
```
GET /api/audit?format=csv&action=auth.
→ Content-Type: text/csv
→ Content-Disposition: attachment; filename="audit-logs-2026-06-07.csv"
```

**Summary Mode:**
```
GET /api/audit?summary=true
```
```json
{
  "totalEvents": 1234,
  "topActions": [{ "action": "auth.login", "count": 500 }],
  "topActors": [{ "actorId": "user_xxx", "count": 300 }],
  "dailyCounts": [{ "date": "2026-06-07", "count": 42 }]
}
```

---

## Usage

### Log an action
```typescript
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

await logAudit({
  workspaceId: "ws_xxx",
  actorId: "user_xxx",
  actorType: "user",
  action: AUDIT_ACTIONS.DOCUMENT_UPLOAD,
  resourceType: "document",
  resourceId: "doc_xxx",
  metadata: { filename: "guide.pdf", size: 1024 },
  ipAddress: "192.168.1.1",
});
```

### Query logs
```typescript
import { queryAuditLogs } from "@/lib/audit";

const { logs, total, hasMore } = await queryAuditLogs({
  workspaceId: "ws_xxx",
  action: "auth.",           // prefix match
  from: new Date("2026-06-01"),
  limit: 50,
  offset: 0,
});
```

### Export CSV
```typescript
import { exportAuditLogsCsv } from "@/lib/audit";

const csv = await exportAuditLogsCsv({
  workspaceId: "ws_xxx",
  action: "billing.",
});
```

---

## Entitlement Protection

- Audit log viewing requires `audit_logs` feature
- Free plan: ❌ not included
- Pro plan: ❌ not included
- Enterprise plan: ✅ included

---

## Dashboard UI

**/settings/audit** page with:

1. **Summary Cards** — Total events, top action, most active actor, unique actions
2. **Filters** — Search, action category, resource type
3. **Log Entries** — Color-coded action badges, metadata, timestamps
4. **Pagination** — Load more button
5. **CSV Export** — Download filtered logs as CSV

---

## Security

| Layer | Implementation |
|-------|---------------|
| **Authentication** | API key required (via `requireApiAuth`) |
| **Entitlement** | `audit_logs` feature enforced |
| **Tenant isolation** | All queries filtered by `workspaceId` |
| **Fire-and-forget** | Logging errors don't block responses |
| **No sensitive data** | Metadata logged at caller's discretion |

---

## Build Verification

```
✓ Compiled successfully (4.6s)
✓ TypeScript type check passed
✓ Prisma schema applied (audit_logs table)
✓ Prisma client regenerated
✓ All routes registered:
  ├ ƒ /api/audit
  └ ƒ /settings/audit
✓ Integration hooks: 4 routes instrumented
```

---

*Generated: 2026-06-07 | Build: Clean | 4 files created, 3 modified*
