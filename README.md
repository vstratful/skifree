# SkiFree

A faithful clone of Chris Pirih's 1991 Windows shareware game, rebuilt as a
canvas game inside a Next.js app. Endless procedural slope, hand-authored pixel
art, and an Abominable Snow Monster waiting at 2,000 metres.

## Running it

```bash
pnpm install
pnpm dev      # http://localhost:3000
```

There is a build log at [`/buildlog`](http://localhost:3000/buildlog) — how the
thing came to exist, what the disassembly of the original turned up, and the bugs
that only showed up because it was tested without a browser. Also reachable from
the game's Help menu.

```bash
pnpm build    # production build
pnpm lint     # biome
pnpm format   # biome, writing fixes
```

## Controls

The number keys are the **NumPad**, as in the original — where the top-row digits
did nothing at all. They are mapped here too, as a convenience.

| Keys                        | Effect                                                       |
| --------------------------- | ------------------------------------------------------------ |
| `←` `→` / NumPad `4` `6`     | Turn one heading at a time. Hold to keep turning.            |
| `↓` / NumPad `2`             | Straighten up and tuck — the fastest you can go.             |
| NumPad `7` `9` / `Home` `PgUp` | Snap to a full sideways traverse, which all but stops you. |
| NumPad `1` `3` / `End` `PgDn`  | Snap to a shallow heading, just off the fall line.         |
| `1`–`7`                      | Pick any of the seven headings outright (an addition).       |
| `Ins` / NumPad `0` / `F` / `Space` | Jump. Press again in the air to somersault.            |
| Mouse                        | Steer toward the cursor; click to jump.                      |
| `F3` / `P`                   | Pause. `Esc` closes whatever is open, or pauses.             |
| `M`                          | Sound on/off.                                                |
| `F2` / `R`                   | New run.                                                     |
| `F1` / `H`                   | How to ski.                                                  |

## How it fits together

Everything under `src/game/` is plain TypeScript with no React in it. The React
layer (`src/components/`) owns the window chrome, the dialogs and the animation
frame; it hands the engine a delta and an input controller and then blits
whatever comes back.

| Module         | Responsibility                                                            |
| -------------- | ------------------------------------------------------------------------- |
| `engine.ts`    | The `Game` object: fixed-step loop, collision, scoring, camera, spawning.  |
| `player.ts`    | The skier's state machine — poses, jumps, somersaults, crashes.            |
| `entities.ts`  | Dogs, snowboarders, other skiers, and the monster's chase/eat behaviour.   |
| `world.ts`     | The mountain. Infinite, generated in chunks, cached and pruned.            |
| `catalog.ts`   | Per-obstacle collision footprints, clearances and scatter weights.         |
| `draw.ts`      | Depth-sorted rendering, ski tracks, chairlift.                             |
| `input.ts`     | Keyboard and mouse, exposed as edges the engine drains once per frame.     |
| `rng.ts`       | Seeded generators, plus the hash the mountain is derived from.             |
| `audio.ts`     | Oscillator-synthesised sound effects. Nothing is sampled.                  |
| `score.ts`     | High scores in `localStorage`, defensively.                                |
| `constants.ts` | Every tuning number in the game, in one place.                             |
| `sprites/`     | Hand-authored pixel art plus the baker that turns it into bitmaps.         |

A few decisions worth knowing before you change anything:

**World units are sprite pixels.** One world unit is one pixel of a sprite at 1×
zoom, and `UNITS_PER_METRE` (8) converts to the distance the HUD shows. The
renderer picks an integer zoom for the viewport, so nothing else in the game has
to know how big the window is.

**Physics runs at a fixed 120 Hz.** `Game.update` accumulates real time and
steps the world in fixed slices. At a tuck's 268 units/second that is 2.2 units
per step, comfortably less than the 5-unit-tall footprint of a tree trunk — which
is the only reason nobody tunnels through a spruce on a dropped frame. If you
raise the top speed, check that inequality still holds.

**Chunks must be reproducible.** `world.ts` derives a chunk's contents from a
hash of the run seed and the chunk coordinates, never from a rolling stream. That
is what lets the cache be pruned aggressively without the slope rearranging
itself behind you. Anything that reads from `Rng` in generation order will break
this.

**Collision happens at an object's base.** A tree's footprint is nine units
wide, not the twenty-two its canopy occupies. That mismatch is deliberate and is
what makes threading a gap between two overlapping trees possible, exactly as in
the original.

**Sprites are character grids.** Each is an array of equal-length strings over
the palette in `sprites/palette.ts`, and `sprites/render.ts` is the single choke
point that bakes them. It throws — naming the sprite, row and column — on a
ragged row or an unknown character, so a bad sprite fails loudly instead of
rendering as a smear.

## Faithfulness, and where it departs

The fidelity notes below were settled by disassembling the original binaries
(`SKI.EXE`, 1991-09-12, and v1.04) rather than from memory or folklore, so a few
widely-repeated "facts" are contradicted.

Kept, and verified against the original: **seven** steering headings plus the
tuck (the original has seven; a clone with three feels wrong immediately); NumPad
steering with `Home`/`End`/`PgUp`/`PgDn`; `Ins` to jump; `F2` restart and `F3`
pause; mouse steering toward the cursor and click-to-jump; a `Time`/`Dist`/
`Speed`/`Style` status readout; the fall-line top speed of 25 m/s; base-of-object
collision; trees, rocks, stumps, moguls, ramps and signs; the chairlift with
pylons you can hit and chairs that pass overhead; dogs, snowboarders and a novice
skier; hitting a tree costing you style and a moment in the snow rather than the
run; and **the monster at 2,000 metres** — drawn front-facing with its teeth out,
faster than you can ski, with a multi-second grab-and-devour animation rather
than an instant death.

Two pieces of folklore the disassembly contradicts, so they are absent here too:
the original has no menu, no dialogs and **no sound at all**, and pressing `F`
does not let you escape the monster (in the original `F` is a debug key that
doubles *everything's* speed, monster included, leaving the ratio unchanged).

Departures, all deliberate:

- **Jumping outruns the monster.** In the original the monster is 1.625× your top
  speed and there is no escape in the code at all — it always eats you. Here
  hammering the jump key is made real: airborne descent is multiplied by
  `AIR_GLIDE_BONUS`, putting you just above the monster's speed, and touchdown
  costs some of it back. Hold a `MONSTER_ESCAPE_DISTANCE` lead for
  `MONSTER_ESCAPE_TIME` and it gives up — worth a large style bonus — then a
  faster one is released a few hundred metres later. Because each is
  `MONSTER_SPEED_STEP` quicker, the fourth outruns even perfect hopping, so the
  mountain still wins in the end.
- **A clock as well as a distance for the monster.** 2,000 m at 25 m/s is 80
  seconds of *perfect* tucking, so a real player who turns and crashes can spend
  well over two minutes never meeting the thing the game is famous for. By default
  the monster comes at 2,000 m **or 100 seconds**, whichever first — the 100 s is
  set above the ~97 s a good tucking run actually takes, so a competent player
  still meets it at 2,000 m exactly as in the original and only a dawdler gets
  caught by the clock. Options → Monster restores strict distance-only behaviour,
  or brings it much sooner.
- **A Windows 3.1 frame with menus.** The original had no menu bar and no dialogs
  — it put its two instructions on signposts in the snow. The window chrome here
  is affection, not reconstruction.
- **Sound.** The 1991 build is silent. These are synthesised beeps, and `M` turns
  them off.
- **A gentler speed curve away from the fall line.** The original nearly stops
  your descent at 45°, which makes dodging a tree cost you the race. Top speed
  matches exactly; the diagonals here are more forgiving.
- **No uphill climbing.** The original lets you press `↑` from a full traverse to
  crawl back up the hill at a quarter speed. Since the monster here is escapable
  by jumping, that mechanic had nothing left to do.
- **A shadow under an airborne skier.** The original has no shadows anywhere.
  Ramp jumps here go high enough that without one you cannot judge a landing.
- **A faded silhouette at the top of the screen** while the monster is still
  above the viewport, so the first chase reads as a threat rather than an ambush.
- **Somersaults are all-or-nothing.** Starting one you cannot finish is refused
  rather than handed to you as an unavoidable crash; landing mid-rotation still
  crashes you and halves your style.

## Licence

The original SkiFree is Chris Pirih's. This is an independent reimplementation —
no assets, code or data from the original are used; every sprite in
`src/game/sprites/` was drawn from scratch for this project.
