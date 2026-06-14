# Team E1 — Before & After

**Sprint:** Team Management V2 — Phase 1 (Quick Wins)

---

## Workspace Switching

### Before
- No "Create Workspace" option
- `window.location.reload()` on switch — full page flash
- "Manage workspace in Settings → Workspace" text only

### After
- "Buat Workspace Baru" button with inline form
- `router.refresh()` — no flash, SPA navigation
- Clickable link to Settings → Workspace

---

## Member Management

### Before
- No member search
- `confirm()` for delete actions
- No role descriptions
- Hardcoded `bg-white text-gray-*` colors
- No empty state guidance
- No "Leave Workspace" option

### After
- Search input filtering by name, email, or role
- Styled Dialog for remove/leave confirmations
- Hover tooltips on role badges with descriptions
- Design tokens (bg-card, text-foreground, border-border)
- Icon + title + guidance in empty states
- "Keluar dari workspace ini" button for non-owners

---

## Invitations

### Before
- `confirm()` for revoke
- Hardcoded colors
- Basic empty state

### After
- Styled Dialog for revoke confirmation
- Design tokens throughout
- Improved empty state with icon and guidance

---

## Accessibility

### Before
- No skip-to-content
- No aria-live for feedback
- `confirm()` not accessible

### After
- Skip-to-content on workspace settings page
- aria-live="polite" for role changes and member actions
- Styled Dialog components (keyboard accessible)

---

## API

### Before
- `GET /api/workspace` — no currentUserId/currentUserRole
- No leave workspace endpoint

### After
- `GET /api/workspace` — includes currentUserId + currentUserRole
- `POST /api/workspace/leave` — new endpoint (owner blocked)

---

## Score Impact

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Workspace switching | 5/10 | 7/10 | +2 |
| Members management | 5/10 | 7/10 | +2 |
| Invitations | 5/10 | 6/10 | +1 |
| Accessibility | 3/10 | 5/10 | +2 |
| Visual design | 4/10 | 6/10 | +2 |
| Empty states | 3/10 | 5/10 | +2 |
| **Overall** | **4.8/10** | **~6.5/10** | **+1.7** |
