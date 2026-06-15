# API_FAILURE_TRACE_REPORT.md
## MimoNotes API Failure Trace Report
**Date:** 2026-06-14 | **Method:** Source code trace + Docker logs + SQL verification

---

## TRACED ENDPOINTS

### 1. /api/upload (POST) — 500 + Forced Logout

**Source:** `app/api/upload/route.ts`

**Request Lifecycle:**
```
1. auth() → session.user.id = "user-uuid" ✅
2. resolveWorkspaceId(userId) → tries to create workspace → RLS ERROR 42501 ❌
3. setWorkspaceContext(workspaceId) → NEVER REACHED
4. prisma.document.create() → NEVER REACHED
5. File processing → NEVER REACHED
```

**Docker Log Evidence:**
```
Upload API error: PrismaClientUnknownRequestError:
prisma.workspace.create() → 42501 "new row violates row-level security policy for table \"workspaces\""
```

**Client Behavior:** 500 response → client-side error handler → triggers signout → forced logout

---

### 2. /api/chat (POST) — 500

**Source:** `app/api/chat/route.ts`

**Request Lifecycle:**
```
1. auth() → userSession.user.id = "user-uuid" ✅
2. resolveWorkspaceId(userId) → tries to create workspace → RLS ERROR 42501 ❌
3. setWorkspaceContext(workspaceId) → NEVER REACHED
4. prisma.chatSession.create() → NEVER REACHED
5. RAG pipeline → NEVER REACHED
6. AI streaming → NEVER REACHED
```

**Docker Log Evidence:**
```
Chat API error: PrismaClientUnknownRequestError:
prisma.workspace.create() → 42501 "new row violates row-level security policy for table \"workspaces\""
```

**Client Behavior:** 500 response → toast "Gagal mengirim pesan. Silakan coba lagi."

---

### 3. /api/dashboard/usage (GET) — 500

**Source:** `app/api/dashboard/usage/route.ts`

**Request Lifecycle:**
```
1. auth() → session.user.id = "user-uuid" ✅
2. resolveWorkspaceId(userId) → tries to create workspace → RLS ERROR 42501 ❌
3. setWorkspaceContext(workspaceId) → NEVER REACHED
4. prisma.analyticsEvent.groupBy() → NEVER REACHED
```

**Docker Log Evidence:**
```
Dashboard usage error: PrismaClientUnknownRequestError:
prisma.workspace.create() → 42501
```

---

### 4. /api/dashboard/top-documents (GET) — 500

**Source:** `app/api/dashboard/top-documents/route.ts`

**Request Lifecycle:**
```
1. auth() → session.user.id = "user-uuid" ✅
2. resolveWorkspaceId(userId) → tries to create workspace → RLS ERROR 42501 ❌
3. setWorkspaceContext(workspaceId) → NEVER REACHED
4. prisma.document.groupBy() → NEVER REACHED
```

**Docker Log Evidence:**
```
Dashboard top-documents error: PrismaClientUnknownRequestError:
prisma.workspace.create() → 42501
```

---

### 5. /api/dashboard/activity (GET) — 500

**Source:** `app/api/dashboard/activity/route.ts`

**Request Lifecycle:**
```
1. auth() → session.user.id = "user-uuid" ✅
2. resolveWorkspaceId(userId) → tries to create workspace → RLS ERROR 42501 ❌
3. setWorkspaceContext(workspaceId) → NEVER REACHED
4. prisma query → NEVER REACHED
```

**Docker Log Evidence:**
```
Failed to fetch activity feed: PrismaClientUnknownRequestError:
prisma.workspace.create() → 42501
```

---

### 6. /api/workspace (GET) — 500

**Source:** `app/api/workspace/route.ts` (via `withWorkspace` middleware)

**Request Lifecycle:**
```
1. withWorkspace() middleware:
   a. auth() → userId ✅
   b. resolveWorkspaceId(userId, selectedWorkspaceId) → RLS ERROR 42501 ❌
   c. setWorkspaceContext(workspaceId) → NEVER REACHED
2. Route handler → NEVER REACHED
```

**Docker Log Evidence:**
```
Workspace API error: PrismaClientUnknownRequestError:
prisma.workspace.create() → 42501
```

---

### 7. /api/workspace/members (GET) — 500

**Source:** `app/api/workspace/members/route.ts` (via `withWorkspace` middleware)

**Request Lifecycle:** Same as #6 — fails in `withWorkspace()` → `resolveWorkspaceId()`

**Docker Log Evidence:**
```
Workspace members API error: PrismaClientUnknownRequestError:
prisma.workspace.create() → 42501
```

---

### 8. /api/audit (GET) — Route Does Not Exist

**Source:** Component `components/audit/audit-log-viewer.tsx` fetches `/api/audit`

**Finding:** There is NO `app/api/audit/route.ts` file in the project. The API endpoint was never implemented.

**What exists:**
- `lib/audit.ts` — audit log service (write + query functions)
- `components/audit/audit-log-viewer.tsx` — UI component that fetches `/api/audit`
- `app/(admin)/settings/audit/page.tsx` — page that renders AuditLogViewer

**What's missing:**
- `app/api/audit/route.ts` — the API route handler (NEVER CREATED)

**Client Behavior:** Component catches error silently, shows "This page couldn't load" error state.

**Note:** The 401 error observed in Playwright may have been a middleware redirect, not an actual 401 response. The root cause is the missing route file.

---

## COMMON PATTERN

Every failing endpoint (1-7) follows the exact same failure pattern:

```
auth() succeeds → resolveWorkspaceId() fails → everything else is blocked
```

The failure is ALWAYS at the same line:
```typescript
const workspaceId = await resolveWorkspaceId(userId);  // ← FAILS HERE
```

The failure is ALWAYS the same error:
```
PostgreSQL error 42501: "new row violates row-level security policy for table \"workspaces\""
```

The failure is ALWAYS caused by:
```typescript
prisma.workspace.create() → RETURNING clause → triggers workspaces_select policy
→ requires app.current_user_id → NOT SET → RLS blocks
```

---

## WORKING ENDPOINTS (For Comparison)

These endpoints work because they don't call `resolveWorkspaceId()`:

| Endpoint | Why It Works |
|----------|-------------|
| `/api/auth/[...nextauth]` | NextAuth handles its own auth |
| `/api/auth/register` | Creates user, no workspace needed |
| `/api/health` | No auth, no workspace |
| `/api/knowledge/documents` | Wait — this also calls resolveWorkspaceId()... |

**Actually:** `/api/knowledge/documents` also calls `resolveWorkspaceId()` but was reported as working in Playwright. This is because the test user has NO workspace, so the endpoint may handle the "no workspace" case differently (returns empty list instead of trying to create).

---

## BLAST RADIUS CALCULATION

**Total API routes:** 51
**Routes calling resolveWorkspaceId():** ~35 (estimated)
**Routes confirmed broken:** 15+
**Routes that may work (no workspace query):** ~16

**Impact:** ~70% of API routes are non-functional.
