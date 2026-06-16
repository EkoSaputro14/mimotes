# Dashboard V2 Specification — MimoNotes

**Date:** June 14, 2026  
**Status:** Design spec — no implementation  
**Based on:** DASHBOARD_UX_AUDIT.md (score 4.2/10)  
**Target score:** 7.5/10

---

## Design Principles

1. **Personal first** — Greet the user, show their workspace, their data
2. **Progressive density** — Show summary first, details on demand
3. **Action-oriented** — Every element should help the user do something
4. **Contextual** — Adapt to user state (new vs. power user)
5. **Accessible** — WCAG 2.1 AA compliant

---

## V2 Layout Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (260px)                    │ Main Content        │
│                                    │                     │
│ ┌────────────────────┐             │ ┌─────────────────┐ │
│ │ Logo + Workspace   │             │ │ Greeting Bar    │ │
│ │ Switcher           │             │ │ + Quick Search  │ │
│ ├────────────────────┤             │ ├─────────────────┤ │
│ │ + New Chat (CTA)   │             │ │ Hero Metric     │ │
│ ├────────────────────┤             │ │ (1 large card)  │ │
│ │ Dashboard ●        │             │ ├─────────────────┤ │
│ │ Chat               │             │ │ Stat Row        │ │
│ │ Documents          │             │ │ (3 small cards) │ │
│ │ Knowledge          │             │ ├────────┬────────┤ │
│ │ Analytics          │             │ │ Recent │ Top    │ │
│ │ Settings           │             │ │ Chats  │ Docs   │ │
│ ├────────────────────┤             │ │ (55%)  │ (45%)  │ │
│ │ Cmd+K hint         │             │ ├────────┴────────┤ │
│ │ User avatar        │             │ │ Usage Chart     │ │
│ └────────────────────┘             │ │ (full width)    │ │
│                                    │ ├─────────────────┤ │
│                                    │ │ Quick Actions   │ │
│                                    │ │ (compact row)   │ │
│                                    │ └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Greeting Bar (NEW)

**Purpose:** Personalize the experience, provide quick search access.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ Selamat datang kembali, Eko 👋          [🔍 Search... ⌘K] │
│ Workspace: Personal · 12 documents · 3 members          │
└──────────────────────────────────────────────────────────┘
```

**Spec:**
- `bg-card border border-border/20 rounded-lg p-5`
- Left: Greeting text (time-based: "Selamat pagi/siang/sore/malam") + user name
- Right: Search button (opens Cmd+K)
- Subtitle: Workspace name + document count + member count
- Responsive: Stack on mobile

**Data sources:**
- User name: `session.user.name`
- Workspace: `WorkspaceSwitcher` context
- Documents: `prisma.document.count()`
- Members: `prisma.workspaceMember.count()`

---

### 2. Hero Metric (REDESIGN of StatCardsRow)

**Purpose:** Show the single most important number at a glance.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  📄 Documents                                     12     │
│  ████████████████████░░░░  83% ready (2 processing)     │
│  +3 this week · [View all →]                             │
└──────────────────────────────────────────────────────────┘
```

**Spec:**
- `bg-card border border-border/20 rounded-lg p-5`
- Large icon (size-5) + label + value (text-3xl font-bold)
- Progress bar showing ready/total ratio
- Trend: "+3 this week" with arrow
- Link: "View all →" to `/documents`
- Responsive: Full width on all screens

**Data sources:**
- `prisma.document.count()`
- `prisma.document.groupBy({ by: ["status"] })`

---

### 3. Stat Row (REDUCED from 4 to 3)

**Purpose:** Show secondary metrics without competing with hero.

