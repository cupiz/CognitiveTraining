/**
 * Memory Matrix difficulty configuration.
 * Maps abstract difficulty level (1–10) to concrete game parameters.
 *
 * Multiple dimensions change simultaneously:
 * - grid size increases
 * - target count increases
 * - exposure duration decreases
 *
 * @see docs/06_GAME_DESIGN.md — Difficulty example
 */

export interface Cell {
  row: number;
  col: number;
}

export interface MemoryMatrixConfig {
  gridRows: number;
  gridCols: number;
  targetCount: number;
  exposureMs: number;
  responseDeadlineMs: number;
}

/** Difficulty presets (D1–D10) */
const DIFFICULTY_TABLE: MemoryMatrixConfig[] = [
  /* D1  */ { gridRows: 3, gridCols: 3, targetCount: 2, exposureMs: 2000, responseDeadlineMs: 5000 },
  /* D2  */ { gridRows: 3, gridCols: 3, targetCount: 3, exposureMs: 1800, responseDeadlineMs: 5000 },
  /* D3  */ { gridRows: 4, gridCols: 4, targetCount: 4, exposureMs: 1600, responseDeadlineMs: 5000 },
  /* D4  */ { gridRows: 4, gridCols: 4, targetCount: 5, exposureMs: 1400, responseDeadlineMs: 4500 },
  /* D5  */ { gridRows: 5, gridCols: 5, targetCount: 6, exposureMs: 1300, responseDeadlineMs: 4500 },
  /* D6  */ { gridRows: 5, gridCols: 5, targetCount: 7, exposureMs: 1200, responseDeadlineMs: 4000 },
  /* D7  */ { gridRows: 6, gridCols: 6, targetCount: 8, exposureMs: 1100, responseDeadlineMs: 4000 },
  /* D8  */ { gridRows: 6, gridCols: 6, targetCount: 9, exposureMs: 1000, responseDeadlineMs: 3500 },
  /* D9  */ { gridRows: 7, gridCols: 7, targetCount: 10, exposureMs: 900, responseDeadlineMs: 3500 },
  /* D10 */ { gridRows: 8, gridCols: 8, targetCount: 12, exposureMs: 800, responseDeadlineMs: 3000 },
];

/**
 * Get game config for a difficulty level (1–10).
 * Clamps to valid range.
 */
export function getDifficultyConfig(difficulty: number): MemoryMatrixConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

/**
 * Validate that a config is usable.
 * Ensures targetCount <= total cells.
 */
export function validateConfig(config: MemoryMatrixConfig): void {
  const totalCells = config.gridRows * config.gridCols;
  if (config.targetCount > totalCells) {
    throw new Error(
      `targetCount (${config.targetCount}) exceeds grid size (${config.gridRows}×${config.gridCols} = ${totalCells})`,
    );
  }
  if (config.targetCount < 1) {
    throw new Error("targetCount must be at least 1");
  }
}
