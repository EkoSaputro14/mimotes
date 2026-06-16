/**
 * Document Processing Queue
 *
 * Provides concurrency-limited, FIFO-ordered job processing with:
 * - Max 2 concurrent processing jobs
 * - Exponential backoff retry (3 attempts)
 * - Per-step timing metrics
 * - Error tracking with structured messages
 */

// ============================================================
// Types
// ============================================================

export interface ProcessingMetrics {
  parseDurationMs: number;
  chunkDurationMs: number;
  embedDurationMs: number;
  storeDurationMs: number;
  totalDurationMs: number;
  chunkCount: number;
  retryAttempt: number;
}

export interface ProcessingError {
  step: "parse" | "chunk" | "embed" | "store" | "unknown";
  message: string;
  attempt: number;
  timestamp: string;
}

export interface QueueJob {
  id: string;
  type: "document" | "image";
  workspaceId: string;
  enqueueTime: number;
  attempts: number;
  execute: () => Promise<void>;
}

// ============================================================
// Configuration
// ============================================================

const MAX_CONCURRENT = parseInt(
  process.env.PROCESSING_MAX_CONCURRENT || "2",
  10
);
const MAX_RETRIES = parseInt(process.env.PROCESSING_MAX_RETRIES || "3", 10);
const RETRY_BASE_DELAY_MS = 1000; // 1s, 2s, 4s

// ============================================================
// Queue State
// ============================================================

const queue: QueueJob[] = [];
let running = 0;

// ============================================================
// Queue Operations
// ============================================================

/**
 * Enqueue a document processing job.
 * Returns immediately — job runs when a slot opens (FIFO).
 */
export function enqueueJob(job: QueueJob): void {
  queue.push(job);
  console.log(
    `[Queue] Enqueued ${job.type} ${job.id} (position: ${queue.length}, running: ${running}/${MAX_CONCURRENT})`
  );
  drainQueue();
}

/**
 * Get current queue stats for monitoring.
 */
export function getQueueStats(): {
  queued: number;
  running: number;
  maxConcurrent: number;
} {
  return {
    queued: queue.length,
    running,
    maxConcurrent: MAX_CONCURRENT,
  };
}

/**
 * Process the next job in the queue if a slot is available.
 */
function drainQueue(): void {
  while (running < MAX_CONCURRENT && queue.length > 0) {
    const job = queue.shift()!;
    running++;
    console.log(
      `[Queue] Starting ${job.type} ${job.id} (running: ${running}/${MAX_CONCURRENT}, queued: ${queue.length})`
    );
    processJob(job).finally(() => {
      running--;
      console.log(
        `[Queue] Finished ${job.type} ${job.id} (running: ${running}/${MAX_CONCURRENT})`
      );
      drainQueue();
    });
  }
}

/**
 * Execute a job with retry logic and metrics tracking.
 */
async function processJob(job: QueueJob): Promise<void> {
  const waitTimeMs = Date.now() - job.enqueueTime;
  console.log(
    `[Queue] Job ${job.id} waited ${waitTimeMs}ms in queue`
  );

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    job.attempts = attempt;
    const startTime = Date.now();

    try {
      await job.execute();
      const duration = Date.now() - startTime;
      console.log(
        `[Queue] Job ${job.id} completed in ${duration}ms (attempt ${attempt}/${MAX_RETRIES})`
      );
      return; // Success
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      console.error(
        `[Queue] Job ${job.id} failed on attempt ${attempt}/${MAX_RETRIES} after ${duration}ms: ${errorMsg}`
      );

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(
          `[Queue] Retrying job ${job.id} in ${delay}ms...`
        );
        await sleep(delay);
      } else {
        console.error(
          `[Queue] Job ${job.id} exhausted all ${MAX_RETRIES} attempts — marking as permanently failed`
        );
        throw error; // Re-throw so the caller can mark the document as failed
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// Timing Helpers
// ============================================================

export function startTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

/**
 * Format processing error for storage in documents.error_message.
 */
export function formatProcessingError(
  step: ProcessingError["step"],
  error: unknown,
  attempt: number
): string {
  const message = error instanceof Error ? error.message : String(error);
  const err: ProcessingError = {
    step,
    message: message.substring(0, 500), // Truncate for DB storage
    attempt,
    timestamp: new Date().toISOString(),
  };
  return JSON.stringify(err);
}
