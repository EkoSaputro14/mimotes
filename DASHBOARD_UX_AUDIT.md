# Dashboard UX Audit — MimoNotes

**Date:** June 14, 2026  
**Auditor:** Senior Frontend Architect + UX Engineer  
**Scope:** `app/dashboard/page.tsx` + 10 dashboard components  
**Status:** Read-only audit — no code changes

---

## Current Score: 4.2 / 10

The dashboard is functional but feels like a developer dashboard, not a product dashboard. It surfaces raw metrics without context, lacks personalization, and misses the opportunity to guide users toward value.

---

## 1. Visual Hierarchy

### Score: 4/10

**Issues:**
1. **Flat hierarchy** — All 4 stat cards have identical visual weight. No primary metric stands out.
2. **No hero metric** — "Documents" is first but not most important. Chat sessions or active documents should dominate.
3. **Quick Actions compete with stats** — 3×2 grid of actions at same visual level as data cards.
4. **No visual anchoring** — No large number, no sparkline, no trend chart to draw the eye.
5. **Color is decorative, not functional** — Icons use `bg-primary/10` uniformly. No color coding for status (red = alert, green = healthy).

**Comparison:**
- **Notion**: Large workspace name + recent pages list. Visual hierarchy: Title > Recent > Quick actions.
- **Linear**: Issue count + cycle progress as hero metrics. Everything else secondary.
- **Claude Projects**: Project name + conversation count + "New conversation" CTA as clear primary action.

---

## 2. Information Density

### Score: 3/10

**Issues:**
6. **Underutilized space** — 60% of the page is Quick Actions (6 links). Only 40% shows actual data.
7. **Missing components** — `RecentChats`, `TopDocuments`, `UsageChart`, `CostSummary` all exist but aren't rendered on the main dashboard.
8. **No data density** — Stat cards show single numbers. No sparklines, no mini-charts, no trend arrows with context.
9. **Activity Feed is thin** — Only 3 event types (upload, chat, settings). No message previews, no document snippets.
10. **System Health is redundant** — Already visible in the health endpoint. Users don't need to see "All systems operational" unless something is wrong.

**Comparison:**
- **Notion**: 10+ recent pages, search bar, template gallery, team members — all above the fold.
- **Linear**: Cycle progress, issue counts by status, team workload, recent activity — dense but scannable.
- **Claude Projects**: Project list with document count, conversation count, last active — compact and actionable.

---

## 3. Empty States

### Score: 3/10

**Issues:**
11. **Generic empty text** — "No recent activity yet. Upload a document or start a chat to get started." No illustration, no urgency.
12. **No onboarding flow** — New users see 4 stat cards at "0" with no guidance on what to do first.
13. **No setup checklist** — No "Upload your first document" → "Start a chat" → "Check analytics" progression.
14. **Quick Actions don't adapt** — Same 6 actions whether user has 0 documents or 100.

**Comparison:**
- **Notion**: Empty state shows template gallery, "Get started" checklist, sample workspace.
- **Linear**: Empty state shows "Create your first issue" with keyboard shortcut hint.
- **Claude Projects**: Empty state shows "Create a project" with example use cases.

---

## 4. Quick Actions

### Score: 4/10

**Issues:**
15. **Non-user-centric labels** — "Manage API" and "Optimization" are developer terms. Users think "Settings" and "Improve search quality."
16. **No keyboard shortcuts** — Actions are plain links. No Cmd+K integration shown.
17. **No contextual actions** — "Upload File" is always shown even if user just uploaded. No "Continue last chat" or "Resume document processing."
18. **No visual differentiation** — All 6 cards look identical. No primary action highlighted.

**Current Actions:**
| Label | Issue |
|-------|-------|
| New Chat | ✅ Good — primary action |
| Upload File | ✅ Good — core workflow |
| Manage API | ❌ Developer term |
| Optimization | ❌ Jargon |
| Connect Apps | ⚠️ Vague |
| Reports | ⚠️ Generic |

---

## 5. Recent Activity

### Score: 4/10

