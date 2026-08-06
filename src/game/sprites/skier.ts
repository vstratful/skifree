import type { SpriteDef } from "./types";

/**
 * The player skier, seen from behind and slightly above, heading away from the
 * camera down the fall line.
 *
 * Palette contract for the whole set, so every frame reads as one character:
 * navy (`N`) hat and trousers, dark-brown (`M`) hair on the back of the head,
 * red (`R`) jacket, skis shaded blue (`B`) and cyan (`C`), grey/black (`A`/`K`)
 * poles, and flesh (`F`) only for the hands and, in the sideways poses, the one
 * visible cheek.
 *
 * Light comes from the upper left across the whole game, so the cyan lit edge of
 * a ski is always its *left* column — or the upper of two skis lying across the
 * slope. Never mirror it outward onto the right-hand ski: that reads as two
 * light sources. Cyan is also what stops the skis merging into the navy
 * trousers, so every ski keeps one.
 */
export const SKIER_SPRITES = {
  // Straight down the fall line, seen from directly behind: hat, back of the
  // head, red jacket, two parallel skis pointing away, poles trailing out.
  down: {
    rows: [
      ".............",
      "....KKKKK....",
      "....KNNNK....",
      "...KKNNNKK...",
      "....KMMMK....",
      "...KRRRRRK...",
      "..KRRRRRRRK..",
      "..KRRRRRRRK..",
      ".KKFRRRRRFKK.",
      ".K.KRRRRRK.K.",
      ".K.KRRRRRK.K.",
      "K..KNNKNNK..K",
      "K..KNK.KNK..K",
      "..KNNK.KNNK..",
      "..KCBK.KCBK..",
      "..KCBK.KCBK..",
      "..KCBK.KCBK..",
      "..KKKK.KKKK..",
    ],
  },

  // Barely off the fall line — the original's shallow state steers at about five
  // degrees, so this deliberately looks almost like `down`. The give-away is the
  // one-pixel slant on the skis.
  shallowLeft: {
    rows: [
      "..............",
      ".....KKKKK....",
      ".....KNNNK....",
      "....KKNNNKK...",
      ".....KMMMK....",
      "....KRRRRRK...",
      "...KRRRRRRRK..",
      "...KRRRRRRRK..",
      "..KKFRRRRRFKK.",
      "..K.KRRRRRK.K.",
      "..K.KRRRRRK.K.",
      ".K..KNNKNNK..K",
      ".K.KKNK.KNK..K",
      "..KNNK.KNNK...",
      "..KCBK.KCBK...",
      ".KCBK.KCBK....",
      ".KCBK.KCBK....",
      ".KKKK.KKKK....",
    ],
  },

  /** Mirror of {@link shallowLeft}. */
  shallowRight: {
    rows: [
      "..............",
      "....KKKKK.....",
      "....KNNNK.....",
      "...KKNNNKK....",
      "....KMMMK.....",
      "...KRRRRRK....",
      "..KRRRRRRRK...",
      "..KRRRRRRRK...",
      ".KKFRRRRRFKK..",
      ".K.KRRRRRK.K..",
      ".K.KRRRRRK.K..",
      "K..KNNKNNK..K.",
      "K..KNK.KNKK.K.",
      "...KNNK.KNNK..",
      "...KCBK.KCBK..",
      "....KCBK.KCBK.",
      "....KCBK.KCBK.",
      "....KKKK.KKKK.",
    ],
  },

  // Angled down-left: the upper body stays uphill (to the right) while both
  // skis run away at roughly 45 degrees toward the lower left. Only the outside
  // pole shows — the inside one is hidden in front of the body.
  leftDown: {
    rows: [
      "......KKKKK....",
      "......KNNNK....",
      ".....KKNNNKK...",
      "......KMMMK....",
      ".....KRRRRRK...",
      "....KRRRRRRRK..",
      "....KFRRRRRFK.K",
      "....KRRRRRRRK.K",
      "....KNNNKNNNK.K",
      "....KNNK.KNNK.K",
      "...KCBK..KNNK..",
      "...KCBK..KCBK..",
      "..KCBK..KCBK...",
      "..KCBK..KCBK...",
      ".KCBK..KCBK....",
      ".KKKK..KCBK....",
      ".......KKKK....",
    ],
  },

  // Exact column-reversed mirror of leftDown.
  rightDown: {
    rows: [
      "....KKKKK......",
      "....KNNNK......",
      "...KKNNNKK.....",
      "....KMMMK......",
      "...KRRRRRK.....",
      "..KRRRRRRRK....",
      "K.KFRRRRRFK....",
      "K.KRRRRRRRK....",
      "K.KNNNKNNNK....",
      "K.KNNK.KNNK....",
      "..KNNK..KCBK...",
      "..KCBK..KCBK...",
      "...KCBK..KCBK..",
      "...KCBK..KCBK..",
      "....KCBK..KCBK.",
      "....KCBK..KKKK.",
      "....KKKK.......",
    ],
  },

  // Full sideways traverse / hockey stop: both skis lie across the slope
  // pointing left, body in profile with the cheek and the leading hand
  // showing, weight settled back into the hill. The far ski is the lit one.
  // The near ski is deliberately offset a few columns downhill of the far one
  // so the far tip and the near tail both stick out past their neighbour —
  // align them and the pair collapses into one unreadable slab.
  left: {
    rows: [
      ".......KKKKK....",
      ".......KNNNK....",
      "......KKNNNKK...",
      ".......KFMMK....",
      "......KRRRRRK...",
      ".....KFRRRRRK.K.",
      "....KRRRRRRRK.K.",
      "....KRRRRRRK..K.",
      "...KNNNNNNK...K.",
      ".K.KNNKKNNK.....",
      ".KKKKKKKKKKK....",
      ".KCCCCCCCCCK....",
      ".KKKKKKKKKKKKKK.",
      "....KBBBBBBBBBK.",
      "....KKKKKKKKKKK.",
    ],
  },

  // Exact column-reversed mirror of left.
  right: {
    rows: [
      "....KKKKK.......",
      "....KNNNK.......",
      "...KKNNNKK......",
      "....KMMFK.......",
      "...KRRRRRK......",
      ".K.KRRRRRFK.....",
      ".K.KRRRRRRRK....",
      ".K..KRRRRRRK....",
      ".K...KNNNNNNK...",
      ".....KNNKKNNK.K.",
      "....KKKKKKKKKKK.",
      "....KCCCCCCCCCK.",
      ".KKKKKKKKKKKKKK.",
      ".KBBBBBBBBBK....",
      ".KKKKKKKKKKK....",
    ],
  },

  // Crouched racing tuck, straight down the fall line: no neck, rounded back,
  // poles clamped in under the arms. Lower and stubbier than `down`.
  tuck: {
    rows: [
      ".............",
      "....KKKKK....",
      "....KNNNK....",
      "...KKNNNKK...",
      "..KKRRRRRKK..",
      ".KRRRRRRRRRK.",
      ".KRRRRRRRRRK.",
      "..KRRRRRRRK..",
      "..KKRRRRRKK..",
      ".K.KNNNNNK.K.",
      "K..KNNKNNK..K",
      "K..KNK.KNK..K",
      "..KCBK.KCBK..",
      "..KCBK.KCBK..",
      "..KCBK.KCBK..",
      "..KKKK.KKKK..",
    ],
  },

  // Airborne: arms flung out for balance, knees pulled up short, skis pressed
  // together with the tips flared and cocked up toward the camera.
  jump: {
    rows: [
      ".....KKKKK....",
      ".....KNNNK....",
      "....KKNNNKK...",
      ".....KMMMK....",
      "....KRRRRRK...",
      ".KKKRRRRRKKK..",
      ".KFRRRRRRRRFK.",
      ".KKKRRRRRKKK..",
      "...KRRRRRK....",
      "...KNNNNNK....",
      "...KNNNNNK....",
      "...KCBKKCBK...",
      "...KCBKKCBK...",
      "..KKCBKKCBKK..",
      "..KCCCKKCCCK..",
      "..KKKKKKKKKK..",
    ],
  },

  // Forward somersault, frame 1: tipped forward roughly 70 degrees, so the head
  // has swung out to the right and the skis have risen behind on the left, where
  // they fork apart. Frames 1-4 rotate clockwise a quarter-turn at a time —
  // head right, head down, head left, head up — so keep them in that order.
  flip1: {
    rows: [
      "................",
      ".......KKK......",
      ".......KFK......",
      ".....KKKRKKKKKK.",
      ".KKKKKRRRRKMNNK.",
      ".KCCNKRRRRKMNNK.",
      ".KCCNKRRRRKMNNK.",
      ".KKKKKRRRRKMNNK.",
      ".....KRRRRKKKKK.",
      ".....KRRRRK.....",
      ".KKKKKRRRRK.....",
      ".KBBNKRRRRK.....",
      ".KBBNKRRRRK.....",
      ".KKKKKKKRKK.....",
      ".......KFK......",
      ".......KKK......",
    ],
  },

  // Frame 2: fully inverted — skis straight up at the top of the frame with
  // their tips flared, hat and head at the bottom, arms out.
  flip2: {
    rows: [
      "................",
      "...KKKK..KKKK...",
      "...KCBK..KCBK...",
      "...KCBK..KCBK...",
      "...KCBK..KCBK...",
      "...KNNK..KNNK...",
      "...KNNKKKKNNK...",
      "....KNNNNNNK....",
      "..KKKRRRRRRKKK..",
      "..KFRRRRRRRRFK..",
      "..KKKRRRRRRKKK..",
      "....KKRRRRKK....",
      ".....KMMMMK.....",
      "....KNNNNNNK....",
      ".....KKKKKK.....",
      "................",
    ],
  },

  // Frame 3: coming round — body fully horizontal, hat and head out to the
  // left, hands flailing above and below, both skis forked out to the right.
  flip3: {
    rows: [
      "................",
      ".......KKK......",
      ".......KFK......",
      ".....KKKRKKKKKK.",
      ".....KRRRRKNCCK.",
      ".KKKKKRRRRKNCCK.",
      ".KNNMKRRRRKKKKK.",
      ".KNNMKRRRRK.....",
      ".KNNMKRRRRKKKKK.",
      ".KNNMKRRRRKNBBK.",
      ".KKKKKRRRRKNBBK.",
      ".....KRRRRKKKKK.",
      ".....KKKRKK.....",
      ".......KFK......",
      ".......KKK......",
      "................",
    ],
  },

  // Frame 4: nearly upright again, still leaning, skis swinging back down
  // underneath the body.
  flip4: {
    rows: [
      "................",
      ".....KKKKK......",
      ".....KNNNK......",
      "....KKNNNKK.....",
      ".....KMMMK......",
      "....KRRRRRK.....",
      "...KRRRRRRRK....",
      "...KFRRRRRFK....",
      "...KRRRRRRRK....",
      "....KNNNKNNK....",
      ".....KNK.KNK....",
      "....KCBK.KCBK...",
      "....KCBK.KCBK...",
      ".....KCBK.KCBK..",
      ".....KCBK.KCBK..",
      ".....KKKK.KKKK..",
    ],
  },

  // The wipeout: skier face-down and sprawled with one arm flung straight up,
  // legs trailing off to the right, still lying across one ski, the other ski
  // detached and stuck bolt upright in the snow, both poles thrown clear.
  crash: {
    rows: [
      "........KK........",
      ".KK.......KK......",
      "...KK........KKKK.",
      ".....K.KKK...KCCK.",
      ".......KRK...KCCK.",
      "..KKKK.KRK...KCCK.",
      "..KNNK.KRK...KCCK.",
      "..KMMKKRRRK..KCCK.",
      "...KKRRRRRKK.KCCK.",
      "...KKRRRRKNK.KCCK.",
      "..KFKKRRKNNK.KCCK.",
      "..KBBBBBBBBK.KCCK.",
      "..KKKKKKKKKK.KKKK.",
    ],
  },

  // Sat down in the snow, recovering. Legs splayed outward with the skis kicked
  // wide, and a body wider than it is tall — two legs hanging straight down read
  // as an arch rather than as someone sitting. The notch of black between the
  // hips is load-bearing: without it the seat band overhangs bare snow and the
  // silhouette springs a leak.
  sit: {
    rows: [
      ".....KKKK.....",
      "....KNNNNK....",
      "....KMMMMK....",
      "...KRRRRRRK...",
      "..KFRRRRRRFK..",
      "..KFRRRRRRFK..",
      "...KRRRRRRK...",
      "...KNNKKNNK...",
      "..KNNK..KNNK..",
      ".KNNK....KNNK.",
      "KCBK......KCBK",
      "KKK........KKK",
    ],
  },
} satisfies Record<string, SpriteDef>;

export type SkierSpriteKey = keyof typeof SKIER_SPRITES;
