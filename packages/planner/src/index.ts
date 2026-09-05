// ── Engine ───────────────────────────────────────────────
export { generatePlan, getDefaultConstraints, PLANNER_VERSION } from "./engine.js";

// ── Domain Mapping ───────────────────────────────────────
export {
  getDomainMapping,
  getPrimaryDomain,
  getGamesForDomain,
  getDomainWeight,
  getAllDomains,
  getAllGameKeys,
} from "./domain-mapping.js";

// ── Scoring ──────────────────────────────────────────────
export { scoreGames } from "./scoring.js";

// ── Types ────────────────────────────────────────────────
export type {
  GameKey,
  CognitiveDomain,
  DomainMapping,
  AbilityState,
  DomainPerformance,
  GameExposure,
  PlannerInput,
  PlannerConstraints,
  PlannerOutput,
  PlannerItem,
  ScoredGame,
} from "./types.js";
