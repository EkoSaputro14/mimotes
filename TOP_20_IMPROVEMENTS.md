# TOP_20_IMPROVEMENTS.md — Prioritized Roadmap

**Ranked by:** Business Impact × ROI (Impact / Effort)
**Date:** 2026-06-06

---

## How to Read This List

Each improvement is scored:
- **Business Impact** (1-5): How much does this move the needle for users paying?
- **Dev Effort** (1-5): 1 = trivial (< 1 day), 5 = massive (> 2 weeks)
- **ROI** = Business Impact / Dev Effort (higher = do first)

---

## Tier 1 — Ship Blockers (Week 1-2)
*Cannot launch without these.*

### #1 — Secure All API Endpoints
**ROI: 5.0** | Impact: 5 | Effort: 1

Unauthenticated access to 11 endpoints including chat sessions, dashboard stats, and analytics. This is a **data breach waiting to happen**.

**What to do:**
1. Create `middleware.ts` with NextAuth to protect all routes
2. Add `auth()` check to every route in `app/api/chat/sessions/`, `app/api/dashboard/`, `app/api/analytics/events`
3. Add session ownership check in `POST /api/chat` (verify userId matches session)
4. Add `DELETE /api/chat/sessions` auth + ownership check

**Files:**
- `middleware.ts` (new)
- `app/api/chat/route.ts`
- `app/api/chat/sessions/route.ts`
- `app/api/dashboard/stats/route.ts`
- `app/api/dashboard/usage/route.ts`
- `app/api/dashboard/cost/route.ts`
- `app/api/dashboard/top-documents/route.ts`
- `app/api/analytics/events/route.ts`

---

### #2 — Add Admin Role & RBAC
**ROI: 4.0** | Impact: 5 | Effort: 1.25

Currently any registered user is an admin. Open registration means anyone can configure AI providers and access MCP servers.

**What to do:**
1. Add `role` field to `User` model (enum: `admin`, `user`)
2. Add role check to `app/api/admin/*` routes
3. Disable open registration (admin-only) or add approval flow
4. Protect AI settings, MCP management with admin check

**Files:**
- `prisma/schema.prisma` (add role field)
- `app/api/admin/settings/route.ts`
- `app/api/admin/models/route.ts`
- `app/api/mcp/servers/route.ts`
- `lib/auth.ts` (add role to JWT)

---

### #3 — Fix SQL Injection in Analytics
**ROI: 3.33** | Impact: 5 | Effort: 1.5

`lib/analytics.ts` line 80 uses string interpolation in `$queryRawUnsafe`. While not currently exploitable, this is a ticking time bomb.

**What to do:**
1. Replace `${eventTypes.map((t) => "'${t}'").join(",")}` with parameterized query
2. Validate eventTypes against the `AnalyticsEventType` union type
3. Use Prisma `$queryRaw` with tagged template parameters instead of `$queryRawUnsafe`

**Files:**
- `lib/analytics.ts` (lines 78-100)

---

### #4 — Add File Size Limits
**ROI: 3.33** | Impact: 5 | Effort: 1.5

No file size validation on upload. A 2GB file will fill disk and crash the server.

**What to do:**
1. Add `MAX_FILE_SIZE` validation (default 10MB)
2. Read from env var: `const maxSize = parseInt(process.env.MAX_FILE_SIZE || "10485760")`
3. Validate before writing to disk
4. Add proper error message in Indonesian

**Files:**
- `app/api/upload/route.ts`

---

### #5 — Fix Chat Session IDOR
**ROI: 3.33** | Impact: 5 | Effort: 1.5

`POST /api/chat` accepts any `sessionId` without ownership check. Anyone can inject messages into any session.

**What to do:**
1. When `sessionId` is provided, verify the session exists AND belongs to the current user (or is anonymous)
2. For anonymous sessions, bind to IP or use signed tokens
3. Add index on `chat_sessions.user_id` for performance

**Files:**
- `app/api/chat/route.ts` (lines 30-50)
- `prisma/schema.prisma` (add index)

---

## Tier 2 — Revenue Enablement (Week 2-4)
*These unlock monetization.*

### #6 — Add Separate Embedding Provider Config
**ROI: 3.33** | Impact: 4 | Effort: 1.5

Currently, using Mimo Pro for chat forces the terrible feature-hashing fallback for embeddings. This makes RAG useless for Mimo users.

**What to do:**
1. Add `embedding_provider` and `embedding_api_key` settings
2. Allow chat via Mimo + embeddings via OpenAI
3. Update `lib/rag/embedder.ts` to use separate provider
4. Update `components/settings/ai-settings-form.tsx` with embedding provider section

**Files:**
- `lib/ai-provider.ts`
- `lib/rag/embedder.ts`
- `lib/settings.ts`
- `components/settings/ai-settings-form.tsx`
- `app/api/admin/settings/route.ts`

