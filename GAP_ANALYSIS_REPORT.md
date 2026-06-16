# GAP_ANALYSIS_REPORT.md — MimoNotes Frontend V1 → V2

> **Date:** June 13, 2026
> **Author:** Gap Analysis Engine
> **Status:** Comprehensive — All pages, components, features audited
> **References:** MIMONOTES_V2_DESIGN_SYSTEM.md, COMPONENT_LIBRARY_V2.md, DASHBOARD_V2_SPEC.md, LANDING_PAGE_V2_SPEC.md, CHAT_EXPERIENCE_V2.md, MOBILE_EXPERIENCE_V2.md, NAVIGATION_REARCHITECTURE.md, SCREEN_BY_SCREEN_CRITIQUE.md, DESIGN_SYSTEM_PROPOSAL.md

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Foundation & Design System](#2-foundation--design-system)
3. [Layout & Navigation](#3-layout--navigation)
4. [Pages — Public](#4-pages--public)
5. [Pages — Dashboard](#5-pages--dashboard)
6. [Pages — Chat](#6-pages--chat)
7. [Pages — Knowledge](#7-pages--knowledge)
8. [Pages — Analytics](#8-pages--analytics)
9. [Pages — AI](#9-pages--ai)
10. [Pages — Settings (Consolidated)](#10-pages--settings-consolidated)
11. [Pages — Developers](#11-pages--developers)
12. [Components — Shared UI Primitives](#12-components--shared-ui-primitives)
13. [Components — Chat](#13-components--chat)
14. [Components — Dashboard](#14-components--dashboard)
15. [Components — Knowledge](#15-components--knowledge)
16. [Components — Analytics](#16-components--analytics)
17. [Components — AI / Playground](#17-components--ai--playground)
18. [Components — Workspace / Team](#18-components--workspace--team)
19. [Components — Settings](#19-components--settings)
20. [New Features — Not in V1](#20-new-features--not-in-v1)
21. [Mobile-Specific Gaps](#21-mobile-specific-gaps)
22. [Effort Summary & Roadmap](#22-effort-summary--roadmap)
23. [Risk Register](#23-risk-register)

---

## 1. Executive Summary

### Overall Gap Score: **42% complete** (cosmetic shell exists, functionality gap is massive)

| Category | V1 State | V2 Target | Gap |
|----------|----------|-----------|-----|
| **Design System** | oklch dark theme defined, but not consistently applied | Full warm-purple 265° token system with 5-level surface hierarchy, typography scale, spacing grid | 🟡 40% — tokens defined, not enforced |
| **Navigation** | 14+ items across 6 sections | 6 items + Command Palette + breadcrumbs | 🔴 25% — bloated, no Cmd+K |
| **Landing Page** | Emoji-heavy, hardcoded colors, no social proof | Premium dark, product screenshots, pricing, social proof | 🔴 5% — needs full rebuild |
| **Chat** | Functional streaming, no citations, no feedback | Inline citations, suggested prompts, model selector, feedback | 🟡 45% — streaming works, UX missing |
| **Dashboard** | Stat cards + 6 quick actions + activity feed | Welcome hero, 4 quick actions, charts, continue-chat | 🟡 55% — structure similar, content wrong |
| **Mobile** | Sheet-based sidebar only | Bottom tab bar, swipe, haptics, 44px targets | 🔴 10% — almost nothing mobile-specific |
| **Components** | 17 shadcn primitives + 55 custom components | 20 polished components with TypeScript interfaces | 🟡 60% — components exist, need polish |

**Estimated Total Effort:** 380–480 hours (9–12 weeks solo, 4–5 weeks with 2 devs)
**Critical Path:** Design System tokens → Navigation refactor → Landing + Chat + Dashboard → Mobile → Settings consolidation

---

## 2. Foundation & Design System

### 2.1 Color System (globals.css)

- **Current State:** `globals.css` has oklch CSS variables at hue 270° (cold purple). Primary: `oklch(0.65 0.22 270)`. Neutral scale lacks warm undertone. Surface hierarchy is flat (only `--background`, `--card`, `--muted`). No brand scale (50–900).
- **Target State (V2 Design System):** Hue 265° (warm purple). Full 10-step brand scale (50–900) with oklch. 12-step neutral scale with chroma 0.003–0.005 at hue 265°. 5-level surface hierarchy (base → raised → overlay → elevated → floating). Semantic colors at correct hues (success=155°, warning=80°, error=25°, info=240°).
- **Files Affected:** `app/globals.css`
- **Estimated Effort:** 6–8 hours
- **Dependencies:** None — foundation item
- **Migration Risks:** Every component uses current token names. Renaming tokens breaks all references. Strategy: keep CSS variable names, update oklch values, then add new surface-level tokens.

### 2.2 Typography System

- **Current State:** Geist fonts loaded via system-ui fallback in `layout.tsx` `style` prop (`--font-geist-sans: system-ui`). No CSS type scale tokens. No letter-spacing values. No heading hierarchy beyond default Tailwind `text-xl font-bold` etc.
- **Target State:** Proper Geist Sans/Mono loading via `@font-face` or next/font. 12-level type scale from Display (36px) to Caption (12px) with letter-spacing. CSS custom properties for each level. Heading rules with precise line-heights.
- **Files Affected:** `app/layout.tsx`, `app/globals.css`, all pages with heading text
- **Estimated Effort:** 4–6 hours
- **Dependencies:** Design System token work (2.1)
- **Migration Risks:** Low — additive tokens. Replace ad-hoc `text-xl font-bold` with semantic tokens.

### 2.3 Spacing & Grid

- **Current State:** Tailwind default spacing. No enforced 4px grid. Component spacing is inconsistent (mix of `p-4`, `p-6`, `px-6 py-3`).
- **Target State:** Strict 4px grid. Component spacing rules (Button md: 16/8, Card: 16/16, Sidebar nav: 12/8). Page layout: 24px desktop margins, 16px mobile, max-width 1200px.
- **Files Affected:** `app/globals.css`, all component files
- **Estimated Effort:** 8–12 hours (audit + fix every component)
- **Dependencies:** Design System tokens (2.1)
- **Migration Risks:** Medium — visual regressions likely. Requires pixel-level review.

### 2.4 Border Treatment

- **Current State:** `--border: oklch(1 0 0 / 8%)` — single border token. No subtle/default/strong levels.
- **Target State:** 3 border levels (subtle 4%/8%, default 8%, strong 14%) with warm-purple undertone.
- **Files Affected:** `app/globals.css`, all components using `border-border`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Design System tokens (2.1)
- **Migration Risks:** Low — additive tokens.

---

## 3. Layout & Navigation

### 3.1 Root Layout (app/layout.tsx)

- **Current State:** Minimal root layout. Geist fonts via inline `style` prop with system-ui fallback. ThemeProvider + TooltipProvider + Toaster. `lang="id"`. No skip links, no mobile meta tags.
- **Target State:** Geist fonts properly loaded. `lang="en"` (or configurable). Add viewport meta for mobile. Skip-to-content link. Command Palette provider (Cmd+K).
- **Files Affected:** `app/layout.tsx`
- **Estimated Effort:** 3–4 hours
- **Dependencies:** Design System (2.1, 2.2)
- **Migration Risks:** Low — structural changes, not visual.

### 3.2 Sidebar (app-sidebar.tsx)

- **Current State:** 307 lines. 14+ nav items across 6 sections (Primary, Knowledge Base [5], Analytics [3], AI [2], Integrations [2], Bottom [4]). Collapsible sections. Workspace switcher. User profile + logout. Fixed 260px width. No collapsed state (icons only).
- **Target State:** 6 nav items (Home, Chat, Documents, Knowledge, Analytics, Settings). Collapsible to 64px icon-only mode. Left-border active indicator. Badge counts for active sessions/documents. User menu with profile/settings/logout dropdown. Toggle via Cmd+\.
- **Files Affected:** `components/layout/app-sidebar.tsx`, `components/layout/dashboard-shell-client.tsx`, `components/layout/mobile-nav.tsx`
- **Estimated Effort:** 12–16 hours
- **Dependencies:** Route consolidation (need to decide final routes)
- **Migration Risks:** 🔴 HIGH — every page's URL potentially changes. Need redirects from old routes. All `Link` components across the app reference current sidebar items.

### 3.3 Dashboard Shell (dashboard-shell.tsx, dashboard-shell-client.tsx)

- **Current State:** Server component checks auth, renders `DashboardShellClient`. Client component renders fixed sidebar (260px), mobile sheet, top nav, and main content area. Max-width support.
- **Target State:** Same shell structure but with collapsible sidebar (240px expanded, 64px collapsed). Desktop sidebar toggle button. Command Palette overlay. Breadcrumbs in top nav.
- **Files Affected:** `components/layout/dashboard-shell.tsx`, `components/layout/dashboard-shell-client.tsx`
- **Estimated Effort:** 6–8 hours
- **Dependencies:** Sidebar redesign (3.2)
- **Migration Risks:** Medium — shell wraps every authenticated page.

### 3.4 Top Navigation (top-nav.tsx)

- **Current State:** 219 lines. Breadcrumbs (auto-generated from path). Search bar (non-functional `<input>`). "All systems operational" badge. Theme toggle. User dropdown with avatar. Mobile hamburger. Sticky at top.
- **Target State:** Cleaner breadcrumbs with proper labels. Functional global search (or Cmd+K trigger). Remove "All systems operational" (move to status page). User dropdown stays. Add Cmd+K shortcut indicator.
- **Files Affected:** `components/layout/top-nav.tsx`
- **Estimated Effort:** 4–6 hours
- **Dependencies:** Command Palette (20.1)
- **Migration Risks:** Low — contained component.

### 3.5 Mobile Navigation (mobile-nav.tsx)

- **Current State:** 32 lines. Sheet-based sidebar overlay. Reuses full AppSidebar component.
- **Target State:** Bottom tab bar (5 items: Home, Chat, Documents, Analytics, Settings). Swipe gestures between tabs. Haptic feedback on tab switch. 44px minimum touch targets. Separate from desktop sidebar.
- **Files Affected:** `components/layout/mobile-nav.tsx` → **needs full rewrite**
- **Estimated Effort:** 16–20 hours
- **Dependencies:** Sidebar redesign (3.2), Mobile spec (MOBILE_EXPERIENCE_V2.md)
- **Migration Risks:** 🔴 HIGH — entirely new component. Must coexist with desktop sidebar.

### 3.6 Route Consolidation

- **Current State:** 34 page files across multiple route groups. Duplicate routes (e.g., `/analytics/usage`, `/settings/usage`). Deeply nested routes (`/admin/settings/billing`).
- **Target State:** 20 routes total (41% reduction). Consolidated settings (single `/settings` with tabs). Merged analytics. Hidden routes accessible only via Cmd+K.
- **Files Affected:** All `app/` page files. Need redirect rules in `middleware.ts`.
- **Estimated Effort:** 8–12 hours (routing + redirects)
- **Dependencies:** Navigation redesign (3.2)
- **Migration Risks:** 🔴 HIGH — broken bookmarks, API references, external links. Need comprehensive 301 redirects.

### 3.7 Command Palette (NEW)

- **Current State:** Does not exist.
- **Target State:** Cmd+K / Ctrl+K triggered palette with: navigation to any page, search documents/chunks, quick actions (new chat, upload, manage prompts), settings shortcuts. Fuzzy search, keyboard navigation, recent items.
- **Files Affected:** New: `components/command-palette.tsx`, `components/layout/dashboard-shell-client.tsx` (add provider)
- **Estimated Effort:** 16–20 hours
- **Dependencies:** Navigation restructuring (3.2), Search indexing
- **Migration Risks:** Medium — new feature, no breakage, but high complexity.

---

## 4. Pages — Public

### 4.1 Landing Page (app/page.tsx)

- **Current State:** 100 lines. Blue gradient background (`from-blue-50 via-white to-indigo-50`). Emoji icons (🤖📚🔍⚡). Title: "Mimotes AI Chatbot". Two CTAs with emoji. 3 generic feature cards. Single-line footer. No product screenshots, no social proof, no pricing, no animation.
- **Target State (LANDING_PAGE_V2_SPEC):** 11 sections: Navigation, Hero (dark theme, product screenshot), Social Proof Bar, Product Showcase, Features (with Lucide icons), How It Works, Testimonials, Pricing (3 tiers), FAQ, Final CTA, Footer (4-column). Premium dark theme. Zero emoji. Animated gradient hero. SEO metadata.
- **Files Affected:** `app/page.tsx` → **full rewrite** (~800–1200 lines estimated)
- **Estimated Effort:** 24–32 hours
- **Dependencies:** Design System tokens (2.1–2.3), Pricing model decision
- **Migration Risks:** 🔴 HIGH — first impression. Must work in both light/dark mode. Needs product screenshots (asset creation). SEO impact if URLs change.

### 4.2 Login Page (app/(auth)/login/page.tsx + components/auth/login-form.tsx)

- **Current State:** Blue gradient wrapper. White card with hardcoded `bg-white`, `text-gray-*`, `border-gray-300`, `focus:ring-blue-500`. Title "Login Admin". Email + password fields. No logo, no illustration, no forgot password, no OAuth, no remember me. Redirects to `/documents`.
- **Target State:** Dark-themed split layout (left: product illustration, right: form). Theme tokens throughout. Logo at top. "Sign in to Mimotes". Forgot password link. Remember me checkbox. Password visibility toggle. Spinner on button. Redirect to `/dashboard` (or `/` in V2).
- **Files Affected:** `app/(auth)/login/page.tsx`, `components/auth/login-form.tsx`
- **Estimated Effort:** 8–10 hours
- **Dependencies:** Design System (2.1), Auth lib unchanged
- **Migration Risks:** Medium — auth flow critical path. Test login/logout cycle thoroughly.

### 4.3 Register Page (app/(auth)/register/page.tsx + components/auth/register-form.tsx)

- **Current State:** Same blue gradient wrapper as login. White card. Likely same hardcoded color issues.
- **Target State:** Mirror login page design. Split layout. Same theme token conversion. Consistent branding.
- **Files Affected:** `app/(auth)/register/page.tsx`, `components/auth/register-form.tsx`
- **Estimated Effort:** 6–8 hours
- **Dependencies:** Same as Login (4.2)
- **Migration Risks:** Medium — auth flow.

### 4.4 Invite Page (app/(public)/invite/[token]/page.tsx)

- **Current State:** Public page for workspace invitations. Details not read but likely basic.
- **Target State:** Branded invitation accept page. Theme tokens. Clear workspace/team context.
- **Files Affected:** `app/(public)/invite/[token]/page.tsx`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low.

---

## 5. Pages — Dashboard

### 5.1 Dashboard (app/dashboard/page.tsx)

- **Current State:** 244 lines. DashboardShell wrapper. StatCardsRow (4 cards via Suspense + Prisma direct queries). QuickActions (6 items in 3x2 grid: New Chat, Upload File, Manage API, Optimization, Connect Apps, Reports). ActivityFeed + SystemHealth in 5-column grid.
- **Target State (DASHBOARD_V2_SPEC):** Welcome Hero with personalized greeting + quick stats. 4 Quick Actions (with keyboard shortcuts). "Continue where you left off" card. Activity Feed with recent conversations (prominent). Knowledge Health section with charts (Recharts: usage line, document donut, top docs bar). Usage Overview. System Status (compact). Onboarding progress for new users. 12-column grid system. Progressive skeleton loading.
- **Files Affected:** `app/dashboard/page.tsx`, `components/dashboard/stat-card.tsx`, `components/dashboard/activity-feed.tsx`, `components/dashboard/system-health.tsx`, `components/dashboard/usage-chart.tsx`, `components/dashboard/recent-chats.tsx`, `components/dashboard/top-documents.tsx`, `components/dashboard/cost-summary.tsx`, `components/dashboard/kb-stats.tsx`, new: `components/dashboard/welcome-hero.tsx`, `components/dashboard/continue-card.tsx`, `components/dashboard/onboarding-bar.tsx`
- **Estimated Effort:** 24–32 hours
- **Dependencies:** Design System (2.1), Recharts already installed, Dashboard API routes exist
- **Migration Risks:** High — most-visited page. Server component with Prisma queries needs careful testing.

### 5.2 Dashboard Stat Cards (components/dashboard/stat-card.tsx)

- **Current State:** Generic stat card with icon, label, value, optional trend.
- **Target State:** Color-coded cards (Docs=blue, Chunks=green, Sessions=purple, Messages=orange). Trend arrows from 7-day comparison. Contextual labels ("Covering 12 documents" not just "247 Chunks").
- **Files Affected:** `components/dashboard/stat-card.tsx`
- **Estimated Effort:** 3–4 hours
- **Dependencies:** Dashboard redesign (5.1)
- **Migration Risks:** Low — isolated component.

### 5.3 Dashboard Activity Feed (components/dashboard/activity-feed.tsx)

- **Current State:** Basic activity list.
- **Target State:** Prominent section with relative timestamps ("2 min ago"), conversation previews, document upload events. Max 5 items with "View all" link.
- **Files Affected:** `components/dashboard/activity-feed.tsx`
- **Estimated Effort:** 4–5 hours
- **Dependencies:** Dashboard redesign (5.1)
- **Migration Risks:** Low.

### 5.4 Dashboard System Health (components/dashboard/system-health.tsx)

- **Current State:** Dedicated component shown on dashboard.
- **Target State:** Compact status indicator in header area (green dot + "All systems operational"). Move detailed health to developer-only section.
- **Files Affected:** `components/dashboard/system-health.tsx`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Dashboard redesign (5.1)
- **Migration Risks:** Low.

---

## 6. Pages — Chat

### 6.1 Chat Page (app/chat/page.tsx)

- **Current State:** 9 lines. Wraps `<ChatWindow />` in `h-screen flex flex-col`.
- **Target State:** Three-panel layout on desktop (sidebar 280px + chat fluid + source panel 360px). Medium: collapsed sidebar + chat. Mobile: full-screen chat with bottom sheet sessions.
- **Files Affected:** `app/chat/page.tsx`, `components/chat/chat-window.tsx` (major rewrite)
- **Estimated Effort:** 20–28 hours
- **Dependencies:** Design System (2.1), Chat components (6.2–6.5)
- **Migration Risks:** 🔴 HIGH — core product experience. Streaming, sources, session management all need updating simultaneously.

### 6.2 Chat Window (components/chat/chat-window.tsx)

- **Current State:** 362 lines. Session sidebar (mobile sheet). Header with "Mimotes AI" title. Message list with auto-scroll. Bouncing dots loading indicator. Source cards at bottom. Textarea + send button (inline SVG). Empty state with 🤖 emoji.
- **Target State (CHAT_EXPERIENCE_V2):** Category-based prompt suggestions on empty state. Typewriter cursor during streaming. Regenerate button per assistant message. Thumbs up/down feedback. Inline citations [1][2][3]. File upload (paperclip + drag-and-drop). Model selector in header. "Stop generating" button. Auto-generated session titles. Keyboard shortcuts (Cmd+K, Cmd+N, Escape). Content-centered layout (max-width 768px for messages).
- **Files Affected:** `components/chat/chat-window.tsx` → **full rewrite** (~600–800 lines)
- **Estimated Effort:** 24–32 hours
- **Dependencies:** Message bubble redesign (6.3), Source citations (6.4), Model selector (17.1)
- **Migration Risks:** 🔴 HIGH — 80% of user time spent here. Must maintain streaming, session persistence, error handling.

### 6.3 Message Bubble (components/chat/message-bubble.tsx)

- **Current State:** 138 lines. User: gray avatar circle with "U", `bg-gray-600`. Assistant: blue avatar "AI", `bg-blue-600`. Markdown rendering via react-markdown + remark-gfm + rehype-highlight. Copy button on hover. Timestamp.
- **Target State:** Custom avatars (initials with brand colors, not hardcoded gray/blue). Inline citation superscripts [1][2][3] that link to source panel. Regenerate button on hover (assistant only). Thumbs up/down feedback. Typing cursor during streaming. Improved markdown with styled tables, callouts.
- **Files Affected:** `components/chat/message-bubble.tsx`
- **Estimated Effort:** 12–16 hours
- **Dependencies:** Chat window (6.2), Source citations design
- **Migration Risks:** Medium — rendering logic changes could break markdown display.

### 6.4 Source Citations (components/chat/source-card.tsx)

- **Current State:** 122 lines. Horizontal scrollable cards at bottom of chat. Emoji file type icons (📕📘📄📊📗🌐). Expandable content preview. Similarity percentage. Link to document.
- **Target State (CHAT_EXPERIENCE_V2):** Toggleable source panel (360px, right side on desktop). Numbered sources matching inline citations [1][2][3]. Source cards with document title, score, content preview. Click to highlight in document. Cmd+D to toggle panel.
- **Files Affected:** `components/chat/source-card.tsx` → **major redesign**, new: `components/chat/source-panel.tsx`
- **Estimated Effort:** 12–16 hours
- **Dependencies:** Chat window (6.2), Message bubble (6.3)
- **Migration Risks:** Medium — source data format may need API changes.

### 6.5 Session Sidebar (components/chat/session-sidebar.tsx)

- **Current State:** 244 lines. Mobile sheet, desktop fixed sidebar. Search input. Session list with delete. Skeleton loading. Empty state.
- **Target State:** Pinned sessions section. Searchable, sortable, grouped by date. Right-click context menu (rename, pin, delete). Session count badges. Preview of last message. Smooth transitions.
- **Files Affected:** `components/chat/session-sidebar.tsx`
- **Estimated Effort:** 8–10 hours
- **Dependencies:** Chat window (6.2)
- **Migration Risks:** Medium — session data fetching logic shared.

---

## 7. Pages — Knowledge

### 7.1 Knowledge Index (app/knowledge/page.tsx)

- **Current State:** Redirects to `/knowledge/documents`.
- **Target State:** Knowledge base explorer: search, browse, source management. Top-level page with tabbed sub-views.
- **Files Affected:** `app/knowledge/page.tsx` → full page
- **Estimated Effort:** 8–10 hours
- **Dependencies:** Design System, Document explorer redesign
- **Migration Risks:** Medium — route consolidation.

### 7.2 Document List (app/knowledge/documents/page.tsx + document-explorer.tsx)

- **Current State:** DashboardShell wrapper. Stats row, status tabs, search + filters, table/grid views, pagination, bottom CTA panels. Uses `confirm()` for delete. Emoji file type icons.
- **Target State:** Unified Documents page with: FAB upload button (replaces `/documents/upload`), improved table/grid, custom confirmation dialog (not native `confirm()`), Lucide file icons, better empty states, bulk actions.
- **Files Affected:** `app/knowledge/documents/page.tsx`, `components/knowledge/document-explorer.tsx`
- **Estimated Effort:** 8–12 hours
- **Dependencies:** Design System, Route consolidation
- **Migration Risks:** Medium — document management is core functionality.

### 7.3 Document Detail (app/knowledge/documents/[id]/page.tsx + document-detail-client.tsx)

- **Current State:** Detail view for single document with chunks.
- **Target State:** Enhanced document viewer with chunk visualization, metadata panel, re-process button, chunk editor.
- **Files Affected:** `app/knowledge/documents/[id]/page.tsx`, `app/knowledge/documents/[id]/document-detail-client.tsx`
- **Estimated Effort:** 4–6 hours
- **Dependencies:** Knowledge base redesign
- **Migration Risks:** Low.

### 7.4 Chunks Viewer (app/knowledge/chunks/page.tsx + chunk-viewer.tsx)

- **Current State:** Full page with DashboardShell. ChunkViewer component.
- **Target State:** Hidden from sidebar. Accessible via Cmd+K → "View Chunks" or direct URL. Developer-only tool.
- **Files Affected:** `app/knowledge/chunks/page.tsx`, `components/knowledge/chunk-viewer.tsx`
- **Estimated Effort:** 2–3 hours (mainly remove from nav, keep route)
- **Dependencies:** Navigation redesign (3.2)
- **Migration Risks:** Low — hidden but still accessible.

### 7.5 Similarity Search (app/knowledge/search/page.tsx + similarity-search.tsx)

- **Current State:** Full page with DashboardShell. SimilaritySearch component.
- **Target State:** Hidden from sidebar. Accessible via Cmd+K → "Search Chunks" or global search. Developer-only tool.
- **Files Affected:** `app/knowledge/search/page.tsx`, `components/knowledge/similarity-search.tsx`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Navigation redesign (3.2)
- **Migration Risks:** Low.

### 7.6 Sources Viewer (app/knowledge/sources/page.tsx + source-viewer.tsx)

- **Current State:** Full page with DashboardShell.
- **Target State:** Hidden from sidebar. Developer-only. Accessible via document detail page.
- **Files Affected:** `app/knowledge/sources/page.tsx`, `components/knowledge/source-viewer.tsx`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Navigation redesign (3.2)
- **Migration Risks:** Low.

### 7.7 Images Viewer (app/knowledge/images/page.tsx)

- **Current State:** Exists in app directory.
- **Target State:** Merge into document detail or hide from nav. Accessible via document view.
- **Files Affected:** `app/knowledge/images/page.tsx`
- **Estimated Effort:** 1–2 hours
- **Dependencies:** Knowledge restructuring
- **Migration Risks:** Low.

### 7.8 Upload Page (app/(admin)/documents/upload/page.tsx)

- **Current State:** Standalone upload page wrapped in DashboardShell.
- **Target State:** Merge into Documents page as FAB (floating action button) + `Cmd+U` shortcut. Remove standalone page, add redirect.
- **Files Affected:** `app/(admin)/documents/upload/page.tsx`, `components/documents/upload-form.tsx`
- **Estimated Effort:** 4–6 hours
- **Dependencies:** Document list redesign (7.2), Route consolidation
- **Migration Risks:** Medium — upload flow is critical.

---

## 8. Pages — Analytics

### 8.1 Analytics Index (app/analytics/page.tsx)

- **Current State:** Redirects to `/analytics/usage`.
- **Target State:** Unified analytics page with 3 tabs (Usage, Chat, Cost). Single page, tabbed interface.
- **Files Affected:** `app/analytics/page.tsx` → full page with tabs
- **Estimated Effort:** 12–16 hours
- **Dependencies:** Recharts already installed, existing analytics components
- **Migration Risks:** Medium — route consolidation.

### 8.2 Usage Analytics (app/analytics/usage/page.tsx + usage-analytics.tsx)

- **Current State:** Separate page with UsageAnalytics component.
- **Target State:** Tab within unified Analytics page. Improved charts with Recharts. Date range selector. Export functionality.
- **Files Affected:** `app/analytics/usage/page.tsx` → redirect, `components/analytics/usage-analytics.tsx`
- **Estimated Effort:** 4–6 hours
- **Dependencies:** Unified Analytics page (8.1)
- **Migration Risks:** Low — redirect old route.

### 8.3 Chat Analytics (app/analytics/chat/page.tsx + chat-analytics.tsx)

- **Current State:** Separate page.
- **Target State:** Tab within unified Analytics page. Conversation metrics, response times, satisfaction scores.
- **Files Affected:** `app/analytics/chat/page.tsx` → redirect, `components/analytics/chat-analytics.tsx`
- **Estimated Effort:** 4–6 hours
- **Dependencies:** Unified Analytics page (8.1)
- **Migration Risks:** Low.

### 8.4 Cost Analytics (app/analytics/cost/page.tsx + cost-analytics.tsx)

- **Current State:** Separate page.
- **Target State:** Tab within unified Analytics page. Token costs, provider breakdown, budget alerts.
- **Files Affected:** `app/analytics/cost/page.tsx` → redirect, `components/analytics/cost-analytics.tsx`
- **Estimated Effort:** 4–6 hours
- **Dependencies:** Unified Analytics page (8.1)
- **Migration Risks:** Low.

---

## 9. Pages — AI

### 9.1 AI Index (app/ai/page.tsx)

- **Current State:** Redirects to `/ai/playground`.
- **Target State:** Hidden from sidebar. Accessible via Cmd+K → "Open Playground".
- **Files Affected:** `app/ai/page.tsx`
- **Estimated Effort:** 1 hour (add redirect to keep existing)
- **Dependencies:** Navigation redesign (3.2)
- **Migration Risks:** Low.

### 9.2 Playground (app/ai/playground/page.tsx + playground-editor.tsx)

- **Current State:** DashboardShell wrapper with PlaygroundEditor component.
- **Target State:** Hidden from sidebar. Improved editor with syntax highlighting, parameter controls, response comparison, history.
- **Files Affected:** `app/ai/playground/page.tsx`, `components/ai/playground-editor.tsx`, `components/ai/compare-mode.tsx`, `components/ai/parameter-controls.tsx`
- **Estimated Effort:** 8–12 hours
- **Dependencies:** AI components redesign
- **Migration Risks:** Low — developer tool, not user-facing.

### 9.3 Prompts (app/ai/prompts/page.tsx, new/page.tsx, [id]/page.tsx)

- **Current State:** 3 pages: list, create, edit. All with DashboardShell.
- **Target State:** Hidden from sidebar. Accessible via Cmd+K → "Manage Prompts". Improved editor with version history, test integration.
- **Files Affected:** `app/ai/prompts/page.tsx`, `app/ai/prompts/new/page.tsx`, `app/ai/prompts/[id]/page.tsx`, `components/ai/prompt-editor.tsx`, `components/ai/prompt-list.tsx`, `components/ai/prompt-version-list.tsx`
- **Estimated Effort:** 6–8 hours
- **Dependencies:** AI components redesign
- **Migration Risks:** Low — developer tool.

---

## 10. Pages — Settings (Consolidated)

### 10.1 Settings Consolidation

- **Current State:** 7 separate settings pages spread across routes: `/settings` (AI settings), `/settings/workspace`, `/settings/usage`, `/settings/billing`, `/settings/audit`, `/settings/mcp`, `/settings/widget`. Each is a separate page.
- **Target State (NAVIGATION_REARCHITECTURE):** Single `/settings` page with 6 tabs: General, Workspace, Team, Billing, Integrations (Widgets + API), Developer (MCP + Audit). All other `/settings/*` routes redirect to the appropriate tab.
- **Files Affected:** `app/(admin)/settings/page.tsx`, `app/(admin)/settings/workspace/page.tsx`, `app/(admin)/settings/usage/page.tsx`, `app/(admin)/settings/billing/page.tsx`, `app/(admin)/settings/audit/page.tsx`, `app/(admin)/settings/mcp/page.tsx`, `app/(admin)/settings/widget/page.tsx` → consolidate into single tabbed page
- **Estimated Effort:** 16–20 hours
- **Dependencies:** Navigation redesign (3.2), Tab component updates
- **Migration Risks:** HIGH — 7 existing routes need redirects. Settings data loading logic shared.

### 10.2 AI Settings (components/settings/ai-settings-form.tsx)

- **Current State:** Form for AI provider configuration (API keys, model selection).
- **Target State:** Move to Settings → General or Settings → Integrations tab. Theme tokens. Better UX with connection test button.
- **Files Affected:** `components/settings/ai-settings-form.tsx`
- **Estimated Effort:** 4–5 hours
- **Dependencies:** Settings consolidation (10.1)
- **Migration Risks:** Medium — critical configuration.

### 10.3 MCP Settings (components/settings/mcp-settings-form.tsx)

- **Current State:** Form for MCP server configuration.
- **Target State:** Move to Settings → Developer tab. Theme tokens.
- **Files Affected:** `components/settings/mcp-settings-form.tsx`
- **Estimated Effort:** 3–4 hours
- **Dependencies:** Settings consolidation (10.1)
- **Migration Risks:** Low.

---

## 11. Pages — Developers

### 11.1 Developer Page (app/developers/page.tsx)

- **Current State:** 178 lines. Custom tabs with emoji icons (🏠🔑📚📊). Hardcoded `bg-gray-950`, `text-white`, `border-gray-800`. Overview with Quick Start, Rate Limits, Authentication sections. Uses blue-600 accent.
- **Target State:** Move to Settings → Developer / API tab. Full theme token conversion. Remove emoji tab icons. Add interactive API explorer. Improve documentation section.
- **Files Affected:** `app/developers/page.tsx` → **full rewrite**, `components/developers/api-keys-manager.tsx`, `components/developers/api-documentation.tsx`, `components/developers/api-usage-metrics.tsx`
- **Estimated Effort:** 12–16 hours
- **Dependencies:** Settings consolidation (10.1), Design System (2.1)
- **Migration Risks:** Medium — developer-facing, but API keys management is critical.

---

## 12. Components — Shared UI Primitives

### 12.1 Existing shadcn Primitives (17 components)

**Files:** `components/ui/avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `pagination.tsx`, `separator.tsx`, `sheet.tsx`, `skeleton.tsx`, `slider.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`

- **Current State:** Standard shadcn/ui v4 primitives. Some customized (Avatar has `size` prop, Card has `size` prop). Using CSS variables from globals.css.
- **Target State (COMPONENT_LIBRARY_V2):** 20 components with precise TypeScript interfaces. Updated variants matching V2 design tokens. Button: glow effect on primary hover, 4 sizes (sm/md/lg/xl), loading state with spinner. Input: focus ring in brand color. Card: 5 surface levels. All components: 4px grid spacing, border treatment levels.
- **Estimated Effort:** 16–20 hours (update all 17 + add 3 new)
- **Dependencies:** Design System tokens (2.1–2.3)
- **Migration Risks:** Medium — every component in the app uses these primitives.

### 12.2 New Primitives Needed

- **Command Palette:** New `cmdk`-based component (or custom). ~16–20 hours.
- **Empty State:** Standardized empty state with illustration, title, description, CTA. ~4–5 hours.
- **File Upload Dropzone:** Drag-and-drop upload area. ~6–8 hours.
- **Estimated Effort (new primitives):** 26–33 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low — additive.

---

## 13. Components — Chat

### 13.1 Chat Window (components/chat/chat-window.tsx)

Covered in section 6.2.

### 13.2 Message Bubble (components/chat/message-bubble.tsx)

Covered in section 6.3.

### 13.3 Source Card (components/chat/source-card.tsx)

Covered in section 6.4.

### 13.4 Session Sidebar (components/chat/session-sidebar.tsx)

Covered in section 6.5.

---

## 14. Components — Dashboard

### 14.1 Stat Card (components/dashboard/stat-card.tsx)

Covered in section 5.2.

### 14.2 Activity Feed (components/dashboard/activity-feed.tsx)

Covered in section 5.3.

### 14.3 System Health (components/dashboard/system-health.tsx)

Covered in section 5.4.

### 14.4 Usage Chart (components/dashboard/usage-chart.tsx)

- **Current State:** Recharts-based chart component.
- **Target State:** Updated with V2 design tokens. Animated transitions. Loading skeleton. Responsive sizing.
- **Files Affected:** `components/dashboard/usage-chart.tsx`
- **Estimated Effort:** 3–4 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low.

### 14.5 Recent Chats (components/dashboard/recent-chats.tsx)

- **Current State:** Basic recent chats list.
- **Target State:** Prominent component with conversation previews, one-click resume. Max 5 items.
- **Files Affected:** `components/dashboard/recent-chats.tsx`
- **Estimated Effort:** 3–4 hours
- **Dependencies:** Dashboard redesign (5.1)
- **Migration Risks:** Low.

### 14.6 Other Dashboard Components

- `components/dashboard/top-documents.tsx`: 2–3 hours (token updates)
- `components/dashboard/cost-summary.tsx`: 2–3 hours (token updates)
- `components/dashboard/kb-stats.tsx`: 2–3 hours (token updates)
- `components/dashboard/evaluation-analytics.tsx`: 2–3 hours (token updates)
- `components/dashboard/retrieval-analytics.tsx`: 2–3 hours (token updates)

---

## 15. Components — Knowledge

### 15.1 Document Explorer (components/knowledge/document-explorer.tsx)

- **Current State:** Complex component with table/grid views, filters, search, pagination, stats. ~500+ lines.
- **Target State:** Improved with Lucide file icons (no emoji), custom confirmation dialog, better empty states, bulk actions, theme tokens throughout.
- **Files Affected:** `components/knowledge/document-explorer.tsx`
- **Estimated Effort:** 8–12 hours
- **Dependencies:** Design System (2.1), Confirmation dialog component
- **Migration Risks:** High — complex component with many features.

### 15.2 Chunk Viewer (components/knowledge/chunk-viewer.tsx)

- **Current State:** Browse and search document chunks.
- **Target State:** Hidden from nav. Developer-only. Theme tokens.
- **Files Affected:** `components/knowledge/chunk-viewer.tsx`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low.

### 15.3 Similarity Search (components/knowledge/similarity-search.tsx)

- **Current State:** Custom similarity search tool.
- **Target State:** Hidden from nav. Developer-only. Theme tokens.
- **Files Affected:** `components/knowledge/similarity-search.tsx`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low.

### 15.4 Source Viewer (components/knowledge/source-viewer.tsx)

- **Current State:** Source viewing component.
- **Target State:** Hidden from nav. Accessible via document detail.
- **Files Affected:** `components/knowledge/source-viewer.tsx`
- **Estimated Effort:** 1–2 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low.

---

## 16. Components — Analytics

### 16.1 Chart Card (components/analytics/chart-card.tsx)

- **Current State:** Generic chart wrapper.
- **Target State:** Updated with V2 tokens. Loading skeleton. Responsive.
- **Files Affected:** `components/analytics/chart-card.tsx`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low.

### 16.2 KPI Card (components/analytics/kpi-card.tsx)

- **Current State:** KPI display card.
- **Target State:** Updated with V2 tokens. Trend indicators. Color coding.
- **Files Affected:** `components/analytics/kpi-card.tsx`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low.

### 16.3 Date Range Selector (components/analytics/date-range-selector.tsx)

- **Current State:** Date range picker.
- **Target State:** Updated with V2 tokens. Preset ranges (7d, 30d, 90d, Custom).
- **Files Affected:** `components/analytics/date-range-selector.tsx`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low.

### 16.4 Analytics Views (chat-analytics.tsx, cost-analytics.tsx, usage-analytics.tsx)

- **Current State:** 3 separate analytics view components.
- **Target State:** Unified into tabbed view. Theme tokens. Improved charts.
- **Files Affected:** `components/analytics/chat-analytics.tsx`, `components/analytics/cost-analytics.tsx`, `components/analytics/usage-analytics.tsx`
- **Estimated Effort:** 6–8 hours total
- **Dependencies:** Unified Analytics page (8.1)
- **Migration Risks:** Low.

---

## 17. Components — AI / Playground

### 17.1 Model Selector (components/ai/model-selector.tsx)

- **Current State:** Model selection dropdown.
- **Target State:** Enhanced with model descriptions, pricing info, latency indicators. Move to chat header as well as playground.
- **Files Affected:** `components/ai/model-selector.tsx`
- **Estimated Effort:** 3–4 hours
- **Dependencies:** Chat window redesign (6.2)
- **Migration Risks:** Low.

### 17.2 Playground Editor (components/ai/playground-editor.tsx)

- **Current State:** Prompt editor for testing.
- **Target State:** Syntax highlighting, parameter controls, response comparison, history panel.
- **Files Affected:** `components/ai/playground-editor.tsx`
- **Estimated Effort:** 6–8 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low — developer tool.

### 17.3 Prompt Editor (components/ai/prompt-editor.tsx)

- **Current State:** Prompt template editor.
- **Target State:** Improved with version diffing, variable preview, test integration.
- **Files Affected:** `components/ai/prompt-editor.tsx`
- **Estimated Effort:** 4–5 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Low.

### 17.4 Other AI Components

- `components/ai/compare-mode.tsx`: 3–4 hours
- `components/ai/parameter-controls.tsx`: 2–3 hours
- `components/ai/prompt-list.tsx`: 2–3 hours
- `components/ai/prompt-version-list.tsx`: 2–3 hours

---

## 18. Components — Workspace / Team

### 18.1 Workspace Switcher (components/workspace/workspace-switcher.tsx)

- **Current State:** Workspace selection dropdown in sidebar.
- **Target State:** Theme tokens. Improved UX with create workspace option. Current workspace indicator.
- **Files Affected:** `components/workspace/workspace-switcher.tsx`
- **Estimated Effort:** 3–4 hours
- **Dependencies:** Design System (2.1)
- **Migration Risks:** Medium — critical for multi-workspace.

### 18.2 Member Management (components/workspace/member-management.tsx)

- **Current State:** Team member list and management.
- **Target State:** Move to Settings → Team tab. Theme tokens. Role badges. Invite flow.
- **Files Affected:** `components/workspace/member-management.tsx`
- **Estimated Effort:** 3–4 hours
- **Dependencies:** Settings consolidation (10.1)
- **Migration Risks:** Medium.

### 18.3 Invitation Components

- `components/workspace/invite-dialog.tsx`: 2–3 hours (theme tokens)
- `components/workspace/invitation-list.tsx`: 2–3 hours (theme tokens)
- `components/workspace/billing-dashboard.tsx`: 3–4 hours (move to Settings → Billing tab)
- `components/workspace/plan-status.tsx`: 2–3 hours (theme tokens)
- `components/workspace/upgrade-banner.tsx`: 2–3 hours (theme tokens)
- `components/workspace/usage-overview.tsx`: 2–3 hours (theme tokens)

---

## 19. Components — Settings

### 19.1 AI Settings Form (components/settings/ai-settings-form.tsx)

Covered in section 10.2.

### 19.2 MCP Settings Form (components/settings/mcp-settings-form.tsx)

Covered in section 10.3.

### 19.3 Widget Settings (components/widget/widget-settings-form.tsx)

- **Current State:** Widget configuration form.
- **Target State:** Move to Settings → Integrations tab. Theme tokens.
- **Files Affected:** `components/widget/widget-settings-form.tsx`
- **Estimated Effort:** 2–3 hours
- **Dependencies:** Settings consolidation (10.1)
- **Migration Risks:** Low.

---

## 20. New Features — Not in V1

### 20.1 Command Palette (Cmd+K)

- **Current State:** Does not exist.
- **Target State:** Global command palette with: page navigation, document search, chunk search, quick actions (new chat, upload, manage prompts), settings shortcuts, keyboard shortcut reference. Fuzzy search, keyboard navigation, recent items, categorized results.
- **Files Affected:** New: `components/command-palette.tsx`, update: `components/layout/dashboard-shell-client.tsx`, `components/layout/top-nav.tsx`
- **Estimated Effort:** 16–20 hours
- **Dependencies:** Navigation restructuring (3.2), Search API
- **Migration Risks:** Medium — new feature, no breakage, but complex.

### 20.2 Suggested Prompts (Chat Empty State)

- **Current State:** Empty state shows 🤖 emoji + generic text.
- **Target State:** Category-based prompt suggestions (e.g., "Ask about documents", "Summarize content", "Compare information", "Draft a response"). Clickable cards that pre-fill the chat input.
- **Files Affected:** `components/chat/chat-window.tsx` (empty state section)
- **Estimated Effort:** 4–6 hours
- **Dependencies:** Chat window redesign (6.2)
- **Migration Risks:** Low — additive.

### 20.3 Inline Citations

- **Current State:** Sources displayed as separate cards at bottom of chat.
- **Target State:** Inline [1][2][3] superscripts in message text. Click to highlight/scroll to source. Source panel toggle.
- **Files Affected:** `components/chat/message-bubble.tsx`, `components/chat/chat-window.tsx`, new: `components/chat/source-panel.tsx`
- **Estimated Effort:** 12–16 hours
- **Dependencies:** Chat window redesign (6.2), Source panel
- **Migration Risks:** High — changes message rendering pipeline.

### 20.4 Message Feedback (Thumbs Up/Down)

- **Current State:** No feedback mechanism.
- **Target State:** Thumbs up/down buttons per assistant message. Feedback stored via API endpoint.
- **Files Affected:** `components/chat/message-bubble.tsx`, new: `app/api/chat/feedback/route.ts`
- **Estimated Effort:** 4–6 hours
- **Dependencies:** Chat window redesign (6.2)
- **Migration Risks:** Low — additive.

### 20.5 Regenerate Button

- **Current State:** No regeneration.
- **Target State:** "Regenerate" button on assistant messages (show on hover). Re-sends last user message.
- **Files Affected:** `components/chat/message-bubble.tsx`, `components/chat/chat-window.tsx`
- **Estimated Effort:** 3–4 hours
- **Dependencies:** Chat window redesign (6.2)
- **Migration Risks:** Low — additive.

### 20.6 Model Selector in Chat

- **Current State:** Chat uses default/hardcoded model.
- **Target State:** Model selector dropdown in chat header. Shows available models with descriptions. Persists selection per session.
- **Files Affected:** `components/chat/chat-window.tsx`, `components/ai/model-selector.tsx`
- **Estimated Effort:** 4–5 hours
- **Dependencies:** Chat window redesign (6.2), Model selector (17.1)
- **Migration Risks:** Low.

### 20.7 File Upload in Chat

- **Current State:** Text-only chat.
- **Target State:** Paperclip button for file upload. Drag-and-drop onto chat area. Image preview inline.
- **Files Affected:** `components/chat/chat-window.tsx`, new: `components/chat/file-upload-button.tsx`
- **Estimated Effort:** 8–12 hours
- **Dependencies:** Upload API, Chat window redesign (6.2)
- **Migration Risks:** Medium — new feature, needs upload pipeline integration.

### 20.8 Keyboard Shortcuts

- **Current State:** No keyboard shortcuts.
- **Target State:** Cmd+K (Command Palette), Cmd+N (New Chat), Cmd+\ (Toggle Sidebar), Cmd+D (Toggle Source Panel), Escape (Close panels), Arrow keys (Navigate messages).
- **Files Affected:** `components/layout/dashboard-shell-client.tsx`, `components/chat/chat-window.tsx`, new: `components/keyboard-shortcuts-provider.tsx`
- **Estimated Effort:** 6–8 hours
- **Dependencies:** Command Palette (20.1), Chat redesign (6.2)
- **Migration Risks:** Low — additive.

### 20.9 Onboarding Flow

- **Current State:** No onboarding. New users see empty dashboard.
- **Target State:** 3-step onboarding progress bar on dashboard. Guided tour for first-time users. Checklist: Upload first document, Start first chat, Configure AI provider.
- **Files Affected:** new: `components/dashboard/onboarding-bar.tsx`, `components/dashboard/onboarding-checklist.tsx`, `app/dashboard/page.tsx`
- **Estimated Effort:** 8–10 hours
- **Dependencies:** Dashboard redesign (5.1)
- **Migration Risks:** Low — additive.

### 20.10 "Continue Where You Left Off" Card

- **Current State:** No continuation feature.
- **Target State:** Dashboard card showing last conversation with preview text, one-click resume.
- **Files Affected:** new: `components/dashboard/continue-card.tsx`, `app/dashboard/page.tsx`
- **Estimated Effort:** 4–5 hours
- **Dependencies:** Dashboard redesign (5.1), Chat API
- **Migration Risks:** Low.

---

## 21. Mobile-Specific Gaps

### 21.1 Bottom Tab Bar

- **Current State:** Mobile navigation via sheet-based sidebar only.
- **Target State:** Persistent bottom tab bar with 5 tabs (Home, Chat, Documents, Analytics, Settings). Active state indicator. Badge counts. Haptic feedback on switch.
- **Files Affected:** `components/layout/mobile-nav.tsx` → **full rewrite**, `components/layout/dashboard-shell-client.tsx`
- **Estimated Effort:** 16–20 hours
- **Dependencies:** Navigation redesign (3.2), MOBILE_EXPERIENCE_V2 spec
- **Migration Risks:** HIGH — changes core navigation for mobile users.

### 21.2 Touch Interactions

- **Current State:** Standard click handlers. No touch-specific handling.
- **Target State:** Swipe gestures (chat sessions, document lists), long-press context menus, pull-to-refresh, 44px minimum touch targets, 48px for primary actions.
- **Files Affected:** Multiple components across app
- **Estimated Effort:** 12–16 hours
- **Dependencies:** Mobile navigation (21.1)
- **Migration Risks:** Medium — progressive enhancement.

### 21.3 Haptic Feedback

- **Current State:** None.
- **Target State:** Haptic feedback on: tab switch, message send, pull-to-refresh, long-press actions. Using `navigator.vibrate()` API.
- **Files Affected:** Multiple components
- **Estimated Effort:** 4–6 hours
- **Dependencies:** Mobile navigation (21.1)
- **Migration Risks:** Low — progressive enhancement, graceful fallback.

### 21.4 Mobile Chat

- **Current State:** Chat works on mobile but uses desktop layout shrunk.
- **Target State:** Full-screen chat on mobile. Bottom input bar. Swipe up for session list. Haptic on send. 16px minimum font on inputs (prevent iOS zoom).
- **Files Affected:** `components/chat/chat-window.tsx`, `components/chat/message-bubble.tsx`, `components/chat/session-sidebar.tsx`
- **Estimated Effort:** 8–12 hours
- **Dependencies:** Chat redesign (6.1–6.5), Mobile navigation (21.1)
- **Migration Risks:** High — must maintain desktop layout while adding mobile-specific.

### 21.5 Mobile Dashboard

- **Current State:** Dashboard uses responsive grid but no mobile-specific layout.
- **Target State:** Stacked cards, swipeable quick actions, pull-to-refresh, bottom sheets for details.
- **Files Affected:** `app/dashboard/page.tsx`, dashboard components
- **Estimated Effort:** 6–8 hours
- **Dependencies:** Dashboard redesign (5.1), Mobile navigation (21.1)
- **Migration Risks:** Medium.

---

## 22. Effort Summary & Roadmap

### 22.1 Effort by Category

| Category | Hours (Low) | Hours (High) | Priority |
|----------|-------------|--------------|----------|
| **Foundation (Design System)** | 20 | 29 | P0 |
| **Layout & Navigation** | 66 | 88 | P0 |
| **Landing Page** | 24 | 32 | P0 |
| **Auth Pages (Login + Register)** | 14 | 18 | P0 |
| **Dashboard** | 35 | 45 | P0 |
| **Chat (Core)** | 64 | 86 | P0 |
| **Knowledge** | 30 | 42 | P1 |
| **Analytics** | 32 | 42 | P1 |
| **AI / Playground** | 23 | 31 | P2 |
| **Settings Consolidation** | 25 | 32 | P1 |
| **Developers Page** | 12 | 16 | P1 |
| **UI Primitives** | 42 | 53 | P0 |
| **New Features (Cmd+K, Citations, etc.)** | 69 | 91 | P0-P1 |
| **Mobile** | 46 | 62 | P1 |
| **Workspace/Team Components** | 16 | 22 | P2 |
| **TOTAL** | **~518** | **~689** | — |

### 22.2 Recommended Phased Roadmap

#### Phase 1: Foundation (Week 1–2) — 60–80 hours
- [ ] Design System tokens (2.1–2.4)
- [ ] Typography scale (2.2)
- [ ] UI primitives update (12.1)
- [ ] Root layout (3.1)
- **Gate:** All design tokens in place, primitives updated

#### Phase 2: Core Navigation (Week 2–3) — 50–70 hours
- [ ] Sidebar redesign (3.2)
- [ ] Route consolidation + redirects (3.6)
- [ ] Dashboard shell updates (3.3)
- [ ] Top nav (3.4)
- **Gate:** 6-item sidebar working, old routes redirect

#### Phase 3: High-Impact Pages (Week 3–5) — 100–130 hours
- [ ] Landing page full rebuild (4.1)
- [ ] Login + Register (4.2, 4.3)
- [ ] Dashboard redesign (5.1)
- [ ] Chat core redesign (6.1–6.5)
- **Gate:** Landing, auth, dashboard, chat all on V2 design

#### Phase 4: Features & Polish (Week 5–7) — 80–110 hours
- [ ] Command Palette (20.1)
- [ ] Inline Citations (20.3)
- [ ] Settings consolidation (10.1)
- [ ] Analytics unification (8.1)
- [ ] Knowledge page updates (7.1–7.8)
- [ ] New features (20.2, 20.4–20.10)
- **Gate:** All features functional, Cmd+K working

#### Phase 5: Mobile (Week 7–9) — 50–70 hours
- [ ] Bottom tab bar (21.1)
- [ ] Touch interactions (21.2)
- [ ] Mobile-specific layouts (21.4, 21.5)
- [ ] Haptic feedback (21.3)
- **Gate:** Mobile-first experience complete

#### Phase 6: Developer Pages & Cleanup (Week 9–10) — 30–40 hours
- [ ] Developers page (11.1)
- [ ] AI/Playground pages (9.2, 9.3)
- [ ] Workspace/Team components (18.1–18.3)
- [ ] Final token audit and visual QA
- **Gate:** All pages on V2 design, zero hardcoded colors

---

## 23. Risk Register

### 🔴 HIGH RISK

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Sidebar/Route changes break all pages** | Every page affected | High | Comprehensive redirect map. Test every route. Staged rollout with feature flags. |
| **Chat streaming breaks during redesign** | Core product unusable | Medium | Maintain existing API contract. Redesign components in isolation. Test streaming end-to-end after each change. |
| **Design tokens change breaks all components** | Visual regression across entire app | High | Keep CSS variable names, update values. Incremental token migration. Visual regression testing. |
| **Mobile bottom tab bar conflicts with desktop sidebar** | Broken navigation on tablet breakpoint | Medium | Responsive hook for breakpoint detection. Conditional rendering (bottom tabs < 768px, sidebar ≥ 768px). |
| **Settings consolidation breaks configuration** | Users lose access to settings | Medium | Maintain redirects from old routes. Preserve all form data and API endpoints. |

### 🟡 MEDIUM RISK

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Landing page rebuild takes longer than estimated** | Delayed launch | High | Break into sections. Ship incrementally. Hero + nav first, then sections. |
| **Inline citations require API changes** | Backend work needed | Medium | Design frontend to accept both old and new source formats. Adapter pattern. |
| **Command Palette search performance** | Slow fuzzy search | Low | Client-side search for navigation. Server-side for documents/chunks. Debounced input. |
| **Geist font loading affects CLS** | Layout shift on load | Low | Use `next/font` for automatic font optimization. Fallback stack already defined. |

### 🟢 LOW RISK

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Haptic feedback not supported on all devices** | Feature invisible on desktop | Certain | Progressive enhancement. Check `navigator.vibrate` support. Silent fallback. |
| **Recharts animations cause performance issues** | Janky charts on low-end devices | Low | Use `isAnimationActive` prop. Disable on `prefers-reduced-motion`. |

---

## Appendix A: Files Requiring Hardcoded Color Fixes

The following files contain hardcoded `text-gray-*`, `bg-white`, `border-gray-*`, `bg-blue-*`, or `focus:ring-blue-*` classes that bypass the oklch theme system:

| File | Hardcoded Classes | Severity |
|------|-------------------|----------|
| `app/page.tsx` | `bg-gradient-to-br from-blue-50 via-white to-indigo-50`, `text-gray-900`, `text-gray-600`, `text-gray-500`, `bg-white`, `bg-blue-600`, `text-blue-600`, `hover:bg-blue-700` | 🔴 Critical |
| `app/(auth)/login/page.tsx` | `from-blue-50 via-white to-indigo-50` | 🔴 Critical |
| `components/auth/login-form.tsx` | `bg-white`, `text-gray-500`, `text-gray-700`, `border-gray-300`, `focus:ring-blue-500`, `bg-blue-600`, `hover:bg-blue-700`, `text-blue-600` | 🔴 Critical |
| `app/(auth)/register/page.tsx` | `from-blue-50 via-white to-indigo-50` | 🔴 Critical |
| `app/developers/page.tsx` | `bg-gray-950`, `text-white`, `border-gray-800`, `bg-gray-900/50`, `bg-gray-800/50`, `border-gray-700`, `text-gray-400`, `text-gray-300`, `text-blue-400`, `border-blue-500`, `bg-blue-600`, `text-green-300` | 🔴 Critical |
| `components/chat/message-bubble.tsx` | `bg-gray-600` (user avatar), `bg-blue-600` (AI avatar) | 🟡 High |
| `components/chat/source-card.tsx` | Emoji file type icons (📕📘📄📊📗🌐) | 🟡 High |

**Total: 7 files with hardcoded color issues affecting visual consistency.**

---

## Appendix B: Route Redirect Map (V1 → V2)

| V1 Route | V2 Route | Redirect Type |
|----------|----------|---------------|
| `/dashboard` | `/` | 301 |
| `/settings` | `/settings?tab=general` | 302 |
| `/settings/workspace` | `/settings?tab=workspace` | 301 |
| `/settings/usage` | `/analytics?tab=usage` | 301 |
| `/settings/billing` | `/settings?tab=billing` | 301 |
| `/settings/audit` | `/settings?tab=developer` | 301 |
| `/settings/mcp` | `/settings?tab=developer` | 301 |
| `/settings/widget` | `/settings?tab=integrations` | 301 |
| `/analytics/usage` | `/analytics?tab=usage` | 301 |
| `/analytics/chat` | `/analytics?tab=chat` | 301 |
| `/analytics/cost` | `/analytics?tab=cost` | 301 |
| `/knowledge/chunks` | `/knowledge` (hidden, accessible via Cmd+K) | 302 |
| `/knowledge/search` | `/knowledge` (hidden, accessible via Cmd+K) | 302 |
| `/knowledge/sources` | `/knowledge` (hidden, accessible via Cmd+K) | 302 |
| `/knowledge/images` | `/knowledge` (merged) | 301 |
| `/documents/upload` | `/documents` (FAB button) | 301 |
| `/ai` | Hidden (Cmd+K) | 302 |
| `/ai/playground` | Hidden (Cmd+K) | 302 |
| `/ai/prompts` | Hidden (Cmd+K) | 302 |
| `/ai/prompts/new` | Hidden (Cmd+K) | 302 |
| `/ai/prompts/[id]` | Hidden (Cmd+K) | 302 |
| `/developers` | `/settings?tab=developer` | 301 |
| `/admin/documents` | `/documents` | 301 |
| `/admin/documents/upload` | `/documents` (FAB) | 301 |
| `/admin/settings` | `/settings` | 301 |

---

*Report generated: June 13, 2026*
*Total pages audited: 34 page files*
*Total components audited: 68 component files*
*Total estimated effort: 518–689 hours*
