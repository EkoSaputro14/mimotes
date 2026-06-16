# SAAS_EXPANSION_PLAN.md — Mimotes: From RAG Chatbot to AI SaaS Platform

> Strategic product plan to transform Mimotes from a single-tenant RAG chatbot into a professional multi-tenant AI SaaS platform. Covers product strategy, SaaS architecture, dashboard design, analytics, workspace management, API platform, and a phased implementation roadmap.

---

## Step 1: Product Analysis

### Current State Assessment

Mimotes today is a **functional single-tenant RAG chatbot** with the following capabilities:

| Capability | Current State | SaaS Readiness |
|------------|---------------|-----------------|
| **Chat** | Public streaming chat with RAG context, session history sidebar, markdown rendering, copy button | 🟡 Functional but single-workspace |
| **RAG Pipeline** | Full pipeline: parse → chunk → embed → vector store → similarity search → generate | 🟢 Solid foundation |
| **Documents** | Upload (PDF/DOCX/TXT/CSV/XLSX/URL), background processing, status tracking | 🟡 No bulk operations, no chunk explorer |
| **AI Providers** | 6 providers (Mimo Pro, OpenAI, LM Studio, Ollama, OpenRouter, Custom), auto-detect models | 🟡 Single global config, no per-workspace |
| **Authentication** | NextAuth v5, Credentials + JWT, single admin user | 🔴 No multi-user, no roles, no workspaces |
| **Settings** | Database-backed with env fallback, 30s cache | 🟡 Global settings only |
| **UI/UX** | Phase 1 improvements complete (toast, markdown, textarea, copy, sidebar) | 🟡 Basic but functional |
| **Deployment** | Docker Compose, multi-stage build, PostgreSQL + pgvector | 🟢 Production-ready |

### Database Schema (Current — 6 Models)

```
users              → id, email, name, passwordHash, timestamps
documents          → id, userId, title, fileType, fileUrl, status, chunkCount, timestamps
document_chunks    → id, documentId, content, embedding[1536], chunkIndex, metadata, timestamps
chat_sessions      → id, userId?, title, timestamps
chat_messages      → id, sessionId, role, content, sources[json], timestamps
settings           → id, key, value, timestamps
```

### Missing SaaS Capabilities

| Category | Missing Capability | Business Impact |
|----------|-------------------|-----------------|
| **Multi-Tenancy** | Workspaces, team members, roles, invitations | Cannot serve multiple organizations |
| **Dashboard** | No overview page, no KPIs, no widgets | Users cannot see value at a glance |
| **Analytics** | No usage tracking, no cost estimation, no chat insights | Cannot optimize or bill based on usage |
| **Knowledge Base Management** | No chunk explorer, no similarity search UI, no embedding viewer | Power users cannot debug RAG quality |
| **AI Playground** | No prompt testing, no model comparison, no parameter tuning | Users cannot experiment before deploying |
| **Prompt Management** | No system prompt templates, no versioning, no A/B testing | Cannot customize AI behavior per workspace |
| **API Platform** | No API keys, no developer docs, no SDK | Cannot integrate with external systems |
| **Embeddable Widget** | No website chatbot widget | Cannot deploy chatbot on customer websites |
| **Billing** | No plans, no usage metering, no payment integration | Cannot monetize |
| **Collaboration** | No shared documents, no activity feed, no comments | Team productivity features missing |

### Competitive Positioning

```
┌─────────────────────────────────────────────────────────────────────┐
│                    AI Chatbot Platform Landscape                     │
├─────────────────┬───────────────┬───────────────┬──────────────────┤
│                 │  ChatGPT      │  Mendable     │  Mimotes         │
│                 │  (OpenAI)     │  (SiteGPT)    │  (Target)        │
├─────────────────┼───────────────┼───────────────┼──────────────────┤
│ RAG from docs   │  Partial      │  ✅           │  ✅              │
│ Multi-provider  │  ❌           │  ❌           │  ✅              │
│ Self-hosted     │  ❌           │  ❌           │  ✅              │
│ Open source     │  ❌           │  Partial      │  ✅              │
│ Embed widget    │  ❌           │  ✅           │  Planned         │
│ API platform    │  ✅           │  ✅           │  Planned         │
│ Analytics       │  ✅           │  ✅           │  Planned         │
│ Multi-tenant    │  ✅           │  ✅           │  Planned         │
│ Prompt mgmt     │  ✅           │  Partial      │  Planned         │
│ Playground      │  ✅           │  ❌           │  Planned         │
└─────────────────┴───────────────┴───────────────┴──────────────────┘
```

**Mimotes Differentiator**: Open-source, self-hosted, multi-provider AI with full RAG pipeline. The SaaS transformation adds the business layer on top of this strong technical foundation.

---

## Step 2: Professional SaaS Dashboard Design

### Information Architecture

The new dashboard replaces the current flat navigation (Documents, Upload, Settings, Chat) with a hierarchical sidebar navigation.

### Sidebar Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Mimotes                                    [Workspace▼] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🏠 Dashboard                                               │
│                                                             │
│  💬 Chat                                                    │
│                                                             │
│  📚 Knowledge Base                                          │
│     ├── 📄 Documents                                        │
│     ├── 🧩 Chunks                                           │
│     ├── 🔍 Search                                           │
│     └── 📎 Sources                                          │
│                                                             │
│  📊 Analytics                                               │
│     ├── 📈 Usage                                            │
│     ├── 💬 Chat Insights                                    │
│     └── 💰 AI Cost                                          │
│                                                             │
│  🤖 AI                                                      │
│     ├── 🔌 Providers                                        │
│     ├── 🧠 Models                                           │
│     ├── 🎮 Playground                                       │
│     └── 📝 Prompts                                          │
│                                                             │
│  👥 Workspace                                               │
│     ├── 👤 Team Members                                     │
│     └── 🔑 API Keys                                         │
│                                                             │
│  ────────────────────────────────                           │
│                                                             │
│  ⚙ Settings                                                 │
│  📖 Docs                                                    │
│                                                             │
│  ────────────────────────────────                           │
│  [User Avatar]  John Doe                     [Logout]       │
└─────────────────────────────────────────────────────────────┘
```

### URL Structure

```
/                                    → Landing page (public)
/login                               → Login
/register                            → Register (invitation-based)

/dashboard                           → Dashboard with widgets
/chat                                → Chat interface
/chat/[sessionId]                    → Specific chat session

/knowledge/documents                 → Document list
/knowledge/documents/[id]            → Document detail + chunks
/knowledge/chunks                    → Chunk explorer
/knowledge/search                    → Similarity search
/knowledge/sources                   → Source viewer

/analytics/usage                     → Usage analytics
/analytics/chat                      → Chat analytics
/analytics/cost                      → AI cost analytics

/ai/providers                        → AI provider management
/ai/models                           → Model registry
/ai/playground                       → AI Playground
/ai/prompts                          → Prompt management
/ai/prompts/[id]                     → Prompt editor

/workspace/settings                  → Workspace settings
/workspace/members                   → Team members
/workspace/api-keys                  → API key management

