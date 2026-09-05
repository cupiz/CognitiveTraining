"use client";

import type { CMRenderState } from "@cog/game-courier-map";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface CourierMapProps {
  renderState: CMRenderState;
  onCellTap: (cellIndex: number) => void;
}

type NodeKind = {
  /** Big badge gradient background */
  bg: string;
  /** Thick outline color */
  ring: string;
  /** Icon drawn inside the badge */
  icon: string;
};

/** Kid-readable look per node kind — mirrored by the mission card chips. */
const KIND: Record<"plain" | "water" | "bluePost" | "toll", NodeKind> = {
  plain: { bg: "radial-gradient(circle at 35% 30%, #ffffff, #ffe9c2)", ring: "#f0b64c", icon: "🏠" },
  water: { bg: "radial-gradient(circle at 35% 30%, #d9f3ff, #4db6e8)", ring: "#2e9fd4", icon: "💧" },
  bluePost: { bg: "radial-gradient(circle at 35% 30%, #8fb4ff, #3b6fe0)", ring: "#2b57c4", icon: "P" },
  toll: { bg: "radial-gradient(circle at 35% 30%, #ffe3c0, #f0a04a)", ring: "#d9832e", icon: "💳" },
};

const MISSION_RULES: Record<string, { emoji: string; label: string }> = {
  reach_flag: { emoji: "🏁", label: "Semua jalan bebas" },
  avoid_water: { emoji: "💧", label: "Jangan lewat air" },
  blue_posts_only: { emoji: "🔵", label: "Lewat pos biru saja" },
  no_toll: { emoji: "💳", label: "Jangan lewat tol" },
};

function kindOf(n: { water: boolean; bluePost: boolean; toll: boolean }): NodeKind {
  if (n.water) return KIND.water;
  if (n.bluePost) return KIND.bluePost;
  if (n.toll) return KIND.toll;
  return KIND.plain;
}

