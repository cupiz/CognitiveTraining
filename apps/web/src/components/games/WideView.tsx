"use client";

import type { WVRenderState } from "@cog/game-wide-view";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface WideViewProps {
  renderState: WVRenderState;
  onCellTap: (cellIndex: number) => void;
}

/**
 * Star-pad positions INSIDE the circular lens view: 8 compass points on a
 * ring at 34% radius from the centre — comfortably clear of the bezel.
 */
const SLOTS: { x: number; y: number }[] = [
  { x: 50, y: 18 }, // top
  { x: 81, y: 19 }, // top-right
  { x: 82, y: 50 }, // right
  { x: 81, y: 81 }, // bottom-right
  { x: 50, y: 82 }, // bottom
  { x: 19, y: 81 }, // bottom-left
  { x: 18, y: 50 }, // left
  { x: 19, y: 19 }, // top-left
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
  const showFeedback = phase === "feedback" && feedbackKind;

  const feedbackText =
    feedbackKind === "correct"
      ? "Tepat! 🎉"
      : feedbackKind === "miss"
        ? "Sayang, tak sempat menunjuk!"
        : feedbackKind === "wrong"
          ? "Posisi lain 😅"
          : "";

  return (
    <div className="flex w-full flex-col items-center gap-3" style={{ maxWidth: "min(36rem, 100%)" }}>
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

      {/* ── Telescope device ─────────────────────────────── */}
      <div
        className="relative w-full touch-none select-none rounded-[3rem] border-4 p-4 shadow-pop"
        style={{
          borderColor: "#3a2f1d",
          background: "linear-gradient(180deg, #4a3b22 0%, #2e2517 60%, #1f180d 100%)",
        }}
      >
        {/* brass rivets on the bezel */}
        <span className="pointer-events-none absolute left-4 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#c9a44d]" />
        <span className="pointer-events-none absolute right-4 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#c9a44d]" />

        {/* ── Circular lens view ─────────────────────────── */}
        <div
          className="relative mx-auto aspect-square w-full max-w-[30rem] overflow-hidden rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 45%, #2a3c78 0%, #17224d 55%, #0a0f26 100%)",
            boxShadow:
              "inset 0 0 0 8px rgb(201 164 77 / 0.35), inset 0 0 60px 20px rgb(6 9 24 / 0.8), 0 0 0 4px rgb(0 0 0 / 0.4)",
          }}
        >
          {/* twinkling stars inside the lens */}
          {[
            [30, 30],
            [58, 22],
            [70, 40],
            [26, 52],
            [64, 62],
            [38, 68],
            [52, 36],
            [22, 38],
            [74, 58],
            [44, 74],
          ].map(([x, y], i) => (
            <span
              key={i}
              className="pointer-events-none absolute size-1 rounded-full bg-white"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                opacity: 0.4 + (i % 3) * 0.2,
                animation: `twinkle-${i % 3} ${1.8 + (i % 4) * 0.5}s ease-in-out infinite`,
              }}
            />
          ))}
          <style>{`
            @keyframes twinkle-0 { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.95; } }
            @keyframes twinkle-1 { 0%, 100% { opacity: 0.7; } 50% { opacity: 0.25; } }
            @keyframes twinkle-2 { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
            @keyframes wv-pulse { 0%, 100% { transform: translate(-50%, -50%) scale(1); } 50% { transform: translate(-50%, -50%) scale(1.12); } }
          `}</style>

          {/* soft nebula tint */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgb(80 120 200 / 0.14), transparent 55%), radial-gradient(circle at 72% 70%, rgb(150 90 200 / 0.1), transparent 50%)",
            }}
          />

          {/* ── Central telescope lens (the mini-task) ── */}
          <div
            className="absolute left-1/2 top-1/2 z-10 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 shadow-xl sm:size-32"
            style={{
              backgroundColor: "var(--game-surface-2)",
              borderColor: accent,
              boxShadow: `0 0 30px 8px ${accent}55, inset 0 0 18px rgb(0 0 0 / 0.35)`,
            }}
          >
            {centralSymbol ? (
              <span
                className={`text-5xl leading-none ${centralIsTarget ? "" : "opacity-75"}`}
                style={{ color: centralIsTarget ? accent : "var(--game-ink)" }}
                aria-label={`Simbol tengah ${centralSymbol}`}
              >
                {centralSymbol}
              </span>
            ) : (
              <span className="text-4xl opacity-30" aria-hidden="true">
                🔭
              </span>
            )}
          </div>

          {/* ── Star-pads on the ring ── */}
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
                className={`absolute z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-2xl shadow-lg transition-all sm:size-16 ${
                  probeInteractive ? "cursor-pointer" : ""
                }`}
                style={{
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  background: flashing
                    ? "radial-gradient(circle at 40% 35%, #fff2c4, #f2a532)"
                    : isCorrect
                      ? "radial-gradient(circle at 40% 35%, #b8f0cd, #2f9e63)"
                      : isProbed
                        ? "rgb(255 255 255 / 0.3)"
                        : "rgb(255 255 255 / 0.14)",
                  border: `3px solid ${flashing ? "#fff" : isCorrect ? "#2f9e63" : isProbed ? accent : "rgb(255 255 255 / 0.45)"}`,
                  boxShadow: flashing
                    ? "0 0 34px 12px rgb(255 210 90 / 0.85)"
                    : isCorrect
                      ? "0 0 18px 6px rgb(47 158 99 / 0.55)"
                      : "0 4px 10px rgb(0 0 0 / 0.5)",
                  transform: flashing
                    ? "translate(-50%, -50%) scale(1.35)"
                    : isProbed
                      ? "translate(-50%, -50%) scale(1.08)"
                      : "translate(-50%, -50%)",
                }}
              >
                {flashing && <span aria-hidden="true">🐦</span>}
                {isCorrect && !flashing && <span aria-hidden="true" className="text-white">✓</span>}
                {!flashing && !isCorrect && !isProbed && (
                  <span aria-hidden="true" className="text-base opacity-60">
                    ✦
                  </span>
                )}
              </button>
            );
          })}

          {/* gentle pulse hint during probe */}
          {probeInteractive && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 size-[68%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed"
              style={{
                borderColor: "rgb(255 255 255 / 0.25)",
                animation: "wv-pulse 2.2s ease-in-out infinite",
              }}
              aria-hidden="true"
            />
          )}

          {/* Feedback bubble inside the lens */}
          {showFeedback && (
            <div
              className={`pop-in absolute left-1/2 top-[14%] z-20 -translate-x-1/2 rounded-full border-2 px-5 py-2 text-[15px] font-black shadow-xl ${
                feedbackKind === "correct" ? "border-[#b8e3cd] bg-[#eaf9f1]" : "border-[#f3c1bd] bg-[#fdeceb]"
              }`}
              role="status"
              style={{ color: feedbackKind === "correct" ? "var(--game-correct)" : "var(--game-wrong)" }}
            >
              {feedbackText}
            </div>
          )}
        </div>
      </div>

      {/* Playing hint */}
      <div
        className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5"
        style={{ backgroundColor: `${accent}12` }}
      >
        <span aria-hidden="true">💡</span>
        <p className="text-[12px] font-semibold" style={{ color: "var(--game-ink-mute)" }}>
          {phase === "probe"
            ? "Sekarang tunjuk: di mana burung tadi berkedip?"
            : "Simbol tengah ⭐ = segera ketuk! Dan mata tetap mengawasi burung di tepi."}
        </p>
      </div>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />
    </div>
  );
}
