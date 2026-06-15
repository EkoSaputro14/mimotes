# Project Memory — Mimotes

> Sumber kebenaran utama untuk konteks proyek. Dibaca SEBELUM setiap tugas.
> Terakhir diperbarui: 2025-06-05

---

## Project Overview

**Mimotes** adalah chatbot AI berbasis web menggunakan teknologi RAG (Retrieval-Augmented Generation). User mengupload dokumen, sistem memproses menjadi chunks + embeddings, lalu chatbot menjawab pertanyaan berdasarkan isi dokumen tersebut.

- **Nama**: Mimotes
- **Versi**: 0.1.0
- **Status**: Active Development (Phase 5 selesai, Phase 6-7 pending)
- **Repository**: `/home/ekolepi/proyek/mimotes`

---

## Architecture

### Sistem Architecture

```
Browser → Next.js App Router → API Routes → RAG Pipeline → AI Provider
                                    ↓
                            PostgreSQL + pgvector
                                    ↓
                            File System (/uploads)
```

### RAG Pipeline Flow

1. **Upload**: File/URL → Parse → Sanitize → Chunk → Embed → Store di pgvector
2. **Chat**: Question → Embed query → Cosine similarity search → Build context → Stream AI response

### Rendering Strategy

- **Server Components**: Default untuk semua pages (auth check, data fetching)
- **Client Components**: Untuk interaktivitas (forms, chat, state management)
- **Route Groups**: `(auth)` dan `(admin)` tidak menambah URL segment

---

## Tech Stack

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Next.js (App Router, Turbopack) | 16.2.7 |
| React | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Database | PostgreSQL + pgvector | 16 |
| ORM | Prisma | 6.19.3 |
| Auth | NextAuth v5 (beta) | 5.0.0-beta.31 |
| AI SDK | OpenAI SDK + Vercel AI SDK | 6.41.0 / 6.0.194 |
| Styling | Tailwind CSS | v4 |
| UI Components | shadcn/ui (base-nova) | 4.10.0 |
| Charts | Recharts | 3.8.1 |
| Rate Limiting | @upstash/ratelimit | 2.0.8 |
| Deployment | Docker Compose | — |

---

## Directory Structure

```
mimotes/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage (public)
│   ├── globals.css               # Tailwind + shadcn CSS vars
│   ├── (auth)/                   # Auth pages (login, register)
│   ├── (admin)/                  # Admin pages (documents, settings)
│   ├── chat/                     # Public chat page
│   ├── dashboard/                # Dashboard page
│   ├── ai/                       # AI playground & prompts
│   ├── analytics/                # Analytics pages
│   ├── knowledge/                # Knowledge base management
│   └── api/                      # ~30 API routes
├── components/                   # ~45 React components
│   ├── auth/                     # Login & register forms
│   ├── chat/                     # Chat window, messages, sources
│   ├── documents/                # Document list & upload
│   ├── settings/                 # AI settings form
│   ├── ai/                       # Playground, prompts, compare
│   ├── analytics/                # Charts & KPIs
│   ├── dashboard/                # Dashboard widgets
│   ├── knowledge/                # Document explorer, chunks, search
│   ├── layout/                   # Shell, sidebar, nav
│   └── ui/                       # 17 shadcn/ui primitives
├── lib/                          # Business logic
│   ├── actions.ts                # Server actions (auth)
│   ├── ai-provider.ts            # Multi-provider AI factory
│   ├── analytics.ts              # Analytics utilities
│   ├── auth.ts                   # NextAuth config
│   ├── prisma.ts                 # Prisma singleton
│   ├── ratelimit.ts              # Rate limiter
│   ├── settings.ts               # DB settings with cache
│   ├── streaming.ts              # Streaming helpers
│   ├── utils.ts                  # Utilities
│   └── rag/                      # RAG pipeline
│       ├── chain.ts              # RAG response generation
│       ├── chunker.ts            # Text chunking
│       ├── embedder.ts           # Embedding generation
│       ├── parser.ts             # File parsers
│       └── vectorstore.ts        # pgvector operations
├── prisma/                       # Database schema & migrations
├── scripts/                      # Setup & seed scripts
├── plans/                        # Architecture & implementation docs
├── .ai/                          # AI agent context files
├── public/                       # Static assets
├── Dockerfile                    # 5-stage multi-stage build
├── docker-compose.yml            # db + migrate + app
└── package.json
```

