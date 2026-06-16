# AIAGENTS.md — Panduan untuk AI Coding Agent

> File ini dioptimalkan untuk AI coding agents. Baca file ini SEBELUM melakukan perubahan kode apapun pada proyek Mimotes.
> Konteks utama: `.ai/project-memory.md` | Technical debt: `.ai/TECH_DEBT.md` | Sprint: `.ai/current-sprint.md`

## Ringkasan Proyek

**Mimotes** adalah chatbot AI berbasis pengetahuan (RAG — Retrieval-Augmented Generation). User mengupload dokumen, sistem memproses menjadi chunks + embeddings, lalu chatbot menjawab pertanyaan berdasarkan isi dokumen tersebut.

- **Framework**: Next.js 16.2.7 (App Router, Turbopack)
- **Database**: PostgreSQL 16 + pgvector extension
- **Auth**: NextAuth v5 (beta) — Credentials provider, JWT strategy
- **AI**: Multi-provider (Mimo Pro, OpenAI, LM Studio, Ollama, OpenRouter, Custom) via OpenAI-compatible API
- **Deployment**: Docker Compose (multi-stage build)

## Arsitektur Sistem

```mermaid
graph TB
    subgraph Client
        Browser[Browser]
    end

    subgraph Next.js App
        Pages[App Router Pages]
        API[API Routes]
        RAG[RAG Pipeline]
        Auth[NextAuth v5]
    end

    subgraph Storage
        DB[(PostgreSQL + pgvector)]
        Files[File System /uploads]
    end

    subgraph AI
        Provider[AI Provider API]
        LocalEmb[Local Embedding Fallback]
    end

    Browser --> Pages
    Browser --> API
    API --> Auth
    API --> RAG
    RAG --> Provider
    RAG --> LocalEmb
    RAG --> DB
    API --> Files
    Auth --> DB
```

## Alur RAG (Retrieval-Augmented Generation)

```mermaid
flowchart LR
    A[Upload File/URL] --> B[Parse Content]
    B --> C[sanitizeText]
    C --> D[chunkText]
    D --> E[generateEmbeddings]
    E --> F[storeChunks ke pgvector]
    
    G[User Question] --> H[generateEmbedding query]
    H --> I[searchSimilarChunks cosine]
    I --> J[Build Context]
    J --> K[stream via AI Provider]
    K --> L[Save to ChatMessage]
```

## Struktur Direktori

```
mimotes/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (Geist font, metadata)
│   ├── page.tsx                  # Homepage (public)
│   ├── globals.css               # Tailwind v4 + shadcn CSS vars (oklch)
│   ├── (auth)/                   # Auth group (no layout nesting)
│   │   ├── login/page.tsx        # Login page
│   │   └── register/page.tsx     # Register page
│   ├── (admin)/                  # Admin group (auth-required)
│   │   ├── documents/
│   │   │   ├── page.tsx          # Document list page
│   │   │   └── upload/page.tsx   # Upload page
│   │   └── settings/page.tsx     # AI provider settings page
│   ├── chat/page.tsx             # Chat page (public, rate-limited)
│   ├── dashboard/page.tsx        # Dashboard dengan stat cards & widgets
│   ├── ai/
│   │   ├── playground/page.tsx   # AI Playground (test prompts)
│   │   └── prompts/
│   │       ├── page.tsx          # Prompt list
│   │       ├── new/page.tsx      # Create prompt
│   │       └── [id]/page.tsx     # Edit prompt
│   ├── analytics/
│   │   ├── chat/page.tsx         # Chat analytics
│   │   ├── cost/page.tsx         # Cost analytics
│   │   └── usage/page.tsx        # Usage analytics
│   ├── knowledge/
│   │   ├── documents/
│   │   │   ├── page.tsx          # Document explorer
│   │   │   └── [id]/page.tsx     # Document detail
│   │   ├── chunks/page.tsx       # Chunk viewer
│   │   ├── search/page.tsx       # Similarity search
│   │   └── sources/page.tsx      # Source viewer
│   └── api/                      # ~30 API routes (lihat API Endpoints)
├── components/
│   ├── auth/                     # LoginForm, RegisterForm
│   ├── chat/                     # ChatWindow, MessageBubble, SessionSidebar, SourceCard
│   ├── documents/                # DocumentList, UploadForm
│   ├── settings/                 # AISettingsForm
│   ├── ai/                       # PlaygroundEditor, PromptEditor, ModelSelector, CompareMode, ParameterControls, PromptVersionList
│   ├── analytics/                # ChatAnalytics, CostAnalytics, UsageAnalytics, ChartCard, KPICard, DateRangeSelector
│   ├── dashboard/                # StatCard, UsageChart, RecentChats, TopDocuments, CostSummary, KBStats, SystemHealth
│   ├── knowledge/                # DocumentExplorer, ChunkViewer, SimilaritySearch, SourceViewer
│   ├── layout/                   # DashboardShell, DashboardShellClient, AppSidebar, TopNav, MobileNav
│   └── ui/                       # 17 shadcn/ui primitives (Button, Card, Dialog, Input, Table, Tabs, dll)
├── lib/
│   ├── actions.ts                # Server actions: register, login, logout
│   ├── ai-provider.ts            # Multi-provider AI client factory
│   ├── analytics.ts              # Analytics utilities (recordEvent, getAnalytics, exportCSV)
│   ├── auth.ts                   # NextAuth v5 config
│   ├── prisma.ts                 # Prisma client singleton
│   ├── ratelimit.ts              # Rate limiting (Upstash or in-memory)
│   ├── settings.ts               # DB settings with env fallback + 30s cache
│   ├── streaming.ts              # Re-export createTextStreamResponse
│   ├── utils.ts                  # cn(), getClientIP()
│   └── rag/
│       ├── chain.ts              # generateRAGResponse, streamRAGResponse
│       ├── chunker.ts            # chunkText (paragraph → sentence splitting)
│       ├── embedder.ts           # API embedding + local fallback
│       ├── parser.ts             # PDF, DOCX, TXT, CSV, XLSX, URL parsers
│       └── vectorstore.ts        # pgvector INSERT + cosine similarity search
├── prisma/
│   ├── schema.prisma             # 9 models (lihat Database Schema)
│   └── migrations/               # SQL migrations
├── scripts/
│   ├── seed-admin.ts             # Admin user seeder
│   ├── docker-migrate.sh         # Wait for DB + run migrations
│   └── setup-db.sh               # Local dev DB setup
├── plans/                        # Architecture & implementation docs
├── .ai/                          # AI agent context (project-memory, tech debt, sprint)
├── Dockerfile                    # 5-stage multi-stage build
├── docker-compose.yml            # db + migrate + app services
├── docker-entrypoint.sh          # Admin seeding on container start
├── next.config.ts                # standalone output, serverExternalPackages
├── package.json
└── tsconfig.json                 # Path alias @/* → ./*
```

