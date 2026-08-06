import { OBSTACLES, obstacleSprite } from "./catalog";
import {
  CABLE_COLOUR,
  CHAIR_SPACING,
  CHAIR_SPEED,
  CRASH_SIT,
  SNOW_COLOUR,
  TRACK_COLOUR,
  TRACK_POINTS,
} from "./constants";
import type { Game } from "./engine";
import { facingLeft, monsterRunFrame } from "./entities";
import { flipProgress } from "./player";
import { hash3 } from "./rng";
import type { BakedSprite, SpriteLibrary } from "./sprites";
import { blit, blitFaded } from "./sprites/render";
import {
  DIRECTIONS,
  type Mobile,
  type Obstacle,
  type Skier,
  type View,
} from "./types";
import { liftLineRange, liftLineX } from "./world";

/** Height of the chairlift cable above the snow, world units. */
const CABLE_HEIGHT = 34;
/** Horizontal offset of the up and down cables from the pylon centre. */
const CABLE_OFFSET = 5;
/** Half the gap between the two ski tracks, world units. */
const TRACK_HALF_WIDTH = 2.5;
/** Padding on the obstacle query so tall sprites anchored off screen still draw. */
const DRAW_PADDING = 48;
/** Opacity of the monster's silhouette when it is still off the top of the view. */
const OFFSCREEN_MONSTER_ALPHA = 0.32;

type Drawable =
  | { y: number; sort: number; what: "obstacle"; obstacle: Obstacle }
  | { y: number; sort: number; what: "mobile"; mobile: Mobile }
  | { y: number; sort: number; what: "player" }
  | { y: number; sort: number; what: "monster" };

export function renderGame(
  ctx: CanvasRenderingContext2D,
  game: Game,
  sprites: SpriteLibrary,
): void {
  const { view, zoom } = game;

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = SNOW_COLOUR;
  ctx.fillRect(0, 0, game.pixelWidth, game.pixelHeight);

  drawTracks(ctx, game);

  const obstacles: Obstacle[] = [];
  game.mountain.collect(
    view.left - DRAW_PADDING,
    view.top - DRAW_PADDING,
    view.right + DRAW_PADDING,
    view.bottom + DRAW_PADDING,
    obstacles,
  );

  // Decals go down first so trees and skiers pass over them.
  for (const obstacle of obstacles) {
    if (OBSTACLES[obstacle.kind].layer !== 0) continue;
    blitWorld(
      ctx,
      obstacleSprite(sprites, obstacle.kind),
      obstacle.x,
      obstacle.y,
      view,
      zoom,
    );
  }

  const layered = collectDepthSorted(game, obstacles);
  for (const item of layered) {
    switch (item.what) {
      case "obstacle":
        blitWorld(
          ctx,
          obstacleSprite(sprites, item.obstacle.kind),
          item.obstacle.x,
          item.obstacle.y,
          view,
          zoom,
        );
        break;
      case "mobile":
        blitWorld(
          ctx,
          mobileSprite(sprites, item.mobile),
          item.mobile.x,
          item.mobile.y,
          view,
          zoom,
        );
        break;
      case "player":
        drawPlayer(ctx, game, sprites);
        break;
      case "monster":
        drawMonster(ctx, game, sprites);
        break;
    }
  }

  drawChairlift(ctx, game, sprites);
  drawOffscreenMonsterHint(ctx, game, sprites);
}

// ---------------------------------------------------------------------------
// Depth sorting
// ---------------------------------------------------------------------------

function collectDepthSorted(game: Game, obstacles: Obstacle[]): Drawable[] {
  const items: Drawable[] = [];

  for (const obstacle of obstacles) {
    if (OBSTACLES[obstacle.kind].layer !== 1) continue;
    items.push({ y: obstacle.y, sort: obstacle.y, what: "obstacle", obstacle });
  }
  for (const mobile of game.mobiles) {
    items.push({ y: mobile.y, sort: mobile.y, what: "mobile", mobile });
  }

  const skier = game.skier;
  const hidden = skier.activity === "caught" || skier.activity === "eaten";
  if (!hidden) {
    // An airborne skier sorts by where they will land, but always draws in
    // front of anything they are currently flying over.
    items.push({
      y: skier.y,
      sort: skier.y + (skier.z > 0 ? 0.5 : 0),
      what: "player",
    });
  }
  if (game.monster) {
    items.push({
      y: game.monster.y,
      sort: game.monster.y + 0.25,
      what: "monster",
    });
  }

  items.sort((a, b) => a.sort - b.sort);
  return items;
}

