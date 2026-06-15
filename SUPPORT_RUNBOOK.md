# 🛟 SUPPORT RUNBOOK — MimoNotes Beta

**Purpose:** Quick reference for diagnosing and resolving common issues during beta  
**Audience:** Eko Saputro (solo founder)  
**Last updated:** 2026-06-13

---

## 1. Quick Diagnostics

### Health Check

```bash
# App health
curl https://your-domain.com/api/health

# Expected: {"status":"healthy","checks":{"database":{"status":"healthy"},...}}

# If "degraded" → check missing env vars
# If "unhealthy" → check database connection
```

### Docker Status

```bash
# Check all containers
docker compose ps

# Expected: app (running), db (healthy), migrate (exited 0)

# If app not running:
docker compose up -d app

# If db not healthy:
docker compose restart db

# If migrate failing:
docker compose logs migrate
```

### Database Connection

```bash
# Connect to database
docker exec -it mimotes-db-1 psql -U mimotes -d mimotes

# Check connection count
SELECT count(*) FROM pg_stat_activity;

# Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state != 'idle' AND now() - pg_stat_activity.query_start > interval '5 minutes';
```

---

## 2. Common Issues & Fixes

### Issue: App Not Responding

**Symptoms:** `curl` returns timeout or connection refused  
**Check:**
```bash
docker compose ps
docker compose logs app --tail 50
```

**Fix:**
```bash
docker compose restart app
# Wait 10 seconds
curl http://localhost:3100/api/health
```

### Issue: Database Connection Error

**Symptoms:** Health check shows `"database":{"status":"unhealthy"}`  
**Check:**
```bash
docker compose ps db
docker compose logs db --tail 50
```

**Fix:**
```bash
docker compose restart db
# Wait 30 seconds for health check
docker compose ps db  # Should show "healthy"
```

### Issue: RLS Policy Error (in logs)

**Symptoms:** `new row violates row-level security policy` in app logs  
**Check:**
```sql
-- Connect to DB
docker exec -it mimotes-db-1 psql -U mimotes -d mimotes

-- Check GUC is set
SELECT current_setting('app.current_workspace_id', true);
SELECT current_setting('app.current_user_id', true);
```

**Fix:** GUC not being set in request context. Check middleware:
```bash
grep -n "setWorkspaceContext\|SET LOCAL" lib/middleware/tenant.ts
```

### Issue: Email Not Sending

**Symptoms:** Invitation created but no email received  
**Check:**
```bash
# Check health endpoint
curl -s https://your-domain.com/api/health | jq '.checks.email'

# Should show: {"status":"healthy","message":"Provider: resend"}
# If "console" → RESEND_API_KEY not set
```

**Fix:**
```bash
# Verify Resend API key
echo $RESEND_API_KEY | head -c 10  # Should show "re_"

# Test email directly
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from":"onboarding@resend.dev","to":"test@example.com","subject":"Test","html":"<p>Test</p>"}'
```

### Issue: Upload Fails

**Symptoms:** Document stuck in "processing" status  
**Check:**
```sql
-- Check document status
SELECT id, title, status, chunk_count 
FROM documents 
WHERE status = 'processing'
ORDER BY created_at DESC 
LIMIT 10;
```

**Fix:**
```sql
-- Reset stuck documents
UPDATE documents 
SET status = 'failed', 
    updated_at = NOW() 
WHERE status = 'processing' 
  AND updated_at < NOW() - INTERVAL '10 minutes';

-- User can re-upload
```

### Issue: Slow Chat Responses

**Symptoms:** Chat takes >5 seconds to respond  
**Check:**
```bash
# Check HNSW index exists
docker exec -it mimotes-db-1 psql -U mimotes -d mimotes -c \
  "SELECT indexname, pg_size_pretty(pg_relation_size(indexname::regclass)) 
   FROM pg_indexes WHERE tablename = 'document_chunks' AND indexname LIKE '%hnsw%';"

# Check embedding dimensions
docker exec -it mimotes-db-1 psql -U mimotes -d mimotes -c \
  "SELECT array_length(embedding, 1) as dims, count(*) 
   FROM document_chunks GROUP BY 1;"
```

