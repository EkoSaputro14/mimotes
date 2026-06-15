# ADR-TESTING-FOUNDATION: Testing Infrastructure for Security Regression

**Status:** Accepted  
**Date:** 2026-06-13  
**Deciders:** Testing Foundation Sprint  
**Technical Story:** Establish testing infrastructure to protect Sprint 1–3 security fixes

## Context

Mimotes had **zero testing infrastructure** — no test framework, no test files, no test configuration. Sprint 1 (encryption), Sprint 2 (SSRF), and Sprint 3 (SQL injection) implemented critical security fixes but had no automated regression protection. A single code change could silently reintroduce vulnerabilities.

## Decision

### Test Framework: Vitest

| Choice | Decision | Rationale |
|--------|----------|-----------|
| **Framework** | Vitest | Native ESM, Vite-powered, compatible with Next.js, fast |
| **DOM environment** | happy-dom | Lighter than jsdom, sufficient for React component tests |
| **React testing** | @testing-library/react | Industry standard, tests behavior not implementation |
| **User interaction** | @testing-library/user-event | Realistic user interaction simulation |
| **Assertions** | Vitest built-in + @testing-library/jest-dom | DOM-specific matchers (toBeInTheDocument, etc.) |
| **Coverage** | v8 provider | Fast, built into V8 engine |
| **Globals** | `true` | describe/it/expect available without import |

### Test Structure

```
tests/
├── setup.ts                    # Testing Library setup, cleanup
├── test-utils.ts               # Shared utilities (key generation, env helpers)
├── lib/
│   ├── crypto.test.ts          # Sprint 1 — encryption regression
│   ├── url-security.test.ts    # Sprint 2 — SSRF regression
│   └── analytics.test.ts       # Sprint 3 — SQL injection regression
└── components/                 # Future: React component tests
    └── (empty)
```

### Coverage Strategy

| Module | Priority | Target | Rationale |
|--------|----------|--------|-----------|
| `lib/crypto.ts` | P0 | 90% | Sprint 1 — encryption is security-critical |
| `lib/url-security.ts` | P0 | 85% | Sprint 2 — SSRF protection is security-critical |
| `lib/analytics.ts` | P0 | 100% (audit) | Sprint 3 — source code audit for $queryRawUnsafe |
| Other lib/ | P1 | 60% | General regression |
| Components | P2 | 40% | UI behavior |

## Alternatives Considered

### 1. Jest
- **Rejected:** Slower, CJS-first, requires more configuration for ESM/Next.js compatibility.

### 2. Playwright (e2e only)
- **Rejected:** Too heavy for unit tests. Complement, not replace.

### 3. No testing
- **Rejected:** Security fixes without regression tests are fragile. Any refactor could reintroduce vulnerabilities.

## Consequences

### Positive
- Security regressions caught immediately on code change
- CI-ready (`npm test` in pipeline)
- Fast feedback loop (Vitest is ~10x faster than Jest)
- Coverage reports for security audit
- Foundation for future TDD workflow

### Negative
- 6 new devDependencies
- Test maintenance burden
- ~800ms test execution overhead

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Principles](https://testing-library.com/docs/guiding-principles)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
