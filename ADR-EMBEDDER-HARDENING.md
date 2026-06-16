# ADR-EMBEDDER-HARDENING: Embedder Reliability & Quality

**Status:** Accepted  
**Date:** 2026-06-13  
**Deciders:** Sprint 6  
**Technical Story:** Hardening the embedding stage of the RAG pipeline

## Context

The RAG Reliability Audit identified the embedder as HIGH risk:
- No retry logic — single API failure = immediate fallback to poor-quality local embeddings
- No batch size limits — 1000-chunk document = single API call with 1000 inputs
- Silent quality degradation — no visibility into when local embeddings are used
- No quality metrics — impossible to diagnose retrieval issues

## Decision

### 1. Retry Logic with Exponential Backoff

- **Max retries:** 2 (3 total attempts)
- **Base delay:** 1000ms
- **Backoff:** Exponential (1s → 2s → 4s)
- **Applied to:** Both single and batch embedding API calls

### 2. Batch Size Limits

- **MAX_BATCH_SIZE:** 100 texts per API call
- **Behavior:** Splits large batches into sub-batches of 100
- **Applied to:** `generateEmbeddings()` only (single embeddings unaffected)

### 3. Embedding Quality Tracking

New `EmbeddingStats` interface exposes:
- `totalRequests` — total embedding requests
- `apiSuccesses` — successful API calls
- `apiFailures` — failed API calls (after retries)
- `localFallbacks` — times local embedding was used
- `dimensionMismatches` — wrong-dimension API responses
- `retriesAttempted` — total retry attempts
- `lastFallbackReason` — human-readable reason for last fallback

Exported functions:
- `getEmbeddingStats()` — read current stats
- `resetEmbeddingStats()` — clear stats (for testing)
- `getEmbeddingSource()` — returns "api" or "local"

### 4. Provider Capability Detection

- `providerSupportsEmbeddings()` — checks if current provider supports embeddings
- `getEmbeddingSource()` — returns human-readable embedding source

## Consequences

### Positive
- API failures retried 2× before fallback (significantly reduces false fallbacks)
- Batch processing prevents API timeout on large documents
- Quality stats enable monitoring and alerting
- Clear fallback reasons aid debugging

### Negative
- Retry adds up to 7s latency on persistent failures
- Batch splitting adds slight overhead for large document ingestion
- Stats object grows over time (negligible memory)