/settings                            → Global settings
/docs                                → API documentation
```

### Layout Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Sidebar (fixed, collapsible)  │  Main Content Area             │
│  ┌──────────────────────────┐  │  ┌──────────────────────────┐ │
│  │  Navigation items         │  │  │  Top Bar                  │ │
│  │  (with active states)     │  │  │  [Breadcrumb] [Actions]   │ │
│  │                           │  │  ├──────────────────────────┤ │
│  │  Workspace switcher       │  │  │                          │ │
│  │  at top                   │  │  │  Page Content             │ │
│  │                           │  │  │                          │ │
│  │  User profile             │  │  │  (server components       │ │
│  │  at bottom                │  │  │   + client islands)       │ │
│  └──────────────────────────┘  │  │                          │ │
│                                │  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy (New)

```
app/
├── (dashboard)/                   → Route group for all dashboard pages
│   ├── layout.tsx                 → DashboardLayout (sidebar + topbar)
│   ├── dashboard/page.tsx         → DashboardPage (widgets)
│   ├── chat/
│   │   ├── page.tsx               → ChatPage
│   │   └── [sessionId]/page.tsx   → ChatSessionPage
│   ├── knowledge/
│   │   ├── documents/
│   │   │   ├── page.tsx           → DocumentsPage
│   │   │   └── [id]/page.tsx      → DocumentDetailPage
│   │   ├── chunks/page.tsx        → ChunksPage
│   │   ├── search/page.tsx        → SearchPage
│   │   └── sources/page.tsx       → SourcesPage
│   ├── analytics/
│   │   ├── usage/page.tsx         → UsageAnalyticsPage
│   │   ├── chat/page.tsx          → ChatAnalyticsPage
│   │   └── cost/page.tsx          → CostAnalyticsPage
│   ├── ai/
│   │   ├── providers/page.tsx     → ProvidersPage
│   │   ├── models/page.tsx        → ModelsPage
│   │   ├── playground/page.tsx    → PlaygroundPage
│   │   └── prompts/
│   │       ├── page.tsx           → PromptsPage
│   │       └── [id]/page.tsx      → PromptEditorPage
│   ├── workspace/
│   │   ├── settings/page.tsx      → WorkspaceSettingsPage
│   │   ├── members/page.tsx       → MembersPage
│   │   └── api-keys/page.tsx      → ApiKeysPage
│   └── settings/page.tsx          → SettingsPage
│
├── components/
│   ├── dashboard/
│   │   ├── sidebar.tsx            → Main sidebar navigation
│   │   ├── topbar.tsx             → Top bar with breadcrumbs
│   │   ├── workspace-switcher.tsx → Workspace dropdown
│   │   └── widgets/               → Dashboard widget components
│   │       ├── stat-card.tsx
│   │       ├── usage-chart.tsx
│   │       ├── recent-chats.tsx
│   │       ├── top-documents.tsx
│   │       └── cost-summary.tsx
│   ├── knowledge/
│   │   ├── document-explorer.tsx
│   │   ├── chunk-viewer.tsx
│   │   ├── similarity-search.tsx
│   │   ├── source-viewer.tsx
│   │   └── embedding-viewer.tsx
│   ├── analytics/
│   │   ├── chart-card.tsx
│   │   ├── kpi-row.tsx
│   │   ├── date-range-picker.tsx
│   │   └── filter-panel.tsx
│   ├── ai/
│   │   ├── playground-editor.tsx
│   │   ├── model-selector.tsx
│   │   ├── parameter-controls.tsx
│   │   ├── prompt-editor.tsx
│   │   └── prompt-version-list.tsx
│   ├── workspace/
│   │   ├── member-table.tsx
│   │   ├── invite-modal.tsx
│   │   ├── role-selector.tsx
│   │   └── api-key-table.tsx
│   └── ui/                        → Shared UI primitives
│       ├── button.tsx
│       ├── input.tsx
│       ├── modal.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       ├── dropdown.tsx
│       ├── tabs.tsx
│       └── skeleton.tsx
```

### Design Principles

1. **Consistent Layout**: Every dashboard page shares the same sidebar + topbar layout. The sidebar is collapsible (icon-only mode) on desktop and overlays on mobile.
2. **Breadcrumb Navigation**: Every page has breadcrumbs showing the path: `Home > Knowledge Base > Documents > Document Name`.
3. **Server Components First**: Page shells, data fetching, and auth guards use server components. Interactive widgets are client components.
4. **Responsive**: Sidebar collapses to hamburger on mobile. Content area uses responsive grid.
5. **Dark Mode Ready**: All components use Tailwind `dark:` prefix with `next-themes`.

---

## Step 3: Dashboard Widgets

### Dashboard Page Layout

The `/dashboard` page provides an at-a-glance overview of the entire workspace.

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                          [Last 30d ▼]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 📄       │ │ 🧩       │ │ 💬       │ │ ❓       │          │
│  │ 24       │ │ 1,847    │ │ 156      │ │ 42       │          │
│  │ Documents│ │ Chunks   │ │ Chats    │ │ Questions│          │
│  │          │ │          │ │ Today    │ │ Today    │          │
│  │ +3 ↑12% │ │ +234 ↑15%│ │ +12 ↑8% │ │ +5 ↑14% │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│  │  📈 Questions Over Time     │ │  🤖 AI Provider Usage   │   │
│  │                             │ │                         │   │
│  │  ╭────────────────────╮    │ │  OpenAI      ██████ 62% │   │
│  │  │    ╱╲              │    │ │  Mimo Pro    ███  28%   │   │
│  │  │   ╱  ╲    ╱╲      │    │ │  Ollama      █   10%    │   │
│  │  │  ╱    ╲  ╱  ╲     │    │ │                         │   │
│  │  │ ╱      ╲╱    ╲    │    │ │  ─────────────────────  │   │
│  │  │╱              ╲   │    │ │  Total: 156 chats       │   │
│  │  ╰────────────────────╯    │ │  This month: 42 questions│  │
│  │  Jun  Jul  Aug  Sep  Oct   │ │                         │   │
│  └─────────────────────────────┘ └─────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│  │  📄 Most Used Documents     │ │  💰 Cost Estimation     │   │
│  │                             │ │                         │   │
│  │  1. product-manual.pdf      │ │  Estimated Tokens:      │   │
│  │     ████████████ 89 refs    │ │  ┌───────────────────┐  │   │
│  │  2. faq.xlsx                │ │  │ Input:   125,400  │  │   │
│  │     ████████ 56 refs        │ │  │ Output:   48,200  │  │   │
│  │  3. company-policy.docx     │ │  │ Total:   173,600  │  │   │
│  │     ██████ 42 refs          │ │  └───────────────────┘  │   │
│  │  4. technical-spec.pdf      │ │                         │   │
│  │     ████ 28 refs            │ │  Estimated Cost:        │   │
│  │  5. api-docs.txt            │ │  $2.47 this month       │   │
│  │     ██ 15 refs              │ │  $18.30 all time        │   │
│  └─────────────────────────────┘ └─────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💬 Recent Chats                                        │   │
│  │                                                         │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ 🟢  "Apa fitur utama produk?"     2 min ago  [→]  │  │   │
│  │  │ 🟢  "Bagaimana cara setup?"       15 min ago [→]  │  │   │
│  │  │ 🟢  "Jelaskan pricing model"      1 hour ago [→]  │  │   │
│  │  │ 🟡  "Dokumen apa saja yang ada?"  3 hours ago [→] │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│  │  📊 Knowledge Base Stats    │ │  ⚡ System Health       │   │
│  │                             │ │                         │   │
│  │  Total Size:  45.2 MB       │ │  AI Provider:  ✅ Online│   │
│  │  Avg Chunk:   487 chars     │ │  Database:     ✅ Online│   │
│  │  Embeddings:  1,847 vectors │ │  Vector Store: ✅ Online│   │
│  │  File Types:  PDF(12)       │ │  Uptime:       99.8%   │   │
│  │              DOCX(5)        │ │                         │   │
│  │              XLSX(3)        │ │  Last Error: None       │   │
│  │              TXT(2)         │ │                         │   │
│  │              URL(2)         │ │                         │   │
│  └─────────────────────────────┘ └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Widget Specifications

| Widget | Data Source | Refresh | Interaction |
|--------|-----------|---------|-------------|
| **Stat Cards** (4) | Aggregated queries on `documents`, `document_chunks`, `chat_sessions`, `chat_messages` tables | Real-time on page load | Click → navigates to detail page |
| **Questions Over Time** | `chat_messages` grouped by date, filtered by role=user | Date range selector (7d/30d/90d/custom) | Hover → tooltip with exact count |
| **AI Provider Usage** | `settings` table for provider, `chat_sessions` count grouped | On page load | Click → AI Providers page |
| **Most Used Documents** | `chat_messages.sources` JSON parsed, count by `documentId` | On page load | Click → Document detail |
| **Cost Estimation** | Token count from `chat_messages.content.length` (approximate), multiplied by provider pricing table | On page load | Date range filter |
| **Recent Chats** | `chat_sessions` ordered by `created_at DESC`, limit 5 | On page load | Click → Chat session |
| **Knowledge Base Stats** | `documents` aggregate (file sizes), `document_chunks` count + avg content length | On page load | None (display only) |
| **System Health** | Health check API calls to AI provider, database, vector store | Polling every 30s | Click → Settings |

### New API Endpoints Required

```
GET /api/dashboard/stats          → Aggregated workspace statistics
GET /api/dashboard/usage          → Usage data over time (with date range)
GET /api/dashboard/cost           → Cost estimation data
GET /api/dashboard/top-documents  → Most referenced documents
GET /api/dashboard/health         → System health check
```

---

## Step 4: Knowledge Base Explorer

The Knowledge Base section transforms document management from a simple list into a comprehensive exploration tool.

### 4.1 Document Explorer

**Page**: `/knowledge/documents`

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Base > Documents                       [+ Upload]     │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Search documents...                    [Type ▼] [Status ▼]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📄 product-manual.pdf          PDF   ✅ Ready  89 chunks  │  │
│  │    Uploaded: Oct 15, 2025      2.4 MB                     │  │
│  │    Last referenced: 2 min ago                              │  │
│  │    [View Chunks] [Search] [Delete]                         │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ 📄 faq.xlsx                    XLSX  ✅ Ready  56 chunks  │  │
│  │    Uploaded: Oct 12, 2025      890 KB                     │  │
│  │    Last referenced: 15 min ago                             │  │
│  │    [View Chunks] [Search] [Delete]                         │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ 📄 company-policy.docx         DOCX  🔄 Processing...     │  │
│  │    Uploaded: Oct 18, 2025      1.1 MB                     │  │
│  │    Progress: Parsing → Chunking → Embedding → ✅          │  │
│  │    [Cancel]                                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Showing 1-10 of 24 documents                    [< 1 2 3 >]   │
└─────────────────────────────────────────────────────────────────┘
```

