# SIDEBAR_REARCHITECTURE_REPORT.md — MimoNotes V2 Sidebar

> **Date:** June 14, 2026
> **Component:** `components/layout/app-sidebar.tsx`
> **Sprint:** A3 — Sidebar Cleanup

---

## Overview

Complete rewrite of the sidebar navigation from a complex multi-section layout (14+ items across 4 collapsible sections + bottom nav) to a flat, focused 6-item navigation with visual active indicator.

---

## Architecture Change

### Before: Multi-Section Sidebar

```
Structure:
├── Logo + Workspace Switcher
├── "New Chat" CTA
├── Primary Nav (2 items): Dashboard, Chat
├── Separator
├── Collapsible Sections (4 sections, 12 items):
│   ├── Knowledge Base: Documents, Chunks, Search, Sources, Upload
│   ├── Analytics: Usage, Chat, Cost
│   ├── AI: Playground, Prompts
│   └── Integrations: Widgets, API
├── Separator
├── Bottom Nav (4 items): Workspace, Usage, Billing, Settings
├── Separator
└── User Profile

Total: 2 + 12 + 4 = 18 nav items
```

### After: Flat 6-Item Sidebar

```
Structure:
├── Logo + Workspace Switcher
├── "New Chat" CTA
├── Core Navigation (6 items):
│   ├── Dashboard
│   ├── Chat
│   ├── Documents
│   ├── Knowledge
│   ├── Analytics
│   └── Settings
├── Separator
└── User Profile

Total: 6 nav items
```

**Reduction:** 18 → 6 items (67% fewer navigation targets)

---

## What Was Removed

| Removed Item | Redirected To | Access Method |
|-------------|---------------|---------------|
| Chunks | /knowledge/chunks | Cmd+K → "Chunks" |
| Search | /knowledge/search | Cmd+K → "Similarity Search" |
| Sources | /knowledge/sources | Cmd+K → "Sources" |
| Upload | /documents/upload | Cmd+K → "Upload Document" |
| Chat Analytics | /analytics/chat | Cmd+K → "Chat Analytics" |
| Cost | /analytics/cost | Cmd+K → "Cost Analytics" |
| Playground | /ai/playground | Cmd+K → "Playground" |
| Prompts | /ai/prompts | Cmd+K → "Prompts" |
| Widgets | /settings/widget | Cmd+K → "Widget Config" |
| API | /developers | Cmd+K → "API / Developers" |
| Workspace | /settings/workspace | Cmd+K → "Workspace Settings" |
| Usage | /settings/usage | Cmd+K → "Usage" |
| Billing | /settings/billing | Cmd+K → "Billing" |

**All 13 removed items are accessible via Command Palette (Cmd+K).**

---

## What Changed in the Component

### Removed
- `navSections` array (4 collapsible sections)
- `bottomNav` array (4 bottom items)
- `expandedSections` state + `toggleSection()` function
- `ChevronDown` icon import
- Collapsible section rendering logic (~50 lines)

### Added
- `onCommandOpen` prop (optional callback)
- Active indicator: left border bar (`h-5 w-0.5 rounded-full bg-primary`)
- Flat `coreNav` array (6 items)

### Kept
- Logo + brand name
- WorkspaceSwitcher
- "New Chat" CTA button
- User profile with avatar + logout
- `isActive()` function (unchanged)
- `getInitials()` function (unchanged)

---

## Visual Design

### Active State

```
┌────────────────────────┐
│ ■ Dashboard            │  ← active: bg-sidebar-accent + left border bar
│   Chat                 │  ← inactive: text-sidebar-foreground/70
│   Documents            │
│   Knowledge            │
│   Analytics            │
│   Settings             │
└────────────────────────┘

Active indicator:
  - Position: absolute left, vertically centered
  - Size: 2px wide × 20px tall
  - Color: bg-primary (brand purple)
  - Shape: rounded-full
```

### Spacing & Sizing

| Element | Value |
|---------|-------|
| Nav item height | py-2 (8px vertical padding) |
| Nav item padding | px-2.5 (10px horizontal) |
| Icon size | size-4 (16px) |
| Gap icon→text | gap-2.5 (10px) |
| Font size | text-sm (14px) |
| Border radius | rounded-lg (8px) |

---

## Mobile Behavior

The sidebar component is reused in `MobileNav` (Sheet overlay). The reduced item count means:
- Mobile sheet is shorter (fits without scroll on most screens)
- Touch targets are larger (fewer items = more space)
- No collapsible sections to tap/expand

---

## Token Usage

| Token | Usage |
|-------|-------|
| `bg-sidebar` | Sidebar background |
| `bg-sidebar-accent` | Active nav item background |
| `text-sidebar-accent-foreground` | Active nav item text |
| `text-sidebar-foreground/70` | Inactive nav item text |
| `bg-primary` | Active indicator bar, "New Chat" button |
| `text-primary-foreground` | "New Chat" button text |
| `bg-primary/90` | "New Chat" button hover |

---

*Report generated: 2026-06-14*
*Hermes Agent — Sprint A3 sidebar rearchitecture*
