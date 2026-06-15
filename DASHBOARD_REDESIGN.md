# DASHBOARD_REDESIGN.md — Dashboard Redesign

> Date: 2026-06-10
> Phase: UI-REVAMP — Step 3

---

## Current Problem

Dashboard shows 8+ cards stacked vertically with no visual hierarchy. Users see: StatCards, UsageChart, KBStats, CostSummary, RecentChats, TopDocuments, RetrievalAnalytics, EvaluationAnalytics, SystemHealth, PlanStatus. It's a data dump, not an insight engine.

## Redesign: Executive Overview Dashboard

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Welcome back, Admin                    [Quick Actions] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                  │
│  │ Docs │ │Chunks│ │Chats │ │Search│  ← KPI Row        │
│  │  34  │ │107K  │ │  7   │ │ 106  │                   │
│  │ +3 ↑ │ │  +0  │ │ +2 ↑ │ │ +15↑ │                   │
│  └──────┘ └──────┘ └──────┘ └──────┘                  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐ ┌─────────────────────┐       │
│  │  📊 Activity Feed   │ │  🏥 System Health   │       │
│  │                     │ │                     │       │
│  │  10:32 Upload DOCX  │ │  ● Database   OK    │       │
│  │  10:15 Chat session │ │  ● Vector     OK    │       │
│  │  09:45 OCR complete │ │  ● AI Provider OK   │       │
│  │  09:30 Bulk upload  │ │  ● PaddleOCR  OK    │       │
│  │                     │ │                     │       │
│  │  [View All →]       │ │  Last: 2min ago     │       │
│  └─────────────────────┘ └─────────────────────┘       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐ ┌─────────────────────┐       │
│  │  📈 Search Trends   │ │  🎯 Retrieval QA    │       │
│  │  (line chart)       │ │                     │       │
│  │                     │ │  P@5: 0.8%  ⚠️      │       │
│  │  7d / 30d / 90d     │ │  MRR: 1.5%  ⚠️      │       │
│  │                     │ │  Doc Hit: 28% ⚠️    │       │
│  │                     │ │                     │       │
│  │                     │ │  [Run Evaluation →] │       │
│  └─────────────────────┘ └─────────────────────┘       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  💰 Cost & Usage Summary                     │      │
│  │                                              │      │
│  │  This Month: $47.20  │ Queries: 892          │      │
│  │  Avg/query: $0.053   │ Tokens: 2.1M          │      │
│  │                                              │      │
│  │  [bar chart: monthly trend]                  │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────┐ ┌─────────────────────┐       │
│  │  📄 Recent Uploads  │ │  💬 Recent Chats    │       │
│  │                     │ │                     │       │
│  │  📄 lelang1.jpg  ✅ │ │  💬 Property Q&A 🕐 │       │
│  │  📄 invoice.png  ✅ │ │  💬 DB Schema    🕐 │       │
│  │  📄 report.docx  ✅ │ │  💬 Cost Review  🕐 │       │
│  │                     │ │                     │       │
│  │  [View All →]       │ │  [View All →]       │       │
│  └─────────────────────┘ └─────────────────────┘       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │  🚀 Quick Actions                            │      │
│  │                                              │      │
│  │  [Upload Document] [Start Chat] [View API]   │      │
│  │  [Configure AI]    [Add Widget] [Settings]   │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Sections (Top to Bottom)

| Section | Content | Priority |
|---------|---------|----------|
| **Welcome + Actions** | Greeting, quick action buttons | P0 |
| **KPI Row** | 4 stat cards (Docs, Chunks, Chats, Searches) | P0 |
| **Activity + Health** | 2-column: Activity feed + System health | P0 |
| **Insights** | 2-column: Search trends + Retrieval quality | P1 |
| **Cost & Usage** | Full-width cost summary with chart | P1 |
| **Recent Items** | 2-column: Recent uploads + Recent chats | P1 |
| **Quick Actions** | Grid of primary action buttons | P2 |

### Key Changes from Current

1. **Activity Feed replaces StatCards** — Instead of 4 static numbers, show what happened recently.
2. **System Health promoted** — Was buried at bottom, now prominent with colored status dots.
3. **Retrieval QA card** — Shows evaluation metrics with warnings (not just raw numbers).
4. **Quick Actions** — Guides users to next steps (upload, chat, configure).
5. **Cost & Usage unified** — Single card instead of separate CostSummary + UsageChart.
6. **Recent items** — Uploads and chats side-by-side for quick access.

---

*Generated by Hermes Agent — Phase UI-REVAMP Step 3*
