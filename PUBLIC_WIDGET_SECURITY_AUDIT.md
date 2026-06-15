# Public Widget Platform — Security Audit Report

**Date:** 2026-06-07
**Status:** ⚠️ 1 Critical, 3 High, 4 Medium, 3 Low
**Scope:** Entitlement enforcement, key security, origin validation, cross-tenant isolation, rate limiting
**Files Audited:** 10 (lib/widget.ts, 4 API routes, widget.js, UI components, schema)

---

## Executive Summary

The Public Widget Platform has **solid fundamentals** (256-bit key entropy, workspace-scoped queries, origin validation framework) but contains **1 critical entitlement bypass**, **3 high-severity issues** including secret key leakage and rate limit bypass, and **4 medium issues**. The most severe is that widget CRUD routes check the wrong entitlement feature.

**Severity Distribution:**
- 🔴 Critical: 1 (C1)
- 🟠 High: 3 (H1, H2, H3)
- 🟡 Medium: 4 (M1, M2, M3, M4)
- 🟢 Low: 3 (L1, L2, L3)

---

## 🔴 Critical Findings

### C1 — Wrong Entitlement Check on Widget CRUD
**File:** `app/api/v1/widget/create/route.ts:12`
**Category:** Entitlement Enforcement
**Impact:** Widget creation checks `api_access` instead of `public_widget`

```typescript
const auth = await requireApiAuth(request);
// requireApiAuth → checkApiAccess → hasFeature(workspaceId, "api_access")
```

**Problem:** `requireApiAuth` checks `api_access` feature, not `public_widget`. While both features are currently mapped to the same plans (Pro+), this is semantically wrong:
- A future plan could have `api_access` without `public_widget`
- The entitlement check doesn't match the actual feature being used
- Widget CRUD should enforce `public_widget`, not `api_access`

**Current impact:** Low (both features are Pro+), but becomes Critical if plan features diverge.

**Fix:** Create a `requireFeature("public_widget")` check for widget routes instead of using `requireApiAuth`.

---

## 🟠 High Findings

### H1 — Secret Key Exposed in Widget List Endpoint
**File:** `lib/widget.ts:131-138`
**Category:** Secret Key Exposure
**Impact:** All widget secret keys leaked via GET /api/v1/widget/list

```typescript
export async function listWidgets(workspaceId: string) {
  return prisma.widget.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { conversations: true } },
    },
    // ⚠️ No select clause — returns ALL fields including secretKey
  });
}
```

**Consequence:** Every call to `GET /api/v1/widget/list` returns `secretKey` for all widgets. The list endpoint is called by the settings page on load. If the API key is compromised, all widget secret keys are exposed.

**Fix:** Add `select` clause to exclude `secretKey` from list results.

---

### H2 — Default `allowedDomains: []` Allows All Origins
**File:** `lib/widget.ts:100`
**Category:** Origin Validation Bypass
**Impact:** New widgets accept requests from any website by default

```typescript
if (allowedDomains.length === 0) return true; // ← Empty = allow ALL
```

**Consequence:** A newly created widget immediately accepts chat requests from any domain. An attacker can embed any widget on their malicious site and interact with it. While this is "convenient" for setup, it means every widget is vulnerable until the owner explicitly configures domain restrictions.

**Fix:** Either (a) require at least one domain on creation, or (b) default to the workspace's primary domain.

---

### H3 — Rate Limit Bypass via IP Header Spoofing
**File:** `app/api/widget/chat/route.ts:32`
**Category:** Rate Limiting
**Impact:** Widget rate limits can be bypassed by spoofing X-Forwarded-For

```typescript
const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
```

**Consequence:** An attacker can send unlimited requests by rotating `X-Forwarded-For` headers:
```
X-Forwarded-For: 1.1.1.1
X-Forwarded-For: 2.2.2.2
X-Forwarded-For: 3.3.3.3
```
Each "IP" gets its own 20 req/min limit. Combined with empty `allowedDomains`, this enables mass abuse.

