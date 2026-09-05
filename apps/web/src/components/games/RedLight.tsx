"use client";

import type { RLRenderState } from "@cog/game-red-light";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface RedLightProps {
  renderState: RLRenderState;
  onRun: () => void;
}

const SPRINT_FROM = 8; // % from left
const SPRINT_TO = 80; // % from left

export function RedLight({ renderState, onRun }: RedLightProps) {
  const {
    phase = "ready",
    showStopSignal = false,
    responded = false,
    responseCorrect = null,
    feedbackMessage = "",
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
    goDeadlineMs = 2500,
  } = renderState ?? {};

  const accent = gameMeta("red_light").color;

  const running = phase === "go" && !showStopSignal && !responded;
  const frozen = phase === "stop" || (showStopSignal && !responded);
  const inFeedback = phase === "feedback";

  const bubbleText =
    inFeedback && feedbackMessage
      ? feedbackMessage
      : frozen
        ? "STOP! Diam!"
        : running
          ? "LARI!"
          : phase === "ready"
            ? "Siap…"
            : "Lampu Merah";

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* ── Street scene ─────────────────────────────────── */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border shadow-pop"
        style={{
          aspectRatio: "16/11",
          borderColor: "var(--game-line)",
          perspective: "900px",
          background:
            "linear-gradient(180deg, #1c2f54 0%, #33518a 38%, #f6c77c 76%, #e88f4e 100%)",
        }}
        aria-hidden="false"
      >
        <style>{`
          @keyframes rl-sprint {
            from { left: ${SPRINT_FROM}%; }
            to { left: ${SPRINT_TO}%; }
          }
          @keyframes rl-run-legs {
            0% { transform: rotate(-24deg); }
            50% { transform: rotate(24deg); }
            100% { transform: rotate(-24deg); }
          }
          @keyframes rl-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-4px); }
          }
          @keyframes rl-sweat {
            0% { opacity: 0; transform: translateY(2px); }
            40% { opacity: 1; }
            100% { opacity: 0; transform: translateY(-7px); }
          }
          @keyframes rl-blink {
            0%, 60%, 100% { opacity: 0.18; }
            75% { opacity: 1; }
          }
          @keyframes rl-pop {
            0% { transform: translateY(10px) scale(0.9); opacity: 0; }
            60% { transform: translateY(-2px) scale(1.02); opacity: 1; }
            100% { transform: translateY(0) scale(1); opacity: 1; }
          }
        `}</style>

        {/* Stars (top, on the dusk sky) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3">
          {[12, 28, 47, 63, 81, 92].map((x, i) => (
            <span
              key={i}
              className="absolute size-1 rounded-full bg-white/80"
              style={{ left: `${x}%`, top: `${8 + (i % 3) * 9}%`, opacity: 0.5 + (i % 3) * 0.2 }}
            />
          ))}
        </div>

        {/* Skyline silhouette */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-[34%] h-[22%] w-full"
          viewBox="0 0 400 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 60V42h22v-8h16v8h14V28h20v14h18V36h14v24Zm120 0V38h18v-9h14v9h16V30h20v8h12v22Zm120 0V44h20v-12h16v12h18v-6h14v22Zm120 0V40h18v-8h12v8h16v-4h14v24Z"
            fill="#1b2340"
            opacity="0.55"
          />
        </svg>

        {/* Horizon glow */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[30%] h-[18%] bg-gradient-to-b from-transparent to-[#ffd9a0]/30" />

        {/* Road — perspective trapezoid */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%]"
          style={{
            background:
              "linear-gradient(180deg, #565b63 0%, #3c4149 30%, #2b2f36 100%)",
            clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)",
          }}
        />
        {/* Road edge lines */}
        <div
          className="pointer-events-none absolute bottom-0 h-[46%] w-full"
          style={{
            clipPath: "polygon(18% 0, 82% 0, 100% 100%, 0 100%)",
            background:
              "linear-gradient(90deg, transparent 0%, #f2c94c 4%, transparent 7%, transparent 93%, #f2c94c 96%, transparent 100%)",
            opacity: 0.7,
          }}
        />
        {/* Dashed center line */}
        <div
          className="pointer-events-none absolute inset-x-[30%] bottom-0 h-[42%]"
          style={{
            background:
              "repeating-linear-gradient(180deg, #f7f3e8 0 14px, transparent 14px 30px)",
            clipPath: "polygon(0 0, 100% 0, 72% 100%, 28% 100%)",
            opacity: 0.5,
          }}
        />

        {/* Finish flag */}
        <div className="pointer-events-none absolute bottom-[26%] right-[6%] flex flex-col items-center">
          <div className="h-16 w-1 rounded-full bg-[#f7f3e8]/90 sm:h-20" />
          <div
            className="-ml-1 h-5 w-7 -translate-y-[2.6rem] sm:-translate-y-[3.2rem]"
            style={{
              background: "repeating-linear-gradient(45deg, #e5484d 0 6px, #fff 6px 12px)",
              clipPath: "polygon(0 0, 100% 0, 70% 50%, 100% 100%, 0 100%)",
            }}
          />
        </div>

        {/* Traffic light — 3D-ish housing with glow lamps */}
        <div className="pointer-events-none absolute bottom-[8%] left-[6%] flex flex-col items-center">
          <div
            className="relative flex w-11 flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 sm:w-13"
            style={{
              background: "linear-gradient(135deg, #3d4350 0%, #262a33 100%)",
              border: "2px solid #14171d",
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.18), 0 6px 14px rgb(0 0 0 / 0.35)",
            }}
          >
            {/* visor */}
            <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-xl bg-white/10" />
            <Lamp
              color="#e5484d"
              active={frozen || (inFeedback && responseCorrect === false)}
              blink={phase === "ready" && trialNumber % 2 === 0}
            />
            <Lamp color="#f2c94c" active={phase === "ready"} />
            <Lamp
              color="#22b573"
              active={running || (inFeedback && responseCorrect === true)}
            />
          </div>
          <div className="h-20 w-2.5 rounded-b-md bg-[#20242c] sm:h-24" style={{ boxShadow: "inset 0 -2px 0 rgb(0 0 0 / 0.4)" }} />
        </div>

        {/* The runner — kid sprints on green, freezes on red */}
        <div
          key={trialNumber}
          className="pointer-events-none absolute bottom-[30%] z-10"
          style={{
            left: `${SPRINT_FROM}%`,
            animation: running
              ? `rl-sprint ${Math.max(500, goDeadlineMs)}ms linear forwards`
              : "none",
          }}
        >
          <div
            className="relative"
            style={{
              animation: running ? "rl-bob 240ms ease-in-out infinite" : "none",
              transform: frozen ? "scale(1)" : undefined,
            }}
          >
            {/* ground shadow */}
            <div
              className="absolute -bottom-1.5 left-1/2 h-2.5 w-10 -translate-x-1/2 rounded-full bg-black/30 blur-[2px]"
              style={{ animation: running ? "rl-bob 240ms ease-in-out infinite" : "none" }}
            />
            <Runner
              running={running}
              frozen={frozen}
              accent={accent}
              sweat={frozen && trialNumber % 2 === 1}
            />
          </div>
        </div>

        {/* Persistent game label (E2E marker + kid reassurance) */}
        <span className="absolute right-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/80 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#1f5fb8] shadow-sm backdrop-blur">
          <span className="size-2 rounded-full bg-[#e5484d]" />
          Lampu Merah
        </span>

        {/* Speech bubble */}
        <div
          className={`absolute left-1/2 top-3 z-20 max-w-[82%] -translate-x-1/2 rounded-2xl rounded-tl-md border px-4 py-1.5 text-center shadow-pop backdrop-blur ${
            inFeedback && responseCorrect === false
              ? "border-[#f3c1bd] bg-[#fdeceb]/95"
              : inFeedback
                ? "border-[#b8e3cd] bg-[#eaf9f1]/95"
                : "border-white/25 bg-white/85"
          }`}
          style={{ animation: "rl-pop 260ms ease-out" }}
          role="status"
        >
          <p
            className="text-[14px] font-extrabold tracking-tight"
            style={{
              color:
                inFeedback && responseCorrect === false
                  ? "var(--game-wrong)"
                  : inFeedback
                    ? "var(--game-correct)"
                    : "var(--game-ink)",
            }}
          >
            {bubbleText}
          </p>
        </div>

        {/* Whole scene is the RUN button */}
        <button
          onClick={onRun}
          aria-label="Lari — ketuk saat lampu hijau"
          className="absolute inset-0 z-10 h-full w-full cursor-pointer"
        />
      </div>

      <ProgressBar
        value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)}
        accent={accent}
      />
    </div>
  );
}

