/**
 * Audit Eval Dataset
 * 
 * Usage: npx tsx scripts/audit-eval-dataset.ts
 * 
 * Outputs: total queries, ground truth coverage, invalid references, etc.
 */

function exec(cmd: string): string {
  const { execSync } = require("child_process");
  return execSync(cmd, { encoding: "utf-8", timeout: 60000, shell: "bash" }).trim();
}

function psql(sql: string): string {
  const escaped = sql.replace(/"/g, '\\"');
  return exec(`docker exec mimotes-db-1 psql -U mimotes -d mimotes -t -A -c "${escaped}"`);
}

function audit(): void {
  console.log("🔍 Eval Dataset Audit");
  console.log("=====================\n");

  const workspaceId = psql("SELECT workspace_id FROM workspace_members WHERE role='owner' LIMIT 1;");
  console.log(`🏢 Workspace: ${workspaceId}\n`);

  // Total queries
  const total = parseInt(psql(`SELECT COUNT(*) FROM eval_queries WHERE workspace_id = '${workspaceId}';`));
  console.log(`Total queries: ${total}`);

  // Ground truth coverage
  const withDocIds = parseInt(psql(`SELECT COUNT(*) FROM eval_queries WHERE workspace_id = '${workspaceId}' AND expected_document_ids != '[]'::JSONB;`));
  const withChunkIds = parseInt(psql(`SELECT COUNT(*) FROM eval_queries WHERE workspace_id = '${workspaceId}' AND expected_chunk_ids != '[]'::JSONB;`));
  const withEither = parseInt(psql(`SELECT COUNT(*) FROM eval_queries WHERE workspace_id = '${workspaceId}' AND (expected_document_ids != '[]'::JSONB OR expected_chunk_ids != '[]'::JSONB);`));

  console.log(`\nGround Truth Coverage:`);
  console.log(`  With document IDs: ${withDocIds}/${total} (${(withDocIds/total*100).toFixed(0)}%)`);
  console.log(`  With chunk IDs: ${withChunkIds}/${total} (${(withChunkIds/total*100).toFixed(0)}%)`);
  console.log(`  With either: ${withEither}/${total} (${(withEither/total*100).toFixed(0)}%)`);

  // Category breakdown
  console.log(`\nBy Category:`);
  const catResult = psql(`SELECT category, 
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE expected_document_ids != '[]'::JSONB OR expected_chunk_ids != '[]'::JSONB) as with_gt
    FROM eval_queries WHERE workspace_id = '${workspaceId}'
    GROUP BY category ORDER BY category;`);
  console.log(catResult);

  // Difficulty breakdown
  console.log(`By Difficulty:`);
  const diffResult = psql(`SELECT difficulty,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE expected_document_ids != '[]'::JSONB OR expected_chunk_ids != '[]'::JSONB) as with_gt
    FROM eval_queries WHERE workspace_id = '${workspaceId}'
    GROUP BY difficulty ORDER BY difficulty;`);
  console.log(diffResult);

  // Invalid references (chunk IDs that don't exist)
  console.log(`\nInvalid References:`);
  const invalidChunks = psql(`SELECT eq.query, eq.expected_chunk_ids
    FROM eval_queries eq
    WHERE eq.workspace_id = '${workspaceId}'
      AND eq.expected_chunk_ids != '[]'::JSONB
      AND NOT eq.expected_chunk_ids <@ (
        SELECT jsonb_agg(id) FROM document_chunks
      );`);
  console.log(invalidChunks || "  None found");

  // Orphan chunk IDs
  console.log(`\nOrphan Check (chunks referenced but not in DB):`);
  const orphanResult = psql(`SELECT COUNT(DISTINCT chunk_id) FROM jsonb_array_elements_text(
    (SELECT expected_chunk_ids FROM eval_queries WHERE workspace_id = '${workspaceId}' AND expected_chunk_ids != '[]'::JSONB)
  ) AS chunk_id WHERE chunk_id NOT IN (SELECT id FROM document_chunks);`);
  console.log(`  Orphan chunk refs: ${orphanResult || "0"}`);

  // Eval results summary
  console.log(`\nEval Results:`);
  const evalCount = parseInt(psql(`SELECT COUNT(*) FROM eval_results WHERE workspace_id = '${workspaceId}';`));
  const aggregateCount = parseInt(psql(`SELECT COUNT(*) FROM eval_results WHERE workspace_id = '${workspaceId}' AND search_mode = 'aggregate';`));
  console.log(`  Total results: ${evalCount}`);
  console.log(`  Aggregate runs: ${aggregateCount}`);

  // Verdict
  const coverage = (withEither / total * 100);
  console.log(`\n📊 VERDICT:`);
  if (coverage >= 80) {
    console.log(`  ✅ Coverage ${coverage.toFixed(0)}% meets 80% minimum`);
  } else {
    console.log(`  ⚠️ Coverage ${coverage.toFixed(0)}% is below 80% minimum`);
    console.log(`  Note: With only ${total} chunks in KB, many queries have no relevant content.`);
  }
}

audit();
