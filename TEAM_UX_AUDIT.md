# Team Management UX Audit — MimoNotes

**Date:** June 14, 2026
**Auditor:** Senior Frontend Architect + UX Engineer
**Scope:** Workspace switching, invitations, members, roles, onboarding, mobile, accessibility
**Status:** Read-only audit — no code changes

---

## Current Score: 4.8 / 10

The team management system is functional (workspace switching, member CRUD, role hierarchy, invitation flow) but feels like a developer prototype. Hardcoded colors, no onboarding, no workspace lifecycle management, and poor mobile experience. The RBAC system is solid but the UI doesn't communicate it well.

---

## 1. Workspace Switching

### Score: 5/10

**Issues:**
1. **Full page reload on switch** — `window.location.reload()` causes flash, loses scroll position, feels jarring
2. **No "Create Workspace" button** — Users can't create new workspaces from the switcher
3. **No workspace settings in dropdown** — Only "Manage workspace in Settings → Workspace" text, no direct link
4. **No workspace icon/avatar** — All workspaces show generic Building2 icon
5. **No workspace description** — Can't add context to workspace purpose
6. **Settings page is just switcher + members** — No workspace name editing, no delete, no transfer

**Comparison:**
- **Notion**: Workspace switcher with icon, "Create workspace" option, recent pages per workspace
- **Slack**: Workspace switcher with icon, "Add workspace" option, unread counts per workspace
- **Linear**: Team switcher in sidebar, keyboard shortcut (Cmd+K), no page reload
- **GitHub**: Organization switcher with avatar, "New organization" option, pending invites count

---

## 2. Team Invitations

### Score: 5/10

**Issues:**
7. **Two confusing invitation methods** — "Tambah Anggota" (direct add) AND "Undang via Token" (token link) — users don't know which to use
8. **Token is raw hash** — 64-character hex string, not a friendly invite link
9. **No email sending confirmation** — Toast says "Undangan terkirim" but Resend domain isn't verified, so no email actually sends
10. **No bulk invite** — Can only invite one person at a time
11. **No invite by shareable link** — Must copy-paste token manually
12. **No invitation preview** — Can't see what the invitee will see before sending

**Comparison:**
- **Notion**: "Invite by email" with autocomplete, "Copy invite link", bulk invite, shows preview
- **Linear**: "Invite members" modal with email list, role selector, "Copy link" option
- **Slack**: "Invite people" with email or link, shows workspace preview to invitee
- **GitHub**: "Invite a collaborator" with email, role (read/write/admin), pending invites list

---

## 3. Members Management

### Score: 5/10

**Issues:**
13. **No member search/filter** — Can't find specific members in large teams
14. **No member profile** — Can't see member's activity, documents, or chat history
15. **No "Leave Workspace" option** — Members can't remove themselves
16. **No role description tooltips** — Users don't know what each role can do
17. **No last active timestamp** — Can't see when members were last online
18. **No bulk member actions** — Can't select multiple members for role change or removal

**Comparison:**
- **Notion**: Member list with search, role descriptions, "Remove" with confirmation, activity indicators
- **Linear**: Member list with role badges, last active time, "Remove" with confirmation dialog
- **Slack**: Member list with status, role badges, "Deactivate" option, member profiles
- **GitHub**: Collaborators list with permission levels, last active, "Remove" with confirmation

---

## 4. Roles & Permissions

### Score: 6/10

**Issues:**
19. **No permission matrix UI** — Users must guess what each role can do
20. **Role descriptions only in invite dialog** — Not shown elsewhere (member list, settings)
21. **No custom roles** — Locked to 4 predefined roles
22. **Owner role is invisible** — Only shown as badge, no special UI treatment

**Comparison:**
- **Notion**: Role descriptions on hover, custom roles in Enterprise, clear permission matrix
- **Linear**: Role badges with tooltips, permission descriptions in settings
- **Slack**: Custom roles in Enterprise, permission matrix in admin settings
- **GitHub**: Granular permissions (read/write/admin/owner), custom roles in Enterprise

---

## 5. Onboarding

### Score: 2/10

**Issues:**
23. **No workspace creation wizard** — No guided setup for new workspaces
24. **No team invitation prompt** — After creating workspace, no nudge to invite team
25. **No role explanation during onboarding** — New members don't know what they can do
26. **No welcome flow for invited members** — Token accept → redirect to dashboard, no guidance
27. **No sample data** — New workspace is empty, no demo documents or chat

