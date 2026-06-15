# MimoNotes Chat V2 — Sprint C Execution Plan

> **Document Type:** Sprint C Execution Plan
> **Version:** 1.0.0
> **Status:** Ready for Execution
> **Created:** 2026-06-14
> **Design Spec:** `CHAT_EXPERIENCE_V2.md`

---

## Overview

This plan translates the Chat Experience V2 design spec into four sequential sprints. Each sprint is independently deployable, breaks nothing, and builds on the previous.

**Total scope:** 7 new components, 5 modified files, 0 new dependencies.
**Stack:** Next.js 16, React, TypeScript, Tailwind v4, Geist Sans.
**Language:** All UI text stays in Indonesian.
**Quality gates:** 353 existing tests pass + 0 build errors after every sprint.

---

## Pre-Sprint Checklist (run before every sprint)

Before touching any code:

```bash
# 1. Verify clean build
npm run build

# 2. Verify all tests pass
npm test

# 3. Verify Docker environment is healthy (if using Docker)
docker compose ps

# 4. Create feature branch
git checkout -b feat/chat-v2-sprint-c[N]

# 5. Confirm no uncommitted changes from previous work
git status
```

**All 5 steps must pass.** If any fails, fix it before starting the sprint.

---

## Post-Sprint Checklist (run after every sprint)

After completing all sprint tasks:

```bash
# 1. Build succeeds
npm run build

# 2. All 353 tests pass
npm test

# 3. Manual smoke test in browser
#    - Open /chat page
#    - Send a message
#    - Verify no console errors

# 4. Commit with descriptive message
git add .
git commit -m "feat(chat): [sprint description]"

# 5. Verify no regressions
git diff --stat main
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `react-markdown` custom component override breaks existing rendering | Medium | High | Test all existing message types after changes; keep fallback for non-citation `[N]` patterns |
| framer-motion AnimatePresence causes layout shifts | Low | Medium | Use `layout` prop; test expand/collapse repeatedly |
| Touch events conflict with scroll on mobile | Medium | Medium | Use `preventDefault` only on long-press, not on scroll; test with touch simulation |
| CSS specificity conflicts with existing globals.css | Low | Medium | Use Tailwind utility classes first; add CSS only when utilities aren't enough |
| Breaking existing 353 tests | Low | High | Run tests after every file change; never modify test files in this sprint |
| Sonner toast import conflicts | Very Low | Low | Already imported in project; no new toast instances conflict |

## Rollback Strategy

Each sprint is a single git commit. To rollback:

```bash
# Rollback last sprint
git revert HEAD

# Or rollback to a specific sprint
git log --oneline  # find the commit hash
git revert [commit-hash]

