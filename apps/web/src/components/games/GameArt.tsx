"use client";

import { gameMeta } from "@/lib/games";

/**
 * Decorative art motif per game — a geometric pattern that hints at the
 * game mechanic, drawn with the game's identity hue.
 */

function MemoryArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <g fill="none" stroke={c} strokeWidth="4" strokeLinejoin="round" opacity="0.9">
        <rect x="16" y="16" width="18" height="18" rx="3" />
        <rect x="39" y="16" width="18" height="18" rx="3" opacity="0.35" />
        <rect x="62" y="16" width="18" height="18" rx="3" />
        <rect x="16" y="39" width="18" height="18" rx="3" opacity="0.35" />
        <rect x="39" y="39" width="18" height="18" rx="3" />
        <rect x="62" y="39" width="18" height="18" rx="3" opacity="0.35" />
      </g>
      <g fill={c}>
        <rect x="16" y="62" width="18" height="18" rx="4" />
        <rect x="62" y="62" width="18" height="18" rx="4" />
      </g>
      <circle cx="48" cy="71" r="7" fill={c} />
    </svg>
  );
}

function WatchArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <path
        d="M28 30c0-5 4-9 9-9s9 4 9 9l1 30-4 22H31l-4-22Z"
        fill={c}
        opacity="0.4"
      />
      <path
        d="M30 38h16M33 32h10"
        stroke={c}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="68" cy="30" r="8" fill="none" stroke={c} strokeWidth="4" />
      <path d="M68 27v4l3 2" stroke={c} strokeWidth="3" strokeLinecap="round" fill="none" />
      <g fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" opacity="0.85">
        <path d="M46 66h22M46 76h22M46 86h22" strokeWidth="3.5" />
      </g>
    </svg>
  );
}

function MatchArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <circle cx="30" cy="48" r="15" fill={c} />
      <circle cx="68" cy="48" r="10" fill="none" stroke={c} strokeWidth="4" />
      <path
        d="M38 43c-2-5 4-9 6-9M22 55c2 4-3 8-5 8"
        stroke={c}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />
    </svg>
  );
}

function StopArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <path
        d="M48 12 82 26v24c0 18-13 29-34 34-21-5-34-16-34-34V26Z"
        fill={c}
        opacity="0.18"
      />
      <path
        d="M48 12 82 26v24c0 18-13 29-34 34-21-5-34-16-34-34V26Z"
        fill="none"
        stroke={c}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="45" r="8" fill={c} />
      <path
        d="M20 72h56"
        stroke={c}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function RuleArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <circle cx="26" cy="52" r="11" fill={c} />
      <rect x="56" y="41" width="22" height="22" rx="4" fill="none" stroke={c} strokeWidth="4" />
      <path d="m67 41 5.5-8 5.5 8Z" fill="none" stroke={c} strokeWidth="4" strokeLinejoin="round" transform="translate(0 8)" opacity="0.55" />
      <path d="M20 78h56" stroke={c} strokeWidth="4" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

function RedArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      {/* traffic light post + housing */}
      <rect x="44" y="20" width="9" height="64" rx="4" fill={c} opacity="0.3" />
      <rect x="34" y="10" width="30" height="52" rx="10" fill="none" stroke={c} strokeWidth="4" />
      <circle cx="49" cy="24" r="6.5" fill={c} opacity="0.35" />
      <circle cx="49" cy="38" r="6.5" fill={c} opacity="0.6" />
      <circle cx="49" cy="52" r="6.5" fill={c} />
      {/* ground line */}
      <path d="M20 84h56" stroke={c} strokeWidth="4" strokeLinecap="round" opacity="0.35" />
      {/* motion hint */}
      <path
        d="M62 70c4 2 7 5 8 8M66 62c6 3 10 8 11 12"
        fill="none"
        stroke={c}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

function CourierArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      {/* map roads */}
      <g stroke={c} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.55">
        <path d="M20 60 44 36l14 2 12-14" />
        <path d="M44 36v30" />
      </g>
      {/* flag goal */}
      <g>
        <path d="M70 22h4v34h-4Z" fill={c} opacity="0.35" />
        <path d="M74 22h16l-4 8 4 8H74Z" fill={c} />
      </g>
      {/* courier dot */}
      <circle cx="20" cy="60" r="7" fill={c} />
      <circle cx="58" cy="38" r="5" fill="none" stroke={c} strokeWidth="3" opacity="0.6" />
      {/* water tile */}
      <path d="M26 74c4 0 4-4 8-4s4 4 8 4" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

function LighthouseArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      {/* tower stripes */}
      <rect x="40" y="26" width="16" height="58" rx="3" fill={c} opacity="0.25" />
      <g fill={c}>
        <rect x="40" y="34" width="16" height="9" />
        <rect x="40" y="52" width="16" height="9" />
        <rect x="40" y="70" width="16" height="9" />
      </g>
      {/* lantern room */}
      <rect x="36" y="14" width="24" height="13" rx="3" fill="none" stroke={c} strokeWidth="4" />
      <circle cx="44" cy="20.5" r="2.5" fill={c} />
      <circle cx="52" cy="20.5" r="2.5" fill={c} />
      {/* roof */}
      <path d="M48 4 58 14H38Z" fill={c} opacity="0.7" />
      {/* beam */}
      <path d="M48 20c14-6 26-12 34-16" stroke={c} strokeWidth="3.5" strokeLinecap="round" opacity="0.35" />
      {/* waves */}
      <g fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" opacity="0.6">
        <path d="M22 82h14M52 86h14M74 80h10" />
      </g>
    </svg>
  );
}

function SushiArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      {/* conveyor belt */}
      <path d="M8 66h80" stroke={c} strokeWidth="6" strokeLinecap="round" opacity="0.4" />
      <path d="M8 74h80" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.25" />
      {/* plate */}
      <g transform="translate(26 14)">
        <circle cx="18" cy="18" r="16" fill={c} opacity="0.85" />
        <circle cx="18" cy="18" r="10" fill="#fff" />
        <circle cx="18" cy="18" r="6" fill={c} />
      </g>
      {/* chopsticks */}
      <path d="M58 8l22 34M66 6l20 38" stroke={c} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function CrystalArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      {/* palace crystal towers */}
      <g opacity="0.85">
        <path d="M18 64 30 30l12 34Z" fill={c} />
        <path d="M30 30v34" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
        <path d="M44 70 58 34l14 36Z" fill={c} opacity="0.65" />
        <path d="M58 34v36" stroke="rgba(255,255,255,0.5)" strokeWidth="3" />
        <path d="M66 72 78 44l12 28Z" fill={c} opacity="0.85" />
      </g>
      {/* ground line */}
      <path d="M12 72h72" stroke={c} strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      {/* sparkles */}
      <path d="M26 22l1.6 3.4L31 27l-3.4 1.6L26 32l-1.6-3.4L21 27l3.4-1.6Z" fill={c} opacity="0.7" />
      <path d="M70 16l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1Z" fill={c} opacity="0.7" />
    </svg>
  );
}

function SpiceArt({ c }: { c: string }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      {/* stall awning */}
      <g>
        <rect x="14" y="14" width="11" height="12" rx="2" fill={c} />
        <rect x="25" y="14" width="11" height="12" rx="2" fill={c} opacity="0.35" />
        <rect x="36" y="14" width="11" height="12" rx="2" fill={c} />
        <rect x="47" y="14" width="11" height="12" rx="2" fill={c} opacity="0.35" />
        <rect x="58" y="14" width="11" height="12" rx="2" fill={c} />
        <rect x="69" y="14" width="11" height="12" rx="2" fill={c} opacity="0.35" />
      </g>
      {/* cooking pot */}
      <path d="M28 44h40v14c0 10-8 18-20 18s-20-8-20-18Z" fill={c} opacity="0.85" />
      <path d="M24 40h48" stroke={c} strokeWidth="5" strokeLinecap="round" />
      {/* steam */}
      <g fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" opacity="0.6">
        <path d="M40 30c-2-3 2-5 0-8" />
        <path d="M50 30c-2-3 2-5 0-8" />
        <path d="M60 30c-2-3 2-5 0-8" />
      </g>
    </svg>
  );
}

export function GameArt({ gameKey, className = "" }: { gameKey: string; className?: string }) {
  const meta = gameMeta(gameKey);
  return (
    <div className={className} aria-hidden="true">
      {gameKey === "memory_matrix" && <MemoryArt c={meta.color} />}
      {gameKey === "target_watch" && <WatchArt c={meta.color} />}
      {gameKey === "quick_match" && <MatchArt c={meta.color} />}
      {gameKey === "stop_signal" && <StopArt c={meta.color} />}
      {gameKey === "rule_switch" && <RuleArt c={meta.color} />}
      {gameKey === "spice_stall" && <SpiceArt c={meta.color} />}
      {gameKey === "red_light" && <RedArt c={meta.color} />}
      {gameKey === "courier_map" && <CourierArt c={meta.color} />}
      {gameKey === "lighthouse_keeper" && <LighthouseArt c={meta.color} />}
      {gameKey === "sushi_express" && <SushiArt c={meta.color} />}
      {gameKey === "crystal_palace" && <CrystalArt c={meta.color} />}
    </div>
  );
}
