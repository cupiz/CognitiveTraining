# 12 — Vibe Coding Rules

## Rule 1 — Read before coding

For every task, AI coder must read:
- relevant PRD section
- architecture
- data model
- API contract
- acceptance criteria

## Rule 2 — Do not invent architecture

If a requirement is ambiguous:
- inspect docs
- search code
- state assumption
- make smallest change

## Rule 3 — Types first

Every API payload and game event has a TypeScript schema.

Preferred:
```ts
const EventSchema = z.object({...});
type Event = z.infer<typeof EventSchema>;
```

## Rule 4 — Server is authoritative

Client can report observations.
Server calculates official:
- scores
- domain performance
- adaptive state
- training plan

## Rule 5 — Raw data is immutable

Never edit telemetry to "fix" a score. Add correction/quality records.

## Rule 6 — Version everything important

Version:
- game
- game config
- assessment
- scoring
- adaptive engine
- planner
- norm set
- report

## Rule 7 — Small commits

Prefer:
```text
feat(game): add memory matrix trial engine
feat(scoring): calculate matrix accuracy
feat(adaptive): add bounded difficulty controller
```

Avoid giant mixed commits.

## Rule 8 — Tests with every algorithm

If changing scoring/adaptive/planner:
- add unit tests
- add regression fixtures
- run simulation

## Rule 9 — Never claim scientific validity in code comments

Use:
```text
prototype heuristic
```
not:
```text
scientifically proven cognitive ability model
```

## Rule 10 — Preserve UX safety

No:
- shame
- fear
- misleading medical claims
- fake scientific certainty

## Rule 11 — Performance

Game loops must not:
- call network per frame
- allocate large objects unnecessarily
- trigger React state updates every frame

## Rule 12 — AI coding prompt template

```text
You are implementing one scoped task from the Cognitive Training Platform spec.

First read:
- docs/01_PRD.md
- docs/02_ARCHITECTURE.md
- relevant domain docs
- docs/15_ACCEPTANCE_CRITERIA.md

Task:
<PASTE TODO ITEM>

Constraints:
- TypeScript strict mode
- Zod validation
- server-authoritative scoring
- immutable telemetry
- version all derived algorithms
- do not add dependencies unless necessary
- do not modify unrelated modules

Deliver:
1. implementation
2. tests
3. migration if needed
4. documentation update
5. concise summary
```

## Rule 13 — Before saying done

Run:
- typecheck
- lint
- unit tests
- relevant E2E
- build
- inspect diff
- update docs/14_PROGRESS.md
