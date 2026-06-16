#!/bin/bash
# ============================================================
# Sprint 14 — Load Testing Script
# ============================================================
# Simple load test using curl + background processes.
# Tests: health endpoint, auth endpoints, API endpoints.

set -e

BASE_URL="${1:-http://localhost:3100}"
CONCURRENT="${2:-10}"
REQUESTS="${3:-100}"
RESULTS_DIR="/tmp/load-test-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$RESULTS_DIR"

echo "============================================"
echo "  Sprint 14 — Load Testing"
echo "  Target: $BASE_URL"
echo "  Concurrent: $CONCURRENT"
echo "  Total Requests: $REQUESTS"
echo "============================================"
echo ""

# ──────────────────────────────────────────────
# 1. Health Endpoint Load Test
# ──────────────────────────────────────────────
echo "━━━ 1. Health Endpoint ($REQUESTS requests, $CONCURRENT concurrent) ━━━"

health_worker() {
  local id=$1
  local start=$(date +%s%N)
  local code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>&1)
  local end=$(date +%s%N)
  local duration=$(( (end - start) / 1000000 ))
  echo "$id|$code|$duration" >> "$RESULTS_DIR/health.csv"
}

> "$RESULTS_DIR/health.csv"
for i in $(seq 1 $REQUESTS); do
  health_worker $i &
  # Limit concurrency
  if (( i % CONCURRENT == 0 )); then
    wait
  fi
done
wait

# Analyze results
TOTAL=$(wc -l < "$RESULTS_DIR/health.csv")
SUCCESS=$(grep -c "|200|" "$RESULTS_DIR/health.csv" || true)
FAILED=$(grep -v "|200|" "$RESULTS_DIR/health.csv" | grep -c "|" || true)
AVG_DURATION=$(awk -F'|' '{sum+=$3; count++} END {if(count>0) print int(sum/count); else print 0}' "$RESULTS_DIR/health.csv")
P95=$(sort -t'|' -k3 -n "$RESULTS_DIR/health.csv" | awk -F'|' -v p95=$(echo "$TOTAL * 95 / 100" | bc) 'NR==p95{print $3}')
P99=$(sort -t'|' -k3 -n "$RESULTS_DIR/health.csv" | awk -F'|' -v p99=$(echo "$TOTAL * 99 / 100" | bc) 'NR==p99{print $3}')

echo "  Total: $TOTAL"
echo "  Success (200): $SUCCESS"
echo "  Failed: $FAILED"
echo "  Avg Latency: ${AVG_DURATION}ms"
echo "  P95 Latency: ${P95}ms"
echo "  P99 Latency: ${P99}ms"
echo ""

# ──────────────────────────────────────────────
# 2. Registration Endpoint Load Test
# ──────────────────────────────────────────────
echo "━━━ 2. Registration Endpoint (limited — rate limited) ━━━"

reg_worker() {
  local id=$1
  local start=$(date +%s%N)
  local code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/register" \
    -F "email=load-$id-$(date +%s)@test.com" \
    -F "password=TestPass123!" 2>&1)
  local end=$(date +%s%N)
  local duration=$(( (end - start) / 1000000 ))
  echo "$id|$code|$duration" >> "$RESULTS_DIR/register.csv"
}

> "$RESULTS_DIR/register.csv"
# Only send 10 requests to test rate limiting
for i in $(seq 1 10); do
  reg_worker $i &
done
wait

REG_TOTAL=$(wc -l < "$RESULTS_DIR/register.csv")
REG_200=$(grep -c "|200|" "$RESULTS_DIR/register.csv" || true)
REG_429=$(grep -c "|429|" "$RESULTS_DIR/register.csv" || true)
REG_400=$(grep -c "|400|" "$RESULTS_DIR/register.csv" || true)

echo "  Total: $REG_TOTAL"
echo "  Success (200): $REG_200"
echo "  Rate Limited (429): $REG_429"
echo "  Validation Error (400): $REG_400"
echo ""

# ──────────────────────────────────────────────
# 3. Concurrent Health Check (burst test)
# ──────────────────────────────────────────────
echo "━━━ 3. Burst Test (50 simultaneous requests) ━━━"

> "$RESULTS_DIR/burst.csv"
BURST_START=$(date +%s%N)
for i in $(seq 1 50); do
  (
    local start=$(date +%s%N)
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>&1)
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 ))
    echo "$i|$code|$duration" >> "$RESULTS_DIR/burst.csv"
  ) &
done
wait
BURST_END=$(date +%s%N)
BURST_TOTAL_TIME=$(( (BURST_END - BURST_START) / 1000000 ))

BURST_SUCCESS=$(grep -c "|200|" "$RESULTS_DIR/burst.csv" || true)
BURST_FAILED=$(grep -v "|200|" "$RESULTS_DIR/burst.csv" | grep -c "|" || true)
BURST_AVG=$(awk -F'|' '{sum+=$3; count++} END {if(count>0) print int(sum/count); else print 0}' "$RESULTS_DIR/burst.csv")

echo "  Requests: 50"
echo "  Success: $BURST_SUCCESS"
echo "  Failed: $BURST_FAILED"
echo "  Total Time: ${BURST_TOTAL_TIME}ms"
echo "  Avg Latency: ${BURST_AVG}ms"
echo "  Throughput: $(echo "scale=1; 50000 / $BURST_TOTAL_TIME" | bc) req/s"
echo ""

# ──────────────────────────────────────────────
# 4. Homepage Load Test
# ──────────────────────────────────────────────
echo "━━━ 4. Homepage Load Test (20 requests) ━━━"

> "$RESULTS_DIR/homepage.csv"
for i in $(seq 1 20); do
  (
    local start=$(date +%s%N)
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/" 2>&1)
    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 ))
    echo "$i|$code|$duration" >> "$RESULTS_DIR/homepage.csv"
  ) &
  if (( i % 5 == 0 )); then
    wait
  fi
done
wait

HP_TOTAL=$(wc -l < "$RESULTS_DIR/homepage.csv")
HP_200=$(grep -c "|200|" "$RESULTS_DIR/homepage.csv" || true)
HP_AVG=$(awk -F'|' '{sum+=$3; count++} END {if(count>0) print int(sum/count); else print 0}' "$RESULTS_DIR/homepage.csv")

echo "  Total: $HP_TOTAL"
echo "  Success (200): $HP_200"
echo "  Avg Latency: ${HP_AVG}ms"
echo ""

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
echo "============================================"
echo "  LOAD TEST SUMMARY"
echo "============================================"
echo "  Health: $SUCCESS/$TOTAL success, avg ${AVG_DURATION}ms"
echo "  Register: $REG_200 success, $REG_429 rate-limited"
echo "  Burst: $BURST_SUCCESS/50 success, ${BURST_TOTAL_TIME}ms total"
echo "  Homepage: $HP_200/$HP_TOTAL success, avg ${HP_AVG}ms"
echo ""
echo "Results saved to: $RESULTS_DIR/"
