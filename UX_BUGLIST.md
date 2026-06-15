# MimoNotes Chat V2 — UX Bug Audit

> **Date:** June 14, 2026
> **Scope:** Read-only audit of chat UI components
> **Status:** 26 bugs identified across 6 components

---

## 1. FUNCTIONAL BUGS

These are things that don't work correctly — broken behavior, wrong output, or logic that fails under real conditions.

---

### BUG-001 — handleRegenerate doesn't abort in-flight requests

- **Severity:** High
- **Component:** `chat-window.tsx`
- **Description:** When a user clicks "regenerate," the function slices the messages array to remove the last response, but does not abort the previous streaming request still in flight. This creates a race condition where two responses can write to state simultaneously.
- **Reproduction:** Send a message → while the assistant is still streaming, click "regenerate" → observe two overlapping responses or duplicated text.
- **Expected:** The in-flight request should be aborted via `AbortController` before the new one starts.
- **Actual:** Both requests continue; new response overwrites or interleaves with the old one unpredictably.
- **Fix effort:** Medium (1–2h) — requires threading an `AbortController` through the streaming path.

---

### BUG-002 — parseContentWithCitations regex conflicts with markdown links

- **Severity:** High
- **Component:** `message-bubble.tsx`
- **Description:** The citation regex in `parseContentWithCitations` matches patterns that also look like markdown links `[text](url)`. This can cause legitimate markdown to be incorrectly wrapped in citation markers, or real citations to be swallowed by the markdown renderer.
- **Reproduction:** A message containing `[Click here](https://example.com)` alongside citation references → the link text gets wrapped in a citation `<span>`.
- **Expected:** Markdown links and citation markers should be parsed independently without interfering with each other.
- **Actual:** Markdown links are partially consumed by the citation regex, producing broken rendering.
- **Fix effort:** Medium (1–2h) — regex needs restructuring, possibly a two-pass parser.

---

### BUG-003 — Dead code in source-preview needsTruncation logic

- **Severity:** Low
- **Component:** `source-preview.tsx`
- **Description:** Inside the expanded block, `!expanded` is always `false`, making the `needsTruncation` check dead code. The truncation logic never actually triggers when the source is expanded.
- **Reproduction:** Expand a long source preview → the content never truncates regardless of length.
- **Expected:** Truncation should work correctly in both collapsed and expanded states (or the dead branch should be removed for clarity).
- **Actual:** Dead code path — the condition is unreachable.
- **Fix effort:** Quick (<30min) — review and either fix the logic or remove the dead branch.

---

### BUG-004 — Session search filter is case-sensitive for non-Latin characters

- **Severity:** Medium
- **Component:** `session-sidebar.tsx`
- **Description:** The search filter applies `toLowerCase()` which works for Latin scripts, but non-Latin characters (CJK, Cyrillic, Arabic) with case variations won't match correctly because `toLowerCase()` doesn't normalize them the same way.
- **Reproduction:** Create a session with a Japanese title in uppercase katakana → search for the lowercase version → no results found.
- **Expected:** Case-insensitive search should work across all scripts, or at minimum use locale-aware comparison.
- **Actual:** Non-Latin uppercase/lowercase variants are treated as different strings.
- **Fix effort:** Quick (<30min) — use `localeCompare` with `sensitivity: 'base'` or a Unicode-aware comparison.

---

## 2. UX BUGS

These work technically but feel wrong — confusing flows, misleading feedback, or friction that makes the product feel unpolished.

---

### BUG-005 — handleFollowUp auto-submits without debounce

- **Severity:** Medium
- **Component:** `chat-window.tsx`
- **Description:** When a follow-up suggestion is clicked, it submits immediately with no debounce. This means rapid clicks can fire multiple submissions, and there's no moment for the user to reconsider or edit the text before it's sent.
- **Reproduction:** Click a follow-up suggestion twice in quick succession → two identical messages are sent.
- **Expected:** There should be a brief debounce (300–500ms) or the suggestion should populate the input field instead of auto-submitting.
- **Actual:** Every click instantly submits, risking duplicate messages.
- **Fix effort:** Quick (<30min) — add a debounce or change to "fill input" behavior.

---

### BUG-006 — Sources rendered outside the message bubble

- **Severity:** Medium
- **Component:** `message-bubble.tsx`
- **Description:** Citation sources are rendered outside the `<MessageBubble>` container, breaking the visual grouping. On mobile or in dense conversations, it's unclear which message a set of sources belongs to.
- **Reproduction:** Send a message that references multiple sources → scroll through a conversation with several cited responses → sources float between messages without clear ownership.
- **Expected:** Sources should be visually nested within or directly attached to the message bubble they belong to.
- **Actual:** Sources appear as detached elements below the message, creating visual ambiguity.
- **Fix effort:** Medium (1–2h) — restructure the component hierarchy to nest sources inside the bubble.

