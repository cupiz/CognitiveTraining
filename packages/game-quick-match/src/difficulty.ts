/**
 * Quick Match difficulty configuration.
 * Maps abstract difficulty level (1–10) to concrete game parameters.
 *
 * Multiple dimensions change simultaneously:
 * - number of response options increases
 * - presentation time decreases (faster matching required)
 * - number of distractors increases
 *
 * @see docs/06_GAME_DESIGN.md — Game 3: Quick Match
 */

export interface QuickMatchConfig {
  /** Number of response options presented to the user */
  optionsCount: number;
  /** How long the target stimulus is shown before options appear (ms) */
  presentationTimeMs: number;
  /** Number of distractors (similar but incorrect options) */
  distractorCount: number;
  /** Response deadline after options appear (ms) */
  responseDeadlineMs: number;
}

/** Symbol pools for stimuli */
const SHAPE_SETS: { target: string; options: string[] }[] = [
  { target: "🔴", options: ["🔴", "🔵", "🟢"] },
  { target: "⬛", options: ["⬛", "⬜", "🔷"] },
  { target: "🔺", options: ["🔺", "🔻", "⬛"] },
  { target: "🟡", options: ["🟡", "🟠", "🟤"] },
  { target: "🟣", options: ["🟣", "🔵", "🔴"] },
  { target: "🔷", options: ["🔷", "🔶", "⬛"] },
  { target: "💚", options: ["💚", "💙", "💜"] },
  { target: "🟧", options: ["🟧", "🟨", "🟩"] },
];

/** Difficulty presets (D1–D10) */
const DIFFICULTY_TABLE: QuickMatchConfig[] = [
  /* D1  */ { optionsCount: 2, presentationTimeMs: 3000, distractorCount: 0, responseDeadlineMs: 5000 },
  /* D2  */ { optionsCount: 2, presentationTimeMs: 2500, distractorCount: 1, responseDeadlineMs: 5000 },
  /* D3  */ { optionsCount: 3, presentationTimeMs: 2200, distractorCount: 1, responseDeadlineMs: 4500 },
  /* D4  */ { optionsCount: 3, presentationTimeMs: 2000, distractorCount: 2, responseDeadlineMs: 4500 },
  /* D5  */ { optionsCount: 4, presentationTimeMs: 1800, distractorCount: 2, responseDeadlineMs: 4000 },
  /* D6  */ { optionsCount: 4, presentationTimeMs: 1500, distractorCount: 3, responseDeadlineMs: 4000 },
  /* D7  */ { optionsCount: 5, presentationTimeMs: 1300, distractorCount: 3, responseDeadlineMs: 3500 },
  /* D8  */ { optionsCount: 6, presentationTimeMs: 1100, distractorCount: 4, responseDeadlineMs: 3500 },
  /* D9  */ { optionsCount: 6, presentationTimeMs: 900,  distractorCount: 4, responseDeadlineMs: 3000 },
  /* D10 */ { optionsCount: 8, presentationTimeMs: 700,  distractorCount: 5, responseDeadlineMs: 3000 },
];

/**
 * Get game config for a difficulty level (1–10).
 * Clamps to valid range.
 */
export function getDifficultyConfig(difficulty: number): QuickMatchConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

/**
 * Validate that a config is usable.
 */
export function validateConfig(config: QuickMatchConfig): void {
  if (config.optionsCount < 2) {
    throw new Error("optionsCount must be at least 2");
  }
  if (config.presentationTimeMs < 200) {
    throw new Error("presentationTimeMs must be at least 200ms");
  }
  if (config.responseDeadlineMs < 500) {
    throw new Error("responseDeadlineMs must be at least 500ms");
  }
  if (config.distractorCount >= config.optionsCount) {
    throw new Error("distractorCount must be less than optionsCount");
  }
}

/**
 * Generate a trial's stimuli set.
 * Returns the target and the array of options (including the target).
 * The order of options is shuffled deterministically.
 */
export function generateTrial(
  config: QuickMatchConfig,
  rng: () => number,
): { target: string; options: string[]; targetIndex: number } {
  // Pick a shape set based on RNG
  const setIdx = Math.floor(rng() * SHAPE_SETS.length);
  const shapeSet = SHAPE_SETS[setIdx];

  // Build options: target + distractors
  const availableDistractors = shapeSet.options.filter((s) => s !== shapeSet.target);
  const distractorCount = Math.min(config.distractorCount, availableDistractors.length);
  const selectedDistractors = availableDistractors.slice(0, distractorCount);

  // Fill remaining options if needed
  while (selectedDistractors.length < config.optionsCount - 1) {
    const extraIdx = Math.floor(rng() * SHAPE_SETS.length);
    const extraSet = SHAPE_SETS[extraIdx];
    const extraDistractors = extraSet.options.filter(
      (s) => s !== shapeSet.target && !selectedDistractors.includes(s),
    );
    if (extraDistractors.length > 0) {
      selectedDistractors.push(extraDistractors[0]);
    } else {
      break; // Safety valve
    }
  }

  const options = [shapeSet.target, ...selectedDistractors.slice(0, config.optionsCount - 1)];

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const targetIndex = options.indexOf(shapeSet.target);

  return { target: shapeSet.target, options, targetIndex };
}
