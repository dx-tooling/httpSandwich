/**
 * Handler for key press events.
 */
export type KeyPressHandler = (key: string) => void;

/**
 * Interface for keyboard input handling.
 * Abstracts raw terminal input for testability.
 */
export interface KeyboardInput {
  /**
   * Register a handler for key press events.
   */
  onKeyPress: (handler: KeyPressHandler) => void;

  /**
   * Start listening for keyboard input.
   * Enables raw mode to capture individual key presses.
   */
  start: () => void;

  /**
   * Stop listening for keyboard input.
   * Restores normal terminal mode.
   */
  stop: () => void;
}
