# Workspace Security Audit — MimoNotes

> **Date**: 2026-06-13  
> **Scope**: Workspace isolation, RLS enforcement, API authentication, tenant boundaries  
> **Method**: Static code analysis + live database inspection  
> **Classification**: READ-ONLY AUDIT — no code changes

---

## Executive Summary

**Overall Risk: 🔴 HIGH**

The workspace isolation system has a well-designed architecture but several critical enforcement gaps. The most severe issue is that the application database user (`mimotes_app`) has `BYPASSRLS = true`, which completely disables all Row Level Security policies — making them decorative rather than protective.

| Finding | Severity | Status |
|---|---|---|
| App user has BYPASSRLS | 🔴 CRITICAL | RLS disabled |
| 6 tables missing RLS | 🔴 HIGH | No tenant isolation |
| v1 API routes skip setWorkspaceContext | 🔴 HIGH | RLS not activated |
| resolveWorkspaceId() hardcoded to owner | 🟡 MEDIUM | No workspace switching |
| GUC parameter inconsistency | 🟡 MEDIUM | Potential runtime errors |
| No invitation token system | 🟡 MEDIUM | Direct add only |
| workspace_members self-referencing RLS | 🟢 LOW | Potential recursion |
| chat_messages JOIN-based RLS | 🟢 LOW | Performance concern |

---

## Finding 1: App User Has BYPASSRLS 🔴 CRITICAL

### Evidence

```sql
SELECT rolname, rolsuper, rolbypassrls FROM pg_roles 
WHERE rolname IN ('mimotes', 'mimotes_app');

-- Result:
-- mimotes     | t | t  (superuser)
-- mimotes_app | f | t  (BYPASSRLS!)
```

### Impact

`mimotes_app` has `rolbypassrls = true`. This means:
- **ALL 33 RLS policies are completely ineffective**
- The application can read/write ANY workspace's data
- `FORCE ROW LEVEL SECURITY` does NOT help — BYPASSRLS overrides it
- RLS policies are decorative, not protective

### How It Happened

The `mimotes_app` role was likely created with `CREATEDB` or `SUPERUSER` privileges, or `BYPASSRLS` was explicitly granted. Docker's default PostgreSQL setup may grant this.

### Fix

```sql
ALTER USER mimotes_app NOBYPASSRLS;
-- Verify:
SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = 'mimotes_app';
-- Should show: mimotes_app | f
```

### Risk

Without this fix, a single SQL injection or business logic bug can leak ALL tenant data. RLS is the last line of defense — and it's currently off.

---

## Finding 2: 6 Tables Missing RLS 🔴 HIGH

### Tables with `workspace_id` but NO RLS

| Table | Data at Risk | Impact |
|---|---|---|
| `api_keys` | API keys per workspace | Key theft cross-workspace |
| `api_usage_logs` | Usage data per workspace | Data leakage |
| `audit_logs` | Audit trail per workspace | Audit trail tampering |
| `widgets` | Widget configs per workspace | Widget hijacking |
| `widget_conversations` | Chat conversations | Conversation theft |
| `widget_messages` | Chat messages | Message leakage |

### Evidence

```sql
SELECT t.tablename 
FROM pg_tables t
JOIN information_schema.columns c 
  ON c.table_name = t.tablename AND c.column_name = 'workspace_id'
WHERE t.schemaname = 'public' AND t.rowsecurity = false;
```

### Fix

For each table:
```sql
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;
CREATE POLICY api_keys_tenant_isolation ON api_keys
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);
```

Repeat for: `api_usage_logs`, `audit_logs`, `widgets`, `widget_conversations`, `widget_messages`.

---

## Finding 3: v1 API Routes Skip setWorkspaceContext 🔴 HIGH

### Evidence

```bash
grep -n 'setWorkspaceContext' app/api/v1/*/route.ts
# (empty — no matches)
```

### Impact

The v1 API routes (`/api/v1/chat`, `/api/v1/documents`, `/api/v1/search`, `/api/v1/keys`) authenticate via API key and get `workspaceId`, but **never call `setWorkspaceContext()`**.

