/**
 * Domain mapping — maps games to cognitive domains.
 *
 * Each game has a primary domain and optional secondary domains.
 * Weights indicate how much each domain is trained by the game.
 *
 * @see docs/06_GAME_DESIGN.md
 */

import type { CognitiveDomain, DomainMapping, GameKey } from "./types.js";

// ── Domain Mappings ──────────────────────────────────────

const DOMAIN_MAPPINGS: DomainMapping[] = [
  {
    gameKey: "memory_matrix",
    primaryDomain: "working_memory",
    secondaryDomains: ["visual_spatial"],
    weights: {
      working_memory: 0.8,
      visual_spatial: 0.2,
    },
  },
  {
    gameKey: "target_watch",
    primaryDomain: "sustained_attention",
    secondaryDomains: ["processing_speed"],
    weights: {
      sustained_attention: 0.7,
      processing_speed: 0.3,
    },
  },
  {
    gameKey: "quick_match",
    primaryDomain: "processing_speed",
    secondaryDomains: ["sustained_attention"],
    weights: {
      processing_speed: 0.75,
      sustained_attention: 0.25,
    },
  },
  {
    gameKey: "stop_signal",
    primaryDomain: "inhibitory_control",
    secondaryDomains: ["processing_speed"],
    weights: {
      inhibitory_control: 0.8,
      processing_speed: 0.2,
    },
  },
  {
    gameKey: "rule_switch",
    primaryDomain: "cognitive_flexibility",
    secondaryDomains: ["processing_speed"],
    weights: {
      cognitive_flexibility: 0.7,
      processing_speed: 0.3,
    },
  },
  {
    gameKey: "spice_stall",
    primaryDomain: "working_memory",
    secondaryDomains: ["visual_spatial"],
    weights: {
      working_memory: 0.8,
      visual_spatial: 0.2,
    },
  },
  {
    gameKey: "red_light",
    primaryDomain: "inhibitory_control",
    secondaryDomains: ["processing_speed"],
    weights: {
      inhibitory_control: 0.8,
      processing_speed: 0.2,
    },
  },
  {
    gameKey: "courier_map",
    primaryDomain: "cognitive_flexibility",
    secondaryDomains: ["visual_spatial"],
    weights: {
      cognitive_flexibility: 0.7,
      visual_spatial: 0.3,
    },
  },
  {
    gameKey: "lighthouse_keeper",
    primaryDomain: "working_memory",
    secondaryDomains: ["sustained_attention"],
    weights: {
      working_memory: 0.8,
      sustained_attention: 0.2,
    },
  },
  {
    gameKey: "sushi_express",
    primaryDomain: "processing_speed",
    secondaryDomains: ["sustained_attention"],
    weights: {
      processing_speed: 0.8,
      sustained_attention: 0.2,
    },
  },
  {
    gameKey: "crystal_palace",
    primaryDomain: "visual_spatial",
    secondaryDomains: ["sustained_attention"],
    weights: {
      visual_spatial: 0.8,
      sustained_attention: 0.2,
    },
  },
];

// ── Lookup Maps ──────────────────────────────────────────

const GAME_TO_DOMAIN = new Map<GameKey, DomainMapping>();
const DOMAIN_TO_GAMES = new Map<CognitiveDomain, GameKey[]>();

for (const mapping of DOMAIN_MAPPINGS) {
  GAME_TO_DOMAIN.set(mapping.gameKey, mapping);

  // Primary domain
  const primaryGames = DOMAIN_TO_GAMES.get(mapping.primaryDomain) ?? [];
  primaryGames.push(mapping.gameKey);
  DOMAIN_TO_GAMES.set(mapping.primaryDomain, primaryGames);
}

// ── Public Functions ─────────────────────────────────────

/**
 * Get the domain mapping for a game.
 */
export function getDomainMapping(gameKey: GameKey): DomainMapping | undefined {
  return GAME_TO_DOMAIN.get(gameKey);
}

/**
 * Get the primary domain for a game.
 */
export function getPrimaryDomain(gameKey: GameKey): CognitiveDomain | undefined {
  return GAME_TO_DOMAIN.get(gameKey)?.primaryDomain;
}

/**
 * Get all games that train a specific domain.
 */
export function getGamesForDomain(domain: CognitiveDomain): GameKey[] {
  return DOMAIN_TO_GAMES.get(domain) ?? [];
}

/**
 * Get the weight of a domain for a specific game.
 * Returns 0 if the game doesn't train that domain.
 */
export function getDomainWeight(gameKey: GameKey, domain: CognitiveDomain): number {
  return GAME_TO_DOMAIN.get(gameKey)?.weights[domain] ?? 0;
}

/**
 * Get all cognitive domains.
 */
export function getAllDomains(): CognitiveDomain[] {
  return [
    "working_memory",
    "sustained_attention",
    "processing_speed",
    "inhibitory_control",
    "cognitive_flexibility",
    "visual_spatial",
  ];
}

/**
 * Get all game keys.
 */
export function getAllGameKeys(): GameKey[] {
  return [
    "memory_matrix",
    "target_watch",
    "quick_match",
    "stop_signal",
    "rule_switch",
    "spice_stall",
    "red_light",
    "courier_map",
    "lighthouse_keeper",
    "sushi_express",
    "crystal_palace",
  ];
}
