# 31 — Flagship Handoff (for the next build session)

Purpose: everything another agent needs to continue the flagship slate
(`red_light`, then `courier_map`) without rediscovering what `spice_stall`
already proved. Specs live in docs/06; this file is the build log + recipe.

Last updated: 2026-09-04.

## 1. Status snapshot

| Item | State |
|---|---|
| `spice_stall` (Warung Bumbu, working memory) | Implemented end-to-end, verified (see §5) |
| `red_light` (Lampu Merah!, inhibitory control) | Implemented end-to-end, verified (see §5) |
| `courier_map` (Kurir Peta, cognitive flexibility) | Implemented end-to-end, verified (see §5) |
| `lighthouse_keeper` (Penjaga Mercusuar, working memory) | Implemented end-to-end (3D night-scene renderer) |
| `sushi_express` (Sushi Express, processing speed) | Implemented end-to-end (3D conveyor renderer) |
| `crystal_palace` (Istana Kristal, visual spatial) | Implemented end-to-end (3D courtyard renderer) |
| 5 classic games | Untouched measurement anchors |
| Assessment `mvp-1` | Classic-only on purpose (docs/21 Phase 13 note) |
| Local dev DB | Migrations `20260904000000_add_spice_stall_game_key` …
  `20260904033000_add_crystal_palace_game_key` applied |

New machines run `prisma migrate deploy` (it contains the enum additions).
Never run `prisma migrate dev` here — the dev DB has drifted from the
squashed init migration and `migrate dev` demands a reset (data loss).

Per-game units: courier_map 23, lighthouse_keeper 19, sushi_express 18,
crystal_palace 21 (all green with full `tsc` builds). The 3D renderers are
CSS/SVG perspective scenes — no WebGL/three.js dependency — and Sushi
Express/Lighthouse Keeper share pause-adjusted clock fields
(`beltElapsedMs` / `sequenceElapsedMs`) so animation and rules never
diverge after a pause.

## 2. Environment facts

- pnpm monorepo, Next.js 15 + React 19 (`apps/web`), 13 packages.
- No Docker in this environment; native PostgreSQL on `localhost:5432`.
- `DATABASE_URL` lives in `apps/web/.env.local` (dev only, never commit).
- Dev server: `pnpm --filter @cog/web dev` (log: `web-dev.log`).
- Web resolves workspace game packages via their `dist/` output —
  **a new game package must be `tsc`-built before the web app sees it**.
- Vitest does NOT typecheck (esbuild transpile only). Green unit tests can
  still hide type errors — always run `tsc` builds + web typecheck.

## 3. Replication recipe (one flagship game)

Do the layers in this order. `spice_stall` is the reference implementation
for every step.

1. **Schemas** (`packages/schemas/src`):
   - `enums.ts`: extend `GameKey`.
   - `games/index.ts`: add `<Name>Difficulty` zod object + union entry.
   - `games/games.test.ts`: accept + reject cases.
2. **Adaptive** (`packages/adaptive/src`):
   - `types.ts`: extend `GameKey`.
   - `difficulty-controller.ts`: add bounds entry (same 1–10 table shape).
   - Extend the "all game keys" arrays in `engine.test.ts` and
     `difficulty-controller.test.ts`.
3. **Prisma** (`packages/db/prisma`):
   - Add the value to the `GameKey` enum in `schema.prisma`.
   - Hand-author `migrations/<timestamp>_add_<key>_game_key/migration.sql`
     with `ALTER TYPE "GameKey" ADD VALUE '<key>';` (do NOT use
     `migrate dev` here — see §1).
   - `prisma migrate deploy`, then `prisma generate`.
   - If generate fails with EPERM on the query-engine DLL, the dev server
     holds the file: stop it, generate, restart it.
4. **Game package** (`packages/game-<name>/`, scaffold mirrors
   `packages/game-quick-match`): `package.json`, `tsconfig.json`,
   `tsconfig.build.json`, `vitest.config.ts`, `src/difficulty.ts`,
   `src/game.ts`, `src/index.ts`, `src/difficulty.test.ts`,
   `src/game.test.ts`. Register in root `tsconfig.json` references.
   - Engine extends `BaseGame`; phase machine
     `showing → waiting → feedback` with pausable timers (`armTimer`).
   - Practice/scored split copies the `isCurrentPracticeTrial` pattern.
   - `trial_started` carries trial-varying params; run-level params live in
     `GameConfig.extra` (see `spice_stall`: `menuSize` in config,
     `orderLength`/`exposureMs`/`seed` per trial).
5. **Planner** (`packages/planner/src`):
   - `types.ts`: extend `GameKey`.
   - `domain-mapping.ts`: mapping entry + `getAllGameKeys`.
   - `engine.ts`: per-family version in `GAME_VERSIONS`
     (flagships start at `0.1.0`).
   - Update counts/versions in `domain-mapping.test.ts`,
     `scoring.test.ts`, `engine.test.ts`.
6. **Web** (`apps/web`):
   - `package.json`: add workspace dep + `pnpm install`, then **build the
     new game package** before typechecking web.
   - `src/lib/games.ts`: metadata + own identity hue.
   - `src/components/games/<Name>.tsx` + `index.ts` export (mirror
     `SpiceStall.tsx`: `TrialHeader`/`Instruction`/`ProgressBar` from
     `GameFrame`; taps call `onCellTap(index)` → shell injects `cellIndex`).
   - `GameArt.tsx`: motif + case. `src/lib/game/feedback.ts`: outcome case.
   - Play page (`dashboard/play/[gameKey]/page.tsx`): factory + renderer
     entries (+ type import). Note: the page passes `maxTrials: 20,
     practiceTrials: 3` — engine `maxTrials` defaults only apply when unset.
   - Landing (`src/app/landing/`): `content.ts` `gameHints` in BOTH locales
     + `GAME_ICONS` entry in `landing-client.tsx` (tabs iterate `GAMES`;
     without these the tab shows "Cara main: undefined"). Add a `GameMini`
     case if the default art misleads.
