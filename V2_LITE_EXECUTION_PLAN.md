# V2 LITE EXECUTION PLAN — MimoNotes

> **Date:** June 13, 2026
> **Scope:** Frontend-only visual upgrade. Zero backend, route, DB, or API changes.
> **Constraint:** App deployable after every sprint. 353 tests green at all times.
> **Total Estimated Hours:** 30–42 hours

---

## Rules

1. **No route migration** — all existing URLs stay exactly as-is
2. **No route consolidation** — 34 routes remain 34 routes
3. **No redirect strategy** — nothing redirects anywhere new
4. **No major dashboard restructuring** — improve in-place, don't rearchitect
5. **No major chat restructuring** — improve UX, don't rewrite architecture
6. **No backend changes** — 353 tests untouched, APIs untouched, DB schema untouched
7. **CSS + components only** — every change is visual/interactive, not structural

---

## Sprint A: Foundation + Navigation (14–20h)

### A1. Design Token Foundation (4–6h)

**Goal:** Update `globals.css` with V2 warm-purple 265° oklch tokens. Zero visible change — drop-in replacement.

**Files Affected:**

| File | Change | Est. |
|------|--------|------|
| `app/globals.css` | Replace `:root` and `.dark` oklch values from hue 270° → 265°. Add brand scale (50–900), neutral scale (warm undertone chroma 0.003–0.005), semantic tokens (success/warning/error/info), 5-level surface hierarchy, 3-level border treatment, spacing scale, typography scale, motion tokens. | 4h |
| `app/globals.css` | Map new tokens into `@theme inline` block for Tailwind v4 access | 1h |
| `app/globals.css` | Verify no existing Tailwind classes break | 0.5h |

**Implementation Order:**
1. Back up current `globals.css` as `globals.css.v1`
2. Update `:root` CSS variables — keep same variable names, update oklch values
3. Add new tokens (brand scale, surfaces, borders, spacing, typography, motion)
4. Update `@theme inline` block to expose new tokens to Tailwind
5. Test: `npm run build` → `vitest run` → manual browser check

**Regression Risk:** 🟡 MEDIUM — every component reads these tokens. Renaming breaks everything. Strategy: keep variable NAMES, update VALUES only. Add NEW variables as additions.

**Rollback Strategy:**
```bash
git checkout main -- app/globals.css
```
No other files depend on new tokens yet.

**Deploy Checkpoint:** `git commit -m "v2-lite-a1: design token foundation"`

---

### A2. Core Components (6–8h)

**Goal:** Build/upgrade reusable V2 components. Install missing shadcn/ui primitives. Create Command Palette, EmptyState, Skeleton variants.

**Files Affected:**

| File | Change | Est. |
|------|--------|------|
| `package.json` | Add `cmdk` dependency (Command Palette) | 0.25h |
| `components.json` | Update shadcn config if needed | 0.25h |
| `components/ui/command.tsx` | **NEW** — Command Palette component (shadcn `cmdk` wrapper) | 2h |
| `components/ui/empty-state.tsx` | **NEW** — Reusable empty state (icon, title, description, CTA) | 1h |
| `components/ui/skeleton-variants.tsx` | **NEW** — Card, list, table, chat message skeleton loaders | 1h |
| `components/ui/status-badge.tsx` | **NEW** — Processing/ready/failed status badges | 0.5h |
| `components/ui/page-header.tsx` | **NEW** — Page title + description + breadcrumbs + actions slot | 0.5h |
| `components/ui/breadcrumb.tsx` | **NEW** — Breadcrumb component (if not already installed) | 0.5h |

**Implementation Order:**
1. `npm install cmdk` (Command Palette library)
2. Create `components/ui/empty-state.tsx` — simplest component first
3. Create `components/ui/status-badge.tsx` — simple, used by documents
4. Create `components/ui/skeleton-variants.tsx` — variants for card/list/table/chat
5. Create `components/ui/page-header.tsx` — composes existing primitives
6. Create `components/ui/breadcrumb.tsx` — simple navigation aid
7. Create `components/ui/command.tsx` — most complex, depends on cmdk
8. Test: `npm run build` → `vitest run` → manual check each component

**Regression Risk:** 🟢 LOW — all NEW files. No existing files modified. Additive only.

