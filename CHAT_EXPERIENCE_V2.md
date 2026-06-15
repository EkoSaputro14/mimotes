# MimoNotes Chat Experience V2 — Design Spec

> **Document Type:** Sprint C Master Design Spec
> **Version:** 2.0.0
> **Status:** Implementation-Ready
> **Last Updated:** 2026-06-14
> **Author:** Design Team

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Scope & Constraints](#2-scope--constraints)
3. [Improvement 1: Empty State](#3-improvement-1-empty-state)
4. [Improvement 2: Citation Experience](#4-improvement-2-citation-experience)
5. [Improvement 3: Answer Layout](#5-improvement-3-answer-layout)
6. [Improvement 4: Feedback System](#6-improvement-4-feedback-system)
7. [Improvement 5: Loading Experience](#7-improvement-5-loading-experience)
8. [Improvement 6: Mobile Experience](#8-improvement-6-mobile-experience)
9. [Improvement 7: Error Recovery](#9-improvement-7-error-recovery)
10. [Component Inventory](#10-component-inventory)
11. [File Manifest](#11-file-manifest)
12. [Dependency Analysis](#12-dependency-analysis)

---

## 1. Design Principles

**Direction:** Linear precision + Claude warmth + Notion clarity

**Brand:** Precise. Warm. Intelligent. Calm. Premium.

**Design Rules:**
- Every element earns its place. No decoration without function.
- Warmth through language, whitespace, and motion — not color or ornament.
- Information hierarchy through typography and spacing, not borders.
- Content-first: messages are the hero, chrome is contextual.
- Source-aware: citations are inline, explorable, and persistent.

**Existing Foundation:**
- **Tokens:** warm-purple 265° scale from `globals.css` (MiMo brand)
- **Font:** Geist Sans (body) + Geist Mono (code)
- **Components:** Button, Card, Input, Tabs, Sheet, Tooltip, Skeleton, EmptyState, Dialog, DropdownMenu, Badge
- **Animation:** framer-motion, tw-animate-css
- **Icons:** lucide-react
- **Markdown:** react-markdown + remark-gfm + rehype-highlight
- **Toasts:** sonner

---

## 2. Scope & Constraints

**What's in scope (frontend only):**
- Empty state redesign
- Citation experience (inline markers + source preview)
- Answer layout improvements (typography, width, markdown)
- Feedback system (thumbs up/down, copy, regenerate)
- Loading experience (streaming skeleton, phase indicators)
- Mobile experience (bottom sheet, safe area, responsive)
- Error recovery (retry, offline, provider unavailable)

**What's out of scope:**
- Backend, APIs, database, auth, RAG, retrieval, embeddings
- New npm dependencies
- New design tokens (use existing from `globals.css`)
- New UI primitives (use existing from `components/ui/`)
- Language changes (messages stay in Indonesian)
- Source panel as right sidebar (desktop) — mobile bottom sheet only in this sprint

---

## 3. Improvement 1: Empty State

### Problem
Current empty state is a 🤖 emoji with static text. It's generic, not actionable, and doesn't guide users toward value.

### Vision
Replace with a clean, warm onboarding screen that immediately shows what MimoNotes can do and helps users take action.

### Component Changes

#### New Component: `EmptyStateChat`
**Purpose:** Complete empty state for the chat view when no messages exist.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              ┌─────────────────────────┐                    │
│              │     [MimoNotes logo]    │                    │
│              │      (grape icon)       │                    │
│              └─────────────────────────┘                    │
│                                                             │
│              "Hai! Ada yang bisa saya bantu?"              │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐ │
│  │ 📄                │  │ 💡                │  │ 🔍        │ │
│  │ "Ringkas dokumen  │  │ "Apa saja tema   │  │ "Cari     │ │
│  │  terbaru saya"    │  │  utama dalam     │  │ semua      │ │
│  │                   │  │  riset saya?"    │  │ dokumen    │ │
│  └──────────────────┘  └──────────────────┘  │ tentang…" │ │
│  ┌──────────────────┐  ┌──────────────────┐  └───────────┘ │
│  │ 📊                │  │ 🧠                │  ┌───────────┐ │
│  │ "Bandingkan catatan│ │ "Jelaskan hubungan│  │ ✍️        │ │
│  │  dari Q2 dan Q3"  │  │  antara..."      │  │ "Bantu saya│ │
│  └──────────────────┘  └──────────────────┘  │  menulis…" │ │
│                                               └───────────┘ │
│  ──────────────── Aksi Cepat ──────────────                │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐       │
│  │  📎 Upload Dokumen   │  │  📚 Lihat Basis      │       │
│  │  Drag & drop atau    │  │  Pengetahuan         │       │
│  │  klik untuk upload   │  │                       │       │
│  └──────────────────────┘  └──────────────────────┘       │
│                                                             │
│  ────────────── Dokumen Terbaru ──────────────             │
│                                                             │
│  📄 Research Paper.pdf      2h yang lalu                   │
│  📝 Meeting Notes.docx      kemarin                        │
│  📊 Q3 Report.xlsx          3 hari yang lalu               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Section 1: Header**
- MimoNotes grape icon: 48px, centered, using `--primary` color
- Greeting text: Geist Medium, 24px, `--foreground`, centered
- Greeting varies by time of day (morning/afternoon/evening)
- Top margin: 64px, bottom margin: 32px

**Section 2: Suggested Prompts (2×3 grid)**
- 6 clickable prompt cards
- Card: 200px min width, `--card` background, `--border` border, 12px radius
- Card padding: 16px
- Card hover: `--muted` background, translateY(-2px), `--shadow-sm`
- Card active: scale(0.98)
- Icon: 24px, top-left, `--primary` color
- Title: Geist Medium, 14px, `--foreground`
- Description: Geist Regular, 12px, `--muted-foreground`
- Gap between cards: 12px
- Click: populates input, sends immediately

**Prompt content (Indonesian):**
| Category | Icon | Prompt |
|----------|------|--------|
| Ringkas | FileText | "Ringkas dokumen terbaru saya" |
| Analisis | Lightbulb | "Apa saja tema utama dalam riset saya?" |
| Cari | Search | "Cari semua dokumen tentang..." |
| Bandingkan | BarChart3 | "Bandingkan catatan dari Q2 dan Q3" |
| Hubungkan | Brain | "Jelaskan hubungan antara..." |
| Tulis | PenTool | "Bantu saya menulis ringkasan tentang topik ini" |

**Section 3: Quick Actions (2 cards)**
- Left: "Upload Dokumen" — dashed border, Upload icon
- Right: "Lihat Basis Pengetahuan" — solid border, BookOpen icon
- Each card: 50% width, 12px radius, 16px padding
- Use existing `Button` component with `variant="outline"`

**Section 4: Recent Documents (if any exist)**
- Fetched from existing API (`/api/documents`)
- Shows last 3 documents
- Each row: file icon, document title, relative time
- Font: Geist Regular, 14px, `--foreground`
- Time: right-aligned, `--muted-foreground`
- Click: navigates to document detail
- Only shown if user has documents; otherwise section is hidden

### Props Interface

```
EmptyStateChatProps:
  onSendPrompt: (prompt: string) => void
  onUploadDocument: () => void
  onViewKnowledgeBase: () => void
  recentDocuments?: Array<{
    id: string
    title: string
    fileType: string
    createdAt: string
  }>
```

### State Management
- `recentDocuments`: fetched once via `useEffect` on mount using existing `/api/documents` endpoint
- No additional state needed; all interaction is delegated to parent via callbacks

### Integration Points
- Replace the inline empty state in `chat-window.tsx` (lines 276-286)
- Import and use existing `Button` from `components/ui/button.tsx`
- Import `FileText`, `Lightbulb`, `Search`, `BarChart3`, `Brain`, `PenTool`, `Upload`, `BookOpen` from `lucide-react`
- Document fetch uses existing `fetch("/api/documents")` pattern

---

## 4. Improvement 2: Citation Experience

### Problem
Currently, sources appear as a horizontal scroll strip below messages. They're only visible for the last message and don't connect to the response text. Users can't tell which part of the answer came from which document.

### Vision
Inline citation markers `[1]`, `[2]`, `[3]` in the AI response, with clickable markers that open source previews. Sources persist per-message, not just the last one.

### Component Changes

#### New Component: `CitationMarker`
**Purpose:** Inline superscript citation number in assistant response text.

**Layout:**
```
[1]   — superscript, 11px
```

**Styling:**
- Font: Geist Medium, 11px
- Color: `--primary`
- Background: transparent → `--primary/10` on hover
- Border-radius: 4px
- Padding: 1px 4px
- Cursor: pointer
- Vertical-align: super

#### New Component: `SourcePreview`
**Purpose:** Expandable source card shown inline below the assistant message (replaces the horizontal source strip).

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Sumber (3)                                [▾]     │
│  ─────────────────────────────────────────────────  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  [1] 📄 Research Paper.pdf                  │   │
│  │      PDF · 94% kecocokan                    │   │
│  │      "Studi ini memeriksa bagaimana neural  │   │
│  │       networks berperforma dalam berbagai…" │   │
│  │      [Lihat Dokumen]                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  [2] 📝 Notes Q3.md                        │   │
│  │      MD · 87% kecocokan                     │   │
│  │      "Di Q3 kita melihat peningkatan yang…" │   │
│  │      [Lihat Dokumen]                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Styling:**
- Background: `--card`
- Border: 1px solid `--border`
- Border-radius: 12px
- Padding: 16px
- Header: Geist Medium, 14px, `--foreground`, "Sumber (N)"
- Collapse toggle: ChevronDown/ChevronUp icon
- Each source card inside: 8px padding, `--muted` background, 8px radius
- Source number badge: `--primary` background, white text, 20px circle
- Document title: Geist Medium, 13px, `--foreground`
- File type + score: Geist Regular, 12px, `--muted-foreground`
- Score text: `--primary` color when > 90%, `--foreground` otherwise
- Content snippet: Geist Regular, 12px, `--muted-foreground`, max 2 lines (line-clamp-2)
- "Lihat Dokumen" link: Geist Medium, 12px, `--primary`, ExternalLink icon

**Expand/Collapse:**
- Default: collapsed (shows header only, count of sources)
- Click header or chevron: expands to show all source cards
- Expand animation: framer-motion `AnimatePresence` with height auto transition
- Persist expanded state per message (not global)

#### Modify: `MessageBubble`
**Changes:**
- Assistant messages now receive `sources` array and render `SourcePreview` below the message content
- The inline citation markers `[1]`, `[2]`, `[3]` are parsed from the markdown content
- Sources are rendered as a collapsible section below the message, NOT in a separate horizontal strip

**Approach for inline citations:**
- The existing markdown renderer (`react-markdown`) already handles the text
- Citation markers like `[1]` will be rendered as `CitationMarker` components
- This is achieved via a custom `react-markdown` component override for text nodes that match the citation pattern
- The pattern: `[N]` where N is a number 1-9, preceded by a space or punctuation

### Props Interface

```
CitationMarkerProps:
  index: number          // citation number (1-based)
  sourceIndex: number    // which source to link to
  isActive?: boolean     // highlight when source preview is open

SourcePreviewProps:
  sources: Source[]
  isExpanded: boolean
  onToggle: () => void
  onSourceClick: (source: Source) => void

Source (existing, unchanged):
  documentId: string
  content: string
  similarity: number
  metadata: Record<string, unknown>
```

### State Management
- `expandedSources`: Map of messageId → boolean (tracks expand/collapse per message)
- Stored in `ChatWindow` component state
- Default: collapsed for all messages except the most recent assistant message (auto-expand)

### Integration Points
- `chat-window.tsx`: Add `expandedSources` state, pass to `MessageBubble`
- `message-bubble.tsx`: Import `CitationMarker` and `SourcePreview`, render inline citations and source section
- Existing `SourceCard` component is replaced by the inline `SourcePreview` section
- The horizontal source strip below the chat (lines 317-328 in `chat-window.tsx`) is removed
- Sources are now part of each message, not a separate global state

---

## 5. Improvement 3: Answer Layout

### Problem
Current message bubbles have a max-width of 80%, markdown rendering is basic, and the reading experience doesn't feel premium.

### Vision
Wider reading area, polished markdown typography, proper code block styling, and smooth scroll to cited sources.

### Component Changes

#### Modify: `MessageBubble` (continued)
**Width changes:**
- Assistant messages: `max-w-[85%]` on desktop, `max-w-[90%]` on mobile (replacing current `max-w-[80%]`)
- User messages: keep current width
- Messages remain centered in the chat area

**Typography improvements (via `globals.css` additions):**

New markdown body styles to add to `globals.css`:

- **Headings:** Proper hierarchy with `--text-h1` through `--text-h4` sizes, `font-weight: 600`, clear margins
- **Code blocks:** Existing styling refined — add line numbers option, copy button, language badge
- **Inline code:** Already styled with Geist Mono, ensure consistent `--muted` background
- **Tables:** Refined border treatment, alternating row backgrounds, horizontal scroll on mobile
- **Lists:** Proper bullet/number styling, nested indentation
- **Blockquotes:** Left border in `--primary` color, italic text, distinct background
- **Links:** `--primary` color, underline on hover
- **Horizontal rules:** Subtle, `--border` color

**Code block enhancements:**
- Add language label badge (top-right corner)
- Add copy button (top-right, appears on hover)
- Background: `--card`
- Border-radius: 8px
- Font: Geist Mono, 13px, line-height 1.6
- Scrollable horizontally for long lines

**Smooth scroll to source:**
- When user clicks a citation marker `[N]`, the page scrolls smoothly to the `SourcePreview` section
- The target source card gets a brief highlight animation (border flash in `--primary` color)
- Scroll uses `element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`

#### Modify: `globals.css`
**Additions to the existing `.markdown-body` styles:**

```css
/* Code block language label */
.markdown-body pre { position: relative; }
.markdown-body pre::after {
  /* Language badge — content set via data attribute */
}

/* Code block copy button container */
.markdown-body pre .copy-button { /* positioned absolute top-right */ }

/* Table mobile scroll */
.markdown-body table { display: block; overflow-x: auto; }

/* Blockquote refinement */
.markdown-body blockquote {
  border-left-color: var(--primary);
  background: var(--muted);
  padding: 12px 16px;
  border-radius: 0 8px 8px 0;
  font-style: italic;
}

/* Citation marker inline */
.citation-marker {
  font-size: 11px;
  font-weight: 500;
  color: var(--primary);
  background: transparent;
  padding: 1px 4px;
  border-radius: 4px;
  cursor: pointer;
  vertical-align: super;
  transition: background var(--duration-fast) var(--ease-default);
}
.citation-marker:hover {
  background: var(--primary/10);
}
.citation-marker.active {
  background: var(--primary/15);
}
```

### Props Interface
No new props. Changes are to existing `MessageBubble` props and CSS.

### State Management
- No additional state
- Scroll-to-source is a one-shot DOM operation triggered by citation click

### Integration Points
- `globals.css`: Add new `.markdown-body` refinements and `.citation-marker` styles
- `message-bubble.tsx`: Update `max-w` classes, add citation marker rendering
- `react-markdown` custom components: Override `a` and text rendering to detect citation patterns

---

## 6. Improvement 4: Feedback System

### Problem
No way to give feedback on AI responses. Copy button is hover-only. No regenerate option.

### Vision
Every assistant message gets visible action buttons: thumbs up/down, copy, and regenerate (on last message only). All feedback is client-side only.

### Component Changes

#### New Component: `MessageActions`
**Purpose:** Row of action buttons below each assistant message.

**Layout:**
```
just now    👍  👎  📋  ↻
```

**Buttons:**
| Action | Icon | Size | Behavior |
|--------|------|------|----------|
| Like | ThumbsUp | 16px | Toggle fill, color `--success` |
| Dislike | ThumbsDown | 16px | Toggle fill, color `--destructive` |
| Copy | Copy | 16px | Always visible, not hover-only |
| Regenerate | RefreshCw | 16px | Only on last assistant message |

**Styling:**
- Container: flex row, gap 8px, aligned left
- Each button: icon-only, 32px hit area (for touch), 16px icon
- Default color: `--muted-foreground`
- Hover: `--foreground`, background `--muted`
- Active (selected): filled icon with accent color
- Border-radius: 6px
- Transition: color 100ms, background 100ms, transform 100ms

**Feedback flow:**
1. User clicks thumbs up → icon fills green, toast: "Terima kasih atas umpan balik Anda!" (sonner)
2. User clicks thumbs down → icon fills red, toast: "Terima kasih atas umpan balik Anda!"
3. Click same icon again → deselect (toggle off)
4. Click opposite icon → switch selection
5. All feedback stored in component state only (no API call)
6. Copy button → clipboard write, icon changes to Check for 2s, toast: "Pesan tersalin!"
7. Regenerate → calls parent `onRegenerate` callback, re-sends last user message

#### Modify: `MessageBubble`
**Changes:**
- For assistant messages, render `MessageActions` below the timestamp
- Accept `isLast` prop to control regenerate visibility
- Accept `onRegenerate` callback
- Accept `feedback` state (for persisting like/dislike selection)

### Props Interface

```
MessageActionsProps:
  messageId: string
  content: string                    // for copy
  isLast: boolean                    // show regenerate only on last
  onRegenerate?: () => void
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void
  feedback?: 'positive' | 'negative' | null  // current selection

MessageBubbleProps (updated):
  // ... existing props plus:
  isLast?: boolean
  onRegenerate?: () => void
  onFeedback?: (messageId: string, type: 'positive' | 'negative') => void
  feedback?: 'positive' | 'negative' | null
```

### State Management
- `feedbackState`: `Record<string, 'positive' | 'negative' | null>` — maps message ID to feedback
- Stored in `ChatWindow` component state
- Persisted only for the current session (resets on page reload — client-side only)

### Integration Points
- `chat-window.tsx`: Add `feedbackState`, pass to `MessageBubble`, handle `onFeedback` and `onRegenerate`
- `message-bubble.tsx`: Render `MessageActions` for assistant messages
- `lucide-react`: Import `ThumbsUp`, `ThumbsDown`, `Copy`, `Check`, `RefreshCw`
- `sonner`: Use `toast.success()` for feedback confirmation
- Existing copy functionality in `message-bubble.tsx` is moved into `MessageActions`

---

## 7. Improvement 5: Loading Experience

### Problem
Loading state is three bouncing dots — generic and uninformative. Users don't know what the system is doing (searching? generating?).

### Vision
Show meaningful phase indicators: "Mencari dokumen..." during RAG retrieval, "Menyiapkan respons..." during generation, with a streaming skeleton and typing cursor.

### Component Changes

#### New Component: `LoadingIndicator`
**Purpose:** Shows the current processing phase with appropriate visual feedback.

**Phases:**
1. **RAG Retrieval:** "Mencari dokumen yang relevan..." with pulsing search icon
2. **Generation:** "Menyiapkan respons..." with streaming skeleton
3. **Streaming:** Typing cursor animation in the response bubble

**Layout (Phase 1 — Retrieval):**
```
┌──────────────────────────────────────────────────┐
│  AI  ┌────────────────────────────────────────┐  │
│      │  🔍 Mencari dokumen yang relevan...     │  │
│      └────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**Layout (Phase 2 — Generation/Streaming):**
```
┌──────────────────────────────────────────────────┐
│  AI  ┌────────────────────────────────────────┐  │
│      │  ████░░░░░░░░░░░░░░░░░░░░              │  │
│      │  ████████████░░░░░░░░░░░░░░            │  │
│      │  ██████████████████░░░░░░░░            │  │
│      │  ▌                                      │  │
│      └────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

**Styling:**
- Container: same as assistant message bubble (`--muted` background, `rounded-2xl rounded-tl-sm`)
- Phase text: Geist Regular, 14px, `--muted-foreground`
- Search icon: 16px, `--primary`, pulsing opacity animation
- Skeleton bars: `--border` background, shimmer animation (existing `globals.css` pattern)
- Typing cursor: `▌` character, `--primary` color, blinking at 530ms interval

**Typing cursor animation:**
```css
@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.typing-cursor {
  animation: cursorBlink 1.06s step-end infinite;
  color: var(--primary);
}
```

#### Modify: `ChatWindow`
**Changes:**
- Replace the bouncing dots loading indicator (lines 292-311) with `LoadingIndicator`
- Add `loadingPhase` state: `'idle' | 'retrieving' | 'generating' | 'streaming'`
- Phase transitions:
  1. User sends message → `loadingPhase = 'retrieving'`
  2. Response stream starts receiving data → `loadingPhase = 'streaming'`
  3. Stream ends → `loadingPhase = 'idle'`

#### Modify: `MessageBubble`
**Changes:**
- When message content is empty and the message is the current streaming message, show `LoadingIndicator` phase 2 (skeleton)
- When streaming starts and content begins appearing, show the typing cursor at the end of content
- Typing cursor disappears after streaming completes

### Props Interface

```
LoadingIndicatorProps:
  phase: 'retrieving' | 'generating' | 'streaming'
  message?: string   // optional override text
```

### State Management
- `loadingPhase`: new state in `ChatWindow`, set during the streaming lifecycle
- Transitions are driven by the existing fetch/stream logic — no new API calls needed

### Integration Points
- `chat-window.tsx`: Replace bouncing dots with `LoadingIndicator`, add `loadingPhase` state
- `message-bubble.tsx`: Add typing cursor rendering during streaming
- `globals.css`: Add `.typing-cursor` animation
- Existing `skeleton.tsx` can be used for the shimmer bars, or custom implementation with existing CSS

---

## 8. Improvement 6: Mobile Experience

### Problem
Current mobile layout works but feels desktop-shrunk. Input area lacks safe area padding. Sources are horizontally scrollable (hard on touch). No pull-to-refresh.

### Vision
Mobile-first refinements: bottom input with safe area, source bottom sheet, touch-friendly actions, and responsive widths.

### Component Changes

#### Modify: `ChatWindow` (mobile layout)

**Input area safe area padding:**
- Add `pb-[env(safe-area-inset-bottom)]` to the input container
- This ensures the input isn't hidden behind the home indicator on iOS

**Responsive message width:**
- Assistant messages: `max-w-[90%]` on mobile (`< 768px`), `max-w-[85%]` on desktop
- Achieved via Tailwind responsive classes: `max-w-[90%] md:max-w-[85%]`

**Source bottom sheet (mobile):**
- On mobile, when user taps a citation marker, sources open as a bottom sheet instead of inline expansion
- Use existing `Sheet` component with `side="bottom"`
- Sheet height: 50vh max
- Drag handle: 40px × 4px, `--border`, centered
- Content: list of source cards (same as `SourcePreview` but in sheet format)

#### New Component: `MessageContextMenu`
**Purpose:** Long-press context menu on messages for touch devices.

**Trigger:** Long press (500ms) on any message bubble

**Menu items:**
- Salin teks (Copy text)
- Salin kutipan (Copy as quote)
- Lihat sumber (View sources) — assistant messages only

**Styling:**
- Use existing `DropdownMenu` component
- Position: above the long-press point
- Backdrop: subtle overlay
- Menu items: Geist Regular, 14px, with lucide icons
- Haptic feedback: `navigator.vibrate(10)` on open (if available)

#### Modify: `SessionSidebar`
**Changes:**
- On mobile, the sidebar already slides in from the left
- Add pull-to-refresh behavior: when at top of session list, pull down to refetch sessions
- Implementation: `touchstart`/`touchmove`/`touchend` handlers on the scroll container
- Visual: circular spinner appears at top during refresh
- Uses existing `fetchSessions` function

**Pull-to-refresh specifications:**
- Trigger threshold: 80px pull distance
- Visual: `Loader2` icon from lucide-react, spinning
- Color: `--muted-foreground`
- On release: if pulled > 80px, trigger refresh; otherwise spring back
- Animation: framer-motion spring physics

### Props Interface

```
MessageContextMenuProps:
  message: Message
  onCopy: () => void
  onCopyAsQuote: () => void
  onViewSources?: () => void  // only for assistant messages
```

### State Management
- `isRefreshing`: boolean in `SessionSidebar` for pull-to-refresh visual state
- `contextMenuMessage`: `Message | null` in `ChatWindow` for long-press menu
- `mobileSourcesOpen`: boolean in `ChatWindow` for mobile source bottom sheet

### Integration Points
- `chat-window.tsx`: Add safe area padding, responsive widths, mobile source sheet, context menu state
- `session-sidebar.tsx`: Add pull-to-refresh touch handlers
- `message-bubble.tsx`: Add `onContextMenu` / long-press handler, render `MessageContextMenu`
- `components/ui/sheet.tsx`: Use existing Sheet for mobile source bottom sheet
- `components/ui/dropdown-menu.tsx`: Use existing DropdownMenu for context menu
- `lucide-react`: Import `Loader2` for pull-to-refresh spinner

---

## 9. Improvement 7: Error Recovery

### Problem
When errors occur, the user sees a toast and an error message in the chat. There's no retry mechanism, no offline detection, and no clear messaging about provider issues.

### Vision
Graceful error recovery: retry buttons on errors, offline detection banner, provider unavailable messaging, and automatic retry with exponential backoff.

### Component Changes

#### New Component: `ErrorBanner`
**Purpose:** Persistent banner shown when the system is offline or the AI provider is unavailable.

**Offline state:**
```
┌─────────────────────────────────────────────────────┐
│  ⚠️ Anda sedang offline. Periksa koneksi internet. │
└─────────────────────────────────────────────────────┘
```

**Provider unavailable state:**
```
┌─────────────────────────────────────────────────────┐
│  ⚠️ Layanan AI sedang tidak tersedia.              │
│  Coba lagi dalam beberapa saat.           [Coba lagi]│
└─────────────────────────────────────────────────────┘
```

**Styling:**
- Background: `--warning` at 10% opacity (light mode) / `--warning` at 15% opacity (dark mode)
- Border-bottom: 1px solid `--warning` at 30% opacity
- Text: Geist Regular, 13px, `--foreground`
- Icon: `AlertTriangle` from lucide-react, 16px, `--warning` color
- Retry button: existing `Button` with `variant="ghost"`, `size="sm"`
- Position: sticky below the chat header, above the message area
- Animation: slide down on appear, slide up on disappear (framer-motion)

#### Modify: `MessageBubble` (error state)
**Changes:**
- When the assistant message contains an error (currently hardcoded "Maaf, terjadi kesalahan..."), render with error styling
- Add a retry button inline with the error message

**Error message layout:**
```
┌─────────────────────────────────────────────────┐
│  ⚠️ Maaf, terjadi kesalahan saat memproses     │
│     permintaan Anda.                             │
│                                                  │
│  [🔄 Coba lagi]                                  │
└─────────────────────────────────────────────────┘
```

**Error styling:**
- Background: `--destructive/5` (very subtle red tint)
- Border: 1px solid `--destructive/20`
- Text: `--foreground` (normal)
- Retry button: `--destructive` text, ghost variant
- Icon: `AlertCircle` from lucide-react

#### Modify: `ChatWindow`
**Changes:**
- Add `isOnline` state, listening to `navigator.onLine` / `window online/offline` events
- Add `providerStatus` state: `'available' | 'unavailable' | 'checking'`
- Show `ErrorBanner` when offline or provider unavailable
- Implement retry mechanism with exponential backoff:
  - On error, store the failed message in `pendingRetry` state
  - Show retry button on the error message
  - On retry click, re-send the last user message
  - Max 3 retries with 1s, 2s, 4s delays
- Auto-retry: if the error is a network error (not 4xx), attempt auto-retry once after 2s

**Offline detection:**
- `useEffect` listening to `window.addEventListener('online')` and `window.addEventListener('offline')`
- When coming back online: auto-dismiss `ErrorBanner`, show toast "Koneksi restored"
- When going offline: show `ErrorBanner`, disable input

### Props Interface

```
ErrorBannerProps:
  type: 'offline' | 'provider-unavailable'
  onRetry?: () => void
  isRetrying?: boolean

ErrorRetryProps (inline in MessageBubble):
  messageId: string
  onRetry: () => void
  retryCount: number
  maxRetries: number
```

### State Management
- `isOnline`: boolean, from `navigator.onLine` + event listeners
- `providerStatus`: `'available' | 'unavailable' | 'checking'`
- `retryCount`: `Record<string, number>` — tracks retry attempts per message
- `pendingRetry`: `string | null` — message ID pending retry
- All state in `ChatWindow`

### Integration Points
- `chat-window.tsx`: Add online/offline listeners, retry logic, `ErrorBanner` rendering
- `message-bubble.tsx`: Detect error messages, render retry button
- `lucide-react`: Import `AlertTriangle`, `AlertCircle`, `RefreshCw`
- `sonner`: Toast for offline/online transitions
- No API changes needed — retry re-uses existing `/api/chat` POST

---

## 10. Component Inventory

### New Components (6)

| Component | File | Purpose |
|-----------|------|---------|
| `EmptyStateChat` | `components/chat/empty-state-chat.tsx` | Onboarding empty state with prompts, quick actions, recent docs |
| `CitationMarker` | `components/chat/citation-marker.tsx` | Inline superscript citation `[1]` in assistant text |
| `SourcePreview` | `components/chat/source-preview.tsx` | Collapsible source section below each assistant message |
| `MessageActions` | `components/chat/message-actions.tsx` | Feedback + copy + regenerate buttons row |
| `LoadingIndicator` | `components/chat/loading-indicator.tsx` | Phase-aware loading: retrieving → generating → streaming |
| `ErrorBanner` | `components/chat/error-banner.tsx` | Offline/provider unavailable persistent banner |
| `MessageContextMenu` | `components/chat/message-context-menu.tsx` | Long-press context menu for mobile |

### Modified Components (4)

| Component | File | Changes |
|-----------|------|---------|
| `ChatWindow` | `components/chat/chat-window.tsx` | Empty state, loading phases, feedback state, error recovery, mobile source sheet, responsive widths |
| `MessageBubble` | `components/chat/message-bubble.tsx` | Inline citations, source preview, message actions, error styling, responsive width, long-press |
| `SessionSidebar` | `components/chat/session-sidebar.tsx` | Pull-to-refresh on mobile |
| `SourceCard` | `components/chat/source-card.tsx` | Minor: integrate with SourcePreview, keep for desktop source panel |

### Modified Styles (1)

| File | Changes |
|------|---------|
| `app/globals.css` | Markdown typography refinements, citation marker styles, typing cursor animation, skeleton shimmer, error message styles |

---

## 11. File Manifest

### Files to Create (7)

```
components/chat/empty-state-chat.tsx
components/chat/citation-marker.tsx
components/chat/source-preview.tsx
components/chat/message-actions.tsx
components/chat/loading-indicator.tsx
components/chat/error-banner.tsx
components/chat/message-context-menu.tsx
```

### Files to Modify (5)

```
components/chat/chat-window.tsx          # Major: state management, layout, loading, error
components/chat/message-bubble.tsx       # Major: citations, actions, responsive, context menu
components/chat/session-sidebar.tsx      # Minor: pull-to-refresh
components/chat/source-card.tsx          # Minor: styling alignment with SourcePreview
app/globals.css                          # Minor: new CSS rules for markdown, citations, animations
```

### Files Unchanged (reference only)

```
app/chat/page.tsx                        # No changes needed
components/ui/*.tsx                       # All existing UI primitives unchanged
lib/                                     # No changes
app/api/                                 # No changes
```

---

## 12. Dependency Analysis

### Existing Dependencies Used

| Package | Usage in This Spec |
|---------|--------------------|
| `lucide-react` | All new icons: ThumbsUp, ThumbsDown, Copy, Check, RefreshCw, AlertTriangle, AlertCircle, FileText, Lightbulb, Search, BarChart3, Brain, PenTool, Upload, BookOpen, Loader2, ChevronDown, ChevronUp, ExternalLink |
| `react-markdown` | Citation marker rendering via custom component overrides |
| `sonner` | Toast notifications for feedback, copy, errors, offline |
| `framer-motion` | AnimatePresence for source expand/collapse, error banner slide, message appear |
| `@base-ui/react` | Sheet for mobile source bottom sheet, Tooltip for citation hover |
| `class-variance-authority` | Button variants for action buttons |
| `tailwind-merge` | cn() utility for conditional classes |
| `tw-animate-css` | Existing animation utilities |

### New Dependencies
**None.** All functionality uses existing packages.

### Tailwind Classes Added
- `max-w-[85%]`, `max-w-[90%]` — responsive message widths
- `pb-[env(safe-area-inset-bottom)]` — iOS safe area
- `line-clamp-2` — source content truncation (already in globals.css as `.line-clamp-3`)

### CSS Animations Added
- `.typing-cursor` — blinking cursor for streaming
- `.citation-marker` — inline citation hover states
- `.error-message` — error bubble styling
- `.skeleton-shimmer` — loading skeleton (refinement of existing bounce animation)

---

> **End of Chat Experience V2 Design Spec**
>
> This document specifies 7 frontend improvements to the MimoNotes chat interface.
> Each improvement includes component changes, props interfaces, state management,
> and integration points. The component inventory and file manifest provide a clear
> implementation roadmap.
>
> All changes use existing design tokens, UI components, and npm packages.
> No backend, API, or infrastructure changes are required.