---

### BUG-007 — Feedback toast shown when un-toggling feedback

- **Severity:** Low
- **Component:** `feedback-bar.tsx`
- **Description:** When a user removes their feedback (e.g., clicking "thumbs up" again to undo), a confirmation toast is still shown. This is confusing — the user expected silence when undoing an action.
- **Reproduction:** Click "thumbs up" → toast says "Thanks for your feedback!" → click "thumbs up" again → same toast appears.
- **Expected:** Toast should only appear when positive feedback is given, not when it's removed.
- **Actual:** Toast fires on every toggle, including the removal of feedback.
- **Fix effort:** Quick (<30min) — condition the toast on the new state (active vs. inactive).

---

### BUG-008 — "Copied" state resets after 2s regardless of clipboard content

- **Severity:** Medium
- **Component:** `feedback-bar.tsx`
- **Description:** The copied confirmation resets after a fixed 2-second timeout, regardless of whether the clipboard actually contains the expected content. If the clipboard API is slow or blocked by permissions, the user sees "Copied!" even though nothing was copied.
- **Reproduction:** Deny clipboard permissions in browser → click copy → toast says "Copied!" → paste → nothing is pasted.
- **Expected:** The "Copied!" confirmation should only appear if `navigator.clipboard.writeText` succeeds.
- **Actual:** The UI shows success unconditionally after 2 seconds.
- **Fix effort:** Quick (<30min) — await the clipboard API promise and only show success on resolve.

---

### BUG-009 — Expanded state in source-preview resets on parent re-render

- **Severity:** Medium
- **Component:** `source-preview.tsx`
- **Description:** The `expanded` state is local component state, but it resets whenever the parent re-renders (e.g., when new messages arrive). If a user expands a source to read it and a new message streams in, the source collapses.
- **Reproduction:** Expand a source preview → wait for a new message to arrive → observe the source collapse.
- **Expected:** Expanded state should persist until the user explicitly collapses it.
- **Actual:** Parent re-renders reset the expanded state.
- **Fix effort:** Medium (1–2h) — lift state to a context, use `useRef`, or persist in URL/local state.

---

### BUG-010 — previewLength is hardcoded at 200 characters

- **Severity:** Low
- **Component:** `source-preview.tsx`
- **Description:** The collapsed preview always shows exactly 200 characters, regardless of viewport size, font size, or whether the content is code (which has different readability characteristics).
- **Reproduction:** Resize the browser to a narrow width → the 200-character preview wraps awkwardly or gets cut off mid-word.
- **Expected:** Preview length should adapt to the available container width, or truncate at a word boundary.
- **Actual:** Fixed 200 characters regardless of context.
- **Fix effort:** Quick (<30min) — use a responsive character limit or measure container width.

---

### BUG-011 — External link opens without a warning

- **Severity:** Low
- **Component:** `source-preview.tsx`
- **Description:** Clicking a document ID link opens in a new tab (`target="_blank"`) without any visual indicator (no external link icon, no tooltip) or confirmation. This can be jarring, especially for users who don't expect context switches.
- **Reproduction:** Click any document ID link in the source preview → a new tab opens unexpectedly.
- **Expected:** External links should show an external link icon (↗) and optionally a confirmation for important destinations.
- **Actual:** Link opens silently in a new tab with no affordance.
- **Fix effort:** Quick (<30min) — add an icon and/or `rel="noopener"` with a visual indicator.

---

### BUG-012 — h-screen doesn't account for mobile browser chrome

- **Severity:** Medium
- **Component:** `page.tsx`
- **Description:** Using `h-screen` (100vh) on the page container doesn't account for the mobile browser's address bar and bottom toolbar, which together can consume 20–30% of viewport height on iOS and Android. This causes content to be cut off or creates unwanted scrolling.
- **Reproduction:** Open the app on a mobile browser (iOS Safari or Chrome) → the chat input and bottom of the conversation are hidden behind browser chrome.
- **Expected:** The layout should use `100dvh` (dynamic viewport height) or `100svh` to respect browser chrome, with a fallback for older browsers.
- **Actual:** Content extends behind the browser's toolbar, making the input inaccessible.
- **Fix effort:** Quick (<30min) — replace `h-screen` with `h-[100dvh]` and add a fallback.

---

## 3. ACCESSIBILITY BUGS

These are WCAG violations or accessibility gaps that affect users who rely on assistive technology, keyboard navigation, or touch input.

