/**
 * Spice Stall difficulty configuration.
 * Maps abstract difficulty level (1–10) to concrete game parameters.
 *
 * Multiple dimensions change simultaneously:
 * - order length increases (memory load)
 * - menu size increases (choice set)
 * - exposure duration decreases (encoding time)
 * - patience decreases (response deadline)
 * - similar pairs increase (interference)
 *
 * @see docs/06_GAME_DESIGN.md — Flagship 1: Spice Stall
 */

export interface Ingredient {
  /** Stable index into the trial menu (0..menuSize-1) */
  id: number;
  /** Display glyph (symbol only — never PII) */
  emoji: string;
  /** Visual family used to build confusable pairs */
  family: string;
}

export interface SpiceStallConfig {
  /** Number of ingredients in the customer's order */
  orderLength: number;
  /** Number of ingredient choices on the stall shelf */
  menuSize: number;
  /** How long the order stays visible (ms) */
  exposureMs: number;
  /** Response window after the curtain drops (ms) */
  patienceMs: number;
  /** Number of visually similar pairs planted in the menu */
  similarPairs: number;
}

/** Ingredient pool grouped by visual family (4 families × 3 items) */
const INGREDIENT_POOL: { emoji: string; family: string }[] = [
  { emoji: "🍅", family: "red" },
  { emoji: "🌶️", family: "red" },
  { emoji: "🍎", family: "red" },
  { emoji: "🌽", family: "yellow" },
  { emoji: "🍋", family: "yellow" },
  { emoji: "🍌", family: "yellow" },
  { emoji: "🥬", family: "green" },
  { emoji: "🥒", family: "green" },
  { emoji: "🥝", family: "green" },
  { emoji: "🧄", family: "earth" },
  { emoji: "🧅", family: "earth" },
  { emoji: "🥔", family: "earth" },
];

/** Difficulty presets (D1–D10) */
const DIFFICULTY_TABLE: SpiceStallConfig[] = [
  /* D1  */ { orderLength: 2, menuSize: 4, exposureMs: 2500, patienceMs: 12000, similarPairs: 0 },
  /* D2  */ { orderLength: 3, menuSize: 4, exposureMs: 2300, patienceMs: 11500, similarPairs: 0 },
  /* D3  */ { orderLength: 3, menuSize: 5, exposureMs: 2100, patienceMs: 11000, similarPairs: 0 },
  /* D4  */ { orderLength: 4, menuSize: 5, exposureMs: 1900, patienceMs: 10000, similarPairs: 1 },
  /* D5  */ { orderLength: 4, menuSize: 6, exposureMs: 1700, patienceMs: 9500, similarPairs: 1 },
  /* D6  */ { orderLength: 5, menuSize: 6, exposureMs: 1500, patienceMs: 9000, similarPairs: 2 },
  /* D7  */ { orderLength: 5, menuSize: 7, exposureMs: 1300, patienceMs: 8500, similarPairs: 2 },
  /* D8  */ { orderLength: 6, menuSize: 7, exposureMs: 1200, patienceMs: 8000, similarPairs: 2 },
  /* D9  */ { orderLength: 6, menuSize: 8, exposureMs: 1000, patienceMs: 7000, similarPairs: 3 },
  /* D10 */ { orderLength: 7, menuSize: 8, exposureMs: 900, patienceMs: 6500, similarPairs: 3 },
];

/**
 * Get game config for a difficulty level (1–10).
 * Clamps to valid range.
 */
export function getDifficultyConfig(difficulty: number): SpiceStallConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

/**
 * Validate that a config is usable.
 */
export function validateConfig(config: SpiceStallConfig): void {
  if (!Number.isInteger(config.orderLength) || config.orderLength < 1 || config.orderLength > 8) {
    throw new Error("orderLength must be an integer between 1 and 8");
  }
  if (!Number.isInteger(config.menuSize) || config.menuSize < 4 || config.menuSize > 8) {
    throw new Error("menuSize must be an integer between 4 and 8");
  }
  if (config.exposureMs < 700 || config.exposureMs > 3000) {
    throw new Error("exposureMs must be between 700 and 3000");
  }
  if (config.patienceMs < 5000 || config.patienceMs > 15000) {
    throw new Error("patienceMs must be between 5000 and 15000");
  }
  if (
    !Number.isInteger(config.similarPairs) ||
    config.similarPairs < 0 ||
    config.similarPairs > 3 ||
    config.similarPairs >= config.menuSize
  ) {
    throw new Error("similarPairs must be an integer between 0 and 3 and less than menuSize");
  }
}

/**
 * Build a deterministic trial menu: `menuSize` ingredients including at
 * least `similarPairs` same-family pairs. Consumes `rng` deterministically.
 */
export function generateMenu(config: SpiceStallConfig, rng: () => number): Ingredient[] {
  validateConfig(config);
  const used = new Set<number>();
  const picked: { emoji: string; family: string }[] = [];

  const families = ["red", "yellow", "green", "earth"];
  // Deterministic shuffle of families.
  for (let i = families.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [families[i], families[j]] = [families[j], families[i]];
  }

  // Plant confusable pairs first.
  let pairsPlanted = 0;
  for (const family of families) {
    if (pairsPlanted >= config.similarPairs) break;
    const candidates = INGREDIENT_POOL.map((ing, idx) => ({ ...ing, idx })).filter(
      (ing) => ing.family === family && !used.has(ing.idx),
    );
    if (candidates.length >= 2) {
      used.add(candidates[0].idx);
      used.add(candidates[1].idx);
      picked.push(candidates[0], candidates[1]);
      pairsPlanted++;
    }
  }

  // Fill the rest with any unused ingredients.
  const rest = INGREDIENT_POOL.map((ing, idx) => ({ ...ing, idx })).filter(
    (ing) => !used.has(ing.idx),
  );
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  for (const ing of rest) {
    if (picked.length >= config.menuSize) break;
    picked.push(ing);
  }

  // Shuffle final menu so pairs are not adjacent by construction.
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  return picked.slice(0, config.menuSize).map((ing, id) => ({
    id,
    emoji: ing.emoji,
    family: ing.family,
  }));
}

/**
 * Generate a customer order: `orderLength` menu indices.
 * Repeats are allowed (the same ingredient can appear twice).
 */
export function generateOrder(config: SpiceStallConfig, rng: () => number): number[] {
  validateConfig(config);
  const order: number[] = [];
  for (let i = 0; i < config.orderLength; i++) {
    order.push(Math.floor(rng() * config.menuSize));
  }
  return order;
}
