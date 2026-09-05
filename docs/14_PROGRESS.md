# 14 — Progress

Last updated: 2026-09-05

## Overall

Status: SPRINT 0–12 COMPLETE / ALL ITEMS IMPLEMENTED

Progress: ~96% implementation

## Bug fixes & UX hardening (2026-09-05)

- Fixed pause wedge in `BaseGame` — `thawPausableTimers()` left the timer map
  empty, so a second pause froze nothing and rounds finished behind the pause
  modal ("can't get back into the game"). Timers now re-register on thaw with
  a fresh clock; `armTimer` clears stale handles (double-fire guard).
- Fixed "stuck at 3" countdown — the module-level pause bus stayed latched
  after exiting a round while paused; the play layout now resets it on unmount.
- Countdown now holds while the pause modal is open (round no longer starts
  behind the modal).
- Added per-trial time bar (TrialClock on BaseGame/GameRunner + GameShell UI):
  green→amber→red, freezes while paused, driven by each game's response-window
  timer ("deadline" / sushi beltEnd).
- Added favicon (`src/app/icon.svg` + generated `src/app/favicon.ico` via
  `scripts/generate-favicon.mjs`).
- Redesigned Courier Map arena for kid readability: flat bright board, big
  semantic node badges (🏠 💧 P 💳 🚩 🛵), 🚧 for closed roads, ridden-path
  trail, large mission card, green identity palette.
- Game visual audit (11 arenas): fixed prompt/badge overlap in Lighthouse
  Keeper & Crystal Palace; made stimulus gradient ids unique per instance in
  RuleSwitch (duplicate SVG ids could render a blank option card); restyled
  Sushi Express conveyor (teal slats, readable serve zone).
- Added `e2e/pause.spec.ts` (5 tests): pause/resume, countdown hold while
  paused, exit-while-paused bus-leak regression, time bar shrink + freeze.

## Security & e2e hardening (2026-09-05, second pass)

Making `e2e/security.spec.ts` runnable surfaced real API bugs it had been
skipping over (its beforeAll used two identical timestamp-generated emails, so
the second signup always failed and four tests cascade-skipped):

- Middleware: unauthenticated `/api/*` now returns a 401 JSON envelope instead
  of a 307 redirect to the HTML login page (API semantics).
- `authorizeChild`: malformed (non-UUID) child ids return a clean 404 —
  previously Prisma threw and the route answered 500.
- Children schema: `birthYear` is now capped at the current year (2030 was a
  hardcoded max that aged poorly; future birth years were accepted).
- e2e: fixed child-id extraction in security specs (page URL `/dashboard` was
  used as a child id), distinct email suffixes in the Authorization beforeAll,
  and bumped signup/login UI timeouts to 20s for busy dev servers.
- Security spec is fully green for the first time: 20/20.

## Bug fixes (2026-09-01)

- Fixed `getPhase()` in all 5 games — was stuck on "practice" due to BaseGame phase not updating. Added `gameMode` tracker.
- Fixed `nextTrial()` practice counting — was checking already-changed phase. Added `isCurrentPracticeTrial` flag.
- Fixed canvas input handler race condition in GameShell — removed pointerdown handlers when custom renderer present.
- Fixed QuickMatch/RuleSwitch `onInput` to read `cellIndex` from GameShell instead of non-existent `optionIndex`.
- Fixed StopSignal direction inference to use `cellIndex` instead of x-coordinate.
- Fixed game instance reuse — changed from module-level singletons to factory functions for fresh instances per play.
- Added unique telemetry IDs per game session (instead of static temp IDs).

## Phase status