**Rollback Strategy:**
```bash
git revert HEAD  # removes all new component files
npm uninstall cmdk
```
New components are additive — no existing code references them yet.

**Deploy Checkpoint:** `git commit -m "v2-lite-a2: core component library"`

---

### A3. Sidebar Cleanup (4–6h)

**Goal:** Reduce sidebar from 14+ items to 6 core items. Hide developer features behind Command Palette. Clean up visual styling.

**Files Affected:**

| File | Change | Est. |
|------|--------|------|
| `components/layout/app-sidebar.tsx` | Rewrite nav structure: 6 items (Dashboard, Chat, Documents, Knowledge, Analytics, Settings). Remove Knowledge Base sub-section (Chunks, Search, Sources → accessible via Cmd+K). Remove AI section (Playground, Prompts → accessible via Cmd+K). Remove Integrations section (Widgets, API → accessible via Cmd+K). Clean up bottom nav (Workspace, Usage, Billing → merge into Settings). | 3h |
| `components/layout/app-sidebar.tsx` | Visual cleanup: remove emoji if any, use design tokens for colors, add left-border active indicator, clean up spacing | 1h |
| `components/layout/top-nav.tsx` | Add Command Palette trigger (search input with Cmd+K hint). Remove non-functional search bar. | 1h |
| `components/layout/dashboard-shell-client.tsx` | Wire Command Palette overlay. Add Cmd+K keyboard listener. | 1h |

**Sidebar Before → After:**

```
BEFORE (14+ items):              AFTER (6 items):
├── Dashboard                    ├── Dashboard
├── Chat                         ├── Chat
├── Knowledge Base               ├── Documents
│   ├── Documents                ├── Knowledge
│   ├── Chunks          → Cmd+K  ├── Analytics
│   ├── Search          → Cmd+K  └── Settings
│   ├── Sources         → Cmd+K  
│   └── Upload          → Cmd+K  Bottom:
├── Analytics                    └── User Menu
│   ├── Usage           → Cmd+K  
│   ├── Chat            → Cmd+K  
│   └── Cost            → Cmd+K  
├── AI                           
│   ├── Playground      → Cmd+K  
│   └── Prompts         → Cmd+K  
├── Integrations                 
│   ├── Widgets         → Cmd+K  
│   └── API             → Cmd+K  
└── Bottom                       
    ├── Workspace       → Settings
    ├── Usage           → Analytics
    ├── Billing         → Settings
    └── Settings                 
```

**Implementation Order:**
1. Read current `app-sidebar.tsx` — understand nav structure
2. Rewrite `primaryNav` array: 6 items only
3. Rewrite `navSections`: remove Knowledge Base, Analytics, AI, Integrations sub-items
4. Rewrite `bottomNav`: remove (merge into Settings)
5. Update visual styling: design tokens, active indicator, spacing
6. Update `top-nav.tsx`: add Cmd+K trigger
7. Update `dashboard-shell-client.tsx`: wire Command Palette
8. Test: all 6 sidebar links work, Cmd+K opens palette, all old URLs still accessible

**Regression Risk:** 🟡 MEDIUM — sidebar wraps every authenticated page. Changes affect visual appearance of every page. But routes stay the same — no URL breaks.

**Rollback Strategy:**
```bash
git checkout main -- components/layout/app-sidebar.tsx components/layout/top-nav.tsx components/layout/dashboard-shell-client.tsx
```
Sidebar is a single component — revert restores everything.

**Deploy Checkpoint:** `git commit -m "v2-lite-a3: sidebar cleanup + command palette"`

---

### Sprint A Verification Checklist

- [ ] `npm run build` — zero errors
- [ ] `vitest run` — 353 tests pass
- [ ] Dark mode: all pages render correctly with new tokens
- [ ] Light mode: all pages render correctly with new tokens
- [ ] Sidebar: 6 items, all links work
- [ ] Cmd+K: opens, searches, navigates
- [ ] Breadcrumbs: appear on deep pages
- [ ] No hardcoded colors remain in modified files
- [ ] Mobile: sidebar hamburger still works
- [ ] All 34 existing URLs still resolve

---

## Sprint B: Landing Page V2 (8–12h)

### B1. Landing Page Complete Rewrite (8–12h)

**Goal:** Transform landing page from emoji-heavy template into premium, product-led page. Zero emoji, brand colors, social proof, clear CTAs.

