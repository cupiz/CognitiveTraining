# 22 — Measurement Hypotheses

## Purpose

This document pre-registers the measurement hypotheses that the platform will test. Pre-registration reduces post-hoc rationalization and increases scientific credibility.

## Status

**Draft v1.1** — v1.0 preregistration (H1–H5) unchanged; exploratory flagship addendum added 2026-09-04

---

## Hypothesis 1: Test-Retest Reliability

**H1:** Task metrics demonstrate acceptable test-retest reliability (ICC > 0.70) across sessions spaced 1–7 days apart.

### Operationalization
- **Tasks:** All 5 game families
- **Metrics:** Accuracy, median RT, RT variability
- **Sample:** N ≥ 30 children (ages 7–12)
- **Protocol:** 2 sessions, 1–7 days apart, same device
- **Analysis:** Intraclass correlation coefficient (ICC, two-way mixed, absolute agreement)
- **Threshold:** ICC > 0.70 for accuracy, ICC > 0.60 for RT

### Exclusions
- Sessions with > 20% quality flags
- Sessions < 3 minutes duration
- Device change between sessions

---

## Hypothesis 2: Convergent Validity

**H2:** Game metrics correlate with established cognitive measures in expected domains.

### Expected Correlations

| Game | Domain | Expected Correlate | Expected r |
|---|---|---|---|
| Memory Matrix | Working Memory | Operation Span / n-back | r > 0.40 |
| Target Watch | Sustained Attention | d' from continuous performance test | r > 0.35 |
| Quick Match | Processing Speed | Symbol Digit Modalities Test | r > 0.45 |
| Stop Signal | Inhibitory Control | Stop-Signal RT | r > 0.30 |
| Rule Switch | Cognitive Flexibility | Trail Making Test B | r > 0.35 |

### Protocol
- Administer established measures on same day as game play
- Counterbalance order
- Use validated administration protocols for each measure

---

## Hypothesis 3: Adaptive Difficulty Stability

**H3:** The adaptive engine produces stable ability estimates after ≥ 5 sessions (uncertainty < 1.5).

### Operationalization
- **Metric:** Ability estimate uncertainty
- **Sample:** N ≥ 20 children
- **Protocol:** 10 sessions over 2 weeks
- **Analysis:** Plot uncertainty vs. session number
- **Threshold:** Uncertainty < 1.5 after 5 sessions for 80% of participants

---

## Hypothesis 4: Domain Discrimination

**H4:** Different games measure distinguishable cognitive constructs (factor loading > 0.40 on primary domain).

### Operationalization
- **Method:** Exploratory factor analysis
- **Sample:** N ≥ 100 children
- **Variables:** Standardized scores from each game
- **Expected:** 5 factors corresponding to 5 domains
- **Threshold:** Primary loading > 0.40, cross-loading < 0.30

---

## Hypothesis 5: Training Effects

**H5:** 20 sessions of adaptive training produce greater improvement than passive control.

### Design
- **Type:** Randomized controlled trial
- **Groups:** Training (n=50) vs. passive control (n=50)
- **Duration:** 4 weeks, 5 sessions/week
- **Primary outcome:** Change in domain performance scores
- **Secondary outcomes:** Transfer to untrained tasks
- **Analysis:** Mixed ANOVA with group × time interaction
- **Threshold:** p < 0.05, Cohen's d > 0.30

### Pre-registration
- Register on AsPredicted.org or OSF before data collection
- Specify primary endpoint and analysis plan
- Commit to reporting all pre-specified analyses

## Exploratory addendum — flagship games (proposal, v1.1 draft)

The confirmatory hypotheses H1–H5 above cover only the 5 classic game
families. The flagship slate (`spice_stall`, `red_light`, `courier_map`,
spec in docs/06) is **exploratory** until it demonstrates:

- test-retest reliability on its own metrics (same H1 operationalization),
- convergent validity against the matching classic anchor first
  (`spice_stall` vs `memory_matrix`; `red_light` vs `stop_signal`;
  `courier_map` vs `rule_switch`), then against established measures,
- adaptive stability (H3 protocol) with no runaway difficulty.

Exploratory expectations (not claims):
- `spice_stall` exact-order accuracy loads with `memory_matrix` accuracy
- `red_light` stop-success rate tracks `stop_signal` failed-stop rate
  (inversely) and go-RT tracks go-RT
- `courier_map` post-switch error rate tracks `rule_switch` switch cost

No flagship result may be presented as a validated domain score, percentile,
or training effect until the relevant hypothesis is confirmed on independent
data.

---

## Interpretation Guidelines

### What improvement means
- Improvement on a trained task may reflect:
  - Task-specific learning
  - Strategy development
  - Interface familiarity
  - Genuine cognitive improvement
- The platform should NOT conflate these

### What improvement does NOT mean
- "Your child's brain became X% smarter"
- Clinical or diagnostic significance
- Real-world cognitive transfer (without evidence)

### Language to use
- "Performance on [task] changed by [amount]"
- "Accuracy increased from [X] to [Y]"
- "Reaction time became more consistent"

### Language to avoid
- "Cognitive ability improved"
- "Brain training effects"
- "IQ increase"
- "Clinical significance"

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-01 | Initial draft |
| 1.1 (draft) | 2026-09-04 | Exploratory addendum for flagship slate; H1–H5 unchanged |
