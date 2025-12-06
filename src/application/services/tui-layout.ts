import { type TerminalUI, type TerminalSize, type Address, type DetailLevel } from "@/domain";
import { AnsiColors } from "@/infrastructure/color-scheme.js";

/**
 * Layout regions for the TUI.
 */
export interface LayoutRegions {
  /** Header row (always row 1) */
  readonly headerRow: number;
  /** First row of viewport */
  readonly viewportStartRow: number;
  /** Last row of viewport */
  readonly viewportEndRow: number;
  /** Number of rows available for content */
  readonly viewportHeight: number;
  /** Footer row (always last row) */
  readonly footerRow: number;
  /** Terminal width */
  readonly width: number;
}

/**
 * Manages the TUI layout with fixed header, scrollable viewport, and fixed footer.
 */
export class TuiLayout {
  public constructor(private readonly terminal: TerminalUI) {}

  /**
   * Calculate layout regions based on current terminal size.
   */
  public getRegions(): LayoutRegions {
    const size = this.terminal.getSize();
    return this.calculateRegions(size);
  }

  /**
   * Calculate layout regions for a given terminal size.
   */
  public calculateRegions(size: TerminalSize): LayoutRegions {
    const headerRow = 1;
    const footerRow = size.rows;
    const viewportStartRow = 2;
    const viewportEndRow = size.rows - 1;
    const viewportHeight = Math.max(1, viewportEndRow - viewportStartRow + 1);

    return {
      headerRow,
      viewportStartRow,
      viewportEndRow,
      viewportHeight,
      footerRow,
      width: size.cols,
    };
  }

  /**
   * Render the header with proxy info and current level.
   */
  public renderHeader(from: Address, to: Address, level: DetailLevel): void {
    const regions = this.getRegions();

    this.terminal.moveCursor(regions.headerRow, 1);
    this.terminal.clearLine();

    const header = `${AnsiColors.bold}Malcolm${AnsiColors.reset} ${AnsiColors.dim}←${AnsiColors.reset} ${from.toString()} ${AnsiColors.dim}→${AnsiColors.reset} ${to.toString()}  ${AnsiColors.dim}[${level.toString()}]${AnsiColors.reset}`;
    this.terminal.write(header);
  }

  /**
   * Render the footer with controls and status.
   */
  public renderFooter(exchangeCount: number, historyCapacity: number, storagePath: string): void {
    const regions = this.getRegions();

    this.terminal.moveCursor(regions.footerRow, 1);
    this.terminal.clearLine();

    const controls = `${AnsiColors.dim}+/- level • q quit • ${String(exchangeCount)}/${String(historyCapacity)} requests • ${storagePath}${AnsiColors.reset}`;
    // Truncate if too long
    const maxLen = regions.width - 1;
    const truncated =
      controls.length > maxLen ? controls.substring(0, maxLen - 3) + "..." : controls;
    this.terminal.write(truncated);
  }

  /**
   * Clear the viewport area (between header and footer).
   */
  public clearViewport(): void {
    const regions = this.getRegions();

    for (let row = regions.viewportStartRow; row <= regions.viewportEndRow; row++) {
      this.terminal.moveCursor(row, 1);
      this.terminal.clearLine();
    }

    // Move cursor to start of viewport
    this.terminal.moveCursor(regions.viewportStartRow, 1);
  }

  /**
   * Write a line in the viewport at a specific viewport-relative row.
   * @param viewportRow - Row within viewport (0-indexed)
   * @param text - Text to write
   * @returns true if the line was written, false if outside viewport
   */
  public writeViewportLine(viewportRow: number, text: string): boolean {
    const regions = this.getRegions();
    const absoluteRow = regions.viewportStartRow + viewportRow;

    if (absoluteRow > regions.viewportEndRow) {
      return false;
    }

    this.terminal.moveCursor(absoluteRow, 1);
    this.terminal.clearLine();

    // Truncate text to terminal width to prevent wrapping issues
    const maxLen = regions.width;
    const visibleText = this.truncateToWidth(text, maxLen);
    this.terminal.write(visibleText);

    return true;
  }

  /**
   * Truncate text to fit within a given width.
   * Accounts for ANSI escape codes (they don't take visual space).
   */
  private truncateToWidth(text: string, maxWidth: number): string {
    // Strip ANSI codes to count visible characters
    const stripped = text.replace(/\x1b\[[0-9;]*m/g, "");

    if (stripped.length <= maxWidth) {
      return text;
    }

    // Need to truncate - this is complex with ANSI codes
    // For simplicity, just truncate the stripped version and lose formatting
    // A more sophisticated approach would preserve codes
    return stripped.substring(0, maxWidth - 3) + "...";
  }
}
