import type { SpriteDef } from "./types";

/**
 * Static slope obstacles and cosmetic ground detail.
 *
 * Everything here is blitted straight onto pure-white snow, so every solid
 * object carries a black silhouette outline all the way around. The two
 * snow-on-snow sprites (`mogul`, `snowPatch`) deliberately contain no black at
 * all — they are shaded with S/Z only, which is what keeps them reading as
 * terrain rather than as props sitting on top of it.
 *
 * Light comes from the upper left on every solid object: L/H/U on the upper
 * left, body colour through the middle, E/D/M on the lower right.
 */
export const TERRAIN_SPRITES = {
  /**
   * The signature SkiFree conifer: four stacked triangular tiers over a short
   * trunk. Each tier widens 2px per row, closes with a dark-green (E) underside
   * band, and is undercut by the next tier starting 2px narrower — that notch
   * is what separates the tiers. On the underside row the pixels that overhang
   * empty snow are black (the silhouette edge) and the pixels that overhang the
   * tier below stay E, so the tree reads as green all the way down instead of
   * being banded by four black bars.
   */
  treeTall: {
    rows: [
      "......................",
      "..........KK..........",
      ".........KLGK.........",
      "........KLLGGK........",
      ".......KLLGGGGK.......",
      "......KLLLGGGGGK......",
      "......KEEEEEEEEK......",
      "......KKEEEEEEKK......",
      "........KLLGGK........",
      ".......KLLGGGGK.......",
      "......KLLLGGGGGK......",
      ".....KLLLGGGGGGGK.....",
      "....KLLLLGGGGGGGGK....",
      "....KEEEEEEEEEEEEK....",
      "....KKEEEEEEEEEEKK....",
      "......KLLLGGGGGK......",
      ".....KLLLGGGGGGGK.....",
      "....KLLLLGGGGGGGGK....",
      "...KLLLLGGGGGGGGGGK...",
      "...KEEEEEEEEEEEEEEK...",
      "...KKKEEEEEEEEEEKKK...",
      "......KLLLGGGGGK......",
      ".....KLLLGGGGGGGK.....",
      "....KLLLLGGGGGGGGK....",
      "...KLLLLGGGGGGGGGGK...",
      "..KLLLLLGGGGGGGGGGGK..",
      ".KLLLLLGGGGGGGGGGGGGK.",
      ".KEEEEEEEEEEEEEEEEEEK.",
      ".KKKKKKKEEEEEEKKKKKKK.",
      "........KTTMMK........",
      "........KTTMMK........",
      "........KTTMMK........",
      "........KTTMMK........",
      "........KKKKKK........",
    ],
  },

  /** The same conifer, smaller: three tiers over a stubby trunk. */
  treeShort: {
    rows: [
      "................",
      ".......KK.......",
      "......KLGK......",
      ".....KLLGGK.....",
      "....KLLGGGGK....",
      "....KEEEEEEK....",
      "....KKEEEEKK....",
      "......KLGK......",
      ".....KLLGGK.....",
      "....KLLGGGGK....",
      "...KLLLGGGGGK...",
      "...KEEEEEEEEK...",
      "...KKEEEEEEKK...",
      ".....KLLGGK.....",
      "....KLLGGGGK....",
      "...KLLLGGGGGK...",
      "..KLLLGGGGGGGK..",
      "..KEEEEEEEEEEK..",
      "..KKKKEEEEKKKK..",
      "......KTMK......",
      "......KTMK......",
      "......KKKK......",
    ],
  },

  /**
   * A dead deciduous tree: no foliage. A brown-cored trunk flares at the base,
   * throws one long limb up-left and a shorter one up-right, then forks at
   * mid-height into four 1px black twigs that stay readable at 1px.
   */
  treeBare: {
    rows: [
      "..................",
      "...K..K....K......",
      "...K..K....K..K...",
      "....K.K....K.K....",
      "....K..K..K..K....",
      ".....K.K..K.K.....",
      ".....K.K..K.K.....",
      "......K.KK.K......",
      "......K.KK.K......",
      ".......KTMK.......",
      ".......KTMK.......",
      ".......KTMK.K.....",
      ".......KTMK.K.....",
      ".......KTMKK......",
      ".......KTMK.......",
      "....K..KTMK.......",
      "....K..KTMK.......",
      ".....K.KTMK..K....",
      "......KKTMK..K....",
      ".......KTMK.K.....",
      ".......KTMKK......",
      ".......KTMK.......",
      "......KTTMMK......",
      "......KTTMMK......",
      ".....KTTTMMMK.....",
      ".....KKKKKKKK.....",
    ],
  },

  /**
   * A cut trunk: a tan sawn top with one growth ring, then a brown side wall
   * that darkens to the lower right.
   */
  stump: {
    rows: [
      "............",
      "...KKKKKK...",
      ".KKUTTTTUKK.",
      ".KUTUUUUTUK.",
      ".KUUTTTTUUK.",
      ".KUUUUUUUUK.",
      ".KTTTTTMMMK.",
      ".KTTTMMMMMK.",
      "..KKKKKKKK..",
    ],
  },

  /**
   * An angular grey boulder: a small lit summit facet left of centre, a long
   * straight slope down to the right, and a vertical left wall. Flat fills with
   * one diagonal terminator — H upper left, A through the middle, D lower right.
   */
  rock: {
    rows: [
      "..................",
      "....KKKKK.........",
      "..KKHHHHHKKK......",
      ".KHHHHHHHHHHKKK...",
      ".KHHHHHHHHHHAAAKK.",
      ".KHHHHHHHHHAAAADK.",
      ".KHHHHHHHHAAAADDK.",
      ".KHHHHHHHAAAADDDK.",
      ".KHHHHHHAAAADDDK..",
      ".KHHHHHAAAADDDK...",
      "..KHHHAAADDDDK....",
      "..KKKKKKKKKKKK....",
    ],
  },

  /** A smaller boulder, same faceting and lighting. */
  rockSmall: {
    rows: [
      "...........",
      "..KKKK.....",
      ".KHHHHKK...",
      ".KHHHHAAKK.",
      ".KHHHHAADK.",
      ".KHHHAADK..",
      "..KHHADDK..",
      "..KKKKKKK..",
    ],
  },

  /**
   * A snow bump, lit from the upper left. Snow on snow, so no black anywhere —
   * S/Z only. Its lit face is white on white and so invisible by design; what
   * makes it read as *raised* rather than as a hole is that the shading is all
   * on the lower right, deepening from S into Z. Shade it symmetrically and it
   * turns back into a puddle, so keep the crescent asymmetric.
   */
  mogul: {
    rows: [
      "....................",
      ".....SSSSSSSSS......",
      "...SSWWWWWWWWWSS....",
      "..SWWWWWWWWWWWWSZ...",
      "..SWWWWWWWWWWWSZZZ..",
      "..ZSWWWWWWWWSZZZZZ..",
      "...ZZSSSSSSZZZZZZ...",
      ".....ZZZZZZZZZZ.....",
    ],
  },

  /**
   * A packed-snow kicker: a wedge widening 2px per row as it rises toward the
   * camera, shaded Z/S at the far end and lit white across the crest, then
   * capped by a planked take-off lip along the bottom edge. The straight
   * converging sides and the full black outline are what stop it reading as an
   * igloo.
   */
  ramp: {
    rows: [
      "..........................",
      "........KKKKKKKKKK........",
      ".......KZZZZZZZZZZK.......",
      "......KZZSSSSSSSSZZK......",
      ".....KZSSSSSSSSSSSSZK.....",
      "....KZSSSSSSSSSSSSSSZK....",
      "...KZSSSSSSSSSSSSSSSSZK...",
      "..KZSSSSSSSSSSSSSSSSSSZK..",
      ".KZSSSSSSSSSSSSSSSSSSSSZK.",
      ".KWWWWWWWWWWWWWWWWWWWWWWK.",
      ".KOOKOOOOKOOOOKOOOOKOOOOK.",
      ".KTTKTTTTKTTTTKTTTTKTTTTK.",
      ".KKKKKKKKKKKKKKKKKKKKKKKK.",
    ],
  },

  /** Cosmetic icy blotch on the snow. No outline — purely decorative. */
  snowPatch: {
    rows: [
      "................",
      "...SSSS....SS...",
      "..SSZZSS..SSZS..",
      "..SSZSS....SSS..",
      "...SSS..........",
    ],
  },

  /**
   * A trail sign: a yellow board carrying a black right-pointing arrow — a 2px
   * shaft plus a stepped chevron head — mounted on a short brown post.
   */
  sign: {
    rows: [
      "................",
      ".KKKKKKKKKKKKKK.",
      ".KYYYYYYYYYYYYK.",
      ".KYYYYYYKYYYYYK.",
      ".KYYYYYYKKYYYYK.",
      ".KYKKKKKKKKKYYK.",
      ".KYKKKKKKKKKYYK.",
      ".KYYYYYYKKYYYYK.",
      ".KYYYYYYKYYYYYK.",
      ".KYYYYYYYYYYYYK.",
      ".KKKKKKKKKKKKKK.",
      "......KTMK......",
      "......KTMK......",
      "......KTMK......",
      "......KTMK......",
      "......KTMK......",
      "......KTMK......",
      "......KKKK......",
    ],
  },
} satisfies Record<string, SpriteDef>;

export type TerrainSpriteKey = keyof typeof TERRAIN_SPRITES;
