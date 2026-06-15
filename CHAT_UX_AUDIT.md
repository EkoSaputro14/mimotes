# MIMO NOTES CHAT UX AUDIT — Sprint C Phase 1

**Date:** 2026-06-14
**Scope:** components/chat/ (4 files) + app/chat/page.tsx
**Tech Stack:** Next.js 16, Tailwind v4, oklch CSS vars, Geist Sans, warm-purple 265°
**Auditor:** Hermes Agent (code-level analysis)

---

## Executive Summary

The MimoNotes chat experience scores a **4.4/10** overall — functional but minimal. The core loop works: type → send → stream → read. But the product reads as a raw prototype, not a polished chat application. Empty states are passive, citation integration is surface-level, error recovery is absent, and mobile is functional but unrefined. There are zero moments of delight. The architecture is sound (streaming, session management, markdown rendering), but the UX layer needs systematic investment across all 10 dimensions to reach production quality.

---

## 1. FIRST MESSAGE EXPERIENCE

**Score: 3/10 · Severity: High**

### Evidence

From `chat-window.tsx` lines 140–155:
```tsx
{messages.length === 0 && (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <div className="text-6xl mb-4">🤖</div>
    <h2 className="text-2xl font-bold text-foreground mb-2">
      Selamat datang di Mimotes
    </h2>
    <p className="text-muted-foreground max-w-md">
      Ajukan pertanyaan dan AI akan menjawab berdasarkan dokumen yang
      tersedia. Jawaban akan disertai referensi sumber.
    </p>
  </div>
)}
```

### Findings

- **Passive empty state.** A robot emoji, a heading, and a paragraph. No visual hierarchy beyond size. The user must read 26 words to understand what the product does — then invent their own first question.
- **Zero guided entry.** No suggested prompts, no quick-action buttons ("Apa isi dokumen ini?", "Ringkas dokumen X"), no example conversations.
- **No brand personality.** The 🤖 emoji is generic. The heading "Selamat datang di Mimotes" is polite but forgettable. No visual motif connecting to the warm-purple brand.
- **No onboarding cues.** First-time users don't know which documents are available or what kinds of questions work well. The empty state is a dead end, not a starting line.

### What's Missing

- Suggested prompt chips (3–4 context-aware starters)
- Document count / availability indicator ("X dokumen tersedia")
- Visual brand element (illustration, not emoji)
- Progressive disclosure: hide complexity, surface curiosity

---

## 2. CONVERSATION FLOW

**Score: 6/10 · Severity: Medium**

### Evidence

From `chat-window.tsx` — the submission flow:

1. **User types → Enter →** `handleSubmit` fires (line 65)
2. **Optimistic UI:** User message appended immediately (line 67–73), input cleared, textarea height reset
3. **Loading state:** `setIsLoading(true)` + bouncing dots shown (line 167–178)
4. **Streaming:** `response.body.getReader()` reads chunks, appends to `assistantContent`, updates last message in state (lines 102–116)
5. **Session creation:** First message gets `X-Session-Id` from response header (line 90), stored in state
6. **History loading:** `handleSessionSelect` fetches `/api/chat/sessions?sessionId=`, maps messages (lines 44–63)

### What Works

- Optimistic message append — no flicker, instant feedback
- Streaming text appearance — progressive content delivery
- Auto-scroll to bottom via `scrollIntoView({ behavior: "smooth" })`
- Session ID extracted from headers (no extra API call)
- Enter to send, Shift+Enter for newline — standard pattern

### What's Broken

- **No message persistence on page reload.** `useState([])` — state is ephemeral. Refreshing the page loses the entire conversation unless the user manually clicks a sidebar session.
- **Session not created until first response.** If the API fails on first message, the session is never saved — the conversation is lost.
- **No "regenerate" capability.** If the AI gives a bad answer, the only option is to ask again.
- **No streaming cancellation.** The `while(true)` loop (line 109) has no abort mechanism. User can't stop a long response.
- **No message edit or delete.** What's sent is final.

