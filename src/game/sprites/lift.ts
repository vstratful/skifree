import type { SpriteDef } from "./types";

/**
 * The chairlift that runs up the mountain, plus the trail-marker pennants that
 * line the run.
 *
 * Chairs are positioned by the point where their grip clamps the haul rope, so
 * both chair sprites override the default bottom-centre anchor with the
 * top-centre pixel.
 */
export const LIFT_SPRITES = {
  /**
   * Lift pylon in elevation: one steel column running the full height, lit down
   * its left edge (H) and shaded down its right (D). It widens by a single step
   * on each side toward the bottom — so it tapers slightly going up — and lands
   * on a flared footing. A horizontal cross-arm crosses near the top, with a
   * small sheave wheel slung under each end and the column head poking up
   * through the middle of the arm.
   */
  tower: {
    rows: [
      ".....KKKKKK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      "KKKKKKKKKKKKKKKK",
      "KHHHHHHHHHHHHHHK",
      "KAAAAAAAAAAAAAAK",
      "KKKKKKKKKKKKKKKK",
      ".KK..KHAADK..KK.",
      "KAAK.KHAADK.KAAK",
      ".KK..KHAADK..KK.",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      ".....KHAADK.....",
      "....KHAAAADK....",
      "....KHAAAADK....",
      "....KHAAAADK....",
      "....KHAAAADK....",
      "....KHAAAADK....",
      "....KHAAAADK....",
      "....KHAAAADK....",
      "....KHAAAADK....",
      "....KHAAAADK....",
      "....KHAAAADK....",
      "....KHAAAADK....",
      "..KKKKKKKKKKKK..",
      "..KHAAAAAAAADK..",
      "..KHAAAAAAAADK..",
      "..KKKKKKKKKKKK..",
    ],
  },

  /**
   * An empty chair: a thin hanger arm from the very top row (where the grip
   * bites the rope) down through a short yoke, then the back rest, a wider seat
   * pan overhanging it on both sides, and a footbar slung under the seat on two
   * struts. The giveaway that it is empty is that you can see the snow straight
   * through its backrest, so the back is an open frame — filling it in turns the
   * sprite into an anonymous grey box.
   *
   * Anchored top-centre, like {@link chairFull}: chairs hang from the cable
   * rather than standing on the snow.
   */
  chairEmpty: {
    rows: [
      "......KK......",
      "......KK......",
      "......KK......",
      "...KKKKKKKK...",
      "...K......K...",
      "...K......K...",
      "...K......K...",
      ".KKKKKKKKKKKK.",
      ".KHHHHHHHHHHK.",
      ".KAAAAAAAAAAK.",
      ".KKKKKKKKKKKK.",
      "...K......K...",
      "...K......K...",
      "..KKKKKKKKKK..",
    ],
    anchor: [7, 0],
  },

  /**
   * A loaded chair: the same hanger arm, but it now runs down between two
   * passengers' heads to keep the chair visibly hung from the rope. Orange and
   * yellow hats over flesh-tone faces, shoulders overhanging the back rest in
   * green and blue jackets, navy legs over the footbar, and skis dangling below
   * it.
   *
   * Red is reserved for the player's jacket across the whole game, so these two
   * wear the NPC greens and blues — a red-jacketed figure riding past is the one
   * thing that could read as "that's me".
   */
  chairFull: {
    rows: [
      ".......KK.......",
      ".......KK.......",
      ".......KK.......",
      "......KAAK......",
      "..KKKK.KK.KKKK..",
      "..KOOK.KK.KYYK..",
      "..KFFK.KK.KFFK..",
      "..KFFK.KK.KFFK..",
      "..KKKKKKKKKKKK..",
      "..KAAAAAAAAAAK..",
      ".KGGGGKKKKBBBBK.",
      ".KGGGGKKKKBBBBK.",
      ".KGGGGKKKKBBBBK.",
      "KKKKKKKKKKKKKKKK",
      "KHAAAAAAAAAAAADK",
      "KKKKKKKKKKKKKKKK",
      "...KNNK..KNNK...",
      ".KKKKKKKKKKKKKK.",
      "..KBBBK..KBBBK..",
      "..KKKKK..KKKKK..",
    ],
    anchor: [8, 0],
  },
} satisfies Record<string, SpriteDef>;

export type LiftSpriteKey = keyof typeof LIFT_SPRITES;
