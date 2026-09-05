"use client";

import { avatarDef, type AvatarDef } from "@/lib/avatars";

/** Eyes + smile + blush shared by the animal faces. */
function Face({ eye = "round" }: { eye?: "round" | "sleepy" }) {
  const eyes =
    eye === "sleepy" ? (
      <>
        <path d="M34 46q5 -5 10 0" stroke="#2f2a24" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <path d="M52 46q5 -5 10 0" stroke="#2f2a24" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      </>
    ) : (
      <>
        <circle cx="39" cy="45" r="3.6" fill="#2f2a24" />
        <circle cx="57" cy="45" r="3.6" fill="#2f2a24" />
      </>
    );
  return (
    <>
      {eyes}
      <path d="M42 56q6 6 12 0" stroke="#2f2a24" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <ellipse cx="29" cy="52" rx="4.4" ry="2.8" fill="#e88" opacity="0.5" />
      <ellipse cx="67" cy="52" rx="4.4" ry="2.8" fill="#e88" opacity="0.5" />
    </>
  );
}

function Bintang({ a }: { a: AvatarDef }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <path
        d="M48 8 L57.2 36.6 L87 46.4 L57.2 55.6 L48 88 L38.8 55.6 L9 46.4 L38.8 36.6 Z"
        fill={a.color}
        stroke={a.deep}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M32 31 q10 -8 20 -5" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.5" fill="none" />
      <circle cx="39" cy="47" r="3.6" fill="#2f2a24" />
      <circle cx="57" cy="47" r="3.6" fill="#2f2a24" />
      <path d="M42 58 q6 6 12 0" stroke="#2f2a24" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <ellipse cx="29" cy="54" rx="4.4" ry="2.8" fill="#e88" opacity="0.5" />
      <ellipse cx="67" cy="54" rx="4.4" ry="2.8" fill="#e88" opacity="0.5" />
    </svg>
  );
}

function Rubah({ a }: { a: AvatarDef }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <path d="M14 42 L8 14 L30 30 L48 24 L66 30 L88 14 L82 42 q14 12 0 28 q-12 12 -34 12 q-22 0 -34 -12 q-14 -16 0 -28 Z" fill={a.color} stroke={a.deep} strokeWidth="4" strokeLinejoin="round" />
      <path d="M14 34 L12 20 L26 30 Z" fill={a.soft} stroke="none" />
      <path d="M82 34 L84 20 L70 30 Z" fill={a.soft} stroke="none" />
      <path d="M33 44 L48 52 L63 44 L48 66 Z" fill="#fff" stroke="none" />
      <circle cx="48" cy="55" r="3.4" fill="#2f2a24" />
      <Face eye="sleepy" />
    </svg>
  );
}

function Kucing({ a }: { a: AvatarDef }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <path d="M20 40 L16 16 L38 34 Q48 29 58 34 L80 16 L76 40 q12 12 0 30 q-13 12 -28 12 q-15 0 -28 -12 q-12 -18 0 -30 Z" fill={a.color} stroke={a.deep} strokeWidth="4" strokeLinejoin="round" />
      <path d="M22 34 L20 22 L32 32 Z" fill="#f7aebc" stroke="none" opacity="0.9" />
      <path d="M74 34 L76 22 L64 32 Z" fill="#f7aebc" stroke="none" opacity="0.9" />
      <path d="M20 52 q-6 -2 -8 2 M76 52 q6 -2 8 2" stroke="#2f2a24" strokeWidth="2.6" strokeLinecap="round" opacity="0.55" fill="none" />
      <Face />
    </svg>
  );
}

function Kelinci({ a }: { a: AvatarDef }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <path d="M32 18 q-2 -12 10 -14 q10 -2 14 10 q2 -8 12 -9 q10 -1 10 12 q0 8 -4 12 q8 10 0 26 q-10 16 -26 16 q-16 0 -26 -16 q-8 -16 0 -26 q-4 -6 -4 -12 Z" fill={a.color} stroke={a.deep} strokeWidth="4" strokeLinejoin="round" />
      <path d="M34 14 q0 -8 8 -8 q6 0 8 7 M48 15 q0 -8 8 -8 q7 0 8 8" fill="none" stroke={a.deep} strokeWidth="4" strokeLinecap="round" opacity="0.85" />
      <path d="M44 40 q0 -8 4 -12 M52 40 q2 -7 6 -10" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" fill="none" />
      <Face />
    </svg>
  );
}

