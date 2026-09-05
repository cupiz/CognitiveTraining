"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/ui/icons";

const ADMIN_TABS: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/dashboard/admin", label: "Ringkasan", icon: "gauge" },
  { href: "/dashboard/admin/users", label: "Pengguna", icon: "users" },
  { href: "/dashboard/admin/children", label: "Data Anak", icon: "users" },
  { href: "/dashboard/admin/master-data", label: "Master Data", icon: "grid" },
  { href: "/dashboard/admin/games", label: "Visibilitas Game", icon: "target" },
  { href: "/dashboard/admin/audit", label: "Audit Log", icon: "activity" },
];

type RoleState = "loading" | "denied" | "ready";

/**
 * Shared admin chrome: admin-only guard + sub-navigation tabs.
 * Every /dashboard/admin/* page renders inside this guard.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [roleState, setRoleState] = useState<RoleState>("loading");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error || json.data?.role !== "admin") {
          setRoleState("denied");
        } else {
          setRoleState("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setRoleState("denied");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (roleState === "loading") {
    return (
      <div className="flex items-center justify-center gap-3 py-24">
        <div className="size-6 animate-spin rounded-full border-2 border-line-strong border-t-brand-600" />
        <p className="text-sm font-medium text-ink-soft">Memeriksa akses admin…</p>
      </div>
    );
  }

  if (roleState === "denied") {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card px-6 py-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
            <Icon name="shield" className="size-6" />
          </div>
          <h1 className="mt-4 text-lg font-bold text-ink">Hanya untuk admin</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            Akun kamu tidak punya izin untuk mengakses area admin.
          </p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary mt-6">
            Kembali ke ringkasan
          </button>
        </div>
      </div>
    );
  }

  const active = (href: string) => {
    if (href === "/dashboard/admin") return pathname === "/dashboard/admin";
    return pathname?.startsWith(href) ?? false;
  };

  return (
    <div className="mx-auto max-w-5xl">
      <nav
        className="mb-8 flex gap-1 overflow-x-auto border-b border-line pb-px"
        aria-label="Navigasi admin"
      >
        {ADMIN_TABS.map((tab) => (
          <a
            key={tab.href}
            href={tab.href}
            aria-current={active(tab.href) ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              active(tab.href)
                ? "border border-line border-b-surface bg-surface text-brand-700"
                : "text-ink-soft hover:bg-canvas-deep hover:text-ink"
            }`}
          >
            <Icon name={tab.icon} className="size-4" />
            {tab.label}
          </a>
        ))}
      </nav>
      {children}
    </div>
  );
}