This means:
- RLS context is never set for v1 API requests
- Even if BYPASSRLS were fixed, RLS wouldn't protect v1 routes
- Protection relies entirely on explicit `where: { workspaceId }` in each query

### Risk

If any v1 route forgets to include `workspaceId` in its query filter, cross-workspace data access is possible.

### Fix

In `requireApiAuth()`, add workspace context setting:
```typescript
export async function requireApiAuth(request: NextRequest): Promise<ApiAuthResult> {
  const auth = await authenticateApiRequest(request);
  if (!auth) throw new ApiError(401, "Invalid or missing API key");
  
  // Set RLS context for workspace
  await setWorkspaceContext(auth.workspaceId);  // ADD THIS
  
  const hasAccess = await checkApiAccess(auth.workspaceId);
  // ...
}
```

---

## Finding 4: resolveWorkspaceId() Hardcoded to Owner 🟡 MEDIUM

### Evidence

```typescript
// lib/prisma.ts
export async function resolveWorkspaceId(userId: string): Promise<string> {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, role: "owner" },  // ONLY returns owner workspace
    select: { workspaceId: true },
  });
  // ...
}
```

### Impact

- Users who are members of multiple workspaces (as editor/admin) always get their OWNER workspace
- No way to switch workspaces — the `WorkspaceSwitcher` component is display-only
- Multi-workspace membership is stored but never utilized

### Fix

Add workspace switching:
1. Store selected workspace in session/cookie
2. Create `POST /api/workspace/switch` endpoint
3. Update `resolveWorkspaceId()` to check selected workspace first

---

## Finding 5: GUC Parameter Inconsistency 🟡 MEDIUM

### Evidence

Some RLS policies use `current_setting('app.current_workspace_id')` (2 params):
```sql
-- analytics_events, chat_sessions, document_chunks, documents, etc.
current_setting('app.current_workspace_id'::text)
```

Others use `current_setting('app.current_workspace_id', true)` (3 params):
```sql
-- eval_queries, eval_results, invoices, payments, etc.
current_setting('app.current_workspace_id'::text, true)
```

### Impact

Without the `true` parameter, `current_setting()` throws an error if the GUC is not set. With `true`, it returns empty string. This inconsistency means:
- Some queries may error if workspace context is not set
- Others silently return empty results

### Fix

Standardize all policies to use `true`:
```sql
current_setting('app.current_workspace_id', true)::text
```

---

## Finding 6: No Invitation Token System 🟡 MEDIUM

### Evidence

```typescript
// app/api/workspace/members/route.ts
// POST — invite member
const targetUser = await prisma.user.findUnique({ where: { email } });
// Directly adds user — no invitation token, no email, no pending state
```

### Impact

- No email invitations — admin must know the user's email AND the user must already have an account
- No pending/accepted/rejected states
- No invitation expiry
- No audit trail of invitations sent vs accepted

---

## Finding 7: workspace_members Self-Referencing RLS 🟢 LOW

### Evidence

```sql
CREATE POLICY workspace_members_isolation ON workspace_members
  USING (workspace_id IN (
    SELECT workspace_members_1.workspace_id 
    FROM workspace_members workspace_members_1
    WHERE workspace_members_1.user_id = current_setting('app.current_user_id')
  ));
```

### Impact

The RLS policy on `workspace_members` queries `workspace_members` — potential infinite recursion. PostgreSQL may optimize this, but it's fragile.

---

## Remediation Priority

| Priority | Finding | Effort | Impact |
|---|---|---|---|
| P0 | Fix BYPASSRLS | 5 min | Restores ALL RLS protection |
| P1 | Add RLS to 6 tables | 30 min | Closes tenant isolation gaps |
| P1 | Fix v1 API workspace context | 15 min | Activates RLS for API routes |
| P2 | Fix GUC inconsistency | 15 min | Prevents runtime errors |
| P2 | Workspace switching | 4h | Multi-workspace support |
| P3 | Invitation tokens | 4h | Better member management |
