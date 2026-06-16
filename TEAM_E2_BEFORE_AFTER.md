# Team E2 — Before & After

**Sprint:** Team Management V2 — Phase 2 (Core Redesign)

---

## Workspace Settings

### Before
- No workspace settings page
- Only workspace name shown in switcher
- No description or avatar
- No way to customize workspace

### After
- Full settings card with editable fields
- Name: input with save button, 200 char limit
- Description: textarea with save button, 500 char limit
- Avatar: emoji/URL input with live preview
- Each field saves independently
- Admin+ can edit (enforced by API)

---

## Permission System

### Before
- Permissions hidden in code (lib/rbac.ts)
- Users guessed what each role could do
- No visual permission reference
- Role descriptions only in invite dialog tooltips

### After
- Read-only permission matrix grid
- 27 permissions × 4 roles
- Checkmarks for enabled, dashes for disabled
- Role inheritance shown correctly
- Readable labels (not code identifiers)
- Displayed on workspace settings page

---

## Member Filters

### Before
- Text search only (name, email)
- No role-based filtering
- No member count per role

### After
- Role filter buttons: Semua, Owner, Admin, Editor, Viewer
- Each button shows member count
- Active filter highlighted
- Works alongside text search
- Combined count: "3 dari 5 anggota"

---

## Last Active

### Before
- No activity tracking
- No way to see when members were last online
- No engagement visibility

### After
- `lastActiveAt` field on WorkspaceMember
- Updated on every workspace access
- Formatted timestamps: "Aktif baru saja", "Aktif 2 jam lalu", "Aktif kemarin"
- "Belum pernah aktif" for null values
- Shown next to each member in list

---

## Invitation Badge

### Before
- No indication of pending invitations
- Users had to switch to Invitations tab to check

### After
- Red badge with count on workspace switcher
- Shows next to workspace name in trigger and dropdown
- Only visible when count > 0
- Fetched from invitations API

---

## Schema

### Before
```
Workspace { id, name, slug, createdAt, updatedAt }
WorkspaceMember { id, workspaceId, userId, role, createdAt }
```

### After
```
Workspace { id, name, slug, description, avatarUrl, createdAt, updatedAt }
WorkspaceMember { id, workspaceId, userId, role, lastActiveAt, createdAt }
```

---

## Score Impact

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Workspace settings | 3/10 | 7/10 | +4 |
| Permission visibility | 2/10 | 7/10 | +5 |
| Member filters | 3/10 | 6/10 | +3 |
| Activity visibility | 1/10 | 5/10 | +4 |
| Invitation awareness | 3/10 | 6/10 | +3 |
| **Overall** | **~6.5/10** | **~7.5/10** | **+1.0** |