**Features**:
- Search by title/content with debounced input
- Filter by file type (PDF, DOCX, TXT, CSV, XLSX, URL)
- Filter by status (Processing, Ready, Failed)
- Sort by date, size, chunk count, last referenced
- Bulk select + bulk delete
- Drag-and-drop upload zone at the top
- Processing progress indicator with real-time updates (polling or WebSocket)

### 4.2 Chunk Explorer

**Page**: `/knowledge/chunks` or `/knowledge/documents/[id]#chunks`

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Base > Chunks                      [Document: All ▼] │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Search chunks by content...             [Document ▼]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Chunk #1 of 89 — product-manual.pdf                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Content:                                                   │  │
│  │ "Mimotes is an AI-powered knowledge chatbot that uses      │  │
│  │  RAG (Retrieval-Augmented Generation) to answer questions  │  │
│  │  based on uploaded documents..."                           │  │
│  │                                                            │  │
│  │ Metadata:                                                  │  │
│  │ • Source: product-manual.pdf                               │  │
│  │ • Chunk Index: 0                                           │  │
│  │ • Character Count: 487                                     │  │
│  │ • Created: Oct 15, 2025                                    │  │
│  │                                                            │  │
│  │ Embedding: [0.023, -0.156, 0.089, ...] (1536 dims)       │  │
│  │                                                            │  │
│  │ Similar Chunks:                                            │  │
│  │ • Chunk #3 (0.92 similarity) — same document               │  │
│  │ • Chunk #12 of faq.xlsx (0.87 similarity)                  │  │
│  │                                                            │  │
│  │ [View Full Embedding] [Test Similarity] [Delete]           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [< Prev]  Chunk 1 of 89  [Next >]                             │
└─────────────────────────────────────────────────────────────────┘
```

**Features**:
- Browse all chunks with pagination
- Filter by document
- Full-text search across chunk content
- View chunk metadata (source, index, character count)
- View embedding vector (expandable, with visualization option)
- See similar chunks (pre-computed or on-demand)
- Delete individual chunks (for RAG quality tuning)

### 4.3 Similarity Search

**Page**: `/knowledge/search`

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Base > Similarity Search                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 Enter a question or text to find similar chunks...     │  │
│  │                                                            │  │
│  │ "What is the pricing model?"                        [Search]│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Top-K: [5 ▼]  Threshold: [0.7 ▼]  Document: [All ▼]          │
│                                                                 │
│  Results (5 found, 12ms):                                       │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ #1  Similarity: 0.94   product-manual.pdf (Chunk #12)     │  │
│  │ "Our pricing follows a tiered model based on usage.        │  │
│  │  The Starter plan includes 1,000 queries per month..."     │  │
│  │ [View Document] [View Chunk]                               │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ #2  Similarity: 0.89   faq.xlsx (Chunk #3)                │  │
│  │ "Q: How much does it cost? A: We offer three plans..."     │  │
│  │ [View Document] [View Chunk]                               │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ #3  Similarity: 0.82   company-policy.docx (Chunk #7)     │  │
│  │ "The company's pricing strategy is aligned with..."        │  │
│  │ [View Document] [View Chunk]                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Embedding Generation Time: 45ms                                │
│  Search Time: 12ms                                              │
│  Total Time: 57ms                                               │
└─────────────────────────────────────────────────────────────────┘
```

**Features**:
- Type any text to find the most similar chunks
- Adjustable Top-K (1-20) and similarity threshold (0.0-1.0)
- Filter by document
- Shows similarity score, chunk preview, source document
- Displays performance metrics (embedding time, search time)
- Useful for debugging RAG quality — "Why did the AI answer incorrectly?"

### 4.4 Source Viewer

**Page**: `/knowledge/sources`

Shows all unique sources (documents + URLs) with their chunk distribution and reference frequency.

**Features**:
- List all sources with chunk count, file type, last referenced date
- Visual chunk distribution (how many chunks per document)
- Reference frequency (how often each source appears in chat responses)
- Quick actions: view document, view chunks, search within source

### 4.5 Embedding Viewer

Accessible from the Chunk Explorer. Provides a visual representation of embedding vectors.

**Features**:
- 2D visualization of embeddings using t-SNE or PCA projection
- Color-coded by document or cluster
- Click to inspect individual chunks
- Useful for understanding how the AI "sees" document relationships

### 4.6 Metadata Viewer

Accessible from individual chunk views. Shows the full metadata JSON stored with each chunk.

**Features**:
- JSON tree view with collapsible nodes
- Edit metadata (for manual tagging)
- Bulk metadata operations

### New API Endpoints Required

```
GET  /api/knowledge/documents              → Paginated document list with search/filter
GET  /api/knowledge/documents/[id]/chunks  → Chunks for a specific document
GET  /api/knowledge/chunks                 → All chunks with search/filter/pagination
GET  /api/knowledge/chunks/[id]            → Single chunk detail
GET  /api/knowledge/chunks/[id]/similar    → Similar chunks for a specific chunk
POST /api/knowledge/search                 → Similarity search with custom query
GET  /api/knowledge/sources                → Source aggregation data
DELETE /api/knowledge/chunks/[id]          → Delete single chunk
```

---

## Step 5: Analytics System

### 5.1 Chat Analytics

**Page**: `/analytics/chat`

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics > Chat                                   [Last 30d ▼]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 💬       │ │ ❓       │ │ 📊       │ │ ⏱       │          │
│  │ 156      │ │ 42       │ │ 4.2      │ │ 2.3s     │          │
│  │ Total    │ │ Questions│ │ Avg Msg/ │ │ Avg      │          │
│  │ Sessions │ │ Today    │ │ Session  │ │ Response │          │
│  │ +23 ↑17%│ │ +5 ↑14% │ │ +0.3 ↑8%│ │ -0.2s ↓8%│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📈 Chat Volume Over Time                               │   │
│  │                                                         │   │
│  │  [Line chart showing daily chat sessions]               │   │
│  │                                                         │   │
│  │  Filters: [Date Range] [User] [Session Type]            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│  │  📝 Top Questions           │ │  📊 Response Quality    │   │
│  │                             │ │                         │   │
│  │  1. "Apa fitur utama?" ×12 │ │  With Sources:  78%     │   │
│  │  2. "Cara setup?" ×8       │ │  No Sources:    22%     │   │
│  │  3. "Harga berapa?" ×6     │ │                         │   │
│  │  4. "Dokumen apa?" ×5      │ │  Avg Sources/Reply: 3.2 │   │
│  │  5. "API key dimana?" ×4   │ │  Most Used Doc: manual  │   │
│  └─────────────────────────────┘ └─────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📅 Session Duration Distribution                       │   │
│  │                                                         │   │
│  │  [Histogram: <1min, 1-5min, 5-15min, 15-30min, 30min+] │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**KPIs**:
- Total chat sessions (daily/weekly/monthly)
- Total questions asked
- Average messages per session
- Average response time
- Questions with sources vs without
- Top questions (most frequently asked)
- Session duration distribution
- Peak usage hours

