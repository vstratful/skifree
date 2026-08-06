import type { SoundBoard } from "./audio";
import { OBSTACLES } from "./catalog";
import {
  CAMERA_LAG,
  CAMERA_Y_BIAS,
  CHUNK_SIZE,
  CRASH_IMMUNITY,
  DEFAULT_MONSTER_TRIGGER,
  MAX_DOGS,
  MAX_NPC_SKIERS,
  MAX_SNOWBOARDERS,
  MAX_ZOOM,
  MIN_ZOOM,
  MOBILE_SPAWN_INTERVAL,
  MONSTER_DISTANCE_M,
  MONSTER_RESPAWN_GAP_M,
  MONSTER_SPEED,
  MONSTER_SPEED_STEP,
  MONSTER_TRIGGERS,
  type MonsterTriggerId,
  PLAYER_FOOTPRINT,
  RAMP_VZ,
  STYLE_CRASH_PENALTY,
  STYLE_PER_AIR_SECOND,
  STYLE_PER_FLIP,
  STYLE_PER_MONSTER_ESCAPE,
  TARGET_VIEW_WIDTH,
  TRACK_POINTS,
  TRACK_SPACING,
  UNITS_PER_METRE,
} from "./constants";
import {
  shouldCull,
  spawnMobile,
  spawnMonster,
  stepMobile,
  stepMonster,
} from "./entities";
import type { InputController } from "./input";
import {
  bump,
  crash,
  createSkier,
  launch,
  pressJump,
  setDirection,
  setTucking,
  steer,
  stepSkier,
} from "./player";
import { createRng, type Rng, randomSeed } from "./rng";
import {
  DIRECTION_DOWN,
  type Mobile,
  type MobileKind,
  type Monster,
  type Obstacle,
  type RunPhase,
  type RunStats,
  type Skier,
  type View,
} from "./types";
import { Mountain } from "./world";

/**
 * Physics runs on a fixed 120 Hz step regardless of display refresh rate. At a
 * tuck's 268 units/second the skier covers 2.2 units per step, comfortably less
 * than the 5-unit-tall footprint of a tree trunk, so nobody tunnels through a
 * spruce on a dropped frame.
 */
const FIXED_DT = 1 / 120;
/** Cap on catch-up steps per frame, so a stall cannot spiral. */
const MAX_SUBSTEPS = 10;
/** Metres of slope to cover before wildlife starts appearing. */
const MOBILE_GRACE_METRES = 25;
/** Contact distance with another person on the mountain. */
const MOBILE_HIT_RANGE = 11;
/** Seconds between chunk-cache sweeps. */
const PRUNE_INTERVAL = 1;

/**
 * Upper angle bound (degrees off the fall line) for each heading bar the last,
 * so the cursor's bearing picks one of the seven poses. Six thresholds, seven
 * poses; anything past the final bound is a full traverse.
 */
const POINTER_POSE_LIMITS = [-60, -31, -9, 9, 31, 60];

export class Game {
  seed: number;
  mountain: Mountain;
  skier: Skier;
  readonly mobiles: Mobile[] = [];
  monster: Monster | null = null;
  stats: RunStats = emptyStats();
  phase: RunPhase = "attract";

  /** Seconds of animation time. Frozen while paused. */
  clock = 0;
  /** Integer device pixels per world unit. */
  zoom = 3;
  view: View = { left: 0, right: 0, top: 0, bottom: 0, width: 0, height: 0 };

  cssWidth = 0;
  cssHeight = 0;
  pixelWidth = 0;
  pixelHeight = 0;
  /** CSS pixels per world unit — needed to read the pointer position. */
  cssPerUnit = 1;

  cameraX = 0;
  cameraY = 0;

  /** Monsters released so far this run. */
  monsterOrdinal = 0;

