# 10 — Test Strategy

## Unit tests

Test:
- scoring formulas
- normalization
- adaptive updates
- difficulty bounds
- planner selection
- eligibility rules
- event schema
- idempotency
- report aggregation

## Property tests

Examples:
- score always 0..100
- difficulty always 1..10
- duplicate event never duplicates stored trial
- invalid sequence rejected
- planner never schedules unavailable game
- adaptive engine cannot jump > configured bound

## Game simulation

For each game:
- deterministic seed
- known sequence
- expected events
- expected metrics
- edge cases

## E2E

Critical path:
1. signup
2. create child
3. consent
4. assessment
5. training session
6. game
7. telemetry
8. result
9. dashboard

## Accessibility

Test:
- keyboard where applicable
- touch targets
- screen reader for parent UI
- contrast
- reduced motion
- audio off
- language expansion

Game-specific accessibility may require alternate interaction modes; document when a measure cannot be preserved under a given accessibility mode.

## Device matrix

Minimum:
- Android Chrome current
- iOS Safari current
- desktop Chrome
- desktop Safari/Firefox

Test:
- low-end Android
- mid-range Android
- high-refresh device
- slow network
- offline transition
- browser backgrounding

## Data quality tests

Detect:
- impossible RT
- repeated exact timestamps
- missing trial sequence
- abnormal completion
- extreme error rates
- device clock misuse

## Release gates

No production release if:
- critical E2E fails
- telemetry loss > agreed threshold
- scoring version mismatch
- game config invalid
- authorization regression
