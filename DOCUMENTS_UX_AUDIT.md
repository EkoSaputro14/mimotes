# Documents UX Audit — MimoNotes

**Date:** June 14, 2026  
**Auditor:** Senior Frontend Architect + UX Engineer  
**Scope:** Upload flow, Document library, Document detail, Chunks, Search  
**Status:** Read-only audit — no code changes

---

## Current Score: 5.1 / 10

The document system is functional and feature-rich (table/grid views, filtering, chunk viewer, similarity search). However, it feels like a developer tool, not a product. The upload flow has hardcoded demo data, there are no bulk actions, and the document detail page shows raw chunks instead of document content.

---

## 1. Upload Flow

### Score: 4/10

**Issues:**
1. **Hardcoded demo data** — Queue shows 3 fake items ("Q3_Financial_Analysis.pdf", "Client_Dataset_v2.xlsx", "Architecture_Overview.txt") on every page load. Users see processing pipeline for files they never uploaded.
2. **Jargon title** — "Ingest Information" is technical. Users think "Upload" or "Add documents."
3. **No upload progress** — File upload shows "Uploading..." but no percentage or byte count.
4. **No retry on failure** — Failed uploads just show toast error. No "Retry" button.
5. **No file size validation** — Client doesn't check file size before uploading. Server rejects after transfer.
6. **No content preview** — After upload, user can't see what was extracted until they visit document detail.
7. **URL import has no feedback** — No preview of what the URL contains before importing.
8. **Processing queue always visible** — Even when empty, the "Processing Queue" section takes space.

**Comparison:**
- **ChatPDF**: Drag PDF → instant preview → start asking questions. Zero configuration.
- **Notion**: Upload → automatic parsing → content appears in workspace immediately.
- **Google Drive**: Upload → thumbnail preview → organize into folders.

---

## 2. Document Library

### Score: 5/10

**Issues:**
9. **No bulk actions** — Can't select multiple documents for delete, export, or categorize. One-by-one only.
10. **No folder/category organization** — All documents in flat list. No way to group by project, topic, or date.
11. **No document preview** — Grid view shows emoji icon, not actual content preview or thumbnail.
12. **No document description/notes** — Can't add context to documents ("This is the Q3 financial report for...").
13. **No "used in chat" tracking** — Can't see which documents are actually being used by the AI.
14. **No last accessed date** — Only shows creation date, not when user last viewed/used it.
15. **Status badges are color-only** — "Ready" (green), "Processing" (amber), "Failed" (red) — no icons for colorblind users.
16. **Overview stats are generic** — "PDF Ratio" and "Image Assets" aren't actionable. Users care about "documents ready for chat."

**Comparison:**
- **Notion**: Pages with previews, icons, covers, nested sub-pages, last edited date, used by count.
- **Dropbox**: File previews, thumbnails, shared links, version history, activity log.
- **Google Drive**: Grid/list views, thumbnails, "Recent" filter, "Shared with me", star/folder organization.

---

## 3. Document Detail Page

### Score: 4/10

**Issues:**
17. **No document preview/rendering** — Can't view PDF content, DOCX rendering, or image display. Only shows raw chunks.
18. **Chunk viewer is the main content** — Users see "Chunk #1", "Chunk #2" — technical implementation detail.
19. **No document metadata editing** — Can't rename, add description, or tag documents after upload.
20. **No version history** — If user uploads updated version, old one is just replaced. No diff or rollback.
21. **No "ask about this document" shortcut** — No button to start a chat pre-loaded with this document's context.
22. **Processing state shows spinner** — No estimated time, no progress, no way to cancel.
23. **Failed state has no retry** — Just says "Try uploading again" with no button.

**Comparison:**
- **ChatPDF**: Document preview on left, chat on right. Can see content while asking questions.
- **Notion**: Full page rendering with embedded content, comments, mentions.
- **Google Drive**: Full preview viewer with zoom, download, share, comment.

---

## 4. Search Experience

### Score: 4/10

**Issues:**
24. **Similarity search is separate** — `/knowledge/search` is a debugging tool, not a user-facing search.
25. **No full-text search across documents** — Can search chunks, but not document titles/content as a whole.
26. **No search suggestions** — Type-ahead or autocomplete from document titles.
27. **No search history** — Previous searches not saved.
28. **No search results preview** — Results show chunk text but no document context.
29. **Search is chunk-centric** — Users think in documents, not chunks.

