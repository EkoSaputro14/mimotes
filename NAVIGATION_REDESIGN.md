# NAVIGATION_REDESIGN.md — Information Architecture

> Date: 2026-06-10
> Phase: UI-REVAMP — Step 4

---

## Current Problem

- 5 collapsible sections in sidebar (primary, KB, Analytics, AI, bottom settings)
- Settings split into 4 bottom nav items (Workspace, Usage, Billing, Settings)
- Upload nested inside KB > Documents
- Duplicate navigation paths (/documents and /knowledge/documents)
- No clear hierarchy between primary and secondary actions

## Redesign: Simplified IA

### Desktop Sidebar (260px)

```
┌──────────────────────────────┐
│  🤖 Mimotes                  │  ← Logo + workspace name
│  ──────────────────────────  │
│  🏠 Dashboard                │  ← PRIMARY
│  💬 Chat                     │  ← PRIMARY
│  ──────────────────────────  │
│  📄 Documents                │  ← Promoted (was nested in KB)
│  ⬆️ Upload                   │  ← Promoted (was nested in KB)
│  ──────────────────────────  │
│  📊 Analytics                │  ← Single page with tabs
│  🧩 Widgets                  │
│  🔌 API                      │
│  ──────────────────────────  │
│  ⚙️ Settings                 │  ← Single entry (tabs inside)
│                              │
│  ──────────────────────────  │
│  👤 Admin                    │  ← User avatar + name
│     admin@mimotes.com        │
└──────────────────────────────┘
```

### Mobile Bottom Tab Bar (NEW)

```
┌────────┬────────┬────────┬────────┬────────┐
│  🏠    │  💬    │  ⬆️    │  📊    │  ⋯     │
│  Home  │  Chat  │ Upload │ Stats  │  More  │
└────────┴────────┴────────┴────────┴────────┘
```

### "More" Sheet (Mobile)

```
┌──────────────────────────────┐
│  More                        │
│  ──────────────────────────  │
│  📄 Documents                │
│  🧩 Widgets                  │
│  🔌 API                      │
│  📈 Analytics                │
│  ──────────────────────────  │
│  ⚙️ Settings                 │
│  🚪 Log out                  │
└──────────────────────────────┘
```

## Page Consolidation

| Current Pages | New Page | Change |
|---------------|----------|--------|
| /dashboard | /dashboard | Redesigned (see DASHBOARD_REDESIGN.md) |
| /chat | /chat | Enhanced (see CHAT_EXPERIENCE.md) |
| /knowledge/documents | /documents | Merged, simplified route |
| /knowledge/chunks | /documents/[id] | Chunks shown in document detail |
| /knowledge/search | /search | Standalone search page |
| /knowledge/sources | /documents (tab) | Merged into documents |
| /documents/upload | /upload | Promoted to top level |
| /analytics/usage | /analytics | Unified with tabs |
| /analytics/chat | /analytics (tab) | Tab within unified page |
| /analytics/cost | /analytics (tab) | Tab within unified page |
| /ai/playground | /playground | Renamed, promoted |
| /ai/prompts | /prompts | Promoted |
| /settings | /settings | Single page with tabs |
| /settings/billing | /settings (tab) | Tab within settings |
| /settings/usage | /settings (tab) | Tab within settings |
| /settings/workspace | /settings (tab) | Tab within settings |

## Settings Page Structure

```
/settings
├── General     (workspace name, logo, timezone)
├── AI Provider (model config, API keys)
├── Billing     (plan, usage, payment)
├── Team        (members, roles, invites)
├── API         (keys, docs, rate limits)
└── Advanced    (danger zone, export, delete)
```

## Analytics Page Structure

```
/analytics
├── Overview    (KPI summary, trends)
├── Chat        (messages, sessions, satisfaction)
├── Retrieval   (search quality, latency, top queries)
├── Cost        (spending breakdown, forecasts)
└── Evaluation  (precision, recall, MRR, benchmark)
```

## Route Changes Summary

| Before | After | Impact |
|--------|-------|--------|
| /knowledge/documents | /documents | Shorter URL, clearer |
| /knowledge/chunks | Removed (in doc detail) | Less navigation depth |
| /knowledge/search | /search | Top-level |
| /knowledge/sources | Removed (in documents) | Less navigation depth |
| /documents/upload | /upload | Top-level |
| /analytics/usage | /analytics | Single page |
| /analytics/chat | /analytics#chat | Tab |
| /analytics/cost | /analytics#cost | Tab |
| /ai/playground | /playground | Shorter URL |
| /ai/prompts | /prompts | Shorter URL |
| /settings/billing | /settings#billing | Tab |
| /settings/usage | /settings#usage | Tab |
| /settings/workspace | /settings#general | Tab |

---

*Generated by Hermes Agent — Phase UI-REVAMP Step 4*
