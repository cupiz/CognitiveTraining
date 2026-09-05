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
      ? "Ding! Tepat sekali 🎉"
      : feedbackKind === "false_alarm"
        ? "Ups, buahnya berbeda 😅"
        : feedbackKind === "miss"
          ? "Ada yang sama — loncengnya terlewat!"
          : feedbackKind === "correct_rejection"
            ? "Hebat, kamu tenang ✅"
            : "";

  const feedbackTone =
    feedbackKind === "hit" || feedbackKind === "correct_rejection"
      ? "var(--game-correct)"
      : "var(--game-wrong)";

  return (
    <div className="flex w-full flex-col items-center gap-3" style={{ maxWidth: "min(34rem, 100%)" }}>
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* Rule banner */}
      <div
        className="w-full rounded-2xl px-4 py-2.5 text-center"
        style={{ backgroundColor: "var(--game-surface-2)", border: "2px solid var(--game-line)" }}
        aria-label="Aturan kereta"
      >
        <p className="text-[14px] font-extrabold" style={{ color: "var(--game-ink)" }}>
          {nLevel === 1
            ? "🛎️ Bunyikan lonceng kalau buahnya sama dengan gerbong SEBELUMNYA"
            : `🛎️ Bunyikan lonceng kalau buahnya sama dengan ${nLevel} gerbong yang lalu`}
        </p>
      </div>

      {/* Station scene */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border-2 shadow-pop"
        style={{
          aspectRatio: "16 / 10",
          borderColor: "var(--game-line)",
          background: "linear-gradient(180deg, #8fd0f0 0%, #b8e2f5 45%, #a5d68f 78%, #7fbf6a 100%)",
        }}
      >
        {/* sun + clouds */}
        <div className="pointer-events-none absolute right-[8%] top-[8%] size-12 rounded-full bg-[#ffe27a] shadow-[0_0_30px_10px_rgb(255_226_122/0.6)]" />
        <div className="pointer-events-none absolute left-[6%] top-[12%] flex items-center">
          <span className="size-10 rounded-full bg-white/85" />
          <span className="-ml-4 size-8 rounded-full bg-white/85" />
        </div>
        <div className="pointer-events-none absolute right-[28%] top-[16%] flex items-center">
          <span className="size-8 rounded-full bg-white/70" />
          <span className="-ml-3 size-6 rounded-full bg-white/70" />
        </div>
        {/* hills */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[30%] h-[26%]">
          <div className="absolute left-[-10%] bottom-0 size-0 border-b-[90px] border-l-[70px] border-r-[70px] border-b-[#79c465] border-l-transparent border-r-transparent" />
          <div className="absolute right-[-8%] bottom-0 size-0 border-b-[70px] border-l-[60px] border-r-[60px] border-b-[#8ccb76] border-l-transparent border-r-transparent" />
        </div>

        {/* Station roof sign */}
        <div className="absolute left-1/2 top-[6%] z-20 -translate-x-1/2 rounded-xl border-2 border-[#5b4636] bg-[#fff7e0] px-3 py-1 shadow-md">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#6b5326]">
            Stasiun Ingatan
          </span>
        </div>

        {/* The wagon display — big window framed like a train car */}
        <div className="absolute inset-x-[10%] top-[22%] z-10 h-[44%]">
          <div
            className="relative flex h-full items-center justify-center overflow-hidden rounded-t-2xl border-4 border-[#3f7ec7] bg-[#fdf3d7] shadow-[0_10px_24px_rgb(0_0_0/0.3)]"
            style={{ animation: "cm-bob 2.4s ease-in-out infinite" }}
          >
            <span className="absolute inset-x-0 top-0 h-3 bg-[#3f7ec7]" />
            {showFeedback ? (
              <div className="flex flex-col items-center gap-1">
                <p className="text-2xl font-black" style={{ color: feedbackTone }}>
                  {feedbackText}
                </p>
                {feedbackKind === "miss" && (
                  <span className="text-3xl" aria-hidden="true">
                    {currentFruit}
                  </span>
                )}
              </div>
            ) : (
              <span
                className="text-[64px] leading-none drop-shadow-md sm:text-[76px]"
                aria-label={currentFruit ? `Gerbong membawa ${FRUIT_LABEL[currentFruit] ?? "buah"}` : "Gerbong kereta"}
                style={{ animation: "cm-bob 1.6s ease-in-out infinite" }}
              >
                {currentFruit ?? "🚂"}
              </span>
            )}
          </div>
          <div className="flex justify-center gap-6">
            <span className="size-6 rounded-full border-4 border-[#5b4636] bg-[#e8e2cf]" />
            <span className="size-6 rounded-full border-4 border-[#5b4636] bg-[#e8e2cf]" />
          </div>
        </div>

        {/* rails + sleepers */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[16%] h-2 bg-[#8a6d3b]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-[13%] flex justify-center gap-2">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="h-1.5 w-9 -rotate-3 rounded bg-[#a5834d]" />
          ))}
        </div>

        {/* Bell */}
        <button
          type="button"
          onClick={() => onCellTap(0)}
          disabled={!interactive}
          aria-label="Bunyikan lonceng"
          className={`absolute bottom-[4%] left-1/2 z-20 flex size-20 -translate-x-1/2 items-center justify-center rounded-full text-4xl shadow-xl transition-transform sm:size-24 sm:text-5xl ${
            interactive ? "hover:scale-105 active:scale-90" : "opacity-40 saturate-50"
          }`}
          style={{
            background: "radial-gradient(circle at 35% 30%, #ffe27a, #f2b332)",
            border: "4px solid #d99418",
          }}
        >
          🔔
        </button>
      </div>

      {/* Playing hint */}
      <div
        className="flex w-full items-center gap-2 rounded-xl px-3 py-1.5"
        style={{ backgroundColor: `${accent}12` }}
      >
        <span aria-hidden="true">💡</span>
        <p className="text-[12px] font-semibold" style={{ color: "var(--game-ink-mute)" }}>
          Tarik napas, ingat buah {nLevel} gerbong ke belakang — baru bunyikan loncengnya.
        </p>
      </div>

      <ProgressBar value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)} accent={accent} />
    </div>
  );
}