**Issues:**
19. **Only 3 event types** — document_upload, chat_session, settings_change. Missing: document processed, chat message, error, team member joined.
20. **No content preview** — Shows "Document uploaded" but not which document. Shows "Chat started" but not what was asked.
21. **Static relative time** — "5m ago" doesn't update. Stale after page load.
22. **No actionable items** — Activity is read-only. Can't click to continue a chat or view a document.
23. **Missing "Recent Chats"** — The `RecentChats` component exists but isn't on the main dashboard.

---

## 6. Workspace Awareness

### Score: 2/10

**Issues:**
24. **No workspace name** — Dashboard title is just "Dashboard". No "Marketing Team's Dashboard" or "Personal Workspace."
25. **No team visibility** — No "3 team members" or "Last active: John 2h ago."
26. **No workspace stats** — No documents per workspace, no chat sessions per workspace.
27. **No workspace switcher context** — The `WorkspaceSwitcher` exists in sidebar but dashboard doesn't reflect which workspace is active.

---

## 7. Mobile Responsiveness

### Score: 5/10

**Issues:**
28. **Stat cards stack vertically** — 4 cards become a tall column. No horizontal scroll or 2×2 grid.
29. **Quick Actions 2-col on mobile** — 6 items in 2 columns = 3 rows. Takes too much vertical space.
30. **No mobile-specific actions** — No swipe gestures, no bottom sheet for quick actions.
31. **System Health hidden on mobile** — Below the fold, users may never see it.

---

## 8. Accessibility

### Score: 4/10

**Issues:**
32. **No skip-to-content** — Dashboard shell has no skip link (fixed in Sprint D3 for chat, not dashboard).
33. **No aria-live for stats** — When stats load, screen readers don't announce the update.
34. **No keyboard navigation for cards** — Cards are `<div>` not `<button>` or `<a>`. Can't tab to them.
35. **No focus indicators** — Cards have `hover:bg-accent/50` but no `focus-visible:ring`.
36. **Color-only status** — Health status uses color (green/red) without text alternative.

---

## 9. Competitive Comparison

| Dimension | MimoNotes | Notion | Linear | Claude Projects |
|-----------|-----------|--------|--------|-----------------|
| **Hero metric** | None | Workspace name | Cycle progress | Project name |
| **Personalization** | None | "Welcome back" | User avatar + name | "Your projects" |
| **Onboarding** | None | Template gallery | Setup checklist | Example projects |
| **Data density** | Low (4 stats) | High (10+ items) | High (multiple panels) | Medium (list view) |
| **Quick actions** | 6 generic | Contextual | Cmd+K focused | "New conversation" |
| **Recent activity** | 3 types | Pages + mentions | Issues + PRs | Conversations |
| **Workspace context** | None | Team name + members | Team + cycle | Project + documents |
| **Empty state** | Text only | Templates + checklist | Create first issue | Example projects |
| **Mobile** | Basic stacking | Responsive grid | Bottom nav | Responsive list |
| **Score** | 4.2/10 | 8.5/10 | 8.0/10 | 7.5/10 |

---

## 10. Top 20 UX Issues (Ranked by Impact)

| # | Issue | Severity | Category | Effort |
|---|-------|----------|----------|--------|
| 1 | No personalized greeting or workspace context | High | Personalization | Quick win |
| 2 | Missing RecentChats on main dashboard | High | Information density | Quick win |
| 3 | Missing TopDocuments on main dashboard | High | Information density | Quick win |
| 4 | No onboarding/setup checklist for new users | High | Empty states | Medium |
| 5 | Quick Actions use developer jargon | High | Copy | Quick win |
| 6 | No hero metric or primary stat | Medium | Visual hierarchy | Medium |
| 7 | Activity Feed lacks content previews | Medium | Recent activity | Medium |
| 8 | Stat cards show numbers without context | Medium | Visual hierarchy | Medium |
| 9 | System Health always visible (not just errors) | Medium | Information density | Quick win |
| 10 | No skip-to-content in dashboard shell | Medium | Accessibility | Quick win |
| 11 | No aria-live for loading stats | Medium | Accessibility | Quick win |
| 12 | Quick Actions don't adapt to user state | Medium | Personalization | Medium |
| 13 | No sparklines or mini-charts in stat cards | Low | Visual hierarchy | Medium |
| 14 | Activity Feed relative time is static | Low | Recent activity | Quick win |
| 15 | Mobile stat cards stack vertically (too tall) | Low | Mobile | Medium |
| 16 | No keyboard shortcuts for quick actions | Low | Accessibility | Medium |
| 17 | No workspace member visibility | Low | Workspace | Medium |
| 18 | No UsageChart on main dashboard | Low | Information density | Quick win |
| 19 | No CostSummary on main dashboard | Low | Information density | Quick win |
| 20 | No notification center | Low | Product | Full redesign |

