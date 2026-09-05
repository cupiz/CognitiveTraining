"use client";

import type { LKRenderState } from "@cog/game-lighthouse-keeper";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface LighthouseKeeperProps {
  renderState: LKRenderState;
  onCellTap: (cellIndex: number) => void;
}

const PANE_COLORS = ["#e5484d", "#f2c94c", "#22b573", "#3b7cf5"];
const PANE_LABELS = ["merah", "kuning", "hijau", "biru"];

export function LighthouseKeeper({ renderState, onCellTap }: LighthouseKeeperProps) {
  const {
    phase = "showing",
    sequence = [],
    tappedIndices = [],
    feedbackCorrect = null,
    feedbackMessage = "",
    sequenceElapsedMs = 0,
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
    flashMs = 900,
  } = renderState ?? {};

  const accent = gameMeta("lighthouse_keeper").color;
  const interactive = phase === "waiting";
  const showing = phase === "showing";

  // Which pane is flashing right now (engine and renderer share flashMs).
  const flashIndex = showing
    ? Math.min(sequence.length - 1, Math.floor(sequenceElapsedMs / flashMs))
    : -1;
  const litPane = showing ? sequence[flashIndex] ?? -1 : -1;

  const tapCount = tappedIndices.length;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* ── Night seascape ───────────────────────────────── */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border shadow-pop"
        style={{
          aspectRatio: "16 / 10",
          borderColor: "var(--game-line)",
          perspective: "800px",
          background: "linear-gradient(180deg, #0c1330 0%, #16264f 45%, #1c3557 68%, #0e2f4a 100%)",
        }}
        aria-hidden="false"
      >
        <style>{`
          @keyframes lk-beam {
            from { transform: rotate(-38deg); }
            to { transform: rotate(38deg); }
          }
          @keyframes lk-wave {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes lk-pulse {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
          @keyframes lk-twinkle {
            0%, 100% { opacity: 0.25; }
            50% { opacity: 0.9; }
          }
        `}</style>

        {/* Stars */}
        {[
          [8, 12], [18, 22], [30, 8], [44, 18], [58, 10], [72, 24], [84, 14], [92, 30], [24, 38], [66, 36],
        ].map(([x, y], i) => (
          <span
            key={i}
            className="absolute size-1 rounded-full bg-white"
            style={{ left: `${x}%`, top: `${y}%`, animation: `lk-twinkle ${1.6 + (i % 3) * 0.7}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}
          />
        ))}

        {/* Moon */}
        <div className="absolute right-[8%] top-[9%] size-8 rounded-full bg-[#f6edd2] shadow-[0_0_24px_8px_rgb(246_237_210/0.35)]" />

        {/* Rotating beam (origin at the lantern room) */}
        <div
          className="pointer-events-none absolute left-[26%] top-[34%] z-10 h-40 w-40 origin-left"
          style={{ animation: "lk-beam 5s ease-in-out infinite alternate", transformOrigin: "0% 50%" }}
          aria-hidden="true"
        >
          <div
            className="h-full w-full"
            style={{
              background:
                "conic-gradient(from 180deg at 0% 50%, transparent 0deg, rgb(255 235 160 / 0.22) 34deg, transparent 72deg)",
              clipPath: "polygon(0 0, 100% 50%, 0 100%)",
            }}
          />
        </div>

        {/* Lighthouse tower (stacked white/red segments) */}
        <div className="absolute bottom-[16%] left-[24%] z-20 flex flex-col items-center">
          {/* lantern room */}
          <div
            className="relative z-10 flex h-9 w-16 items-center justify-center rounded-t-xl"
            style={{
              background: "linear-gradient(180deg, #3a4150, #262b36)",
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.25), 0 4px 10px rgb(0 0 0 / 0.4)",
            }}
          >
            {/* panes */}
            <div className="flex gap-1">
              {PANE_COLORS.map((color, i) => {
                const isLit = litPane === i;
                const isTappedHere = tappedIndices[0] === i && !showing;
                return (
                  <span
                    key={i}
                    className="h-6 w-2.5 rounded-[3px]"
                    style={{
                      background: isLit || isTappedHere ? color : "#151a23",
                      boxShadow:
                        isLit || isTappedHere
                          ? `0 0 14px 4px ${color}99, 0 0 3px ${color}`
                          : "inset 0 1px 2px rgb(0 0 0 / 0.7)",
                      animation: isLit ? "lk-pulse 320ms ease-in-out" : "none",
                    }}
                  />
                );
              })}
            </div>
            {/* roof */}
            <div
              className="absolute -top-2 left-1/2 h-4 w-10 -translate-x-1/2 rounded-t-md"
              style={{
                background: "linear-gradient(180deg, #d14a3c, #a0342a)",
                clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
              }}
            />
            {/* beacon light */}
            {showing && litPane >= 0 && (
              <span
                className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-white"
                style={{ boxShadow: "0 0 16px 6px rgb(255 240 180 / 0.9)" }}
              />
            )}
          </div>
          {/* tower segments */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-11"
              style={{
                height: i === 0 ? 14 : 12,
                background: i % 2 === 0 ? "#f3ede1" : "#d14a3c",
                boxShadow: i === 0 ? "inset 0 2px 0 rgb(0 0 0 / 0.15)" : undefined,
              }}
            />
          ))}
          {/* base */}
          <div
            className="h-4 w-20 rounded-t-md"
            style={{
              background: "linear-gradient(180deg, #4a5260, #333a46)",
              boxShadow: "0 6px 12px rgb(0 0 0 / 0.45)",
            }}
          />
        </div>

        {/* Rocky island */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-[8%] h-[16%] w-full"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 60V46c40 2 70-6 110-8 52-3 90 8 150 6 46-2 84-10 140-6v22Z" fill="#2a3b4e" />
          <path d="M120 42c14-8 30-8 44-3l8 12-14 8c-18-4-32-9-38-17Z" fill="#3d5268" />
        </svg>

        {/* Sea */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] overflow-hidden">
          <div
            className="flex h-full w-[200%] items-end"
            style={{ animation: "lk-wave 6s linear infinite" }}
          >
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="h-2 w-16 shrink-0 rounded-full"
                style={{
                  background: "rgb(120 200 230 / 0.35)",
                  marginLeft: i === 0 ? 0 : "12%",
                  marginBottom: 4 + (i % 3) * 5,
                }}
              />
            ))}
          </div>
        </div>

        {/* Persistent game label (E2E marker) */}
        <span className="absolute right-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white shadow-sm backdrop-blur">
          <span className="size-2 rounded-full" style={{ backgroundColor: "#f2c94c" }} />
          Penjaga Mercusuar
        </span>

        {/* Status bubble — sits below the corner badge row so they never overlap */}
        <div
          className={`absolute left-1/2 top-12 z-20 max-w-[80%] -translate-x-1/2 rounded-2xl rounded-tl-md border px-4 py-1.5 text-center shadow-pop backdrop-blur ${
            phase === "feedback"
              ? feedbackCorrect
                ? "border-[#b8e3cd] bg-[#eaf9f1]/95"
                : "border-[#f3c1bd] bg-[#fdeceb]/95"
              : "border-white/20 bg-[#101a33]/85"
          }`}
          role="status"
        >
          <p
            className="text-[14px] font-extrabold tracking-tight"
            style={{
              color:
                phase === "feedback"
                  ? feedbackCorrect
                    ? "var(--game-correct)"
                    : "var(--game-wrong)"
                  : "#e9eefb",
            }}
          >
            {phase === "feedback"
              ? feedbackMessage
              : showing
                ? "Perhatikan urutan pancarannya…"
                : "Ulangi urutan pancarannya"}
          </p>
        </div>

        {/* Sequence progress dots during waiting */}
        {!showing && phase !== "feedback" && (
          <div className="absolute bottom-[4%] right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur">
            {sequence.map((_, i) => (
              <span
                key={i}
                className="size-2 rounded-full transition-colors"
                style={{
                  backgroundColor: i < tapCount ? accent : "rgb(255 255 255 / 0.35)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Lantern panes (the repeat buttons) ───────────── */}
      <div className="flex w-full items-center justify-center gap-3" role="group" aria-label="Kaca pelita">
        {PANE_COLORS.map((color, i) => {
          const tappedAt = tappedIndices.indexOf(i);
          const disabled = !interactive;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onCellTap(i)}
              disabled={disabled}
              aria-label={`Kaca pelita ${PANE_LABELS[i]}`}
              className={`relative flex aspect-square w-14 items-center justify-center rounded-2xl border-2 shadow-md transition-[transform,box-shadow] duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 sm:w-16 ${
                interactive ? "active:scale-90" : ""
              }`}
              style={{
                backgroundColor: `${color}22`,
                borderColor: color,
                boxShadow: tappedAt >= 0 ? `0 0 16px 3px ${color}88` : undefined,
                cursor: interactive ? "pointer" : "default",
              }}
            >
              <span
                className="size-7 rounded-full sm:size-8"
                style={{
                  background: `radial-gradient(circle at 35% 30%, #ffffff, ${color})`,
                  boxShadow: `0 2px 6px rgb(0 0 0 / 0.35)`,
                }}
              />
              {tappedAt >= 0 && (
                <span
                  className="tnum absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full text-[11px] font-bold text-white shadow"
                  style={{ backgroundColor: "var(--game-ink)" }}
                  aria-hidden="true"
                >
                  {tappedAt + 1}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ProgressBar
        value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)}
        accent={accent}
      />
    </div>
  );
}