---

### #7 — Add Subscription/Billing Foundation
**ROI: 3.0** | Impact: 5 | Effort: 2

No way to charge users. This is the #1 SaaS blocker after security.

**What to do:**
1. Create `plans` table (free/pro/enterprise with limits)
2. Create `subscriptions` table linked to user/workspace
3. Add usage tracking per plan (documents, messages, storage)
4. Integrate Stripe Checkout for plan upgrades
5. Add plan enforcement middleware

**Files:**
- New: `lib/billing.ts`, `app/api/billing/*`
- `prisma/schema.prisma`
- `middleware.ts`

---

### #8 — Add API Key Authentication
**ROI: 3.0** | Impact: 4 | Effort: 2

No API key system means no programmatic access for customers.

**What to do:**
1. Create `api_keys` table with scoped permissions
2. Add API key validation middleware
3. Add key management UI in settings
4. Rate limit per API key

**Files:**
- New: `lib/api-keys.ts`
- `prisma/schema.prisma`
- `middleware.ts`
- New: `components/settings/api-keys-form.tsx`

---

### #9 — Add Embeddable Chat Widget
**ROI: 2.5** | Impact: 5 | Effort: 3

The #1 SaaS distribution channel for chatbots is embeddable widgets.

**What to do:**
1. Create `/widget` route with iframe-based chat
2. Create `public/embed.js` script for one-line embedding
3. Add widget configuration (theme, position, pre-chat message)
4. Add widget analytics tracking

**Files:**
- New: `app/widget/page.tsx`, `app/widget/layout.tsx`
- New: `public/embed.js`
- New: `lib/widget-config.ts`

---

### #10 — Add Multi-Tenancy
**ROI: 2.0** | Impact: 5 | Effort: 4

Fundamental architectural change needed for SaaS.

**What to do:**
1. Add `workspaceId` to User, Document, ChatSession, McpServer models
2. Filter ALL queries by workspace
3. Add workspace CRUD endpoints
4. Add workspace invitation system
5. Data migration for existing data

**Files:**
- `prisma/schema.prisma` (all models)
- All `app/api/*/route.ts` (add workspace filter)

---

## Tier 3 — Growth & Retention (Week 4-6)
*These make users stay and refer.*

### #11 — Add Error Boundaries & Monitoring
**ROI: 2.5** | Impact: 3 | Effort: 1.5

No error boundaries means unhandled errors show ugly Next.js defaults. No monitoring means you learn about outages from users.

**What to do:**
1. Add `error.tsx` at key routes (dashboard, chat, knowledge)
2. Add `not-found.tsx` with helpful navigation
3. Integrate Sentry for error tracking
4. Add structured logging with pino

**Files:**
- New: `app/dashboard/error.tsx`, `app/chat/error.tsx`, `app/not-found.tsx`
- New: `lib/logger.ts`

---

### #12 — Add Response Caching
**ROI: 2.5** | Impact: 3 | Effort: 1.5

Every API request hits the database. Dashboard stats, session lists, and analytics could be cached.

**What to do:**
1. Add `Cache-Control` headers to read-heavy endpoints
2. Add 60s TTL cache for dashboard stats
3. Add `stale-while-revalidate` for analytics
4. Consider Redis cache for multi-instance

**Files:**
- `app/api/dashboard/stats/route.ts`
- `app/api/dashboard/usage/route.ts`
- `app/api/dashboard/cost/route.ts`
- `app/api/chat/sessions/route.ts`

---

### #13 — Add Database Indexes
**ROI: 2.5** | Impact: 3 | Effort: 1.5

Missing indexes on hot query columns will cause performance degradation as data grows.

**What to do:**
1. Add `@@index([userId])` to ChatSession, Document
2. Add `@@index([sessionId])` to ChatMessage
3. Add `@@index([documentId])` to DocumentChunk
4. Add `@@index([userId, createdAt])` composite index for session queries

**Files:**
- `prisma/schema.prisma`

---

### #14 — Add Dark Mode Toggle
**ROI: 2.5** | Impact: 2 | Effort: 1

Infrastructure exists (ThemeProvider) but no UI toggle. Easy win for user satisfaction.

**What to do:**
1. Add theme toggle button in `components/layout/top-nav.tsx`
2. Use `useTheme()` from `next-themes`
3. Persist preference in localStorage

**Files:**
- `components/layout/top-nav.tsx`

---

### #15 — Add Document Re-processing
**ROI: 2.0** | Impact: 3 | Effort: 2

Failed documents have no retry mechanism. Users must delete and re-upload.

**What to do:**
1. Add `POST /api/documents/[id]/retry` endpoint
2. Add retry button in document list UI
3. Add retry status tracking in document model
4. Implement exponential backoff for failures

**Files:**
- New: `app/api/documents/[id]/retry/route.ts`
- `components/documents/document-list.tsx`

---

