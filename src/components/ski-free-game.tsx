"use client";

import { useEffect, useRef, useState } from "react";
import { SoundBoard } from "@/game/audio";
import {
  DEFAULT_MONSTER_TRIGGER,
  MONSTER_DISTANCE_M,
  type MonsterTriggerId,
} from "@/game/constants";
import { renderGame } from "@/game/draw";
import { Game } from "@/game/engine";
import { InputController } from "@/game/input";
import { isPersonalBest, loadScores, saveScore } from "@/game/score";
import { getSprites } from "@/game/sprites";
import type { RunPhase, RunStats, ScoreRecord } from "@/game/types";
import {
  Button,
  Dialog,
  type Menu,
  MenuBar,
  RAISED,
  StatusBar,
  SUNKEN,
  TitleBar,
} from "./win31";

/** Longest frame the simulation will accept, so a background tab cannot warp. */
const MAX_FRAME_SECONDS = 0.1;

/** The monster-release rules offered in the Options menu. */
const MONSTER_TRIGGER_ITEMS: ReadonlyArray<{
  id: MonsterTriggerId;
  label: string;
}> = [
  { id: "original", label: "Monster: 2,000 m (original)" },
  { id: "standard", label: "Monster: 2,000 m or 100 s" },
  { id: "often", label: "Monster: 500 m or 40 s" },
];

