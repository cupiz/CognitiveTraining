"use client";

import type { TNBRenderState } from "@cog/game-train-n-back";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface TrainNBackProps {
  renderState: TNBRenderState;
  onCellTap: (cellIndex: number) => void;
}

const FRUIT_LABEL: Record<string, string> = {
  "🍎": "apel",
  "🍌": "pisang",
  "🍇": "anggur",
  "🍊": "jeruk",
  "🍓": "stroberi",
  "🍐": "pir",
  "🍒": "ceri",
  "🍍": "nanas",
};

export function TrainNBack({ renderState, onCellTap }: TrainNBackProps) {
  const {
    phase = "wagon",
    currentFruit = null,
    nLevel = 1,
    awaitingResponse = false,
    feedbackKind = null,
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
  } = renderState ?? {};

  const accent = gameMeta("train_n_back").color;
  const interactive = phase === "wagon" && awaitingResponse;
  const showFeedback = phase === "feedback" && feedbackKind;

  const feedbackText =
    feedbackKind === "hit"
      ? "Tepat! 🎉"
      : feedbackKind === "false_alarm"
        ? "Bukan yang itu 😅"
        : feedbackKind === "miss"
          ? "Ada yang sama, loncengnya terlewat!"
          : feedbackKind === "correct_rejection"
            ? "Bagus, tenang saja ✅"
            : "";

  const feedbackTone =
    feedbackKind === "hit" || feedbackKind === "correct_rejection"
      ? "var(--game-correct)"
      : "var(--game-wrong)";

  return (
    <div className="flex w-full flex-col items-center gap-3" style={{ maxWidth: "min(32rem, 100%)" }}>
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* Mission banner: the rule, always visible */}
      <div
        className="w-full rounded-2xl px-4 py-2.5 text-center"
        style={{ backgroundColor: "var(--game-surface-2)", border: "2px solid var(--game-line)" }}
        aria-label="Aturan kereta"
      >
        <p className="text-[14px] font-extrabold" style={{ color: "var(--game-ink)" }}>
          {nLevel === 1
            ? "Bunyikan lonceng kalau buahnya sama dengan gerbong SEBELUMNYA"
            : `Bunyikan lonceng kalau buahnya sama dengan ${nLevel} gerbong yang lalu`}
        </p>
      </div>

      {/* Train scene */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 shadow-pop"
        style={{
          aspectRatio: "16 / 10",
          borderColor: "var(--game-line)",
          background: "linear-gradient(180deg, #bfe3f2 0%, #9ed3ec 55%, #7db98f 100%)",
        }}
      >
        {/* clouds */}
        <div className="pointer-events-none absolute left-[8%] top-[10%] size-14 rounded-full bg-white/70" />
        <div className="pointer-events-none absolute right-[12%] top-[8%] size-10 rounded-full bg-white/60" />

        {/* The wagon window */}
        <div className="absolute inset-x-[8%] top-[16%] flex h-[46%] items-center justify-center rounded-2xl border-4 border-[#5b4636] bg-[#fff7e0] shadow-inner">
          {showFeedback ? (
            <p className="text-2xl font-black" style={{ color: feedbackTone }}>
              {feedbackText}
            </p>
          ) : currentFruit ? (
            <span className="text-[64px] leading-none" aria-label={`Gerbong membawa ${FRUIT_LABEL[currentFruit] ?? "buah"}`}>
              {currentFruit}
            </span>
          ) : (
            <span className="text-4xl opacity-40">🚂</span>
          )}
        </div>

        {/* Rails */}
        <div className="absolute inset-x-0 bottom-[24%] flex justify-center gap-1">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="h-1.5 w-8 -rotate-6 rounded-full bg-[#8a6d3b]/70" />
          ))}
        </div>

        {/* Bell button */}
        <button
          type="button"
          onClick={() => onCellTap(0)}
          disabled={!interactive}
          aria-label="Bunyikan lonceng"
          className={`absolute bottom-[4%] left-1/2 z-10 flex size-20 -translate-x-1/2 items-center justify-center rounded-full text-4xl shadow-lg transition-transform sm:size-24 sm:text-5xl ${
            interactive ? "hover:scale-105 active:scale-90" : "opacity-50"
          }`}
          style={{
            background: "radial-gradient(circle at 35% 30%, #ffe27a, #f2b332)",
            border: "4px solid #d99418",
          }}
        >
          🔔
        </button>
      </div>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />
    </div>
  );
}
