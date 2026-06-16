# CHAT V2 POLISH AUDIT — Sprint C Pre-Implementation

**Audit date**: 2026-06-14
**Components audited**: chat-window.tsx, message-bubble.tsx, feedback-bar.tsx, citation-marker.tsx, source-preview.tsx, source-card.tsx, session-sidebar.tsx, page.tsx
**Scope**: READ-ONLY — no code changes

---

## Executive Summary

MimoNotes Chat V2 delivers a functional RAG-powered chat experience with solid markdown rendering and source attribution. However, the UX surface has significant gaps across accessibility, mobile touch targets, state management, and first-time user guidance. **Overall score: 4.6/10** — functional but not polished. Sprint C should prioritize the 3 Critical issues (citation regex false positives, touch targets below WCAG minimum, missing aria-live for new messages) and 5 High-severity items before considering any new features.

---

## 1. EMPTY STATE

**Score: 3/10** | **Severity: Medium**

### Evidence

- `chat-window.tsx` L215–225: Empty state renders emoji `🤖`, heading "Selamat datang di Mimotes", and 2-line description.
- No suggested prompts, quick actions, recent documents, or onboarding flow.
- `FOLLOW_UP_SUGGESTIONS` (L32–36) are only shown after a message is sent — not in the empty state.

### Issues

| # | Issue | Detail |
|---|-------|--------|
| 1 | No suggested prompts | First-time users have no idea what to ask |
| 2 | No quick actions | No "Upload document", "View docs", or "Start chat" buttons |
| 3 | No recent documents | Returning users see same generic empty state |
| 4 | Generic emoji feels unprofessional | `🤖` doesn't convey brand warmth |
| 5 | No onboarding value proposition | Description is functional but doesn't sell the product |

### Fix Recommendation

Replace emoji with a branded SVG/illustration. Add 3 contextual suggested prompts based on user's uploaded documents. Show recent documents below suggestions. Include a brief value prop ("Ask questions about your documents — answers come with sources").

---

## 2. CITATIONS

**Score: 6/10** | **Severity: Critical**

### Evidence

- `message-bubble.tsx` L38–39: `hasCitations` uses regex `/\[\d+(?:,\s*\d+)*\]/`
- `message-bubble.tsx` L44–65: `parseContentWithCitations` uses same regex to split text
- `citation-marker.tsx` L1–33: Renders inline button with `aria-label={Sumber ${index}}`
- `chat-window.tsx` L80–86: `handleCitationClick` toggles highlight and scrolls

### Issues

| # | Issue | Detail | Severity |
|---|-------|--------|----------|
| 1 | Citation regex matches markdown links | `[text](url)` will match the `[text]` part as a citation — false positive | **Critical** |
| 2 | No visual distinction from markdown links | Both citations and links appear as clickable elements | High |
| 3 | Citation numbers not sequential per-message | Global numbering across message; reusing across session loads may create duplicates | Medium |
| 4 | Scroll to source unreliable on mobile | `scrollIntoView` may not work correctly with fixed sidebar overlay | Medium |
| 5 | No explicit dismiss for citations | Clicking same citation toggles off — no "×" or separate dismiss action | Low |

### Fix Recommendation

Use a more specific citation regex that excludes markdown link patterns, e.g. `/(?<!\]\()\\[(\d+(?:,\s*\d+)*)\\](?!\()/`. Add visual differentiator (superscript styling with distinct color). Implement per-message sequential numbering. Add explicit dismiss button.

---

## 3. SOURCE PREVIEW

**Score: 6/10** | **Severity: High**

### Evidence

- `source-preview.tsx` L43: `previewLength = 200` — hardcoded
- `source-preview.tsx` L40: `const [expanded, setExpanded] = useState(false)` — local state, lost on re-render
- `source-preview.tsx` L52: `similarityPercent` shown as plain percentage with no tooltip
- `source-preview.tsx` L76–87: Expanded content section — no copy button, no keyboard nav
- `source-card.tsx` L39: Same `previewLength = 200` pattern duplicated

### Issues

| # | Issue | Detail |
|---|-------|--------|
| 1 | Fixed 200-char preview | Doesn't adapt to content type or screen size |
| 2 | No keyboard navigation | Can't Tab between source cards |
| 3 | Expanded state not persisted | Re-render collapses all sources |
| 4 | Similarity % unexplained | "85%" has no tooltip explaining what it means |
| 5 | No copy source text action | Users can't extract source content |
| 6 | Full-width on mobile | Could use horizontal scroll for compact layout |

### Fix Recommendation

Make preview length responsive (120px mobile, 200px desktop). Add `aria-expanded` and keyboard arrow navigation. Persist expanded state in parent or URL. Add tooltip for similarity. Add copy button. Consider horizontal scroll carousel on mobile.

---

## 4. FEEDBACK BAR

