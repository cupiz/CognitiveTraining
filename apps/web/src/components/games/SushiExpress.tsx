"use client";

import { useRef } from "react";
import type { SXRenderState } from "@cog/game-sushi-express";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface SushiExpressProps {
  renderState: SXRenderState;
  onCellTap: (cellIndex: number) => void;
}

const SUSHI_EMOJI = ["🍣", "🍙", "🍤", "🍥", "🍜"];

const SERVE_LEFT = 0.72;
const SERVE_RIGHT = 0.92;

export function SushiExpress({ renderState, onCellTap }: SushiExpressProps) {
  const {
    phase = "waiting",
    targetSushi = 0,
    plates = [],
    servedPlateIds = [],
    lastServe = null,
    feedbackCorrect = null,
    beltElapsedMs = 0,
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
    beltMs = 3000,
    spawnIntervalMs = 1100,
  } = renderState ?? {};

  const accent = gameMeta("sushi_express").color;
  const active = phase === "waiting";
  const servedSet = new Set(servedPlateIds);
  const lastServeRef = useRef<{ key: string; ts: number } | null>(null);

  // Track serve flashes locally — the plateId+correct pair is our key.
  if (lastServe) {
    const key = `${lastServe.plateId}:${lastServe.correct}`;
    if (!lastServeRef.current || lastServeRef.current.key !== key) {
      lastServeRef.current = { key, ts: Date.now() };
    }
  }
  const showServeToast = lastServeRef.current && Date.now() - lastServeRef.current.ts < 900;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* ── Conveyor scene ───────────────────────────────── */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border shadow-pop"
        style={{
          aspectRatio: "16 / 10",
          borderColor: "var(--game-line)",
          background: "linear-gradient(180deg, #fff7e0 0%, #ffe9b8 42%, #f2d08a 100%)",
        }}
        aria-hidden="false"
      >
        <style>{`
          @keyframes sx-blink {
            0%, 100% { opacity: 0.35; }
            50% { opacity: 1; }
          }
          @keyframes sx-plate-in {
            from { transform: scale(0.5); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>

        {/* Kitchen wall + order card */}
        <div className="absolute inset-x-0 top-0 h-[30%] border-b-4 border-[#e8c87e] bg-[#fffdf4]" style={{ backgroundImage: "linear-gradient(90deg, rgb(232 200 126 / 0.25) 1px, transparent 1px), linear-gradient(rgb(232 200 126 / 0.25) 1px, transparent 1px)", backgroundSize: "22px 22px" }}>
          {/* Order card — the customer's sushi */}
          <div
            className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-2xl border-2 px-3 py-2 shadow-md"
            style={{ borderColor: accent, backgroundColor: "#fff" }}
            aria-label="Pesanan pelanggan"
          >
            <span className="text-[11px] font-extrabold uppercase tracking-wide" style={{ color: accent }}>
              Pesan
            </span>
            <span className="text-2xl" aria-hidden="true">
              {SUSHI_EMOJI[targetSushi] ?? "🍣"}
            </span>
          </div>

          {/* Persistent game label (E2E marker) */}
          <span className="absolute right-3 top-3 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#b57f14] shadow-sm backdrop-blur">
            <span className="size-2 rounded-full" style={{ backgroundColor: accent }} />
            Sushi Express
          </span>
        </div>

        {/* The belt — bright teal conveyor, wider at the chef side */}
        <div
          className="absolute inset-x-0 top-[26%] bottom-0"
          style={{
            background: "linear-gradient(180deg, #4db6c9 0%, #339db3 55%, #2a8ba0 100%)",
            clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0 100%)",
          }}
        >
          {/* belt edge + moving slats */}
          <div className="absolute inset-x-0 top-0 h-[10%] bg-[#237285]" />
          <div
            className="absolute inset-x-0 top-[10%] bottom-0 opacity-40"
            style={{
              background:
                "repeating-linear-gradient(0deg, rgb(255 255 255 / 0.16) 0 6px, transparent 6px 26px)",
            }}
          />
          {/* side rails for depth */}
          <div
            className="absolute inset-y-0 left-0 w-[4%]"
            style={{ background: "linear-gradient(90deg, rgb(20 90 105 / 0.5), transparent)" }}
          />
          <div
            className="absolute inset-y-0 right-0 w-[4%]"
            style={{ background: "linear-gradient(270deg, rgb(20 90 105 / 0.5), transparent)" }}
          />
          {/* serve zone highlight */}
          <div
            className="absolute top-0 h-full"
            style={{
              left: `${SERVE_LEFT * 100}%`,
              width: `${(SERVE_RIGHT - SERVE_LEFT) * 100}%`,
              background: "rgb(255 255 255 / 0.22)",
              borderLeft: "4px dashed #ffe9b8",
              borderRight: "4px dashed #ffe9b8",
              animation: "sx-blink 1.1s ease-in-out infinite",
            }}
            aria-hidden="true"
          />
          <span
            className="absolute left-[79%] top-[7%] z-10 -translate-x-1/2 rounded-full border-2 px-3 py-1 text-[12px] font-black uppercase tracking-wide text-[#8a5b00]"
            style={{
              backgroundColor: "#ffe9b8",
              borderColor: "#fff",
              boxShadow: "0 3px 8px rgb(0 0 0 / 0.25)",
              animation: "sx-blink 1.1s ease-in-out infinite",
            }}
            aria-hidden="true"
          >
            Tangkap!
          </span>
        </div>

        {/* Chef at the end of the line */}
        <div className="pointer-events-none absolute bottom-[2%] right-[2%] z-20 text-4xl drop-shadow-md" aria-hidden="true">
          👨‍🍳
        </div>

        {/* Plates — sliding along the belt, scaling with depth */}
        {plates.map((plate) => {
          const elapsed = active ? beltElapsedMs : beltMs + plate.id * spawnIntervalMs;
          const left = ((elapsed - plate.id * spawnIntervalMs) / beltMs) * 100;
          if (left < -8 || left > 108) return null;
          const served = servedSet.has(plate.id);
          const scale = 0.75 + (Math.min(100, Math.max(0, left)) / 100) * 0.55;
          const inZone = left >= SERVE_LEFT * 100 && left <= SERVE_RIGHT * 100;
          return (
            <div
              key={plate.id}
              className="pointer-events-none absolute bottom-[8%] z-10 flex flex-col items-center"
              style={{
                left: `${left}%`,
                transform: `translateX(-50%) scale(${scale})`,
                opacity: served ? 0.35 : 1,
              }}
              aria-hidden="true"
            >
              <div
                className="relative flex size-10 items-center justify-center rounded-full text-xl sm:size-12 sm:text-2xl"
                style={{
                  background:
                    "radial-gradient(circle at 35% 30%, #ffffff, #e8e2d2)",
                  border: `3px solid ${inZone && !served ? accent : "#d8cfba"}`,
                  boxShadow: inZone && !served ? `0 0 14px 3px ${accent}77` : "0 5px 8px rgb(0 0 0 / 0.3)",
                  animation: inZone && !served ? "sx-plate-in 220ms ease-out" : undefined,
                }}
              >
                {SUSHI_EMOJI[plate.sushi] ?? "🍣"}
                {served && (
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#22b573] text-[10px] font-black text-white shadow">
                    ✓
                  </span>
                )}
              </div>
              <div className="mt-0.5 h-1.5 w-8 rounded-full bg-black/20 blur-[1px]" />
            </div>
          );
        })}

        {/* Serve feedback toast */}
        {showServeToast && lastServe && (
          <div
            className={`pop-in absolute left-1/2 top-[38%] z-30 -translate-x-1/2 rounded-2xl border px-4 py-1.5 shadow-pop ${
              lastServe.correct ? "border-[#b8e3cd] bg-[#eaf9f1]/95" : "border-[#f3c1bd] bg-[#fdeceb]/95"
            }`}
            role="status"
          >
            <p
              className="text-[14px] font-extrabold"
              style={{ color: lastServe.correct ? "var(--game-correct)" : "var(--game-wrong)" }}
            >
              {lastServe.correct ? "Sip, tersaji! 😋" : "Bukan pesanannya! 🙅"}
            </p>
          </div>
        )}

        {/* Trial-level feedback */}
        {phase === "feedback" && (
          <div
            className={`pop-in absolute left-1/2 top-[38%] z-30 -translate-x-1/2 rounded-2xl border px-4 py-1.5 text-center shadow-pop ${
              feedbackCorrect === false ? "border-[#f3c1bd] bg-[#fdeceb]/95" : "border-[#b8e3cd] bg-[#eaf9f1]/95"
            }`}
            role="status"
          >
            <p
              className="text-[14px] font-extrabold"
              style={{ color: feedbackCorrect === false ? "var(--game-wrong)" : "var(--game-correct)" }}
            >
              {feedbackCorrect === false
                ? "Ada piring yang terlewat atau salah — coba lagi!"
                : "Semua pesanan tersaji! 🎉"}
            </p>
          </div>
        )}

        {/* Whole scene is the tap button */}
        <button
          onClick={() => onCellTap(0)}
          aria-label="Tangkap piring pesanan dari ban berjalan"
          className="absolute inset-0 z-20 h-full w-full cursor-pointer"
        />
      </div>

      <ProgressBar
        value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)}
        accent={accent}
      />
    </div>
  );
}