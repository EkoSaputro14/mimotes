# Chatbot Widget V1 Spec

**Date:** 2026-06-15
**Status:** SPEC — Not yet implemented
**Dependencies:** Existing widget infrastructure (see CHATBOT_PLATFORM_AUDIT.md)

---

## Goal

Upgrade the existing chatbot widget from "functional prototype" to "production-ready embeddable chatbot for SME websites" with streaming responses, lead capture, and a polished SDK.

---

## Scope

### In Scope (Phase 1)

1. **Streaming widget chat** — SSE-based real-time response
2. **Lead capture pre-chat form** — name, email, WhatsApp before first message
3. **Conversation history** — visitors can see previous messages
4. **Widget JS SDK v2** — versioned, accessible, event hooks
5. **Wire `/api/v1/chat` to RAG** — API consumers get same pipeline as widget

### Out of Scope (Phase 2+)

- WhatsApp integration
- Custom domain for widget
- Widget analytics dashboard (already exists at basic level)
- Multi-language widget UI
- File upload in widget chat

---

## 1. Streaming Widget Chat

### Current State

`POST /api/widget/chat` uses `generateRAGResponse()` — returns full response in one shot. Average latency: 3-8 seconds of spinner.

### Target State

`POST /api/widget/chat/stream` — returns SSE stream with chunked content.

### API Design

```
POST /api/widget/chat/stream
Content-Type: application/json

{
  "publicKey": "pw_pub_xxx",
  "message": "What is the return policy?",
  "visitorId": "v_xxx",
  "conversationId": "conv_xxx"  // optional, for continuing conversation
}

Response: text/event-stream

event: message
data: {"type": "chunk", "content": "Based on "}

event: message
data: {"type": "chunk", "content": "the return policy, "}

event: message
data: {"type": "sources", "sources": [{"document": "return-policy.pdf", "page": 3}]}

event: message
data: {"type": "done", "conversationId": "conv_xxx", "messageId": "msg_xxx"}

event: message
data: {"type": "error", "message": "Rate limit exceeded"}
```

### Implementation

