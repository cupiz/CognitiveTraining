"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Gagal masuk. Periksa kembali email dan kata sandi.");
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
          Selamat datang kembali
        </h1>
        <p className="mt-1 text-sm text-ink-soft">Masuk ke akun orang tua Anda</p>

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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Memasuki…" : "Masuk"}
          </button>
        </form>

        <div className="mt-4 text-right text-sm">
          <Link href="/forgot-password" className="font-medium text-brand-700 hover:text-brand-800 hover:underline">
            Lupa kata sandi?
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Belum punya akun?{" "}
        <Link href="/signup" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
          Buat akun orang tua
        </Link>
      </p>
    </div>
  );
}
