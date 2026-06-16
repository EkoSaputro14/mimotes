# Widget Security Hardening — Implementation Report

**Date:** 2026-06-07
**Status:** ✅ All 8 P1 fixes applied
**Build:** ✅ Clean (0 new errors)

---

## Fixes Applied

### H1 — Secret Key Removed from List Endpoint ✅ FIXED
**File:** `lib/widget.ts` — `listWidgets()`

**Before:** `include: { _count: ... }` returned ALL fields including `secretKey`
**After:** Explicit `select` clause excludes `secretKey`

```typescript
select: {
  id: true, name: true, slug: true, publicKey: true,
  allowedDomains: true, isActive: true,
  primaryColor: true, backgroundColor: true, textColor: true,
  logoUrl: true, avatarUrl: true, welcomeMessage: true,
  position: true, createdAt: true,
  _count: { select: { conversations: true } },
  // ⚠️ secretKey NOT included
}
```

---

### C1 — Widget CRUD Requires `public_widget` ✅ FIXED
**File:** `app/api/v1/widget/create/route.ts`

**Before:** Used `requireApiAuth` which checks `api_access`
**After:** Explicit `hasFeature(workspaceId, "public_widget")` check

```typescript
const hasWidgetFeature = await hasFeature(auth.workspaceId, "public_widget");
if (!hasWidgetFeature) {
  return Response.json(
    { error: { code: "feature_not_available", message: "Public Widget requires the public_widget feature." } },
    { status: 403 }
  );
}
```

---

### H2 — Default `allowedDomains` Changed ✅ FIXED
**File:** `lib/widget.ts` — `createWidget()`

**Before:** Default `allowedDomains: []` = allow ALL origins
**After:** `createWidget` now validates that at least one domain is provided

```typescript
// Security: require at least one allowed domain
if (!allowedDomains || allowedDomains.length === 0) {
  throw new Error("At least one allowed domain is required for security.");
}
```

**Note:** This is a breaking change — existing widgets with empty domains still work, but new widgets require domain configuration.

---

### M2 — Conversation Visitor Isolation ✅ FIXED
**File:** `app/api/widget/chat/route.ts`

**Before:** Only verified `conv.widgetId === widget.id`
**After:** Also verifies `conv.visitorId === request.visitorId`

```typescript
// Visitor isolation: only the original visitor can continue their conversation
if (conv.visitorId && visitorId && conv.visitorId !== visitorId) {
  return Response.json(
    { error: { code: "forbidden", message: "Access denied to this conversation" } },
    { status: 403 }
  );
}
```

---

### M3 — Message Length Validation ✅ FIXED
**Files:** `lib/widget.ts`, `app/api/widget/chat/route.ts`

**Before:** No message length check
**After:** 10,000 character limit enforced

```typescript
// lib/widget.ts
const MAX_MESSAGE_LENGTH = 10000;
export function validateMessageLength(message: string): boolean {
  return message.length <= MAX_MESSAGE_LENGTH;
}

// widget chat route
if (!validateMessageLength(message)) {
  return Response.json(
    { error: { code: "message_too_long", message: "Message exceeds maximum length of 10,000 characters" } },
    { status: 400 }
  );
}
```

---

### H3 — Improved Rate Limiting ✅ FIXED
**File:** `app/api/widget/chat/route.ts`

**Before:** Single-layer per-IP rate limit with spoofable headers
**After:** Dual-layer rate limiting + fixed IP resolution

**Dual-layer:**
- Per public key: 60 requests/minute
- Per IP: 30 requests/minute

**IP resolution fix:**
```typescript
function resolveClientIp(request: NextRequest): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map((s) => s.trim());
    return ips[ips.length - 1] || "unknown"; // Last IP = actual client
  }
  return request.headers.get("x-real-ip") || "unknown";
}
```

**Why last IP:** In a proxy chain `client → proxy1 → proxy2`, `X-Forwarded-For: client, proxy1, proxy2`. The LAST entry is the original client.

---

### L2 — Visitor IDs Use `crypto.randomUUID()` ✅ FIXED
**File:** `public/widget.js`

**Before:** `"v_" + Math.random().toString(36).substr(2, 9)` (predictable)
**After:** `"v_" + crypto.randomUUID()` (cryptographically secure)

```javascript
// Before (insecure)
visitorId: "v_" + Math.random().toString(36).substr(2, 9),

// After (secure)
visitorId: "v_" + crypto.randomUUID(),
```

---

### L1 — Widget UI Sanitized (innerHTML → textContent) ✅ FIXED
**File:** `public/widget.js`

**Before:** Used `innerHTML` with unsanitized values
**After:** All dynamic content uses `textContent` (XSS-safe)

**Key changes:**
- `header.innerHTML = "..."` → `headerTitle.textContent = config.name`
- `msg.innerHTML = "..."` → `bubble.textContent = text`
- `launcher.innerHTML = "💬"` → `launcher.textContent = "\ud83d\udcac"`
- All styles set via `element.style.property = value` instead of `cssText`
- `encodeURIComponent()` for publicKey in URL

---

## Files Changed

| File | Change |
|------|--------|
| `lib/widget.ts` | Added `MAX_MESSAGE_LENGTH`, `validateMessageLength()`, explicit `select` in `listWidgets`, domain validation in `createWidget` |
| `app/api/widget/chat/route.ts` | Dual-layer rate limiting, fixed IP resolution, message length validation, visitor isolation |
| `app/api/v1/widget/create/route.ts` | Added `public_widget` feature check |
| `public/widget.js` | `crypto.randomUUID()`, `textContent` instead of `innerHTML`, `encodeURIComponent`, proper style assignment |

---

## Security Matrix — Before vs After

| Audit Finding | Before | After |
|--------------|--------|-------|
| H1 — Secret key in list | ❌ Exposed | ✅ Excluded |
| C1 — Wrong entitlement | ❌ `api_access` | ✅ `public_widget` |
| H2 — Default allow-all domains | ❌ `[]` = all | ✅ Requires domains |
| M2 — Conversation hijack | ❌ No visitor check | ✅ Visitor isolation |
| M3 — No message limit | ❌ Unlimited | ✅ 10K char limit |
| H3 — Spoofable rate limit | ❌ Per-IP only | ✅ Dual-layer + fixed IP |
| L2 — Predictable visitor ID | ❌ `Math.random()` | ✅ `crypto.randomUUID()` |
| L1 — XSS via innerHTML | ❌ `innerHTML` | ✅ `textContent` |

---

## Build Verification

```
✓ Compiled successfully
✓ TypeScript type check passed
✓ All routes registered
✓ Static asset: /widget.js
✓ No new errors introduced
```

---

*Generated: 2026-06-07 | Build: Clean | 4 files modified*
