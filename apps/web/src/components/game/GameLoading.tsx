interface GameLoadingProps {
  gameName: string;
  accent: string;
}

export function GameLoading({ gameName, accent }: GameLoadingProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className="size-11 animate-spin rounded-full"
        style={{
          border: "3px solid var(--game-line)",
          borderTopColor: accent,
        }}
      />
      <div>
        <p className="text-[15px] font-semibold" style={{ color: "var(--game-ink)" }}>
          {gameName}
        </p>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--game-ink-mute)" }}>
          Menyiapkan…
        </p>
      </div>
    </div>
  );
}
