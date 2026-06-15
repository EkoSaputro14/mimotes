# IMPLEMENTATION_ROADMAP.md — Mimotes SaaS Expansion

> Phased implementation roadmap for transforming Mimotes from a single-tenant RAG chatbot into a professional multi-tenant AI SaaS platform. Each phase builds on the previous, with build verification and documentation after every phase.

---

## Implementation Rules

1. Never implement everything at once — work in phases
2. Complete one phase before starting the next
3. Verify build success after every phase
4. Update documentation after every phase
5. Use existing architecture whenever possible
6. Reuse existing APIs before creating new ones
7. Follow project coding standards (see [`AGENTS.md`](AGENTS.md))
8. Use shadcn/ui components (v4 with `@base-ui/react` primitives)
9. Use responsive mobile-first design
10. For every phase: analyze → list files → explain DB/API changes → implement → verify build → generate report

---

## Phase Overview

| Phase | Name | Status | New Files | Modified Files | New DB Models | New API Endpoints | New Dependencies |
|-------|------|--------|-----------|---------------|---------------|-------------------|------------------|
| **1** | Dashboard Shell | ✅ **DONE** | 5 | 5 | 0 | 0 | lucide-react, shadcn/ui |
| **2** | Dashboard Widgets | ✅ **DONE** | ~10 | ~4 | 0 | 5 | recharts, next-themes |
| **3** | Knowledge Base Explorer | ✅ **DONE** | ~8 | ~4 | 0 | 8 | — |
| **4** | Analytics | ✅ **DONE** | 15 | 7 | 1 | 5 | — |
| **5** | AI Management | ⏳ NEXT | ~12 | ~4 | 2 | 11 | diff |
| **6** | Workspace System | ⏳ Pending | ~12 | ~8 | 3 | 12 | — |
| **7** | Public Widget | ⏳ Pending | ~8 | ~3 | 2 | 4 | — |
| **Total** | | | **~58** | **~27** | **8** | **~45** | |

---

## Cross-Phase Dependency Graph

```
Phase 1: Dashboard Shell ─────────────────────────────────── ✅ DONE
    │
    ├── Phase 2: Dashboard Widgets ───────────────────────── ✅ DONE
    │       │
    │       ├── Phase 3: Knowledge Base Explorer ─────────── ✅ DONE
    │       │       │
    │       │       └── (Document/Chunk data feeds dashboard widgets)
    │       │
    │       ├── Phase 4: Analytics ───────────────────────── ✅ DONE
    │       │       │
    │       │       └── (Analytics events feed dashboard charts)
    │       │
    │       └── Phase 5: AI Management ───────────────────── ⏳ NEXT
    │               │
    │               └── (Prompts integrate with Playground and Chat)
    │
    └── Phase 6: Workspace System
            │
            ├── (All data becomes workspace-scoped)
            ├── (Analytics events get workspace context)
            └── Phase 7: Public Widget
                    │
                    └── (Widget uses workspace-scoped API keys)
```

**Key Insight**: Phases 2-5 build features using the current single-tenant architecture. Phase 6 introduces multi-tenancy by adding `workspaceId` to existing models. Phase 7 depends on the workspace system for API key management.

---

## Phase 1: Dashboard Shell ✅ DONE

**Goal**: Professional SaaS layout with sidebar navigation, breadcrumbs, and responsive mobile support.

### Status: COMPLETED

### What Was Built

| Component | File | Type | Description |
|-----------|------|------|-------------|
| DashboardShell | [`components/layout/dashboard-shell.tsx`](components/layout/dashboard-shell.tsx) | Server | Auth guard + layout wrapper |
| DashboardShellClient | [`components/layout/dashboard-shell-client.tsx`](components/layout/dashboard-shell-client.tsx) | Client | Sidebar state + responsive layout |
| AppSidebar | [`components/layout/app-sidebar.tsx`](components/layout/app-sidebar.tsx) | Client | Navigation with collapsible sections |
| TopNav | [`components/layout/top-nav.tsx`](components/layout/top-nav.tsx) | Client | Breadcrumbs + user dropdown + mobile hamburger |
| MobileNav | [`components/layout/mobile-nav.tsx`](components/layout/mobile-nav.tsx) | Client | Sheet overlay for mobile |

### Refactored Pages

- [`app/(admin)/documents/page.tsx`](app/(admin)/documents/page.tsx) — wrapped in DashboardShell
- [`app/(admin)/documents/upload/page.tsx`](app/(admin)/documents/upload/page.tsx) — wrapped in DashboardShell
- [`app/(admin)/settings/page.tsx`](app/(admin)/settings/page.tsx) — wrapped in DashboardShell

### Dependencies Added

- `lucide-react` — Icon library
- `shadcn/ui` components: button, sheet, dropdown-menu, avatar, separator, tooltip

### Build Result

✅ **0 errors, 32.4s** (Turbopack)

### Report

See [`plans/DASHBOARD_SHELL_REPORT.md`](plans/DASHBOARD_SHELL_REPORT.md)

---

## Phase 2: Dashboard Widgets ⏳ NEXT

**Goal**: Transform the empty `/dashboard` page into an information-rich overview with statistics cards, charts, and activity feeds.

### Design Reference

- [`plans/SAAS_EXPANSION_PLAN.md`](plans/SAAS_EXPANSION_PLAN.md) — Step 3: Dashboard Widgets (lines 266-361)
- [`plans/SAAS_UI_BLUEPRINT.md`](plans/SAAS_UI_BLUEPRINT.md) — Dashboard Page (lines 221-412)

