# 27 — Staging Environment

## Overview

This document describes the staging environment setup for pre-production testing.

**Last Updated:** 2026-09-01

---

## 1. Architecture

```
┌─────────────────────────────────────────────────────────┐
│               Staging (Vercel Preview)                  │
├─────────────────────────────────────────────────────────┤
│                   Next.js App                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Web UI    │  │  API Routes │  │  Middleware  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│               PostgreSQL (Staging)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Prisma    │  │   Migrations│  │    Seed     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 2. Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://staging-user:password@staging-db:5432/cognitive_staging

# Auth
NEXTAUTH_SECRET=staging-secret-key
NEXTAUTH_URL=https://staging.your-domain.com

# Email (staging uses console logging)
EMAIL_PROVIDER=console

# Environment
NODE_ENV=staging
```

### Optional Variables
```bash
# Monitoring
SENTRY_DSN=https://staging-sentry-key@sentry.io/project-id

# Analytics
ANALYTICS_ENABLED=false
```

## 3. Database Setup

### Create Staging Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE cognitive_staging;

# Create user
CREATE USER staging-user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE cognitive_staging TO staging-user;
```

### Apply Migrations
```bash
# Set staging DATABASE_URL
export DATABASE_URL="postgresql://staging-user:password@localhost:5432/cognitive_staging"

# Apply migrations
pnpm --filter @cog/db exec prisma migrate deploy

# Seed data (optional)
pnpm --filter @cog/db seed
```

## 4. Deployment

### Vercel Preview Deployment
```bash
# Automatic on PR
git push origin feature-branch

# Manual deployment
vercel --env DATABASE_URL=$STAGING_DATABASE_URL
```

### Docker Deployment
```bash
# Build staging image
docker build -t cognitive-staging .

# Run staging container
docker run -p 3000:3000 \
  -e DATABASE_URL=$STAGING_DATABASE_URL \
  -e NODE_ENV=staging \
  cognitive-staging
```

## 5. Testing

### Run E2E Tests Against Staging
```bash
# Set staging URL
export BASE_URL=https://staging.your-domain.com

# Run tests
pnpm --filter @cog/web e2e
```

### Smoke Tests
```bash
# Health check
curl -f https://staging.your-domain.com/api/auth/me

# Authentication test
curl -X POST https://staging.your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Password123!"}'
```

## 6. Monitoring

### Staging-Specific Monitoring
- Error tracking (Sentry)
- Performance monitoring
- Uptime monitoring

### Alerts
- Error rate > 5%
- Response time > 3s
- Database connection failures

## 7. Data Management

### Reset Staging Database
```bash
# Reset to clean state
pnpm --filter @cog/db exec prisma migrate reset

# Re-seed
pnpm --filter @cog/db seed
```

### Backup Staging
```bash
# Manual backup
pg_dump $STAGING_DATABASE_URL > staging-backup-$(date +%Y%m%d).sql
```

## 8. Limitations

- Staging uses console email logging (no actual emails)
- Staging may have debug mode enabled
- Staging data is not production data
- Staging may have relaxed rate limits

## 9. Checklist

### Pre-Deployment
- [ ] All tests passing in CI
- [ ] Database migrations tested locally
- [ ] Environment variables configured
- [ ] No secrets in code

### Post-Deployment
- [ ] Health check passing
- [ ] Authentication working
- [ ] Game loading correctly
- [ ] API routes responding
- [ ] E2E tests passing

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-01 | Initial staging setup |
