# Team Management UX Review — MimoNotes

> **Date**: 2026-06-13  
> **Scope**: Team management, invitations, member roles, collaboration workflow

---

## Current State: Team Management Features

### Feature Overview

MimoNotes now supports two complementary mechanisms for workspace membership:

1. **Direct Membership** (Sprint 9B) — Admin adds member by email
2. **Invitation System** (Sprint 10) — Token-based invitation with expiry

| Capability | Direct Membership | Invitation System |
|------------|------------------|-------------------|
| Add member | ✅ Immediate | ✅ Pending → Accept |
| Requires account | ✅ Yes | ❌ No (any email) |
| Tracks pending | ❌ No | ✅ Yes |
| Expires | ❌ No | ✅ 7 days |
| Audit trail | ✅ Yes | ✅ Yes |
| Revocation | ✅ Remove member | ✅ Revoke invitation |
| Resend | N/A | ✅ New token |
| UI components | ⚠️ Partial | ❌ None |

---

## Invitation Flow

### Current Flow (API-only)

```
Admin creates invitation
  │
  ▼
POST /api/workspace/invitations
  │
  ├─→ Returns raw token to admin
  │   (admin copies token manually)
  │
  ▼
Admin shares token via external channel
  (Slack, email, chat, etc.)
  │
  ▼
Recipient calls accept endpoint
  │
  ├─→ POST /api/workspace/invitations/[token]/accept
  │   (must be authenticated)
  │
  ▼
WorkspaceMember record created
  Recipient is now a workspace member
```

### What Works Well

- ✅ Secure token generation (SHA-256, timing-safe comparison)
- ✅ Automatic expiration (7 days)
- ✅ One-time use (no replay)
- ✅ Email binding (prevents hijacking)
- ✅ Role assignment (admin/editor/viewer)
- ✅ Resend capability (generates new token)
- ✅ Revoke capability (invalidates pending invitation)
- ✅ Full audit trail

### What's Missing

#### 1. No UI Components for Invitations

| Missing Component | Impact |
|-------------------|--------|
| Invite form dialog | Admin cannot invite from UI — must use API/Postman |
| Invitation list view | Admin cannot see pending invitations in UI |
| Accept invitation page | Recipient has no landing page for token |
| Token copy/share button | Admin must manually copy raw token |
| Invitation status badges | No visual indicator of pending/expired/accepted |

#### 2. No Email Delivery

| Gap | Impact |
|-----|--------|
| No email service integration | Tokens must be shared manually |
| No email templates | No branded invitation emails |
| No email verification | Cannot confirm email delivery |
| No email notifications | No alerts when invitations are accepted |

#### 3. No Bulk Operations

| Gap | Impact |
|-----|--------|
| No bulk invite | Admin must create invitations one-by-one |
| No CSV import | Cannot invite from spreadsheet |
| No invite link generation | No shareable URL with embedded token |

#### 4. No Invitation Analytics

| Gap | Impact |
|-----|--------|
| No acceptance rate tracking | Cannot measure invitation effectiveness |
| No time-to-accept metrics | Cannot identify slow adopters |
| No invitation funnel | Cannot see where people drop off |

---

## Pending Invitation Management

### API Capabilities

| Action | Endpoint | Status |
|--------|----------|--------|
| List pending | GET /invitations?status=pending | ✅ Working |
| Revoke | POST /invitations/[id]/revoke | ✅ Working |
| Resend | POST /invitations/[id]/resend | ✅ Working |
| View details | GET /invitations (includes inviter info) | ✅ Working |

### Missing UX

| Feature | Priority | Impact |
|---------|----------|--------|
| Dashboard widget for pending invitations | HIGH | Admin has no visibility |
| Invitation expiration countdown | MEDIUM | Admin doesn't know when invites expire |
| Acceptance notification | HIGH | Admin doesn't know when someone joins |
| Invitation history log | LOW | No audit trail visibility |

---

## Role Assignment

### Current Roles

