# 06 — Game Design

Status:
- Games 1–5 (classic anchors) are implemented.
- Flagship 1 `spice_stall` is **implemented** (`@cog/game-spice-stall`,
  game version `0.1.0`). Flagship 2 `red_light` is **implemented**
  (`@cog/game-red-light`, game version `0.1.0`). Flagship 3 `courier_map`
  is **implemented** (`@cog/game-courier-map`, game version `0.1.0`).
  Flagships 4–6 (`lighthouse_keeper`, `sushi_express`, `crystal_palace`)
  are **implemented** (`@cog/game-lighthouse-keeper`,
  `@cog/game-sushi-express`, `@cog/game-crystal-palace`, game version
  `0.1.0` each) with CSS-3D renderers.

## Game 1: Memory Matrix

Primary domain: Working Memory
Secondary: visual-spatial memory

Mechanic:
- Show a matrix.
- Highlight N cells.
- Hide highlights.
- User selects remembered cells.

Parameters:
- grid size
- target count
- exposure duration
- distractor complexity
- response deadline

Telemetry:
- target cells
- selected cells
- correct selections
- false selections
- omission count
- response time
- trial duration

Difficulty example:
```text
D1: 3x3 / 2 cells / 1500ms
D2: 3x3 / 3 cells / 1400ms
D3: 4x4 / 4 cells / 1300ms
D4: 4x4 / 5 cells / 1200ms
D5: 5x5 / 6 cells / 1100ms
...
```

Do not make difficulty solely a larger number. Use multiple dimensions.

## Game 2: Target Watch

Primary: Sustained Attention
Secondary: Processing Speed

Mechanic:
- symbols appear sequentially.
- user taps only the target.
- non-targets require inhibition of response.

Metrics:
- hits
- misses
- false alarms
- median RT
- RT variability
- lapse count

## Game 3: Quick Match

Primary: Processing Speed
Secondary: selective attention

Mechanic:
- stimulus appears.
- user selects matching item among alternatives.
- gradually reduce presentation time / increase distractors.

Metrics:
- correct RT
- incorrect RT
- accuracy
- throughput

## Game 4: Stop Signal

Primary: Inhibitory Control

Mechanic:
- respond to go signal.
- occasionally stop signal appears after variable delay.
- stop-signal delay adapts.

Metrics:
- go RT
- go accuracy
- failed stops
- stop-signal delay
- quality flags

Important:
This is a simplified game mechanic, not a clinical stop-signal test unless validated.

## Game 5: Rule Switch

Primary: Cognitive Flexibility
Secondary: processing speed

Mechanic:
- classify by one rule.
- rule changes.
- user must switch.

Metrics:
- switch cost
- post-switch errors
- RT
- perseverative errors

## Flagship game slate (implemented)

Goal: keep the measurement spine (one primary domain per game, D1–D10,
versioned telemetry) but wrap each mechanic in a world a 7–12 year old
actually wants to revisit. All six flagship families below are
implemented; renderers use CSS/SVG 3D scenes (perspective, isometric
tilts, depth) with no WebGL dependency.

Shared rules (all flagships):
- Family keys: `spice_stall`, `red_light`, `courier_map`,
  `lighthouse_keeper`, `sushi_express`, `crystal_palace`; initial
  `game_version` `"0.1.0"` for each.
- Every flagship implements the common game contract below
  (`CognitiveGame`, practice/scored separation, deterministic seed,
  touch-first, pause-safe, no PII in payloads).
- Telemetry reuses the existing event types (`trial_started`,
  `stimulus_shown`, `stimulus_hidden`, `response`, `timeout`,
  `quality_flag`, session lifecycle). Game-specific meaning is carried by
  existing `ResponseEvent` payload fields (`selectedCells` / `correctCells`
  preserve order; `selectedOption` / `correctOption`; `stopped` /
  `stopSignalDelayMs`; `currentRule` / `previousRule` / `switchTrial`).
- Per-run budget ≈ 4–6 minutes so 2–3 games still fit a 10–15 minute
  training session (PRD §8).
- Scores are task performance, never diagnosis (docs/18). New domain
  weights are hypotheses until validated (docs/08 §6, docs/22 addendum).

