export type Vec2 = { x: number; y: number };

/**
 * The seven steering headings, ordered left to right so turning is `index ± 1`.
 *
 * Seven is not arbitrary: it is what the original has (full traverse, 45°, and
 * shallow on each side of the fall line), and a clone with fewer reads as wrong
 * immediately — the shallow states are what let you make fine corrections
 * without throwing away your descent.
 */
export const DIRECTIONS = [
  "left",
  "leftDown",
  "shallowLeft",
  "down",
  "shallowRight",
  "rightDown",
  "right",
] as const;

export type Direction = (typeof DIRECTIONS)[number];

/** Index of the fall-line direction in {@link DIRECTIONS}. */
export const DIRECTION_DOWN = 3;

/**
 * What the player is currently doing. `caught` and `eaten` are the two halves
 * of the monster's meal: `caught` still animates, `eaten` ends the run.
 */
export type SkierActivity =
  | "skiing"
  | "airborne"
  | "crashed"
  | "caught"
  | "eaten";

export type RunPhase = "attract" | "running" | "paused" | "over";

/** Anything static that was generated into a chunk of the mountain. */
export type ObstacleKind =
  | "treeTall"
  | "treeShort"
  | "treeBare"
  | "stump"
  | "rock"
  | "rockSmall"
  | "mogul"
  | "ramp"
  | "snowPatch"
  | "sign"
  | "liftTower";

export type Obstacle = {
  readonly kind: ObstacleKind;
  readonly x: number;
  readonly y: number;
};

export type MobileKind = "dog" | "snowboarder" | "npcSkier";

export type Mobile = {
  id: number;
  kind: MobileKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds alive, used to drive walk cycles and weaving. */
  age: number;
  /** Phase offset so entities of the same kind do not move in lockstep. */
  phase: number;
  /** Dogs sit down beside a fallen skier. Seconds remaining of the sit. */
  sitting: number;
};

/** The slice of the mountain currently on screen, in world units. */
export type View = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

export type MonsterActivity =
  | "chasing"
  | "grabbing"
  | "eating"
  | "gloating"
  | "leaving";

export type Monster = {
  x: number;
  y: number;
  speed: number;
  activity: MonsterActivity;
  /** Seconds spent in the current activity. */
  timer: number;
  /** Seconds the player has held an escaping lead. */
  escapeTimer: number;
  /** Which monster of the run this is, 1-based. */
  ordinal: number;
};

export type Skier = {
  x: number;
  y: number;
  /** Index into {@link DIRECTIONS}. */
  direction: number;
  /** Current velocity, world units per second. Lerps toward the target. */
  vx: number;
  vy: number;
  activity: SkierActivity;
  /** Height above the snow, world units. Zero while on the ground. */
  z: number;
  vz: number;
  /** Whether the player is holding the tuck. */
  tucking: boolean;
  /** Seconds remaining of the current crash/stumble. */
  downTimer: number;
  /** Seconds into the current somersault, or null if not flipping. */
  flipTimer: number | null;
  /** Somersaults completed since leaving the ground. */
  flipsThisJump: number;
  /** Seconds remaining of the post-landing speed penalty. */
  landingTimer: number;
  /** Seconds spent in the air on the current jump. */
  airTime: number;
};

export type RunStats = {
  /** Seconds of the current run. */
  time: number;
  /** Metres travelled down the slope. */
  distance: number;
  /** Current speed in metres per second. */
  speed: number;
  /** Fastest speed reached this run, metres per second. */
  topSpeed: number;
  style: number;
  crashes: number;
  /** Monsters shaken off this run. */
  escapes: number;
};

export type ScoreRecord = {
  distance: number;
  style: number;
  time: number;
  /** Milliseconds since the epoch, stamped when the run ended. */
  at: number;
};

export type GameOverReason = "eaten" | "quit";
