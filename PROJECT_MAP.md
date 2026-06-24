# PROJECT_MAP.md — Peta Proyek Mimotes

> Pahami seluruh proyek dalam **10 menit**. File ini adalah peta navigasi cepat untuk Mimotes, chatbot AI berbasis dokumen (RAG).

---

## Folder Tree

```
mimotes/
│
├── app/                              # 📄 Pages & API (Next.js App Router)
│   ├── layout.tsx                    # Root layout — Inter font, metadata, wraps semua halaman
│   ├── page.tsx                      # Homepage — public landing page
│   ├── globals.css                   # Tailwind imports + custom animations
│   │
│   ├── (auth)/                       # 🔓 Auth pages (route group, no URL segment)
│   │   ├── login/page.tsx            # → /login — renders LoginForm
│   │   └── register/page.tsx         # → /register — renders RegisterForm
│   │
│   ├── (admin)/                      # 🔒 Admin pages (auth required, server-side check)
│   │   ├── documents/
│   │   │   ├── page.tsx              # → /documents — renders DocumentList
│   │   │   └── upload/page.tsx       # → /documents/upload — renders UploadForm
│   │   └── settings/page.tsx         # → /settings — renders AISettingsForm
│   │
│   ├── chat/page.tsx                 # → /chat — public chat page, renders ChatWindow
│   │
│   └── api/                          # ⚡ Backend API routes
│       ├── auth/
│       │   ├── [...nextauth]/route.ts    # NextAuth handlers (GET/POST)
│       │   └── register/route.ts         # POST — user registration
│       ├── chat/
│       │   ├── route.ts                  # POST — chat with RAG streaming
│       │   └── sessions/route.ts         # GET/DELETE — session management
│       ├── documents/
│       │   ├── route.ts                  # GET — list user's documents
│       │   └── [id]/route.ts             # GET/DELETE — single document
│       ├── upload/route.ts               # POST — file/URL upload
│       └── admin/
│           ├── settings/route.ts         # GET/POST — AI provider settings
│           └── models/route.ts           # POST — auto-detect available models
│
├── components/                       # 🧩 Reusable UI components
│   ├── auth/
│   │   ├── login-form.tsx            # Client — email/password form, calls login() server action
│   │   └── register-form.tsx         # Client — registration form, calls register() server action
│   ├── chat/
│   │   ├── chat-window.tsx           # Client — main chat: state, streaming, sessions sidebar
│   │   ├── message-bubble.tsx        # Client — renders single message (user or assistant)
│   │   └── source-card.tsx           # Client — renders source reference with similarity
│   ├── documents/
│   │   ├── document-list.tsx         # Client — fetches & displays documents, handles delete
│   │   └── upload-form.tsx           # Client — file upload + URL upload, dual mode
│   ├── settings/
│   │   └── ai-settings-form.tsx      # Client — provider grid, model detection, save settings
│   └── ui/                           # (reserved — empty, for future shared UI primitives)
│
├── lib/                              # 🧠 Backend logic & utilities
│   ├── actions.ts                    # Server actions: register(), login(), logout()
│   ├── ai-provider.ts               # Multi-provider AI client factory + PROVIDER_PRESETS
│   ├── auth.ts                       # NextAuth v5 config (Credentials, JWT, callbacks)
│   ├── prisma.ts                     # Prisma client singleton (global caching)
│   ├── ratelimit.ts                  # Rate limiter (Upstash Redis or in-memory fallback)
│   ├── settings.ts                   # DB settings helper with 30s cache + env fallback
│   ├── streaming.ts                  # Re-export createTextStreamResponse from "ai" package
│   ├── utils.ts                      # getClientIP() helper
│   └── rag/                          # 🤖 RAG pipeline
│       ├── chain.ts                  # Orchestrator: generateRAGResponse(), streamRAGResponse()
│       ├── chunker.ts                # Text → chunks (paragraph-based, sentence fallback)
│       ├── embedder.ts              # Text → vectors (API or local feature-hashing fallback)
│       ├── parser.ts                 # File → text (PDF, DOCX, TXT, CSV, XLSX, URL)
│       └── vectorstore.ts           # pgvector: INSERT chunks, cosine similarity SELECT
│
├── prisma/
│   ├── schema.prisma                 # Database schema — 6 models
│   └── migrations/                   # Auto-generated SQL migrations
│
├── scripts/
│   ├── seed-admin.ts                 # Creates admin user (email: admin@mimotes.com)
│   ├── docker-migrate.sh             # Wait for DB → run prisma migrate
│   └── setup-db.sh                   # Local dev: create DB + enable pgvector
│
├── Dockerfile                        # 5-stage build: deps → prisma → migrations → builder → runner
├── docker-compose.yml                # 3 services: db (pgvector), migrate, app
├── docker-entrypoint.sh              # Seeds admin on container start if SEED_ADMIN=true
├── next.config.ts                    # standalone output, serverExternalPackages (prisma, pdf-parse)
├── package.json                      # Dependencies & scripts
├── tsconfig.json                     # TypeScript config, path alias @/* → ./*
└── AGENTS.md                         # Agent rules (Next.js docs reminder)
```

