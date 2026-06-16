# MimoNotes → Embeddable Chatbot Platform: Implementation Roadmap

**Date:** 2026-06-15
**Status:** ROADMAP — No code changes yet

---

## Vision

Transform MimoNotes from an "AI Knowledge Workspace" into an **Embeddable Chatbot Platform for SMEs** — where the primary value proposition is: "Upload your documents, get a chatbot you can embed on your website and connect to WhatsApp."

---

## Current State Summary

**70% ready.** Core infrastructure exists:

- ✅ Widget DB models, public API, embeddable JS script, admin UI
- ✅ RAG pipeline (hybrid search, confidence-based refusal, streaming)
- ✅ Multi-tenant workspace isolation (PostgreSQL RLS)
- ✅ API key platform with usage tracking
- ✅ Billing/Stripe integration
- ✅ Feature gating per plan

**Key gaps:** Widget chat is non-streaming, no lead capture, `/api/v1/chat` is placeholder, no WhatsApp integration.

---

## Phase 1: Widget V1 Hardening (Week 1-2)

**Goal:** Make the existing widget production-ready for SME self-serve.

| # | Task | Effort | Priority | Status |
|---|------|--------|----------|--------|
| 1.1 | Wire `/api/v1/chat` to RAG pipeline | 1 day | P0 | NOT STARTED |
| 1.2 | SSE streaming for `POST /api/widget/chat/stream` | 2 days | P0 | NOT STARTED |
| 1.3 | widget.js: consume SSE stream | 2 days | P0 | NOT STARTED |
| 1.4 | Conversation history endpoints | 1 day | P1 | NOT STARTED |
| 1.5 | widget.js: show previous conversations | 1 day | P1 | NOT STARTED |
| 1.6 | Widget JS SDK v2 (versioned, events, a11y) | 2 days | P2 | NOT STARTED |

**Deliverable:** Widget chat streams responses in real-time. Visitors can see conversation history. API consumers can use `/api/v1/chat` with full RAG.

**Files to modify:**
- `app/api/widget/chat/route.ts` — add streaming variant
- `app/api/v1/chat/route.ts` — wire to RAG
- `public/widget.js` — SSE consumption, conversation history
- `lib/widget.ts` — conversation retrieval functions

---

## Phase 2: Lead Capture (Week 3-4)

**Goal:** Capture visitor contact info through the widget for SME lead generation.

| # | Task | Effort | Priority | Status |
|---|------|--------|----------|--------|
| 2.1 | Schema migration: lead fields on Widget + WidgetConversation | 0.5 day | P0 | NOT STARTED |
| 2.2 | API: lead validation on `POST /api/widget/chat` | 1 day | P0 | NOT STARTED |
| 2.3 | API: `GET /api/widget/leads` endpoint | 1 day | P1 | NOT STARTED |
| 2.4 | API: CSV export endpoint | 0.5 day | P1 | NOT STARTED |
| 2.5 | widget.js: pre-chat form UI | 1.5 days | P1 | NOT STARTED |
| 2.6 | Admin UI: leads tab in widget settings | 1.5 days | P2 | NOT STARTED |
| 2.7 | Tests: lead capture flow | 1 day | P2 | NOT STARTED |

**Deliverable:** SMEs can configure a pre-chat form, see captured leads in dashboard, export to CSV.

**Files to create/modify:**
- `prisma/schema.prisma` — Widget + WidgetConversation lead fields
- `app/api/widget/chat/route.ts` — lead validation
- `app/api/widget/leads/route.ts` — NEW: lead retrieval + export
- `public/widget.js` — pre-chat form
- `components/widget/widget-settings-form.tsx` — lead config + leads tab

---

## Phase 3: WhatsApp Integration (Week 5-8)

**Goal:** Connect chatbot to WhatsApp Business for SME customer support.