### Flagship 1: Spice Stall (`spice_stall`) — Warung Bumbu

Primary domain: working memory (hypothesis weight 0.8).
Secondary: visual-spatial (0.2). Reuses the memory anchor's construct while
replacing the abstract grid with sequential order recall.

Fantasy: the child runs a spice stall. A customer orders a sequence of
ingredients, a curtain drops, and the child rebuilds the exact order before
the customer's patience runs out.

30-second loop:
1. Order shown (`stimulus_shown`): N ingredient icons in order.
2. Curtain drops (`stimulus_hidden`): order concealed after `exposureMs`.
3. Child taps ingredients in order; auto-submits when tap count reaches
   `orderLength`.
4. Correct order → coins + happy customer; wrong order → kind retry cue,
   never shame language.

Session: 2 practice + 12 scored trials.

Difficulty (D1–D10) — all dimensions move together:

```text
D:  order  menu  exposure  patience  similarPairs
D1:  2      4     2500ms    12000ms   0
D2:  3      4     2300ms    11500ms   0
D3:  3      5     2100ms    11000ms   0
D4:  4      5     1900ms    10000ms   1
D5:  4      6     1700ms     9500ms   1
D6:  5      6     1500ms     9000ms   2
D7:  5      7     1300ms     8500ms   2
D8:  6      7     1200ms     8000ms   2
D9:  6      8     1000ms     7000ms   3
D10: 7      8      900ms     6500ms   3
```

- `similarPairs`: number of visually similar ingredient pairs (color/shape
  confusables). Repeats of the same ingredient are allowed from D4+.
- Validation: `1 <= orderLength <= 8`; `4 <= menuSize <= 8`;
  `700 <= exposureMs <= 3000`; `5000 <= patienceMs <= 15000`;
  `0 <= similarPairs <= 3` and `similarPairs < menuSize`.

Telemetry mapping (existing schema):
- `trial_started`: `{ trialId, targetCount: orderLength, exposureMs, seed }`.
  `menuSize` lives in the run configuration (`GameConfig.extra`), not per
  trial.
- `response`: `{ trialId, correct (exact order), selectedCells (tap order),
  correctCells (order), reactionTimeMs (curtain-lift → submit) }`.
- `timeout`: patience exceeded → omission.
- Wrong order → commission. Partial-position accuracy is derivable
  server-side from the two arrays (future metric, not in TaskMetric v1).

Derived metrics: exact-order accuracy, median response time, RT variability,
omissions, commissions, valid trial count → standard `TaskMetric`.

Parent report language: "Akurasi mengingat urutan pesanan" + trend
("meningkat / stabil / perlu perhatian"). Never "daya ingat anak naik".

### Flagship 2: Red Light (`red_light`) — Lampu Merah!

Primary domain: inhibitory control (hypothesis weight 0.8).
Secondary: processing speed (0.2). A cultural reskin of the stop-signal
mechanic: every Indonesian child knows "lampu merah, lampu hijau".

Fantasy: the child's runner sprints to the flag on green and must freeze on
red. Sometimes the lamp flips a fraction of a second after the go cue.

30-second loop:
1. "Siap..." countdown. Tapping during countdown → gentle warning +
   `TOO_FAST_RESPONSE` quality flag; the trial is excluded, never punished.
2. "HIJAU!" go cue → tap as fast as possible (go trials).
3. Stop trials: red lamp appears after the current SSD → withhold any tap
   for the stop window (1000ms).
4. Freeze poses and flag progress; false starts get a kind "tahan dulu ya".

Session: 4 practice (2 go, 2 stop, teaching the freeze) + 28 scored trials.

Difficulty (D1–D10) — SSD staircase runs inside the run (same
adapt-SSD pattern as `stop_signal`):

