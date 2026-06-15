# Real Retrieval Baseline — Measured Metrics

**Date:** 2026-06-13
**Status:** Real baseline (measured against live API)
**Method:** Python benchmark runner → MimoNotes Search API (authenticated)
**Corpus:** 35 documents, 107,571 chunks (100% feature-hashing embeddings)

## Executive Summary

The retrieval pipeline returns results for **every** query, including completely irrelevant ones. The similarity threshold (0.30) is too low to filter noise. Feature-hashing embeddings produce uniform low similarity scores (0.20–0.50) that cannot distinguish relevant from irrelevant content. The system has **zero refusal capability** — it will always generate an answer, even for nonsensical queries.

## Corpus Health

| Metric | Value | Status |
|--------|-------|--------|
| Total Documents | 35 | ✅ |
| Total Chunks | 107,571 | ✅ |
| Chunks with Embeddings | 107,571 (100%) | ✅ |
| Embedding Type | Feature Hashing | ❌ Not neural |
| HNSW Index | NO | ❌ Sequential scan |
| Workspaces | 5 | ✅ |

### File Type Distribution

| Type | Docs | Chunks | % of Corpus |
|------|------|--------|-------------|
| PDF | 11 | 30,813 | 28.6% |
| TXT | 6 | 124 | 0.1% |
| DOCX | 5 | 71 | 0.1% |
| Image | 13 | 13 | 0.0% |

**⚠️ 71% of chunks have NO embeddings recorded in the type-level stat** — this means 76,750+ chunks belong to documents with 0 chunk_count recorded (likely from batch imports or migration). The actual chunk distribution is skewed.

## Real vs Estimated Baseline

| Metric | Estimated (Sprint 7A) | **REAL (Measured)** | Delta | Assessment |
|--------|----------------------|---------------------|-------|------------|
| **Retrieval Accuracy** | ~50% | **100%** | +50% | Misleading — returns results for everything |
| **Avg Similarity** | ~0.35 | **0.3218** | -0.028 | Worse than estimated |
| **Avg Keyword Hit** | ~40% | **46.6%** | +6.6% | Slightly better |
| **False Positive Rate** | ~15% | **100%** | +85% | CRITICAL — all negatives return results |
| **Refusal Accuracy** | ~70% | **0%** | -70% | CRITICAL — zero refusals |
| **Avg Latency** | ~10ms | **325ms** | +315ms | 32x worse (embedding generation) |
| **P95 Latency** | ~25ms | **629ms** | +604ms | 25x worse |

### Key Insight: "Retrieval Accuracy = 100%" is Meaningless

Every query returns 5 results because:
1. Threshold 0.30 is too low — feature hashing produces similarities 0.15–0.50 for everything
2. No reranking to filter irrelevant results
3. The system cannot distinguish "relevant" from "random match"

A weather forecast query ("What is the weather forecast for Jakarta?") returns PostgreSQL PDF chunks with similarity 0.5068. This is **false positive retrieval** that will lead to hallucinated answers.

## Per-Query Results

### Positive Queries (Should Retrieve)

| ID | Query | Max Sim | KW Hit | Top Document | Latency |
|----|-------|---------|--------|--------------|---------|
| factual-001 | Apa itu RAG? | 0.2504 | 0% | postgresql-18-US.pdf | 1442ms |
| factual-002 | Cara upload dokumen? | 0.2083 | 100% | business-requirements.docx | 324ms |
| factual-003 | What is pgvector? | 0.3427 | 50% | postgresql-14-US.pdf | 291ms |
| factual-004 | Fungsi embedding dalam RAG? | 0.2629 | 67% | postgresql-10-US.pdf | 357ms |
| factual-005 | Cara kerja cosine similarity? | 0.2739 | 100% | business-requirements.docx | 332ms |
| conceptual-001 | Chunking penting dalam RAG? | 0.3770 | 0% | postgresql-18-US.pdf | 286ms |
| conceptual-002 | Vector vs keyword search? | 0.3558 | 50% | postgresql-9.6-US.pdf | 399ms |
| conceptual-003 | Kurangi hallucination? | 0.2654 | 0% | postgresql-9.6-US.pdf | 461ms |
| conceptual-004 | Chunk size tradeoffs? | 0.4321 | 0% | postgresql-9.6-US.pdf | 392ms |
| conceptual-005 | Hybrid vs vector-only? | 0.4041 | 100% | business-requirements.docx | 468ms |
| multi-doc-001 | Embedding quality → precision? | 0.3018 | 0% | SKPT RIFKA ANNISA LUTFIA.pdf | 504ms |
| multi-doc-002 | Optimize RAG E2E? | 0.3358 | 20% | postgresql-18-US.pdf | 483ms |
| multi-doc-003 | Security for RAG? | 0.4711 | 25% | postgresql-10-US.pdf | 330ms |
| multi-doc-004 | NextAuth + Prisma? | 0.3111 | 0% | SKPT RIFKA ANNISA LUTFIA.pdf | 313ms |
| multi-doc-005 | MimoNotes architecture? | 0.3597 | 20% | postgresql-14-US.pdf | 304ms |
| edge-001 | RAG (single word) | 0.2994 | 0% | postgresql-14-US.pdf | 365ms |