  // Ski tracks, kept as a ring buffer of world-space points. A break flag marks
  // where the skier left the snow so the trail is not drawn through the air.
  readonly trackX = new Float32Array(TRACK_POINTS);
  readonly trackY = new Float32Array(TRACK_POINTS);
  readonly trackBreak = new Uint8Array(TRACK_POINTS);
  trackHead = 0;
  trackCount = 0;

  onPhaseChange: ((phase: RunPhase) => void) | null = null;

  private readonly sound: SoundBoard;
  private rng: Rng;
  private accumulator = 0;
  private immunity = 0;
  /** Which release rule the monster follows. Survives a restart. */
  monsterTriggerId: MonsterTriggerId = DEFAULT_MONSTER_TRIGGER;
  private nextMonsterAtM = MONSTER_DISTANCE_M;
  private nextMonsterAtT = Number.POSITIVE_INFINITY;
  private bestY = 0;
  private spawnTimer = 2.5;
  private pruneTimer = PRUNE_INTERVAL;
  private lastTrackX = 0;
  private lastTrackY = 0;
  private trackBreakPending = true;
  /** Reused between frames so collision does not allocate. */
  private readonly nearby: Obstacle[] = [];

  constructor(sound: SoundBoard, seed: number = randomSeed()) {
    this.sound = sound;
    this.seed = seed;
    this.mountain = new Mountain(seed);
    this.skier = createSkier();
    this.rng = createRng(seed ^ 0x9e3779b9);
    // Must be armed here as well as in reset(): the first run of a session goes
    // straight from the constructor to start(), and a field initialiser alone
    // would leave the clock backstop at Infinity for that whole run.
    this.armNextMonster(0, 0);
  }

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  reset(seed: number = randomSeed()): void {
    this.seed = seed;
    this.mountain = new Mountain(seed);
    this.skier = createSkier();
    this.mobiles.length = 0;
    this.monster = null;
    this.stats = emptyStats();
    this.clock = 0;
    this.accumulator = 0;
    this.immunity = 0;
    this.monsterOrdinal = 0;
    this.armNextMonster(0, 0);
    this.bestY = 0;
    this.spawnTimer = 2.5;
    this.pruneTimer = PRUNE_INTERVAL;
    this.trackHead = 0;
    this.trackCount = 0;
    this.trackBreakPending = true;
    this.lastTrackX = 0;
    this.lastTrackY = 0;
    this.cameraX = 0;
    this.cameraY = 0;
    this.rng = createRng(seed ^ 0x9e3779b9);
    this.setPhase("attract");
    this.updateView();
  }

  start(): void {
    if (this.phase === "running") return;
    if (this.phase === "over") {
      this.reset();
    }
    this.setPhase("running");
    this.sound.play("start");
  }

  togglePause(): void {
    if (this.phase === "running") this.setPhase("paused");
    else if (this.phase === "paused") this.setPhase("running");
  }

