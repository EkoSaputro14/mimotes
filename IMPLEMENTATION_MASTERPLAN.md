# MimoNotes V2 — Implementation Masterplan

> **Version:** 1.0.0
> **Author:** Technical Project Manager
> **Date:** June 13, 2026
> **Status:** EXECUTE
> **Target:** Public Beta Launch in 25 working days (5 weeks)

---

## 1. Executive Summary

### What We're Building

A complete visual and interaction redesign of the MimoNotes frontend — from a generic shadcn/ui template (rated 3.5/10) to a premium, Linear/Vercel-tier AI RAG chatbot interface that justifies a paid SaaS subscription.

The backend is production-ready: 353 tests passing, security hardened, multi-tenant, multi-provider AI. The frontend is the bottleneck. V2 closes that gap.

### Why It Matters

- **First impressions are conversion.** The landing page is the first touchpoint. V1 screams "weekend project" with emoji icons, generic gradients, and no product screenshots. V2 must say "this is a serious tool worth paying for."
- **Chat is the product.** Users spend 80% of their time in chat. V1 chat is functional but lifeless. V2 chat must feel like Perplexity meets Claude — responsive, source-aware, keyboard-first.
- **Navigation is the skeleton.** 14+ sidebar items overwhelm. V2 reduces to 6 primary items with a Command Palette for power features. Less is more.
- **Mobile is not optional.** 40%+ of SaaS traffic is mobile. V1 mobile is broken. V2 is mobile-first.

### Success Criteria

| Metric | V1 Baseline | V2 Target |
|--------|-------------|-----------|
| Design system rating | 3.5/10 | 8+/10 |
| First impression (5-sec test) | "generic template" | "premium AI tool" |
| Navigation items | 14+ | 6 primary |
| Time to first chat action | ~8 seconds | <3 seconds |
| Lighthouse Performance | ~70 | 90+ |
| Lighthouse Accessibility | ~60 | 90+ |
| Mobile usability | Broken | Passes Core Web Vitals |
| Emoji count on landing | 12+ | 0 |
| Product screenshots | 0 | 4+ |

### Timeline Overview

| Phase | Days | Deliverable |
|-------|------|-------------|
| Phase 0: Foundation | 1–2 | Design tokens, Geist fonts, Tailwind config |
| Phase 1: Component Library | 3–5 | 10 core components built over shadcn/ui |
| Phase 2: Navigation | 6–7 | 6-item sidebar, Command Palette, breadcrumbs |
| Phase 3: Landing Page | 8–10 | Complete landing page redesign |
| Phase 4: Chat Experience | 11–14 | Chat redesign with citations, streaming, feedback |
| Phase 5: Dashboard | 15–17 | Dashboard redesign with charts and activity feed |
| Phase 6: Documents | 18–19 | Document list with search, filter, preview |
| Phase 7: Mobile | 20–22 | Bottom tab bar, gestures, touch targets |
| Phase 8: Polish | 23–25 | Skeletons, micro-interactions, a11y, performance |

---

## 2. Implementation Phases

### Phase 0: Foundation (Days 1–2)

**Goal:** Establish the V2 design token layer. No visible changes yet — just the invisible foundation that every component will consume.

**Reference:** `MIMONOTES_V2_DESIGN_SYSTEM.md`

#### Day 1: Font & Color Tokens

- [ ] Install Geist Sans + Geist Mono fonts
  - Download from https://vercel.com/font
  - Place in `app/fonts/` directory
  - Update `app/layout.tsx` to use Geist font family
  - Remove any existing Inter or default font imports

- [ ] Update `app/globals.css` with V2 design tokens
  - Replace current CSS custom properties with V2 oklch color scale
  - Brand scale: `--color-brand-50` through `--color-brand-900` (hue 265°)
  - Neutral scale: `--color-neutral-0` through `--color-neutral-950` (warm undertone)
  - Semantic colors: `--color-success`, `--color-warning`, `--color-error`, `--color-info`
  - Surface hierarchy: `--surface-base` through `--surface-highlight` (4 levels)
  - All values in oklch format per Design System doc

- [ ] Update Tailwind configuration
  - Add Geist font family to `fontFamily` config
  - Map V2 design tokens to Tailwind theme extensions
  - Ensure oklch values are properly configured for Tailwind v4
  - Add custom spacing tokens if extending beyond defaults

#### Day 2: Typography, Spacing & Motion

- [ ] Define typography scale in CSS
  - `--font-display-lg/md` sizes
  - `--font-heading-lg/md/sm` sizes
  - `--font-body-lg/md/sm` sizes
  - `--font-label-lg/md/sm` sizes
  - `--font-code` size
  - Line heights, letter spacing per design system

- [ ] Define spacing scale (4px grid)
  - `--space-xs` (4px) through `--space-3xl` (48px)
  - Verify 4px grid alignment across all values

- [ ] Define motion tokens
  - `--duration-micro` (100ms), `--duration-fast` (150ms), `--duration-normal` (200ms), `--duration-slow` (300ms)
  - Easing curves: `--ease-default`, `--ease-in`, `--ease-out`, `--ease-spring`

- [ ] Define border radius tokens
  - `--radius-sm` (6px), `--radius-md` (8px), `--radius-lg` (10px), `--radius-xl` (12px), `--radius-2xl` (16px)

- [ ] Verify dark mode
  - Toggle between light/dark to confirm tokens adapt
  - Check surface hierarchy in both modes
  - Confirm brand colors maintain WCAG AA contrast in both modes

- [ ] **Phase 0 Quality Gate:**
  - `npm run build` passes with zero errors
  - Geist fonts render correctly in browser
  - CSS custom properties visible in DevTools
  - Dark mode toggle works without flash
  - No visual regression on existing pages (tokens only, not applied)

---

### Phase 1: Component Library (Days 3–5)

**Goal:** Build 10 core components over shadcn/ui foundations, consuming V2 design tokens.

**Reference:** `COMPONENT_LIBRARY_V2.md`

#### Priority Order (by usage frequency across all pages)

| Order | Component | Used In | Est. LOC |
|-------|-----------|---------|----------|
| 1 | Button | Everywhere | 120 |
| 2 | Input | Forms, Chat, Search | 80 |
| 3 | Card | Dashboard, Documents, Landing | 100 |
| 4 | Badge | Status, Tags, Chat | 60 |
| 5 | Avatar | Chat, Navigation, User | 70 |
| 6 | Dialog | Settings, Confirmations | 90 |
| 7 | Toast | Notifications, Errors | 80 |
| 8 | Empty State | Chat, Documents, Knowledge | 80 |
| 9 | Skeleton | Loading states everywhere | 60 |
| 10 | Tabs | Settings, Dashboard, Chat | 70 |

#### Day 3: Button, Input, Card, Badge

- [ ] **Button** (`components/ui/button-v2.tsx`)
  - Variants: primary, secondary, ghost, destructive, link
  - Sizes: sm (28px), md (34px), lg (42px)
  - Subtle glow on primary hover (signature interaction)
  - Loading state with spinner
  - Icon-only variant (square aspect ratio)
  - Full TypeScript interface per COMPONENT_LIBRARY_V2.md
  - Test: renders all variants, handles click, shows loading state

- [ ] **Input** (`components/ui/input-v2.tsx`)
  - Variants: default, error, success
  - Sizes: sm, md, lg
  - Leading/trailing icon slots
  - Clear button (X) when value present
  - Focus ring using brand-500
  - Full TypeScript interface per COMPONENT_LIBRARY_V2.md
  - Test: renders with icons, shows error state, clear button works

- [ ] **Card** (`components/ui/card-v2.tsx`)
  - Variants: default, elevated, outlined, interactive
  - Padding sizes: sm, md, lg
  - Optional header, footer sections
  - Hover state for interactive cards
  - Full TypeScript interface per COMPONENT_LIBRARY_V2.md
  - Test: renders all variants, interactive hover works

