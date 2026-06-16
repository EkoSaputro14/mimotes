# Documents E2 — Before & After

**Sprint:** Documents V2 — Phase 2 (Core Redesign)

---

## Document Detail Page

### Before
- Chunk-centric layout: 1-column sidebar (info) + 3-column chunk viewer
- No document content preview — only raw chunks
- No description field
- Chunks always visible, taking up most of the page
- Processing: spinner with "Document is being processed..."
- Failed: static error message with no retry

### After
- **Split view:** 60% preview (left) + 40% info panel (right)
- **Document preview:** PDF iframe, image display, text rendering, download for DOCX
- **Editable description:** Click to add/edit, 500 char limit, save/cancel
- **Collapsible chunks:** Hidden by default, expand on click
- **Auto-refresh:** Processing documents poll every 5s for status updates
- **Quick actions:** "Cari Chunk Serupa" + "Lihat Semua Chunk" buttons

---

## Upload Flow

### Before
- Used `fetch()` — no progress tracking
- Queue showed "Uploading..." / "Processing..." text only
- 5-stage pipeline: Upload → Parse → Chunk → Embed → Store
- Each stage had individual circle indicators with connector lines
- Queue title: "Processing Queue"
- Active badge: "X active processes"

### After
- **XHR upload** with real-time progress bar
- **Percentage display:** "72%" next to file name
- **Bytes text:** "Mengupload 2.5 MB dari 5.0 MB"
- **Single progress bar** — no 5-stage pipeline
- **Status polling:** After upload, polls document API until ready/failed
- Queue title: "Antrian Upload"
- Active badge: "X sedang diproses"

---

## Schema

### Before
```
Document {
  id, userId, workspaceId, title, fileType, fileUrl,
  status, chunkCount, createdAt, updatedAt
}
```

### After
```
Document {
  id, userId, workspaceId, title, fileType, fileUrl,
  status, chunkCount, description, createdAt, updatedAt
}
```

---

## API

### Before
- `GET /api/documents/:id` — read document
- `DELETE /api/documents/:id` — delete document

### After
- `GET /api/documents/:id` — read document (includes description)
- `DELETE /api/documents/:id` — delete document
- **`PATCH /api/documents/:id`** — update description (new)

---

## Score Impact

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Upload flow | 5/10 | 7/10 | +2 |
| Document detail | 5.5/10 | 7.5/10 | +2 |
| Empty states | 5/10 | 5/10 | — |
| Accessibility | 5/10 | 5.5/10 | +0.5 |
| **Overall** | **~6.0/10** | **~7.0/10** | **+1.0** |
