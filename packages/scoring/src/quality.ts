/**
 * Data quality detection — enhanced quality checks for telemetry data.
 *
 * Provides real-time and batch quality detection:
 * - Invalid RT detection (physiologically impossible)
 * - Visibility interruption detection (tab hidden, app backgrounded)
 * - Duplicate event detection (same trial responded twice)
 * - Device anomaly flags (clock issues, performance)
 * - Session quality summary
 *
 * @see docs/10_TEST_STRATEGY.md §Data quality tests
 */

import type { RawEvent, QualityFlag } from "./scoring.js";

// ── Types ────────────────────────────────────────────────

export interface QualityReport {
  /** Overall quality score (0–1, 1 = perfect) */
  score: number;
  /** Total flags detected */
  flagCount: number;
  /** Flags by category */
  flagsByCategory: Record<string, number>;
  /** Detailed flags */
  flags: QualityFlag[];
  /** Quality level */
  level: "excellent" | "good" | "fair" | "poor";
  /** Recommendations */
  recommendations: string[];
}

export interface SessionQualityCheck {
  /** Session duration in ms */
  durationMs: number;
  /** Total events */
  eventCount: number;
  /** Response events */
  responseCount: number;
  /** Timeout events */
  timeoutCount: number;
  /** Quality flag events */
  qualityFlagCount: number;
  /** Average inter-response interval */
  avgInterResponseMs: number;
  /** Response rate (responses per second) */
  responseRate: number;
  /** Flags detected */
  flags: QualityFlag[];
}

// ── Constants ────────────────────────────────────────────

/** RT bounds (ms) */
const MIN_RT = 100;
const MAX_RT = 30_000;

/** Minimum session duration for valid data (ms) */
const MIN_SESSION_DURATION = 3_000;

/** Maximum acceptable response rate (responses/sec) */
const MAX_RESPONSE_RATE = 5;

/** Minimum acceptable response rate */
const MIN_RESPONSE_RATE = 0.1;

// ── Real-time Quality Check ──────────────────────────────

/**
 * Check a single event for quality issues in real-time.
 * Use during gameplay to detect problems immediately.
 */
export function checkEventQuality(
  event: RawEvent,
  previousEvents: RawEvent[],
): QualityFlag[] {
  const flags: QualityFlag[] = [];
  const payload = event.payload;

  // RT validation
  if (event.eventType === "response") {
    const rt = payload.reactionTimeMs as number | undefined;
    if (rt !== undefined && rt !== null) {
      if (rt < MIN_RT) {
        flags.push({
          code: "IMPOSSIBLE_RT",
          trialId: payload.trialId as string | undefined,
          details: { rt, threshold: MIN_RT, reason: "too_fast", severity: "high" },
        });
      }
      if (rt > MAX_RT) {
        flags.push({
          code: "IMPOSSIBLE_RT",
          trialId: payload.trialId as string | undefined,
          details: { rt, threshold: MAX_RT, reason: "too_slow", severity: "medium" },
        });
      }
    }
  }

  // Duplicate response detection
  if (event.eventType === "response") {
    const trialId = payload.trialId as string | undefined;
    if (trialId) {
      const duplicateCount = previousEvents.filter(
        (e) => e.eventType === "response" && e.payload.trialId === trialId,
      ).length;
      if (duplicateCount > 0) {
        flags.push({
          code: "DUPLICATE_RESPONSE",
          trialId,
          details: { previousCount: duplicateCount, severity: "high" },
        });
      }
    }
  }

  // Clock anomaly detection
  if (previousEvents.length > 0) {
    const lastEvent = previousEvents[previousEvents.length - 1];
    if (event.clientTimeMs < lastEvent.clientTimeMs - 100) {
      flags.push({
        code: "DEVICE_CLOCK_ANOMALY",
        details: {
          sequenceNo: event.sequenceNo,
          previousTime: lastEvent.clientTimeMs,
          currentTime: event.clientTimeMs,
          severity: "medium",
        },
      });
    }
  }

  return flags;
}

// ── Batch Quality Check ──────────────────────────────────

/**
 * Check a batch of events for quality issues.
 * Use after game run finishes for comprehensive analysis.
 */
