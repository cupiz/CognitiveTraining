"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import type { CognitiveGame, GameSummary, GameContext, GamePhase, TrialClock } from "@cog/game-core";
import { GameRunner, captureDeviceContext } from "@cog/game-core";
import { createInputHandlers } from "@/lib/game/input-normalizer";
import { subscribePause } from "@/lib/game/pause-bus";
import { HttpTelemetrySender } from "@/lib/game/telemetry-sender";
import { getTheme, getSavedTheme, onThemeChange } from "@/lib/game/themes";
import {
  playCountdown,
  playGo,
  playGameComplete,
  playMascotCheer,
  playMascotEncourage,
  resumeAudio,
} from "@/lib/game/sound-effects";
import { gameMeta } from "@/lib/games";
import { howToFor } from "@/lib/game/howto";
import { HowToPreview } from "./HowToPreview";
import { ArenaScaler } from "./ArenaScaler";
import { GameLoading } from "./GameLoading";
import { GameError } from "./GameError";
import { GameResult } from "./GameResult";
import { ConfettiCanvas } from "./ConfettiCanvas";
import { SceneBackdrop } from "./SceneBackdrop";
import { Mascot, type MascotMood } from "./Mascot";
import { feedbackFromState } from "@/lib/game/feedback";
import { hexToRgba } from "./GameFrame";

interface GameShellProps {
  game: CognitiveGame;
  config: {
    difficulty: number;
    seed: number;
    isPractice: boolean;
    maxTrials?: number;
    practiceTrials: number;
    extra?: Record<string, unknown>;
  };
  ids: { sessionId: string; gameRunId: string };
  onFinish: (summary: GameSummary) => void;
  onQuit?: () => void;
  /** Called once when the game runner actually starts (after countdown). */
  onStarted?: () => void;
  /** Called when the round completes and telemetry has been flushed to the server. */
  onRoundComplete?: (summary: GameSummary) => void;
  renderComponent?: React.ComponentType<{
    renderState: Record<string, unknown>;
    onCellTap: (i: number) => void;
  }>;
}

type ShellState = "loading" | "ready" | "playing" | "finished" | "error";

