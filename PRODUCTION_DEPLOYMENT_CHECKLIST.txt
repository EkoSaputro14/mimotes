# PRODUCTION_DEPLOYMENT_CHECKLIST.md

> **Date**: 2026-06-13
> **Status**: ✅ COMPLETE
> **Sprint**: 13 — Launch Readiness & Operations

---

## Pre-Deployment Checklist

### 1. Environment Variables

| Variable | Required | Value | Status |
|----------|----------|-------|--------|
| `DATABASE_URL` | ✅ Yes | `postgresql://mimotes:***@db:5432/mimotes` | ☐ |
| `NEXTAUTH_SECRET` | ✅ Yes | 32+ char random string | ☐ |
| `NEXTAUTH_URL` | ✅ Yes | `https://your-domain.com` | ☐ |
| `NEXT_PUBLIC_APP_URL` | ✅ Yes | `https://your-domain.com` | ☐ |
| `ENCRYPTION_KEY` | ⚠️ Recommended | 64-char hex string | ☐ |
| `EMAIL_PROVIDER` | ⚠️ Recommended | `resend` (production) | ☐ |
| `RESEND_API_KEY` | ⚠️ Recommended | `re_***` | ☐ |
| `EMAIL_FROM` | ⚠️ Recommended | `noreply@your-domain.com` | ☐ |
| `STRIPE_SECRET_KEY` | Optional | `sk_live_***` | ☐ |
| `STRIPE_WEBHOOK_SECRET` | Optional | `whsec_***` | ☐ |

**Generate secrets:**
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# ENCRYPTION_KEY
openssl rand -hex 32
```

### 2. Database Setup

| Task | Command | Status |
|------|---------|--------|
| PostgreSQL 16 running | `docker ps \| grep db` | ☐ |
| pgvector extension | `CREATE EXTENSION IF NOT EXISTS vector;` | ☐ |
| Run migrations | `npx prisma migrate deploy` | ☐ |
| Create `mimotes_app` role | See migration SQL | ☐ |
| NOBYPASSRLS enforced | `ALTER USER mimotes_app NOBYPASSRLS;` | ☐ |
| GUC registered | `app.current_workspace_id` + `app.current_user_id` | ☐ |
| HNSW index built | `idx_document_chunks_embedding` (521MB) | ☐ |

**Verify RLS:**
```sql
SELECT tablename, rowsecurity, forcerowsecurity
FROM pg_tables WHERE schemaname = 'public';
-- All tenant tables should show: rowsecurity=true, forcerowsecurity=true
```

### 3. Build & Test

| Task | Command | Status |
|------|---------|--------|
| Install dependencies | `npm install` | ☐ |
| Run tests | `npm test` (353/353 pass) | ☐ |
| Build application | `npm run build` (0 errors) | ☐ |
| TypeScript check | `npx tsc --noEmit` | ☐ |

### 4. Security Configuration

| Task | Details | Status |
|------|---------|--------|
| CSP headers | Active in `next.config.ts` | ☐ |
| HSTS headers | Active (production only) | ☐ |
| Rate limiting | Auth (5/15min), Invitations (20/hr) | ☐ |
| Widget CORS | Dynamic origin validation (no wildcard) | ☐ |
| API keys encrypted | ENCRYPTION_KEY set | ☐ |
| NEXTAUTH_SECRET strong | 32+ chars, not default | ☐ |

### 5. DNS Configuration

| Record | Type | Value | Purpose |
|--------|------|-------|---------|
| `@` | A | `your-server-ip` | Main domain |
| `www` | CNAME | `@` | WWW redirect |
| `@` | MX | `mx1.resend.com` | Email receiving |
| `@` | TXT | `v=spf1 include:resend.com ~all` | SPF |
| `resend._domainkey` | TXT | `v=DKIM1; k=rsa; p=...` | DKIM |
| `_dmarc` | TXT | `v=DMARC1; p=none; rua=...` | DMARC |

### 6. Email Setup

| Task | Details | Status |
|------|---------|--------|
| Resend account created | https://resend.com | ☐ |
| API key generated | `re_***` | ☐ |
| Domain verified | In Resend dashboard | ☐ |
| DNS records added | SPF, DKIM, DMARC | ☐ |
| Test email sent | `POST /api/workspace/invitations` | ☐ |

## Deployment Steps

### Step 1: Pre-flight Checks

```bash
# Verify database connectivity
curl http://localhost:3000/api/health | jq '.checks.database'