export function checkBatchQuality(events: RawEvent[]): QualityReport {
  const flags: QualityFlag[] = [];

  // RT validation
  for (const event of events) {
    if (event.eventType === "response") {
      const rt = event.payload.reactionTimeMs as number | undefined;
      if (rt !== undefined && rt !== null) {
        if (rt < MIN_RT) {
          flags.push({
            code: "IMPOSSIBLE_RT",
            trialId: event.payload.trialId as string | undefined,
            details: { rt, threshold: MIN_RT, reason: "too_fast" },
          });
        }
        if (rt > MAX_RT) {
          flags.push({
            code: "IMPOSSIBLE_RT",
            trialId: event.payload.trialId as string | undefined,
            details: { rt, threshold: MAX_RT, reason: "too_slow" },
          });
        }
      }
    }
  }

  // Duplicate detection
  const trialIds = events
    .filter((e) => e.eventType === "response")
    .map((e) => e.payload.trialId)
    .filter(Boolean);
  const trialIdCounts = new Map<string, number>();
  for (const tid of trialIds) {
    trialIdCounts.set(tid as string, (trialIdCounts.get(tid as string) ?? 0) + 1);
  }
  for (const [tid, count] of trialIdCounts) {
    if (count > 1) {
      flags.push({
        code: "DUPLICATE_RESPONSE",
        trialId: tid,
        details: { count },
      });
    }
  }

  // Clock anomalies
  let prevTime = 0;
  for (const event of events) {
    if (event.clientTimeMs < prevTime - 100) {
      flags.push({
        code: "DEVICE_CLOCK_ANOMALY",
        details: {
          sequenceNo: event.sequenceNo,
          previousTime: prevTime,
          currentTime: event.clientTimeMs,
        },
      });
    }
    prevTime = Math.max(prevTime, event.clientTimeMs);
  }

  // Visibility interruption
  if (events.length > 0) {
    const firstTime = events[0].clientTimeMs;
    const lastTime = events[events.length - 1].clientTimeMs;
    const durationMs = lastTime - firstTime;
    if (durationMs < MIN_SESSION_DURATION && events.length < 3) {
      flags.push({
        code: "VISIBILITY_INTERRUPTION",
        details: { durationMs, eventCount: events.length },
      });
    }
  }

  // Pattern analysis: check for suspicious patterns
  const patternFlags = analyzePatterns(events);
  flags.push(...patternFlags);

  // Compute quality score
  const score = computeQualityScore(flags, events.length);
  const level = getQualityLevel(score);
  const recommendations = getRecommendations(flags, level);
  const flagsByCategory = categorizeFlags(flags);

  return {
    score,
    flagCount: flags.length,
    flagsByCategory,
    flags,
    level,
    recommendations,
  };
}

// ── Session Quality Check ────────────────────────────────

/**
 * Check session-level quality metrics.
 */
export function checkSessionQualityDetailed(
  events: RawEvent[],
): SessionQualityCheck {
  const responseEvents = events.filter((e) => e.eventType === "response");
  const timeoutEvents = events.filter((e) => e.eventType === "timeout");
  const qualityFlagEvents = events.filter((e) => e.eventType === "quality_flag");

  // Duration
  const durationMs =
    events.length > 0
      ? events[events.length - 1].clientTimeMs - events[0].clientTimeMs
      : 0;

  // Inter-response intervals
  const responseTimes = responseEvents.map((e) => e.clientTimeMs).sort((a, b) => a - b);
  let avgInterResponseMs = 0;
  if (responseTimes.length > 1) {
    const intervals: number[] = [];
    for (let i = 1; i < responseTimes.length; i++) {
      intervals.push(responseTimes[i] - responseTimes[i - 1]);
    }
    avgInterResponseMs = intervals.reduce((s, v) => s + v, 0) / intervals.length;
  }

  // Response rate
  const responseRate = durationMs > 0 ? (responseEvents.length / durationMs) * 1000 : 0;

  // Quality flags
  const flags: QualityFlag[] = [];

  // Check response rate
  if (responseRate > MAX_RESPONSE_RATE) {
    flags.push({
      code: "SUSPICIOUS_RESPONSE_RATE",
      details: { responseRate, max: MAX_RESPONSE_RATE },
    });
  }
  if (responseRate < MIN_RESPONSE_RATE && responseEvents.length > 0) {
    flags.push({
      code: "LOW_RESPONSE_RATE",
      details: { responseRate, min: MIN_RESPONSE_RATE },
    });
  }

  // Check duration
  if (durationMs < MIN_SESSION_DURATION) {
    flags.push({
      code: "SHORT_SESSION",
      details: { durationMs, minimum: MIN_SESSION_DURATION },
    });
  }

  return {
    durationMs,
    eventCount: events.length,
    responseCount: responseEvents.length,
    timeoutCount: timeoutEvents.length,
    qualityFlagCount: qualityFlagEvents.length,
    avgInterResponseMs,
    responseRate,
    flags,
  };
}

