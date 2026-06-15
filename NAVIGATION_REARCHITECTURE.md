# NAVIGATION REARCHITECTURE — MimoNotes V2

> **Document:** Navigation Redesign Specification
> **Author:** Staff UX Designer, MimoNotes Design Team
> **Version:** 1.0.0
> **Status:** DRAFT — Ready for Engineering Review
> **Date:** June 2026

---

## Executive Summary

MimoNotes V1 navigation suffers from feature bloat: 14+ items across 6 sections create a dense, confusing hierarchy that overwhelms both casual users and power users. Developer-only features (Chunks, Sources, Playground) are exposed alongside consumer-facing pages. Settings are scattered across 6 locations. There is no Command Palette, no breadcrumbs, and no mobile-specific navigation.

This document defines the definitive navigation blueprint for MimoNotes V2, reducing primary navigation to **6 items**, introducing a **Command Palette (Cmd+K)** for advanced features, consolidating settings into a single tabbed page, and adding mobile-first navigation patterns.

**Key metrics:**
- Primary items: **14+ → 6** (57% reduction)
- Total routes: **34 → 20** (41% reduction)
- Settings locations: **6 → 1** (83% reduction)
- Average clicks to any feature: **≤ 2** (via Command Palette)

---

## Table of Contents

1. [Current vs Proposed Navigation](#1-current-vs-proposed-navigation)
2. [New Sidebar Structure](#2-new-sidebar-structure)
3. [Command Palette (Cmd+K)](#3-command-palette-cmdk)
4. [Breadcrumb System](#4-breadcrumb-system)
5. [Settings Consolidation](#5-settings-consolidation)
6. [Mobile Navigation](#6-mobile-navigation)
7. [Hidden Features Strategy](#7-hidden-features-strategy)
8. [Route Mapping](#8-route-mapping)
9. [Keyboard Shortcuts](#9-keyboard-shortcuts)
10. [Implementation Specs](#10-implementation-specs)

---

## 1. Current vs Proposed Navigation

### 1.1 Side-by-Side Comparison

| Section | Current (V1) | Proposed (V2) | Action |
|---|---|---|---|
| **Primary** | Dashboard | Home | ✅ Renamed |
| **Primary** | Chat | Chat | ✅ Kept |
| **Knowledge Base** | Documents | Documents | ✅ Kept |
| **Knowledge Base** | Chunks | *(hidden)* | 🔒 Moved to Cmd+K → Advanced |
| **Knowledge Base** | Search | *(hidden)* | 🔒 Moved to Cmd+K → Actions |
| **Knowledge Base** | Sources | *(hidden)* | 🔒 Moved to Cmd+K → Advanced |
| **Knowledge Base** | Upload | *(merged)* | ⚡ Merged into Documents (FAB button) |
| **Analytics** | Usage | Analytics | ✅ Merged into single Analytics page |
| **Analytics** | Chat | Analytics | ✅ Merged into single Analytics page |
| **Analytics** | Cost | Analytics | ✅ Merged into single Analytics page |
| **AI** | Playground | *(hidden)* | 🔒 Moved to Cmd+K → Advanced |
| **AI** | Prompts | *(hidden)* | 🔒 Moved to Cmd+K → Actions |
| **Integrations** | Widgets | *(hidden)* | 🔒 Moved to Settings → Integrations tab |
| **Integrations** | API | *(hidden)* | 🔒 Moved to Settings → API tab |
| **Bottom** | Workspace | Settings | ✅ Consolidated |
| **Bottom** | Usage | Analytics | ✅ Consolidated |
| **Bottom** | Billing | Settings | ✅ Consolidated |
| **Bottom** | Settings | Settings | ✅ Consolidated |
| **NEW** | — | **Knowledge** | 🆕 New top-level item |
| **NEW** | — | **Settings** | 🆕 New top-level item |
| **NEW** | — | **Cmd+K** | 🆕 Command Palette |

### 1.2 Items Removed, Merged, or Relocated

| Item | Disposition | Rationale |
|---|---|---|
| **Chunks** | → Cmd+K (Advanced) | Developer-only debugging tool. 99% of users never need raw chunk viewing. Accessible via `Cmd+K → "View Chunks"` or `/knowledge/chunks` direct URL. |
| **Sources** | → Cmd+K (Advanced) | Developer debugging tool for source attribution. Moved behind Advanced toggle in Knowledge detail view. |
| **Search** | → Cmd+K (Actions) | Similarity search is a developer/power-user action. Replaced by the global Cmd+K search which searches documents and chunks natively. |
| **Upload** | → Documents (FAB) | Upload is an *action on* documents, not a standalone page. Moved to a floating action button (FAB) on the Documents page + `Cmd+U` shortcut. |
| **Playground** | → Cmd+K (Advanced) | Internal testing tool. Power users access via `Cmd+K → "Open Playground"` or `/ai/playground`. |
| **Prompts** | → Cmd+K (Actions) | Prompt management is an action, not a page. `Cmd+K → "Manage Prompts"`. |
| **Widgets** | → Settings → Integrations | Widget configuration belongs in Settings, not a top-level nav item. |
| **API** | → Settings → API | API key management is a settings concern. |
| **Usage (bottom)** | → Analytics | Duplicate. Merged into unified Analytics page. |
| **Billing** | → Settings → Billing | Billing configuration belongs in Settings. |
| **Workspace** | → Settings → Workspace | Workspace management belongs in Settings. |

### 1.3 Competitive Benchmarking

| Product | Primary Nav Items | Notes |
|---|---|---|
| ChatGPT | 2 | Sidebar + thread list |
| Notion | 5 | Sidebar: Home, Search, Settings, + recent pages |
| Linear | 4-5 | Sidebar: Home, My Issues, Projects, Teams, Settings |
| Linear (with Cmd+K) | 3 visible | Most features via Command Palette |
| Vercel | 5 | Sidebar: Dashboard, Deployments, Analytics, Storage, Settings |
| **MimoNotes V2** | **6** | Home, Chat, Documents, Knowledge, Analytics, Settings |

---

## 2. New Sidebar Structure

### 2.1 Primary Items (6 max)

| # | Icon | Label | Route | Description |
|---|---|---|---|---|
| 1 | `Home` | **Home** | `/` | Dashboard overview: stat cards, recent chats, quick actions, system health |
| 2 | `MessageSquare` | **Chat** | `/chat` | Chat sessions list + active conversation |
| 3 | `FileText` | **Documents** | `/documents` | Document management: list, upload (FAB), status, bulk actions |
| 4 | `BookOpen` | **Knowledge** | `/knowledge` | Knowledge base explorer: search, browse chunks, source management |
| 5 | `BarChart3` | **Analytics** | `/analytics` | Unified analytics: usage, chat, cost (tabbed) |
| 6 | `Settings` | **Settings** | `/settings` | Consolidated settings: 6 tabs |

### 2.2 Sidebar Design Specs

#### Expanded State (240px)

```
┌──────────────────────────────┐
│  ◆ MimoNotes        [⌘\]   │  ← Logo + collapse toggle
├──────────────────────────────┤
│  ┌──────────────────────────┐│
│  │ 🏠  Home                 ││  ← Active: bg-accent, text-accent-foreground
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ 💬  Chat           (3)  ││  ← Badge: active sessions
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ 📄  Documents       (12)││  ← Badge: document count
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ 📚  Knowledge            ││
│  └──────────────────────────┘│
│  ┌──────────────────────────┐│
│  │ 📊  Analytics            ││
│  └──────────────────────────┘│
│                              │
│  ─────────────────────────── │  ← Divider
│                              │
│  ┌──────────────────────────┐│
│  │ ⚙️  Settings             ││
│  └──────────────────────────┘│
├──────────────────────────────┤
│  ┌──────────────────────────┐│
│  │ 👤  User Name            ││  ← User menu (profile, logout)
│  │     user@example.com     ││
│  └──────────────────────────┘│
└──────────────────────────────┘
```

#### Collapsed State (64px)

```
┌──────────┐
│  ◆       │  ← Logo only
├──────────┤
│  🏠      │  ← Icons only, no labels
│  💬  (3) │  ← Badge persists
│  📄 (12) │
│  📚      │
│  📊      │
│          │
│──────────│
│  ⚙️      │
├──────────┤
│  👤      │  ← User avatar
└──────────┘
```

#### Hover State (Collapsed → Tooltip)

When collapsed, hovering an icon shows a tooltip with label + keyboard shortcut:
```
┌────────────────────┐
│ 💬 Chat        ⌘2  │
└────────────────────┘
```

### 2.3 Active State Styling

- **Background:** `bg-accent` (subtle highlight, e.g., `rgba(0,0,0,0.05)` light / `rgba(255,255,255,0.08)` dark)
- **Text/Icon:** `text-accent-foreground` (high contrast)
- **Left border:** 2px solid `primary` color (active indicator)
- **Border radius:** `rounded-md` (6px)
- **Transition:** `150ms ease-out` for background, `200ms ease-out` for border

### 2.4 Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| `< 768px` (mobile) | Sidebar hidden. Bottom tab bar active. |
| `768px – 1024px` (tablet) | Collapsed (64px), icons only. Expand on hover/click. |
| `> 1024px` (desktop) | Expanded (240px), icons + labels. Toggle with `Cmd+\`. |
| `> 1440px` (large desktop) | Expanded (240px), optional: secondary panel (e.g., chat sessions list). |

---

## 3. Command Palette (Cmd+K)

### 3.1 Overview

The Command Palette is the **primary mechanism for accessing hidden/advanced features**. It replaces the need for 8+ sidebar items by providing instant keyboard-driven access to any page, action, or setting.

### 3.2 Trigger

- **Keyboard:** `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux)
- **UI:** Search icon in the top navigation bar (next to notifications)
- **Mobile:** Search icon in the top bar + pull-down gesture

### 3.3 Search Scope

| Category | Examples | Icon |
|---|---|---|
| **Pages** | Home, Chat, Documents, Analytics, Settings | `File` |
| **Actions** | New Chat, Upload Document, Export Data, Manage Prompts | `Zap` |
| **Documents** | (search by title, content preview) | `FileText` |
| **Settings** | AI Provider, Workspace, Billing, API Keys, Security | `Settings` |
| **Advanced** | Chunks, Sources, Playground, Similarity Search, Seed DB | `Terminal` |

### 3.4 Keyboard Navigation

| Key | Action |
|---|---|
| `↑` / `↓` | Navigate results |
| `Enter` | Select / Execute |
| `Shift+Enter` | Open in new tab (if applicable) |
| `Escape` | Close palette |
| `Tab` | Switch category (Pages → Actions → Settings → Advanced) |
| `Backspace` (on empty) | Clear search |
| `⌘+K` (while open) | Close palette |

### 3.5 Design Mockup Description

```
┌─────────────────────────────────────────────────────┐
│  🔍 Search pages, actions, documents...        ⌘K  │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐│
│  │ RECENT                                         ││
│  │  💬  Resume Q3 Analysis        2m ago          ││
│  │  📄  Financial Report 2024     1h ago          ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ PAGES                                          ││
│  │  🏠  Home                     /                 ││
│  │  💬  Chat                     /chat             ││
│  │  📄  Documents                /documents        ││
│  │  📚  Knowledge                /knowledge        ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ ACTIONS                                        ││
│  │  ➕  New Chat                 ⌘N               ││
│  │  📤  Upload Document          ⌘U               ││
│  │  🔄  Switch Workspace                         ││
│  │  📋  Manage Prompts                            ││
│  └─────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────┐│
│  │ ADVANCED                                       ││
│  │  🔬  Open Playground                          ││
│  │  📊  View Chunks                             ││
│  │  🔍  Similarity Search                       ││
│  │  🌐  Source Viewer                           ││
│  └─────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────┤
│  ↑↓ Navigate  ↵ Select  ⌘K Close  ⇥ Switch Group ││
└─────────────────────────────────────────────────────┘
```

### 3.6 Fuzzy Matching

- Use fuzzy matching (e.g., `flexsearch` or `fuse.js`) for search
- Score results by: exact match > prefix > contains > fuzzy
- Weight recent items higher in the list
- Highlight matched characters in results

### 3.7 Quick Actions

| Action | Trigger | Description |
|---|---|---|
| New Chat | `Cmd+N` | Creates new chat session, navigates to `/chat` |
| Upload Document | `Cmd+U` | Opens file picker, navigates to `/documents` after upload |
| Switch Workspace | `Cmd+Shift+W` | Opens workspace switcher modal |
| Toggle Sidebar | `Cmd+\` | Collapses/expands sidebar |
| Show Shortcuts | `Cmd+/` | Opens keyboard shortcuts reference |
| Export Data | `Cmd+E` | Opens export dialog (CSV/JSON) |

---

## 4. Breadcrumb System

### 4.1 When to Show Breadcrumbs

Show breadcrumbs on all pages **except**:
- Top-level pages (Home, Chat list, Documents list, Analytics, Settings)
- Auth pages (Login, Register)
- Public pages (Landing, Pricing)

**Show breadcrumbs on:**
- Document detail: `Documents > Financial Report 2024`
- Chat session: `Chat > Resume Q3 Analysis`
- Knowledge sub-pages: `Knowledge > Search Results`
- Settings sub-tabs: `Settings > AI Provider`
- Analytics sub-tabs: `Analytics > Cost`
- Any page depth > 1

### 4.2 Breadcrumb Style

```
Documents > Financial Report 2024
     ↑           ↑
  clickable    current (not clickable)
```

- **Separator:** `ChevronRight` icon (16px), not `/` or `>` text
- **Separator color:** `text-muted-foreground`
- **Separator spacing:** `mx-2` (8px each side)
- **Item style:** `text-sm text-muted-foreground hover:text-foreground transition-colors`
- **Current page:** `text-sm font-medium text-foreground` (not a link)
- **Truncation:** If breadcrumb > 3 levels, collapse middle items with `...` ellipsis
  - Example: `Documents > ... > Report > Q3 Section`

### 4.3 Breadcrumb Position

- **Desktop:** Below the top navigation bar, above the page content
- **Mobile:** Below the top navigation bar, with horizontal scroll if needed
- **Height:** `40px` (fixed)
- **Background:** Same as page background (no separator line)

### 4.4 Mobile Breadcrumb Behavior

- Breadcrumbs scroll horizontally if overflow
- Current page is always visible (sticky to right edge)
- Long breadcrumb items truncate with ellipsis
- Max visible items: 2 on mobile (current + parent)
- Tap on breadcrumb item navigates directly

### 4.5 Breadcrumb Data Structure

```typescript
interface BreadcrumbItem {
  label: string;        // Display text
  href?: string;        // Link (undefined = current page, not clickable)
  icon?: LucideIcon;    // Optional leading icon
  truncatable?: boolean; // Can be collapsed in "..." overflow
}

// Example
const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'Financial Report 2024' },  // current — no href
];
```

---

## 5. Settings Consolidation

### 5.1 Current State: 6 Scattered Locations

| Current Location | What's There | New Location |
|---|---|---|
| `/admin/settings` | AI provider config | `/settings` → AI Provider tab |
| Bottom nav: Workspace | Workspace settings | `/settings` → Workspace tab |
| Bottom nav: Billing | Billing & plans | `/settings` → Billing tab |
| Bottom nav: Usage | Usage stats | `/analytics` (merged) |
| Integrations: API | API keys | `/settings` → API tab |
| Integrations: Widgets | Widget config | `/settings` → Integrations tab |

### 5.2 Proposed: Single `/settings` Page with Tabs

```
┌──────────────────────────────────────────────────────┐
│  Settings                                            │
├──────────────────────────────────────────────────────┤
│  ┌──────┬──────┬───────┬────────┬─────┬───────────┐  │
│  │General│AI    │Workspace│Billing│ API │ Security │  │
│  │      │Provider│       │       │     │          │  │
│  └──────┴──────┴───────┴────────┴─────┴───────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────────┐│
│  │                                                  ││
│  │  [Tab content renders here]                      ││
│  │                                                  ││
│  └──────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

### 5.3 Tab Structure & Content

#### General (`/settings` or `/settings?tab=general`)
- Workspace name & description
- Default language
- Theme (light/dark/system)
- Timezone
- Notification preferences
- Data export / account deletion

#### AI Provider (`/settings?tab=ai`)
- Provider selector (Mimo Pro, OpenAI, LM Studio, Ollama, OpenRouter, Custom)
- API key input (masked)
- Model selection
- Temperature / max tokens sliders
- Test connection button
- Model status indicators

#### Workspace (`/settings?tab=workspace`)
- Workspace members (invite/remove)
- Role management (admin, member, viewer)
- Workspace limits (documents, storage)
- Transfer ownership

#### Billing (`/settings?tab=billing`)
- Current plan display
- Upgrade/downgrade
- Payment method
- Invoice history
- Usage metering

#### API (`/settings?tab=api`)
- API keys list (create/revoke)
- API usage stats
- Rate limits display
- Webhook configuration
- API documentation link

#### Security (`/settings?tab=security`)
- Change password
- Two-factor authentication
- Active sessions
- Login history
- API key rotation

### 5.4 Settings Navigation Pattern

- Tabs are horizontal on desktop, vertical scroll on mobile
- URL reflects current tab: `/settings?tab=billing`
- Deep linking works: share `/settings?tab=api` directly
- Active tab has bottom border indicator (2px solid primary)
- Tab icons: `Settings`, `Brain`, `Building`, `CreditCard`, `Key`, `Shield`

---

## 6. Mobile Navigation

### 6.1 Bottom Tab Bar (5 Items Max)

```
┌─────────────────────────────────────────────┐
│                                             │
│  [Page Content - Full Screen]               │
│                                             │
├─────────────────────────────────────────────┤
│  🏠      💬      📄      ⚙️     •••       │
│  Home    Chat  Documents  Settings  More    │
└─────────────────────────────────────────────┘
```

| Tab | Icon | Route | Badge |
|---|---|---|---|
| Home | `Home` | `/` | — |
| Chat | `MessageSquare` | `/chat` | Active session count |
| Documents | `FileText` | `/documents` | — |
| Settings | `Settings` | `/settings` | — |
| More | `MoreHorizontal` | (opens sheet) | — |

### 6.2 "More" Sheet

The "More" tab opens a bottom sheet with:
- **Knowledge** → `/knowledge`
- **Analytics** → `/analytics`
- **Playground** → `/ai/playground` (if Advanced enabled)
- **Prompts** → `/ai/prompts`
- **Widgets** → `/settings?tab=integrations`
- **API Keys** → `/settings?tab=api`

Sheet design:
- Bottom sheet (not modal)
- Drag handle at top
- Swipe down to dismiss
- Items styled as list with icons

### 6.3 Swipe Gestures

| Gesture | Action |
|---|---|
| Swipe left on Chat tab | Previous chat session |
| Swipe right on Chat tab | Next chat session |
| Swipe down on any page | Pull-to-refresh (if supported) |
| Swipe from left edge | Back navigation (browser native) |

### 6.4 Pull-to-Refresh

- Available on: Documents list, Chat sessions list, Knowledge list
- Visual: Custom spinner with MimoNotes branding
- Haptic feedback on trigger (if supported)
- Not available on: Chat conversation (real-time), Settings (static)

### 6.5 Full-Screen Chat on Mobile

- Chat takes full screen (no sidebar, no bottom nav)
- Top bar: Back arrow + session title + more menu (⋯)
- Bottom: Input field + send button
- Swipe up to see chat sessions list
- Messages support long-press for copy/reply
- Source cards expand to full width

### 6.6 Mobile Breakpoint Behavior

| Width | Bottom Nav | Sidebar | Top Nav |
|---|---|---|---|
| `< 640px` | ✅ Visible | ❌ Hidden | Compact (logo + search + more) |
| `640px – 768px` | ✅ Visible | ❌ Hidden | Standard (logo + search + user) |
| `768px – 1024px` | ❌ Hidden | 📌 Collapsed (64px) | Standard |
| `> 1024px` | ❌ Hidden | 📌 Expanded (240px) | Standard |

---

## 7. Hidden Features Strategy

### 7.1 Features Moved to Command Palette

| Feature | Access Method | Priority |
|---|---|---|
| Chunks Viewer | `Cmd+K → "View Chunks"` | Advanced |
| Source Viewer | `Cmd+K → "Source Viewer"` | Advanced |
| Similarity Search | `Cmd+K → "Similarity Search"` | Advanced |
| Playground | `Cmd+K → "Open Playground"` | Advanced |
| Manage Prompts | `Cmd+K → "Manage Prompts"` | Actions |
| Seed Database | `Cmd+K → "Seed Database"` | Advanced |

### 7.2 Features Moved to Context Menus

| Feature | Context Menu Location |
|---|---|
| Delete Document | Right-click on document row |
| Rename Chat Session | Right-click on session in sidebar |
| Duplicate Prompt | Right-click on prompt card |
| Export as PDF | Right-click on document or chat |
| View Source | Right-click on source citation in chat |

### 7.3 Features Behind 'Advanced' Toggle

The "Advanced" toggle is accessible via:
- `Cmd+K → "Toggle Advanced Mode"`
- Settings → General → Developer → Advanced Mode toggle

When enabled, the following become visible in the sidebar:
- Knowledge section expands to show: Documents, Chunks, Sources, Search
- AI section appears: Playground, Prompts
- Debug panel available on all pages

**Default:** OFF for all users. ON for users with `role: admin`.

### 7.4 Features Only Accessible via Direct URL

| Route | Description | Why Hidden |
|---|---|---|
| `/debug` | Debug console | Internal tool |
| `/admin/seed` | Database seeder | DevOps tool |
| `/api/docs` | API documentation | Developer only |
| `/health` | Health check endpoint | System monitoring |

These routes:
- Are not linked anywhere in the UI
- Return 404 for non-admin users
- Are documented in the API docs only
- Can be accessed by typing the URL directly

### 7.5 Discoverability Strategy

To ensure hidden features remain discoverable:

1. **Onboarding tooltip:** On first login, show: "Press ⌘K to access all features and search"
2. **Empty state hints:** When Documents page is empty: "Drop files here or press ⌘U to upload"
3. **Help menu:** `?` icon in top nav opens a help panel listing all shortcuts
4. **Contextual hints:** When viewing a document, show: "Press ⌘K → View Chunks to see document processing details"
5. **Power user mode:** Auto-enable Advanced for users who use keyboard shortcuts > 50 times

---

## 8. Route Mapping

### 8.1 Current → Proposed Route Map

| Current Route | New Route | Redirect Type | Notes |
|---|---|---|---|
| `/` | `/` | — | No change |
| `/dashboard` | `/` | 301 | Merged into Home |
| `/chat` | `/chat` | — | No change |
| `/chat/[id]` | `/chat/[id]` | — | No change |
| `/documents` | `/documents` | — | No change |
| `/documents/upload` | `/documents` | 301 | Upload via FAB |
| `/knowledge/documents` | `/documents` | 301 | Merged into Documents |
| `/knowledge/documents/[id]` | `/documents/[id]` | 301 | Merged |
| `/knowledge/chunks` | `/knowledge` | 301 | Chunks accessible via Cmd+K |
| `/knowledge/search` | `/knowledge` | 301 | Search accessible via Cmd+K |
| `/knowledge/sources` | `/knowledge` | 301 | Sources accessible via Cmd+K |
| `/analytics/usage` | `/analytics?tab=usage` | 301 | Merged into Analytics |
| `/analytics/chat` | `/analytics?tab=chat` | 301 | Merged into Analytics |
| `/analytics/cost` | `/analytics?tab=cost` | 301 | Merged into Analytics |
| `/ai/playground` | `/ai/playground` | — | No change (hidden) |
| `/ai/prompts` | `/ai/prompts` | — | No change (hidden) |
| `/ai/prompts/new` | `/ai/prompts/new` | — | No change (hidden) |
| `/ai/prompts/[id]` | `/ai/prompts/[id]` | — | No change (hidden) |
| `/admin/settings` | `/settings?tab=ai` | 301 | Merged into Settings |
| `/settings` | `/settings` | — | No change (consolidated) |
| `/workspace` | `/settings?tab=workspace` | 301 | Merged into Settings |
| `/billing` | `/settings?tab=billing` | 301 | Merged into Settings |
| `/integrations/widgets` | `/settings?tab=integrations` | 301 | Merged into Settings |
| `/integrations/api` | `/settings?tab=api` | 301 | Merged into Settings |
| `/login` | `/login` | — | No change |
| `/register` | `/register` | — | No change |

### 8.2 New Route List (20 Routes)

| Route | Page | Sidebar Item |
|---|---|---|
| `/` | Home (Dashboard) | Home |
| `/chat` | Chat Sessions | Chat |
| `/chat/[id]` | Chat Conversation | Chat |
| `/documents` | Document List | Documents |
| `/documents/[id]` | Document Detail | Documents |
| `/knowledge` | Knowledge Explorer | Knowledge |
| `/analytics` | Analytics Dashboard | Analytics |
| `/settings` | Settings (General) | Settings |
| `/settings?tab=ai` | Settings (AI Provider) | Settings |
| `/settings?tab=workspace` | Settings (Workspace) | Settings |
| `/settings?tab=billing` | Settings (Billing) | Settings |
| `/settings?tab=api` | Settings (API) | Settings |
| `/settings?tab=security` | Settings (Security) | Settings |
| `/ai/playground` | AI Playground | Hidden (Cmd+K) |
| `/ai/prompts` | Prompt Templates | Hidden (Cmd+K) |
| `/ai/prompts/new` | Create Prompt | Hidden (Cmd+K) |
| `/ai/prompts/[id]` | Edit Prompt | Hidden (Cmd+K) |
| `/login` | Login | Auth |
| `/register` | Register | Auth |
| `/debug` | Debug Console | Hidden (Admin) |

### 8.3 Redirect Implementation

```typescript
// middleware.ts or next.config.ts redirects
const redirects = [
  { source: '/dashboard', destination: '/', permanent: true },
  { source: '/documents/upload', destination: '/documents', permanent: true },
  { source: '/knowledge/documents', destination: '/documents', permanent: true },
  { source: '/knowledge/documents/:id', destination: '/documents/:id', permanent: true },
  { source: '/knowledge/chunks', destination: '/knowledge', permanent: true },
  { source: '/knowledge/search', destination: '/knowledge', permanent: true },
  { source: '/knowledge/sources', destination: '/knowledge', permanent: true },
  { source: '/analytics/usage', destination: '/analytics?tab=usage', permanent: true },
  { source: '/analytics/chat', destination: '/analytics?tab=chat', permanent: true },
  { source: '/analytics/cost', destination: '/analytics?tab=cost', permanent: true },
  { source: '/admin/settings', destination: '/settings?tab=ai', permanent: true },
  { source: '/workspace', destination: '/settings?tab=workspace', permanent: true },
  { source: '/billing', destination: '/settings?tab=billing', permanent: true },
  { source: '/integrations/widgets', destination: '/settings?tab=integrations', permanent: true },
  { source: '/integrations/api', destination: '/settings?tab=api', permanent: true },
];
```

### 8.4 404 Handling

- Custom 404 page with search bar (Cmd+K hint)
- "Page not found. Try searching with ⌘K."
- Recent pages listed below
- Link to Home
- Auto-redirect to `/` after 10 seconds (with countdown)

---

## 9. Keyboard Shortcuts

### 9.1 Global Shortcuts

| Shortcut | Action | Platform |
|---|---|---|
| `Cmd+K` / `Ctrl+K` | Open Command Palette | All |
| `Cmd+N` / `Ctrl+N` | New Chat | All |
| `Cmd+U` / `Ctrl+U` | Upload Document | All |
| `Cmd+/` / `Ctrl+/` | Show Keyboard Shortcuts | All |
| `Cmd+\` / `Ctrl+\` | Toggle Sidebar | All |
| `Escape` | Close modal/palette/panel | All |
| `?` | Show shortcuts (when not in input) | Desktop |

### 9.2 Navigation Shortcuts

| Shortcut | Action |
|---|---|
| `⌘+1` | Go to Home |
| `⌘+2` | Go to Chat |
| `⌘+3` | Go to Documents |
| `⌘+4` | Go to Knowledge |
| `⌘+5` | Go to Analytics |
| `⌘+6` | Go to Settings |

### 9.3 List Navigation

| Key | Action |
|---|---|
| `↑` / `↓` | Move up/down in list |
| `Enter` | Open selected item |
| `Space` | Select/toggle item (multi-select mode) |
| `Shift+↑/↓` | Extend selection |
| `⌘+A` | Select all (in multi-select mode) |
| `Delete` / `Backspace` | Delete selected items |

### 9.4 Chat-Specific Shortcuts

| Shortcut | Action |
|---|---|
| `Enter` | Send message |
| `Shift+Enter` | New line in message |
| `⌘+Enter` | Send with streaming |
| `↑` (in empty input) | Edit last message |
| `⌘+Shift+C` | Copy last response |
| `⌘+Shift+R` | Regenerate last response |

### 9.5 Shortcut Reference Panel

Triggered by `Cmd+/` or clicking `?` in the top nav:

```
┌─────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                           [×]  │
├─────────────────────────────────────────────────────┤
│  GENERAL                                            │
│  ⌘K        Command Palette                          │
│  ⌘N        New Chat                                │
│  ⌘U        Upload Document                         │
│  ⌘\        Toggle Sidebar                          │
│  ⌘/        Show Shortcuts                          │
│  Esc       Close Panel                             │
├─────────────────────────────────────────────────────┤
│  NAVIGATION                                         │
│  ⌘1-6      Go to Page 1-6                         │
│  ↑↓        Navigate Lists                          │
│  Enter     Open Selected                           │
├─────────────────────────────────────────────────────┤
│  CHAT                                               │
│  Enter     Send Message                            │
│  Shift+Enter  New Line                             │
│  ↑         Edit Last Message                       │
│  ⌘⇧R       Regenerate                             │
├─────────────────────────────────────────────────────┤
│  Press any key combination to search...             │
└─────────────────────────────────────────────────────┘
```

---

## 10. Implementation Specs

### 10.1 Component Structure

```
components/
├── layout/
│   ├── AppShell.tsx              # Root shell: sidebar + topbar + content
│   ├── AppSidebar.tsx            # Sidebar container (collapsed/expanded)
│   ├── SidebarItem.tsx           # Individual sidebar item
│   ├── SidebarSection.tsx        # Sidebar section (group of items)
│   ├── TopNav.tsx                # Top navigation bar
│   ├── Breadcrumbs.tsx           # Breadcrumb component
│   ├── MobileNav.tsx             # Bottom tab bar (mobile)
│   └── MobileMoreSheet.tsx       # "More" bottom sheet
├── command-palette/
│   ├── CommandPalette.tsx        # Main palette container
│   ├── CommandInput.tsx          # Search input
│   ├── CommandList.tsx           # Results list
│   ├── CommandItem.tsx           # Individual result item
│   ├── CommandGroup.tsx          # Grouped results (Recent, Pages, etc.)
│   └── CommandFooter.tsx         # Footer with keyboard hints
└── settings/
    ├── SettingsLayout.tsx        # Settings page with tabs
    ├── SettingsTab.tsx           # Individual tab component
    ├── GeneralSettings.tsx       # General tab
    ├── AISettings.tsx            # AI Provider tab
    ├── WorkspaceSettings.tsx     # Workspace tab
    ├── BillingSettings.tsx       # Billing tab
    ├── APISettings.tsx           # API tab
    └── SecuritySettings.tsx      # Security tab
```

### 10.2 State Management

```typescript
// Navigation state (Zustand or React Context)
interface NavigationState {
  // Sidebar
  sidebarCollapsed: boolean;
  sidebarHovered: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Command Palette
  commandPaletteOpen: boolean;
  commandPaletteQuery: string;
  commandPaletteCategory: 'all' | 'pages' | 'actions' | 'settings' | 'advanced';
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setCommandPaletteQuery: (query: string) => void;
  setCommandPaletteCategory: (category: string) => void;

  // Breadcrumbs
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;

  // Mobile
  mobileNavVisible: boolean;
  moreSheetOpen: boolean;
  toggleMoreSheet: () => void;

  // Settings
  activeSettingsTab: string;
  setActiveSettingsTab: (tab: string) => void;

  // Advanced mode
  advancedMode: boolean;
  toggleAdvancedMode: () => void;

  // Recent items (for Command Palette)
  recentItems: RecentItem[];
  addRecentItem: (item: RecentItem) => void;
}
```

### 10.3 URL Patterns

```
/                           → Home
/chat                       → Chat list
/chat/[id]                  → Chat conversation
/chat/[id]?ref=[docId]      → Chat with document context
/documents                  → Document list
/documents?status=ready     → Filtered documents
/documents/[id]             → Document detail
/documents/[id]?tab=chunks  → Document detail, chunks tab
/knowledge                  → Knowledge explorer
/knowledge?q=search+term    → Knowledge search results
/analytics                  → Analytics (default: usage tab)
/analytics?tab=cost         → Analytics cost tab
/analytics?range=30d        → Analytics with date range
/settings                   → Settings (default: general tab)
/settings?tab=ai            → Settings AI tab
/ai/playground              → Playground (hidden)
/ai/prompts                 → Prompts list (hidden)
/login                      → Login
/register                   → Register
```

### 10.4 Accessibility Requirements

#### WCAG 2.1 AA Compliance

| Requirement | Implementation |
|---|---|
| **Keyboard navigation** | All interactive elements focusable via Tab. Sidebar items focusable. Command Palette fully keyboard-navigable. |
| **Focus management** | Command Palette: focus trap. Modal dialogs: focus trap. Sidebar: focus visible on active item. |
| **ARIA labels** | Sidebar: `role="navigation"`, `aria-label="Main navigation"`. Command Palette: `role="dialog"`, `aria-label="Command palette"`. |
| **Screen readers** | Sidebar items: `aria-current="page"` for active. Badges: `aria-label="3 active sessions"`. |
| **Color contrast** | All text meets 4.5:1 contrast ratio. Active state: 7:1 contrast. Focus ring: 3:1 contrast against background. |
| **Reduced motion** | Respect `prefers-reduced-motion`: disable sidebar collapse animation, palette open/close animation. |
| **Touch targets** | Mobile: minimum 44×44px touch targets. Bottom nav: 48px height. |

#### Keyboard Accessibility Specifics

- **Tab order:** Logo → Sidebar items (top to bottom) → Top nav → Content → Bottom nav (mobile)
- **Focus visible:** `ring-2 ring-primary ring-offset-2` on all interactive elements
- **Skip link:** "Skip to main content" link at top of page (visible on Tab)
- **Command Palette:** Focus auto-placed in search input when opened. Arrow keys navigate results. Enter selects.
- **Escape:** Always closes the topmost modal/palette without performing action

#### Mobile Accessibility

- Bottom nav items have `role="tab"`, container has `role="tablist"`
- Active tab: `aria-selected="true"`
- Swipe gestures have button alternatives
- Pull-to-refresh has a button alternative in the header

### 10.5 Performance Considerations

- **Command Palette:** Lazy-load search index. Use `useDeferredValue` for search query. Virtualize long result lists (> 50 items).
- **Sidebar:** Render collapsed state by default, expand on hover with CSS transition (no re-render).
- **Breadcrumbs:** Compute from route, not state. Use `useMemo` with route as dependency.
- **Mobile Nav:** Fixed position, `will-change: transform` for smooth transitions.
- **Analytics tabs:** Lazy-load tab content. Only fetch data for active tab.

### 10.6 Migration Checklist

- [ ] Create new sidebar component (`AppSidebar.tsx`)
- [ ] Create Command Palette component (`CommandPalette.tsx`)
- [ ] Create Breadcrumb component (`Breadcrumbs.tsx`)
- [ ] Create Mobile Navigation (`MobileNav.tsx`)
- [ ] Consolidate Settings into tabbed page
- [ ] Add redirects for old routes
- [ ] Update all internal links to new routes
- [ ] Add keyboard shortcuts
- [ ] Add focus management and ARIA labels
- [ ] Test with screen readers (VoiceOver, NVDA)
- [ ] Test keyboard-only navigation
- [ ] Test on mobile devices (iOS Safari, Android Chrome)
- [ ] Add analytics tracking for navigation events
- [ ] Update documentation and onboarding flows
- [ ] Performance audit (Lighthouse, Core Web Vitals)

---

## Appendix A: Design Tokens

```css
/* Sidebar */
--sidebar-width-expanded: 240px;
--sidebar-width-collapsed: 64px;
--sidebar-transition: 200ms ease-out;
--sidebar-bg: var(--background);
--sidebar-border: var(--border);
--sidebar-item-radius: 6px;
--sidebar-item-padding: 8px 12px;
--sidebar-item-gap: 2px;

/* Command Palette */
--palette-width: 560px;
--palette-max-height: 480px;
--palette-radius: 12px;
--palette-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
--palette-input-height: 48px;
--palette-item-height: 40px;
--palette-group-gap: 8px;

/* Breadcrumbs */
--breadcrumb-height: 40px;
--breadcrumb-separator-size: 16px;
--breadcrumb-gap: 8px;

/* Mobile Bottom Nav */
--mobile-nav-height: 56px;
--mobile-nav-item-size: 48px;
--mobile-nav-icon-size: 24px;
--mobile-nav-label-size: 10px;

/* Settings */
--settings-tab-height: 44px;
--settings-content-max-width: 640px;
--settings-section-gap: 32px;
```

## Appendix B: Figma Link

> [Figma: MimoNotes V2 Navigation Redesign](https://figma.com/file/mimotes-v2-nav)
> *Placeholder — update with actual Figma URL after design review*

## Appendix C: Changelog

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0.0 | 2026-06-13 | Staff UX Designer | Initial specification |

---

*This document is the definitive navigation blueprint for MimoNotes V2. All navigation decisions should reference this spec. For questions, contact the Design team.*
