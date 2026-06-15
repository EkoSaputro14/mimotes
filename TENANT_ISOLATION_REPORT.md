# Tenant Isolation Report — MimoNotes

> **Date**: 2026-06-13  
> **Scope**: Per-table RLS status, GUC alignment, isolation model  
> **Method**: Live database inspection via `pg_policies`, `pg_tables`, `pg_roles`

---

## Isolation Model

MimoNotes uses **Workspace-as-Tenant** model:
- Each workspace is a tenant
- `workspace_id` is the tenant identifier
- RLS policies filter on `app.current_workspace_id` GUC
- `setWorkspaceContext(workspaceId)` sets the GUC per-request

## Table-by-Table RLS Status

### Tables WITH RLS (17 tables)

| Table | RLS Policy | GUC | FORCE | Status |
|---|---|---|---|---|
| workspaces | workspaces_member_isolation | user_id (subquery) | ? | ⚠️ Self-ref |
| workspace_members | workspace_members_isolation | user_id (subquery) | ? | ⚠️ Self-ref |
| workspace_settings | 4 policies (CRUD) | workspace_id | ? | ✅ OK |
| workspace_subscriptions | 3 policies | workspace_id | ? | ✅ OK |
| workspace_usage | 3 policies | workspace_id | ? | ✅ OK |
| documents | documents_tenant_isolation | workspace_id | ? | ✅ OK |
| document_chunks | tenant_isolation | workspace_id | ? | ✅ OK |
| chat_sessions | chat_sessions_tenant_isolation | workspace_id | ? | ✅ OK |
| chat_messages | chat_messages_tenant_isolation | session_id (subquery) | ? | ⚠️ JOIN |
| analytics_events | analytics_events_tenant_isolation | workspace_id | ? | ✅ OK |
| prompt_templates | prompt_templates_tenant_isolation | workspace_id | ? | ✅ OK |
| prompt_versions | prompt_versions_tenant_isolation | prompt_id (subquery) | ? | ⚠️ JOIN |
| mcp_servers | mcp_servers_tenant_isolation | workspace_id | ? | ✅ OK |
| retrieval_logs | retrieval_logs_tenant_isolation | workspace_id | ? | ✅ OK |
| eval_queries | eval_queries_tenant_isolation | workspace_id | ? | ✅ OK |
| eval_results | eval_results_tenant_isolation | workspace_id | ? | ✅ OK |
| invoices | 3 policies | workspace_id | ? | ✅ OK |
| invoice_line_items | 2 policies | invoice_id (subquery) | ? | ⚠️ JOIN |
| payments | 2 policies | workspace_id | ? | ✅ OK |
| subscription_events | 2 policies | workspace_id | ? | ✅ OK |
| subscription_plans | 1 policy (SELECT) | true (global) | ? | ✅ Global |

### Tables WITHOUT RLS (6 tables with workspace_id)

| Table | Has workspace_id | Data Type | Risk |
|---|---|---|---|
| **api_keys** | ✅ | API keys | 🔴 Cross-workspace key theft |
| **api_usage_logs** | ✅ | Usage data | 🔴 Data leakage |
| **audit_logs** | ✅ | Audit trail | 🔴 Audit tampering |
| **widgets** | ✅ | Widget config | 🔴 Widget hijacking |
| **widget_conversations** | ✅ | Conversations | 🔴 Conversation theft |
| **widget_messages** | ✅ | Messages | 🔴 Message leakage |

### Tables WITHOUT RLS (no workspace_id — expected)

| Table | Reason |
|---|---|
| users | Global table, not tenant-scoped |
| settings | Global config |
| plan_features | Global config |
| _prisma_migrations | System table |
| stripe_webhook_events | System table |

## GUC Alignment Analysis

### Consistent: `current_setting('app.current_workspace_id', true)`

These tables use the safe pattern (returns empty string if not set):
- eval_queries, eval_results, invoices, invoice_line_items, payments
- subscription_events, workspace_settings, workspace_subscriptions, workspace_usage

### Inconsistent: `current_setting('app.current_workspace_id')` (no `true`)

These tables use the risky pattern (throws error if not set):
- analytics_events, chat_sessions, document_chunks, documents
- mcp_servers, prompt_templates, retrieval_logs
- workspace_members (via subquery), workspaces (via subquery)

### Impact

If `setWorkspaceContext()` is not called before querying these tables, PostgreSQL throws:
```
ERROR: unrecognized configuration parameter "app.current_workspace_id"
```

This is actually a **fail-safe** behavior — it's better to error than to silently return unfiltered data. But it creates inconsistent error handling.

## RLS Pattern Analysis

### Direct workspace_id match (✅ BEST)
```sql
USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
```
Used by: documents, document_chunks, chat_sessions, analytics_events, etc.

### Subquery via workspace_members (⚠️ FRAGILE)
```sql
USING (workspace_id IN (
  SELECT workspace_members_1.workspace_id 
  FROM workspace_members workspace_members_1
  WHERE workspace_members_1.user_id = current_setting('app.current_user_id')
))
```
Used by: workspaces, workspace_members

**Risk**: Self-referencing policy on workspace_members.

### JOIN via parent table (⚠️ PERFORMANCE)
```sql
USING (session_id IN (
  SELECT chat_sessions.id FROM chat_sessions
  WHERE chat_sessions.workspace_id = current_setting('app.current_workspace_id')
))
```
Used by: chat_messages, prompt_versions, invoice_line_items

**Risk**: Subquery on every row access. At scale, this adds latency.

## Defense-in-Depth Layers

| Layer | Status | Notes |
|---|---|---|
| RLS policies | ⚠️ 17/23 tables | 6 tables unprotected |
| RLS enforcement | 🔴 DISABLED | BYPASSRLS on mimotes_app |
| Application-level WHERE | ✅ Most routes | Explicit workspaceId filters |
| withWorkspace() middleware | ✅ Session routes | Sets RLS context |
| v1 API auth | ⚠️ No RLS context | Only validates key, doesn't set GUC |
| RBAC (requireRole) | ✅ Working | Owner > Admin > Editor > Viewer |

## Recommendations

1. **P0**: `ALTER USER mimotes_app NOBYPASSRLS;`
2. **P1**: Add RLS to 6 unprotected tables
3. **P1**: Standardize GUC to use `true` parameter everywhere
4. **P1**: Add `setWorkspaceContext()` to `requireApiAuth()`
5. **P2**: Replace subquery-based RLS with direct workspace_id where possible
6. **P2**: Add `FORCE ROW LEVEL SECURITY` to all RLS tables
