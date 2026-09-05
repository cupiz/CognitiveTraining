"use client";

import { EmptyCard } from "./EmptyCard";
import { gameMeta } from "@/lib/games";

interface AdaptiveStateData {
  gameKey: string;
  ability: number;
  uncertainty: number;
  difficulty: number;
  algorithmVersion: string;
  updatedAt: string;
}

export function AdaptiveStates({ states }: { states: AdaptiveStateData[] }) {
  if (states.length === 0) {
    return (
      <EmptyCard
        title="Status adaptif"
        empty="Belum ada data adaptif — beberapa game cukup untuk mesin memperkirakan kemampuan."
      />
    );
  }

  return (
    <section className="card p-5 sm:p-6">
      <h3 className="text-[15px] font-semibold text-ink">Status adaptif</h3>
      <p className="mt-0.5 text-[13px] text-ink-mute">
        Perkiraan kemampuan dan level saat ini per permainan
      </p>
      <div className="mt-4 space-y-2">
        {states.map((state) => {
          const meta = gameMeta(state.gameKey);
          const abilityPercent = Math.round(state.ability * 10);
          const uncertaintyBar = Math.round(state.uncertainty * 20); // 0–5 → 0–100%

          return (
            <div
              key={state.gameKey}
              className="rounded-xl border border-line px-4 py-3.5 transition-colors hover:bg-surface-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: meta.color }}
                  />
                  <span className="text-sm font-semibold text-ink">{meta.name}</span>
                </div>
                <span className="text-xs text-ink-mute">
                  Diperbarui {new Date(state.updatedAt).toLocaleDateString("id-ID")}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-4">
                <Metric label="Kemampuan" value={state.ability.toFixed(1)} pct={abilityPercent} color={meta.color} />
                <Metric label="Level" value={`D${state.difficulty}`} pct={state.difficulty * 10} color="#0f9d6e" />
                <Metric label="Ketidakpastian" value={state.uncertainty.toFixed(1)} pct={uncertaintyBar} color="#d9821b" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
}) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="tnum mt-1 text-lg font-semibold leading-none text-ink">{value}</p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-canvas-deep">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