---

## Database Schema

### Models (9 tabel)

| Model | Tabel | Fungsi |
|-------|-------|--------|
| User | `users` | Admin users dengan bcrypt password |
| Document | `documents` | Metadata dokumen yang diupload |
| DocumentChunk | `document_chunks` | Text chunks + vector embeddings (1536-dim) |
| ChatSession | `chat_sessions` | Sesi percakapan |
| ChatMessage | `chat_messages` | Pesan chat + sources |
| Setting | `settings` | Konfigurasi AI provider (key-value) |
| AnalyticsEvent | `analytics_events` | Event tracking |
| PromptTemplate | `prompt_templates` | Template prompt AI |
| PromptVersion | `prompt_versions` | Versioning untuk prompt |

### Relasi Penting

- `User` 1:N `Document` (cascade delete)
- `User` 1:N `ChatSession` (set null on delete)
- `Document` 1:N `DocumentChunk` (cascade delete)
- `ChatSession` 1:N `ChatMessage` (cascade delete)
- `PromptTemplate` 1:N `PromptVersion` (cascade delete)
- `DocumentChunk.embedding` → `vector(1536)` (pgvector)

### Indexes

- `AnalyticsEvent`: `[eventType, createdAt]`, `[createdAt]`
- Missing indexes: `Document.userId`, `ChatSession.userId`, `DocumentChunk.documentId`

---

## Existing Features

### Phase 1 — Dashboard Shell ✅
- Layout shell dengan sidebar navigasi
- Responsive design (mobile + desktop)
- shadcn/ui components setup

### Phase 2 — Dashboard Widgets ✅
- Stat cards (documents, sessions, messages)
- Usage chart (recharts AreaChart)
- Recent chats, top documents
- Cost summary, KB stats, system health

### Phase 3 — Knowledge Base Explorer ✅
- Document explorer dengan pagination, search, filter, sort
- Chunk viewer dengan similarity search
- Source viewer dengan reference counts
- Per-document chunk browsing

### Phase 4 — Analytics ✅
- Chat analytics (sessions, messages, sources, top questions)
- Usage analytics (daily events, unique users)
- Cost analytics (token estimates, daily costs)
- CSV export, date range selector

### Phase 5 — AI Management ✅
- AI Playground (system prompt, parameters, RAG context)
- Prompt CRUD dengan versioning
- Prompt diff & revert
- Model comparison (compare mode)
- Prompt testing dengan variable replacement

### Core Features ✅
- RAG chatbot dengan streaming response
- Multi-format file upload (PDF, DOCX, TXT, CSV, XLSX)
- URL scraping (cheerio)
- Multi-AI provider (Mimo, OpenAI, LM Studio, Ollama, OpenRouter, Custom)
- Public chat dengan rate limiting (20/min/IP)
- Admin authentication (NextAuth v5, JWT)
- Document management (upload, list, delete)
- AI provider settings (switch provider, auto-detect models)

---

## API Endpoints

### Public (Rate Limited)

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| POST | `/api/chat` | Chat RAG streaming |
| GET | `/api/chat/sessions` | List sessions |
| DELETE | `/api/chat/sessions` | Hapus session |
| POST | `/api/auth/register` | Registrasi |
| * | `/api/auth/[...nextauth]` | NextAuth handlers |

