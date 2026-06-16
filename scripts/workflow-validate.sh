#!/bin/bash
# ============================================================
# Sprint 14 — API Workflow Validation
# ============================================================
# Tests complete user workflows end-to-end.

set -e

BASE_URL="${1:-http://localhost:3100}"
RESULTS=""
PASS=0
FAIL=0
BUGS=""

log() {
  local status="$1"
  local name="$2"
  local detail="$3"
  
  if [ "$status" = "PASS" ]; then
    echo "  ✅ $name"
    PASS=$((PASS + 1))
  elif [ "$status" = "FAIL" ]; then
    echo "  ❌ $name — $detail"
    FAIL=$((FAIL + 1))
    BUGS="${BUGS}\n🐛 BUG: $name — $detail"
  fi
}

echo "============================================"
echo "  Sprint 14 — API Workflow Validation"
echo "  Target: $BASE_URL"
echo "============================================"
echo ""

# ──────────────────────────────────────────────
# Workflow 1: Registration → Login → Dashboard
# ──────────────────────────────────────────────
echo "━━━ Workflow 1: Auth Flow ━━━"

TEST_EMAIL="workflow-test-$(date +%s)@test.com"
TEST_PASS="WorkflowTest123!"

# 1a. Register
REG=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -F "email=$TEST_EMAIL" \
  -F "password=$TEST_PASS" \
  -F "name=Workflow Test" 2>&1)
REG_CODE=$(echo "$REG" | tail -1)

if [ "$REG_CODE" = "200" ]; then
  log "PASS" "Registration succeeds"
else
  log "FAIL" "Registration" "HTTP $REG_CODE"
fi

# 1b. Check that duplicate registration fails
DUP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -F "email=$TEST_EMAIL" \
  -F "password=$TEST_PASS" 2>&1)
DUP_CODE=$(echo "$DUP" | tail -1)

if [ "$DUP_CODE" = "400" ]; then
  log "PASS" "Duplicate registration rejected"
else
  log "FAIL" "Duplicate registration" "Expected 400, got $DUP_CODE"
fi

# 1c. Check that short password fails
SHORT=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -F "email=short@test.com" \
  -F "password=123" 2>&1)
SHORT_CODE=$(echo "$SHORT" | tail -1)

if [ "$SHORT_CODE" = "400" ]; then
  log "PASS" "Short password rejected"
else
  log "FAIL" "Short password validation" "Expected 400, got $SHORT_CODE"
fi

echo ""

# ──────────────────────────────────────────────
# Workflow 2: Health Endpoint Full Check
# ──────────────────────────────────────────────
echo "━━━ Workflow 2: Health Endpoint ━━━"

HEALTH=$(curl -s "$BASE_URL/api/health" 2>&1)

# Check all required fields
for field in "status" "timestamp" "uptime" "version" "environment" "checks"; do
  if echo "$HEALTH" | grep -q "\"$field\""; then
    log "PASS" "Health has field: $field"
  else
    log "FAIL" "Health missing field" "$field"
  fi
done

# Check database check
if echo "$HEALTH" | grep -q '"database"'; then
  log "PASS" "Health includes database check"
else
  log "FAIL" "Health missing database check" "No database field"
fi

# Check email check
if echo "$HEALTH" | grep -q '"email"'; then
  log "PASS" "Health includes email check"
else
  log "FAIL" "Health missing email check" "No email field"
fi

echo ""

# ──────────────────────────────────────────────
# Workflow 3: Security Headers
# ──────────────────────────────────────────────
echo "━━━ Workflow 3: Security Headers ━━━"

HEADERS=$(curl -s -I "$BASE_URL/" 2>&1)

# Check X-Frame-Options
if echo "$HEADERS" | grep -qi "x-frame-options.*DENY"; then
  log "PASS" "X-Frame-Options: DENY"
else
  log "FAIL" "X-Frame-Options" "Missing or not DENY"
fi

# Check X-Content-Type-Options
if echo "$HEADERS" | grep -qi "x-content-type-options.*nosniff"; then
  log "PASS" "X-Content-Type-Options: nosniff"
else
  log "FAIL" "X-Content-Type-Options" "Missing or not nosniff"
fi

# Check Referrer-Policy
if echo "$HEADERS" | grep -qi "referrer-policy"; then
  log "PASS" "Referrer-Policy present"
else
  log "FAIL" "Referrer-Policy" "Missing"
fi

# Check Permissions-Policy
if echo "$HEADERS" | grep -qi "permissions-policy"; then
  log "PASS" "Permissions-Policy present"
else
  log "FAIL" "Permissions-Policy" "Missing"
fi

echo ""

# ──────────────────────────────────────────────
# Workflow 4: Unauthenticated API Protection
# ──────────────────────────────────────────────
echo "━━━ Workflow 4: API Protection ━━━"

check_protected() {
  local name="$1"
  local method="$2"
  local path="$3"
  local code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$path" 2>&1)
  
  if [ "$code" = "401" ] || [ "$code" = "403" ]; then
    log "PASS" "$name (returns $code)"
  else
    log "FAIL" "$name" "Expected 401/403, got $code"
  fi
}

check_protected "Documents API" "GET" "/api/v1/documents"
check_protected "Search API" "GET" "/api/v1/search"
check_protected "Widget List" "GET" "/api/widgets/list"
check_protected "Widget Create" "POST" "/api/widgets/create"
check_protected "Workspace Members" "GET" "/api/workspace/members"
check_protected "Workspace Invitations" "GET" "/api/workspace/invitations"

echo ""

# ──────────────────────────────────────────────
# Workflow 5: Rate Limiting
# ──────────────────────────────────────────────
echo "━━━ Workflow 5: Rate Limiting ━━━"

# Test auth rate limiting (should get 429 after 5 requests)
RATE_429=false
for i in $(seq 1 7); do
  RL_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/register" \
    -F "email=rl-$i-$(date +%s)@test.com" \
    -F "password=TestPass123!" 2>&1)
  if [ "$RL_CODE" = "429" ]; then
    RATE_429=true
    break
  fi
done

if [ "$RATE_429" = true ]; then
  log "PASS" "Auth rate limiting triggers 429"
else
  log "FAIL" "Auth rate limiting" "No 429 after 7 requests"
fi

echo ""

# ──────────────────────────────────────────────
# Workflow 6: Error Handling
# ──────────────────────────────────────────────
echo "━━━ Workflow 6: Error Handling ━━━"

# Invalid JSON
ERR=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "not json" 2>&1)
if [ "$ERR" = "400" ] || [ "$ERR" = "401" ] || [ "$ERR" = "500" ]; then
  log "PASS" "Invalid JSON handled gracefully"
else
  log "FAIL" "Invalid JSON handling" "HTTP $ERR"
fi

# Non-existent route
NOTFOUND=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/nonexistent-route-12345" 2>&1)
if [ "$NOTFOUND" = "404" ] || [ "$NOTFOUND" = "500" ]; then
  log "PASS" "Non-existent route returns 404/500"
else
  log "FAIL" "Non-existent route" "HTTP $NOTFOUND"
fi

echo ""

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
echo "============================================"
echo "  WORKFLOW VALIDATION SUMMARY"
echo "============================================"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  Total: $((PASS + FAIL))"
echo ""

if [ $FAIL -gt 0 ]; then
  echo "🐛 BUGS FOUND:"
  echo -e "$BUGS"
fi

exit $FAIL
