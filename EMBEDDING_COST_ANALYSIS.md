# MimoNotes Embedding Cost Analysis

> Comprehensive analysis of embedding operational costs for the MimoNotes RAG pipeline.
> Generated: June 2025

---

## 1. Current State

| Metric                        | Value         |
|-------------------------------|---------------|
| Total chunks                  | 107,571       |
| Documents                     | 35            |
| Workspaces                    | 5             |
| Current embedding method      | Feature hashing (free) |
| Estimated avg tokens/chunk    | ~500          |
| Total estimated tokens        | ~53.8M        |

---

## 2. Provider Pricing (per 1M tokens)

| Provider                        | Model                   | Price / 1M tokens | Notes                                 |
|---------------------------------|-------------------------|--------------------|---------------------------------------|
| OpenAI                         | text-embedding-3-small  | $0.02              | Best cost/quality ratio               |
| OpenAI                         | text-embedding-3-large  | $0.13              | Highest quality, 3072-dim             |
| Gemini                         | text-embedding-004      | Free tier          | 1,500 req/day free, then ~$0.10/1M    |
| OpenRouter                     | Various (cheapest)      | ~$0.02             | Varies by underlying model            |
| Ollama (local)                 | nomic-embed-text, etc.  | Free               | Compute cost only (CPU/GPU)           |
| Feature Hashing                | N/A                     | Free               | Current method, no quality guarantee  |

---

## 3. Scenario 1: Initial Re-Embedding of Existing 107K Chunks

Re-embedding all existing chunks with a real embedding model (migrating from feature hashing).

**Token calculation:**
- 107,571 chunks × ~500 tokens/chunk = **~53.8M tokens**

| Provider / Model              | Cost        | Time Estimate        |
|-------------------------------|-------------|----------------------|
| Feature Hashing (current)     | $0.00       | Instant (in-process) |
| OpenAI text-embedding-3-small | **~$1.08**  | ~5-10 min (batched)  |
| OpenAI text-embedding-3-large | **~$6.99**  | ~10-20 min (batched) |
| Gemini text-embedding-004     | **~$0.00*** | ~72 days @ 1500/day  |
| Ollama (local)                | $0.00       | ~2-6 hours (CPU)     |
| OpenRouter (cheapest)         | ~$1.08      | Varies               |

> **Gemini note:** The free tier allows ~1,500 requests/day. With batch embedding (up to 2048 chunks per request), this would take ~53 requests total — easily within free tier limits for a one-time migration. The real constraint is rate limiting, not cost.

**Recommendation:** OpenAI text-embedding-3-small offers the best balance at **$1.08** for the full migration.

---

## 4. Scenario 2: Ongoing Embedding for New Documents

**Assumptions:**
- Average new document: ~100 chunks × 500 tokens = **50K tokens per document**

| Provider / Model              | Cost per Document |
|-------------------------------|-------------------|
| Feature Hashing               | $0.00             |
| OpenAI text-embedding-3-small | **$0.001**        |
| OpenAI text-embedding-3-large | **$0.0065**       |
| Gemini text-embedding-004     | ~$0.00 (free tier)|
| Ollama (local)                | $0.00             |

> At $0.001 per document, embedding costs are negligible for individual uploads.

---

## 5. Scenario 3: Monthly Operational Cost

**Assumptions:**
- 10 new documents per month per workspace
- 5 workspaces active
- Total: **50 new documents/month**

**Token calculation:**
- 50 docs × 100 chunks × 500 tokens = **2.5M tokens/month**

| Provider / Model              | Monthly Cost  | Annual Cost  |
|-------------------------------|---------------|--------------|
| Feature Hashing               | $0.00         | $0.00        |
| OpenAI text-embedding-3-small | **$0.05**     | **$0.60**    |
| OpenAI text-embedding-3-large | **$0.33**     | **$3.90**    |
| Gemini text-embedding-004     | ~$0.00        | ~$0.00       |
| Ollama (local)                | $0.00         | $0.00        |

> Monthly embedding costs are **trivially small** — well under $1/month even with OpenAI's most expensive model.

---

## 6. Scenario 4: Query-Time Embedding

Each search query requires an embedding for similarity search.

**Assumptions:**
- Average query: ~20 tokens
- 1,000 queries/month across all workspaces
- Total: **20K tokens/month**

| Provider / Model              | Monthly Cost  | Annual Cost  |
|-------------------------------|---------------|--------------|
| OpenAI text-embedding-3-small | **$0.0004**   | **$0.005**   |
| OpenAI text-embedding-3-large | **$0.003**    | **$0.03**    |

> Query embedding costs are **negligible** — effectively zero.

---

## 7. Total Monthly Cost Summary (Steady State)

Combining document embedding + query embedding:

| Provider / Model              | Doc Embedding | Query Embedding | **Total/Month** | **Total/Year** |
|-------------------------------|---------------|-----------------|-----------------|----------------|
| Feature Hashing               | $0.00         | $0.00           | **$0.00**       | **$0.00**      |
| OpenAI text-embedding-3-small | $0.05         | $0.0004         | **$0.05**       | **$0.60**      |
| OpenAI text-embedding-3-large | $0.33         | $0.003          | **$0.33**       | **$3.90**      |
| Gemini text-embedding-004     | ~$0.00        | ~$0.00          | **~$0.00**      | **~$0.00**     |
| Ollama (local)                | $0.00         | $0.00           | **$0.00**       | **$0.00**      |

