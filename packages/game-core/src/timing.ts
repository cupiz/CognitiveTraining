/**
 * High-resolution timestamp using performance.now().
 * Used for reaction time measurement — never use Date.now().
 */
export function now(): number {
  return performance.now();
}

/**
 * Calculate elapsed milliseconds between two performance.now() timestamps.
 */
export function elapsed(start: number, end: number): number {
  return Math.max(0, end - start);
}

/**
 * Convert performance.now() delta to whole milliseconds (rounded).
 */
export function toMs(delta: number): number {
  return Math.round(delta);
}
