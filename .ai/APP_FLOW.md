# Mimotes App Flow Map

> Dokumen komprehensif seluruh alur, route, API, dan navigasi aplikasi Mimotes.
> Tujuan: AI agent lain bisa melanjutkan tanpa perlu scan ulang codebase.
> Last updated: 2025-06-23

---

## 1. Arsitektur & Framework

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16.2.7 (App Router, Turbopack) |
| Database | PostgreSQL 16 + pgvector |
| Auth | NextAuth v5 (beta) — Credentials + JWT |
| AI Provider | OpenAI-compatible (Mimo Pro, OpenAI, LM Studio, Ollama, OpenRouter, Custom) |
| RAG | pgvector cosine similarity + chunking |
| Deployment | Docker Compose (multi-stage) |
| Ext Services | Stripe (billing), WhatsApp Baileys, n8n, PaddleOCR |

---

## 2. Route Map (Frontend Pages)

### 2.1 Public Routes

| URL | File | Access | Deskripsi |
|-----|------|--------|-----------|
| `/` | `app/page.tsx` | Public | Landing page (homepage) |
| `/login` | `app/(auth)/login/page.tsx` | Public | Login form |
| `/register` | `app/(auth)/register/page.tsx` | Public | Register form |
| `/forgot-password` | `app/(auth)/forgot-password/page.tsx` | Public | Reset password |
| `/chat` | `app/chat/page.tsx` | Public (rate-limited) | Public chat widget |
| `/widget/preview` | `app/widget/preview/page.tsx` | Public | Widget preview page |
| `/developers` | `app/developers/page.tsx` | Public | Developer docs/info |
| `/invite/[token]` | `app/(public)/invite/[token]/page.tsx` | Public | Accept workspace invitation |

### 2.2 Protected Routes (Auth Required)

| URL | File | Access | Deskripsi |
|-----|------|--------|-----------|
| `/onboarding` | `app/(admin)/onboarding/page.tsx` | Auth | New user onboarding wizard |
| `/dashboard` | `app/dashboard/page.tsx` | Auth | Main dashboard dengan stats & widgets |

#### Dokumen & Knowledge Base
| URL | File | Access | Deskripsi |
|-----|------|--------|-----------|
| `/documents` | `app/(admin)/documents/page.tsx` | Auth | List dokumen |
| `/documents/upload` | `app/(admin)/documents/upload/page.tsx` | Auth | Upload dokumen baru |
| `/knowledge` | `app/knowledge/page.tsx` | Auth | Knowledge base explorer |
| `/knowledge/documents` | `app/knowledge/documents/page.tsx` | Auth | Dokumen dengan metadata |
| `/knowledge/documents/[id]` | `app/knowledge/documents/[id]/page.tsx` | Auth | Detail dokumen |
| `/knowledge/chunks` | `app/knowledge/chunks/page.tsx` | Auth | Lihat chunks + embedding |
| `/knowledge/search` | `app/knowledge/search/page.tsx` | Auth | Similarity search |
| `/knowledge/images` | `app/knowledge/images/page.tsx` | Auth | Image gallery dari dokumen |
| `/knowledge/sources` | `app/knowledge/sources/page.tsx` | Auth | Source citations viewer |

#### AI & Playground
| URL | File | Access | Deskripsi |
|-----|------|--------|-----------|
| `/ai` | `app/ai/page.tsx` | Auth | AI hub |
| `/ai/playground` | `app/ai/playground/page.tsx` | Auth | AI prompt playground |
| `/ai/prompts` | `app/ai/prompts/page.tsx` | Auth | Prompt template list |
| `/ai/prompts/new` | `app/ai/prompts/new/page.tsx` | Auth | Buat prompt baru |
| `/ai/prompts/[id]` | `app/ai/prompts/[id]/page.tsx` | Auth | Edit prompt |

#### Analytics
| URL | File | Access | Deskripsi |
|-----|------|--------|-----------|
| `/analytics` | `app/analytics/page.tsx` | Auth | Analytics overview |
| `/analytics/chat` | `app/analytics/chat/page.tsx` | Auth | Chat analytics (volume, topics) |
| `/analytics/cost` | `app/analytics/cost/page.tsx` | Auth | Cost analytics (token usage, $) |
| `/analytics/usage` | `app/analytics/usage/page.tsx` | Auth | Usage analytics (requests, limits) |
| `/analytics/leads` | `app/analytics/leads/page.tsx` | Auth | Lead analytics dashboard |

#### Settings (Semua di bawah `/settings/*`)
| URL | File | Access | Deskripsi |
|-----|------|--------|-----------|
| `/settings` | `app/(admin)/settings/page.tsx` | Auth | AI Provider settings |
| `/settings/account` | `app/(admin)/settings/account/page.tsx` | Auth | User profile settings |
| `/settings/workspace` | `app/(admin)/settings/workspace/page.tsx` | Auth | Workspace settings |
| `/settings/security` | `app/(admin)/settings/security/page.tsx` | Auth | Security settings (password, 2FA) |
| `/settings/notifications` | `app/(admin)/settings/notifications/page.tsx` | Auth | Notification preferences |
| `/settings/language` | `app/(admin)/settings/language/page.tsx` | Auth | Language/i18n settings |
| `/settings/api-keys` | `app/(admin)/settings/api-keys/page.tsx` | Auth | API key management |
| `/settings/mcp` | `app/(admin)/settings/mcp/page.tsx` | Auth | MCP server management |
| `/settings/widget` | `app/(admin)/settings/widget/page.tsx` | Auth | Widget settings & integration |
| `/settings/whatsapp` | `app/(admin)/settings/whatsapp/page.tsx` | Auth | WhatsApp gateway config |
| `/settings/baileys` | `app/(admin)/settings/baileys/page.tsx` | Auth | WhatsApp Baileys connection |
| `/settings/leads` | `app/(admin)/settings/leads/page.tsx` | Auth | Lead capture settings |
| `/settings/billing` | `app/(admin)/settings/billing/page.tsx` | Auth | **Subscription & billing** |
| `/settings/invoices` | `app/(admin)/settings/invoices/page.tsx` | Auth | Invoice list & download |
| `/settings/audit` | `app/(admin)/settings/audit/page.tsx` | Auth | Audit logs viewer |
| `/settings/usage` | `app/(admin)/settings/usage/page.tsx` | Auth | Current usage & limits |

#### WhatsApp
| URL | File | Access | Deskripsi |
|-----|------|--------|-----------|
| `/whatsapp` | `app/(admin)/whatsapp/page.tsx` | Auth | WhatsApp conversations list |
| `/whatsapp/conversations/[id]` | `app/(admin)/whatsapp/conversations/[id]/page.tsx` | Auth | Chat detail per contact |

#### Leads
| URL | File | Access | Deskripsi |
|-----|------|--------|-----------|
| `/leads` | `app/(admin)/leads/page.tsx` | Auth | Leads dashboard |
| `/leads/[id]` | `app/(admin)/leads/[id]/page.tsx` | Auth | Lead detail profile |

#### Super Admin Only
| URL | File | Access | Deskripsi |
|-----|------|--------|-----------|
| `/admin/users` | `app/admin/users/page.tsx` | **Super Admin** | User management across workspaces |

#### Wizard
| URL | File | Access | Deskripsi |
|-----|------|--------|-----------|
| `/wizard` | `app/wizard/page.tsx` | Auth | Setup wizard (new workspace) |

---

## 3. Route Groups & Layout

