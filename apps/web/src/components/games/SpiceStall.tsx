"use client";

import type { SSRenderState } from "@cog/game-spice-stall";
import { gameMeta } from "@/lib/games";
import { TrialHeader, Instruction, ProgressBar } from "@/components/game/GameFrame";

interface SpiceStallProps {
  renderState: SSRenderState;
  onCellTap: (cellIndex: number) => void;
}

export function SpiceStall({ renderState, onCellTap }: SpiceStallProps) {
  const {
    menu = [],
    order = [],
    tappedIndices = [],
    showOrder = false,
    showFeedback = false,
    feedbackCorrect = false,
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
  } = renderState ?? {};

  const accent = gameMeta("spice_stall").color;
  const interactive = !showOrder && !showFeedback;

  // Position of each menu item in the current rebuild (1-based), if tapped.
  const tapPosition = new Map<number, number>();
  tappedIndices.forEach((idx, i) => {
    if (!tapPosition.has(idx)) tapPosition.set(idx, i + 1);
  });

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {showOrder ? (
        <Instruction>Ingat pesanan pelanggan</Instruction>
      ) : showFeedback ? (
        <span
          className="pop-in text-[15px] font-bold"
          style={{ color: feedbackCorrect ? "var(--game-correct)" : "var(--game-wrong)" }}
        >
          {feedbackCorrect ? "Pesanan pas! Pelanggan senang!" : "Belum pas — coba ingat lagi ya"}
        </span>
      ) : (
        <Instruction>Racik dengan urutan yang sama</Instruction>
      )}

      {showOrder ? (
        /* Order strip — the customer's sequence, large and readable */
        <div
          className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl p-4"
          style={{
            backgroundColor: "var(--game-surface-2)",
            border: "1px solid var(--game-line)",
          }}
          aria-label="Pesanan pelanggan"
        >
          {order.map((menuIdx, i) => (
            <div
              key={i}
              className="pop-in flex size-14 items-center justify-center rounded-2xl text-3xl shadow-sm"
              style={{
                backgroundColor: "var(--game-surface)",
                border: `2px solid ${accent}`,
                animationDelay: `${i * 90}ms`,
              }}
              aria-hidden="true"
            >
              {menu[menuIdx]?.emoji ?? "?"}
            </div>
          ))}
        </div>
      ) : (
        /* Shelf — tappable menu with rebuild progress badges */
        <div
          className="grid w-full grid-cols-4 gap-2 rounded-2xl p-2"
          style={{
            backgroundColor: "var(--game-surface-2)",
            border: "1px solid var(--game-line)",
          }}
          role="group"
          aria-label="Rak bumbu"
        >
          {menu.map((item) => {
            const pos = tapPosition.get(item.id);
            const tapped = pos !== undefined;
            return (
              <button
                key={item.id}
                onClick={() => onCellTap(item.id)}
                disabled={!interactive}
                aria-label={`Bahan ${item.emoji}${tapped ? `, urutan ke-${pos}` : ""}`}
                className="relative flex aspect-square w-full items-center justify-center rounded-xl border-2 text-3xl transition-[transform,background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
                style={{
                  backgroundColor: tapped ? accent : "var(--game-surface)",
                  borderColor: tapped ? accent : "var(--game-line)",
                  outlineColor: accent,
                  ...(interactive && !tapped ? { cursor: "pointer" } : {}),
                }}
              >
                <span className={tapped ? "opacity-90" : ""} aria-hidden="true">
                  {item.emoji}
                </span>
                {tapped && (
                  <span
                    className="tnum absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full text-[11px] font-bold text-white shadow"
                    style={{ backgroundColor: "var(--game-ink)" }}
                    aria-hidden="true"
                  >
                    {pos}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!showOrder && !showFeedback && (
        <p className="tnum text-xs font-semibold text-ink-mute" aria-live="polite">
          {tappedIndices.length} dari {order.length} bahan
        </p>
      )}

      <ProgressBar
        value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)}
        accent={accent}
      />
    </div>
  );
}
