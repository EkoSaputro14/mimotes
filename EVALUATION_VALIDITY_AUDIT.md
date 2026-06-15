# Evaluation Validity Audit

**Date:** June 9, 2026  
**Status:** ⚠️ CRITICAL ISSUES FOUND

---

## Question 1: Ground Truth Population

**Of 50 benchmark queries:**

| Field | Count | Percentage |
|-------|-------|------------|
| `expected_chunk_ids` populated | **0** | 0% |
| `expected_document_ids` populated | **0** | 0% |
| Both empty (no ground truth) | **50** | 100% |

**JSON file (source of truth):**
| Field | Count | Percentage |
|-------|-------|------------|
| `expected_document_ids` populated | **27** | 54% |
| Both empty | **23** | 46% |

**⚠️ CRITICAL: Database has 0 ground truth. JSON file has 27. They are out of sync.**

---

## Question 2: Per-Query Ground Truth

```
query                                          | expected_chunk_count
-----------------------------------------------|--------------------
Apa itu mimotes?                               | 0
How does RAG work?                             | 0
Jelaskan cara upload dokumen                   | 0
What is vector embedding?                      | 0
Bagaimana cara mengatur AI provider?           | 0
Explain hybrid search implementation           | 0
Apa keunggulan BM25 over vector search?        | 0
How to configure OpenAI API key?               | 0
What is Reciprocal Rank Fusion?                | 0
Cara membuat chatbot dari dokumen              | 0
(All 50 queries show 0 for both fields)
```

**Result: ALL 50 queries have `expected_chunk_ids = []` and `expected_document_ids = []` in the database.**

---

## Question 3: How Are Metrics Calculated Without Ground Truth?

**Answer: They are NOT calculated from database ground truth.**

The evaluation script (`scripts/run-rag-eval.ts`) reads ground truth from the **JSON file** (`scripts/eval-benchmark.json`), NOT from the database.

**Flow:**
1. Script loads `eval-benchmark.json` (has 27 queries with `expected_document_ids`)
2. Script computes Precision@5, Recall@5, MRR using JSON ground truth
3. Script stores results in `eval_results` table with computed metrics
4. Database `eval_queries` table has empty ground truth

**Result:**
- `eval_results.precision_at_5` = computed from JSON ground truth ✅
- `eval_queries.expected_document_ids` = empty in database ❌
- Dashboard API queries database → sees 0 ground truth → shows incomplete data

---

## Question 4: Are Baseline Metrics Real or Fallback?

**Answer: PARTIALLY REAL, PARTIALLY FALLBACK.**

| Metric | Value | Source | Valid? |
|--------|-------|--------|--------|
| Precision@5 | 32.40% | Computed from JSON ground truth | ⚠️ Partial |
| Recall@5 | 33.20% | Computed from JSON ground truth | ⚠️ Partial |
| MRR | 54.00% | Computed from JSON ground truth | ⚠️ Partial |
| Latency | 45ms | Real measurement | ✅ Real |

**Why "partially real":**
- 27/50 queries have ground truth in JSON → metrics are real for those 23 queries
- 23/50 queries have NO ground truth → metrics are 0 for those (correctly)
- Aggregate metrics average over all 50 → diluted by 23 zero-value queries

**The metrics are mathematically correct but incomplete.** The 32.4% Precision@5 is calculated from 27 queries with ground truth, averaged across all 50 queries (including 23 zeros).

---

## Question 5: Can Runner Fail Without Ground Truth?

**Answer: NO, it will not fail, but metrics will be 0.**

```typescript
// run-rag-eval.ts line 112
const hasGroundTruth = q.expected_chunk_ids.length > 0 || q.expected_document_ids.length > 0;

// line 137-139
const p = hasGroundTruth ? precisionAtK(retrievedIds, relevantIds, 5) : 0;
const r = hasGroundTruth ? recallAtK(retrievedIds, relevantIds, 5) : 0;
const m = hasGroundTruth ? mrr(retrievedIds, relevantIds) : 0;
```

**Behavior without ground truth:**
- `hasGroundTruth = false`
- `relevantIds = []`
- All metrics = 0
- Result stored with 0s
- Runner continues to next query

**This is correct behavior** — it correctly reports 0% for queries without ground truth.

---

## Root Cause Analysis

### Issue 1: Database-JSON Sync Mismatch
- JSON file updated with 27 queries having `expected_document_ids`
- Database `eval_queries` table never updated
- Seed script uses original JSON (empty ground truth)

### Issue 2: Ground Truth Too Broad
- 27 queries linked to ALL 5 documents (doc-a, doc-b, 3 images)
- No query has specific `expected_chunk_ids`
- All documents marked as "relevant" for general queries

### Issue 3: No Chunk-Level Ground Truth
- `expected_chunk_ids` is empty for ALL queries
- Cannot measure which specific chunks should be retrieved
- Precision/Recall metrics are approximate, not exact

---

## Recommendations

### CRITICAL (Must Fix)
1. **Sync database with JSON file** — Update `eval_queries.expected_document_ids` in database
2. **Re-run evaluation** — After sync, metrics will match JSON ground truth

### IMPORTANT (Should Fix)
3. **Add chunk-level ground truth** — Populate `expected_chunk_ids` for accurate metrics
4. **Refine document links** — Don't link all documents to general queries
5. **Add validation** — Warn if running eval with < 50% ground truth coverage

### NICE TO HAVE
6. **Auto-sync mechanism** — Keep JSON and database in sync
7. **Ground truth editor** — UI to annotate queries with relevant chunks

---

## Current State Summary

| Component | Status |
|-----------|--------|
| Database tables | ✅ Created with RLS |
| JSON benchmark | ✅ 50 queries, 27 with ground truth |
| Database benchmark | ❌ 0 queries with ground truth |
| Eval runner | ✅ Works, computes correct metrics |
| Metrics accuracy | ⚠️ Partial (27/50 queries contribute) |
| Dashboard API | ⚠️ Returns incomplete data |
| Baseline report | ⚠️ Diluted by missing ground truth |

---

## Verdict

**The evaluation framework is FUNCTIONAL but DATA-INCOMPLETE.**

- The infrastructure works correctly
- Metrics are mathematically valid for queries with ground truth
- The 32.4% Precision@5 is a real measurement, not a fallback
- But it's measured on 54% of the benchmark (27/50 queries)
- Full benchmark needs database sync + chunk-level ground truth

**Phase 3 is NOT ready for production use until database-JSON sync is fixed.**

---

## Audit Complete ⚠️
