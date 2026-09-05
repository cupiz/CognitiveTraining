"use client";

import { EmptyCard } from "./EmptyCard";

const DOMAIN_HUES: Record<string, { label: string; color: string; tint: string }> = {
  working_memory: { label: "Memori Kerja", color: "#3b63c9", tint: "#e8edfa" },
  sustained_attention: { label: "Atensi Berkelanjutan", color: "#7a52c8", tint: "#f1ebfa" },
  processing_speed: { label: "Kecepatan Proses", color: "#d9821b", tint: "#fbf0e1" },
  inhibitory_control: { label: "Kontrol Inhibisi", color: "#d64545", tint: "#fbeae8" },
  cognitive_flexibility: { label: "Fleksibilitas Kognitif", color: "#0f9d6e", tint: "#e3f3ec" },
  visual_spatial: { label: "Spasial Visual", color: "#3b63c9", tint: "#e8edfa" },
};

export function DomainPerformance({
  domains,
}: {
  domains: Array<{
    domain: string;
    score: number;
    confidence: number;
    sourceRunCount: number;
  }>;
}) {
  if (domains.length === 0) {
    return (
      <EmptyCard
        title="Performa domain"
        empty="Belum ada data — selesaikan satu asesmen untuk melihat skor domain."
      />
    );
  }

  const latestByDomain = new Map<string, (typeof domains)[number]>();
  for (const d of domains) {
    if (!latestByDomain.has(d.domain)) latestByDomain.set(d.domain, d);
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[15px] font-semibold text-ink">Performa domain</h3>
        <span className="text-xs text-ink-mute">Hasil terakhir per domain</span>
      </div>
      <div className="mt-5 space-y-5">
        {Array.from(latestByDomain.values()).map((d) => {
          const meta = DOMAIN_HUES[d.domain] ?? {
            label: d.domain,
            color: "#8f897c",
            tint: "#ece9e1",
          };
          const confidencePercent = Math.round(d.confidence * 100);
          return (
            <div key={d.domain}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-ink">{meta.label}</span>
                <div className="flex shrink-0 items-center gap-2.5">
                  {d.sourceRunCount > 0 && (
                    <span className="text-xs text-ink-mute">
                      {d.sourceRunCount}× dijalankan
                    </span>
                  )}
                  <span className="tnum text-sm font-semibold text-ink">
                    {Math.round(d.score)}<span className="font-normal text-ink-faint">/100</span>
                  </span>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas-deep">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${Math.min(100, d.score)}%`, backgroundColor: meta.color }}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-ink-mute">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: meta.tint, boxShadow: `inset 0 0 0 2px ${meta.color}` }}
                />
                <span>{confidencePercent}% keyakinan</span>
                {d.confidence < 0.5 && <span className="text-warning-700">· butuh data lagi</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


