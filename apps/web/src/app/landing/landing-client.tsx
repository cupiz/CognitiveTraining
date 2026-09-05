"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import CONTENT from "./content";
import { displayFont } from "./fonts";
import type { LandingContent } from "./types";
import { Wordmark } from "@/components/ui/brand";
import { Icon, type IconName } from "@/components/ui/icons";
import { Mascot } from "@/components/game/Mascot";
import { GAMES, type GameMeta } from "@/lib/games";

const GAME_ICONS: Record<string, IconName> = {
  memory_matrix: "grid",
  target_watch: "target",
  quick_match: "gauge",
  stop_signal: "alert",
  rule_switch: "activity",
  spice_stall: "users",
  red_light: "alert",
  courier_map: "activity",
  lighthouse_keeper: "target",
  sushi_express: "clock",
  crystal_palace: "grid",
};

const STAT_HUES = ["#3b63c9", "#d9821b", "#0f9d6e", "#7a52c8"];
const BULLET_TINTS = [
  "bg-memory/10 text-memory",
  "bg-speed/10 text-speed",
  "bg-flex/10 text-flex",
  "bg-attention/10 text-attention",
];

interface LandingClientProps {
  isAuthed: boolean;
}

/* ── Tiny 4-point sparkle (decorative) ─────────────────────── */
function Sparkle({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2c.7 5.8 4.2 9.3 10 10-5.8.7-9.3 4.2-10 10-.7-5.8-4.2-9.3-10-10 5.8-.7 9.3-4.2 10-10Z" />
    </svg>
  );
}

/* ── Scroll reveal wrapper ─────────────────────────────────── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}

/* ── Hero title with marker-highlighted phrase ─────────────── */
function HighlightedTitle({ title, highlight }: { title: string; highlight: string }) {
  const i = title.indexOf(highlight);
  if (i < 0) return <>{title}</>;
  return (
    <>
      {title.slice(0, i)}
      <span className="relative mx-1 inline-block -rotate-1 whitespace-nowrap rounded-2xl bg-[#ffd166] px-3 py-0.5 text-ink shadow-[0_3px_0_rgb(34_31_25/0.12)]">
        {title.slice(i, i + highlight.length)}
      </span>
      {title.slice(i + highlight.length)}
    </>
  );
}

