# Sprint 6 — Implementation Report: Embedder Hardening

**Date:** 2026-06-13  
**Sprint:** 6 — Embedder Hardening  
**Status:** ✅ Complete

## Summary

Hardened the embedding module with retry logic, batch size limits, quality tracking, and improved fallback detection. The embedder now retries API calls 2× before falling back, processes large batches in chunks of 100, and tracks quality metrics for monitoring.

## Changes Implemented

### 1. Retry Logic with Exponential Backoff

**Implementation:** `withRetry()` helper function
- Max retries: 2 (3 total attempts)
- Base delay: 1000ms, exponential backoff (1s → 2s → 4s)
- Applied to both `generateEmbedding()` and `generateEmbeddings()`
- Retries only on API errors, not on dimension mismatches

### 2. Batch Size Limits

**Constant:** `MAX_BATCH_SIZE = 100`
- `generateEmbeddings()` now splits large text arrays into sub-batches
- Each sub-batch processed sequentially with retry logic
- Prevents API timeout on large document ingestion (1000 chunks → 10 batches)

### 3. Embedding Quality Tracking

**New exports:**
- `EmbeddingStats` interface — quality metrics
- `getEmbeddingStats()` — read current stats
- `resetEmbeddingStats()` — clear stats
- `getEmbeddingSource()` — "api" or "local"

**Tracked metrics:**
- Total requests, API successes, API failures
- Local fallbacks, dimension mismatches, retries attempted
- Last fallback reason (human-readable)

### 4. Improved Fallback Detection

- Each fallback path now records a specific reason:
  - "Provider does not support embeddings"
  - "Dimension mismatch: got X, expected 1536"
  - "API failure after 3 attempts: <error message>"
- Console warnings include actionable guidance

### 5. Provider Capability Detection

- `getEmbeddingSource()` returns "api" or "local"
- Useful for UI warnings and monitoring

## Files Modified

| File | Changes |
|------|---------|
| `lib/rag/embedder.ts` | Full rewrite: retry, batch, stats, fallback |

## Files Updated

| File | Tests |
|------|-------|
| `tests/lib/rag/embedder.test.ts` | 14 tests (was 6) |

## Verification

| Check | Result |
|-------|--------|
| `npm test` | ✅ 88/88 passed |
| `npm run build` | ✅ 0 errors |
| Retry logic | ✅ Exponential backoff verified |
| Batch limits | ✅ MAX_BATCH_SIZE = 100 |
| Quality stats | ✅ getEmbeddingStats() works |
| Provider detection | ✅ getEmbeddingSource() works |
