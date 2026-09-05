"use client";

interface TrendSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export function TrendSparkline({
  data,
  width = 120,
  height = 40,
  color = "#0d7c68",
  showDots = false,
}: TrendSparklineProps) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-xs text-ink-faint" style={{ width, height }}>
        Tidak ada data
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <path d={areaD} fill={color} opacity={0.08} />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots &&
        points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={color} />
        ))}
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={3} fill={color} />
    </svg>
  );
}

interface TrendCardProps {
  title: string;
  data: number[];
  labels?: string[];
  unit?: string;
  color?: string;
}

export function TrendCard({
  title,
  data,
  labels,
  unit = "",
  color = "#0d7c68",
}: TrendCardProps) {
  const current = data[data.length - 1] ?? 0;
  const previous = data[data.length - 2] ?? current;
  const change = current - previous;
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[13px] font-medium text-ink-soft">{title}</h4>
        <TrendSparkline data={data} width={92} height={30} color={color} />
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="tnum text-[1.6rem] font-bold leading-none tracking-[-0.02em] text-ink">
          {Math.round(current)}
          {unit}
        </span>
        {change !== 0 && (
          <span
            className={`tnum text-xs font-semibold ${
              change > 0 ? "text-success-700" : "text-danger-600"
            }`}
          >
            {change > 0 ? "▲" : "▼"} {Math.abs(Math.round(changePercent))}%
          </span>
        )}
      </div>
      {labels && labels.length >= 2 && (
        <div className="mt-2 flex justify-between text-[11px] text-ink-faint">
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
}