| Phase | Status | Notes |
|---|---|---|
| Product/PRD | Done | Draft v0.1 |
| Architecture | Done | Full-web architecture |
| Data model | Done | 15 tables, 11 enums |
| API spec | Done | v1 draft |
| User flows | Done | MVP flows |
| Game design | Done | 5 game families |
| Flagship games | In progress | All six flagship games implemented: `spice_stall`, `red_light`, `courier_map`, `lighthouse_keeper`, `sushi_express`, `crystal_palace` (spec docs/06, Phase 13), with CSS-3D renderers |
| Adaptive engine | Done | Elo-like ability estimation + bounded controller |
| Scoring/norms | Designed | Validation explicitly pending |
| Security/privacy | Designed | Legal review pending |
| Testing | Designed | Unit/E2E/simulation |
| Deployment | Designed | CI/CD plan |
| Implementation — Phase 0 | Done | 10/10 (staging environment documented) |
| Implementation — Phase 1 | Done | 9/9 (email sending implemented) |
| Implementation — Phase 2 | Done | 8/8 |
| Implementation — Phase 3 | Done | 8/8 |
| Implementation — Phase 4 | Done | All 5 games implemented (169 tests) |
| Implementation — Phase 5 | Done | Assessment + game runs + scoring (21 scoring + 6 E2E tests) |
| Implementation — Phase 6 | Done | Adaptive engine: ability estimation, difficulty control, uncertainty, simulation, fixtures (47 tests) |
| Implementation — Phase 7 | Done | Training planner: domain mapping, weakness weighting, exposure penalty (32 tests) |
| Implementation — Phase 8 | Done | Dashboard: overview, trends, session history, adaptive states |
| Implementation — Phase 9 | Done | Data quality: RT detection, visibility, duplicates, anomalies, quality scoring |
| Implementation — Phase 10 | Done | Security: IDOR tests, rate limiting, CSRF, audit logs, data export/deletion, retention policy, privacy review |
| Implementation — Phase 11 | Done | Research readiness: measurement hypotheses, norm plan, efficacy study plan |
| Implementation — Phase 12 | Done | Production: runbook, release checklist, deployment config, API docs, staging environment |
| Scientific validation | Not started | Requires study |

## Completed packages

| Package | Contents | Tests |
|---|---|---|
| `@cog/schemas` | Zod schemas, API contracts, event types, game configs | 90 tests |
| `@cog/db` | Prisma schema, client singleton, seed, env validation | — |
| `@cog/game-core` | GameRunner, EventBuilder, LocalEventBuffer, TrialTracker, BaseGame | 50 tests |
| `@cog/game-memory-matrix` | Memory Matrix game logic, difficulty config, UI renderer | 18 tests |
| `@cog/game-target-watch` | Target Watch game logic, difficulty config, UI renderer | 36 tests |
| `@cog/game-quick-match` | Quick Match game logic, difficulty config, UI renderer | 35 tests |
| `@cog/game-stop-signal` | Stop Signal game logic, difficulty config, UI renderer, adaptive SSD | 39 tests |
| `@cog/game-rule-switch` | Rule Switch game logic, difficulty config, UI renderer, perseverative tracking | 41 tests |
| `@cog/game-spice-stall` | Spice Stall game logic, difficulty config, UI renderer, order-sequence telemetry | 27 tests |
| `@cog/game-red-light` | Red Light (Lampu Merah!) game logic, difficulty config, SSD staircase, UI renderer | 43 tests |
| `@cog/game-courier-map` | Courier Map (Kurir Peta) game logic, connected map generator + rule registry, CSS-3D map renderer | 23 tests |
| `@cog/game-lighthouse-keeper` | Lighthouse Keeper (Penjaga Mercusuar) sequence recall logic, CSS-3D lighthouse renderer | 19 tests |
| `@cog/game-sushi-express` | Sushi Express conveyor serve logic with pause-safe timing, CSS-3D belt renderer | 18 tests |
| `@cog/game-crystal-palace` | Crystal Palace (Istana Kristal) visual-search logic, CSS-3D courtyard renderer | 21 tests |
| `@cog/scoring` | Task metric computation, quality flag detection, RT validation, data quality analysis | 36 tests |
| `@cog/adaptive` | Ability estimation, difficulty controller, uncertainty tracking, performance computation | 47 tests |
| `@cog/planner` | Domain mapping, weakness weighting, exposure penalty, session constraints, rationale | 32 tests |
| `@cog/web` | Next.js app, auth, children CRUD, consent, dashboard, game shell, assessment API, game run API | 46+ E2E tests |

