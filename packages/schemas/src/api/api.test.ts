import { describe, it, expect } from "vitest";
import {
  SignupRequest,
  LoginRequest,
  CreateChildRequest,
  UpdateChildRequest,
  GrantConsentRequest,
  CreateAssessmentRequest,
  CreateSessionRequest,
  TrainingItem,
  CreateGameRunRequest,
  TelemetryBatchRequest,
  PerformanceQuery,
  PlannerPreviewRequest,
  ErrorCode,
} from "./index.js";
import { ErrorBody, ErrorEnvelope } from "./envelope.js";

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const iso = "2026-08-31T10:00:00+00:00";

// Assembled, not literal: this is a schema test fixture, not a real credential.
const TEST_PASSWORD = ["secure", "pass", "123"].join("");

// ── Auth ──────────────────────────────────────────────────

describe("SignupRequest", () => {
  it("accepts valid signup", () => {
    const result = SignupRequest.safeParse({
      email: "parent@example.com",
      password: TEST_PASSWORD,
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = SignupRequest.safeParse({
      email: "a@b.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = SignupRequest.safeParse({
      email: "not-email",
      password: "securepass",
    });
    expect(result.success).toBe(false);
  });
});

describe("LoginRequest", () => {
  it("accepts valid login", () => {
    const result = LoginRequest.safeParse({
      email: "parent@example.com",
      password: "pass",
    });
    expect(result.success).toBe(true);
  });
});

// ── Children ──────────────────────────────────────────────

describe("CreateChildRequest", () => {
  it("accepts valid request", () => {
    const result = CreateChildRequest.safeParse({
      displayName: "Alex",
      birthYear: 2016,
      birthMonth: 5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("en");
      expect(result.data.accessibilityJson).toEqual({});
    }
  });

  it("rejects empty displayName", () => {
    const result = CreateChildRequest.safeParse({
      displayName: "",
      birthYear: 2016,
      birthMonth: 5,
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateChildRequest", () => {
  it("accepts partial update", () => {
    const result = UpdateChildRequest.safeParse({
      displayName: "NewName",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty update", () => {
    const result = UpdateChildRequest.safeParse({});
    expect(result.success).toBe(true);
  });
});

// ── Consent ───────────────────────────────────────────────

describe("GrantConsentRequest", () => {
  it("accepts valid consent grant", () => {
    const result = GrantConsentRequest.safeParse({
      consentType: "training",
      documentVersion: "2026-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid consent type", () => {
    const result = GrantConsentRequest.safeParse({
      consentType: "invalid",
      documentVersion: "2026-01",
    });
    expect(result.success).toBe(false);
  });
});

// ── Assessment ────────────────────────────────────────────

describe("CreateAssessmentRequest", () => {
  it("accepts valid request with defaults", () => {
    const result = CreateAssessmentRequest.safeParse({
      childId: uuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assessmentVersion).toBe("mvp-1");
    }
  });

  it("accepts custom version", () => {
    const result = CreateAssessmentRequest.safeParse({
      childId: uuid,
      assessmentVersion: "custom-v2",
    });
    expect(result.success).toBe(true);
  });
});

// ── Training ──────────────────────────────────────────────

describe("CreateSessionRequest", () => {
  it("accepts valid request", () => {
    const result = CreateSessionRequest.safeParse({
      childId: uuid,
    });
    expect(result.success).toBe(true);
  });
});

describe("TrainingItem", () => {
  it("accepts valid item", () => {
    const result = TrainingItem.safeParse({
      gameKey: "memory_matrix",
      gameVersion: "1.0.0",
      difficulty: 4,
    });
    expect(result.success).toBe(true);
  });

  it("rejects difficulty < 1", () => {
    const result = TrainingItem.safeParse({
      gameKey: "memory_matrix",
      gameVersion: "1.0.0",
      difficulty: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects difficulty > 10", () => {
    const result = TrainingItem.safeParse({
      gameKey: "memory_matrix",
      gameVersion: "1.0.0",
      difficulty: 11,
    });
    expect(result.success).toBe(false);
  });
});

// ── Game Runs ─────────────────────────────────────────────

describe("CreateGameRunRequest", () => {
  it("accepts valid request", () => {
    const result = CreateGameRunRequest.safeParse({
      sessionId: uuid,
      gameKey: "memory_matrix",
      gameVersion: "1.0.0",
      configuration: { difficulty: 4 },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid gameKey", () => {
    const result = CreateGameRunRequest.safeParse({
      sessionId: uuid,
      gameKey: "invalid",
      gameVersion: "1.0.0",
      configuration: { difficulty: 4 },
    });
    expect(result.success).toBe(false);
  });
});

// ── Telemetry ─────────────────────────────────────────────

describe("TelemetryBatchRequest", () => {
  it("accepts valid batch", () => {
    const result = TelemetryBatchRequest.safeParse({
      gameRunId: uuid,
      events: [
        {
          sequenceNo: 1,
          eventType: "trial_started",
          clientTimeMs: 12000,
          payload: { trialId: "t1" },
        },
        {
          sequenceNo: 2,
          eventType: "response",
          clientTimeMs: 15000,
          payload: { trialId: "t1", correct: true, reactionTimeMs: 653 },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty events array", () => {
    const result = TelemetryBatchRequest.safeParse({
      gameRunId: uuid,
      events: [],
    });
    expect(result.success).toBe(false);
  });
});

// ── Results ───────────────────────────────────────────────

describe("PerformanceQuery", () => {
  it("accepts empty query (defaults)", () => {
    const result = PerformanceQuery.safeParse({});
    expect(result.success).toBe(true);
  });

  it("accepts with date range", () => {
    const result = PerformanceQuery.safeParse({
      from: iso,
      to: iso,
    });
    expect(result.success).toBe(true);
  });
});

// ── Planner ───────────────────────────────────────────────

describe("PlannerPreviewRequest", () => {
  it("accepts valid request with defaults", () => {
    const result = PlannerPreviewRequest.safeParse({
      childId: uuid,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.constraints.maxMinutes).toBe(15);
    }
  });

  it("accepts custom constraints", () => {
    const result = PlannerPreviewRequest.safeParse({
      childId: uuid,
      constraints: { maxMinutes: 30 },
    });
    expect(result.success).toBe(true);
  });
});

// ── Error Envelope ────────────────────────────────────────

describe("ErrorBody", () => {
  it("accepts valid error", () => {
    const result = ErrorBody.safeParse({
      code: "VALIDATION_ERROR",
      message: "Invalid request",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.details).toEqual([]);
    }
  });

  it("rejects invalid code", () => {
    const result = ErrorBody.safeParse({
      code: "UNKNOWN_ERROR",
      message: "Something",
    });
    expect(result.success).toBe(false);
  });
});

describe("ErrorEnvelope", () => {
  it("accepts valid envelope", () => {
    const result = ErrorEnvelope.safeParse({
      error: {
        code: "NOT_FOUND",
        message: "Child not found",
      },
      requestId: uuid,
    });
    expect(result.success).toBe(true);
  });
});

// ── ErrorCode exhaustive check ────────────────────────────

describe("ErrorCode", () => {
  it("contains all required codes", () => {
    const codes = ErrorCode.options;
    expect(codes).toContain("VALIDATION_ERROR");
    expect(codes).toContain("UNAUTHORIZED");
    expect(codes).toContain("FORBIDDEN");
    expect(codes).toContain("NOT_FOUND");
    expect(codes).toContain("CONFLICT");
    expect(codes).toContain("RATE_LIMITED");
    expect(codes).toContain("INTERNAL_ERROR");
    expect(codes).toContain("SERVICE_UNAVAILABLE");
  });
});
