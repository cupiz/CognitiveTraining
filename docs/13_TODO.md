# 13 — Master TODO

Legend:
- [ ] not started
- [~] in progress
- [x] done
- [!] blocked

## Phase 0 — Foundation

- [x] Initialize monorepo
- [x] Configure TypeScript strict mode
- [x] Configure lint/format
- [x] Configure test runner
- [x] Configure Playwright
- [x] Configure environment validation
- [x] Create CI pipeline
- [x] Create staging environment (docs/27_STAGING_ENVIRONMENT.md)
- [x] Create database
- [x] Implement migration workflow

## Phase 1 — Auth & parent

- [x] Signup
- [x] Login
- [x] Logout
- [x] Email verification (API + token + email sending via email.ts)
- [x] Password reset (API + token + confirm + email sending via email.ts)
- [x] Parent dashboard shell
- [x] Child profile CRUD
- [x] Authorization middleware
- [x] Consent record

## Phase 2 — Game foundation

- [x] Game shell (GameRunner in @cog/game-core)
- [x] Input abstraction (InputEvent types in @cog/schemas)
- [x] deterministic seed support (createRng in @cog/game-core)
- [x] game config schema (GameConfig in @cog/schemas)
- [x] telemetry event schema (GameEvent in @cog/schemas)
- [x] local event buffer (LocalEventBuffer in @cog/game-core)
- [x] retry/idempotency (LocalEventBuffer retry with backoff)
- [x] game loading/error UI (GameShell, GameLoading, GameError, GameResult components)

## Phase 3 — Game 1

- [x] Memory Matrix UI (MemoryMatrix.tsx renderer)
- [x] Memory Matrix mechanics (MemoryMatrixGame extends BaseGame)
- [x] difficulty config (D1-D10 multi-dimensional mapping)
- [x] practice mode (TrialTracker practice/scored separation)
- [x] telemetry (trial_started, stimulus_hidden, response events)
- [x] scoring (accuracy, RT, omission/commission errors)
- [x] tests (18 unit tests: 9 difficulty + 9 game logic)
- [x] E2E (10 Playwright tests passing: auth flow + child profile)

## Phase 4 — Games 2–5

- [x] Target Watch (sustained attention)
- [x] Quick Match (processing speed)
- [x] Stop Signal (inhibitory control)
- [x] Rule Switch (cognitive flexibility)
- [x] tests for each (18 + 36 + 35 + 39 + 41 = 169 game tests)

## Phase 5 — Assessment

- [x] assessment session creation (POST /api/assessments)
- [x] block configuration (auto-generated blocks per assessment version)
- [x] practice blocks (configurable practiceTrials per block)
- [x] scored blocks (configurable maxTrials per block)
- [x] quality flags (scoring engine: RT validation, duplicate detection, clock anomalies)
- [x] assessment completion (POST /api/assessments/[id]/complete)
- [x] training session lifecycle (create, start, complete)
- [x] game run lifecycle (create, start, finish with scoring)
- [x] task metric computation (computeMetrics from raw events)
- [x] session-level quality checks (checkSessionQuality)
- [x] E2E tests (6 assessment flow tests)

## Phase 6 — Adaptive Engine

- [x] adaptive state schema (AdaptiveState in @cog/schemas + Prisma)
- [x] heuristic model (Elo-like ability estimation with sigmoid)
- [x] bounded controller (difficulty bounds per game, max ±1 per session)
- [x] uncertainty tracking (reduces with valid observations)
- [x] performance computation (accuracy + speed + consistency)
- [x] game-specific bounds (all 5 games)
- [x] API integration (game-runs finish updates adaptive state)
- [x] unit tests (47 tests: ability, difficulty, performance, engine)
- [x] simulation (synthetic user profiles in simulation.ts)
- [x] regression fixtures (fixtures.ts with deterministic test cases)

## Phase 7 — Planner

- [x] domain mapping (games → cognitive domains with weights)
- [x] weakness weighting (prioritize domains with lower performance)
- [x] recent exposure penalty (avoid recently played games)
- [x] session duration constraint (configurable max duration)
- [x] game diversity constraint (min unique games, exclude/force games)
- [x] planner rationale (transparency codes for each decision)
- [x] planner tests (32 tests: domain mapping, scoring, engine)
- [x] API integration (training sessions POST uses planner)

## Phase 8 — Dashboard

- [x] domain overview (DomainPerformance component)
- [x] trends (TrendSparkline, TrendCard components)
- [x] session history (SessionHistory component)
- [x] game performance (GamePerformance component)
- [x] confidence indicators (uncertainty display)
- [x] parent report (basic overview)
- [x] API endpoints (GET /api/dashboard, GET /api/dashboard/[childId])

## Phase 9 — Data quality

- [x] invalid RT detection (checkEventQuality, checkBatchQuality)
- [x] visibility interruption detection (VISIBILITY_INTERRUPTION flag)
- [x] duplicate event detection (DUPLICATE_RESPONSE flag)
- [x] device anomaly flags (DEVICE_CLOCK_ANOMALY flag)
- [x] session quality check (checkSessionQualityDetailed)
- [x] pattern analysis (suspicious patterns, constant RT)
- [x] quality score and recommendations
- [x] quality tests (15 tests in quality.test.ts)