---

## 3. CITATION VISIBILITY

**Score: 2/10 · Severity: Critical**

### Evidence

From `chat-window.tsx` lines 173–182:
```tsx
{currentSources.length > 0 && (
  <div className="px-6 py-3 border-t border-border bg-muted/50">
    <p className="text-xs font-medium text-muted-foreground mb-2">
      Sumber Referensi:
    </p>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {currentSources.map((source, index) => (
        <SourceCard key={index} source={source} index={index} />
      ))}
    </div>
  </div>
)}
```

Sources are stored per-message in the `Message` interface (line 15: `sources?: Array<...>`), but **only `currentSources` state is rendered** — not `message.sources`.

### Findings

- **Sources exist only for the last assistant message.** `currentSources` is set when a response arrives (line 95) and cleared when a new message is sent (line 75: `setCurrentSources([])`). Scroll back to an older message and its sources are gone.
- **No inline citation markers.** The response text has no `[1]`, `[2]`, or footnotes linking specific claims to source chunks. The user must guess which parts of the answer came from which document.
- **Sources panel is disconnected from the response.** It sits below the message area in a separate border-t container. There's no visual connection between "this paragraph cites source #3" and the source card.
- **Source data IS persisted per-message** (`message.sources`), but the UI ignores it. This is a rendering gap, not a data gap.

### Impact

This is the #1 UX deficiency. A RAG chatbot without visible, linked citations is a generic chatbot. Users can't verify claims, can't trace answers to documents, and can't build trust. This undermines the core value proposition.

---

## 4. SOURCE BROWSING

**Score: 4/10 · Severity: High**

### Evidence

From `source-card.tsx`:
```tsx
<Card
  size="sm"
  className="flex-shrink-0 w-64 cursor-pointer border border-border hover:shadow-md transition-shadow"
  onClick={() => setExpanded((prev) => !expanded)}
>
```

- Fixed `w-64` (256px) regardless of content length
- Expand/collapse toggles between 200-char preview and full content
- File type icons use emoji (`📕`, `📘`, `📝`, `📊`, `📗`, `🔗`, `📄`)
- Similarity displayed as `{similarityPercent}% cocok`
- Document link opens `/knowledge/documents/${documentId}` in new tab

### Findings

- **Horizontal scroll strip.** Sources are rendered as a `flex gap-2 overflow-x-auto` container. On a typical desktop with 3–5 sources, this works. On mobile, it's a hidden overflow requiring horizontal swipe with no scroll indicator.
- **No preview panel.** To read a source chunk, the user must click to expand the card (truncated to 200 chars collapsed). No modal, no side panel, no full-text view.
- **No side-by-side comparison.** Can't view the AI's response and source text simultaneously.
- **Fixed width is wasteful.** `w-64` means every card is 256px wide regardless of title length or content. Short titles waste space; long titles truncate with no way to read the full name.
- **No sorting or filtering.** Sources appear in API response order. Can't sort by similarity, filter by document, or group by file type.
- **Emoji icons are not accessible.** Screen readers announce these as random emoji, not "PDF document" or "Word document."

---

## 5. MESSAGE HIERARCHY

**Score: 5/10 · Severity: Medium**

### Evidence

From `message-bubble.tsx`:
```tsx
{/* User bubble */}
<div className={`relative max-w-[80%] ${
  isUser
    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
    : "bg-muted text-foreground rounded-2xl rounded-tl-sm"
} px-4 py-3`}>
```

Avatar system:
```tsx
<div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 ${
  isUser ? "bg-gray-600" : "bg-blue-600"
}`}>
  {isUser ? "U" : "AI"}
</div>
```

Markdown rendering (assistant only):
```tsx
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight]}
>
  {message.content}
