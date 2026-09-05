import { z } from "zod";
import { GameKey } from "../enums.js";
import { Difficulty, JsonObject } from "../types.js";

// ── Game Configuration ────────────────────────────────────

export const GameConfig = z.object({
  difficulty: Difficulty,
  seed: z.number().int().optional(),
  maxTrials: z.number().int().min(1).optional(),
  practiceTrials: z.number().int().min(0).optional(),
  extra: JsonObject.default({}),
});
export type GameConfig = z.infer<typeof GameConfig>;

// ── Game Summary (returned when a game finishes) ──────────

export const GameSummary = z.object({
  gameKey: GameKey,
  gameVersion: z.string(),
  config: GameConfig,
  totalTrials: z.number().int().min(0),
  validTrials: z.number().int().min(0),
  accuracy: z.number().min(0).max(1).optional(),
  medianRtMs: z.number().min(0).optional(),
  meanRtMs: z.number().min(0).optional(),
  rtVariability: z.number().min(0).optional(),
  omissionErrors: z.number().int().min(0),
  commissionErrors: z.number().int().min(0),
  qualityFlags: z.array(z.string()),
});
export type GameSummary = z.infer<typeof GameSummary>;

// ── Difficulty Parameters (game-specific) ─────────────────

export const MemoryMatrixDifficulty = z.object({
  gameKey: z.literal("memory_matrix"),
  gridRows: z.number().int().min(2).max(10),
  gridCols: z.number().int().min(2).max(10),
  targetCount: z.number().int().min(1).max(20),
  exposureMs: z.number().int().min(500).max(5000),
});
export type MemoryMatrixDifficulty = z.infer<typeof MemoryMatrixDifficulty>;

export const TargetWatchDifficulty = z.object({
  gameKey: z.literal("target_watch"),
  symbolsPerTrial: z.number().int().min(3).max(20),
  targetSymbol: z.string(),
  interStimulusMs: z.number().int().min(500).max(3000),
  responseDeadlineMs: z.number().int().min(1000).max(10000),
});
export type TargetWatchDifficulty = z.infer<typeof TargetWatchDifficulty>;

export const QuickMatchDifficulty = z.object({
  gameKey: z.literal("quick_match"),
  optionsCount: z.number().int().min(2).max(8),
  presentationTimeMs: z.number().int().min(200).max(5000),
  distractorCount: z.number().int().min(0).max(5),
});
export type QuickMatchDifficulty = z.infer<typeof QuickMatchDifficulty>;

export const StopSignalDifficulty = z.object({
  gameKey: z.literal("stop_signal"),
  goStimuliCount: z.number().int().min(2).max(6),
  stopSignalDelayMs: z.number().int().min(100).max(1000),
  goStimulusDurationMs: z.number().int().min(500).max(3000),
});
export type StopSignalDifficulty = z.infer<typeof StopSignalDifficulty>;

export const RuleSwitchDifficulty = z.object({
  gameKey: z.literal("rule_switch"),
  rules: z.array(z.string()).min(2).max(5),
  switchProbability: z.number().min(0.1).max(0.9),
  stimuliCount: z.number().int().min(2).max(8),
  responseDeadlineMs: z.number().int().min(1000).max(10000),
});
export type RuleSwitchDifficulty = z.infer<typeof RuleSwitchDifficulty>;

export const SpiceStallDifficulty = z.object({
  gameKey: z.literal("spice_stall"),
  orderLength: z.number().int().min(1).max(8),
  menuSize: z.number().int().min(4).max(8),
  exposureMs: z.number().int().min(700).max(3000),
  patienceMs: z.number().int().min(5000).max(15000),
  similarPairs: z.number().int().min(0).max(3),
});
export type SpiceStallDifficulty = z.infer<typeof SpiceStallDifficulty>;

export const RedLightDifficulty = z.object({
  gameKey: z.literal("red_light"),
  stopTrialProportion: z.number().min(0.1).max(0.9),
  initialStopSignalDelayMs: z.number().int().min(100).max(1000),
  ssdStepMs: z.number().int().min(10).max(100),
  minSsdMs: z.number().int().min(50).max(500),
  maxSsdMs: z.number().int().min(600).max(1500),
  goStimulusDurationMs: z.number().int().min(500).max(4000),
  goDeadlineMs: z.number().int().min(1000).max(6000),
});
export type RedLightDifficulty = z.infer<typeof RedLightDifficulty>;

// ── Flagship 3: Courier Map (Kurir Peta) ─────────────────

export const CourierMapRule = z.enum([
  "reach_flag",
  "avoid_water",
  "blue_posts_only",
  "no_toll",
]);
export type CourierMapRule = z.infer<typeof CourierMapRule>;

export const CourierMapDifficulty = z.object({
  gameKey: z.literal("courier_map"),
  mapNodes: z.number().int().min(6).max(16),
  blockedEdges: z.number().int().min(0).max(5),
  rules: z.array(CourierMapRule).min(1).max(4),
  switchProbability: z.number().min(0).max(0.4),
  deadlineMs: z.number().int().min(8000).max(25000),
});
export type CourierMapDifficulty = z.infer<typeof CourierMapDifficulty>;

// ── Flagship 4: Lighthouse Keeper (Penjaga Mercusuar) ────

export const LighthouseKeeperDifficulty = z.object({
  gameKey: z.literal("lighthouse_keeper"),
  seqLength: z.number().int().min(2).max(8),
  flashMs: z.number().int().min(400).max(1500),
  patienceMs: z.number().int().min(6000).max(20000),
});
export type LighthouseKeeperDifficulty = z.infer<typeof LighthouseKeeperDifficulty>;

// ── Flagship 5: Sushi Express ─────────────────────────────

export const SushiExpressDifficulty = z.object({
  gameKey: z.literal("sushi_express"),
  platesPerTrial: z.number().int().min(4).max(12),
  sushiTypes: z.number().int().min(2).max(5),
  targetProbability: z.number().min(0.15).max(0.6),
  beltMs: z.number().int().min(1500).max(5000),
  spawnIntervalMs: z.number().int().min(600).max(2500),
});
export type SushiExpressDifficulty = z.infer<typeof SushiExpressDifficulty>;

// ── Flagship 6: Crystal Palace (Istana Kristal) ───────────

export const CrystalPalaceDifficulty = z.object({
  gameKey: z.literal("crystal_palace"),
  gridRows: z.number().int().min(2).max(8),
  gridCols: z.number().int().min(2).max(8),
  matchCount: z.number().int().min(2).max(8),
  similarLevel: z.number().int().min(0).max(3),
  deadlineMs: z.number().int().min(8000).max(25000),
});
export type CrystalPalaceDifficulty = z.infer<typeof CrystalPalaceDifficulty>;

export const GameDifficultyConfig = z.discriminatedUnion("gameKey", [
  MemoryMatrixDifficulty,
  TargetWatchDifficulty,
  QuickMatchDifficulty,
  StopSignalDifficulty,
  RuleSwitchDifficulty,
  SpiceStallDifficulty,
  RedLightDifficulty,
  CourierMapDifficulty,
  LighthouseKeeperDifficulty,
  SushiExpressDifficulty,
  CrystalPalaceDifficulty,
]);
export type GameDifficultyConfig = z.infer<typeof GameDifficultyConfig>;

// ── Domain Mapping ────────────────────────────────────────

export const DomainMapping = z.record(GameKey, z.record(z.string(), z.number()));
export type DomainMapping = z.infer<typeof DomainMapping>;
