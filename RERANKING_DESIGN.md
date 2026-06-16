# Reranking Design — Cross-Encoder Reranker for MimoNotes

**Date:** 2026-06-13  
**Status:** Design Phase  
**Sprint:** 7

## Overview

Add a cross-encoder reranker stage between vector retrieval and context building. The reranker reorders the top-K retrieved chunks by semantic relevance, significantly improving precision.

## Architecture

### Current Pipeline

```
Query → Embedding → Vector Search (top-20) → Filter (threshold) → Dedup → Top-5 → Context
```

### Proposed Pipeline

```
Query → Embedding → Vector Search (top-20) → Filter (threshold) → Reranker → Top-5 → Context
```

### Reranker Placement

```
┌─────────────────────────────────────────────────┐
│ 1. Vector Retrieval (pgvector cosine similarity) │
│    - Fetch top-20 candidates                     │
│    - Fast (~10ms)                                │
├─────────────────────────────────────────────────┤
│ 2. Pre-filter (similarity threshold)             │
│    - Remove chunks below threshold               │
│    - Fast (~1ms)                                 │
├─────────────────────────────────────────────────┤
│ 3. Reranker (cross-encoder)  ← NEW              │
│    - Score each (query, chunk) pair              │
│    - Reorder by relevance                        │
│    - Medium latency (~50ms for 20 chunks)        │
├─────────────────────────────────────────────────┤
│ 4. Context Building (top-K from reranked list)   │
│    - Build context string                        │
│    - Fast (~1ms)                                 │
└─────────────────────────────────────────────────┘
```

## Reranker Options

### Option A: Local Cross-Encoder (Recommended)

**Model:** `cross-encoder/ms-marco-MiniLM-L-6-v2`

| Property | Value |
|----------|-------|
| Size | ~80MB |
| Latency | ~50ms for 20 pairs |
| Quality | Excellent (MS MARCO benchmark) |
| Dependencies | `@xenova/transformers` (ONNX runtime) |
| Offline | Yes (runs locally) |

**Pros:**
- No API cost
- No network latency
- Works offline
- Consistent quality

**Cons:**
- Adds ~80MB to deployment
- Requires ONNX runtime
- Initial model download

### Option B: API-Based Reranker

**Service:** Cohere Rerank, Jina Reranker, or OpenAI

| Property | Value |
|----------|-------|
| Latency | ~200ms (network) |
| Quality | Excellent |
| Cost | ~$0.001 per query |

**Pros:**
- No local model
- Always up-to-date

**Cons:**
- API cost
- Network dependency
- Privacy concern (sends chunks to external API)

### Option C: No Reranker (Current)

- Quality: Baseline
- Latency: 0ms additional
- Cost: $0

## Recommendation: Option A (Local Cross-Encoder)

Best balance of quality, latency, and cost for a self-hosted RAG system.

## Implementation Design

### New Module: `lib/rag/reranker.ts`

```typescript
export interface RerankerOptions {
  enabled: boolean;
  model: string;           // "cross-encoder/ms-marco-MiniLM-L-6-v2"
  batchSize: number;       // Process N pairs at a time
  maxCandidates: number;   // Max chunks to rerank (20)
}

export interface RerankedChunk {
  chunk: SimilarChunk;
  rerankScore: number;     // 0-1 relevance score
}

export async function rerankChunks(
  query: string,
  chunks: SimilarChunk[],
  options?: Partial<RerankerOptions>
): Promise<RerankedChunk[]>;
```

### Integration Point: `lib/rag/chain.ts`

```typescript
// In retrieveChunks():
const { chunks, metrics } = await searchSimilarChunks(...);

// NEW: Rerank if enabled
const reranked = await rerankChunks(question, chunks);
const topChunks = reranked.slice(0, topK).map(r => ({
  ...r.chunk,
  rerankScore: r.rerankScore,
}));
```

### Database Schema Addition

Add `rerank_score` to `SimilarChunk` interface (already has `bm25Score` and `rrfScore`):

```typescript
export interface SimilarChunk {
  // ... existing fields
  rerankScore?: number;  // NEW: cross-encoder relevance score
}
```

## Latency Budget

| Stage | Current | With Reranker | Delta |
|-------|---------|---------------|-------|
| Embedding | ~100ms | ~100ms | 0ms |
| Vector search | ~10ms | ~10ms | 0ms |
| Pre-filter | ~1ms | ~1ms | 0ms |
| **Reranking** | **0ms** | **~50ms** | **+50ms** |
| Context building | ~1ms | ~1ms | 0ms |
| AI generation | ~2000ms | ~2000ms | 0ms |
| **Total** | **~2112ms** | **~2162ms** | **+50ms** |

**Impact:** 2.4% latency increase for potentially 20-30% precision improvement. Excellent trade-off.

## Expected Quality Impact

| Metric | Without Reranker | With Reranker | Improvement |
|--------|-----------------|---------------|-------------|
| Precision@5 | ~70% (API) | ~90% (API) | **+20%** |
| Precision@5 | ~35% (local) | ~50% (local) | **+15%** |
| Answer accuracy | ~88% | ~92% | **+4%** |
| Hallucination rate | ~10% | ~5% | **-50%** |

## Dependencies

```json
{
  "@xenova/transformers": "^2.0.0"
}
```

## Rollout Plan

1. Install `@xenova/transformers`
2. Implement `lib/rag/reranker.ts`
3. Add feature flag `rag_reranker_enabled` (default: false)
4. Integrate into `chain.ts` retrieval flow
5. Test with benchmark queries
6. Enable by default if quality improves
