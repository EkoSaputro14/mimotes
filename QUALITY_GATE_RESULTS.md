# Quality Gate Results — Real Measurements

**Date:** 2026-06-13
**Status:** 1/5 gates passing (4 failures)
**Method:** Live API benchmark (20 queries against production DB)

## Gate Results

| # | Gate | Threshold | Real Value | Status | Severity |
|---|------|----------|------------|--------|----------|
| 1 | Retrieval Accuracy | ≥70% | **100.0%** | ✅ PASS | Misleading* |
| 2 | Avg Similarity | ≥0.40 | **0.3218** | ❌ FAIL | MEDIUM |
| 3 | False Positive Rate | ≤20% | **100.0%** | ❌ FAIL | **CRITICAL** |
| 4 | Refusal Accuracy | ≥80% | **0.0%** | ❌ FAIL | **CRITICAL** |
| 5 | Avg Latency | ≤200ms | **325ms** | ❌ FAIL | HIGH |

*Gate 1 passes but is misleading — the system returns results for every query (including irrelevant ones), so "accuracy" is artificially 100%.

## Detailed Gate Analysis

### Gate 1: Retrieval Accuracy — ✅ PASS (MISLEADING)

| Property | Value |
|----------|-------|
| Threshold | ≥70% |
| Measured | 100% |
| Positive queries | 16/16 returned results |

**Why it's misleading:** The system returns 5 results for every query regardless of relevance. "Apa itu RAG?" returns results, but so does "Cara memasak nasi goreng?" — both count as "retrieved." This gate measures presence of results, not quality.

**Fix needed:** Redefine gate to measure *correctly* retrieved (requires ground truth chunk IDs or reranker judgment).

### Gate 2: Avg Similarity — ❌ FAIL

| Property | Value |
|----------|-------|
| Threshold | ≥0.40 |
| Measured | 0.3218 |
| Gap | -0.0782 (19.6% below threshold) |
| Max similarity | 0.4711 (multi-doc-003: "Security for RAG?") |
| Min similarity | 0.1793 (negative-001: "Cara memasak nasi goreng?") |

**Distribution:**
- Below 0.30: 5/20 queries (25%)
- 0.30–0.40: 11/20 queries (55%)
- Above 0.40: 4/20 queries (20%)

**Root cause:** Feature hashing compresses similarity into 0.15–0.50 range. Neural embeddings would produce 0.60–0.95 for relevant matches.

### Gate 3: False Positive Rate — ❌ FAIL (CRITICAL)

| Property | Value |
|----------|-------|
| Threshold | ≤20% |
| Measured | **100%** |
| Negative queries tested | 4 |
| False positives | **4/4 (100%)** |

**False positives found:**

| Query | Max Sim | Top Document | Why Wrong |
|-------|---------|-------------|-----------|
| "Cara memasak nasi goreng?" | 0.1793 | postgresql-17-US.pdf | Trigram overlap ("masak"→random hash collision) |
| "Weather forecast Jakarta?" | **0.5068** | postgresql-17-US.pdf | "query", "SELECT" in PG docs match "forecast" trigrams |
| "Presiden Indonesia 2030?" | 0.2058 | postgresql-9.6-US.pdf | Character trigram collision |
| "Fitur yang belum ada?" | 0.2932 | SKPT RIFKA.pdf | Certificate text matches generic words |

**Critical:** "Weather forecast Jakarta" scores 0.5068 — HIGHER than most relevant queries. Feature hashing cannot distinguish unrelated topics.

### Gate 4: Refusal Accuracy — ❌ FAIL (CRITICAL)

| Property | Value |
|----------|-------|
| Threshold | ≥80% |
| Measured | **0%** |
| Negative queries | 4 |
| Correct refusals | **0/4** |

The system has **no refusal mechanism**. Every query gets an answer. "What is the weather forecast?" will produce a PostgreSQL-document-based hallucinated answer.

### Gate 5: Avg Latency — ❌ FAIL

| Property | Value |
|----------|-------|
| Threshold | ≤200ms |
| Measured | 325ms |
| P95 latency | 629ms |
| Min latency | 270ms (warm, conceptual-002) |
| Max latency | 1442ms (cold start, factual-001) |

**Latency breakdown (estimated):**
- Embedding generation: ~200–300ms (feature hashing, local)
- Vector search: ~40–100ms (sequential scan, no HNSW)
- Network/overhead: ~20–50ms

**Fixes:**
1. Add HNSW index: -60% search latency (40ms → ~5ms)
2. Switch to pre-computed embeddings or caching: -80% embedding latency
3. Target post-fix: avg ~80ms, P95 ~150ms

## Gate Failure Summary

| Root Cause | Gates Affected | Fix |
|-----------|---------------|-----|
| Feature hashing embeddings | 2, 3, 4 | Switch to neural embeddings |
| No HNSW index | 5 | `CREATE INDEX ... USING hnsw` |
| No threshold filtering | 3, 4 | Raise threshold to 0.50+ |
| No refusal mechanism | 4 | Add confidence-based refusal |
| Sequential scan | 5 | Add HNSW index |

## Recommended Fix Order

| Step | Action | Gates Fixed | Effort |
|------|--------|------------|--------|
| 1 | Neural embeddings (OpenAI or local model) | 2, 3, 4 | 4h |
| 2 | HNSW index | 5 | 0.5h |
| 3 | Raise threshold to 0.50 | 3 | 0.5h |
| 4 | Reranker | 2, 3 | 4h |
| 5 | Refusal mechanism | 4 | 2h |

After steps 1–3: expect 4/5 gates to pass.
After steps 1–5: expect 5/5 gates to pass.
