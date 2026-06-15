# RAG Reliability Audit — MimoNotes Production Readiness Assessment

**Date:** 2026-06-13  
**Scope:** Full RAG pipeline (parser → chunker → embedder → vectorstore → chain)  
**Status:** PRODUCTION READINESS: ⚠️ CONDITIONAL — needs hardening

## Executive Summary

The RAG pipeline is **functional but fragile**. It works end-to-end for the happy path but has significant reliability gaps that will cause issues at production scale. The most critical risks are:

1. **Embedding quality degradation** — Local fallback produces poor-quality vectors
2. **Chunk boundary corruption** — Overlap logic can duplicate or lose content
3. **Hallucination risk** — Weak context attribution + no grounding verification
4. **Parser brittleness** — No error recovery, silent failures on malformed files
5. **Token estimation inaccuracy** — 4 chars/token is too imprecise for mixed-language content

## Module-by-Module Audit

### 1. Parser (`lib/rag/parser.ts`) — ⚠️ MODERATE RISK

**Functionality:** Parses PDF, DOCX, TXT, CSV, XLSX, URL into text content.

| Finding | Severity | Impact |
|---------|----------|--------|
| No error recovery for malformed PDFs | HIGH | Silent failure, empty content stored |
| No file size limit before parsing | MEDIUM | Memory exhaustion on huge files |
| No content validation after parse | MEDIUM | Empty/whitespace-only content stored as "ready" |
| URL parser strips all HTML structure | MEDIUM | Tables, lists lose structure → poor chunks |
| `sanitizeText()` removes Unicode aggressively | LOW | Some languages (CJK, Arabic) may lose characters |
| No encoding detection for TXT files | LOW | Non-UTF-8 files produce garbled text |
| CSV parser assumes header row | LOW | Headerless CSVs misparse |
| PDF metadata.title often undefined | LOW | Document titles unreliable |

**SSRF Protection:** ✅ Good — `validateUrl()` + `safeFetch()` in Sprint 2.

**Key Risk:** A 500-page PDF with complex layout will silently produce poor extraction. No feedback to user about extraction quality.

### 2. Chunker (`lib/rag/chunker.ts`) — ⚠️ MODERATE RISK

**Functionality:** Splits text into overlapping chunks for embedding.

| Finding | Severity | Impact |
|---------|----------|--------|
| Overlap uses word count, not character count | MEDIUM | Inconsistent overlap size across languages |
| Sentence splitting regex `[.!?]+` is naive | HIGH | Abbreviations (Dr., U.S.A.) cause false splits |
| Single paragraph > 2×chunkSize triggers sentence split | MEDIUM | Can break mid-sentence for very long paragraphs |
| No semantic boundary detection | MEDIUM | Chunks may split mid-concept |
| Overlap from end of previous chunk can duplicate content | LOW | Slightly inflated chunk count |
| Empty text input produces empty array | LOW | No explicit handling |
| `chunkSize=500` default is character-based | LOW | Not token-aware → may exceed embedding model limits |
| No maximum chunk count limit | LOW | Very large documents produce thousands of chunks |

**Key Risk:** A legal document with "U.S.A." and "Dr. Smith" will have sentences split incorrectly, producing semantically incomplete chunks that retrieve well but answer poorly.

### 3. Embedder (`lib/rag/embedder.ts`) — 🔴 HIGH RISK

**Functionality:** Generates embeddings via API or local fallback.

| Finding | Severity | Impact |
|---------|----------|--------|
| **Local fallback uses feature hashing (hashing trick)** | **CRITICAL** | **Poor retrieval quality — not semantic, just lexical** |
| No distinction between "embedding failed" and "no provider" | HIGH | Silent fallback to poor-quality embeddings |
| Local embedding: character trigrams + word tokens | HIGH | No semantic understanding, high collision rate |
| No embedding dimension validation | MEDIUM | API may return different dimensions silently |
| No batch size limit for API calls | MEDIUM | 1000-chunk document = 1000 API calls |
| Fallback is silent (console.warn only) | MEDIUM | User has no indication of quality degradation |
| `providerSupportsEmbeddings()` hardcodes "mimo" | LOW | New providers need manual update |
| No retry on transient API failures | LOW | Single network hiccup = fallback to local |

**Key Risk:** When using Mimo Pro (default provider), ALL embeddings use the local fallback. Retrieval quality is significantly degraded — the system works like a keyword search, not semantic search.

### 4. Vectorstore (`lib/rag/vectorstore.ts`) — ⚠️ MODERATE RISK

**Functionality:** Stores/retrieves chunks via pgvector cosine similarity.

