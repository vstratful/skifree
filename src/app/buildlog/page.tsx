import type { Metadata } from "next";
import { MONSTER_SPRITES } from "@/game/sprites/monster";
import { PALETTE, type PaletteKey } from "@/game/sprites/palette";
import { SKIER_SPRITES } from "@/game/sprites/skier";
import { TERRAIN_SPRITES } from "@/game/sprites/terrain";
import "./buildlog.css";

export const metadata: Metadata = {
  title: "Rebuilding SkiFree",
  description:
    "How the SkiFree clone came to exist: one sentence of brief, twelve agents, a disassembled 1991 binary, and a PNG encoder written to check the art.",
};

/**
 * The mogul as it was first drawn. Kept here only because the page compares it
 * against the version that shipped — it is deliberately not in the sprite sheet.
 */
const MOGUL_BEFORE = [
  "....................",
  "....ZZZZZZZZZZZZ....",
  "..ZZZSSSSSSSSSSZZZ..",
  ".ZSSWWWWWWWWWWWWSSZ.",
  ".SSWWWWWWWWWWWWWWSS.",
  "..SWWWWWWWWWWWWWWS..",
  "..SSWWWWWWWWWWWWSS..",
  "....SSSSSSSSSSSS....",
];

/**
 * Renders a sprite's character grid as coloured cells, straight from the game's
 * own data. Nothing here is a screenshot, and the page cannot drift out of sync
 * with the art.
 */
function Pixels({ rows, scale }: { rows: readonly string[]; scale: number }) {
  const width = rows[0].length;
  return (
    <div
      className="pixels"
      style={{
        gridTemplateColumns: `repeat(${width}, ${scale}px)`,
        width: width * scale,
      }}
    >
      {rows.map((row, y) =>
        Array.from(row, (character, x) => (
          <i
            // biome-ignore lint/suspicious/noArrayIndexKey: a pixel grid is fixed static data — these cells never reorder, and the coordinate *is* the identity
            key={`${y}:${x}`}
            style={{
              height: scale,
              background: PALETTE[character as PaletteKey] ?? "transparent",
            }}
          />
        )),
      )}
    </div>
  );
}

function Tile({
  rows,
  scale,
  label,
}: {
  rows: readonly string[];
  scale: number;
  label: string;
}) {
  return (
    <div className="tile">
      <Pixels rows={rows} scale={scale} />
      <span className="name">{label}</span>
    </div>
  );
}

function Bar({
  label,
  value,
  width,
  tone,
}: {
  label: string;
  value: string;
  width: string;
  tone?: "threat" | "win";
}) {
  return (
    <>
      <span className="lbl">{label}</span>
      <span className="track">
        <span className={`fill${tone ? ` ${tone}` : ""}`} style={{ width }} />
      </span>
      <span className="val">{value}</span>
    </>
  );
}

