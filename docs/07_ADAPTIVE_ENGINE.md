# 07 — Adaptive Engine

## 1. Purpose

Select an appropriate difficulty that keeps the user in a productive challenge zone while reducing ceiling/floor effects.

## 2. MVP model

Use a transparent, deterministic ability estimate per game family.

Represent state:

```ts
type AdaptiveState = {
  ability: number;       // 0..10
  uncertainty: number;   // 0..5
  difficulty: number;    // 1..10
  attempts: number;
  lastUpdatedAt: string;
  algorithmVersion: string;
};
```

## 3. Trial quality

Before updating ability:
- exclude tutorial trials
- exclude paused/visibility-contaminated trials
- flag impossible RT
- flag duplicate responses
- flag network-recovered events with uncertain timing
- flag device performance anomalies

## 4. MVP update logic

Compute trial performance:

```text
performance =
  0.60 * normalized_accuracy
+ 0.25 * normalized_speed
+ 0.15 * consistency
```

Clamp to 0..1.

Convert to challenge response:

```text
if performance > 0.85:
    difficulty + 0.5
elif performance < 0.55:
    difficulty - 0.5
else:
    difficulty unchanged
```

Apply:
- max ±1 difficulty per session
- smoothing over recent trials
- uncertainty reduction with valid observations

This is a prototype heuristic, not a validated psychometric model.

## 5. Better model for V2

Implement an Item Response Theory-inspired or Bayesian latent ability model.

Possible form:

```text
P(correct | ability, difficulty)
 = logistic(ability - difficulty)
```

Extend with:
- response time
- item discrimination
- lapse/guessing parameters
- uncertainty

Potential algorithms:
- Bayesian update
- Elo-like adaptive rating
- IRT 2PL/3PL
- hierarchical model by age

Choose after simulation and validation, not because a method sounds scientific.

## 6. Difficulty controller

Inputs:
- ability estimate
- uncertainty
- current difficulty
- recent accuracy
- RT
- error type
- fatigue/session position
- device quality

Outputs:
- next difficulty
- configuration parameters
- confidence
- rationale codes

Example:
```json
{
  "difficulty": 5.5,
  "rationale": [
    "accuracy_in_target_zone",
    "uncertainty_decreasing"
  ]
}
```

## 7. Guardrails

Never:
- increase difficulty endlessly
- infer clinical status
- use one bad trial to make a major change
- hide difficulty changes from internal logs
- allow client to choose official difficulty in scored mode

## 8. Simulation requirement

Before deployment, generate synthetic users:
- low ability
- average ability
- high ability
- inconsistent
- fast-but-inaccurate
- slow-but-accurate
- learning/practice effect
- device latency distortion

Verify:
- convergence
- stability
- no runaway difficulty
- no bias caused by RT noise
