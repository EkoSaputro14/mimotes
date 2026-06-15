# Sprint 9B — Workspace Switching Implementation Report

> **Date**: 2026-06-13  
> **Status**: ✅ COMPLETE  
> **Tests**: 215/215 passing (23 new + 192 existing) | **Build**: 0 errors

---

## Sprint Goal

Enable users who are members of multiple workspaces to switch between them via a workspace switcher UI, with persistence via HttpOnly cookie and full membership verification.

## Tasks Completed

### P0: Extended Auth Types ✅

**File**: `types/next-auth.d.ts` (CREATED)

Extended NextAuth Session and JWT types to carry the selected workspace:

```typescript
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      selectedWorkspaceId?: string;  // NEW
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    selectedWorkspaceId?: string;  // NEW
  }
}
```

**Impact**: All session/JWT consumers can now access the selected workspace ID without type casts.

### P0: Auth Callback Integration ✅

**File**: `lib/auth.ts` (MODIFIED)

- **`jwt` callback**: On sign-in, resolves default workspace via `resolveWorkspaceId()` and embeds it in `token.selectedWorkspaceId`
- **`session` callback**: Copies `token.selectedWorkspaceId` to `session.user.selectedWorkspaceId`

```typescript
jwt: async ({ token, user }) => {
  if (user) {
    token.selectedWorkspaceId = await resolveWorkspaceId(user.id);
  }
  return token;
},
session: async ({ session, token }) => {
  session.user.selectedWorkspaceId = token.selectedWorkspaceId as string;
  return session;
}
```

**Note**: Uses `as any` cast for NextAuth v5 type quirk where JWT type doesn't automatically extend Session.

### P0: Workspace Resolution Logic ✅

**File**: `lib/prisma.ts` (MODIFIED)

Two functions enhanced:

1. **`resolveWorkspaceId(userId, selectedWorkspaceId?)`** — Now accepts optional second parameter:
   - Priority: selected → owner → create default
   - If `selectedWorkspaceId` provided, verifies membership before using it
   - Falls back to owner workspace if selected is invalid
   - Creates default workspace if none exist

2. **`getUserWorkspacesWithDetails(userId)`** — New function:
   - Returns workspace details: `id`, `name`, `slug`, `role`, `memberCount`
   - Used by the workspace switcher UI
   - Ordered by role (OWNER first), then name

### P0: Tenant Middleware Enhancement ✅

**File**: `lib/middleware/tenant.ts` (MODIFIED)

- Added `getSelectedWorkspaceFromCookie()` helper
- Reads `selected_workspace_id` cookie via `next/headers` `cookies()` function
- `withWorkspace()` updated with resolution priority: cookie → JWT → owner

```typescript
export async function withWorkspace(handler) {
  const cookieWorkspace = getSelectedWorkspaceFromCookie();
  const jwtWorkspace = session?.user?.selectedWorkspaceId;
  const resolvedWorkspaceId = cookieWorkspace || jwtWorkspace || ownerWorkspaceId;
  
  setWorkspaceContext(resolvedWorkspaceId);
  return handler({ workspaceId: resolvedWorkspaceId, ... });
}
```

### P1: Workspace Switch API ✅

**File**: `app/api/workspace/switch/route.ts` (CREATED)

**POST** — Switch workspace:
- Validates user is authenticated
- Checks membership via `workspace_members` table
- Sets HttpOnly cookie: `selected_workspace_id` (30-day expiry, Secure, SameSite=Lax)
- Returns workspace details (id, name, slug, role)
- Audit logs the switch event

**GET** — List workspaces:
- Returns all user workspaces with details
- Includes `currentWorkspaceId` from cookie/JWT
- Used by the switcher component

### P1: Workspace Switcher UI ✅

**File**: `components/workspace/workspace-switcher.tsx` (REWRITTEN)

Complete rewrite of the workspace switcher component:

- Fetches workspace list from `GET /api/workspace/switch`
- Displays all workspaces with:
  - Workspace name and slug
  - Role badge (OWNER, ADMIN, MEMBER, VIEWER)
  - Member count
  - Active indicator for current workspace
- Click to switch → `POST /api/workspace/switch` → `window.location.reload()`
- Loading states: initial fetch, switching spinner
- Error feedback for failed switches
- Responsive design (works on mobile)

### P1: Workspace Switching Tests ✅

**File**: `tests/lib/workspace-switching.test.ts` (CREATED)

23 tests across 5 describe blocks covering the full switching lifecycle.

## Files Changed

| File | Change |
|---|---|
| `types/next-auth.d.ts` | Created — Extended NextAuth types with `selectedWorkspaceId` |
| `lib/auth.ts` | Modified — JWT/session callbacks carry workspace selection |
| `lib/prisma.ts` | Modified — `resolveWorkspaceId()` + `getUserWorkspacesWithDetails()` |
| `lib/middleware/tenant.ts` | Modified — Cookie-based resolution, priority chain |
| `app/api/workspace/switch/route.ts` | Created — POST (switch) + GET (list) API |
| `components/workspace/workspace-switcher.tsx` | Rewritten — Full switcher UI |
| `tests/lib/workspace-switching.test.ts` | Created — 23 tests across 5 categories |

## Database Changes

No new tables or columns required. Uses existing `workspace_members` table for membership verification and `audit_logs` for switch event logging.

| Existing Table | Usage |
|---|---|
| `workspace_members` | Membership verification on switch |
| `audit_logs` | Switch event logging |
| `workspaces` | Workspace details for listing |

## Resolution Priority Chain

```
┌─────────────────────────────────────┐
│  1. Cookie: selected_workspace_id   │  ← Highest priority
├─────────────────────────────────────┤
│  2. JWT: selectedWorkspaceId        │  ← Set on sign-in
├─────────────────────────────────────┤
│  3. Owner workspace                 │  ← Fallback
└─────────────────────────────────────┘
```

## Verification

- ✅ 215/215 tests passing (23 new + 192 existing from Sprint 9A)
- ✅ Build: 0 errors
- ✅ Workspace switch sets HttpOnly cookie correctly
- ✅ Membership verified before allowing switch
- ✅ Non-members cannot switch to unauthorized workspaces
- ✅ Data isolation maintained after switch (documents, chunks, API keys, widgets, audit logs)
- ✅ RLS enforcement works across workspace switches
- ✅ Cookie → JWT → Owner fallback chain works correctly
- ✅ Switcher UI displays all workspaces with roles and member counts
- ✅ `window.location.reload()` refreshes all data after switch
