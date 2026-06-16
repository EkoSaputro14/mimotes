# Sprint D2 Implementation Report — Request Lifecycle Hardening

**Date:** June 14, 2026  
**Status:** ✅ COMPLETE  
**Build:** ⚠️ Pre-existing TypeScript error in `route.ts:53` (not related to this sprint)  
**Tests:** ✅ 218/218 pass, 5 pre-existing Docker/Prisma failures  
**Chat components TypeScript:** ✅ Zero errors

---

## Scope

Implemented 6 targeted fixes from the Chat V2 Polish Audit:

| ID | Category | Component | Change |
|----|----------|-----------|--------|
| BUG-001 | Lifecycle | chat-window.tsx | Regenerate must cancel in-flight requests |
| BUG-002 | Correctness | message-bubble.tsx | Citation parser must not conflict with markdown links |
| BUG-016 | Performance | chat-window.tsx | scrollToBottom should not fire on every stream update |
| BUG-017 | Performance | message-bubble.tsx | Memoize markdown components |
| BUG-018 | Performance | session-sidebar.tsx | Stop refetching sessions on every session switch |
| BUG-023 | Correctness | chat-window.tsx | Replace `message.content === ""` with explicit `isStreaming` state |

---

## Files Modified

| File | Changes |
|------|---------|
| `components/chat/chat-window.tsx` | BUG-001, BUG-016, BUG-018, BUG-023 |
| `components/chat/message-bubble.tsx` | BUG-002, BUG-017 |
| `components/chat/session-sidebar.tsx` | BUG-018 (refreshTrigger prop) |

---

## Detailed Changes

### BUG-001: Regenerate must cancel in-flight requests
**Before:** `handleRegenerate` created a new fetch without any AbortController. Multiple rapid clicks could spawn parallel requests.  
**After:** Added `abortControllerRef` (useRef). Every request (submit, regenerate, session switch, new chat) calls `abortInFlight()` first. AbortController is stored in ref and cleaned up on unmount.  
**Impact:** Prevents orphaned requests, memory leaks, and race conditions.

### BUG-002: Citation parser must not conflict with markdown links
**Before:** Regex `/\[(\d+(?:,\s*\d+)*)\]/g` matched `[1]` even in `[1](url)` context. Children array from react-markdown (mix of strings and `<a>` elements) caused `typeof children === "string"` to fail, skipping citation parsing entirely in paragraphs with links.  
**After:** Regex updated to `/\[(\d+(?:,\s*\d+)*)\](?!\()/g` (negative lookahead for `(`). New `processMarkdownChildren()` function handles both string and array children, applying citation parsing to all string segments.  
**Impact:** Citations now work correctly alongside markdown links. `[1](url)` is preserved as a link, `[1]` is parsed as a citation.

### BUG-016: scrollToBottom should not fire on every stream update
**Before:** `useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom])` fired on every state update during streaming (every chunk), causing scroll jitter.  
**After:** Track `prevMessageCountRef`. Scroll immediately only when a new message is added (count increases). During streaming (count stable + isLoading), use debounced scroll (150ms).  
**Impact:** Eliminates scroll jitter during streaming. Smooth scroll only when needed.

### BUG-017: Memoize markdown components
**Before:** `createMarkdownComponents` was called with `activeCitation` as dependency, causing entire markdown component tree to be recreated on every citation click.  
**After:** `activeCitation` stored in `useRef`. `createMarkdownComponents` accepts ref instead of value. `useMemo` depends only on `handleCitationClick` (stable via useCallback). Components read `activeCitationRef.current` on each render.  
**Impact:** Markdown components object is created once per message. Reduces unnecessary React reconciliation during streaming and citation interaction.

### BUG-018: Stop refetching sessions on every session switch
**Before:** `useEffect(() => { if (currentSessionId) { fetchSessions(); } }, [currentSessionId])` refetches sessions on every session switch.  
**After:** Removed the `currentSessionId` watcher. Added `refreshTrigger` prop to `SessionSidebar`. Parent increments counter only when new session is created. Sidebar fetches on mount + when `refreshTrigger` changes.  
**Impact:** Eliminates redundant API calls. Sessions fetched on mount and after new session creation only.

### BUG-023: Replace `message.content === ""` with explicit `isStreaming` state
**Before:** `isStreaming` prop derived from `message.content === ""` — fragile, breaks if content starts with empty string for other reasons.  
**After:** Added `isStreaming?: boolean` to `Message` interface. Set to `true` when streaming starts, `false` when complete. Parent passes `message.isStreaming ?? false` to `MessageBubble`.  
**Impact:** Explicit state is reliable and self-documenting. No more fragile content-length checks.

---

## Request Lifecycle Architecture

```
User Action → abortInFlight() → Create new AbortController → Store in ref
                ↓
            Fetch with signal
                ↓
        ┌─── Success ──→ Stream chunks → Mark isStreaming=false → Clear ref
        │
        ├─── Abort ────→ Silent return (no error toast) → Clear ref
        │
        ├─── Timeout ──→ AbortController.abort() → AbortError handler → Clear ref
        │
        └─── Failure ──→ Error toast + error message → Clear ref
```

Every request follows: `start → success | abort | timeout | failure → cleanup`

---

## Verification

- [x] All chat component files compile with zero TypeScript errors
- [x] All 218 existing tests pass
- [x] No new test failures introduced
- [x] No API changes
- [x] No database schema changes
- [x] No new dependencies added
- [x] UI appearance preserved (no visual regressions)
- [x] Health endpoint returns 200 OK

---

## Commit

```
fix(chat): Sprint D2 request lifecycle hardening

- BUG-001: Add AbortController ref, cancel in-flight on regenerate/switch/new chat
- BUG-002: Citation regex negative lookahead, handle array children from react-markdown
- BUG-016: Debounce scrollToBottom during streaming, immediate on new message
- BUG-017: Memoize markdown components with ref-based activeCitation
- BUG-018: Replace currentSessionId watcher with refreshTrigger prop
- BUG-023: Add explicit isStreaming flag to Message interface
```
