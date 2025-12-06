import {
  type TerminalUI,
  type TerminalSize,
  type ResizeHandler,
} from "@/domain/ports/terminal-ui.js";

/**
 * ANSI escape codes for terminal control.
 */
const ANSI = {
  /** Clear entire screen */
  CLEAR_SCREEN: "\x1b[2J",
  /** Move cursor to home position (1,1) */
  CURSOR_HOME: "\x1b[H",
  /** Hide cursor */
  HIDE_CURSOR: "\x1b[?25l",
  /** Show cursor */
  SHOW_CURSOR: "\x1b[?25h",
  /** Move cursor to position (row, col) - use with template */
  cursorTo: (row: number, col: number): string => `\x1b[${String(row)};${String(col)}H`,
};

/**
 * Terminal UI implementation using ANSI escape codes.
 */
export class AnsiTerminalUI implements TerminalUI {
  private resizeHandlers: ResizeHandler[] = [];

  public constructor() {
    // Listen for terminal resize events
    process.stdout.on("resize", () => {
      const size = this.getSize();
      for (const handler of this.resizeHandlers) {
        handler(size);
      }
    });
  }

  public clearScreen(): void {
    process.stdout.write(ANSI.CLEAR_SCREEN);
    this.moveCursorHome();
  }

  public moveCursor(row: number, col: number): void {
    process.stdout.write(ANSI.cursorTo(row, col));
  }

  public moveCursorHome(): void {
    process.stdout.write(ANSI.CURSOR_HOME);
  }

  public write(text: string): void {
    process.stdout.write(text);
  }

  public writeLine(text: string): void {
    process.stdout.write(text + "\n");
  }

  public getSize(): TerminalSize {
    // rows/columns can be undefined if not a TTY
    const rows = process.stdout.rows;
    const cols = process.stdout.columns;
    return {
      rows: typeof rows === "number" ? rows : 24,
      cols: typeof cols === "number" ? cols : 80,
    };
  }

  public onResize(handler: ResizeHandler): void {
    this.resizeHandlers.push(handler);
  }

  public hideCursor(): void {
    process.stdout.write(ANSI.HIDE_CURSOR);
  }

  public showCursor(): void {
    process.stdout.write(ANSI.SHOW_CURSOR);
  }
}