**Fix:** Use the actual socket IP (from reverse proxy) instead of client-controlled headers, or add a secondary rate limit per public key.

---

## 🟡 Medium Findings

### M1 — `workspaceId` Leaked in Public Config Response
**File:** `app/api/widget/config/route.ts:21-35`
**Category:** Information Disclosure
**Impact:** Internal workspace UUID exposed to any client

```typescript
return Response.json({
  id: widget.id,
  name: widget.name,
  slug: widget.slug,
  publicKey: widget.publicKey,
  theme: { ... },
  // ⚠️ workspaceId is in the widget object from getWidgetByPublicKey
});
```

Wait — actually looking at `getWidgetByPublicKey`, it does select `workspaceId`:
```typescript
select: {
  id: true,
  ...
  workspaceId: true,
}
```

But the config route doesn't explicitly include it in the response. Let me re-check...

Actually, the config route spreads the widget object fields manually:
```typescript
return Response.json({
  id: widget.id,
  name: widget.name,
  slug: widget.slug,
  publicKey: widget.publicKey,
  theme: { ... },
});
```

It does NOT include `workspaceId` in the response. However, `getWidgetByPublicKey` does select it. This is a minor issue — the workspaceId is fetched but not returned. No leak.

**Correction:** Not a finding — workspaceId is not leaked in the response.

---

### M2 — No Conversation Visitor Isolation
**File:** `app/api/widget/chat/route.ts:69-73`
**Category:** Conversation Ownership
**Impact:** Any visitor can send messages to any conversation

```typescript
if (conversationId) {
  conv = await prisma.widgetConversation.findUnique({ where: { id: conversationId } });
  if (!conv || conv.widgetId !== widget.id) {
    return Response.json({ error: ... }, { status: 400 });
  }
}
```

**Problem:** The check verifies `conv.widgetId === widget.id` but does NOT verify `conv.visitorId === request.visitorId`. If visitor A knows visitor B's `conversationId`, they can send messages to B's conversation.

**Consequence:** Conversation hijacking. An attacker can inject messages into another visitor's conversation by guessing/brute-forcing conversation IDs (UUIDs are hard to guess, but not impossible in high-traffic widgets).

**Fix:** Add visitor ID verification or use session tokens.

---

### M3 — No Message Content Length Limit
**File:** `app/api/widget/chat/route.ts:44`
**Category:** Resource Exhaustion
**Impact:** Attackers can send extremely long messages

```typescript
if (!publicKey || !message) {
  // Only checks presence, not length
}
```

**Consequence:**
- Database storage bloat (unlimited `content` field)
- High token costs when AI integration is added
- Potential DoS via memory exhaustion

**Fix:** Add `message.length > 10000` check and reject oversized messages.

---

### M4 — In-Memory Rate Limiting Not Shared
**File:** `app/api/widget/chat/route.ts:6`
**Category:** Rate Limiting
**Impact:** Rate limits lost on restart, not shared across instances

```typescript
const widgetRateLimit = new Map<string, { count: number; resetAt: number }>();
```

**Consequence:** Same issues as the Stripe webhook idempotency — lost on restart, not shared across instances. Under horizontal scaling, each instance has independent rate limits.

**Fix:** Use Redis or database-backed rate limiting for production.

---

## 🟢 Low Findings

### L1 — Widget Script `innerHTML` XSS Risk
**File:** `public/widget.js:69,82,153`
**Category:** Cross-Site Scripting
**Impact:** Widget name/theme values injected via innerHTML without sanitization

```javascript
header.innerHTML = "<span style='font-weight:600;'>" + config.name + "</span>...";
```

If a widget name contains `<script>` or event handlers, it could execute in the admin page context. However, since the config comes from the server (not user input), the risk is limited to admin users who set malicious names.

**Fix:** Use `textContent` instead of `innerHTML`, or sanitize inputs.

---

### L2 — Predictable Visitor IDs
**File:** `public/widget.js:15`
**Category:** Analytics Accuracy
**Impact:** Visitor IDs are client-generated and predictable

