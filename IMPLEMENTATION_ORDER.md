# IMPLEMENTATION_ORDER.md — MimoNotes V2 Redesign

> **Version:** 1.0.0
> **Status:** Execution Plan — Authoritative
> **Last Updated:** June 13, 2026
> **Owner:** Eko Saputro (Solo Founder)
> **Budget:** $0 — solo, open-source only
> **Constraint:** App must remain deployable after every phase

---

## 1. Executive Summary

This document is the single source of truth for **execution order** of the MimoNotes V2 redesign. It translates the design specs (`MIMONOTES_V2_DESIGN_SYSTEM.md`, `LANDING_PAGE_V2_SPEC.md`, `CHAT_EXPERIENCE_V2.md`, `DASHBOARD_V2_SPEC.md`, etc.) into a prioritized, phase-by-phase build plan.

**Key decisions:**
- **Foundation-first:** Design tokens and CSS variable updates land before any visual changes.
- **Impact-first:** Landing page (highest-traffic, highest-conversion page) ships early.
- **Zero backend changes:** All work is frontend-only. 353 backend tests untouched.
- **Deployable after every phase:** Each phase ends with a working build.
- **10 phases, ~80–100 estimated hours total.**

**Priority order (highest user impact → lowest):**

| Phase | Name | Hours | Impact |
|-------|------|-------|--------|
| 0 | Design Token Foundation | 4–6h | 🟢 Enabler |
| 1 | Core Component Library | 8–12h | 🟢 Enabler |
| 2 | Navigation Rearchitecture | 6–8h | 🟡 High |
| 3 | Landing Page Redesign | 8–10h | 🔴 Highest |
| 4 | Chat Experience V2 | 10–14h | 🔴 Highest |
| 5 | Dashboard Redesign | 8–10h | 🟡 High |
| 6 | Documents & Upload | 6–8h | 🟡 High |
| 7 | Settings Consolidation | 4–6h | 🟢 Medium |
| 8 | Mobile Experience | 8–10h | 🟡 High |
| 9 | Polish & Optimization | 6–8h | 🟢 Medium |

---

## 2. Implementation Principles

1. **Foundation before visuals.** Tokens, CSS variables, and base components must exist before any page is touched.
2. **Components before pages.** Build reusable components first, then compose pages from them.
3. **One page at a time.** Never refactor two major pages in the same commit.
4. **Feature-flag risky changes.** When in doubt, wrap behind a conditional render.
5. **Visual regression = deployable.** A broken pixel is not a broken app. Ship and iterate.
6. **353 tests stay green.** Run `vitest run` after every phase. Backend untouched.
7. **Git checkpoint per phase.** Every phase ends with a commit tagged `v2-phase-N`.
8. **Dark mode is default.** All new code designed for dark-first, light as variant.
9. **Accessibility matters.** Semantic HTML, proper ARIA labels, keyboard navigation.
10. **Ship early, polish later.** A good-enough page beats a perfect plan.

---

## 3. Phase 0: Design Token Foundation

### Goal
Update `globals.css` with V2 warm-purple 265° oklch tokens, neutral scale, and semantic tokens. Zero visual change to existing pages — this is a drop-in replacement that preserves current appearance while establishing the new foundation.

### Tasks
| # | Task | File | Est. |
|---|------|------|------|
| 0.1 | Update `:root` and `.dark` CSS variables with V2 brand scale (265° hue), neutral scale (warm undertone), semantic tokens | `app/globals.css` | 2h |
| 0.2 | Add spacing scale tokens (`--space-1` through `--space-16`) | `app/globals.css` | 0.5h |
| 0.3 | Add typography scale tokens (`--text-xs` through `--text-5xl`) | `app/globals.css` | 0.5h |
| 0.4 | Add elevation tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) | `app/globals.css` | 0.5h |
| 0.5 | Add transition tokens (`--ease-default`, `--duration-fast`, `--duration-normal`) | `app/globals.css` | 0.5h |
| 0.6 | Map tokens into `@theme inline` block for Tailwind v4 access | `app/globals.css` | 1h |
| 0.7 | Verify no existing Tailwind classes break | — | 0.5h |

### Dependencies
- None (this is the first phase)

