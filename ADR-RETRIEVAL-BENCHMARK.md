# ADR-RETRIEVAL-BENCHMARK: Retrieval Quality Measurement Infrastructure

**Status:** Accepted  
**Date:** 2026-06-13  
**Deciders:** Sprint 7A  
**Technical Story:** Building automated retrieval quality measurement before optimization

## Context

The RAG pipeline has been hardened through Sprints 5A, 5B, and 6, but we have no automated way to measure retrieval quality. Without measurement, we cannot:
- Know if changes improve or degrade quality
- Set quality gates for CI/CD
- Track quality over time
- Compare different retrieval strategies

## Decision

### Benchmark Dataset

- **Location:** `tests/fixtures/rag-benchmark.json`
- **Size:** 20 queries (minimum)
- **Categories:**
  - Factual (5) — single-answer questions
  - Conceptual (5) — understanding-based questions
  - Multi-document (5) — requires combining multiple sources
  - Negative (3+) — no relevant document exists
  - Edge cases (2) — single-word query, non-existent feature
- **Languages:** Indonesian (primary), English (secondary)

### Benchmark Runner

- **Location:** `scripts/rag-benchmark.ts`
- **Execution:** `npx tsx scripts/rag-benchmark.ts`
- **Output:** Structured report with metrics and quality gates

### Quality Gates

| Gate | Threshold | Direction |
|------|----------|-----------|
| Retrieval Accuracy | ≥70% | Higher is better |
| Avg Similarity | ≥0.40 | Higher is better |
| False Positive Rate | ≤20% | Lower is better |
| Refusal Accuracy | ≥80% | Higher is better |
| Avg Latency | ≤200ms | Lower is better |

### Metrics

| Metric | Definition |
|--------|-----------|
| Retrieval Accuracy | % of positive queries that retrieved relevant chunks |
| Avg Similarity | Average max similarity score across all queries |
| Keyword Hit Rate | % of expected keywords found in retrieved content |
| False Positive Rate | % of negative queries that retrieved something |
| Refusal Accuracy | % of negative queries correctly refused |
| Latency p95 | 95th percentile retrieval time |

## Consequences

### Positive
- Automated quality measurement before any optimization
- Quality gates prevent regressions in CI/CD
- Baseline metrics enable A/B testing
- Category/difficulty breakdown identifies weak areas

### Negative
- Benchmark dataset needs maintenance as documents change
- Requires seeded database for meaningful results
- Adds ~1s to test suite execution

## References

- [RETRIEVAL_BENCHMARK_PLAN.md](../RETRIEVAL_BENCHMARK_PLAN.md)
- [RETRIEVAL_QUALITY_AUDIT.md](../RETRIEVAL_QUALITY_AUDIT.md)
