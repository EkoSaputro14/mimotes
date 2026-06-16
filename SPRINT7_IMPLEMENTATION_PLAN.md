# Sprint 7 — Implementation Plan: Retrieval Quality Optimization

**Date:** 2026-06-13  
**Sprint:** 7  
**Goal:** Maximize retrieval precision with highest-ROI improvements

## Sprint Scope (Prioritized by ROI)

### P0 — Quick Wins (Must Have)

| # | Task | Effort | Impact | Files |
|---|------|--------|--------|-------|
| 1 | Raise similarity threshold (0.30 → 0.50 API, 0.40 local) | 1h | +15-20% precision | `vectorstore.ts`, `chain.ts` |
| 2 | Add embedding source-aware threshold | 0.5h | Dynamic quality | `chain.ts` |
| 3 | Increase fetchLimit (topK×3 → topK×5) | 0.5h | Better dedup pool | `vectorstore.ts` |

### P1 — Reranker (Biggest Impact)

| # | Task | Effort | Impact | Files |
|---|------|--------|--------|-------|
| 4 | Install `@xenova/transformers` | 0.5h | Dependency | `package.json` |
| 5 | Implement `lib/rag/reranker.ts` | 3h | +20-30% precision | New file |
| 6 | Add feature flag `rag_reranker_enabled` | 0.5h | Safe rollout | `settings.ts` |
| 7 | Integrate reranker into `chain.ts` | 1h | Pipeline integration | `chain.ts` |
| 8 | Write reranker tests | 1h | Regression protection | New test file |

### P2 — Hybrid Search Tuning

| # | Task | Effort | Impact | Files |
|---|------|--------|--------|-------|
| 9 | Test hybrid weight combinations | 2h | +5-10% precision | `vectorstore.ts` |
| 10 | Add weight configuration to settings | 1h | Tunable | `settings.ts` |

### P3 — Benchmark Infrastructure

| # | Task | Effort | Impact | Files |
|---|------|--------|--------|-------|
| 11 | Create benchmark dataset (20 queries) | 2h | Quality tracking | New fixture |
| 12 | Implement benchmark runner | 2h | Automation | New script |
| 13 | Add quality gates | 1h | Regression prevention | Script |

## Effort Summary

| Priority | Tasks | Effort | Expected Impact |
|----------|-------|--------|-----------------|
| P0 | 3 | 2h | +15-20% precision |
| P1 | 5 | 6h | +20-30% precision |
| P2 | 2 | 3h | +5-10% precision |
| P3 | 3 | 5h | Quality tracking |
| **Total** | **13** | **16h** | **+30-40% precision** |

## Implementation Order

```
Day 1 (2h):
  1. Raise similarity threshold (P0)
  2. Embedding source-aware threshold (P0)
  3. Increase fetchLimit (P0)

Day 2 (4h):
  4. Install @xenova/transformers (P1)
  5. Implement reranker.ts (P1)
  6. Feature flag (P1)

Day 3 (3h):
  7. Integrate reranker into chain.ts (P1)
  8. Write reranker tests (P1)
  9. Test hybrid weights (P2)

Day 4 (3h):
  10. Hybrid weight configuration (P2)
  11. Benchmark dataset (P3)
  12. Benchmark runner (P3)

Day 5 (2h):
  13. Quality gates (P3)
  14. Final benchmark run
  15. Documentation
```

## Expected Results

| Metric | Before Sprint 7 | After Sprint 7 | Target |
|--------|----------------|----------------|--------|
| Precision@5 (API) | ~72% | ~90% | 85% ✅ |
| Precision@5 (local) | ~38% | ~50% | 55% (close) |
| Answer accuracy | ~88% | ~92% | 92% ✅ |
| Hallucination rate | ~10% | ~5% | 5% ✅ |
| Source citation accuracy | ~85% | ~92% | 95% (close) |
| Retrieval latency p95 | ~10ms | ~60ms | ≤100ms ✅ |

## Dependencies

```json
{
  "@xenova/transformers": "^2.0.0"
}
```

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Reranker adds too much latency | LOW | MEDIUM | Feature flag, disable if >100ms |
| Reranker model download fails | LOW | HIGH | Fallback to no-reranker |
| Threshold too aggressive | MEDIUM | HIGH | Feature flag, A/B test |
| Hybrid weight tuning breaks queries | LOW | MEDIUM | Benchmark validation |

## Definition of Done

- [ ] Similarity threshold raised with embedding source detection
- [ ] Reranker implemented with feature flag
- [ ] Reranker integrated into chain.ts
- [ ] Hybrid search weights tested and configurable
- [ ] Benchmark dataset created (20 queries)
- [ ] Benchmark runner functional
- [ ] All tests pass (existing + new)
- [ ] Build passes
- [ ] Precision@5 ≥ 85% on benchmark
