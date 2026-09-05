/**
 * Menara Kristal difficulty configuration.
 * Tower of Hanoi with a story: move the crystals to the target tower.
 *
 * Difficulty dimensions:
 * - disks: number of crystals (3 → 6)
 * - moveLimit: maximum legal moves before the round fails
 * - deadlineMs: total time budget for the round
 */

export interface CrystalTowerConfig {
  /** Number of crystals in the puzzle (3–6) */
  disks: number;
  /** Maximum legal moves before the round fails */
  moveLimit: number;
  /** Total time budget for the round (ms) */
  deadlineMs: number;
}

const DIFFICULTY_TABLE: CrystalTowerConfig[] = [
  /* D1  */ { disks: 3, moveLimit: 12, deadlineMs: 60_000 },
  /* D2  */ { disks: 3, moveLimit: 9, deadlineMs: 50_000 },
  /* D3  */ { disks: 3, moveLimit: 7, deadlineMs: 45_000 },
  /* D4  */ { disks: 4, moveLimit: 20, deadlineMs: 90_000 },
  /* D5  */ { disks: 4, moveLimit: 16, deadlineMs: 80_000 },
  /* D6  */ { disks: 4, moveLimit: 15, deadlineMs: 75_000 },
  /* D7  */ { disks: 5, moveLimit: 40, deadlineMs: 120_000 },
  /* D8  */ { disks: 5, moveLimit: 33, deadlineMs: 110_000 },
  /* D9  */ { disks: 6, moveLimit: 80, deadlineMs: 180_000 },
  /* D10 */ { disks: 6, moveLimit: 63, deadlineMs: 150_000 },
];

export function getDifficultyConfig(difficulty: number): CrystalTowerConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

export function validateConfig(config: CrystalTowerConfig): void {
  if (config.disks < 3 || config.disks > 6) {
    throw new Error("disks must be between 3 and 6");
  }
  const optimal = Math.pow(2, config.disks) - 1;
  if (config.moveLimit < optimal) {
    throw new Error(`moveLimit must be at least the optimal ${optimal} moves`);
  }
  if (config.deadlineMs < 30_000) {
    throw new Error("deadlineMs must be at least 30000ms");
  }
}
