# Re-Embedding Workflow — MimoNotes

> When workspace embedding provider changes, all existing document chunks must be re-embedded with the new provider. This document defines the full architecture, process, safety guarantees, and CLI tooling for re-embedding.

---

## Table of Contents

1. [Overview](#overview)
2. [When Re-Embedding is Triggered](#when-re-embedding-is-triggered)
3. [Database Schema Changes](#database-schema-changes)
4. [Architecture](#architecture)
5. [Re-Embedding Process (Step by Step)](#re-embedding-process-step-by-step)
6. [Concurrency & Non-Blocking Design](#concurrency--non-blocking-design)
7. [Rollback Strategy](#rollback-strategy)
8. [Mixed-State Handling](#mixed-state-handling)
9. [Error Handling](#error-handling)
10. [Progress Tracking](#progress-tracking)
11. [Cost Estimation & Dry-Run Mode](#cost-estimation--dry-run-mode)
12. [Modes: Single Document vs Full Workspace](#modes-single-document-vs-full-workspace)
13. [CLI Script](#cli-script)
14. [API Endpoints](#api-endpoints)
15. [Implementation Checklist](#implementation-checklist)

---

## Overview

MimoNotes stores vector embeddings per chunk in `document_chunks.embedding` (type `vector(1536)`). When the embedding provider changes (e.g., `feature_hashing` → `openai`, or `openai` → `ollama`), existing embeddings become incompatible with new queries because different providers produce different vector spaces.

**Scale**: ~107,571 chunks across 35 documents (as of initial deployment).

**Key constraint**: Prisma cannot handle `vector` column type directly — all embedding reads/writes use `$queryRaw` / `$executeRaw`.

---

## When Re-Embedding is Triggered

Re-embedding is triggered when an admin changes any of these workspace settings:

| Setting | Example Change | Re-embed? |
|---------|---------------|-----------|
| `embedding_provider` | `feature_hashing` → `openai` | ✅ Yes |
| `embedding_model` | `text-embedding-3-small` → `text-embedding-3-large` | ✅ Yes |
| `embedding_api_key` | Key rotation (same provider/model) | ❌ No |
| `embedding_base_url` | Endpoint change (same provider/model) | ⚠️ Depends |
| `llm_provider` | Chat model change only | ❌ No |

**Detection logic** (in settings update handler):

```typescript
// lib/settings.ts — on update
const prevProvider = await getSetting('embedding_provider');
const prevModel = await getSetting('embedding_model');

// ... update settings ...

const newProvider = await getSetting('embedding_provider');
const newModel = await getSetting('embedding_model');

if (prevProvider !== newProvider || prevModel !== newModel) {
  // Trigger re-embedding workflow
  await triggerReEmbedding({ scope: 'workspace', reason: 'provider_change' });
}
```

---

## Database Schema Changes

### New Migration: Add re-embedding tracking columns

```sql
-- prisma/migrations/YYYYMMDD_add_reembedding_support/migration.sql

-- Add embedding version tracking to chunks
ALTER TABLE document_chunks
  ADD COLUMN embedding_provider  VARCHAR(100),
  ADD COLUMN embedding_model     VARCHAR(100),
  ADD COLUMN embedding_version   INTEGER DEFAULT 1;

-- Create re-embedding job tracking table
CREATE TABLE reembedding_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID,                          -- NULL = all workspaces
  document_id     UUID,                           -- NULL = all documents
  scope           VARCHAR(20) NOT NULL DEFAULT 'workspace',  -- 'workspace' | 'document'
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',     -- 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  old_provider    VARCHAR(100),
  old_model       VARCHAR(100),
  new_provider    VARCHAR(100) NOT NULL,
  new_model       VARCHAR(100) NOT NULL,
  total_chunks    INTEGER NOT NULL DEFAULT 0,
  processed       INTEGER NOT NULL DEFAULT 0,
  failed          INTEGER NOT NULL DEFAULT 0,
  skipped         INTEGER NOT NULL DEFAULT 0,
  error_log       JSONB DEFAULT '[]',
  started_at      TIMESTAMP,
  completed_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- Index for active job lookup
CREATE INDEX idx_reembedding_jobs_status ON reembedding_jobs(status);
CREATE INDEX idx_reembedding_jobs_workspace ON reembedding_jobs(workspace_id);
```

### Updated Prisma Model

```prisma
model ReembeddingJob {
  id            String    @id @default(uuid())
  workspaceId   String?   @map("workspace_id")
  documentId    String?   @map("document_id")
  scope         String    @default("workspace")
  status        String    @default("pending")
  oldProvider   String?   @map("old_provider")
  oldModel      String?   @map("old_model")
  newProvider   String    @map("new_provider")
  newModel      String    @map("new_model")
  totalChunks   Int       @default(0) @map("total_chunks")
  processed     Int       @default(0)
  failed        Int       @default(0)
  skipped       Int       @default(0)
  errorLog      Json      @default("[]") @map("error_log")
  startedAt     DateTime? @map("started_at")
  completedAt   DateTime? @map("completed_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  @@map("reembedding_jobs")
}
```

### Updated DocumentChunks

```prisma
model DocumentChunk {
  // ... existing fields ...
  embeddingProvider String?  @map("embedding_provider")
  embeddingModel    String?  @map("embedding_model")
  embeddingVersion  Int?     @default(1) @map("embedding_version")
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Settings Update UI                     │
│         (admin changes embedding_provider/model)          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              API: POST /api/reembedding                   │
│  1. Validate new provider config (test embed 1 chunk)    │
│  2. Estimate cost (dry-run)                              │
│  3. Create ReembeddingJob record                         │
│  4. Start background worker                              │
│  5. Return job ID + estimate to UI                       │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Background Worker (reembedding-worker.ts)    │
│                                                           │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌───────┐ │
│  │  Fetch   │──▶│  Generate │──▶│  Update   │──▶│ Next  │ │
│  │  Batch   │   │  Embeds   │   │  DB Rows  │   │ Batch │ │
│  │ (100/ch) │   │ (provider)│   │ ($raw)    │   │       │ │
│  └─────────┘   └──────────┘   └──────────┘   └───────┘ │
│       │                              │                   │
│       │         ┌──────────┐         │                   │
│       │         │  Error    │◀────────┘                   │
│       │         │  Logger   │                             │
│       │         └──────────┘                             │
│       │              │                                    │
│       ▼              ▼                                    │
│  ┌──────────────────────┐                                │
│  │  Progress Tracker     │                                │
│  │  (update job record)  │                                │
│  └──────────────────────┘                                │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  Chat/Search continues using AVAILABLE embeddings        │
│  (mixed-state: some old, some new, some null)            │
└─────────────────────────────────────────────────────────┘
```

---

## Re-Embedding Process (Step by Step)

### Phase 1: Validation

```typescript
// lib/rag/reembedding.ts

async function validateNewProvider(config: EmbeddingConfig): Promise<boolean> {
  try {
    const testEmbedding = await generateEmbedding('test query', config);
    return Array.isArray(testEmbedding) && testEmbedding.length === 1536;
  } catch (err) {
    throw new Error(`New embedding provider validation failed: ${err.message}`);
  }
}
```

### Phase 2: Cost Estimation

```typescript
async function estimateCost(
  chunkCount: number,
  provider: string,
  model: string
): Promise<CostEstimate> {
  // Average chunk size ~500 tokens
  const avgTokensPerChunk = 500;
  const totalTokens = chunkCount * avgTokensPerChunk;

  const pricing: Record<string, number> = {
    'openai/text-embedding-3-small': 0.00002 / 1000,   // $0.02/1M tokens
    'openai/text-embedding-3-large': 0.00013 / 1000,   // $0.13/1M tokens
    'openai/text-embedding-ada-002': 0.0001 / 1000,    // $0.10/1M tokens
    'feature_hashing': 0,                                // Free (local)
    'ollama': 0,                                         // Free (local)
    'lmstudio': 0,                                       // Free (local)
  };

  const key = `${provider}/${model}`;
  const costPerToken = pricing[key] ?? 0.0001 / 1000; // fallback estimate

  return {
    chunkCount,
    estimatedTokens: totalTokens,
    estimatedCostUSD: totalTokens * costPerToken,
    estimatedDurationMinutes: Math.ceil(chunkCount / 100 / 60 * 2), // ~2s per batch of 100
  };
}
```

### Phase 3: Job Creation

```typescript
async function createReEmbeddingJob(params: {
  scope: 'workspace' | 'document';
  documentId?: string;
  newProvider: string;
  newModel: string;
}): Promise<ReembeddingJob> {
  const oldProvider = await getSetting('embedding_provider');
  const oldModel = await getSetting('embedding_model');

  const chunkCount = await prisma.documentChunks.count({
    where: params.documentId
      ? { documentId: params.documentId }
      : {},
  });

  const job = await prisma.reembeddingJob.create({
    data: {
      scope: params.scope,
      documentId: params.documentId,
      oldProvider,
      oldModel,
      newProvider: params.newProvider,
      newModel: params.newModel,
      totalChunks: chunkCount,
      status: 'pending',
    },
  });

  return job;
}
```

### Phase 4: Background Worker Execution

```typescript
// lib/rag/reembedding-worker.ts

const BATCH_SIZE = 100;
const DELAY_BETWEEN_BATCHES_MS = 1000;  // Rate limiting
const MAX_RETRIES_PER_CHUNK = 2;

async function runReEmbeddingJob(jobId: string): Promise<void> {
  const job = await prisma.reembeddingJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== 'pending') return;

  // Mark running
  await prisma.reembeddingJob.update({
    where: { id: jobId },
    data: { status: 'running', startedAt: new Date() },
  });

  const embeddingConfig: EmbeddingConfig = {
    provider: job.newProvider,
    model: job.newModel,
    // ... apiKey, baseUrl from settings
  };

  let offset = 0;
  let totalProcessed = job.processed;
  let totalFailed = job.failed;
  const errors: Array<{ chunkId: string; error: string; timestamp: string }> = [];

  while (true) {
    // Check for pause/cancel
    const currentJob = await prisma.reembeddingJob.findUnique({ where: { id: jobId } });
    if (currentJob?.status === 'paused') {
      await prisma.reembeddingJob.update({
        where: { id: jobId },
        data: { status: 'paused' },
      });
      return; // Exit; can be resumed later
    }
    if (currentJob?.status === 'cancelled') {
      return;
    }

    // Fetch next batch
    const chunks: DocumentChunk[] = await prisma.$queryRaw`
      SELECT id, content
      FROM document_chunks
      WHERE embedding_provider IS DISTINCT FROM ${job.newProvider}
         OR embedding_model IS DISTINCT FROM ${job.newModel}
      ORDER BY id
      LIMIT ${BATCH_SIZE}
      OFFSET ${offset}
    `;

    if (chunks.length === 0) break; // Done

    // Generate embeddings for batch
    const contents = chunks.map(c => c.content);
    let embeddings: (number[] | null)[];

    try {
      embeddings = await generateEmbeddings(contents, embeddingConfig);
    } catch (err) {
      // Provider-level failure — log and continue with individual retries
      embeddings = chunks.map(() => null);
      console.error(`Batch embedding failed at offset ${offset}:`, err.message);
    }

    // Update each chunk individually (Prisma can't batch-update vector columns)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i];

      if (!embedding) {
        // Retry individually
        try {
          const singleEmbedding = await generateEmbedding(chunk.content, embeddingConfig);
          await prisma.$executeRaw`
            UPDATE document_chunks
            SET embedding = ${vectorToString(singleEmbedding)}::vector,
                embedding_provider = ${job.newProvider},
                embedding_model = ${job.newModel},
                embedding_version = COALESCE(embedding_version, 0) + 1
            WHERE id = ${chunk.id}
          `;
          totalProcessed++;
        } catch (retryErr) {
          totalFailed++;
          errors.push({
            chunkId: chunk.id,
            error: retryErr.message,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        await prisma.$executeRaw`
          UPDATE document_chunks
          SET embedding = ${vectorToString(embedding)}::vector,
              embedding_provider = ${job.newProvider},
              embedding_model = ${job.newModel},
              embedding_version = COALESCE(embedding_version, 0) + 1
          WHERE id = ${chunk.id}
        `;
        totalProcessed++;
      }
    }

    // Update progress
    await prisma.reembeddingJob.update({
      where: { id: jobId },
      data: {
        processed: totalProcessed,
        failed: totalFailed,
        errorLog: errors.slice(-100), // Keep last 100 errors
      },
    });

    offset += BATCH_SIZE;

    // Rate limiting
    await sleep(DELAY_BETWEEN_BATCHES_MS);
  }

  // Mark complete
  await prisma.reembeddingJob.update({
    where: { id: jobId },
    data: {
      status: totalFailed > 0 ? 'completed' : 'completed',
      completedAt: new Date(),
      processed: totalProcessed,
      failed: totalFailed,
    },
  });

  // Emit analytics event
  await recordEvent('reembedding_completed', {
    jobId,
    totalProcessed,
    totalFailed,
    provider: job.newProvider,
    model: job.newModel,
    durationMs: Date.now() - new Date(job.startedAt!).getTime(),
  });
}

function vectorToString(vec: number[]): string {
  return `[${vec.join(',')}]`;
}
```

---

## Concurrency & Non-Blocking Design

### Chat & Search Continue Uninterrupted

During re-embedding, the vector search function already handles mixed-state gracefully:

```typescript
// lib/rag/vectorstore.ts — existing cosine search
// This query works regardless of embedding version.
// It finds chunks that HAVE embeddings (not null) and ranks by similarity.
```

**Key invariant**: The `embedding` column is never NULL during re-embedding. We overwrite old embeddings with new ones atomically per chunk. A chunk either has its old embedding or its new one — never null.

### Worker Isolation

The re-embedding worker runs as a **background async process** (not blocking the API request thread). Options:

1. **In-process** (simple): `setTimeout(() => runReEmbeddingJob(jobId), 0)` — works for single-instance deployments.
2. **BullMQ + Redis** (production): Job queue with pause/resume/retry. Recommended for multi-instance.
3. **CLI process** (manual): `npx tsx scripts/reembed.ts --job-id <id>` — runs as a separate Node.js process.

### Database Connection Pooling

Re-embedding uses batched queries with delays to avoid overwhelming the connection pool:

- Max 100 chunks per batch
- 1-second delay between batches
- Uses a dedicated Prisma client instance (or the shared pool with `connection_limit`)

---

## Rollback Strategy

### Automatic Rollback Triggers

If the re-embedding job fails with >50% chunk failures, automatically rollback:

```typescript
const failureRate = totalFailed / job.totalChunks;
if (failureRate > 0.5) {
  // Abort — old embeddings are still intact for non-processed chunks
  await prisma.reembeddingJob.update({
    where: { id: jobId },
    data: { status: 'failed', errorLog: [...errors, { error: 'Failure rate exceeded 50%, aborting' }] },
  });
  return;
}
```

### Manual Rollback

Since we track `embedding_provider` and `embedding_model` per chunk, rollback is straightforward:

```sql
-- Rollback: restore old provider's embeddings
-- (Only works if old embeddings are still in the column — they're overwritten!)
-- SAFER: Use the backup approach below.
```

### Backup Strategy (Pre-Re-Embedding)

Before starting re-embedding, create a backup:

```typescript
async function backupEmbeddings(jobId: string): Promise<void> {
  // Create a snapshot table
  await prisma.$executeRaw`
    CREATE TABLE document_chunks_backup_${jobId.replace(/-/g, '_')} AS
    SELECT id, embedding, embedding_provider, embedding_model
    FROM document_chunks
  `;
}
```

**Alternative (safer for production)**: Instead of overwriting, use a dual-column approach:

```sql
ALTER TABLE document_chunks
  ADD COLUMN new_embedding vector(1536);
```

Then after validation, swap `embedding` ↔ `new_embedding` and drop the old column. **However**, this doubles storage for embeddings (~2.5 GB extra for 107K chunks).

**Recommended approach for MimoNotes**: Overwrite in-place with backup table. The backup table is dropped after 7 days of successful operation with the new provider.

---

## Mixed-State Handling

During re-embedding, some chunks have old embeddings, some have new. This is **by design** and safe because:

1. **Cosine similarity is provider-agnostic at query time** — the search function doesn't know or care which provider generated the embedding.
2. **Quality degrades gracefully** — old-provider embeddings are still valid vectors, they just won't match new-provider query embeddings as well.
3. **Search results improve incrementally** as more chunks get re-embedded.

### Query Behavior During Migration

```typescript
// During re-embedding, search queries use the NEW provider's embedding model.
// This means:
// - Fully re-embedded chunks: High-quality matches
// - Not-yet-re-embedded chunks: Lower-quality matches (cross-provider similarity)
// - This is acceptable and expected
```

### UI Indicator

Show a banner in the dashboard during active re-embedding:

```
⚠️ Re-embedding in progress: 45,231 / 107,571 chunks processed (42%)
   Search quality may be reduced until completion.
   [View Progress] [Pause] [Cancel]
```

---

## Error Handling

### Per-Chunk Errors

- Individual chunk failures are **logged but don't abort the job**
- Failed chunks retain their old embeddings (not set to null)
- Failed chunks are retried once individually after batch failure
- All errors stored in `reembedding_jobs.error_log` (last 100)

### Provider-Level Errors

| Error | Action |
|-------|--------|
| API key invalid | Pause job, notify admin |
| Rate limited (429) | Back off exponentially (1s, 2s, 4s, max 30s) |
| Network timeout | Retry batch 3 times, then skip batch |
| Model not found | Fail job immediately |
| Insufficient quota | Pause job, notify admin |

### Rate Limiting / Backoff

```typescript
async function embedWithBackoff(
  contents: string[],
  config: EmbeddingConfig,
  maxRetries = 3
): Promise<number[][]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateEmbeddings(contents, config);
    } catch (err) {
      if (err.status === 429) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        console.log(`Rate limited, backing off ${delay}ms (attempt ${attempt + 1})`);
        await sleep(delay);
      } else if (err.status >= 500) {
        await sleep(2000);
      } else {
        throw err; // Non-retryable
      }
    }
  }
  throw new Error(`Failed after ${maxRetries} retries`);
}
```

---

## Progress Tracking

### Real-Time Progress API

```typescript
// GET /api/reembedding/:jobId/progress
// Returns:
{
  "jobId": "uuid",
  "status": "running",
  "totalChunks": 107571,
  "processed": 45231,
  "failed": 12,
  "skipped": 0,
  "percentComplete": 42.0,
  "estimatedRemainingMinutes": 21,
  "chunksPerSecond": 50,
  "startedAt": "2026-06-13T10:00:00Z",
  "errors": [
    { "chunkId": "abc", "error": "timeout", "timestamp": "..." }
  ]
}
```

### WebSocket / SSE Updates (Optional)

For real-time UI updates, use Server-Sent Events:

```typescript
// GET /api/reembedding/:jobId/stream
// SSE endpoint that pushes progress updates every 5 seconds
```

### Analytics Events

| Event | Metadata |
|-------|----------|
| `reembedding_started` | jobId, oldProvider, newProvider, chunkCount |
| `reembedding_progress` | jobId, processed, failed, percent |
| `reembedding_completed` | jobId, totalProcessed, totalFailed, durationMs |
| `reembedding_failed` | jobId, reason, processedSoFar |
| `reembedding_paused` | jobId, processedSoFar |
| `reembedding_cancelled` | jobId, processedSoFar |

---

## Cost Estimation & Dry-Run Mode

### Dry-Run Mode

```typescript
// POST /api/reembedding
// Body: { scope: 'workspace', dryRun: true }
// Returns cost estimate without starting the job

{
  "dryRun": true,
  "chunkCount": 107571,
  "estimatedTokens": 53785500,
  "estimatedCostUSD": 1.08,        // for text-embedding-3-small
  "estimatedDurationMinutes": 36,
  "newProvider": "openai",
  "newModel": "text-embedding-3-small"
}
```

### Cost by Provider (107,571 chunks × ~500 tokens avg)

| Provider / Model | Cost per 1M tokens | Total Cost | Duration (est.) |
|-----------------|-------------------|------------|-----------------|
| `feature_hashing` | $0.00 | $0.00 | ~5 min |
| `ollama` (local) | $0.00 | $0.00 | ~30 min |
| `lmstudio` (local) | $0.00 | $0.00 | ~20 min |
| `openai/text-embedding-3-small` | $0.02 | ~$1.08 | ~36 min |
| `openai/text-embedding-3-large` | $0.13 | ~$7.00 | ~36 min |
| `openai/text-embedding-ada-002` | $0.10 | ~$5.38 | ~36 min |

---

## Modes: Single Document vs Full Workspace

### Re-Embed Single Document

Triggered when a new document is uploaded and the workspace provider has changed since the last full re-embed, or when explicitly requested.

```typescript
// POST /api/reembedding
// Body: { scope: 'document', documentId: 'uuid' }

async function reEmbedDocument(documentId: string): Promise<ReembeddingJob> {
  const job = await createReEmbeddingJob({
    scope: 'document',
    documentId,
    newProvider: await getSetting('embedding_provider'),
    newModel: await getSetting('embedding_model'),
  });

  // Run synchronously for single document (small dataset)
  await runReEmbeddingJob(job.id);
  return job;
}
```

### Re-Embed Full Workspace

Triggered when embedding provider/model changes in settings.

```typescript
// POST /api/reembedding
// Body: { scope: 'workspace' }

async function reEmbedWorkspace(): Promise<ReembeddingJob> {
  const job = await createReEmbeddingJob({
    scope: 'workspace',
    newProvider: await getSetting('embedding_provider'),
    newModel: await getSetting('embedding_model'),
  });

  // Run in background
  runReEmbeddingJob(job.id); // fire-and-forget
  return job;
}
```

---

## CLI Script

### `scripts/reembed.ts`

Full CLI for batch re-embedding, usable outside the web UI (e.g., for maintenance windows).

```typescript
#!/usr/bin/env npx tsx
// scripts/reembed.ts

import { PrismaClient } from '@prisma/client';
import { parseArgs } from 'node:util';

const prisma = new PrismaClient();

const { values } = parseArgs({
  options: {
    'job-id':     { type: 'string' },           // Resume existing job
    scope:        { type: 'string', default: 'workspace' },  // 'workspace' | 'document'
    'document-id':{ type: 'string' },            // For scope=document
    provider:     { type: 'string', default: 'openai' },
    model:        { type: 'string', default: 'text-embedding-3-small' },
    'dry-run':    { type: 'boolean', default: false },
    'batch-size': { type: 'string', default: '100' },
    delay:        { type: 'string', default: '1000' },  // ms between batches
    backup:       { type: 'boolean', default: true },
    verbose:      { type: 'boolean', default: false },
    help:         { type: 'boolean', default: false },
  },
  strict: false,
});

async function main() {
  if (values.help) {
    console.log(`
Usage: npx tsx scripts/reembed.ts [options]

Options:
  --job-id <id>        Resume an existing re-embedding job
  --scope <type>       'workspace' (all docs) or 'document' (single doc) [default: workspace]
  --document-id <id>   Document ID (required when scope=document)
  --provider <name>    New embedding provider [default: openai]
  --model <name>       New embedding model [default: text-embedding-3-small]
  --dry-run            Estimate cost without re-embedding
  --batch-size <n>     Chunks per batch [default: 100]
  --delay <ms>         Delay between batches in ms [default: 1000]
  --no-backup          Skip backup table creation
  --verbose            Verbose logging
  --help               Show this help

Examples:
  # Dry-run cost estimate for workspace
  npx tsx scripts/reembed.ts --dry-run

  # Re-embed all chunks with OpenAI
  npx tsx scripts/reembed.ts --provider openai --model text-embedding-3-small

  # Re-embed single document with Ollama
  npx tsx scripts/reembed.ts --scope document --document-id <uuid> --provider ollama --model nomic-embed-text

  # Resume a paused job
  npx tsx scripts/reembed.ts --job-id <uuid>
    `);
    return;
  }

  // === DRY RUN ===
  if (values['dry-run']) {
    const where = values.scope === 'document' && values['document-id']
      ? { documentId: values['document-id'] }
      : {};

    const count = await prisma.documentChunks.count({ where });
    const avgTokens = 500;
    const totalTokens = count * avgTokens;

    console.log('\n📊 Re-embedding Cost Estimate (Dry Run)');
    console.log('─'.repeat(50));
    console.log(`  Scope:           ${values.scope}`);
    console.log(`  Provider:        ${values.provider}`);
    console.log(`  Model:           ${values.model}`);
    console.log(`  Chunks:          ${count.toLocaleString()}`);
    console.log(`  Est. Tokens:     ${totalTokens.toLocaleString()}`);
    console.log(`  Est. Duration:   ~${Math.ceil(count / 100 / 60 * 2)} minutes`);
    console.log('─'.repeat(50));

    return;
  }

  // === CREATE / RESUME JOB ===
  let jobId = values['job-id'];

  if (!jobId) {
    const chunkCount = await prisma.documentChunks.count({
      where: values.scope === 'document' && values['document-id']
        ? { documentId: values['document-id'] }
        : {},
    });

    const job = await prisma.reembeddingJob.create({
      data: {
        scope: values.scope as string,
        documentId: values['document-id'] || null,
        newProvider: values.provider as string,
        newModel: values.model as string,
        totalChunks: chunkCount,
        status: 'pending',
      },
    });
    jobId = job.id;
    console.log(`✅ Created re-embedding job: ${jobId}`);
  }

  // === BACKUP ===
  if (values.backup) {
    console.log('💾 Creating backup table...');
    const safeId = jobId!.replace(/-/g, '_');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS document_chunks_backup_${safeId} AS
      SELECT id, embedding, embedding_provider, embedding_model
      FROM document_chunks
    `);
    console.log('✅ Backup created');
  }

  // === RUN ===
  console.log('🚀 Starting re-embedding...');
  // ... run the same worker logic as above ...
  // (Import and call runReEmbeddingJob from lib/rag/reembedding-worker.ts)

  console.log('✅ Re-embedding complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

### CLI Usage Examples

```bash
# Dry run — see cost estimate
npx tsx scripts/reembed.ts --dry-run

# Full workspace re-embedding with OpenAI
npx tsx scripts/reembed.ts --provider openai --model text-embedding-3-small

# Single document with Ollama (free, local)
npx tsx scripts/reembed.ts --scope document --document-id abc-123 --provider ollama --model nomic-embed-text

# Resume a paused job
npx tsx scripts/reembed.ts --job-id def-456

# Verbose mode with custom batch size
npx tsx scripts/reembed.ts --provider openai --model text-embedding-3-small --batch-size 50 --delay 2000 --verbose

# Skip backup (faster, but no rollback)
npx tsx scripts/reembed.ts --provider openai --model text-embedding-3-small --no-backup
```

---

## API Endpoints

### `POST /api/reembedding` — Start / Estimate

```typescript
// Request body
interface StartReembeddingRequest {
  scope: 'workspace' | 'document';
  documentId?: string;        // Required if scope='document'
  dryRun?: boolean;            // If true, return estimate only
  confirm?: boolean;           // Must be true for actual execution
}

// Response (dry-run)
interface DryRunResponse {
  dryRun: true;
  chunkCount: number;
  estimatedTokens: number;
  estimatedCostUSD: number;
  estimatedDurationMinutes: number;
  newProvider: string;
  newModel: string;
}

// Response (started)
interface StartResponse {
  jobId: string;
  status: 'pending';
  chunkCount: number;
  estimatedCostUSD: number;
}
```

### `GET /api/reembedding` — List Jobs

Returns all re-embedding jobs (active and historical).

### `GET /api/reembedding/:jobId` — Job Status

Returns detailed job status with progress.

### `POST /api/reembedding/:jobId/pause` — Pause

### `POST /api/reembedding/:jobId/resume` — Resume

### `POST /api/reembedding/:jobId/cancel` — Cancel

### `DELETE /api/reembedding/:jobId` — Delete Job Record

---

## Implementation Checklist

### Phase 1: Schema & Infrastructure
- [ ] Create migration for `embedding_provider`, `embedding_model`, `embedding_version` columns on `document_chunks`
- [ ] Create `reembedding_jobs` table
- [ ] Update Prisma schema with new models
- [ ] Run migration

### Phase 2: Core Worker
- [ ] Implement `lib/rag/reembedding.ts` (validation, cost estimation, job creation)
- [ ] Implement `lib/rag/reembedding-worker.ts` (batch processing, progress tracking)
- [ ] Implement rate limiting / backoff
- [ ] Implement per-chunk error handling

### Phase 3: API Routes
- [ ] `POST /api/reembedding` (start + dry-run)
- [ ] `GET /api/reembedding` (list jobs)
- [ ] `GET /api/reembedding/:id` (status)
- [ ] `POST /api/reembedding/:id/pause`
- [ ] `POST /api/reembedding/:id/resume`
- [ ] `POST /api/reembedding/:id/cancel`

### Phase 4: UI
- [ ] Cost estimation dialog before confirming provider change
- [ ] Progress banner in dashboard during active re-embedding
- [ ] Re-embedding jobs list in admin/settings
- [ ] Error log viewer

### Phase 5: CLI & Automation
- [ ] `scripts/reembed.ts` CLI tool
- [ ] Auto-trigger on settings change
- [ ] Docker health check integration

### Phase 6: Safety & Rollback
- [ ] Pre-re-embedding backup table
- [ ] Automatic abort on >50% failure rate
- [ ] Backup cleanup cron (drop backup tables after 7 days)
- [ ] Monitoring alerts for stuck/failed jobs

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `POST /api/reembedding { dryRun: true }` | Estimate cost |
| `POST /api/reembedding { confirm: true }` | Start re-embedding |
| `GET /api/reembedding/:id` | Check progress |
| `npx tsx scripts/reembed.ts --dry-run` | CLI cost estimate |
| `npx tsx scripts/reembed.ts --provider openai` | CLI full re-embed |
| `npx tsx scripts/reembed.ts --job-id <id>` | CLI resume job |

---

*Document version: 1.0 — Created 2026-06-13*