**Score: 5/10** | **Severity: High**

### Evidence

- `feedback-bar.tsx` L49: Comment "Client-side only — no backend API needed for Sprint C3 Lite"
- `feedback-bar.tsx` L37–40: Copy reverts after 2s `setTimeout(() => setCopied(false), 2000)`
- `feedback-bar.tsx` L56–58: `h-3.5 w-3.5` = 14×14px icon, with `p-1.5` (6px padding) = 26×26px effective touch target
- `feedback-bar.tsx` L107: Regenerate only rendered when `isLastMessage && onRegenerate`

### Issues

| # | Issue | Detail | Severity |
|---|-------|--------|----------|
| 1 | Feedback lost on refresh | Client-side only, no persistence | High |
| 2 | No visual feedback on toggle | Only toast notification, no persistent state indicator | Medium |
| 3 | No "why" prompt on thumbs-down | Missed opportunity for structured feedback | Medium |
| 4 | Touch targets too small | 26px effective — WCAG requires 44px minimum | **Critical** |
| 5 | Copy reverts after 2s | No persistence, user might miss it | Low |
| 6 | Regenerate only on last message | Can't regenerate older responses | Medium |

### Fix Recommendation

Increase button padding to `p-2` (32px effective) minimum, ideally `p-2.5` (38px) with `min-h-[44px] min-w-[44px]`. Persist feedback via API. Add structured feedback modal for thumbs-down. Keep copy checkmark persistent until next copy.

---

## 5. REGENERATE

**Score: 5/10** | **Severity: High**

### Evidence

- `chat-window.tsx` L90–165: `handleRegenerate` implementation
- L107: `setMessages((prev) => prev.slice(0, lastAssistantIdx))` — destructive removal
- L91: `if (isLoading) return` — basic guard but no mutex
- L103: Sends same prompt to API — new RAG call, different sources possible
- L125: New message ID `(Date.now() + 1).toString()` — potential collision

### Issues

| # | Issue | Detail |
|---|-------|--------|
| 1 | No undo for regeneration | Original response is permanently lost |
| 2 | No confirmation dialog | One-click destroys response |
| 3 | No distinct loading indicator | Same bouncing dots as initial loading |
| 4 | Sources change on regenerate | New RAG call may return different documents |
| 5 | Can't regenerate error messages | `findLastIndex` returns error message but no special handling |
| 6 | Race condition with new message | Concurrent send + regenerate could corrupt state |

### Fix Recommendation

Store previous response in a temporary state before removal. Add confirmation tooltip or undo toast. Show distinct "Regenerating..." indicator. Consider allowing regenerate on any assistant message (not just last). Add request cancellation via AbortController.

---

## 6. FOLLOW-UP SUGGESTIONS

**Score: 4/10** | **Severity: Medium**

### Evidence

- `chat-window.tsx` L32–36: `FOLLOW_UP_SUGGESTIONS` — hardcoded array of 3 Indonesian strings
- `chat-window.tsx` L85–88: `handleFollowUp` auto-submits via `requestSubmit()`
- `chat-window.tsx` L243–247: `showFollowUps` logic — shown when last assistant message has content
- L272: Buttons have `type="button"` — no submit behavior, but auto-submit via JS

### Issues

| # | Issue | Detail |
|---|-------|--------|
| 1 | Static suggestions | Same 3 for every response regardless of content |
| 2 | No context awareness | "Ringkas dalam 3 poin" shown for already-concise answers |
| 3 | Disappear during streaming | Hidden while `isLoading` is true |
| 4 | Auto-submit, no edit | User can't modify suggestion before sending |
| 5 | No dismiss option | Always shown after response |
| 6 | Shown for error messages | Error responses get follow-up suggestions |

### Fix Recommendation

Generate context-aware suggestions from response content. Add edit-before-send flow. Add dismiss button. Don't show for error messages. Add loading state visibility.

---

## 7. MOBILE EXPERIENCE

**Score: 4/10** | **Severity: High**

### Evidence

- `session-sidebar.tsx` L76: Sidebar has `z-50` on mobile
- `feedback-bar.tsx` L56: Icons `h-3.5 w-3.5` — below 44px touch target
- `chat-window.tsx` L54–57: Textarea auto-resize via `style.height` manipulation
- `chat-window.tsx` L266–282: Follow-up suggestions use `flex-wrap gap-2` — wraps on narrow screens
- `source-preview.tsx`: Full-width source cards, no horizontal scroll

### Issues

| # | Issue | Detail |
|---|-------|--------|
| 1 | z-index conflicts | Sidebar z-50 may overlap source previews |
| 2 | Source previews full-width | No compact/mobile layout |
| 3 | Touch targets too small | 26px effective — below 44px WCAG minimum |
| 4 | No pull-to-refresh | Session list can't be refreshed with gesture |
| 5 | iOS Safari textarea jank | Manual height manipulation can cause scroll jumps |
| 6 | Suggestions wrap awkwardly | Narrow screens cause multi-line suggestion chips |
| 7 | No bottom sheet | Source previews should use bottom sheet on mobile |

