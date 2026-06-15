# Lead Capture Audit

**Date:** 2026-06-15
**Status:** AUDIT COMPLETE — Implementation starting

---

## Current State

### What Exists ✅

| Component | Status | Location |
|-----------|--------|----------|
| Widget model | ✅ Complete | `prisma/schema.prisma` — Widget, WidgetConversation, WidgetMessage |
| Widget CRUD | ✅ Complete | `lib/widget.ts` — create, list, update, delete, keys |
| Widget public API | ✅ Complete | `/api/widget/config`, `/api/widget/chat`, `/api/widget/chat/stream` |
| Widget admin API | ✅ Complete | `/api/widgets/create`, `/api/widgets/list`, `/api/widgets/update` |
| Widget settings UI | ✅ Complete | `components/widget/widget-settings-form.tsx` |
| Widget embed script | ✅ Complete | `public/widget.js` — 423 lines, v2 SDK |
| Feature gating | ✅ Complete | `lib/entitlements.ts` — 9 features, 3 plans |
| Usage tracking | ✅ Complete | `lib/usage.ts` — track functions, limits |
| Settings structure | ✅ Complete | 11 settings pages with sidebar nav |
| Dashboard | ✅ Complete | 13 dashboard components |

### What's Missing ❌

| Component | Status | Impact |
|-----------|--------|--------|
| Lead capture fields on Widget | ❌ Missing | Can't configure lead capture |
| Lead fields on WidgetConversation | ❌ Missing | Can't store lead data |
| Lead API endpoints | ❌ Missing | Can't retrieve/export leads |
| Lead dashboard UI | ❌ Missing | Can't view leads |
| Widget pre-chat form | ❌ Missing | Can't collect leads |
| Auto-trigger after N messages | ❌ Missing | Can't auto-collect |
| Lead analytics | ❌ Missing | Can't track conversion |

---

## Implementation Plan

### Phase 1: Schema (Prisma)

Add to `Widget` model:
```prisma
leadCaptureEnabled Boolean @default(false) @map("lead_capture_enabled")
leadFields         Json    @default("[]") @map("lead_fields")
```

Add to `WidgetConversation` model:
```prisma
leadName     String?  @map("lead_name") @db.VarChar(200)
leadEmail    String?  @map("lead_email") @db.VarChar(300)
leadWhatsApp String?  @map("lead_whatsapp") @db.VarChar(30)
leadData     Json?    @map("lead_data")
```

### Phase 2: Library (`lib/widget.ts`)

Add functions:
- `saveLeadData(conversationId, leadData)` — save lead to conversation
- `getLeads(workspaceId, widgetId, page, perPage)` — paginated lead list
- `exportLeads(workspaceId, widgetId)` — CSV generator

### Phase 3: API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/widget/chat` | POST | Accept `lead` field, validate, save |
| `/api/widget/chat/stream` | POST | Accept `lead` field, validate, save |
| `/api/widget/config` | GET | Return `leadCaptureEnabled`, `leadFields` |
| `/api/widget/leads` | GET | Paginated lead list (auth) |
| `/api/widget/leads/export` | GET | CSV download (auth) |

### Phase 4: UI Components

| Component | Purpose |
|-----------|---------|
| `widget-settings-form.tsx` | Add lead capture toggle + config |
| `components/leads/leads-table.tsx` | Lead list with search + export |
| `app/(admin)/settings/leads/page.tsx` | Leads settings page |
| `components/settings/settings-nav.tsx` | Add Leads nav item |
| `app/dashboard/page.tsx` | Add lead stats |

### Phase 5: Widget Integration

| Component | Purpose |
|-----------|---------|
| `public/widget.js` | Pre-chat form, lead submission |

### Phase 6: Entitlements

Add `lead_capture` feature to `ALL_FEATURES`, assign to `pro` and `enterprise` plans.

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/api/widget/leads/route.ts` | Lead listing API |
| `app/api/widget/leads/export/route.ts` | CSV export API |
| `components/leads/leads-table.tsx` | Lead table component |
| `app/(admin)/settings/leads/page.tsx` | Leads settings page |

## Files to Modify

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add lead fields to Widget + WidgetConversation |
| `lib/widget.ts` | Add lead CRUD functions |
| `lib/entitlements.ts` | Add `lead_capture` feature |
| `lib/usage.ts` | Add lead tracking |
| `app/api/widget/chat/route.ts` | Accept lead field |
| `app/api/widget/chat/stream/route.ts` | Accept lead field |
| `app/api/widget/config/route.ts` | Return lead config |
| `components/widget/widget-settings-form.tsx` | Lead capture UI |
| `components/settings/settings-nav.tsx` | Add Leads nav |
| `app/dashboard/page.tsx` | Add lead stats |
| `public/widget.js` | Pre-chat form |
