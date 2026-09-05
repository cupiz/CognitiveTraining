"use client";

import { use, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GameShell } from "@/components/game";
import { MemoryMatrix, TargetWatch, QuickMatch, StopSignal, RuleSwitch, SpiceStall, RedLight, CourierMap, LighthouseKeeper, SushiExpress, CrystalPalace, TrainNBack, DualGarden, CrystalTower, WideView } from "@/components/games";
import { MemoryMatrixGame } from "@cog/game-memory-matrix";
import { TargetWatchGame } from "@cog/game-target-watch";
import { QuickMatchGame } from "@cog/game-quick-match";
import { StopSignalGame } from "@cog/game-stop-signal";
import { RuleSwitchGame } from "@cog/game-rule-switch";
import { SpiceStallGame } from "@cog/game-spice-stall";
import { RedLightGame } from "@cog/game-red-light";
import { CourierMapGame } from "@cog/game-courier-map";
import { LighthouseKeeperGame } from "@cog/game-lighthouse-keeper";
import { SushiExpressGame } from "@cog/game-sushi-express";
import { CrystalPalaceGame } from "@cog/game-crystal-palace";
import { TrainNBackGame } from "@cog/game-train-n-back";
import { DualGardenGame } from "@cog/game-dual-garden";
import { CrystalTowerGame } from "@cog/game-crystal-tower";
import { WideViewGame } from "@cog/game-wide-view";
import type { CognitiveGame, GameSummary } from "@cog/game-core";
import type { MMRenderState } from "@cog/game-memory-matrix";
import type { TWRenderState } from "@cog/game-target-watch";
import type { QMRenderState } from "@cog/game-quick-match";
import type { SSRenderState } from "@cog/game-stop-signal";
import type { RSRenderState } from "@cog/game-rule-switch";
import type { SSRenderState as SpiceRenderState } from "@cog/game-spice-stall";
import type { RLRenderState } from "@cog/game-red-light";
import type { CMRenderState } from "@cog/game-courier-map";
import type { LKRenderState } from "@cog/game-lighthouse-keeper";
import type { SXRenderState } from "@cog/game-sushi-express";
import type { CPRenderState } from "@cog/game-crystal-palace";
import type { TNBRenderState } from "@cog/game-train-n-back";
import type { DGRenderState } from "@cog/game-dual-garden";
import type { CTRenderState } from "@cog/game-crystal-tower";
import type { WVRenderState } from "@cog/game-wide-view";
import { Icon } from "@/components/ui/icons";
import {
  createGameRun,
  startGameRun,
  finishGameRun,
  type ActiveRun,
} from "@/lib/game/session";

// Fresh instance per play (avoids stale state across games)
const GAME_FACTORIES: Record<string, () => CognitiveGame> = {
  memory_matrix: () => new MemoryMatrixGame(),
  target_watch: () => new TargetWatchGame(),
  quick_match: () => new QuickMatchGame(),
  stop_signal: () => new StopSignalGame(),
  rule_switch: () => new RuleSwitchGame(),
  spice_stall: () => new SpiceStallGame(),
  red_light: () => new RedLightGame(),
  courier_map: () => new CourierMapGame(),
  lighthouse_keeper: () => new LighthouseKeeperGame(),
  sushi_express: () => new SushiExpressGame(),
  crystal_palace: () => new CrystalPalaceGame(),
  train_n_back: () => new TrainNBackGame(),
  dual_garden: () => new DualGardenGame(),
  crystal_tower: () => new CrystalTowerGame(),
  wide_view: () => new WideViewGame(),
};

const GAME_RENDERERS: Record<
  string,
  React.ComponentType<{ renderState: Record<string, unknown>; onCellTap: (i: number) => void }>
