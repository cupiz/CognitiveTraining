/**
 * Tangkap Tikus difficulty configuration.
 * Critters pop out of garden holes — tap them fast! Higher levels pop
 * shorter, add more holes, and mix in prickly decoys you must NOT tap.
 *
 * Difficulty dimensions:
 * - popMs: how long a critter stays visible
 * - holeCount: garden holes (3 → 6)
 * - decoyRate: share of pops that are prickly decoys (tap = wrong)
 * - gapMs: breather between pops
 */

export interface TapCritterConfig {
  /** How long a critter stays out of its hole (ms) */
  popMs: number;
  /** Number of garden holes */
  holeCount: number;
  /** Share of pops that are decoys (0–1) */
  decoyRate: number;
  /** Breather between pops (ms) */
  gapMs: number;
}

const DIFFICULTY_TABLE: TapCritterConfig[] = [
  /* D1  */ { popMs: 1500, holeCount: 3, decoyRate: 0, gapMs: 700 },
  /* D2  */ { popMs: 1300, holeCount: 3, decoyRate: 0, gapMs: 600 },
  /* D3  */ { popMs: 1100, holeCount: 4, decoyRate: 0, gapMs: 550 },
  /* D4  */ { popMs: 1100, holeCount: 4, decoyRate: 0.15, gapMs: 500 },
  /* D5  */ { popMs: 950, holeCount: 4, decoyRate: 0.2, gapMs: 480 },
  /* D6  */ { popMs: 850, holeCount: 5, decoyRate: 0.2, gapMs: 450 },
  /* D7  */ { popMs: 750, holeCount: 5, decoyRate: 0.25, gapMs: 420 },
  /* D8  */ { popMs: 650, holeCount: 5, decoyRate: 0.3, gapMs: 400 },
  /* D9  */ { popMs: 600, holeCount: 6, decoyRate: 0.3, gapMs: 380 },
  /* D10 */ { popMs: 520, holeCount: 6, decoyRate: 0.35, gapMs: 350 },
];

export function getDifficultyConfig(difficulty: number): TapCritterConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

export function validateConfig(config: TapCritterConfig): void {
  if (config.popMs < 350) {
    throw new Error("popMs must be at least 350ms");
  }
  if (config.holeCount < 2 || config.holeCount > 6) {
    throw new Error("holeCount must be between 2 and 6");
  }
  if (config.decoyRate < 0 || config.decoyRate > 0.6) {
    throw new Error("decoyRate must be between 0 and 0.6");
  }
  if (config.gapMs < 150) {
    throw new Error("gapMs must be at least 150ms");
  }
}
