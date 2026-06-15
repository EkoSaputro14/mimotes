# Sprint 10 — Invitation System Security Review

**Date:** 2026-06-13  
**Reviewer:** Automated Security Review  
**Scope:** Sprint 10 — Workspace Invitation System

## Threat Model

| Threat | Severity | Mitigation | Status |
|--------|----------|-----------|--------|
| Token brute-force | HIGH | 256-bit entropy (2^256 possibilities) | ✅ Mitigated |
| Token theft from DB | HIGH | SHA-256 hash (raw token never stored) | ✅ Mitigated |
| Timing attack on token comparison | MEDIUM | `crypto.timingSafeEqual` | ✅ Mitigated |
| Token replay after acceptance | HIGH | One-time use via status check (pending → accepted) | ✅ Mitigated |
| Invitation hijacking | MEDIUM | Email match required between token and accepting user | ✅ Mitigated |
| Self-invitation | LOW | Explicit check: `invitedEmail === currentUser.email` | ✅ Mitigated |
| Cross-workspace access | HIGH | RLS + tenant isolation on `workspace_invitations` | ✅ Mitigated |
| Expired invitation accepted | MEDIUM | 7-day expiry enforced at accept time | ✅ Mitigated |
| Privilege escalation | MEDIUM | Role validation; only admin+ can create | ✅ Mitigated |
| Duplicate invitations | LOW | Unique constraint on (workspaceId, email, status) | ✅ Mitigated |
| Token in transit exposure | LOW | Manual sharing; 7-day window limits exposure | ⚠️ Accepted risk |

## Security Controls Implemented

### 1. Token Security ✅

**Generation:**
- Uses `crypto.randomBytes(32)` — cryptographically secure PRNG
- Produces 64-character hex string (256 bits of entropy)
- No predictable components (no timestamps, no sequential IDs)

**Storage:**
- Only SHA-256 hash stored in database
- Raw token returned once to inviter, never persisted
- Hash is deterministic — same token always produces same hash

**Verification:**
- `crypto.timingSafeEqual()` prevents timing side-channel attacks
- Constant-time comparison regardless of where mismatch occurs
- Returns `false` for any invalid input (no exceptions)

**Code Evidence:**
```typescript
// lib/invitations.ts
export function generateInvitationToken() {
  const raw = crypto.randomBytes(32).toString('hex'); // 64 chars
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const prefix = hash.substring(0, 8);
  return { token: raw, hash, prefix };
}

export function verifyInvitationToken(token: string, storedHash: string): boolean {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}
```

### 2. Expiration Enforcement ✅

- Default expiry: 7 days (`INVITATION_EXPIRY_DAYS = 7`)
- Stored as `expiresAt` DateTime in database
- Checked at accept time: `isTokenExpired(invitation.expiresAt)`
- Expired invitations cannot be accepted (returns 403)
- Expired invitations are not listed as actionable

### 3. Replay Protection ✅

- One-time use enforced via status field:
  - `pending` → `accepted` (on successful acceptance)
  - `pending` → `revoked` (on admin revoke)
  - `pending` → `expired` (on time expiry)
- Accept endpoint checks `invitation.status === 'pending'`
- Once accepted, token becomes invalid for future use
- Resend generates new token, explicitly sets old invitation to `revoked`

### 4. Email Binding ✅

- Invitation created with target email address
- Accepting user's email (from auth session) must match `invitation.email`
- Prevents: someone intercepting a token and accepting it with their own account
- Self-invitation blocked: `invitedEmail !== currentUser.email`

### 5. Cross-Workspace Isolation ✅

**Database Level:**
```sql
CREATE POLICY workspace_invitations_tenant_isolation ON workspace_invitations
  USING (workspace_id = current_setting('app.current_workspace_id', true)::uuid);
```

**Enforcement:**
- RLS enabled on `workspace_invitations` table
- FORCE RLS applied (enforced even for table owners)
- `setWorkspaceContext()` called before all queries
- Cross-workspace token lookup blocked by RLS
- Tested: Workspace A cannot see Workspace B's invitations

### 6. Authorization ✅

| Action | Required Role | Implementation |
|--------|---------------|----------------|
| Create invitation | Admin+ | `requireAuth()` + role check |
| List invitations | Admin+ | Same |
| Revoke invitation | Admin+ | Same |
| Resend invitation | Admin+ | Same |
| Accept invitation | Any authenticated user | Token-based, no role required |

**Role hierarchy:** owner > admin > editor > viewer

### 7. Input Validation ✅

**Create Invitation:**
- Email format validation (must contain @)
- Role must be one of: admin, editor, viewer
- Workspace ID required
- Duplicate pending invite blocked by unique constraint

**Accept Invitation:**
- Token format validation (must be 64-char hex)
- Token lookup by hash prefix
- Full hash verification via timing-safe comparison

### 8. Audit Trail ✅

All invitation actions are logged via `lib/audit.ts`:

| Event | Logged Data |
|-------|------------|
| `INVITATION_CREATED` | workspaceId, invitedEmail, role, invitedById |
| `INVITATION_ACCEPTED` | workspaceId, invitationId, acceptedById |
| `INVITATION_REVOKED` | workspaceId, invitationId, revokedById |
| `INVITATION_RESENT` | workspaceId, invitationId, resentById |

## Vulnerability Assessment

### No Vulnerabilities Found ✅

| Check | Result |
|-------|--------|
| SQL Injection | ✅ No raw SQL — all Prisma parameterized |
| XSS | ✅ No user-controlled HTML rendering |
| CSRF | ✅ API routes require auth headers |
| Rate Limiting | ⚠️ Not on invitation endpoints (deferred) |
| Logging Leaks | ✅ No tokens in log output |
| Error Messages | ✅ Generic messages (no token disclosure) |

## Residual Risks

### 1. Token in Transit (Accepted Risk)
**Risk:** Token is shared via unencrypted channel (copy/paste, chat, email).  
**Mitigation:** 7-day expiry + one-time use limits exposure window.  
**Recommendation:** Add optional email delivery in future sprint.

### 2. No Rate Limiting on Invitation Endpoints (Accepted Risk)
**Risk:** Admin could create many invitations rapidly.  
**Mitigation:** Admin-only access limits attack surface.  
**Recommendation:** Add rate limiting in future sprint.

### 3. No IP-Based Access Control (Accepted Risk)
**Risk:** Compromised admin account could create invitations from any IP.  
**Mitigation:** Standard for web applications; mitigated by overall auth security.  
**Recommendation:** Consider IP allowlisting for high-security deployments.

## Compliance Notes

- **OWASP Top 10 A07:2021** — Identification and Authentication Failures: ✅ Addressed (timing-safe comparison, one-time use, expiry)
- **OWASP Top 10 A01:2021** — Broken Access Control: ✅ Addressed (RLS, role checks, email binding)
- **CWE-330** — Use of Insufficiently Random Values: ✅ Mitigated (`crypto.randomBytes`)
- **CWE-385** — Covert Timing Channel: ✅ Mitigated (`timingSafeEqual`)
- **CWE-613** — Insufficient Session Expiration: ✅ Mitigated (7-day token expiry)