---

## Component Hierarchy

```
app/layout.tsx [RootLayout]
│
├── app/page.tsx [HomePage]
│   └── (no child components — static landing page)
│
├── app/(auth)/login/page.tsx
│   └── LoginForm          ← "use client"
│
├── app/(auth)/register/page.tsx
│   └── RegisterForm       ← "use client"
│
├── app/chat/page.tsx
│   └── ChatWindow         ← "use client"
│       ├── MessageBubble  ← "use client" (per message)
│       └── SourceCard     ← "use client" (per source)
│
├── app/(admin)/documents/page.tsx     [Server — auth guard]
│   └── DocumentList       ← "use client"
│
├── app/(admin)/documents/upload/page.tsx  [Server — auth guard]
│   └── UploadForm         ← "use client"
│
└── app/(admin)/settings/page.tsx      [Server — auth guard]
    └── AISettingsForm     ← "use client"
```

### Component Responsibilities

| Component | State | API Calls | Notes |
|-----------|-------|-----------|-------|
| `ChatWindow` | `messages[]`, `sessionId`, `input`, `isLoading`, `sessions[]` | `POST /api/chat` (stream), `GET /api/chat/sessions`, `DELETE /api/chat/sessions` | Core chat logic: streaming read via `ReadableStream`, session sidebar |
| `MessageBubble` | — (props) | — | Renders user/assistant messages with basic text formatting |
| `SourceCard` | — (props) | — | Shows document chunk with similarity percentage |
| `DocumentList` | `documents[]`, `loading` | `GET /api/documents`, `DELETE /api/documents/[id]` | Fetch on mount, delete with confirmation |
| `UploadForm` | `uploadType` (file/url), `uploading`, `result` | `POST /api/upload` | Dual-mode: file picker or URL input |
| `AISettingsForm` | `settings{}`, `provider`, `chatModels[]`, `embeddingModels[]`, `saving`, `detecting` | `GET /api/admin/settings`, `POST /api/admin/settings`, `POST /api/admin/models` | Provider grid, auto-detect models, save |
| `LoginForm` | `error`, `loading` | Server action `login()` | Form with email/password |
| `RegisterForm` | `error`, `success`, `loading` | Server action `register()` | Form with name/email/password/confirm |

---

## API Map

