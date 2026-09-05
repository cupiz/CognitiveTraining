"use client";

import type { TWRenderState } from "@cog/game-target-watch";
import { gameMeta } from "@/lib/games";
import { TrialHeader, Stage, ProgressBar, StatChips } from "@/components/game/GameFrame";
import { SymbolGlyph } from "@/components/game/Stimulus";
import { translate } from "@/lib/i18n";

interface TargetWatchProps {
  renderState: TWRenderState;
  onTap: () => void;
}

export function TargetWatch({ renderState, onTap }: TargetWatchProps) {
  const {
    phase = "idle",
    currentStimulus = null,
    stimulusIndex = 0,
    totalStimuli = 10,
    responded = false,
    responseCorrect = false,
    feedbackMessage = "",
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
    hits = 0,
    misses = 0,
    falseAlarms = 0,
    targetSymbol = "★",
  } = renderState ?? {};

  const accent = gameMeta("target_watch").color;
  const ink = "var(--game-ink)";
  const isShowing = phase === "showing";
  const isWaiting = phase === "waiting";
  const isFeedback = phase === "feedback";
  const canTap = isWaiting && !responded;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* target reminder */}
      <div className="flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "var(--game-line)", backgroundColor: "var(--game-surface-2)" }}>
        <span className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--game-ink-mute)" }}>
          Ketuk saat melihat
        </span>
        <SymbolGlyph char={targetSymbol} className="size-6" color={ink} />
      </div>

      {/* stage */}
      <Stage className="h-72 w-full" flush>
        {currentStimulus && (isShowing || isWaiting) ? (
          <button
            type="button"
            onClick={() => canTap && onTap()}
            disabled={!canTap}
            aria-label={canTap ? "Ketuk sekarang" : undefined}
            className={`flex h-full w-full items-center justify-center rounded-2xl transition-transform ${
              canTap ? "cursor-pointer active:scale-[0.98]" : ""
            }`}
            style={{ backgroundColor: "var(--game-surface-2)", border: "1px solid var(--game-line)" }}
          >
            <span
              key={`${trialNumber}-${stimulusIndex}`}
              className={`${isShowing ? "pop-in" : ""} flex h-40 w-40 items-center justify-center`}
            >
              <SymbolGlyph char={currentStimulus} className="h-full w-full" color={ink} />
            </span>
          </button>
        ) : isFeedback ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl" style={{ backgroundColor: "var(--game-surface-2)", border: "1px solid var(--game-line)" }}>
            <span
              className="pop-in text-xl font-bold"
              style={{ color: responseCorrect ? "var(--game-correct)" : "var(--game-wrong)" }}
            >
              {feedbackMessage ? translate(feedbackMessage) : ""}
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--game-surface-2)", border: "1px solid var(--game-line)" }}>
            <span className="text-2xl" style={{ color: "var(--game-ink-faint, var(--game-ink-mute))" }}>·</span>
          </div>
        )}
      </Stage>

      <div className="flex w-full items-center justify-between gap-3">
        <ProgressBar
          className="max-w-56"
          value={(stimulusIndex) / Math.max(1, totalStimuli)}
          accent={accent}
        />
        <span className="tnum text-[13px] font-bold" style={{ color: "var(--game-ink-mute)" }}>
          {Math.min(stimulusIndex + 1, totalStimuli)}/{totalStimuli}
        </span>
      </div>

      <StatChips
        items={[
          { label: "Tepat", value: hits, color: "var(--game-correct)" },
          { label: "Terlewat", value: misses, color: "var(--game-warn)" },
          { label: "Alarm palsu", value: falseAlarms, color: "var(--game-wrong)" },
        ]}
      />
    </div>
  );
}
