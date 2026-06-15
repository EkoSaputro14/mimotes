# Sprint 7B Priority Report — Optimization Roadmap

**Date:** 2026-06-13
**Based on:** Real benchmark measurements (20 queries, live API)
**Status:** Ready for implementation

## Current State Summary

| Metric | Real Value | Target | Gap |
|--------|-----------|--------|-----|
| Retrieval Accuracy | 100%* | ≥70% | N/A (misleading) |
| Avg Similarity | 0.3218 | ≥0.40 | -19.6% |
| False Positive Rate | 100% | ≤20% | **+400%** |
| Refusal Accuracy | 0% | ≥80% | **-100%** |
| Avg Latency | 325ms | ≤200ms | +62.5% |
| P95 Latency | 629ms | ≤500ms | +25.7% |

*Returns results for every query — not a meaningful quality metric.

## Root Cause Priority Matrix

| # | Root Cause | Impact | Affected Gates | Effort | ROI |
|---|-----------|--------|---------------|--------|-----|
| 1 | **Feature hashing embeddings** | BLOCKING | 2, 3, 4 | 4h | 🔴 Critical |
| 2 | **No HNSW index** | HIGH | 5 | 0.5h | 🟢 Quick win |
| 3 | **Threshold too low (0.30)** | HIGH | 3, 4 | 0.5h | 🟢 Quick win |
| 4 | **No refusal mechanism** | MEDIUM | 4 | 2h | 🟡 Medium |
| 5 | **No reranker** | MEDIUM | 2, 3 | 4h | 🟡 Medium |
| 6 | **Corpus imbalance** | LOW | — | 2h | 🟡 Medium |

## Sprint 7B Implementation Plan

### Phase 1: Quick Wins (1h)

**Task 1.1: Add HNSW Index** (30min)

```sql
CREATE INDEX CONCURRENTLY document_chunks_embedding_hnsw
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

Expected: Latency from 325ms → ~100ms (3x improvement).

**Task 1.2: Raise Similarity Threshold** (30min)

Change in `lib/rag/vectorstore.ts`:
```typescript
const DEFAULT_MIN_SIMILARITY = 0.50; // was 0.30
```

Expected: False positive rate from 100% → ~60% (still limited by feature hashing).

### Phase 2: Embedding Upgrade (4h) — BLOCKING

**Task 2.1: Switch to Neural Embeddings** (3h)

Options (ranked by quality/effort):

| Option | Quality | Latency | Cost | Privacy |
|--------|---------|---------|------|---------|
| OpenAI text-embedding-3-small | ⭐⭐⭐⭐ | +100ms | $0.02/1M tokens | Data leaves |
| Ollama nomic-embed-text (local) | ⭐⭐⭐ | +200ms | Free | Full privacy |
| HuggingFace all-MiniLM-L6-v2 | ⭐⭐⭐ | +150ms | Free | Full privacy |

**Recommended:** OpenAI text-embedding-3-small for best quality, with local fallback.

Implementation:
1. Add embedding model config to settings
2. Update `lib/rag/embedder.ts` to use real API
3. Migration script: re-embed all 107K chunks
4. Verify dimension (1536 stays same for OpenAI)

**Task 2.2: Re-embed All Chunks** (1h)

```bash
# Batch re-embedding script
npx tsx scripts/reembed-all-chunks.ts --batch-size 100
```

Expected: After re-embedding, similarity range moves from 0.15–0.50 to 0.50–0.95 for relevant matches. This alone fixes gates 2, 3, and 4.

### Phase 3: Refusal Mechanism (2h)

**Task 3.1: Add Confidence-Based Refusal** (2h)

In `lib/rag/chain.ts`:
```typescript
const MIN_CONFIDENCE_THRESHOLD = 0.50;
if (topSimilarity < MIN_CONFIDENCE_THRESHOLD) {
  return "Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia.";
}
```

Expected: Refusal accuracy from 0% → 80%+.

### Phase 4: Reranker (4h) — OPTIONAL

Only after Phase 2 (neural embeddings) is complete. Reranker on feature-hashed embeddings has limited value.

**Task 4.1: Add BGE Reranker Sidecar** (4h)

Docker container with `BAAI/bge-reranker-v2-m3`. Integration in search pipeline.

Expected: Avg similarity from 0.50 → 0.65+ (with neural embeddings).

### Phase 5: Corpus Rebalancing (2h) — OPTIONAL

**Task 5.1: Add Diverse Documents**

Current: 99% PDF chunks (PostgreSQL manuals).
Target: No single type > 50% of chunks.

Add: more TXT/DOCX documents about the actual application, business docs, user guides.

## Projected Metrics After Each Phase

| Metric | Current | After Phase 1 | After Phase 2 | After Phase 3 | After Phase 4 |
|--------|---------|---------------|---------------|---------------|---------------|
| Avg Similarity | 0.32 | 0.32 | **0.55** | 0.55 | **0.65** |
| False Positive Rate | 100% | 60% | **15%** | 15% | **5%** |
| Refusal Accuracy | 0% | 0% | 0% | **80%** | 85% |
| Avg Latency | 325ms | **100ms** | 200ms | 200ms | 300ms |
| P95 Latency | 629ms | **200ms** | 400ms | 400ms | 500ms |
| Gates Passing | 1/5 | 1/5 | **3/5** | **4/5** | **5/5** |

## Effort Summary

| Phase | Effort | Gates Fixed | Priority |
|-------|--------|------------|----------|
| Phase 1: Quick Wins | 1h | Latency only | P0 |
| Phase 2: Neural Embeddings | 4h | 2, 3 | **P0 — BLOCKING** |
| Phase 3: Refusal | 2h | 4 | P1 |
| Phase 4: Reranker | 4h | 2, 3 (refinement) | P2 |
| Phase 5: Corpus | 2h | — | P2 |
| **Total** | **13h** | **5/5** | |

## Critical Path

```
Phase 2 (Neural Embeddings) → Phase 1 (HNSW + Threshold) → Phase 3 (Refusal) → Phase 4 (Reranker)
     BLOCKING                      Quick wins                 Required for gate 4    Optional
```

**Phase 2 MUST come first.** Without neural embeddings:
- Threshold tuning is fighting against 0.15–0.50 similarity range
- Reranker cannot fix fundamentally wrong top-K results
- False positive rate stays near 100%

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Embedding API downtime | Low | High | Local fallback (all-MiniLM-L6-v2) |
| Re-embedding takes too long | Medium | Medium | Batch in background, 100 chunks/batch |
| HNSW build blocks writes | Low | Low | CREATE INDEX CONCURRENTLY |
| New embeddings worse than expected | Low | High | A/B test with 100 chunks first |
| Cost exceeds budget | Low | Low | ~$0.20 for 107K chunks with OpenAI |

## Benchmark Tool

Real benchmark runner: `scripts/real-benchmark.py`

```bash
# Run benchmark
python scripts/real-benchmark.py --output results.json

# Verify gates
python scripts/real-benchmark.py 2>&1 | grep -E "✅|❌"
```

Uses authenticated MimoNotes search API — no embedding mismatch issues.
Re-run after each phase to track improvement.