## Database Schema (Prisma)

```mermaid
erDiagram
    users ||--o{ documents : has
    users ||--o{ chat_sessions : has
    users ||--o{ analytics_events : has
    users ||--o{ prompt_templates : creates
    users ||--o{ prompt_versions : creates
    documents ||--o{ document_chunks : has
    chat_sessions ||--o{ chat_messages : has
    prompt_templates ||--o{ prompt_versions : has

    users {
        uuid id PK
        varchar email UK
        varchar name
        varchar password_hash
        timestamp created_at
        timestamp updated_at
    }

    documents {
        uuid id PK
        uuid user_id FK
        varchar title
        varchar file_type
        varchar file_url
        varchar status "processing|ready|failed"
        int chunk_count
        timestamp created_at
        timestamp updated_at
    }

    document_chunks {
        uuid id PK
        uuid document_id FK
        text content
        vector_1536 embedding
        int chunk_index
        jsonb metadata
        timestamp created_at
    }

    chat_sessions {
        uuid id PK
        uuid user_id FK "nullable"
        varchar title
        timestamp created_at
    }

    chat_messages {
        uuid id PK
        uuid session_id FK
        varchar role "user|assistant"
        text content
        jsonb sources
        timestamp created_at
    }

    settings {
        uuid id PK
        varchar key UK
        text value
        timestamp updated_at
    }

    analytics_events {
        uuid id PK
        uuid user_id FK "nullable"
        varchar event_type
        jsonb metadata
        timestamp created_at
    }

    prompt_templates {
        uuid id PK
        varchar name
        text content
        varchar category
        boolean is_active
        int version
        uuid created_by FK "nullable"
        timestamp created_at
        timestamp updated_at
    }

    prompt_versions {
        uuid id PK
        uuid prompt_id FK
        int version
        text content
        varchar change_note
        uuid created_by FK "nullable"
        timestamp created_at
    }
```

### Event Types (Tabel `analytics_events`)

| Event Type | Keterangan |
|------------|------------|
| `chat_message` | Pesan chat terkirim |
| `document_upload` | Dokumen diupload |
| `document_delete` | Dokumen dihapus |
| `search_similarity` | Similarity search dilakukan |
| `settings_update` | Settings diubah |
| `session_create` | Chat session dibuat |

### Setting Keys (Tabel `settings`)

| Key | Contoh Value | Keterangan |
|-----|-------------|------------|
| `ai_provider` | `mimo` | Provider type |
| `ai_api_key` | `sk-xxx` | API key |
| `ai_base_url` | `https://...` | Base URL |
| `ai_model` | `mimo-v2.5-pro` | Chat model name |
| `ai_embedding_model` | `text-embedding-3-small` | Embedding model |

**Prioritas konfigurasi**: DB setting > env variable > default value (dari [`PROVIDER_PRESETS`](lib/ai-provider.ts:6)).

Cache in-memory 30 detik ([`CACHE_TTL`](lib/settings.ts:6)). Di-invalidate saat [`setSetting()`](lib/settings.ts:34) dipanggil.

## API Endpoints

### Public (Rate Limited — 20 req/menit per IP)

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `POST` | `/api/chat` | Kirim pesan, dapat streaming response + sources |
| `GET` | `/api/chat/sessions` | List semua chat sessions |
| `DELETE` | `/api/chat/sessions?id=xxx` | Hapus session |

### Auth Required — Core

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `POST` | `/api/upload` | Upload file (PDF/DOCX/TXT/CSV/XLSX) atau URL |
| `GET` | `/api/documents` | List dokumen milik user |
| `GET` | `/api/documents/[id]` | Detail dokumen |
| `DELETE` | `/api/documents/[id]` | Hapus dokumen + chunks |
| `GET` | `/api/admin/settings` | Ambil semua AI settings |
| `POST` | `/api/admin/settings` | Simpan AI settings |
| `POST` | `/api/admin/models` | Auto-detect models dari provider |

### Auth Required — AI Management

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET/POST` | `/api/ai/prompts` | List / buat prompt |
| `GET/PUT/DELETE` | `/api/ai/prompts/[id]` | Detail / update / hapus prompt |
| `POST` | `/api/ai/prompts/[id]/revert` | Revert ke versi sebelumnya |
| `POST` | `/api/ai/prompts/[id]/test` | Test prompt dengan streaming |
| `GET` | `/api/ai/prompts/[id]/versions` | List versi prompt |
| `POST` | `/api/ai/playground` | Playground streaming (custom params) |
| `POST` | `/api/ai/playground/compare` | Bandingkan 2+ model |
| `GET` | `/api/ai/playground/history` | History (placeholder) |

### Auth Required — Analytics

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/analytics/chat` | Chat analytics (sessions, messages, sources) |
| `GET` | `/api/analytics/usage` | Usage analytics (events, users) |
| `GET` | `/api/analytics/cost` | Cost analytics (tokens, costs) |
| `GET` | `/api/analytics/export` | Export analytics CSV |
| `POST` | `/api/analytics/events` | Record analytics event |

