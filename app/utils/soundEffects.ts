// Web Audio API synthesizers for zero-latency, cross-platform audio effects

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Pleasant rising chime when someone requests +time (e.g. C5 -> G5)
 */
export function playTimeRequestSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Two-tone rising chime (523.25Hz -> 783.99Hz)
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(783.99, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (err) {
    console.warn('[Sound] playTimeRequestSound error:', err);
  }
}

/**
 * Triumphant arcade celebration sound when +time is successfully added (D5 -> G5 -> C6 -> E6)
 */
export function playTimeExtendedSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 783.99, 1046.5, 1318.51];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);

      const startTime = now + idx * 0.075;
      const duration = 0.35;

      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.24, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (err) {
    console.warn('[Sound] playTimeExtendedSound error:', err);
  }
}

/**
 * Soft tick sound for switching audio output route
 */
export function playRouteSwitchSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(440, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.start(now);
    osc.stop(now + 0.08);
  } catch (err) {
    console.warn('[Sound] playRouteSwitchSound error:', err);
  }
}
