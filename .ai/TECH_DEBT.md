# Technical Debt Registry — Mimotes

> Terakhir diperbarui: 2026-06-24
> Status: Production-capable with known debt items

---

## Critical

### SEC-001: API Key Encryption at Rest
- **Status**: Partial — `lib/crypto.ts` (AES-256-GCM) exists, some keys encrypted
- **Risk**: API keys in `settings` and `workspace_settings` tables may still be plaintext
- **Action**: Audit all key storage, encrypt remaining plaintext keys

### SEC-002: Embedding API Fallback
- **Status**: Active — Some providers return 404 on `/v1/embeddings`
- **Risk**: Falls back to local feature hashing (lower quality)
- **Action**: Configure embedding-capable provider (OpenAI, Ollama)

---

## High

### DEBT-002: Local Embedding Quality
- **Status**: Active — Feature hashing used as fallback
- **Risk**: Retrieval quality significantly degraded
- **Action**: Set up embedding provider (OpenAI text-embedding-3-small)

### DEBT-010: Widget Conversation History
- **Status**: Active — Widget chat route uses `conversationHistory: ""`
- **Risk**: Widget users can't follow up on previous messages
- **Action**: Add history loading to `/api/widget/chat/stream`

### DEBT-011: Playground Workspace Context
- **Status**: Active — `/api/ai/playground` doesn't set workspace context
- **Risk**: Playground always uses global AI settings
- **Action**: Add `setWorkspaceContext()` to playground route

---

## Medium

### DEBT-003: In-Memory Rate Limiting
- **Status**: Active — No Redis in production
- **Risk**: Rate limits lost on container restart
- **Action**: Add Redis or accept restart resets

### DEBT-006: File Upload Size Limit
- **Status**: Active — MAX_FILE_SIZE env var exists but may not be enforced everywhere
- **Risk**: DoS via large uploads
- **Action**: Verify enforcement on all upload routes

### DEBT-012: Widget Creation Limit
- **Status**: Active — No limit per workspace
- **Risk**: Workspaces can create unlimited widgets
- **Action**: Add entitlement check or limit

### DEBT-013: Audit Coverage
- **Status**: Active — 41% route coverage (Phase 1+2 complete)
- **Risk**: P2 routes not instrumented
- **Action**: Phase 3+ for remaining routes

### DEBT-014: Summarization Quality
- **Status**: Active — Substring-based (`substring(0, 500)`)
- **Risk**: Poor summary quality for long conversations
- **Action**: Use AI-generated summary when model supports it

### PH5-001: Zero Test Coverage
- **Status**: Active — Vitest initialized but minimal tests
- **Risk**: Regressions not caught
- **Action**: Add unit tests for RAG pipeline, API routes

---

## Low

### PH5-002: Duplicate Streaming Logic
- **Status**: Active — Some routes duplicate streaming helpers
- **Risk**: Maintenance overhead
- **Action**: Consolidate to `lib/streaming.ts`

### PH5-005: Approximate Token Counting
- **Status**: Active — Character-based estimation (÷4)
- **Risk**: Inaccurate token counts for billing
- **Action**: Use tiktoken for accurate counting

### PH5-006: prompt() Browser Dialog
- **Status**: Active — Some UI uses `window.prompt()`
- **Risk**: Poor UX, breaks in some browsers
- **Action**: Replace with custom dialog component

### DEBT-015: Debug Logging
- **Status**: Active — `[AI Provider]` and `[Chat]` debug logs in production
- **Risk**: Log noise
- **Action**: Remove or gate behind DEBUG env var

---

## Resolved

| ID | Description | Resolved |
|----|-------------|----------|
| SEC-003 | SQL injection in analytics eventTypes | 2026-06-05 (CTE refactor) |
| DEBT-001 | pdf-parse v1 pinning | N/A (acceptable) |
| DEBT-004 | Settings page saved to wrong table | 2026-06-24 (endpoint fixed) |
| DEBT-005 | AI engine not workspace-aware | 2026-06-24 (AsyncLocalStorage) |
| DEBT-007 | RLS connection pool issue | 2026-06-24 (transaction + set_config) |
| DEBT-008 | Streaming null safety | 2026-06-24 (optional chaining) |
| DEBT-009 | Document titles "Dokumen tidak diketahui" | 2026-06-24 (documentTitle added) |
| PH5-003 | No pagination on prompt list | Resolved |
| PH5-004 | Client-side playground history | Resolved |

---

*Update this file when debt is added, resolved, or status changes.*
