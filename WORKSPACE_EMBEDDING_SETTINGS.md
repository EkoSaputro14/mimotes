# Workspace Embedding Settings — MimoNotes

## 1. Overview

MimoNotes stores per-workspace configuration in the `workspace_settings` table
(Prisma model `WorkspaceSetting`). Keys containing `key` or `secret` are
automatically encrypted with **AES-256-GCM** before persistence.

This document defines the embedding-specific settings, resolution order,
permissions, validation rules, UI guidance, and migration path.

---

## 2. Settings Schema

| Key                        | Type      | Default             | Encrypted | Description                                                              |
|----------------------------|-----------|---------------------|-----------|--------------------------------------------------------------------------|
| `embedding_provider`       | `string`  | `feature_hashing`   | No        | Active embedding backend. One of: `feature_hashing`, `openai`, `gemini`, `openrouter`, `local` |
| `embedding_api_key`        | `string`  | *(empty)*           | **Yes**   | User-provided API key for BYOK providers (`openai`, `gemini`, `openrouter`)                |
| `embedding_base_url`       | `string`  | *(empty)*           | No        | Custom endpoint URL — used for `openrouter` or `local` (e.g. Ollama)    |
| `embedding_model`          | `string`  | *(empty)*           | No        | Model identifier (e.g. `text-embedding-3-small`, `nomic-embed-text`)     |
| `embedding_dimension`      | `integer` | `1536`              | No        | Output vector dimension; must match index schema                         |
| `embedding_status`         | `string`  | `active`            | No        | Runtime status: `active`, `migrating`, `error`, `degraded`               |
| `embedding_last_migration` | `string`  | *(empty)*           | No        | ISO-8601 timestamp of the last full re-embedding run                     |
| `embedding_chunk_count`    | `integer` | `0`                 | No        | Number of chunks currently stored using the active provider              |

### Provider-specific defaults

| Provider        | Default Model                | Default Dimension | Requires API Key | Requires Base URL |
|-----------------|------------------------------|-------------------|------------------|-------------------|
| `feature_hashing` | *(none — built-in)*         | `1536`            | No               | No                |
| `openai`        | `text-embedding-3-small`    | `1536`            | Yes              | No (optional)     |
| `gemini`        | `text-embedding-004`        | `768`             | Yes              | No                |
| `openrouter`    | `openai/text-embedding-3-small` | `1536`        | Yes              | Yes (recommended) |
| `local`         | `nomic-embed-text`          | `768`             | No               | Yes (required)    |

---

## 3. Resolution Algorithm

The effective embedding configuration is resolved at runtime by walking a
priority chain. The first non-empty value wins.

```
function resolveEmbeddingConfig(workspaceId):
    ws = db.workspace_settings.where(workspaceId)

    provider = ws.embedding_provider
             ?? ws.ai_provider           // legacy AI config fallback
             ?? GLOBAL.embedding_provider // admin-configured default
             ?? ENV.EMBEDDING_PROVIDER
             ?? 'feature_hashing'

    apiKey = ws.embedding_api_key
           ?? ws.ai_api_key              // fallback: reuse existing AI key
           ?? GLOBAL.embedding_api_key
           ?? ENV.EMBEDDING_API_KEY
           ?? ''

    baseUrl = ws.embedding_base_url
            ?? ws.ai_base_url            // fallback: reuse existing AI URL
            ?? GLOBAL.embedding_base_url
            ?? ENV.EMBEDDING_BASE_URL
            ?? ''

    model = ws.embedding_model
          ?? ws.ai_embedding_model       // legacy key
          ?? GLOBAL.embedding_model
          ?? ENV.EMBEDDING_MODEL
          ?? providerDefaultModel(provider)

    dimension = ws.embedding_dimension
              ?? GLOBAL.embedding_dimension
              ?? ENV.EMBEDDING_DIMENSION
              ?? providerDefaultDimension(provider)

    status = ws.embedding_status ?? 'active'

    return { provider, apiKey, baseUrl, model, dimension, status }
```

### Key points

