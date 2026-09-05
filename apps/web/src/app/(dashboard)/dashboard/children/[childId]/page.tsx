"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  updatedAt: string;
  accessibilityJson?: Record<string, unknown> | null;
}

const MONTHS = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/children/${childId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error.message);
        else setChild(json.data);
      })
      .catch(() => setError("Gagal memuat profil anak"))
      .finally(() => setLoading(false));
  }, [childId]);

  async function handleDelete() {
    if (!child) return;      if (!window.confirm(`Hapus profil ${child.displayName}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/children/${childId}`, { method: "DELETE" });
      if (res.ok) router.push("/dashboard/children");
    } catch {
      window.alert("Gagal menghapus profil anak");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-16">
        <div className="size-5 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
        <p className="text-sm text-ink-mute">Memuat…</p>
      </div>
    );
  }

  if (error || !child) {
    return (
      <section className="card mx-auto max-w-xl px-6 py-12 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
          <Icon name="alert" className="size-6" />
        </span>
        <p className="mt-4 text-ink">{error ?? "Profil anak tidak ditemukan"}</p>
        <Link href="/dashboard/children" className="btn-secondary mt-6">
          <Icon name="arrow-left" className="size-4" />
          Kembali ke daftar anak
        </Link>
      </section>
    );
  }

  const age = (() => {
    const now = new Date();
    let a = now.getFullYear() - child.birthYear;
    if (now.getMonth() + 1 < child.birthMonth) a--;
    return a;
  })();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/children"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <Icon name="arrow-left" className="size-4" />
        Anak
      </Link>

      <div className="card mt-4 overflow-hidden">
        {/* Profile head with soft tint */}
        <div className="flex items-start justify-between gap-4 border-b border-line bg-gradient-to-b from-brand-50/70 to-surface px-6 py-6">
          <div className="flex items-center gap-4">
            {avatarIdFromChild(child.accessibilityJson) ? (
              <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-surface shadow-pop">
                <AvatarFace avatar={avatarIdFromChild(child.accessibilityJson)} className="size-14" />
              </span>
            ) : (
              <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-600 text-xl font-bold text-white shadow-pop">
                {child.displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <h1 className="text-[1.4rem] font-bold tracking-[-0.02em] text-ink">
                {child.displayName}
              </h1>
              <p className="mt-0.5 text-sm text-ink-soft">
                Lahir {MONTHS[child.birthMonth]} {child.birthYear} · Usia {age} tahun
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/dashboard/children/${childId}/edit`}
              className="btn-secondary px-3 py-1.5 text-[13px]"
            >
              <Icon name="pencil" className="size-3.5" />
              Ubah
            </Link>
            <button onClick={handleDelete} className="btn-danger-ghost px-3 py-1.5 text-[13px]">
              <Icon name="trash" className="size-3.5" />
              Hapus
            </button>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 px-6 py-5 sm:grid-cols-4">
          <div>
            <dt className="eyebrow">Status</dt>
            <dd className="mt-1 text-sm font-semibold capitalize text-ink">{child.status}</dd>
          </div>
          <div>
            <dt className="eyebrow">Lokale</dt>
            <dd className="mt-1 text-sm font-semibold text-ink">{child.locale}</dd>
          </div>
          <div>
            <dt className="eyebrow">Dibuat</dt>
            <dd className="mt-1 text-sm text-ink">
              {new Date(child.createdAt).toLocaleDateString("id-ID")}
            </dd>
          </div>
          <div>
            <dt className="eyebrow">Diperbarui</dt>
            <dd className="mt-1 text-sm text-ink">
              {new Date(child.updatedAt).toLocaleDateString("id-ID")}
            </dd>
          </div>
        </dl>
      </div>

      <section className="card mt-4 px-6 py-5">
        <h2 className="text-[15px] font-semibold text-ink">Latihan</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Serahkan perangkat ke {child.displayName} dan biarkan mereka memilih
          petualangan lewat ruang bermain — atau pilihkan game + level langsung dari
          halaman Permainan.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href={`/dashboard/kid?childId=${childId}`}
            className="btn-primary px-4 py-2"
          >
            <Icon name="play" className="size-4" />
            Mode anak
          </Link>
          <Link
            href={`/dashboard/games?childId=${childId}`}
            className="btn-secondary px-4 py-2"
          >
            <Icon name="grid" className="size-4" />
            Pilih game (orang tua)
          </Link>
        </div>
      </section>
    </div>
  );
}
