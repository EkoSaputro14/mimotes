# DATA_ISOLATION_AUDIT.md

**Date:** 2026-06-06
**Scope:** Full data flow — upload → storage → retrieval → chat
**Method:** Actual code path tracing, no assumptions

---

## Question 1: Is Mimotes a shared or per-user knowledge base?

### Answer: SHARED — with partial per-user UI filtering

The database schema has `userId` on `Document`, but the **chat RAG pipeline ignores it entirely**.

**Evidence — the two search paths:**

| Path | Filters by userId? | SQL |
|------|-------------------|-----|
| `/api/chat` → `streamRAGResponse` → `searchSimilarChunks(userId=undefined)` | ❌ NO | `SELECT ... FROM document_chunks WHERE embedding IS NOT NULL ORDER BY embedding <=> ...` |
| `/api/knowledge/search` → `searchSimilarChunks(userId=session.user.id)` | ✅ YES | `SELECT ... FROM document_chunks dc JOIN documents d ON d.id = dc.document_id WHERE d.user_id = $userId` |
| MCP tools → `generateRAGResponse(userId)` | ✅ YES | Same as knowledge search path |

**The chat endpoint (the primary user-facing feature) searches ALL documents.**

---

## Question 2: What does `/api/chat` search?

### Answer: ALL documents in the entire system

**Code path (traced line by line):**

```
app/api/chat/route.ts:83
  const result = await streamRAGResponse(message, 5);
                                    ↑
                          No userId argument

lib/rag/chain.ts:103
  const similarChunks = await searchSimilarChunks(queryEmbedding, topK, userId);
                                                                    ↑
                                                          userId = undefined

lib/rag/vectorstore.ts:37
  export async function searchSimilarChunks(
    queryEmbedding: number[],
    topK: number = 5,
    userId?: string     ← Optional, not provided
  )

lib/rag/vectorstore.ts:75-95 (when userId is undefined)
  SELECT
    id, content, document_id,
    1 - (embedding <=> $1::vector) as similarity,
    metadata
  FROM document_chunks          ← No JOIN, no WHERE user_id
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> $1::vector
  LIMIT $2
```

**There is no `userId` filter. The query searches every chunk from every user.**

---

## Question 3: Can User A upload a document and User B retrieve info from it through chat?

### Answer: YES — this is the current behavior

**Scenario traced:**

```
1. User A uploads "salary_report.pdf"
   → POST /api/upload → auth() → userId = "user-a-id"
   → Document created: { userId: "user-a-id", title: "salary_report.pdf" }
   → Chunks stored: document_chunks (linked to document)

2. User B opens chat page
   → POST /api/chat → message: "What are the salary details?"
   → streamRAGResponse("What are the salary details?", 5)
   → searchSimilarChunks(embedding, 5) ← NO userId
   → SQL: SELECT ... FROM document_chunks ORDER BY embedding <=> ...
   → Returns chunks from User A's "salary_report.pdf"
   → AI generates answer using User A's document content
   → User B sees User A's salary information
```

**This works because:**
- `/api/chat` calls `streamRAGResponse` without `userId`
- `searchSimilarChunks` without `userId` searches ALL chunks
- No ownership check in the RAG pipeline

---

## Question 4: Is this behavior intentional?

### Answer: PARTIALLY — it's a design gap, not a deliberate choice

**Evidence it's unintentional:**

1. The database schema HAS `userId` on `Document` — someone intended per-user ownership
2. The `/api/knowledge/search` endpoint DOES filter by `userId` — the developer knew how
3. The MCP tools NOW filter by `userId` (after our security sprint) — confirming isolation was desired
4. The `/api/chat/sessions` route filters by `userId` — sessions are per-user
5. The `/api/documents` route filters by `userId` — document listing is per-user

**The gap:** The chat RAG pipeline was built before the security hardening. It uses the "public chatbot" pattern where all documents are searchable. This was likely acceptable for a single-user prototype but is a critical flaw for multi-user SaaS.

**What IS intentionally shared:**
- The health check (`/api/dashboard/health`) — aggregate stats, no user data
- The chat page itself (`/chat`) — accessible without login (public chatbot)

**What is NOT intentionally shared:**
- Document content in chat responses
- Document embeddings in search results

---

## Question 5: What data isolation changes are required for public SaaS?

### Critical (Must-have before any multi-user deployment)

#### C-1 | Chat must scope search to user's documents
**Current:** `streamRAGResponse(message, 5)` — no userId
**Required:** `streamRAGResponse(message, 5, userId)` — filtered search

**File:** `app/api/chat/route.ts`
```typescript
// Current
const result = await streamRAGResponse(message, 5);

// Required — pass authenticated user's ID
const userSession = await auth();
const userId = userSession?.user?.id as string | undefined;
const result = await streamRAGResponse(message, 5, userId);
```

**Impact:** Public chatbot feature (no-login chat) would stop working. Need to decide: is chat public or authenticated-only?