1. **Workspace-level `embedding_*`** — highest priority. Set by workspace owner.
2. **Existing `ai_*`** — backward-compatible fallback so workspaces that already
   configured AI settings get implicit embedding support.
3. **Global settings** — admin-configured defaults (stored in `global_settings`
   or config file).
4. **Environment variables** — deployment-level overrides.
5. **Hardcoded** — `feature_hashing` with 1536 dimensions.

---

## 4. Permissions

| Action                                    | Admin | Workspace Owner | Workspace Member |
|-------------------------------------------|:-----:|:---------------:|:----------------:|
| View embedding settings                   | ✅    | ✅              | ✅ (status only) |
| Change `embedding_provider`               | ✅    | ✅              | ❌               |
| Set `embedding_api_key`                   | ✅    | ✅              | ❌               |
| Set `embedding_base_url`                  | ✅    | ✅              | ❌               |
| Set `embedding_model`                     | ✅    | ✅              | ❌               |
| Set `embedding_dimension`                 | ✅    | ⚠️ *            | ❌               |
| Trigger re-embedding (migration)          | ✅    | ✅              | ❌               |
| Reset to global defaults                  | ✅    | ✅              | ❌               |
| Configure global defaults                 | ✅    | ❌              | ❌               |

> **\*** Workspace owners can change `embedding_dimension` only if
> no existing chunks use a different dimension; otherwise admin approval is
> required (dimension change triggers full re-embedding).

---

## 5. Validation Rules

### 5.1 `embedding_provider`

```typescript
const VALID_PROVIDERS = ['feature_hashing', 'openai', 'gemini', 'openrouter', 'local'] as const;

function validateProvider(value: string): asserts value is typeof VALID_PROVIDERS[number] {
  if (!VALID_PROVIDERS.includes(value as any)) {
    throw new ValidationError(`Invalid provider "${value}". Must be one of: ${VALID_PROVIDERS.join(', ')}`);
  }
}
```

### 5.2 `embedding_api_key`

```typescript
function validateApiKey(provider: string, apiKey: string): void {
  if (['openai', 'gemini', 'openrouter'].includes(provider)) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new ValidationError(`API key is required for provider "${provider}"`);
    }
  }

  // Format checks (best-effort, not all providers have strict formats)
  if (provider === 'openai' && !apiKey.startsWith('sk-')) {
    throw new ValidationError('OpenAI API keys must start with "sk-"');
  }

  if (provider === 'gemini' && !/^[A-Za-z0-9_\-]{20,}$/.test(apiKey)) {
    throw new ValidationError('Gemini API key format is invalid');
  }

  // Length guard
  if (apiKey.length > 512) {
    throw new ValidationError('API key exceeds maximum length of 512 characters');
  }
}
```

### 5.3 `embedding_base_url`

```typescript
function validateBaseUrl(provider: string, baseUrl: string): void {
  if (provider === 'local' && !baseUrl) {
    throw new ValidationError('Base URL is required for "local" provider (e.g. http://localhost:11434)');
  }

  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new ValidationError('Base URL must use http or https protocol');
      }
      // Security: disallow non-routable addresses in production
      if (process.env.NODE_ENV === 'production' && isPrivateIP(url.hostname)) {
        throw new ValidationError('Base URL must not point to a private/local IP in production');
      }
    } catch (e) {
      if (e instanceof ValidationError) throw e;
      throw new ValidationError(`Invalid URL format: "${baseUrl}"`);
    }
  }
}
```

### 5.4 `embedding_model`

```typescript
function validateModel(provider: string, model: string): void {
  if (!model || model.trim().length === 0) return; // use provider default

  // Basic format: alphanumeric, hyphens, dots, slashes (for OpenRouter)
  if (!/^[a-zA-Z0-9_\-./]+$/.test(model)) {
    throw new ValidationError('Model name contains invalid characters');
  }

  if (model.length > 256) {
    throw new ValidationError('Model name exceeds maximum length of 256 characters');
  }
}
```

### 5.5 `embedding_dimension`

