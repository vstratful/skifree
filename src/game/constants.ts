import type { Direction, Vec2 } from "./types";

/**
 * World units are 1:1 with sprite pixels at 1x zoom. The renderer picks an
 * integer zoom for the viewport, so every distance in this file is expressed in
 * those base units and nothing needs to know how big the window is.
 */
export const UNITS_PER_METRE = 8;

/** How far down the viewport the skier is pinned, as a fraction of its height. */
export const CAMERA_Y_BIAS = 0.38;
/** Seconds the camera takes to catch up to a horizontal lead. Softens hard turns. */
export const CAMERA_LAG = 0.12;

// ---------------------------------------------------------------------------
// Skiing
// ---------------------------------------------------------------------------

/**
 * Velocity for each steering direction, world units per second. Note these are
 * not a unit vector times a scalar: turning genuinely costs you total speed,
 * which is what makes the fall line worth taking.
 *
 * The fall-line speed matches the original exactly (25 m/s). The curve away from
 * it is gentler: the original nearly stops your descent at 45 degrees, which is
 * punishing enough that dodging a tree costs you the race. These values keep
 * turning expensive without making it a mistake.
 */
export const DIRECTION_VELOCITY: Record<Direction, Vec2> = {
  left: { x: -112, y: 14 },
  leftDown: { x: -100, y: 152 },
  shallowLeft: { x: -38, y: 190 },
  down: { x: 0, y: 200 },
  shallowRight: { x: 38, y: 190 },
  rightDown: { x: 100, y: 152 },
  right: { x: 112, y: 14 },
};

/** Straight down the fall line, folded into a racing tuck. The fastest you go. */
export const TUCK_VELOCITY: Vec2 = { x: 0, y: 268 };

/** Seconds for velocity to close ~63% of the gap to its target. */
export const VELOCITY_TIME_CONSTANT = 0.16;

/**
 * Airborne skiers glide: descent is multiplied by this while off the snow.
 *
 * This number is load-bearing. `TUCK_VELOCITY.y * AIR_GLIDE_BONUS` must stay
 * comfortably above {@link MONSTER_SPEED}, because hammering the jump key is the
 * only thing that outruns the monster. If you change either, re-check both.
 */
export const AIR_GLIDE_BONUS = 1.22;

/** Fraction of speed kept on touchdown, and how long the penalty lasts. */
export const LANDING_SPEED_KEEP = 0.85;
export const LANDING_RECOVERY = 0.25;

/** Sideways drift authority while airborne, relative to on-snow steering. */
export const AIR_STEER_FACTOR = 0.55;

// ---------------------------------------------------------------------------
// Jumping, flips and style
// ---------------------------------------------------------------------------

/** Downward acceleration applied to jump height, units per second squared. */
export const GRAVITY = 900;

/** Launch velocities for the three ways to leave the ground. */
export const JUMP_VZ = 195;
export const RAMP_VZ = 330;
export const MOGUL_VZ = 118;
/** A mogul only kicks you up if you are moving at least this fast. */
export const MOGUL_MIN_SPEED = 120;

/** Seconds one full somersault takes. Land mid-rotation and you eat snow. */
export const FLIP_DURATION = 0.4;

export const STYLE_PER_FLIP = 160;
export const STYLE_PER_AIR_SECOND = 45;
export const STYLE_PER_MONSTER_ESCAPE = 2000;
/** Style is halved, not zeroed, by a crash — a bad landing still cost you air. */
export const STYLE_CRASH_PENALTY = 0.5;

// ---------------------------------------------------------------------------
// Crashing
// ---------------------------------------------------------------------------

/** Seconds sprawled in the snow, then seconds sitting up before skiing again. */
export const CRASH_SPRAWL = 0.55;
export const CRASH_SIT = 0.8;
/** How fast the sprawl slides to a halt. */
export const CRASH_FRICTION = 3.2;

/** Seconds of collision immunity after getting back up, so you can ski clear. */
export const CRASH_IMMUNITY = 0.7;

/** Player collision footprint at the skis, world units. */
export const PLAYER_FOOTPRINT = { w: 9, h: 6 };

// ---------------------------------------------------------------------------
// The Abominable Snow Monster
// ---------------------------------------------------------------------------

/**
 * Metres before the first monster shows up. The number everybody remembers, and
 * the original's exactly — its check is `worldY > 32000` at 16 units per metre.
 */
export const MONSTER_DISTANCE_M = 2000;

