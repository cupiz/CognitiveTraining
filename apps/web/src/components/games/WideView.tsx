"use client";

import type { WVRenderState } from "@cog/game-wide-view";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface WideViewProps {
  renderState: WVRenderState;
  onCellTap: (cellIndex: number) => void;
}

/**
 * Star-pad positions INSIDE the circular lens: 8 compass points on a ring
 * at 30% radius from the centre — far from the lens edge, nothing overlaps.
 */
const SLOTS: { x: number; y: number }[] = [
  { x: 50, y: 20 }, // top
  { x: 71, y: 29 }, // top-right
  { x: 80, y: 50 }, // right
  { x: 71, y: 71 }, // bottom-right
  { x: 50, y: 80 }, // bottom
  { x: 29, y: 71 }, // bottom-left
  { x: 20, y: 50 }, // left
  { x: 29, y: 29 }, // top-left
];

/** Compass names for the miss feedback — kids learn where they missed. */
const SLOT_NAMES = [
  "atas",
  "kanan-atas",
  "kanan",
  "kanan-bawah",
  "bawah",
  "kiri-bawah",
  "kiri",
  "kiri-atas",
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

      {/* ── Central mini-task: its own banner, can never cover the sky ── */}
      <div
        className="flex w-full items-center justify-center gap-4 rounded-2xl border-2 px-4 py-3"
        style={{ backgroundColor: "var(--game-surface-2)", borderColor: accent }}
        aria-label="Tugas tengah"
      >
        <div
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl border-4 text-3xl font-black shadow-inner"
          style={{ borderColor: accent, color: centralIsTarget ? accent : "var(--game-ink)" }}
          aria-label={`Simbol tengah ${centralSymbol ?? ""}`}
        >
          {centralSymbol ?? "👁️"}
        </div>
        <div>
          <p className="text-[13px] font-extrabold" style={{ color: "var(--game-ink)" }}>
            {centralIsTarget ? "⭐ Simbol ini = SEGERA KETUK layar!" : "Simbol biasa — jangan diketuk"}
          </p>
          <p className="text-[12px] font-semibold" style={{ color: "var(--game-ink-mute)" }}>
            Sambil mengintip burung 🐦 yang berkedip di teleskop bawah
          </p>
        </div>
      </div>

      {/* ── Telescope: circular lens with ONLY the star-pads inside ── */}
      <div
        className="relative w-full touch-none select-none rounded-[3rem] border-4 p-5 shadow-pop"
        style={{
          borderColor: "#3a2f1d",
          background: "linear-gradient(180deg, #4a3b22 0%, #2e2517 60%, #1f180d 100%)",
        }}
      >
        <span className="pointer-events-none absolute left-4 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#c9a44d]" />
        <span className="pointer-events-none absolute right-4 top-1/2 size-2 -translate-y-1/2 rounded-full bg-[#c9a44d]" />

        <div
          className="relative mx-auto aspect-square w-full max-w-[28rem] overflow-hidden rounded-full"
          style={{
            background: "radial-gradient(circle at 50% 45%, #2a3c78 0%, #17224d 55%, #0a0f26 100%)",
            boxShadow:
              "inset 0 0 0 8px rgb(201 164 77 / 0.35), inset 0 0 60px 20px rgb(6 9 24 / 0.8), 0 0 0 4px rgb(0 0 0 / 0.4)",
          }}
        >
          <style>{`
            @keyframes wv-twinkle { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.9; } }
            @keyframes wv-pulse { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.06); opacity: 0.9; } }
          `}</style>

          {/* twinkling stars */}
          {[
            [30, 26],
            [58, 20],
            [72, 38],
            [24, 44],
            [68, 60],
            [36, 66],
            [50, 36],
            [20, 34],
            [76, 56],
            [44, 76],
          ].map(([x, y], i) => (
            <span
              key={i}
              className="pointer-events-none absolute size-1 rounded-full bg-white"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                animation: `wv-twinkle ${1.8 + (i % 4) * 0.5}s ease-in-out infinite`,
                animationDelay: `${(i % 5) * 0.3}s`,
              }}
            />
          ))}

          {/* nebula tint */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 30% 30%, rgb(80 120 200 / 0.14), transparent 55%), radial-gradient(circle at 72% 70%, rgb(150 90 200 / 0.1), transparent 50%)",
            }}
          />

          {/* ── The 8 star-pads (the ONLY interactive things here) ── */}
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
                className={`absolute z-10 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-2xl transition-all sm:size-20 sm:text-3xl ${
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
                    ? "0 0 40px 16px rgb(255 210 90 / 0.85)"
                    : isCorrect
                      ? "0 0 20px 8px rgb(47 158 99 / 0.55)"
                      : "0 4px 12px rgb(0 0 0 / 0.55)",
                  transform: flashing
                    ? "translate(-50%, -50%) scale(1.3)"
                    : isProbed
                      ? "translate(-50%, -50%) scale(1.08)"
                      : "translate(-50%, -50%)",
                }}
              >
                {flashing && <span aria-hidden="true">🐦</span>}
                {isCorrect && !flashing && <span aria-hidden="true" className="text-white">✓</span>}
                {!flashing && !isCorrect && !isProbed && (
                  <span aria-hidden="true" className="text-xl opacity-70">
                    ✦
                  </span>
                )}
              </button>
            );
          })}

          {/* gentle pulse hint during probe */}
          {probeInteractive && (
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 size-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed"
              style={{
                borderColor: "rgb(255 255 255 / 0.22)",
                animation: "wv-pulse 2.4s ease-in-out infinite",
              }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* ── Feedback row: reserved height, its own line ── */}
      <div className="flex h-9 w-full items-center justify-center" aria-live="polite">
        {showFeedback && (
          <div
            className={`pop-in rounded-full border-2 px-5 py-1.5 text-[15px] font-black shadow-md ${
              feedbackKind === "correct" ? "border-[#b8e3cd] bg-[#eaf9f1]" : "border-[#f3c1bd] bg-[#fdeceb]"
            }`}
            style={{ color: feedbackKind === "correct" ? "var(--game-correct)" : "var(--game-wrong)" }}
          >
            {feedbackKind === "correct"
              ? feedbackText
              : `${feedbackText} Burung ada di posisi ${correctSlot + 1} (${SLOT_NAMES[correctSlot] ?? "?"}).`}
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
          {phase === "probe"
            ? "Sekarang tunjuk: di mana burung tadi berkedip?"
            : "Simbol tengah ⭐ = segera ketuk! Dan mata tetap mengawasi burung di teleskop."}
        </p>
      </div>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />
    </div>
  );
}