- [ ] **Badge** (`components/ui/badge-v2.tsx`)
  - Variants: default, brand, success, warning, error, outline
  - Sizes: sm, md
  - Dot indicator option
  - Dismissible variant (with close button)
  - Full TypeScript interface per COMPONENT_LIBRARY_V2.md
  - Test: renders all variants, dismissible works

#### Day 4: Avatar, Dialog, Toast, Empty State

- [ ] **Avatar** (`components/ui/avatar-v2.tsx`)
  - Image with fallback to initials
  - Sizes: sm (24px), md (32px), lg (40px), xl (48px)
  - Online/offline status indicator
  - Group variant (stacked avatars)
  - Full TypeScript interface per COMPONENT_LIBRARY_V2.md
  - Test: image fallback, status indicator, sizes

- [ ] **Dialog** (`components/ui/dialog-v2.tsx`)
  - Modal with overlay
  - Sizes: sm, md, lg, full
  - Header, body, footer sections
  - Close on overlay click (configurable)
  - Close on Escape key
  - Focus trap
  - Accessible: aria attributes, screen reader support
  - Full TypeScript interface per COMPONENT_LIBRARY_V2.md
  - Test: opens/closes, focus trap, escape key, aria

- [ ] **Toast** (`components/ui/toast-v2.tsx`)
  - Built on sonner (already in dependencies)
  - Variants: default, success, error, warning, info
  - Auto-dismiss with configurable duration
  - Action button support
  - Position: top-right (desktop), top-center (mobile)
  - Full TypeScript interface per COMPONENT_LIBRARY_V2.md
  - Test: shows/hides, auto-dismiss, action button

- [ ] **Empty State** (`components/ui/empty-state-v2.tsx`)
  - Illustration/icon area (configurable)
  - Title + description
  - CTA button(s)
  - Compact (inline) and full (page) variants
  - Full TypeScript interface per COMPONENT_LIBRARY_V2.md
  - Test: renders both variants, CTA click works

#### Day 5: Skeleton, Tabs + Integration

- [ ] **Skeleton** (`components/ui/skeleton-v2.tsx`)
  - Line, circle, rectangle variants
  - Pulse animation using V2 motion tokens
  - Configurable width/height
  - Compound skeleton (pre-built: card-skeleton, list-skeleton, chat-skeleton)
  - Full TypeScript interface per COMPONENT_LIBRARY_V2.md
  - Test: renders all variants, animation works