// ---------------------------------------------------------------------------
// The player
// ---------------------------------------------------------------------------

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  game: Game,
  sprites: SpriteLibrary,
): void {
  const { skier, view, zoom } = game;
  const sprite = playerSprite(sprites, skier);
  const screenX = (skier.x - view.left) * zoom;
  const groundY = (skier.y - view.top) * zoom;

  if (skier.z > 1) {
    // The original has no shadows, but ramp jumps go high enough that without
    // one the player cannot tell where they are about to land.
    drawGroundShadow(ctx, screenX, groundY, zoom, skier.z);
  }

  blit(ctx, sprite, screenX, groundY - skier.z * zoom, zoom);
}

function playerSprite(sprites: SpriteLibrary, skier: Skier): BakedSprite {
  const sheet = sprites.skier;

  if (skier.activity === "crashed") {
    return skier.downTimer > CRASH_SIT ? sheet.crash : sheet.sit;
  }

  if (skier.activity === "airborne") {
    const progress = flipProgress(skier);
    if (progress === null) return sheet.jump;
    const frame = Math.min(3, Math.floor(progress * 4));
    return [sheet.flip1, sheet.flip2, sheet.flip3, sheet.flip4][frame];
  }

  if (skier.tucking) return sheet.tuck;
  return sheet[DIRECTIONS[skier.direction]];
}

