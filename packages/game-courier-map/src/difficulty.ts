/**
 * Courier Map difficulty configuration + map generator.
 *
 * Maps abstract difficulty level (1–10) to concrete parameters and builds
 * deterministic, guaranteed-connected trial maps.
 *
 * @see docs/06_GAME_DESIGN.md — Flagship 3: Courier Map
 */

export const RULE_IDS = ["reach_flag", "avoid_water", "blue_posts_only", "no_toll"] as const;
export type CourierMapRule = (typeof RULE_IDS)[number];

export interface CourierMapConfig {
  /** Number of nodes on the map */
  mapNodes: number;
  /** Number of closed roads (blocked edges) */
  blockedEdges: number;
  /** Active dispatch rules (1..4) */
  rules: CourierMapRule[];
  /** Probability the active rule switches mid-trial (after a move) */
  switchProbability: number;
  /** Delivery deadline (ms) */
  deadlineMs: number;
}

/** Difficulty presets (D1–D10) — from docs/06 */
const DIFFICULTY_TABLE: CourierMapConfig[] = [
  /* D1  */ { mapNodes: 6, blockedEdges: 0, rules: ["reach_flag"], switchProbability: 0, deadlineMs: 20000 },
  /* D2  */ { mapNodes: 7, blockedEdges: 1, rules: ["reach_flag"], switchProbability: 0, deadlineMs: 19000 },
  /* D3  */ { mapNodes: 8, blockedEdges: 1, rules: ["reach_flag", "avoid_water"], switchProbability: 0.15, deadlineMs: 18000 },
  /* D4  */ { mapNodes: 9, blockedEdges: 2, rules: ["reach_flag", "avoid_water"], switchProbability: 0.2, deadlineMs: 17000 },
  /* D5  */ { mapNodes: 10, blockedEdges: 2, rules: ["reach_flag", "avoid_water", "blue_posts_only"], switchProbability: 0.25, deadlineMs: 16000 },
  /* D6  */ { mapNodes: 11, blockedEdges: 3, rules: ["reach_flag", "avoid_water", "blue_posts_only"], switchProbability: 0.3, deadlineMs: 15000 },
  /* D7  */ { mapNodes: 12, blockedEdges: 3, rules: ["reach_flag", "avoid_water", "blue_posts_only"], switchProbability: 0.3, deadlineMs: 13000 },
  /* D8  */ { mapNodes: 13, blockedEdges: 4, rules: ["reach_flag", "avoid_water", "blue_posts_only", "no_toll"], switchProbability: 0.35, deadlineMs: 12000 },
  /* D9  */ { mapNodes: 14, blockedEdges: 4, rules: ["reach_flag", "avoid_water", "blue_posts_only", "no_toll"], switchProbability: 0.35, deadlineMs: 11000 },
  /* D10 */ { mapNodes: 16, blockedEdges: 5, rules: ["reach_flag", "avoid_water", "blue_posts_only", "no_toll"], switchProbability: 0.4, deadlineMs: 10000 },
];

/** Map node with screen-space position (0..1) and feature flags */
export interface CourierMapNode {
  id: number;
  x: number;
  y: number;
  water: boolean;
  bluePost: boolean;
  toll: boolean;
}

export interface CourierMapEdge {
  a: number;
  b: number;
  /** Closed road — never traversable */
  blocked: boolean;
}

export interface CourierMapLayout {
  nodes: CourierMapNode[];
  edges: CourierMapEdge[];
  startNode: number;
  goalNode: number;
  /** Shortest valid path under `referenceRules` (node ids, start..goal) */
  referencePath: number[];
  referenceRules: CourierMapRule[];
}

/**
 * Get game config for a difficulty level (1–10).
 * Clamps to valid range.
 */
export function getDifficultyConfig(difficulty: number): CourierMapConfig {
  const idx = Math.max(0, Math.min(9, Math.round(difficulty) - 1));
  return DIFFICULTY_TABLE[idx];
}

/**
 * Validate that a config is usable.
 */
