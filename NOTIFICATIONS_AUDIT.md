# NOTIFICATIONS_AUDIT.md — Notifications & Analytics Sprint

**Date:** 2026-06-08
**MimoNotes Platform — Pre-Implementation Audit**

---

## 1. Executive Summary

Audit of current notification and analytics capabilities before implementing:
- **Feature 1:** Lead Notifications (Email, Telegram, Discord Webhook)
- **Feature 2:** Analytics Dashboard (Lead Metrics)
- **Feature 3:** Dashboard Alerts (New/High/Converted Leads)

---

## 2. Current State Assessment

### 2.1 Notification Infrastructure

| Component | Status | Gap |
|-----------|--------|-----|
| Notification Settings Page | ✅ EXISTS | localStorage-only, no server-side delivery |
| Email Service | ❌ MISSING | No SMTP/nodemailer configured |
| Telegram Bot Integration | ❌ MISSING | No webhook/bot token for lead alerts |
| Discord Webhook | ❌ MISSING | No webhook endpoint configured |
| Notification DB Model | ❌ MISSING | No `NotificationConfig` in schema |
| Notification API | ❌ MISSING | No server-side settings endpoint |

**Verdict:** Notification settings UI exists but is purely client-side (localStorage). No actual delivery channel is implemented.

### 2.2 Analytics Infrastructure

| Component | Status | Gap |
|-----------|--------|-----|
| `lib/analytics.ts` | ✅ EXISTS | General analytics events (chat, upload, etc.) |
| Lead Analytics API | ❌ MISSING | No endpoint for lead-specific metrics |
| Lead Analytics Dashboard | ❌ MISSING | No page for lead conversion funnel |
| Conversion Rate Tracking | ❌ MISSING | No conversion rate calculation |
| Intent Distribution | ❌ MISSING | No intent aggregation |
| Knowledge Gap Analysis | ❌ MISSING | No unanswered query tracking |

**Verdict:** General analytics exists but lead-specific analytics (conversion, intent, gaps) are not implemented.

### 2.3 Dashboard Alerts

| Component | Status | Gap |
|-----------|--------|-----|
| Dashboard Lead Count | ✅ EXISTS | Basic "Leads Captured" stat card |
| New Lead Alerts | ❌ MISSING | No real-time alert for new leads |
| High Lead Alerts | ❌ MISSING | No priority alert for high-score leads |
| Converted Lead Alerts | ❌ MISSING | No success notification |
| Lead Alert Component | ❌ MISSING | No dedicated alert widget |

**Verdict:** Dashboard shows total lead count but lacks actionable alerts for specific lead events.

---

## 3. Existing Code Assets

### 3.1 Lead Intent System (`lib/lead-intent.ts`)
- ✅ Intent detection (harga, beli, order, booking, demo, hubungi)
- ✅ Lead scoring (low, medium, high)
- ✅ Lead status (new, contacted, qualified, converted, lost)
- ✅ Auto-trigger logic

### 3.2 Widget Chat Route (`app/api/widget/chat/route.ts`)
- ✅ Intent detection integrated
- ✅ Lead scoring integrated
- ✅ Auto-trigger prompt integrated
- ❌ No notification trigger on high lead / conversion

### 3.3 Leads Table (`components/leads/leads-table.tsx`)
- ✅ Lead listing with filters
- ✅ Status update (PATCH API)
- ✅ CSV export
- ✅ Score/Status color coding

### 3.4 Dashboard (`app/dashboard/page.tsx`)
- ✅ Lead count stat card
- ✅ Leads by status aggregation
- ❌ No alert cards for specific lead events

### 3.5 Entitlements (`lib/entitlements.ts`)
- ✅ `lead_capture` feature gated to pro/enterprise
- ✅ Feature validation utilities

---

## 4. Database Schema Analysis

### 4.1 WidgetConversation Model
```prisma
model WidgetConversation {
  id          String   @id @default(uuid())
  widgetId    String
  workspaceId String
  visitorId   String?
  leadName    String?
  leadEmail   String?
  leadWhatsApp String?
  leadScore   String?  @default("low")    // low|medium|high
  leadStatus  String?  @default("new")    // new|contacted|qualified|converted|lost
  // ... other fields
}
```

**Gaps:**
- ❌ No `NotificationConfig` model for storing channel preferences
- ❌ No `NotificationLog` model for tracking sent notifications
- ❌ No `intent` field stored on conversations (detected but not persisted)

### 4.2 Required Schema Additions
1. `NotificationConfig` — stores email/telegram/discord settings per workspace
2. `NotificationLog` — tracks sent notifications (for dedup & audit)
3. `intent` field on `WidgetConversation` — persist detected intent

---

## 5. Implementation Gaps Summary

### Feature 1: Lead Notifications

| Gap | Severity | Effort |
|-----|----------|--------|
| No email service | HIGH | Medium |
| No Telegram bot integration | HIGH | Low |
| No Discord webhook | HIGH | Low |
| No notification config model | HIGH | Low |
| No notification trigger in chat route | HIGH | Low |
| Settings page is localStorage-only | MEDIUM | Medium |

### Feature 2: Analytics Dashboard

| Gap | Severity | Effort |
|-----|----------|--------|
| No lead analytics API | HIGH | Medium |
| No conversion rate calculation | MEDIUM | Low |
| No intent distribution tracking | MEDIUM | Low |
| No knowledge gap analysis | LOW | Medium |
| No analytics dashboard page | HIGH | Medium |

### Feature 3: Dashboard Alerts

| Gap | Severity | Effort |
|-----|----------|--------|
| No lead alert component | MEDIUM | Low |
| No real-time alert logic | MEDIUM | Medium |
| Dashboard has basic count only | LOW | Low |

---

## 6. Implementation Plan

### Phase 1: Notification Service (Feature 1)
1. Add `NotificationConfig` and `NotificationLog` models
2. Create `lib/notifications.ts` — Email/Telegram/Discord service
3. Create `/api/notifications/settings` endpoint
4. Update notification settings UI with channel configuration
5. Update widget chat route to trigger notifications
6. Run Prisma migration

### Phase 2: Analytics Dashboard (Feature 2)
1. Create `/api/analytics/leads` endpoint
2. Build lead analytics dashboard page
3. Add conversion rate, intent distribution, knowledge gaps
4. Integrate with existing analytics infrastructure

### Phase 3: Dashboard Alerts (Feature 3)
1. Create `lead-alerts.tsx` component
2. Update dashboard page with alert cards
3. Add real-time lead event indicators

### Phase 4: Testing & Reports
1. Build & deploy
2. Run Playwright E2E tests
3. Run security testing
4. Generate implementation, E2E, and go-live reports

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Email delivery failures | Medium | Medium | Fallback to in-app only, retry logic |
| Telegram bot token exposure | Low | High | Store in DB, not env vars |
| Discord webhook abuse | Low | Medium | Rate limit per workspace |
| Schema migration failure | Low | High | Test migration locally first |
| Notification spam | Medium | Medium | Dedup by lead ID + event type |

---

## 8. Recommendation

**GO** for implementation. All required infrastructure exists in the codebase:
- Lead intent/scoring/status system is complete
- Dashboard has extensible stat card architecture
- Settings page has notification UI scaffold
- Prisma schema is ready for extension

**Estimated effort:** 4-6 implementation units (15-min rule)

---

*Generated by ECC Audit Process — MimoNotes Platform*
