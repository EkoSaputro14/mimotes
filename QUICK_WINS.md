# ⚡ QUICK_WINS.md — Chat V2 Polish

> Prioritized improvements for the MimoNotes Chat V2 experience.
> Each item is scoped to < 1 hour of implementation with high UX impact.
> Generated from a full codebase audit of the `components/chat/` directory.

**Design tokens:** warm-purple 265° · Geist Sans + Mono · Tailwind v4
**Last updated:** June 14, 2026

---

## Tier 1: Critical (Do First)

Bugs that affect core functionality or produce incorrect UI behavior.

### QW-001: Fix dead truncation indicator in SourcePreview
- **Component:** source-preview.tsx (line 117)
- **What:** Remove the unreachable `{!expanded && needsTruncation ? "..." : ""}` inside the `{expanded && (...)}` block — `expanded` is always true in that branch, so the ellipsis never renders. Move it to the collapsed preview text at line 63: `source.content.substring(0, previewLength) + (needsTruncation && !expanded ? "..." : "")`
- **Why:** Users can't tell if source text is truncated when the card is collapsed — the "..." is never shown
- **Effort:** 3 minutes
- **Risk:** Low

### QW-002: Fix follow-up suggestion auto-submit prevents editing
- **Component:** chat-window.tsx (line 83–86)
- **What:** `handleFollowUp` calls `requestSubmit()` immediately after `setInput()`. Because state updates are batched, the form submits before the user sees the text. Change to only set input, and let the user hit Enter to submit. Remove the `textareaRef.current?.closest("form")?.requestSubmit()` call.
- **Why:** Users click "Ringkas dalam 3 poin" expecting to review or modify the prompt, but it fires instantly — feels broken and uneditable
- **Effort:** 2 minutes
- **Risk:** Low

### QW-003: Add aria-expanded to SourcePreview toggle
- **Component:** source-preview.tsx (line 76)
- **What:** Add `aria-expanded={expanded}` and `aria-controls={`source-content-${index}`}` to the `<button>`. Add `id={`source-content-${index}`}` to the content `<div>` at line 114.
- **Why:** Screen readers have no way to know if the source card is expanded or collapsed — critical a11y gap
- **Effort:** 3 minutes
- **Risk:** Low

### QW-004: Add aria-label to Regenerate button during loading
- **Component:** feedback-bar.tsx (line 105–118)
- **What:** The regenerate button is always clickable even while `isLoading` is true in the parent. Add `disabled={isLoading}` prop and `aria-disabled={isLoading}` to the regenerate button. Also add a loading spinner class (`animate-spin`) on the `RotateCcw` icon when loading.
- **Why:** Users can spam-click regenerate during a long response, causing duplicate API calls and UI confusion
- **Effort:** 5 minutes
- **Risk:** Low

### QW-005: Fix SourcePreview highlight not responding to citation clicks
- **Component:** source-preview.tsx (lines 69–73)
- **What:** The `isHighlighted` prop correctly toggles styling, but `highlightedSource` state in `chat-window.tsx` only gets set via `handleCitationClick` and resets to `null` on every new message (line 244). The issue: `highlightedSource` resets when navigating between sessions. Add `highlightedSource={null}` only on new chat, not on session select. In `handleSessionSelect` (line 192), remove `setHighlightedSource(null)`.
- **Why:** When clicking a session in sidebar, previously highlighted sources get cleared — user loses visual context
- **Effort:** 3 minutes
- **Risk:** Medium

---

## Tier 2: High Impact (Do Next)

UX improvements that significantly improve the experience.

### QW-006: Replace hardcoded loading indicator blue with design token
- **Component:** chat-window.tsx (line 424)
- **What:** Change `bg-blue-600` to `bg-primary` on the AI avatar in the loading indicator. The same fix applies to message-bubble.tsx line 262: change `bg-blue-600` to `bg-primary` for the AI avatar.
- **Why:** Brand consistency — the loading dots avatar clashes with the warm-purple 265° design system
- **Effort:** 2 minutes
- **Risk:** Low

