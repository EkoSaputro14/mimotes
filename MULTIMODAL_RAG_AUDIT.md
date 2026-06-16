# Multimodal RAG — Implementation Audit

**Date:** June 8, 2026
**Method:** Read-only code review + database verification
**Verdict:** ⚠️ **NOT PRODUCTION READY** — Migration never applied, runtime SQL errors

---

## Executive Summary

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 1 | Database migration applied | ❌ **NOT APPLIED** | DB has 9 columns, needs 14 |
| 2 | Prisma schema matches DB | ❌ **MISMATCH** | Schema missing 5 fields |
| 3 | OCR pipeline executes | ⚠️ **CODE EXISTS** | Will fail at runtime (missing columns) |
| 4 | Vision caption executes | ⚠️ **CODE EXISTS** | Will fail at runtime (missing columns) |
| 5 | Image chunks stored | ❌ **BROKEN** | INSERT references non-existent columns |
| 6 | Embeddings generated | ⚠️ **CODE EXISTS** | Never reached (INSERT fails first) |
| 7 | Image chunks retrieved | ❌ **BROKEN** | SELECT references non-existent columns |
| 8 | buildMultimodalContext used | ✅ **Implemented** | Dead `buildContext()` still exists |
| 9 | Dashboard renders | ❌ **WILL FAIL** | API queries non-existent columns |
| 10 | No dead code | ❌ **3 dead items** | See below |

---

## 1. Database Migration NOT Applied

### Evidence

```
docker exec mimotes-db-1 psql -U mimotes -d mimotes -c "\d document_chunks"
```

**Result:** 9 columns only:
```
id, document_id, content, embedding, chunk_index, metadata, created_at, tenant_id, workspace_id
```

**Missing columns:**
- `chunk_type` (VARCHAR)
- `ocr_text` (TEXT)
- `caption` (TEXT)
- `image_summary` (TEXT)
- `image_url` (TEXT)

### Migration file exists but was never run:
```
prisma/migrations/20260607_multimodal_rags/migration.sql
```

### ❌ CRITICAL: Will cause runtime SQL errors

The `processImageDocument()` function in `app/api/upload/route.ts` does:
```sql
INSERT INTO document_chunks (... chunk_type, ocr_text, caption, image_summary, image_url ...)
```
**These columns don't exist → SQL error → image upload fails silently.**

---

## 2. Prisma Schema NOT Updated

### Evidence

```bash
grep -A25 'model DocumentChunk' prisma/schema.prisma
```

**Result:** Schema has only 9 fields. No `chunkType`, `ocrText`, `caption`, `imageSummary`, `imageUrl`.

### Impact
- Prisma client doesn't know about multimodal fields
- Code uses raw SQL to work around this (fragile)
- No type safety for multimodal data

---

## 3. OCR Pipeline — Code Exists, Not Executable

### Evidence: `lib/rag/image-processor.ts`

```typescript
async function runOCR(imagePath: string): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const worker = await Tesseract.createWorker("ind+eng");
  const result = await worker.recognize(imagePath);
  await worker.terminate();
  return result.data.text.trim();
}
```

