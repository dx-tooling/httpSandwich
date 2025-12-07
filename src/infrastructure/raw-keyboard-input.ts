import { type KeyboardInput, type KeyPressHandler } from "@/domain/ports/keyboard-input.js";

/**
 * Special key codes.
 */
const KEYS = {
  CTRL_C: "\x03",
  ESCAPE: "\x1b",
  PLUS: "+",
  EQUALS: "=", // Also treated as plus (same key without shift)
  MINUS: "-",
  UNDERSCORE: "_", // Also treated as minus (same key with shift)
  Q_LOWER: "q",
  Q_UPPER: "Q",
  I_LOWER: "i",
  I_UPPER: "I",
  // Arrow keys send ANSI escape sequences
  ARROW_UP: "\x1b[A",
  ARROW_DOWN: "\x1b[B",
};

/**
 * Normalized key names for handlers.
 */
export const NormalizedKeys = {
  INCREMENT: "increment",
  DECREMENT: "decrement",
  QUIT: "quit",
  SCROLL_UP: "scroll_up",
  SCROLL_DOWN: "scroll_down",
  ESCAPE: "escape",
  INSPECT: "inspect",
} as const;

export type NormalizedKey = (typeof NormalizedKeys)[keyof typeof NormalizedKeys];

/**
 * Keyboard input implementation using raw terminal mode.
 */
export class RawKeyboardInput implements KeyboardInput {
  private handlers: KeyPressHandler[] = [];
  private isRunning = false;
  private dataHandler: ((data: Buffer) => void) | null = null;

  public onKeyPress(handler: KeyPressHandler): void {
    this.handlers.push(handler);
  }

  public start(): void {
    if (this.isRunning) {
      return;
    }

    // Check if stdin is a TTY (terminal)
    if (!process.stdin.isTTY) {
      // Not a terminal, can't capture keys
      return;
    }

    this.isRunning = true;
    process.stdin.setRawMode(true);
    process.stdin.resume();

    this.dataHandler = (data: Buffer) => {
      const key = data.toString();
      const normalizedKey = this.normalizeKey(key);

      if (normalizedKey !== null) {
        for (const handler of this.handlers) {
          handler(normalizedKey);
        }
      }
    };

    process.stdin.on("data", this.dataHandler);
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.dataHandler !== null) {
      process.stdin.off("data", this.dataHandler);
      this.dataHandler = null;
    }

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.pause();
  }

  /**
   * Normalize raw key input to a known key name.
   */
  private normalizeKey(key: string): NormalizedKey | null {
    switch (key) {
      case KEYS.PLUS:
      case KEYS.EQUALS:
        return NormalizedKeys.INCREMENT;

      case KEYS.MINUS:
      case KEYS.UNDERSCORE:
        return NormalizedKeys.DECREMENT;

      case KEYS.Q_LOWER:
      case KEYS.Q_UPPER:
      case KEYS.CTRL_C:
        return NormalizedKeys.QUIT;

      case KEYS.ARROW_UP:
        return NormalizedKeys.SCROLL_UP;

      case KEYS.ARROW_DOWN:
        return NormalizedKeys.SCROLL_DOWN;

      case KEYS.ESCAPE:
        return NormalizedKeys.ESCAPE;

      case KEYS.I_LOWER:
      case KEYS.I_UPPER:
        return NormalizedKeys.INSPECT;

      default:
        return null;
    }
  }
}