// ── Pattern Analysis ─────────────────────────────────────

function analyzePatterns(events: RawEvent[]): QualityFlag[] {
  const flags: QualityFlag[] = [];
  const responseEvents = events.filter((e) => e.eventType === "response");

  if (responseEvents.length < 5) return flags;

  // Check for alternating correct/incorrect pattern (possible auto-responder)
  const correctness = responseEvents.map((e) => {
    const payload = e.payload;
    if (payload.correct !== undefined) return payload.correct as boolean;
    if (payload.selectedOption !== undefined && payload.correctOption !== undefined) {
      return payload.selectedOption === payload.correctOption;
    }
    return true;
  });

  let alternatingCount = 0;
  for (let i = 1; i < correctness.length; i++) {
    if (correctness[i] !== correctness[i - 1]) {
      alternatingCount++;
    }
  }
  const alternatingRate = alternatingCount / (correctness.length - 1);
  if (alternatingRate > 0.8 && correctness.length >= 10) {
    flags.push({
      code: "SUSPICIOUS_PATTERN",
      details: { pattern: "alternating", rate: alternatingRate },
    });
  }

  // Check for constant RT (possible bot)
  const rts = responseEvents
    .map((e) => e.payload.reactionTimeMs as number)
    .filter((rt) => rt !== undefined && rt !== null);
  if (rts.length >= 5) {
    const rtVariance = variance(rts);
    if (rtVariance < 100) {
      // Very low variance suggests automated responses
      flags.push({
        code: "SUSPICIOUS_PATTERN",
        details: { pattern: "constant_rt", variance: rtVariance },
      });
    }
  }

  return flags;
}

// ── Quality Score ────────────────────────────────────────

function computeQualityScore(flags: QualityFlag[], eventCount: number): number {
  if (eventCount === 0) return 0;

  // Start with perfect score
  let score = 1.0;

  // Deduct for each flag based on severity
  for (const flag of flags) {
    const severity = (flag.details?.severity as string) ?? "medium";
    switch (severity) {
      case "high":
        score -= 0.15;
        break;
      case "medium":
        score -= 0.08;
        break;
      case "low":
        score -= 0.03;
        break;
      default:
        score -= 0.05;
    }
  }

  return Math.max(0, Math.min(1, score));
}

function getQualityLevel(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 0.9) return "excellent";
  if (score >= 0.7) return "good";
  if (score >= 0.5) return "fair";
  return "poor";
}

function getRecommendations(flags: QualityFlag[], level: string): string[] {
  const recommendations: string[] = [];

  if (level === "poor") {
    recommendations.push("Consider excluding this session from analysis");
  }

  const hasRTIssues = flags.some((f) => f.code === "IMPOSSIBLE_RT");
  if (hasRTIssues) {
    recommendations.push("Check device performance and network latency");
  }

  const hasDuplicates = flags.some((f) => f.code === "DUPLICATE_RESPONSE");
  if (hasDuplicates) {
    recommendations.push("Review input handling for accidental double-taps");
  }

  const hasVisibility = flags.some((f) => f.code === "VISIBILITY_INTERRUPTION");
  if (hasVisibility) {
    recommendations.push("Session was too short — possible abandonment");
  }

  const hasPattern = flags.some((f) => f.code === "SUSPICIOUS_PATTERN");
  if (hasPattern) {
    recommendations.push("Suspicious response pattern detected — manual review recommended");
  }

  return recommendations;
}

function categorizeFlags(flags: QualityFlag[]): Record<string, number> {
  const categories: Record<string, number> = {};
  for (const flag of flags) {
    // Categorize by code prefix
    const category = flag.code.split("_")[0].toLowerCase();
    categories[category] = (categories[category] ?? 0) + 1;
  }
  return categories;
}

// ── Helpers ──────────────────────────────────────────────

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  return squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1);
}
