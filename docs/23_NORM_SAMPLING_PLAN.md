# 23 — Norm Sampling Plan

## Purpose

This document defines the sampling strategy for collecting normative data to enable age-standardized scoring.

## Status

**Draft v1.0** — Created 2026-09-01

---

## 1. Target Population

- **Age:** 7–12 years
- **Language:** English, Indonesian (initial)
- **Device:** Mobile browsers (Android Chrome, iOS Safari)
- **Access:** Internet-connected devices

## 2. Sampling Strategy

### Phase 1: Convenience Sample (MVP)
- Recruit from existing user base
- Minimum N = 200
- Aim for balanced age distribution

### Phase 2: Stratified Sample
- Stratify by:
  - Age (7, 8, 9, 10, 11, 12)
  - Gender (balanced)
  - Language (English, Indonesian)
- Minimum N = 50 per cell
- Total N ≥ 600

### Phase 3: Representative Sample
- Partner with schools or research institutions
- Stratify by:
  - Socioeconomic status
  - Urban/rural
  - Device type
- Minimum N = 1000

## 3. Inclusion Criteria

- Age 7–12 years
- Parental consent obtained
- Child assent obtained
- Completed ≥ 3 training sessions
- ≥ 80% valid trials across sessions

## 4. Exclusion Criteria

- < 3 sessions completed
- > 30% quality flags
- Device clock anomalies > 5
- Reported developmental disorders (for norms, not for training)

## 5. Data Collection Protocol

### Session Requirements
- Minimum 3 sessions per participant
- Sessions spaced ≥ 24 hours apart
- Same device preferred
- Quiet environment recommended

### Quality Checks
- Real-time quality monitoring
- Automatic flagging of suspicious patterns
- Manual review of flagged sessions

## 6. Norm Development

### Method
1. Clean and validate data
2. Check for floor/ceiling effects
3. Estimate distributions by age band
4. Fit normative curves (quantile regression)
5. Validate on held-out data (20%)
6. Version the norm set

### Outputs
- **Percentile ranks** by age
- **Z-scores** (standard deviations from mean)
- **Age-standardized index** (0–100 scale)

### Validation
- Internal validation (cross-validation)
- External validation (independent sample)
- Split-half reliability check

## 7. Versioning

Every norm set must be versioned:
```typescript
interface NormVersion {
  version: string;        // e.g., "norm-v1.0"
  createdAt: string;
  sampleSize: number;
  ageRange: [number, number];
  languages: string[];
  validationMetrics: {
    internalValidaton: number;
    externalValidation?: number;
  };
}
```

## 8. Update Criteria

Re-norm when:
- Sample size increases by > 50%
- New age group added
- New language added
- Algorithm changes affect scoring
- External validation reveals bias

## 9. Limitations

- Convenience samples may not be representative
- Device effects (mobile vs. desktop) not controlled
- Language effects not fully understood
- Socioeconomic confounds not measured in MVP

## 10. Ethical Considerations

- Parental consent required
- Child assent required
- Data de-identified for analysis
- Right to withdraw honored
- Data retention policy enforced
- No clinical claims from norms

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-01 | Initial draft |
