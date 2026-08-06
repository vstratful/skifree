import type { BakedSprite, SpriteLibrary } from "./sprites";
import type { ObstacleKind } from "./types";

/** What touching an object does to the skier. */
export type ObstacleEffect =
  /** Wipeout. */
  | "crash"
  /** A small involuntary hop. */
  | "bump"
  /** A big deliberate launch. */
  | "launch"
  /** Decoration; the skier passes straight through. */
  | "none";

export type ObstacleSpec = {
  /**
   * Collision box at the object's base — centred on its x, rising `h` units
   * from its y. Deliberately much smaller than the sprite: in SkiFree you
   * collide with a tree's trunk, not its canopy, which is what lets you thread
   * a gap between two trees whose branches overlap on screen.
   */
  footprint: { w: number; h: number } | null;
  /** Height above the snow the skier must exceed to fly over it. */
  clearance: number;
  effect: ObstacleEffect;
  /** 0 = snow decal, 1 = depth-sorted with the skier, 2 = overhead. */
  layer: 0 | 1 | 2;
  /** Relative frequency when scattering a chunk. Zero means placed explicitly. */
  weight: number;
  /** Minimum distance to the nearest neighbour when scattering. */
  spacing: number;
};

export const OBSTACLES: Record<ObstacleKind, ObstacleSpec> = {
  treeTall: {
    footprint: { w: 9, h: 5 },
    clearance: Number.POSITIVE_INFINITY,
    effect: "crash",
    layer: 1,
    weight: 20,
    spacing: 21,
  },
  treeShort: {
    footprint: { w: 8, h: 5 },
    clearance: Number.POSITIVE_INFINITY,
    effect: "crash",
    layer: 1,
    weight: 13,
    spacing: 16,
  },
  treeBare: {
    footprint: { w: 7, h: 4 },
    clearance: Number.POSITIVE_INFINITY,
    effect: "crash",
    layer: 1,
    weight: 5,
    spacing: 16,
  },
  stump: {
    footprint: { w: 9, h: 6 },
    clearance: 15,
    effect: "crash",
    layer: 1,
    weight: 7,
    spacing: 13,
  },
  rock: {
    footprint: { w: 14, h: 8 },
    clearance: 17,
    effect: "crash",
    layer: 1,
    weight: 9,
    spacing: 17,
  },
  rockSmall: {
    footprint: { w: 9, h: 5 },
    clearance: 11,
    effect: "crash",
    layer: 1,
    weight: 7,
    spacing: 12,
  },
  mogul: {
    footprint: { w: 16, h: 6 },
    clearance: 5,
    effect: "bump",
    layer: 0,
    weight: 15,
    spacing: 19,
  },
  ramp: {
    footprint: { w: 20, h: 9 },
    clearance: 4,
    effect: "launch",
    layer: 1,
    weight: 4,
    spacing: 32,
  },
  snowPatch: {
    footprint: null,
    clearance: 0,
    effect: "none",
    layer: 0,
    weight: 12,
    spacing: 8,
  },
  sign: {
    footprint: { w: 5, h: 4 },
    clearance: Number.POSITIVE_INFINITY,
    effect: "crash",
    layer: 1,
    weight: 2,
    spacing: 15,
  },
  liftTower: {
    footprint: { w: 11, h: 7 },
    clearance: Number.POSITIVE_INFINITY,
    effect: "crash",
    layer: 1,
    weight: 0,
    spacing: 0,
  },
};

/** The kinds that chunk scattering draws from, with their weights alongside. */
export const SCATTER_KINDS: readonly ObstacleKind[] = (
  Object.keys(OBSTACLES) as ObstacleKind[]
).filter((kind) => OBSTACLES[kind].weight > 0);

export const SCATTER_WEIGHTS: readonly number[] = SCATTER_KINDS.map(
  (kind) => OBSTACLES[kind].weight,
);

export function obstacleSprite(
  sprites: SpriteLibrary,
  kind: ObstacleKind,
): BakedSprite {
  return kind === "liftTower" ? sprites.lift.tower : sprites.terrain[kind];
}