| Role | Permissions | Can Invite |
|------|-------------|------------|
| **Owner** | Full access, billing, delete workspace | ✅ |
| **Admin** | Manage members, settings, documents | ✅ |
| **Editor** | Create/edit documents, chat | ❌ |
| **Viewer** | Read-only access | ❌ |

### Role UX Issues

| Issue | Impact |
|-------|--------|
| No role description tooltips | Users don't understand role differences |
| No role change confirmation | Accidental role escalation |
| No role-based UI filtering | All users see same UI regardless of role |
| Owner cannot transfer ownership | Permanent owner lock-in |

---

## Recommendations for Next Sprints

### Sprint 11 (HIGH Priority)

1. **Invitation UI Components**
   - Create `InviteDialog` component (email + role input)
   - Create `InvitationList` component (pending invitations table)
   - Create `/invite/[token]` accept page (landing page for recipients)
   - Add copy-to-clipboard button for token sharing
   - Add status badges (pending/expired/accepted/revoked)

2. **Email Delivery Foundation**
   - Integrate email service (Resend, SendGrid, or AWS SES)
   - Create invitation email template
   - Send email on invitation creation
   - Send notification on acceptance

### Sprint 12 (MEDIUM Priority)

3. **Bulk Operations**
   - CSV upload for bulk invitations
   - Multi-email input (comma-separated)
   - Bulk revoke/resend

4. **Invitation Analytics**
   - Acceptance rate dashboard widget
   - Time-to-accept metrics
   - Invitation funnel visualization

### Sprint 13 (LOW Priority)

5. **Advanced Features**
   - Invite link generation (URL with embedded token)
   - Custom message on invitation
   - Role change notifications
   - Ownership transfer
   - Invitation templates (reusable invitation configs)

---

## User Journey Map

### Current Journey (Admin Inviting a Colleague)

```
1. Admin opens terminal/API client
2. Admin calls POST /api/workspace/invitations
3. Admin receives raw token in JSON response
4. Admin copies token manually
5. Admin pastes token into Slack/email/chat
6. Colleague receives token
7. Colleague must already have a MimoNotes account
8. Colleague calls POST /api/workspace/invitations/[token]/accept
9. Colleague is now a workspace member

Pain points:
- Step 1-2: Requires API knowledge (no UI)
- Step 4-5: Manual copy/paste (no share button)
- Step 7: Requires pre-existing account awareness
- Step 8: No guided accept flow
```

### Target Journey (After UI Implementation)

```
1. Admin clicks "Invite Member" button
2. Admin enters email + role in dialog
3. Admin clicks "Send Invitation"
4. System sends email with accept link
5. Colleague receives email
6. Colleague clicks accept link
7. Colleague creates account (if needed)
8. Colleague is now a workspace member
9. Admin sees "Member joined" notification

Pain points: None (standard SaaS flow)
```

---

## Comparison with Industry Standards

| Feature | MimoNotes (Current) | Notion | Slack | Linear |
|---------|--------------------|---------|-------|--------|
| Invite by email | ✅ API only | ✅ UI | ✅ UI | ✅ UI |
| Pending invitations | ✅ API only | ✅ UI | ✅ UI | ✅ UI |
| Email delivery | ❌ Manual | ✅ | ✅ | ✅ |
| Bulk invite | ❌ | ✅ | ✅ | ❌ |
| Invite link | ❌ | ✅ | ✅ | ❌ |
| Role assignment | ✅ | ✅ | ✅ | ✅ |
| Accept page | ❌ | ✅ | ✅ | ✅ |
| Audit trail | ✅ | ✅ | ✅ | ✅ |

**Gap Summary:** MimoNotes has solid API-level team management but lacks the UI layer that makes it accessible to non-technical users. Priority should be on UI components and email delivery.

---

## Summary

| Area | Status | Priority |
|------|--------|----------|
| Invitation API | ✅ Complete | — |
| Invitation Security | ✅ Complete | — |
| Invitation UI | ❌ Not started | HIGH |
| Email Delivery | ❌ Not started | HIGH |
| Bulk Operations | ❌ Not started | MEDIUM |
| Analytics | ❌ Not started | LOW |
| Role UX | ⚠️ Partial | MEDIUM |