export function GameShell({
  game,
  config,
  ids,
  onFinish,
  onQuit,
  onStarted,
  onRoundComplete,
  renderComponent: RenderComponent,
}: GameShellProps) {
  const [state, setState] = useState<ShellState>("loading");
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [renderState, setRenderState] = useState<Record<string, unknown>>({});
  // Time left in the current response window — drives the trial progress bar.
  const [trialClock, setTrialClock] = useState<TrialClock | null>(null);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  // Pre-game "how to play" gate: the countdown only starts after the kid taps "Mulai".
  const [showHowTo, setShowHowTo] = useState(true);
  const [themeId, setThemeId] = useState(getSavedTheme());
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [isPausedUi, setIsPausedUi] = useState(false);
  const [externalPaused, setExternalPaused] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);
  // Live mascot reaction to right/wrong answers (see feedbackFromState).
  const [mascotOutcome, setMascotOutcome] = useState<{ mood: MascotMood; key: string } | null>(null);
  const lastOutcomeKeyRef = useRef("");

  const runnerRef = useRef<GameRunner | null>(null);
  const animFrameRef = useRef<number>(0);
  // Mirror of pausedNow for the countdown interval below (refs stay readable
  // inside the long-lived setInterval closure).
  const pausedRef = useRef(false);
  // Latest callbacks without re-running the start/finish effects.
  const callbacksRef = useRef({ onStarted, onRoundComplete });
  callbacksRef.current = { onStarted, onRoundComplete };

  const meta = gameMeta(game.key);
  const theme = getTheme(themeId);

  // Live theme switching (ThemeSelector lives outside the arena)
  useEffect(() => onThemeChange((id) => setThemeId(id)), []);

  // ── Initialize game ────────────────────────────────────
  useEffect(() => {
    try {
      const context: GameContext = {
        sessionId: ids.sessionId,
        gameRunId: ids.gameRunId,
        gameKey: game.key as never,
        gameVersion: game.version,
        difficulty: config.difficulty,
        seed: config.seed,
        isPractice: config.isPractice,
        maxTrials: config.maxTrials,
        practiceTrials: config.practiceTrials,
        deviceContext: captureDeviceContext(),
        extra: config.extra ?? {},
        startedAt: performance.now(),
        sendTelemetry: new HttpTelemetrySender(),
      };

      game.validateConfig(game.getConfig(config.difficulty));
      const runner = new GameRunner(game, context);
      runnerRef.current = runner;
      setState("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyiapkan permainan");
      setState("error");
    }
  }, [game, config, ids]);

  // ── Start game with countdown (after the how-to screen is dismissed) ──
  useEffect(() => {
    if (state !== "ready" || showHowTo) return;
    resumeAudio();

    let count = 3;
    setCountdown(count);
    const timer = setInterval(() => {
      // Hold the countdown while paused — the game must not start (and the
      // runner must not fire onStarted) behind the pause modal.
      if (pausedRef.current) return;
      count--;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        playGo();
        runnerRef.current?.start();
        callbacksRef.current.onStarted?.();
        setState("playing");
        setPhase("playing");
      } else {
        playCountdown();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [state, showHowTo]);

  // ── Render loop ────────────────────────────────────────
  useEffect(() => {
    if (state !== "playing") return;

    function tick() {
      const runner = runnerRef.current;
      if (!runner) return;
      setPhase(runner.getPhase());
      const next = runner.getRenderState();
      setRenderState(next);
      // The trial clock reads the wall clock, so freeze the display while
      // paused (the underlying timer is frozen with the game).
      if (!pausedRef.current) setTrialClock(runner.getTrialClock());

      // React to right/wrong answers — only when the outcome actually changes.
      const sig = feedbackFromState(game.key, next);
      const outcomeKey = sig.active ? `${sig.correct ? "c" : "w"}:${sig.key}` : "";
      if (outcomeKey !== lastOutcomeKeyRef.current) {
        lastOutcomeKeyRef.current = outcomeKey;
        if (outcomeKey) {
          setMascotOutcome({ mood: sig.correct ? "cheer" : "think", key: outcomeKey });
          // Voice the mascot's reaction — happy blip or soft encouragement.
          if (sig.correct) playMascotCheer();
          else playMascotEncourage();
        } else {
          setMascotOutcome(null);
        }
      }

      animFrameRef.current = window.setTimeout(tick, 100);
    }

    animFrameRef.current = window.setTimeout(tick, 100);
    return () => clearTimeout(animFrameRef.current);
  }, [state]);

  // ── Pause: tab hidden, or the layout's pause modal (pause bus) ──
  useEffect(() => {
    function handleVisibility() {
      setTabHidden(document.hidden);
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Bus replays current state on subscribe, so a shell that mounts while the
  // pause modal is open (during boot) starts paused, not running behind it.
  useEffect(() => subscribePause(setExternalPaused), []);

  const pausedNow = externalPaused || tabHidden;

  // Drive the runner (pause/resume) and the in-arena overlay. The `state` dep
  // catches the countdown → playing edge: if paused while counting down, the
  // runner is paused right after it starts.
  useEffect(() => {
    pausedRef.current = pausedNow;
    setIsPausedUi(pausedNow);
    const runner = runnerRef.current;
    if (!runner) return;
    if (pausedNow) {
      runner.pause();
    } else {
      runner.resume();
    }
  }, [pausedNow, state]);

  // ── Finish game ────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    const runner = runnerRef.current;
    if (!runner) return;
    cancelAnimationFrame(animFrameRef.current);
    const result = await runner.finish();
    setSummary(result);
    setState("finished");
    // Telemetry is flushed inside runner.finish(), so the server now has all
    // events — safe for the parent to finalize the run and compute metrics.
    callbacksRef.current.onRoundComplete?.(result);
  }, []);

  useEffect(() => {
    if (phase === "finished" && state === "playing") {
      playGameComplete();
      setConfettiTrigger((n) => n + 1);
      void handleFinish();
    }
  }, [phase, state, handleFinish]);

  const inputHandlers = createInputHandlers((input) => {
    runnerRef.current?.handleInput(input);
  });

  // ── Arena shell (shared across states) ─────────────────

  const vars = theme.vars;

  return (
    <MotionConfig reducedMotion="user">
    <div
      className="relative flex h-full min-h-0 flex-col overflow-hidden"
      style={{
        ...vars,
        backgroundColor: "var(--game-bg)",
        backgroundImage: `radial-gradient(80% 55% at 50% -5%, ${hexToRgba(meta.color, 0.09)}, transparent 70%)`,
        transition: "background-color 300ms ease",
      }}
    >
      {/* Identity edge */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1"
        style={{ background: `linear-gradient(90deg, transparent, ${meta.color} 18%, ${meta.color} 82%, transparent)` }}
      />

      {/* Trial time bar — time left to answer in the current window */}
      {state === "playing" && trialClock && (
        <div
          className="pointer-events-none absolute inset-x-4 top-2.5 z-20 h-1.5 overflow-hidden rounded-full"
          style={{ backgroundColor: "var(--game-line)", opacity: 0.9 }}
          role="progressbar"
          aria-label="Sisa waktu menjawab"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(
            Math.max(0, Math.min(100, (trialClock.remainingMs / Math.max(1, trialClock.totalMs)) * 100)),
          )}
        >
          <TrialBarFill clock={trialClock} />
        </div>
      )}

      {/* Decorative world behind the arena */}
      <SceneBackdrop kind={theme.scene.kind} color={theme.scene.color} soft={theme.scene.soft} />

      {/* Confetti overlay */}
      <ConfettiCanvas trigger={confettiTrigger} />

      {/* Pre-game how-to screen (every game shows instructions before starting) */}
      {state === "ready" && showHowTo && (
        <motion.div
          key="howto-overlay"
          className="absolute inset-0 z-20 flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            role="dialog"
            aria-label={`Cara main ${meta.name}`}
            className="relative max-h-full w-full max-w-sm overflow-y-auto overscroll-contain rounded-3xl border px-5 pb-5 pt-6 text-center shadow-pop backdrop-blur-md sm:max-w-md sm:px-7 sm:pb-6 sm:pt-8 md:max-w-lg xl:max-w-xl"
            style={{
              backgroundColor: "var(--game-surface-2)",
              borderColor: "var(--game-line)",
            }}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Accent top edge */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1.5"
              style={{ background: `linear-gradient(90deg, transparent, ${meta.color} 20%, ${meta.color} 80%, transparent)` }}
            />

            <div className="mx-auto -mt-1 flex justify-center">
              <Mascot mood="wave" accent={meta.color} className="size-16 sm:size-20" />
            </div>
            <p
              className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.18em] sm:text-xs"
              style={{ color: meta.color }}
            >
              {meta.domain}
            </p>
            <h2 className="mt-0.5 text-xl font-extrabold tracking-[-0.02em] sm:text-2xl" style={{ color: "var(--game-ink)" }}>
              Cara main {meta.name}
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed sm:text-[15px]" style={{ color: "var(--game-ink-mute)" }}>
              {meta.description}
            </p>

            {/* Mini animated preview — kids see the action before starting */}
            <div className="mt-3">
              <HowToPreview gameKey={game.key} accent={meta.color} />
            </div>

            <ul className="mt-3 flex flex-col gap-2 text-left sm:mt-4 sm:gap-2.5">
              {howToFor(game.key).steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold sm:size-6 sm:text-xs"
                    style={{ backgroundColor: hexToRgba(meta.color, 0.14), color: meta.color }}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span className="text-[14px] font-semibold leading-snug sm:text-[15px]" style={{ color: "var(--game-ink)" }}>
                    {step}
                  </span>
                </li>
              ))}
            </ul>

            {!config.isPractice && config.practiceTrials > 0 && (
              <p className="mt-3 text-[12px] font-medium sm:text-[13px]" style={{ color: "var(--game-ink-mute)" }}>
                Kamu coba {config.practiceTrials} ronde latihan dulu — setelah itu baru skor dihitung.
              </p>
            )}

            <button
              onClick={() => setShowHowTo(false)}
              className="mt-4 w-full rounded-2xl py-3 text-[17px] font-extrabold text-white shadow-lg transition-transform active:scale-[0.97] sm:py-3.5 sm:text-lg"
              style={{ backgroundColor: meta.color, boxShadow: `0 10px 22px ${hexToRgba(meta.color, 0.35)}` }}
            >
              Mulai main!
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* Countdown (shown after the how-to gate and during game-internal countdowns) */}
      {((state === "ready" && !showHowTo) || (state === "playing" && phase === "countdown")) && (
        <motion.div
          key="countdown-overlay"
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          >
            <Mascot mood="wave" accent={meta.color} className="size-20" />
          </motion.div>
          <motion.span
            key={countdown}
            className="flex size-28 items-center justify-center rounded-full text-6xl font-bold tabular-nums"
            style={{
              color: meta.color,
              backgroundColor: hexToRgba(meta.color, 0.1),
              boxShadow: `inset 0 0 0 3px ${hexToRgba(meta.color, 0.4)}`,
            }}
            initial={{ scale: 1.6, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 17 }}
          >
            {countdown}
          </motion.span>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--game-ink-mute)" }}>
            Siap-siap
          </p>
        </motion.div>
      )}

      {/* Content column */}
      <div className="relative flex min-h-0 flex-1 px-4 py-8">
        {state === "loading" ? (
          <div className="flex h-full w-full items-center justify-center">
            <GameLoading gameName={meta.name} accent={meta.color} />
          </div>
        ) : state === "ready" ? null : state === "error" ? (
          <div className="flex h-full w-full items-center justify-center">
            <GameError message={error ?? "Unknown error"} onRetry={() => window.location.reload()} />
          </div>
        ) : state === "finished" && summary ? (
          <div className="flex h-full w-full items-center justify-center">
            <GameResult summary={summary} accent={meta.color} onContinue={() => onFinish(summary)} onQuit={onQuit} />
          </div>
        ) : (
          <>
            {/* In-arena paused overlay (tab hidden, or pause modal over the arena) */}
            <AnimatePresence>
              {isPausedUi && (
                <motion.div
                  key="arena-paused"
                  className="absolute inset-0 z-30 flex items-center justify-center bg-black/25 backdrop-blur-[2px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  // No `exit`: the overlay must clear the moment play resumes,
                  // even if animation frames are stalled (see play/layout Modal).
                  transition={{ duration: 0.18 }}
                >
                  <motion.div
                    className="flex flex-col items-center text-center"
                    initial={{ scale: 0.92, y: 8 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <Mascot mood="think" accent={meta.color} className="size-14" />
                    <p className="mt-3 text-xl font-bold" style={{ color: "var(--game-ink)" }}>
                      Dijeda
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--game-ink-mute)" }}>
                      Kembali ke permainan…
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Arena fills the screen on desktop, keeps its phone size on mobile. */}
            <ArenaScaler>
              {RenderComponent ? (
                <RenderComponent
                  renderState={renderState}
                  onCellTap={(cellIndex) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const event: any = { type: "pointer_down", x: 0, y: 0, tClient: performance.now(), cellIndex };
                    runnerRef.current?.handleInput(event);
                  }}
                />
              ) : (
                <GenericFallback
                  phase={phase}
                  renderState={renderState}
                  gameKey={game.key}
                  handlers={inputHandlers}
                />
              )}
            </ArenaScaler>
          </>
        )}
      </div>

      {/* Live mascot companion — cheers on correct answers, thinks on misses */}
      {state === "playing" && !isPausedUi && (
        <motion.div
          key={mascotOutcome?.key ?? "idle"}
          className="pointer-events-none absolute bottom-5 right-4 z-20"
          initial={{ scale: 0, rotate: -12, y: 8 }}
          animate={{ scale: 1, rotate: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 340, damping: 14 }}
        >
          <Mascot
            mood={mascotOutcome?.mood ?? "happy"}
            accent={meta.color}
            className={mascotOutcome ? "size-16" : "size-11"}
          />
        </motion.div>
      )}
    </div>
    </MotionConfig>
  );
}

/** Fill of the trial time bar: green → amber → red as the window drains. */
function TrialBarFill({ clock }: { clock: TrialClock }) {
  const pct = Math.max(0, Math.min(100, (clock.remainingMs / Math.max(1, clock.totalMs)) * 100));
  const color = pct > 50 ? "#10b981" : pct > 20 ? "#f59e0b" : "#ef4444";
  return (
    <div
      className="h-full rounded-full"
      style={{ width: `${pct}%`, backgroundColor: color, transition: "background-color 300ms ease" }}
    />
  );
}

/** Fallback when no custom renderer is registered (raw state) */function GenericFallback({
  phase,
  renderState,
  gameKey,
  handlers,
}: {
  phase: GamePhase;
  renderState: Record<string, unknown>;
  gameKey: string;
  handlers: React.DOMAttributes<HTMLDivElement>;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center" {...handlers}>
      <p className="text-sm font-semibold" style={{ color: "var(--game-ink)" }}>
        {phase === "practice" ? "Ronde latihan" : gameKey.replace(/_/g, " ")}
      </p>
      <pre className="max-w-full overflow-auto rounded-xl border p-4 text-left text-xs" style={{ borderColor: "var(--game-line)", color: "var(--game-ink-mute)" }}>
        {JSON.stringify(renderState, null, 2)}
      </pre>
    </div>
  );
}
