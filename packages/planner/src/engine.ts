/**
 * Training planner engine — generates personalized training sessions.
 *
 * Orchestrates:
 * 1. Domain mapping (games → cognitive domains)
 * 2. Weakness weighting (prioritize weak domains)
 * 3. Recent exposure penalty (avoid repetition)
 * 4. Session constraints (duration, diversity)
 * 5. Rationale codes (transparency)
 *
 * @see docs/04_API_SPEC.md §Planner
 * @see docs/13_TODO.md §Phase 7
 */

import type {
  PlannerConstraints,
  PlannerInput,
  PlannerItem,
  PlannerOutput,
  GameKey,
} from "./types.js";
import { scoreGames } from "./scoring.js";
import { getPrimaryDomain } from "./domain-mapping.js";

// ── Constants ────────────────────────────────────────────

/** Planner version */
export const PLANNER_VERSION = "planner-v0.1-mvp";

/** Default session duration (15 minutes) */
const DEFAULT_DURATION_SEC = 15 * 60;

/** Estimated game duration (2–3 minutes per game) */
const ESTIMATED_GAME_DURATION_SEC = 2.5 * 60;

/** Minimum games per session */
const MIN_GAMES = 3;

/** Maximum games per session */
const MAX_GAMES = 6;

// ── Main Function ────────────────────────────────────────

/**
 * Generate a training plan for a child.
 *
 * @param input - Child's adaptive states, domain performances, and constraints
 * @returns Planned items with rationale
 */
export function generatePlan(input: PlannerInput): PlannerOutput {
  const {
    adaptiveStates,
    domainPerformances,
    gameExposures,
    constraints,
  } = input;

  const rationale: string[] = [];

  // Apply constraints
  const maxDuration = constraints.maxDurationSec ?? DEFAULT_DURATION_SEC;
  const maxGames = constraints.maxGames ?? Math.floor(maxDuration / ESTIMATED_GAME_DURATION_SEC);
  const minUniqueGames = constraints.minUniqueGames ?? MIN_GAMES;
  const excludeGames = new Set(constraints.excludeGames ?? []);
  const forceGames = constraints.forceGames ?? [];

  // Score all eligible games
  const scoredGames = scoreGames(
    domainPerformances,
    gameExposures,
    adaptiveStates,
  );

  // Filter excluded games
  const eligibleGames = scoredGames.filter((g) => !excludeGames.has(g.gameKey));

  if (eligibleGames.length === 0) {
    return {
      items: [],
      estimatedDurationSec: 0,
      rationale: ["no_eligible_games"],
      plannerVersion: PLANNER_VERSION,
    };
  }

  // Select games
  const selectedGames: PlannerItem[] = [];
  let totalDuration = 0;
  const selectedGameKeys = new Set<GameKey>();
  const selectedDomains = new Set<string>();

  // First: add forced games
  for (const gameKey of forceGames) {
    if (excludeGames.has(gameKey)) continue;
    if (selectedGameKeys.has(gameKey)) continue;

    const item = createPlannerItem(gameKey, adaptiveStates[gameKey] ?? null, ["forced_game"]);
    if (totalDuration + ESTIMATED_GAME_DURATION_SEC <= maxDuration) {
      selectedGames.push(item);
      selectedGameKeys.add(gameKey);
      selectedDomains.add(getPrimaryDomain(gameKey) ?? "");
      totalDuration += ESTIMATED_GAME_DURATION_SEC;
    }
  }

  // Then: add scored games until we hit constraints
  for (const scored of eligibleGames) {
    if (selectedGames.length >= maxGames) break;
    if (selectedGameKeys.has(scored.gameKey)) continue;
    if (totalDuration + ESTIMATED_GAME_DURATION_SEC > maxDuration) break;

    const item = createPlannerItem(
      scored.gameKey,
      adaptiveStates[scored.gameKey] ?? null,
      scored.rationale,
    );

    selectedGames.push(item);
    selectedGameKeys.add(scored.gameKey);
    selectedDomains.add(getPrimaryDomain(scored.gameKey) ?? "");
    totalDuration += ESTIMATED_GAME_DURATION_SEC;
  }

  // Ensure minimum unique games if possible
  if (selectedGames.length < minUniqueGames && eligibleGames.length >= minUniqueGames) {
    rationale.push("insufficient_games_added_minimum");
  }

  // Build rationale
  if (selectedGames.length === 0) {
    rationale.push("no_games_selected");
  } else {
    rationale.push(`${selectedGames.length}_games_selected`);

    // Check domain diversity
    if (selectedDomains.size < selectedGames.length) {
      rationale.push("domain_overlap_detected");
    } else {
      rationale.push("good_domain_diversity");
    }

    // Check if weakness was prioritized
    const hasWeakness = selectedGames.some((g) =>
      g.rationale.includes("weakness_priority"),
    );
    if (hasWeakness) {
      rationale.push("weakness_prioritized");
    }
  }

  return {
    items: selectedGames,
    estimatedDurationSec: totalDuration,
    rationale,
    plannerVersion: PLANNER_VERSION,
  };
}

// ── Helper Functions ─────────────────────────────────────

/**
 * Released game version per family. Flagship families start at 0.1.0;
 * classic families are at 1.0.0. Never reuse a classic key/version for a
 * flagship reskin — history must stay reproducible.
 */
const GAME_VERSIONS: Record<GameKey, string> = {
  memory_matrix: "1.0.0",
  target_watch: "1.0.0",
  quick_match: "1.0.0",
  stop_signal: "1.0.0",
  rule_switch: "1.0.0",
  spice_stall: "0.1.0",
  red_light: "0.1.0",
  courier_map: "0.1.0",
  lighthouse_keeper: "0.1.0",
  sushi_express: "0.1.0",
  crystal_palace: "0.1.0",
};

/**
 * Create a planner item from a game key.
 */
function createPlannerItem(
  gameKey: GameKey,
  adaptiveState: { difficulty: number } | null,
  rationale: string[],
): PlannerItem {
  const primaryDomain = getPrimaryDomain(gameKey) ?? "working_memory";

  return {
    gameKey,
    gameVersion: GAME_VERSIONS[gameKey] ?? "1.0.0",
    difficulty: adaptiveState?.difficulty ?? 5,
    targetDomain: primaryDomain,
    rationale,
  };
}

/**
 * Get default constraints.
 */
export function getDefaultConstraints(): PlannerConstraints {
  return {
    maxDurationSec: DEFAULT_DURATION_SEC,
    maxGames: MAX_GAMES,
    minUniqueGames: MIN_GAMES,
    excludeGames: [],
    forceGames: [],
  };
}
