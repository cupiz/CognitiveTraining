import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  generateLayout,
  shortestPath,
  type CourierMapConfig,
  type CourierMapLayout,
  type CourierMapRule,
} from "./difficulty.js";

export const GAME_KEY = "courier_map" as const;
export const GAME_VERSION = "0.1.0" as const;

/** Game phases for the state machine */
export type CMPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "waiting" // courier can move towards the flag
  | "feedback" // brief feedback after delivery / rule-break / timeout
  | "paused"
  | "finished";

/** State for the renderer */
export interface CMRenderState {
  phase: CMPhase;
  layout: CourierMapLayout | null;
  currentPosition: number;
  path: number[];
  activeRules: CourierMapRule[];
  previousRule: string | null;
  switchTrial: boolean;
  feedbackKind: "move" | "blocked" | "break" | "delivered" | "timeout" | null;
  feedbackMessage: string;
  trialNumber: number;
  totalTrials: number;
  isPractice: boolean;
  score: number;
  deadlineMs: number;
}

/**
 * Courier Map (Kurir Peta) game implementation.
 *
 * Mechanic:
 * 1. A connected map is shown with the active dispatch rule banner.
 * 2. The courier taps adjacent nodes to move towards the flag.
 * 3. Reaching the flag submits the trial (delivered).
 * 4. Tapping a rule-forbidden node (water / non-blue-post / toll) ends the
 *    trial as a rule-break commission. Blocked roads are ignored kindly.
 * 5. The active rule may switch mid-trial (switchProbability, once per trial).
 *
 * @see docs/06_GAME_DESIGN.md — Flagship 3: Courier Map
 */
