# 03 — Data Model

## Core entities

### Account
```text
id UUID PK
email
password_hash / auth_provider_id
role
locale
created_at
updated_at
```

### ChildProfile
```text
id UUID PK
account_id FK
display_name
birth_month
birth_year
locale
accessibility_json
status
created_at
updated_at
```

### ConsentRecord
```text
id UUID PK
child_id FK
consent_type
version
granted_at
revoked_at nullable
source
```

### Assessment
```text
id UUID PK
child_id FK
assessment_version
started_at
completed_at
status
device_context_json
```

### AssessmentBlock
```text
id UUID PK
assessment_id FK
domain
task_version
order_index
```

### TrainingSession
```text
id UUID PK
child_id FK
planner_version
started_at
completed_at
status
target_duration_sec
```

### GameRun
```text
id UUID PK
session_id FK
game_key
game_version
configuration_json
started_at
ended_at
status
```

### RawEvent
```text
id UUID PK
game_run_id FK
sequence_no
event_type
client_time_ms
payload_json
received_at
idempotency_key
```

Unique:
(game_run_id, sequence_no)

### TaskMetric
```text
id UUID PK
game_run_id FK
metric_version
accuracy
median_rt_ms
mean_rt_ms
rt_variability
omission_errors
commission_errors
difficulty
valid_trial_count
quality_flags_json
created_at
```

### DomainPerformance
```text
id UUID PK
child_id FK
domain
score
confidence
window_start
window_end
algorithm_version
source_run_count
created_at
```

### AdaptiveState
```text
id UUID PK
child_id FK
game_key
ability_estimate
uncertainty
current_difficulty
algorithm_version
updated_at
```

### TrainingPlan
```text
id UUID PK
child_id FK
planner_version
created_at
expires_at
items_json
```

### Report
```text
id UUID PK
child_id FK
period_start
period_end
report_version
summary_json
created_at
```

## Data principles

1. Raw events immutable.
2. Derived metrics versioned.
3. Algorithm changes never rewrite old history.
4. Delete/export workflows must cover raw and derived child data.
5. Store minimum necessary child PII.
6. Use foreign keys and cascading policies deliberately.
7. Use database constraints for uniqueness/idempotency.

## Suggested indexes

- ChildProfile(account_id)
- TrainingSession(child_id, started_at DESC)
- GameRun(session_id)
- RawEvent(game_run_id, sequence_no)
- DomainPerformance(child_id, domain, created_at DESC)
- AdaptiveState(child_id, game_key)
