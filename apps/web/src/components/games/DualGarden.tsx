"use client";

import type { DGRenderState } from "@cog/game-dual-garden";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface DualGardenProps {
  renderState: DGRenderState;
  onCellTap: (cellIndex: number) => void;
}

export function DualGarden({ renderState, onCellTap }: DualGardenProps) {
  const {
    phase = "round",
    currentAnimal = null,
    currentFruit = null,
    targetAnimal = "",
    targetFruit = "",
    requireBoth = false,
    awaitingResponse = false,
    feedbackKind = null,
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
  } = renderState ?? {};

  const accent = gameMeta("dual_garden").color;
  const interactive = phase === "round" && awaitingResponse;
  const showFeedback = phase === "feedback" && feedbackKind;

  const feedbackText =
    feedbackKind === "hit"
      ? "Tepat! 🎉"
      : feedbackKind === "false_alarm"
        ? "Bukan saatnya 😅"
        : feedbackKind === "miss"
          ? "Ada yang terlewat!"
          : "Bagus, tenang saja ✅";

  const feedbackTone =
    feedbackKind === "hit" || feedbackKind === "correct_rejection"
      ? "var(--game-correct)"
      : "var(--game-wrong)";

  return (
    <div className="flex w-full flex-col items-center gap-3" style={{ maxWidth: "min(32rem, 100%)" }}>
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* Mission banner: targets per stream */}
      <div
        className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl px-3 py-2"
        style={{ backgroundColor: "var(--game-surface-2)", border: "2px solid var(--game-line)" }}
        aria-label="Target kebun"
      >
        <span className="text-[13px] font-extrabold" style={{ color: "var(--game-ink)" }}>
          Misi:
        </span>
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-extrabold" style={{ backgroundColor: `${accent}1f` }}>
          <span aria-hidden="true" className="text-lg leading-none">{targetAnimal}</span> hewan
        </span>
        {requireBoth && (
          <span className="text-[13px] font-black" style={{ color: accent }}>
            ＋
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-extrabold" style={{ backgroundColor: `${accent}1f` }}>
          <span aria-hidden="true" className="text-lg leading-none">{targetFruit}</span> buah
        </span>
      </div>

      {/* Garden scene: top stream = bridge, bottom stream = falling fruit */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 shadow-pop"
        style={{
          aspectRatio: "16 / 11",
          borderColor: "var(--game-line)",
          background: "linear-gradient(180deg, #aee3f5 0%, #cdeccd 45%, #8fd07a 100%)",
        }}
      >
        {/* Top stream: bridge */}
        <div className="absolute inset-x-[6%] top-[10%] flex h-[30%] items-center justify-center rounded-2xl border-4 border-[#8a6d3b] bg-[#f2e3bd] shadow-inner">
          {showFeedback ? (
            <p className="text-xl font-black" style={{ color: feedbackTone }}>
              {feedbackText}
            </p>
          ) : currentAnimal ? (
            <span className="text-[52px] leading-none" aria-label="Hewan melintas">
              {currentAnimal}
            </span>
          ) : (
            <span className="text-4xl opacity-30">🐾</span>
          )}
        </div>

        {/* Bottom stream: orchard */}
        <div className="absolute inset-x-[6%] bottom-[16%] flex h-[30%] items-center justify-center rounded-2xl border-4 border-[#4e8f3f] bg-[#dff3d0] shadow-inner">
          {currentFruit ? (
            <span className="text-[52px] leading-none" aria-label="Buah jatuh">
              {currentFruit}
            </span>
          ) : (
            <span className="text-4xl opacity-30">🍎</span>
          )}
        </div>

        {/* Marker button */}
        <button
          type="button"
          onClick={() => onCellTap(0)}
          disabled={!interactive}
          aria-label="Tandai kedua target"
          className={`absolute bottom-[2.5%] left-1/2 z-10 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full px-8 text-lg font-black text-white shadow-lg transition-transform ${
            interactive ? "hover:scale-105 active:scale-90" : "opacity-50"
          }`}
          style={{
            background: "linear-gradient(180deg, #58c06b, #3d9e52)",
            border: "3px solid #fff",
          }}
        >
          🚩 Tandai!
        </button>
      </div>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />
    </div>
  );
}
