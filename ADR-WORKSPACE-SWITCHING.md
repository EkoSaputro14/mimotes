# ADR-WORKSPACE-SWITCHING.md — Architecture Decision Record

> **Title**: Cookie-Based Workspace Switching  
> **Date**: 2026-06-13  
> **Status**: Accepted  
> **Sprint**: 9B — Workspace Switching

---

## Context

Users who are members of multiple workspaces could only see their owner workspace after login. The `resolveWorkspaceId()` function defaulted to the user's owned workspace, ignoring any previously selected workspace. Multi-workspace users (e.g., freelancers, consultants, team leads) need to switch between workspaces without logging out and back in.

The system already uses:
- **NextAuth v5** with JWT strategy (no database sessions)
- **RLS policies** on all 27 tenant-scoped tables (Sprint 9A)
- **GUC `app.current_workspace_id`** for workspace-scoped queries
- **`withWorkspace()` middleware** for all API routes

The workspace switch must persist across page reloads and work with the existing RLS infrastructure.

---

## Decision

**Cookie-based workspace selection with HttpOnly cookie and membership verification.**

The selected workspace is stored in an HttpOnly cookie (`selected_workspace_id`) with a 30-day expiry. On every request, the workspace resolution chain checks: cookie → JWT → owner workspace. Membership is verified before allowing a switch.

### Implementation Details

1. **Cookie**: `selected_workspace_id` — HttpOnly, Secure, SameSite=Lax, 30-day expiry
2. **Resolution priority**: Cookie > JWT `selectedWorkspaceId` > owner workspace
3. **Switch API**: `POST /api/workspace/switch` — validates membership, sets cookie, audit logs
4. **Workspace listing**: `GET /api/workspace/switch` — returns all user workspaces with details
5. **UX**: Click workspace → POST → `window.location.reload()` to refresh all data

---

## Alternatives Considered

### Option A: JWT Re-Signing (REJECTED)

**Approach**: On workspace switch, re-issue the JWT with the new `selectedWorkspaceId`.

| Aspect | Assessment |
|---|---|
| Security | Good — token-based, stateless |
| Complexity | High — requires re-signing, token exchange, session invalidation |
| NextAuth v5 | Problematic — custom JWT re-signing bypasses NextAuth session flow |
| Performance | Moderate — requires crypto operations on each switch |
| Offline | Works — JWT is self-contained |

**Why rejected**: NextAuth v5 manages JWT lifecycle internally. Re-signing outside the standard flow risks breaking session callbacks, refresh token rotation, and token validation. The added complexity doesn't justify the marginal security benefit over HttpOnly cookies.

### Option B: localStorage + API Header (REJECTED)

**Approach**: Store `selectedWorkspaceId` in localStorage, send as X-Workspace-ID header on every request.

| Aspect | Assessment |
|---|---|
| Security | Poor — localStorage is accessible via XSS |
| Complexity | Low — simple client-side storage |
| Persistence | Client-side only — lost if storage is cleared |
| Server-side | Requires header parsing in middleware |

**Why rejected**: XSS vulnerability. Any injected script can read localStorage and exfiltrate workspace access. The HttpOnly cookie approach eliminates this attack vector entirely.

### Option C: Database Session Store (REJECTED)

**Approach**: Store workspace selection in a `user_sessions` table, fetched on every request.

| Aspect | Assessment |
|---|---|
| Security | Good — server-side only |
| Complexity | High — new table, session management, cleanup |
| Performance | Poor — extra DB query on every request |
| Scalability | Concerns with high-concurrency workspaces |

**Why rejected**: Over-engineered for a preference setting. Adds a database round-trip to every request. The cookie approach achieves the same outcome with zero server-side state.

---

## Consequences

### Positive

- **Simple**: No new database tables, no JWT manipulation, no session store
- **Secure**: HttpOnly cookie prevents XSS access; Secure flag prevents MITM; SameSite prevents CSRF
- **Compatible**: Works seamlessly with NextAuth v5 JWT strategy and existing `withWorkspace()` middleware
- **Persistent**: 30-day expiry keeps selection across sessions
- **Auditable**: Every switch is logged to `audit_logs` table
- **RLS-compatible**: Cookie value flows through to GUC `app.current_workspace_id` via existing middleware

### Negative

- **Full reload**: `window.location.reload()` causes a brief flash on switch (acceptable UX tradeoff)
- **30-day persistence**: User must explicitly clear cookie to reset to owner workspace (mitigated by "back to owner" option in switcher)
- **Cookie size**: Minimal — single UUID (36 bytes)

### Risks

| Risk | Mitigation |
|---|---|
| XSS steals cookie | HttpOnly flag — JavaScript cannot access `document.cookie` for this value |
| CSRF workspace switch | SameSite=Lax + POST method + membership verification |
| Stale cookie (workspace deleted) | Membership verified on every request; fallback to owner workspace |
| Multiple tabs, different workspaces | Each tab reads same cookie — consistent behavior |

---

## Resolution Priority Chain

```
┌─────────────────────────────────────┐
│  1. Cookie: selected_workspace_id   │  ← Highest priority
│     (set by POST /workspace/switch) │
├─────────────────────────────────────┤
│  2. JWT: selectedWorkspaceId        │  ← Set on sign-in
│     (from session callback)         │
├─────────────────────────────────────┤
│  3. Owner workspace                 │  ← Fallback
│     (WHERE role = 'OWNER')          │
└─────────────────────────────────────┘
```

---

## References

- Sprint 9A: Tenant Isolation Hardening (RLS on all tables)
- `lib/middleware/tenant.ts` — `withWorkspace()` implementation
- `app/api/workspace/switch/route.ts` — Switch API
- `tests/lib/workspace-switching.test.ts` — 23 tests covering resolution, membership, isolation, RLS