```
app/
├── layout.tsx                    ← Root layout (ThemeProvider, Toaster, skip link)
├── page.tsx                      ← Landing (public)
├── (auth)/layout.tsx             ← Auth layout (clean, no sidebar)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
├── (admin)/layout.tsx            ← Admin layout (DashboardShell, sidebar, top nav)
│   ├── onboarding/page.tsx
│   ├── documents/
│   ├── settings/
│   ├── leads/
│   ├── whatsapp/
│   └── ...
├── (public)/                     ← Public (no auth, standalone)
│   └── invite/[token]/page.tsx
├── admin/
│   └── users/page.tsx            ← Super admin only (separate layout)
├── ai/
├── analytics/
├── knowledge/
├── chat/
├── dashboard/
├── developers/
├── wizard/
└── widget/
```

**Key**: `(auth)` dan `(admin)` adalah **Route Groups** — tidak menambah prefix URL. Layout `(admin)` memiliki DashboardShell dengan sidebar & top nav.

---

## 4. API Route Map (Backend)

### 4.1 Auth
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST | `/api/auth/register` | Register user | Public |
| ALL | `/api/auth/[...nextauth]` | NextAuth v5 (login/logout/session) | Public |

### 4.2 Billing (Stripe)
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST | `/api/billing/checkout` | Create Stripe checkout session | Yes + Admin |
| GET | `/api/billing/checkout` | List plans & price IDs | Yes |
| POST | `/api/billing/portal` | Create Stripe customer portal | Yes |
| POST | `/api/billing/webhook` | Receive Stripe webhooks | Stripe Signature |

### 4.3 Workspace
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET/PUT | `/api/workspace` | Get/Update workspace | Yes |
| POST | `/api/workspace/switch` | Switch active workspace | Yes |
| POST | `/api/workspace/leave` | Leave workspace | Yes |
| POST | `/api/workspace/delete` | Delete workspace (owner) | Yes + Owner |
| GET | `/api/workspace/activity` | Recent workspace activity | Yes |
| GET | `/api/workspace/members` | List workspace members | Yes |
| PUT | `/api/workspace/members/[id]` | Update member role | Yes + Admin |
| GET/POST | `/api/workspace/invitations` | Invite / list invitations | Yes + Admin |
| POST | `/api/workspace/invitations/[id]/resend` | Resend invitation | Yes + Admin |
| POST | `/api/workspace/invitations/[id]/revoke` | Revoke invitation | Yes + Admin |
| POST | `/api/workspace/transfer` | Transfer workspace ownership | Yes + Owner |

### 4.4 Subscription & Billing
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/workspace/subscription` | Current subscription status | Yes |
| GET/POST | `/api/workspace/billing` | Billing usage & history | Yes |
| GET | `/api/workspace/invoices` | List invoices | Yes |
| POST | `/api/onboarding/complete` | Finish onboarding | Yes |
| GET | `/api/onboarding/status` | Check onboarding status | Yes |
| POST | `/api/onboarding/step` | Save onboarding progress | Yes |

### 4.5 Documents & Upload
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST | `/api/upload` | File upload (multipart) | Yes |
| GET/POST | `/api/documents` | List / create documents | Yes |
| GET/DELETE | `/api/documents/[id]` | Get / delete document | Yes |
| POST | `/api/documents/bulk` | Bulk operations | Yes |
| GET | `/api/folders` | Folder listing | Yes |

### 4.6 Knowledge Base
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/knowledge/documents` | Documents with metadata | Yes |
| GET/DELETE | `/api/knowledge/documents/[id]` | Document detail | Yes |
| GET | `/api/knowledge/documents/[id]/chunks` | Chunks per document | Yes |
| GET/POST | `/api/knowledge/chunks` | Chunk CRUD | Yes |
| GET | `/api/knowledge/chunks/[id]` | Single chunk | Yes |
| GET | `/api/knowledge/chunks/[id]/similar` | Similar chunks | Yes |
| GET | `/api/knowledge/search` | Similarity search | Yes |
| GET | `/api/knowledge/sources` | Source citations | Yes |
| GET | `/api/knowledge/images` | Image assets | Yes |
| GET/POST | `/api/knowledge/documents/stats` | Usage stats | Yes |

### 4.7 Chat
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST | `/api/chat` | AI chat streaming | Yes/Public (rate-limited) |
| GET/POST | `/api/chat/sessions` | Session CRUD | Yes |

### 4.8 AI Playground
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST | `/api/ai/playground` | Run prompt via playground | Yes |
| POST | `/api/ai/playground/compare` | Compare models | Yes |
| GET | `/api/ai/playground/history` | History | Yes |
| GET/POST | `/api/ai/prompts` | Prompt templates CRUD | Yes |
| GET/PUT/DELETE | `/api/ai/prompts/[id]` | Prompt detail | Yes |
| POST | `/api/ai/prompts/[id]/test` | Test prompt | Yes |
| POST | `/api/ai/prompts/[id]/revert` | Revert prompt | Yes |
| GET | `/api/ai/prompts/[id]/versions` | Prompt versions | Yes |

### 4.9 Analytics
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/analytics/chat` | Chat metrics | Yes |
| GET | `/api/analytics/cost` | Cost metrics | Yes |
| GET | `/api/analytics/usage` | Usage metrics | Yes |
| GET | `/api/analytics/leads` | Lead analytics | Yes |
| GET | `/api/analytics/events` | Raw events | Yes |
| GET | `/api/analytics/export` | Export data CSV | Yes |
| GET | `/api/analytics/evaluation` | RAG evaluation | Yes |
| GET | `/api/analytics/retrieval` | Retrieval metrics | Yes |

### 4.10 Dashboard
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/dashboard/stats` | Dashboard KPIs | Yes |
| GET | `/api/dashboard/usage` | Usage cards | Yes |
| GET | `/api/dashboard/cost` | Cost cards | Yes |
| GET | `/api/dashboard/top-documents` | Top documents | Yes |
| GET | `/api/dashboard/activity` | Recent activity | Yes |
| GET | `/api/dashboard/health` | System health | Yes |

### 4.11 WhatsApp
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/whatsapp/conversations` | List conversations | Yes |
| GET | `/api/whatsapp/conversations/[id]` | Detail + messages | Yes |
| GET/POST | `/api/whatsapp/config` | WhatsApp gateway config | Yes |
| POST | `/api/whatsapp/config/test` | Test config | Yes |
| POST | `/api/whatsapp/webhook` | Webhook dari WhatsApp gateway | Public |
| POST | `/api/whatsapp/n8n` | n8n integration | Yes |
| GET/POST | `/api/whatsapp/baileys` | Baileys connection | Yes |
| GET | `/api/whatsapp/baileys/qr` | QR code pairing | Yes |
| POST | `/api/whatsapp/baileys/send` | Send message | Yes |
| POST | `/api/whatsapp/baileys/logout` | Logout device | Yes |
| POST | `/api/whatsapp/baileys/incoming` | Incoming message | Yes |
| GET | `/api/whatsapp/baileys/status` | Connection status | Yes |

### 4.12 Widget (External Embed)
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/widgets/list` | List widgets (admin) | Yes |
| POST | `/api/widgets/create` | Create widget | Yes |
| GET/PUT/DELETE | `/api/widgets/[id]` | Widget detail | Yes |
| GET | `/api/widget/embed` | Embed script config | Public (key-based) |
| GET | `/api/widget/config` | Widget config | Public (key-based) |
| POST | `/api/widget/chat` | Chat via widget | Public (key-based) |
| GET | `/api/widget/chat/stream` | Streaming chat | Public (key-based) |
| GET/POST | `/api/widget/conversations` | Widget conversations | Public (key-based) |
| GET | `/api/widget/conversations/[id]/messages` | Messages | Public |
| GET | `/api/widget/analytics` | Widget stats | Yes |
| GET | `/api/widget/leads` | Leads from widget | Yes |
| GET | `/api/widget/leads/export` | Export leads CSV | Yes |

