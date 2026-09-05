"use client";

import { useCallback, useRef, useState } from "react";
import {
  playCorrect,
  playWrong,
  playTimeout,
  playClick,
  playSwitch,
  playCountdown,
  playGo,
  playPracticeComplete,
  playGameComplete,
  playStopSignal,
  playStreak,
  resumeAudio,
} from "./sound-effects";
import { glowPulse, scalePop, shakeWrong } from "./animations";
import { getTheme, getSavedTheme, setTheme } from "./themes";

export interface GameEffects {
  /** Sound effects */
  sound: {
    correct: () => void;
    wrong: () => void;
    timeout: () => void;
    click: () => void;
    switch: () => void;
    countdown: () => void;
    go: () => void;
    practiceComplete: () => void;
    gameComplete: () => void;
    stopSignal: () => void;
    streak: () => void;
  };
  /** Visual effects (needs ref to game container) */
  visual: {
    shake: (intensity?: number, duration?: number) => void;
    glow: (color?: string, duration?: number) => void;
    pop: () => void;
    wrong: (duration?: number) => void;
  };
  /** Theme */
  theme: {
    current: ReturnType<typeof getTheme>;
    set: (id: string) => void;
    vars: Record<string, string>;
  };
  /** Confetti trigger counter */
  confettiTrigger: number;
  fireConfetti: () => void;
  /** Whether effects are initialized (after user gesture) */
  initialized: boolean;
  init: () => void;
}

export function useGameEffects(): GameEffects {
  const [initialized, setInitialized] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [themeId, setThemeId] = useState(getSavedTheme());
  const streakRef = useRef(0);

  const init = useCallback(() => {
    if (!initialized) {
      resumeAudio();
      setInitialized(true);
    }
  }, [initialized]);

  const sound = {
    correct: useCallback(() => {
      if (initialized) playCorrect();
    }, [initialized]),
    wrong: useCallback(() => {
      if (initialized) playWrong();
    }, [initialized]),
    timeout: useCallback(() => {
      if (initialized) playTimeout();
    }, [initialized]),
    click: useCallback(() => {
      if (initialized) playClick();
    }, [initialized]),
    switch: useCallback(() => {
      if (initialized) playSwitch();
    }, [initialized]),
    countdown: useCallback(() => {
      if (initialized) playCountdown();
    }, [initialized]),
    go: useCallback(() => {
      if (initialized) playGo();
    }, [initialized]),
    practiceComplete: useCallback(() => {
      if (initialized) playPracticeComplete();
    }, [initialized]),
    gameComplete: useCallback(() => {
      if (initialized) playGameComplete();
      setConfettiTrigger((n) => n + 1);
    }, [initialized]),
    stopSignal: useCallback(() => {
      if (initialized) playStopSignal();
    }, [initialized]),
    streak: useCallback(() => {
      if (initialized) {
        streakRef.current++;
        if (streakRef.current >= 3 && streakRef.current % 3 === 0) {
          playStreak();
          setConfettiTrigger((n) => n + 1);
        }
      }
    }, [initialized]),
  };

  // Visual effects are applied by game components via applyEffectsToContainer
  const visual = {
    shake: useCallback((_intensity?: number, _duration?: number) => {
      // Applied by game components using their own refs
    }, []),
    glow: useCallback((_color?: string, _duration?: number) => {
      // Applied by game components using their own refs
    }, []),
    pop: useCallback(() => {
      // Applied by game components using their own refs
    }, []),
    wrong: useCallback((_duration?: number) => {
      // Applied by game components using their own refs
    }, []),
  };

  const theme = {
    current: getTheme(themeId),
    set: useCallback((id: string) => {
      setTheme(id);
      setThemeId(id);
    }, []),
    vars: getTheme(themeId).vars,
  };

  const fireConfetti = useCallback(() => {
    setConfettiTrigger((n) => n + 1);
  }, []);

  // Reset streak on wrong/timeout
  const wrappedWrong = useCallback(() => {
    streakRef.current = 0;
    sound.wrong();
  }, [sound]);

  const wrappedTimeout = useCallback(() => {
    streakRef.current = 0;
    sound.timeout();
  }, [sound]);

  return {
    sound: {
      ...sound,
      wrong: wrappedWrong,
      timeout: wrappedTimeout,
    },
    visual,
    theme,
    confettiTrigger,
    fireConfetti,
    initialized,
    init,
  };
}

/**
 * Helper to apply visual effects to a game container element.
 * Call this with a ref to the game's main container div.
 */
export function applyEffectsToContainer(
  container: HTMLElement,
  effect: "correct" | "wrong" | "timeout" | "switch" | "countdown",
) {
  switch (effect) {
    case "correct":
      glowPulse(container, "#22c55e", 400);
      scalePop(container, 0.95, 1, 300);
      break;
    case "wrong":
      shakeWrong(container, 400);
      glowPulse(container, "#ef4444", 400);
      break;
    case "timeout":
      shakeWrong(container, 300);
      break;
    case "switch":
      glowPulse(container, "#f59e0b", 500);
      break;
    case "countdown":
      scalePop(container, 0.9, 1, 200);
      break;
  }
}