# Verify rollback
npm run build && npm test
```

If a sprint breaks something and `git revert` is complex (due to later sprints building on it), roll back the entire Chat V2 feature:

```bash
git revert --no-commit feat/chat-v2-sprint-c1..feat/chat-v2-sprint-c4
```

---

## Sprint C1: Foundation — Empty State + Loading

**Estimated time:** 3–4 hours
**Goal:** Replace the generic 🤖 empty state with a warm, actionable onboarding screen. Replace bouncing dots with phase-aware loading indicators.

### Goals

- Users see a welcoming empty state that guides them toward value
- Users understand what the system is doing during loading (searching → generating)
- Loading experience feels premium, not generic

### Files to Create

| File | Purpose | Key Details |
|------|---------|-------------|
| `components/chat/empty-state-chat.tsx` | Onboarding empty state with prompts, quick actions, recent docs | Time-of-day greeting, 6 suggested prompts (Indonesian), upload/knowledge base quick actions, recent documents list from `/api/documents` |
| `components/chat/loading-indicator.tsx` | Phase-aware loading indicator | 3 phases: retrieving (pulsing search icon + text), generating (skeleton bars), streaming (typing cursor). Uses existing Skeleton component for shimmer. |
| `components/chat/__tests__/empty-state-chat.test.tsx` | Unit tests for EmptyStateChat | Renders greeting, renders all 6 prompt cards, calls onSendPrompt when clicked, renders quick action buttons, shows recent documents when provided |
| `components/chat/__tests__/loading-indicator.test.tsx` | Unit tests for LoadingIndicator | Renders correct phase text, shows search icon for retrieving, shows skeleton for generating, shows cursor for streaming |

### Files to Modify

| File | Changes | Risk |
|------|---------|------|
| `components/chat/chat-window.tsx` | Replace inline empty state (lines ~276-286) with `<EmptyStateChat>`. Replace bouncing dots (lines ~292-311) with `<LoadingIndicator>`. Add `loadingPhase` state: `'idle' \| 'retrieving' \| 'generating' \| 'streaming'`. Wire phase transitions to existing stream lifecycle. | Medium — state machine must match existing fetch logic |
| `app/globals.css` | Add `.typing-cursor` animation (`@keyframes cursorBlink`, 1.06s step-end). Add `.skeleton-shimmer` refinement for loading bars. | Low — purely additive CSS |

### Dependencies

- None — this is the foundation sprint
- Must not touch: `message-bubble.tsx`, `source-card.tsx`, `session-sidebar.tsx`

### Implementation Details

**EmptyStateChat props:**
```typescript
interface EmptyStateChatProps {
  onSendPrompt: (prompt: string) => void
  onUploadDocument: () => void
  onViewKnowledgeBase: () => void
  recentDocuments?: Array<{
    id: string
    title: string
    fileType: string
    createdAt: string
  }>
}
```

**Loading phases wired to ChatWindow:**
1. User sends message → `loadingPhase = 'retrieving'`
2. Response stream starts receiving data → `loadingPhase = 'streaming'`
3. Stream ends → `loadingPhase = 'idle'`

**Suggested prompts (Indonesian):**
1. 📄 "Ringkas dokumen terbaru saya"
2. 💡 "Apa saja tema utama dalam riset saya?"
3. 🔍 "Cari semua dokumen tentang..."
4. 📊 "Bandingkan catatan dari Q2 dan Q3"
5. 🧠 "Jelaskan hubungan antara..."
6. ✍️ "Bantu saya menulis ringkasan tentang topik ini"

**Greeting by time of day:**
- 05:00–11:59: "Selamat pagi! Ada yang bisa saya bantu?"
- 12:00–16:59: "Selamat siang! Ada yang bisa saya bantu?"
- 17:00–20:59: "Selamat malam! Ada yang bisa saya bantu?"
- 21:00–04:59: "Hai! Ada yang bisa saya bantu?"

### Verification Steps

```bash
# 1. Build passes
npm run build

# 2. All 353 tests still pass
npm test

# 3. Manual verification
#    - Navigate to /chat with no messages → see EmptyStateChat
#    - Click a prompt card → message sends
#    - Send a message → see LoadingIndicator phases
#    - Verify typing cursor disappears when streaming ends

# 4. Commit
git commit -m "feat(chat): empty state onboarding + phase-aware loading indicator"
```

---

## Sprint C2: Citations + Sources

**Estimated time:** 4–5 hours
**Goal:** Replace the horizontal source strip with inline citation markers and collapsible per-message source previews. Improve answer layout typography.

### Goals

- Users see `[1]`, `[2]`, `[3]` markers in AI responses that connect to sources
- Sources are collapsible below each assistant message (not a global strip)
- Markdown typography feels premium (code blocks, blockquotes, tables)
- Users can click citation markers to scroll to the relevant source

### Files to Create

| File | Purpose | Key Details |
|------|---------|-------------|
| `components/chat/citation-marker.tsx` | Inline superscript citation `[1]` | 11px, `--primary` color, hover highlight, clickable, vertical-align super |
| `components/chat/source-preview.tsx` | Collapsible source section per message | Header "Sumber (N)" with chevron toggle, source cards with number badge, document title, file type, similarity score, content snippet (line-clamp-2), "Lihat Dokumen" link. framer-motion expand/collapse animation. |
| `components/chat/__tests__/citation-marker.test.tsx` | Unit tests for CitationMarker | Renders index number, applies active class, calls onClick |
| `components/chat/__tests__/source-preview.test.tsx` | Unit tests for SourcePreview | Renders source count, toggles expand/collapse, shows source cards, calls onSourceClick |

### Files to Modify

| File | Changes | Risk |
|------|---------|------|
| `components/chat/message-bubble.tsx` | Accept `sources` array prop. Render `SourcePreview` below assistant message content. Parse `[N]` patterns from markdown and render as `CitationMarker`. Update `max-w` to `max-w-[85%] md:max-w-[85%]`. Add scroll-to-source on citation click. | High — modifies core message rendering |
| `components/chat/chat-window.tsx` | Add `expandedSources: Record<string, boolean>` state. Pass sources + expand state to `MessageBubble`. Remove horizontal source strip (lines ~317-328). Auto-expand sources for most recent assistant message. | Medium — removing existing feature |
| `components/chat/source-card.tsx` | Minor styling alignment: ensure compatibility with SourcePreview's source card styling. Keep for desktop source panel if needed. | Low |
| `app/globals.css` | Add `.citation-marker` styles (font-size, color, hover, active states). Refine `.markdown-body blockquote` (left border in `--primary`, italic, background). Refine `.markdown-body table` (horizontal scroll on mobile). Add heading hierarchy styles. | Low — additive CSS |

### Dependencies

- **Must complete Sprint C1 first** — EmptyStateChat and LoadingIndicator must be in place
- Uses existing `react-markdown` for citation parsing via custom component overrides

### Implementation Details

**Citation pattern:** `[N]` where N is 1–9, preceded by space or punctuation. Parsed via custom text node renderer in react-markdown.

**SourcePreview props:**
```typescript
interface SourcePreviewProps {
  sources: Source[]
  isExpanded: boolean
  onToggle: () => void
  onSourceClick: (source: Source) => void
  highlightedSource?: number  // for scroll-to-source highlight
}