---

### BUG-013 — No aria-label on feedback-bar buttons

- **Severity:** Medium
- **Component:** `feedback-bar.tsx`
- **Description:** The feedback buttons (thumbs up, thumbs down, copy) only use `title` attributes, which are not reliably announced by screen readers. Without `aria-label`, assistive technology users can't determine what each button does.
- **Reproduction:** Enable a screen reader (VoiceOver/NVDA) → navigate to the feedback bar → buttons are announced as unlabeled or with just "button."
- **Expected:** Each button should have an `aria-label` like "Mark response as helpful" or "Copy response to clipboard."
- **Actual:** Buttons lack `aria-label`, making them inaccessible to screen reader users.
- **Fix effort:** Quick (<30min) — add `aria-label` attributes to each button.

---

### BUG-014 — Citation marker touch target is below 44px minimum

- **Severity:** High
- **Component:** `citation-marker.tsx`
- **Description:** The citation marker is rendered at 20×18px, which is well below the WCAG 2.5.8 minimum touch target of 44×44px. This makes citation markers extremely difficult to tap on mobile devices, especially for users with motor impairments.
- **Reproduction:** Open the app on a mobile device → try to tap a small citation number in a message → miss the target repeatedly.
- **Expected:** Touch targets should be at least 44×44px, either through padding or a larger hit area.
- **Actual:** The 20×18px target is unusable on touch devices.
- **Fix effort:** Quick (<30min) — add padding to reach 44px minimum or use a larger clickable area.

---

### BUG-015 — No aria-pressed for citation-marker toggle state

- **Severity:** Medium
- **Component:** `citation-marker.tsx`
- **Description:** The citation marker acts as a toggle (show/hide source preview), but it doesn't use `aria-pressed` to communicate its state to assistive technology. Screen readers can't tell if a citation is currently expanded or collapsed.
- **Reproduction:** Enable a screen reader → navigate to a citation marker → the toggle state is not announced.
- **Expected:** The citation marker should have `aria-pressed="true"` when expanded and `aria-pressed="false"` when collapsed.
- **Actual:** No toggle state is communicated to assistive technology.
- **Fix effort:** Quick (<30min) — add `aria-pressed` prop bound to the expanded state.

---

## 4. PERFORMANCE BUGS

These cause unnecessary work — re-renders, fetches, or computation that degrades the experience, especially on longer conversations or slower devices.

---

### BUG-016 — scrollToBottom fires on every messages array change

- **Severity:** Medium
- **Component:** `chat-window.tsx`
- **Description:** `scrollToBottom` is called in a `useEffect` that depends on the entire `messages` array. Every time a message is added or updated (including during streaming), this triggers a scroll. During streaming, this can fire dozens of times per second, causing layout thrashing.
- **Reproduction:** Send a long message that streams for 10+ seconds → observe the scroll position jittering as `scrollToBottom` fires on every partial update.
- **Expected:** Scrolling should be debounced, or only trigger when the user is already near the bottom (auto-scroll behavior like chat apps).
- **Actual:** Scroll fires on every state update, causing visible jitter and wasted layout cycles.
- **Fix effort:** Quick (<30min) — debounce the scroll or check `isNearBottom` before auto-scrolling.

---

### BUG-017 — createMarkdownComponents recreated on every render

- **Severity:** Medium
- **Component:** `message-bubble.tsx`
- **Description:** The `createMarkdownComponents` function is called inside the component body without `useMemo`, so a new set of markdown components is created on every render. This causes the markdown renderer to unmount and remount all sub-components, destroying DOM state and wasting computation.
- **Reproduction:** Open a conversation with 20+ messages → type in the input (without sending) → observe that all message bubbles re-render even though their content hasn't changed.
- **Expected:** Markdown components should be memoized and only recreated when the actual content or citation data changes.
- **Actual:** New component objects are created every render, triggering cascading re-renders.
- **Fix effort:** Quick (<30min) — wrap in `useMemo` with appropriate dependencies.

---

### BUG-018 — fetchSessions called on every currentSessionId change

- **Severity:** High
- **Component:** `session-sidebar.tsx`
- **Description:** The effect that fetches sessions runs whenever `currentSessionId` changes, but fetching the session list doesn't depend on which session is active. This causes unnecessary network requests every time the user switches sessions.
- **Reproduction:** Switch between 5 sessions quickly → observe 5 network requests to fetch the session list (identical responses each time).
- **Expected:** Sessions should be fetched once on mount and refreshed on explicit actions (create, delete, rename), not on every navigation.
- **Actual:** Every `currentSessionId` change triggers a full session list fetch.
- **Fix effort:** Quick (<30min) — remove `currentSessionId` from the dependency array and add manual refresh on mutations.

