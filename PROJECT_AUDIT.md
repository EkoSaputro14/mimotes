# PROJECT_AUDIT.md — Comprehensive Mimotes Audit

**Audit Date:** 2026-06-06
**Auditor:** Principal Software Architect
**Scope:** Full codebase — Architecture, Security, Performance, SaaS Readiness
**Version:** v0.1.0 (pre-production)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Review](#architecture-review)
3. [Security Audit](#security-audit)
4. [Database Review](#database-review)
5. [RAG Pipeline Review](#rag-pipeline-review)
6. [API Design Review](#api-design-review)
7. [Frontend & UX Review](#frontend--ux-review)
8. [Performance Review](#performance-review)
9. [SaaS Readiness Review](#saas-readiness-review)
10. [Developer Experience Review](#developer-experience-review)
11. [Scoring Summary](#scoring-summary)

---

## Executive Summary

Mimotes is a well-structured RAG chatbot built on Next.js 16 with a clean modular architecture. The codebase demonstrates solid engineering fundamentals — Prisma schema design, multi-provider AI abstraction, Docker multi-stage builds, and a functional RAG pipeline. However, **the application is not production-ready** due to critical security gaps (unauthenticated endpoints, no authorization model, SQL injection risk), zero test coverage, and missing SaaS infrastructure (multi-tenancy, billing, API keys).

**Overall Assessment:** Strong prototype / early beta. Needs 4-6 weeks of focused hardening before any production or commercial deployment.

---

## Architecture Review

### Strengths
- Clean Next.js App Router structure with proper route groups (`(auth)`, `(admin)`)
- Well-separated RAG pipeline: parser → chunker → embedder → vectorstore → chain
- Multi-provider AI abstraction with preset configuration
- Docker multi-stage build (5 stages) with proper layer caching
- Prisma singleton pattern for connection reuse
- Standalone output mode for Docker optimization

### Findings

**A-01 | MEDIUM | Missing middleware.ts for Route Protection**
- **Description:** No `middleware.ts` exists at the project root. All route protection is handled individually in each route handler or page component, leading to inconsistent enforcement.
- **Impact:** Routes can be accidentally left unprotected. Dashboard stats, health checks, and analytics are currently fully public.
- **Recommended Fix:** Create `middleware.ts` with NextAuth middleware to protect all `/dashboard`, `/ai`, `/analytics`, `/knowledge`, `/admin`, and `/api/admin/*` routes in one place.
- **Files:** `middleware.ts` (new), `lib/auth.ts`

**A-02 | LOW | No API versioning strategy**
- **Description:** All 40 API routes live under `/api/` with no version prefix. Breaking changes will require coordinating client and server updates.
- **Impact:** Difficult to evolve API without breaking existing integrations (MCP, widget, future mobile app).
- **Recommended Fix:** Adopt `/api/v1/` prefix and plan for `/api/v2/` when breaking changes are needed.
- **Files:** All `app/api/*/route.ts`

**A-03 | MEDIUM | Monolithic Next.js server**
- **Description:** All functionality (auth, RAG, analytics, MCP, file processing) runs in a single Next.js process. Heavy document processing blocks the event loop.
- **Impact:** A large PDF upload can stall all concurrent requests. No horizontal scaling per-service.
- **Recommended Fix:** Extract document processing into a background job queue (BullMQ + Redis) or a separate worker service. Keep Next.js as the API/web layer only.
- **Files:** `app/api/upload/route.ts`, `lib/rag/chain.ts`

**A-04 | LOW | No error boundary strategy**
- **Description:** No `error.tsx` files exist in the app routes. Unhandled errors will show Next.js default error page.
- **Impact:** Poor user experience on runtime errors. No structured error reporting.
- **Recommended Fix:** Add `error.tsx` at key route boundaries (dashboard, chat, knowledge) with user-friendly fallback UI and Sentry/logging integration.
- **Files:** `app/dashboard/error.tsx` (new), `app/chat/error.tsx` (new)

---

## Security Audit

### Critical Findings

**S-01 | CRITICAL | Unauthenticated API Endpoints — Data Exposure**
- **Description:** 11 API routes have NO authentication checks:
  - `GET /api/chat/sessions` — Lists ALL chat sessions (no userId filter)
  - `GET /api/dashboard/stats` — Exposes all document/session/message counts
  - `GET /api/dashboard/usage` — Full usage analytics
  - `GET /api/dashboard/cost` — Cost data
  - `GET /api/dashboard/top-documents` — All document metadata
  - `GET /api/dashboard/health` — System internals
  - `POST /api/analytics/events` — Spoof analytics events
  - `POST /api/mcp/route.ts` — MCP protocol access
  - `GET/POST /api/auth/[...nextauth]` — Auth endpoints (expected)
  - `POST /api/auth/register` — Registration (should be rate-limited or disabled)
- **Impact:** Any anonymous user can enumerate all chat sessions, view dashboard metrics, and spoof analytics. The chat sessions endpoint returns full message content without auth.
- **Recommended Fix:** Add `auth()` check to ALL protected endpoints. Use middleware for blanket protection.
- **Files:** `app/api/chat/sessions/route.ts`, `app/api/dashboard/*/route.ts`, `app/api/analytics/events/route.ts`

**S-02 | CRITICAL | Chat Session IDOR (Insecure Direct Object Reference)**
- **Description:** `POST /api/chat` accepts any `sessionId` without verifying ownership. An attacker can inject messages into ANY session by guessing/brute-forcing session UUIDs.
- **Impact:** Session hijacking, data injection, conversation tampering.
- **Recommended Fix:** Verify `session.user.id === chatSession.userId` before allowing message insertion. For anonymous sessions, use a signed token or IP-based binding.
- **Files:** `app/api/chat/route.ts` (lines 30-50)

**S-03 | CRITICAL | Chat Session Delete Without Auth**
- **Description:** `DELETE /api/chat/sessions?sessionId=X` has NO authentication. Anyone can delete any chat session.
- **Impact:** Complete data loss of conversations.
- **Recommended Fix:** Add `auth()` check and verify session ownership before deletion.
- **Files:** `app/api/chat/sessions/route.ts` (DELETE handler)

### High Findings

**S-04 | HIGH | SQL Injection Risk in Analytics**
- **Description:** `lib/analytics.ts` line 80 uses string interpolation in `$queryRawUnsafe`:
  ```typescript
  const whereType = eventTypes?.length
    ? `AND event_type IN (${eventTypes.map((t) => `'${t}'`).join(",")})`
    : "";
  ```
  While `eventTypes` currently comes from internal code, this pattern is dangerous. If any future caller passes user-controlled data, it becomes a SQL injection vector.
- **Impact:** Potential SQL injection if eventTypes source changes.
- **Recommended Fix:** Use Prisma parameterized queries or validate eventTypes against a whitelist before interpolation.
- **Files:** `lib/analytics.ts` (line 80)

**S-05 | HIGH | No Role-Based Access Control**
- **Description:** The system has only "authenticated user" vs "anonymous". There is no admin vs user role distinction. The `User` model has no `role` field.
- **Impact:** Any registered user can access admin settings, AI configuration, MCP server management. Registration is open (no admin approval).
- **Recommended Fix:** Add `role` field to User model (admin/user). Protect admin routes with role check. Disable open registration or add admin approval.
- **Files:** `prisma/schema.prisma`, `lib/auth.ts`, `app/api/admin/*/route.ts`

**S-06 | HIGH | No File Size Limits on Upload**
- **Description:** `POST /api/upload` accepts any file size. The `MAX_FILE_SIZE` env var defined in memory context is never actually read in the code.
- **Impact:** Denial of service via large file uploads. Storage exhaustion.
- **Recommended Fix:** Add file size validation (e.g., 10MB limit) before writing to disk. Read `MAX_FILE_SIZE` env var.
- **Files:** `app/api/upload/route.ts`

**S-07 | HIGH | Hardcoded Default Secrets**
- **Description:** `docker-compose.yml` contains hardcoded defaults:
  - `NEXTAUTH_SECRET: "mimotes-super-secret-change-me"`
  - `ADMIN_PASSWORD: "admin123"`
  - DB password: `mimotes_password`
- **Impact:** If deployed without changing defaults, the system is immediately compromised.
- **Recommended Fix:** Remove defaults. Force users to set secrets via `.env`. Fail startup if secrets are at default values.
- **Files:** `docker-compose.yml`

**S-08 | HIGH | Open Registration Without Rate Limiting**
- **Description:** `POST /api/auth/register` has no rate limiting. Anyone can create unlimited accounts.
- **Impact:** Spam accounts, resource exhaustion, abuse.
- **Recommended Fix:** Add rate limiting to registration. Consider admin-only registration or email verification.
- **Files:** `app/api/auth/register/route.ts`

**S-09 | HIGH | No CSRF Protection**
- **Description:** No CSRF tokens or SameSite cookie configuration. Server actions and API routes are vulnerable to CSRF attacks.
- **Impact:** Attackers can perform actions on behalf of authenticated users via malicious websites.
- **Recommended Fix:** Configure NextAuth cookies with `sameSite: "lax"` or `"strict"`. Add CSRF token validation for state-changing operations.
- **Files:** `lib/auth.ts`

### Medium Findings

**S-10 | MEDIUM | API Keys Stored in Plaintext**
- **Description:** AI provider API keys and MCP server API keys are stored as plaintext in the `settings` and `mcp_servers` database tables.
- **Impact:** Database compromise exposes all API keys.
- **Recommended Fix:** Encrypt API keys at rest using AES-256 with a key derived from NEXTAUTH_SECRET.
- **Files:** `lib/settings.ts`, `lib/mcp/manager.ts`

**S-11 | MEDIUM | No Content Security Policy Headers**
- **Description:** No CSP, X-Frame-Options, X-Content-Type-Options, or Referrer-Policy headers configured.
- **Impact:** Vulnerable to XSS, clickjacking, MIME sniffing attacks.
- **Recommended Fix:** Add security headers in `next.config.ts` or middleware.
- **Files:** `next.config.ts`

**S-12 | MEDIUM | Upload Path Traversal Risk**
- **Description:** File upload saves to `public/uploads/` with `Date.now()-filename` naming. While the current naming prevents overwrites, there's no validation that the filename doesn't contain path traversal characters.
- **Impact:** Potential path traversal if filename contains `../`.
- **Recommended Fix:** Sanitize filename with `path.basename()` and validate no directory separators.
- **Files:** `app/api/upload/route.ts` (line 90)

**S-13 | MEDIUM | Health Check Still Uses Old Pattern**
- **Description:** The health check at `app/api/dashboard/health/route.ts` was recently fixed but the fix may have been applied to a different copy. The version in the Docker container may still use `getSettings()` instead of `getSettingWithFallback()`.
- **Impact:** AI Provider shows "Degraded" in production Docker deployment.
- **Recommended Fix:** Verify the fix is in the correct source directory and rebuild the Docker image.
- **Files:** `app/api/dashboard/health/route.ts`

---

## Database Review

**D-01 | MEDIUM | Missing Indexes on Hot Queries**
- **Description:** Several frequently queried columns lack indexes:
  - `chat_messages.session_id` (queried for session history)
  - `chat_messages.created_at` (ordered in lists)
  - `chat_sessions.user_id` (filtered in session lists)
  - `documents.user_id` (filtered in all document queries)
  - `document_chunks.document_id` (queried for document chunks)
- **Impact:** Slow queries as data grows. Full table scans on chat_messages.
- **Recommended Fix:** Add Prisma `@@index` directives or raw SQL indexes.
- **Files:** `prisma/schema.prisma`

**D-02 | LOW | No Database Backup Strategy**
- **Description:** No backup configuration in docker-compose. PostgreSQL data volume has no backup automation.
- **Impact:** Data loss on volume corruption or accidental deletion.
- **Recommended Fix:** Add a backup service (e.g., `pg_dump` cron) or use a managed database with automatic backups.
- **Files:** `docker-compose.yml`

**D-03 | LOW | UUID Generation at Application Level**
- **Description:** UUIDs are generated by Prisma/PostgreSQL using `gen_random_uuid()`. This is fine, but the `vectorstore.ts` uses `gen_random_uuid()` directly in raw SQL, bypassing Prisma's ID generation.
- **Impact:** Minor inconsistency, no functional impact.
- **Recommended Fix:** Use Prisma's `create()` for consistency where possible.
- **Files:** `lib/rag/vectorstore.ts`

**D-04 | MEDIUM | No ChatMessage Content Size Limit**
- **Description:** `ChatMessage.content` is unbounded `Text` type. No application-level validation on message length.
- **Impact:** Memory exhaustion from very long messages, storage bloat.
- **Recommended Fix:** Add max length validation (e.g., 10,000 chars) in the chat API route.
- **Files:** `app/api/chat/route.ts`

---

## RAG Pipeline Review

**R-01 | HIGH | Local Embedding Fallback Produces Low-Quality Results**
- **Description:** `lib/rag/embedder.ts` uses feature hashing (trigram + word hashing) as a fallback when the AI provider doesn't support embeddings. This produces vectors with very poor semantic similarity.
- **Impact:** When using Mimo Pro (which doesn't support embeddings), RAG retrieval quality is near-random. Users will get irrelevant answers.
- **Recommended Fix:** Use a dedicated embedding provider (e.g., OpenAI text-embedding-3-small) even when the chat model is Mimo. Allow separate embedding provider configuration.
- **Files:** `lib/rag/embedder.ts`

**R-02 | MEDIUM | No Document Re-processing on Re-upload**
- **Description:** When a document fails processing (status="failed"), there's no retry mechanism. Users must delete and re-upload.
- **Impact:** Poor UX for failed documents. No way to retry without manual intervention.
- **Recommended Fix:** Add a retry button in the UI and a `POST /api/documents/[id]/retry` endpoint.
- **Files:** `app/api/documents/[id]/route.ts`

**R-03 | MEDIUM | Synchronous Document Processing**
- **Description:** `processDocument()` in `app/api/upload/route.ts` is called with `.catch()` (fire-and-forget). This means:
  - No progress tracking for the user
  - Errors are silently logged
  - No retry on failure
- **Impact:** Users see "processing" status indefinitely if processing fails.
- **Recommended Fix:** Implement a job queue with status tracking, progress events, and retry logic.
- **Files:** `app/api/upload/route.ts`

**R-04 | LOW | Chunker Has Edge Cases**
- **Description:** `lib/rag/chunker.ts` splits by paragraphs then sentences. Edge cases:
  - Documents with no paragraph breaks become one giant chunk
  - The `chunkSize * 2` threshold for sentence splitting is arbitrary
  - No handling of markdown, code blocks, or structured content
- **Impact:** Inconsistent chunk quality across document types.
- **Recommended Fix:** Add document-type-aware chunking. Handle code blocks, tables, and markdown headers as chunk boundaries.
- **Files:** `lib/rag/chunker.ts`

**R-05 | MEDIUM | No Embedding Model Flexibility**
- **Description:** Embedding model is tied to the chat provider. If using Mimo for chat, you must use Mimo's embedding (which doesn't exist) or fall back to feature hashing.
- **Impact:** Forced to use low-quality local embeddings when the chat provider doesn't support embeddings.
- **Recommended Fix:** Allow separate embedding provider configuration (e.g., chat via Mimo, embeddings via OpenAI).
- **Files:** `lib/ai-provider.ts`, `lib/rag/embedder.ts`

---

## API Design Review

**API-01 | MEDIUM | Inconsistent Error Response Format**
- **Description:** Some routes return `{ error: string }`, others return `{ message: string }`, and some return plain strings. No standardized error envelope.
- **Impact:** Difficult for clients to handle errors consistently.
- **Recommended Fix:** Adopt a standard error format: `{ error: { code: string, message: string, details?: unknown } }`.
- **Files:** All `app/api/*/route.ts`

**API-02 | MEDIUM | No Pagination on Session List**
- **Description:** `GET /api/chat/sessions` returns only the last 20 sessions with no pagination support.
- **Impact:** Users with many sessions can't access older conversations.
- **Recommended Fix:** Add cursor-based or offset pagination with `page` and `limit` query params.
- **Files:** `app/api/chat/sessions/route.ts`

**API-03 | LOW | No Request Validation Library Usage**
- **Description:** Zod is installed but only used in MCP tools. API routes use manual `if (!field)` checks instead of schema validation.
- **Impact:** Inconsistent validation, easy to miss edge cases.
- **Recommended Fix:** Create Zod schemas for all API request bodies and use `z.parse()` for validation.
- **Files:** All `app/api/*/route.ts`

**API-04 | MEDIUM | Sources Header Overload**
- **Description:** Chat API returns sources via `X-Sources` header as URL-encoded JSON. This is fragile and limited by header size constraints.
- **Impact:** Large source lists may be truncated. Clients must decode URL-encoded JSON.
- **Recommended Fix:** Return sources in the streaming response as a final JSON message or as a separate `GET /api/chat/sessions/[id]/sources` endpoint.
- **Files:** `app/api/chat/route.ts`

---

## Frontend & UX Review

**UX-01 | MEDIUM | No Loading States for Dashboard**
- **Description:** Dashboard page uses Suspense boundaries but the stat cards show placeholder dashes. No skeleton loading animation for a polished feel.
- **Impact:** Perceived sluggishness on initial load.
- **Recommended Fix:** Add skeleton loading states matching the final card layout.
- **Files:** `app/dashboard/page.tsx`, `components/dashboard/stat-card.tsx`

**UX-02 | MEDIUM | No Dark Mode Support**
- **Description:** ThemeProvider is configured with `defaultTheme="light"` and `enableSystem`, but no toggle button exists in the UI.
- **Impact:** Users can't switch themes despite the infrastructure being in place.
- **Recommended Fix:** Add a theme toggle in the top navigation bar.
- **Files:** `components/layout/top-nav.tsx`

**UX-03 | LOW | No Toast Error Details**
- **Description:** Error toasts show generic messages like "Terjadi kesalahan" without actionable details.
- **Impact:** Users can't troubleshoot issues. Support can't diagnose from user reports.
- **Recommended Fix:** Include error codes or "Contact support" links in error toasts.
- **Files:** `components/chat/chat-window.tsx`, `components/auth/login-form.tsx`

**UX-04 | MEDIUM | No Mobile-Responsive Chat Input**
- **Description:** Chat input textarea auto-grows but the send button may overlap on small screens. No dedicated mobile keyboard handling.
- **Impact:** Poor mobile chat experience.
- **Recommended Fix:** Test and optimize chat input for mobile viewports. Add proper touch handling.
- **Files:** `components/chat/chat-window.tsx`

**UX-05 | LOW | Accessibility Gaps**
- **Description:** No ARIA labels on interactive elements. No focus management. No skip-to-content link. Color contrast may fail WCAG AA in some areas.
- **Impact:** Not accessible to screen reader users. May fail compliance requirements.
- **Recommended Fix:** Add ARIA labels, focus traps for modals, skip navigation links, and audit color contrast.
- **Files:** All `components/**/*.tsx`

---

## Performance Review

**P-01 | MEDIUM | N+1 Query in Dashboard Stats**
- **Description:** `GET /api/dashboard/stats` makes 10 parallel queries but each is a simple count. As data grows, the `documentsByStatus` and `documentsByType` groupBy queries will slow down without proper indexes.
- **Impact:** Dashboard load time increases with data volume.
- **Recommended Fix:** Add composite indexes. Consider caching stats with a 60-second TTL.
- **Files:** `app/api/dashboard/stats/route.ts`

**P-02 | MEDIUM | No Response Caching**
- **Description:** No Cache-Control headers on any API response. Every request hits the database.
- **Impact:** Unnecessary database load for frequently accessed data (dashboard stats, session lists).
- **Recommended Fix:** Add `Cache-Control: private, max-age=30` for read-heavy endpoints. Use `stale-while-revalidate` for dashboard data.
- **Files:** All `app/api/dashboard/*/route.ts`

**P-03 | LOW | Settings Cache is Process-Local**
- **Description:** `lib/settings.ts` uses in-memory cache (30s TTL). In a multi-instance deployment, settings changes on one instance won't be seen by others until cache expires.
- **Impact:** Settings propagation delay in scaled deployments.
- **Recommended Fix:** Use Redis pub/sub or shared cache for multi-instance coordination.
- **Files:** `lib/settings.ts`

**P-04 | MEDIUM | Large Bundle Size Risk**
- **Description:** Dependencies include `recharts` (charting), `xlsx` (spreadsheet), `cheerio` (HTML parsing), `mammoth` (DOCX), `pdf-parse`. These are large libraries that may bloat the client bundle.
- **Impact:** Slow initial page load, especially on mobile.
- **Recommended Fix:** Verify tree-shaking. Move `xlsx`, `cheerio`, `mammoth`, `pdf-parse` to server-only (already in `serverExternalPackages`). Use dynamic imports for heavy client components.
- **Files:** `next.config.ts`, `package.json`

---

## SaaS Readiness Review

**SAAS-01 | CRITICAL | No Multi-Tenancy**
- **Description:** The system is single-tenant. All users share the same document pool. There's no workspace, organization, or tenant isolation.
- **Impact:** Cannot offer SaaS without complete data isolation between customers.
- **Recommended Fix:** Add `workspaceId` or `organizationId` to all models. Filter all queries by tenant. This is a fundamental architectural change.
- **Files:** `prisma/schema.prisma` (all models), all `app/api/*/route.ts`

**SAAS-02 | CRITICAL | No Billing / Subscription System**
- **Description:** No payment integration, no usage quotas, no plan limits.
- **Impact:** Cannot monetize the product.
- **Recommended Fix:** Integrate Stripe. Add plan-based limits (documents, messages, storage). Track usage per tenant.
- **Files:** New: `lib/billing.ts`, `app/api/billing/*`, `prisma/schema.prisma`

**SAAS-03 | HIGH | No API Key Authentication**
- **Description:** No API key system for programmatic access. MCP integration requires database-stored server configs.
- **Impact:** Cannot offer API access to customers. No way to integrate with external tools securely.
- **Recommended Fix:** Add API key model with scoped permissions, rate limits per key, and key rotation.
- **Files:** New: `lib/api-keys.ts`, `middleware.ts`

**SAAS-04 | HIGH | No Usage Metering**
- **Description:** Analytics track events but don't track per-user/per-tenant usage metrics (messages sent, documents uploaded, storage used).
- **Impact:** Can't enforce plan limits or generate invoices.
- **Recommended Fix:** Add usage counters per tenant. Track: messages, documents, storage, API calls.
- **Files:** `lib/analytics.ts`, `prisma/schema.prisma`

**SAAS-05 | HIGH | No Public Widget / Embed**
- **Description:** No embeddable chat widget for customer websites.
- **Impact:** Missing key SaaS distribution channel.
- **Recommended Fix:** Create a JS embed script that loads an iframe with the chat interface.
- **Files:** New: `app/widget/`, `public/embed.js`

**SAAS-06 | MEDIUM | No White-Label Support**
- **Description:** No branding customization. Logo, colors, and domain are hardcoded.
- **Impact:** Cannot offer white-label solutions to enterprise customers.
- **Recommended Fix:** Add theme customization per workspace (logo, primary color, custom domain).
- **Files:** `prisma/schema.prisma`, `app/layout.tsx`

---

## Developer Experience Review

**DX-01 | HIGH | Zero Test Coverage**
- **Description:** No test files exist in the project. No test runner configured in `package.json` scripts.
- **Impact:** No confidence in code changes. Regressions are caught only in production.
- **Recommended Fix:** Add Vitest for unit tests, Playwright for E2E. Start with critical paths: auth, chat, upload.
- **Files:** `package.json`, new `__tests__/` directories

**DX-02 | MEDIUM | No Linting Rules Beyond Default**
- **Description:** `eslint.config.mjs` exists but uses default next config. No custom rules for imports, unused vars, or security patterns.
- **Impact:** Inconsistent code style across contributors.
- **Recommended Fix:** Add import ordering rules, no-any rules, consistent-return rules.
- **Files:** `eslint.config.mjs`

**DX-03 | LOW | No CI/CD Pipeline**
- **Description:** No GitHub Actions, no CI configuration.
- **Impact:** No automated testing, linting, or deployment.
- **Recommended Fix:** Add GitHub Actions workflow: lint → test → build → deploy.
- **Files:** New: `.github/workflows/ci.yml`

---

## Scoring Summary

| Category | Score | Notes |
|----------|-------|-------|
| **Code Quality** | **6/10** | Clean structure, consistent patterns, but no tests, inconsistent validation, some code duplication (PROVIDER_PRESETS defined in 3 places) |
| **Architecture** | **7/10** | Good modular design, clean RAG pipeline, but monolithic, no job queue, no middleware |
| **UX** | **7/10** | Clean UI with shadcn, good responsive layout, but no dark mode toggle, no skeletons, accessibility gaps |
| **Security** | **3/10** | CRITICAL: 11 unauthenticated endpoints, IDOR on sessions, no RBAC, SQL injection risk, no CSP headers |
| **Scalability** | **4/10** | Single-process, in-memory rate limiting, no caching strategy, local file storage |
| **SaaS Readiness** | **2/10** | No multi-tenancy, no billing, no API keys, no widget, single-tenant architecture |
| **Maintainability** | **6/10** | Good separation of concerns, Prisma schema, but no tests, no CI, provider presets duplicated |

**Overall: 5.0/10** — Strong prototype, needs significant hardening for production.

---

*End of PROJECT_AUDIT.md*