```typescript
function validateDimension(provider: string, dimension: number): void {
  if (!Number.isInteger(dimension) || dimension < 1 || dimension > 65536) {
    throw new ValidationError('Dimension must be an integer between 1 and 65536');
  }

  // Provider-specific constraints
  const providerDimensions: Record<string, number[]> = {
    openai: [256, 512, 1024, 1536, 3072],
    gemini: [768],
    feature_hashing: [1536],
  };

  const allowed = providerDimensions[provider];
  if (allowed && !allowed.includes(dimension)) {
    throw new ValidationError(
      `Dimension ${dimension} is not supported for "${provider}". Allowed: ${allowed.join(', ')}`
    );
  }
}
```

### 5.6 `embedding_status` (read-only in normal operation)

Status is managed internally, not directly editable by users. Valid transitions:

```
active ──────► migrating
migrating ───► active       (success)
migrating ───► error        (failure)
active ──────► degraded     (partial failure, e.g. some chunks failed)
degraded ─────► active      (re-embedding completed successfully)
error ────────► migrating   (retry)
error ────────► active      (clear error, revert to feature_hashing)
```

---

## 6. UI Considerations

### 6.1 Settings Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Workspace Settings  ›  Embeddings                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Provider                                                │
│  ┌──────────────────────────────────┐                    │
│  │ ○ Feature Hashing (free, default)│                    │
│  │ ○ OpenAI                         │                    │
│  │ ○ Google Gemini                  │                    │
│  │ ○ OpenRouter                     │                    │
│  │ ● Local (Ollama)                 │                    │
│  └──────────────────────────────────┘                    │
│                                                          │
│  API Key  [sk-••••••••••••••••••••]  🔒 Encrypted       │
│  (hidden when provider = feature_hashing or local)       │
│                                                          │
│  Base URL  [http://localhost:11434]                      │
│  (shown only for OpenRouter / Local)                     │
│                                                          │
│  Model  [nomic-embed-text ▾]                            │
│  (dropdown with suggested models + free-text input)      │
│                                                          │
│  Dimension  [768]                                        │
│  ⚠ Changing dimension will re-embed all N chunks        │
│                                                          │
│  ── Status ───────────────────────────────────────────── │
│  ● Active   |  42,310 chunks  |  Last migration: never  │
│                                                          │
│  [ Test Connection ]   [ Re-embed All ]   [ Save ]       │
│                                                          │
│  [ Reset to Global Defaults ]                            │
└─────────────────────────────────────────────────────────┘
```

### 6.2 UX Guidelines

1. **Progressive disclosure** — only show API key, base URL, model fields when
   the selected provider requires them.
2. **Test Connection** button — calls the provider's embedding API with a
   sample string (`"Hello world"`) and reports success/failure + latency.
3. **Re-embed All** — triggers background migration job; shows progress bar
   with chunk count. Disabled while status is `migrating`.
4. **Dimension warning** — display an inline warning banner when the user
   changes the dimension, indicating that all existing chunks will be re-embedded.
5. **Status indicator** — color-coded chip:
   - 🟢 `active` — all good
   - 🟡 `migrating` — re-embedding in progress
   - 🔴 `error` — last operation failed
   - 🟠 `degraded` — partial success
6. **API key masking** — never display the full key. Show first 4 + last 4
   chars with `•` in between. Provide a "reveal" toggle.

### 6.3 Admin Panel

Global embedding defaults page under **Admin › AI & Embeddings**:

- Same form as workspace settings but without provider-specific exclusions.
- Additional toggle: **Allow workspace overrides** (default: on). When off,
   workspace-level `embedding_*` keys are ignored and global config is used
   for all workspaces.

---

## 7. Migration from `ai_embedding_model`

### 7.1 Background

The existing system stores embedding model configuration under the generic
`ai_embedding_model` key (alongside `ai_provider`, `ai_api_key`, etc.). The
new `embedding_*` namespace provides dedicated keys with richer metadata.

### 7.2 Migration Strategy

**Phase 1 — Dual-read (current release)**

```
// Resolution already handles this via the fallback chain:
//   embedding_model ?? ai_embedding_model ?? global ?? env ?? default
```

No data migration needed. Existing workspaces continue to work.

**Phase 2 — Auto-copy (next minor release)**

Run a one-time migration script:

```typescript
// migration: copy ai_embedding_model → embedding_model
async function migrateEmbeddingSettings() {
  const workspaces = await db.workspace_settings.findMany({
    where: { key: 'ai_embedding_model' },
  });

  for (const ws of workspaces) {
    // Only copy if workspace doesn't already have embedding_model
    const existing = await db.workspace_settings.findUnique({
      where: {
        workspaceId_key: { workspaceId: ws.workspaceId, key: 'embedding_model' },
      },
    });

    if (!existing) {
      await db.workspace_settings.create({
        data: {
          workspaceId: ws.workspaceId,
          key: 'embedding_model',
          value: ws.value,
        },
      });
    }
  }

  console.log(`Migrated ${workspaces.length} workspaces`);
}
```

**Phase 3 — Deprecation warning (next major release)**

- Add a deprecation notice in the UI when `ai_embedding_model` is detected
  without a corresponding `embedding_model`.
- Log warnings at startup for workspaces still using the legacy key.

**Phase 4 — Remove fallback (future major release)**

- Remove `ai_embedding_model` from the resolution chain.
- Provide a CLI tool to complete migration for any remaining workspaces.

### 7.3 Full Re-embedding Trigger

A re-embedding job is triggered **automatically** when any of these change:

- `embedding_provider` (different backend = incompatible vectors)
- `embedding_model` (different model = incompatible vectors)
- `embedding_dimension` (different size = incompatible vectors)

The re-embedding job:

1. Sets `embedding_status` to `migrating`.
2. Iterates all note chunks in the workspace.
3. For each chunk, generates a new embedding via the resolved provider.
4. Stores the new vector, replacing the old one.
5. Updates `embedding_chunk_count` and `embedding_last_migration`.
6. Sets `embedding_status` to `active` on success, `error` on failure.

> **Important:** During migration, search continues to use the **old**
> embeddings. The swap is atomic — new embeddings replace old ones only after
> all chunks are processed successfully.

---

## 8. Database Schema (Prisma)

```prisma
model WorkspaceSetting {
  id          String   @id @default(cuid())
  workspaceId String
  key         String
  value       String   @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, key])
  @@index([workspaceId])
  @@index([key])
}
```

> No schema changes required — the existing model supports the new keys.
> Encryption is handled at the application layer (any key containing `key` or
> `secret` is auto-encrypted).

---

## 9. Environment Variables

| Variable               | Description                              | Example                                |
|------------------------|------------------------------------------|----------------------------------------|
| `EMBEDDING_PROVIDER`   | Default embedding provider               | `openai`                               |
| `EMBEDDING_API_KEY`    | Default API key (encrypted at rest)      | `sk-...`                               |
| `EMBEDDING_BASE_URL`   | Default base URL                         | `https://openrouter.ai/api/v1`         |
| `EMBEDDING_MODEL`      | Default model name                       | `text-embedding-3-small`               |
| `EMBEDDING_DIMENSION`  | Default dimension                        | `1536`                                 |

---

## 10. Error Handling

| Scenario                               | Behavior                                                     |
|----------------------------------------|--------------------------------------------------------------|
| API key invalid / expired              | Status → `error`; fallback to `feature_hashing` after 3 retries |
| Provider unreachable                   | Status → `error`; retry with exponential backoff (1s, 2s, 4s) |
| Model not found on provider            | Validation error on save; do not allow invalid model names   |
| Dimension mismatch with index          | Migration required; block search until complete              |
| Rate limit exceeded                    | Throttle re-embedding; log warning; status → `degraded`     |
| Partial chunk failure (< 5%)           | Status → `degraded`; log failed chunk IDs for retry          |
| Partial chunk failure (≥ 5%)           | Status → `error`; roll back to previous embeddings           |

---

*Document version: 1.0 — 2026-06-13*