interface Source {
  documentId: string
  content: string
  similarity: number
  metadata: Record<string, unknown>
}
```

**Source card styling:**
- Number badge: 20px circle, `--primary` bg, white text
- Similarity score: `--primary` color when > 90%, `--foreground` otherwise
- Content snippet: max 2 lines with `line-clamp-2`
- "Lihat Dokumen" link with ExternalLink icon

**Scroll-to-source:** When user clicks `[N]`, `element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })` scrolls to the SourcePreview section. Target source card gets a brief `--primary` border flash via CSS animation.

### Verification Steps

```bash
# 1. Build passes
npm run build

# 2. All 353 tests still pass
npm test

# 3. Manual verification
#    - Send a message that returns sources
#    - Verify [1], [2], [3] markers appear inline
#    - Click a marker → scrolls to SourcePreview
#    - Expand/collapse source section works
#    - Sources persist per message (not just last one)
#    - Markdown renders correctly (code blocks, blockquotes, tables)

# 4. Commit
git commit -m "feat(chat): inline citations + collapsible source previews + answer layout"
```

---

## Sprint C3: Feedback + Error Recovery

**Estimated time:** 3–4 hours
**Goal:** Add thumbs up/down, copy, and regenerate actions to every assistant message. Add offline detection, error recovery with retry, and provider unavailable messaging.

### Goals

- Users can give feedback on AI responses (client-side only)
- Users can copy message content and regenerate responses
- Users see clear error states with retry options
- System detects offline status and shows a banner

### Files to Create

| File | Purpose | Key Details |
|------|---------|-------------|
| `components/chat/message-actions.tsx` | Feedback + copy + regenerate button row | ThumbsUp, ThumbsDown, Copy, RefreshCw icons. Toggle fill for feedback. Copy shows Check for 2s. Regenerate only on last assistant message. Uses sonner toasts in Indonesian. |
| `components/chat/error-banner.tsx` | Persistent offline/provider unavailable banner | Two states: offline ("Anda sedang offline") and provider unavailable ("Layanan AI sedang tidak tersedia"). Uses AlertTriangle icon, framer-motion slide animation. Sticky below chat header. |
| `components/chat/__tests__/message-actions.test.tsx` | Unit tests for MessageActions | Renders all buttons, toggles feedback, copy writes to clipboard, regenerate calls callback |
| `components/chat/__tests__/error-banner.test.tsx` | Unit tests for ErrorBanner | Renders offline message, renders provider message, calls onRetry |

### Files to Modify

| File | Changes | Risk |
|------|---------|------|
| `components/chat/message-bubble.tsx` | Accept `isLast`, `onRegenerate`, `onFeedback`, `feedback` props. Render `MessageActions` below assistant messages. Detect error messages and render retry button with error styling (`--destructive/5` bg, `--destructive/20` border). Move existing copy functionality into `MessageActions`. | Medium — adding props to existing interface |
| `components/chat/chat-window.tsx` | Add `feedbackState: Record<string, 'positive' \| 'negative' \| null>`. Add `isOnline` state with `navigator.onLine` + event listeners. Add `providerStatus` state. Add `retryCount` tracking and exponential backoff logic (max 3 retries: 1s, 2s, 4s). Render `ErrorBanner` when offline/provider unavailable. Wire `onFeedback` and `onRegenerate` callbacks. | Medium — state management complexity |
| `app/globals.css` | Add `.error-message` styles (subtle red tint, border). Add error retry button styling. | Low |

### Dependencies

- **Must complete Sprint C2 first** — MessageBubble must have sources/citations support
- Uses existing `sonner` for toasts, `lucide-react` for icons, `framer-motion` for animation

### Implementation Details

**MessageActions props:**
```typescript
interface MessageActionsProps {
  messageId: string
  content: string
  isLast: boolean
  onRegenerate?: () => void
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void
  feedback?: 'positive' | 'negative' | null
}
```

**Feedback flow:**
1. Click thumbs up → icon fills green, toast: "Terima kasih atas umpan balik Anda!"
2. Click same again → deselect (toggle off)
3. Click opposite → switch selection
4. All state is client-side only (no API call)

**Copy flow:**
1. Click copy → clipboard write, icon changes to Check for 2s
2. Toast: "Pesan tersalin!"

**Error recovery:**
- Auto-retry once after 2s for network errors (not 4xx)
- Manual retry with exponential backoff: 1s → 2s → 4s (max 3 retries)
- Offline detection: `window.addEventListener('online'/'offline')`
- Coming back online → auto-dismiss banner, toast: "Koneksi restored"
- Going offline → show banner, disable input

**Toast messages (Indonesian):**
- Feedback: "Terima kasih atas umpan balik Anda!"
- Copy: "Pesan tersalin!"
- Offline: "Anda sedang offline. Periksa koneksi internet."
- Online restored: "Koneksi restored"
- Provider unavailable: "Layanan AI sedang tidak tersedia. Coba lagi dalam beberapa saat."

### Verification Steps

```bash
# 1. Build passes
npm run build

