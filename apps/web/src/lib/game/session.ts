/**
 * Client helpers for server-backed game runs.
 *
 * Previously the game shell ran with throwaway client-side ids ("session-…",
 * "run-…"), so every telemetry batch was rejected by the server (no such game
 * run) and the LocalEventBuffer dropped it after max retries. Real game runs
 * belong to a training session that belongs to a child profile, so before a
 * game starts we resolve (or create) an active session for the child, then
 * create a real game run and use its server id for telemetry + lifecycle.
 *
 * The promises are deduplicated by key: React StrictMode double-invokes mount
 * effects in dev, and two concurrent creates would leak orphan sessions/runs.
 */

interface Envelope<T> {
  data: T;
}

interface TrainingSessionSummary {
  id: string;
  status: string;
}

interface GameRunRecord {
  id: string;
  sessionId: string;
}

export interface ActiveRun {
  /** Server training session id */
  sessionId: string;
  /** Server game run id (used for telemetry) */
  gameRunId: string;
}

export class SessionError extends Error {
  code?: string;
  status?: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    const err = new SessionError("Tidak dapat terhubung ke server.");
    throw err;
  }

  let json: Envelope<T> & { error?: { code?: string; message?: string } } = {} as never;
  try {
    json = (await res.json()) as typeof json;
  } catch {
    // non-JSON error body — fall through to generic message
  }

  if (!res.ok) {
    const err = new SessionError(json?.error?.message ?? `Permintaan gagal (${res.status})`);
    err.code = json?.error?.code;
    err.status = res.status;
    throw err;
  }
  return json.data;
}

// ── Sessions ──────────────────────────────────────────────

async function listActiveSession(childId: string): Promise<string | null> {
  const data = await request<{ sessions: TrainingSessionSummary[] }>(
    `/api/training/sessions?childId=${encodeURIComponent(childId)}`,
  );
  const active = data.sessions.find(
    (s) => s.status === "pending" || s.status === "in_progress",
  );
  return active?.id ?? null;
}

async function ensureSessionOnce(childId: string): Promise<string> {
  const existing = await listActiveSession(childId);
  if (existing) return existing;

  try {
    const data = await request<{ sessionId: string }>("/api/training/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId }),
    });
    return data.sessionId;
  } catch (err) {
    // Another tab/effect created the session concurrently → reuse it.
    if (err instanceof SessionError && err.code === "CONFLICT") {
      const fallback = await listActiveSession(childId);
      if (fallback) return fallback;
    }
    throw err;
  }
}

const sessionPromises = new Map<string, Promise<string>>();

/** Resolve the active session for a child, creating one if needed. */
export function ensureSession(childId: string): Promise<string> {
  let pending = sessionPromises.get(childId);
  if (!pending) {
    pending = ensureSessionOnce(childId).finally(() => sessionPromises.delete(childId));
    sessionPromises.set(childId, pending);
  }
  return pending;
}

// ── Game runs ─────────────────────────────────────────────

async function createRunOnce(
  childId: string,
  gameKey: string,
  gameVersion: string,
  difficulty: number,
): Promise<ActiveRun> {
  const sessionId = await ensureSession(childId);
  const run = await request<GameRunRecord>("/api/game-runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      gameKey,
      gameVersion,
      configuration: { difficulty },
    }),
  });
  return { sessionId: run.sessionId, gameRunId: run.id };
}

const runPromises = new Map<string, Promise<ActiveRun>>();

/**
 * Create (or reuse an in-flight) game run for a child + game + difficulty.
 * Concurrent callers — StrictMode remounts — share one server-side run.
 */
export function createGameRun(
  childId: string,
  gameKey: string,
  gameVersion: string,
  difficulty: number,
): Promise<ActiveRun> {
  const key = `${childId}|${gameKey}|${difficulty}`;
  let pending = runPromises.get(key);
  if (!pending) {
    pending = createRunOnce(childId, gameKey, gameVersion, difficulty).finally(() =>
      runPromises.delete(key),
    );
    runPromises.set(key, pending);
  }
  return pending;
}

/** Mark the run as in_progress (fires when the countdown ends). */
export async function startGameRun(gameRunId: string): Promise<void> {
  await request(`/api/game-runs/${encodeURIComponent(gameRunId)}/start`, { method: "POST" });
}

/** Finalize the run: completed (metrics + adaptive state) or interrupted. */
export async function finishGameRun(
  gameRunId: string,
  status: "completed" | "interrupted",
): Promise<void> {
  await request(`/api/game-runs/${encodeURIComponent(gameRunId)}/finish`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}
