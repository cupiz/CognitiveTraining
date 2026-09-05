"use client";

/**
 * Mini animated preview per game, shown inside the "Cara main" card so kids
 * see the action before pressing "Mulai main!". Everything is pure CSS + SVG
 * (no engine, no timers) — same lightweight approach as the arenas.
 *
 * Scenes loop forever and are decorative: `aria-hidden`, and animations are
 * disabled under `prefers-reduced-motion`.
 */

import { SymbolGlyph, EmojiStimulus, DirectionArrow, StopBadge } from "./Stimulus";
import { hexToRgba } from "./GameFrame";

const PANE_COLORS = ["#e5484d", "#f2c94c", "#22b573", "#3b7cf5"];

function hpCss(): string {
  return `
    @keyframes hp-chase { 0%,12% { opacity:.18; transform:scale(.82) } 40%,100% { opacity:1; transform:scale(1) } }
    @keyframes hp-slide { from { transform:translateX(0) } to { transform:translateX(-50%) } }
    @keyframes hp-bob { 0%,100% { transform:translateY(0) } 45% { transform:translateY(-5px) } }
    @keyframes hp-pop { 0%,50% { opacity:.2; transform:scale(.85) } 62%,100% { opacity:1; transform:scale(1) } }
    @keyframes hp-pulse { 0%,100% { opacity:1 } 50% { opacity:.45 } }
    @keyframes hp-gem { 0%,100% { transform:scale(1) } 50% { transform:scale(1.18) } }
    @keyframes hp-go { 0%,58% { opacity:1 } 66%,100% { opacity:0 } }
    @keyframes hp-stop { 0%,58% { opacity:0 } 66%,100% { opacity:1 } }
    @keyframes hp-run { 0% { transform:translateX(-18px) } 55% { transform:translateX(18px) } 58%,100% { transform:translateX(18px) } }
    @keyframes hp-route { 0% { transform:translate(0,0) } 30% { transform:translate(36px,0) } 62% { transform:translate(36px,-32px) } 100% { transform:translate(36px,-32px) } }
    @keyframes hp-ring { 0%,45% { transform:translateX(0) } 55%,100% { transform:translateX(74px) } }
    @keyframes hp-halfa { 0%,45% { opacity:1 } 55%,100% { opacity:.35 } }
    @keyframes hp-halfb { 0%,45% { opacity:.35 } 55%,100% { opacity:1 } }
    @media (prefers-reduced-motion: reduce) {
      .hp-stage * { animation: none !important; }
    }
  `;
}

function Stage({ accent, children }: { accent: string; children: React.ReactNode }) {
  return (
    <div
      className="hp-stage relative flex h-[104px] w-full items-center justify-center overflow-hidden rounded-2xl border"
      style={{
        borderColor: hexToRgba(accent, 0.25),
        background: `linear-gradient(180deg, ${hexToRgba(accent, 0.1)}, ${hexToRgba(accent, 0.03)})`,
      }}
      aria-hidden="true"
    >
      <style>{hpCss()}</style>
      {children}
    </div>
  );
}

/* ── scenes ───────────────────────────────────────────── */

function MemoryScene({ accent }: { accent: string }) {
  const lit = [0, 1, 2, 5];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: 9 }, (_, i) => (
        <span
          key={i}
          className="size-7 rounded-md"
          style={{
            backgroundColor: accent,
            opacity: 0.18,
            boxShadow: `0 0 10px ${accent}33`,
            ...(lit.includes(i)
              ? { animation: "hp-chase 2.4s ease-in-out infinite", animationDelay: `${lit.indexOf(i) * 0.6}s` }
              : {}),
          }}
        />
      ))}
    </div>
  );
}

function Token({ char, color, className = "" }: { char: string; color: string; className?: string }) {
  return (
    <span className={`flex items-center justify-center ${className}`} style={{ color }}>
      <SymbolGlyph char={char} className="size-7" color={color} />
    </span>
  );
}