### 5.2 Usage Analytics

**Page**: `/analytics/usage`

**KPIs**:
- Total API calls (chat, upload, search)
- Active users (daily/weekly/monthly)
- Documents uploaded over time
- Storage used (document sizes + embedding storage)
- Page views per section
- Feature adoption rates

**Charts**:
- Line chart: API calls over time (stacked by endpoint)
- Bar chart: Feature usage comparison
- Heatmap: Usage by hour of day / day of week
- Funnel: Upload → Processing → Ready → Referenced in Chat

### 5.3 AI Cost Analytics

**Page**: `/analytics/cost`

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics > AI Cost                                [Last 30d ▼]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 🪙       │ │ 📥       │ │ 📤       │ │ 💵       │          │
│  │ $12.47   │ │ 1.2M     │ │ 480K     │ │ $0.08    │          │
│  │ Est.Cost │ │ Input    │ │ Output   │ │ Avg Cost │          │
│  │ This Mo. │ │ Tokens   │ │ Tokens   │ │ /Query   │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💰 Cost Over Time                                      │   │
│  │                                                         │   │
│  │  [Area chart showing daily estimated cost]              │   │
│  │                                                         │   │
│  │  Breakdown: [By Provider] [By Model] [By Endpoint]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│  │  🔌 Cost by Provider        │ │  📊 Token Distribution  │   │
│  │                             │ │                         │   │
│  │  OpenAI:    $7.80  (62%)   │ │  Chat Input:    45%     │   │
│  │  Mimo Pro:  $3.49  (28%)   │ │  Chat Output:   30%     │   │
│  │  Ollama:    $0.00  (10%)   │ │  Embeddings:    15%     │   │
│  │             (free, local)  │ │  System Prompts: 10%    │   │
│  └─────────────────────────────┘ └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Note on Cost Estimation**: Token counts are approximated from message content length (characters / 4 for English, characters / 2 for CJK). Exact counts require provider-side reporting. The system maintains a pricing table per provider/model.

**Pricing Table** (stored in database or config):

```typescript
interface ProviderPricing {
  provider: string;
  model: string;
  inputCostPer1kTokens: number;   // e.g., 0.0015 for GPT-4o-mini
  outputCostPer1kTokens: number;  // e.g., 0.006 for GPT-4o-mini
  embeddingCostPer1kTokens: number; // e.g., 0.0001 for text-embedding-3-small
}
```

### 5.4 Document Analytics

**Page**: `/knowledge/documents` (integrated into document list as an analytics tab)

**KPIs**:
- Documents by status (Processing, Ready, Failed)
- Documents by file type
- Average processing time
- Chunk count distribution
- Most referenced documents
- Documents never referenced (candidates for removal)

### New Database Models Required

```prisma
model AnalyticsEvent {
  id        String   @id @default(uuid())
  workspaceId String @map("workspace_id")
  userId    String?  @map("user_id")
  eventType String   @map("event_type") @db.VarChar(50) // "chat", "upload", "search", "api_call"
  metadata  Json?    // { endpoint, duration, tokens, provider, model, ... }
  createdAt DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id])
  user      User?     @relation(fields: [userId], references: [id])

  @@index([workspaceId, eventType, createdAt])
  @@index([createdAt])
  @@map("analytics_events")
}
```

### New API Endpoints Required

```
GET /api/analytics/chat     → Chat analytics with date range, filters
GET /api/analytics/usage    → Usage analytics aggregation
GET /api/analytics/cost     → Cost estimation with breakdown
GET /api/analytics/export   → Export analytics data as CSV
```

---

## Step 6: AI Playground

The AI Playground provides an interactive environment for testing prompts, comparing models, and tuning parameters — similar to OpenAI Playground.

### Page Layout

**Page**: `/ai/playground`

```
┌─────────────────────────────────────────────────────────────────┐
│  AI > Playground                    [Model: GPT-4o-mini ▼] [Run]│
├──────────────────────────────────────┬──────────────────────────┤
│                                      │                          │
│  System Prompt                       │  Response                │
│  ┌────────────────────────────────┐  │  ┌────────────────────┐  │
│  │ You are a helpful assistant    │  │  │                    │  │
│  │ that answers questions based   │  │  │  [Streaming        │  │
│  │ on the provided context.       │  │  │   response here]   │  │
│  │                                │  │  │                    │  │
│  │ Always cite your sources...    │  │  │                    │  │
│  │                                │  │  │                    │  │
│  └────────────────────────────────┘  │  │                    │  │
│                                      │  │                    │  │
│  Context (RAG)                       │  │                    │  │
│  ┌────────────────────────────────┐  │  │                    │  │
│  │ [Auto-filled from similarity   │  │  │                    │  │
│  │  search, or manually pasted]   │  │  │                    │  │
│  │                                │  │  │                    │  │
│  └────────────────────────────────┘  │  │                    │  │
│                                      │  │                    │  │
│  User Message                        │  │                    │  │
│  ┌────────────────────────────────┐  │  │                    │  │
│  │ What is the pricing model?     │  │  │                    │  │
│  │                                │  │  │                    │  │
│  │                                │  │  │                    │  │
│  └────────────────────────────────┘  │  │                    │  │
│                                      │  │                    │  │
│  ── Parameters ──────────────────    │  │                    │  │
│                                      │  │                    │  │
│  Temperature:  [────●─────] 0.7     │  │                    │  │
│  Top P:        [────●─────] 1.0     │  │                    │  │
│  Max Tokens:   [────────●─] 2048    │  │                    │  │
│  Stream:       [✅]                 │  │                    │  │
│  Use RAG:      [✅]  Top-K: [5]    │  │                    │  │
│                                      │  │                    │  │
│  ── Metadata ─────────────────────   │  │  ── Stats ─────── │  │
│                                      │  │                    │  │
│  [Save as Template] [Load Template]  │  │  Tokens: 342      │  │
│  [Clear] [Compare Mode]             │  │  Time: 1.8s        │  │
│                                      │  │  Provider: OpenAI  │  │
│                                      │  │  Model: GPT-4o-mini│  │
│                                      │  └────────────────────┘  │
└──────────────────────────────────────┴──────────────────────────┘
```

### Compare Mode

When "Compare Mode" is activated, the layout splits into two or three columns, each with independent model selection and parameters:

```
┌────────────────────────────────┬────────────────────────────────┐
│  Model: GPT-4o-mini            │  Model: Mimo Pro               │
│  Temperature: 0.7              │  Temperature: 0.7              │
│  ┌──────────────────────────┐  │  ┌──────────────────────────┐  │
│  │ Response from GPT-4o-mini│  │  │ Response from Mimo Pro   │  │
│  │ ...                      │  │  │ ...                      │  │
│  │                          │  │  │                          │  │
│  │ Tokens: 342  Time: 1.8s  │  │  │ Tokens: 289  Time: 2.1s  │  │
│  └──────────────────────────┘  │  └──────────────────────────┘  │
└────────────────────────────────┴────────────────────────────────┘
```

### Features

| Feature | Description |
|---------|-------------|
| **System Prompt Editor** | Multi-line textarea with syntax highlighting for prompt text |
| **Context Panel** | Auto-populated from RAG search, or manually pasted. Toggle RAG on/off. |
| **User Message** | The test question |
| **Model Selection** | Dropdown of all configured models across all providers |
| **Temperature** | Slider 0.0-2.0 with real-time value display |
| **Top P** | Slider 0.0-1.0 |
| **Max Tokens** | Input field with presets (256, 512, 1024, 2048, 4096) |
| **Stream Toggle** | Enable/disable streaming response |
| **RAG Toggle** | Enable/disable document context with Top-K selector |
| **Response Panel** | Streaming response with markdown rendering, token count, latency |
| **Compare Mode** | Side-by-side comparison of 2-3 models with same prompt |
| **Save as Template** | Save current configuration as a reusable prompt template |
| **Load Template** | Load a saved prompt template |
| **History** | View past playground runs with parameters and responses |

