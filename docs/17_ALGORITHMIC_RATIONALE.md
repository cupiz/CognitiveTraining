# 17 — Algorithmic Rationale

## Why separate game performance from cognitive domains?

A game has multiple demands. For example, a memory game also requires attention and motor response. Therefore mapping must be explicit and should be treated as a hypothesis until validated.

## Why adaptive difficulty?

Fixed difficulty can cause:
- ceiling effects for high performers
- floor effects for low performers
- low engagement
- less informative observations

Adaptive difficulty attempts to keep observations informative.

## Why uncertainty?

Two users can have the same mean score but different evidence quality:
- User A: 50 valid trials, consistent
- User B: 5 trials, highly variable

The system should distinguish them.

## Why raw telemetry?

Derived scores can change when algorithms improve. Raw observations allow:
- auditing
- re-scoring under a new algorithm
- scientific analysis
- bug investigation

## Why algorithm versions?

If scoring changes from v0.1 to v0.2, historical results must remain attributable to the method that generated them.

## Why avoid a single "brain score"?

A single scalar hides:
- uncertainty
- domain differences
- measurement error
- task-specificity

For MVP, prefer a multidimensional performance profile.
