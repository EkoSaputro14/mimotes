# Team Management V2 Specification — MimoNotes

**Date:** June 14, 2026
**Status:** Design spec — no implementation
**Based on:** TEAM_UX_AUDIT.md (score 4.8/10)
**Target score:** 7.5/10

---

## Design Principles

1. **Single source of truth** — One invitation flow, one member list, one role system
2. **Progressive disclosure** — Overview → Details → Actions
3. **Accessible first** — Keyboard navigation, aria-live, styled dialogs
4. **Mobile-first** — Card layout on mobile, table on desktop
5. **Design tokens** — Use V2 warm-purple system, no hardcoded colors

---

## V2 Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar                                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [WorkspaceSwitcher]          [Create Workspace +]   │ │
│ │ ▼ My Workspace (Owner)                               │ │
│ │   ├─ Work Team (Admin)                               │ │
│ │   └─ + Create New Workspace                          │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Workspace Settings                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [General] [Members] [Roles] [Activity] [Danger Zone]│ │
│ ├─────────────────────────────────────────────────────┤ │
│ │                                                     │ │
│ │ General:                                            │ │
│ │ ├─ Workspace Name (editable)                        │ │
│ │ ├─ Description (editable)                           │ │
│ │ ├─ Icon/Avatar (upload or emoji)                    │ │
│ │ └─ Slug (read-only)                                 │ │
│ │                                                     │ │
│ │ Members:                                            │ │
│ │ ├─ Search + Filter (by role)                        │ │
│ │ ├─ Member Table (avatar, name, role, last active)   │ │
│ │ ├─ [Invite Member] button                           │ │
│ │ └─ Bulk actions (select, change role, remove)       │ │
│ │                                                     │ │
│ │ Roles:                                              │ │
│ │ ├─ Permission matrix (grid of checkboxes)           │ │
│ │ ├─ Role descriptions                                │ │
│ │ └─ Custom roles (Enterprise)                        │ │
│ │                                                     │ │
│ │ Activity:                                           │ │
│ │ ├─ Recent actions (who did what, when)              │ │
│ │ └─ Filter by member, action type                    │ │
│ │                                                     │ │
│ │ Danger Zone:                                        │ │
│ │ ├─ Transfer Ownership                               │ │
│ │ ├─ Delete Workspace                                 │ │
│ │ └─ Leave Workspace                                  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Workspace Switcher (ENHANCED)

**Changes from V1:**
- Add "Create Workspace" button at bottom of dropdown
- Use `router.refresh()` instead of `window.location.reload()`
- Add workspace icon (emoji or uploaded image)
- Add workspace description on hover
- Show pending invitation count badge

**Layout:**
```
┌──────────────────────────────────────┐
│ ▼ My Workspace (Owner)     3 👤     │
├──────────────────────────────────────┤
│ ✓ My Workspace          Owner   3 👤 │
│   Work Team             Admin   5 👤 │
│   Personal              Owner   1 👤 │
├──────────────────────────────────────┤
│ + Create New Workspace               │
│ Manage in Settings →                 │
└──────────────────────────────────────┘
```

### 2. Workspace Settings (NEW — Tabbed)

**General Tab:**
- Workspace name: editable input with save button
- Description: textarea, 200 char limit
- Icon: emoji picker or image upload
- Slug: read-only, displayed for reference

**Members Tab:**
- Search input (filter by name/email)
- Filter dropdown (by role: All, Owner, Admin, Editor, Viewer)
- Member table: Avatar | Name + Email | Role (dropdown) | Last Active | Actions
- "Invite Member" button → opens InviteDialog
- Bulk actions bar: select all, change role, remove

**Roles Tab:**
- Permission matrix grid
- Rows: permissions (document:create, member:invite, etc.)
- Columns: roles (Owner, Admin, Editor, Viewer)
- Checkmarks show which role has which permission
- Role descriptions below the matrix

**Activity Tab:**
- Recent actions list: "User X changed role of User Y" | "User Z invited User W"
- Filter by member, action type
- Pagination

**Danger Zone:**
- Transfer Ownership: confirmation dialog with email verification
- Leave Workspace: confirmation dialog (non-owners only)
- Delete Workspace: confirmation dialog with name typing (owner only)

### 3. Invite Dialog (UNIFIED)

**Before:** Two methods (direct add + token) — confusing
**After:** Single unified flow