### Auth Required — Knowledge Base

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET/POST` | `/api/knowledge/documents` | List / filter dokumen (paginated) |
| `GET` | `/api/knowledge/documents/[id]/chunks` | Chunks per dokumen (paginated) |
| `GET/POST` | `/api/knowledge/chunks` | List / filter chunks (paginated) |
| `GET/DELETE` | `/api/knowledge/chunks/[id]` | Detail / hapus chunk |
| `GET` | `/api/knowledge/chunks/[id]/similar` | Cari chunk mirip |
| `POST` | `/api/knowledge/search` | Similarity search dengan metrics |
| `GET` | `/api/knowledge/sources` | Sumber dengan jumlah referensi |

### Public Dashboard (No Auth)

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `GET` | `/api/dashboard/stats` | Stat cards (counts + trends) |
| `GET` | `/api/dashboard/usage` | Usage chart data |
| `GET` | `/api/dashboard/cost` | Cost summary |
| `GET` | `/api/dashboard/health` | System health checks |
| `GET` | `/api/dashboard/top-documents` | Top referenced documents |

### Auth Routes

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `POST` | `/api/auth/register` | Registrasi user baru |
| `*` | `/api/auth/[...nextauth]` | NextAuth handlers (login/callback/session) |

### Chat Request/Response Format

**Request** `POST /api/chat`:
```json
{ "message": "Apa isi dokumen X?", "sessionId": "optional-uuid" }
```

**Response**: Streaming text. Headers:
- `X-Session-Id`: UUID session
- `X-Sources`: URL-encoded JSON array of `{ documentId, content, similarity, metadata }`

### Upload Request Format

**Request** `POST /api/upload` (multipart/form-data):
- `file`: File (PDF/DOCX/TXT/CSV/XLSX/XLS)
- `url`: String (URL to scrape)

**Response**: `{ id, title, status: "processing" }`. Processing berjalan di background.

## Multi-AI Provider

Konfigurasi via [`PROVIDER_PRESETS`](lib/ai-provider.ts:6):

| Provider | `AI_PROVIDER` | Default Model | Embeddings |
|----------|--------------|---------------|------------|
| Mimo Pro | `mimo` | `mimo-v2.5-pro` | ❌ (local fallback) |
| OpenAI | `openai` | `gpt-4o-mini` | `text-embedding-3-small` |
| LM Studio | `lmstudio` | `local-model` | `nomic-embed-text-v1.5` |
| Ollama | `ollama` | `llama3` | `nomic-embed-text` |
| OpenRouter | `openrouter` | `openai/gpt-4o-mini` | `text-embedding-3-small` |
| Custom | `custom` | `gpt-4o-mini` | `text-embedding-3-small` |

Semua provider menggunakan OpenAI-compatible API client ([`getAIProvider()`](lib/ai-provider.ts:126)). Client di-cache berdasarkan `apiKey|baseURL`.

### Embedding Fallback

Jika provider tidak mendukung embeddings (contoh: Mimo Pro), sistem otomatis menggunakan local embedding via feature hashing ([`generateLocalEmbedding()`](lib/rag/embedder.ts:26)) — character trigrams + word tokens → 1536-dim vector, L2-normalized.

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/mimotes?schema=public

# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Admin Seed (Docker only)
SEED_ADMIN=true
ADMIN_EMAIL=admin@mimotes.com
ADMIN_PASSWORD=admin123

# AI Provider
AI_PROVIDER=mimo                    # openai|lmstudio|ollama|openrouter|custom|mimo
MIMO_API_KEY=sk-xxx
MIMO_BASE_URL=https://token-plan-sgp.xiaomimimo.com/v1
MIMO_MODEL=mimo-v2.5-pro

# RAG Config
CHUNK_SIZE=500
CHUNK_OVERLAP=50
TOP_K_RESULTS=5

# Rate Limiting (optional, tanpa ini pakai in-memory)
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx
```

## Build & Deploy

### Docker Compose (Recommended)

```bash
cp .env.example .env  # edit konfigurasi
docker compose up -d
# Buka http://localhost:3000
```

**Dockerfile 5 stages**:
1. `deps` — `npm ci --ignore-scripts`
2. `prisma` — `npx prisma generate`
3. `migrations` — wait for DB + run migrations
4. `builder` — `npm run build` (standalone output)
5. `runner` — production image with non-root user

**docker-compose.yml services**: `db` (pgvector:pg16) → `migrate` → `app` (port 3000).

### Local Development

```bash
npm install
npx prisma migrate dev
npx tsx scripts/seed-admin.ts
npm run dev
```

## Konvensi Kode

- **Path alias**: `@/*` → `./` (di [`tsconfig.json`](tsconfig.json))
- **Server Components**: Default di App Router. Client components pakai `"use client"` directive
- **Server Actions**: [`lib/actions.ts`](lib/actions.ts) — `register`, `login`, `logout`
- **API Routes**: Semua di `app/api/`, menggunakan `NextRequest`/`Response.json()`
- **Auth check**: `const session = await auth()` di server components dan API routes
- **Error handling**: Try-catch di API routes, return JSON error response
- **Prisma**: Singleton pattern di [`lib/prisma.ts`](lib/prisma.ts), raw SQL untuk vector operations
- **Streaming**: OpenAI SDK stream → `ReadableStream<string>` → `TransformStream` (capture full response) → `createTextStreamResponse()`

## Business Rules & Constraints

