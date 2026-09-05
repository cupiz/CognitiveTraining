"use client";

import { EmptyCard } from "./EmptyCard";
import { gameMeta } from "@/lib/games";

interface GameRun {
  id: string;
  gameKey: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
}

interface Session {
  id: string;
  status: string;
  plannerVersion: string;
  startedAt: string | null;
  completedAt: string | null;
  targetDurationSec: number;
  gameRuns: GameRun[];
}

const statusBadges: Record<string, string> = {
  pending: "badge-neutral",
  in_progress: "badge-brand",
  completed: "badge-success",
  interrupted: "badge-warning",
  abandoned: "badge-danger",
};

const statusLabels: Record<string, string> = {
  pending: "Menunggu",
  in_progress: "Berlangsung",
  completed: "Selesai",
  interrupted: "Terputus",
  abandoned: "Berhenti",
};

export function SessionHistory({ sessions }: SessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <EmptyCard
        title="Riwayat sesi"
        empty="Belum ada sesi — mulai satu sesi latihan untuk melihat riwayat di sini."
      />
    );
  }

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold text-ink">Riwayat sesi</h3>
      <div className="mt-4 space-y-2.5">
        {sessions.map((session) => {
          const startDate = session.startedAt ? new Date(session.startedAt) : null;
          const duration =
            session.completedAt && startDate
              ? Math.round(
                  (new Date(session.completedAt).getTime() - startDate.getTime()) / 1000,
                )
              : null;

          return (
            <div
              key={session.id}
              className="rounded-xl border border-line bg-surface-2/60 px-4 py-3 transition-colors hover:bg-surface-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={statusBadges[session.status] ?? "badge-neutral"}
                  >
                    {statusLabels[session.status] ?? session.status.replace("_", " ")}
                  </span>
                  <span className="text-[13px] text-ink-mute">
                    {startDate
                      ? startDate.toLocaleString("id-ID", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Belum dimulai"}
                  </span>
                </div>
                <span className="text-[13px] tabular-nums text-ink-mute">
                  {session.gameRuns.length} game
                  {duration !== null && (
                    <>
                      {" "}
                      · {Math.max(1, Math.round(duration / 60))} mnt
                    </>
                  )}
                </span>
              </div>
              {session.gameRuns.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {session.gameRuns.map((gr) => {
                    const meta = gameMeta(gr.gameKey);
                    return (
                      <span
                        key={gr.id}
                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
                        style={{ backgroundColor: meta.tint, color: meta.deep }}
                      >
                        <span
                          className="size-1.5 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        {meta.name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface SessionHistoryProps {
  sessions: Session[];
}
