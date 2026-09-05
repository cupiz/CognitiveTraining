"use client";

import type { QMRenderState } from "@cog/game-quick-match";
import { gameMeta } from "@/lib/games";
import { TrialHeader, Instruction, Stage, ProgressBar, StatChips, hexToRgba } from "@/components/game/GameFrame";
import { EmojiStimulus } from "@/components/game/Stimulus";
import { translate } from "@/lib/i18n";

interface QuickMatchProps {
  renderState: QMRenderState;
  onSelectOption: (index: number) => void;
}

export function QuickMatch({ renderState, onSelectOption }: QuickMatchProps) {
  const {
    phase = "idle",
    targetStimulus = null,
    options = [],
    selectedIndex = -1,
    responseCorrect = false,
    feedbackMessage = "",
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
    correctCount = 0,
    incorrectCount = 0,
    timeoutCount = 0,
  } = renderState ?? {};

  const accent = gameMeta("quick_match").color;
  const isPreview = phase === "preview";
  const isMatching = phase === "matching";
  const isFeedback = phase === "feedback";
  const targetIndex = (renderState as QMRenderState).targetIndex;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {isPreview ? (
        <Instruction>Ingat ini — sebentar lagi kamu cocokkan</Instruction>
      ) : isMatching ? (
        <Instruction>Temukan pasangannya</Instruction>
      ) : (
        <span
          className="pop-in text-[15px] font-bold"
          style={{ color: responseCorrect ? "var(--game-correct)" : "var(--game-wrong)" }}
        >
          {feedbackMessage ? translate(feedbackMessage) : ""}
        </span>
      )}

      {/* Target / feedback stage */}
      <Stage className="h-44 w-full" flush>
        {targetStimulus && (isPreview || isMatching) ? (
          <div
            className={`flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-2xl ${
              isPreview ? "" : "opacity-90"
            }`}
            style={{ backgroundColor: "var(--game-surface-2)", border: "1px solid var(--game-line)" }}
          >
            <span
              className={`${isPreview ? "pop-in" : ""} flex h-24 w-24 items-center justify-center`}
            >
              <EmojiStimulus emoji={targetStimulus} className="h-full w-full" />
            </span>
            {isPreview && (
              <span className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--game-ink-mute)" }}>
                Ingat
              </span>
            )}
          </div>
        ) : isFeedback ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl" style={{ backgroundColor: "var(--game-surface-2)", border: "1px solid var(--game-line)" }}>
            <span
              className="pop-in text-2xl font-bold"
              style={{ color: responseCorrect ? "var(--game-correct)" : "var(--game-wrong)" }}
            >
              {feedbackMessage ? translate(feedbackMessage) : ""}
            </span>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--game-surface-2)", border: "1px solid var(--game-line)" }}>
            <span className="text-2xl" style={{ color: "var(--game-ink-mute)" }}>·</span>
          </div>
        )}
      </Stage>

      {/* Options */}
      {(isMatching || isFeedback) && (
        <div className={`grid w-full gap-2.5 ${options.length > 4 ? "grid-cols-4" : options.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
          {options.map((option, idx) => {
            const isCorrectOption = idx === targetIndex;
            const isSelected = selectedIndex === idx;
            const interactive = isMatching;

            let bg = "var(--game-surface)";
            let border = "var(--game-line)";

            if (isFeedback) {
              if (isSelected) {
                bg = isCorrectOption ? "var(--game-correct)" : "var(--game-wrong)";
                border = bg;
              } else if (isCorrectOption) {
                bg = hexToRgba("#1e8a58", 0.14);
                border = "var(--game-correct)";
              }
            } else if (isSelected) {
              bg = hexToRgba(accent, 0.14);
              border = accent;
            }

            return (
              <button
                key={idx}
                onClick={() => interactive && onSelectOption(idx)}
                disabled={!interactive}
                aria-label={`Pilihan ${idx + 1}`}
                className={`flex aspect-square w-full items-center justify-center rounded-xl border-2 p-3 transition-[transform,background-color,border-color] duration-150 ${
                  interactive ? "cursor-pointer hover:-translate-y-0.5 active:scale-95" : ""
                } ${isFeedback && isSelected ? "pop-in" : ""}`}
                style={{ backgroundColor: bg, borderColor: border }}
              >
                <EmojiStimulus emoji={option} className="h-full w-full" />
              </button>
            );
          })}
        </div>
      )}

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />

      <StatChips
        items={[
          { label: "Benar", value: correctCount, color: "var(--game-correct)" },
          { label: "Salah", value: incorrectCount, color: "var(--game-wrong)" },
          { label: "Terlambat", value: timeoutCount, color: "var(--game-warn)" },
        ]}
      />
    </div>
  );
}
