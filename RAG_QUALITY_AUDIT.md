# RAG Quality Audit

**Date:** June 7, 2026
**Scope:** Retrieval quality, chunking strategy, embedding quality, context assembly, generation
**Codebase:** Mimotes (Next.js 16.2.7 + PostgreSQL + pgvector)

---

## Executive Summary

| Area | Score | Notes |
|------|-------|-------|
| Chunking Strategy | 5/10 | Basic paragraph splitting, no semantic chunking |
| Embedding Quality | 4/10 | Depends on provider; local fallback is very weak |
| Vector Search | 3/10 | No index, no threshold, no reranking |
| Context Assembly | 6/10 | Simple concatenation, no dedup or relevance filtering |
| Citation Quality | 4/10 | Prompt-based only, no structured output |
| **Overall RAG Quality** | **4/10** | Functional but basic |

---

## 1. Chunking Strategy

### Current Implementation (`lib/rag/chunker.ts`)

- **Method:** Paragraph-first splitting with sentence fallback
- **Chunk size:** 500 characters (default)
- **Overlap:** 50 words (~250-300 characters)
- **Splitting order:** Paragraphs → sentences (when paragraph > 1000 chars)

### Analysis

| Aspect | Status | Impact |
|--------|--------|--------|
| Paragraph boundary respect | ✅ Good | Chunks align with natural text breaks |
| Sentence splitting fallback | ✅ Good | Prevents oversized chunks |
| Overlap consistency | 🟡 Mismatch | Words vs characters — overlap is ~50-60% of chunk size |
| Semantic awareness | ❌ None | No embedding-based boundary detection |
| Metadata enrichment | 🟡 Basic | Only `chunkIndex` — no section title, heading, or position |
| Multi-language support | 🟡 Limited | Sentence splitting regex `[^.!?]+` works for English/Indonesian but misses other patterns |

### Issues

1. **Overlap is too large** — 50 words ≈ 250-300 chars overlap on 500-char chunks = 50-60% redundancy
2. **No semantic chunking** — Paragraphs can contain multiple topics; splitting by topic would improve relevance
3. **No heading/section tracking** — Chunks lose their position in the document hierarchy
4. **Fixed chunk size** — Different content types (code, tables, prose) benefit from different sizes

### Recommendations

| Priority | Fix | Effort |
|----------|-----|--------|
| High | Fix overlap to be character-based (e.g., 50 chars) | Low |
| Medium | Add heading/section metadata to chunks | Medium |
| Medium | Implement semantic chunking (embedding-based boundary detection) | High |
| Low | Dynamic chunk size based on content type | High |

---

## 2. Embedding Quality

### Current Implementation (`lib/rag/embedder.ts`)

- **Primary:** API-based embeddings (OpenAI-compatible)
- **Fallback:** Local feature hashing (trigram + word hash into 1536-dim vector)
- **Dimension:** 1536 (matching OpenAI text-embedding-ada-002)

### Provider Support

| Provider | Embeddings | Quality |
|----------|-----------|---------|
| OpenAI | ✅ API | High |
| LM Studio | ✅ API (if configured) | Medium-High |
| Ollama | ✅ API (if configured) | Medium-High |
| OpenRouter | ⚠️ Depends on model | Variable |
| Mimo Pro | ❌ No endpoint | Falls back to local |
| Custom | ⚠️ Depends on endpoint | Variable |

### Local Fallback Analysis

The feature hashing fallback:
- Uses character trigrams + word tokens
- Maps to 1536-dim vector via hash
- L2-normalizes the result

**Quality assessment:** This is essentially **BM25-style keyword matching** disguised as vector search. It captures term frequency but NOT semantic similarity. Two documents about the same topic using different words will have low similarity.

### Issues

1. **Local fallback quality is very low** — Not suitable for production use
2. **No embedding model selection** — Users can't choose embedding model
3. **No embedding caching** — Same text re-embedded on every upload
4. **No batch optimization** — Embeddings generated sequentially for large documents

### Recommendations

| Priority | Fix | Effort |
|----------|-----|--------|
| High | Add local embedding model (`@xenova/transformers` + `all-MiniLM-L6-v2`) | Medium |
| Medium | Add embedding cache (LRU or DB-backed) | Medium |
| Low | Allow user-selected embedding model | Low |

---

## 3. Vector Search Quality

### Current Implementation (`lib/rag/vectorstore.ts`)

- **Algorithm:** pgvector cosine distance (`<=>` operator)
- **Index:** ❌ None (sequential scan)
- **Filter:** `workspace_id` direct filter
- **Threshold:** ❌ None in chat, configurable in knowledge search

### Search Performance

