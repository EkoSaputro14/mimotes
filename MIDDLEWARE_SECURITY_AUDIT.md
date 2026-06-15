# MIDDLEWARE_SECURITY_AUDIT.md

**Date:** 2026-06-06
**File:** `middleware.ts`
**Severity:** HIGH — False security boundary
**Verdict:** Middleware is a UX redirect, NOT a security gate

---

## TL;DR

**YES, an attacker can create a fake `authjs.session-token` cookie and bypass the middleware entirely.** The middleware only checks if the cookie *exists* — it never cryptographically verifies the JWT signature.

**However, the system IS secure** because every protected route handler also calls `auth()` which performs full cryptographic JWT verification. The middleware is defense-in-depth for UX, not security.

---

## How the Middleware Actually Works

```typescript
// Line 87-89 of middleware.ts
const sessionToken =
  request.cookies.get("authjs.session-token")?.value ||
  request.cookies.get("__Secure-authjs.session-token")?.value;

if (!sessionToken) {
  // Block
}
```

This code asks ONE question: **"Does a cookie named `authjs.session-token` exist?"**

It does NOT:
- ❌ Verify the JWT signature
- ❌ Check token expiration
- ❌ Validate the `NEXTAUTH_SECRET` signing key
- ❌ Decode the JWT payload
- ❌ Check if the user ID in the token is valid

---

## Attack Scenario

**Step 1:** Attacker opens browser DevTools → Application → Cookies

**Step 2:** Attacker creates a cookie:
```
Name: authjs.session-token
Value: fake-token-doesnt-matter
Path: /
```

**Step 3:** Attacker navigates to `/dashboard`

**Result:** Middleware sees cookie exists → lets request through → page loads (partially)

**What happens next depends on the route type:**

### API Routes (e.g., `GET /api/dashboard/stats`)
1. Middleware: cookie exists → ✅ pass
2. Route handler: `const session = await auth()` → JWT verification fails → returns `401 Unauthorized`
3. **Attacker is BLOCKED at route handler level** ✅

### Page Routes (e.g., `/dashboard`)
1. Middleware: cookie exists → ✅ pass
2. `DashboardShell` (Server Component): `const session = await auth()` → JWT verification fails → `redirect("/login")`
3. **Attacker is REDIRECTED to login** ✅

---

## Why This Architecture Is Correct

This is the **recommended NextAuth v5 pattern**, documented in the official docs:

> "Middleware in Next.js runs in the Edge Runtime, which does not have access to Node.js APIs. This means you cannot use `auth()` in middleware — it only runs in Node.js runtime."

The defense-in-depth model:

| Layer | Location | What It Does | Bypassable? |
|-------|----------|-------------|-------------|
| **Layer 1** | `middleware.ts` | Cookie existence check → fast redirect | ⚠️ YES (fake cookie) |
| **Layer 2** | Route handler `auth()` | Cryptographic JWT verification | ❌ NO |
| **Layer 3** | Server component `auth()` | Cryptographic JWT verification | ❌ NO |

**Layer 1 is a speed optimization, not a security boundary.** It prevents unauthenticated users from downloading the full page HTML before being redirected. Without it, the server would render the entire dashboard page just to redirect — wasteful.

---

## Audit of Protected Routes

### Routes with BOTH middleware + handler `auth()` (SECURE) ✅

All 37 protected API routes have `auth()` in their handlers:

```
✅ app/api/admin/models/route.ts
✅ app/api/admin/settings/route.ts
✅ app/api/ai/playground/compare/route.ts
✅ app/api/ai/playground/history/route.ts
✅ app/api/ai/playground/route.ts
✅ app/api/ai/prompts/[id]/revert/route.ts
✅ app/api/ai/prompts/[id]/route.ts
✅ app/api/ai/prompts/[id]/test/route.ts
✅ app/api/ai/prompts/[id]/versions/route.ts
✅ app/api/ai/prompts/route.ts
✅ app/api/analytics/chat/route.ts
✅ app/api/analytics/cost/route.ts
✅ app/api/analytics/events/route.ts
✅ app/api/analytics/export/route.ts
✅ app/api/analytics/usage/route.ts
✅ app/api/chat/route.ts
✅ app/api/chat/sessions/route.ts
✅ app/api/dashboard/cost/route.ts
✅ app/api/dashboard/stats/route.ts
✅ app/api/dashboard/top-documents/route.ts
✅ app/api/dashboard/usage/route.ts
✅ app/api/documents/[id]/route.ts
✅ app/api/documents/route.ts
✅ app/api/knowledge/chunks/[id]/route.ts
✅ app/api/knowledge/chunks/[id]/similar/route.ts
✅ app/api/knowledge/chunks/route.ts
✅ app/api/knowledge/documents/[id]/chunks/route.ts
✅ app/api/knowledge/documents/route.ts
✅ app/api/knowledge/search/route.ts
✅ app/api/knowledge/sources/route.ts
✅ app/api/mcp/call/route.ts
✅ app/api/mcp/connect/route.ts
✅ app/api/mcp/route.ts
✅ app/api/mcp/servers/[id]/route.ts
✅ app/api/mcp/servers/route.ts
✅ app/api/mcp/tools/route.ts
✅ app/api/upload/route.ts
```