### 4.13 MCP (Model Context Protocol)
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET/POST | `/api/mcp/servers` | MCP server CRUD | Yes |
| GET/PUT/DELETE | `/api/mcp/servers/[id]` | Server detail | Yes |
| GET | `/api/mcp/tools` | List available tools | Yes |
| POST | `/api/mcp/connect` | Connect to MCP server | Yes |
| POST | `/api/mcp/call` | Execute MCP tool | Yes |
| GET/POST | `/api/mcp/route.ts` | [if exists] | Yes |

### 4.14 Leads
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET/POST | `/api/leads` | Lead CRUD | Yes |
| GET | `/api/leads/[id]` | Lead detail | Yes |
| GET | `/api/leads/[id]/intelligence` | AI lead scoring | Yes |
| POST | `/api/leads/[id]/seen` | Mark lead as seen | Yes |
| GET | `/api/leads/[id]/transcript` | Chat transcript | Yes |
| POST | `/api/leads/notifications` | Lead notification settings | Yes |

### 4.15 Admin
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/admin/users` | List all users (super admin) | Yes + Super Admin |
| POST | `/api/admin/users/suspend` | Suspend/unsuspend user | Yes + Super Admin |
| GET | `/api/admin/settings` | Global settings | Yes + Super Admin |
| GET | `/api/admin/models` | Model management | Yes + Super Admin |

### 4.16 Public API (v1)
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| POST | `/api/v1/chat` | Chat via API | API Key |
| POST | `/api/v1/documents` | Upload via API | API Key |
| GET | `/api/v1/search` | Search via API | API Key |
| GET/POST | `/api/v1/keys` | API key management | Yes |

### 4.17 User Self-Service
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| PUT | `/api/user/profile` | Update profile | Yes |
| PUT | `/api/user/password` | Change password | Yes |
| GET/DELETE | `/api/user/sessions` | Active sessions | Yes |

### 4.18 Audit
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/audit` | Audit logs query | Yes + Admin |

### 4.19 Notifications
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET/POST | `/api/notifications/settings` | Notification config | Yes |

### 4.20 API Keys
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET/POST | `/api/workspace/api-keys` | Manage workspace API keys | Yes + Admin |

### 4.21 Health & Uploads
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/health` | Health check endpoint | Public |
| GET | `/uploads/[...path]` | Serve uploaded files | Yes (with auth) |

### 4.22 Invitations
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/invitations/accept/[token]` | Accept invitation | Public |

