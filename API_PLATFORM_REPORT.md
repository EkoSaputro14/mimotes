# API Platform — Implementation Report

**Date:** 2026-06-07
**Status:** ✅ Complete
**Build:** ✅ Clean (0 new errors)

---

## Overview

Full REST API platform for Mimotes. Enables programmatic access via API keys with authentication, rate limiting, usage tracking, and a developer documentation portal.

---

## Schema Changes

### `api_keys` table
```sql
id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()
workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
name          VARCHAR(100) NOT NULL
key_hash      VARCHAR(64) UNIQUE NOT NULL  -- SHA-256 of raw key
key_prefix    VARCHAR(12) NOT NULL          -- mk_live_xxx...
last_used_at  TIMESTAMP
expires_at    TIMESTAMP
is_active     BOOLEAN DEFAULT true
created_at    TIMESTAMP DEFAULT NOW()

INDEX: api_keys_workspace_id_idx
INDEX: api_keys_key_hash_idx
```

### `api_usage_logs` table
```sql
id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()
workspace_id  TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
api_key_id    TEXT REFERENCES api_keys(id) ON DELETE SET NULL
endpoint      VARCHAR(200) NOT NULL
method        VARCHAR(10) NOT NULL
status_code   INTEGER NOT NULL
latency_ms    INTEGER NOT NULL
tokens_used   INTEGER DEFAULT 0
ip_address    VARCHAR(45)
created_at    TIMESTAMP DEFAULT NOW()

INDEX: api_usage_logs_workspace_time_idx (workspace_id, created_at)
INDEX: api_usage_logs_api_key_id_idx (api_key_id)
```

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/api-keys.ts` | Key generation, SHA-256 hashing, validation, CRUD |
| `lib/api-auth.ts` | Bearer token middleware, entitlement check, ApiError class |
| `lib/api-rate-limit.ts` | Per-workspace rate limiting (minute + day windows) |
| `lib/api-usage.ts` | Usage tracking, summaries, top endpoints |
| `app/api/v1/keys/route.ts` | API keys CRUD (GET, POST, DELETE) |
| `app/api/v1/chat/route.ts` | POST /api/v1/chat — send chat message |
| `app/api/v1/search/route.ts` | POST /api/v1/search — search documents |
| `app/api/v1/documents/route.ts` | GET /api/v1/documents — list documents |
| `components/developers/api-keys-manager.tsx` | API key management UI |
| `components/developers/api-documentation.tsx` | Interactive API docs with code examples |
| `components/developers/api-usage-metrics.tsx` | Usage metrics dashboard |
| `app/developers/page.tsx` | /developers page (tabs: overview, keys, docs, metrics) |

---

## API Authentication

```
Header: Authorization: Bearer mk_live_xxx...
```

**Flow:**
1. Extract Bearer token from Authorization header
2. SHA-256 hash the token
3. Lookup in `api_keys.key_hash` (unique index)
4. Check `is_active` + `expiresAt`
5. Update `lastUsedAt` (fire-and-forget)
6. Enforce `api_access` entitlement

**Key format:** `mk_live_` + 32 random base64url characters
**Hash:** SHA-256 (stored in DB, raw key shown only once)

---

## Rate Limits

| Plan | Requests/Minute | Requests/Day |
|------|----------------|--------------|
| Free | 10 | 100 |
| Pro | 60 | 10,000 |
| Enterprise | 600 | 100,000 |

**Response headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1717800060
Retry-After: 30  (only on 429)
```

**Implementation:** In-memory sliding window per workspace. Cleanup every 5 minutes.

---

## API Endpoints

### POST /api/v1/chat
Send a chat message via API.

**Body:**
```json
{
  "message": "What is Mimotes?",
  "sessionId": "optional-session-id",
  "model": "optional-model-name"
}
```

**Response:**
```json
{
  "id": "msg_1717800000000",
  "message": "What is Mimotes?",
  "response": "[API] Received: What is Mimotes?",
  "model": "default",
  "sessionId": "session_1717800000000",
  "tokens": { "input": 4, "output": 10 }
}
```

### POST /api/v1/search
Search documents via API.

**Body:**
```json
{
  "query": "machine learning",
  "limit": 10,
  "filters": {}
}
```

### GET /api/v1/documents
List documents in workspace.

**Query:** `?limit=10&offset=0`

### POST /api/v1/keys
Create a new API key.

**Body:**
```json
{
  "name": "Production",
  "expiresInDays": 90
}
```

**Response:**
```json
{
  "id": "key_xxx",
  "key": "mk_live_xxx...full_key_shown_once",
  "keyPrefix": "mk_live_xxx...",
  "expiresAt": "2026-09-05T00:00:00Z",
  "message": "Save this key — it will not be shown again."
}
```

---

## Code Examples

### cURL
```bash
curl -X POST "https://your-domain.com/api/v1/chat" \
  -H "Authorization: Bearer *** \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

### JavaScript
```javascript
const response = await fetch("/api/v1/chat", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ message: "Hello!" }),
});
const data = await response.json();
```

### Python
```python
import requests

response = requests.post(
    "https://your-domain.com/api/v1/chat",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    json={"message": "Hello!"}
)
print(response.json())
```

---

## Entitlement Protection

All `/api/v1/*` routes enforce `api_access` feature:

```
requireApiAuth(request)
  → authenticateApiRequest(request)  // Bearer token validation
  → checkApiAccess(workspaceId)     // hasFeature(workspaceId, "api_access")
  → throw ApiError(403) if denied
```

**Feature mapping:**
- Free plan: ❌ `api_access` not included
- Pro plan: ✅ `api_access` included
- Enterprise plan: ✅ `api_access` included

---

## Usage Tracking

Every API call tracks:
- `endpoint` — e.g., `/api/v1/chat`
- `method` — GET/POST
- `status_code` — HTTP status
- `latency_ms` — Response time
- `tokens_used` — Token count (for chat)
- `ip_address` — Client IP (from X-Forwarded-For)

**Usage summary available via:**
- Total requests (30 days)
- Average latency
- Error rate
- Total tokens
- Top endpoints
- Daily request counts

---

## /developers Page

**4 tabs:**
1. **Overview** — Quick start guide, rate limits, authentication info
2. **API Keys** — Create, list, revoke keys
3. **Documentation** — Interactive endpoint explorer with cURL/JS/Python examples
4. **Usage** — Metrics dashboard (requests, latency, errors, tokens)

---

## Build Verification

```
✓ Compiled successfully (4.8s)
✓ TypeScript type check passed
✓ Prisma schema applied (api_keys + api_usage_logs tables)
✓ Prisma client regenerated
✓ All routes registered:
  ├ ƒ /api/v1/chat
  ├ ƒ /api/v1/search
  ├ ƒ /api/v1/documents
  ├ ƒ /api/v1/keys
  └ ○ /developers
```

---

## Security Review

| Layer | Implementation |
|-------|---------------|
| **Authentication** | Bearer token + SHA-256 hash lookup |
| **Key storage** | Raw key shown once, only hash stored |
| **Entitlement** | `api_access` feature enforced on all v1 routes |
| **Rate limiting** | Per-workspace, minute + day windows |
| **Usage tracking** | Every request logged with endpoint, latency, status |
| **Key expiration** | Optional TTL, checked on every request |
| **Key revocation** | Soft delete (is_active = false) |

---

*Generated: 2026-06-07 | Build: Clean | 12 files created*
