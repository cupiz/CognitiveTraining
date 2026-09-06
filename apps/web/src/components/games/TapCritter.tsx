"use client";

import type { TCRenderState } from "@cog/game-tap-critter";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface TapCritterProps {
  renderState: TCRenderState;
  onCellTap: (cellIndex: number) => void;
}

export function TapCritter({ renderState, onCellTap }: TapCritterProps) {
  const {
    phase = "pop",
    currentHole = -1,
    currentKind = null,
    lastTapped = -1,
    feedbackKind = null,
    holeCount = 3,
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
  } = renderState ?? {};

  const accent = gameMeta("tap_critter").color;
  const interactive = phase === "pop";
  const showFeedback = phase === "between" && feedbackKind !== null;

  // Garden rows: 3 holes → 1 row; 4-6 holes → 2 rows of 3
  const rows: number[][] = [];
  for (let h = 0; h < holeCount; h += 3) {
    rows.push(Array.from({ length: Math.min(3, holeCount - h) }, (_, i) => h + i));
  }

  const feedbackText =
    feedbackKind === "caught"
      ? "Kena! 🎉"
      : feedbackKind === "wrong"
        ? "Aduh, yang berduri! 🌵"
        : feedbackKind === "missed"
          ? "Kelewat — besok lebih cepat!"
          : feedbackKind === "avoided"
            ? "Hebat, hindari duri ✅"
            : "";

  return (
    <div className="flex w-full flex-col items-center gap-3" style={{ maxWidth: "min(40rem, 100%)" }}>
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* Rule banner */}
      <div
        className="w-full rounded-2xl px-4 py-2.5 text-center"
        style={{ backgroundColor: "var(--game-surface-2)", border: "2px solid var(--game-line)" }}
        aria-label="Aturan taman"
      >
        <p className="text-[14px] font-extrabold" style={{ color: "var(--game-ink)" }}>
          🐹 Ketuk makhluk yang muncul — tapi hati-hati, jangan ketuk kaktus 🌵!
        </p>
      </div>

      {/* Garden scene */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 shadow-pop"
        style={{
          aspectRatio: "16 / 10",
          borderColor: "var(--game-line)",
          background: "linear-gradient(180deg, #9fdcf5 0%, #c8ecd2 40%, #8fce74 70%, #6db85c 100%)",
        }}
      >
        {/* sun + clouds */}
        <div className="pointer-events-none absolute right-[7%] top-[7%] size-11 rounded-full bg-[#ffe27a] shadow-[0_0_26px_8px_rgb(255_226_122/0.6)]" />
        <div className="pointer-events-none absolute left-[8%] top-[10%] flex items-center">
          <span className="size-9 rounded-full bg-white/85" />
          <span className="-ml-3 size-7 rounded-full bg-white/85" />
        </div>

        {/* Hole rows */}
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} className="absolute inset-x-[6%] flex justify-around" style={{ top: `${28 + rowIdx * 34}%` }}>
            {row.map((holeGlobalIdx, i) => {
              const isCurrent = currentHole === holeGlobalIdx && phase === "pop";
              const tappedHere = lastTapped === holeGlobalIdx;
                            const stung = tappedHere && feedbackKind === "wrong";
              const missed = !tappedHere && feedbackKind === "missed" && currentKind === "critter" && isCurrent;
              const holeHasPop = isCurrent || (phase === "between" && (feedbackKind === "caught" || feedbackKind === "wrong") && tappedHere && holeGlobalIdx === lastTapped);
              return (
                <button
                  key={holeGlobalIdx}
                  type="button"
                  onClick={() => onCellTap(holeGlobalIdx)}
                  disabled={!interactive}
                  aria-label={`Lubang ${i + 1}`}
                  className={`relative flex size-24 items-end justify-center overflow-hidden rounded-[50%] border-4 shadow-inner transition-all sm:size-28 ${
                    interactive ? "cursor-pointer" : ""
                  }`}
                  style={{
                    borderColor: isCurrent ? accent : "#7a5a35",
                    background: "linear-gradient(180deg, #4a3b22 0%, #2e2517 100%)",
                    transform: tappedHere ? "scale(0.94)" : undefined,
                  }}
                >
                  {isCurrent && (
                    <span
                      className="text-[52px] leading-none"
                      style={{
                        animation: "cm-bob 0.9s ease-in-out infinite",
                        filter: stung ? "saturate(0.3)" : undefined,
                      }}
                      aria-hidden="true"
                    >
                      {currentKind === "critter" ? ["🐹", "🐰", "🐸", "🐭"][holeGlobalIdx % 4] : "🌵"}
                    </span>
                  )}
                  {holeHasPop && feedbackKind === "caught" && (
                    <span className="absolute -top-1 text-2xl" aria-hidden="true">
                      ✨
                    </span>
                  )}
                  {missed && (
                    <span className="absolute -top-1 text-lg opacity-70" aria-hidden="true">
                      💨
                    </span>
                  )}
                  {stung && (
                    <span className="absolute -top-1 text-2xl" aria-hidden="true">
                      🌵💥
                    </span>
                  )}
                  {/* hole shadow overlay */}
                  <span className="pointer-events-none absolute inset-x-2 bottom-0 h-1/2 rounded-[50%] bg-black/45" />
                </button>
              );
            })}
          </div>
        ))}

        {/* Feedback bubble */}
        {showFeedback && (
          <div
            className={`pop-in absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-full border-2 px-4 py-1 text-[13px] font-black shadow-lg ${
              feedbackKind === "caught" || feedbackKind === "avoided"
                ? "border-[#b8e3cd] bg-[#eaf9f1]"
                : "border-[#f3c1bd] bg-[#fdeceb]"
            }`}
            role="status"
            style={{ color: feedbackKind === "caught" || feedbackKind === "avoided" ? "var(--game-correct)" : "var(--game-wrong)" }}
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
          {holeCount > 3 && feedbackKind !== null
            ? "Kaktus berduri 🌵 jangan disentuh — biarkan saja turun kembali!"
            : "Mata selalu waspada — makhluk bisa muncul dari lubang mana saja!"}
        </p>
      </div>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />
    </div>
  );
}