export function validateConfig(config: CourierMapConfig): void {
  if (!Number.isInteger(config.mapNodes) || config.mapNodes < 6 || config.mapNodes > 16) {
    throw new Error("mapNodes must be an integer between 6 and 16");
  }
  if (
    !Number.isInteger(config.blockedEdges) ||
    config.blockedEdges < 0 ||
    config.blockedEdges >= config.mapNodes
  ) {
    throw new Error("blockedEdges must be an integer between 0 and mapNodes - 1");
  }
  if (!Array.isArray(config.rules) || config.rules.length < 1 || config.rules.length > 4) {
    throw new Error("rules must contain 1 to 4 rule ids");
  }
  for (const rule of config.rules) {
    if (!RULE_IDS.includes(rule as CourierMapRule)) {
      throw new Error(`unknown rule id: ${String(rule)}`);
    }
  }
  if (config.switchProbability < 0 || config.switchProbability > 0.4) {
    throw new Error("switchProbability must be between 0 and 0.4");
  }
  if (config.deadlineMs < 8000 || config.deadlineMs > 25000) {
    throw new Error("deadlineMs must be between 8000 and 25000");
  }
}

/**
 * Whether the courier may occupy `node` under `rules`. The goal is always
 * deliverable — features only restrict intermediate traversal.
 */
export function canPass(node: CourierMapNode, rules: CourierMapRule[], goalId?: number): boolean {
  if (node.id === goalId) return true;
  if (rules.includes("avoid_water") && node.water) return false;
  if (rules.includes("no_toll") && node.toll) return false;
  if (rules.includes("blue_posts_only") && !node.bluePost) return false;
  return true;
}

/**
 * Shortest path from `start` to `goal` over non-blocked edges, honouring
 * rule restrictions on intermediate nodes. Returns null when unreachable.
 */
export function shortestPath(
  layout: Pick<CourierMapLayout, "nodes" | "edges" | "goalNode">,
  start: number,
  rules: CourierMapRule[],
): number[] | null {
  const n = layout.nodes.length;
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const edge of layout.edges) {
    if (edge.blocked) continue;
    adj[edge.a].push(edge.b);
    adj[edge.b].push(edge.a);
  }

  const prev = new Array<number>(n).fill(-1);
  const seen = new Set<number>([start]);
  const queue: number[] = [start];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (cur === layout.goalNode) break;
    for (const next of adj[cur]) {
      if (seen.has(next)) continue;
      if (!canPass(layout.nodes[next], rules, layout.goalNode)) continue;
      seen.add(next);
      prev[next] = cur;
      queue.push(next);
    }
  }
  if (prev[layout.goalNode] === -1 && start !== layout.goalNode) return null;

  const path: number[] = [];
  let cur: number = layout.goalNode;
  while (cur !== -1) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return path.length > 0 ? path : null;
}

/**
 * Build a deterministic trial layout: connected grid map with a spanning
 * tree backbone, closed roads picked only from non-tree edges (connectivity
 * guaranteed), water/blue-post/toll features assigned disjointly, and a
 * goal chosen far from the start.
 *
 * Retries a bounded number of times (re-jittering and re-assigning
 * features) until a rule-valid path exists, then fails loudly — never ship
 * an unsolvable trial.
 */
export function generateLayout(
  config: CourierMapConfig,
  rng: () => number,
): CourierMapLayout {
  validateConfig(config);

  const startNode = 0;
  const cols = Math.ceil(Math.sqrt(config.mapNodes));
  const rows = Math.ceil(config.mapNodes / cols);

  // Retry loop: regenerate the whole layout (jitter, tree, blocked roads,
  // goal, features) until a rule-valid path exists. A fixed topology can be
  // unsolvable under blue_posts_only (a tree path needs every intermediate
  // node to be a blue post), so topology must vary between attempts.
  for (let attempt = 0; attempt < 400; attempt++) {
    const positions: { x: number; y: number }[] = [];
    for (let id = 0; id < config.mapNodes; id++) {
      const col = id % cols;
      const row = Math.floor(id / cols);
      positions.push({
        x: (col + 0.5 + (rng() - 0.5) * 0.18) / cols,
        y: (row + 0.5 + (rng() - 0.5) * 0.18) / rows,
      });
    }

    // Candidate grid edges (right + down neighbours), shuffled.
    const candidates: [number, number][] = [];
    for (let id = 0; id < config.mapNodes; id++) {
      const col = id % cols;
      if (col + 1 < cols && id + 1 < config.mapNodes) candidates.push([id, id + 1]);
      if (id + cols < config.mapNodes) candidates.push([id, id + cols]);
    }
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    // Random spanning tree via union-find → guaranteed connectivity.
    const parent = Array.from({ length: config.mapNodes }, (_, i) => i);
    const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const tree = new Set<string>();
    for (const [a, b] of candidates) {
      if (find(a) !== find(b)) {
        parent[find(a)] = find(b);
        tree.add(edgeKey(a, b));
      }
    }
    const extras = candidates.filter(([a, b]) => !tree.has(edgeKey(a, b)));
    // Blocked roads come only from extra edges → never disconnect the map.
    const blockedCount = Math.min(config.blockedEdges, extras.length);
    const blocked = new Set<string>();
    for (let i = 0; i < blockedCount; i++) blocked.add(edgeKey(extras[i][0], extras[i][1]));

    const edges: CourierMapEdge[] = candidates.map(([a, b]) => ({
      a,
      b,
      blocked: blocked.has(edgeKey(a, b)),
    }));

    // Goal = node farthest (by hops) from the start.
    const hops = bfsHops(edges, config.mapNodes, startNode);
    let goalNode = -1;
    let best = -1;
    for (let id = 0; id < config.mapNodes; id++) {
      if (id !== startNode && hops[id] > best) {
        best = hops[id];
        goalNode = id;
      }
    }

    const nodes = assignFeatures(
      config.mapNodes,
      positions,
      startNode,
      goalNode,
      edges,
      config.rules,
      rng,
    );
    const layout: CourierMapLayout = {
      nodes,
      edges,
      startNode,
      goalNode,
      referencePath: [],
      referenceRules: [...config.rules],
    };
    const path = shortestPath(layout, startNode, config.rules);
    if (path && path.length >= 2) {
      layout.referencePath = path;
      return layout;
    }
  }

  throw new Error("courier_map: unable to generate a connected map with a reachable goal");
}

