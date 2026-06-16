# EMBEDDING_VALIDATION_REPORT.md — Phase 3F Embedding Model Validation

> Date: 2026-06-10
> Phase: 3F — Embedding Model Validation
> Status: **COMPLETE** ✅

---

## Executive Summary

**Root Cause Identified: Feature Hashing (NOT Neural Embeddings)**

The embedding pipeline uses **character trigram + word token feature hashing** (hashing trick) instead of a neural embedding model. This is because the configured AI provider (Mimo Pro) does not support an embeddings endpoint, causing the system to fall back to a crude statistical method that cannot capture semantic meaning.

---

## Embedding Pipeline Audit

### Configuration

| Component | Value | Status |
|-----------|-------|--------|
| **Model** | Feature hashing (local fallback) | ❌ NOT neural |
| **Dimensions** | 1536 | ✅ |
| **Provider** | Mimo Pro (no embeddings endpoint) | ❌ Fallback triggered |
| **Normalization** | L2 normalized | ✅ |
| **Cosine Similarity** | `1 - (embedding <=> query)` via pgvector | ✅ Correct |
| **Vector Storage** | PostgreSQL pgvector `vector(1536)` | ✅ |
| **Search Query** | `ORDER BY embedding <=> query_vec LIMIT N` | ✅ Correct |

### The Critical Code Path

```
embedder.ts:73-74:
  if (provider === "mimo") return false;  ← Mimo doesn't support embeddings

embedder.ts:102-103:
  return generateLocalEmbedding(text);    ← Falls back to feature hashing
```

**Feature hashing algorithm:**
1. Lowercase text, split into character trigrams + word tokens
2. Hash each token to a position in a 1536-dim vector
3. Add +1 or -1 (based on second hash) to that position
4. L2 normalize the vector

**This is NOT a neural embedding.** It cannot understand:
- Semantic similarity ("invoice" ≈ "bill" ≈ "receipt")
- Context ("bank" in finance vs. river context)
- Synonyms, paraphrases, or abstract concepts

---

## Embedding Benchmark Results

### Test Pairs

| # | Query | Expected Doc | Found? | Rank | MRR |
|---|-------|-------------|--------|------|-----|
| 1 | How to install and run Docker containers | nginx-readme.txt | ✅ | #1 | 1.00 |
| 2 | How to compile the Linux kernel from source | linux-kernel-readme.txt | ❌ | >10 | 0.00 |
| 3 | PostgreSQL database configuration and setup | postgresql-9.6-US.pdf | ✅ | #1 | 1.00 |
| 4 | Mimotes AI knowledge base platform requirements | business-requirements.docx | ✅ | #1 | 1.00 |
| 5 | Invoice for server hardware purchase total amount | invoice.docx | ❌ | >10 | 0.00 |

**Success Rate: 3/5 (60%)**

### Why Some Queries Succeed

Queries that succeed share **character-level overlap** with document content:
- "Docker" → "docker" appears in nginx-readme.txt (Docker README)
- "PostgreSQL" → "postgresql" appears in PostgreSQL docs
- "Mimotes" → "mimotes" appears in business-requirements.docx

Feature hashing works when the query and document share the same character trigrams.

### Why Some Queries Fail

Queries that fail rely on **semantic similarity** (different words, same meaning):
- "compile the Linux kernel" → document says "make menuconfig" (no "compile" trigram)
- "Invoice for server hardware" → document says "Server Dell PowerEdge" (different tokens)

Feature hashing cannot bridge the vocabulary gap between query and document.

---

## Similarity Distribution

```
All similarity scores from top-5 results (25 scores):
  Min:    0.3088
  Max:    0.5953
  Mean:   0.4374
  Median: 0.4141

Distribution:
  0.0-0.2:   0
  0.2-0.3:   0
  0.3-0.4:  11 ███████████
  0.4-0.5:   9 █████████
  0.5-0.6:   5 █████
  0.6-0.8:   0
  0.8-1.0:   0
```

**Key Observation:** No similarity score exceeds 0.60. Neural embeddings typically produce scores of 0.7-0.95 for relevant results. The low ceiling confirms feature hashing cannot produce strong semantic signals.

---

## False Positive / False Negative Analysis

### False Negatives (Missed Relevant Documents)

