# MimoNotes: Retrieval Improvements Without External Embedding Providers

> **Purpose**: All improvements achievable using existing infrastructure (PostgreSQL, pgvector, tsvector, Prisma, Node.js) — no OpenAI, no external embedding API, no new dependencies beyond what's already installed.

---

## Current Baseline (from benchmark)

| Metric | Current Value | Target |
|---|---|---|
| False positive rate | 100% | < 10% |
| Refusal accuracy | 0% | > 80% |
| Avg similarity (positive queries) | 0.3218 | > 0.50 |
| Avg similarity (negative queries) | 0.2800 | < 0.30 |
| Retrieval latency (p50) | 325ms | < 100ms |
| Context relevance | Unknown | > 70% |
| Source attribution | None | Present |
| Chunk deduplication | None | Active |

---

## Improvement #1: HNSW Index on Embedding Column

**Description**: Replace the sequential scan (or ivfflat index) on the `embedding` column with an HNSW (Hierarchical Navigable Small World) index. This dramatically accelerates approximate nearest neighbor (ANN) search for pgvector cosine similarity queries.

**Implementation Approach**:
```sql
-- Migration already prepared at:
-- prisma/migrations/20260613_hnsw_embedding_index/migration.sql

CREATE INDEX CONCURRENTLY IF NOT EXISTS chunk_embedding_hnsw_idx
  ON "Chunk"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);
```
- Apply migration via `npx prisma migrate deploy`
- After index creation, tune `hnsw.ef_search` at session level (default 40, try 100–200 for better recall)
- No application code changes needed

**Expected Impact**:
- Latency: **325ms → < 50ms** (10–50× faster retrieval)
- Throughput: supports concurrent queries without degradation
- Recall: ~95–99% with `ef_search = 100`

**Effort**: **Low** — migration SQL already written, just needs to be applied

**Priority**: **🔴 Critical** — highest ROI, zero application changes

---

## Improvement #2: Adaptive Similarity Threshold + Confidence-Based Refusal

**Description**: Replace the fixed 0.30 threshold with an adaptive threshold system. Queries where the top result similarity is below threshold should be **refused** (the system should say "I don't have information about that" instead of hallucinating from weak matches).

**Implementation Approach**:
```typescript
// In lib/rag/retrieval.ts — searchSimilarChunks()

const HIGH_CONFIDENCE_THRESHOLD = 0.55;  // answer confidently
const LOW_CONFIDENCE_THRESHOLD = 0.40;   // answer with caveats
const REFUSE_THRESHOLD = 0.40;           // refuse to answer

async function searchSimilarChunks(queryEmbedding: number[], userId: string) {
  const results = await prisma.$queryRaw`
    SELECT id, content, source, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM "Chunk"
    WHERE "userId" = ${userId}
      AND 1 - (embedding <=> ${queryEmbedding}::vector) >= ${REFUSE_THRESHOLD}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT 5
  `;

  if (results.length === 0 || results[0].similarity < REFUSE_THRESHOLD) {
    return { refused: true, reason: 'No relevant notes found', results: [] };
  }

  const confidence = results[0].similarity >= HIGH_CONFIDENCE_THRESHOLD
    ? 'high' : 'low';

  return { refused: false, confidence, results };
}
```
- Update system prompt to include refusal behavior
- Add `refused` field to retrieval response type
- In chat handler: if `refused`, return a polite "Maaf, saya tidak menemukan catatan yang relevan dengan pertanyaan Anda."

