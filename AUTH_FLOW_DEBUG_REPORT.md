# AUTH_FLOW_DEBUG_REPORT.md
## MimoNotes Auth Flow Debug Report
**Date:** 2026-06-14 | **Method:** Source code trace + Docker logs + NextAuth analysis

---

## AUTH ARCHITECTURE

| Component | File | Technology |
|-----------|------|------------|
| Auth config | `lib/auth.ts` | NextAuth v5 (beta), Credentials provider |
| Session strategy | JWT | No database sessions |
| Handler | `app/api/auth/[...nextauth]/route.ts` | Standard NextAuth catch-all |
| Middleware | `middleware.ts` | UX redirect only (checks cookie presence) |
| Server actions | `lib/actions.ts` | login(), logout(), register() |
| API auth | `lib/api-auth.ts` | Bearer token (separate from session) |
| Custom pages | `pages: { signIn: "/login" }` | Custom sign-in page |

---

## ISSUE 1: LOGOUT MissingCSRF

### Evidence

**Docker Log:**
```
[auth][error] MissingCSRF: CSRF token was missing during an action signout.
```

**Playwright Observation:**
```
URL after logout: /login?error=MissingCSRF
```

### Root Cause

There are TWO logout mechanisms in the codebase:

#### BROKEN: `components/layout/top-nav.tsx` (lines 210-214)
```javascript
onClick={() => {
  const form = document.createElement("form");
  form.action = "/api/auth/signout";
  form.method = "POST";
  document.body.appendChild(form);
  form.submit();
}}
```

**Problem:** Creates a raw HTML form that POSTs directly to `/api/auth/signout` WITHOUT including the `csrfToken` field in the form body. NextAuth v5's signout handler requires a CSRF token in the POST body.

#### WORKING: `components/layout/app-sidebar.tsx` (line 157)
```jsx
<form action={logout}>
```

**Why it works:** Calls the `logout` server action from `lib/actions.ts`, which calls `signOut({ redirectTo: "/" })` server-side. Server-side `signOut` handles CSRF internally — no token needed in the request.

### Fix

Replace the broken `top-nav.tsx` logout with either:
1. Use the server action: `<form action={logout}><button>Log out</button></form>`
2. Or fetch CSRF token from `/api/auth/csrf` first, then include it in the form body

---

## ISSUE 2: /api/audit Returns 404 (Route Missing)

### Evidence

**Playwright Observation:**
```
/settings/audit shows "This page couldn't load" error state
Console: 2x 401 Unauthorized
```

### Root Cause

**There is NO `app/api/audit/route.ts` file in the project.** The API endpoint was never implemented.

**What exists:**
- `lib/audit.ts` — audit log service with functions:
  - `logAudit()` — write audit events
  - `queryAuditLogs()` — query audit logs
  - `exportAuditLogsCsv()` — export as CSV
  - `getAuditSummary()` — get summary stats
- `components/audit/audit-log-viewer.tsx` — UI component that fetches `/api/audit?...`
- `app/(admin)/settings/audit/page.tsx` — page that renders AuditLogViewer

**What's missing:**
- `app/api/audit/route.ts` — the API route handler that bridges the UI component to the audit service

### Component Behavior

The `AuditLogViewer` component makes client-side fetches to `/api/audit`. Since the route doesn't exist, Next.js returns 404. The component catches this error and shows "This page couldn't load" with Reload/Back buttons.

The 401 errors observed in Playwright may be from the middleware redirecting unauthenticated requests, or from the component's error handling.

### Fix

Create `app/api/audit/route.ts` with:
1. `auth()` check for session
2. Call `queryAuditLogs()` from `lib/audit.ts`
3. Return audit log data

---

## ISSUE 3: RLS Violations in Audit Logging

### Evidence

**Docker Log:**
```
[Audit] Failed to log: PrismaClientUnknownRequestError:
prisma.auditLog.create() → 42501 "new row violates row-level security policy for table \"audit_logs\""
```

### Root Cause

`logAudit()` in `lib/audit.ts` is fire-and-forget — it's called after the main operation. But:

1. The `audit_logs` table has RLS: `workspace_id = current_setting('app.current_workspace_id')`
2. `setWorkspaceContext()` may not have been called yet (due to the resolveWorkspaceId deadlock)
3. Even if called, some audit events use `"system"` as workspaceId, which doesn't match any real workspace

