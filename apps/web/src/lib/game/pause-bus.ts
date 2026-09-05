/**
 * Tiny pause bus between the play layout (pause modal / Exit flow) and the
 * GameShell arena. The layout owns the chrome and modal, the shell owns the
 * runner — the bus carries "pause the runner now" without coupling them.
 *
 * The current state is replayed to new subscribers so a shell that mounts
 * while the pause modal is already open (e.g. during session boot) starts
 * paused instead of running behind the modal.
 */

type PauseListener = (paused: boolean) => void;

let paused = false;
const listeners = new Set<PauseListener>();

/** Publish a pause/resume request (no-op when unchanged). */
export function setPausedExternal(next: boolean): void {
  if (next === paused) return;
  paused = next;
  for (const listener of [...listeners]) {
    listener(next);
  }
}

/** Subscribe; the callback fires immediately with the current state. */
export function subscribePause(listener: PauseListener): () => void {
  listeners.add(listener);
  listener(paused);
  return () => {
    listeners.delete(listener);
  };
}
