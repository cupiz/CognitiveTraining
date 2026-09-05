# 04 — API Specification

Base URL:
`/api/v1`

Authentication:
- secure session cookie or short-lived bearer token
- refresh mechanism if token-based
- CSRF protection for cookie-authenticated state changes

## Standard response envelope

Success:
```json
{
  "data": {},
  "requestId": "uuid"
}
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  },
  "requestId": "uuid"
}
```

## Auth

### POST /auth/signup
Request:
```json
{
  "email": "parent@example.com",
  "password": "..."
}
```

### POST /auth/login
### POST /auth/logout
### POST /auth/password-reset

## Child profiles

### POST /children
```json
{
  "displayName": "Alex",
  "birthYear": 2016,
  "birthMonth": 5,
  "locale": "id-ID"
}
```

### GET /children
### GET /children/{childId}
### PATCH /children/{childId}
### DELETE /children/{childId}

## Consent

### POST /children/{childId}/consent
```json
{
  "consentType": "training",
  "documentVersion": "2026-01"
}
```

### POST /children/{childId}/consent/revoke

## Assessment

### POST /assessments
```json
{
  "childId": "uuid",
  "assessmentVersion": "mvp-1"
}
```

Response:
```json
{
  "data": {
    "assessmentId": "uuid",
    "blocks": [
      {
        "blockId": "uuid",
        "domain": "working_memory",
        "gameKey": "memory_matrix",
        "gameVersion": "1.0.0",
        "config": {}
      }
    ]
  }
}
```

### POST /assessments/{id}/complete

## Training

### POST /training/sessions
```json
{
  "childId": "uuid"
}
```

Response:
```json
{
  "data": {
    "sessionId": "uuid",
    "plannerVersion": "planner-0.1",
    "items": [
      {
        "gameKey": "memory_matrix",
        "gameVersion": "1.0.0",
        "difficulty": 4
      }
    ]
  }
}
```

### POST /training/sessions/{id}/complete

## Game run

### POST /game-runs
```json
{
  "sessionId": "uuid",
  "gameKey": "memory_matrix",
  "gameVersion": "1.0.0",
  "configuration": {
    "difficulty": 4
  }
}
```

### POST /game-runs/{id}/start
### POST /game-runs/{id}/finish

## Telemetry

### POST /telemetry/batch

Headers:
`Idempotency-Key: uuid`

Request:
```json
{
  "gameRunId": "uuid",
  "events": [
    {
      "sequenceNo": 1,
      "eventType": "trial_started",
      "clientTimeMs": 10231,
      "payload": {
        "trialId": "t1",
        "stimulusId": "matrix_12"
      }
    },
    {
      "sequenceNo": 2,
      "eventType": "response",
      "clientTimeMs": 10884,
      "payload": {
        "trialId": "t1",
        "correct": true,
        "reactionTimeMs": 653
      }
    }
  ]
}
```

Server requirements:
- validate schema
- verify gameRun ownership
- reject impossible sequence numbers
- deduplicate
- rate-limit
- append raw event
- return accepted/rejected counts

## Results

### GET /children/{childId}/performance?from=&to=
Returns:
```json
{
  "domains": [
    {
      "domain": "working_memory",
      "score": 74,
      "confidence": 0.71,
      "trend": 0.08,
      "algorithmVersion": "score-0.1"
    }
  ]
}
```

### GET /children/{childId}/sessions
### GET /children/{childId}/reports

## Planner

### POST /planner/preview
Admin/research only in MVP.

Request:
```json
{
  "childId": "uuid",
  "constraints": {
    "maxMinutes": 15
  }
}
```

Response includes:
- selected games
- target domains
- difficulty
- rationale codes
- planner version

## Admin

### GET /admin/games
### GET /admin/game-runs
### GET /admin/metric-quality
### GET /admin/algorithm-versions

## API rules

- All request/response schemas are generated or shared from packages/schemas.
- Never trust client-computed scores.
- Client reaction time is accepted as a measurement input but server applies quality checks.
- Never allow client to submit arbitrary domain scores.
- Every mutation is auditable.
- Sensitive endpoints require explicit authorization.
