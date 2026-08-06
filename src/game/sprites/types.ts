import type { PaletteKey } from "./palette";

/**
 * A hand-authored pixel-art sprite.
 *
 * `rows` is the image, top row first, one character per pixel, drawn from
 * {@link PaletteKey}. Every row must be exactly the same length — the sprite
 * baker asserts this at module load so a ragged sprite fails loudly in dev
 * rather than rendering as a smear.
 */
export type SpriteDef = {
  readonly rows: readonly string[];
  /**
   * The pixel that is pinned to the entity's world position, as `[x, y]` in
   * sprite-local pixel coordinates. Defaults to the bottom-centre pixel, which
   * is where an object meets the snow. Anything that hovers (a chairlift chair,
   * an airborne skier) overrides this.
   */
  readonly anchor?: readonly [x: number, y: number];
};

/** A sprite baked onto an offscreen canvas, ready to blit. */
export type BakedSprite = {
  readonly canvas: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  readonly anchorX: number;
  readonly anchorY: number;
};

export type SpriteSheet<K extends string> = Readonly<Record<K, SpriteDef>>;

/** Narrow a raw authored row set to the palette characters. Compile-time only. */
export type PaletteRow = string & { readonly __palette?: PaletteKey };