# Verify all env vars
curl -H "Authorization: Bearer *** "http://localhost:3000/api/operations/status | jq '.config'
```

### Step 2: Deploy Application

```bash
# Docker Compose
docker compose up -d --build

# Or manual deployment
npm run build
npm start
```

### Step 3: Post-deployment Verification

```bash
# Health check
curl http://your-domain.com/api/health | jq '.status'
# Expected: "healthy"

# Operations status
curl -H "Authorization: Bearer *** "http://your-domain.com/api/operations/status | jq '.health'
# Expected: { "status": "healthy", "database": { "connected": true } }

# Security headers
curl -I http://your-domain.com/api/health | grep -i "content-security-policy"
# Expected: Content-Security-Policy: default-src 'self'; ...

# Test login
curl -X POST http://your-domain.com/api/auth/register \
  -F "email=test@example.com" -F "password=testpass123" -F "name=Test"
# Expected: { "success": true }

# Test invitation (if email configured)
curl -X POST http://your-domain.com/api/workspace/invitations \
  -H "Authorization: Bearer *** " \
  -H "Content-Type: application/json" \
  -d '{"email":"colleague@company.com","role":"viewer"}'
# Expected: { "success": true, "invitation": { "rawToken": "..." } }
```

### Step 4: Monitor

```bash
# Watch logs
docker compose logs -f app

# Monitor health (set up cron)
curl -s http://your-domain.com/api/health | jq '.status' > /dev/null || echo "ALERT: unhealthy"

# Check rate limiting
grep "Rate limit exceeded" /var/log/mimotes/app.log
```

## Post-Deployment Checklist

| Task | Status |
|------|--------|
| Health endpoint returns `healthy` | ☐ |
| Security headers present in response | ☐ |
| Login/Register works | ☐ |
| Invitation email sent (if configured) | ☐ |
| Workspace creation works | ☐ |
| Document upload works | ☐ |
| Chat/RAG works | ☐ |
| Widget embed works | ☐ |
| Audit logs being written | ☐ |
| Rate limiting active | ☐ |
| No CSP violations in browser console | ☐ |

## Rollback Procedure

### Quick Rollback (Application Only)

```bash
# Revert to previous Docker image
docker compose down
git checkout HEAD~1
docker compose up -d --build
```

### Full Rollback (Including Database)

```bash
# 1. Stop application
docker compose down

# 2. Restore database from backup
cat backup_YYYYMMDD.sql | docker exec -i mimotes-db-1 psql -U mimotes -d mimotes

# 3. Revert code
git checkout <previous-commit>

# 4. Rebuild and start
docker compose up -d --build
```

### Emergency: Disable Email

```bash
# Set EMAIL_PROVIDER=console in .env
# Restart application
docker compose restart app
```

### Emergency: Disable Rate Limiting

```bash
# Edit lib/endpoint-ratelimit.ts
# Set maxRequests: 999999 for all configs
# Rebuild
npm run build && npm start
```

## Monitoring Setup (Recommended)

### Health Check Cron

```bash
# Add to crontab (every 5 minutes)
*/5 * * * * curl -sf http://your-domain.com/api/health > /dev/null || echo "MimoNotes unhealthy at $(date)" | mail -s "ALERT" admin@your-domain.com
```

### Log Rotation

```bash
# /etc/logrotate.d/mimotes
/var/log/mimotes/*.log {
  daily
  rotate 14
  compress
  missingok
  notifempty
}
```

## Support Contacts

| Issue | Contact | Escalation |
|-------|---------|------------|
| Application down | DevOps | Immediate |
| Database issues | DBA / DevOps | 1 hour |
| Email delivery | Backend team | 4 hours |
| Security incident | Security team | Immediate |
| DNS issues | DevOps / Registrar | 2 hours |
