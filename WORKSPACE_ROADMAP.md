# Workspace Hardening Roadmap — MimoNotes

> **Date**: 2026-06-13  
> **Classification**: READ-ONLY AUDIT — implementation deferred to Sprint 9+

---

## Priority Matrix

### 🔴 P0 — IMMEDIATE (5 minutes, zero risk)

| Task | Effort | Impact |
|---|---|---|
| `ALTER USER mimotes_app NOBYPASSRLS` | 5 min | Restores ALL RLS protection |

**Why first**: Without this, all RLS policies are decorative. Every other fix depends on RLS actually being enforced.

---

### 🔴 P1 — CRITICAL (1-2 hours, high impact)

| Task | Effort | Impact |
|---|---|---|
| Add RLS to 6 unprotected tables | 30 min | Closes tenant isolation gaps |
| Add `setWorkspaceContext()` to `requireApiAuth()` | 15 min | Activates RLS for v1 API |
| Standardize GUC to use `true` parameter | 15 min | Prevents runtime errors |
| Add `FORCE ROW LEVEL SECURITY` to all RLS tables | 10 min | Ensures RLS even for table owner |

**Tables needing RLS**:
```sql
-- api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;
CREATE POLICY api_keys_tenant_isolation ON api_keys
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- Repeat for: api_usage_logs, audit_logs, widgets, widget_conversations, widget_messages
```

**v1 API fix**:
```typescript
// lib/api-auth.ts — add to requireApiAuth()
import { setWorkspaceContext } from "@/lib/prisma";

export async function requireApiAuth(request: NextRequest): Promise<ApiAuthResult> {
  const auth = await authenticateApiRequest(request);
  if (!auth) throw new ApiError(401, "Invalid or missing API key");
  
  await setWorkspaceContext(auth.workspaceId);  // NEW: activate RLS
  
  const hasAccess = await checkApiAccess(auth.workspaceId);
  // ...
}
```

---

### 🟡 P2 — IMPORTANT (2-4 hours, medium impact)

| Task | Effort | Impact |
|---|---|---|
| Workspace switching backend | 4h | Multi-workspace support |
| Workspace switching frontend | 2h | User-facing feature |
| Invitation token system | 4h | Better member onboarding |
| Email invitations | 2h | Professional invite flow |

**Workspace switching architecture**:
```
1. Store selectedWorkspaceId in JWT/session
2. POST /api/workspace/switch — validates membership, updates session
3. resolveWorkspaceId() — checks session first, falls back to owner
4. WorkspaceSwitcher — lists all user's workspaces, click to switch
5. All subsequent requests use selected workspace
```

**Invitation system**:
```
1. Generate invitation token (UUID + expiry)
2. Store in workspace_invitations table
3. Send email with invite link
4. User clicks link → accept invitation → create workspace membership
5. Token expires after 7 days
```

---

### 🟢 P3 — ENHANCEMENT (8+ hours, polish)

| Task | Effort | Impact |
|---|---|---|
| Workspace description field | 1h | Metadata |
| Workspace deletion UI | 2h | Owner feature |
| Workspace transfer UI | 2h | Owner feature |
| Member activity tracking | 4h | Engagement |
| Bulk member import | 2h | Onboarding |
| Workspace branding | 4h | White-label |

---

## Implementation Plan

### Sprint 9A: Security Hardening (2 hours)

1. Fix BYPASSRLS (5 min)
2. Add RLS to 6 tables (30 min)
3. Fix v1 API workspace context (15 min)
4. Standardize GUC parameters (15 min)
5. Add FORCE RLS to all tables (10 min)
6. Tests for all changes (30 min)

### Sprint 9B: Workspace Switching (6 hours)

1. Add `selectedWorkspaceId` to session/JWT
2. Create `POST /api/workspace/switch` endpoint
3. Update `resolveWorkspaceId()` to check session
4. Update `WorkspaceSwitcher` to show all workspaces
5. Persist selection in cookie/localStorage
6. Tests + build verification

### Sprint 10: Invitation System (8 hours)

1. Add `workspace_invitations` table
2. Create invitation API endpoints
3. Add email delivery (via existing email system)
4. Add invitation acceptance flow
5. Add invitation management UI
6. Tests + build verification

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| BYPASSRLS fix breaks app | Low | High | Test thoroughly after fix |
| RLS blocks legitimate queries | Medium | Medium | Verify all queries set context |
| Workspace switch breaks data isolation | Low | High | Test cross-workspace access |
| Invitation email delivery fails | Medium | Low | Graceful fallback to copy-link |

---

## Success Criteria

After implementation:
- ✅ `mimotes_app` has `BYPASSRLS = false`
- ✅ All 23+ tenant-scoped tables have RLS
- ✅ All API routes set workspace context
- ✅ Users can switch between workspaces
- ✅ Invitations can be sent and accepted
- ✅ Cross-workspace data access is blocked
- ✅ All existing tests pass