- [ ] **Tabs** (`components/ui/tabs-v2.tsx`)
  - Underline style (not pill) — matches V2 design language
  - Sizes: sm, md
  - Optional icons in tabs
  - Lazy content rendering (don't mount inactive tab content)
  - Keyboard navigation (arrow keys between tabs)
  - Full TypeScript interface per COMPONENT_LIBRARY_V2.md
  - Test: switches tabs, keyboard nav, lazy rendering

- [ ] **Global CSS cleanup**
  - Remove any unused shadcn/ui component styles
  - Ensure all V2 components consume design tokens
  - Update `components.json` if needed for shadcn CLI

- [ ] **Phase 1 Quality Gate:**
  - All 10 components render correctly in Storybook or dev server
  - Each component has TypeScript interface exported
  - Each component uses V2 design tokens (no hardcoded colors)
  - All components pass basic accessibility checks
  - `npm run build` passes with zero errors
  - Components are importable from `@/components/ui/`

---

### Phase 2: Navigation (Days 6–7)

**Goal:** Reduce sidebar from 14+ to 6 items. Implement Command Palette. Add breadcrumbs.

**Reference:** `NAVIGATION_REARCHITECTURE.md`

#### Day 6: Sidebar Reduction & Settings Consolidation

- [ ] **Restructure sidebar** (`components/layout/app-sidebar.tsx`)
  - Remove: Chunks, Sources, Search, Playground, Prompts, Widgets, API, duplicate Analytics items
  - Keep: Home, Chat, Documents, Knowledge, Analytics, Settings (6 items)
  - Add workspace selector at top
  - Add user avatar + dropdown at bottom
  - Icon-only mode for collapsed state (64px)
  - Active state: brand-500 left border + brand-50 background
  - Smooth collapse/expand animation

- [ ] **Consolidate settings** (`app/(admin)/settings/page.tsx`)
  - Single tabbed page replacing 6 separate settings locations
  - Tabs: General, AI Providers, API Keys, Integrations, Billing, Workspace
  - Each tab loads its content lazily
  - Mobile: bottom sheet with swipe to dismiss

- [ ] **Add breadcrumbs** (`components/ui/breadcrumb-v2.tsx`)
  - Show on all pages except root (dashboard, chat, landing)
  - Format: `Home / Documents / Report Q3.pdf`
  - Last segment is non-clickable (current page)
  - Mobile: truncated with `...` for deep paths
  - Integrate with Next.js App Router path detection

#### Day 7: Command Palette

- [ ] **Command Palette** (`components/ui/command-palette.tsx`)
  - Trigger: `Cmd+K` (Mac) / `Ctrl+K` (Windows)
  - Search input at top
  - Grouped results: Navigation, Actions, Recent
  - Keyboard navigation: arrow keys, Enter to select, Escape to close
  - Fuzzy search across all commands
  - Commands include:
    - Navigate to: Home, Chat, Documents, Knowledge, Analytics, Settings
    - Actions: New Chat, Upload Document, Search Chunks, Open Playground, Manage Prompts
    - Advanced: View Sources, View Chunks, Clear Cache
  - Recent searches persisted in localStorage
  - Accessible: role="dialog", aria-label, focus management

- [ ] **Mobile navigation** (`components/layout/mobile-nav.tsx`)
  - Bottom tab bar: Home, Chat, Documents, Knowledge, More
  - "More" opens bottom sheet with: Analytics, Settings
  - Active tab: brand-500 icon + label
  - Inactive tab: neutral-500 icon, no label
  - Safe area padding for iOS notch/home indicator
  - Fixed bottom, 56px height + safe area

- [ ] **Route cleanup**
  - Verify all old routes redirect or are removed
  - Update middleware.ts for new route structure
  - Test deep links still work

- [ ] **Phase 2 Quality Gate:**
  - Sidebar shows exactly 6 items
  - `Cmd+K` opens Command Palette from any page
  - Breadcrumbs show on all interior pages
  - Settings is a single tabbed page
  - Mobile bottom tab bar works on 375px viewport
  - No broken links or 404s on existing routes

---

### Phase 3: Landing Page (Days 8–10)

**Goal:** Transform the landing page from "weekend hackathon" to "premium SaaS product."

**Reference:** `LANDING_PAGE_V2_SPEC.md`

#### Day 8: Hero + Navigation

- [ ] **Top navigation** (`app/page.tsx` nav section)
  - MimoNotes wordmark (text, not image) in Geist Sans
  - Nav links: Features, How It Works, Pricing
  - Right side: "Sign In" link + "Get Started" button (primary)
  - Sticky on scroll with backdrop blur
  - Mobile: hamburger menu with slide-in panel

- [ ] **Hero section**
  - Remove ALL emoji (critical)
  - Headline: "Your knowledge, conversations with AI" (or similar value proposition from spec)
  - Subheadline: 1-2 sentences explaining RAG value prop
  - CTA: "Start for Free — No credit card required"
  - Secondary CTA: "See how it works →"
  - Product screenshot / hero image (placeholder with gradient if no real screenshot yet)
  - Background: subtle gradient using brand-50 to neutral-50

- [ ] **Social proof bar**
  - Logo strip (use placeholder company logos or "Trusted by teams using...")
  - Key stat: "10,000+ documents processed" or similar
  - Star rating placeholder

#### Day 9: Features + How It Works + Product Showcase

- [ ] **Product showcase**
  - 2-3 screenshots of actual MimoNotes UI
  - If no real screenshots: create styled mockups using actual component library
  - Caption for each showing the feature

- [ ] **Features section**
  - 3-column grid (desktop), stacked (mobile)
  - Feature 1: "RAG-Powered Answers" — AI that cites its sources
  - Feature 2: "Multi-Format Ingestion" — PDF, DOCX, TXT, CSV, URLs
  - Feature 3: "Workspace Collaboration" — organize knowledge by team/project
  - Each feature: icon (Lucide), title, 1-sentence description
  - Icons from Lucide — NOT emoji

- [ ] **How It Works**
  - 3-step horizontal flow
  - Step 1: "Upload your documents"
  - Step 2: "Ask questions in natural language"
  - Step 3: "Get accurate, cited answers"
  - Connected with subtle line/arrow between steps

#### Day 10: Pricing + FAQ + Footer

- [ ] **Pricing section**
  - 2-3 tier cards (Free, Pro, Team)
  - Highlight recommended tier
  - Clear feature comparison
  - CTA button per tier
  - "Cancel anytime" note

- [ ] **FAQ section**
  - 6-8 common questions
  - Accordion/collapsible design
  - Questions: What is RAG?, Is my data secure?, What file formats?, Can I self-host?, Pricing?

- [ ] **Final CTA section**
  - Full-width band with brand gradient background
  - Headline: "Start building your knowledge base today"
  - CTA button (primary, large)

- [ ] **Footer**
  - 4-column layout (desktop)
  - Product: Features, Pricing, Changelog
  - Resources: Documentation, API Reference, Blog
  - Company: About, Contact, Privacy, Terms
  - Social: GitHub, Twitter/X
  - Copyright + "Built with ❤️" (one emoji allowed here)

- [ ] **SEO & Meta**
  - Title: "MimoNotes — AI-Powered Knowledge Base & RAG Chatbot"
  - Description: compelling meta description
  - Open Graph tags with product screenshot
  - Structured data (JSON-LD) for SaaS product

- [ ] **Phase 3 Quality Gate:**
  - Zero emoji on landing page (except footer heart)
  - Lighthouse Performance 90+ on landing
  - All sections render on mobile (375px)
  - No "template" feeling — distinctive brand identity
  - Product screenshots or mockups visible
  - Pricing visible without navigation
  - Social proof present (logos, stats, or testimonials)

---

### Phase 4: Chat Experience (Days 11–14)

**Goal:** Transform chat from functional to premium. This is where users spend 80% of their time.

**Reference:** `CHAT_EXPERIENCE_V2.md`

#### Day 11: Empty State + Message Redesign

- [ ] **Empty state** (`components/chat/chat-empty-state.tsx`)
  - Show when no messages in session
  - Category-based suggested prompts:
    - "Summarize my documents"
    - "What are the key findings in [doc]?"
    - "Compare [topic] across my sources"
    - "Find everything about [topic]"
  - Each suggestion is clickable (inserts into input)
  - Subtle illustration/icon above suggestions
  - Workspace name shown: "Ask anything about [workspace name]"

- [ ] **Message redesign** (`components/chat/message-bubble.tsx`)
  - User messages: right-aligned, brand-50 background, subtle rounded corners
  - Assistant messages: left-aligned, neutral-50 background (dark: neutral-900)
  - Max-width 768px, centered
  - Avatar: user initials (brand-500 background) + AI icon (neutral background)
  - Markdown rendering with syntax highlighting
  - Code blocks: dark background, copy button, language label
  - Timestamps on hover (not always visible)

- [ ] **Source citations** (`components/chat/source-citation.tsx`)
  - Inline `[1]`, `[2]`, `[3]` markers in AI responses
  - Click marker → scrolls to source panel or opens source detail
  - Source panel (right side, toggleable): shows document name, relevance score, excerpt
  - Mobile: source panel as bottom sheet

#### Day 12: Streaming + Input + Model Selector

- [ ] **Streaming indicator** (`components/chat/streaming-indicator.tsx`)
  - Typewriter effect during response generation
  - Blinking cursor at end of streaming text
  - "Thinking..." state with subtle pulse animation
  - Smooth transition from streaming to static

- [ ] **Chat input redesign** (`components/chat/chat-input.tsx`)
  - Textarea with auto-resize (1-4 lines)
  - Placeholder: "Ask about your documents..."
  - Left side: paperclip icon for file attachment
  - Right side: send button (brand-500, disabled when empty)
  - Keyboard: Enter to send, Shift+Enter for newline
  - Drag-and-drop file upload zone
  - File preview chips above input when files attached

- [ ] **Model selector** (`components/chat/model-selector.tsx`)
  - Dropdown in chat header
  - Shows available models from workspace settings
  - Format: "Model Name · Provider" (e.g., "GPT-4 · OpenAI")
  - Current model persisted per session

#### Day 13: Session Management + Feedback

- [ ] **Session sidebar redesign** (`components/chat/session-sidebar.tsx`)
  - Pinned sessions at top
  - Recent sessions below
  - Search sessions (Cmd+F within sidebar)
  - Sort: recent, alphabetical, most messages
  - Rename session (inline edit)
  - Delete session with confirmation dialog (NOT window.confirm)

- [ ] **Feedback mechanism** (`components/chat/feedback-buttons.tsx`)
  - Thumbs up/down on each assistant message
  - Click opens optional text feedback form
  - Feedback stored via API endpoint
  - Visual feedback: filled icon on selection

- [ ] **Regenerate button** (`components/chat/regenerate-button.tsx`)
  - "Regenerate" button below each assistant message
  - Shows on hover (desktop) or always (mobile)
  - Triggers new AI response for same query
  - Replaces previous response

#### Day 14: Chat Layout + Integration

- [ ] **Three-panel layout** (`components/chat/chat-layout.tsx`)
  - Desktop (≥1280px): sidebar (280px) + main chat + source panel (360px)
  - Medium (≥768px): collapsed sidebar (64px) + main chat, source panel toggled via Cmd+D
  - Mobile (<768px): full-screen chat, sidebar as drawer, sources as bottom sheet

- [ ] **Chat page integration** (`app/chat/page.tsx`)
  - Wire up all new components
  - Ensure streaming still works with existing API routes
  - Test session persistence
  - Test with all AI providers (OpenAI, LM Studio, Ollama)

- [ ] **Phase 4 Quality Gate:**
  - Chat loads with suggested prompts empty state
  - Streaming works with typewriter effect
  - Source citations are clickable and show source panel
  - Model selector shows available providers
  - Session sidebar shows pinned + recent sessions
  - Feedback buttons work on assistant messages
  - Regenerate produces new response
  - Three-panel layout works at all breakpoints
  - Zero console errors during chat session

---

### Phase 5: Dashboard (Days 15–17)

**Goal:** Transform dashboard from data dump to action-oriented launchpad.

**Reference:** `DASHBOARD_V2_SPEC.md`

#### Day 15: Welcome Hero + Quick Actions

- [ ] **Welcome hero** (`components/dashboard/welcome-hero.tsx`)
  - Personalized greeting: "Good [morning/afternoon], [Name]"
  - Quick stats row: documents count, chat count, last active
  - Continue-where-you-left-off: last conversation card with one-click resume
  - Onboarding progress bar (for new users): 3 steps (Upload → First Chat → Explore)

- [ ] **Quick actions** (`components/dashboard/quick-actions.tsx`)
  - 4 cards (not 6), in a 2x2 grid
  - Actions: "New Chat" (primary, largest), "Upload Document", "Search Knowledge", "View Analytics"
  - Each card: icon (Lucide), title, keyboard shortcut badge
  - Keyboard shortcuts: Cmd+N (chat), Cmd+U (upload), Cmd+K→search, Cmd+A (analytics)
  - "New Chat" card is 2x width (spans full row)

#### Day 16: Activity Feed + Knowledge Health

- [ ] **Activity feed** (`components/dashboard/activity-feed.tsx`)
  - Last 5-10 activity items
  - Types: chat started, document uploaded, document processed, question asked
  - Each item: icon, description, timestamp (relative: "2 hours ago")
  - "View all" link to analytics
  - Empty state: "No recent activity. Start a chat or upload a document."

- [ ] **Knowledge health** (`components/dashboard/knowledge-health.tsx`)
  - Document count with status breakdown (processing, ready, failed)
  - Donut chart (Recharts): document types distribution
  - Total chunks count
  - Last embedding run timestamp
  - Warning indicator if documents are stale (>30 days)

#### Day 17: Usage Charts + Integration

- [ ] **Usage overview** (`components/dashboard/usage-overview.tsx`)
  - Line chart (Recharts): queries per day (last 7 days)
  - Key metrics: total queries, avg response time, most active day
  - Token usage bar (if applicable)

- [ ] **Dashboard page integration** (`app/dashboard/page.tsx`)
  - Wire up all new sections
  - Add skeleton loading states for each section
  - Progressive loading: hero loads first, charts load async
  - Mobile: single column, sections stacked vertically

- [ ] **Charts styling** (`components/dashboard/charts.tsx`)
  - Recharts components themed with V2 design tokens
  - Brand-500 for primary data series
  - Neutral scale for gridlines and axes
  - Tooltip styled to match V2 design language
  - Responsive: charts resize on window change

- [ ] **Phase 5 Quality Gate:**
  - Dashboard loads with personalized greeting
  - Quick actions are 4 cards with keyboard shortcuts
  - Activity feed shows recent items
  - Charts render with real data (or mock data if no history)
  - Mobile layout is single column
  - Skeleton loaders appear during data fetch
  - No layout shifts (CLS < 0.1)

---

### Phase 6: Documents & Upload (Days 18–19)

**Goal:** Improve document management from basic list to searchable, filterable interface.

**Reference:** `COMPONENT_LIBRARY_V2.md` (Table, Search, File Upload components)

#### Day 18: Document List + Search

- [ ] **Search & filter bar** (`components/documents/document-toolbar.tsx`)
  - Search input (full-text search across document titles)
  - Filter dropdown: status (All, Ready, Processing, Failed)
  - Sort dropdown: newest, oldest, name A-Z, name Z-A, largest
  - View toggle: list view / grid view
  - "Upload" button (primary, always visible)

- [ ] **Document list** (`components/documents/document-list.tsx`)
  - Table view (default): columns for name, type, size, status, chunks, date
  - Grid view: card layout with document icon, name, status badge
  - Status badges: green (ready), yellow (processing), red (failed)
  - Click row → navigate to document detail
  - Bulk select with checkboxes (for future batch operations)

- [ ] **Empty state** for zero documents
  - "No documents yet"
  - CTA: "Upload your first document"
  - Brief explanation of supported formats

#### Day 19: Upload Flow + Dialog Replacement

- [ ] **Upload flow improvement** (`components/documents/upload-dialog.tsx`)
  - Replace page-level upload with modal dialog (triggered from FAB or toolbar)
  - Drag-and-drop zone (large, prominent)
  - Or click to browse files
  - Accept: .pdf, .docx, .txt, .csv, .xlsx, URLs
  - Multi-file upload support
  - Upload progress bar per file
  - Success/error state per file
  - Auto-close after all uploads complete

- [ ] **Replace window.confirm()**
  - Find all `window.confirm()` calls in document-related code
  - Replace with V2 Dialog component
  - Consistent confirmation pattern: title, description, cancel/confirm buttons
  - Destructive confirm button (red variant)

- [ ] **Document preview** (`components/documents/document-preview.tsx`)
  - Modal preview of document metadata
  - Shows: title, type, size, chunk count, upload date, status
  - List of chunks (collapsible)
  - Quick actions: re-process, delete, download

- [ ] **Phase 6 Quality Gate:**
  - Document list shows search, filter, sort controls
  - Grid/list view toggle works
  - Upload dialog opens from FAB
  - Drag-and-drop upload works
  - No window.confirm() calls remain in document code
  - Document preview modal shows correct data
  - Empty state shows when no documents

---

### Phase 7: Mobile (Days 20–22)

**Goal:** Make MimoNotes genuinely usable on mobile — not a shrunken desktop.

**Reference:** `MOBILE_EXPERIENCE_V2.md`

#### Day 20: Bottom Tab Bar + Touch Targets

- [ ] **Bottom tab bar** (refine `components/layout/mobile-nav.tsx`)
  - 5 tabs: Home, Chat, Documents, Knowledge, More
  - Active: brand-500 icon + label below
  - Inactive: neutral-400 icon, no label
  - "More" opens bottom sheet with: Analytics, Settings
  - Fixed bottom, z-index above all content
  - Safe area padding (env(safe-area-inset-bottom))
  - Smooth tab transition animations

- [ ] **Touch target audit**
  - All interactive elements minimum 44x44px
  - Check: buttons, links, form inputs, checkboxes, toggles
  - Increase padding on small elements
  - Test with actual finger taps (not just viewport size)

- [ ] **Mobile-specific layouts**
  - Dashboard: single column, cards full-width
  - Documents: full-width list items, larger tap targets
  - Settings: full-width tabs, stacked sections
  - Chat: full-width input, messages full-width

#### Day 21: Gestures + Pull-to-Refresh

- [ ] **Swipe gestures**
  - Swipe right from left edge: open sidebar (drawer)
  - Swipe left: close sidebar
  - Swipe down: pull-to-refresh (on dashboard, documents, knowledge)
  - Swipe on chat session: delete/rename actions
  - Use CSS transform for smooth 60fps gesture animation
  - Add `touch-action` CSS for proper gesture handling

- [ ] **Pull-to-refresh**
  - Apply to: dashboard, documents list, knowledge list
  - Visual indicator: spinner + "Pull to refresh" text
  - Trigger threshold: 60px pull distance
  - Refresh data from API
  - Show success/failure toast

- [ ] **Full-screen chat on mobile**
  - Chat page takes full viewport (no sidebar visible)
  - Session list accessible via swipe or hamburger
  - Source panel as bottom sheet (swipe up to reveal)
  - Input always visible at bottom (not hidden by keyboard)
  - `visualViewport` API to handle keyboard resize

#### Day 22: Mobile Testing + Polish

- [ ] **Real device testing**
  - Test on iPhone (Safari): iPhone 14, iPhone 15
  - Test on Android (Chrome): Pixel 7, Samsung Galaxy
  - Test on iPad (Safari): landscape + portrait
  - Check: safe areas, keyboard behavior, scroll, touch targets
  - Screenshot each key screen for documentation

- [ ] **Mobile performance**
  - Reduce bundle size for mobile (code splitting)
  - Lazy load below-fold content
  - Optimize images (responsive srcset)
  - Minimize JavaScript execution on initial load

- [ ] **Phase 7 Quality Gate:**
  - Bottom tab bar works on 375px and 414px viewports
  - All touch targets are ≥44px
  - Swipe gestures work on real device
  - Pull-to-refresh triggers data reload
  - Chat is full-screen and usable on mobile
  - Keyboard doesn't break input visibility
  - No horizontal scroll on any mobile page
  - Test passes on Chrome DevTools mobile emulation + real devices

---

### Phase 8: Polish (Days 23–25)

**Goal:** Add the final 10% that separates "good" from "great." Skeleton loaders, micro-interactions, keyboard shortcuts, accessibility, performance.

#### Day 23: Skeletons + Micro-interactions

- [ ] **Skeleton loaders for all pages**
  - Dashboard: hero skeleton, chart skeletons, card skeletons
  - Documents: list skeleton (5 rows), grid skeleton (6 cards)
  - Chat: message skeletons (3 messages), input skeleton
  - Knowledge: document viewer skeleton
  - Use V2 Skeleton component from Phase 1

- [ ] **Micro-interactions**
  - Button hover: subtle scale (1.02) + shadow increase
  - Button click: scale (0.98) + return
  - Card hover: subtle lift (translateY(-2px))
  - Tab switch: underline slide animation
  - Sidebar item hover: background color transition
  - Toast enter: slide in from right
  - Toast exit: fade out + slide right
  - Dialog enter: scale from 0.95 + fade in
  - All transitions use V2 motion tokens

- [ ] **Loading states**
  - Skeleton → content transition (fade in, no layout shift)
  - Button loading: spinner replaces icon, text stays
  - Form submission: disable button + show spinner
  - Page transitions: subtle fade

#### Day 24: Keyboard Shortcuts + Onboarding

- [ ] **Keyboard shortcuts** (`lib/keyboard-shortcuts.ts`)
  - `Cmd+K`: Open Command Palette
  - `Cmd+N`: New Chat
  - `Cmd+U`: Upload Document
  - `Cmd+B`: Toggle Sidebar
  - `Cmd+D`: Toggle Source Panel (in chat)
  - `Cmd+/`: Show keyboard shortcuts help
  - `Escape`: Close any modal/dialog
  - `↑` / `↓`: Navigate command palette results
  - Global shortcut listener with proper event handling
  - Don't intercept shortcuts in form inputs

- [ ] **Keyboard shortcuts help modal**
  - Triggered by `Cmd+/`
  - Shows all available shortcuts grouped by context
  - Searchable
  - Keyboard shortcut badges on buttons (e.g., "New Chat ⌘N")

- [ ] **Onboarding flow** (`components/onboarding/onboarding-flow.tsx`)
  - Trigger: first login or no documents uploaded
  - 3-step flow:
    1. "Welcome to MimoNotes" — brief value prop + workspace name
    2. "Upload your first document" — guided upload
    3. "Ask your first question" — guided chat
  - Skip button on each step
  - Progress indicator (step 1 of 3)
  - Completion state: "You're all set!" with confetti or checkmark
  - Persist completion state in localStorage or user settings

#### Day 25: Accessibility + Performance

- [ ] **Accessibility audit**
  - Run axe-core on all major pages
  - Fix any WCAG AA violations:
    - All images have alt text
    - All forms have labels
    - All interactive elements are keyboard accessible
    - Color contrast meets 4.5:1 minimum
    - Focus indicators visible on all focusable elements
    - ARIA labels on icon-only buttons
    - Screen reader announcements for dynamic content (aria-live)
  - Test with VoiceOver (Mac) or NVDA (Windows)

- [ ] **Performance optimization**
  - Run Lighthouse on all major pages
  - Target: 90+ on Performance, Accessibility, Best Practices
  - Optimize:
    - Image loading (next/image with priority for above-fold)
    - Font loading (font-display: swap)
    - JavaScript splitting (dynamic imports for heavy components)
    - CSS extraction (minimal inline styles)
    - Reduce CLS (set explicit dimensions on images/charts)
  - Bundle analysis: identify and tree-shake unused code
  - Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1

- [ ] **Cross-browser testing**
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest)
  - Edge (latest)
  - Safari iOS (latest)
  - Chrome Android (latest)