---

### BUG-019 — Unnecessary handleRegenerate wrapper in feedback-bar

- **Severity:** Low
- **Component:** `feedback-bar.tsx`
- **Description:** The `handleRegenerate` function in `feedback-bar.tsx` is a wrapper that directly calls `onRegenerate()` with no additional logic. It adds an unnecessary layer of indirection and, if recreated on every render (likely, given it captures props), contributes to child re-renders.
- **Reproduction:** Profile the feedback bar component → observe it re-renders when parent state changes, even though its behavior hasn't changed.
- **Expected:** If no additional logic is needed, the prop should be passed through directly.
- **Actual:** An unnecessary wrapper function is created on every render.
- **Fix effort:** Quick (<30min) — pass `onRegenerate` directly to the button's `onClick`.

---

## 5. EDGE CASE BUGS

These are crash scenarios, data loss risks, or situations that occur under uncommon but plausible conditions.

---

### BUG-020 — Date.now() message IDs risk collision

- **Severity:** High
- **Component:** `chat-window.tsx`
- **Description:** `handleSubmit` uses `Date.now()` to generate message IDs. When messages are sent rapidly (e.g., follow-up auto-submit + manual submit, or double-click), two messages can get the same timestamp and therefore the same ID, causing one to overwrite the other in state.
- **Reproduction:** Send a message → immediately send another (within the same millisecond) → one message disappears or the array contains duplicates.
- **Expected:** Message IDs should be unique, using a UUID or counter-based approach.
- **Actual:** Two messages can share an ID, leading to silent data loss.
- **Fix effort:** Quick (<30min) — replace `Date.now()` with `crypto.randomUUID()` or an incrementing counter.

---

### BUG-021 — No message length validation before sending

- **Severity:** Medium
- **Component:** `chat-window.tsx`
- **Description:** There is no check on message length before submitting. A user could paste an extremely long text (e.g., an entire document) that overwhelms the API, wastes tokens, or causes a timeout.
- **Reproduction:** Paste 100,000 characters into the input → press send → observe API timeout or error.
- **Expected:** The input should enforce a reasonable character limit with a clear warning, or chunk the message.
- **Actual:** Any length message is sent without validation.
- **Fix effort:** Quick (<30min) — add a character count and max limit with user feedback.

---

### BUG-022 — No network disconnection handling during streaming

- **Severity:** High
- **Component:** `chat-window.tsx`
- **Description:** If the network connection drops while the assistant is streaming a response, the UI doesn't detect or handle the disconnection. The streaming indicator continues indefinitely, and the user has no way to know the response was incomplete.
- **Reproduction:** Start a long streaming response → disable Wi-Fi mid-stream → observe the loading indicator spin forever with no error message.
- **Expected:** The UI should detect connection loss, show an error state, and offer a retry option.
- **Actual:** The streaming indicator hangs indefinitely with no feedback.
- **Fix effort:** Medium (1–2h) — add connection monitoring and timeout handling to the streaming path.

---

### BUG-023 — isStreaming check uses fragile empty string comparison

- **Severity:** Medium
- **Component:** `message-bubble.tsx`
- **Description:** The `isStreaming` prop is determined by checking `message.content === ""`. This is fragile because a message could legitimately be empty (e.g., a placeholder or error message), and it conflates "no content yet" with "currently streaming."
- **Reproduction:** Create a message with empty content (e.g., from an error) → it incorrectly shows the streaming animation.
- **Expected:** Streaming state should be a dedicated boolean flag on the message object, not inferred from content emptiness.
- **Actual:** Empty-content messages are incorrectly treated as streaming.
- **Fix effort:** Quick (<30min) — add an `isStreaming` boolean to the message type and use it instead of content comparison.

---

### BUG-024 — align-super inconsistent across browsers

- **Severity:** Low
- **Component:** `citation-marker.tsx`
- **Description:** The `align-super` CSS value for superscript alignment is not consistently supported across all browsers. In some versions of Firefox and older Safari, it may render differently or be ignored, causing citation numbers to misalign.
- **Reproduction:** Open the app in an older Firefox or Safari version → observe citation numbers sitting at different vertical positions.
- **Expected:** Citation numbers should align consistently across all modern browsers.
- **Actual:** Vertical alignment varies by browser engine.
- **Fix effort:** Medium (1–2h) — use `vertical-align: super` with fallback positioning, or switch to a different alignment strategy.

---

### BUG-025 — window.innerWidth check is SSR-unsafe