### Verification Steps
- [ ] `npm run build` passes with zero errors
- [ ] `vitest run` — all 353 tests pass
- [ ] Manual: load app in browser, both light and dark mode, no visual regressions
- [ ] Manual: inspect computed CSS values in DevTools, confirm new oklch tokens present
- [ ] Compare before/after screenshots of dashboard and landing page — pixel-identical

### Rollback Plan
- `git checkout main -- app/globals.css`
- No other files depend on the new tokens yet (Phase 0 is CSS-only)

### Deploy Checkpoint
- `git commit -m "v2-phase-0: design token foundation"`
- Build must pass, deploy must succeed

---

## 4. Phase 1: Core Component Library

### Goal
Build/upgrade reusable V2 components that all subsequent phases consume. Install new shadcn/ui components needed for V2. Create empty-state, skeleton, and command-palette primitives.

### Tasks
| # | Task | File(s) | Est. |
|---|------|---------|------|
| 1.1 | Install shadcn/ui components: `Command`, `Popover`, `Breadcrumb`, `NavigationMenu`, `ScrollArea`, `Collapsible`, `DropdownMenu` (upgrade) | `components.json`, run `npx shadcn@latest add` | 1h |
| 1.2 | Create `EmptyState` component (icon, title, description, optional CTA) | `components/ui/empty-state.tsx` | 1h |
| 1.3 | Create `PageHeader` component (title, description, breadcrumbs, actions slot) | `components/ui/page-header.tsx` | 1h |
| 1.4 | Create `CommandPalette` component (Cmd+K trigger, search, navigation actions) | `components/command-palette.tsx` | 3h |
| 1.5 | Create `Breadcrumb` component | `components/ui/breadcrumb.tsx` | 0.5h |
| 1.6 | Create `SkeletonLoader` variants for card, list, chart, table | `components/ui/skeleton-variants.tsx` | 1h |
| 1.7 | Create `StatusBadge` component (processing, ready, failed states) | `components/ui/status-badge.tsx` | 0.5h |
| 1.8 | Add `cmdk` and `@radix-ui/react-dialog` dependencies (if not already) | `package.json` | 0.5h |

### Dependencies
- Phase 0 (design tokens)

### Verification Steps
- [ ] `npm run build` passes
- [ ] `vitest run` — all 353 tests pass
- [ ] Manual: Command Palette opens with Cmd+K, closes with Escape
- [ ] Manual: EmptyState renders correctly in both themes
- [ ] Manual: Skeleton variants render with animation
- [ ] All new components importable without errors

### Rollback Plan
- `git revert HEAD` — new components are additive, no existing files changed
- If shadcn install causes issues: `git checkout main -- components.json && npm install`

### Deploy Checkpoint
- `git commit -m "v2-phase-1: core component library"`

---

## 5. Phase 2: Navigation Rearchitecture

### Goal
Simplify sidebar from 17+ items to 6 core items. Add Command Palette integration. Add breadcrumbs to all admin pages. Create a clean, Linear-inspired navigation hierarchy.

### Tasks
| # | Task | File(s) | Est. |
|---|------|---------|------|
| 2.1 | Redesign sidebar: reduce to Dashboard, Chat, Documents, Analytics, Settings (5 items + user section) | `components/layout/app-sidebar.tsx` | 2h |
| 2.2 | Move "Knowledge Base" sub-items (Chunks, Search, Sources) behind Documents or into Command Palette | `components/layout/app-sidebar.tsx` | 1h |
| 2.3 | Move "AI" section (Playground, Prompts) into Settings or Command Palette | `components/layout/app-sidebar.tsx` | 0.5h |
| 2.4 | Move "Integrations" (Widgets, API) into Settings | `components/layout/app-sidebar.tsx` | 0.5h |
| 2.5 | Add Command Palette trigger to TopNav (Cmd+K button or search input) | `components/layout/top-nav.tsx` | 1h |
| 2.6 | Add `Breadcrumb` to `DashboardShellClient` — derive from pathname | `components/layout/dashboard-shell-client.tsx` | 1h |
| 2.7 | Add keyboard shortcut: Cmd+K opens Command Palette globally | `components/command-palette.tsx` (update) | 1h |
| 2.8 | Test all navigation paths still work | — | 0.5h |