### Impact

Audit trail is silently broken — events are not being recorded. This is a compliance issue for any SaaS product.

---

## AUTH FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│                    LOGIN FLOW                           │
├─────────────────────────────────────────────────────────┤
│ 1. User fills form (email + password)                   │
│ 2. Client calls signIn("credentials", {...})            │
│ 3. NextAuth authorize callback:                         │
│    a. prisma.user.findUnique({where: {email}})          │
│    b. bcrypt.compare(password, user.passwordHash)       │
│    c. Return user object or null                        │
│ 4. JWT created with: { id, email, selectedWorkspaceId } │
│ 5. Session cookie set: authjs.session-token             │
│ 6. Redirect to /documents                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    REQUEST FLOW                         │
├─────────────────────────────────────────────────────────┤
│ 1. Browser sends request with session cookie            │
│ 2. Middleware: checks cookie existence (UX only)        │
│ 3. Route handler:                                       │
│    a. auth() → verify JWT → session.user.id             │
│    b. resolveWorkspaceId(userId) → workspaceId          │
│    c. setWorkspaceContext(workspaceId) → SETS RLS       │
│    d. Prisma queries → RLS filters by workspace         │
│ 4. Response returned                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    LOGOUT FLOW (BROKEN)                 │
├─────────────────────────────────────────────────────────┤
│ 1. User clicks logout in top-nav                        │
│ 2. JavaScript creates <form action="/api/auth/signout"> │
│ 3. Form POSTs WITHOUT csrfToken field                   │
│ 4. NextAuth rejects: MissingCSRF                        │
│ 5. Redirect to /login?error=MissingCSRF                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    LOGOUT FLOW (WORKING)                │
├─────────────────────────────────────────────────────────┤
│ 1. User clicks logout in sidebar                        │
│ 2. <form action={logout}> calls server action           │
│ 3. Server action calls signOut({ redirectTo: "/" })     │
│ 4. NextAuth handles CSRF internally                     │
│ 5. Session cleared, redirect to /                       │
└─────────────────────────────────────────────────────────┘
```

---

## COOKIE CONFIGURATION

| Cookie | SameSite | Secure | HttpOnly | Notes |
|--------|----------|--------|----------|-------|
| authjs.session-token | lax | auto | yes | NextAuth default |
| __Secure-authjs.session-token | lax | yes | yes | Used when HTTPS |
| selected_workspace_id | lax | NO | yes | Workspace switch cookie |
| next-auth.csrf-token | lax | auto | yes | CSRF protection |

**Issue:** `selected_workspace_id` is set WITHOUT `Secure` flag. Works on HTTP localhost but may cause issues in production HTTPS.

---

## NEXTAUTH V5 CONFIGURATION

```typescript
// lib/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    authorize: async (credentials) => {
      // Find user by email
      // Compare password with bcrypt
      // Return user object or null
    }
  })],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt: ({ token, user }) => {
      // Add user.id and selectedWorkspaceId to token
      return token;
    },
    session: ({ session, token }) => {
      // Add token.id to session.user.id
      return session;
    }
  },
  trustHost: true
});
```

**Key observations:**
1. JWT strategy — no database sessions, all state in JWT
2. Custom sign-in page at `/login`
3. `trustHost: true` — allows any host (needed for Docker)
4. No custom CSRF configuration — uses NextAuth defaults

---

## MIDDLEWARE ANALYSIS

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = request.cookies.get("authjs.session-token");
  
  // Only redirect UX pages — NOT API routes
  if (!session && isProtectedPage(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  return NextResponse.next();
}
```

**Key observations:**
1. Middleware only checks cookie PRESENCE, not validity
2. JWT verification happens in `auth()` inside route handlers
3. API routes are NOT protected by middleware (only by `auth()` in handlers)
4. This means unauthenticated API requests reach the route handler before being rejected

---

## FIX SUMMARY

| Issue | Severity | Fix | Effort |
|-------|----------|-----|--------|
| Logout MissingCSRF | HIGH | Replace top-nav logout with server action | 15 min |
| /api/audit missing | HIGH | Create route.ts with auth + query logic | 1 hour |
| Audit logging broken | MEDIUM | Ensure workspace context before logAudit() | 30 min |
| Cookie Secure flag | LOW | Add Secure flag to selected_workspace_id | 5 min |