### Dependencies to Install

| Package | Purpose | Version |
|---------|---------|---------|
| `recharts` | Chart components (line charts, bar charts, pie charts) | latest |
| `next-themes` | Dark mode support with theme provider | latest |

### shadcn/ui Components to Add

| Component | Purpose |
|-----------|---------|
| `card` | Widget card containers with header/content/footer |
| `skeleton` | Loading states for all widgets |
| `select` | Date range filter dropdown |
| `badge` | Status indicators on stat cards |
| `tabs` | Widget tab switching (if needed) |

### Database Changes

**No new models.** Queries use existing tables:
- `documents` — count, status distribution, file type breakdown
- `document_chunks` — total count, avg content length
- `chat_sessions` — count, recent sessions
- `chat_messages` — count by role, daily aggregation
- `settings` — current AI provider

### API Endpoints to Create

| Method | Endpoint | Description | Data Source |
|--------|----------|-------------|-------------|
| `GET` | `/api/dashboard/stats` | Aggregated workspace statistics | COUNT queries on documents, chunks, sessions, messages |
| `GET` | `/api/dashboard/usage` | Usage data over time (with `?days=30`) | chat_messages grouped by date |
| `GET` | `/api/dashboard/cost` | Cost estimation data | Token approximation from message content length |
| `GET` | `/api/dashboard/top-documents` | Most referenced documents | Parse `chat_messages.sources` JSON, count by documentId |
| `GET` | `/api/dashboard/health` | System health check | Ping AI provider, DB, vector store |

### Files to Create

| File | Type | Description |
|------|------|-------------|
| `app/dashboard/page.tsx` | Server | Dashboard page with DashboardShell |
| `components/dashboard/stat-card.tsx` | Client | Reusable stat card (icon, value, label, trend) |
| `components/dashboard/usage-chart.tsx` | Client | Line chart for questions over time |
| `components/dashboard/ai-provider-chart.tsx` | Client | Bar/pie chart for provider usage |
| `components/dashboard/top-documents.tsx` | Client | List of most referenced documents |
| `components/dashboard/cost-summary.tsx` | Client | Cost estimation widget |
| `components/dashboard/recent-chats.tsx` | Client | Recent chat sessions list |
| `components/dashboard/kb-stats.tsx` | Client | Knowledge base statistics |
| `components/dashboard/system-health.tsx` | Client | System health indicators |
| `app/api/dashboard/stats/route.ts` | API | Stats endpoint |
| `app/api/dashboard/usage/route.ts` | API | Usage endpoint |
| `app/api/dashboard/cost/route.ts` | API | Cost endpoint |
| `app/api/dashboard/top-documents/route.ts` | API | Top documents endpoint |
| `app/api/dashboard/health/route.ts` | API | Health check endpoint |

### Files to Modify

| File | Change |
|------|--------|
| [`components/layout/app-sidebar.tsx`](components/layout/app-sidebar.tsx) | Add `/dashboard` link (already exists, verify active state) |
| [`app/layout.tsx`](app/layout.tsx) | Add `ThemeProvider` from next-themes |
| [`app/globals.css`](app/globals.css) | Add dark mode CSS variables if not already present |
| [`components/layout/top-nav.tsx`](components/layout/top-nav.tsx) | Add "Dashboard" to breadcrumb label map |

### Implementation Steps

1. Install `recharts` and `next-themes`
2. Add shadcn/ui components: `card`, `skeleton`, `select`, `badge`, `tabs`
3. Add `ThemeProvider` to root layout
4. Create API endpoints for dashboard data
5. Create dashboard widget components
6. Create dashboard page with responsive grid layout
7. Add dark mode support to existing components (Tailwind `dark:` prefix)
8. Build verification

### Widget Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                                      [Last 30d ▼]│
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 📄 24    │ │ 🧩 1,847 │ │ 💬 156   │ │ ❓ 42    │       │
│  │Documents │ │ Chunks   │ │ Chats    │ │Questions │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐│
│  │ 📈 Questions Over Time      │ │ 🤖 AI Provider Usage    ││
│  └─────────────────────────────┘ └─────────────────────────┘│
│  ┌─────────────────────────────┐ ┌─────────────────────────┐│
│  │ 📄 Most Used Documents      │ │ 💰 Cost Estimation      ││
│  └─────────────────────────────┘ └─────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 💬 Recent Chats                                         ││
│  └─────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────┐ ┌─────────────────────────┐│
│  │ 📊 Knowledge Base Stats     │ │ ⚡ System Health        ││
│  └─────────────────────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Widget Layout (Mobile)

```
┌───────────────────────┐
│  Dashboard  [Last 30d]│
├───────────────────────┤
│  ┌───────────────────┐│
│  │ 📄 24  Documents  ││
│  └───────────────────┘│
│  ┌───────────────────┐│
│  │ 🧩 1,847 Chunks   ││
│  └───────────────────┘│
│  ┌───────────────────┐│
│  │ 💬 156 Chats      ││
│  └───────────────────┘│
│  ┌───────────────────┐│
│  │ ❓ 42 Questions   ││
│  └───────────────────┘│
│  ┌───────────────────┐│
│  │ 📈 Usage Chart    ││
│  └───────────────────┘│
│  ┌───────────────────┐│
│  │ 📄 Top Documents  ││
│  └───────────────────┘│
│  ...                  │
└───────────────────────┘
```

### Estimated Scope

