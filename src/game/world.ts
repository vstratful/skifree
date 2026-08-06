import { OBSTACLES, SCATTER_KINDS, SCATTER_WEIGHTS } from "./catalog";
import {
  CHUNK_SIZE,
  LIFT_CORRIDOR,
  LIFT_PHASE,
  LIFT_SPACING,
  OBJECTS_PER_CHUNK,
  TOWER_SPACING,
  UNITS_PER_METRE,
  WARMUP_METRES,
} from "./constants";
import { chunkRng } from "./rng";
import type { Obstacle } from "./types";

/** The starting gate is kept clear so nobody spawns inside a spruce. */
const START_CLEAR = { x0: -46, y0: -40, x1: 46, y1: 96 };

type Chunk = {
  readonly cx: number;
  readonly cy: number;
  readonly obstacles: readonly Obstacle[];
};

/** World x of chairlift line `index`. Lines are offset by {@link LIFT_PHASE}. */
export function liftLineX(index: number): number {
  return LIFT_PHASE + index * LIFT_SPACING;
}

/** Signed distance from x to the nearest chairlift line. */
export function liftOffset(x: number): number {
  return x - liftLineX(Math.round((x - LIFT_PHASE) / LIFT_SPACING));
}

/** Inclusive range of lift line indices whose lines fall between x0 and x1. */
export function liftLineRange(
  x0: number,
  x1: number,
): { first: number; last: number } {
  return {
    first: Math.ceil((x0 - LIFT_PHASE) / LIFT_SPACING),
    last: Math.floor((x1 - LIFT_PHASE) / LIFT_SPACING),
  };
}

/**
 * The mountain: infinite in both directions, generated on demand in square
 * chunks and cached.
 *
 * Chunk contents are derived purely from the run seed plus the chunk's
 * coordinates, never from a rolling stream, so a chunk that scrolls off screen
 * and back comes out byte-identical. That is what lets the cache be pruned
 * aggressively without the slope visibly rearranging itself behind you.
 */
export class Mountain {
  private readonly chunks = new Map<string, Chunk>();

  constructor(readonly seed: number) {}

  /**
   * Appends every obstacle whose position falls inside the given world-space
   * rectangle to `into`. Callers that need sprites drawn should pad the
   * rectangle by the tallest sprite, since an obstacle anchored just off screen
   * can still have visible branches.
   */
  collect(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    into: Obstacle[],
  ): Obstacle[] {
    const cx0 = Math.floor(x0 / CHUNK_SIZE);
    const cx1 = Math.floor(x1 / CHUNK_SIZE);
    const cy0 = Math.floor(y0 / CHUNK_SIZE);
    const cy1 = Math.floor(y1 / CHUNK_SIZE);

    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        for (const obstacle of this.chunk(cx, cy).obstacles) {
          if (
            obstacle.x >= x0 &&
            obstacle.x <= x1 &&
            obstacle.y >= y0 &&
            obstacle.y <= y1
          ) {
            into.push(obstacle);
          }
        }
      }
    }
    return into;
  }

  /** Drops cached chunks further than `radius` units from the given point. */
  prune(centreX: number, centreY: number, radius: number): void {
    for (const [key, chunk] of this.chunks) {
      const midX = (chunk.cx + 0.5) * CHUNK_SIZE;
      const midY = (chunk.cy + 0.5) * CHUNK_SIZE;
      if (
        Math.abs(midX - centreX) > radius ||
        Math.abs(midY - centreY) > radius
      ) {
        this.chunks.delete(key);
      }
    }
  }

  private chunk(cx: number, cy: number): Chunk {
    const key = `${cx}:${cy}`;
    const cached = this.chunks.get(key);
    if (cached) return cached;
    const chunk: Chunk = { cx, cy, obstacles: this.generate(cx, cy) };
    this.chunks.set(key, chunk);
    return chunk;
  }

  private generate(cx: number, cy: number): Obstacle[] {
    const rng = chunkRng(this.seed, cx, cy);
    const originX = cx * CHUNK_SIZE;
    const originY = cy * CHUNK_SIZE;
    const obstacles: Obstacle[] = [];

    // Pylons first, on a deterministic grid, so the scatter pass can avoid the
    // corridor they run through.
    const lines = liftLineRange(originX, originX + CHUNK_SIZE - 1);
    for (let line = lines.first; line <= lines.last; line++) {
      const firstTower = Math.ceil(originY / TOWER_SPACING);
      const lastTower = Math.floor((originY + CHUNK_SIZE - 1) / TOWER_SPACING);
      for (let tower = firstTower; tower <= lastTower; tower++) {
        obstacles.push({
          kind: "liftTower",
          x: liftLineX(line),
          y: tower * TOWER_SPACING,
        });
      }
    }

    const metres = originY / UNITS_PER_METRE;
    const density =
      metres < 0 ? 1 : Math.min(1, 0.35 + (0.65 * metres) / WARMUP_METRES);
    const target = Math.round(OBJECTS_PER_CHUNK * density);

    for (let i = 0; i < target; i++) {
      const kind = SCATTER_KINDS[rng.weighted(SCATTER_WEIGHTS)];
      const spec = OBSTACLES[kind];
      const solid = spec.footprint !== null;

      // Three attempts per object: enough to avoid clumping without ever
      // looping long enough to matter.
      for (let attempt = 0; attempt < 3; attempt++) {
        const x = originX + rng.next() * CHUNK_SIZE;
        const y = originY + rng.next() * CHUNK_SIZE;

        if (solid) {
          if (Math.abs(liftOffset(x)) < LIFT_CORRIDOR) continue;
          if (
            x > START_CLEAR.x0 &&
            x < START_CLEAR.x1 &&
            y > START_CLEAR.y0 &&
            y < START_CLEAR.y1
          ) {
            continue;
          }
          if (tooClose(obstacles, x, y, spec.spacing)) continue;
        }

        obstacles.push({ kind, x, y });
        break;
      }
    }

    return obstacles;
  }
}

function tooClose(
  placed: readonly Obstacle[],
  x: number,
  y: number,
  spacing: number,
): boolean {
  for (const other of placed) {
    const otherSpacing = OBSTACLES[other.kind].spacing;
    if (otherSpacing === 0 && other.kind !== "liftTower") continue;
    const limit = Math.max(spacing, otherSpacing, 14);
    if (Math.abs(other.x - x) < limit && Math.abs(other.y - y) < limit) {
      return true;
    }
  }
  return false;
}
