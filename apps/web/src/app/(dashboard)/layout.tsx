"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/ui/brand";
import { Icon } from "@/components/ui/icons";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Ringkasan", icon: "gauge" as const },
  { href: "/dashboard/children", label: "Anak", icon: "users" as const },
  { href: "/dashboard/games", label: "Permainan", icon: "grid" as const },
  { href: "/dashboard/admin", label: "Admin", icon: "shield" as const, adminOnly: true },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((json) => {
        if (json.error) {
          router.push("/login");
        } else {
          setEmail(json.data?.email ?? "");
          setRole(json.data?.role ?? null);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const navItems = NAV_ITEMS.filter((item) => !item.adminOnly || role === "admin");

  const active = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname?.startsWith(href) ?? false;
  };

  // Kid mode and play sessions are immersive — no parent chrome around them.
  const isPlay = pathname?.startsWith("/dashboard/play") ?? false;
  const isKidMode = pathname?.startsWith("/dashboard/kid") ?? false;
  const immersive = isPlay || isKidMode;

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Hide parent chrome entirely during child play / kid-mode sessions */}
      {!immersive && <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <a href="/dashboard" aria-label="Platform Pelatihan Kognitif — beranda">
              <Wordmark />
            </a>
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Navigasi utama">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  aria-current={active(item.href) ? "page" : undefined}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    active(item.href)
                      ? "bg-brand-50 text-brand-800"
                      : "text-ink-soft hover:bg-canvas-deep hover:text-ink"
                  }`}
                >
                  <Icon name={item.icon} className="size-4" />
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            {email && (
              <span className="mr-1 hidden max-w-44 truncate text-sm text-ink-mute md:block">
                {email}
              </span>
            )}
            <button onClick={handleLogout} className="btn-ghost" title="Keluar">
              <Icon name="logout" className="size-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
        {/* Nav mobile */}
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2.5 sm:hidden" aria-label="Navigasi utama">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={active(item.href) ? "page" : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active(item.href)
                  ? "bg-brand-50 text-brand-800"
                  : "text-ink-soft hover:bg-canvas-deep hover:text-ink"
              }`}
            >
              <Icon name={item.icon} className="size-4" />
              {item.label}
            </a>
          ))}
        </nav>
      </header>}

      <main className={immersive ? "" : "mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"}>
        {children}
      </main>
    </div>
  );
}