### Fix Recommendation

Audit z-index hierarchy. Implement horizontal scroll for source cards on mobile. Increase all touch targets to 44px minimum. Add pull-to-refresh. Use CSS `field-sizing: content` or a proper textarea hook. Add bottom sheet for source previews on mobile.

---

## 8. ACCESSIBILITY

**Score: 4/10** | **Severity: High**

### Evidence

- `citation-marker.tsx` L30: `aria-label={Sumber ${index}}` — static, no active state announced
- `source-preview.tsx`: No `aria-expanded` on expand/collapse button
- `message-bubble.tsx` L222–225: Timestamp `opacity-0 group-hover:opacity-100` — invisible to screen readers
- `feedback-bar.tsx` L70, L82: Buttons have both `aria-label` and `title` — redundant but OK
- `chat-window.tsx`: No `aria-live` region for new messages
- No skip-to-content link in any component

### Issues

| # | Issue | Detail | Severity |
|---|-------|--------|----------|
| 1 | No aria-live for new messages | Screen readers don't announce new assistant responses | **Critical** |
| 2 | No aria-expanded on source preview | Screen readers can't tell if source is expanded | High |
| 3 | Citation active state not announced | No `aria-pressed` or `aria-selected` | High |
| 4 | Timestamp invisible to screen readers | `opacity-0` hides content, no `sr-only` alternative | Medium |
| 5 | No skip-to-content link | Keyboard users must tab through sidebar | Medium |
| 6 | No keyboard shortcut docs | Users don't know about Enter to send | Low |

### Fix Recommendation

Wrap message list in `aria-live="polite"` region. Add `aria-expanded` to source preview toggle buttons. Add `aria-pressed` to citation markers. Add `sr-only` timestamp. Add skip-to-content link. Document keyboard shortcuts in help modal.

---

## 9. KEYBOARD NAVIGATION

**Score: 4/10** | **Severity: Medium**

### Evidence

- `chat-window.tsx` L59–64: Enter to send only works within textarea
- `chat-window.tsx` L268: Follow-up suggestions are `type="button"` — in tab order but no keyboard shortcut to reach them
- `session-sidebar.tsx`: Search input has no auto-focus on open
- No global keyboard shortcuts defined anywhere
- No arrow key navigation between messages

### Issues

| # | Issue | Detail |
|---|-------|--------|
| 1 | Enter only works in textarea | No global send shortcut |
| 2 | No shortcut to focus textarea | User must click or tab extensively |
| 3 | Unclear tab order | Citations, source previews, feedback buttons — order undefined |
| 4 | No arrow key message navigation | Can't browse message history with keyboard |
| 5 | Suggestions in tab order but hard to reach | Must tab through all elements above |
| 6 | Search not auto-focused | Sidebar opens but search requires extra Tab |

### Fix Recommendation

Add Cmd/Ctrl+K to focus textarea. Add ArrowUp/Down to navigate messages. Auto-focus search when sidebar opens. Document and implement consistent tab order: sidebar → messages → suggestions → input.

---

## 10. EDGE CASES

**Score: 4/10** | **Severity: High**

### Evidence

- `chat-window.tsx` L183: `id: Date.now().toString()` — collision risk
- `chat-window.tsx` L191: `if (!input.trim() || isLoading) return` — basic guard only
- `chat-window.tsx` L218–228: Error handling adds error message but no empty-response check
- `chat-window.tsx` L85–88: `handleFollowUp` doesn't check `isLoading`
- `chat-window.tsx` L91: `if (isLoading) return` — basic guard for regenerate
- No `AbortController` for fetch requests — no cancellation support

### Issues

| # | Issue | Detail | Severity |
|---|-------|--------|----------|
| 1 | No rate limiting on frontend | Rapid sends could overwhelm API | High |
| 2 | No message length validation | Very long messages may truncate or fail | Medium |
| 3 | Empty API response not handled | Stream completes with empty content — shows empty bubble | High |
| 4 | No network disconnection handling | Streaming中断 leaves broken state | High |
| 5 | Date.now() ID collision | Rapid messages could generate same timestamp | Medium |
| 6 | handleFollowUp doesn't check isLoading | Could trigger during active request | High |
| 7 | Concurrent regenerate + send | Race condition could corrupt message array | High |
| 8 | No debouncing on suggestions | Double-click sends duplicate | Medium |

### Fix Recommendation

Add frontend debounce (300ms) on submit. Validate message length (max 10,000 chars). Check for empty stream content before adding message. Add AbortController for request cancellation. Use `crypto.randomUUID()` or counter-based IDs. Add loading state guard to handleFollowUp. Implement request mutex for regenerate.