### New API Endpoints Required

```
POST /api/ai/playground              → Run playground prompt (streaming)
GET  /api/ai/playground/history      → Past playground runs
POST /api/ai/playground/compare      → Run same prompt on multiple models
```

---

## Step 7: Prompt Management

### Page Layout

**Page**: `/ai/prompts`

```
┌─────────────────────────────────────────────────────────────────┐
│  AI > Prompts                                      [+ New Prompt]│
├─────────────────────────────────────────────────────────────────┤
│  🔍 Search prompts...              [Category ▼] [Status ▼]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📝 RAG Assistant                    v3  ✅ Active         │  │
│  │    "You are a helpful assistant that answers questions     │  │
│  │     based on the provided context..."                      │  │
│  │    Category: General    Used in: 89 chats                  │  │
│  │    Last edited: Oct 18, 2025 by John                       │  │
│  │    [Edit] [Test] [Versions] [Duplicate] [Archive]          │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ 📝 Technical Support                v2  ✅ Active         │  │
│  │    "You are a technical support agent. Answer questions    │  │
│  │     about the product step by step..."                     │  │
│  │    Category: Support    Used in: 34 chats                  │  │
│  │    Last edited: Oct 15, 2025 by Jane                       │  │
│  │    [Edit] [Test] [Versions] [Duplicate] [Archive]          │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ 📝 Sales Assistant                  v1  📦 Archived       │  │
│  │    "You are a sales assistant..."                          │  │
│  │    Category: Sales      Used in: 12 chats                  │  │
│  │    [Edit] [Test] [Versions] [Duplicate] [Activate]         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Prompt Editor

**Page**: `/ai/prompts/[id]`

```
┌─────────────────────────────────────────────────────────────────┐
│  AI > Prompts > RAG Assistant (v3)               [Save] [Test]  │
├──────────────────────────────────────────────────┬──────────────┤
│                                                  │              │
│  Name:                                           │  Variables   │
│  ┌────────────────────────────────────────┐      │              │
│  │ RAG Assistant                          │      │  {context}   │
│  └────────────────────────────────────────┘      │  {question}  │
│                                                  │  {sources}   │
│  Category:                                       │  {language}  │
│  ┌────────────────────────────────────────┐      │              │
│  │ General                           [▼]  │      │  ────────── │
│  └────────────────────────────────────────┘      │              │
│                                                  │  Preview:    │
│  System Prompt:                                  │              │
│  ┌────────────────────────────────────────┐      │  "You are a  │
│  │ You are a helpful assistant that       │      │   helpful    │
│  │ answers questions based on the         │      │   assistant  │
│  │ provided context.                      │      │   that..."   │
│  │                                        │      │              │
│  │ Context:                               │      │              │
│  │ {context}                              │      │              │
│  │                                        │      │              │
│  │ Always cite your sources using [1],    │      │              │
│  │ [2] notation. If the context does not  │      │              │
│  │ contain enough information, say so.    │      │              │
│  │                                        │      │              │
│  │ Respond in {language}.                │      │              │
│  └────────────────────────────────────────┘      │              │
│                                                  │              │
│  ── Version History ──────────────────────       │              │
│                                                  │              │
│  v3 (current) — Oct 18, 2025 — Added {language} │              │
│  v2 — Oct 15, 2025 — Added source citation      │              │
│  v1 — Oct 12, 2025 — Initial version            │              │
│                                                  │              │
│  [View Diff] [Revert to v2]                      │              │
└──────────────────────────────────────────────────┴──────────────┘
```

### Features

| Feature | Description |
|---------|-------------|
| **System Prompt Templates** | Create, edit, delete prompt templates with variable placeholders |
| **Variable System** | Define variables like `{context}`, `{question}`, `{language}` that get replaced at runtime |
| **Versioning** | Every save creates a new version. View history, compare diffs, revert to previous versions |
| **Prompt Testing** | "Test" button opens the Playground with the prompt pre-loaded |
| **Categories** | Organize prompts by category (General, Support, Sales, Technical) |
| **Active/Archive** | Only one prompt can be active per category (or a default active prompt) |
| **Prompt Library** | Pre-built prompt templates for common use cases |
| **Import/Export** | Export prompts as JSON, import from file |

### New Database Models Required

```prisma
model PromptTemplate {
  id          String   @id @default(uuid())
  workspaceId String   @map("workspace_id")
  name        String   @db.VarChar(200)
  content     String   // The prompt text with {variables}
  category    String   @default("general") @db.VarChar(50)
  isActive    Boolean  @default(false) @map("is_active")
  version     Int      @default(1)
  createdBy   String?  @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  workspace  Workspace       @relation(fields: [workspaceId], references: [id])
  creator    User?           @relation(fields: [createdBy], references: [id])
  versions   PromptVersion[]

  @@map("prompt_templates")
}

model PromptVersion {
  id         String   @id @default(uuid())
  promptId   String   @map("prompt_id")
  version    Int
  content    String
  changeNote String?  @map("change_note")
  createdBy  String?  @map("created_by")
  createdAt  DateTime @default(now()) @map("created_at")

  prompt  PromptTemplate @relation(fields: [promptId], references: [id], onDelete: Cascade)
  creator User?          @relation(fields: [createdBy], references: [id])

  @@unique([promptId, version])
  @@map("prompt_versions")
}
```

### New API Endpoints Required

```
GET    /api/ai/prompts                → List all prompt templates
POST   /api/ai/prompts                → Create new prompt template
GET    /api/ai/prompts/[id]           → Get prompt detail with versions
PUT    /api/ai/prompts/[id]           → Update prompt (creates new version)
DELETE /api/ai/prompts/[id]           → Delete prompt template
GET    /api/ai/prompts/[id]/versions  → Get version history
POST   /api/ai/prompts/[id]/revert    → Revert to a specific version
POST   /api/ai/prompts/[id]/test      → Test prompt in playground
```

---

## Step 8: Workspace System

### Multi-Tenancy Architecture

The workspace system transforms Mimotes from single-user to multi-tenant. Every resource belongs to a workspace.

#### Database Schema Changes

```prisma
model Workspace {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(200)
  slug        String   @unique @db.VarChar(100)  // URL-friendly identifier
  plan        String   @default("free") @db.VarChar(50) // free, starter, pro, enterprise
  settings    Json?    // workspace-level settings
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  members     WorkspaceMember[]
  documents   Document[]
  chatSessions ChatSession[]
  prompts     PromptTemplate[]
  apiKeys     ApiKey[]
  analytics   AnalyticsEvent[]
  invitations Invitation[]

  @@map("workspaces")
}

model WorkspaceMember {
  id          String   @id @default(uuid())
  workspaceId String   @map("workspace_id")
  userId      String   @map("user_id")
  role        String   @db.VarChar(20)  // owner, admin, editor, viewer
  createdAt   DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@map("workspace_members")
}