**Expected Impact**:
- False positive rate: **100% → < 15%**
- Refusal accuracy: **0% → > 80%**
- User trust: significantly improved (system admits when it doesn't know)

**Effort**: **Medium** — requires changes to retrieval.ts, chat handler, and system prompt

**Priority**: **🔴 Critical** — eliminates hallucination from irrelevant matches

---

## Improvement #3: Hybrid Search Tuning

**Description**: The current hybrid search uses `vector_weight=0.6, bm25_weight=0.4`. Tune these weights and improve the BM25 component with better text preprocessing for Indonesian language queries.

**Implementation Approach**:
```typescript
// In lib/rag/hybrid-search.ts

// 1. Tune weights (vector is weak due to feature hashing → boost BM25)
const VECTOR_WEIGHT = 0.4;   // reduced from 0.6
const BM25_WEIGHT = 0.6;     // increased from 0.4

// 2. Add Indonesian stopword removal for BM25 queries
const ID_STOPWORDS = new Set([
  'yang', 'di', 'dan', 'ini', 'itu', 'untuk', 'pada', 'dengan',
  'adalah', 'dari', 'juga', 'akan', 'ke', 'oleh', 'sudah',
  'ada', 'bisa', 'tidak', 'atau', 'lebih', 'jika', 'maka',
  'saya', 'kamu', 'dia', 'mereka', 'kami', 'kita',
]);

function preprocessQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')         // remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 2 && !ID_STOPWORDS.has(w))
    .join(' ');
}

// 3. Use ts_rank_cd normalization (already in place, verify flags = 32)
// ts_rank_cd(search_vector, query, 32)  -- normalization: divide by rank/(rank+1)

// 4. Reciprocal Rank Fusion (RRF) with tuned k
const RRF_K = 60;  // standard value, test with 30–100
```

**Expected Impact**:
- BM25 accuracy for keyword queries: **significant improvement**
- Hybrid search relevance: **15–25% better** than current weights
- Indonesian language queries: better matching due to stopword removal

**Effort**: **Medium** — requires tuning, A/B testing of weight combinations

**Priority**: **🟡 High** — leverages existing hybrid search infrastructure

---

## Improvement #4: Chunk Deduplication

**Description**: When multiple chunks from the same or overlapping document segments are retrieved, deduplicate them to avoid wasting context window on redundant information.

**Implementation Approach**:
```typescript
// In lib/rag/context-building.ts

function deduplicateChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Map<string, RetrievedChunk>();

  for (const chunk of chunks) {
    // Normalize for comparison
    const normalized = chunk.content
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    // Check for exact or near-exact duplicates (>90% overlap)
    let isDuplicate = false;
    for (const [key, existing] of seen) {
      const overlap = calculateOverlap(normalized, key);
      if (overlap > 0.90) {
        // Keep the one with higher similarity
        if (chunk.similarity > existing.similarity) {
          seen.delete(key);
          seen.set(normalized, chunk);
        }
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(normalized, chunk);
    }
  }

  return Array.from(seen.values());
}

function calculateOverlap(a: string, b: string): number {
  const wordsA = new Set(a.split(' '));
  const wordsB = new Set(b.split(' '));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return intersection.size / union.size; // Jaccard similarity
}
```

**Expected Impact**:
- Context quality: **reduced noise from duplicate content**
- Token efficiency: **10–20% more unique information** in same context budget
- Answer quality: less repetition in generated responses

**Effort**: **Low** — pure application-level filter, no DB changes

**Priority**: **🟢 Medium** — quality improvement, not correctness-critical

---

## Improvement #5: Context Packing with Source Attribution

**Description**: When building the multimodal context, add structured headers with document title and similarity score. This helps the LLM understand provenance and confidence, and enables source citation in answers.

**Implementation Approach**:
```typescript
// In lib/rag/context-building.ts — buildMultimodalContext()

function buildMultimodalContext(chunks: RetrievedChunk[]): string {
  let context = '';
  let tokenCount = 0;
  const MAX_TOKENS = 3000;

  for (const chunk of chunks) {
    const similarityPercent = Math.round(chunk.similarity * 100);
    const header = `[Sumber: ${chunk.documentTitle || 'Tanpa Judul'}] [Kesesuaian: ${similarityPercent}%]\n`;
    const content = chunk.content + '\n\n';
    const chunkTokens = estimateTokens(header + content);

    if (tokenCount + chunkTokens > MAX_TOKENS) break;

    context += header + content;
    tokenCount += chunkTokens;
  }

  return context.trim();
}

function estimateTokens(text: string): number {
  // ~4 chars per token for mixed Indonesian/English
  return Math.ceil(text.length / 4);
}
```

**Expected Impact**:
- Source transparency: users and LLM know where info comes from
- LLM grounding: similarity score helps LLM gauge confidence
- Debugging: easier to trace which chunks contributed to an answer

**Effort**: **Low** — simple string formatting change

**Priority**: **🟡 High** — directly improves answer quality and debuggability

---

## Improvement #6: Query Preprocessing for BM25

**Description**: Preprocess user queries before BM25 full-text search to improve tsvector matching. Includes lowercasing, punctuation removal, stemming-like normalization, and query expansion.

**Implementation Approach**:
```typescript
// In lib/rag/query-preprocessing.ts

function preprocessForBM25(query: string): string {
  let processed = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')      // remove punctuation
    .replace(/\s+/g, ' ')           // normalize whitespace
    .trim();

  // Remove Indonesian stopwords (see Improvement #3 for full list)
  processed = removeStopwords(processed);

  // Simple Indonesian suffix stripping (light stemming)
  processed = lightStem(processed);

  return processed;
}

function lightStem(text: string): string {
  return text
    .replace(/(\w+)kan\b/g, '$1')   // -kan suffix
    .replace(/(\w+)i\b/g, '$1')     // -i suffix
    .replace(/(\w+)an\b/g, '$1')    // -an suffix (careful: can over-stem)
    .replace(/ber(\w+)/g, '$1')     // ber- prefix
    .replace(/me(\w+)/g, '$1')      // me- prefix
    .replace(/pe(\w+)/g, '$1');     // pe- prefix
}

// Usage: generate tsvector from preprocessed query, not raw query
const processedQuery = preprocessForBM25(userQuery);
const tsQuery = processedQuery.split(' ').join(' | '); // OR for broad matching
```

**Expected Impact**:
- BM25 recall for Indonesian queries: **20–40% improvement**
- Morphological variants: "membaca" matches "baca", "pembacaan"
- Better coverage for colloquial Indonesian queries

**Effort**: **Medium** — requires careful testing to avoid over-stemming

**Priority**: **🟡 High** — especially important for Indonesian language support

---

## Improvement #7: Context Compression

**Description**: After retrieving chunks, compress redundant sentences across chunks while preserving unique information. This maximizes the useful information within the 3000-token context budget.

**Implementation Approach**:
```typescript
// In lib/rag/context-compression.ts

function compressContext(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const allSentences: { text: string; chunkIdx: number; similarity: number }[] = [];

  // Split each chunk into sentences
  chunks.forEach((chunk, idx) => {
    const sentences = chunk.content
      .split(/[.!?]\s+/)
      .filter(s => s.trim().length > 10);
    sentences.forEach(s => {
      allSentences.push({
        text: s.trim(),
        chunkIdx: idx,
        similarity: chunk.similarity,
      });
    });
  });

  // Remove near-duplicate sentences across chunks
  const unique: typeof allSentences = [];
  for (const sentence of allSentences) {
    const isDup = unique.some(existing =>
      jaccardSimilarity(existing.text, sentence.text) > 0.80
    );
    if (!isDup) {
      unique.push(sentence);
    }
  }

  // Reconstruct chunks from unique sentences
  // Group by chunkIdx, preserve order
  const chunkMap = new Map<number, string[]>();
  for (const s of unique) {
    if (!chunkMap.has(s.chunkIdx)) chunkMap.set(s.chunkIdx, []);
    chunkMap.get(s.chunkIdx)!.push(s.text);
  }

  return chunks.map((chunk, idx) => ({
    ...chunk,
    content: (chunkMap.get(idx) || [chunk.content]).join('. ') + '.',
  }));
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter(w => setB.has(w)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
```

**Expected Impact**:
- Context efficiency: **15–25% more unique content** in same token budget
- Answer quality: less repetition, more coverage
- Token waste reduction: duplicate sentences eliminated

**Effort**: **Medium** — sentence splitting for Indonesian needs testing

**Priority**: **🟢 Medium** — quality improvement, diminishing returns if chunks are already diverse

---

## Improvement #8: Multi-Query Expansion

**Description**: Generate multiple query variants from the user's original query to improve recall. Different phrasings may match different relevant chunks.

**Implementation Approach**:
```typescript
// In lib/rag/query-expansion.ts

function expandQuery(originalQuery: string): string[] {
  const queries: string[] = [originalQuery];

  // 1. Synonym expansion (Indonesian)
  const synonyms: Record<string, string[]> = {
    'bagaimana': ['cara', 'metode', 'langkah'],
    'apa': ['siapa', 'hal', 'tentang'],
    'kenapa': ['mengapa', 'alasan', 'sebab'],
    'kapan': ['waktu', 'tanggal', 'hari'],
    'dimana': ['di mana', 'lokasi', 'tempat'],
  };

  let expanded = originalQuery.toLowerCase();
  for (const [word, syns] of Object.entries(synonyms)) {
    if (expanded.includes(word)) {
      for (const syn of syns.slice(0, 2)) { // max 2 synonyms
        queries.push(expanded.replace(word, syn));
      }
    }
  }

  // 2. Keyword extraction (remove question words, keep nouns)
  const questionWords = ['apa', 'siapa', 'bagaimana', 'mengapa', 'kenapa',
    'kapan', 'dimana', 'berapa', 'yang', 'adalah'];
  const keywords = originalQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(w => !questionWords.includes(w) && w.length > 2);
  if (keywords.length > 0) {
    queries.push(keywords.join(' '));
  }

  return [...new Set(queries)].slice(0, 3); // max 3 variants
}

// Usage: run all variants through retrieval, merge & re-rank results
async function multiQuerySearch(userId: string, query: string) {
  const embedding = await generateEmbedding(query);
  const variants = expandQuery(query);

  // Primary: vector search with original query
  const vectorResults = await searchSimilarChunks(embedding, userId);

  // Secondary: BM25 with each variant
  const bm25Results = await Promise.all(
    variants.map(v => bm25Search(v, userId))
  );

  // Merge via RRF
  return reciprocalRankFusion([vectorResults, ...bm25Results]);
}
```

**Expected Impact**:
- Recall: **10–20% improvement** for phrased-differently queries
- Robustness: handles varied Indonesian phrasings
- Minimal latency increase: BM25 is fast, variants are parallel

**Effort**: **Medium** — needs synonym dictionary and merge logic

**Priority**: **🟢 Medium** — good for recall, less critical than threshold tuning

---

## Improvement #9: Reranking with Cross-Encoder (Local)

**Description**: After initial retrieval (top-K from vector + BM25), rerank results using a lightweight cross-encoder approach. Since we can't use external models, implement a **rule-based reranker** using query-chunk feature scoring.

**Implementation Approach**:
```typescript
// In lib/rag/reranker.ts

interface RerankFeatures {
  vectorSimilarity: number;    // from pgvector
  bm25Score: number;           // from ts_rank_cd
  queryTermCoverage: number;   // % of query terms found in chunk
  chunkLength: number;         // prefer medium-length chunks
  documentRecency: number;     // newer documents score higher
  keywordDensity: number;      // query keyword frequency in chunk
}

function rerank(chunks: RetrievedChunk[], query: string): RetrievedChunk[] {
  const queryTerms = query.toLowerCase().split(/\s+/);

  const scored = chunks.map(chunk => {
    const contentLower = chunk.content.toLowerCase();

    // Feature: query term coverage
    const termsFound = queryTerms.filter(t => contentLower.includes(t)).length;
    const termCoverage = termsFound / queryTerms.length;

    // Feature: keyword density
    const termOccurrences = queryTerms.reduce((sum, t) => {
      const matches = contentLower.split(t).length - 1;
      return sum + matches;
    }, 0);
    const keywordDensity = termOccurrences / (chunk.content.split(/\s+/).length || 1);

    // Feature: length penalty (prefer 100–500 words)
    const wordCount = chunk.content.split(/\s+/).length;
    const lengthScore = wordCount >= 100 && wordCount <= 500 ? 1.0 :
      wordCount < 100 ? 0.7 : 0.8;

    // Weighted combination
    const rerankScore =
      chunk.similarity * 0.30 +      // vector similarity
      (chunk.bm25Score || 0) * 0.20 + // BM25 score
      termCoverage * 0.30 +           // term coverage (most important)
      keywordDensity * 0.10 +         // keyword density
      lengthScore * 0.10;             // length preference

    return { ...chunk, rerankScore };
  });

  return scored.sort((a, b) => b.rerankScore - a.rerankScore);
}
```

**Expected Impact**:
- Precision: **10–20% improvement** in chunk relevance ordering
- Better handling of cases where vector similarity is misleading
- No external model dependency

**Effort**: **Medium** — requires tuning feature weights

**Priority**: **🟡 High** — significant quality improvement without model dependency

---

## Improvement #10: Chunk Metadata Enrichment

**Description**: Enrich chunk metadata to improve filtering and context quality. Add document-level metadata (title, category, creation date) to each chunk during retrieval.

**Implementation Approach**:
```typescript
// In lib/rag/retrieval.ts

async function searchSimilarChunksEnriched(embedding: number[], userId: string) {
  return prisma.$queryRaw`
    SELECT
      c.id,
      c.content,
      c."documentId",
      c."chunkIndex",
      c.metadata,
      d.title AS "documentTitle",
      d.category AS "documentCategory",
      d."createdAt" AS "documentCreatedAt",
      1 - (c.embedding <=> ${embedding}::vector) AS similarity
    FROM "Chunk" c
    JOIN "Document" d ON c."documentId" = d.id
    WHERE c."userId" = ${userId}
      AND 1 - (c.embedding <=> ${embedding}::vector) >= 0.40
    ORDER BY c.embedding <=> ${embedding}::vector
    LIMIT 10
  `;
}
```

**Expected Impact**:
- Context quality: LLM knows document source and category
- Filtering: can exclude old or irrelevant categories
- Attribution: answers can cite specific documents

**Effort**: **Low** — just a query change with JOIN

**Priority**: **🟢 Medium** — quality improvement

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1) — Do These First
| # | Improvement | Effort | Impact |
|---|---|---|---|
| 1 | HNSW Index | Low | 🔴 Critical |
| 2 | Adaptive Threshold + Refusal | Medium | 🔴 Critical |
| 5 | Context Packing with Attribution | Low | 🟡 High |

