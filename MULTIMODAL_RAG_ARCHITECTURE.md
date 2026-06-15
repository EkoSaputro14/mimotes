# Multimodal RAG — Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        UPLOAD PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  File     │───▶│  Detect      │───▶│  Route by type       │  │
│  │  Upload   │    │  File Type   │    │                      │  │
│  └──────────┘    └──────────────┘    │  ┌────┐  ┌────────┐  │  │
│                                       │  │Text│  │ Image  │  │  │
│                                       │  └──┬─┘  └───┬────┘  │  │
│                                       │     │        │        │  │
│  ┌────────────────────────────────────┼─────┼────────┼────────┤  │
│  │                                    │     │        │        │  │
│  │  TEXT PATH                         ▼     │        ▼        │  │
│  │  ┌─────────┐  ┌────────┐  ┌──────────┐  │  ┌───────────┐  │  │
│  │  │ Parse   │─▶│ Chunk  │─▶│ Embed    │  │  │ process   │  │  │
│  │  │ PDF/DOC │  │ Text   │  │ (1536d)  │  │  │ Image     │  │  │
│  │  └─────────┘  └────────┘  └──────────┘  │  └─────┬─────┘  │  │
│  │                                         │        │        │  │
│  │  IMAGE PATH                            │   ┌────┴────┐   │  │
│  │  ┌─────────┐  ┌────────┐  ┌──────────┐ │   │  Sharp  │   │  │
│  │  │ sharp   │─▶│ OCR    │─▶│ Vision   │─┘   │ Resize  │   │  │
│  │  │ resize  │  │Tesseract│ │ Caption  │     │ 1024px  │   │  │
│  │  │ 1024px  │  │ ind+eng│  │ (GPT-4o) │     └─────────┘   │  │
│  │  └─────────┘  └────────┘  └──────────┘                    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              document_chunks TABLE                        │   │
│  │  ┌─────────┬──────────┬─────────┬──────────┬──────────┐  │   │
│  │  │ content │ ocr_text │ caption │summary   │chunk_type│  │   │
│  │  │(text)   │(image)   │(image)  │(image)   │text/image│  │   │
│  │  └─────────┴──────────┴─────────┴──────────┴──────────┘  │   │
│  │  ┌──────────────────────────────────────────────────────┐│   │
│  │  │ embedding (vector 1536) — caption+summary for images ││   │
│  │  └──────────────────────────────────────────────────────┘│   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     RETRIEVAL PIPELINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  User     │───▶│  Embed       │───▶│  Vector Search       │  │
│  │  Query    │    │  Query       │    │  (HNSW index)        │  │
│  └──────────┘    └──────────────┘    │  workspace_id filter  │  │
│                                       │  similarity >= 0.30   │  │
│                                       └──────────┬───────────┘  │
│                                                   │              │
│                              ┌────────────────────┼───────────┐  │
│                              │                    │           │  │
│                              ▼                    ▼           │  │
│                    ┌──────────────┐      ┌──────────────┐     │  │
│                    │ Text Chunks  │      │Image Chunks  │     │  │
│                    │ [1] content  │      │[Image]       │     │  │
│                    └──────┬───────┘      │[Caption] ... │     │  │
│                           │              │[OCR] ...     │     │  │
│                           │              └──────┬───────┘     │  │
│                           │                     │             │  │
│                           ▼                     ▼             │  │
│                    ┌──────────────────────────────────────┐   │  │
│                    │  buildMultimodalContext()             │   │  │
│                    │  Token budget: 8000 tokens           │   │  │
│                    │  Dedup near-duplicates               │   │  │
│                    └──────────────────┬───────────────────┘   │  │
│                                       │                       │  │
│                                       ▼                       │  │
│                    ┌──────────────────────────────────────┐   │  │
│                    │  AI Model (GPT-4o / Mimo Pro)        │   │  │
│                    │  System prompt + context + question  │   │  │
│                    └──────────────────────────────────────┘   │  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     IMAGE PROCESSING                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Input: image file (PNG/JPG/JPEG/WEBP)                         │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Step 1: Preprocess (sharp)                               │   │
│  │ - Resize to max 1024px                                   │   │
│  │ - Convert to JPEG buffer                                 │   │
│  │ - Generate base64 data URL                               │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│              ┌────────────┴────────────┐                       │
│              ▼                         ▼                        │
│  ┌───────────────────┐    ┌────────────────────┐               │
│  │ Step 2a: OCR      │    │ Step 2b: Vision     │              │
│  │ (tesseract.js)    │    │ (AI Provider)       │              │
│  │ Languages: ind+eng│    │ Model: GPT-4o       │              │
│  │ Output: raw text  │    │ Output: caption     │              │
│  └─────────┬─────────┘    └──────────┬─────────┘               │
│            │                         │                          │
│            └────────────┬────────────┘                          │
│                         ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Step 3: Generate Summary                                │   │
│  │ Input: caption + OCR text                               │   │
│  │ Output: 2-3 sentence summary                            │   │
│  └────────────────────────┬────────────────────────────────┘   │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Output: { ocrText, caption, summary }                   │   │
│  │ Embedding: caption + summary → 1536-dim vector          │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Changes

### Before
```sql
document_chunks:
  id, document_id, tenant_id, workspace_id,
  content, embedding, chunk_index, metadata, created_at
```

### After
```sql
document_chunks:
  id, document_id, tenant_id, workspace_id,
  content, embedding, chunk_index, metadata, created_at,
  + chunk_type VARCHAR(50) DEFAULT 'text',     -- 'text' or 'image'
  + ocr_text TEXT,                              -- OCR extracted text
  + caption TEXT,                               -- AI-generated caption
  + image_summary TEXT,                         -- AI-generated summary
  + image_url TEXT                              -- path to image file
```

### Index
```sql
CREATE INDEX document_chunks_chunk_type_idx ON document_chunks(chunk_type);
```