#### C-2 | Chat sessions must be associated with users
**Current:** `chatSession.create({ data: { title } })` — no userId
**Required:** `chatSession.create({ data: { title, userId } })`

**File:** `app/api/chat/route.ts` line 49
```typescript
// Current
session = await prisma.chatSession.create({
  data: { title: message.substring(0, 50) + "..." },
});

// Required
session = await prisma.chatSession.create({
  data: {
    title: message.substring(0, 50) + "...",
    userId: userSession?.user?.id as string,
  },
});
```

**Impact:** Without this, chat sessions are anonymous and unlinked to users. The `chat_sessions.userId` column exists but is never set during creation.

#### C-3 | Dashboard stats must scope to user
**Current:** `prisma.document.count()` — counts ALL documents
**Required:** `prisma.document.count({ where: { userId } })` — counts user's documents only

**Files:**
- `app/api/dashboard/stats/route.ts` — 10 queries, none filter by userId
- `app/api/dashboard/usage/route.ts` — no userId filter
- `app/api/dashboard/cost/route.ts` — no userId filter
- `app/api/dashboard/top-documents/route.ts` — no userId filter

**Impact:** All authenticated users see the same global stats. In SaaS, each user should see only their own usage.

#### C-4 | File uploads must validate ownership
**Current:** Upload creates document with `userId: session.user.id` ✅ (already correct)
**But:** The `processDocument` function has no ownership context — it processes chunks without user scope

**Status:** ✅ Already correct — document creation uses userId. Chunk processing is document-scoped.

### High (Required for workspace/team features)

#### H-1 | Add workspace/tenant model
**Current:** `User → Document` (direct ownership)
**Required:** `Workspace → User → Document` (tenant isolation)

```prisma
model Workspace {
  id        String   @id @default(uuid())
  name      String
  plan      String   @default("free")
  users     User[]
  documents Document[]
}

model User {
  // ... existing fields
  workspaceId String  @map("workspace_id")
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
}
```

**Impact:** All queries need workspace-level filtering. Major architectural change.

#### H-2 | Add plan-based limits
**Current:** No limits on documents, messages, or storage
**Required:** Per-plan limits enforced at API level

```
Free: 10 documents, 100 messages/month, 50MB storage
Pro: 100 documents, 10000 messages/month, 5GB storage
Enterprise: Unlimited
```

#### H-3 | Chat must support both public and authenticated modes
**Current:** Chat is public (no auth required)
**Required:** Configurable per-workspace:
- Public chatbot: searches all workspace documents
- Private chat: searches only user's documents
- Team chat: searches all team members' documents

### Medium (Required for compliance)

#### M-1 | Add data export/delete per user (GDPR)
**Current:** No data export or deletion endpoints
**Required:** `GET /api/user/export` and `DELETE /api/user/account`

#### M-2 | Add audit logging
**Current:** `AnalyticsEvent` tracks events but not who accessed what
**Required:** Log all document access with userId, timestamp, and action

#### M-3 | Encrypt sensitive data at rest
**Current:** API keys stored in plaintext in `settings` and `mcp_servers` tables
**Required:** AES-256 encryption for API keys using NEXTAUTH_SECRET-derived key

---

## Data Flow Map (Current State)

```
                    ┌─────────────────────────────────┐
                    │         UPLOAD FLOW              │
                    │  ✅ Scoped to authenticated user  │
                    └─────────┬───────────────────────┘
                              │
  POST /api/upload ──auth()──►│ Document.create({ userId })
                              │ Chunks stored with documentId
                              │
                    ┌─────────▼───────────────────────┐
                    │         STORAGE                  │
                    │  document_chunks (no userId)     │
                    │  documents (has userId)          │
                    │  chat_sessions (has userId?)     │
                    └─────────┬───────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
    ┌─────────▼─────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  /api/chat    │ │ /api/know-  │ │ MCP tools   │
    │  ❌ SHARED    │ │ ledge/search│ │ ✅ SCOPED   │
    │  No userId    │ │ ✅ SCOPED   │ │ userId req  │
    │  Searches ALL │ │ userId filt │ │             │
    └───────────────┘ └─────────────┘ └─────────────┘
              │               │               │
    ┌─────────▼───────────────▼───────────────▼──────┐
    │              searchSimilarChunks()              │
    │                                                 │
    │  Without userId:  SELECT * FROM chunks ORDER BY │
    │  With userId:     JOIN documents WHERE user_id  │
    └─────────────────────────────────────────────────┘
```

---

## Summary

| Question | Answer |
|----------|--------|
| Shared or per-user? | **SHARED** — chat searches all documents |
| What does `/api/chat` search? | **ALL documents** — no userId filter |
| Can User B read User A's docs via chat? | **YES** — this is the current behavior |
| Is this intentional? | **NO** — design gap, not deliberate |
| SaaS-ready? | **NO** — requires chat scoping, session association, dashboard isolation |

---

*End of DATA_ISOLATION_AUDIT.md*
