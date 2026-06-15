# SAAS_UI_BLUEPRINT.md — Complete UI/UX Design Specification

> Detailed page-by-page design blueprint for transforming Mimotes into a premium AI SaaS platform. Every page includes layout, sections, components, states, responsive behavior, and user flows. Design inspiration: ChatGPT Team, Claude Projects, Perplexity Pro, Notion, Linear, Vercel.

---

## Design System Foundation

### Visual Language

| Token | Value | Inspiration |
|-------|-------|-------------|
| **Font Family** | Inter (body), Geist Mono (code) | Vercel |
| **Border Radius** | 8px (cards), 6px (inputs), 12px (modals) | Linear |
| **Shadows** | sm: `0 1px 2px rgba(0,0,0,0.05)`, md: `0 4px 6px rgba(0,0,0,0.07)`, lg: `0 10px 15px rgba(0,0,0,0.1)` | Vercel |
| **Spacing** | 4px base unit, 8/12/16/20/24/32/40/48/64 | Notion |
| **Border Color** | `border-gray-200` (light), `border-gray-800` (dark) | Linear |
| **Background** | `bg-gray-50` (page), `bg-white` (cards), `bg-gray-100` (sidebar) | Vercel |
| **Accent Color** | `blue-600` primary, `blue-50` hover bg, `blue-100` active bg | ChatGPT |
| **Text Colors** | `gray-900` (heading), `gray-700` (body), `gray-500` (secondary), `gray-400` (placeholder) | Linear |
| **Status Colors** | green-500 (success), red-500 (error), yellow-500 (warning), blue-500 (info) | Standard |
| **Transitions** | `transition-all duration-150 ease-in-out` | Linear |

### Color Palette

```
Light Mode:
  Page Background:    #f9fafb (gray-50)
  Card Background:    #ffffff (white)
  Sidebar Background: #f9fafb (gray-50) with subtle border
  Sidebar Active:     #eff6ff (blue-50) with blue-600 text
  Primary Action:     #2563eb (blue-600)
  Primary Hover:      #1d4ed8 (blue-700)
  Destructive:        #dc2626 (red-600)
  Success:            #16a34a (green-600)
  Warning:            #d97706 (amber-600)

Dark Mode:
  Page Background:    #111827 (gray-900)
  Card Background:    #1f2937 (gray-800)
  Sidebar Background: #111827 (gray-900) with gray-700 border
  Sidebar Active:     #1e3a5f (blue-900/40) with blue-400 text
  Primary Action:     #3b82f6 (blue-500)
  Primary Hover:      #2563eb (blue-600)
  Border:             #374151 (gray-700)
  Text:               #f9fafb (gray-50) heading, #d1d5db (gray-300) body
```

### Typography Scale

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| Page Title (h1) | 24px / 1.5rem | 700 | 1.3 | -0.02em |
| Section Title (h2) | 18px / 1.125rem | 600 | 1.4 | -0.01em |
| Subsection (h3) | 14px / 0.875rem | 600 | 1.5 | 0 |
| Body | 14px / 0.875rem | 400 | 1.6 | 0 |
| Small / Caption | 12px / 0.75rem | 400 | 1.5 | 0 |
| Stat Number | 30px / 1.875rem | 700 | 1.2 | -0.02em |
| Stat Label | 12px / 0.75rem | 500 | 1.5 | 0.02em (uppercase) |
| Code | 13px / 0.8125rem | 400 | 1.6 | 0 |
| Sidebar Item | 14px / 0.875rem | 500 | 1.4 | 0 |
| Sidebar Section | 11px / 0.6875rem | 600 | 1.4 | 0.05em (uppercase) |

### Spacing System

```
Component Padding:    16px (default), 20px (large cards), 24px (page sections)
Section Gap:          24px between major sections
Card Gap:             16px between cards in grid
Inline Gap:           8px between inline elements
Page Padding:         24px mobile, 32px tablet, 48px desktop
```

---

## Page 1: Dashboard Layout Shell

### Purpose
The shared layout wrapper for all authenticated pages. Contains sidebar navigation, top bar, and content area.

### Design Inspiration
Linear (sidebar), Vercel (top bar), Notion (collapsible sections)

### Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────────────────────────────────────────────┐│
│ │             │ │ Top Bar                                             ││
│ │  Sidebar    │ │ ┌─────────────────────────────────────┐ ┌─────────┐││
│ │  260px      │ │ │ 🏠 Dashboard > Documents            │ │ 🔔  👤  │││
│ │  fixed      │ │ │ Breadcrumb path                     │ │ [avatar]│││
│ │             │ │ └─────────────────────────────────────┘ └─────────┘││
│ │ ┌─────────┐ │ ├─────────────────────────────────────────────────────┤│
│ │ │🤖 Mimotes│ │ │                                                     ││
│ │ │─────────│ │ │                                                     ││
│ │ │🏠 Dash  │ │ │                                                     ││
│ │ │💬 Chat  │ │ │           Content Area                              ││
│ │ │         │ │ │           scrollable, max-w-7xl                     ││
│ │ │📚 KNOWL │ │ │                                                     ││
│ │ │ 📄 Docs │ │ │                                                     ││
│ │ │ 🧩 Chunks│ │ │                                                     ││
│ │ │ 🔍 Search│ │ │                                                     ││
│ │ │ 📎 Source│ │ │                                                     ││
│ │ │         │ │ │                                                     ││
│ │ │📊 ANALYT│ │ │                                                     ││
│ │ │ 📈 Usage │ │ │                                                     ││
│ │ │ 💬 Chat  │ │ │                                                     ││
│ │ │ 💰 Cost  │ │ │                                                     ││
│ │ │         │ │ │                                                     ││
│ │ │🤖 AI    │ │ │                                                     ││
│ │ │ 🔌 Prov │ │ │                                                     ││
│ │ │ 🧠 Model│ │ │                                                     ││
│ │ │ 🎮 Play │ │ │                                                     ││
│ │ │ 📝 Prompt│ │ │                                                     ││
│ │ │         │ │ │                                                     ││
│ │ │👥 WORKSP│ │ │                                                     ││
│ │ │ 👤 Team │ │ │                                                     ││
│ │ │ 🔑 Keys │ │ │                                                     ││
│ │ │─────────│ │ │                                                     ││
│ │ │⚙ Settings│ │ │                                                     ││
│ │ │📖 Docs  │ │ │                                                     ││
│ │ │─────────│ │ │                                                     ││
│ │ │[avatar] │ │ │                                                     ││
│ │ │ John Doe│ │ │                                                     ││
│ │ │ ↗ Logout│ │ │                                                     ││
│ │ └─────────┘ │ └─────────────────────────────────────────────────────┘│
│ └─────────────┘                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Sidebar Sections

| Section | Collapsible | Default State | Behavior |
|---------|------------|---------------|----------|
| **Logo + Workspace Switcher** | No | Always visible | Workspace dropdown at top |
| **Primary Nav** (Dashboard, Chat) | No | Always visible | Single click navigates |
| **Knowledge Base** | Yes | Expanded | Expand/collapse with chevron |
| **Analytics** | Yes | Expanded | Expand/collapse with chevron |
| **AI** | Yes | Expanded | Expand/collapse with chevron |
| **Workspace** | Yes | Expanded | Expand/collapse with chevron |
| **Bottom** (Settings, Docs) | No | Always visible | Fixed at bottom |
| **User Profile** | No | Always visible | Avatar + name + logout |

### Sidebar — Collapsed State (≤1280px or manual toggle)

```
┌─────┐
│ 🤖  │
│─────│
│ 🏠  │
│ 💬  │
│     │
│ 📚 ▸│
│ 📊 ▸│
│ 🤖 ▸│
│ 👥 ▸│
│─────│
│ ⚙  │
│ 📖  │
│─────│
│ 👤  │
└─────┘
```

