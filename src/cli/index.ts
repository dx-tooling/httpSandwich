/**
 * CLI layer - Command-line interface
 *
 * This layer contains:
 * - CLI entry point
 * - Command parsing and routing
 * - User interaction handling
 *
 * The CLI layer is a thin adapter that translates
 * command-line input into application use cases.
 */

export { parseArguments, getUsage, type CliConfig, type ParseResult } from "./argument-parser.js";
