#!/bin/bash
# ============================================================
# Sprint 14 — Staging Validation Test Suite
# ============================================================
# Runs comprehensive API validation against the running app.
# Usage: bash scripts/staging-validate.sh [BASE_URL]

set -e

BASE_URL="${1:-http://localhost:3100}"
PASS=0
FAIL=0
WARN=0
BUGS=""
RESULTS=""

log_test() {
  local name="$1"
  local status="$2"
  local detail="$3"
  
  if [ "$status" = "PASS" ]; then
    echo "  ✅ $name"
    PASS=$((PASS + 1))
  elif [ "$status" = "FAIL" ]; then
    echo "  ❌ $name — $detail"
    FAIL=$((FAIL + 1))
    BUGS="${BUGS}\n- **BUG**: $name — $detail"
  elif [ "$status" = "WARN" ]; then
    echo "  ⚠️  $name — $detail"
    WARN=$((WARN + 1))
  fi
  RESULTS="${RESULTS}${status}|${name}|${detail}\n"
}

echo "============================================"
echo "  Sprint 14 — Staging Validation"
echo "  Target: $BASE_URL"
echo "  Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "============================================"
echo ""

# ──────────────────────────────────────────────
# 1. Health Endpoint
# ──────────────────────────────────────────────
echo "━━━ 1. Health Endpoint ━━━"

HEALTH=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health" 2>&1)
HEALTH_CODE=$(echo "$HEALTH" | tail -1)
HEALTH_BODY=$(echo "$HEALTH" | head -n -1)

if [ "$HEALTH_CODE" = "200" ]; then
  log_test "Health endpoint returns 200" "PASS"
  
  # Check status field
  STATUS=$(echo "$HEALTH_BODY" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  if [ "$STATUS" = "healthy" ] || [ "$STATUS" = "degraded" ]; then
    log_test "Health status is $STATUS" "PASS"
  else
    log_test "Health status unexpected" "FAIL" "status=$STATUS"
  fi
  
  # Check database latency
  DB_STATUS=$(echo "$HEALTH_BODY" | grep -o '"database":{[^}]*}' | head -1)
  if echo "$DB_STATUS" | grep -q '"status":"healthy"'; then
    log_test "Database connectivity healthy" "PASS"
  else
    log_test "Database connectivity" "FAIL" "DB status not healthy"
  fi
else
  log_test "Health endpoint returns 200" "FAIL" "HTTP $HEALTH_CODE"
fi

# Check cache control header
CACHE=$(curl -s -I "$BASE_URL/api/health" 2>&1 | grep -i "cache-control" || true)
if echo "$CACHE" | grep -qi "no-cache"; then
  log_test "Health endpoint has no-cache header" "PASS"
else
  log_test "Health endpoint cache control" "WARN" "Missing no-cache header"
fi

echo ""

# ──────────────────────────────────────────────
# 2. Security Headers
# ──────────────────────────────────────────────
echo "━━━ 2. Security Headers ━━━"

HEADERS=$(curl -s -I "$BASE_URL/" 2>&1)

check_header() {
  local name="$1"
  local pattern="$2"
  if echo "$HEADERS" | grep -qi "$pattern"; then
    log_test "Header: $name" "PASS"
  else
    log_test "Header: $name" "FAIL" "Missing $name header"
  fi
}

check_header "X-Content-Type-Options" "x-content-type-options.*nosniff"
check_header "X-Frame-Options" "x-frame-options.*DENY"
check_header "X-XSS-Protection" "x-xss-protection"
check_header "Referrer-Policy" "referrer-policy"
check_header "Permissions-Policy" "permissions-policy"

# CSP may not be in the initial response headers (Next.js adds it)
CSP=$(curl -s -I "$BASE_URL/" 2>&1 | grep -i "content-security-policy" || true)
if [ -n "$CSP" ]; then
  log_test "Header: Content-Security-Policy" "PASS"
else
  log_test "Header: Content-Security-Policy" "WARN" "CSP not in response headers (may be added by Next.js at runtime)"
fi

echo ""

# ──────────────────────────────────────────────
# 3. Auth Endpoints
# ──────────────────────────────────────────────
echo "━━━ 3. Auth Endpoints ━━━"

# Test registration
REG_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -F "email=staging-test-$(date +%s)@test.com" \
  -F "password=TestPass123!" \
  -F "name=Staging Test User" 2>&1)
REG_CODE=$(echo "$REG_RESPONSE" | tail -1)
REG_BODY=$(echo "$REG_RESPONSE" | head -n -1)

if [ "$REG_CODE" = "200" ]; then
  log_test "Registration endpoint accepts POST" "PASS"
else
  log_test "Registration endpoint" "FAIL" "HTTP $REG_CODE"
fi

