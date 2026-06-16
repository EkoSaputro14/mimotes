# Citation System Report — MimoNotes Chat V2

> **Component:** Citation System  
> **Sprint:** C2  
> **Date:** 2026-06-14

---

## Overview

The Citation System enables inline source references in AI responses, allowing users to click numbered citations and see the source documents they reference.

## Components

### 1. CitationMarker (`citation-marker.tsx`)

A small inline button that renders as a superscript number `[1]`.

**Props:**
```typescript
interface CitationMarkerProps {
  index: number;           // Source number (1-based)
  isActive?: boolean;      // Whether this citation is currently selected
  onClick?: (index: number) => void;  // Click handler
}
```

**Visual:**
- Default: `bg-primary/10 text-primary` (subtle purple tint)
- Active: `bg-primary text-primary-foreground` (filled purple)
- Size: 20×18px minimum, rounded-md
- Position: `align-super` (superscript)

**Accessibility:**
- `aria-label="Sumber N"` (screen reader)
- `focus-visible:ring-2` for keyboard navigation

### 2. SourcePreview (`source-preview.tsx`)

Expandable source detail card displayed below each assistant message.

**Props:**
```typescript
interface SourcePreviewProps {
  source: Source;          // Source data object
  index: number;           // Citation number (1-based)
  isHighlighted?: boolean; // Whether this source is being referenced
}
```

**States:**
- Collapsed: Shows title, file type badge, similarity percentage
- Expanded: Shows full content snippet, document link
- Highlighted: Purple border + subtle background tint

**Visual:**
- Border: `border-border` (default) / `border-primary/50` (highlighted)
- File type badges: Color-coded (red=PDF, blue=DOCX, green=XLSX, etc.)
- Similarity: Purple text `N%`

### 3. MessageBubble (Modified)

Now renders inline citations and source previews for each assistant message.

**New Props:**
```typescript
{
  message: Message;
  onCitationClick?: (index: number) => void;
  highlightedSource?: number | null;
}
```

**Citation Parsing:**
- `hasCitations(text)` — checks for `[N]` patterns
- `parseContentWithCitations(text, onClick, active)` — splits text into segments with CitationMarker components
- Supports multiple citations per marker: `[1,2,3]`

**Source Rendering:**
- Sources rendered below the message bubble (not in a separate bar)
- Each source gets its own SourcePreview component
- Sources persist for all assistant messages (not just the last one)

### 4. ChatWindow (Modified)

**Removed:**
- `currentSources` state (was global, only tracked last response's sources)

**Added:**
- `highlightedSource` state (for citation click → source highlight)
- `handleCitationClick(index)` — highlights source + smooth-scrolls to it
- Each message object now carries its own `sources` array

**Source Flow:**
```
API response → X-Sources header → parsed into sources[]
  → attached to assistant message object
  → MessageBubble renders sources below bubble
  → User can scroll up and see sources for any message
```

## Markdown Typography Improvements

The `globals.css` markdown-body section was completely rewritten:

| Element | Before | After |
|---------|--------|-------|
| Line height | 1.6 | 1.7 |
| Font size | 13px | 0.9375rem (15px) |
| Headings | h1-h3 only | h1-h4 with hierarchy |
| Code blocks | No border | 1px border |
| Blockquote | Gray border | Primary color border, italic |
| Lists | Basic | Nested styles, marker colors |
| Links | Basic underline | Offset 2px, thickness on hover |
| Strong | Default | font-weight: 650 |

## Usage Examples

### Inline Citations in AI Response

When the RAG system generates a response with citations:

```markdown
Berdasarkan dokumen yang diupload [1], sistem ini menggunakan 
arsitektur microservices [2][3] dengan container orchestration.
```

This renders as:
- `Berdasarkan dokumen yang diupload` → plain text
- `[1]` → clickable purple marker
- `sistem ini menggunakan arsitektur microservices` → plain text
- `[2][3]` → two clickable purple markers side by side

### Click Interaction

1. User clicks `[1]`
2. `CitationMarker` calls `onClick(1)`
3. `MessageBubble` sets `activeCitation = 1`
4. `ChatWindow` sets `highlightedSource = 1`
5. SourcePreview with index 1 gets `isHighlighted = true` (purple border)
6. `document.getElementById('source-preview-1').scrollIntoView()` triggers smooth scroll

### Session Loading

When loading a previous session:
- Each message's `sources` array is restored from the API
- All sources are visible below their respective messages
- Citations in old messages are still clickable
