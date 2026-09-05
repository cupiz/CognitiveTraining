import { describe, it, expect } from "vitest";
import {
  GameConfig,
  GameSummary,
  GameDifficultyConfig,
  MemoryMatrixDifficulty,
  StopSignalDifficulty,
  RuleSwitchDifficulty,
  SpiceStallDifficulty,
  RedLightDifficulty,
  CourierMapDifficulty,
  LighthouseKeeperDifficulty,
  SushiExpressDifficulty,
  CrystalPalaceDifficulty,
} from "./index.js";

// ── GameConfig ────────────────────────────────────────────

describe("GameConfig", () => {
  it("accepts valid config with defaults", () => {
    const result = GameConfig.safeParse({ difficulty: 4 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.extra).toEqual({});
    }
  });

  it("rejects difficulty < 1", () => {
    const result = GameConfig.safeParse({ difficulty: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects difficulty > 10", () => {
    const result = GameConfig.safeParse({ difficulty: 11 });
    expect(result.success).toBe(false);
  });

  it("accepts optional seed", () => {
    const result = GameConfig.safeParse({ difficulty: 5, seed: 12345 });
    expect(result.success).toBe(true);
  });
});

// ── GameSummary ───────────────────────────────────────────

describe("GameSummary", () => {
  it("accepts valid summary", () => {
    const result = GameSummary.safeParse({
      gameKey: "memory_matrix",
      gameVersion: "1.0.0",
      config: { difficulty: 4 },
      totalTrials: 20,
      validTrials: 18,
      accuracy: 0.85,
      medianRtMs: 650,
      meanRtMs: 700,
      rtVariability: 120,
      omissionErrors: 2,
      commissionErrors: 0,
      qualityFlags: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects accuracy > 1", () => {
    const result = GameSummary.safeParse({
      gameKey: "memory_matrix",
      gameVersion: "1.0.0",
      config: { difficulty: 4 },
      totalTrials: 20,
      validTrials: 18,
      accuracy: 1.5,
      medianRtMs: 650,
      meanRtMs: 700,
      rtVariability: 120,
      omissionErrors: 0,
      commissionErrors: 0,
      qualityFlags: [],
    });
    expect(result.success).toBe(false);
  });
});

// ── GameDifficultyConfig discriminated union ──────────────

describe("GameDifficultyConfig", () => {
  it("accepts MemoryMatrix config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "memory_matrix",
      gridRows: 4,
      gridCols: 4,
      targetCount: 5,
      exposureMs: 1200,
    });
    expect(result.success).toBe(true);
  });

  it("accepts TargetWatch config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "target_watch",
      symbolsPerTrial: 10,
      targetSymbol: "★",
      interStimulusMs: 1000,
      responseDeadlineMs: 3000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts QuickMatch config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "quick_match",
      optionsCount: 4,
      presentationTimeMs: 2000,
      distractorCount: 2,
    });
    expect(result.success).toBe(true);
  });

  it("accepts StopSignal config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "stop_signal",
      goStimuliCount: 4,
      stopSignalDelayMs: 300,
      goStimulusDurationMs: 1000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts RuleSwitch config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "rule_switch",
      rules: ["color", "shape"],
      switchProbability: 0.3,
      stimuliCount: 4,
      responseDeadlineMs: 3000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts SpiceStall config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "spice_stall",
      orderLength: 4,
      menuSize: 5,
      exposureMs: 1900,
      patienceMs: 10000,
      similarPairs: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts RedLight config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "red_light",
      stopTrialProportion: 0.3,
      initialStopSignalDelayMs: 430,
      ssdStepMs: 40,
      minSsdMs: 120,
      maxSsdMs: 900,
      goStimulusDurationMs: 1700,
      goDeadlineMs: 2500,
    });
    expect(result.success).toBe(true);
  });

  it("accepts CourierMap config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "courier_map",
      mapNodes: 10,
      blockedEdges: 2,
      rules: ["reach_flag", "avoid_water"],
      switchProbability: 0.25,
      deadlineMs: 16000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts LighthouseKeeper config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "lighthouse_keeper",
      seqLength: 5,
      flashMs: 900,
      patienceMs: 12000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts SushiExpress config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "sushi_express",
      platesPerTrial: 8,
      sushiTypes: 3,
      targetProbability: 0.3,
      beltMs: 2600,
      spawnIntervalMs: 1000,
    });
    expect(result.success).toBe(true);
  });

  it("accepts CrystalPalace config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "crystal_palace",
      gridRows: 5,
      gridCols: 5,
      matchCount: 4,
      similarLevel: 2,
      deadlineMs: 16000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched gameKey for config", () => {
    const result = GameDifficultyConfig.safeParse({
      gameKey: "memory_matrix",
      symbolsPerTrial: 10,
      targetSymbol: "★",
      interStimulusMs: 1000,
      responseDeadlineMs: 3000,
    });
    expect(result.success).toBe(false);
  });
});

// ── Individual difficulty configs ─────────────────────────

describe("MemoryMatrixDifficulty", () => {
  it("rejects gridRows < 2", () => {
    const result = MemoryMatrixDifficulty.safeParse({
      gameKey: "memory_matrix",
      gridRows: 1,
      gridCols: 4,
      targetCount: 5,
      exposureMs: 1200,
    });
    expect(result.success).toBe(false);
  });

  it("rejects targetCount > 20", () => {
    const result = MemoryMatrixDifficulty.safeParse({
      gameKey: "memory_matrix",
      gridRows: 4,
      gridCols: 4,
      targetCount: 25,
      exposureMs: 1200,
    });
    expect(result.success).toBe(false);
  });
});

