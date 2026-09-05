"use client";

import { useId } from "react";

/**
 * Deterministic SVG stimuli.
 *
 * Emoji and unicode glyphs render differently per OS/font — for a cognitive
 * task that means some children literally see different stimuli. Every stimulus
 * here is drawn as SVG so appearance is identical everywhere, plus it gets the
 * soft "dimensional" shading that flat glyphs can't have.
 */

/* ── color utils ──────────────────────────────────────── */

function shade(hex: string, amt: number): string {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;
  const channel = (shift: number) => {
    const v = (num >> shift) & 255;
    const next = amt < 0 ? Math.round(v * (1 + amt)) : Math.round(v + (255 - v) * amt);
    return Math.max(0, Math.min(255, next)).toString(16).padStart(2, "0");
  };
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

type StrokeProps = {
  fill: "none";
  stroke: string;
  strokeWidth: number;
  strokeLinejoin: "round";
  strokeLinecap: "round";
};

function strokeShape(color: string, strokeWidth = 7): StrokeProps {
  return {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinejoin: "round",
    strokeLinecap: "round",
  };
}

/**
 * Gradient-filled shape. The SVG paint-server id must be unique per stimulus
 * instance: several same-color shapes on one page would otherwise define the
 * same element id, and which one wins depends on DOM order — a remount of the
 * first instance can leave the rest painting nothing (invisible stimulus).
 */
function fill(children: React.ReactNode, color: string, uid: string) {
  const id = `st-${uid}-${color.replace("#", "")}`;
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shade(color, 0.22)} />
          <stop offset="55%" stopColor={color} />
          <stop offset="100%" stopColor={shade(color, -0.18)} />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>{children}</g>
    </>
  );
}

/** Sanitized per-instance scope for paint-server ids. */
function useStimulusId(): string {
  return useId().replace(/[^a-zA-Z0-9]/g, "");
}

/* ── shape primitives (all live in a 100×100 box) ─────── */

function starPoints(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / points) * i - Math.PI / 2;
    const x = (cx + r * Math.cos(a)).toFixed(3);
    const y = (cy + r * Math.sin(a)).toFixed(3);
    pts.push(`${x},${y}`);
  }
  return pts.join(" ");
}

const diamondPath = "M50 14 L86 50 L50 86 L14 50 Z";

const HEART_PATH = "M50 84 C 28 66 16 51 20 38 C 23 29 33 25 41 31 C 46 34.6 48 39 50 43 C 52 39 54 34.6 59 31 C 67 25 77 29 80 38 C 84 51 72 66 50 84 Z";

const SPARKLE_PATH = "M50 6 L59 41 L94 50 L59 59 L50 94 L41 59 L6 50 L41 41 Z";

const CRESCENT_PATH = "M72 16 C 95 30 95 70 72 84 A 30 30 0 1 0 26 22 C 38 10 58 9 72 16 Z";

function FilledStar({ color, uid }: { color: string; uid: string }) {
  return fill(
    <polygon points={starPoints(50, 52, 40, 17, 5)} />,
    color,
    uid,
  );
}

function OutlinedStar({ color }: { color: string }) {
  return <polygon points={starPoints(50, 52, 40, 17, 5)} {...strokeShape(color)} />;
}

/* ── unicode → SVG (Target Watch & generic symbols) ───── */