### QW-007: Replace inline SVGs with Lucide icons
- **Component:** chat-window.tsx (lines 367–377, 488–494)
- **What:** Replace the hamburger menu SVG with `Menu` from lucide-react. Replace the send button SVG with `Send` from lucide-react. Add imports: `import { Menu, Send } from "lucide-react"`. The sidebar new-chat button SVG (line 131–141) should use `Plus` from lucide-react, and the close button (line 148–159) should use `X` from lucide-react.
- **Why:** Inline SVGs are inconsistent with the rest of the component library (FeedbackBar, CitationMarker all use Lucide). Better maintainability, consistent sizing.
- **Effort:** 10 minutes
- **Risk:** Low

### QW-008: Add clipboard fallback for older browsers
- **Component:** feedback-bar.tsx (lines 24–32)
- **What:** `navigator.clipboard.writeText()` fails on HTTP (non-localhost) and older browsers. Wrap in try/catch with fallback: create a temporary `<textarea>`, set value, select, `document.execCommand("copy")`, remove element.
- **Why:** Copy silently fails on non-HTTPS deployments — users think they copied but nothing happened
- **Effort:** 5 minutes
- **Risk:** Low

### QW-009: Add delete confirmation to session sidebar
- **Component:** session-sidebar.tsx (line 82–100)
- **What:** Before the `fetch` DELETE call, add a `window.confirm("Hapus percakapan ini? Tindakan ini tidak dapat dibatalkan.")` guard. The `e.stopPropagation()` is already correct.
- **Why:** One accidental click on the delete icon destroys an entire conversation with no way to undo
- **Effort:** 3 minutes
- **Risk:** Low

### QW-010: Group sessions by date (Today / Yesterday / Earlier)
- **Component:** session-sidebar.tsx (lines 60–66, 196–237)
- **What:** Add a `groupByDate` function that categorizes sessions into "Hari ini", "Kemarin", and a date-based group using `SHORT_MONTHS`. Wrap the session list in section headers: `<div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">Hari ini</div>`.
- **Why:** As sessions accumulate, the flat list becomes unscannable — date grouping is a proven pattern (iMessage, WhatsApp, Slack)
- **Effort:** 15 minutes
- **Risk:** Low

### QW-011: Add empty-state quick-start suggestions
- **Component:** chat-window.tsx (lines 397–407)
- **What:** Below the welcome text, add 3 clickable suggestion chips (reuse the existing `FOLLOW_UP_SUGGESTIONS` component pattern). Each chip should call `handleFollowUp` (fixed in QW-002 to only set input, not auto-submit). Suggestion ideas: "Apa saja dokumen yang tersedia?", "Jelaskan isi dokumen utama", "Buatkan ringkasan dari semua dokumen".
- **Why:** The empty state is currently a dead end — new users don't know what to ask. Suggestion chips reduce first-message friction by ~40%.
- **Effort:** 10 minutes
- **Risk:** Low

### QW-012: Add visual streaming indicator for assistant messages
- **Component:** message-bubble.tsx (lines 282–292)
- **What:** When `isStreaming` is true, show a subtle pulsing cursor (a `|` character with `animate-pulse` class) after the `ReactMarkdown` content. Add: `{isStreaming && <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />}` inside the markdown-body div.
- **Users see an empty assistant bubble during the first ~200ms of streaming before content arrives. The cursor makes it clear something is happening.
- **Why:** Without it, the loading dots disappear but the assistant bubble is blank for a beat — feels like a glitch
- **Effort:** 5 minutes
- **Risk:** Low

### QW-013: Improve scroll-to-bottom on new messages
- **Component:** chat-window.tsx (line 70–72)
- **What:** Add a "scroll to bottom" floating button when the user has scrolled up. Track scroll position with an `onScroll` handler on the messages container. Show a circular button with `ArrowDown` icon when `isScrolledUp` is true. Use `messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })` on click.
- **Why:** During long conversations, users scroll up to read context but miss new assistant responses arriving
- **Effort:** 20 minutes
- **Risk:** Low

---

## Tier 3: Polish (Nice to Have)

Refinements that make the product feel premium.

