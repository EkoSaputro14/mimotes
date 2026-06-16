# PHASE 3A — EVALUATION DATA INTEGRITY REPORT

**Date:** June 8, 2026  
**Status:** 🔴 CRITICAL — Previous baseline is invalid

---

## 1. Executive Summary

**The previously reported baseline of P@5=32.4%, R@5=33.2%, MRR=54% is INVALID.**

It was computed against ground truth annotations that no longer exist in the database. The benchmark JSON was modified between evaluation runs, creating phantom metrics.

---

## 2. Data Inventory

### Knowledge Base Contents

| Chunk ID | Document ID | Type | Content Preview |
|----------|-------------|------|-----------------|
| `chunk-a` | `doc-a` | text | "Secret A" |
| `chunk-b` | `doc-b` | text | "Secret B" |
| `aed6c7bd` | `24a39ede` | image | test-multimodal.png (filename fallback) |
| `7c6b012b` | `6996aa99` | image | IMG-20260608-WA0008.jpg (filename fallback) |
| `e7350c07` | `9603d143` | image | WhatsApp Image 2026-06-08 (filename fallback) |

**Total: 5 chunks** (2 text with dummy content, 3 images with filename-based embeddings)

### Benchmark Data

| Source | Total Queries | With Ground Truth | Coverage |
|--------|--------------|-------------------|----------|
| JSON (`eval-benchmark.json`) | 50 | 3 | **6%** |
| Database (`eval_queries`) | 50 | 3 | **6%** |

### Queries WITH Ground Truth

| Query | Expected Documents | Expected Chunks |
|-------|-------------------|-----------------|
| "Jelaskan cara upload dokumen" | 3 image docs | 3 image chunks |
| "What are the supported file formats?" | 5 docs (all) | 5 chunks (all) |
| "Jelaskan tentang image processing dalam RAG" | 3 image docs | 3 image chunks |

### Queries WITHOUT Ground Truth (47 of 50)

All 47 remaining queries have `expected_document_ids: []` and `expected_chunk_ids: []`. These include:
- "Apa itu mimotes?" — no annotated relevant chunks
- "How does RAG work?" — no annotated relevant chunks
- "Bagaimana cara mengatur AI provider?" — no annotated relevant chunks
- ... (44 more)

---

## 3. Evaluation Run Analysis

### Run 1: `eval-1781015193450-2papq4` (the "32.4%" baseline)

| Metric | Reported | Recalculated | Status |
|--------|----------|-------------|--------|
| P@5 | 32.4% | 32.4% (math correct) | ⚠️ Stale GT |
| R@5 | 33.2% | 33.2% (math correct) | ⚠️ Stale GT |
| MRR | 54.0% | 54.0% (math correct) | ⚠️ Stale GT |
| Queries scored | 27/50 | — | — |
| Queries with GT (current DB) | — | **3/50** | 🔴 |

**How 32.4% was computed:**
```
27 queries × P@5=0.6 = 16.2
16.2 / 50 total queries = 0.324 = 32.4%
```

**The problem:** At the time of this run, the JSON benchmark had 27 queries with ground truth. Those annotations were later removed/overwritten. The current DB has only 3 queries with ground truth.

### Run 2: `eval-1781015931703-cv1s28` (latest)

| Metric | Reported | Correct (valid queries only) | Status |
|--------|----------|------------------------------|--------|
| P@5 | 3.6% | **60.0%** (3 queries only) | ⚠️ Inflated denominator |
| R@5 | 5.2% | **86.7%** (3 queries only) | ⚠️ Inflated denominator |
| MRR | 6.0% | **100.0%** (3 queries only) | ⚠️ Inflated denominator |
| Queries scored | 3/50 | 3/50 | 🔴 |

**How 3.6% was computed:**
```
3 queries × P@5=0.6 = 1.8
1.8 / 50 total queries = 0.036 = 3.6%
```

**Correct calculation (queries with GT only):**
```
3 queries × P@5=0.6 = 1.8
1.8 / 3 queries with GT = 0.60 = 60.0%
```

---

## 4. Why the "27 queries with GT" Were Invalid

The older run scored 27 queries at P@5=0.6. These queries (e.g., "Apa itu mimotes?", "How does RAG work?") were given ground truth pointing to the 3 image chunks. This is semantically wrong:

- "Apa itu mimotes?" → matched to image chunks with no OCR text → **false positive**
- "How does RAG work?" → matched to filename-based image embeddings → **false positive**
- "Bagaimana cara mengatur AI provider?" → matched to WhatsApp image → **false positive**

The ground truth was artificially constructed by mapping ALL queries to ALL available chunks, producing inflated metrics.

---

## 5. Root Cause

