/**
 * Stop Signal difficulty configuration.
 * Maps abstract difficulty level (1–10) to concrete game parameters.
 *
 * Multiple dimensions change simultaneously:
 * - stop-signal delay decreases (harder to inhibit)
 * - go stimulus duration decreases (faster responses needed)
 * - proportion of stop trials increases
 *
 * @see docs/06_GAME_DESIGN.md — Game 4: Stop Signal
 */

export interface StopSignalConfig {
  /** Proportion of trials that are stop trials (0-1) */
  stopTrialProportion: number;
  /** Initial stop-signal delay in ms (adapts during play) */
  initialStopSignalDelayMs: number;
  /** How much SSD changes on each adaptation step (ms) */
  ssdStepMs: number;
  /** Minimum SSD (ms) */
  minSsdMs: number;
  /** Maximum SSD (ms) */
  maxSsdMs: number;
  /** How long the go stimulus is shown (ms) */
  goStimulusDurationMs: number;
  /** Response deadline for go trials (ms) */
  goDeadlineMs: number;
}

/** Difficulty presets (D1–D10) */
const DIFFICULTY_TABLE: StopSignalConfig[] = [
  /* D1  */ { stopTrialProportion: 0.2,  initialStopSignalDelayMs: 500, ssdStepMs: 50, minSsdMs: 200, maxSsdMs: 800, goStimulusDurationMs: 2500, goDeadlineMs: 3000 },
  /* D2  */ { stopTrialProportion: 0.22, initialStopSignalDelayMs: 480, ssdStepMs: 50, minSsdMs: 180, maxSsdMs: 800, goStimulusDurationMs: 2300, goDeadlineMs: 3000 },
  /* D3  */ { stopTrialProportion: 0.25, initialStopSignalDelayMs: 450, ssdStepMs: 45, minSsdMs: 160, maxSsdMs: 800, goStimulusDurationMs: 2100, goDeadlineMs: 2800 },
  /* D4  */ { stopTrialProportion: 0.27, initialStopSignalDelayMs: 420, ssdStepMs: 45, minSsdMs: 140, maxSsdMs: 800, goStimulusDurationMs: 1900, goDeadlineMs: 2600 },
  /* D5  */ { stopTrialProportion: 0.3,  initialStopSignalDelayMs: 400, ssdStepMs: 40, minSsdMs: 120, maxSsdMs: 800, goStimulusDurationMs: 1700, goDeadlineMs: 2500 },
  /* D6  */ { stopTrialProportion: 0.32, initialStopSignalDelayMs: 380, ssdStepMs: 40, minSsdMs: 100, maxSsdMs: 800, goStimulusDurationMs: 1500, goDeadlineMs: 2300 },
  /* D7  */ { stopTrialProportion: 0.35, initialStopSignalDelayMs: 350, ssdStepMs: 35, minSsdMs: 100, maxSsdMs: 800, goStimulusDurationMs: 1300, goDeadlineMs: 2100 },
  /* D8  */ { stopTrialProportion: 0.37, initialStopSignalDelayMs: 320, ssdStepMs: 35, minSsdMs: 100, maxSsdMs: 800, goStimulusDurationMs: 1100, goDeadlineMs: 1900 },
  /* D9  */ { stopTrialProportion: 0.4,  initialStopSignalDelayMs: 300, ssdStepMs: 30, minSsdMs: 100, maxSsdMs: 800, goStimulusDurationMs: 900,  goDeadlineMs: 1700 },
  /* D10 */ { stopTrialProportion: 0.42, initialStopSignalDelayMs: 280, ssdStepMs: 25, minSsdMs: 100, maxSsdMs: 800, goStimulusDurationMs: 800,  goDeadlineMs: 1500 },
];

/**
 * Get game config for a difficulty level (1–10).
 * Clamps to valid range.
 */
export function getDifficultyConfig(difficulty: number): StopSignalConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

/**
 * Validate that a config is usable.
 */
export function validateConfig(config: StopSignalConfig): void {
  if (config.stopTrialProportion <= 0 || config.stopTrialProportion >= 1) {
    throw new Error("stopTrialProportion must be between 0 and 1 (exclusive)");
  }
  if (config.initialStopSignalDelayMs < 100) {
    throw new Error("initialStopSignalDelayMs must be at least 100ms");
  }
  if (config.goStimulusDurationMs < 500) {
    throw new Error("goStimulusDurationMs must be at least 500ms");
  }
  if (config.minSsdMs >= config.maxSsdMs) {
    throw new Error("minSsdMs must be less than maxSsdMs");
  }
}

/**
 * Determine if a trial should be a stop trial.
 * Uses the RNG to decide based on stopTrialProportion.
 */
export function isStopTrial(config: StopSignalConfig, rng: () => number): boolean {
  return rng() < config.stopTrialProportion;
}

/**
 * Calculate the stop-signal delay for a trial.
 * The SSD varies based on the current adaptive level.
 */
export function calculateSsd(config: StopSignalConfig, currentSsd: number): number {
  return Math.max(config.minSsdMs, Math.min(config.maxSsdMs, currentSsd));
}

/**
 * Adapt SSD based on performance.
 * If user successfully stopped → decrease SSD (harder next time)
 * If user failed to stop → increase SSD (easier next time)
 */
export function adaptSsd(
  config: StopSignalConfig,
  currentSsd: number,
  stoppedSuccessfully: boolean,
): number {
  if (stoppedSuccessfully) {
    return Math.max(config.minSsdMs, currentSsd - config.ssdStepMs);
  } else {
    return Math.min(config.maxSsdMs, currentSsd + config.ssdStepMs);
  }
}
