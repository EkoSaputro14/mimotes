# PHASE 4 — RERANKER IMPLEMENTATION PLAN

**Date:** June 8, 2026  
**Status:** 🔵 PLANNING (do not implement yet)  
**Baseline:** Precision@5 = 32.4% | Recall@5 = 33.2% | MRR = 54%

---

## A. Current Pipeline Audit

### Retrieval Flow

```
User Query
  │
  ├─→ generateEmbedding(query)              ~50ms
  │     └─→ OpenAI-compatible API embedding
  │
  ├─→ isHybridSearchEnabled()               ~0ms (cached 30s)
  │
  ├─→ IF hybrid:
  │     hybridSearch()                       ~1ms
  │       └─→ SQL: hybrid_search() function
  │           ├─→ pgvector cosine distance   (vector score)
  │           ├─→ pg_trgm similarity         (BM25 score)
  │           └─→ RRF fusion (60% vector + 40% BM25)
  │       └─→ Returns top 20 candidates
  │
  ├─→ ELSE vector-only:
  │     searchSimilarChunks()                ~1ms
  │       └─→ SQL: ORDER BY embedding <=> query LIMIT N
  │       └─→ Dedup + threshold filter
  │
  └─→ buildMultimodalContext()              ~0ms
        └─→ Formats top chunks into prompt context
```

### Current Metrics (from DB)

| Metric | Value |
|--------|-------|
| Total retrieval logs | 106 |
| Search mode | 100% hybrid |
| Avg search latency | 1ms |
| Avg total latency | 1ms (embed excluded) |
| Reranker latency | **0ms** (not implemented) |
| Reranked results count | **0** (hardcoded) |
| Total chunks | 5 (2 text, 3 image) |
| Eval results | 102 individual + 2 aggregate |

### Identified Weaknesses

1. **RRF fusion is rank-only** — doesn't consider semantic quality of chunk content, only position
2. **No cross-encoder verification** — vector similarity ≠ semantic relevance
3. **Image chunks hurt precision** — OCR fallback produces low-quality embeddings (filename-based)
4. **Small corpus** — 5 chunks means every query returns nearly everything
5. **No query-chunk interaction scoring** — embedding similarity is bi-encoder only

---

## B. Reranker Options Comparison

### Option 1: Cohere Rerank (API)

```
Pros:
  + Zero infrastructure (API call)
  + Production-grade quality (trained on MS MARCO, etc.)
  + Supports multilingual (important for Indonesian)
  + Simple integration (1 HTTP call)
  + Free tier: 1000 calls/month
  
Cons:
  - Per-request cost: ~$1/1000 requests after free tier
  - External dependency (network latency)
  - Data leaves server (privacy concern for SaaS)
  - Rate limits on free tier

Latency: +100-300ms (network)
Model: Cohere rerank-english-v3.0 / multilingual-v3.0
Pricing: $1/1000 requests (Production)
```

### Option 2: Jina Reranker (API)

```
Pros:
  + Fast inference (~80ms)
  + Competitive pricing
  + Multilingual support
  + Simple REST API
  
Cons:
  - Per-request cost
  - External dependency
  - Data leaves server
  - Newer, less battle-tested than Cohere

Latency: +80-200ms (network)
Model: jina-reranker-v2-base-multilingual
Pricing: $0.02/1000 tokens (approx $0.5/1000 requests)
```

### Option 3: BGE Reranker (Local)

```
Pros:
  + Free per-request (runs locally)
  + Full privacy (data stays on server)
  + No rate limits
  + Excellent quality (BAAI/bge-reranker-v2-m3)
  + Multilingual support
  
Cons:
  - Requires Python sidecar service (~500MB model)
  - CPU inference: +200-500ms
  - GPU inference: +50-100ms (but no GPU available)
  - Adds Docker container (memory: ~1GB)
  - Cold start: ~5s model loading

Latency: +200-500ms (CPU), +50-100ms (GPU)
Model: BAAI/bge-reranker-v2-m3 (568M params)
Memory: ~1GB RAM
```

### Option 4: sentence-transformers CrossEncoder (Local)

