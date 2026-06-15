# Sprint: Optimization & Debt Reduction

> Date: 2025-06-05
> Phase: 5 (Post-Phase 5 optimization)
> Previous: Phase 5 AI Management — APPROVED with conditions
> Next: Phase 6 Workspace System (Pending)

---

## Objective

Address the most impactful security, performance, and code quality issues across the codebase before Phase 6. This sprint focuses on quick wins that improve production readiness without changing architecture. Every change is backward-compatible and independently deployable.

---

## Scope

### In Scope

#### 1. Security Quick Wins (DEBT-006, SEC-003)
- Add file size limit to upload route using MAX_FILE_SIZE env var (10MB default)
- Add rate limiting to upload endpoint (10/min per user)
- Fix SQL injection risk in getDailyEventCounts eventTypes interpolation

#### 2. Performance Optimizations (analytics)
- Replace getUniqueActiveUsers findMany+distinct with SQL COUNT(DISTINCT)
- Replace getCostAnalytics full-message-load with SQL-based token estimation
- Replace getChatAnalytics source-counting full-message-load with JSONB query
- Add pagination to /api/documents (legacy endpoint)

#### 3. Code Quality (PH5-001, PH5-002)
- Extract shared streaming helper to lib/stream-helpers.ts
- Initialize Vitest + add unit tests for RAG chunker and parser

### Out of Scope (Next Sprint)
- SEC-001: API key encryption at rest (requires design decision)
- Phase 6: Workspace System (requires separate sprint)
- TypeScript strict mode migration (high effort, separate sprint)
- CI/CD pipeline (depends on tests existing first)
- Replace prompt() browser dialog (UX, not optimization)

---

## Risks

| # | Risk | Severity | Likelihood | Mitigation |
|---|------|----------|------------|------------|
| R-01 | SQL changes in analytics could break chart rendering | Medium | Low | Test all analytics API responses before/after |
| R-02 | File size limit could break legitimate large uploads | Low | Low | Default 10MB is generous; env-configurable |
| R-03 | Vitest setup could conflict with Next.js build config | Low | Medium | Use vitest.config.ts separate from next.config |

---

## Acceptance Criteria

1. POST /api/upload rejects files > MAX_FILE_SIZE (default 10MB) with 413 error — verified by: curl upload with oversized file
2. POST /api/upload returns 429 after 10 requests/min — verified by: rapid curl sequence
3. GET /api/dashboard/usage returns same data structure but uses <50% memory for 1000+ messages — verified by: response shape unchanged, code review
4. GET /api/documents supports ?page=1&limit=20 pagination — verified by: curl with page params
5. Shared streaming helper used by both playground and test endpoints — verified by: no duplicate streaming code in routes
6. `npx vitest run` passes with ≥3 test cases — verified by: test output
7. `npm run build` exits with 0 errors

### Build Gate
- [ ] `npm run build` exits with 0 errors
- [ ] No existing routes modified unless explicitly scoped above
- [ ] All existing API routes still return correct responses

### Quality Gate
- [ ] `.ai/TECH_DEBT.md` updated (resolved items marked)
- [ ] `.ai/REVIEWS/` updated with sprint review
- [ ] Tests pass: `npx vitest run`

---

## Review Checklist

Architecture
[x] No new models or routes added
[x] All changes are internal refactors or additive

Security
[x] File size limit prevents DoS via large uploads
[x] Upload rate limiting added
[x] SQL injection in analytics fixed

Testing
[x] Vitest initialized
[x] Unit tests for chunker + parser

Performance
[x] Analytics no longer loads full message tables into memory
[x] /api/documents paginated

---

## Decision Log

### D-01: Keep MAX_FILE_SIZE default at 10MB
- **Context**: Env var exists but was never read. PDFs and XLSX can be large.
- **Decision**: 10MB default, configurable via env. Matches typical SaaS limits.
- **Alternatives considered**: 5MB (too restrictive for PDFs), unlimited (DoS risk)
- **Consequence**: Users with larger files need env override.

### D-02: Vitest over Jest
- **Context**: No test framework exists. Next.js 16 works well with Vitest.
- **Decision**: Use Vitest with @vitejs/plugin-react.
- **Alternatives considered**: Jest (heavier, slower with ESM), Playwright (E2E only)
- **Consequence**: Vitest is fast, ESM-native, minimal config.

### D-03: SQL-based analytics instead of in-memory
- **Context**: getCostAnalytics loads all messages to estimate tokens.
- **Decision**: Use SUM(LENGTH(content))/4 for token estimation in SQL.
- **Alternatives considered**: Keep in-memory (simpler but OOM risk), add token column (requires migration)
- **Consequence**: Slightly less accurate (character-based), but bounded memory.

---

## Rollback Strategy

If file size limit breaks uploads:
- Set MAX_FILE_SIZE=0 to disable (add this check)

If SQL analytics breaks:
- Revert analytics.ts changes, old code still works

If Vitest conflicts with build:
- Remove vitest.config.ts and tests/, no impact on app

---

*This document is for management and review. See `.ai/execution-brief.md` for implementation tasks.*
