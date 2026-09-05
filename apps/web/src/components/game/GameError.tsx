"use client";

import { Icon } from "@/components/ui/icons";

interface GameErrorProps {
  message: string;
  onRetry?: () => void;
}

export function GameError({ message, onRetry }: GameErrorProps) {
  return (
    <div
      className="fade-up w-full max-w-sm rounded-2xl border px-6 py-8 text-center"
      style={{ backgroundColor: "var(--game-surface)", borderColor: "var(--game-line)" }}
    >
      <div
        className="mx-auto flex size-12 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--game-wrong-tint)", color: "var(--game-wrong)" }}
      >
        <Icon name="alert" className="size-6" />
      </div>
      <h2 className="mt-4 text-lg font-bold" style={{ color: "var(--game-ink)" }}>
        Terjadi kendala
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--game-ink-mute)" }}>
        {message}
      </p>

      <div className="mt-6 flex justify-center gap-3">
        {onRetry && (
          <button onClick={onRetry} className="btn-primary">
            Coba lagi
          </button>
        )}
        <a href="/dashboard" className="btn-secondary">
          Kembali ke dashboard
        </a>
      </div>
    </div>
  );
}
