# Sprint 3 — TDD Test Plan: SQL Injection Remediation

**Date:** 2026-06-13  
**Sprint:** Sprint 3 — SQL Injection Remediation  
**Approach:** Test-Driven Development (RED → GREEN → REFACTOR)

## Test Strategy

Focus on verifying that the vulnerable function `getDailyEventCounts()` correctly parameterizes all inputs, and that no `$queryRawUnsafe` remains in application code.

## Test Cases

### Phase 1: `getDailyEventCounts()` — SQL Injection Prevention

```
TEST 1: Normal eventTypes filter works
  GIVEN startDate, endDate, eventTypes=["chat_message", "document_upload"]
  WHEN getDailyEventCounts() is called
  THEN results include only matching event types

TEST 2: Empty eventTypes returns all types
  GIVEN startDate, endDate, eventTypes=undefined
  WHEN getDailyEventCounts() is called
  THEN results include all event types in range

TEST 3: SQL injection attempt in eventTypes is parameterized
  GIVEN eventTypes=["chat_message'; DROP TABLE analytics_events; --"]
  WHEN getDailyEventCounts() is called
  THEN the malicious string is treated as a literal value (not SQL)
  AND analytics_events table still exists

TEST 4: Single eventTypes entry
  GIVEN eventTypes=["chat_message"]
  WHEN getDailyEventCounts() is called
  THEN only chat_message events returned

TEST 5: eventTypes with special characters
  GIVEN eventTypes=["test'; SELECT 1; --"]
  WHEN getDailyEventCounts() is called
  THEN the value is treated as a literal string, not SQL
  AND no error thrown (just returns empty results)
```

### Phase 2: Codebase Audit — No $queryRawUnsafe

```
TEST 6: No $queryRawUnsafe in lib/ directory
  GIVEN all .ts files in lib/
  WHEN searching for "$queryRawUnsafe"
  THEN zero matches found

TEST 7: No $queryRawUnsafe in app/ directory
  GIVEN all .ts files in app/
  WHEN searching for "$queryRawUnsafe"
  THEN zero matches found

TEST 8: No string interpolation in SQL templates
  GIVEN all .ts files using $queryRaw or $executeRaw
  WHEN inspecting template literal contents
  THEN no `${variable}` appears inside SQL string construction
  AND all variable references are Prisma template parameters
```

### Phase 3: Existing Safe Patterns Verified

```
TEST 9: $queryRaw tagged templates work correctly
  GIVEN any function using prisma.$queryRaw`SELECT ...`
  WHEN the function is called
  THEN results are returned correctly
  AND interpolated values are parameterized

TEST 10: $executeRaw tagged templates work correctly
  GIVEN lib/prisma.ts setWorkspaceContext()
  WHEN called with a workspaceId
  THEN the value is parameterized in the SQL

TEST 11: pgvector queries remain safe
  GIVEN lib/rag/vectorstore.ts
  WHEN storeChunks() or searchSimilarChunks() is called
  THEN embedding vectors are properly parameterized
```

## Test Environment

- **Framework:** Manual audit + TypeScript compiler
- **Database:** PostgreSQL 16 with pgvector
- **Isolation:** Integration tests require DB connection

## Coverage Targets

| Module | Target | Focus |
|--------|--------|-------|
| `lib/analytics.ts` | 100% | getDailyEventCounts parameterization |
| Codebase audit | 100% | Zero $queryRawUnsafe in app code |
| Existing safe patterns | 100% | No regressions |

## Manual Verification

After implementation, verify manually:
1. `npm run build` passes without TypeScript errors
2. `grep -r '$queryRawUnsafe' lib/ app/` returns zero matches
3. Analytics page loads correctly (daily event chart renders)
4. No SQL syntax errors in server logs