```
┌─────────────────────────────────────────────────────────────────┐
│                         PUBLIC (no auth)                         │
│                   Rate limited: 20 req/min/IP                    │
├──────────────────────┬──────────────────────────────────────────┤
│ POST /api/chat       │ Send message → RAG → streaming response  │
│                      │ Body: { message, sessionId? }            │
│                      │ Response: streaming text                  │
│                      │ Headers: X-Session-Id, X-Sources          │
├──────────────────────┼──────────────────────────────────────────┤
│ GET /api/chat/       │ List all chat sessions                    │
│     sessions         │ Response: [{ id, title, createdAt }]      │
├──────────────────────┼──────────────────────────────────────────┤
│ DELETE /api/chat/    │ Delete session + all messages              │
│     sessions?id=X    │ Response: { success: true }               │
├──────────────────────┼──────────────────────────────────────────┤
│ POST /api/auth/      │ Register new user                         │
│     register         │ Body: { name, email, password, confirm }  │
├──────────────────────┼──────────────────────────────────────────┤
│ * /api/auth/         │ NextAuth handlers                         │
│   [...nextauth]      │ (login, callback, session, csrf)          │
└──────────────────────┴──────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     AUTH REQUIRED (session)                      │
├──────────────────────┬──────────────────────────────────────────┤
│ POST /api/upload     │ Upload file or URL → create document      │
│                      │ Body: FormData { file } or { url }        │
│                      │ Response: { id, title, status }           │
│                      │ Processing: async background              │
├──────────────────────┼──────────────────────────────────────────┤
│ GET /api/documents   │ List user's documents                     │
│                      │ Response: [{ id, title, fileType, status }]│
├──────────────────────┼──────────────────────────────────────────┤
│ GET /api/documents/  │ Get single document detail                 │
│     [id]             │ Response: { id, title, chunks, ... }      │
├──────────────────────┼──────────────────────────────────────────┤
│ DELETE /api/         │ Delete document + all chunks               │
│   documents/[id]     │ Response: { success: true }               │
├──────────────────────┼──────────────────────────────────────────┤
│ GET /api/admin/      │ Get all AI settings                       │
│     settings         │ Response: { ai_provider, ai_api_key, ... }│
├──────────────────────┼──────────────────────────────────────────┤
│ POST /api/admin/     │ Save AI settings (batch upsert)           │
│     settings         │ Body: { ai_provider, ai_api_key, ... }    │
├──────────────────────┼──────────────────────────────────────────┤
│ POST /api/admin/     │ Auto-detect models from provider           │
│     models           │ Body: { baseUrl, apiKey }                 │
│                      │ Response: { models: string[] }            │
└──────────────────────┴──────────────────────────────────────────┘
```

### Data Flow per Endpoint

```
POST /api/chat
  └→ ratelimit → save user message → streamRAGResponse()
       └→ generateEmbedding() → searchSimilarChunks() → openai.chat.completions.create({stream})
       └→ TransformStream captures full response → save assistant message
       └→ Response: streaming text + headers

POST /api/upload
  └→ auth() → parseFile() → create Document (status: processing) → return immediately
  └→ [background] processDocument()
       └→ chunkText() → generateEmbeddings() → storeChunks() → update Document (status: ready)

GET /api/documents
  └→ auth() → prisma.document.findMany({ where: { userId } })

DELETE /api/documents/[id]
  └→ auth() → deleteDocumentChunks() → prisma.document.delete()

POST /api/admin/settings
  └→ auth() → setSettings() → invalidateProviderCache()

POST /api/admin/models
  └→ auth() → new OpenAI({baseUrl, apiKey}).models.list()
```

---

## Database Relationships

```
┌──────────────┐       ┌──────────────────┐       ┌────────────────────┐
│    users      │       │   documents       │       │  document_chunks   │
├──────────────┤       ├──────────────────┤       ├────────────────────┤
│ id (PK,uuid) │──┐    │ id (PK,uuid)     │──┐    │ id (PK,uuid)       │
│ email (UK)   │  │    │ user_id (FK) →───│──┘    │ document_id (FK)→──│──┘
│ name         │  │    │ title             │       │ content (text)     │
│ password_hash│  │    │ file_type         │       │ embedding (vector) │
│ created_at   │  │    │ file_url          │       │ chunk_index        │
│ updated_at   │  │    │ status            │       │ metadata (jsonb)   │
└──────────────┘  │    │ chunk_count       │       │ created_at         │
                  │    │ created_at        │       └────────────────────┘
                  │    │ updated_at        │
                  │    └──────────────────┘
                  │
                  │    ┌──────────────────┐       ┌────────────────────┐
                  │    │  chat_sessions    │       │   chat_messages    │
                  │    ├──────────────────┤       ├────────────────────┤
                  └───→│ id (PK,uuid)     │──┐    │ id (PK,uuid)       │
                       │ user_id (FK, null│──┘    │ session_id (FK)→───│──┘
                       │ title            │       │ role               │
                       │ created_at       │       │ content (text)     │
                       └──────────────────┘       │ sources (jsonb)    │
                                                  │ created_at         │
                                                  └────────────────────┘

┌──────────────┐
│   settings   │
├──────────────┤
│ id (PK,uuid) │
│ key (UK)     │   Keys: ai_provider, ai_api_key, ai_base_url,
│ value        │          ai_model, ai_embedding_model
│ updated_at   │
└──────────────┘
```

