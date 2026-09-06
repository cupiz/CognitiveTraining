/**
 * Engine audit: simulates one full scored round for every game engine and
 * asserts the summary is alive — validTrials > 0 AND accuracy > 0.
 *
 * This guards against the tap_critter / pair_cards bug class: engines that
 * never call trials.endTrial(), never leave practice mode, or record every
 * response as wrong, so the result screen shows 0 forever.
 *
 * Each driver plays honestly (perfect info from render state, deterministic
 * seed), like the engine's own unit tests. Real timers are used, so the whole
 * audit takes a couple of minutes.
 *
 * Run:  pnpm tsx scripts/audit-game-engines.mts
 */
import { performance } from "node:perf_hooks";

// ── Engine imports (source-direct, so no build step needed) ────────────
import { CourierMapGame } from "../packages/game-courier-map/src/index.js";
import { CrystalPalaceGame } from "../packages/game-crystal-palace/src/index.js";
import { CrystalTowerGame } from "../packages/game-crystal-tower/src/index.js";
import { DualGardenGame } from "../packages/game-dual-garden/src/index.js";
import { LighthouseKeeperGame } from "../packages/game-lighthouse-keeper/src/index.js";
import { MemoryMatrixGame } from "../packages/game-memory-matrix/src/index.js";
import { PairCardsGame } from "../packages/game-pair-cards/src/index.js";
import { QuickMatchGame } from "../packages/game-quick-match/src/index.js";
import { RedLightGame } from "../packages/game-red-light/src/index.js";
import { RuleSwitchGame } from "../packages/game-rule-switch/src/index.js";
import { SpiceStallGame } from "../packages/game-spice-stall/src/index.js";
import { StopSignalGame } from "../packages/game-stop-signal/src/index.js";
import { SushiExpressGame } from "../packages/game-sushi-express/src/index.js";
import { TapCritterGame } from "../packages/game-tap-critter/src/index.js";
import { TargetWatchGame } from "../packages/game-target-watch/src/index.js";
import { TrainNBackGame } from "../packages/game-train-n-back/src/index.js";
import { WideViewGame } from "../packages/game-wide-view/src/index.js";

import type { GameContext, GameSummary } from "@cog/game-core";
import type { InputEvent } from "@cog/schemas";

// ── Shared fake context (practiceTrials=0 → straight to scored play) ────
function makeContext(gameKey: string, maxTrials: number): GameContext {
  return {
    sessionId: "audit-session",
    gameRunId: "audit-run",
    gameKey: gameKey as GameContext["gameKey"],
    gameVersion: "audit",
    difficulty: 1,
    seed: 1337,
    isPractice: false,
    maxTrials,
    practiceTrials: 0,
    deviceContext: {
      userAgent: "audit",
      screenWidth: 1280,
      screenHeight: 720,
      pixelRatio: 1,
      touchSupport: false,
      refreshRate: 60,
      platform: "audit",
      language: "id",
      timezone: "Asia/Jakarta",
    },
    extra: {},
    startedAt: performance.now(),
    sendTelemetry: {
      send: async (batch) => ({ accepted: batch.events.length, rejected: 0, rejectedSequences: [] }),
    },
  };
}

function tap(game: { handleInput(e: InputEvent): void }, cellIndex: number): void {
  game.handleInput({ type: "pointer_down", x: 10, y: 10, tClient: 0, cellIndex } as unknown as InputEvent);
}

const advance = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

interface AuditResult {
  key: string;
  ok: boolean;
  summary?: GameSummary;
  error?: string;
}

/** Loop until the engine reaches its finished render phase (or budget out). */
async function runUntilFinished(
  game: any,
  step: (s: any) => void,
  opts: { pollMs?: number; budget?: number; timeoutMs?: number } = {},
): Promise<void> {
  const pollMs = opts.pollMs ?? 25;
  const budget = opts.budget ?? 5_000;
  const deadline = Date.now() + (opts.timeoutMs ?? 120_000);
  for (let i = 0; i < budget; i++) {
    if (Date.now() > deadline) throw new Error("driver timeout");
    const s = game.getRenderState();
    if (s.phase === "finished") return;
    step(s);
    await advance(pollMs);
  }
  throw new Error("driver budget exhausted — engine never reached `finished`");
}

