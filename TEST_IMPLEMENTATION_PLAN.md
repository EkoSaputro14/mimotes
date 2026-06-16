# Test Implementation Plan — Mimotes Testing Foundation

**Date:** 2026-06-13  
**Status:** Phase 1 Complete

## Phase 1: Foundation (COMPLETE ✅)

### Infrastructure
- [x] Install Vitest + Testing Library + happy-dom
- [x] Create `vitest.config.ts`
- [x] Create `tests/setup.ts` (Testing Library config)
- [x] Create `tests/test-utils.ts` (shared utilities)
- [x] Add npm scripts (`test`, `test:watch`, `test:coverage`)

### Security Regression Tests
- [x] `tests/lib/crypto.test.ts` — 16 tests for Sprint 1
- [x] `tests/lib/url-security.test.ts` — 20 tests for Sprint 2
- [x] `tests/lib/analytics.test.ts` — 12 tests for Sprint 3

### Verification
- [x] `npm test` passes (48/48 tests)
- [x] `npm run build` passes (0 errors)

## Phase 2: Core Module Coverage (NEXT)

### Priority P0 — Security-Adjacent Modules
- [ ] `tests/lib/settings.test.ts` — encrypt/decrypt integration with settings
  - setSetting encrypts secret keys
  - getSetting decrypts on read
  - backward compatibility with plaintext
  - cache invalidation

- [ ] `tests/lib/prisma.test.ts` — workspace context
  - setWorkspaceContext parameterized
  - getWorkspaceContext safe

### Priority P1 — Business Logic
- [ ] `tests/lib/rag/chunker.test.ts` — text chunking
  - paragraph splitting
  - sentence splitting
  - empty input handling

- [ ] `tests/lib/rag/parser.test.ts` — file parsing
  - parseTXT basic
  - parseCSV basic
  - sanitizeText unicode

- [ ] `tests/lib/ratelimit.test.ts` — rate limiting
  - allows within limit
  - blocks over limit
  - window reset

## Phase 3: API Route Tests (FUTURE)

### Integration Tests (require DB mock)
- [ ] `tests/api/upload.test.ts` — upload endpoint
  - SSRF protection integration
  - filename sanitization
  - file size validation

- [ ] `tests/api/settings.test.ts` — settings endpoint
  - API key masking
  - encryption on write

## Phase 4: Component Tests (FUTURE)

### React Component Tests
- [ ] `tests/components/chat/ChatWindow.test.tsx`
- [ ] `tests/components/documents/UploadForm.test.tsx`
- [ ] `tests/components/settings/AISettingsForm.test.tsx`

## Test Count Targets

| Phase | Tests | Coverage Target |
|-------|-------|----------------|
| Phase 1 (current) | 48 | Security modules 90%+ |
| Phase 2 | +40 | Core modules 60%+ |
| Phase 3 | +20 | API routes 50%+ |
| Phase 4 | +30 | Components 40%+ |
| **Total** | **~138** | **Overall 50%+** |
