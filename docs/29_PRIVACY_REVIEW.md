# 29 — Privacy Review

## Overview

This document outlines the privacy review checklist for the Cognitive Training Platform.

**Last Updated:** 2026-09-01

---

## 1. Data Collection Review

### Data Collected
- [ ] Account email (required for authentication)
- [ ] Display name (child, not legal name)
- [ ] Birth month/year (age band, not exact DOB)
- [ ] Game performance data (accuracy, RT, errors)
- [ ] Device information (browser, OS, screen size)

### Data NOT Collected
- [ ] Legal names
- [ ] Exact dates of birth
- [ ] Location data
- [ ] Contact information
- [ ] Photos or videos
- [ ] Social connections
- [ ] Free-text profiles

## 2. Data Processing Review

### Purpose Limitation
- [ ] Data used only for stated purposes
- [ ] No secondary use without consent
- [ ] No sale of personal data
- [ ] No sharing with third parties for marketing

### Processing Activities
- [ ] Account management
- [ ] Service delivery (game play, scoring)
- [ ] Performance tracking (adaptive engine)
- [ ] Quality improvement (anonymized analytics)
- [ ] Security (audit logging)

## 3. Storage and Security

### Storage Location
- [ ] Database hosted in [REGION]
- [ ] Backups encrypted at rest
- [ ] Transmission encrypted (HTTPS)

### Security Measures
- [ ] Password hashing (bcryptjs)
- [ ] JWT authentication
- [ ] Session management
- [ ] Rate limiting
- [ ] CSRF protection
- [ ] Input validation (Zod)

## 4. Access Controls

### Internal Access
- [ ] Role-based access control
- [ ] Audit logging for sensitive operations
- [ ] No developer access to production data

### User Access
- [ ] Users can access only their own data
- [ ] Users can export their data
- [ ] Users can delete their data

## 5. Third-Party Services

### Services Used
- [ ] Vercel (hosting)
- [ ] PostgreSQL (database)
- [ ] Sentry (error tracking, optional)

### Data Sharing
- [ ] No data shared with third parties
- [ ] No analytics tools with PII
- [ ] No advertising SDKs

## 6. Children's Privacy (COPPA)

### Age Verification
- [ ] Parental consent required
- [ ] Child age verified via birth month/year
- [ ] No services for children under 13 without parental consent

### Child Data Protections
- [ ] Minimal data collection
- [ ] No social features
- [ ] No public profiles
- [ ] No advertising to children
- [ ] Parental access to child data

## 7. User Rights Implementation

### Right to Access
- [ ] Data export endpoint (GET /api/data/export)
- [ ] Complete data in portable format

### Right to Deletion
- [ ] Data deletion endpoint (POST /api/data/delete)
- [ ] Cascading deletion of all related data
- [ ] Confirmation required

### Right to Rectification
- [ ] Profile editing (PATCH /api/children/[childId])
- [ ] Email update (account settings)

### Right to Withdraw Consent
- [ ] Consent revocation (POST /api/children/[childId]/consent/revoke)
- [ ] Account deletion

## 8. Privacy Policy Requirements

### Required Disclosures
- [ ] What data is collected
- [ ] Why data is collected
- [ ] How data is used
- [ ] Who data is shared with
- [ ] How to contact about privacy
- [ ] How to exercise rights

### Policy Location
- [ ] Available at /privacy
- [ ] Linked from signup/login
- [ ] Updated when practices change

## 9. Data Protection Impact Assessment

### High-Risk Processing
- [ ] Children's data (high sensitivity)
- [ ] Health-related data (cognitive performance)
- [ ] Automated decision-making (adaptive engine)

### Mitigations
- [ ] Data minimization
- [ ] Purpose limitation
- [ ] Storage limitation
- [ ] User control
- [ ] Transparency

## 10. Compliance Checklist

### GDPR
- [ ] Lawful basis for processing
- [ ] Data protection principles
- [ ] Data subject rights
- [ ] Data protection officer (if required)
- [ ] Data protection impact assessment

### COPPA
- [ ] Parental consent
- [ ] Data minimization
- [ ] No behavioral advertising
- [ ] Parental access rights
- [ ] Deletion rights

---

## Review Status

| Item | Status | Reviewer | Date |
|---|---|---|---|
| Data collection | Pending | — | — |
| Data processing | Pending | — | — |
| Security measures | Pending | — | — |
| Third-party services | Pending | — | — |
| Children's privacy | Pending | — | — |
| User rights | Pending | — | — |
| Privacy policy | Pending | — | — |

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-01 | Initial privacy review checklist |
