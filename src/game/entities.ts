import {
  CULL_MARGIN,
  DOG_SPEED,
  MONSTER_CATCH_RANGE,
  MONSTER_EAT_FRAME,
  MONSTER_ESCAPE_DISTANCE,
  MONSTER_ESCAPE_TIME,
  MONSTER_SPAWN_LEAD,
  NPC_SKIER_SPEED,
  SNOWBOARDER_SPEED,
} from "./constants";
import type { Rng } from "./rng";
import type { Mobile, MobileKind, Monster, Skier, View } from "./types";

// ---------------------------------------------------------------------------
// Dogs, snowboarders and other skiers
// ---------------------------------------------------------------------------

/** How close a dog gets before it settles down next to a fallen skier. */
const DOG_SIT_RANGE = 34;
/** A dog only takes an interest in a wipeout this close by. */
const DOG_INTEREST_RANGE = 280;

let nextMobileId = 1;

export function spawnMobile(
  kind: MobileKind,
  view: View,
  skier: Skier,
  rng: Rng,
): Mobile {
  const phase = rng.range(0, Math.PI * 2);
  const base = {
    id: nextMobileId++,
    kind,
    age: 0,
    phase,
    sitting: 0,
    vx: 0,
    vy: 0,
  };

  if (kind === "dog") {
    // Dogs trot in from the side, at roughly the player's altitude.
    const fromLeft = rng.chance(0.5);
    return {
      ...base,
      x: fromLeft ? view.left - 30 : view.right + 30,
      y: skier.y + rng.range(-40, 140),
    };
  }

  // Snowboarders and other skiers come from up-slope and get overtaken, which
  // makes them moving obstacles rather than pursuers.
  return {
    ...base,
    x: skier.x + rng.range(-view.width * 0.45, view.width * 0.45),
    y: view.top - rng.range(30, 140),
  };
}

export function stepMobile(mobile: Mobile, dt: number, skier: Skier): void {
  mobile.age += dt;

  switch (mobile.kind) {
    case "dog": {
      if (mobile.sitting > 0) {
        mobile.sitting -= dt;
        mobile.vx = 0;
        mobile.vy = 0;
        break;
      }

      const dx = skier.x - mobile.x;
      const dy = skier.y - mobile.y;
      const distance = Math.hypot(dx, dy) || 1;
      const playerIsDown = skier.activity === "crashed";

      if (playerIsDown && distance < DOG_INTEREST_RANGE) {
        if (distance < DOG_SIT_RANGE) {
          // Close enough. Sit down and watch, which is the whole joke.
          mobile.sitting = 2.6;
          mobile.vx = 0;
          mobile.vy = 0;
          break;
        }
        mobile.vx = (dx / distance) * DOG_SPEED;
        mobile.vy = (dy / distance) * DOG_SPEED;
        break;
      }

      // Otherwise lope along after the skier with a wobble, slower than they
      // ski, so dogs drift in and out of shot instead of shadowing you.
      const wobble = Math.sin(mobile.age * 2.4 + mobile.phase);
      mobile.vx = (dx / distance) * DOG_SPEED + wobble * 40;
      mobile.vy = (dy / distance) * DOG_SPEED * 0.8 + 30;
      break;
    }

    case "snowboarder":
      mobile.vy = SNOWBOARDER_SPEED * (0.9 + 0.1 * Math.sin(mobile.age * 0.8));
      mobile.vx = Math.sin(mobile.age * 1.15 + mobile.phase) * 96;
      break;

    case "npcSkier":
      mobile.vy = NPC_SKIER_SPEED * (0.85 + 0.15 * Math.sin(mobile.age * 0.6));
      mobile.vx = Math.sin(mobile.age * 0.55 + mobile.phase) * 104;
      break;
  }

  mobile.x += mobile.vx * dt;
  mobile.y += mobile.vy * dt;
}

