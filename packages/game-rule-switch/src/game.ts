import type { InputEvent } from "@cog/schemas";
import type { GameContext, GameSummary } from "@cog/game-core";
import { BaseGame, buildSummary, createRng } from "@cog/game-core";
import {
  getDifficultyConfig,
  validateConfig,
  generateTrial,
  shouldSwitch,
  getRandomRule,
  type RuleSwitchConfig,
  type RuleDefinition,
  type Stimulus,
} from "./difficulty.js";

export const GAME_KEY = "rule_switch" as const;
export const GAME_VERSION = "1.0.0" as const;

/** Game phases for the state machine */
type RSPhase =
  | "idle"
  | "practice"
  | "countdown"
  | "rule_display"  // Showing the current rule
  | "waiting"       // Waiting for user to select matching stimulus
  | "feedback"      // Brief feedback after response
  | "intermission"  // Brief pause between trials
  | "paused"
  | "finished";

/** State for the renderer */
export interface RSRenderState {
  phase: RSPhase;
  /** Current rule being applied */
  currentRule: RuleDefinition | null;
  /** Target stimulus to match */
  targetStimulus: Stimulus | null;
  /** Array of option stimuli */
  options: Stimulus[];
  /** Index of the correct matching option (-1 if not set) */
  matchIndex: number;
  /** Index of user's selected option (-1 if none) */
  selectedIndex: number;
  /** Whether this is a switch trial (rule changed from previous) */
  isSwitchTrial: boolean;
  /** Whether user responded correctly */
  responseCorrect: boolean | null;
  /** Feedback message */
  feedbackMessage: string;
  /** Trial number */
  trialNumber: number;
  /** Total trials */
  totalTrials: number;
  /** Whether in practice mode */
  isPractice: boolean;
  /** Current score */
  score: number;
  /** Running stats */
  switchTrials: number;
  stayTrials: number;
  correctSwitches: number;
  incorrectSwitches: number;
  correctStays: number;
  incorrectStays: number;
  perseverativeErrors: number;
}

/**
 * Rule Switch game implementation.
 *
 * Mechanic:
 * 1. A rule is displayed (e.g., "Match by COLOR")
 * 2. A target stimulus appears with multiple attributes
 * 3. User must select the stimulus that matches the target on the current rule
 * 4. Occasionally the rule changes (switch trial)
 * 5. User must detect the rule change and adapt
 *
 * Metrics:
 * - switch cost (RT difference between switch and stay trials)
 * - post-switch errors (incorrect responses after rule change)
 * - perseverative errors (repeating the old rule after switch)
 * - accuracy per rule type
 */
export class RuleSwitchGame extends BaseGame {
  readonly key = GAME_KEY;
  readonly version = GAME_VERSION;

  private rsPhase: RSPhase = "idle";
  private gameMode: "practice" | "countdown" | "playing" | "finished" = "practice";
  private config: RuleSwitchConfig = {
    rules: [],
    switchProbability: 0.3,
    stimuliCount: 3,
    responseDeadlineMs: 4000,
  };
  private rng: () => number = () => 0;

  // Trial state
  private currentRule: RuleDefinition | null = null;
  private previousRule: RuleDefinition | null = null;
  private targetStimulus: Stimulus | null = null;
  private options: Stimulus[] = [];
  private matchIndex = -1;
  private selectedIndex = -1;
  private responded = false;
  private responseCorrect: boolean | null = null;
  private feedbackMessage = "";
  private isSwitchTrial = false;

  // Timers
  private ruleDisplayTimer: ReturnType<typeof setTimeout> | null = null;
  private deadlineTimer: ReturnType<typeof setTimeout> | null = null;
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private intermissionTimer: ReturnType<typeof setTimeout> | null = null;

  // Pause state
  private pausedPhase: RSPhase = "idle";

  // Tracking
  private practiceCount = 0;
  private scoredCount = 0;
  private maxTrials = 20;
  private score = 0;
  private responseStartMs = 0;
  private isCurrentPracticeTrial = false;

  // Metrics for summary
  private switchTrials = 0;
  private stayTrials = 0;
  private correctSwitches = 0;
  private incorrectSwitches = 0;
  private correctStays = 0;
  private incorrectStays = 0;
  private perseverativeErrors = 0;
  private switchRts: number[] = [];
  private stayRts: number[] = [];

  // ── Config ──────────────────────────────────────────────

  getConfig(difficulty: number): Record<string, unknown> {
    return getDifficultyConfig(difficulty) as unknown as Record<string, unknown>;
  }

