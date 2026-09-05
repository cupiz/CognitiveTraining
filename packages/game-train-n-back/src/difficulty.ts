/**
 * Kereta N-Back difficulty configuration.
 * Maps abstract difficulty level (1–10) to concrete game parameters.
 *
 * Dimensions that change with difficulty:
 * - nLevel: how far back the child must compare (1 → 3)
 * - wagonIntervalMs: how long each wagon stays on screen
 * - fruitCount: size of the fruit pool (more = harder discrimination)
 * - matchRate: approximate share of "match" wagons
 *
 * @see docs/06_GAME_DESIGN.md — Updating / n-back family
 */

export interface TrainNBackConfig {
  /** How many wagons back the child must compare (1–3) */
  nLevel: 1 | 2 | 3;
  /** How long each wagon is visible before the next one (ms) */
  wagonIntervalMs: number;
  /** Size of the fruit pool (more fruit = harder) */
  fruitCount: number;
  /** Approximate share of wagons that are matches (0–1) */
  matchRate: number;
}

const DIFFICULTY_TABLE: TrainNBackConfig[] = [
  /* D1  */ { nLevel: 1, wagonIntervalMs: 3000, fruitCount: 3, matchRate: 0.4 },
  /* D2  */ { nLevel: 1, wagonIntervalMs: 2600, fruitCount: 4, matchRate: 0.4 },
  /* D3  */ { nLevel: 1, wagonIntervalMs: 2200, fruitCount: 4, matchRate: 0.35 },
  /* D4  */ { nLevel: 2, wagonIntervalMs: 3000, fruitCount: 3, matchRate: 0.35 },
  /* D5  */ { nLevel: 2, wagonIntervalMs: 2600, fruitCount: 4, matchRate: 0.35 },
  /* D6  */ { nLevel: 2, wagonIntervalMs: 2200, fruitCount: 4, matchRate: 0.3 },
  /* D7  */ { nLevel: 2, wagonIntervalMs: 1900, fruitCount: 5, matchRate: 0.3 },
  /* D8  */ { nLevel: 3, wagonIntervalMs: 2400, fruitCount: 4, matchRate: 0.3 },
  /* D9  */ { nLevel: 3, wagonIntervalMs: 2000, fruitCount: 5, matchRate: 0.3 },
  /* D10 */ { nLevel: 3, wagonIntervalMs: 1600, fruitCount: 6, matchRate: 0.3 },
];

export function getDifficultyConfig(difficulty: number): TrainNBackConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

export function validateConfig(config: TrainNBackConfig): void {
  if (config.nLevel < 1 || config.nLevel > 3) {
    throw new Error("nLevel must be between 1 and 3");
  }
  if (config.wagonIntervalMs < 800) {
    throw new Error("wagonIntervalMs must be at least 800ms");
  }
  if (config.fruitCount < 2 || config.fruitCount > 8) {
    throw new Error("fruitCount must be between 2 and 8");
  }
  if (config.matchRate < 0.1 || config.matchRate > 0.6) {
    throw new Error("matchRate must be between 0.1 and 0.6");
  }
}
