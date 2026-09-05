"use client";

import type { SceneKind } from "@/lib/game/themes";

/**
 * Decorative scene drawn behind the arena. Each theme world gets its own
 * little illustrated backdrop (clouds, stars, bubbles, leaves, candy) that
 * drifts/twinkles gently. Everything stays low-contrast and pointer-events-none
 * — the stimuli are the task, the scene is the playground.
 */

function Cloud({ color, x, y, s }: { color: string; x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity="0.55" className="animate-drift">
      <ellipse cx="0" cy="0" rx="34" ry="16" fill={color} />
      <ellipse cx="-18" cy="-8" rx="16" ry="11" fill={color} />
      <ellipse cx="16" cy="-10" rx="18" ry="12" fill={color} />
    </g>
  );
}

function Star({ color, x, y, s, delay = 0 }: { color: string; x: number; y: number; s: number; delay?: number }) {
  return (
    <path
      d="M0 -7 L1.9 -1.9 L7 0 L1.9 1.9 L0 7 L-1.9 1.9 L-7 0 L-1.9 -1.9 Z"
      fill={color}
      transform={`translate(${x} ${y}) scale(${s})`}
      className="animate-twinkle"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

function Bubble({ color, x, y, s, delay = 0 }: { color: string; x: number; y: number; s: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity="0.4" className="animate-drift" style={{ animationDelay: `${delay}s` }}>
      <circle r="12" fill="none" stroke={color} strokeWidth="2.5" />
      <circle cx="-4" cy="-4" r="2.5" fill={color} />
    </g>
  );
}

function Leaf({ color, x, y, s, rot }: { color: string; x: number; y: number; s: number; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity="0.5">
      <ellipse cx="0" cy="0" rx="16" ry="8" fill={color} />
      <path d="M-14 0 Q0 -8 14 0" fill="none" stroke={color} strokeWidth="2" opacity="0.6" />
    </g>
  );
}

function Sprinkles({ color, x, y, s, rot }: { color: string; x: number; y: number; s: number; rot: number }) {
  return (
    <rect
      x="-7"
      y="-2.4"
      width="14"
      height="4.8"
      rx="2.4"
      fill={color}
      transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}
      opacity="0.55"
    />
  );
}

function Lollipop({ color, x, y, s, delay = 0 }: { color: string; x: number; y: number; s: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity="0.45" className="animate-drift" style={{ animationDelay: `${delay}s` }}>
      <rect x="-2" y="0" width="4" height="26" rx="2" fill={color} />
      <circle cx="0" cy="-10" r="15" fill={color} />
      <circle cx="0" cy="-10" r="11" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.7" />
    </g>
  );
}

function Wave({ color, y, w, d }: { color: string; y: number; w: number; d: number }) {
  return (
    <path
      d={`M0 ${y} Q ${w / 4} ${y - 14} ${w / 2} ${y} T ${w} ${y} L ${w} 110 L0 110 Z`}
      fill={color}
      opacity="0.18"
      className="animate-drift"
      style={{ animationDelay: `${d}s`, animationDuration: "7s" }}
    />
  );
}

export function SceneBackdrop({ kind, color, soft }: { kind: SceneKind; color: string; soft: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        {kind === "paper" && (
          <>
            <circle cx="332" cy="52" r="26" fill={soft} opacity="0.5" className="animate-twinkle" />
            <Cloud color={color} x={58} y={52} s={1.15} />
            <Cloud color={color} x={205} y={30} s={0.8} />
            <Cloud color={color} x={330} y={96} s={0.7} />
            <circle cx="70" cy="190" r="3" fill={color} opacity="0.35" className="animate-twinkle" />
            <circle cx="180" cy="228" r="2.4" fill={color} opacity="0.3" className="animate-twinkle" style={{ animationDelay: "1s" }} />
            <circle cx="300" cy="200" r="3.4" fill={color} opacity="0.3" className="animate-twinkle" style={{ animationDelay: "2s" }} />
          </>
        )}
        {kind === "dusk" && (
          <>
            <path
              d="M332 46 A 26 26 0 1 1 296 22 A 22 22 0 1 0 332 46 Z"
              fill={color}
              opacity="0.7"
            />
            <Star color={soft} x={64} y={56} s={1} />
            <Star color={soft} x={130} y={30} s={0.7} delay={0.8} />
            <Star color={soft} x={230} y={60} s={0.85} delay={1.6} />
            <Star color={soft} x={120} y={120} s={0.6} delay={2.4} />
            <Star color={soft} x={300} y={150} s={0.75} delay={1.1} />
            <Star color={soft} x={200} y={140} s={0.5} delay={0.4} />
          </>
        )}
        {kind === "ocean" && (
          <>
            <Wave color={color} y={236} w={400} d={0} />
            <Wave color={color} y={254} w={400} d={1.2} />
            <Wave color={color} y={270} w={400} d={2.4} />
            <Bubble color={color} x={70} y={210} s={1.1} />
            <Bubble color={color} x={150} y={180} s={0.7} delay={1.4} />
            <Bubble color={color} x={260} y={220} s={0.9} delay={0.7} />
            <Bubble color={color} x={330} y={190} s={0.6} delay={2} />
            <path d="M40 300 Q 52 240 66 300" fill="none" stroke={soft} strokeWidth="4" strokeLinecap="round" opacity="0.5" />
            <path d="M340 300 Q 350 250 362 300" fill="none" stroke={soft} strokeWidth="4" strokeLinecap="round" opacity="0.45" />
          </>
        )}
        {kind === "jungle" && (
          <>
            <Leaf color={color} x={46} y={64} s={1.1} rot={-30} />
            <Leaf color={color} x={96} y={100} s={0.8} rot={160} />
            <Leaf color={color} x={330} y={70} s={1} rot={25} />
            <Leaf color={color} x={286} y={110} s={0.75} rot={-140} />
            <Leaf color={color} x={352} y={140} s={0.9} rot={60} />
            <path d="M14 0 Q 26 36 14 70" fill="none" stroke={soft} strokeWidth="3.5" strokeLinecap="round" opacity="0.4" />
            <path d="M392 6 Q 380 44 392 84" fill="none" stroke={soft} strokeWidth="3.5" strokeLinecap="round" opacity="0.35" />
            <Star color={color} x={180} y={52} s={0.9} delay={0.5} />
            <Star color={color} x={236} y={130} s={0.65} delay={1.7} />
            <Star color={color} x={150} y={170} s={0.5} delay={2.6} />
          </>
        )}
        {kind === "candy" && (
          <>
            <Lollipop color={color} x={52} y={118} s={1.05} />
            <Lollipop color={color} x={348} y={96} s={0.85} delay={1.1} />
            <Lollipop color={color} x={290} y={170} s={0.6} delay={2.2} />
            <Sprinkles color={color} x={120} y={60} s={1} rot={20} />
            <Sprinkles color={color} x={210} y={44} s={0.85} rot={-24} />
            <Sprinkles color={color} x={320} y={50} s={0.9} rot={48} />
            <Sprinkles color={color} x={160} y={120} s={0.8} rot={-60} />
            <Sprinkles color={color} x={240} y={150} s={1.05} rot={12} />
            <Star color={soft} x={70} y={200} s={0.8} delay={1} />
            <Star color={soft} x={330} y={210} s={0.7} delay={2} />
          </>
        )}
      </svg>
    </div>
  );
}