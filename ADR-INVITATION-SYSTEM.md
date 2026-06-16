# ADR-INVITATION-SYSTEM: Workspace Invitation System

**Status:** Accepted  
**Date:** 2026-06-13  
**Deciders:** Sprint 10 — Invitation System  
**Technical Story:** Sprint 10 of MimoNotes Collaboration Features

## Context

Users need to invite team members to workspaces. The current system supports two membership mechanisms:

1. **Direct membership** — An admin creates a `WorkspaceMember` record by providing the user's email. This requires the invitee to **already have an account** in the system.
2. **Owner assignment** — The workspace creator is automatically the owner.

Neither mechanism supports inviting users who haven't registered yet. There is no way to:
- Send an invitation link/token to a colleague who hasn't signed up
- Track pending invitations
- Revoke or resend invitations
- Enforce time-limited access grants

This blocks real-world collaboration workflows where team leads need to onboard external colleagues.

## Decision

Implement a **token-based invitation system** with SHA-256 hashed tokens, 7-day expiry, and one-time use semantics. The system operates without any email delivery dependency — tokens are generated and shared manually by the inviter.

### Design Choices

| Choice | Decision | Rationale |
|--------|----------|-----------|
| **Token format** | 64-char hex (32 bytes from `crypto.randomBytes`) | 256-bit entropy, cryptographically secure |
| **Storage** | SHA-256 hash (never raw token in DB) | Prevents token theft from DB compromise |
| **Prefix** | 8-char hex prefix stored in DB | Enables lookup without scanning all hashes |
| **Expiry** | 7 days (configurable via `INVITATION_EXPIRY_DAYS`) | Balances usability with security |
| **Use semantics** | One-time (pending → accepted/revoked/expired) | Prevents token reuse after acceptance |
| **Email verification** | Token-bound email must match accepting user | Prevents invitation hijacking |
| **Sharing mechanism** | Manual (API returns raw token for inviter to share) | No email dependency; simpler deployment |
| **Authorization** | Admin+ can create, any auth user can accept | Standard role-based access |
| **Uniqueness** | (workspaceId, email, status) unique constraint | Prevents duplicate pending invitations |

### Architecture

```
┌─────────────────────────────────────────┐
│         Inviter (Admin+)                 │
│  POST /api/workspace/invitations        │
│  → receive raw token                     │
│  → share manually (copy/paste, chat)     │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         API Route Layer                   │
│  /invitations         (create, list)     │
│  /invitations/[id]    (revoke, resend)   │
│  /invitations/[token] (accept)           │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         lib/invitations.ts               │
│  generateInvitationToken()               │
│  hashToken() → SHA-256                   │
│  verifyInvitationToken() (timing-safe)   │
│  isTokenExpired()                        │
│  getExpiresAt()                          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         PostgreSQL                       │
│  workspace_invitations                   │
│  RLS + FORCE RLS + tenant isolation      │
│  Indexes on token, (workspace, status)   │
└─────────────────────────────────────────┘
```

### Invitation Lifecycle

```
  ┌─────────┐     POST /invitations     ┌─────────┐
  │  Admin   │ ────────────────────────→ │ pending  │
  └─────────┘                            └────┬────┘
                                              │
                    ┌─────────────────────────┼──────────────────────────┐
                    │                         │                          │
           POST accept/[token]      POST revoke/[id]           7 days pass
                    │                         │                          │
                    ▼                         ▼                          ▼
              ┌──────────┐             ┌──────────┐              ┌──────────┐
              │ accepted  │             │ revoked  │              │ expired  │
              │ (→ member) │             └──────────┘              └──────────┘
              └──────────┘
                    │
              Resend available
           (generates new token,
            invalidates old)
```

## Alternatives Considered

### 1. Direct Membership Only (Existing)
- **Pros:** Simple, immediate access
- **Cons:** Requires invitee to already have an account; no tracking of pending invites; no expiry
- **Verdict:** Keep as supplementary mechanism; not sufficient for onboarding

### 2. Email-Based Invitations (Email Delivery)
- **Pros:** Professional UX, no manual token sharing, standard SaaS pattern
- **Cons:** Requires email service integration (SendGrid, AWS SES, etc.); adds infrastructure complexity; email deliverability issues; higher operational cost
- **Verdict:** Deferred to future sprint. The token-based system provides the foundation; email delivery can be layered on top without schema changes.

### 3. Magic Links (Passwordless Auth + Auto-Join)
- **Pros:** Seamless UX — click link, auto-register, join workspace
- **Cons:** Requires email delivery; complex auth flow; security concerns with auto-join; harder to control role assignment
- **Verdict:** Over-engineered for current needs. Token system achieves similar goals with less complexity.

### 4. Pre-Shared Invite Codes (Short Codes)
- **Pros:** Easy to share verbally or in chat
- **Cons:** Lower entropy; higher brute-force risk; no email binding
- **Verdict:** Rejected for security reasons. 64-char tokens provide adequate entropy.

## Consequences

### Positive
- Users can invite colleagues before they register
- Invitations expire automatically (7 days)
- Tokens are hashed — DB compromise doesn't expose valid tokens
- Timing-safe comparison prevents timing attacks
- One-time use prevents replay attacks
- Email binding prevents invitation hijacking
- RLS enforced — cross-workspace isolation maintained
- Full audit trail (INVITATION_CREATED, ACCEPTED, REVOKED, RESENT)
- No new npm dependencies (Node.js built-in crypto)

### Negative
- Manual token sharing (copy/paste or chat) — less polished than email delivery
- Inviter must be online to share the token
- No notification when invitation is accepted
- Token prefix lookup requires prefix scan (mitigated by unique constraint)

### Risks
- **Lost token:** Inviter must resend (generates new token, invalidates old). Mitigated by resend endpoint.
- **Expired invitation:** Recipient must request a new one. Default 7-day expiry is reasonable.
- **Token in transit:** Shared via unencrypted channel (chat, email). Mitigated by 7-day expiry and one-time use.

## Migration Plan

1. Run Prisma migration to create `workspace_invitations` table
2. RLS policies auto-applied via migration SQL
3. No data migration required (new table only)

## Rollback Plan

1. Remove API routes (no callers depend on them yet)
2. Drop `workspace_invitations` table
3. Remove `WorkspaceInvitation` model from schema.prisma

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST SP 800-63B — Digital Identity Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Node.js crypto.randomBytes](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback)
- [Timing-Safe Comparison](https://nodejs.org/api/crypto.html#cryptotimingsafEquala-b)
