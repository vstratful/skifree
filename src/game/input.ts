/**
 * Keyboard and mouse plumbing.
 *
 * Steering is edge-and-hold rather than a raw key state: holding a turn key
 * steps the skier one pose further round every {@link TURN_INTERVAL} seconds, so
 * turning feels the same regardless of the OS key-repeat rate. The engine polls
 * `takeTurn()` each frame and consumes whatever steps have accrued.
 */

/** Seconds a turn key must be held for each additional pose of rotation. */
const TURN_INTERVAL = 0.11;
/** Pointer movement below this many CSS pixels does not steal control back. */
const POINTER_DEADZONE = 3;

export type MetaCommand =
  | "pause"
  /** Escape: dismiss whatever is open, or pause if nothing is. */
  | "cancel"
  | "restart"
  | "confirm"
  | "toggleSound"
  | "toggleHelp";

export type ControlMode = "keyboard" | "pointer";

export class InputController {
  /** Live pointer position in CSS pixels relative to the canvas, if hovering. */
  pointer: { x: number; y: number } | null = null;
  /** Whichever device the player touched most recently owns steering. */
  mode: ControlMode = "keyboard";

  private readonly held = new Set<string>();
  private turnAccumulator = 0;
  private pendingTurns = 0;
  private jumpQueued = false;
  private directRequest: number | null = null;
  private lastPointer: { x: number; y: number } | null = null;

  private canvas: HTMLElement | null = null;
  private readonly onMeta: (command: MetaCommand) => void;

  constructor(onMeta: (command: MetaCommand) => void) {
    this.onMeta = onMeta;
  }

  attach(canvas: HTMLElement): () => void {
    this.canvas = canvas;
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    canvas.addEventListener("pointerleave", this.handlePointerLeave);
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    return () => {
      window.removeEventListener("keydown", this.handleKeyDown);
      window.removeEventListener("keyup", this.handleKeyUp);
      window.removeEventListener("blur", this.handleBlur);
      canvas.removeEventListener("pointermove", this.handlePointerMove);
      canvas.removeEventListener("pointerleave", this.handlePointerLeave);
      canvas.removeEventListener("pointerdown", this.handlePointerDown);
      this.canvas = null;
      this.held.clear();
    };
  }

  /** True while the player is asking for the fall line and a tuck. */
  get tucking(): boolean {
    if (this.mode !== "keyboard") return false;
    return this.held.has("ArrowDown") || this.held.has("Numpad2");
  }

  /**
   * Number of poses to rotate this frame: negative is left, positive is right.
   * Consumed on read.
   */
  takeTurn(dt: number): number {
    const left =
      this.held.has("ArrowLeft") ||
      this.held.has("Numpad4") ||
      this.held.has("KeyA");
    const right =
      this.held.has("ArrowRight") ||
      this.held.has("Numpad6") ||
      this.held.has("KeyD");

    if (left === right) {
      // Nothing held, or both — reset so the next press turns immediately.
      this.turnAccumulator = TURN_INTERVAL;
    } else {
      this.turnAccumulator += dt;
      while (this.turnAccumulator >= TURN_INTERVAL) {
        this.turnAccumulator -= TURN_INTERVAL;
        this.pendingTurns += left ? -1 : 1;
      }
    }

    const turns = this.pendingTurns;
    this.pendingTurns = 0;
    return turns;
  }

  /** Direction index requested with a number key, consumed on read. */
  takeDirectDirection(): number | null {
    const request = this.directRequest;
    this.directRequest = null;
    return request;
  }

  /** True once per jump press. */
  takeJump(): boolean {
    const queued = this.jumpQueued;
    this.jumpQueued = false;
    return queued;
  }

  /** Forgets held keys and queued edges — used when the game pauses. */
  reset(): void {
    this.held.clear();
    this.pendingTurns = 0;
    this.jumpQueued = false;
    this.directRequest = null;
    this.turnAccumulator = TURN_INTERVAL;
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const meta = META_KEYS[event.code];
    if (meta) {
      event.preventDefault();
      this.onMeta(meta);
      return;
    }

    if (SWALLOWED_KEYS.has(event.code)) event.preventDefault();

    if (JUMP_KEYS.has(event.code)) {
      this.mode = "keyboard";
      // Ignore auto-repeat: one press is one jump or one flip.
      if (!event.repeat) this.jumpQueued = true;
      this.held.add(event.code);
      return;
    }

    const direct = DIRECT_KEYS[event.code];
    if (direct !== undefined) {
      this.mode = "keyboard";
      this.directRequest = direct;
      return;
    }

    if (STEER_KEYS.has(event.code)) {
      this.mode = "keyboard";
      this.held.add(event.code);
    }
  };

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    this.held.delete(event.code);
  };

  private readonly handleBlur = () => {
    this.reset();
  };

  private readonly handlePointerMove = (event: PointerEvent) => {
    const canvas = this.canvas;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const next = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const previous = this.lastPointer;
    this.pointer = next;
    this.lastPointer = next;
    if (
      !previous ||
      Math.abs(previous.x - next.x) + Math.abs(previous.y - next.y) >
        POINTER_DEADZONE
    ) {
      this.mode = "pointer";
    }
  };

  private readonly handlePointerLeave = () => {
    this.pointer = null;
  };

  private readonly handlePointerDown = (event: PointerEvent) => {
    event.preventDefault();
    this.mode = "pointer";
    this.jumpQueued = true;
  };
}

const META_KEYS: Record<string, MetaCommand | undefined> = {
  // F2 restart and F3 pause are the original's bindings; P and R are added
  // because nobody reaches for F3 unprompted any more.
  F3: "pause",
  KeyP: "pause",
  Escape: "cancel",
  KeyR: "restart",
  F2: "restart",
  Enter: "confirm",
  NumpadEnter: "confirm",
  KeyM: "toggleSound",
  KeyH: "toggleHelp",
  F1: "toggleHelp",
};

/**
 * Keys that snap straight to a heading, as an index into `DIRECTIONS`.
 *
 * The NumPad block and its Home/End/PgUp/PgDn twins are the original's bindings:
 * 7 and 9 are the full traverses, 1 and 3 the shallow states, 2 the fall line.
 * (In the original the top-row digits do nothing at all — they are mapped here
 * as a convenience for keyboards without a NumPad.)
 */
const DIRECT_KEYS: Record<string, number | undefined> = {
  Numpad7: 0,
  Home: 0,
  Numpad1: 2,
  End: 2,
  Numpad2: 3,
  Numpad3: 4,
  PageDown: 4,
  Numpad9: 6,
  PageUp: 6,

  Digit1: 0,
  Digit2: 1,
  Digit3: 2,
  Digit4: 3,
  Digit5: 4,
  Digit6: 5,
  Digit7: 6,
};

/** Jump. `Ins`/NumPad0 is the original's binding; F and Space are added. */
const JUMP_KEYS = new Set(["Insert", "Numpad0", "KeyF", "Space"]);

const STEER_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "Numpad4",
  "Numpad6",
  "KeyA",
  "KeyD",
]);

/** Keys whose default browser behaviour would scroll the page mid-run. */
const SWALLOWED_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
  "ArrowUp",
  "Space",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);