**Fix:**
```sql
-- If HNSW index missing, create it
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_document_chunks_embedding_hnsw
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- If embeddings are wrong dimensions, re-embed
-- (requires reprocessing documents)
```

### Issue: Rate Limiting False Positive

**Symptoms:** Legitimate requests getting 429  
**Check:**
```bash
# Check rate limit config
grep -n "RATE_LIMIT\|rateLimit" lib/endpoint-ratelimit.ts

# Check if in-memory store is accumulating
# (in-memory store resets on restart)
```

**Fix:**
```bash
# Restart app to reset in-memory rate limits
docker compose restart app
```

### Issue: JWT / Auth Error

**Symptoms:** "Unauthorized" or "Invalid token" errors  
**Check:**
```bash
# Check NEXTAUTH_SECRET is set
echo $NEXTAUTH_SECRET | head -c 10

# Check JWT expiry
# JWT expires after 30 days by default
```

**Fix:**
```bash
# If NEXTAUTH_SECRET is missing or changed, users must re-login
# Generate new secret if needed
openssl rand -hex 32

# Set in .env
NEXTAUTH_SECRET=<new-secret>

# Restart app
docker compose restart app
```

---

## 3. Emergency Procedures

### Data Loss Incident

1. **Stop the app immediately:**
   ```bash
   docker compose stop app
   ```

2. **Check database backup:**
   ```bash
   docker exec -it mimotes-db-1 pg_dump -U mimotes mimotes > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Assess damage:**
   ```sql
   -- Check what was lost
   SELECT 'users' as table_name, count(*) FROM users
   UNION ALL
   SELECT 'documents', count(*) FROM documents
   UNION ALL
   SELECT 'chat_sessions', count(*) FROM chat_sessions
   UNION ALL
   SELECT 'chat_messages', count(*) FROM chat_messages;
   ```

4. **Restore from backup if needed:**
   ```bash
   docker exec -i mimotes-db-1 psql -U mimotes -d mimotes < backup_YYYYMMDD_HHMMSS.sql
   ```

5. **Notify affected users** with apology and explanation

### Security Breach

1. **Immediately rotate secrets:**
   ```bash
   # Generate new keys
   NEW_ENCRYPTION_KEY=$(openssl rand -hex 32)
   NEW_NEXTAUTH_SECRET=$(openssl rand -hex 32)
   
   # Update .env
   # Restart app
   docker compose restart app
   ```

2. **Force all users to re-login:**
   ```sql
   -- Invalidate all sessions
   -- (depends on your session storage)
   ```

3. **Audit access logs:**
   ```sql
   -- Check for suspicious activity
   SELECT user_id, event_type, count(*), min(created_at), max(created_at)
   FROM audit_logs
   WHERE created_at > NOW() - INTERVAL '24 hours'
   GROUP BY user_id, event_type
   ORDER BY count(*) DESC;
   ```

4. **Notify all users** with security advisory

### Database Down

1. **Check if it's a crash or OOM:**
   ```bash
   docker compose logs db --tail 100 | grep -i "fatal\|oom\|killed"
   ```

2. **Restart database:**
   ```bash
   docker compose restart db
   ```

3. **If persistent, check disk space:**
   ```bash
   docker exec mimotes-db-1 df -h /var/lib/postgresql/data
   ```

4. **If disk full, clean up:**
   ```bash
   # Vacuum database
   docker exec -it mimotes-db-1 psql -U mimotes -d mimotes -c "VACUUM FULL;"
   
   # Or remove old logs
   docker exec mimotes-db-1 find /var/lib/postgresql/data -name "*.log" -mtime +7 -delete
   ```

---

## 4. Monitoring Commands

### Real-Time Logs

```bash
# App logs
docker compose logs -f app

# Database logs
docker compose logs -f db