export function SkiFreeGame() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<Game | null>(null);
  const soundRef = useRef<SoundBoard | null>(null);

  const timeRef = useRef<HTMLSpanElement | null>(null);
  const distanceRef = useRef<HTMLSpanElement | null>(null);
  const speedRef = useRef<HTMLSpanElement | null>(null);
  const styleRef = useRef<HTMLSpanElement | null>(null);

  const [phase, setPhase] = useState<RunPhase>("attract");
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [lastRun, setLastRun] = useState<RunStats | null>(null);
  const [lastRecord, setLastRecord] = useState<ScoreRecord | null>(null);
  const [muted, setMuted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [monsterTrigger, setMonsterTrigger] = useState<MonsterTriggerId>(
    DEFAULT_MONSTER_TRIGGER,
  );

  // Mirrors of the overlay state, so the input handler created once on mount can
  // still tell whether Escape should close something or pause the run.
  const helpOpenRef = useRef(false);
  const openMenuRef = useRef<string | null>(null);
  useEffect(() => {
    helpOpenRef.current = helpOpen;
  }, [helpOpen]);
  useEffect(() => {
    openMenuRef.current = openMenu;
  }, [openMenu]);

  useEffect(() => {
    setScores(loadScores());
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
      setFailure("This browser could not give us a 2D canvas to ski on.");
      return;
    }

    let sprites: ReturnType<typeof getSprites>;
    try {
      sprites = getSprites();
    } catch (error) {
      // A malformed sprite is a programming error, not a user-facing one, but
      // failing with the sprite's name beats a blank white rectangle.
      setFailure(error instanceof Error ? error.message : String(error));
      return;
    }

    const sound = new SoundBoard();
    const game = new Game(sound);
    soundRef.current = sound;
    gameRef.current = game;
    game.onPhaseChange = setPhase;

    const input = new InputController((command) => {
      switch (command) {
        case "cancel":
          if (helpOpenRef.current) setHelpOpen(false);
          else if (openMenuRef.current !== null) setOpenMenu(null);
          else game.togglePause();
          break;
        case "pause":
          game.togglePause();
          break;
        case "restart":
          game.reset();
          game.start();
          break;
        case "confirm":
          if (helpOpenRef.current) setHelpOpen(false);
          else game.start();
          break;
        case "toggleSound": {
          const next = !sound.muted;
          sound.setMuted(next);
          setMuted(next);
          break;
        }
        case "toggleHelp":
          setHelpOpen((open) => !open);
          break;
      }
    });
    const detachInput = input.attach(canvas);

    const resize = () => {
      const rect = host.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const dpr = window.devicePixelRatio || 1;
      game.resize(rect.width, rect.height, dpr);
      canvas.width = game.pixelWidth;
      canvas.height = game.pixelHeight;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    // The audio context has to be created from inside a real gesture or it comes
    // up suspended and every cue is silently dropped. Any first click or keypress
    // will do, wherever it lands.
    let alive = true;
    const unlockAudio = () => {
      void sound.unlock().then(() => {
        if (alive) setSoundBlocked(sound.status === "blocked");
      });
    };
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    // A hidden tab still gets animation frames, so without this you can be eaten
    // while looking at something else.
    const handleVisibility = () => {
      if (document.hidden && game.phase === "running") game.togglePause();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min(MAX_FRAME_SECONDS, (now - previous) / 1000);
      previous = now;
      game.update(dt, input);
      renderGame(ctx, game, sprites);
      writeHud(game, { timeRef, distanceRef, speedRef, styleRef });
    };
    frame = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
      document.removeEventListener("visibilitychange", handleVisibility);
      detachInput();
      sound.close();
      gameRef.current = null;
      soundRef.current = null;
    };
  }, []);

  // Runs end in exactly one place, so this is where a score gets written.
  useEffect(() => {
    if (phase !== "over") return;
    const game = gameRef.current;
    if (!game) return;
    const stats = { ...game.stats };
    const record: ScoreRecord = {
      distance: Math.floor(stats.distance),
      style: stats.style,
      time: stats.time,
      at: Date.now(),
    };
    setLastRun(stats);
    setLastRecord(record);
    setScores(saveScore(record));
  }, [phase]);

  const menus: Menu[] = [
    {
      id: "file",
      label: "File",
      access: "F",
      items: [
        {
          kind: "item",
          label: "New Run",
          hint: "F2",
          onSelect: () => {
            gameRef.current?.reset();
            gameRef.current?.start();
          },
        },
        {
          kind: "item",
          label: phase === "paused" ? "Resume" : "Pause",
          hint: "F3",
          disabled: phase !== "running" && phase !== "paused",
          onSelect: () => gameRef.current?.togglePause(),
        },
        { kind: "separator" },
        {
          kind: "item",
          label: "Back to Title",
          disabled: phase === "attract",
          onSelect: () => gameRef.current?.reset(),
        },
      ],
    },
    {
      id: "options",
      label: "Options",
      access: "O",
      items: [
        {
          kind: "item",
          // Browsers block audio until the page has had a gesture. Saying so
          // beats leaving the player to wonder why the game is mute.
          label:
            soundBlocked && !muted ? "Sound (blocked by browser)" : "Sound",
          hint: "M",
          checked: !muted && !soundBlocked,
          onSelect: () => {
            const sound = soundRef.current;
            if (!sound) return;
            const next = !sound.muted;
            sound.setMuted(next);
            setMuted(next);
            void sound.unlock().then(() => {
              setSoundBlocked(sound.status === "blocked");
            });
          },
        },
        { kind: "separator" },
        ...MONSTER_TRIGGER_ITEMS.map((choice) => ({
          kind: "item" as const,
          label: choice.label,
          checked: monsterTrigger === choice.id,
          onSelect: () => {
            gameRef.current?.setMonsterTrigger(choice.id);
            setMonsterTrigger(choice.id);
          },
        })),
      ],
    },
    {
      id: "help",
      label: "Help",
      access: "H",
      items: [
        {
          kind: "item",
          label: "How to Ski",
          hint: "F1",
          onSelect: () => setHelpOpen(true),
        },
      ],
    },
  ];

  return (
    <div className="flex h-dvh items-center justify-center bg-[#008080] p-1 sm:p-4">
      <div
        className={`flex h-full max-h-[940px] w-full max-w-6xl flex-col bg-[#c0c0c0] font-sans ${RAISED}`}
      >
        <TitleBar title="SkiFree" />
        <MenuBar
          menus={menus}
          openId={openMenu}
          onOpen={setOpenMenu}
          onClose={() => setOpenMenu(null)}
        />

        <div className="min-h-0 flex-1 p-0.5">
          <div
            className={`relative h-full w-full overflow-hidden bg-white ${SUNKEN}`}
          >
            <div ref={hostRef} className="absolute inset-0">
              <canvas
                ref={canvasRef}
                className="block h-full w-full touch-none [image-rendering:pixelated]"
                aria-label="SkiFree slope"
              />
            </div>

            <Hud
              timeRef={timeRef}
              distanceRef={distanceRef}
              speedRef={speedRef}
              styleRef={styleRef}
            />

            {failure ? (
              <Overlay>
                <Dialog title="SkiFree">
                  <p className="font-bold">The slope failed to load.</p>
                  <p className="mt-2 font-mono text-xs break-words">
                    {failure}
                  </p>
                </Dialog>
              </Overlay>
            ) : null}

            {!failure && helpOpen ? (
              <Overlay>
                <HelpDialog onClose={() => setHelpOpen(false)} />
              </Overlay>
            ) : null}

            {!failure && !helpOpen && phase === "attract" ? (
              <Overlay>
                <TitleDialog
                  scores={scores}
                  onStart={() => gameRef.current?.start()}
                  onHelp={() => setHelpOpen(true)}
                />
              </Overlay>
            ) : null}

            {!failure && !helpOpen && phase === "paused" ? (
              <Overlay>
                <Dialog
                  title="Paused"
                  footer={
                    <Button
                      autoFocus
                      onClick={() => gameRef.current?.togglePause()}
                    >
                      Resume
                    </Button>
                  }
                >
                  <p>
                    The mountain will wait. It is patient. So is the monster.
                  </p>
                </Dialog>
              </Overlay>
            ) : null}

            {!failure && !helpOpen && phase === "over" ? (
              <Overlay>
                <GameOverDialog
                  stats={lastRun}
                  record={lastRecord}
                  scores={scores}
                  onRestart={() => {
                    gameRef.current?.reset();
                    gameRef.current?.start();
                  }}
                  onTitle={() => gameRef.current?.reset()}
                />
              </Overlay>
            ) : null}
          </div>
        </div>

        <StatusBar>
          <span className="hidden sm:inline">
            Arrows, NumPad or mouse to steer &middot; Down to tuck &middot; Ins
            or F to jump, again to flip &middot; F3 pause &middot; F2 new run
          </span>
          <span className="sm:hidden">
            Arrows steer &middot; F jumps &middot; F2 restarts
          </span>
        </StatusBar>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Heads-up display
// ---------------------------------------------------------------------------

type HudRefs = {
  timeRef: React.RefObject<HTMLSpanElement | null>;
  distanceRef: React.RefObject<HTMLSpanElement | null>;
  speedRef: React.RefObject<HTMLSpanElement | null>;
  styleRef: React.RefObject<HTMLSpanElement | null>;
};

/**
 * Written straight to the DOM from inside the animation frame. Routing four
 * numbers through React state sixty times a second would re-render the whole
 * window for no reason.
 */
function writeHud(game: Game, refs: HudRefs): void {
  const { stats } = game;
  setText(refs.timeRef.current, formatTime(stats.time));
  setText(refs.distanceRef.current, `${Math.floor(stats.distance)} m`);
  setText(refs.speedRef.current, `${stats.speed.toFixed(1)} m/s`);
  setText(refs.styleRef.current, stats.style.toLocaleString("en-GB"));
}

function setText(element: HTMLElement | null, value: string): void {
  if (element && element.textContent !== value) element.textContent = value;
}

function Hud({ timeRef, distanceRef, speedRef, styleRef }: HudRefs) {
  return (
    <div className="pointer-events-none absolute left-2 top-1.5 flex flex-wrap gap-x-4 gap-y-0 text-[13px] font-bold text-black tabular-nums">
      <Readout label="Time" valueRef={timeRef} initial="0:00.0" />
      <Readout label="Distance" valueRef={distanceRef} initial="0 m" />
      <Readout label="Speed" valueRef={speedRef} initial="0.0 m/s" />
      <Readout label="Style" valueRef={styleRef} initial="0" />
    </div>
  );
}

function Readout({
  label,
  valueRef,
  initial,
}: {
  label: string;
  valueRef: React.RefObject<HTMLSpanElement | null>;
  initial: string;
}) {
  return (
    <span>
      {label}:{" "}
      <span ref={valueRef} className="font-mono">
        {initial}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/45 p-3">
      {children}
    </div>
  );
}

function TitleDialog({
  scores,
  onStart,
  onHelp,
}: {
  scores: ScoreRecord[];
  onStart: () => void;
  onHelp: () => void;
}) {
  return (
    <Dialog
      title="SkiFree"
      footer={
        <>
          <Button autoFocus onClick={onStart}>
            Ski
          </Button>
          <Button onClick={onHelp}>How to Ski</Button>
        </>
      }
    >
      <p className="font-bold">Ski down the mountain. Mind the trees.</p>
      <p className="mt-2">
        Arrow keys, the NumPad or the mouse to steer — seven headings, as in the
        original. <Key>Ins</Key> or <Key>F</Key> to jump, again in the air to
        somersault. Hold <Key>Down</Key> for a tuck.
      </p>
      <p className="mt-2">
        Something has been waiting past{" "}
        {MONSTER_DISTANCE_M.toLocaleString("en-GB")} metres. It is faster than
        you are. Jumping is the only thing it is slower than.
      </p>
      <ScoreTable scores={scores} />
    </Dialog>
  );
}

function GameOverDialog({
  stats,
  record,
  scores,
  onRestart,
  onTitle,
}: {
  stats: RunStats | null;
  record: ScoreRecord | null;
  scores: ScoreRecord[];
  onRestart: () => void;
  onTitle: () => void;
}) {
  const best = record !== null && isPersonalBest(record, scores);
  return (
    <Dialog
      title="You have been eaten"
      footer={
        <>
          <Button autoFocus onClick={onRestart}>
            Ski Again
          </Button>
          <Button onClick={onTitle}>Title</Button>
        </>
      }
    >
      <p className="font-bold">The Abominable Snow Monster got you.</p>
      {stats ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs">
          <Stat label="Distance" value={`${Math.floor(stats.distance)} m`} />
          <Stat label="Style" value={stats.style.toLocaleString("en-GB")} />
          <Stat label="Time" value={formatTime(stats.time)} />
          <Stat label="Top speed" value={`${stats.topSpeed.toFixed(1)} m/s`} />
          <Stat label="Crashes" value={String(stats.crashes)} />
          <Stat label="Monsters shaken" value={String(stats.escapes)} />
        </dl>
      ) : null}
      {best ? (
        <p className="mt-3 font-bold text-[#000080]">
          That is a new personal best.
        </p>
      ) : null}
      <ScoreTable scores={scores} />
    </Dialog>
  );
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog
      title="How to Ski"
      footer={
        <Button autoFocus onClick={onClose}>
          OK
        </Button>
      }
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
        <Help keys="← → / 4 6">
          Turn one heading at a time — there are seven. Hold to keep turning.
        </Help>
        <Help keys="↓ / 2">
          Straighten up and tuck. The fastest you can go.
        </Help>
        <Help keys="7 9">
          Snap to a full sideways traverse, which all but stops your descent.
        </Help>
        <Help keys="1 3">
          Snap to a shallow heading, just off the fall line.
        </Help>
        <Help keys="Ins / F">Jump. Press again in the air to somersault.</Help>
        <Help keys="Mouse">Steer toward the cursor. Click to jump.</Help>
        <Help keys="F3 / P">Pause.</Help>
        <Help keys="M">Sound on or off.</Help>
        <Help keys="F2 / R">Start a new run.</Help>
      </dl>
      <p className="mt-2 text-xs opacity-70">
        Those number keys are the NumPad, as in the original. <Key>Home</Key>,{" "}
        <Key>End</Key>, <Key>PgUp</Key> and <Key>PgDn</Key> do the same, and the
        top-row digits <Key>1</Key>–<Key>7</Key> pick any heading outright.
      </p>
      <p className="mt-3">
        Trees, rocks, stumps, signs and lift pylons will put you in the snow.
        Rocks and stumps can be cleared with enough air. Moguls hop you; ramps
        launch you.
      </p>
      <p className="mt-2">
        Style comes from air time and completed somersaults — but land
        mid-rotation and you crash, which halves it. Shaking off a monster is
        worth a great deal.
      </p>
    </Dialog>
  );
}

function Help({ keys, children }: { keys: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="whitespace-nowrap font-mono font-bold">{keys}</dt>
      <dd>{children}</dd>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="opacity-70">{label}</dt>
      <dd className="text-right font-bold tabular-nums">{value}</dd>
    </>
  );
}

function ScoreTable({ scores }: { scores: ScoreRecord[] }) {
  if (scores.length === 0) return null;
  return (
    <div className={`mt-3 bg-white p-2 ${SUNKEN}`}>
      <p className="mb-1 font-bold">Best runs</p>
      <ol className="font-mono text-xs tabular-nums">
        {scores.map((score, index) => (
          <li
            key={`${score.at}-${score.distance}`}
            className="flex justify-between gap-3"
          >
            <span className="opacity-70">{index + 1}.</span>
            <span className="flex-1">{score.distance} m</span>
            <span>{score.style.toLocaleString("en-GB")} style</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return <span className="font-mono font-bold">{children}</span>;
}

function formatTime(seconds: number): string {
  const whole = Math.floor(seconds);
  const minutes = Math.floor(whole / 60);
  const rest = seconds - minutes * 60;
  return `${minutes}:${rest.toFixed(1).padStart(4, "0")}`;
}