1. **Chat publik** — tidak perlu login, tapi rate-limited 20 req/menit per IP
2. **Upload & Documents** — harus login (admin area)
3. **Document processing** — async/background setelah upload, status: `processing` → `ready`/`failed`
4. **File types**: PDF, DOCX, TXT, CSV, XLSX/XLS, URL (scrape via cheerio)
5. **Vector dimension**: 1536 (hardcoded di [`EMBEDDING_DIMENSION`](lib/rag/embedder.ts:3))
6. **Chunk strategy**: Paragraph-based, lalu sentence-based jika paragraph terlalu besar
7. **Text sanitization**: [`sanitizeText()`](lib/rag/parser.ts:116) — hapus BOM, zero-width chars, smart quotes, special dashes. Penting untuk mencegah ByteString errors di HTTP headers
8. **Sources di headers**: `encodeURIComponent(JSON.stringify(sources))` — wajib di-encode karena nilai non-ASCII
9. **Cascade delete**: Hapus document → otomatis hapus chunks (Prisma `onDelete: Cascade`)
10. **Session nullable userId**: ChatSession.userId nullable, di-set null saat user dihapus (`onDelete: SetNull`)

## Technical Debt & Known Issues

> Lihat `.ai/TECH_DEBT.md` untuk registry lengkap dengan prioritas dan status.

### Critical

1. **API keys stored in plaintext** — Database tanpa enkripsi (SEC-001)
2. **SQL injection risk** — `lib/analytics.ts:83` string interpolation di `$queryRawUnsafe`

### High

3. **File upload tanpa size limit** — DoS vulnerability (DEBT-006, sprint in progress)
4. **Zero test coverage** — Tidak ada unit/integration tests (PH5-001)
5. **Chat sessions deletable without auth** — `DELETE /api/chat/sessions` tanpa ownership check
6. **Analytics events recordable without auth** — `POST /api/analytics/events` terbuka

### Medium

7. **pdf-parse v1** — v2 punya DOMMatrix error di Node.js, pin di v1.1.1 (DEBT-001)
8. **Local embedding** — feature hashing kurang akurat, hanya untuk fallback (DEBT-002)
9. **In-memory rate limiter** — reset saat restart, memory leak pada banyak IPs (DEBT-003)
10. **AnalyticsEvent.userId no onDelete** — Crash saat user dihapus
11. **Dashboard endpoints no auth** — Data dashboard publik terbuka
12. **Inconsistent token estimation** — `÷4` vs `÷3.5` di file berbeda

### Low

13. **No pagination** — Legacy `/api/documents` dan `/api/chat/sessions` belum paginated
14. **Duplicate registration logic** — `lib/actions.ts` vs `app/api/auth/register/route.ts`
15. **Hardcoded system prompt** — Tidak bisa dikonfigurasi
16. **No DB indexes on foreign keys** — Query lambat untuk filter by user
17. **Duplicate streaming logic** — Playground dan test endpoint kode mirip (PH5-002)

## Routing Architecture

- **Route Groups** `(auth)` dan `(admin)` — tidak menambah URL segment
- **`(auth)/login`** → `/login` (public)
- **`(admin)/documents`** → `/documents` (auth required, server-side check)
- **`(admin)/settings`** → `/settings` (auth required)
- **`/chat`** — public, rate-limited
- **`/dashboard`** — auth required (DashboardShell)
- **`/ai/*`** — auth required (playground, prompts)
- **`/analytics/*`** — auth required (chat, cost, usage)
- **`/knowledge/*`** — auth required (documents, chunks, search, sources)
- **`/`** — public homepage dengan link ke chat dan admin

## File yang Sering Diubah

| Saat mengubah... | File yang perlu diedit |
|------------------|----------------------|
| Tambah AI provider | [`lib/ai-provider.ts`](lib/ai-provider.ts) (PROVIDER_PRESETS), [`components/settings/ai-settings-form.tsx`](components/settings/ai-settings-form.tsx), [`docker-compose.yml`](docker-compose.yml) |
| Tambah file type | [`lib/rag/parser.ts`](lib/rag/parser.ts), [`app/api/upload/route.ts`](app/api/upload/route.ts) |
| Ubah chunk strategy | [`lib/rag/chunker.ts`](lib/rag/chunker.ts) |
| Ubah prompt | [`lib/rag/chain.ts`](lib/rag/chain.ts:39) (systemPrompt) |
| Ubah UI chat | [`components/chat/chat-window.tsx`](components/chat/chat-window.tsx) |
| Tambah DB field | [`prisma/schema.prisma`](prisma/schema.prisma) → `npx prisma migrate dev` |
| Ubah auth logic | [`lib/auth.ts`](lib/auth.ts), [`lib/actions.ts`](lib/actions.ts) |
| Tambah analytics event | [`lib/analytics.ts`](lib/analytics.ts), [`app/api/analytics/events/route.ts`](app/api/analytics/events/route.ts) |
| Tambah dashboard widget | [`app/dashboard/page.tsx`](app/dashboard/page.tsx), [`components/dashboard/`](components/dashboard/) |
| Ubah AI playground | [`components/ai/playground-editor.tsx`](components/ai/playground-editor.tsx), [`app/api/ai/playground/route.ts`](app/api/ai/playground/route.ts) |
| Ubah prompt management | [`components/ai/prompt-editor.tsx`](components/ai/prompt-editor.tsx), [`app/api/ai/prompts/`](app/api/ai/prompts/) |
| Ubah knowledge base | [`components/knowledge/`](components/knowledge/), [`app/api/knowledge/`](app/api/knowledge/) |

## User Journey

### Admin (Authenticated)

```mermaid
journey
    title Admin User Journey
    section Autentikasi
      Buka /login: 5: Admin
      Isi email + password: 5: Admin
      Redirect ke /documents: 5: Admin
    section Upload Dokumen
      Buka /documents/upload: 5: Admin
      Pilih file atau masukkan URL: 4: Admin
      Klik Upload: 5: Admin
      Sistem memproses (status: processing): 3: System
      Status berubah ke ready: 5: System
    section Chat
      Buka /chat: 5: Admin
      Ketik pertanyaan: 5: Admin
      AI menjawab dengan sumber: 5: AI
      Lihat source cards: 5: Admin
    section Manajemen
      Lihat daftar dokumen: 5: Admin
      Hapus dokumen tidak perlu: 4: Admin
      Ubah AI provider di /settings: 4: Admin
      Deteksi model baru: 4: Admin
```

