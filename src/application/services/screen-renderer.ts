import { type HttpExchange, type DetailLevel, type TerminalUI, type Address } from "@/domain";
import { formatExchange, type FormattedExchange } from "./exchange-formatter.js";
import { type ExchangeHistory } from "./exchange-history.js";
import { type TuiLayout } from "./tui-layout.js";
import { AnsiColors } from "@/infrastructure/color-scheme.js";

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
 */
export class ScreenRenderer {
  private currentLevel: DetailLevel;
  private readonly terminal: TerminalUI;
  private readonly history: ExchangeHistory;
  private readonly layout: TuiLayout;
  private readonly fromAddress: Address;
  private readonly toAddress: Address;
  private readonly storagePath: string;

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
   * Set the detail level and redraw.
   */
  public setLevel(level: DetailLevel): void {
    if (!this.currentLevel.equals(level)) {
      this.currentLevel = level;
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

    // Render fixed footer
    this.layout.renderFooter(this.history.size(), this.history.capacity(), this.storagePath);

    // Clear and render viewport
    this.layout.clearViewport();
    this.renderViewport();
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

    // Format all exchanges
    const formatted = exchanges.map((e) => formatExchange(e, this.currentLevel));

    // For level 1, render dots specially
    if (this.currentLevel.value === 1) {
      this.renderDotsInViewport(formatted, regions.viewportHeight, regions.width);
      return;
    }

    // Calculate which exchanges fit in viewport (auto-scroll to newest)
    const visibleLines = this.calculateVisibleLines(formatted, regions.viewportHeight);

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
   * Calculate which lines should be visible, auto-scrolling to show newest.
   */
  private calculateVisibleLines(formatted: FormattedExchange[], viewportHeight: number): string[] {
    // Collect all lines from all formatted exchanges
    const allLines: string[] = [];
    for (const f of formatted) {
      for (const line of f.lines) {
        allLines.push(line);
      }
    }

    // If everything fits, return all
    if (allLines.length <= viewportHeight) {
      return allLines;
    }

    // Auto-scroll: return only the last viewportHeight lines
    return allLines.slice(-viewportHeight);
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
    // Collect all dots (without ANSI codes for counting)
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

    // Auto-scroll: show only last viewportHeight lines
    const visibleDotLines =
      dotLines.length <= viewportHeight ? dotLines : dotLines.slice(-viewportHeight);

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
    this.redraw();
  }
}