function Robot({ a }: { a: AvatarDef }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <path d="M38 12 h20 v10 h6 q8 0 8 8 v34 q0 8 -8 8 H32 q-8 0 -8 -8 V30 q0 -8 8 -8 h6 Z" fill={a.color} stroke={a.deep} strokeWidth="4" strokeLinejoin="round" />
      <path d="M48 6 v10" stroke={a.deep} strokeWidth="4" strokeLinecap="round" />
      <circle cx="48" cy="3.5" r="3.5" fill={a.deep} />
      <path d="M30 8 q-4 0 -4 6 q0 8 6 10" stroke={a.deep} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M66 8 q4 0 4 6 q0 8 -6 10" stroke={a.deep} strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="34" y="38" width="28" height="20" rx="10" fill={a.soft} stroke={a.deep} strokeWidth="3" />
      <circle cx="44" cy="48" r="3.2" fill={a.deep} />
      <circle cx="52" cy="48" r="3.2" fill={a.deep} />
      <path d="M43 68 q5 4 10 0" stroke={a.deep} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function Beruang({ a }: { a: AvatarDef }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <circle cx="24" cy="26" r="11" fill={a.color} stroke={a.deep} strokeWidth="4" />
      <circle cx="72" cy="26" r="11" fill={a.color} stroke={a.deep} strokeWidth="4" />
      <circle cx="24" cy="26" r="4.5" fill={a.soft} />
      <circle cx="72" cy="26" r="4.5" fill={a.soft} />
      <circle cx="48" cy="52" r="32" fill={a.color} stroke={a.deep} strokeWidth="4" />
      <ellipse cx="48" cy="58" rx="17" ry="13" fill={a.soft} />
      <circle cx="39" cy="45" r="3.6" fill="#2f2a24" />
      <circle cx="57" cy="45" r="3.6" fill="#2f2a24" />
      <path d="M45 57 q3 3 6 0" stroke="#2f2a24" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M48 65 l-3 5 h6 Z" fill="#2f2a24" />
      <ellipse cx="29" cy="53" rx="4.4" ry="2.8" fill="#e88" opacity="0.5" />
      <ellipse cx="67" cy="53" rx="4.4" ry="2.8" fill="#e88" opacity="0.5" />
    </svg>
  );
}

function Dino({ a }: { a: AvatarDef }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <circle cx="48" cy="56" r="34" fill={a.color} stroke={a.deep} strokeWidth="4" />
      <path d="M28 34 L32 20 L40 32 L48 18 L56 32 L64 20 L68 34" fill={a.color} stroke={a.deep} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M18 72 q-10 0 -14 -8 M78 72 q10 0 14 -8" stroke={a.deep} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7" />
      <circle cx="39" cy="50" r="3.6" fill="#2f2a24" />
      <circle cx="57" cy="50" r="3.6" fill="#2f2a24" />
      <path d="M38 62 q10 9 20 0" stroke="#2f2a24" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <ellipse cx="27" cy="57" rx="4.4" ry="2.8" fill="#e88" opacity="0.55" />
      <ellipse cx="69" cy="57" rx="4.4" ry="2.8" fill="#e88" opacity="0.55" />
    </svg>
  );
}

function Paus({ a }: { a: AvatarDef }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" aria-hidden="true">
      <path d="M20 66 q0 -28 20 -38 q22 -11 34 0 q8 -2 14 2 l-6 8 q6 2 4 10 q-2 8 -10 10 q-12 14 -34 14 q-14 0 -22 -6 Z" fill={a.color} stroke={a.deep} strokeWidth="4" strokeLinejoin="round" />
      <path d="M64 42 l-6 8 M74 44 l-2 8 M82 52 l4 6" stroke={a.deep} strokeWidth="3" strokeLinecap="round" opacity="0.5" fill="none" />
      <circle cx="38" cy="52" r="3.6" fill="#2f2a24" />
      <path d="M30 62 q7 6 14 0" stroke="#2f2a24" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <ellipse cx="20" cy="58" rx="4.4" ry="2.8" fill="#e88" opacity="0.5" />
    </svg>
  );
}

/** Deterministic SVG face for an avatar id (falls back to Bintang). */
export function AvatarFace({
  avatar,
  className = "size-16",
}: {
  avatar?: string | null;
  className?: string;
}) {
  const def = avatarDef(avatar);
  return (
    <div className={`shrink-0 ${className}`} aria-hidden="true">
      {def.id === "bintang" && <Bintang a={def} />}
      {def.id === "rubah" && <Rubah a={def} />}
      {def.id === "kucing" && <Kucing a={def} />}
      {def.id === "kelinci" && <Kelinci a={def} />}
      {def.id === "robot" && <Robot a={def} />}
      {def.id === "beruang" && <Beruang a={def} />}
      {def.id === "dino" && <Dino a={def} />}
      {def.id === "paus" && <Paus a={def} />}
    </div>
  );
}