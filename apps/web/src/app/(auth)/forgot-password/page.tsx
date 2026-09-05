"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Selalu tampilkan sukses agar email tidak mudah ditebak
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="fade-up">
        <div className="card px-7 py-10 text-center sm:px-9">
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-success-50 text-success-600">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4.5 12.5 5 5 10-11" />
            </svg>
          </div>
          <h1 className="text-[1.45rem] font-bold tracking-[-0.02em] text-ink">
            Cek email Anda
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-soft">
            Jika akun dengan{" "}
            <span className="font-semibold text-ink">{email}</span> terdaftar, tautan
            pengaturan ulang kata sandi sudah kami kirim.
          </p>
          <Link href="/login" className="btn-secondary mt-7 w-full">
            Kembali ke halaman masuk
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <div className="card px-7 py-9 sm:px-9">
        <h1 className="text-[1.45rem] font-bold tracking-[-0.02em] text-ink">
          Atur ulang kata sandi
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Kami akan mengirimkan tautan aman ke email Anda.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="field-label">
              Alamat email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="orangtua@contoh.com"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Mengirim…" : "Kirim tautan reset"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
          Kembali ke halaman masuk
        </Link>
      </p>
    </div>
  );
}
