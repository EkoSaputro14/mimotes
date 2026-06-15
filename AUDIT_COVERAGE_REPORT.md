# Audit Log Coverage Report

**Date:** June 7, 2026
**Audited by:** Hermes Agent
**Codebase:** Mimotes (Next.js 16.2.7 + Prisma)
**Total Route Files:** 58
**Method:** Read-only review of all `app/api/**/route.ts` files for `logAudit` import and invocation

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total API routes | 58 |
| Routes WITH audit logging | **3** |
| Routes WITHOUT audit logging | **55** |
| Routes that SHOULD have audit | **22** |
| Routes that don't need audit | **33** |
| **Coverage (required routes)** | **12%** |
| **Effective coverage (all routes)** | **5%** |

**Critical Gap:** The audit system is implemented (lib, schema, UI, API) but almost zero routes call `logAudit()`. The infrastructure exists but is not wired up.

---

## Audit Actions Defined in `lib/audit.ts`

| Category | Action Constant | Value |
|----------|----------------|-------|
| Auth | LOGIN | `auth.login` |
| Auth | LOGOUT | `auth.logout` |
| Auth | LOGIN_FAILED | `auth.login_failed` |
| API Keys | API_KEY_CREATE | `api_key.create` |
| API Keys | API_KEY_REVOKE | `api_key.revoke` |
| API Keys | API_KEY_DELETE | `api_key.delete` |
| Widgets | WIDGET_CREATE | `widget.create` |
| Widgets | WIDGET_UPDATE | `widget.update` |
| Widgets | WIDGET_DELETE | `widget.delete` |
| Documents | DOCUMENT_UPLOAD | `document.upload` |
| Documents | DOCUMENT_DELETE | `document.delete` |
| Documents | DOCUMENT_PROCESS | `document.process` |
| Billing | BILLING_CHECKOUT | `billing.checkout` |
| Billing | BILLING_PLAN_CHANGE | `billing.plan_change` |
| Billing | BILLING_CANCEL | `billing.cancel` |
| Billing | BILLING_RESUBSCRIBE | `billing.resubscribe` |
| Subscription | SUBSCRIPTION_CREATED | `subscription.created` |
| Subscription | SUBSCRIPTION_UPDATED | `subscription.updated` |
| Subscription | SUBSCRIPTION_CANCELED | `subscription.canceled` |
| Subscription | SUBSCRIPTION_PAYMENT_FAILED | `subscription.payment_failed` |
| Members | MEMBER_INVITE | `member.invite` |
| Members | MEMBER_REMOVE | `member.remove` |
| Members | MEMBER_ROLE_CHANGE | `member.role_change` |
| MCP | MCP_SERVER_ADD | `mcp.server_add` |
| MCP | MCP_SERVER_REMOVE | `mcp.server_remove` |
| MCP | MCP_SERVER_UPDATE | `mcp.server_update` |
| Workspace | WORKSPACE_UPDATE | `workspace.update` |
| Workspace | WORKSPACE_SETTINGS | `workspace.settings` |

---

## Route-by-Route Audit

### ✅ Routes WITH Audit Logging (3/58)

| # | Route | Methods | Actions Logged | Status |
|---|-------|---------|----------------|--------|
| 1 | `app/api/v1/keys/route.ts` | GET, POST, DELETE | `api_key.create`, `api_key.revoke` | ✅ **AUDITED** |
| 2 | `app/api/v1/widget/create/route.ts` | POST | `widget.create` | ✅ **AUDITED** |
| 3 | `app/api/v1/widget/update/route.ts` | PUT | `widget.update` | ✅ **AUDITED** |

---

### ❌ Routes WITHOUT Audit Logging — SHOULD be Audited (22 routes)

#### Authentication (2 routes)

| # | Route | Methods | Action Needed | Priority |
|---|-------|---------|---------------|----------|
| 4 | `app/api/auth/[...nextauth]/route.ts` | GET, POST | `auth.login`, `auth.logout`, `auth.login_failed` | 🔴 **CRITICAL** |
| 5 | `app/api/auth/register/route.ts` | POST | `auth.register` (new action needed) | 🔴 **CRITICAL** |

**Note:** NextAuth handler is a passthrough — audit hooks must go in `lib/auth.ts` callbacks (`signIn`, `signOut`) or via NextAuth event handlers.