function Lamp({ color, active, blink = false }: { color: string; active: boolean; blink?: boolean }) {
  return (
    <span
      className="relative size-6 rounded-full sm:size-7"
      style={{
        background: active
          ? `radial-gradient(circle at 35% 30%, #ffffff 0%, ${color} 45%, ${color} 100%)`
          : "radial-gradient(circle at 35% 30%, #565b63 0%, #33373f 100%)",
        boxShadow: active
          ? `0 0 12px 3px ${color}88, 0 0 3px 1px ${color}`
          : "inset 0 2px 3px rgb(0 0 0 / 0.45)",
        animation: blink ? "rl-blink 600ms ease-in-out infinite" : "none",
      }}
    />
  );
}

/** Cute kid runner — SVG, sprints with swinging legs, freezes on red. */
function Runner({
  running,
  frozen,
  accent,
  sweat,
}: {
  running: boolean;
  frozen: boolean;
  accent: string;
  sweat: boolean;
}) {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 sm:h-16 sm:w-16" aria-hidden="true">
      {/* head */}
      <circle cx="30" cy="18" r="10" fill="#f5b17e" stroke="#d98a5a" strokeWidth="1.5" />
      {/* hair */}
      <path d="M21 15c0-6 4-9 10-9s9 3 9 9-2 4-4 4-4-1-5-1-4 1-6 1-4-1-4-4Z" fill="#5b3a29" />
      {/* eyes */}
      {frozen ? (
        <>
          <circle cx="26" cy="18" r="2.1" fill="#fff" />
          <circle cx="34" cy="18" r="2.1" fill="#fff" />
          <circle cx="27" cy="18" r="1" fill="#222" />
          <circle cx="35" cy="18" r="1" fill="#222" />
        </>
      ) : (
        <>
          <circle cx="27" cy="18" r="1.2" fill="#222" />
          <circle cx="33" cy="18" r="1.2" fill="#222" />
        </>
      )}
      {/* mouth */}
      {frozen ? (
        <ellipse cx="30" cy="23.5" rx="1.8" ry="1.1" fill="#a8553f" />
      ) : (
        <path d="M26.5 22.5c1.2 1.4 3 2.1 4 2.1s2.8-.7 4-2.1" fill="none" stroke="#a8553f" strokeWidth="1.3" strokeLinecap="round" />
      )}
      {/* blush */}
      <circle cx="23.5" cy="21.5" r="1.5" fill="#f28c8c" opacity="0.6" />
      <circle cx="36.5" cy="21.5" r="1.5" fill="#f28c8c" opacity="0.6" />
      {/* body — jersey in the game hue */}
      <path
        d="M23 30c1.5-2 4-2.5 7-2.5s5.5.5 7 2.5l3 16c0 3-4 4.5-10 4.5s-10-1.5-10-4.5Z"
        fill={accent}
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="1"
      />
      {/* number on jersey */}
      <text x="30" y="41" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff">
        7
      </text>
      {/* arms */}
      <g
        style={{
          transformOrigin: "27px 31px",
          animation: running ? "rl-run-legs 220ms ease-in-out infinite" : "none",
        }}
      >
        <path d="M23 31c-4 1-6 3-6 6" fill="none" stroke="#f5b17e" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <g
        style={{
          transformOrigin: "37px 31px",
          animation: running ? "rl-run-legs 220ms ease-in-out infinite reverse" : "none",
        }}
      >
        <path d="M37 31c4 1 6 3 6 6" fill="none" stroke="#f5b17e" strokeWidth="3.5" strokeLinecap="round" />
      </g>
      {/* legs */}
      <g
        style={{
          transformOrigin: "27px 47px",
          animation: running ? "rl-run-legs 220ms ease-in-out infinite" : "none",
          transform: frozen ? "translateY(1px)" : undefined,
        }}
      >
        <path d="M26 46c-2 4-3 7-3 10" fill="none" stroke="#3a3f4b" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M24.5 55.5h4" stroke="#e5484d" strokeWidth="2.6" strokeLinecap="round" />
      </g>
      <g
        style={{
          transformOrigin: "33px 47px",
          animation: running ? "rl-run-legs 220ms ease-in-out infinite reverse" : "none",
          transform: frozen ? "translateY(1px)" : undefined,
        }}
      >
        <path d="M30 46c3 4 5 7 5 10" fill="none" stroke="#3a3f4b" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M33.5 55.5h4" stroke="#e5484d" strokeWidth="2.6" strokeLinecap="round" />
      </g>
      {/* sweat drop when frozen */}
      {sweat && (
        <path
          d="M42 13c2 3 4 4.5 4 6.5a4 4 0 0 1-8 0c0-2 2-3.5 4-6.5Z"
          fill="#7cc7ff"
          style={{ animation: "rl-sweat 900ms ease-in infinite" }}
        />
      )}
    </svg>
  );
}