// ── Per-game drivers (honest play, deterministic outcome) ───────────────
type Driver = (game: any) => Promise<void>;

const drivers: Record<string, Driver> = {
  courier_map: async (g) => {
    let lastMove = "";
    await runUntilFinished(g, (s) => {
      if (s.phase !== "waiting" || !s.layout) return;
      if (s.currentPosition === s.layout.goalNode) return;
      // BFS over unblocked, rule-passable edges (the goal is always allowed).
      const passable = (n: any) =>
        n.id === s.layout.goalNode ||
        (!(s.activeRules.includes("avoid_water") && n.water) &&
          !(s.activeRules.includes("no_toll") && n.toll) &&
          !(s.activeRules.includes("blue_posts_only") && !n.bluePost));
      const adj = new Map<number, number[]>();
      for (const e of s.layout.edges) {
        if (e.blocked) continue;
        if (!adj.has(e.a)) adj.set(e.a, []);
        if (!adj.has(e.b)) adj.set(e.b, []);
        adj.get(e.a)!.push(e.b);
        adj.get(e.b)!.push(e.a);
      }
      const prev = new Map<number, number>([[s.layout.goalNode, -1]]);
      const q = [s.layout.goalNode];
      while (q.length > 0) {
        const cur = q.shift()!;
        for (const nb of adj.get(cur) ?? []) {
          if (prev.has(nb) || !passable(s.layout.nodes[nb])) continue;
          prev.set(nb, cur);
          q.push(nb);
        }
      }
      if (!prev.has(s.currentPosition)) return;
      const path: number[] = [];
      let cur = s.currentPosition;
      while (cur !== s.layout.goalNode) {
        cur = prev.get(cur)!;
        path.push(cur);
      }
      const key = `${s.currentPosition}>${path[0]}`;
      if (key === lastMove) return; // engine hasn't processed the previous tap yet
      lastMove = key;
      tap(g, path[0]);
    });
  },

  crystal_palace: async (g) => {
    await runUntilFinished(g, (s) => {
      if (s.phase !== "waiting" || !s.grid) return;
      const match = s.grid.cells.find((c: any) => c.isMatch && !s.tappedIndices.includes(c.id));
      if (match) tap(g, match.id);
    });
  },

  crystal_tower: async (g) => {
    // Optimal 3-disk Hanoi plan (difficulty 1), executed move by move.
    const plan: number[][] = [];
    const hanoi = (n: number, from: number, to: number, aux: number) => {
      if (n === 0) return;
      hanoi(n - 1, from, aux, to);
      plan.push([from, to]);
      hanoi(n - 1, aux, to, from);
    };
    hanoi(3, 0, 2, 1);
    let moveIdx = 0;
    await runUntilFinished(g, (s) => {
      if (s.phase !== "solving" && s.phase !== "selected") return;
      if (s.disks !== 3) throw new Error(`audit assumes 3 disks at D1, got ${s.disks}`);
      if (s.moves === 0 && s.selectedPeg === -1) moveIdx = 0; // fresh puzzle
      const [a, b] = plan[moveIdx % plan.length];
      tap(g, a);
      tap(g, b);
      moveIdx++;
    });
  },

  dual_garden: async (g) => {
    // Honest play: mark only when the watched stream(s) match.
    await runUntilFinished(g, (s) => {
      if (s.phase !== "round" || !s.awaitingResponse) return;
      const shouldMark = s.requireBoth
        ? s.currentAnimal === s.targetAnimal && s.currentFruit === s.targetFruit
        : s.currentFruit === s.targetFruit;
      if (shouldMark) tap(g, 0);
    });
  },

  lighthouse_keeper: async (g) => {
    await runUntilFinished(g, (s) => {
      if (s.phase !== "waiting" || s.showSequence) return;
      const next = s.sequence[s.tappedIndices.length];
      if (next !== undefined) tap(g, next);
    });
  },

  memory_matrix: async (g) => {
    await runUntilFinished(g, (s) => {
      if (s.phase !== "waiting") return;
      // The engine auto-submits at targetCount selections; feed two targets.
      const idx = s.selectedCells.length === 0 ? (s.targetCells[1] ?? s.targetCells[0]) : s.targetCells[0];
      tap(g, idx.row * s.gridCols + idx.col);
    });
  },

  pair_cards: async (g) => {
    await runUntilFinished(g, (s) => {
      if (s.phase !== "play" || s.firstPick !== -1) return;
      // Perfect-info pairing, same technique as the engine's own unit test.
      const byPair = new Map<number, number[]>();
      g.cards.forEach((c: any, idx: number) => byPair.set(c.pairId, [...(byPair.get(c.pairId) ?? []), idx]));
      const pair = [...byPair.values()].find(([a]: number[]) => !g.cards[a].matched);
      if (pair) {
        tap(g, pair[0]);
        tap(g, pair[1]);
      }
    });
  },

  quick_match: async (g) => {
    await runUntilFinished(g, (s) => {
      if (s.phase === "matching" && s.selectedIndex === -1) tap(g, s.targetIndex);
    });
  },

  red_light: async (g) => {
    await runUntilFinished(g, (s) => {
      // Run on green; hold through red (isStopTrial is exposed in render state).
      if (s.phase === "go" && !s.isStopTrial) tap(g, 0);
    });
  },

  rule_switch: async (g) => {
    await runUntilFinished(g, (s) => {
      if (s.phase === "waiting" && s.selectedIndex === -1) tap(g, s.matchIndex);
    });
  },

  spice_stall: async (g) => {
    await runUntilFinished(g, (s) => {
      if (s.phase !== "waiting") return;
      const next = s.order[s.tappedIndices.length];
      if (next !== undefined) tap(g, next);
    });
  },

  stop_signal: async (g) => {
    await runUntilFinished(g, (s) => {
      if (s.phase === "go" && !s.isStopTrial) tap(g, s.goDirection === "left" ? 0 : 1);
    });
  },

  sushi_express: async (g) => {
    // Mirror the engine's serve-zone math (SERVE_ZONE_LEFT 0.72 → RIGHT 0.92)
    // and serve only target plates while they cross the zone.
    await runUntilFinished(
      g,
      (s) => {
        if (s.phase !== "waiting") return;
        const elapsed = Math.max(0, performance.now() - g.responseStartMs);
        const plate = (s.plates as Array<{ id: number; isTarget: boolean }>).find((p) => {
          if (!p.isTarget) return false;
          const tIn = p.id * s.spawnIntervalMs + 0.72 * s.beltMs;
          const tOut = p.id * s.spawnIntervalMs + 0.92 * s.beltMs;
          return elapsed >= tIn && elapsed < tOut;
        });
        if (plate) tap(g, 0); // any tap serves the plate currently inside the zone
      },
      { pollMs: 15 },
    );
  },

  tap_critter: async (g) => {
    await runUntilFinished(g, (s) => {
      if (s.phase === "pop" && s.currentHole >= 0 && s.currentKind === "critter") tap(g, s.currentHole);
      // decoys left alone → correct rejections
    });
  },

  target_watch: async (g) => {
    // Tap only on the target symbol: hits on targets, correct rejections on
    // the rest — deterministic accuracy = 1.
    await runUntilFinished(g, (s) => {
      if (s.phase === "waiting" && !s.responded && s.isTarget) tap(g, 0);
    });
  },

  train_n_back: async (g) => {
    // Ring the bell only on true n-back matches (peek the fruit history).
    await runUntilFinished(g, (s) => {
      if (s.phase !== "wagon" || !s.awaitingResponse) return;
      const fruits = g.fruits as string[];
      const cur = fruits[fruits.length - 1];
      const nback = fruits[fruits.length - 1 - s.nLevel];
      if (cur === nback) tap(g, 0);
    });
  },

  wide_view: async (g) => {
    await runUntilFinished(g, (s) => {
      if (s.phase === "probe" && s.probedSlot === -1) {
        // A child who watched the flash knows the slot (peek flashSlot).
        tap(g, g.flashSlot ?? 0);
      }
    });
  },
};