- **Severity:** High
- **Component:** `session-sidebar.tsx`
- **Description:** The sidebar uses `window.innerWidth` to determine whether to auto-collapse on mobile. If this code runs during server-side rendering (SSR) or in a test environment without `window`, it will throw a `ReferenceError` and crash the page.
- **Reproduction:** Enable SSR (e.g., Next.js with `getServerSideProps`) → load the page → observe a server error due to `window` being undefined.
- **Expected:** The code should check `typeof window !== 'undefined'` before accessing `window.innerWidth`, or use a hook like `useMediaQuery`.
- **Actual:** Server crashes when trying to access `window.innerWidth`.
- **Fix effort:** Quick (<30min) — add a `typeof window` guard or use a media query hook.

---

### BUG-026 — Delete session has no confirmation dialog

- **Severity:** High
- **Component:** `session-sidebar.tsx`
- **Description:** Clicking the delete button on a session immediately removes it without any confirmation. A single accidental click can permanently destroy an entire conversation with no undo option.
- **Reproduction:** Hover over a session → accidentally click the delete icon → the session is gone with no way to recover.
- **Expected:** A confirmation dialog (or undo toast) should appear before permanently deleting a session.
- **Actual:** Deletion is immediate and irreversible.
- **Fix effort:** Quick (<30min) — add a confirmation modal or undo snackbar.

---

## Summary

| Category          | Count | Critical | High | Medium | Low |
|-------------------|:-----:|:--------:|:----:|:------:|:---:|
| Functional        |   4   |    0     |  2   |   1    |  1  |
| UX                |   8   |    0     |  0   |   5    |  3  |
| Accessibility     |   3   |    0     |  1   |   2    |  0  |
| Performance       |   4   |    0     |  1   |   2    |  1  |
| Edge Case         |   7   |    0     |  4   |   2    |  1  |
| **Total**         | **26**|  **0**   | **8**| **12** | **6**|

---

## Recommended Fix Order

Prioritized by a combination of severity, user impact, and fix effort (quick wins first, then high-severity items):

1. **BUG-020** — Date.now() collision (High, Quick) — silent data loss, easy fix
2. **BUG-026** — Delete without confirmation (High, Quick) — one-click data loss
3. **BUG-014** — Touch target too small (High, Quick) — blocks mobile users
4. **BUG-025** — SSR crash on window.innerWidth (High, Quick) — breaks server rendering
5. **BUG-018** — fetchSessions on every navigation (High, Quick) — unnecessary network load
6. **BUG-022** — No streaming disconnect handling (High, Medium) — broken UX on flaky networks
7. **BUG-001** — Regenerate doesn't abort requests (High, Medium) — race condition
8. **BUG-002** — Citation regex vs. markdown links (High, Medium) — broken content rendering
9. **BUG-017** — Markdown components not memoized (Medium, Quick) — easy perf win
10. **BUG-016** — scrollToBottom on every update (Medium, Quick) — scroll jitter
11. **BUG-012** — h-screen on mobile (Medium, Quick) — broken mobile layout
12. **BUG-013** — Missing aria-labels (Medium, Quick) — low effort, high accessibility value
13. **BUG-015** — Missing aria-pressed (Medium, Quick) — low effort, high accessibility value
14. **BUG-005** — Follow-up no debounce (Medium, Quick) — duplicate message risk
15. **BUG-008** — Copied state ignores clipboard result (Medium, Quick) — misleading feedback
16. **BUG-006** — Sources outside message bubble (Medium, Medium) — visual confusion
17. **BUG-009** — Expanded state not persisted (Medium, Medium) — frustrating re-reads
18. **BUG-021** — No message length validation (Medium, Quick) — API abuse risk
19. **BUG-023** — Fragile isStreaming check (Medium, Quick) — false streaming indicators
20. **BUG-004** — Case-sensitive non-Latin search (Medium, Quick) — affects i18n users
21. **BUG-007** — Toast on untoggle (Low, Quick) — minor annoyance
22. **BUG-010** — Hardcoded preview length (Low, Quick) — minor polish
23. **BUG-011** — No external link warning (Low, Quick) — minor polish
24. **BUG-019** — Unnecessary wrapper (Low, Quick) — code hygiene
25. **BUG-003** — Dead code in truncation (Low, Quick) — code hygiene
26. **BUG-024** — align-super cross-browser (Low, Medium) — minor rendering inconsistency

---

*This audit is a starting point, not a finish line. Each bug is an opportunity to make MimoNotes feel a little more polished, a little more reliable, and a little more welcoming to every user. Fix what matters most to your users first — the rest will follow.* ✨