**Comparison:**
- **Notion**: Workspace setup wizard, sample pages, team invite prompt, role explanation
- **Slack**: Channel creation wizard, team invite prompt, onboarding tour
- **Linear**: Project creation wizard, team invite prompt, keyboard shortcut tour
- **GitHub**: Organization setup, repo creation, team invite, onboarding checklist

---

## 6. Empty States

### Score: 3/10

**Issues:**
28. **No empty state for members** — Just shows empty table (no "Invite your first member" CTA)
29. **No empty state for invitations** — Just "Belum ada undangan" with icon, no guidance
30. **No empty state for workspaces** — Switcher returns null when no workspaces
31. **No illustration or guidance** — All empty states are text-only

**Comparison:**
- **Notion**: Empty member list with "Invite teammates" CTA and illustration
- **Slack**: Empty channel with "Invite people" CTA and onboarding tips
- **Linear**: Empty team with "Invite members" CTA and role explanation

---

## 7. Mobile UX

### Score: 3/10

**Issues:**
32. **Workspace switcher dropdown on mobile** — Full-width dropdown is awkward on small screens
33. **Member table overflows on mobile** — Horizontal scroll, hidden columns
34. **No bottom sheet for member actions** — Must use tiny icons
35. **Invite dialog not optimized** — Form inputs are small, role radio buttons are cramped
36. **No swipe actions** — Can't swipe to remove member or revoke invitation

**Comparison:**
- **Notion**: Mobile-optimized member list, bottom sheet for actions
- **Slack**: Mobile workspace switcher, member list with swipe actions
- **Linear**: Mobile-first team management, bottom sheet for role changes

---

## 8. Accessibility

### Score: 3/10

**Issues:**
37. **No skip-to-content** — Team management pages have no skip links
38. **No aria-live for role changes** — Screen readers don't announce when role is changed
39. **Hardcoded `confirm()`** — Not accessible, not styled, blocks UI
40. **No keyboard navigation for member list** — Can't arrow through rows
41. **No focus indicators on role dropdowns** — `appearance-none` removes native styling
42. **Tab navigation not keyboard-accessible** — Members/Invitations tabs use click handlers only

---

## 9. Visual Design Issues

### Score: 4/10

**Issues:**
43. **Hardcoded `bg-white` and `text-gray-*`** — Not using design tokens (v2 warm-purple system)
44. **Inconsistent button styles** — Mix of blue-600 (workspace page) and primary (sidebar)
45. **No consistent card/container system** — Some use `bg-white rounded-xl border`, others use `bg-card`
46. **Role badges use hardcoded colors** — purple/blue/green/gray instead of design tokens
47. **No consistent empty state pattern** — Different styling across components

---

## 10. Competitive Comparison

| Dimension | MimoNotes | Notion | Linear | Slack | GitHub |
|-----------|-----------|--------|--------|-------|--------|
| **Workspace switching** | Dropdown, reload | Dropdown, no reload | Cmd+K, no reload | Dropdown, no reload | Dropdown, no reload |
| **Create workspace** | ❌ None | ✅ Wizard | ✅ Simple | ✅ Simple | ✅ Wizard |
| **Workspace settings** | ❌ Name only | ✅ Full settings | ✅ Full settings | ✅ Full settings | ✅ Full settings |
| **Invite methods** | Token + direct add | Email + link | Email + link | Email + link | Email + link |
| **Bulk invite** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Role system** | 4 roles, no custom | Custom (Enterprise) | 3 roles | Custom (Enterprise) | Granular permissions |
| **Permission UI** | ❌ Hidden | ✅ Matrix | ✅ Descriptions | ✅ Matrix | ✅ Matrix |
| **Member search** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Member activity** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Mobile UX** | Poor | Good | Good | Good | Good |
| **Accessibility** | Low | Medium | High | Medium | High |
| **Score** | 4.8/10 | 8.5/10 | 8.0/10 | 8.0/10 | 8.5/10 |

---

## 11. Top 20 UX Issues (Ranked by Impact)

