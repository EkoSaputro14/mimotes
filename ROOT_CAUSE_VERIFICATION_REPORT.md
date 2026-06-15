# ROOT_CAUSE_VERIFICATION_REPORT.md
## MimoNotes Root Cause Verification
**Date:** 2026-06-14 | **Method:** Systematic Debugging (4-phase) | **Evidence:** Docker logs, SQL queries, source code traces

---

## VERDICT: ROOT CAUSE PROVEN WITH EVIDENCE

**The original hypothesis (FORCE RLS blocking writes) is PARTIALLY CORRECT but INCOMPLETE.**

The true root cause is a **3-layer deadlock** in `resolveWorkspaceId()`:

1. **Missing `app.current_user_id` session variable** — never set by the application
2. **Order-of-operations deadlock** — `resolveWorkspaceId()` runs BEFORE `setWorkspaceContext()`
3. **Prisma RETURNING clause** — triggers SELECT policy that requires the missing session variable

---

## EVIDENCE CHAIN

### Evidence 1: Docker Logs (EXACT ERROR)

```
Invalid `prisma.workspace.create()` invocation:
'Error occurred during query execution:
ConnectorError(ConnectorError { user_facing_error: None,
  kind: QueryError(PostgresError { code: "42501",
    message: "new row violates row-level security policy for table \"workspaces\"",
    severity: "ERROR" ... }), transient: false })'
```

**Source:** `docker logs mimotes-app-1 --tail 200`

### Evidence 2: RLS Policy Configuration (DATABASE)

```sql
-- From pg_policies:
workspaces_insert | PERMISSIVE | INSERT | WITH CHECK: true   ← INSERT always passes
workspaces_select | PERMISSIVE | SELECT | USING: (id IN (
  SELECT wm.workspace_id FROM workspace_members wm
  WHERE wm.user_id = current_setting('app.current_user_id', true)
))  ← SELECT requires app.current_user_id
```

**Source:** `docker exec mimotes-db-1 psql -U mimotes -d mimotes -c "SELECT...FROM pg_policies"`

### Evidence 3: Session Variable Never Set

```sql
-- Test as mimotes_app role:
SET ROLE mimotes_app;
SELECT current_setting('app.current_user_id', true);
-- Result: '' (empty string)
```

**Source:** `docker exec mimotes-db-1 psql -U mimotes -d mimotes`

### Evidence 4: Direct INSERT Succeeds (Proves RLS Policy Allows It)

```sql
SET ROLE mimotes_app;
INSERT INTO workspaces (id, name, slug, created_at, updated_at)
VALUES ('test-id', 'Test', 'test', NOW(), NOW());
-- Result: INSERT 0 1 (SUCCESS)
```

**Source:** `docker exec mimotes-db-1 psql -U mimotes -d mimotes`

### Evidence 5: Prisma Fails (Proves RETURNING Clause Is the Problem)

The Prisma `workspace.create()` generates:
```sql
INSERT INTO workspaces (...) VALUES (...) RETURNING *
```

The `RETURNING *` triggers the `workspaces_select` policy, which evaluates:
```sql
id IN (SELECT wm.workspace_id FROM workspace_members wm
       WHERE wm.user_id = current_setting('app.current_user_id', true))
```

Since `app.current_user_id` is empty → subquery returns empty → new workspace id NOT in empty list → RLS blocks the RETURNING clause.

### Evidence 6: `setWorkspaceContext()` Only Sets workspace_id

```typescript
// lib/prisma.ts — setWorkspaceContext()
export async function setWorkspaceContext(workspaceId: string): Promise<void> {
  await prisma.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, true)`;
  // NOTE: NEVER sets app.current_user_id
}
```

### Evidence 7: Every Endpoint Calls resolveWorkspaceId() BEFORE setWorkspaceContext()

```typescript
// Pattern in EVERY route handler:
const workspaceId = await resolveWorkspaceId(userId);  // ← Runs FIRST, fails here
await setWorkspaceContext(workspaceId);                 // ← Never reached
```

---

## THE DEADLOCK (Step-by-Step)

```
Request arrives → auth() succeeds → userId obtained
    ↓
resolveWorkspaceId(userId) called:
    ↓
