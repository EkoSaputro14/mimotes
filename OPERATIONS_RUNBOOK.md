# OPERATIONS_RUNBOOK.md

> **Date**: 2026-06-13
> **Status**: ✅ COMPLETE
> **Sprint**: 13 — Launch Readiness & Operations

---

## 1. Health Monitoring

### Health Endpoint

```
GET /api/health
```

**No authentication required.** Use for load balancer health checks.

**Response (healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-06-13T09:24:53.000Z",
  "uptime": 3600,
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "database": { "status": "healthy", "latencyMs": 5 },
    "email": { "status": "healthy", "message": "Provider: resend" },
    "config": { "status": "healthy", "message": "All required config present" }
  },
  "meta": {
    "nodeVersion": "v20.x.x",
    "platform": "linux",
    "memoryUsage": { "rss": 128, "heapUsed": 64, "heapTotal": 96 }
  }
}
```

**Response (unhealthy):**
```json
{
  "status": "unhealthy",
  "checks": {
    "database": { "status": "unhealthy", "message": "Database unavailable: Connection refused" }
  }
}
```

**HTTP Status:**
- `200` — healthy or degraded
- `503` — unhealthy

**Health Status Logic:**
- `healthy` — All checks pass
- `degraded` — Any check warns (email not configured, slow DB)
- `unhealthy` — Any check fails (DB unreachable)

### Operations Dashboard

```
GET /api/operations/status
```

**Requires API key authentication.** Returns detailed operational data:

```json
{
  "health": { "status": "healthy", "database": { "connected": true, "latencyMs": 5 } },
  "email": { "provider": "resend", "configured": true, "issues": [] },
  "invitations": { "total": 10, "pending": 3, "accepted": 7, "recent7d": 2, "emailsSent30d": 15 },
  "workspace": { "memberCount": 5 },
  "config": { "total": 9, "configured": 7, "secure": 7, "missing": ["STRIPE_SECRET_KEY"] }
}
```

## 2. Logging

### Log Format

**Production (JSON):**
```json
{"timestamp":"2026-06-13T09:24:53.000Z","level":"error","category":"AUTH","message":"Login failed","correlationId":"corr_m1abc_xyz","workspaceId":"ws-1","error":"Invalid password"}
```

**Development (human-readable):**
```
[2026-06-13T09:24:53.000Z] [ERROR] [AUTH] {corr_m1abc_xyz} Login failed — Invalid password
```

### Error Categories

| Category | Usage |
|----------|-------|
| `AUTH` | Authentication/authorization failures |
| `DATABASE` | Prisma, connection, query errors |
| `EMAIL` | Email delivery failures |
| `API` | General API errors |
| `SECURITY` | Rate limiting, suspicious activity |
| `SYSTEM` | Startup, health, configuration |
| `WIDGET` | Widget-specific errors |
| `BILLING` | Stripe/payment errors |
| `WORKSPACE` | Workspace operations |

### Correlation IDs

Every request gets a unique `corr_<timestamp>_<random>` ID for tracing:

```
[2026-06-13T09:24:53.000Z] [INFO] [API] {corr_m1abc_xyz} POST /api/workspace/invitations
[2026-06-13T09:24:53.001Z] [INFO] [EMAIL] {corr_m1abc_xyz} Sending invitation email
[2026-06-13T09:24:53.150Z] [ERROR] [EMAIL] {corr_m1abc_xyz} Email failed — Retry 1/3
```

### Log Level Configuration

```bash
# Set via environment variable
LOG_LEVEL=info   # debug, info, warn, error
```

Default: `debug` in development, `info` in production.

## 3. Database Operations

### Backup Procedure

```bash
# Full database backup
docker exec mimotes-db-1 pg_dump -U mimotes -d mimotes > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
docker exec mimotes-db-1 pg_dump -U mimotes -d mimotes | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Backup specific tables only
docker exec mimotes-db-1 pg_dump -U mimotes -d mimotes -t users -t documents -t workspace_members > partial_backup.sql
```

### Restore Procedure

```bash
# Restore from backup
cat backup_20260613.sql | docker exec -i mimotes-db-1 psql -U mimotes -d mimotes

