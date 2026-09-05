# 05 — User Flows

## Flow A — Parent onboarding

```text
Landing
 -> Sign up
 -> Verify email
 -> Product explanation
 -> Privacy/consent explanation
 -> Create child
 -> Child profile setup
 -> Ready for assessment
```

## Flow B — Baseline assessment

```text
Assessment intro
 -> device/input check
 -> practice trial
 -> scored block 1
 -> short break
 -> scored block 2
 -> ...
 -> quality check
 -> assessment complete
 -> processing
 -> initial profile
 -> training plan
```

Rules:
- Explain that this is a performance assessment, not a diagnosis.
- Do not show alarming labels like "weak brain".
- Avoid ranking children against other children in MVP.

## Flow C — Daily training

```text
Child home
 -> "Today's Training"
 -> session intro
 -> Game 1
 -> short transition
 -> Game 2
 -> optional Game 3
 -> session summary
 -> exit to parent area
```

## Flow D — Game

```text
Game intro
 -> practice
 -> countdown
 -> trials
 -> adaptive adjustment
 -> final trials
 -> game result
```

## Flow E — Parent dashboard

```text
Dashboard
  ├─ Overview
  ├─ Progress
  ├─ Sessions
  ├─ Reports
  └─ Settings/privacy
```

Overview:
- sessions this week
- minutes trained
- domains practiced
- trend cards

Progress:
- domain trend
- task-level trend
- consistency
- confidence

## Flow F — Interrupted session

```text
Game
 -> browser hidden / network loss
 -> pause
 -> local buffer
 -> reconnect
 -> resume or safely end
```

## Flow G — Data deletion

```text
Settings
 -> Privacy
 -> Delete child data
 -> Re-authentication
 -> Confirmation
 -> asynchronous deletion
 -> audit record
 -> confirmation
```

## UX rules for children

- Large targets.
- Minimal text.
- One instruction at a time.
- Audio optional.
- Avoid flashing effects.
- No punishment for errors.
- Avoid manipulative streak loss.
- Session should have clear end.
