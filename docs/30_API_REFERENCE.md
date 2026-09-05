# 30 — API Reference

## Overview

This document provides the public API reference for the Cognitive Training Platform.

**Base URL:** `/api`  
**Authentication:** Session cookie (`cog_session`)  
**Content-Type:** `application/json`

---

## Authentication

### POST /api/auth/signup

Create a new parent account.

**Request:**
```json
{
  "email": "parent@example.com",
  "password": "SecurePassword123!"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "email": "parent@example.com"
  }
}
```

### POST /api/auth/login

Authenticate an existing account.

**Request:**
```json
{
  "email": "parent@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "parent@example.com"
  }
}
```

### POST /api/auth/logout

End the current session.

**Response (200):**
```json
{
  "data": true
}
```

### GET /api/auth/me

Get the currently authenticated user.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "email": "parent@example.com"
  }
}
```

---

## Children

### POST /api/children

Create a new child profile.

**Request:**
```json
{
  "displayName": "Alex",
  "birthYear": 2016,
  "birthMonth": 5
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "displayName": "Alex",
    "birthYear": 2016,
    "birthMonth": 5
  }
}
```

### GET /api/children

List all children for the authenticated user.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "displayName": "Alex",
      "birthYear": 2016,
      "birthMonth": 5
    }
  ]
}
```

### GET /api/children/:childId

Get a specific child's details.

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "displayName": "Alex",
    "birthYear": 2016,
    "birthMonth": 5
  }
}
```

### PATCH /api/children/:childId

Update a child's profile.

**Request:**
```json
{
  "displayName": "Alexander"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "displayName": "Alexander"
  }
}
```

### DELETE /api/children/:childId

Delete a child's profile and all associated data.

**Response (200):**
```json
{
  "data": true
}
```

---

## Consent

### POST /api/children/:childId/consent

Grant consent for a child.

**Request:**
```json
{
  "consentType": "training",
  "documentVersion": "2026-01"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "consentType": "training",
    "grantedAt": "2026-09-01T00:00:00.000Z"
  }
}
```

### GET /api/children/:childId/consent

List consent records for a child.

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "consentType": "training",
      "grantedAt": "2026-09-01T00:00:00.000Z"
    }
  ]
}
```

---

## Assessments

### POST /api/assessments

Create a new assessment.

**Request:**
```json
{
  "childId": "uuid",
  "assessmentVersion": "mvp-1"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "status": "pending",
    "blocks": [
      {
        "id": "uuid",
        "domain": "working_memory",
        "gameKey": "memory_matrix"
      }
    ]
  }
}
```

### GET /api/assessments

List assessments for a child.

**Query:** `?childId=uuid`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "completed",
      "createdAt": "2026-09-01T00:00:00.000Z"
    }
  ]
}
```

---

## Training Sessions

### POST /api/training/sessions

Create a new training session with planner.

**Request:**
```json
{
  "childId": "uuid"
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "status": "pending",
    "items": [
      {
        "gameKey": "memory_matrix",
        "difficulty": 5,
        "targetDomain": "working_memory"
      }
    ]
  }
}
```

### GET /api/training/sessions

List training sessions for a child.

**Query:** `?childId=uuid`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "status": "completed",
      "startedAt": "2026-09-01T00:00:00.000Z"
    }
  ]
}
```

---

## Game Runs

### POST /api/game-runs

Create a new game run.

**Request:**
```json
{
  "sessionId": "uuid",
  "gameKey": "memory_matrix",
  "gameVersion": "1.0.0",
  "configuration": {
    "difficulty": 5
  }
}
```

**Response (201):**
```json
{
  "data": {
    "id": "uuid",
    "status": "pending"
  }
}
```

### PATCH /api/game-runs/:id/finish

Finish a game run and compute metrics.

**Request:**
```json
{
  "status": "completed"
}
```

**Response (200):**
```json
{
  "data": {
    "id": "uuid",
    "status": "completed",
    "adaptive": {
      "ability": 5.5,
      "difficulty": 6,
      "changed": true
    }
  }
}
```

---

## Telemetry

### POST /api/telemetry/batch

Send telemetry events.

**Request:**
```json
{
  "gameRunId": "uuid",
  "events": [
    {
      "sequenceNo": 1,
      "eventType": "trial_started",
      "clientTimeMs": 1000,
      "payload": {
        "trialId": "t1"
      }
    }
  ]
}
```

**Response (200):**
```json
{
  "data": {
    "accepted": 1,
    "rejected": 0
  }
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "requestId": "uuid"
}
```

### Error Codes
- `UNAUTHORIZED` — Not authenticated
- `FORBIDDEN` — Not authorized
- `NOT_FOUND` — Resource not found
- `VALIDATION_ERROR` — Invalid request
- `CONFLICT` — Resource already exists
- `RATE_LIMITED` — Too many requests
- `INTERNAL_ERROR` — Server error

---

## Rate Limits

| Endpoint | Limit | Window |
|---|---|---|
| Auth endpoints | 10 requests | 1 minute |
| Telemetry | 100 requests | 1 minute |
| General API | 60 requests | 1 minute |
| Game runs | 30 requests | 1 minute |

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-09-01 | Initial API reference |
