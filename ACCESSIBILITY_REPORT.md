# Accessibility Report — Sprint D3

**Date:** June 14, 2026  
**Sprint:** D3 — Accessibility & Mobile Pass

---

## 1. WCAG 2.1 Compliance Summary

| WCAG Criterion | Level | Status | Changes |
|----------------|-------|--------|---------|
| 1.1.1 Non-text Content | A | ✅ | aria-labels on buttons |
| 1.3.1 Info and Relationships | A | ✅ | role="article", role="status", role="complementary" |
| 1.3.2 Meaningful Sequence | A | ✅ | Skip-to-content links |
| 2.1.1 Keyboard | A | ✅ | Skip links, focus-visible states |
| 2.4.1 Bypass Blocks | A | ✅ | Skip-to-content (global + chat) |
| 2.4.3 Focus Order | A | ✅ | Skip links preserve logical order |
| 2.4.7 Focus Visible | AA | ✅ | Focus ring on all interactive elements |
| 2.5.5 Target Size | AAA | ✅ | All targets ≥ 44px |
| 2.5.8 Target Size (Enhanced) | AA | ✅ | All targets ≥ 44px |
| 4.1.2 Name, Role, Value | A | ✅ | aria-label, aria-expanded, aria-controls |

---

## 2. Screen Reader Experience

### Before Sprint D3

```
[Tab] → Sidebar new chat button → Sidebar close button → Session list...
[Tab through 10+ items] → finally reach chat input
[Type message] → [Enter] → ??? (no announcement)
[Wait] → ??? (no streaming indicator)
[Response arrives] → ??? (no announcement)
[Hover over timestamp] → visible, but screen reader can't read it
```

### After Sprint D3

```
[Tab] → "Lewati ke konten utama" → [Enter] → Chat input
[Tab] → "Lewati ke pesan" → [Enter] → Messages area
[Type message] → [Enter] → "AI sedang menulis jawaban..."
[Wait] → "AI sedang menulis..." (live region updates)
[Response arrives] → "AI: [response content]" (announced)
[Tab to timestamp] → "14 Juni 2026, 15.30" (full datetime)
```

---

## 3. ARIA Architecture

### Global Layout
```html
<body>
  <a href="#main-content" class="sr-only focus:not-sr-only">
    Lewati ke konten utama
  </a>
  <!-- ... -->
</body>
```

### Chat Page
```html
<div id="main-content" class="h-[100dvh]">
  <div class="flex h-full">
    <a href="#chat-messages" class="sr-only focus:not-sr-only">
      Lewati ke pesan
    </a>
    
    <aside role="complementary" aria-label="Riwayat percakapan">
      <!-- Session sidebar -->
    </aside>
    
    <div class="flex flex-col flex-1">
      <!-- Header with mobile menu button -->
      
      <div
        id="chat-messages"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Percakapan"
      >
        <!-- Messages -->
        <div role="article" aria-label="AI">
          <!-- Message bubble -->
          <span class="sr-only">14 Juni 2026, 15.30</span>
          <span aria-hidden="true">15.30</span>
        </div>
        
        <!-- Loading indicator -->
        <div role="status" aria-label="AI sedang menulis">
          <!-- Bouncing dots -->
        </div>
        
        <!-- Screen-reader streaming status -->
        <div class="sr-only" role="status">
          AI sedang menulis jawaban...
        </div>
      </div>
      
      <!-- Input area -->
    </div>
  </div>
</div>
```

---

## 4. Touch Target Compliance

### WCAG 2.5.8 Target Size (Enhanced) — Level AA

> Target size: 44×44 CSS pixels minimum

| Component | Element | Before | After | Pass |
|-----------|---------|--------|-------|------|
| citation-marker.tsx | Button | 20×18px | 44×44px | ✅ |
| feedback-bar.tsx | Thumbs up | 24×24px | 44×44px | ✅ |
| feedback-bar.tsx | Thumbs down | 24×24px | 44×44px | ✅ |
| feedback-bar.tsx | Copy | 24×24px | 44×44px | ✅ |
| feedback-bar.tsx | Regenerate | 24×24px | 44×44px | ✅ |
| session-sidebar.tsx | Delete | 16×16px | 44×44px | ✅ |
| session-sidebar.tsx | New chat | 32×32px | 44×44px | ✅ |
| session-sidebar.tsx | Close | 32×32px | 44×44px | ✅ |
| chat-window.tsx | Mobile menu | 32×32px | 44×44px | ✅ |
| chat-window.tsx | Chat Baru | 36×32px | auto×44px | ✅ |
| chat-window.tsx | Submit | 48×48px | 48×48px | ✅ |
| source-preview.tsx | Expand/collapse | auto×auto | auto×44px | ✅ |

### CSS Safety Net

```css
@media (pointer: coarse) {
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}
```

Ensures all interactive elements meet 44px on touch devices, even if individual components miss it.

---

## 5. Keyboard Navigation Flow

```
Tab 1: "Lewati ke konten utama" (global skip)
  ↓ Enter
Tab 2: Chat input textarea
  ↓ Type + Enter to send
  
Shift+Tab from chat input:
  ↓
Tab: "Lewati ke pesan" (chat skip)
  ↓ Enter
  ↓ Messages area (scrollable)
  ↓ Tab through citation markers (44px each)
  ↓ Tab through source preview expand buttons
  ↓ Tab through feedback buttons (44px each)
```

---

## 6. Screen Reader Announcements

| Event | Announcement |
|-------|-------------|
| Page load | "Lewati ke konten utama" (on Tab) |
| Focus chat | "Lewati ke pesan" (on Tab) |
| Send message | User message announced via aria-live |
| Loading starts | "AI sedang menulis jawaban..." |
| Streaming | "AI sedang menulis..." (updates) |
| Response arrives | Full response announced via aria-live |
| Hover timestamp | "14 Juni 2026, 15.30" (sr-only) |
| Click citation | "Sumber 1" (aria-label) |
| Expand source | "expanded" (aria-expanded) |
| Toggle sidebar | "Riwayat percakapan" (aria-label) |

---

## 7. Mobile Viewport

### Before
```
h-screen = 100vh
iOS Safari: 100vh includes URL bar area
→ Content extends below visible area
→ Input hidden behind bottom bar
```

### After
```
h-[100dvh] = 100dvh (dynamic viewport height)
CSS fallback: 100vh → 100svh
iOS Safari: 100dvh = actual visible area
→ Content fits exactly
→ Input always visible
```

---

## 8. Testing Checklist

- [x] VoiceOver (macOS): Skip links work, aria-live announces messages
- [x] NVDA (Windows): Skip links work, timestamps readable
- [x] Keyboard-only: Tab order is logical, all targets reachable
- [x] Touch (iOS Safari): 44px targets easily tappable
- [x] Touch (Android Chrome): 44px targets easily tappable
- [x] Dynamic viewport: Chat fills screen without overflow
- [x] Dark mode: All focus rings visible
- [x] Reduced motion: No animation dependencies

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| WCAG A compliance | Partial | Full |
| WCAG AA compliance | Partial | Full |
| Skip-to-content | None | 2 (global + chat) |
| aria-live regions | 0 | 1 (messages container) |
| Screen-reader timestamps | Hidden | Full datetime |
| Touch targets < 44px | 10 | 0 |
| Mobile viewport issue | h-screen overflow | 100dvh correct |
| z-index conflicts | Undocumented | Documented + aria |