// ── Harness ─────────────────────────────────────────────────────────────
const REGISTRY: Array<[string, new () => any, number]> = [
  // [key, constructor, maxTrials]
  ["courier_map", CourierMapGame, 3],
  ["crystal_palace", CrystalPalaceGame, 3],
  ["crystal_tower", CrystalTowerGame, 2],
  ["dual_garden", DualGardenGame, 3],
  ["lighthouse_keeper", LighthouseKeeperGame, 3],
  ["memory_matrix", MemoryMatrixGame, 3],
  ["pair_cards", PairCardsGame, 1],
  ["quick_match", QuickMatchGame, 3],
  ["red_light", RedLightGame, 6],
  ["rule_switch", RuleSwitchGame, 3],
  ["spice_stall", SpiceStallGame, 3],
  ["stop_signal", StopSignalGame, 6],
  ["sushi_express", SushiExpressGame, 2],
  ["tap_critter", TapCritterGame, 3],
  ["target_watch", TargetWatchGame, 2],
  ["train_n_back", TrainNBackGame, 3],
  ["wide_view", WideViewGame, 3],
];

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

async function auditGame(key: string, Ctor: new () => any, maxTrials: number): Promise<AuditResult> {
  const game = new Ctor();
  try {
    game.start(makeContext(key, maxTrials));
    const driver = drivers[key];
    if (!driver) return { key, ok: false, error: "no driver registered" };
    await driver(game);
    const summary: GameSummary = game.finish();

    // ── Assertions: the zero-metrics bug class ──
    const problems: string[] = [];
    if (!summary.validTrials || summary.validTrials <= 0) problems.push(`validTrials=${summary.validTrials}`);
    if (summary.accuracy === undefined || summary.accuracy <= 0) problems.push(`accuracy=${summary.accuracy}`);
    if (!summary.totalTrials || summary.totalTrials <= 0) problems.push(`totalTrials=${summary.totalTrials}`);
    if (summary.accuracy !== undefined && summary.accuracy > 1) problems.push(`accuracy=${summary.accuracy} (>1)`);

    // Honest-play drivers should never produce omissions.
    if (problems.length === 0 && summary.omissionErrors > 0) {
      problems.push(`omissionErrors=${summary.omissionErrors} despite honest full play`);
    }
    if (problems.length > 0) return { key, ok: false, summary, error: problems.join(", ") };
    return { key, ok: true, summary };
  } catch (err) {
    return { key, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  console.log(`Auditing ${REGISTRY.length} game engines — one full scored round each...\n`);
  const t0 = Date.now();

  const results: AuditResult[] = [];
  for (const [key, Ctor, maxTrials] of REGISTRY) {
    const result = await auditGame(key, Ctor, maxTrials);
    results.push(result);
    if (result.ok) {
      const s = result.summary!;
      console.log(
        `${GREEN}✓${RESET} ${key.padEnd(19)} trials=${s.totalTrials} valid=${s.validTrials} acc=${((s.accuracy ?? 0) * 100).toFixed(0)}%` +
          (s.medianRtMs !== undefined ? ` ${DIM}medRt=${Math.round(s.medianRtMs)}ms${RESET}` : ""),
      );
    } else {
      console.log(`${RED}✗${RESET} ${key.padEnd(19)} ${result.error}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} engines alive ${DIM}(${((Date.now() - t0) / 1000).toFixed(0)}s)${RESET}`,
  );

  if (failed.length > 0) {
    console.log(`\n${RED}FAILED (zero-metrics bug class or engine error):${RESET}`);
    for (const f of failed) console.log(`  - ${f.key}: ${f.error}`);
    process.exit(1);
  }
}

void main();