function TargetWatchScene({ accent }: { accent: string }) {
  const stream = ["●", "▲", "★", "■", "●", "▲", "★", "■"];
  return (
    <div className="relative w-full">
      <div
        className="absolute left-0 top-1/2 flex w-[200%] -translate-y-1/2 items-center gap-8 px-8"
        style={{ animation: "hp-slide 3.4s linear infinite" }}
      >
        {stream.map((s, i) => (
          <Token key={i} char={s} color={s === "★" ? accent : "var(--game-ink-mute)"} />
        ))}
      </div>
      {/* target reminder pill */}
      <div
        className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border-2 px-2.5 py-1"
        style={{ borderColor: accent, backgroundColor: "var(--game-surface-2)", animation: "hp-pulse 1.8s ease-in-out infinite" }}
      >
        <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: accent }}>
          Ketuk!
        </span>
        <Token char="★" color={accent} className="scale-75" />
      </div>
    </div>
  );
}

function QuickMatchScene({ accent }: { accent: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex items-center gap-1 rounded-full border px-2.5 py-1"
        style={{ borderColor: hexToRgba(accent, 0.5), backgroundColor: "var(--game-surface-2)" }}
      >
        <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: accent }}>
          Ingat
        </span>
        <EmojiStimulus emoji="🔵" className="size-5" />
      </div>
      <div className="flex items-center gap-3">
        <EmojiStimulus emoji="🔺" className="size-8" />
        <span
          className="flex size-10 items-center justify-center rounded-xl border-2"
          style={{ borderColor: accent, backgroundColor: hexToRgba(accent, 0.12), animation: "hp-bob 1.6s ease-in-out infinite" }}
        >
          <EmojiStimulus emoji="🔵" className="size-8" />
        </span>
        <EmojiStimulus emoji="🟢" className="size-8" />
      </div>
    </div>
  );
}

function StopSignalScene({ accent }: { accent: string }) {
  return (
    <div className="relative flex h-16 w-28 items-center justify-center">
      <span className="absolute inset-0 flex items-center justify-center" style={{ animation: "hp-go 2.8s ease-in-out infinite" }}>
        <span style={{ color: accent, animation: "hp-bob 0.9s ease-in-out infinite" }}>
          <DirectionArrow direction="right" className="size-14" />
        </span>
      </span>
      <span className="absolute inset-0 flex items-center justify-center" style={{ animation: "hp-stop 2.8s ease-in-out infinite" }}>
        <StopBadge className="size-14" />
      </span>
    </div>
  );
}

function RuleSwitchScene({ accent }: { accent: string }) {
  const inner = (i: number) =>
    i === 0 ? (
      <EmojiStimulus emoji="🔴" className="size-8" />
    ) : (
      <EmojiStimulus emoji="🔵" className="size-8" />
    );
  return (
    <div className="relative flex flex-col items-center gap-2.5">
      {/* rule chip swaps between color / shape */}
      <div className="relative flex h-6 w-20 items-center justify-center">
        <span className="absolute inset-0 flex items-center justify-center gap-1 rounded-full border px-2" style={{ borderColor: hexToRgba(accent, 0.5), backgroundColor: "var(--game-surface-2)", animation: "hp-halfa 2.2s ease-in-out infinite" }}>
          <span className="text-[10px] font-extrabold" style={{ color: accent }}>🎨 Warna</span>
        </span>
        <span className="absolute inset-0 flex items-center justify-center gap-1 rounded-full border px-2" style={{ borderColor: hexToRgba(accent, 0.5), backgroundColor: "var(--game-surface-2)", animation: "hp-halfb 2.2s ease-in-out infinite" }}>
          <span className="text-[10px] font-extrabold" style={{ color: accent }}>🔺 Bentuk</span>
        </span>
      </div>
      {/* two cards + sliding highlight ring */}
      <div className="relative flex items-center gap-[26px]" style={{ padding: "0 6px" }}>
        <span className="flex size-12 items-center justify-center rounded-xl border" style={{ borderColor: "var(--game-line)", backgroundColor: "var(--game-surface)", animation: "hp-halfa 2.2s ease-in-out infinite" }}>
          {inner(0)}
        </span>
        <span className="flex size-12 items-center justify-center rounded-xl border" style={{ borderColor: "var(--game-line)", backgroundColor: "var(--game-surface)", animation: "hp-halfb 2.2s ease-in-out infinite" }}>
          {inner(1)}
        </span>
        <span
          className="pointer-events-none absolute left-[6px] top-0 size-12 rounded-xl border-[3px]"
          style={{ borderColor: accent, boxShadow: `0 0 12px ${accent}77`, animation: "hp-ring 2.2s ease-in-out infinite" }}
        />
      </div>
    </div>
  );
}

