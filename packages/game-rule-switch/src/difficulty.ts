/**
 * Rule Switch difficulty configuration.
 * Maps abstract difficulty level (1–10) to concrete game parameters.
 *
 * Multiple dimensions change simultaneously:
 * - number of rules increases (more to track)
 * - switch probability increases (more frequent switches)
 * - response deadline decreases (faster responses needed)
 * - number of stimuli options decreases (harder discrimination)
 *
 * @see docs/06_GAME_DESIGN.md — Game 5: Rule Switch
 */

export interface RuleDefinition {
  /** Rule name */
  name: string;
  /** Attribute to match on */
  attribute: "color" | "shape" | "size";
  /** Instruction shown to user */
  instruction: string;
}

export interface RuleSwitchConfig {
  /** Available rules */
  rules: RuleDefinition[];
  /** Probability of rule switch on each trial */
  switchProbability: number;
  /** Number of stimuli options presented */
  stimuliCount: number;
  /** Response deadline (ms) */
  responseDeadlineMs: number;
}

/** Pre-defined rules */
const COLOR_RULE: RuleDefinition = { name: "color", attribute: "color", instruction: "Match by COLOR" };
const SHAPE_RULE: RuleDefinition = { name: "shape", attribute: "shape", instruction: "Match by SHAPE" };
const SIZE_RULE: RuleDefinition = { name: "size", attribute: "size", instruction: "Match by SIZE" };
const FILL_RULE: RuleDefinition = { name: "fill", attribute: "color", instruction: "Match by FILL" };

/** Difficulty presets (D1–D10) */
const DIFFICULTY_TABLE: RuleSwitchConfig[] = [
  /* D1  */ { rules: [COLOR_RULE, SHAPE_RULE], switchProbability: 0.15, stimuliCount: 4, responseDeadlineMs: 5000 },
  /* D2  */ { rules: [COLOR_RULE, SHAPE_RULE], switchProbability: 0.2,  stimuliCount: 4, responseDeadlineMs: 4800 },
  /* D3  */ { rules: [COLOR_RULE, SHAPE_RULE, SIZE_RULE], switchProbability: 0.25, stimuliCount: 4, responseDeadlineMs: 4500 },
  /* D4  */ { rules: [COLOR_RULE, SHAPE_RULE, SIZE_RULE], switchProbability: 0.3,  stimuliCount: 3, responseDeadlineMs: 4200 },
  /* D5  */ { rules: [COLOR_RULE, SHAPE_RULE, SIZE_RULE], switchProbability: 0.35, stimuliCount: 3, responseDeadlineMs: 4000 },
  /* D6  */ { rules: [COLOR_RULE, SHAPE_RULE, SIZE_RULE, FILL_RULE], switchProbability: 0.4,  stimuliCount: 3, responseDeadlineMs: 3800 },
  /* D7  */ { rules: [COLOR_RULE, SHAPE_RULE, SIZE_RULE, FILL_RULE], switchProbability: 0.45, stimuliCount: 3, responseDeadlineMs: 3500 },
  /* D8  */ { rules: [COLOR_RULE, SHAPE_RULE, SIZE_RULE, FILL_RULE], switchProbability: 0.5,  stimuliCount: 3, responseDeadlineMs: 3200 },
  /* D9  */ { rules: [COLOR_RULE, SHAPE_RULE, SIZE_RULE, FILL_RULE], switchProbability: 0.55, stimuliCount: 3, responseDeadlineMs: 3000 },
  /* D10 */ { rules: [COLOR_RULE, SHAPE_RULE, SIZE_RULE, FILL_RULE], switchProbability: 0.6,  stimuliCount: 3, responseDeadlineMs: 2800 },
];

/**
 * Get game config for a difficulty level (1–10).
 * Clamps to valid range.
 */
export function getDifficultyConfig(difficulty: number): RuleSwitchConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

/**
 * Validate that a config is usable.
 */
