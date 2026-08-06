/**
 * Sound effects, synthesised on the fly.
 *
 * Nothing here is sampled — a handful of oscillator blips gets closer to 1991
 * than any recording would. (The 1991 build was in fact completely silent: it
 * imports no sound library at all. This is an addition, and `M` turns it off.)
 *
 * The context is created by {@link SoundBoard.unlock} from a user gesture, or
 * lazily on the first cue if that never happened.
 */

export type Cue =
  | "jump"
  | "land"
  | "flip"
  | "crash"
  | "bump"
  | "roar"
  | "eaten"
  | "escape"
  | "start";

type Voice = {
  type: OscillatorType;
  /** Start and end frequency in hertz. */
  from: number;
  to: number;
  duration: number;
  gain: number;
  /** Seconds to wait before this voice sounds. */
  delay?: number;
};

const CUES: Record<Cue, Voice[]> = {
  jump: [{ type: "square", from: 340, to: 700, duration: 0.11, gain: 0.16 }],
  land: [{ type: "triangle", from: 220, to: 120, duration: 0.09, gain: 0.14 }],
  flip: [
    { type: "square", from: 620, to: 900, duration: 0.07, gain: 0.13 },
    {
      type: "square",
      from: 900,
      to: 1200,
      duration: 0.07,
      gain: 0.11,
      delay: 0.07,
    },
  ],
  crash: [
    { type: "sawtooth", from: 190, to: 55, duration: 0.32, gain: 0.2 },
    {
      type: "square",
      from: 90,
      to: 40,
      duration: 0.22,
      gain: 0.12,
      delay: 0.03,
    },
  ],
  bump: [{ type: "triangle", from: 300, to: 380, duration: 0.06, gain: 0.1 }],
  roar: [
    { type: "sawtooth", from: 130, to: 70, duration: 0.55, gain: 0.24 },
    {
      type: "square",
      from: 65,
      to: 44,
      duration: 0.6,
      gain: 0.14,
      delay: 0.05,
    },
  ],
  eaten: [
    { type: "sawtooth", from: 240, to: 60, duration: 0.42, gain: 0.22 },
    {
      type: "square",
      from: 120,
      to: 50,
      duration: 0.5,
      gain: 0.16,
      delay: 0.18,
    },
    {
      type: "triangle",
      from: 70,
      to: 45,
      duration: 0.6,
      gain: 0.14,
      delay: 0.4,
    },
  ],
  escape: [
    { type: "square", from: 500, to: 760, duration: 0.1, gain: 0.14 },
    {
      type: "square",
      from: 760,
      to: 1020,
      duration: 0.1,
      gain: 0.14,
      delay: 0.1,
    },
    {
      type: "square",
      from: 1020,
      to: 1360,
      duration: 0.14,
      gain: 0.14,
      delay: 0.2,
    },
  ],
  start: [
    { type: "square", from: 440, to: 660, duration: 0.09, gain: 0.13 },
    {
      type: "square",
      from: 660,
      to: 880,
      duration: 0.12,
      gain: 0.13,
      delay: 0.09,
    },
  ],
};

/**
 * Browsers will not let an AudioContext make a sound until the page has had a
 * real user gesture. A suspended context's clock is frozen at zero, so anything
 * scheduled against `currentTime` while it is suspended lands in the past the
 * moment it resumes and is silently discarded — which is exactly how a synth
 * like this ends up mute with no error anywhere. Hence {@link SoundBoard.unlock}:
 * the context is created and resumed from a gesture handler, and `play` refuses
 * to schedule anything until the clock is actually running.
 */
export class SoundBoard {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  muted = false;

  /** Why the board is silent, if it is. Surfaced in the Options menu. */
  get status(): "ready" | "blocked" | "unsupported" {
    if (!this.context)
      return typeof window === "undefined" ? "unsupported" : "blocked";
    return this.context.state === "running" ? "ready" : "blocked";
  }

  /**
   * Creates and resumes the context. Must be called from inside a real user
   * gesture; safe to call repeatedly. Resolves once the clock is actually
   * running, so callers can report the true state rather than a stale one.
   */
  async unlock(): Promise<void> {
    const context = this.ensureContext();
    if (!context || context.state === "running") return;
    try {
      await context.resume();
    } catch {
      // Still gestureless, or the context died. `status` will say so.
    }
  }

  play(cue: Cue): void {
    if (this.muted) return;
    const context = this.ensureContext();
    if (!context || !this.master) return;

    if (context.state !== "running") {
      // Ask to be resumed, but drop this cue rather than scheduling it against a
      // frozen clock, where it would be thrown away without a sound or an error.
      void context.resume();
      return;
    }

    // A hair of lookahead, so rounding can never place a voice in the past.
    const now = context.currentTime + 0.005;
    for (const voice of CUES[cue]) {
      const start = now + (voice.delay ?? 0);
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = voice.type;
      oscillator.frequency.setValueAtTime(voice.from, start);
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, voice.to),
        start + voice.duration,
      );
      gain.gain.setValueAtTime(voice.gain, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + voice.duration);
      oscillator.connect(gain).connect(this.master);
      oscillator.start(start);
      oscillator.stop(start + voice.duration + 0.02);
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.9;
  }

  close(): void {
    void this.context?.close();
    this.context = null;
    this.master = null;
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    if (typeof window === "undefined") return null;
    // Safari still only exposes the prefixed constructor.
    const Constructor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Constructor) return null;
    try {
      this.context = new Constructor();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.context.destination);
      return this.context;
    } catch {
      return null;
    }
  }
}