function SpiceStallScene({ accent }: { accent: string }) {
  const order = ["🌶️", "🧄", "🍋"];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-1.5">
        {order.map((e, i) => (
          <span
            key={i}
            className="flex size-8 items-center justify-center rounded-lg border-2 text-lg"
            style={{
              borderColor: accent,
              backgroundColor: "var(--game-surface-2)",
              animation: "hp-pop 1.5s ease-in-out infinite",
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {e}
          </span>
        ))}
      </div>
      <span className="text-sm" style={{ color: "var(--game-ink-mute)" }}>↓</span>
      <span className="text-2xl" style={{ animation: "hp-gem 1.5s ease-in-out infinite", animationDelay: "1s", filter: "drop-shadow(0 2px 4px rgb(0 0 0 / 0.15))" }}>
        🍲
      </span>
    </div>
  );
}

function RedLightScene({ accent }: { accent: string }) {
  return (
    <div className="flex items-center gap-6">
      {/* lamp housing */}
      <div
        className="flex flex-col items-center gap-2 rounded-2xl border-2 px-2.5 py-2"
        style={{ borderColor: hexToRgba(accent, 0.6), backgroundColor: hexToRgba(accent, 0.08) }}
      >
        <span
          className="flex size-7 items-center justify-center rounded-full"
          style={{ backgroundColor: "#22b573", animation: "hp-go 3.4s ease-in-out infinite", boxShadow: "0 0 12px 3px rgb(34 181 115 / 0.55)" }}
        />
        <span
          className="flex size-7 items-center justify-center rounded-full"
          style={{ backgroundColor: "#d64545", animation: "hp-stop 3.4s ease-in-out infinite", boxShadow: "0 0 12px 3px rgb(214 69 69 / 0.55)" }}
        />
      </div>
      <div className="relative flex h-16 w-24 items-center">
        <span className="absolute left-0 text-3xl" style={{ animation: "hp-run 3.4s ease-in-out infinite" }}>
          🏃
        </span>
        {/* stop hand flashes while red */}
        <span className="absolute right-0 text-3xl" style={{ animation: "hp-go 3.4s ease-in-out infinite" }}>
          🏁
        </span>
      </div>
    </div>
  );
}

function CourierScene({ accent }: { accent: string }) {
  return (
    <div className="relative flex h-[88px] w-48 items-center justify-center">
      <div
        className="relative h-[76px] w-[150px] overflow-hidden rounded-xl border-2"
        style={{
          borderColor: hexToRgba(accent, 0.5),
          background: "linear-gradient(180deg, #9adf7c, #6cc45f)",
          boxShadow: "inset 0 0 0 4px rgb(255 255 255 / 0.35)",
        }}
      >
        {/* map panel */}
        <div className="absolute inset-[5px] rounded-lg" style={{ background: "linear-gradient(165deg, #fffdf4, #ffedc2)" }} />
        {/* roads */}
        <div className="absolute left-1/2 top-[5px] bottom-[5px] w-2 -translate-x-1/2 rounded-full border-x-2 border-[#d9c48f] bg-white" />
        <div className="absolute left-[5px] right-[5px] top-1/2 h-2 -translate-y-1/2 rounded-full border-x-2 border-[#d9c48f] bg-white" />
        {/* house + pond + goal */}
        <div className="absolute left-[8px] top-[8px] text-[11px]">🏠</div>
        <div className="absolute bottom-[7px] left-[10px] text-[11px]">💧</div>
        <div className="absolute right-2 top-2 text-xl" style={{ filter: "drop-shadow(0 2px 2px rgb(0 0 0 / 0.25))" }}>🚩</div>
        {/* courier riding the route */}
        <div className="absolute bottom-2.5 left-4 text-lg" style={{ animation: "hp-route 3.6s ease-in-out infinite" }}>
          🛵
        </div>
      </div>
    </div>
  );
}

function LighthouseScene() {
  return (
    <div className="relative flex h-[88px] items-end">
      {/* night sea */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-2xl" style={{ background: "linear-gradient(180deg, #14264d00, #14264d)" }} />
      <div className="relative flex flex-col items-center">
        {/* lantern room with panes */}
        <div className="relative z-10 flex h-6 w-12 items-center justify-center gap-1 rounded-t-lg bg-[#2a3040] shadow-inner">
          {PANE_COLORS.map((color, i) => (
            <span
              key={i}
              className="h-4 w-2 rounded-[2px]"
              style={{
                backgroundColor: color,
                opacity: 0.25,
                boxShadow: `0 0 8px 2px ${color}aa`,
                animation: "hp-chase 2.4s ease-in-out infinite",
                animationDelay: `${i * 0.6}s`,
              }}
            />
          ))}
        </div>
        {/* roof */}
        <div className="h-2.5 w-8 rounded-t-md" style={{ background: "#d14a3c", clipPath: "polygon(0 100%, 50% 0, 100% 100%)" }} />
        {/* stripes */}
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-3 w-8" style={{ background: i % 2 === 0 ? "#f3ede1" : "#d14a3c" }} />
        ))}
        {/* base */}
        <div className="h-3 w-12 rounded-t-md bg-[#4a5260]" />
      </div>
      {/* waves */}
      <div className="absolute bottom-2 left-24 flex items-end gap-1.5 opacity-70">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-1.5 w-6 rounded-full bg-white/40" style={{ marginBottom: (i % 3) * 3 }} />
        ))}
      </div>
    </div>
  );
}

