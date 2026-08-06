import {
  AIR_GLIDE_BONUS,
  AIR_STEER_FACTOR,
  CRASH_FRICTION,
  CRASH_SIT,
  CRASH_SPRAWL,
  DIRECTION_VELOCITY,
  FLIP_DURATION,
  GRAVITY,
  JUMP_VZ,
  LANDING_RECOVERY,
  LANDING_SPEED_KEEP,
  MOGUL_MIN_SPEED,
  MOGUL_VZ,
  TUCK_VELOCITY,
  VELOCITY_TIME_CONSTANT,
} from "./constants";
import { DIRECTION_DOWN, DIRECTIONS, type Skier } from "./types";

/**
 * Everything the player's body does. Scoring lives in the engine, so each step
 * reports what happened rather than awarding points itself.
 */
export type SkierEvents = {
  /** Touched down this frame. */
  landed: boolean;
  /** Wiped out this frame — a landing mid-somersault. */
  crashed: boolean;
  /** Somersaults completed this frame. */
  flipsCompleted: number;
  /** Seconds of air banked by a clean landing this frame. */
  airTimeBanked: number;
  /** Got back on their skis this frame. */
  recovered: boolean;
};

const NO_EVENTS: SkierEvents = {
  landed: false,
  crashed: false,
  flipsCompleted: 0,
  airTimeBanked: 0,
  recovered: false,
};

export function createSkier(): Skier {
  return {
    x: 0,
    y: 0,
    direction: DIRECTION_DOWN,
    vx: 0,
    vy: 0,
    activity: "skiing",
    z: 0,
    vz: 0,
    tucking: false,
    downTimer: 0,
    flipTimer: null,
    flipsThisJump: 0,
    landingTimer: 0,
    airTime: 0,
  };
}

/** True while the player is upright and in control of where they are going. */
export function isSteerable(skier: Skier): boolean {
  if (skier.activity === "skiing") return true;
  return skier.activity === "airborne" && skier.flipTimer === null;
}

export function steer(skier: Skier, poses: number): void {
  if (poses === 0 || !isSteerable(skier)) return;
  skier.direction = clampDirection(skier.direction + poses);
  // Any deliberate turn breaks the tuck, same as letting go of the key.
  if (skier.direction !== DIRECTION_DOWN) skier.tucking = false;
}

export function setDirection(skier: Skier, index: number): void {
  if (!isSteerable(skier)) return;
  skier.direction = clampDirection(index);
  if (skier.direction !== DIRECTION_DOWN) skier.tucking = false;
}

export function setTucking(skier: Skier, tucking: boolean): void {
  if (!isSteerable(skier)) {
    skier.tucking = false;
    return;
  }
  skier.tucking = tucking;
  if (tucking) skier.direction = DIRECTION_DOWN;
}

/**
 * Handles a jump press. On the snow it launches; in the air it starts a
 * somersault. Returns true if it did something, so the caller can make a noise.
 */
export function pressJump(skier: Skier): boolean {
  if (skier.activity === "skiing") {
    launch(skier, JUMP_VZ);
    return true;
  }
  if (skier.activity === "airborne" && skier.flipTimer === null) {
    // Only start a rotation there is time to finish, otherwise the player is
    // just being handed a crash they could not see coming.
    const timeToLand = timeUntilLanding(skier);
    if (timeToLand < FLIP_DURATION * 0.75) return false;
    skier.flipTimer = 0;
    return true;
  }
  return false;
}

export function launch(skier: Skier, vz: number): void {
  skier.activity = "airborne";
  skier.vz = vz;
  skier.z = Math.max(skier.z, 0.01);
  skier.airTime = 0;
  skier.flipsThisJump = 0;
  skier.tucking = false;
}

/** A mogul only kicks you into the air if you hit it with some pace. */
export function bump(skier: Skier): boolean {
  if (skier.activity !== "skiing") return false;
  if (speed(skier) < MOGUL_MIN_SPEED) return false;
  launch(skier, MOGUL_VZ);
  return true;
}

export function crash(skier: Skier): void {
  skier.activity = "crashed";
  skier.downTimer = CRASH_SPRAWL + CRASH_SIT;
  skier.z = 0;
  skier.vz = 0;
  skier.flipTimer = null;
  skier.flipsThisJump = 0;
  skier.airTime = 0;
  skier.tucking = false;
}