</ReactMarkdown>
```

### What Works

- Clear visual distinction: user = purple bg right-aligned, assistant = muted bg left-aligned
- Markdown rendering with GFM (tables, lists) and code highlighting (rehype-highlight)
- Copy button on hover — positioned correctly relative to alignment
- Timestamps in `HH.MM` format below each bubble
- Copy button has proper `aria-label="Salin pesan"` and `title` attribute

### What's Missing

- **No content-type differentiation.** An assistant message containing a list, a code block, a table, or a plain paragraph all look the same. No visual hierarchy within responses.
- **No section headers.** Long responses (multi-topic answers) are a wall of text with no internal structure beyond markdown headings.
- **Avatar "U" / "AI" is functional but cold.** No user name, no contextual avatar.
- **No message grouping.** Consecutive user or assistant messages aren't visually grouped.
- **Code blocks use github-dark theme** (`import "highlight.js/styles/github-dark.css"`) regardless of light/dark mode — potential contrast issue in light mode.
- **No "thinking" animation.** The assistant bubble appears empty, then text streams in. No indicator of what phase the AI is in.

---

## 6. TYPING STATES

**Score: 3/10 · Severity: Medium**

### Evidence

From `chat-window.tsx` lines 167–178:
```tsx
{isLoading && messages[messages.length - 1]?.role === "user" && (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
      AI
    </div>
    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" />
        <div
          className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        />
        <div
          className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
      </div>
    </div>
  </div>
)}
```

### Findings

- **Single state: bouncing dots.** The three circles with staggered `animation-delay` are the only visual feedback during the entire wait period (typically 2–8 seconds for RAG queries).
- **No phase indication.** The user doesn't know if the system is: (a) searching documents, (b) generating embeddings, (c) querying the AI, or (d) streaming the response. All phases look identical.
- **Bouncing dots are generic.** This is the default "loading" pattern from a tutorial. It communicates "something is happening" but nothing about *what* is happening.
- **No transition.** Bouncing dots disappear the instant streaming begins. No smooth morphing from "thinking" to "responding."
- **No streaming cursor.** Text appears progressively but there's no blinking cursor or visual indicator of the current write position.

### What Would Help

- Phase labels: "Mencari dokumen..." → "Menganalisis..." → "Menulis jawaban..."
- Typing indicator that morphs into the streaming text
- Subtle pulse animation on the AI avatar during processing

---

## 7. LOADING STATES

**Score: 4/10 · Severity: Medium**

### Evidence

**Sidebar loading** — `session-sidebar.tsx` lines 84–93:
```tsx
{loading ? (
  <div className="p-4 space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    ))}
  </div>
)}
```

**Session switch** — `chat-window.tsx` lines 44–63: `setIsLoading(true)` during fetch, but **no visual skeleton for the message area**. The old messages stay visible until the new ones replace them.

### What Works

- Sidebar initial load has proper skeleton placeholders (3 pulse blocks)
- Empty session list shows "Belum ada percakapan" — no flash of empty state

### What's Missing

- **Session switch has no loading skeleton.** Clicking a sidebar session sets `isLoading(true)` and shows bouncing dots in the *last message position*, but the old conversation is still visible. There's a confusing moment where old messages are displayed alongside a loading indicator.
- **No message area skeleton during session switch.** The transition is: old messages → bouncing dots at bottom → new messages appear. The user sees a stale conversation with a meaningless loading indicator.
- **No document retrieval indicator.** During RAG processing, the user sees bouncing dots the entire time. No feedback on "searching 42 document chunks..."
- **No timeout handling.** If the API takes 30+ seconds, the user just sees bouncing dots with no indication of whether it's stuck.

---

## 8. ERROR STATES

**Score: 3/10 · Severity: High**

### Evidence

From `chat-window.tsx`:

**API error response** (lines 86–89):
```tsx
if (!response.ok) {
  toast.error("Gagal mengirim pesan. Silakan coba lagi.");
  throw new Error("Gagal mengirim pesan");
}
```

**Catch block** (lines 117–130):
```tsx
catch (error) {
  console.error("Chat error:", error);
  if (!(error instanceof Error && error.message === "Gagal mengirim pesan")) {
    toast.error("Terjadi kesalahan. Silakan coba lagi.");
  }
  setMessages((prev) => [
    ...prev,
    {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
      createdAt: new Date().toISOString(),
    },
  ]);
}
```

**Session load error** (line 57):
```tsx
toast.error("Gagal memuat percakapan");
```

### Findings

- **Double error notification.** A failed API call shows BOTH a toast notification AND inserts an error message bubble. The user sees "Gagal mengirim pesan" as a toast AND the same message as a bubble. Redundant and noisy.
- **Generic error text.** "Maaf, terjadi kesalahan" gives zero diagnostic info. Was it a network error? Rate limit? AI provider timeout? Document not found? The user has no idea what went wrong.
- **No retry mechanism.** The error bubble is static text. No "Try again" button, no link to retry the last message. User must manually retype and resend.
- **No offline detection.** If the network drops, the fetch will eventually timeout with a generic error. No proactive offline banner or connectivity check.
- **Error state consumes a message slot.** The error message is inserted as an assistant message. If the user retries, the old error stays in the conversation as a permanent "Maaf, terjadi kesalahan" bubble — ugly.
- **No distinction between error types.** Rate limiting (429), server errors (500), and network errors all produce the same "Maaf" message.

---

## 9. MOBILE EXPERIENCE

**Score: 4/10 · Severity: High**

### Evidence

**Sidebar overlay** — `session-sidebar.tsx`:
```tsx
{isOpen && (
  <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={onToggle} />
)}
<aside className={`fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-72 bg-background border-r border-border flex flex-col transition-transform duration-200 ${
  isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden"
}`}>
```

**Hamburger button** — `chat-window.tsx` line 128:
```tsx
<button onClick={() => setSidebarOpen(true)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg md:hidden" aria-label="Buka riwayat chat">
```

**Session close on select** — `session-sidebar.tsx`:
```tsx
onClick={() => {
  onSessionSelect(session);
  if (window.innerWidth < 768) onToggle();
}}
```

### What Works

- Sidebar slides in/out with `translate-x` transition (200ms)
- Backdrop overlay dismisses sidebar on tap
- Hamburger button only visible on mobile (`md:hidden`)
- Session select auto-closes sidebar on mobile
- Input textarea auto-resizes with `max-h-[160px]`

### What's Missing

- **No swipe gestures.** Sidebar requires hamburger tap. No swipe-right-to-open or swipe-left-to-close.
- **Sources horizontal scroll is hostile on mobile.** `overflow-x-auto` on a 320px screen with `w-64` (256px) cards means each card fills the viewport. Users must horizontally scroll to see even a second source.
- **No bottom sheet for sources.** On mobile, the sources panel sits at the bottom above the input, compressing the message area. A bottom sheet that expands on tap would be better.
- **Input area lacks mobile optimization.** No keyboard avoidance, no safe-area-inset handling for iPhone notch/Dynamic Island.
- **No pull-to-refresh** for session list.
- **`window.innerWidth < 768` check** (sidebar.tsx) is not responsive — won't update if the window resizes. Should use a ResizeObserver or media query hook.
- **`aria-label="Buka riwayat chat"`** on hamburger is good, but no `aria-expanded` state for the sidebar.

---

## 10. ACCESSIBILITY & POLISH

**Score: 3/10 · Severity: High**

### Evidence

**Inline SVG icons** — used throughout instead of an icon library:
- `chat-window.tsx`: hamburger SVG (lines 130–143), send arrow SVG (lines 208–213), sidebar close SVG, sidebar new-chat SVG
- `message-bubble.tsx`: copy SVG, checkmark SVG (lines 55–73)
- `session-sidebar.tsx`: search icon uses Lucide (`import { Search } from "lucide-react"`), but delete button uses inline SVG

**Emoji file type icons** — `source-card.tsx`:
```tsx
function getFileTypeIcon(fileType?: string) {
  switch (fileType) {
    case "pdf": return "📕";
    case "docx": return "📘";
    // ... etc
  }
}
```

**No focus management:**
- After sending a message, focus stays on the textarea (good)
- After session switch, no focus management to the message area
- Source cards are clickable `<Card>` elements with no `role="button"` or keyboard handlers
- Delete button in sidebar uses `opacity-0 group-hover:opacity-100` — invisible to keyboard users until focused

### Findings

- **Inconsistent icon system.** SessionSidebar uses Lucide for search, inline SVG for everything else. chat-window uses only inline SVG. No consistent icon library.
- **Emoji as file type indicators are inaccessible.** Screen readers announce "red book" for 📕 instead of "PDF document." No `aria-label` on the emoji spans.
- **Source cards have no keyboard support.** `<Card onClick={...}>` — cards are not focusable (`tabIndex`), have no `role`, no `onKeyDown` handler. Keyboard users cannot interact with sources at all.
- **Delete button is hover-only.** `opacity-0 group-hover:opacity-100` means the delete button is invisible until mouse hover. Keyboard users can tab to it, but it appears without visual transition.
- **No `aria-live` regions.** New messages, errors, and loading states are not announced to screen readers.
- **No skip navigation.** No way to jump from sidebar to message area.
- **Color contrast concerns.** `bg-muted-foreground/40` for bouncing dots (opacity 40%) may fail WCAG AA contrast requirements.
- **No reduced-motion handling.** `animate-bounce` and `transition-transform` have no `prefers-reduced-motion` media query fallback.

---

## Summary Table

| # | Dimension | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | First Message Experience | 3 | Passive empty state, no guided entry |
| 2 | Conversation Flow | 6 | No persistence on reload, no regenerate |
| 3 | Citation Visibility | 2 | Sources only show for last message, no inline markers |
| 4 | Source Browsing | 4 | Horizontal scroll strip, no preview, fixed width |
| 5 | Message Hierarchy | 5 | No content-type differentiation, no code block theming |
| 6 | Typing States | 3 | Generic bouncing dots, no phase indication |
| 7 | Loading States | 4 | No skeleton for session switch, no timeout handling |
| 8 | Error States | 3 | Double notification, generic text, no retry |
| 9 | Mobile Experience | 4 | Sources hostile on small screens, no gestures |
| 10 | Accessibility & Polish | 3 | Emoji icons, no keyboard nav for sources, no aria-live |

---

## Overall Score: 4.4 / 10

### Severity Distribution

| Severity | Count | Dimensions |
|----------|-------|------------|
| Critical | 1 | Citation Visibility |
| High | 4 | First Message, Source Browsing, Error States, Mobile, Accessibility |
| Medium | 3 | Conversation Flow, Message Hierarchy, Typing States, Loading States |
| Low | 0 | — |

### Priority Matrix (Effort × Impact)

**Quick wins (1–2 days):**
- Add inline citation markers `[1]` to assistant responses
- Show all messages' sources, not just the last one
- Add retry button on error bubbles
- Add `aria-label` to emoji file type icons

**Medium investment (3–5 days):**
- Suggested prompt chips on empty state
- Phase indicators during RAG processing ("Mencari dokumen..." → "Menulis...")
- Skeleton loader for session switching
- Source panel as expandable bottom sheet on mobile

**Strategic (1–2 weeks):**
- Source preview panel (side panel or modal)
- Message edit/regenerate
- Full keyboard navigation for all interactive elements
- `aria-live` regions and `prefers-reduced-motion` support

---

*This audit is based on code-level analysis of the 5 chat component files as of 2026-06-14. All evidence citations reference specific file locations and line numbers from the current source.*
