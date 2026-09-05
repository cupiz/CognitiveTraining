"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icons";

interface AdminUser {
  id: string;
  email: string;
  role: "parent" | "admin" | "researcher";
  locale: string;
  emailVerified: string | null;
  createdAt: string;
  _count: { children: number; sessions: number };
}

const PAGE_SIZE = 25;

const ROLE_LABEL: Record<AdminUser["role"], string> = {
  parent: "Orang Tua",
  admin: "Admin",
  researcher: "Peneliti",
};

const ROLE_BADGE: Record<AdminUser["role"], string> = {
  parent: "badge-neutral",
  admin: "badge-brand",
  researcher: "badge-warning",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
        if (roleFilter) params.set("role", roleFilter);
        const res = await fetch(`/api/admin/users?${params}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        setUsers(json.data.users);
        setTotal(json.data.total);
        setOffset(nextOffset);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat pengguna");
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter],
  );

  useEffect(() => {
    void load();
    // Re-fetch when filters change; load reads latest state via closure below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  async function changeRole(user: AdminUser, role: AdminUser["role"]) {
    if (role === user.role) return;
    setBusyId(user.id);
    setRowError(null);
    const prev = users;
    setUsers((curr) => curr?.map((u) => (u.id === user.id ? { ...u, role } : u)) ?? null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Gagal mengubah role");
    } catch (err) {
      setUsers(prev ?? null);
      setRowError(err instanceof Error ? err.message : "Gagal mengubah role");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user: AdminUser) {
    setBusyId(user.id);
    setRowError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Gagal menghapus akun");
      setConfirmDeleteId(null);
      setUsers((curr) => curr?.filter((u) => u.id !== user.id) ?? null);
      setTotal((t) => Math.max(0, t - 1));
      void load({ nextOffset: offset });
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Gagal menghapus akun");
    } finally {
      setBusyId(null);
    }
  }

  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_SIZE < total;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Manajemen Pengguna</h1>
        <p className="page-subtitle">
          Semua akun terdaftar. Ubah role atau hapus akun beserta seluruh datanya (anak, sesi,
          telemetry ikut terhapus permanen).
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-56 flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email…"
            className="input"
            aria-label="Cari berdasarkan email"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input w-auto"
          aria-label="Filter role"
        >
          <option value="">Semua role</option>
          <option value="parent">Orang Tua</option>
          <option value="admin">Admin</option>
          <option value="researcher">Peneliti</option>
        </select>
        <span className="tnum text-[13px] font-semibold text-ink-mute">
          {total} akun
        </span>
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
      {loading && !users ? (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
          <p className="text-sm font-medium text-ink-soft">Memuat pengguna…</p>
        </div>
      ) : error && !users ? (
        <div className="alert-danger">{error}</div>
      ) : !users || users.length === 0 ? (
        <div className="card px-6 py-12 text-center">
          <p className="text-sm font-medium text-ink">Tidak ada akun yang cocok.</p>
          <p className="mt-1 text-[13px] text-ink-soft">Coba ubah kata kunci atau filter role.</p>
        </div>
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {users.map((user) => {
            const isConfirming = confirmDeleteId === user.id;
            return (
              <div
                key={user.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5 ${
                  isConfirming ? "bg-danger-50" : ""
                }`}
              >
                <div className="min-w-0 flex-1 basis-52">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-ink">{user.email}</p>
                    <span className={ROLE_BADGE[user.role]}>{ROLE_LABEL[user.role]}</span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-ink-mute">
                    {user._count.children} anak · {user._count.sessions} sesi aktif · daftar{" "}
                    {formatDate(user.createdAt)}
                  </p>
                </div>

                {!isConfirming ? (
                  <div className="flex shrink-0 items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        void changeRole(user, e.target.value as AdminUser["role"])
                      }
                      disabled={busyId === user.id}
                      className="input w-auto py-1.5 text-[13px]"
                      aria-label={`Ubah role untuk ${user.email}`}
                    >
                      <option value="parent">Orang Tua</option>
                      <option value="admin">Admin</option>
                      <option value="researcher">Peneliti</option>
                    </select>
                    <button
                      onClick={() => setConfirmDeleteId(user.id)}
                      disabled={busyId === user.id}
                      className="icon-btn text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                      title={`Hapus akun ${user.email}`}
                      aria-label={`Hapus akun ${user.email}`}
                    >
                      <Icon name="trash" className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[13px] font-semibold text-danger-700">
                      Hapus permanen?
                    </span>
                    <button
                      onClick={() => void deleteUser(user)}
                      disabled={busyId === user.id}
                      className="btn-danger px-3 py-1.5 text-[13px]"
                    >
                      {busyId === user.id ? "Menghapus…" : "Ya, hapus"}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      disabled={busyId === user.id}
                      className="btn-ghost text-[13px]"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </div>
            );
          })}
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

      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-mute">
        <Icon name="info" className="mt-0.5 size-4 shrink-0" />
        Semua perubahan role dan penghapusan akun tercatat di Audit Log. Kamu tidak bisa mengubah
        role atau menghapus akunmu sendiri dari sini — gunakan akun admin lain sebagai tindakan
        pengaman.
      </p>
    </div>
  );
}
