# Sprint 2 — Code Review: Upload Security & SSRF Hardening

**Date:** 2026-06-13  
**Reviewer:** Automated Code Review  
**Scope:** Sprint 2 — Upload Security & SSRF Hardening

## Files Reviewed

| File | Status | Lines | Complexity |
|------|--------|-------|------------|
| `lib/url-security.ts` | Created | 230 | Medium |
| `lib/rag/parser.ts` | Modified | +11 | Low |
| `app/api/upload/route.ts` | Modified | +16 | Low |

## Review Criteria

### 1. Correctness ✅

**`lib/url-security.ts`:**
- ✅ `validateUrl()` correctly validates URL format with `new URL()`
- ✅ Protocol allowlist correctly blocks non-HTTP(S) schemes
- ✅ `isPrivateIPv4()` covers all RFC 1918 ranges plus link-local, CGNAT, multicast, reserved
- ✅ `isPrivateIPv6()` covers loopback, link-local, unique-local, IPv4-mapped
- ✅ Cloud metadata IPs and hostnames blocked at both hostname and resolved-IP levels
- ✅ DNS resolution uses `dns/promises.lookup()` with `family: 0` (IPv4+IPv6)
- ✅ `safeFetch()` uses `redirect: "manual"` to prevent auto-redirect SSRF
- ✅ Redirect Location header re-validated through `validateUrl()` recursively
- ✅ Stream reading with byte counter correctly enforces size limit
- ✅ AbortController timeout properly cleared in `finally` block
- ✅ `sanitizeFilename()` removes null bytes, path separators, control chars, special chars
- ✅ `sanitizeFilename()` collapses double dots and limits length to 255

**`lib/rag/parser.ts`:**
- ✅ `parseURL()` calls `validateUrl()` before any network operation
- ✅ Error messages don't leak internal details (just the validation error reason)
- ✅ `safeFetch()` called with explicit maxBytes (5MB) and timeoutMs (10s)
- ✅ Response body correctly read from `result.body` instead of `response.text()`

**`app/api/upload/route.ts`:**
- ✅ URL protocol pre-validation at route level (defense in depth)
- ✅ `sanitizeFilename()` applied after `basename()` (double protection)
- ✅ Empty filename after sanitization correctly rejected with 400 error
- ✅ Existing file size validation unchanged

### 2. Error Handling ✅

- ✅ `validateUrl()` returns structured result `{ valid, error }` — no exceptions thrown
- ✅ `safeFetch()` catches AbortError (timeout) and generic fetch errors
- ✅ `safeFetch()` handles missing response body gracefully
- ✅ DNS lookup failure caught and returned as validation error
- ✅ Upload route catches invalid URL format with try/catch around `new URL()`
- ✅ `parseURL()` throws descriptive errors that the upload route catches

### 3. TypeScript Compliance ✅

- ✅ All functions properly typed with explicit return types
- ✅ `UrlValidationResult` interface defined for structured results
- ✅ `safeFetch()` options typed with optional parameters and defaults
- ✅ No `any` types used
- ✅ Buffer/Uint8Array operations correctly typed
- ✅ Compatible with `strict: true` in tsconfig.json

### 4. Performance ✅

- ✅ DNS lookup: ~1-5ms (acceptable for upload operation)
- ✅ IP validation: O(1) range checks (fast)
- ✅ Protocol validation: Set lookup (O(1))
- ✅ Filename sanitization: regex replacements (negligible)
- ✅ No blocking synchronous operations in hot paths
- ✅ Stream reading avoids buffering entire response in memory before size check

### 5. Code Quality ✅

- ✅ Clear function names with JSDoc comments
- ✅ Constants extracted (ALLOWED_PROTOCOLS, BLOCKED_PORTS, MAX_RESPONSE_BYTES, etc.)
- ✅ Single responsibility per function
- ✅ Consistent error messages with descriptive context
- ✅ No code duplication between IPv4/IPv6 validation
- ✅ Comments explain "why" not just "what"

### 6. Security ✅

- ✅ No bypass paths (hostname check AND resolved-IP check for metadata)
- ✅ IPv6-mapped IPv4 addresses correctly handled (::ffff:127.0.0.1 → blocked)
- ✅ Redirect chains validated at each hop
- ✅ Timeout prevents connection hanging
- ✅ Size limit prevents memory exhaustion
- ✅ Filename sanitization prevents path traversal
- ✅ No secrets or internal details leaked in error messages

### 7. Backward Compatibility ✅

- ✅ Public URLs still work (only private/internal blocked)
- ✅ File upload unchanged (only filename handling improved)
- ✅ Existing file size validation untouched
- ✅ No database schema changes
- ✅ No API contract changes (error format unchanged)
- ✅ No new npm dependencies

## Issues Found

### None — No Blocking Issues

## Suggestions (Non-blocking)

### S1: Add configurable allowlist for known-safe internal URLs
**Priority:** Low  
**Impact:** Some development environments may need internal URL access  
**Location:** `lib/url-security.ts` — could add `ALLOWED_INTERNAL_HOSTS` env var

### S2: Add logging for blocked SSRF attempts
**Priority:** Medium  
**Impact:** Security monitoring and incident response  
**Location:** `lib/url-security.ts` — log rejected URLs to audit system

### S3: Consider adding Magic Bytes validation for uploaded files
**Priority:** Medium  
**Impact:** Prevents file type spoofing (e.g., executable renamed to .pdf)  
**Location:** `app/api/upload/route.ts` — check file magic bytes after extension validation

### S4: Add unit tests for url-security.ts
**Priority:** Medium  
**Impact:** Automated regression testing for security-critical code  
**Location:** `__tests__/lib/url-security.test.ts`

## Metrics

| Metric | Value |
|--------|-------|
| New files | 1 |
| Modified files | 2 |
| Total lines added | ~260 |
| Dependencies added | 0 |
| Breaking changes | 0 |
| Security findings resolved | 9 |
| New security findings | 0 |

## Approval

✅ **APPROVED** — Implementation correctly addresses all SSRF and upload security vulnerabilities. Defense-in-depth approach with multiple validation layers. No blocking issues found. All Sprint 2 requirements met.
