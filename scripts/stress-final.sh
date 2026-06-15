#!/bin/bash
# Stress test for MimoNotes — parameterized
# Usage: bash stress-final.sh <count>

COUNT=${1:-40}
TEST_DIR="/tmp/stress-${COUNT}"
RESULTS_DIR="/tmp/sr-${COUNT}"

rm -rf "$TEST_DIR" "$RESULTS_DIR"
mkdir -p "$TEST_DIR" "$RESULTS_DIR"

# Auth
CSRF=$(curl -s -c /tmp/fc.txt http://localhost:3100/api/auth/csrf | sed 's/.*"csrfToken":"\([^"]*\)".*/\1/')
curl -s -b /tmp/fc.txt -c /tmp/fc.txt \
  -X POST http://localhost:3100/api/auth/callback/credentials \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d "email=admin%40mimotes.com&password=admin123&csrfToken=${CSRF}&json=true" > /dev/null 2>&1
CK=$(grep 'authjs.session-token' /tmp/fc.txt | awk '{print $6"="$7}')

# Create files
for i in $(seq 1 $COUNT); do
  echo "Stress test document $i. PostgreSQL database architecture and query processing for testing upload pipeline reliability under concurrent load." > "$TEST_DIR/file-$i.txt"
done

# Baseline memory
MEM_BEFORE=$(curl -s http://localhost:3100/api/health | sed 's/.*"heapUsed":\([0-9]*\).*/\1/')

# Upload all simultaneously
START_S=$(date +%s)
for i in $(seq 1 $COUNT); do
  curl -s -b "$CK" -X POST http://localhost:3100/api/upload \
    -F "file=@$TEST_DIR/file-$i.txt" > "$RESULTS_DIR/r-$i.txt" 2>&1 &
done
wait
END_S=$(date +%s)
HTTP_S=$((END_S - START_S))

# Count HTTP results
OK=0
BAD=0
for i in $(seq 1 $COUNT); do
  if grep -q '"id"' "$RESULTS_DIR/r-$i.txt" 2>/dev/null; then
    OK=$((OK+1))
  else
    BAD=$((BAD+1))
  fi
done

# Wait for queue drain
DRAIN_S=0
while [ $DRAIN_S -lt 120 ]; do
  sleep 2
  DRAIN_S=$((DRAIN_S+2))
  PEND=$(curl -s -b "$CK" http://localhost:3100/api/documents 2>/dev/null | grep -c '"processing"')
  if [ "$PEND" = "0" ]; then
    break
  fi
done

# Post memory
MEM_AFTER=$(curl -s http://localhost:3100/api/health | sed 's/.*"heapUsed":\([0-9]*\).*/\1/')

# Count final
READY=$(curl -s -b "$CK" http://localhost:3100/api/documents 2>/dev/null | grep -c '"ready"')
STUCK=$(curl -s -b "$CK" http://localhost:3100/api/documents 2>/dev/null | grep -c '"processing"')
FAILED=$(curl -s -b "$CK" http://localhost:3100/api/documents 2>/dev/null | grep -c '"failed"')

# Output
echo "COUNT=$COUNT"
echo "HTTP_OK=$OK"
echo "HTTP_FAIL=$BAD"
echo "HTTP_TIME_S=$HTTP_S"
echo "DRAIN_TIME_S=$DRAIN_S"
echo "READY=$READY"
echo "STUCK=$STUCK"
echo "FAILED=$FAILED"
echo "MEM_BEFORE_MB=$MEM_BEFORE"
echo "MEM_AFTER_MB=$MEM_AFTER"