export function validateConfig(config: RuleSwitchConfig): void {
  if (config.rules.length < 2) {
    throw new Error("At least 2 rules are required");
  }
  if (config.switchProbability < 0.1 || config.switchProbability > 0.9) {
    throw new Error("switchProbability must be between 0.1 and 0.9");
  }
  if (config.stimuliCount < 2) {
    throw new Error("stimuliCount must be at least 2");
  }
  if (config.responseDeadlineMs < 1000) {
    throw new Error("responseDeadlineMs must be at least 1000ms");
  }
}

/** Stimulus attributes */
export interface Stimulus {
  color: string;
  shape: string;
  size: "small" | "medium" | "large";
  fill: "filled" | "outlined";
}

/** Pre-defined stimulus pool */
const STIMULUS_POOL: Stimulus[] = [
  { color: "red",   shape: "circle", size: "small",  fill: "filled" },
  { color: "blue",  shape: "circle", size: "medium", fill: "filled" },
  { color: "green", shape: "circle", size: "large",  fill: "filled" },
  { color: "red",   shape: "square", size: "medium", fill: "filled" },
  { color: "blue",  shape: "square", size: "small",  fill: "filled" },
  { color: "green", shape: "square", size: "large",  fill: "outlined" },
  { color: "red",   shape: "triangle", size: "large", fill: "filled" },
  { color: "blue",  shape: "triangle", size: "medium", fill: "outlined" },
  { color: "green", shape: "triangle", size: "small", fill: "filled" },
  { color: "red",   shape: "diamond",  size: "small",  fill: "outlined" },
  { color: "blue",  shape: "diamond",  size: "large",  fill: "filled" },
  { color: "green", shape: "diamond",  size: "medium", fill: "outlined" },
];

/**
 * Generate a trial's stimuli set.
 * Returns the target stimulus, options, and the matching index.
 * The matching stimulus is the one that shares the rule attribute with the target.
 */
export function generateTrial(
  config: RuleSwitchConfig,
  rule: RuleDefinition,
  rng: () => number,
): { target: Stimulus; options: Stimulus[]; matchIndex: number; ruleInstruction: string } {
  // Pick a target stimulus
  const targetIdx = Math.floor(rng() * STIMULUS_POOL.length);
  const target = STIMULUS_POOL[targetIdx];

  // Get the attribute value to match
  const matchValue = target[rule.attribute];

  // Find all stimuli that match on this attribute
  const matchingStimuli = STIMULUS_POOL.filter((s) => s[rule.attribute] === matchValue);

  // Pick a different matching stimulus as the correct answer (not the target itself)
  const otherMatches = matchingStimuli.filter((s) => s !== target);
  let matchStimulus: Stimulus;
  if (otherMatches.length > 0) {
    matchStimulus = otherMatches[Math.floor(rng() * otherMatches.length)];
  } else {
    // Fallback: use the target itself (edge case)
    matchStimulus = target;
  }

  // Build options: match + distractors (stimuli that DON'T match on the rule attribute)
  const distractors = STIMULUS_POOL.filter(
    (s) => s[rule.attribute] !== matchValue && s !== matchStimulus,
  );

  // Shuffle distractors and pick needed count
  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }

  const distractorCount = config.stimuliCount - 1;
  const selectedDistractors = distractors.slice(0, distractorCount);

  const options = [matchStimulus, ...selectedDistractors];

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const matchIndex = options.indexOf(matchStimulus);

  return { target, options, matchIndex, ruleInstruction: rule.instruction };
}

/**
 * Determine if the rule should switch on this trial.
 */
export function shouldSwitch(config: RuleSwitchConfig, rng: () => number): boolean {
  return rng() < config.switchProbability;
}

/**
 * Get a random rule from the available rules.
 */
export function getRandomRule(config: RuleSwitchConfig, rng: () => number): RuleDefinition {
  const idx = Math.floor(rng() * config.rules.length);
  return config.rules[idx];
}