- **New files**: ~15
- **Modified files**: ~4
- **New dependencies**: 2 (recharts, next-themes)
- **shadcn/ui components**: 5 (card, skeleton, select, badge, tabs)
- **API endpoints**: 5
- **Build target**: 0 errors

---

## Phase 3: Knowledge Base Explorer ✅ DONE

### Report
- [`plans/IMPLEMENTATION_REPORT_PHASE3.md`](plans/IMPLEMENTATION_REPORT_PHASE3.md)

**Goal**: Transform document management from a simple list into a comprehensive exploration tool with chunk browsing, similarity search, and source analysis.

### Design Reference

- [`plans/SAAS_EXPANSION_PLAN.md`](plans/SAAS_EXPANSION_PLAN.md) — Step 4: Knowledge Base Explorer (lines 364-545)
- [`plans/SAAS_UI_BLUEPRINT.md`](plans/SAAS_UI_BLUEPRINT.md) — Document Explorer (lines 611-775), Chunk Explorer (lines 784-854), Search (lines 860-920), Sources (lines 926-1019)

### Dependencies to Install

No new dependencies. Uses existing stack.

### shadcn/ui Components to Add

| Component | Purpose |
|-----------|---------|
| `input` | Search inputs |
| `table` | Document/chunk data tables |
| `dialog` | Chunk detail modal |
| `pagination` | Document/chunk list pagination |
| `command` | Search command palette (optional) |

### Database Changes

**No new models.** Queries use existing tables with enhanced filtering:
- `documents` — search by title, filter by type/status, sort by date/size/chunks
- `document_chunks` — search by content, filter by document, paginate

### API Endpoints to Create

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/knowledge/documents` | Paginated document list with search/filter/sort |
| `GET` | `/api/knowledge/documents/[id]/chunks` | Chunks for a specific document |
| `GET` | `/api/knowledge/chunks` | All chunks with search/filter/pagination |
| `GET` | `/api/knowledge/chunks/[id]` | Single chunk detail with metadata |
| `GET` | `/api/knowledge/chunks/[id]/similar` | Similar chunks for a specific chunk |
| `POST` | `/api/knowledge/search` | Similarity search with custom query + adjustable params |
| `GET` | `/api/knowledge/sources` | Source aggregation data |
| `DELETE` | `/api/knowledge/chunks/[id]` | Delete single chunk |

### Files to Create

| File | Type | Description |
|------|------|-------------|
| `app/knowledge/documents/page.tsx` | Server | Enhanced document explorer page |
| `app/knowledge/documents/[id]/page.tsx` | Server | Document detail with chunk list |
| `app/knowledge/chunks/page.tsx` | Server | Chunk explorer page |
| `app/knowledge/search/page.tsx` | Server | Similarity search page |
| `app/knowledge/sources/page.tsx` | Server | Source viewer page |
| `components/knowledge/document-explorer.tsx` | Client | Enhanced document list with search/filter/sort |
| `components/knowledge/chunk-viewer.tsx` | Client | Chunk list with pagination + detail modal |
| `components/knowledge/similarity-search.tsx` | Client | Search interface with adjustable Top-K/threshold |
| `components/knowledge/source-viewer.tsx` | Client | Source aggregation with chunk distribution |
| `components/knowledge/chunk-detail.tsx` | Client | Single chunk detail view |
| `app/api/knowledge/documents/route.ts` | API | Paginated documents |
| `app/api/knowledge/documents/[id]/chunks/route.ts` | API | Chunks by document |
| `app/api/knowledge/chunks/route.ts` | API | All chunks |
| `app/api/knowledge/chunks/[id]/route.ts` | API | Single chunk |
| `app/api/knowledge/chunks/[id]/similar/route.ts` | API | Similar chunks |
| `app/api/knowledge/search/route.ts` | API | Similarity search |
| `app/api/knowledge/sources/route.ts` | API | Source aggregation |
| `app/api/knowledge/chunks/[id]/delete/route.ts` | API | Delete chunk |

### Files to Modify

| File | Change |
|------|--------|
| [`components/layout/app-sidebar.tsx`](components/layout/app-sidebar.tsx) | Expand "Knowledge Base" section: add Chunks, Search, Sources links |
| [`components/layout/top-nav.tsx`](components/layout/top-nav.tsx) | Add "Knowledge Base", "Chunks", "Search", "Sources" to breadcrumb labels |
| [`components/documents/document-list.tsx`](components/documents/document-list.tsx) | Refactor to use new API endpoint with search/filter/sort |
| [`app/(admin)/documents/page.tsx`](app/(admin)/documents/page.tsx) | Redirect to `/knowledge/documents` or update route |

### Implementation Steps

1. Add shadcn/ui components: `input`, `table`, `dialog`, `pagination`
2. Create knowledge base API endpoints
3. Create document explorer component (enhanced from existing DocumentList)
4. Create chunk viewer component with pagination
5. Create similarity search interface
6. Create source viewer component
7. Create document detail page with chunk list
8. Update sidebar navigation with new Knowledge Base sub-items
9. Handle URL migration: `/documents` → `/knowledge/documents`
10. Build verification

### Key Features

- **Document Explorer**: Search by title, filter by type/status, sort by date/size/chunks, bulk delete
- **Chunk Explorer**: Browse all chunks, filter by document, full-text search, view metadata
- **Similarity Search**: Adjustable Top-K (1-20), threshold (0.0-1.0), filter by document, performance metrics
- **Source Viewer**: Chunk distribution per document, reference frequency, quick actions
- **Document Detail**: Chunk list for specific document, processing status

### Estimated Scope

- **New files**: ~18
- **Modified files**: ~4
- **API endpoints**: 8
- **Build target**: 0 errors

---

## Phase 4: Analytics ✅ DONE

**Goal**: Track usage, chat metrics, and AI costs. Provide dashboards with charts, KPIs, and export capabilities.

### Status: COMPLETED

**Report**: [`plans/IMPLEMENTATION_REPORT_PHASE4.md`](plans/IMPLEMENTATION_REPORT_PHASE4.md)

### Design Reference

- [`plans/SAAS_EXPANSION_PLAN.md`](plans/SAAS_EXPANSION_PLAN.md) — Step 5: Analytics System (lines 549-710)
- [`plans/SAAS_UI_BLUEPRINT.md`](plans/SAAS_UI_BLUEPRINT.md) — Usage Analytics (lines 1028-1103), Chat Analytics (lines 1109-1159), Cost Analytics (lines 1165-1217)

### Dependencies to Install

No new dependencies (recharts installed in Phase 2).

### shadcn/ui Components to Add

| Component | Purpose |
|-----------|---------|
| `chart` | Recharts wrapper components |
| `date-picker` | Date range selection (optional, may use simple select) |

### Database Changes

**1 new model:**

```prisma
model AnalyticsEvent {
  id        String   @id @default(uuid())
  userId    String?  @map("user_id")
  eventType String   @map("event_type") @db.VarChar(50)
  metadata  Json?
  createdAt DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id])

  @@index([eventType, createdAt])
  @@index([createdAt])
  @@map("analytics_events")
}
```

**Note**: `workspaceId` will be added in Phase 6 when multi-tenancy is introduced.

### API Endpoints to Create

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/chat` | Chat analytics with date range, filters |
| `GET` | `/api/analytics/usage` | Usage analytics aggregation |
| `GET` | `/api/analytics/cost` | Cost estimation with breakdown |
| `GET` | `/api/analytics/export` | Export analytics data as CSV |
| `POST` | `/api/analytics/events` | Internal: record analytics event |

