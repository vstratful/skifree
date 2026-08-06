import { LIFT_SPRITES, type LiftSpriteKey } from "./lift";
import { MONSTER_SPRITES, type MonsterSpriteKey } from "./monster";
import { NPC_SPRITES, type NpcSpriteKey } from "./npc";
import { bakeSheet } from "./render";
import { SKIER_SPRITES, type SkierSpriteKey } from "./skier";
import { TERRAIN_SPRITES, type TerrainSpriteKey } from "./terrain";
import type { BakedSprite } from "./types";

export type SpriteLibrary = {
  skier: Record<SkierSpriteKey, BakedSprite>;
  terrain: Record<TerrainSpriteKey, BakedSprite>;
  lift: Record<LiftSpriteKey, BakedSprite>;
  monster: Record<MonsterSpriteKey, BakedSprite>;
  npc: Record<NpcSpriteKey, BakedSprite>;
};

let library: SpriteLibrary | null = null;

/**
 * Bakes every sprite sheet, once per session. Must be called from the browser —
 * it needs a canvas — so the game component does it on mount.
 */
export function getSprites(): SpriteLibrary {
  if (library) return library;
  library = {
    skier: bakeSheet(SKIER_SPRITES, "skier"),
    terrain: bakeSheet(TERRAIN_SPRITES, "terrain"),
    lift: bakeSheet(LIFT_SPRITES, "lift"),
    monster: bakeSheet(MONSTER_SPRITES, "monster"),
    npc: bakeSheet(NPC_SPRITES, "npc"),
  };
  return library;
}

export type { BakedSprite } from "./types";
export type {
  LiftSpriteKey,
  MonsterSpriteKey,
  NpcSpriteKey,
  SkierSpriteKey,
  TerrainSpriteKey,
};
