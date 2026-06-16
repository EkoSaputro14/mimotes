# Lead Capture Implementation Report

**Date:** 2026-06-15
**Sprint:** Sprint 1 — Lead Capture V1
**Commit:** (pending)

---

## Summary

Lead Capture V1 implemented across 6 layers: Schema, Library, API, UI, Widget, Entitlements.

---

## Files Created (4)

| File | Purpose |
|------|---------|
| `app/api/widget/leads/route.ts` | GET — paginated lead listing (API key auth) |
| `app/api/widget/leads/export/route.ts` | GET — CSV download (API key auth) |
| `components/leads/leads-table.tsx` | Lead table with search, pagination, CSV export |
| `app/(admin)/settings/leads/page.tsx` | Leads settings page |

## Files Modified (8)

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added lead fields to Widget + WidgetConversation |
| `lib/widget.ts` | Added saveLeadData(), getLeads(), exportLeads() |
| `lib/entitlements.ts` | Added `lead_capture` feature to pro/enterprise |
| `app/api/widget/chat/route.ts` | Accept `lead` field, save to conversation |
| `app/api/widget/chat/stream/route.ts` | Accept `lead` field, save to conversation |
| `app/api/widget/config/route.ts` | Return leadCaptureEnabled + leadFields |
| `components/widget/widget-settings-form.tsx` | Lead capture toggle + field config |
| `components/settings/settings-nav.tsx` | Added Leads nav item |
| `app/dashboard/page.tsx` | Added Leads Captured stat card |
| `public/widget.js` | Pre-chat form + onLeadCapture hook |

---

## Schema Changes

### Widget Model (new fields)

```prisma
leadCaptureEnabled Boolean @default(false) @map("lead_capture_enabled")
leadFields         Json    @default("[]") @map("lead_fields")
```

### WidgetConversation Model (new fields)

```prisma
leadName     String?  @map("lead_name") @db.VarChar(200)
leadEmail    String?  @map("lead_email") @db.VarChar(300)
leadWhatsApp String?  @map("lead_whatsapp") @db.VarChar(30)
leadData     Json?    @map("lead_data")
```

---

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/widget/leads` | GET | API Key | Paginated lead listing |
| `/api/widget/leads/export` | GET | API Key | CSV download |
| `/api/widget/chat` | POST | Public | Accept `lead` field |
| `/api/widget/chat/stream` | POST | Public | Accept `lead` field |
| `/api/widget/config` | GET | Public | Return lead config |

---

## Features

### Lead Capture Form (widget.js)

- Pre-chat form shown when `leadCaptureEnabled = true`
- Dynamic fields from `leadFields` config
- Required field validation (red border on empty)
- `sessionStorage` persistence (don't re-ask per session)
- `onLeadCapture` SDK hook

### Dashboard

- "Leads Captured" stat card on dashboard
- Settings → Leads page with table view

### Settings

- Lead capture toggle in widget settings
- Field configuration (required/optional per field)
- Lead count display

---

## Build Verification

- ✅ `npx tsc --noEmit` — 0 errors
- ✅ `docker compose build app` — success
- ✅ `docker compose up -d app` — container running
- ✅ Health endpoint: 200 OK
