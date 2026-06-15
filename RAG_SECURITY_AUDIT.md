# RAG Security Audit

**Date:** June 7, 2026
**Scope:** Full RAG pipeline — upload, chunking, embeddings, vector storage, retrieval, context assembly
**Codebase:** Mimotes (Next.js 16.2.7 + PostgreSQL + pgvector)

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 1 | Needs immediate attention |
| 🟠 High | 3 | Should fix before production |
| 🟡 Medium | 4 | Recommended improvements |
| 🔵 Low | 4 | Nice-to-have |

**Overall Security Score: 5/10** — Core retrieval isolation works via app-level filters, but defense-in-depth (RLS) is bypassed and several gaps exist.

---

## 1. Tenant Isolation at Retrieval Level

### Question: Is tenant isolation enforced at retrieval level?

**Answer: Partially — app-level only, defense-in-depth is bypassed.**

#### App-Level Isolation (✅ Works)

`searchSimilarChunks()` in `lib/rag/vectorstore.ts`:
```sql
WHERE dc.workspace_id = ${workspaceId}
```

The `workspaceId` parameter is passed from `streamRAGResponse()` → `searchSimilarChunks()`, which gets it from `resolveWorkspaceId(userId)` in the chat route. This correctly scopes retrieval to the user's workspace.

#### RLS Isolation (❌ Bypassed)

RLS is enabled on `document_chunks` via migration `20260606_rls_enable`:
```sql
CREATE POLICY document_chunks_tenant_isolation ON document_chunks
  FOR ALL
  USING (document_id IN (
    SELECT id FROM documents
    WHERE user_id = current_setting('app.current_user_id')::text
  ))
```

**However:** The `mimotes_app` database user has `BYPASSRLS` privilege (granted during setup for seeding). This means RLS policies are **never enforced** — all queries bypass row-level security entirely.

**Additionally:** The RLS policy uses `app.current_user_id`, but the app only sets `app.current_workspace_id` via `setWorkspaceContext()`. Even if BYPASSRLS were removed, the RLS context variable would be unset, causing policy evaluation to fail.

### 🔴 CRITICAL: RLS Defense-in-Depth is Non-Functional

- **Impact:** If app-level filter has a bug, there's no database-level safety net
- **Location:** `prisma/migrations/20260606_rls_enable/migration.sql`
- **Fix:**
  1. Change `setWorkspaceContext()` to set `app.current_user_id` OR update RLS policies to use `app.current_workspace_id`
  2. Remove `BYPASSRLS` from `mimotes_app` user
  3. Add workspace-level RLS policy (not just user-level)

---

## 2. Vector Search Leak Risk

### Question: Can vector search leak chunks from another workspace?

**Answer: Not through the primary `searchSimilarChunks()` path, but yes through knowledge search endpoints.**

#### Primary Path (✅ Safe)

`searchSimilarChunks()` filters by `workspace_id`:
```sql
WHERE dc.workspace_id = ${workspaceId}
```

#### Knowledge Search (🟠 HIGH Risk)

`app/api/knowledge/search/route.ts` and `app/api/knowledge/chunks/[id]/similar/route.ts` filter by `d.user_id` instead of `d.workspace_id`:

```sql
WHERE d.user_id = ${session.user.id}
```

This is **user-level** isolation, not workspace-level. In a multi-member workspace:
- Member A uploads documents
- Member B cannot search those documents (blocked by `user_id` filter)
- This is inconsistent with the chat route which uses workspace-level isolation

### 🟠 HIGH: Inconsistent Isolation Model

- **Impact:** Workspace members can't search shared documents via knowledge search
- **Location:** `app/api/knowledge/search/route.ts` (lines 52, 70), `app/api/knowledge/chunks/[id]/similar/route.ts` (line 51)
- **Fix:** Change `d.user_id = ${session.user.id}` to `d.workspace_id = ${workspaceId}`

---

## 3. workspaceId in Every Vector Query

### Question: Is workspaceId included in every vector query?

**Answer: Mostly yes, but with gaps.**

| Query Location | workspaceId | Status |
|---------------|-------------|--------|
| `vectorstore.ts` searchSimilarChunks | ✅ Direct filter | Correct |
| `knowledge/search` (all docs) | ❌ Uses `user_id` | Inconsistent |
| `knowledge/search` (specific doc) | ❌ Uses `user_id` | Inconsistent |
| `knowledge/chunks/[id]/similar` | ❌ Uses `user_id` | Inconsistent |
| `chat/route.ts` → chain.ts | ✅ Via workspaceId param | Correct |

### 🟡 MEDIUM: Knowledge Search Uses Wrong Tenant Key

- **Impact:** Inconsistent isolation between chat and knowledge search
- **Fix:** Align all vector queries to use `workspace_id`

---

## 4. Retrieval top-k Configurability

### Question: Is retrieval top-k configurable?

**Answer: Partially — hardcoded in chat, configurable in knowledge search.**

| Endpoint | topK | Configurable? |
|----------|------|---------------|
| `chat/route.ts` | 5 | ❌ Hardcoded |
| `chain.ts` (generateRAGResponse) | 5 | ✅ Parameter (but always called with 5) |
| `chain.ts` (streamRAGResponse) | 5 | ✅ Parameter (but always called with 5) |
| `knowledge/search` | 5 | ✅ Request body (1-20) |
| `knowledge/chunks/[id]/similar` | 5 | ✅ Query param (1-20) |

### 🟡 MEDIUM: Chat topK is Not User-Configurable

