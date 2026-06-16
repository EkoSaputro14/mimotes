# Baseline Retrieval Metrics — Pre-Optimization Snapshot

**Date:** 2026-06-13  
**Status:** Baseline (before Sprint 7B optimization)  
**Embedding Source:** Local (feature hashing) — Mimo Pro provider

## Baseline Measurements

### Estimated Metrics (Based on Pipeline Analysis)

These are estimated baselines based on code analysis and the RAG Reliability Audit. Actual measurements require a seeded database.

| Metric | Baseline (Estimated) | Target (Post-Sprint 7) | Gap |
|--------|---------------------|------------------------|-----|
| **Retrieval Accuracy** | ~50% | ≥70% | +20% |
| **Avg Similarity** | ~0.35 | ≥0.40 | +0.05 |
| **Avg Keyword Hit Rate** | ~40% | ≥60% | +20% |
| **False Positive Rate** | ~15% | ≤20% | OK |
| **Refusal Accuracy** | ~70% | ≥80% | +10% |
| **Avg Latency** | ~10ms | ≤200ms | OK |
| **P95 Latency** | ~25ms | ≤500ms | OK |

### Why These Estimates?

**Retrieval Accuracy ~50%:**
- Local embeddings (feature hashing) have poor semantic understanding
- Similarity threshold 0.30 admits many irrelevant chunks
- No reranking to filter false positives

**Avg Similarity ~0.35:**
- Feature hashing produces vectors with lower baseline similarity
- Relevant chunks typically score 0.40-0.60
- Irrelevant chunks score 0.25-0.35 (still above 0.30 threshold)

**False Positive Rate ~15%:**
- Negative queries may match on common words
- Feature hashing has high collision rate for short queries

### Category-Specific Baselines

| Category | Est. Accuracy | Est. Avg Similarity | Notes |
|----------|--------------|--------------------|----|
| Factual | ~60% | ~0.40 | Best case — clear keyword match |
| Conceptual | ~40% | ~0.32 | Requires semantic understanding |
| Multi-document | ~30% | ~0.30 | Hardest — needs cross-doc reasoning |
| Negative | ~85% | ~0.25 | Most are correctly empty |

### Difficulty-Specific Baselines

| Difficulty | Est. Accuracy | Est. Avg Similarity |
|------------|--------------|--------------------|
| Easy | ~65% | ~0.42 |
| Medium | ~45% | ~0.33 |
| Hard | ~30% | ~0.28 |

## Improvement Opportunities

| Improvement | Expected Accuracy Gain | Effort |
|-------------|----------------------|--------|
| Raise threshold to 0.50 | +15% | 1h |
| Add cross-encoder reranker | +25% | 4h |
| Tune hybrid weights | +5% | 2h |
| Query preprocessing | +5% | 4h |
| **Total potential** | **+50%** | **11h** |

## Post-Optimization Projections

| Metric | Baseline | After Threshold | After Reranker | After All |
|--------|---------|----------------|----------------|-----------|
| Accuracy | ~50% | ~65% | ~85% | ~90% |
| Avg Similarity | ~0.35 | ~0.45 | ~0.45 | ~0.50 |
| False Positive | ~15% | ~8% | ~3% | ~2% |
