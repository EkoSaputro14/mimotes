# Widget Security Review — Sprint 8

> **Date**: 2026-06-13  
> **Reviewer**: Automated Security Review  
> **Scope**: Widget endpoints, CORS, rate limiting, origin validation

---

## Summary

| Area | Before | After | Status |
|---|---|---|---|
| CORS headers | Wildcard `*` | Origin-validated | ✅ FIXED |
| Origin validation | Active | Active | ✅ OK |
| Rate limiting | Dual-layer | Dual-layer | ✅ OK |
| Message length | 10K limit | 10K limit | ✅ OK |
| Visitor isolation | Active | Active | ✅ OK |
| XSS prevention | escapeHtml() | escapeHtml() | ✅ OK |

## CORS Hardening

### Before (VULNERABLE)

```typescript
// config/route.ts
headers: {
  "Access-Control-Allow-Origin": "*",  // ❌ WILDCARD
  "Access-Control-Allow-Methods": "GET, OPTIONS",
}

// chat/route.ts
headers: {
  "Access-Control-Allow-Origin": "*",  // ❌ WILDCARD
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}
```

**Risk**: Any website can make cross-origin requests to widget endpoints. An attacker page could:
1. Load widget config to get public key
2. Send messages as the victim's browser
3. Read conversation responses

### After (HARDEDNED)

```typescript
// lib/widget.ts
export function buildWidgetCorsHeaders(origin, allowedDomains) {
  if (origin && validateWidgetOrigin(origin, allowedDomains)) {
    headers["Access-Control-Allow-Origin"] = origin;  // ✅ SPECIFIC
    headers["Vary"] = "Origin";  // ✅ CACHE KEY
  }
  return headers;
}
```

**Result**: Only pre-configured domains receive CORS headers. Unknown origins get no `Access-Control-Allow-Origin` header, blocking cross-origin reads.

## Attack Surface Analysis

### Endpoint: POST /api/widget/chat

| Vector | Protection | Status |
|---|---|---|
| Unauthorized access | Public key validation | ✅ |
| Brute force | Dual rate limit (key 60/min + IP 30/min) | ✅ |
| Cross-origin theft | Origin validation + specific CORS | ✅ |
| Message injection | Length validation (10K) | ✅ |
| Conversation hijack | Visitor ID isolation | ✅ |
| IP spoofing | X-Forwarded-For last-IP resolution | ✅ |

### Endpoint: GET /api/widget/config

| Vector | Protection | Status |
|---|---|---|
| Data exposure | Only returns theme + public key | ✅ |
| Cross-origin theft | Origin-validated CORS | ✅ |
| Enumeration | Requires valid public key | ✅ |

### Endpoint: GET /api/widget/analytics

| Vector | Protection | Status |
|---|---|---|
| Unauthorized access | requireApiAuth() | ✅ |
| Workspace isolation | workspaceId filter | ✅ |
| SQL injection | Parameterized queries | ✅ |

## Remaining Considerations

1. **Open widgets**: Widgets with empty `allowedDomains` accept any origin. Document this as a security choice.
2. **Rate limit memory**: In-memory Map-based rate limits reset on server restart. Consider Redis for production.
3. **Public key exposure**: Config endpoint returns public key. Consider removing from response (client already has it).