**Layout:**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 💬 Chats     │ │ 📊 Chunks    │ │ 📈 Messages  │
│     28       │ │   1,247      │ │    156       │
│  +5 today    │ │  +89 today   │ │  +23 today   │
└──────────────┘ └──────────────┘ └──────────────┘
```

**Spec:**
- 3-column grid (`grid-cols-1 sm:grid-cols-3`)
- Each card: `bg-card border border-border/20 rounded-lg p-4`
- Icon + label (text-xs uppercase) + value (text-2xl font-bold)
- Trend: "+N today" in muted text
- Responsive: Stack on mobile

---

### 4. Recent Chats + Top Documents (SIDE BY SIDE)

**Purpose:** Show the most actionable content — what the user was working on.

**Layout:**
```
┌─────────────────────────────┬────────────────────────────┐
│ 💬 Recent Chats             │ 📄 Top Documents            │
│ [View all →]                │ [View all →]               │
│                             │                            │
│ 🟣 Apa itu RAG?      2m    │ 📄 RAG_Paper.pdf    12 refs│
│ 🟣 Ringkasan dokumen  1h    │ �📝 API_Docs.docx    8 refs│
│ 🟣 Jelaskan embedding 3h    │ 📊 Data_2024.csv    5 refs│
│ 🟣 Bandingkan model   1d    │ 🔗 Website.md       3 refs│
│ 🟣 Strategi SEO       2d    │ 📃 Notes.txt        2 refs│
└─────────────────────────────┴────────────────────────────┘
```

**Spec:**
- 2-column grid (`grid-cols-1 lg:grid-cols-5` — 55%/45%)
- Each card: `bg-card border border-border/20 rounded-lg`
- Header: Icon + title + "View all →" link
- List items: Icon + title + metadata (time/refs) + arrow
- Empty state: Icon + text + CTA link
- Responsive: Stack on mobile

**Data sources:**
- Recent Chats: `GET /api/chat/sessions` (top 5)
- Top Documents: `GET /api/dashboard/top-documents` (top 5)

---

### 5. Usage Chart (MOVED from separate page)

**Purpose:** Show usage trend without leaving dashboard.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ 📈 Questions Over Time                 [7d] [30d] [90d]  │
│ ┌──────────────────────────────────────────────────────┐ │
│ │                                                      │ │
│ │  ▁▂▃▅▆▇█▇▆▅▃▂▁▂▃▅▆▇█▇▆▅▃▂▁                         │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│ Last 7 days: 42 questions · 8 sessions · 3.2 avg/day    │
└──────────────────────────────────────────────────────────┘
```

**Spec:**
- Full width card (`bg-card border border-border/20 rounded-lg p-5`)
- Header: Icon + title + time range selector (7d/30d/90d)
- Chart: Recharts AreaChart (existing `UsageChart` component)
- Summary line: Total questions + sessions + daily average
- Responsive: Chart height reduces on mobile

**Data sources:**
- `GET /api/dashboard/usage?days=7`

---

### 6. Quick Actions (COMPACT ROW)