Hovering an icon shows a tooltip with the section name. Hovering a section group expands it as a flyout submenu (like Linear's collapsed sidebar).

### Mobile Layout (<768px)

```
┌─────────────────────┐
│ ☰  🤖 Mimotes   👤  │  ← Top bar with hamburger + logo + avatar
├─────────────────────┤
│                     │
│  Breadcrumb         │
│                     │
│  ┌─────────────────┐│
│  │                 ││
│  │   Content       ││
│  │   Area          ││
│  │                 ││
│  │                 ││
│  └─────────────────┘│
└─────────────────────┘

Sidebar: Overlay from left with backdrop (like ChatGPT mobile)
```

### Components

| Component | Type | Description |
|-----------|------|-------------|
| `DashboardLayout` | Server Component | Wraps all dashboard pages, provides sidebar + topbar |
| `Sidebar` | Client Component | Navigation sidebar with expand/collapse, active states |
| `TopBar` | Client Component | Breadcrumbs + action buttons + notifications + avatar |
| `WorkspaceSwitcher` | Client Component | Dropdown to switch between workspaces |
| `Breadcrumb` | Server Component | Dynamic breadcrumb from current route |
| `MobileSidebar` | Client Component | Overlay sidebar for mobile |
| `UserMenu` | Client Component | Dropdown with profile, settings, logout |

### Loading State
- Sidebar: Always rendered immediately (static navigation)
- Content area: Shows skeleton placeholder matching the current page's layout

### User Flow
1. User logs in → Redirected to `/dashboard`
2. Sidebar highlights "Dashboard" as active
3. User clicks any nav item → Content area transitions (smooth page navigation)
4. On mobile: hamburger → sidebar slides in from left → tap item → sidebar closes → content loads

---

## Page 2: Dashboard (Widgets)

### Purpose
At-a-glance overview of the entire workspace. First thing users see after login.

### Design Inspiration
Vercel Dashboard (stat cards), Linear (clean metrics), Notion (widget grid)

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                              [30d ▼]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Welcome back, John 👋                                  │   │
│  │  Here is what is happening with your knowledge base.    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │ 📄     │ │ 🧩     │ │ 💬     │ │ ❓     │                  │
│  │ 24     │ │ 1,847  │ │ 156    │ │ 42     │                  │
│  │Documents│ │ Chunks │ │ Chats  │ │Questions│                  │
│  │ +3 ↑12%│ │+234↑15%│ │ +12 ↑8%│ │ +5 ↑14%│                  │
│  └────────┘ └────────┘ └────────┘ └────────┘                  │
│                                                                 │
│  ┌──────────────────────────────────┐ ┌──────────────────────┐ │
│  │  📈 Questions Over Time          │ │  🤖 AI Provider      │ │
│  │                                  │ │     Usage            │ │
│  │  ┌────────────────────────────┐  │ │                      │ │
│  │  │     ╱╲                     │  │ │  ██████████ OpenAI   │ │
│  │  │    ╱  ╲     ╱╲            │  │ │  █████      Mimo Pro │ │
│  │  │   ╱    ╲   ╱  ╲  ╱       │  │ │  ██          Ollama  │ │
│  │  │  ╱      ╲─╱    ╲╱        │  │ │                      │ │
│  │  │─╱                        │  │ │  Total: 156 chats    │ │
│  │  └────────────────────────────┘  │ │  This month: 42      │ │
│  │  Jun  Jul  Aug  Sep  Oct  Nov    │ │                      │ │
│  └──────────────────────────────────┘ └──────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────┐ ┌──────────────────────┐ │
│  │  📄 Most Used Documents          │ │  💰 Cost Estimation  │ │
│  │                                  │ │                      │ │
│  │  1. product-manual.pdf           │ │  Tokens This Month:  │ │
│  │     ████████████████  89 refs    │ │  ┌────────────────┐  │ │
│  │  2. faq.xlsx                     │ │  │ Input:  125,400│  │ │
│  │     █████████  56 refs           │ │  │ Output:  48,200│  │ │
│  │  3. company-policy.docx          │ │  │ Total:  173,600│  │ │
│  │     ███████  42 refs             │ │  └────────────────┘  │ │
│  │  4. technical-spec.pdf           │ │                      │ │
│  │     █████  28 refs               │ │  Estimated Cost:     │ │
│  │  5. api-docs.txt                 │ │  $2.47 this month    │ │
│  │     ███  15 refs                 │ │  $18.30 all time     │ │
│  └──────────────────────────────────┘ └──────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💬 Recent Chats                                        │   │
│  │                                                         │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ "Apa fitur utama produk?"       2 min ago    [→]  │  │   │
│  │  │ "Bagaimana cara setup?"         15 min ago   [→]  │  │   │
│  │  │ "Jelaskan pricing model"        1 hour ago   [→]  │  │   │
│  │  │ "Dokumen apa saja yang ada?"    3 hours ago  [→]  │  │   │
│  │  │ "Apa kelebihan dibanding X?"    5 hours ago  [→]  │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │                                                         │   │
│  │  [View All Chats →]                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────┐ ┌──────────────────────┐ │
│  │  📊 Knowledge Base Stats         │ │  ⚡ System Health    │ │
│  │                                  │ │                      │ │
│  │  Total Size:   45.2 MB           │ │  AI Provider: ✅     │ │
│  │  Avg Chunk:    487 chars         │ │  Database:    ✅     │ │
│  │  Embeddings:   1,847 vectors     │ │  Vector Store:✅     │ │
│  │  File Types:                      │ │  Uptime:     99.8%  │ │
│  │    📕 PDF (12)                    │ │                      │ │
│  │    📗 DOCX (5)                    │ │  Last Error: None    │ │
│  │    📘 XLSX (3)                    │ │  Response:   230ms   │ │
│  │    📙 TXT (2)                     │ │                      │ │
│  │    🌐 URL (2)                     │ │                      │ │
│  └──────────────────────────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Grid System

| Breakpoint | Layout |
|------------|--------|
| Desktop (≥1280px) | 4-column stat cards, 2-column widget grid below |
| Tablet (768-1279px) | 2-column stat cards, 1-column widgets |
| Mobile (<768px) | 2-column stat cards (compact), 1-column everything |

### Widget Components

| Widget | Component | Data Source | Interaction |
|--------|-----------|------------|-------------|
| Stat Card | `StatCard` | `/api/dashboard/stats` | Click → navigates to detail page |
| Questions Chart | `UsageChart` (recharts AreaChart) | `/api/dashboard/usage` | Hover tooltip, date range selector |
| Provider Pie | `ProviderChart` (recharts PieChart) | `/api/dashboard/stats` | Hover shows percentage |
| Top Documents | `TopDocumentsList` | `/api/dashboard/top-documents` | Click → document detail |
| Cost Summary | `CostSummaryCard` | `/api/dashboard/cost` | Date range filter |
| Recent Chats | `RecentChatsList` | `/api/dashboard/recent-chats` | Click → chat session |
| KB Stats | `KnowledgeBaseStats` | `/api/dashboard/stats` | Display only |
| System Health | `HealthStatusCard` | `/api/dashboard/health` | Polling every 30s |

### Empty State (No Data)

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                    📄                                   │   │
│  │                                                         │   │
│  │          Welcome to Mimotes!                            │   │
│  │                                                         │   │
│  │   Get started by uploading your first document.         │   │
│  │   The AI will learn from your documents and answer      │   │
│  │   questions based on their content.                     │   │
│  │                                                         │   │
│  │          [Upload Document]  [Learn More]                │   │
│  │                                                         │   │
│  │   ── Quick Start ──────────────────────────────         │   │
│  │                                                         │   │
│  │   1. 📄 Upload documents (PDF, DOCX, TXT, etc.)        │   │
│  │   2. ⏳ Wait for processing to complete                 │   │
│  │   3. 💬 Start asking questions in Chat                  │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Loading State

Each widget shows its own skeleton independently:

```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │
│ ░░ 24 ░ │ │ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │
│ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │
│ ░ +3 ░░ │ │ ░░░░░░ │ │ ░░░░░░ │ │ ░░░░░░ │
└────────┘ └────────┘ └────────┘ └────────┘

┌──────────────────────────────────┐ ┌──────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │  ░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │  ░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │  ░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │  ░░░░░░░░░░░░░░░░░  │
└──────────────────────────────────┘ └──────────────────────┘
```

### Mobile Layout

```
┌─────────────────────┐
│ ☰  Dashboard    👤  │
├─────────────────────┤
│  Welcome back 👋    │
│                     │
│ ┌────────┐┌────────┐│
│ │ 📄 24  ││ 🧩 1.8k││
│ │Docs +3 ││Chk+234 ││
│ └────────┘└────────┘│
│ ┌────────┐┌────────┐│
│ │ 💬 156 ││ ❓ 42  ││
│ │Chat +12││Qst +5  ││
│ └────────┘└────────┘│
│                     │
│ ┌───────────────────┐│
│ │ 📈 Usage Chart   ││
│ │ (full width)      ││
│ └───────────────────┘│
│                     │
│ ┌───────────────────┐│
│ │ 💬 Recent Chats  ││
│ │ (full width)      ││
│ └───────────────────┘│
│                     │
│ ┌───────────────────┐│
│ │ 💰 Cost Summary  ││
│ │ (full width)      ││
│ └───────────────────┘│
│                     │
│ ... (stacked)       │
└─────────────────────┘
```

### User Flow
1. User logs in → Sees dashboard with all widgets populated
2. Clicks stat card → Navigates to relevant page (Documents, Chunks, Chat, Analytics)
3. Clicks recent chat → Navigates to chat session with messages loaded
4. Changes date range → All widgets refresh with new data
5. On empty workspace → Sees guided empty state with upload CTA

---

## Page 3: Chat

### Purpose
The primary chat interface. Users ask questions and receive AI-powered answers based on their knowledge base.

### Design Inspiration
ChatGPT (layout), Claude (message design), Perplexity (source citations)

### Desktop Layout

```
┌─────────┬───────────────────────────────────────────────────────┐
│         │  Chat                                    [New Chat]    │
│ Session ├───────────────────────────────────────────────────────┤
│ List    │                                                       │
│         │  ┌─────────────────────────────────────────────────┐  │
│ ┌─────┐ │  │                                                 │  │
│ │+ New│ │  │           💬 Welcome to Mimotes                 │  │
│ │─────│ │  │                                                 │  │
│ │●Apa │ │  │           Ask me anything about your            │  │
│ │fitur│ │  │           documents. I will search through      │  │
│ │─────│ │  │           your knowledge base and provide       │  │
│ │ Cara│ │  │           accurate answers with sources.        │  │
│ │set  │ │  │                                                 │  │
│ │─────│ │  │           ┌──────────┐ ┌──────────┐            │  │
│ │Harga│ │  │           │ 💡 Apa   │ │ 💡 Bagai │            │  │
│ │     │ │  │           │ ringkasan│ │ cara     │            │  │
│ │─────│ │  │           │ dokumen? │ │ setup?   │            │  │
│ │Doku-│ │  │           └──────────┘ └──────────┘            │  │
│ │men  │ │  │           ┌──────────┐ ┌──────────┐            │  │
│ │apa? │ │  │           │ 💡 Apa   │ │ 💡 Jelaskan│           │  │
│ │     │ │  │           │poin utama│ │ pricing? │            │  │
│ └─────┘ │  │           └──────────┘ └──────────┘            │  │
│         │  └─────────────────────────────────────────────────┘  │
│         │                                                       │
│         │  ── Conversation ──────────────────────────────────── │
│         │                                                       │
│         │  ┌─────────────────────────────────────────────────┐  │
│         │  │ 👤 User                          2:30 PM        │  │
│         │  │                                                 │  │
│         │  │ Apa fitur utama dari produk ini?                 │  │
│         │  └─────────────────────────────────────────────────┘  │
│         │                                                       │
│         │  ┌─────────────────────────────────────────────────┐  │
│         │  │ 🤖 Assistant                      2:30 PM  [📋] │  │
│         │  │                                                 │  │
│         │  │ Berdasarkan dokumen yang tersedia, berikut      │  │
│         │  │ adalah fitur utama produk ini:                  │  │
│         │  │                                                 │  │
│         │  │ **1. Chatbot AI Berbasis Pengetahuan** [1]      │  │
│         │  │ Produk ini menggunakan teknologi RAG            │  │
│         │  │ (Retrieval-Augmented Generation)...             │  │
│         │  │                                                 │  │
│         │  │ **2. Multi-AI Provider** [2]                    │  │
│         │  │ Mendukung berbagai AI provider seperti          │  │
│         │  │ OpenAI, Mimo Pro, LM Studio...                  │  │
│         │  │                                                 │  │
│         │  │ ── Sources ─────────────────────────            │  │
│         │  │ ┌─────────────┐ ┌─────────────┐                │  │
│         │  │ │📄 product   │ │📄 faq.xlsx  │                │  │
│         │  │ │manual.pdf   │ │92% match    │                │  │
│         │  │ │95% match    │ │[View]       │                │  │
│         │  │ │[View]       │ │             │                │  │
│         │  │ └─────────────┘ └─────────────┘                │  │
│         │  └─────────────────────────────────────────────────┘  │
│         │                                                       │
│         │  ┌─────────────────────────────────────────────┐      │
│         │  │ ┌─────────────────────────────────────┐ [➤] │      │
│         │  │ │ Ketik pesan... (Enter untuk kirim,  │      │      │
│         │  │ │ Shift+Enter untuk baris baru)        │      │      │
│         │  │ │                                     │      │      │
│         │  │ └─────────────────────────────────────┘      │      │
│         │  └─────────────────────────────────────────────┘      │
└─────────┴───────────────────────────────────────────────────────┘
```

### Sections

| Section | Position | Content |
|---------|----------|---------|
| **Session Sidebar** | Left, 280px | Session list, new chat button, search, delete |
| **Chat Header** | Top of content | Session title, new chat button |
| **Welcome State** | Center (empty chat) | Welcome message, suggested questions |
| **Message Stream** | Scrollable center | User + assistant messages with sources |
| **Input Bar** | Bottom, sticky | Textarea + send button |

### Components

| Component | Description |
|-----------|-------------|
| `ChatPage` | Server component, renders ChatWindow |
| `SessionSidebar` | Client, session list with CRUD |
| `ChatWindow` | Client, main chat logic + streaming |
| `MessageBubble` | Client, renders message with markdown + copy |
| `SourceCard` | Client, source reference card |
| `SuggestedQuestions` | Client, 4 clickable suggestion cards |
| `StreamingIndicator` | Client, blinking cursor during streaming |

### Message States

| State | Visual |
|-------|--------|
| **User message** | Right-aligned, blue background, white text (or left-aligned gray like Claude) |
| **Assistant message** | Left-aligned, white background, markdown rendered, copy button on hover |
| **Streaming** | Assistant bubble with blinking cursor `▊` at the end, partial markdown rendered |
| **Error** | Red-tinted bubble with error message + retry button |
| **Loading** | Pulsing dots animation `● ● ●` |

### Empty State (Welcome Screen)

The welcome screen shows when no messages exist in the current session:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    🤖                                   │
│                                                         │
│            Welcome to Mimotes                           │
│                                                         │
│     Ask me anything about your documents.               │
│     I will search through your knowledge base           │
│     and provide accurate answers with sources.          │
│                                                         │
│     ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│     │ 💡 Apa     │ │ 💡 Bagai-  │ │ 💡 Apa     │       │
│     │ ringkasan  │ │ mana cara  │ │ poin-poin  │       │
│     │ dokumen    │ │ menggunakan│ │ utama dalam│       │
│     │ yang ada?  │ │ produk ini?│ │ dokumen?   │       │
│     └────────────┘ └────────────┘ └────────────┘       │
│     ┌────────────┐                                      │
│     │ 💡 Apa     │                                      │
│     │ perbedaan  │                                      │
│     │ dengan     │                                      │
│     │ kompetitor?│                                      │
│     └────────────┘                                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Suggested questions are dynamically generated based on available documents (or static defaults if no documents exist).

### Loading State
- Session list: 3 skeleton rows with pulse animation
- Messages: Skeleton message bubbles (2-3) with pulse
- Streaming: Blinking cursor at the end of the current message

### Mobile Layout

```
┌─────────────────────┐
│ ☰  Chat        ➕   │  ← hamburger opens session sidebar as overlay
├─────────────────────┤
│                     │
│  ┌─────────────────┐│
│  │ 👤 User         ││
│  │                 ││
│  │ Apa fitur       ││
│  │ utama?          ││
│  └─────────────────┘│
│                     │
│  ┌─────────────────┐│
│  │ 🤖 Assistant  📋││  ← copy button always visible on mobile
│  │                 ││
│  │ Berdasarkan     ││
│  │ dokumen...      ││
│  │                 ││
│  │ Sources:        ││
│  │ [📄 manual] [📄]││  ← horizontal scroll for sources
│  └─────────────────┘│
│                     │
│  ┌─────────────────┐│
│  │ ┌─────────────┐ ││
│  │ │ Ketik pesan │ ││  ← full width textarea
│  │ └─────────────┘ ││
│  │              [➤] ││
│  └─────────────────┘│
└─────────────────────┘
```

### User Flow
1. User opens `/chat` → Sees welcome screen with suggested questions
2. Clicks suggested question or types own → Message sent, streaming begins
3. AI responds with markdown + sources → User reads, clicks copy if needed
4. User clicks source card → Opens document detail or highlights chunk
5. User clicks "New Chat" → Session sidebar updates, welcome screen shown
6. User clicks old session in sidebar → Messages loaded, conversation continues
7. User deletes session → Session removed from list, if active session → new chat

---

## Page 4: Knowledge Base — Documents

### Purpose
Manage all uploaded documents. View status, search, filter, upload new documents.

### Design Inspiration
Notion (table view), Linear (filters), Vercel (cards)

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Base > Documents                        [+ Upload]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 Search documents...     [Type ▼] [Status ▼] [Sort ▼]  │  │
│  │                                                           │  │
│  │ Active filters: [PDF ✕] [Ready ✕]              [Clear]   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ┌─────────┬──────────┬──────────┬─────────┬──────────┐   │  │
│  │  │ ☐ Name  │ Type     │ Status   │ Chunks  │ Actions  │   │  │
│  │  ├─────────┼──────────┼──────────┼─────────┼──────────┤   │  │
│  │  │ ☐ prod- │ 📕 PDF   │ ✅ Ready │ 89      │ 👁 🗑    │   │  │
│  │  │   manual│          │          │         │          │   │  │
│  │  │   .pdf  │          │          │         │          │   │  │
│  │  ├─────────┼──────────┼──────────┼─────────┼──────────┤   │  │
│  │  │ ☐ faq.  │ 📗 XLSX  │ ✅ Ready │ 56      │ 👁 🗑    │   │  │
│  │  │   xlsx  │          │          │         │          │   │  │
│  │  ├─────────┼──────────┼──────────┼─────────┼──────────┤   │  │
│  │  │ ☐ comp- │ 📘 DOCX  │ 🔄 Proc │ —       │ ✕ Cancel │   │  │
│  │  │   any   │          │          │         │          │   │  │
│  │  │   policy│          │ ▰▰▰▰▰▱▱ │         │          │   │  │
│  │  ├─────────┼──────────┼──────────┼─────────┼──────────┤   │  │
│  │  │ ☐ api-  │ 🌐 URL   │ ✅ Ready │ 15      │ 👁 🗑    │   │  │
│  │  │   docs  │          │          │         │          │   │  │
│  │  ├─────────┼──────────┼──────────┼─────────┼──────────┤   │  │
│  │  │ ☐ broken│ 📕 PDF   │ ❌ Failed│ —       │ 🔄 🗑    │   │  │
│  │  │   file  │          │          │         │          │   │  │
│  │  └─────────┴──────────┴──────────┴─────────┴──────────┘   │  │
│  │                                                           │  │
│  │  3 selected  [Delete Selected] [Export List]               │  │
│  │                                                           │  │
│  │  Showing 1-10 of 24 documents               [< 1 2 3 >]  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ── Upload Zone ─────────────────────────────────────────────── │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │              📁 Drag & drop files here                    │  │
│  │                                                           │  │
│  │         or click to browse (PDF, DOCX, TXT, CSV, XLSX)   │  │
│  │                                                           │  │
│  │  ── or ──                                                 │  │
│  │                                                           │  │
│  │  ┌──────────────────────────────────────┐  [Upload URL]   │  │
│  │  │ https://example.com/docs             │                 │  │
│  │  └──────────────────────────────────────┘                 │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Table Columns

| Column | Width | Sortable | Content |
|--------|-------|----------|---------|
| Checkbox | 40px | No | Bulk select |
| Name | flex | Yes | Document title + file icon + upload date |
| Type | 80px | Yes | File type badge (PDF, DOCX, etc.) |
| Status | 100px | Yes | Status badge (Ready, Processing, Failed) |
| Chunks | 80px | Yes | Number of chunks |
| Size | 80px | Yes | File size |
| Last Ref | 120px | Yes | Last referenced in chat |
| Actions | 100px | No | View, Delete, Retry buttons |

### Status Badges

| Status | Color | Icon | Animation |
|--------|-------|------|-----------|
| Ready | Green | ✅ | None |
| Processing | Blue | 🔄 | Pulse + progress bar |
| Failed | Red | ❌ | None |

### Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Base > Documents                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                      📄                                   │  │
│  │                                                           │  │
│  │           No documents yet                                │  │
│  │                                                           │  │
│  │   Upload your first document to build your                │  │
│  │   knowledge base. The AI will use these documents         │  │
│  │   to answer questions in the chat.                        │  │
│  │                                                           │  │
│  │           Supported formats:                              │  │
│  │           PDF, DOCX, TXT, CSV, XLSX, URL                 │  │
│  │                                                           │  │
│  │           [Upload Document]                               │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Loading State

```
┌───────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  [Type ▼] [Status ▼]       │
├───────────────────────────────────────────────────────────┤
│ ☐ ░░░░░░░░░░  ░░░░  ░░░░░░  ░░░  ░░░░                   │
│ ☐ ░░░░░░░░░░  ░░░░  ░░░░░░  ░░░  ░░░░                   │
│ ☐ ░░░░░░░░░░  ░░░░  ░░░░░░  ░░░  ░░░░                   │
│ ☐ ░░░░░░░░░░  ░░░░  ░░░░░░  ░░░  ░░░░                   │
│ ☐ ░░░░░░░░░░  ░░░░  ░░░░░░  ░░░  ░░░░                   │
└───────────────────────────────────────────────────────────┘
```

### Mobile Layout

Table converts to card list:

```
┌─────────────────────┐
│ ☰  Documents   [+]  │
├─────────────────────┤
│ 🔍 Search...        │
│ [Type ▼] [Status ▼] │
├─────────────────────┤
│ ┌───────────────────┐│
│ │ 📕 product-manual ││
│ │    .pdf           ││
│ │                   ││
│ │ ✅ Ready  89 chunks││
│ │ Oct 15    2.4 MB  ││
│ │                   ││
│ │ [View] [Delete]   ││
│ └───────────────────┘│
│ ┌───────────────────┐│
│ │ 📗 faq.xlsx       ││
│ │ ✅ Ready  56 chunks││
│ │ Oct 12    890 KB  ││
│ │ [View] [Delete]   ││
│ └───────────────────┘│
│                     │
│ ┌───────────────────┐│
│ │ 📁 Drop files here││
│ │ or tap to browse  ││
│ └───────────────────┘│
└─────────────────────┘
```

### User Flow
1. Navigate to Documents → Table loads with all documents
2. Click filter → Dropdown shows options, table updates
3. Click document row → Navigate to Document Detail page
4. Drag file to upload zone → Upload begins, progress shown
5. Processing document → Auto-refresh every 5s until ready
6. Select multiple → Bulk actions bar appears at bottom
7. Click delete → Confirmation modal → Document removed

---

## Page 5: Knowledge Base — Document Detail

### Purpose
View a single document's details, its chunks, and metadata.

### Design Inspiration
Notion (page layout), Linear (detail panel)

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Base > Documents > product-manual.pdf                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────┐ ┌──────────────────┐ │
│  │                                      │ │  Document Info   │ │
│  │  📕 product-manual.pdf               │ │                  │ │
│  │                                      │ │  Type: PDF       │ │
│  │  ── Document Overview ──────────     │ │  Size: 2.4 MB    │ │
│  │                                      │ │  Chunks: 89      │ │
│  │  This document contains the product  │ │  Status: ✅ Ready │ │
│  │  manual for Mimotes, covering        │ │  Uploaded: Oct 15 │ │
│  │  installation, configuration, and    │ │  Updated: Oct 15  │ │
│  │  usage instructions...               │ │  Refs: 89 times  │ │
│  │                                      │ │                  │ │
│  │  ── Chunks (89) ───────────────     │ │  ── Actions ──   │ │
│  │                                      │ │                  │ │
│  │  [Search chunks...]                  │ │  [🔄 Reprocess]  │ │
│  │                                      │ │  [📤 Export]     │ │
│  │  Chunk #1  [487 chars]               │ │  [🗑 Delete]     │ │
│  │  ┌────────────────────────────────┐  │ │                  │ │
│  │  │ "Mimotes is an AI-powered      │  │ │  ── File Type ──│ │
│  │  │ knowledge chatbot that uses    │  │ │                  │ │
│  │  │ RAG (Retrieval-Augmented..."   │  │ │  PDF Document    │ │
│  │  │                                │  │ │  42 pages        │ │
│  │  │ [View Embedding] [Find Similar]│  │ │                  │ │
│  │  └────────────────────────────────┘  │ │                  │ │
│  │                                      │ │                  │ │
│  │  Chunk #2  [512 chars]               │ │                  │ │
│  │  ┌────────────────────────────────┐  │ │                  │ │
│  │  │ "The system supports multiple  │  │ │                  │ │
│  │  │ AI providers including OpenAI, │  │ │                  │ │
│  │  │ Mimo Pro, LM Studio..."        │  │ │                  │ │
│  │  │                                │  │ │                  │ │
│  │  │ [View Embedding] [Find Similar]│  │ │                  │ │
│  │  └────────────────────────────────┘  │ │                  │ │
│  │                                      │ │                  │ │
│  │  ... (scrollable)                    │ │                  │ │
│  │                                      │ │                  │ │
│  │  Showing 1-20 of 89 chunks  [More]  │ │                  │ │
│  └──────────────────────────────────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Sections

| Section | Content |
|---------|---------|
| **Header** | Document title, file type icon, breadcrumb |
| **Overview** | First 500 chars of document content as preview |
| **Document Info Panel** | Right sidebar with metadata (type, size, chunks, status, dates, reference count) |
| **Chunks List** | Paginated list of chunks with content preview, expandable |
| **Actions** | Reprocess, Export, Delete buttons |

### Mobile Layout

Info panel stacks above chunks list. Full-width layout.

### User Flow
1. Click document from list → Detail page loads
2. Scroll through chunks → Lazy load more on scroll
3. Click "View Embedding" → Modal with vector visualization
4. Click "Find Similar" → Opens similarity search pre-filled
5. Click "Reprocess" → Confirmation → Document re-processed
6. Click "Delete" → Confirmation modal → Document + chunks deleted

---

## Page 6: Knowledge Base — Chunks

### Purpose
Browse, search, and manage all chunks across all documents.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Base > Chunks                      [Document: All ▼]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 Search chunks by content...      [Document ▼] [Sort ▼]│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Total: 1,847 chunks across 24 documents                        │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  Chunk #1 ── product-manual.pdf ── 487 chars              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ "Mimotes is an AI-powered knowledge chatbot that    │  │  │
│  │  │  uses RAG (Retrieval-Augmented Generation) to       │  │  │
│  │  │  answer questions based on uploaded documents.       │  │  │
│  │  │  The system supports multiple AI providers..."      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  [Expand ▼] [Find Similar] [View Document] [Delete]       │  │
│  │                                                           │  │
│  │  ── Expanded View ────────────────────────────────────    │  │
│  │  │ Metadata:                                              │  │
│  │  │ • Chunk Index: 0                                       │  │
│  │  │ • Source: product-manual.pdf                           │  │
│  │  │ • Created: Oct 15, 2025                                │  │
│  │  │                                                        │  │
│  │  │ Embedding: [0.023, -0.156, 0.089, ...] (1536 dims)   │  │
│  │  │ [Visualize Embedding]                                  │  │
│  │  │                                                        │  │
│  │  │ Similar Chunks:                                        │  │
│  │  │ • Chunk #3 — product-manual.pdf (0.92 sim)            │  │
│  │  │ • Chunk #12 — faq.xlsx (0.87 sim)                     │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  Chunk #2 ── product-manual.pdf ── 512 chars              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ "The system supports multiple AI providers..."      │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │  [Expand ▼] [Find Similar] [View Document] [Delete]       │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Showing 1-20 of 1,847 chunks                    [< 1 2 3 >]   │
└─────────────────────────────────────────────────────────────────┘
```

### User Flow
1. Navigate to Chunks → All chunks loaded with pagination
2. Filter by document → Only chunks from that document shown
3. Search by content → Debounced search, results update
4. Expand chunk → Shows metadata, embedding, similar chunks
5. Click "Find Similar" → Opens similarity search with chunk content
6. Click "View Document" → Navigate to document detail
7. Delete chunk → Confirmation → Chunk removed from vector store

---

## Page 7: Knowledge Base — Similarity Search

### Purpose
Test and debug RAG retrieval by running custom similarity searches.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Base > Similarity Search                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  🔍 Enter a question or text to find similar chunks...    │  │
│  │  ┌─────────────────────────────────────────────┐ [Search] │  │
│  │  │ What is the pricing model for this product?  │          │  │
│  │  └─────────────────────────────────────────────┘          │  │
│  │                                                           │  │
│  │  Top-K: [5 ▼]  Threshold: [0.7 ▼]  Doc: [All ▼]         │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ── Results (5 found) ── Time: 57ms (embed: 45ms, search: 12ms) │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ #1  Similarity: ████████████████████░░  0.94              │  │
│  │     📄 product-manual.pdf  Chunk #12                       │  │
│  │                                                           │  │
│  │     "Our pricing follows a tiered model based on usage.   │  │
│  │      The Starter plan includes 1,000 queries per month    │  │
│  │      at $29/month. The Pro plan includes..."              │  │
│  │                                                           │  │
│  │     [View Chunk] [View Document] [Use in Playground]      │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ #2  Similarity: ██████████████████░░░░  0.89              │  │
│  │     📗 faq.xlsx  Chunk #3                                 │  │
│  │                                                           │  │
│  │     "Q: How much does it cost? A: We offer three plans:   │  │
│  │      Starter ($29/mo), Pro ($99/mo), Enterprise (custom)" │  │
│  │                                                           │  │
│  │     [View Chunk] [View Document] [Use in Playground]      │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ #3  Similarity: █████████████░░░░░░░░░  0.82              │  │
│  │     📘 company-policy.docx  Chunk #7                      │  │
│  │                                                           │  │
│  │     "The company pricing strategy is aligned with..."     │  │
│  │                                                           │  │
│  │     [View Chunk] [View Document] [Use in Playground]      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Components

| Component | Description |
|-----------|-------------|
| `SearchInput` | Large input with search button, Enter to search |
| `SearchFilters` | Top-K slider, threshold slider, document dropdown |
| `SearchResults` | List of results with similarity bars |
| `SimilarityBar` | Visual bar showing similarity score (0-1) |
| `ResultCard` | Individual result with chunk preview, source, actions |

### Empty State (Before Search)

```
┌─────────────────────────────────────────────────────────────────┐
│  Knowledge Base > Similarity Search                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  🔍 Test your knowledge base retrieval                    │  │
│  │                                                           │  │
│  │  Enter any question or text to see which chunks           │  │
│  │  the AI would retrieve. This helps you understand:        │  │
│  │                                                           │  │
│  │  • Why the AI answered a certain way                      │  │
│  │  • Which documents are most relevant                      │  │
│  │  • Whether your knowledge base covers a topic             │  │
│  │                                                           │  │
│  │  ── Try these examples ──────────────────────             │  │
│  │                                                           │  │
│  │  [What is the pricing model?]                             │  │
│  │  [How do I set up the system?]                            │  │
│  │  [What are the main features?]                            │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### User Flow
1. Navigate to Similarity Search → Empty state with examples shown
2. Type query → Adjust Top-K and threshold → Click Search
3. Results appear with similarity scores → Click to view chunk detail
4. Click "Use in Playground" → Opens AI Playground with context pre-filled

---

## Page 8: Analytics — Usage

### Purpose
Track workspace usage patterns, feature adoption, and operational metrics.

### Design Inspiration
Vercel Analytics (clean charts), Linear (KPI cards)

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics > Usage                                  [30d ▼] [📥] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ 📄     │ │ 💬     │ │ 👥     │ │ 📤     │ │ 🔍     │       │
│  │ 24     │ │ 156    │ │ 3      │ │ 8      │ │ 89     │       │
│  │Docs    │ │Chats   │ │Active  │ │Uploads │ │Searches│       │
│  │uploaded│ │sessions│ │users   │ │this mo.│ │this mo.│       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📈 Activity Over Time                                  │   │
│  │                                                         │   │
│  │  [Line chart: Chat sessions (blue), Uploads (green),    │   │
│  │   Searches (purple) — stacked or overlaid]              │   │
│  │                                                         │   │
│  │  Toggle: [Chats ✅] [Uploads ✅] [Searches ✅]          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│  │  📊 Feature Adoption        │ │  🕐 Peak Usage Hours    │   │
│  │                             │ │                         │   │
│  │  [Horizontal bar chart]     │ │  [Heatmap: 7x24 grid]  │   │
│  │                             │ │                         │   │
│  │  Chat:        ████████████  │ │  Mon ░░▓▓████▓▓░░     │   │
│  │  Documents:   ████████      │ │  Tue ░░▓▓████▓▓░░     │   │
│  │  Search:      ██████        │ │  Wed ░░▓▓████▓▓░░     │   │
│  │  Playground:  ████          │ │  Thu ░░▓▓████▓▓░░     │   │
│  │  API:         ██            │ │  Fri ░░▓▓████▓░░░     │   │
│  │                             │ │  Sat ░░░░▓▓▓░░░░     │   │
│  │                             │ │  Sun ░░░░▓▓░░░░░     │   │
│  └─────────────────────────────┘ └─────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📋 Activity Log (Recent)                               │   │
│  │                                                         │   │
│  │  Oct 18 14:30  John   Chat session started              │   │
│  │  Oct 18 14:28  Jane   Document uploaded: faq.xlsx       │   │
│  │  Oct 18 14:15  John   Settings updated                  │   │
│  │  Oct 18 13:45  Bob    Chat session started              │   │
│  │  Oct 18 13:30  John   Document deleted: old-manual.pdf  │   │
│  │                                                         │   │
│  │  [View Full Activity Log →]                             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### KPI Cards

| Card | Metric | Period | Trend |
|------|--------|--------|-------|
| Documents | Total uploaded this period | Selected date range | vs previous period |
| Chat Sessions | Total sessions created | Selected date range | vs previous period |
| Active Users | Unique users who performed any action | Selected date range | vs previous period |
| Uploads | Documents uploaded | Selected date range | vs previous period |
| Searches | Similarity searches performed | Selected date range | vs previous period |

### Charts

| Chart | Type | Data |
|-------|------|------|
| Activity Over Time | Multi-line area chart | Daily counts of chats, uploads, searches |
| Feature Adoption | Horizontal bar chart | Usage count per feature |
| Peak Usage Hours | 7x24 heatmap | Activity density by day/hour |
| Activity Log | Table/list | Recent events with user, action, timestamp |

### Mobile Layout

KPI cards: 2-column grid (scrollable). Charts: Full-width stacked. Activity log: Full-width.

---

## Page 9: Analytics — Chat

### Purpose
Deep dive into chat-specific metrics.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics > Chat                                   [30d ▼]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │ 💬     │ │ ❓     │ │ 📊     │ │ ⏱     │ │ 📎     │       │
│  │ 156    │ │ 42     │ │ 4.2    │ │ 2.3s   │ │ 3.2    │       │
│  │Sessions│ │Today   │ │Avg Msg │ │Avg Resp│ │Avg Src │       │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘       │
│                                                                 │
│  ┌──────────────────────────────────┐ ┌──────────────────────┐ │
│  │  📈 Chat Volume                  │ │  📊 Response Quality │ │
│  │                                  │ │                      │ │
│  │  [Area chart: daily sessions]    │ │  With Sources: 78%   │ │
│  │                                  │ │  ████████████████░░░ │ │
│  │                                  │ │                      │ │
│  │                                  │ │  No Sources: 22%     │ │
│  │                                  │ │  ████░░░░░░░░░░░░░░ │ │
│  │                                  │ │                      │ │
│  │                                  │ │  Avg Confidence: 87% │ │
│  └──────────────────────────────────┘ └──────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│  │  📝 Top Questions           │ │  📊 Session Duration    │   │
│  │                             │ │                         │   │
│  │  1. "Apa fitur utama?" ×12 │ │  [Histogram]            │   │
│  │  2. "Cara setup?" ×8       │ │                         │   │
│  │  3. "Harga berapa?" ×6     │ │  <1min:   ████ 45%      │   │
│  │  4. "Dokumen apa?" ×5      │ │  1-5min:  ██████ 30%    │   │
│  │  5. "API key dimana?" ×4   │ │  5-15min: ███ 15%       │   │
│  │  6. "Perbedaan X?" ×3      │ │  15min+:  ██ 10%        │   │
│  │                             │ │                         │   │
│  └─────────────────────────────┘ └─────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📄 Most Referenced Documents                           │   │
│  │                                                         │   │
│  │  product-manual.pdf    ████████████████████  89 refs    │   │
│  │  faq.xlsx              ████████████  56 refs            │   │
│  │  company-policy.docx   █████████  42 refs               │   │
│  │  technical-spec.pdf    ██████  28 refs                  │   │
│  │  api-docs.txt          ████  15 refs                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Page 10: Analytics — Cost

### Purpose
Track and estimate AI provider costs.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics > Cost                                   [30d ▼]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │ 💵     │ │ 🪙     │ │ 📥     │ │ 📤     │                  │
│  │ $12.47 │ │ $0.08  │ │ 1.2M   │ │ 480K   │                  │
│  │Est.Cost│ │Avg/    │ │Input   │ │Output  │                  │
│  │Month   │ │Query   │ │Tokens  │ │Tokens  │                  │
│  └────────┘ └────────┘ └────────┘ └────────┘                  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  💰 Cost Over Time                                      │   │
│  │                                                         │   │
│  │  [Stacked area chart by provider]                       │   │
│  │  OpenAI (blue) + Mimo Pro (green) + Ollama (gray=free) │   │
│  │                                                         │   │
│  │  Breakdown: [By Provider ▼]                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐   │
│  │  🔌 Cost by Provider        │ │  📊 Token Breakdown     │   │
│  │                             │ │                         │   │
│  │  [Donut chart]              │ │  [Stacked bar chart]    │   │
│  │                             │ │                         │   │
│  │  OpenAI:    $7.80  (62%)   │ │  Chat Input:    45%     │   │
│  │  Mimo Pro:  $3.49  (28%)   │ │  Chat Output:   30%     │   │
│  │  Ollama:    $0.00  (10%)   │ │  Embeddings:    15%     │   │
│  │                             │ │  System:        10%     │   │
│  └─────────────────────────────┘ └─────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📋 Cost by Model                                       │   │
│  │                                                         │   │
│  │  ┌──────────────┬──────────┬──────────┬──────────────┐  │   │
│  │  │ Model        │ Provider │ Tokens   │ Est. Cost    │  │   │
│  │  ├──────────────┼──────────┼──────────┼──────────────┤  │   │
│  │  │ gpt-4o-mini  │ OpenAI   │ 892,400  │ $7.80        │  │   │
│  │  │ mimo-pro     │ Mimo Pro │ 650,200  │ $3.49        │  │   │
│  │  │ llama3       │ Ollama   │ 193,000  │ $0.00 (local)│  │   │
│  │  └──────────────┴──────────┴──────────┴──────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Note: Costs are estimated based on character count / 4 for     │
│  token approximation. Actual costs may vary by provider.        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Page 11: AI — Providers

### Purpose
Manage AI provider configurations. Currently the Settings page; redesigned as a dedicated AI management page.

### Design Inspiration
Vercel (integrations page), Notion (settings)

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI > Providers                                    [Detect Models]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── Active Provider ────────────────────────────────────────────│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🟢 OpenAI                          [Change Provider ▼]   │  │
│  │                                                           │  │
│  │  Status: Connected ✅                                     │  │
│  │  Chat Model: gpt-4o-mini                                  │  │
│  │  Embedding Model: text-embedding-3-small                  │  │
│  │  Base URL: https://api.openai.com/v1                      │  │
│  │                                                           │  │
│  │  Last Health Check: 2 min ago (230ms)                     │  │
│  │                                                           │  │
│  │  [Test Connection]  [Edit Settings]                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ── Available Providers ────────────────────────────────────────│
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ OpenAI   │ │ Mimo Pro │ │ LM Studio│                       │
│  │ 🟢 Active│ │ ⚪ Avail │ │ ⚪ Avail │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Ollama   │ │OpenRouter│ │ Custom   │                       │
│  │ ⚪ Avail │ │ ⚪ Avail │ │ ⚪ Avail │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
│                                                                 │
│  ── Configuration ──────────────────────────────────────────────│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  API Key:        [••••••••••••••••]  [Show] [Test]        │  │
│  │  Base URL:       [https://api.openai.com/v1        ]     │  │
│  │  Chat Model:     [gpt-4o-mini                    ▼]      │  │
│  │  Embed Model:    [text-embedding-3-small           ▼]     │  │
│  │                                                           │  │
│  │  [Detect Models]  [Save Configuration]                    │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### User Flow
1. Navigate to AI Providers → See active provider status
2. Click provider card → Configuration form appears
3. Enter API key → Click "Test Connection" → Green check or error
4. Click "Detect Models" → Models populated in dropdowns
5. Select models → Click "Save" → Toast success, provider activated

---

## Page 12: AI — Playground

### Purpose
Interactive environment for testing prompts, comparing models, and tuning parameters.

### Design Inspiration
OpenAI Playground (layout), Perplexity (source integration)

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI > Playground                    [Model: GPT-4o-mini ▼] [Run]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────────────────────┬────────────────────────────┐│
│  │  Editor                        │  Response                  ││
│  │                                │                            ││
│  │  System Prompt                 │  ┌──────────────────────┐  ││
│  │  ┌──────────────────────────┐  │  │                      │  ││
│  │  │ You are a helpful        │  │  │  Berdasarkan         │  ││
│  │  │ assistant that answers   │  │  │  konteks yang        │  ││
│  │  │ based on context.        │  │  │  diberikan, berikut  │  ││
│  │  │                          │  │  │  adalah jawaban:     │  ││
│  │  │ {context}                │  │  │                      │  ││
│  │  │                          │  │  │  **Fitur utama:**    │  ││
│  │  │ Always cite sources.     │  │  │  1. Chatbot AI...    │  ││
│  │  └──────────────────────────┘  │  │  2. Multi-provider...│  ││
│  │                                │  │                      │  ││
│  │  Context (RAG)                 │  │  [1] product-manual  │  ││
│  │  ┌──────────────────────────┐  │  │  [2] faq.xlsx        │  ││
│  │  │ [Auto-filled or manual]  │  │  │                      │  ││
│  │  │                          │  │  │                      │  ││
│  │  └──────────────────────────┘  │  │  ── Stats ────────  │  ││
│  │                                │  │                      │  ││
│  │  [Use RAG ✅] Top-K: [5]     │  │  Tokens: 342          │  ││
│  │                                │  │  Time: 1.8s           │  ││
│  │  User Message                  │  │  Model: gpt-4o-mini  │  ││
│  │  ┌──────────────────────────┐  │  │  Provider: OpenAI    │  ││
│  │  │ Apa fitur utama produk?  │  │  │                      │  ││
│  │  │                          │  │  │  [Copy] [Save]       │  ││
│  │  └──────────────────────────┘  │  └──────────────────────┘  ││
│  │                                │                            ││
│  │  ── Parameters ──────────────  │  ── History ────────────── ││
│  │                                │                            ││
│  │  Temperature: [────●───] 0.7  │  Run #3  1.8s  342 tokens  ││
│  │  Top P:       [────●───] 1.0  │  Run #2  2.1s  289 tokens  ││
│  │  Max Tokens:  [────────●] 2048│  Run #1  1.5s  198 tokens  ││
│  │  Stream:      [✅]            │                            ││
│  │                                │  [Clear History]           ││
│  │  [Save as Template]            │                            ││
│  │  [Load Template]               │                            ││
│  │  [Compare Mode]                │                            ││
│  │  [Clear All]                   │                            ││
│  └────────────────────────────────┴────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Compare Mode Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI > Playground (Compare)    [Model A ▼] [Model B ▼] [Run All] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Shared Input ────────────────────────────────────────────┐  │
│  │ System Prompt: [You are a helpful assistant...]           │  │
│  │ User Message:  [Apa fitur utama produk?]                  │  │
│  │ Parameters:    Temp: 0.7  Top-P: 1.0  Max: 2048          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────┬─────────────────────────────────┐  │
│  │  GPT-4o-mini            │  Mimo Pro                       │  │
│  │  ──────────────────     │  ──────────────────             │  │
│  │                         │                                 │  │
│  │  Berdasarkan dokumen,   │  Berdasarkan konteks yang       │  │
│  │  fitur utama:           │  tersedia, fitur utama:         │  │
│  │                         │                                 │  │
│  │  1. Chatbot AI          │  1. RAG Pipeline                │  │
│  │  2. Multi-provider      │  2. Multi-AI Provider           │  │
│  │  3. RAG pipeline        │  3. Self-hosted                 │  │
│  │                         │                                 │  │
│  │  ── Stats ──────        │  ── Stats ──────                │  │
│  │  Tokens: 342            │  Tokens: 289                    │  │
│  │  Time: 1.8s             │  Time: 2.1s                     │  │
│  │  Cost: $0.0012          │  Cost: $0.0008                  │  │
│  │                         │                                 │  │
│  │  [Copy] [Use as Default]│  [Copy] [Use as Default]        │  │
│  └─────────────────────────┴─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout

Editor and response stack vertically. Parameters in a collapsible section. Compare mode shows one model at a time with tabs to switch.

### User Flow
1. Navigate to Playground → Empty editor with default system prompt
2. Type system prompt and user message → Click Run → Streaming response
3. Adjust temperature → Run again → Compare results
4. Click "Save as Template" → Name dialog → Saved to prompts
5. Click "Compare Mode" → Select 2 models → Run All → Side-by-side results
6. Click "Load Template" → Select from list → Editor populated

---

## Page 13: AI — Prompts

### Purpose
Manage system prompt templates with versioning.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  AI > Prompts                                      [+ New Prompt]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 Search prompts...              [Category ▼] [Status ▼]│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📝 RAG Assistant                    v3  ✅ Active         │  │
│  │    "You are a helpful assistant that answers questions     │  │
│  │     based on the provided context..."                      │  │
│  │    Category: General    Used in: 89 chats                  │  │
│  │    Last edited: Oct 18, 2025 by John                       │  │
│  │    [Edit] [Test] [Versions ▼] [Duplicate] [Archive]        │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ 📝 Technical Support                v2  ✅ Active         │  │
│  │    "You are a technical support agent..."                  │  │
│  │    Category: Support    Used in: 34 chats                  │  │
│  │    Last edited: Oct 15, 2025 by Jane                       │  │
│  │    [Edit] [Test] [Versions ▼] [Duplicate] [Archive]        │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ 📝 Sales Assistant                  v1  📦 Archived       │  │
│  │    "You are a sales assistant..."                          │  │
│  │    Category: Sales      Used in: 12 chats                  │  │
│  │    [Edit] [Test] [Versions ▼] [Duplicate] [Activate]       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────────────────────────────────┐
│  AI > Prompts                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      📝                                   │  │
│  │                                                           │  │
│  │          No prompt templates yet                          │  │
│  │                                                           │  │
│  │   Create prompt templates to customize how the AI         │  │
│  │   responds to questions. Templates can include            │  │
│  │   variables like {context} and {question}.                │  │
│  │                                                           │  │
│  │          [Create First Prompt]                            │  │
│  │                                                           │  │
│  │   ── Or start from a template ────────────────            │  │
│  │                                                           │  │
│  │   [📋 General RAG Assistant]                              │  │
│  │   [🎧 Customer Support Agent]                             │  │
│  │   [💼 Sales Representative]                               │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Page 14: AI — Prompt Editor

### Purpose
Edit a specific prompt template with version history.

### Desktop Layout

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
│  v3 (current) — Oct 18 — Added {language}       │              │
│  v2 — Oct 15 — Added source citation             │              │
│  v1 — Oct 12 — Initial version                   │              │
│                                                  │              │
│  [View Diff v2→v3] [Revert to v2]               │              │
│                                                  │              │
└──────────────────────────────────────────────────┴──────────────┘
```

### Mobile Layout

Editor full-width. Variables and preview in a collapsible bottom sheet. Version history in a modal.

### User Flow
1. Click "Edit" on prompt → Editor opens with current content
2. Modify prompt text → Variables panel auto-detects `{variable}` patterns
3. Click "Save" → New version created, toast success
4. Click "Test" → Opens Playground with prompt pre-loaded
5. Click "View Diff" → Side-by-side diff modal
6. Click "Revert" → Confirmation → Content reverted, new version created

---

## Page 15: Workspace — Members

### Purpose
Manage team members, roles, and invitations.

### Design Inspiration
Linear (member list), Notion (invite modal), Vercel (role badges)

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Workspace > Members                            [+ Invite Member]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔍 Search members...                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ── Members (4) ────────────────────────────────────────────────│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ┌─────┬──────────────────┬──────────────┬──────────────┐ │  │
│  │  │     │ Name             │ Role         │ Actions      │ │  │
│  │  ├─────┼──────────────────┼──────────────┼──────────────┤ │  │
│  │  │ 👤  │ John Doe         │ 👑 Owner     │ —            │ │  │
│  │  │     │ john@email.com   │              │              │ │  │
│  │  ├─────┼──────────────────┼──────────────┼──────────────┤ │  │
│  │  │ 👤  │ Jane Smith       │ 🔧 Admin     │ [Role ▼] [✕] │ │  │
│  │  │     │ jane@email.com   │              │              │ │  │
│  │  ├─────┼──────────────────┼──────────────┼──────────────┤ │  │
│  │  │ 👤  │ Bob Wilson       │ ✏️ Editor    │ [Role ▼] [✕] │ │  │
│  │  │     │ bob@email.com    │              │              │ │  │
│  │  ├─────┼──────────────────┼──────────────┼──────────────┤ │  │
│  │  │ 👤  │ Alice Brown      │ 👁 Viewer    │ [Role ▼] [✕] │ │  │
│  │  │     │ alice@email.com  │              │              │ │  │
│  │  └─────┴──────────────────┴──────────────┴──────────────┘ │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ── Pending Invitations (2) ────────────────────────────────────│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 📧 charlie@email.com    Editor    Expires: Oct 25         │  │
│  │    [Resend] [Revoke]                                      │  │
│  │ 📧 dave@email.com       Viewer    Expires: Oct 25         │  │
│  │    [Resend] [Revoke]                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Invite Modal

```
┌──────────────────────────────────────────────────────────────┐
│  Invite Team Member                                       [✕] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Email Address:                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ colleague@company.com                                  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Role:                                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ○ Admin  — Full access except workspace deletion       │  │
│  │ ● Editor — Can upload, chat, manage documents          │  │
│  │ ○ Viewer — Can only view and chat                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  The invitation will expire in 7 days.                       │
│                                                              │
│  [Cancel]                              [Send Invitation]     │
└──────────────────────────────────────────────────────────────┘
```

### Mobile Layout

Table converts to card list. Invite button in top bar.

### User Flow
1. Navigate to Members → See member list + pending invitations
2. Click "Invite" → Modal opens → Enter email + select role → Send
3. Invitee receives email → Clicks link → Registers/logs in → Added to workspace
4. Change member role → Dropdown → Role updated immediately
5. Remove member → Confirmation modal → Member removed
6. Revoke invitation → Invitation cancelled

---

## Page 16: Workspace — API Keys

### Purpose
Create and manage API keys for developer access.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Workspace > API Keys                              [+ Create Key]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  🔑 Production Key                    ✅ Active           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ mk_live_7f3a••••••••••••••••••••••••••••  [Copy]    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  Created: Oct 1, 2025      Last used: 2 min ago          │  │
│  │  Rate limit: 100 req/min   Usage: 2,847 requests         │  │
│  │  Permissions: Chat ✅  Search ✅  Documents ❌             │  │
│  │                                                           │  │
│  │  [View Usage] [Rotate Key] [Revoke]                       │  │
│  │                                                           │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                           │  │
│  │  🔑 Development Key                   ✅ Active           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │ mk_test_9b2c••••••••••••••••••••••••••••  [Copy]    │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  Created: Oct 15, 2025     Last used: 1 hour ago         │  │
│  │  Rate limit: 20 req/min    Usage: 156 requests           │  │
│  │                                                           │  │
│  │  [View Usage] [Rotate Key] [Revoke]                       │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Create Key Modal

```
┌──────────────────────────────────────────────────────────────┐
│  Create API Key                                           [✕] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Name:                                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Production Key                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Rate Limit (requests per minute):                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 100                                                    │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Permissions:                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ [✅] Chat — Send messages and receive responses        │  │
│  │ [✅] Search — Perform similarity searches              │  │
│  │ [❌] Documents — Manage documents (admin only)          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  Expiration:                                                 │
│  [Never ▼]                                                  │
│                                                              │
│  [Cancel]                                [Create Key]        │
└──────────────────────────────────────────────────────────────┘
```

### After Creation — Key Shown Once

```
┌──────────────────────────────────────────────────────────────┐
│  API Key Created                                          [✕] │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ⚠️ Copy this key now. You will not be able to see it again. │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ mk_live_7f3a8b2c9d4e5f6a1b3c7d8e9f0a2b4c              │  │
│  │                                              [Copy 📋] │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  [Done]                                                      │
└──────────────────────────────────────────────────────────────┘
```

---

## Page 17: API Documentation

### Purpose
Developer-facing API documentation with examples.

### Design Inspiration
Stripe Docs (layout), Vercel API Reference (code examples)

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  API Documentation                                               │
├──────────────┬──────────────────────────────────────────────────┤
│              │                                                  │
│  Navigation  │  # Authentication                                │
│              │                                                  │
│  Getting     │  All API requests require an API key in the     │
│  Started     │  `Authorization` header:                         │
│              │                                                  │
│  Auth        │  ```                                             │
│              │  Authorization: Bearer mk_live_xxxxx             │
│  Chat API    │  ```                                             │
│              │                                                  │
│  Search API  │  You can create API keys in your                 │
│              │  [workspace settings](/workspace/api-keys).      │
│  Documents   │                                                  │
│  API         │  ## Base URL                                     │
│              │                                                  │
│  Sessions    │  ```                                             │
│  API         │  https://your-domain.com/api/v1                  │
│              │  ```                                             │
│  Rate        │                                                  │
│  Limiting    │  ---                                             │
│              │                                                  │
│  Errors      │  # Chat API                                      │
│              │                                                  │
│  Webhooks    │  ### POST /api/v1/chat                           │
│              │                                                  │
│  SDKs        │  Send a message and receive an AI response.      │
│              │  Supports streaming.                             │
│              │                                                  │
│  ──────      │  **Request Body:**                               │
│              │                                                  │
│  Changelog   │  ```json                                        │
│              │  {                                               │
│              │    "message": "What is the pricing model?",      │
│              │    "sessionId": "optional-session-id",           │
│              │    "stream": true                                │
│              │  }                                               │
│              │  ```                                             │
│              │                                                  │
│              │  **Response (streaming):**                       │
│              │                                                  │
│              │  ```                                            │
│              │  data: {"chunk": "Based on "}                   │
│              │  data: {"chunk": "the documents, "}             │
│              │  data: {"chunk": "the pricing..."}              │
│              │  data: [DONE]                                   │
│              │  ```                                            │
│              │                                                  │
│              │  **Response Headers:**                           │
│              │  - `X-Session-Id`: Session UUID                  │
│              │  - `X-Sources`: URL-encoded JSON array           │
│              │                                                  │
│              │  ── Code Examples ──────────────────────────    │
│              │                                                  │
│              │  [JavaScript] [Python] [cURL] [PHP]             │
│              │                                                  │
│              │  ```javascript                                  │
│              │  const response = await fetch('/api/v1/chat', { │
│              │    method: 'POST',                              │
│              │    headers: {                                   │
│              │      'Authorization': 'Bearer mk_live_xxxxx',  │
│              │      'Content-Type': 'application/json'        │
│              │    },                                           │
│              │    body: JSON.stringify({                       │
│              │      message: 'What is the pricing model?'     │
│              │    })                                           │
│              │  });                                            │
│              │  ```                                            │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### Mobile Layout

Sidebar navigation becomes a horizontal scrollable tab bar at the top. Content full-width below.

---

## Page 18: Workspace Settings — Widget Tab

### Purpose
Configure and preview the embeddable chat widget.

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Workspace > Settings > Chat Widget                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ── Embed Code ─────────────────────────────────────────────────│
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ <script src="https://mimotes.com/widget.js"              │  │
│  │   data-workspace="ws_abc123"                             │  │
│  │   data-theme="light"                                     │  │
│  │   data-position="bottom-right"                           │  │
│  ></script>                                          [Copy 📋]│  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ── Appearance ─────────────────────────────────────────────────│
│                                                                 │
│  ┌────────────────────────────────┬────────────────────────────┐│
│  │                                │                            ││
│  │  Theme:     [Light ▼]          │  ┌─ Live Preview ───────┐ ││
│  │  Position:  [Bottom Right ▼]   │  │                      │ ││
│  │  Color:     [#3b82f6 🎨]      │  │                      │ ││
│  │  Width:     [400] px           │  │        💬            │ ││
│  │  Height:    [600] px           │  │      (FAB)           │ ││
│  │                                │  │                      │ ││
│  │  ── Content ──────────────    │  │                      │ ││
│  │                                │  │                      │ ││
│  │  Greeting:                     │  │                      │ ││
│  │  ┌──────────────────────────┐  │  │                      │ ││
│  │  │ Hi! How can I help you?  │  │  │                      │ ││
│  │  └──────────────────────────┘  │  │                      │ ││
│  │                                │  │                      │ ││
│  │  Placeholder:                  │  └──────────────────────┘ ││
│  │  ┌──────────────────────────┐  │                            ││
│  │  │ Type your question...    │  │                            ││
│  │  └──────────────────────────┘  │                            ││
│  │                                │                            ││
│  │  Show Sources: [✅]            │                            ││
│  │  Allow Upload: [❌]            │                            ││
│  │  Branding:     [✅]            │                            ││
│  │                                │                            ││
│  │  [Save Settings]               │                            ││
│  │                                │                            ││
│  └────────────────────────────────┴────────────────────────────┘│
│                                                                 │
│  ── Widget Analytics (Last 30 days) ────────────────────────────│
│                                                                 │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                  │
│  │ 👁     │ │ 💬     │ │ ❓     │ │ ⏱     │                  │
│  │ 12,450 │ │ 890    │ │ 2,340  │ │ 1.2s   │                  │
│  │ Loads  │ │ Opens  │ │Messages│ │Avg Resp│                  │
│  └────────┘ └────────┘ └────────┘ └────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Flow
1. Navigate to Workspace Settings → Widget tab
2. Copy embed code → Paste on website
3. Customize appearance → Preview updates in real-time
4. Save settings → Widget updates on next load
5. View widget analytics → Usage metrics displayed

---

## Shared Components Reference

### Reusable UI Components

| Component | Variants | Used In |
|-----------|----------|---------|
| `Button` | primary, secondary, ghost, destructive, icon | All pages |
| `Input` | text, search, number, password | Forms, filters |
| `Select` | dropdown, multi-select | Filters, settings |
| `Badge` | status (green/red/yellow/blue), count, type | Tables, cards |
| `Card` | default, interactive (hover), stat | Dashboard, KB |
| `Table` | sortable, selectable, paginated | Documents, Members, Chunks |
| `Modal` | confirm, form, detail | Delete confirm, invite, create |
| `Tabs` | horizontal, vertical | Settings, Playground |
| `Skeleton` | text, card, table row, chart | All loading states |
| `Toast` | success, error, info, warning | All actions |
| `Tooltip` | hover, info | Icons, truncated text |
| `Dropdown` | menu, select, popover | Actions, filters |
| `Avatar` | image, initials, status dot | Members, user menu |
| `Progress` | bar, circular, steps | Processing, uploads |
| `EmptyState` | icon, title, description, CTA | All empty pages |
| `ErrorState` | icon, title, description, retry | All error states |
| `Breadcrumb` | dynamic from route | All pages |
| `SearchInput` | debounced, with filters | All search |
| `DateRangePicker` | preset ranges, custom | Analytics |
| `Chart` | line, area, bar, pie, heatmap | Analytics, Dashboard |
| `CodeBlock` | syntax highlighted, copy | API Docs, Playground |
| `DiffViewer` | side-by-side, inline | Prompt versions |

### Animation Specifications

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Page transition | Fade in content | 150ms | ease-in-out |
| Sidebar expand/collapse | Width transition | 200ms | ease-in-out |
| Modal open | Scale 0.95→1 + fade | 150ms | ease-out |
| Modal close | Fade out | 100ms | ease-in |
| Toast enter | Slide from right + fade | 200ms | ease-out |
| Toast exit | Fade out + slide right | 150ms | ease-in |
| Skeleton pulse | Opacity 0.4→1 | 1.5s | ease-in-out infinite |
| Button hover | Background darken | 100ms | ease |
| Card hover | Shadow elevation | 150ms | ease |
| Streaming cursor | Blink | 1s | step-end infinite |
| Sidebar mobile overlay | Fade backdrop | 200ms | ease |
| Sidebar mobile slide | Translate x | 250ms | ease-out |
