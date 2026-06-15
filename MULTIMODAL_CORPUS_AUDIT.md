# MULTIMODAL CORPUS AUDIT

**Date:** June 8, 2026  
**Status:** 🔴 NOT READY for production benchmark

---

## 1. Corpus Overview

### Documents

| Type | Count | Status | Content |
|------|-------|--------|---------|
| Text (.txt) | 2 | ready | "Secret A", "Secret B" (dummy) |
| Image (.jpg/.png/.jpeg) | 3 | ready | Filename fallback only |
| **Total** | **5** | — | — |

### Chunks

| Type | Count | Has Embedding | Content Quality |
|------|-------|---------------|-----------------|
| text | 2 | ❌ NULL | 🔴 Dummy ("Secret A/B") |
| image | 3 | ⚠️ Filename-based | 🔴 Filename fallback |
| **Total** | **5** | — | — |

### Image Processing Pipeline

| Step | Status | Evidence |
|------|--------|----------|
| Vision Model | ❌ UNAVAILABLE | mimo-v2.5 does not support image input |
| Tesseract OCR | ❌ NOT INSTALLED | Not in Docker container |
| Filename Fallback | ⚠️ ACTIVE | Violates "never fall back to filename-only" rule |
| Rejection Logic | ⚠️ BYPASSED | Should reject, but caption is auto-generated from filename |

---

## 2. Chunk-by-Chunk Analysis

### Text Chunks (2)

| Chunk ID | Content | Embedding | Quality Score |
|----------|---------|-----------|---------------|
| `chunk-a` | "Secret A" (8 chars) | NULL | 0/10 |
| `chunk-b` | "Secret B" (8 chars) | NULL | 0/10 |

**Issues:**
- Content is placeholder text, not real documents
- No embeddings generated (embedding is NULL)
- Cannot participate in vector search
- BM25 may match on "Secret" keyword but meaningless

### Image Chunks (3)

| Chunk ID | Doc Title | Content Preview | OCR | Caption | Summary |
|----------|-----------|-----------------|-----|---------|---------|
| `aed6c7bd` | test-multimodal.png | "Image: 1781000521977 test multimodal Uploaded image file..." | ❌ empty | ⚠️ filename | ⚠️ filename |
| `7c6b012b` | IMG-20260608-WA0008.jpg | "Image: 1780998895575 IMG 20260608 WA0008 Uploaded image file..." | ❌ empty | ⚠️ filename | ⚠️ filename |
| `e7350c07` | WhatsApp Image 2026-06-08 at 12.05.55 PM.jpeg | "Image: 1781004414829 WhatsApp Image 2026 06 08 at 12.05.55 PM..." | ❌ empty | ⚠️ filename | ⚠️ filename |

**Issues:**
- OCR text is EMPTY for all 3 images
- Captions are auto-generated from filename (not actual image description)
- Summaries say "Vision processing was not available for this model"
- Embeddings are generated from filename text, not image content
- Cross-similarity: 0.57-0.59 (all similar because same filename pattern)

---

## 3. Embedding Quality Analysis

### Cross-Similarity Matrix

| Chunk A | Chunk B | Similarity |
|---------|---------|------------|
| `7c6b012b` | `e7350c07` | 0.5863 |
| `7c6b012b` | `aed6c7bd` | 0.5803 |
| `aed6c7bd` | `e7350c07` | 0.5709 |
| Text chunks | Image chunks | NULL (no embedding) |

**Analysis:**
- All 3 image chunks have HIGH mutual similarity (0.57-0.59)
- This is because embeddings are from filename patterns ("Image: ... Uploaded image file: ...")
- A real vision model would produce DIVERSE embeddings based on actual image content
- Current embeddings are essentially random noise in terms of semantic meaning

### Search Behavior

| Metric | Value | Interpretation |
|--------|-------|----------------|
| Total searches logged | 106 | All hybrid mode |
| Avg results returned | 3 | Returns all image chunks |
| Avg search latency | 1ms | Fast (trivial corpus) |
| Reranker latency | 0ms | Not implemented |
| Embedding dimension | 1536 | Correct (OpenAI-compatible) |