**Files Affected:**

| File | Change | Est. |
|------|--------|------|
| `app/page.tsx` | **Full rewrite.** Remove all emoji (🤖📚🔍⚡💬📄). Replace with Lucide icons. Replace generic blue gradient with warm-purple dark theme. Replace "Mimotes AI Chatbot" title with value proposition headline. Add hero section with product screenshot placeholder. Add social proof bar. Add features section (4 cards, not 3). Add "How it works" (3 steps). Add pricing section (Free/Pro/Enterprise). Add FAQ accordion. Redesign footer with brand colors. Remove all hardcoded `bg-white`, `text-gray-*` classes. | 8h |

**Landing Page Structure (V2):**

```
┌─────────────────────────────────────────────┐
│ NAV: Logo | Product Pricing Docs | Sign Up  │
├─────────────────────────────────────────────┤
│                                             │
│  HERO                                       │
│  "Your knowledge base, instantly accessible"│
│  Subheadline + CTA + Product Screenshot     │
│                                             │
├─────────────────────────────────────────────┤
│  SOCIAL PROOF BAR                           │
│  Trusted by X teams | 4.8/5 | 99.9% uptime │
├─────────────────────────────────────────────┤
│  FEATURES (4 cards with Lucide icons)       │
│  Upload & Chat | Sources | Teams | Analytics│
├─────────────────────────────────────────────┤
│  HOW IT WORKS (3 steps)                     │
│  1. Upload → 2. Ask → 3. Get answers        │
├─────────────────────────────────────────────┤
│  PRICING (3 tiers)                          │
│  Free $0 | Pro $19 | Enterprise Custom      │
├─────────────────────────────────────────────┤
│  FAQ (accordion)                            │
├─────────────────────────────────────────────┤
│  FINAL CTA                                  │
│  "Stop searching. Start knowing."           │
├─────────────────────────────────────────────┤
│  FOOTER (4 columns)                         │
│  Product | Company | Legal | Connect        │
└─────────────────────────────────────────────┘
```

**Implementation Order:**
1. Create product screenshot placeholder (or use `public/og-image.png` if exists)
2. Rewrite hero section — headline, subheadline, dual CTA, screenshot
3. Add social proof bar — stats + placeholder logos
4. Rewrite features section — 4 cards with Lucide icons, no emoji
5. Add "How it works" — 3 numbered steps
6. Add pricing section — 3-tier cards
7. Add FAQ — accordion using shadcn/ui Collapsible
8. Redesign footer — 4-column layout with brand colors
9. Remove all hardcoded colors — use design tokens throughout
10. Test: dark mode, light mode, mobile (375px), tablet (768px), desktop (1440px)

**Regression Risk:** 🟢 LOW — single file (`app/page.tsx`). No other page depends on it. Landing page is public, not behind auth.

**Rollback Strategy:**
```bash
git checkout main -- app/page.tsx
```
Single file revert. Zero dependencies.

**Deploy Checkpoint:** `git commit -m "v2-lite-b1: landing page v2"`

---

### Sprint B Verification Checklist

- [ ] `npm run build` — zero errors
- [ ] `vitest run` — 353 tests pass
- [ ] Zero emoji on landing page
- [ ] Dark mode: no white backgrounds, brand purple accents
- [ ] Light mode: clean, readable, brand colors
- [ ] Hero: value proposition clear, CTA visible
- [ ] Features: 4 cards with Lucide icons
- [ ] Pricing: 3 tiers visible
- [ ] Footer: 4-column layout
- [ ] Mobile (375px): stacked layout, readable
- [ ] Both CTAs work: "Mulai Chat" → /chat, "Admin Login" → /login
- [ ] No hardcoded `bg-white`, `text-gray-*`, `from-blue-*` classes

---

## Sprint C: Chat UX Improvements (8–10h)

### C1. Chat Empty State + Suggested Prompts (3–4h)

**Goal:** Replace empty chat state with branded welcome + suggested prompts. No more empty textarea with nothing to do.

**Files Affected:**

| File | Change | Est. |
|------|--------|------|
| `components/chat/chat-window.tsx` | Add empty state when `messages.length === 0`: welcome message from AI, 6 suggested prompt cards (categorized), quick actions (Upload doc, Browse knowledge). Replace bouncing dots animation with streaming cursor. | 2h |
| `components/chat/empty-state.tsx` | **NEW** — Dedicated empty state component with brand icon, welcome text, suggested prompts grid, quick actions | 1.5h |