  validateConfig(config: Record<string, unknown>): void {
    validateConfig(config as unknown as RuleSwitchConfig);
  }

  // ── Lifecycle ───────────────────────────────────────────

  protected onStart(context: GameContext): void {
    this.config = getDifficultyConfig(context.difficulty) as RuleSwitchConfig;
    this.rng = createRng(context.seed);
    this.maxTrials = context.maxTrials ?? 20;

    this.switchTrials = 0;
    this.stayTrials = 0;
    this.correctSwitches = 0;
    this.incorrectSwitches = 0;
    this.correctStays = 0;
    this.incorrectStays = 0;
    this.perseverativeErrors = 0;
    this.switchRts = [];
    this.stayRts = [];
    this.score = 0;
    this.previousRule = null;
    this.rsPhase = context.practiceTrials > 0 ? "practice" : "countdown";
    this.gameMode = context.practiceTrials > 0 ? "practice" : "countdown";

    this.beginTrial();
  }

  protected onInput(input: InputEvent): void {
    if (this.rsPhase !== "waiting") return;
    if (this.responded) return;

    if (input.type === "pointer_down" || input.type === "touch") {
      // The renderer injects cellIndex via GameShell's onCellTap
      const idx = (input as Record<string, unknown>).cellIndex ?? (input as Record<string, unknown>).optionIndex;
      if (typeof idx === "number" && idx >= 0 && idx < this.options.length) {
        this.handleSelection(idx);
      }
    }
  }

  pause(): void {
    if (this.rsPhase === "idle" || this.rsPhase === "finished" || this.rsPhase === "paused") return;
    this.pausedPhase = this.rsPhase;
    this.rsPhase = "paused";
    this.freezePausableTimers();
  }

  resume(): void {
    if (this.rsPhase !== "paused") return;
    this.rsPhase = this.pausedPhase;
    this.thawPausableTimers();
  }

  protected onPause(): void {}
  protected onResume(): void {}

  protected onFinish(): GameSummary {
    this.clearTimers();
    this.rsPhase = "finished";

    return buildSummary(
      { key: this.key, version: this.version, config: this.config as unknown as Record<string, unknown> },
      this.trials,
      { rts: [...this.switchRts, ...this.stayRts] },
    );
  }

  getPhase() {
    if (this.rsPhase === "idle") return "idle";
    if (this.rsPhase === "paused") return "paused";
    return this.gameMode;
  }

  // ── Render state ────────────────────────────────────────

  getRenderState(): Record<string, unknown> {
    return {
      phase: this.rsPhase,
      currentRule: this.currentRule,
      targetStimulus: this.targetStimulus,
      options: this.options,
      matchIndex: this.matchIndex,
      selectedIndex: this.selectedIndex,
      isSwitchTrial: this.isSwitchTrial,
      responseCorrect: this.responseCorrect,
      feedbackMessage: this.feedbackMessage,
      trialNumber: this.scoredCount + this.practiceCount,
      totalTrials: this.maxTrials,
      isPractice: this.gameMode === "practice",
      score: this.score,
      switchTrials: this.switchTrials,
      stayTrials: this.stayTrials,
      correctSwitches: this.correctSwitches,
      incorrectSwitches: this.incorrectSwitches,
      correctStays: this.correctStays,
      incorrectStays: this.incorrectStays,
      perseverativeErrors: this.perseverativeErrors,
    } satisfies RSRenderState;
  }

  // ── Trial logic ─────────────────────────────────────────

