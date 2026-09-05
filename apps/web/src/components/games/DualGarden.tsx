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
    <div className="flex w-full flex-col items-center gap-3" style={{ maxWidth: "min(34rem, 100%)" }}>
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* Mission banner: polaroid targets per stream */}
      <div
        className="flex w-full flex-wrap items-center justify-center gap-3 rounded-2xl px-4 py-2.5"
        style={{ backgroundColor: "var(--game-surface-2)", border: "2px solid var(--game-line)" }}
        aria-label="Target kebun"
      >
        <span className="text-[13px] font-extrabold" style={{ color: "var(--game-ink)" }}>
          Misi:
        </span>
        <div className="flex flex-col items-center rounded-xl border-2 bg-white px-3 py-1 shadow-sm">
          <span aria-hidden="true" className="text-2xl leading-none">
            {targetAnimal}
          </span>
          <span className="text-[10px] font-bold text-ink-mute">jembatan</span>
        </div>
        {requireBoth && (
          <span className="text-xl font-black" style={{ color: accent }} aria-hidden="true">
            ＋
          </span>
        )}
        <div className="flex flex-col items-center rounded-xl border-2 bg-white px-3 py-1 shadow-sm">
          <span aria-hidden="true" className="text-2xl leading-none">
            {targetFruit}
          </span>
          <span className="text-[10px] font-bold text-ink-mute">kebun</span>
        </div>
        {!requireBoth && (
          <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-bold text-ink-mute">
            cukup buah saja
          </span>
        )}
      </div>

      {/* Garden scene */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 shadow-pop"
        style={{
          aspectRatio: "16 / 11",
          borderColor: "var(--game-line)",
          background: "linear-gradient(180deg, #aee3f5 0%, #cdeccd 48%, #8fd07a 100%)",
        }}
      >
        {/* sun + butterflies */}
        <div className="pointer-events-none absolute right-[6%] top-[6%] size-10 rounded-full bg-[#ffe27a] shadow-[0_0_24px_8px_rgb(255_226_122/0.55)]" />
        <div className="pointer-events-none absolute left-[12%] top-[24%] text-lg" aria-hidden="true">
          🦋
        </div>

        {/* Top stream: wooden bridge with the animal */}
        <div className="absolute inset-x-[8%] top-[12%] h-[30%]">
          {/* bridge planks */}
          <div className="absolute inset-x-0 top-0 h-[78%] overflow-hidden rounded-t-xl border-4 border-[#8a6d3b] bg-[#e8d9ae]">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(90deg, rgb(138 109 91 / 0.25) 0 10px, transparent 10px 24px)",
              }}
            />
            {showFeedback ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-xl font-black" style={{ color: feedbackTone }}>
                  {feedbackText}
                </p>
              </div>
            ) : (
              <div
                key={`${trialNumber}-${currentAnimal}`}
                className="flex h-full items-center justify-center"
                style={{ animation: "cm-bob 1.8s ease-in-out infinite" }}
              >
                <span
                  className="text-[56px] leading-none drop-shadow-md"
                  aria-label="Hewan melintas"
                >
                  {currentAnimal ?? "🐾"}
                </span>
              </div>
            )}
          </div>
          {/* bridge supports */}
          <div className="absolute bottom-0 left-[10%] h-[26%] w-3 rounded-b bg-[#8a6d3b]" />
          <div className="absolute bottom-0 right-[10%] h-[26%] w-3 rounded-b bg-[#8a6d3b]" />
        </div>

        {/* Bottom stream: orchard with the falling fruit */}
        <div className="absolute inset-x-[8%] bottom-[16%] h-[30%]">
          <div className="relative flex h-full items-center justify-center overflow-hidden rounded-xl border-4 border-[#4e8f3f] bg-[#dff3d0] shadow-inner">
            {currentFruit && !showFeedback ? (
              <span
                key={`${trialNumber}-fruit`}
                className="text-[52px] leading-none drop-shadow-md"
                style={{ animation: "cm-bob 1.6s ease-in-out infinite" }}
                aria-label="Buah di kebun"
              >
                {currentFruit}
              </span>
            ) : (
              <span className="text-4xl opacity-30" aria-hidden="true">
                🧺
              </span>
            )}
          </div>
        </div>

        {/* Marker button — wooden garden sign */}
        <button
          type="button"
          onClick={() => onCellTap(0)}
          disabled={!interactive}
          aria-label="Tandai kedua target"
          className={`absolute bottom-[2.5%] left-1/2 z-10 flex h-14 -translate-x-1/2 items-center gap-2 rounded-xl border-4 px-8 text-lg font-black text-[#3d2b12] shadow-lg transition-transform ${
            interactive ? "hover:scale-105 active:scale-90" : "opacity-50 saturate-50"
          }`}
          style={{
            background: "linear-gradient(180deg, #ffe9b8, #f2c96b)",
            borderColor: "#a5834d",
          }}
        >
          🚩 Tandai!
        </button>
      </div>

      {/* Playing hint */}
      <div
        className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5"
        style={{ backgroundColor: `${accent}12` }}
      >
        <span aria-hidden="true">💡</span>
        <p className="text-[12px] font-semibold" style={{ color: "var(--game-ink-mute)" }}>
          {requireBoth
            ? "Dua-duanya harus cocok — kalau salah satu beda, jangan ditandai!"
            : "Cukup perhatikan buahnya saja — cocok dengan target? Langsung tandai!"}
        </p>
      </div>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />
    </div>
  );
}