### Relationship Summary

| Parent | Child | FK | On Delete |
|--------|-------|----|-----------|
| `users` | `documents` | `user_id` | **Cascade** — hapus user → hapus semua dokumen |
| `users` | `chat_sessions` | `user_id` (nullable) | **SetNull** — hapus user → session tetap ada (userId = null) |
| `documents` | `document_chunks` | `document_id` | **Cascade** — hapus dokumen → hapus semua chunks |
| `chat_sessions` | `chat_messages` | `session_id` | **Cascade** — hapus session → hapus semua pesan |

### Key Data Types

- **`embedding`**: `vector(1536)` — pgvector type, 1536-dimensional float array
- **`sources`**: JSON array of `{ documentId, content, similarity, metadata }`
- **`metadata`**: JSON object on chunks, contains `{ chunkIndex, source }`
- **`status`**: `"processing"` | `"ready"` | `"failed"`
- **`role`**: `"user"` | `"assistant"`
- **`file_type`**: `"pdf"` | `"docx"` | `"txt"` | `"csv"` | `"xlsx"` | `"url"`

---

## User Flow

### Flow 1: Admin Uploads Document

```
Admin ──→ /documents/upload ──→ UploadForm
                                    │
                    ┌───────────────┴───────────────┐
                    │ File Upload                     │ URL Upload
                    ▼                                 ▼
              POST /api/upload                  POST /api/upload
              (FormData: file)                  (FormData: url)
                    │                                 │
                    ▼                                 ▼
              parseFile(buffer, ext)            parseURL(url)
              PDF→pdf-parse                     cheerio scrape
              DOCX→mammoth                      remove scripts/nav/footer
              TXT→buffer.toString               extract body text
              CSV→csv-parse
              XLSX→xlsx
                    │                                 │
                    └───────────────┬─────────────────┘
                                    ▼
                            sanitizeText()
                            (remove BOM, smart quotes, etc.)
                                    │
                                    ▼
                            Create Document (status: "processing")
                                    │
                            Return {id, title, status} to client
                                    │
                                    ▼ [background async]
                            chunkText(rawContent)
                            → paragraph splitting → sentence splitting
                            → 500 chars/chunk, 50 words overlap
                                    │
                                    ▼
                            generateEmbeddings(chunkTexts)
                            → API call or local fallback
                            → 1536-dim vectors
                                    │
                                    ▼
                            storeChunks(documentId, chunks)
                            → INSERT into document_chunks
                            → batch of 50 per transaction
                                    │
                                    ▼
                            Update Document (status: "ready", chunkCount: N)
```

### Flow 2: User Asks a Question

```
User ──→ /chat ──→ ChatWindow
                      │
                      ▼
              User types question + submits
                      │
                      ▼
              POST /api/chat { message, sessionId? }
                      │
                      ▼
              ratelimit.limit(ip) ──→ 429 if exceeded
                      │
                      ▼
              Find/Create ChatSession
              Save user ChatMessage
                      │
                      ▼
              streamRAGResponse(message, topK=5)
                      │
              ┌───────┴───────┐
              ▼               ▼
    generateEmbedding   searchSimilarChunks
    (question → 1536-dim)   (cosine similarity, LIMIT 5)
              │               │
              └───────┬───────┘
                      ▼
              Build context from top-K chunks
              "[1] chunk content\n[2] chunk content..."
                      │
                      ▼
              openai.chat.completions.create({
                model, stream: true,
                messages: [
                  { role: "system", content: systemPrompt + context },
                  { role: "user", content: question }
                ]
              })
                      │
                      ▼
              TransformStream:
              ├─ transform: stream chunk → client + accumulate
              └─ flush: save full response + sources to DB
                      │
                      ▼
              Response headers:
              ├─ X-Session-Id: uuid
              └─ X-Sources: encodeURIComponent(JSON.stringify(sources))
                      │
                      ▼
              ChatWindow reads stream chunk-by-chunk
              Updates message state in real-time
              Parses X-Sources for source cards
```

