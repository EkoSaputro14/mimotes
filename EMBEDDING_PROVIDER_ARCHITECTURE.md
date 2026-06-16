# EMBEDDING PROVIDER ARCHITECTURE

**Status:** Proposed  
**Date:** 2026-06-13  
**Layer:** `lib/rag/embedding-providers/`  
**Scope:** Abstraction layer for multi-provider embedding in MimoNotes RAG pipeline

---

## 1. Problem Statement

The current `lib/rag/embedder.ts` is tightly coupled to a single provider pattern: it uses the global `getAIProvider()` OpenAI client and falls back to local feature hashing when the provider doesn't support embeddings. This creates several issues:

- **No per-workspace embedding selection** — all workspaces share the same embedding provider
- **Dimension mismatches are fatal** — providers returning non-1536d vectors trigger fallback instead of adaptation
- **No cost tracking** — embedding API calls are invisible to the billing layer
- **No provider-specific optimization** — batch sizes, rate limits, and retry strategies are identical regardless of provider

## 2. Goals

1. Support 5 embedding providers behind a unified interface
2. All output vectors MUST be 1536-dimensional (pgvector `vector(1536)` column constraint)
3. Per-workspace provider selection via `workspace_settings`
4. Graceful degradation: requested provider → feature hashing fallback
5. Preserve existing retry logic, batch support, and quality stats
6. Add cost tracking hooks for billing integration

## 3. Provider Inventory

| Provider | Native Dim | Strategy | Cost | API Key Required |
|---|---|---|---|---|
| `feature_hashing` | 1536 | Direct (no adaptation) | Free | No |
| `openai` | 1536 | Direct (exact match) | $0.02/1M tokens | Yes |
| `gemini` | 768 | Pad to 1536 (zero-fill) | Free tier / paid | Yes |
| `openrouter` | Varies | Proxy → adapt per model | Varies | Yes |
| `ollama` | 768 | Pad to 1536 (zero-fill) | Free (local) | No |

### 3.1 Dimension Mismatch Handling

```
pgvector column: vector(1536) — IMMUTABLE constraint

Provider returns 1536d → use directly
Provider returns <1536d → zero-pad trailing dimensions
Provider returns >1536d → truncate to 1536d (warn)
Provider returns unknown → fallback to feature hashing
```

**Zero-padding strategy** (preferred over truncation):
```typescript
function adaptDimension(vector: number[], targetDim: number): number[] {
  if (vector.length === targetDim) return vector;
  if (vector.length > targetDim) {
    console.warn(`[EmbeddingProvider] Truncating ${vector.length}d → ${targetDim}d`);
    return vector.slice(0, targetDim);
  }
  // Zero-pad
  const padded = new Array(targetDim).fill(0);
  for (let i = 0; i < vector.length; i++) padded[i] = vector[i];
  return padded;
}
```

**Why zero-padding over re-creation:**
- Recreating `vector(1536)` to `vector(768)` would break all existing embeddings
- Zero-padding preserves cosine similarity semantics (padding dimensions contribute 0 to dot product)
- L2 normalization after padding maintains unit vectors
- Truncation (for >1536d) loses information but is the only option

## 4. Class Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   EmbeddingProvider (interface)              │
├─────────────────────────────────────────────────────────────┤
│ + embed(text: string): Promise<number[]>                    │
│ + embedBatch(texts: string[]): Promise<number[][]>          │
│ + getDimension(): number                                    │
│ + isAvailable(): Promise<boolean>                           │
│ + getName(): string                                         │
│ + getCostPerMillionTokens(): number | null                  │
└─────────────────────┬───────────────────────────────────────┘
                      │ implements
        ┌─────────────┼─────────────┬──────────────┬──────────────────┐
        │             │             │              │                  │
        ▼             ▼             ▼              ▼                  ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────────┐