---

## 4. File System Audit

### Uploaded Files

| File | Size | On Disk | Chunks Generated |
|------|------|---------|------------------|
| test-multimodal.png | 69 bytes | ✅ | 1 image chunk |
| IMG-20260608-WA0008.jpg | — | ❌ Missing | 1 image chunk |
| WhatsApp Image 2026-06-08 at 12.05.55 PM.jpeg | — | ❌ Missing | 1 image chunk |

**Issues:**
- 2 of 3 image files are missing from `public/uploads/`
- `test-multimodal.png` is only 69 bytes (likely a placeholder, not real image)
- Text documents (`doc-a`, `doc-b`) have no `file_url` (inline content only)

---

## 5. OCR Pipeline Status

### Vision Model

| Setting | Value | Status |
|---------|-------|--------|
| `vision_model` | gpt-4o-mini (default) | ⚠️ Not configured |
| `vision_api_key` | (empty) | 🔴 No API key |
| `vision_base_url` | (empty) | 🔴 No base URL |
| Main AI provider | mimo-v2.5 | ❌ No image input support |

### Tesseract OCR

| Check | Status |
|-------|--------|
| `tesseract` in Docker | ❌ Not installed |
| Package available | `tesseract-ocr` available via `apk add` |
| Language packs | `eng`, `ind` needed |
| Fallback behavior | Returns empty string on failure |

### Rejection Logic

The `processImage()` function has validation:
```typescript
const hasContent = ocrText.length > 0 || caption.length > 0;
if (!hasContent) {
  extractionMethod = "rejected";
}
```

**BUT:** The code then auto-generates a caption from filename:
```typescript
if (!caption && ocrText) {
  caption = `Image containing text: ${baseName}`;
}
```

This means images are NEVER rejected — they always get a filename-based caption.

---

## 6. Benchmark Readiness Assessment

### Current State

| Criterion | Required | Actual | Score |
|-----------|----------|--------|-------|
| Total documents | 20+ | 5 | 0/10 |
| Total chunks | 100+ | 5 | 0/10 |
| Text documents | 10+ | 2 (dummy) | 0/10 |
| Image documents | 5+ | 3 (no OCR) | 0/10 |
| Ground truth coverage | 80%+ | 6% (3/50) | 0/10 |
| Real content | Yes | No (dummy text) | 0/10 |
| OCR quality | Validated | Not available | 0/10 |
| Embedding quality | Meaningful | Filename-based | 0/10 |
| File integrity | All files present | 2/3 missing | 2/10 |
| Multilingual queries | ID + EN | 50 queries (ID+EN) | 8/10 |

### Corpus Quality Score: **1/100**

**Breakdown:**
- Content quality: 0/25 (dummy text, no real documents)
- Chunk coverage: 0/25 (5 chunks vs 100+ needed)
- Image processing: 0/25 (no OCR, no vision, filename fallback)
- Benchmark readiness: 1/25 (only query set is decent)

---

## 7. Production Benchmark Design

### Target Corpus

| Category | Documents | Chunks | Content |
|----------|-----------|--------|---------|
| Technical docs | 5 | 25-40 | API docs, architecture, code |
| User guides | 5 | 20-30 | How-to guides, tutorials |
| Images | 5 | 10-15 | Screenshots, diagrams, charts |
| Mixed (tables) | 3 | 10-15 | Data tables, pricing, specs |
| Indonesian content | 3 | 10-15 | ID language documents |
| **Total** | **21** | **75-115** | — |

### Target Benchmark

| Metric | Target |
|--------|--------|
| Total queries | 50 |
| Queries with GT | 40+ (80%) |
| Query categories | 5+ (technical, usage, general, image, multilingual) |
| Difficulty levels | easy/medium/hard balanced |
| Ground truth type | chunk-level (not document-level) |
| Relevance grades | binary (relevant/not) or graded (1-3) |

### Minimum Viable Corpus