describe("StopSignalDifficulty", () => {
  it("rejects stopSignalDelayMs < 100", () => {
    const result = StopSignalDifficulty.safeParse({
      gameKey: "stop_signal",
      goStimuliCount: 4,
      stopSignalDelayMs: 50,
      goStimulusDurationMs: 1000,
    });
    expect(result.success).toBe(false);
  });
});

describe("RedLightDifficulty", () => {
  it("rejects stopTrialProportion >= 1", () => {
    const result = RedLightDifficulty.safeParse({
      gameKey: "red_light",
      stopTrialProportion: 1,
      initialStopSignalDelayMs: 550,
      ssdStepMs: 50,
      minSsdMs: 200,
      maxSsdMs: 900,
      goStimulusDurationMs: 2500,
      goDeadlineMs: 3000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects minSsdMs >= maxSsdMs", () => {
    const result = RedLightDifficulty.safeParse({
      gameKey: "red_light",
      stopTrialProportion: 0.2,
      initialStopSignalDelayMs: 550,
      ssdStepMs: 50,
      minSsdMs: 900,
      maxSsdMs: 200,
      goStimulusDurationMs: 2500,
      goDeadlineMs: 3000,
    });
    expect(result.success).toBe(false);
  });
});

describe("SpiceStallDifficulty", () => {
  it("rejects orderLength > 8", () => {
    const result = SpiceStallDifficulty.safeParse({
      gameKey: "spice_stall",
      orderLength: 9,
      menuSize: 8,
      exposureMs: 900,
      patienceMs: 6500,
      similarPairs: 3,
    });
    expect(result.success).toBe(false);
  });

  it("rejects menuSize < 4", () => {
    const result = SpiceStallDifficulty.safeParse({
      gameKey: "spice_stall",
      orderLength: 2,
      menuSize: 3,
      exposureMs: 2500,
      patienceMs: 12000,
      similarPairs: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe("CourierMapDifficulty", () => {
  it("rejects mapNodes < 6", () => {
    const result = CourierMapDifficulty.safeParse({
      gameKey: "courier_map",
      mapNodes: 5,
      blockedEdges: 0,
      rules: ["reach_flag"],
      switchProbability: 0,
      deadlineMs: 20000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects switchProbability > 0.4", () => {
    const result = CourierMapDifficulty.safeParse({
      gameKey: "courier_map",
      mapNodes: 10,
      blockedEdges: 2,
      rules: ["reach_flag", "avoid_water"],
      switchProbability: 0.5,
      deadlineMs: 16000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown rule id", () => {
    const result = CourierMapDifficulty.safeParse({
      gameKey: "courier_map",
      mapNodes: 10,
      blockedEdges: 2,
      rules: ["teleport"],
      switchProbability: 0.2,
      deadlineMs: 16000,
    });
    expect(result.success).toBe(false);
  });
});

describe("LighthouseKeeperDifficulty", () => {
  it("rejects seqLength > 8", () => {
    const result = LighthouseKeeperDifficulty.safeParse({
      gameKey: "lighthouse_keeper",
      seqLength: 9,
      flashMs: 900,
      patienceMs: 12000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects flashMs < 400", () => {
    const result = LighthouseKeeperDifficulty.safeParse({
      gameKey: "lighthouse_keeper",
      seqLength: 4,
      flashMs: 300,
      patienceMs: 12000,
    });
    expect(result.success).toBe(false);
  });
});

describe("SushiExpressDifficulty", () => {
  it("rejects platesPerTrial > 12", () => {
    const result = SushiExpressDifficulty.safeParse({
      gameKey: "sushi_express",
      platesPerTrial: 15,
      sushiTypes: 3,
      targetProbability: 0.3,
      beltMs: 2600,
      spawnIntervalMs: 1000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects targetProbability > 0.6", () => {
    const result = SushiExpressDifficulty.safeParse({
      gameKey: "sushi_express",
      platesPerTrial: 8,
      sushiTypes: 3,
      targetProbability: 0.8,
      beltMs: 2600,
      spawnIntervalMs: 1000,
    });
    expect(result.success).toBe(false);
  });
});

describe("CrystalPalaceDifficulty", () => {
  it("rejects gridRows > 8", () => {
    const result = CrystalPalaceDifficulty.safeParse({
      gameKey: "crystal_palace",
      gridRows: 9,
      gridCols: 5,
      matchCount: 4,
      similarLevel: 2,
      deadlineMs: 16000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects similarLevel > 3", () => {
    const result = CrystalPalaceDifficulty.safeParse({
      gameKey: "crystal_palace",
      gridRows: 5,
      gridCols: 5,
      matchCount: 4,
      similarLevel: 4,
      deadlineMs: 16000,
    });
    expect(result.success).toBe(false);
  });
});

describe("RuleSwitchDifficulty", () => {
  it("rejects switchProbability < 0.1", () => {
    const result = RuleSwitchDifficulty.safeParse({
      gameKey: "rule_switch",
      rules: ["color", "shape"],
      switchProbability: 0.05,
      stimuliCount: 4,
      responseDeadlineMs: 3000,
    });
    expect(result.success).toBe(false);
  });

  it("rejects < 2 rules", () => {
    const result = RuleSwitchDifficulty.safeParse({
      gameKey: "rule_switch",
      rules: ["color"],
      switchProbability: 0.3,
      stimuliCount: 4,
      responseDeadlineMs: 3000,
    });
    expect(result.success).toBe(false);
  });
});
