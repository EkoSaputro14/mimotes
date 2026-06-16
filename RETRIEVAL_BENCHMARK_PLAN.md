# Retrieval Benchmark Plan — Automated RAG Quality Metrics

**Date:** 2026-06-13  
**Status:** Design Phase  
**Sprint:** 7

## Overview

Design an automated benchmark system to measure retrieval quality, track improvements across sprints, and prevent regressions.

## Benchmark Design

### Benchmark Dataset Structure

```typescript
interface BenchmarkQuery {
  id: string;
  query: string;
  expectedDocumentIds: string[];  // Ground truth documents
  expectedChunkIds?: string[];    // Ground truth chunks (optional)
  category: "factual" | "conceptual" | "multi-doc" | "negative";
  difficulty: "easy" | "medium" | "hard";
  language: "id" | "en" | "mixed";
}
```

### Example Benchmark Queries

```typescript
const BENCHMARK_QUERIES: BenchmarkQuery[] = [
  // Factual — single answer in one document
  {
    id: "factual-001",
    query: "Apa itu RAG?",
    expectedDocumentIds: ["doc-ai-guide"],
    category: "factual",
    difficulty: "easy",
    language: "id",
  },
  // Conceptual — requires understanding across chunks
  {
    id: "conceptual-001",
    query: "Bagaimana cara kerja embedding dalam RAG?",
    expectedDocumentIds: ["doc-ai-guide", "doc-technical-spec"],
    category: "conceptual",
    difficulty: "medium",
    language: "id",
  },
  // Multi-document — answer requires combining multiple sources
  {
    id: "multi-doc-001",
    query: "Apa perbedaan antara vector search dan BM25?",
    expectedDocumentIds: ["doc-search-guide", "doc-bm25-paper"],
    category: "multi-doc",
    difficulty: "hard",
    language: "id",
  },
  // Negative — no relevant document exists
  {
    id: "negative-001",
    query: "Bagaimana cara memasak nasi goreng?",
    expectedDocumentIds: [],
    category: "negative",
    difficulty: "easy",
    language: "id",
  },
];
```

## Metrics

### Retrieval Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Precision@K** | Relevant chunks in top-K / K | ≥0.80 |
| **Recall@K** | Relevant chunks in top-K / total relevant | ≥0.70 |
| **MRR** | Mean Reciprocal Rank of first relevant chunk | ≥0.85 |
| **NDCG@5** | Normalized Discounted Cumulative Gain | ≥0.80 |
| **Latency p95** | 95th percentile retrieval time | ≤100ms |

### Answer Quality Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **Answer Accuracy** | Correct answer generated | ≥0.90 |
| **Hallucination Rate** | Answer contains info not in context | ≤0.05 |
| **Source Attribution** | Cited sources are correct | ≥0.90 |
| **"I Don't Know" Rate** | Correct refusal when no context | ≥0.95 |

### Negative Test Metrics

| Metric | Definition | Target |
|--------|-----------|--------|
| **False Positive Rate** | Answer given when no relevant doc exists | ≤0.05 |
| **Refusal Accuracy** | Correctly says "I don't know" | ≥0.95 |

## Benchmark Runner Design

### New Module: `scripts/rag-benchmark.ts`

```typescript
interface BenchmarkResult {
  queryId: string;
  query: string;
  retrievedChunkIds: string[];
  retrievedDocIds: string[];
  precisionAt5: number;
  recallAt5: number;
  answer: string;
  answerAccuracy: boolean;
  hallucinationDetected: boolean;
  latencyMs: number;
}

interface BenchmarkSummary {
  totalQueries: number;
  avgPrecisionAt5: number;
  avgRecallAt5: number;
  avgMRR: number;
  hallucinationRate: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  categoryBreakdown: Record<string, { precision: number; recall: number }>;
  difficultyBreakdown: Record<string, { precision: number; recall: number }>;
}
```

### Usage

```bash
# Run benchmark
npx tsx scripts/rag-benchmark.ts

# Output
# ═══════════════════════════════════════════
# RAG Benchmark Results
# ═══════════════════════════════════════════
# Total queries: 20
# Precision@5:   0.82 (target: 0.80) ✅
# Recall@5:      0.71 (target: 0.70) ✅
# MRR:           0.87 (target: 0.85) ✅
# Hallucination: 0.04 (target: ≤0.05) ✅
# Latency p95:   89ms (target: ≤100ms) ✅
# ═══════════════════════════════════════════
# Category Breakdown:
#   factual:     P=0.92 R=0.88
#   conceptual:  P=0.78 R=0.65
#   multi-doc:   P=0.70 R=0.55
#   negative:    FP=0.02
# ═══════════════════════════════════════════
```

## CI Integration

```yaml
# .github/workflows/rag-benchmark.yml
- name: Run RAG benchmark
  run: npx tsx scripts/rag-benchmark.ts
  
- name: Check quality gates
  run: |
    # Fail if precision drops below threshold
    npx tsx scripts/rag-benchmark.ts --check-gates
```

## Regression Detection

| Check | Rule | Action |
|-------|------|--------|
| Precision@5 drop | >5% from baseline | Block merge |
| Hallucination increase | >2% from baseline | Block merge |
| Latency increase | >50% from baseline | Warn |

## Benchmark Dataset Management

- **Location:** `tests/fixtures/rag-benchmark.json`
- **Version control:** Git-tracked
- **Updates:** Add new queries as documents are added
- **Minimum size:** 20 queries (10 factual, 5 conceptual, 3 multi-doc, 2 negative)
