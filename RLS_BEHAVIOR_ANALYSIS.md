# RLS_BEHAVIOR_ANALYSIS.md
## MimoNotes RLS Behavior Analysis
**Date:** 2026-06-14 | **Method:** Database inspection + policy tracing | **Evidence:** pg_policies, pg_class, SQL tests

---

## DATABASE CONFIGURATION

### Connection
```
DATABASE_URL: postgresql://mimotes_app:mimotes_app_pass@db:5432/mimotes?schema=public
App role:     mimotes_app (NOT superuser, CAN LOGIN, HAS CREATE DB)
Superuser:    mimotes (used for migrations and seeding)
```

### RLS Enablement (25 tables)

| Table | RLS Enabled | FORCE RLS | INSERT Policy | SELECT Policy |
|-------|-------------|-----------|---------------|---------------|
| workspaces | ✅ | ✅ | `with_check: true` | `user_id = current_setting('app.current_user_id')` |
| workspace_members | ✅ | ✅ | `with_check: true` | `workspace_id = current_setting('app.current_workspace_id')` |
| audit_logs | ✅ | ✅ | `workspace_id = current_setting('app.current_workspace_id')` | Same |
| documents | ✅ | ✅ | `workspace_id = current_setting('app.current_workspace_id')` | Same |
| document_chunks | ✅ | ✅ | `workspace_id = current_setting('app.current_workspace_id')` | Same |
| chat_sessions | ✅ | ✅ | `workspace_id = current_setting('app.current_workspace_id')` | Same |
| chat_messages | ✅ | ✅ | `workspace_id = current_setting('app.current_workspace_id')` | Same |
| api_keys | ✅ | ✅ | `workspace_id = current_setting('app.current_workspace_id')` | Same |
| api_usage_logs | ✅ | ✅ | `workspace_id = current_setting('app.current_workspace_id')` | Same |
| mcp_servers | ✅ | ✅ | `workspace_id = current_setting('app.current_workspace_id')` | Same |
| widgets | ✅ | ✅ | `workspace_id = current_setting('app.current_workspace_id')` | Same |
| widget_conversations | ✅ | ✅ | Same | Same |
| widget_messages | ✅ | ✅ | Same | Same |
| prompt_templates | ✅ | ✅ | Same | Same |
| prompt_versions | ✅ | ✅ | Same | Same |
| analytics_events | ✅ | ✅ | Same | Same |
| workspace_settings | ✅ | ✅ | Same | Same |
| workspace_usage | ✅ | ✅ | Same | Same |
| workspace_invitations | ✅ | ✅ | Same | Same |
| workspace_subscriptions | ✅ | ✅ | Same | Same |
| invoices | ✅ | ✅ | Same | Same |
| invoice_line_items | ✅ | ✅ | Same | Same |
| payments | ✅ | ✅ | Same | Same |
| subscription_events | ✅ | ✅ | Same | Same |
| subscription_plans | ✅ | ✅ | Same | Same |

### Tables WITHOUT RLS

| Table | RLS | Reason |
|-------|-----|--------|
| users | ❌ | Auth table, needs cross-user reads |
| settings | ❌ | Global config, not tenant-scoped |
| folders | ❌ | Missing RLS (potential issue) |
| stripe_webhook_events | ❌ | Webhook events, not user-facing |
| plan_features | ❌ | Reference data |
| _prisma_migrations | ❌ | Migration tracking |

---

## TWO CONFLICTING RLS MIGRATIONS

### Migration 1: `20260606_rls_enable` (User-ID-based policies)

Created policies using `app.current_user_id`:
```sql
-- workspaces SELECT policy:
id IN (SELECT wm.workspace_id FROM workspace_members wm
       WHERE wm.user_id = current_setting('app.current_user_id'))
```

### Migration 2: `20260607_rls_workspace_id` (Workspace-ID-based policies)

Replaced most policies with `app.current_workspace_id`:
```sql
-- Most tables: workspace_id = current_setting('app.current_workspace_id')
```

**BUT:** Migration 2 did NOT update the `workspaces` or `workspace_members` SELECT policies. Those still use Migration 1's approach with `app.current_user_id`.

### Policy Conflict Matrix

