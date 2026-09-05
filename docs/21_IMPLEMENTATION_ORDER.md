# 21 — Implementation Order

## Phase 0 — Foundation
- Monorepo setup (pnpm workspaces, TypeScript, ESLint, Prettier, Vitest)
- Database schema (Prisma, 15 tables, 11 enums)
- Environment validation
- CI pipeline (GitHub Actions)
- Playwright E2E setup

## Phase 1 — Auth & Parent
- Parent signup/login/logout
- Child profile CRUD
- Authorization middleware
- Consent record API
- ⚠️ Email sending (API done, delivery TODO)

## Phase 2 — Game Foundation
- GameShell component
- Input abstraction (InputEvent types)
- Deterministic seeding
- Local event buffer with retry
- Telemetry batch API

## Phase 3 — Memory Matrix
- Working memory game implementation
- Difficulty config (D1–D10)
- Practice mode
- Scoring and telemetry

## Phase 4 — All 5 Games
- Target Watch (sustained attention)
- Quick Match (processing speed)
- Stop Signal (inhibitory control)
- Rule Switch (cognitive flexibility)
- Game selection dashboard

## Phase 5 — Assessment Session Management
- Assessment creation with auto-generated blocks
- Game run lifecycle (create, start, finish)
- Task metric computation from raw events
- Quality flag detection
- Training session lifecycle

## Phase 6 — Adaptive Engine
- Elo-like ability estimation
- Bounded difficulty controller
- Uncertainty tracking
- Performance computation
- API integration (game-runs finish)

## Phase 7 — Training Planner
- Domain mapping (games → cognitive domains)
- Weakness weighting
- Recent exposure penalty
- Session constraints
- Planner rationale codes
- API integration (training sessions)

## Phase 8 — Dashboard (Next)
- Domain overview
- Trends
- Session history
- Game performance
- Confidence indicators
- Parent report

## Phase 9 — Data Quality
- Invalid RT detection
- Visibility interruption detection
- Duplicate event detection
- Device anomaly flags
- Telemetry quality dashboard

## Phase 10 — Security/Privacy
- IDOR tests
- Rate limiting
- CSRF protection
- Audit logs
- Export/deletion
- Retention policy

## Phase 11 — Research Readiness
- Preregistered measurement hypotheses
- Test-retest study plan
- Convergent validity plan
- Norm sampling plan
- Independent review

## Phase 12 — Production
- Production monitoring
- Backups
- Restore drill
- Incident runbook
- Release checklist

## Phase 13 — Flagship game slate (implemented)

Status (2026-09-04): all six flagship games implemented end-to-end
(schemas, engines, planner, Prisma migrations, CSS-3D web renderers, E2E):
`spice_stall`, `red_light`, `courier_map`, `lighthouse_keeper`,
`sushi_express`, `crystal_palace`. **Continuation guide:
docs/31_FLAGSHIP_HANDOFF.md** (step-by-step recipe, per-game notes, traps,
verification commands).

Assessment note: `mvp-1` assessment blocks stay classic-only on purpose —
H1–H5 baseline stability comes first. Flagship families join training
sessions and the planner immediately, and join assessment blocks only after
their exploratory validation (docs/22) is demonstrated.

> The step-by-step plan below is superseded for execution by
> docs/31_FLAGSHIP_HANDOFF.md (written from the actual `spice_stall`
> build). The order and compatibility rules still hold.

Status: spec only (docs/06). Implement in this order:
`spice_stall` → `red_light` → `courier_map`. Keep the 5 classic games as
measurement anchors; do not delete or renumber them.

1. Schemas (`packages/schemas`, additive only, new tests):
   - extend `GameKey` with `spice_stall`, `red_light`, `courier_map`
   - add `SpiceStallDifficulty`, `RedLightDifficulty`, `CourierMapDifficulty`
     to `GameDifficultyConfig` (tables in docs/06)
   - no new event types; document payload conventions from docs/20
2. Planner (`packages/planner`):
   - add proposed domain mappings as hypotheses
     (`spice_stall` → working_memory 0.8 / visual_spatial 0.2;
     `red_light` → inhibitory_control 0.8 / processing_speed 0.2;
     `courier_map` → cognitive_flexibility 0.7 / visual_spatial 0.3)
   - planner eligibility + session-budget checks for ~4–6 min runs
3. Game packages (`packages/game-spice-stall`, `game-red-light`,
   `game-courier-map`): `BaseGame` subclass, D1–D10 table, validation,
   deterministic seed, practice/scored split, unit + simulation tests
   (bounds, seed replay, staircase clamping for `red_light`, map
   connectivity assert for `courier_map`)
4. Web (`apps/web`): metadata in `lib/games.ts`, renderers +
   `GameArt` + feedback copy, play-page factory entries, E2E happy path per
   game. Assessment `mvp-1` blocks stay classic-only (see note above).
5. Scoring/adaptive: no formula change expected — `computeMetrics` and
   `computePerformance` already consume the reused payload conventions;
   add fixtures + simulation profiles per flagship family
6. Research: register flagship families as exploratory in docs/22 until
   test-retest + convergent validity are demonstrated; bump
   `mapping_version` and use new `game_version` values (`0.1.0`)

Compatibility rules:
- additive schema changes only; old runs stay reproducible
- never reuse a classic game's key/version for a flagship reskin
- dashboard/report copy follows docs/18 (task performance, no diagnosis)

## Critical dependency chain

```text
Schemas
  ↓
Game Core
  ↓
Telemetry
  ↓
Scoring
  ↓
Adaptive
  ↓
Planner
  ↓
Assessment/Profile
  ↓
Dashboard
```

Do not start normative scoring before the measurement pipeline is stable.