**Layout:**
```
┌──────────────────────────────────────┐
│ 📧 Invite Members                    │
│                                      │
│ Email addresses                      │
│ ┌──────────────────────────────────┐ │
│ │ email1@example.com               │ │
│ │ email2@example.com               │ │
│ └──────────────────────────────────┘ │
│ Paste multiple emails (one per line) │
│                                      │
│ Role                                 │
│ ○ Admin — Manage members & settings  │
│ ○ Editor — Create & edit documents   │
│ ● Viewer — View & chat (default)     │
│                                      │
│ ☐ Send email invitation              │
│                                      │
│ [Cancel]              [Send Invites] │
└──────────────────────────────────────┘
```

**After sending:**
```
┌──────────────────────────────────────┐
│ ✅ Invites Sent                      │
│                                      │
│ 2 invitations sent successfully     │
│                                      │
│ 🔗 Copy Invite Link                  │
│ https://mimotes.ekohomelab.online    │
│   /invite/abc123...                  │
│                                      │
│ Share this link with your team      │
│                                      │
│ [Done]                               │
└──────────────────────────────────────┘
```

### 4. Member Table (ENHANCED)

**Desktop:**
```
┌────┬──────────────────┬────────┬────────────┬─────────┬─────────┐
│ ☐  │ Member           │ Role   │ Last Active │ Joined  │ Actions │
├────┼──────────────────┼────────┼────────────┼─────────┼─────────┤
│ ☐  │ 👤 John Doe      │ Owner  │ —          │ Jan 2024│ —       │
│    │ john@example.com │        │            │         │         │
├────┼──────────────────┼────────┼────────────┼─────────┼─────────┤
│ ☐  │ 👤 Jane Smith    │ Admin  │ 2h ago     │ Mar 2024│ ⋮       │
│    │ jane@example.com │        │            │         │         │
├────┼──────────────────┼────────┼────────────┼─────────┼─────────┤
│ ☐  │ 👤 Bob Wilson    │ Editor │ 1d ago     │ Jun 2024│ ⋮       │
│    │ bob@example.com  │        │            │         │         │
└────┴──────────────────┴────────┴────────────┴─────────┴─────────┘
```

**Mobile:**
```
┌──────────────────────────┐
│ 👤 John Doe              │
│ john@example.com         │
│ Owner · Joined Jan 2024  │
├──────────────────────────┤
│ 👤 Jane Smith            │
│ jane@example.com         │
│ Admin · Active 2h ago    │
│              [⋮ Actions] │
├──────────────────────────┤
│ 👤 Bob Wilson            │
│ bob@example.com          │
│ Editor · Active 1d ago   │
│              [⋮ Actions] │
└──────────────────────────┘
```

**Actions menu (bottom sheet on mobile):**
```
┌──────────────────────────┐
│ Change Role              │
│   Admin · Editor · Viewer│
├──────────────────────────┤
│ Remove from Workspace    │
└──────────────────────────┘
```

### 5. Permission Matrix (NEW)

```
┌──────────────────────┬───────┬───────┬────────┬────────┐
│ Permission           │ Owner │ Admin │ Editor │ Viewer │
├──────────────────────┼───────┼───────┼────────┼────────┤
│ View documents       │  ✅   │  ✅   │  ✅    │  ✅    │
│ Chat with AI         │  ✅   │  ✅   │  ✅    │  ✅    │
│ Create documents     │  ✅   │  ✅   │  ✅    │  ❌    │
│ Edit documents       │  ✅   │  ✅   │  ✅    │  ❌    │
│ Delete documents     │  ✅   │  ✅   │  ✅    │  ❌    │
│ Manage prompts       │  ✅   │  ✅   │  ✅    │  ❌    │
│ View analytics       │  ✅   │  ✅   │  ✅    │  ✅    │
│ Manage members       │  ✅   │  ✅   │  ❌    │  ❌    │
│ Invite members       │  ✅   │  ✅   │  ❌    │  ❌    │
│ Update workspace     │  ✅   │  ✅   │  ❌    │  ❌    │
│ Manage billing       │  ✅   │  ❌   │  ❌    │  ❌    │
│ Delete workspace     │  ✅   │  ❌   │  ❌    │  ❌    │
│ Transfer ownership   │  ✅   │  ❌   │  ❌    │  ❌    │
└──────────────────────┴───────┴───────┴────────┴────────┘
```

### 6. Create Workspace Dialog (NEW)

```
┌──────────────────────────────────────┐
│ 🏢 Create Workspace                  │
│                                      │
│ Workspace Name                       │
│ ┌──────────────────────────────────┐ │
│ │ My New Team                      │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Description (optional)               │
│ ┌──────────────────────────────────┐ │
│ │ A workspace for our team docs    │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Icon                                 │
│ [🏢] [Click to choose emoji]        │
│                                      │
│ [Cancel]           [Create Workspace]│
└──────────────────────────────────────┘
```

---

## API Changes

