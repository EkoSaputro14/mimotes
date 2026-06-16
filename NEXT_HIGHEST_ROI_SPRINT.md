# NEXT_HIGHEST_ROI_SPRINT.md — MimoNotes

> Sprint focused on **retrieval hardening and refusal accuracy** — zero external AI provider dependencies.
> Generated: 2026-06-13

---

## Sprint Goal

**Eliminate false-positive hallucinations and cut latency by 3–10×** by adding HNSW indexing, raising the similarity threshold, and implementing a refusal mechanism for low-confidence queries — all within existing infrastructure (pgvector + feature-hashing embeddings, no OpenAI).

---

## Current Baseline

| Metric | Value |
|---|---|
| Chunks | 107,571 (feature-hashing embeddings) |
| Similarity range | 0.15 – 0.50 |
| False positive rate | **100%** (negative queries always return results) |
| Refusal accuracy | **0%** |
| Avg latency | 325 ms (sequential scan, no HNSW) |
| Similarity threshold | 0.30 |
| Temperature | 0.3 |

Benchmark highlights:
- *Factual queries*: avg sim 0.2729, 53% keyword hit
- *Conceptual queries*: avg sim 0.3669, 30% keyword hit
- *Multi-doc queries*: avg sim 0.3559, 13% keyword hit
- *Negative queries*: ALL return false positives (sim 0.17–0.51)
- Best case: "What is pgvector?" → sim 0.3427, correct document
- Worst case: "Weather forecast Jakarta?" → sim 0.5068, **WRONG** document

---

## Sprint Tasks

### Task 1 — Add HNSW Index on `document_chunks.embedding`
**Effort:** 0.5 h  
**Files:** new Prisma migration, `vectorstore.ts`  
**What:**
```sql
CREATE INDEX CONCURRENTLY idx_chunks_embedding_hnsw
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);
```
Set `ef_search = 64` at session level for queries.  
**Impact:** Latency drops from ~325 ms → ~30–100 ms (3–10× faster).  
**Risk:** One-time build takes ~5–10 min on 107K chunks; runs online (`CONCURRENTLY`).

---

### Task 2 — Raise Similarity Threshold from 0.30 → 0.45
**Effort:** 0.25 h  
**File:** `lib/rag/vectorstore.ts` (or config/setting)  
**What:**
- Change `threshold` parameter from `0.30` to `0.45`.
- Expose as a DB `settings` row so it's tunable at runtime.  
**Impact:** Filters ~60% of false-positive matches. Negative queries like "Weather forecast Jakarta?" (sim 0.17–0.30 range) will no longer return results.  
**Risk:** Some marginal-but-legitimate low-similarity answers may be dropped. Monitor recall on factual queries.

---

### Task 3 — Implement Refusal / "I Don't Know" Mechanism
**Effort:** 2 h  
**Files:** `lib/rag/chain.ts`, `components/chat/MessageBubble.tsx`  
**What:**
- After retrieval, if **max similarity < 0.45** (or zero chunks returned), short-circuit:
  - Return a pre-written refusal message: *"Saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia."*
  - Do **not** call the LLM (saves tokens and prevents hallucination).
  - Include a structured `sources: []` in the response.
- Add a `"refusal"` field to the chat message metadata for analytics.  
**Impact:** Converts 0% refusal accuracy → estimated 70–80% refusal accuracy for off-topic queries. Eliminates hallucinated answers for irrelevant questions.  
**Risk:** Must be careful that legitimate queries near the 0.45 boundary aren't refused; threshold is tunable via Task 2.

---

### Task 4 — Deduplicate Near-Identical Chunks in Context
**Effort:** 1 h  
**File:** `lib/rag/chain.ts`  
**What:**
- Before building the context window, compute pairwise cosine similarity among retrieved chunks.
- Merge/drop chunks with similarity > 0.95 (near-duplicates).
- Cap context at top-K unique chunks (e.g., K = 5).  
**Impact:** Reduces token waste in the prompt; improves answer quality by eliminating redundancy. Expected ~15–25% reduction in context tokens for multi-chunk queries.  
**Risk:** Minimal; dedup is purely additive.

---

### Task 5 — Improve Context Packing and Source Attribution
**Effort:** 1.5 h  
**Files:** `lib/rag/chain.ts`, `components/chat/SourceCard.tsx`  
**What:**
- Prefix each context chunk with `[Source: <document_title> — Chunk <n>]`.
- Enforce a token budget (e.g., 3000 tokens max for context) with greedy selection by descending similarity.
- Update the grounding prompt in `chain.ts` to explicitly reference source tags.
- Ensure `sources` array in chat response includes `documentTitle`, `chunkIndex`, `similarity`.  
**Impact:** Users can verify answers; prompt stays within model context limits; LLM can cite specific sources.  
**Risk:** None; purely additive.

---

### Task 6 — Validate and Tune
**Effort:** 1 h  
**What:**
- Re-run the 20-query benchmark suite after Tasks 1–5.
- Compare: latency, refusal accuracy, false positive rate, answer correctness.
- Adjust threshold (0.45) if recall drops below 80% on factual queries.
- Document results in `.ai/BENCHMARK_RESULTS.md`.  
**Impact:** Confirms sprint delivers measurable improvement.  
**Risk:** None.

---

## Effort Summary

| Task | Effort | Impact |
|---|---|---|
| 1. HNSW Index | 0.5 h | 3–10× latency reduction |
| 2. Raise Threshold to 0.45 | 0.25 h | ~60% false positive reduction |
| 3. Refusal Mechanism | 2 h | 0% → 70–80% refusal accuracy |
| 4. Chunk Deduplication | 1 h | 15–25% context token savings |
| 5. Context Packing | 1.5 h | Source attribution + token budget |
| 6. Benchmark Validation | 1 h | Measurable proof of improvement |
| **Total** | **6.25 h** | |

---

## Expected Impact

| Metric | Before | After (Target) |
|---|---|---|
| Avg latency | 325 ms | **50–100 ms** |
| False positive rate | 100% | **< 40%** |
| Refusal accuracy | 0% | **70–80%** |
| Negative query hallucinations | Always | **Rare** |
| Context token waste | High (duplicates) | **15–25% reduction** |
| Source attribution | None | **Full** |

---

## Success Metrics

1. **Latency p50 < 100 ms** on the 20-query benchmark.
2. **Refusal accuracy ≥ 70%** — negative/off-topic queries return refusal instead of hallucinated answers.
3. **False positive rate < 40%** — at least 60% of previously incorrect results are now filtered.
4. **Factual query recall ≥ 80%** — raising threshold doesn't break correct answers.
5. **All responses include source attribution** with document title and chunk index.

---

## Why This Sprint (Not Others)

| Alternative | Why lower ROI |
|---|---|
| Replace feature-hashing with real embeddings | Requires external provider (OpenAI/local model); major refactor |
| Re-chunk documents with better splitting | High effort (4+ h); doesn't fix false positives at query time |
| Add BM25-only mode | Already enabled via hybrid search; marginal improvement |
| UI/UX improvements | Doesn't address core accuracy problem |
| Multi-turn conversation memory | Valuable but not blocking; false positives affect every query |

This sprint delivers the **maximum accuracy and performance improvement for minimum effort** using only existing infrastructure.