### Public User (Tanpa Login)

```mermaid
journey
    title Public User Journey
    section Chat
      Buka / atau /chat: 5: User
      Ketik pertanyaan: 5: User
      AI menjawab: 4: AI
      Rate limit (20/menit): 3: System
    section Mau Upload
      Klik Upload: 5: User
      Redirect ke /login: 3: System
      Register akun baru: 4: User
      Login: 5: User
      Upload dokumen: 5: User
```

### Akses Halaman

| Halaman | URL | Perlu Login? | Rate Limited? |
|---------|-----|-------------|---------------|
| Homepage | `/` | ❌ | ❌ |
| Chat | `/chat` | ❌ | ✅ (20/menit/IP) |
| Login | `/login` | ❌ | ❌ |
| Register | `/register` | ❌ | ❌ |
| Dashboard | `/dashboard` | ✅ | ❌ |
| Documents | `/documents` | ✅ | ❌ |
| Upload | `/documents/upload` | ✅ | ❌ |
| Settings | `/settings` | ✅ | ❌ |
| AI Playground | `/ai/playground` | ✅ | ❌ |
| Prompts | `/ai/prompts` | ✅ | ❌ |
| Analytics | `/analytics/*` | ✅ | ❌ |
| Knowledge Base | `/knowledge/*` | ✅ | ❌ |

## Frontend Architecture

### Routing & Rendering Strategy

```mermaid
graph TD
    subgraph "Server Components (default)"
        Layout[app/layout.tsx<br/>RootLayout]
        Home[app/page.tsx<br/>HomePage]
        DocPage[app/(admin)/documents/page.tsx<br/>DocumentsPage]
        UploadPage[app/(admin)/documents/upload/page.tsx]
        SettingsPage[app/(admin)/settings/page.tsx]
        LoginPage[app/(auth)/login/page.tsx]
        RegisterPage[app/(auth)/register/page.tsx]
        ChatPage[app/chat/page.tsx]
    end

    subgraph "Client Components (use client)"
        ChatWindow[ChatWindow<br/>State + Streaming]
        DocList[DocumentList<br/>Fetch + Delete]
        UploadForm[UploadForm<br/>File + URL input]
        SettingsForm[AISettingsForm<br/>Provider config]
        LoginForm[LoginForm<br/>Form submit]
        RegisterForm[RegisterForm<br/>Form submit]
        MsgBubble[MessageBubble<br/>Render message]
        SrcCard[SourceCard<br/>Render source]
    end

    Layout --> Home
    Layout --> DocPage
    Layout --> UploadPage
    Layout --> SettingsPage
    Layout --> LoginPage
    Layout --> RegisterPage
    Layout --> ChatPage

    ChatPage --> ChatWindow
    ChatWindow --> MsgBubble
    ChatWindow --> SrcCard
    DocPage --> DocList
    UploadPage --> UploadForm
    SettingsPage --> SettingsForm
    LoginPage --> LoginForm
    RegisterPage --> RegisterForm
```

### Data Fetching Patterns

| Pattern | Digunakan Di | Cara |
|---------|-------------|------|
| **Server-side auth check** | Semua halaman admin | `await auth()` di server component, `redirect("/login")` jika null |
| **Client-side fetch** | ChatWindow, DocumentList | `fetch("/api/...")` di useEffect atau event handler |
| **Server action** | LoginForm, RegisterForm | `action={serverAction}` di form element |
| **Streaming fetch** | ChatWindow | `fetch()` + `response.body.getReader()` baca chunk per chunk |
| **Background processing** | Upload | API langsung return, processing async via `.catch()` |

### Streaming Chat Flow (Client-side)

```typescript
// components/chat/chat-window.tsx — handleSubmit()
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message, sessionId }),
});

// Baca headers untuk session ID dan sources
const sessionIdHeader = response.headers.get("X-Session-Id");
const sourcesHeader = JSON.parse(decodeURIComponent(response.headers.get("X-Sources")));

// Baca stream chunk per chunk
const reader = response.body.getReader();
const decoder = new TextDecoder();
let done = false;
while (!done) {
  const { value, done: streamDone } = await reader.read();
  done = streamDone;
  const chunk = decoder.decode(value, { stream: true });
  // Update message state dengan chunk baru
}
```

## Component Hierarchy