# 2. All 353 tests still pass
npm test

# 3. Manual verification
#    - Assistant message shows 👍 👎 📋 buttons
#    - Thumbs up/down toggle works with toast
#    - Copy shows checkmark and toast
#    - Last assistant message shows regenerate button
#    - Simulate error → shows retry button
#    - Simulate offline → shows ErrorBanner
#    - Simulate online → banner dismisses with toast

# 4. Commit
git commit -m "feat(chat): feedback system + error recovery with retry"
```

---

## Sprint C4: Mobile + Polish

**Estimated time:** 3–4 hours
**Goal:** Mobile-first refinements: source bottom sheet, safe area padding, long-press context menu, pull-to-refresh, responsive width pass.

### Goals

- Mobile users get a bottom sheet for sources instead of inline expansion
- iOS safe area is properly handled
- Long-press on messages shows context menu
- Session sidebar supports pull-to-refresh
- All components pass responsive audit

### Files to Create

| File | Purpose | Key Details |
|------|---------|-------------|
| `components/chat/message-context-menu.tsx` | Long-press context menu for messages | Uses existing DropdownMenu. Items: "Salin teks", "Salin kutipan", "Lihat sumber" (assistant only). 500ms long-press trigger. Haptic feedback via `navigator.vibrate(10)`. |
| `components/chat/source-bottom-sheet.tsx` | Mobile source bottom sheet | Wraps existing `Sheet` component with `side="bottom"`. 50vh max height. Drag handle (40px × 4px). Contains same source cards as SourcePreview. Used when user taps citation on mobile. |
| `components/chat/__tests__/message-context-menu.test.tsx` | Unit tests | Renders menu items, calls callbacks, hides "Lihat sumber" for user messages |
| `components/chat/__tests__/source-bottom-sheet.test.tsx` | Unit tests | Renders in sheet, shows sources, closes on backdrop click |

### Files to Modify

| File | Changes | Risk |
|------|---------|------|
| `components/chat/chat-window.tsx` | Add `pb-[env(safe-area-inset-bottom)]` to input container. Add responsive `max-w-[90%] md:max-w-[85%]` to assistant messages. Add `mobileSourcesOpen` state for source bottom sheet. Add `contextMenuMessage` state for long-press menu. Render `SourceBottomSheet` on mobile. Render `MessageContextMenu`. Detect mobile via `window.innerWidth < 768` or `matchMedia`. | Medium — mobile detection + state |
| `components/chat/message-bubble.tsx` | Add long-press handler (500ms `setTimeout` on `touchstart`, clear on `touchend`/`touchmove`). On mobile, tapping citation opens `SourceBottomSheet` instead of inline expansion. Render `MessageContextMenu` on long-press. | Medium — touch event handling |
| `components/chat/session-sidebar.tsx` | Add pull-to-refresh: `touchstart`/`touchmove`/`touchend` handlers. Trigger threshold: 80px pull distance. Visual: `Loader2` icon spinning. Uses existing `fetchSessions`. framer-motion spring animation for pull indicator. | Low — additive touch handlers |

### Dependencies

- **Must complete Sprint C3 first** — MessageActions and ErrorBanner must exist
- Uses existing `Sheet`, `DropdownMenu` UI components
- Uses existing `framer-motion` for animations

### Implementation Details

**SourceBottomSheet props:**
```typescript
interface SourceBottomSheetProps {
  sources: Source[]
  isOpen: boolean
  onClose: () => void
  onSourceClick: (source: Source) => void
}
```

**MessageContextMenu props:**
```typescript
interface MessageContextMenuProps {
  message: Message
  onCopy: () => void
  onCopyAsQuote: () => void
  onViewSources?: () => void  // only for assistant messages
}
```

**Long-press implementation:**
```typescript
// On touchstart
const timer = setTimeout(() => {
  navigator.vibrate(10)  // haptic feedback
  setShowContextMenu(true)
}, 500)

