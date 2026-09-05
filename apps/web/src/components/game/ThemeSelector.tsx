"use client";

import { useState, useRef, useEffect } from "react";
import { THEMES, setTheme, getSavedTheme } from "@/lib/game/themes";
import { Icon } from "@/components/ui/icons";

/** Preview color for each world */
const PREVIEW: Record<string, string[]> = {
  default: ["#F2F0E9", "#FFFFFF", "#0d7c68"],
  dusk: ["#141519", "#24262E", "#35C07C"],
  ocean: ["#0C2B35", "#17424F", "#3CC98D"],
  jungle: ["#1C2E1E", "#2B4230", "#7ED957"],
  candy: ["#FAF0F2", "#FFFFFF", "#D14A63"],
};

export function ThemeSelector() {
  const [selected, setSelected] = useState(getSavedTheme());
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="icon-btn border border-line bg-white text-ink-soft hover:text-ink"
        title="Tema arena"
        aria-label="Tema arena"
        aria-expanded={isOpen}
      >
        <Icon name="palette" className="size-4.5" />
      </button>

      {isOpen && (
        <div className="pop-in absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-line bg-white p-1.5 shadow-pop">
          <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-ink-mute">
            Tema arena
          </p>
          {THEMES.map((theme) => {
            const swatches = PREVIEW[theme.id] ?? ["#eee", "#fff", "#0d7c68"];
            const isActive = selected === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => {
                  setSelected(theme.id);
                  setTheme(theme.id);
                  setIsOpen(false);
                }}
                aria-pressed={isActive}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  isActive ? "bg-brand-50 font-semibold text-brand-800" : "text-ink-soft hover:bg-canvas-deep hover:text-ink"
                }`}
              >
                <span className="flex shrink-0 items-center -space-x-1.5">
                  {swatches.map((c, i) => (
                    <span
                      key={i}
                      className="size-5 rounded-full border border-white shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </span>
                <span className="flex-1">{theme.name}</span>
                {isActive && <Icon name="check" className="size-4 text-brand-700" strokeWidth={2.4} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