```typescript
// app/api/widget/chat/stream/route.ts
export async function POST(request: NextRequest) {
  // 1. Validate publicKey + origin (same as existing /api/widget/chat)
  // 2. Rate limit check (dual-layer: key + IP)
  // 3. Resolve workspace from widget
  // 4. Create/get conversation
  // 5. Save user message
  // 6. Stream RAG response
  // 7. Save assistant message on stream complete

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`event: message\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send({ type: "chunk", content: "" }); // signal start

        const ragStream = await streamRAGResponse(message, workspaceId, sessionId);

        for await (const chunk of ragStream) {
          send({ type: "chunk", content: chunk });
        }

        send({ type: "sources", sources: retrievalResult.sources });
        send({ type: "done", conversationId, messageId });
      } catch (error) {
        send({ type: "error", message: "Something went wrong" });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

### widget.js Changes

```javascript
// Current (blocking):
const response = await fetch('/api/widget/chat', { method: 'POST', body: JSON.stringify(data) });
const result = await response.json();

// New (streaming):
const response = await fetch('/api/widget/chat/stream', { method: 'POST', body: JSON.stringify(data) });
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  // Parse SSE events and update message bubble incrementally
  for (const line of text.split('\n')) {
    if (line.startsWith('data: ')) {
      const event = JSON.parse(line.slice(6));
      if (event.type === 'chunk') appendToMessage(event.content);
      if (event.type === 'sources') showSources(event.sources);
      if (event.type === 'done') finalizeMessage();
    }
  }
}
```

### Fallback

If streaming fails (network, proxy strips SSE), fall back to non-streaming `/api/widget/chat`. Detect via `response.headers.get('Content-Type')`.

---

## 2. Lead Capture Pre-Chat Form

### UX Flow

```
Widget opens → Pre-chat form (if configured) → User fills name/email/WhatsApp → Chat starts
                 ↓
            Form fields configurable per widget:
            - Name (required/optional/hidden)
            - Email (required/optional/hidden)
            - WhatsApp (required/optional/hidden)
```

### Schema Changes

```prisma
model Widget {
  // ... existing fields ...
  leadCaptureEnabled Boolean @default(false) @map("lead_capture_enabled")
  leadFields         Json    @default("[]") @map("lead_fields")
  // Structure: [{ "name": "name", "label": "Your Name", "required": true, "type": "text" },
  //             { "name": "email", "label": "Email", "required": true, "type": "email" },
  //             { "name": "whatsapp", "label": "WhatsApp", "required": false, "type": "tel" }]
}

model WidgetConversation {
  // ... existing fields ...
  leadName     String?  @map("lead_name") @db.VarChar(200)
  leadEmail    String?  @map("lead_email") @db.VarChar(300)
  leadWhatsApp String?  @map("lead_whatsapp") @db.VarChar(30)
  leadData     Json?    @map("lead_data")  // extra fields from leadFields config
}
```

### API Changes

**`POST /api/widget/chat`** — add optional `lead` field:

```json
{
  "publicKey": "pw_pub_xxx",
  "message": "Hello",
  "visitorId": "v_xxx",
  "lead": {
    "name": "John Doe",
    "email": "john@example.com",
    "whatsapp": "+6281234567890"
  }
}
```

Server validates: if `leadCaptureEnabled` and `lead` is missing, return 422 with `{ "error": "lead_required", "fields": [...] }`.

### widget.js Changes

1. Check `config.leadCaptureEnabled` after loading config
2. If enabled, show pre-chat form before chat input
3. Store lead data in memory, send with first message
4. Don't re-show form on subsequent messages (persist in sessionStorage per visitorId)

### Lead Management UI

New section in Widget Settings (`/settings/widget`):

- **Leads tab** — table of captured leads with name, email, WhatsApp, first message, timestamp
- **Export** — CSV download
- **Lead count** — per widget, per time period

### API Endpoint

```
GET /api/widget/leads?widgetId=xxx&page=1&per_page=20
Authorization: Bearer sk_live_xxx

Response:
{
  "data": [
    {
      "id": "conv_xxx",
      "leadName": "John Doe",
      "leadEmail": "john@example.com",
      "leadWhatsApp": "+6281234567890",
      "firstMessage": "What is the return policy?",
      "messageCount": 5,
      "startedAt": "2026-06-15T10:30:00Z"
    }
  ],
  "meta": { "total": 142, "page": 1, "per_page": 20 }
}
```

---

## 3. Conversation History

### Current State

Visitors lose conversation on page refresh. `WidgetConversation` exists in DB but no retrieval endpoint.

### Target State

Visitors can see previous messages. Conversations persist across page loads (same browser).

### API Endpoint

```
GET /api/widget/conversations?publicKey=pw_pub_xxx&visitorId=v_xxx

Response:
{
  "conversations": [
    {
      "id": "conv_xxx",
      "startedAt": "2026-06-15T10:30:00Z",
      "messageCount": 8,
      "lastMessage": "Thanks for your help!",
      "lastMessageAt": "2026-06-15T10:35:00Z"
    }
  ]
}

GET /api/widget/conversations/{conversationId}/messages?publicKey=pw_pub_xxx

Response:
{
  "messages": [
    { "role": "user", "content": "What is the return policy?", "createdAt": "..." },
    { "role": "assistant", "content": "Based on our policy...", "sources": [...], "createdAt": "..." }
  ]
}
```

### widget.js Changes

1. On widget open, fetch conversation history for current visitorId
2. If previous conversation exists, show "Continue previous conversation" button
3. Load messages from last conversation on click
4. Store visitorId in localStorage (persists across sessions)

---

## 4. Widget JS SDK v2

### Current State

`public/widget.js` — 275 lines, vanilla JS, no versioning, no event hooks.

### Target State

Versioned, accessible, event-driven, TypeScript-typed.

### Changes

1. **Versioning** — `public/widget/v2/widget.js` (breaking changes from v1)
2. **CDN headers** — `Cache-Control: public, max-age=3600` with version in path
3. **Event hooks**:

```javascript
MimoNotesWidget.init({
  key: 'pw_pub_xxx',
  onOpen: () => console.log('Widget opened'),
  onClose: () => console.log('Widget closed'),
  onMessage: (message) => console.log('New message:', message),
  onLeadCapture: (lead) => console.log('Lead captured:', lead),
  onError: (error) => console.log('Error:', error),
});
```

4. **Accessibility**:
   - `role="dialog"` on chat window
   - `aria-label="Chat with [widget name]"`
   - Keyboard navigation (Tab, Enter, Escape)
   - Focus trap inside chat window
   - `aria-live="polite"` on messages container
   - Screen reader announcements for new messages

5. **React integration** (npm package):

```tsx
import { MimoNotesChat } from '@mimonotes/widget-react';

<MimoNotesChat
  publicKey="pw_pub_xxx"
  onMessage={(msg) => console.log(msg)}
  onLeadCapture={(lead) => console.log(lead)}
/>
```

---

## 5. Wire `/api/v1/chat` to RAG

### Current State

```typescript
// app/api/v1/chat/route.ts (placeholder)
export async function POST(request: NextRequest) {
  const { message } = await request.json();
  return Response.json({ message: `[API] Received: ${message}` });
}
```

### Target State

Full RAG pipeline with streaming, same as authenticated chat but with API key auth.

```typescript
export async function POST(request: NextRequest) {
  // 1. Authenticate via API key (Bearer token)
  const auth = await authenticateApiRequest(request);
  if (!auth.success) return auth.errorResponse;

  // 2. Rate limit (plan-based)
  // 3. Resolve workspace from API key
  // 4. Stream RAG response
  // 5. Track usage
}
```

---

## Implementation Order

| Task | Effort | Priority | Dependencies |
|------|--------|----------|-------------|
| Wire `/api/v1/chat` to RAG | 1 day | P0 | None |
| SSE streaming for widget chat | 2-3 days | P0 | None |
| Conversation history endpoints | 1 day | P1 | None |
| widget.js streaming consumption | 2 days | P1 | SSE streaming |
| Lead capture schema migration | 0.5 day | P1 | None |
| Lead capture API + validation | 1 day | P1 | Schema migration |
| Lead capture pre-chat form (widget.js) | 1-2 days | P1 | Lead API |
| Widget JS SDK v2 (versioned, events) | 2-3 days | P2 | Streaming |
| React npm package | 2 days | P2 | SDK v2 |
| Lead management UI | 1-2 days | P2 | Lead API |
| Accessibility audit + fixes | 1 day | P2 | SDK v2 |

**Total estimated effort: 12-16 days**

---

## Success Metrics

- Widget chat latency: <500ms to first token (streaming)
- Lead capture rate: >30% of widget conversations include lead data
- Widget uptime: >99.5%
- Visitor satisfaction: <5% "I don't know" refusal rate
- Embed adoption: >80% of customers successfully embed widget