**Suggested Prompts (6 cards):**

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 📄 Summarize     │ │ 🔍 Find info     │ │ 💡 Explain       │
│ "Summarize my    │ │ "What does the   │ │ "Explain the     │
│  uploaded docs"  │ │  policy say      │ │  main points of  │
│                  │ │  about X?"       │ │  this document"  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 📊 Compare       │ │ ✍️ Write         │ │ 🎯 Action items  │
│ "Compare the     │ │ "Write a email   │ │ "Extract action  │
│  2024 vs 2025    │ │  based on these  │ │  items from the  │
│  reports"        │ │  meeting notes"  │ │  meeting notes"  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

Wait — no emoji. Use Lucide icons instead:

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ FileText         │ │ Search           │ │ Lightbulb        │
│ "Summarize my    │ │ "What does the   │ │ "Explain the     │
│  uploaded docs"  │ │  policy say      │ │  main points of  │
│                  │ │  about X?"       │ │  this document"  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ BarChart3        │ │ PenLine          │ │ CheckSquare      │
│ "Compare the     │ │ "Write a email   │ │ "Extract action  │
│  2024 vs 2025    │ │  based on these  │ │  items from the  │
│  reports"        │ │  meeting notes"  │ │  meeting notes"  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

**Implementation Order:**
1. Create `components/chat/empty-state.tsx` — standalone component
2. Design suggested prompts data structure (array of {icon, label, prompt})
3. Wire empty state into `chat-window.tsx` — show when no messages
4. Make prompts clickable — clicking fills input and sends
5. Test: empty state renders, prompts work, dark/light mode

**Regression Risk:** 🟢 LOW — additive change. Empty state only shows when `messages.length === 0`. Existing chat behavior unchanged.

**Rollback Strategy:**
```bash
git checkout main -- components/chat/chat-window.tsx
rm components/chat/empty-state.tsx
```

**Deploy Checkpoint:** `git commit -m "v2-lite-c1: chat empty state + suggested prompts"`

---

### C2. Chat Feedback Buttons (2–3h)

**Goal:** Add thumbs up/down feedback on assistant messages. Visual-only for now (stores locally, no API).

**Files Affected:**

| File | Change | Est. |
|------|--------|------|
| `components/chat/feedback-buttons.tsx` | **NEW** — ThumbsUp/ThumbsDown buttons, visible on hover, selected state persists in localStorage | 1.5h |
| `components/chat/message-bubble.tsx` | Import and render FeedbackButtons below assistant messages. Add hover reveal behavior. | 1h |

**Feedback Button Spec:**

```
Assistant message:
┌─────────────────────────────────────────┐
│ AI response text here...                │
│                                         │
│ [👍] [👎]  ← visible on hover          │
└─────────────────────────────────────────┘

Selected state:
┌─────────────────────────────────────────┐
│ AI response text here...                │
│                                         │
│ [👍 ✓] [👎]  ← filled icon, brand color│
└─────────────────────────────────────────┘
```

**Implementation Order:**
1. Create `components/chat/feedback-buttons.tsx`
2. Design state: `feedback: 'positive' | 'negative' | null`
3. Store in localStorage keyed by message ID
4. Wire into `message-bubble.tsx` — render below assistant messages only
5. Add hover reveal: `opacity-0 group-hover:opacity-100`
6. Test: buttons appear on hover, selection persists, dark/light mode

**Regression Risk:** 🟢 LOW — additive component. Only renders on assistant messages. No existing behavior changed.

**Rollback Strategy:**
```bash
git checkout main -- components/chat/message-bubble.tsx
rm components/chat/feedback-buttons.tsx
```

**Deploy Checkpoint:** `git commit -m "v2-lite-c2: chat feedback buttons"`

---

### C3. Chat Avatars + Visual Polish (2–3h)

**Goal:** Replace generic "U" / "AI" circle avatars with branded design. Clean up hardcoded colors throughout chat components.

**Files Affected:**

