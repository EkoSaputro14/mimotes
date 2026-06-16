# Widget V1 Implementation Report

**Date:** 2026-06-15
**Commit:** `e92f272`
**Status:** IMPLEMENTATION COMPLETE

---

## Summary

Phase 1 Widget V1 Hardening implemented. 6 tasks completed, 6 files changed, 832 insertions, 203 deletions.

---

## Tasks Completed

### 1. Wire `/api/v1/chat` to RAG Pipeline ✅

**File:** `app/api/v1/chat/route.ts` (modified)

**Before:** Placeholder response — `[API] Received: ${message}`
**After:** Full RAG pipeline integration with streaming + non-streaming modes

**Implementation:**
- `?stream=true` query param → SSE streaming via `streamRAGResponse()`
- Non-streaming fallback → `generateRAGResponse()` returning JSON with `answer`, `sources`, `confidence`
- `setWorkspaceContext(auth.workspaceId)` before RAG call for workspace isolation
- Rate limiting and usage tracking preserved

**API Contract:**
```
POST /api/v1/chat
Authorization: Bearer mk_liv...n{
  "message": "What is the return policy?",
  "sessionId": "optional-session-id"
}

# Non-streaming response:
{
  "answer": "Based on the return policy...",
  "sources": [{"document": "policy.pdf", "chunk": "..."}],
  "confidence": "high",
  "sessionId": "session-uuid"
}

# Streaming response (?stream=true):
event: message
data: {"type":"chunk","content":"Based on "}

event: message
data: {"type":"done","messageId":"msg_xxx"}
```

---

### 2. SSE Streaming Endpoint ✅

**File:** `app/api/widget/chat/stream/route.ts` (NEW)

**Implementation:**
- Mirrors existing `/api/widget/chat` logic (dual-layer rate limiting, origin validation, conversation management, visitor isolation)
- Uses `streamRAGResponse()` for streaming
- SSE format: `chunk` → `sources` → `done` events
- Saves assistant message after stream completes (fire-and-forget)

**Security:**
- Dual-layer rate limiting: 60/min per public key + 30/min per IP
- Origin validation against allowed domains
- Visitor isolation (conversation ownership check)
- Message length validation (10,000 char max)

---

### 3. Conversation History Endpoints ✅

**Files:**
- `app/api/widget/conversations/route.ts` (NEW)
- `app/api/widget/conversations/[id]/messages/route.ts` (NEW)

**Endpoints:**
```
GET /api/widget/conversations?publicKey=xxx&visitorId=xxx
→ Returns list of conversations for a visitor

GET /api/widget/conversations/{id}/messages?publicKey=xxx
→ Returns messages for a conversation
```

**Security:** Both endpoints validate publicKey, widget existence, and origin.

---

### 4. Widget JS SDK V2 ✅

**File:** `public/widget.js` (modified: 275 → 423 lines)

**New Features:**

**SSE Streaming:**
- `sendStreaming()` → tries `/api/widget/chat/stream` with `fetch()` + `ReadableStream`
- `handleStream()` → reads chunks via `response.body.getReader()`, parses SSE events
- Fallback detection: checks Content-Type header, falls back to non-streaming if not `text/event-stream`

**Conversation History:**
- `visitorId` persisted in `localStorage` (key: `mimo_visitor_id`)
- `conversationId` persisted in `sessionStorage` (key: `mimo_conversation_id`)
- On widget open, `checkConversationHistory()` queries conversation list
- Shows "Continue previous chat" button if history exists
- `loadConversationHistory()` fetches and displays previous messages

**Accessibility (17 ARIA attributes):**
- Chat window: `role="dialog"`, `aria-label`, `aria-modal="true"`
- Messages: `role="log"`, `aria-live="polite"`, `aria-relevant="additions"`
- Each message: `role="article"`, `aria-label` with role + content preview
- Input: `aria-label="Type your message"`
- Send button: `aria-label="Send message"`
- Launcher: `aria-label="Open chat"`, `aria-expanded` toggle, `aria-haspopup="dialog"`
- Close button: `aria-label="Close chat"`
- Loading: `role="status"`, `aria-label="AI is typing..."`
- Focus trap: Tab cycles within chat window when open
- Keyboard: Escape closes chat, Enter sends message

**SDK V2 (`window.MimoNotesWidget`):**
```javascript
window.MimoNotesWidget = {
  version: "2.0.0",
  config: { ... },
  onOpen: null,      // callback
  onClose: null,     // callback
  onMessage: null,   // callback
  onError: null,     // callback
  open: function() { ... },
  close: function() { ... },
  destroy: function() { ... },
};
```

---

### 5. Library Updates ✅

**File:** `lib/widget.ts` (modified)

**New Functions:**
- `getConversationsByVisitor(publicKey, visitorId)` — lists conversations for a visitor
- `getConversationMessages(conversationId, publicKey)` — gets messages with widget ownership validation

---

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `app/api/v1/chat/route.ts` | Modified | 98 → 120 |
| `app/api/widget/chat/stream/route.ts` | Created | 180 |
| `app/api/widget/conversations/route.ts` | Created | 65 |
| `app/api/widget/conversations/[id]/messages/route.ts` | Created | 75 |
| `lib/widget.ts` | Modified | 251 → 295 |
| `public/widget.js` | Modified | 275 → 423 |

**Total:** 6 files changed, 832 insertions(+), 203 deletions(-)

---

## Build Verification

- ✅ `npx tsc --noEmit` — 0 errors
- ✅ `docker compose build app` — success
- ✅ `docker compose up -d app` — container running
- ✅ Health endpoint: 200 OK
- ✅ All new routes responding correctly