function drawGroundShadow(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  groundY: number,
  zoom: number,
  height: number,
): void {
  // Shrinks and fades with height, so it reads as altitude rather than as a
  // second object on the snow.
  const spread = Math.max(0.35, 1 - height / 90);
  ctx.save();
  ctx.globalAlpha = 0.28 * spread;
  ctx.fillStyle = "#8fb4d8";
  ctx.beginPath();
  ctx.ellipse(
    screenX,
    groundY,
    6 * zoom * spread,
    2.2 * zoom * spread,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// The monster
// ---------------------------------------------------------------------------

function drawMonster(
  ctx: CanvasRenderingContext2D,
  game: Game,
  sprites: SpriteLibrary,
): void {
  const monster = game.monster;
  if (!monster) return;
  blitWorld(
    ctx,
    monsterSprite(sprites, game),
    monster.x,
    monster.y,
    game.view,
    game.zoom,
  );
}

function monsterSprite(sprites: SpriteLibrary, game: Game): BakedSprite {
  const monster = game.monster;
  const sheet = sprites.monster;
  if (!monster) return sheet.run1;

  switch (monster.activity) {
    case "grabbing":
      return sheet.grab;
    case "eating": {
      const frame = Math.min(2, Math.floor(monster.timer / 0.42));
      return [sheet.eat1, sheet.eat2, sheet.eat3][frame];
    }
    case "gloating":
      return sheet.gloat;
    default:
      return monsterRunFrame(monster) === 0 ? sheet.run1 : sheet.run2;
  }
}

/**
 * While the monster is still above the top of the view it is invisible, which
 * makes the first chase feel like an ambush rather than a threat. A faded
 * silhouette pinned to the top edge fixes that without giving away its exact
 * position.
 */
function drawOffscreenMonsterHint(
  ctx: CanvasRenderingContext2D,
  game: Game,
  sprites: SpriteLibrary,
): void {
  const monster = game.monster;
  if (!monster || monster.activity !== "chasing") return;
  if (monster.y >= game.view.top) return;

  const sprite = sprites.monster.run1;
  // Clamped into the viewport: a monster that is off to one side as well as
  // above would otherwise put its own warning off screen.
  const margin = (sprite.width / 2) * game.zoom;
  const screenX = Math.max(
    margin,
    Math.min(
      game.pixelWidth - margin,
      (monster.x - game.view.left) * game.zoom,
    ),
  );
  const pulse = 0.75 + 0.25 * Math.sin(game.clock * 7);
  blitFaded(
    ctx,
    sprite,
    screenX,
    sprite.height * game.zoom,
    game.zoom,
    OFFSCREEN_MONSTER_ALPHA * pulse,
  );
}

// ---------------------------------------------------------------------------
// Other people and animals
// ---------------------------------------------------------------------------

function mobileSprite(sprites: SpriteLibrary, mobile: Mobile): BakedSprite {
  const left = facingLeft(mobile);
  switch (mobile.kind) {
    case "dog":
      if (mobile.sitting > 0) return sprites.npc.dogSit;
      return left ? sprites.npc.dogLeft : sprites.npc.dogRight;
    case "snowboarder":
      return left ? sprites.npc.snowboarderLeft : sprites.npc.snowboarderRight;
    case "npcSkier":
      return left ? sprites.npc.skierNpcLeft : sprites.npc.skierNpcRight;
  }
}

// ---------------------------------------------------------------------------
// Chairlift
// ---------------------------------------------------------------------------

function drawChairlift(
  ctx: CanvasRenderingContext2D,
  game: Game,
  sprites: SpriteLibrary,
): void {
  const { view, zoom } = game;
  const lines = liftLineRange(view.left - 40, view.right + 40);
  if (lines.last < lines.first) return;

  const cableScreenLift = CABLE_HEIGHT * zoom;
  const travel = (game.clock * CHAIR_SPEED) % CHAIR_SPACING;
  const firstChair = Math.floor((view.top - 80) / CHAIR_SPACING);
  const lastChair = Math.ceil((view.bottom + 80) / CHAIR_SPACING);

  for (let line = lines.first; line <= lines.last; line++) {
    const lineX = liftLineX(line);

    for (const side of [-1, 1] as const) {
      const screenX = (lineX + side * CABLE_OFFSET - view.left) * zoom;
      ctx.strokeStyle = CABLE_COLOUR;
      ctx.lineWidth = Math.max(1, Math.round(zoom * 0.5));
      ctx.beginPath();
      ctx.moveTo(screenX, -cableScreenLift);
      ctx.lineTo(screenX, game.pixelHeight);
      ctx.stroke();

      for (let index = firstChair; index <= lastChair; index++) {
        // Chairs on the near cable ride up the mountain, the far cable down.
        const worldY = index * CHAIR_SPACING + (side < 0 ? -travel : travel);
        if (worldY < view.top - 80 || worldY > view.bottom + 80) continue;
        const occupied = hash3(game.seed, index, side) % 3 !== 0;
        const sprite = occupied
          ? sprites.lift.chairFull
          : sprites.lift.chairEmpty;
        blit(
          ctx,
          sprite,
          screenX,
          (worldY - view.top) * zoom - cableScreenLift,
          zoom,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Ski tracks
// ---------------------------------------------------------------------------

function drawTracks(ctx: CanvasRenderingContext2D, game: Game): void {
  const { trackCount, trackX, trackY, trackBreak, view, zoom } = game;
  if (trackCount < 2) return;

  const start = (game.trackHead - trackCount + TRACK_POINTS) % TRACK_POINTS;
  ctx.strokeStyle = TRACK_COLOUR;
  ctx.lineWidth = Math.max(1, Math.round(zoom * 0.85));
  ctx.lineCap = "round";

  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    let penDown = false;

    for (let i = 0; i < trackCount; i++) {
      const index = (start + i) % TRACK_POINTS;
      const previous = (start + Math.max(0, i - 1)) % TRACK_POINTS;
      const next = (start + Math.min(trackCount - 1, i + 1)) % TRACK_POINTS;

      // Offset each track perpendicular to the direction of travel, so a
      // sideways traverse leaves two lines rather than one.
      const dx = trackX[next] - trackX[previous];
      const dy = trackY[next] - trackY[previous];
      const length = Math.hypot(dx, dy) || 1;
      const offsetX = (-dy / length) * TRACK_HALF_WIDTH * side;
      const offsetY = (dx / length) * TRACK_HALF_WIDTH * side;

      const screenX = (trackX[index] + offsetX - view.left) * zoom;
      const screenY = (trackY[index] + offsetY - view.top) * zoom;

      if (!penDown || trackBreak[index] === 1) {
        ctx.moveTo(screenX, screenY);
        penDown = true;
      } else {
        ctx.lineTo(screenX, screenY);
      }
    }
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

function blitWorld(
  ctx: CanvasRenderingContext2D,
  sprite: BakedSprite,
  worldX: number,
  worldY: number,
  view: View,
  zoom: number,
): void {
  blit(
    ctx,
    sprite,
    (worldX - view.left) * zoom,
    (worldY - view.top) * zoom,
    zoom,
  );
}
