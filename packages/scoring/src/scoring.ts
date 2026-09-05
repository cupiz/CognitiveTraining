/**
 * Scoring engine — computes TaskMetrics from raw telemetry events.
 *
 * This is a pure function library: no DB access, no side effects.
 * The API layer calls these functions after a game run finishes.
 */

// ── Types ─────────────────────────────────────────────────

export interface RawEvent {
  sequenceNo: number;
  eventType: string;
  clientTimeMs: number;
  payload: Record<string, unknown>;
}

export interface ComputedMetrics {
  accuracy: number; // 0..1
  medianRtMs: number;
  meanRtMs: number;
  rtVariability: number; // standard deviation
  omissionErrors: number;
  commissionErrors: number;
  validTrialCount: number;
  qualityFlags: QualityFlag[];
}

export interface QualityFlag {
  code: string;
  trialId?: string;
  details?: Record<string, unknown>;
}

// ── RT bounds (ms) ────────────────────────────────────────

const MIN_VALID_RT = 100; // faster than 100ms is physiologically impossible
const MAX_VALID_RT = 30_000; // slower than 30s is likely a lapse/inattention

// ── Main scoring function ─────────────────────────────────

/**
 * Compute task metrics from a list of raw telemetry events.
 * Events must be sorted by sequenceNo ascending.
 */
export function computeMetrics(events: RawEvent[], _difficulty: number): ComputedMetrics {
  const responseEvents = events.filter((e) => e.eventType === "response");
  const timeoutEvents = events.filter((e) => e.eventType === "timeout");
  const qualityFlagEvents = events.filter((e) => e.eventType === "quality_flag");

  const responseRts: number[] = [];
  const allRts: number[] = [];
  let correctCount = 0;
  let omissionErrors = 0;
  let commissionErrors = 0;
  const qualityFlags: QualityFlag[] = [];

  // Collect existing quality flags from events
  for (const qf of qualityFlagEvents) {
    qualityFlags.push({
      code: String(qf.payload.code ?? "UNKNOWN"),
      trialId: qf.payload.trialId as string | undefined,
    });
  }

  // Process response events
  for (const event of responseEvents) {
    const payload = event.payload;
    const trialId = payload.trialId as string | undefined;
    const rt = payload.reactionTimeMs as number | undefined;

    if (rt !== undefined && rt !== null) {
      allRts.push(rt);

      // Check for impossible RT
      if (rt < MIN_VALID_RT) {
        qualityFlags.push({
          code: "IMPOSSIBLE_RT",
          trialId,
          details: { rt, threshold: MIN_VALID_RT, reason: "too_fast" },
        });
      } else if (rt > MAX_VALID_RT) {
        qualityFlags.push({
          code: "IMPOSSIBLE_RT",
          trialId,
          details: { rt, threshold: MAX_VALID_RT, reason: "too_slow" },
        });
      } else {
        responseRts.push(rt);
      }
    }

    // Determine correctness
    if (payload.correct !== undefined) {
      if (payload.correct) {
        correctCount++;
      } else {
        commissionErrors++;
      }
    } else if (payload.responded !== undefined && payload.targetPresent !== undefined) {
      // Go/Stop game style
      if (payload.responded && payload.targetPresent) {
        correctCount++;
      } else if (payload.responded && !payload.targetPresent) {
        commissionErrors++;
      } else if (!payload.responded && payload.targetPresent) {
        omissionErrors++;
      } else {
        // Correct rejection (no response to non-target)
        correctCount++;
      }
    } else if (payload.stopped !== undefined) {
      // Stop signal specific
      if (payload.stopped) {
        correctCount++;
      } else {
        commissionErrors++;
      }
    } else if (payload.selectedOption !== undefined && payload.correctOption !== undefined) {
      // Quick Match / Rule Switch style
      if (payload.selectedOption === payload.correctOption) {
        correctCount++;
      } else {
        commissionErrors++;
      }
    }
  }

  // Process timeout events (omission errors)
  omissionErrors += timeoutEvents.length;

  // Compute totals
  const validTrialCount = responseEvents.length + timeoutEvents.length;
  const accuracy = validTrialCount > 0 ? correctCount / validTrialCount : 0;

  // Compute RT statistics (only from valid RTs)
  const sortedRts = [...responseRts].sort((a, b) => a - b);
  const medianRtMs = sortedRts.length > 0 ? percentile(sortedRts, 0.5) : 0;
  const meanRtMs = sortedRts.length > 0 ? sortedRts.reduce((s, r) => s + r, 0) / sortedRts.length : 0;
  const rtVariability = sortedRts.length > 1 ? standardDeviation(sortedRts) : 0;

  // Detect duplicate responses (same trial ID appearing twice)
  const trialIds = responseEvents.map((e) => e.payload.trialId).filter(Boolean);
  const seenTrialIds = new Set<string>();
  for (const tid of trialIds) {
    if (seenTrialIds.has(tid as string)) {
      qualityFlags.push({
        code: "DUPLICATE_RESPONSE",
        trialId: tid as string,
      });
    }
    seenTrialIds.add(tid as string);
  }

  return {
    accuracy: clamp(accuracy, 0, 1),
    medianRtMs,
    meanRtMs,
    rtVariability,
    omissionErrors,
    commissionErrors,
    validTrialCount,
    qualityFlags,
  };
}

