# Workspace UX Review — MimoNotes

> **Date**: 2026-06-13  
> **Scope**: Workspace switching, member management, settings, navigation

---

## Workspace Switcher

### Current State

The `WorkspaceSwitcher` component (`components/workspace/workspace-switcher.tsx`) is **display-only**:

- Shows current workspace name + member count
- Displays a dropdown with "Select a workspace" label
- But only shows ONE workspace (the current one)
- Dropdown has a "Manage workspace in Settings → Workspace" link
- **No actual switching functionality**

### What's Missing

1. **No workspace list**: User cannot see other workspaces they're members of
2. **No switch action**: Clicking a workspace does nothing
3. **No session persistence**: No way to store selected workspace
4. **No API endpoint**: No `POST /api/workspace/switch` or similar
5. **No visual feedback**: No indication that workspace changed

### User Impact

- Users who join multiple workspaces can only see their owner workspace
- Multi-workspace feature is stored in DB but not surfaced in UX
- Workspace membership data is collected but unused

---

## Member Management

### Current State

**Members API** (`/api/workspace/members`):
- GET: List members with roles
- POST: Add member by email (requires `team_members` feature gate)

**Member [id] API** (`/api/workspace/members/[id]`):
- PATCH: Change member role (admin+ only)
- DELETE: Remove member (not yet verified)

### What Works

- Role hierarchy: owner > admin > editor > viewer
- Owner cannot be demoted or removed
- Role change requires admin+ permission
- Audit logging on member changes

### What's Missing

1. **No invitation system**: Direct add only — admin must know user already has account
2. **No pending invitations**: No invite token, no email, no accept/reject flow
3. **No invitation expiry**: Added members are immediately active
4. **No bulk invite**: One email at a time
5. **No member search**: Must type exact email
6. **No member activity**: No "last active" timestamp
7. **No role permission display**: Users don't see what they can/can't do

---

## Settings Pages

### Workspace Settings (`/settings/workspace`)

- Shows workspace name, slug, creation date
- Member list with roles
- Uses `WorkspaceSwitcher` component

### Missing Settings

1. **Workspace slug editing** — currently immutable after creation
2. **Workspace deletion** — not available in UI (RBAC has `workspace:delete` permission)
3. **Workspace transfer** — RBAC has `workspace:transfer` but no UI
4. **Workspace description** — not in schema
5. **Workspace branding** — logo, colors for workspace (separate from widget theme)

---

## Navigation

### Current Sidebar Structure

```
Dashboard
Documents
  ├── Documents
  ├── Upload
Knowledge
  ├── Documents
  ├── Chunks
  ├── Search
  ├── Sources
Chat
AI
  ├── Playground
  ├── Prompts
Analytics
  ├── Chat
  ├── Cost
  ├── Usage
Settings
  ├── General
  ├── Billing
  ├── Usage
  ├── Widget
  ├── MCP
  ├── Audit
  ├── Members (via workspace API)
```

### UX Issues

1. **Workspace context unclear**: No persistent indicator of which workspace is active
2. **No workspace creation flow**: Workspaces auto-created on first login
3. **No workspace invite link**: Must use email-based member addition
4. **No workspace onboarding**: First-time users get empty workspace with no guidance
5. **Settings consolidation**: Workspace settings split between /settings/workspace and API

---

## Recommendations

### P1: Workspace Switching
- Store selected workspace in JWT/session
- Add `POST /api/workspace/switch` endpoint
- Show all user's workspaces in dropdown
- Persist selection across page reloads

### P2: Invitation System
- Add invitation tokens with email delivery
- Add pending/accepted/rejected states
- Add 7-day expiry for invitations
- Add invitation management UI

### P3: Workspace UX Polish
- Add workspace indicator in top navigation
- Add workspace creation wizard
- Add member activity tracking
- Add workspace-level branding settings
