# Project Memory — Mimotes

> Sumber kebenaran utama untuk konteks proyek. Dibaca SEBELUM setiap tugas.
> Terakhir diperbarui: 2026-06-24

---

## Project Overview

**Mimotes** adalah platform chatbot AI berbasis web dengan teknologi RAG (Retrieval-Augmented Generation). User mengupload dokumen, sistem memproses menjadi chunks + embeddings, lalu chatbot menjawab pertanyaan berdasarkan isi dokumen tersebut.

- **Nama**: Mimotes
- **Versi**: 0.3.0
- **Status**: Active — Production-capable (workspace system, billing, API platform, widget, audit, RAG hardened)
- **Repo local**: `C:\Users\SMANSA\mimotes`
- **Access**: Cloudflare Tunnel → `mimotes.ekohomelab.online`
- **Port**: 3100 (Docker host) → 3000 (container)

---

## Architecture

### System Overview
```
Browser → Cloudflare Tunnel → Docker (port 3100)
  → Next.js 16 App Router (standalone, node server.js)
  → PostgreSQL 16 + pgvector (RLS per workspace)
  → AI Providers (Mimo/OpenAI/Custom/etc)
  → Embedding (API or local feature-hashing fallback)
```

### Key Architecture Decisions (2026-06-24)
1. **Workspace-aware AI settings**: Priority = Workspace Settings > Global Settings > Env
2. **AsyncLocalStorage** for workspace context per-request (bypasses Prisma connection pool RLS)
3. **Global settings** in `settings` table, workspace settings in `workspace_settings` table
4. **RLS policies** use `workspace_id` for defense-in-depth
5. **Stripe billing** with DB-level idempotency via `StripeWebhookEvent`
6. **Entitlements** enforced on 14+ API routes (30s cache)
7. **Audit logging** fire-and-forget, 41%+ route coverage
8. **Conversation history** last 10 messages + summarization (>3000 chars)
9. **Multimodal RAG** with Tesseract.js OCR + AI Vision captioning
10. **Null safety** on streaming chunks for cross-provider compatibility

### RAG Pipeline Flow
1. **Upload**: File/URL/Image → Parse → Sanitize → Chunk → Embed → Store
2. **Chat**: Question → Embed query → Cosine search (HNSW) → Build context → Stream AI
3. **History**: Fetch last 10 messages → Summarize if >3000 chars → Pass to AI as message array

---

## Tech Stack

| Komponen | Teknologi | Versi |
|----------|-----------|-------|
| Framework | Next.js (App Router, standalone) | 16.2.7 |
| React | React | 19.x |
| Language | TypeScript | ^5 |
| Database | PostgreSQL + pgvector | 16 |
| ORM | Prisma | 6.19.3 |
| Auth | NextAuth v5 (Credentials, JWT) | 5.0.0-beta.31 |
| AI SDK | OpenAI SDK + Vercel AI SDK | 6.41.0 / 6.0.194 |
| Styling | Tailwind CSS | v4 |
| UI | shadcn/ui (base-nova) | 4.10.0 |
| Charts | Recharts | 3.8.1 |
| Billing | Stripe (checkout, portal, webhook) | — |
| Rate Limiting | @upstash/ratelimit + in-memory fallback | — |
| Email | Resend + SMTP provider | — |
| Deploy | Docker Compose (multi-stage, 5 stages) | — |

---

## Codebase Metrics (2026-06-24)

| Category | Count |
|----------|-------|
| App files (routes/pages) | 176 |
| Component files | 139 |
| Lib files | 64 |
| API routes | 110+ |
| Admin pages | 23 |
| Prisma models | 36 |
| Component directories | 20 |

---

## Directory Structure (Current)