### 4.23 Operations
| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/api/operations/status` | System operational status | Yes |

---

## 5. Navigation Structure (Sidebar)

### Sidebar Menu Items (DashboardShell)

```
DashboardShell Layout
├── TopNav
│   ├── SearchBar (global search)
│   ├── Workspace Switcher (dropdown)
│   ├── Notification Bell 
│   └── User Avatar (dropdown)
│
├── AppSidebar (left nav, collapsible)
│   ├── Home
│   │   └── /dashboard
│   ├── Chat
│   │   └── /chat
│   ├── AI
│   │   ├── /ai (AI Hub)
│   │   ├── /ai/playground
│   │   └── /ai/prompts
│   ├── Knowledge Base
│   │   ├── /knowledge/documents
│   │   ├── /knowledge/chunks
│   │   ├── /knowledge/search
│   │   ├── /knowledge/sources
│   │   └── /knowledge/images
│   ├── Analytics
│   │   ├── /analytics/chat
│   │   ├── /analytics/cost
│   │   ├── /analytics/usage
│   │   └── /analytics/leads
│   ├── Settings
│   │   ├── /settings/account
│   │   ├── /settings/workspace
│   │   ├── /settings/billing     ← Subscription & upgrade
│   │   ├── /settings/invoices
│   │   ├── /settings/usage
│   │   ├── /settings/api-keys
│   │   ├── /settings/mcp
│   │   ├── /settings/widget
│   │   ├── /settings/whatsapp
│   │   ├── /settings/baileys
│   │   ├── /settings/leads
│   │   ├── /settings/security
│   │   ├── /settings/notifications
│   │   ├── /settings/language
│   │   └── /settings/audit
│   ├── WhatsApp
│   │   └── /whatsapp
│   ├── Leads
│   │   └── /leads
│   ├── Widget Integration
│   │   └── /settings/widget
│   ├── Admin (SUPER_ADMIN only)
│   │   └── /admin/users
│   └── Developers
│       └── /developers
│
├── MobileNav (bottom sheet on mobile)
└── Main Content Area (slot children)
```

---

## 6. Auth & Security Flow

### 6.1 Middleware (`middleware.ts`)

```
Incoming Request
├── Public? (/login, /register, /chat, /, /api/health)
│   └── ALLOW
├── Protected Route? (/dashboard, /settings, /admin, /api/*)
│   ├── Check JWT session
│   ├── NO session → redirect /login?callbackUrl=...
│   └── API route → 401 JSON
├── Admin Route? (/admin/*)
│   ├── Check is_super_admin
│   ├── NO → 403
│
Protected API Routes (selected):
- /api/dashboard/*, /api/analytics/*, /api/admin/*
- /api/mcp/*, /api/upload, /api/documents, /api/knowledge/*
- /api/ai/*, /api/workspace/*, /api/workspace/subscription, /api/workspace/billing*
```

### 6.2 RBAC (Role-Based Access Control)

| Role | Capabilities |
|------|-------------|
| **Owner** | Full CRUD, delete workspace, transfer ownership, billing |
| **Admin** | Manage members, settings, billing, documents, invites |
| **Member** | Create documents, chat, upload, view analytics |
| **Viewer** | Read-only (view documents, chat history) |

RBAC enforced via `requireRole(workspaceId, userId, minRole)` in lib/rbac.ts

### 6.3 Row Level Security (RLS)

PostgreSQL RLS policies active on:
- `users`, `workspaces`, `workspace_members`
- `documents`, `document_chunks`
- `workspace_subscriptions`, `invoices`, `payments`
- All WhatsApp & Widget tables

---

## 7. Database Schema (Prisma)

### 7.1 Core Models

```prisma
User                      ── Users table (auth)
Workspace                 ── Tenant/workspace abstraction
WorkspaceMember           ── User-role mapping per workspace
Folder                    ── Document folders
Document                  ── Uploaded files (PDF, DOCX, etc.)
DocumentChunk             ── Vector chunks (pgvector)
ChatSession               ── Conversation groups
ChatMessage               ── Individual messages
WorkspaceSetting          ── Per-workspace config
WorkspaceUsage            ── Monthly usage counters
```

### 7.2 Billing Models

```prisma
SubscriptionPlan          ── Plan definitions (free/pro/enterprise)
WorkspaceSubscription     ── Active subscription per workspace
  ├─ stripeCustomerId
  ├─ stripeSubscriptionId
  ├─ stripePriceId
  ├─ status: active|past_due|canceled|trial
  ├─ currentPeriodStart/End
  └─ cancelAtPeriodEnd: boolean

Invoice                   ── Monthly invoice records
  ├─ invoiceNumber
  ├─ subtotal, tax, total
  ├─ periodStart/End
  ├─ paidAt
  └─ stripeInvoiceId

InvoiceLineItem           ── Line items per invoice
Payment                   ── Payment records
  ├─ amount, currency
  ├─ status: succeeded|pending|failed
  └─ stripePaymentId

SubscriptionEvent         ── Audit trail of plan changes
PlanFeatures              ── Feature flags per plan
ApiKeys                   ── Workspace API keys
ApiUsageLogs              ── API key usage telemetry
RetrievalLogs             ── RAG retrieval performance telemetry
OnboardingProgress        ── User onboarding wizard state
NotificationLogs          ── Notification delivery logs
Settings                  ── Global system key-value settings
Widgets                   ── Chat widget configurations (domain, style, keys)
```

### 7.3 Integration Models

```prisma
McpServer                 ── MCP server configuration
ApiKey                    ── Workspace API keys
WidgetConversation        ── External widget chats
WidgetMessage             ── Messages in widget
WhatsappConfig            ── WhatsApp gateway settings
WhatsappConversation      ── WhatsApp chat threads
WhatsappMessage           ── Individual WhatsApp messages
Lead                      ── Captured leads
PromptTemplate            ── Saved AI prompts
PromptVersion             ── Version history of prompts
AnalyticsEvent            ── Usage events
AuditLog                  ── Security audit trail
WorkspaceInvitation       ── Pending invites
NotificationConfig        ── Notification preferences
StripeWebhookEvent        ── Deduplication table
```

### 7.4 Subscription Plans (seeded)

| Plan | Docs | Storage | Messages | Chunks | AI Req | Members | Monthly |
|------|------|---------|----------|--------|--------|---------|---------|
| **Free** | 10 | 100 MB | 1,000 | 5,000 | 500 | 3 | $0 |
| **Pro** | 100 | 10 GB | 50,000 | 100,000 | 10,000 | 20 | $29 |
| **Enterprise** | ∞ | ∞ | ∞ | ∞ | ∞ | ∞ | $99 |

---

### Detailed Model Schemas

#### plan_features — Feature flags per subscription plan
```sql
id          TEXT PK
plan_id     TEXT FK → subscription_plans.id
feature     VARCHAR NOT NULL    -- e.g. "rag", "whatsapp", "api_keys", "mcp"
enabled     BOOLEAN DEFAULT true
created_at  TIMESTAMP DEFAULT now()
updated_at  TIMESTAMP
```

#### api_keys — Workspace API keys
```sql
id           TEXT PK
workspace_id TEXT FK → workspaces.id  NOT NULL
name         VARCHAR NOT NULL
key_hash     VARCHAR NOT NULL         -- bcrypt/scrypt hash
key_prefix   VARCHAR NOT NULL         -- first 8 chars for display
last_used_at TIMESTAMP NULL
expires_at   TIMESTAMP NULL
is_active    BOOLEAN DEFAULT true
created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### api_usage_logs — Per-request API key telemetry
```sql
id            TEXT PK
workspace_id  TEXT FK → workspaces.id  NOT NULL
api_key_id    TEXT FK → api_keys.id    NULL (if anon)
endpoint      VARCHAR NOT NULL
method        VARCHAR NOT NULL
status_code   INTEGER NOT NULL
latency_ms    INTEGER NOT NULL
tokens_used   INTEGER DEFAULT 0
ip_address    VARCHAR NULL
created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### workspace_usage — Monthly/periodic quota counters
```sql
id                TEXT PK
workspace_id      TEXT FK → workspaces.id  NOT NULL
period            VARCHAR NOT NULL          -- e.g. "2025-06"
documents_created INTEGER DEFAULT 0
storage_bytes_used BIGINT DEFAULT 0
chunks_created    INTEGER DEFAULT 0
chat_messages     INTEGER DEFAULT 0
ai_requests       INTEGER DEFAULT 0
embedding_requests INTEGER DEFAULT 0
mcp_executions    INTEGER DEFAULT 0
created_at        TIMESTAMP DEFAULT now()
updated_at        TIMESTAMP
```

#### retrieval_logs — RAG search performance telemetry
```sql
id                  UUID PK DEFAULT gen_random_uuid()
workspace_id        TEXT FK → workspaces.id  NOT NULL
query               TEXT NOT NULL
search_mode         VARCHAR NOT NULL         -- "vector", "bm25", "hybrid"
vector_results_count   INTEGER NULL
bm25_results_count     INTEGER NULL
reranked_results_count INTEGER NULL
search_latency_ms      INTEGER NULL
embedding_latency_ms   INTEGER NULL
reranker_latency_ms    INTEGER NULL
total_latency_ms       INTEGER NULL
retrieved_chunk_ids    JSONB NULL             -- array of chunk IDs
top_rrf_score          DOUBLE PRECISION NULL
top_similarity_score   DOUBLE PRECISION NULL
created_at             TIMESTAMP WITH TIME ZONE DEFAULT now()
```

#### onboarding_progress — User onboarding wizard state
```sql
id                   UUID PK DEFAULT gen_random_uuid()
user_id              TEXT FK → users.id      NOT NULL
workspace_id         TEXT FK → workspaces.id NOT NULL
current_step         INTEGER DEFAULT 1
business_name        TEXT NULL
business_type        TEXT DEFAULT 'general'
business_description TEXT NULL
business_whatsapp    TEXT NULL
business_phone       TEXT NULL
business_email       TEXT NULL
business_address     TEXT NULL
documents_uploaded   INTEGER DEFAULT 0
test_completed       BOOLEAN DEFAULT false
widget_id            TEXT NULL
completed            BOOLEAN DEFAULT false
started_at           TIMESTAMP WITH TIME ZONE DEFAULT now()
completed_at         TIMESTAMP WITH TIME ZONE NULL
```

#### widgets — Chat widget configurations
```sql
id                     TEXT PK
workspace_id           TEXT FK → workspaces.id  NOT NULL
name                   VARCHAR NOT NULL
slug                   VARCHAR NOT NULL         -- URL-friendly identifier
public_key             VARCHAR NOT NULL         -- client-side embed key
secret_key             VARCHAR NOT NULL         -- server-side HMAC key
allowed_domains        TEXT[] DEFAULT '{}'       -- domain allowlist
is_active              BOOLEAN DEFAULT true
primary_color          VARCHAR DEFAULT '#3B82F6'
background_color       VARCHAR DEFAULT '#FFFFFF'
text_color             VARCHAR DEFAULT '#1F2937'
logo_url               TEXT NULL
avatar_url             TEXT NULL
welcome_message        VARCHAR DEFAULT 'Hi! How can I help you?'
position               VARCHAR DEFAULT 'bottom-right'
quick_replies          TEXT[] DEFAULT '{}'       -- suggested quick-reply buttons
lead_capture_enabled   BOOLEAN DEFAULT false
lead_fields            JSONB DEFAULT '[]'        -- JSON array of form fields {name, type, required}
auto_trigger_messages  INTEGER DEFAULT 0         -- proactive message count
business_name          VARCHAR NULL
business_phone         VARCHAR NULL
business_email         VARCHAR NULL
business_whatsapp      VARCHAR NULL
business_address       TEXT NULL
business_description   TEXT NULL
mode                   VARCHAR DEFAULT 'knowledge_base'  -- "knowledge_base" | "customer_service" | "sales"
created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at             TIMESTAMP
```

#### notification_configs — Multi-channel notification preferences
```sql
id                  TEXT PK
workspace_id        TEXT FK → workspaces.id NOT NULL
email_enabled       BOOLEAN DEFAULT false
email_address       VARCHAR NULL
telegram_enabled    BOOLEAN DEFAULT false
telegram_bot_token  VARCHAR NULL
telegram_chat_id    VARCHAR NULL
discord_enabled     BOOLEAN DEFAULT false
discord_webhook_url VARCHAR NULL
notify_on_high_lead BOOLEAN DEFAULT true
notify_on_converted BOOLEAN DEFAULT true
created_at          TIMESTAMP DEFAULT now()
updated_at          TIMESTAMP
```

#### notification_logs — Notification delivery history
```sql
id               TEXT PK
workspace_id     TEXT FK → workspaces.id     NOT NULL
conversation_id  TEXT NULL
channel          VARCHAR NOT NULL            -- "email" | "telegram" | "discord"
event_type       VARCHAR NOT NULL            -- "new_lead" | "converted" | etc
recipient_email  VARCHAR NULL
status           VARCHAR DEFAULT 'sent'       -- "sent" | "failed" | "bounced"
error_message    TEXT NULL
created_at       TIMESTAMP DEFAULT now()
```

#### stripe_webhook_events — Stripe webhook deduplication
```sql
id            TEXT PK
stripe_event_id  VARCHAR NOT NULL UNIQUE
event_type       VARCHAR NOT NULL         -- checkout.session.completed, etc
processed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### settings — Global system key-value store
```sql
id         TEXT PK
key        VARCHAR NOT NULL UNIQUE
value      TEXT NOT NULL
updated_at TIMESTAMP
```

#### mcp_servers — MCP (Model Context Protocol) server configs
```sql
id          TEXT PK
name        VARCHAR NOT NULL
url         TEXT NOT NULL
api_key     TEXT NULL
is_active   BOOLEAN DEFAULT true
tools       JSONB DEFAULT '[]'         -- available tool schemas
user_id     TEXT FK → users.id        NOT NULL
workspace_id TEXT FK → workspaces.id  NOT NULL
created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at  TIMESTAMP
```



## 8. Component Hierarchy

```
components/
├── layout/
│   ├── DashboardShell.tsx         ← Main layout wrapper
│   ├── DashboardShellClient.tsx   ← Client-side shell logic
│   ├── AppSidebar.tsx             ← Left navigation
│   ├── TopNav.tsx                 ← Top bar
│   ├── MobileNav.tsx              ← Mobile bottom sheet
│   └── PageHeader.tsx             ← Page title + breadcrumbs
│
├── auth/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── LogoutButton.tsx
│
├── chat/
│   ├── ChatWindow.tsx
│   ├── MessageBubble.tsx
│   ├── SessionSidebar.tsx
│   ├── SourceCard.tsx
│   ├── EmptyState.tsx
│   └── ChatInput.tsx
│
├── documents/
│   ├── DocumentList.tsx
│   ├── DocumentCard.tsx
│   ├── UploadForm.tsx
│   ├── Dropzone.tsx
│   └── DocumentViewer.tsx
│
├── knowledge/
│   ├── DocumentExplorer.tsx
│   ├── ChunkViewer.tsx
│   ├── SimilaritySearch.tsx
│   └── SourceViewer.tsx
│
├── analytics/
│   ├── ChartCard.tsx
│   ├── KPICard.tsx
│   ├── DateRangeSelector.tsx
│   ├── ChatAnalytics.tsx
│   ├── CostAnalytics.tsx
│   └── UsageAnalytics.tsx
│
├── dashboard/
│   ├── StatCard.tsx
│   ├── UsageChart.tsx
│   ├── RecentChats.tsx
│   ├── TopDocuments.tsx
│   ├── CostSummary.tsx
│   ├── KBStats.tsx
│   ├── SystemHealth.tsx
│   └── UpgradeBanner.tsx         ← Billing upsell
│
├── settings/
│   ├── AISettingsForm.tsx
│   ├── BillingDashboard.tsx      ← Subscription & plan
│   ├── BillingPlanCard.tsx
│   ├── UsageMeter.tsx
│   ├── InvoiceList.tsx
│   ├── PlanStatus.tsx
│   └── UpgradeButton.tsx
│
├── ai/
│   ├── PlaygroundEditor.tsx
│   ├── PromptEditor.tsx
│   ├── ModelSelector.tsx
│   ├── CompareMode.tsx
│   ├── ParameterControls.tsx
│   └── PromptVersionList.tsx
│
├── leads/
│   ├── LeadTable.tsx
│   ├── LeadCard.tsx
│   └── LeadDetail.tsx
│
├── whatsapp/
│   ├── ConversationList.tsx
│   ├── ChatWindow.tsx
│   ├── QRCodeDialog.tsx
│   └── StatusBadge.tsx
│
├── widget/
│   ├── WidgetConfigForm.tsx
│   ├── WidgetPreview.tsx
│   ├── EmbedCode.tsx
│   └── WidgetStats.tsx
│
├── admin/
│   ├── UserTable.tsx             ← Super admin user mgmt
│   ├── SuspendUserDialog.tsx
│   └── AdminStats.tsx
│
├── ui/                           ← shadcn/ui primitives
│   ├── button.tsx, card.tsx, dialog.tsx
│   ├── input.tsx, table.tsx, tabs.tsx
│   └── avatar.tsx, badge.tsx, select.tsx
│
└── ...
```

---

## 9. Key Lib Modules

| File | Purpose |
|------|---------|
| `lib/auth.ts` | NextAuth v5 config (Credentials provider, JWT sessions) |
| `lib/prisma.ts` | Prisma client singleton + workspace context |
| `lib/stripe.ts` | Stripe SDK wrapper + price validation + webhook verify |
| `lib/rbac.ts` | Role-based access control (requireRole) |
| `lib/rag/` | Chunker, embedder, parser, vectorstore |
| `lib/ai-provider.ts` | Multi-provider AI client factory |
| `lib/i18n.ts` | Translation dictionary (id/en) |
| `lib/analytics.ts` | Event tracking |
| `lib/audit.ts` | Audit log recording |
| `lib/entitlements.ts` | Plan limits enforcement + cache |
| `lib/rate-limit.ts` | Upstash/in-memory rate limiting |
| `lib/settings.ts` | DB settings with 30s cache |
| `lib/billing.ts` | Subscription event recording |

---

## 10. External Integrations & Env Vars

### 10.1 Stripe (Billing)
```
STRIPE_PUBLISHABLE_KEY      ← Stripe.js key (public)
STRIPE_SECRET_KEY           ← Backend API key (test/live)
STRIPE_WEBHOOK_SECRET       ← Webhook verification
NEXTAUTH_URL               ← Base URL for Stripe redirects
STRIPE_PRICE_PRO_MONTH     ← Price ID Pro monthly
STRIPE_PRICE_PRO_YEAR      ← Price ID Pro yearly
STRIPE_PRICE_ENTERPRISE_MONTH ← Price ID Enterprise monthly
STRIPE_PRICE_ENTERPRISE_YEAR  ← Price ID Enterprise yearly
```

### 10.2 AI Providers
```
MIMO_API_KEY               ← Default provider
OPENAI_API_KEY             ← OpenAI
OPENROUTER_API_KEY         ← OpenRouter
LMSTUDIO_BASE_URL          ← Local LLM
OLLAMA_BASE_URL            ← Local Ollama
```

### 10.3 Infrastructure
```
DATABASE_URL               ← PostgreSQL connection
REDIS_URL                  ← Upstash Redis (rate limit)
UPSTASH_REDIS_REST_URL     ← Upstash REST URL
NEXTAUTH_SECRET            ← JWT signing key
```

### 10.4 Integrations
```
NANONETS_API_KEY           ← OCR
PADDLEOCR_SERVICE_URL      ← OCR service
N8N_WEBHOOK_URL            ← n8n workflows
```

---

## 11. Typical User Flows

### 11.1 New User Onboarding
```
Landing (/) → [Get Started] → /register
  → Fill form → POST /api/auth/register
  → Redirect /login?registered=true
  → Login → /onboarding
    → Step 1: Name workspace
    → Step 2: Choose AI provider
    → Step 3: Upload first document 
    → Complete → /dashboard
```

### 11.2 Upgrade to Pro (Billing Flow)
```
/settings/billing → "Upgrade to Pro" button
  → POST /api/billing/checkout {plan: "pro", interval: "month"}
  → {sessionId, url} → redirect Stripe Checkout
  → User fills payment → Stripe payment success
  → Stripe webhook POST /api/billing/webhook
    → checkout.session.completed → update workspace_subscriptions to pro active
    → invoice.paid → create Invoice + Payment records
  → Redirect /settings/billing?session_id=xxx
  → UI refresh → "Pro plan Active", limits updated
```

### 11.3 Chat with Documents (RAG)
```
/dashboard or /chat → New Chat
  → POST /api/chat/sessions (create session)
  → User types question → POST /api/chat
    → generateEmbedding(query) 
    → searchSimilarChunks(embedding) in pgvector
    → Build context + sources
    → stream via AI provider
    → Save message to DB
  → Display message + SourceCard citations
```

### 11.4 Upload Document
```
/documents → "Upload" → /documents/upload
  → Dropzone drop → POST /api/upload (multipart)
    → Save file → /uploads/
    → Parse content (PDF/DOCX/TXT)
    → Chunk text → generateEmbeddings
    → Store chunks in pgvector
  → List updated in /documents
```

### 11.5 Invite Team Member
```
/settings/workspace → "Invite Member"
  → POST /api/workspace/invitations {email, role}
  → Email sent (if configured)
  → Invitee clicks /invite/[token]
  → GET /api/invitations/accept/[token]
  → Register/login → added to workspace
```

### 11.6 WhatsApp Integration
```
/settings/whatsapp → Configure gateway
  → Connect Baileys → QR pairing via /api/whatsapp/baileys/qr
  → WhatsApp connected status
  → Incoming messages → /api/whatsapp/webhook
    → Process with AI → Store conversation
  → View at /whatsapp
```

### 12.1 Widget Embed (External Site)
```
/settings/widget → Configure widget appearance
  → Copy embed code
  → Paste to external website
  → User visits site → loads widget.js
  → Widget opens chat → POST /api/widget/chat
    → Contextual AI with workspace knowledge
  → Lead captured → POST /api/widget/leads
```

---

## 12. Widget System Deep Dive

> Widget chatbot bukan cuma embed script — ini full pipeline: lead capture, intent detection, scoring, notifikasi, dan RAG.

### 12.1 Widget Architecture

```
Visitor Site (domain.com)
  → load widget.js (dari /api/widget/embed)
    → POST /api/widget/config → theme, mode, business profile
    → POST /api/widget/chat (publicKey based)
      ├─ Visitor isolation (visitorId) + IP tracking
      ├─ Rate limit check (60/key/min + 30/IP/min)
      ├─ Origin validation (allowedDomains)
      ├─ Intent detection → harga / beli / booking / demo / hubungi
      ├─ Lead data extraction (nama, email, WhatsApp, budget, lokasi)
      ├─ Lead scoring (low / medium / high)
      ├─ Auto-trigger lead capture prompt
      ├─ Notification webhook (high_lead / converted)
      └─ RAG response generation (workspace knowledge + business context)
```

### 12.2 Widget Security Model

| Layer | Detail |
|-------|--------|
| **Rate Limit** | `KEY_RATE_LIMIT = 60 req/min` per `publicKey`<br>`IP_RATE_LIMIT = 30 req/min` per IP (resolved via `X-Forwarded-For` last hop) |
| **Message Size** | `MAX_MESSAGE_LENGTH = 10,000` chars |
| **Origin Check** | `validateWidgetOrigin()` — exact hostname or `*.domain.com` wildcard. Bukan wildcard CORS. |
| **Visitor Isolation** | `visitorId` per browser. Hanya visitor asli yang bisa lanjutkan conversation tertentu. |
| **Conversation Lock** | `conv.visitorId` dibandingkan dengan request `visitorId`. Mismatch = 403 Forbidden. |
| **IP Logging** | `ip_address`, `user_agent` disimpan per conversation untuk audit. |
| **JWT-Free** | Widget public endpoint tidak pakai NextAuth — pakai `publicKey` + origin validation saja. |

### 12.3 Lead Capture Pipeline

**Step 1 — Chat dimulai**
```
Visitor kirim pesan → /api/widget/chat
  → Kalau conversationId ada & cocok → lanjutkan
  → Kalau tidak → create new WidgetConversation
     → ip_address, user_agent, visitorId tersimpan
```

**Step 2 — Intent Detection**
```typescript
const INTENT_KEYWORDS = {
  harga: ["harga", "berapa", "biaya", "tarif", "cost", "price", "pricing"],
  beli:  ["beli", "order", "pesan", "purchase", "buy", "checkout"],
  booking: ["booking", "reservasi", "janji", "appointment"],
  demo: ["demo", "presentasi", "showcase", "trial"],
  hubungi: ["hubungi", "kontak", "telepon", "wa", "whatsapp", "contact"],
};
```

**Step 3 — Lead Data Extraction (real-time regex)**
`lib/lead-detect.ts` scan setiap pesan user:

| Data | Pattern |
|------|---------|
| **WhatsApp** | `+62 812-3456-7890`, `081234567890`, `628xxxxx`, `wa.me/+628xx` |
| **Email** | Standard email regex |
| **Nama** | `nama saya [Nama]`, `saya [Nama]`, `panggil saya [Nama]`, `my name is [Nama]` |
| **Budget** | Regex: `Rp X juta`, `budget X juta`, `harga X juta` |
| **Lokasi** | Regex: `di [Kota]`, `lokasi [Daerah]` |
| **Interest** | Regex: `mencari/ingin/butuh/cari/mau ...` |

Nama divalidasi dengan `NOT_NAMES` blacklist (60+ kata Indonesia umum: Saya, Mau, Tanya, Rumah, dll.)

**Step 4 — Lead Scoring**
```typescript
calculateLeadScore(hasLead, intent, messageCount):
  if (intent && hasLead) → "high"
  if (intent || hasLead) → "medium"
  else → "low"
```

Score otomatis di-update di DB: `widget_conversations.lead_score = high|medium|low`

**Step 5 — Auto-Trigger**
```typescript
shouldAutoTrigger(leadCaptureEnabled, autoTriggerMessages, hasLead, messageCount):
  // Contoh: autoTriggerMessages = 3
  Setelah 3 pesan dan belum ada lead data → AI auto-minta kontak
  → Prompt: "Sebelum melanjutkan, boleh saya tahu nama dan email Anda? Ini membantu kami memberikan layanan yang lebih baik."
```

**Step 6 — Lead Summary (setiap 3 pesan)**
```
Extract:
  leadSummary = "Nama: Budi | Intent: Tanya Harga | Budget: Rp 500 juta | Lokasi: Tegal"
  businessInterest = substring dari "mencari/ingin/butuh..."
  budget = regex match
  location = regex match
→ Update widget_conversations
```

### 12.4 Notification System (Widget Leads)

**Kapan notifikasi terkirim?**

| Event | Trigger | Aksi |
|-------|---------|------|
| **High Lead** | `score === "high" && hasLead === true` | Kirim notifikasi real-time ke Telegram/Email/Discord |
| **Converted** | Admin update status ke `"converted"` di lead panel | Kirim notifikasi conversion ke owner |

**Channel:**
- **Email** (SMTP) — opsional
- **Telegram Bot** — `notification_configs.telegram_bot_token + telegram_chat_id`
- **Discord** — `notification_configs.discord_webhook_url`

**Config**: `/settings/leads` atau via `POST /api/workspace/notifications/settings`

### 12.5 Widget Modes

Widget punya 3 mode (kolom `widgets.mode`):

| Mode | Deskripsi | Prompt Context |
|------|-----------|----------------|
| `knowledge_base` | Standar — jelaskan produk dari dokumen | knowledgeContext dari chunks |
| `customer_service` | CS Mode — jangan bilang "tidak menemukan", saran kontak | KB + CS template + nomor kontak |
| `sales` | Sales Mode — persuasif, fokus closing | business profile + closing prompt |

Mode menentukan `PromptContext` yang dikirim ke `generateRAGResponse()`.

### 12.6 Widget RAG Flow

```
POST /api/widget/chat
  → setWorkspaceContext(widget.workspaceId)  // RLS
  → generateRAGResponse(message, 5, workspaceId, ..., PromptContext)
     PromptContext = {
       mode: "knowledge_base" | "customer_service" | "sales",
       businessName, businessDescription,
       contactInfo: { whatsapp, phone, email, address }
     }
  → Jawaban AI → save ke widget_messages
```

### 12.7 Widget Embed Script

```html
<script src="https://mimotes.example.com/api/widget/embed?key=pw_pub_xxx"></script>
<script>
  MimoWidget.init({ publicKey: 'pw_pub_xxx' });
</script>
```

Endpoint: `GET /api/widget/embed` — return inline JS yang inject iframe ke halaman client.

---

## 13. Key Dev Commands

```bash
# Start all services
docker compose up -d

# Rebuild app after code changes
docker compose up -d --build app

# DB shell
docker compose exec db psql -U mimotes -d mimotes

# Check logs
docker compose logs -f app

# Run migrations (inside container)
docker compose exec app npm exec prisma migrate dev

# Seed data
docker compose exec app npm run seed

# Stripe CLI (for webhook testing)
stripe listen --forward-to localhost:3100/api/billing/webhook
```

---

## 14. Known Limitations & TODOs

1. **Stripe webhook requires public URL** — Local testing needs Stripe CLI or Cloudflare tunnel
2. **Billing page limits may cache** — After webhook, clear entitlement cache or refresh
3. **RSVP not implemented** — Reply/RSVP features referenced in migrations but not active
4. **Email sending** — Notifies via DB only, SMTP integration optional
5. **Image RAG** — Vision model support incomplete

---

## 15. File Location

- **Source code**: `/c/Users/SMANSA/mimotes/`
- **This doc**: `.ai/APP_FLOW.md` ← **UPDATE THIS FILE if routes change**
- **Original AGENTS.md**: `/c/Users/SMANSA/mimotes/AGENTS.md`
- **Docker**: `docker-compose.yml` at project root
- **DB Migrations**: `prisma/migrations/`
- **Seed scripts**: `scripts/seed-admin.ts`

---

> **For AI Agents**: Jika kamu butuh detail spesifik route, gunakan `read_file` ke file path yang tercantum di atas. Contoh: `read_file("app/api/billing/checkout/route.ts")` untuk lihat checkout logic.

---

## 16. n8n Integration

> Bridge antara n8n workflow dan Mimotes. n8n mengirim pesan dari channel apa pun (Telegram, WhatsApp via Twilio, dll.) ke Mimotes → AI reply → dikembalikan ke n8n.

### 16.1 Architecture

```
n8n Workflow ( external )
  → HTTP Request node → POST /api/whatsapp/n8n
     Body: { message, phone, sessionId?, workspaceId }
  → Mimotes:
     → setWorkspaceContext(workspaceId)   // RLS
     → find/create chatSession (judul: "WhatsApp: ${phone}")
     → save user message ke chat_messages
     → generateRAGResponse(message, 5, workspaceId)
     → save assistant message
     → return { success, response, sessionId }
  → n8n → kirim balasan ke channel awal
```

### 16.2 Endpoint Detail

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `/api/whatsapp/n8n` | None (internal use) | `{message, phone, workspaceId, sessionId?}` | `{success, response, sessionId}` |
| GET | `/api/whatsapp/n8n` | None | - | `{status: "ok", service: "mimotes-n8n-bridge"}` |

### 16.3 Configurasi n8n

- **URL**: `https://mimotes.example.com/api/whatsapp/n8n`
- **Method**: POST
- **Content-Type**: `application/json`
- **Required body**: `message`, `phone`, `workspaceId`
- **Optional**: `sessionId` untuk melanjutkan sesi yang sama

### 16.4 Perbedaan n8n vs Native WhatsApp

| Aspek | Native WhatsApp (Meta) | n8n Bridge |
|-------|------------------------|------------|
| Source | WhatsApp Business API | Arbitrary (Telegram, Twilio, custom) |
| Auth | `accessToken` + `phoneNumberId` | `workspaceId` saja |
| Session | `whatsAppConversation` | `chatSession` + `chatMessage` |
| RAG | `generateRAGResponse(..., 3, workspaceId)` | `generateRAGResponse(..., 5, workspaceId)` |
| Reply | Langsung via Meta API | Return JSON → n8n kirim |
| Lead tracking | `whatsAppConversation.leadScore` | Tidak otomatis |

Penggunaan n8n memungkinkan Mimotes menjadi **AI brain** untuk berbagai channel tanpa integrasi native per-channel.

---

## 17. PaddleOCR Image Processing

> Pipeline multilevel untuk memproses gambar yang di-upload ke knowledge base. Ada 3 tier prioritas: Vision Model → PaddleOCR local sidecar → REJECT.

### 17.1 Processing Priority

```
Image uploaded (PDF/JPG/PNG)
  → Priority 1: Vision Model
    → OpenAI GPT-4o / Gemini Vision / dll.
    → Output: OCR text + caption + summary
    → Jika gagal / kosong → lanjut Priority 2
  → Priority 2: PaddleOCR (HTTP sidecar)
    → Service: `http://paddleocr:8090/ocr`
    → Input: base64 image
    → Output: { text, confidence, blocks[] }
    → Juga gagal / kosong → lanjut Priority 3
  → Priority 3: REJECT
    → extraction_method = "rejected"
    → NO chunks, NO embeddings
    → Image tetap tersimpan tapi tidak searchable
```

### 17.2 PaddleOCR Sidecar

| Detail | Value |
|--------|-------|
| **Service URL** | `http://paddleocr:8090` (Docker) |
| **Endpoint** | POST `/ocr` |
| **Input** | `{ image: "base64..." }` |
| **Output** | `{ success, text, blocks[], total_blocks, total_confidence, processing_time_ms }` |
| **Block** | `{ text, confidence, bbox: [[x,y],[x,y],[x,y],[x,y]] }` |
| **Docker** | Service `paddleocr` (port 8090) di `docker-compose.yml` |
| **Fallback config** | Settings DB key: `paddleocr_url` atau env `PADDLEOCR_URL` |

### 17.3 Image Chunk Types

Setelah text diekstrak, image di-chunk menjadi:

| Chunk Type | Konten | Metadata |
|------------|--------|----------|
| `image_caption` | Caption deskriptif dari vision model | `extraction_method`, `vision_model` |
| `image_ocr` | Plain text dari OCR | `extraction_method`, `ocr_engine`, `ocr_confidence` |
| `image_combined` | Caption + OCR text digabung | Semua metadata |

### 17.4 Security Rule

> **NEVER generate content from filenames.** Kalau vision & PaddleOCR gagal extract text → image **rejected**. Tidak ada fallback "judul file jadi chunk".

### 17.5 Flow RAG dengan Gambar

```
User upload image → POST /api/upload
  → Save file → /uploads/
  → processImage(imagePath)
    → vision → paddleocr → (reject)
  → chunkImageResults(result)
    → generateEmbedding(chunk.content)
    → storeChunks(workspaceId, chunks)
  → Image searchable via similarity search
```

---

## 18. MCP Server Integration

> Mimotes dapat connect ke external MCP (Model Context Protocol) servers — memungkinkan AI agent luar menggunakan tools Mimotes: RAG, document search, upload, dll.

### 18.1 MCP Architecture

```
External AI Agent (Claude Desktop, Cursor, MCP client)
  → SSE connection → Mimotes MCP Server (/api/mcp)
    → Discover tools: askQuestion, searchDocuments, uploadDocument, etc.
    → Call tool → handleAskQuestion() / handleSearchDocuments()
      → RLS via resolveWorkspaceId(userId)
      → generateRAGResponse() / searchSimilarChunks()
    → Return result → Client AI Agent
```

### 18.2 MCP Manager (Singleton)

`MCPManager` (`lib/mcp/manager.ts`) — singleton yang mengelola semua koneksi MCP:

```typescript
// Load active servers dari DB
const servers = await prisma.mcpServer.findMany({ where: { isActive: true } });

// Connect semua
await MCPManager.getInstance().connectAll();

// Connect individu
await MCPManager.getInstance().connectServer(serverId);

// Tools disimpan di DB setiap kali connect (auto-discovery)
await prisma.mcpServer.update({
  where: { id: server.id },
  data: { tools: JSON.parse(JSON.stringify(connection.tools)) }
});
```

### 18.3 MCP Tools yang Tersedia

| Tool | Input | Output | RLS |
|------|-------|--------|-----|
| `askQuestion` | `{ question, topK? }` | `{ answer, sources[] }` | ✅ via `resolveWorkspaceId` |
| `searchDocuments` | `{ query, topK?, threshold? }` | `{ results[] }` | ✅ |
| `uploadDocument` | `{ url, title? }` | `{ documentId, chunksCount }` | ✅ |
| `listDocuments` | `{ page?, limit?, search? }` | `{ documents[], pagination }` | ✅ |
| `deleteDocument` | `{ documentId }` | `{ success }` | ✅ |
| `getDocumentDetail` | `{ documentId }` | `{ document, chunks[] }` | ✅ |

### 18.4 MCP Server Config

```typescript
// DB > mcp_servers
interface MCPServerConfig {
  id: string;
  name: string;
  url: string;          // SSE endpoint, e.g. https://mcp.example.com
  apiKey?: string;      // Authorization: Bearer xxx
  isActive: boolean;
  tools: MCPToolInfo[]; // Auto-populated saat connect
}
```

**Settings UI**: `/settings/mcp` → create, edit, enable/disable MCP servers.

### 18.5 MCP Client

`MimotesMCPClient` (`lib/mcp/client.ts`):
- Menggunakan `@modelcontextprotocol/sdk`
- Transport: `SSEClientTransport`
- Auth via `Authorization: Bearer ${apiKey}` header
- Connection pooling: `Map<serverId, MCPClientConnection>`
- Auto-reconnect via `connect()` check

### 18.6 Perbedaan MCP vs Internal API

| Aspek | Internal API (/api/*) | MCP Server |
|-------|----------------------|------------|
| **Transport** | HTTP REST + NextAuth JWT | SSE (Server-Sent Events) |
| **Auth** | NextAuth session | `apiKey` Bearer token |
| **Caller** | Web frontend / widget | External AI agents (Claude, Cursor) |
| **Format** | JSON request/response | MCP protocol (tools/list, tools/call) |
| **RLS** | Session-based | `resolveWorkspaceId(userId)` |
| **Scope** | Full CRUD expose | Read-only + selected actions |

---

## 19. WhatsApp Architecture (Meta + Baileys)

> Mimotes mendukung 2 jalur WhatsApp: Meta Official API (production-ready) dan Baileys (self-hosted, unofficial).

### 19.1 Meta (Official) WhatsApp Flow

```
User kirim pesan ke WhatsApp Business (via Meta Cloud API)
  → Meta Webhook → POST /api/whatsapp/webhook
    → verify token check
    → payload: { phoneNumberId, from, messageId, type, text, image, document }
  → processIncomingMessage(payload)
    → 1. Resolve workspace dari whatsAppConfigs (phoneNumberId)
    → 2. Find/create whatsAppConversation (by waId)
    → 3. Process media (download via Meta API) → deskripsi ringkas
    → 4. Save incoming message → whatsAppMessages
    → 5. Mark as read via Meta API
    → 6. Check autoReply flag:
       autoReply = false → kirim offlineMessage (jika ada)
       autoReply = true  → jalankan RAG pipeline
    → 7. generateRAGResponse(message, 3, workspaceId, 0.30)
    → 8. Save AI response → whatsAppMessages
    → 9. Kirim balasan via Meta API sendTextMessage()
    → 10. Detect intent + calculateLeadScore() → update conversation
    → 11. Analytics event + usage tracking + audit log
```

### 19.2 Baileys (Unofficial) Flow

```
User kirim pesan ke nomor WhatsApp (via Baileys self-hosted)
  → Baileys Service POST → /api/whatsapp/baileys/incoming
    → Body: { phone, text, from, session? }
    → Config: `BAILEYS_URL`, `BAILEYS_API_KEY`, `BAILEYS_WORKSPACE_ID`
  → Logika mirip Meta:
    → Resolve workspace → find/create WhatsAppConversation
    → RAG pipeline → generateRAGResponse()
    → Kirim balasan via Baileys service API:
      POST ${BAILEYS_URL}/send
      Headers: { "x-api-key": BAILEYS_API_KEY }
      Body: { phone, message }
  → Perbedaan: Tidak pakai Meta Cloud API, self-hosted via Baileys library
```

### 19.3 Perbandingan Meta vs Baileys

| Aspek | Meta (Official) | Baileys (Unofficial) |
|-------|-----------------|---------------------|
| **Setup** | Meta Business setup, verify token, webhook | Self-hosted Baileys service |
| **Reliability** | Meta SLAs + rate limits | Depend on Baileys service uptime |
| **Cost** | Pay per conversation (free tier 1K/mo) | Free (hanya hosting cost) |
| **Ban risk** | Low (Meta approved) | High (WA terms violation) |
| **Media** | Full download via Meta CDN | Manual handling |
| **Webhook** | `/api/whatsapp/webhook` | `/api/whatsapp/baileys/incoming` |
| **Reply method** | Meta `sendTextMessage()` | Baileys HTTP API |
| **Config page** | `/settings/whatsapp` | `/settings/baileys` |

### 19.4 WhatsApp Lead Tracking

WhatsApp conversation juga punya lead tracking (mirip widget):

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `leadName` | VARCHAR | Dari contact name WhatsApp |
| `leadEmail` | VARCHAR | Diupdate via lead extraction |
| `leadWhatsApp` | VARCHAR | Nomor WA user |
| `leadScore` | VARCHAR | `low` / `medium` / `high` |
| `leadIntent` | VARCHAR | Hasil intent detection |
| `leadStatus` | VARCHAR | `new` → `contacted` → `qualified` → `converted` / `lost` |
| `messageCount` | INTEGER | Total pesan dalam conversation |
| `lastMessageAt` | TIMESTAMP | Waktu pesan terakhir |
| `lastMessagePreview` | VARCHAR | Preview 200 chars |
