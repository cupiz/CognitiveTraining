# 19 — Repository Structure

```text
/
├─ .github/
│  └─ workflows/
│     └─ ci.yml                     # CI: typecheck → lint → test → build
├─ apps/
│  └─ web/                          # Next.js 15 + React 19 app
│     ├─ e2e/                       # Playwright E2E tests
│     │  ├─ auth.spec.ts
│     │  └─ helpers.ts
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ (auth)/              # Auth route group
│     │  │  │  ├─ login/page.tsx
│     │  │  │  ├─ signup/page.tsx
│     │  │  │  └─ forgot-password/page.tsx
│     │  │  ├─ (dashboard)/         # Protected route group
│     │  │  │  ├─ layout.tsx        # Auth check + nav
│     │  │  │  └─ dashboard/
│     │  │  │     ├─ page.tsx
│     │  │  │     ├─ children/
│     │  │  │     │  ├─ page.tsx           # List
│     │  │  │     │  ├─ new/page.tsx       # Create
│     │  │  │     │  └─ [childId]/
│     │  │  │     │     ├─ page.tsx        # Detail
│     │  │  │     │     └─ edit/page.tsx   # Edit
│     │  │  │     └─ play/
│     │  │  │        └─ [gameKey]/
│     │  │  │           └─ page.tsx        # Game runner
│     │  │  ├─ api/
│     │  │  │  ├─ auth/
│     │  │  │  │  ├─ signup/route.ts
│     │  │  │  │  ├─ login/route.ts
│     │  │  │  │  ├─ logout/route.ts
│     │  │  │  │  ├─ me/route.ts
│     │  │  │  │  ├─ password-reset/route.ts
│     │  │  │  │  ├─ password-reset/confirm/route.ts
│     │  │  │  │  └─ verify-email/route.ts
│     │  │  │  ├─ children/
│     │  │  │  │  ├─ route.ts              # POST create + GET list
│     │  │  │  │  └─ [childId]/
│     │  │  │  │     ├─ route.ts           # GET/PATCH/DELETE
│     │  │  │  │     └─ consent/
│     │  │  │  │        ├─ route.ts        # POST grant + GET list
│     │  │  │  │        └─ revoke/route.ts # POST revoke
│     │  │  │  └─ telemetry/
│     │  │  │     └─ batch/route.ts        # POST telemetry batch
│     │  │  ├─ layout.tsx
│     │  │  ├─ page.tsx             # Root redirect
│     │  │  └─ globals.css
│     │  ├─ components/
│     │  │  ├─ game/                # Game shell components
│     │  │  │  ├─ GameShell.tsx     # Main orchestrator
│     │  │  │  ├─ GameLoading.tsx   # Loading skeleton
│     │  │  │  ├─ GameError.tsx     # Error boundary
│     │  │  │  ├─ GameResult.tsx    # Post-game summary
│     │  │  │  └─ index.ts
│     │  │  └─ games/               # Game-specific renderers
│     │  │     ├─ MemoryMatrix.tsx  # Grid-based recall
│     │  │     ├─ TargetWatch.tsx   # Sequential symbol detection
│     │  │     ├─ QuickMatch.tsx    # Stimulus matching
│     │  │     ├─ StopSignal.tsx    # Go/stop inhibition
│  │  │     ├─ RuleSwitch.tsx    # Rule classification
│  │  │     ├─ SpiceStall.tsx    # Order-sequence recall (flagship)
│  │  │     ├─ RedLight.tsx      # Go/freeze pseudo-3D street (flagship)
│  │  │     ├─ CourierMap.tsx    # 3D isometric courier map (flagship)
│  │  │     ├─ LighthouseKeeper.tsx # 3D lighthouse beam repeat (flagship)
│  │  │     ├─ SushiExpress.tsx  # 3D conveyor belt serving (flagship)
│  │  │     ├─ CrystalPalace.tsx # 3D crystal courtyard search (flagship)
│  │  │     └─ index.ts
│     │  ├─ lib/
│     │  │  ├─ auth/
│     │  │  │  ├─ index.ts
│     │  │  │  ├─ password.ts       # bcryptjs hashing
│     │  │  │  ├─ jwt.ts            # jose JWT
│     │  │  │  ├─ session.ts        # Cookie + DB session
│     │  │  │  └─ tokens.ts         # Verification tokens
│     │  │  ├─ api/
│     │  │  │  ├─ authorize.ts      # Auth + ownership checks
│     │  │  │  └─ response.ts       # API envelope helpers
│     │  │  └─ game/
│     │  │     ├─ telemetry-sender.ts    # HTTP telemetry batch sender
│     │  │     └─ input-normalizer.ts    # DOM events → InputEvent
│     │  └─ middleware.ts           # Route protection
│     ├─ playwright.config.ts
│     ├─ next.config.ts
│     └─ package.json
├─ packages/
│  ├─ schemas/                      # @cog/schemas — Zod schemas
│  │  └─ src/
│  │     ├─ types.ts                # UUID, Email, ISODateTime, etc.
│  │     ├─ enums.ts                # All domain enums
│  │     ├─ models/                 # 12 data model schemas
│  │     ├─ api/                    # API request/response contracts
│  │     ├─ events/                 # Telemetry event schemas
│  │     └─ games/                  # Game configs + difficulty types
│  ├─ db/                           # @cog/db — Prisma + PostgreSQL
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma           # 15 tables, 11 enums
│  │  │  ├─ seed.ts
│  │  │  └─ migrations/
│  │  └─ src/
│  │     ├─ index.ts                # Prisma client singleton
│  │     └─ validate-env.ts         # Zod env validation
│  ├─ game-core/                    # @cog/game-core — Game runtime (50 tests)
│  │  └─ src/
│  │     ├─ context.ts              # GameContext, TelemetrySender
│  │     ├─ event-builder.ts        # Monotonic sequence events
│  │     ├─ event-buffer.ts         # Local buffer + retry
│  │     ├─ game.ts                 # CognitiveGame interface
│  │     ├─ runner.ts               # GameRunner lifecycle
│  │     ├─ base-game.ts            # Abstract base class
│  │     ├─ trial-tracker.ts        # Trial state + stats
│  │     ├─ seed.ts                 # Deterministic PRNG
│  │     ├─ timing.ts               # performance.now() helpers
│  │     └─ device.ts               # DeviceContext capture
│  ├─ game-memory-matrix/           # Memory Matrix (18 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 grid/target/exposure config
│  │     ├─ game.ts                 # Trial engine, scoring, telemetry
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
│  ├─ game-target-watch/            # Target Watch (36 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 symbols/interval/deadline config
│  │     ├─ game.ts                 # Sequential stimulus, inhibition tracking
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
│  ├─ game-quick-match/             # Quick Match (35 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 options/presentation/distractors
│  │     ├─ game.ts                 # Stimulus matching, accuracy/RT scoring
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
│  ├─ game-stop-signal/             # Stop Signal (39 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 SSD/proportion/duration config
│  │     ├─ game.ts                 # Go/stop trials, adaptive SSD
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
│  ├─ game-rule-switch/             # Rule Switch (41 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 rules/switch probability
│  │     ├─ game.ts                 # Rule classification, perseverative tracking
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
├─ game-spice-stall/              # Spice Stall flagship (27 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 order/menu/exposure/patience config
│  │     ├─ game.ts                 # Order recall, auto-submit, omission timeouts
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
├─ game-red-light/                # Red Light flagship (43 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 stopProp/SSD/goDur config + staircase
│  │     ├─ game.ts                 # Go/stop trials, false-start exclusion, SSD
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
├─ game-courier-map/              # Courier Map flagship (23 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 map/rules config + connected generator
│  │     ├─ game.ts                 # Node-walk delivery, rule breaks, mid-shift switch
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
├─ game-lighthouse-keeper/        # Lighthouse Keeper flagship (19 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 seq/flash/patience config
│  │     ├─ game.ts                 # Beam sequence recall, pause-safe flash clock
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
├─ game-sushi-express/            # Sushi Express flagship (18 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 belt config + plate generator
│  │     ├─ game.ts                 # Conveyor serving, shared timing math
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
├─ game-crystal-palace/           # Crystal Palace flagship (21 tests)
│  │  └─ src/
│  │     ├─ difficulty.ts           # D1-D10 grid/match/similar config
│  │     ├─ game.ts                 # Visual search, near-miss commissions
│  │     ├─ difficulty.test.ts
│  │     └─ game.test.ts
│  ├─ ui/                           # @cog/ui — Shared React components (placeholder)
│  ├─ scoring/                      # @cog/scoring — Task metrics (21 tests)
│  │  └─ src/
│  │     ├─ scoring.ts              # computeMetrics, quality flags
│  │     └─ scoring.test.ts
│  ├─ adaptive/                     # @cog/adaptive — Difficulty engine (47 tests)
│  │  └─ src/
│  │     ├─ types.ts                # AbilityState, PerformanceInput, etc.
│  │     ├─ engine.ts               # processGameRun orchestrator
│  │     ├─ ability-estimator.ts    # Elo-like ability update
│  │     ├─ difficulty-controller.ts # Bounded difficulty recommendation
│  │     ├─ performance.ts          # Accuracy + speed + consistency
│  │     ├─ engine.test.ts
│  │     ├─ ability-estimator.test.ts
│  │     ├─ difficulty-controller.test.ts
│  │     └─ performance.test.ts
│  ├─ planner/                      # @cog/planner — Training planner (32 tests)
│  │  └─ src/
│  │     ├─ types.ts                # PlannerInput, PlannerOutput, PlannerItem, etc.
│  │     ├─ engine.ts               # generatePlan orchestrator
│  │     ├─ domain-mapping.ts       # Games → cognitive domains
│  │     ├─ scoring.ts              # Weakness + exposure + ability scoring
│  │     ├─ engine.test.ts
│  │     ├─ domain-mapping.test.ts
│  │     └─ scoring.test.ts
│  └─ analytics/                    # @cog/analytics — Telemetry (placeholder)
├─ docs/                            # 31 spec documents
├─ infra/                           # Infrastructure (TBD)
├─ scripts/                         # Build/dev scripts
├─ tests/                           # Shared E2E tests
├─ .env.example
├─ docker-compose.yml               # PostgreSQL container
├─ .github/workflows/ci.yml
├─ eslint.config.js
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ tsconfig.json                    # Project references
└─ vitest.workspace.ts
```

## Dependency direction

```text
ui -> no domain dependency
game packages -> game-core + schemas
scoring -> schemas
adaptive -> schemas + scoring types
planner -> adaptive/scoring types
web -> all public packages
db -> schemas where appropriate
```

Avoid circular dependencies.

## Test counts

| Package | Unit Tests |
|---|---|
| @cog/schemas | 90 |
| @cog/game-core | 50 |
| @cog/game-memory-matrix | 18 |
| @cog/game-target-watch | 36 |
| @cog/game-quick-match | 35 |
| @cog/game-stop-signal | 39 |
| @cog/game-rule-switch | 41 |
| @cog/game-spice-stall | 27 |
| @cog/game-red-light | 43 |
| @cog/game-courier-map | 23 |
| @cog/game-lighthouse-keeper | 19 |
| @cog/game-sushi-express | 18 |
| @cog/game-crystal-palace | 21 |
| @cog/planner | 32 |
| @cog/scoring | 36 |
| E2E (Playwright) | 50 |
| **Total** | **632** |
