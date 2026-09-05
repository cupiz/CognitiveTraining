/**
 * Crystal Palace difficulty configuration.
 * Maps abstract difficulty level (1–10) to concrete parameters.
 *
 * Mechanic: a royal courtyard full of crystal towers; the child finds every
 * tower matching the target crystal (colour + cut) before the audience gets
 * bored. More cells, more matches and sneakier near-miss distractors = harder.
 *
 * @see docs/06_GAME_DESIGN.md — Flagship 6: Crystal Palace
 */

export interface CrystalPalaceConfig {
  gridRows: number;
  gridCols: number;
  /** Number of crystals matching the target (2..8) */
  matchCount: number;
  /** 0..3 — how many near-miss distractors share colour or cut */
  similarLevel: number;
  /** Search deadline (ms) */
  deadlineMs: number;
}

/** Difficulty presets (D1–D10) */
const DIFFICULTY_TABLE: CrystalPalaceConfig[] = [
  /* D1  */ { gridRows: 3, gridCols: 3, matchCount: 2, similarLevel: 0, deadlineMs: 20000 },
  /* D2  */ { gridRows: 3, gridCols: 4, matchCount: 3, similarLevel: 0, deadlineMs: 19000 },
  /* D3  */ { gridRows: 4, gridCols: 4, matchCount: 3, similarLevel: 1, deadlineMs: 18000 },
  /* D4  */ { gridRows: 4, gridCols: 5, matchCount: 4, similarLevel: 1, deadlineMs: 17000 },
  /* D5  */ { gridRows: 5, gridCols: 5, matchCount: 4, similarLevel: 2, deadlineMs: 16000 },
  /* D6  */ { gridRows: 5, gridCols: 6, matchCount: 5, similarLevel: 2, deadlineMs: 15000 },
  /* D7  */ { gridRows: 6, gridCols: 6, matchCount: 5, similarLevel: 3, deadlineMs: 14000 },
  /* D8  */ { gridRows: 6, gridCols: 7, matchCount: 6, similarLevel: 3, deadlineMs: 13000 },
  /* D9  */ { gridRows: 7, gridCols: 7, matchCount: 6, similarLevel: 3, deadlineMs: 12000 },
  /* D10 */ { gridRows: 7, gridCols: 8, matchCount: 7, similarLevel: 3, deadlineMs: 11000 },
];

export interface CrystalCell {
  /** Stable index into the grid (row * cols + col) */
  id: number;
  /** Crystal colour index (0..3) */
  color: number;
  /** Crystal cut index (0..3) */
  shape: number;
  /** Whether this cell matches the target crystal */
  isMatch: boolean;
}

export interface CrystalPalaceGrid {
  cells: CrystalCell[];
  targetColor: number;
  targetShape: number;
}

/**
 * Get game config for a difficulty level (1–10).
 * Clamps to valid range.
 */
export function getDifficultyConfig(difficulty: number): CrystalPalaceConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

/**
 * Validate that a config is usable.
 */
export function validateConfig(config: CrystalPalaceConfig): void {
  if (!Number.isInteger(config.gridRows) || config.gridRows < 2 || config.gridRows > 8) {
    throw new Error("gridRows must be an integer between 2 and 8");
  }
  if (!Number.isInteger(config.gridCols) || config.gridCols < 2 || config.gridCols > 8) {
    throw new Error("gridCols must be an integer between 2 and 8");
  }
  if (!Number.isInteger(config.matchCount) || config.matchCount < 2 || config.matchCount > 8) {
    throw new Error("matchCount must be an integer between 2 and 8");
  }
  const cells = config.gridRows * config.gridCols;
  if (cells < config.matchCount + 4) {
    throw new Error("grid must have room for matches plus distractors (cells >= matchCount + 4)");
  }
  if (!Number.isInteger(config.similarLevel) || config.similarLevel < 0 || config.similarLevel > 3) {
    throw new Error("similarLevel must be an integer between 0 and 3");
  }
  if (config.deadlineMs < 8000 || config.deadlineMs > 25000) {
    throw new Error("deadlineMs must be between 8000 and 25000");
  }
}

/**
 * Build a deterministic courtyard: `matchCount` exact matches, then
 * `similarLevel * 2` near-miss distractors (share colour OR cut), then
 * unrelated crystals. Unrelated crystals never accidentally match the target.
 */
export function generateGrid(
  config: CrystalPalaceConfig,
  rng: () => number,
): CrystalPalaceGrid {
  validateConfig(config);

  const cells = config.gridRows * config.gridCols;
  const targetColor = Math.floor(rng() * 4);
  const targetShape = Math.floor(rng() * 4);

  const cellIds = Array.from({ length: cells }, (_, i) => i);
  for (let i = cellIds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cellIds[i], cellIds[j]] = [cellIds[j], cellIds[i]];
  }

  const result: CrystalCell[] = Array.from({ length: cells }, (_, id) => ({
    id,
    color: 0,
    shape: 0,
    isMatch: false,
  }));

  // Exact matches first.
  let cursor = 0;
  for (let i = 0; i < config.matchCount; i++) {
    const id = cellIds[cursor++];
    result[id] = { id, color: targetColor, shape: targetShape, isMatch: true };
  }

  // Near-miss distractors: share colour or cut, never both.
  const nearMissCount = config.similarLevel * 2;
  for (let i = 0; i < nearMissCount && cursor < cellIds.length; i++) {
    const id = cellIds[cursor++];
    const shareColor = rng() < 0.5;
    result[id] = {
      id,
      color: shareColor ? targetColor : (targetColor + 1 + Math.floor(rng() * 3)) % 4,
      shape: shareColor ? (targetShape + 1 + Math.floor(rng() * 3)) % 4 : targetShape,
      isMatch: false,
    };
  }

  // Unrelated crystals — never the exact (color, shape) combo.
  for (; cursor < cellIds.length; cursor++) {
    const id = cellIds[cursor];
    let color = Math.floor(rng() * 4);
    let shape = Math.floor(rng() * 4);
    if (color === targetColor && shape === targetShape) {
      shape = (shape + 1) % 4;
    }
    result[id] = { id, color, shape, isMatch: false };
  }

  return { cells: result, targetColor, targetShape };
}