const SYMBOL_RENDERERS: Record<string, (c: string, uid: string) => React.ReactNode> = {
  "●": (c, uid) => fill(<circle cx="50" cy="50" r="36" />, c, uid),
  "○": (c) => <circle cx="50" cy="50" r="33" {...strokeShape(c, 8)} />,
  "■": (c, uid) => fill(<rect x="14" y="14" width="72" height="72" rx="14" />, c, uid),
  "□": (c) => <rect x="17" y="17" width="66" height="66" rx="12" {...strokeShape(c, 8)} />,
  "▲": (c, uid) => fill(<polygon points="50,14 86,80 14,80" />, c, uid),
  "△": (c) => <polygon points="50,18 84,80 16,80" {...strokeShape(c, 8)} />,
  "◆": (c, uid) => fill(<polygon points={diamondPath} />, c, uid),
  "◇": (c) => <polygon points="50,18 82,50 50,82 18,50" {...strokeShape(c, 8)} />,
  "★": (c, uid) => <FilledStar color={c} uid={uid} />,
  "☆": (c) => <OutlinedStar color={c} />,
  "✦": (c, uid) => fill(<polygon points={SPARKLE_PATH} />, c, uid),
  "☽": (c, uid) => fill(<path d={CRESCENT_PATH} />, c, uid),
  "✚": (c, uid) => fill(<path d="M34 20 h12 v14 h14 v12 h-14 v14 h-12 v-14 h-14 v-12 h14 Z" />, c, uid),
  "✕": (c, uid) => fill(<path d="M32 24 l14-4 4 14-14 4ZM52 32l14-4 4 14-14 4Z" />, c, uid),
  "+": (c, uid) => fill(<path d="M43 20h14v23h23v14H57v23H43V57H20V43h23Z" />, c, uid),
};

export function SymbolGlyph({
  char,
  className = "size-16",
  color,
}: {
  char: string;
  className?: string;
  color?: string;
}) {
  const uid = useStimulusId();
  const renderer = SYMBOL_RENDERERS[char];
  if (!renderer) {
    return (
      <span className={`flex items-center justify-center ${className}`} aria-hidden="true">
        {char}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className={className} style={{ color }} aria-hidden="true">
      {renderer("currentColor", uid)}
    </svg>
  );
}

/* ── emoji → SVG (Quick Match options) ───────────────── */

interface EmojiSpec {
  shape: "circle" | "square" | "diamond" | "triangle-up" | "triangle-down" | "heart";
  color: string;
  hollow?: boolean;
}

const EMOJI_SPECS: Record<string, EmojiSpec> = {
  "🔴": { shape: "circle", color: "#D64545" },
  "🔵": { shape: "circle", color: "#2F6FDD" },
  "🟢": { shape: "circle", color: "#1E9A5A" },
  "🟡": { shape: "circle", color: "#E3AC24" },
  "🟠": { shape: "circle", color: "#E07F2B" },
  "🟣": { shape: "circle", color: "#7C4DD8" },
  "🟤": { shape: "circle", color: "#9A6B43" },
  "⚫": { shape: "circle", color: "#2B2B31" },
  "⚪": { shape: "circle", color: "#F4F2EB", hollow: true },
  "🔺": { shape: "triangle-up", color: "#D64545" },
  "🔻": { shape: "triangle-down", color: "#D64545" },
  "🔷": { shape: "diamond", color: "#2F6FDD" },
  "🔶": { shape: "diamond", color: "#E07F2B" },
  "⬛": { shape: "square", color: "#2B2B31" },
  "⬜": { shape: "square", color: "#F4F2EB", hollow: true },
  "💚": { shape: "heart", color: "#1E9A5A" },
  "💙": { shape: "heart", color: "#2F6FDD" },
  "💜": { shape: "heart", color: "#7C4DD8" },
  "🟧": { shape: "square", color: "#E07F2B" },
  "🟨": { shape: "square", color: "#E3AC24" },
  "🟩": { shape: "square", color: "#1E9A5A" },
};

function ShapeBody({ spec, uid }: { spec: EmojiSpec; uid: string }) {
  switch (spec.shape) {
    case "circle":
      if (spec.hollow) return <circle cx="50" cy="50" r="33" {...strokeShape(spec.color, 9)} />;
      return fill(<circle cx="50" cy="50" r="36" />, spec.color, uid);
    case "square":
      if (spec.hollow) return <rect x="16" y="16" width="68" height="68" rx="14" {...strokeShape(spec.color, 9)} />;
      return fill(<rect x="13" y="13" width="74" height="74" rx="14" />, spec.color, uid);
    case "diamond":
      if (spec.hollow) return <polygon points="50,18 82,50 50,82 18,50" {...strokeShape(spec.color, 9)} />;
      return fill(<polygon points={diamondPath} />, spec.color, uid);
    case "triangle-up":
      return fill(<polygon points="50,12 88,80 12,80" />, spec.color, uid);
    case "triangle-down":
      return fill(<polygon points="50,88 12,20 88,20" />, spec.color, uid);
    case "heart":
      return fill(<path d={HEART_PATH} />, spec.color, uid);
  }
}

export function EmojiStimulus({
  emoji,
  className = "size-16",
}: {
  emoji: string;
  className?: string;
}) {
  const uid = useStimulusId();
  const spec = EMOJI_SPECS[emoji];
  if (!spec) return <SymbolGlyph char={emoji} className={className} />;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <ShapeBody spec={spec} uid={uid} />
    </svg>
  );
}

