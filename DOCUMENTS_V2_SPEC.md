# Documents V2 Specification — MimoNotes

**Date:** June 14, 2026  
**Status:** Design spec — no implementation  
**Based on:** DOCUMENTS_UX_AUDIT.md (score 5.1/10)  
**Target score:** 7.5/10

---

## Design Principles

1. **Content-first** — Show document content, not implementation details (chunks)
2. **Progressive disclosure** — Summary → Details → Actions
3. **Zero-config upload** — Drop file → done. No stages, no jargon.
4. **Action-oriented** — Every screen should help the user do something with their documents
5. **Accessible** — WCAG 2.1 AA compliant

---

## V2 Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Upload Flow                                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Drop zone (full width, animated)                    │ │
│ │ [File Upload] [URL Import] tabs                     │ │
│ │ Progress bar (single, not 5-stage)                  │ │
│ │ "Selesai! Lihat dokumen →"                          │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Document Library                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Search + Filters + View toggle (table/grid/list)    │ │
│ │ [Select All] [Bulk Delete] [Add to Folder]         │ │
│ │ ┌───────────────────────────────────────────────┐   │ │
│ │ │ 📄 Doc Title    PDF  ✅ Ready  12 chunks  3d  │   │ │
│ │ │ 📝 Doc Title    DOCX ⏳ Proc   — chunks   1d  │   │ │
│ │ │ 🔗 Web Page     URL  ✅ Ready  5 chunks   2h  │   │ │
│ │ └───────────────────────────────────────────────┘   │ │
│ │ Pagination                                          │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Document Detail (Split View)                             │
│ ┌────────────────────────┬────────────────────────────┐ │
│ │ Preview Pane           │ Info + Actions Panel       │ │
│ │ (PDF/DOCX/Image)       │ Type, Status, Chunks       │ │
│ │                        │ Created, Updated            │ │
│ │                        │ [Tanya tentang ini]        │ │
│ │                        │ [Cari Similar]             │ │
│ │                        │ [Hapus]                    │ │
│ ├────────────────────────┤                            │ │
│ │ Chunks (collapsed)     │                            │ │
│ │ Chunk #1...            │                            │ │
│ │ Chunk #2...            │                            │ │
│ └────────────────────────┴────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Upload Flow (REDESIGN)

**Purpose:** Zero-config, instant upload with clear feedback.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Upload Dokumen                                    [×]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │          📤 Drop file here or click              │   │
│  │                                                 │   │
│  │  PDF, DOCX, TXT, CSV, XLSX, PNG, JPG, WEBP    │   │
│  │  Max 100MB                                      │   │
│  │                                                 │   │
│  │  [Select Files]                                 │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─── or ───                                             │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔗 Import from URL                              │   │
│  │ https://example.com/article                     │   │
│  │ [Import URL]                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Upload Progress (when active):                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📄 Q3_Report.pdf                 72% ████░░░░  │   │
│  │ 📝 API_Docs.docx                 100% ████████ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Spec:**
- Modal/overlay or inline (not separate page)
- Single progress bar per file (not 5-stage pipeline)
- Progress: bytes uploaded / total bytes
- On complete: "Selesai! [Lihat dokumen →]"
- Remove hardcoded demo data
- Remove "Ingest Information" jargon
- Accessibility: `aria-live="polite"` for progress

---

### 2. Document Library (ENHANCED)

**Purpose:** Organize, find, and act on documents.

**Layout (Table View):**
```
┌─────────────────────────────────────────────────────────┐
│ Documents                              [Upload Dokumen] │
├─────────────────────────────────────────────────────────┤
│ Total: 12 docs · 1,247 chunks · 83% ready              │
├─────────────────────────────────────────────────────────┤
│ [All] [Ready] [Processing] [Failed]                     │
├─────────────────────────────────────────────────────────┤
│ 🔍 Search documents...          [Type ▾] [Sort ▾]      │
├─────────────────────────────────────────────────────────┤
│ ☐ Select All        [Bulk Delete] [Add to Folder]      │
├─────┬──────────────┬──────┬────────┬────────┬──────────┤
│ ☐   │ Name         │ Type │ Status │ Chunks │ Uploaded │
├─────┼──────────────┼──────┼────────┼────────┼──────────┤
│ ☐   │ 📄 RAG Paper │ PDF  │ ✅ Ready│ 12     │ 3d ago   │
│ ☐   │ 📝 API Docs  │ DOCX │ ⏳ Proc │ —      │ 1d ago   │
│ ☐   │ 🔗 Website   │ URL  │ ✅ Ready│ 5      │ 2h ago   │
├─────┴──────────────┴──────┴────────┴────────┴──────────┤
│ Showing 1-10 of 12                 < 1 2 >              │
└─────────────────────────────────────────────────────────┘
```

