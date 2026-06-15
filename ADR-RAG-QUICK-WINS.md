# ADR-RAG-QUICK-WINS: RAG Quality Quick Wins

**Status:** Accepted  
**Date:** 2026-06-13  
**Deciders:** Sprint 5A  
**Technical Story:** Highest-impact RAG quality improvements from reliability audit

## Context

The RAG Reliability Audit identified several high-impact issues that could be fixed with minimal code changes:

1. **Hallucination risk** — System prompt was soft ("gunakan konteks berikut") instead of hard ("HANYA dari konteks")
2. **Temperature too high** — 0.7 encourages creative but potentially inaccurate answers
3. **Silent empty content** — Malformed files stored as "ready" with empty content
4. **No embedding dimension validation** — API could return wrong-dimension vectors silently
5. **Silent quality degradation** — No indication when local embeddings are used

## Decision

Implement 5 quick wins that address the highest-impact RAG quality issues:

### 1. System Prompt Grounding

**Before:**
```
Anda adalah asisten AI yang membantu menjawab pertanyaan berdasarkan dokumen yang tersedia.
Gunakan konteks berikut untuk menjawab pertanyaan. Jika informasi tidak tersedia dalam konteks, katakan bahwa Anda tidak memiliki informasi tersebut.
```

**After:**
```
Anda adalah asisten AI yang HANYA menjawab berdasarkan konteks dokumen yang diberikan.

ATURAN KETAT:
1. HANYA gunakan informasi yang ada dalam konteks dokumen di bawah ini. JANGAN gunakan pengetahuan umum Anda.
2. Jika informasi yang diminta TIDAK ADA dalam konteks, jawab: "Informasi tersebut tidak tersedia dalam dokumen yang saya miliki."
3. JANGAN mengarang, menduga, atau mengisi kekosongan informasi dari pengetahuan umum.
4. SELALU kutip sumber dengan format [Document: nama_dokumen] untuk setiap fakta yang Anda sebutkan.
5. Jika hanya sebagian informasi yang tersedia, sampaikan HANYA bagian yang tersedia dan sebutkan keterbatasannya.
```

### 2. Temperature Reduction

- **Before:** `temperature: 0.7` (creative, variable answers)
- **After:** `temperature: 0.3` (deterministic, factual answers)

### 3. Post-Parse Content Validation

- Added empty content detection after parsing
- Logs warning when file produces empty content
- Helps diagnose extraction issues early

### 4. Embedding Dimension Validation

- Validates API returns 1536-dimension vectors
- Falls back to local embedding if dimension mismatch
- Prevents corrupted vectors from being stored

### 5. Fallback Logging

- Clear warning when local embeddings are active
- Explains quality degradation impact
- Guides user to configure proper embedding provider

## Consequences

### Positive
- Significantly reduced hallucination risk
- More deterministic, factual answers
- Early detection of parsing issues
- Protection against dimension mismatches
- Clear visibility into embedding quality

### Negative
- Temperature 0.3 may produce slightly less natural responses
- Stricter prompt may cause more "information not available" responses
- Console warnings may be noisy during development

## References

- [RAG_RELIABILITY_AUDIT.md](../RAG_RELIABILITY_AUDIT.md)
- [RAG_IMPROVEMENT_ROADMAP.md](../RAG_IMPROVEMENT_ROADMAP.md)