```
mimotes/
├── app/                          # Next.js App Router (176 files)
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage (public)
│   ├── (auth)/                   # Login, register
│   ├── (admin)/                  # Admin pages (23 pages)
│   │   ├── documents/            # Document list + upload
│   │   ├── leads/                # Lead management
│   │   ├── onboarding/           # Onboarding wizard
│   │   ├── settings/             # 14 settings pages
│   │   │   ├── account/          # Profile, name, timezone
│   │   │   ├── api-keys/         # API key management
│   │   │   ├── audit/            # Audit logs viewer
│   │   │   ├── baileys/          # WhatsApp Baileys config
│   │   │   ├── billing/          # Subscription & billing
│   │   │   ├── invoices/         # Invoice history
│   │   │   ├── language/         # Language selector
│   │   │   ├── leads/            # Leads settings
│   │   │   ├── mcp/              # MCP server config
│   │   │   ├── notifications/    # Notification settings
│   │   │   ├── page.tsx          # AI provider settings (GLOBAL)
│   │   │   ├── security/         # Password, login history
│   │   │   ├── usage/            # Usage analytics
│   │   │   ├── whatsapp/         # WhatsApp integration
│   │   │   ├── widget/           # Widget config
│   │   │   └── workspace/        # Members, roles, AI per-workspace
│   │   └── whatsapp/             # WhatsApp conversations
│   ├── chat/                     # Public chat page
│   ├── dashboard/                # Dashboard
│   ├── ai/                       # AI playground & prompts
│   ├── analytics/                # Chat, cost, usage, leads
│   ├── knowledge/                # KB explorer, chunks, search, images
│   ├── developer/                # Developer portal
│   └── api/                      # 110+ API routes
│
├── components/                   # 139 component files (20 dirs)
│   ├── ai/                       # Playground, prompts, compare, params
│   ├── analytics/                # Charts, KPIs, date range
│   ├── audit/                    # Audit log viewer
│   ├── auth/                     # Login & register forms
│   ├── billing/                  # Billing UI
│   ├── chat/                     # ChatWindow, MessageBubble, SourceCard
│   ├── dashboard/                # StatCard, UsageChart, RecentChats
│   ├── developers/               # API keys, docs, usage metrics
│   ├── documents/                # DocumentList, UploadForm
│   ├── knowledge/                # DocExplorer, ChunkViewer, SimSearch
│   ├── landing/                  # Landing page components
│   ├── layout/                   # Shell, sidebar, nav
│   ├── leads/                    # Lead management
│   ├── onboarding/               # Onboarding wizard
│   ├── settings/                 # AI settings form
│   ├── ui/                       # 17 shadcn/ui primitives
│   ├── whatsapp/                 # WhatsApp UI
│   ├── widget/                   # Widget settings
│   └── workspace/                # Workspace AI settings, members
│
├── lib/                          # 64 backend logic files
│   ├── actions.ts                # Server actions (auth)
│   ├── ai-provider.ts            # Multi-provider AI (workspace-aware)
│   ├── analytics.ts              # Analytics utilities
│   ├── api-auth.ts               # Bearer token middleware
│   ├── api-keys.ts               # Key gen, SHA-256 hash, CRUD
│   ├── api-rate-limit.ts         # Per-workspace rate limiting
│   ├── api-usage.ts              # Usage tracking, summaries
│   ├── audit.ts                  # logAudit, queryLogs, export CSV
│   ├── auth.ts                   # NextAuth config
│   ├── billing.ts                # isSubscriptionActive, reSubscribe
│   ├── crypto.ts                 # AES-256-GCM encryption
│   ├── entitlements.ts           # Feature gating (30s cache)
│   ├── invitations.ts            # Invitation system
│   ├── lead-detect.ts            # Lead detection
│   ├── lead-intelligence.ts      # Lead intelligence
│   ├── lead-intent.ts            # Lead intent analysis
│   ├── leads.ts                  # Lead CRUD
│   ├── middleware/tenant.ts       # Workspace tenant middleware
│   ├── prisma.ts                 # Prisma singleton + workspace context
│   ├── prompts/templates.ts      # KB/CS/Sales mode prompts
│   ├── ratelimit.ts              # Rate limiter
│   ├── rbac.ts                   # Role-based access control
│   ├── settings.ts               # DB settings + AsyncLocalStorage
│   ├── stripe.ts                 # Stripe lazy-init, webhook, checkout
│   ├── usage.ts                  # Usage limits
│   ├── widget.ts                 # Widget CRUD, key gen, origin validate
│   ├── whatsapp/                 # WhatsApp client, processor, webhook
│   ├── email/                    # Email providers (Resend, SMTP)
│   ├── mcp/                      # MCP client, manager, server, tools
│   └── rag/                      # RAG pipeline
│       ├── chain.ts              # generateRAGResponse, streamRAGResponse
│       ├── chunker.ts            # Text → chunks
│       ├── embedder.ts           # API + local fallback
│       ├── embedding-providers/  # Provider abstraction layer
│       ├── image-processor.ts    # Tesseract OCR + AI Vision
│       ├── parser.ts             # PDF, DOCX, TXT, CSV, XLSX, URL, images
│       ├── vectorstore.ts        # pgvector + HNSW + dedup + token budget
│       └── vision-provider.ts    # AI Vision for image captioning
│
├── prisma/                       # 36 models
├── public/widget.js              # Embeddable chat widget
├── .ai/                          # AI agent context
├── Dockerfile                    # 5-stage multi-stage build
├── docker-compose.yml            # db + migrate + app (+ n8n, baileys, paddleocr)
└── AGENTS.md                     # Agent rules
```