│ FeatureHash  │ │ OpenAI   │ │ Gemini   │ │ OpenRouter │ │ Ollama          │
│ Provider     │ │ Provider │ │ Provider │ │ Provider   │ │ Provider        │
├──────────────┤ ├──────────┤ ├──────────┤ ├────────────┤ ├─────────────────┤
│ dim: 1536    │ │ dim: 1536│ │ dim: 768 │ │ dim: varies│ │ dim: 768        │
│ cost: null   │ │ cost: 0.02│ │ cost: 0  │ │ cost: var  │ │ cost: null      │
│ local,always │ │ API key  │ │ API key  │ │ API key    │ │ local, no key   │
│ available    │ │ required │ │ required │ │ required   │ │                 │
└──────────────┘ └──────────┘ └──────────┘ └────────────┘ └─────────────────┘
        │             │             │              │                  │
        └─────────────┴──────┬──────┴──────────────┴──────────────────┘
                             │ wrapped by
                             ▼
                  ┌─────────────────────┐
                  │ DimensionAdapter    │
                  │ (decorator)         │
                  ├─────────────────────┤
                  │ - targetDim: 1536   │
                  │ - wraps any provider│
                  │ - pads/truncates    │
                  └────────┬────────────┘
                           │ used by
                           ▼
                ┌─────────────────────────┐
                │ EmbeddingProviderFactory │
                ├─────────────────────────┤
                │ + resolve(workspaceId)  │
                │ + resolveFromConfig(cfg)│
                └────────┬────────────────┘
                         │ called by
                         ▼
              ┌──────────────────────┐
              │ EmbeddingService     │
              │ (replaces embedder.ts)│
              ├──────────────────────┤
              │ - provider: Provider │
              │ - stats: EmbeddingStats│
              │ + generateEmbedding()│
              │ + generateEmbeddings()│
              │ + getEmbeddingStats()│
              └──────────────────────┘
```

## 5. Interface Design

### 5.1 EmbeddingProvider Interface

```typescript
// lib/rag/embedding-providers/types.ts

export interface EmbeddingProvider {
  /** Generate embedding for a single text */
  embed(text: string): Promise<number[]>;

  /** Generate embeddings for multiple texts (batch) */
  embedBatch(texts: string[]): Promise<number[][]>;

  /** Native dimension of this provider's output (before adaptation) */
  getDimension(): number;

  /** Check if the provider is reachable/configured */
  isAvailable(): Promise<boolean>;

  /** Human-readable provider name */
  getName(): string;

  /** Cost per 1M tokens, null if free */
  getCostPerMillionTokens(): number | null;
}

export type EmbeddingProviderName =
  | 'feature_hashing'
  | 'openai'
  | 'gemini'
  | 'openrouter'
  | 'ollama';
```

### 5.2 Provider Config (per-workspace)

```typescript
// Stored in workspace_settings table
// Key: 'embedding_provider' | 'embedding_api_key' | 'embedding_base_url' | 'embedding_model'

interface EmbeddingProviderConfig {
  provider: EmbeddingProviderName;   // workspace_settings key='embedding_provider'
  apiKey?: string;                   // workspace_settings key='embedding_api_key'
  baseURL?: string;                  // workspace_settings key='embedding_base_url'
  model?: string;                    // workspace_settings key='embedding_model'
}
```

### 5.3 EmbeddingProviderFactory

```typescript
// lib/rag/embedding-providers/factory.ts

export class EmbeddingProviderFactory {
  /**
   * Resolve embedding provider for a workspace.
   * Reads workspace_settings, instantiates provider, wraps with DimensionAdapter.
   * Falls back to FeatureHashingProvider if:
   *   - No workspace settings found
   *   - Configured provider is unavailable
   *   - API key is missing for paid provider
   */
  static async resolve(workspaceId: string): Promise<EmbeddingProvider>;

  /**
   * Resolve from explicit config (no DB lookup).
   * Useful for testing and admin overrides.
   */
  static resolveFromConfig(config: EmbeddingProviderConfig): EmbeddingProvider;
}
```

## 6. Provider Resolution Flow

```
generateEmbedding(text, workspaceId)
        │
        ▼