### Auth Required

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| POST | `/api/upload` | Upload file/URL |
| GET | `/api/documents` | List dokumen |
| GET/DELETE | `/api/documents/[id]` | Detail/hapus dokumen |
| GET/POST | `/api/admin/settings` | AI settings |
| POST | `/api/admin/models` | Auto-detect models |
| GET/POST | `/api/ai/prompts` | Prompt CRUD |
| GET/PUT/DELETE | `/api/ai/prompts/[id]` | Prompt detail |
| POST | `/api/ai/prompts/[id]/revert` | Revert prompt |
| POST | `/api/ai/prompts/[id]/test` | Test prompt |
| GET | `/api/ai/prompts/[id]/versions` | Prompt versions |
| POST | `/api/ai/playground` | Playground streaming |
| POST | `/api/ai/playground/compare` | Model comparison |
| GET | `/api/analytics/chat` | Chat analytics |
| GET | `/api/analytics/usage` | Usage analytics |
| GET | `/api/analytics/cost` | Cost analytics |
| GET | `/api/analytics/export` | CSV export |
| POST | `/api/analytics/events` | Record event |
| GET | `/api/dashboard/stats` | Dashboard stats |
| GET | `/api/dashboard/usage` | Dashboard usage |
| GET | `/api/dashboard/cost` | Dashboard cost |
| GET | `/api/dashboard/health` | System health |
| GET | `/api/dashboard/top-documents` | Top documents |
| GET/POST | `/api/knowledge/documents` | Knowledge docs |
| GET | `/api/knowledge/documents/[id]/chunks` | Doc chunks |
| GET/POST | `/api/knowledge/chunks` | Chunks CRUD |
| GET/DELETE | `/api/knowledge/chunks/[id]` | Chunk detail |
| GET | `/api/knowledge/chunks/[id]/similar` | Similar chunks |
| POST | `/api/knowledge/search` | Similarity search |
| GET | `/api/knowledge/sources` | Sources with refs |

---

## Coding Standards

### Naming Conventions

- **Files**: kebab-case (`chat-window.tsx`, `ai-provider.ts`)
- **Components**: PascalCase (`ChatWindow`, `AISettingsForm`)
- **Functions**: camelCase (`generateRAGResponse`, `parseFile`)
- **Constants**: UPPER_SNAKE_CASE (`EMBEDDING_DIMENSION`, `PROVIDER_PRESETS`)
- **Database tables**: snake_case (`chat_sessions`, `document_chunks`)
- **Database columns**: snake_case (`user_id`, `created_at`)

### Code Patterns

- **Server Components**: Default, no directive needed
- **Client Components**: `"use client"` directive di line 1
- **API Routes**: `NextRequest` → `Response.json()`, try-catch error handling
- **Auth Check**: `const session = await auth()` di server components dan API routes
- **Prisma**: Singleton di `lib/prisma.ts`, raw SQL untuk vector operations
- **Path Alias**: `@/*` → `./*`

### File Organization

- Pages di `app/` (route-based)
- Components di `components/` (feature-based subfolder)
- Business logic di `lib/`
- Database di `prisma/`
- Scripts di `scripts/`

---

## Important Decisions

### 1. Multi-Provider via OpenAI-Compatible API
Semua AI provider menggunakan OpenAI SDK client. Trade-off: fitur khusus provider tidak bisa digunakan.

### 2. JWT Strategy (bukan Database Sessions)
Mengurangi query DB per request. Trade-off: tidak bisa invalidate session server-side.

### 3. Settings di Database dengan Env Fallback
User bisa ganti AI provider tanpa restart. Trade-off: cache 30 detik.

### 4. Background Document Processing
Upload langsung return, processing async. Trade-off: tidak ada notifikasi jika gagal.

### 5. Local Embedding Fallback (Feature Hashing)
Mimo Pro tidak support embeddings, jadi pakai feature hashing. Trade-off: akurasi lebih rendah.

### 6. Sources via HTTP Headers
Sources dikirim di header `X-Sources`, bukan body. Trade-off: size limit ~8KB.

### 7. Raw SQL untuk Vector Operations
Prisma tidak support pgvector native. Trade-off: tidak ada type safety.

---

## Known Issues

### Critical

1. **SQL injection risk** — `lib/analytics.ts:83` menggunakan string interpolation untuk `eventTypes` di `$queryRawUnsafe`
2. **API keys plaintext** — Disimpan di database tanpa enkripsi
3. **No file size limit** — Upload route tidak punya batasan ukuran file