function assignFeatures(
  n: number,
  positions: { x: number; y: number }[],
  start: number,
  goal: number,
  edges: CourierMapEdge[],
  rules: CourierMapRule[],
  rng: () => number,
): CourierMapNode[] {
  const nodes: CourierMapNode[] = positions.map((p, id) => ({
    id,
    x: p.x,
    y: p.y,
    water: false,
    bluePost: false,
    toll: false,
  }));

  // When a restrictive rule is active, plant a guaranteed safe chain along
  // one unconstrained path to the goal so the trial is always solvable:
  // - blue_posts_only → every intermediate node on the chain becomes a blue
  //   post;
  // - avoid_water / no_toll → chain nodes are excluded from the water/toll
  //   pools.
  const protectedChain = new Set<number>();
  if (
    rules.includes("blue_posts_only") ||
    rules.includes("avoid_water") ||
    rules.includes("no_toll")
  ) {
    const chain = unconstrainedPath(edges, n, start, goal);
    for (const id of chain) {
      if (id !== start && id !== goal) {
        protectedChain.add(id);
        if (rules.includes("blue_posts_only")) nodes[id].bluePost = true;
      }
    }
  }

  // Feature pools drawn from the same shuffled candidate list → disjoint.
  const pool = Array.from({ length: n }, (_, i) => i).filter(
    (i) => i !== start && i !== goal && !protectedChain.has(i),
  );
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const waterCount = Math.min(pool.length, Math.max(1, Math.round(n / 4)));
  const tollCount = Math.min(
    Math.max(0, pool.length - waterCount),
    Math.max(1, Math.round(n / 5)),
  );

  for (let i = 0; i < waterCount; i++) nodes[pool[i]].water = true;
  for (let i = 0; i < tollCount; i++) nodes[pool[waterCount + i]].toll = true;

  return nodes;
}

/** BFS path start→goal ignoring rule restrictions (blocked edges excluded). */
function unconstrainedPath(
  edges: CourierMapEdge[],
  n: number,
  start: number,
  goal: number,
): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const e of edges) {
    if (e.blocked) continue;
    adj[e.a].push(e.b);
    adj[e.b].push(e.a);
  }
  const prev = new Array<number>(n).fill(-1);
  const seen = new Set<number>([start]);
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (cur === goal) break;
    for (const next of adj[cur]) {
      if (seen.has(next)) continue;
      seen.add(next);
      prev[next] = cur;
      queue.push(next);
    }
  }
  if (prev[goal] === -1 && start !== goal) return [start];
  const path: number[] = [];
  let cur = goal;
  while (cur !== -1) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return path;
}

function bfsHops(edges: CourierMapEdge[], n: number, start: number): number[] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const e of edges) {
    if (e.blocked) continue;
    adj[e.a].push(e.b);
    adj[e.b].push(e.a);
  }
  const dist = new Array<number>(n).fill(-1);
  dist[start] = 0;
  const queue = [start];
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    for (const next of adj[cur]) {
      if (dist[next] !== -1) continue;
      dist[next] = dist[cur] + 1;
      queue.push(next);
    }
  }
  return dist;
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}