| File | Change | Est. |
|------|--------|------|
| `components/chat/message-bubble.tsx` | Replace hardcoded `bg-gray-600` user avatar with design token colors. Replace `bg-blue-600` AI avatar with brand-500. Use initials or icon, not single letters. Add subtle border/shadow to avatars. | 1h |
| `components/chat/chat-window.tsx` | Remove any hardcoded colors. Apply design tokens to input area, message container, scrollbar. | 0.5h |
| `components/chat/source-card.tsx` | Apply design tokens. Clean up hardcoded colors. | 0.5h |
| `components/chat/session-sidebar.tsx` | Apply design tokens. Clean up hardcoded colors. | 0.5h |

**Avatar Before → After:**

```
BEFORE:                        AFTER:
┌──┐                           ┌──┐
│U │  gray-600 bg              │ES│  brand-500 bg, white text
└──┘                           └──┘
┌──┐                           ┌──┐
│AI│  blue-600 bg              │AI│  brand-600 bg, white text, subtle shadow
└──┘                           └──┘
```

**Implementation Order:**
1. Audit all chat components for hardcoded colors (`bg-blue-600`, `bg-gray-600`, `text-gray-*`)
2. Replace with design token equivalents (`bg-brand-500`, `bg-neutral-400`, etc.)
3. Update avatar styling in `message-bubble.tsx`
4. Clean up `source-card.tsx` and `session-sidebar.tsx`
5. Test: dark mode, light mode, all chat components render correctly

**Regression Risk:** 🟢 LOW — visual-only changes. No behavior changes. Colors shift slightly (270° → 265°) but remain purple.

**Rollback Strategy:**
```bash
git checkout main -- components/chat/
```

**Deploy Checkpoint:** `git commit -m "v2-lite-c3: chat avatars + visual polish"`

---

### Sprint C Verification Checklist

- [ ] `npm run build` — zero errors
- [ ] `vitest run` — 353 tests pass
- [ ] Empty state: shows when no messages, prompts are clickable
- [ ] Suggested prompts: 6 cards with Lucide icons (no emoji)
- [ ] Feedback buttons: appear on hover, selection persists
- [ ] Avatars: branded colors, not generic gray/blue
- [ ] No hardcoded colors in chat components
- [ ] Dark mode: all chat UI correct
- [ ] Light mode: all chat UI correct
- [ ] Mobile: chat input works, keyboard doesn't overlap
- [ ] Streaming: still works (don't break existing functionality)

---

## Summary

| Sprint | Focus | Hours | Files Changed | Risk |
|--------|-------|-------|---------------|------|
| **A** | Foundation + Navigation | 14–20h | 8 files (1 modified, 7 new) | 🟡 Medium |
| **B** | Landing Page | 8–12h | 1 file (full rewrite) | 🟢 Low |
| **C** | Chat UX | 8–10h | 6 files (4 modified, 2 new) | 🟢 Low |
| **Total** | | **30–42h** | **15 files** | |

### What This Plan DOES

- ✅ Upgrades design tokens (270° → 265°, warm neutrals)
- ✅ Adds Command Palette (Cmd+K)
- ✅ Reduces sidebar from 14+ to 6 items
- ✅ Creates reusable components (EmptyState, Skeleton, StatusBadge)
- ✅ Redesigns landing page (zero emoji, premium feel)
- ✅ Improves chat UX (suggested prompts, feedback, avatars)
- ✅ Keeps app deployable after every sprint
- ✅ Keeps 353 tests green

### What This Plan DOES NOT Do

- ❌ Route migration or consolidation
- ❌ Redirect strategy
- ❌ Major dashboard restructuring
- ❌ Major chat architecture rewrite
- ❌ Mobile bottom tab bar
- ❌ Onboarding flow
- ❌ Micro-interactions / motion
- ❌ Dark/light mode toggle
- ❌ Backend changes
- ❌ Database schema changes
- ❌ API changes

### Next Steps (After V2 Lite)

If V2 Lite ships successfully, the next increment would be:

1. **Sprint D:** Dashboard improvements (welcome hero, charts, activity feed)
2. **Sprint E:** Mobile experience (bottom tab bar, gestures, touch targets)
3. **Sprint F:** Polish (skeleton loaders everywhere, micro-interactions, a11y)

---

**Document generated:** 2026-06-13
**Status:** Ready for execution
**First action:** Start Sprint A, Task A1 (design tokens in globals.css)
