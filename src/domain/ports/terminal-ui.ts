/**
 * Terminal size in rows and columns.
 */
export interface TerminalSize {
  readonly rows: number;
  readonly cols: number;
}

/**
 * Handler for terminal resize events.
 */
export type ResizeHandler = (size: TerminalSize) => void;

/**
 * Interface for terminal UI operations.
 * Abstracts screen control for testability.
 */
export interface TerminalUI {
  /**
   * Clear the entire screen.
   */
  clearScreen: () => void;

  /**
   * Move cursor to a specific position (1-indexed).
   */
  moveCursor: (row: number, col: number) => void;

  /**
   * Move cursor to home position (top-left).
   */
  moveCursorHome: () => void;

  /**
   * Write text at current cursor position (no newline).
   */
  write: (text: string) => void;

  /**
   * Write text followed by a newline.
   */
  writeLine: (text: string) => void;

  /**
   * Get the current terminal size.
   */
  getSize: () => TerminalSize;

  /**
   * Register a handler for terminal resize events.
   */
  onResize: (handler: ResizeHandler) => void;

  /**
   * Hide the cursor.
   */
  hideCursor: () => void;

  /**
   * Show the cursor.
   */
  showCursor: () => void;
}
