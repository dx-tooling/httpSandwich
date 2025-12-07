import { type HttpExchange } from "@/domain";

/**
 * Handler for new exchange events.
 */
export type ExchangeAddedHandler = (exchange: HttpExchange) => void;

/**
 * Circular buffer for storing HTTP exchange history.
 * Keeps the last N exchanges for display and redraw.
 */
export class ExchangeHistory {
  private readonly exchanges: HttpExchange[] = [];
  private readonly maxSize: number;
  private readonly handlers: ExchangeAddedHandler[] = [];

  public constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Add a new exchange to the history.
   * If at capacity, the oldest exchange is removed.
   */
  public add(exchange: HttpExchange): void {
    if (this.exchanges.length >= this.maxSize) {
      this.exchanges.shift(); // Remove oldest
    }
    this.exchanges.push(exchange);

    // Notify handlers
    for (const handler of this.handlers) {
      handler(exchange);
    }
  }

  /**
   * Get all exchanges in chronological order (oldest first).
   */
  public getAll(): readonly HttpExchange[] {
    return this.exchanges;
  }

  /**
   * Get the most recent N exchanges.
   */
  public getRecent(count: number): readonly HttpExchange[] {
    if (count >= this.exchanges.length) {
      return this.exchanges;
    }
    return this.exchanges.slice(-count);
  }

  /**
   * Get an exchange by its index (0-indexed).
   */
  public getByIndex(index: number): HttpExchange | undefined {
    return this.exchanges[index];
  }

  /**
   * Get the number of exchanges in history.
   */
  public size(): number {
    return this.exchanges.length;
  }

  /**
   * Get the maximum capacity.
   */
  public capacity(): number {
    return this.maxSize;
  }

  /**
   * Register a handler to be called when a new exchange is added.
   */
  public onExchangeAdded(handler: ExchangeAddedHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Clear all exchanges from history.
   */
  public clear(): void {
    this.exchanges.length = 0;
  }
}
