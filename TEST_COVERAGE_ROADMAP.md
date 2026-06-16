# Test Coverage Roadmap — Mimotes

**Date:** 2026-06-13  
**Current Status:** Phase 1 Complete (48 tests)

## Coverage Overview

### Current Coverage (Phase 1)

| Module | Tests | Coverage | Priority |
|--------|-------|----------|----------|
| `lib/crypto.ts` | 16 | ~90% | P0 🔴 |
| `lib/url-security.ts` | 20 | ~85% | P0 🔴 |
| `lib/analytics.ts` | 12 | 100% (audit) | P0 🔴 |
| **Total** | **48** | — | — |

### Target Coverage (Full)

| Module | Current | Target | Gap | Phase |
|--------|---------|--------|-----|-------|
| `lib/crypto.ts` | 90% | 95% | 5% | 2 |
| `lib/url-security.ts` | 85% | 90% | 5% | 2 |
| `lib/analytics.ts` | 100% (audit) | 100% | 0% | ✅ |
| `lib/settings.ts` | 0% | 80% | 80% | 2 |
| `lib/prisma.ts` | 0% | 70% | 70% | 2 |
| `lib/rag/chunker.ts` | 0% | 60% | 60% | 2 |
| `lib/rag/parser.ts` | 0% | 50% | 50% | 3 |
| `lib/rag/embedder.ts` | 0% | 40% | 40% | 3 |
| `lib/rag/vectorstore.ts` | 0% | 40% | 40% | 3 |
| `lib/auth.ts` | 0% | 50% | 50% | 3 |
| `lib/ratelimit.ts` | 0% | 60% | 60% | 2 |
| `lib/audit.ts` | 0% | 50% | 50% | 3 |
| `lib/usage.ts` | 0% | 50% | 50% | 3 |
| API routes (~30) | 0% | 40% | 40% | 4 |
| Components (~30) | 0% | 30% | 30% | 5 |

## Milestones

### Milestone 1: Security Foundation ✅ COMPLETE
- **Date:** 2026-06-13
- **Tests:** 48
- **Coverage:** Security modules 85-100%
- **Status:** All tests pass, build verified

### Milestone 2: Core Modules (Target: Sprint 4)
- **Tests:** +40 (total: 88)
- **New:** settings, prisma, chunker, ratelimit
- **Focus:** Integration with encryption layer

### Milestone 3: RAG Pipeline (Target: Sprint 5)
- **Tests:** +20 (total: 108)
- **New:** parser, embedder, vectorstore, auth
- **Focus:** RAG pipeline correctness

### Milestone 4: API Routes (Target: Sprint 6)
- **Tests:** +20 (total: 128)
- **New:** upload, settings, chat, documents
- **Focus:** Endpoint integration tests

### Milestone 5: Components (Target: Sprint 7)
- **Tests:** +30 (total: 158)
- **New:** ChatWindow, UploadForm, AISettingsForm
- **Focus:** UI behavior tests

## Coverage by Security Sprint

| Sprint | Module | Tests | Regression Protected |
|--------|--------|-------|---------------------|
| Sprint 1 | `lib/crypto.ts` | 16 | ✅ Encryption roundtrip, idempotency, graceful degradation |
| Sprint 2 | `lib/url-security.ts` | 20 | ✅ SSRF (protocol, IP, metadata), filename sanitization |
| Sprint 3 | `lib/analytics.ts` | 12 | ✅ No $queryRawUnsafe, no string interpolation, ANY() usage |

## Test Execution Metrics

| Metric | Value |
|--------|-------|
| Total tests | 48 |
| Pass rate | 100% |
| Execution time | ~800ms |
| Files tested | 6 (3 test + 3 source) |
| Security regressions protected | 3 sprints |

## CI Integration Plan

```yaml
# Run on every PR
- npm test

# Run with coverage on main
- npm run test:coverage

# Fail if coverage drops below threshold
- coverage thresholds enforced in vitest.config.ts
```