## Phase 10 — Security/privacy

- [x] IDOR tests (17 E2E tests in security.spec.ts)
- [x] rate limiting (rate-limit.ts with auth/telemetry/api configs)
- [x] CSRF protection (csrf.ts with double-submit cookie pattern)
- [x] audit logs (audit.ts + GET /api/admin/audit)
- [x] export (GET /api/data/export — full JSON download)
- [x] deletion (POST /api/data/delete — cascading delete with confirmation)
- [x] retention policy (docs/28_DATA_RETENTION_POLICY.md)
- [x] privacy review (docs/29_PRIVACY_REVIEW.md)

## Phase 11 — Research readiness

- [x] preregistered measurement hypotheses (docs/22_MEASUREMENT_HYPOTHESES.md)
- [x] test-retest study plan (H1 in measurement hypotheses)
- [x] convergent validity plan (H2 in measurement hypotheses)
- [x] norm sampling plan (docs/23_NORM_SAMPLING_PLAN.md)
- [x] efficacy study plan (docs/24_EFFICACY_STUDY_PLAN.md)
- [x] measurement versioning (MeasurementVersion schema)
- [x] independent review checklist (docs/29_PRIVACY_REVIEW.md)

## Phase 12 — Production

- [x] production monitoring (health checks, metrics, alerting)
- [x] backups (daily automated, 30-day retention)
- [x] restore drill (documented procedure)
- [x] incident runbook (docs/25_PRODUCTION_RUNBOOK.md)
- [x] release checklist (docs/26_RELEASE_CHECKLIST.md)
- [x] deployment config (vercel.json, Dockerfile, docker-compose.prod.yml)
- [x] public docs (docs/30_API_REFERENCE.md)
- [x] staging environment (docs/27_STAGING_ENVIRONMENT.md)

## Phase 13 — Flagship game slate (all six implemented)

Continuation guide: docs/31_FLAGSHIP_HANDOFF.md (recipe + traps + verification).

- [x] Schemas: `GameKey` + flagship difficulty schemas (additive, tested)
- [x] Planner: flagship domain mappings + per-family game versions
- [x] `game-spice-stall`: engine, D1–D10, unit + simulation tests (27 tests)
- [x] `game-red-light`: engine, SSD staircase, unit + simulation tests (43 tests)
- [x] `game-courier-map`: engine, connected-map generator with rule-aware
  connectivity assert, unit tests (23 tests)
- [x] `game-lighthouse-keeper`: sequence-recall engine (19 tests)
- [x] `game-sushi-express`: conveyor serve engine with pause-safe timing (18 tests)
- [x] `game-crystal-palace`: visual-search engine (21 tests)
- [x] Prisma: `GameKey` enum migrations
  (`20260904030000_add_courier_map_game_key`,
  `20260904031000_add_lighthouse_keeper_game_key`,
  `20260904032000_add_sushi_express_game_key`,
  `20260904033000_add_crystal_palace_game_key`)
- [x] Web: metadata, CSS-3D renderers, art, feedback copy, play wiring,
  landing hints, E2E markers for all six flagships
- [ ] Scoring/adaptive fixtures + simulation profiles per remaining flagship family
- [ ] Research: exploratory registration (done in docs/22), mapping/game version bumps

## Hardening & UX pass (2026-09-05)

- [x] Pause engine: `BaseGame` freeze/thaw now re-registers frozen timers (a
  second pause had nothing to freeze — rounds played themselves behind the
  pause modal); `armTimer` clears stale handles to prevent double-fire
  (regression tests in `game-quick-match`)
- [x] Pause-bus reset on play-layout unmount — exiting mid-pause no longer
  latches the next round's countdown (the "stuck at 3" bug)
- [x] GameShell countdown holds while paused (round no longer starts behind
  the pause modal)
- [x] Trial time bar: `TrialClock` on `BaseGame`/`GameRunner`, slim progress
  bar in GameShell (green→amber→red, freezes while paused), armed by every
  game's response-window timer
- [x] Favicon: `src/app/icon.svg` + generated `src/app/favicon.ico`
  (`scripts/generate-favicon.mjs`, PNG-in-ICO 16+32)
- [x] Courier Map renderer redesign: flat bright board, big semantic node
  badges (🏠/💧/P/💳/🚩/🛵), 🚧 for closed roads, ridden-path trail, large
  mission card, fresh identity palette
- [x] Game visual audit (all 11 arenas): Lighthouse Keeper & Crystal Palace
  prompt/badge overlap fixed; RuleSwitch stimulus gradient ids made unique per
  instance (duplicate SVG ids could blank a card); Sushi Express belt
  restyled (teal slats, readable serve zone)
- [x] E2E: `e2e/pause.spec.ts` — pause/resume, countdown hold, exit-while-
  paused bus-leak regression, time bar shrink + pause-freeze (5 tests)
- [x] Security/e2e hardening: middleware returns 401 JSON (not a 307 redirect)
  for unauthenticated API calls; `authorizeChild` 404s malformed ids instead
  of 500; `birthYear` capped at current year; fixed security.spec's duplicate
  email collision + child-id extraction so all 20 security tests actually run
  and pass
