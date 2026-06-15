# ADR-EMAIL-ARCHITECTURE: Email Delivery System

**Status:** Accepted  
**Date:** 2026-06-13  
**Deciders:** Sprint 12 — Email Delivery Foundation  
**Technical Story:** Sprint 12 of MimoNotes Collaboration Features

## Context

Sprint 10 implemented a token-based invitation system that required manual token sharing (copy/paste, chat). Sprint 11 built the Team Management UI but the acceptance flow still depended on manual token delivery. For production readiness, MimoNotes needs automated email delivery so that:

- Invitation emails are sent automatically when an admin creates an invitation
- Accept links are delivered directly to the recipient's inbox
- The system must work in development (no email config required)
- The system must be extensible for future email needs (password reset, notifications)

The invitation system already generates raw tokens and accept URLs (`/invite/{rawToken}`). What's missing is a reliable, configurable email delivery layer.

## Decision

Implement a **provider-abstraction email system** with Resend as the primary provider, a console fallback for development, and a pluggable architecture for future providers (SMTP, SendGrid, AWS SES).

### Design Choices

| Choice | Decision | Rationale |
|--------|----------|-----------|
| **Architecture** | Provider abstraction via `EmailProvider` interface | Easy to swap providers without changing callers |
| **Primary provider** | Resend (API-based) | Zero-config, generous free tier, modern DX, uses native `fetch` |
| **Dev fallback** | Console provider (logs to stdout) | No email config needed for local development |
| **SMTP support** | Placeholder (requires nodemailer) | Available for self-hosted deployments |
| **Retry mechanism** | 3 attempts, exponential backoff (1s, 2s, 4s) | Handles transient failures without blocking |
| **Email sending** | Non-blocking (async, fire-and-forget) | Invitation API returns immediately; email is best-effort |
| **Templates** | HTML + plain text dual-format | Supports all email clients, accessibility |
| **XSS prevention** | HTML escaping on all user-provided data | Prevents injection in email content |
| **Logging** | Audit logs table | Unified audit trail for email delivery |
| **Dependencies** | Zero new npm packages | Resend uses native `fetch` API |

### Architecture

```
┌──────────────────────────────────────────────────┐
│           Invitation API Route                   │
│  POST /api/workspace/invitations                 │
│  → create invitation record                      │
│  → fire-and-forget email send (non-blocking)     │
└──────────────────┬───────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│         lib/email/index.ts                        │
│  getEmailProvider() → singleton factory           │
│  sendEmail() → retry wrapper (3 attempts)         │
│  sendInvitationEmail() → convenience wrapper      │
│  loadEmailConfig() → env var loading              │
│  validateEmailConfig() → config validation        │
└──────────────────┬───────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
┌───────▼──┐ ┌────▼─────┐ ┌──▼──────────┐
│  Resend  │ │  SMTP    │ │  Console    │
│ Provider │ │ Provider │ │  Provider   │
│ (fetch)  │ │(placeholder)│ │ (stdout)  │
└──────────┘ └──────────┘ └─────────────┘
        │          │          │
        └──────────┼──────────┘
                   │
┌──────────────────▼───────────────────────────────┐
│         lib/email/logging.ts                      │
│  logEmailSend() → audit_logs table                │
│  getEmailHistory() → query for workspace          │
└──────────────────────────────────────────────────┘
```

### Provider Interface

```typescript
interface EmailProvider {
  send(params: SendEmailParams): Promise<SendEmailResult>;
  isAvailable(): boolean;
}

interface SendEmailParams {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: string[];
}

interface SendEmailResult {
  id: string;
  provider: string;
  status: 'sent' | 'queued' | 'failed';
  error?: string;
}
```

### Email Flow

