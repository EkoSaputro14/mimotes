# MimoNotes Chat V2 — Component Specifications

**Version:** 1.0.0  
**Last Updated:** 2026-06-14  
**Design System:** warm-purple 265° · Geist Sans + Mono  
**Design Philosophy:** Linear precision · Claude warmth · Notion clarity  
**Language:** Bahasa Indonesia

---

## Table of Contents

- [Design Tokens Reference](#design-tokens-reference)
- [New Components](#new-components)
  - [EmptyStateChat](#emptystatechat)
  - [CitationMarker](#citationmarker)
  - [SourcePreview](#sourcepreview)
  - [FeedbackBar](#feedbackbar)
  - [LoadingIndicator](#loadingindicator)
  - [SourceBottomSheet](#sourcebottomsheet)
  - [ErrorBanner](#errorbanner)
- [Modified Components](#modified-components)
  - [MessageBubble](#messagebubble)
  - [ChatWindow](#chatwindow)
  - [SourceCard](#sourcecard)
  - [SessionSidebar](#sessionsidebar)

---

## Design Tokens Reference

```typescript
// Brand Colors (warm-purple 265°)
const brand = {
  primary:     '#8B5CF6',    // warm-purple-500
  primaryHover:'#7C3AED',    // warm-purple-600
  primaryLight:'#EDE9FE',    // warm-purple-50
  primaryDark: '#5B21B6',    // warm-purple-800
  surface:     '#FFFFFF',    // white
  surfaceAlt:  '#F9FAFB',    // gray-50
  border:      '#E5E7EB',    // gray-200
  textPrimary: '#111827',    // gray-900
  textSecondary:'#6B7280',   // gray-500
  success:     '#10B981',    // emerald-500
  warning:     '#F59E0B',    // amber-500
  error:       '#EF4444',    // red-500
  errorLight:  '#FEF2F2',    // red-50
} as const;

// Typography (Geist)
const typography = {
  sans:  'Geist Sans, system-ui, sans-serif',
  mono:  'Geist Mono, monospace',
  h1:    'text-2xl font-semibold tracking-tight',
  h2:    'text-lg font-semibold tracking-tight',
  body:  'text-sm font-normal leading-relaxed',
  small: 'text-xs font-normal leading-normal',
  mono:  'text-sm font-mono',
} as const;

// Spacing scale (4px base)
const spacing = {
  xs: '4px',   // 1
  sm: '8px',   // 2
  md: '12px',  // 3
  lg: '16px',  // 4
  xl: '24px',  // 6
  '2xl': '32px', // 8
  '3xl': '48px', // 12
} as const;

// Radius
const radius = {
  sm:  '6px',
  md:  '8px',
  lg:  '12px',
  xl:  '16px',
  full: '9999px',
} as const;

// Shadows
const shadows = {
  sm:  '0 1px 2px rgba(0,0,0,0.05)',
  md:  '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)',
  lg:  '0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04)',
  xl:  '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
} as const;

// Transitions
const transitions = {
  fast:    '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal:  '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  smooth:  '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring:  '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;
```

---

## New Components

---

## EmptyStateChat

**Purpose:** Welcoming empty state displayed when a chat session has no messages. Provides suggested prompts, recent documents, and quick actions to help users get started.

**Path:** `components/chat/empty-state-chat.tsx`

**Type:** new

### Props Interface

```typescript
interface SuggestedPrompt {
  id: string;
  label: string;           // Indonesian text, max 60 chars
  icon: ReactNode;         // lucide-react icon component
  category?: 'question' | 'summarize' | 'analyze';
}

interface RecentDocument {
  id: string;
  title: string;           // Indonesian text, max 40 chars
  fileType: 'pdf' | 'docx' | 'txt' | 'md' | 'csv';
  lastOpened: Date;
  thumbnail?: string;      // URL to document preview
}

interface EmptyStateChatProps {
  suggestedPrompts: SuggestedPrompt[];      // 2x3 grid (6 prompts max)
  recentDocuments?: RecentDocument[];       // Up to 4 recent docs
  onPromptClick: (prompt: SuggestedPrompt) => void;
  onActionClick: (action: 'upload' | 'paste' | 'url') => void;
  isLoading?: boolean;
  userName?: string;                         // For personalized greeting
}
```

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `loading` | Skeleton placeholders: centered logo skeleton, 6 prompt grid skeletons, action button skeletons | All interactive elements disabled, skeleton pulse animation via Skeleton component |
| `withDocuments` | Logo + greeting + prompt grid + recent documents section + quick actions | Full interactivity. Documents section visible below prompt grid |
| `withoutDocuments` | Logo + greeting + prompt grid + quick actions (no documents section) | Full interactivity. Compact layout without documents section |

### Visual Spec

- **Layout:** Centered vertically and horizontally. Max-width `560px`. Flex-col with `gap-8`.
- **Logo:** MimoNotes logo, 64×64px. Uses brand-purple gradient. `animate-fade-in`.
- **Greeting:** `text-2xl font-semibold text-textPrimary`. Personalized when `userName` provided: `"Hai, {userName}! 👋"`, generic: `"Mulai percakapan baru 👋"`. Subtitle: `text-sm text-textSecondary`: `"Tanyakan apa saja tentang dokumen Anda."`
- **Prompt Grid:** CSS Grid, 2 columns × 3 rows on mobile. 3 columns × 2 rows on `sm:` (640px+). Gap `spacing.md` (12px). Each prompt card: Card component, `bg-surfaceAlt`, `border-border`, `radius-lg`. Hover: `shadow-md`, border transitions to `primary/20`, `scale-[1.01]`.
- **Prompt Card Content:** Icon (20px, `text-primary`), Label (`text-sm font-medium text-textPrimary`, truncate to 2 lines). Padding `spacing.lg` (16px).
- **Quick Actions Row:** Flex row, gap `spacing.sm`. 3 Button components (variant: `outline`): Upload (`Upload` icon), Paste (`ClipboardPaste` icon), URL (`Link` icon). On mobile: stack vertically.
- **Recent Documents Section:** Section label `"Dokumen Terakhir"` in `text-xs font-medium text-textSecondary uppercase tracking-wider`. Horizontal row of max 4 compact cards. Each: 80×80px thumbnail + truncated title + relative time ("2 jam lalu"). Uses Card component.
- **Entrance Animation:** `framer-motion`: Container fades in + slides up 12px over 400ms. Stagger children by 60ms. Prompt cards use `layout` prop.

### Interactions

- **Prompt Click:** `onPromptClick` fires. Card shows press state (`scale-[0.98]`, 100ms). Content auto-submitted to chat input and sent.
- **Action Click:** `onActionClick` fires with action type. Button shows loading spinner during upload/paste/URL handling.
- **Document Click:** Navigates to document view or opens document in current session.
- **Keyboard:** All prompts and actions reachable via Tab. Enter/Space activates. Focus ring: `ring-2 ring-primary/40 ring-offset-2`.

### Accessibility

- Container: `role="main"` with `aria-label="Mulai percakapan baru"`.
- Logo: `alt="MimoNotes"` (decorative if greeting present: `aria-hidden="true"`).
- Greeting: `<h1>` element for screen reader heading.
- Prompt Grid: `role="list"`, each prompt `role="listitem"`.
- Prompt buttons: `aria-label="Mulai dengan: {label}"`.
- Quick actions: `aria-label` with descriptive text (e.g., `"Upload dokumen"`).
- Recent documents: `role="list"`, each document: `aria-label="{title}, dibuka {relativeTime}"`.
- Focus management: First focusable element (first prompt) receives focus on mount.
- Reduced motion: Disable stagger animations when `prefers-reduced-motion: reduce`.

---

## CitationMarker

**Purpose:** Inline superscript citation reference `[1]` `[2]` within assistant message text, linking to source documents. Provides visual anchor for source attribution.

**Path:** `components/chat/citation-marker.tsx`

**Type:** new

### Props Interface

```typescript
interface CitationMarkerProps {
  index: number;           // 1-based display index
  sourceId: string;        // Reference to Source object
  onClick: (sourceId: string) => void;
  isActive?: boolean;      // True when corresponding source preview is open
  variant?: 'inline' | 'block';  // inline in text vs. standalone
}
```

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `default` | Superscript `[1]` in `text-primary` (800), font-size `text-[10px]`, bg `primaryLight` with `radius-full`, `px-1 py-px` | Clickable, pointer cursor |
| `hovered` | Same as default but bg intensifies to `primary/15`, `scale-[1.08]`, `shadow-sm` | Pointer cursor, `onClick` fires on click |
| `active` | bg `primary` solid, `text-white`, `scale-[1.05]` | Corresponds to expanded SourcePreview. Persistent until another citation clicked |

### Visual Spec

- **Element:** `<span>` rendered inline within markdown text.
- **Size:** `text-[10px]` font-size, `leading-none`, `align-super`. Positioned with `relative -top-0.5`.
- **Padding:** `px-[5px] py-[1px]` for touch target (min 24px hit area via padding extension).
- **Color:** Default: `bg-primary-50 text-primary-800`. Active: `bg-primary text-white`.
- **Border Radius:** `radius-full` (pill shape).
- **Font:** `font-mono font-semibold` (Geist Mono bold for numeral clarity).
- **Transition:** `transition-all duration-fast` for bg and scale changes.
- **Margin:** `mx-[1px]` for tight grouping with adjacent text and other markers.

### Interactions

- **Click:** Fires `onClick(sourceId)`. Toggles corresponding SourcePreview. If already active, deactivates.
- **Hover:** Background intensifies. Cursor: pointer. `transition-fast` on background.
- **Keyboard:** Focusable via Tab (within tab order of message). Enter/Space triggers click.
- **Adjacent Markers:** When `[1][2]` are adjacent, maintain `1px` gap. On hover, each marker independently scales.

### Accessibility

- `role="button"` (interactive superscript).
- `aria-label="Sumber {index}: {sourceName}"` — source name passed via context or data attribute.
- `aria-pressed={isActive}` — communicates toggle state.
- Focus: `focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1`.
- Screen reader: Announces "Sumber 1: [Document Title], tombol" on focus.
- Color contrast: `primary-800` on `primary-50` = 7.2:1 ratio (WCAG AAA).

---

## SourcePreview

**Purpose:** Expandable citation detail card showing a source document's metadata, content snippet, and similarity score. Appears inline below assistant messages or in the source panel.

**Path:** `components/chat/source-preview.tsx`

**Type:** new

### Props Interface

```typescript
interface Source {
  id: string;
  documentId: string;
  title: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'md' | 'csv';
  similarity: number;       // 0-100, percentage match
  contentSnippet: string;   // Max 300 chars, highlighted
  pageNumber?: number;
  sectionTitle?: string;
  lastModified: Date;
}

interface SourcePreviewProps {
  source: Source;
  index: number;
  isExpanded: boolean;
  onToggle: (sourceId: string) => void;
  onDocumentClick: (documentId: string) => void;
  compact?: boolean;        // Used in SourceBottomSheet
}
```

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `collapsed` | Single-line row: `[index] [file badge] title [similarity%] chevron-down` | Clickable, expands on click |
| `expanded` | Collapsed header + expanded content: snippet, section, page, document link | Content slides down with framer-motion. Chevron rotates 180° |
| `loading` | Collapsed header with Skeleton placeholder for content area | Content loading (rare: when snippet fetched async) |

### Visual Spec

- **Container:** Card component. `bg-surface`, `border-border`, `radius-lg`.
- **Collapsed Row:** `flex items-center gap-3`, `px-4 py-3`.
  - Index badge: `text-[10px] font-mono font-bold bg-primaryLight text-primary-800 px-1.5 py-0.5 radius-full`.
  - File type badge: Uses existing Badge component. Color mapping: `pdf→red-50`, `docx→blue-50`, `txt→gray-100`, `md→purple-50`, `csv→green-50`. Icon: 14px lucide icon (FileText, File, etc.).
  - Title: `text-sm font-medium text-textPrimary`, truncate with ellipsis.
  - Similarity: `text-xs font-mono text-primary`. Format: `"92%"`. When ≥90%: `text-success`. 70-89%: `text-primary`. <70%: `text-warning`.
  - Chevron: `ChevronDown` icon, 16px, `text-textSecondary`. Rotates on expand.
- **Expanded Content:** `border-t border-border`, `px-4 py-3`.
  - Snippet: `text-xs text-textSecondary leading-relaxed bg-surfaceAlt p-3 radius-md`. Highlighted terms: `<mark className="bg-primary/10 text-primary-800">`.
  - Section/Page: `text-xs text-textSecondary`, icon `Hash`/`FileText`. Format: `"Bagian {sectionTitle} · Halaman {page}"`.
  - Document link: Button variant ghost, `text-xs text-primary`, icon `ExternalLink`. Text: `"Buka dokumen →"`.
- **Compact Mode:** Collapsed only, no expand. Used in SourceBottomSheet.
- **Animation:** framer-motion `AnimatePresence`. Expand: height auto, `opacity: 0→1`, 200ms. Chevron rotation: `rotate: 0→180deg`, 200ms.

### Interactions

- **Toggle Click:** Entire collapsed row is clickable. `onToggle(sourceId)`. Smooth expand/collapse.
- **Document Link Click:** `onDocumentClick(documentId)`. Opens document in new tab or document viewer.
- **Hover (collapsed):** `bg-surfaceAlt` transition. Pointer cursor.
- **Hover (document link):** Underline appears. `text-primaryHover`.
- **Keyboard:** Tab to focus row. Enter/Space toggles. Inside expanded: Tab cycles through snippet (readonly), section info, document link.

### Accessibility

- Container: `role="article"` with `aria-label="Sumber {index}: {title}"`.
- Toggle: `aria-expanded={isExpanded}` on the row element.
- Row: `role="button"`, `tabIndex={0}`.
- Content region: `aria-live="polite"` (announces expansion to screen readers).
- Similarity: `aria-label="Tingkat kemiripan: {percent} persen"`.
- File badge: `aria-label="Tipe file: {fileType}"`.
- Document link: `aria-label="Buka dokumen {title} di tab baru"`.
- Focus visible: `focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:rounded-lg`.

---

## FeedbackBar

**Purpose:** Action bar below assistant messages providing thumbs up/down feedback, copy, and regenerate. Appears contextually and communicates feedback state.

**Path:** `components/chat/feedback-bar.tsx`

**Type:** new

### Props Interface

```typescript
interface FeedbackBarProps {
  onThumbsUp: () => void;
  onThumbsDown: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  isLastMessage: boolean;
  isStreaming: boolean;
  feedbackState?: 'none' | 'thumbs-up' | 'thumbs-down';
  messageContent: string;     // For copy functionality
  showRegenerate?: boolean;   // Defaults to true for last assistant message
}
```

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `default` | Subtle row of 4 icon buttons: 👍 👎 \| 📋 ↻ | All buttons enabled, opacity 0.6 → 1 on hover |
| `feedbackGiven` | Selected button filled (primary color), other buttons remain. Toast confirmation | Feedback button persistent, undo option available via tooltip |
| `streaming` | All buttons disabled, opacity 0.3, cursor not-allowed | No interaction possible during streaming |

### Visual Spec

- **Container:** `flex items-center gap-1`, `mt-2`. Appears below message content within MessageBubble.
- **Visibility:** Always visible on desktop. On mobile: visible by default (no hover-reveal).
- **Buttons:** 4 IconButton-style buttons. Size: 28×28px. `radius-md`.
  - ThumbsUp: `ThumbsUp` icon (14px). Default: `text-textSecondary`. Active: `text-primary bg-primaryLight`.
  - ThumbsDown: `ThumbsDown` icon (14px). Default: `text-textSecondary`. Active: `text-error bg-errorLight`.
  - Separator: `w-px h-4 bg-border mx-1` vertical divider between feedback and utility buttons.
  - Copy: `Copy` icon (14px). `text-textSecondary`. On success: switches to `Check` icon + `text-success` for 2s, then reverts.
  - Regenerate: `RefreshCw` icon (14px). `text-textSecondary`. Hidden when `!showRegenerate && !isLastMessage`.
- **Hover:** Button bg transitions to `bg-surfaceAlt`, `shadow-sm`, icon color intensifies. `transition-fast`.
- **Active/Pressed:** `scale-[0.92]` micro-interaction.
- **Feedback Tooltip:** After giving feedback, Tooltip shows: `"Terima kasih! (klik untuk batal)"` on thumbs button.
- **Copy Success:** Button briefly shows `Check` icon with `text-success`, toast via sonner: `"Disalin ke clipboard"`.
- **Animation:** Entrance: `opacity: 0→1, y: 4→0`, 200ms (framer-motion). Exit: reverse.

### Interactions

- **Thumbs Up/Down:** `onThumbsUp`/`onThumbsDown` fires. Toggle behavior: clicking same button again undoes. Switching: removes old, applies new.
- **Copy:** `onCopy` fires. Uses `navigator.clipboard.writeText(messageContent)`. Success: icon swap + toast. Failure: toast with error message.
- **Regenerate:** `onRegenerate` fires. Shows confirmation tooltip first if message has content. During regeneration: button shows spinner.
- **Keyboard:** Tab order: ThumbsUp → ThumbsDown → Copy → Regenerate. Enter/Space activates. Arrow keys navigate between buttons within the bar.
- **Touch:** Each button has 44×44px touch target (via padding) despite 28px visual size.

### Accessibility

- Container: `role="toolbar"` with `aria-label="Aksi pesan"`.
- Grouping: `role="group"` with `aria-label="Penilaian"` for thumbs up/down pair.
- Each button: `aria-label` descriptive text:
  - ThumbsUp: `"Bermanfaat"` / `"Bermanfaat (dipilih, klik untuk batal)"`
  - ThumbsDown: `"Tidak membantu"` / `"Tidak membantu (dipilih, klik untuk batal)"`
  - Copy: `"Salin pesan"` / `"Tersalin!"`
  - Regenerate: `"Buat ulang respons"`
- Disabled state: `aria-disabled="true"`, `tabindex="-1"` during streaming.
- Focus: `focus-visible:ring-2 focus-visible:ring-primary/40`.
- Live region: `aria-live="polite"` on container for state change announcements.

---

## LoadingIndicator

**Purpose:** Three-phase loading state indicator showing the current stage of AI processing: searching documents, generating response, and streaming text.

**Path:** `components/chat/loading-indicator.tsx`

**Type:** new

### Props Interface

```typescript
type LoadingPhase = 'searching' | 'generating' | 'streaming';

interface LoadingIndicatorProps {
  phase: LoadingPhase;
  searchProgress?: number;     // 0-100, for searching phase
  estimatedTime?: number;      // seconds remaining (optional)
  onCancel?: () => void;       // Allow cancellation during searching/generating
  sourcesFound?: number;       // Number of sources found during searching
}
```

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `searching` | Pulsing search icon + "Mencari dokumen..." + progress indicator | Cancel button visible. Progress bar fills if `searchProgress` provided |
| `generating` | Sparkle icon + "Menyiapkan jawaban..." + subtle pulse | Cancel button visible. Pulsing animation |
| `streaming` | Typing indicator (3 bouncing dots) + "Menulis..." | No cancel (streaming is active). Dots animate in sequence |

### Visual Spec

- **Container:** `flex items-center gap-3`, `px-4 py-3`. Placed as last message in chat flow (assistant position). `bg-surfaceAlt`, `radius-lg`, `border border-border`.
- **Icon Area:** 32×32px circle container.
  - Searching: `Search` icon (16px), `text-primary`, pulse animation (`scale: 1→1.1→1`, 1.5s loop).
  - Generating: `Sparkles` icon (16px), `text-primary`, rotate animation (`rotate: 0→360°`, 2s loop).
  - Streaming: Three dots (`w-1.5 h-1.5 bg-primary radius-full`), stagger bounce animation (each dot delays 150ms, `translateY: 0→-4→0`, 0.6s loop).
- **Text Label:** `text-sm text-textSecondary font-medium`. Indonesian labels:
  - Searching: `"Mencari dokumen..."` or `"Mencari dokumen... ({sourcesFound} ditemukan)"`
  - Generating: `"Menyiapkan jawaban..."`
  - Streaming: `"Menulis..."`
- **Progress Bar (searching):** Below text, `h-1 bg-primary/10 radius-full overflow-hidden`. Fill: `h-full bg-primary radius-full transition-all duration-smooth`. Width: `{searchProgress}%`.
- **Cancel Button:** Ghost Button, `text-xs text-textSecondary`, icon `X` (12px). `"Batalkan"`. Only visible during `searching` and `generating`. Positioned right.
- **Phase Transition:** framer-motion `AnimatePresence` with `mode="wait"`. Crossfade between phases: `opacity 0→1`, `x: -8→0`, 200ms.

### Interactions

- **Cancel Click:** `onCancel` fires. Shows brief loading state, then removes indicator.
- **No hover effects** on the indicator itself (it's informational, not interactive except cancel).
- **Keyboard:** Cancel button focusable via Tab. Enter/Space cancels.

### Accessibility

- Container: `role="status"` with `aria-label="Status loading"`.
- Text label: `aria-live="assertive"` — phase changes announced immediately to screen readers.
- Progress bar: `role="progressbar"`, `aria-valuenow={searchProgress}`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-label="Progres pencarian"`.
- Cancel button: `aria-label="Batalkan pencarian"` / `"Batalkan pembuatan"`.
- Icon (pulsing/rotating): `aria-hidden="true"` (decorative, text label carries meaning).
- Reduced motion: Disable pulse/rotate/bounce animations. Show static icons instead.

---

## SourceBottomSheet

**Purpose:** Mobile-optimized bottom sheet displaying a scrollable list of source documents referenced in the current conversation. Replaces the desktop source sidebar on small screens.

**Path:** `components/chat/source-bottom-sheet.tsx`

**Type:** new

### Props Interface

```typescript
interface SourceBottomSheetProps {
  sources: Source[];                    // Array of Source objects
  isOpen: boolean;
  onClose: () => void;
  onSourceClick: (sourceId: string) => void;
  onDocumentClick: (documentId: string) => void;
  activeSourceId?: string;              // Currently selected source
  title?: string;                       // Default: "Sumber Referensi"
}

// Uses existing Sheet primitive from UI library
```

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `closed` | Not rendered / translated off-screen | No interaction |
| `peek` | Bottom sheet at ~40vh, showing first 2-3 sources. Handle bar visible | Drag handle to expand. Tap backdrop to close |
| `full` | Bottom sheet at ~85vh, full source list visible. Scrollable | Drag down to collapse to peek, then close. Scroll sources list |

### Visual Spec

- **Uses:** Existing `Sheet` component from UI primitives, extended with custom content.
- **Handle Bar:** Centered pill: `w-10 h-1 bg-gray-300 radius-full mx-auto mb-3`. Touch-draggable.
- **Header:** `flex items-center justify-between`, `px-5 py-3 border-b border-border`.
  - Title: `text-base font-semibold text-textPrimary`. Default: `"Sumber Referensi"`.
  - Count badge: Badge component, `text-xs font-mono`, `"5 sumber"`.
  - Close button: `X` icon (20px), `text-textSecondary`, `aria-label="Tutup"`.
- **Source List:** Scrollable area, `max-height: calc(85vh - 80px)`. `overflow-y-auto`.
  - Each item: SourcePreview in `compact` mode.
  - Gap between items: `spacing.sm` (8px).
  - Padding: `px-5 py-2`.
- **Active Source Highlight:** Corresponding item has `border-l-2 border-primary bg-primaryLight/30`.
- **Empty State:** When no sources: `"Belum ada sumber referensi"` with `FileSearch` icon.
- **Animation:** Sheet enter: `y: 100% → 0%` with spring physics (framer-motion). Duration: 400ms. Backdrop: `opacity: 0→0.4` (black overlay).
- **Backdrop:** `bg-black/40`, tap to close. `backdrop-blur-sm` on iOS Safari.

### Interactions

- **Drag Handle:** Pull down to collapse/close. Pull up to expand. Velocity-based: fast swipe dismisses.
- **Backdrop Tap:** Closes sheet (goes to `closed`).
- **Source Click:** `onSourceClick(sourceId)`. Highlights source. Optionally scrolls to citation in chat.
- **Document Click:** `onDocumentClick(documentId)`. Opens document, closes sheet.
- **Escape Key:** Closes sheet.
- **Scroll:** Source list scrolls independently. Momentum scrolling on iOS.

### Accessibility

- Uses Sheet primitive's built-in accessibility: focus trap, `aria-modal="true"`, `role="dialog"`.
- Container: `aria-label="Daftar sumber referensi"`.
- Handle bar: `aria-hidden="true"`.
- Source list: `role="list"`, each source: `role="listitem"`.
- Close button: `aria-label="Tutup panel sumber"`.
- Active source: `aria-current="true"`.
- Focus management: On open, focus moves to first source or active source. On close, focus returns to trigger.
- Scroll: `aria-label="Gulir daftar sumber"` on scrollable container.

---

## ErrorBanner

**Purpose:** Inline error notification with retry capability. Communicates error states clearly and provides actionable recovery options.

**Path:** `components/chat/error-banner.tsx`

**Type:** new

### Props Interface

```typescript
interface ErrorBannerProps {
  error: {
    code: string;             // 'network' | 'rate_limit' | 'auth' | 'unknown' | 'timeout'
    message: string;          // User-friendly Indonesian message
    details?: string;         // Technical details (collapsed by default)
    retryable: boolean;
    timestamp: Date;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
  isOffline: boolean;
  isRetrying?: boolean;
}
```

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `error` | Red-tinted banner: icon + message + retry button | Retry enabled if `retryable`. Dismiss button always available |
| `offline` | Orange/amber banner: wifi-off icon + "Tidak ada koneksi" + auto-retry countdown | Auto-retry every 30s. Countdown displayed. Manual retry available |
| `retrying` | Same layout but retry button shows spinner, disabled | No other interactions. Banner remains until success or final failure |

### Visual Spec

- **Container:** `flex items-start gap-3`, `bg-errorLight`, `border border-error/20`, `radius-lg`, `px-4 py-3`. Full-width within chat container.
- **Icon:** 20×20px.
  - Error: `AlertTriangle` icon, `text-error`.
  - Offline: `WifiOff` icon, `text-warning`.
  - Retrying: `Loader2` icon, `text-error`, `animate-spin`.
- **Content:** `flex-1 min-w-0`.
  - Message: `text-sm font-medium text-error` (error) or `text-warning` (offline).
  - Details (collapsed): `text-xs text-textSecondary mt-1`. Expandable: `"Detail teknis"` link.
  - Offline countdown: `"Mencoba ulang dalam {n}s"`, `text-xs text-textSecondary font-mono`.
- **Action Buttons:**
  - Retry: Button component, `variant="outline"`, `size="sm"`. `"Coba lagi"` text. `Loader2` spinner when retrying.
  - Dismiss: `X` icon button, `size="sm"`, `text-textSecondary`.
- **Animation:** Enter: `opacity: 0, y: -8 → opacity: 1, y: 0`, 200ms. Exit: reverse.
- **Retry Button Disabled Style:** `opacity-50 cursor-not-allowed` when `isRetrying`.

### Interactions

- **Retry Click:** `onRetry` fires. Button switches to spinner. Banner stays until resolution.
- **Dismiss Click:** `onDismiss` fires. Banner slides up and fades out.
- **Details Toggle:** Expands technical error details (collapsible section with `ChevronDown` toggle).
- **Auto-retry (offline):** Countdown timer. On reach 0: `onRetry` fires automatically. Countdown pauses on hover/focus.
- **Keyboard:** Tab: Retry → Dismiss. Enter/Space activates. Escape dismisses.

### Accessibility

- Container: `role="alert"`, `aria-live="assertive"`. (Critical: errors must be announced immediately).
- Error type classification: `aria-label="Error: {errorType}"`.
- Retry button: `aria-label="Coba lagi"` / `"Sedang mencoba ulang..."` (when retrying).
- Dismiss button: `aria-label="Tutup pesan error"`.
- Offline banner: Additional `role="status"` with `aria-live="polite"` for countdown updates.
- Details region: `role="region"`, `aria-label="Detail teknis error"`, `aria-expanded`.
- Focus: On mount, focus does NOT auto-move to error banner (would interrupt user). User can Tab to it.

---

## Modified Components

---

## MessageBubble

**Purpose:** Core message display component for both user and assistant messages. Renders markdown content, timestamps, avatars, inline citations, and feedback actions.

**Path:** `components/chat/message-bubble.tsx`

**Type:** modified

### Props Interface

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;             // Markdown for assistant, plain text for user
  timestamp: Date;
  sources?: Source[];          // Referenced sources (assistant only)
  feedback?: 'thumbs-up' | 'thumbs-down' | null;
  isStreaming?: boolean;
  error?: ErrorObject | null;
}

interface MessageBubbleProps {
  message: Message;
  onCitationClick: (sourceId: string) => void;
  onFeedback: (messageId: string, type: 'thumbs-up' | 'thumbs-down') => void;
  onCopy: (content: string) => void;
  onRegenerate: (messageId: string) => void;
  isLastMessage: boolean;
  activeSourceId?: string;     // Highlighted citation
  isMobile?: boolean;
}

// Added imports:
import { CitationMarker } from './citation-marker';
import { FeedbackBar } from './feedback-bar';
```

### Changes from V1

| Aspect | V1 | V2 |
|--------|----|----|
| Max width | `max-w-[80%]` fixed | `max-w-[85%] md:max-w-[80%]` dynamic |
| Copy button | Hover-only reveal | Always visible, smaller (24px) |
| Citations | None (sources shown in bottom bar) | Inline CitationMarker components in assistant text |
| Feedback | None | FeedbackBar below assistant messages |
| Source rendering | Global bottom bar | Per-message, inline via CitationMarker |

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `user` | Right-aligned, `bg-primary text-white`, `radius-xl` with `rounded-br-md` | Content rendered as plain text. Copy button available |
| `assistant` | Left-aligned, `bg-surface border border-border`, `radius-xl` with `rounded-bl-md` | Content rendered as Markdown. Citations, feedback bar, copy all available |
| `streaming` | Same as assistant but with typing cursor at end | Content progressively revealed. Feedback bar hidden until complete |
| `error` | Assistant style + ErrorBanner below | Error state with retry option |
| `empty` | LoadingIndicator component in assistant position | Shown during initial response generation |

### Visual Spec

- **User Bubble:**
  - Background: `bg-primary` (warm-purple-500).
  - Text: `text-white`, `text-sm leading-relaxed`.
  - Border radius: `radius-xl` with `rounded-br-md` (flat bottom-right corner).
  - Alignment: `ml-auto` (right-aligned), `max-w-[85%] md:max-w-[80%]`.
  - Padding: `px-4 py-2.5`.
- **Assistant Bubble:**
  - Background: `bg-surface`.
  - Border: `border border-border`.
  - Text: `text-textPrimary`, `text-sm leading-relaxed`.
  - Border radius: `radius-xl` with `rounded-bl-md` (flat bottom-left corner).
  - Alignment: `mr-auto` (left-aligned), `max-w-[85%] md:max-w-[80%]`.
  - Padding: `px-4 py-2.5`.
  - Shadow: `shadow-sm` on hover (subtle elevation).
- **Markdown Content (assistant):**
  - Uses `react-markdown` with `remark-gfm` and `rehype-highlight`.
  - Code blocks: `bg-surfaceAlt border border-border radius-md p-3 font-mono text-xs`.
  - Inline code: `bg-surfaceAlt text-primary-800 px-1.5 py-0.5 radius-sm font-mono text-xs`.
  - Links: `text-primary underline decoration-primary/30 hover:decoration-primary`.
  - Lists: Standard markdown list styling, `gap-1` between items.
  - Tables: `overflow-x-auto`, striped rows, border styling.
- **Timestamp:** `text-[10px] text-textSecondary mt-1`. Relative format: `"2 menit lalu"`, `"Kemarin, 14:30"`. Always below bubble.
- **Avatar:** 28×28px circle. User: initials on `bg-primary/10`. Assistant: MimoNotes icon on `bg-primaryLight`.
- **Citation Markers:** Inline within markdown rendering. Replaces raw `[1]` text via custom ReactMarkdown component override.
- **Copy Button:** 24×24px, `Copy` icon (12px). `text-textSecondary`. Positioned top-right of bubble, `absolute top-2 right-2`. Always visible. On success: `Check` icon, `text-success`, 2s revert.
- **FeedbackBar:** Renders below assistant message content, inside bubble padding. Only for assistant messages. Hidden during streaming.

### Interactions

- **Copy:** Click copies full message content. Toast confirmation.
- **Citation Click:** Click CitationMarker, triggers `onCitationClick`. Source preview opens.
- **Feedback:** Via FeedbackBar. Toggle thumbs up/down.
- **Regenerate:** Via FeedbackBar. Only on last assistant message.
- **Hover:** Assistant bubble: subtle shadow appears. User bubble: slight darken.
- **Long press (mobile):** Context menu with Copy, Copy Link options.

### Accessibility

- Container: `role="article"`, `aria-label="Pesan dari {role}"`.
- Content: `aria-live="polite"` for assistant (announces new content during streaming).
- Timestamp: `aria-label="Dikirim {absoluteTime}"`.
- Copy button: `aria-label="Salin pesan"`.
- Avatar: `aria-hidden="true"` (decorative).
- Markdown rendering: Proper heading hierarchy (h1-h6), list roles, code block labels.
- Screen reader: Messages announced in chronological order. Streaming messages announced when complete.

---

## ChatWindow

**Purpose:** Top-level chat container managing session state, message list, input area, and integrating all chat sub-components (EmptyState, LoadingIndicator, ErrorBanner, Sources).

**Path:** `components/chat/chat-window.tsx`

**Type:** modified

### Props Interface

```typescript
interface ChatSession {
  id: string;
  title: string;               // Auto-generated from first message
  messages: Message[];
  sources: Source[];
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

interface ChatWindowProps {
  session?: ChatSession;
  isLoading: boolean;
  isStreaming: boolean;
  error?: ErrorObject | null;
  isOffline: boolean;
  onSendMessage: (content: string) => void;
  onRegenerate: (messageId: string) => void;
  onCitationClick: (sourceId: string) => void;
  onFeedback: (messageId: string, type: FeedbackType) => void;
  onCopy: (content: string) => void;
  onLoadSession: (sessionId: string) => void;
  onNewSession: () => void;
  suggestedPrompts?: SuggestedPrompt[];
  recentDocuments?: RecentDocument[];
  isMobile?: boolean;
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}
```

### Changes from V1

| Aspect | V1 | V2 |
|--------|----|----|
| Empty state | Basic "start chatting" text | Full EmptyStateChat component |
| Loading | Simple spinner | Three-phase LoadingIndicator |
| Error handling | Global error bar | Per-error ErrorBanner with retry |
| Sources display | Bottom bar (global) | Per-message via CitationMarker + SourceBottomSheet (mobile) |
| Source panel | Always-visible sidebar | Toggle sidebar (desktop) / bottom sheet (mobile) |
| Session management | Manual title | Auto-titling from first message |

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `empty` | EmptyStateChat fills the viewport | Prompt grid and quick actions available |
| `loading` | EmptyStateChat visible + LoadingIndicator appended | Messages list hidden or minimal |
| `active` | Full message list + input area + optional source panel | Normal chat interaction |
| `streaming` | Active state + streaming indicator + progressive message | Input disabled during streaming. Cancel available |
| `error` | Active state + ErrorBanner at top of message list | Error is dismissible. Chat continues working |
| `offline` | Active state + offline ErrorBanner + limited functionality | Cached messages visible. Send queued |

### Visual Spec

- **Layout:** Full-height flex column. `h-screen` or `h-full` depending on context.
- **Structure:**
  ```
  ┌─────────────────────────────┐
  │ Header (session title, actions) │
  ├──────────┬──────────────────┤
  │ Sidebar  │ Messages List    │  (desktop)
  │ (toggle) │                  │
  │          │ [EmptyState/Msgs]│
  │          │                  │
  │          ├──────────────────┤
  │          │ Input Area       │
  └──────────┴──────────────────┘
  ```
- **Messages Area:** `flex-1 overflow-y-auto`, `scroll-smooth`. Auto-scrolls to bottom on new message. Preserves scroll position when messages added above.
- **Input Area:** Fixed at bottom. `sticky bottom-0 bg-surface border-t border-border`. Contains Input component + send button + attachment button.
- **Source Panel (Desktop):** Right sidebar, `w-80`, collapsible. Contains list of SourceCard components. Toggle via button in header. `AnimatePresence` for slide in/out.
- **Source Panel (Mobile):** SourceBottomSheet instead of sidebar. Triggered by button in header.
- **Header:** `flex items-center justify-between`, `px-4 py-3 border-b border-border bg-surface`. Session title (auto-generated, editable on click), new session button, sidebar toggle, more menu.
- **Error Placement:** ErrorBanner renders at top of messages area (below header, above first message), not at bottom.
- **Loading Placement:** LoadingIndicator renders as last item in messages list (assistant position).

### Interactions

- **Send Message:** Input submit (Enter) or send button. Message appears immediately (optimistic). Loading indicator shows.
- **Auto-scroll:** On new message, smooth scroll to bottom. If user scrolled up, show "New messages" indicator instead.
- **Session Switch:** Click session in sidebar → load new session. Confirm if current session has unsent changes.
- **Sidebar Toggle:** Button in header. Desktop: slides source panel. Mobile: opens SourceBottomSheet.
- **Source Click (any):** Highlights citation in corresponding message. Scrolls message into view if needed.
- **Regenerate:** Last assistant message's regenerate button. Removes last assistant message, re-sends context.
- **Offline Mode:** Messages queue. Visual indicator. Auto-send when reconnected.

### Accessibility

- Container: `role="main"`, `aria-label="Jendela percakapan"`.
- Messages region: `role="log"`, `aria-label="Riwayat pesan"`, `aria-live="polite"`, `aria-relevant="additions"`.
- Input area: `role="form"`, `aria-label="Kirim pesan"`.
- Source panel: `role="complementary"`, `aria-label="Sumber referensi"`.
- Focus management: After sending message, focus returns to input. After error, focus on retry button. On session switch, focus on first message.
- Keyboard shortcuts: `Cmd/Ctrl+Enter` to send. `Escape` to close source panel. `Cmd/Ctrl+N` for new session.
- Screen reader: Announces new messages, source panel open/close, loading states, errors.

---

## SourceCard

**Purpose:** Card component displaying a source document with metadata, similarity score, and expandable content snippet. Used in desktop source panel and inline source lists.

**Path:** `components/chat/source-card.tsx`

**Type:** modified

### Changes from V1

| Aspect | V1 | V2 |
|--------|----|----|
| Layout | Horizontal scroll container | Responsive grid (2-col on desktop) or vertical list |
| File type indicator | Emoji (📄, 📝) | Badge component with lucide icon |
| Similarity display | Simple percentage text | Visual bar + percentage |
| Content snippet | Truncated text | Highlighted search terms with `<mark>` |
| Interaction | Click to expand | Expand/collapse with smooth animation |

### Props Interface

```typescript
interface SourceCardProps {
  source: Source;
  index: number;
  isExpanded: boolean;
  onToggle: (sourceId: string) => void;
  onDocumentClick: (documentId: string) => void;
  isActive?: boolean;          // Highlighted when citation clicked
  variant?: 'list' | 'grid';  // Layout mode
  compact?: boolean;           // For inline display
}

// File type badge mapping:
const fileTypeConfig: Record<string, { icon: LucideIcon; color: string; label: string }> = {
  pdf:  { icon: FileText, color: 'red',    label: 'PDF' },
  docx: { icon: FileText, color: 'blue',   label: 'DOCX' },
  txt:  { icon: File,     color: 'gray',   label: 'TXT' },
  md:   { icon: FileCode, color: 'purple', label: 'MD' },
  csv:  { icon: Table,    color: 'green',  label: 'CSV' },
};
```

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `default` | Card with file badge, title, similarity bar, truncated snippet | Clickable to expand/collapse |
| `expanded` | Full content snippet with highlighted terms, section info, page number, document link | Content slides in below header |
| `active` | Left border accent (primary), slight bg tint | Corresponds to active citation. Scrolls into view if needed |
| `hover` | Subtle shadow, bg transition | Visual feedback only |

### Visual Spec

- **Container:** Card component. `bg-surface`, `border-border`, `radius-lg`. Padding: `p-3`.
- **Active State:** `border-l-2 border-l-primary bg-primaryLight/20`.
- **Grid Mode:** `grid grid-cols-2 gap-3` on desktop. Each card: `min-w-0`.
- **List Mode:** `flex flex-col gap-2`. Full-width cards.
- **Header Row:** `flex items-start gap-2.5`.
  - Index: `text-[10px] font-mono font-bold bg-primaryLight text-primary-800 px-1.5 py-0.5 radius-full min-w-[20px] text-center`.
  - File Badge: Badge component. `variant="outline"`. Maps via `fileTypeConfig`. Icon 14px + label. `text-[10px] font-medium`.
  - Title: `text-sm font-medium text-textPrimary truncate flex-1`.
  - Chevron: `ChevronDown` 14px, `text-textSecondary`. Rotates on expand.
- **Similarity Visualization:** Below title, `flex items-center gap-2 mt-1.5`.
  - Bar: `h-1.5 bg-primary/10 radius-full flex-1 overflow-hidden`.
  - Fill: `h-full bg-primary radius-full transition-all duration-smooth`. Width: `{similarity}%`.
  - Color thresholds: ≥90% `bg-success`, 70-89% `bg-primary`, <70% `bg-warning`.
  - Text: `text-[10px] font-mono text-textSecondary min-w-[32px]`. Format: `"92%"`.
- **Expanded Content:**
  - Snippet: `text-xs text-textSecondary leading-relaxed bg-surfaceAlt p-2.5 radius-md mt-2`.
  - Highlighted terms: `<mark className="bg-primary/15 text-primary-900 rounded-sm px-0.5">`.
  - Section/Page: `text-[10px] text-textSecondary mt-2 flex items-center gap-1`. Icons: `Hash` (section), `FileText` (page).
  - Document link: `text-xs text-primary font-medium hover:underline mt-2 inline-flex items-center gap-1`. `ExternalLink` icon 12px.
- **Animation:** Expand: `framer-motion`. Height auto, `opacity 0→1`, 200ms. Chevron: `rotate 0→180°`, 200ms.

### Interactions

- **Toggle:** Click header row. Expands/collapses content. `onToggle(sourceId)`.
- **Document Click:** Click document link. `onDocumentClick(documentId)`. Opens in new context.
- **Hover:** `bg-surfaceAlt` transition. `shadow-sm`.
- **Keyboard:** Tab to focus. Enter/Space toggles expand. Inside expanded: Tab cycles through content, section info, document link.
- **Grid mode responsive:** Below 768px, switches to single-column list mode automatically.

### Accessibility

- Container: `role="article"`, `aria-label="Sumber {index}: {title}"`.
- Toggle: `aria-expanded={isExpanded}` on header.
- Header: `role="button"`, `tabIndex={0}`.
- Similarity bar: `role="progressbar"`, `aria-valuenow={similarity}`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-label="Tingkat kemiripan: {percent}%"`.
- File badge: `aria-label="Format file: {fileType}"`.
- Document link: `aria-label="Buka dokumen {title}"`, `target="_blank" rel="noopener noreferrer"`.
- Active state: `aria-current="true"`.
- Focus: `focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:rounded-lg`.

---

## SessionSidebar

**Purpose:** Left sidebar listing all chat sessions with search, delete, date grouping, and auto-titling. Provides session management and navigation.

**Path:** `components/chat/session-sidebar.tsx`

**Type:** modified

### Props Interface

```typescript
interface ChatSession {
  id: string;
  title: string;                // Auto-generated from first message
  firstMessage: string;         // Used for auto-titling
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;         // Preview of last message (truncated)
}

interface SessionSidebarProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewSession: () => void;
  onSearch: (query: string) => void;
  isOpen: boolean;
  isMobile?: boolean;
}
```

### Changes from V1

| Aspect | V1 | V2 |
|--------|----|----|
| Session title | Manual / truncated first message | Auto-generated: first 40 chars of first message |
| Message count | Not shown | Badge on each session item |
| Search | Basic text input | Debounced search with icon |
| Date grouping | None | Grouped by: Hari ini, Kemarin, Minggu ini, Bulan lalu, etc. |
| Empty state | "No sessions" text | Illustrated empty state with prompt to start |

### States

| State | Visual | Behavior |
|-------|--------|----------|
| `open` | Full sidebar visible with session list | All interactions available |
| `collapsed` | Only icon visible (hamburger/panel toggle) | Click to expand |
| `mobile` | Full-screen overlay or slide-in from left | Backdrop tap to close. Escape to close |
| `searching` | Search input focused, filtered results | Live filtering with debounce (300ms) |
| `empty` | No sessions / no search results | Empty state with illustration |

### Visual Spec

- **Container:** `w-72 bg-surface border-r border-border`, `h-full flex flex-col`. On mobile: fixed overlay, `w-full max-w-sm`, `z-50`.
- **Header:** `px-4 py-3 border-b border-border`.
  - Title: `text-sm font-semibold text-textPrimary`. `"Percakapan"`.
  - New Session Button: Button variant `primary` size `sm`. `Plus` icon + `"Baru"`. Full-width.
- **Search:** `px-3 py-2`. Input component with `Search` icon prefix. Placeholder: `"Cari percakapan..."`. `text-sm`.
- **Session List:** `flex-1 overflow-y-auto`, `py-1`.
- **Date Group Headers:** `text-[10px] font-medium text-textSecondary uppercase tracking-wider px-4 py-2 sticky top-0 bg-surface z-10`. Groups:
  - `"Hari Ini"` / `"Kemarin"` / `"Minggu Ini"` / `"Bulan Lalu"` / `"{Month Year}"`
- **Session Item:** `flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors`. 
  - Active: `bg-primaryLight border-r-2 border-r-primary`.
  - Hover: `bg-surfaceAlt`.
  - Content: `flex-1 min-w-0`.
    - Title: `text-sm font-medium text-textPrimary truncate`. Auto-generated, max 40 chars.
    - Preview: `text-xs text-textSecondary truncate mt-0.5`. Last message content, max 50 chars.
    - Meta row: `flex items-center gap-2 mt-1`.
      - Message count: Badge, `text-[10px] font-mono`. `"{n} pesan"`.
      - Relative time: `text-[10px] text-textSecondary`. `"2 jam lalu"`.
  - Delete button: `Trash2` icon (14px), `text-textSecondary hover:text-error`. Revealed on hover or long-press. `opacity-0 group-hover:opacity-100`.
- **Empty State:** Centered in list area. `MessageSquare` icon (48px, `text-textSecondary/30`). Text: `"Belum ada percakapan"`. Subtitle: `"Mulai percakapan baru untuk memulai"`.
- **No Search Results:** `SearchX` icon. `"Tidak ditemukan"` / `"Coba kata kunci lain"`.
- **Mobile Overlay:** Backdrop: `bg-black/40 backdrop-blur-sm`. Sidebar slides from left. `framer-motion` slide: `x: -100% → 0%`, 300ms.

### Interactions

- **Select Session:** Click session item. `onSelectSession(id)`. Active indicator appears. Mobile: sidebar closes.
- **New Session:** Click "Baru" button. `onNewSession()`. Creates empty session, switches to it.
- **Delete:** Click trash icon. Confirmation dialog (Dialog component): `"Hapus percakapan ini?"` with session title. `"Hapus"` (destructive) / `"Batal"`.
- **Search:** Type in search input. 300ms debounce. `onSearch(query)` fires. List filters in real-time.
- **Keyboard:** `Cmd/Ctrl+K` to focus search. `Arrow Up/Down` to navigate sessions. `Enter` to select. `Delete` to trigger delete (with confirmation).
- **Scroll:** Session list scrolls with momentum. New session button stays pinned at top.
- **Auto-titling:** When first message is sent, first 40 chars (or first sentence) becomes the session title. Updated in real-time.

### Accessibility

- Container: `role="navigation"`, `aria-label="Riwayat percakapan"`.
- Session list: `role="list"`.
- Session item: `role="listitem"`, `role="button"`, `tabIndex={0}`.
  - Active session: `aria-current="true"`.
  - `aria-label="{title}, {messageCount} pesan, {relativeTime}"`.
- Search: `role="search"`, `aria-label="Cari percakapan"`.
- Date groups: `role="heading"`, `aria-level={3}`.
- Delete button: `aria-label="Hapus percakapan {title}"`. On click, announces confirmation dialog.
- New session button: `aria-label="Buat percakapan baru"`.
- Focus management: On open, focus on search or active session. On delete, focus returns to next session.
- Keyboard navigation: Arrow keys within session list, Home/End for first/last session.
- Mobile: Focus trap within sidebar when open. Escape closes.

---

## Component Dependency Graph

```
ChatWindow
├── EmptyStateChat
│   └── (uses: Card, Button, Skeleton, Badge)
├── MessageBubble
│   ├── CitationMarker
│   └── FeedbackBar
│       └── (uses: Button, Tooltip, sonner)
├── LoadingIndicator
├── ErrorBanner
│   └── (uses: Button)
├── SourceCard
│   └── (uses: Badge, Card)
├── SourceBottomSheet
│   └── SourcePreview (compact)
│       └── (uses: Badge, Card)
└── SessionSidebar
    └── (uses: Button, Input, Badge, Dialog, Skeleton)
```

## Implementation Priority

| Priority | Component | Rationale |
|----------|-----------|-----------|
| P0 | MessageBubble (modified) | Core experience, daily use |
| P0 | ChatWindow (modified) | Orchestrator, integrates everything |
| P0 | FeedbackBar | User engagement, quality signal |
| P1 | CitationMarker | Source attribution, key differentiator |
| P1 | SourcePreview | Source detail, companion to citations |
| P1 | SourceCard (modified) | Source panel core component |
| P1 | EmptyStateChat | First impression, onboarding |
| P2 | LoadingIndicator | UX polish, perceived performance |
| P2 | ErrorBanner | Error recovery, robustness |
| P2 | SourceBottomSheet | Mobile experience |
| P2 | SessionSidebar (modified) | Session management polish |

## Testing Notes

- All components should have unit tests with React Testing Library.
- CitationMarker → SourcePreview interaction requires integration test.
- SourceBottomSheet requires touch event simulation tests.
- FeedbackBar clipboard API requires mock in test environment.
- LoadingIndicator phase transitions require timing-based tests.
- Auto-titling in SessionSidebar requires debounce testing.
- Mobile breakpoints: Test all responsive behavior at 375px, 768px, 1024px, 1440px.
- Accessibility: Run axe-core on all components. Ensure zero violations.
- Performance: MessageBubble should handle 200+ message lists without jank. Use virtualization if needed (react-window).

---

*Document maintained by MimoNotes Design Engineering. For questions, reach out in #chat-v2.*
