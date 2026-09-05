/**
 * Binocular difficulty configuration.
 * A peripheral target flashes briefly while a small central task runs; the
 * child then points at where it flashed (8 slots around the ring).
 *
 * Difficulty dimensions:
 * - flashMs: how long the peripheral target is visible (shorter = harder)
 * - centralMs: duration of the fixation phase (central mini-task)
 * - centralIntervalMs: how fast central symbols stream by
 * - centralTask: when true the child must also tap the central target
 */

export interface WideViewConfig {
  /** How long the peripheral target flashes (ms) */
  flashMs: number;
  /** How long the fixation phase lasts before the probe (ms) */
  centralMs: number;
  /** Interval between central symbols (ms) */
  centralIntervalMs: number;
  /** When true, the child must tap the central target symbol too */
  centralTask: boolean;
}

const DIFFICULTY_TABLE: WideViewConfig[] = [
  /* D1  */ { flashMs: 500, centralMs: 2400, centralIntervalMs: 800, centralTask: false },
  /* D2  */ { flashMs: 420, centralMs: 2400, centralIntervalMs: 800, centralTask: false },
  /* D3  */ { flashMs: 350, centralMs: 2600, centralIntervalMs: 700, centralTask: false },
  /* D4  */ { flashMs: 300, centralMs: 2800, centralIntervalMs: 700, centralTask: true },
  /* D5  */ { flashMs: 260, centralMs: 3000, centralIntervalMs: 650, centralTask: true },
  /* D6  */ { flashMs: 220, centralMs: 3000, centralIntervalMs: 600, centralTask: true },
  /* D7  */ { flashMs: 190, centralMs: 3200, centralIntervalMs: 550, centralTask: true },
  /* D8  */ { flashMs: 160, centralMs: 3400, centralIntervalMs: 500, centralTask: true },
  /* D9  */ { flashMs: 140, centralMs: 3600, centralIntervalMs: 450, centralTask: true },
  /* D10 */ { flashMs: 120, centralMs: 3800, centralIntervalMs: 400, centralTask: true },
];

export function getDifficultyConfig(difficulty: number): WideViewConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

export function validateConfig(config: WideViewConfig): void {
  if (config.flashMs < 80) {
    throw new Error("flashMs must be at least 80ms");
  }
  if (config.centralMs < 1500) {
    throw new Error("centralMs must be at least 1500ms");
  }
  if (config.centralIntervalMs < 250) {
    throw new Error("centralIntervalMs must be at least 250ms");
  }
  if (config.flashMs > config.centralMs) {
    throw new Error("flashMs must fit inside the fixation phase");
  }
}
