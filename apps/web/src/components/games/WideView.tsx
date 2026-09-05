"use client";

import type { WVRenderState } from "@cog/game-wide-view";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface WideViewProps {
  renderState: WVRenderState;
  onCellTap: (cellIndex: number) => void;
}

/** Slot positions on a ring around the centre (percent-based). */
const SLOTS: { x: number; y: number }[] = [
  { x: 10, y: 14 },
  { x: 50, y: 8 },
  { x: 90, y: 14 },
  { x: 92, y: 50 },
  { x: 90, y: 86 },
  { x: 50, y: 92 },
  { x: 10, y: 86 },
  { x: 8, y: 50 },
];

export function WideView({ renderState, onCellTap }: WideViewProps) {
  const {
    phase = "fixation",
    centralSymbol = null,
    centralIsTarget = false,
    flashPosition = -1,
    flashActive = false,
    probedSlot = -1,
    correctSlot = -1,
    feedbackKind = null,
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
  } = renderState ?? {};

  const accent = gameMeta("wide_view").color;
  const probeInteractive = phase === "probe";

  const feedbackText =
    feedbackKind === "correct"
      ? "Tepat! 🎉"
      : feedbackKind === "miss"
        ? "Sayang, tak sempat menunjuk!"
        : feedbackKind === "wrong"
          ? "Posisi lain 😅"
          : "";

  return (
    <div className="flex w-full flex-col items-center gap-3" style={{ maxWidth: "min(34rem, 100%)" }}>
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* Central task banner */}
      <div
        className="w-full rounded-2xl px-4 py-2 text-center"
        style={{ backgroundColor: "var(--game-surface-2)", border: "2px solid var(--game-line)" }}
        aria-label="Aturan tengah"
      >
        <p className="text-[13px] font-extrabold" style={{ color: "var(--game-ink)" }}>
          👁️ Awasi simbol tengah — dan ingat posisi burung 🐦 yang berkedip!
        </p>
      </div>

      {/* Observatory scene */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 shadow-pop"
        style={{
          aspectRatio: "4 / 3",
          borderColor: "var(--game-line)",
          background:
            "radial-gradient(circle at 50% 50%, #2a3c78 0%, #17224d 55%, #0d1330 100%)",
        }}
      >
        {/* vignette: telescope framing */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, transparent 42%, rgb(6 9 24 / 0.55) 100%)",
          }}
        />
        {/* stars */}
        {[
          [18, 22],
          [34, 10],
          [62, 18],
          [78, 30],
          [24, 62],
          [72, 68],
          [40, 84],
          [60, 78],
        ].map(([x, y], i) => (
          <span
            key={i}
            className="pointer-events-none absolute size-1 rounded-full bg-white/70"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        ))}

        {/* Centre: telescope lens card */}
        <div
          className="absolute left-1/2 top-1/2 z-10 flex size-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 shadow-lg"
          style={{
            backgroundColor: "var(--game-surface-2)",
            borderColor: accent,
            boxShadow: `0 0 24px 6px ${accent}55`,
          }}
        >
          {centralSymbol ? (
            <span
              className={`text-4xl leading-none ${centralIsTarget ? "" : "opacity-75"}`}
              style={{ color: centralIsTarget ? accent : "var(--game-ink)" }}
              aria-label={`Simbol tengah ${centralSymbol}`}
            >
              {centralSymbol}
            </span>
          ) : (
            <span className="text-3xl opacity-30" aria-hidden="true">
              🔭
            </span>
          )}
        </div>

        {/* Peripheral slots on the ring */}
        {SLOTS.map((slot, i) => {
          const flashing = flashActive && flashPosition === i;
          const isCorrect = correctSlot === i;
          const isProbed = probedSlot === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onCellTap(i)}
              disabled={!probeInteractive}
              aria-label={`Posisi ${i + 1}`}
              className={`absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-xl transition-all sm:size-14 ${
                probeInteractive ? "cursor-pointer hover:scale-110" : ""
              }`}
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                background: flashing
                  ? "radial-gradient(circle, #ffe27a, #f2a532)"
                  : isCorrect
                    ? "radial-gradient(circle, #b8f0cd, #2f9e63)"
                    : isProbed
                      ? "rgb(255 255 255 / 0.35)"
                      : "rgb(255 255 255 / 0.12)",
                border: `3px solid ${flashing ? "#fff" : isCorrect ? "#2f9e63" : isProbed ? accent : "rgb(255 255 255 / 0.4)"}`,
                boxShadow: flashing
                  ? "0 0 28px 10px rgb(255 210 90 / 0.8)"
                  : isCorrect
                    ? "0 0 16px 4px rgb(47 158 99 / 0.5)"
                    : undefined,
                transform: `translate(-50%, -50%) scale(${flashing ? 1.6 : 1})`,
              }}
            >
              {flashing && <span aria-hidden="true">🐦</span>}
              {isCorrect && !flashing && <span aria-hidden="true" className="text-white">✓</span>}
            </button>
          );
        })}

        {/* Feedback bubble */}
        {phase === "feedback" && feedbackKind && (
          <div
            className={`pop-in absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border-2 px-4 py-1.5 text-[14px] font-black shadow-lg ${
              feedbackKind === "correct"
                ? "border-[#b8e3cd] bg-[#eaf9f1]"
                : "border-[#f3c1bd] bg-[#fdeceb]"
            }`}
            role="status"
            style={{ color: feedbackKind === "correct" ? "var(--game-correct)" : "var(--game-wrong)" }}
          >
            {feedbackText}
          </div>
        )}
      </div>

      {/* Playing hint */}
      <div
        className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5"
        style={{ backgroundColor: `${accent}12` }}
      >
        <span aria-hidden="true">💡</span>
        <p className="text-[12px] font-semibold" style={{ color: "var(--game-ink-mute)" }}>
          Simbol tengah ⭐ = segera ketuk! Dan mata tetap mengawasi burung di tepi.
        </p>
      </div>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />
    </div>
  );
}
