# WhatsApp Integration Architecture Spec

**Date:** 2026-06-15
**Status:** ARCHITECTURE SPEC — Not yet implemented
**Phase:** 3 (after Widget V1 + Lead Capture)

---

## Goal

Allow MimoNotes customers (SMEs) to connect their WhatsApp Business number to their chatbot, so end-users can chat with the same RAG-powered bot via WhatsApp that they'd encounter on the website widget.

---

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  WhatsApp User  │────▶│  WhatsApp Cloud   │────▶│  MimoNotes API  │
│  (+628xxx)      │◀────│  API (Meta)       │◀────│  /api/wa/webhook│
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
                                                  ┌───────────────┐
                                                  │  RAG Pipeline  │
                                                  │  (same as web) │
                                                  └───────┬───────┘
                                                          │
                                                          ▼
                                                  ┌───────────────┐
                                                  │  PostgreSQL    │
                                                  │  (workspace    │
                                                  │   isolated)    │
                                                  └───────────────┘
```

### Two Integration Options

| Option | Description | Pros | Cons |
|--------|-------------|------|------|
| **A. WhatsApp Cloud API (Meta)** | Direct integration with Meta's API | Official, reliable, no middleman | Requires Meta Business verification, per-conversation pricing |
| **B. WhatsApp Business API Provider (3rd party)** | Via Twilio, MessageBird, 360dialog, etc. | Easier setup, bundled pricing | Dependency on 3rd party, markup on pricing |

**Recommendation:** Start with **Option A (WhatsApp Cloud API)** — most control, lowest cost at scale. Add Option B later as alternative provider.

---

## WhatsApp Cloud API Integration

### Prerequisites (Customer Side)

1. Meta Business Account
2. WhatsApp Business Account (WABA)
3. Phone number verified
4. Meta App with `whatsapp_business_messaging` permission
5. Webhook URL registered

### Prerequisites (MimoNotes Side)

1. Meta App (one per MimoNotes environment)
2. Webhook verification endpoint
3. Message sending via Cloud API
4. Template message management

### Message Flow

```
1. User sends message to customer's WhatsApp number
2. Meta delivers webhook POST to MimoNotes /api/wa/webhook
3. MimoNotes validates signature (X-Hub-Signature-256)
4. Extract: phone number, message text, message ID
5. Resolve workspace from WhatsApp phone number mapping
6. Run RAG pipeline (same as widget chat)
7. Send response via WhatsApp Cloud API POST
8. Store conversation in WidgetConversation (channel=whatsapp)
```

### Webhook Endpoint

```
POST /api/wa/webhook
Headers:
  X-Hub-Signature-256: sha256=xxx  (HMAC-SHA256 of body)
  