**Purpose:** Provide fast access to common tasks without dominating the page.

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ ⚡ Quick Actions                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ 💬 Chat  │ │ 📤 Upload│ │ ⚙️ Settings│ │ 📊 Stats │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
└──────────────────────────────────────────────────────────┘
```

**Spec:**
- Full width card (`bg-card border border-border/20 rounded-lg p-4`)
- 4-column grid on desktop, 2-column on mobile
- Each action: Icon + label (no description)
- Compact: `p-3` padding, `text-sm` font
- Actions adapt to user state:
  - If recent session exists: "Continue last chat" instead of "New Chat"
  - If processing documents: "View processing" instead of "Upload File"

**Actions (V2):**
| Label | Icon | href | Condition |
|-------|------|------|-----------|
| Chat Baru | MessageSquare | /chat | Always |
| Upload | Upload | /documents/upload | Always |
| Pengaturan | Settings | /settings | Always |
| Analitik | BarChart3 | /analytics/usage | Always |
| Lanjutkan Chat | MessageSquare | /chat | If recent session |
| Proses Dokumen | FileText | /documents | If processing |

---

### 7. System Health (CONDITIONAL)

**Purpose:** Show system status only when there are issues.

**Layout (when issues):**
```
┌──────────────────────────────────────────────────────────┐
│ ⚠️ System Health — 1 service needs attention             │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ✅ Database        ok        45ms                    │ │
│ │ ⚠️ Vector Store   degraded  120ms                   │ │
│ │ ✅ AI Provider     ok        230ms                   │ │
│ └──────────────────────────────────────────────────────┘ │
│ Last checked: 2 minutes ago                    [Refresh] │
└──────────────────────────────────────────────────────────┘
```

**Layout (all ok):**
```
┌──────────────────────────────────────────────────────────┐
│ ✅ All systems operational                    [Refresh]  │
└──────────────────────────────────────────────────────────┘
```

**Spec:**
- Full width card (when issues) or compact badge (when ok)
- When ok: Single line with green dot + text
- When issues: Expanded card with service list
- Responsive: Always full width

---

## Responsive Behavior

### Desktop (≥1024px)
```
┌──────┬─────────────────────────────────────┐
│ Side │ Greeting                             │
│ bar  │ Hero Metric                          │
│      │ Stat Row (3 cols)                    │
│      │ Recent Chats (55%) │ Top Docs (45%) │
│      │ Usage Chart                            │
│      │ Quick Actions (4 cols)                │
└──────┴─────────────────────────────────────┘
```

### Tablet (768-1023px)
```
┌─────────────────────────────────────────┐
│ Greeting                                 │
│ Hero Metric                              │
│ Stat Row (3 cols)                        │
│ Recent Chats (50%) │ Top Docs (50%)     │
│ Usage Chart                              │
│ Quick Actions (4 cols)                   │
└─────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────┐
│ Greeting (stacked)   │
│ Hero Metric          │
│ Stat Row (1 col)     │
│ Recent Chats         │
│ Top Documents        │
│ Usage Chart          │
│ Quick Actions (2 col)│
└─────────────────────┘
```

---

## Empty State Design

### New User (0 documents, 0 chats)
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│            🚀 Selamat datang di Mimotes!                  │
│                                                          │
│   Mulai dengan mengupload dokumen pertama Anda,          │
│   lalu ajukan pertanyaan berdasarkan isinya.             │
│                                                          │
│   ┌──────────────────────────────────────────────┐      │
│   │ 1. Upload dokumen pertama        [→ Upload]  │      │
│   │ 2. Mulai chat dengan AI           [→ Chat]    │      │
│   │ 3. Lihat analitik penggunaan      [→ Stats]   │      │
│   └──────────────────────────────────────────────┘      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Power User (10+ documents, 50+ chats)
```
┌──────────────────────────────────────────────────────────┐
│ Selamat datang kembali, Eko 👋                            │
│ Workspace: Personal · 45 documents · 5 members           │
├──────────────────────────────────────────────────────────┤
│ 📄 45  │ 💬 128  │ 📊 3,421  │ (hero + stats)           │
├──────────────────────────────────────────────────────────┤
│ Recent Chats + Top Docs + Usage Chart + Quick Actions    │
└──────────────────────────────────────────────────────────┘
```

---

## Accessibility Requirements

1. **Skip-to-content** — `<a href="#main-content" class="sr-only">Lewati ke konten</a>`
2. **aria-live="polite"** — On stat cards for loading announcements
3. **role="region"** — On each card section with aria-label
4. **Keyboard navigation** — All cards focusable, Enter to activate
5. **Focus indicators** — `focus-visible:ring-2 focus-visible:ring-primary`
6. **Screen reader timestamps** — Full datetime in sr-only spans
7. **Color + text** — Status indicators use both color and text

---

## Performance Requirements

1. **Initial load** — Stat cards via server component (Suspense)
2. **Progressive loading** — Hero metric loads first, then stats, then charts
3. **No layout shift** — Skeleton loaders for all async content
4. **Client components** — Only Activity Feed, Usage Chart, System Health
5. **Data caching** — Stats cached 60s, charts cached 300s

---

## Migration Path

### Phase 1: Quick Wins (1 day)
- Add Greeting Bar component
- Add RecentChats + TopDocuments to main dashboard
- Fix Quick Action labels
- Add skip-to-content

### Phase 2: Redesign (3 days)
- Replace StatCardsRow with Hero Metric + Stat Row
- Move UsageChart to dashboard
- Make System Health conditional
- Add empty state onboarding

### Phase 3: Polish (2 days)
- Add sparklines to stat cards
- Add workspace context
- Optimize mobile layout
- Add keyboard shortcuts

---

## Component File Structure

```
components/dashboard/
├── greeting-bar.tsx          (NEW)
├── hero-metric.tsx           (NEW — replaces stat-card for primary)
├── stat-card.tsx             (MODIFIED — add sparkline prop)
├── recent-chats.tsx          (EXISTS — add to main dashboard)
├── top-documents.tsx         (EXISTS — add to main dashboard)
├── usage-chart.tsx           (EXISTS — add to main dashboard)
├── quick-actions-v2.tsx      (NEW — replaces inline QuickActions)
├── system-health.tsx         (MODIFIED — add conditional prop)
├── activity-feed.tsx         (EXISTS — keep as-is for now)
├── cost-summary.tsx          (EXISTS — optional, add later)
├── kb-stats.tsx              (EXISTS — redundant with hero metric)
├── retrieval-analytics.tsx   (EXISTS — keep on analytics page)
└── evaluation-analytics.tsx  (EXISTS — keep on analytics page)
```

---

## Summary

| Metric | V1 (Current) | V2 (Target) |
|--------|-------------|-------------|
| Score | 4.2/10 | 7.5/10 |
| Personalization | None | Greeting + workspace context |
| Information density | Low (4 stats) | Medium (hero + 3 stats + 2 lists + chart) |
| Empty states | Text only | Onboarding checklist |
| Quick actions | 6 generic | 4 contextual |
| Recent activity | 3 types | Rich with previews |
| Workspace awareness | None | Name + members + stats |
| Mobile | Basic stacking | Optimized grid |
| Accessibility | None | WCAG 2.1 AA |
| Components used | 4 of 10 | 8 of 10 |