### New Endpoints
- `POST /api/workspace` — Create workspace (body: { name, description?, icon? })
- `DELETE /api/workspace/:id` — Delete workspace (owner only)
- `PATCH /api/workspace/:id` — Update workspace (name, description, icon)
- `POST /api/workspace/:id/transfer` — Transfer ownership
- `POST /api/workspace/:id/leave` — Leave workspace (non-owners)
- `GET /api/workspace/activity` — Activity log

### Modified Endpoints
- `GET /api/workspace/switch` — Add `description`, `icon` fields
- `GET /api/workspace/members` — Add `lastActiveAt` field
- `POST /api/workspace/invitations` — Support bulk invite (array of emails)

---

## Responsive Behavior

### Desktop (≥1024px)
- Tabbed settings layout (General, Members, Roles, Activity, Danger Zone)
- Full member table with all columns
- Permission matrix grid

### Tablet (768-1023px)
- Tabbed settings layout (collapsed tabs)
- Member table with hidden "Last Active" column
- Permission matrix (scrollable)

### Mobile (<768px)
- Stacked cards instead of tabs
- Member list as cards (not table)
- Bottom sheet for member actions
- Bottom sheet for role changes
- FAB for "Invite Member"

---

## Accessibility Requirements

1. **Skip-to-content** on all team management pages
2. **aria-live="polite"** on member list for role changes and removals
3. **Keyboard navigation** for member table (arrow keys, Enter to open actions)
4. **Focus indicators** on all interactive elements (role dropdowns, buttons)
5. **Screen reader announcements** — "Role changed to Admin", "Member removed"
6. **Styled confirmation dialogs** — Replace `confirm()` with accessible Dialog component
7. **Color + text** — Role badges use both color and text (not color-only)
8. **Keyboard shortcuts** — Cmd+K for workspace switch, Esc to close dialogs

---

## Migration Path

### Phase 1: Quick Wins (1 day)
- Add "Create Workspace" button
- Fix workspace switch (no reload)
- Add skip-to-content
- Replace `confirm()` with styled dialogs
- Add role description tooltips
- Add "Leave Workspace" button
- Add member search input
- Fix empty states
- Replace hardcoded colors with tokens
- Add aria-live for feedback

### Phase 2: Workspace Settings (2 days)
- Add tabbed settings layout
- Add workspace name editing
- Add workspace description
- Add workspace icon
- Add delete workspace (owner only)
- Add transfer ownership

### Phase 3: Members & Roles (2 days)
- Add member filter (by role)
- Add permission matrix UI
- Add member last active timestamp
- Add bulk member actions
- Add member activity log

### Phase 4: Invitations & Polish (2 days)
- Unify invitation flow
- Add invite by shareable link
- Add bulk invite
- Add invitation preview
- Mobile optimization (cards, bottom sheets)
- Keyboard shortcuts

---

## Component File Structure

```
components/workspace/
├── workspace-switcher.tsx          (ENHANCED — create, no reload, icon)
├── workspace-settings-tabs.tsx     (NEW — tabbed layout)
├── workspace-general.tsx           (NEW — name, description, icon)
├── workspace-members.tsx           (ENHANCED — search, filter, bulk actions)
├── workspace-roles.tsx             (NEW — permission matrix)
├── workspace-activity.tsx          (NEW — activity log)
├── workspace-danger-zone.tsx       (NEW — transfer, leave, delete)
├── invite-dialog.tsx               (REWRITTEN — unified flow)
├── invitation-list.tsx             (ENHANCED — better UX)
├── member-table.tsx                (NEW — desktop table)
├── member-card.tsx                 (NEW — mobile card)
├── permission-matrix.tsx           (NEW — grid component)
├── create-workspace-dialog.tsx     (NEW — creation wizard)
├── role-badge.tsx                  (NEW — reusable badge with tooltip)
├── confirm-dialog.tsx              (NEW — styled confirmation)
└── activity-item.tsx               (NEW — activity log item)
```

---

## Summary

| Metric | V1 (Current) | V2 (Target) |
|--------|-------------|-------------|
| Score | 4.8/10 | 7.5/10 |
| Create workspace | ❌ | ✅ Wizard |
| Workspace settings | ❌ Name only | ✅ Full settings |
| Invitation flow | 2 methods (confusing) | 1 unified flow |
| Permission UI | ❌ Hidden | ✅ Matrix |
| Member search | ❌ | ✅ Search + filter |
| Empty states | Text only | CTAs + guidance |
| Mobile | Overflow table | Card list + bottom sheet |
| Accessibility | Low | WCAG 2.1 AA |
| Design tokens | Hardcoded | V2 system |
| Components | 8 | 16 |
