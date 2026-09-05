"use client";

import type { CPRenderState } from "@cog/game-crystal-palace";
import { gameMeta } from "@/lib/games";
import { TrialHeader, ProgressBar } from "@/components/game/GameFrame";

interface CrystalPalaceProps {
  renderState: CPRenderState;
  onCellTap: (cellIndex: number) => void;
}

const CRYSTAL_COLORS = ["#e5484d", "#22b573", "#3b7cf5", "#a855f7"];

/** Gem silhouette per cut index (24×24 viewBox) */
const CRYSTAL_PATHS = [
  "M12 2 22 12 12 22 2 12Z",
  "M12 2 20 20H4Z",
  "M6 4h12l4 16H2Z",
  "M12 2.5c6 0 9.5 4 9.5 9.5s-3.5 9.5-9.5 9.5S2.5 18 2.5 12 6 2.5 12 2.5Z",
];

export function CrystalPalace({ renderState, onCellTap }: CrystalPalaceProps) {
  const {
    phase = "waiting",
    grid = null,
    tappedIndices = [],
    feedbackCorrect = null,
    feedbackMessage = "",
    trialNumber = 0,
    totalTrials = 10,
    isPractice = true,
    score = 0,
  } = renderState ?? {};

  const accent = gameMeta("crystal_palace").color;
  const interactive = phase === "waiting";
  const tappedSet = new Set(tappedIndices);

  const targetColor = grid?.targetColor ?? 0;
  const targetShape = grid?.targetShape ?? 0;
  const cols = grid ? Math.round(Math.sqrt(grid.cells.length)) : 3;

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <TrialHeader isPractice={isPractice} trial={trialNumber} total={totalTrials} score={score} accent={accent} />

      {/* ── Target decree card ───────────────────────────── */}
      <div
        className="flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-2.5"
        style={{ backgroundColor: "var(--game-surface-2)", border: "1px solid var(--game-line)" }}
        aria-label="Kristal target"
      >
        <span className="text-[12px] font-extrabold uppercase tracking-wide" style={{ color: accent }}>
          Cari kristal ini
        </span>
        <CrystalGem color={CRYSTAL_COLORS[targetColor]} shape={targetShape} size={34} lit glow={false} />
        <span className="text-[12px] font-bold text-ink-mute">di istana</span>
      </div>

      {/* ── Courtyard ────────────────────────────────────── */}
      <div
        className="relative w-full touch-none select-none overflow-hidden rounded-3xl border shadow-pop"
        style={{
          aspectRatio: "1 / 0.82",
          borderColor: "var(--game-line)",
          perspective: "900px",
          background:
            "linear-gradient(180deg, #dceef4 0%, #c3e0ea 55%, #a9cfdd 100%)",
        }}
        aria-hidden="false"
      >
        <style>{`
          @keyframes cp-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
          @keyframes cp-glow {
            0%, 100% { filter: drop-shadow(0 0 2px rgb(255 255 255 / 0.6)); }
            50% { filter: drop-shadow(0 0 9px rgb(255 255 255 / 0.95)); }
          }
        `}</style>

        {/* Board */}
        <div
          className="absolute inset-x-[3%] top-[16%] bottom-[5%] rounded-2xl p-2"
          style={{
            transform: "rotateX(18deg)",
            transformOrigin: "50% 100%",
            background: "linear-gradient(160deg, #eef7f3 0%, #dcebe4 100%)",
            boxShadow: "0 16px 28px rgb(0 0 0 / 0.25), inset 0 0 0 3px rgb(255 255 255 / 0.6)",
          }}
        >
          <div
            className="grid h-full w-full gap-1.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            role="group"
            aria-label="Taman kristal"
          >
            {grid?.cells.map((cell) => {
              const tapped = tappedSet.has(cell.id);
              const row = Math.floor(cell.id / cols);
              return (
                <button
                  key={cell.id}
                  type="button"
                  onClick={() => onCellTap(cell.id)}
                  disabled={!interactive || tapped}
                  aria-label={`Kristal ${cell.id}${cell.isMatch ? ", cocok" : ""}${tapped ? ", sudah dipilih" : ""}`}
                  className="relative flex items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    backgroundColor: tapped
                      ? "rgb(255 255 255 / 0.75)"
                      : "rgb(255 255 255 / 0.28)",
                    boxShadow: tapped ? `inset 0 0 0 3px ${accent}` : "inset 0 0 0 1px rgb(255 255 255 / 0.55)",
                    transform: tapped ? undefined : `translateY(${-(row % 3) * 2}px)`,
                    ...(interactive && !tapped ? { cursor: "pointer" } : {}),
                  }}
                >
                  {/* pedestal shadow */}
                  <span
                    className="absolute bottom-[8%] left-1/2 h-1.5 w-7 -translate-x-1/2 rounded-full bg-black/20 blur-[1.5px]"
                    aria-hidden="true"
                  />
                  <CrystalGem
                    color={CRYSTAL_COLORS[cell.color]}
                    shape={cell.shape}
                    size={30}
                    lit={tapped}
                    glow={cell.isMatch && interactive}
                  />
                  {tapped && (
                    <span
                      className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-[#22b573] text-[10px] font-black text-white shadow"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Persistent game label (E2E marker) */}
        <span className="absolute left-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/85 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#2a9cb3] shadow-sm backdrop-blur">
          <span className="size-2 rounded-full" style={{ backgroundColor: accent }} />
          Istana Kristal
        </span>

        {/* Instruction / feedback bubble — below the corner badge row */}
        {phase === "feedback" ? (
          <div
            className={`pop-in absolute left-1/2 top-12 z-20 max-w-[86%] -translate-x-1/2 rounded-2xl rounded-tl-md border px-4 py-1.5 text-center shadow-pop ${
              feedbackCorrect === false ? "border-[#f3c1bd] bg-[#fdeceb]/95" : "border-[#b8e3cd] bg-[#eaf9f1]/95"
            }`}
            role="status"
          >
            <p
              className="text-[14px] font-extrabold tracking-tight"
              style={{ color: feedbackCorrect === false ? "var(--game-wrong)" : "var(--game-correct)" }}
            >
              {feedbackMessage}
            </p>
          </div>
        ) : (
          <p className="absolute left-1/2 top-12 z-20 max-w-[86%] -translate-x-1/2 rounded-full border border-white/60 bg-white/85 px-3 py-1 text-center text-[13px] font-bold shadow-sm backdrop-blur" style={{ color: "var(--game-ink)" }}>
            Temukan semua kristal yang cocok
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

/** Faceted 3D-looking gem with a ground shadow. */
function CrystalGem({
  color,
  shape,
  size,
  lit = false,
  glow = false,
}: {
  color: string;
  shape: number;
  size: number;
  lit?: boolean;
  glow?: boolean;
}) {
  const path = CRYSTAL_PATHS[shape] ?? CRYSTAL_PATHS[0];
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size, animation: lit ? "cp-glow 900ms ease-in-out infinite" : glow ? "cp-float 2.4s ease-in-out infinite" : undefined }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" className="h-full w-full" style={{ filter: lit ? `drop-shadow(0 0 6px ${color})` : "drop-shadow(0 3px 3px rgb(0 0 0 / 0.25))" }}>
        {/* back facet (darker) */}
        <path d={path} fill={shade(color, -28)} stroke={shade(color, -42)} strokeWidth="0.7" />
        {/* front facet (lighter) */}
        {shape === 0 ? (
          <path d="M12 2 22 12 12 22 2 12Z" fill={color} opacity="0.65" transform="scale(0.86) translate(1.7 1.7)" />
        ) : (
          <path d={path} fill={color} opacity="0.8" transform="scale(0.8) translate(3 3)" />
        )}
        {/* specular highlight */}
        <path
          d={
            shape === 0
              ? "M12 4l6.5 6.5L12 20 5.5 10.5Z"
              : shape === 1
                ? "M12 5l5 13H7Z"
                : shape === 2
                  ? "M7 6l3-2 10 14h-9Z"
                  : "M12 6c3.6 0 6 2.8 6 6s-2.4 6-6 6-6-2.8-6-6 2.4-6 6-6Z"
          }
          fill="rgba(255,255,255,0.55)"
        />
      </svg>
    </span>
  );
}

/** Darken/lighten a hex colour by `amount` (-255..255). */
function shade(hex: string, amount: number): string {
  const num = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}