/** True once a mobile has drifted far enough out of shot to forget about it. */
export function shouldCull(mobile: Mobile, view: View): boolean {
  return (
    mobile.y < view.top - CULL_MARGIN ||
    mobile.y > view.bottom + CULL_MARGIN ||
    mobile.x < view.left - CULL_MARGIN ||
    mobile.x > view.right + CULL_MARGIN
  );
}

/** Which way a mobile is facing, for picking between mirrored sprites. */
export function facingLeft(mobile: Mobile): boolean {
  return mobile.vx < 0;
}

// ---------------------------------------------------------------------------
// The Abominable Snow Monster
// ---------------------------------------------------------------------------

/** The monster can only grab a skier who is this close to the snow. */
const MONSTER_GRAB_CEILING = 9;
/** Frames in the eating animation before the monster is done with you. */
const EAT_FRAMES = 3;

export type MonsterEvents = {
  /** The monster got hold of the skier this frame. */
  grabbed: boolean;
  /** The meal is finished; the run is over. */
  finished: boolean;
  /** The skier shook it off; it is heading home. */
  escaped: boolean;
  /** It has loped away and can be forgotten. */
  gone: boolean;
};

export function spawnMonster(
  skier: Skier,
  ordinal: number,
  speed: number,
): Monster {
  return {
    x: skier.x + (ordinal % 2 === 0 ? 40 : -40),
    y: skier.y - MONSTER_SPAWN_LEAD,
    speed,
    activity: "chasing",
    timer: 0,
    escapeTimer: 0,
    ordinal,
  };
}

export function stepMonster(
  monster: Monster,
  dt: number,
  skier: Skier,
): MonsterEvents {
  const events: MonsterEvents = {
    grabbed: false,
    finished: false,
    escaped: false,
    gone: false,
  };
  monster.timer += dt;

  switch (monster.activity) {
    case "chasing": {
      const dx = skier.x - monster.x;
      const dy = skier.y - monster.y;
      const distance = Math.hypot(dx, dy) || 1;

      // Home in, biased toward closing the vertical gap: it runs downhill after
      // you rather than cutting a lazy diagonal.
      const lateral = Math.max(-1, Math.min(1, dx / 60));
      const vx = lateral * monster.speed * 0.55;
      const vy =
        Math.sqrt(Math.max(0, monster.speed ** 2 - vx * vx)) *
        Math.sign(dy || 1);
      monster.x += vx * dt;
      monster.y += vy * dt;

      const lead = skier.y - monster.y;
      if (lead > MONSTER_ESCAPE_DISTANCE) {
        monster.escapeTimer += dt;
        if (monster.escapeTimer >= MONSTER_ESCAPE_TIME) {
          monster.activity = "leaving";
          monster.timer = 0;
          events.escaped = true;
        }
      } else {
        monster.escapeTimer = 0;
      }

      if (distance < MONSTER_CATCH_RANGE && skier.z < MONSTER_GRAB_CEILING) {
        monster.activity = "grabbing";
        monster.timer = 0;
        monster.x = skier.x;
        monster.y = skier.y;
        events.grabbed = true;
      }
      break;
    }

    case "grabbing":
      if (monster.timer >= MONSTER_EAT_FRAME) {
        monster.activity = "eating";
        monster.timer = 0;
      }
      break;

    case "eating":
      if (monster.timer >= MONSTER_EAT_FRAME * EAT_FRAMES) {
        monster.activity = "gloating";
        monster.timer = 0;
        events.finished = true;
      }
      break;

    case "gloating":
      // Stays put, arms up, for as long as the game-over screen is showing.
      break;

    case "leaving":
      // Lopes back up the mountain, shrinking into the distance.
      monster.y -= monster.speed * 0.85 * dt;
      monster.x += Math.sin(monster.timer * 3) * 30 * dt;
      if (monster.timer > 3.5) events.gone = true;
      break;
  }

  return events;
}

/** Which chase frame to draw, from the monster's own clock. */
export function monsterRunFrame(monster: Monster): 0 | 1 {
  return Math.floor(monster.timer * 7) % 2 === 0 ? 0 : 1;
}
