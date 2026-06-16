# Feedback System Report — MimoNotes Chat V2

> **Component:** Feedback & Interaction System  
> **Sprint:** C3 Lite  
> **Date:** 2026-06-14

---

## Overview

The Feedback System provides post-response interaction capabilities: rating answer quality, copying responses, regenerating answers, and suggesting follow-up questions.

## Components

### 1. FeedbackBar (`feedback-bar.tsx`)

Action bar below each assistant message.

**Props:**
```typescript
interface FeedbackBarProps {
  content: string;              // Full assistant response text
  isLastMessage?: boolean;      // Show regenerate button only on last message
  isStreaming?: boolean;        // Hide during streaming
  onRegenerate?: () => void;    // Regenerate callback
}
```

**Actions:**

| Action | Icon | Behavior | State |
|--------|------|----------|-------|
| Helpful | `ThumbsUp` | Toggle on/off, toast confirmation | `feedback: 'helpful' \| null` |
| Not Helpful | `ThumbsDown` | Toggle on/off, toast confirmation | `feedback: 'not-helpful' \| null` |
| Copy | `Copy` → `Check` | Copy to clipboard, 2s checkmark | `copied: boolean` |
| Regenerate | `RotateCcw` | Re-send last user prompt | Only on last message |

**Visual states:**
- Default: `text-muted-foreground`
- Hover: `text-foreground bg-muted`
- Feedback given: `text-primary bg-primary/10` (thumbs up) or `text-destructive bg-destructive/10` (thumbs down)
- Copied: `text-green-600` with checkmark icon

**Accessibility:**
- `aria-label` in Indonesian
- `title` tooltip in Indonesian
- `focus-visible:ring-2` for keyboard navigation

### 2. Follow-up Suggestions (in ChatWindow)

Three suggestion buttons shown after each complete assistant response.

**Suggestions:**
1. "Jelaskan lebih detail" — Ask for more detail
2. "Berikan contoh" — Ask for examples
3. "Ringkas dalam 3 poin" — Ask for a 3-point summary

**Behavior:**
- Shown only when: `!isLoading && messages.length > 0 && lastAssistant has content`
- Click: auto-fills input AND auto-submits (fires `handleSubmit`)
- Each button has a `Sparkles` icon prefix
- Styled as pill buttons with border

### 3. Regenerate (in ChatWindow)

Re-sends the last user prompt to generate a new assistant response.

**Flow:**
```
handleRegenerate()
  → Guard: if isLoading, return
  → Find lastAssistantIdx = messages.findLastIndex(role === 'assistant')
  → Find lastUserIdx = messages.findLastIndex(role === 'user' && index < lastAssistantIdx)
  → Get userPrompt = messages[lastUserIdx].content
  → Remove last assistant message: setMessages(prev => prev.slice(0, lastAssistantIdx))
  → setIsLoading(true)
  → POST /api/chat with userPrompt + sessionId
  → Stream new response into new assistant message
  → setIsLoading(false)
```

**Edge cases handled:**
- No assistant messages → no-op
- No user message before assistant → no-op
- Already loading → no-op
- API error → toast error, no state corruption

## Integration with MessageBubble

MessageBubble now accepts additional props:

```typescript
{
  message: Message;
  onCitationClick?: (index: number) => void;
  highlightedSource?: number | null;
  isLastMessage?: boolean;      // NEW — shows regenerate button
  isStreaming?: boolean;        // NEW — hides feedback bar during stream
  onRegenerate?: () => void;    // NEW — regenerate callback
}
```

**Rendering logic:**
- User messages: no FeedbackBar
- Assistant messages: FeedbackBar always rendered
- During streaming (`isStreaming=true`): FeedbackBar returns null
- Last message (`isLastMessage=true`): regenerate button visible
- Other messages: regenerate button hidden

## Design Decisions

1. **Client-side only** — Feedback is not persisted to a backend. This is intentional for Sprint C3 Lite. Future sprints can add analytics/storage.

2. **Copy moved to FeedbackBar** — The standalone copy button on MessageBubble was removed. All actions are now unified in FeedbackBar for a cleaner UX.

3. **Follow-ups auto-submit** — Clicking a suggestion immediately sends it as a question. This reduces friction and encourages exploration.

4. **Regenerate replaces, not appends** — The old assistant message is removed and a new one is streamed. This keeps the conversation clean.

5. **3 generic suggestions** — These work for any RAG response. Topic-specific suggestions require backend analysis (future sprint).