```
Pros:
  + Same as BGE (it IS a cross-encoder)
  + Well-documented, large community
  + Multiple model sizes available
  
Cons:
  - Same infra requirements as BGE
  - Slightly lower quality than BGE v2
  - Larger model options are slower

Latency: +200-800ms depending on model
Model: cross-encoder/ms-marco-MiniLM-L-6-v2 (80MB)
```

### Option 5: Qdrant Built-in Reranking

```
Pros:
  + Qdrant already running in Docker
  + Native integration
  + No additional containers
  
Cons:
  - Qdrant reranking is limited (only RRF/DBSF fusion)
  - Not a true cross-encoder reranker
  - Same quality as current RRF approach
  - No semantic verification

Latency: +0ms (already computed)
Quality: Same as current (no improvement)
```

---

## C. Recommendation

### Best Option: **BGE Reranker (Local) + API Fallback**

**Rationale for self-hosted SaaS:**

| Criterion | Weight | BGE Local | Cohere | Jina | CrossEncoder |
|-----------|--------|-----------|--------|------|-------------|
| Quality | 30% | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Privacy | 25% | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Cost | 20% | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Latency | 15% | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Infra | 10% | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

**Why BGE Local wins:**
1. **Privacy-first** — SaaS customers expect data to stay on server
2. **No per-request cost** — scales without billing impact
3. **Best quality** — BGE v2-m3 is state-of-the-art for multilingual reranking
4. **One-time infra cost** — single Python sidecar container, ~1GB RAM

**API fallback for:**
- Environments without enough RAM
- Quick testing without Python sidecar
- Graceful degradation if sidecar is down

---

## D. Architecture Design

### New Pipeline

```
User Query
  │
  ├─→ generateEmbedding(query)                    ~50ms
  │
  ├─→ Hybrid/Vector Retrieval                     ~1ms
  │     └─→ Top 20 candidates (was: top 5)
  │
  ├─→ ┌─────────────────────────────┐
  │   │  RERANKER LAYER (NEW)       │
  │   │                             │
  │   │  Feature flag:              │
  │   │  rag_reranker_enabled       │
  │   │                             │
  │   │  Mode: "local" | "api" | "off"
  │   │                             │
  │   │  local → Python sidecar     │  ~200-400ms
  │   │  api   → Cohere/Jina API    │  ~100-300ms
  │   │  off   → skip (current)     │  0ms
  │   │                             │
  │   │  Input: 20 candidates       │
  │   │  Output: top 5 reranked     │
  │   └─────────────────────────────┘
  │
  └─→ buildMultimodalContext(top 5)               ~0ms
```

### Docker Architecture Addition

```yaml
# New service in docker-compose.yml
services:
  reranker:
    build:
      context: ./reranker
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - MODEL_NAME=BAAI/bge-reranker-v2-m3
      - MAX_LENGTH=512
      - BATCH_SIZE=32
    deploy:
      resources:
        limits:
          memory: 1G
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### Python Sidecar (FastAPI)

```python
# reranker/main.py
from fastapi import FastAPI
from sentence_transformers import CrossEncoder
import os

app = FastAPI()
model = CrossEncoder(os.getenv("MODEL_NAME", "BAAI/bge-reranker-v2-m3"))

@app.get("/health")
async def health():
    return {"status": "ok", "model": model_name}

@app.post("/rerank")
async def rerank(request: RerankRequest):
    """
    Input:  { query: str, documents: [{id, content, ...}], top_k: int }
    Output: { results: [{id, content, score, ...}], latency_ms: int }
    """
    pairs = [(request.query, doc.content) for doc in request.documents]
    scores = model.predict(pairs)
    
    # Sort by rerank score descending
    ranked = sorted(zip(request.documents, scores), key=lambda x: -x[1])
    
    return {
        "results": [
            {**doc.dict(), "rerank_score": float(score)}
            for doc, score in ranked[:request.top_k]
        ],
        "latency_ms": elapsed,
    }
```

---

## E. Database Changes

### New Columns (retrieval_logs)

```sql
-- Already exists from Phase 2, just update defaults
ALTER TABLE retrieval_logs
  ALTER COLUMN reranked_results_count SET DEFAULT 0,
  ALTER COLUMN reranker_latency_ms SET DEFAULT 0;

