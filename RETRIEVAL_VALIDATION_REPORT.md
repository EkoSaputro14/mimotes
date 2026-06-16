# RETRIEVAL_VALIDATION_REPORT.md — Phase 3E Retrieval Validation

> Date: 2026-06-10
> Phase: 3E — Retrieval Validation
> Status: **COMPLETE** ✅

---

## Summary

Retrieval quality is **poor** across most query categories. The system retrieves PostgreSQL documentation for unrelated queries (Mimotes, auctions, Linux, Docker) due to corpus imbalance (93% PostgreSQL chunks) and weak embedding quality. Only 2/50 queries returned correct chunks.

---

## Evaluation Results

### Overall Metrics

| Metric | Value | Verdict |
|--------|-------|---------|
| **Precision@5** | 0.8% | ❌ Critical |
| **Recall@5** | 4.0% | ❌ Critical |
| **MRR** | 1.5% | ❌ Critical |
| **Doc Hit Rate** | 28.0% | ⚠️ Poor |
| **Success Rate** | 100% (50/50) | ✅ |

### Category Breakdown

| Category | P@5 | R@5 | MRR | Doc Hit | Queries |
|----------|-----|-----|-----|---------|---------|
| postgresql | 0.00 | 0.00 | 0.00 | 67% | 15 |
| business | 0.00 | 0.00 | 0.00 | 0% | 10 |
| image | 0.02 | 0.10 | 0.05 | 10% | 10 |
| text | 0.02 | 0.10 | 0.03 | 30% | 10 |
| cross | 0.00 | 0.00 | 0.00 | 0% | 5 |

---

## Root Cause Analysis

### 1. Corpus Imbalance (Critical)

The corpus is overwhelmingly dominated by PostgreSQL documentation:

| Document Type | Chunks | % of Total |
|---------------|--------|------------|
| PostgreSQL PDFs (2 of 10) | 30,796 | **93.0%** |
| TXT files | 124 | 0.4% |
| DOCX files | 71 | 0.2% |
| Images | 13 | 0.04% |
| **Total** | **31,004** | **100%** |

**Impact:** When searching for "What is the Mimotes project?", the vector search returns PostgreSQL chunks because they constitute 93% of the embedding space. The PostgreSQL chunks dominate regardless of query intent.

### 2. Embedding Model Quality (Critical)

Similarity scores are uniformly low (0.33–0.55) across all queries, indicating the embedding model (mimo-embedding) fails to capture semantic meaning:

- "What is PostgreSQL?" → 0.52 similarity (should be >0.8)
- "What is the Mimotes project?" → 0.46 similarity (returns PostgreSQL chunks)
- "How do you compile the Linux kernel?" → 0.45 similarity (returns PostgreSQL chunks)
- "What is Docker?" → 0.33 similarity (returns PostgreSQL chunks)

### 3. Large Chunks Dilute Content

PostgreSQL PDF chunks are ~400 chars average, but many are table-of-contents entries or page headers that don't contain meaningful content for retrieval.

### 4. 8 of 10 PostgreSQL PDFs Have 0 Chunks

The OOM crash during upload left 8 PostgreSQL PDFs (v11-v18) with status "uploaded" but 0 chunks. Only v9.6 and v10 were fully processed. This means 80% of the PDF content is missing from the vector store.

---

## Successful Retrieval Analysis

Only 2 queries returned correct chunks:

| Query | P@5 | MRR | Why It Worked |
|-------|-----|-----|---------------|
| What API endpoints are documented? | 0.20 | 0.50 | OCR chunk from api-documentation.png contains unique API text |
| What paths does Google disallow in robots.txt? | 0.20 | 0.25 | robots.txt chunk contains unique "Disallow:" patterns |

**Pattern:** Success only occurs when the query text matches OCR-extracted text almost exactly (keyword overlap).

---

## Chunk Quality Distribution

| Metric | Value |
|--------|-------|
| Total Chunks | 107,554 |
| Chunks with Embeddings | 107,554 (100%) |
| Average Chunk Length | 408 chars |
| Min Chunk Length | 2 chars |
| Max Chunk Length | 2,051 chars |
| Empty Chunks | 66 |
| Chunks from PostgreSQL PDFs | 99,496 (92.5%) |
| Chunks from Non-PDF Sources | 208 (0.2%) |

---

## Recommendations

### Immediate Fixes (Phase 3F)

1. **Fix incomplete PDF processing** — Reprocess PostgreSQL v11-v18 (8 PDFs with 0 chunks)
2. **Rebalance corpus** — Reduce PostgreSQL chunk count or add more diverse content
3. **Try a better embedding model** — mimo-embedding appears too weak; consider text-embedding-3-small or similar
4. **Increase chunk size** — Current 500-token chunks may be too small for PDF content

### Medium-Term (Phase 4)

5. **Implement hybrid search** — BM25 keyword search can complement weak embeddings
6. **Add reranker** — Cross-encoder reranker can improve precision after initial retrieval
7. **Query expansion** — Expand queries with synonyms to improve recall

### Long-Term

8. **Fine-tune embeddings** — Train domain-specific embeddings on the actual corpus
9. **Implement re-ranking** — Use LLM-based reranking for top-k results

---

## Verdict: ❌ NOT READY

| Criterion | Required | Actual | Status |
|-----------|----------|--------|--------|
| Precision@5 | >50% | 0.8% | ❌ |
| MRR | >30% | 1.5% | ❌ |
| Doc Hit Rate | >80% | 28% | ❌ |
| Ground Truth Coverage | >80% | 100% | ✅ |

**The retrieval system is NOT production-ready.** The embedding model cannot distinguish between PostgreSQL documentation and unrelated queries. A reranker alone cannot fix this — the fundamental issue is embedding quality and corpus imbalance.

**Recommended path:** Fix embedding model + rebalance corpus before attempting reranker.

---

## Ground Truth Coverage

- Total queries: 50
- Queries with ground truth annotations: 50 (100%)
- Annotations include: document IDs, chunk IDs, difficulty levels
- Categories: postgresql (15), business (10), image (10), text (10), cross (5)

---

*Generated by Hermes Agent — Phase 3E Retrieval Validation*
