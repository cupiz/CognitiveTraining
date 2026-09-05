"use client";

import type { GameSummary } from "@cog/game-core";
import { motion } from "motion/react";
import { hexToRgba } from "./GameFrame";
import { gameMeta } from "@/lib/games";
import { Icon } from "@/components/ui/icons";
import { Mascot } from "./Mascot";

interface GameResultProps {
  summary: GameSummary;
  accent?: string;
  onContinue: () => void;
  onQuit?: () => void;
}

export function GameResult({ summary, onContinue, onQuit }: GameResultProps) {
  const meta = gameMeta(summary.gameKey);
  const accent = meta.color;
  const accuracy =
    summary.accuracy !== undefined ? `${Math.round(summary.accuracy * 100)}%` : "—";
  const medianRt =
    summary.medianRtMs !== undefined ? `${Math.round(summary.medianRtMs)}ms` : "—";
  const errors = summary.omissionErrors + summary.commissionErrors;

  const metrics: Array<{ label: string; value: string }> = [
    { label: "Akurasi", value: accuracy },
    { label: "Kecepatan", value: medianRt },
    { label: "Percobaan", value: String(summary.validTrials) },
    { label: "Kesalahan", value: String(errors) },
  ];

  return (
    <motion.div
      className="flex w-full max-w-sm flex-col items-center text-center"
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
    >
      {/* Mascot celebration — cheer when the round went well */}
      <motion.div
        initial={{ scale: 0, y: -10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.05 }}
      >
        <Mascot
          mood={summary.accuracy !== undefined && summary.accuracy >= 0.5 ? "cheer" : "happy"}
          accent={accent}
          className="size-20"
        />
      </motion.div>

      {/* Completion mark — springs in as confetti rains */}
      <motion.div
        className="flex size-20 items-center justify-center rounded-full"
        style={{
          backgroundColor: hexToRgba(accent, 0.12),
          boxShadow: `inset 0 0 0 2px ${hexToRgba(accent, 0.5)}`,
          color: accent,
        }}
        initial={{ scale: 0, rotate: -14 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
      >
        <svg viewBox="0 0 24 24" className="size-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m4.5 12.5 5 5 10-11" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.18 }}
        className="flex flex-col items-center"
      >
        <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--game-ink-mute)" }}>
          {meta.domain}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-[-0.02em]" style={{ color: "var(--game-ink)" }}>
          Ronde selesai
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--game-ink-mute)" }}>
          {meta.name} · fokus yang bagus!
        </p>
      </motion.div>

      {/* Metrics — staggered reveal right after the confetti burst */}
      <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            className="rounded-xl border px-4 py-3.5"
            style={{ backgroundColor: "var(--game-surface-2)", borderColor: "var(--game-line)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 24, delay: 0.26 + i * 0.07 }}
          >
            <p className="eyebrow" style={{ color: "var(--game-ink-mute)" }}>
              {m.label}
            </p>
            <p className="tnum mt-1 text-xl font-bold" style={{ color: "var(--game-ink)" }}>
              {m.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-7 flex w-full flex-col gap-2">
        <motion.button
          onClick={onContinue}
          className="btn py-2.5 text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: accent }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          Lanjut
        </motion.button>
        {onQuit && (
          <motion.button
            onClick={onQuit}
            className="btn py-2.5"
            style={{ border: "1px solid var(--game-line)", color: "var(--game-ink)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Icon name="arrow-right" className="size-4" />
            Kembali ke daftar game
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