┌─ EmbeddingProviderFactory.resolve(workspaceId) ─┐
│                                                  │
│  1. Read workspace_settings:                     │
│     embedding_provider, embedding_api_key,       │
│     embedding_base_url, embedding_model          │
│                                                  │
│  2. If no setting → use global ai_provider       │
│     (backwards compatibility)                    │
│                                                  │
│  3. Instantiate provider by name:                │
│     'openai'    → OpenAIProvider(apiKey, model)  │
│     'gemini'    → GeminiProvider(apiKey, model)  │
│     'openrouter'→ OpenRouterProvider(apiKey)     │
│     'ollama'    → OllamaProvider(baseURL, model) │
│     'feature_hashing' → FeatureHashingProvider() │
│                                                  │
│  4. Wrap with DimensionAdapter(target=1536)      │
│     (except FeatureHashing — already 1536d)      │
│                                                  │
│  5. Check isAvailable():                         │
│     - true  → return provider                    │
│     - false → fall through to fallback           │
└──────────────────────┬───────────────────────────┘
                       │
                       ▼
           ┌─── Try provider.embed(text) ───┐
           │                                │
       success                          failure
           │                                │
           ▼                                ▼
    Return vector[1536]          ┌─ Retry with backoff ─┐
                                 │  (MAX_RETRIES = 2)    │
                                 └──────────┬────────────┘
                                        still fails
                                            │
                                            ▼
                              FeatureHashingProvider.embed(text)
                              + log warning
                              + increment stats.localFallbacks
                                            │
                                            ▼
                                    Return vector[1536]
```

## 7. File Structure

```
lib/rag/embedding-providers/
├── types.ts                    # EmbeddingProvider interface, EmbeddingProviderName
├── feature-hashing-provider.ts # FeatureHashingProvider (extracted from embedder.ts)
├── openai-provider.ts          # OpenAIProvider
├── gemini-provider.ts          # GeminiProvider (768d → 1536d via adapter)
├── openrouter-provider.ts      # OpenRouterProvider (variable dim → adapter)
├── ollama-provider.ts          # OllamaProvider (768d → 1536d via adapter)
├── dimension-adapter.ts        # DimensionAdapter (pad/truncate decorator)
├── factory.ts                  # EmbeddingProviderFactory
├── cost-tracker.ts             # Cost tracking hooks
└── index.ts                    # Re-exports, EmbeddingService (drop-in for embedder.ts)
```

## 8. Per-Provider Implementation Notes

### 8.1 FeatureHashingProvider

- **Extract as-is** from current `generateLocalEmbedding()` in `embedder.ts`
- Already produces 1536d L2-normalized vectors
- Always available (no external dependency)
- `getCostPerMillionTokens()` → `null` (free)
- No DimensionAdapter needed (native 1536d)

### 8.2 OpenAIProvider

- Uses OpenAI SDK: `openai.embeddings.create({ model, input })`
- Default model: `text-embedding-3-small` (1536d native)
- Also supports `text-embedding-3-large` (3072d → truncate to 1536d via adapter)
- Batch: send array to `input` field, up to `MAX_BATCH_SIZE`
- `getCostPerMillionTokens()` → `0.02` (text-embedding-3-small)

### 8.3 GeminiProvider

- Uses Google Generative AI OpenAI-compatible endpoint
- Default model: `text-embedding-004` (768d native)
- **Dimension mismatch**: 768d → pad to 1536d via DimensionAdapter
- API endpoint: `https://generativelanguage.googleapis.com/v1beta/openai/`
- `getCostPerMillionTokens()` → `0` (free tier) or plan-dependent

### 8.4 OpenRouterProvider