export function speed(skier: Skier): number {
  return Math.hypot(skier.vx, skier.vy);
}

/** Seconds until the skier's height returns to zero at the current velocity. */
export function timeUntilLanding(skier: Skier): number {
  if (skier.activity !== "airborne") return 0;
  const { z, vz } = skier;
  const discriminant = vz * vz + 2 * GRAVITY * z;
  if (discriminant <= 0) return 0;
  return (vz + Math.sqrt(discriminant)) / GRAVITY;
}

export function stepSkier(skier: Skier, dt: number): SkierEvents {
  const events: SkierEvents = { ...NO_EVENTS };

  if (skier.landingTimer > 0)
    skier.landingTimer = Math.max(0, skier.landingTimer - dt);

  switch (skier.activity) {
    case "skiing":
      approachTarget(skier, dt, 1, 1);
      break;

    case "airborne": {
      approachTarget(skier, dt, AIR_STEER_FACTOR, AIR_GLIDE_BONUS);
      skier.airTime += dt;

      if (skier.flipTimer !== null) {
        skier.flipTimer += dt;
        if (skier.flipTimer >= FLIP_DURATION) {
          skier.flipTimer = null;
          skier.flipsThisJump += 1;
          events.flipsCompleted += 1;
        }
      }

      skier.vz -= GRAVITY * dt;
      skier.z += skier.vz * dt;

      if (skier.z <= 0) {
        skier.z = 0;
        skier.vz = 0;
        if (skier.flipTimer !== null) {
          // Landed halfway through a somersault. That is a crash.
          crash(skier);
          events.crashed = true;
        } else {
          skier.activity = "skiing";
          skier.landingTimer = LANDING_RECOVERY;
          events.landed = true;
          events.airTimeBanked = skier.airTime;
        }
        skier.airTime = 0;
      }
      break;
    }

    case "crashed": {
      const decay = Math.exp(-CRASH_FRICTION * dt);
      skier.vx *= decay;
      skier.vy *= decay;
      skier.downTimer -= dt;
      if (skier.downTimer <= 0) {
        skier.activity = "skiing";
        skier.direction = DIRECTION_DOWN;
        skier.downTimer = 0;
        events.recovered = true;
      }
      break;
    }

    case "caught":
    case "eaten":
      // The monster is driving now. Bleed off any remaining momentum.
      skier.vx *= Math.exp(-8 * dt);
      skier.vy *= Math.exp(-8 * dt);
      break;
  }

  skier.x += skier.vx * dt;
  skier.y += skier.vy * dt;

  return events;
}

/** How far through the current somersault the skier is, 0 to 1. */
export function flipProgress(skier: Skier): number | null {
  if (skier.flipTimer === null) return null;
  return Math.min(1, skier.flipTimer / FLIP_DURATION);
}

function approachTarget(
  skier: Skier,
  dt: number,
  lateralFactor: number,
  descentFactor: number,
): void {
  const pose =
    skier.tucking && skier.direction === DIRECTION_DOWN
      ? TUCK_VELOCITY
      : DIRECTION_VELOCITY[DIRECTIONS[skier.direction]];

  // The landing penalty is the cost of absorbing an impact through your knees,
  // so it only applies while there is snow under them. Leaving the ground again
  // immediately dodges it — which is precisely the skill the monster tests.
  const scale = skier.activity === "airborne" ? 1 : landingSpeedScale(skier);
  const targetVx = pose.x * lateralFactor * scale;
  const targetVy = pose.y * descentFactor * scale;

  // Exponential approach: frame-rate independent and never overshoots.
  const k = 1 - Math.exp(-dt / VELOCITY_TIME_CONSTANT);
  skier.vx += (targetVx - skier.vx) * k;
  skier.vy += (targetVy - skier.vy) * k;
}

function landingSpeedScale(skier: Skier): number {
  if (skier.landingTimer <= 0) return 1;
  const remaining = skier.landingTimer / LANDING_RECOVERY;
  return LANDING_SPEED_KEEP + (1 - LANDING_SPEED_KEEP) * (1 - remaining);
}

function clampDirection(index: number): number {
  return Math.max(0, Math.min(DIRECTIONS.length - 1, index));
}
