/**
 * Core types for the training planner.
 *
 * @see docs/04_API_SPEC.md §Planner
 * @see docs/13_TODO.md §Phase 7
 */

// ── Game Key ─────────────────────────────────────────────

export type GameKey =
  | "memory_matrix"
  | "target_watch"
  | "quick_match"
  | "stop_signal"
  | "rule_switch"
  | "spice_stall"
  | "red_light"
  | "courier_map"
  | "lighthouse_keeper"
  | "sushi_express"
  | "crystal_palace";

// ── Cognitive Domain ─────────────────────────────────────

export type CognitiveDomain =
  | "working_memory"
  | "sustained_attention"
  | "processing_speed"
  | "inhibitory_control"
  | "cognitive_flexibility"
  | "visual_spatial";

// ── Domain Mapping ───────────────────────────────────────

export interface DomainMapping {
  gameKey: GameKey;
  primaryDomain: CognitiveDomain;
  secondaryDomains: CognitiveDomain[];
  weights: Partial<Record<CognitiveDomain, number>>; // 0–1 contribution
}

// ── Adaptive State (from @cog/adaptive) ──────────────────

export interface AbilityState {
  ability: number;
  uncertainty: number;
  difficulty: number;
  attempts: number;
  lastUpdatedAt: string;
  algorithmVersion: string;
}

// ── Domain Performance ───────────────────────────────────

export interface DomainPerformance {
  domain: CognitiveDomain;
  score: number; // 0–100
  confidence: number; // 0–1
  sourceRunCount: number;
}

// ── Game Exposure ────────────────────────────────────────

export interface GameExposure {
  gameKey: GameKey;
  lastPlayedAt: string | null;
  totalPlays: number;
  recentPlays: number; // in last N sessions
}

// ── Planner Input ────────────────────────────────────────

export interface PlannerInput {
  childId: string;
  adaptiveStates: Partial<Record<GameKey, AbilityState | null>>;
  domainPerformances: DomainPerformance[];
  gameExposures: GameExposure[];
  constraints: PlannerConstraints;
}

// ── Planner Constraints ──────────────────────────────────

export interface PlannerConstraints {
  /** Maximum session duration in seconds */
  maxDurationSec?: number;
  /** Maximum number of games in session */
  maxGames?: number;
  /** Minimum number of unique games */
  minUniqueGames?: number;
  /** Exclude specific games */
  excludeGames?: GameKey[];
  /** Force specific games */
  forceGames?: GameKey[];
}

// ── Planner Output ───────────────────────────────────────

export interface PlannerOutput {
  /** Planned game items in order */
  items: PlannerItem[];
  /** Total estimated duration in seconds */
  estimatedDurationSec: number;
  /** Rationale codes */
  rationale: string[];
  /** Planner version */
  plannerVersion: string;
}

// ── Planner Item ─────────────────────────────────────────

export interface PlannerItem {
  /** Game key */
  gameKey: GameKey;
  /** Game version */
  gameVersion: string;
  /** Recommended difficulty (1–10) */
  difficulty: number;
  /** Target domain */
  targetDomain: CognitiveDomain;
  /** Rationale for this item */
  rationale: string[];
}

// ── Scored Game ──────────────────────────────────────────

export interface ScoredGame {
  gameKey: GameKey;
  /** Composite score: weakness + exposure + ability */
  score: number;
  /** Weakness component (higher = more needed) */
  weaknessScore: number;
  /** Exposure component (higher = less recently played) */
  exposureScore: number;
  /** Ability component (higher = better suited) */
  abilityScore: number;
  /** Rationale */
  rationale: string[];
}
