"use client";

import { motion } from "motion/react";

/**
 * Shared building blocks for game arenas.
 * Rendered inside the arena (which carries --game-* CSS vars), so text uses
 * var(--game-ink) etc. and adapts to whichever theme world is active.
 */

export function hexToRgba(hex: string, alpha: number): string {
  const n = hex.replace("#", "");
  const full = n.length === 3 ? n.split("").map((c) => c + c).join("") : n;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return `rgb(0 0 0 / ${alpha})`;
  return `rgb(${(num >> 16) & 255} ${(num >> 8) & 255} ${num & 255} / ${alpha})`;
}

/** Top HUD row: mode/trial on the left, live score on the right */
export function TrialHeader({
  isPractice,
  trial,
  total,
  score,
  accent,
}: {
  isPractice?: boolean;
  trial?: number;
  total?: number;
  score?: number;
  accent: string;
}) {
  return (
    <div className="mb-1 flex w-full items-center justify-between">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em]"
        style={{
          backgroundColor: hexToRgba(accent, 0.1),
          color: accent,
        }}
      >
        {isPractice ? (
          <>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: accent }} />
            Latihan
          </>
        ) : (
          <>
            <span className="tnum">Percobaan {trial ?? 0}</span>
            {total ? <span style={{ opacity: 0.55 }}>/ {total}</span> : null}
          </>
        )}
      </span>
      {score !== undefined && (
        <span
          className="tnum rounded-full border px-3 py-1 text-[13px] font-bold"
          style={{ borderColor: "var(--game-line)", color: "var(--game-ink)" }}
        >
          {score}
          <span className="ml-1 font-medium" style={{ color: "var(--game-ink-mute)" }}>
            poin
          </span>
        </span>
      )}
    </div>
  );
}

/** Prominent instruction line shown above/below the stage */
export function Instruction({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-center text-[15px] font-semibold"
      style={{ color: "var(--game-ink)" }}
    >
      {children}
    </p>
  );
}

/** Subtle secondary line */
export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-center text-[13px]"
      style={{ color: "var(--game-ink-mute)" }}
    >
      {children}
    </p>
  );
}

/** Central stage panel */
export function Stage({
  children,
  className = "",
  flush = false,
}: {
  children: React.ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center justify-center ${flush ? "" : "rounded-2xl border"} ${className}`}
      style={
        flush
          ? undefined
          : {
              backgroundColor: "var(--game-surface-2)",
              borderColor: "var(--game-line)",
            }
      }
    >
      {children}
    </div>
  );
}

/** Thin progress line */
export function ProgressBar({
  value,
  accent,
  className = "",
}: {
  value: number; // 0..1
  accent: string;
  className?: string;
}) {
  return (
    <div
      className={`h-1 w-full overflow-hidden rounded-full ${className}`}
      style={{ backgroundColor: "var(--game-line)" }}
      role="progressbar"
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: accent }}
        initial={false}
        animate={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 22 }}
      />
    </div>
  );
}

/** Row of small live counters (hits, misses, …) */
export function StatChips({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode; color: string }>;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "var(--game-ink-mute)" }}>
          <span className="size-1.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
          <span className="tnum font-bold" style={{ color: item.color }}>
            {item.value}
          </span>
        </span>
      ))}
    </div>
  );
}