export function CourierMap({ renderState, onCellTap }: CourierMapProps) {
  const {
    phase = "waiting",
    layout = null,
    currentPosition = 0,
    path = [],
    activeRules = [],
    switchTrial = false,
    feedbackKind = null,
    feedbackMessage = "",
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
  } = renderState ?? {};

  const accent = gameMeta("courier_map").color;
  const interactive = phase === "waiting";

  const visited = new Set(path);
  const trail = layout
    ? path
        .map((id) => layout.nodes[id])
        .filter(Boolean)
        .map((n) => `${n.x * 100},${n.y * 100}`)
        .join(" ")
    : "";

  return (
    <div
      className="flex w-full flex-col items-center gap-2.5"
      style={{ maxWidth: "min(36rem, calc((100dvh - 13.5rem) / 0.98))" }}
    >
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* ── Mission card — the ONE thing kids must read ───── */}
      <div
        className="flex w-full flex-wrap items-center justify-center gap-2 rounded-3xl px-3 py-2.5"
        style={{
          backgroundColor: "var(--game-surface-2)",
          border: "2px solid var(--game-line)",
          boxShadow: "inset 0 -3px 0 rgb(0 0 0 / 0.05)",
        }}
        aria-label="Misi dan aturan aktif"
      >
        <span className="mr-1 text-[13px] font-extrabold" style={{ color: "var(--game-ink)" }}>
          Misi:
        </span>
        {activeRules.map((rule) => {
          const meta = MISSION_RULES[rule] ?? { emoji: "📜", label: rule };
          return (
            <span
              key={rule}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-extrabold"
              style={{ backgroundColor: `${accent}1f`, color: "var(--game-ink)" }}
            >
              <span aria-hidden="true" className="text-[16px] leading-none">
                {meta.emoji}
              </span>
              {meta.label}
            </span>
          );
        })}
        {switchTrial && (
          <span
            className="pop-in inline-flex items-center gap-1.5 rounded-full bg-[#e5484d] px-3 py-1.5 text-[13px] font-extrabold text-white"
            role="status"
          >
            <span aria-hidden="true" className="text-[16px] leading-none">
              ⚡
            </span>
            Aturan berubah!
          </span>
        )}
      </div>

      {/* ── The town map — flat, bright, big targets ──────── */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-[2rem] border-2 shadow-pop"
        style={{
          aspectRatio: "1 / 0.92",
          borderColor: "var(--game-line)",
          background: "linear-gradient(180deg, #9adf7c 0%, #7cc95f 60%, #63b54a 100%)",
        }}
      >
        <style>{`
          @keyframes cm-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          @keyframes cm-goal {
            0%, 100% { box-shadow: 0 0 0 6px rgb(242 201 76 / 0.45), 0 8px 14px rgb(0 0 0 / 0.25); }
            50% { box-shadow: 0 0 0 10px rgb(242 201 76 / 0.2), 0 8px 14px rgb(0 0 0 / 0.25); }
          }
        `}</style>

        {/* Paper map panel */}
        <div
          className="absolute inset-x-[3%] bottom-[4%] top-[9%] rounded-[1.5rem]"
          style={{
            background: "linear-gradient(165deg, #fffdf4 0%, #fff3d6 60%, #ffe9b8 100%)",
            boxShadow:
              "0 14px 26px rgb(0 0 0 / 0.28), inset 0 0 0 3px rgb(255 255 255 / 0.85), inset 0 -8px 0 rgb(0 0 0 / 0.05)",
          }}
        >
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* Corner greenery so the town feels alive */}
            <g opacity="0.9">
              {[
                [7, 10],
                [93, 14],
                [8, 90],
                [92, 88],
              ].map(([tx, ty], i) => (
                <g key={i}>
                  <rect x={tx - 1} y={ty + 2.5} width="2" height="3.4" rx="0.8" fill="#b08b52" />
                  <circle cx={tx} cy={ty} r="4.6" fill="#5cbf63" />
                  <circle cx={tx - 2.4} cy={ty + 2} r="3.1" fill="#4fae57" />
                  <circle cx={tx + 2.6} cy={ty + 2.1} r="3.2" fill="#6fcf76" />
                </g>
              ))}
            </g>

            {/* Roads */}
            {layout?.edges.map((e) => {
              const na = layout.nodes[e.a];
              const nb = layout.nodes[e.b];
              if (!na || !nb) return null;
              const x1 = na.x * 100;
              const y1 = na.y * 100;
              const x2 = nb.x * 100;
              const y2 = nb.y * 100;
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              if (e.blocked) {
                return (
                  <g key={`${e.a}-${e.b}`}>
                    {/* Closed road: faded + torn edge */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d8d0bc" strokeWidth="7" strokeLinecap="round" />
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#e0654f"
                      strokeWidth="1.6"
                      strokeDasharray="3 3"
                      strokeLinecap="round"
                    />
                    {/* Construction barrier chip */}
                    <g>
                      <rect x={mx - 6.4} y={my - 4.6} width="12.8" height="9.2" rx="2.6" fill="#fff" stroke="#e0b04c" strokeWidth="0.9" />
                      <text x={mx} y={my + 2.6} textAnchor="middle" fontSize="6.4">
                        🚧
                      </text>
                    </g>
                  </g>
                );
              }
              return (
                <g key={`${e.a}-${e.b}`}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#d9c48f" strokeWidth="9" strokeLinecap="round" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ffffff" strokeWidth="6.2" strokeLinecap="round" />
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#f0d9a4"
                    strokeWidth="1"
                    strokeDasharray="2.6 2.6"
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {/* Trail the courier already rode */}
            {trail && path.length > 1 && (
              <polyline
                points={trail}
                fill="none"
                stroke="rgb(34 181 115 / 0.9)"
                strokeWidth="1.8"
                strokeDasharray="0.5 3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Ponds behind water badges */}
            {layout?.nodes
              .filter((n) => n.water)
              .map((n) => (
                <g key={`pond-${n.id}`}>
                  <ellipse cx={n.x * 100} cy={n.y * 100 + 2.6} rx="12" ry="7.6" fill="#59c2f0" opacity="0.55" />
                  <ellipse cx={n.x * 100} cy={n.y * 100 + 2.2} rx="9.6" ry="5.8" fill="#8ed7f7" />
                  <path
                    d={`M ${n.x * 100 - 4.5} ${n.y * 100 + 2.2} q 2.2 -1.8 4.5 0 q 2.2 1.8 4.5 0`}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="1"
                    strokeLinecap="round"
                    opacity="0.85"
                  />
                </g>
              ))}

            {/* Soft shadows under every badge */}
            {layout?.nodes.map((n) => (
              <ellipse
                key={`shadow-${n.id}`}
                cx={n.x * 100}
                cy={n.y * 100 + 3.4}
                rx="5.4"
                ry="2.1"
                fill="rgb(0 0 0 / 0.18)"
              />
            ))}
          </svg>

          {/* Node badges — big, colorful, one glance = one meaning */}
          {layout?.nodes.map((n) => {
            const isCurrent = n.id === currentPosition;
            const isGoal = n.id === layout.goalNode;
            const isVisited = visited.has(n.id) && !isCurrent;
            const kind = kindOf(n);
            const size = isGoal || isCurrent ? "size-14 sm:size-16" : "size-12 sm:size-[3.4rem]";
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => onCellTap(n.id)}
                disabled={!interactive}
                aria-label={`Titik peta ${n.id}${isGoal ? ", tujuan bendera" : ""}${n.water ? ", danau" : ""}${n.bluePost ? ", pos biru" : ""}${n.toll ? ", tol" : ""}`}
                className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  left: `${n.x * 100}%`,
                  top: `${n.y * 100}%`,
                  ...(interactive ? { cursor: "pointer" } : {}),
                }}
              >
                <span
                  className={`flex ${size} items-center justify-center rounded-full transition-transform ${
                    interactive ? "hover:scale-105 active:scale-90" : ""
                  }`}
                  style={{
                    background: isCurrent
                      ? "radial-gradient(circle at 35% 30%, #d9ffe9, #22b573)"
                      : isGoal
                        ? "radial-gradient(circle at 35% 30%, #fff3d0, #f2c94c)"
                        : kind.bg,
                    border: `3px solid ${
                      isCurrent ? "#128a56" : isGoal ? "#e0a126" : isVisited ? "#22b573" : kind.ring
                    }`,
                    boxShadow:
                      isGoal && !isCurrent
                        ? undefined
                        : "0 5px 10px rgb(0 0 0 / 0.25)",
                    ...(isGoal && !isCurrent ? { animation: "cm-goal 1.4s ease-in-out infinite" } : {}),
                    opacity: isVisited ? 0.85 : 1,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={`leading-none ${
                      isGoal || isCurrent
                        ? "text-[26px] sm:text-[30px]"
                        : kind.icon === "P"
                          ? "text-[20px] sm:text-[22px] font-black text-white"
                          : "text-[22px] sm:text-[25px]"
                    }`}
                    style={isCurrent ? { animation: "cm-bob 1.4s ease-in-out infinite" } : undefined}
                  >
                    {isGoal ? "🚩" : isCurrent ? "🛵" : kind.icon}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Persistent game label (E2E marker + kid reassurance) */}
        <span className="absolute left-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide shadow-sm backdrop-blur" style={{ color: "var(--game-ink)" }}>
          <span className="size-2 rounded-full" style={{ backgroundColor: accent }} />
          Kurir Peta
        </span>

        {/* Prompt / feedback bubble */}
        {feedbackKind === "break" || feedbackKind === "timeout" || feedbackKind === "delivered" ? (
          <div
            className={`pop-in absolute left-1/2 top-3 z-20 max-w-[86%] -translate-x-1/2 rounded-2xl rounded-tl-md border-2 px-4 py-2 text-center shadow-pop ${
              feedbackKind === "break" || feedbackKind === "timeout"
                ? "border-[#f3c1bd] bg-[#fdeceb]/95"
                : "border-[#b8e3cd] bg-[#eaf9f1]/95"
            }`}
            role="status"
          >
            <p
              className="text-[15px] font-extrabold tracking-tight"
              style={{
                color:
                  feedbackKind === "break" || feedbackKind === "timeout"
                    ? "var(--game-wrong)"
                    : "var(--game-correct)",
              }}
            >
              {feedbackKind === "delivered" ? "Paket sampai! 🎉" : feedbackMessage}
            </p>
          </div>
        ) : (
          <p
            className="absolute left-1/2 top-3 z-20 max-w-[86%] -translate-x-1/2 rounded-full border-2 border-white/70 bg-white/90 px-4 py-1.5 text-center text-[14px] font-extrabold shadow-sm backdrop-blur"
            style={{ color: "var(--game-ink)" }}
          >
            <span aria-hidden="true" className="mr-1">
              📦
            </span>
            Antar paket ke bendera
          </p>
        )}
      </div>

      <ProgressBar
        value={isPractice ? 0 : trialNumber / Math.max(1, totalTrials)}
        accent={accent}
      />
    </div>
  );
}
