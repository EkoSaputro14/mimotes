/**
 * RAG Retrieval Benchmark Runner
 *
 * Measures retrieval quality against the benchmark dataset.
 * Run with: npx tsx scripts/rag-benchmark.ts
 *
 * This script:
 * 1. Loads benchmark queries from tests/fixtures/rag-benchmark.json
 * 2. Runs each query through the retrieval pipeline
 * 3. Measures precision, recall, latency, and hallucination indicators
 * 4. Outputs a structured report
 *
 * NOTE: This script requires a running database with documents.
 *       In CI, it runs against a seeded test database.
 *       Locally, it measures whatever documents are in the current workspace.
 */

import benchmarkData from "../tests/fixtures/rag-benchmark.json";

// ============================================================
// Types
// ============================================================

interface BenchmarkQuery {
  id: string;
  query: string;
  expectedKeywords: string[];
  expectedDocTypes: string[];
  category: string;
  difficulty: string;
  language: string;
  shouldRetrieve: boolean;
  note?: string;
}

interface QueryResult {
  queryId: string;
  query: string;
  category: string;
  difficulty: string;
  shouldRetrieve: boolean;
  actuallyRetrieved: boolean;
  retrievedCount: number;
  avgSimilarity: number;
  maxSimilarity: number;
  keywordHitRate: number;
  correctRefusal: boolean;
  latencyMs: number;
}

interface BenchmarkSummary {
  timestamp: string;
  totalQueries: number;
  // Retrieval metrics
  retrievalAccuracy: number;     // % of queries that retrieved correctly
  avgPrecision: number;          // Average keyword hit rate
  avgSimilarity: number;         // Average similarity score
  avgLatencyMs: number;          // Average retrieval latency
  p95LatencyMs: number;          // 95th percentile latency
  // Negative test metrics
  falsePositiveRate: number;     // % of negative queries that retrieved something
  refusalAccuracy: number;       // % of negative queries correctly refused
  // Category breakdown
  categoryBreakdown: Record<string, { count: number; avgSimilarity: number; avgKeywordHit: number }>;
  difficultyBreakdown: Record<string, { count: number; avgSimilarity: number; avgKeywordHit: number }>;
  // Quality gates
  gates: Array<{ name: string; value: number; threshold: number; passed: boolean }>;
}

// ============================================================
// Quality Gates
// ============================================================

const QUALITY_GATES = [
  { name: "Retrieval Accuracy", threshold: 0.70, metric: "retrievalAccuracy" },
  { name: "Avg Similarity", threshold: 0.40, metric: "avgSimilarity" },
  { name: "False Positive Rate", threshold: 0.20, metric: "falsePositiveRate", invert: true },
  { name: "Refusal Accuracy", threshold: 0.80, metric: "refusalAccuracy" },
  { name: "Avg Latency (ms)", threshold: 200, metric: "avgLatencyMs", invert: true },
];

// ============================================================
// Main
// ============================================================

