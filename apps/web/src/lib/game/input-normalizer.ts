import type { InputEvent } from "@cog/schemas";

/** Convert a PointerEvent to our InputEvent type */
export function normalizePointerEvent(
  e: PointerEvent,
  type: "pointer_down" | "pointer_up",
): InputEvent {
  return {
    type,
    x: e.clientX,
    y: e.clientY,
    tClient: e.timeStamp,
  };
}

/** Convert a TouchEvent to our InputEvent type (uses first touch) */
export function normalizeTouchEvent(e: TouchEvent): InputEvent | null {
  const touch = e.touches[0] ?? e.changedTouches[0];
  if (!touch) return null;

  return {
    type: "touch",
    x: touch.clientX,
    y: touch.clientY,
    tClient: e.timeStamp,
  };
}

/** Convert a KeyboardEvent to our InputEvent type */
export function normalizeKeyEvent(e: KeyboardEvent): InputEvent {
  return {
    type: "key_down",
    key: e.key,
    tClient: e.timeStamp,
  };
}

/**
 * Create a unified event handler for a game canvas element.
 * Returns handlers for pointer, touch, and keyboard events.
 */
export function createInputHandlers(
  onInput: (input: InputEvent) => void,
) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onInput(normalizePointerEvent(e.nativeEvent, "pointer_down"));
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      onInput(normalizePointerEvent(e.nativeEvent, "pointer_up"));
    },
    onTouchStart: (e: React.TouchEvent) => {
      const input = normalizeTouchEvent(e.nativeEvent);
      if (input) onInput(input);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      // Only handle space and enter as primary actions
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onInput(normalizeKeyEvent(e.nativeEvent));
      }
    },
  };
}