```text
D:  stopProp  initSSD  step  minSSD  maxSSD  goDur   goDeadline
D1:  0.20     550ms    50ms  200ms   900ms   2500ms  3000ms
D2:  0.22     520ms    50ms  180ms   900ms   2300ms  3000ms
D3:  0.25     490ms    45ms  160ms   900ms   2100ms  2800ms
D4:  0.27     460ms    45ms  140ms   900ms   1900ms  2600ms
D5:  0.30     430ms    40ms  120ms   900ms   1700ms  2500ms
D6:  0.32     400ms    40ms  100ms   900ms   1500ms  2300ms
D7:  0.35     370ms    35ms  100ms   900ms   1300ms  2100ms
D8:  0.37     340ms    35ms  100ms   900ms   1100ms  1900ms
D9:  0.40     320ms    30ms  100ms   900ms    950ms  1700ms
D10: 0.42     300ms    25ms  100ms   900ms    800ms  1500ms
```

- Successful stop → SSD decreases (harder); failed stop → SSD increases.
  Clamp to `[minSSD, maxSSD]`; log the SSD of every stop trial.
- Validation mirrors `stop_signal`: proportion in (0, 1), SSD ≥ 100ms,
  go duration ≥ 500ms, min < max.

Telemetry mapping (existing schema):
- `trial_started`: `{ trialId, seed }` (trial kind is revealed in
  `response.correctOption`, so no schema change is needed).
- `response`: `{ trialId, correct, reactionTimeMs (go cue → tap; omitted on
  successful stops), responded, selectedOption ("run" | "hold" | "early"),
  correctOption ("run" | "hold"), stopped, stopSignalDelayMs }`.
- Go hit → correct; go miss/timeout → omission; tap on stop → commission;
  hold on stop → correct.

Derived metrics: stop-success rate, go median RT, go omissions, stop
commissions, final SSD → standard `TaskMetric` (same conventions as the
stop-signal family).

Parent report language: "Berhasil menahan diri saat lampu merah: x%"
plus "waktu reaksi lari" trend. Never "kontrol diri / impulsivitas anak".

### Flagship 3: Courier Map (`courier_map`) — Kurir Peta

Primary domain: cognitive flexibility (hypothesis weight 0.7).
Secondary: visual-spatial (0.3). The differentiator: real route choices
under changing rules, not just reactions.

