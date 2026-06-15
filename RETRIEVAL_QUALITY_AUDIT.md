# Retrieval Quality Audit — Sprint 7 Preparation

**Date:** 2026-06-13  
**Scope:** Full retrieval pipeline (vectorstore → chain → context building)  
**Goal:** Identify highest-ROI retrieval improvements

## Current Retrieval Pipeline Analysis

### Pipeline Flow

```
User Question
    │
    ▼
generateEmbedding(question) → 1536-dim vector
    │
    ▼
retrieveChunks(question, topK=5, workspaceId, minSimilarity=0.30)
    │
    ├── isHybridSearchEnabled()?
    │   ├── YES → hybridSearch() [vector + BM25 + RRF]
    │   └── NO  → searchSimilarChunks() [vector only]
    │
    ▼
buildMultimodalContext(chunks, maxTokens=3000)
    │
    ▼
System Prompt + Context → AI Model (temp=0.3)
    │
    ▼
Response with Sources
```

### Current Parameters

| Parameter | Current Value | Assessment |
|-----------|--------------|------------|
| `topK` | 5 | Good — reasonable for focused answers |
| `minSimilarity` | 0.30 | ⚠️ Too low — admits irrelevant chunks |
| `maxContextTokens` | 3000 | Good — fits most models |
| `temperature` | 0.3 | ✅ Good (was 0.7, fixed in Sprint 5A) |
| `fetchLimit` | topK × 3 = 15 | ⚠️ May be too low for deduplication |
| `vectorWeight` (hybrid) | 0.6 | Untested — needs tuning |
| `bm25Weight` (hybrid) | 0.4 | Untested — needs tuning |
| `DEFAULT_MIN_SIMILARITY` | 0.30 | ⚠️ Global default too permissive |

## Issue 1: Similarity Threshold Too Low (HIGH IMPACT)

### Problem

The 0.30 threshold admits chunks with low semantic similarity. With API embeddings, 0.30 means "barely related." With local embeddings (feature hashing), 0.30 means "some overlapping words."

### Evidence

| Similarity Score | Meaning (API embeddings) | Meaning (Local) |
|-----------------|-------------------------|-----------------|
| 0.90+ | Near-identical content | Same words |
| 0.70-0.90 | Highly relevant | Strong overlap |
| 0.50-0.70 | Somewhat relevant | Moderate overlap |
| 0.30-0.50 | Loosely related | Weak overlap |
| <0.30 | Unrelated | Unrelated |

### Recommendation

- **API embeddings:** Raise threshold to **0.50**
- **Local embeddings:** Raise threshold to **0.40** (lower because feature hashing has lower baseline similarity)
- **Dynamic:** Detect embedding source and adjust threshold

**Expected Impact:** +15-20% precision@5 (fewer irrelevant chunks in context)

## Issue 2: No Reranking (HIGH IMPACT)

### Problem

Retrieval uses cosine similarity as the sole relevance signal. Cosine similarity measures vector distance, not semantic relevance. A chunk about "Python the snake" may rank higher than "Python programming" for the query "Python tutorial" if the word frequencies happen to align.

### Current Ranking

```
Query: "How to install Python?"
Retrieved (by cosine similarity):
1. "Python is a genus of constricting snakes..." (sim=0.72)
2. "To install Python, download from python.org..." (sim=0.68)
3. "Pythonidae are a family of nonvenomous snakes..." (sim=0.65)
```

### With Reranking

```
Query: "How to install Python?"
Reranked (by cross-encoder relevance):
1. "To install Python, download from python.org..." (rerank=0.95)
2. "Python is a genus of constricting snakes..." (rerank=0.12)
3. "Pythonidae are a family of nonvenomous snakes..." (rerank=0.08)
```

### Recommendation

Add cross-encoder reranker after vector retrieval:
- **Model:** `cross-encoder/ms-marco-MiniLM-L-6-v2` (80MB, fast)
- **Stage:** After vector retrieval (top-20), before context building (top-5)
- **Latency:** ~50ms for 20 chunks

**Expected Impact:** +20-30% precision@5

## Issue 3: Hybrid Search Weights Untested (MEDIUM IMPACT)

### Problem

Hybrid search uses `vectorWeight=0.6, bm25Weight=0.4` but these weights were never tuned. The optimal ratio depends on:
- Embedding quality (API vs local)
- Query type (keyword vs semantic)
- Document type (technical vs narrative)

### Recommendation

- Test combinations: (0.8/0.2), (0.6/0.4), (0.5/0.5), (0.4/0.6)
- Measure precision@5 on benchmark queries
- Consider query-adaptive weights (keyword queries → higher BM25)

**Expected Impact:** +5-10% precision@5

## Issue 4: Context Packing Strategy (MEDIUM IMPACT)

### Problem

`buildMultimodalContext()` packs chunks sequentially until token budget is exhausted. This means:
- First chunks get priority (positional bias)
- Relevant chunks may be excluded if they appear late in the list
- No deduplication of similar content across chunks

### Recommendation

- **Relevance-based ordering:** Already done (chunks sorted by similarity)
- **Deduplication:** Add content-level dedup before packing
- **Token-aware splitting:** Ensure chunks don't exceed individual token limits

**Expected Impact:** +5-10% answer quality

## Issue 5: No Query Preprocessing (LOW-MEDIUM IMPACT)

### Problem

Raw user queries are embedded directly. Issues:
- Typos: "pythn install" → poor embedding
- Abbreviations: "ML" vs "machine learning" → different vectors
- Language mixing: "cara install Python" (Indonesian) vs "how to install Python"

### Recommendation

- Query expansion: add synonyms
- Spell correction (basic)
- Language detection + translation for cross-lingual retrieval

**Expected Impact:** +5-10% recall (more relevant chunks found)

## ROI Ranking

| Improvement | Effort | Impact | ROI |
|-------------|--------|--------|-----|
| **Raise similarity threshold** | 1h | +15-20% precision | ★★★★★ |
| **Add cross-encoder reranker** | 4h | +20-30% precision | ★★★★★ |
| **Tune hybrid search weights** | 2h | +5-10% precision | ★★★★☆ |
| **Improve context packing** | 3h | +5-10% quality | ★★★☆☆ |
| **Query preprocessing** | 4h | +5-10% recall | ★★★☆☆ |
| **Conversation history** | 4h | +multi-turn | ★★☆☆☆ |

## Recommendation

**Sprint 7 focus (highest ROI):**
1. Raise similarity threshold (1h) ← quick win
2. Add cross-encoder reranker (4h) ← biggest impact
3. Tune hybrid search weights (2h) ← moderate impact

**Sprint 8 focus (lower ROI):**
4. Improve context packing
5. Query preprocessing
6. Conversation history
