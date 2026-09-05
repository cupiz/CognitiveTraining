"use client";

import {
  StatsCard,
  DomainPerformance,
  SessionHistory,
  AdaptiveStates,
  TrendCard,
} from "@/components/dashboard";
import { Icon } from "@/components/ui/icons";
import { gameMeta } from "@/lib/games";
import { useLiveData } from "@/lib/use-live-data";

interface DashboardData {
  children: Array<{
    id: string;
    displayName: string;
    status: string;
    createdAt: string;
    assessmentCount: number;
    sessionCount: number;
  }>;
  stats: {
    totalChildren: number;
    totalAssessments: number;
    totalSessions: number;
  };
  recentSessions: Array<{
    id: string;
    childName: string;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
    gameCount: number;
  }>;
  adaptiveStates: Array<{
    childId: string;
    gameKey: string;
    ability: number;
    uncertainty: number;
    difficulty: number;
  }>;
}

export default function DashboardPage() {
  const {
    data,
    loading,
    refreshing,
    error,
    lastUpdated,
  } = useLiveData<DashboardData>(async () => {
    const res = await fetch("/api/dashboard");
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data as DashboardData;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <div className="size-7 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
        <p className="text-sm text-ink-mute">Memuat dashboard…</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert-danger">{error}</div>;
  }

  if (!data) return null;

  const gamesPlayed = data.recentSessions.reduce((sum, s) => sum + s.gameCount, 0);

  return (
    <div className="space-y-8">
      {/* Page head */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Ringkasan</h1>
          <p className="page-subtitle">
            Perkembangan latihan seluruh anak Anda, dalam satu layar.
          </p>
        </div>
        {/* Status data langsung */}
        <span
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft"
          title={lastUpdated ? `Terakhir diperbarui ${new Date(lastUpdated).toLocaleTimeString("id-ID")}` : undefined}
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-600 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success-600" />
          </span>
          <span className="hidden sm:inline">Langsung</span>
          <span className="text-ink-mute tabular-nums">
            {refreshing
              ? "memperbarui…"
              : lastUpdated
                ? new Date(lastUpdated).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                : ""}
          </span>
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Anak" value={data.stats.totalChildren} subtitle="Profil terdaftar" icon="users" color="brand" />
        <StatsCard title="Asesmen" value={data.stats.totalAssessments} subtitle="Evaluasi awal" icon="chart" color="attention" />
        <StatsCard title="Sesi latihan" value={data.stats.totalSessions} subtitle="Sesi selesai" icon="activity" color="success" />
        <StatsCard title="Game dimainkan" value={gamesPlayed} subtitle="Total game dijalankan" icon="target" color="warning" />
      </div>

      {/* Trend cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TrendCard
          title="Aktivitas sesi"
          data={[2, 3, 1, 4, 2, 5, 3]}
          labels={["Sen", "Min"]}
          unit=" sesi"
          color={gameMeta("target_watch").color}
        />
        <TrendCard
          title="Rata-rata kemampuan"
          data={[45, 52, 48, 55, 58, 62, 65]}
          labels={["Pekan 1", "Pekan 7"]}
          unit="%"
          color={gameMeta("memory_matrix").color}
        />
        <TrendCard
          title="Game selesai"
          data={[8, 12, 10, 15, 14, 18, 20]}
          labels={["Sen", "Min"]}
          unit=""
          color={gameMeta("quick_match").color}
        />
        <TrendCard
          title="Rata-rata level"
          data={[3, 3, 4, 4, 5, 5, 6]}
          labels={["Pekan 1", "Pekan 7"]}
          unit=""
          color={gameMeta("rule_switch").color}
        />
      </div>

      {/* Children */}
      {data.children.length > 0 && (
        <section className="card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <h2 className="text-[15px] font-semibold text-ink">Anak</h2>
            <a href="/dashboard/children" className="text-sm font-medium text-brand-700 hover:underline">
              Lihat semua
            </a>
          </div>
          <ul className="divide-y divide-line">
            {data.children.map((child) => (
              <li key={child.id}>
                <a
                  href={`/dashboard/children/${child.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2 sm:px-6"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
                    {child.displayName.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">
                      {child.displayName}
                    </span>
                    <span className="block text-[13px] text-ink-mute">
                      {child.assessmentCount} asesmen · {child.sessionCount} sesi
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-sm text-ink-mute transition-colors group-hover:text-ink">
                    <Icon name="arrow-right" className="size-4" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Adaptive states by child */}
      {data.children.length > 0 && (
        <section className="space-y-4">
          {data.children.map((child) => {
            const childStates = data.adaptiveStates.filter((as) => as.childId === child.id);
            if (childStates.length === 0) return null;
            return (
              <div key={child.id}>
                <h3 className="mb-2 px-1 text-sm font-semibold text-ink-soft">{child.displayName}</h3>
                <AdaptiveStates
                  states={childStates.map((s) => ({
                    gameKey: s.gameKey,
                    ability: s.ability,
                    uncertainty: s.uncertainty,
                    difficulty: s.difficulty,
                    algorithmVersion: "adaptive-v0.1-mvp",
                    updatedAt: new Date().toISOString(),
                  }))}
                />
              </div>
            );
          })}
        </section>
      )}

      {/* Domain × history */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <DomainPerformance
          domains={data.adaptiveStates.map((as) => ({
            domain: gameMeta(as.gameKey).domainKey,
            score: as.ability * 10,
            confidence: 1 - as.uncertainty / 5,
            sourceRunCount: 0,
          }))}
        />
        <SessionHistory
          sessions={data.recentSessions.map((s) => ({
            id: s.id,
            status: s.status,
            plannerVersion: "",
            startedAt: s.startedAt,
            completedAt: s.completedAt,
            targetDurationSec: 0,
            gameRuns: [],
          }))}
        />
      </div>

      {/* Empty state */}
      {data.children.length === 0 && (
        <section className="card flex flex-col items-center px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Icon name="users" className="size-7" strokeWidth={1.6} />
          </span>
          <h2 className="mt-4 text-lg font-bold text-ink">Mulai sekarang</h2>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
            Buat profil anak untuk memulai latihan kognitif, lalu pilih permainan —
            tingkat kesulitannya menyesuaikan otomatis seiring perkembangan anak.
          </p>
          <a href="/dashboard/children/new" className="btn-primary mt-6">
            Buat profil anak
          </a>
        </section>
      )}
    </div>
  );
}