**Expected outcome**: Latency < 50ms, false positive rate < 15%, refusal works

### Phase 2: Quality (Week 2)
| # | Improvement | Effort | Impact |
|---|---|---|---|
| 3 | Hybrid Search Tuning | Medium | 🟡 High |
| 6 | Query Preprocessing (BM25) | Medium | 🟡 High |
| 9 | Rule-Based Reranker | Medium | 🟡 High |

**Expected outcome**: Better relevance, Indonesian language support improved

### Phase 3: Polish (Week 3)
| # | Improvement | Effort | Impact |
|---|---|---|---|
| 4 | Chunk Deduplication | Low | 🟢 Medium |
| 7 | Context Compression | Medium | 🟢 Medium |
| 8 | Multi-Query Expansion | Medium | 🟢 Medium |
| 10 | Chunk Metadata Enrichment | Low | 🟢 Medium |

**Expected outcome**: Maximum quality from feature-hashing embeddings

---

## Expected Combined Impact

| Metric | Current | After Phase 1 | After Phase 2 | After Phase 3 |
|---|---|---|---|---|
| False positive rate | 100% | < 15% | < 10% | < 5% |
| Refusal accuracy | 0% | > 80% | > 85% | > 90% |
| Latency (p50) | 325ms | < 50ms | < 50ms | < 60ms |
| Context relevance | Unknown | > 50% | > 65% | > 75% |
| Source attribution | None | ✅ Present | ✅ Present | ✅ Rich |
| Deduplication | None | None | Partial | ✅ Full |

