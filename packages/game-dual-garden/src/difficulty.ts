/**
 * Kebun Dua Arus difficulty configuration.
 * Two simultaneous streams (animals crossing above, fruits falling below).
 *
 * Difficulty dimensions:
 * - windowMs: how long each round's pair is visible
 * - requireBoth: when false only the fruit rule is active (single stream)
 * - animalPoolSize / fruitPoolSize: bigger pools = harder discrimination
 */

export interface DualGardenConfig {
  /** How long each round (animal + fruit pair) is visible (ms) */
  windowMs: number;
  /** When true the animal rule is active — tap only on a double match */
  requireBoth: boolean;
  /** Size of the animal pool */
  animalPoolSize: number;
  /** Size of the fruit pool */
  fruitPoolSize: number;
}

const DIFFICULTY_TABLE: DualGardenConfig[] = [
  /* D1  */ { windowMs: 3200, requireBoth: false, animalPoolSize: 3, fruitPoolSize: 3 },
  /* D2  */ { windowMs: 2800, requireBoth: false, animalPoolSize: 3, fruitPoolSize: 4 },
  /* D3  */ { windowMs: 2600, requireBoth: false, animalPoolSize: 4, fruitPoolSize: 4 },
  /* D4  */ { windowMs: 3000, requireBoth: true, animalPoolSize: 3, fruitPoolSize: 3 },
  /* D5  */ { windowMs: 2600, requireBoth: true, animalPoolSize: 3, fruitPoolSize: 4 },
  /* D6  */ { windowMs: 2400, requireBoth: true, animalPoolSize: 4, fruitPoolSize: 4 },
  /* D7  */ { windowMs: 2200, requireBoth: true, animalPoolSize: 4, fruitPoolSize: 5 },
  /* D8  */ { windowMs: 2000, requireBoth: true, animalPoolSize: 5, fruitPoolSize: 5 },
  /* D9  */ { windowMs: 1800, requireBoth: true, animalPoolSize: 5, fruitPoolSize: 6 },
  /* D10 */ { windowMs: 1600, requireBoth: true, animalPoolSize: 6, fruitPoolSize: 6 },
];

export function getDifficultyConfig(difficulty: number): DualGardenConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

export function validateConfig(config: DualGardenConfig): void {
  if (config.windowMs < 1000) {
    throw new Error("windowMs must be at least 1000ms");
  }
  if (config.animalPoolSize < 2 || config.animalPoolSize > 8) {
    throw new Error("animalPoolSize must be between 2 and 8");
  }
  if (config.fruitPoolSize < 2 || config.fruitPoolSize > 8) {
    throw new Error("fruitPoolSize must be between 2 and 8");
  }
}
