# 25 — Production Runbook

## Overview

This document provides operational procedures for deploying, monitoring, and maintaining the Cognitive Training Platform in production.

**Last Updated:** 2026-09-01

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     CDN (Vercel)                        │
├─────────────────────────────────────────────────────────┤
│                   Next.js App                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Web UI    │  │  API Routes │  │  Middleware  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│                   PostgreSQL                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Prisma    │  │   Migrations│  │    Seed     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 2. Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (470+ tests)
- [ ] TypeScript strict mode passes
- [ ] ESLint passes
- [ ] Build succeeds (`pnpm -r build`)
- [ ] No security vulnerabilities (`pnpm audit`)

### Database
- [ ] Migrations up to date
- [ ] Seed data prepared
- [ ] Backup configured
- [ ] Connection pooling enabled

### Environment
- [ ] Environment variables set
- [ ] Secrets in secure vault (not in code)
- [ ] CORS configured
- [ ] Rate limiting enabled

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Logging configured
- [ ] Uptime monitoring configured
- [ ] Alert channels set up

## 3. Deployment Procedure

### Step 1: Pre-deploy Verification
```bash
# Run full test suite
pnpm -r test:run

# Run E2E tests
pnpm --filter @cog/web e2e

# Build all packages
pnpm -r build

# Check for vulnerabilities
pnpm audit
```

### Step 2: Database Migration
```bash
# Apply migrations
pnpm --filter @cog/db exec prisma migrate deploy

# Verify migration status
pnpm --filter @cog/db exec prisma migrate status
```

### Step 3: Deploy Application
```bash
# Vercel deployment (automatic on push to main)
git push origin main

# Or manual deployment
vercel --prod
```

### Step 4: Post-deploy Verification
```bash
# Health check
curl -f https://your-domain.com/api/auth/me

# Run smoke tests
pnpm --filter @cog/web e2e --grep "smoke"
```

## 4. Monitoring

### Health Checks
- **Endpoint:** `GET /api/auth/me`
- **Expected:** 200 OK (authenticated) or 401 (unauthenticated)
- **Frequency:** Every 5 minutes

### Key Metrics

| Metric | Threshold | Alert |
|---|---|---|
| Error rate | > 1% | Critical |
| Response time (p95) | > 2s | Warning |
| Database connections | > 80% | Warning |
| Memory usage | > 80% | Warning |
| CPU usage | > 80% | Warning |

### Logs to Monitor
- Authentication failures
- Rate limit violations
- Database connection errors
- Unhandled exceptions
- Audit log anomalies

## 5. Incident Response

### Severity Levels

| Level | Description | Response Time |
|---|---|---|
| P0 | Complete outage | 15 minutes |
| P1 | Major feature broken | 1 hour |
| P2 | Minor feature broken | 4 hours |
| P3 | Cosmetic issue | 24 hours |

### Incident Response Steps

1. **Detect** — Alert fires or user reports
2. **Triage** — Assess severity and impact
3. **Mitigate** — Apply immediate fix or rollback
4. **Resolve** — Implement permanent fix
5. **Review** — Post-mortem within 48 hours

### Rollback Procedure
```bash
# Vercel rollback
vercel rollback

# Database rollback (if needed)
pnpm --filter @cog/db exec prisma migrate reset
```

## 6. Backup & Restore

### Backup Schedule
- **Database:** Daily at 02:00 UTC
- **Retention:** 30 days

### Backup Procedure
```bash
# Manual backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Automated (Vercel Postgres)
# Configure in Vercel dashboard → Storage → Backups
```

### Restore Procedure
```bash
# Restore from backup
psql $DATABASE_URL < backup-20260901.sql

# Verify restore
pnpm --filter @cog/db exec prisma migrate status
```

## 7. Scaling Considerations

### Current Limits
- **Database:** 1 connection pool (Prisma default)
- **API:** Serverless functions (Vercel)
- **Storage:** File-based (no external storage)

### Scaling Triggers
- > 1000 concurrent users
- > 10,000 daily active users
- > 100GB database size

### Scaling Actions
1. Enable connection pooling (PgBouncer)
2. Add read replicas
3. Implement caching (Redis)
4. Move to dedicated infrastructure

## 8. Security Procedures

### Vulnerability Response
1. Monitor `pnpm audit` results
2. Apply security patches within 48 hours (critical) or 1 week (high)
3. Test patches in staging before production

### Secret Rotation
- **JWT secret:** Every 90 days
- **Database password:** Every 90 days
- **API keys:** Every 90 days

### Access Control
- Production database: Only via VPN
- Admin endpoints: IP whitelist
- API keys: Scoped to minimum required permissions

## 9. Communication Templates

### Incident Notification
```
[STATUS] [SEVERITY] - [SERVICE] - [DESCRIPTION]

Impact: [DESCRIPTION OF USER IMPACT]
Status: [INVESTIGATING/MITIGATING/RESOLVED]
ETA: [ESTIMATED TIME TO RESOLUTION]

Updates: [LINK TO STATUS PAGE]
```

### Post-Mortem Template
```
# Incident Post-Mortem

## Summary
- Date: [DATE]
- Duration: [DURATION]
- Severity: [P0/P1/P2/P3]

## What Happened
[DESCRIPTION]

## Root Cause
[ANALYSIS]

## Impact
[IMPACT ASSESSMENT]

## Resolution
[WHAT WAS DONE]

## Action Items
- [ ] [ACTION 1]
- [ ] [ACTION 2]

## Lessons Learned
[KEY TAKEAWAYS]
```

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-01 | Initial runbook |