- [ ] **Phase 8 Quality Gate:**
  - All pages have skeleton loaders (no blank states during load)
  - Micro-interactions feel smooth (no jank)
  - Keyboard shortcuts work and don't conflict
  - Onboarding flow completes end-to-end
  - axe-core reports zero critical violations
  - Lighthouse 90+ on Performance
  - Lighthouse 90+ on Accessibility
  - No console errors on any page
  - `npm run build` passes cleanly
  - All 353 backend tests still passing

---

## 3. Component Build Order

### Dependency Graph

```
Design Tokens (Phase 0)
    │
    ├── Button ─────────────────────────────┐
    ├── Input ──────────────────────────────┤
    ├── Badge ──────────────────────────────┤
    ├── Avatar ─────────────────────────────┤
    │                                       ├── Card
    │                                       │     │
    │                                       │     ├── Dashboard Cards
    │                                       │     ├── Document Cards
    │                                       │     └── Landing Page Cards
    │                                       │
    ├── Dialog ─────────────────────────────┤
    │     │                                 │
    │     └── Upload Dialog                 │
    │     └── Confirm Dialog                │
    │     └── Onboarding Dialog             │
    │                                       │
    ├── Toast ──────────────────────────────┤
    │                                       │
    ├── Empty State ────────────────────────┤
    │     │                                 │
    │     ├── Chat Empty State              │
    │     ├── Document Empty State          │
    │     └── Knowledge Empty State         │
    │                                       │
    ├── Skeleton ───────────────────────────┤
    │     │                                 │
    │     ├── Card Skeleton                 │
    │     ├── List Skeleton                 │
    │     ├── Chat Skeleton                 │
    │     └── Chart Skeleton                │
    │                                       │
    └── Tabs ───────────────────────────────┘
          │
          ├── Settings Tabs
          ├── Dashboard Tabs
          └── Knowledge Tabs
```