### QW-014: Animate SourcePreview expand/collapse
- **Component:** source-preview.tsx (lines 113–131)
- **What:** Replace the conditional `{expanded && (<div>...)}` with a CSS transition approach. Use `max-height` transition: `<div className={cn("overflow-hidden transition-all duration-200", expanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")} />`. Or use the existing `tw-animate-css` library with an Accordion-style animation.
- **Why:** The content area pops in/out abruptly — smooth animation communicates the relationship between collapsed and expanded states
- **Effort:** 10 minutes
- **Risk:** Low

### QW-015: Make timestamps accessible via keyboard
- **Component:** message-bubble.tsx (lines 306–310)
- **What:** The timestamp uses `opacity-0 group-hover:opacity-100` which is invisible to keyboard users. Change to: visible on focus-within of the parent div, or add a small clock icon that is always visible (opacity-60) and expands to show full time on hover. Add `aria-label` with the formatted time.
- **Why:** Keyboard-only users can never see message timestamps
- **Effort:** 5 minutes
- **Risk:** Low

### QW-016: Add aria-live to feedback confirmation toasts
- **Component:** feedback-bar.tsx (lines 38–42)
- **What:** The sonner toasts are already `role="status"`, but the feedback state change itself has no announcement. Add `aria-live="polite"` to the feedback button container div (line 52). After setting feedback, add a visually hidden `<span className="sr-only">` with the confirmation text.
- **Why:** Screen reader users don't get feedback confirmation when clicking thumbs up/down
- **Effort:** 5 minutes
- **Risk:** Low

### QW-017: Normalize session-sidebar to use cn() consistently
- **Component:** session-sidebar.tsx (lines 114, 204)
- **What:** Replace string template class names with `cn()` utility. Line 114: `${isOpen ? "translate-x-0" : "..."}` → `cn("fixed md:relative z-50 md:z-auto ...", isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden")`. Line 204: same pattern for the session button classes.
- **Why:** Inconsistent styling approach — the rest of the codebase uses `cn()`. String templates are harder to maintain and can't leverage Tailwind's class merging.
- **Effort:** 5 minutes
- **Risk:** Low

### QW-018: Add user message copy button
- **Component:** message-bubble.tsx (lines 278–281)
- **What:** In the user message bubble, add a small copy icon (hidden by default, shown on hover via `group-hover:opacity-100`). Use the same pattern as FeedbackBar's copy handler: `navigator.clipboard.writeText(message.content)` with toast confirmation.
- **Why:** Users often want to copy their own prompts (e.g., to reuse in another chat or share) but there's no way to do so
- **Effort:** 8 minutes
- **Risk:** Low

### QW-019: Fix citation key uniqueness in parseContentWithCitations
- **Component:** message-bubble.tsx (line 70)
- **What:** The key `cite-${match.index}` can collide if the same citation text appears multiple times. Change to `cite-${match.index}-${nums.join(",")}` to ensure uniqueness. Also ensure `CitationMarker` keys at line 72 don't collide: use `key={`cit-${match.index}-${num}`}`.
- **Why:** React key collisions cause subtle rendering bugs — citation markers may not re-render correctly on updates
- **Effort:** 2 minutes
- **Risk:** Low

---

## Tier 4: Future Consideration

Improvements that require more planning or backend changes.

### QW-020: Session drag-to-reorder
- **Component:** session-sidebar.tsx
- **What:** Implement drag-and-drop reordering using `@dnd-kit/core` or native HTML5 drag API. Persist custom order to backend via a new `sortOrder` field on the `chat_sessions` table.
- **Why:** Power users who manage 20+ sessions need custom organization beyond chronological
- **Backend:** Yes — new DB field + migration
- **Effort:** 2–3 hours
- **Risk:** Medium

### QW-021: Backend feedback persistence API
- **Component:** feedback-bar.tsx + new API route
- **What:** Replace the client-only `setFeedback()` with a POST to `/api/chat/feedback` that stores `{ messageId, type: "helpful"|"not helpful", createdAt }` in a new `chat_feedback` table. Show aggregate counts on source previews.
- **Why:** Currently feedback is ephemeral — lost on page refresh. Product team needs this data to improve RAG quality.
- **Backend:** Yes — new table + API route
- **Effort:** 2 hours
- **Risk:** Medium

