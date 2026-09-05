"use client";

/**
 * Game arena themes.
 *
 * Each theme changes the arena's *atmosphere* (backdrop + surface + ink) while
 * the per-game identity hue stays constant — switching worlds must never change
 * how stimuli look, because that would change the task.
 */

export type SceneKind = "paper" | "dusk" | "ocean" | "jungle" | "candy";

export interface GameTheme {
  id: string;
  name: string;
  /** CSS custom properties applied to the arena root */
  vars: Record<string, string>;
  /** Decorative scene drawn behind the arena (see SceneBackdrop) */
  scene: {
    kind: SceneKind;
    /** main decorative color — kept soft, never competes with stimuli */
    color: string;
    /** secondary accent for decor (clouds, bubbles…) */
    soft: string;
  };
}

export const THEMES: GameTheme[] = [
  {
    id: "default",
    name: "Paper",
    scene: { kind: "paper", color: "#D9D2C0", soft: "#ECE8DC" },
    vars: {
      "--game-bg": "#F2F0E9",
      "--game-surface": "#FFFFFF",
      "--game-surface-2": "#F9F7F1",
      "--game-line": "#E4DFD2",
      "--game-ink": "#23201A",
      "--game-ink-mute": "#7C7668",
      "--game-correct": "#1E8A58",
      "--game-correct-tint": "#E3F1E9",
      "--game-wrong": "#C03F2D",
      "--game-wrong-tint": "#F8E7E3",
      "--game-warn": "#A87812",
      "--game-warn-tint": "#F5EBD4",
    },
  },
  {
    id: "dusk",
    name: "Dusk",
    scene: { kind: "dusk", color: "#E6C76F", soft: "#8A93A6" },
    vars: {
      "--game-bg": "#141519",
      "--game-surface": "#1D1F25",
      "--game-surface-2": "#24262E",
      "--game-line": "#333640",
      "--game-ink": "#F1F0EB",
      "--game-ink-mute": "#A0A39C",
      "--game-correct": "#35C07C",
      "--game-correct-tint": "#14372A",
      "--game-wrong": "#EE6A57",
      "--game-wrong-tint": "#43211C",
      "--game-warn": "#E0B24E",
      "--game-warn-tint": "#403218",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    scene: { kind: "ocean", color: "#7FD1D9", soft: "#3E7C8A" },
    vars: {
      "--game-bg": "#0C2B35",
      "--game-surface": "#123A47",
      "--game-surface-2": "#17424F",
      "--game-line": "#23556566",
      "--game-ink": "#E9F5F6",
      "--game-ink-mute": "#9CC3CB",
      "--game-correct": "#3CC98D",
      "--game-correct-tint": "#0F3A2F",
      "--game-wrong": "#E76A5A",
      "--game-wrong-tint": "#40211C",
      "--game-warn": "#E5AE44",
      "--game-warn-tint": "#403417",
    },
  },
  {
    id: "jungle",
    name: "Jungle",
    scene: { kind: "jungle", color: "#7FBE63", soft: "#43603C" },
    vars: {
      "--game-bg": "#1C2E1E",
      "--game-surface": "#24392A",
      "--game-surface-2": "#2B4230",
      "--game-line": "#3A5640",
      "--game-ink": "#F0F4E9",
      "--game-ink-mute": "#A9BBA4",
      "--game-correct": "#7ED957",
      "--game-correct-tint": "#1D3A1E",
      "--game-wrong": "#F0745F",
      "--game-wrong-tint": "#402219",
      "--game-warn": "#EAC35A",
      "--game-warn-tint": "#3E3614",
    },
  },
  {
    id: "candy",
    name: "Candy",
    scene: { kind: "candy", color: "#E89BB2", soft: "#F6D3DC" },
    vars: {
      "--game-bg": "#FAF0F2",
      "--game-surface": "#FFFFFF",
      "--game-surface-2": "#FBF5F6",
      "--game-line": "#EEDCE0",
      "--game-ink": "#46303A",
      "--game-ink-mute": "#A0858F",
      "--game-correct": "#24995F",
      "--game-correct-tint": "#E2F3E9",
      "--game-wrong": "#D14A63",
      "--game-wrong-tint": "#F8E4E8",
      "--game-warn": "#BB7A16",
      "--game-warn-tint": "#F6ECD7",
    },
  },
];

// ── State management ───────────────────────────────────

let currentThemeId = "default";

/** Fired so open game shells can switch live */
const THEME_CHANGE_EVENT = "cog:theme-change";

export function getTheme(id?: string): GameTheme {
  return THEMES.find((t) => t.id === (id ?? currentThemeId)) ?? THEMES[0];
}

export function setTheme(id: string): GameTheme {
  currentThemeId = id;
  if (typeof window !== "undefined") {
    localStorage.setItem("cog-game-theme", id);
    window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: { id } }));
  }
  return getTheme(id);
}

export function getSavedTheme(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("cog-game-theme") ?? "default";
  }
  return "default";
}

export function onThemeChange(handler: (id: string) => void): () => void {
  const listener = (e: Event) => {
    const id = (e as CustomEvent<{ id: string }>).detail?.id;
    if (id) handler(id);
  };
  window.addEventListener(THEME_CHANGE_EVENT, listener);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, listener);
}

/** Apply theme CSS variables to an element */
export function applyTheme(element: HTMLElement, theme: GameTheme): void {
  for (const [key, value] of Object.entries(theme.vars)) {
    element.style.setProperty(key, value);
  }
}