### Build Order (Critical Path)

```
Day 1-2:  Tokens ──────────────────────────────────────────→ Foundation
Day 3:    Button, Input, Card, Badge ──────────────────────→ Primitives
Day 4:    Avatar, Dialog, Toast, Empty State ──────────────→ Primitives
Day 5:    Skeleton, Tabs ──────────────────────────────────→ Primitives
Day 6:    Sidebar, Settings, Breadcrumbs ──────────────────→ Navigation
Day 7:    Command Palette, Mobile Nav ─────────────────────→ Navigation
Day 8-10: Landing Page (all sections) ─────────────────────→ Pages
Day 11-14: Chat Experience (all features) ─────────────────→ Pages
Day 15-17: Dashboard (all sections) ───────────────────────→ Pages
Day 18-19: Documents (search, upload, preview) ────────────→ Pages
Day 20-22: Mobile (gestures, tab bar, testing) ────────────→ Polish
Day 23-25: Polish (skeletons, a11y, performance) ──────────→ Ship
```

### Critical Path Identification

The **critical path** is:

```
Tokens → Button/Card → Sidebar → Chat Page → Dashboard → Polish → Ship
```

If any step on this path is delayed, the launch date shifts. The landing page, documents page, and mobile work can be parallelized with the chat/dashboard work if needed.

---

## 4. File Change Map

### New Files to Create

| Path | Phase | Est. LOC | Description |
|------|-------|----------|-------------|
| `app/fonts/geist-sans.woff2` | 0 | — | Geist Sans font file |
| `app/fonts/geist-mono.woff2` | 0 | — | Geist Mono font file |
| `components/ui/button-v2.tsx` | 1 | 120 | V2 Button component |
| `components/ui/input-v2.tsx` | 1 | 80 | V2 Input component |
| `components/ui/card-v2.tsx` | 1 | 100 | V2 Card component |
| `components/ui/badge-v2.tsx` | 1 | 60 | V2 Badge component |
| `components/ui/avatar-v2.tsx` | 1 | 70 | V2 Avatar component |
| `components/ui/dialog-v2.tsx` | 1 | 90 | V2 Dialog component |
| `components/ui/toast-v2.tsx` | 1 | 80 | V2 Toast component |
| `components/ui/empty-state-v2.tsx` | 1 | 80 | V2 Empty State component |
| `components/ui/skeleton-v2.tsx` | 1 | 60 | V2 Skeleton component |
| `components/ui/tabs-v2.tsx` | 1 | 70 | V2 Tabs component |
| `components/ui/breadcrumb-v2.tsx` | 2 | 60 | Breadcrumb component |
| `components/ui/command-palette.tsx` | 2 | 200 | Command Palette |
| `components/layout/mobile-nav.tsx` | 2 | 120 | Mobile bottom tab bar |
| `components/chat/chat-empty-state.tsx` | 4 | 100 | Chat empty state |
| `components/chat/message-bubble.tsx` | 4 | 150 | Redesigned message bubble |
| `components/chat/source-citation.tsx` | 4 | 100 | Inline source citations |
| `components/chat/streaming-indicator.tsx` | 4 | 60 | Streaming animation |
| `components/chat/chat-input.tsx` | 4 | 180 | Redesigned chat input |
| `components/chat/model-selector.tsx` | 4 | 80 | AI model dropdown |
| `components/chat/session-sidebar.tsx` | 4 | 150 | Session management sidebar |
| `components/chat/feedback-buttons.tsx` | 4 | 80 | Thumbs up/down feedback |
| `components/chat/regenerate-button.tsx` | 4 | 50 | Regenerate response |
| `components/chat/chat-layout.tsx` | 4 | 120 | Three-panel chat layout |
| `components/dashboard/welcome-hero.tsx` | 5 | 100 | Welcome section |
| `components/dashboard/quick-actions.tsx` | 5 | 80 | Quick action cards |
| `components/dashboard/activity-feed.tsx` | 5 | 100 | Activity feed |
| `components/dashboard/knowledge-health.tsx` | 5 | 100 | Knowledge health cards |
| `components/dashboard/usage-overview.tsx` | 5 | 100 | Usage charts |
| `components/dashboard/charts.tsx` | 5 | 120 | Recharts theme wrapper |
| `components/documents/document-toolbar.tsx` | 6 | 100 | Search/filter/sort bar |
| `components/documents/document-list.tsx` | 6 | 150 | Document list/grid |
| `components/documents/upload-dialog.tsx` | 6 | 120 | Upload modal |
| `components/documents/document-preview.tsx` | 6 | 80 | Document preview modal |
| `components/onboarding/onboarding-flow.tsx` | 8 | 150 | 3-step onboarding |
| `lib/keyboard-shortcuts.ts` | 8 | 100 | Keyboard shortcut definitions |
| `lib/v2-design-tokens.ts` | 0 | 50 | TypeScript token exports |
| **Total new files** | | **~4,100** | |

