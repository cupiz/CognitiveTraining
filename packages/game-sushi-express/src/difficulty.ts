/**
 * Sushi Express difficulty configuration.
 * Maps abstract difficulty level (1–10) to concrete parameters.
 *
 * Mechanic: sushi plates ride a conveyor belt past the chef's serve zone.
 * The child taps matching plates before they slide past; tapping the wrong
 * sushi costs a commission. Faster belt + more types + tighter spacing =
 * harder.
 *
 * @see docs/06_GAME_DESIGN.md — Flagship 5: Sushi Express
 */

export interface SushiExpressConfig {
  /** Number of plates on the belt per trial */
  platesPerTrial: number;
  /** Number of sushi types on the menu (2..5) */
  sushiTypes: number;
  /** Probability a given plate is the target sushi */
  targetProbability: number;
  /** Time for one plate to travel the full belt (ms) */
  beltMs: number;
  /** Time between plate spawns (ms) */
  spawnIntervalMs: number;
}

/** Difficulty presets (D1–D10) */
const DIFFICULTY_TABLE: SushiExpressConfig[] = [
  /* D1  */ { platesPerTrial: 6, sushiTypes: 2, targetProbability: 0.5, beltMs: 4000, spawnIntervalMs: 1600 },
  /* D2  */ { platesPerTrial: 6, sushiTypes: 2, targetProbability: 0.45, beltMs: 3600, spawnIntervalMs: 1450 },
  /* D3  */ { platesPerTrial: 7, sushiTypes: 3, targetProbability: 0.4, beltMs: 3300, spawnIntervalMs: 1300 },
  /* D4  */ { platesPerTrial: 7, sushiTypes: 3, targetProbability: 0.35, beltMs: 3000, spawnIntervalMs: 1200 },
  /* D5  */ { platesPerTrial: 8, sushiTypes: 3, targetProbability: 0.33, beltMs: 2800, spawnIntervalMs: 1100 },
  /* D6  */ { platesPerTrial: 8, sushiTypes: 4, targetProbability: 0.3, beltMs: 2600, spawnIntervalMs: 1000 },
  /* D7  */ { platesPerTrial: 9, sushiTypes: 4, targetProbability: 0.28, beltMs: 2400, spawnIntervalMs: 950 },
  /* D8  */ { platesPerTrial: 9, sushiTypes: 4, targetProbability: 0.25, beltMs: 2200, spawnIntervalMs: 900 },
  /* D9  */ { platesPerTrial: 10, sushiTypes: 5, targetProbability: 0.22, beltMs: 2000, spawnIntervalMs: 850 },
  /* D10 */ { platesPerTrial: 10, sushiTypes: 5, targetProbability: 0.2, beltMs: 1900, spawnIntervalMs: 800 },
];

/** Serve zone on the belt (x fractions, 0 = spawn side, 1 = chef side) */
export const SERVE_ZONE_LEFT = 0.72;
export const SERVE_ZONE_RIGHT = 0.92;

export interface SushiPlate {
  /** Position in the belt queue (0-based) */
  id: number;
  /** Sushi type index (0..sushiTypes-1) */
  sushi: number;
  /** Whether this plate matches the customer's order */
  isTarget: boolean;
}

/**
 * Get game config for a difficulty level (1–10).
 * Clamps to valid range.
 */
export function getDifficultyConfig(difficulty: number): SushiExpressConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

/**
 * Validate that a config is usable.
 */
export function validateConfig(config: SushiExpressConfig): void {
  if (!Number.isInteger(config.platesPerTrial) || config.platesPerTrial < 4 || config.platesPerTrial > 12) {
    throw new Error("platesPerTrial must be an integer between 4 and 12");
  }
  if (!Number.isInteger(config.sushiTypes) || config.sushiTypes < 2 || config.sushiTypes > 5) {
    throw new Error("sushiTypes must be an integer between 2 and 5");
  }
  if (config.targetProbability < 0.15 || config.targetProbability > 0.6) {
    throw new Error("targetProbability must be between 0.15 and 0.6");
  }
  if (config.beltMs < 1500 || config.beltMs > 5000) {
    throw new Error("beltMs must be between 1500 and 5000");
  }
  if (config.spawnIntervalMs < 600 || config.spawnIntervalMs > 2500) {
    throw new Error("spawnIntervalMs must be between 600 and 2500");
  }
}

/**
 * Generate a deterministic belt run: `platesPerTrial` plates plus the
 * customer's target sushi type. Guarantees at least one target and at
 * least one distractor so every trial is meaningful.
 */
export function generateBelt(
  config: SushiExpressConfig,
  rng: () => number,
): { targetSushi: number; plates: SushiPlate[] } {
  validateConfig(config);

  const targetSushi = Math.floor(rng() * config.sushiTypes);
  const plates: SushiPlate[] = [];
  let targetCount = 0;
  for (let id = 0; id < config.platesPerTrial; id++) {
    const isTarget = rng() < config.targetProbability;
    const sushi = isTarget
      ? targetSushi
      : (targetSushi + 1 + Math.floor(rng() * (config.sushiTypes - 1))) % config.sushiTypes;
    plates.push({ id, sushi, isTarget });
    if (isTarget) targetCount++;
  }

  // Guarantee a mixed run.
  if (targetCount === 0) {
    plates[0] = { id: 0, sushi: targetSushi, isTarget: true };
  } else if (targetCount === config.platesPerTrial) {
    const other = (targetSushi + 1) % config.sushiTypes;
    plates[0] = { id: 0, sushi: other, isTarget: false };
  }

  return { targetSushi, plates };
}