# 01 — Product Requirements Document

## 1. Product summary

A full-Web personalized cognitive training platform for children. The system combines short assessment tasks, game-like training, adaptive difficulty, longitudinal performance tracking, and parent-facing reporting.

The product is inspired by the general category of cognitive-training platforms. It must not copy CogniFit's proprietary games, UI, text, branding, assets, scoring implementation, or source code.

## 2. Problem

Parents often encounter either:
- generic educational games with little personalization,
- assessment tools with no engaging training loop,
- or cognitive-training products whose progress explanations are difficult to understand.

We want a single browser-based experience that turns task performance into a transparent, personalized training plan.

## 3. Goals

### G1 — Accessible
A child can train on a modern Android/iOS browser without installing an app.

### G2 — Measurable
Every game produces reproducible structured telemetry.

### G3 — Adaptive
Difficulty responds to performance instead of using only fixed levels.

### G4 — Personalized
Training allocation is based on the child's observed performance profile and recent exposure.

### G5 — Understandable
Parents can understand progress without requiring scientific expertise.

### G6 — Safe
The product clearly separates training performance from diagnosis/clinical conclusions.

## 4. Non-goals for MVP

- Diagnosis of ADHD, dyslexia, autism, dementia, neurological disorders, etc.
- IQ measurement.
- Medical/clinical treatment claims.
- Certified psychometric testing.
- Proving far-transfer effects to school grades.
- 3D games.
- Native Android/iOS applications.
- Unity.

## 5. Personas

### Parent/Guardian
Wants to:
- create/manage child profiles,
- understand what the child trained,
- see trends,
- manage consent,
- control session duration,
- review reports.

### Child
Wants:
- quick sessions,
- understandable instructions,
- fun but non-addictive interactions,
- immediate lightweight feedback,
- no confusing forms.

### Research/Admin
Wants:
- aggregated telemetry,
- game quality monitoring,
- item difficulty analysis,
- cohort/norm calculations,
- auditability,
- experiment controls.

## 6. Core user journey

1. Parent lands on website.
2. Creates account.
3. Reads product/limitations/privacy.
4. Creates child profile.
5. Completes consent flow.
6. Child completes baseline assessment.
7. System computes initial task-family performance profile.
8. Planner creates first training session.
9. Child plays 2–4 mini-games.
10. Results are recorded.
11. Adaptive engine updates difficulty state.
12. Planner selects future sessions.
13. Parent sees progress and trends.

## 7. Product principles

1. Measurement before personalization.
2. Performance before interpretation.
3. Consistency before dramatic claims.
4. Short sessions.
5. Difficulty should create productive challenge, not frustration.
6. Never punish children for low scores.
7. Explain progress in plain language.
8. Keep raw telemetry available for auditing.
9. Version every algorithm.
10. Never silently change historical scores.

## 8. MVP requirements

### Authentication
- Parent signup/login/logout.
- Email verification.
- Password reset.
- Optional social auth later.
- Child profile is subordinate to parent account.

### Child profile
Fields:
- display name
- birth year/month as minimally necessary
- locale
- preferred language
- accessibility preferences
- session settings

Avoid collecting unnecessary personal data.

### Assessment
- 5 domain families.
- Multiple task blocks per domain.
- Practice trials separated from scored trials.
- Randomized item order.
- Device calibration check.
- Input latency logging.
- Completion and interruption handling.

### Training
- 2–4 games per session.
- 10–15 minute target session.
- adaptive difficulty.
- pause/resume where safe.
- no infinite-scroll/loot-box mechanics.

### Dashboard
- session history
- domain trends
- task performance
- consistency
- training adherence
- explanations of what changed

### Parent report
- date range
- sessions completed
- domains trained
- performance trend
- recommended routine
- limitations/disclaimer

## 9. Functional requirements

FR-001 Parent can create account.
FR-002 Parent can create child profile.
FR-003 Parent can record consent.
FR-004 Child can enter training mode without exposing parent controls.
FR-005 Assessment can be launched from a controlled session.
FR-006 Game engine can start a deterministic game configuration.
FR-007 Game engine can collect trial events.
FR-008 Client buffers events during temporary network loss.
FR-009 Server validates event schema.
FR-010 Server stores immutable raw events.
FR-011 Scoring service computes task metrics.
FR-012 Adaptive engine updates difficulty state.
FR-013 Planner selects next game.
FR-014 Dashboard displays longitudinal trends.
FR-015 Admin can inspect game/version metrics.
FR-016 Algorithm versions are attached to every derived result.
FR-017 User can request data deletion/export where required by applicable law.
FR-018 Child data access is authorized through parent/guardian relationship.

## 10. Non-functional requirements

NFR-001 Responsive on common Android Chrome devices.
NFR-002 Game interaction should feel responsive; target <100 ms application-side input handling where feasible.
NFR-003 No blocking network request between every game frame/trial.
NFR-004 Game can complete a session with brief connectivity loss.
NFR-005 APIs authenticated and authorized.
NFR-006 Sensitive data encrypted in transit and at rest where supported.
NFR-007 Logs contain no unnecessary child PII.
NFR-008 Historical derived scores are reproducible from versioned inputs.
NFR-009 All production migrations are reversible or have documented rollback.
NFR-010 Critical flows have automated E2E tests.

## 11. Success metrics

Product:
- assessment completion rate
- training session completion rate
- 7-day and 30-day return rate
- average sessions/week
- average session duration
- interruption rate

Game quality:
- crash/error rate
- input drop rate
- median response latency
- ceiling/floor effect rate
- abandonment by difficulty

Measurement:
- test-retest reliability
- internal consistency where applicable
- missing-event rate
- device-latency sensitivity

Do not use "cognitive improvement" as a product KPI until a valid study supports the interpretation.

## 12. Risks

- Device latency contaminates reaction-time measurements.
- Practice effects can look like improvement.
- Children differ in motivation and familiarity with game mechanics.
- A game may measure strategy familiarity rather than intended construct.
- Small samples produce unstable norms.
- Overinterpretation can create harm.
- Privacy obligations for children are significant.

## 13. Launch stages

Alpha:
- internal testers
- synthetic data
- 5 games
- no public efficacy claims

Closed beta:
- limited cohort
- monitoring and QA
- parent reporting

Research validation:
- preregistered methodology
- appropriate controls
- independent analysis

Public MVP:
- only claims supported by evidence
