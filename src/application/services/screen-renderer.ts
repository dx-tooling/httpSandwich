import { type HttpExchange, type DetailLevel, type TerminalUI, type Address } from "@/domain";
import { formatExchange, type FormattedExchange } from "./exchange-formatter.js";
import { type ExchangeHistory } from "./exchange-history.js";
import { type TuiLayout } from "./tui-layout.js";
import { AnsiColors } from "@/infrastructure/color-scheme.js";

/**
 * Selection mode for item navigation.
 */
export type SelectionMode = "none" | "active";

/**
 * Selection state information for footer display.
 */
export interface SelectionState {
  readonly mode: SelectionMode;
  /** Currently selected item index (1-indexed for display), or null if no selection */
  readonly selectedItem: number | null;
  /** Total number of items */
  readonly totalItems: number;
}

/**
 * Configuration for the screen renderer.
 */
export interface ScreenRendererConfig {
  readonly terminal: TerminalUI;
  readonly history: ExchangeHistory;
  readonly layout: TuiLayout;
  readonly fromAddress: Address;
  readonly toAddress: Address;
  readonly storagePath: string;
  readonly initialLevel: DetailLevel;
}

/**
 * Manages screen rendering for the exchange display.
 * Uses TUI layout with fixed header, scrollable viewport, and fixed footer.
 * Supports item selection with highlighting.
 */
export class ScreenRenderer {
  private currentLevel: DetailLevel;
  private readonly terminal: TerminalUI;
  private readonly history: ExchangeHistory;
  private readonly layout: TuiLayout;
  private readonly fromAddress: Address;
  private readonly toAddress: Address;
  private readonly storagePath: string;

  /** Current selection mode */
  private selectionMode: SelectionMode = "none";

  /** Selected item index (0-indexed into exchange history), null = no selection */
  private selectedIndex: number | null = null;

  public constructor(config: ScreenRendererConfig) {
    this.terminal = config.terminal;
    this.history = config.history;
    this.layout = config.layout;
    this.fromAddress = config.fromAddress;
    this.toAddress = config.toAddress;
    this.storagePath = config.storagePath;
    this.currentLevel = config.initialLevel;
  }

  /**
   * Get the current detail level.
   */
  public getLevel(): DetailLevel {
    return this.currentLevel;
  }

  /**
   * Get the current selection state.
   */
  public getSelectionState(): SelectionState {
    const totalItems = this.history.size();

    return {
      mode: this.selectionMode,
      selectedItem: this.selectedIndex !== null ? this.selectedIndex + 1 : null,
      totalItems,
    };
  }

  /**
   * Set the detail level and redraw.
   */
  public setLevel(level: DetailLevel): void {
    if (!this.currentLevel.equals(level)) {
      this.currentLevel = level;
      // Reset selection when level changes (content structure changes)
      this.selectionMode = "none";
      this.selectedIndex = null;
      this.redraw();
    }
  }

  /**
   * Increment the detail level and redraw.
   */
  public incrementLevel(): void {
    this.setLevel(this.currentLevel.increment());
  }

  /**
   * Decrement the detail level and redraw.
   */
  public decrementLevel(): void {
    this.setLevel(this.currentLevel.decrement());
  }

  /**
   * Select up (towards older entries).
   * If not in selection mode, enters it and selects the last (newest) item.
   */
  public selectUp(): void {
    const itemCount = this.history.size();
    if (itemCount === 0) {
      return;
    }

    if (this.selectionMode === "none") {
      // Enter selection mode, start at newest (last) item
      this.selectionMode = "active";
      this.selectedIndex = itemCount - 1;
    } else if (this.selectedIndex !== null && this.selectedIndex > 0) {
      // Move selection to previous (older) item
      this.selectedIndex--;
    }

    this.redraw();
  }

  /**
   * Select down (towards newer entries).
   * If at the last item, exits selection mode.
   */
  public selectDown(): void {
    const itemCount = this.history.size();
    if (itemCount === 0 || this.selectionMode === "none") {
      return;
    }

    if (this.selectedIndex !== null) {
      if (this.selectedIndex < itemCount - 1) {
        // Move selection to next (newer) item
        this.selectedIndex++;
      } else {
        // At last item, exit selection mode
        this.selectionMode = "none";
        this.selectedIndex = null;
      }
    }

    this.redraw();
  }

