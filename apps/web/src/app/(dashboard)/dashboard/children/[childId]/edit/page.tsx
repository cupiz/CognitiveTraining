"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";

export default function EditChildPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;

  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState(2016);
  const [birthMonth, setBirthMonth] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - 14 + i);
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  useEffect(() => {
    fetch(`/api/children/${childId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error.message);
        else {
          setDisplayName(json.data.displayName);
          setBirthYear(json.data.birthYear);
          setBirthMonth(json.data.birthMonth);
        }
      })
      .catch(() => setError("Gagal memuat profil anak"))
      .finally(() => setLoading(false));
  }, [childId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, birthYear, birthMonth }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Gagal menyimpan perubahan");
        return;
      }
      router.push(`/dashboard/children/${childId}`);
    } catch {
      setError("Gagal terhubung. Silakan coba lagi.");
    } finally {
      setSaving(false);
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

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link
          href={`/dashboard/children/${childId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <Icon name="arrow-left" className="size-4" />
          Kembali ke profil
        </Link>
        <h1 className="page-title mt-3">Ubah profil</h1>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 px-6 py-6 sm:px-7">
        {error && <div className="alert-danger">{error}</div>}

        <div>
          <label htmlFor="displayName" className="field-label">
            Nama panggilan
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            maxLength={100}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="birthMonth" className="field-label">
              Bulan lahir
            </label>
            <select
              id="birthMonth"
              value={birthMonth}
              onChange={(e) => setBirthMonth(Number(e.target.value))}
              className="input"
            >
              {months.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="birthYear" className="field-label">
              Tahun lahir
            </label>
            <select
              id="birthYear"
              value={birthYear}
              onChange={(e) => setBirthYear(Number(e.target.value))}
              className="input"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-line pt-5">
          <Link href={`/dashboard/children/${childId}`} className="btn-secondary">
            Batal
          </Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
