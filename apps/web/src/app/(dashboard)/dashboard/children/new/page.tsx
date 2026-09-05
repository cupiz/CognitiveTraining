"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/icons";

export default function NewChildPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState(new Date().getFullYear() - 8);
  const [birthMonth, setBirthMonth] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - 14 + i);
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, birthYear, birthMonth, locale: "id" }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error?.message ?? "Gagal membuat profil anak");
        return;
      }
      router.push("/dashboard/children");
    } catch {
      setError("Gagal terhubung. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6">
        <Link href="/dashboard/children" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink">
          <Icon name="arrow-left" className="size-4" />
          Anak
        </Link>
        <h1 className="page-title mt-3">Tambah profil anak</h1>
        <p className="page-subtitle">
          Apa panggilan anak Anda, dan kapan ia lahir?
        </p>
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
            placeholder="mis. Ale"
            maxLength={100}
            autoFocus
          />
          <p className="mt-1.5 text-xs text-ink-mute">
            Dipakai hanya untuk profil ini — dan tampil saat anak bermain.
          </p>
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
          <Link href="/dashboard/children" className="btn-secondary">
            Batal
          </Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Membuat…" : "Buat profil"}
          </button>
        </div>
      </form>
    </div>
  );
}