  private beginTrial(): void {
    // Determine rule (switch or stay)
    let rule: RuleDefinition;
    if (this.previousRule === null) {
      // First trial: pick random rule
      rule = getRandomRule(this.config, this.rng);
      this.isSwitchTrial = false;
    } else {
      if (shouldSwitch(this.config, this.rng)) {
        // Switch: pick a DIFFERENT rule
        const otherRules = this.config.rules.filter((r) => r !== this.previousRule);
        rule = otherRules[Math.floor(this.rng() * otherRules.length)];
        this.isSwitchTrial = true;
      } else {
        // Stay: keep the same rule
        rule = this.previousRule;
        this.isSwitchTrial = false;
      }
    }

    this.currentRule = rule;
    this.previousRule = rule;

    // Generate trial stimuli
    const trial = generateTrial(this.config, rule, this.rng);
    this.targetStimulus = trial.target;
    this.options = trial.options;
    this.matchIndex = trial.matchIndex;
    this.selectedIndex = -1;
    this.responded = false;
    this.responseCorrect = null;
    this.feedbackMessage = "";

    const isPractice = this.gameMode === "practice";
    this.isCurrentPracticeTrial = isPractice;
    const trialRecord = this.trials.startTrial({
      isPractice,
      exposureMs: this.config.responseDeadlineMs,
    });

    // Emit trial_started
    this.emitTrialStarted(trialRecord.trialId, {
      rule: rule.name,
      isSwitchTrial: this.isSwitchTrial,
      stimuliCount: this.config.stimuliCount,
      seed: Math.round(this.rng() * 100000),
    });

    // Rule display phase (800ms)
    this.rsPhase = "rule_display";
    this.armTimer("ruleDisplay", 800, () => {
      // Waiting phase
      this.rsPhase = "waiting";
      this.responseStartMs = performance.now();

      // Start response deadline
      this.armTimer("deadline", this.config.responseDeadlineMs, () => {
        this.handleTimeout();
      });
    });
  }

  private handleSelection(optionIndex: number): void {
    if (this.rsPhase !== "waiting" || this.responded) return;

    this.responded = true;
    this.clearTimers();

    this.selectedIndex = optionIndex;
    const isCorrect = optionIndex === this.matchIndex;
    const rt = Math.round(performance.now() - this.responseStartMs);

    // Track metrics
    if (this.isSwitchTrial) {
      this.switchTrials++;
      this.switchRts.push(rt);
      if (isCorrect) {
        this.correctSwitches++;
        this.score++;
      } else {
        this.incorrectSwitches++;
        // Check for perseverative error (selected same option as previous trial's correct answer)
        // For simplicity, count any error on switch trial as potentially perseverative
        this.perseverativeErrors++;
      }
    } else {
      this.stayTrials++;
      this.stayRts.push(rt);
      if (isCorrect) {
        this.correctStays++;
        this.score++;
      } else {
        this.incorrectStays++;
      }
    }

    this.responseCorrect = isCorrect;
    this.feedbackMessage = isCorrect ? "✓ Correct!" : "✗ Wrong!";

    this.trials.respond(isCorrect, {
      selectedOption: optionIndex,
      correctOption: this.matchIndex,
      reactionTimeMs: rt,
    });

    const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
    if (trial) {
      this.emitResponse(trial.trialId, {
        rule: this.currentRule?.name,
        isSwitchTrial: this.isSwitchTrial,
        selectedIndex: optionIndex,
        matchIndex: this.matchIndex,
        correct: isCorrect,
        reactionTimeMs: rt,
      });
    }

    this.rsPhase = "feedback";
    this.armTimer("feedback", 600, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private handleTimeout(): void {
    if (this.rsPhase !== "waiting" || this.responded) return;

    this.responded = true;
    this.clearTimers();

    this.feedbackMessage = "⏰ Too slow!";

    // Track as incorrect
    if (this.isSwitchTrial) {
      this.switchTrials++;
      this.incorrectSwitches++;
    } else {
      this.stayTrials++;
      this.incorrectStays++;
    }

    this.responseCorrect = false;

    this.trials.respond(false, { timeout: true });

    const trial = this.trials.completedTrials[this.trials.completedTrials.length - 1];
    if (trial) {
      this.emitResponse(trial.trialId, {
        rule: this.currentRule?.name,
        isSwitchTrial: this.isSwitchTrial,
        selectedIndex: -1,
        matchIndex: this.matchIndex,
        correct: false,
        timeout: true,
      });
    }

    this.rsPhase = "feedback";
    this.armTimer("feedback", 600, () => {
      this.trials.endTrial();
      this.nextTrial();
    });
  }

  private nextTrial(): void {
    // Track practice vs scored using a flag since rsPhase is already 'feedback' here
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
        this.rsPhase = "finished";
        return;
      }
    }

    this.armTimer("intermission", 400, () => {
      this.beginTrial();
    });
  }

  private clearTimers(): void {
    this.clearAllPausableTimers();
    if (this.ruleDisplayTimer) clearTimeout(this.ruleDisplayTimer);
    if (this.deadlineTimer) clearTimeout(this.deadlineTimer);
    if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
    if (this.intermissionTimer) clearTimeout(this.intermissionTimer);
    this.ruleDisplayTimer = null;
    this.deadlineTimer = null;
    this.feedbackTimer = null;
    this.intermissionTimer = null;
  }
}
