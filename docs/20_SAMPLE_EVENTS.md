# 20 — Sample Telemetry Fixtures

## Memory Matrix

### trial_started
```json
{
  "eventType": "trial_started",
  "sequenceNo": 1,
  "clientTimeMs": 12000,
  "payload": {
    "trialId": "t001",
    "gridRows": 4,
    "gridCols": 4,
    "targetCount": 5,
    "exposureMs": 1200,
    "seed": 12345
  }
}
```

### stimulus_hidden
```json
{
  "eventType": "stimulus_hidden",
  "sequenceNo": 2,
  "clientTimeMs": 13210,
  "payload": {
    "trialId": "t001"
  }
}
```

### response
```json
{
  "eventType": "response",
  "sequenceNo": 3,
  "clientTimeMs": 15580,
  "payload": {
    "trialId": "t001",
    "selectedCells": [0, 2, 7, 9, 15],
    "correctCells": [0, 2, 7, 9, 15],
    "reactionTimeMs": 2370
  }
}
```

## Quality event

```json
{
  "eventType": "quality_flag",
  "payload": {
    "code": "TAB_HIDDEN_DURING_TRIAL"
  }
}
```

## Event design rules

- Event names are stable.
- Payload is versioned when breaking changes occur.
- No free-form child PII.
- Trial IDs unique within game run.
- Sequence numbers monotonically increase.

## Flagship proposal fixtures (not implemented)

Conventions reused from the current schema: ordered integer arrays ride on
`selectedCells` / `correctCells`; trial kind rides on
`selectedOption` / `correctOption`; stop data on `stopped` /
`stopSignalDelayMs`; rule state on `currentRule` / `previousRule` /
`switchTrial`. No new event types are proposed.

### Spice Stall (`spice_stall`) — order recall

```json
{
  "eventType": "trial_started",
  "sequenceNo": 1,
  "clientTimeMs": 9000,
  "payload": {
    "trialId": "s001",
    "targetCount": 4,
    "exposureMs": 1900,
    "seed": 4242
  }
}
```

```json
{
  "eventType": "stimulus_hidden",
  "sequenceNo": 2,
  "clientTimeMs": 10900,
  "payload": { "trialId": "s001" }
}
```

```json
{
  "eventType": "response",
  "sequenceNo": 3,
  "clientTimeMs": 14850,
  "payload": {
    "trialId": "s001",
    "correct": true,
    "selectedCells": [2, 0, 4, 1],
    "correctCells": [2, 0, 4, 1],
    "reactionTimeMs": 3950
  }
}
```

### Red Light (`red_light`) — go/stop trial

Stop trial, successful hold:

```json
{
  "eventType": "trial_started",
  "sequenceNo": 10,
  "clientTimeMs": 61000,
  "payload": { "trialId": "r010", "seed": 777 }
}
```

```json
{
  "eventType": "response",
  "sequenceNo": 11,
  "clientTimeMs": 62430,
  "payload": {
    "trialId": "r010",
    "correct": true,
    "responded": false,
    "selectedOption": "hold",
    "correctOption": "hold",
    "stopped": true,
    "stopSignalDelayMs": 430
  }
}
```

False start during countdown (excluded trial, never punishment):

```json
{
  "eventType": "quality_flag",
  "sequenceNo": 12,
  "clientTimeMs": 63100,
  "payload": {
    "code": "TOO_FAST_RESPONSE",
    "trialId": "r011",
    "details": "tap during countdown"
  }
}
```

### Courier Map (`courier_map`) — rule-switch delivery

```json
{
  "eventType": "trial_started",
  "sequenceNo": 1,
  "clientTimeMs": 5000,
  "payload": { "trialId": "c001", "seed": 9001 }
}
```

```json
{
  "eventType": "response",
  "sequenceNo": 2,
  "clientTimeMs": 19800,
  "payload": {
    "trialId": "c001",
    "correct": true,
    "selectedCells": [0, 1, 4, 7, 9],
    "correctCells": [0, 1, 4, 7, 9],
    "currentRule": "blue_posts_only",
    "previousRule": "avoid_water",
    "switchTrial": true,
    "reactionTimeMs": 14800
  }
}
```
