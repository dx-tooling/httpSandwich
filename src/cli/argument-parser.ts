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
 * Check if a value is missing or looks like a flag.
 * For dashed args, any value starting with "-" is considered a flag.
 * For non-dashed args (between/and), we're more lenient.
 */
function isMissingValue(value: string | undefined, isDashedArg: boolean): boolean {
  if (value === undefined) return true;
  if (isDashedArg && value.startsWith("-")) return true;
  // For non-dashed "and", the value could be a keyword we should not consume
  if (!isDashedArg && (value === "and" || value === "between")) return true;
  return false;
}

/**
 * Parse CLI arguments into a typed configuration.
 *
 * Supported formats:
 *   httpSandwich between <port> and <host:port> [options]
 *   httpSandwich --between <port> --and <host:port> [options]
 *   httpSandwich --from <port> --to <host:port> [options]
 *
 * All forms can be mixed (e.g., "between 8000 --and localhost:5009").
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

    // Handle "from" arguments: --from, --between, between
    if (arg === "--from" || arg === "--between") {
      if (isMissingValue(nextArg, true)) {
        return { ok: false, error: `Missing value for ${arg}` };
      }
      fromValue = nextArg;
      i++; // Skip next arg since we consumed it
    } else if (arg === "between") {
      if (isMissingValue(nextArg, false)) {
        return { ok: false, error: "Missing value for between" };
      }
      fromValue = nextArg;
      i++; // Skip next arg since we consumed it
    }
    // Handle "to" arguments: --to, --and, and
    else if (arg === "--to" || arg === "--and") {
      if (isMissingValue(nextArg, true)) {
        return { ok: false, error: `Missing value for ${arg}` };
      }
      toValue = nextArg;
      i++; // Skip next arg since we consumed it
    } else if (arg === "and") {
      if (isMissingValue(nextArg, false)) {
        return { ok: false, error: "Missing value for and" };
      }
      toValue = nextArg;
      i++; // Skip next arg since we consumed it
    }
    // Handle other options
    else if (arg === "--level") {
      if (isMissingValue(nextArg, true)) {
        return { ok: false, error: "Missing value for --level" };
      }
      levelValue = nextArg;
      i++; // Skip next arg since we consumed it
    } else if (arg === "--history") {
      if (isMissingValue(nextArg, true)) {
        return { ok: false, error: "Missing value for --history" };
      }
      historyValue = nextArg;
      i++; // Skip next arg since we consumed it
    }
  }

  if (fromValue === undefined) {
    return { ok: false, error: "Missing required argument: between <port> (or --from)" };
  }

  if (toValue === undefined) {
    return { ok: false, error: "Missing required argument: and <host:port> (or --to)" };
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
  return `Usage: httpSandwich between <port> and <host:port> [options]
       httpSandwich --from <port> --to <host:port> [options]

Arguments:
  between, --from, --between <port>     Local port to listen on (required)
  and, --to, --and <host:port>          Target address to proxy to (required)

Options:
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
  httpSandwich between 8000 and 5009
  httpSandwich between 8000 and localhost:5009 --level 1
  httpSandwich --from 8000 --to 192.168.1.5:80 --history 50`;
}