### Files to Create

| File | Type | Description |
|------|------|-------------|
| `app/analytics/usage/page.tsx` | Server | Usage analytics page |
| `app/analytics/chat/page.tsx` | Server | Chat analytics page |
| `app/analytics/cost/page.tsx` | Server | Cost analytics page |
| `components/analytics/kpi-card.tsx` | Client | Reusable KPI card (value, label, trend, sparkline) |
| `components/analytics/chart-card.tsx` | Client | Reusable chart container with title + filters |
| `components/analytics/date-range-selector.tsx` | Client | Date range filter (7d/30d/90d/custom) |
| `components/analytics/chat-analytics.tsx` | Client | Chat volume, top questions, response quality |
| `components/analytics/usage-analytics.tsx` | Client | API calls, active users, feature adoption |
| `components/analytics/cost-analytics.tsx` | Client | Cost breakdown by provider/model/endpoint |
| `lib/analytics.ts` | Server | Analytics event recording + aggregation helpers |
| `app/api/analytics/chat/route.ts` | API | Chat analytics endpoint |
| `app/api/analytics/usage/route.ts` | API | Usage analytics endpoint |
| `app/api/analytics/cost/route.ts` | API | Cost estimation endpoint |
| `app/api/analytics/export/route.ts` | API | CSV export endpoint |
| `app/api/analytics/events/route.ts` | API | Event recording endpoint |

### Files to Modify

| File | Change |
|------|--------|
| [`components/layout/app-sidebar.tsx`](components/layout/app-sidebar.tsx) | Add "Analytics" collapsible section with Usage, Chat, Cost sub-items |
| [`components/layout/top-nav.tsx`](components/layout/top-nav.tsx) | Add analytics breadcrumb labels |
| [`app/api/chat/route.ts`](app/api/chat/route.ts) | Record analytics event after each chat |
| [`prisma/schema.prisma`](prisma/schema.prisma) | Add AnalyticsEvent model |

### Implementation Steps

1. Add AnalyticsEvent model to Prisma schema
2. Run `npx prisma migrate dev`
3. Create `lib/analytics.ts` helper (event recording, aggregation queries)
4. Add analytics event recording to chat API route
5. Create analytics API endpoints
6. Create chart components (reusable with recharts)
7. Create analytics pages (usage, chat, cost)
8. Update sidebar navigation
9. Build verification

### Key Features

- **Chat Analytics**: Sessions over time, top questions, response quality (with/without sources), session duration distribution
- **Usage Analytics**: API calls over time, feature usage comparison, usage heatmap
- **Cost Analytics**: Estimated cost by provider/model, token distribution, cost trend
- **Date Range**: 7d/30d/90d filter on all analytics pages

### Estimated Scope

- **New files**: ~15
- **Modified files**: ~4
- **New DB models**: 1 (AnalyticsEvent)
- **API endpoints**: 5
- **Build target**: 0 errors

---

## Phase 5: AI Management ✅ DONE

**Goal**: Provide an interactive playground for testing prompts and comparing models, plus a professional prompt management system with versioning.

### Status: COMPLETED

**Report**: [`plans/IMPLEMENTATION_REPORT_PHASE5.md`](plans/IMPLEMENTATION_REPORT_PHASE5.md)

### Design Reference

- [`plans/SAAS_EXPANSION_PLAN.md`](plans/SAAS_EXPANSION_PLAN.md) — Step 6: AI Playground (lines 714-812), Step 7: Prompt Management (lines 815-959)
- [`plans/SAAS_UI_BLUEPRINT.md`](plans/SAAS_UI_BLUEPRINT.md) — Providers (lines 1226-1273), Models (lines 1274-1282), Playground (lines 1291-1388), Prompts (lines 1394-1456), Prompt Editor (lines 1462-1505)

