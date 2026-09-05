/**
 * Sound effects system using Web Audio API.
 * All sounds are synthesized — no external audio files needed.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** Resume audio context (required after user gesture on some browsers) */
export function resumeAudio(): void {
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
}

/** Play a synthesized tone */
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  detune = 0,
): void {
  if (!settings.enabled) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;
    osc.detune.value = detune;

    gain.gain.setValueAtTime(volume * settings.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available — silently fail
  }
}

/** Play a chord (multiple frequencies) */
function playChord(
  frequencies: number[],
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.2,
): void {
  frequencies.forEach((f, i) => {
    setTimeout(() => playTone(f, duration, type, volume), i * 50);
  });
}

// ── Sound effects ──────────────────────────────────────

/** Correct answer — happy ascending chime */
export function playCorrect(): void {
  playChord([523, 659, 784], 0.3, "sine", 0.25); // C5 E5 G5
}

/** Wrong answer — descending buzz */
export function playWrong(): void {
  playTone(200, 0.25, "sawtooth", 0.15);
  setTimeout(() => playTone(150, 0.3, "sawtooth", 0.1), 80);
}

/** Timeout — soft warning tone */
export function playTimeout(): void {
  playTone(440, 0.15, "sine", 0.15);
  setTimeout(() => playTone(330, 0.2, "sine", 0.1), 100);
}

/** Click / tap — subtle feedback */
export function playClick(): void {
  playTone(800, 0.05, "sine", 0.1);
}

/** Rule switch alert — attention-getting two-tone */
export function playSwitch(): void {
  playTone(880, 0.12, "square", 0.15);
  setTimeout(() => playTone(1100, 0.12, "square", 0.12), 120);
}

/** Countdown beep */
export function playCountdown(): void {
  playTone(660, 0.1, "sine", 0.2);
}

/** Countdown final (go!) */
export function playGo(): void {
  playChord([660, 880, 1100], 0.2, "sine", 0.25);
}

/** Practice complete — gentle chime */
export function playPracticeComplete(): void {
  playChord([440, 554, 659], 0.4, "sine", 0.2);
}

/** Game complete — victory fanfare */
export function playGameComplete(): void {
  const notes = [523, 587, 659, 784, 880, 1047];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, "sine", 0.2), i * 100);
  });
}

/** Stop signal — urgent tone */
export function playStopSignal(): void {
  playTone(1000, 0.08, "square", 0.2);
  setTimeout(() => playTone(1000, 0.08, "square", 0.2), 100);
}

/** Streak bonus — sparkle */
export function playStreak(): void {
  playTone(1200, 0.1, "sine", 0.15);
  setTimeout(() => playTone(1500, 0.1, "sine", 0.12), 60);
  setTimeout(() => playTone(1800, 0.15, "sine", 0.1), 120);
}

// ── Mascot reactions ────────────────────────────────────

/** Correct answer — playful happy "boop-boop!" blip (triangle sparkle). */
export function playMascotCheer(): void {
  playTone(740, 0.09, "triangle", 0.26);
  setTimeout(() => playTone(988, 0.09, "triangle", 0.24), 70);
  setTimeout(() => playTone(1319, 0.16, "triangle", 0.2), 140);
}

/** Miss — soft, warm encouragement (gentle descending hum, never a harsh buzz). */
export function playMascotEncourage(): void {
  playTone(523, 0.16, "sine", 0.16);
  setTimeout(() => playTone(392, 0.26, "sine", 0.14), 130);
}

// ── Sound manager ──────────────────────────────────────

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-1
}

const defaultSettings: SoundSettings = {
  enabled: true,
  volume: 0.7,
};

let settings = { ...defaultSettings };

export function getSoundSettings(): SoundSettings {
  return { ...settings };
}

export function isSoundEnabled(): boolean {
  return settings.enabled;
}

export function setSoundSettings(s: Partial<SoundSettings>): void {
  settings = { ...settings, ...s };
}

export function toggleSound(): boolean {
  settings.enabled = !settings.enabled;
  return settings.enabled;
}
