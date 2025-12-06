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

// Ports (interfaces)
export type { OutputWriter } from "./ports/output-writer.js";
