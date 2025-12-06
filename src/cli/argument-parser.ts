import { Address, DetailLevel } from "@/domain";

/**
 * Configuration parsed from CLI arguments.
 */
export interface CliConfig {
  readonly from: Address;
  readonly to: Address;
  readonly level: DetailLevel;
  readonly historySize: number;
}

/**
 * Result of parsing CLI arguments.
 */
export type ParseResult =
  | { readonly ok: true; readonly config: CliConfig }
  | { readonly ok: false; readonly error: string };

/**
 * Parse CLI arguments into a typed configuration.
 *
 * Expected format:
 *   malcolm --from <port> --to <host:port> [--level <1-6>] [--history <n>]
 *
 * @param args - Array of CLI arguments (typically process.argv.slice(2))
 */
export function parseArguments(args: readonly string[]): ParseResult {
  let fromValue: string | undefined;
  let toValue: string | undefined;
  let levelValue: string | undefined;
  let historyValue: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    if (arg === "--from") {
      if (nextArg === undefined || nextArg.startsWith("-")) {
        return { ok: false, error: "Missing value for --from" };
      }
      fromValue = nextArg;
      i++; // Skip next arg since we consumed it
    } else if (arg === "--to") {
      if (nextArg === undefined || nextArg.startsWith("-")) {
        return { ok: false, error: "Missing value for --to" };
      }
      toValue = nextArg;
      i++; // Skip next arg since we consumed it
    } else if (arg === "--level") {
      if (nextArg === undefined || nextArg.startsWith("-")) {
        return { ok: false, error: "Missing value for --level" };
      }
      levelValue = nextArg;
      i++; // Skip next arg since we consumed it
    } else if (arg === "--history") {
      if (nextArg === undefined || nextArg.startsWith("-")) {
        return { ok: false, error: "Missing value for --history" };
      }
      historyValue = nextArg;
      i++; // Skip next arg since we consumed it
    }
  }

  if (fromValue === undefined) {
    return { ok: false, error: "Missing required argument: --from <port>" };
  }

  if (toValue === undefined) {
    return { ok: false, error: "Missing required argument: --to <host:port>" };
  }

  try {
    const from = Address.parse(fromValue);
    const to = Address.parse(toValue);

    // Parse level (default: 3)
    let level = DetailLevel.default();
    if (levelValue !== undefined) {
      const levelNum = parseInt(levelValue, 10);
      if (isNaN(levelNum) || levelNum < DetailLevel.MIN || levelNum > DetailLevel.MAX) {
        return {
          ok: false,
          error: `Invalid level: ${levelValue}. Must be between ${String(DetailLevel.MIN)} and ${String(DetailLevel.MAX)}`,
        };
      }
      level = DetailLevel.of(levelNum);
    }

    // Parse history size (default: 100)
    let historySize = 100;
    if (historyValue !== undefined) {
      const historyNum = parseInt(historyValue, 10);
      if (isNaN(historyNum) || historyNum < 1) {
        return {
          ok: false,
          error: `Invalid history size: ${historyValue}. Must be a positive number`,
        };
      }
      historySize = historyNum;
    }

    return { ok: true, config: { from, to, level, historySize } };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

/**
 * Get usage help text.
 */
export function getUsage(): string {
  return `Usage: malcolm --from <port> --to <host:port> [options]

Options:
  --from <port>       Local port to listen on (required)
  --to <host:port>    Target address to proxy requests to (required)
  --level <1-6>       Starting detail level (default: 3)
  --history <n>       Max requests to keep in history (default: 100)

Detail Levels:
  1 - Dots only
  2 - Time and status code
  3 - Time, status, method, and path (default)
  4 - Level 3 + headers (truncated values)
  5 - Level 4 + full headers + truncated body
  6 - Level 5 + full body

Interactive Controls:
  +/=  Increase detail level
  -/_  Decrease detail level
  q    Quit

Examples:
  malcolm --from 8000 --to 5009
  malcolm --from 8000 --to localhost:5009 --level 1
  malcolm --from 8000 --to 192.168.1.5:80 --history 50`;
}