#### Billing (3 routes)

| # | Route | Methods | Action Needed | Priority |
|---|-------|---------|---------------|----------|
| 6 | `app/api/billing/checkout/route.ts` | POST, GET | `billing.checkout` (POST only) | 🔴 **CRITICAL** |
| 7 | `app/api/billing/portal/route.ts` | POST | `billing.portal_access` (new action needed) | 🟡 **HIGH** |
| 8 | `app/api/billing/webhook/route.ts` | POST | `subscription.created`, `subscription.updated`, `subscription.canceled`, `subscription.payment_failed` | 🔴 **CRITICAL** |

**Note:** Webhook route has no `auth()` — it uses Stripe signature verification. Audit must use `workspaceId` from the subscription lookup, not from auth session.

#### Workspace (2 routes)

| # | Route | Methods | Action Needed | Priority |
|---|-------|---------|---------------|----------|
| 9 | `app/api/workspace/route.ts` | GET, PATCH | `workspace.update` (PATCH only) | 🟡 **HIGH** |
| 10 | `app/api/workspace/billing/route.ts` | GET, POST | `billing.plan_change`, `billing.cancel` (POST only) | 🔴 **CRITICAL** |

#### Members (2 routes)

| # | Route | Methods | Action Needed | Priority |
|---|-------|---------|---------------|----------|
| 11 | `app/api/workspace/members/route.ts` | GET, POST | `member.invite` (POST only) | 🟡 **HIGH** |
| 12 | `app/api/workspace/members/[id]/route.ts` | PATCH, DELETE | `member.role_change` (PATCH), `member.remove` (DELETE) | 🟡 **HIGH** |

#### Documents (2 routes)

| # | Route | Methods | Action Needed | Priority |
|---|-------|---------|---------------|----------|
| 13 | `app/api/documents/[id]/route.ts` | GET, DELETE | `document.delete` (DELETE only) | 🟡 **HIGH** |
| 14 | `app/api/upload/route.ts` | POST | `document.upload` | 🟡 **HIGH** |

#### MCP (5 routes)

| # | Route | Methods | Action Needed | Priority |
|---|-------|---------|---------------|----------|
| 15 | `app/api/mcp/route.ts` | POST, GET, DELETE | `mcp.server_add` (POST), `mcp.server_remove` (DELETE) | 🟡 **HIGH** |
| 16 | `app/api/mcp/servers/route.ts` | GET, POST | `mcp.server_add` (POST only) | 🟡 **HIGH** |
| 17 | `app/api/mcp/servers/[id]/route.ts` | GET, PUT, DELETE | `mcp.server_update` (PUT), `mcp.server_remove` (DELETE) | 🟡 **HIGH** |
| 18 | `app/api/mcp/connect/route.ts` | POST, DELETE | `mcp.connect`, `mcp.disconnect` (new actions needed) | 🟢 **MEDIUM** |
| 19 | `app/api/mcp/call/route.ts` | POST | `mcp.tool_call` (new action needed, high-volume) | 🟢 **MEDIUM** |

#### Admin (1 route)

| # | Route | Methods | Action Needed | Priority |
|---|-------|---------|---------------|----------|
| 20 | `app/api/admin/settings/route.ts` | GET, POST | `workspace.settings` (POST only) | 🟡 **HIGH** |

#### Chat (1 route)

| # | Route | Methods | Action Needed | Priority |
|---|-------|---------|---------------|----------|
| 21 | `app/api/chat/sessions/route.ts` | GET, DELETE | `chat.session_delete` (DELETE only, new action needed) | 🟢 **MEDIUM** |

#### AI Prompts (3 routes)

| # | Route | Methods | Action Needed | Priority |
|---|-------|---------|---------------|----------|
| 22 | `app/api/ai/prompts/route.ts` | GET, POST | `prompt.create` (POST only, new action needed) | 🟢 **MEDIUM** |
| 23 | `app/api/ai/prompts/[id]/route.ts` | GET, PUT, DELETE | `prompt.update` (PUT), `prompt.delete` (DELETE) | 🟢 **MEDIUM** |
| 24 | `app/api/ai/prompts/[id]/revert/route.ts` | POST | `prompt.revert` (new action needed) | 🟢 **MEDIUM** |

---

### ❌ Routes WITHOUT Audit Logging — Don't Need Audit (33 routes)