| # | Issue | Severity | Category | Effort |
|---|-------|----------|----------|--------|
| 1 | No "Create Workspace" option | Critical | Workspace | Quick win |
| 2 | Full page reload on workspace switch | High | Workspace | Quick win |
| 3 | No workspace rename/delete/settings | High | Workspace | Medium |
| 4 | No permission matrix UI | High | Roles | Medium |
| 5 | Hardcoded colors (not design tokens) | High | Visual | Quick win |
| 6 | No onboarding for new workspace | High | Onboarding | Full redesign |
| 7 | Two confusing invite methods | Medium | Invitations | Medium |
| 8 | No skip-to-content on team pages | Medium | Accessibility | Quick win |
| 9 | `confirm()` for delete actions | Medium | Accessibility | Quick win |
| 10 | No member search/filter | Medium | Members | Quick win |
| 11 | No "Leave Workspace" option | Medium | Members | Quick win |
| 12 | No role description tooltips | Medium | Roles | Quick win |
| 13 | No empty state for members | Medium | Empty states | Quick win |
| 14 | Member table overflows on mobile | Medium | Mobile | Medium |
| 15 | No invite by shareable link | Medium | Invitations | Medium |
| 16 | Token is raw hash (not friendly) | Low | Invitations | Medium |
| 17 | No bulk member actions | Low | Members | Medium |
| 18 | No member activity/last active | Low | Members | Full redesign |
| 19 | No workspace avatar/icon | Low | Workspace | Medium |
| 20 | No invitation preview | Low | Invitations | Full redesign |

---

## 12. Quick Wins (< 1 hour each)

1. **Add "Create Workspace" button** to workspace switcher dropdown
2. **Fix workspace switch** — use `router.refresh()` instead of `window.location.reload()`
3. **Add skip-to-content** to workspace settings page
4. **Replace `confirm()` with styled dialog** for delete/remove actions
5. **Add role description tooltips** on hover over role badges
6. **Add "Leave Workspace" button** for non-owner members
7. **Add member search input** above member table
8. **Fix empty states** — add CTA buttons and guidance text
9. **Replace hardcoded colors** with design tokens (bg-card, text-foreground, etc.)
10. **Add aria-live** for role change and member removal feedback

---

## 13. Medium Wins (< 1 day each)

1. **Add workspace settings** — name editing, description, delete/transfer
2. **Add permission matrix UI** — show what each role can do
3. **Add member filter** — by role, by status
4. **Add invite by shareable link** — generate link instead of raw token
5. **Add bulk invite** — paste multiple emails
6. **Mobile-optimized member list** — card layout, bottom sheet actions
7. **Add workspace avatar/icon** — upload or emoji picker
8. **Add role change confirmation dialog** — styled, accessible
9. **Add member last active timestamp** — track and display
10. **Add invitation count badge** in sidebar

---

## 14. Full Redesign Opportunities

1. **Workspace creation wizard** — guided setup with name, description, team invite
2. **Member profile pages** — activity, documents, chat history
3. **Custom roles** — define custom permission sets
4. **Workspace activity log** — who did what, when
5. **Invitation email templates** — customizable, branded
6. **Workspace analytics** — member activity, document usage, chat metrics
7. **SSO/SAML integration** — enterprise authentication
8. **Workspace templates** — pre-configured workspace with sample data
9. **Multi-workspace dashboard** — overview of all workspaces
10. **Workspace transfer workflow** — ownership transfer with confirmation

---

## 15. Screens Requiring Redesign

| Screen | Current State | Required Change |
|--------|--------------|-----------------|
| Workspace switcher | Dropdown with reload | Dropdown with SPA navigation + create |
| Workspace settings | Switcher + members only | Full settings (name, description, delete, transfer) |
| Member list | Table with hardcoded colors | Design token table with search, filter, activity |
| Invite dialog | Two methods, confusing | Single unified flow with email + link |
| Invitation list | Basic list with filter | Enhanced with preview, bulk actions |
| Role management | Dropdown only | Permission matrix, tooltips, descriptions |
| Mobile layout | Overflow table | Card list with bottom sheet |
| Empty states | Text only | Illustration + CTA + guidance |

---

## Summary

| Dimension | Score | Key Fix |
|-----------|-------|---------|
| Workspace switching | 5/10 | Fix reload, add create workspace |
| Team invitations | 5/10 | Unify invite methods, add shareable link |
| Members management | 5/10 | Add search, leave workspace, activity |
| Roles & permissions | 6/10 | Add permission matrix UI |
| Onboarding | 2/10 | Add workspace creation wizard |
| Empty states | 3/10 | Add CTAs and guidance |
| Mobile UX | 3/10 | Card layout, bottom sheet |
| Accessibility | 3/10 | Skip links, aria-live, styled dialogs |
| Visual design | 4/10 | Replace hardcoded colors with tokens |
| **Overall** | **4.8/10** | |

**Highest ROI fixes:** Create workspace button + fix reload + permission tooltips + skip-to-content + styled dialogs → immediately raises score to ~6.5/10.