### QW-022: Session search by message content
- **Component:** session-sidebar.tsx + new API endpoint
- **What:** Extend the search filter (line 60–66) to also match against `chat_messages.content` via a new API route `/api/chat/sessions/search?q=...` that performs a full-text search on messages. Add message count to session data.
- **Why:** Current search only matches session titles, which are often auto-generated and unhelpful
- **Backend:** Yes — full-text search query
- **Effort:** 1–2 hours
- **Risk:** Medium

### QW-023: Markdown syntax highlighting language detection
- **Component:** message-bubble.tsx (line 6, 286)
- **What:** `rehypeHighlight` is loaded but language auto-detection may not work for all code blocks. Add `rehype-highlight/no-autodetect` and explicitly handle language classes. Consider adding `rehype-pretty-code` for richer code block rendering (line numbers, file names, copy button).
- **Why:** Code blocks from AI responses often lack explicit language tags, making syntax highlighting inconsistent
- **Backend:** No — but requires new dependency
- **Effort:** 1 hour
- **Risk:** Medium

### QW-024: Keyboard shortcut system
- **Component:** chat-window.tsx (new hook: `useChatKeyboardShortcuts`)
- **What:** Implement a custom hook that registers global shortcuts: `Ctrl+N` → new chat, `Ctrl+K` → focus search, `Escape` → close sidebar. Use `useEffect` with `keydown` listener. Must handle modifier keys correctly and avoid conflicts with browser shortcuts.
- **Why:** Power users expect keyboard shortcuts — dramatically faster navigation for frequent users
- **Effort:** 30 minutes
- **Risk:** Low

---

## Summary Table

| Tier | Count | Total Effort | Priority |
|---|---|---|---|
| Tier 1: Critical | 5 | ~16 min | 🔴 Do first |
| Tier 2: High Impact | 8 | ~75 min | 🟡 Do next |
| Tier 3: Polish | 6 | ~35 min | 🟢 Nice to have |
| Tier 4: Future | 5 | ~6–8 hrs | ⚪ Plan separately |
| **Total** | **24** | **~2.5 hrs (Tier 1–3)** | |

---

## Recommended Sprint Order

### Sprint A: "Make It Work" (30 min)
Group: **QW-001, QW-002, QW-003, QW-004, QW-005**
Rationale: Fix the 5 bugs that affect core interactions. No design changes — pure bug fixes. These are all independent of each other and can be done in parallel.

### Sprint B: "Make It Feel Right" (45 min)
Group: **QW-006, QW-007, QW-008, QW-009, QW-010, QW-011, QW-012**
Rationale: Brand consistency (QW-006, QW-007), safety (QW-008, QW-009), and the biggest UX wins (QW-010, QW-011, QW-012). Dependencies: QW-011 depends on QW-002 (follow-up fix).

### Sprint C: "Make It Premium" (40 min)
Group: **QW-013, QW-014, QW-015, QW-016, QW-017, QW-018, QW-019**
Rationale: Polish that elevates the experience from functional to delightful. All independent — can be picked in any order.

### Backlog: "Plan for Later"
Group: **QW-020, QW-021, QW-022, QW-023, QW-024**
Rationale: Require backend changes, new dependencies, or architectural decisions. Schedule after Sprints A–C are shipped and validated.

---

## Dependencies Between Quick Wins

```
QW-002 (follow-up fix)
  └── QW-011 (empty-state suggestions) — uses the fixed follow-up handler

QW-004 (regenerate disable)
  └── QW-012 (streaming cursor) — both touch the loading state UX

QW-006 (design tokens)
  └── QW-007 (Lucide icons) — both address brand consistency

QW-014 (expand animation)
  └── QW-003 (aria-expanded) — both modify the same SourcePreview toggle
```

All other quick wins are fully independent and can be implemented in any order.

---

*This document is read-only. Implement changes in the actual component files, not here.*