```
app/layout.tsx (RootLayout — Geist font, ThemeProvider, Toaster, TooltipProvider)
├── app/page.tsx (HomePage — public landing)
├── app/(auth)/login/page.tsx
│   └── components/auth/login-form.tsx (Client)
├── app/(auth)/register/page.tsx
│   └── components/auth/register-form.tsx (Client)
├── app/chat/page.tsx
│   └── components/chat/chat-window.tsx (Client)
│       ├── components/chat/message-bubble.tsx (Client)
│       ├── components/chat/session-sidebar.tsx (Client)
│       └── components/chat/source-card.tsx (Client)
├── app/dashboard/page.tsx (Server — Suspense wrapped)
│   ├── components/dashboard/stat-card.tsx (Client)
│   ├── components/dashboard/usage-chart.tsx (Client)
│   ├── components/dashboard/recent-chats.tsx (Client)
│   ├── components/dashboard/top-documents.tsx (Client)
│   ├── components/dashboard/cost-summary.tsx (Client)
│   ├── components/dashboard/kb-stats.tsx (Client)
│   └── components/dashboard/system-health.tsx (Client)
├── app/(admin)/documents/page.tsx (Server — DashboardShell)
│   └── components/documents/document-list.tsx (Client)
├── app/(admin)/documents/upload/page.tsx (Server — DashboardShell)
│   └── components/documents/upload-form.tsx (Client)
├── app/(admin)/settings/page.tsx (Server — DashboardShell)
│   └── components/settings/ai-settings-form.tsx (Client)
├── app/ai/playground/page.tsx (Server — DashboardShell)
│   └── components/ai/playground-editor.tsx (Client)
│       ├── components/ai/parameter-controls.tsx (Client)
│       ├── components/ai/model-selector.tsx (Client)
│       └── components/ai/compare-mode.tsx (Client)
├── app/ai/prompts/page.tsx (Server — DashboardShell)
│   └── components/ai/prompt-list.tsx (Client)
├── app/ai/prompts/[id]/page.tsx (Server — DashboardShell)
│   └── components/ai/prompt-editor.tsx (Client)
│       └── components/ai/prompt-version-list.tsx (Client)
├── app/analytics/usage/page.tsx (Server — DashboardShell)
│   └── components/analytics/usage-analytics.tsx (Client)
├── app/analytics/chat/page.tsx (Server — DashboardShell)
│   └── components/analytics/chat-analytics.tsx (Client)
├── app/analytics/cost/page.tsx (Server — DashboardShell)
│   └── components/analytics/cost-analytics.tsx (Client)
├── app/knowledge/documents/page.tsx (Server — DashboardShell)
│   └── components/knowledge/document-explorer.tsx (Client)
├── app/knowledge/documents/[id]/page.tsx (Server — DashboardShell)
│   └── components/knowledge/chunk-viewer.tsx (Client)
├── app/knowledge/chunks/page.tsx (Server — DashboardShell)
│   └── components/knowledge/chunk-viewer.tsx (Client)
├── app/knowledge/search/page.tsx (Server — DashboardShell)
│   └── components/knowledge/similarity-search.tsx (Client)
└── app/knowledge/sources/page.tsx (Server — DashboardShell)
    └── components/knowledge/source-viewer.tsx (Client)
```

### Layout Components

| Component | Tipe | Fungsi |
|-----------|------|--------|
| `DashboardShell` | Server | Auth check + wrapper, redirect ke `/login` jika null |
| `DashboardShellClient` | Client | Sidebar + top nav + content area |
| `AppSidebar` | Client | Navigasi sidebar dengan collapsible sections |
| `TopNav` | Client | Top bar dengan user menu, mobile toggle |
| `MobileNav` | Client | Sheet-based mobile navigation |

### Component Responsibilities

| Component | Tipe | State | API Calls |
|-----------|------|-------|-----------|
| [`ChatWindow`](components/chat/chat-window.tsx) | Client | `messages[]`, `sessionId`, `input`, `isLoading`, `currentSources[]`, `sidebarOpen` | `POST /api/chat` (stream), `GET/DELETE /api/chat/sessions` |
| [`MessageBubble`](components/chat/message-bubble.tsx) | Client | — (props only) | — |
| [`SessionSidebar`](components/chat/session-sidebar.tsx) | Client | `sessions[]`, `loading` | `GET /api/chat/sessions`, `DELETE /api/chat/sessions` |
| [`SourceCard`](components/chat/source-card.tsx) | Client | — (props only) | — |
| [`DocumentList`](components/documents/document-list.tsx) | Client | `documents[]`, `loading` | `GET /api/documents`, `DELETE /api/documents/[id]` |
| [`UploadForm`](components/documents/upload-form.tsx) | Client | `uploadType`, `uploading`, `result` | `POST /api/upload` |
| [`AISettingsForm`](components/settings/ai-settings-form.tsx) | Client | `settings{}`, `chatModels[]`, `embeddingModels[]`, `saving` | `GET /api/admin/settings`, `POST /api/admin/settings`, `POST /api/admin/models` |
| [`LoginForm`](components/auth/login-form.tsx) | Client | `error`, `loading` | Server action `login()` |
| [`RegisterForm`](components/auth/register-form.tsx) | Client | `error`, `success`, `loading` | Server action `register()` |
| [`PlaygroundEditor`](components/ai/playground-editor.tsx) | Client | `systemPrompt`, `userMessage`, `model`, `temperature`, `maxTokens`, `streaming`, `response`, `history[]` | `POST /api/ai/playground`, `POST /api/ai/prompts` |
| [`PromptEditor`](components/ai/prompt-editor.tsx) | Client | `name`, `content`, `category`, `prompt`, `showVersions` | `GET/PUT /api/ai/prompts/[id]`, `POST /api/ai/prompts`, `POST /api/ai/prompts/[id]/revert` |
| [`PromptList`](components/ai/prompt-list.tsx) | Client | `prompts[]`, `loading`, `search`, `category` | `GET /api/ai/prompts`, `DELETE /api/ai/prompts/[id]` |
| [`DocumentExplorer`](components/knowledge/document-explorer.tsx) | Client | `documents[]`, `pagination`, `search`, `filterType`, `filterStatus`, `sortField`, `viewMode` | `GET /api/knowledge/documents`, `DELETE /api/documents/[id]` |
| [`ChunkViewer`](components/knowledge/chunk-viewer.tsx) | Client | `chunks[]`, `pagination`, `search`, `selectedChunk`, `similarChunks` | `GET /api/knowledge/chunks`, `GET /api/knowledge/chunks/[id]/similar`, `DELETE /api/knowledge/chunks/[id]` |
| [`SimilaritySearch`](components/knowledge/similarity-search.tsx) | Client | `query`, `topK`, `threshold`, `results[]`, `metrics`, `filterDoc` | `POST /api/knowledge/search`, `GET /api/knowledge/documents` |
| [`SourceViewer`](components/knowledge/source-viewer.tsx) | Client | `sources[]`, `stats`, `sortBy`, `filterType` | `GET /api/knowledge/sources` |

## Sequence Diagrams

### Login Flow

```mermaid
sequenceDiagram
    actor User
    participant Form as LoginForm
    participant Action as login() Server Action
    participant NextAuth
    participant DB as PostgreSQL

    User->>Form: Isi email + password
    Form->>Action: handleSubmit → login(formData)
    Action->>NextAuth: signIn("credentials", {email, password})
    NextAuth->>DB: findUnique({email})
    DB-->>NextAuth: User {id, email, passwordHash}
    NextAuth->>NextAuth: bcrypt.compare(password, passwordHash)
    alt Password valid
        NextAuth-->>Action: Success
        Action->>User: redirect("/documents")
    else Password invalid
        NextAuth-->>Action: AuthError
        Action->>User: redirect("/login?error=CredentialsSignin")
    end
```