**Status:** ⚠️ Code is correct but:
- tesseract.js IS installed (`package.json` confirms `"tesseract.js": "^7.0.0"`)
- Will execute IF the image file exists
- **BUT: The result never gets stored (see #5)**

---

## 4. Vision Caption — Code Exists, Not Executable

### Evidence: `lib/rag/image-processor.ts`

```typescript
async function generateVisionCaption(dataUrl: string) {
  const openai = await getAIProvider();
  const completion = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: [
      { type: "text", text: "Analyze this image..." },
      { type: "image_url", image_url: { url: dataUrl } }
    ]}],
  });
  // Parse Caption: and Summary: from response
}
```

**Status:** ⚠️ Code is correct but:
- Depends on AI provider supporting vision (not all do)
- Fallback: returns generic caption on failure
- **BUT: Result never gets stored (see #5)**

---

## 5. Image Chunks Storage — BROKEN

### Evidence: `app/api/upload/route.ts` lines 241-280

```typescript
async function processImageDocument(...) {
  const { ocrText, caption, summary } = await processImage(imagePath);
  const embedding = await generateEmbeddings([embeddingText]);
  
  await prisma.$executeRaw`
    INSERT INTO document_chunks (...
      chunk_type, ocr_text, caption, image_summary, image_url, ...)
    VALUES (...
      'image', ${ocrText}, ${caption}, ${summary}, ${fileUrl}, ...)
  `;
}
```

### ❌ CRITICAL: This INSERT will fail

The columns `chunk_type`, `ocr_text`, `caption`, `image_summary`, `image_url` **do not exist** in the database.

**Error:** `column "chunk_type" of relation "document_chunks" does not exist`

**Impact:** Image uploads will fail with 500 error.

---

## 6. Embeddings for Image Chunks — Code Exists, Never Reached

### Evidence: `app/api/upload/route.ts`

```typescript
const embeddingText = [caption, summary, ocrText].filter(Boolean).join("\n\n");
const embedding = await generateEmbeddings([embeddingText || "Image content"]);
```

**Status:** ⚠️ Code is correct:
- Uses caption + summary + ocrText for embedding (not raw OCR)
- `generateEmbeddings()` will produce 1536-dim vector
- **BUT: Never reached because the INSERT in step #5 fails first**

---

## 7. Image Chunks Retrieval — BROKEN

### Evidence: `lib/rag/vectorstore.ts` lines 100-120

```sql
SELECT
  dc.id, dc.content, dc.document_id, d.title as document_title,
  dc.workspace_id, 1 - (dc.embedding <=> ...) as similarity,
  dc.chunk_index, dc.metadata,
  dc.chunk_type, dc.ocr_text, dc.caption, dc.image_summary, dc.image_url
FROM document_chunks dc
JOIN documents d ON d.id = dc.document_id
WHERE dc.workspace_id = ${workspaceId} AND dc.embedding IS NOT NULL
```

### ❌ CRITICAL: This SELECT will fail

The columns `dc.chunk_type`, `dc.ocr_text`, `dc.caption`, `dc.image_summary`, `dc.image_url` **do not exist** in the database.

**Impact:** Chat retrieval will fail with 500 error for ALL queries (not just image queries).

---

## 8. buildMultimodalContext() — ✅ Implemented

### Evidence: `lib/rag/chain.ts` lines 99, 168

```typescript
const { context } = buildMultimodalContext(similarChunks, maxContextTokens);
```

**Status:** ✅ Correctly used in both `generateRAGResponse()` and `streamRAGResponse()`.

### Dead code: `buildContext()` still exists (lines 39-68)

The old `buildContext()` function is never called. It's dead code.

---

## 9. Dashboard — Will Fail

### Evidence: `app/api/knowledge/images/route.ts`

```sql
SELECT d.id, d.title, d.file_type, d.file_url, d.status,
  dc.ocr_text, dc.caption, dc.image_summary, dc.image_url
FROM documents d
LEFT JOIN document_chunks dc ON dc.document_id = d.id
WHERE d.user_id = ${userId} AND d.file_type IN ('png', 'jpg', 'jpeg', 'webp', 'image')
```

### ❌ This query references non-existent columns

`dc.ocr_text`, `dc.caption`, `dc.image_summary`, `dc.image_url` don't exist.

**Impact:** `/knowledge/images` page will show 500 error.

---

## 10. Dead Code (3 items)

| Item | Location | Status |
|------|----------|--------|
| `buildContext()` | `lib/rag/chain.ts:39-68` | Dead — never called, replaced by `buildMultimodalContext()` |
| `isImageFile()` | Imported in `app/api/upload/route.ts:11` | Imported but never used in the route |
| `parseImage()` | Imported in `app/api/upload/route.ts:12` | Imported but never used in the route |

---

## Root Cause Analysis

The subagent created the migration file but **never ran `npx prisma migrate dev`** to apply it. The code was written against a schema that doesn't exist in the database.

---

## Required Fixes (Priority Order)

| # | Fix | Severity | Effort |
|---|-----|----------|--------|
| 1 | **Run migration:** `npx prisma migrate dev --name multimodal_rag` | 🔴 Critical | 2 min |
| 2 | **Update Prisma schema** — add 5 fields to DocumentChunk model | 🔴 Critical | 5 min |
| 3 | **Remove dead `buildContext()`** from chain.ts | 🟡 Cleanup | 1 min |
| 4 | **Remove unused imports** from upload route | 🟡 Cleanup | 1 min |
| 5 | **Test image upload** — verify end-to-end works after migration | 🔴 Critical | 5 min |

---

## Verdict

**⚠️ NOT PRODUCTION READY**

The implementation is architecturally sound and the code is well-structured, but it cannot function because:
1. The database migration was never applied
2. The Prisma schema was never updated
3. Every SQL query that touches multimodal columns will fail

**Estimated fix time: 15 minutes** (run migration + update schema + cleanup dead code)

---

*Audit generated by Hermes Agent — Multimodal RAG Implementation Audit*
