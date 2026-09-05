"use client";

import { Icon, type IconName } from "@/components/ui/icons";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: IconName;
  color?: "brand" | "success" | "attention" | "warning" | "danger" | "neutral";
}

const toneClasses = {
  brand: "bg-brand-50 text-brand-700",
  success: "bg-success-50 text-success-700",
  attention: "bg-[#f1ebfa] text-[#5d36ab]",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-600",
  neutral: "bg-canvas-deep text-ink-soft",
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon = "gauge",
  color = "brand",
}: StatsCardProps) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">{title}</p>
          <p className="tnum mt-2 text-[2rem] font-bold leading-none tracking-[-0.02em] text-ink">
            {value}
          </p>
          {subtitle && <p className="mt-1.5 truncate text-[13px] text-ink-mute">{subtitle}</p>}
        </div>
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[color]}`}>
          <Icon name={icon} className="size-5" strokeWidth={1.7} />
        </div>
      </div>
    </div>
  );
}