> = {
  memory_matrix: (props) => (
    <MemoryMatrix renderState={props.renderState as unknown as MMRenderState} onCellTap={props.onCellTap} />
  ),
  target_watch: (props) => (
    <TargetWatch
      renderState={props.renderState as unknown as TWRenderState}
      onTap={() => props.onCellTap(0)}
    />
  ),
  quick_match: (props) => (
    <QuickMatch
      renderState={props.renderState as unknown as QMRenderState}
      onSelectOption={(idx) => props.onCellTap(idx)}
    />
  ),
  stop_signal: (props) => (
    <StopSignal
      renderState={props.renderState as unknown as SSRenderState}
      onRespond={(dir) => props.onCellTap(dir === "left" ? 0 : 1)}
    />
  ),
  rule_switch: (props) => (
    <RuleSwitch
      renderState={props.renderState as unknown as RSRenderState}
      onSelectOption={(idx) => props.onCellTap(idx)}
    />
  ),
  spice_stall: (props) => (
    <SpiceStall
      renderState={props.renderState as unknown as SpiceRenderState}
      onCellTap={props.onCellTap}
    />
  ),
  red_light: (props) => (
    <RedLight
      renderState={props.renderState as unknown as RLRenderState}
      onRun={() => props.onCellTap(0)}
    />
  ),
  courier_map: (props) => (
    <CourierMap
      renderState={props.renderState as unknown as CMRenderState}
      onCellTap={props.onCellTap}
    />
  ),
  lighthouse_keeper: (props) => (
    <LighthouseKeeper
      renderState={props.renderState as unknown as LKRenderState}
      onCellTap={props.onCellTap}
    />
  ),
  sushi_express: (props) => (
    <SushiExpress
      renderState={props.renderState as unknown as SXRenderState}
      onCellTap={props.onCellTap}
    />
  ),
  crystal_palace: (props) => (
    <CrystalPalace
      renderState={props.renderState as unknown as CPRenderState}
      onCellTap={props.onCellTap}
    />
  ),
  train_n_back: (props) => (
    <TrainNBack
      renderState={props.renderState as unknown as TNBRenderState}
      onCellTap={props.onCellTap}
    />
  ),
  dual_garden: (props) => (
    <DualGarden
      renderState={props.renderState as unknown as DGRenderState}
      onCellTap={props.onCellTap}
    />
  ),
  crystal_tower: (props) => (
    <CrystalTower
      renderState={props.renderState as unknown as CTRenderState}
      onCellTap={props.onCellTap}
    />
  ),
  wide_view: (props) => (
    <WideView
      renderState={props.renderState as unknown as WVRenderState}
      onCellTap={props.onCellTap}
    />
  ),
};

interface PlayPageProps {
  params: Promise<{ gameKey: string }>;
}

function clampDifficulty(raw: number): number {
  if (Number.isNaN(raw)) return 4;
  return Math.min(10, Math.max(1, raw));
}

type BootState =
  | { phase: "loading" }
  | { phase: "error"; kind: "no-child" | "unknown" | "failed"; message?: string }
  | { phase: "ready"; ids: ActiveRun };