# All services
docker compose logs -f
```

### Resource Usage

```bash
# Container stats
docker stats mimotes-app-1 mimotes-db-1 --no-stream

# Database connections
docker exec mimotes-db-1 psql -U mimotes -d mimotes -c \
  "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"

# Memory usage
docker exec mimotes-db-1 psql -U mimotes -d mimotes -c \
  "SELECT pg_size_pretty(pg_database_size('mimotes'));"
```

### Performance Metrics

```bash
# Slow queries (if pg_stat_statements enabled)
docker exec mimotes-db-1 psql -U mimotes -d mimotes -c \
  "SELECT query, calls, mean_time, total_time 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC 
   LIMIT 10;"

# Table sizes
docker exec mimotes-db-1 psql -U mimotes -d mimotes -c \
  "SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
   FROM pg_catalog.pg_statio_user_tables
   ORDER BY pg_total_relation_size(relid) DESC;"
```

---

## 5. User Communication Templates

### Server Maintenance Notice

```
Subject: Scheduled Maintenance — [Date]

Hi [Name],

We'll be performing maintenance on [date] from [time] to [time] (UTC).

During this time:
- The app may be briefly unavailable
- No data will be lost
- You may need to refresh the page after maintenance

We'll notify you when maintenance is complete.

Thanks for your patience!
— MimoNotes Team
```

### Bug Fix Notification

```
Subject: Fixed — [Bug title]

Hi [Name],

The issue you reported has been fixed:

Issue: [title]
Fix: [brief description]
Released: [date]

Please refresh the page to see the fix.

If you still experience issues, please reply to this email.

Thanks for helping us improve!
— MimoNotes Team
```

### Outage Notification

```
Subject: Service Disruption — [Date]

Hi [Name],

We're currently experiencing a service disruption.

Status: Investigating
Impact: [describe what's affected]
ETA: [estimated resolution time]

We'll update you as soon as we have more information.

— MimoNotes Team
```

### Post-Outage Report

```
Subject: Service Restored — [Date]

Hi [Name],

The service disruption has been resolved.

Duration: [X] minutes
Root cause: [brief description]
Fix: [what was done]

We've implemented additional monitoring to prevent this in the future.

We apologize for the inconvenience.

— MimoNotes Team
```

---

## 6. Contact List

| Role | Name | Contact | When to Contact |
|------|------|---------|-----------------|
| Founder/Dev | Eko Saputro | [phone/email] | P0 bugs, security incidents |
| DB Admin | Eko Saputro | [phone/email] | Database emergencies |
| Hosting | [provider] | [support email] | Server/network issues |
| Email | Resend | support@resend.com | Email delivery issues |

---

## 7. Daily Checklist (During Beta)

### Morning (9:00 AM)

- [ ] Check health endpoint
- [ ] Check Docker container status
- [ ] Review overnight error logs
- [ ] Check email for new feedback
- [ ] Check GitHub for new issues

### Afternoon (2:00 PM)

- [ ] Check health endpoint
- [ ] Review new bug reports
- [ ] Respond to support requests
- [ ] Monitor resource usage

### Evening (6:00 PM)

- [ ] Check health endpoint
- [ ] Update daily metrics
- [ ] Note any issues for tomorrow

---

## 8. Metrics to Track Daily

| Metric | How to Check | Alert If... |
|--------|-------------|-------------|
| Health status | `GET /api/health` | Status != "healthy" |
| Container status | `docker compose ps` | Any container not "running" |
| DB connections | `pg_stat_activity` count | >50 active connections |
| Error rate | App logs (grep ERROR) | >10 errors/hour |
| Response time | Health endpoint latency | >500ms |
| Memory usage | `docker stats` | >80% of allocated |
| Disk usage | `df -h` on DB volume | >80% used |

---

**Document generated:** 2026-06-13  
**Sprint:** 14 (Staging Validation Complete)  
**Next step:** Bookmark this runbook → Set up monitoring → Start daily checks