  /** True when the player is mid-run, alive or being digested. */
  get isLive(): boolean {
    return this.phase === "running" || this.phase === "paused";
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.cssWidth = cssWidth;
    this.cssHeight = cssHeight;
    this.pixelWidth = Math.max(1, Math.floor(cssWidth * dpr));
    this.pixelHeight = Math.max(1, Math.floor(cssHeight * dpr));
    // Zoom is an integer so one sprite pixel is a whole number of device
    // pixels; anything else reintroduces the blur we are avoiding.
    const ideal = Math.round(this.pixelWidth / TARGET_VIEW_WIDTH) || MIN_ZOOM;
    this.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, ideal));
    this.updateView();
  }

  // -------------------------------------------------------------------------
  // Frame
  // -------------------------------------------------------------------------

  update(realDt: number, input: InputController): void {
    if (this.phase !== "paused") this.clock += realDt;

    // Always drain the input edges. Leaving them queued while paused or in a
    // menu means the run resumes with a burst of stale turns and jumps.
    const direct = input.takeDirectDirection();
    const turns = input.takeTurn(realDt);
    const jumpPressed = input.takeJump();

    if (this.phase !== "running") {
      this.updateView();
      return;
    }

    this.applyInput(input, direct, turns, jumpPressed);

    this.accumulator += realDt;
    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_SUBSTEPS) {
      this.accumulator -= FIXED_DT;
      this.step(FIXED_DT);
      steps += 1;
    }
    // Drop any backlog rather than trying to catch up forever.
    if (steps === MAX_SUBSTEPS) this.accumulator = 0;

    this.updateStats();
    this.updateView();
    this.spawnMobiles(realDt);
    this.cullMobiles();

    this.pruneTimer -= realDt;
    if (this.pruneTimer <= 0) {
      this.pruneTimer = PRUNE_INTERVAL;
      this.mountain.prune(this.skier.x, this.skier.y, CHUNK_SIZE * 5);
    }
  }

  private applyInput(
    input: InputController,
    direct: number | null,
    turns: number,
    jumpPressed: boolean,
  ): void {
    const skier = this.skier;

    if (input.mode === "pointer" && input.pointer) {
      this.steerToPointer(input.pointer);
    } else {
      if (direct !== null) setDirection(skier, direct);
      steer(skier, turns);
      setTucking(skier, input.tucking);
    }

    if (jumpPressed) {
      const wasAirborne = skier.activity === "airborne";
      if (pressJump(skier)) this.sound.play(wasAirborne ? "flip" : "jump");
    }
  }

  /** Steers toward the cursor, exactly as the original's mouse control does. */
  private steerToPointer(pointer: { x: number; y: number }): void {
    const worldX = this.view.left + pointer.x / this.cssPerUnit;
    const worldY = this.view.top + pointer.y / this.cssPerUnit;
    const dx = worldX - this.skier.x;
    // Clamping dy keeps the angle sane when the cursor is level with or above
    // the skier: aiming behind yourself means a full sideways stop.
    const dy = Math.max(worldY - this.skier.y, 1);
    const degrees = (Math.atan2(dx, dy) * 180) / Math.PI;

    let pose = POINTER_POSE_LIMITS.length;
    for (let i = 0; i < POINTER_POSE_LIMITS.length; i++) {
      if (degrees < POINTER_POSE_LIMITS[i]) {
        pose = i;
        break;
      }
    }
    setDirection(this.skier, pose);
    setTucking(
      this.skier,
      pose === DIRECTION_DOWN && Math.abs(degrees) < 8 && dy > 70,
    );
  }

  private step(dt: number): void {
    const events = stepSkier(this.skier, dt);

    if (events.flipsCompleted > 0) {
      this.stats.style += events.flipsCompleted * STYLE_PER_FLIP;
    }
    if (events.landed) {
      this.stats.style += Math.round(
        events.airTimeBanked * STYLE_PER_AIR_SECOND,
      );
      this.sound.play("land");
    }
    if (events.crashed) this.registerCrash();
    if (events.recovered) this.immunity = CRASH_IMMUNITY;

    if (this.immunity > 0) this.immunity -= dt;

    this.collideWithSlope();
    this.collideWithMobiles();

    for (const mobile of this.mobiles) stepMobile(mobile, dt, this.skier);
    this.updateMonster(dt);

    this.stats.time += dt;
    this.recordTrack();
    this.moveCamera(dt);
  }

  // -------------------------------------------------------------------------
  // Collision
  // -------------------------------------------------------------------------

  private collideWithSlope(): void {
    const skier = this.skier;
    if (skier.activity === "crashed" || skier.activity === "caught") return;
    if (skier.activity === "eaten") return;
    if (this.immunity > 0) return;

    const half = PLAYER_FOOTPRINT.w / 2;
    const left = skier.x - half;
    const right = skier.x + half;
    const top = skier.y - PLAYER_FOOTPRINT.h;
    const bottom = skier.y;

    this.nearby.length = 0;
    this.mountain.collect(
      skier.x - 48,
      skier.y - 48,
      skier.x + 48,
      skier.y + 48,
      this.nearby,
    );

    for (const obstacle of this.nearby) {
      const spec = OBSTACLES[obstacle.kind];
      const footprint = spec.footprint;
      if (!footprint) continue;
      if (skier.z > spec.clearance) continue;

      const obstacleHalf = footprint.w / 2;
      if (right < obstacle.x - obstacleHalf) continue;
      if (left > obstacle.x + obstacleHalf) continue;
      if (bottom < obstacle.y - footprint.h) continue;
      if (top > obstacle.y) continue;

      switch (spec.effect) {
        case "crash":
          crash(skier);
          this.registerCrash();
          return;
        case "launch":
          if (skier.activity === "skiing") {
            launch(skier, RAMP_VZ);
            this.sound.play("jump");
          }
          return;
        case "bump":
          if (bump(skier)) this.sound.play("bump");
          return;
        case "none":
          break;
      }
    }
  }

  private collideWithMobiles(): void {
    const skier = this.skier;
    if (skier.activity !== "skiing") return;
    if (this.immunity > 0) return;

    for (const mobile of this.mobiles) {
      // Dogs are pure comedy — they get under your feet but never fell you.
      if (mobile.kind === "dog") continue;
      if (
        Math.hypot(mobile.x - skier.x, mobile.y - skier.y) < MOBILE_HIT_RANGE
      ) {
        crash(skier);
        this.registerCrash();
        return;
      }
    }
  }

  private registerCrash(): void {
    this.stats.crashes += 1;
    // Halved, not zeroed: a botched landing still earned you the airtime.
    this.stats.style = Math.floor(this.stats.style * STYLE_CRASH_PENALTY);
    this.sound.play("crash");
  }

  // -------------------------------------------------------------------------
  // The monster
  // -------------------------------------------------------------------------

  private updateMonster(dt: number): void {
    if (!this.monster) {
      // Distance or the clock, whichever comes first.
      if (
        this.stats.distance < this.nextMonsterAtM &&
        this.stats.time < this.nextMonsterAtT
      ) {
        return;
      }
      this.monsterOrdinal += 1;
      this.monster = spawnMonster(
        this.skier,
        this.monsterOrdinal,
        MONSTER_SPEED * MONSTER_SPEED_STEP ** (this.monsterOrdinal - 1),
      );
      this.sound.play("roar");
      return;
    }

    const events = stepMonster(this.monster, dt, this.skier);

    if (events.grabbed) {
      this.skier.activity = "caught";
      this.sound.play("eaten");
    }
    if (events.escaped) {
      this.stats.escapes += 1;
      this.stats.style += STYLE_PER_MONSTER_ESCAPE;
      this.armNextMonster(
        this.stats.distance + MONSTER_RESPAWN_GAP_M,
        this.stats.time,
      );
      this.sound.play("escape");
    }
    if (events.finished) {
      this.skier.activity = "eaten";
      this.setPhase("over");
    }
    if (events.gone) this.monster = null;
  }

  // -------------------------------------------------------------------------
  // Wildlife
  // -------------------------------------------------------------------------

  private spawnMobiles(dt: number): void {
    if (this.stats.distance < MOBILE_GRACE_METRES) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    this.spawnTimer = MOBILE_SPAWN_INTERVAL * this.rng.range(0.6, 1.6);

    let dogs = 0;
    let snowboarders = 0;
    let skiers = 0;
    for (const mobile of this.mobiles) {
      if (mobile.kind === "dog") dogs += 1;
      else if (mobile.kind === "snowboarder") snowboarders += 1;
      else skiers += 1;
    }

    // Weighted by repetition: people outnumber dogs on a real slope.
    const options: MobileKind[] = [];
    if (dogs < MAX_DOGS) options.push("dog");
    if (snowboarders < MAX_SNOWBOARDERS)
      options.push("snowboarder", "snowboarder");
    if (skiers < MAX_NPC_SKIERS) options.push("npcSkier", "npcSkier");
    if (options.length === 0) return;

    this.mobiles.push(
      spawnMobile(this.rng.pick(options), this.view, this.skier, this.rng),
    );
  }

  private cullMobiles(): void {
    let kept = 0;
    for (let i = 0; i < this.mobiles.length; i++) {
      const mobile = this.mobiles[i];
      if (!shouldCull(mobile, this.view)) this.mobiles[kept++] = mobile;
    }
    this.mobiles.length = kept;
  }

  // -------------------------------------------------------------------------
  // Bookkeeping
  // -------------------------------------------------------------------------

  /**
   * Changes the monster's release rule. Takes effect immediately if none has been
   * released yet, so the Options menu can be used mid-run.
   */
  setMonsterTrigger(id: MonsterTriggerId): void {
    this.monsterTriggerId = id;
    if (this.monsterOrdinal === 0) this.armNextMonster(0, this.stats.time);
  }

  /**
   * Arms the next release. `metresFloor` is a distance already banked (used for
   * respawns); the configured distance wins if it is further out.
   */
  private armNextMonster(metresFloor: number, fromSeconds: number): void {
    const trigger = MONSTER_TRIGGERS[this.monsterTriggerId];
    this.nextMonsterAtM = Math.max(metresFloor, trigger.metres);
    this.nextMonsterAtT =
      trigger.seconds === null
        ? Number.POSITIVE_INFINITY
        : fromSeconds + trigger.seconds;
  }

  private updateStats(): void {
    this.bestY = Math.max(this.bestY, this.skier.y);
    this.stats.distance = Math.max(0, this.bestY / UNITS_PER_METRE);
    this.stats.speed =
      Math.hypot(this.skier.vx, this.skier.vy) / UNITS_PER_METRE;
    this.stats.topSpeed = Math.max(this.stats.topSpeed, this.stats.speed);
  }

  private moveCamera(dt: number): void {
    // Horizontal lag softens hard turns; vertical is exact, because a laggy
    // fall line makes the whole slope feel like it is floating.
    const k = 1 - Math.exp(-dt / CAMERA_LAG);
    this.cameraX += (this.skier.x - this.cameraX) * k;
    this.cameraY = this.skier.y;
  }

  private updateView(): void {
    const width = this.pixelWidth / this.zoom;
    const height = this.pixelHeight / this.zoom;
    const left = this.cameraX - width / 2;
    const top = this.cameraY - height * CAMERA_Y_BIAS;
    this.view = {
      left,
      right: left + width,
      top,
      bottom: top + height,
      width,
      height,
    };
    this.cssPerUnit = width > 0 ? this.cssWidth / width : 1;
  }

  private recordTrack(): void {
    const skier = this.skier;
    if (skier.activity !== "skiing" && skier.activity !== "crashed") {
      this.trackBreakPending = true;
      return;
    }

    const dx = skier.x - this.lastTrackX;
    const dy = skier.y - this.lastTrackY;
    const moved = dx * dx + dy * dy >= TRACK_SPACING * TRACK_SPACING;
    if (this.trackCount > 0 && !moved && !this.trackBreakPending) return;

    this.trackX[this.trackHead] = skier.x;
    this.trackY[this.trackHead] = skier.y;
    this.trackBreak[this.trackHead] = this.trackBreakPending ? 1 : 0;
    this.trackHead = (this.trackHead + 1) % TRACK_POINTS;
    this.trackCount = Math.min(TRACK_POINTS, this.trackCount + 1);
    this.trackBreakPending = false;
    this.lastTrackX = skier.x;
    this.lastTrackY = skier.y;
  }

  private setPhase(phase: RunPhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.onPhaseChange?.(phase);
  }
}

function emptyStats(): RunStats {
  return {
    time: 0,
    distance: 0,
    speed: 0,
    topSpeed: 0,
    style: 0,
    crashes: 0,
    escapes: 0,
  };
}