### Dependencies to Install

| Package | Purpose | Version |
|---------|---------|---------|
| `diff` | Text diffing for prompt version comparison | latest |

### shadcn/ui Components to Add

| Component | Purpose |
|-----------|---------|
| `textarea` | System prompt editor |
| `slider` | Temperature, Top-P, Max Tokens controls |
| `switch` | Toggle RAG, streaming |
| `collapsible` | Parameter panels |
| `resizable` | Split pane for compare mode |

### Database Changes

**2 new models:**

```prisma
model PromptTemplate {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(200)
  content     String
  category    String   @default("general") @db.VarChar(50)
  isActive    Boolean  @default(false) @map("is_active")
  version     Int      @default(1)
  createdBy   String?  @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  creator  User?          @relation(fields: [createdBy], references: [id])
  versions PromptVersion[]

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

### API Endpoints to Create

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/playground` | Run playground prompt (streaming) |
| `GET` | `/api/ai/playground/history` | Past playground runs |
| `POST` | `/api/ai/playground/compare` | Run same prompt on multiple models |
| `GET` | `/api/ai/prompts` | List all prompt templates |
| `POST` | `/api/ai/prompts` | Create new prompt template |
| `GET` | `/api/ai/prompts/[id]` | Get prompt detail with versions |
| `PUT` | `/api/ai/prompts/[id]` | Update prompt (creates new version) |
| `DELETE` | `/api/ai/prompts/[id]` | Delete prompt template |
| `GET` | `/api/ai/prompts/[id]/versions` | Get version history |
| `POST` | `/api/ai/prompts/[id]/revert` | Revert to a specific version |
| `POST` | `/api/ai/prompts/[id]/test` | Test prompt in playground |

### Files to Create

| File | Type | Description |
|------|------|-------------|
| `app/ai/playground/page.tsx` | Server | AI Playground page |
| `app/ai/prompts/page.tsx` | Server | Prompt templates list page |
| `app/ai/prompts/[id]/page.tsx` | Server | Prompt editor page |
| `components/ai/playground-editor.tsx` | Client | Playground with system prompt, context, message, params |
| `components/ai/compare-mode.tsx` | Client | Side-by-side model comparison |
| `components/ai/parameter-controls.tsx` | Client | Temperature, Top-P, Max Tokens sliders |
| `components/ai/model-selector.tsx` | Client | Model selection dropdown |
| `components/ai/prompt-list.tsx` | Client | Prompt template list with CRUD |
| `components/ai/prompt-editor.tsx` | Client | Prompt editor with variables panel |
| `components/ai/prompt-version-list.tsx` | Client | Version history with diff view |
| `app/api/ai/playground/route.ts` | API | Playground streaming endpoint |
| `app/api/ai/playground/history/route.ts` | API | Playground history |
| `app/api/ai/playground/compare/route.ts` | API | Compare mode endpoint |
| `app/api/ai/prompts/route.ts` | API | Prompt CRUD |
| `app/api/ai/prompts/[id]/route.ts` | API | Single prompt CRUD |
| `app/api/ai/prompts/[id]/versions/route.ts` | API | Version history |
| `app/api/ai/prompts/[id]/revert/route.ts` | API | Version revert |
| `app/api/ai/prompts/[id]/test/route.ts` | API | Prompt test |

### Files to Modify

| File | Change |
|------|--------|
| [`components/layout/app-sidebar.tsx`](components/layout/app-sidebar.tsx) | Add "AI" collapsible section with Providers, Models, Playground, Prompts |
| [`components/layout/top-nav.tsx`](components/layout/top-nav.tsx) | Add AI breadcrumb labels |
| [`prisma/schema.prisma`](prisma/schema.prisma) | Add PromptTemplate, PromptVersion models |
| [`app/(admin)/settings/page.tsx`](app/(admin)/settings/page.tsx) | May refactor settings to become "AI Providers" page |

### Implementation Steps

1. Add PromptTemplate and PromptVersion models to Prisma schema
2. Run `npx prisma migrate dev`
3. Install `diff` package
4. Add shadcn/ui components: `textarea`, `slider`, `switch`, `collapsible`, `resizable`
5. Create prompt API endpoints (CRUD + versions)
6. Create prompt management pages (list, editor, version history)
7. Create playground API endpoint (streaming, reuse existing RAG pipeline)
8. Create playground page with parameter controls
9. Create compare mode for side-by-side model testing
10. Update sidebar navigation
11. Build verification

### Key Features

- **Playground**: System prompt editor, context panel (RAG or manual), model selection, parameter sliders, streaming response, token/latency stats
- **Compare Mode**: 2-3 columns with independent model/param selection, same prompt
- **Prompt Templates**: CRUD with variable system (`{context}`, `{question}`, `{language}`)
- **Versioning**: Every save creates a version, diff view, revert to previous
- **Testing**: "Test" button opens playground with prompt pre-loaded

### Estimated Scope

- **New files**: ~18
- **Modified files**: ~4
- **New DB models**: 2 (PromptTemplate, PromptVersion)
- **API endpoints**: 11
- **Build target**: 0 errors

---

## Phase 6: Workspace System ⏳ NEXT

**Goal**: Transform Mimotes from single-tenant to multi-tenant. Add workspaces, team members, roles, permissions, and API key management.

### Design Reference

