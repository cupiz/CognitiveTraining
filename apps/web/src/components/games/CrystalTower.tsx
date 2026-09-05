"use client";

import type { CTRenderState } from "@cog/game-crystal-tower";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface CrystalTowerProps {
  renderState: CTRenderState;
  onCellTap: (cellIndex: number) => void;
}

const CRYSTAL_COLORS: Record<number, { bg: string; ring: string; glow: string }> = {
  1: { bg: "linear-gradient(180deg, #7fd4ff, #2f9fd4)", ring: "#1f7fae", glow: "rgb(47 159 212 / 0.55)" },
  2: { bg: "linear-gradient(180deg, #9ce29a, #3da355)", ring: "#2c8040", glow: "rgb(61 163 85 / 0.55)" },
  3: { bg: "linear-gradient(180deg, #ffd98a, #e8a738)", ring: "#c4841f", glow: "rgb(232 167 56 / 0.55)" },
  4: { bg: "linear-gradient(180deg, #ffb3a0, #e06a55)", ring: "#c04c38", glow: "rgb(224 106 85 / 0.55)" },
  5: { bg: "linear-gradient(180deg, #cdb3ff, #8f5fe0)", ring: "#6f42c0", glow: "rgb(143 95 224 / 0.55)" },
  6: { bg: "linear-gradient(180deg, #ffc0e8, #e06ab8)", ring: "#c04898", glow: "rgb(224 106 184 / 0.55)" },
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

      {/* Move budget HUD */}
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

      {/* Night palace scene */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 shadow-pop"
        style={{
          aspectRatio: "16 / 10",
          borderColor: "var(--game-line)",
          background: "linear-gradient(180deg, #0f1730 0%, #1b2450 55%, #2a3568 100%)",
        }}
      >
        {/* moon + stars */}
        <div className="pointer-events-none absolute right-[10%] top-[8%] size-9 rounded-full bg-[#fff3c4] shadow-[0_0_26px_8px_rgb(255_243_196/0.5)]" />
        <div className="pointer-events-none absolute left-[12%] top-[14%] size-1 rounded-full bg-white/80" />
        <div className="pointer-events-none absolute left-[42%] top-[6%] size-1 rounded-full bg-white/70" />
        <div className="pointer-events-none absolute right-[38%] top-[20%] size-1 rounded-full bg-white/60" />
        <div className="pointer-events-none absolute left-[26%] top-[30%] size-1 rounded-full bg-white/50" />

        {/* mountains silhouette */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[30%] h-[22%]">
          <div className="absolute left-[-6%] bottom-0 size-0 border-b-[80px] border-l-[80px] border-r-[80px] border-b-[#141c3a] border-l-transparent border-r-transparent" />
          <div className="absolute right-[-4%] bottom-0 size-0 border-b-[60px] border-l-[70px] border-r-[70px] border-b-[#1a2448] border-l-transparent border-r-transparent" />
        </div>

        {/* Three pedestals */}
        {pegs.map((peg, pegIndex) => {
          const isSource = selectedPeg === pegIndex;
          const isGoal = pegIndex === 2;
          return (
            <button
              key={pegIndex}
              type="button"
              onClick={() => onCellTap(pegIndex)}
              disabled={!interactive}
              aria-label={`Menara ${pegIndex + 1}${isSource ? ", kristal terangkat" : ""}${isGoal ? ", tujuan" : ""}`}
              className={`absolute bottom-[10%] flex h-[64%] w-[27%] flex-col-reverse items-center justify-start rounded-t-2xl pb-3 transition-all ${
                interactive ? "cursor-pointer" : ""
              }`}
              style={{
                left: `${pegIndex * 33 + 4.5}%`,
                backgroundColor: isSource ? "rgb(122 162 255 / 0.18)" : "rgb(255 255 255 / 0.05)",
                border: `3px solid ${isSource ? accent : isGoal ? "rgb(242 201 76 / 0.55)" : "rgb(255 255 255 / 0.22)"}`,
                borderRadius: "18px 18px 8px 8px",
              }}
            >
              {isGoal && (
                <span className="absolute -top-7 text-lg" aria-hidden="true">
                  🎯
                </span>
              )}
              {peg.map((size, i) => {
                const color = CRYSTAL_COLORS[size] ?? CRYSTAL_COLORS[1];
                const lifted = isSource && i === peg.length - 1;
                return (
                  <span
                    key={`${size}-${i}`}
                    className="relative m-0.5 rounded-md"
                    style={{
                      width: `${36 + size * 10}%`,
                      height: `clamp(15px, ${size * 2.2}%, 30px)`,
                      background: color.bg,
                      border: `2.5px solid ${color.ring}`,
                      boxShadow: `0 0 14px 3px ${color.glow}${lifted ? ", 0 0 26px 8px rgb(255 255 255 / 0.35)" : ""}`,
                      transform: lifted ? "translateY(-14px)" : undefined,
                      transition: "transform 160ms ease, box-shadow 160ms ease",
                    }}
                  />
                );
              })}
              <span className="absolute bottom-[-8px] h-3 w-[86%] rounded-md bg-[#3c4568] shadow-md" />
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
              style={{
                color: feedbackKind === "solved" ? "var(--game-correct)" : "var(--game-wrong)",
              }}
            >
              {feedbackMessage}
            </p>
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
          Rencanakan dulu dari kristal terkecil — langkah yang salah tetap dihitung, jadi rencanakan dulu!
        </p>
      </div>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />
    </div>
  );
}
