/**
 * Game-agnostic "was the last response correct?" signal, derived from each
 * game's renderState. Lets shared UI (the mascot) react to right/wrong
 * answers without knowing each game's internals.
 */

export interface OutcomeSignal {
  /** true while the game is showing feedback for the last response */
  active: boolean;
  correct: boolean;
  /** changes whenever a new outcome happens (re-animates the mascot) */
  key: string;
}

type R = Record<string, unknown>;

export function feedbackFromState(gameKey: string, rs: R): OutcomeSignal {
  const phase = rs.phase as string | undefined;
  const trial = (rs.trialNumber as number | undefined) ?? 0;

  switch (gameKey) {
    case "memory_matrix":
      return {
        active: !!rs.showFeedback,
        correct: !!rs.feedbackCorrect,
        key: `mm-${trial}`,
      };
    case "target_watch":
      return {
        active: phase === "feedback",
        correct: !!rs.responseCorrect,
        key: `tw-${trial}-${(rs.stimulusIndex as number | undefined) ?? 0}`,
      };
    case "quick_match":
      return {
        active: phase === "feedback",
        correct: !!rs.responseCorrect,
        key: `qm-${trial}`,
      };
    case "stop_signal":
      return {
        active: phase === "feedback",
        correct: !!rs.responseCorrect,
        key: `ss-${trial}`,
      };
    case "rule_switch":
      return {
        active: phase === "feedback",
        correct:
          (rs.selectedIndex as number | undefined) ===
          (rs.matchIndex as number | undefined),
        key: `rs-${trial}`,
      };
    case "spice_stall":
      return {
        active: !!rs.showFeedback,
        correct: !!rs.feedbackCorrect,
        key: `sp-${trial}`,
      };
    case "red_light":
      return {
        active: phase === "feedback",
        correct: !!rs.responseCorrect,
        key: `rl-${trial}`,
      };
    case "courier_map":
      return {
        active: phase === "feedback",
        correct: (rs.feedbackKind as string | undefined) === "delivered",
        key: `cm-${trial}`,
      };
    case "lighthouse_keeper":
      return {
        active: phase === "feedback",
        correct: !!rs.feedbackCorrect,
        key: `lk-${trial}`,
      };
    case "sushi_express":
      return {
        active: phase === "feedback",
        correct: !!rs.feedbackCorrect,
        key: `sx-${trial}`,
      };
    case "crystal_palace":
      return {
        active: phase === "feedback",
        correct: !!rs.feedbackCorrect,
        key: `cp-${trial}`,
      };
    default:
      return { active: false, correct: false, key: "" };
  }
}