  /**
   * Reset selection (exit selection mode).
   */
  public resetSelection(): void {
    if (this.selectionMode === "active") {
      this.selectionMode = "none";
      this.selectedIndex = null;
      this.redraw();
    }
  }

  /**
   * Check if currently in selection mode.
   */
  public isSelectionActive(): boolean {
    return this.selectionMode === "active";
  }

  /**
   * Get the currently selected index (0-indexed), or null if none.
   */
  public getSelectedIndex(): number | null {
    return this.selectedIndex;
  }

  /**
   * Perform initial screen setup.
   * Call this once after entering alternate screen.
   */
  public initialize(): void {
    this.terminal.clearScreen();
    this.redraw();
  }

  /**
   * Redraw the entire screen with current exchanges at current level.
   */
  public redraw(): void {
    // Render fixed header
    this.layout.renderHeader(this.fromAddress, this.toAddress, this.currentLevel);

    // Clear and render viewport
    this.layout.clearViewport();
    this.renderViewport();

    // Render fixed footer with selection state
    const selectionState = this.getSelectionState();
    this.layout.renderFooter(
      this.history.size(),
      this.history.capacity(),
      this.storagePath,
      selectionState
    );
  }

  /**
   * Render the exchanges in the viewport.
   */
  private renderViewport(): void {
    const regions = this.layout.getRegions();
    const exchanges = this.history.getAll();

    if (exchanges.length === 0) {
      this.layout.writeViewportLine(
        0,
        `${AnsiColors.dim}  Waiting for requests...${AnsiColors.reset}`
      );
      return;
    }

    // Format all exchanges, marking selected one
    const formatted: { formatted: FormattedExchange; isSelected: boolean }[] = [];
    for (let i = 0; i < exchanges.length; i++) {
      const exchange = exchanges[i];
      if (exchange !== undefined) {
        formatted.push({
          formatted: formatExchange(exchange, this.currentLevel),
          isSelected: this.selectionMode === "active" && this.selectedIndex === i,
        });
      }
    }

    // For level 1, render dots specially
    if (this.currentLevel.value === 1) {
      this.renderDotsInViewport(formatted, regions.viewportHeight, regions.width);
      return;
    }

    // Collect all lines with their selection status
    const allLines: { line: string; isSelected: boolean }[] = [];
    for (const item of formatted) {
      for (const line of item.formatted.lines) {
        allLines.push({ line, isSelected: item.isSelected });
      }
    }

    // Calculate visible window, ensuring selected item is visible if in selection mode
    const visibleLines = this.calculateVisibleLinesWithSelection(
      allLines,
      regions.viewportHeight,
      formatted
    );

    // Render visible lines with selection highlighting
    let viewportRow = 0;
    for (const item of visibleLines) {
      if (viewportRow >= regions.viewportHeight) {
        break;
      }
      const displayLine = item.isSelected
        ? `${AnsiColors.selection}${item.line}${AnsiColors.reset}`
        : item.line;
      this.layout.writeViewportLine(viewportRow, displayLine);
      viewportRow++;
    }
  }