-- No new columns needed — existing schema already has:
-- reranked_results_count INTEGER
-- reranker_latency_ms INTEGER
```

### New Settings

```sql
-- Feature flag + configuration
INSERT INTO settings (key, value) VALUES
  ('rag_reranker_enabled', 'false'),           -- Master toggle
  ('rag_reranker_mode', 'off'),                -- 'local' | 'api' | 'off'
  ('rag_reranker_provider', 'bge'),            -- 'bge' | 'cohere' | 'jina'
  ('rag_reranker_api_key', ''),                -- API key for cloud providers
  ('rag_reranker_api_url', 'http://reranker:8080'),  -- Sidecar URL
  ('rag_reranker_model', 'BAAI/bge-reranker-v2-m3'), -- Model name
  ('rag_reranker_top_k', '5'),                 -- Final top-K after reranking
  ('rag_reranker_candidates', '20');           -- Candidates to fetch before reranking
```

### eval_results Enhancement

```sql
-- Add reranker comparison columns
ALTER TABLE eval_results
  ADD COLUMN reranked_chunk_ids JSONB,
  ADD COLUMN reranker_precision_at_5 DOUBLE PRECISION,
  ADD COLUMN reranker_recall_at_5 DOUBLE PRECISION,
  ADD COLUMN reranker_mrr DOUBLE PRECISION;