### Files to Modify

| Path | Phase | Change Description |
|------|-------|--------------------|
| `app/globals.css` | 0 | Replace CSS variables with V2 oklch tokens |
| `app/layout.tsx` | 0 | Import Geist fonts, update font family |
| `tailwind.config.ts` (or equivalent) | 0 | Add V2 tokens to theme |
| `components/layout/app-sidebar.tsx` | 2 | Reduce to 6 items, new styling |
| `components/layout/dashboard-shell.tsx` | 2 | Update for new sidebar + breadcrumbs |
| `components/layout/top-nav.tsx` | 2 | Update for V2 design |
| `app/page.tsx` | 3 | Complete landing page rewrite |
| `app/chat/page.tsx` | 4 | Integrate new chat components |
| `app/dashboard/page.tsx` | 5 | Integrate new dashboard components |
| `app/(admin)/documents/page.tsx` | 6 | Integrate search/filter/grid |
| `app/(admin)/settings/page.tsx` | 2 | Consolidate into tabbed page |
| `components.json` | 1 | Update for V2 component paths |
| `middleware.ts` | 2 | Update route mappings |
| **Total files modified** | | **~13** |

### Files to Delete/Deprecate

| Path | Phase | Reason |
|------|-------|--------|
| Old shadcn/ui components (if replaced) | 1 | Superseded by V2 versions |
| `app/(admin)/analytics/usage/page.tsx` | 2 | Merged into `/analytics` |
| `app/(admin)/analytics/cost/page.tsx` | 2 | Merged into `/analytics` |
| `app/(admin)/analytics/chat/page.tsx` | 2 | Merged into `/analytics` |
| `DASHBOARD_REDESIGN.md` | 5 | Replaced by DASHBOARD_V2_SPEC |
| `NAVIGATION_REDESIGN.md` | 2 | Replaced by NAVIGATION_REARCHITECTURE |
| `CHAT_EXPERIENCE.md` | 4 | Replaced by CHAT_EXPERIENCE_V2 |
| **Total files deleted** | | **~7** |

---

## 5. Risk Assessment

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **shadcn/ui v4 breaking changes** | Medium | High | Pin shadcn version, test each component against API. Use shadcn CLI to scaffold, then customize. Keep shadcn base as fallback. |
| **Tailwind v4 oklch compatibility** | Medium | Medium | Test oklch values in CSS early (Phase 0). Fallback to hex if needed. oklch is well-supported in modern browsers but verify. |
| **Geist font loading FOUT** | Low | Low | Use `font-display: swap`, preload critical weights. Geist is optimized for web. |
| **Recharts bundle size** | Low | Medium | Recharts is already in dependencies. Use dynamic import for chart components. Consider lighter alternatives if bundle too large. |
| **Next.js 16 edge cases** | Low | High | Next.js 16.2.7 is stable. Test SSR/SSG for all new pages. Watch for App Router quirks with new components. |
| **API route changes** | Low | High | Backend is stable. No backend changes needed for V2 frontend. All API routes remain unchanged. |

### Design Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Scope creep** | High | Critical | Strict adherence to design docs. Each phase has a clear quality gate. If behind schedule, cut polish (Phase 8) before cutting core features. |
| **Perfectionism** | High | High | "Done is better than perfect." Ship at 8/10, iterate to 10/10 post-launch. Time-box each phase. |
| **Design doc ambiguity** | Medium | Medium | When in doubt, reference `MIMONOTES_V2_DESIGN_SYSTEM.md` as source of truth. Ask specific questions rather than guessing. |
| **Responsive breakpoint conflicts** | Medium | Medium | Test at 375px, 768px, 1280px, 1440px. Use CSS container queries where appropriate. |

### Time Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Phase 4 (Chat) overruns** | High | High | Chat is the most complex phase (4 days). If behind by Day 13, simplify: skip source panel on desktop, implement basic citations only. |
| **Phase 8 (Polish) cut entirely** | Medium | Medium | Polish is the "nice to have" phase. If behind schedule, ship without full polish and iterate post-launch. Core functionality is in Phases 1-7. |
| **Integration issues** | Medium | High | Each phase has a quality gate. Don't start next phase until current phase passes its gate. |
| **Unexpected bugs** | Medium | Medium | Keep 1-2 buffer days in schedule. If a bug takes >2 hours, document it and move on — fix in polish phase. |

### Mitigation Strategies Summary

1. **Time-box everything.** If a task isn't done in its allocated time, ship what you have and move on.
2. **Cut scope, not quality.** Better to have 8 great features than 12 mediocre ones.
3. **Test early, test often.** Run `npm run build` after every significant change.
4. **Use feature flags.** Wrap V2 pages in feature flags so you can deploy incrementally.
5. **Keep V1 alive.** Don't delete V1 pages until V2 is confirmed working in production.

---

## 6. Quality Gates

### After Each Phase

#### Phase 0 Gate
- [ ] `npm run build` — zero errors
- [ ] Geist fonts render in browser
- [ ] All CSS custom properties present in DevTools
- [ ] Dark mode toggle works
- [ ] No visual regression on existing pages

#### Phase 1 Gate
- [ ] All 10 components render correctly
- [ ] Each component has TypeScript interface
- [ ] Each component uses V2 tokens (no hardcoded colors)
- [ ] Basic a11y checks pass (keyboard nav, aria labels)
- [ ] `npm run build` — zero errors

#### Phase 2 Gate
- [ ] Sidebar shows exactly 6 items
- [ ] Command Palette opens with Cmd+K
- [ ] Breadcrumbs on all interior pages
- [ ] Settings is single tabbed page
- [ ] Mobile bottom tab bar works (375px)
- [ ] No broken links or 404s

#### Phase 3 Gate
- [ ] Zero emoji on landing page (except footer heart)
- [ ] Lighthouse Performance 90+
- [ ] All sections render on mobile
- [ ] Product screenshots/mockups visible
- [ ] Pricing visible without navigation

#### Phase 4 Gate
- [ ] Empty state with suggested prompts
- [ ] Streaming with typewriter effect
- [ ] Source citations clickable
- [ ] Model selector functional
- [ ] Session sidebar with pinned/recent
- [ ] Feedback buttons work
- [ ] Regenerate produces new response
- [ ] Three-panel layout at all breakpoints
- [ ] Zero console errors in chat