For a trustworthy benchmark, we need:

1. **10+ real text documents** with actual content (not dummy)
2. **5+ images** processed with vision model (not filename fallback)
3. **50+ chunks** with meaningful embeddings
4. **40+ queries** with verified ground truth annotations
5. **Validated OCR** on all image documents

---

## 8. Required Actions Before Benchmark

### Priority 1: Fix Image Pipeline

| Action | How | Impact |
|--------|-----|--------|
| Configure vision model | Add GPT-4o or Gemini API key in Settings | Enables OCR + captioning |
| Install Tesseract in Docker | Add `apk add tesseract-ocr tesseract-ocr-eng tesseract-ocr-ind` to Dockerfile | OCR fallback |
| Re-upload test images | Upload real images (not 69-byte placeholder) | Actual content to process |
| Validate OCR output | Check that extracted text is meaningful | Confirms pipeline works |

### Priority 2: Build Real Corpus

| Action | How | Impact |
|--------|-----|--------|
| Upload real documents | PDF, DOCX, TXT with actual content | Meaningful text chunks |
| Upload images with text | Screenshots, documents, diagrams | Test OCR pipeline |
| Upload mixed content | Tables, charts, code snippets | Diverse chunk types |
| Generate embeddings | Ensure all chunks have embeddings | Searchable content |

### Priority 3: Rebuild Ground Truth

| Action | How | Impact |
|--------|-----|--------|
| Annotate 40+ queries | Map each query to correct chunks | Trustworthy metrics |
| Verify annotations | Cross-check chunk content matches query intent | Prevent false positives |
| Test retrieval | Run search, verify relevant chunks are returned | End-to-end validation |
| Compute honest baseline | Divide by queries WITH GT only | Accurate P@5, R@5, MRR |

---

## 9. Recommended Dataset Size

### For Reranker Evaluation

| Corpus Size | P@5 Improvement Expected | Confidence |
|-------------|-------------------------|------------|
| 5 chunks (current) | 0% (nothing to rerank) | N/A |
| 20 chunks | +5-10% | Low |
| 50 chunks | +10-15% | Medium |
| 100+ chunks | +15-25% | High |
| 500+ chunks | +20-30% | Very High |

**Recommendation:** Target **100+ chunks** for meaningful reranker evaluation.

### For Production SaaS

| Metric | Minimum | Recommended |
|--------|---------|-------------|
| Documents | 50 | 200+ |
| Chunks | 200 | 1000+ |
| Images | 20 | 100+ |
| Queries with GT | 100 | 500+ |
| Languages | 1 (EN) | 2+ (EN, ID) |

---

## 10. Summary

| Finding | Status | Impact |
|---------|--------|--------|
| Corpus has 5 chunks | 🔴 Critical | Cannot benchmark |
| 2 text chunks are dummy | 🔴 Critical | No real content |
| 3 image chunks use filename fallback | 🔴 Critical | No OCR/vision |
| Vision model unavailable | 🔴 Critical | Images not processed |
| Tesseract not installed | 🔴 Critical | No OCR fallback |
| Ground truth coverage 6% | 🔴 Critical | Metrics meaningless |
| 2 image files missing | 🟡 Warning | Incomplete corpus |
| Test image is 69 bytes | 🟡 Warning | Placeholder, not real |
| Query set has 50 queries | ✅ Good | Ready for annotation |
| Hybrid search works | ✅ Good | Pipeline functional |

### Bottom Line

**The current corpus is a test fixture, not a production benchmark.** It was sufficient for validating the pipeline architecture (upload → chunk → embed → search), but it CANNOT produce trustworthy retrieval quality metrics.

Before implementing the reranker (Phase 4), we need:
1. A vision model configured and working
2. 100+ chunks from real documents
3. 40+ queries with verified ground truth
4. Honest baseline computed on real content

**Estimated effort:** 2-4 hours to build production corpus + validate pipeline.

---

*This audit establishes the true state of the multimodal corpus. All previous benchmark numbers should be considered unreliable until a new corpus is built and validated.*
