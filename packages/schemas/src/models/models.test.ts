import { describe, it, expect } from "vitest";
import {
  Account,
  AccountPublic,
  ChildProfile,
  ConsentRecord,
  Assessment,
  AssessmentBlock,
  TrainingSession,
  GameRun,
  RawEvent,
  TaskMetric,
  DomainPerformance,
  AdaptiveState,
  Report,
} from "./index.js";

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const iso = "2026-08-31T10:00:00+00:00";

// ── Account ───────────────────────────────────────────────

describe("Account", () => {
  it("accepts valid account", () => {
    const result = Account.safeParse({
      id: uuid,
      email: "parent@example.com",
      passwordHash: "hashed_pw",
      role: "parent",
      locale: "en",
      createdAt: iso,
      updatedAt: iso,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = Account.safeParse({
      id: uuid,
      email: "not-an-email",
      passwordHash: "hashed_pw",
      role: "parent",
      locale: "en",
      createdAt: iso,
      updatedAt: iso,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid role", () => {
    const result = Account.safeParse({
      id: uuid,
      email: "a@b.com",
      passwordHash: "h",
      role: "superadmin",
      locale: "en",
      createdAt: iso,
      updatedAt: iso,
    });
    expect(result.success).toBe(false);
  });
});

describe("AccountPublic", () => {
  it("strips passwordHash and authProviderId", () => {
    const result = AccountPublic.safeParse({
      id: uuid,
      email: "a@b.com",
      passwordHash: "h",
      authProviderId: "p1",
      role: "parent",
      locale: "en",
      createdAt: iso,
      updatedAt: iso,
    });
    expect(result.success).toBe(true);
  });
});

// ── ChildProfile ──────────────────────────────────────────

describe("ChildProfile", () => {
  it("accepts valid child profile", () => {
    const result = ChildProfile.safeParse({
      id: uuid,
      accountId: uuid,
      displayName: "Alex",
      birthMonth: 5,
      birthYear: 2016,
      locale: "en",
      accessibilityJson: {},
      status: "active",
      createdAt: iso,
      updatedAt: iso,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty displayName", () => {
    const result = ChildProfile.safeParse({
      id: uuid,
      accountId: uuid,
      displayName: "",
      birthMonth: 5,
      birthYear: 2016,
      locale: "en",
      accessibilityJson: {},
      status: "active",
      createdAt: iso,
      updatedAt: iso,
    });
    expect(result.success).toBe(false);
  });

  it("rejects birthMonth out of range", () => {
    const result = ChildProfile.safeParse({
      id: uuid,
      accountId: uuid,
      displayName: "Alex",
      birthMonth: 13,
      birthYear: 2016,
      locale: "en",
      accessibilityJson: {},
      status: "active",
      createdAt: iso,
      updatedAt: iso,
    });
    expect(result.success).toBe(false);
  });

  it("rejects birthYear out of range", () => {
    const result = ChildProfile.safeParse({
      id: uuid,
      accountId: uuid,
      displayName: "Alex",
      birthMonth: 5,
      birthYear: 1999,
      locale: "en",
      accessibilityJson: {},
      status: "active",
      createdAt: iso,
      updatedAt: iso,
    });
    expect(result.success).toBe(false);
  });
});

// ── ConsentRecord ─────────────────────────────────────────

describe("ConsentRecord", () => {
  it("accepts valid consent with null revokedAt", () => {
    const result = ConsentRecord.safeParse({
      id: uuid,
      childId: uuid,
      consentType: "training",
      documentVersion: "2026-01",
      grantedAt: iso,
      revokedAt: null,
      source: "parent_portal",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid consentType", () => {
    const result = ConsentRecord.safeParse({
      id: uuid,
      childId: uuid,
      consentType: "unknown",
      documentVersion: "2026-01",
      grantedAt: iso,
      revokedAt: null,
      source: "parent_portal",
    });
    expect(result.success).toBe(false);
  });
});

// ── Assessment ────────────────────────────────────────────

describe("Assessment", () => {
  it("accepts valid assessment", () => {
    const result = Assessment.safeParse({
      id: uuid,
      childId: uuid,
      assessmentVersion: "mvp-1",
      startedAt: iso,
      completedAt: null,
      status: "in_progress",
      deviceContextJson: { browser: "Chrome" },
    });
    expect(result.success).toBe(true);
  });
});

describe("AssessmentBlock", () => {
  it("accepts valid block", () => {
    const result = AssessmentBlock.safeParse({
      id: uuid,
      assessmentId: uuid,
      domain: "working_memory",
      gameKey: "memory_matrix",
      gameVersion: "1.0.0",
      taskVersion: "1.0.0",
      orderIndex: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid domain", () => {
    const result = AssessmentBlock.safeParse({
      id: uuid,
      assessmentId: uuid,
      domain: "invalid_domain",
      gameKey: "memory_matrix",
      gameVersion: "1.0.0",
      taskVersion: "1.0.0",
      orderIndex: 0,
    });
    expect(result.success).toBe(false);
  });
});

// ── TrainingSession ───────────────────────────────────────

describe("TrainingSession", () => {
  it("accepts valid session", () => {
    const result = TrainingSession.safeParse({
      id: uuid,
      childId: uuid,
      plannerVersion: "planner-0.1",
      startedAt: iso,
      completedAt: null,
      status: "in_progress",
      targetDurationSec: 900,
    });
    expect(result.success).toBe(true);
  });
});

// ── GameRun ───────────────────────────────────────────────

describe("GameRun", () => {
  it("accepts valid game run", () => {
    const result = GameRun.safeParse({
      id: uuid,
      sessionId: uuid,
      gameKey: "memory_matrix",
      gameVersion: "1.0.0",
      configurationJson: { difficulty: 4 },
      startedAt: iso,
      endedAt: null,
      status: "in_progress",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid gameKey", () => {
    const result = GameRun.safeParse({
      id: uuid,
      sessionId: uuid,
      gameKey: "nonexistent_game",
      gameVersion: "1.0.0",
      configurationJson: {},
      startedAt: iso,
      endedAt: null,
      status: "in_progress",
    });
    expect(result.success).toBe(false);
  });
});

// ── RawEvent ──────────────────────────────────────────────

describe("RawEvent", () => {
  it("accepts valid event", () => {
    const result = RawEvent.safeParse({
      id: uuid,
      gameRunId: uuid,
      sequenceNo: 1,
      eventType: "trial_started",
      clientTimeMs: 12000,
      payloadJson: { trialId: "t1" },
      receivedAt: iso,
      idempotencyKey: uuid,
    });
    expect(result.success).toBe(true);
  });

  it("rejects sequenceNo < 1", () => {
    const result = RawEvent.safeParse({
      id: uuid,
      gameRunId: uuid,
      sequenceNo: 0,
      eventType: "trial_started",
      clientTimeMs: 12000,
      payloadJson: {},
      receivedAt: iso,
      idempotencyKey: uuid,
    });
    expect(result.success).toBe(false);
  });
});

// ── TaskMetric ────────────────────────────────────────────

describe("TaskMetric", () => {
  it("accepts valid metric", () => {
    const result = TaskMetric.safeParse({
      id: uuid,
      gameRunId: uuid,
      metricVersion: "score-0.1",
      accuracy: 0.85,
      medianRtMs: 650,
      meanRtMs: 700,
      rtVariability: 120,
      omissionErrors: 2,
      commissionErrors: 1,
      difficulty: 4,
      validTrialCount: 20,
      qualityFlagsJson: {},
      createdAt: iso,
    });
    expect(result.success).toBe(true);
  });

  it("rejects accuracy > 1", () => {
    const result = TaskMetric.safeParse({
      id: uuid,
      gameRunId: uuid,
      metricVersion: "score-0.1",
      accuracy: 1.5,
      medianRtMs: 650,
      meanRtMs: 700,
      rtVariability: 120,
      omissionErrors: 0,
      commissionErrors: 0,
      difficulty: 4,
      validTrialCount: 20,
      qualityFlagsJson: {},
      createdAt: iso,
    });
    expect(result.success).toBe(false);
  });
});

// ── DomainPerformance ─────────────────────────────────────

describe("DomainPerformance", () => {
  it("accepts valid performance", () => {
    const result = DomainPerformance.safeParse({
      id: uuid,
      childId: uuid,
      domain: "sustained_attention",
      score: 74,
      confidence: 0.71,
      windowStart: iso,
      windowEnd: iso,
      algorithmVersion: "score-0.1",
      sourceRunCount: 5,
      createdAt: iso,
    });
    expect(result.success).toBe(true);
  });

  it("rejects score > 100", () => {
    const result = DomainPerformance.safeParse({
      id: uuid,
      childId: uuid,
      domain: "working_memory",
      score: 101,
      confidence: 0.7,
      windowStart: iso,
      windowEnd: iso,
      algorithmVersion: "score-0.1",
      sourceRunCount: 5,
      createdAt: iso,
    });
    expect(result.success).toBe(false);
  });
});

// ── AdaptiveState ─────────────────────────────────────────

describe("AdaptiveState", () => {
  it("accepts valid state", () => {
    const result = AdaptiveState.safeParse({
      id: uuid,
      childId: uuid,
      gameKey: "target_watch",
      abilityEstimate: 5.5,
      uncertainty: 1.2,
      currentDifficulty: 5,
      algorithmVersion: "adaptive-0.1",
      updatedAt: iso,
    });
    expect(result.success).toBe(true);
  });

  it("rejects abilityEstimate > 10", () => {
    const result = AdaptiveState.safeParse({
      id: uuid,
      childId: uuid,
      gameKey: "target_watch",
      abilityEstimate: 11,
      uncertainty: 1,
      currentDifficulty: 5,
      algorithmVersion: "adaptive-0.1",
      updatedAt: iso,
    });
    expect(result.success).toBe(false);
  });

  it("rejects currentDifficulty out of bounds", () => {
    const result = AdaptiveState.safeParse({
      id: uuid,
      childId: uuid,
      gameKey: "target_watch",
      abilityEstimate: 5,
      uncertainty: 1,
      currentDifficulty: 11,
      algorithmVersion: "adaptive-0.1",
      updatedAt: iso,
    });
    expect(result.success).toBe(false);
  });
});

// ── Report ────────────────────────────────────────────────

describe("Report", () => {
  it("accepts valid report", () => {
    const result = Report.safeParse({
      id: uuid,
      childId: uuid,
      periodStart: iso,
      periodEnd: iso,
      reportVersion: "report-1.0",
      summaryJson: { sessions: 12 },
      status: "ready",
      createdAt: iso,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = Report.safeParse({
      id: uuid,
      childId: uuid,
      periodStart: iso,
      periodEnd: iso,
      reportVersion: "report-1.0",
      summaryJson: {},
      status: "unknown",
      createdAt: iso,
    });
    expect(result.success).toBe(false);
  });
});