---

## What These Improvements Cannot Fix

These improvements optimize retrieval **around** feature hashing, but cannot fundamentally solve its limitations:

- **Semantic understanding**: Feature hashing cannot capture "mahasiswa" ≈ "student" or "pembelajaran" ≈ "belajar"
- **Cross-lingual**: Cannot match Indonesian query to English content or vice versa
- **Paraphrasing**: "Apa itu X?" and "Jelaskan tentang X" may not match
- **Long-form reasoning**: Cannot understand complex multi-sentence queries

To address these, external embedding providers (OpenAI, Cohere, etc.) or self-hosted models (sentence-transformers, nomic-embed) would be needed — see `RETRIEVAL_IMPROVEMENTS_WITH_EMBEDDINGS.md` (future).

---

## Monitoring & Validation

After each phase, run the benchmark suite:
```bash
cd mimotes
npm run benchmark:retrieval
```

Key metrics to track:
- **Precision@5**: Of top 5 results, how many are relevant?
- **Recall@5**: Of all relevant chunks, how many appear in top 5?
- **Refusal rate**: % of queries correctly refused
- **False positive rate**: % of irrelevant queries that got answered
- **p50/p95 latency**: Retrieval speed
- **Context utilization**: % of context budget used by relevant content

---

*Generated: 2026-06-13 | MimoNotes RAG Optimization*