#### Phase 5 Gate
- [ ] Personalized greeting
- [ ] 4 quick action cards with shortcuts
- [ ] Activity feed shows data
- [ ] Charts render correctly
- [ ] Mobile: single column layout
- [ ] Skeleton loaders during fetch
- [ ] CLS < 0.1

#### Phase 6 Gate
- [ ] Search/filter/sort controls work
- [ ] Grid/list toggle works
- [ ] Upload dialog opens
- [ ] Drag-and-drop works
- [ ] No window.confirm() calls
- [ ] Document preview modal works
- [ ] Empty state for zero documents

#### Phase 7 Gate
- [ ] Bottom tab bar on 375px + 414px
- [ ] All touch targets ≥44px
- [ ] Swipe gestures on real device
- [ ] Pull-to-refresh works
- [ ] Chat full-screen on mobile
- [ ] Keyboard doesn't break input
- [ ] No horizontal scroll

#### Phase 8 Gate (Final)
- [ ] All pages have skeleton loaders
- [ ] Micro-interactions smooth
- [ ] Keyboard shortcuts work
- [ ] Onboarding flow completes
- [ ] axe-core: zero critical violations
- [ ] Lighthouse 90+ Performance
- [ ] Lighthouse 90+ Accessibility
- [ ] Zero console errors
- [ ] `npm run build` clean
- [ ] 353 backend tests still passing

### Visual Regression Testing

- Screenshot key pages at 1280px, 768px, 375px after each phase
- Compare against previous phase screenshots
- Manual review: does anything look broken or inconsistent?
- Save screenshots in `.ui-audit/v2-progress/` for comparison

### Accessibility Checklist (Per Component)

- [ ] Keyboard accessible (Tab, Enter, Escape, Arrow keys)
- [ ] Focus indicator visible
- [ ] ARIA labels on interactive elements
- [ ] Color not sole indicator of state
- [ ] Contrast ratio ≥4.5:1 for text
- [ ] Contrast ratio ≥3:1 for large text and UI components
- [ ] Screen reader announces dynamic changes
- [ ] Reduced motion media query respected

### Performance Benchmarks

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | <1.5s | Lighthouse |
| Largest Contentful Paint | <2.5s | Lighthouse |
| Total Blocking Time | <200ms | Lighthouse |
| Cumulative Layout Shift | <0.1 | Lighthouse |
| Time to Interactive | <3.0s | Lighthouse |
| Bundle Size (initial) | <250KB | next build output |
| Lighthouse Performance | 90+ | Lighthouse |
| Lighthouse Accessibility | 90+ | Lighthouse |

### Cross-Browser Testing

| Browser | Priority | Notes |
|---------|----------|-------|
| Chrome (latest) | P0 | Primary development browser |
| Safari (latest) | P0 | Must work (macOS + iOS) |
| Firefox (latest) | P1 | Secondary |
| Edge (latest) | P1 | Chromium-based, likely works if Chrome does |
| Safari iOS | P0 | Mobile-critical |
| Chrome Android | P0 | Mobile-critical |

---

## 7. Testing Strategy

### Unit Tests for Components

- **Framework:** Vitest (already configured)
- **Scope:** Test each V2 component's:
  - Renders without errors
  - Handles props correctly (variants, sizes, states)
  - Fires callbacks on interaction (click, change, submit)
  - Accessibility attributes present
- **Location:** Co-located with components (e.g., `button-v2.test.tsx`)
- **Target:** At minimum, test all 10 core components from Phase 1

### Visual Testing

- **Manual:** Screenshot comparison at key breakpoints
- **Tool:** Chrome DevTools screenshots + saved in `.ui-audit/v2-progress/`
- **Process:**
  1. Screenshot at start of phase (baseline)
  2. Screenshot at end of phase (result)
  3. Compare side-by-side
  4. Note any regressions

### Accessibility Testing

- **Automated:** axe-core via browser extension or integration
- **Manual:** Keyboard-only navigation test on each major page
- **Screen Reader:** VoiceOver (macOS) test on landing page + chat
- **Contrast:** WebAIM contrast checker for all text elements

### Performance Testing

- **Lighthouse:** Run on all major pages after Phase 8
- **Bundle Analysis:** `npx @next/bundle-analyzer` to identify large dependencies
- **Core Web Vitals:** Chrome DevTools Performance tab
- **Network:** Throttled 3G test on landing page

### Manual Testing Checklist

**Landing Page:**
- [ ] Loads fast (<3s on 3G)
- [ ] All sections render
- [ ] CTA buttons work
- [ ] Mobile menu opens/closes
- [ ] No emoji visible (except footer)
- [ ] Product screenshots show

**Chat:**
- [ ] New chat shows empty state with suggestions
- [ ] Send message works
- [ ] Streaming response appears
- [ ] Source citations clickable
- [ ] Model selector works
- [ ] Session sidebar loads
- [ ] Create/rename/delete session
- [ ] Feedback buttons work
- [ ] Regenerate works
- [ ] File attachment works

**Dashboard:**
- [ ] Personalized greeting shows
- [ ] Quick actions are clickable
- [ ] Activity feed loads
- [ ] Charts render
- [ ] Last conversation card works
- [ ] Mobile layout is single column

**Documents:**
- [ ] List loads
- [ ] Search filters results
- [ ] Sort changes order
- [ ] Grid/list toggle works
- [ ] Upload dialog opens
- [ ] Drag-and-drop works
- [ ] Document detail opens

**Navigation:**
- [ ] Sidebar shows 6 items
- [ ] Command Palette opens with Cmd+K
- [ ] Breadcrumbs correct on each page
- [ ] Settings has tabs
- [ ] Mobile tab bar works
- [ ] No broken links

---

## 8. Deployment Strategy

### Feature Flags

Wrap V2 pages in feature flags for gradual rollout:

```typescript
// lib/feature-flags.ts
export const FEATURE_FLAGS = {
  V2_LANDING: process.env.NEXT_PUBLIC_V2_LANDING === 'true',
  V2_CHAT: process.env.NEXT_PUBLIC_V2_CHAT === 'true',
  V2_DASHBOARD: process.env.NEXT_PUBLIC_V2_DASHBOARD === 'true',
  V2_NAVIGATION: process.env.NEXT_PUBLIC_V2_NAVIGATION === 'true',
  V2_DOCUMENTS: process.env.NEXT_PUBLIC_V2_DOCUMENTS === 'true',
} as const;
```

**Usage in pages:**
```typescript
// app/page.tsx
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import LandingPageV1 from './landing-v1';
import LandingPageV2 from './landing-v2';

export default function Page() {
  return FEATURE_FLAGS.V2_LANDING ? <LandingPageV2 /> : <LandingPageV1 />;
}
```

### Gradual Rollout Plan

| Week | What Ships | Flag | Rollback |
|------|-----------|------|----------|
| Week 4 (Day 22) | V2 Landing Page | `V2_LANDING=true` | Set flag to false |
| Week 4 (Day 23) | V2 Navigation | `V2_NAVIGATION=true` | Set flag to false |
| Week 4 (Day 24) | V2 Dashboard | `V2_DASHBOARD=true` | Set flag to false |
| Week 4 (Day 25) | V2 Chat + Docs | `V2_CHAT=true`, `V2_DOCUMENTS=true` | Set flags to false |

### A/B Testing (V1 vs V2)

- **Landing Page:** Show V2 to 50% of new visitors
  - Track: signup rate, time on page, bounce rate
  - Tool: Simple random assignment via cookie
  - Duration: 7 days minimum
  - Decision: If V2 performs ≥same, ship to 100%

- **Chat:** Show V2 to existing users (opt-in beta)
  - Track: messages per session, session duration, return rate
  - Duration: 3-5 days
  - Decision: If metrics improve or stay same, ship to 100%

### Rollback Plan

1. **Immediate (<1 minute):** Set feature flag to `false` in environment variables
2. **Deploy:** Redeploy with flags disabled
3. **Verify:** Check that V1 pages load correctly
4. **Post-mortem:** Document what broke and fix before re-enabling

