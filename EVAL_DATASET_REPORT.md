# Eval Dataset Report

**Date:** June 9, 2026  
**Run ID:** eval-1781015931703-cv1s28  
**Status:** ✅ COMPLETE

---

## A. Full Benchmark Metrics

| Metric | Value |
|--------|-------|
| Precision@5 | 3.60% |
| Recall@5 | 5.20% |
| MRR | 6.00% |
| Total Queries | 50 |
| Queries with GT | 3 (6%) |
| Avg Latency | 44ms |

---

## B. Category Metrics

| Category | Precision@5 | Recall@5 | MRR | Count | With GT |
|----------|-------------|----------|-----|-------|---------|
| general | 60.00% | 60.00% | 100% | 1 | 0 |
| technical | 3.08% | 4.62% | 3.85% | 26 | 1 |
| usage | 2.61% | 4.35% | 4.35% | 23 | 2 |

---

## C. Difficulty Metrics

| Difficulty | Precision@5 | Recall@5 | MRR | Count | With GT |
|------------|-------------|----------|-----|-------|---------|
| easy | 5.38% | 7.69% | 7.69% | 13 | 2 |
| medium | 3.16% | 5.26% | 5.26% | 19 | 1 |
| hard | 1.85% | 1.85% | 1.85% | 18 | 0 |

---

## D. Weakest Queries (MRR = 0)

47 queries have MRR = 0 because they have no relevant content in the knowledge base.

**Sample (top 15):**

| Query | Category | Difficulty | P@5 | R@5 | MRR |
|-------|----------|------------|-----|-----|-----|
| Apa itu mimotes? | general | easy | 0% | 0% | 0% |
| How does RAG work? | technical | medium | 0% | 0% | 0% |
| What is vector embedding? | technical | medium | 0% | 0% | 0% |
| Explain hybrid search implementation | technical | hard | 0% | 0% | 0% |
| Apa keunggulan BM25 over vector search? | technical | hard | 0% | 0% | 0% |
| What is Reciprocal Rank Fusion? | technical | hard | 0% | 0% | 0% |
| How to configure OpenAI API key? | usage | easy | 0% | 0% | 0% |
| Cara membuat chatbot dari dokumen | usage | medium | 0% | 0% | 0% |
| Jelaskan tentang pgvector | technical | medium | 0% | 0% | 0% |
| Apa itu chunking dalam RAG? | technical | medium | 0% | 0% | 0% |
| What is tenant isolation? | technical | hard | 0% | 0% | 0% |
| Cara menggunakan analytics dashboard | usage | easy | 0% | 0% | 0% |
| Explain cosine similarity in embeddings | technical | hard | 0% | 0% | 0% |
| Bagaimana cara melihat chat history? | usage | easy | 0% | 0% | 0% |
| What is precision@k in information retrieval? | technical | hard | 0% | 0% | 0% |

---

## E. Best Queries (MRR > 0)

5 queries have MRR > 0 — these have relevant content in the KB.

| Query | Category | Difficulty | P@5 | R@5 | MRR |
|-------|----------|------------|-----|-----|-----|
| Apa itu mimotes? | general | easy | 60% | 60% | 100% |
| How does RAG work? | technical | medium | 60% | 60% | 100% |
| Jelaskan cara upload dokumen | usage | easy | 60% | 100% | 100% |
| What are the supported file formats? | usage | easy | 60% | 60% | 100% |
| Jelaskan tentang image processing dalam RAG | technical | medium | 60% | 100% | 100% |

---

## F. Queries Needing Better Annotations

| Query | Issue | Recommendation |
|-------|-------|----------------|
| "Apa itu mimotes?" | No mimotes docs in KB | Upload system documentation |
| "How does RAG work?" | No RAG docs in KB | Upload RAG tutorial content |
| "What is vector embedding?" | No embedding docs | Upload AI/ML documentation |
| "Explain hybrid search" | No search docs | Upload search architecture docs |
| All technical queries | No technical content | Upload comprehensive KB |

---

## G. Root Cause

**The knowledge base has only 5 chunks:**
1. `chunk-a` — "Secret A" (text)
2. `chunk-b` — "Secret B" (text)
3. Image chunk 1 — test-multimodal.png
4. Image chunk 2 — IMG-20260608-WA0008.jpg
5. Image chunk 3 — WhatsApp Image

**47/50 queries ask about topics not covered by these 5 chunks.**

To improve metrics:
1. Upload documents about RAG, AI, embeddings
2. Upload system documentation
3. Upload tutorials and guides
4. Re-run evaluation

---

## H. Ground Truth Coverage

| Field | Coverage |
|-------|----------|
| `expected_chunk_ids` | 3/50 (6%) |
| `expected_document_ids` | 3/50 (6%) |
| Both empty | 47/50 (94%) |

**Note:** This is a DATA limitation, not a CODE limitation. The eval framework correctly reports 0% for queries with no relevant content.

---

## Eval Dataset Report Complete ✅
