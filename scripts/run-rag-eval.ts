/**
 * RAG Evaluation Runner (Optimized for large corpora)
 * 
 * Usage: npx tsx scripts/run-rag-eval.ts
 * 
 * Calls search API with proper auth, computes Precision@5, Recall@5, MRR.
 */

import * as fs from "fs";
import * as path from "path";

const API_BASE = "http://localhost:3100";
const COOKIE_FILE = path.join(process.env.TEMP || "C:\\Users\\SMANSA\\AppData\\Local\\Temp", "eval_cookies.txt");

interface BenchmarkQuery {
  id: number;
  query: string;
  category: string;
  difficulty: string;
  expected_chunk_ids: string[];
  expected_document_ids: string[];
}

function exec(cmd: string): string {
  const { execSync } = require("child_process");
  return execSync(cmd, { encoding: "utf-8", timeout: 120000, maxBuffer: 50 * 1024 * 1024, shell: "bash" }).trim();
}

function psql(sql: string): string {
  const escaped = sql.replace(/"/g, '\\"');
  return exec(`docker exec mimotes-db-1 psql -U mimotes -d mimotes -t -A -c "${escaped}"`);
}

async function authenticate(): Promise<string> {
  const csrfRes = await fetch(`${API_BASE}/api/auth/csrf`);
  const { csrfToken } = await csrfRes.json() as any;
  
  const formData = new URLSearchParams();
  formData.append("csrfToken", csrfToken);
  formData.append("email", "admin@mimotes.com");
  formData.append("password", "admin123");
  
  const res = await fetch(`${API_BASE}/api/auth/callback/credentials`, {
    method: "POST",
    body: formData,
    redirect: "manual",
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });
  
  const cookies = res.headers.get("set-cookie") || "";
  return cookies;
}

async function searchKnowledge(query: string, cookies: string): Promise<any> {
  const csrfRes = await fetch(`${API_BASE}/api/auth/csrf`, { headers: { cookie: cookies } });
  const { csrfToken } = await csrfRes.json() as any;
  
  const res = await fetch(`${API_BASE}/api/knowledge/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookies,
    },
    body: JSON.stringify({ query, topK: 5 }),
  });
  
  return await res.json();
}

function computeMetrics(
  retrievedChunkIds: string[],
  expectedChunkIds: string[],
  retrievedDocIds: string[],
  expectedDocIds: string[]
): { precisionAt5: number; recallAt5: number; mrr: number; docHit: boolean } {
  // Precision@5 (chunk level)
  const relevantRetrieved = retrievedChunkIds.filter(id => expectedChunkIds.includes(id));
  const precisionAt5 = Math.min(relevantRetrieved.length, 5) / 5;

  // Recall@5 (chunk level)
  const recallAt5 = expectedChunkIds.length > 0 
    ? Math.min(relevantRetrieved.length, expectedChunkIds.length) / expectedChunkIds.length 
    : 0;

  // MRR (Reciprocal Rank of first relevant result)
  let mrr = 0;
  for (let i = 0; i < retrievedChunkIds.length; i++) {
    if (expectedChunkIds.includes(retrievedChunkIds[i])) {
      mrr = 1 / (i + 1);
      break;
    }
  }

  // Document-level hit
  const docHit = retrievedDocIds.some(id => expectedDocIds.includes(id));

  return { precisionAt5, recallAt5, mrr, docHit };
}

async function runEvaluation() {
  console.log("🔍 RAG Evaluation Runner (Optimized)");
  console.log("=====================================\n");

  // Load benchmark
  const benchmarkPath = path.join(__dirname, "eval-benchmark.json");
  const benchmark: BenchmarkQuery[] = JSON.parse(fs.readFileSync(benchmarkPath, "utf-8"));
  console.log(`📋 Loaded ${benchmark.length} benchmark queries\n`);

  // Authenticate
  const cookies = await authenticate();
  console.log("🔐 Authenticated\n");

  // Get workspace
  const wsId = psql("SELECT id FROM workspaces LIMIT 1;");
  console.log(`🏢 Workspace: ${wsId}\n`);

  // Run queries
  const results: any[] = [];
  let successCount = 0;
  let errorCount = 0;

  for (const item of benchmark) {
    process.stdout.write(`  [${item.id}/50] ${item.query.substring(0, 50)}... `);
    
    try {
      const searchResult = await searchKnowledge(item.query, cookies);
      
      if (searchResult.error) {
        console.log(`❌ ${searchResult.error}`);
        errorCount++;
        continue;
      }

      const results_list = searchResult.results || [];
      const retrievedChunkIds = results_list.map((r: any) => r.chunkId || r.id || "");
      const retrievedDocIds = [...new Set(results_list.map((r: any) => r.documentId || ""))] as string[];

      const metrics = computeMetrics(
        retrievedChunkIds,
        item.expected_chunk_ids,
        retrievedDocIds,
        item.expected_document_ids
      );

      results.push({
        query_id: item.id,
        query: item.query,
        category: item.category,
        difficulty: item.difficulty,
        precision_at_5: metrics.precisionAt5,
        recall_at_5: metrics.recallAt5,
        mrr: metrics.mrr,
        doc_hit: metrics.docHit,
        top_results: retrievedChunkIds.slice(0, 5),
        expected_chunk_ids: item.expected_chunk_ids,
      });

      console.log(`P@5=${metrics.precisionAt5.toFixed(2)} R@5=${metrics.recallAt5.toFixed(2)} MRR=${metrics.mrr.toFixed(2)}`);
      successCount++;

    } catch (err: any) {
      console.log(`❌ ${err.message?.substring(0, 50)}`);
      errorCount++;
    }
  }

  // Compute aggregate metrics
  console.log("\n=====================================");
  console.log("📊 EVALUATION RESULTS");
  console.log("=====================================\n");

  const avgPrecision = results.reduce((sum, r) => sum + r.precision_at_5, 0) / results.length;
  const avgRecall = results.reduce((sum, r) => sum + r.recall_at_5, 0) / results.length;
  const avgMRR = results.reduce((sum, r) => sum + r.mrr, 0) / results.length;
  const docHitRate = results.filter(r => r.doc_hit).length / results.length;

  // Category breakdown
  const categories = [...new Set(results.map(r => r.category))];
  const categoryMetrics: any = {};
  for (const cat of categories) {
    const catResults = results.filter(r => r.category === cat);
    categoryMetrics[cat] = {
      count: catResults.length,
      avgPrecision: catResults.reduce((s, r) => s + r.precision_at_5, 0) / catResults.length,
      avgRecall: catResults.reduce((s, r) => s + r.recall_at_5, 0) / catResults.length,
      avgMRR: catResults.reduce((s, r) => s + r.mrr, 0) / catResults.length,
      docHitRate: catResults.filter(r => r.doc_hit).length / catResults.length,
    };
  }

  console.log(`Overall Metrics:`);
  console.log(`  Precision@5: ${avgPrecision.toFixed(4)} (${(avgPrecision * 100).toFixed(1)}%)`);
  console.log(`  Recall@5:    ${avgRecall.toFixed(4)} (${(avgRecall * 100).toFixed(1)}%)`);
  console.log(`  MRR:         ${avgMRR.toFixed(4)} (${(avgMRR * 100).toFixed(1)}%)`);
  console.log(`  Doc Hit:     ${docHitRate.toFixed(4)} (${(docHitRate * 100).toFixed(1)}%)`);
  console.log(`  Success:     ${successCount}/${benchmark.length}`);
  console.log(`  Errors:      ${errorCount}`);

  console.log(`\nCategory Breakdown:`);
  for (const [cat, m] of Object.entries(categoryMetrics) as any) {
    console.log(`  ${cat}: P@5=${m.avgPrecision.toFixed(2)} R@5=${m.avgRecall.toFixed(2)} MRR=${m.avgMRR.toFixed(2)} Hit=${(m.docHitRate * 100).toFixed(0)}% (${m.count} queries)`);
  }

  // Worst performing queries
  const sorted = [...results].sort((a, b) => a.mrr - b.mrr);
  console.log(`\n❌ Worst Performing Queries (by MRR):`);
  for (const r of sorted.slice(0, 5)) {
    console.log(`  [${r.query_id}] ${r.query.substring(0, 60)} → MRR=${r.mrr.toFixed(2)} P@5=${r.precision_at_5.toFixed(2)}`);
  }

  // Save results
  const output = {
    timestamp: new Date().toISOString(),
    total_queries: benchmark.length,
    successful: successCount,
    errors: errorCount,
    overall: {
      precision_at_5: avgPrecision,
      recall_at_5: avgRecall,
      mrr: avgMRR,
      doc_hit_rate: docHitRate,
    },
    categories: categoryMetrics,
    queries: results,
  };

  const outputPath = path.join(__dirname, "eval-results.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n💾 Results saved to scripts/eval-results.json`);

  // Store in database
  try {
    psql("DELETE FROM eval_results;");
    for (const r of results) {
      psql(`INSERT INTO eval_results (eval_query_id, workspace_id, retrieved_chunk_ids, precision_at_5, recall_at_5, mrr, doc_hit) 
            VALUES ((SELECT id FROM eval_queries WHERE query = $${r.query}$ LIMIT 1), '${wsId}', 
            '${JSON.stringify(r.top_results)}'::jsonb, ${r.precision_at_5}, ${r.recall_at_5}, ${r.mrr}, ${r.doc_hit});`);
    }
    console.log("📦 Results stored in database");
  } catch (err: any) {
    console.log(`⚠️  DB storage failed: ${err.message?.substring(0, 80)}`);
  }

  return output;
}

runEvaluation().catch(console.error);