### Flow 3: Admin Configures AI Provider

```
Admin ──→ /settings ──→ AISettingsForm
                              │
                              ▼
                      GET /api/admin/settings
                      Load current settings from DB
                              │
                              ▼
                      Display provider grid (6 options)
                      ┌─────────────────────────────────┐
                      │  Mimo Pro  │  OpenAI  │  LM Studio │
                      │  Ollama    │  OpenRouter │  Custom   │
                      └─────────────────────────────────┘
                              │
                      Admin selects provider
                      → handleProviderChange() updates form fields
                      → loads default base URL, model, embedding model
                              │
                              ▼
                      [Optional] "Detect Models" button
                      POST /api/admin/models { baseUrl, apiKey }
                      → openai.models.list()
                      → populate model dropdowns
                              │
                              ▼
                      Admin clicks "Save"
                      POST /api/admin/settings { ai_provider, ai_api_key, ... }
                              │
                              ▼
                      setSettings() → UPSERT each key to settings table
                      → invalidate cache
                      → invalidateProviderCache()
                              │
                              ▼
                      Next chat request uses new provider
```

### Flow 4: Authentication

```
                    ┌──────────────────────┐
                    │    Unauthenticated    │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                                 ▼
        User visits /login              User visits /register
        └→ LoginForm                    └→ RegisterForm
              │                                 │
              ▼                                 ▼
        login(formData)                 register(formData)
        server action                   server action
              │                                 │
              ▼                                 ▼
        signIn("credentials")           POST /api/auth/register
              │                          → validate → hash password
              ▼                          → INSERT user
        NextAuth authorize()                   │
              │                                 ▼
              ▼                            redirect /login
        bcrypt.compare()                        │
              │                                 ▼
              ▼                            (enters login flow)
        JWT cookie set
        redirect /documents
              │
              ▼
        ┌──────────────────────┐
        │    Authenticated      │
        │  session.user.id      │
        └──────────────────────┘
              │
              ▼
        Can access:
        ├── /documents (view)
        ├── /documents/upload (upload)
        ├── /settings (configure AI)
        ├── POST /api/upload
        ├── GET/DELETE /api/documents
        └── GET/POST /api/admin/settings
```

---

## Quick Reference

### Key Files by Concern

| Concern | Files |
|---------|-------|
| **Auth** | [`lib/auth.ts`](lib/auth.ts), [`lib/actions.ts`](lib/actions.ts), [`app/api/auth/register/route.ts`](app/api/auth/register/route.ts) |
| **Chat** | [`app/api/chat/route.ts`](app/api/chat/route.ts), [`components/chat/chat-window.tsx`](components/chat/chat-window.tsx) |
| **RAG** | [`lib/rag/parser.ts`](lib/rag/parser.ts), [`lib/rag/chunker.ts`](lib/rag/chunker.ts), [`lib/rag/embedder.ts`](lib/rag/embedder.ts), [`lib/rag/vectorstore.ts`](lib/rag/vectorstore.ts), [`lib/rag/chain.ts`](lib/rag/chain.ts) |
| **AI Config** | [`lib/ai-provider.ts`](lib/ai-provider.ts), [`lib/settings.ts`](lib/settings.ts), [`components/settings/ai-settings-form.tsx`](components/settings/ai-settings-form.tsx) |
| **Documents** | [`app/api/upload/route.ts`](app/api/upload/route.ts), [`app/api/documents/route.ts`](app/api/documents/route.ts), [`components/documents/document-list.tsx`](components/documents/document-list.tsx), [`components/documents/upload-form.tsx`](components/documents/upload-form.tsx) |
| **Database** | [`prisma/schema.prisma`](prisma/schema.prisma), [`lib/prisma.ts`](lib/prisma.ts) |
| **Deploy** | [`Dockerfile`](Dockerfile), [`docker-compose.yml`](docker-compose.yml), [`docker-entrypoint.sh`](docker-entrypoint.sh) |
| **Rate Limit** | [`lib/ratelimit.ts`](lib/ratelimit.ts), [`lib/utils.ts`](lib/utils.ts) |

### Tech Stack at a Glance

