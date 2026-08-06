import type { SpriteDef } from "./types";

/**
 * The Abominable Snow Monster.
 *
 * Front-facing at all times, even while chasing — that head-on stare is the
 * whole joke of the 1991 original. Solid black outline everywhere, on every
 * edge, because a white ape on a white slope is otherwise invisible: that
 * includes the shoulder tops between the arms and the head, the underside
 * between the legs, and the top of each toe where the foot overhangs the leg.
 *
 * Shared skeleton, so the frames read as one creature: mitt-shaped fists at the
 * top corners, 4px arm shafts running down the outside with a one-pixel elbow
 * jog, a rounded 10–12px head floating clear of the arms with a one-pixel gap
 * either side, shoulders that step out twice as wide as the head, a torso that
 * tapers into `H`/`S` shaggy underside fur, then two 5px legs on flat feet.
 * Mouths are a black-framed red hole with white fangs biting into it; the skier
 * keeps his own palette on the way down (`R` jacket, `N` trousers and boots,
 * `B`/`C` skis) so you can still tell what is being eaten.
 */
export const MONSTER_SPRITES = {
  // Chase frame A — 24x28. Fists punched up above the head, mouth open on bared
  // fangs, left foot swung forward and up, right foot planted on the snow.
  run1: {
    rows: [
      ".KKKK..............KKKK.",
      "KWWWWK............KWWWWK",
      "KWKKWK............KWKKWK",
      "KWWWWK............KWWWWK",
      ".KWWK..............KWWK.",
      ".KWWK....KKKKKK....KWWK.",
      ".KWWK...KWWWWWWK...KWWK.",
      ".KWWK..KWWWWWWWWK..KWWK.",
      ".KWWK..KWWKWWKWWK..KWWK.",
      ".KWWK..KWWWWWWWWK..KWWK.",
      ".KWWK..KKKKKKKKKK..KWWK.",
      "..KWWK.KKWRRRRWKK.KWWK..",
      "..KWWK.KKRRRRRRKK.KWWK..",
      "..KWWK.KKRWRRWRKK.KWWK..",
      "..KWWK.KKKKKKKKKK.KWWK..",
      "..KWWK..KWWWWWWK..KWWK..",
      "..KWWWKKWWWWWWWWKKWWWK..",
      "...KWWWWWWWWWWWWWWWWK...",
      "....KWWWWWWWWWWWWWWK....",
      ".....KHWWWWWWWWWWHK.....",
      ".....KHHWWWWWWWWHHK.....",
      ".....KSSWWKKKKWWSSK.....",
      ".....KWWWK....KWWWK.....",
      ".....KWWWK....KWWWK.....",
      "....KWWWWWK...KWWWK.....",
      "....KKKKKKK...KWWWK.....",
      ".............KWWWWWK....",
      ".............KKKKKKK....",
    ],
  },

  // Chase frame B — 24x28. The whole monster bobs one pixel lower and the
  // stride swaps: right foot swung forward and up, left foot planted. Feet stay
  // on the same snow line as run1 so only the body lollops. Rows 24-27 are the
  // exact column-reversal of run1's.
  run2: {
    rows: [
      "........................",
      ".KKKK..............KKKK.",
      "KWWWWK............KWWWWK",
      "KWKKWK............KWKKWK",
      "KWWWWK............KWWWWK",
      ".KWWK..............KWWK.",
      ".KWWK....KKKKKK....KWWK.",
      ".KWWK...KWWWWWWK...KWWK.",
      ".KWWK..KWWWWWWWWK..KWWK.",
      ".KWWK..KWWKWWKWWK..KWWK.",
      ".KWWK..KWWWWWWWWK..KWWK.",
      ".KWWK..KKKKKKKKKK..KWWK.",
      "..KWWK.KKWRRRRWKK.KWWK..",
      "..KWWK.KKRRRRRRKK.KWWK..",
      "..KWWK.KKRWRRWRKK.KWWK..",
      "..KWWK.KKKKKKKKKK.KWWK..",
      "..KWWK..KWWWWWWK..KWWK..",
      "..KWWWKKWWWWWWWWKKWWWK..",
      "...KWWWWWWWWWWWWWWWWK...",
      "....KWWWWWWWWWWWWWWK....",
      ".....KHWWWWWWWWWWHK.....",
      ".....KHHWWWWWWWWHHK.....",
      ".....KSSWWKKKKWWSSK.....",
      ".....KWWWK....KWWWK.....",
      ".....KWWWK...KWWWWWK....",
      ".....KWWWK...KKKKKKK....",
      "....KWWWWWK.............",
      "....KKKKKKK.............",
    ],
  },

  // The 'gotcha' frame — 26x28. Both arms thrown wide and forward into one
  // full-width band with clawed paws hanging off each end, mouth at maximum
  // gape. The silhouette is a T: nothing else in the game is this wide.
  grab: {
    rows: [
      "..........KKKKKK..........",
      ".........KWWWWWWK.........",
      "........KWWWWWWWWK........",
      "........KWWKWWKWWK........",
      "........KWWWWWWWWK........",
      "........KKKKKKKKKK........",
      "........KKWRRRRWKK........",
      "........KKRRRRRRKK........",
      "........KKRRRRRRKK........",
      "........KKRRRRRRKK........",
      "........KKRWRRWRKK........",
      "........KKKKKKKKKK........",
      ".........KWWWWWWK.........",
      "KKKKK.KKKWWWWWWWWKKK.KKKKK",
      "KKKKKKKWWWWWWWWWWWWKKKKKKK",
      "KWWWWWKWWWWWWWWWWWWKWWWWWK",
      "KWWWWWKWWWWWWWWWWWWKWWWWWK",
      "KKKKKKWWWWWWWWWWWWWWKKKKKK",
      "KWKWK.KWWWWWWWWWWWWK.KWKWK",
      "KKKKK.KWWWWWWWWWWWWK.KKKKK",
      "......KHWWWWWWWWWWHK......",
      "......KHHWWWWWWWWHHK......",
      "......KSSWWWKKWWWSSK......",
      ".......KWWWK..KWWWK.......",
      ".......KWWWK..KWWWK.......",
      ".......KWWWK..KWWWK.......",
      ".....KKWWWWK..KWWWWKK.....",
      ".....KKKKKKK..KKKKKKK.....",
    ],
  },

  // First bite — 26x28. The skier has gone in head first: his red jacket fills
  // the gape, his navy legs and boots stand straight up out of the mouth and
  // his blue skis splay at the top, kicking. The legs cross in front of the
  // forehead, so the eyes sit either side of them.
  eat1: {
    rows: [
      "........KKKK..KKKK........",
      "........KCBK..KBCK........",
      ".KKKK...KCBK..KBCK...KKKK.",
      "KWWWWK...KNNKKNNK...KWWWWK",
      "KWKKWK...KNNKKNNK...KWKKWK",
      "KWWWWK...KNNKKNNK...KWWWWK",
      ".KWWK.....KKNNKK.....KWWK.",
      ".KWWK....KWKNNKWK....KWWK.",
      ".KWWK...KWWKNNKWWK...KWWK.",
      ".KWWK..KWKWKNNKWKWK..KWWK.",
      ".KWWK..KWWWKNNKWWWK..KWWK.",
      "..KWWK.KKKKKNNKKKKK.KWWK..",
      "..KWWK.KKRRKNNKRRKK.KWWK..",
      "..KWWK.KKWRKNNKRWKK.KWWK..",
      "..KWWK.KKRRRRRRRRKK.KWWK..",
      "..KWWK.KKKKKKKKKKKK.KWWK..",
      "..KWWK..KWWWWWWWWK..KWWK..",
      "..KWWK...KWWWWWWK...KWWK..",
      "..KWWWKKKWWWWWWWWKKKWWWK..",
      "...KWWWWWWWWWWWWWWWWWWK...",
      "....KWWWWWWWWWWWWWWWWK....",
      ".....KHWWWWWWWWWWWWHK.....",
      "......KHHWWWWWWWWHHK......",
      "......KSSWWWKKWWWSSK......",
      ".......KWWWK..KWWWK.......",
      ".......KWWWK..KWWWK.......",
      ".....KKWWWWK..KWWWWKK.....",
      ".....KKKKKKK..KKKKKKK.....",
    ],
  },

  // Second bite — 26x28. Same pose, skier most of the way down: the jacket has
  // gone and only the navy boots and the blue ski tips still stick up out of
  // the jaws, which have clamped shut around them.
  eat2: {
    rows: [
      "..........................",
      "..........................",
      ".KKKK................KKKK.",
      "KWWWWK..............KWWWWK",
      "KWKKWK..............KWKKWK",
      "KWWWWK..............KWWWWK",
      ".KWWK.....KKKKKK.....KWWK.",
      ".KWWK....KKCBBCKK....KWWK.",
      ".KWWK...KWKCBBCKWK...KWWK.",
      ".KWWK..KWKWKNNKWKWK..KWWK.",
      ".KWWK..KWWWKNNKWWWK..KWWK.",
      "..KWWK.KKKKKNNKKKKK.KWWK..",
      "..KWWK.KKRRKNNKRRKK.KWWK..",
      "..KWWK.KKWRRRRRRWKK.KWWK..",
      "..KWWK.KKRRRRRRRRKK.KWWK..",
      "..KWWK.KKKKKKKKKKKK.KWWK..",
      "..KWWK..KWWWWWWWWK..KWWK..",
      "..KWWK...KWWWWWWK...KWWK..",
      "..KWWWKKKWWWWWWWWKKKWWWK..",
      "...KWWWWWWWWWWWWWWWWWWK...",
      "....KWWWWWWWWWWWWWWWWK....",
      ".....KHWWWWWWWWWWWWHK.....",
      "......KHHWWWWWWWWHHK......",
      "......KSSWWWKKWWWSSK......",
      ".......KWWWK..KWWWK.......",
      ".......KWWWK..KWWWK.......",
      ".....KKWWWWK..KWWWWKK.....",
      ".....KKKKKKK..KKKKKKK.....",
    ],
  },

  // Chewing — 24x26. Skier gone. Cheeks bulge two pixels past the skull, the
  // mouth is a thick black seam, the eyes are screwed shut into `KK` slits and
  // the arms have dropped to hang at the sides.
  eat3: {
    rows: [
      "........KKKKKKKK........",
      ".......KWWWWWWWWK.......",
      "......KWWWWWWWWWWK......",
      "......KWKKWWWWKKWK......",
      "......KWWWWWWWWWWK......",
      ".....KWWWWWWWWWWWWK.....",
      "....KWWWWWWWWWWWWWWK....",
      "....KWWKKKKKKKKKKWWK....",
      "....KWWKKKKKKKKKKWWK....",
      "....KWWWWWWWWWWWWWWK....",
      ".....KWWWWWWWWWWWWK.....",
      "......KWWWWWWWWWWK......",
      ".......KWWWWWWWWK.......",
      ".KKKKKKWWWWWWWWWWKKKKKK.",
      ".KWWK.KWWWWWWWWWWK.KWWK.",
      ".KWWK.KWWWWWWWWWWK.KWWK.",
      ".KWWK.KHWWWWWWWWHK.KWWK.",
      ".KWWK.KHHWWWWWWHHK.KWWK.",
      ".KWWK.KSSWWWWWWSSK.KWWK.",
      ".KKKK.KSSWWKKWWSSK.KKKK.",
      "......KWWWK..KWWWK......",
      "......KWWWK..KWWWK......",
      "......KWWWK..KWWWK......",
      "......KWWWK..KWWWK......",
      "....KKWWWWK..KWWWWKK....",
      "....KKKKKKK..KKKKKKK....",
    ],
  },

  // Post-meal triumph — 26x30. Standing tall, fists punched high above the
  // head, grin stretched the full width of the face on a solid row of teeth.
  // The game-over portrait.
  gloat: {
    rows: [
      ".KKKK................KKKK.",
      "KWWWWK..............KWWWWK",
      "KWKKWK..............KWKKWK",
      "KWWWWK..............KWWWWK",
      ".KWWK................KWWK.",
      ".KWWK....KKKKKKKK....KWWK.",
      ".KWWK...KWWWWWWWWK...KWWK.",
      ".KWWK..KWWWWWWWWWWK..KWWK.",
      ".KWWK..KWWKWWWWKWWK..KWWK.",
      ".KWWK..KWWWWWWWWWWK..KWWK.",
      ".KWWK..KKKKKKKKKKKK..KWWK.",
      "..KWWK.KKWWKWWKWWKK.KWWK..",
      "..KWWK.KKRRRRRRRRKK.KWWK..",
      "..KWWK.KKRRRRRRRRKK.KWWK..",
      "..KWWK.KKKKKKKKKKKK.KWWK..",
      "..KWWK..KWWWWWWWWK..KWWK..",
      "..KWWK...KWWWWWWK...KWWK..",
      "..KWWWKKKWWWWWWWWKKKWWWK..",
      "...KWWWWWWWWWWWWWWWWWWK...",
      "....KWWWWWWWWWWWWWWWWK....",
      ".....KWWWWWWWWWWWWWWK.....",
      ".....KHWWWWWWWWWWWWHK.....",
      "......KHHWWWWWWWWHHK......",
      "......KSSWWWKKWWWSSK......",
      ".......KWWWK..KWWWK.......",
      ".......KWWWK..KWWWK.......",
      ".......KWWWK..KWWWK.......",
      ".......KWWWK..KWWWK.......",
      ".....KKWWWWK..KWWWWKK.....",
      ".....KKKKKKK..KKKKKKK.....",
    ],
  },
} satisfies Record<string, SpriteDef>;

export type MonsterSpriteKey = keyof typeof MONSTER_SPRITES;