## Completed API routes (35)

```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/password-reset
POST   /api/auth/password-reset/confirm
POST   /api/auth/verify-email
POST   /api/children
GET    /api/children
GET    /api/children/[childId]
PATCH  /api/children/[childId]
DELETE /api/children/[childId]
POST   /api/children/[childId]/consent
GET    /api/children/[childId]/consent
POST   /api/children/[childId]/consent/revoke
POST   /api/assessments
GET    /api/assessments
GET    /api/assessments/[id]
PATCH  /api/assessments/[id]
POST   /api/assessments/[id]/complete
POST   /api/training/sessions
GET    /api/training/sessions
GET    /api/training/sessions/[id]
PATCH  /api/training/sessions/[id]
POST   /api/training/sessions/[id]/complete
POST   /api/game-runs
GET    /api/game-runs
GET    /api/game-runs/[id]
POST   /api/game-runs/[id]/start
PATCH  /api/game-runs/[id]/finish
POST   /api/telemetry/batch
```

## Completed UI pages (11)

```
/                                    → redirect to login/dashboard
/login                              → login form
/signup                             → signup form
/forgot-password                    → password reset request
/dashboard                          → dashboard overview (stats, children, domains)
/dashboard/games                    → game selection (6 games + difficulty slider)
/dashboard/children                 → children list
/dashboard/children/new             → create child
/dashboard/children/[childId]       → child detail
/dashboard/children/[childId]/edit  → edit child
/dashboard/play/[gameKey]           → game runner
```

## Next 10 implementation steps

1. ~~Bootstrap monorepo.~~
2. ~~Create shared schemas package.~~
3. ~~Create database migrations.~~
4. ~~Implement parent auth.~~
5. ~~Implement child profile + authorization.~~
6. ~~Implement game shell.~~
7. ~~Implement Memory Matrix.~~
8. ~~Implement Target Watch game.~~
9. ~~Implement Quick Match game.~~
10. ~~Implement Rule Switch game.~~
11. ~~Implement assessment session management.~~ ~~Implement adaptive engine.~~ ~~Implement planner.~~ ~~Implement dashboard overview.~~ ~~Implement dashboard trends.~~ ~~Implement data quality.~~ ~~Implement security hardening.~~ ~~Implement research readiness.~~ ~~Implement production deployment.~~ (COMPLETE)

## Known limitations

- Scoring engine is pure-function based — no DB queries, no async
- Quality flags computed on game finish, not real-time (checkEventQuality available for real-time use)
- Planner does not yet persist TrainingPlan records (items returned in response only)
- Rate limiting is in-memory (replace with Redis in production)
- Audit log is in-memory (replace with external logging service in production)
- Email sending uses console logging in development (configure SMTP/Resend for production)

## Progress update protocol

After each meaningful task:
- update status
- list changed files
- list tests run
- list known limitations
- update percentage only when measurable

Never mark a task done because code merely compiles.

## E2E suite stabilization (2026-09-05, third pass)

- auth/games/landing specs updated for the Indonesian UI (link labels,
  button copy, navigation waits) — they were written against the old English
  copy and had been failing/skipping silently.
- `games.spec` navigation loop got a 240s test budget (11 games no longer fit
  the 60s default); child-create waits for hydration before submitting.
- Local flakiness root cause: the suite was run against a hot `next dev`
  server (webServer reuses it) — on-demand compilation wedged the run.
  Run e2e against a production build (config already does this in CI).
- Full suite on the production build: 58 passed in 3.8 min (retry 1× absorbs
  first-request warm-up).
