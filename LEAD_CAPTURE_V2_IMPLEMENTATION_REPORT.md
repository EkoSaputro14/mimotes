# Lead Capture V2 Implementation Report

**Date:** 2026-06-15
**Sprint:** Lead Capture V2
**Commit:** (pending)

---

## Summary

Lead Capture V2 implemented with intent detection, lead scoring, lead status workflow, and auto-trigger.

---

## Files Created (1)

| File | Purpose |
|------|---------|
| `lib/lead-intent.ts` | Intent detection + scoring library |

## Files Modified (8)

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added autoTriggerMessages, leadScore, leadStatus |
| `lib/widget.ts` | Added updateLeadStatus(), updateLeadScore() |
| `app/api/widget/chat/route.ts` | Intent detection, scoring, auto-trigger |
| `app/api/widget/chat/stream/route.ts` | Same for streaming |
| `app/api/widget/leads/route.ts` | PATCH handler, status filter |
| `app/api/widget/config/route.ts` | Return autoTriggerMessages |
| `components/leads/leads-table.tsx` | Score/status columns, filters |
| `app/dashboard/page.tsx` | Lead conversion metrics |

---

## V2 Features

### Intent Detection

Keywords detected (Indonesian + English):
- **harga**: harga, berapa, biaya, tarif, cost, price
- **beli**: beli, order, pesan, purchase, buy
- **booking**: booking, reservasi, janji, appointment
- **demo**: demo, presentasi, showcase, trial
- **hubungi**: hubungi, kontak, telepon, wa, whatsapp

### Lead Scoring

| Score | Condition |
|-------|-----------|
| high | Intent detected AND lead provided |
| medium | Intent detected OR lead provided |
| low | No intent, no lead |

### Lead Status Workflow

```
new → contacted → qualified → converted
                 → lost
```

### Auto-Trigger

- Configurable N messages per widget
- When N messages reached and no lead captured, bot prompts for contact info
- Prompt: "Sebelum melanjutkan, boleh saya tahu nama dan email Anda?"

---

## Test Results

| # | Test | Expected | Actual | Status |
|---|------|----------|--------|--------|
| 1 | Health | 200 | 200 | ✅ |
| 2 | Config autoTriggerMessages | 0 (default) | 0 | ✅ |
| 3 | Chat with intent (harga) | 200 | 200 | ✅ |
| 4 | DB lead score | high (intent+lead) | high | ✅ |
| 5 | DB lead status | new | new | ✅ |
| 6 | Leads API (no auth) | 401 | 401 | ✅ |
| 7 | Leads PATCH (no auth) | 401 | 401 | ✅ |
| 8 | DB schema V2 columns | present | present | ✅ |

---

## Build Verification

- ✅ `npx tsc --noEmit` — 0 errors
- ✅ `docker compose build app` — success
- ✅ `docker compose up -d app` — container running
- ✅ Health endpoint: 200 OK