- **Impact:** Users can't tune retrieval depth for their use case
- **Fix:** Add `topK` to chat request body with workspace-level default

---

## 5. Reranking

### Question: Is reranking implemented?

**Answer: No.**

There is no cross-encoder, LLM-based, or any form of reranking after initial retrieval. The top-k results from cosine similarity are used directly as context.

### 🟡 MEDIUM: No Reranking Step

- **Impact:** Initial retrieval may include irrelevant chunks that push out better matches
- **Fix:** Add optional reranking step:
  1. Retrieve top-20 candidates
  2. Rerank with cross-encoder (e.g., `cross-encoder/ms-marco-MiniLM-L-6-v2`)
  3. Return top-5 after reranking

---

## 6. Citation/Source Attribution

### Question: Is citation/source attribution implemented?

**Answer: Partially — in prompt instruction, not in structured output.**

The system prompt instructs:
```
Selalu sebutkan sumber referensi dari dokumen yang Anda gunakan dalam jawaban.
```

Sources are returned in the API response:
```typescript
sources: similarChunks.map((chunk) => ({
  documentId: chunk.documentId,
  content: chunk.content,
  similarity: chunk.similarity,
  metadata: chunk.metadata,
}))
```

**Gaps:**
- No structured citation format (e.g., `[1]`, `[2]`) enforced in output
- No document title in source metadata (only `documentId`)
- Frontend doesn't display source attribution prominently

### 🔵 LOW: Citation is Prompt-Based, Not Structured

- **Impact:** LLM may not consistently cite sources
- **Fix:** Add document title to source metadata, enforce `[N]` citation format in prompt

---

## 7. Chunk Deduplication

### Question: Are chunks deduplicated?

**Answer: No.**

- No deduplication on upload (same file uploaded twice = duplicate chunks)
- No deduplication within a document (overlapping paragraphs can create near-identical chunks)
- No content hash check before storage

### 🟡 MEDIUM: No Deduplication

- **Impact:** Storage bloat, degraded retrieval quality (duplicate chunks score similarly)
- **Fix:** Add content hash column to `document_chunks`, check before insert

---

## 8. Deleted Documents in Retrieval

### Question: Can deleted documents still appear in retrieval?

**Answer: No — properly handled.**

`deleteDocumentChunks(documentId)` is called in `documents/[id]/route.ts` DELETE handler BEFORE the document record is deleted:

```typescript
await deleteDocumentChunks(id);  // Delete vector embeddings
// ... delete file ...
await prisma.document.delete({ where: { id } });  // Delete DB record
```

The `DocumentChunk` model has `onDelete: Cascade` from `Document`, so even if `deleteDocumentChunks` fails, the cascade delete would clean up.

### ✅ Correctly Implemented

---

## 9. Embedding Regeneration on Document Update

### Question: Are embeddings regenerated on document update?

**Answer: No — documents cannot be updated.**

There is no document update endpoint. Documents can only be:
- Uploaded (POST `/api/upload`)
- Deleted (DELETE `/api/documents/[id]`)

To "update" a document, users must delete and re-upload. This is a design choice, not a bug, but limits usability.

### 🔵 LOW: No Document Update/Re-embedding

- **Impact:** Users must delete + re-upload to update content
- **Fix:** Add PUT endpoint that re-chunks and re-embeds

---

## 10. Additional Security Findings

### 🔴 CRITICAL: No Vector Index

There is no `ivfflat` or `hnsw` index on the `embedding` column. Every similarity search performs a **sequential scan** of all chunks in the workspace.

**Impact:** O(n) performance per query. With 10K chunks, each query scans all 10K vectors.
**Fix:** Create HNSW index:
```sql
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### 🟠 HIGH: No Similarity Threshold in Chat

`streamRAGResponse()` returns top-5 chunks regardless of similarity score. If all chunks have 0.1 similarity (essentially random), they still get included as context.

**Impact:** Irrelevant context leads to hallucinated or misleading answers
**Fix:** Add threshold parameter, default 0.3:
```typescript
const similarChunks = await searchSimilarChunks(queryEmbedding, topK, workspaceId, 0.3);
```

### 🟠 HIGH: Local Embedding Fallback is Weak

When the AI provider doesn't support embeddings (e.g., Mimo Pro), the system falls back to feature hashing — a simple trigram + word hash into a 1536-dim vector.

**Impact:** Significantly reduced retrieval quality (essentially keyword matching, not semantic)
**Fix:** Use a local embedding model (e.g., `all-MiniLM-L6-v2` via `@xenova/transformers`)

### 🔵 LOW: Chunk Overlap Mismatch

The chunker uses `chunkSize: 500` (characters) but `overlap: 50` (words). A word averages 5-6 characters, so overlap is ~250-300 characters — much larger than intended.

**Impact:** Excessive overlap wastes storage and creates redundant context
**Fix:** Make both character-based or both word-based

---

## Recommended Priority Order

1. 🔴 **Fix RLS context variable** — Set `app.current_workspace_id` in RLS policies, remove BYPASSRLS
2. 🔴 **Add vector index** — HNSW index on embedding column
3. 🟠 **Add similarity threshold** — Minimum 0.3 for chat retrieval
4. 🟠 **Fix knowledge search isolation** — Use `workspace_id` instead of `user_id`
5. 🟡 **Add reranking** — Cross-encoder after initial retrieval
6. 🟡 **Add chunk deduplication** — Content hash check
7. 🟡 **Make topK configurable** — User/workspace setting
8. 🔵 **Add document update** — Re-chunk and re-embed endpoint

---

*Report generated by Hermes Agent — RAG Security Audit*
