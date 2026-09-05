"use client";

import type { RSRenderState } from "@cog/game-rule-switch";
import { gameMeta } from "@/lib/games";
import { TrialHeader, Stage, ProgressBar, StatChips, hexToRgba } from "@/components/game/GameFrame";
import { RuleStimulus, type RuleStimulusData } from "@/components/game/Stimulus";
import { Icon } from "@/components/ui/icons";
import { translate } from "@/lib/i18n";

interface RuleSwitchProps {
  renderState: RSRenderState;
  onSelectOption: (index: number) => void;
}

export function RuleSwitch({ renderState, onSelectOption }: RuleSwitchProps) {
  const {
    phase = "idle",
    currentRule = null,
    targetStimulus = null,
    options = [],
    matchIndex = 0,
    selectedIndex = -1,
    isSwitchTrial = false,
    feedbackMessage = "",
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
    switchTrials = 0,
    stayTrials = 0,
    correctSwitches = 0,
    perseverativeErrors = 0,
  } = renderState ?? {};

  const accent = gameMeta("rule_switch").color;
  const isRuleDisplay = phase === "rule_display";
  const isWaiting = phase === "waiting";
  const isFeedback = phase === "feedback";
  const interactive = isWaiting;

  const instruction = currentRule ? currentRule.instruction : "";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* Rule pill */}
      <div
        key={`${trialNumber}-rule`}
        className="pop-in flex items-center gap-2.5 rounded-full py-2 pl-4 pr-2.5 text-[14px] font-bold uppercase tracking-[0.08em]"
        style={{
          backgroundColor: isSwitchTrial ? "var(--game-warn-tint)" : hexToRgba(accent, 0.1),
          color: isSwitchTrial ? "var(--game-warn)" : accent,
          border: `1.5px solid ${isSwitchTrial ? "var(--game-warn)" : accent}`,
        }}
      >
        {isSwitchTrial && (
          <span className="flex size-6 items-center justify-center rounded-full" style={{ backgroundColor: "var(--game-warn)", color: "#fff" }}>
            <Icon name="activity" className="size-3.5" />
          </span>
        )}
        <span>{translate(instruction)}</span>
        {isSwitchTrial && (
          <span
            className="rounded-full px-2 py-1 text-[10px] font-bold tracking-[0.14em]"
            style={{ backgroundColor: "var(--game-warn)", color: "#fff" }}
          >
            Berubah
          </span>
        )}
      </div>

      {/* Stage: target + options */}
      <Stage className="w-full flex-col gap-5 px-4 py-6" flush>
        <div className="flex flex-col items-center gap-1">
          {targetStimulus && (isRuleDisplay || isWaiting || isFeedback) && (
            <span key={`${trialNumber}-target`} className={`${isRuleDisplay ? "pop-in" : ""} flex h-24 w-24 items-center justify-center`}>
              <RuleStimulus stimulus={targetStimulus as RuleStimulusData} className="h-full w-full" />
            </span>
          )}
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--game-ink-mute)" }}>
            Target
          </span>
        </div>

        {!isRuleDisplay && (
          <>
            <span className="text-[13px] font-semibold" style={{ color: "var(--game-ink-mute)" }}>
              {isWaiting ? "Manakah yang cocok dengan aturan?" : translate(feedbackMessage)}
            </span>
            <div className={`grid w-full gap-2.5 ${options.length === 3 ? "grid-cols-3" : "grid-cols-4"}`}>
              {options.map((option, idx) => {
                const isCorrectOption = idx === matchIndex;
                const isSelected = selectedIndex === idx;

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
                    <RuleStimulus stimulus={option as RuleStimulusData} className="h-full w-full" />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {isRuleDisplay && (
          <span className="text-[13px]" style={{ color: "var(--game-ink-mute)" }}>
            Cocokkan target sesuai aturan di atas
          </span>
        )}
      </Stage>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />

      <StatChips
        items={[
          { label: "Benar usai ganti", value: `${correctSwitches}/${switchTrials}`, color: accent },
          { label: "Percobaan ganti", value: switchTrials, color: "var(--game-warn)" },
          { label: "Masih aturan lama", value: perseverativeErrors, color: "var(--game-wrong)" },
          { label: "Aturan tetap", value: stayTrials, color: "var(--game-ink-mute)" },
        ]}
      />
    </div>
  );
}