### Dependencies
- Phase 0, Phase 1

### Verification Steps
- [ ] `npm run build` passes
- [ ] `vitest run` — all 353 tests pass
- [ ] Manual: sidebar shows 5 core items (no more 17+)
- [ ] Manual: Cmd+K opens palette, search finds all pages
- [ ] Manual: breadcrumbs appear on dashboard, documents, settings, etc.
- [ ] Manual: all existing URLs still resolve and render correctly
- [ ] Manual: mobile nav still works (hamburger → sheet)

### Rollback Plan
- `git checkout main -- components/layout/app-sidebar.tsx components/layout/top-nav.tsx components/layout/dashboard-shell-client.tsx`
- Command Palette file is additive, delete if needed

### Deploy Checkpoint
- `git commit -m "v2-phase-2: navigation rearchitecture"`

---

## 6. Phase 3: Landing Page Redesign

### Goal
Transform the landing page from emoji-heavy, hardcoded `bg-white` template into a premium, product-led page with warm-purple palette, dark-mode support, social proof, and clear CTAs. This is the **highest-impact visual change** — it's the first thing visitors see.

### Tasks
| # | Task | File(s) | Est. |
|---|------|---------|------|
| 3.1 | Rewrite hero section: brand headline, value prop, dual CTA (no emoji), dark-mode compatible | `app/page.tsx` | 3h |
| 3.2 | Replace emoji feature cards with icon + text cards using `lucide-react` icons | `app/page.tsx` | 1.5h |
| 3.3 | Add product screenshot/mockup placeholder to hero | `app/page.tsx`, `public/` | 1h |
| 3.4 | Add social proof section (or "Trusted by" placeholder) | `app/page.tsx` | 0.5h |
| 3.5 | Add FAQ or "How it works" section | `app/page.tsx` | 1h |
| 3.6 | Redesign footer with brand colors | `app/page.tsx` | 0.5h |
| 3.7 | Remove all hardcoded `bg-white`, `text-gray-*` classes — use design tokens | `app/page.tsx` | 0.5h |
| 3.8 | Add subtle gradient/texture with brand purple (not blue) | `app/page.tsx` | 0.5h |

### Dependencies
- Phase 0, Phase 1

### Verification Steps
- [ ] `npm run build` passes
- [ ] `vitest run` — all 353 tests pass
- [ ] Manual: landing page renders in dark mode correctly (no white backgrounds)
- [ ] Manual: landing page renders in light mode correctly
- [ ] Manual: no emoji anywhere on the page
- [ ] Manual: both CTAs ("Mulai Chat" and "Admin Login") work
- [ ] Manual: responsive — looks good on mobile (375px), tablet (768px), desktop (1440px)
- [ ] Lighthouse accessibility score ≥ 90

### Rollback Plan
- `git checkout main -- app/page.tsx`
- Landing page is a single file, zero dependencies on other V2 changes

### Deploy Checkpoint
- `git commit -m "v2-phase-3: landing page redesign"`

---

## 7. Phase 4: Chat Experience V2

### Goal
Upgrade the chat interface with streaming response rendering, citation panels, suggested prompts, typing indicators, and feedback buttons. This is the **core product experience** — highest user-time impact.

### Tasks
| # | Task | File(s) | Est. |
|---|------|---------|------|
| 4.1 | Add suggested prompts to empty state (replace 🤖 emoji with brand icon) | `components/chat/chat-window.tsx` | 1.5h |
| 4.2 | Upgrade typing indicator (replace bouncing dots with streaming cursor animation) | `components/chat/chat-window.tsx` | 1h |
| 4.3 | Create `CitationPanel` — expandable sidebar showing source documents with highlight | `components/chat/citation-panel.tsx` | 2h |
| 4.4 | Create `FeedbackButtons` — thumbs up/down on assistant messages | `components/chat/feedback-buttons.tsx` | 1h |
| 4.5 | Upgrade `MessageBubble` — better markdown rendering, code blocks with copy button, source citations inline | `components/chat/message-bubble.tsx` | 2h |
| 4.6 | Add streaming token display (show text as it arrives, with blinking cursor) | `components/chat/chat-window.tsx` | 1.5h |
| 4.7 | Add keyboard shortcuts: Cmd+/ for new chat, Escape to stop generation | `components/chat/chat-window.tsx` | 0.5h |
| 4.8 | Replace hardcoded `bg-blue-600` AI avatar with design-token-based avatar | `components/chat/chat-window.tsx` | 0.5h |
| 4.9 | Remove all hardcoded colors, use design tokens throughout | `components/chat/*.tsx` | 0.5h |
| 4.10 | Create `ChatEmptyState` with brand illustration/icon | `components/chat/empty-state.tsx` | 0.5h |

