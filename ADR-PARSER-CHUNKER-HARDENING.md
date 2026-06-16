# ADR-PARSER-CHUNKER-HARDENING: Parser & Chunker Reliability

**Status:** Accepted  
**Date:** 2026-06-13  
**Deciders:** Sprint 5B  
**Technical Story:** Hardening the parsing and chunking stages of the RAG pipeline

## Context

The RAG Reliability Audit identified parser and chunker as moderate-risk modules:
- **Parser:** No test suite, no error logging, no content validation
- **Chunker:** Naive sentence splitting (breaks on abbreviations), no chunk count limit

## Decision

### 1. Parser Test Suite (18 tests)

Create comprehensive tests for the parser module covering:
- `parseTXT`: UTF-8 handling, empty buffer, Unicode sanitization, control characters
- `parseCSV`: Row conversion, empty CSV, special characters
- `sanitizeText`: Smart quotes, special dashes, zero-width chars, non-breaking spaces
- `parseFile`: Dispatch, unsupported types, URL requirement
- `isImageFile`: Extension detection, case insensitivity
- Content validation: Empty content detection

### 2. Chunker Test Suite (8 tests)

Create tests for the chunker module covering:
- Paragraph splitting
- Small paragraph merging
- Large paragraph sentence splitting
- Overlap behavior
- Empty text handling
- Short text handling
- Chunk index preservation
- Metadata passthrough

### 3. Improved Sentence Splitting

**Before:** `currentChunk.match(/[^.!?]+[.!?]+/g)` — naive regex that splits on every period.

**After:** `text.split(/(?<=[.!?])\s+(?=[A-Z\u00C0-\u024F])/)` — splits on sentence-ending punctuation followed by whitespace and uppercase letter. This correctly handles:
- "Dr. Smith went home" — no split (Dr. not followed by uppercase after space)
- "He went home. She stayed." — splits correctly
- "U.S.A. is a country" — no split (abbreviation)

### 4. Chunk Count Limit

Added `MAX_CHUNKS = 1000` constant. When a document would produce more than 1000 chunks, excess chunks are dropped. This prevents:
- Memory exhaustion from very large documents
- Database bloat from thousands of low-value chunks
- Embedding API cost explosion

### 5. Parser Error Logging

Wrapped `parseFile()` in try-catch with structured error logging:
```
[Parser] Error parsing pdf file: <error message>
```
This helps diagnose extraction issues without silent failures.

## Consequences

### Positive
- 26 new RAG pipeline tests (18 parser + 8 chunker)
- Sentence splitting handles abbreviations correctly
- Large documents capped at 1000 chunks
- Parse errors logged with context (file type + error message)
- Empty content detected and warned

### Negative
- Very large documents (>1000 chunks) will have content truncated
- Sentence splitting still not perfect (edge cases with unusual punctuation)