Fantasy: the child is a courier crossing a small map. Roads close, and the
dispatch rule changes mid-shift ("jembatan merah tutup", "lewat pos biru
saja"). Deliver the package by tapping neighboring map nodes.

30-second loop:
1. Map + active-rule banner shown.
2. Child taps adjacent nodes to move; shortest valid path is the reference.
3. Reaching the flag submits the trial automatically.
4. Tapping a rule-forbidden edge ends the trial as a rule-break
   (commission) with a kind explanation of the active rule — rules are the
   challenge, so forbidden edges are not pre-marked.

Session: 2 practice (fixed simple map, rules taught one at a time) +
8 scored deliveries.

Difficulty (D1–D10):

```text
D:  nodes  blocked  rules                                    switchP  deadline
D1:  6      0        [reach_flag]                             0        20000ms
D2:  7      1        [reach_flag]                             0        19000ms
D3:  8      1        [reach_flag, avoid_water]                0.15     18000ms
D4:  9      2        [reach_flag, avoid_water]                0.20     17000ms
D5:  10     2        [reach_flag, avoid_water, blue_posts]    0.25     16000ms
D6:  11     3        3 rules                                  0.30     15000ms
D7:  12     3        3 rules                                  0.30     13000ms
D8:  13     4        4 rules (+no_toll)                       0.35     12000ms
D9:  14     4        4 rules                                  0.35     11000ms
D10: 16     5        4 rules                                  0.40     10000ms
```

- Rule registry (string ids): `reach_flag`, `avoid_water`,
  `blue_posts_only`, `no_toll`. Max 4 active rules; `0 <= switchP <= 0.4`.
- Validation: `6 <= mapNodes <= 16`; blocked edges < nodes;
  `8000 <= deadline <= 25000`; generator must guarantee a connected map
  with a reachable goal (assert, don't just hope).

Telemetry mapping (existing schema):
- `trial_started`: `{ trialId, seed }` (map layout + rules live in the run
  configuration; per-trial rule state rides on `response`).
- `response`: `{ trialId, correct (reached flag obeying rules),
  selectedCells (node path in order), correctCells (reference shortest
  valid path), currentRule, previousRule, switchTrial,
  reactionTimeMs (map-shown → delivered) }`.
- `timeout` → omission; rule-break → commission. Path efficiency
  (chosen length vs reference) is derivable server-side from the arrays.

Derived metrics: route-validity accuracy, post-switch error rate (from
`switchTrial`), median delivery time, omissions, commissions.

Parent report language: "Paket sampai: n/m; kesalahan aturan: k" plus
trend after rule changes ("mulai menyesuaikan dengan aturan baru").
Never "kemampuan adaptasi / kecerdasan".

### Flagship 4: Lighthouse Keeper (`lighthouse_keeper`) — Penjaga Mercusuar

Primary domain: working memory (hypothesis weight 0.8).
Secondary: sustained attention (0.2). A cultural Simon-style wrap:
Indonesia's coastlines are full of lighthouses, and a keeper who forgets
the light code endangers every passing ship.

Fantasy: the child is the lighthouse keeper. The beam sweeps the four
lantern panes and flashes a colour sequence; the keeper repeats it exactly
so ships can navigate the reef.

30-second loop:
1. Sequence flashes (`stimulus_shown` → `stimulus_hidden`): N pane
   colours, one per `flashMs`.
2. Child repeats by tapping the four panes; auto-submits at full length.
3. Exact match → beam steady + ships pass; wrong pane → kind retry cue;
   patience timeout → omission.

Session: 2 practice + 12 scored trials.

Difficulty (D1–D10) — sequence length, flash speed and patience move
against each other:

```text
D:  seqLength  flashMs  patienceMs
D1:  2          1000ms   15000ms
D2:  2           950ms   14500ms
D3:  3           900ms   14000ms
D4:  3           850ms   13000ms
D5:  4           800ms   12500ms
D6:  4           750ms   11500ms
D7:  5           700ms   10500ms
D8:  5           650ms    9500ms
D9:  6           600ms    9000ms
D10: 7           500ms    8000ms
```

- Validation: `2 <= seqLength <= 8`; `400 <= flashMs <= 1500`;
  `6000 <= patienceMs <= 20000`.

Telemetry mapping (existing schema):
- `trial_started`: `{ trialId, targetCount: seqLength, exposureMs,
  seed }`.
- `response`: `{ trialId, correct (exact sequence), selectedCells (tap
  order), correctCells (target order), reactionTimeMs }`.
- `timeout` → omission; wrong pane → commission.

Derived metrics: exact-sequence accuracy, median RT, RT variability,
omissions, commissions → standard `TaskMetric`.

Parent report language: "Akurasi mengulang urutan pancaran: {x}%" plus
"waktu mengulang" trend. Never "daya ingat anak naik".

### Flagship 5: Sushi Express (`sushi_express`)

Primary domain: processing speed (hypothesis weight 0.8).
Secondary: sustained attention (0.2). The conveyor belt forces a sustained
visual-motor chase — plates keep coming whether you are ready or not.

Fantasy: the child runs the sushi counter. Plates ride a conveyor belt
past the chef's serve zone; serve the ones the customer ordered before
they slide past.

30-second loop:
1. One customer order (a single sushi type) is pinned to the order card.
2. Plates spawn at the kitchen end and ride the belt into the serve zone
   (`spawnIntervalMs` apart, `beltMs` to cross). The engine and renderer
   share the same timing math, so a tap is judged against the plate
   actually in the zone.
3. Serving a matching plate is a hit; serving a wrong plate is a
   commission; letting a target slide past is an omission.

Session: 2 practice + 12 scored runs.

Difficulty (D1–D10):

```text
D:  plates  types  targetP  beltMs   spawnMs
D1:  6       2      0.50     4000ms   1600ms
D2:  6       2      0.45     3600ms   1450ms
D3:  7       3      0.40     3300ms   1300ms
D4:  7       3      0.35     3000ms   1200ms
D5:  8       3      0.33     2800ms   1100ms
D6:  8       4      0.30     2600ms   1000ms
D7:  9       4      0.28     2400ms    950ms
D8:  9       4      0.25     2200ms    900ms
D9:  10      5      0.22     2000ms    850ms
D10: 10      5      0.20     1900ms    800ms
```

- Serve zone is fixed at x ∈ [0.72, 0.92] of the belt (exported
  constants); every run mixes at least one target and one distractor.
- Validation: `4 <= platesPerTrial <= 12`; `2 <= sushiTypes <= 5`;
  `0.15 <= targetProbability <= 0.6`; `1500 <= beltMs <= 5000`;
  `600 <= spawnIntervalMs <= 2500`.

Telemetry mapping (existing schema):
- `trial_started`: `{ trialId, targetCount (target plates), targetSushi,
  exposureMs (belt run length), seed }`.
- `response`: `{ trialId, correct (all targets served, no wrong plates),
  selectedCells (served plate ids), correctCells (target plate ids),
  reactionTimeMs (mean serve RT) }`.
- Targets left unserved → `timeout` (omission); wrong plates served →
  commission.

Derived metrics: serve accuracy, mean serve RT, omissions, commissions,
RT variability → standard `TaskMetric`.

Parent report language: "Pesanan tersaji tepat: {x}%" plus "kecepatan
menyajikan" trend. Never "kecepatan proses anak naik".

### Flagship 6: Crystal Palace (`crystal_palace`) — Istana Kristal

Primary domain: visual-spatial (hypothesis weight 0.8).
Secondary: sustained attention (0.2). Gives the visual_spatial domain its
first primary game family: constrained visual search over a 3D courtyard.

Fantasy: the royal crystal palace has been rearranged; find every crystal
matching the decree (colour + cut) before the audience loses patience.

30-second loop:
1. A decree card shows the target crystal (one of 4 colours × 4 cuts).
2. The courtyard is a grid of faceted 3D crystals — matches, near-miss
   distractors (share colour or cut), and unrelated crystals.
3. Child taps every match. Tapping a wrong crystal ends the trial as a
   commission; the deadline leaving matches untapped is an omission.

Session: 2 practice + 12 scored searches.

Difficulty (D1–D10):

```text
D:  rows  cols  matches  similar  deadline
D1:  3     3     2        0        20000ms
D2:  3     4     3        0        19000ms
D3:  4     4     3        1        18000ms
D4:  4     5     4        1        17000ms
D5:  5     5     4        2        16000ms
D6:  5     6     5        2        15000ms
D7:  6     6     5        3        14000ms
D8:  6     7     6        3        13000ms
D9:  7     7     6        3        12000ms
D10: 7     8     7        3        11000ms
```

- `similar` = near-miss pairs planted (share colour OR cut); unrelated
  crystals never accidentally match the target.
- Validation: `2 <= rows/cols <= 8`; `2 <= matchCount <= 8`;
  `rows*cols >= matchCount + 4`; `0 <= similarLevel <= 3`;
  `8000 <= deadlineMs <= 25000`.

Telemetry mapping (existing schema):
- `trial_started`: `{ trialId, targetCount: matchCount, targetColor,
  targetShape, seed }`.
- `response`: `{ trialId, correct (all matches found, no wrong taps),
  selectedCells (tapped ids), correctCells (match ids),
  reactionTimeMs }`.
- Deadline → `timeout` (omission); wrong tap → commission.

Derived metrics: search accuracy, median search time, commissions,
omissions → standard `TaskMetric`.

Parent report language: "Kristal yang ditemukan tepat: {x}%" plus
"kecepatan mencari" trend. Never "kemampuan visual anak".

## Common game contract

Every game implements:

```ts
interface CognitiveGame {
  key: string;
  version: string;
  getConfig(difficulty: number): GameConfig;
  validateConfig(config: GameConfig): void;
  start(context: GameContext): void;
  handleInput(input: InputEvent): void;
  emitEvent(event: GameEvent): void;
  finish(): GameSummary;
}
```

## Game quality requirements

Each game must have:
- practice mode
- deterministic seed option for testing
- randomized production seed
- explicit version
- accessibility mode
- touch-first interaction
- no accidental double-submit
- telemetry contract
- unit tests for scoring
- E2E happy path