- [`plans/SAAS_EXPANSION_PLAN.md`](plans/SAAS_EXPANSION_PLAN.md) — Step 8: Workspace System (lines 963-1113), Step 9: API Platform (lines 1116-1336)
- [`plans/SAAS_UI_BLUEPRINT.md`](plans/SAAS_UI_BLUEPRINT.md) — Team Members (lines 1528-1610), API Keys (lines 1616-1702), API Docs (lines 1711-1787)

### Dependencies to Install

No new dependencies. Uses existing stack + `zod` (already installed).

### shadcn/ui Components to Add

| Component | Purpose |
|-----------|---------|
| `alert-dialog` | Confirmation dialogs for destructive actions |
| `radio-group` | Role selection |
| `form` | Form validation wrappers |

### Database Changes

**3 new models + modify 4 existing models:**

```prisma
model Workspace {
  id          String   @id @default(uuid())
  name        String   @db.VarChar(200)
  slug        String   @unique @db.VarChar(100)
  plan        String   @default("free") @db.VarChar(50)
  settings    Json?
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
  role        String   @db.VarChar(20)
  createdAt   DateTime @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, userId])
  @@map("workspace_members")
}

model Invitation {
  id          String    @id @default(uuid())
  workspaceId String    @map("workspace_id")
  email       String    @db.VarChar(255)
  role        String    @db.VarChar(20)
  token       String    @unique
  expiresAt   DateTime  @map("expires_at")
  acceptedAt  DateTime? @map("accepted_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@map("invitations")
}
```

**Modified existing models** (add `workspaceId`):
- `Document` → add `workspaceId String` + relation to Workspace
- `ChatSession` → add `workspaceId String?` + relation to Workspace
- `Setting` → add `workspaceId String?` + relation to Workspace
- `AnalyticsEvent` → add `workspaceId String?` + relation to Workspace
- `PromptTemplate` → add `workspaceId String` + relation to Workspace

### API Endpoints to Create

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/workspaces` | Create workspace |
| `GET` | `/api/workspaces` | List user's workspaces |
| `GET` | `/api/workspaces/[id]` | Get workspace detail |
| `PUT` | `/api/workspaces/[id]` | Update workspace |
| `DELETE` | `/api/workspaces/[id]` | Delete workspace (owner only) |
| `GET` | `/api/workspaces/[id]/members` | List members |
| `POST` | `/api/workspaces/[id]/members` | Invite member |
| `PUT` | `/api/workspaces/[id]/members/[uid]` | Change role |
| `DELETE` | `/api/workspaces/[id]/members/[uid]` | Remove member |
| `POST` | `/api/workspaces/[id]/invitations` | Send invitation |
| `GET` | `/api/workspaces/[id]/invitations` | List pending invitations |
| `DELETE` | `/api/workspaces/[id]/invitations/[iid]` | Cancel invitation |
| `POST` | `/api/invitations/[token]/accept` | Accept invitation |

### API Key Models

```prisma
model ApiKey {
  id          String    @id @default(uuid())
  workspaceId String    @map("workspace_id")
  name        String    @db.VarChar(200)
  keyHash     String    @unique @map("key_hash")
  keyPrefix   String    @map("key_prefix") @db.VarChar(20)
  permissions Json?
  rateLimit   Int       @default(100) @map("rate_limit")
  isActive    Boolean   @default(true) @map("is_active")
  lastUsedAt  DateTime? @map("last_used_at")
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime  @default(now()) @map("created_at")

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
  duration   Int
  tokens     Int?
  createdAt  DateTime @default(now()) @map("created_at")

  apiKey ApiKey @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)

  @@index([apiKeyId, createdAt])
  @@map("api_key_usage")
}
```

### API Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/workspaces/[id]/api-keys` | List API keys |
| `POST` | `/api/workspaces/[id]/api-keys` | Create API key |
| `DELETE` | `/api/workspaces/[id]/api-keys/[kid]` | Revoke API key |
| `POST` | `/api/workspaces/[id]/api-keys/[kid]/rotate` | Rotate API key |

### Files to Create

| File | Type | Description |
|------|------|-------------|
| `app/workspace/settings/page.tsx` | Server | Workspace settings page |
| `app/workspace/members/page.tsx` | Server | Team members page |
| `app/workspace/api-keys/page.tsx` | Server | API key management page |
| `components/workspace/member-table.tsx` | Client | Member list with role management |
| `components/workspace/invite-modal.tsx` | Client | Invite member modal |
| `components/workspace/role-selector.tsx` | Client | Role selection dropdown |
| `components/workspace/api-key-table.tsx` | Client | API key list with actions |
| `components/workspace/create-key-modal.tsx` | Client | Create API key modal |
| `components/workspace/workspace-settings-form.tsx` | Client | Workspace settings form |
| `lib/workspace.ts` | Server | Workspace helper (get current workspace, permission checks) |
| `lib/api-key.ts` | Server | API key helpers (generate, hash, verify) |
| `app/api/workspaces/route.ts` | API | Workspace CRUD |
| `app/api/workspaces/[id]/route.ts` | API | Single workspace |
| `app/api/workspaces/[id]/members/route.ts` | API | Members |
| `app/api/workspaces/[id]/members/[uid]/route.ts` | API | Single member |
| `app/api/workspaces/[id]/invitations/route.ts` | API | Invitations |
| `app/api/workspaces/[id]/invitations/[iid]/route.ts` | API | Single invitation |
| `app/api/invitations/[token]/accept/route.ts` | API | Accept invitation |
| `app/api/workspaces/[id]/api-keys/route.ts` | API | API keys |
| `app/api/workspaces/[id]/api-keys/[kid]/route.ts` | API | Single API key |