**Comparison:**
- **Notion**: Full-text search with filters, recent searches, AI-powered suggestions.
- **Google Drive**: Search with type filters, owner filters, date ranges, "Did you mean?" suggestions.
- **Dropbox**: Search with file type, date, person filters, preview cards in results.

---

## 5. Empty States

### Score: 3/10

**Issues:**
30. **Emoji + text only** — "📄 Belum ada dokumen" with no illustration or guided next step.
31. **No onboarding** — New users see empty list with no guidance on what to upload or why.
32. **No suggestions** — No "Try uploading a PDF" or "Import a website URL" with examples.
33. **No sample document** — No option to load a demo document to explore features.

**Comparison:**
- **ChatPDF**: "Drop a PDF here to get started" with animated drop zone.
- **Notion**: Template gallery with "Getting Started" page pre-loaded.
- **Google Drive**: "No files in this folder" with "New" button prominent.

---

## 6. Processing States

### Score: 4/10

**Issues:**
34. **5-stage pipeline is complex** — Upload → Parse → Chunk → Embed → Store. Users don't understand "Embed" or "Store."
35. **No estimated time** — Processing could take 5 seconds or 5 minutes. No indication.
36. **No notification on complete** — User must manually refresh or check the list.
37. **No cancel processing** — Once started, can't stop a long-running process.
38. **Demo data shows pipeline** — The hardcoded demo items show the pipeline, which is confusing.

---

## 7. Bulk Actions

### Score: 1/10

**Issues:**
39. **No multi-select** — No checkboxes, no "select all" button.
40. **No bulk delete** — Must delete one by one with individual confirmation dialogs.
41. **No bulk export** — Can't download multiple documents at once.
42. **No bulk categorize** — Can't tag or organize multiple documents.
43. **No bulk re-process** — Can't re-embed multiple documents with updated settings.

---

## 8. Mobile UX

### Score: 4/10

**Issues:**
44. **Table view unusable on mobile** — Horizontal scroll, tiny text, hidden columns.
45. **Grid view is better but not optimized** — Cards are full-width, no swipe gestures.
46. **Upload form is mobile-friendly** — Drag-and-drop works, but file picker is better.
47. **Chunk viewer is dense on mobile** — Action buttons are small, text is cramped.
48. **No bottom sheet for actions** — Delete/preview actions need bottom sheet on mobile.

---

## 9. Accessibility

### Score: 3/10

**Issues:**
49. **No skip links** — Document pages have no skip-to-content.
50. **No aria-live for processing** — Screen readers don't announce when upload completes.
51. **No keyboard navigation for table** — Can't arrow through rows, no keyboard shortcuts.
52. **No focus indicators on table rows** — Rows are clickable but not focusable.
53. **Status badges are color-only** — No text alternative for colorblind users.
54. **Delete confirmation uses `window.confirm`** — Not accessible, not styled.

---

## 10. Competitive Comparison

| Dimension | MimoNotes | ChatPDF | Notion | Dropbox | Google Drive |
|-----------|-----------|---------|--------|---------|--------------|
| **Upload speed** | Medium | Instant | Fast | Fast | Fast |
| **Content preview** | ❌ Chunks only | ✅ Full PDF | ✅ Full page | ✅ Thumbnail | ✅ Full preview |
| **Organization** | Flat list | Flat | Nested pages | Folders | Folders + stars |
| **Search** | Chunk-level | AI-powered | Full-text | Full-text | Full-text + filters |
| **Bulk actions** | None | None | ✅ Multi-select | ✅ Multi-select | ✅ Multi-select |
| **Mobile** | Basic | Good | Good | Good | Good |
| **Accessibility** | Low | Low | Medium | Medium | High |
| **Score** | 5.1/10 | 7.0/10 | 8.5/10 | 8.0/10 | 9.0/10 |

---

## 11. Top 20 UX Issues (Ranked by Impact)