7. **E2E** (`apps/web/e2e/games.spec.ts`): marker-based tests WITH a child
   (`signupWithChild`/`createChild` in `helpers.ts`). Never assert ghost
   strings — the old `text=Loading …` / `text=pts` locators matched nothing
   in the real UI and the suite was red because of it.
8. **Docs**: docs/06 status line, docs/13 checkboxes, docs/14 row,
   docs/19 package table, docs/21 Phase 13 status; docs/18 copy for the new
   game; docs/22 only if measurement expectations change (H1–H5 untouched).

## 4. Per-game notes

### `red_light` (implemented — reference for `courier_map`'s pattern)
- Reference implementation: `packages/game-red-light` (43 unit tests) +
  `packages/game-stop-signal` (SSD staircase `adaptSsd`, `stopTrialProportion`,
  `minSsdMs/maxSsdMs` clamping). D1–D10 table in docs/06.
- Response payload (existing schema, no new types):
  `correct`, `reactionTimeMs` (go cue → tap; omit on successful stops),
  `responded`, `selectedOption` (`run`|`hold`|`early`),
  `correctOption` (`run`|`hold`), `stopped`, `stopSignalDelayMs`.
- Countdown taps → `TOO_FAST_RESPONSE` quality flag, trial excluded, kind
  copy only ("tahan dulu ya"). The false start never calls `startTrial()`,
  so the excluded trial counts nowhere (local summary + server agree).
- Hue (shipped): blue `#2f80ed` / tint `#e9f1fd` / deep `#1f5fb8`.
- Renderer: pseudo-3D street scene (perspective road, glowing traffic lamp,
  SVG kid runner that sprints on green via CSS animation and freezes on red
  via `animation-play-state`), label chip "Lampu Merah" doubles as the E2E
  marker.

### `courier_map` (next)
- Reference: `packages/game-rule-switch` (rule representation as string
  ids, `switchProbability`, perseveration tracking). D1–D10 table + rule
  registry (`reach_flag`, `avoid_water`, `blue_posts_only`, `no_toll`) in
  docs/06.
- Node paths ride on ordered `selectedCells`/`correctCells`; rule state on
  `currentRule`/`previousRule`/`switchTrial`. Rule-break tap ends the trial
  as commission (kind rule reminder, never shame copy).
- Generator MUST assert connected map + reachable goal (fail loudly, never
  ship an unsolvable trial).
- Proposed hue (adjust freely): cargo bronze `#8a6d3b` /
  tint `#f4ecdd` / deep `#6b5326`.

## 5. How `spice_stall` was verified (repeat for each game)

- Unit: `pnpm --filter @cog/game-spice-stall --filter @cog/schemas
  --filter @cog/planner --filter @cog/adaptive --filter @cog/scoring
  --filter @cog/game-core test:run` — all green.
- Builds in order: `@cog/schemas` → game package → `@cog/web typecheck`.
- E2E: `playwright test e2e/games.spec.ts e2e/landing.spec.ts
  e2e/assessment.spec.ts` — green (10 + 3 + 6).
- Manual: signup → child → play with `childId` → order strip →
  curtain → taps → feedback; screenshots confirm; zero page errors.
- Telemetry proof: successful `POST /api/game-runs` with the new key
  exercises the zod `GameKey` + Prisma enum end-to-end.

## 6. Traps (learned the hard way)

1. **First-trial response loss.** `TrialTracker.completedTrials` only
   contains ENDED trials, so reading "last completed trial" at submit time
   drops trial #1's response event. `spice_stall` stores `currentTrialId`
   from `startTrial()` instead. The same latent bug exists in
   `memory_matrix` — fixed pattern, do not copy the bug.
2. **Timeout semantics.** Emit a real `timeout` event and skip
   `trials.respond()` → omission on BOTH local summary and server scoring
   (`computeMetrics` counts `timeout` events as omissions; a `response`
   with `correct: false` counts as commission).
3. **Fake timers go BEFORE `game.start()`** in engine tests, or armed
   timers never fire. Remember feedback/deadline tails when advancing time
   (e.g. patience + 800ms feedback).
4. **Stale `dist`.** After extending schemas, rebuild `@cog/schemas`
   before building dependent packages, or `tsc` fails on the new key while
   vitest stays green.
5. **No PII in payloads.** Integer ids and rule strings only — enforced by
   docs/20 event rules.
6. **Assessment stays classic.** `mvp-1` blocks are the H1–H5 baseline;
   flagships join training/planner only until docs/22 exploratory criteria
   pass.

## 7. Known pre-existing issues (out of flagship scope)

- `e2e/auth.spec.ts` + parts of `e2e/security.spec.ts` fail on locale
  drift (tests expect English "Sign up"/"Sign out", UI is Indonesian) and
  on 401-vs-redirect expectations (middleware 307s to `/login`).
  `security.spec.ts` previously failed to even load (imported helpers that
  didn't exist); the import is fixed so the file runs.
- `memory_matrix` loses trial #1's response telemetry (see trap 1) —
  unfixed, needs its own ticket.
- Open product decisions: flagship hues for `red_light`/`courier_map`
  (§4 proposals), full auth/security suite repair.
