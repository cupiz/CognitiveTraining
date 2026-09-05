# 28 — Data Retention Policy

## Overview

This document defines the data retention policy for the Cognitive Training Platform.

**Last Updated:** 2026-09-01

---

## 1. Principles

- Minimize data collection to what is necessary
- Retain data only as long as required for legitimate purposes
- Provide clear data lifecycle management
- Support user rights (access, export, deletion)
- Comply with applicable regulations (GDPR, COPPA)

## 2. Data Categories and Retention

### Active Data (While Account Active)

| Data Type | Retention | Rationale |
|---|---|---|
| Account information | Account lifetime | Required for service |
| Child profiles | Account lifetime | Core functionality |
| Consent records | Account lifetime + 3 years | Legal compliance |
| Training sessions | Account lifetime | Service delivery |
| Game runs | Account lifetime | Service delivery |
| Raw telemetry | 90 days | Quality analysis |
| Task metrics | Account lifetime | Performance tracking |
| Adaptive states | Account lifetime | Personalization |
| Domain performance | Account lifetime | Progress tracking |
| Reports | Account lifetime | User value |

### After Account Deletion

| Data Type | Retention | Rationale |
|---|---|---|
| Account information | Deleted immediately | User right |
| Child profiles | Deleted immediately | User right |
| Consent records | 3 years | Legal compliance |
| Training sessions | Anonymized after 30 days | Research aggregate |
| Game runs | Anonymized after 30 days | Research aggregate |
| Raw telemetry | Deleted after 30 days | Privacy |
| Task metrics | Anonymized after 30 days | Research aggregate |
| Adaptive states | Deleted immediately | User right |
| Domain performance | Anonymized after 30 days | Research aggregate |
| Reports | Deleted immediately | User right |

### Anonymization Process

When data is anonymized:
1. Remove all PII (name, email, account ID)
2. Replace child ID with random hash
3. Keep aggregate statistics
4. Document anonymization date

## 3. Implementation

### Automated Cleanup Job

```sql
-- Delete raw telemetry older than 90 days
DELETE FROM raw_events 
WHERE received_at < NOW() - INTERVAL '90 days';

-- Anonymize old training sessions (after 30 days of account deletion)
-- This requires a background job to identify deleted accounts
```

### Manual Deletion

Users can request immediate deletion via:
- `POST /api/data/delete` endpoint
- Account settings page (UI)
- Email request to support

## 4. Backup Retention

| Backup Type | Retention | Rationale |
|---|---|---|
| Daily backups | 30 days | Recovery |
| Weekly backups | 90 days | Disaster recovery |
| Monthly backups | 1 year | Compliance |
| Annual backups | 7 years | Legal compliance |

## 5. Legal Basis

- **Consent:** User explicitly consents to data processing
- **Contract:** Data required to provide the service
- **Legal obligation:** Retention for legal compliance
- **Legitimate interest:** Quality improvement, security

## 6. User Rights

Users can:
- Access their data (GET /api/data/export)
- Delete their data (POST /api/data/delete)
- Export their data (GET /api/data/export)
- Withdraw consent (POST /api/children/[childId]/consent/revoke)

## 7. Review Schedule

- Review policy every 6 months
- Update after regulatory changes
- Update after security incidents
- Update after user feedback

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-01 | Initial retention policy |