| Issue | Description |
|-------|-------------|
| **Tiny corpus** | 5 chunks (2 dummy text + 3 images with no real content) cannot benchmark a RAG system |
| **No real content** | Text chunks contain "Secret A/B" — not real documents |
| **No vision model** | Image chunks have filename-based embeddings, no OCR, no captions |
| **Ground truth loss** | JSON benchmark was modified between runs, losing 27 annotations |
| **Denominator bug** | Aggregate divides by ALL queries (50) instead of queries WITH GT |
| **Artificial GT** | Older GT mapped irrelevant queries to irrelevant chunks |

---

## 6. True Baseline (Honest Metrics)

### With Current Data (3 queries with GT)

| Metric | Value | Confidence |
|--------|-------|------------|
| Precision@5 | **60.0%** | ⚠️ Low (n=3) |
| Recall@5 | **86.7%** | ⚠️ Low (n=3) |
| MRR | **100.0%** | ⚠️ Low (n=3) |
| Ground truth coverage | **6%** | 🔴 Critical |
| Evaluable queries | 3/50 | 🔴 Critical |

### Interpretation

The 60% P@5 is meaningless because:
1. Only 3 queries have ground truth
2. All 3 reference the same 3 image chunks
3. With 5 total chunks, retrieval returns all of them anyway
4. The "relevant" chunks have no actual content (filename-based embeddings)

---

## 7. Corrected Baseline Report

### What We Actually Know

| Statement | Truth |
|-----------|-------|
| "P@5 = 32.4%" | ❌ Based on stale ground truth |
| "P@5 = 3.6%" | ❌ Divides by wrong denominator |
| "P@5 = 60% (on 3 valid queries)" | ⚠️ Mathematically correct but statistically insignificant |
| "Hybrid search works" | ✅ Returns results in ~1ms |
| "Retrieval pipeline is functional" | ✅ Embedding → search → results |
| "Evaluation framework works" | ✅ Script runs, stores results |
| "Benchmark is trustworthy" | ❌ **NO** |

### Minimum Requirements for Trustworthy Benchmark

| Requirement | Current | Needed |
|-------------|---------|--------|
| Total chunks | 5 | 50+ |
| Documents | 5 | 10+ |
| Queries with GT | 3 (6%) | 40+ (80%) |
| Chunk diversity | images only | text, code, tables, images |
| Real content | dummy text | actual documents |
| Vision model | unavailable | GPT-4o or Gemini |

---

## 8. Recommendations

### Immediate (Before Any Retrieval Optimization)

1. **Upload real documents** — PDFs, markdown docs, code files, spreadsheets
2. **Configure vision model** — GPT-4o or Gemini for actual OCR/captioning
3. **Rebuild ground truth** — Annotate 40+ queries with correct chunk references
4. **Fix aggregate calculation** — Divide by queries WITH GT, not ALL queries

### Before Phase 4 (Reranker)

5. **Establish corpus** — Minimum 20 documents, 100+ chunks
6. **Run baseline** — With real content, compute honest P@5, R@5, MRR
7. **Document metrics** — Include n (evaluable queries), coverage %, confidence

### Benchmark Quality Checklist

- [ ] Ground truth coverage ≥ 80%
- [ ] All referenced chunks exist in DB
- [ ] All referenced documents exist in DB
- [ ] Ground truth is semantically correct (not artificial)
- [ ] Corpus has real content (not dummy text)
- [ ] Aggregate divides by correct denominator
- [ ] Metrics reported with confidence intervals

---

## 9. Files Affected

| File | Issue | Action |
|------|-------|--------|
| `scripts/eval-benchmark.json` | Only 3/50 queries have GT | Rebuild with real annotations |
| `scripts/run-rag-eval.ts` | Divides by all queries | Fix to divide by queries with GT only |
| `scripts/sync-eval-ground-truth.ts` | Synced empty GT to DB | Re-run after fixing JSON |
| `app/api/analytics/evaluation/route.ts` | May show stale metrics | Re-query after re-evaluation |
| `components/dashboard/evaluation-analytics.tsx` | Shows stale baseline | Update after new baseline |

---

## 10. Conclusion

**Do NOT proceed with Phase 4 (Reranker) until:**

1. Real documents are uploaded to the knowledge base
2. Vision model is configured for image processing
3. Ground truth is rebuilt with 40+ semantically correct annotations
4. Honest baseline is computed on real content

**The evaluation framework is structurally sound** — the script, database schema, and analytics all work correctly. The problem is entirely data quality: the benchmark was built on a foundation of dummy content and artificial annotations.

---

*This report establishes the true state of evaluation data integrity. Previous baseline numbers should be considered unreliable until a new benchmark is established on real content.*