```
Frontend:  React 19 + Next.js 16 (App Router) + Tailwind CSS 4
Backend:   Next.js API Routes + Server Actions + Server Components
Database:  PostgreSQL 16 + Prisma 6 (ORM) + pgvector (vector search)
Auth:      NextAuth v5 (Credentials, JWT)
RBAC:      Custom RBAC (owner > admin > editor > viewer)
AI:        OpenAI SDK → Mimo Pro / OpenAI / LM Studio / Ollama / OpenRouter
Billing:   Stripe (checkout, portal, webhook)
Deploy:    Docker Compose (multi-stage build, 3 services)
```

---

## 🔑 Fitur Admin & Manajemen Akun

> **Status: SIAP OPERASIONAL** — 34/34 fitur terhubung ke backend real

### RBAC System (lib/rbac.ts)

```
Role Hierarchy:  owner (4) > admin (3) > editor (2) > viewer (1)

Owner:  workspace:delete, workspace:transfer, workspace:billing
Admin:  member:read, member:invite, member:remove, member:update_role, workspace:update, workspace:settings
Editor: document:create/update/delete, prompt:create/update/delete, mcp:create/update/delete
Viewer: workspace:read, document:read, chat:read/create/send, analytics:read, prompt:read, mcp:read/execute
```

### Admin Routes

```
/app/(admin)/
├── documents/           → Document management (CRUD)
├── documents/upload/    → File/URL upload
├── leads/               → Lead management
├── leads/[id]/          → Lead detail
├── onboarding/          → Onboarding wizard
├── settings/
│   ├── account/         → Profile, name, timezone
│   ├── api-keys/        → API key management
│   ├── audit/           → Audit logs viewer
│   ├── baileys/         → WhatsApp Baileys config
│   ├── billing/         → Subscription & billing
│   ├── language/        → Language selector
│   ├── leads/           → Leads settings
│   ├── mcp/             → MCP server config
│   ├── notifications/   → Notification settings
│   ├── page.tsx         → AI provider settings
│   ├── security/        → Password, login history
│   ├── usage/           → Usage analytics
│   ├── whatsapp/        → WhatsApp integration
│   ├── widget/          → Widget config
│   └── workspace/       → Members, roles, danger zone
└── whatsapp/            → WhatsApp conversations
    └── conversations/[id]/
```

### Admin API Endpoints

```
/workspace/members          GET/POST/PATCH/DELETE  → Member CRUD
/workspace/members/[id]     PATCH/DELETE           → Role change/remove
/workspace/invitations      GET/POST               → Invite management
/workspace/invitations/[id]/resend  POST           → Resend invite
/workspace/invitations/[id]/revoke  POST           → Revoke invite
/workspace/activity         GET                    → Activity log
/workspace/api-keys         GET/POST/DELETE        → API key CRUD
/workspace/billing          GET/POST               → Billing summary/change plan
/workspace/delete           POST                   → Delete workspace (owner)
/workspace/transfer         POST                   → Transfer ownership
/workspace/switch           POST                   → Switch workspace
/workspace/subscription     GET                    → Subscription status

/admin/settings             GET/POST               → AI provider config
/admin/models               POST                   → Auto-detect models

/user/profile               GET/PATCH              → User profile
/user/password              POST                   → Change password
/user/sessions              GET                    → Login history

/audit                      GET                    → Audit logs

/billing/checkout           POST                   → Stripe checkout
/billing/portal             POST                   → Stripe portal
/billing/webhook            POST                   → Stripe webhook
```

### Database Tables (Admin-related)

```
Workspace              → id, name, slug, description, avatarUrl
WorkspaceMember        → id, workspaceId, userId, role, lastActiveAt
WorkspaceSetting       → id, workspaceId, key, value
WorkspaceSubscription  → id, workspaceId, planId, status
Invitation             → id, workspaceId, email, role, token, expiresAt
AuditLog               → id, workspaceId, actorId, action, resourceType, resourceId
ApiKey                 → id, workspaceId, name, keyPrefix, hash, isActive
```

### Audit Trail Actions

```
auth.login / auth.logout / auth.login_failed
user.password_change
workspace.update / workspace.delete
member.invite / member.remove / member.role_change
invitation.created / invitation.accepted / invitation.revoked
```

详细审计报告: `ADMIN_AUDIT_REPORT.md`
