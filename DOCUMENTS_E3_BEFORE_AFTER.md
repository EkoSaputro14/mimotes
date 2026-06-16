# Documents E3 — Before & After

**Sprint:** Documents V2 — Phase 3 (Power Features)

---

## Bulk Actions

### Before
- One-by-one delete only
- No multi-select capability
- No bulk operations
- No checkboxes on documents

### After
- Checkbox column on every document (table + grid view)
- "Select All" checkbox in table header
- Bulk action bar: "N dokumen dipilih | Hapus (N) | Batal"
- Single API call for bulk delete
- Selection auto-clears on page/filter/sort change

---

## Folder System

### Before
- All documents in flat list
- No organization or grouping
- No way to categorize documents

### After
- Folder sidebar (240px left panel, hidden on mobile)
- "Semua Dokumen" default view
- Create folder: inline input + "+" button
- Rename folder: double-click inline edit
- Delete folder: confirmation + auto-unsets documents
- Document counts per folder
- Bulk move documents to folder
- Unique constraint: folder names unique per workspace

---

## Search

### Before
- Basic search input matching title only
- No search history
- No suggestions

### After
- Search matches title AND description (OR query)
- "Pencarian Terakhir" dropdown (localStorage, max 10)
- "Hapus Riwayat" button to clear history
- Suggestions appear on input focus

---

## Mobile

### Before
- Table view on all screens (overflow on mobile)
- Small touch targets
- No quick upload action
- Inline actions only

### After
- Defaults to grid view on mobile (< 768px)
- Larger touch targets (min 44px)
- Table hides Chunks/Uploaded columns on mobile
- Floating action button (FAB) for quick upload
- Bottom sheet for document actions (View/Move/Delete)
- Folder sidebar hidden on mobile

---

## Score Impact

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Bulk actions | 1/10 | 7/10 | +6 |
| Organization | 3/10 | 7/10 | +4 |
| Search | 4/10 | 6/10 | +2 |
| Mobile | 4/10 | 7/10 | +3 |
| **Overall** | **~7.0/10** | **~8.0/10** | **+1.0** |