### Document Upload + Processing Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Form as UploadForm
    participant API as /api/upload
    participant Parser as parser.ts
    participant Chunker as chunker.ts
    participant Embedder as embedder.ts
    participant Store as vectorstore.ts
    participant DB as PostgreSQL

    Admin->>Form: Pilih file / masukkan URL
    Form->>API: POST /api/upload (FormData)
    API->>API: auth() check
    API->>Parser: parseFile(buffer, fileType)
    Parser-->>API: {content, metadata}
    API->>DB: INSERT document (status: processing)
    API-->>Form: {id, title, status: "processing"}

    Note over API,DB: Background processing (async)

    API->>Chunker: chunkText(content)
    Chunker-->>API: Chunk[]
    API->>Embedder: generateEmbeddings(texts)
    alt Provider supports embeddings
        Embedder->>Embedder: openai.embeddings.create()
    else Provider tidak support (e.g., Mimo Pro)
        Embedder->>Embedder: generateLocalEmbedding() fallback
    end
    Embedder-->>API: number[][]
    API->>Store: storeChunks(documentId, chunks)
    Store->>DB: INSERT INTO document_chunks (batch 50)
    API->>DB: UPDATE document SET status=ready, chunkCount=N
```

### Chat RAG Streaming Flow

```mermaid
sequenceDiagram
    actor User
    participant CW as ChatWindow
    participant API as /api/chat
    participant Limit as ratelimit
    participant Chain as chain.ts
    participant Embed as embedder.ts
    participant VS as vectorstore.ts
    participant AI as AI Provider
    participant DB as PostgreSQL

    User->>CW: Ketik pertanyaan, submit
    CW->>API: POST /api/chat {message, sessionId}
    API->>Limit: ratelimit.limit(ip)
    alt Rate limit exceeded
        API-->>CW: 429 Too Many Requests
    end
    API->>DB: Find/Create ChatSession
    API->>DB: INSERT ChatMessage (role: user)
    API->>Chain: streamRAGResponse(message, 5)
    Chain->>Embed: generateEmbedding(question)
    alt Provider supports embeddings
        Embed->>AI: openai.embeddings.create()
    else Fallback
        Embed->>Embed: generateLocalEmbedding()
    end
    Embed-->>Chain: queryEmbedding (1536-dim)
    Chain->>VS: searchSimilarChunks(queryEmbedding, 5)
    VS->>DB: SELECT ... ORDER BY embedding <=> query LIMIT 5
    DB-->>VS: SimilarChunk[]
    VS-->>Chain: chunks with similarity scores
    Chain->>AI: openai.chat.completions.create({stream: true})
    AI-->>Chain: Stream<ChatCompletionChunk>
    Chain-->>API: {stream, sources, noContext: false}

    API->>API: TransformStream (capture fullResponse)
    API-->>CW: Streaming text + X-Session-Id + X-Sources headers

    loop Setiap chunk
        CW->>CW: Update message state
    end

    API->>DB: INSERT ChatMessage (role: assistant, content, sources)
```

### Settings Save + Provider Refresh Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Form as AISettingsForm
    participant API as /api/admin/settings
    participant Settings as settings.ts
    participant Provider as ai-provider.ts
    participant DB as PostgreSQL

    Admin->>Form: Ubah provider / model / API key
    Admin->>Form: Klik "Simpan"
    Form->>API: POST /api/admin/settings {ai_provider, ai_api_key, ...}
    API->>Settings: setSettings(entries)
    Settings->>DB: UPSERT each setting
    Settings->>Settings: Invalidate cache (settingsCache = null)
    API->>Provider: invalidateProviderCache()
    Provider->>Provider: cachedClient = null
    API-->>Form: {success: true}
    Form->>Form: Show success message
```

## Design Decisions

### 1. Multi-Provider via OpenAI-Compatible API

**Keputusan**: Semua AI provider menggunakan OpenAI SDK client.

**Alasan**: Semua provider modern (Mimo Pro, OpenRouter, LM Studio, Ollama) mendukung endpoint `/v1/chat/completions` yang identik dengan OpenAI. Dengan satu SDK, kita bisa support 6+ provider tanpa library tambahan.

**Trade-off**: Fitur khusus provider (contoh: Ollama `keep_alive`, OpenAI `response_format`) tidak bisa digunakan tanpa abstraction layer tambahan.

### 2. JWT Strategy (bukan Database Sessions)

**Keputusan**: `session: { strategy: "jwt" }` di NextAuth config.

**Alasan**: Mengurangi query database pada setiap request. Session data disimpan di cookie (encrypted JWT), cukup verifikasi signature saja.

**Trade-off**: Tidak bisa invalidate session dari server-side (harus tunggu JWT expired). Untuk app skala kecil ini acceptable.

### 3. Settings di Database dengan Env Fallback

**Keputusan**: Simpan AI settings di tabel `settings`, fallback ke environment variables.

**Alasan**: User bisa mengubah AI provider tanpa restart server atau edit `.env`. Env variables sebagai default untuk deployment awal.

**Trade-off**: Cache 30 detik berarti perubahan settings tidak instant terlihat di semua request. Di-invalidate manual saat save.

### 4. Background Document Processing

**Keputusan**: Upload API langsung return, processing (chunking + embedding) berjalan di background via unhandled promise.

**Alasan**: Embedding bisa memakan waktu 10-30 detik untuk dokumen besar. User tidak perlu menunggu.

**Trade-off**: Jika processing gagal, user harus cek status manual. Tidak ada webhook/notification untuk memberitahu user. Document status di-update ke `failed` di database.

### 5. Local Embedding Fallback (Feature Hashing)

