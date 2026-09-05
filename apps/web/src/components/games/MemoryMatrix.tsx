"use client";

import type { MMRenderState } from "@cog/game-memory-matrix";
import { gameMeta } from "@/lib/games";
import { TrialHeader, Instruction, ProgressBar, hexToRgba } from "@/components/game/GameFrame";

interface MemoryMatrixProps {
  renderState: MMRenderState;
  onCellTap: (cellIndex: number) => void;
}

export function MemoryMatrix({ renderState, onCellTap }: MemoryMatrixProps) {
  const {
    gridRows = 3,
    gridCols = 3,
    highlightedCells = [],
    selectedCells = [],
    showTargets = false,
    showFeedback = false,
    feedbackCorrect = false,
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
  } = renderState ?? {};

  const accent = gameMeta("memory_matrix").color;
  const highlightedSet = new Set(highlightedCells.map((c) => `${c.row},${c.col}`));
  const selectedSet = new Set(selectedCells.map((c) => `${c.row},${c.col}`));
  const totalCells = gridRows * gridCols;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {showTargets ? (
        <Instruction>Ingat ubin yang menyala</Instruction>
      ) : showFeedback ? (
        <span
          className="pop-in text-[15px] font-bold"
          style={{ color: feedbackCorrect ? "var(--game-correct)" : "var(--game-wrong)" }}
        >
          {feedbackCorrect ? "Bagus, benar!" : "Hampir — coba perhatikan lagi"}
        </span>
      ) : (
        <Instruction>Sekarang ketuk ubin yang tadi menyala</Instruction>
      )}

      {/* Grid */}
      <div
        className="inline-grid w-full rounded-2xl p-2"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gap: 6,
          backgroundColor: "var(--game-surface-2)",
          border: "1px solid var(--game-line)",
        }}
      >
        {Array.from({ length: totalCells }).map((_, idx) => {
          const row = Math.floor(idx / gridCols);
          const col = idx % gridCols;
          const key = `${row},${col}`;
          const isHighlighted = highlightedSet.has(key);
          const isSelected = selectedSet.has(key);
          const interactive = !showTargets && !showFeedback;

          let bg = "var(--game-surface)";
          let border = "var(--game-line)";
          let cls = "";
          const disabled = !interactive;

          if (showTargets && isHighlighted) {
            bg = accent;
            border = accent;
            cls = "pop-in";
          } else if (showFeedback) {
            if (isSelected && isHighlighted) {
              bg = "var(--game-correct)";
              border = "var(--game-correct)";
              cls = "pop-in";
            } else if (isSelected && !isHighlighted) {
              bg = "var(--game-wrong-tint)";
              border = "var(--game-wrong)";
              cls = "shake-wrong";
            } else if (!isSelected && isHighlighted) {
              bg = "var(--game-warn-tint)";
              border = "var(--game-warn)";
            }
          } else if (isSelected) {
            bg = hexToRgba(accent, 0.14);
            border = accent;
          }

          return (
            <button
              key={idx}
              onClick={() => onCellTap(idx)}
              disabled={disabled}
              aria-label={`Ubin ${row + 1},${col + 1}`}
              className={`aspect-square w-full rounded-xl border-2 transition-[transform,background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${cls}`}
              style={{
                backgroundColor: bg,
                borderColor: border,
                outlineColor: accent,
                ...(interactive ? { cursor: "pointer" } : {}),
              }}
            />
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