### High

4. **Chat sessions deletable without auth** — `DELETE /api/chat/sessions` tidak verifikasi ownership
5. **Analytics events recordable without auth** — `POST /api/analytics/events` terbuka untuk injection
6. **Memory leak** — `InMemoryRateLimit` tidak cleanup old entries

### Medium

7. **Dashboard endpoints no auth** — Data dashboard publik terbuka
8. **Inconsistent token estimation** — `÷4` vs `÷3.5` di file berbeda
9. **AnalyticsEvent.userId no onDelete** — Crash saat user dihapus
10. **No DB indexes on foreign keys** — Query lambat untuk filter by user

### Low

11. **Duplicate registration logic** — `lib/actions.ts` vs `app/api/auth/register/route.ts`
12. **Hardcoded system prompt** — Tidak bisa dikonfigurasi
13. **Local embedding quality poor** — Feature hashing bukan semantic
14. **No pagination on legacy endpoints** — `/api/documents` masih tanpa pagination

---

## Technical Debt

### Critical Priority
- SEC-001: API keys stored in plaintext (needs encryption at rest)

### High Priority
- DEBT-002: Local embedding quality (feature hashing)
- DEBT-006: File upload without size limit (sprint in progress)
- PH5-001: Zero test coverage

### Medium Priority
- DEBT-001: pdf-parse v1 pinning
- DEBT-003: In-memory rate limiter fallback
- SEC-002: File storage on local filesystem

### Low Priority
- PH5-002: Duplicate streaming logic
- PH5-003: No pagination on prompt list
- PH5-004: Client-side playground history
- PH5-005: Approximate token counting
- PH5-006: prompt() browser dialog

---

## Development Rules

### Before Any Task
1. Baca `AGENTS.md` untuk konvensi kode
2. Baca `.ai/project-memory.md` (file ini) untuk konteks
3. Baca `.ai/current-sprint.md` untuk sprint saat ini
4. Baca `.ai/TECH_DEBT.md` untuk debt yang relevan

### During Development
1. Ikuti naming conventions yang ada
2. Jangan tambah comments kecuali diminta
3. Gunakan existing libraries dan patterns
4. Pastikan `npm run build` berhasil
5. Update memory jika menemukan informasi baru

### After Task Completion
1. Update `.ai/project-memory.md` jika ada perubahan arsitektur
2. Update `.ai/TECH_DEBT.md` jika ada debt baru atau resolved
3. Update `.ai/current-sprint.md` jika ada progress sprint
4. Jalankan lint/typecheck jika tersedia

---

## Future Roadmap

### Phase 6 — Workspace System (Pending)
- Multi-tenant workspace
- User roles & permissions
- Team collaboration
- Shared knowledge bases

### Phase 7 — Public Widget (Pending)
- Embeddable chat widget
- API for external integration
- White-label support
- Usage-based billing

---

## File Reference Quick Map

| Kebutuhan | File |
|-----------|------|
| Auth logic | `lib/auth.ts`, `lib/actions.ts` |
| AI provider | `lib/ai-provider.ts` |
| RAG pipeline | `lib/rag/chain.ts`, `chunker.ts`, `embedder.ts`, `parser.ts`, `vectorstore.ts` |
| Chat UI | `components/chat/chat-window.tsx` |
| Document upload | `components/documents/upload-form.tsx`, `app/api/upload/route.ts` |
| Settings | `components/settings/ai-settings-form.tsx`, `app/api/admin/settings/route.ts` |
| Database schema | `prisma/schema.prisma` |
| Docker config | `Dockerfile`, `docker-compose.yml` |
| Environment vars | `.env`, `.env.example` |
| Rate limiting | `lib/ratelimit.ts` |
| Analytics | `lib/analytics.ts` |
| Streaming | `lib/streaming.ts` |

---

*File ini harus diperbarui setiap kali ada perubahan signifikan pada codebase.*
