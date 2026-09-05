"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { AvatarFace } from "@/components/kid/AvatarFace";
import { avatarIdFromChild } from "@/lib/avatars";

interface ChildProfile {
  id: string;
  displayName: string;
  birthMonth: number;
  birthYear: number;
  locale: string;
  status: string;
  createdAt: string;
  accessibilityJson?: Record<string, unknown> | null;
}

const MONTHS = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function ChildrenPage() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/children")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error.message);
        else setChildren(json.data ?? []);
      })
      .catch(() => setError("Gagal memuat daftar anak"))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(childId: string, name: string) {
    if (!window.confirm(`Remove ${name}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/children/${childId}`, { method: "DELETE" });
      if (res.ok) setChildren((prev) => prev.filter((c) => c.id !== childId));
    } catch {
      window.alert("Gagal menghapus profil anak");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Anak</h1>
          <p className="page-subtitle">
            Setiap profil menjaga latihan anak tetap terpisah dan sesuai usia.
          </p>
        </div>
        <Link href="/dashboard/children/new" className="btn-primary">
          <Icon name="plus" className="size-4" />
          Tambah anak
        </Link>
      </div>

      {error && <div className="alert-danger mb-4">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
          <p className="text-sm text-ink-mute">Memuat…</p>
        </div>
      ) : children.length === 0 ? (
        <section className="card flex flex-col items-center px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
            <Icon name="users" className="size-7" strokeWidth={1.6} />
          </span>
          <h2 className="mt-4 text-lg font-bold text-ink">Belum ada anak</h2>
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">
            Tambahkan profil anak pertama untuk memulai rencana latihan kognitif.
          </p>
          <Link href="/dashboard/children/new" className="btn-primary mt-6">
            <Icon name="plus" className="size-4" />
            Tambah anak pertama
          </Link>
        </section>
      ) : (
        <ul className="space-y-3">
          {children.map((child) => (
            <li key={child.id}>
              <div className="card flex items-center gap-4 px-4 py-3.5 transition-shadow hover:shadow-pop sm:px-5">
                <Link
                  href={`/dashboard/children/${child.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  {avatarIdFromChild(child.accessibilityJson) ? (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50">
                      <AvatarFace avatar={avatarIdFromChild(child.accessibilityJson)} className="size-9" />
                    </span>
                  ) : (
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base font-bold text-brand-700">
                      {child.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">
                      {child.displayName}
                    </span>
                    <span className="block text-[13px] text-ink-mute">
                      Lahir {MONTHS[child.birthMonth] ?? ""} {child.birthYear}
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/dashboard/kid?childId=${child.id}`}
                    className="btn-primary px-2.5 py-1.5 text-[13px]"
                    title="Mode anak"
                    aria-label={`Mode anak untuk ${child.displayName}`}
                  >
                    <Icon name="play" className="size-3.5" />
                    <span className="hidden sm:inline">Mode anak</span>
                  </Link>
                  <Link
                    href={`/dashboard/children/${child.id}`}
                    className="icon-btn"
                    title="Lihat profil"
                    aria-label={`Lihat ${child.displayName}`}
                  >
                    <Icon name="arrow-right" className="size-4" />
                  </Link>
                  <Link
                    href={`/dashboard/children/${child.id}/edit`}
                    className="icon-btn"
                    title="Ubah profil"
                    aria-label={`Ubah ${child.displayName}`}
                  >
                    <Icon name="pencil" className="size-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(child.id, child.displayName)}
                    className="icon-btn hover:bg-danger-50 hover:text-danger-600"
                    title="Hapus profil"
                    aria-label={`Hapus ${child.displayName}`}
                  >
                    <Icon name="trash" className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