### Routes intentionally WITHOUT `auth()` (correct) ✅

```
✅ app/api/auth/[...nextauth]/route.ts  — NextAuth handler (must be public)
✅ app/api/auth/register/route.ts       — Registration endpoint
✅ app/api/dashboard/health/route.ts    — Health check (monitoring)
```

### Page routes — protected by `DashboardShell` calling `auth()` ✅

```
✅ /dashboard    → DashboardShell calls auth()
✅ /documents    → DashboardShell calls auth()
✅ /settings     → DashboardShell calls auth()
✅ /ai/*         → DashboardShell calls auth()
✅ /analytics/*  → DashboardShell calls auth()
✅ /knowledge/*  → DashboardShell calls auth()
```

---

## Identified Weaknesses

### W-01 | HIGH | No JWT Verification in Middleware

- **Description:** Middleware checks cookie existence only. No cryptographic verification.
- **Impact:** Attacker with fake cookie reaches route handler before being rejected. Adds ~1 extra HTTP round-trip to the attack.
- **Why it's acceptable:** Edge Runtime cannot do Node.js crypto. Route-level `auth()` is the real security boundary. This is documented NextAuth v5 behavior.
- **Fix:** Not fixable in Edge Runtime. Rely on route-level `auth()`.

### W-02 | MEDIUM | CSP Allows `unsafe-inline` and `unsafe-eval`

- **Description:** Content-Security-Policy includes `'unsafe-inline'` and `'unsafe-eval'` for `script-src`.
- **Impact:** If an XSS vulnerability exists, CSP will not prevent inline script execution.
- **Why it's acceptable:** Next.js requires `unsafe-inline` for hydration scripts and `unsafe-eval` for Turbopack dev mode. In production with standalone output, `unsafe-eval` could potentially be removed.
- **Fix:** Test production build without `unsafe-eval`. Use nonce-based CSP if possible.

### W-03 | MEDIUM | `pathname.includes(".")` Bypass

- **Description:** Line 72: `pathname.includes(".")` skips ANY path containing a dot, not just static files.
- **Impact:** A route like `/api/v1.0/users` would be skipped by middleware entirely.
- **Fix:** Use more specific check: `pathname.match(/\.\w{2,4}$/)` to only match file extensions.

### W-04 | LOW | Cookie Name Hardcoded

- **Description:** Middleware hardcodes `authjs.session-token` and `__Secure-authjs.session-token`.
- **Impact:** If NextAuth config changes the cookie name, middleware silently stops working.
- **Fix:** Use `NEXTAUTH_COOKIE_PREFIX` env var or derive from NextAuth config.

### W-05 | LOW | No Rate Limiting in Middleware

- **Description:** Middleware doesn't apply rate limiting. Rate limiting is only in individual route handlers.
- **Impact:** Attacker can flood protected routes with requests, each reaching the route handler before being rejected.
- **Fix:** Add rate limiting in middleware for API routes (requires Edge-compatible rate limiter).

---

## Verification Test

```bash
# Test: Can we bypass middleware with a fake cookie?
curl -v -b "authjs.session-token=fake-value" http://localhost:3000/api/dashboard/stats

# Expected behavior:
# Middleware: cookie exists → pass through
# Route handler: auth() rejects → 401 Unauthorized

# Without cookie:
curl -v http://localhost:3000/api/dashboard/stats

# Expected behavior:
# Middleware: no cookie → 401 Unauthorized
```

Both paths result in 401, but the fake-cookie path adds one extra network hop.

---

## Recommendations

### Immediate (This Sprint)

1. **Document the two-layer pattern** — Add comment in middleware.ts explaining it's a UX redirect, not security
2. **Fix `pathname.includes(".")`** — Change to file extension regex
3. **Add security comment** — Make it clear that route-level `auth()` is the real auth

### Next Sprint

4. **Add Edge-compatible rate limiting** — Use `@upstash/ratelimit` with Edge Runtime adapter
5. **Nonce-based CSP** — Replace `unsafe-inline` with per-request nonces
6. **Remove `unsafe-eval`** in production — Test standalone build without it

---

## Summary

| Question | Answer |
|----------|--------|
| Does middleware verify JWT cryptographically? | **NO** — checks cookie existence only |
| Can attacker bypass middleware with fake cookie? | **YES** — trivially |
| Is the system actually secure? | **YES** — route-level `auth()` provides real crypto verification |
| Is this a vulnerability? | **NO** — this is the recommended NextAuth v5 pattern |
| What's the real security boundary? | `auth()` calls in route handlers and server components |
| Should we fix it? | **Not the middleware** — fix the `pathname.includes(".")` bug and add rate limiting |

---

*End of MIDDLEWARE_SECURITY_AUDIT.md*