---

## Database Schema (36 Models)

### Core Models
| Model | Table | Purpose |
|-------|-------|---------|
| User | `users` | Admin users (bcrypt) |
| Document | `documents` | Uploaded file metadata |
| DocumentChunk | `document_chunks` | Text + vector embeddings (1536-dim) + multimodal fields |
| ChatSession | `chat_sessions` | Chat sessions (workspace-scoped) |
| ChatMessage | `chat_messages` | Messages + sources |
| Setting | `settings` | GLOBAL AI config (key-value) |
| WorkspaceSetting | `workspace_settings` | Per-workspace AI config |
| AnalyticsEvent | `analytics_events` | Event tracking |
| PromptTemplate | `prompt_templates` | AI prompt templates |
| PromptVersion | `prompt_versions` | Prompt versioning |

### Workspace & RBAC
| Model | Table | Purpose |
|-------|-------|---------|
| Workspace | `workspaces` | Multi-tenant workspaces |
| WorkspaceMember | `workspace_members` | User-workspace roles (owner/admin/editor/viewer) |
| Invitation | `invitations` | Workspace invitations |

### Billing & Subscriptions
| Model | Table | Purpose |
|-------|-------|---------|
| PlanFeature | `plan_features` | Entitlements per plan (Free/Pro/Enterprise) |
| WorkspaceSubscription | `workspace_subscriptions` | Stripe subscription + status |
| StripeWebhookEvent | `stripe_webhook_events` | Idempotent webhook processing |
| Invoice | `invoices` | Billing invoices |
| Payment | `payments` | Payment records |

### API Platform
| Model | Table | Purpose |
|-------|-------|---------|
| ApiKey | `api_keys` | API keys (SHA-256 hashed) |
| ApiUsageLog | `api_usage_logs` | API usage tracking |

### Widget Platform
| Model | Table | Purpose |
|-------|-------|---------|
| Widget | `widgets` | Chat widgets (public + secret keys) |
| WidgetConversation | `widget_conversations` | Widget chat sessions |
| WidgetMessage | `widget_messages` | Widget messages |

### Leads & Notifications
| Model | Table | Purpose |
|-------|-------|---------|
| Lead | `leads` | Customer leads |
| LeadEvent | `lead_events` | Lead activity tracking |
| Notification | `notifications` | User notifications |
| NotificationSetting | `notification_settings` | Notification preferences |

### WhatsApp
| Model | Table | Purpose |
|-------|-------|---------|
| WhatsAppConfig | `whatsapp_configs` | WhatsApp integration config |
| WhatsAppConversation | `whatsapp_conversations` | WhatsApp chat sessions |
| WhatsAppMessage | `whatsapp_messages` | WhatsApp messages |