#### Read-Only Dashboard/Analytics (9 routes)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 25 | `app/api/analytics/chat/route.ts` | GET | Read-only analytics query |
| 26 | `app/api/analytics/cost/route.ts` | GET | Read-only cost data |
| 27 | `app/api/analytics/events/route.ts` | POST | High-volume event ingestion (analytics, not audit) |
| 28 | `app/api/analytics/export/route.ts` | GET | Read-only export |
| 29 | `app/api/analytics/usage/route.ts` | GET | Read-only usage data |
| 30 | `app/api/dashboard/cost/route.ts` | GET | Read-only dashboard |
| 31 | `app/api/dashboard/stats/route.ts` | GET | Read-only dashboard |
| 32 | `app/api/dashboard/top-documents/route.ts` | GET | Read-only dashboard |
| 33 | `app/api/dashboard/usage/route.ts` | GET | Read-only dashboard |

#### Health Check (1 route)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 34 | `app/api/dashboard/health/route.ts` | GET | Health probe, no state change |

#### Read-Only AI (3 routes)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 35 | `app/api/ai/playground/route.ts` | POST | LLM inference (read-heavy, high-volume) |
| 36 | `app/api/ai/playground/compare/route.ts` | POST | LLM comparison (read-heavy) |
| 37 | `app/api/ai/playground/history/route.ts` | GET | Read-only history |

#### Read-Only AI Prompts (1 route)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 38 | `app/api/ai/prompts/[id]/test/route.ts` | POST | Prompt testing (read-heavy, no state change) |
| 39 | `app/api/ai/prompts/[id]/versions/route.ts` | GET | Read-only version list |

#### Read-Only Documents (1 route)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 40 | `app/api/documents/route.ts` | GET | Read-only document list |

#### Read-Only Knowledge (5 routes)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 41 | `app/api/knowledge/chunks/route.ts` | GET | Read-only chunk list |
| 42 | `app/api/knowledge/chunks/[id]/route.ts` | GET | Read-only chunk detail |
| 43 | `app/api/knowledge/chunks/[id]/similar/route.ts` | GET | Read-only similarity search |
| 44 | `app/api/knowledge/search/route.ts` | POST | Read-only search |
| 45 | `app/api/knowledge/sources/route.ts` | GET | Read-only source list |

#### Read-Only Knowledge Documents (1 route)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 46 | `app/api/knowledge/documents/route.ts` | GET | Read-only document list |
| 47 | `app/api/knowledge/documents/[id]/chunks/route.ts` | GET | Read-only chunk list |

#### Read-Only Admin (1 route)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 48 | `app/api/admin/models/route.ts` | GET | Read-only model list |

#### Read-Only Subscription (1 route)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 49 | `app/api/workspace/subscription/route.ts` | GET | Read-only plan list |

#### API Platform Read-Only (2 routes)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 50 | `app/api/v1/chat/route.ts` | POST | API chat (high-volume, read-heavy) |
| 51 | `app/api/v1/documents/route.ts` | GET | Read-only API document list |
| 52 | `app/api/v1/search/route.ts` | POST | Read-only API search |

#### API Platform Read (1 route)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 53 | `app/api/v1/widget/list/route.ts` | GET | Read-only widget list |

#### Public Widget (no auth) (2 routes)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 54 | `app/api/widget/config/route.ts` | GET | Public endpoint, no auth, no state change |
| 55 | `app/api/widget/chat/route.ts` | POST | Public endpoint, high-volume |

#### Widget Read (1 route)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 56 | `app/api/widget/analytics/route.ts` | GET | Read-only widget analytics |

#### Audit Self (1 route)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 57 | `app/api/audit/route.ts` | GET | Audit query endpoint (meta — querying audit logs doesn't need to audit itself) |

#### High-Volume Chat (1 route)

| # | Route | Methods | Reason |
|---|-------|---------|--------|
| 58 | `app/api/chat/route.ts` | POST | High-volume chat (audit every message would bloat audit log) |

---

## Coverage by Category

