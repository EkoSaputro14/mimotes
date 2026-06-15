# FRONTEND_SECURITY_AUDIT.md
## MimoNotes Frontend Audit — Phase 5
**Date:** 2026-06-14 | **Auditor:** Hermes Agent | **Method:** Code Inspection + Playwright

---

## Security Posture Summary

| Category | Score | Status |
|----------|-------|--------|
| XSS Prevention | 7/10 | ⚠️ Acceptable with gaps |
| Secret Management | 8/10 | ✅ Good |
| Authentication | 7/10 | ⚠️ CSRF issue |
| Authorization | 9/10 | ✅ Strong RLS |
| CSP Policy | 5/10 | ⚠️ Weak with unsafe-eval |
| Data Exposure | 8/10 | ✅ Good |
| Input Validation | 6/10 | ⚠️ Client-side gaps |
| **Overall** | **7.1/10** | **ACCEPTABLE** |

---

## FINDINGS

### SEC-001: API Key Stored in localStorage [HIGH]

**File:** `components/developers/api-keys-manager.tsx` (line 79)
**Evidence:**
```javascript
localStorage.getItem("api_key") || ""
```
**Risk:** localStorage is accessible to any JavaScript on the same origin. If any XSS vector exists, attacker can exfiltrate the API key.
**Recommendation:** Move to httpOnly cookie or sessionStorage with strict CSP.
**OWASP:** A03:2021 — Injection

---

### SEC-002: CSP Allows 'unsafe-eval' [MEDIUM]

**File:** `next.config.ts` (lines 28-29)
**Evidence:**
```
script-src 'self' 'unsafe-eval' 'unsafe-inline'
style-src 'self' 'unsafe-inline'
```
**Risk:** `unsafe-eval` enables `eval()`, which is the primary XSS escalation path. Combined with `unsafe-inline`, CSP provides minimal protection.
**Recommendation:** Remove `unsafe-eval`. Use nonce-based or hash-based CSP for inline scripts.
**OWASP:** A03:2021 — Injection

---

### SEC-003: No HTML Sanitization on Markdown [MEDIUM]

**File:** `components/chat/message-bubble.tsx`
**Evidence:** Uses `react-markdown` with `rehype-highlight` but no explicit DOMPurify sanitization.
**Mitigation:** react-markdown does NOT render raw HTML by default (good). Links use `target="_blank"` with `rel="noopener noreferrer"` (good).
**Risk:** Low if react-markdown default behavior is maintained. Higher if `rehype-raw` is ever added.
**Recommendation:** Add DOMPurify as belt-and-suspenders. Document the security assumption.
**OWASP:** A03:2021 — Injection

---

### SEC-004: Workspace ID Submitted from Client [LOW]

**File:** `components/workspace/workspace-switcher.tsx` (lines 100-117)
**Evidence:**
```javascript
body: JSON.stringify({ workspaceId })
```
**Mitigation:** Server-side `withWorkspace()` middleware validates workspace membership. RLS policies enforce tenant isolation at DB level.
**Risk:** Low — defense-in-depth is properly implemented.
**OWASP:** A01:2021 — Broken Access Control

---

### SEC-005: CSRF Token Missing on Logout [MEDIUM]

**Evidence:** Playwright test shows `/login?error=MissingCSRF` after logout.
**Risk:** CSRF protection gap in logout flow. Could allow forced logout attacks.
**Recommendation:** Ensure NextAuth signout includes CSRF token.
**OWASP:** A01:2021 — Broken Access Control

---

### SEC-006: No Rate Limiting on Login [LOW]

**File:** `components/auth/login-form.tsx`
**Evidence:** Login form has no visible rate limiting or CAPTCHA.
**Mitigation:** Server-side rate limiting via `lib/ratelimit.ts` (Upstash or in-memory).
**Risk:** Low if server-side rate limiting is effective. Brute-force attempts possible.
**OWASP:** A07:2021 — Identification and Authentication Failures

---

### SEC-007: No Input Validation on Client [LOW]

