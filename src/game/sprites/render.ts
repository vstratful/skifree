import { PALETTE, type PaletteKey } from "./palette";
import type { BakedSprite, SpriteDef } from "./types";

/**
 * Turns hand-authored character grids into blittable bitmaps.
 *
 * This is the single choke point every sprite passes through, so it is also
 * where the sprite contract is enforced: a ragged row or a character outside
 * the palette throws here, naming the offending sprite, instead of silently
 * rendering as a smear. Sprites are baked once per session and reused.
 */

type Surface = {
  canvas: CanvasImageSource;
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
};

function createSurface(width: number, height: number): Surface {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("sprite baking needs a 2d context");
    return { canvas, ctx };
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("sprite baking needs a 2d context");
  return { canvas, ctx };
}

const RGB_CACHE = new Map<string, readonly [number, number, number]>();

function toRgb(hex: string): readonly [number, number, number] {
  const cached = RGB_CACHE.get(hex);
  if (cached) return cached;
  const value = Number.parseInt(hex.slice(1), 16);
  const rgb = [
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ] as const;
  RGB_CACHE.set(hex, rgb);
  return rgb;
}

export function bakeSprite(def: SpriteDef, name: string): BakedSprite {
  const { rows } = def;
  if (rows.length === 0) throw new Error(`sprite "${name}" has no rows`);

  const width = rows[0].length;
  const height = rows.length;
  if (width === 0) throw new Error(`sprite "${name}" has zero-width rows`);

  const { canvas, ctx } = createSurface(width, height);
  const image = ctx.createImageData(width, height);
  const data = image.data;

  for (let y = 0; y < height; y++) {
    const row = rows[y];
    if (row.length !== width) {
      throw new Error(
        `sprite "${name}" row ${y} is ${row.length} px wide, expected ${width} — ` +
          `every row of a sprite must be the same length`,
      );
    }
    for (let x = 0; x < width; x++) {
      const key = row[x] as PaletteKey;
      if (!(key in PALETTE)) {
        throw new Error(
          `sprite "${name}" row ${y} col ${x} uses "${key}", which is not in the palette`,
        );
      }
      const hex = PALETTE[key];
      if (hex === null) continue; // transparent
      const [r, g, b] = toRgb(hex);
      const i = (y * width + x) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  const anchor = def.anchor ?? [Math.floor(width / 2), height - 1];
  const [anchorX, anchorY] = anchor;
  if (anchorX < 0 || anchorX >= width || anchorY < 0 || anchorY >= height) {
    throw new Error(
      `sprite "${name}" anchor ${anchorX},${anchorY} falls outside its ${width}x${height} bounds`,
    );
  }

  return { canvas, width, height, anchorX, anchorY };
}

export function bakeSheet<K extends string>(
  sheet: Readonly<Record<K, SpriteDef>>,
  label: string,
): Record<K, BakedSprite> {
  const baked = {} as Record<K, BakedSprite>;
  for (const key of Object.keys(sheet) as K[]) {
    baked[key] = bakeSprite(sheet[key], `${label}.${key}`);
  }
  return baked;
}

/**
 * Blits a baked sprite so its anchor lands on the given device-pixel position.
 * `zoom` must be an integer and smoothing must already be off on the context,
 * or the pixel art will go soft.
 */
export function blit(
  ctx: CanvasRenderingContext2D,
  sprite: BakedSprite,
  anchorScreenX: number,
  anchorScreenY: number,
  zoom: number,
): void {
  ctx.drawImage(
    sprite.canvas,
    Math.round(anchorScreenX - sprite.anchorX * zoom),
    Math.round(anchorScreenY - sprite.anchorY * zoom),
    sprite.width * zoom,
    sprite.height * zoom,
  );
}

/** Blits with reduced opacity — used for the monster fading in from the mist. */
export function blitFaded(
  ctx: CanvasRenderingContext2D,
  sprite: BakedSprite,
  anchorScreenX: number,
  anchorScreenY: number,
  zoom: number,
  alpha: number,
): void {
  const previous = ctx.globalAlpha;
  ctx.globalAlpha = alpha;
  blit(ctx, sprite, anchorScreenX, anchorScreenY, zoom);
  ctx.globalAlpha = previous;
}
