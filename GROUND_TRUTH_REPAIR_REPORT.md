# Ground Truth Repair Report

**Date:** June 9, 2026  
**Status:** ✅ COMPLETE

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| DB ground truth | 0/50 (0%) | 3/50 (6%) |
| JSON ground truth | 27/50 (54%) | 3/50 (6%) |
| Sync status | ❌ Mismatch | ✅ Synced |
| Validation | None | ✅ Active (80% threshold + --force) |
| Audit tool | None | ✅ Created |

---

## What Was Done

### 1. Data Audit
- Audited 5 chunks in database
- Identified: 2 text chunks ("Secret A", "Secret B") + 3 image chunks
- Conclusion: Only 3 queries have relevant content in KB

### 2. Ground Truth Assignment

| Query | Chunk IDs | Document IDs |
|-------|-----------|--------------|
| "Jelaskan cara upload dokumen" | 3 image chunks | 3 image docs |
| "What are the supported file formats?" | 5 chunks (all) | 5 docs (all) |
| "Jelaskan tentang image processing dalam RAG" | 3 image chunks | 3 image docs |

**47 queries have NO relevant content** — this is correct because the KB doesn't contain information about RAG, AI, embeddings, etc.

### 3. Sync Process Created
**File:** `scripts/sync-eval-ground-truth.ts`

```bash
npx tsx scripts/sync-eval-ground-truth.ts
```

Syncs JSON → Database for `eval_queries.expected_document_ids` and `eval_queries.expected_chunk_ids`.

### 4. Validation Added to Eval Runner

```bash
# Without --force: fails if coverage < 80%
npx tsx scripts/run-rag-eval.ts

# With --force: proceeds anyway
npx tsx scripts/run-rag-eval.ts --force
```

### 5. Audit Tool Created
**File:** `scripts/audit-eval-dataset.ts`

```bash
npx tsx scripts/audit-eval-dataset.ts
```

Outputs: total queries, ground truth coverage, invalid references, orphan chunks.

---

## Why Coverage Is 6% (Not 100%)

The knowledge base contains only **5 chunks**:
- 2 text chunks: "Secret A", "Secret B"
- 3 image chunks: metadata about uploaded images

The benchmark has **50 queries** about:
- RAG, AI, embeddings (not in KB)
- BM25, vector search (not in KB)
- System usage (not in KB)
- Image processing (3 queries relevant)

**This is a data problem, not a code problem.** To achieve 100% coverage:
1. Upload documents about RAG, AI, embeddings
2. Upload documentation about the system
3. Re-run `npx tsx scripts/sync-eval-ground-truth.ts`

---

## Files Created/Modified

| File | Action |
|------|--------|
| `scripts/eval-benchmark.json` | Updated with chunk-level ground truth |
| `scripts/sync-eval-ground-truth.ts` | **NEW** — JSON → DB sync |
| `scripts/audit-eval-dataset.ts` | **NEW** — Dataset audit tool |
| `scripts/run-rag-eval.ts` | Added validation + --force flag |

---

## Phase 3.5 Complete ✅
