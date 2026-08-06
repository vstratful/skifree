/**
 * Deterministic pseudo-randomness.
 *
 * The mountain is generated on demand in chunks, and the same chunk has to come
 * out identical every time it scrolls back into view. So chunk contents are
 * never drawn from a global stream — they are derived from a hash of the run
 * seed and the chunk's coordinates. Only genuinely ephemeral things (which dog
 * spawns when) use a rolling generator.
 */

/** 32-bit integer hash. Deterministic, well-mixed, no allocation. */
export function hash3(a: number, b: number, c: number): number {
  let h = a | 0;
  h = (Math.imul(h ^ (b | 0), 0x27d4eb2d) ^ (c | 0)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2d) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

export type Rng = {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [min, max). */
  range(min: number, max: number): number;
  /** Uniform integer in [min, max]. */
  int(min: number, max: number): number;
  /** Picks an index from an array of non-negative weights. */
  weighted(weights: readonly number[]): number;
  pick<T>(items: readonly T[]): T;
  /** True with the given probability. */
  chance(p: number): boolean;
};

/** mulberry32 — small, fast, and good enough for scattering trees. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    range: (min, max) => min + next() * (max - min),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    weighted(weights) {
      let total = 0;
      for (const w of weights) total += w;
      let roll = next() * total;
      for (let i = 0; i < weights.length; i++) {
        roll -= weights[i];
        if (roll < 0) return i;
      }
      return weights.length - 1;
    },
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
  };
  return rng;
}

/** A generator keyed to one chunk of the mountain. Stable across visits. */
export function chunkRng(seed: number, cx: number, cy: number): Rng {
  return createRng(hash3(seed, cx, cy));
}

/** A seed that is random enough for a new run but readable in a URL. */
export function randomSeed(): number {
  return (Math.random() * 0xffffffff) >>> 0;
}