export default function PlayPage({ params }: PlayPageProps) {
  const { gameKey } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  const childId = searchParams.get("childId");
  const fromKid = searchParams.get("from") === "kid";
  const difficulty = clampDifficulty(Number.parseInt(searchParams.get("difficulty") ?? "4", 10));
  // After a kid-mode round, hand the device straight back to the kid home.
  const backTarget = fromKid && childId ? `/dashboard/kid?childId=${childId}` : "/dashboard/games";

  const [attempt, setAttempt] = useState(0);
  const [boot, setBoot] = useState<BootState>({ phase: "loading" });

  // Refs shared with the lifecycle callbacks so unmount cleanup sees fresh state.
  const idsRef = useRef<ActiveRun | null>(null);
  const startedRef = useRef(false);
  const finalRef = useRef<"completed" | "interrupted" | null>(null);

  const game = useMemo(
    () => (GAME_FACTORIES[gameKey] ? GAME_FACTORIES[gameKey]() : null),
    [gameKey],
  );
  const Renderer = useMemo(() => GAME_RENDERERS[gameKey] ?? null, [gameKey]);

  // ── Boot: resolve session → create real server game run ──
  useEffect(() => {
    let cancelled = false;
    setBoot({ phase: "loading" });

    if (!game || !Renderer) {
      setBoot({ phase: "error", kind: "unknown" });
      return;
    }
    if (!childId) {
      setBoot({ phase: "error", kind: "no-child" });
      return;
    }

    createGameRun(childId, gameKey, game.version, difficulty)
      .then((run) => {
        if (cancelled) return;
        idsRef.current = run;
        setBoot({ phase: "ready", ids: run });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Gagal menyiapkan sesi latihan";
        setBoot({ phase: "error", kind: "failed", message });
      });

    return () => {
      cancelled = true;
    };
  }, [childId, gameKey, game, Renderer, difficulty, attempt]);

  // ── Lifecycle: start / finalize the server game run ──
  const handleStarted = useCallback(() => {
    const ids = idsRef.current;
    if (!ids || startedRef.current) return;
    startedRef.current = true;
    void startGameRun(ids.gameRunId).catch((err: unknown) =>
      console.warn("Mark game run as started failed:", err instanceof Error ? err.message : err),
    );
  }, []);

  const finalize = useCallback(async (status: "completed" | "interrupted") => {
    const ids = idsRef.current;
    if (!ids || finalRef.current) return;
    finalRef.current = status;
    try {
      await finishGameRun(ids.gameRunId, status);
    } catch (err: unknown) {
      console.warn("Finalize game run failed:", err instanceof Error ? err.message : err);
    }
  }, []);

  const handleRoundComplete = useCallback(
    (_summary: GameSummary) => {
      void finalize("completed");
    },
    [finalize],
  );

  const handleQuit = useCallback(() => {
    if (!finalRef.current) void finalize("interrupted");
    router.push(backTarget);
  }, [finalize, router, backTarget]);

  // Leaving mid-round (layout "Keluar", browser nav…) → mark the run interrupted
  // so it never stays in_progress forever.
  useEffect(() => {
    return () => {
      if (idsRef.current && !finalRef.current) {
        void finishGameRun(idsRef.current.gameRunId, "interrupted").catch(() => {});
      }
    };
  }, []);

  // ── Error / info cards ──────────────────────────────────
  if (!game || !Renderer) {
    return (
      <ShellMessage
        icon="alert"
        tone="warning"
        title={`Permainan “${gameKey}” belum tersedia`}
        body="Game ini belum terdaftar di aplikasi."
        actionLabel="Kembali"
        onAction={() => router.push(backTarget)}
      />
    );
  }

  if (boot.phase === "loading") {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center gap-3">
        <div className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
        <p className="text-sm font-medium text-ink-soft">Menyiapkan sesi latihan…</p>
      </div>
    );
  }

  if (boot.phase === "error") {
    if (boot.kind === "no-child") {
      return (
        <ShellMessage
          icon="users"
          tone="warning"
          title="Pilih anak dulu"
          body="Sesi latihan tercatat atas nama anak. Pilih profil anak dari halaman Permainan sebelum mulai."
          actionLabel="Kembali"
          onAction={() => router.push(backTarget)}
        />
      );
    }
    if (boot.kind === "unknown") {
      return (
        <ShellMessage
          icon="alert"
          tone="warning"
          title={`Permainan “${gameKey}” belum tersedia`}
          body="Game ini belum terdaftar di aplikasi."
          actionLabel="Kembali"
          onAction={() => router.push(backTarget)}
        />
      );
    }
    return (
      <ShellMessage
        icon="alert"
        tone="danger"
        title="Gagal menyiapkan sesi"
        body={boot.message ?? "Terjadi kesalahan saat menyiapkan sesi latihan."}
        actionLabel="Coba lagi"
        onAction={() => setAttempt((n) => n + 1)}
      />
    );
  }

  return (
    <div className="h-[calc(100dvh-3.5rem)] w-full">
      <GameShell
        key={`${gameKey}-${boot.ids.gameRunId}`}
        game={game}
        config={{
          difficulty,
          seed: Date.now(),
          isPractice: false,
          practiceTrials: 3,
          maxTrials: 20,
        }}
        ids={{ sessionId: boot.ids.sessionId, gameRunId: boot.ids.gameRunId }}
        onFinish={() => router.push(backTarget)}
        onQuit={handleQuit}
        onStarted={handleStarted}
        onRoundComplete={handleRoundComplete}
        renderComponent={Renderer}
      />
    </div>
  );
}

function ShellMessage({
  icon,
  tone,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: "alert" | "users";
  tone: "warning" | "danger";
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const iconTone =
    tone === "danger"
      ? "bg-danger-50 text-danger-600"
      : "bg-warning-50 text-warning-600";
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center px-4">
      <div className="card w-full max-w-sm px-6 py-10 text-center">
        <div className={`mx-auto flex size-12 items-center justify-center rounded-full ${iconTone}`}>
          <Icon name={icon} className="size-6" />
        </div>
        <p className="mt-4 font-semibold text-ink">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
        <button onClick={onAction} className="btn-secondary mt-6 w-full">
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