### Files to Modify

| File | Change |
|------|--------|
| [`components/layout/app-sidebar.tsx`](components/layout/app-sidebar.tsx) | Add "Workspace" section with Members, API Keys; add workspace switcher at top |
| [`components/layout/top-nav.tsx`](components/layout/top-nav.tsx) | Add workspace breadcrumb labels |
| [`prisma/schema.prisma`](prisma/schema.prisma) | Add 5 new models, modify 4 existing models |
| [`lib/auth.ts`](lib/auth.ts) | Add workspace context to JWT/session |
| [`app/api/documents/route.ts`](app/api/documents/route.ts) | Add workspace filtering |
| [`app/api/chat/route.ts`](app/api/chat/route.ts) | Add workspace context |
| [`app/api/upload/route.ts`](app/api/upload/route.ts) | Add workspace context |
| [`components/layout/dashboard-shell.tsx`](components/layout/dashboard-shell.tsx) | Pass workspace context to client |

### Migration Strategy

1. Create default workspace for existing admin user
2. Backfill `workspaceId` on all existing Documents, ChatSessions, Settings
3. Make `workspaceId` required (NOT NULL) after backfill
4. Preserve existing URLs — all `/documents`, `/chat`, `/settings` continue to work
5. New workspace-scoped routes under `/workspace/*`

### Implementation Steps

1. Add Workspace, WorkspaceMember, Invitation, ApiKey, ApiKeyUsage models
2. Modify existing models to add workspaceId (nullable first)
3. Run `npx prisma migrate dev`
4. Create migration script: default workspace + backfill
5. Create workspace API endpoints
6. Create workspace pages (settings, members, API keys)
7. Create workspace helper library
8. Update auth to include workspace context
9. Add workspace filtering to existing API routes
10. Update sidebar with workspace section
11. Build verification

### Roles and Permissions

| Permission | Owner | Admin | Editor | Viewer |
|------------|-------|-------|--------|--------|
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Update workspace settings | ✅ | ✅ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Upload documents | ✅ | ✅ | ✅ | ❌ |
| Delete documents | ✅ | ✅ | ✅ | ❌ |
| View documents | ✅ | ✅ | ✅ | ✅ |
| Configure AI | ✅ | ✅ | ❌ | ❌ |
| Manage prompts | ✅ | ✅ | ✅ | ❌ |
| Create API keys | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ |

### Estimated Scope

- **New files**: ~20
- **Modified files**: ~8
- **New DB models**: 5 (Workspace, WorkspaceMember, Invitation, ApiKey, ApiKeyUsage)
- **Modified DB models**: 4 (Document, ChatSession, Setting, AnalyticsEvent)
- **API endpoints**: ~17
- **Build target**: 0 errors

---

## Phase 7: Public Widget

**Goal**: Allow workspace owners to embed a Mimotes chatbot on their website via a lightweight JavaScript widget.

### Design Reference

- [`plans/SAAS_EXPANSION_PLAN.md`](plans/SAAS_EXPANSION_PLAN.md) — Step 10: Public Chat Widget (lines 1339-1491)
- [`plans/SAAS_UI_BLUEPRINT.md`](plans/SAAS_UI_BLUEPRINT.md) — Widget Settings (lines 1799-1855), Widget Preview (lines 1856-1864)

### Dependencies to Install

No new dependencies for the API. The widget JS is a standalone bundle.

### Database Changes

**No new models.** Uses existing `ApiKey` and `Workspace` from Phase 6.

Workspace settings JSON field stores widget configuration:

```json
{
  "widget": {
    "theme": "light",
    "position": "bottom-right",
    "primaryColor": "#3b82f6",
    "greeting": "Hi! How can I help you?",
    "placeholder": "Type your question...",
    "showSources": true,
    "allowFileUpload": false,
    "width": 400,
    "height": 600,
    "showBranding": true
  }
}
```