### Audit & Misc
| Model | Table | Purpose |
|-------|-------|---------|
| AuditLog | `audit_logs` | Audit trail (fire-and-forget) |
| Folder | `folders` | Document folders |

### Document Chunks — Extended Fields
| Field | Type | Purpose |
|-------|------|---------|
| `chunkType` | text | "text" or "image" |
| `ocrText` | text | OCR extracted text |
| `caption` | text | AI vision caption |
| `imageSummary` | text | Image summary |
| `imageUrl` | text | Original image URL |

---

## API Endpoints (110+)

### Public (Rate Limited: 20/min/IP)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat` | RAG streaming chat (workspace-scoped) |
| GET | `/api/chat/sessions` | List sessions |
| DELETE | `/api/chat/sessions` | Delete session |
| POST | `/api/auth/register` | User registration |
| * | `/api/auth/[...nextauth]` | NextAuth handlers |
| POST | `/api/widget/chat` | Widget chat (public, rate limited) |
| POST | `/api/widget/chat/stream` | Widget streaming chat |
| GET | `/api/widget/config` | Widget config (public) |
| GET | `/api/health` | Health check |

### Auth Required (Session)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/upload` | File/URL upload |
| GET/POST | `/api/documents` | Document CRUD |
| GET/PUT/DELETE | `/api/documents/[id]` | Single document |
| POST | `/api/documents/bulk` | Bulk operations |
| GET/POST | `/api/folders` | Folder management |
| GET/POST | `/api/admin/settings` | AI settings (GLOBAL) |
| POST | `/api/admin/models` | Auto-detect models |
| GET/POST | `/api/ai/prompts` | Prompt CRUD |
| GET/PUT/DELETE | `/api/ai/prompts/[id]` | Prompt detail |
| POST | `/api/ai/playground` | Playground streaming |
| POST | `/api/ai/playground/compare` | Model comparison |
| GET | `/api/analytics/*` | Chat, cost, usage, leads, retrieval |
| GET | `/api/dashboard/*` | Stats, activity, cost, health |
| GET | `/api/knowledge/*` | Documents, chunks, search, images |
| GET | `/api/audit` | Audit logs |

### Auth Required (API Key — Bearer)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/chat` | API chat |
| POST | `/api/v1/search` | API search |
| GET | `/api/v1/documents` | API documents |
| GET/POST | `/api/v1/keys` | API key management |

### Workspace Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/PATCH | `/api/workspace` | Workspace settings |
| GET/POST/PATCH/DELETE | `/api/workspace/members` | Member CRUD |
| GET/POST | `/api/workspace/invitations` | Invitation management |
| POST | `/api/workspace/billing` | Plan change |
| POST | `/api/workspace/switch` | Switch workspace |
| POST | `/api/workspace/delete` | Delete workspace |
| POST | `/api/workspace/transfer` | Transfer ownership |

### Billing (Stripe)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/billing/checkout` | Create checkout session |
| POST | `/api/billing/portal` | Customer portal |
| POST | `/api/billing/webhook` | Stripe webhook (HMAC-SHA256) |

### Widget Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/widgets/*` | Widget CRUD |
| GET | `/api/widget/analytics` | Widget analytics |
| GET | `/api/widget/leads` | Widget leads |

### WhatsApp
| Method | Endpoint | Purpose |
|--------|----------|---------|
| * | `/api/whatsapp/*` | Baileys, config, conversations, webhook |

---

## Feature Inventory

### ✅ Core Features
- RAG chatbot with streaming response + conversation history (10 messages + summarization)
- Multi-format file upload (PDF, DOCX, TXT, CSV, XLSX, images)
- URL scraping (cheerio)
- Multi-AI provider (Mimo, OpenAI, Google, LM Studio, Ollama, OpenRouter, Custom)
- Public chat with rate limiting (20/min/IP)
- Admin authentication (NextAuth v5, JWT)
- Document management (upload, list, delete, bulk)
- AI provider settings (7 providers, auto-detect models)
- Workspace-aware AI settings (per-workspace, fallback to global)
- Source citations with document titles (not "Dokumen tidak diketahui")