export class CourierMapGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private cmPhase: CMPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: CourierMapConfig = {
    mapNodes: 8,
    blockedEdges: 1,
    rules: ["reach_flag", "avoid_water"],
    switchProbability: 0.15,
    deadlineMs: 18000,
  };
  private rng: () => number = () => 0;

  // Trial state
  private layout: CourierMapLayout | null = null;
  private currentPosition = 0;
  private path: number[] = [];
  private activeRules: CourierMapRule[] = [];
  private previousRule: string | null = null;
  private switchTrial = false;
  private switched = false;
  private feedbackKind: CMRenderState["feedbackKind"] = null;
  private feedbackMessage = "";
  private responseStartMs = 0;
  private currentTrialId = "";
  private isCurrentPracticeTrial = false;

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 8;
  private score = 0;

  // Pause state
  private pausedPhase: CMPhase = "idle";

  // Metrics
  private deliveryRts: number[] = [];

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as CourierMapConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as CourierMapConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 8;
    this.cmPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";
    this.deliveryRts = [];
    this.score = 0;

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (input.type !== "pointer_down" && input.type !== "touch") return;
    if (this.cmPhase !== "waiting") return;

    const payload = (input as Record<string, unknown>).cellIndex;
    if (typeof payload !== "number") return;
    const node = Math.floor(payload);
    if (!this.layout || node < 0 || node >= this.layout.nodes.length) return;

    this.handleNodeTap(node);
  }

  pause(): void {
    if (this.cmPhase === "idle" || this.cmPhase === "finished" || this.cmPhase === "paused") return;
    this.pausedPhase = this.cmPhase;
    this.cmPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.cmPhase !== "paused") return;
    this.cmPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.cmPhase = "finished";

    const rts = this.deliveryRts;
    const sorted = [...rts].sort((a, b) => a - b);
    const median =
      sorted.length === 0
        ? undefined
        : sorted.length % 2 === 1
          ? sorted[(sorted.length - 1) / 2]
          : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;

    return {
      gameKey: this.key,
      gameVersion: this.version,
      config: this.config as unknown as Record<string, unknown>,
      totalTrials: this.trials.totalTrials,
      validTrials: this.trials.scoredTrialCount,
      accuracy: this.trials.accuracy,
      medianRtMs: median,
      meanRtMs: rts.length > 0 ? rts.reduce((a, b) => a + b, 0) / rts.length : undefined,
      rtVariability: rts.length > 1 ? stdDev(rts) : undefined,
      omissionErrors: this.trials.omissionErrors,
      commissionErrors: this.trials.commissionErrors,
      qualityFlags: this.trials.allQualityFlags,
    };
  }

  getPhase() {
    if (this.cmPhase === "idle") return "idle";
    if (this.cmPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.cmPhase,
      layout: this.layout,
      currentPosition: this.currentPosition,
      path: this.path,
      activeRules: this.activeRules,
      previousRule: this.previousRule,
      switchTrial: this.switchTrial,
      feedbackKind: this.feedbackKind,
      feedbackMessage: this.feedbackMessage,
      trialNumber: this.scoredCount + this.practiceCount,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      deadlineMs: this.config.deadlineMs,
    } satisfies CMRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    const layout = generateLayout(this.config, this.rng);
    this.layout = layout;
    this.currentPosition = layout.startNode;
    this.path = [layout.startNode];
    this.activeRules = [...this.config.rules];
    this.previousRule = null;
    this.switchTrial = false;
    this.switched = false;
    this.feedbackKind = null;
    this.feedbackMessage = "";

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trial = this.trials.startTrial({
      isPractice,
      exposureMs: this.config.deadlineMs,
    });
    this.currentTrialId = trial.trialId;

    this.emitTrialStarted(trial.trialId, {
      seed: Math.round(this.rng() * 100000),
      mapNodes: this.config.mapNodes,
      rules: this.activeRules.join("|"),
    });

    this.cmPhase = "waiting";
    this.responseStartMs = performance.now();

    // The map is the stimulus — it stays visible until delivery/timeout.
    this.emit("stimulus_shown", { trialId: trial.trialId });

    this.armTimer("deadline", this.config.deadlineMs, () => {
      this.handleTimeout();
    });
  }

  private handleNodeTap(node: number): void {
    const layout = this.layout;
    if (!layout) return;

    if (node === this.currentPosition) return;

    // Only adjacent moves count — non-adjacent taps are ignored.
    const edge = layout.edges.find(
      (e) =>
        !e.blocked &&
        ((e.a === this.currentPosition && e.b === node) ||
          (e.a === node && e.b === this.currentPosition)),
    );
    if (!edge) {
      this.feedbackKind = "move";
      this.feedbackMessage = "Lewat jalan yang menyambung ya";
      return;
    }

    // Rule check on the node we would move onto (goal is always deliverable).
    if (node !== layout.goalNode && !canPassNode(layout.nodes[node], this.activeRules)) {
      this.finishTrialAsBreak();
      return;
    }

    // Move.
    this.currentPosition = node;
    this.path.push(node);
    this.feedbackKind = "move";
    this.feedbackMessage = "";

    if (node === layout.goalNode) {
      this.finishTrialAsDelivered();
      return;
    }

    // Possible mid-shift rule switch (once per trial, after at least one move).
    if (
      !this.switched &&
      this.config.rules.length >= 2 &&
      this.rng() < this.config.switchProbability
    ) {
      this.switched = true;
      this.switchTrial = true;
      this.previousRule = this.activeRules.join("|");
      this.activeRules = nextRuleSet(this.config.rules, this.activeRules, this.rng);
      // Emit so telemetry can pinpoint the switch moment.
      this.emit("stimulus_shown", {
        trialId: this.currentTrialId,
        currentRule: this.activeRules.join("|"),
        previousRule: this.previousRule,
        switchTrial: true,
      });
    }
  }

  private finishTrialAsBreak(): void {
    this.clearTimers();
    this.cmPhase = "feedback";
    this.feedbackKind = "break";
    this.feedbackMessage = ruleBreakMessage(this.activeRules);

    // Rule-break → commission. The traversed path (without the forbidden
    // node) is the response; the attempt itself is visible in the event flow.
    this.trials.respond(false, {
      selectedCells: [...this.path],
      correctCells: this.referencePath(),
      currentRule: this.activeRules.join("|"),
      previousRule: this.previousRule ?? undefined,
      switchTrial: this.switchTrial,
      reactionTimeMs: Math.round(performance.now() - this.responseStartMs),
    });
    this.emitResponse(this.currentTrialId, {
      correct: false,
      selectedCells: [...this.path],
      correctCells: this.referencePath(),
      currentRule: this.activeRules.join("|"),
      previousRule: this.previousRule ?? undefined,
      switchTrial: this.switchTrial,
      reactionTimeMs: Math.round(performance.now() - this.responseStartMs),
    });

    this.armTimer("feedback", 1400, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private finishTrialAsDelivered(): void {
    this.clearTimers();
    this.cmPhase = "feedback";
    this.feedbackKind = "delivered";

    const rt = Math.round(performance.now() - this.responseStartMs);
    this.deliveryRts.push(rt);
    this.score++;

    this.trials.respond(true, {
      selectedCells: [...this.path],
      correctCells: this.referencePath(),
      currentRule: this.activeRules.join("|"),
      previousRule: this.previousRule ?? undefined,
      switchTrial: this.switchTrial,
      reactionTimeMs: rt,
    });
    this.emitResponse(this.currentTrialId, {
      correct: true,
      selectedCells: [...this.path],
      correctCells: this.referencePath(),
      currentRule: this.activeRules.join("|"),
      previousRule: this.previousRule ?? undefined,
      switchTrial: this.switchTrial,
      reactionTimeMs: rt,
    });

    this.armTimer("feedback", 800, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private handleTimeout(): void {
    if (this.cmPhase !== "waiting") return;

    this.clearTimers();
    this.cmPhase = "feedback";
    this.feedbackKind = "timeout";
    this.feedbackMessage = "Waktu habis — paket belum sampai. Coba lagi ya!";

    // Deliberately no trials.respond(): the tracker records an omission.
    this.emit("timeout", { trialId: this.currentTrialId });

    this.armTimer("feedback", 800, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private referencePath(): number[] {
    const layout = this.layout;
    if (!layout) return [];
    return shortestPath(layout, layout.startNode, this.activeRules) ?? layout.referencePath;
  }

  private nextTrial(): void {
    this.feedbackKind = null;
    this.feedbackMessage = "";

    if (this.isCurrentPracticeTrial) {
      this.practiceCount++;
      this.isCurrentPracticeTrial = false;
      if (this.practiceCount >= (this.context.practiceTrials ?? 0)) {
        this.gameMode = "countdown";
        this.armTimer("countdownTransition", 1500, () => {
          this.gameMode = "playing";
          this.beginTrial();
        });
        return;
      }
    } else {
      this.scoredCount++;
      if (this.scoredCount >= this.maxTrials) {
        this.gameMode = "finished";
        this.cmPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 500, () => {
      this.beginTrial();
    });
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
  }
}

// ── Helpers ──────────────────────────────────────────────

function canPassNode(node: { water: boolean; bluePost: boolean; toll: boolean }, rules: CourierMapRule[]): boolean {
  if (rules.includes("avoid_water") && node.water) return false;
  if (rules.includes("no_toll") && node.toll) return false;
  if (rules.includes("blue_posts_only") && !node.bluePost) return false;
  return true;
}

function ruleBreakMessage(rules: CourierMapRule[]): string {
  // Kind, rule-specific cue — never shame language.
  if (rules.includes("avoid_water")) return "Aturannya: jangan lewat air ya — coba lagi!";
  if (rules.includes("no_toll")) return "Aturannya: jangan lewat jalan tol ya — coba lagi!";
  if (rules.includes("blue_posts_only")) return "Aturannya: lewat pos biru saja ya — coba lagi!";
  return "Lewat jalan yang masih boleh ya — coba lagi!";
}

/** Pick a different rule subset (same size) from the config's rule pool. */
function nextRuleSet(
  pool: CourierMapRule[],
  current: CourierMapRule[],
  rng: () => number,
): CourierMapRule[] {
  const poolSet = new Set(pool);
  const currentSet = new Set(current);
  const removable = current.filter((r) => r !== "reach_flag");
  if (removable.length === 0) return current;
  const drop = removable[Math.floor(rng() * removable.length)];
  const addable = [...poolSet].filter((r) => !currentSet.has(r));
  if (addable.length === 0) return current;
  const add = addable[Math.floor(rng() * addable.length)];
  return [...current.filter((r) => r !== drop), add];
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}