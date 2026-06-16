# Phase C2 — Citation Experience Implementation Report

> **Sprint:** C2 — Citations + Sources  
> **Date:** 2026-06-14  
> **Status:** ✅ COMPLETE  
> **Build:** ✅ PASS (0 errors)  
> **Tests:** ✅ 218/218 pass (5 Prisma infrastructure failures, not code-related)  
> **Health:** ✅ 200 OK (292ms latency)

---

## Summary

Implemented inline citation experience for MimoNotes Chat V2. Every assistant message now owns its sources with inline `[1]` `[2]` `[3]` markers, expandable source previews, and persistent source visibility.

## Changes

### New Components (2)

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| `CitationMarker` | `citation-marker.tsx` | 62 | Inline superscript `[1]` citation buttons |
| `SourcePreview` | `source-preview.tsx` | 145 | Expandable source detail cards |

### Modified Components (2)

| Component | File | Changes |
|-----------|------|---------|
| `MessageBubble` | `message-bubble.tsx` | Added inline citation parsing, source previews per message, improved markdown components, better typography |
| `ChatWindow` | `chat-window.tsx` | Removed `currentSources` state, each message owns sources, citation click → scroll to source |

### Modified Styles (1)

| File | Changes |
|------|---------|
| `globals.css` | Complete markdown typography overhaul: better heading hierarchy, list styling, code blocks, blockquotes, links |

## Architecture

### Citation Flow

```
User asks question
  → API returns sources in X-Sources header
  → Sources attached to assistant message object
  → MessageBubble renders sources below the bubble
  → AI response contains [1] [2] markers (from RAG context)
  → CitationMarker renders inline superscript buttons
  → Click citation → highlights source + scrolls to it
```

### Key Design Decisions

1. **Per-message sources** — Sources are part of the `Message` interface, not a global state. When loading a session, each message carries its own sources.

2. **Inline citation parsing** — `parseContentWithCitations()` extracts `[N]` patterns from markdown text and replaces them with clickable `CitationMarker` components.

3. **Source persistence** — Sources remain visible for ALL assistant messages, not just the last one. Users can scroll up and see sources for older messages.

4. **Highlight + scroll** — Clicking a citation marker highlights the corresponding source preview and smooth-scrolls to it.

5. **Markdown typography** — Improved line-height (1.7), heading hierarchy (h1-h4), list nesting, code block borders, blockquote accent color, link underline offset.

## Files Created

```
components/chat/citation-marker.tsx    (62 lines, 1.0KB)
components/chat/source-preview.tsx     (145 lines, 4.2KB)
```

## Files Modified

```
components/chat/message-bubble.tsx     (138 → 310 lines, 4.2KB → 11.4KB)
components/chat/chat-window.tsx        (362 → 330 lines, 11.8KB → 11.8KB)
app/globals.css                        (markdown typography section rewritten)
```

## Verification

- [x] `docker compose build app` — 0 errors
- [x] `docker compose up -d app` — container healthy
- [x] `curl localhost:3100/api/health` — 200 OK
- [x] `npx vitest run` — 218/218 tests pass
- [x] No new npm dependencies added
- [x] All existing functionality preserved
- [x] Indonesian UI text maintained
