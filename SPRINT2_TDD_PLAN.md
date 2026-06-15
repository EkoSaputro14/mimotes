# Sprint 2 — TDD Test Plan: Upload Security & SSRF Hardening

**Date:** 2026-06-13  
**Sprint:** Sprint 2 — Upload Security & SSRF Hardening  
**Approach:** Test-Driven Development (RED → GREEN → REFACTOR)

## Test Strategy

Tests follow the TDD cycle: write failing tests first (RED), implement minimal code to pass (GREEN), then improve structure (REFACTOR).

## Test Cases

### Phase 1: `lib/url-security.ts` — URL Validation

#### RED Tests (Write First)

```
TEST 1: validateUrl allows public HTTPS URL
  GIVEN url "https://example.com/article"
  WHEN validateUrl() is called
  THEN result.valid is true

TEST 2: validateUrl allows public HTTP URL
  GIVEN url "http://example.com/page"
  WHEN validateUrl() is called
  THEN result.valid is true

TEST 3: validateUrl blocks file:// protocol
  GIVEN url "file:///etc/passwd"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "not allowed"

TEST 4: validateUrl blocks gopher:// protocol
  GIVEN url "gopher://example.com"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "not allowed"

TEST 5: validateUrl blocks ftp:// protocol
  GIVEN url "ftp://files.example.com/doc"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "not allowed"

TEST 6: validateUrl blocks localhost (127.0.0.1)
  GIVEN url "http://127.0.0.1:8080/admin"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "private"

TEST 7: validateUrl blocks localhost (127.0.0.1 as hostname)
  GIVEN url "http://localhost:3000/api"
  WHEN validateUrl() is called
  THEN result.valid is false (localhost resolves to 127.0.0.1)

TEST 8: validateUrl blocks 10.x.x.x (RFC 1918)
  GIVEN url "http://10.0.0.1/internal"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "private"

TEST 9: validateUrl blocks 192.168.x.x (RFC 1918)
  GIVEN url "http://192.168.1.1/router"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "private"

TEST 10: validateUrl blocks 172.16-31.x.x (RFC 1918)
  GIVEN url "http://172.16.0.1/service"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "private"

TEST 11: validateUrl blocks cloud metadata (169.254.169.254)
  GIVEN url "http://169.254.169.254/latest/meta-data/"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "metadata"

TEST 12: validateUrl blocks cloud metadata hostname
  GIVEN url "http://metadata.google.internal/computeMetadata/v1/"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "metadata"

TEST 13: validateUrl blocks invalid URL format
  GIVEN url "not-a-url"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "Invalid URL"

TEST 14: validateUrl blocks empty string
  GIVEN url ""
  WHEN validateUrl() is called
  THEN result.valid is false

TEST 15: validateUrl blocks 0.0.0.0
  GIVEN url "http://0.0.0.0/"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "private"

TEST 16: validateUrl blocks 100.64.x.x (CGNAT)
  GIVEN url "http://100.64.0.1/"
  WHEN validateUrl() is called
  THEN result.valid is false AND error contains "private"
```

### Phase 2: `lib/url-security.ts` — safeFetch

```
TEST 17: safeFetch respects timeout
  GIVEN a URL that responds after 30 seconds
  WHEN safeFetch() is called with timeoutMs=1000
  THEN result.ok is false AND error contains "timed out"

TEST 18: safeFetch respects max response size
  GIVEN a URL that returns 10MB of data
  WHEN safeFetch() is called with maxBytes=1024
  THEN result.ok is false AND error contains "exceeds"

TEST 19: safeFetch blocks redirect to internal IP
  GIVEN a URL that redirects to http://127.0.0.1/
  WHEN safeFetch() is called
  THEN result.ok is false AND error contains "Redirect blocked"

TEST 20: safeFetch follows valid redirects
  GIVEN a URL that redirects to https://example.com/final
  WHEN safeFetch() is called
  THEN result.ok is true
```