```
  Admin Creates Invitation
         │
         ▼
  ┌──────────────────┐
  │ Invitation Record │ ──→ DB (workspace_invitations)
  │ + raw token       │
  └────────┬─────────┘
           │ (non-blocking)
           ▼
  ┌──────────────────┐
  │ sendInvitation    │
  │ Email()           │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ loadEmailConfig() │
  │ → provider type   │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │ getEmailProvider │
  │ () → singleton    │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐     ┌──────────────────┐
  │ sendEmail()      │────▶│ Retry Logic      │
  │ with retry       │     │ 3 attempts       │
  └──────────────────┘     │ exp. backoff     │
                           └──────────────────┘
           │
           ▼
  ┌──────────────────┐
  │ logEmailSend()   │ ──→ audit_logs table
  └──────────────────┘
```

## Alternatives Considered

### 1. Nodemailer (SMTP Direct)
- **Pros:** Full SMTP control, supports any email server, battle-tested
- **Cons:** Requires SMTP credentials, heavier dependency, no built-in deliverability tracking
- **Verdict:** Kept as a future provider option (placeholder implemented). Resend preferred for cloud deployments.

### 2. SendGrid
- **Pros:** Industry standard, robust API, good deliverability, free tier (100/day)
- **Cons:** Requires API key, vendor lock-in, more complex API than Resend
- **Verdict:** Could be added as an alternative provider in the future. Resend chosen for simpler DX.

### 3. AWS SES
- **Pros:** Cost-effective at scale, integrated with AWS ecosystem
- **Cons:** Requires AWS setup, more complex auth (IAM), sandbox mode limitations
- **Verdict:** Deferred. Not needed at current scale. Provider abstraction makes it easy to add later.

### 4. Mailgun
- **Pros:** Good API, reasonable pricing, strong deliverability
- **Cons:** Paid from start (no free tier), vendor lock-in
- **Verdict:** Not chosen. Resend has better free tier for development.

### 5. Inline Email Sending (No Abstraction)
- **Pros:** Simpler initial code
- **Cons:** Hard to swap providers, harder to test, tight coupling
- **Verdict:** Rejected. Abstraction adds minimal complexity but significant flexibility.

## Consequences

### Positive
- **Zero new dependencies** — Resend uses native `fetch` API
- **Developer-friendly** — Console provider works out of the box in development
- **Easy provider swap** — Change `EMAIL_PROVIDER` env var, no code changes
- **Resilient** — 3-attempt retry with exponential backoff handles transient failures
- **Non-blocking** — Invitation API responds immediately; email is fire-and-forget
- **Auditable** — All email attempts logged to `audit_logs` table
- **Secure** — HTML escaping prevents XSS in email content
- **Testable** — `resetEmailProvider()` allows singleton reset in tests
- **Extensible** — New providers just implement `EmailProvider` interface

### Negative
- **Resend dependency** — Primary provider requires Resend account for production
- **No email tracking** — Open/click tracking not implemented (future enhancement)
- **No SMTP production support** — SMTP provider is placeholder only (requires nodemailer)
- **No email queue** — Emails are sent synchronously within the request (mitigated by non-blocking caller)

### Risks
- **Resend rate limits:** Free tier limited to 100 emails/day, 3000/month. Mitigated by switching to paid plan or alternative provider.
- **Email deliverability:** New domains may hit spam filters. Mitigated by proper DNS setup (SPF, DKIM, DMARC).
- **Console provider in production:** If `EMAIL_PROVIDER` is misconfigured, emails go to stdout. Mitigated by `validateEmailConfig()`.

## Migration Plan

1. Add environment variables to `.env.local` and `.env.example`
2. Set `EMAIL_PROVIDER=console` for development (default)
3. Set `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` for production
4. Invitations API route now auto-sends emails (non-breaking change)

## Rollback Plan

1. Set `EMAIL_PROVIDER=console` — emails logged to console, no delivery
2. Remove email sending from invitations route (optional)
3. Remove `lib/email/` directory (optional — no callers outside invitations route)

## References

- [Resend API Documentation](https://resend.com/docs/introduction)
- [Nodemailer Documentation](https://nodemailer.com/)
- [OWASP — Email Security](https://cheatsheetseries.owasp.org/cheatsheets/Email_Security_Cheat_Sheet.html)
- [RFC 5322 — Internet Message Format](https://tools.ietf.org/html/rfc5322)
