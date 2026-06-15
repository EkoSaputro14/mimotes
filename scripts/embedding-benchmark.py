"""
Embedding Validation Benchmark
Tests embedding quality for 5 query/document pairs.
"""
import json
import subprocess
import urllib.request
import urllib.parse
import http.cookiejar
import math
import time

API_BASE = "http://localhost:3100"

def exec_cmd(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
    return r.stdout.strip()

def psql(sql):
    escaped = sql.replace('"', '\\"')
    return exec_cmd(f'docker exec mimotes-db-1 psql -U mimotes -d mimotes -t -A -c "{escaped}"')

def create_opener():
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    return opener, cj

def authenticate(opener):
    resp = opener.open(f"{API_BASE}/api/auth/csrf")
    csrf_data = json.loads(resp.read())
    csrf_token = csrf_data["csrfToken"]
    
    data = urllib.parse.urlencode({
        "csrfToken": csrf_token,
        "email": "admin@mimotes.com",
        "password": "admin123"
    }).encode()
    
    req = urllib.request.Request(
        f"{API_BASE}/api/auth/callback/credentials",
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    try:
        opener.open(req)
    except:
        pass

def search(opener, query, top_k=10):
    data = json.dumps({"query": query, "topK": top_k}).encode()
    req = urllib.request.Request(
        f"{API_BASE}/api/knowledge/search",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    resp = opener.open(req)
    return json.loads(resp.read())

def cosine_similarity_from_db(chunk_id_a, chunk_id_b):
    """Compute cosine similarity between two chunks using pgvector."""
    result = psql(f"""
        SELECT 1 - (a.embedding <=> b.embedding) as cosine_sim
        FROM document_chunks a, document_chunks b
        WHERE a.id = '{chunk_id_a}' AND b.id = '{chunk_id_b}';
    """)
    return float(result) if result else None

def get_embedding_from_db(chunk_id):
    """Get raw embedding vector from database."""
    result = psql(f"""
        SELECT embedding::text FROM document_chunks WHERE id = '{chunk_id}';
    """)
    if result:
        # Parse the vector string
        vec_str = result.strip()
        if vec_str.startswith('[') and vec_str.endswith(']'):
            vals = [float(x) for x in vec_str[1:-1].split(',')]
            return vals
    return None

def compute_cosine(vec_a, vec_b):
    """Compute cosine similarity between two vectors."""
    if len(vec_a) != len(vec_b):
        return None
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

def main():
    print("🔍 Embedding Validation Benchmark")
    print("==================================\n")
    
    # Authenticate
    opener, cj = create_opener()
    authenticate(opener)
    print("🔐 Authenticated\n")
    
    # Test pairs: query -> expected document title
    test_pairs = [
        {
            "query": "How to install and run Docker containers",
            "expected_doc": "nginx-readme.txt",
            "description": "Docker ↔ Docker README",
        },
        {
            "query": "How to compile the Linux kernel from source",
            "expected_doc": "linux-kernel-readme.txt",
            "description": "Linux ↔ Linux Kernel README",
        },
        {
            "query": "PostgreSQL database configuration and setup",
            "expected_doc": "postgresql-9.6-US.pdf",
            "description": "PostgreSQL ↔ PostgreSQL Docs",
        },
        {
            "query": "Mimotes AI knowledge base platform requirements",
            "expected_doc": "business-requirements.docx",
            "description": "Mimotes ↔ BRD Mimotes",
        },
        {
            "query": "Invoice for server hardware purchase total amount",
            "expected_doc": "invoice.docx",
            "description": "Invoice ↔ Invoice DOCX",
        },
    ]
    
    results = []
    
    for i, pair in enumerate(test_pairs):
        print(f"--- Test {i+1}: {pair['description']} ---")
        print(f"  Query: {pair['query']}")
        print(f"  Expected: {pair['expected_doc']}")
        
        # Search
        search_result = search(opener, pair["query"], top_k=10)
        result_list = search_result.get("results", [])
        
        if not result_list:
            print("  ❌ No results returned\n")
            results.append({"pair": pair["description"], "status": "no_results"})
            continue
        
        # Find expected doc in results
        found_at = None
        for j, r in enumerate(result_list):
            doc_title = r.get("document", {}).get("title", "")
            if doc_title == pair["expected_doc"]:
                found_at = j + 1
                break
        
        # Show top 5 results
        print(f"  Top 5 results:")
        for j, r in enumerate(result_list[:5]):
            doc_title = r.get("document", {}).get("title", "?")
            sim = r.get("similarity", 0)
            chunk_idx = r.get("chunkIndex", "?")
            content_preview = r.get("content", "")[:80].replace("\n", " ")
            marker = "✅" if doc_title == pair["expected_doc"] else "  "
            print(f"    {marker} #{j+1} Sim={sim:.4f} Doc={doc_title[:35]} Chunk={chunk_idx}")
            print(f"       Content: {content_preview}")
        
        # Ranking analysis
        if found_at:
            print(f"  📊 Expected doc found at rank #{found_at} (MRR = {1/found_at:.2f})")
        else:
            print(f"  ❌ Expected doc NOT found in top {len(result_list)} results")
        
        # Check similarity scores
        sims = [r.get("similarity", 0) for r in result_list]
        print(f"  Similarity range: {min(sims):.4f} — {max(sims):.4f}")
        
        results.append({
            "pair": pair["description"],
            "query": pair["query"],
            "expected_doc": pair["expected_doc"],
            "found_at": found_at,
            "top_similarities": sims[:5],
            "avg_similarity": sum(sims) / len(sims) if sims else 0,
        })
        print()
    
    # ============================================================
    # Similarity Distribution Analysis
    # ============================================================
    print("=" * 50)
    print("📊 SIMILARITY DISTRIBUTION ANALYSIS")
    print("=" * 50)
    
    # Get all similarity scores from recent search
    all_sims = []
    for r in results:
        all_sims.extend(r.get("top_similarities", []))
    
    if all_sims:
        all_sims.sort()
        print(f"\nAll similarity scores from top-5 results:")
        print(f"  Count:  {len(all_sims)}")
        print(f"  Min:    {min(all_sims):.4f}")
        print(f"  Max:    {max(all_sims):.4f}")
        print(f"  Mean:   {sum(all_sims)/len(all_sims):.4f}")
        print(f"  Median: {all_sims[len(all_sims)//2]:.4f}")
        
        # Distribution buckets
        buckets = {"0.0-0.2": 0, "0.2-0.3": 0, "0.3-0.4": 0, "0.4-0.5": 0, "0.5-0.6": 0, "0.6-0.8": 0, "0.8-1.0": 0}
        for s in all_sims:
            if s < 0.2: buckets["0.0-0.2"] += 1
            elif s < 0.3: buckets["0.2-0.3"] += 1
            elif s < 0.4: buckets["0.3-0.4"] += 1
            elif s < 0.5: buckets["0.4-0.5"] += 1
            elif s < 0.6: buckets["0.5-0.6"] += 1
            elif s < 0.8: buckets["0.6-0.8"] += 1
            else: buckets["0.8-1.0"] += 1
        
        print(f"\n  Distribution:")
        for bucket, count in buckets.items():
            bar = "█" * count
            print(f"    {bucket}: {count:3d} {bar}")
    
    # ============================================================
    # False Positive / False Negative Analysis
    # ============================================================
    print("\n" + "=" * 50)
    print("❌ FALSE POSITIVE / FALSE NEGATIVE ANALYSIS")
    print("=" * 50)
    
    for r in results:
        if r.get("found_at"):
            print(f"\n  ✅ TRUE POSITIVE: {r['pair']}")
            print(f"     Found at rank #{r['found_at']}")
        else:
            print(f"\n  ❌ FALSE NEGATIVE: {r['pair']}")
            print(f"     Query: {r['query']}")
            print(f"     Expected: {r['expected_doc']}")
            print(f"     Top result: different document")
    
    # ============================================================
    # Cross-similarity test
    # ============================================================
    print("\n" + "=" * 50)
    print("🔬 CROSS-DOCUMENT SIMILARITY TEST")
    print("=" * 50)
    
    # Get a chunk from each document type
    sample_chunks = {}
    for doc_type in ["postgresql-9.6-US.pdf", "business-requirements.docx", "invoice.docx", "lelang1.jpg", "linux-kernel-readme.txt"]:
        result = psql(f"""
            SELECT c.id, LEFT(c.content, 100) as preview
            FROM document_chunks c JOIN documents d ON d.id = c.document_id
            WHERE d.title = '{doc_type}' AND LENGTH(c.content) > 50
            LIMIT 1;
        """)
        if result:
            parts = result.split("|", 1)
            chunk_id = parts[0].strip()
            preview = parts[1].strip() if len(parts) > 1 else ""
            sample_chunks[doc_type] = {"id": chunk_id, "preview": preview[:80]}
    
    print(f"\nSample chunks found: {len(sample_chunks)}")
    
    # Compute cross-similarities
    if len(sample_chunks) >= 2:
        docs = list(sample_chunks.keys())
        print(f"\nCross-document cosine similarities:")
        print(f"{'':30s}", end="")
        for d in docs:
            print(f"  {d[:12]:>12s}", end="")
        print()
        
        for d1 in docs:
            print(f"  {d1[:28]:28s}", end="")
            for d2 in docs:
                sim = cosine_similarity_from_db(sample_chunks[d1]["id"], sample_chunks[d2]["id"])
                if sim is not None:
                    marker = "★" if d1 == d2 else " "
                    print(f"  {sim:10.4f}{marker}", end="")
                else:
                    print(f"  {'N/A':>11s}", end="")
            print()
    
    # ============================================================
    # Embedding sparsity test
    # ============================================================
    print("\n" + "=" * 50)
    print("🔬 EMBEDDING SPARSITY ANALYSIS")
    print("=" * 50)
    
    # Check how sparse the embeddings are
    for doc_type in ["postgresql-9.6-US.pdf", "invoice.docx", "lelang1.jpg"]:
        result = psql(f"""
            SELECT c.id FROM document_chunks c JOIN documents d ON d.id = c.document_id
            WHERE d.title = '{doc_type}' LIMIT 1;
        """)
        if result:
            chunk_id = result.strip()
            vec = get_embedding_from_db(chunk_id)
            if vec:
                zeros = sum(1 for v in vec if v == 0.0)
                nonzeros = len(vec) - zeros
                sparsity = zeros / len(vec) * 100
                print(f"\n  {doc_type}:")
                print(f"    Dimension: {len(vec)}")
                print(f"    Zero values: {zeros} ({sparsity:.1f}%)")
                print(f"    Non-zero values: {nonzeros} ({100-sparsity:.1f}%)")
                print(f"    L2 norm: {math.sqrt(sum(v*v for v in vec)):.4f}")
                
                # Check for collision patterns
                vals = [v for v in vec if v != 0]
                if vals:
                    unique_vals = set(round(v, 6) for v in vals)
                    print(f"    Unique non-zero values: {len(unique_vals)}")
                    print(f"    Value range: [{min(vals):.6f}, {max(vals):.6f}]")
    
    # Save results
    output = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "test_pairs": results,
        "summary": {
            "total_tests": len(test_pairs),
            "found": sum(1 for r in results if r.get("found_at")),
            "not_found": sum(1 for r in results if not r.get("found_at")),
        }
    }
    
    with open("scripts/embedding-benchmark-results.json", "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n💾 Results saved to scripts/embedding-benchmark-results.json")

if __name__ == "__main__":
    main()
