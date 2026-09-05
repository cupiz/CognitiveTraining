# 11 — Deployment

## Environments

- local
- development
- staging
- production

Each environment has separate database and secrets.

## CI pipeline

```text
Pull Request
 -> typecheck
 -> lint
 -> unit tests
 -> game simulations
 -> build
 -> E2E
 -> security/dependency scan
 -> review
```

Production:
```text
merge
 -> build immutable artifact
 -> database migration check
 -> deploy staging
 -> smoke test
 -> production deploy
 -> monitor
```

## Configuration

Never commit:
- database credentials
- auth secrets
- API keys
- encryption keys

Use environment variables/secrets manager.

## Database migrations

- forward migration
- backup before risky migration
- migration tested in staging
- rollback plan
- avoid destructive migrations without a recovery strategy

## CDN/assets

Game assets:
- versioned
- cacheable
- content-hashed filenames

## Monitoring

Alert on:
- 5xx rate
- telemetry rejection spike
- game load failures
- scoring backlog
- database saturation
- authentication anomalies

## Backups

- automated backups
- periodic restore test
- documented retention
- encryption
