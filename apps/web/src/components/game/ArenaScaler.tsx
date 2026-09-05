"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scales the arena up to fill the available screen space on large displays,
 * while staying at its authored (phone) size when space is tight.
 *
 * Game arenas are designed for a phone-sized column (up to `max-w-md`). On a
 * desktop monitor that leaves a small strip floating in the middle of the
 * screen. This wrapper measures the free area and applies a proportional
 * `transform: scale()` to the whole arena — chips, scenes and text grow
 * together, exactly as if the game had been designed bigger. On phones and
 * small windows the scale stays at 1, so nothing changes there.
 *
 * Scale is bounded by BOTH available width and height so the arena never
 * overflows/clips, and it is computed from layout boxes (ResizeObserver), not
 * animation frames, so it works even when rAF is throttled.
 */

const MAX_SCALE = 2; // never zoom beyond 2× even on huge monitors

export function ArenaScaler({ children }: { children: React.ReactNode }) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const compute = () => {
      const ow = outer.clientWidth;
      const oh = outer.clientHeight;
      // offsetWidth/Height are the unscaled layout boxes (transforms don't
      // affect them), so we always measure the arena at scale 1.
      const iw = inner.offsetWidth;
      const ih = inner.offsetHeight;
      if (!ow || !oh || !iw || !ih) return;
      // 0.98 leaves a small breathing margin so the scaled arena never kisses
      // the edge or scrolls.
      let k = Math.min(ow / iw, oh / ih) * 0.98;
      k = Math.max(1, Math.min(k, MAX_SCALE));
      setScale((prev) => (Math.abs(prev - k) > 0.01 ? k : prev));
    };

    compute();
    // Re-measure when the free space changes (resize, rotation, …) or when the
    // arena itself changes size (game state, boot, result screen, …).
    const ro = new ResizeObserver(() => compute());
    ro.observe(outer);
    ro.observe(inner);
    // One late pass: fonts/layout often settle a frame or two after mount.
    const late = window.setTimeout(compute, 350);
    return () => {
      ro.disconnect();
      window.clearTimeout(late);
    };
  }, []);

  return (
    <div ref={outerRef} className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        ref={innerRef}
        data-arena-scale
        className="flex w-full max-w-md flex-col items-center justify-center gap-2"
        style={{ transform: `scale(${scale})`, transformOrigin: "center", willChange: "transform" }}
      >
        {children}
      </div>
    </div>
  );
}
