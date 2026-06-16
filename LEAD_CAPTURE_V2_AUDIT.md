# Lead Capture V2 Audit

**Date:** 2026-06-15
**Status:** AUDIT COMPLETE — Implementation starting

---

## V1 State (Exists)

| Component | Status | Location |
|-----------|--------|----------|
| leadCaptureEnabled | ✅ | Widget model |
| leadFields | ✅ | Widget model (JSON) |
| leadName/Email/WhatsApp/Data | ✅ | WidgetConversation model |
| saveLeadData() | ✅ | lib/widget.ts |
| getLeads() | ✅ | lib/widget.ts |
| exportLeads() | ✅ | lib/widget.ts |
| Chat lead handling | ✅ | /api/widget/chat (passive) |
| Leads API | ✅ | /api/widget/leads (GET only) |
| Leads UI | ✅ | components/leads/leads-table.tsx |

---

## V2 Gaps (Need to Build)

| Component | Priority | Description |
|-----------|----------|-------------|
| autoTriggerMessages | P0 | Configurable N messages before auto-prompt |
| Intent detection | P0 | Detect harga/beli/order/booking/demo/hubungi |
| Lead score | P0 | low/medium/high based on intent + engagement |
| Lead status | P0 | new/contacted/qualified/converted/lost |
| Status update API | P1 | PATCH endpoint for status/score |
| Dashboard analytics | P1 | Lead conversion metrics |
| Leads UI updates | P1 | Status/score columns, filters, badges |

---

## Implementation Plan

### Schema Changes

Add to Widget model:
```prisma
autoTriggerMessages Int @default(0) @map("auto_trigger_messages")
```

Add to WidgetConversation model:
```prisma
leadScore  String? @default("low") @map("lead_score") @db.VarChar(20)
leadStatus String? @default("new") @map("lead_status") @db.VarChar(20)
```

### Intent Detection

Keywords to detect:
- **harga**: harga, berapa, biaya, tarif, cost, price
- **beli**: beli, order, pesan, purchase, buy
- **booking**: booking, reservasi, janji, appointment
- **demo**: demo, presentasi, showcase, trial
- **hubungi**: hubungi, kontak, telepon, wa, whatsapp, contact

### Lead Scoring

- **high**: Intent detected (harga/beli/order/booking/demo/hubungi) + lead provided
- **medium**: Intent detected OR lead provided (not both)
- **low**: No intent, no lead

### Lead Status Workflow

```
new → contacted → qualified → converted
                 → lost
```

### Files to Create/Modify

| File | Action |
|------|--------|
| prisma/schema.prisma | Add autoTriggerMessages, leadScore, leadStatus |
| lib/widget.ts | Add updateLeadStatus(), updateLeadScore(), detectIntent(), scoreLead() |
| lib/lead-intent.ts | NEW — Intent detection + scoring logic |
| app/api/widget/chat/route.ts | Add auto-trigger + intent detection |
| app/api/widget/chat/stream/route.ts | Add auto-trigger + intent detection |
| app/api/widget/leads/route.ts | Add PATCH for status/score |
| components/leads/leads-table.tsx | Add status/score columns + filters |
| app/dashboard/page.tsx | Add lead conversion metrics |
