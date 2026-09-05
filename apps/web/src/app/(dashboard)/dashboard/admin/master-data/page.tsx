"use client";

import { Icon } from "@/components/ui/icons";
import { useLiveData } from "@/lib/use-live-data";

interface MasterGame {
  key: string;
  name: string;
  domain: string;
  domainKey: string;
  family: "classic" | "flagship";
  color: string;
  tint: string;
  deep: string;
  description: string;
  defaultDifficulty: number;
  visible: boolean;
  usage: { totalRuns: number; completedRuns: number; inProgress: number };
}

interface MasterDomain {
  key: string;
  label: string;
  gameCount: number;
  assessmentBlocks: number;
}

interface MasterData {
  games: MasterGame[];
  domains: MasterDomain[];
  versions: { planner: string[]; assessment: string[]; metric: string[] };
}

export default function AdminMasterDataPage() {
  const { data, loading, error } = useLiveData<MasterData>(async () => {
    const res = await fetch("/api/admin/master-data");
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data as MasterData;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="size-7 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
        <p className="text-sm text-ink-mute">Memuat master data…</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert-danger">{error}</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Master Data</h1>
        <p className="page-subtitle">
          Data induk platform: katalog game, domain kognitif, dan versi algoritma yang dipakai
          pipeline penilaian &amp; pelatihan. Untuk mengubah visibilitas game, gunakan tab
          Visibilitas Game.
        </p>
      </div>

      {/* Game catalog */}
      <section aria-label="Katalog game">
        <p className="eyebrow mb-3">Katalog Game ({data.games.length})</p>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas-deep/60 text-[11px] uppercase tracking-[0.08em] text-ink-mute">
                  <th className="px-5 py-3 font-semibold">Game</th>
                  <th className="px-4 py-3 font-semibold">Domain</th>
                  <th className="px-4 py-3 font-semibold">Keluarga</th>
                  <th className="px-4 py-3 text-right font-semibold">Kesulitan Awal</th>
                  <th className="px-4 py-3 text-right font-semibold">Total Run</th>
                  <th className="px-5 py-3 text-right font-semibold">Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.games.map((game) => (
                  <tr key={game.key} className={game.visible ? "" : "opacity-75"}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold"
                          style={{ backgroundColor: game.tint, color: game.deep }}
                          aria-hidden="true"
                        >
                          {game.name.charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{game.name}</p>
                          <p className="truncate text-[12px] text-ink-mute">{game.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{game.domain}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${
                          game.family === "flagship"
                            ? "bg-brand-50 text-brand-700"
                            : "bg-canvas-deep text-ink-mute"
                        }`}
                      >
                        {game.family === "flagship" ? "Flagship" : "Klasik"}
                      </span>
                    </td>
                    <td className="tnum px-4 py-3 text-right text-ink-soft">
                      D{game.defaultDifficulty}
                    </td>
                    <td className="tnum px-4 py-3 text-right font-semibold text-ink">
                      {game.usage.totalRuns}
                      {game.usage.inProgress > 0 && (
                        <span className="ml-1 text-[11px] font-medium text-ink-mute">
                          ({game.usage.inProgress} jalan)
                        </span>
                      )}
                    </td>
                    <td className="tnum px-5 py-3 text-right font-semibold text-ink">
                      {game.usage.completedRuns}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Domains */}
        <section aria-label="Domain kognitif">
          <p className="eyebrow mb-3">Domain Kognitif ({data.domains.length})</p>
          <div className="card divide-y divide-line">
            {data.domains.map((d) => (
              <div key={d.key} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{d.label}</p>
                  <p className="text-[12px] text-ink-mute">{d.key}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tnum text-sm font-bold text-ink">{d.gameCount} game</p>
                  <p className="tnum text-[12px] text-ink-mute">
                    {d.assessmentBlocks} blok penilaian
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Versions */}
        <section aria-label="Versi algoritma">
          <p className="eyebrow mb-3">Versi Algoritma Terpakai</p>
          <div className="card divide-y divide-line">
            {[
              { label: "Planner (perencana sesi)", items: data.versions.planner },
              { label: "Penilaian (assessment)", items: data.versions.assessment },
              { label: "Metrik tugas", items: data.versions.metric },
            ].map((v) => (
              <div key={v.label} className="px-5 py-3.5">
                <p className="text-sm font-semibold text-ink">{v.label}</p>
                {v.items.length === 0 ? (
                  <p className="mt-0.5 text-[12.5px] text-ink-mute">Belum ada data.</p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {v.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-md bg-canvas-deep px-2 py-0.5 text-[12px] font-semibold text-ink-soft"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-mute">
            <Icon name="info" className="mt-0.5 size-4 shrink-0" />
            Versi di atas diambil dari data nyata di database (distinct). Semua hasil pengukuran
            mencatat versi algoritmanya agar perbandingan antar-versi tetap valid.
          </p>
        </section>
      </div>
    </div>
  );
}