---

## 11. Quick Wins (< 1 hour each)

1. **Add personalized greeting** — "Selamat datang kembali, [Name]" at top of dashboard
2. **Add RecentChats component** — Already exists, just import and render
3. **Add TopDocuments component** — Already exists, just import and render
4. **Fix Quick Action labels** — "Manage API" → "Pengaturan API", "Optimization" → "Tingkatkan Kualitas Pencarian"
5. **Add skip-to-content** — Same pattern as Sprint D3 chat fix
6. **Add aria-live to stat cards** — Announce when stats load
7. **Make System Health conditional** — Only show when status ≠ "ok"
8. **Add UsageChart** — Already exists, just import and render

---

## 12. Medium Wins (< 1 day each)

1. **Redesign stat cards with sparklines** — Add mini trend charts inside each card
2. **Add onboarding checklist** — "Setup progress: Upload doc ✓ → Start chat ✓ → Check analytics ○"
3. **Add workspace context** — Show workspace name, member count, active users
4. **Improve Activity Feed** — Add document previews, chat message snippets, error events
5. **Contextual Quick Actions** — Show "Continue last chat" if recent session exists
6. **Mobile optimization** — 2×2 stat grid, collapsible quick actions, bottom sheet

---

## 13. Full Redesign Opportunities

1. **Command-first dashboard** — Like Linear: everything accessible via Cmd+K, dashboard is just a landing pad
2. **Activity-centric layout** — Like Notion: recent pages/chats dominate, stats are secondary
3. **Project-centric layout** — Like Claude Projects: workspace → documents → conversations flow
4. **Dashboard tabs** — Overview | Activity | Analytics | Settings (like Linear's cycles/views)
5. **Draggable widgets** — Let users customize which cards appear and in what order
6. **Real-time updates** — WebSocket for live activity feed, live stat updates
7. **AI-powered insights** — "Your most active document this week: [X]" or "Chat sessions up 30% from last week"

---

## 14. Screens Requiring Redesign

| Screen | Current State | Required Change |
|--------|--------------|-----------------|
| Dashboard main | 4 stats + 6 quick actions + activity | Hero metric + personalized greeting + recent chats + top docs |
| Stat cards | Single numbers | Numbers + sparklines + trend context |
| Quick Actions | 6 generic links | Contextual actions + keyboard shortcuts |
| Activity Feed | 3 event types, no previews | Rich events with content previews |
| Empty states | Text only | Illustrations + onboarding checklist |
| System Health | Always visible | Conditional (only when issues) |
| Mobile | Basic stacking | Optimized grid + bottom sheet |

---

## Summary

| Dimension | Score | Key Fix |
|-----------|-------|---------|
| Visual hierarchy | 4/10 | Add hero metric + personalized greeting |
| Information density | 3/10 | Add RecentChats + TopDocuments + UsageChart |
| Empty states | 3/10 | Add onboarding checklist |
| Quick actions | 4/10 | Fix labels + add contextual actions |
| Recent activity | 4/10 | Add content previews + more event types |
| Workspace awareness | 2/10 | Add workspace name + member count |
| Mobile responsiveness | 5/10 | Optimize stat grid + quick actions |
| Accessibility | 4/10 | Add skip-to-content + aria-live |
| **Overall** | **4.2/10** | |

**Highest ROI fixes:** Add personalized greeting + RecentChats + TopDocuments (3 quick wins that immediately raise the score to ~6.5/10).