**Keputusan**: Jika provider tidak support embeddings, gunakan feature hashing (character trigrams + word tokens).

**Alasan**: Mimo Pro tidak punya endpoint embeddings. Tanpa embedding, pipeline RAG tidak bisa jalan. Feature hashing memungkinkan end-to-end testing.

**Trade-off**: Akurasi similarity search lebih rendah dibanding neural embeddings. Cocok untuk development/testing, kurang ideal untuk production.

### 6. Sources via HTTP Headers (bukan Body)

**Keputusan**: Kirim sources di response headers (`X-Sources`), bukan di response body.

**Alasan**: Response body digunakan untuk streaming text. Headers dikirim sebelum body, sehingga client bisa langsung parse sources tanpa menunggu stream selesai.

**Trade-off**: Headers memiliki size limit (~8KB di beberapa proxy). Sources di-encode dengan `encodeURIComponent` untuk handle karakter non-ASCII.

### 7. Raw SQL untuk Vector Operations

**Keputusan**: Prisma `Unsupported("vector(1536)")` + raw SQL `$executeRaw`/`$queryRaw`.

**Alasan**: Prisma tidak mendukung pgvector secara native. Raw SQL memberikan akses penuh ke operator cosine distance (`<=>`).

**Trade-off**: Tidak ada type safety dari Prisma untuk query vector. Harus hati-hati dengan SQL injection (mitigated oleh Prisma template literals).

### 8. Password Hashing di Server Actions (bukan API Route)

**Keputusan**: Registrasi user via server action [`register()`](lib/actions.ts:8) yang memanggil API route internal.

**Alasan**: Server actions bisa langsung redirect dan handle form state. API route tetap ada untuk fleksibilitas (bisa dipanggil dari client juga).

**Trade-off**: Dua entry point untuk registrasi (server action + API route) — perlu konsistensi validasi.

## Security Model

### Authentication

| Mekanisme | Implementasi | File |
|-----------|-------------|------|
| Password hashing | bcryptjs (10 rounds) | [`lib/auth.ts`](lib/auth.ts:33), [`app/api/auth/register/route.ts`](app/api/auth/register/route.ts) |
| Session token | JWT (encrypted, di cookie) | [`lib/auth.ts`](lib/auth.ts:9) — `strategy: "jwt"` |
| Session data | `user.id` di JWT token via callback | [`lib/auth.ts`](lib/auth.ts:51-62) |
| Login page | Custom `/login` (bukan default NextAuth) | [`lib/auth.ts`](lib/auth.ts:11) |

### Authorization

| Resource | Protection | Mekanisme |
|----------|-----------|-----------|
| Upload file | Auth required | `await auth()` check di [`app/api/upload/route.ts`](app/api/upload/route.ts:13) |
| List documents | Auth required | `await auth()` check di [`app/api/documents/route.ts`](app/api/documents/route.ts) |
| Delete document | Auth required + ownership | Auth check + `where: { id, userId }` di [`app/api/documents/[id]/route.ts`](app/api/documents/[id]/route.ts) |
| AI settings | Auth required | `await auth()` check di [`app/api/admin/settings/route.ts`](app/api/admin/settings/route.ts) |
| Chat | Public | Rate-limited saja, tidak perlu auth |
| Admin pages (UI) | Auth required | Server component `await auth()` + `redirect("/login")` |

### Rate Limiting

| Endpoint | Limit | Window | Mekanisme |
|----------|-------|--------|-----------|
| `POST /api/chat` | 20 requests | 1 menit | Per IP address |
| Lainnya | Tidak ada | — | — |

**Implementasi**: [`lib/ratelimit.ts`](lib/ratelimit.ts) — Upstash Redis (production) atau in-memory Map (development fallback).

### Input Validation

| Input | Validasi | Lokasi |
|-------|----------|--------|
| Email (register) | Required, format email | [`app/api/auth/register/route.ts`](app/api/auth/register/route.ts) |
| Password (register) | Min 6 chars, must match confirm | [`app/api/auth/register/route.ts`](app/api/auth/register/route.ts) |
| Chat message | Required, must be string | [`app/api/chat/route.ts`](app/api/chat/route.ts:23) |
| File type | Whitelist: pdf, docx, txt, csv, xlsx, xls | [`app/api/upload/route.ts`](app/api/upload/route.ts:51) |
| Document ID | UUID format (via Prisma) | [`app/api/documents/[id]/route.ts`](app/api/documents/[id]/route.ts) |

### Data Protection

| Aspek | Implementasi |
|-------|-------------|
| Password storage | bcrypt hash, tidak pernah plaintext |
| API keys | Disimpan di database (plaintext) — **TODO: encrypt at rest** |
| User data isolation | Documents filtered by `userId` pada query |
| SQL injection | Prisma template literals untuk raw SQL |
| XSS | React auto-escape, tidak ada `dangerouslySetInnerHTML` |
| CSRF | NextAuth built-in CSRF protection |
| File storage | Local filesystem di `/public/uploads/` — **TODO: cloud storage untuk production** |

### Attack Surface

```mermaid
graph LR
    subgraph "Exposed"
        ChatAPI[POST /api/chat<br/>Public + Rate Limit]
        RegisterAPI[POST /api/auth/register<br/>Public]
        LoginAPI[/api/auth/*<br/>Public]
    end

    subgraph "Protected (Auth Required)"
        UploadAPI[POST /api/upload]
        DocAPI[GET/DELETE /api/documents]
        SettingsAPI[GET/POST /api/admin/settings]
        ModelsAPI[POST /api/admin/models]
    end

    subgraph "Internal"
        DB[(PostgreSQL)]
        AI[AI Provider API]
        FS[File System]
    end

    ChatAPI -->|Rate Limited| AI
    ChatAPI -->|Read Only| DB
    UploadAPI -->|Auth Check| FS
    UploadAPI -->|Auth Check| DB
    SettingsAPI -->|Auth Check| DB
```