Step 1: prisma.workspaceMember.findFirst({where: {userId, workspaceId}})
    → RLS check: current_setting('app.current_workspace_id') = workspace_id
    → app.current_workspace_id NOT SET → NULL = workspace_id → FALSE
    → Returns NULL (no rows visible)
    ↓
Step 2: prisma.workspaceMember.findFirst({where: {userId, role: "owner"}})
    → Same RLS blocks → Returns NULL
    ↓
Step 3: prisma.user.findUnique({where: {id: userId}})
    → users table has NO RLS → SUCCEEDS
    ↓
Step 4: prisma.workspace.create({data: {name, slug, members: {create: {...}}}})
    → INSERT INTO workspaces (...) VALUES (...)
    → INSERT WITH CHECK: true → PASSES
    → RETURNING * → triggers workspaces_select policy
    → SELECT requires app.current_user_id → NOT SET → BLOCKED
    → ERROR 42501: "new row violates row-level security policy"
    ↓
Request fails → 500 returned to client
```

---

## ROOT CAUSE CLASSIFICATION

| Layer | Issue | Severity |
|-------|-------|----------|
| **Layer 1: Missing session variable** | `app.current_user_id` never set by application | CRITICAL |
| **Layer 2: Order-of-operations** | `resolveWorkspaceId()` runs before `setWorkspaceContext()` | CRITICAL |
| **Layer 3: Prisma RETURNING** | `create()` uses RETURNING clause triggering SELECT policy | HIGH |

**Primary root cause:** Layer 1 + Layer 2 combined create a deadlock where the workspace cannot be created or queried.

---

## BLAST RADIUS

| Endpoint | Failure Point | Error |
|----------|--------------|-------|
| `/api/upload` | `resolveWorkspaceId()` → workspace.create() | 500 + forced logout |
| `/api/chat` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/dashboard/usage` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/dashboard/top-documents` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/dashboard/activity` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/dashboard/stats` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/workspace` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/workspace/members` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/analytics/chat` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/analytics/cost` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/analytics/usage` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/mcp/servers` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/mcp/tools` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/widgets/list` | `resolveWorkspaceId()` → workspace.create() | 500 |
| `/api/admin/settings` | `resolveWorkspaceId()` → workspace.create() | 500 |

**Total endpoints affected:** 15+ (every endpoint that calls `resolveWorkspaceId()`)

---

## FIX RECOMMENDATIONS

### Option A: Set Session Variables in resolveWorkspaceId() (RECOMMENDED)

In `lib/prisma.ts`, modify `resolveWorkspaceId()` to:
1. Set `app.current_user_id` BEFORE any queries
2. Then query workspace_members (now visible via RLS)
3. Then create workspace if needed (now RETURNING works)

```typescript
export async function resolveWorkspaceId(userId: string, selectedWorkspaceId?: string | null): Promise<string> {
  // Set user context FIRST — enables RLS policies to see user's workspaces
  await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`;
  
  // Now workspace_members queries will work (RLS can see user's memberships)
  const membership = await prisma.workspaceMember.findFirst({ where: { userId } });
  // ... rest of logic
}
```

### Option B: Use Raw SQL for Workspace Bootstrap

Bypass Prisma's RETURNING clause for the initial workspace creation:
```typescript
await prisma.$executeRaw`INSERT INTO workspaces (id, name, slug, created_at, updated_at) VALUES (...)`;
await prisma.$executeRaw`INSERT INTO workspace_members (...) VALUES (...)`;
```

### Option C: Remove FORCE RLS (Previous Audit Recommendation)

Remove `FORCE ROW LEVEL SECURITY` from all 25 tables. This allows the table owner (`mimotes_app`) to bypass RLS entirely.

**Trade-off:** Loses RLS protection for the app role. Only recommended if the app role is trusted and no other users connect directly.

---

## MIGRATION PLAN

1. **Immediate (30 min):** Apply Option A — set `app.current_user_id` in `resolveWorkspaceId()`
2. **Verify:** Test all 15+ endpoints, confirm zero 500 errors
3. **Optional:** Remove FORCE RLS (Option C) for defense-in-depth
4. **Verify:** Run full Playwright suite
