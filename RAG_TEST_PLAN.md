# RAG Test Plan — Testing Strategy for RAG Pipeline Modules

**Date:** 2026-06-13  
**Framework:** Vitest (existing)  
**Priority:** Parser tests first → Chunker → Embedder → Vectorstore → Chain

## Test Strategy Overview

### Testing Pyramid for RAG

```
         ┌─────────────┐
         │  E2E Tests   │  ← Few, slow, expensive
         │  (full RAG)  │
         ├─────────────┤
         │ Integration  │  ← Module interactions
         │    Tests     │
         ├─────────────┤
         │  Unit Tests  │  ← Many, fast, cheap
         │ (per module) │
         └─────────────┘
```

### Test Categories

| Category | Speed | DB Required | Mocking | Count Target |
|----------|-------|-------------|---------|--------------|
| Unit (parser, chunker) | Fast | No | None | 40+ |
| Unit (embedder) | Fast | No | AI provider | 15+ |
| Integration (vectorstore) | Slow | Yes | None | 10+ |
| Integration (chain) | Slow | Yes | AI provider | 10+ |
| E2E (full pipeline) | Slow | Yes | None | 5+ |

---

## Phase 1: Parser Tests (PRIORITY)

### `tests/lib/rag/parser.test.ts`

#### parseTXT
```
TEST 1: parseTXT returns content from UTF-8 buffer
  GIVEN a Buffer containing "Hello world"
  WHEN parseTXT() is called
  THEN content is "Hello world" AND metadata.source is "txt"

TEST 2: parseTXT handles empty buffer
  GIVEN an empty Buffer
  WHEN parseTXT() is called
  THEN content is ""

TEST 3: parseTXT sanitizes Unicode
  GIVEN a Buffer with BOM + smart quotes
  WHEN parseTXT() is called
  THEN content has BOM removed AND quotes are ASCII

TEST 4: parseTXT removes control characters
  GIVEN a Buffer with \x00 \x01 \x02 embedded
  WHEN parseTXT() is called
  THEN content has no control characters
```

#### parseCSV
```
TEST 5: parseCSV converts rows to readable text
  GIVEN a CSV with headers [name, age] and rows [Alice, 30] [Bob, 25]
  WHEN parseCSV() is called
  THEN content contains "name: Alice, age: 30" and "name: Bob, age: 25"

TEST 6: parseCSV handles empty CSV
  GIVEN a CSV with only headers
  WHEN parseCSV() is called
  THEN content is empty

TEST 7: parseCSV handles special characters
  GIVEN a CSV with values containing commas and quotes
  WHEN parseCSV() is called
  THEN values are correctly parsed
```

#### parseURL (with mocked fetch)
```
TEST 8: parseURL extracts text from HTML
  GIVEN HTML with <title>Test</title> and <body>Hello</body>
  WHEN parseURL() is called
  THEN content is "Hello" AND metadata.title is "Test"

TEST 9: parseURL removes script and style tags
  GIVEN HTML with <script> and <style> tags
  WHEN parseURL() is called
  THEN content has no script/style content

TEST 10: parseURL rejects internal URLs (SSRF protection)
  GIVEN url "http://127.0.0.1/admin"
  WHEN parseURL() is called
  THEN it throws "URL validation failed"

TEST 11: parseURL rejects file:// protocol
  GIVEN url "file:///etc/passwd"
  WHEN parseURL() is called
  THEN it throws "URL validation failed"
```

#### sanitizeText
```
TEST 12: sanitizeText removes BOM
  GIVEN text with \uFEFF prefix
  WHEN sanitizeText() is called
  THEN BOM is removed

TEST 13: sanitizeText replaces smart quotes
  GIVEN text with \u2018 \u2019 \u201C \u201D
  WHEN sanitizeText() is called
  THEN quotes are ASCII equivalents

TEST 14: sanitizeText replaces special dashes
  GIVEN text with \u2013 \u2014
  WHEN sanitizeText() is called
  THEN dashes are regular hyphens

TEST 15: sanitizeText preserves newlines and tabs
  GIVEN text with \n and \t
  WHEN sanitizeText() is called
  THEN \n and \t are preserved
```

#### parseFile (dispatch)
```
TEST 16: parseFile dispatches to correct parser by type
  GIVEN fileType "txt" and "csv"
  WHEN parseFile() is called
  THEN correct parser is invoked

TEST 17: parseFile throws on unsupported type
  GIVEN fileType "xyz"
  WHEN parseFile() is called
  THEN it throws "Unsupported file type"

TEST 18: parseFile requires URL for type "url"
  GIVEN fileType "url" and no url parameter
  WHEN parseFile() is called
  THEN it throws "URL is required"
```

---

## Phase 2: Chunker Tests

### `tests/lib/rag/chunker.test.ts`

