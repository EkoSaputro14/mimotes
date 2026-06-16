# FRONTEND_BUGLIST.md
## MimoNotes Frontend Audit — Phase 6
**Date:** 2026-06-14 | **Auditor:** Hermes Agent | **Total Bugs:** 15

---

## P0 — CRITICAL (Data Loss / Tenant Leakage / Auth Bypass / Broken Core)

### BUG-001: FORCE RLS Blocks All Database Writes
- **Severity:** P0 CRITICAL
- **Reproduction:** Login → /documents/upload → Select file → Click "Upload Dokumen"
- **Expected:** File uploads successfully, document appears in list
- **Actual:** API returns 500, "Coba Lagi" button appears, retry causes forced logout
- **Root cause:** PostgreSQL `FORCE ROW LEVEL SECURITY` on 25 tables forces the table owner (`mimotes_app`) to obey RLS policies. `prisma.workspace.create()` fails with error 42501.
- **Fix:** Run `ALTER TABLE <table> NO FORCE ROW LEVEL SECURITY;` on all 25 affected tables
- **Files:** Database migration, `lib/prisma.ts` (resolveWorkspaceId)
- **Impact:** Breaks Upload, Dashboard (4x), Chat, Analytics (3x), Settings (3x), Workspace (2x), Widgets

### BUG-002: Document Upload Causes Forced Logout
- **Severity:** P0 CRITICAL
- **Reproduction:** Login → /documents/upload → Upload any file → Retry after failure
- **Expected:** Upload fails with error message, user stays logged in
- **Actual:** User is redirected to /login (forced logout)
- **Root cause:** RLS error in workspace.create() cascades to session invalidation
- **Fix:** Fix BUG-001 (RLS). Also add error handling to prevent session invalidation on API errors.
- **Files:** `app/api/upload/route.ts`
- **Impact:** Data loss (uploaded file lost), user confusion, trust erosion

### BUG-003: Chat API Returns 500
- **Severity:** P0 CRITICAL
- **Reproduction:** Login → /chat → Type message → Send
- **Expected:** AI responds with answer
- **Actual:** 500 error "Terjadi kesalahan saat memproses pesan"
- **Root cause:** RLS blocks workspace resolution in chat pipeline
- **Fix:** Fix BUG-001 (RLS)
- **Files:** `app/api/chat/route.ts`
- **Impact:** Core feature (chat) completely non-functional

---

## P1 — HIGH (Feature Unusable / Major UX Blocker)

### BUG-004: Dashboard Shows 4x 500 API Errors
- **Severity:** P1 HIGH
- **Reproduction:** Login → /dashboard
- **Expected:** Dashboard loads with stats, charts, activity feed
- **Actual:** Console shows 4x 500 errors (usage, top-documents, activity, stats)
- **Root cause:** RLS blocks all dashboard API queries
- **Fix:** Fix BUG-001 (RLS)
- **Files:** `app/api/dashboard/usage/route.ts`, `top-documents`, `activity`, `stats`
- **Impact:** Dashboard shows skeleton loaders but no data

### BUG-005: Settings/audit Shows Error Page
- **Severity:** P1 HIGH
- **Reproduction:** Login → /settings/audit
- **Expected:** Audit log viewer loads
- **Actual:** "This page couldn't load" error with Reload/Back buttons (401)
- **Root cause:** Authentication middleware issue (separate from RLS)
- **Fix:** Investigate auth check in audit route
- **Files:** `app/api/audit/route.ts`
- **Impact:** Audit trail feature completely inaccessible

### BUG-006: Logout CSRF Error
- **Severity:** P1 HIGH
- **Reproduction:** Login → Logout
- **Expected:** Clean redirect to /login
- **Actual:** Redirect to /login?error=MissingCSRF
- **Root cause:** NextAuth signout flow doesn't include CSRF token
- **Fix:** Configure NextAuth signout to include CSRF token
- **Files:** `lib/auth.ts`, `components/layout/top-nav.tsx`
- **Impact:** Logout works but with error parameter, may confuse analytics

---

## P2 — MEDIUM (Incorrect Behavior / Visual Issues)

### BUG-007: CSP Allows unsafe-eval and unsafe-inline
- **Severity:** P2 MEDIUM
- **Reproduction:** Inspect response headers on any page
- **Expected:** CSP without unsafe-eval
- **Actual:** `script-src 'self' 'unsafe-eval' 'unsafe-inline'`
- **Root cause:** next.config.ts security headers configured with weak CSP
- **Fix:** Remove unsafe-eval, use nonce-based CSP for inline scripts
- **Files:** `next.config.ts`
- **Impact:** XSS attack surface significantly expanded

### BUG-008: API Key Stored in localStorage
- **Severity:** P2 MEDIUM
- **Reproduction:** Navigate to /developers → API Keys tab
- **Expected:** API key not stored in accessible client storage
- **Actual:** `localStorage.getItem("api_key")` used in code
- **Root cause:** Design decision to cache API key in localStorage
- **Fix:** Move to httpOnly cookie or in-memory state
- **Files:** `components/developers/api-keys-manager.tsx`
- **Impact:** API key exfiltrable via XSS