| Metric | Current | Target |
|--------|---------|--------|
| Index type | Sequential scan | HNSW |
| Query time (1K chunks) | ~50ms | ~5ms |
| Query time (10K chunks) | ~500ms | ~10ms |
| Query time (100K chunks) | ~5s | ~20ms |

### Issues

1. **No vector index** — O(n) scan per query
2. **No similarity threshold in chat** — Irrelevant chunks included
3. **No reranking** — Initial retrieval is final
4. **No hybrid search** — Pure vector search, no BM25/keyword component
5. **No query expansion** — Single query, no multi-query or HyDE

### Recommendations

| Priority | Fix | Effort |
|----------|-----|--------|
| Critical | Add HNSW index on embedding column | Low |
| High | Add similarity threshold (min 0.3) | Low |
| High | Add cross-encoder reranking | Medium |
| Medium | Add hybrid search (vector + BM25) | High |
| Medium | Add query expansion (multi-query) | Medium |
| Low | Add HyDE (Hypothetical Document Embeddings) | Medium |

---

## 4. Context Assembly

### Current Implementation (`lib/rag/chain.ts`)

```
[1] chunk1 content
[2] chunk2 content
[3] chunk3 content
...
```

- **Method:** Simple concatenation with index prefix
- **Dedup:** None
- **Relevance filtering:** None (all retrieved chunks included)
- **Token budget:** None (context can exceed model limits)
- **Source metadata:** Not included in context (only in API response)

### Issues

1. **No deduplication** — Duplicate or near-duplicate chunks waste context space
2. **No token budget** — Context can exceed model's context window
3. **No relevance filtering** — Low-similarity chunks dilute context quality
4. **No source attribution in context** — LLM sees `[1]` but doesn't know which document
5. **No chunk ordering** — Chunks ordered by index, not relevance

### Recommendations

| Priority | Fix | Effort |
|----------|-----|--------|
| High | Add document title to context: `[1] (Document: foo.pdf) chunk content` | Low |
| High | Add token budget (truncate to model's context limit) | Low |
| Medium | Deduplicate near-identical chunks (cosine > 0.95) | Medium |
| Medium | Reorder chunks by similarity score (most relevant first) | Low |
| Low | Add MMR (Maximal Marginal Relevance) for diversity | High |

---

## 5. Citation Quality

### Current Implementation

**System prompt:**
```
Selalu sebutkan sumber referensi dari dokumen yang Anda gunakan dalam jawaban.
```

**API response:**
```json
{
  "sources": [
    {
      "documentId": "...",
      "content": "...",
      "similarity": 0.85,
      "metadata": { "chunkIndex": 3 }
    }
  ]
}
```

### Issues

1. **No document title in sources** — Only `documentId`, user can't identify the source
2. **No structured citation format** — LLM may or may not cite consistently
3. **No confidence score display** — Similarity score not shown to user
4. **No source highlighting** — User can't see which part of the answer came from which source

### Recommendations

| Priority | Fix | Effort |
|----------|-----|--------|
| High | Add document title to source metadata | Low |
| Medium | Enforce structured citation: `[1] Title (similarity: 85%)` | Low |
| Low | Add source highlighting in frontend | Medium |

---

## 6. End-to-End Quality Assessment

### Quality Score Breakdown

| Component | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Chunking | 5/10 | 20% | 1.0 |
| Embedding | 4/10 | 25% | 1.0 |
| Vector Search | 3/10 | 25% | 0.75 |
| Context Assembly | 6/10 | 15% | 0.9 |
| Citation | 4/10 | 15% | 0.6 |
| **Total** | | | **4.25/10** |

### **Overall RAG Quality Score: 4/10**

---

## Quick Wins (Highest Impact, Lowest Effort)

| # | Fix | Impact | Effort |
|---|-----|--------|--------|
| 1 | Add HNSW vector index | 🔴 Critical | 5 min |
| 2 | Add similarity threshold (0.3) | 🟠 High | 10 min |
| 3 | Fix overlap to character-based | 🟡 Medium | 15 min |
| 4 | Add document title to context | 🟠 High | 10 min |
| 5 | Add token budget | 🟠 High | 30 min |

### Implementation Priority

**Phase 1 (Immediate):**
- Add HNSW index
- Add similarity threshold
- Add document title to context

**Phase 2 (This Sprint):**
- Fix chunk overlap
- Add token budget
- Add source attribution to context

**Phase 3 (Next Sprint):**
- Add reranking (cross-encoder)
- Add local embedding model
- Add chunk deduplication

**Phase 4 (Future):**
- Hybrid search (vector + BM25)
- Semantic chunking
- Query expansion / HyDE
- MMR for diversity

---

*Report generated by Hermes Agent — RAG Quality Audit*
