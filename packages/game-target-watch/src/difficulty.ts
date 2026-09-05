/**
 * Target Watch difficulty configuration.
 * Maps abstract difficulty level (1–10) to concrete game parameters.
 *
 * Multiple dimensions change simultaneously:
 * - number of symbols per trial increases
 * - inter-stimulus interval decreases (faster presentation)
 * - response deadline tightens
 * - target frequency varies (fewer targets at higher difficulty)
 *
 * @see docs/06_GAME_DESIGN.md — Game 2: Target Watch
 */

export interface TargetWatchConfig {
  /** Number of symbols shown per trial (sequence length) */
  symbolsPerTrial: number;
  /** The symbol that is the target (user must tap) */
  targetSymbol: string;
  /** Available non-target symbols */
  distractorSymbols: string[];
  /** Time between stimuli (ms) */
  interStimulusMs: number;
  /** Deadline for each individual response (ms) */
  responseDeadlineMs: number;
  /** Proportion of stimuli that are targets (0-1) */
  targetProportion: number;
}



/** Difficulty presets (D1–D10) */
const DIFFICULTY_TABLE: TargetWatchConfig[] = [
  /* D1  */ { symbolsPerTrial: 8,  targetSymbol: "★", distractorSymbols: ["○", "□", "△"], interStimulusMs: 2500, responseDeadlineMs: 3000, targetProportion: 0.375 },
  /* D2  */ { symbolsPerTrial: 10, targetSymbol: "★", distractorSymbols: ["○", "□", "△"], interStimulusMs: 2200, responseDeadlineMs: 2800, targetProportion: 0.3 },
  /* D3  */ { symbolsPerTrial: 12, targetSymbol: "●", distractorSymbols: ["○", "□", "△", "◇"], interStimulusMs: 2000, responseDeadlineMs: 2500, targetProportion: 0.25 },
  /* D4  */ { symbolsPerTrial: 14, targetSymbol: "●", distractorSymbols: ["○", "□", "△", "◇"], interStimulusMs: 1800, responseDeadlineMs: 2300, targetProportion: 0.21 },
  /* D5  */ { symbolsPerTrial: 16, targetSymbol: "◆", distractorSymbols: ["○", "□", "△", "◇", "☽"], interStimulusMs: 1600, responseDeadlineMs: 2000, targetProportion: 0.19 },
  /* D6  */ { symbolsPerTrial: 18, targetSymbol: "◆", distractorSymbols: ["○", "□", "△", "◇", "☽"], interStimulusMs: 1400, responseDeadlineMs: 1800, targetProportion: 0.17 },
  /* D7  */ { symbolsPerTrial: 20, targetSymbol: "▲", distractorSymbols: ["○", "□", "△", "◇", "☽", "✦"], interStimulusMs: 1200, responseDeadlineMs: 1600, targetProportion: 0.15 },
  /* D8  */ { symbolsPerTrial: 22, targetSymbol: "▲", distractorSymbols: ["○", "□", "△", "◇", "☽", "✦"], interStimulusMs: 1100, responseDeadlineMs: 1400, targetProportion: 0.14 },
  /* D9  */ { symbolsPerTrial: 24, targetSymbol: "■", distractorSymbols: ["○", "□", "△", "◇", "☽", "✦"], interStimulusMs: 1000, responseDeadlineMs: 1200, targetProportion: 0.125 },
  /* D10 */ { symbolsPerTrial: 26, targetSymbol: "■", distractorSymbols: ["○", "□", "△", "◇", "☽", "✦"], interStimulusMs: 900,  responseDeadlineMs: 1000, targetProportion: 0.115 },
];

/**
 * Get game config for a difficulty level (1–10).
 * Clamps to valid range.
 */
export function getDifficultyConfig(difficulty: number): TargetWatchConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

/**
 * Validate that a config is usable.
 */
export function validateConfig(config: TargetWatchConfig): void {
  if (config.symbolsPerTrial < 3) {
    throw new Error("symbolsPerTrial must be at least 3");
  }
  if (config.targetProportion <= 0 || config.targetProportion >= 1) {
    throw new Error("targetProportion must be between 0 and 1 (exclusive)");
  }
  if (config.interStimulusMs < 500) {
    throw new Error("interStimulusMs must be at least 500ms");
  }
  if (config.responseDeadlineMs < 500) {
    throw new Error("responseDeadlineMs must be at least 500ms");
  }
  if (config.distractorSymbols.length === 0) {
    throw new Error("distractorSymbols must not be empty");
  }
}

/**
 * Generate a stimulus sequence for a trial.
 * Returns an array of symbols where some are targets and some are distractors.
 * The sequence is generated deterministically using the provided RNG.
 */
export function generateSequence(
  config: TargetWatchConfig,
  rng: () => number,
): string[] {
  const { symbolsPerTrial, targetSymbol, distractorSymbols, targetProportion } = config;
  const targetCount = Math.max(1, Math.round(symbolsPerTrial * targetProportion));
  const distractorCount = symbolsPerTrial - targetCount;

  // Build pool
  const pool: string[] = [];
  for (let i = 0; i < targetCount; i++) pool.push(targetSymbol);
  for (let i = 0; i < distractorCount; i++) {
    pool.push(distractorSymbols[i % distractorSymbols.length]);
  }

  // Shuffle using Fisher-Yates with provided RNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}