export default function BuildLog() {
  return (
    <div className="buildlog">
      <div className="desk" />

      <div className="wrap">
        <header className="hero">
          <span className="eyebrow">Build log</span>
          <h1>Rebuilding SkiFree</h1>
          <p className="standfirst">
            One sentence of brief, twelve agents, a disassembled 1991 binary,
            and a PNG encoder written from scratch because the rules said no dev
            server. Here is how the thing came to exist.
          </p>
          <div className="playbar">
            <span className="k">Play it</span>
            <a href="/">the slope</a>
            <span className="k">source</span>
            <a href="https://github.com/vstratful/skifree">
              github.com/vstratful/skifree
            </a>
          </div>

          <div className="sunken">
            <div className="gallery">
              <Tile rows={SKIER_SPRITES.down.rows} scale={5} label="skier" />
              <Tile
                rows={TERRAIN_SPRITES.treeTall.rows}
                scale={5}
                label="treeTall"
              />
              <Tile rows={TERRAIN_SPRITES.ramp.rows} scale={5} label="ramp" />
              <Tile rows={TERRAIN_SPRITES.mogul.rows} scale={5} label="mogul" />
            </div>
          </div>
          <p className="caption">
            Every sprite on this page is rendered from the game&rsquo;s actual
            source data — the same arrays of characters the game itself reads.
            None of it is a screenshot, and it cannot fall out of date.
          </p>
        </header>

        <section>
          <div className="titlebar">
            <span className="box">
              <i />
            </span>{" "}
            The entire brief
          </div>
          <p>This was the whole of it:</p>
          <div className="prompt">
            <span className="who">Vince</span>
            <q>make me a `skifree` clone</q>
          </div>
          <p>
            Two things were genuinely ambiguous, so rather than guess, Claude
            asked — how much of the original to build, and which platforms to
            target. Two multiple-choice answers came back:
          </p>
          <div className="sunken panel">
            <div className="picks">
              <div>
                <span>Scope</span>
                <span>Free Ski + Yeti</span>
              </div>
              <div>
                <span>Controls</span>
                <span>Keyboard + mouse</span>
              </div>
            </div>
          </div>
          <p>
            <strong>
              That is the complete set of human input for the first 5,290 lines.
            </strong>{" "}
            Every other decision — the architecture, the physics, the art
            pipeline, how any of it would be tested — was Claude&rsquo;s, which
            is the interesting part and also where the mistakes are.
          </p>
        </section>

        <section>
          <div className="titlebar">
            <span className="box">
              <i />
            </span>{" "}
            The shape of it
          </div>
          <p>
            Two rules kept it from turning into mud. First: everything under{" "}
            <code>src/game/</code> is plain TypeScript with no React in it at
            all. The React layer owns the window, the dialogs and the animation
            frame, and nothing else — it hands the engine a delta and an input
            controller, then blits whatever comes back.
          </p>
          <p>
            Second: <strong>the art is source code.</strong> Every sprite is an
            array of equal-length strings, one character per pixel, over a fixed
            24-entry palette. A tree is literally this:
          </p>
          <div className="sunken panel">
            <pre>{`treeShort: {
  rows: [
    "................",
    ".......KK.......",
    "......KLGK......",
    ".....KLLGGK.....",
    "....KLLGGGGK....",     K  black
    "....KEEEEEEK....",     L  light green
    "....KKEEEEKK....",     G  green
    "......KLGK......",     E  dark green
    ...                     T  brown`}</pre>
            <p className="caption">
              No image files anywhere in the repository. It diffs, it greps, and
              a reviewer can see a change to a tree in a pull request.
            </p>
          </div>
          <p>
            One function turns those grids into bitmaps, and it is deliberately
            the only one. It throws on a ragged row or an unknown character,
            naming the sprite, the row and the column — so a bad sprite fails
            loudly at load instead of rendering as a smear nobody notices for
            three weeks.
          </p>
        </section>

        <section>
          <div className="titlebar">
            <span className="box">
              <i />
            </span>{" "}
            The agent that went and got the binary
          </div>
          <p>
            Drawing forty-two sprites is embarrassingly parallel work, so it was
            farmed out to twelve agents: five drawing, five reviewing each
            other&rsquo;s silhouettes, one doing a cross-cutting coherence pass,
            and one researching the original game.
          </p>
          <p>
            The researcher was told one thing about sources: prefer primary
            ones. Nobody told it what that meant.
          </p>
          <div className="shout">
            <p>
              It decided the strongest primary source available was the game
              itself — went and fetched <code>SKI.EXE</code> (dated 12 September
              1991) and the later 32-bit build from Chris Pirih&rsquo;s own
              site, <strong>disassembled both</strong>, read the movement tables
              and jump tables out of the machine code, extracted the bitmap
              resources, cross-checked against a Microsoft knowledge-base
              article, and then tagged every single claim in its report as
              either <code>[documented]</code> or <code>[folklore]</code>.
            </p>
          </div>
          <p>
            That reframed the whole build, because a lot of what everyone
            &ldquo;knows&rdquo; about SkiFree turns out to be wrong. It even
            found the exact comparison instruction behind the most famous number
            in the game.
          </p>
          <div className="scroller sunken panel">
            <table>
              <thead>
                <tr>
                  <th>Received wisdom</th>
                  <th>What the machine code says</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Yeti at 2,000 m</td>
                  <td>
                    True — <code>cmp ax,0x7d00</code>, at 16 units per metre
                  </td>
                </tr>
                <tr>
                  <td>Press F to escape it</td>
                  <td>
                    Folklore. F is a debug key that doubles <em>everything</em>,
                    monster included, so the ratio never changes
                  </td>
                </tr>
                <tr>
                  <td>Number keys steer</td>
                  <td>The NumPad does. Top-row digits do nothing at all</td>
                </tr>
                <tr>
                  <td>Three or five directions</td>
                  <td>Seven distinct headings</td>
                </tr>
                <tr>
                  <td>It had sound</td>
                  <td>Silent. Links no audio library whatsoever</td>
                </tr>
                <tr>
                  <td>Three game modes</td>
                  <td>One mountain, three courses side by side as lanes</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Five headings had already been built. The finding was blunt: clones
            with fewer than seven &ldquo;feel wrong immediately&rdquo;. So the
            two missing shallow headings went in — the fine-correction ones,
            only about five degrees off the fall line — and the game measurably
            improved, which is documented further down.
          </p>
        </section>

        <section>
          <div className="titlebar">
            <span className="box">
              <i />
            </span>{" "}
            Verifying a game you cannot play
          </div>
          <p>
            House rule in this repository: don&rsquo;t start dev servers. Which
            is awkward when the deliverable is a video game. So it got tested
            without a browser ever rendering it, two ways.
          </p>
          <p>
            <strong>The engine, headlessly.</strong> Nothing in{" "}
            <code>src/game/</code> touches the DOM except the renderer, so the
            whole thing compiles to CommonJS and runs in Node. Feed it a stub
            input controller and you can play thousands of runs: a blind player
            who only tucks, a hopper, and a greedy tree-dodger standing in for
            someone competent.
          </p>
          <p>
            <strong>The art, as actual pixels.</strong> To <em>look</em> at the
            sprites, Claude wrote a small PNG encoder — CRC table, zlib,
            IHDR/IDAT/IEND — and pointed it at the real world-generation code.
            That produces a picture of a genuine slice of generated mountain,
            which can then be opened and judged. It is how three sprites were
            caught reading as completely the wrong object.
          </p>
          <div className="compare">
            <figure>
              <Pixels rows={MOGUL_BEFORE} scale={7} />
              <figcaption>
                <b className="verdict-bad">Reads as a hole</b>
                shading ring wrapped around white
              </figcaption>
            </figure>
            <figure>
              <Pixels rows={TERRAIN_SPRITES.mogul.rows} scale={7} />
              <figcaption>
                <b className="verdict-good">Reads as a bump</b>
                shadow only on the lower right
              </figcaption>
            </figure>
          </div>
          <p>
            That is a mogul, before and after. Same size, same three colours.
            The first has its shading wrapped symmetrically around a white
            middle — so on white snow the middle vanishes and all that is left
            is a rim, which reads as a puddle. The fix is to accept that the lit
            face of a snow bump is white-on-white and therefore invisible, and
            let the sprite <em>be</em> its own shadow, thrown asymmetrically to
            one side. The ramp had the same problem in a different key: it was a
            symmetrical dome, so it read as an igloo.
          </p>
        </section>

        <section>
          <div className="titlebar">
            <span className="box">
              <i />
            </span>{" "}
            What that caught
          </div>
          <p>
            Six real defects, none of which a type checker or a linter would
            ever have found. Everything passed <code>tsc</code> and{" "}
            <code>biome</code> cleanly the entire time.
          </p>
          <ul className="notes broke">
            <li>
              <div>
                <h3>Every run began under the chairlift</h3>
                Lift lines were placed at multiples of their spacing — and the
                player starts at x = 0, which is a multiple of everything. So
                every single run started inside the lift corridor with a pylon
                300 units dead ahead.
              </div>
            </li>
            <li>
              <div>
                <h3>The Yeti was mathematically unbeatable</h3>
                Jumping is meant to be the one thing faster than the monster.
                But the landing speed penalty was being applied{" "}
                <em>while airborne</em>, which capped the glide just below the
                monster&rsquo;s speed — so the escape could not be performed by
                anyone, ever. A penalty for absorbing an impact should only
                apply while there is snow under your knees.
              </div>
            </li>
            <li>
              <div>
                <h3>The Yeti&rsquo;s backstop never armed on a first run</h3>
                Found while writing the test for the feature, which is the ideal
                time. A field initialiser set the timer to infinity and only{" "}
                <code>reset()</code> ever fixed it — but a fresh session goes
                straight from the constructor to <code>start()</code>. Broken on
                precisely the path every player takes first.
              </div>
            </li>
            <li>
              <div>
                <h3>Three sprites read as the wrong object entirely</h3>A mogul
                as a hole, a ramp as an igloo, a chairlift chair as a pedestal.
                Invisible to every automated check; obvious the moment you look
                at a picture.
              </div>
            </li>
            <li>
              <div>
                <h3>A missing sprite could not have been caught</h3>
                Three sheets were typed{" "}
                <code>Record&lt;string, SpriteDef&gt;</code>, which erases the
                key union — the renderer could ask for a sprite that did not
                exist and the compiler would shrug. Switching to{" "}
                <code>satisfies</code> makes the key set real, so the type
                system now guards the whole art contract.
              </div>
            </li>
            <li>
              <div>
                <h3>Silence, with no error anywhere</h3>
                Browsers start an audio context suspended until you interact
                with the page — and a suspended context&rsquo;s clock is frozen
                at zero. So every sound was scheduled against time zero, the
                context resumed asynchronously, the clock jumped past all of it,
                and every cue was discarded. No exception, no warning, no sound.
                Found by driving the real audio code against a fake Web Audio
                API that recorded what it was told to do.
              </div>
            </li>
          </ul>
        </section>

        <section>
          <div className="titlebar">
            <span className="box">
              <i />
            </span>{" "}
            The chase, in three numbers
          </div>
          <p>
            In the original the Yeti is 1.625× your top speed and the code
            contains no escape at all — it simply eats you. Making the folk
            remedy real meant building a sandwich: skiing loses, jumping wins,
            and the margin is thin enough to be a skill.
          </p>
          <div className="sunken panel">
            <div className="ladder">
              <Bar label="Tuck, on snow" value="264" width="81%" />
              <Bar label="The monster" value="300" width="92%" tone="threat" />
              <Bar label="Tuck, airborne" value="312" width="96%" tone="win" />
            </div>
            <p className="caption">
              World units per second, measured in the harness — not the
              theoretical figures, the ones a simulated player actually
              sustains. Each monster after the first is 4% quicker, so the
              fourth outruns even perfect hopping and the mountain wins in the
              end anyway.
            </p>
          </div>
          <p>
            Adding the two missing headings was meant to be a fidelity fix. It
            turned out to be a balance fix too, and the harness could prove it —
            the simulated competent player stopped dying at the first monster.
          </p>
          <div className="scroller sunken panel">
            <table>
              <thead>
                <tr>
                  <th>Simulated competent player</th>
                  <th className="num">5 headings</th>
                  <th className="num">7 headings</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Seeds surviving the first monster</td>
                  <td className="num">3 of 5</td>
                  <td className="num">5 of 5</td>
                </tr>
                <tr>
                  <td>Distance reached</td>
                  <td className="num">2,024–4,497 m</td>
                  <td className="num">4,506–4,515 m</td>
                </tr>
                <tr>
                  <td>Crashes per run</td>
                  <td className="num">12–24</td>
                  <td className="num">9–15</td>
                </tr>
                <tr>
                  <td>Monsters shaken off</td>
                  <td className="num">9</td>
                  <td className="num">15</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <div className="titlebar">
            <span className="box">
              <i />
            </span>{" "}
            Faithful where it counts
          </div>
          <p>
            Because the disassembly settled the arguments, the departures are
            choices rather than accidents. Kept: seven headings and the tuck,
            NumPad steering, <code>Ins</code> to jump, <code>F2</code>/
            <code>F3</code>, mouse steering toward the cursor, collision at the{" "}
            <em>base</em> of an object rather than its silhouette — which is
            what lets you thread a gap between two overlapping trees — the 25
            m/s fall line, and a front-facing monster with its teeth out at
            2,000 m.
          </p>
          <ul className="notes held">
            <li>
              <div>
                <h3>The monster can be escaped</h3>
                Hammering the jump key genuinely works now. The original never
                let you go.
              </div>
            </li>
            <li>
              <div>
                <h3>There is sound</h3>
                The 1991 build is completely silent. These are synthesised
                oscillator blips rather than samples, which gets closer to the
                era than any recording would. <code>M</code> turns them off.
              </div>
            </li>
            <li>
              <div>
                <h3>A clock as well as a distance</h3>
                2,000 m is eighty seconds of <em>perfect</em> tucking, so a real
                player can spend two minutes never meeting the thing the game is
                famous for. Not hypothetical — exactly what happened on first
                play. It now arrives at 2,000 m <em>or</em> 100 seconds, and 100
                sits above the ~97 s a good run takes, so a competent player
                still meets it at 2,000 m and only a dawdler gets caught by the
                clock. The Options menu restores strict distance-only.
              </div>
            </li>
            <li>
              <div>
                <h3>A Windows 3.1 window around it</h3>
                Pure affection. The original had no menus and no dialogs — it
                put its two instructions on signposts in the snow.
              </div>
            </li>
          </ul>
        </section>

        <section>
          <div className="titlebar">
            <span className="box">
              <i />
            </span>{" "}
            The one round of feedback
          </div>
          <p>
            After all of the above had been built and pushed, this came back —
            the second and last piece of direction in the whole project:
          </p>
          <div className="prompt">
            <span className="who">Vince</span>
            <q>
              i&rsquo;m running the dev server and it seems to be working pretty
              well, but the sound isn&rsquo;t working - can we also increase the
              odds of the yeti appearing? i didn&rsquo;t see it appear inside 2
              minutes of playing -- also note our coherence agent is still
              running, so we&rsquo;re not done yet, eh?
            </q>
          </div>
          <p>
            Three things in one message, and they were three different kinds:
          </p>
          <ul className="notes">
            <li>
              <div>
                <h3>A real bug that shipped</h3>
                The silent audio. Genuinely broken, and the sort of thing only
                playing it would surface.
              </div>
            </li>
            <li>
              <div>
                <h3>A playability call</h3>
                The Yeti taking too long. The number was <em>correct</em> —
                2,000 m is exact — but correct and fun are not the same thing,
                which is a judgement a player makes and a simulation does not.
              </div>
            </li>
            <li>
              <div>
                <h3>Catching Claude out</h3>
                The coherence agent really was still running. Claude had
                announced the art was finished by counting completed agents
                against a threshold of ten — when there were twelve. The watcher
                fired early, the &ldquo;done&rdquo; was wrong, and the agent
                carried on rewriting sprite files underneath for another half
                hour. Vince noticed before Claude did. The lesson is dull and
                correct: don&rsquo;t hand-roll a completion signal when the
                runtime already has one.
              </div>
            </li>
          </ul>
          <p>
            One more thing is still open and worth stating plainly:{" "}
            <strong>nobody has verified the sound with their ears.</strong> The
            fix is proven against a mock, which shows the scheduling is right
            and the unlock path works — but a mock cannot prove a speaker makes
            a noise.
          </p>
        </section>

        <section>
          <div className="titlebar">
            <span className="box">
              <i />
            </span>{" "}
            Where it stands
          </div>
          <div className="stats">
            <div>
              <span className="n">5,290</span>
              <span className="k">lines</span>
            </div>
            <div>
              <span className="n">42</span>
              <span className="k">sprites</span>
            </div>
            <div>
              <span className="n">0</span>
              <span className="k">image files</span>
            </div>
            <div>
              <span className="n">28</span>
              <span className="k">checks passing</span>
            </div>
          </div>
          <p>
            Twenty-four gameplay checks and four audio ones, all green,
            alongside <code>tsc</code>, <code>biome</code> and a production
            build. The ones worth caring about are about determinism: the same
            seed and inputs land the skier in the identical spot, and 30, 60 and
            144 fps agree on distance to within a tenth of a metre over nearly a
            kilometre. Physics runs on a fixed 120 Hz step so nobody tunnels
            through a tree trunk on a dropped frame.
          </p>
          <p>
            The mountain is generated in chunks from a hash of the seed and the
            chunk coordinates — never from a rolling stream — which is the only
            reason the cache can be thrown away aggressively without the slope
            rearranging itself behind you. If you change one thing in there,
            change that last.
          </p>
          <div className="sunken">
            <div className="gallery">
              <Tile
                rows={MONSTER_SPRITES.run1.rows}
                scale={6}
                label="monster.run1"
              />
              <Tile
                rows={MONSTER_SPRITES.gloat.rows}
                scale={6}
                label="monster.gloat"
              />
            </div>
          </div>
          <p className="caption">
            The Abominable Snow Monster is drawn facing the camera, teeth out,
            even while chasing you from behind. The original does the same. A
            clone that draws it from behind reads as wrong instantly.
          </p>
        </section>

        <footer>
          Built with Claude Code. All forty-two sprites drawn from scratch for
          this project — no code, art or data from the original is used. SkiFree
          is Chris Pirih&rsquo;s.
        </footer>
      </div>

      <div className="desk" />
    </div>
  );
}
