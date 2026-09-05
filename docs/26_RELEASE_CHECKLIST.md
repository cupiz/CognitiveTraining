# 26 — Release Checklist

## Purpose

This checklist ensures all required steps are completed before a production release.

**Last Updated:** 2026-09-01

---

## Pre-Release (1 week before)

### Code Complete
- [ ] All features for this release are merged
- [ ] All bug fixes are merged
- [ ] No open critical/high bugs
- [ ] Code review completed for all PRs

### Testing
- [ ] Unit tests passing (470+ tests)
- [ ] E2E tests passing (46+ tests)
- [ ] Integration tests passing
- [ ] Performance tests completed
- [ ] Security scan completed

### Documentation
- [ ] Changelog updated
- [ ] API documentation updated
- [ ] User guide updated (if applicable)
- [ ] Release notes drafted

### Database
- [ ] Migrations tested in staging
- [ ] Migration rollback tested
- [ ] Seed data updated (if needed)

## Release Day

### Final Verification
- [ ] All tests passing in CI
- [ ] Build succeeds
- [ ] No merge conflicts
- [ ] Environment variables configured

### Deployment
- [ ] Database migration applied
- [ ] Application deployed
- [ ] Health check passing
- [ ] Smoke tests passing

### Post-Deploy
- [ ] Monitoring alerts configured
- [ ] Error tracking verified
- [ ] Logging verified
- [ ] Uptime monitoring verified

## Post-Release (1 week after)

### Monitoring
- [ ] Error rate < 1%
- [ ] Response time p95 < 2s
- [ ] No critical bugs reported
- [ ] User feedback reviewed

### Documentation
- [ ] Release notes published
- [ ] Known issues documented
- [ ] Next release planned

---

## Quick Reference

### Release Commands
```bash
# Pre-release verification
pnpm -r test:run
pnpm --filter @cog/web e2e
pnpm -r build
pnpm audit

# Database migration
pnpm --filter @cog/db exec prisma migrate deploy

# Deploy (Vercel)
git push origin main

# Health check
curl -f https://your-domain.com/api/auth/me
```

### Rollback Commands
```bash
# Vercel rollback
vercel rollback

# Database rollback (if needed)
pnpm --filter @cog/db exec prisma migrate reset
```

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-01 | Initial checklist |