  /**
   * Calculate which lines should be visible, ensuring selected item is in view.
   */
  private calculateVisibleLinesWithSelection(
    allLines: { line: string; isSelected: boolean }[],
    viewportHeight: number,
    formatted: { formatted: FormattedExchange; isSelected: boolean }[]
  ): { line: string; isSelected: boolean }[] {
    // If everything fits, show all
    if (allLines.length <= viewportHeight) {
      return allLines;
    }

    // If no selection, show newest (tail)
    if (this.selectionMode === "none" || this.selectedIndex === null) {
      return allLines.slice(-viewportHeight);
    }

    // Find the line range for the selected item
    let selectedStartLine = 0;
    let selectedEndLine = 0;
    let lineIndex = 0;

    for (let i = 0; i < formatted.length; i++) {
      const item = formatted[i];
      if (item === undefined) continue;

      const itemLineCount = item.formatted.lines.length;

      if (i === this.selectedIndex) {
        selectedStartLine = lineIndex;
        selectedEndLine = lineIndex + itemLineCount - 1;
        break;
      }

      lineIndex += itemLineCount;
    }

    // Calculate viewport window to include selected item
    // Try to center the selection, but prioritize showing it at all
    const selectionMidpoint = Math.floor((selectedStartLine + selectedEndLine) / 2);
    let startIndex = Math.max(0, selectionMidpoint - Math.floor(viewportHeight / 2));
    let endIndex = startIndex + viewportHeight;

    // Adjust if we're past the end
    if (endIndex > allLines.length) {
      endIndex = allLines.length;
      startIndex = Math.max(0, endIndex - viewportHeight);
    }

    // Make sure selected item is fully visible
    if (selectedStartLine < startIndex) {
      startIndex = selectedStartLine;
      endIndex = Math.min(allLines.length, startIndex + viewportHeight);
    } else if (selectedEndLine >= endIndex) {
      endIndex = selectedEndLine + 1;
      startIndex = Math.max(0, endIndex - viewportHeight);
    }

    return allLines.slice(startIndex, endIndex);
  }

  /**
   * Render dots for level 1 in the viewport.
   * Multiple dots per line, wrapping as needed.
   */
  private renderDotsInViewport(
    formatted: { formatted: FormattedExchange; isSelected: boolean }[],
    viewportHeight: number,
    viewportWidth: number
  ): void {
    // For level 1, selection highlights individual dots
    const dotsPerLine = Math.max(1, viewportWidth - 2);

    // Build lines of dots with selection tracking
    const dotLines: { line: string; hasSelection: boolean }[] = [];
    let currentLine = "";
    let visibleCount = 0;
    let lineHasSelection = false;

    for (const item of formatted) {
      const dot = item.formatted.lines[0] ?? "";
      const displayDot = item.isSelected ? `${AnsiColors.selection}${dot}${AnsiColors.reset}` : dot;
      currentLine += displayDot;
      visibleCount++;

      if (item.isSelected) {
        lineHasSelection = true;
      }

      if (visibleCount >= dotsPerLine) {
        dotLines.push({ line: currentLine, hasSelection: lineHasSelection });
        currentLine = "";
        visibleCount = 0;
        lineHasSelection = false;
      }
    }

    // Add remaining dots
    if (currentLine.length > 0) {
      dotLines.push({ line: currentLine, hasSelection: lineHasSelection });
    }

    // Calculate visible window, ensuring selected item's line is visible
    let startIndex = 0;
    if (dotLines.length > viewportHeight) {
      if (this.selectionMode === "active" && this.selectedIndex !== null) {
        // Find which line contains the selected item
        const selectedLineIndex = Math.floor(this.selectedIndex / dotsPerLine);
        // Center the selected line in viewport
        startIndex = Math.max(
          0,
          Math.min(
            dotLines.length - viewportHeight,
            selectedLineIndex - Math.floor(viewportHeight / 2)
          )
        );
      } else {
        // Show newest (last lines)
        startIndex = dotLines.length - viewportHeight;
      }
    }

    const visibleDotLines = dotLines.slice(startIndex, startIndex + viewportHeight);

    // Render
    for (let i = 0; i < visibleDotLines.length; i++) {
      const item = visibleDotLines[i];
      if (item !== undefined) {
        this.layout.writeViewportLine(i, item.line);
      }
    }
  }

  /**
   * Handle a new exchange being added.
   */
  public onNewExchange(_exchange: HttpExchange): void {
    // If in selection mode, keep selection at same index
    // (new items are added at the end, so indices of existing items don't change)
    this.redraw();
  }

  // Legacy method aliases for compatibility
  public scrollUp(): void {
    this.selectUp();
  }

  public scrollDown(): void {
    this.selectDown();
  }

  public resetScroll(): void {
    this.resetSelection();
  }

  public isManualScrollMode(): boolean {
    return this.isSelectionActive();
  }

  public getScrollState(): SelectionState {
    return this.getSelectionState();
  }
}

// Re-export types with legacy names for compatibility
export type ScrollMode = SelectionMode;
export type ScrollState = SelectionState;
