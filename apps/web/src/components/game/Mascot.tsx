"use client";

import { motion } from "motion/react";

export type MascotMood = "wave" | "happy" | "cheer" | "think";

/**
 * Friendly star mascot — the kid's little companion in the arena.
 * Drawn as SVG (deterministic on every device), with a soft gradient body and
 * per-mood details. Motion springs give it life; never anything scary.
 */
export function Mascot({
  mood = "happy",
  accent = "#0d7c68",
  className = "size-14",
}: {
  mood?: MascotMood;
  accent?: string;
  className?: string;
}) {
  const eyes =
    mood === "think" ? (
      <>
        <circle cx="38" cy="47" r="3.4" fill="#2B2620" />
        <circle cx="62" cy="47" r="3.4" fill="#2B2620" />
      </>
    ) : mood === "cheer" ? (
      <>
        <path d="M32 46 q6 -7 12 0" fill="none" stroke="#2B2620" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M56 46 q6 -7 12 0" fill="none" stroke="#2B2620" strokeWidth="3.4" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="38" cy="48" r="4" fill="#2B2620" />
        <circle cx="62" cy="48" r="4" fill="#2B2620" />
      </>
    );

  const smile =
    mood === "think" ? (
      <path d="M43 62 q7 5 14 0" fill="none" stroke="#2B2620" strokeWidth="3.2" strokeLinecap="round" opacity="0.8" />
    ) : mood === "cheer" ? (
      <path d="M40 60 q10 12 20 0" fill="none" stroke="#2B2620" strokeWidth="3.6" strokeLinecap="round" />
    ) : (
      <path d="M41 60 q9 9 18 0" fill="none" stroke="#2B2620" strokeWidth="3.4" strokeLinecap="round" />
    );

  const arm =
    mood === "wave" ? (
      <g>
        <path d="M20 62 q-8 -6 -12 -16" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
        <motion.path
          d="M8 46 q-2 4 -5 3"
          fill="none"
          stroke={accent}
          strokeWidth="7"
          strokeLinecap="round"
          animate={{ rotate: [-14, 8, -14] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "0.5", originY: "1", transformBox: "view-box" }}
        />
      </g>
    ) : mood === "cheer" ? (
      <>
        <path d="M20 62 q-8 -4 -14 -4 q-3 6 4 10 q6 3 10 2" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
        <path d="M80 62 q8 -4 14 -4 q3 6 -4 10 q-6 3 -10 2" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
      </>
    ) : (
      <>
        <path d="M18 64 q-6 8 -2 16" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
        <path d="M82 64 q6 8 2 16" fill="none" stroke={accent} strokeWidth="7" strokeLinecap="round" />
      </>
    );

  const blush = (
    <>
      <ellipse cx="27" cy="57" rx="5.5" ry="3.4" fill="#E88" opacity="0.55" />
      <ellipse cx="73" cy="57" rx="5.5" ry="3.4" fill="#E88" opacity="0.55" />
    </>
  );

  const sparkles =
    mood === "cheer" ? (
      <>
        <path d="M20 22 L23 30 L31 33 L23 36 L20 44 L17 36 L9 33 L17 30 Z" fill="#F2C94C" className="animate-twinkle" />
        <path d="M84 18 L86 24 L92 26 L86 28 L84 34 L82 28 L76 26 L82 24 Z" fill="#F2C94C" className="animate-twinkle" style={{ animationDelay: "0.6s" }} />
      </>
    ) : null;

  const wiggle =
    mood === "wave"
      ? { rotate: [-3, 3, -3], y: [0, -3, 0] }
      : mood === "cheer"
        ? { y: [0, -7, 0], rotate: [-4, 4, -4] }
        : mood === "think"
          ? { rotate: [-5, 5, -5] }
          : { y: [0, -4, 0] };

  return (
    <motion.div
      className={`shrink-0 ${className}`}
      animate={wiggle}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      data-mascot-mood={mood}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <defs>
          <linearGradient id="mascot-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.95" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.72" />
          </linearGradient>
        </defs>
        {/* body */}
        <path
          d="M50 6 L59.6 36.4 L90 46.5 L59.6 55.6 L50 92 L40.4 55.6 L10 46.5 L40.4 36.4 Z"
          fill="url(#mascot-body)"
          stroke={accent}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* highlight */}
        <path d="M33 30 q9 -8 18 -5" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
        {eyes}
        {blush}
        {smile}
        {arm}
        {sparkles}
      </svg>
    </motion.div>
  );
}