---

## Summary Table

| # | Dimension | Score | Key Issue | Severity |
|---|-----------|-------|-----------|----------|
| 1 | Empty State | 3/10 | No suggested prompts or onboarding | Medium |
| 2 | Citations | 6/10 | Regex matches markdown links (false positives) | **Critical** |
| 3 | Source Preview | 6/10 | Expanded state lost on re-render, no keyboard nav | High |
| 4 | Feedback Bar | 5/10 | Touch targets 26px (WCAG min: 44px), client-only | **Critical** |
| 5 | Regenerate | 5/10 | Destructive, no undo, race conditions | High |
| 6 | Follow-Up Suggestions | 4/10 | Static, no context awareness, auto-submit | Medium |
| 7 | Mobile Experience | 4/10 | Touch targets, z-index conflicts, no bottom sheet | High |
| 8 | Accessibility | 4/10 | No aria-live, no aria-expanded, invisible timestamps | **Critical** |
| 9 | Keyboard Navigation | 4/10 | No global shortcuts, unclear tab order | Medium |
| 10 | Edge Cases | 4/10 | No rate limiting, empty response handling, race conditions | High |

---

## Overall Score: 4.7 / 10

---

## Priority Matrix

### 🔴 Critical (Fix Before Sprint C Ship)

| # | Fix | Component | Est. |
|---|-----|-----------|------|
| C1 | Fix citation regex to exclude markdown links | message-bubble.tsx L38–39 | 2h |
| C2 | Increase all interactive touch targets to ≥44px | feedback-bar.tsx, citation-marker.tsx | 3h |
| C3 | Add `aria-live="polite"` to message list | chat-window.tsx | 1h |

### 🟠 High (Fix in Sprint C)

| # | Fix | Component | Est. |
|---|-----|-----------|------|
| H1 | Add `aria-expanded` to source preview toggle | source-preview.tsx | 1h |
| H2 | Add `aria-pressed` to citation markers | citation-marker.tsx | 0.5h |
| H3 | Handle empty API stream responses | chat-window.tsx | 2h |
| H4 | Add request cancellation (AbortController) | chat-window.tsx | 3h |
| H5 | Add loading guard to handleFollowUp | chat-window.tsx L85 | 0.5h |
| H6 | Add rate limiting debounce on submit | chat-window.tsx | 1h |
| H7 | Persist source preview expanded state | source-preview.tsx | 2h |
| H8 | Fix z-index hierarchy for sidebar vs sources | session-sidebar.tsx, source-preview.tsx | 1h |
| H9 | Add network disconnection handling during streaming | chat-window.tsx | 3h |
| H10 | Add undo toast for regenerate | chat-window.tsx | 2h |

### 🟡 Medium (Sprint C or C+1)

| # | Fix | Component | Est. |
|---|-----|-----------|------|
| M1 | Add suggested prompts to empty state | chat-window.tsx | 4h |
| M2 | Context-aware follow-up suggestions | chat-window.tsx | 6h |
| M3 | Add structured feedback modal for thumbs-down | feedback-bar.tsx | 3h |
| M4 | Use crypto.randomUUID() for message IDs | chat-window.tsx | 0.5h |
| M5 | Add message length validation | chat-window.tsx | 1h |
| M6 | Add skip-to-content link | chat-window.tsx | 1h |
| M7 | Auto-focus search when sidebar opens | session-sidebar.tsx | 0.5h |
| M8 | Add keyboard shortcuts (Cmd+K focus, etc.) | chat-window.tsx | 3h |
| M9 | Persist feedback via API | feedback-bar.tsx, API | 4h |
| M10 | Add similarity % tooltip | source-preview.tsx | 1h |
| M11 | Responsive preview length | source-preview.tsx | 1h |
| M12 | Add copy source text button | source-preview.tsx | 1h |

### 🟢 Low (Backlog)

| # | Fix | Component | Est. |
|---|-----|-----------|------|
| L1 | Add explicit dismiss for active citations | citation-marker.tsx | 1h |
| L2 | Persist copy checkmark until next copy | feedback-bar.tsx | 0.5h |
| L3 | Allow regenerate on any assistant message | feedback-bar.tsx, chat-window.tsx | 3h |
| L4 | Add pull-to-refresh for session list | session-sidebar.tsx | 2h |
| L5 | Add bottom sheet for sources on mobile | source-preview.tsx | 4h |
| L6 | Add keyboard shortcut documentation | New component | 2h |
| L7 | Add sr-only timestamp | message-bubble.tsx | 0.5h |
| L8 | Horizontal scroll for sources on mobile | source-preview.tsx | 2h |

---

*Audit complete. Total estimated effort: ~70 hours across all priorities. Critical + High = ~21 hours (1 sprint).*
