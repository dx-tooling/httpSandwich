import type { TerminalUI, TerminalSize, ResizeHandler } from "@/domain";

/**
 * Mock terminal UI for testing.
 * Records all operations for verification.
 */
export class MockTerminalUI implements TerminalUI {
  public readonly operations: string[] = [];
  public readonly writtenText: string[] = [];
  public inAlternateScreen = false;
  public cursorHidden = false;
  public cursorRow = 1;
  public cursorCol = 1;

  private size: TerminalSize = { rows: 24, cols: 80 };
  private resizeHandlers: ResizeHandler[] = [];

  public setSize(rows: number, cols: number): void {
    this.size = { rows, cols };
    for (const handler of this.resizeHandlers) {
      handler(this.size);
    }
  }

  public enterAlternateScreen(): void {
    this.operations.push("enterAlternateScreen");
    this.inAlternateScreen = true;
  }

  public exitAlternateScreen(): void {
    this.operations.push("exitAlternateScreen");
    this.inAlternateScreen = false;
  }

  public clearScreen(): void {
    this.operations.push("clearScreen");
    this.cursorRow = 1;
    this.cursorCol = 1;
  }

  public clearLine(): void {
    this.operations.push(`clearLine@${String(this.cursorRow)}`);
  }

  public moveCursor(row: number, col: number): void {
    this.operations.push(`moveCursor(${String(row)},${String(col)})`);
    this.cursorRow = row;
    this.cursorCol = col;
  }

  public moveCursorHome(): void {
    this.operations.push("moveCursorHome");
    this.cursorRow = 1;
    this.cursorCol = 1;
  }

  public write(text: string): void {
    this.operations.push(`write:${text.substring(0, 30)}`);
    this.writtenText.push(text);
  }

  public writeLine(text: string): void {
    this.operations.push(`writeLine:${text.substring(0, 30)}`);
    this.writtenText.push(text + "\n");
    this.cursorRow++;
    this.cursorCol = 1;
  }

  public getSize(): TerminalSize {
    return this.size;
  }

  public onResize(handler: ResizeHandler): void {
    this.resizeHandlers.push(handler);
  }

  public hideCursor(): void {
    this.operations.push("hideCursor");
    this.cursorHidden = true;
  }

  public showCursor(): void {
    this.operations.push("showCursor");
    this.cursorHidden = false;
  }

  public clear(): void {
    this.operations.length = 0;
    this.writtenText.length = 0;
  }
}
