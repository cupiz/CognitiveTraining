/**
 * Device context captured at game start.
 * Stored as deviceContextJson on assessment/session for diagnostics.
 */
export interface DeviceContext {
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  touchSupport: boolean;
  refreshRate: number | null;
  platform: string;
  language: string;
  timezone: string;
}

/**
 * Detect input modality from the first interaction.
 */
export function detectInputModality(
  event: { type: string; x?: number; y?: number },
): "touch" | "pointer" | "keyboard" {
  if (event.type === "touch") return "touch";
  if (event.type === "key_down") return "keyboard";
  return "pointer";
}

/**
 * Capture current device context snapshot.
 */
export function captureDeviceContext(): DeviceContext {
  const screen =
    typeof globalThis.screen !== "undefined" ? globalThis.screen : { width: 0, height: 0 };

  return {
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    screenWidth: screen.width,
    screenHeight: screen.height,
    pixelRatio: typeof globalThis.devicePixelRatio !== "undefined" ? globalThis.devicePixelRatio : 1,
    touchSupport: typeof globalThis.ontouchstart !== "undefined",
    refreshRate: detectRefreshRate(),
    platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
    language: typeof navigator !== "undefined" ? navigator.language : "en",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

function detectRefreshRate(): number | null {
  try {
    // Use screen.refreshRate if available (experimental)
    const screenObj = globalThis.screen as unknown as Record<string, unknown>;
    if (typeof screenObj.refreshRate === "number") {
      return screenObj.refreshRate;
    }
  } catch {
    // Ignore
  }
  return null;
}