### API Endpoints to Create

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/widget/config` | Get widget configuration for workspace |
| `POST` | `/api/widget/chat` | Chat endpoint for widget (streaming) |
| `POST` | `/api/widget/analytics` | Track widget events |
| `GET` | `/widget.js` | Serve widget script |

### Files to Create

| File | Type | Description |
|------|------|-------------|
| `app/workspace/settings/widget/page.tsx` | Server | Widget settings page |
| `components/workspace/widget-settings-form.tsx` | Client | Widget configuration form |
| `components/workspace/widget-preview.tsx` | Client | Live widget preview |
| `components/workspace/widget-analytics.tsx` | Client | Widget usage stats |
| `public/widget.js` | Static | Lightweight widget script (<50KB) |
| `app/api/widget/config/route.ts` | API | Widget config endpoint |
| `app/api/widget/chat/route.ts` | API | Widget chat endpoint |
| `app/api/widget/analytics/route.ts` | API | Widget analytics endpoint |
| `lib/widget.ts` | Server | Widget helpers (config, analytics) |

### Files to Modify

| File | Change |
|------|--------|
| [`components/layout/app-sidebar.tsx`](components/layout/app-sidebar.tsx) | Add "Widget" link under Workspace section |
| [`components/layout/top-nav.tsx`](components/layout/top-nav.tsx) | Add widget breadcrumb labels |
| [`next.config.ts`](next.config.ts) | Add `/widget.js` route to serve static file |

### Implementation Steps

1. Create widget settings page with configuration form
2. Create widget preview component (live preview of embedded widget)
3. Create widget API endpoints (config, chat, analytics)
4. Build standalone widget.js script (vanilla JS, no framework)
5. Widget script: creates shadow DOM/iframe, renders chat UI, connects to API
6. Add widget analytics tracking
7. Update sidebar navigation
8. Build verification

### Widget Script Architecture

```
widget.js (<50KB)
├── Parse data-* attributes from script tag
├── Fetch widget config from /api/widget/config
├── Create shadow DOM container
├── Render chat UI (HTML + CSS, no framework)
├── Event listeners (open/close, send message, scroll)
├── Streaming response handler (fetch + ReadableStream)
└── Analytics events (load, open, message, close)
```

### Widget Configuration Options

| Setting | Options | Default |
|---------|---------|---------|
| Theme | light, dark, auto | light |
| Position | bottom-right, bottom-left | bottom-right |
| Primary Color | Any hex color | #3b82f6 |
| Greeting | Custom text | "Hi! How can I help you?" |
| Placeholder | Input placeholder | "Type your question..." |
| Show Sources | true/false | true |
| Allow File Upload | true/false | false |
| Width | 360-480px | 400px |
| Height | 500-700px | 600px |
| Branding | Show/hide "Powered by Mimotes" | show |

### Estimated Scope

- **New files**: ~9
- **Modified files**: ~3
- **API endpoints**: 4
- **Build target**: 0 errors

---

## Appendix A: Technology Stack Additions

| Package | Purpose | Phase | Already Installed? |
|---------|---------|-------|-------------------|
| `lucide-react` | Icons | 1 | ✅ |
| `shadcn/ui` (multiple) | UI components | 1+ | ✅ (partial) |
| `recharts` | Charts | 2 | ❌ |
| `next-themes` | Dark mode | 2 | ❌ |
| `diff` | Text diffing | 5 | ❌ |
| `zod` | Validation | 6 | ✅ |

## Appendix B: New shadcn/ui Components by Phase

| Phase | Components to Add |
|-------|-------------------|
| 2 | card, skeleton, select, badge, tabs |
| 3 | input, table, dialog, pagination |
| 4 | chart (recharts wrapper) |
| 5 | textarea, slider, switch, collapsible, resizable |
| 6 | alert-dialog, radio-group, form |
| 7 | — (uses existing components) |

## Appendix C: URL Structure (Final State)

```
/                                    → Landing page (public)
/login                               → Login
/register                            → Register

/dashboard                           → Dashboard with widgets
/chat                                → Chat interface
/chat/[sessionId]                    → Specific chat session

/knowledge/documents                 → Document explorer
/knowledge/documents/[id]            → Document detail + chunks
/knowledge/chunks                    → Chunk explorer
/knowledge/search                    → Similarity search
/knowledge/sources                   → Source viewer

/analytics/usage                     → Usage analytics
/analytics/chat                      → Chat analytics
/analytics/cost                      → AI cost analytics

/ai/providers                        → AI provider management (existing settings)
/ai/models                           → Model registry
/ai/playground                       → AI Playground
/ai/prompts                          → Prompt management
/ai/prompts/[id]                     → Prompt editor

/workspace/settings                  → Workspace settings
/workspace/members                   → Team members
/workspace/api-keys                  → API key management
/workspace/settings/widget           → Widget settings

/settings                            → Global settings (legacy, may redirect)
/docs                                → API documentation
```

## Appendix D: Total Scope Summary

| Metric | Count |
|--------|-------|
| New database models | 8 (AnalyticsEvent, PromptTemplate, PromptVersion, Workspace, WorkspaceMember, Invitation, ApiKey, ApiKeyUsage) |
| Modified database models | 4 (Document, ChatSession, Setting, User) |
| New API endpoints | ~45 |
| New pages | ~18 |
| New components | ~40 |
| New dependencies | 3 (recharts, next-themes, diff) |
| New shadcn/ui components | ~15 |
| Total new files | ~58 |
| Total modified files | ~27 |

---

## Appendix E: Design Decisions

### 1. Features Before Multi-Tenancy

Phases 2-5 build all features using single-tenant architecture. Phase 6 adds workspace scoping. This approach:
- **Pro**: Features can be tested immediately without workspace complexity
- **Pro**: Incremental complexity — each phase is manageable
- **Con**: Phase 6 requires modifying all existing queries to add workspace filtering
- **Mitigation**: Use helper functions (`getWorkspaceId()`) to centralize workspace context

### 2. shadcn/ui v4 with @base-ui/react

shadcn/ui v4 uses `@base-ui/react` primitives (NOT Radix UI). Key differences:
- Uses `render` prop instead of `asChild`
- Component APIs differ from Radix-based shadcn
- TooltipProvider uses `delay` not `delayDuration`

### 3. Recharts for Charts

Chosen over `@tremor/react` because:
- Lighter weight, more flexible
- Better React 19 compatibility
- More chart types available
- Easier to customize

### 4. Analytics Event Model

Using a single `AnalyticsEvent` model with `eventType` discriminator + `metadata` JSON instead of separate tables per event type. This:
- **Pro**: Simple schema, easy to add new event types
- **Pro**: Single query for cross-event analytics
- **Con**: Less type safety on metadata
- **Mitigation**: TypeScript interfaces for each event type's metadata

### 5. Widget as Vanilla JS

The widget script (`widget.js`) is built with vanilla JavaScript (no React/framework) because:
- Must be lightweight (<50KB)
- Must work on any website without conflicts
- Shadow DOM prevents style leakage
- No dependency on host page's framework version