| Table | Policy Uses | Application Sets |
|-------|-------------|------------------|
| workspaces (SELECT) | `app.current_user_id` | NEVER SET |
| workspace_members (SELECT) | `app.current_workspace_id` | Set AFTER resolveWorkspaceId() |
| All other tables | `app.current_workspace_id` | Set AFTER resolveWorkspaceId() |

---

## THE CHICKEN-AND-EGG PROBLEM

```
To query workspace_members:  need app.current_workspace_id set
To set app.current_workspace_id:  need workspaceId from resolveWorkspaceId()
To call resolveWorkspaceId():  need to query workspace_members
                              ↑___ DEADLOCK ___↓
```

---

## POLICY BEHAVIOR ANALYSIS

### workspaces INSERT Policy
```sql
WITH CHECK: true
```
**Behavior:** Always passes. Any row can be inserted.

### workspaces SELECT Policy
```sql
USING: (id IN (SELECT wm.workspace_id FROM workspace_members wm
         WHERE wm.user_id = current_setting('app.current_user_id', true)))
```
**Behavior:** Only returns workspaces where the user is a member. Requires `app.current_user_id` to be set.

### workspace_members SELECT Policy
```sql
USING: (workspace_id = current_setting('app.current_workspace_id', true))
```
**Behavior:** Only returns members for the current workspace. Requires `app.current_workspace_id` to be set.

### All Other Tables (INSERT + SELECT)
```sql
USING/WITH CHECK: (workspace_id = current_setting('app.current_workspace_id', true))
```
**Behavior:** Only allows access to rows belonging to the current workspace.

---

## FORCE RLS IMPACT

With `FORCE ROW LEVEL SECURITY` enabled, the table owner (`mimotes_app`) is NOT exempt from RLS. This means:

1. Even the application's own database role must obey all policies
2. The `workspaces_insert` policy (`with_check: true`) allows inserts
3. BUT the `workspaces_select` policy blocks the RETURNING clause of `create()` calls
4. AND the `workspace_members_select` policy blocks queries before context is set

### Without FORCE RLS
If FORCE RLS were removed:
- `mimotes_app` would bypass ALL RLS policies
- All queries and inserts would succeed regardless of session variables
- **Trade-off:** No RLS protection for the app role (acceptable if app role is trusted)

---

## VERIFICATION TESTS

### Test 1: Direct INSERT as mimotes_app
```sql
SET ROLE mimotes_app;
INSERT INTO workspaces (id, name, slug, created_at, updated_at)
VALUES ('test-123', 'Test', 'test', NOW(), NOW());
-- Result: INSERT 0 1 (SUCCESS)
```
**Conclusion:** INSERT policy works correctly.

### Test 2: SELECT after INSERT as mimotes_app
```sql
SET ROLE mimotes_app;
SELECT id FROM workspaces WHERE name = 'Test';
-- Result: 0 rows (RLS blocks — app.current_user_id not set)
```
**Conclusion:** SELECT policy blocks reads without session variable.

### Test 3: Session variable setting
```sql
SET ROLE mimotes_app;
SELECT set_config('app.current_user_id', 'test-user-id', true);
SELECT current_setting('app.current_user_id', true);
-- Result: 'test-user-id'
```
**Conclusion:** Session variables can be set and read correctly.

---

## EXISTING DATA STATE

| Entity | Count | Notes |
|--------|-------|-------|
| Users | 11 | Created by superuser (bypasses RLS) |
| Workspaces | 9 | Created by superuser |
| Workspace Members | 5 | All are owners |
| Test users without workspace | 3 | testplaywright@test.com has NO workspace |

**Critical:** The test user (`testplaywright@test.com`) has NO workspace membership. This means `resolveWorkspaceId()` will ALWAYS try to create a workspace for this user, which triggers the deadlock.

---

## MIGRATION HISTORY

| Migration | Date | What It Did |
|-----------|------|-------------|
| 20260606_rls_enable | June 6 | Enabled RLS, created user_id-based policies |
| 20260607_rls_workspace_id | June 7 | Replaced most policies with workspace_id-based ones |

**Bug introduced:** Migration 2 replaced policies but didn't update `resolveWorkspaceId()` to set the required session variables.
