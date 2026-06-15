# Test Architecture — Mimotes Testing Foundation

**Date:** 2026-06-13  
**Version:** 1.0

## Overview

```
mimotes/
├── vitest.config.ts              # Vitest configuration
├── package.json                  # test, test:watch, test:coverage scripts
├── tests/
│   ├── setup.ts                  # Global setup (Testing Library, cleanup)
│   ├── test-utils.ts             # Shared test utilities
│   ├── lib/                      # Library/module tests
│   │   ├── crypto.test.ts        # Sprint 1 — AES-256-GCM encryption
│   │   ├── url-security.test.ts  # Sprint 2 — SSRF protection
│   │   └── analytics.test.ts     # Sprint 3 — SQL injection audit
│   └── components/               # React component tests (future)
│       └── (empty)
```

## Configuration

### vitest.config.ts
- **Plugins:** `@vitejs/plugin-react` (JSX transform)
- **Path alias:** `@/*` → project root (matches tsconfig.json)
- **Environment:** `happy-dom` (DOM simulation)
- **Globals:** `true` (no need to import describe/it/expect)
- **Timeout:** 10 seconds per test
- **Reporter:** `verbose` (detailed output)

### Coverage (v8 provider)
- **Reporters:** text (terminal), json-summary (CI), html (browse)
- **Include:** `lib/**/*.ts`, `app/**/*.ts`, `app/**/*.tsx`
- **Exclude:** node_modules, tests, .next, *.d.ts, *.config.*
- **Thresholds:** Per-module for security-critical code

## Test Categories

### 1. Security Regression Tests (P0)
Protect against reintroduction of vulnerabilities fixed in Sprint 1–3.

| Test File | Protects | Tests |
|-----------|----------|-------|
| `crypto.test.ts` | Sprint 1 encryption | 16 tests |
| `url-security.test.ts` | Sprint 2 SSRF | 20 tests |
| `analytics.test.ts` | Sprint 3 SQL injection | 12 tests |

### 2. Unit Tests (P1)
Test individual functions in isolation.

### 3. Integration Tests (P2)
Test interactions between modules (requires DB mocking).

### 4. Component Tests (P3)
Test React components with Testing Library.

## Test Utilities

### test-utils.ts
- `generateTestEncryptionKey()` — 64-char hex key for crypto tests
- `withEncryptionKey(key)` — Set env var, return cleanup function
- `withoutEncryptionKey()` — Remove env var, return cleanup function

### Pattern: Environment Variable Isolation
```typescript
let cleanup: () => void;
beforeEach(() => {
  cleanup = withEncryptionKey(generateTestEncryptionKey());
});
afterEach(() => {
  cleanup(); // Restores original env
});
```

## Running Tests

```bash
npm test              # Run all tests once
npm run test:watch    # Watch mode (re-run on change)
npm run test:coverage # With coverage report
```

## CI Integration (Future)

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test
- name: Check coverage
  run: npm run test:coverage
```