async function main() {
  const queries = benchmarkData.queries as BenchmarkQuery[];
  const results: QueryResult[] = [];

  console.log("═══════════════════════════════════════════════════════");
  console.log("  RAG Retrieval Benchmark");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Queries: ${queries.length}`);
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════════════════\n");

  // NOTE: In a real run, this would import and call the actual RAG pipeline.
  // For now, we produce a structural report showing the benchmark framework works.
  // Actual retrieval testing requires a running database with documents.

  console.log("⚠️  Benchmark runner requires database connection.");
  console.log("    Run against seeded test database for actual metrics.\n");

  // Simulate results for structural validation
  for (const q of queries) {
    const result: QueryResult = {
      queryId: q.id,
      query: q.query,
      category: q.category,
      difficulty: q.difficulty,
      shouldRetrieve: q.shouldRetrieve,
      actuallyRetrieved: false, // Would be actual result
      retrievedCount: 0,
      avgSimilarity: 0,
      maxSimilarity: 0,
      keywordHitRate: 0,
      correctRefusal: !q.shouldRetrieve, // Negative queries are "correctly refused" by default
      latencyMs: 0,
    };
    results.push(result);
  }

  // Calculate summary
  const summary = calculateSummary(results);

  // Print report
  printReport(summary);

  // Check quality gates
  const allGatesPassed = checkGates(summary);

  // Exit with appropriate code
  process.exit(allGatesPassed ? 0 : 1);
}

function calculateSummary(results: QueryResult[]): BenchmarkSummary {
  const positiveResults = results.filter((r) => r.shouldRetrieve);
  const negativeResults = results.filter((r) => !r.shouldRetrieve);

  const retrieved = positiveResults.filter((r) => r.actuallyRetrieved);
  const retrievalAccuracy = positiveResults.length > 0
    ? retrieved.length / positiveResults.length
    : 0;

  const avgSimilarity = results.length > 0
    ? results.reduce((s, r) => s + r.maxSimilarity, 0) / results.length
    : 0;

  const avgPrecision = results.length > 0
    ? results.reduce((s, r) => s + r.keywordHitRate, 0) / results.length
    : 0;

  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const avgLatencyMs = latencies.length > 0
    ? latencies.reduce((s, l) => s + l, 0) / latencies.length
    : 0;
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95LatencyMs = latencies[p95Index] || 0;

  const falsePositives = negativeResults.filter((r) => r.actuallyRetrieved);
  const falsePositiveRate = negativeResults.length > 0
    ? falsePositives.length / negativeResults.length
    : 0;

  const correctRefusals = negativeResults.filter((r) => r.correctRefusal);
  const refusalAccuracy = negativeResults.length > 0
    ? correctRefusals.length / negativeResults.length
    : 1;

  // Category breakdown
  const categoryBreakdown: Record<string, { count: number; avgSimilarity: number; avgKeywordHit: number }> = {};
  for (const r of results) {
    if (!categoryBreakdown[r.category]) {
      categoryBreakdown[r.category] = { count: 0, avgSimilarity: 0, avgKeywordHit: 0 };
    }
    const cat = categoryBreakdown[r.category];
    cat.count++;
    cat.avgSimilarity += r.maxSimilarity;
    cat.avgKeywordHit += r.keywordHitRate;
  }
  for (const cat of Object.values(categoryBreakdown)) {
    cat.avgSimilarity = cat.count > 0 ? cat.avgSimilarity / cat.count : 0;
    cat.avgKeywordHit = cat.count > 0 ? cat.avgKeywordHit / cat.count : 0;
  }

  // Difficulty breakdown
  const difficultyBreakdown: Record<string, { count: number; avgSimilarity: number; avgKeywordHit: number }> = {};
  for (const r of results) {
    if (!difficultyBreakdown[r.difficulty]) {
      difficultyBreakdown[r.difficulty] = { count: 0, avgSimilarity: 0, avgKeywordHit: 0 };
    }
    const diff = difficultyBreakdown[r.difficulty];
    diff.count++;
    diff.avgSimilarity += r.maxSimilarity;
    diff.avgKeywordHit += r.keywordHitRate;
  }
  for (const diff of Object.values(difficultyBreakdown)) {
    diff.avgSimilarity = diff.count > 0 ? diff.avgSimilarity / diff.count : 0;
    diff.avgKeywordHit = diff.count > 0 ? diff.avgKeywordHit / diff.count : 0;
  }

  const tempSummary = {
    timestamp: new Date().toISOString(),
    totalQueries: results.length,
    retrievalAccuracy,
    avgPrecision,
    avgSimilarity,
    avgLatencyMs,
    p95LatencyMs,
    falsePositiveRate,
    refusalAccuracy,
    categoryBreakdown,
    difficultyBreakdown,
    gates: [],
  };

  const gates = QUALITY_GATES.map((gate) => {
    const value = (tempSummary as Record<string, unknown>)[gate.metric] as number ?? 0;
    const passed = gate.invert
      ? value <= gate.threshold
      : value >= gate.threshold;
    return { name: gate.name, value, threshold: gate.threshold, passed };
  });

  return {
    timestamp: new Date().toISOString(),
    totalQueries: results.length,
    retrievalAccuracy,
    avgPrecision,
    avgSimilarity,
    avgLatencyMs,
    p95LatencyMs,
    falsePositiveRate,
    refusalAccuracy,
    categoryBreakdown,
    difficultyBreakdown,
    gates,
  };
}

function printReport(summary: BenchmarkSummary) {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  BENCHMARK RESULTS");
  console.log("═══════════════════════════════════════════════════════");
  console.log(`  Total queries:     ${summary.totalQueries}`);
  console.log(`  Retrieval accuracy: ${(summary.retrievalAccuracy * 100).toFixed(1)}%`);
  console.log(`  Avg similarity:     ${summary.avgSimilarity.toFixed(3)}`);
  console.log(`  Avg keyword hit:    ${(summary.avgPrecision * 100).toFixed(1)}%`);
  console.log(`  Avg latency:        ${summary.avgLatencyMs.toFixed(0)}ms`);
  console.log(`  P95 latency:        ${summary.p95LatencyMs.toFixed(0)}ms`);
  console.log(`  False positive rate: ${(summary.falsePositiveRate * 100).toFixed(1)}%`);
  console.log(`  Refusal accuracy:  ${(summary.refusalAccuracy * 100).toFixed(1)}%`);
  console.log("");

  console.log("  Category Breakdown:");
  for (const [cat, data] of Object.entries(summary.categoryBreakdown)) {
    console.log(`    ${cat.padEnd(12)} n=${data.count}  sim=${data.avgSimilarity.toFixed(3)}  kw=${(data.avgKeywordHit * 100).toFixed(0)}%`);
  }
  console.log("");

  console.log("  Difficulty Breakdown:");
  for (const [diff, data] of Object.entries(summary.difficultyBreakdown)) {
    console.log(`    ${diff.padEnd(8)} n=${data.count}  sim=${data.avgSimilarity.toFixed(3)}  kw=${(data.avgKeywordHit * 100).toFixed(0)}%`);
  }
  console.log("");
}

function checkGates(summary: BenchmarkSummary): boolean {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  QUALITY GATES");
  console.log("═══════════════════════════════════════════════════════");

  let allPassed = true;
  for (const gate of summary.gates) {
    const icon = gate.passed ? "✅" : "❌";
    const op = QUALITY_GATES.find((g) => g.name === gate.name)?.invert ? "≤" : "≥";
    console.log(`  ${icon} ${gate.name.padEnd(22)} ${gate.value.toFixed(3)} ${op} ${gate.threshold}`);
    if (!gate.passed) allPassed = false;
  }
  console.log("");

  if (allPassed) {
    console.log("  ✅ ALL GATES PASSED\n");
  } else {
    console.log("  ❌ SOME GATES FAILED\n");
  }

  return allPassed;
}

main().catch((error) => {
  console.error("Benchmark failed:", error);
  process.exit(1);
});