function SushiScene({ accent }: { accent: string }) {
  const plates = ["🍣", "🍙", "🍤", "🍣", "🍙", "🍤"];
  return (
    <div className="relative h-full w-full">
      {/* order chip */}
      <div className="absolute left-1/2 top-2.5 z-10 -translate-x-1/2">
        <span
          className="flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1"
          style={{ borderColor: accent, backgroundColor: "var(--game-surface-2)", animation: "hp-pulse 1.6s ease-in-out infinite" }}
        >
          <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: accent }}>Pesanan</span>
          <span className="text-base">🍣</span>
        </span>
      </div>
      {/* conveyor belt */}
      <div className="absolute inset-x-0 top-[62%] h-1.5 bg-[#d8cfc0]" style={{ boxShadow: "inset 0 1px 2px rgb(0 0 0 / 0.15)" }} />
      {/* plates sliding */}
      <div
        className="absolute left-0 top-[38%] flex w-[200%] items-center gap-7 px-7"
        style={{ animation: "hp-slide 3.2s linear infinite" }}
      >
        {plates.map((p, i) => (
          <span key={i} className="flex size-9 items-center justify-center rounded-full border border-[#e8e2d6] bg-white text-xl shadow-sm">
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

function CrystalScene({ accent }: { accent: string }) {
  const neighbors = [0, 1, 2, 3];
  return (
    <div className="relative flex items-center justify-center">
      {/* garden crystals */}
      <div className="absolute left-[12%] top-1/2 flex -translate-y-1/2 gap-1.5">
        {neighbors.map((i) => (
          <span
            key={i}
            className="size-3 -rotate-12 rounded-[2px]"
            style={{
              backgroundColor: i % 2 === 0 ? "#e5484d" : "#3b7cf5",
              opacity: 0.5,
              animation: "hp-chase 2s ease-in-out infinite",
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
      {/* the matching crystal */}
      <span
        className="relative z-10 text-4xl"
        style={{
          animation: "hp-gem 1.6s ease-in-out infinite",
          filter: `drop-shadow(0 0 10px ${accent}aa)`,
        }}
      >
        💎
      </span>
      <div className="absolute right-[12%] top-1/2 flex -translate-y-1/2 gap-1.5">
        {neighbors.map((i) => (
          <span
            key={i}
            className="size-3 rotate-12 rounded-[2px]"
            style={{
              backgroundColor: i % 2 === 0 ? "#22b573" : "#a855f7",
              opacity: 0.5,
              animation: "hp-chase 2s ease-in-out infinite",
              animationDelay: `${(i + 2) * 0.5}s`,
            }}
          />
        ))}
      </div>
      {/* sparkle */}
      <span className="absolute right-[30%] top-3 text-xs" style={{ animation: "hp-pulse 1.3s ease-in-out infinite" }}>✨</span>
    </div>
  );
}


function TrainNBackScene({ accent }: { accent: string }) {
  return (
    <div className="relative flex h-[88px] w-48 items-center justify-center">
      <div
        className="relative h-[76px] w-[150px] overflow-hidden rounded-xl border-2"
        style={{
          borderColor: hexToRgba(accent, 0.5),
          background: "linear-gradient(180deg, #b8e2f5 55%, #a5d68f 55%, #7fbf6a 100%)",
        }}
      >
        {/* wagon window with a moving fruit */}
        <div className="absolute inset-x-4 top-2 flex h-10 items-center justify-center rounded-lg border-2 border-[#3f7ec7] bg-[#fdf3d7]">
          <span className="text-xl" style={{ animation: "cm-bob 1.6s ease-in-out infinite" }}>
            🍎
          </span>
        </div>
        {/* bell */}
        <div
          className="absolute bottom-1 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#d99418] bg-[#ffe27a] text-base"
          style={{ animation: "cm-bob 1.2s ease-in-out infinite" }}
        >
          🔔
        </div>
        <span className="absolute right-2 top-1 text-sm opacity-60">🚂</span>
      </div>
    </div>
  );
}

function DualGardenScene({ accent }: { accent: string }) {
  return (
    <div className="relative flex h-[88px] w-48 items-center justify-center">
      <div
        className="relative h-[76px] w-[150px] overflow-hidden rounded-xl border-2"
        style={{
          borderColor: hexToRgba(accent, 0.5),
          background: "linear-gradient(180deg, #cdeccd 40%, #8fd07a 40%, #7fbf6a 100%)",
        }}
      >
        {/* bridge stream */}
        <div className="absolute inset-x-3 top-1.5 flex h-8 items-center justify-center rounded-lg border-2 border-[#8a6d3b] bg-[#f2e3bd]">
          <span className="text-lg" style={{ animation: "cm-bob 1.8s ease-in-out infinite" }}>
            🐰
          </span>
        </div>
        {/* fruit stream */}
        <div className="absolute inset-x-3 bottom-1 flex h-6 items-center justify-center rounded-lg border-2 border-[#4e8f3f] bg-[#dff3d0]">
          <span className="text-base">🍎</span>
        </div>
        <span className="absolute bottom-1.5 right-2 rounded bg-[#ffe9b8] px-1 text-[9px] font-black">
          Tandai!
        </span>
      </div>
    </div>
  );
}

function CrystalTowerScene({ accent }: { accent: string }) {
  return (
    <div className="relative flex h-[88px] w-48 items-center justify-center">
      <div
        className="relative flex h-[76px] w-[150px] items-end justify-center gap-2 overflow-hidden rounded-xl border-2 px-2 pb-1.5"
        style={{
          borderColor: hexToRgba(accent, 0.5),
          background: "linear-gradient(180deg, #1b2450, #2a3568)",
        }}
      >
        {[1, 0, 0].map((count, i) => (
          <div
            key={i}
            className="relative flex h-[56px] w-[36px] flex-col-reverse items-center gap-0.5 rounded-lg border-2"
            style={{
              borderColor: i === 2 ? "#f2c94c" : "rgb(255 255 255 / 0.3)",
              backgroundColor: i === 0 ? "rgb(255 255 255 / 0.08)" : "transparent",
            }}
          >
            {Array.from({ length: count }, (_, d) => (
              <span
                key={d}
                className="w-[26px] rounded-sm border border-[#6f42c0]"
                style={{
                  height: "8px",
                  background: "linear-gradient(180deg, #cdb3ff, #8f5fe0)",
                }}
              />
            ))}
          </div>
        ))}
        <span
          className="absolute right-4 top-1 text-sm"
          style={{ animation: "cm-bob 1.4s ease-in-out infinite" }}
        >
          🎯
        </span>
      </div>
    </div>
  );
}

function WideViewScene({ accent }: { accent: string }) {
  return (
    <div className="relative flex h-[88px] w-48 items-center justify-center">
      <div
        className="relative flex h-[76px] w-[150px] items-center justify-center overflow-hidden rounded-xl border-2"
        style={{
          borderColor: hexToRgba(accent, 0.5),
          background: "radial-gradient(circle at 50% 50%, #2a3c78, #0d1330)",
        }}
      >
        {/* central lens */}
        <div className="flex size-9 items-center justify-center rounded-full border-2 border-[#2f7fc9] bg-white/90">
          <span className="text-base">▲</span>
        </div>
        {/* flashing bird on the ring */}
        <span
          className="absolute left-[14%] top-[18%] flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#f2a532] text-xs"
          style={{
            animation: "sx-blink 1.6s ease-in-out infinite",
          }}
        >
          🐦
        </span>
        <span className="absolute bottom-[12%] right-[12%] text-xs opacity-60">🐦?</span>
      </div>
    </div>
  );
}

/* ── dispatcher ───────────────────────────────────────── */


function scene(gameKey: string, accent: string): React.ReactNode {
  switch (gameKey) {
    case "memory_matrix":
      return <MemoryScene accent={accent} />;
    case "target_watch":
      return <TargetWatchScene accent={accent} />;
    case "quick_match":
      return <QuickMatchScene accent={accent} />;
    case "stop_signal":
      return <StopSignalScene accent={accent} />;
    case "rule_switch":
      return <RuleSwitchScene accent={accent} />;
    case "spice_stall":
      return <SpiceStallScene accent={accent} />;
    case "red_light":
      return <RedLightScene accent={accent} />;
    case "courier_map":
      return <CourierScene accent={accent} />;
    case "lighthouse_keeper":
      return <LighthouseScene />;
    case "sushi_express":
      return <SushiScene accent={accent} />;
    case "crystal_palace":
      return <CrystalScene accent={accent} />;
    case "train_n_back":
      return <TrainNBackScene accent={accent} />;
    case "dual_garden":
      return <DualGardenScene accent={accent} />;
    case "crystal_tower":
      return <CrystalTowerScene accent={accent} />;
    case "wide_view":
      return <WideViewScene accent={accent} />;
    default:
      return (
        <div className="flex items-center gap-2 text-2xl">
          <span>👆</span>
          <span className="text-sm font-bold" style={{ color: accent }}>Ketuk jawaban yang benar!</span>
        </div>
      );
  }
}

export function HowToPreview({ gameKey, accent }: { gameKey: string; accent: string }) {
  return <Stage accent={accent}>{scene(gameKey, accent)}</Stage>;
}