```
TEST 19: chunkText splits by paragraphs
  GIVEN text with 3 paragraphs separated by blank lines
  WHEN chunkText() is called with chunkSize=100
  THEN 3 chunks are returned

TEST 20: chunkText merges small paragraphs
  GIVEN text with 10 short paragraphs (each 20 chars)
  WHEN chunkText() is called with chunkSize=500
  THEN chunks contain merged paragraphs

TEST 21: chunkText splits large paragraphs by sentences
  GIVEN a single paragraph of 1500 characters
  WHEN chunkText() is called with chunkSize=500
  THEN multiple chunks are returned AND no chunk > 1000 chars

TEST 22: chunkText adds overlap
  GIVEN text with 2 paragraphs
  WHEN chunkText() is called with overlap=50
  THEN second chunk starts with words from end of first chunk

TEST 23: chunkText handles empty text
  GIVEN empty string
  WHEN chunkText() is called
  THEN empty array is returned

TEST 24: chunkText preserves chunk indices
  GIVEN text that produces 5 chunks
  WHEN chunkText() is called
  THEN chunks have indices 0-4

TEST 25: chunkText passes metadata through
  GIVEN text and metadata={source: "test"}
  WHEN chunkText() is called
  THEN all chunks have metadata.source === "test"

TEST 26: chunkText handles text shorter than chunkSize
  GIVEN text of 100 characters
  WHEN chunkText() is called with chunkSize=500
  THEN 1 chunk with full text is returned
```

---

## Phase 3: Embedder Tests

### `tests/lib/rag/embedder.test.ts` (requires mocking AI provider)

```
TEST 27: generateLocalEmbedding produces 1536-dim vector
  GIVEN text "hello world"
  WHEN generateLocalEmbedding() is called
  THEN result is array of length 1536

TEST 28: generateLocalEmbedding is deterministic
  GIVEN same text called twice
  WHEN generateLocalEmbedding() is called
  THEN both results are identical

TEST 29: generateLocalEmbedding produces L2-normalized vector
  GIVEN any text
  WHEN generateLocalEmbedding() is called
  THEN L2 norm is approximately 1.0

TEST 30: generateLocalEmbedding differentiates different texts
  GIVEN "hello world" and "goodbye universe"
  WHEN generateLocalEmbedding() is called for both
  THEN vectors are different

TEST 31: generateEmbedding falls back to local on API failure
  GIVEN AI provider that throws error
  WHEN generateEmbedding() is called
  THEN local embedding is returned (no exception)

TEST 32: generateEmbeddings batch produces correct count
  GIVEN 5 texts
  WHEN generateEmbeddings() is called
  THEN 5 embeddings are returned
```

---

## Phase 4: Vectorstore Tests (Integration — requires DB)

### `tests/lib/rag/vectorstore.test.ts`

```
TEST 33: storeChunks inserts chunks into database
  GIVEN documentId, workspaceId, and 3 chunks
  WHEN storeChunks() is called
  THEN 3 rows exist in document_chunks table

TEST 34: searchSimilarChunks returns relevant chunks
  GIVEN stored chunks about "Python programming"
  WHEN searchSimilarChunks() is called with query about "Python"
  THEN results contain the Python chunk with similarity > 0.5

TEST 35: searchSimilarChunks filters by workspace
  GIVEN chunks in workspace A and workspace B
  WHEN searchSimilarChunks() with workspaceId=A
  THEN only chunks from workspace A are returned

TEST 36: searchSimilarChunks applies similarity threshold
  GIVEN chunks with varying similarity
  WHEN searchSimilarChunks() with minSimilarity=0.5
  THEN only chunks with similarity >= 0.5 are returned

TEST 37: searchSimilarChunks deduplicates content
  GIVEN 3 chunks with identical content
  WHEN searchSimilarChunks() is called
  THEN only 1 chunk is returned

TEST 38: buildMultimodalContext respects token budget
  GIVEN 10 chunks and maxTokens=500
  WHEN buildMultimodalContext() is called
  THEN tokensUsed <= 500 AND chunksIncluded < 10
```

---

## Phase 5: Chain Tests (Integration)

### `tests/lib/rag/chain.test.ts`

```
TEST 39: generateRAGResponse returns answer with sources
  GIVEN documents stored AND question about content
  WHEN generateRAGResponse() is called
  THEN answer is non-empty AND sources is non-empty

TEST 40: generateRAGResponse returns "no info" when no relevant chunks
  GIVEN empty document store
  WHEN generateRAGResponse() is called
  THEN answer contains "tidak menemukan informasi"

TEST 41: streamRAGResponse returns stream object
  GIVEN documents stored AND question
  WHEN streamRAGResponse() is called
  THEN stream is not null AND sources is not empty
```

---

## Test File Structure

```
tests/
├── lib/
│   └── rag/
│       ├── parser.test.ts       # Phase 1 (18 tests)
│       ├── chunker.test.ts      # Phase 2 (8 tests)
│       ├── embedder.test.ts     # Phase 3 (6 tests)
│       ├── vectorstore.test.ts  # Phase 4 (6 tests, needs DB)
│       └── chain.test.ts        # Phase 5 (3 tests, needs DB)
```

## Mocking Strategy

| Module | Mock | Method |
|--------|------|--------|
| Parser → URL | `fetch` | Vitest `vi.mock` global fetch |
| Embedder → AI | `getAIProvider` | Mock return value |
| Vectorstore → DB | `prisma` | Test DB or mock |
| Chain → AI | `getAIProvider` | Mock return value |

## Test Data

### Fixtures (`tests/fixtures/`)
- `sample.txt` — Plain text (1000 chars)
- `sample.csv` — CSV with 10 rows
- `sample.html` — HTML page for URL parsing
- `sample.pdf` — Small PDF (if needed)
