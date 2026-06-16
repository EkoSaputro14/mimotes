# ADR-RETRIEVAL-HARDENING: Retrieval Hardening & Confidence-Based Refusal

> **Status**: Accepted  
> **Date**: 2026-06-13  
> **Sprint**: 7C — Retrieval Hardening  
> **Decision Makers**: Eko Saputro, Hermes Agent

---

## Context

MimoNotes RAG pipeline baseline (Sprint 7B measurement):
- **Retrieval latency**: 325ms (sequential scan, no HNSW index)
- **False positive rate**: 100% (negative queries always return results)
- **Refusal accuracy**: 0% (system never refuses to answer)
- **Similarity threshold**: 0.30 (too low for feature-hashing embeddings)
- **Context attribution**: Basic (document title only, no confidence indicators)
- **Hybrid search threshold**: 0 (zero filtering on hybrid results)

Feature-hashing embeddings produce similarity range 0.15–0.50. Queries like "Recipe for chocolate cake" score 0.37 against PostgreSQL documentation, well above the 0.30 threshold. The system always produces an answer, even when the context is irrelevant, leading to hallucinated responses.

## Decision

### 1. HNSW Index on `document_chunks.embedding`

**Choice**: Create HNSW index with `m=16, ef_construction=64`

**Rationale**: 
- Sequential scan on 107K chunks: ~940ms
- HNSW index scan: ~5ms (188× faster)
- Zero application code changes required
- 521MB index size acceptable for 107K vectors

**Trade-offs**:
- Index build requires ~125s and needs `shm_size: 256mb` in Docker
- HNSW is approximate (95–99% recall vs 100% for exact search)
- `ef_construction=64` is a balance — higher values improve recall but increase build time

### 2. Adaptive Similarity Threshold

**Choice**: Keep default at 0.30 but enable per-query tuning via `minSimilarity` parameter

**Rationale**:
- Feature-hashing embeddings have a narrow useful range (0.15–0.50)
- Threshold 0.30 correctly refuses "Machine learning neural networks" (0.22) and "Latest football scores" (0.25)
- But fails on "Recipe for chocolate cake" (0.37) and "Weather forecast Jakarta" (0.31)
- Raising threshold to 0.45 would refuse legitimate low-similarity queries too

**Trade-off**: Threshold alone cannot solve the false-positive problem with feature hashing. It reduces FPR from 100% to ~60% but cannot reach <40% without better embeddings or a reranker.

### 3. Confidence-Based Refusal Mechanism

**Choice**: 4-tier confidence classification (high/medium/low/refuse) with threshold at 0.30

**Rationale**:
- `classifyConfidence(maxSimilarity)` → "high" (≥0.55), "medium" (0.40–0.54), "low" (0.30–0.39), "refuse" (<0.30)
- `shouldRefuse(chunks)` checks max similarity across all retrieved chunks
- `getConfidencePrefix(level)` adds appropriate caveat to response
- Refusal saves LLM tokens (no API call when refusing)

**Trade-off**: With feature hashing, "high" confidence almost never triggers (max observed similarity: 0.49). Most answers fall in "medium" tier with caveat prefix.

### 4. Hybrid Search Threshold Filtering

**Choice**: Pass `minSimilarity` to `hybridSearch()` and filter results before returning

**Rationale**:
- Previously `hybridSearch()` set `threshold: 0` — every result passed
- Now filters by `minSimilarity` with deduplication
- Metrics track `discardedCount` for observability

**Trade-off**: With BM25 returning 0 matches (corpus is homogeneous PostgreSQL PDFs), hybrid search behaves like vector-only search. BM25 benefit requires diverse corpus.

### 5. Source Attribution in Context Builder

**Choice**: New `buildAttributedContext()` function with confidence indicators and structured citations

**Rationale**:
- Replaces `buildMultimodalContext()` for text responses
- Adds `[Relevansi: X% - Tinggi/Sedang/Rendah]` per chunk
- Returns structured `Citations[]` array for API response
- Content preview (200 chars) per citation

**Trade-off**: Slightly larger context strings (~10% more tokens for headers). Acceptable given the improved transparency.

## Consequences

### Positive
- Retrieval latency: **325ms → 5ms** (65× improvement)
- HNSW index: **940ms → 5ms** for vector search
- Confidence classification: 4-tier system with refusal
- Source attribution: Rich context with relevance indicators
- Hybrid search: Now respects threshold (was hardcoded to 0)

### Negative
- False positive rate still high (~60%) with feature hashing
- "High" confidence rarely triggers (max similarity ~0.49)
- BM25 returns 0 results (homogeneous corpus)
- Refusal accuracy improved but limited by embedding quality

### Risks
- Feature hashing ceiling: Cannot achieve <40% FPR without neural embeddings
- Corpus imbalance: 93% PostgreSQL PDFs dominate embedding space
- BM25 effectiveness: Requires diverse content types to be useful

## Follow-up
- **Phase 2**: Neural embedding provider (OpenAI/local model) to break feature hashing ceiling
- **Phase 3**: Cross-encoder reranker for precision improvement
- **Phase 4**: Corpus diversification (add non-PostgreSQL documents)
