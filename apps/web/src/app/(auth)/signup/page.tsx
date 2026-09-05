"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Kata sandi tidak sama");
      return;
    }

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Pendaftaran gagal. Silakan coba lagi.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Gagal terhubung. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-up">
      <div className="card px-7 py-9 sm:px-9">
        <h1 className="text-[1.45rem] font-bold tracking-[-0.02em] text-ink">
          Buat akun Anda
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Akun orang tua dipakai untuk mengelola profil dan latihan anak Anda.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {error && (
            <div className="alert-danger" role="alert">
              {error}
            </div>
          )}

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

          <div>
            <label htmlFor="password" className="field-label">
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Minimal 8 karakter"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="field-label">
              Ulangi kata sandi
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Membuat akun…" : "Buat akun"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
