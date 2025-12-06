/**
 * Interface for writing output.
 * Abstracts the output destination for testability.
 */
export interface OutputWriter {
  /**
   * Write text to the output.
   * Does not append a newline.
   */
  write: (text: string) => void;
}
