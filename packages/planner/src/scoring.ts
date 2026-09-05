/**
 * Game scoring — computes composite scores for game selection.
 *
 * Combines:
 * 1. Weakness weighting: prioritize domains with lower performance
 * 2. Recent exposure penalty: avoid recently played games
 * 3. Ability matching: select appropriate difficulty level
 *
 * @see docs/13_TODO.md §Phase 7
 */

import type {
  AbilityState,
  CognitiveDomain,
  DomainPerformance,
  GameExposure,
  GameKey,
  ScoredGame,
} from "./types.js";
import { getDomainMapping, getAllGameKeys } from "./domain-mapping.js";

// ── Constants ────────────────────────────────────────────

/** Weight for weakness component */
const WEIGHT_WEAKNESS = 0.5;

/** Weight for exposure component */
const WEIGHT_EXPOSURE = 0.3;

/** Weight for ability component */
const WEIGHT_ABILITY = 0.2;

/** Penalty for games played in last N sessions */
const RECENT_SESSION_PENALTY = 0.4;



/** Minimum confidence threshold for domain performance */
const MIN_CONFIDENCE = 0.3;

// ── Main Functions ───────────────────────────────────────

/**
 * Score all games for a child based on their performance profile.
 *
 * @param domainPerformances - Domain performance records
 * @param gameExposures - Game exposure history
 * @param adaptiveStates - Current adaptive states per game
 * @returns Scored games sorted by composite score (highest first)
 */
export function scoreGames(
  domainPerformances: DomainPerformance[],
  gameExposures: GameExposure[],
  adaptiveStates: Partial<Record<GameKey, AbilityState | null>>,
): ScoredGame[] {
  const allGames = getAllGameKeys();
  const performanceMap = new Map<CognitiveDomain, DomainPerformance>();
  for (const dp of domainPerformances) {
    performanceMap.set(dp.domain, dp);
  }

  const exposureMap = new Map<GameKey, GameExposure>();
  for (const ge of gameExposures) {
    exposureMap.set(ge.gameKey, ge);
  }

  const scoredGames: ScoredGame[] = [];

  for (const gameKey of allGames) {
    const mapping = getDomainMapping(gameKey);
    if (!mapping) continue;

    const exposure = exposureMap.get(gameKey) ?? {
      gameKey,
      lastPlayedAt: null,
      totalPlays: 0,
      recentPlays: 0,
    };

    const adaptiveState = adaptiveStates[gameKey] ?? null;

    // Compute component scores
    const weaknessScore = computeWeaknessScore(
      mapping.primaryDomain,
      mapping.secondaryDomains,
      mapping.weights,
      performanceMap,
    );

    const exposureScore = computeExposureScore(exposure);

    const abilityScore = computeAbilityScore(adaptiveState);

    // Composite score
    const compositeScore =
      WEIGHT_WEAKNESS * weaknessScore +
      WEIGHT_EXPOSURE * exposureScore +
      WEIGHT_ABILITY * abilityScore;

    // Rationale
    const rationale = buildRationale(
      gameKey,
      weaknessScore,
      exposureScore,
      abilityScore,
      mapping.primaryDomain,
      performanceMap.get(mapping.primaryDomain),
    );

    scoredGames.push({
      gameKey,
      score: round3(compositeScore),
      weaknessScore: round3(weaknessScore),
      exposureScore: round3(exposureScore),
      abilityScore: round3(abilityScore),
      rationale,
    });
  }

  // Sort by score descending
  scoredGames.sort((a, b) => b.score - a.score);

  return scoredGames;
}

// ── Weakness Scoring ─────────────────────────────────────

/**
 * Compute weakness score for a game.
 * Higher score = more needed (lower domain performance).
 */
function computeWeaknessScore(
  primaryDomain: CognitiveDomain,
  secondaryDomains: CognitiveDomain[],
  weights: Partial<Record<CognitiveDomain, number>>,
  performanceMap: Map<CognitiveDomain, DomainPerformance>,
): number {
  let weightedScore = 0;
  let totalWeight = 0;

  // Primary domain
  const primaryPerf = performanceMap.get(primaryDomain);
  const primaryWeight = weights[primaryDomain] ?? 1;
  if (primaryPerf && primaryPerf.confidence >= MIN_CONFIDENCE) {
    // Invert: low performance = high weakness score
    weightedScore += (1 - primaryPerf.score / 100) * primaryWeight;
  } else {
    // No data: assume medium need
    weightedScore += 0.5 * primaryWeight;
  }
  totalWeight += primaryWeight;

  // Secondary domains
  for (const domain of secondaryDomains) {
    const weight = weights[domain] ?? 0;
    if (weight <= 0) continue;

    const perf = performanceMap.get(domain);
    if (perf && perf.confidence >= MIN_CONFIDENCE) {
      weightedScore += (1 - perf.score / 100) * weight;
    } else {
      weightedScore += 0.5 * weight;
    }
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedScore / totalWeight : 0.5;
}

// ── Exposure Scoring ─────────────────────────────────────

/**
 * Compute exposure score for a game.
 * Higher score = less recently played (more eligible).
 */
function computeExposureScore(exposure: GameExposure): number {
  // Never played: highest score
  if (exposure.totalPlays === 0) {
    return 1.0;
  }

  // Recently played: apply penalty
  if (exposure.recentPlays > 0) {
    return Math.max(0, 1.0 - RECENT_SESSION_PENALTY * exposure.recentPlays);
  }

  // Played but not recently: full score
  return 1.0;
}

// ── Ability Scoring ──────────────────────────────────────

/**
 * Compute ability score for a game.
 * Higher score = game is well-suited to current ability level.
 */
function computeAbilityScore(state: AbilityState | null): number {
  if (!state) {
    // No state: assume medium suitability
    return 0.5;
  }

  // High uncertainty: medium suitability (need more data)
  if (state.uncertainty > 3) {
    return 0.6;
  }

  // Ability near 5 (mid-range): most suitable for training
  // Very high or very low ability: less room for improvement
  const abilityNormalized = state.ability / 10;
  const midpointDistance = Math.abs(abilityNormalized - 0.5);

  // Invert: closer to 0.5 = higher score
  return 1 - midpointDistance * 0.8;
}

// ── Rationale ────────────────────────────────────────────

function buildRationale(
  _gameKey: GameKey,
  weaknessScore: number,
  exposureScore: number,
  abilityScore: number,
  _primaryDomain: CognitiveDomain,
  domainPerf: DomainPerformance | undefined,
): string[] {
  const rationale: string[] = [];

  if (weaknessScore > 0.7) {
    rationale.push("weakness_priority");
  } else if (weaknessScore < 0.3) {
    rationale.push("domain_strong");
  }

  if (exposureScore > 0.8) {
    rationale.push("not_recently_played");
  } else if (exposureScore < 0.3) {
    rationale.push("recently_played_penalty");
  }

  if (abilityScore > 0.7) {
    rationale.push("ability_suitable");
  } else if (abilityScore < 0.3) {
    rationale.push("ability_extreme");
  }

  if (!domainPerf) {
    rationale.push("no_domain_data");
  } else if (domainPerf.confidence < MIN_CONFIDENCE) {
    rationale.push("low_confidence");
  }

  return rationale;
}

// ── Helpers ──────────────────────────────────────────────

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