**Rollback triggers:**
- Any console error on production
- Any page fails to load
- Any API call fails
- Lighthouse score drops below 70
- User reports data loss or broken functionality

### Production Deployment Checklist

- [ ] All 353 backend tests passing
- [ ] `npm run build` succeeds
- [ ] All feature flags set to `false` initially
- [ ] Environment variables configured
- [ ] Database migrations up to date (no new migrations needed)
- [ ] Static assets optimized (images compressed, fonts loaded)
- [ ] Error monitoring active (Sentry or equivalent)
- [ ] Analytics tracking active

---

## 9. Success Metrics

### Before/After Comparison

| Metric | V1 (Current) | V2 Target | How to Measure |
|--------|--------------|-----------|----------------|
| Design rating | 3.5/10 | 8+/10 | Manual review panel (3 people) |
| First impression | "generic template" | "premium AI tool" | 5-second test with 5 users |
| Landing page bounce rate | ~60% | <40% | Analytics |
| Signup conversion | ~2% | >5% | Analytics |
| Time to first chat | ~8s | <3s | Manual measurement |
| Chat session duration | ~3 min | >5 min | Analytics |
| Return rate (7-day) | ~20% | >40% | Analytics |
| Mobile usability | Broken | Passes Core Web Vitals | Lighthouse |
| Lighthouse Performance | ~70 | 90+ | Lighthouse |
| Lighthouse Accessibility | ~60 | 90+ | Lighthouse |
| Page load time (3G) | ~5s | <3s | Lighthouse |

### User Testing Plan

**Pre-launch (Day 24-25):**
- Recruit 3-5 people (friends, Twitter followers, indie hacker community)
- Task-based testing:
  1. "Visit the landing page. What does this product do?"
  2. "Sign up and upload a document."
  3. "Ask a question about the document."
  4. "Find the settings page."
- Record: time to complete, confusion points, verbal feedback
- Tool: Screen recording + notes (no fancy tools needed)

**Post-launch (Week 1):**
- Monitor analytics for unusual patterns
- Read any support emails or messages
- Check Twitter/Reddit for mentions
- Track feature flag metrics

### Feedback Collection

- **In-app:** Toast after 3rd chat message: "How's your experience? [Quick feedback]"
- **Landing page:** Exit-intent popup: "What almost stopped you from signing up?"
- **Post-signup:** Email 24h after signup: "How was your first experience?"
- **Ongoing:** Support email + GitHub Issues for bug reports

### Iteration Cycle

1. **Collect** feedback for 1 week
2. **Triage** into: bug fix, quick win, feature request
3. **Fix** all bugs immediately
4. **Ship** quick wins in next deployment
5. **Plan** feature requests for next sprint
6. **Repeat** weekly for first month

---

## 10. Post-Launch

### Week 1: Monitor + Fix (Days 26–32)

**Priority: Stability**
- [ ] Monitor error rates (target: <0.1%)
- [ ] Monitor performance metrics (Core Web Vitals)
- [ ] Fix any critical bugs immediately
- [ ] Fix any visual regressions
- [ ] Verify feature flags are all enabled
- [ ] Remove V1 page versions (if V2 confirmed stable)
- [ ] Update analytics dashboards

### Week 2: Collect Feedback (Days 33–39)

**Priority: Understanding**
- [ ] Analyze user behavior (where do they drop off?)
- [ ] Collect feedback from in-app prompts
- [ ] Read support emails/messages
- [ ] Check analytics: conversion funnel, session duration, return rate
- [ ] Identify top 3 pain points from real users
- [ ] Identify top 3 "wow" moments

### Week 3: Iterate (Days 40–46)

**Priority: Improvement**
- [ ] Fix top 3 pain points
- [ ] Enhance top 3 "wow" moments
- [ ] Ship iteration updates
- [ ] A/B test any major changes
- [ ] Update documentation
- [ ] Write changelog/blog post

### Month 2: Advanced Features

**Priority: Growth**
- [ ] **Light Mode:** Implement complete light mode using V2 design tokens (design system already defines both modes)
- [ ] **Advanced search:** Full-text search across all documents with filters
- [ ] **Collaboration:** Share workspaces with team members
- [ ] **Integrations:** Slack, Notion, Google Drive connectors
- [ ] **API access:** Public API for developers
- [ ] **Custom branding:** White-label options for teams
- [ ] **Advanced analytics:** Cost tracking, usage trends, team insights
- [ ] **Export:** Export chat history, knowledge base as PDF/Markdown

---

## Appendix A: Daily Standup Template

Copy this for each workday:

```markdown
## Day [X] Standup — [Date]

### Yesterday
- [What was completed]

### Today
- [What will be worked on]

### Blockers
- [Any issues or dependencies]

### Phase Progress
- Phase: [Current phase name]
- Completion: [X%]
- On track: [Yes/No]
- Hours worked: [X]
```

## Appendix B: Quick Reference

### Key File Paths

| Purpose | Path |
|---------|------|
| Design tokens (CSS) | `app/globals.css` |
| Root layout | `app/layout.tsx` |
| Landing page | `app/page.tsx` |
| Chat page | `app/chat/page.tsx` |
| Dashboard | `app/dashboard/page.tsx` |
| Documents | `app/(admin)/documents/page.tsx` |
| Settings | `app/(admin)/settings/page.tsx` |
| Sidebar | `components/layout/app-sidebar.tsx` |
| V2 components | `components/ui/*-v2.tsx` |
| Chat components | `components/chat/*.tsx` |
| Dashboard components | `components/dashboard/*.tsx` |
| Document components | `components/documents/*.tsx` |

### Design Tokens Quick Reference

```
Primary Brand: oklch(0.58 0.17 265) — #8b5cc6
Surface Base (dark): oklch(0.11 0.004 265)
Surface Raised (dark): oklch(0.14 0.004 265)
Success: oklch(0.62 0.17 155)
Warning: oklch(0.70 0.16 80)
Error: oklch(0.55 0.20 25)
Info: oklch(0.55 0.15 240)

Font: Geist Sans (body), Geist Mono (code)
Grid: 4px base unit
Radius: 8px default (rounded-lg)
Motion: 200ms default duration
```

### Useful Commands

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Production build
npm run lint             # ESLint check
npm run test             # Run Vitest tests

# shadcn
npx shadcn@latest add [component]   # Add shadcn component

# Bundle analysis
npx @next/bundle-analyzer

# Lighthouse
npx lighthouse http://localhost:3000 --view
```

---

## Appendix C: Document Index

All V2 design documents referenced by this plan:

| # | Document | Purpose | Phase |
|---|----------|---------|-------|
| 1 | `MIMONOTES_V2_DESIGN_SYSTEM.md` | Colors, typography, spacing, motion | 0 |
| 2 | `COMPONENT_LIBRARY_V2.md` | 20 components with TypeScript interfaces | 1 |
| 3 | `NAVIGATION_REARCHITECTURE.md` | Sidebar 14+ → 6, Command Palette, breadcrumbs | 2 |
| 4 | `CHAT_EXPERIENCE_V2.md` | Complete chat redesign | 4 |
| 5 | `DASHBOARD_V2_SPEC.md` | Dashboard redesign | 5 |
| 6 | `LANDING_PAGE_V2_SPEC.md` | Landing page redesign | 3 |
| 7 | `MOBILE_EXPERIENCE_V2.md` | Mobile-first experience | 7 |
| 8 | `IMPLEMENTATION_MASTERPLAN.md` | This document — master execution plan | All |

---

**Total estimated effort:** 25 working days, ~200 hours
**Total estimated new code:** ~4,100 lines (new files) + ~2,000 lines (modifications)
**Total files affected:** ~33 new, ~13 modified, ~7 deprecated

---

*This is the definitive guide. Start with Phase 0. Execute day by day. Ship in 5 weeks.*
