/**
 * The fixed colour palette every sprite in the game is drawn from.
 *
 * Sprites are authored as arrays of strings, one character per pixel, where
 * each character is a key in this map. `.` means transparent. Keeping every
 * sprite on one small palette is what makes the whole slope read as a single
 * 1991 EGA-era screenshot rather than a collage.
 */
export const PALETTE = {
  ".": null, // transparent
  K: "#000000", // black — outlines
  D: "#4a4a4a", // dark grey — deep shade, rock crevices
  A: "#8c8c8c", // grey — rock body, lift steel
  H: "#c8c8c8", // light grey — rock highlight
  W: "#ffffff", // white — snow, highlights
  S: "#c3d2e2", // snow shadow — dents and mogul shading
  Z: "#8fb4d8", // ice blue — deeper snow shadow, packed ice
  N: "#16265e", // navy — dark clothing, boots
  B: "#1e46b4", // blue — jacket, skis
  C: "#56aaf0", // cyan — highlight on blue, yeti fur shade
  R: "#cc2222", // red — jacket, flags, blood-free comedy violence
  P: "#f08a7a", // pink — light red, tongue
  O: "#ef8b18", // orange — hat, ramp, warning signs
  Y: "#efd028", // yellow — signs, dog, sparks
  E: "#0b5124", // dark green — conifer shade
  G: "#17913c", // green — conifer body
  L: "#56c162", // light green — conifer highlight
  M: "#45280f", // dark brown — trunk shade
  T: "#8b5a24", // brown — trunk, stump, dog
  U: "#cfa46a", // tan — cut wood, dog belly
  F: "#f4c8a0", // flesh — faces and hands
  V: "#7a5cf0", // violet — snowboarder gear
  X: "#b024a8", // magenta — snowboarder gear accent
} as const satisfies Record<string, string | null>;

export type PaletteKey = keyof typeof PALETTE;

/** Every character a sprite row is allowed to contain. */
export const PALETTE_KEYS = Object.keys(PALETTE) as PaletteKey[];
