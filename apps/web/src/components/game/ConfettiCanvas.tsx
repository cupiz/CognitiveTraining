"use client";

import { useRef, useEffect } from "react";
import { spawnConfetti } from "@/lib/game/animations";

interface ConfettiCanvasProps {
  /** Trigger confetti when this changes */
  trigger?: number;
  /** Number of particles */
  count?: number;
}

export function ConfettiCanvas({ trigger, count = 60 }: ConfettiCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger !== undefined && trigger !== prevTrigger.current && canvasRef.current) {
      prevTrigger.current = trigger;
      spawnConfetti(canvasRef.current, count);
    }
  }, [trigger, count]);

  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-50"
      style={{ mixBlendMode: "normal" }}
    />
  );
}
