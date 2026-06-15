/**
 * Sync Eval Ground Truth
 * 
 * Usage: npx tsx scripts/sync-eval-ground-truth.ts
 * 
 * Reads eval-benchmark.json and syncs ground truth to database.
 * Updates: eval_queries.expected_document_ids, eval_queries.expected_chunk_ids
 */

import * as fs from "fs";
import * as path from "path";

function exec(cmd: string): string {
  const { execSync } = require("child_process");
  return execSync(cmd, { encoding: "utf-8", timeout: 60000, shell: "bash" }).trim();
}

function psql(sql: string): string {
  const escaped = sql.replace(/"/g, '\\"');
  return exec(`docker exec mimotes-db-1 psql -U mimotes -d mimotes -t -A -c "${escaped}"`);
}

async function syncGroundTruth(): Promise<void> {
  console.log("🔄 Syncing Eval Ground Truth");
  console.log("===========================\n");

  // Load JSON benchmark
  const benchmarkPath = path.join(__dirname, "eval-benchmark.json");
  const queries = JSON.parse(fs.readFileSync(benchmarkPath, "utf-8"));
  console.log(`📋 Loaded ${queries.length} queries from JSON\n`);

  // Get workspace
  const workspaceId = psql("SELECT workspace_id FROM workspace_members WHERE role='owner' LIMIT 1;");
  console.log(`🏢 Workspace: ${workspaceId}\n`);

  let updated = 0;
  let skipped = 0;

  for (const q of queries) {
    const queryEscaped = q.query.replace(/'/g, "''");
    const docIds = JSON.stringify(q.expected_document_ids || []);
    const chunkIds = JSON.stringify(q.expected_chunk_ids || []);

    try {
      psql(`UPDATE eval_queries 
        SET expected_document_ids = '${docIds}'::JSONB,
            expected_chunk_ids = '${chunkIds}'::JSONB
        WHERE query = '${queryEscaped}' AND workspace_id = '${workspaceId}';`);
      updated++;
    } catch (err: any) {
      console.error(`❌ Failed: "${q.query.slice(0, 40)}..." → ${err.message?.slice(0, 60)}`);
      skipped++;
    }
  }

  console.log(`\n✅ Sync complete: ${updated} updated, ${skipped} skipped`);

  // Verify
  const total = psql(`SELECT COUNT(*) FROM eval_queries WHERE workspace_id = '${workspaceId}';`);
  const withDocs = psql(`SELECT COUNT(*) FROM eval_queries WHERE workspace_id = '${workspaceId}' AND expected_document_ids != '[]'::JSONB;`);
  const withChunks = psql(`SELECT COUNT(*) FROM eval_queries WHERE workspace_id = '${workspaceId}' AND expected_chunk_ids != '[]'::JSONB;`);

  console.log(`\n📊 Verification:`);
  console.log(`   Total queries: ${total}`);
  console.log(`   With doc IDs: ${withDocs}`);
  console.log(`   With chunk IDs: ${withChunks}`);
}

syncGroundTruth()
  .then(() => { console.log("\n✅ Done!"); process.exit(0); })
  .catch((err) => { console.error("\n❌ Failed:", err); process.exit(1); });
