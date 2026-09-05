"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { Wordmark } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icons";
import { SoundToggle } from "@/components/game/SoundToggle";
import { ThemeSelector } from "@/components/game/ThemeSelector";
import { setPausedExternal } from "@/lib/game/pause-bus";

/**
 * Shared overlay with a measured entrance/exit: scrim fades, panel springs up.
 * z-index is configurable so a nested confirm can sit above a pause overlay.
 */
function Modal({
  open,
  onClose,
  z = 40,
  children,
}: {
  open: boolean;
  onClose?: () => void;
  z?: number;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        /* No `exit` props: closing a modal must unmount it immediately. Exit
         * animations wait on requestAnimationFrame — if frames stall (tab
         * throttling, low-power mode, a busy main thread) a closing modal can
         * stay frozen on screen and block the game underneath. */
        <motion.div
          key="modal-scrim"
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgb(20 21 25 / 0.45)", backdropFilter: "blur(4px)", zIndex: z }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
        >
          <motion.div
            key="modal-panel"
            className="card w-full max-w-sm p-7 text-center"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 340, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * True when an element we don't own has focus or is open (native dialogs, the
 * Next.js DevTools overlay, aria-modal surfaces…). Escape must be handed to
 * those first instead of toggling our pause modal.
 */
function hasOpenOverlay(): boolean {
  if (typeof document === "undefined") return false;
  const SELECTOR = "dialog, [role='dialog'], [aria-modal='true'], [data-nextjs-dialog]";
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.closest(SELECTOR)) return true;
  return document.querySelector(`dialog[open], [role='dialog'][aria-modal='true'], [data-nextjs-dialog]`) !== null;
}

function GameLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // Whether the exit confirm was opened from the pause modal (stay paused when
  // it's cancelled) or from the top bar (resume when it's cancelled).
  const exitFromPauseRef = useRef(false);
  // Mirror of `isPaused` for computing the next toggle value. Never call the
  // pause bus from inside a state updater — React may discard or re-run
  // updaters (StrictMode, concurrent rendering), which desyncs the modal from
  // the bus and leaves the game paused with no way back in.
  const isPausedRef = useRef(false);

  const childId = searchParams.get("childId");
  const fromKid = searchParams.get("from") === "kid";
  const gameKey = pathname?.split("/").pop()?.replace("_", " ") ?? "";

  // The pause bus is a module singleton; leaving a round while paused (Keluar
  // flow pauses the runner) must not latch it for the NEXT round's countdown.
  useEffect(() => {
    return () => setPausedExternal(false);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) router.push("/login");
      })
      .catch(() => router.push("/login"));
  }, [router]);

  /** Pause UI + actual game runner stay in sync (single source of truth). */
  const applyPause = useCallback((paused: boolean) => {
    isPausedRef.current = paused;
    setIsPaused(paused);
    setPausedExternal(paused);
  }, []);

  const togglePause = useCallback(() => {
    applyPause(!isPausedRef.current);
  }, [applyPause]);

  const cancelExit = useCallback(() => {
    setShowExitConfirm(false);
    if (!exitFromPauseRef.current) applyPause(false);
  }, [applyPause]);

  /** Exit asked from the pause modal → keep paused underneath. */
  const handleExitFromPause = useCallback(() => {
    exitFromPauseRef.current = true;
    setShowExitConfirm(true);
  }, []);

  /** Exit asked from the top bar → pause the runner first. */
  const handleExitFromTopBar = useCallback(() => {
    exitFromPauseRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false); // no pause modal underneath — just the confirm
    setPausedExternal(true);
    setShowExitConfirm(true);
  }, []);

  // Escape: close the topmost surface of ours; ignore when a dialog/overlay we
  // don't own (e.g. Next DevTools) is open or focused, so Escape closes that.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (hasOpenOverlay()) return;
      if (showExitConfirm) {
        cancelExit();
      } else {
        togglePause();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showExitConfirm, cancelExit, togglePause]);

  function confirmExit() {
    // Kid-mode sessions hand the device straight back to the kid home.
    if (fromKid && childId) router.push(`/dashboard/kid?childId=${childId}`);
    else if (childId) router.push(`/dashboard/children/${childId}`);
    else router.push("/dashboard/games");
  }

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-dvh bg-canvas">
      {/* Bilah atas — kontrol ramah orang tua, aksi aman untuk anak */}
      <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-3 sm:px-5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExitFromTopBar}
              className="btn-ghost -ml-1.5"
              aria-label="Keluar dari permainan"
            >
              <Icon name="door" className="size-4.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
            {gameKey && (
              <span className="hidden text-sm font-semibold text-ink-mute md:block">
                {gameKey}
              </span>
            )}
          </div>

          <div className="hidden sm:block">
            <Wordmark className="scale-90" />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={togglePause}
              className="icon-btn border border-line bg-white"
              aria-label={isPaused ? "Lanjutkan" : "Jeda"}
              aria-pressed={isPaused}
            >
              <Icon name={isPaused ? "play" : "pause"} className="size-4.5" />
            </button>
            <SoundToggle />
            <ThemeSelector />
          </div>
        </div>
      </header>

      {/* Konten game — memenuhi layar di bawah bilah */}
      <main className="pt-14">{children}</main>

      {/* Overlay jeda */}
      <Modal open={isPaused} onClose={() => applyPause(false)} z={40}>
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <Icon name="pause" className="size-6" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-ink">Permainan dijeda</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Tarik napas dulu — tekan Escape atau Lanjutkan saat siap.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <motion.button
            onClick={() => applyPause(false)}
            className="btn-primary w-full py-2.5"
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            Lanjutkan
          </motion.button>
          <motion.button
            onClick={handleExitFromPause}
            className="btn-secondary w-full py-2.5"
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            Keluar dari game
          </motion.button>
        </div>
      </Modal>

      {/* Konfirmasi keluar */}
      <Modal open={showExitConfirm} onClose={cancelExit} z={50}>
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
          <Icon name="door" className="size-6" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-ink">Tinggalkan ronde ini?</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
          Kemajuan Anda tersimpan — kapan pun bisa kembali dan bermain lagi.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <motion.button
            onClick={confirmExit}
            className="btn-primary w-full py-2.5"
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            Tinggalkan ronde
          </motion.button>
          <motion.button
            onClick={cancelExit}
            className="btn-secondary w-full py-2.5"
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            Lanjut bermain
          </motion.button>
        </div>
      </Modal>
    </div>
    </MotionConfig>
  );
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-canvas">
          <div className="size-8 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
        </div>
      }
    >
      <GameLayoutContent>{children}</GameLayoutContent>
    </Suspense>
  );
}
