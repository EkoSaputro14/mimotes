# RAG Improvement Roadmap — Production Readiness Path

**Date:** 2026-06-13  
**Current State:** Functional but fragile (P0 issues present)  
**Target State:** Production-grade RAG with measurable quality metrics

## Roadmap Overview

```
Phase 1 (Sprint 5)     Phase 2 (Sprint 6)     Phase 3 (Sprint 7)     Phase 4 (Sprint 8)
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Parser Tests +   │   │ Embedder         │   │ Retrieval        │   │ Advanced         │
│ Chunker Hardening│   │ Hardening        │   │ Quality          │   │ Features         │
│                  │   │                  │   │                  │   │                  │
│ • Parser tests   │   │ • Retry logic    │   │ • Reranking      │   │ • Query expansion│
│ • Chunker tests  │   │ • Dimension check│   │ • Threshold tune │   │ • Conversation   │
│ • Content valid. │   │ • Batch limits   │   │ • Hybrid tuning  │   │ • Caching        │
│ • Sentence split │   │ • Embed. caching │   │ • Chain tests    │   │ • Evaluation     │
└─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
```

## Phase 1: Parser + Chunker Hardening (Sprint 5)

### Priority: P0 — Foundation for all other improvements

| Task | Effort | Impact | Description |
|------|--------|--------|-------------|
| Write parser unit tests | 2h | HIGH | 18 tests for parseTXT, parseCSV, parseURL, sanitizeText |
| Write chunker unit tests | 1h | HIGH | 8 tests for chunk boundaries, overlap, edge cases |
| Add post-parse content validation | 1h | HIGH | Reject empty/whitespace-only content |
| Improve sentence splitting | 2h | MEDIUM | Handle abbreviations (Dr., U.S.A., etc.) |
| Add chunk count limit | 0.5h | MEDIUM | Cap at 1000 chunks per document |
| Add parser error logging | 0.5h | MEDIUM | Structured logs for debugging |
| **Total** | **7h** | | |

**Quality Gates:**
- All 26 parser + chunker tests pass
- No empty content stored as "ready"
- Sentence splitting handles common abbreviations

## Phase 2: Embedder Hardening (Sprint 6)

### Priority: P0 — Critical quality improvement

| Task | Effort | Impact | Description |
|------|--------|--------|-------------|
| Add embedding retry logic | 1h | HIGH | Retry 2× with exponential backoff before fallback |
| Add dimension validation | 0.5h | HIGH | Verify API returns 1536-dim vectors |
| Add batch size limit | 0.5h | MEDIUM | Process 100 texts per API call |
| Improve fallback detection | 1h | HIGH | Log + surface to user when using local embeddings |
| Add embedding caching | 2h | MEDIUM | Cache query embeddings (same question = same vector) |
| Write embedder tests | 1.5h | HIGH | 6 tests for local embedding + fallback behavior |
| **Total** | **6.5h** | | |

**Quality Gates:**
- All 6 embedder tests pass
- API failures retry 2× before fallback
- Users see warning when local embeddings are active
- Embedding dimensions always 1536

## Phase 3: Retrieval Quality (Sprint 7)

### Priority: P1 — Significant quality improvement

| Task | Effort | Impact | Description |
|------|--------|--------|-------------|
| **Strengthen system prompt** | 1h | CRITICAL | Hard constraint: "ONLY from context, NEVER general knowledge" |
| **Reduce temperature to 0.3** | 0.5h | HIGH | Factual Q&A needs deterministic answers |
| Add cross-encoder reranker | 4h | HIGH | Rerank top-20 results to top-5 |
| Tune similarity threshold | 1h | MEDIUM | Test 0.30 vs 0.40 vs 0.50 with real queries |
| Tune hybrid search weights | 1h | MEDIUM | Test vectorWeight/bm25Weight combinations |
| Add source citation verification | 2h | HIGH | Post-generation check: cited docs in context? |
| Write chain integration tests | 2h | MEDIUM | 3 tests for generateRAGResponse |
| **Total** | **11.5h** | | |

**Quality Gates:**
- Temperature reduced to 0.3
- System prompt enforces context-only answers
- Source citations verified post-generation
- Reranker improves precision@5 by 15%+

## Phase 4: Advanced Features (Sprint 8)

### Priority: P2 — Nice-to-have improvements

| Task | Effort | Impact | Description |
|------|--------|--------|-------------|
| Query preprocessing | 3h | MEDIUM | Spell correction, query expansion |
| Conversation history | 4h | MEDIUM | Include previous Q&A in context |
| Embedding cache (Redis) | 3h | MEDIUM | Production caching layer |
| RAG evaluation framework | 4h | HIGH | Automated quality metrics (precision, recall, F1) |
| A/B testing infrastructure | 4h | MEDIUM | Compare retrieval strategies |
| Document-level deduplication | 2h | LOW | Skip re-ingestion of identical content |
| **Total** | **20h** | | |

---

## Effort Summary

| Phase | Sprint | Effort | Key Deliverable |
|-------|--------|--------|-----------------|
| Phase 1 | Sprint 5 | 7h | Parser + chunker tests + hardening |
| Phase 2 | Sprint 6 | 6.5h | Embedder retry + validation + tests |
| Phase 3 | Sprint 7 | 11.5h | System prompt + temperature + reranking |
| Phase 4 | Sprint 8 | 20h | Advanced features + evaluation |
| **Total** | | **45h** | Production-grade RAG |

## Quality Metrics Targets

| Metric | Current (Est.) | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|--------|---------------|---------|---------|---------|---------|
| Parser test coverage | 0% | 80% | 80% | 80% | 90% |
| Chunker test coverage | 0% | 70% | 70% | 70% | 80% |
| Embedder test coverage | 0% | 0% | 60% | 60% | 70% |
| Retrieval precision@5 (API) | ~70% | 70% | 75% | 85% | 90% |
| Retrieval precision@5 (local) | ~35% | 35% | 45% | 55% | 65% |
| Answer accuracy | ~75% | 75% | 80% | 90% | 92% |
| Hallucination rate | ~25% | 25% | 20% | 8% | 5% |

## Dependencies

```
Phase 1 (parser/chunker) ← no dependencies
Phase 2 (embedder) ← depends on Phase 1 (good chunks need good parsing)
Phase 3 (retrieval) ← depends on Phase 2 (good retrieval needs good embeddings)
Phase 4 (advanced) ← depends on Phase 3 (evaluation needs stable pipeline)
```

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Reranker adds too much latency | MEDIUM | MEDIUM | Async reranking, cache results |
| Threshold tuning breaks existing queries | LOW | HIGH | A/B test before rollout |
| Embedding cache stale data | MEDIUM | LOW | TTL-based expiry |
| Cross-encoder model too large for deployment | MEDIUM | MEDIUM | Use lightweight model (MiniLM) |
