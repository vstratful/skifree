import type { SpriteDef } from "./types";

/**
 * Other creatures on the mountain, drawn in the same high 3/4 behind-and-above
 * view as the player. Their colours are deliberately kept off the player's
 * palette (violet/magenta boarders, green/yellow rival skiers, brown dogs) so
 * the player never mistakes one of these for themself.
 *
 * Every sprite on this sheet is fully wrapped in a black (`K`) outline — none
 * of these are snow-on-snow like `mogul`/`snowPatch`, so no fill is allowed to
 * touch transparency. Fills are flat: one colour per surface, and the only
 * shading is the outline itself.
 */
export const NPC_SPRITES = {
  // Snowboarder carving left. Magenta helmet over a violet jacket with a
  // magenta hem, knees bent, and both arms out — the trailing one thrown up
  // and back to the right, the leading one reaching down across the turn to
  // the left, each ending in a two-pixel magenta glove. Under the boots is the
  // board, seen nearly edge-on: one unbroken two-pixel-thick magenta deck that
  // steps down to the left across the whole frame, so the tilt reads from the
  // tips rather than from a seam under the feet.
  snowboarderLeft: {
    rows: [
      "......KKKK......",
      ".....KXXXXK.....",
      ".....KXXXXK.....",
      ".....KXXXXK..KK.",
      "....KVVVVVVKKXXK",
      "....KVVVVVVKVVK.",
      "...KVVVVVVVVVK..",
      "..KVVVVVVVVKK...",
      ".KVVKVVVVVVK....",
      "KXXKKVVVVVVK....",
      ".KKKXXXXXXXXK...",
      "....KNNKKNNK....",
      "....KNNKKNNKKKK.",
      "....KNNKKNNXXXXK",
      ".KKKKXXXXXXXXXXK",
      "KXXXXXXXXXXKKKK.",
      "KXXXXKKKKKK.....",
      ".KKKK...........",
    ],
    // The board is tilted, so the default bottom-centre anchor would land in
    // the empty corner beyond the low tip. Pin the underside of the board
    // directly below the rider instead — that is the pixel riding on the snow.
    anchor: [8, 16],
  },

  // Column-reversed mirror of snowboarderLeft — carving right, board tipped
  // down to the right. The anchor mirrors with it.
  snowboarderRight: {
    rows: [
      "......KKKK......",
      ".....KXXXXK.....",
      ".....KXXXXK.....",
      ".KK..KXXXXK.....",
      "KXXKKVVVVVVK....",
      ".KVVKVVVVVVK....",
      "..KVVVVVVVVVK...",
      "...KKVVVVVVVVK..",
      "....KVVVVVVKVVK.",
      "....KVVVVVVKKXXK",
      "...KXXXXXXXXKKK.",
      "....KNNKKNNK....",
      ".KKKKNNKKNNK....",
      "KXXXXNNKKNNK....",
      "KXXXXXXXXXXKKKK.",
      ".KKKKXXXXXXXXXXK",
      ".....KKKKKKXXXXK",
      "...........KKKK.",
    ],
    anchor: [7, 16],
  },

  // Small brown dog running left. Two pricked ears sit a row clear of the back
  // so the head reads as a head, a tan (`U`) muzzle pokes out front over a tan
  // belly, and the tail kicks up and back off the rump. The body is
  // deliberately only two rows deep and all four legs are single-pixel and
  // splayed fore-and-aft mid-stride — a deeper body on fatter legs reads as a
  // rock at 1x, which is the one thing this sprite must not do.
  dogLeft: {
    rows: [
      ".KKK.........K..",
      "KTKTK.......KTK.",
      "KTTTK......KTK..",
      "KUTTTKKKKKKKTK..",
      "KUTTTTTTTTTTTK..",
      ".KTUUUUUUUUTK...",
      "..KTKTKKKTKTK...",
      ".KTKKTK.KTKKTK..",
      "KTK.KTK.KTK.KTK.",
      "KK..KK..KK...KK.",
    ],
  },

  // Column-reversed mirror of dogLeft — running right.
  dogRight: {
    rows: [
      "..K.........KKK.",
      ".KTK.......KTKTK",
      "..KTK......KTTTK",
      "..KTKKKKKKKTTTUK",
      "..KTTTTTTTTTTTUK",
      "...KTUUUUUUUUTK.",
      "...KTKTKKKTKTK..",
      "..KTKKTK.KTKKTK.",
      ".KTK.KTK.KTK.KTK",
      ".KK...KK..KK..KK",
    ],
  },

  // The same dog sat on its haunches, facing left: ears up, head held high, a
  // tan front running from the muzzle down the chest into the one visible
  // foreleg, rump planted behind and rounding off into the snow. The tail
  // stands up off the rump and hooks over at the top, held clear of the back
  // by a one-pixel channel of open snow — that channel and the gap between
  // foreleg and haunch are what stop this reading as a mound.
  dogSit: {
    rows: [
      "..KKK......",
      ".KTKTK.....",
      "KTTTTK.....",
      "KUTTTK.....",
      "KUTTTK.....",
      ".KTTTK..KK.",
      ".KTTTTK.KTK",
      ".KUTTTTKKTK",
      ".KUUTTTTTTK",
      ".KUUTTTTTTK",
      ".KUKKTTTTTK",
      ".KUK.KTTTTK",
      ".KKK.KKKKKK",
    ],
  },

  // Rival skier in a full sideways traverse to the left — the player's `left`
  // pose rebuilt on the NPC palette: yellow (`Y`) hat with the brim to the
  // downhill side, one flesh cheek over dark-brown hair, green (`G`) jacket
  // leaning into the hill with the downhill hand out front, navy trousers, and
  // both skis lying across the slope. Far ski is the lit cyan one, near ski
  // the dark blue one stepping out past its tip — same contract as the player,
  // so the skis never merge into the trousers.
  skierNpcLeft: {
    rows: [
      "..............",
      ".....KKKK.....",
      "....KYYYYK....",
      "...KKYYYK.....",
      "....KFMMK.....",
      "...KGGGGGK....",
      "..KGGGGGGGK...",
      ".KFGGGGGGK....",
      "..KGGGGGK.....",
      "..KNNNNK......",
      ".KNNKKNNK.....",
      ".KKKKKKKKKKKK.",
      ".KCCCCCCCCCCK.",
      "KKKKKKKKKKKKK.",
      "KBBBBBBBBBBBK.",
      "KKKKKKKKKKKKK.",
    ],
  },

  // Column-reversed mirror of skierNpcLeft — traversing right.
  skierNpcRight: {
    rows: [
      "..............",
      ".....KKKK.....",
      "....KYYYYK....",
      ".....KYYYKK...",
      ".....KMMFK....",
      "....KGGGGGK...",
      "...KGGGGGGGK..",
      "....KGGGGGGFK.",
      ".....KGGGGGK..",
      "......KNNNNK..",
      ".....KNNKKNNK.",
      ".KKKKKKKKKKKK.",
      ".KCCCCCCCCCCK.",
      ".KKKKKKKKKKKKK",
      ".KBBBBBBBBBBBK",
      ".KKKKKKKKKKKKK",
    ],
  },
} satisfies Record<string, SpriteDef>;

export type NpcSpriteKey = keyof typeof NPC_SPRITES;
