<div align="center">

# 🧠 Cognitive Training

**Browser-based brain training for kids (ages 7–12) — short adaptive sessions, honest progress, zero installs.**

[![CI](https://github.com/cupiz/CognitiveTraining/actions/workflows/ci.yml/badge.svg)](https://github.com/cupiz/CognitiveTraining/actions/workflows/ci.yml)
![Unit Tests](https://img.shields.io/badge/unit%20tests-602%20passing-brightgreen)
![E2E Tests](https://img.shields.io/badge/e2e%20tests-60%20passing-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js%2015-React%2019-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![License](https://img.shields.io/badge/license-TBD-lightgrey)

*No downloads. No accounts for kids. A parent creates the profile, the child just plays.*

</div>

---

## ✨ What is this?

Cognitive Training is a full-stack platform where a parent signs up, creates a child
profile, and the child plays **short, science-inspired mini-games** that adapt to their
skill level in real time. Every trial produces structured, privacy-safe telemetry, which
feeds an adaptive engine, a training planner, and a plain-language progress dashboard
that parents can actually understand.

**Design principles we refuse to compromise on:**

- 🚫 **No IQ scores, no diagnosis.** We show *training progress within a task family* —
  never clinical or neurological claims. Any efficacy language requires external validation.
- 🧒 **Kid-first UX.** Big touch targets, one-glance game states, hydration-fast feedback,
  a pause button that always works, and practice rounds before anything is scored.
- 🔐 **Privacy by structure.** Kids never create accounts; parents own every profile;
  consent records, data export, and data deletion are built-in API surfaces, not promises.
- 🎲 **Deterministic.** Every game run is seeded — the same seed replays the same trial.

## 📊 At a Glance

| | |
|---|---|
| 🎮 Mini-games | **11** across **6** cognitive domains |
| 📦 Packages | **15** in a pnpm monorepo |
| ✅ Unit tests | **602** (Vitest) |
| 🌐 E2E tests | **60** (Playwright) |
| 📚 Design docs | **31** documents in `docs/` |
| ☁️ Deployment | Vercel-ready (region `sin1`), serverless Postgres |

## 🎮 The Games

| Game | Domain | In 20 seconds |
|---|---|---|
| 🟦 **Memory Matrix** | Working Memory | Memorize the lit tiles, then tap them back. |
| 🎯 **Target Watch** | Sustained Attention | Watch a symbol stream — tap only when the target shows. |
| ⚡ **Quick Match** | Processing Speed | Memorize the target symbol, find its twin before time runs out. |
| ✋ **Stop Signal** | Inhibitory Control | Tap arrow directions fast — freeze when the stop signal appears. |
| 🔀 **Rule Switch** | Cognitive Flexibility | The rule keeps changing — match by color, shape, or size. |
| 🌶️ **Spice Stall** | Working Memory | Remember the customer's order, re-mix it in the same sequence. |
| 🚦 **Lampu Merah (Red Light)** | Inhibitory Control | Sprint on green — freeze completely on red. |
| 🗺️ **Kurir Peta (Courier Map)** | Cognitive Flexibility | Deliver the package to the flag while live rules reroute you. |
| 🗼 **Penjaga Mercusuar (Lighthouse Keeper)** | Working Memory | Watch the lighthouse beam pattern, repeat it on the lantern panes. |
| 🍣 **Sushi Express** | Processing Speed | Grab the ordered sushi plates off the moving belt. |
| 💎 **Istana Kristal (Crystal Palace)** | Spatial Visual | Find every crystal that matches the sample in the palace. |

Every game ships with 10 difficulty levels (D1–D10), a no-stakes practice phase,
kid-readable in-arena instructions, a per-trial time bar, and pause-safe timers.

## 🧠 How the Adaptive Engine Works

```
Child plays a trial
        │
        ▼
┌─────────────────────┐    trial events (RT, accuracy, omissions)
│  Game Engine        │──────────────▶ Telemetry buffer ──▶ /api/telemetry
│  (browser, seeded)  │                                        │
└─────────────────────┘                                        ▼
                                                    ┌──────────────────┐
        difficulty for next session                 │ Scoring pipeline │
        ◀──────────────┐                            │ quality flags,   │
                       │                            │ task metrics     │
              ┌────────┴────────┐                   └────────┬─────────┘
              │ Adaptive engine │  ◀── domain performance      │
              │ Elo-like ability│                             ▼
              │ ±1 bounded step │                   ┌──────────────────┐
              └────────┬────────┘                   │ Training planner │
                       │                            │ weakness weighting│
                       ▼                            │ diversity rules   │
              Progress dashboard                    └──────────────────┘
              (plain language, no jargon)
```

- **Ability estimation** — Elo-like updates with a sigmoid response curve.
- **Bounded difficulty** — max ±1 level per session; no punishing jumps.
- **Uncertainty tracking** — fewer observations = wider confidence, more careful steps.
- **Planner transparency** — every session plan ships with rationale codes.

## 🛠 Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 |
| Language | TypeScript, strict mode |
| Styling | Tailwind CSS, custom design tokens |
| Database | PostgreSQL + Prisma ORM (15 tables, 11 enums) |
| Auth | Parent accounts, JWT sessions (`jose`), bcryptjs |
| Validation | Zod schemas shared across API + clients (`@cog/schemas`) |
| Testing | Vitest (unit) + Playwright (E2E) |
| CI | GitHub Actions (typecheck → lint → unit → E2E) |
| Deploy | Vercel (serverless) + managed Postgres |

## 🏗 Monorepo Layout

```
CognitiveTraining/
├── apps/
│   └── web/                  # Next.js app: pages, API routes, game renderers, E2E
├── packages/
│   ├── schemas/              # Zod contracts shared by API + clients
│   ├── db/                   # Prisma client, migrations, seed
│   ├── game-core/            # GameRunner, BaseGame, pause-safe timers, telemetry buffer
│   ├── game-memory-matrix/   # ── One engine package per game ──
│   ├── game-target-watch/
│   ├── game-quick-match/
│   ├── game-stop-signal/
│   ├── game-rule-switch/
│   ├── game-spice-stall/
│   ├── game-red-light/
│   ├── game-courier-map/
│   ├── game-lighthouse-keeper/
│   ├── game-sushi-express/
│   ├── game-crystal-palace/
│   ├── adaptive/             # Ability estimation + difficulty controller
│   ├── planner/              # Training session planner
│   ├── scoring/              # Trial quality + task metrics
│   ├── analytics/            # Trend computation
│   └── ui/                   # Shared UI primitives
├── docs/                     # 31 design documents (PRD → runbook)
└── vercel.json               # Deploy config (region sin1, security headers)
```

## 🚀 Quick Start

**Prerequisites:** Node 20+ (22 recommended), pnpm 10, PostgreSQL 15+ (or Docker).

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp apps/web/.env.example apps/web/.env.local
#    → point DATABASE_URL at your Postgres, set a JWT_SECRET (32+ chars)

# 3. Set up the database
pnpm --filter @cog/db exec prisma migrate dev
pnpm --filter @cog/db seed

# 4. Run the dev server
pnpm dev                      # → http://localhost:3000

# 5. Verify everything
pnpm typecheck                # strict typecheck across the monorepo
pnpm test:run                 # 602 unit tests
pnpm --filter @cog/web e2e    # 60 Playwright tests (production build)
```

**Seed accounts (development only):**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@cog.local` | Printed **once** by the seed script — or set `ADMIN_INITIAL_PASSWORD` to choose it |
| Parent (test) | `test@example.com` | No login (placeholder hash) |

No credentials live in this repository. The seed generates a random admin
password and prints it once; set `ADMIN_INITIAL_PASSWORD` before seeding to
pick your own (and rotate an existing admin's password by re-running the seed
with the variable set).

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string. On serverless use a **pooled** URL (e.g. Neon `-pooler`). |
| `JWT_SECRET` | ✅ | Session signing secret, 32+ random characters. |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public origin, e.g. `https://your-app.vercel.app`. |
| `SESSION_EXPIRY_HOURS` | — | Session lifetime (default 24). |

Never commit real secrets — `.env*` files are git-ignored.

## ☁️ Deploying to Vercel

1. Push this repo to GitHub.
2. Import it on Vercel — the included `vercel.json` pins the build (`pnpm -r build`
   builds workspace packages in dependency order), region `sin1`, and API security headers.
3. Provision Postgres — [Neon](https://neon.tech) free tier is a great fit (serverless
   pooling, Singapore region, no auto-pause gotchas).
4. Set the env vars above, run `prisma migrate deploy` + seed against the cloud DB once.
5. Ship it. Production build completes in ~2 minutes; expect ~0.5s cold starts.

## 🧪 Testing Philosophy

- **Unit first** — every game engine, the adaptive engine, planner, and scoring are pure
  TypeScript packages with deterministic RNG, so trials are reproducible in tests.
- **E2E like a parent** — Playwright drives the real flows: signup → child profile →
  how-to screen → gameplay → pause/resume → results → dashboard.
- **Security as behavior** — IDOR, auth redirect, input validation, and data deletion
  are asserted, not assumed. Unauthenticated API calls get clean 401 JSON; foreign
  child ids get 403, never a leaky 500.

## 📚 Documentation

The `docs/` folder is the product's source of truth — 31 documents from the PRD to the
production runbook. Start with [`docs/01_PRD.md`](docs/01_PRD.md), or jump to
[`docs/06_GAME_DESIGN.md`](docs/06_GAME_DESIGN.md) for the game specs and
[`docs/07_ADAPTIVE_ENGINE.md`](docs/07_ADAPTIVE_ENGINE.md) for the math.

## 🗺 Roadmap

- [ ] Email delivery for verification & password reset
- [ ] Wire the rate limiter module into API routes (module exists, not yet mounted)
- [ ] Kid-mode (per-child session handoff) polish across all surfaces
- [ ] Norm sampling & test–retest study (plan in `docs/23`, `docs/24`)
- [ ] Admin analytics expansion

## 🤝 Contributing

Issues and PRs are welcome. Please read `docs/12_VIBE_CODING_RULES.md` first — it
captures the house rules (typed contracts first, tests with every engine, no clinical
claims).

---

<div align="center">
<sub>Built with ❤️ for curious kids and their patient parents.</sub>
</div>