| Category | Total Routes | Audited | Should Audit | Coverage |
|----------|-------------|---------|--------------|----------|
| **Authentication** | 2 | 0 | 2 | **0%** 🔴 |
| **Billing** | 3 | 0 | 3 | **0%** 🔴 |
| **Stripe Webhooks** | 1 | 0 | 1 | **0%** 🔴 |
| **Workspace** | 2 | 0 | 2 | **0%** 🔴 |
| **Members** | 2 | 0 | 2 | **0%** 🔴 |
| **Documents** | 2 | 0 | 2 | **0%** 🔴 |
| **MCP** | 5 | 0 | 5 | **0%** 🔴 |
| **Admin** | 1 | 0 | 1 | **0%** 🔴 |
| **Chat Sessions** | 1 | 0 | 1 | **0%** 🟡 |
| **AI Prompts** | 3 | 0 | 3 | **0%** 🟡 |
| **API Keys** | 1 | 1 | 1 | **100%** ✅ |
| **Widgets** | 4 | 2 | 3 | **67%** 🟡 |
| **Read-Only/Dashboard** | 28 | 0 | 0 | N/A |
| **TOTAL** | **58** | **3** | **27** | **11%** |

---

## Missing Audit Actions

These actions need to be added to `lib/audit.ts` `AUDIT_ACTIONS`:

| Action | Value | Routes |
|--------|-------|--------|
| `auth.register` | User registration | `auth/register` |
| `billing.portal_access` | Portal session created | `billing/portal` |
| `mcp.connect` | MCP servers connected | `mcp/connect` POST |
| `mcp.disconnect` | MCP servers disconnected | `mcp/connect` DELETE |
| `mcp.tool_call` | MCP tool invoked | `mcp/call` POST |
| `chat.session_delete` | Chat session deleted | `chat/sessions` DELETE |
| `prompt.create` | AI prompt created | `ai/prompts` POST |
| `prompt.update` | AI prompt updated | `ai/prompts/[id]` PUT |
| `prompt.delete` | AI prompt deleted | `ai/prompts/[id]` DELETE |
| `prompt.revert` | AI prompt reverted | `ai/prompts/[id]/revert` POST |

---

## Tenant Isolation Audit

All 3 currently-audited routes correctly pass `workspaceId` from the authenticated session:

- `v1/keys/route.ts` → `workspaceId: workspace.id` ✅
- `v1/widget/create/route.ts` → `workspaceId: workspace.id` ✅
- `v1/widget/update/route.ts` → `workspaceId: workspace.id` ✅

**No cross-tenant audit leak detected** — but sample size is only 3 routes.

**Note:** `billing/webhook/route.ts` has no auth session — when audit is added, it must derive `workspaceId` from the subscription lookup (already available as `sub.workspaceId`).

---

## Priority Remediation Plan

### P0 — Critical (Security/Compliance)

1. **Auth events** — `lib/auth.ts` callbacks for login/logout/login_failed
2. **Stripe webhooks** — `billing/webhook/route.ts` for subscription lifecycle
3. **Billing changes** — `workspace/billing/route.ts` for plan_change/cancel
4. **Checkout** — `billing/checkout/route.ts` for checkout sessions

### P1 — High (Operational Audit)

5. **Member changes** — `workspace/members` POST, `workspace/members/[id]` PATCH/DELETE
6. **Document operations** — `documents/[id]` DELETE, `upload` POST
7. **MCP mutations** — `mcp/servers` POST, `mcp/servers/[id]` PUT/DELETE
8. **Workspace settings** — `workspace/route.ts` PATCH, `admin/settings` POST

### P2 — Medium (Nice to Have)

9. **Chat session delete** — `chat/sessions` DELETE
10. **AI prompt CRUD** — `ai/prompts` POST, `[id]` PUT/DELETE, `[id]/revert` POST

---

## Recommendations

1. **Immediate:** Wire up `logAudit` in `lib/auth.ts` signIn/signOut callbacks — this is the single highest-value change (covers all login/logout)
2. **Immediate:** Add audit calls to `billing/webhook/route.ts` — subscription events are compliance-critical
3. **Short-term:** Add audit to all 22 routes listed above — estimated ~2-3 hours of work
4. **Medium-term:** Consider high-volume filtering — `chat/route.ts` and `mcp/call/route.ts` should use sampling or batch logging to avoid audit log bloat
5. **Long-term:** Add `audit_logs` feature to Free plan (currently Enterprise only) — even free users benefit from basic audit trail

---

*Report generated by Hermes Agent — Audit Log Coverage Audit*
*All findings based on read-only code review of 58 route files*
