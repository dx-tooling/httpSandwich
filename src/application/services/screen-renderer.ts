import { type HttpExchange, type DetailLevel, type TerminalUI, type Address } from "@/domain";
import { formatExchange, type FormattedExchange } from "./exchange-formatter.js";
import { type ExchangeHistory } from "./exchange-history.js";
import { type TuiLayout } from "./tui-layout.js";
import { AnsiColors } from "@/infrastructure/color-scheme.js";

/**
 * Scroll mode for the viewport.
 */
export type ScrollMode = "auto" | "manual";

/**
 * Scroll state information for footer display.
 */
export interface ScrollState {
  readonly mode: ScrollMode;
  /** First visible line (1-indexed) */
  readonly firstLine: number;
  /** Last visible line (1-indexed) */
  readonly lastLine: number;
  /** Total lines available */
  readonly totalLines: number;
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
 * Supports both auto-scroll (tail) and manual scroll modes.
 */
export class ScreenRenderer {
  private currentLevel: DetailLevel;
  private readonly terminal: TerminalUI;
  private readonly history: ExchangeHistory;
  private readonly layout: TuiLayout;
  private readonly fromAddress: Address;
  private readonly toAddress: Address;
  private readonly storagePath: string;

  /** Current scroll mode */
  private scrollMode: ScrollMode = "auto";

  /** Scroll offset from the bottom (0 = showing newest, positive = scrolled up) */
  private scrollOffset = 0;

  /** Cached total lines for scroll calculations */
  private cachedTotalLines = 0;

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
   * Get the current scroll state.
   */
  public getScrollState(): ScrollState {
    const regions = this.layout.getRegions();
    const viewportHeight = regions.viewportHeight;

    if (this.cachedTotalLines === 0) {
      return {
        mode: this.scrollMode,
        firstLine: 0,
        lastLine: 0,
        totalLines: 0,
      };
    }

    const lastLine = Math.max(1, this.cachedTotalLines - this.scrollOffset);
    const firstLine = Math.max(1, lastLine - viewportHeight + 1);

    return {
      mode: this.scrollMode,
      firstLine,
      lastLine,
      totalLines: this.cachedTotalLines,
    };
  }

  /**
   * Set the detail level and redraw.
   */
  public setLevel(level: DetailLevel): void {
    if (!this.currentLevel.equals(level)) {
      this.currentLevel = level;
      // Reset scroll when level changes (content structure changes)
      this.scrollMode = "auto";
      this.scrollOffset = 0;
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
   * Scroll up (towards older entries).
   */
  public scrollUp(): void {
    this.scrollMode = "manual";
    const regions = this.layout.getRegions();
    const maxOffset = Math.max(0, this.cachedTotalLines - regions.viewportHeight);

    // Scroll by one line, clamped to max
    this.scrollOffset = Math.min(this.scrollOffset + 1, maxOffset);
    this.redraw();
  }

  /**
   * Scroll down (towards newer entries).
   */
  public scrollDown(): void {
    if (this.scrollMode === "auto") {
      // Already at bottom, nothing to do
      return;
    }

    this.scrollOffset = Math.max(0, this.scrollOffset - 1);

    // If we've scrolled back to bottom, switch to auto mode
    if (this.scrollOffset === 0) {
      this.scrollMode = "auto";
    }

    this.redraw();
  }

  /**
   * Reset scroll to auto mode (tail).
   */
  public resetScroll(): void {
    if (this.scrollMode === "manual") {
      this.scrollMode = "auto";
      this.scrollOffset = 0;
      this.redraw();
    }
  }

  /**
   * Check if currently in manual scroll mode.
   */
  public isManualScrollMode(): boolean {
    return this.scrollMode === "manual";
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

    // Clear and render viewport (updates cachedTotalLines)
    this.layout.clearViewport();
    this.renderViewport();

    // Render fixed footer with scroll state
    const scrollState = this.getScrollState();
    this.layout.renderFooter(
      this.history.size(),
      this.history.capacity(),
      this.storagePath,
      scrollState
    );
  }

  /**
   * Render the exchanges in the viewport.
   */
  private renderViewport(): void {
    const regions = this.layout.getRegions();
    const exchanges = this.history.getAll();

    if (exchanges.length === 0) {
      this.cachedTotalLines = 0;
      this.layout.writeViewportLine(
        0,
        `${AnsiColors.dim}  Waiting for requests...${AnsiColors.reset}`
      );
      return;
    }

    // Format all exchanges
    const formatted = exchanges.map((e) => formatExchange(e, this.currentLevel));

    // For level 1, render dots specially
    if (this.currentLevel.value === 1) {
      this.renderDotsInViewport(formatted, regions.viewportHeight, regions.width);
      return;
    }

    // Collect all lines
    const allLines: string[] = [];
    for (const f of formatted) {
      for (const line of f.lines) {
        allLines.push(line);
      }
    }

    // Update cached total
    this.cachedTotalLines = allLines.length;

    // Calculate visible window based on scroll mode and offset
    const visibleLines = this.calculateVisibleLines(allLines, regions.viewportHeight);

    // Render visible lines
    let viewportRow = 0;
    for (const line of visibleLines) {
      if (viewportRow >= regions.viewportHeight) {
        break;
      }
      this.layout.writeViewportLine(viewportRow, line);
      viewportRow++;
    }
  }

  /**
   * Calculate which lines should be visible based on scroll state.
   */
  private calculateVisibleLines(allLines: string[], viewportHeight: number): string[] {
    // If everything fits, show all
    if (allLines.length <= viewportHeight) {
      return allLines;
    }

    // Calculate window based on scroll offset
    const endIndex = allLines.length - this.scrollOffset;
    const startIndex = Math.max(0, endIndex - viewportHeight);

    return allLines.slice(startIndex, endIndex);
  }

  /**
   * Render dots for level 1 in the viewport.
   * Multiple dots per line, wrapping as needed.
   */
  private renderDotsInViewport(
    formatted: FormattedExchange[],
    viewportHeight: number,
    viewportWidth: number
  ): void {
    // Collect all dots
    const dots = formatted.map((f) => f.lines[0] ?? "");

    // Calculate dots per line (leaving margin)
    const dotsPerLine = Math.max(1, viewportWidth - 2);

    // Build lines of dots
    const dotLines: string[] = [];
    let currentLine = "";
    let visibleCount = 0;

    for (const dot of dots) {
      currentLine += dot;
      visibleCount++;

      if (visibleCount >= dotsPerLine) {
        dotLines.push(currentLine);
        currentLine = "";
        visibleCount = 0;
      }
    }

    // Add remaining dots
    if (currentLine.length > 0) {
      dotLines.push(currentLine);
    }

    // Update cached total
    this.cachedTotalLines = dotLines.length;

    // Calculate visible window based on scroll state
    const visibleDotLines = this.calculateVisibleLines(dotLines, viewportHeight);

    // Render
    for (let i = 0; i < visibleDotLines.length; i++) {
      const line = visibleDotLines[i];
      if (line !== undefined) {
        this.layout.writeViewportLine(i, line);
      }
    }
  }

  /**
   * Handle a new exchange being added.
   */
  public onNewExchange(_exchange: HttpExchange): void {
    // In manual scroll mode, don't auto-scroll but still redraw
    // to update the total count and allow user to scroll to new content
    this.redraw();
  }
}