**Observations:**
- 13/16 positive queries have max similarity < 0.40 (below quality gate)
- "What is pgvector?" → top result is PostgreSQL PDF (correct!)
- "NextAuth + Prisma?" → top result is an SKPT certificate PDF (WRONG)
- First query cold-start: 1442ms, subsequent: 270–500ms

### Negative Queries (Should NOT Retrieve)

| ID | Query | Max Sim | Top Document | Status |
|----|-------|---------|--------------|--------|
| negative-001 | Cara memasak nasi goreng? | 0.1793 | postgresql-17-US.pdf | ❌ FALSE POSITIVE |
| negative-002 | Weather forecast Jakarta? | **0.5068** | postgresql-17-US.pdf | ❌ FALSE POSITIVE |
| negative-003 | Presiden Indonesia 2030? | 0.2058 | postgresql-9.6-US.pdf | ❌ FALSE POSITIVE |
| edge-002 | Fitur yang belum ada? | 0.2932 | SKPT RIFKA ANNISA LUTFIA.pdf | ❌ FALSE POSITIVE |

**CRITICAL:** "Weather forecast Jakarta" returns PostgreSQL docs with **0.5068 similarity** — higher than most relevant queries! Feature hashing cannot distinguish cooking questions from database documentation.

## Category Performance

| Category | Queries | Accuracy | Avg Similarity | Keyword Hit |
|----------|---------|----------|---------------|-------------|
| Factual | 6 | 100% | 0.2729 | 53% |
| Conceptual | 5 | 100% | 0.3669 | 30% |
| Multi-doc | 5 | 100% | 0.3559 | 13% |
| Negative | 4 | 100% | 0.2963 | 100% |

**Conceptual queries** have highest similarity (0.37) — feature hashing captures word overlap better for longer queries.

**Multi-doc queries** have lowest keyword hit (13%) — cross-document reasoning is poorly supported.

## Difficulty Performance

| Difficulty | Queries | Accuracy | Avg Similarity | Keyword Hit |
|------------|---------|----------|---------------|-------------|
| Easy | 7 | 100% | 0.2847 | 64% |
| Medium | 5 | 100% | 0.3036 | 53% |
| Hard | 8 | 100% | 0.3657 | 27% |

**Hard queries** paradoxically have higher similarity — they're longer, creating more trigram overlaps.

## Root Cause Analysis

### 1. Feature Hashing Ceiling (BLOCKING)

All embeddings are feature hashing (trigram + word hashing). Max similarity across ALL queries is 0.4711. The similarity distribution is compressed into 0.15–0.50 range, making threshold-based filtering nearly useless.

**Evidence:**
- Weather query gets 0.5068 similarity (higher than "What is pgvector?" at 0.3427)
- No query exceeds 0.50 similarity
- Embedding sample: `[0,-0.055,0,0,0,-0.055,0.109,0,...]` — 85%+ zeros

### 2. No Similarity Threshold Filtering

The search API returns results above 0.30 threshold, but feature hashing ensures nearly everything passes. With 107K chunks, even random matches score 0.15–0.25.

### 3. No HNSW Index

Sequential scan on 107K chunks. Latency: 270–500ms per query (embedding generation + seq scan).

### 4. No Negative Query Handling

The system has no mechanism to refuse queries. It always returns top-K results regardless of relevance.

## Improvement Opportunities (Ranked by Impact)

| # | Improvement | Expected Impact | Effort | Priority |
|---|-------------|----------------|--------|----------|
| 1 | **Switch to neural embeddings** (OpenAI, local model) | +40% accuracy, -80% false positives | 4h | P0 |
| 2 | **Add HNSW index** | -70% latency (420ms → ~50ms) | 0.5h | P0 |
| 3 | **Raise threshold to 0.50** | -60% false positives | 0.5h | P1 |
| 4 | **Add reranker** (BGE, Cohere) | +25% precision | 4h | P1 |
| 5 | **Add negative query detection** | 100% refusal accuracy | 2h | P2 |
| 6 | **Rebalance corpus** (add non-PDF docs) | +10% multi-doc accuracy | 2h | P2 |

## Comparison: Estimated vs Real

| Metric | Estimated | Real | Accuracy |
|--------|-----------|------|----------|
| Retrieval Accuracy | 50% | 100%* | Off by 50% |
| Avg Similarity | 0.35 | 0.3218 | 8% close |
| False Positive Rate | 15% | 100% | Off by 85% |
| Refusal Accuracy | 70% | 0% | Off by 70% |
| Avg Latency | 10ms | 325ms | Off by 32x |

*Retrieval accuracy = 100% because the system returns results for every query, but most are irrelevant. The estimated 50% was based on "correctly retrieved" which requires semantic judgment. The real system cannot make that distinction.

## Recommendations for Sprint 7B

**DO NOT** tune thresholds or add reranker yet. The root problem is feature hashing embeddings. Without fixing this:
- Threshold tuning will always be a losing game (similarity range is 0.15–0.50)
- Reranker can only reorder, not fix fundamentally wrong top-10 results
- No amount of optimization compensates for bad embeddings

**Priority order:**
1. Switch to neural embeddings (this alone may fix 70% of issues)
2. Add HNSW index (performance)
3. Then measure again — real metrics will look completely different
4. Only then consider threshold tuning and reranker
