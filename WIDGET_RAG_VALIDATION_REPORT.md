# Widget RAG Validation Report

**Date:** 2026-06-15
**Environment:** Production (https://mimotes.ekohomelab.online)
**Widget:** Investor Demo Widget (pw_pub_8uueEHl0Ze3n7yUqLkCuBP8ONRoZUG3GHBMEdz7wxm4)
**Workspace:** Admin's Workspace (18ab20a2-41dc-4941-bd77-7b677c9ccf49)
**Method:** Playwright browser automation + curl API testing

---

## Corpus Status

| Metric | Value |
|--------|-------|
| Total documents | 135 |
| PDF documents | 11 (PostgreSQL 9.6–18) |
| TXT documents | 105 |
| DOCX documents | 5 |
| Image documents | 14 |
| Total chunks | 108,674 |
| Chunks with embeddings | 108,674 (100%) |

---

## RAG Test Results

### Query 1: "What is PostgreSQL?"

| Aspect | Result | Status |
|--------|--------|--------|
| Response received | ✅ | Streaming response |
| PostgreSQL mentioned | ✅ | Response contains "PostgreSQL" |
| Sources returned | ✅ | 5 sources |
| Top source | postgresql-10-US.pdf | similarity: 0.5217 |
| Second source | postgresql-17-US.pdf | similarity: 0.4924 |
| Streaming chunks | ✅ | Multiple SSE chunk events |

**Top 5 Sources:**

| # | Document | Similarity | Chunk |
|---|----------|------------|-------|
| 1 | postgresql-10-US.pdf | 0.5217 | 6208 |
| 2 | postgresql-17-US.pdf | 0.4924 | 7234 |
| 3 | postgresql-9.6-US.pdf | 0.4915 | 5846 |
| 4 | postgresql-10-US.pdf | 0.4893 | 5811 |
| 5 | postgresql-16-US.pdf | 0.4814 | 7050 |

---

### Query 2: "Explain VACUUM in PostgreSQL"

| Aspect | Result | Status |
|--------|--------|--------|
| Response received | ✅ | Streaming response |
| VACUUM mentioned | ✅ | Response contains "VACUUM" |
| Response length | 546 chars | Substantive answer |
| Latency | 12,578ms | Acceptable for RAG |

---

### Query 3: "What changed in PostgreSQL 17?"

| Aspect | Result | Status |
|--------|--------|--------|
| Response received | ✅ | Streaming response |
| PostgreSQL 17 mentioned | ✅ | Response references PG 17 |
| Streaming chunks | ✅ | Multiple SSE events |

---

## Streaming Verification

| Test | Result |
|------|--------|
| SSE endpoint accessible | ✅ |
| 3 streaming requests made | ✅ |
| Chunk events received | ✅ |
| Sources event received | ✅ |
| Done event received | ✅ |
| Fallback to non-streaming | ✅ (also tested) |

---

## Confidence Analysis

| Query | Max Similarity | Confidence Level | Refused? |
|-------|---------------|------------------|----------|
| What is PostgreSQL? | 0.5217 | medium | No |
| Explain VACUUM | ~0.50 | medium | No |
| PostgreSQL 17 changes | ~0.49 | medium | No |

**Note:** Similarity scores are in the 0.48–0.52 range (medium confidence). This is expected with feature-hashing embeddings. Neural embeddings would produce higher scores (0.70+).

---

## Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| RAG Retrieval | 3 | 3 | 0 |
| Source Citations | 3 | 3 | 0 |
| Streaming | 3 | 3 | 0 |
| Confidence | 3 | 3 | 0 |
| **TOTAL** | **12** | **12** | **0** |

**Verdict:** All 12 RAG tests passed. The widget correctly retrieves, cites, and streams RAG responses from real PostgreSQL documents.
