/**
 * Represents the detail level for displaying HTTP exchanges.
 *
 * Levels:
 * 1 - Dot only (.)
 * 2 - Time and status code
 * 3 - Time, status, method, and path
 * 4 - Level 3 + headers (truncated values at 100 chars)
 * 5 - Level 4 + full headers + truncated body (512 chars)
 * 6 - Level 5 + full body
 */
export class DetailLevel {
  public static readonly MIN = 1;
  public static readonly MAX = 6;
  public static readonly DEFAULT = 3;

  private constructor(public readonly value: number) {}

  /**
   * Create a DetailLevel from a number, clamping to valid range.
   */
  public static of(value: number): DetailLevel {
    const clamped = Math.max(DetailLevel.MIN, Math.min(DetailLevel.MAX, Math.floor(value)));
    return new DetailLevel(clamped);
  }

  /**
   * Create the default detail level (3).
   */
  public static default(): DetailLevel {
    return new DetailLevel(DetailLevel.DEFAULT);
  }

  /**
   * Increment the level, capping at MAX.
   */
  public increment(): DetailLevel {
    if (this.value >= DetailLevel.MAX) {
      return this;
    }
    return new DetailLevel(this.value + 1);
  }

  /**
   * Decrement the level, flooring at MIN.
   */
  public decrement(): DetailLevel {
    if (this.value <= DetailLevel.MIN) {
      return this;
    }
    return new DetailLevel(this.value - 1);
  }

  /**
   * Check if this level shows multi-line output (level 4+).
   */
  public isMultiLine(): boolean {
    return this.value >= 4;
  }

  /**
   * Check if this level shows headers (level 4+).
   */
  public showsHeaders(): boolean {
    return this.value >= 4;
  }

  /**
   * Check if this level shows body (level 5+).
   */
  public showsBody(): boolean {
    return this.value >= 5;
  }

  /**
   * Check if this level shows full body (level 6).
   */
  public showsFullBody(): boolean {
    return this.value >= 6;
  }

  public equals(other: DetailLevel): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return `Level ${String(this.value)}`;
  }
}
