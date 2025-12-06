import { type HttpExchange } from "../entities/http-exchange.js";

/**
 * Interface for persisting HTTP exchanges.
 * Abstracts storage mechanism for testability.
 */
export interface ExchangeStore {
  /**
   * Store an HTTP exchange.
   * Should be non-blocking (async write).
   */
  save: (exchange: HttpExchange) => Promise<void>;

  /**
   * Get the storage directory path.
   */
  getStorageDir: () => string;
}