### Dependencies
- Phase 0, Phase 1, Phase 3 (for landing → chat flow)

### Verification Steps
- [ ] `npm run build` passes
- [ ] `vitest run` — all 353 tests pass
- [ ] Manual: chat loads, suggested prompts display on empty state
- [ ] Manual: send a message, see streaming response with cursor animation
- [ ] Manual: source citations appear below response
- [ ] Manual: feedback buttons render on assistant messages
- [ ] Manual: Cmd+K still works, Cmd+/ creates new chat
- [ ] Manual: dark mode — no hardcoded colors leaking through
- [ ] Manual: mobile — chat input works, keyboard doesn't overlap

### Rollback Plan
- `git checkout main -- components/chat/`
- Chat components are self-contained, no other page depends on V2 changes

### Deploy Checkpoint
- `git commit -m "v2-phase-4: chat experience v2"`

---

## 8. Phase 5: Dashboard Redesign

### Goal
Transform dashboard from stat-card grid into a welcome-hero + insights layout. Add usage charts, recent activity, and quick actions in a premium layout.

### Tasks
| # | Task | File(s) | Est. |
|---|------|---------|------|
| 5.1 | Add welcome hero: "Good morning, {name}" with contextual greeting | `app/dashboard/page.tsx` | 1h |
| 5.2 | Upgrade `StatCard` — design token colors, subtle hover, trend indicators | `components/dashboard/stat-card.tsx` | 1h |
| 5.3 | Add usage chart (line chart for messages over time) | `components/dashboard/usage-chart.tsx` | 2h |
| 5.4 | Add "Recent Chats" widget with session previews | `components/dashboard/recent-chats.tsx` | 1h |
| 5.5 | Upgrade Quick Actions — remove emoji, use icons, better grid | `app/dashboard/page.tsx` | 1h |
| 5.6 | Add skeleton loaders to all dashboard widgets | `components/dashboard/*.tsx` | 1h |
| 5.7 | Remove all hardcoded colors, apply design tokens | `components/dashboard/*.tsx` | 0.5h |
| 5.8 | Add empty states for widgets with zero data | `components/dashboard/*.tsx` | 0.5h |

### Dependencies
- Phase 0, Phase 1, Phase 2 (navigation)

### Verification Steps
- [ ] `npm run build` passes
- [ ] `vitest run` — all 353 tests pass
- [ ] Manual: dashboard shows welcome greeting with user name
- [ ] Manual: stat cards display with correct values
- [ ] Manual: usage chart renders (even if empty)
- [ ] Manual: skeletons show during data loading
- [ ] Manual: dark mode works throughout
- [ ] Manual: responsive on mobile

### Rollback Plan
- `git checkout main -- app/dashboard/page.tsx components/dashboard/`
- Dashboard is self-contained behind auth

### Deploy Checkpoint
- `git commit -m "v2-phase-5: dashboard redesign"`

---

## 9. Phase 6: Documents & Upload

### Goal
Upgrade document list with search, filter, status badges, and preview. Improve upload experience with drag-and-drop visual feedback.