### ✅ Workspace System
- Multi-tenant workspaces with RBAC (owner > admin > editor > viewer)
- Workspace member management (invite, remove, role change)
- Workspace switching
- Per-workspace AI provider configuration
- Workspace-scoped documents, chats, analytics
- Cross-tenant isolation via RLS + AsyncLocalStorage

### ✅ Billing & Revenue
- Stripe integration (checkout, portal, webhook)
- Subscription management (Free, Pro, Enterprise)
- Entitlements system (9 features × 3 plans, 30s cache)
- Feature gating on 14+ API routes
- Usage limits (chat, upload) with HTTP 429
- Subscription lifecycle (active, trial, past_due, canceled)

### ✅ API Platform
- API key management (SHA-256 hashed, `mk_live_` prefix)
- Bearer token authentication
- Per-workspace rate limiting (Free=10/min, Pro=60/min, Enterprise=600/min)
- Usage tracking and metrics
- Developer portal (`/developer`)

### ✅ Public Widget Platform
- Embeddable chat widget (`<script src=".../widget.js" data-key="pw_pub_xxx">`)
- Widget customization (theme, colors, greeting)
- Dual-layer rate limiting (per-key + per-IP)
- Visitor isolation (crypto.randomUUID)
- XSS protection (textContent only, no innerHTML)
- Domain allowlist validation

### ✅ Audit & Compliance
- Audit logging platform (`audit_logs` table, fire-and-forget)
- 41%+ route coverage (Phase 1 + Phase 2)
- 28+ action types tracked
- Audit log viewer UI with filtering, pagination, CSV export

### ✅ RAG Hardening
- HNSW vector index (m=16, ef_construction=64)
- Similarity threshold (0.30 default)
- Token budget (8000 tokens, 2000 reserved for response)
- Deduplication (removes near-duplicates)
- Metrics tracking (`X-Retrieval-Metrics` header)
- RLS policies using `workspace_id` (not `user_id`)
- Knowledge search filtered by workspace

### ✅ Multimodal RAG
- Image processing pipeline (sharp → OCR + Vision → summary → embedding)
- Tesseract.js OCR (Indonesian + English)
- AI Vision captioning
- Image chunks with `chunkType=image`, `ocrText`, `caption`, `imageSummary`
- `/knowledge/images` dashboard

### ✅ Analytics & Dashboard
- Chat analytics (sessions, messages, sources, top questions)
- Cost analytics (token estimates, daily costs)
- Usage analytics (daily events, unique users)
- Lead analytics and intelligence
- Dashboard with stat cards, usage charts, recent chats, top documents

### ✅ WhatsApp Integration
- Baileys (add-on, user accepts ban risk)
- Meta API preservation
- WhatsApp conversations management
- Webhook handling

### ✅ Other
- Onboarding wizard
- Lead management (detection, intelligence, intent)
- Email system (Resend + SMTP providers)
- MCP (Model Context Protocol) server integration
- Prompt management with versioning and testing
- AI Playground (system prompt, parameters, RAG context)
- Model comparison (compare mode)
- Notification system
- Document folders

---

## Key Files by Concern

