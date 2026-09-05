# 09 — Security, Privacy, and Child Safety

## 1. Principle

Treat child-related data as high-sensitivity product data even where law categorization differs by jurisdiction.

Before launch, obtain appropriate legal/privacy review for target markets.

## 2. Data minimization

Prefer:
- display name over legal name
- birth month/year over exact DOB when age band is enough
- no location unless needed
- no contacts/address
- no unnecessary free-text child profile fields

## 3. Parent/child separation

Parent:
- sees account controls
- manages consent
- sees reports

Child:
- sees only child experience
- cannot access parent account
- receives scoped session token

## 4. Authentication

- strong password hashing via mature auth provider/library
- secure cookies
- CSRF defense
- rate limiting
- email verification
- session expiration
- device/session revocation

## 5. Authorization

Every child resource request checks:
```text
authenticated account
AND
account is authorized guardian
AND
child belongs to account
```

Never rely on obscurity of UUIDs.

## 6. Telemetry security

Validate:
- event size
- event type
- sequence
- payload schema
- game version
- gameRun ownership
- rate limits

Do not accept arbitrary SQL-like filter parameters.

## 7. Privacy operations

Implement:
- export
- deletion
- consent revocation
- retention policy
- audit trail

Deletion should cover:
- profile
- sessions
- game runs
- raw telemetry
- derived metrics
- reports
- backups according to documented retention architecture

## 8. Child UX safety

Avoid:
- public leaderboards
- social comparison
- shame language
- gambling-like mechanics
- loot boxes
- aggressive notifications
- manipulative streaks

## 9. Analytics

Use aggregate metrics wherever possible.
Do not send child names/emails to third-party analytics.

## 10. Threat model

Consider:
- account takeover
- IDOR
- telemetry spoofing
- score manipulation
- replay attacks
- malicious game configs
- XSS
- CSRF
- supply-chain dependencies
- leaked reports
- admin abuse

## 11. Security acceptance

No public launch until:
- auth tests pass
- authorization tests pass
- dependency audit pass
- secrets are outside source
- production database is not publicly reachable
- backups tested
- deletion/export tested