### Tasks
| # | Task | File(s) | Est. |
|---|------|---------|------|
| 6.1 | Add search bar to document list | `app/(admin)/documents/page.tsx` or knowledge equivalent | 1h |
| 6.2 | Add status filter tabs (All / Processing / Ready / Failed) | Document list page | 1h |
| 6.3 | Upgrade document cards — status badge, chunk count, last updated | `components/documents/document-list.tsx` | 1.5h |
| 6.4 | Add empty state for zero documents | Document list page | 0.5h |
| 6.5 | Upgrade upload page — drag-and-drop zone with visual feedback | `app/(admin)/documents/upload/page.tsx` | 1.5h |
| 6.6 | Add upload progress indicator | Upload form component | 1h |
| 6.7 | Remove hardcoded colors, apply design tokens | All document components | 0.5h |
| 6.8 | Add skeleton loaders for document list | Document list page | 0.5h |

### Dependencies
- Phase 0, Phase 1, Phase 2

### Verification Steps
- [ ] `npm run build` passes
- [ ] `vitest run` — all 353 tests pass
- [ ] Manual: document list shows with search and filter
- [ ] Manual: status badges display correctly
- [ ] Manual: upload drag-and-drop works
- [ ] Manual: empty states show for zero documents
- [ ] Manual: dark mode consistent

### Rollback Plan
- `git checkout main -- app/(admin)/documents/ components/documents/`

### Deploy Checkpoint
- `git commit -m "v2-phase-6: documents & upload redesign"`

---

## 10. Phase 7: Settings Consolidation

### Goal
Consolidate settings into a cleaner layout. Move Integrations, Workspace, Billing into a tabbed settings page. Reduce navigation complexity.

### Tasks
| # | Task | File(s) | Est. |
|---|------|---------|------|
| 7.1 | Redesign settings page with tabbed layout (General, AI, Workspace, Billing, Integrations) | `app/(admin)/settings/page.tsx` | 2h |
| 7.2 | Move Widget settings into Integrations tab | Settings page | 0.5h |
| 7.3 | Move API/Developer settings into Integrations tab | Settings page | 0.5h |
| 7.4 | Upgrade `AISettingsForm` — cleaner layout, model selector improvements | `components/settings/ai-settings-form.tsx` | 1h |
| 7.5 | Add breadcrumbs to settings sub-pages | Settings pages | 0.5h |
| 7.6 | Remove hardcoded colors, apply design tokens | Settings components | 0.5h |

### Dependencies
- Phase 0, Phase 1, Phase 2

### Verification Steps
- [ ] `npm run build` passes
- [ ] `vitest run` — all 353 tests pass
- [ ] Manual: settings tabs navigate correctly
- [ ] Manual: AI provider settings save and load
- [ ] Manual: all settings sub-pages accessible
- [ ] Manual: breadcrumbs show on settings sub-pages

### Rollback Plan
- `git checkout main -- app/(admin)/settings/ components/settings/`

### Deploy Checkpoint
- `git commit -m "v2-phase-7: settings consolidation"`

---

## 11. Phase 8: Mobile Experience

### Goal
Add bottom tab bar for mobile, optimize touch targets, add swipe gestures for chat session list, ensure all pages are mobile-first.

### Tasks
| # | Task | File(s) | Est. |
|---|------|---------|------|
| 8.1 | Create `BottomTabBar` component (Dashboard, Chat, Documents, Settings) | `components/layout/bottom-tab-bar.tsx` | 2h |
| 8.2 | Integrate `BottomTabBar` into `DashboardShellClient` — show only on mobile | `components/layout/dashboard-shell-client.tsx` | 1h |
| 8.3 | Hide sidebar on mobile, use bottom tabs instead | `components/layout/dashboard-shell-client.tsx` | 1h |
| 8.4 | Add swipe gesture to chat session sidebar (open/close) | `components/chat/session-sidebar.tsx` | 1.5h |
| 8.5 | Optimize touch targets — minimum 44px tap areas | All interactive components | 1h |
| 8.6 | Test responsive breakpoints: 375px, 768px, 1024px, 1440px | All pages | 1h |
| 8.7 | Add safe-area-inset support for iPhone notch | `app/globals.css`, layout | 0.5h |

### Dependencies
- Phase 0, Phase 1, Phase 2, Phase 4, Phase 5

### Verification Steps
- [ ] `npm run build` passes
- [ ] `vitest run` — all 353 tests pass
- [ ] Manual (mobile): bottom tab bar appears, sidebar hidden
- [ ] Manual (mobile): tabs navigate correctly
- [ ] Manual (mobile): chat input doesn't overlap with keyboard
- [ ] Manual (mobile): swipe to open/close session sidebar
- [ ] Manual (tablet): sidebar shows, no bottom tabs
- [ ] Manual (desktop): full sidebar, no bottom tabs