/**
 * When the monster is released.
 *
 * 2,000 m at the fall-line top speed of 25 m/s is 80 seconds of *perfect*
 * tucking; a real player who turns and crashes can easily spend well over two
 * minutes without ever meeting the thing the game is famous for. So the default
 * adds a time net. It is set above the ~97 s a good tucking run actually takes,
 * so a competent player still meets the monster at 2,000 m exactly as in the
 * original, and only a dawdler gets caught by the clock instead.
 */
export const MONSTER_TRIGGERS = {
  /** Distance only, precisely as the 1991 binary does it. */
  original: { metres: MONSTER_DISTANCE_M, seconds: null },
  /** The same distance, with a clock as a backstop. The default. */
  standard: { metres: MONSTER_DISTANCE_M, seconds: 100 },
  /** For when you just want to be chased. */
  often: { metres: 500, seconds: 40 },
} as const satisfies Record<string, { metres: number; seconds: number | null }>;

export type MonsterTriggerId = keyof typeof MONSTER_TRIGGERS;

export const DEFAULT_MONSTER_TRIGGER: MonsterTriggerId = "standard";
/** Extra metres of grace after escaping one before the next is released. */
export const MONSTER_RESPAWN_GAP_M = 400;
/**
 * Base chase speed. Sits above a tuck (268) and below an airborne tuck (327),
 * which is the whole design of the chase: skiing loses, hopping wins.
 */
export const MONSTER_SPEED = 300;
/** Each monster after the first is this much faster than the last. */
export const MONSTER_SPEED_STEP = 1.04;
/**
 * How far up-slope of the player a monster materialises. Tuned so it takes a
 * few seconds to appear over the top of the view — long enough that the roar and
 * the silhouette land before it does.
 */
export const MONSTER_SPAWN_LEAD = 360;
/** Distance at which it grabs you. */
export const MONSTER_CATCH_RANGE = 13;
/** Lead you must hold, and for how long, before it gives up. */
export const MONSTER_ESCAPE_DISTANCE = 340;
export const MONSTER_ESCAPE_TIME = 2;
/** Seconds of eating animation before the run is over. */
export const MONSTER_EAT_FRAME = 0.42;

// ---------------------------------------------------------------------------
// The mountain
// ---------------------------------------------------------------------------

/** Procedural generation works in square chunks this many units on a side. */
export const CHUNK_SIZE = 256;
/** Objects generated per chunk once the slope is at full density. */
export const OBJECTS_PER_CHUNK = 14;
/** Metres of gentle, sparse slope before density reaches full. */
export const WARMUP_METRES = 45;

/** Horizontal spacing between chairlift lines. */
export const LIFT_SPACING = 900;
/**
 * Horizontal offset of the lift lines. Half a spacing, so the player — who
 * always starts at x = 0 — starts midway between two lifts rather than inside a
 * corridor with a pylon 300 units straight ahead of them.
 */
export const LIFT_PHASE = LIFT_SPACING / 2;
/** Vertical spacing between pylons on a lift line. */
export const TOWER_SPACING = 300;
/** Units of clear ground either side of a lift line's centre. */
export const LIFT_CORRIDOR = 34;
/** Chairs ride up the cable at this speed. */
export const CHAIR_SPEED = 96;
/** Spacing between chairs along the cable. */
export const CHAIR_SPACING = 150;

// ---------------------------------------------------------------------------
// Wildlife and other skiers
// ---------------------------------------------------------------------------

export const MAX_DOGS = 2;
export const MAX_SNOWBOARDERS = 3;
export const MAX_NPC_SKIERS = 3;
/** Mean seconds between attempts to spawn each kind of mobile entity. */
export const MOBILE_SPAWN_INTERVAL = 3.4;
/** Mobile entities are culled once this far outside the viewport. */
export const CULL_MARGIN = 220;

export const DOG_SPEED = 118;
export const SNOWBOARDER_SPEED = 150;
export const NPC_SKIER_SPEED = 168;

// ---------------------------------------------------------------------------
// Presentation
// ---------------------------------------------------------------------------

/** Points in the player's ski-track ring buffer. */
export const TRACK_POINTS = 420;
/** Units between recorded track points. */
export const TRACK_SPACING = 5;

export const SNOW_COLOUR = "#ffffff";
export const TRACK_COLOUR = "#dde6f0";
export const CABLE_COLOUR = "#3a3a3a";

/** Zoom is clamped to these integers so pixels stay square and crisp. */
export const MIN_ZOOM = 2;
export const MAX_ZOOM = 6;
/** Target visible slope width in world units; zoom is derived from this. */
export const TARGET_VIEW_WIDTH = 430;
