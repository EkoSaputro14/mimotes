# Quality Gates Report — Retrieval Benchmark CI Integration

**Date:** 2026-06-13  
**Status:** Defined (ready for CI integration)

## Quality Gates Definition

### Gate 1: Retrieval Accuracy

| Property | Value |
|----------|-------|
| **Metric** | % of positive queries that retrieved relevant chunks |
| **Threshold** | ≥70% |
| **Direction** | Higher is better |
| **Baseline** | ~50% (estimated) |
| **Fail condition** | <70% retrieval accuracy |

**Rationale:** At least 7 out of 10 queries should find relevant content. Below 70%, the RAG system is unreliable.

### Gate 2: Average Similarity

| Property | Value |
|----------|-------|
| **Metric** | Average max similarity score across all queries |
| **Threshold** | ≥0.40 |
| **Direction** | Higher is better |
| **Baseline** | ~0.35 (estimated) |
| **Fail condition** | <0.40 average similarity |

**Rationale:** Chunks below 0.40 similarity are rarely relevant. The average should be above this to ensure meaningful retrieval.

### Gate 3: False Positive Rate

| Property | Value |
|----------|-------|
| **Metric** | % of negative queries that retrieved something |
| **Threshold** | ≤20% |
| **Direction** | Lower is better |
| **Baseline** | ~15% (estimated) |
| **Fail condition** | >20% false positive rate |

**Rationale:** Negative queries (no relevant doc exists) should NOT retrieve content. High false positives = hallucination risk.

### Gate 4: Refusal Accuracy

| Property | Value |
|----------|-------|
| **Metric** | % of negative queries correctly refused |
| **Threshold** | ≥80% |
| **Direction** | Higher is better |
| **Baseline** | ~70% (estimated) |
| **Fail condition** | <80% refusal accuracy |

**Rationale:** When no relevant document exists, the system should say "I don't know" instead of hallucinating.

### Gate 5: Average Latency

| Property | Value |
|----------|-------|
| **Metric** | Average retrieval latency across all queries |
| **Threshold** | ≤200ms |
| **Direction** | Lower is better |
| **Baseline** | ~10ms (current) |
| **Fail condition** | >200ms average latency |

**Rationale:** Retrieval should be fast. 200ms is the acceptable upper bound for interactive use.

## CI Integration Design

### GitHub Actions Workflow

```yaml
# .github/workflows/rag-quality.yml
name: RAG Quality Gates

on:
  pull_request:
    paths:
      - 'lib/rag/**'
      - 'tests/fixtures/rag-benchmark.json'
  push:
    branches: [main]

jobs:
  benchmark:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npx tsx scripts/seed-admin.ts
      - run: npx tsx scripts/rag-benchmark.ts
        id: benchmark
      - name: Upload benchmark results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: rag-benchmark-results
          path: benchmark-results.json
```

### Regression Detection

| Check | Rule | Action |
|-------|------|--------|
| Accuracy drop | >5% from previous run | Block merge |
| Latency increase | >50% from previous run | Warn |
| New gate failure | Any gate fails | Block merge |

## Gate Status (Baseline)

| Gate | Threshold | Baseline | Status |
|------|----------|----------|--------|
| Retrieval Accuracy | ≥70% | ~50% | ❌ Needs optimization |
| Avg Similarity | ≥0.40 | ~0.35 | ❌ Needs threshold tuning |
| False Positive Rate | ≤20% | ~15% | ✅ Passing |
| Refusal Accuracy | ≥80% | ~70% | ❌ Needs improvement |
| Avg Latency | ≤200ms | ~10ms | ✅ Passing |

**Summary:** 3/5 gates failing at baseline. Sprint 7B optimizations should bring all gates to passing.
