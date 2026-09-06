/**
 * Kartu Kembar difficulty configuration.
 * Classic concentration: flip two cards, keep the pair when they match.
 *
 * Difficulty dimensions:
 * - pairCount: number of pairs on the board (4 → 10 cards total = pairCount × 2)
 * - previewMs: how long all cards show face-up before the first flip
 * - mismatchFlipBackMs: how long a mismatched pair stays visible
 */

export interface PairCardsConfig {
  /** Number of pairs on the board */
  pairCount: number;
  /** Initial face-up preview for memorizing (ms; 0 = no preview) */
  previewMs: number;
  /** How long a mismatched pair stays open before flipping back (ms) */
  mismatchFlipBackMs: number;
}

const DIFFICULTY_TABLE: PairCardsConfig[] = [
  /* D1  */ { pairCount: 4, previewMs: 2500, mismatchFlipBackMs: 1100 },
  /* D2  */ { pairCount: 4, previewMs: 1800, mismatchFlipBackMs: 1000 },
  /* D3  */ { pairCount: 5, previewMs: 1800, mismatchFlipBackMs: 1000 },
  /* D4  */ { pairCount: 5, previewMs: 1200, mismatchFlipBackMs: 950 },
  /* D5  */ { pairCount: 6, previewMs: 1200, mismatchFlipBackMs: 900 },
  /* D6  */ { pairCount: 6, previewMs: 800, mismatchFlipBackMs: 900 },
  /* D7  */ { pairCount: 7, previewMs: 800, mismatchFlipBackMs: 850 },
  /* D8  */ { pairCount: 8, previewMs: 600, mismatchFlipBackMs: 850 },
  /* D9  */ { pairCount: 9, previewMs: 500, mismatchFlipBackMs: 800 },
  /* D10 */ { pairCount: 10, previewMs: 400, mismatchFlipBackMs: 750 },
];

export function getDifficultyConfig(difficulty: number): PairCardsConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

export function validateConfig(config: PairCardsConfig): void {
  if (config.pairCount < 2 || config.pairCount > 10) {
    throw new Error("pairCount must be between 2 and 10");
  }
  if (config.previewMs < 0 || config.previewMs > 5000) {
    throw new Error("previewMs must be between 0 and 5000");
  }
  if (config.mismatchFlipBackMs < 400) {
    throw new Error("mismatchFlipBackMs must be at least 400ms");
  }
}
