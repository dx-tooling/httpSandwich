import { type TerminalUI, type TerminalSize, type Address, type DetailLevel } from "@/domain";
import { AnsiColors } from "@/infrastructure/color-scheme.js";
import { type SelectionState } from "./screen-renderer.js";

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

    const header = `${AnsiColors.bold}httpSandwich${AnsiColors.reset} ${AnsiColors.dim}←${AnsiColors.reset} ${from.toString()} ${AnsiColors.dim}→${AnsiColors.reset} ${to.toString()}  ${AnsiColors.dim}[${level.toString()}]${AnsiColors.reset}`;
    this.terminal.write(header);
  }

  /**
   * Render the footer with controls, status, and selection info.
   */
  public renderFooter(
    exchangeCount: number,
    historyCapacity: number,
    storagePath: string,
    selectionState?: SelectionState
  ): void {
    const regions = this.getRegions();

    this.terminal.moveCursor(regions.footerRow, 1);
    this.terminal.clearLine();

    // Build selection indicator
    let selectionIndicator = "";
    if (selectionState?.mode === "active" && selectionState.selectedItem !== null) {
      selectionIndicator = `${AnsiColors.bold}[${String(selectionState.selectedItem)}/${String(selectionState.totalItems)}]${AnsiColors.reset} `;
    }

    // Build controls hint based on mode
    const modeHint = selectionState?.mode === "active" ? "ESC exit • ↑↓ select • " : "↑↓ select • ";

    const controls = `${AnsiColors.dim}${selectionIndicator}${modeHint}+/- level • q quit • ${String(exchangeCount)}/${String(historyCapacity)} requests • ${storagePath}${AnsiColors.reset}`;

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
   * Preserves ANSI escape codes (they don't take visual space).
   */
  private truncateToWidth(text: string, maxWidth: number): string {
    // ANSI escape sequence pattern
    const ansiPattern = /\x1b\[[0-9;]*m/g;

    // Strip ANSI codes to count visible characters
    const stripped = text.replace(ansiPattern, "");

    if (stripped.length <= maxWidth) {
      return text;
    }

    // Need to truncate while preserving ANSI codes
    const targetVisibleLength = maxWidth - 3; // Leave room for "..."
    let result = "";
    let visibleCount = 0;
    let i = 0;

    while (i < text.length && visibleCount < targetVisibleLength) {
      const char = text[i];
      const nextChar = text[i + 1];

      // Check if we're at an ANSI escape sequence
      if (char === "\x1b" && nextChar === "[") {
        // Find end of escape sequence
        let j = i + 2;
        while (j < text.length && text[j] !== "m") {
          j++;
        }
        // Include the 'm'
        if (j < text.length) {
          j++;
        }
        // Add the entire escape sequence (doesn't count as visible)
        result += text.substring(i, j);
        i = j;
      } else if (char !== undefined) {
        // Regular visible character
        result += char;
        visibleCount++;
        i++;
      } else {
        break;
      }
    }

    // Add ellipsis and reset code to ensure formatting doesn't bleed
    return result + "..." + AnsiColors.reset;
  }
}
