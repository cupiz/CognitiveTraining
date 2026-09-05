"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icons";

interface AdminChild {
  id: string;
  displayName: string;
  birthMonth: number;
  birthYear: number;
  status: "active" | "archived" | "deleted";
  locale: string;
  createdAt: string;
  account: { id: string; email: string };
  _count: { assessments: number; trainingSessions: number };
}

const PAGE_SIZE = 25;

const MONTHS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

function ageText(birthMonth: number, birthYear: number) {
  const now = new Date();
  let months =
    (now.getFullYear() - birthYear) * 12 + (now.getMonth() + 1 - birthMonth);
  months = Math.max(0, months);
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem} bln`;
  return rem === 0 ? `${years} thn` : `${years} thn ${rem} bln`;
}

export default function AdminChildrenPage() {
  const [children, setChildren] = useState<AdminChild[] | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const load = useCallback(
    async (opts: { nextOffset?: number } = {}) => {
      setLoading(true);
      setError(null);
      try {
        const nextOffset = opts.nextOffset ?? 0;
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(nextOffset),
        });
        if (search.trim()) params.set("search", search.trim());
        if (statusFilter) params.set("status", statusFilter);
        const res = await fetch(`/api/admin/children?${params}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        setChildren(json.data.children);
        setTotal(json.data.total);
        setOffset(nextOffset);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat data anak");
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter],
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  async function setStatus(child: AdminChild, status: "active" | "archived") {
    if (status === child.status) return;
    setBusyId(child.id);
    setRowError(null);
    const prev = children;
    setChildren((curr) =>
      curr?.map((c) => (c.id === child.id ? { ...c, status } : c)) ?? null,
    );
    try {
      const res = await fetch(`/api/admin/children/${child.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Gagal mengubah status");
    } catch (err) {
      setChildren(prev ?? null);
      setRowError(err instanceof Error ? err.message : "Gagal mengubah status");
    } finally {
      setBusyId(null);
    }
  }

  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Manajemen Data Anak</h1>
        <p className="page-subtitle">
          Direktori seluruh profil anak dari semua akun. Anak yang diarsipkan tidak muncul untuk
          sesi baru — data historisnya tetap tersimpan.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama anak…"
          className="input min-w-56 flex-1"
          aria-label="Cari berdasarkan nama anak"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input w-auto"
          aria-label="Filter status"
        >
          <option value="">Semua status</option>
          <option value="active">Aktif</option>
          <option value="archived">Diarsipkan</option>
        </select>
        <span className="tnum text-[13px] font-semibold text-ink-mute">{total} anak</span>
      </div>

      {rowError && (
        <div className="alert-danger" role="alert">
          <Icon name="alert" className="mt-0.5 size-4 shrink-0" />
          <p>{rowError}</p>
          <button onClick={() => setRowError(null)} className="ml-auto font-semibold">
            Tutup
          </button>
        </div>
      )}

      {/* List */}
      {loading && !children ? (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
          <p className="text-sm font-medium text-ink-soft">Memuat data anak…</p>
        </div>
      ) : error && !children ? (
        <div className="alert-danger">{error}</div>
      ) : !children || children.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">Tidak ada profil anak yang cocok.</p>
          <p className="mt-1 text-[13px] text-ink-soft">
            Coba ubah kata kunci pencarian atau filter status.
          </p>
        </div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {children.map((child) => (
            <div
              key={child.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                  child.status === "active"
                    ? "bg-brand-50 text-brand-700"
                    : "bg-canvas-deep text-ink-mute"
                }`}
                aria-hidden="true"
              >
                {child.displayName.charAt(0).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1 basis-52">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-ink">{child.displayName}</p>
                  {child.status === "active" ? (
                    <span className="badge-success">Aktif</span>
                  ) : child.status === "archived" ? (
                    <span className="badge-neutral">Arsip</span>
                  ) : (
                    <span className="badge-danger">Terhapus</span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-ink-mute">
                  {child.account.email} · lahir {MONTHS_ID[child.birthMonth - 1]} {child.birthYear}{" "}
                  ({ageText(child.birthMonth, child.birthYear)})
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-mute">
                  {child._count.assessments} penilaian · {child._count.trainingSessions} sesi
                  latihan
                </p>
              </div>

              <div className="flex shrink-0">
                {child.status === "active" ? (
                  <button
                    onClick={() => void setStatus(child, "archived")}
                    disabled={busyId === child.id}
                    className="btn-danger-ghost px-3 py-1.5 text-[13px]"
                    title={`Arsipkan ${child.displayName}`}
                  >
                    <Icon name="door" className="size-4" />
                    Arsipkan
                  </button>
                ) : child.status === "archived" ? (
                  <button
                    onClick={() => void setStatus(child, "active")}
                    disabled={busyId === child.id}
                    className="btn-secondary px-3 py-1.5 text-[13px]"
                    title={`Aktifkan kembali ${child.displayName}`}
                  >
                    <Icon name="check" className="size-4" />
                    Aktifkan
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => void load({ nextOffset: Math.max(0, offset - PAGE_SIZE) })}
            disabled={!hasPrev || loading}
            className="btn-secondary"
          >
            <Icon name="arrow-left" className="size-4" />
            Sebelumnya
          </button>
          <span className="tnum text-[13px] text-ink-mute">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} dari {total}
          </span>
          <button
            onClick={() => void load({ nextOffset: offset + PAGE_SIZE })}
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
