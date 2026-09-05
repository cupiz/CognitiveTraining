# 08 — Scoring, Profiles, and Norms

## 1. Three separate layers

### Layer A — Raw task metrics
Directly observed:
- accuracy
- reaction time
- errors
- variability
- difficulty

### Layer B — Task-family performance
Aggregates multiple runs of the same task family.

### Layer C — Domain profile
Combines task families mapped to a domain.

Do not collapse these layers prematurely.

## 2. Performance score

MVP:
- standardized within the task family
- display 0–100 as a product performance index
- label clearly as "task performance"

Possible formula:
```text
raw = weighted accuracy/speed/consistency
score = clamp(100 * raw, 0, 100)
```

## 3. Confidence

Confidence should depend on:
- number of valid trials
- number of sessions
- consistency
- data quality
- uncertainty of adaptive model

Example:
```text
confidence = f(valid_trials, sessions, variance, quality_flags)
```

Never display a high-precision number such as 73.42 when evidence does not support it.

## 4. Age normalization — future phase

To build age norms:
1. define target population
2. collect appropriately consented data
3. predefine inclusion/exclusion criteria
4. control device and language effects
5. estimate distributions by age band
6. evaluate sex/education/device/language confounds as scientifically appropriate
7. use independent validation data
8. version the norm set

Potential outputs:
- percentile
- z-score
- age-standardized index

Do not claim "percentile among children" until the normative sample is actually representative enough for that claim.

## 5. Longitudinal change

Observed improvement may result from:
- learning the game
- familiarity with interface
- motivation
- sleep/fatigue
- device changes
- random variation

Therefore dashboard language should say:
- "performance changed"
- "accuracy increased"
- "reaction time became more consistent"

Avoid:
- "your child's brain became 15% smarter"

## 6. Domain mapping

Each game has a declared mapping with weights:

```json
{
  "memory_matrix": {
    "working_memory": 0.9,
    "visual_spatial": 0.7
  }
}
```

Weights are hypotheses until validated.

### Proposed flagship mappings (not implemented)

```json
{
  "spice_stall": { "working_memory": 0.8, "visual_spatial": 0.2 },
  "red_light": { "inhibitory_control": 0.8, "processing_speed": 0.2 },
  "courier_map": { "cognitive_flexibility": 0.7, "visual_spatial": 0.3 },
  "lighthouse_keeper": { "working_memory": 0.8, "sustained_attention": 0.2 },
  "sushi_express": { "processing_speed": 0.8, "sustained_attention": 0.2 },
  "crystal_palace": { "visual_spatial": 0.8, "sustained_attention": 0.2 }
}
```

Rules: ship under new `game_version` values (proposal: `0.1.0` each) and a
new `mapping_version`; never backfill flagship weights onto classic runs,
and never present flagship domain scores as validated until docs/22
exploratory criteria are met.

## 7. Algorithm versioning

Every derived result must store:
- scoring_version
- mapping_version
- adaptive_version
- norm_version (nullable)

If a new algorithm is deployed, old results remain reproducible.

## 8. Research validation roadmap

Phase 1:
- test-retest reliability
- split-half/internal consistency where appropriate

Phase 2:
- convergent validity against established cognitive measures

Phase 3:
- criterion-related validity where a meaningful criterion exists

Phase 4:
- intervention study for training effects

All scientific claims require appropriate methodology and independent scrutiny.