model Invitation {
  id          String   @id @default(uuid())
  workspaceId String   @map("workspace_id")
  email       String   @db.VarChar(255)
  role        String   @db.VarChar(20)
  token       String   @unique
  expiresAt   DateTime @map("expires_at")
  acceptedAt  DateTime? @map("accepted_at")
  createdAt   DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("invitations")
}
```

#### Modified Existing Models

Every major model gains a `workspaceId` foreign key:

- `Document` → `workspaceId` (required)
- `ChatSession` → `workspaceId` (required, replaces nullable `userId`)
- `Setting` → `workspaceId` (per-workspace AI settings)
- `User` → No workspaceId (users can belong to multiple workspaces)

### Roles and Permissions

| Permission | Owner | Admin | Editor | Viewer |
|------------|-------|-------|--------|--------|
| **Workspace** |||||
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Update workspace settings | ✅ | ✅ | ❌ | ❌ |
| Change workspace plan | ✅ | ❌ | ❌ | ❌ |
| **Members** |||||
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change member roles | ✅ | ✅ (except owner) | ❌ | ❌ |
| View member list | ✅ | ✅ | ✅ | ✅ |
| **Documents** |||||
| Upload documents | ✅ | ✅ | ✅ | ❌ |
| Delete documents | ✅ | ✅ | ✅ | ❌ |
| View documents | ✅ | ✅ | ✅ | ✅ |
| **Chat** |||||
| Create chat sessions | ✅ | ✅ | ✅ | ✅ |
| View chat history | ✅ | ✅ | ✅ | ✅ |
| Delete chat sessions | ✅ | ✅ | ✅ | ❌ |
| **AI Settings** |||||
| Configure AI providers | ✅ | ✅ | ❌ | ❌ |
| Manage prompts | ✅ | ✅ | ✅ | ❌ |
| Use playground | ✅ | ✅ | ✅ | ❌ |
| **API** |||||
| Create API keys | ✅ | ✅ | ❌ | ❌ |
| View API usage | ✅ | ✅ | ✅ | ✅ |
| **Analytics** |||||
| View analytics | ✅ | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ✅ | ❌ |

### Workspace Member Management

**Page**: `/workspace/members`

```
┌─────────────────────────────────────────────────────────────────┐
│  Workspace > Members                            [+ Invite]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 👤 John Doe              john@example.com    Owner    [—]  │  │
│  │ 👤 Jane Smith            jane@example.com    Admin    [▼]  │  │
│  │ 👤 Bob Wilson            bob@example.com     Editor   [▼]  │  │
│  │ 👤 Alice Brown           alice@example.com   Viewer   [▼]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Pending Invitations:                                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📧 charlie@example.com    Editor   Expires: Oct 25 [Resend]│ │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Invite Flow

```
Admin clicks "Invite" → Enter email + select role → Generate invitation token
→ Send email with invite link → Invitee clicks link → Register/Login
→ Accept invitation → Added as workspace member with specified role
```

### New API Endpoints Required

```
POST   /api/workspaces                    → Create workspace
GET    /api/workspaces                    → List user's workspaces
GET    /api/workspaces/[id]               → Get workspace detail
PUT    /api/workspaces/[id]               → Update workspace
DELETE /api/workspaces/[id]               → Delete workspace (owner only)

GET    /api/workspaces/[id]/members       → List members
POST   /api/workspaces/[id]/members       → Invite member
PUT    /api/workspaces/[id]/members/[uid] → Change role
DELETE /api/workspaces/[id]/members/[uid] → Remove member

POST   /api/workspaces/[id]/invitations   → Send invitation
GET    /api/workspaces/[id]/invitations   → List pending invitations
DELETE /api/workspaces/[id]/invitations/[iid] → Cancel invitation
POST   /api/invitations/[token]/accept    → Accept invitation
```

---

## Step 9: API Platform

### 9.1 API Key Management

**Page**: `/workspace/api-keys`

```
┌─────────────────────────────────────────────────────────────────┐
│  Workspace > API Keys                              [+ Create Key]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔑 Production Key                    ✅ Active            │  │
│  │    Key: mk_live_****************************              │  │
│  │    Created: Oct 1, 2025                                   │  │
│  │    Last used: 2 min ago                                   │  │
│  │    Rate limit: 100 req/min                                │  │
│  │    Usage this month: 2,847 requests                       │  │
│  │    [View Usage] [Rotate] [Revoke]                         │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ 🔑 Development Key                   ✅ Active            │  │
│  │    Key: mk_test_****************************              │  │
│  │    Created: Oct 15, 2025                                  │  │
│  │    Last used: 1 hour ago                                  │  │
│  │    Rate limit: 20 req/min                                 │  │
│  │    Usage this month: 156 requests                         │  │
│  │    [View Usage] [Rotate] [Revoke]                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.2 API Key Creation Modal

```
┌─────────────────────────────────────────────────────────────────┐
│  Create API Key                                              [✕] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Name:                                                          │
│  ┌────────────────────────────────────────┐                     │
│  │ Production Key                         │                     │
│  └────────────────────────────────────────┘                     │
│                                                                 │
│  Rate Limit (requests per minute):                              │
│  ┌────────────────────────────────────────┐                     │
│  │ 100                                   │                     │
│  └────────────────────────────────────────┘                     │
│                                                                 │
│  Permissions:                                                   │
│  [✅] Chat (POST /api/v1/chat)                                 │
│  [✅] Search (POST /api/v1/search)                             │
│  [❌] Documents (CRUD) — requires admin key                     │
│                                                                 │
│  Expiration:                                                    │
│  [Never ▼]  or  [Custom date]                                  │
│                                                                 │
│  [Cancel]  [Create Key]                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 9.3 API Documentation

**Page**: `/docs`

```
┌─────────────────────────────────────────────────────────────────┐
│  API Documentation                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┬──────────────────────────────────────────────────┐│
│  │ Sidebar  │  Content                                         ││
│  │          │                                                  ││
│  │ Getting  │  # Authentication                                ││
│  │ Started  │                                                  ││
│  │          │  All API requests require an API key in the      ││
│  │ Auth     │  Authorization header:                           ││
│  │          │                                                  ││
│  │ Chat API │  ```                                             ││
│  │          │  Authorization: Bearer mk_live_xxxxx             ││
│  │ Search   │  ```                                             ││
│  │ API      │                                                  ││
│  │          │  ## Base URL                                     ││
│  │ Document │                                                  ││
│  │ API      │  ```                                             ││
│  │          │  https://your-domain.com/api/v1                  ││
│  │ Webhooks │  ```                                             ││
│  │          │                                                  ││
│  │ Errors   │  ## Rate Limiting                                ││
│  │          │                                                  ││
│  │ SDKs     │  Rate limits are per API key:                    ││
│  │          │  - Free: 20 requests/minute                      ││
│  │          │  - Starter: 100 requests/minute                  ││
│  │          │  - Pro: 500 requests/minute                      ││
│  │          │  - Enterprise: Custom                            ││
│  │          │                                                  ││
│  │          │  Response headers:                               ││
│  │          │  - X-RateLimit-Limit: 100                        ││
│  │          │  - X-RateLimit-Remaining: 97                     ││
│  │          │  - X-RateLimit-Reset: 1697234567                 ││
│  └──────────┴──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 9.4 Public API Endpoints (v1)

```
Base URL: /api/v1

POST   /api/v1/chat                    → Chat with RAG (streaming)
POST   /api/v1/search                  → Similarity search
GET    /api/v1/documents               → List documents
POST   /api/v1/documents               → Upload document
GET    /api/v1/documents/[id]          → Get document detail
DELETE /api/v1/documents/[id]          → Delete document
GET    /api/v1/documents/[id]/chunks   → Get document chunks
GET    /api/v1/sessions                → List chat sessions
GET    /api/v1/sessions/[id]           → Get session with messages
DELETE /api/v1/sessions/[id]           → Delete session
GET    /api/v1/usage                   → Get usage statistics
```

### 9.5 SDK Examples

The documentation page provides code examples in multiple languages:

```javascript
// JavaScript/Node.js
import { Mimotes } from '@mimotes/sdk';

const client = new Mimotes({
  apiKey: 'mk_live_xxxxx',
  baseUrl: 'https://your-domain.com/api/v1'
});

// Chat
const response = await client.chat({
  message: 'What is the pricing model?',
  stream: true
});

// Search
const results = await client.search({
  query: 'pricing',
  topK: 5
});
```

```python
# Python
from mimotes import Mimotes

client = Mimotes(api_key="mk_live_xxxxx")

# Chat
response = client.chat(message="What is the pricing model?")

# Search
results = client.search(query="pricing", top_k=5)
```

```bash
# cURL
curl -X POST https://your-domain.com/api/v1/chat \
  -H "Authorization: Bearer mk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the pricing model?"}'
