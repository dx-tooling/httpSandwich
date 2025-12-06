/**
 * Domain layer - Core business logic, interfaces, and entities
 *
 * This layer contains:
 * - Domain entities and value objects
 * - Port interfaces (for dependency inversion)
 * - Business rules and invariants
 *
 * The domain layer has NO external dependencies.
 */

// Value Objects
export { Address } from "./value-objects/address.js";
export { DetailLevel } from "./value-objects/detail-level.js";
export { HttpStatusCategory, categorizeStatus } from "./value-objects/http-status-category.js";

// Entities
export {
  type HttpExchange,
  type HttpRequest,
  type HttpResponse,
  createHttpExchange,
} from "./entities/http-exchange.js";

// Ports (interfaces)
export type { OutputWriter } from "./ports/output-writer.js";
export type { TerminalUI, TerminalSize, ResizeHandler } from "./ports/terminal-ui.js";
export type { KeyboardInput, KeyPressHandler } from "./ports/keyboard-input.js";
export type { ExchangeStore } from "./ports/exchange-store.js";