// ── Quality flag checker (for real-time validation) ───────

export interface QualityCheckResult {
  valid: boolean;
  flags: QualityFlag[];
}

/**
 * Check a single response event for quality issues.
 * Used in real-time during gameplay.
 */
export function checkResponseQuality(
  eventType: string,
  payload: Record<string, unknown>,
  previousResponses: Map<string, number>, // trialId → count
): QualityCheckResult {
  const flags: QualityFlag[] = [];
  const trialId = payload.trialId as string | undefined;

  if (eventType === "response") {
    const rt = payload.reactionTimeMs as number | undefined;

    if (rt !== undefined && rt !== null) {
      if (rt < MIN_VALID_RT) {
        flags.push({
          code: "TOO_FAST_RESPONSE",
          trialId,
          details: { rt, threshold: MIN_VALID_RT },
        });
      }
      if (rt > MAX_VALID_RT) {
        flags.push({
          code: "TOO_SLOW_RESPONSE",
          trialId,
          details: { rt, threshold: MAX_VALID_RT },
        });
      }
    }

    // Check for duplicate response
    if (trialId) {
      const count = previousResponses.get(trialId) ?? 0;
      if (count > 0) {
        flags.push({
          code: "DUPLICATE_RESPONSE",
          trialId,
        });
      }
    }
  }

  return {
    valid: flags.length === 0,
    flags,
  };
}

/**
 * Check session-level quality flags (visibility, device clock).
 */
export function checkSessionQuality(
  events: RawEvent[],
): QualityFlag[] {
  const flags: QualityFlag[] = [];

  // Check for clock anomalies (non-monotonic timestamps)
  let prevTime = 0;
  for (const event of events) {
    if (event.clientTimeMs < prevTime - 100) {
      // Allow 100ms tolerance for reordering
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

  // Check for very short game runs (possible abandonment)
  if (events.length > 0) {
    const firstTime = events[0].clientTimeMs;
    const lastTime = events[events.length - 1].clientTimeMs;
    const durationMs = lastTime - firstTime;
    if (durationMs < 5_000 && events.length < 3) {
      flags.push({
        code: "VISIBILITY_INTERRUPTION",
        details: { durationMs, eventCount: events.length },
      });
    }
  }

  return flags;
}

// ── Helpers ───────────────────────────────────────────────

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const squaredDiffs = values.map((v) => (v - mean) ** 2);
  const variance = squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