**File:** `components/auth/login-form.tsx`, `components/auth/register-form.tsx`
**Evidence:** Forms have HTML `required` attribute but no JavaScript validation before submit.
**Mitigation:** Server-side validation via NextAuth and Prisma.
**Risk:** Low — server validates. Poor UX but not a security hole.
**OWASP:** A03:2021 — Injection

---

## POSITIVE FINDINGS

### SEC-P001: AES-256-GCM Encryption for Stored Secrets ✅

**File:** `lib/crypto.ts`
**Evidence:** API keys encrypted with AES-256-GCM (authenticated encryption) before storage. `isSecretKey()` correctly identifies keys that should be encrypted.

### SEC-P002: API Key Hashing with SHA-256 ✅

**File:** `lib/api-keys.ts`
**Evidence:** API keys hashed with SHA-256 before storage. Raw keys only shown once at creation. `validateApiKey()` compares hashes, not raw values.

### SEC-P003: RLS-Based Tenant Isolation ✅

**Files:** `lib/middleware/tenant.ts`, `lib/prisma.ts`
**Evidence:** Workspace isolation enforced via PostgreSQL RLS. `setWorkspaceContext()` sets `app.current_workspace_id`. RLS policies on all tenant tables.

### SEC-P004: No NEXT_PUBLIC Secrets Leaked ✅

**Evidence:** Grep for `NEXT_PUBLIC_` in .tsx files returned 0 results. All `process.env` usage is server-side only.

### SEC-P005: Widget CORS Origin Validation ✅

**File:** `app/api/widget/chat/route.ts`
**Evidence:** Dynamic CORS via `buildWidgetCorsHeaders()` with explicit origin validation against `allowedDomains`. No wildcard CORS.

### SEC-P006: Admin Settings Returns Masked API Keys ✅

**File:** `app/api/admin/settings/route.ts`
**Evidence:** GET endpoint returns `maskApiKey(aiApiKey)` — full key never returned to frontend.

---

## SECURITY HEADERS

| Header | Status | Value |
|--------|--------|-------|
| Content-Security-Policy | ⚠️ WEAK | Allows unsafe-eval, unsafe-inline |
| X-Frame-Options | ✅ | DENY |
| X-Content-Type-Options | ✅ | nosniff |
| Referrer-Policy | ✅ | strict-origin-when-cross-origin |
| Permissions-Policy | ✅ | Configured |
| Strict-Transport-Security | ✅ | Configured |

---

## DATA FLOW SECURITY

| Flow | Assessment | Evidence |
|------|------------|----------|
| Auth tokens | ✅ Secure | httpOnly cookies via NextAuth |
| API keys | ✅ Secure | AES-256-GCM encrypted, SHA-256 hashed |
| User input | ⚠️ Partial | Server validates, client trusts React escaping |
| File uploads | ✅ Secure | Type/size validated, stored in public/uploads |
| WebSocket/Streaming | ✅ Secure | SSE via Next.js response streaming |

---

## ATTACK SURFACE

| Vector | Risk | Mitigation |
|--------|------|------------|
| XSS via markdown | Low | react-markdown default no-raw-HTML |
| XSS via eval | Medium | CSP unsafe-eval weakens protection |
| CSRF on mutations | Low | NextAuth CSRF tokens |
| CSRF on logout | Medium | Missing CSRF token observed |
| IDOR on workspace | Low | RLS + withWorkspace() middleware |
| Brute force login | Low | Server-side rate limiting |
| File upload RCE | Low | Type whitelist enforced |
| API key theft via XSS | Medium | localStorage exposure |
| Session fixation | Low | NextAuth handles session management |

---

## RECOMMENDATIONS (Priority Order)

1. **Remove unsafe-eval from CSP** — High impact, moderate effort
2. **Move API key from localStorage** — High impact, low effort
3. **Fix CSRF on logout** — Medium impact, low effort
4. **Add DOMPurify for markdown** — Medium impact, low effort
5. **Add client-side form validation** — Low impact, low effort
6. **Add focus ring styles** — Low impact, low effort
