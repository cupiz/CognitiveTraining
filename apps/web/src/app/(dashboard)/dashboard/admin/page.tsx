"use client";

import { StatsCard } from "@/components/dashboard";
import { Icon, type IconName } from "@/components/ui/icons";
import { useLiveData } from "@/lib/use-live-data";

interface OverviewData {
  accounts: { total: number; byRole: Record<string, number>; newLast7d: number };
  children: { total: number; active: number };
  assessments: { total: number; completed: number };
  trainingSessions: { total: number; completed: number };
  gameRuns: { total: number; completed: number };
  telemetry: { rawEvents: number };
  games: { visible: number };
}

const QUICK_LINKS: Array<{
  href: string;
  title: string;
  desc: string;
  icon: IconName;
}> = [
  {
    href: "/dashboard/admin/users",
    title: "Manajemen Pengguna",
    desc: "Lihat semua akun, ubah role (orang tua / admin / peneliti), hapus akun bermasalah.",
    icon: "users",
  },
  {
    href: "/dashboard/admin/children",
    title: "Manajemen Data Anak",
    desc: "Direktori seluruh profil anak lintas akun — arsipkan atau aktifkan kembali.",
    icon: "users",
  },
  {
    href: "/dashboard/admin/master-data",
    title: "Master Data",
    desc: "Katalog game, domain kognitif, dan versi algoritma yang terpakai di platform.",
    icon: "grid",
  },
  {
    href: "/dashboard/admin/games",
    title: "Visibilitas Game",
    desc: "Atur game mana yang tampil di peta dunia anak dan halaman Permainan orang tua.",
    icon: "target",
  },
  {
    href: "/dashboard/admin/audit",
    title: "Audit Log",
    desc: "Jejak operasi sensitif: login, perubahan data, dan aksi admin.",
    icon: "activity",
  },
];

export default function AdminOverviewPage() {
  const { data, loading, error } = useLiveData<OverviewData>(async () => {
    const res = await fetch("/api/admin/overview");
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data as OverviewData;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="size-7 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
        <p className="text-sm text-ink-mute">Memuat statistik platform…</p>
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
        <h1 className="page-title">Panel Admin</h1>
        <p className="page-subtitle">
          Kelola pengguna, data anak, dan data induk platform dari satu tempat.
        </p>
      </div>

      {/* Platform stats */}
      <section aria-label="Statistik platform">
        <p className="eyebrow mb-3">Statistik Platform</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatsCard
            title="Total Akun"
            value={data.accounts.total}
            subtitle={`${data.accounts.newLast7d} baru dalam 7 hari`}
            icon="users"
            color="brand"
          />
          <StatsCard
            title="Profil Anak"
            value={data.children.total}
            subtitle={`${data.children.active} aktif`}
            icon="users"
            color="success"
          />
          <StatsCard
            title="Sesi Latihan"
            value={data.trainingSessions.total}
            subtitle={`${data.trainingSessions.completed} selesai`}
            icon="activity"
            color="attention"
          />
          <StatsCard
            title="Game Run"
            value={data.gameRuns.total}
            subtitle={`${data.gameRuns.completed} selesai · ${data.telemetry.rawEvents.toLocaleString("id-ID")} event`}
            icon="target"
            color="warning"
          />
        </div>
      </section>

      {/* Role breakdown + assessment funnel */}
      <section aria-label="Rincian" className="grid gap-3 md:grid-cols-2">
        <div className="card p-5">
          <p className="eyebrow">Akun per Role</p>
          <ul className="mt-3 space-y-2.5">
            {[
              { key: "parent", label: "Orang Tua" },
              { key: "admin", label: "Admin" },
              { key: "researcher", label: "Peneliti" },
            ].map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-ink-soft">{r.label}</span>
                <span className="tnum font-bold text-ink">
                  {data.accounts.byRole[r.key] ?? 0}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-4 border-t border-line pt-2.5 text-sm">
              <span className="font-semibold text-ink">Penilaian selesai</span>
              <span className="tnum font-bold text-ink">
                {data.assessments.completed}/{data.assessments.total}
              </span>
            </li>
          </ul>
        </div>

        <div className="card p-5">
          <p className="eyebrow">Status Konten</p>
          <ul className="mt-3 space-y-2.5">
            <li className="flex items-center justify-between gap-4 text-sm">
              <span className="text-ink-soft">Game tampil untuk anak</span>
              <span className="tnum font-bold text-ink">{data.games.visible}</span>
            </li>
            <li className="flex items-center justify-between gap-4 text-sm">
              <span className="text-ink-soft">Anak aktif</span>
              <span className="tnum font-bold text-ink">{data.children.active}</span>
            </li>
            <li className="flex items-center justify-between gap-4 text-sm">
              <span className="text-ink-soft">Anak diarsipkan</span>
              <span className="tnum font-bold text-ink">
                {data.children.total - data.children.active}
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Quick links */}
      <section aria-label="Menu admin">
        <p className="eyebrow mb-3">Menu Admin</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="card group p-5 transition-colors hover:border-brand-200"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon name={link.icon} className="size-5" strokeWidth={1.7} />
              </div>
              <h2 className="mt-3 text-[15px] font-bold tracking-[-0.01em] text-ink">
                {link.title}
              </h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{link.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
                Buka
                <Icon
                  name="arrow-right"
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
