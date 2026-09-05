"use client";

import type { CTRenderState } from "@cog/game-crystal-tower";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface CrystalTowerProps {
  renderState: CTRenderState;
  onCellTap: (cellIndex: number) => void;
}

const CRYSTAL_COLORS: Record<number, { bg: string; ring: string }> = {
  1: { bg: "linear-gradient(180deg, #7fd4ff, #2f9fd4)", ring: "#1f7fae" },
  2: { bg: "linear-gradient(180deg, #9ce29a, #3da355)", ring: "#2c8040" },
  3: { bg: "linear-gradient(180deg, #ffd98a, #e8a738)", ring: "#c4841f" },
  4: { bg: "linear-gradient(180deg, #ffb3a0, #e06a55)", ring: "#c04c38" },
  5: { bg: "linear-gradient(180deg, #cdb3ff, #8f5fe0)", ring: "#6f42c0" },
  6: { bg: "linear-gradient(180deg, #ffc0e8, #e06ab8)", ring: "#c04898" },
};

export function CrystalTower({ renderState, onCellTap }: CrystalTowerProps) {
  const {
    phase = "solving",
    pegs = [[], [], []],
    selectedPeg = -1,
    moves = 0,
    moveLimit = 12,
    feedbackKind = null,
    feedbackMessage = "",
    trialNumber = 0,
    totalTrials = 6,
    isPractice = true,
    score = 0,
  } = renderState ?? {};

  const accent = gameMeta("crystal_tower").color;
  const interactive = phase === "solving" || phase === "selected";
  const showFeedback = phase === "feedback" && feedbackKind;

  return (
    <div className="flex w-full flex-col items-center gap-3" style={{ maxWidth: "min(34rem, 100%)" }}>
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* Move budget */}
      <div
        className="flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-2"
        style={{ backgroundColor: "var(--game-surface-2)", border: "2px solid var(--game-line)" }}
        aria-label="Langkah tersisa"
      >
        <span className="text-[13px] font-extrabold" style={{ color: "var(--game-ink)" }}>
          Langkah: {moves}/{moveLimit}
        </span>
        <span className="text-[12px] font-semibold" style={{ color: "var(--game-ink-mute)" }}>
          — antar semua kristal ke menara kanan
        </span>
      </div>

      {/* Towers */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 shadow-pop"
        style={{
          aspectRatio: "16 / 10",
          borderColor: "var(--game-line)",
          background: "linear-gradient(180deg, #1b2450 0%, #2a3568 60%, #3a4580 100%)",
        }}
      >
        {/* stars */}
        <div className="pointer-events-none absolute left-[10%] top-[10%] size-1.5 rounded-full bg-white/80" />
        <div className="pointer-events-none absolute right-[18%] top-[16%] size-1 rounded-full bg-white/60" />
        <div className="pointer-events-none absolute left-[45%] top-[7%] size-1 rounded-full bg-white/70" />

        {pegz(pegs).map((peg, pegIndex) => {
          const isSource = selectedPeg === pegIndex;
          return (
            <button
              key={pegIndex}
              type="button"
              onClick={() => onCellTap(pegIndex)}
              disabled={!interactive}
              aria-label={`Menara ${pegIndex + 1}${isSource ? ", kristal terangkat" : ""}`}
              className={`absolute bottom-[8%] flex h-[74%] w-[26%] flex-col-reverse items-center justify-start rounded-2xl pb-2 transition-colors ${
                interactive ? "cursor-pointer" : ""
              }`}
              style={{
                left: `${pegIndex * 34 + 4}%`,
                backgroundColor: isSource ? "rgb(255 255 255 / 0.14)" : "rgb(255 255 255 / 0.05)",
                border: `3px solid ${isSource ? accent : "rgb(255 255 255 / 0.25)"}`,
              }}
            >
              {/* base peg bar */}
              <span className="absolute bottom-0 h-2.5 w-[80%] rounded-full bg-white/30" />
              {peg.map((size) => {
                const color = CRYSTAL_COLORS[size] ?? CRYSTAL_COLORS[1];
                return (
                  <span
                    key={size}
                    className="m-0.5 rounded-lg shadow-md"
                    style={{
                      width: `${34 + size * 11}%`,
                      height: `clamp(14px, ${size * 2.4}%, 34px)`,
                      background: color.bg,
                      border: `2.5px solid ${color.ring}`,
                    }}
                  />
                );
              })}
            </button>
          );
        })}

        {/* Feedback bubble */}
        {showFeedback && (
          <div
            className={`pop-in absolute left-1/2 top-3 z-20 max-w-[86%] -translate-x-1/2 rounded-2xl rounded-tl-md border-2 px-4 py-2 text-center shadow-pop ${
              feedbackKind === "solved"
                ? "border-[#b8e3cd] bg-[#eaf9f1]/95"
                : "border-[#f3c1bd] bg-[#fdeceb]/95"
            }`}
            role="status"
          >
            <p
              className="text-[15px] font-extrabold"
              style={{ color: feedbackKind === "solved" ? "var(--game-correct)" : "var(--game-wrong)" }}
            >
              {feedbackMessage}
            </p>
          </div>
        )}
      </div>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />
    </div>
  );
}

/** Helper so the pegs prop keeps its array-of-arrays shape in JSX. */
function pegz(pegs: number[][]): number[][] {
  return pegs;
}
