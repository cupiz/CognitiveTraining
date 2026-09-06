"use client";

import type { PCRenderState } from "@cog/game-pair-cards";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface PairCardsProps {
  renderState: PCRenderState;
  onCellTap: (cellIndex: number) => void;
}

const CARD_FACES = ["🐙", "🦀", "🐠", "⭐", "🐚", "🐬", "🦞", "🐳", "🦑", "🐡"];

export function PairCards({ renderState, onCellTap }: PairCardsProps) {
  const {
    phase = "play",
    cards = [],
    matchedPairs = 0,
    pairCount = 4,
    mismatches = 0,
    mismatchBudget = 11,
    trialNumber = 0,
    isPractice = true,
    score = 0,
  } = renderState ?? {};

  const accent = gameMeta("pair_cards").color;
  const interactive = phase === "play";
  const cols = pairCount <= 4 ? 4 : pairCount <= 6 ? 4 : 5;

  return (
    <div className="flex w-full flex-col items-center gap-3" style={{ maxWidth: "min(44rem, 100%)" }}>
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={pairCount} score={score} accent={accent} />

      {/* Mission + budget banner */}
      <div
        className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-2xl px-4 py-2"
        style={{ backgroundColor: "var(--game-surface-2)", border: "2px solid var(--game-line)" }}
        aria-label="Aturan kartu"
      >
        <p className="text-[13px] font-extrabold" style={{ color: "var(--game-ink)" }}>
          🃏 Balik dua kartu — cari pasangan yang kembar!
        </p>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[12px] font-extrabold ${
            mismatches >= mismatchBudget - 2 ? "bg-[#fdeceb] text-[var(--game-wrong)]" : "bg-brand-50 text-brand-700"
          }`}
        >
          Sisa tebakan: {Math.max(0, mismatchBudget - mismatches)}
        </span>
      </div>

      {/* Card grid */}
      <div
        className="grid w-full gap-2.5 rounded-3xl border-2 p-4 shadow-pop"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          borderColor: "var(--game-line)",
          background: "linear-gradient(180deg, #2a6b8f 0%, #1c4f6e 100%)",
        }}
      >
        {cards.map((card, idx) => {
          const face = CARD_FACES[card.pairId] ?? "⭐";
          const faceUp = card.flipped || card.matched;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onCellTap(idx)}
              disabled={!interactive || card.matched || card.flipped}
              aria-label={`Kartu ${idx + 1}${card.matched ? ", sudah cocok" : ""}`}
              className={`relative aspect-[3/4] select-none [perspective:800px] ${
                interactive && !card.matched && !card.flipped ? "cursor-pointer" : ""
              }`}
            >
              <span
                className="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]"
                style={{ transform: faceUp ? "rotateY(180deg)" : "rotateY(0deg)" }}
              >
                {/* card back */}
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-xl border-4 shadow-md [backface-visibility:hidden]"
                  style={{
                    borderColor: "#c9a44d",
                    background: "linear-gradient(135deg, #3f7ec7 0%, #2a5ea8 100%)",
                  }}
                >
                  <span className="text-2xl opacity-60" aria-hidden="true">
                    🏝️
                  </span>
                </span>
                {/* card face */}
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-xl border-4 shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]"
                  style={{
                    borderColor: card.matched ? "#2f9e63" : "#c9a44d",
                    background: card.matched
                      ? "linear-gradient(180deg, #eaf9f1, #d0f0e0)"
                      : "linear-gradient(180deg, #fffdf4, #fff0c9)",
                  }}
                >
                  <span className="text-4xl leading-none sm:text-5xl" aria-hidden="true">
                    {face}
                  </span>
                  {card.matched && (
                    <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-[#2f9e63] text-[11px] font-black text-white shadow">
                      ✓
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Playing hint */}
      <div
        className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5"
        style={{ backgroundColor: `${accent}12` }}
      >
        <span aria-hidden="true">💡</span>
        <p className="text-[12px] font-semibold" style={{ color: "var(--game-ink-mute)" }}>
          Ingat posisi tiap gambar — pasangan kembar akan tetap terbuka dan bercahaya hijau!
        </p>
      </div>

      <ProgressBar value={matchedPairs / Math.max(1, pairCount)} accent={accent} />
    </div>
  );
}
