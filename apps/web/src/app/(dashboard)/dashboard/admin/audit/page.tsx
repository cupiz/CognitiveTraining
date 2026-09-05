"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icons";
import { useLiveData } from "@/lib/use-live-data";

interface AuditEntry {
  timestamp: string;
  action: string;
  accountId?: string;
  childId?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

const PAGE_SIZE = 30;

const ACTION_LABEL: Record<string, string> = {
  "auth.login": "Login",
  "auth.login_failed": "Login gagal",
  "auth.logout": "Logout",
  "auth.signup": "Daftar akun",
  "auth.password_reset": "Reset password",
  "auth.email_verify": "Verifikasi email",
  "child.create": "Buat profil anak",
  "child.update": "Ubah profil anak",
  "child.delete": "Hapus profil anak",
  "consent.grant": "Beri persetujuan",
  "consent.revoke": "Cabut persetujuan",
  "assessment.create": "Buat penilaian",
  "assessment.complete": "Penilaian selesai",
  "session.create": "Buat sesi latihan",
  "session.start": "Mulai sesi",
  "session.complete": "Sesi selesai",
  "game_run.create": "Buat game run",
  "game_run.start": "Mulai game run",
  "game_run.finish": "Selesai game run",
  "telemetry.batch": "Batch telemetry",
  "data.export": "Ekspor data",
  "data.delete": "Hapus data",
  "admin.game_visibility": "Ubah visibilitas game",
  "admin.user_role_change": "Ubah role pengguna",
  "admin.user_delete": "Hapus pengguna",
  "admin.child_status": "Ubah status anak",
  "access.denied": "Akses ditolak",
};

function isAdminAction(action: string) {
  return action.startsWith("admin.");
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AdminAuditPage() {
  const [actionFilter, setActionFilter] = useState("");
  const [offset, setOffset] = useState(0);

  const { data, loading, refreshing, error, lastUpdated, refetch } = useLiveData<{
    entries: AuditEntry[];
    total: number;
  }>(async () => {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (actionFilter) params.set("action", actionFilter);
    const res = await fetch(`/api/admin/audit?${params}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    return json.data;
  });

  // Reset pagination when the filter changes.
  useEffect(() => {
    setOffset(0);
  }, [actionFilter]);

  const refetchRef = useCallback(() => refetch(), [refetch]);

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Audit Log</h1>
        <p className="page-subtitle">
          Jejak operasi sensitif: autentikasi, perubahan data, dan aksi admin. Log disimpan
          in-memory untuk sesi server berjalan — restart server mengosongkan riwayat.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="input w-auto"
          aria-label="Filter jenis aksi"
        >
          <option value="">Semua aksi</option>
          {Object.entries(ACTION_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <span className="tnum text-[13px] font-semibold text-ink-mute">
          {total} entri{actionFilter ? " (terfilter)" : ""}
        </span>
        <button
          onClick={refetchRef}
          disabled={refreshing}
          className="btn-secondary ml-auto px-3 py-1.5 text-[13px]"
        >
          <Icon name="activity" className="size-4" />
          {refreshing ? "Memuat…" : "Segarkan"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
          <p className="text-sm font-medium text-ink-soft">Memuat audit log…</p>
        </div>
      ) : error ? (
        <div className="alert-danger">{error}</div>
      ) : entries.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">Belum ada entri audit.</p>
          <p className="mt-1 text-[13px] text-ink-soft">
            {actionFilter
              ? "Belum ada aksi dengan jenis ini. Coba hapus filter."
              : "Aksi sensitif pertama (login, ubah data, dll) akan tercatat di sini."}
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {entries.map((entry, i) => (
            <div key={`${entry.timestamp}-${i}`} className="px-4 py-3 sm:px-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${
                    isAdminAction(entry.action)
                      ? "bg-brand-50 text-brand-700"
                      : entry.action === "auth.login_failed" || entry.action === "access.denied"
                        ? "bg-danger-50 text-danger-600"
                        : "bg-canvas-deep text-ink-soft"
                  }`}
                >
                  {ACTION_LABEL[entry.action] ?? entry.action}
                </span>
                <span className="tnum text-[12.5px] text-ink-mute">
                  {formatTime(entry.timestamp)}
                </span>
                {entry.resourceId && (
                  <span className="max-w-full truncate text-[12px] text-ink-mute">
                    · {entry.resourceId}
                  </span>
                )}
              </div>
              {entry.details && Object.keys(entry.details).length > 0 && (
                <p className="mt-1 truncate text-[12.5px] text-ink-soft">
                  {Object.entries(entry.details)
                    .map(([k, v]) => `${k}: ${String(v)}`)
                    .join(" · ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            disabled={!hasPrev || loading}
            className="btn-secondary"
          >
            <Icon name="arrow-left" className="size-4" />
            Sebelumnya
          </button>
          <span className="tnum text-[13px] text-ink-mute">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} dari {total}
            {lastUpdated
              ? ` · diperbarui ${new Date(lastUpdated).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : ""}
          </span>
          <button
            onClick={() => setOffset(offset + PAGE_SIZE)}
            disabled={!hasNext || loading}
            className="btn-secondary"
          >
            Berikutnya
            <Icon name="arrow-right" className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