## Tier 4 — Polish & Scale (Week 6-8)
*These differentiate from competitors.*

### #16 — Add Test Coverage
**ROI: 2.0** | Impact: 3 | Effort: 3

Zero tests means every change is a gamble.

**What to do:**
1. Add Vitest for unit tests
2. Add Playwright for E2E tests
3. Test critical paths: auth flow, chat, upload, RAG pipeline
4. Add CI pipeline with test gates

**Files:**
- New: `vitest.config.ts`, `__tests__/` directories
- `package.json` (add test scripts)

---

### #17 — Add Rate Limiting to All Routes
**ROI: 2.0** | Impact: 3 | Effort: 2

Only `POST /api/chat` has rate limiting. Registration, upload, and analytics are unprotected.

**What to do:**
1. Create rate limit middleware
2. Apply to: registration (5/min), upload (10/hour), analytics (100/min)
3. Use Upstash Redis for distributed rate limiting
4. Add rate limit headers to responses

**Files:**
- `lib/ratelimit.ts`
- `middleware.ts`
- All `app/api/*/route.ts`

---

### #18 — Add Security Headers
**ROI: 2.0** | Impact: 2 | Effort: 1

No CSP, X-Frame-Options, or other security headers.

**What to do:**
1. Add security headers in `next.config.ts`:
   - `Content-Security-Policy`
   - `X-Frame-Options: DENY`
   - `X-Content-Type-Options: nosniff`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security`

**Files:**
- `next.config.ts`

---

### #19 — Add CI/CD Pipeline
**ROI: 2.0** | Impact: 2 | Effort: 1

No automated testing or deployment.

**What to do:**
1. Add GitHub Actions workflow
2. Steps: lint → type-check → test → build → deploy
3. Add Docker image build and push to registry
4. Add PR preview deployments

**Files:**
- New: `.github/workflows/ci.yml`

---

### #20 — Standardize API Error Format
**ROI: 1.67** | Impact: 2 | Effort: 3

Inconsistent error responses make client integration difficult.

**What to do:**
1. Create `lib/api-error.ts` with standard error classes
2. Create Zod schemas for all request/response types
3. Add error handling middleware
4. Update all routes to use standard format

**Files:**
- New: `lib/api-error.ts`
- All `app/api/*/route.ts`

---

## ROI Summary

| Rank | Improvement | Impact | Effort | ROI |
|------|-------------|--------|--------|-----|
| 1 | Secure API Endpoints | 5 | 1 | 5.0 |
| 2 | Admin Role & RBAC | 5 | 1.25 | 4.0 |
| 3 | Fix SQL Injection | 5 | 1.5 | 3.33 |
| 4 | File Size Limits | 5 | 1.5 | 3.33 |
| 5 | Chat Session IDOR | 5 | 1.5 | 3.33 |
| 6 | Separate Embedding Config | 4 | 1.5 | 3.33 |
| 7 | Billing Foundation | 5 | 2 | 3.0 |
| 8 | API Key Auth | 4 | 2 | 3.0 |
| 9 | Embeddable Widget | 5 | 3 | 2.5 |
| 10 | Multi-Tenancy | 5 | 4 | 2.0 |
| 11 | Error Boundaries | 3 | 1.5 | 2.5 |
| 12 | Response Caching | 3 | 1.5 | 2.5 |
| 13 | Database Indexes | 3 | 1.5 | 2.5 |
| 14 | Dark Mode Toggle | 2 | 1 | 2.5 |
| 15 | Document Re-processing | 3 | 2 | 2.0 |
| 16 | Test Coverage | 3 | 3 | 2.0 |
| 17 | Rate Limiting All Routes | 3 | 2 | 2.0 |
| 18 | Security Headers | 2 | 1 | 2.0 |
| 19 | CI/CD Pipeline | 2 | 1 | 2.0 |
| 20 | Standardize API Errors | 2 | 3 | 1.67 |

---

## Recommended Sprint Plan

### Sprint 1 (Week 1-2): Security Hardening
- #1 Secure API Endpoints
- #2 Admin Role & RBAC
- #3 Fix SQL Injection
- #4 File Size Limits
- #5 Chat Session IDOR
- #18 Security Headers

### Sprint 2 (Week 2-4): Revenue Enablement
- #6 Separate Embedding Config
- #7 Billing Foundation
- #8 API Key Auth
- #13 Database Indexes
- #17 Rate Limiting

### Sprint 3 (Week 4-6): Growth Features
- #9 Embeddable Widget
- #10 Multi-Tenancy
- #11 Error Boundaries
- #12 Response Caching
- #15 Document Re-processing

### Sprint 4 (Week 6-8): Polish
- #14 Dark Mode Toggle
- #16 Test Coverage
- #19 CI/CD Pipeline
- #20 Standardize API Errors

---

*End of TOP_20_IMPROVEMENTS.md*