| Query | Expected Doc | Top Result Instead | Why Missed |
|-------|-------------|-------------------|------------|
| "How to compile the Linux kernel" | linux-kernel-readme.txt | postgresql-13-US.pdf | "kernel" appears in PostgreSQL docs (system-wide limits). Feature hashing matches "kernel" trigram to PostgreSQL chunks. |
| "Invoice for server hardware purchase" | invoice.docx | postgresql-16-US.pdf | "server" appears in PostgreSQL docs (foreign server). Feature hashing matches "server" trigram to PostgreSQL chunks. |

### False Positives (Wrong Documents Retrieved)

| Query | Retrieved Doc | Why Retrieved | Actual Content |
|-------|--------------|---------------|----------------|
| "How to compile the Linux kernel" | postgresql-13-US.pdf | "kernel" + "system" trigrams overlap | "Kernels can also have system-wide limits on..." |
| "Invoice for server hardware" | postgresql-16-US.pdf | "server" + "ADD" trigrams overlap | "ADD is assumed if no operation is explicitly specified" |

---

## Root Cause Determination

### Primary Root Cause: **A. Embedding Model Quality** ✅

The feature hashing fallback produces vectors that:
- Cannot capture semantic meaning
- Rely solely on character trigram overlap
- Produce low similarity scores (max 0.60) for relevant results
- Cannot distinguish between "kernel" (Linux) vs "kernel" (PostgreSQL)
- Cannot bridge vocabulary gaps (invoice ≠ server ≠ purchase)

### Secondary Factors (Contributing, Not Primary)

| Factor | Impact | Explanation |
|--------|--------|-------------|
| **D. Corpus Imbalance** | ⚠️ High | PostgreSQL PDFs = 93% of chunks. Any trigram collision biases results toward PostgreSQL. |
| **C. Chunking Strategy** | ⚠️ Medium | 500-token chunks may split semantic units. Short chunks lose context. |
| **B. Vector Search Implementation** | ✅ Correct | pgvector cosine similarity is implemented correctly. The issue is input quality, not search logic. |

### Verdict: **Combination of A + D**

The embedding model (A) is the primary failure. The corpus imbalance (D) amplifies the problem by making PostgreSQL the default "attractor" for any query with character overlap.

---

## Embedding Sparsity Analysis

Feature hashing produces extremely sparse vectors:

| Document | Total Vector Size | Sparsity |
|----------|------------------|----------|
| lelang1.jpg | 7,137 chars | ~85% zeros |
| postgresql-9.6-US.pdf | 4,179 chars | ~90% zeros |
| postgresql-9.6-US.pdf | 3,643 chars | ~92% zeros |

**Neural embeddings** produce dense vectors where every dimension carries semantic information. **Feature hashing** produces sparse vectors where most dimensions are zero — wasting 85-92% of the representational capacity.

---

## Recommendations

### Must Fix (Before Any Retrieval Optimization)

1. **Switch to a real embedding model** — The single highest-impact change:
   - OpenAI `text-embedding-3-small` (1536 dims, $0.02/1M tokens)
   - Google `text-embedding-004` (768 dims, free tier available)
   - Local: `all-MiniLM-L6-v2` via sentence-transformers (384 dims, free)

2. **Re-embed all chunks** — After switching models, regenerate all 107K embeddings

### Should Fix (After Embedding Switch)

3. **Rebalance corpus** — Remove or downweight PostgreSQL PDFs that dominate the embedding space
4. **Fix incomplete PDFs** — Reprocess PostgreSQL v11-v18 (8 PDFs with 0 chunks)

### Can Defer (After Embeddings Are Fixed)

5. **Implement hybrid search** — BM25 keyword search can help with exact term matching
6. **Add reranker** — Cross-encoder reranker improves precision after initial retrieval

---

## Verdict

| Criterion | Status |
|-----------|--------|
| Embedding Model | ❌ Feature hashing (NOT neural) |
| Vector Search | ✅ Correct implementation |
| Cosine Similarity | ✅ Correct formula |
| Similarity Scores | ❌ Max 0.60 (should be >0.80) |
| Semantic Understanding | ❌ None — character overlap only |
| Corpus Balance | ❌ 93% PostgreSQL dominance |

**The embedding model is the #1 blocker.** Fix this first, then re-evaluate everything else.

---

*Generated by Hermes Agent — Phase 3F Embedding Model Validation*