| # | Issue | Severity | Category | Effort |
|---|-------|----------|----------|--------|
| 1 | Hardcoded demo data in upload queue | Critical | Upload | Quick win |
| 2 | No document preview/rendering | High | Detail | Full redesign |
| 3 | Chunk viewer as main content (not doc preview) | High | Detail | Full redesign |
| 4 | No bulk actions (select, delete, export) | High | Library | Medium |
| 5 | No "ask about this document" shortcut | High | Detail | Quick win |
| 6 | Jargon title "Ingest Information" | High | Upload | Quick win |
| 7 | No folder/category organization | High | Library | Medium |
| 8 | No document description/notes | Medium | Library | Medium |
| 9 | No upload progress percentage | Medium | Upload | Medium |
| 10 | No retry on failed upload/processing | Medium | Upload | Quick win |
| 11 | No notification when processing complete | Medium | Processing | Medium |
| 12 | No estimated processing time | Medium | Processing | Medium |
| 13 | 5-stage pipeline too technical | Medium | Processing | Quick win |
| 14 | Similarity search is debugging tool, not user search | Medium | Search | Medium |
| 15 | No skip links on document pages | Medium | Accessibility | Quick win |
| 16 | No aria-live for processing status | Medium | Accessibility | Quick win |
| 17 | Table view unusable on mobile | Medium | Mobile | Medium |
| 18 | Status badges color-only (no icons) | Low | Accessibility | Quick win |
| 19 | Empty states are emoji + text only | Low | Empty states | Quick win |
| 20 | No "used in chat" tracking | Low | Library | Medium |

---

## 12. Quick Wins (< 1 hour each)

1. **Remove demo data from upload queue** — Delete hardcoded queue items
2. **Fix title** — "Ingest Information" → "Upload Dokumen"
3. **Add "Tanya tentang dokumen ini" button** — Link to chat with document context
4. **Add skip-to-content** — Same pattern as dashboard/chat
5. **Add aria-live to processing status** — Announce upload complete
6. **Add retry button on failed uploads** — Re-trigger upload
7. **Fix empty states** — Better copy + CTA button
8. **Add status icons to badges** — ✅ Ready, ⏳ Processing, ❌ Failed

---

## 13. Medium Wins (< 1 day each)

1. **Add upload progress** — Show bytes uploaded / total bytes
2. **Add document description field** — Editable after upload
3. **Add estimated processing time** — Based on file size/type
4. **Add notification on processing complete** — Toast or bell notification
5. **Add "Ask about this" button** — Start chat pre-loaded with document
6. **Simplify processing pipeline** — Show "Processing..." instead of 5 stages
7. **Add folder/category system** — Tag documents by project/topic
8. **Add mobile bottom sheet** — For document actions on mobile

---

## 14. Full Redesign Opportunities

1. **Document preview rendering** — Show PDF content, DOCX rendering, image display
2. **Split-view detail page** — Preview on left, chunks/metadata on right (like ChatPDF)
3. **AI-powered search** — Natural language search across documents
4. **Version history** — Track document changes, diff between versions
5. **Collaborative features** — Comments, mentions, shared documents
6. **Smart organization** — AI-suggested folders, auto-tagging
7. **Document analytics** — Which documents are used most, which questions are asked
8. **Batch upload with progress** — Upload 10 files with individual progress bars

---

## 15. Screens Requiring Redesign

| Screen | Current State | Required Change |
|--------|--------------|-----------------|
| Upload page | Demo data + jargon | Clean upload with progress |
| Document library | Flat list, no bulk | Folders + multi-select + preview |
| Document detail | Chunk viewer only | Document preview + split view |
| Search | Chunk-level debugging | AI-powered document search |
| Empty states | Emoji + text | Illustration + onboarding |
| Processing | 5-stage pipeline | Simple progress bar |
| Mobile | Table overflow | Optimized cards + bottom sheet |

---

## Summary

| Dimension | Score | Key Fix |
|-----------|-------|---------|
| Upload flow | 4/10 | Remove demo data + add progress |
| Document library | 5/10 | Add bulk actions + folders |
| Document detail | 4/10 | Add document preview |
| Search | 4/10 | AI-powered search |
| Empty states | 3/10 | Illustration + onboarding |
| Processing | 4/10 | Simplify pipeline |
| Bulk actions | 1/10 | Add multi-select |
| Mobile | 4/10 | Optimized cards |
| Accessibility | 3/10 | Skip links + aria-live |
| **Overall** | **5.1/10** | |

**Highest ROI fixes:** Remove demo data + add document preview + add "Ask about this" button (3 fixes that immediately raise the score to ~7/10).
