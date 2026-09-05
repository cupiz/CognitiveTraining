"use client";

import type { SSRenderState } from "@cog/game-stop-signal";
import { gameMeta } from "@/lib/games";
import { TrialHeader, Instruction, Stage, ProgressBar, StatChips, hexToRgba } from "@/components/game/GameFrame";
import { DirectionArrow, StopBadge } from "@/components/game/Stimulus";
import { Icon } from "@/components/ui/icons";
import { translate } from "@/lib/i18n";

interface StopSignalProps {
  renderState: SSRenderState;
  onRespond: (direction: "left" | "right") => void;
}

export function StopSignal({ renderState, onRespond }: StopSignalProps) {
  const {
    phase = "idle",
    goDirection = "right",
    showStopSignal = false,
    responded = false,
    responseCorrect = false,
    feedbackMessage = "",
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
    stopTrials = 0,
    correctGos = 0,
    failedStops = 0,
    successfulStops = 0,
    currentSsdMs = 500,
  } = renderState ?? {};

  const accent = gameMeta("stop_signal").color;
  const isGo = phase === "go";
  const isStop = phase === "stop";
  const isFixation = phase === "fixation";
  const isFeedback = phase === "feedback";
  const responsive = (isGo || isStop) && !responded;
  const showGo = (isGo || isStop) && !showStopSignal;
  const showStop = (isGo || isStop) && showStopSignal;

  const okColor = "var(--game-correct)";
  const errColor = "var(--game-wrong)";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {isFixation ? (
        <Instruction>Siap-siap…</Instruction>
      ) : showStop ? (
        <span className="flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.12em]" style={{ backgroundColor: hexToRgba("#c03f2d", 0.12), color: "var(--game-wrong)" }}>
          Jangan merespons
        </span>
      ) : showGo ? (
        <Instruction>Ketuk arah panah — cepat!</Instruction>
      ) : isFeedback ? (
        <span
          className="pop-in text-[15px] font-bold"
          style={{ color: responseCorrect ? "var(--game-correct)" : "var(--game-wrong)" }}
        >
          {feedbackMessage ? translate(feedbackMessage) : ""}
        </span>
      ) : null}

      {/* Main stage */}
      <Stage className="h-64 w-full" flush>
        {isFixation && (
          <div className="flex h-full w-full items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--game-surface-2)", border: "1px solid var(--game-line)" }}>
            <span className="text-4xl font-light" style={{ color: "var(--game-line)" }}>+</span>
          </div>
        )}

        {(showGo || showStop) && (
          <button
            type="button"
            onClick={() => {
              if (responsive && goDirection) onRespond(goDirection);
            }}
            disabled={!responsive}
            aria-label={showStop ? "Jangan merespons" : goDirection === "left" ? "Ke arah kiri" : "Ke arah kanan"}
            className={`flex h-full w-full items-center justify-center rounded-2xl transition-colors duration-150 ${
              responsive ? "cursor-pointer active:scale-[0.99]" : ""
            }`}
            style={{
              backgroundColor: showStop ? hexToRgba("#c03f2d", 0.08) : "var(--game-surface-2)",
              border: showStop ? "2px solid var(--game-wrong)" : "1px solid var(--game-line)",
            }}
          >
            {showGo && goDirection && (
              <span key={`${trialNumber}-${goDirection}`} className={`flex h-36 w-36 items-center justify-center ${isGo ? "pop-in" : ""}`}>
                <DirectionArrow direction={goDirection} className="h-full w-full" />
              </span>
            )}
            {showStop && (
              <span key={`${trialNumber}-stop`} className="pulse-glow flex h-40 w-40 items-center justify-center rounded-full">
                <StopBadge className="h-full w-full" />
              </span>
            )}
          </button>
        )}

        {isFeedback && (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl" style={{ backgroundColor: "var(--game-surface-2)", border: "1px solid var(--game-line)" }}>
            <span
              className="pop-in text-2xl font-bold"
              style={{ color: responseCorrect ? "var(--game-correct)" : "var(--game-wrong)" }}
            >
              {feedbackMessage ? translate(feedbackMessage) : ""}
            </span>
          </div>
        )}

        {phase === "idle" && (
          <div className="flex h-full w-full items-center justify-center rounded-2xl" style={{ backgroundColor: "var(--game-surface-2)", border: "1px solid var(--game-line)" }}>
            <span className="text-2xl" style={{ color: "var(--game-ink-mute)" }}>·</span>
          </div>
        )}
      </Stage>

      {/* Direction buttons */}
      {responsive && !showStop && (
        <div className="grid w-full grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onRespond("left")}
            className="flex h-16 items-center justify-center gap-2 rounded-2xl border-2 text-base font-bold transition-transform active:scale-95"
            style={{ borderColor: "var(--game-line)", color: "var(--game-ink)", backgroundColor: "var(--game-surface)" }}
          >
            <Icon name="arrow-left" className="size-5" />
            Kiri
          </button>
          <button
            type="button"
            onClick={() => onRespond("right")}
            className="flex h-16 items-center justify-center gap-2 rounded-2xl border-2 text-base font-bold transition-transform active:scale-95"
            style={{ borderColor: "var(--game-line)", color: "var(--game-ink)", backgroundColor: "var(--game-surface)" }}
          >
            Kanan
            <Icon name="arrow-right" className="size-5" />
          </button>
        </div>
      )}

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />

      <StatChips
        items={[
          { label: "Arah benar", value: correctGos, color: okColor },
          { label: "Berhasil berhenti", value: `${successfulStops}/${stopTrials}`, color: accent },
          { label: "Gagal berhenti", value: failedStops, color: errColor },
          { label: "Jeda", value: `${currentSsdMs}ms`, color: "var(--game-ink-mute)" },
        ]}
      />
    </div>
  );
}
