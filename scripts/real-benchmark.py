#!/usr/bin/env python3
"""
RAG Retrieval Benchmark — Real Measurement via App Search API

Uses the authenticated MimoNotes search API to run real retrieval queries.
Bypasses embedding mismatch by using the app's own embedding pipeline.

Usage:
    python scripts/real-benchmark.py [--output FILE]
"""

import json
import os
import sys
import time
import re
import http.cookiejar
import urllib.request
import urllib.parse
from datetime import datetime

# ============================================================
# Config
# ============================================================

API_BASE = os.environ.get("API_BASE", "http://localhost:3100")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@mimotes.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
TOP_K = 5

QUALITY_GATES = [
    {"name": "Retrieval Accuracy", "threshold": 0.70, "metric": "retrievalAccuracy", "invert": False},
    {"name": "Avg Similarity", "threshold": 0.40, "metric": "avgSimilarity", "invert": False},
    {"name": "False Positive Rate", "threshold": 0.20, "metric": "falsePositiveRate", "invert": True},
    {"name": "Refusal Accuracy", "threshold": 0.80, "metric": "refusalAccuracy", "invert": False},
    {"name": "Avg Latency (ms)", "threshold": 200, "metric": "avgLatencyMs", "invert": True},
]

# ============================================================
# Benchmark Dataset
# ============================================================

BENCHMARK_QUERIES = [
    {"id": "factual-001", "query": "Apa itu RAG?", "expectedKeywords": ["retrieval", "augmented", "generation"], "category": "factual", "difficulty": "easy", "language": "id", "shouldRetrieve": True},
    {"id": "factual-002", "query": "Bagaimana cara mengupload dokumen?", "expectedKeywords": ["upload", "document", "file"], "category": "factual", "difficulty": "easy", "language": "id", "shouldRetrieve": True},
    {"id": "factual-003", "query": "What is pgvector?", "expectedKeywords": ["pgvector", "postgresql", "vector", "extension"], "category": "factual", "difficulty": "easy", "language": "en", "shouldRetrieve": True},
    {"id": "factual-004", "query": "Apa fungsi dari embedding dalam RAG?", "expectedKeywords": ["embedding", "vector", "representasi"], "category": "factual", "difficulty": "medium", "language": "id", "shouldRetrieve": True},
    {"id": "factual-005", "query": "Bagaimana cara kerja cosine similarity?", "expectedKeywords": ["cosine", "similarity", "vector", "distance"], "category": "factual", "difficulty": "medium", "language": "id", "shouldRetrieve": True},
    {"id": "conceptual-001", "query": "Mengapa chunking penting dalam pipeline RAG?", "expectedKeywords": ["chunk", "split", "context", "retrieval"], "category": "conceptual", "difficulty": "medium", "language": "id", "shouldRetrieve": True},
    {"id": "conceptual-002", "query": "Apa perbedaan antara vector search dan keyword search?", "expectedKeywords": ["vector", "keyword", "semantic", "BM25"], "category": "conceptual", "difficulty": "hard", "language": "id", "shouldRetrieve": True},
    {"id": "conceptual-003", "query": "Bagaimana cara mengurangi hallucination dalam RAG?", "expectedKeywords": ["hallucination", "grounding", "context", "prompt"], "category": "conceptual", "difficulty": "hard", "language": "id", "shouldRetrieve": True},
    {"id": "conceptual-004", "query": "What are the tradeoffs between chunk size and retrieval quality?", "expectedKeywords": ["chunk", "size", "retrieval", "quality", "tradeoff"], "category": "conceptual", "difficulty": "hard", "language": "en", "shouldRetrieve": True},
    {"id": "conceptual-005", "query": "Mengapa hybrid search lebih baik dari vector-only search?", "expectedKeywords": ["hybrid", "search", "vector", "BM25", "RRF"], "category": "conceptual", "difficulty": "hard", "language": "id", "shouldRetrieve": True},
    {"id": "multi-doc-001", "query": "Apa hubungan antara embedding quality dan retrieval precision?", "expectedKeywords": ["embedding", "quality", "retrieval", "precision"], "category": "multi-doc", "difficulty": "hard", "language": "id", "shouldRetrieve": True},
    {"id": "multi-doc-002", "query": "Bagaimana cara mengoptimalkan RAG pipeline secara end-to-end?", "expectedKeywords": ["optimize", "pipeline", "chunk", "embed", "retrieval"], "category": "multi-doc", "difficulty": "hard", "language": "id", "shouldRetrieve": True},
    {"id": "multi-doc-003", "query": "What security considerations exist for a RAG system?", "expectedKeywords": ["security", "SSRF", "injection", "encryption"], "category": "multi-doc", "difficulty": "hard", "language": "en", "shouldRetrieve": True},
    {"id": "multi-doc-004", "query": "Bagaimana NextAuth dan Prisma bekerja bersama dalam aplikasi ini?", "expectedKeywords": ["nextauth", "prisma", "auth", "database"], "category": "multi-doc", "difficulty": "medium", "language": "id", "shouldRetrieve": True},
    {"id": "multi-doc-005", "query": "Jelaskan arsitektur lengkap sistem MimoNotes dari frontend hingga database.", "expectedKeywords": ["nextjs", "react", "postgresql", "prisma", "api"], "category": "multi-doc", "difficulty": "hard", "language": "id", "shouldRetrieve": True},
    {"id": "negative-001", "query": "Bagaimana cara memasak nasi goreng?", "expectedKeywords": [], "category": "negative", "difficulty": "easy", "language": "id", "shouldRetrieve": False},
    {"id": "negative-002", "query": "What is the weather forecast for Jakarta tomorrow?", "expectedKeywords": [], "category": "negative", "difficulty": "easy", "language": "en", "shouldRetrieve": False},
    {"id": "negative-003", "query": "Siapa presiden Indonesia tahun 2030?", "expectedKeywords": [], "category": "negative", "difficulty": "easy", "language": "id", "shouldRetrieve": False},
    {"id": "edge-001", "query": "RAG", "expectedKeywords": ["RAG"], "category": "factual", "difficulty": "easy", "language": "en", "shouldRetrieve": True, "note": "Single-word query"},
    {"id": "edge-002", "query": "Bagaimana cara menggunakan fitur yang belum ada di sistem ini?", "expectedKeywords": [], "category": "negative", "difficulty": "medium", "language": "id", "shouldRetrieve": False, "note": "Non-existent feature"},
]