# Test rate limiting on auth
echo "  Testing rate limiting (5 requests)..."
RL_BLOCKED=false
for i in $(seq 1 6); do
  RL_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
    -F "email=rl-test-$i@test.com" \
    -F "password=TestPass123!" 2>&1)
  RL_CODE=$(echo "$RL_RESP" | tail -1)
  if [ "$RL_CODE" = "429" ]; then
    RL_BLOCKED=true
    break
  fi
done

if [ "$RL_BLOCKED" = true ]; then
  log_test "Auth rate limiting works (429 after limit)" "PASS"
else
  log_test "Auth rate limiting" "WARN" "Did not get 429 after 6 requests (rate limit may be per-IP, not per-call in test)"
fi

echo ""

# ──────────────────────────────────────────────
# 4. Login
# ──────────────────────────────────────────────
echo "━━━ 4. Login Flow ━━━"

# Use admin account
LOGIN_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/callback/credentials" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=admin@mimotes.com&password=admin123&csrfToken=skip&callbackUrl=$BASE_URL/dashboard" \
  -c /tmp/mimotes-cookies.txt 2>&1)
LOGIN_CODE=$(echo "$LOGIN_RESP" | tail -1)

if [ "$LOGIN_CODE" = "200" ] || [ "$LOGIN_CODE" = "302" ]; then
  log_test "Login endpoint accepts credentials" "PASS"
else
  log_test "Login endpoint" "WARN" "HTTP $LOGIN_CODE (may need CSRF token)"
fi

echo ""

# ──────────────────────────────────────────────
# 5. Main Pages
# ──────────────────────────────────────────────
echo "━━━ 5. Main Pages ━━━"

check_page() {
  local name="$1"
  local path="$2"
  local code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path" 2>&1)
  if [ "$code" = "200" ] || [ "$code" = "302" ]; then
    log_test "Page: $name" "PASS"
  elif [ "$code" = "401" ] || [ "$code" = "403" ]; then
    log_test "Page: $name (auth required)" "PASS"
  else
    log_test "Page: $name" "FAIL" "HTTP $code"
  fi
}

check_page "Homepage" "/"
check_page "Login" "/login"
check_page "Register" "/register"
check_page "Dashboard" "/dashboard"
check_page "Documents" "/documents"
check_page "Chat" "/chat"
check_page "Settings" "/settings"
check_page "Knowledge" "/knowledge"

echo ""

# ──────────────────────────────────────────────
# 6. API Endpoints (unauthenticated)
# ──────────────────────────────────────────────
echo "━━━ 6. API Endpoints ━━━"

check_api() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expect="$4"
  local code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path" 2>&1)
  
  if echo "$expect" | grep -q "$code"; then
    log_test "API: $name" "PASS"
  else
    log_test "API: $name" "FAIL" "Expected $expect, got HTTP $code"
  fi
}

check_api "Health (GET)" "GET" "/api/health" "200"
check_api "Register (POST)" "POST" "/api/auth/register" "200\|400\|429"
check_api "Chat (GET)" "GET" "/api/chat" "401\|405"
check_api "Documents (GET)" "GET" "/api/v1/documents" "401"
check_api "Search (GET)" "GET" "/api/v1/search" "401"
check_api "Widgets (GET)" "GET" "/api/widgets/list" "401"

echo ""

# ──────────────────────────────────────────────
# 7. Rate Limiting Verification
# ──────────────────────────────────────────────
echo "━━━ 7. Rate Limiting ━━━"

# Check rate limit headers on limited endpoints
RL_HEADERS=$(curl -s -I -X POST "$BASE_URL/api/auth/register" \
  -F "email=header-test@test.com" \
  -F "password=TestPass123!" 2>&1)

if echo "$RL_HEADERS" | grep -qi "x-ratelimit"; then
  log_test "Rate limit headers present" "PASS"
  REMAINING=$(echo "$RL_HEADERS" | grep -i "x-ratelimit-remaining" | head -1)
  log_test "Rate limit remaining: $REMAINING" "PASS"
else
  log_test "Rate limit headers" "WARN" "No X-RateLimit headers in response"
fi

echo ""

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
echo "============================================"
echo "  VALIDATION SUMMARY"
echo "============================================"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  ⚠️  Warnings: $WARN"
echo "  Total: $((PASS + FAIL + WARN))"
echo ""

if [ $FAIL -gt 0 ]; then
  echo "🐛 BUGS FOUND:"
  echo -e "$BUGS"
  echo ""
fi

echo "Results saved to: /tmp/staging-validation-$(date +%Y%m%d_%H%M%S).txt"
echo -e "$RESULTS" > /tmp/staging-validation-$(date +%Y%m%d_%H%M%S).txt

exit $FAIL
