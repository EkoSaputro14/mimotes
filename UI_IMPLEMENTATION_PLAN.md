# UI_IMPLEMENTATION_PLAN.md — Production UI Plan

> Date: 2026-06-10
> Phase: UI-REVAMP — Step 7

---

## Implementation Priorities

### P0 — Critical UX Improvements (Week 1-2)

| Task | Pages Affected | Components | Effort |
|------|---------------|------------|--------|
| **Add brand color (indigo)** | All | globals.css, tailwind config | 2h |
| **Fix dark mode** (toaster, markdown, scrollbar) | All | globals.css, layout.tsx | 4h |
| **Add dark mode toggle** | TopNav | theme-toggle.tsx (new) | 2h |
| **Simplify sidebar** (remove collapsible sections) | Layout | app-sidebar.tsx | 4h |
| **Promote Upload** to top-level nav | Layout | app-sidebar.tsx | 1h |
| **Add semantic colors** (success/warning/error) | All | globals.css | 2h |
| **Fix chart colors** (indigo palette) | Dashboard | usage-chart.tsx, all charts | 3h |
| **Add loading coordination** | Dashboard | dashboard-skeleton.tsx (new) | 4h |
| **Redesign KPI cards** | Dashboard | stat-card.tsx | 3h |
| **Add document health indicators** | Documents | document-list.tsx | 3h |

**P0 Total: ~28h (3.5 days)**

### P1 — High Impact SaaS Improvements (Week 3-4)

| Task | Pages Affected | Components | Effort |
|------|---------------|------------|--------|
| **Unified Analytics page** (tabs) | Analytics | analytics-page.tsx (new) | 8h |
| **Unified Settings page** (tabs) | Settings | settings-page.tsx (new) | 8h |
| **Source citations in chat** | Chat | source-citation.tsx (new) | 6h |
| **Retrieval insights panel** | Chat | retrieval-insights.tsx (new) | 4h |
| **Mobile bottom tab bar** | Layout | mobile-tab-bar.tsx (new) | 6h |
| **Drag-and-drop upload** | Upload | upload-zone.tsx (new) | 4h |
| **Upload progress pipeline** | Upload | processing-pipeline.tsx (new) | 4h |
| **Session history sidebar** | Chat | session-sidebar.tsx (enhanced) | 4h |
| **Search page** (standalone) | Search | search-page.tsx (new) | 4h |
| **Document detail with chunks** | Documents | document-detail.tsx (new) | 6h |

**P1 Total: ~54h (6.75 days)**

### P2 — Nice-to-Have Polish (Week 5-6)

| Task | Pages Affected | Components | Effort |
|------|---------------|------------|--------|
| **Onboarding wizard** | Dashboard | onboarding-wizard.tsx (new) | 8h |
| **Command palette** (Cmd+K) | All | command-palette.tsx (new) | 6h |
| **Keyboard shortcuts** | All | shortcuts-provider.tsx (new) | 4h |
| **Confidence indicators** | Chat | confidence-badge.tsx (new) | 2h |
| **Activity feed** | Dashboard | activity-feed.tsx (new) | 4h |
| **Quick actions grid** | Dashboard | quick-actions.tsx (new) | 3h |
| **Empty state illustrations** | All | empty-state.tsx (new) | 4h |
| **Tooltip system** | All | tooltip-provider.tsx (new) | 2h |
| **Skeleton loading states** | All | skeleton.tsx (enhanced) | 3h |
| **Responsive tablet layout** | Layout | dashboard-shell.tsx | 4h |

**P2 Total: ~40h (5 days)**

---

## Component Inventory

### New Components (P0)

| Component | Purpose | Dependencies |
|-----------|---------|-------------|
| `theme-toggle.tsx` | Dark/light mode switch | next-themes |
| `document-health-badge.tsx` | Status indicator for docs | — |
| `dashboard-skeleton.tsx` | Coordinated loading state | Skeleton |
| `kpi-card-redesign.tsx` | Improved stat cards | Card, Badge |
| `activity-indicator.tsx` | Colored dot for status | — |

### New Components (P1)

| Component | Purpose | Dependencies |
|-----------|---------|-------------|
| `source-citation.tsx` | Chat source display | Card, Badge |
| `retrieval-insights.tsx` | Search details panel | Card, Progress |
| `mobile-tab-bar.tsx` | Bottom navigation (mobile) | Button |
| `upload-zone.tsx` | Drag-and-drop upload area | — |
| `processing-pipeline.tsx` | Upload progress display | Progress |
| `session-list.tsx` | Chat session sidebar | Button |
| `search-page.tsx` | Standalone search interface | Input, Button |
| `document-detail.tsx` | Document with chunks view | Card, Tabs |
| `analytics-tabs.tsx` | Unified analytics page | Tabs |
| `settings-tabs.tsx` | Unified settings page | Tabs |

### New Components (P2)

| Component | Purpose | Dependencies |
|-----------|---------|-------------|
| `onboarding-wizard.tsx` | First-time user guide | Dialog, Button |
| `command-palette.tsx` | Cmd+K search/actions | Dialog, Input |
| `shortcuts-provider.tsx` | Keyboard shortcut handler | — |
| `confidence-badge.tsx` | Chat confidence display | Badge |
| `activity-feed.tsx` | Recent activity list | — |
| `quick-actions.tsx` | Dashboard action grid | Button |
| `empty-state.tsx` | Empty state illustrations | — |

---

## Pages Affected

| Page | P0 Changes | P1 Changes | P2 Changes |
|------|-----------|-----------|-----------|
| Dashboard | KPI redesign, charts, loading | Activity feed, quick actions | Onboarding, command palette |
| Chat | — | Source citations, retrieval insights | Confidence, shortcuts |
| Documents | Health indicators | Detail view, drag-drop upload | Empty states |
| Analytics | — | Unified tabs page | — |
| Settings | — | Unified tabs page | — |
| Navigation | Sidebar simplification | Mobile tab bar | Command palette |
| All | Brand colors, dark mode, semantic colors | — | Skeletons, tooltips |

---

## Effort Summary

| Priority | Effort | Duration | Impact |
|----------|--------|----------|--------|
| **P0** | 28h | 3.5 days | Critical — makes app usable |
| **P1** | 54h | 6.75 days | High — SaaS-grade features |
| **P2** | 40h | 5 days | Polish — delightful experience |
| **Total** | 122h | ~15 days | Production-ready UI |

---

## Technology Recommendations

| Area | Current | Recommended |
|------|---------|-------------|
| Colors | oklch gray-only | oklch + indigo brand + semantic |
| Typography | System font only | Plus Jakarta Sans (headings) + Inter (body) |
| Charts | Recharts with gray | Recharts with indigo palette |
| Dark Mode | Broken | next-themes (fixed) |
| Mobile | Hamburger only | Bottom tab bar |
| Loading | Independent skeletons | Coordinated skeleton system |
| Upload | Basic form | Drag-and-drop with progress pipeline |

---

*Generated by Hermes Agent — Phase UI-REVAMP Step 7*
