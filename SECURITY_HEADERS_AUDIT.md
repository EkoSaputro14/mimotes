# SECURITY_HEADERS_AUDIT.md

> **Date**: 2026-06-13
> **Status**: ✅ AUDITED
> **Scope**: HTTP security headers in `next.config.ts`

---

## Executive Summary

MimoNotes has **7 security headers** configured in `next.config.ts` via Next.js `headers()` API. All headers are applied globally to every route (`/(*)`). The audit found **no critical issues** — headers follow OWASP best practices.

## Headers Audit

### ✅ Content-Security-Policy (CSP) — NEW

| Directive | Value | Assessment |
|-----------|-------|------------|
| `default-src` | `'self'` | ✅ Restrictive default |
| `script-src` | `'self' 'unsafe-eval' 'unsafe-inline'` | ⚠️ Required for Next.js |
| `style-src` | `'self' 'unsafe-inline'` | ⚠️ Required for Tailwind CSS |
| `img-src` | `'self' data: blob: https:` | ✅ Images from HTTPS sources |
| `font-src` | `'self' data:` | ✅ Self-hosted fonts |
| `connect-src` | `'self' https://api.resend.com https://api.stripe.com` | ✅ Specific API endpoints |
| `frame-ancestors` | `'none'` | ✅ Prevents framing (X-Frame-Options equivalent) |
| `base-uri` | `'self'` | ✅ Prevents base tag injection |
| `form-action` | `'self'` | ✅ Prevents form hijacking |

**Notes:**
- `'unsafe-eval'` required for Next.js Turbopack development
- `'unsafe-inline'` required for Tailwind CSS and Next.js styles
- Widget routes use dynamic CORS via `buildWidgetCorsHeaders()` — no CSP conflict

### ✅ Strict-Transport-Security (HSTS) — NEW

| Parameter | Value | Assessment |
|-----------|-------|------------|
| `max-age` | `63072000` (2 years) | ✅ OWASP recommended |
| `includeSubDomains` | Yes | ✅ Covers subdomains |
| `preload` | Yes | ✅ Ready for HSTS preload list |

**Notes:**
- Only active in production (`NODE_ENV=production`)
- Prevents SSL stripping attacks
- Browser will refuse HTTP connections for 2 years

### ✅ X-Frame-Options

| Value | Assessment |
|-------|------------|
| `DENY` | ✅ Prevents all framing |

### ✅ X-Content-Type-Options

| Value | Assessment |
|-------|------------|
| `nosniff` | ✅ Prevents MIME type sniffing |

### ✅ X-XSS-Protection

| Value | Assessment |
|-------|------------|
| `1; mode=block` | ✅ Enables XSS filter in legacy browsers |

### ✅ Referrer-Policy

| Value | Assessment |
|-------|------------|
| `strict-origin-when-cross-origin` | ✅ Sends referrer only for same-origin |

### ✅ Permissions-Policy

| Directive | Value | Assessment |
|-----------|-------|------------|
| `camera` | `()` | ✅ Disabled |
| `microphone` | `()` | ✅ Disabled |
| `geolocation` | `()` | ✅ Disabled |

## Missing Headers (Recommended)

| Header | Recommendation | Priority |
|--------|---------------|----------|
| `X-Permitted-Cross-Domain-Policies` | Add `none` to prevent Flash/PDF cross-domain | Low |
| `Cross-Origin-Embedder-Policy` | Add `require-corp` if using SharedArrayBuffer | Low |
| `Cross-Origin-Opener-Policy` | Add `same-origin` for Spectre mitigations | Low |

**Note:** These are optional and may break functionality if added incorrectly. Not required for staging.

## Widget CORS Audit

| Route | Origin Validation | Assessment |
|-------|------------------|------------|
| `/api/widget/*` | Dynamic via `buildWidgetCorsHeaders()` | ✅ |
| Wildcard `*` | Removed in Sprint 8 | ✅ |

**Before Sprint 8:**
```typescript
// ❌ DANGEROUS — allowed any domain
{ key: "Access-Control-Allow-Origin", value: "*" }
```

**After Sprint 8:**
```typescript
// ✅ SAFE — validates against allowedDomains list
const origin = request.headers.get("origin");
if (allowedDomains.includes(origin)) {
  headers["Access-Control-Allow-Origin"] = origin;
}
```

## Health Endpoint Security

| Measure | Status |
|---------|--------|
| No authentication required | ✅ Intentional (load balancer health check) |
| Cache control: `no-cache` | ✅ Prevents stale health data |
| Limited information exposure | ✅ No secrets in response |
| Database latency only | ✅ No query results leaked |

## Rate Limiting Security

| Endpoint | Protection | Assessment |
|----------|-----------|------------|
| Auth (register) | 5 req/15min per IP | ✅ Prevents brute force |
| Invitation creation | 20 req/hr per workspace | ✅ Prevents spam invites |
| Invitation accept | 10 req/15min per IP | ✅ Prevents token brute force |
| Workspace switch | 30 req/hr per IP | ✅ Prevents session abuse |

**Headers returned:**
- `X-RateLimit-Limit` — Maximum requests per window
- `X-RateLimit-Remaining` — Requests remaining
- `X-RateLimit-Reset` — Unix timestamp when window resets
- `Retry-After` — Seconds until next request allowed (only when blocked)

## Recommendations

1. **Add `X-Permitted-Cross-Domain-Policies: none`** — Prevents Flash/PDF cross-domain data loading (Low priority)
2. **Consider `Cross-Origin-Opener-Policy: same-origin`** — Spectre mitigation (Low priority, may break popups)
3. **Add CSP reporting endpoint** — `report-uri` directive for CSP violation reports (Medium priority)
4. **Monitor CSP violations** — Use `Content-Security-Policy-Report-Only` in staging first
5. **HSTS preload submission** — Submit to hstspreload.org after production deployment

## Verification Commands

```bash
# Check security headers
curl -I http://localhost:3000/api/health

# Expected headers:
# Content-Security-Policy: default-src 'self'; ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
```