| Concern | Files |
|---------|-------|
| **Auth** | `lib/auth.ts`, `lib/actions.ts`, `app/api/auth/*` |
| **Chat** | `app/api/chat/route.ts`, `components/chat/chat-window.tsx` |
| **RAG** | `lib/rag/chain.ts`, `chunker.ts`, `embedder.ts`, `parser.ts`, `vectorstore.ts` |
| **AI Config** | `lib/ai-provider.ts`, `lib/settings.ts`, `components/settings/ai-settings-form.tsx` |
| **Workspace AI** | `components/workspace/workspace-ai-settings.tsx`, `app/(admin)/settings/workspace/page.tsx` |
| **Entitlements** | `lib/entitlements.ts`, `lib/billing.ts` |
| **Stripe** | `lib/stripe.ts`, `app/api/billing/*` |
| **API Platform** | `lib/api-keys.ts`, `lib/api-auth.ts`, `lib/api-rate-limit.ts`, `lib/api-usage.ts` |
| **Widget** | `lib/widget.ts`, `public/widget.js`, `app/api/widget/*` |
| **Audit** | `lib/audit.ts`, `app/api/audit/route.ts` |
| **RBAC** | `lib/rbac.ts`, `lib/middleware/tenant.ts` |
| **Leads** | `lib/leads.ts`, `lib/lead-detect.ts`, `lib/lead-intelligence.ts` |
| **WhatsApp** | `lib/whatsapp/*`, `app/api/whatsapp/*` |
| **Email** | `lib/email/*` |
| **MCP** | `lib/mcp/*`, `app/api/mcp/*` |
| **Multimodal** | `lib/rag/image-processor.ts`, `lib/rag/vision-provider.ts` |
| **Database** | `prisma/schema.prisma`, `lib/prisma.ts` |
| **Deploy** | `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh` |

---

## Coding Standards

### Naming
- **Files**: kebab-case (`chat-window.tsx`)
- **Components**: PascalCase (`ChatWindow`)
- **Functions**: camelCase (`generateRAGResponse`)
- **Constants**: UPPER_SNAKE_CASE (`EMBEDDING_DIMENSION`)
- **DB tables**: snake_case (`chat_sessions`)
- **DB columns**: snake_case (`user_id`, `created_at`)

### Patterns
- Server Components: Default (no directive)
- Client Components: `"use client"` at line 1
- API Routes: `NextRequest` → `Response.json()`, try-catch
- Auth: `const session = await auth()`
- Prisma: Singleton in `lib/prisma.ts`, raw SQL for vector ops
- RLS: Wrap in `prisma.$transaction` with `set_config('app.current_workspace_id', ...)` 
- Path Alias: `@/*` → `./*`

---

## Critical Context

- **Docker**: `docker compose build --no-cache app && docker compose up -d app`
- **Container**: `mimotes-app-1` (port 3000 → host 3100), `mimotes-db-1` (PostgreSQL)
- **DB access**: `docker exec mimotes-db-1 psql -U mimotes -d mimotes`
- **Cloudflare Tunnel**: `mimotes.ekohomelab.online` → `localhost:3100`
- **Login**: `admin@mimotes.com` / `admin123`
- **Test account**: `hitlah@mail.com` / `123456`
- **AI provider (global)**: Custom → Mimo (xiaomimimo.com), model: mimo-v2.5
- **API key encryption**: AES-256-GCM (prefix `enc:v1:...`)
- **RLS**: All workspace tables use RLS; must set `app.current_workspace_id` via transaction
- **Embedding fallback**: When API embedding fails → local feature hashing (threshold 0.08)
- **Streaming null safety**: `chunk.choices?.[0]?.delta?.content` (cross-provider compat)
- **Settings endpoint**: `/api/admin/settings` saves to `settings` (GLOBAL), NOT `workspace_settings`

---

## Known Issues & Debt

### Critical
- SEC-001: API key encryption at rest (partially addressed with `lib/crypto.ts`)
- Embedding API returns 404 for some providers → falls back to local feature hashing

### High
- Widget chat route (`/api/widget/chat/stream`) doesn't load conversation history
- `/api/ai/playground` doesn't set workspace context (uses global only)

### Medium
- In-memory rate limiting lost on restart (no Redis in production)
- No widget creation limit per workspace
- Audit coverage at 41% (Phase 3+ needed)
- Summarization is substring-based, not AI-generated

### Low
- Duplicate streaming logic in some routes
- Approximate token counting (character-based)
- prompt() browser dialog in some UI

---

*File ini harus diperbarui setiap kali ada perubahan signifikan pada codebase.*