| # | Task | Effort | Priority | Status |
|---|------|--------|----------|--------|
| 3.1 | Schema: WhatsAppConnection model | 0.5 day | P0 | NOT STARTED |
| 3.2 | Webhook: GET verification endpoint | 0.5 day | P0 | NOT STARTED |
| 3.3 | Webhook: POST handler + signature verification | 2 days | P0 | NOT STARTED |
| 3.4 | WhatsApp Cloud API: send message function | 1 day | P0 | NOT STARTED |
| 3.5 | Conversation storage (channel=whatsapp) | 1 day | P1 | NOT STARTED |
| 3.6 | Connect UI: WhatsApp settings page | 1.5 days | P1 | NOT STARTED |
| 3.7 | Rate limiting: per phone number + per workspace | 1 day | P1 | NOT STARTED |
| 3.8 | Media message handling (images→OCR, docs→parser) | 2 days | P2 | NOT STARTED |
| 3.9 | Template message support | 1 day | P2 | NOT STARTED |
| 3.10 | Multi-provider abstraction (Twilio, 360dialog) | 3 days | P3 | NOT STARTED |

**Deliverable:** SMEs can connect their WhatsApp Business number and have the same RAG chatbot respond to WhatsApp messages.

**Files to create:**
- `app/api/wa/webhook/route.ts` — NEW: webhook handler
- `app/api/workspace/whatsapp/connect/route.ts` — NEW: connection management
- `lib/whatsapp/` — NEW: Cloud API client, message sending, signature verification
- `components/settings/whatsapp-settings.tsx` — NEW: connection UI

---

## Landing Page Pivot

**Current positioning:** "AI Knowledge Workspace" (upload docs, ask questions)
**New positioning:** "Embeddable Chatbot for Your Website" (upload docs, get a chatbot, embed it)

### Landing Page Changes

| Section | Current | New |
|---------|---------|-----|
| Hero | "Ask questions. Get cited answers." | "Your docs. Your chatbot. Any website." |
| Subtitle | "Upload any document..." | "Upload your documents, get an AI chatbot you can embed anywhere." |
| Features | Ask, Verify, Share | Embed, Capture Leads, Connect WhatsApp |
| How It Works | Upload → Ask → Verify | Upload → Train → Embed → Capture |
| Pricing | Document limits | Conversation limits + widget features |
| CTA | "Get started free" | "Create your chatbot" |

### New Sections to Add

1. **Widget Preview** — live demo of widget on a sample website
2. **Integration Showcase** — widget embed, WhatsApp, API
3. **Lead Generation** — show captured leads dashboard
4. **Customer Stories** — SME testimonials

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Widget embed rate | >80% of customers | Track widget.js loads vs active subscriptions |
| Lead capture rate | >30% of widget conversations | Leads with email / total conversations |
| Widget response time | <500ms to first token | p95 latency from widget chat endpoint |
| WhatsApp adoption | >50% of Pro+ customers | WhatsApp connections / Pro+ subscriptions |
| Customer satisfaction | <5% refusal rate | "I don't know" responses / total widget messages |

---

## Technical Debt to Address

| Item | Impact | When |
|------|--------|------|
| Rate limiting uses in-memory Map | Won't survive horizontal scaling | Before Phase 3 |
| Widget CRUD routes reference `/api/widgets/*` | Routes exist but may need verification | Phase 1 |
| `custom_branding` feature not explicitly checked | Widget theme serves this role | Phase 2 |
| Widget test file has 2 known failures | Prisma client initialization | Phase 1 |

---

## Document Index

| Document | Description | Status |
|----------|-------------|--------|
| `CHATBOT_PLATFORM_AUDIT.md` | Current architecture audit | ✅ Complete |
| `CHATBOT_WIDGET_V1_SPEC.md` | Widget V1 feature spec | ✅ Complete |
| `LEAD_CAPTURE_SPEC.md` | Lead capture feature spec | ✅ Complete |
| `WHATSAPP_ARCHITECTURE_SPEC.md` | WhatsApp integration architecture | ✅ Complete |
| `IMPLEMENTATION_ROADMAP.md` | This document | ✅ Complete |