- Proxies to various underlying models
- Dimension depends on the routed model — adapter handles dynamically
- Default model: `openai/text-embedding-3-small` via OpenRouter
- Must call `getDimension()` after first embed to determine native dim
- `getCostPerMillionTokens()` → varies by routed model

### 8.5 OllamaProvider

- Calls Ollama's OpenAI-compatible endpoint at `localhost:11434/v1`
- Default model: `nomic-embed-text` (768d native)
- **Dimension mismatch**: 768d → pad to 1536d via DimensionAdapter
- No API key required
- `getCostPerMillionTokens()` → `null` (free, local)

## 9. Error Handling Strategy

```
┌──────────────────────────────────────────────────────────┐
│                    Error Classification                   │
├──────────────────────┬───────────────────────────────────┤
│ Error Type           │ Action                            │
├──────────────────────┼───────────────────────────────────┤
│ Network timeout      │ Retry (exponential backoff)       │
│ Rate limit (429)     │ Retry with longer delay           │
│ Auth failure (401)   │ No retry → fallback immediately   │
│ Invalid model (404)  │ No retry → fallback immediately   │
│ Dimension mismatch   │ Adapt via DimensionAdapter        │
│ Unknown API error    │ Retry → fallback after exhausted  │
│ Provider unavailable │ Skip → fallback immediately       │
└──────────────────────┴───────────────────────────────────┘
```

**Retry configuration** (inherited from current embedder.ts):
- `MAX_RETRIES = 2` (3 total attempts)
- `RETRY_BASE_DELAY_MS = 1000` (1s → 2s → 4s exponential)
- 401/404 errors: skip retry, immediate fallback (new optimization)

**Logging:**
```
[EmbeddingProvider:openai] Embedding failed (attempt 1/3), retrying in 1000ms: timeout
[EmbeddingProvider:openai] All retries exhausted, falling back to feature_hashing
[EmbeddingProvider] Provider 'gemini' unavailable (missing API key), using feature_hashing
```

## 10. Cost Tracking Hooks

### 10.1 CostTracker Interface

```typescript
// lib/rag/embedding-providers/cost-tracker.ts

export interface EmbeddingCostEvent {
  workspaceId: string;
  provider: EmbeddingProviderName;
  model: string;
  tokenCount: number;          // estimated from text length
  costUSD: number;             // computed from provider rate
  timestamp: Date;
  requestId: string;           // for deduplication
}

export class EmbeddingCostTracker {
  /**
   * Record an embedding cost event.
   * Writes to analytics_events table with event_type='embedding_cost'.
   */
  static async record(event: EmbeddingCostEvent): Promise<void>;

  /**
   * Estimate token count from text (rough: 1 token ≈ 4 chars for English).
   */
  static estimateTokens(text: string): number;

  /**
   * Compute cost from token count and provider rate.
   */
  static computeCost(tokenCount: number, costPerMillion: number): number;
}
```

### 10.2 Integration Point

Cost tracking is called **after successful embedding**, inside each provider's `embed()` and `embedBatch()` methods:

```typescript
// Inside OpenAIProvider.embed():
const tokens = EmbeddingCostTracker.estimateTokens(text);
const cost = EmbeddingCostTracker.computeCost(tokens, this.getCostPerMillionTokens()!);
await EmbeddingCostTracker.record({
  workspaceId: this.workspaceId,
  provider: 'openai',
  model: this.model,
  tokenCount: tokens,
  costUSD: cost,
  timestamp: new Date(),
  requestId: crypto.randomUUID(),
});
```

### 10.3 Analytics Integration

Cost events flow into existing `analytics_events` table:

```sql
-- New event type for embedding costs
INSERT INTO analytics_events (workspace_id, event_type, metadata)
VALUES (
  '...',
  'embedding_cost',
  '{"provider":"openai","model":"text-embedding-3-small","tokens":1500,"cost":0.00003}'
);
```

This feeds into existing `CostAnalytics` component for dashboard visualization.

## 11. Workspace Settings Schema