```javascript
visitorId: "v_" + Math.random().toString(36).substr(2, 9),
```

`Math.random()` is not cryptographically secure. Visitor IDs can be predicted or spoofed, affecting analytics accuracy.

**Fix:** Use `crypto.randomUUID()` or server-generated IDs.

---

### L3 — No Widget Creation Limit
**File:** `app/api/v1/widget/create/route.ts`
**Category:** Resource Exhaustion
**Impact:** No limit on widgets per workspace

An attacker with a valid API key could create thousands of widgets, filling the database and degrading performance.

**Fix:** Add a per-workspace widget limit (e.g., 10 for Pro, 100 for Enterprise).

---

## Verification Matrix

### Widget Creation Requires `public_widget`
| Scenario | Result | Risk |
|----------|--------|------|
| Free user + `api_access` check | ❌ Blocked (no `api_access`) | None |
| Pro user + `api_access` check | ✅ Allowed | Semantic mismatch (C1) |
| Pro user + `public_widget` check | ✅ Allowed | Correct |
| Free user + `public_widget` check | ❌ Blocked | Correct |

### Free Users Cannot Create Widgets
| Scenario | Result | Risk |
|----------|--------|------|
| Free plan, API key auth | ❌ No `api_access` → 403 | None |
| Free plan, direct DB insert | N/A (no UI path) | None |

### Public Keys Cannot Be Enumerated
| Scenario | Result | Risk |
|----------|--------|------|
| Brute-force `pw_pub_` prefix | ⚠️ No rate limit on config endpoint | LOW |
| 256-bit entropy | ✅ Infeasible to guess | None |
| Config endpoint rate limit | ❌ Missing | MEDIUM |

### Widget Config Leaks No Secrets
| Scenario | Result | Risk |
|----------|--------|------|
| `secretKey` in config response | ✅ Not included | None |
| `workspaceId` in config response | ✅ Not included | None |
| `secretKey` in list response | ❌ EXPOSED (H1) | HIGH |

### Cross-Tenant Access Impossible
| Scenario | Result | Risk |
|----------|--------|------|
| Wrong workspace ID in query | ✅ Filtered by workspaceId | None |
| Wrong widget ID in conversation | ✅ Checked `conv.widgetId === widget.id` | None |
| Cross-widget conversation | ✅ Checked | None |
| Wrong visitor in conversation | ❌ Not checked (M2) | MEDIUM |

### Origin Validation Cannot Be Bypassed
| Scenario | Result | Risk |
|----------|--------|------|
| Empty allowedDomains | Allows ALL origins (H2) | HIGH |
| Spoofed Origin header | Accepted (client-controlled) | MEDIUM |
| No Origin header + empty domains | Allowed | HIGH |
| No Origin header + restricted domains | Denied | None |
| Wildcard `*.example.com` | Correct matching | None |

---

## Recommended Priority

| Priority | Finding | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 P0 | C1 — Fix entitlement to `public_widget` | 1h | Wrong feature gate |
| 🟠 P1 | H1 — Exclude `secretKey` from list | 0.5h | Key leakage |
| 🟠 P1 | H2 — Require domains or default restrict | 1h | Open origin policy |
| 🟠 P1 | H3 — Fix IP resolution for rate limiting | 2h | Rate limit bypass |
| 🟡 P2 | M2 — Add visitor isolation to conversations | 2h | Conversation hijack |
| 🟡 P2 | M3 — Add message length limit | 0.5h | Resource exhaustion |
| 🟡 P2 | M4 — Redis-backed rate limiting | 4h | Multi-instance safety |
| 🟢 P3 | L1 — Sanitize innerHTML in widget.js | 1h | XSS prevention |
| 🟢 P3 | L2 — Use crypto.randomUUID for visitors | 0.5h | Analytics accuracy |
| 🟢 P3 | L3 — Add per-workspace widget limit | 1h | Resource exhaustion |

---

*Generated: 2026-06-07 | Method: Static code analysis + schema review*