---

## 8. Free Tier Limits

### Gemini text-embedding-004
- **Free tier:** 1,500 requests/day
- **Batch support:** Up to 2,048 texts per request
- **Effective capacity:** ~3M chunks/day in batch mode
- **Monthly free capacity:** ~90M chunks (more than enough)
- **Catch:** Rate-limited; high-volume re-embedding may hit daily limits
- **After free tier:** ~$0.0001/1K tokens = $0.10/1M tokens

### OpenAI Free Tier
- **$5 free credits** for new accounts (valid 3 months)
- **text-embedding-3-small:** Can embed ~250M tokens with $5
- **Sufficient for:** Full migration (53.8M tokens = $1.08) + years of operation

### Ollama (Local)
- **Completely free** — no API costs
- **Cost is compute:** CPU/GPU time, electricity
- **Typical:** ~$0.01-0.05 in electricity per 1M tokens (varies by hardware)

---

## 9. Break-Even Analysis: BYOK vs Pro Tier

Assuming a hypothetical MimoNotes "Pro" tier that includes embedding:

| Scenario                          | BYOK Monthly | Pro Tier (est.) | Break-Even      |
|-----------------------------------|--------------|------------------|-----------------|
| Light usage (5 docs/mo, 1 WS)    | $0.005       | $5-10/mo         | Never (BYOK wins) |
| Medium usage (50 docs/mo, 5 WS)  | $0.05        | $5-10/mo         | Never (BYOK wins) |
| Heavy usage (500 docs/mo, 20 WS) | $0.50        | $5-10/mo         | Never (BYOK wins) |
| Enterprise (5000 docs/mo, 100 WS)| $5.00        | $5-10/mo         | ~5000 docs/mo   |

**Key insight:** Embedding costs are so low (~$0.001/doc) that they are **never the deciding factor** in BYOK vs managed pricing. The value of a Pro tier would come from:
- LLM inference costs (orders of magnitude higher)
- Infrastructure & management
- Support & SLA

> **Embedding alone does not justify a Pro tier markup.** BYOK is always cheaper for embedding.

---

## 10. Scaling Projections

How costs grow with scale:

| Scale              | Chunks    | Docs    | WS  | Tokens/Mo | OpenAI Small/Mo |
|--------------------|-----------|---------|-----|-----------|-----------------|
| Current            | 107K      | 35      | 5   | —         | —               |
| + 6 months         | 160K      | 65      | 5   | 2.5M      | $0.05           |
| + 1 year           | 220K      | 95      | 8   | 4.0M      | $0.08           |
| + 2 years          | 400K      | 175     | 15  | 7.5M      | $0.15           |
| Enterprise (10x)   | 1M+       | 350+    | 50+ | 25M       | $0.50           |

> Even at 10x current scale, monthly embedding costs remain **under $1.00**.

---

## 11. Recommendations

### Default Provider by Tier

| Tier          | Recommended Embedding Provider    | Rationale                                      |
|---------------|------------------------------------|------------------------------------------------|
| Free/Self-host| **Feature Hashing** or **Ollama**  | Zero cost, works offline                       |
| Starter       | **Gemini text-embedding-004**     | Free tier covers light usage; 768-dim quality   |
| Pro           | **OpenAI text-embedding-3-small** | $0.02/1M tokens, 1536-dim, best cost/quality   |
| Enterprise    | **OpenAI text-embedding-3-large** | $0.13/1M tokens, 3072-dim, highest quality     |

### Migration Strategy

1. **Phase 1:** Keep feature hashing for existing chunks (no quality regression risk)
2. **Phase 2:** Embed new documents with real embeddings (dual-mode)
3. **Phase 3:** Background re-embed existing 107K chunks ($1.08 one-time with OpenAI small)
4. **Phase 4:** Switch fully to real embeddings, drop feature hashing

### Key Takeaways

- **Embedding costs are negligible.** Even at enterprise scale, they're < $1/month
- **The real cost driver is LLM inference**, not embedding
- **Feature hashing is a valid zero-cost option** for budget-constrained deployments
- **OpenAI text-embedding-3-small** is the recommended default ($1.08 to embed everything)
- **Gemini free tier** is viable for small deployments (up to ~3M chunks/day in batch)
- **BYOK is always cheaper** for embedding costs alone

---

## Appendix: Detailed Math

### Token Estimation Methodology
- Average English word: ~1.3 tokens (OpenAI tokenizer)
- Average chunk content: ~385 words × 1.3 = ~500 tokens
- This is a conservative estimate; actual chunks may vary

### Batch Embedding Efficiency
- OpenAI: max 2,048 inputs per request
- 107,571 chunks ÷ 2,048 = **53 batch requests** for full migration
- Gemini: max 2,048 inputs per request (similar)

### Cost Formula
```
Cost = (chunks × tokens_per_chunk) / 1,000,000 × price_per_1M_tokens
```

### Example: OpenAI text-embedding-3-small
```
Cost = (107,571 × 500) / 1,000,000 × $0.02
     = 53,785,500 / 1,000,000 × $0.02
     = 53.786 × $0.02
     = $1.08
```

---

*This analysis reflects pricing as of June 2025. Verify current rates with providers before making purchasing decisions.*
