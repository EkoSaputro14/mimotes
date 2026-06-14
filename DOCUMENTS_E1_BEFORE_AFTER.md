# Documents E1 — Before & After

**Sprint:** Documents V2 — Phase 1 (Quick Wins)

---

## Upload Flow

### Before
- Queue showed 3 hardcoded demo files on every load
- Title: "Ingest Information" with English subtitle
- No retry on failed uploads (items silently removed)
- Processing queue always visible (even when empty)

### After
- Queue starts empty, shows "Belum ada file yang diupload"
- Title: "Upload Dokumen" with Indonesian subtitle
- Failed uploads show "Coba Lagi" button with retry functionality
- Processing queue section hidden when empty
- Processing queue has `aria-live="polite"` for screen readers

---

## Document Detail Page

### Before
- No shortcut to start a chat about the document
- Status badges: color-only text (no icons)
- No skip-to-content link

### After
- "Tanya tentang dokumen ini" primary CTA button → links to `/chat?doc=[id]`
- Status badges include icons: ✅ Ready, ⏳ Processing, ❌ Failed
- Skip-to-content link for keyboard navigation

---

## Document Library (Admin)

### Before
- Empty state: emoji + text only
- Status badges: "Siap" / "Memproses..." / "Gagal" (color only)
- No skip-to-content

### After
- Empty state: icon in circle + CTA with upload icon + format list
- Status badges: ✅ Siap, ⏳ Memproses..., ❌ Gagal
- Skip-to-content link for keyboard navigation

---

## Document Library (Knowledge)

### Before
- Empty state: English text, basic CTA
- Status badges: color-only (no icons)
- No skip-to-content

### After
- Empty state: Indonesian copy, icon in circle, CTA with upload icon
- Status badges: ✅ Ready, ⏳ Processing, ❌ Failed
- Skip-to-content link (in parent page)

---

## Accessibility

### Before
- No skip links on document pages
- No aria-live for processing status
- Delete uses `window.confirm` (not styled, not accessible)
- Status badges color-only

### After
- Skip-to-content on all 3 document pages
- aria-live="polite" on processing queue
- role="status" on active count badge
- Status badges include text icons (color + icon)

---

## Score Impact

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Upload flow | 4/10 | 5/10 | +1 |
| Document detail | 4/10 | 5.5/10 | +1.5 |
| Empty states | 3/10 | 5/10 | +2 |
| Accessibility | 3/10 | 5/10 | +2 |
| **Overall** | **5.1/10** | **~6.0/10** | **+0.9** |