Body:
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "628xxxx",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "messages": [{
          "from": "628yyyy",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "type": "text",
          "text": { "body": "What is the return policy?" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Response Sending

```
POST https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "628yyyy",
  "type": "text",
  "text": { "body": "Based on our return policy, items can be returned within 30 days..." }
}
```

---

## Data Model

### New Schema

```prisma
model WhatsAppConnection {
  id              String   @id @default(uuid())
  workspaceId     String   @map("workspace_id")
  phoneNumberId   String   @map("phone_number_id") @db.VarChar(50)
  phoneNumber     String   @map("phone_number") @db.VarChar(20)
  wabaId          String   @map("waba_id") @db.VarChar(50)
  accessToken     String   @map("access_token") @db.Text  // encrypted
  verifyToken     String   @map("verify_token") @db.VarChar(100)
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  @@unique([workspaceId, phoneNumberId])
  @@map("whatsapp_connections")
}

// Extend existing WidgetConversation
model WidgetConversation {
  // ... existing fields ...
  channel     String   @default("widget") @db.VarChar(20)
  // "widget" | "whatsapp" | "api"
  whatsappFrom String?  @map("whatsapp_from") @db.VarChar(20)
  // phone number of the WhatsApp user
}
```

### Phone Number → Workspace Mapping

When a WhatsApp message arrives, MimoNotes needs to know which workspace it belongs to:

```
Webhook receives message to phone_number_id "123456"
  → Query: SELECT workspace_id FROM whatsapp_connections WHERE phone_number_id = '123456'
  → Resolve workspace → run RAG pipeline
```

---

## API Design

### Connect WhatsApp (Authenticated)

```
POST /api/workspace/whatsapp/connect
Authorization: Bearer mk_liv...n{
  "phoneNumberId": "123456789",
  "wabaId": "WABA_xxx",
  "accessToken": "EAAxxx",
  "verifyToken": "my_verify_token"
}

Response:
{
  "id": "wa_xxx",
  "phoneNumber": "+628xxxx",
  "isActive": true
}
```

### List Connections

```
GET /api/workspace/whatsapp/connections
Authorization: Bearer mk_liv...n{
  "connections": [
    {
      "id": "wa_xxx",
      "phoneNumber": "+628xxxx",
      "isActive": true,
      "messageCount": 1420,
      "lastMessageAt": "2026-06-15T10:30:00Z"
    }
  ]
}
```

### Webhook Verification (GET)

Meta sends a GET request to verify the webhook:

```
GET /api/wa/webhook?hub.mode=subscribe&hub.challenge=CHALLENGE&hub.verify_token=TOKEN

Response: CHALLENGE (if token matches)
```

### Webhook Handler (POST)

```
POST /api/wa/webhook

// 1. Validate X-Hub-Signature-256
// 2. Parse message
// 3. Resolve workspace from phone_number_id
// 4. Create/get conversation (channel=whatsapp)
// 5. Save user message
// 6. Run RAG pipeline
// 7. Send response via Cloud API
// 8. Save assistant message
// 9. Track usage
```

---

## Rate Limiting & Pricing

### Meta's Pricing (as of 2026)

- **User-initiated conversations** (user messages first): ~$0.005–0.08 per conversation (24h window)
- **Business-initiated conversations** (template messages): ~$0.01–0.15 per conversation
- **Free tier**: 1,000 conversations/month

### MimoNotes Pricing Strategy

- **Free plan**: 100 WhatsApp conversations/month
- **Pro plan**: 5,000 WhatsApp conversations/month
- **Enterprise plan**: Unlimited (pass-through Meta costs)
- Rate limit: 60 messages/min per phone number

### Cost Tracking

```prisma
model WorkspaceUsage {
  // ... existing fields ...
  whatsappConversations Int @default(0) @map("whatsapp_conversations")
  whatsappMessages      Int @default(0) @map("whatsapp_messages")
}
```

---

## Security

### Webhook Signature Verification

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(body: string, signature: string, appSecret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expectedSignature}`),
    Buffer.from(signature)
  );
}
```

### Access Token Storage

- WhatsApp access tokens are encrypted at rest (AES-256-GCM)
- Decrypted only during webhook processing
- Never logged or returned in API responses
- Rotate via `/api/workspace/whatsapp/rotate-token`

### Rate Limiting

- Per phone number: 60 messages/min
- Per workspace: 1,000 messages/day (free), 50,000/day (pro)
- Global: 10,000 messages/min across all connections

---

## Conversation Sync

### Unified Conversation Model

Widget and WhatsApp conversations use the same `WidgetConversation` model with `channel` discriminator:

```
Widget conversation:
  channel = "widget"
  visitorId = "v_xxx" (browser UUID)

WhatsApp conversation:
  channel = "whatsapp"
  whatsappFrom = "+628xxx" (phone number)
  visitorId = null
```

### Dashboard View

The widget leads dashboard shows both channels:

```
┌─────────────────────────────────────────────────┐
│ Conversations                        [Export CSV]│
│                                                   │
│ [All] [Widget] [WhatsApp] [API]                   │
│                                                   │
│ Channel  │ Visitor      │ Messages │ Date        │
│ Widget   │ v_abc123     │ 5        │ Jun 15      │
│ WhatsApp │ +628****7890 │ 8        │ Jun 15      │
│ Widget   │ v_def456     │ 3        │ Jun 14      │
└─────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 3A: Basic WhatsApp Integration (2 weeks)

- [ ] Schema: WhatsAppConnection model
- [ ] Webhook: GET verification endpoint
- [ ] Webhook: POST handler with signature verification
- [ ] Message: send response via Cloud API
- [ ] Conversation: store in WidgetConversation (channel=whatsapp)
- [ ] Rate limiting: per phone number
- [ ] Connect UI: settings page for WhatsApp connection

### Phase 3B: Advanced Features (1 week)

- [ ] Media messages: images, documents (forward to RAG parser)
- [ ] Template messages: business-initiated conversations
- [ ] Conversation history: retrieve WhatsApp conversations
- [ ] Lead capture: auto-capture phone number as lead
- [ ] Analytics: WhatsApp-specific metrics

### Phase 3C: Multi-Provider (1 week)

- [ ] Provider abstraction: `WhatsAppProvider` interface
- [ ] Twilio provider: alternative to Cloud API
- [ ] 360dialog provider: European-friendly option
- [ ] Provider selection per workspace

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single Meta App vs per-customer | Single MimoNotes App | Simpler, customer just connects their WABA |
| Encrypt access tokens | Yes, AES-256-GCM | Same pattern as API keys |
| Store conversations in WidgetConversation | Yes, with channel field | Unified dashboard, shared RAG pipeline |
| Streaming responses | No (WhatsApp doesn't support SSE) | Send complete response after RAG completes |
| Media message handling | Forward to RAG parser | Images→OCR, PDFs→text extraction |
| Webhook retry | 3 retries with exponential backoff | Handle transient failures |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Meta account suspension | HIGH | Follow Meta's policies strictly, no spam |
| Access token leak | CRITICAL | Encrypted at rest, never in logs, rotate regularly |
| Cost explosion | MEDIUM | Per-workspace limits, usage alerts |
| Message delivery failure | MEDIUM | Retry with backoff, dead letter queue |
| Rate limit from Meta | LOW | Respect Meta's rate limits (80 msg/sec) |
