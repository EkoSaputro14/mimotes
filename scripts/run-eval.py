"""
RAG Evaluation Runner (Python version)
Runs evaluation queries against the search API and computes metrics.
"""
import json
import subprocess
import urllib.request
import urllib.parse
import http.cookiejar
import ssl
import time
import sys

API_BASE = "http://localhost:3100"

def exec(cmd):
    r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
    return r.stdout.strip()

def psql(sql):
    escaped = sql.replace('"', '\\"')
    return exec(f'docker exec mimotes-db-1 psql -U mimotes -d mimotes -t -A -c "{escaped}"')

def create_opener():
    cj = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
    return opener, cj

def authenticate(opener):
    # Get CSRF token
    resp = opener.open(f"{API_BASE}/api/auth/csrf")
    csrf_data = json.loads(resp.read())
    csrf_token = csrf_data["csrfToken"]
    
    # Sign in
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
        pass  # Redirect is expected
    
    # Verify session
    resp = opener.open(f"{API_BASE}/api/auth/session")
    session = json.loads(resp.read())
    return session is not None and "user" in session

def search(opener, query, top_k=5):
    data = json.dumps({"query": query, "topK": top_k}).encode()
    req = urllib.request.Request(
        f"{API_BASE}/api/knowledge/search",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    resp = opener.open(req)
    return json.loads(resp.read())

def compute_metrics(retrieved_chunk_ids, expected_chunk_ids, retrieved_doc_ids, expected_doc_ids):
    # Precision@5
    relevant = [c for c in retrieved_chunk_ids[:5] if c in expected_chunk_ids]
    precision_at_5 = len(relevant) / 5.0
    
    # Recall@5
    if expected_chunk_ids:
        recall_at_5 = len([c for c in retrieved_chunk_ids[:5] if c in expected_chunk_ids]) / len(expected_chunk_ids)
    else:
        recall_at_5 = 0.0
    
    # MRR
    mrr = 0.0
    for i, c in enumerate(retrieved_chunk_ids):
        if c in expected_chunk_ids:
            mrr = 1.0 / (i + 1)
            break
    
    # Doc hit
    doc_hit = any(d in expected_doc_ids for d in retrieved_doc_ids)
    
    return precision_at_5, recall_at_5, mrr, doc_hit

def main():
    print("🔍 RAG Evaluation Runner (Python)")
    print("==================================\n")
    
    # Load benchmark
    with open("scripts/eval-benchmark.json") as f:
        benchmark = json.load(f)
    print(f"📋 Loaded {len(benchmark)} benchmark queries\n")
    
    # Authenticate
    opener, cj = create_opener()
    if authenticate(opener):
        print("🔐 Authenticated\n")
    else:
        print("❌ Authentication failed")
        sys.exit(1)
    
    # Get workspace
    ws_id = psql("SELECT id FROM workspaces LIMIT 1;")
    print(f"🏢 Workspace: {ws_id}\n")
    
    # Run queries
    results = []
    success = 0
    errors = 0
    
    for item in benchmark:
        sys.stdout.write(f"  [{item['id']}/50] {item['query'][:50]}... ")
        sys.stdout.flush()
        
        try:
            search_result = search(opener, item["query"], top_k=5)
            
            if "error" in search_result:
                print(f"❌ {search_result['error']}")
                errors += 1
                continue
            
            result_list = search_result.get("results", [])
            retrieved_chunk_ids = [r.get("id", "") for r in result_list]
            retrieved_doc_ids = list(set(r.get("document", {}).get("id", "") for r in result_list))
            
            p5, r5, mrr, doc_hit = compute_metrics(
                retrieved_chunk_ids, item["expected_chunk_ids"],
                retrieved_doc_ids, item["expected_document_ids"]
            )
            
            results.append({
                "query_id": item["id"],
                "query": item["query"],
                "category": item["category"],
                "difficulty": item["difficulty"],
                "precision_at_5": p5,
                "recall_at_5": r5,
                "mrr": mrr,
                "doc_hit": doc_hit,
                "top_results": retrieved_chunk_ids[:5],
                "expected_chunk_ids": item["expected_chunk_ids"],
            })
            
            print(f"P@5={p5:.2f} R@5={r5:.2f} MRR={mrr:.2f}")
            success += 1
            
        except Exception as e:
            print(f"❌ {str(e)[:60]}")
            errors += 1
    
    # Aggregate
    print("\n===================================")
    print("📊 EVALUATION RESULTS")
    print("===================================\n")
    
    if not results:
        print("No successful results!")
        sys.exit(1)
    
    avg_p5 = sum(r["precision_at_5"] for r in results) / len(results)
    avg_r5 = sum(r["recall_at_5"] for r in results) / len(results)
    avg_mrr = sum(r["mrr"] for r in results) / len(results)
    doc_hit_rate = sum(1 for r in results if r["doc_hit"]) / len(results)
    
    # Category breakdown
    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(r)
    
    print(f"Overall Metrics:")
    print(f"  Precision@5: {avg_p5:.4f} ({avg_p5*100:.1f}%)")
    print(f"  Recall@5:    {avg_r5:.4f} ({avg_r5*100:.1f}%)")
    print(f"  MRR:         {avg_mrr:.4f} ({avg_mrr*100:.1f}%)")
    print(f"  Doc Hit:     {doc_hit_rate:.4f} ({doc_hit_rate*100:.1f}%)")
    print(f"  Success:     {success}/{len(benchmark)}")
    print(f"  Errors:      {errors}")
    
    print(f"\nCategory Breakdown:")
    for cat, cat_results in sorted(categories.items()):
        cp5 = sum(r["precision_at_5"] for r in cat_results) / len(cat_results)
        cr5 = sum(r["recall_at_5"] for r in cat_results) / len(cat_results)
        cmrr = sum(r["mrr"] for r in cat_results) / len(cat_results)
        cdr = sum(1 for r in cat_results if r["doc_hit"]) / len(cat_results)
        print(f"  {cat}: P@5={cp5:.2f} R@5={cr5:.2f} MRR={cmrr:.2f} Hit={cdr*100:.0f}% ({len(cat_results)} queries)")
    
    # Worst queries
    sorted_results = sorted(results, key=lambda r: r["mrr"])
    print(f"\n❌ Worst Performing Queries (by MRR):")
    for r in sorted_results[:5]:
        print(f"  [{r['query_id']}] {r['query'][:60]} → MRR={r['mrr']:.2f} P@5={r['precision_at_5']:.2f}")
    
    # Best queries
    print(f"\n✅ Best Performing Queries (by MRR):")
    for r in sorted_results[-5:]:
        print(f"  [{r['query_id']}] {r['query'][:60]} → MRR={r['mrr']:.2f} P@5={r['precision_at_5']:.2f}")
    
    # Save results
    output = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "total_queries": len(benchmark),
        "successful": success,
        "errors": errors,
        "overall": {
            "precision_at_5": avg_p5,
            "recall_at_5": avg_r5,
            "mrr": avg_mrr,
            "doc_hit_rate": doc_hit_rate,
        },
        "categories": {
            cat: {
                "count": len(cat_results),
                "avg_precision": sum(r["precision_at_5"] for r in cat_results) / len(cat_results),
                "avg_recall": sum(r["recall_at_5"] for r in cat_results) / len(cat_results),
                "avg_mrr": sum(r["mrr"] for r in cat_results) / len(cat_results),
                "doc_hit_rate": sum(1 for r in cat_results if r["doc_hit"]) / len(cat_results),
            }
            for cat, cat_results in categories.items()
        },
        "queries": results,
    }
    
    with open("scripts/eval-results.json", "w") as f:
        json.dump(output, f, indent=2)
    print(f"\n💾 Results saved to scripts/eval-results.json")
    
    return output

if __name__ == "__main__":
    main()
