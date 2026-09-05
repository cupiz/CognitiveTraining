# 02 — System Architecture

## 1. High-level architecture

```text
Browser
  |
  +-- Next.js App
  |     +-- Parent UI
  |     +-- Child UI
  |     +-- Game Shell
  |     +-- Assessment UI
  |
  +-- Game Runtime
  |     +-- Phaser scenes / Canvas
  |     +-- Input abstraction
  |     +-- local event buffer
  |
  v
API Layer
  |
  +-- Auth
  +-- Profiles
  +-- Consent
  +-- Assessments
  +-- Sessions
  +-- Telemetry ingestion
  +-- Results
  +-- Reports
  |
  v
Domain Services
  |
  +-- Scoring Engine
  +-- Adaptive Engine
  +-- Training Planner
  +-- Norm Engine (later)
  |
  v
PostgreSQL
  |
  +-- Accounts
  +-- Children
  +-- Sessions
  +-- Game configurations
  +-- Raw events
  +-- Derived metrics
  +-- Algorithm versions
  +-- Reports
```

## 2. Monorepo proposal

```text
apps/
  web/
  api/                 # optional if API is split
packages/
  ui/
  game-core/
  game-memory-matrix/
  game-target-watch/
  game-quick-match/
  game-stop-signal/
  game-rule-switch/
  scoring/
  adaptive/
  planner/
  schemas/
  analytics/
  config/
docs/
infra/
scripts/
tests/
```

## 3. Architectural rules

- Domain logic must not live inside React components.
- Game runtime emits events; it does not directly calculate global cognitive scores.
- Scoring consumes validated events.
- Adaptive engine consumes derived performance plus context.
- Planner consumes profile + recent exposure + constraints.
- Every derived object stores algorithm version.
- Raw events are append-only.
- Never overwrite raw telemetry.
- Every game has an explicit version.

## 4. Client architecture

### App shell
Handles:
- authentication state
- routing
- localization
- accessibility
- responsive layout

### Game shell
Responsibilities:
- preload assets
- initialize game
- provide session/game IDs
- normalize input
- collect telemetry
- buffer events
- send batches
- show pause/end states

### Input abstraction

```ts
type InputEvent =
  | { type: "pointer_down"; x: number; y: number; tClient: number }
  | { type: "pointer_up"; x: number; y: number; tClient: number }
  | { type: "key_down"; key: string; tClient: number }
  | { type: "touch"; x: number; y: number; tClient: number };
```

## 5. Backend architecture

Recommended modules:

```text
auth
accounts
children
consent
assessment
training
games
telemetry
scoring
adaptive
planner
reporting
admin
audit
```

## 6. Event pipeline

```text
Game action
 -> event builder
 -> client validation
 -> local buffer
 -> POST /telemetry/batch
 -> API validation
 -> raw event store
 -> async scoring
 -> derived metrics
 -> adaptive state
 -> planner
```

## 7. Reliability

If connection drops:
- continue game if possible
- buffer events locally
- assign monotonic sequence number
- retry batch with idempotency key
- server deduplicates
- mark incomplete telemetry if unrecoverable

## 8. Timekeeping

Reaction time should use:
- `performance.now()` for client-side elapsed timing
- server receive time only for transport diagnostics
- never calculate reaction time from server timestamps alone

Record:
- device class
- browser
- screen dimensions
- refresh rate if available
- performance timing diagnostics
- input modality

Avoid storing raw IP in analytics unless operationally necessary.

## 9. Security boundaries

Parent authorization:
```text
Parent -> Child relationship -> permitted child data
```

Child gameplay session:
- scoped session token
- no parent account data in game payload
- minimal PII

Admin:
- separate role
- audit all sensitive access

## 10. Performance budget

Initial target:
- landing JS < 300–400 KB compressed where practical
- game chunk lazy-loaded
- game assets lazy-loaded
- no analytics blocking first interaction
- telemetry batched, not per frame

## 11. Observability

Metrics:
- API latency
- telemetry ingestion success
- game load time
- asset errors
- session abandonment
- scoring queue latency
- planner errors

Logs:
- correlation ID
- session ID
- game version
- algorithm version
- no unnecessary child names/emails