### Rollback Plan
- `git checkout main -- components/layout/bottom-tab-bar.tsx components/layout/dashboard-shell-client.tsx`
- Bottom tab bar is additive

### Deploy Checkpoint
- `git commit -m "v2-phase-8: mobile experience"`

---

## 12. Phase 9: Polish & Optimization

### Goal
Final polish pass: micro-interactions, loading states, error boundaries, performance optimization, accessibility audit, and visual consistency check.

### Tasks
| # | Task | File(s) | Est. |
|---|------|---------|------|
| 9.1 | Add page transition animations (fade-in on route change) | `app/layout.tsx`, page files | 1h |
| 9.2 | Add hover micro-interactions to cards and buttons | Various component files | 1h |
| 9.3 | Add loading.tsx files to route segments for instant skeleton display | `app/dashboard/loading.tsx`, `app/chat/loading.tsx`, etc. | 1h |
| 9.4 | Add error.tsx boundary to main route segments | `app/dashboard/error.tsx`, `app/chat/error.tsx`, etc. | 1h |
| 9.5 | Audit all pages for hardcoded colors — replace with tokens | All page files | 1h |
| 9.6 | Add `<title>` and meta descriptions to all pages | Page files | 0.5h |
| 9.7 | Run Lighthouse audit, fix any scores below 90 | — | 1h |
| 9.8 | Add 404 and 500 custom error pages | `app/not-found.tsx`, `app/error.tsx` | 0.5h |

### Dependencies
- All previous phases

### Verification Steps
- [ ] `npm run build` passes
- [ ] `vitest run` — all 353 tests pass
- [ ] Lighthouse performance ≥ 90
- [ ] Lighthouse accessibility ≥ 90
- [ ] Manual: page transitions feel smooth
- [ ] Manual: all loading states show skeletons (no spinners)
- [ ] Manual: error boundaries catch and display errors gracefully
- [ ] Manual: custom 404 page shows
- [ ] Manual: no hardcoded `bg-white`, `text-gray-*` anywhere

### Rollback Plan
- `git revert HEAD` for individual changes
- Loading/error pages are additive

### Deploy Checkpoint
- `git commit -m "v2-phase-9: polish & optimization"`
- `git tag v2.0.0`

---

## 13. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Tailwind v4 CSS-based config breaks existing classes | Medium | High | Phase 0 verifies every existing class still works before proceeding |
| shadcn/ui v4 component install conflicts | Low | Medium | Install one at a time, build-test between each |
| Dark mode regression on existing pages | High | Medium | Use design tokens exclusively, never hardcode colors |
| Mobile bottom tabs conflict with sidebar | Medium | Low | Conditional render: bottom tabs on mobile, sidebar on desktop |
| Command Palette accessibility issues | Low | Medium | Use Radix primitives (Dialog), keyboard navigation built-in |
| Performance regression from added components | Low | Medium | Lazy-load Command Palette, skeleton loaders for all data |
| Breaking existing URLs/routes | Low | High | No route changes in this plan — only visual/component changes |
| Merge conflicts with ongoing backend work | Low | Low | Frontend-only changes, no shared files with backend |

---

## 14. Quality Gates

Every phase must pass these gates before being marked complete:

### Build Gate
```bash
npm run build          # Must exit 0
```

### Test Gate
```bash
vitest run             # All 353 tests must pass
```

### Visual Gate
- [ ] Both themes render correctly (dark + light)
- [ ] No hardcoded `bg-white`, `text-gray-*`, or color values outside `globals.css`
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No console errors in browser

### Accessibility Gate
- [ ] All interactive elements have `aria-label` or visible text
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color contrast meets WCAG AA (4.5:1 for text)

### Performance Gate (Phase 9 only)
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 90
- [ ] No layout shift (CLS < 0.1)

---

## 15. Rollback Procedures

### Per-Phase Rollback
Each phase's files are documented above. To rollback a single phase:

