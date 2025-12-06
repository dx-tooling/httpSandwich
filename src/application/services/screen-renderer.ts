import { type HttpExchange, type DetailLevel, type TerminalUI } from "@/domain";
import { formatExchange, calculateTotalLines } from "./exchange-formatter.js";
import { type ExchangeHistory } from "./exchange-history.js";
import { AnsiColors } from "@/infrastructure/color-scheme.js";

/**
 * Manages screen rendering for the exchange display.
 * Handles redraw on level change, new exchanges, and terminal resize.
 */
export class ScreenRenderer {
  private currentLevel: DetailLevel;

  public constructor(
    private readonly terminal: TerminalUI,
    private readonly history: ExchangeHistory,
    initialLevel: DetailLevel
  ) {
    this.currentLevel = initialLevel;
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
   * Redraw the entire screen with current exchanges at current level.
   */
  public redraw(): void {
    const { rows } = this.terminal.getSize();
    const exchanges = this.history.getAll();

    // Clear screen and move to home
    this.terminal.clearScreen();

    // Draw header
    this.drawHeader();

    // Calculate available rows for exchanges (minus header)
    const headerLines = 2; // Header + separator
    const availableRows = rows - headerLines;

    if (exchanges.length === 0) {
      this.terminal.writeLine("");
      this.terminal.writeLine(`${AnsiColors.dim}  Waiting for requests...${AnsiColors.reset}`);
      return;
    }

    // Format all exchanges
    const formatted = exchanges.map((e) => formatExchange(e, this.currentLevel));

    // For level 1, we can show dots inline
    if (this.currentLevel.value === 1) {
      this.drawDotsInline(formatted.map((f) => f.lines[0] ?? ""));
      return;
    }

    // Calculate total lines needed
    const totalLines = calculateTotalLines(formatted);

    // If everything fits, show all
    if (totalLines <= availableRows) {
      for (const f of formatted) {
        for (const line of f.lines) {
          this.terminal.writeLine(line);
        }
      }
      return;
    }

    // Auto-scroll: show only the newest that fit
    let linesUsed = 0;
    let startIndex = formatted.length;

    // Work backwards to find how many we can show
    for (let i = formatted.length - 1; i >= 0; i--) {
      const f = formatted[i];
      if (f === undefined) continue;

      if (linesUsed + f.lineCount > availableRows) {
        break;
      }
      linesUsed += f.lineCount;
      startIndex = i;
    }

    // Draw from startIndex to end
    for (let i = startIndex; i < formatted.length; i++) {
      const f = formatted[i];
      if (f === undefined) continue;

      for (const line of f.lines) {
        this.terminal.writeLine(line);
      }
    }
  }

  /**
   * Draw the header with proxy info and current level.
   */
  private drawHeader(): void {
    const levelStr = this.currentLevel.toString();
    const header = `${AnsiColors.bold}Malcolm${AnsiColors.reset} ${AnsiColors.dim}[${levelStr}] +/- to change level, q to quit${AnsiColors.reset}`;
    this.terminal.writeLine(header);
    this.terminal.writeLine("");
  }

  /**
   * Draw dots inline for level 1 (multiple dots per line).
   */
  private drawDotsInline(dots: string[]): void {
    const { cols } = this.terminal.getSize();
    const dotsPerLine = cols - 2; // Leave some margin

    let lineBuffer = "";
    for (const dot of dots) {
      // Strip ANSI codes to count visible chars
      lineBuffer += dot;

      // Check visible length (approximate - each dot is 1 char)
      if (lineBuffer.length >= dotsPerLine * 10) {
        // Rough estimate with ANSI codes
        this.terminal.writeLine(lineBuffer);
        lineBuffer = "";
      }
    }

    // Write remaining dots
    if (lineBuffer.length > 0) {
      this.terminal.write(lineBuffer);
    }
  }

  /**
   * Handle a new exchange being added.
   * Appends to display or redraws if needed.
   */
  public onNewExchange(_exchange: HttpExchange): void {
    // For now, always redraw to handle auto-scroll correctly
    // This could be optimized to append-only when possible
    this.redraw();
  }
}
