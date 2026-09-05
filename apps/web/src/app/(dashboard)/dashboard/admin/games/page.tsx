"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icons";

interface AdminGame {
  key: string;
  name: string;
  domain: string;
  color: string;
  tint: string;
  deep: string;
  family: "classic" | "flagship";
  visible: boolean;
}

export default function AdminGamesPage() {
  const [games, setGames] = useState<AdminGame[] | null>(null);
  const [loadingError, setLoadingError] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/games")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error || !Array.isArray(json.data?.games)) {
          setLoadingError(true);
          return;
        }
        setGames(json.data.games);
      })
      .catch(() => {
        if (!cancelled) setLoadingError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(game: AdminGame) {
    if (savingKey) return;
    const next = !game.visible;
    setSavingKey(game.key);
    setSaveError(null);
    // Optimistic update, revert on failure.
    setGames((prev) =>
      prev ? prev.map((g) => (g.key === game.key ? { ...g, visible: next } : g)) : prev,
    );
    try {
      const res = await fetch(`/api/admin/games/${game.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: next }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error?.message ?? "Gagal menyimpan");
      }
      const json = await res.json();
      setGames((prev) =>
        prev
          ? prev.map((g) => (g.key === game.key ? { ...g, visible: json.data.visible } : g))
          : prev,
      );
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan perubahan");
      setGames((prev) =>
        prev ? prev.map((g) => (g.key === game.key ? { ...g, visible: !next } : g)) : prev,
      );
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="page-title">Kelola Permainan</h1>
        <p className="page-subtitle">
          Atur permainan mana yang muncul untuk anak. Game yang disembunyikan tidak tampil di
          peta dunia anak maupun halaman Permainan orang tua — tetapi tetap berjalan normal di
          alur penilaian dan pelatihan.
        </p>
      </div>

      {loadingError ? (
        <div className="card flex items-start gap-3 px-5 py-4">
          <Icon name="alert" className="mt-0.5 size-5 shrink-0 text-danger-600" />
          <p className="text-sm text-ink-soft">
            Gagal memuat daftar permainan. Coba muat ulang halaman.
          </p>
        </div>
      ) : !games ? (
        <div className="flex items-center justify-center gap-3 py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
          <p className="text-sm font-medium text-ink-soft">Memuat permainan…</p>
        </div>
      ) : (
        <>
          {saveError && (
            <div className="card mb-4 flex items-start gap-3 border-danger-200 bg-danger-50 px-5 py-3.5">
              <Icon name="alert" className="mt-0.5 size-4.5 shrink-0 text-danger-600" />
              <p className="text-sm font-medium text-danger-700">{saveError}</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {games.map((game) => {
              const visible = game.visible;
              return (
                <article
                  key={game.key}
                  className={`card flex items-center gap-4 px-5 py-4 transition-opacity ${visible ? "" : "opacity-80"}`}
                >
                  {/* Identity */}
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold"
                    style={{ backgroundColor: game.tint, color: game.deep }}
                    aria-hidden="true"
                  >
                    {game.name.charAt(0)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-[15px] font-bold tracking-[-0.01em] text-ink">
                        {game.name}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${
                          game.family === "flagship"
                            ? "bg-brand-50 text-brand-700"
                            : "bg-canvas-deep text-ink-mute"
                        }`}
                      >
                        {game.family === "flagship" ? "Flagship" : "Klasik"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] text-ink-soft">{game.domain}</p>
                  </div>

                  {/* Status + toggle */}
                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`hidden text-[13px] font-semibold sm:block ${
                        visible ? "text-success-700" : "text-ink-mute"
                      }`}
                    >
                      {visible ? "Tampil" : "Tersembunyi"}
                    </span>
                    <button
                      onClick={() => void toggle(game)}
                      disabled={savingKey !== null}
                      aria-pressed={visible}
                      aria-label={`${visible ? "Sembunyikan" : "Tampilkan"} ${game.name}`}
                      title={visible ? "Sembunyikan dari anak" : "Tampilkan untuk anak"}
                      className={`relative h-7 w-12 rounded-full transition-colors duration-200 ${
                        visible ? "bg-success-600" : "bg-line-strong"
                      } ${savingKey !== null ? "cursor-wait opacity-60" : "cursor-pointer"}`}
                    >
                      <span
                        className={`absolute top-1 size-5 rounded-full bg-white shadow-sm transition-all duration-200 ${
                          visible ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="mt-5 flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-mute">
            <Icon name="info" className="mt-0.5 size-4 shrink-0" />
            Kelima game klasik disembunyikan secara bawaan — mereka adalah jangkar pengukuran
            untuk penilaian (H1–H5) dan tetap dipakai otomatis di balik layar. Gunakan toggle di
            atas hanya jika kamu ingin menampilkannya lagi.
          </p>
        </>
      )}
    </div>
  );
}