```bash
# Option 1: Revert the phase commit
git revert v2-phase-N --no-edit

# Option 2: Restore specific files
git checkout main -- <file-list>

# Option 3: Nuclear — revert to pre-V2
git checkout main
```

### Cross-Phase Rollback
If a later phase reveals a bug in an earlier phase:

1. Identify which phase introduced the bug
2. Revert to the commit before that phase: `git checkout v2-phase-(N-1)`
3. Re-apply the later phases' changes on top

### Emergency Rollback (Production)
```bash
# Revert to last stable commit
git checkout main
npm run build
# Deploy
```

---

## 16. Success Criteria

### Immediate (After All Phases)
- [ ] All 353 backend tests passing
- [ ] Frontend build succeeds
- [ ] No console errors in production
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 90

### Visual Quality
- [ ] Zero hardcoded colors outside `globals.css`
- [ ] Consistent warm-purple 265° brand color throughout
- [ ] Dark mode works on every page
- [ ] No emoji used as visual elements (only in text content where appropriate)
- [ ] Skeleton loaders on every data-fetching page
- [ ] Empty states with helpful copy on every list page

### User Experience
- [ ] Landing page loads in < 2 seconds
- [ ] Chat streaming starts within 1 second of sending
- [ ] Command Palette accessible via Cmd+K on every page
- [ ] Mobile experience is fully functional with bottom tabs
- [ ] All navigation paths work correctly
- [ ] Breadcrumbs on every admin page

### Technical
- [ ] No TypeScript errors
- [ ] All new components use design tokens (not hardcoded values)
- [ ] All new components support both themes
- [ ] All new components are keyboard-accessible
- [ ] Bundle size increase < 20KB gzipped from new components

---

## Appendix A: File Change Map

Summary of files touched per phase:

| Phase | Files Modified | Files Created |
|-------|---------------|---------------|
| 0 | `app/globals.css` | — |
| 1 | `components.json` | `components/ui/empty-state.tsx`, `components/ui/page-header.tsx`, `components/command-palette.tsx`, `components/ui/breadcrumb.tsx`, `components/ui/skeleton-variants.tsx`, `components/ui/status-badge.tsx` |
| 2 | `components/layout/app-sidebar.tsx`, `components/layout/top-nav.tsx`, `components/layout/dashboard-shell-client.tsx` | — |
| 3 | `app/page.tsx` | — |
| 4 | `components/chat/chat-window.tsx`, `components/chat/message-bubble.tsx` | `components/chat/citation-panel.tsx`, `components/chat/feedback-buttons.tsx`, `components/chat/empty-state.tsx` |
| 5 | `app/dashboard/page.tsx`, `components/dashboard/stat-card.tsx`, `components/dashboard/usage-chart.tsx`, `components/dashboard/recent-chats.tsx` | — |
| 6 | Document list page, upload page, `components/documents/document-list.tsx` | — |
| 7 | `app/(admin)/settings/page.tsx`, `components/settings/ai-settings-form.tsx` | — |
| 8 | `components/layout/dashboard-shell-client.tsx`, `components/chat/session-sidebar.tsx` | `components/layout/bottom-tab-bar.tsx` |
| 9 | Various, `app/layout.tsx` | `app/not-found.tsx`, `app/error.tsx`, `app/dashboard/loading.tsx`, `app/chat/loading.tsx` |

## Appendix B: Git Tag Reference

| Tag | Phase | Description |
|-----|-------|-------------|
| `v2-phase-0` | 0 | Design token foundation |
| `v2-phase-1` | 1 | Core component library |
| `v2-phase-2` | 2 | Navigation rearchitecture |
| `v2-phase-3` | 3 | Landing page redesign |
| `v2-phase-4` | 4 | Chat experience v2 |
| `v2-phase-5` | 5 | Dashboard redesign |
| `v2-phase-6` | 6 | Documents & upload |
| `v2-phase-7` | 7 | Settings consolidation |
| `v2-phase-8` | 8 | Mobile experience |
| `v2-phase-9` | 9 | Polish & optimization |
| `v2.0.0` | — | V2 Release |

---

> **Next action:** Begin Phase 0 — update `app/globals.css` with V2 design tokens.