/* ── rule-switch stimulus ─────────────────────────────── */

const RULE_COLORS: Record<string, string> = {
  red: "#D64545",
  blue: "#2F6FDD",
  green: "#1E9A5A",
};

const SIZE_SCALE: Record<string, number> = {
  small: 0.62,
  medium: 0.82,
  large: 1,
};

export type RuleStimulusData = {
  color: string;
  shape: string;
  size: "small" | "medium" | "large";
  fill: "filled" | "outlined";
};

export function RuleStimulus({
  stimulus,
  className = "",
}: {
  stimulus: RuleStimulusData;
  className?: string;
}) {
  const color = RULE_COLORS[stimulus.color] ?? "#2B2B31";
  const scale = SIZE_SCALE[stimulus.size] ?? 1;
  const uid = useStimulusId();
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g transform={`translate(50 50) scale(${scale}) translate(-50 -50)`}>
        {stimulus.fill === "outlined" ? (
          stimulus.shape === "circle" ? (
            <circle cx="50" cy="50" r="33" {...strokeShape(color, 8)} />
          ) : stimulus.shape === "square" ? (
            <rect x="17" y="17" width="66" height="66" rx="12" {...strokeShape(color, 8)} />
          ) : stimulus.shape === "triangle" ? (
            <polygon points="50,18 84,80 16,80" {...strokeShape(color, 8)} />
          ) : (
            <polygon points="50,18 82,50 50,82 18,50" {...strokeShape(color, 8)} />
          )
        ) : stimulus.shape === "circle" ? (
          fill(<circle cx="50" cy="50" r="36" />, color, uid)
        ) : stimulus.shape === "square" ? (
          fill(<rect x="13" y="13" width="74" height="74" rx="14" />, color, uid)
        ) : stimulus.shape === "triangle" ? (
          fill(<polygon points="50,12 88,80 12,80" />, color, uid)
        ) : (
          fill(<polygon points={diamondPath} />, color, uid)
        )}
      </g>
    </svg>
  );
}

/* ── stop signal (arrow + stop badge) ─────────────────── */

export function DirectionArrow({
  direction,
  className = "size-24",
}: {
  direction: "left" | "right";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} style={{ transform: direction === "left" ? "scaleX(-1)" : undefined }} aria-hidden="true">
      <path
        d="M18 50 h56 M58 34 l16 16 -16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StopBadge({ className = "size-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g>
        <path
          d="M50 8 84 20v26c0 19-13.6 32-34 38-20.4-6-34-19-34-38V20Z"
          fill="none"
          stroke="#C03F2D"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d="M50 8 84 20v26c0 19-13.6 32-34 38-20.4-6-34-19-34-38V20Z"
          fill="#D64545"
          opacity="0.14"
        />
        <rect x="33" y="44" width="34" height="11" rx="3" fill="#C03F2D" />
      </g>
    </svg>
  );
}
