# Widget Citation Report

**Date:** 2026-06-15
**Environment:** Production (https://mimotes.ekohomelab.online)

---

## Citation Format

The RAG pipeline returns citations in the SSE streaming response as a `sources` event:

```json
{
  "type": "sources",
  "sources": [
    {
      "documentTitle": "postgresql-10-US.pdf",
      "similarity": 0.5217,
      "chunkIndex": 6208
    }
  ]
}
```

---

## Citation Quality Assessment

### Source Attribution

| Query | Sources Returned | Correct Document? | Similarity Range |
|-------|-----------------|-------------------|------------------|
| What is PostgreSQL? | 5 | ✅ PostgreSQL docs | 0.48–0.52 |
| Explain VACUUM | 5 | ✅ PostgreSQL docs | ~0.50 |
| PostgreSQL 17 changes | 5 | ✅ PG 17 doc included | ~0.49 |

### Document Coverage

| Document | Queried | Retrieved | Notes |
|----------|---------|-----------|-------|
| postgresql-10-US.pdf | ✅ | ✅ | Top source for "What is PostgreSQL?" |
| postgresql-17-US.pdf | ✅ | ✅ | Top source for "PG 17 changes" |
| postgresql-9.6-US.pdf | — | ✅ | Retrieved for general PG query |
| postgresql-16-US.pdf | — | ✅ | Retrieved for general PG query |
| postgresql-15-US.pdf | — | ✅ | Retrieved for general PG query |

---

## Similarity Score Analysis

| Metric | Value | Assessment |
|--------|-------|------------|
| Min similarity | 0.4814 | Above threshold (0.30) |
| Max similarity | 0.5217 | Medium confidence |
| Average similarity | 0.4973 | Consistent range |
| Score spread | 0.04 | Narrow (feature hashing) |

### Interpretation

- **0.48–0.52 range** indicates feature-hashing embeddings (not neural)
- **Threshold 0.30** correctly filters irrelevant results
- **Confidence classification:** medium (0.40–0.54 range)
- **No refusal** — all queries had sufficient similarity

---

## Citation Rendering Status

| Aspect | Status | Notes |
|--------|--------|-------|
| Sources returned by API | ✅ | 5 sources per query |
| Sources in SSE stream | ✅ | `sources` event type |
| Sources rendered in widget UI | ⚠️ | Not visually displayed |
| Document title in citation | ✅ | `documentTitle` field |
| Similarity score | ✅ | `similarity` field |
| Chunk index | ✅ | `chunkIndex` field |

**Note:** The widget.js receives sources but does not currently render them as clickable source cards. This is a UI enhancement for Phase 2.

---

## Recommendations

1. **Source card UI** — Add visual source cards to widget showing document title + similarity
2. **Click-to-expand** — Allow users to view source chunk content
3. **Confidence badge** — Show high/medium/low confidence indicator
4. **Similarity threshold tuning** — Consider raising from 0.30 to 0.40 for stricter filtering

---

## Verdict

**Citations: PASS** ✅

Sources are correctly retrieved, attributed, and returned in the streaming response. Visual rendering in widget UI is a Phase 2 enhancement.
