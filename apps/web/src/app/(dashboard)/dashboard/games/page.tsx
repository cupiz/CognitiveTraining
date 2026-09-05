"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GAMES } from "@/lib/games";
import { GameArt } from "@/components/games/GameArt";
import { Icon } from "@/components/ui/icons";

const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Sangat mudah", 2: "Mudah", 3: "Mudah–sedang", 4: "Sedang",
  5: "Sedang", 6: "Sedang–sulit", 7: "Sulit", 8: "Sulit",
  9: "Sangat sulit", 10: "Pakar",
};

interface ChildSummary {
  id: string;
  displayName: string;
}

export default function GamesPage() {
  const router = useRouter();
  const [difficulties, setDifficulties] = useState<Record<string, number>>(
    Object.fromEntries(GAMES.map((g) => [g.key, g.defaultDifficulty])),
  );
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(true);
  // Per-game visibility (admin-controlled); null while loading or on error → show all.
  const [visibility, setVisibility] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/games/visibility")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.error && json.data) setVisibility(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  // Initial childId from the URL (?childId=… — children page links here).
  const [urlChildId] = useState<string | null>(() =>
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("childId")
      : null,
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/children")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const list: ChildSummary[] = Array.isArray(json.data) ? json.data : [];
        setChildren(list);
        if (urlChildId && list.some((c) => c.id === urlChildId)) {
          setSelectedChildId(urlChildId);
        } else if (list.length === 1) {
          setSelectedChildId(list[0].id);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setChildrenLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlChildId]);

  function handlePlay(gameKey: string) {
    if (!selectedChildId) return;
    router.push(
      `/dashboard/play/${gameKey}?difficulty=${difficulties[gameKey] ?? 4}&childId=${selectedChildId}`,
    );
  }

  const games = visibility ? GAMES.filter((g) => visibility[g.key] !== false) : GAMES;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="page-title">Permainan</h1>
        <p className="page-subtitle">
          Latihan fokus — satu domain kognitif per game. Pilih level awal, mesin
          akan menyesuaikan dari sana.
        </p>
      </div>

      {/* Pemilih anak — sesi latihan tercatat atas nama anak */}
      <div className="card mb-6 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-ink">
          <Icon name="users" className="size-4.5 text-brand-600" />
          Bermain sebagai
        </div>

        {childrenLoading ? (
          <div className="h-10 w-full max-w-64 animate-pulse rounded-xl bg-line/60" />
        ) : children.length === 0 ? (
          <div className="flex flex-col gap-2 text-sm text-ink-soft sm:flex-row sm:items-center">
            <span>Belum ada profil anak.</span>
            <Link href="/dashboard/children/new" className="btn-secondary px-3 py-1.5 text-[13px]">
              <Icon name="plus" className="size-3.5" />
              Buat profil anak
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <select
              value={selectedChildId ?? ""}
              onChange={(e) => setSelectedChildId(e.target.value || null)}
              className="input h-10 w-full max-w-64"
              aria-label="Pilih anak"
            >
              <option value="" disabled>
                {children.length > 1 ? "— Pilih anak —" : children[0]?.displayName}
              </option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.displayName}
                </option>
              ))}
            </select>
            {!selectedChildId && children.length > 0 && (
              <p className="text-xs font-medium text-warning-600">
                Pilih anak di atas untuk memulai sesi
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {games.map((game) => (
          <GameCard
            key={game.key}
            gameKey={game.key}
            difficulty={difficulties[game.key] ?? game.defaultDifficulty}
            disabled={!selectedChildId}
            onDifficultyChange={(val) =>
              setDifficulties((prev) => ({ ...prev, [game.key]: val }))
            }
            onPlay={() => handlePlay(game.key)}
          />
        ))}
      </div>
    </div>
  );
}

function GameCard({
  gameKey,
  difficulty,
  disabled,
  onDifficultyChange,
  onPlay,
}: {
  gameKey: string;
  difficulty: number;
  disabled?: boolean;
  onDifficultyChange: (val: number) => void;
  onPlay: () => void;
}) {
  const meta = GAMES.find((g) => g.key === gameKey)!;

  return (
    <article className={`card group flex flex-col overflow-hidden transition-shadow duration-200 ${disabled ? "opacity-75" : "hover:shadow-pop"}`}>
      {/* Art band */}
      <div
        className="relative flex h-28 items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(160deg, ${meta.tint} 0%, transparent 120%)`,
        }}
      >
        <div className="absolute inset-0 opacity-60 transition-transform duration-300 group-hover:scale-[1.04]">
          <GameArt gameKey={gameKey} className="mx-auto h-full w-auto max-w-44" />
        </div>
        <span
          className="absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
          style={{ backgroundColor: "rgb(255 255 255 / 0.75)", color: meta.deep, backdropFilter: "blur(4px)" }}
        >
          {meta.domain}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-[17px] font-bold tracking-[-0.01em] text-ink">{meta.name}</h2>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">
          {meta.description}
        </p>

        {/* Difficulty */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-mute">
              Level awal
            </label>
            <span className="badge" style={{ backgroundColor: meta.tint, color: meta.deep }}>
              {DIFFICULTY_LABELS[difficulty]}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={difficulty}
            onChange={(e) => onDifficultyChange(Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{ accentColor: meta.color }}
            aria-label="Tingkat kesulitan"
          />
          <div className="mt-1 flex justify-between text-[11px] font-medium tabular-nums text-ink-faint">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={difficulty === i + 1 ? "font-bold" : ""}>
                {i + 1}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={onPlay}
          disabled={disabled}
          title={disabled ? "Pilih anak dulu" : undefined}
          className="btn mt-4 w-full py-2.5 text-white transition-opacity hover:opacity-90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:opacity-45"
          style={{ backgroundColor: meta.color }}
        >
          Main {meta.name}
        </button>
      </div>
    </article>
  );
}