// On touchend / touchmove → clearTimeout(timer)
```

**Pull-to-refresh in SessionSidebar:**
- Track `touchStartY` and `touchCurrentY`
- If scrollTop === 0 and pull distance > 80px → trigger refresh
- Visual: `Loader2` icon from lucide-react, spinning, `--muted-foreground` color
- framer-motion spring physics for the pull indicator animation

**Safe area padding:**
```css
/* Applied to chat input container */
padding-bottom: env(safe-area-inset-bottom);
```

**Responsive message widths:**
- Mobile (< 768px): `max-w-[90%]`
- Desktop (≥ 768px): `max-w-[85%]`
- Class: `max-w-[90%] md:max-w-[85%]`

### Verification Steps

```bash
# 1. Build passes
npm run build

# 2. All 353 tests still pass
npm test

# 3. Manual verification (mobile)
#    - Open Chrome DevTools, toggle device toolbar
#    - Test iPhone 14 Pro viewport
#    - Tap citation → source bottom sheet opens
#    - Long-press message → context menu appears
#    - Input not hidden behind home indicator
#    - Messages use 90% width on mobile
#    - Pull down on session sidebar → refresh indicator appears

# 4. Manual verification (desktop)
#    - All features still work on desktop
#    - No regression from mobile changes

# 5. Commit
git commit -m "feat(chat): mobile bottom sheet + context menu + pull-to-refresh + responsive polish"
```

---

## Sprint Summary

| Sprint | Focus | New Components | Modified Files | Est. Time |
|--------|-------|---------------|----------------|-----------|
| C1 | Foundation | EmptyStateChat, LoadingIndicator | chat-window, globals.css | 3–4h |
| C2 | Citations | CitationMarker, SourcePreview | message-bubble, chat-window, source-card, globals.css | 4–5h |
| C3 | Feedback + Errors | MessageActions, ErrorBanner | message-bubble, chat-window, globals.css | 3–4h |
| C4 | Mobile + Polish | MessageContextMenu, SourceBottomSheet | chat-window, message-bubble, session-sidebar | 3–4h |
| **Total** | | **7 components** | **5 files** | **13–16h** |

---

## Execution Order Summary

```
C1: Empty State + Loading
 └── C2: Citations + Sources
      └── C3: Feedback + Error Recovery
           └── C4: Mobile + Polish
