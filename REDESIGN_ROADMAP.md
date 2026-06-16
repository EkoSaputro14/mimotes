# MimoNotes Redesign Roadmap

> **Owner:** Eko Saputro (Solo Founder)
> **Goal:** Ship a premium, polished UI for public beta launch
> **Timeline:** 2-4 weeks (phased approach)
> **Budget:** $0 — all work is solo, open-source tools only
> **Current State:** Backend production-ready (353 tests). Frontend functional but looks like a shadcn/ui template — hardcoded light-theme classes, emoji-heavy, no design system consistency.

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Design Direction Summary](#design-direction-summary)
3. [Phase 1: Quick Wins (Week 1 — 2-3 days)](#phase-1-quick-wins-week-1--2-3-days)
4. [Phase 2: Foundation (Week 2 — 5-7 days)](#phase-2-foundation-week-2--5-7-days)
5. [Phase 3: Differentiation (Week 3-4 — 5-7 days)](#phase-3-differentiation-week-3-4--5-7-days)
6. [Phase 4: Polish (Ongoing)](#phase-4-polish-ongoing)
7. [Resource Allocation](#resource-allocation)
8. [Risk Mitigation](#risk-mitigation)
9. [Quality Gates](#quality-gates)
10. [Success Metrics](#success-metrics)
11. [Post-Launch Improvements](#post-launch-improvements)

---

## Current State Assessment

### What Works Well
- ✅ Backend: production-ready, 353 tests, security hardened
- ✅ Auth: NextAuth v5 with credentials provider
- ✅ RAG pipeline: document upload → chunk → embed → search → stream
- ✅ Multi-provider AI support (OpenAI, LM Studio, Ollama, etc.)
- ✅ Dark theme defined in oklch (but not consistently applied)
- ✅ Geist Sans + Geist Mono fonts loaded
- ✅ shadcn/ui primitives available (17 components)
- ✅ Skeleton component exists (`components/ui/skeleton.tsx`)
- ✅ Workspace switching implemented
- ✅ Dashboard with stat cards, activity feed, system health

### What Needs Fixing

| Issue | Files Affected | Severity |
|-------|---------------|----------|
| Landing page uses hardcoded `bg-white`, `text-gray-*` — breaks in dark mode | `app/page.tsx` | 🔴 Critical |
| Emoji-only visual language (🤖, 📚, 🔍, ⚡) | `app/page.tsx` | 🔴 Critical |
| Hero title "Mimotes AI Chatbot" — generic, not branded | `app/page.tsx` | 🔴 Critical |
| Login form uses `bg-white`, `text-gray-*` — no dark theme | `components/auth/login-form.tsx` | 🔴 Critical |
| Login page bg gradient is light (`from-blue-50 via-white to-indigo-50`) | `app/(auth)/login/page.tsx` | 🔴 Critical |
| No product screenshot or hero image on landing page | `app/page.tsx` | 🟡 High |
| No empty states with illustrations | All list pages | 🟡 High |
| Spinners instead of skeleton loaders in many places | Various | 🟡 High |
| Primary hue is 270° (cold purple), should be 265° (warmer) | `app/globals.css` | 🟡 High |
| No CSS custom property tokens for spacing, typography scale | `app/globals.css` | 🟡 High |
| Sidebar has too many nav items (17+ items across 4 sections) | `components/layout/app-sidebar.tsx` | 🟡 High |
| No breadcrumbs on any page | All admin pages | 🟢 Medium |
| Chat has no streaming indicator (just a spinner) | `components/chat/chat-window.tsx` | 🟢 Medium |
| No Cmd+K command palette | — | 🟢 Medium |
| No suggested prompts in chat empty state | `components/chat/chat-window.tsx` | 🟢 Medium |
| No keyboard shortcuts | — | 🟢 Medium |
| No onboarding flow | — | 🟢 Medium |
| No custom 404/500 pages | — | 🟢 Low |

---

## Design Direction Summary

> Full spec: `DESIGN_SYSTEM_PROPOSAL.md` (1076 lines) and `DESIGN_DIRECTION.md` (148 lines)

### Brand Personality
**Precise. Warm. Intelligent. Calm. Premium.**

### Visual DNA
| Influence | What We Take | What We Skip |
|-----------|-------------|--------------|
| **Linear** | Ultra-minimal surfaces, precise purple accent, keyboard-first density | Extreme opacity/blur effects |
| **Claude** | Warm undertones, editorial clarity, trustworthy feel | Terracotta — we keep purple |
| **Notion** | Content-first layout, soft surfaces, calm hierarchy | Heaviness/chrome |
| **Vercel** | Black-white precision, Geist font, monochrome restraint | Starkness — we add warmth |

### Color: Warm Purple (Hue 265°)
- Shift from current 270° → 265° for warmth
- Add warm neutrals: chroma 0.003–0.005 at hue 265
- Full 7-step brand scale (50–900)

### Typography: Geist Sans + Geist Mono
Already loaded via `app/fonts/` — use throughout.

### Spacing: 4px Grid
All spacing multiples of 4px: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

---

## Phase 1: Quick Wins (Week 1 — 2-3 days)

> **Goal:** Eliminate the "template" look. Fix the most visible issues.
> **Total estimated time:** 16-24 hours
> **Can be done in parallel:** Yes, most tasks are independent.

### Task 1.1: Fix Landing Page — Remove Emoji, Add Product Screenshot
**Estimated time:** 4-5 hours
**Priority:** P0 — First impression

**What to do:**
- Replace all emoji (🤖, 📚, 🔍, ⚡, 💬, 📄) with Lucide icons in styled containers
- Add a product screenshot/mockup in the hero section (use `next/image` with a browser-chrome frame)
- Replace hardcoded `text-gray-*` / `bg-white` with theme tokens (`text-foreground`, `bg-background`, `bg-card`)
- Rename hero from "Mimotes AI Chatbot" to "Chat with your knowledge" or "AI that knows your documents"

**Files to modify:**
- `app/page.tsx` — Complete rewrite of landing page

**Dependencies:**
- Need a product screenshot (can use a dark-mode screenshot of the chat UI, or create a simple mockup in Figma free tier)

**Success criteria:**
- No emoji visible on landing page
- Hero shows a real product screenshot
- All colors use theme tokens (no hardcoded gray/white)
- Page looks good in both dark and light mode

**Risk assessment:**
- 🟡 Medium: Creating a good product screenshot takes time. Mitigation: Use a dark-mode screenshot of the actual chat UI with a subtle browser frame, or use a placeholder with a gradient overlay.

---

### Task 1.2: Fix Login Page Branding
**Estimated time:** 2-3 hours
**Priority:** P0 — Every user sees this

**What to do:**
- Replace `bg-white rounded-2xl shadow-xl` with theme card tokens
- Replace `text-gray-*` with `text-foreground` / `text-muted-foreground`
- Add Mimotes logo/brand mark at top of form
- Replace light gradient background with dark-compatible gradient
- Add "Sign in to your workspace" as subtitle (not "Login Admin")

**Files to modify:**
- `components/auth/login-form.tsx` — Replace hardcoded classes
- `app/(auth)/login/page.tsx` — Fix background gradient

**Dependencies:**
- None (standalone change)

**Success criteria:**
- Login page uses dark theme consistently
- No hardcoded light-mode colors
- Brand mark visible at top of form
- Feels premium, not like a template

**Risk assessment:**
- 🟢 Low: Straightforward class replacement.

---

### Task 1.3: Add Empty States with Illustrations
**Estimated time:** 4-5 hours
**Priority:** P1 — Professional polish

**What to do:**
- Create a reusable `EmptyState` component with Lucide icon + title + description + optional CTA
- Add empty states to:
  - Document list (no documents yet)
  - Chat sessions (no sessions yet)
  - Knowledge chunks (no chunks yet)
  - Search results (no results found)
  - Analytics (no data yet)
- Use SVG illustrations (simple line art) or styled Lucide icons, NOT emoji

**Files to create:**
- `components/ui/empty-state.tsx` — Reusable empty state component

**Files to modify:**
- `components/documents/document-list.tsx`
- `components/chat/session-sidebar.tsx`
- `components/knowledge/chunk-viewer.tsx`
- `components/knowledge/similarity-search.tsx`
- Various analytics pages

**Dependencies:**
- None (new component + integration)

**Success criteria:**
- Every list/table page has a meaningful empty state
- No emoji in any empty state
- Each empty state has a clear CTA
- Consistent visual language across all empty states

**Risk assessment:**
- 🟢 Low: Additive change, no breaking risk.

---

### Task 1.4: Add Skeleton Loaders Instead of Spinners
**Estimated time:** 3-4 hours
**Priority:** P1 — Perceived performance

**What to do:**
- Replace any `Loader2` spinning icons with skeleton placeholders
- Add skeleton states to:
  - Dashboard stat cards (already done ✅ — verify)
  - Document list loading
  - Chat message loading
  - Knowledge base pages
- Ensure skeletons match the actual content layout (shape, size, position)

**Files to modify:**
- `components/chat/chat-window.tsx` — Add skeleton for initial load
- `components/documents/document-list.tsx` — Add skeleton rows
- `components/knowledge/document-explorer.tsx` — Add skeleton grid
- `app/dashboard/page.tsx` — Verify existing skeleton usage

**Dependencies:**
- `components/ui/skeleton.tsx` already exists ✅

**Success criteria:**
- No visible spinning loaders during data fetch
- Skeletons match the shape of loaded content
- Transitions from skeleton to content are smooth

**Risk assessment:**
- 🟢 Low: Skeleton component already exists, just need to use it.

---

### Task 1.5: Fix Mobile Sidebar Behavior
**Estimated time:** 2-3 hours
**Priority:** P1 — Mobile users will bounce

**What to do:**
- Ensure mobile sidebar Sheet closes on navigation (verify `onNavigate` callback works)
- Add backdrop blur/overlay on mobile sidebar
- Ensure sidebar doesn't scroll the background page
- Test on mobile viewport (375px width)

**Files to modify:**
- `components/layout/mobile-nav.tsx`
- `components/layout/app-sidebar.tsx` — Verify `onNavigate` prop usage
- `components/layout/dashboard-shell-client.tsx`

**Dependencies:**
- None

**Success criteria:**
- Sidebar closes when a nav link is tapped on mobile
- No background scroll when sidebar is open
- Smooth open/close animation

**Risk assessment:**
- 🟢 Low: The `onNavigate` callback already exists, just needs verification.

---

### Task 1.6: Add Cmd+K Search Placeholder
**Estimated time:** 2-3 hours
**Priority:** P2 — Nice for beta, not blocking

**What to do:**
- Create a `CommandPalette` component using a dialog/modal
- Wire up Cmd+K (Mac) / Ctrl+K (Windows) keyboard shortcut
- Show placeholder search UI (can be non-functional for beta)
- Display recent pages, quick actions

**Files to create:**
- `components/ui/command-palette.tsx`

**Files to modify:**
- `components/layout/dashboard-shell-client.tsx` — Add keyboard listener
- `app/globals.css` — Add command palette styles if needed

**Dependencies:**
- None (can be a simple dialog for now)

**Success criteria:**
- Cmd+K opens a search dialog
- Shows placeholder content
- Closes on Escape or clicking outside

**Risk assessment:**
- 🟢 Low: Can be a simple dialog implementation.

---

### Phase 1 Summary

| Task | Hours | Priority | Risk |
|------|-------|----------|------|
| Fix landing page | 4-5h | P0 | 🟡 |
| Fix login page | 2-3h | P0 | 🟢 |
| Empty states | 4-5h | P1 | 🟢 |
| Skeleton loaders | 3-4h | P1 | 🟢 |
| Mobile sidebar | 2-3h | P1 | 🟢 |
| Cmd+K placeholder | 2-3h | P2 | 🟢 |
| **Total** | **17-23h** | | |

### Phase 1 Quality Gate
- [ ] No hardcoded `text-gray-*` or `bg-white` in any page
- [ ] No emoji used as icons anywhere
- [ ] Landing page shows a real product screenshot
- [ ] Login page uses dark theme consistently
- [ ] All empty states have illustrations + CTAs
- [ ] No spinning loaders (all replaced with skeletons)
- [ ] Mobile sidebar works correctly
- [ ] `npm run build` passes with no errors
- [ ] Manual test on mobile viewport (375px)

---

## Phase 2: Foundation (Week 2 — 5-7 days)

> **Goal:** Establish the design system foundation. Every component uses consistent tokens.
> **Total estimated time:** 30-40 hours
> **Dependencies:** Phase 1 complete

### Task 2.1: Implement Design System Tokens
**Estimated time:** 6-8 hours
**Priority:** P0 — Everything else depends on this

**What to do:**
- Update `app/globals.css` with the full design token system from `DESIGN_SYSTEM_PROPOSAL.md`:
  - Shift primary hue from 270° → 265°
  - Add warm neutral scale (chroma 0.003–0.005 at hue 265)
  - Add full brand scale (50–900)
  - Update semantic colors (success, warning, error, info)
  - Add spacing tokens (--space-1 through --space-16)
  - Add typography scale tokens
  - Add shadow tokens
- Create a `design-tokens.ts` file documenting all tokens for reference
- Verify all tokens have proper contrast ratios (WCAG AA)

**Files to modify:**
- `app/globals.css` — Replace `:root` and `.dark` token blocks

**Files to create:**
- `lib/design-tokens.ts` — Token reference file (optional, for documentation)

**Dependencies:**
- Reference: `DESIGN_SYSTEM_PROPOSAL.md` Section 2 (Color System)

**Success criteria:**
- All CSS custom properties updated
- Hue shifted to 265°
- Warm neutrals applied
- All tokens have WCAG AA contrast on dark backgrounds
- No visual regression (existing components should look better, not broken)

**Risk assessment:**
- 🟡 Medium: Changing global tokens affects everything. Mitigation: Update tokens in a single commit, then visually verify each page. Keep old tokens as comments for rollback.

---

### Task 2.2: Standardize Component Variants
**Estimated time:** 6-8 hours
**Priority:** P0 — Consistency across the app

**What to do:**
- Audit all shadcn/ui components and add/fix variants:
  - **Button:** Add `ghost`, `outline`, `link` variants; ensure consistent sizing (sm, md, lg)
  - **Input:** Add `error`, `success` states; consistent border/focus styles
  - **Card:** Add `interactive` variant (hover state for clickable cards)
  - **Badge:** Add color variants (success, warning, error, info)
  - **Dialog:** Consistent padding, title styling
- Create a `components/ui/index.ts` barrel export
- Document component usage in `COMPONENT_GUIDE.md`

**Files to modify:**
- `components/ui/button.tsx` — Add variants
- `components/ui/input.tsx` — Add states
- `components/ui/card.tsx` — Add interactive variant
- `components/ui/badge.tsx` — Add color variants (if exists, otherwise create)
- `components/ui/dialog.tsx` — Consistent styling

**Files to create:**
- `components/ui/badge.tsx` — If not already customized
- `components/ui/index.ts` — Barrel export

**Dependencies:**
- Phase 2.1 (design tokens) must be complete first

**Success criteria:**
- All buttons across the app look consistent
- Inputs have clear focus/error/success states
- Cards have consistent padding, border-radius, shadows
- Badges use semantic colors
- No component uses hardcoded colors

**Risk assessment:**
- 🟡 Medium: Changing component APIs can break existing usage. Mitigation: Add new variants without removing old ones. Use `className` override for edge cases.

---

### Task 2.3: Reduce Sidebar Navigation
**Estimated time:** 3-4 hours
**Priority:** P1 — Cognitive load reduction

**What to do:**
- Merge Knowledge Base items:
  - Keep: Documents, Upload
  - Move Chunks, Search, Sources under Documents as sub-items or tabs
- Merge Analytics items into a single "Analytics" page with tabs
- Reduce total sidebar items from 17+ to ~10
- Add section dividers with clear labels
- Consider adding icons to all items (currently some sections use icons, some don't)

**Files to modify:**
- `components/layout/app-sidebar.tsx` — Restructure `navSections`
- `app/knowledge/documents/page.tsx` — Add tabs for Chunks/Search/Sources
- `app/analytics/*/page.tsx` — Merge into single page with tabs

**Dependencies:**
- None (can be done independently)

**Success criteria:**
- Sidebar has max 10-12 items
- Knowledge Base consolidated under Documents
- Analytics consolidated into one page with tabs
- Navigation feels simpler and more focused

**Risk assessment:**
- 🟢 Low: Reorganization, no feature loss.

---

### Task 2.4: Add Breadcrumbs
**Estimated time:** 3-4 hours
**Priority:** P1 — Orientation and navigation

**What to do:**
- Create a `Breadcrumb` component using shadcn/ui
- Add breadcrumbs to all admin pages:
  - `/knowledge/documents` → Home > Knowledge Base > Documents
  - `/knowledge/documents/[id]` → Home > Knowledge Base > Documents > [Title]
  - `/analytics/chat` → Home > Analytics > Chat
  - `/settings/workspace` → Home > Settings > Workspace
  - etc.
- Breadcrumbs should be clickable (link to parent pages)

**Files to create:**
- `components/ui/breadcrumb.tsx`

**Files to modify:**
- `components/layout/dashboard-shell.tsx` — Accept and render breadcrumbs prop
- `components/layout/dashboard-shell-client.tsx` — Render breadcrumbs in top area
- All admin pages — Pass breadcrumb data

**Dependencies:**
- Phase 2.1 (design tokens) for consistent styling

**Success criteria:**
- Every admin page shows breadcrumbs
- Breadcrumbs are clickable and accurate
- Breadcrumbs use theme tokens
- Breadcrumbs hide on mobile (or collapse to last 2 items)

**Risk assessment:**
- 🟢 Low: Additive, no breaking changes.

---

### Task 2.5: Improve Dashboard Layout
**Estimated time:** 4-5 hours
**Priority:** P1 — First thing users see after login

**What to do:**
- Redesign stat cards with better visual hierarchy
- Add welcome message ("Welcome back, Eko")
- Improve quick actions grid (better spacing, clearer labels)
- Add "Recent Activity" timeline instead of flat list
- Add keyboard shortcut hints (⌘N for new chat, ⌘U for upload)
- Ensure consistent card styling with design tokens

**Files to modify:**
- `app/dashboard/page.tsx` — Restructure layout
- `components/dashboard/stat-card.tsx` — Improve styling
- `components/dashboard/activity-feed.tsx` — Timeline redesign
- `components/dashboard/quick-actions.tsx` — If exists, restyle

**Dependencies:**
- Phase 2.1 (design tokens)
- Phase 2.2 (component variants)

**Success criteria:**
- Dashboard feels organized and scannable
- Welcome message personalized
- Quick actions are clearly labeled
- Activity feed shows timeline format
- All cards use design tokens

**Risk assessment:**
- 🟢 Low: Layout changes, no logic changes.

---

### Task 2.6: Add Streaming Indicator to Chat
**Estimated time:** 3-4 hours
**Priority:** P1 — Core UX improvement

**What to do:**
- Replace the loading spinner with a streaming indicator:
  - Show a pulsing dot or animated cursor while streaming
  - Add "Thinking..." text with animated dots
  - Show source cards as they arrive (not all at once)
- Add a subtle animation when new content appears
- Show typing indicator in the input area when AI is responding

**Files to modify:**
- `components/chat/chat-window.tsx` — Add streaming state UI
- `components/chat/message-bubble.tsx` — Add streaming cursor animation

**Files to create:**
- `components/chat/streaming-indicator.tsx` — Reusable streaming dots/cursor

**Dependencies:**
- None (can use existing streaming API)

**Success criteria:**
- No spinning loader during chat response
- Animated dots or cursor while streaming
- Source cards appear progressively
- Smooth transition from streaming to complete

**Risk assessment:**
- 🟢 Low: Visual enhancement only.

---

### Task 2.7: Add Suggested Prompts to Chat Empty State
**Estimated time:** 2-3 hours
**Priority:** P1 — First-time user experience

**What to do:**
- When chat is empty, show:
  - Welcome message ("Ask me anything about your documents")
  - 4-6 suggested prompt cards:
    - "Summarize my uploaded documents"
    - "What are the key points in [document]?"
    - "Compare information across my documents"
    - "Create an action item list from my notes"
  - Each card clickable — fills the input and sends
- Style cards with design tokens (interactive, hover state)

**Files to modify:**
- `components/chat/chat-window.tsx` — Add empty state with suggested prompts

**Dependencies:**
- Phase 2.2 (Card interactive variant)

**Success criteria:**
- Chat empty state shows suggested prompts
- Clicking a prompt fills input and sends
- Cards use design tokens
- Responsive on mobile

**Risk assessment:**
- 🟢 Low: Additive UI change.

---

### Phase 2 Summary

| Task | Hours | Priority | Risk |
|------|-------|----------|------|
| Design tokens | 6-8h | P0 | 🟡 |
| Component variants | 6-8h | P0 | 🟡 |
| Reduce sidebar | 3-4h | P1 | 🟢 |
| Breadcrumbs | 3-4h | P1 | 🟢 |
| Dashboard layout | 4-5h | P1 | 🟢 |
| Streaming indicator | 3-4h | P1 | 🟢 |
| Suggested prompts | 2-3h | P1 | 🟢 |
| **Total** | **27-36h** | | |

### Phase 2 Quality Gate
- [ ] All CSS custom properties use new tokens (hue 265°)
- [ ] No component uses hardcoded colors
- [ ] Sidebar has ≤12 items
- [ ] All admin pages have breadcrumbs
- [ ] Dashboard feels organized and personalized
- [ ] Chat shows streaming indicator (no spinner)
- [ ] Chat empty state shows suggested prompts
- [ ] `npm run build` passes
- [ ] Visual regression test: compare before/after screenshots

---

## Phase 3: Differentiation (Week 3-4 — 5-7 days)

> **Goal:** Make MimoNotes feel like a premium product, not a template.
> **Total estimated time:** 30-40 hours
> **Dependencies:** Phase 2 complete

### Task 3.1: Redesign Landing Page (Product-Led)
**Estimated time:** 8-10 hours
**Priority:** P0 — Conversion depends on this

**What to do:**
- Complete rewrite with product-led approach:
  - **Hero:** Full-width with animated gradient background, product screenshot, bold headline
  - **Value prop section:** 3 clear benefits with icons (not feature list)
  - **How it works:** 3-step visual flow (Upload → Chat → Get Answers)
  - **Social proof:** Beta user count, or "Trusted by X teams"
  - **CTA section:** Final push with clear sign-up flow
  - **Footer:** 4-column layout (Product, Resources, Company, Legal)
- Add subtle animations:
  - Fade-in on scroll (use Intersection Observer)
  - Subtle gradient animation on hero
  - Hover effects on cards
- Add SEO metadata (title, description, Open Graph)
- Ensure dark/light mode support

**Files to modify:**
- `app/page.tsx` — Complete rewrite
- `app/layout.tsx` — Update metadata

**Dependencies:**
- Phase 1.1 (initial landing page fix) — this is the full version
- Phase 2.1 (design tokens)

**Success criteria:**
- Landing page looks like a premium SaaS product
- Hero shows real product screenshot
- Clear value proposition (not generic "AI chatbot")
- Scroll animations work
- SEO metadata complete
- Converts visitors to sign-ups

**Risk assessment:**
- 🟡 Medium: Complex page with animations. Mitigation: Start with static version, add animations incrementally. Test on multiple devices.

---

### Task 3.2: Add Keyboard Shortcuts
**Estimated time:** 4-5 hours
**Priority:** P2 — Power user delight

**What to do:**
- Implement global keyboard shortcuts:
  - `⌘/Ctrl + K` — Command palette (search, navigate)
  - `⌘/Ctrl + N` — New chat
  - `⌘/Ctrl + U` — Upload document
  - `⌘/Ctrl + ,` — Settings
  - `⌘/Ctrl + B` — Toggle sidebar
  - `Escape` — Close modals/dialogs
- Show keyboard shortcut hints in UI (subtle `⌘K` badges)
- Create a keyboard shortcuts help dialog (`?` key)

**Files to create:**
- `components/ui/keyboard-shortcuts.tsx` — Shortcut handler + help dialog
- `lib/hooks/use-keyboard-shortcut.ts` — Custom hook

**Files to modify:**
- `components/layout/dashboard-shell-client.tsx` — Register shortcuts
- Various pages — Add shortcut hints

**Dependencies:**
- Phase 1.6 (Cmd+K placeholder) — expand to full implementation

**Success criteria:**
- All shortcuts work without conflicts
- Shortcuts are discoverable (hints in UI)
- Help dialog shows all shortcuts
- Shortcuts work on both Mac and Windows

**Risk assessment:**
- 🟢 Low: Additive feature, no breaking changes.

---

### Task 3.3: Improve Chat UX
**Estimated time:** 6-8 hours
**Priority:** P0 — Core product experience

**What to do:**
- **Inline source cards:** Show source snippets inline with the message (not just at the bottom)
- **Regenerate button:** Allow regenerating the last AI response
- **Feedback buttons:** Thumbs up/down on AI responses (store in analytics)
- **Message actions:** Copy, share, bookmark
- **Improved markdown rendering:** Better code blocks, tables, lists
- **Source panel:** Collapsible right panel showing all sources for a conversation
- **Model selector:** Show which AI model is being used

**Files to modify:**
- `components/chat/chat-window.tsx` — Add regenerate, feedback
- `components/chat/message-bubble.tsx` — Add inline sources, actions
- `components/chat/source-card.tsx` — Improve styling, add copy button
- `components/chat/session-sidebar.tsx` — Add session actions

**Files to create:**
- `components/chat/message-actions.tsx` — Copy, share, bookmark
- `components/chat/feedback-buttons.tsx` — Thumbs up/down
- `components/chat/source-panel.tsx` — Collapsible right panel

**Dependencies:**
- Phase 2.6 (streaming indicator)
- Phase 2.7 (suggested prompts)

**Success criteria:**
- Sources shown inline with messages
- Regenerate button works
- Feedback buttons store responses
- Message actions (copy, share) work
- Source panel is collapsible
- Chat feels like a premium AI product

**Risk assessment:**
- 🟡 Medium: Complex UI interactions. Mitigation: Implement incrementally, test each feature.

---

### Task 3.4: Add Onboarding Flow
**Estimated time:** 4-5 hours
**Priority:** P1 — First-time user retention

**What to do:**
- Create a tooltip-based tour for first-time users:
  - Step 1: "Welcome to MimoNotes!" — Overview
  - Step 2: "Upload your first document" — Point to upload button
  - Step 3: "Start a chat" — Point to chat
  - Step 4: "Check your analytics" — Point to analytics
- Store tour completion in localStorage
- Allow skipping the tour
- Add a "Restart tour" option in settings

**Files to create:**
- `components/onboarding/tour-provider.tsx` — Tour state management
- `components/onboarding/tour-step.tsx` — Individual tooltip step
- `components/onboarding/tour-overlay.tsx` — Background overlay

**Files to modify:**
- `components/layout/dashboard-shell-client.tsx` — Wrap with tour provider
- `app/(auth)/login/page.tsx` — Set "first visit" flag after login

**Dependencies:**
- Phase 2.3 (reduced sidebar — simpler tour steps)

**Success criteria:**
- Tour shows on first login
- Each step highlights a key feature
- Tour can be skipped
- Tour completion stored in localStorage
- "Restart tour" available in settings

**Risk assessment:**
- 🟢 Low: Additive feature, no breaking changes.

---

### Task 3.5: Improve Document Management
**Estimated time:** 4-5 hours
**Priority:** P1 — Core functionality

**What to do:**
- Add search/filter to document list
- Add grid/list view toggle
- Add document status badges (Processing, Ready, Failed)
- Add bulk actions (delete, reprocess)
- Improve upload drag-and-drop area
- Add document preview on hover

**Files to modify:**
- `components/documents/document-list.tsx` — Add search, filter, view toggle
- `components/documents/upload-form.tsx` — Improve drag-and-drop area
- `app/knowledge/documents/page.tsx` — Add toolbar

**Dependencies:**
- Phase 2.2 (Badge color variants)

**Success criteria:**
- Document list has search and filter
- Grid and list views available
- Status badges show correctly
- Bulk actions work
- Upload area is visually appealing

**Risk assessment:**
- 🟢 Low: Feature enhancement.

---

### Task 3.6: Add Custom 404/500 Pages
**Estimated time:** 2-3 hours
**Priority:** P2 — Professional touch

**What to do:**
- Create branded 404 page with illustration + "Go Home" CTA
- Create branded 500 page with illustration + "Try Again" CTA
- Match dark theme and design tokens

**Files to create:**
- `app/not-found.tsx` — Custom 404
- `app/error.tsx` — Custom 500

**Dependencies:**
- Phase 2.1 (design tokens)

**Success criteria:**
- 404 page shows branded illustration
- 500 page shows branded illustration
- Both use design tokens
- Both have clear CTAs

**Risk assessment:**
- 🟢 Low: Simple pages.

---

### Phase 3 Summary

| Task | Hours | Priority | Risk |
|------|-------|----------|------|
| Landing page redesign | 8-10h | P0 | 🟡 |
| Keyboard shortcuts | 4-5h | P2 | 🟢 |
| Chat UX improvements | 6-8h | P0 | 🟡 |
| Onboarding flow | 4-5h | P1 | 🟢 |
| Document management | 4-5h | P1 | 🟢 |
| Custom 404/500 | 2-3h | P2 | 🟢 |
| **Total** | **28-36h** | | |

### Phase 3 Quality Gate
- [ ] Landing page converts (clear CTA, product screenshot, value prop)
- [ ] Keyboard shortcuts work without conflicts
- [ ] Chat has inline sources, regenerate, feedback
- [ ] Onboarding tour works on first login
- [ ] Document list has search, filter, view toggle
- [ ] 404/500 pages are branded
- [ ] `npm run build` passes
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile (375px) and tablet (768px)

---

## Phase 4: Polish (Ongoing)

> **Goal:** Fine-tune the experience. These can be done after beta launch.
> **Total estimated time:** 20-30 hours (spread over weeks)
> **Dependencies:** Phase 3 complete

### Task 4.1: Motion System
**Estimated time:** 6-8 hours

**What to do:**
- Define motion tokens (duration, easing):
  - `--duration-fast: 150ms`
  - `--duration-normal: 250ms`
  - `--duration-slow: 400ms`
  - `--easing-default: cubic-bezier(0.4, 0, 0.2, 1)`
  - `--easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1)`
- Add transitions to:
  - Page transitions (fade-in)
  - Modal/dialog open/close (scale + fade)
  - Sidebar expand/collapse
  - Card hover states
  - Button press states
- Use `tw-animate-css` (already installed) or CSS transitions
- Avoid heavy JS animation libraries (keep bundle small)

**Files to modify:**
- `app/globals.css` — Add motion tokens
- Various components — Add transition classes

---

### Task 4.2: Advanced Empty States
**Estimated time:** 4-5 hours

**What to do:**
- Create custom SVG illustrations for each empty state
- Add animated illustrations (subtle CSS animation)
- Contextual CTAs based on user state

---

### Task 4.3: Mobile Optimizations
**Estimated time:** 4-5 hours

**What to do:**
- Bottom navigation bar for mobile (like Linear app)
- Swipe gestures for chat sessions
- Optimized touch targets (min 44px)
- Pull-to-refresh on document list
- Mobile-optimized settings page

---

### Task 4.4: Accessibility Audit (WCAG AA)
**Estimated time:** 3-4 hours

**What to do:**
- Run axe-core audit
- Fix contrast issues
- Add ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen reader (VoiceOver/NVDA)
- Add focus indicators

---

### Task 4.5: Performance Optimization
**Estimated time:** 3-4 hours

**What to do:**
- Add `loading="lazy"` to images
- Optimize bundle size (check with `next build`)
- Add proper `Suspense` boundaries
- Prefetch critical routes
- Optimize font loading (use `next/font` subset)

---

## Resource Allocation

### Solo Founder Constraints
- **Available hours/week:** ~25-30 hours (assuming other responsibilities)
- **No budget:** All tools must be free/open-source
- **No designer:** Must use existing design system docs as reference
- **No QA tester:** Must self-test on multiple devices

### Time Allocation by Phase

```
Week 1 (Phase 1): 20h
├── Mon-Tue: Landing page + Login page (8h)
├── Wed: Empty states + Skeletons (6h)
└── Thu-Fri: Mobile sidebar + Cmd+K (6h)

Week 2 (Phase 2): 35h
├── Mon-Tue: Design tokens + Component variants (14h)
├── Wed: Sidebar reduction + Breadcrumbs (7h)
├── Thu: Dashboard layout (5h)
└── Fri-Sat: Streaming indicator + Suggested prompts (7h)

Week 3 (Phase 3A): 20h
├── Mon-Wed: Landing page redesign (10h)
├── Thu-Fri: Chat UX improvements (8h)
└── Sat: Custom 404/500 (2h)

Week 4 (Phase 3B): 15h
├── Mon-Tue: Keyboard shortcuts (5h)
├── Wed: Onboarding flow (5h)
├── Thu-Fri: Document management (5h)

Post-Launch (Phase 4): 20h (spread over weeks)
├── Motion system (8h)
├── Mobile optimizations (5h)
├── Accessibility (4h)
└── Performance (3h)
```

### Total Estimated Time
- **Phase 1:** 17-23 hours
- **Phase 2:** 27-36 hours
- **Phase 3:** 28-36 hours
- **Phase 4:** 20-30 hours
- **Grand Total:** 92-125 hours

---

## Risk Mitigation

### High Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Design token changes break existing UI | High | Medium | Update tokens in single commit, visual QA each page, keep old tokens as comments |
| Landing page redesign takes too long | Medium | Medium | Start with static version, add animations later. Ship without animations if needed. |
| Chat UX changes break streaming | High | Low | Test streaming thoroughly after each change. Keep fallback to old behavior. |
| Mobile sidebar breaks on iOS Safari | Medium | Medium | Test on real device early. Use Safari-specific CSS if needed. |
| Scope creep delays beta launch | High | High | Strict phase gates. Ship Phase 1+2 for beta, Phase 3+4 post-launch. |

### Mitigation Strategies

1. **Ship incrementally:** Each phase is deployable. Don't wait for Phase 4 to launch.
2. **Feature flags:** Wrap new features in conditional rendering if needed.
3. **Rollback plan:** Keep git branches for each phase. Can revert if needed.
4. **Visual regression:** Take screenshots before/after each phase for comparison.
5. **Time boxing:** If a task takes 2x estimated time, ship the minimum viable version.

---

## Quality Gates

### Pre-Phase Gate (Before starting each phase)
- [ ] Previous phase quality gate passed
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Manual smoke test on desktop + mobile

### Phase 1 Gate
- [ ] No hardcoded colors in any page
- [ ] No emoji as icons
- [ ] Landing page has product screenshot
- [ ] Login page uses dark theme
- [ ] Empty states exist on all list pages
- [ ] No spinning loaders
- [ ] Mobile sidebar works

### Phase 2 Gate
- [ ] All components use design tokens
- [ ] Sidebar has ≤12 items
- [ ] Breadcrumbs on all admin pages
- [ ] Dashboard feels organized
- [ ] Chat shows streaming indicator
- [ ] Chat has suggested prompts

### Phase 3 Gate
- [ ] Landing page is product-led
- [ ] Keyboard shortcuts work
- [ ] Chat has inline sources, regenerate, feedback
- [ ] Onboarding tour works
- [ ] Document list has search/filter
- [ ] 404/500 pages are branded

### Beta Launch Gate
- [ ] All Phase 1-3 gates passed
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test on mobile (375px) and tablet (768px)
- [ ] No console errors
- [ ] Performance: Lighthouse score >80
- [ ] SEO: metadata complete
- [ ] Analytics: basic tracking working

---

## Success Metrics

### Quantitative
| Metric | Current | Target (Beta) | Target (v1.0) |
|--------|---------|---------------|----------------|
| Landing page bounce rate | Unknown | <60% | <40% |
| Sign-up conversion | Unknown | >5% | >10% |
| Time to first chat | Unknown | <2 min | <1 min |
| Chat sessions/user/week | Unknown | >3 | >5 |
| Mobile usage | Unknown | >20% | >30% |
| Lighthouse performance | Unknown | >80 | >90 |
| Lighthouse accessibility | Unknown | >70 | >90 |

### Qualitative
- [ ] "This looks like a real product, not a template"
- [ ] "I can find what I need quickly"
- [ ] "The chat feels fast and responsive"
- [ ] "I understand what this product does in 5 seconds"
- [ ] "The dark theme is easy on the eyes"

### User Feedback Collection
- Add a "Feedback" button in the sidebar (Phase 3+)
- Monitor support channels for UI complaints
- Track which features users use most (analytics events)

---

## Post-Launch Improvements

### Week 5-6 (Post-Beta Launch)
- [ ] Implement motion system (Phase 4.1)
- [ ] Add mobile bottom navigation (Phase 4.3)
- [ ] Run accessibility audit (Phase 4.4)
- [ ] Performance optimization (Phase 4.5)
- [ ] Add light mode toggle (if requested)

### Week 7-8
- [ ] Advanced empty state illustrations (Phase 4.2)
- [ ] Drag-and-drop document reordering
- [ ] Multi-select for documents
- [ ] Export chat as PDF/Markdown
- [ ] Share chat sessions via link

### Month 3+
- [ ] Custom themes (user-selectable accent colors)
- [ ] Workspace customization (logos, colors)
- [ ] Advanced analytics dashboard
- [ ] API documentation portal
- [ ] Widget customization wizard

---

## Appendix A: File Change Summary

### Files to Create (New)
| File | Phase | Purpose |
|------|-------|---------|
| `components/ui/empty-state.tsx` | 1 | Reusable empty state |
| `components/ui/command-palette.tsx` | 1 | Cmd+K search |
| `components/ui/breadcrumb.tsx` | 2 | Navigation breadcrumbs |
| `components/ui/badge.tsx` | 2 | Status badges |
| `components/ui/index.ts` | 2 | Barrel export |
| `components/chat/streaming-indicator.tsx` | 2 | Streaming dots/cursor |
| `components/chat/message-actions.tsx` | 3 | Copy, share, bookmark |
| `components/chat/feedback-buttons.tsx` | 3 | Thumbs up/down |
| `components/chat/source-panel.tsx` | 3 | Collapsible source panel |
| `components/onboarding/tour-provider.tsx` | 3 | Tour state management |
| `components/onboarding/tour-step.tsx` | 3 | Tooltip step |
| `components/onboarding/tour-overlay.tsx` | 3 | Background overlay |
| `components/ui/keyboard-shortcuts.tsx` | 3 | Shortcut handler |
| `lib/hooks/use-keyboard-shortcut.ts` | 3 | Custom hook |
| `app/not-found.tsx` | 3 | Custom 404 |
| `app/error.tsx` | 3 | Custom 500 |

### Files to Modify (Existing)
| File | Phase | Changes |
|------|-------|---------|
| `app/page.tsx` | 1, 3 | Landing page rewrite |
| `app/globals.css` | 1, 2 | Design tokens, hue shift |
| `app/(auth)/login/page.tsx` | 1 | Dark theme background |
| `components/auth/login-form.tsx` | 1 | Theme tokens |
| `components/layout/app-sidebar.tsx` | 2 | Reduce nav items |
| `components/layout/dashboard-shell-client.tsx` | 2, 3 | Breadcrumbs, shortcuts |
| `components/layout/mobile-nav.tsx` | 1 | Fix mobile behavior |
| `components/chat/chat-window.tsx` | 2, 3 | Streaming, suggested prompts, inline sources |
| `components/chat/message-bubble.tsx` | 2, 3 | Streaming cursor, actions |
| `components/chat/source-card.tsx` | 3 | Improved styling |
| `components/chat/session-sidebar.tsx` | 3 | Session actions |
| `components/documents/document-list.tsx` | 1, 3 | Skeletons, search, filter |
| `components/dashboard/stat-card.tsx` | 2 | Improved styling |
| `components/dashboard/activity-feed.tsx` | 2 | Timeline format |
| `components/ui/button.tsx` | 2 | Add variants |
| `components/ui/input.tsx` | 2 | Add states |
| `components/ui/card.tsx` | 2 | Add interactive variant |
| `components/ui/dialog.tsx` | 2 | Consistent styling |
| `app/layout.tsx` | 3 | SEO metadata |

---

## Appendix B: Design Token Reference

### Color Tokens (Hue 265°)
```css
:root {
  /* Brand Scale */
  --brand-50: oklch(0.97 0.015 265);
  --brand-100: oklch(0.92 0.035 265);
  --brand-200: oklch(0.85 0.07 265);
  --brand-300: oklch(0.72 0.12 265);
  --brand-400: oklch(0.65 0.18 265);
  --brand-500: oklch(0.62 0.20 265);
  --brand-600: oklch(0.55 0.22 265);
  --brand-700: oklch(0.48 0.22 265);
  --brand-800: oklch(0.38 0.18 265);
  --brand-900: oklch(0.25 0.12 265);

  /* Warm Neutrals */
  --neutral-50: oklch(0.04 0.002 265);
  --neutral-100: oklch(0.07 0.003 265);
  --neutral-200: oklch(0.10 0.004 265);
  --neutral-300: oklch(0.14 0.005 265);
  --neutral-400: oklch(0.18 0.005 265);

  /* Semantic */
  --success: oklch(0.72 0.17 155);
  --warning: oklch(0.80 0.15 80);
  --error: oklch(0.65 0.22 25);
  --info: oklch(0.70 0.12 240);
}
```

### Spacing Tokens
```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;
  --space-24: 96px;
}
```

### Motion Tokens
```css
:root {
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --easing-default: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## Appendix C: Quick Reference Commands

```bash
# Development
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint check
npm run test         # Run tests

# Visual QA
# Take screenshots before/after each phase
# Compare on desktop (1440px), tablet (768px), mobile (375px)

# Git workflow
git checkout -b redesign/phase-1
# ... make changes ...
git commit -m "redesign: Phase 1 - Quick Wins"
git push origin redesign/phase-1
# Merge to main after quality gate passes
```

---

*Last updated: 2026-06-13*
*Next review: After Phase 1 completion*