| Finding | Severity | Impact |
|---------|----------|--------|
| Similarity threshold 0.30 may be too low for local embeddings | HIGH | Irrelevant chunks retrieved |
| Deduplication uses content hash (exact match) | MEDIUM | Near-duplicate chunks not caught |
| `fetchLimit = topK * 3` may be insufficient | MEDIUM | After filtering, fewer than topK results |
| Hybrid search falls back silently to vector-only | MEDIUM | User expects hybrid, gets vector |
| `buildMultimodalContext` uses 4 chars/token estimate | MEDIUM | Token budget inaccurate |
| No caching of frequent queries | LOW | Repeated questions re-embed |
| Batch insert size 50 is conservative | LOW | Large documents ingest slowly |

**Key Risk:** With local embeddings + 0.30 threshold, the system may retrieve chunks with 0.35 similarity that are completely irrelevant, leading to hallucinated answers that cite "sources."

### 5. Chain (`lib/rag/chain.ts`) — 🔴 HIGH RISK

**Functionality:** Orchestrates retrieval → context building → AI generation.

| Finding | Severity | Impact |
|---------|----------|--------|
| **System prompt doesn't enforce "only answer from context"** | **CRITICAL** | **AI can hallucinate freely** |
| Temperature 0.7 is too high for factual Q&A | HIGH | Creative but potentially inaccurate answers |
| No source citation verification | HIGH | AI may cite documents not in context |
| `max_tokens: 1000` may truncate complex answers | MEDIUM | Incomplete responses |
| No query preprocessing (spell check, expansion) | MEDIUM | Misspelled queries get poor retrieval |
| No reranking of retrieved chunks | MEDIUM | Top-K by similarity ≠ most relevant |
| Token estimation (4 chars/token) inaccurate | LOW | Context may exceed model limits |
| No conversation history in context | LOW | Multi-turn conversations lose context |

**Hallucination Risk Assessment:**
- The system prompt says "Jika informasi tidak tersedia dalam konteks, katakan bahwa Anda tidak memiliki informasi tersebut" — but this is a soft instruction, not a hard constraint.
- With temperature=0.7, the AI may "creatively" bridge gaps between context chunks.
- No post-generation verification that cited sources actually appear in the context.

## Retrieval Quality Assessment

### Current Pipeline Quality (Estimated)

| Metric | API Embeddings | Local Fallback |
|--------|---------------|----------------|
| Retrieval precision@5 | ~70% | ~35% |
| Retrieval recall@5 | ~60% | ~25% |
| Answer accuracy | ~75% | ~40% |
| Source attribution accuracy | ~65% | ~30% |

### Quality Degradation Factors

1. **Local embeddings** — Feature hashing has no semantic understanding. "car" and "automobile" have zero similarity.
2. **Chunk boundary issues** — Sentences split at wrong boundaries produce incomplete context.
3. **Low similarity threshold** — 0.30 admits irrelevant chunks, diluting context.
4. **No reranking** — Cosine similarity ≠ relevance. A chunk about "Python the snake" may rank higher than "Python the programming language" for the query "Python tutorial."

## Hallucination Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI answers from general knowledge, not context | HIGH | HIGH | Strengthen system prompt |
| AI cites wrong document | MEDIUM | HIGH | Post-generation citation check |
| AI bridges two unrelated chunks | MEDIUM | MEDIUM | Reranking, higher threshold |
| AI generates plausible but incorrect numbers | MEDIUM | HIGH | Temperature reduction |
| AI ignores context entirely | LOW | CRITICAL | Prompt engineering |

## Ingestion Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Empty content stored as "ready" | MEDIUM | MEDIUM | Post-parse validation |
| Malformed PDF produces garbled text | MEDIUM | LOW | Error handling, user feedback |
| Very large document overwhelms system | LOW | HIGH | Chunk count limits |
| Duplicate documents stored separately | MEDIUM | LOW | Content deduplication |
| Image-only PDF stored with empty content | LOW | MEDIUM | OCR fallback |

## Recommendations (Priority Order)

### P0 — Critical (Before Production)
1. **Strengthen system prompt** — Hard constraint: "ONLY answer from provided context. NEVER use general knowledge."
2. **Reduce temperature to 0.3** — Factual Q&A needs deterministic answers
3. **Add post-parse content validation** — Reject empty/whitespace-only content
4. **Add embedding dimension validation** — Verify API returns 1536-dim vectors

### P1 — High (Next Sprint)
5. **Add semantic chunking** — Respect paragraph boundaries, detect code blocks, tables
6. **Improve sentence splitting** — Use NLP-aware splitter (compromise, wink-nlp)
7. **Add embedding retry logic** — Retry 2× before falling back to local
8. **Add reranking** — Cross-encoder reranker for top-K results

### P2 — Medium (Future)
9. **Query preprocessing** — Spell correction, query expansion
10. **Conversation history** — Include previous Q&A in context
11. **Embedding caching** — Cache frequent query embeddings
12. **Hybrid search tuning** — Optimize RRF weights
