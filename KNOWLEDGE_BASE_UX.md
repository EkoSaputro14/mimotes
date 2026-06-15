# KNOWLEDGE_BASE_UX.md — Knowledge Base UX Redesign

> Date: 2026-06-10
> Phase: UI-REVAMP — Step 5

---

## Current Problem

- Documents page is a simple list with no status indicators
- Upload is a separate page with no progress feedback
- No visibility into OCR/embedding processing pipeline
- Chunk viewer is a raw table dump
- No document health indicators
- No drag-and-drop support

## Redesign: Knowledge Base Experience

### Documents Page (`/documents`)

```
┌─────────────────────────────────────────────────────────┐
│  Knowledge Base                        [Upload] [Search]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔍 Search documents...                    Filter ▼     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📊 Overview                                   │   │
│  │  34 docs │ 107K chunks │ 93% PDF │ 13 images  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Status: ● Ready (30)  ⏳ Processing (2)  ❌ Failed (2)│
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📄 postgresql-9.6-US.pdf                      │   │
│  │  PDF • 14.8 MB • 14,814 chunks • ✅ Ready      │   │
│  │  ████████████████████████░░░ Embedding: 100%   │   │
│  │  Uploaded 2h ago • 3.2K searches               │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  📄 business-requirements.docx                 │   │
│  │  DOCX • 37 KB • 26 chunks • ✅ Ready           │   │
│  │  ████████████████████████░░░ Embedding: 100%   │   │
│  │  Uploaded 1h ago • 89 searches                 │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  🖼️ lelang1.jpg                                │   │
│  │  Image • 940 KB • 1 chunk • ✅ Ready (OCR)     │   │
│  │  ████████████████████████░░░ OCR: 94.7%        │   │
│  │  Uploaded 3h ago • 45 searches                 │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  📄 invoice-sample.png                         │   │
│  │  Image • 13 KB • 1 chunk • ✅ Ready (OCR)      │   │
│  │  ████████████████████████░░░ OCR: 92.8%        │   │
│  │  Uploaded 30m ago • 12 searches                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ← 1 2 3 ... 4 →                                      │
└─────────────────────────────────────────────────────────┘
```

### Document Detail (`/documents/[id]`)

```
┌─────────────────────────────────────────────────────────┐
│  ← Back    📄 postgresql-9.6-US.pdf                    │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ Chunks       │ │ Embeddings   │ │ Search Refs  │   │
│  │ 14,814       │ │ 100%         │ │ 3.2K         │   │
│  └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                         │
│  Processing Pipeline:                                   │
│  ✅ Parse → ✅ Chunk (500 tokens) → ✅ Embed → ✅ Store│
│                                                         │
│  Chunks (showing 1-10 of 14,814):                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ #0 │ PostgreSQL 9.6.24 Documentation...         │   │
│  │    │ The PostgreSQL Global Development Group    │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ #1 │ Table of Contents...                       │   │
│  │    │ 1. Preface ................................│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ #2 │ 1.1. What is PostgreSQL?...               │   │
│  │    │ PostgreSQL is an advanced object-relatio...│   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Download] [Re-process] [Delete]                       │
└─────────────────────────────────────────────────────────┘
```

### Upload Experience (`/upload`)

```
┌─────────────────────────────────────────────────────────┐
│  Upload Documents                                       │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │         📁 Drop files here                      │   │
│  │         or click to browse                      │   │
│  │                                                 │   │
│  │  Supports: PDF, DOCX, TXT, CSV, Images          │   │
│  │  Max size: 100 MB per file                      │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Queue (3 files):                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📄 report.pdf        12.4 MB  ✅ Uploaded       │   │
│  │ ████████████████████████████████████  Processing │   │
│  │   → Parsing... → Chunking... → Embedding...     │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 📄 data.xlsx         1.2 MB   ⏳ Queued         │   │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Waiting  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 🖼️ screenshot.png   890 KB   ⏳ Queued          │   │
│  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Waiting  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Processing Pipeline Status:                            │
│  ✅ Parse (1.2s) → ⏳ Chunk → ⏳ Embed → ⏳ Store     │
└─────────────────────────────────────────────────────────┘
```

### Document Health Indicators

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Ready | Green | ✅ | Fully processed, searchable |
| Processing | Yellow | ⏳ | Currently being processed |
| Failed | Red | ❌ | Processing failed (click for error) |
| Stale | Gray | ⚠️ | Needs re-processing (old embedding model) |
| Empty | Muted | 📭 | Document has 0 chunks |

### Search Page (`/search`)

```
┌─────────────────────────────────────────────────────────┐
│  Similarity Search                                      │
│                                                         │
│  🔍 Enter a query to find similar chunks...             │
│                                                         │
│  Top K: [5] ▼   Mode: [Vector ▼]                       │
│                                                         │
│  Results (0.82ms):                                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 1. postgresql-9.6-US.pdf #2902                  │   │
│  │    Similarity: 82.3%                             │   │
│  │    "parse based on more than just white space..."│   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 2. postgresql-10-US.pdf #2913                   │   │
│  │    Similarity: 81.1%                             │   │
│  │    "parse based on more than just white space..."│   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

*Generated by Hermes Agent — Phase UI-REVAMP Step 5*