/* ── Hero visual: mascot + playful session card ────────────── */
function HeroVisual({ games }: { games: GameMeta[] }) {
  const tiles = [games[0], games[1] ?? games[0], games[2] ?? games[0]];
  return (
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      {/* hue blobs */}
      <div className="pointer-events-none absolute -left-10 -top-12 size-48 rounded-full bg-memory/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-14 -right-8 size-56 rounded-full bg-speed/20 blur-2xl" />
      <div className="pointer-events-none absolute right-8 top-1/3 size-36 rounded-full bg-flex/20 blur-2xl" />

      {/* waving mascot */}
      <div className="animate-bob absolute -top-16 left-0 z-20 sm:-left-8">
        <Mascot mood="wave" accent="#0d7c68" className="size-24 drop-shadow-lg sm:size-28" />
      </div>
      <Sparkle className="animate-twinkle absolute -top-6 right-8 size-5 text-speed" />
      <Sparkle className="animate-twinkle absolute bottom-24 -right-3 size-4 text-attention [animation-delay:800ms]" />
      <Sparkle className="animate-twinkle absolute -left-5 top-1/2 size-3.5 text-memory [animation-delay:1600ms]" />

      {/* main session card */}
      <div className="card fade-up relative z-10 rotate-1 rounded-3xl p-5 shadow-pop">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-[15px] font-bold">Sesi hari ini</p>
          <span className="badge-brand rounded-full">
            <Icon name="activity" className="size-3" strokeWidth={2.4} />
            4 hari beruntun
          </span>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-canvas-deep">
          <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-brand-500 to-flex" />
        </div>
        <p className="tnum mt-1.5 text-xs text-ink-mute">3 dari 4 game selesai</p>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {tiles.map((g) => (
            <div
              key={g.key}
              className="rounded-2xl p-3 text-white shadow-sm"
              style={{ backgroundColor: g.color }}
            >
              <Icon name={GAME_ICONS[g.key] ?? "play"} className="size-5" />
              <p className="mt-2 truncate text-[11px] font-bold leading-tight">
                {g.name}
              </p>
              <p className="tnum text-[11px] text-white/80">Lv 5</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-surface-2 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-soft">Tren minggu ini</p>
            <span className="badge-success rounded-full">+12%</span>
          </div>
          <svg viewBox="0 0 200 44" className="mt-2 h-11 w-full" preserveAspectRatio="none">
            <polyline
              points="0,36 25,32 50,34 75,26 100,28 125,20 150,22 175,12 200,14"
              fill="none"
              stroke="var(--color-brand-600)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="200" cy="14" r="3.5" fill="var(--color-brand-600)" />
          </svg>
        </div>
      </div>

      {/* floating: level up */}
      <div className="animate-drift absolute -right-2 top-16 z-20 sm:-right-6">
        <div className="card flex -rotate-2 items-center gap-2 rounded-2xl px-3.5 py-2.5 shadow-pop">
          <span className="flex size-7 items-center justify-center rounded-full bg-flex/15 text-flex">
            <Icon name="chart" className="size-4" strokeWidth={2.2} />
          </span>
          <div className="leading-tight">
            <p className="text-xs font-bold">Level naik!</p>
            <p className="tnum text-[11px] text-ink-mute">D4 → D5</p>
          </div>
        </div>
      </div>

      {/* floating: points */}
      <div className="animate-bob absolute -left-2 bottom-12 z-20 [animation-delay:600ms] sm:-left-6">
        <div className="card flex rotate-2 items-center gap-1.5 rounded-2xl px-3.5 py-2 shadow-pop">
          <span className="flex size-6 items-center justify-center rounded-full bg-speed/15 text-speed">
            <Icon name="check" className="size-3.5" strokeWidth={2.6} />
          </span>
          <p className="tnum text-xs font-bold">+120 poin</p>
        </div>
      </div>
    </div>
  );
}

/* ── Mini playable-looking visual per game (tabs) ──────────── */
function GameMini({ game }: { game: GameMeta }) {
  const hue = game.color;
  switch (game.key) {
    case "memory_matrix": {
      const lit = new Set([0, 4, 6, 8]);
      return (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className={`size-11 rounded-xl sm:size-12 ${
                lit.has(i) ? "scale-105 shadow-md" : "bg-white shadow-sm"
              }`}
              style={lit.has(i) ? { backgroundColor: hue } : undefined}
            />
          ))}
        </div>
      );
    }
    case "target_watch":
      return (
        <div className="flex items-center gap-2.5">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex size-9 items-center justify-center rounded-full bg-white shadow-sm sm:size-10"
              style={
                i === 3
                  ? { backgroundColor: hue, boxShadow: `0 0 0 4px ${hue}55` }
                  : undefined
              }
            >
              {i === 3 && <span className="size-2.5 rounded-full bg-white" />}
            </div>
          ))}
        </div>
      );
    case "quick_match":
      return (
        <div className="flex flex-col items-center gap-3">
          <div className="grid grid-cols-2 gap-2">
            {(["target", "grid", "gauge", "play"] as IconName[]).map((icon, i) => (
              <div
                key={icon}
                className="flex size-12 items-center justify-center rounded-xl text-white shadow-md sm:size-14"
                style={{ backgroundColor: i === 2 ? hue : "#cfc9ba" }}
              >
                <Icon name={icon} className="size-6" />
              </div>
            ))}
          </div>
          <span className="tnum rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
            0:42
          </span>
        </div>
      );
    case "stop_signal":
      return (
        <div className="flex items-center gap-4">
          <div
            className="flex size-24 items-center justify-center text-white shadow-md sm:size-28"
            style={{
              backgroundColor: hue,
              clipPath:
                "polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)",
            }}
          >
            <Icon name="alert" className="size-10" strokeWidth={2} />
          </div>
          <div className="flex size-12 items-center justify-center rounded-full bg-white text-ink shadow-sm">
            <Icon name="arrow-right" className="size-6" strokeWidth={2.2} />
          </div>
        </div>
      );
    case "spice_stall":
      return (
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="size-9 rounded-lg shadow-md sm:size-10" style={{ backgroundColor: hue }} />
            ))}
          </div>
          <div className="h-0.5 w-16 rounded-full bg-ink/15" aria-hidden="true" />
          <div className="flex gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="size-9 rounded-lg bg-white shadow-sm sm:size-10"
                style={i < 2 ? { boxShadow: `inset 0 0 0 2px ${hue}` } : undefined}
              />
            ))}
          </div>
        </div>
      );
    case "red_light":
      return (
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1.5 rounded-xl bg-ink/85 p-2 shadow-md">
            <span className="size-5 rounded-full bg-[#e5484d]" />
            <span className="size-5 rounded-full bg-[#f2c94c]" />
            <span className="size-5 rounded-full bg-[#22b573]" />
          </div>
          <div className="flex size-12 items-center justify-center rounded-full bg-white text-ink shadow-sm">
            <Icon name="arrow-right" className="size-6" strokeWidth={2.2} />
          </div>
        </div>
      );
    case "courier_map":
      return (
        <div className="relative" aria-hidden="true">
          <div
            className="rounded-2xl border-2 border-ink/10 p-5 shadow-md"
            style={{ backgroundColor: "#f4ecdd", transform: "rotateX(52deg)" }}
          >
            <svg viewBox="0 0 100 60" className="h-28 w-full">
              <line x1="8" y1="44" x2="42" y2="16" stroke={hue} strokeWidth="3" opacity="0.6" />
              <line x1="42" y1="16" x2="80" y2="26" stroke={hue} strokeWidth="3" opacity="0.6" />
              <line x1="42" y1="16" x2="48" y2="52" stroke={hue} strokeWidth="3" opacity="0.6" />
              <circle cx="8" cy="44" r="7" fill={hue} />
              <circle cx="48" cy="52" r="5" fill="#4aa8d8" />
              <path d="M74 8h4v26h-4Z" fill={hue} opacity="0.4" />
              <path d="M78 8h14l-3.5 7 3.5 7H78Z" fill={hue} />
            </svg>
          </div>
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-lg">🛵</span>
        </div>
      );
    case "lighthouse_keeper":
      return (
        <div className="flex flex-col items-center gap-2" aria-hidden="true">
          <div className="flex flex-col items-center">
            <div className="h-3 w-12 rounded-t bg-ink/80" />
            <div className="flex gap-1 rounded-t-md bg-ink/80 px-1.5 py-1">
              <span className="size-3.5 rounded-sm bg-[#e5484d]" />
              <span className="size-3.5 rounded-sm bg-[#f2c94c]" />
              <span className="size-3.5 rounded-sm bg-[#22b573]" />
            </div>
            <div className="h-10 w-8" style={{ background: `repeating-linear-gradient(180deg, #f3ede1 0 10px, ${hue} 10px 20px)` }} />
          </div>
          <div className="flex gap-1.5">
            {["#e5484d", "#f2c94c", "#22b573", "#3b7cf5"].map((c) => (
              <span key={c} className="size-6 rounded-full shadow-sm" style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      );
    case "sushi_express":
      return (
        <div className="flex flex-col items-center gap-2" aria-hidden="true">
          <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase" style={{ color: hue }}>
              Pesan
            </span>
            <span className="text-xl">🍣</span>
          </div>
          <div className="relative h-10 w-40 rounded-xl bg-[#b49a6a] shadow-md">
            <span className="absolute left-[8%] top-1/2 -translate-y-1/2 text-xl">🍙</span>
            <span className="absolute left-[38%] top-1/2 -translate-y-1/2 text-xl">🍣</span>
            <span className="absolute right-[10%] top-1/2 -translate-y-1/2 text-xl">🍤</span>
          </div>
          <span className="text-lg">👨‍🍳</span>
        </div>
      );
    case "crystal_palace":
      return (
        <div className="grid grid-cols-3 gap-2" aria-hidden="true">
          {["#e5484d", "#22b573", "#3b7cf5", "#a855f7", hue, "#3b7cf5", "#22b573", "#e5484d", "#a855f7"].map(
            (c, i) => (
              <div
                key={i}
                className="flex size-11 items-center justify-center rounded-lg bg-white shadow-sm sm:size-12"
                style={i === 4 ? { boxShadow: `0 0 0 3px ${hue}` } : undefined}
              >
                <svg viewBox="0 0 24 24" className="size-7" style={{ filter: "drop-shadow(0 2px 2px rgb(0 0 0 / 0.2))" }}>
                  <path d="M12 2 22 12 12 22 2 12Z" fill={c} opacity="0.85" />
                  <path d="M12 4l6.5 6.5L12 20 5.5 10.5Z" fill="rgba(255,255,255,0.5)" />
                </svg>
              </div>
            ),
          )}
        </div>
      );
    case "rule_switch":
    default:
      return (
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full shadow-md sm:size-14" style={{ backgroundColor: hue }} />
          <div className="size-12 rounded-2xl shadow-md sm:size-14" style={{ backgroundColor: `${hue}99` }} />
          <div
            className="size-12 shadow-md sm:size-14"
            style={{ backgroundColor: `${hue}55`, clipPath: "polygon(50% 0, 100% 100%, 0 100%)" }}
          />
        </div>
      );
  }
}

/* ── Interactive game explorer tabs ────────────────────────── */
function GamesTabs({ c, games }: { c: LandingContent; games: GameMeta[] }) {
  const [activeKey, setActiveKey] = useState(games[0].key);
  // When the visible set loads/changes, never leave the active tab on a
  // game that is no longer shown.
  useEffect(() => {
    if (!games.some((g) => g.key === activeKey)) setActiveKey(games[0].key);
  }, [games, activeKey]);
  const active = games.find((g) => g.key === activeKey) ?? games[0];
  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2.5" role="tablist" aria-label={c.gamesTitle}>
        {games.map((g) => {
          const activeTab = g.key === activeKey;
          return (
            <button
              key={g.key}
              type="button"
              role="tab"
              aria-selected={activeTab}
              onClick={() => setActiveKey(g.key)}
              className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200 ${
                activeTab
                  ? "scale-105 text-white shadow-pop"
                  : "border border-line bg-surface text-ink-soft hover:-translate-y-0.5 hover:shadow-pop"
              }`}
              style={activeTab ? { backgroundColor: g.color } : undefined}
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: activeTab ? "#fff" : g.color }}
              />
              {g.name}
            </button>
          );
        })}
      </div>

      <div
        key={active.key}
        className="fade-up relative mx-auto mt-8 max-w-4xl overflow-hidden rounded-[2rem] border border-line bg-surface p-6 shadow-pop sm:p-10"
      >
        <div className="absolute inset-x-0 top-0 h-2" style={{ backgroundColor: active.color }} />
        <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
          <div
            className="flex min-h-52 items-center justify-center rounded-3xl p-8"
            style={{ backgroundColor: active.tint }}
          >
            <GameMini game={active} />
          </div>
          <div>
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-bold"
              style={{ backgroundColor: active.tint, color: active.deep }}
            >
              {active.domain}
            </span>
            <h3 className="font-display mt-3 text-2xl font-bold sm:text-[1.7rem]">{active.name}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{active.description}</p>
            <div
              className="mt-4 rounded-2xl px-4 py-3 text-sm leading-relaxed"
              style={{ backgroundColor: active.tint }}
            >
              <span className="font-bold" style={{ color: active.deep }}>
                {c.gamesHowToPlay}:{" "}
              </span>
              <span className="text-ink-soft">{c.gameHints[active.key]}</span>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span className="badge-neutral rounded-full">{c.gamesLevelLabel}</span>
              <span className="badge-brand rounded-full">{c.gamesAdaptiveLabel}</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: i < 5 ? active.color : "var(--color-canvas-deep)" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Parents visual: mini report mock ──────────────────────── */
function ReportMock({ c }: { c: LandingContent }) {
  return (
    <div className="relative" aria-hidden="true">
      <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-attention/15 blur-2xl" />
      <Sparkle className="animate-twinkle absolute -left-4 -top-5 z-10 size-5 text-speed" />
      <div className="card relative -rotate-1 rounded-3xl p-5 shadow-pop sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-[15px] font-bold">{c.reportMockTitle}</p>
          <span className="badge-neutral rounded-full">{c.reportMockWeek}</span>
        </div>
        <div className="mt-5 space-y-4">
          {c.reportMockRows.map((row) => (
            <div key={row.label}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[13px] font-semibold text-ink-soft">{row.label}</p>
                <p className="tnum text-[13px] font-bold">{row.value}%</p>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-canvas-deep">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${row.value}%`, backgroundColor: row.color }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-surface-2 px-4 py-3">
          <div className="flex items-center gap-2 text-success-700">
            <Icon name="chart" className="size-4" strokeWidth={2.2} />
            <p className="text-[13px] font-bold">Atensi lagi naik daun</p>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            Konsistensi main 4 hari berturut-turut. Pertahankan!
          </p>
        </div>
        <p className="mt-3 text-center text-xs text-ink-mute">{c.reportMockNote}</p>
      </div>
    </div>
  );
}

export function LandingClient({ isAuthed }: LandingClientProps) {
  const [lang, setLang] = useState<"en" | "id">("id");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const c = CONTENT[lang];

  // Showcase only the games the admin has enabled (classics hidden by
  // default). Fail-open to the full set while loading or on error.
  const [visibleGames, setVisibleGames] = useState<GameMeta[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/games/visibility")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error || !json.data) return;
        const map = json.data as Record<string, boolean>;
        const visible = GAMES.filter((g) => map[g.key] !== false);
        setVisibleGames(visible.length > 0 ? visible : GAMES);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const games = visibleGames ?? GAMES;

  return (
    <div className={`${displayFont.variable} flex min-h-screen flex-col bg-canvas text-ink`}>
      {/* Floating pill nav */}
      <header className="sticky top-3 z-20 px-4 pt-2 sm:px-6">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 rounded-full border border-line bg-surface/90 py-2 pl-4 pr-2 shadow-pop backdrop-blur">
          <Link href="/" aria-label={c.navBrand} className="shrink-0">
            <Wordmark />
          </Link>
          <div className="hidden items-center gap-7 lg:flex">
            <a href="#how" className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink">
              {c.navHowItWorks}
            </a>
            <a href="#games" className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink">
              {c.navGames}
            </a>
            <a href="#parents" className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink">
              {c.navParents}
            </a>
            <a href="#faq" className="text-sm font-semibold text-ink-soft transition-colors hover:text-ink">
              {c.navFaq}
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "id" : "en")}
              aria-label={c.langToggleLabel}
              className="btn-secondary rounded-full px-3.5 py-1.5 text-[13px]"
            >
              {c.langToggle}
            </button>
            {isAuthed ? (
              <Link href="/dashboard" className="btn-primary rounded-full px-4 py-1.5 text-[13px]">
                {c.ctaDashboard}
              </Link>
            ) : (
              <Link href="/login" className="btn-primary rounded-full px-4 py-1.5 text-[13px]">
                {c.ctaSignIn}
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pb-14 pt-12 sm:pb-20 sm:pt-16">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(640px 340px at 12% 0%, rgb(59 99 201 / 0.10), transparent 60%), radial-gradient(560px 320px at 88% 18%, rgb(217 130 27 / 0.14), transparent 55%), radial-gradient(700px 360px at 50% 110%, rgb(211 232 225 / 0.9), transparent 60%), radial-gradient(360px 220px at 78% 78%, rgb(122 82 200 / 0.08), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-[13px] font-bold text-ink-soft shadow-sm">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-flex opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-flex" />
              </span>
              {c.heroBadge}
            </span>
            <h1 className="font-display mt-6 text-[2.6rem] font-extrabold leading-[1.04] sm:text-6xl">
              <HighlightedTitle title={c.heroTitle} highlight={c.heroTitleHighlight} />
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-soft lg:mx-0">
              {c.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              {isAuthed ? (
                <Link href="/dashboard" className="btn-primary rounded-full px-7 py-3.5 text-base shadow-pop">
                  {c.ctaDashboard}
                  <Icon name="arrow-right" className="size-4" strokeWidth={2.4} />
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="btn-primary rounded-full px-7 py-3.5 text-base shadow-pop">
                    {c.ctaStart}
                    <Icon name="arrow-right" className="size-4" strokeWidth={2.4} />
                  </Link>
                  <a href="#how" className="btn-secondary rounded-full px-7 py-3.5 text-base">
                    {c.ctaHow}
                  </a>
                </>
              )}
            </div>
            <ul className="mt-7 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {c.trustItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold text-ink-soft"
                >
                  <span className="flex size-4 items-center justify-center rounded-full bg-success-50 text-success-600">
                    <Icon name="check" className="size-2.5" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {c.stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line bg-surface px-4 py-3 text-center shadow-sm lg:text-left"
                >
                  <dd
                    className="tnum font-display order-1 text-[1.65rem] font-extrabold leading-none"
                    style={{ color: STAT_HUES[i % STAT_HUES.length] }}
                  >
                    {stat.value}
                  </dd>
                  <dt className="order-2 mt-1.5 text-xs font-medium leading-snug text-ink-mute">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
          <HeroVisual games={games} />
        </div>
      </section>

      {/* Marquee strip */}
      <div className="overflow-hidden border-y-4 border-ink bg-brand-900 py-3" aria-hidden="true">
        <div className="animate-marquee flex w-max items-center gap-8 pr-8">
          {[...games.map((g) => g.name), ...games.map((g) => g.name)].map((name, i) => (
            <span key={i} className="flex items-center gap-8 whitespace-nowrap">
              <span className="font-display text-lg font-bold text-white">{name}</span>
              <Sparkle className="size-4 text-[#ffd166]" />
            </span>
          ))}
        </div>
      </div>

      {/* Games explorer */}
      <section id="games" className="scroll-mt-24 bg-canvas py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{c.gamesEyebrow}</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">{c.gamesTitle}</h2>
            <p className="mt-3 text-ink-soft">{c.gamesIntro}</p>
          </Reveal>
          <Reveal className="mt-10" delay={120}>
            <GamesTabs c={c} games={games} />
          </Reveal>
        </div>
      </section>

      {/* For parents */}
      <section id="parents" className="scroll-mt-24 border-t border-line bg-surface py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">{c.parentsEyebrow}</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">{c.parentsTitle}</h2>
            <p className="mt-3 text-ink-soft">{c.parentsSubtitle}</p>
            <ul className="mt-8 space-y-3">
              {c.parentsBullets.map((bullet, i) => (
                <li
                  key={bullet.title}
                  className="flex gap-4 rounded-2xl border border-line bg-canvas/60 p-4 transition-transform hover:-translate-y-0.5"
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${BULLET_TINTS[i % BULLET_TINTS.length]}`}
                  >
                    <Icon name={bullet.icon} className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold">{bullet.title}</h3>
                    <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-soft">{bullet.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={140}>
            <ReportMock c={c} />
          </Reveal>
        </div>
      </section>

      {/* For kids — playful dark band */}
      <section className="bg-surface px-4 py-6 sm:px-6">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-brand-900 px-6 py-14 sm:px-12 sm:py-16">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(420px 240px at 10% 10%, rgb(217 130 27 / 0.25), transparent 60%), radial-gradient(480px 260px at 90% 90%, rgb(122 82 200 / 0.35), transparent 60%), radial-gradient(360px 220px at 80% 10%, rgb(59 99 201 / 0.25), transparent 60%)",
            }}
          />
          <Sparkle className="animate-twinkle absolute left-[12%] top-8 size-5 text-[#ffd166]" />
          <Sparkle className="animate-twinkle absolute right-[16%] top-14 size-4 text-white/70 [animation-delay:900ms]" />
          <Sparkle className="animate-twinkle absolute bottom-10 left-[45%] size-3.5 text-white/50 [animation-delay:1700ms]" />
          <div className="relative mx-auto max-w-2xl text-center">
            <div className="animate-bob mx-auto w-fit">
              <Mascot mood="happy" accent="#ffd166" className="size-20" />
            </div>
            <p className="eyebrow mt-4" style={{ color: "#ffd166" }}>{c.kidsEyebrow}</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold text-white sm:text-4xl">
              {c.kidsTitle}
            </h2>
            <p className="mt-3 text-white/75">{c.kidsSubtitle}</p>
          </div>
          <div className="relative mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {c.kidsCards.map((card, i) => (
              <div
                key={card.title}
                className={`rounded-3xl bg-white/10 p-6 ring-1 ring-white/15 backdrop-blur transition-transform hover:-translate-y-1 ${
                  i === 1 ? "md:translate-y-3" : ""
                }`}
              >
                <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-white/15 text-[#ffd166]">
                  <Icon name={card.icon} className="size-5.5" />
                </span>
                <h3 className="font-display mt-4 text-lg font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{card.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-24 bg-surface py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">{c.howEyebrow}</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">{c.howTitle}</h2>
            <p className="mt-3 text-ink-soft">{c.howIntro}</p>
          </Reveal>
          <ol className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {c.steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 80}>
                <li className="card-flush relative h-full rounded-3xl p-5">
                  <span
                    className="font-display flex size-11 items-center justify-center rounded-full text-lg font-extrabold text-white shadow-sm"
                    style={{ backgroundColor: games[i % games.length].color }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-[15px] font-bold leading-snug">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-24 border-t border-line bg-canvas py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal className="text-center">
            <div className="mx-auto w-fit">
              <Mascot mood="think" accent="#7a52c8" className="size-16" />
            </div>
            <p className="eyebrow mt-3">{c.faqEyebrow}</p>
            <h2 className="font-display mt-2 text-3xl font-extrabold sm:text-4xl">{c.faqTitle}</h2>
            <p className="mt-3 text-ink-soft">{c.faqSubtitle}</p>
          </Reveal>
          <div className="mt-10 space-y-3">
            {c.faqs.map((faq, i) => {
              const open = openFaq === i;
              return (
                <div key={faq.q} className="card overflow-hidden rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-[15px] font-bold">{faq.q}</span>
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                        open ? "rotate-45 bg-brand-600 text-white" : "bg-canvas-deep text-ink-soft"
                      }`}
                    >
                      <Icon name="plus" className="size-4" strokeWidth={2.4} />
                    </span>
                  </button>
                  {open && (
                    <p className="fade-up px-5 pb-5 text-sm leading-relaxed text-ink-soft">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="scroll-mt-24 border-t border-line bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-center text-3xl font-extrabold">{c.safetyTitle}</h2>
            <p className="mt-3 text-center text-ink-soft">{c.safetyIntro}</p>
          </Reveal>
          <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {c.safetyItems.map((item) => (
              <li key={item} className="card-flush flex items-start gap-3 rounded-2xl px-4 py-3.5">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-600">
                  <Icon name="check" className="size-3" strokeWidth={2.4} />
                </span>
                <span className="text-sm leading-relaxed text-ink-soft">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-warning-600/25 bg-warning-50 px-6 py-5">
            <h3 className="font-bold text-warning-700">{c.disclaimerTitle}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-warning-700/90">{c.disclaimerBody}</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-surface px-4 pb-16 pt-4 sm:px-6">
        <Reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-14 text-center shadow-pop sm:px-12 sm:py-16"
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(120deg, #0a6454 0%, #0f9d6e 45%, #3b63c9 100%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(400px 200px at 15% 20%, rgb(255 255 255 / 0.18), transparent 60%), radial-gradient(400px 220px at 85% 85%, rgb(255 209 102 / 0.35), transparent 60%)",
            }}
          />
          {/* confetti dots */}
          {[
            "left-[8%] top-[18%] bg-[#ffd166]",
            "left-[14%] bottom-[22%] bg-white/80",
            "right-[10%] top-[24%] bg-white/80",
            "right-[16%] bottom-[18%] bg-[#ffd166]",
            "left-[48%] top-[10%] bg-white/60",
          ].map((pos, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`animate-twinkle absolute size-2.5 rounded-full ${pos}`}
              style={{ animationDelay: `${i * 550}ms` }}
            />
          ))}
          <div className="relative">
            <div className="animate-bob mx-auto w-fit">
              <Mascot mood="cheer" accent="#ffd166" className="size-24" />
            </div>
            <h2 className="font-display mx-auto mt-4 max-w-2xl text-3xl font-extrabold text-white sm:text-4xl">
              {c.ctaBottomTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">{c.ctaBottomBody}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  className="btn rounded-full bg-white px-7 py-3.5 text-base font-bold text-brand-800 shadow-pop hover:bg-brand-50"
                >
                  {c.ctaDashboard}
                  <Icon name="arrow-right" className="size-4" strokeWidth={2.4} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="btn rounded-full bg-white px-7 py-3.5 text-base font-bold text-brand-800 shadow-pop hover:bg-brand-50"
                  >
                    {c.ctaStart}
                    <Icon name="arrow-right" className="size-4" strokeWidth={2.4} />
                  </Link>
                  <Link
                    href="/login"
                    className="btn rounded-full px-7 py-3.5 text-base font-bold text-white ring-2 ring-inset ring-white/40 hover:bg-white/10"
                  >
                    {c.ctaSignIn}
                  </Link>
                </>
              )}
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {c.trustItems.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-sm font-semibold text-white/85">
                  <Icon name="check" className="size-3.5" strokeWidth={2.8} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-canvas py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-ink-mute sm:flex-row sm:px-6">
          <span>{c.footerRights}</span>
          <span className="hidden sm:inline">{c.footerTagline}</span>
          <a href="#" className="hover:text-ink">
            {c.footerPrivacy}
          </a>
        </div>
      </footer>
    </div>
  );
}
