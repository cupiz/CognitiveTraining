"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { GAMES, gameMeta } from "@/lib/games";
import { AVATARS, avatarDef, avatarIdFromChild } from "@/lib/avatars";
import { AvatarFace } from "@/components/kid/AvatarFace";
import { Mascot } from "@/components/game/Mascot";
import { SceneBackdrop } from "@/components/game/SceneBackdrop";
import { GameArt } from "@/components/games/GameArt";
import { Icon } from "@/components/ui/icons";

interface ChildProfile {
  id: string;
  displayName: string;
  accessibilityJson: Record<string, unknown> | null;
}

const GREETINGS = [
  "Halo, {name}! Siap bermain hari ini?",
  "Halo, {name}! Otak kita mau diajak main nih!",
  "Ayo {name}, pilih petualanganmu!",
  "Halo, {name}! Siapa paling jago hari ini?",
  "Halo, {name}! Mau mulai dari game yang mana?",
];

/** Deterministic per-child pick so the greeting stays stable within a day. */
function pickGreeting(name: string): string {
  const now = new Date();
  const daySeed = now.getFullYear() * 1000 + now.getMonth() * 50 + now.getDate();
  const idx = (daySeed + name.length * 7) % GREETINGS.length;
  return GREETINGS[idx].replace("{name}", name);
}

export default function KidHomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
          <p className="text-sm font-medium text-ink-soft">Menyiapkan ruang bermain…</p>
        </div>
      }
    >
      <KidHome />
    </Suspense>
  );
}

function KidHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlChildId = searchParams.get("childId");

  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState<ChildProfile | null>(null);
  const [avatarId, setAvatarId] = useState<string>("bintang");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  // Per-game visibility (admin-controlled); null while loading or on error → show all.
  const [visibility, setVisibility] = useState<Record<string, boolean> | null>(null);

  // Load the child list first (also resolves ?childId= to a real profile).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/children")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        const list: ChildProfile[] = Array.isArray(json.data) ? json.data : [];
        setChildren(list);
        const wanted = list.find((c) => c.id === urlChildId) ?? (list.length === 1 ? list[0] : null);
        setChild(wanted ?? null);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlChildId]);

  // Game visibility — only show games the admin has enabled.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/games/visibility")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (!json.error && json.data) setVisibility(json.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Avatar from the profile (falls back to the default).
  useEffect(() => {
    if (!child) return;
    const stored = avatarIdFromChild(child.accessibilityJson);
    if (stored) setAvatarId(stored);
  }, [child]);

  const greeting = useMemo(() => (child ? pickGreeting(child.displayName) : ""), [child]);

  const openPlay = useCallback(
    (gameKey: string) => {
      if (!child) return;
      const meta = gameMeta(gameKey);
      router.push(
        `/dashboard/play/${gameKey}?childId=${child.id}&difficulty=${meta.defaultDifficulty}&from=kid`,
      );
    },
    [child, router],
  );

  const chooseAvatar = useCallback(
    async (next: string) => {
      if (!child || savingAvatar) return;
      const previous = avatarId;
      setAvatarId(next);
      setAvatarError(false);
      setSavingAvatar(true);
      try {
        const merged = { ...(child.accessibilityJson ?? {}), avatar: next };
        const res = await fetch(`/api/children/${child.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessibilityJson: merged }),
        });
        if (!res.ok) throw new Error("patch failed");
        // Keep the fresh merged JSON so a later change starts from it.
        setChild((c) => (c ? { ...c, accessibilityJson: merged } : c));
        setPickerOpen(false);
      } catch {
        setAvatarId(previous);
        setAvatarError(true);
      } finally {
        setSavingAvatar(false);
      }
    },
    [child, savingAvatar, avatarId],
  );

  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center gap-3">
        <div className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
        <p className="text-sm font-medium text-ink-soft">Menyiapkan ruang bermain…</p>
      </div>
    );
  }

  // ── No child yet → ask the parent to create one ─────────
  if (children.length === 0) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="card w-full max-w-sm px-6 py-10 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-warning-50 text-warning-600">
            <Icon name="users" className="size-6" />
          </div>
          <p className="mt-4 font-semibold text-ink">Belum ada profil anak</p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Buat profil anak dulu dari halaman Anak supaya bisa masuk ruang bermain.
          </p>
          <button onClick={() => router.push("/dashboard/children/new")} className="btn-primary mt-6 w-full">
            Buat profil anak
          </button>
        </div>
      </div>
    );
  }

  // ── Child not selected yet → quick profile chips ────────
  if (!child) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <div className="card w-full max-w-md px-6 py-10 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Icon name="users" className="size-6" />
          </div>
          <p className="mt-4 text-lg font-bold text-ink">Siapa yang mau bermain?</p>
          <p className="mt-1.5 text-sm text-ink-soft">Pilih profil untuk masuk ruang bermainnya.</p>
          <div className="mt-6 flex flex-col gap-2.5">
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/dashboard/kid?childId=${c.id}`)}
                className="btn-secondary flex items-center justify-center gap-3 py-3"
              >
                <AvatarFace avatar={avatarIdFromChild(c.accessibilityJson)} className="size-9" />
                {c.displayName}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.push("/dashboard/children")}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <Icon name="arrow-left" className="size-4" />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const avatar = avatarDef(avatarId);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="relative min-h-dvh overflow-hidden"
        style={{ background: "linear-gradient(180deg,#fff1e0 0%,#fff8ef 42%,#f6f2e9 100%)" }}
      >
        {/* Soft candy-world decoration behind everything */}
        <SceneBackdrop kind="candy" color="#f3c4d2" soft="#fbe6ec" />

        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-10 sm:px-6">
          {/* Top bar — parents can always step back out */}
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => router.push("/dashboard/children")}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/80 px-3.5 py-2 text-[13px] font-semibold text-ink-soft shadow-sm backdrop-blur transition-colors hover:text-ink"
            >
              <Icon name="arrow-left" className="size-4" />
              Untuk orang tua
            </button>
          </div>

          {/* Hero — mascot greets the child */}
          <div className="mt-2 flex flex-col items-center">
            <div className="relative">
              <Mascot mood="wave" accent="#0d7c68" className="size-28" />
              <span className="pointer-events-none absolute -right-2 top-1 size-3 animate-twinkle rounded-full bg-[#f2c94c]" />
              <span
                className="pointer-events-none absolute -left-1 bottom-6 size-2 animate-twinkle rounded-full bg-[#f2c94c]"
                style={{ animationDelay: "0.7s" }}
              />
            </div>

            <div
              className="relative mt-2 max-w-sm rounded-3xl rounded-tl-md border border-line bg-surface px-5 py-3.5 text-center shadow-pop"
            >
              <p className="text-[17px] font-bold tracking-[-0.01em] text-ink">{greeting}</p>
            </div>

            {/* Avatar — tap to change */}
            <button
              onClick={() => setPickerOpen(true)}
              className="group mt-6 flex flex-col items-center gap-2"
              aria-label="Ganti avatar"
            >
              <span
                className="flex size-24 items-center justify-center rounded-full border-4 border-surface shadow-pop transition-transform group-active:scale-95"
                style={{ backgroundColor: avatar.soft }}
              >
                <AvatarFace avatar={avatarId} className="size-[5.5rem]" />
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-semibold text-ink-soft transition-colors group-hover:text-ink">
                <Icon name="pencil" className="size-3.5" />
                {avatar.label} · ganti
              </span>
            </button>
          </div>

          {/* World map — the enabled games as play islands */}
          <div className="mt-8">
            <div className="flex items-baseline justify-between gap-3">
              <h1 className="text-xl font-extrabold tracking-[-0.02em] text-ink">Pilih petualangan</h1>
              <p className="text-[12px] font-medium text-ink-mute">Level menyesuaikan otomatis</p>
            </div>

            <div className="mt-4 flex flex-col gap-3.5">
              {(visibility ? GAMES.filter((g) => visibility[g.key] !== false) : GAMES).map((meta, i) => {
                const avatarTint = meta.tint;
                return (
                  <motion.button
                    key={meta.key}
                    onClick={() => openPlay(meta.key)}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="flex w-full items-center gap-4 rounded-3xl border border-line/80 bg-surface/90 p-3.5 text-left shadow-sm backdrop-blur transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-pop"
                    aria-label={`Main ${meta.name}`}
                  >
                    <span
                      className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl sm:size-[4.5rem]"
                      style={{ backgroundColor: avatarTint, border: `1.5px solid ${meta.color}22` }}
                    >
                      <span className="absolute -top-1.5 -left-1 flex size-5 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow-sm" style={{ backgroundColor: meta.color }}>
                        {i + 1}
                      </span>
                      <GameArt gameKey={meta.key} className="size-11 sm:size-13" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-extrabold tracking-[-0.01em] text-ink">
                        {meta.name}
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">
                        {meta.description}
                      </span>
                    </span>
                    <span
                      className="flex size-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm transition-transform group-hover:scale-105 sm:size-13"
                      style={{ backgroundColor: meta.color }}
                    >
                      <Icon name="play" className="size-5" />
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {avatarError && (
              <p className="mt-4 text-center text-sm font-medium text-danger-600">
                Gagal menyimpan avatar — coba lagi.
              </p>
            )}
          </div>
        </div>

        {/* Avatar picker */}
        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              key="avatar-scrim"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgb(20 21 25 / 0.45)", backdropFilter: "blur(4px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setPickerOpen(false)}
            >
              <motion.div
                key="avatar-panel"
                className="card w-full max-w-md p-6"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 340, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">Pilih avatarmu</h2>
                  <button
                    onClick={() => setPickerOpen(false)}
                    className="icon-btn"
                    aria-label="Tutup"
                  >
                    <Icon name="x" className="size-4" />
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-4 gap-2.5">
                  {AVATARS.map((a) => {
                    const selected = a.id === avatarId;
                    return (
                      <button
                        key={a.id}
                        onClick={() => void chooseAvatar(a.id)}
                        disabled={savingAvatar}
                        aria-pressed={selected}
                        aria-label={`Avatar ${a.label}`}
                        className={`flex flex-col items-center gap-1 rounded-2xl border-2 px-1 py-2.5 transition-[transform,border-color] ${
                          selected ? "border-brand-600 bg-brand-50" : "border-transparent hover:border-line"
                        } ${savingAvatar ? "opacity-60" : "active:scale-95"}`}
                      >
                        <AvatarFace avatar={a.id} className="size-11" />
                        <span className={`text-[11px] font-bold ${selected ? "text-brand-700" : "text-ink-mute"}`}>
                          {a.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {savingAvatar && (
                  <p className="mt-4 text-center text-[13px] font-medium text-ink-mute">Menyimpan…</p>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