### Phase 3: `lib/url-security.ts` — sanitizeFilename

```
TEST 21: sanitizeFilename removes path separators
  GIVEN filename "../../../etc/passwd"
  WHEN sanitizeFilename() is called
  THEN result is "etc.passwd" (no path traversal)

TEST 22: sanitizeFilename removes null bytes
  GIVEN filename "file\x00.txt"
  WHEN sanitizeFilename() is called
  THEN result is "file.txt"

TEST 23: sanitizeFilename removes special characters
  GIVEN filename 'file<>:"|?*.txt'
  WHEN sanitizeFilename() is called
  THEN result is "file.txt"

TEST 24: sanitizeFilename collapses double dots
  GIVEN filename "file..name..txt"
  WHEN sanitizeFilename() is called
  THEN result is "file.name.txt"

TEST 25: sanitizeFilename handles normal filename
  GIVEN filename "document.pdf"
  WHEN sanitizeFilename() is called
  THEN result is "document.pdf"

TEST 26: sanitizeFilename limits length
  GIVEN filename of 300 characters
  WHEN sanitizeFilename() is called
  THEN result length is <= 255

TEST 27: sanitizeFilename returns empty for all-dangerous input
  GIVEN filename "/..<>:|?*"
  WHEN sanitizeFilename() is called
  THEN result is "" (empty)
```

### Phase 4: Integration — parseURL with SSRF protection

```
TEST 28: parseURL blocks internal URL
  GIVEN url "http://127.0.0.1:3000/api/secret"
  WHEN parseURL() is called
  THEN it throws Error containing "URL validation failed"

TEST 29: parseURL blocks metadata URL
  GIVEN url "http://169.254.169.254/latest/meta-data/"
  WHEN parseURL() is called
  THEN it throws Error containing "URL validation failed"

TEST 30: parseURL blocks file:// protocol
  GIVEN url "file:///etc/passwd"
  WHEN parseURL() is called
  THEN it throws Error containing "URL validation failed"
```

### Phase 5: Integration — Upload API endpoint

```
TEST 31: Upload API blocks non-HTTP URL
  GIVEN FormData with url="file:///etc/passwd"
  WHEN POST /api/upload is called
  THEN response status is 400 AND error contains "HTTP"

TEST 32: Upload API blocks invalid URL format
  GIVEN FormData with url="not-a-url"
  WHEN POST /api/upload is called
  THEN response status is 400 AND error contains "invalid"

TEST 33: Upload API sanitizes filename with path traversal
  GIVEN File with name "../../../etc/passwd.pdf"
  WHEN POST /api/upload is called
  THEN saved filename does NOT contain ".." or "/"
```

## Test Environment

- **Framework:** Node.js built-in test runner or manual verification
- **DNS:** Tests for localhost/127.0.0.1 may use direct IP (no DNS resolution needed)
- **Isolation:** URL validation tests are pure functions (no DB required)

## Coverage Targets

| Module | Target | Focus |
|--------|--------|-------|
| `lib/url-security.ts` (validateUrl) | 100% | All IP ranges, all protocols, edge cases |
| `lib/url-security.ts` (safeFetch) | 90% | Timeout, size limit, redirect blocking |
| `lib/url-security.ts` (sanitizeFilename) | 100% | Path traversal, null bytes, special chars |
| `lib/rag/parser.ts` (parseURL) | 80% | SSRF protection integration |
| Upload API | 80% | URL validation, filename sanitization |

## Manual Verification

After implementation, verify manually:
1. `npm run build` passes without TypeScript errors
2. Upload a file — works normally
3. Upload a URL to a public page — works normally
4. Upload a URL to `http://127.0.0.1` — blocked with error
5. Upload a URL to `http://169.254.169.254` — blocked with error
6. Upload a file named `../../../etc/passwd.txt` — filename sanitized