**Spec:**
- Add checkbox column for multi-select
- Add "Select All" checkbox in header
- Add bulk action bar (appears when items selected)
- Status badges with icons: ✅ Ready, ⏳ Processing, ❌ Failed
- Add "Last accessed" column (optional)
- Add "Used in N chats" column (optional)
- Accessibility: `role="grid"`, keyboard navigation

---

### 3. Document Detail (SPLIT VIEW)

**Purpose:** Preview document content + manage metadata + quick actions.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ← Back   📄 RAG_Paper.pdf   PDF · ✅ Ready             │
├─────────────────────────────────┬───────────────────────┤
│                                 │ Document Info          │
│                                 │ Type: PDF              │
│   [Document Preview]            │ Status: ✅ Ready       │
│   (PDF viewer / image /         │ Chunks: 12             │
│    text rendering)              │ Uploaded: 3d ago       │
│                                 │ Updated: 1d ago        │
│                                 │                        │
│                                 │ Quick Actions          │
│                                 │ [💬 Tanya tentang ini] │
│                                 │ [🔍 Cari Similar]      │
│                                 │ [✏️ Edit Info]         │
│                                 │ [🗑️ Hapus]            │
│                                 │                        │
│                                 │ Description            │
│                                 │ (editable)             │
│                                 │ "Laporan analisis Q3..."│
├─────────────────────────────────┴───────────────────────┤
│ Chunks (12)                              [Expand All]    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Chunk #1 — 245 chars                    [Expand]   │ │
│ │ "RAG (Retrieval-Augmented Generation) is a..."     │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ Chunk #2 — 312 chars                    [Expand]   │ │
│ │ "The retrieval component works by..."              │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Spec:**
- 60/40 split on desktop (preview/info), stack on mobile
- Preview pane: PDF.js for PDF, img for images, `<pre>` for text
- "Tanya tentang ini" button → `/chat?doc=[id]` (pre-loads document context)
- Description field: editable, saved to `document.description`
- Chunks section: collapsed by default, expandable
- Accessibility: `role="article"`, skip links, aria labels

---

### 4. Processing States (SIMPLIFIED)

**Purpose:** Clear, non-technical progress feedback.

**Layout (during processing):**
```
┌─────────────────────────────────────────────────────────┐
│ 📄 Q3_Financial_Analysis.pdf                            │
│ ████████████████████░░░░░░░░  72%                       │
│ Memproses... (est. 15 detik lagi)                        │
│                                                         │
│ [Batalkan]                                              │
└─────────────────────────────────────────────────────────┘
```

**Layout (complete):**
```
┌─────────────────────────────────────────────────────────┐
│ ✅ Q3_Financial_Analysis.pdf                            │
│ Selesai! 12 chunks siap digunakan.                      │
│ [Lihat dokumen →] [Mulai chat →]                        │
└─────────────────────────────────────────────────────────┘
```

**Layout (failed):**
```
┌─────────────────────────────────────────────────────────┐
│ ❌ Q3_Financial_Analysis.pdf                            │
│ Gagal diproses. File mungkin rusak atau format tidak    │
│ didukung.                                               │
│ [Coba Lagi] [Hapus]                                     │
└─────────────────────────────────────────────────────────┘
```

**Spec:**
- Single progress bar (not 5-stage pipeline)
- Estimated time remaining (based on file size)
- "Batalkan" button during processing
- "Coba Lagi" button on failure
- "Mulai chat" shortcut on completion
- Remove technical labels: "Parse", "Chunk", "Embed", "Store"

---

### 5. Empty States (GUIDED)

**Purpose:** Guide new users to take action.

**Layout (no documents):**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              📚                                       │
│                                                         │
│       Belum ada dokumen di knowledge base Anda.         │
│                                                         │
│   Upload dokumen untuk mulai menggunakan AI chatbot.    │
│   PDF, DOCX, TXT, CSV, atau URL website.               │
│                                                         │
│   [Upload Dokumen Pertama]                              │
│                                                         │
│   Atau coba:                                            │
│   • Import halaman web dari URL                         │
│   • Upload PDF laporan                                  │
│   • Upload dokumen teks                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Spec:**
- Illustration (bookshelf or document stack)
- Clear CTA button
- Example use cases
- Link to sample document (optional)

---

### 6. Bulk Actions

**Purpose:** Efficiently manage multiple documents.

**Layout (when items selected):**
```
┌─────────────────────────────────────────────────────────┐
│ ☑ 3 dokumen dipilih          [Hapus] [Ekspor] [Folder] │
└─────────────────────────────────────────────────────────┘
```

**Spec:**
- Checkbox column in table view
- "Select All" checkbox in header
- Bulk action bar appears at bottom when items selected
- Actions: Delete, Export, Add to Folder, Re-process
- Confirmation dialog for destructive actions

---

### 7. Folder/Category System

