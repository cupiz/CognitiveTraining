"use client";

import { EmptyCard } from "./EmptyCard";
import { gameMeta } from "@/lib/games";

interface GameRunStat {
  gameKey: string;
  status: string;
  count: number;
}

export function GamePerformance({ stats }: { stats: GameRunStat[] }) {
  if (stats.length === 0) {
    return (
      <EmptyCard
        title="Performa game"
        empty="Belum ada data — mainkan beberapa ronde untuk melihat statistik performa."
      />
    );
  }

  const gameStats = new Map<string, { completed: number; total: number }>();
  for (const stat of stats) {
    const existing = gameStats.get(stat.gameKey) ?? { completed: 0, total: 0 };
    existing.total += stat.count;
    if (stat.status === "completed") existing.completed += stat.count;
    gameStats.set(stat.gameKey, existing);
  }

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold text-ink">Performa game</h3>
      <div className="mt-4 space-y-2">
        {Array.from(gameStats.entries()).map(([gameKey, data]) => {
          const meta = gameMeta(gameKey);
          const completionRate =
            data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

          return (
            <div
              key={gameKey}
              className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:bg-surface-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{ backgroundColor: meta.tint, color: meta.deep }}
                >
                  {meta.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{meta.name}</p>
                  <p className="text-xs text-ink-mute">
                    {data.completed} dari {data.total} selesai
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="tnum text-sm font-semibold text-ink">{completionRate}%</p>
                <div className="mt-1.5 h-1 w-20 overflow-hidden rounded-full bg-canvas-deep">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${completionRate}%`, backgroundColor: meta.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