# ============================================================
# Auth & API
# ============================================================

def create_opener():
    """Create urllib opener with cookie support for NextAuth."""
    cookie_jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(
        urllib.request.HTTPCookieProcessor(cookie_jar)
    )
    opener.addheaders = [("User-Agent", "RAG-Benchmark/1.0")]
    return opener, cookie_jar

def authenticate(opener):
    """Login via NextAuth credentials provider."""
    # 1. Get CSRF token
    req = urllib.request.Request(f"{API_BASE}/api/auth/csrf")
    resp = opener.open(req)
    csrf_data = json.loads(resp.read())
    csrf_token = csrf_data["csrfToken"]

    # 2. Login
    login_data = urllib.parse.urlencode({
        "csrfToken": csrf_token,
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD,
    }).encode()

    req = urllib.request.Request(
        f"{API_BASE}/api/auth/callback/credentials",
        data=login_data,
        method="POST",
    )
    try:
        opener.open(req)
    except urllib.error.HTTPError as e:
        # 302 redirect is expected on successful login
        if e.code not in (302, 200):
            raise
    return True

def search_knowledge(opener, query: str, top_k: int = TOP_K):
    """Call the knowledge search API."""
    payload = json.dumps({"query": query, "topK": top_k}).encode()
    req = urllib.request.Request(
        f"{API_BASE}/api/knowledge/search",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    resp = opener.open(req)
    return json.loads(resp.read())

# ============================================================
# Corpus Stats (via Docker exec)
# ============================================================

def get_corpus_stats_docker():
    """Get corpus stats via docker exec psql."""
    import subprocess

    def psql(query):
        result = subprocess.run(
            ["docker", "exec", "mimotes-db-1", "psql", "-U", "mimotes", "-d", "mimotes", "-t", "-A", "-c", query],
            capture_output=True, text=True, timeout=10,
        )
        return result.stdout.strip()

    total_docs = int(psql("SELECT COUNT(*) FROM documents") or "0")
    total_chunks = int(psql("SELECT COUNT(*) FROM document_chunks") or "0")
    chunks_with_emb = int(psql("SELECT COUNT(*) FROM document_chunks WHERE embedding IS NOT NULL") or "0")

    ft_raw = psql("""
        SELECT file_type || '|' || COUNT(*) || '|' || COALESCE(SUM(chunk_count), 0)
        FROM documents GROUP BY file_type ORDER BY SUM(chunk_count) DESC
    """)
    file_types = []
    for line in ft_raw.split("\n"):
        if "|" in line:
            parts = line.split("|")
            file_types.append({"type": parts[0], "docs": int(parts[1]), "chunks": int(parts[2])})

    # Embedding type check
    sample = psql("SELECT LEFT(embedding::text, 60) FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1")
    is_feature_hash = ",0," in (sample or "")[:30]
    embedding_type = "feature_hashing" if is_feature_hash else "neural"

    # HNSW index check
    idx_check = psql("""
        SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'document_chunks'
        AND indexdef LIKE '%hnsw%'
    """)
    has_hnsw = int(idx_check or "0") > 0

    # Workspace count
    ws_count = int(psql("SELECT COUNT(*) FROM workspaces") or "0")

    return {
        "totalDocuments": total_docs,
        "totalChunks": total_chunks,
        "chunksWithEmbeddings": chunks_with_emb,
        "embeddingType": embedding_type,
        "hasHNSWIndex": has_hnsw,
        "workspaceCount": ws_count,
        "fileTypes": file_types,
    }

# ============================================================
# Benchmark Execution
# ============================================================

def calculate_keyword_hit_rate(content: str, expected_keywords: list) -> float:
    if not expected_keywords:
        return 1.0
    content_lower = content.lower()
    hits = sum(1 for kw in expected_keywords if kw.lower() in content_lower)
    return hits / len(expected_keywords)

def run_benchmark(opener):
    """Run all benchmark queries against real search API."""
    results = []
    total = len(BENCHMARK_QUERIES)

    print(f"\n{'='*60}")
    print(f"  Running {total} benchmark queries against LIVE API")
    print(f"  API: {API_BASE}")
    print(f"  Top-K: {TOP_K}")
    print(f"  Timestamp: {datetime.utcnow().isoformat()}Z")
    print(f"{'='*60}\n")

    for i, q in enumerate(BENCHMARK_QUERIES, 1):
        query_id = q["id"]
        query_text = q["query"]
        should_retrieve = q["shouldRetrieve"]
        expected_keywords = q.get("expectedKeywords", [])

        # Call search API
        start = time.perf_counter()
        try:
            api_result = search_knowledge(opener, query_text)
            chunks = api_result.get("results", [])
            latency_ms = (time.perf_counter() - start) * 1000
        except Exception as e:
            latency_ms = (time.perf_counter() - start) * 1000
            print(f"  [{i:2d}/{total}] ⚠️  {query_id:20s} ERROR: {e}")
            chunks = []

        # Analyze results
        actually_retrieved = len(chunks) > 0
        similarities = [c.get("similarity", 0) for c in chunks]
        max_sim = max(similarities) if similarities else 0
        avg_sim = sum(similarities) / len(similarities) if similarities else 0

        # Gather all retrieved content for keyword check
        all_content = " ".join(
            c.get("content", "") for c in chunks
        )
        # Also check document titles
        all_titles = " ".join(
            c.get("document", {}).get("title", "") for c in chunks
        )
        combined = all_content + " " + all_titles

        keyword_hit_rate = calculate_keyword_hit_rate(combined, expected_keywords)

        # Correct refusal
        correct_refusal = not should_retrieve and not actually_retrieved

        # Top document info
        top_doc = chunks[0].get("document", {}) if chunks else {}
        top_doc_title = top_doc.get("title", "?")[:50] if top_doc else "?"

        result = {
            "queryId": query_id,
            "query": query_text,
            "category": q["category"],
            "difficulty": q["difficulty"],
            "shouldRetrieve": should_retrieve,
            "actuallyRetrieved": actually_retrieved,
            "retrievedCount": len(chunks),
            "avgSimilarity": round(avg_sim, 4),
            "maxSimilarity": round(max_sim, 4),
            "keywordHitRate": round(keyword_hit_rate, 4),
            "correctRefusal": correct_refusal,
            "latencyMs": round(latency_ms, 2),
            "topDocTitle": top_doc_title,
        }
        results.append(result)

        # Status icon
        if should_retrieve:
            icon = "✅" if actually_retrieved else "❌"
        else:
            icon = "✅" if not actually_retrieved else "⚠️ "

        print(f"  [{i:2d}/{total}] {icon} {query_id:20s} "
              f"sim={max_sim:.4f} kw={keyword_hit_rate:.0%} "
              f"lat={latency_ms:.0f}ms docs={len(chunks)} "
              f"top='{top_doc_title[:30]}'")

    return results

# ============================================================
# Summary Calculation
# ============================================================

def calculate_summary(results):
    positive = [r for r in results if r["shouldRetrieve"]]
    negative = [r for r in results if not r["shouldRetrieve"]]

    retrieved_positive = [r for r in positive if r["actuallyRetrieved"]]
    retrieval_accuracy = len(retrieved_positive) / len(positive) if positive else 0

    avg_similarity = sum(r["maxSimilarity"] for r in results) / len(results) if results else 0
    avg_keyword_hit = sum(r["keywordHitRate"] for r in results) / len(results) if results else 0

    latencies = [r["latencyMs"] for r in results]
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    sorted_lat = sorted(latencies)
    p95_idx = int(len(sorted_lat) * 0.95)
    p95_latency = sorted_lat[p95_idx] if sorted_lat else 0

    false_positives = [r for r in negative if r["actuallyRetrieved"]]
    false_positive_rate = len(false_positives) / len(negative) if negative else 0

    correct_refusals = [r for r in negative if r["correctRefusal"]]
    refusal_accuracy = len(correct_refusals) / len(negative) if negative else 1

    # Category breakdown
    cat_breakdown = {}
    for r in results:
        cat = r["category"]
        if cat not in cat_breakdown:
            cat_breakdown[cat] = {"count": 0, "totalSim": 0, "totalKW": 0, "retrieved": 0}
        cat_breakdown[cat]["count"] += 1
        cat_breakdown[cat]["totalSim"] += r["maxSimilarity"]
        cat_breakdown[cat]["totalKW"] += r["keywordHitRate"]
        if r["actuallyRetrieved"]:
            cat_breakdown[cat]["retrieved"] += 1

    for cat in cat_breakdown:
        d = cat_breakdown[cat]
        d["avgSimilarity"] = round(d["totalSim"] / d["count"], 4)
        d["avgKeywordHit"] = round(d["totalKW"] / d["count"], 4)
        d["accuracy"] = round(d["retrieved"] / d["count"], 4)
        del d["totalSim"]
        del d["totalKW"]

    # Difficulty breakdown
    diff_breakdown = {}
    for r in results:
        diff = r["difficulty"]
        if diff not in diff_breakdown:
            diff_breakdown[diff] = {"count": 0, "totalSim": 0, "totalKW": 0, "retrieved": 0}
        diff_breakdown[diff]["count"] += 1
        diff_breakdown[diff]["totalSim"] += r["maxSimilarity"]
        diff_breakdown[diff]["totalKW"] += r["keywordHitRate"]
        if r["actuallyRetrieved"]:
            diff_breakdown[diff]["retrieved"] += 1

    for diff in diff_breakdown:
        d = diff_breakdown[diff]
        d["avgSimilarity"] = round(d["totalSim"] / d["count"], 4)
        d["avgKeywordHit"] = round(d["totalKW"] / d["count"], 4)
        d["accuracy"] = round(d["retrieved"] / d["count"], 4)
        del d["totalSim"]
        del d["totalKW"]

    # Quality gates
    metrics = {
        "retrievalAccuracy": retrieval_accuracy,
        "avgSimilarity": avg_similarity,
        "falsePositiveRate": false_positive_rate,
        "refusalAccuracy": refusal_accuracy,
        "avgLatencyMs": avg_latency,
    }

    gates = []
    for g in QUALITY_GATES:
        value = metrics.get(g["metric"], 0)
        passed = value <= g["threshold"] if g["invert"] else value >= g["threshold"]
        gates.append({"name": g["name"], "value": round(value, 4), "threshold": g["threshold"], "passed": passed})

    return {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "totalQueries": len(results),
        "retrievalAccuracy": round(retrieval_accuracy, 4),
        "avgPrecision": round(avg_keyword_hit, 4),
        "avgSimilarity": round(avg_similarity, 4),
        "avgLatencyMs": round(avg_latency, 2),
        "p95LatencyMs": round(p95_latency, 2),
        "falsePositiveRate": round(false_positive_rate, 4),
        "refusalAccuracy": round(refusal_accuracy, 4),
        "categoryBreakdown": cat_breakdown,
        "difficultyBreakdown": diff_breakdown,
        "gates": gates,
        "perQueryResults": results,
    }

# ============================================================
# Report
# ============================================================

def print_report(summary, corpus_stats):
    print(f"\n{'='*60}")
    print(f"  CORPUS STATISTICS")
    print(f"{'='*60}")
    cs = corpus_stats
    print(f"  Documents:           {cs['totalDocuments']}")
    print(f"  Chunks:              {cs['totalChunks']}")
    print(f"  With embeddings:     {cs['chunksWithEmbeddings']}")
    print(f"  Embedding type:      {cs['embeddingType']}")
    print(f"  HNSW index:          {'YES' if cs['hasHNSWIndex'] else 'NO'}")
    print(f"  Workspaces:          {cs['workspaceCount']}")
    if cs['fileTypes']:
        print(f"  File type distribution:")
        for ft in cs['fileTypes']:
            pct = ft['chunks'] / cs['totalChunks'] * 100 if cs['totalChunks'] > 0 else 0
            print(f"    {ft['type']:12s}  {ft['docs']:3d} docs  {ft['chunks']:6d} chunks  ({pct:.1f}%)")

    s = summary
    print(f"\n{'='*60}")
    print(f"  REAL BENCHMARK RESULTS (via Search API)")
    print(f"{'='*60}")
    print(f"  Total queries:        {s['totalQueries']}")
    print(f"  Retrieval accuracy:   {s['retrievalAccuracy']*100:.1f}%")
    print(f"  Avg max similarity:   {s['avgSimilarity']:.4f}")
    print(f"  Avg keyword hit:      {s['avgPrecision']*100:.1f}%")
    print(f"  Avg latency:          {s['avgLatencyMs']:.0f}ms")
    print(f"  P95 latency:          {s['p95LatencyMs']:.0f}ms")
    print(f"  False positive rate:  {s['falsePositiveRate']*100:.1f}%")
    print(f"  Refusal accuracy:     {s['refusalAccuracy']*100:.1f}%")

    print(f"\n  Category Breakdown:")
    for cat, d in s['categoryBreakdown'].items():
        print(f"    {cat:12s}  n={d['count']}  acc={d['accuracy']*100:.0f}%  "
              f"sim={d['avgSimilarity']:.4f}  kw={d['avgKeywordHit']*100:.0f}%")

    print(f"\n  Difficulty Breakdown:")
    for diff, d in s['difficultyBreakdown'].items():
        print(f"    {diff:8s}  n={d['count']}  acc={d['accuracy']*100:.0f}%  "
              f"sim={d['avgSimilarity']:.4f}  kw={d['avgKeywordHit']*100:.0f}%")

    print(f"\n{'='*60}")
    print(f"  QUALITY GATES")
    print(f"{'='*60}")
    for g in s['gates']:
        icon = "✅" if g['passed'] else "❌"
        op = "≤" if any(gd['invert'] for gd in QUALITY_GATES if gd['name'] == g['name']) else "≥"
        print(f"  {icon} {g['name']:22s}  {g['value']:.4f} {op} {g['threshold']}")

    all_passed = all(g['passed'] for g in s['gates'])
    print()
    print(f"  {'✅ ALL GATES PASSED' if all_passed else '❌ SOME GATES FAILED'}")

    # Worst performers
    positive = [r for r in s['perQueryResults'] if r['shouldRetrieve']]
    missed = [r for r in positive if not r['actuallyRetrieved']]
    if missed:
        print(f"\n  MISSED QUERIES ({len(missed)}/{len(positive)}):")
        for r in missed:
            print(f"    ❌ {r['queryId']:20s}  sim={r['maxSimilarity']:.4f}  \"{r['query'][:50]}\"")

    false_pos = [r for r in s['perQueryResults'] if not r['shouldRetrieve'] and r['actuallyRetrieved']]
    if false_pos:
        print(f"\n  FALSE POSITIVES ({len(false_pos)}):")
        for r in false_pos:
            print(f"    ⚠️  {r['queryId']:20s}  sim={r['maxSimilarity']:.4f}  top='{r.get('topDocTitle','?')[:30]}'")

    # Low similarity retrievals
    retrieved = [r for r in positive if r['actuallyRetrieved']]
    low_sim = [r for r in retrieved if r['maxSimilarity'] < 0.40]
    if low_sim:
        print(f"\n  LOW SIMILARITY RETRIEVED ({len(low_sim)}/{len(retrieved)} queries with sim < 0.40):")
        for r in low_sim:
            print(f"    ⚠️  {r['queryId']:20s}  sim={r['maxSimilarity']:.4f}  top='{r.get('topDocTitle','?')[:30]}'")

    print()

# ============================================================
# Main
# ============================================================

def main():
    import argparse
    parser = argparse.ArgumentParser(description="RAG Retrieval Benchmark — Real Measurements")
    parser.add_argument("--output", "-o", type=str, default="benchmark-results-real.json", help="Output JSON file")
    args = parser.parse_args()

    # Get corpus stats
    print("Getting corpus statistics...")
    try:
        corpus_stats = get_corpus_stats_docker()
    except Exception as e:
        print(f"WARNING: Could not get corpus stats via docker: {e}")
        corpus_stats = {"totalDocuments": 0, "totalChunks": 0, "chunksWithEmbeddings": 0,
                       "embeddingType": "unknown", "hasHNSWIndex": False, "workspaceCount": 0, "fileTypes": []}

    if corpus_stats.get("totalChunks", 0) == 0:
        print("ERROR: No chunks in database.")
        sys.exit(1)

    # Authenticate
    print("Authenticating...")
    opener, _ = create_opener()
    try:
        authenticate(opener)
        print("  Authenticated successfully.")
    except Exception as e:
        print(f"ERROR: Authentication failed: {e}")
        sys.exit(1)

    # Run benchmark
    results = run_benchmark(opener)

    # Calculate summary
    summary = calculate_summary(results)
    summary["corpusStats"] = corpus_stats

    # Print report
    print_report(summary, corpus_stats)

    # Save
    with open(args.output, "w") as f:
        json.dump(summary, f, indent=2, default=str)
    print(f"  Results saved to: {args.output}")

    # Exit code
    all_passed = all(g["passed"] for g in summary["gates"])
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