**Purpose:** Organize documents by project or topic.

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Documents                              [Upload Dokumen] │
├──────────┬──────────────────────────────────────────────┤
│ Folders  │                                              │
│          │ 📁 Semua (12)                               │
│ 📁 All   │ 📁 Proyek A (5)                            │
│ 📁 Proj A│ 📁 Proyek B (3)                            │
│ 📁 Proj B│ 📁 tanpa folder (4)                         │
│ 📁 Proj C│                                              │
│          │ ☐ RAG Paper.pdf                             │
│ [+ Folder]│ ☐ API Docs.docx                           │
│          │ ☐ Website.md                                │
└──────────┴──────────────────────────────────────────────┘
```

**Spec:**
- Sidebar with folder list
- Folder count badges
- "Tanpa folder" default folder
- Drag-and-drop to organize
- Create/rename/delete folders

---

## Responsive Behavior

### Desktop (≥1024px)
```
┌─────────────────────────────────────────────────────────┐
│ Library: Table view with checkboxes + bulk actions      │
│ Detail: Split view (preview 60% + info 40%)             │
│ Upload: Inline drop zone + progress                     │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768-1023px)
```
┌─────────────────────────────────────────────────────────┐
│ Library: Grid view (2 columns)                          │
│ Detail: Stacked (preview on top, info below)            │
│ Upload: Full-width drop zone                            │
└─────────────────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────────────────────────────────────┐
│ Library: List view with swipe actions                   │
│ Detail: Full-width preview + bottom sheet for actions   │
│ Upload: Full-width drop zone + file picker              │
└─────────────────────────────────────────────────────────┘
```

---

## Accessibility Requirements

1. **Skip-to-content** — `<a href="#main-content" class="sr-only">Lewati ke konten</a>`
2. **aria-live="polite"** — On upload progress, processing status
3. **role="grid"** — On document table with keyboard navigation
4. **Keyboard shortcuts** — Delete (Del), Select (Space), Open (Enter)
5. **Focus indicators** — `focus-visible:ring-2` on all interactive elements
6. **Screen reader announcements** — Upload complete, delete confirmed, bulk action done
7. **Color + icon** — Status badges use both color and icon

---

## Migration Path

### Phase 1: Quick Wins (1 day)
- Remove demo data from upload queue
- Fix title "Ingest Information" → "Upload Dokumen"
- Add "Tanya tentang dokumen ini" button
- Add skip-to-content
- Add status icons to badges
- Fix empty states

### Phase 2: Upload + Processing (2 days)
- Redesign upload flow (single progress bar)
- Simplify processing states
- Add retry on failure
- Add notification on complete
- Add cancel processing

### Phase 3: Library + Detail (3 days)
- Add bulk actions (multi-select, bulk delete)
- Add document description field
- Add split-view detail page
- Add document preview rendering
- Add folder/category system

### Phase 4: Search + Polish (2 days)
- AI-powered document search
- Search suggestions + history
- Mobile optimizations
- Keyboard shortcuts
- Accessibility audit

---

## Component File Structure

```
components/documents/
├── upload-zone.tsx              (REDESIGN — single progress bar)
├── upload-progress.tsx          (NEW — per-file progress)
├── document-table.tsx           (ENHANCED — checkboxes, bulk actions)
├── document-grid.tsx            (ENHANCED — better previews)
├── document-detail-split.tsx    (NEW — split view layout)
├── document-preview.tsx         (NEW — PDF/image/text rendering)
├── document-info-panel.tsx      (NEW — metadata + actions)
├── bulk-actions-bar.tsx         (NEW — multi-select actions)
├── folder-sidebar.tsx           (NEW — folder navigation)
├── processing-card.tsx          (SIMPLIFIED — single progress)
├── empty-state-documents.tsx    (REDESIGNED — illustration + CTA)
└── document-description.tsx     (NEW — editable description)

app/(admin)/documents/
├── upload/page.tsx              (MODIFIED — use new UploadZone)
└── [id]/page.tsx                (MODIFIED — use split view)

app/knowledge/documents/
├── page.tsx                     (MODIFIED — use new DocumentTable)
└── [id]/page.tsx                (MODIFIED — use split view)
```

---

## Summary

| Metric | V1 (Current) | V2 (Target) |
|--------|-------------|-------------|
| Score | 5.1/10 | 7.5/10 |
| Upload flow | Demo data + jargon | Clean + progress |
| Document preview | ❌ Chunks only | ✅ PDF/image/text |
| Bulk actions | ❌ None | ✅ Multi-select + bulk |
| Organization | Flat list | Folders + categories |
| Search | Chunk-level | AI-powered |
| Processing | 5-stage pipeline | Simple progress bar |
| Empty states | Emoji + text | Illustration + onboarding |
| Mobile | Table overflow | Optimized cards |
| Accessibility | Low | WCAG 2.1 AA |
| Components | 2 | 12 |
