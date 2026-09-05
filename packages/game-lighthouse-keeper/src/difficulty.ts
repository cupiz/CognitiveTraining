/**
 * Lighthouse Keeper difficulty configuration.
 * Maps abstract difficulty level (1–10) to concrete parameters.
 *
 * Mechanic: the lighthouse beam flashes a colour sequence; the keeper
 * repeats it on the four lantern panes. Longer sequences + faster flashes
 * + tighter patience = harder.
 *
 * @see docs/06_GAME_DESIGN.md — Flagship 4: Lighthouse Keeper
 */

export interface LighthouseKeeperConfig {
  /** Number of flashes in the sequence */
  seqLength: number;
  /** Duration of a single flash (ms) */
  flashMs: number;
  /** Response window after the sequence finishes (ms) */
  patienceMs: number;
}

/** Difficulty presets (D1–D10) */
const DIFFICULTY_TABLE: LighthouseKeeperConfig[] = [
  /* D1  */ { seqLength: 2, flashMs: 1000, patienceMs: 15000 },
  /* D2  */ { seqLength: 2, flashMs: 950, patienceMs: 14500 },
  /* D3  */ { seqLength: 3, flashMs: 900, patienceMs: 14000 },
  /* D4  */ { seqLength: 3, flashMs: 850, patienceMs: 13000 },
  /* D5  */ { seqLength: 4, flashMs: 800, patienceMs: 12500 },
  /* D6  */ { seqLength: 4, flashMs: 750, patienceMs: 11500 },
  /* D7  */ { seqLength: 5, flashMs: 700, patienceMs: 10500 },
  /* D8  */ { seqLength: 5, flashMs: 650, patienceMs: 9500 },
  /* D9  */ { seqLength: 6, flashMs: 600, patienceMs: 9000 },
  /* D10 */ { seqLength: 7, flashMs: 500, patienceMs: 8000 },
];

/**
 * Get game config for a difficulty level (1–10).
 * Clamps to valid range.
 */
export function getDifficultyConfig(difficulty: number): LighthouseKeeperConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

/**
 * Validate that a config is usable.
 */
export function validateConfig(config: LighthouseKeeperConfig): void {
  if (!Number.isInteger(config.seqLength) || config.seqLength < 2 || config.seqLength > 8) {
    throw new Error("seqLength must be an integer between 2 and 8");
  }
  if (config.flashMs < 400 || config.flashMs > 1500) {
    throw new Error("flashMs must be between 400 and 1500");
  }
  if (config.patienceMs < 6000 || config.patienceMs > 20000) {
    throw new Error("patienceMs must be between 6000 and 20000");
  }
}

/**
 * Generate a deterministic flash sequence: pane indices 0..3 with no
 * immediate repeat (a double-flash of the same pane would be ambiguous).
 */
export function generateSequence(config: LighthouseKeeperConfig, rng: () => number): number[] {
  validateConfig(config);
  const sequence: number[] = [];
  let last = -1;
  for (let i = 0; i < config.seqLength; i++) {
    let pane = Math.floor(rng() * 4);
    if (pane === last) pane = (pane + 1 + Math.floor(rng() * 3)) % 4;
    sequence.push(pane);
    last = pane;
  }
  return sequence;
}