New `workspace_settings` keys for embedding provider configuration:

| Key | Example Value | Description |
|---|---|---|
| `embedding_provider` | `openai` | Provider name (enum value) |
| `embedding_api_key` | `sk-...` | API key (encrypted at rest) |
| `embedding_base_url` | `https://api.openai.com/v1` | Custom endpoint |
| `embedding_model` | `text-embedding-3-small` | Model identifier |

**Backwards compatibility:** If `embedding_provider` is not set in workspace_settings, the system falls back to the global `ai_provider` setting (current behavior). This means existing workspaces continue to work without migration.

## 12. Migration Path

### Phase 1: Extract & Abstract (non-breaking)
1. Create `lib/rag/embedding-providers/` directory
2. Extract `FeatureHashingProvider` from `embedder.ts`
3. Implement `DimensionAdapter`
4. Implement `EmbeddingProviderFactory`
5. Create `EmbeddingService` that wraps factory + stats (drop-in replacement)

### Phase 2: Add Providers
6. Implement `OpenAIProvider`
7. Implement `GeminiProvider`
8. Implement `OllamaProvider`
9. Implement `OpenRouterProvider`

### Phase 3: Wire Up
10. Replace `embedder.ts` imports with `EmbeddingService`
11. Add `embedding_provider` setting to workspace settings UI
12. Add cost tracking to analytics pipeline

### Phase 4: Optimize
13. Add provider health checks (cached `isAvailable()` results)
14. Add embedding cache (LRU cache for repeated texts)
15. Add provider-specific batch size tuning

## 13. Testing Strategy

```typescript
// Unit tests per provider
describe('FeatureHashingProvider', () => {
  it('always returns 1536d vectors', async () => { ... });
  it('is always available', async () => { ... });
  it('returns null cost', () => { ... });
});

describe('DimensionAdapter', () => {
  it('pads 768d to 1536d with zeros', () => { ... });
  it('truncates 3072d to 1536d', () => { ... });
  it('passes 1536d through unchanged', () => { ... });
  it('preserves L2 normalization', () => { ... });
});

describe('EmbeddingProviderFactory', () => {
  it('resolves openai from workspace settings', async () => { ... });
  it('falls back to feature_hashing on missing API key', async () => { ... });
  it('falls back to feature_hashing on provider unavailable', async () => { ... });
  it('uses global ai_provider when workspace setting missing', async () => { ... });
});

// Integration tests (require API keys)
describe('OpenAIProvider (integration)', () => {
  it('produces valid 1536d embeddings', async () => { ... });
  it('handles batch embedding', async () => { ... });
  it('retries on transient failures', async () => { ... });
});
```

## 14. Risk Assessment

| Risk | Impact | Mitigation |
|---|---|---|
| Zero-padding degrades retrieval quality | Medium | Benchmark retrieval quality with padded vs native vectors; prefer OpenAI (native 1536d) for production |
| Provider API changes break integration | Low | OpenAI-compatible interface is stable; version pin provider SDKs |
| Cost tracking adds latency | Low | Fire-and-forget async writes, don't block embedding response |
| Mixed embeddings in same workspace | High | **Enforce**: once a workspace starts using a provider, all new embeddings use that provider. Existing embeddings are NOT migrated. |
| Workspace provider switch | High | Document: switching providers means new embeddings have different vector semantics. Old embeddings remain but retrieval quality may degrade for mixed queries. |

## 15. Open Questions

1. **Should we support per-document provider overrides?** (e.g., cheap provider for bulk import, expensive for high-value docs)
2. **Should DimensionAdapter use learned projection instead of zero-padding?** (more accurate but requires training)
3. **Should we add an embedding version column?** (to track which provider generated each embedding for future migration)
4. **Rate limiting per workspace?** (prevent one workspace from exhausting API quota)

---

*This architecture document serves as the design specification for the embedding provider abstraction layer. Implementation should follow the phased migration path in Section 12.*
