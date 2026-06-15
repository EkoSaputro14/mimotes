# WORKSPACE OPERATIONS REPORT

> Generated: 2026-06-04
> Status: Implementation Complete
> TypeScript: ✅ Zero errors
> Migration: ✅ Applied
> RLS: ✅ Enforced
> Build: Pending Docker verification

---

## 1. APIs Created

### Workspace Management

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/workspace` | ✅ | viewer+ | Get current workspace + members |
| PATCH | `/api/workspace` | ✅ | admin+ | Update workspace name |

### Member Management

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/workspace/members` | ✅ | viewer+ | List all members |
| POST | `/api/workspace/members` | ✅ | admin+ | Invite member by email |
| PATCH | `/api/workspace/members/[id]` | ✅ | admin+ | Change member role |
| DELETE | `/api/workspace/members/[id]` | ✅ | admin+ | Remove member |

### Settings (Updated)

| Method | Endpoint | Auth | Role | Change |
|--------|----------|------|------|--------|
| GET | `/api/admin/settings` | ✅ | — | Now reads workspace-scoped settings |
| POST | `/api/admin/settings` | ✅ | admin | Now writes workspace-scoped settings |
| POST | `/api/upload` | ✅ | editor+ | RBAC enforced (was: any auth'd user) |

---

## 2. UI Created

### Workspace Switcher (`components/workspace/workspace-switcher.tsx`)

- Compact dropdown in sidebar below logo
- Shows workspace name + member count
- Lists all workspaces (for future multi-workspace support)
- Current workspace highlighted with check mark

### Member Management (`components/workspace/member-management.tsx`)

- Full member list with avatars, names, emails, role badges
- Invite form: email + role selector + invite button
- Role change: dropdown selector per member (owner role locked)
- Remove member: confirmation dialog
- Actions disabled based on current user's role

### Workspace Settings Page (`app/(admin)/settings/workspace/page.tsx`)

- New page under Settings → Workspace
- Shows workspace switcher + member management
- Accessible from sidebar bottom nav

---

## 3. Permission Matrix

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| **Workspace** | | | | |
| View workspace | ✅ | ✅ | ✅ | ✅ |
| Update name | ✅ | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |
| Transfer ownership | ✅ | ❌ | ❌ | ❌ |
| **Documents** | | | | |
| View documents | ✅ | ✅ | ✅ | ✅ |
| Upload documents | ✅ | ✅ | ✅ | ❌ |
| Edit documents | ✅ | ✅ | ✅ | ❌ |
| Delete documents | ✅ | ✅ | ✅ | ❌ |
| **Chat** | | | | |
| View chat sessions | ✅ | ✅ | ✅ | ✅ |
| Create chat session | ✅ | ✅ | ✅ | ✅ |
| Send messages | ✅ | ✅ | ✅ | ✅ |
| **Members** | | | | |
| View members | ✅ | ✅ | ❌ | ❌ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change roles | ✅ | ✅ | ❌ | ❌ |
| **Settings** | | | | |
| View AI settings | ✅ | ✅ | ✅ | ✅ |
| Update AI settings | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ |
| **MCP** | | | | |
| View MCP servers | ✅ | ✅ | ✅ | ✅ |
| Create/Update/Delete | ✅ | ✅ | ✅ | ❌ |
| Execute MCP tools | ✅ | ✅ | ✅ | ✅ |
| **Prompts** | | | | |
| View prompts | ✅ | ✅ | ✅ | ✅ |
| Create/Update/Delete | ✅ | ✅ | ✅ | ❌ |

---

## 4. Schema Changes

### New Model: WorkspaceSetting

```prisma
model WorkspaceSetting {
  id          String   @id @default(uuid())
  workspaceId String   @map("workspace_id")
  key         String   @db.VarChar(100)
  value       String
  updatedAt   DateTime @updatedAt @map("updated_at")

  workspace Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, key])
  @@index([workspaceId])
  @@map("workspace_settings")
}
```

### Migration SQL (`003_add_workspace_settings.sql`)

- Creates `workspace_settings` table
- Enables RLS with 4 policies (SELECT, INSERT, UPDATE, DELETE)
- Applies FORCE ROW LEVEL SECURITY
- Migrates existing global AI settings into workspace settings
- Foreign key to `workspaces(id)` ON DELETE CASCADE

---

## 5. Library Created

### RBAC (`lib/rbac.ts`)

**Roles:** owner > admin > editor > viewer

**Functions:**
- `getUserRole(workspaceId, userId)` — fetch role from DB
- `hasRole(workspaceId, userId, minimumRole)` — check hierarchy
- `hasPermission(workspaceId, userId, permission)` — check specific permission
- `requireRole(workspaceId, userId, minimumRole)` — enforce or throw PermissionError
- `requirePermission(workspaceId, userId, permission)` — enforce or throw
- `getUserPermissions(workspaceId, userId)` — list all permissions
- `isValidRole(role)` — validate role string
- `getRoleDisplayName(role)` — human-readable name
- `getRoleBadgeClass(role)` — Tailwind CSS class for badge

**Permissions by role:**
- viewer: workspace:read, document:read, chat:read/create/send, analytics:read, prompt:read, mcp:read/execute
- editor: + document:create/update/delete, prompt:create/update/delete, mcp:create/update/delete
- admin: + member:read/invite/remove/update_role, workspace:update/settings
- owner: + workspace:delete/transfer/billing

---

## 6. Files Modified

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added WorkspaceSetting model + relation |
| `lib/prisma.ts` | No changes (already workspace-aware) |
| `lib/rbac.ts` | **NEW** — RBAC enforcement library |
| `lib/settings.ts` | Added workspace-scoped get/set/invalidation |
| `lib/middleware/tenant.ts` | No changes (already workspace-aware) |
| `app/api/admin/settings/route.ts` | Workspace-scoped settings + admin RBAC |
| `app/api/upload/route.ts` | Added requireRole("editor") check |
| `app/api/workspace/route.ts` | **NEW** — GET/PATCH workspace |
| `app/api/workspace/members/route.ts` | **NEW** — GET/POST members |
| `app/api/workspace/members/[id]/route.ts` | **NEW** — PATCH/DELETE member |
| `middleware.ts` | Added `/api/workspace` to protected routes |
| `components/workspace/workspace-switcher.tsx` | **NEW** — sidebar dropdown |
| `components/workspace/member-management.tsx` | **NEW** — member CRUD UI |
| `app/(admin)/settings/workspace/page.tsx` | **NEW** — workspace settings page |
| `components/layout/app-sidebar.tsx` | Added WorkspaceSwitcher + Workspace nav |
| `migrations/003_add_workspace_settings.sql` | **NEW** — DB migration |

---

## 7. RLS Updates

### workspace_settings (NEW)

| Policy | Type | Rule |
|--------|------|------|
| workspace_settings_select | SELECT | `workspace_id = current_setting('app.current_workspace_id')` |
| workspace_settings_insert | INSERT | `workspace_id = current_setting('app.current_workspace_id')` |
| workspace_settings_update | UPDATE | `workspace_id = current_setting('app.current_workspace_id')` |
| workspace_settings_delete | DELETE | `workspace_id = current_setting('app.current_workspace_id')` |

- FORCE ROW LEVEL SECURITY: ✅ (applies to table owner too)
- RLS enforced via `mimotes_app` role (no BYPASSRLS)

---

## 8. Settings Migration Strategy

### Before (Global)

```
Setting table: key=ai_provider, value=mimo (shared by all users)
```

### After (Per-Workspace)

```
WorkspaceSetting table:
  workspace_id=ws-abc, key=ai_provider, value=mimo
  workspace_id=ws-xyz, key=ai_provider, value=openai
```

### Fallback Chain

```
WorkspaceSetting → Setting (global) → process.env → defaultValue
```

---

## 9. Rollback Strategy

### Database Rollback

```sql
-- 1. Drop workspace_settings table
DROP TABLE IF EXISTS workspace_settings CASCADE;

-- 2. Restore global settings (already in settings table)
-- No action needed — global settings preserved
```

### Code Rollback

```bash
# Revert to previous commit
git checkout HEAD~1 -- lib/rbac.ts lib/settings.ts
git checkout HEAD~1 -- app/api/workspace/
git checkout HEAD~1 -- app/api/admin/settings/route.ts
git checkout HEAD~1 -- app/api/upload/route.ts
git checkout HEAD~1 -- components/workspace/
git checkout HEAD~1 -- components/layout/app-sidebar.tsx
git checkout HEAD~1 -- middleware.ts
git checkout HEAD~1 -- prisma/schema.prisma
git checkout HEAD~1 -- migrations/
```

### Impact

- Workspace-scoped settings lost (falls back to global)
- Member management removed
- RBAC enforcement removed
- Workspace switcher removed
- **No data loss** — workspace_settings drop cascades, other tables unaffected

---

## 10. Verification Tests

### TypeScript

```
✅ npx tsc --noEmit — zero errors
```

### Database

```
✅ workspace_settings table created
✅ RLS enabled (4 policies)
✅ FORCE RLS enabled
✅ Foreign key to workspaces(id) ON DELETE CASCADE
✅ Unique constraint on (workspace_id, key)
✅ Index on workspace_id
```

### Migration

```
✅ Global settings → workspace settings migration applied
✅ Existing data preserved
```

### API Endpoints

| Endpoint | Expected | Status |
|----------|----------|--------|
| GET /api/workspace | 200 + workspace data | ✅ Implemented |
| PATCH /api/workspace | 200 (admin+) / 403 (viewer) | ✅ Implemented |
| GET /api/workspace/members | 200 + member list | ✅ Implemented |
| POST /api/workspace/members | 200 (admin+) / 403 (editor) | ✅ Implemented |
| PATCH /api/workspace/members/[id] | 200 (admin+) / 403 | ✅ Implemented |
| DELETE /api/workspace/members/[id] | 200 (admin+) / 403 | ✅ Implemented |
| POST /api/upload | 403 (viewer) / 200 (editor+) | ✅ Implemented |
| POST /api/admin/settings | 403 (editor) / 200 (admin+) | ✅ Implemented |

### RBAC Enforcement

| Scenario | Expected | Implementation |
|----------|----------|----------------|
| Viewer tries to upload | 403 PermissionError | ✅ requireRole in upload route |
| Viewer tries to change settings | 403 PermissionError | ✅ requireRole in settings route |
| Editor invites member | 403 PermissionError | ✅ requireRole in members route |
| Admin changes member role | 200 OK | ✅ requireRole("admin") |
| Owner removed | 400 "Cannot remove owner" | ✅ Hardcoded check |
| Owner role changed | 400 "Cannot change owner" | ✅ Hardcoded check |
| Non-member access | 403 "Not a member" | ✅ requireRole returns null |

---

## 11. Architecture Summary

```
Auth (NextAuth) → resolveWorkspaceId → setWorkspaceContext (RLS GUC)
                                          ↓
                          ┌─────────────────────────────┐
                          │  PostgreSQL RLS Policies     │
                          │  WHERE workspace_id = $GUC   │
                          └─────────────────────────────┘
                                          ↓
                    ┌─────────────────────────────────────────┐
                    │  Application Layer (RBAC)                │
                    │  requireRole(userId, workspaceId, role)  │
                    │  → getUserRole() → hierarchy check       │
                    │  → PermissionError if insufficient       │
                    └─────────────────────────────────────────┘
                                          ↓
                    ┌─────────────────────────────────────────┐
                    │  API Routes                              │
                    │  withWorkspace() → handler(userId, wsId) │
                    │  withTenant() → deprecated wrapper       │
                    └─────────────────────────────────────────┘
```

**Defense-in-Depth Layers:**

1. **Edge Middleware** — cookie check (UX redirect, not security)
2. **Route Handler Auth** — `auth()` JWT verification
3. **RBAC** — `requireRole()` checks workspace membership + role hierarchy
4. **PostgreSQL RLS** — database-level workspace isolation
5. **FORCE RLS** — applies to table owners too
6. **mimotes_app Role** — non-superuser, no BYPASSRLS
