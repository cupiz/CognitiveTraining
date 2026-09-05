"use client";

import { useCallback, useRef } from "react";

// ── Confetti ───────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
}

const CONFETTI_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F1948A", "#82E0AA",
];

export function spawnConfetti(
  canvas: HTMLCanvasElement,
  count = 60,
  durationMs = 1500,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const renderCtx = ctx;

  const particles: Particle[] = [];
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    particles.push({
      x: cx + (Math.random() - 0.5) * 100,
      y: cy + (Math.random() - 0.5) * 100,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 4 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      life: 1,
      maxLife: durationMs,
    });
  }

  const startTime = performance.now();

  function animate(now: number) {
    const elapsed = now - startTime;
    if (elapsed > durationMs) {
      renderCtx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    renderCtx.clearRect(0, 0, canvas.width, canvas.height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // gravity
      p.rotation += p.rotationSpeed;
      p.life = 1 - elapsed / p.maxLife;

      renderCtx.save();
      renderCtx.translate(p.x, p.y);
      renderCtx.rotate(p.rotation);
      renderCtx.globalAlpha = p.life;
      renderCtx.fillStyle = p.color;

      // Draw rectangle confetti
      renderCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      renderCtx.restore();
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// ── Screen shake ───────────────────────────────────────

export function screenShake(
  element: HTMLElement,
  intensity = 5,
  durationMs = 300,
): void {
  const startTime = performance.now();

  function shake(now: number) {
    const elapsed = now - startTime;
    if (elapsed > durationMs) {
      element.style.transform = "";
      return;
    }

    const progress = elapsed / durationMs;
    const decay = 1 - progress;
    const x = (Math.random() - 0.5) * intensity * decay;
    const y = (Math.random() - 0.5) * intensity * decay;
    element.style.transform = `translate(${x}px, ${y}px)`;

    requestAnimationFrame(shake);
  }

  requestAnimationFrame(shake);
}

// ── Bounce animation ───────────────────────────────────

export function bounceIn(element: HTMLElement, durationMs = 400): void {
  element.style.animation = `bounceIn ${durationMs}ms ease-out`;
  setTimeout(() => {
    element.style.animation = "";
  }, durationMs);
}

// ── Glow pulse ─────────────────────────────────────────

export function glowPulse(
  element: HTMLElement,
  color = "#4ECDC4",
  durationMs = 600,
): void {
  const startTime = performance.now();

  function pulse(now: number) {
    const elapsed = now - startTime;
    if (elapsed > durationMs) {
      element.style.boxShadow = "";
      return;
    }

    const progress = elapsed / durationMs;
    const intensity = Math.sin(progress * Math.PI);
    element.style.boxShadow = `0 0 ${20 * intensity}px ${color}, 0 0 ${40 * intensity}px ${color}40`;

    requestAnimationFrame(pulse);
  }

  requestAnimationFrame(pulse);
}

// ── Scale pop ──────────────────────────────────────────

export function scalePop(
  element: HTMLElement,
  from = 0.8,
  to = 1.0,
  durationMs = 300,
): void {
  const startTime = performance.now();

  function pop(now: number) {
    const elapsed = now - startTime;
    if (elapsed > durationMs) {
      element.style.transform = "";
      return;
    }

    const t = elapsed / durationMs;
    // Overshoot easing
    const ease = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const scale = from + (to - from) * ease;
    element.style.transform = `scale(${scale})`;

    requestAnimationFrame(pop);
  }

  requestAnimationFrame(pop);
}

// ── Shake head (wrong answer) ──────────────────────────

export function shakeWrong(
  element: HTMLElement,
  durationMs = 400,
): void {
  const startTime = performance.now();

  function shake(now: number) {
    const elapsed = now - startTime;
    if (elapsed > durationMs) {
      element.style.transform = "";
      return;
    }

    const progress = elapsed / durationMs;
    const decay = 1 - progress;
    const x = Math.sin(progress * Math.PI * 6) * 8 * decay;
    element.style.transform = `translateX(${x}px)`;

    requestAnimationFrame(shake);
  }

  requestAnimationFrame(shake);
}

// ── Ripple effect ──────────────────────────────────────

export function createRipple(
  x: number,
  y: number,
  container: HTMLElement,
  color = "#4ECDC4",
): void {
  const ripple = document.createElement("div");
  ripple.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid ${color};
    transform: translate(-50%, -50%);
    pointer-events: none;
    animation: rippleExpand 0.6s ease-out forwards;
  `;
  container.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

// ── React hook for animation refs ──────────────────────

export function useAnimationRef<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  const shake = useCallback(
    (intensity?: number, duration?: number) => {
      if (ref.current) screenShake(ref.current, intensity, duration);
    },
    [],
  );

  const glow = useCallback(
    (color?: string, duration?: number) => {
      if (ref.current) glowPulse(ref.current, color, duration);
    },
    [],
  );

  const pop = useCallback(
    () => {
      if (ref.current) scalePop(ref.current);
    },
    [],
  );

  const wrong = useCallback(
    (duration?: number) => {
      if (ref.current) shakeWrong(ref.current, duration);
    },
    [],
  );

  return { ref, shake, glow, pop, wrong };
}