```

---

## F. API Changes

### Search API (`/api/knowledge/search`)

**Before:**
```json
{
  "query": "...",
  "topK": 5,
  "threshold": 0.30
}
```

**After:**
```json
{
  "query": "...",
  "topK": 5,           // Final results after reranking
  "threshold": 0.30,
  "rerank": true       // Optional override (default: use feature flag)
}
```

**Response addition:**
```json
{
  "results": [...],
  "metrics": {
    "embedTime": 50,
    "searchTime": 1,
    "rerankerTime": 250,     // NEW
    "rerankerMode": "local",  // NEW
    "totalTime": 301
  }
}
```

### RAG Chain Changes

```typescript
// lib/rag/chain.ts - retrieveChunks()
async function retrieveChunks(question, topK, workspaceId, minSimilarity) {
  const queryEmbedding = await generateEmbedding(question);
  const useHybrid = await isHybridSearchEnabled();
  const useReranker = await isRerankerEnabled();  // NEW

  // Fetch MORE candidates if reranker is enabled
  const fetchK = useReranker ? 20 : topK;

  let result;
  if (useHybrid) {
    result = await hybridSearch({ queryText: question, queryEmbedding, workspaceId, topK: fetchK });
  } else {
    result = await searchSimilarChunks(queryEmbedding, fetchK, workspaceId, minSimilarity);
  }

  // Apply reranker if enabled
  if (useReranker && result.chunks.length > topK) {
    result = await rerankChunks(question, result.chunks, topK);  // NEW
  }

  return result;
}
```

---

## G. Latency Impact Estimate

### Current Pipeline

| Step | Latency |
|------|---------|
| Embedding | ~50ms |
| Hybrid search | ~1ms |
| Context build | ~0ms |
| **Total** | **~51ms** |

### With BGE Reranker (Local, CPU)

| Step | Latency |
|------|---------|
| Embedding | ~50ms |
| Hybrid search (20 candidates) | ~1ms |
| **Reranker** | **~250ms** |
| Context build | ~0ms |
| **Total** | **~301ms** |
| **Overhead** | **+250ms (+490%)** |

### With API Reranker (Cohere)

| Step | Latency |
|------|---------|
| Embedding | ~50ms |
| Hybrid search | ~1ms |
| **Reranker (API)** | **~150ms** |
| Context build | ~0ms |
| **Total** | **~201ms** |
| **Overhead** | **+150ms (+294%)** |

### Acceptable Threshold

| Metric | Before | After | Threshold |
|--------|--------|-------|-----------|
| P95 latency | ~100ms | ~500ms | < 2000ms ✅ |
| User-perceived | instant | ~0.3s | < 1s ✅ |
| Cost per query | $0 | $0 (local) | — |

---

## H. Expected Precision@5 Improvement

### Industry Benchmarks

| Reranker | Typical Improvement |
|----------|-------------------|
| Cross-encoder (base) | +5-15% Precision@5 |
| BGE v2-m3 | +10-20% Precision@5 |
| Cohere rerank | +10-18% Precision@5 |
| Jina reranker | +8-15% Precision@5 |

### Projected Improvement for Mimotes

Given current baseline (P@5=32.4%, corpus=5 chunks):

| Scenario | P@5 | R@5 | MRR |
|----------|-----|-----|-----|
| Current (no reranker) | 32.4% | 33.2% | 54.0% |
| With BGE reranker (conservative) | **42-48%** | **43-50%** | **65-72%** |
| With BGE reranker (optimistic) | **48-55%** | **50-58%** | **72-80%** |

**Note:** Improvement will be more dramatic as corpus grows. With 5 chunks, the reranker has little to reorder. At 100+ chunks, the reranker becomes critical for quality.

---

## I. Migration Strategy

### Phase 4.1: Python Sidecar (Day 1)
1. Create `reranker/` directory with FastAPI service
2. Write `Dockerfile` (python:3.11-slim + sentence-transformers)
3. Add `reranker` service to `docker-compose.yml`
4. Health check endpoint
5. Basic `/rerank` endpoint
6. Test with curl

### Phase 4.2: TypeScript Integration (Day 1-2)
1. Create `lib/rag/reranker.ts` — RerankerClient class
2. Add feature flags to settings
3. Update `retrieveChunks()` in `chain.ts`
4. Update `/api/knowledge/search` route
5. Add `rerankerTime` to metrics
6. Update `retrieval_logs` INSERT to include actual values

### Phase 4.3: Evaluation (Day 2)
1. Update `run-rag-eval.ts` to compare with/without reranker
2. Run baseline (no reranker) — record numbers
3. Run with reranker — record numbers
4. Compute delta (P@5, R@5, MRR)
5. Generate comparison report

### Phase 4.4: API Fallback (Day 2-3)
1. Add Cohere API support as alternative
2. Add Jina API support as alternative
3. Fallback chain: local → API → skip
4. Graceful degradation if sidecar is down

### Phase 4.5: Dashboard (Day 3)
1. Add reranker metrics to retrieval analytics
2. Show reranker vs non-reranker comparison
3. Latency impact visualization

### Phase 4.6: Production Hardening (Day 3)
1. Cache reranker model in Docker layer
2. Add request batching for concurrent queries
3. Add circuit breaker (skip reranker if >3 failures)
4. Monitor memory usage
5. Load test with concurrent requests

---

## J. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `reranker/Dockerfile` | Python sidecar image |
| `reranker/main.py` | FastAPI reranker service |
| `reranker/requirements.txt` | Python deps |
| `reranker/healthcheck.py` | Health check script |
| `lib/rag/reranker.ts` | TypeScript reranker client |
| `scripts/reranker-test.ts` | Test script |

### Modified Files

| File | Change |
|------|--------|
| `docker-compose.yml` | Add `reranker` service |
| `lib/rag/vectorstore.ts` | No change (returns top 20) |
| `lib/rag/chain.ts` | Add reranker call in `retrieveChunks()` |
| `app/api/knowledge/search/route.ts` | Add `rerank` param, `rerankerTime` metric |
| `lib/settings.ts` | Add reranker setting keys |
| `scripts/run-rag-eval.ts` | Add reranker comparison mode |
| `app/dashboard/page.tsx` | Add reranker metrics widget |

---

## K. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sidecar OOM | Reranker crashes | Memory limit 1GB, circuit breaker |
| Cold start delay | First query slow | Pre-load model in entrypoint |
| Model download | Slow build | Cache in Docker layer |
| CPU bottleneck | High latency | Batch size tuning, async processing |
| Sidecar down | Search fails | Fallback to vector-only (current behavior) |
| Privacy concern | Customer trust | Local model = no data leaves server |

---

## L. Decision Required

Before implementation, user must decide:

1. **Reranker mode**: Local (BGE) vs API (Cohere/Jina) vs Both with fallback?
2. **Infrastructure**: Add Docker container (~1GB RAM) vs keep lightweight?
3. **Budget**: Willing to pay per-request for API reranker?
4. **Priority**: Implement now vs wait for larger corpus?

---

*This plan is for audit/planning purposes only. Do not implement until approved.*