```

### New Database Models Required

```prisma
model ApiKey {
  id          String   @id @default(uuid())
  workspaceId String   @map("workspace_id")
  name        String   @db.VarChar(200)
  keyHash     String   @unique @map("key_hash")  // SHA-256 hash of the key
  keyPrefix   String   @map("key_prefix") @db.VarChar(20) // "mk_live_" + first 8 chars
  permissions Json?    // { chat: true, search: true, documents: false }
  rateLimit   Int      @default(100) @map("rate_limit")
  isActive    Boolean  @default(true) @map("is_active")
  lastUsedAt  DateTime? @map("last_used_at")
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  usage     ApiKeyUsage[]

  @@map("api_keys")
}

model ApiKeyUsage {
  id         String   @id @default(uuid())
  apiKeyId   String   @map("api_key_id")
  endpoint   String   @db.VarChar(200)
  method     String   @db.VarChar(10)
  statusCode Int      @map("status_code")
  duration   Int      // milliseconds
  tokens     Int?     // estimated tokens used
  createdAt  DateTime @default(now()) @map("created_at")

  apiKey ApiKey @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  @@index([apiKeyId, createdAt])
  @@map("api_key_usage")
}
```

### New Middleware Required

```
/api/v1/* → API Key middleware
  → Extract Authorization header
  → Hash key, look up in api_keys table
  → Check: key exists, is active, not expired
  → Check: rate limit not exceeded (per-key)
  → Check: permission for requested endpoint
  → Attach workspace context to request
  → Log usage to api_key_usage table
  → Forward to handler
```

---

## Step 10: Public Chat Widget

### Embeddable Widget Design

The chat widget allows workspace owners to embed a Mimotes chatbot on their website.

### Widget Script

```html
<!-- Add before </body> -->
<script src="https://your-domain.com/widget.js"
  data-workspace="ws_abc123"
  data-theme="light"
  data-position="bottom-right"
  data-greeting="Hi! How can I help you?"
></script>
```

### Widget Appearance

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                                                 │
│                                          ┌──────────────────┐   │
│                                          │  💬 Chat          │   │
│                                          │                  │   │
│                                          │  Hi! How can I   │   │
│                                          │  help you today? │   │
│                                          │                  │   │
│                                          │  ┌────────────┐  │   │
│                                          │  │Type message│  │   │
│                                          │  └────────────┘  │   │
│                                          │         [Send]   │   │
│                                          ├──────────────────┤   │
│                                          │  Powered by      │   │
│  (FAB button)                           │  Mimotes  🤖     │   │
│       💬                                └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Widget Configuration

| Setting | Options | Default |
|---------|---------|---------|
| **Theme** | light, dark, auto | light |
| **Position** | bottom-right, bottom-left | bottom-right |
| **Primary Color** | Any hex color | #3b82f6 (blue) |
| **Greeting** | Custom text | "Hi! How can I help you?" |
| **Placeholder** | Input placeholder | "Type your question..." |
| **Show Sources** | true/false | true |
| **Allow File Upload** | true/false | false |
| **Width** | 360-480px | 400px |
| **Height** | 500-700px | 600px |
| **Branding** | Show/hide "Powered by Mimotes" | show (free plan), hide (pro+) |

### Widget Analytics

Track widget-specific metrics:
- Widget loads (page views where widget script loaded)
- Widget opens (user clicked the FAB button)
- Widget conversations started
- Widget messages sent
- Widget response times
- Widget satisfaction (optional thumbs up/down after each response)

### Implementation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Customer Website                                                │
│                                                                 │
│  <script src="mimotes.com/widget.js">                          │
│       │                                                         │
│       ▼                                                         │
│  widget.js (lightweight, <50KB)                                 │
│  ├── Creates iframe or shadow DOM                               │
│  ├── Renders chat UI                                            │
│  ├── Connects to Mimotes API via WebSocket or fetch             │
│  └── Sends analytics events                                     │
│                                                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Mimotes API                                                     │
│                                                                 │
│  /api/widget/chat       → Chat endpoint for widget              │
│  /api/widget/config     → Get widget configuration              │
│  /api/widget/analytics  → Track widget events                   │
│  /widget.js             → Widget script (CDN-served)            │
└─────────────────────────────────────────────────────────────────┘
```

### Widget Settings Page

**Page**: `/workspace/settings#widget`

```
┌─────────────────────────────────────────────────────────────────┐
│  Workspace > Settings > Chat Widget                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Embed Code:                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ <script src="https://mimotes.com/widget.js"              │  │
│  │   data-workspace="ws_abc123"                             │  │
│  │   data-theme="light"                                     │  │
│  │   data-position="bottom-right"                           │  │
│  ></script>                                                   │  │
│  │                                              [Copy]       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Theme:        [Light ▼]                                        │
│  Position:     [Bottom Right ▼]                                 │
│  Primary Color:[#3b82f6 🎨]                                     │
│  Greeting:     [Hi! How can I help you?___________________]     │
│  Placeholder:  [Type your question..._____________________]     │
│  Show Sources: [✅]                                              │
│  Allow Upload: [❌]                                              │
│  Width:        [400] px                                         │
│  Height:       [600] px                                         │
│                                                                 │
│  [Preview Widget]  [Save Settings]                              │
│                                                                 │
│  ── Widget Analytics (Last 30 days) ─────────────────────────   │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 👁       │ │ 💬       │ │ ❓       │ │ ⏱       │          │
│  │ 12,450   │ │ 890      │ │ 2,340    │ │ 1.2s     │          │
│  │ Loads    │ │ Opens    │ │ Messages │ │ Avg Resp │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### New API Endpoints Required

```
GET  /api/widget/config                → Get widget configuration for workspace
POST /api/widget/chat                  → Chat endpoint for widget (streaming)
POST /api/widget/analytics             → Track widget events
GET  /widget.js                        → Serve widget script
```

---

## Step 11: Roadmap

### Phase 1: Foundation — Multi-Tenancy and Dashboard

**Goal**: Transform from single-user to multi-tenant SaaS with a professional dashboard.

| Feature | Business Value | Development Complexity | UI Impact | Technical Requirements |
|---------|---------------|----------------------|-----------|----------------------|
| **Workspace System** | 🔴 Critical — Enables multi-tenant SaaS | 🔴 High | 🟡 Medium | New DB models (Workspace, WorkspaceMember, Invitation), middleware for workspace context, modify all existing queries to filter by workspaceId |
| **Dashboard with Widgets** | 🔴 Critical — First impression for SaaS users | 🟡 Medium | 🔴 High | New page with aggregated queries, chart library (recharts or chart.js), date range filtering |
| **Sidebar Navigation** | 🔴 Critical — Professional SaaS feel | 🟡 Medium | 🔴 High | New layout component, responsive sidebar, breadcrumbs |
| **Role-Based Access Control** | 🔴 Critical — Team collaboration prerequisite | 🟡 Medium | 🟢 Low | Permission middleware, role checks in API routes and components |
| **Invitation System** | 🟡 High — Enables team growth | 🟡 Medium | 🟡 Medium | Email sending (resend/nodemailer), invitation tokens, accept flow |
| **Dark Mode** | 🟡 High — Expected in modern SaaS | 🟢 Low | 🟡 Medium | next-themes, Tailwind dark: prefix on all components |

**Database Migrations**: 4 new tables (workspaces, workspace_members, invitations, modify existing tables to add workspaceId)

**New Dependencies**: `next-themes`, `recharts` (or `@tremor/react`), `resend` (email)

**Estimated Scope**: Core workspace + dashboard + sidebar

---

### Phase 2: Knowledge Base and Analytics

**Goal**: Power users can explore, debug, and optimize their RAG pipeline. Admins can track usage and costs.

| Feature | Business Value | Development Complexity | UI Impact | Technical Requirements |
|---------|---------------|----------------------|-----------|----------------------|
| **Document Explorer** | 🟡 High — Better document management | 🟢 Low | 🟡 Medium | Enhanced document list with search, filter, sort, bulk actions |
| **Chunk Explorer** | 🟡 High — RAG debugging | 🟡 Medium | 🟡 Medium | New page with chunk list, pagination, content preview |
| **Similarity Search UI** | 🟡 High — RAG quality tuning | 🟢 Low | 🟡 Medium | New page with search input, results display, adjustable parameters |
| **Chat Analytics** | 🟡 High — Usage insights | 🟡 Medium | 🟡 Medium | Analytics event tracking, aggregation queries, chart components |
| **Usage Analytics** | 🟡 Medium — Operational visibility | 🟡 Medium | 🟡 Medium | Event tracking middleware, aggregation, export |
| **AI Cost Estimation** | 🟡 Medium — Budget awareness | 🟢 Low | 🟡 Medium | Token counting, pricing table, cost calculation |
| **Embedding Viewer** | 🟢 Low — Nice-to-have for power users | 🟡 Medium | 🟢 Low | t-SNE/PCA projection, scatter plot visualization |

**Database Migrations**: 1 new table (analytics_events), modify existing tables

**New Dependencies**: `recharts` (if not in Phase 1), `pca-js` or `tsne-js` (for embedding visualization)

**Estimated Scope**: Knowledge base explorer + analytics system

---

### Phase 3: AI Playground and Prompt Management

**Goal**: Users can experiment with AI configurations and manage prompts professionally.

| Feature | Business Value | Development Complexity | UI Impact | Technical Requirements |
|---------|---------------|----------------------|-----------|----------------------|
| **AI Playground** | 🟡 High — Key differentiator | 🟡 Medium | 🔴 High | Streaming playground UI, model selection, parameter controls, compare mode |
| **Prompt Templates** | 🟡 High — Reusable configurations | 🟡 Medium | 🟡 Medium | CRUD for prompt templates, variable system, versioning |
| **Prompt Versioning** | 🟡 Medium — Professional prompt management | 🟡 Medium | 🟡 Medium | Version storage, diff view, revert functionality |
| **Prompt Testing** | 🟡 Medium — Validate before deploying | 🟢 Low | 🟢 Low | Integration with playground |
| **AI Model Registry** | 🟢 Low — Nice-to-have | 🟢 Low | 🟢 Low | Enhanced model detection, model metadata storage |

**Database Migrations**: 2 new tables (prompt_templates, prompt_versions)

**New Dependencies**: `diff` (for version diffing)

**Estimated Scope**: Playground + prompt management system

---

### Phase 4: API Platform and Widget

**Goal**: External developers can integrate with Mimotes. Businesses can embed chatbots on their websites.

| Feature | Business Value | Development Complexity | UI Impact | Technical Requirements |
|---------|---------------|----------------------|-----------|----------------------|
| **API Key Management** | 🔴 Critical — API platform prerequisite | 🟡 Medium | 🟡 Medium | API key CRUD, hashing, prefix display, rate limit per key |
| **Public API (v1)** | 🔴 Critical — Developer ecosystem | 🔴 High | 🟢 Low | New API routes under /api/v1, API key middleware, versioned endpoints |
| **Rate Limiting per Key** | 🔴 Critical — Abuse prevention | 🟡 Medium | 🟢 Low | Per-key rate limiting (Redis or in-memory), usage tracking |
| **API Documentation** | 🟡 High — Developer experience | 🟡 Medium | 🟡 Medium | Documentation page with code examples, interactive API explorer |
| **Chat Widget** | 🟡 High — Revenue driver | 🔴 High | 🔴 High | Widget script (lightweight JS), shadow DOM or iframe, widget-specific API endpoints |
| **Widget Customization** | 🟡 Medium — Brand alignment | 🟡 Medium | 🟡 Medium | Widget settings UI, theme configuration, preview |
| **Widget Analytics** | 🟢 Low — Nice-to-have initially | 🟡 Medium | 🟢 Low | Widget event tracking, usage dashboard |

**Database Migrations**: 2 new tables (api_keys, api_key_usage)

**New Dependencies**: `crypto` (for key hashing, built-in), custom widget bundle

**Estimated Scope**: API platform + widget + documentation

---

### Implementation Priority Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│  BUSINESS VALUE                                                  │
│  HIGH   │  Workspace    │  Dashboard  │  API Platform           │
│         │  System       │  Widgets    │  Chat Widget            │
│         │               │             │                         │
│  MED    │  RBAC         │  Knowledge  │  AI Playground          │
│         │  Invitations  │  Base       │  Prompt Mgmt            │
│         │               │  Explorer   │                         │
│  LOW    │  Dark Mode    │  Analytics  │  Embedding Viewer       │
│         │               │             │  Widget Analytics       │
│         ├───────────────┼─────────────┼─────────────────────────│
│         │    LOW EFFORT  │  MED EFFORT │    HIGH EFFORT          │
│                         DEVELOPMENT COMPLEXITY                   │
└─────────────────────────────────────────────────────────────────┘
```

### Cross-Phase Dependencies

```
Phase 1: Workspace + Dashboard + Sidebar + RBAC
    │
    ├── Phase 2: Knowledge Base Explorer + Analytics
    │       │
    │       └── (Analytics data feeds Dashboard widgets)
    │
    ├── Phase 3: AI Playground + Prompt Management
    │       │
    │       └── (Prompts integrate with Playground and Chat)
    │
    └── Phase 4: API Platform + Widget
            │
            └── (API keys belong to Workspaces, Widget uses API)
```

### Total New Database Models

| Phase | New Models | Modified Models |
|-------|-----------|----------------|
| Phase 1 | Workspace, WorkspaceMember, Invitation | User, Document, ChatSession, Setting |
| Phase 2 | AnalyticsEvent | — |
| Phase 3 | PromptTemplate, PromptVersion | — |
| Phase 4 | ApiKey, ApiKeyUsage | — |
| **Total** | **8 new models** | **4 modified models** |

### Total New API Endpoints

| Phase | Endpoints |
|-------|-----------|
| Phase 1 | ~12 (workspace CRUD, member management, invitations) |
| Phase 2 | ~10 (knowledge base, analytics) |
| Phase 3 | ~10 (playground, prompts) |
| Phase 4 | ~15 (API keys, public API v1, widget) |
| **Total** | **~47 new endpoints** |

### Total New Pages

| Phase | Pages |
|-------|-------|
| Phase 1 | Dashboard, Sidebar layout, Workspace settings, Members, Invitations |
| Phase 2 | Documents explorer, Chunks, Similarity search, Sources, Analytics (3 pages) |
| Phase 3 | Playground, Prompts list, Prompt editor, Models |
| Phase 4 | API Keys, API Docs, Widget settings |
| **Total** | **~18 new pages** |

---

## Appendix A: Technology Additions

| Package | Purpose | Phase |
|---------|---------|-------|
| `next-themes` | Dark mode support | 1 |
| `recharts` or `@tremor/react` | Chart components for analytics | 1-2 |
| `resend` or `nodemailer` | Email sending for invitations | 1 |
| `diff` | Text diffing for prompt versioning | 3 |
| `@tanstack/react-table` | Advanced table component | 1 |
| `zustand` | Client state management (optional) | 1 |
| `zod` | API request/response validation | 4 |

## Appendix B: Billing Considerations

While billing implementation is out of scope for this plan, the architecture should support it:

| Plan | Workspace Members | Documents | Chats/Month | API Calls/Min | Widget |
|------|------------------|-----------|-------------|---------------|--------|
| **Free** | 1 | 5 | 100 | 20 | ❌ |
| **Starter** | 5 | 50 | 1,000 | 100 | ✅ |
| **Pro** | 20 | 200 | 10,000 | 500 | ✅ + branding |
| **Enterprise** | Unlimited | Unlimited | Unlimited | Custom | ✅ + custom |

The `Workspace.plan` field and `Workspace.settings` JSON field provide the foundation for plan-based feature gating without requiring a billing integration initially.

## Appendix C: Migration Strategy

The transition from single-tenant to multi-tenant requires careful data migration:

1. **Create default workspace**: Auto-create a "Default" workspace for the existing admin user
2. **Backfill workspaceId**: Add `workspaceId` to all existing Documents, ChatSessions, and Settings, pointing to the default workspace
3. **Make workspaceId required**: After backfill, make the foreign key required (NOT NULL)
4. **Preserve existing URLs**: All current `/documents`, `/chat`, `/settings` URLs redirect to the new `/knowledge/documents`, `/chat`, `/settings` paths
5. **API compatibility**: Existing `/api/chat`, `/api/upload`, etc. continue to work using the default workspace context. New `/api/v1/*` endpoints require API keys.
