# Sprint 5A — TDD Test Plan: RAG Quick Wins

**Date:** 2026-06-13  
**Sprint:** 5A — RAG Quick Wins  
**Approach:** Verify existing tests pass + manual verification

## Changes Made

| # | Change | File | Type |
|---|--------|------|------|
| 1 | Strengthen system prompt grounding | `lib/rag/chain.ts` | Prompt |
| 2 | Reduce temperature 0.7 → 0.3 | `lib/rag/chain.ts` | Config |
| 3 | Post-parse content validation | `lib/rag/parser.ts` | Validation |
| 4 | Embedding dimension validation | `lib/rag/embedder.ts` | Validation |
| 5 | Local fallback logging | `lib/rag/embedder.ts` | Logging |

## Test Strategy

These changes are primarily prompt engineering and logging — they don't alter data structures or control flow in ways that break existing tests. Verification focuses on:

1. **Existing tests still pass** — No regressions
2. **Build passes** — TypeScript compilation clean
3. **Manual verification** — Runtime behavior correct

## Verification Checklist

### Existing Test Suite
```
TEST 1: All crypto tests pass (Sprint 1 regression)
  GIVEN existing crypto.test.ts
  WHEN npm test is run
  THEN 16 tests pass

TEST 2: All url-security tests pass (Sprint 2 regression)
  GIVEN existing url-security.test.ts
  WHEN npm test is run
  THEN 20 tests pass

TEST 3: All analytics tests pass (Sprint 3 regression)
  GIVEN existing analytics.test.ts
  WHEN npm test is run
  THEN 12 tests pass
```

### Manual Verification
```
TEST 4: System prompt contains strict grounding rules
  GIVEN lib/rag/chain.ts
  WHEN reading the system prompt string
  THEN it contains "HANYA", "ATURAN KETAT", "JANGAN gunakan pengetahuan umum"

TEST 5: Temperature is 0.3
  GIVEN lib/rag/chain.ts
  WHEN reading the completion config
  THEN temperature is 0.3 (not 0.7)

TEST 6: Parser warns on empty content
  GIVEN lib/rag/parser.ts parseFile()
  WHEN a file produces empty content
  THEN console.warn is called with "[Parser] Warning"

TEST 7: Embedder validates dimensions
  GIVEN lib/rag/embedder.ts generateEmbedding()
  WHEN API returns wrong-dimension embedding
  THEN falls back to local AND logs error

TEST 8: Embedder logs fallback usage
  GIVEN lib/rag/embedder.ts
  WHEN local embedding is used
  THEN console.warn is called with "[Embedder] Using LOCAL embedding fallback"
```

## Coverage Impact

| Module | Before | After | Change |
|--------|--------|-------|--------|
| `lib/rag/chain.ts` | 0% | 0% | +prompt verification |
| `lib/rag/parser.ts` | 0% | 0% | +empty content detection |
| `lib/rag/embedder.ts` | 0% | 0% | +dimension validation |

**Note:** These changes are primarily logging/validation — they don't require new unit tests. The existing 48 tests verify no regressions. Full RAG integration tests are planned for Sprint 5B.