# Restore from compressed backup
gunzip -c backup_20260613.sql.gz | docker exec -i mimotes-db-1 psql -U mimotes -d mimotes
```

### Disaster Recovery

1. **Stop the application** — Prevent writes during recovery
2. **Create a fresh database** — `docker exec mimotes-db-1 dropdb -U mimotes mimotes && docker exec mimotes-db-1 createdb -U mimotes mimotes`
3. **Restore pgvector** — `docker exec mimotes-db-1 psql -U mimotes -d mimotes -c "CREATE EXTENSION IF NOT EXISTS vector;"`
4. **Restore from backup** — Follow restore procedure above
5. **Verify RLS** — Check `NOBYPASSRLS` on mimotes_app role
6. **Rebuild HNSW index** — `REINDEX INDEX idx_document_chunks_embedding;`
7. **Restart application** — Verify health endpoint returns healthy

### Monitoring Queries

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('mimotes'));

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check connection count
SELECT count(*) FROM pg_stat_activity WHERE datname = 'mimotes';

-- Check RLS status
SELECT tablename, rowsecurity, forcerowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check HNSW index size
SELECT pg_size_pretty(pg_relation_size('idx_document_chunks_embedding'));
```

## 4. Rate Limiting

### Current Limits

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| Auth (register/login) | 5 requests | 15 minutes | Per IP |
| Invitation creation | 20 requests | 1 hour | Per workspace |
| Invitation accept | 10 requests | 15 minutes | Per IP |
| Workspace switch | 30 requests | 1 hour | Per IP |
| API (general) | 100 requests | 1 minute | Per workspace |

### Rate Limit Response

```json
{
  "error": "Terlalu banyak percobaan. Silakan coba lagi nanti."
}
```

**Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1718272800
Retry-After: 300
```

### Adjusting Limits

Edit `lib/endpoint-ratelimit.ts`:

```typescript
export const RATE_LIMIT_CONFIGS = {
  auth: {
    maxRequests: 10,  // Change from 5 to 10
    windowMs: 15 * 60 * 1000,
    name: "auth",
  },
};
```

## 5. Email Operations

### Provider Status

```bash
# Check email configuration
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/api/operations/status | jq '.email'
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Emails not sending | `EMAIL_PROVIDER=console` | Set `EMAIL_PROVIDER=resend` |
| "RESEND_API_KEY not set" | Missing env var | Add `RESEND_API_KEY=re_...` |
| Emails going to spam | New domain, no SPF/DKIM | Configure DNS records |
| Rate limit hit | Free tier 100/day | Upgrade Resend plan |

### DNS Setup (Required for Production)

```
# SPF Record
v=spf1 include:resend.com ~all

# DKIM (from Resend dashboard)
resend._domainkey TXT "v=DKIM1; k=rsa; p=..."

# DMARC
_dmarc TXT "v=DMARC1; p=none; rua=mailto:admin@yourdomain.com"
```

## 6. Security Operations

### Emergency: Disable Rate Limiting

If rate limiting is causing issues:

```bash
# Temporarily disable by setting very high limits
# Edit lib/endpoint-ratelimit.ts:
maxRequests: 999999,
```

### Emergency: Revert Security Headers

```bash
git checkout HEAD~1 -- next.config.ts
npm run build
# Restart application
```

### Security Monitoring

```bash
# Check for failed login attempts
curl -H "Authorization: Bearer YOUR_API_KEY" "http://localhost:3000/api/audit?action=auth.login_failed&limit=20"

# Check rate limit hits (in logs)
grep "Rate limit exceeded" /var/log/mimotes/app.log

# Check CSP violations (if reporting enabled)
grep "Content-Security-Policy" /var/log/mimotes/app.log
```

## 7. Common Operations

### Restart Application

```bash
# Docker
docker compose restart app

# PM2
pm2 restart mimotes

# Systemd
sudo systemctl restart mimotes
```

### View Logs

```bash
# Docker
docker compose logs -f app

# PM2
pm2 logs mimotes

# Systemd
sudo journalctl -u mimotes -f
```

### Check Disk Usage

```bash
# Database size
docker exec mimotes-db-1 psql -U mimotes -d mimotes -c "SELECT pg_size_pretty(pg_database_size('mimotes'));"

# Upload files size
du -sh /path/to/mimotes/uploads/

# Log files
du -sh /var/log/mimotes/
```

## 8. Contacts

| Role | Responsibility |
|------|---------------|
| DevOps | Infrastructure, deployment, monitoring |
| Backend | API issues, database, email delivery |
| Security | CSP violations, rate limiting, authentication |