### BUG-009: Analytics Pages Show 500 Errors
- **Severity:** P2 MEDIUM
- **Reproduction:** Login → /analytics/chat (or /cost, /usage)
- **Expected:** Analytics charts and data load
- **Actual:** 1x 500 error per page, no data displayed
- **Root cause:** RLS blocks analytics queries
- **Fix:** Fix BUG-001 (RLS)
- **Files:** `app/api/analytics/*/route.ts`
- **Impact:** Analytics features non-functional

### BUG-010: Settings Pages Broken (Billing, Usage, MCP)
- **Severity:** P2 MEDIUM
- **Reproduction:** Login → /settings/billing (or /usage, /mcp)
- **Expected:** Settings forms load with data
- **Actual:** Empty pages or partial renders with 500 errors
- **Root cause:** RLS blocks settings queries
- **Fix:** Fix BUG-001 (RLS)
- **Files:** Various settings API routes
- **Impact:** Configuration features inaccessible

### BUG-011: React Hydration Error #418
- **Severity:** P2 MEDIUM
- **Reproduction:** Login → /dashboard (check console)
- **Expected:** No hydration errors
- **Actual:** React hydration error #418 in console
- **Root cause:** Server/client rendering mismatch (likely date/time or random values)
- **Fix:** Ensure deterministic rendering, use `useEffect` for client-only values
- **Files:** Dashboard components
- **Impact:** Potential UI flicker, console noise

### BUG-012: No Client-Side Form Validation
- **Severity:** P2 MEDIUM
- **Reproduction:** /login → Click "Masuk" without filling fields
- **Expected:** Visible validation error messages
- **Actual:** Browser native validation tooltip (if HTML5 validation enabled)
- **Root cause:** No JavaScript validation before submit
- **Fix:** Add zod validation + error messages
- **Files:** `components/auth/login-form.tsx`, `register-form.tsx`
- **Impact:** Poor UX, no user-friendly error messages

---

## P3 — LOW (Cosmetic Issues)

### BUG-013: Mixed Language UI
- **Severity:** P3 LOW
- **Reproduction:** Navigate through app
- **Expected:** Consistent language (Indonesian or English)
- **Actual:** Mixed — English headers ("Documents", "Similarity Search") + Indonesian text ("Belum ada dokumen")
- **Root cause:** Inconsistent i18n implementation
- **Fix:** Standardize on one language, add proper i18n
- **Files:** Multiple components
- **Impact:** Professional appearance diminished

### BUG-014: Duplicate Documents Navigation
- **Severity:** P3 LOW
- **Reproduction:** Compare /documents and /knowledge/documents
- **Expected:** Clear distinction between pages
- **Actual:** Overlapping functionality with different routes
- **Root cause:** Feature evolution created duplicate paths
- **Fix:** Consolidate or clearly differentiate
- **Files:** `app/documents/page.tsx`, `app/knowledge/documents/page.tsx`
- **Impact:** User confusion about which to use

### BUG-015: Mobile Menu Button Positioning
- **Severity:** P3 LOW
- **Reproduction:** Login → Resize to 375px → Try to open menu
- **Expected:** Hamburger menu accessible at all times
- **Actual:** Menu button reported "outside of viewport" in some cases
- **Root cause:** Sticky header positioning issue
- **Fix:** Verify z-index and positioning on mobile breakpoints
- **Files:** `components/layout/top-nav.tsx`, `mobile-nav.tsx`
- **Impact:** Mobile navigation may be difficult

---

## BUG SUMMARY

| Severity | Count | Percentage |
|----------|-------|------------|
| P0 Critical | 3 | 20% |
| P1 High | 3 | 20% |
| P2 Medium | 6 | 40% |
| P3 Low | 3 | 20% |
| **Total** | **15** | **100%** |

### Root Cause Analysis

**8 of 15 bugs (53%) share the same root cause:** PostgreSQL FORCE ROW LEVEL SECURITY on 25 tables. Fixing this single database configuration issue would resolve:
- BUG-001 (RLS blocks writes)
- BUG-002 (Upload causes logout)
- BUG-003 (Chat 500)
- BUG-004 (Dashboard 500s)
- BUG-009 (Analytics 500s)
- BUG-010 (Settings broken)
- BUG-005 (Audit 401 — possibly related)
- BUG-011 (Hydration error — possibly related to error state rendering)

### Fix Priority

1. **Immediate:** Fix BUG-001 (RLS) — resolves 53% of all bugs
2. **Immediate:** Fix BUG-005 (Audit 401)
3. **Short-term:** Fix BUG-006 (CSRF logout)
4. **Short-term:** Fix BUG-007 (CSP unsafe-eval)
5. **Medium-term:** Fix BUG-008 (localStorage API key)
6. **Low priority:** Fix BUG-012 through BUG-015