```

Each sprint commit is tagged:
```bash
git tag sprint-c1
git tag sprint-c2
git tag sprint-c3
git tag sprint-c4
```

---

## File Manifest (Final)

### Files to Create (7)
```
components/chat/empty-state-chat.tsx
components/chat/loading-indicator.tsx
components/chat/citation-marker.tsx
components/chat/source-preview.tsx
components/chat/message-actions.tsx
components/chat/error-banner.tsx
components/chat/message-context-menu.tsx
components/chat/source-bottom-sheet.tsx
```

### Files to Modify (5)
```
components/chat/chat-window.tsx          # Major changes across all sprints
components/chat/message-bubble.tsx       # Major changes across sprints C2–C4
components/chat/session-sidebar.tsx      # Minor: pull-to-refresh (C4)
components/chat/source-card.tsx          # Minor: styling alignment (C2)
app/globals.css                          # Minor: CSS additions (C1–C3)
```

### Test Files to Create (8)
```
components/chat/__tests__/empty-state-chat.test.tsx
components/chat/__tests__/loading-indicator.test.tsx
components/chat/__tests__/citation-marker.test.tsx
components/chat/__tests__/source-preview.test.tsx
components/chat/__tests__/message-actions.test.tsx
components/chat/__tests__/error-banner.test.tsx
components/chat/__tests__/message-context-menu.test.tsx
components/chat/__tests__/source-bottom-sheet.test.tsx
```

---

## Appendix: Key Design Tokens Used

All from existing `globals.css` — no new tokens needed:

- `--primary` (warm-purple 265°) — citations, links, accents
- `--muted` / `--muted-foreground` — secondary text, backgrounds
- `--card` / `--border` — card backgrounds, borders
- `--destructive` — error states, thumbs down
- `--success` (implied) — thumbs up
- `--warning` — offline/provider banners
- `--foreground` — primary text
- `--shadow-sm` — card hover elevation

## Appendix: Indonesian Text Strings

| Key | Text |
|-----|------|
| greeting.morning | "Selamat pagi! Ada yang bisa saya bantu?" |
| greeting.afternoon | "Selamat siang! Ada yang bisa saya bantu?" |
| greeting.evening | "Selamat malam! Ada yang bisa saya bantu?" |
| greeting.night | "Hai! Ada yang bisa saya bantu?" |
| prompt.ringkas | "Ringkas dokumen terbaru saya" |
| prompt.analisis | "Apa saja tema utama dalam riset saya?" |
| prompt.cari | "Cari semua dokumen tentang..." |
| prompt.bandingkan | "Bandingkan catatan dari Q2 dan Q3" |
| prompt.hubungkan | "Jelaskan hubungan antara..." |
| prompt.tulis | "Bantu saya menulis ringkasan tentang topik ini" |
| loading.retrieving | "Mencari dokumen yang relevan..." |
| loading.generating | "Menyiapkan respons..." |
| sources.title | "Sumber ({count})" |
| sources.view | "Lihat Dokumen" |
| sources.match | "{score}% kecocokan" |
| feedback.thanks | "Terima kasih atas umpan balik Anda!" |
| feedback.copy | "Pesan tersalin!" |
| error.offline | "Anda sedang offline. Periksa koneksi internet." |
| error.provider | "Layanan AI sedang tidak tersedia. Coba lagi dalam beberapa saat." |
| error.retry | "Coba lagi" |
| error.message | "Maaf, terjadi kesalahan saat memproses permintaan Anda." |
| context.copy | "Salin teks" |
| context.quote | "Salin kutipan" |
| context.sources | "Lihat sumber" |
| quick.upload | "Upload Dokumen" |
| quick.knowledge | "Lihat Basis Pengetahuan" |
| docs.recent | "Dokumen Terbaru" |
| actions.quick | "Aksi Cepat" |

---

> **End of Sprint C Execution Plan**
>
> Ready to execute. Start with Sprint C1, run pre-sprint checklist, implement, run post-sprint checklist, commit, then proceed to C2.
>
> Each sprint is a single, reviewable commit. Each is independently deployable. Nothing breaks along the way.
